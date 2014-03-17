(function(BTG) {
	BTG.Socket = function() {
		this.m_socket = null;
	};

	BTG.Socket.prototype.connect = function (strAddr) {
		this.m_socket = io.connect(strAddr);
	}

	BTG.Socket.prototype.emit = function () {
		cc.log(arguments);
		this.m_socket.emit.apply(this.m_socket, arguments);
	}

	BTG.Socket.prototype.on = function () {
		this.m_socket.on.apply(this.m_socket, arguments);
	}
	BTG.Socket.prototype.close = function () {
		// not define
	}
})(BTG);