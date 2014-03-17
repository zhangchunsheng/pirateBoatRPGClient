function copySpriteMoveTo(orgSprite, parRoot, vPos) {
	var pSpr = cc.Sprite.createWithTexture(orgSprite.getTexture());
	var newPos = orgSprite.getPosition();
	newPos.x += vPos.x;
	newPos.y += vPos.y;
	pSpr.setPosition(newPos);
	parRoot.addChild(pSpr, orgSprite.getZOrder(), orgSprite.getTag());
	return pSpr;
}

function sSingleButton() {
	this.Ctrl_DiKuang = 0;
	this.Ctrl_TTF = 1;
	this.Ctrl_Lock = 2;
	this.Ctrl_AutoFight = 3;
	this.Ctrl_XingDiKuang = 4;
	this.Ctrl_Xing = 9;
	this.Ctrl_Count = 14;

	this.m_pCtrl = new Array(this.Ctrl_Count);

	this.m_huiIdx = -1;
	this.type = "lock"; //"lock", "open", "opened"
	this.create = function (rootNode, templateCtrl, szType, sceneId, huiIdx, starCount, vPos) {
		assert(huiIdx !== -1);
		this.m_huiIdx = huiIdx;

		if (rpgGame.getMainPlayer().getServerData() === null)
			return;
		var sceneIni = rpgGame.getData().find(dataKey.mapTable, sceneId);
		var playerLev = rpgGame.getClientRole().getMainHero().level;

		this.type = szType;
		switch (this.type) {
			case "lock":
				//只显示锁
				this.m_pCtrl[this.Ctrl_Lock] = copySpriteMoveTo(templateCtrl.m_pCtrl[this.Ctrl_Lock], rootNode, vPos);
				this.m_pCtrl[this.Ctrl_Lock].notTouch = true;
				break;
			case "open":
				//打开，但没打通关
			case "opened":
				//打开，通过关，显示扫荡（自动战斗）+星
				this.m_pCtrl[this.Ctrl_DiKuang] = copySpriteMoveTo(templateCtrl.m_pCtrl[this.Ctrl_DiKuang], rootNode, vPos);
				this.m_pCtrl[this.Ctrl_TTF] = copyTTF(templateCtrl.m_pCtrl[this.Ctrl_TTF]);
				this.m_pCtrl[this.Ctrl_TTF].setPosition(cc.p(vPos.x, vPos.y));
				this.m_pCtrl[this.Ctrl_TTF].setString(sceneIni.mapName);
				this.m_pCtrl[this.Ctrl_TTF].notTouch = true;
				rootNode.addChild(this.m_pCtrl[this.Ctrl_TTF], 9999);

				if (this.type === "opened") {
					this.m_pCtrl[this.Ctrl_AutoFight] = copySpriteMoveTo(templateCtrl.m_pCtrl[this.Ctrl_AutoFight], rootNode, vPos);
					this.m_pCtrl[this.Ctrl_AutoFight].setVisible(false);
					for (var i = 0; i < 5; i++) {
						this.m_pCtrl[this.Ctrl_XingDiKuang + i] = copySpriteMoveTo(
						templateCtrl.m_pCtrl[this.Ctrl_XingDiKuang + i], rootNode, vPos);
						this.m_pCtrl[this.Ctrl_XingDiKuang + i].notTouch = true;
					}
					for (var i = 0; i < starCount; i++) {
						this.m_pCtrl[this.Ctrl_Xing + i] = copySpriteMoveTo(
						templateCtrl.m_pCtrl[this.Ctrl_Xing + i], rootNode, vPos);
						this.m_pCtrl[this.Ctrl_Xing + i].notTouch = true;
					}
				}
				break;
		}

		for (var i = 0; i < this.Ctrl_Count; i++) {
			if (this.m_pCtrl[i] === undefined)
				continue;
			this.m_pCtrl[i].setUserData(this);
		}
	}

	this.show = function (bIsShow) {
		for (var i = 0; i < this.Ctrl_Count; i++) {
			if (this.m_pCtrl[i] === undefined)
				continue;
			this.m_pCtrl[i].setVisible(bIsShow);
		}
	}
	this.del = function () {
		for (var i = 0; i < this.Ctrl_Count; i++) {
			if(this.m_pCtrl[i] === undefined)
				continue;
			this.m_pCtrl[i].getParent().removeChild(this.m_pCtrl[i], true);
		}
		this.m_pCtrl.length = 0;
	}
};

function CDlgMinLevel() {//小关卡对话框
	BTG.DlgBase.call(this, this); //继承属性
	this.m_pTemp = new sSingleButton();
	this.m_pCtrlList = new Array();
	this.m_posList = new Array(40);
	this.m_pScrollLayer = null;

	this.m_curZhangId = -1;
	this.m_pNavigationSpr = null;
};

CDlgMinLevel.prototype = new BTG.DlgBase(); //继承方法

CDlgMinLevel.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bIsClickExternClose = true;
	ret.bIsModel = true;
	ret.m_bIsOpenHideScene = true;
	return ret;
}

