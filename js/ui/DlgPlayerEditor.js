function CDlgPlayerEditor() {
	DlgPageBase.call(this, this); //继承属性
	this.m_rightToggle = null;
	this.m_midToggle = null;
	this.m_heroSystem = null;
	this.m_heroScroll = null;
	this.m_currentHeroId = null;

	this.m_currentItem = null;
	this.m_playerPosHold = null;
	this.m_currentSubUI = null;

	this.m_actorRender = null;

	this.m_filteMode = false;
	this.m_midTag = 0;

	this.zhuangBeiTag = 408;
	this.shipinTag = 409;
	this.xiangQingTag = 410;

	this.shiPinIdx = 5;
	this.zhuangBeiIdx = 1;
};

CDlgPlayerEditor.prototype = new DlgPageBase(); //继承方法

DlgPageBase.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bIsOpenHideScene = true;
	ret.bIsAutoScale = false;
	ret.bIsModel = true;
	return ret;
}
//派生覆盖
CDlgPlayerEditor.prototype.init = function () {
	this.m_prevBtnTag = 419;
	this.m_nextBtnTag = 250;
	this.m_pageLblTag = 251;
	//this.m_padding = 15;
	this.m_row = 3;
	this.m_column = 4;

	var refItem = this.find(401);
	this.m_itemBgTexture = refItem.getTexture();
	this.m_itemSize = refItem.getContentSize(); // cc.size(86,86);

	this.m_scrollPage = this.find(BTG.DefineTag_ScrollLayer);

	this.m_heroSystem = rpgGame.getClientRole().getHeroSystem();
	var _this = this;
	var ClientHeroSystem = require("/game/clientHeroSystem")
	this.m_heroSystem.on(ClientHeroSystem.eventRefreshEquipList, function () {
		_this.onFlashEquipList.apply(_this, arguments);
	});
	this.m_heroSystem.on(ClientHeroSystem.eventRefreshHeroList, function () {
		_this.onFlashHeroList.apply(_this, arguments);
	});
	this.m_heroSystem.on(ClientHeroSystem.eventExpChange, function () {
		_this.onFlashHeroExp.apply(_this, arguments);
	});

	rpgGame.getItemDataUtil().registFlashDlg(this);

}

//leftToggleBtn[5144 5145]active 5160   midToggleBtn[408 409 410]active 5161  rightToggleBtn[406 407]active 5162
CDlgPlayerEditor.prototype.createToggleList = function (param0) {
	//rightToggle[itemPage]
	var tog0 = this.find(406);
	tog0.setTag(1);
	var tog1 = this.find(407);
	tog1.setTag(0);
	var toggleSprs = [tog0, tog1];

	this.m_radioBox = new BTG.Radiobox();
	this.m_radioBox.create(0, this.find(5162), null, null, toggleSprs);

	//leftToggle
	this.createHeroList();
	//midToggle
	this.createMidToggle();
}
CDlgPlayerEditor.prototype.getRadioBoxIdxByType = function (tag) {
	//radioBtnsTag[1,5..]
	if (tag === 0) return 1;
	else if (tag === 5 || tag === 1) return 0;
}
//[subUIPosTag 5062]  [装备 1 tag 406 ][饰品5 407]  [page 419 251 250]
CDlgPlayerEditor.prototype.onCreate = function (param0) {// param_0 = itemType
	if (param0 != undefined) {
		this.m_currType = param0;
	} else
		this.m_currType = this.zhuangBeiIdx;
	this.addSubUI();
}
CDlgPlayerEditor.prototype.addSubUI = function () {
	this.m_currentSubUI = rpgGame.getUIUtil().add("DlgPlayerEditorSubUI", this.m_currentHeroId, true);
	var playerDlgSub2 = rpgGame.getUIUtil().add("DlgPlayerEditorSubUI2", null, false);
	var playerDlgSub3 = rpgGame.getUIUtil().add("DlgPlayerEditorSubUI3", null, false);
	this.m_uiAttr.childWindowList_DlgBase = [this.m_currentSubUI, playerDlgSub2, playerDlgSub3];

}
CDlgPlayerEditor.prototype.onShow = function (bIsShow, param0) {
	if (!bIsShow) {
		var playerDlgSub = rpgGame.getUIUtil().find("DlgPlayerEditorSubUI");
		var playerDlgSub2 = rpgGame.getUIUtil().find("DlgPlayerEditorSubUI2");
		var playerDlgSub3 = rpgGame.getUIUtil().find("DlgPlayerEditorSubUI3");
		playerDlgSub.show(false);
		playerDlgSub2.show(false);
		playerDlgSub3.show(false);
		rpgGame.getItemDataUtil().unRegistFlashDlg(this);

		if (this.m_actorRender) {
			rpgGame.getCharacterUtil().delForObject(this.m_actorRender);
			this.m_actorRender = null;
		}
		return;
	}

	this.m_currentHeroId = rpgGame.getClientRole().getMainHero()._id;
	//主角
	this.createPlayer();

	this.addSubUI();
	if (param0 != undefined) {
		this.m_currType = param0;
		var radioBoxIdx = this.getRadioBoxIdxByType(this.m_currType);
		this.m_radioBox.activeBoxByIdx(radioBoxIdx);
	}
	this.flash(param0);
}

