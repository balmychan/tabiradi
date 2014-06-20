#include <WebController.h>

//////////////////////////////////
/// static
//////////////////////////////////

byte* WebController::_mac;

String WebController::getMacString() {
	if ( !_mac ) return "";
	String result = "";
	for(int i=0; i < 6; i++) {
		String some = String(_mac[i], HEX);
		int length	= some.length();
		if ( length == 0 || length == 1 ) {
			for(int j=0; j < (2 - length); j++)
				some = "0" + some;
		}
		result += (( 0 < i ) ? ":" : "" ) + some;
	}
	return result;
}

void WebController::begin(byte mac[], byte ip[]) {
	Ethernet.begin(mac, ip);
	_mac = mac;
}

void WebController::begin(byte mac[]) {
	Serial.println("begin");
	Ethernet.begin(mac);
	Serial.println("begincomplete");
	_mac = mac;
}

WebController* WebController::create(byte ip[], int port, int rxPin, int txPin) {
	WebController* con = new WebController(ip, port, rxPin, txPin);
	return con;
}

WebController* WebController::create(byte ip[], int port) {
	WebController* con = new WebController(ip, port);
	return con;
}

void WebController::destroy(WebController* wc) {
	delete wc;
}

//////////////////////////////////
/// member
//////////////////////////////////

WebController::WebController(byte ip[], int port) {
	Serial.println("create WebController");
	_ip = ip;
	_port = port;
	currentState = NONE;
	_accepted = false;
}
	
WebController::WebController(byte ip[], int port, int rxPin, int txPin) {
		Serial.println("create2 WebController");
	_ip = ip;
	_port = port;
	currentState = NONE;
	_rxPin = rxPin;
	_txPin = txPin;
	_accepted = false;
	_cameraSerial = new SoftwareSerial(rxPin, txPin);
	_cameraSerial->begin(38400);
	_camera = new JPEGCamera(*(_cameraSerial));
//  この設定は、EEPROMに書かれるらしく、一回で良いみたいなのでコメントアウト
//	if( _camera->imageSize(JPEGCamera::IMG_SZ_160x120) == false ) {
//	}
	if( _camera->reset() == false ) {
	}
}

WebController::~WebController() {

}

boolean WebController::connect() {
	boolean result = _client.connect(_ip, _port);
	if (!result) return result;
	
	// 接続成功したら、macアドレスを送って識別
	char mac[18];
	WebController::getMacString().toCharArray(mac, sizeof(mac));
	sendMessage(CONNECT, sizeof(mac));
	sendData((unsigned char*)mac, sizeof(mac));
}

boolean WebController::connected() {
	return _client.connected();
}

void WebController::updateCamera() {
	if ( !_accepted ) return;
	unsigned char response[64];
	unsigned int count	=0;
	unsigned int size	=0;
	unsigned int address=0;
	
	// カメラ画像を撮影
	if( _camera->takePicture() == false ){
	}
	// 撮影した画像のサイズを取得する
	if( _camera->getSize(&size) == false ){
	}
	Serial.println(String(size));
	// データを送るメッセージを送信
	sendMessage(PICTURE_DATA, size);
	address = 0;
	while(address < size)
	{
		count = _camera->readData(response, 32, address);
		if( count ){
			// ガンガンデータを送る
			sendData(response, count);
			address += count;
		}
	}
	
	_camera->stopPictures();
	delay(3000);
}

WebControllerState WebController::updateState() {
	WebControllerState state = NONE;
	if (_client.available()) {
		char c = _client.read();
		_client.flush();
		if ( c == 'a' )
			_accepted = true;
		else if ( c == 'g' )
			state = PING;
		else if ( c == 'f' )
			state = FORWARD;
		else if ( c == 'b' )
			state = BACK;
		else if ( c == 'r' )
			state = TURN_RIGHT;
		else if ( c == 'l' )
			state = TURN_LEFT;
		else if ( c == 'p' )
			state = BEEP;
		else if ( c == 's' )
			state = NONE;
		else
			state = NONE;
//		currentState = state;
	}
	return state;
//	return currentState;
}

boolean WebController::sendMessage(WebControllerMessageType type) {
	sendMessage(type, 0);
}

boolean WebController::sendMessage(WebControllerMessageType type, int messageSize) {
	if (!connected()) return false;
	char send[256];
	memset(send, 0, sizeof(send));
	
	// 0バイト目はデータのタイプを送る
	send[0] = type;
	// 1~2バイト目は、データのサイズを入れる
	send[1] = (messageSize >> 8);
	send[2] = (messageSize &  255);
	
	_client.write((uint8_t*)send, 3);
}

boolean WebController::sendData(unsigned char data[], unsigned int size) {
	if (!connected()) return false;
	char send[256];
	memcpy(send, data, size);
	_client.write((uint8_t*)send, size);
}

void WebController::stop() {
	_client.stop();
}