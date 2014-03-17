function CDlgLogin() {
	BTG.DlgBase.call(this, this); //继承属性
	this.unameField = null;
	this.pwdField = null;
	this.selectedServerLine = 1;
	this.m_pScene = new Array(2);
	this.m_serverListArr = [];
};

CDlgLogin.prototype = new BTG.DlgBase(); //继承方法

CDlgLogin.prototype.onCreateFinal = function (serverList) {
	if (serverList === undefined)
		return;
	this.m_serverListArr = serverList[0];
	//this.setupServerList(serverListArr);

	this.m_pScene[0] = this.find(5501);
	var pos = this.m_pScene[0].getPosition();
	this.m_pScene[0].setPosition(cc.p(pos.x - 400, pos.y));
	this.m_pScene[1] = copySprite(this.m_pScene[0]);

	var conSize = this.m_pScene[0].getContentSize();

	this.m_pScene[1].setPosition(cc.p(conSize.width - 400, this.m_pScene[0].getPosition().y));
	this.m_pScene[1].setAnchorPoint(cc.p(0.0, 0.5));
	this.m_pScene[1].setFlipX(true);
	this.m_pRoot.addChild(this.m_pScene[1], this.m_pScene[0].getZOrder());
	
	var json = {};
	json.name = "html5"; //toLowerCase()
	json.pwd = hex_md5("html5");
	json.index = 1;
	var theSocket = rpgGame.getSocketUtil();

	theSocket.m_socketLogin.emit("login", json, function (msg, ip, port) {
		if (msg == 'Succeed') {
			theSocket.m_loginName = json.name;
			cc.log("ws://" + ip + ":" + port);
			theSocket.connectToServer("ws://" + ip + ":" + port);
		}
	});
}

CDlgLogin.prototype.onUpdate = function(dt) {
	var speed_ = 15;
	for (var i = 0; i < 2; i++) {
		var pos = this.m_pScene[i].getPosition();
		pos.x -= speed_ * dt;
		this.m_pScene[i].setPosition(pos);
	}
	var conSize = this.m_pScene[0].getContentSize();
	var pos0 = this.m_pScene[0].getPosition();
	var pos1 = this.m_pScene[1].getPosition();
	if (-pos0.x >= conSize.width + 400) {
		this.m_pScene[0].setPosition(cc.p(pos1.x + conSize.width, pos.y));
		var p = this.m_pScene[0];
		this.m_pScene[0] = this.m_pScene[1];
		this.m_pScene[1] = p;
	}
}

CDlgLogin.prototype.onButtonDown = function (pSend) {
	switch (pSend.getTag()) {
		case 254://注册
		    break;
		case 255://登陆
		    this.login();
		    break;
		case 354://服务器列表0
		    this.selectServer(354)
		    break;
		case 355://服务器列表1
		    this.selectServer(355);
		    break;
		case 5505://服务器列表2
			this.selectServer(2);
			break;
		case 4723:
		case 4724:
		case 4725:
		case 4726:
		case 4727:
		    this.loginTest("html5");
		    break;
		case 5503:
			this.loginTest("html5");
			break;
	}
}
CDlgLogin.prototype.setupServerList = function (arr) {
	var serverListBtns = [this.findButton(354), this.findButton(355), this.findButton(356)];
	var idx = 0;
	for (var i = 0; i < arr.length; i++) {
		if (arr[i] == null)
			continue;
		else {
			cc.log(arr[i].name);
			if (serverListBtns[idx] != null) {
				serverListBtns[idx].setUserData(i);
				idx++;
				//this.selectedServerLine = i;
			}
			cc.log("server:", this.selectedServerLine);
		}
	}
}
CDlgLogin.prototype.selectServer = function (idx) {
	if(this.m_serverListArr[idx] == null)
		idx = 1;
	this.selectedServerLine = idx;
	console.log("select line:" + this.selectedServerLine);
}
CDlgLogin.prototype.login = function () {
	var uname = this.m_pRoot.getChildByTag(269).getString();
	var pwd = this.m_pRoot.getChildByTag(270).getString();
	var json = {};
	json.name = "html5"; //toLowerCase()
	json.pwd = hex_md5("html5");
	json.index = this.selectedServerLine;
	var theSocket = rpgGame.getSocketUtil();

	theSocket.m_socketLogin.emit("login", json, function (msg, ip, port) {
		if (msg == 'Succeed') {
			theSocket.m_loginName = json.name;
			cc.log("ws://" + ip + ":" + port);
			theSocket.connectToServer("ws://" + ip + ":" + port);
		}
	});
}
CDlgLogin.prototype.loginTest = function (uname, selector) {
	var json = {};
	json.name = uname;
	json.pwd = hex_md5(uname);
	json.index = this.selectedServerLine;
	cc.log(json);
	var theSocket = rpgGame.getSocketUtil();

	theSocket.m_socketLogin.emit("login", json, function (msg, ip, port) {
		if (msg == 'Succeed') {
			theSocket.m_loginName = json.name;
			cc.log("ws://" + ip + ":" + port);
			theSocket.connectToServer("ws://" + ip + ":" + port);

			$("#LoginGroupDiv").hide();
		} else {
			gamePrompt("登录失败!:" + msg)
		}
	});
}