旅ラジサーバーセットアップ
=======
旅ラジについて
-----

![代替テキスト](https://raw.githubusercontent.com/balmychan/tabiradi/master/site/image/helppage.png)

[旅ラジ操作動画はこちら](http://www.youtube.com/watch?v=8J5xxVJF39Q "旅ラジ操作動画")

### node.js、foreverをインストール

```bash
$ rpm -ivh http://ftp.riken.jp/Linux/fedora/epel/6/x86_64/epel-release-6-8.noarch.rpm
$ yum install nodejs npm --enablerepo=epel

$ npm install forever -g
$ npm install coffee-script -g
```

### gitをインストール
```bash
$ yum install -y git
```

### apacheをインストール
```bash
$ yum install -y httpd
```

### ソースを落とす

```bash
$ cd /var/lib
$ git clone https://github.com/balmychan/tabiradi.git
```

### apacheの設定とサイトの起動

``` bash
$ vi /etc/httpd/conf/httpd.conf
```

```httpd.conf
#DocumentRoot "/var/www/html"
DocumentRoot "/var/lib/tabiradi/site"
```

``` bash
$ /etc/init.d/httpd restart
```

### 旅ラジサービス、旅ラジ画像サービスの起動

``` bash
$ cd /var/lib/tabiradi/node-server
$ npm install
$ forever start -c coffee Server.coffee
$ forever start -c coffee picture.coffee
$ forever list
```

※サーバーアドレスは、node-server/Server.jsで書き換える

### ポートを開ける

下記ポートをそれぞれ開ける

ポート|用途
--- | ---
80|旅ラジWebサイト（Apache）
8080|Webサイトからnodeサーバーに（ラジコン操作用）接続するWebSocket接続
8800|Webサイトからラジコン画像を受け取るためのnodeサーバーとのWebSocket接続
3000|Arduinoからnodeサーバーに接続するためのソケット

### サイトにアクセス

ブラウザでサイトにアクセスし、エラーが発生していないことを確認する
