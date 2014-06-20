var	PictureServer = require("./lib/PictureServer");

// サーバー起動
var pictureServer = PictureServer.createServer();
pictureServer.listen({ 
	port : 8800
});