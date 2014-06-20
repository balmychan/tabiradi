var EventBase = require("./EventBase");

/**
* Arduino擬似クラス
*/
var Arduino = function (stream) {
	var self = this;
	this.stream = stream;
	this.picture = null;
	stream.setKeepAlive(true);
	stream.addListener("data", function(data){
		self._streamData(data);
	});
	stream.addListener("end", function() {
		console.log("end");
		self._streamEnd();
	});
	stream.addListener("error", function() {
		console.log("error");
	});
	stream.addListener("close", function() {
		console.log("close");
		self._streamEnd();
	});
};

Arduino.MessageType = {
	CONNECT 		: 1,
	PICTURE_START	: 2,
	PICTURE_DATA	: 3,
	PICTURE_END		: 4
};

var p = Arduino.prototype = new EventBase.EventBase();

// 受信用バッファ
var receiving;
var messageType;
var buf;
var messageSize
var receivedSize;
var timer;
clearReceiveData();

/**
* 受信用データを初期化
*/
function clearReceiveData() {
	receiving	= false;
	type		= 0;
	buf			= null;
	messageSize = -1;
	receivedSize= 0;
	if ( timer ) clearTimeout(timer);
	timer = null;
}
	
/**
* メッセージがきたとき
*/
p._streamData = function(data) {
	var self = this;
	
	// 受信中でない場合は、メッセージの最初なので、種類を取り出す
	if ( !receiving ) {
		type = data[0];
		data = data.slice(1, data.length);
		receiving = true; // 受信中に設定
	}
	
	// 受信中なのに、サイズが無い場合は、サイズを取り出す
	if ( receiving && messageSize == -1 ) {
		if ( data.length < 2 )
			throw new Error("messageSizeが取得できません");
		messageSize = (data[0] << 8) + (data[1] & 255);
		data = data.slice(2, data.length);
	}
	
	// データを取り出す
	if ( receiving ) {
		if ( !buf ) buf = new Buffer(messageSize);
		// メッセージサイズまでか、データの小さいほうまで
		var copySize = Math.min((messageSize - receivedSize), data.length);
		// 受信したデータをバッファにコピー
		data.copy(buf, receivedSize, 0, copySize);
		receivedSize += copySize;
		data = data.slice(copySize, data.length);
	}
	
	// 受信が完了したかを判定する
	if ( messageSize != -1 && messageSize <= receivedSize ) {
		// メッセージの受信が完了したので、投げる
		this._streamMessage(type, buf);
		clearReceiveData();
		if ( 0 < data.length ) {
			// 再帰処理時のデータタイプが、正常なら処理する。おかしければ、もう破棄
			if ( data[0] == Arduino.MessageType.CONNECT || 
				 data[1] == Arduino.MessageType.PICTURE_DATA ) {
				this._streamData(data);
			}
		}
		return;
	}
	updateTimer();
	
	// 5秒以内に次のデータがこなければ、なくなったと見なす
	// これを呼べば、また再び5秒もらえる
	function updateTimer() {
		if ( timer ) {
			clearTimeout(timer);
			timer = null;
		}
		else {
			timer = setTimeout(function(){
				clearReceiveData();
			}, 5000);
		}
	}
};

/**
* メッセージを受信
*/
p._streamMessage = function(type, data) {
	// 接続時
	if ( type == Arduino.MessageType.CONNECT ) {
		this.mac = data.toString();
		this.trigger("connected", [this]);
		this.accept();
	}
	// 画像データ（現仕様だと、画像の送信はHTTPベースになったのでこないはずだが、一応残している
	else if ( type == Arduino.MessageType.PICTURE_DATA ) {
		this.picture = data;
		this.trigger("pictureReceived", [this]);
	}
};

/**
* 通信が終了
*/
p._streamEnd = function() {
	this.stream.destroy();
	this.stream = null;
	this.trigger("close", [this]);
};

/**
* Macアドレスを返す
*/
p.getMac = function() {
	return this.mac;
};

/**
* 接続を承認
*/
p.accept = function() {
	if ( this.stream )
		this.stream.write("a");
};

/**
* 前進
*/
p.forward = function() {
	console.log("forward");
	if ( this.stream )
		this.stream.write("f");
};

/**
* 後退
*/
p.back = function() {
	console.log("back");
	if ( this.stream )
		this.stream.write("b");
};

/**
* 右前進
*/
p.rightForward = function() {
	console.log("right");
	if ( this.stream )
		this.stream.write("r");
};

/**
* 左前進
*/
p.leftForward = function() {
	console.log("left");
	if ( this.stream )
		this.stream.write("l");
};

/**
* ピッピー
*/
p.pi = function() {
	if ( this.stream )
		this.stream.write("p");
};

/**
* 停止
*/
p.stop = function() {
	console.log("stop");
	if ( this.stream )
		this.stream.write("s");
};

/**
* 接続をとぎらせないための信号
*/
p.ping = function() {
	console.log("ping");
	if ( this.stream )
		this.stream.write("g");
};

/**
* ファクトリー
*/
exports.create = function(stream) {
	return new Arduino(stream);
};