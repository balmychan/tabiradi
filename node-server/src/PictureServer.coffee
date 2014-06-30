sys = require("sys")
http = require("http")
io = require("socket.io")
fs = require("fs")
EventBase = require("./EventBase")

###
PictureServerを生成するファクトリ
###
exports.createServer = ->
  server = new PictureServer()
  server


#//////////////////////////////////////////
# public
#//////////////////////////////////////////

###
画像の制御サーバー
###
PictureServer = ->
  @options =
    port: 8800
    pictureFilePath: "/var/lib/tabiradi/site/image/picture.jpg"

  @clientList = []
  return

p = PictureServer:: = new EventBase.EventBase()

###
サーバー待機の開始
###
p.listen = (options) ->
  self = this
  if options
    for key of options
      continue
  
  # HTMLからの接続先を準備
  httpServer = http.createServer((res, req) ->
    self._httpRequest res, req
    return
  ).listen(self.options.port)
  socket = io.listen(httpServer,
    log: false
  )
  socket.on "connection", (socket) ->
    self._clientConnected socket
    return

  self


#//////////////////////////////////////////
# event handler
#//////////////////////////////////////////
receiving = false

###
HTTPのリクエスト時
###
p._httpRequest = (req, res) ->
  self = this
  
  #　GETの場合は、画像データを返す
  if req.method is "GET"
    res.writeHead 200,
      "Content-Type": "image/jpeg"

    read = fs.createReadStream(self.getPictureFilePath())
    sys.pump read, res
  
  # POSTの場合は、画像データを保存する
  else if req.method is "POST"
    return  if receiving
    receiving = true
    dataList = []
    req.on "data", (data) ->
      dataList.push data
      return

    req.on "end", ->
      size = 0
      i = 0

      while i < dataList.length
        size += dataList[i].length
        i++
      jpegData = new Buffer(size)
      address = 0
      i = 0

      while i < dataList.length
        data = dataList[i]
        data.copy jpegData, address, 0, data.length
        address += data.length
        i++
      self.savePicture jpegData
      dataList = []
      res.writeHead 200,
        "Content-Type": "plain/text"

      res.end "Picutre Updated!!\n"
      receiving = false
      self.emitUpdated()
      return

  return


###
画像クライアントが接続してきた
###
p._clientConnected = (socket) ->
  self = this
  socket.on "disconnect", ->
    self.removeClient socket
    return

  @addClient socket
  return


###
クライアントをリストに追加する
###
p.addClient = (client) ->
  @clientList.push client
  return


###
クライアントをリストから削除する
###
p.removeClient = (client) ->
  i = 0

  while i < @clientList.length
    if client is @clientList[i]
      @clientList.splice i, 1
      break
    i++
  return


###
画像が更新されたことを通知する
###
p.emitUpdated = ->
  i = 0

  while i < @clientList.length
    @clientList[i].emit "message",
      message: "updated"

    i++
  return


#//////////////////////////////////////////
# common method
#//////////////////////////////////////////

###
画像を保存する
###
p.savePicture = (data) ->
  
  # ToDo:ここを非同期にするなどして、落ちないようにする
  # ToDo:落ちたときに、自動で再起動するようにする
  wStream = fs.createWriteStream(@getPictureFilePath())
  wStream.on "drain", ->
    console.log "savePicture drain"
    return

  
  #		wStream.write(data);
  wStream.on "error", ->
    console.log "savePicture error"
    return

  wStream.end data
  return


###
画像ファイルのパスを返す
###
p.getPictureFilePath = ->
  @options.pictureFilePath
