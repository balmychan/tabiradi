旅ラジ配置方法
========


## node.js、foreverをインストール

```bash
$ rpm -ivh http://ftp.riken.jp/Linux/fedora/epel/6/x86_64/epel-release-6-8.noarch.rpm
$ yum install nodejs npm --enablerepo=epel

$ npm install forever -g
```

## gitをインストール
```bash
$ yum install -y git
```

## apacheをインストール
```bash
$ yum install -y httpd
```

## ソースを落とす

```bash
$ cd /var/lib
$ git clone https://github.com/balmychan/tabiradi.git
```

## apacheの設定とサイトの起動

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

## 旅ラジサービス、旅ラジ画像サービスの起動

``` bash
$ cd /var/lib/tabiradi/node-server
$ forever start Server.js
$ forever start picture.js
$ forever list
```

※サーバーアドレスは、node-server/Server.jsで書き換える

## サイトにアクセス

ブラウザでサイトにアクセスし、エラーが発生していないことを確認する
