#include <SPI.h>
#include <Ethernet.h>
#include <JPEGCamera.h>
#include <SoftwareSerial.h>

#include <Common.h>

#include <WebController.h>
#include <CrawlerBelt.h>

////////////////////////////////////////////
// public value
////////////////////////////////////////////

// キャタピラ制御クラス
CrawlerBelt cb;
// 運動状態
int state = NONE;
int pre_state = NONE;
// スピード
int sp = 200;

// サーバーとの通信およびカメラ取得クラス
WebController* wc;

// 通信設定値
byte mac[]    = {0x90, 0xA2, 0xDA, 0x0D, 0x09, 0x9F };
byte server[] = { 49, 212, 49, 143 };


/**
* init
*/
void setup(){
  LOG("initializing cb...");
  // キャタピラの設定
  cb.create(8,9,5,7,6,3);
  
  LOG("connecting server...");
  // サーバーとの接続
  WebController::begin(mac);
  wc = WebController::create(server, 3000);
  connect();
  
  LOG("initialized!!");
}

/**
* loop
*/
void loop(){
  if ( wc->connected() ) {
    update_state();
    move();
    delay(2500);
  }
  else {
     connect(); 
  }
}

// サーバーに接続する補助関数
void connect() {
  LOG("connecting server...");
  stop();
  if( wc->connect() ) {
    LOG("connection success!!");
  }
  else {
    LOG("connection failed!!");
  }
}

void stop () {
  wc->stop();
}

// サーバーに接続中かどうかを返す
boolean connected() {
   return wc->connected(); 
}

// ラジコン制御の状態を更新する
void update_state(){
  state = wc->updateState();
}

// ラジコン制御
void move() {
  if(getState() == pre_state){
    return;
  }else{
    pre_state = getState();
  }
  if (getState() == NONE) {
    LOG("STOP");
    cb.stop();
  }
  else if (getState() == FORWARD) {
    LOG("FORWARD");
    cb.forward(getSpeed());
  }
  else if (getState() == BACK) {
    LOG("BACK");
    cb.back(getSpeed());
  }
  else if (getState() == TURN_RIGHT) {
    LOG("TURN_RIGHT");
    cb.turn_right(getSpeed());
  }
  else if (getState() == TURN_LEFT) {
    LOG("TURN_LEFT");
    cb.turn_left(getSpeed());
  }
  else if (getState() == PING ) {
    LOG("PING"); 
  }
  
}

// 現在のラジコン制御の状態を返す
int getState(){
  return state; 
}

// 現在のラジコンスピードを返す
int getSpeed(){
  return sp; 
}