CDlgMinLevel.prototype.callback = function (pSenderSpr) {
	var userData = pSenderSpr.getUserData();
	if (userData === null) return;
	if (userData.m_pCtrl[userData.Ctrl_AutoFight] === pSenderSpr) {
		//cc.alert("zi dong zhang dou not");
	} else {
		var chapSys = rpgGame.getClientRole().getChapterSystem();
		chapSys.preEnterCustoms(this.m_curZhangId, userData.m_huiIdx);
		this.show(false);
	}
}
CDlgMinLevel.prototype.onCreateFinal = function (param0_n) {
	this.find(5555).setVisible(false);
	this.m_pScrollLayer = UIHelp_CreateScrollFormLayer(this.m_pRoot, this.find(BTG.DefineTag_ScrollLayer));
	this.m_pScrollLayer.enableTouchChild(this, this.callback);

	this.m_pScrollLayer.enablePage(this.m_pScrollLayer.getContentSize().width);

	this.m_pTemp.m_pCtrl[this.m_pTemp.Ctrl_DiKuang] = this.find(4808);
	var orgPos = this.m_pTemp.m_pCtrl[this.m_pTemp.Ctrl_DiKuang].getPosition();

	this.m_pTemp.m_pCtrl[this.m_pTemp.Ctrl_TTF] = this.find(4810);
	this.m_pTemp.m_pCtrl[this.m_pTemp.Ctrl_Lock] = this.find(4988);

	this.m_pTemp.m_pCtrl[this.m_pTemp.Ctrl_AutoFight] = this.find(4812);
	for (var i = 0; i < 5; i++) {
		this.m_pTemp.m_pCtrl[this.m_pTemp.Ctrl_Xing + i] = this.find(4813 + i);
		this.m_pTemp.m_pCtrl[this.m_pTemp.Ctrl_XingDiKuang + i] = this.find(5234 + i);
	}
	for (var i = 0; i < this.m_pTemp.Ctrl_Count; i++) {
		var newPos = this.m_pTemp.m_pCtrl[i].getPosition();
		newPos.x -= orgPos.x;
		newPos.y -= orgPos.y;
		this.m_pTemp.m_pCtrl[i].setPosition(newPos);
	}

	//star
	//设置位置
	this.m_pTemp.show(false);

	var rightPos = this.find(4821).getPosition();
	var bottomPos = this.find(4822).getPosition();
	this.findDel([4821, 4822]);

	var lieStrip = rightPos.x - orgPos.x;
	var hangStrip = orgPos.y - bottomPos.y;
	var pageStrip = this.m_pScrollLayer.getContentSize().width;

	for (var ye = 0; ye < 4; ye++) {
		var startPos = cc.p(orgPos.x + ye * pageStrip, orgPos.y);
		for (var line = 0; line < 2; line++) {
			for (var lie = 0; lie < 5; lie++) {
				this.m_posList[ye * 2 * 5 + line * 5 + lie] = cc.p(startPos.x + lie * lieStrip, startPos.y - line * hangStrip);
			}
		}
	}
}
CDlgMinLevel.prototype.onShow = function (bIsShow, zhangIndexParam) {
	if (this.m_pNavigationSpr) {
		this.m_pNavigationSpr.getParent().removeChild(this.m_pNavigationSpr, true);
		this.m_pNavigationSpr = null;
	}

	if (rpgGame.getClientRole() === null)
		return;

	if (bIsShow === false)
		return;
	for (var i = 0; i < this.m_pCtrlList.length; i++) {
		this.m_pCtrlList[i].del();
	}
	this.m_pCtrlList.length = 0;

	var zhangID = zhangIndexParam[0];
	this.m_curZhangId = zhangID;
	var curZhangData = rpgGame.getClientRole().getChapterSystem().getChapter(this.m_curZhangId); //取server数据
	var curZhangData_Length = 0;
	if (curZhangData !== undefined)
		curZhangData_Length = curZhangData.length;
	var allZhangData = rpgGame.getData().find(dataKey.chapter, zhangID); //取客户端数据
	assert(zhangID === allZhangData.resId);
	var curDaoHangIdx = -1;
	this.m_pCtrlList.length = allZhangData.mapId.length;
	for (var i = 0; i < allZhangData.mapId.length; i++) {
		this.m_pCtrlList[i] = new sSingleButton();
		var starCount = undefined;
		var szTypeState = null;
		if (i > curZhangData_Length) szTypeState = "lock";
		else if (i === curZhangData_Length) {
			if (i === 0 || (i > 0 && curZhangData[i - 1].finish)) szTypeState = "open";
			else szTypeState = "lock";
		} else {
			if (curZhangData[i].fightIndex > 2) {//当前图怪物都打过了
				szTypeState = "opened";
				starCount = curZhangData[i].star;
			} else
				szTypeState = "open";
		}

		// rootNode, templateCtrl, szType, sceneId, huiIdx, statCount, vPos
		this.m_pCtrlList[i].create(this.m_pScrollLayer, this.m_pTemp,
		szTypeState,
		allZhangData.mapId[i], i,
		starCount,
		this.m_posList[i]);

		//导航
		if (zhangIndexParam.length > 1) {
			if (zhangIndexParam[1] === i) {
				curDaoHangIdx = i;
			}
		}
	}

	if (zhangIndexParam.length > 1) {//有提示
		if (curDaoHangIdx === -1)
			cc.alert("导航 索引没找到 zhang id:" + zhangIndexParam[0] + "jieId:" + zhangIndexParam[1]);

		this.m_pNavigationSpr = BTG.ProxySprite.create("res/icon/kejie.png", this.m_pScrollLayer,
		this.m_posList[curDaoHangIdx], BTG.GZOrder_Effect);
		var action = cc.Blink.create(5000, 8000);
		this.m_pNavigationSpr.preAction(action);

		curPage = 0 | ((curDaoHangIdx) / 10);
		if (curPage > 0)
			this.m_pScrollLayer.scrollTo(-curPage * this.m_pScrollLayer.getContentSize().width, 0);
	}
}