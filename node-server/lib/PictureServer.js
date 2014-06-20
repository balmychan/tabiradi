var	sys		= require("sys"),
	http	= require("http"),
	io		= require("socket.io"),
	fs		= require("fs"),
	EventBase = require("./EventBase");

/**
* PictureServerを生成するファクトリ
*/
exports.createServer = function() {
	var server = new PictureServer();
	return server;
};

////////////////////////////////////////////
// public
////////////////////////////////////////////

/**
* 画像の制御サーバー
*/
var PictureServer = function () {
	this.options = {
		port 			: 8800,
		pictureFilePath	: "/var/www/html/picture.jpg"
	};
	this.clientList = [];
};
var p = PictureServer.prototype = new EventBase.EventBase();


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
	}).listen(self.options.port);
	var socket = io.listen(httpServer, {
		log : false
	});
	socket.on("connection", function(socket) {
		self._clientConnected(socket);
	});
	
	return self;
};

////////////////////////////////////////////
// event handler
////////////////////////////////////////////

var receiving = false;

/**
* HTTPのリクエスト時
*/
p._httpRequest = function(req, res) {
	var self = this;
	//　GETの場合は、画像データを返す
	if( req.method == "GET" ) {
		res.writeHead(200, { "Content-Type" : "image/jpeg" });
		var read  = fs.createReadStream(self.getPictureFilePath());
		sys.pump(read, res);
	}
	// POSTの場合は、画像データを保存する
	else if ( req.method == "POST" ) {
		if ( receiving ) return;
		receiving = true;
		var dataList = [];
		req.on('data', function (data) {
        	dataList.push(data);
        });
        req.on("end", function() {
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
			res.writeHead(200, { "Content-Type" : "plain/text" });
			res.end('Picutre Updated!!\n');
        	receiving = false;
 			self.emitUpdated();
        });
	}
};


/**
* 画像クライアントが接続してきた
*/
p._clientConnected = function(socket) {
	var self = this;
	socket.on("disconnect", function() {
		self.removeClient(socket);
	});
	this.addClient(socket);
};

/**
* クライアントをリストに追加する
*/
p.addClient = function(client) {
	this.clientList.push(client);
};

/**
* クライアントをリストから削除する
*/
p.removeClient = function(client) {
	for(var i=0; i < this.clientList.length; i++) {
		if ( client == this.clientList[i] ) {
			this.clientList.splice(i, 1);
			break;
		}
	}
};

/**
* 画像が更新されたことを通知する
*/
p.emitUpdated = function() {
	for(var i=0; i < this.clientList.length; i++) {
		this.clientList[i].emit("message", { message : "updated" });
	}
};

////////////////////////////////////////////
// common method
////////////////////////////////////////////

/**
* 画像を保存する
*/
p.savePicture = function(data) {
	// ToDo:ここを非同期にするなどして、落ちないようにする
	// ToDo:落ちたときに、自動で再起動するようにする
	var wStream = fs.createWriteStream(this.getPictureFilePath());
	wStream.on("drain", function() {
		console.log("savePicture drain");
//		wStream.write(data);
	});
	wStream.on("error", function() {
		console.log("savePicture error");
	});
	wStream.end(data);
};

/**
* 画像ファイルのパスを返す
*/
p.getPictureFilePath = function() {
	return this.options.pictureFilePath;
};