CDlgPlayerEditor.prototype.flash = function (param0) {
	if (param0 != undefined) {
		this.m_currType = param0;
	}
	var sprArr = [];
	if (this.m_filteMode) sprArr = this.getFilte();
	else sprArr = rpgGame.getItemDataUtil().getTipItemWithNumByType(this.m_currType, this.m_itemSize, true);
	this.setScrollItems(sprArr);
}

CDlgPlayerEditor.prototype.onTouchBegin = function (touchPoint) {
	if(this.m_radioBox)
		this.m_radioBox.touchBegin(touchPoint);
	if(this.m_midToggle)
		this.m_midToggle.touchBegin(touchPoint);
	if(this.m_leftToggle)
		this.m_leftToggle.touchBegin(touchPoint);
	return true;
}
CDlgPlayerEditor.prototype.onEndPressItem = function (touchItem, touchPos) {
	var scrollRect = this.m_scrollPage.getBoundingBox();
	var winRect = this.m_pRoot.getBoundingBox();
	var subUIRect = this.m_currentSubUI.m_pRoot.getBoundingBox();
	var localPos = this.m_pRoot.convertToNodeSpace(touchPos);
	if (cc.Rect.CCRectContainsPoint(winRect, rpgGame.getGameRoot().convertToNodeSpace(touchPos))) {
		if (this.canChangeEquipUI()) {
			if (cc.Rect.CCRectContainsPoint(subUIRect, localPos)) {
				this.changeEquip(touchItem.getUserData()._id);
			}
		}
	} else rpgGame.getItemDataUtil().removeItem(touchItem);

	if (this.canChangeEquipUI()) this.m_currentSubUI.activeEquipUIItem(false, touchItem.getUserData().subType);
}
CDlgPlayerEditor.prototype.onPressItem = function (touchSpr, touchPos) {
	var itemData = touchSpr.getUserData();
	if (this.canChangeEquipUI()) //详情界面不需要激活item
	{
		var key = itemData.subType;
		this.m_currentSubUI.activeEquipUIItem(true, key);
	}
}

CDlgPlayerEditor.prototype.onDoubleClick = function (touchItem, pos) {
	if (!(touchItem instanceof cc.PageItemBase)) return;

	this.changeEquip(touchItem.getUserData()._id);
	//...
}

