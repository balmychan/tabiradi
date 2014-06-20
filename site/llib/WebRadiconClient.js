/**
* Webラジコンサーバーの擬似クラス
*/
var WebRadiconClient = function() {
	this.socket = null;
};

////////////////////////////////////////////////////////
// static value/method
////////////////////////////////////////////////////////

WebRadiconClient.options = {
	// 接続するサーバーURL
	SERVER_URL : "http://tabiradi.jp:8080"
};

// Webラジコンサーバーに接続する
WebRadiconClient.connect = function(callbacks) {
	var webRadiconClient = new WebRadiconClient();
	webRadiconClient.connect(callbacks);
};

////////////////////////////////////////////////////////
// member value/method
////////////////////////////////////////////////////////

WebRadiconClient.prototype = {
	
	// メッセージを送る
	sendMessage : function(message) {
		this._socket.emit("message", { "message" : message });
	},
	
	// キューを送る
	sendQueue : function(data) {
		this._socket.emit("queue", data);
	},
	
	// つぶやきを送る
	sendTsubuyaki : function(message) {
		this._socket.emit("tsubuyaki", { "message" : message });
	},
	
	// サーバーのURLを返す
	getServerUrl : function() {
		return WebRadiconClient.options.SERVER_URL;
	},

	// サーバーに接続する
	connect : function(callbacks) {
		var self = this;
		var socket = self._socket = io.connect( this.getServerUrl() );
		if ( !socket ) {
			if ( callbacks && callbacks.error )
				callbacks.error();
			return;
		}
		socket.on("attach", function(data) {
			if ( callbacks && callbacks.attached ) {
				var webRadicon = new WebRadicon(socket, WebRadiconClient.options);
				callbacks.attached(webRadicon, data.time);
			}
		});
		socket.on("detach", function() {
			if ( callbacks && callbacks.detached ) {
				callbacks.detached();
			}
		});
		socket.on("tsubuyaki", function(data) {
			if ( callbacks && callbacks.tsubuyaki ) {
				callbacks.tsubuyaki(data.message);
			}
		});
		socket.on("player", function(data) {
			if ( callbacks && callbacks.player )
				callbacks.player(data.player);
		});
		socket.on("queue", function(data) {
			if ( callbacks && callbacks.queue )
				callbacks.queue(data.queueList);
		});
		socket.on("disconnect", function() {
			if ( callbacks && callbacks.close )
				callbacks.close();
		});
		if ( callbacks && callbacks.connected )
			callbacks.connected(self);
	},
	
	// キューに登録
	queue : function(name) {
		this.sendQueue({ name : name });
	}
};