function CDlgMainUI_RBForPhone() {//右下角 装备栏
	CDlgMainUI_RBBase.call(this, this); //继承属性

	this.UserTime = 0.3;
	this.m_isOpen = false;
	this.m_openBtnOrgPosList = new Array(0);
	this.m_openBtnList = new Array(0);
	this.m_initbtnList = new Array(0);
	this.m_hideTagList = null;

	this.m_backOrgPos = null;
	this.m_backHidePos = null;
	this.m_backSizeW = 0;
	this.m_backSpr = null;

	this.m_maxLeftPoint = null;
	this.m_nMaxWidth = 0;
	this.m_sprExp = null;
};

CDlgMainUI_RBForPhone.prototype = new CDlgMainUI_RBBase(); //继承方法

CDlgMainUI_RBForPhone.Tag_YingXiong = 312;
CDlgMainUI_RBForPhone.Tag_XiuWei = 313;
CDlgMainUI_RBForPhone.Tag_BuZhen = 314;
CDlgMainUI_RBForPhone.Tag_BeiBao = 315;
CDlgMainUI_RBForPhone.Tag_FaBao = 316;
CDlgMainUI_RBForPhone.Tag_ZuoQi = 317;
CDlgMainUI_RBForPhone.Tag_XinJian = 318;
CDlgMainUI_RBForPhone.Tag_MenPai = 319;

CDlgMainUI_RBForPhone.Tag_System = 321;
CDlgMainUI_RBForPhone.Tag_Map = 322;

CDlgMainUI_RBForPhone.prototype.hideBtn = function (hideBtnTagList) {
	this.m_hideTagList = hideBtnTagList;
	this.open(false);

	for (var i = 0; i < this.m_hideTagList.length; i++) {
		for (var k = 0; k < this.m_openBtnList.length; k++) {
			if (this.m_hideTagList[i] === this.m_openBtnList[k].getTag()) {
				this.m_openBtnList.splice(k, 1);
				break;
			}
		}
	}
}

CDlgMainUI_RBForPhone.prototype.reset = function () {
	this.open(false);
	this.m_openBtnList = copyArray(this.m_initbtnList);
	this.hideBtn([CDlgMainUI_RBForPhone.Tag_FaBao,
		CDlgMainUI_RBForPhone.Tag_ZuoQi,
		CDlgMainUI_RBForPhone.Tag_XinJian,
		CDlgMainUI_RBForPhone.Tag_MenPai,
		CDlgMainUI_RBForPhone.Tag_System,
		CDlgMainUI_RBForPhone.Tag_XiuWei]
	);
	//CDlgMainUI_RBForPhone.Tag_XiuWei
}

CDlgMainUI_RBForPhone.prototype.onButtonDown = function (pSender) {
	CDlgMainUI_RBBase.prototype.onButtonDown.call(this, pSender); //调用基类同名成员函数

	if (pSender.getTag() === 320) {
		var _isOpen = !this.m_isOpen;
		this.open(_isOpen);
	}
}