//
CDlgPlayerEditor.prototype.onLeftToggle = function (node) {
	//update wujiang info
	//var subUI = rpgGame.getUIUtil().find("DlgPlayerEditorSubUI");

	this.m_currentHeroId = node.getUserData();
	this.m_currentSubUI.flash(this.m_currentHeroId);
	if (this.m_midTag != this.xiangQingTag)
		this.createPlayer();

	if (this.m_midTag === this.zhuangBeiTag) {
		this.m_currentSubUI.findButton(265).setVisible(!this.isMainPlayer());
		this.m_currentSubUI.find(286).setVisible(!this.isMainPlayer());
	}
}

CDlgPlayerEditor.prototype.onMidToggle = function (node) {
	if (this.m_currentSubUI)
		this.m_currentSubUI.show(false);

	this.m_midTag = node.getTag();

	if (this.m_midTag == this.zhuangBeiTag) {
		this.m_currentSubUI = rpgGame.getUIUtil().add("DlgPlayerEditorSubUI", this.m_currentHeroId, true);
		this.createPlayer();
	} else if (this.m_midTag == this.shipinTag) {
		this.m_currentSubUI = rpgGame.getUIUtil().add("DlgPlayerEditorSubUI2", this.m_currentHeroId, true);
		this.createPlayer();
	} else if (this.m_midTag == this.xiangQingTag) {
		this.m_currentSubUI = rpgGame.getUIUtil().add("DlgPlayerEditorSubUI3", this.m_currentHeroId, true);
		if (this.m_actorRender) {
			rpgGame.getCharacterUtil().delForObject(this.m_actorRender);
			this.m_actorRender = null;
		}
	}
}
CDlgPlayerEditor.prototype.createHeroList = function () {
	if (this.m_heroScroll) {
		this.m_heroScroll._childRootNode.removeAllChildrenWithCleanup(false);
	} else {
		var heroScrollLayer = this.find(10001);
		this.m_heroScroll = UIHelp_CreateScrollFormLayer(this.m_pRoot, heroScrollLayer);
		this.m_heroScroll.setScrollModel(cc.SCROLL_MODEL_VERTICAL);
	}

	var refSpr1 = this.find(5144);
	var refSpr2 = this.find(5145);
	var togPadding = refSpr2.getPosition().y - refSpr1.getPosition().y;
	var startPos = this.m_heroScroll.convertToNodeSpace(this.m_pRoot.convertToWorldSpace(refSpr1.getPosition()));
	refSpr1.setVisible(false);
	refSpr2.setVisible(false);

	var heroTable = this.m_heroSystem.heros_;
	var toggleSprs = [];
	for (var i = 0; i < heroTable.length; i++) {
		var heroDb = heroTable[i];

		toggleSprs[i] = cc.Sprite.createWithTexture(refSpr1.getTexture());
		toggleSprs[i].setPosition(cc.p(startPos.x, startPos.y + togPadding * i));
		toggleSprs[i].setUserData(heroDb._id);
		var lbl1 = cc.LabelTTF.create(heroDb.name, "Arial", 20);

		lbl1.setPosition(toggleSprs[i].getPosition());
		this.m_heroScroll.addChild(toggleSprs[i], 10);
		this.m_heroScroll.addChild(lbl1, 100);
	}

	var refActiveSpr = this.find(5160);
	var togLFlagSpr = cc.Sprite.createWithTexture(refActiveSpr.getTexture()); //toggle activeSpr

	this.m_heroScroll.addChild(togLFlagSpr, refActiveSpr.getZOrder(), refActiveSpr.getTag());
	this.m_leftToggle = new BTG.Radiobox();
	this.m_leftToggle.create(0, togLFlagSpr, this, this.onLeftToggle, toggleSprs);

	this.m_currentHeroId = rpgGame.getClientRole().getMainHero()._id;
	this.createPlayer();
}

