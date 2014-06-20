var	sys		= require("sys"),
	http	= require("http"),
	net		= require("net"),
	io		= require("socket.io"),
	fs		= require("fs"),
	EventBase	= require("./EventBase"),
	Controller 	= require("./Controller"),
	Arduino		= require("./Arduino");

/**
* WebRadiconControllServerを生成するファクトリ
*/
exports.createServer = function() {
	var server = new WebRadiconServer();
	return server;
};

/**
* Webラジコンのコントローラー側のサーバー
*/
var WebRadiconServer = function () {
	this.options = {
		controllerPort 	: 8080,
		arduinoPort 	: 3000,
		ip	 			: "localhost",
		queueMatchingInterval : 1000 // キューのマッチングのチェック間隔（ミリ秒）
	};
	// socket.ioのオプション
	this.socketIOOptions = {
		log : false
	};
	this.arduinoList = [];
	this.queueList = [];
	this.controllerList = [];
};
var p = WebRadiconServer.prototype = new EventBase.EventBase();

////////////////////////////////////////////
// public
////////////////////////////////////////////

/**
* サーバー待機の開始
*/
p.listen = function(options) {
	var self = this;
	if ( options ) {
		for (key in options)
			self.options[key] = options[key] || self.options[key];
	}
	// HTMLからの接続先を準備
	var httpServer = http.createServer(function(res, req) {
		self._httpRequest(res, req);
	}).listen(options.controllerPort);
	var socket = io.listen(httpServer, self.socketIOOptions);
	socket.on("connection", function(socket) {
		self._controllerConnected(socket);
	});
	// Arduinoからの接続先を準備
	var adServer = net.createServer(function(stream) {
		self._arduinoConnected(stream);
	}).listen(self.options.arduinoPort, self.options.ip);
	adServer.on("error", function(e) {
		console.log(e.message);
		setTimeout(function() {
			adServer.close();
			adServer.listen(self.options.arduinoPort, self.options.ip);
		});
	});
	setInterval(function() {
		self.queueMatching();
	}, self.options.queueMatchingInterval);
	return self; 
};
	
////////////////////////////////////////////
// event handler
////////////////////////////////////////////

/**
* コントローラーが接続してきた
*/
p._controllerConnected = function(socket) {
	console.log("joined controller");
	var self = this;
	var controller = Controller.create(socket, self);
	controller.on("invokeQueue", function(controller) {
		self.addQueueList(controller);
		self.sendQueueListToAll();
	});
	controller.on("tsubuyaki", function(controller, tsubuyaki) {
		self.sendTsubuyakiToAll(tsubuyaki);
	});
	controller.on("close", function(controller) {
		var hasQueue = self.hasQueueList(controller);
		self.removeQueueList(controller);
		self.removeControllerList(controller);
		if ( hasQueue ) {
			self.sendQueueListToAll();
		}
	});
	controller.on("detach", function(controller) {
		self.clearPlayerToAll();
	});
	controller.sendQueueList(this.queueList);
	this.addControllerList(controller);
};

/**
* Arduinoが接続してきた
*/
p._arduinoConnected = function(stream) {
	var self = this;
	var arduino = Arduino.create(stream);
	console.log("connected arduino…");
	// 接続が途切れないように、30秒ごとに信号を送る
	var timer = setInterval(function() {
		arduino.ping();
	}, 30000);
	
	arduino.on("connected", function() {
		console.log("joined arduino : " + arduino.mac + "\n");
		self.addArduinoList(arduino);
		console.log("total arduino : " + self.numArduinoList());
	});
	arduino.on("pictureReceived", function() {
		var data = arduino.picture;
		self.savePicture(data); 
	});
	arduino.on("close", function() {
		console.log("close arduino : " + arduino.mac);
		self.removeArduinoList(arduino);
		if ( timer ) {
			clearInterval(timer);
		}
	});
	
};

var receiving = false;

/**
* HTTPのリクエスト時
*/
p._httpRequest = function(req, res) {	
	var self = this;
	if( req.method == "GET" ) {
		res.writeHead(200, { "Content-Type" : "image/jpeg" });
		var read  = fs.createReadStream("./appa.jpg");
		sys.pump(read, res);
	}
	else if ( req.method == "POST" ) {
		if ( receiving ) return;
		
		receiving = true;
		var dataList = [];
		//console.log("body length=" + req.body.length);
		req.on('data', function (data) {
        	//body +=data;
        	dataList.push(data);
        });
        req.on("end", function() {
//        	console.log("endData!!");
        	var size = 0;
        	for(var i=0; i < dataList.length; i++) {
        		size += dataList[i].length;
        	}
        	var jpegData = new Buffer(size);
        	var address = 0;
        	for(var i=0; i < dataList.length; i++) {
				var data = dataList[i];
				data.copy(jpegData, address, 0, data.length);
				address += data.length;
        	}
			self.savePicture(jpegData);
        	dataList = [];
        	receiving = false;
			res.writeHead(200, { "Content-Type" : "plain/text" });
			res.end('Picutre Updated!!\n');
        });
	}
};

////////////////////////////////////////////
// common method
////////////////////////////////////////////

