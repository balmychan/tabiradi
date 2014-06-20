var	WebRadiconServer = require("./lib/WebRadiconServer");

// サーバー起動
var webRadiconServer = WebRadiconServer.createServer();
webRadiconServer.listen({ 
	controllerPort 	: 8080,
	arduinoPort 	: 3000,
	ip				: "49.212.49.143"
});