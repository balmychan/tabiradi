#ifndef _WEBCONTROLLER_H_INCLUDED
#define _WEBCONTROLLER_H_INCLUDED
#endif

#include <Ethernet.h>
#include <JPEGCamera.h>
#include <SoftwareSerial.h>

typedef enum WebControllerState {
	NONE,
	FORWARD,
	BACK,
	TURN_RIGHT,
	TURN_LEFT,
	BEEP,
	PING
} WebControllerState;

typedef enum WebControllerMessageType {
	CONNECT = 1,
	PICTURE_START,
	PICTURE_DATA,
	PICTURE_END
} WebControllerMessageType;

/**
* WebControllerに接続するクラス
* このクラスはEthernet.hに依存しているため、
* このクラスを使用する前に必ず
* Ethernet.begin(‾,‾)を完了させるか、
* WebController.begin(‾,‾)を完了させること。
*/
class WebController {
	
//////////////////////////////////
/// static
//////////////////////////////////

private:
	
	/**
	* Macアドレスを保持
	*/
	static byte* _mac;
	
public:
	
	/**
	* MacアドレスをString型で返す
	*/
	static String getMacString();
	
	/**
	* WebControllerの準備をする
	* Ethernet.beginを呼ばないなら、こちらを必ず呼ぶこと
	*/
	static void begin(byte mac[], byte ip[]);
	
	/**
	* WebControllerの準備をする（簡易版）
	* Ethernet.beginを呼ばないなら、こちらを必ず呼ぶこと
	*/
	static void begin(byte mac[]);
	
	/**
	* WebControllerを生成するファクトリー関数
	* ip	: サーバーのIP
	* port	: サーバーのポート
	* rxPin	: カメラのRXのピン番号
	* txPin	: カメラのTXのピン番号
	*/
	static WebController* create(byte ip[], int port, int rxPin, int txPin);
	
	/**
	* WebControllerを生成するファクトリー関数
	* ip	: サーバーのIP
	* port	: サーバーのポート
	*/
	static WebController* create(byte ip[], int port);
	
	/**
	* 生成したWebControllerを破棄する関数
	*/
	static void destroy(WebController*);
	
//////////////////////////////////
/// member
//////////////////////////////////

private:

	EthernetClient _client;
	byte* _ip;
	int _port;
	int _rxPin;
	int _txPin;
	WebControllerState currentState;
	boolean _accepted;
	SoftwareSerial* _cameraSerial;
	JPEGCamera* _camera;
	
private:
	
	/**
	* コンストラクタ
	* ip	: サーバーのIP
	* port	: サーバーのポート
	* rxPin	: カメラのRXのピン番号
	* txPin	: カメラのTXのピン番号
	*/
	WebController(byte ip[], int port, int rxPin, int txPin);
	
	/**
	* コンストラクタ
	* ip	: サーバーのIP
	* port	: サーバーのポート
	*/
	WebController(byte ip[], int port);
	
	/**
	* デストラクタ
	*/
	~WebController();

public:

	/**
	* サーバーと接続する
	*/
	boolean connect();
	
	/**
	* 現在WebControllerと接続中かどうかを返す
	*/
	boolean connected();
	
	/**
	* 現在のカメラ状態を更新する
	*/
	void updateCamera();
	
	/**
	* 現在の状態を取得して返す
	*/
	WebControllerState updateState();
	
	/**
	* サーバーにメッセージを送信する
	*/
	boolean sendMessage(WebControllerMessageType);
	
	/**
	* サーバーにメッセージを送信する
	* メッセージの全体サイズも指定する
	*/
	boolean sendMessage(WebControllerMessageType type, int messageSize);
	
	/**
	* サーバーに生データを送信する
	*/
	boolean sendData(unsigned char[], unsigned int);
	
	/**
	* サーバーとの接続を解除する
	*/
	void stop();
};