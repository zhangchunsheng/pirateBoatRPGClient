//使用messgae的对象需要实现 _Message函数
(function(BTG) {
	BTG.Message = function() {
		this.m_msgMap = new Object();
	}
	BTG.Message.prototype.postMsg = function (msgStr, param0_n) {
		if (this.m_msgMap[msgStr] === undefined) {
			cc.alert("[Error] msg not bind, id:" + msgStr);
			return;
		}
		if (this.m_msgMap[msgStr]._Message === undefined) {
			cc.alert("[error] msg object _Message() id:" + msgStr);
			return;
		}
		this.m_msgMap[msgStr]._Message(arguments);
	}

	BTG.Message.prototype._bind = function (dlgObj, msgString) {
		if (this.m_msgMap[msgString] !== undefined) {
			cc.alert("[Error]msg not mul,id:" + msgString);
			return;
		}
		this.m_msgMap[msgString] = dlgObj;
	}

	BTG.Message.prototype._del = function (msgString) {
		delete this.m_msgMap[msgString];
	}
})(BTG);