CDlgPlayerEditor.prototype.createMidToggle = function (itemId) {
	var togM0 = this.find(408); //装备
	this.m_midTag = 408;
	var togM1 = this.find(409); //饰品 416
	var shiPinLbl = this.find(416);
	var togM2 = this.find(410); //详情 417
	var xqLbl = this.find(417)

	var playerLev = rpgGame.getClientRole().getMainHero().level;
	var toggleSprs = []
	if (playerLev < 60) {
		togM1.setVisible(false);
		shiPinLbl.setVisible(false);
		togM2.setPosition(togM1.getPosition());
		xqLbl.setPosition(togM1.getPosition());
		toggleSprs = [togM0, togM2];
	} else toggleSprs = [togM0, togM1, togM2];

	this.m_midToggle = new BTG.Radiobox();
	this.m_midToggle.create(0, this.find(5161), this, this.onMidToggle, toggleSprs);
}

CDlgPlayerEditor.prototype.changeEquip = function (itemId) {
	this.m_heroSystem.preChangeEquip(this.m_currentHeroId, itemId);
}

CDlgPlayerEditor.prototype.removeHero = function (heroId) {
	this.m_heroSystem.preRemoveHeroByDocId(heroId);
}

CDlgPlayerEditor.prototype.unloadEquip = function (heroId, idx) {
	this.m_heroSystem.preUnloadEquip(heroId ? heroId : this.m_currentHeroId, idx);
}

CDlgPlayerEditor.prototype.unloadAllEquips = function (heroId) {
	if (heroId) this.m_currentHeroId = heroId;
	this.m_heroSystem.preUnloadAllEquip(heroId ? heroId : this.m_currentHeroId);
}

CDlgPlayerEditor.prototype.onFlashHeroList = function (param0) {
	this.createHeroList();
	this.m_currentSubUI.flash(this.m_currentHeroId);
}

CDlgPlayerEditor.prototype.onFlashEquipList = function (param0) {
	this.flash();
	this.m_currentSubUI.flash(this.m_currentHeroId);

	if (this.isMainPlayer() && this.m_midTag != this.xiangQingTag) {
		rpgGame.getMainPlayer().FlashEq();
		this.createPlayer();
	}
}

CDlgPlayerEditor.prototype.onFlashHeroExp = function (heroId, exp) {
	if (!this.isShow()) return;
	if (this.m_currentSubUI == rpgGame.getUIUtil().find("DlgPlayerEditorSubUI")) {
		this.m_currentSubUI.flashExp(heroId, exp);
	}
}

CDlgPlayerEditor.prototype.isMainPlayer = function () {
	return this.m_currentHeroId == rpgGame.getClientRole().getMainHero()._id;
}

CDlgPlayerEditor.prototype.createPlayer = function () {
	if (this.m_actorRender) {
		rpgGame.getCharacterUtil().delForObject(this.m_actorRender);
		this.m_actorRender = null;
	}
	var resId = rpgGame.getClientRole().getHero(this.m_currentHeroId).resId;
	var arr6 = null;
	if (this.isMainPlayer())
		arr6 = getHeroEquipArray(this.m_currentHeroId);
	var pos = this.find(5224).getPosition();
	this.m_actorRender = rpgGame.getCharacterUtil().createUICharacter(resId, pos, arr6, this.m_pRoot);
	this.m_actorRender.lockZorder(true, BTG.GZOrder_Top);
}

CDlgPlayerEditor.prototype.onButtonClick = function (pSend) {
	var tag = pSend.getTag();
	if (tag == 404) {
		this.m_filteMode = !this.m_filteMode;
		this.flash();
	}
}
CDlgPlayerEditor.prototype.getFilte = function (pSend) {
	var packageSystem = rpgGame.getClientRole().getPackSystem();
	var itemTable = packageSystem.getFilterItems(this.m_currType, this.m_currentHeroId);
	var place = this.m_currType === 6 ? itemIn_TempPackage : itemIn_Package;
	var sprArr = rpgGame.getItemDataUtil().createTipItemsByTable(itemTable, this.m_itemSize, place, true);
	return sprArr;
}

CDlgPlayerEditor.prototype.canChangeEquipUI = function () {
	return (this.m_currType === this.zhuangBeiIdx || this.m_currType === this.shiPinIdx) && this.m_midTag != this.xiangQingTag;
}