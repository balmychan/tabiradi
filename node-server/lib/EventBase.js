/**
* イベントを扱う基底クラス
*/
var EventBase = function () {
	this.options = {};
	this.__handlers__ = {};
};

EventBase.prototype = {
	
	/**
	* イベントを紐付ける
	*/
	on : function(eventName, handler) {
		this.__handlers__[eventName] = handler;
		return this;
	},
	
	/**
	* イベントをトリガ
	*/
	trigger : function(eventName, args) {
		var handler = this.__handlers__[eventName];
		if ( handler ) {
			handler.apply(this, args);
		}
		return this;
	}
};

exports.EventBase = EventBase;