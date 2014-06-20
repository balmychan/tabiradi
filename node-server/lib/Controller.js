var EventBase = require("./EventBase");

/**
* コントローラー擬似クラス
*/
var Controller = function (socket, server) {
	var self = this;
	this.arduino = null;
	this.socket = socket;
	this.server = server;
	this.handlers = {};
	this.socket.on("message", function(data) {
		self.onMessage(data.message);
	});
	this.socket.on("queue", function(data) {
		self.onQueue(data);
	});
	this.socket.on("tsubuyaki", function(data) {
		self.onTsubuyaki(data.message);
	});
	this.socket.on("disconnect", function(data) {
		console.log("disconnect");
		self.socket = null;
		self.detach();
		self.close();
	});
};
var p = Controller.prototype = new EventBase.EventBase();

/**
* Arduinoにアタッチする
*/
p.attach = function(arduino) { 
	var self = this;
	this.arduino = arduino;
	this.arduino.attached = true;
	this.sendMessage("attach", {
		time : "60"
	});
	var restTime = 60000;
	this.timer = setTimeout(function() {
		self.detach();
	}, restTime);
	return this;
};

/**
* Arduinoをデタッチする
*/
p.detach = function() {
	if ( this.arduino ) {
		this.sendMessage("detach");
		this.trigger("detach", [this, this.arduino]);
		if ( this.timer ) {
			clearTimeout(this.timer);
			this.timer = null;
		}
		this.arduino.stop();
		this.arduino.attached = false;
		this.arduino = null;
	}
	return this;
};

/**
* メッセージを送信する
*/
p.sendMessage = function(type, message) {
	if ( !this.socket ) return;
	message = message || {};
	this.socket.emit(type, message);
};

/**
* リストを送る
*/
p.sendQueueList = function(queueList) {
	if ( !this.socket ) return;
	var sendList = [];
	for(var i=0; i < queueList.length; i++) {
		sendList.push({
			name : queueList[i].name || "（無名）"
		});
	}
	this.socket.emit("queue", {
		queueList : sendList
	});
};

/**
* プレイヤーを送る
*/
p.sendPlayer = function(player) {
	if ( !this.socket ) return;
	player = player || {};
	player.name = player.name || "（無名）";
	sendPlayer = { name : player.name };
	this.socket.emit("player", {
		player : sendPlayer
	});
};

/**
* プレイヤーを削除
*/
p.clearPlayer = function() {
	if ( !this.socket ) return;
	// クライアント側にclearPlayerほげほげは用意してないので、空の名前で代用
	this.socket.emit("player", {
		player : { name : "" }
	});
};

/**
* つぶやきを送信
*/
p.sendTsubuyaki = function(tsubuyaki) {
	if ( !this.socket ) return;
	tsubuyaki = tsubuyaki || { "message" : "" };
	this.socket.emit("tsubuyaki", { "message" : tsubuyaki });
};

/**
* 接続中かどうかを返す
*/
p.connected = function() {
	return (this.socket) ? true : false;
};

/**
* 閉じる
*/
p.close = function() {
	this.trigger("close" [this]);
};

/**
* メッセージが届いたとき
* アタッチしているArduinoを操作する
*/
p.onMessage = function(message) {
	// Arduinoへのメッセージ
	if ( !this.arduino ) return;
	if ( message == "f" ) {
		this.arduino.forward();
	}
	else if ( message == "b" ) {
		this.arduino.back();
	}
	else if ( message == "r" ) {
		this.arduino.rightForward();
	}
	else if ( message == "l" ) {
		this.arduino.leftForward();
	}
	else if ( message == "p" ) {
		this.arduino.pi();
	}
	else if ( message == "s" ) {
		this.arduino.stop();
	}
};

/**
* キューが届いたとき
*/
p.onQueue = function(data) {
	this.name = data.name;
	console.log("invokeQueue:" + this.name);
	this.trigger("invokeQueue", [this]);
};

/**
* つぶやきが届いたとき
*/
p.onTsubuyaki = function(tsubuyaki) {
	this.trigger("tsubuyaki", [this, tsubuyaki]);
};

/**
* ファクトリー
*/
exports.create = function(socket, server) {
	return new Controller(socket, server);
};