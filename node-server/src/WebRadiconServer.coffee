sys = require("sys")
http = require("http")
net = require("net")
io = require("socket.io")
fs = require("fs")
EventBase = require("./EventBase")
Controller = require("./Controller")
Arduino = require("./Arduino")

###
WebRadiconControllServerを生成するファクトリ
###
exports.createServer = ->
  server = new WebRadiconServer()
  server


###
Webラジコンのコントローラー側のサーバー
###
WebRadiconServer = ->
  @options =
    controllerPort: 8080
    arduinoPort: 3000
    ip: "localhost"
    queueMatchingInterval: 1000 # キューのマッチングのチェック間隔（ミリ秒）

  
  # socket.ioのオプション
  @socketIOOptions = log: false
  @arduinoList = []
  @queueList = []
  @controllerList = []
  return

p = WebRadiconServer:: = new EventBase.EventBase()

#//////////////////////////////////////////
# public
#//////////////////////////////////////////

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
  ).listen(options.controllerPort)
  socket = io.listen(httpServer, self.socketIOOptions)
  socket.on "connection", (socket) ->
    self._controllerConnected socket
    return

  
  # Arduinoからの接続先を準備
  adServer = net.createServer((stream) ->
    self._arduinoConnected stream
    return
  ).listen(self.options.arduinoPort)
  adServer.on "error", (e) ->
    console.log e.message
    setTimeout ->
      adServer.close()
      adServer.listen self.options.arduinoPort
      return

    return

  setInterval (->
    self.queueMatching()
    return
  ), self.options.queueMatchingInterval
  self


#//////////////////////////////////////////
# event handler
#//////////////////////////////////////////

###
コントローラーが接続してきた
###
p._controllerConnected = (socket) ->
  console.log "joined controller"
  self = this
  controller = Controller.create(socket, self)
  controller.on "invokeQueue", (controller) ->
    self.addQueueList controller
    self.sendQueueListToAll()
    return

  controller.on "tsubuyaki", (controller, tsubuyaki) ->
    self.sendTsubuyakiToAll tsubuyaki
    return

  controller.on "close", (controller) ->
    hasQueue = self.hasQueueList(controller)
    self.removeQueueList controller
    self.removeControllerList controller
    self.sendQueueListToAll()  if hasQueue
    return

  controller.on "detach", (controller) ->
    self.clearPlayerToAll()
    return

  controller.sendQueueList @queueList
  @addControllerList controller
  return


###
Arduinoが接続してきた
###
p._arduinoConnected = (stream) ->
  self = this
  arduino = Arduino.create(stream)
  console.log "connected arduino…"
  
  # 接続が途切れないように、30秒ごとに信号を送る
  timer = setInterval(->
    arduino.ping()
    return
  , 30000)
  arduino.on "connected", ->
    console.log "joined arduino : " + arduino.mac + "\n"
    self.addArduinoList arduino
    console.log "total arduino : " + self.numArduinoList()
    return

  arduino.on "pictureReceived", ->
    data = arduino.picture
    self.savePicture data
    return

  arduino.on "close", ->
    console.log "close arduino : " + arduino.mac
    self.removeArduinoList arduino
    clearInterval timer  if timer
    return

  return

receiving = false

###
HTTPのリクエスト時
###
p._httpRequest = (req, res) ->
  self = this
  if req.method is "GET"
    res.writeHead 200,
      "Content-Type": "image/jpeg"

    read = fs.createReadStream("./appa.jpg")
    sys.pump read, res
  else if req.method is "POST"
    return  if receiving
    receiving = true
    dataList = []
    
    #console.log("body length=" + req.body.length);
    req.on "data", (data) ->
      
      #body +=data;
      dataList.push data
      return

    req.on "end", ->
      
      #        	console.log("endData!!");
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
      receiving = false
      res.writeHead 200,
        "Content-Type": "plain/text"

      res.end "Picutre Updated!!\n"
      return

  return


#//////////////////////////////////////////
# common method
#//////////////////////////////////////////

###
画像を保存する
###
p.savePicture = (data) ->
  
  #	console.log("data-size=" + data.length);
  wStream = fs.createWriteStream("./appa.jpg")
  wStream.write data
  return


