EventBase = require("./EventBase")

###
コントローラー擬似クラス
###
Controller = (socket, server) ->
  self = this
  @arduino = null
  @socket = socket
  @server = server
  @handlers = {}
  @socket.on "message", (data) ->
    self.onMessage data.message
    return

  @socket.on "queue", (data) ->
    self.onQueue data
    return

  @socket.on "tsubuyaki", (data) ->
    self.onTsubuyaki data.message
    return

  @socket.on "disconnect", (data) ->
    console.log "disconnect"
    self.socket = null
    self.detach()
    self.close()
    return

  return

p = Controller:: = new EventBase.EventBase()

###
Arduinoにアタッチする
###
p.attach = (arduino) ->
  self = this
  @arduino = arduino
  @arduino.attached = true
  @sendMessage "attach",
    time: "60"

  restTime = 60000
  @timer = setTimeout(->
    self.detach()
    return
  , restTime)
  this


###
Arduinoをデタッチする
###
p.detach = ->
  if @arduino
    @sendMessage "detach"
    @trigger "detach", [
      this
      this.arduino
    ]
    if @timer
      clearTimeout @timer
      @timer = null
    @arduino.stop()
    @arduino.attached = false
    @arduino = null
  this


###
メッセージを送信する
###
p.sendMessage = (type, message) ->
  return  unless @socket
  message = message or {}
  @socket.emit type, message
  return


###
リストを送る
###
p.sendQueueList = (queueList) ->
  return  unless @socket
  sendList = []
  i = 0

  while i < queueList.length
    sendList.push name: queueList[i].name or "（無名）"
    i++
  @socket.emit "queue",
    queueList: sendList

  return


###
プレイヤーを送る
###
p.sendPlayer = (player) ->
  return  unless @socket
  player = player or {}
  player.name = player.name or "（無名）"
  sendPlayer = name: player.name
  @socket.emit "player",
    player: sendPlayer

  return


###
プレイヤーを削除
###
p.clearPlayer = ->
  return  unless @socket
  
  # クライアント側にclearPlayerほげほげは用意してないので、空の名前で代用
  @socket.emit "player",
    player:
      name: ""

  return


###
つぶやきを送信
###
p.sendTsubuyaki = (tsubuyaki) ->
  return  unless @socket
  tsubuyaki = tsubuyaki or message: ""
  @socket.emit "tsubuyaki",
    message: tsubuyaki

  return


###
接続中かどうかを返す
###
p.connected = ->
  (if (@socket) then true else false)


###
閉じる
###
p.close = ->
  @trigger "close"[this]
  return


###
メッセージが届いたとき
アタッチしているArduinoを操作する
###
p.onMessage = (message) ->
  
  # Arduinoへのメッセージ
  return  unless @arduino
  if message is "f"
    @arduino.forward()
  else if message is "b"
    @arduino.back()
  else if message is "r"
    @arduino.rightForward()
  else if message is "l"
    @arduino.leftForward()
  else if message is "p"
    @arduino.pi()
  else @arduino.stop()  if message is "s"
  return


###
キューが届いたとき
###
p.onQueue = (data) ->
  @name = data.name
  console.log "invokeQueue:" + @name
  @trigger "invokeQueue", [this]
  return


###
つぶやきが届いたとき
###
p.onTsubuyaki = (tsubuyaki) ->
  @trigger "tsubuyaki", [
    this
    tsubuyaki
  ]
  return


###
ファクトリー
###
exports.create = (socket, server) ->
  new Controller(socket, server)
