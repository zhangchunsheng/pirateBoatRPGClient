function CDlgPlayerEditorSubUI() {
	BTG.DlgBase.call(this, this); //继承属性
	this.m_currentHeroId = "";
	this.m_currentItem = null;
	this.m_equipUI = null;
	this.m_itemSize = null;
	this.m_gressBar = null;
};

CDlgPlayerEditorSubUI.prototype = new BTG.DlgBase(); //继承方法

CDlgPlayerEditorSubUI.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bIsTransfromTTF = false;
	var playerDlg = rpgGame.getUIUtil().find("DlgPlayerEditor");
	ret.pParentNode = playerDlg.m_pRoot;
	ret.bIsAutoScale = false;
	this.m_itemSize = playerDlg.m_itemSize;
	return ret;
}

CDlgPlayerEditorSubUI.prototype.onCreateFinal = function (param0) {
	var posRefSpr = this.m_pRoot.getParent().getChildByTag(5062);
	this.setPosition(cc.p(posRefSpr.getPosition().x, posRefSpr.getPosition().y));
	if (param0)
		this.m_currentHeroId = param0;

	UIHelp_TranslateLabels(this.m_pRoot, [271, 272, 273, 274, 275, 276, 277, 278, 279, 286, 287, 5246, 5248]);
	this.findButton(265).setVisible(false);
	this.find(286).setVisible(false);

	this.m_equipUI = new BTG.UIHeroEquip();
	this.m_equipUI.create(this, {
		"0": 254,
		"3": 255,
		"4": 256,
		"1": 257,
		"2": 258,
		"5": 259
	}, 10000);
	this.m_equipUI.setPositionKey("subType");
	this.m_equipUI.enableShareItemState(5245);
	this.m_equipUI.enableItemScale(cc.size(10, 10));

	//[经验条266 left267 mid 268 rig 269]
	var pressBg = this.find(266);
	var gressW = pressBg.getContentSize().width;
	var leftSpr = this.find(267);
	var midSpr = this.find(268);
	var rightSpr = this.find(269);
	this.m_gressBar = BTG.LoadProgress.create(leftSpr, midSpr, rightSpr, gressW);
	var bgPos = pressBg.getPosition();
	var pos = cc.p(bgPos.x - pressBg.getContentSize().width / 2, bgPos.y - leftSpr.getContentSize().height / 2);
	this.m_gressBar.setPosition(pos);
	this.m_pRoot.addChild(this.m_gressBar, 10);
	this.m_pRoot.removeChild(leftSpr, true);
	this.m_pRoot.removeChild(midSpr, true);
	this.m_pRoot.removeChild(rightSpr, true);
	var expLbl = this.find(270);
	expLbl.setColor(cc.green());
	this.m_gressBar.expLbl = expLbl;
	var _this = this;
	this.m_gressBar.setText = function () {
		_this.m_gressBar.expLbl.setString(arguments[0]);
	}
}

//[装备54 -59] [卸装264][解雇 265]
CDlgPlayerEditorSubUI.prototype.onShow = function (bIsShow, param0) {
	if (!bIsShow) {
		this.m_currentHeroId = "";
		return;
	}
	this.m_currentHeroId = param0;
	this.flash(this.m_currentHeroId);
}

CDlgPlayerEditorSubUI.prototype.flash = function (param0) {
	if (param0 != null)
		this.m_currentHeroId = param0;
	if (this.m_currentHeroId == "")
		this.m_currentHeroId = rpgGame.getClientRole().getMainHero()._id;
	this.setupZhuangBeiUI();
	this.flashExp();
}

