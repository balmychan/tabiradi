// デバッグモード
#define DEBUG 1

// ログ用補助関数
void log(String message) {
  static boolean needInit = true;
  if ( needInit ) {
    Serial.begin(9600);
    needInit = false; 
  }
  Serial.println(message);
}

// ロガー
#ifdef DEBUG
#define LOG(x) log(String(x))
#else
#define LOG(x)
#endif