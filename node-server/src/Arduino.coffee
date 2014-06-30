
###
Arduino擬似クラス
###

# 受信用バッファ

###
受信用データを初期化
###
clearReceiveData = ->
  receiving = false
  type = 0
  buf = null
  messageSize = -1
  receivedSize = 0
  clearTimeout timer  if timer
  timer = null
  return
EventBase = require("./EventBase")
Arduino = (stream) ->
  self = this
  @stream = stream
  @picture = null
  stream.setKeepAlive true
  stream.addListener "data", (data) ->
    self._streamData data
    return

  stream.addListener "end", ->
    console.log "end"
    self._streamEnd()
    return

  stream.addListener "error", ->
    console.log "error"
    return

  stream.addListener "close", ->
    console.log "close"
    self._streamEnd()
    return

  return

Arduino.MessageType =
  CONNECT: 1
  PICTURE_START: 2
  PICTURE_DATA: 3
  PICTURE_END: 4

p = Arduino:: = new EventBase.EventBase()
receiving = undefined
messageType = undefined
buf = undefined
messageSize = undefined
receivedSize = undefined
timer = undefined
clearReceiveData()

###
メッセージがきたとき
###
p._streamData = (data) ->
  
  # 受信中でない場合は、メッセージの最初なので、種類を取り出す
  # 受信中に設定
  
  # 受信中なのに、サイズが無い場合は、サイズを取り出す
  
  # データを取り出す
  
  # メッセージサイズまでか、データの小さいほうまで
  
  # 受信したデータをバッファにコピー
  
  # 受信が完了したかを判定する
  
  # メッセージの受信が完了したので、投げる
  
  # 再帰処理時のデータタイプが、正常なら処理する。おかしければ、もう破棄
  
  # 5秒以内に次のデータがこなければ、なくなったと見なす
  # これを呼べば、また再び5秒もらえる
  updateTimer = ->
    if timer
      clearTimeout timer
      timer = null
    else
      timer = setTimeout(->
        clearReceiveData()
        return
      , 5000)
    return
  self = this
  unless receiving
    type = data[0]
    data = data.slice(1, data.length)
    receiving = true
  if receiving and messageSize is -1
    throw new Error("messageSizeが取得できません")  if data.length < 2
    messageSize = (data[0] << 8) + (data[1] & 255)
    data = data.slice(2, data.length)
  if receiving
    buf = new Buffer(messageSize)  unless buf
    copySize = Math.min((messageSize - receivedSize), data.length)
    data.copy buf, receivedSize, 0, copySize
    receivedSize += copySize
    data = data.slice(copySize, data.length)
  if messageSize isnt -1 and messageSize <= receivedSize
    @_streamMessage type, buf
    clearReceiveData()
    @_streamData data  if data[0] is Arduino.MessageType.CONNECT or data[1] is Arduino.MessageType.PICTURE_DATA  if 0 < data.length
    return
  updateTimer()
  return


###
メッセージを受信
###
p._streamMessage = (type, data) ->
  
  # 接続時
  if type is Arduino.MessageType.CONNECT
    @mac = data.toString()
    @trigger "connected", [this]
    @accept()
  
  # 画像データ（現仕様だと、画像の送信はHTTPベースになったのでこないはずだが、一応残している
  else if type is Arduino.MessageType.PICTURE_DATA
    @picture = data
    @trigger "pictureReceived", [this]
  return


###
通信が終了
###
p._streamEnd = ->
  @stream.destroy()
  @stream = null
  @trigger "close", [this]
  return


###
Macアドレスを返す
###
p.getMac = ->
  @mac


###
接続を承認
###
p.accept = ->
  @stream.write "a"  if @stream
  return


###
前進
###
p.forward = ->
  console.log "forward"
  @stream.write "f"  if @stream
  return


###
後退
###
p.back = ->
  console.log "back"
  @stream.write "b"  if @stream
  return


###
右前進
###
p.rightForward = ->
  console.log "right"
  @stream.write "r"  if @stream
  return


###
左前進
###
p.leftForward = ->
  console.log "left"
  @stream.write "l"  if @stream
  return


###
ピッピー
###
p.pi = ->
  @stream.write "p"  if @stream
  return


###
停止
###
p.stop = ->
  console.log "stop"
  @stream.write "s"  if @stream
  return


###
接続をとぎらせないための信号
###
p.ping = ->
  console.log "ping"
  @stream.write "g"  if @stream
  return


###
ファクトリー
###
exports.create = (stream) ->
  new Arduino(stream)
