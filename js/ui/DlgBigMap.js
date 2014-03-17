function CDlgBigMap() {
	BTG.DlgBase.call(this, this); //继承属性

	this.m_pScrollLayer = null;
	this.m_zhangBtnList = new Array();
	this.m_ctrlNewPlayer = null;
	this.m_ctrlMainCity = null;

	this.m_pNavigationSpr = null;
	this.m_navigationZhang = -1;
	this.m_navigationJie = -1;
	this.m_runTime = 0;

	this.m_pHeroImage = null;

	this.m_state = "no";
	this.m_targetTag = -1;
};
CDlgBigMap.XSCCeHuaId = 0;


CDlgBigMap.ZhangCount = 1;
CDlgBigMap.prototype = new BTG.DlgBase(); //继承方法

CDlgBigMap.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bIsClickExternClose = true;
	ret.bIsModel = true;
	ret.m_bIsOpenHideScene = true;
	return ret;
}
CDlgBigMap.prototype.onCreateFinal = function (param0_n) {
	this.m_pScrollLayer = UIHelp_CreateScrollFormLayer(this.m_pRoot, this.find(BTG.DefineTag_ScrollLayer));
	this.m_pScrollLayer.enableTouchChild(this, this.callback);

	UIHelp_ReplaceCtrl(this.m_pScrollLayer, this.m_pRoot, 100); //新手村
	this.m_ctrlNewPlayer = this.m_pScrollLayer.getChildByTag(100);
	for (var i = 0; i < CDlgBigMap.ZhangCount; i++) {
		this.m_zhangBtnList[this.m_zhangBtnList.length] = UIHelp_ReplaceCtrl(this.m_pScrollLayer, this.m_pRoot, i); //章节图标
	}

	var pBk = UIHelp_ReplaceCtrl(this.m_pScrollLayer, this.m_pRoot, 4793); //背景
	pBk.notTouch = true;
}

CDlgBigMap.prototype.setupNavigation = function (bIsShow) {
	if (this.m_pNavigationSpr) {
		this.m_pNavigationSpr.getParent().removeChild(this.m_pNavigationSpr, true);
		this.m_pNavigationSpr = null;
	}
	if (bIsShow === false) {
		rpgGame.getUIUtil().getNavigation().stop();
		this.m_navigationZhang = -1;
		this.m_navigationJie = -1;
		return;
	}

	// navigation
	//没处理新手村，主城，副本
	var pNavigation = rpgGame.getUIUtil().getNavigation();
	if (pNavigation.m_curState === "toDoor") {
		this.m_navigationZhang = pNavigation.m_data0;
		this.m_navigationJie = pNavigation.m_data1;
		pNavigation.stop();

		//添加章导航提示
		var pCtrl = null;
		for (var i = 0; i < this.m_zhangBtnList.length; i++) {
			var tag = this.m_zhangBtnList[i].getTag();

			if (this.m_navigationZhang === tag) {
				pCtrl = this.m_zhangBtnList[i];
				break;
			}
		}
		if (pCtrl === null)
			cc.alert("map not find zhangId:" + this.m_navigationZhang);

		this.m_pNavigationSpr = BTG.ProxySprite.create("res/icon/kejie.png", this.m_pScrollLayer,
		pCtrl.getPosition(), BTG.GZOrder_Effect);
		var action = cc.Blink.create(3, 10);
		this.m_pNavigationSpr.preAction(action);

		this.m_state = "toZhang";
		this.m_pHeroImage.setMoveTargetForTime(pCtrl.getPosition(), 1);
	}
}
CDlgBigMap.prototype.onShow = function (bIsShow) {
	this.m_runTime = 0;
	this.m_state = "no";

	if (this.m_pHeroImage)
		rpgGame.getCharacterUtil().delForObject(this.m_pHeroImage);
	this.m_pHeroImage = null;
	if (bIsShow === false) {
		return;
	} else {
		//hero 
		var heroPos = this.m_ctrlNewPlayer.getPosition();
		var curSceneCeHuaId = rpgGame.getGameScene().getGameID();
		if (CDlgBigMap.XSCCeHuaId === curSceneCeHuaId)
			heroPos = this.m_ctrlNewPlayer.getPosition();
		else {//主城
		}
		var pHero = rpgGame.getMainPlayer();
		this.m_pHeroImage = rpgGame.getCharacterUtil().createUICharacter(pHero.getResID(),
		heroPos, pHero.m_pImage.getEqList(), this.m_pScrollLayer);
		this.m_pHeroImage.notTouch = true;
	}
	this.setupNavigation(bIsShow);

	if (rpgGame.getMainPlayer().getServerData() === null)
		return;

	var playerLev = rpgGame.getClientRole().getMainHero().level;
	var iZhang = 0;

	while (1) {
		var iniData = rpgGame.getData().find(dataKey.chapter, iZhang);
		if (iniData == null) break;

		this.m_zhangBtnList[iZhang].setVisible(iniData.needLevel <= playerLev);
		iZhang++;
	}
}

CDlgBigMap.prototype.onUpdate = function (dt) {
	if (this.m_state === "toZhang") {
		this.m_runTime += dt;
		if (this.m_runTime > 1) {
			this.m_state = "no";
			this.m_runTime = 0;
			this.show(false);
			var target = this.m_navigationZhang !== -1 ? [this.m_navigationZhang, this.m_navigationJie] : [this.m_targetTag];
			this.m_navigationZhang = -1;
			rpgGame.getUIUtil().add("DlgMinLevel", target);
		}
	}
}
CDlgBigMap.prototype.callback = function (pSender) {
	this.m_navigationZhang = -1;
	this.m_runTime = 0;
	var tag = pSender.getTag();
	if (tag < 100) {//章节
		this.m_targetTag = tag;
		this.m_state = "toZhang";
		this.m_pHeroImage.setMoveTargetForTime(this.m_zhangBtnList[tag].getPosition(), 1);
	} else if (tag === 100) {
		this.show(false); //返回主城，啥也不做
	}
}