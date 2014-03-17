function CDlgFilmSpeak() {
	BTG.DlgBase.call(this, this); //继承属性
	this.m_ctrlLeft = new Array(3);
	this.m_ctrlRight = new Array(3);
	this.m_curLeftRight = "left";
	this.m_curNpc = null;
	this.m_oldText = "";
	this.m_curStrText = "";
	this.m_curStrIdx = 0;
	this.m_runTime = 0;
	this.m_pCurCtrl = null;
	this.m_curState = "add";
	this.m_ttfText = null;
};

CDlgFilmSpeak.prototype = new BTG.DlgBase(); //继承方法
CDlgFilmSpeak.IdxName = 0;

CDlgFilmSpeak.IdxHead = 1;
CDlgFilmSpeak.IdxCount = 2;

CDlgFilmSpeak.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bIsModel = true;
	ret.bIsAutoScale = false;
	return ret;
}
CDlgFilmSpeak.prototype.onCreateFinal = function () {
	this.find(5295).setVisible(false);
	this.find(5294).setVisible(false);

	this.m_ttfText = this.find(5290);

	this.m_ctrlLeft[CDlgFilmSpeak.IdxName] = this.find(5288);
	this.m_ctrlLeft[CDlgFilmSpeak.IdxHead] = this.find(5292);
	this.m_ctrlRight[CDlgFilmSpeak.IdxName] = this.find(5289);

	this.m_ctrlRight[CDlgFilmSpeak.IdxHead] = this.find(5293);
	this.m_ctrlLeft[CDlgFilmSpeak.IdxHead].setVisible(false);
	this.m_ctrlRight[CDlgFilmSpeak.IdxHead].setVisible(false);
	var gird9 = this.find(BTG.DefineTag_9Grid);
	var conSize = gird9.getContentSize();
	gird9.setContentSize(cc.size(BTG.windowSize.width, conSize.height));

	this.m_pRoot.setContentSize(cc.size(BTG.windowSize.width, conSize.height));
	// this.m_pRoot.setPosition(cc.p(0, 0));
	for (var i = 0; i < CDlgFilmSpeak.IdxCount; i++) {
		var offPosX = this.m_ctrlRight[i].getPosition().x - conSize.width;
		var newRBX = BTG.windowSize.width;
		this.m_ctrlRight[i].setPosition(cc.p(offPosX + newRBX, this.m_ctrlRight[i].getPosition().y));
		this.m_ctrlRight[i].setVisible(false);
		this.m_ctrlLeft[i].setVisible(false);
	}
}
CDlgFilmSpeak.prototype.onShow = function (bIsShow, text_Pos_npc) {
	if (this.m_curNpc) {
		rpgGame.getCharacterUtil().delForObject(this.m_curNpc);
		this.m_curNpc = null;
	}
	if (bIsShow === false) {
		this.m_runTime = 0;
		this.m_curStrIdx = 0;
		this.m_curState = "no";
		return;
	} else
		this.m_curState = "add";

	this.m_curStrText = text_Pos_npc[0];
	var pPre = this.m_curLeftRight === "left" ? this.m_ctrlLeft : this.m_ctrlRight;
	for (var i = 0; i < 2; i++)
	pPre[i].setVisible(false);

	this.m_curLeftRight = text_Pos_npc[1] === "z" ? "left" : "right";
	this.m_pCurCtrl = this.m_curLeftRight === "left" ? this.m_ctrlLeft : this.m_ctrlRight;

	this.m_pCurCtrl[CDlgFilmSpeak.IdxName].setVisible(true);

	this.m_ttfText.setString("");

	var tempTTF = copyMinTTF(this.m_ttfText);
	tempTTF.setString("一一一一一一一一一一一一一一一一一一一一一一一一一");
	this.m_pCurCtrl[CDlgFilmSpeak.IdxName].setString(text_Pos_npc[2].getName());

	if (this.m_curLeftRight === "left")
		this.m_ttfText.setPosition(cc.p(this.m_pCurCtrl[CDlgFilmSpeak.IdxName].getPosition().x + this.m_pCurCtrl[CDlgFilmSpeak.IdxName].getContentSize().width / 2 + 10, 0));
	else {
		this.m_ttfText.setPosition(cc.p(this.m_pCurCtrl[CDlgFilmSpeak.IdxName].getPosition().x - this.m_pCurCtrl[CDlgFilmSpeak.IdxName].getContentSize().width / 2 - tempTTF.getContentSize().width, 0));
	}

	// npc
	this.m_curNpc = rpgGame.getCharacterUtil().createUICharacter(text_Pos_npc[2].getResID(),
	this.m_pCurCtrl[CDlgFilmSpeak.IdxHead].getPosition(), text_Pos_npc[2].m_pImage.getEqList(), this.m_pRoot);
	if (this.m_curLeftRight === "left")
		this.m_curNpc.setDirection(BTG.ARSD_Right);

}
CDlgFilmSpeak.prototype.isFinal = function () {
	return this.m_curState === "no";
}
CDlgFilmSpeak.prototype.onTouchBegin = function (vPos) {
	if (this.m_curState === "add") {
		this.m_ttfText.setString(addEnterToString(this.m_curStrText, 25));
		this.m_curState = "wait";
		this.m_runTime = 0;
		this.m_curStrIdx = 0;
	} else if (this.m_curState === "wait") {
		this.m_curStrText = "";
		this.m_oldText = "";
		this.m_runTime = 0;
		this.m_curStrIdx = 0;
		this.m_curState = "final";
		this.show(false);
	}
}
CDlgFilmSpeak.prototype.onUpdate = function (dt) {
	if (this.m_curState === "add") {
		this.m_runTime += dt;
		if (this.m_runTime > 0.1) {
			this.m_runTime = 0;

			this.m_oldText += this.m_curStrText[this.m_curStrIdx];
			this.m_ttfText.setString(addEnterToString(this.m_oldText, 25));
			this.m_curStrIdx++;
			if (this.m_curStrIdx === this.m_curStrText.length) {
				this.m_oldText = "";
				this.m_curState = "wait";
				this.m_runTime = 0;
				this.m_curStrIdx = 0;
			}
		}
	}
}