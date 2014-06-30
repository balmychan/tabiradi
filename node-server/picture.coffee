PictureServer = require("./src/PictureServer")

# サーバー起動
pictureServer = PictureServer.createServer()
pictureServer.listen port: 8800
