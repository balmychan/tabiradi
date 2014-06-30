WebRadiconServer = require("./src/WebRadiconServer")

# サーバー起動
webRadiconServer = WebRadiconServer.createServer()
webRadiconServer.listen
  controllerPort: 8080
  arduinoPort: 3000
  ip: "128.199.167.229"