/**
* 画像を保存する
*/
p.savePicture = function(data) {
//	console.log("data-size=" + data.length);
	var wStream = fs.createWriteStream('./appa.jpg');
	wStream.write(data);
};

/**
* コントローラーをキュー待ちに追加する
*/
p.addQueueList = function(controller) { 
	for(var i=0; i < this.queueList.length; i++) {
		if ( controller == this.queueList[i] ) {
			console.log("既にキュー待ち中です");
			return;
		}
	}
	this.queueList.push(controller);
};

/**
* コントローラーをキュー待ちから除外する
*/
p.removeQueueList = function(controller) {
	this.__queueRemoving__ = true;
	for(var i=0; i < this.queueList.length; i++) {
		if ( controller == this.queueList[i] ) {
			this.queueList.splice(i, 1);
			return;
		}
	}
	this.__queueRemoving__ = false;
};

/**
* コントローラーがキューに入っているかどうかを判定して返す
*/
p.hasQueueList = function(controller) {
	for(var i=0; i < this.queueList.length; i++) {
		if ( controller == this.queueList[i] ) {
			return true;
		}
	}
	return false;
};

/**
* キューを取得する
*/
p.getQueueList = function() {
	return this.queueList;
};

/**
* キューあるかどうかを返す
*/
p.hasQueue = function() {
	return ( 0 < this.queueList.length ) ? true : false;
};

/**
* すべてのコントローラーにつぶやきを送信する
*/
p.sendTsubuyakiToAll = function(tsubuyaki, controller) {
	console.log("全員につぶやきを送信しました:" + tsubuyaki);
	for(var i=0; i < this.controllerList.length; i++) {
		this.controllerList[i].sendTsubuyaki(tsubuyaki);
	}
};

/**
* 全員に現在のプレイヤーとキューを通知する
*/
p.sendQueueListToAll = function() {
	for(var i=0; i < this.controllerList.length; i++) {
		this.controllerList[i].sendQueueList(this.queueList);
	}
};

/**
* 全員に現在のプレイヤーを通知する
*/
p.sendPlayerToAll = function(player) {
	for(var i=0; i < this.controllerList.length; i++) {
		this.controllerList[i].sendPlayer(player);
	}
}

/**
* 全員に現在のプレイヤーを削除する
*/
p.clearPlayerToAll = function() {
	for(var i=0; i < this.controllerList.length; i++) {
		this.controllerList[i].clearPlayer();
	}
}

/**
* コントローラーリストに追加する
*/
p.addControllerList = function(controller) {
	for(var i=0; i < this.controllerList.length; i++) {
		if ( controller == this.controllerList[i] )
			return;
	}
	this.controllerList.push(controller);
};

/**
* コントローラーリストから除外する
*/
p.removeControllerList = function(controller) {
	var target;
	for(var i=0; i < this.controllerList.length; i++) {
		if ( controller == this.controllerList[i] ) {
			controller.detach();
			this.controllerList.splice(i, 1);
			break;
		}	
	}
};

/**
* コントローラーの数を返す
*/
p.numController = function() {
	return this.controllerList.length;
};

/**
* Arduinoをリストに追加する
*/
p.addArduinoList = function(arduino) {
	// 同じmacアドレスのarduinoがあったら、それは削除する
	var mac = arduino.getMac();
	var removeList = [];
	for(var i=0; i < this.arduinoList.length; i++) {
		if ( mac == this.arduinoList[i].getMac() ) {
			removeList.push(this.arduinoList[i]);
		}
	}
	for(var i=0; i < removeList.length; i++) {
		this.removeArduinoList(removeList[i]);
	}
	this.arduinoList.push(arduino);
};

/**
* Arduinoをリストから削除する
*/
p.removeArduinoList = function(arduino) {
	var target = null;
	for(var i=0; i < this.arduinoList.length; i++) {
		if ( this.arduinoList[i] == arduino ) {
			this.arduinoList.splice(i, 1);
			this.detachArduino(arduino);
			break;
		}
	}
};

/**
* 指定されたArduinoを持つコントローラーがあれば、detachする
*/
p.detachArduino = function(arduino) {
	for(var i=0; i < this.queueList.length; i++) {
		var controller = this.queueList[i];
		if ( controller.arduino == arduino ) {
			controller.detach();
			break;
		}
	}
}

/**
* Arduinoの数を返す
*/
p.numArduinoList = function() {
	return this.arduinoList.length;
}

/**
* Arduinoがリストにあるかどうかを返す
*/
p.hasArduino = function() {
	return ( 0 < this.arduinoList.length ) ? true : false;
};

/**
* キュー待ちのコントローラーがあったら、Arduinoにアタッチする
*/
p.queueMatching = function() {
	var self = this;
	if ( !this.hasQueue() || this.__queueRemoving__ ) return;
	for(var i=0; i < this.arduinoList.length; i++) {
		var arduino = this.arduinoList[i];
		if ( !arduino.attached ) {
			var controller = this.queueList.shift();
			controller.attach(arduino);
			self.sendPlayerToAll(controller);
			self.sendQueueListToAll();
			break;
		}
	}	
};