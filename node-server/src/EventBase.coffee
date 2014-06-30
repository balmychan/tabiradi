###
イベントを扱う基底クラス
###
EventBase = ->
  @options = {}
  @__handlers__ = {}
  return

EventBase:: =
  
  ###
  イベントを紐付ける
  ###
  on: (eventName, handler) ->
    @__handlers__[eventName] = handler
    this

  
  ###
  イベントをトリガ
  ###
  trigger: (eventName, args) ->
    handler = @__handlers__[eventName]
    handler.apply this, args  if handler
    this

exports.EventBase = EventBase