###
コントローラーをキュー待ちに追加する
###
p.addQueueList = (controller) ->
  i = 0

  while i < @queueList.length
    if controller is @queueList[i]
      console.log "既にキュー待ち中です"
      return
    i++
  @queueList.push controller
  return


###
コントローラーをキュー待ちから除外する
###
p.removeQueueList = (controller) ->
  @__queueRemoving__ = true
  i = 0

  while i < @queueList.length
    if controller is @queueList[i]
      @queueList.splice i, 1
      return
    i++
  @__queueRemoving__ = false
  return


###
コントローラーがキューに入っているかどうかを判定して返す
###
p.hasQueueList = (controller) ->
  i = 0

  while i < @queueList.length
    return true  if controller is @queueList[i]
    i++
  false


###
キューを取得する
###
p.getQueueList = ->
  @queueList


###
キューあるかどうかを返す
###
p.hasQueue = ->
  (if (0 < @queueList.length) then true else false)


###
すべてのコントローラーにつぶやきを送信する
###
p.sendTsubuyakiToAll = (tsubuyaki, controller) ->
  console.log "全員につぶやきを送信しました:" + tsubuyaki
  i = 0

  while i < @controllerList.length
    @controllerList[i].sendTsubuyaki tsubuyaki
    i++
  return


###
全員に現在のプレイヤーとキューを通知する
###
p.sendQueueListToAll = ->
  i = 0

  while i < @controllerList.length
    @controllerList[i].sendQueueList @queueList
    i++
  return


###
全員に現在のプレイヤーを通知する
###
p.sendPlayerToAll = (player) ->
  i = 0

  while i < @controllerList.length
    @controllerList[i].sendPlayer player
    i++
  return


###
全員に現在のプレイヤーを削除する
###
p.clearPlayerToAll = ->
  i = 0

  while i < @controllerList.length
    @controllerList[i].clearPlayer()
    i++
  return


###
コントローラーリストに追加する
###
p.addControllerList = (controller) ->
  i = 0

  while i < @controllerList.length
    return  if controller is @controllerList[i]
    i++
  @controllerList.push controller
  return


###
コントローラーリストから除外する
###
p.removeControllerList = (controller) ->
  target = undefined
  i = 0

  while i < @controllerList.length
    if controller is @controllerList[i]
      controller.detach()
      @controllerList.splice i, 1
      break
    i++
  return


###
コントローラーの数を返す
###
p.numController = ->
  @controllerList.length


###
Arduinoをリストに追加する
###
p.addArduinoList = (arduino) ->
  
  # 同じmacアドレスのarduinoがあったら、それは削除する
  mac = arduino.getMac()
  removeList = []
  i = 0

  while i < @arduinoList.length
    removeList.push @arduinoList[i]  if mac is @arduinoList[i].getMac()
    i++
  i = 0

  while i < removeList.length
    @removeArduinoList removeList[i]
    i++
  @arduinoList.push arduino
  return


###
Arduinoをリストから削除する
###
p.removeArduinoList = (arduino) ->
  target = null
  i = 0

  while i < @arduinoList.length
    if @arduinoList[i] is arduino
      @arduinoList.splice i, 1
      @detachArduino arduino
      break
    i++
  return


###
指定されたArduinoを持つコントローラーがあれば、detachする
###
p.detachArduino = (arduino) ->
  i = 0

  while i < @queueList.length
    controller = @queueList[i]
    if controller.arduino is arduino
      controller.detach()
      break
    i++
  return


###
Arduinoの数を返す
###
p.numArduinoList = ->
  @arduinoList.length


###
Arduinoがリストにあるかどうかを返す
###
p.hasArduino = ->
  (if (0 < @arduinoList.length) then true else false)


###
キュー待ちのコントローラーがあったら、Arduinoにアタッチする
###
p.queueMatching = ->
  self = this
  return  if not @hasQueue() or @__queueRemoving__
  i = 0

  while i < @arduinoList.length
    arduino = @arduinoList[i]
    unless arduino.attached
      controller = @queueList.shift()
      controller.attach arduino
      self.sendPlayerToAll controller
      self.sendQueueListToAll()
      break
    i++
  return
