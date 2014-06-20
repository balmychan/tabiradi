/**
* Webラジコンの擬似クラス
*/
var WebRadicon = function(socket, options) {
	this.socket = socket || null;
	this.options = options || {};
};

WebRadicon.prototype = {

////////////////////////////////////////////////////////
// common method
////////////////////////////////////////////////////////
	
	// メッセージを送る
	sendMessage : function(message) {
		this.socket.emit("message", { "message" : message });
	},
		
////////////////////////////////////////////////////////
// radicon info
////////////////////////////////////////////////////////
	
	// 現在ラジコンが写している画像のURLを返す
	getCurrentImageUrl : function() {
		return this.options.SERVER_URL + "?_timestamp=" + new Date().getTime();
	},
	
////////////////////////////////////////////////////////
// controll radicon
////////////////////////////////////////////////////////
	
	// サーバー側のWebラジコンとつなぐ
	join : function(success) {
		this.sendMessage("j");
		this.socket.on("joined", function() {
			this.socket.on("joined", null);
			success();
		});
	},
		
	// 前進
	forward : function() {
		this.sendMessage("f");
	},
		
	// 後退
	back : function() {
		this.sendMessage("b");
	},
	
	// 右前進
	rightForward : function() {
		this.sendMessage("r");
	},
	
	// 左前進
	leftForward : function() {
		this.sendMessage("l");
	},
	
	// ピッピー
	pi : function() {
		this.sendMessage("p");
	},
	
	// キュー
	queue : function() {
		this.sendMessage("q");
	},
	
	// 停止
	stop : function() {
		this.sendMessage("s");
	}
};