CDlgMainUI_RBForPhone.prototype.open = function (bIsOpen) {
	if (this.m_isOpen === bIsOpen)
		return;
	this.m_isOpen = bIsOpen;
	var pOpenButton = this.findButton(320);
	var maxLeft = 999;
	for (var i = 0; i < this.m_openBtnList.length; i++) {
		this.m_openBtnList[i].setVisible(true);
		this.m_openBtnList[i].stopAllActions();
		var moveTo = null;
		if (bIsOpen === false) {
			moveTo = cc.MoveTo.create(this.UserTime, pOpenButton.getPosition());

			var seq = cc.Sequence.create(moveTo, cc.Hide.create());
			this.m_openBtnList[i].runAction(seq);
		} else {
			moveTo = cc.EaseIn.create(cc.MoveTo.create(this.UserTime, this.m_openBtnOrgPosList[i]), 0.5);
			if (maxLeft > this.m_openBtnOrgPosList[i].x)
				maxLeft = this.m_openBtnOrgPosList[i].x;
			this.m_openBtnList[i].runAction(moveTo);
		}
	}
	if (bIsOpen) {
		var moveBack = cc.MoveTo.create(this.UserTime, this.m_backOrgPos);
		this.m_backSpr.runAction(moveBack);
		//maxLeft -= this.m_openBtnList[0].getContentSize().width / 2;
		//if (maxLeft > 5) maxLeft -= 5;
		//var trect = this.m_backSpr.getTextureRect();
		//this.m_backSpr.setTextureRect(cc.rect(maxLeft, trect.origin.y,
		//                                         this.m_backSizeW - maxLeft,
		//                                        trect.size.height));
	} else {
		var moveBack = cc.MoveTo.create(this.UserTime, this.m_backHidePos);
		this.m_backSpr.runAction(moveBack);
	}

	//this.m_backSpr.setScaleX(0.5);//conSizeX / maxLeftSize);
}
CDlgMainUI_RBForPhone.prototype.calcXScale = function (pSpr, rate) {
	var conSize = pSpr.getContentSize().width;
	var scalX = BTG.windowSize.width / conSize * rate;
	return scalX;
}
CDlgMainUI_RBForPhone.prototype.flashExp = function () {
	if (rpgGame.getMainPlayer().getServerData() === null)
		return;
	var level = rpgGame.getClientRole().getLevel();
	var heroSystem = rpgGame.getClientRole().getHeroSystem();
	var maxExp = heroSystem.getLevelExp(level);
	var mainHero = heroSystem.getMainHero();
	var curExp = heroSystem.getMainHero().experience;
	var scale = this.calcXScale(this.m_sprExp, curExp / maxExp);

	this.m_sprExp.runAction(cc.ScaleTo.create(1, scale, 1));
	var pos = cc.p(this.m_sprExp.getContentSize().width * scale, 0);
	BTG.actionUtil.fadeOutWithScaleAndMove(" " + (0 | (curExp / maxExp * 100)) + "%", cc.c3(128, 255, 64), rpgGame.getGameRoot(), pos, 20);
}
CDlgMainUI_RBForPhone.prototype.onCreateFinal = function (param_0) {
	this.m_nMaxWidth = BTG.windowSize.width;

	this.m_maxLeftPoint = this.m_pRoot.convertToNodeSpace(cc.p(0, 0));

	this.m_sprExp = this.find(5543);
	var expDiKuang = this.find(5542);
	expDiKuang.setAnchorPoint(cc.p(0, 0));
	expDiKuang.setScaleX(this.calcXScale(expDiKuang, 1));
	this.m_sprExp.setAnchorPoint(cc.p(0, 0));
	// this.m_sprExp.setBlendFunc(gl.SRC_ALPHA, gl.ONE);
	this.m_sprExp.setScaleX(this.calcXScale(this.m_sprExp, 0.0));
	expDiKuang.setPosition(this.m_maxLeftPoint);
	this.m_sprExp.setPosition(cc.p(this.m_maxLeftPoint.x + 2, this.m_maxLeftPoint.y + 2));
	//
	this.m_backSpr = this.find(5177);
	this.m_backSpr.setAnchorPoint(cc.p(0, 0));
	this.m_backSpr.setPosition(cc.p(this.m_maxLeftPoint.x, this.m_maxLeftPoint.y + 9));
	this.m_backSpr.setScaleX(this.calcXScale(this.m_backSpr, 1));

	this.m_backOrgPos = this.m_backSpr.getPosition();
	this.m_backSizeW = this.m_backSpr.getContentSize().width;
	this.m_backHidePos = cc.p(this.m_backOrgPos.x, -this.m_backSpr.getContentSize().height);
	this.m_backSpr.setPosition(this.m_backHidePos);
	var pOpenButton = this.findButton(320);
	this.m_pMenu.reorderChild(pOpenButton, 99999);

	for (var i = CDlgMainUI_RBForPhone.Tag_MenPai; i >= CDlgMainUI_RBForPhone.Tag_YingXiong; i--) {
		this.m_openBtnList[this.m_openBtnList.length] = this.findButton(i);
	}
	this.m_openBtnList[this.m_openBtnList.length] = this.findButton(CDlgMainUI_RBForPhone.Tag_System);
	this.m_openBtnList[this.m_openBtnList.length] = this.findButton(CDlgMainUI_RBForPhone.Tag_Map);

	/*for (var i = 0; i < this.m_openBtnList.length; i++) {
		this.m_openBtnOrgPosList[this.m_openBtnOrgPosList.length] = this.m_openBtnList[i].getPosition();
		this.m_openBtnList[i].setPosition(pOpenButton.getPosition());
		this.m_openBtnList[i].setVisible(false);
		this.m_initbtnList[this.m_initbtnList.length] = this.m_openBtnList[i];
	}*/

	this.reset();
	this.flashExp();
}