//[属性 271-276] //[装备254 -259]
CDlgPlayerEditorSubUI.prototype.setupZhuangBeiUI = function () {
	//属性 //[技能277-5075 天赋 278-5076-5077 位置 279-5231 战斗力285] 
	var heroObj = rpgGame.getClientRole().getHeroSystem().getHeroObject(this.m_currentHeroId);
	var heroDb = heroObj.heroDb_;
	var fightAttr = heroObj.getFightAttrEx();
	UIHelp_SetLabelValue(fightAttr, this.m_pRoot, [280, 281, 282, 283, 284], cc.yellow()); //
	//[等级5247 职业5249]
	var lvLbl = this.find(5247)
	lvLbl.setString(heroDb.level.toString());
	lvLbl.setColor(cc.yellow());
	var zhiYLbl = this.find(5249)
	zhiYLbl.setString(BTG.ProfessionType[heroDb.vocation]);
	zhiYLbl.setColor(cc.yellow());

	//战斗力【战斗力 285】
	this.find(285).setString(fightAttr.sum.toString());
	//[技能277-5075]
	var skillId = heroDb.skillId;
	var skill = dataMgr.find(dataKey.skillTable, skillId);
	this.find(5075).setString(skill.skillName);
	//[位置 279-5231]
	var heroPos = heroDb.position;
	this.find(5231).setString(BTG.FT_HeroPosition[heroPos]);
	//[天赋 278-5076-5077]

	//装备
	//小布局
	//[武器0]        [头盔1]
	//[裤子3]        [衣服2]
	//[鞋子4]        [护腕5]

	this.m_equipUI.clearItems();

	var playerEquips = rpgGame.getClientRole().getHero(this.m_currentHeroId).equipTable; //itemDatas
	if (playerEquips.length == 0) return;

	var tipItems = rpgGame.getItemDataUtil().createTipItemsByTable(playerEquips, this.m_itemSize, 4);
	this.m_equipUI.setItems(tipItems, "subType");
}

CDlgPlayerEditorSubUI.prototype.getPlayerEquips = function (heroId) {
	var playerEquips = rpgGame.getClientRole().getHero(heroId).equipTable;
	return playerEquips;
}
//获取玩家属性值
CDlgPlayerEditorSubUI.prototype.getPlayerAttrValue = function (heroId, key) {
	var playerFightAttr = rpgGame.getClientRole().getHero(heroId).extraAttr;
	if (playerFightAttr[key] != null) return playerFightAttr[key];
	return null;
}
//[卸装264][解雇 265]
CDlgPlayerEditorSubUI.prototype.onButtonDown = function (pSend) {
	var tag = pSend.getTag();
	var playerEditor = rpgGame.getUIUtil().find("DlgPlayerEditor");
	if (tag === 264) {
		//卸装   
		playerEditor.unloadAllEquips(this.m_currentHeroId);
	} else if (tag === 265) {
		//解雇
		playerEditor.removeHero(this.m_currentHeroId);
	}
}
CDlgPlayerEditorSubUI.prototype.onDoubleClick = function (touchItem, touchPos) {
	var playerDlg = rpgGame.getUIUtil().find("DlgPlayerEditor");
	var itemData = touchItem.getUserData();
	var subType = itemData["subType"];

	//var pos = cc.p(touchItem.getParent().getContentSize().width / 2 + 150, touchItem.getPosition().y);

	//var act = cc.Spawn.create
	//    (
	//    cc.ScaleBy.create(0.1, 0.5),
	//    cc.MoveTo.create(0.1, pos),
	//    cc.FadeOut.create(0.1)
	//    )

	//var callback = function () {
	//    return playerDlg.unloadEquip.apply(playerDlg, null, subType);
	//}
	//var act2 = cc.Sequence.create(
	//    act,
	//    cc.CallFunc.create(null, callback)
	//    )
	//touchItem.runAction(act2);
	playerDlg.unloadEquip(null, subType);
}
CDlgPlayerEditorSubUI.prototype.onSpriteClick = function (node, pos) {
	this.m_currentItem = node;
}
CDlgPlayerEditorSubUI.prototype.onHeroEquipEndPress = function (touchSpr, touchPos) {
	rpgGame.getGameRoot().removeChild(touchSpr);

	if (this.m_equipUI.containsPoint(touchPos))
		return;

	var playerDlg = rpgGame.getUIUtil().find("DlgPlayerEditor");
	var itemData = touchSpr.getUserData();
	var subType = itemData["subType"];
	playerDlg.unloadEquip(null, subType);

}
CDlgPlayerEditorSubUI.prototype.activeEquipUIItem = function (isActive, key) {
	this.m_equipUI.setItemStateByKey(isActive ? itemStateMode_Active : itemStateMode_Normal, key);
}

CDlgPlayerEditorSubUI.prototype.flashExp = function (heroid, exp) {
	var heroSys = rpgGame.getClientRole().getHeroSystem();
	var heroDb = heroSys.getHeroObject(this.m_currentHeroId).heroDb_;

	var exp = heroDb.experience;
	var needExp = heroSys.getLevelExp(heroDb.level);
	var val = exp / needExp;
	//if (val > 1) val = 1;
	this.m_gressBar.setValue(val);
	this.m_gressBar.setText(LGG("exp") + exp + "/" + needExp);
}