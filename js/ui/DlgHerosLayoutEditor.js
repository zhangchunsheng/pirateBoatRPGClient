function CDlgHerosLayoutEditor() {
	BTG.DlgBase.call(this, this);
	this.m_leftScroll = null;
	this.m_equipUI = null;
	this.m_rightScroll = null;

	this.m_keys = ["0", "1", "2", "3", "4", "5", "6"];
	this.m_positionSystem = null;

	this.m_heroListStateCtrl = null;
	this.m_skillListStateCtrl = null;
	this.m_itemTouchCtrl = null;

	this.m_pressedHeroItem = null;
	this.m_pressedSkillItem = null;

	this.m_skillBg = null;
	this.m_skillSPr = null;
}
CDlgHerosLayoutEditor.prototype = new BTG.DlgBase(); //继承方法

CDlgHerosLayoutEditor.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bIsOpenHideScene = true;
	return ret;
}
CDlgHerosLayoutEditor.prototype.onCreateFinal = function () {
	this.m_leftScroll = this.createScrollBySprites(this.find(10000), this.find(5208), this.find(5209), cc.SCROLL_MODEL_VERTICAL);
	this.m_leftScroll.enableTouchChild(this, this.onSkillItemClick, this.onSkillItemhDoubleClick, this.onSkillItemPress, this.onSkillItemEndPress, this.onSkillItemDragMove)

	this.m_equipUI = new BTG.UIHeroEquip();
	this.m_equipUI.create(this, {
		"0": [5252, 5280, 5251],
		"1": [5254, 5281, 5253],
		"2": [5256, 5282, 5255],
		"3": [5258, 5283, 5257],
		"4": [5260, 5284, 5259],
		"5": [5262, 5285, 5261],
		"6": [5264, 5286, 5263]
	}, 10001);

	this.m_skillBg = this.find(5212); //UIHelp_ReplaceCtrl(this.m_equipUI.m_scroll, this.m_pRoot, 5212);


	this.m_rightScroll = this.createScrollBySprites(this.find(10002), this.find(5210), this.find(5211), cc.SCROLL_MODEL_VERTICAL);
	this.m_rightScroll.enableTouchChild(this, this.onHeroItemClick, null, this.onHeroItemPress, this.onHeroItemEndPress, this.onHeroItemDragMove);

	var ClientPositionSystem = require("/game/clientPositionSystem");
	this.m_positionSystem = rpgGame.getClientRole().getPositionSystem();
	var _this = this;
	this.m_positionSystem.on(ClientPositionSystem.eventChangeHeroPosition, function () {
		_this.onFlashLayoutList.apply(_this, arguments);
	})
	this.m_positionSystem.on(ClientPositionSystem.eventRemoveHero, function () {
		_this.onFlashLayoutList.apply(_this, arguments);
	})

	var ClientRole = require("/game/clientRole");
	rpgGame.getClientRole().on(ClientRole.eventSelectSkill, function () {
		_this.onFlashSkillUI.apply(_this, arguments);
	});
	this.m_skillListStateCtrl = new BTG.ItemStateControl();
	this.m_heroListStateCtrl = new BTG.ItemStateControl();

	this.m_itemTouchCtrl = new BTG.ItemTouchControl();
	//this.m_itemTouchCtrl.SetFunctions(this, this.onHeroItemClick, null, this.onHeroItemPress, this.onHeroItemEndPress);
}

CDlgHerosLayoutEditor.prototype.onShow = function (isShow) {
	if (!isShow) return;

	//heroList 
	this.flashHeroListUI();

	//setup skillSpr
	this.flashSkillListUI();

	//mid layout
	this.flashLayoutUI();

	this.flashSkillBox();

	BTG.actionUtil.showWindow(this.m_pRoot);
}

CDlgHerosLayoutEditor.prototype.flashLayoutUI = function () {
	var posSys = rpgGame.getClientRole().getPositionSystem();
	var currCount = posSys.currentCount_;
	this.find(5536).setString(currCount + "/5");

	var items = this.createHeroLayoutItems();
	this.m_equipUI.setItems(items, "posIdx");
}

CDlgHerosLayoutEditor.prototype.createHeroLayoutItems = function () {
	var positions = rpgGame.getClientRole().roleDb_.positions;

	var arr = [];
	for (var i = 0; i < positions.length; i++) {
		if (positions[i] != null) {
			var hero = rpgGame.getClientRole().getHero(positions[i]);
			hero.posIdx = i;
			var tag = this.getActiveSprTagByPos(i);
			var pItem = cc.PagePlayerItem.create(cc.size(50, 128), hero.resId); // cc.PagePlayerItem.createWithTexture(this.find(tag).getTexture());
			pItem._tipId = null;
			pItem.setUserData(hero);
			arr.push(pItem);
		}
	}
	return arr;
}

CDlgHerosLayoutEditor.prototype.flashSkillBox = function () {
	if (this.m_skillSPr)
		this.m_pRoot.removeChild(this.m_skillSPr, true);

	var mainHero = rpgGame.getClientRole().getMainHero();
	var skill = dataMgr.find(dataKey.skillTable, mainHero.skillId);
	var skillLbl = cc.LabelTTF.create(skill.skillName, "Arial", 20);

	var skillItem = this.getSkillItemById(mainHero.skillId)
	this.m_skillSPr = skillItem.copy(this.m_pRoot);
	this.m_skillSPr.setZOrder(BTG.GZOrder_Top);
	this.m_skillSPr.addChild(skillLbl);
	skillLbl.setPosition(cc.p(this.m_skillSPr.getContentSize().width / 2, -17));
	this.m_skillSPr.setPosition(this.m_skillBg.getPosition());

	this.m_skillListStateCtrl.setItemState(skillItem, itemStateMode_Active);
}

//[5490 框]
CDlgHerosLayoutEditor.prototype.flashHeroListUI = function () {
	//this.m_rightScroll._childRootNode.removeAllChildrenWithCleanup(true);
	var arr = [];
	var heros = rpgGame.getClientRole().getHeroSystem().heros_;
	var positions = rpgGame.getClientRole().roleDb_.positions;

	var chuzhanFlag = this.find(5271);
	for (var i = 0; i < heros.length; i++) {
		var hero = heros[i];
		var tipSpr = cc.PagePlayerItem.createWithTexture(this.find(5210).getTexture());
		tipSpr.setUserData(hero);
		tipSpr._playerResId = hero.resId;
		//tipSpr._tipId = "";
		var activeSpr = cc.Sprite.createWithTexture(chuzhanFlag.getTexture());
		tipSpr._activeSpr = activeSpr;

		tipSpr.addChild(activeSpr, 500);
		activeSpr.setPosition(cc.p(0, 0));

		if (positions.indexOf(hero._id) != -1) {
			activeSpr.setVisible(true);
			tipSpr.notTouch = true;
		} else activeSpr.setVisible(false);

		arr.push(tipSpr);
	}

	//arr.push(chuzhanFlag);

	this.m_rightScroll._childRootNode.removeAllChildrenWithCleanup(true);
	this.setScrollItems(this.m_rightScroll, arr);
	this.m_heroListStateCtrl.setItems(arr);

	this.m_itemTouchCtrl.setItems(arr);
}
CDlgHerosLayoutEditor.prototype.flashSkillListUI = function () {
	this.m_leftScroll._childRootNode.removeAllChildrenWithCleanup(true);
	var activeSpr = cc.Sprite.createWithTexture(this.find(5270).getTexture());
	activeSpr.notTouch = true;
	this.m_leftScroll.addChild(activeSpr);

	var skillTable = rpgGame.getClientRole().roleDb_.skillTable;
	var arr = [];
	for (var i = 0; i < skillTable.length; i++) {
		var skillId = skillTable[i];
		var skill = dataMgr.find(dataKey.skillTable, skillId);
		var tipItem = cc.PageTipItem.createWithTexture(this.find(5208).getTexture());
		tipItem.setUserData(skill);
		tipItem._tipId = "DlgSkillItemTip";
		var lbl = cc.LabelTTF.create(skill.skillName, "Arial", 20);
		tipItem.addChild(lbl);
		lbl.setPosition(cc.p(tipItem.getContentSize().width / 2, -17));
		arr.push(tipItem);
	}

	this.setScrollItems(this.m_leftScroll, arr);

	this.m_skillListStateCtrl.setItems(arr);
	this.m_skillListStateCtrl.enableShareState(activeSpr)
}

CDlgHerosLayoutEditor.prototype.getSkillItemById = function (id) {
	var skillSprs = this.m_leftScroll.getChildren();
	for (var i = 0; i < skillSprs.length; i++) {
		if (skillSprs[i] instanceof cc.PageItemBase)
			if (skillSprs[i].getUserData().resId == id) {
				return skillSprs[i];
			}
	}
}

CDlgHerosLayoutEditor.prototype.activeSkillItemById = function (resId) {
	var item = this.getSkillItemById(resId);
	this.m_skillListStateCtrl.setItemState(item, itemStateMode_Active);
}

CDlgHerosLayoutEditor.prototype.createScrollBySprites = function (layer, refSpr1, refSpr2, direction) {
	var parNode = layer.getParent();
	var togPadding = refSpr2.getPosition().y - refSpr1.getPosition().y;
	var scroll = UIHelp_CreateScrollFormLayer(parNode, layer);
	var startPos = scroll.convertToNodeSpace(parNode.convertToWorldSpace(refSpr1.getPosition()));

	scroll.m_padding = togPadding;
	scroll.m_startPos = startPos;

	if (direction != undefined) scroll.setScrollModel(direction);

	refSpr1.setVisible(false);
	refSpr2.setVisible(false);
	return scroll;
}


CDlgHerosLayoutEditor.prototype.setScrollItems = function (scroll, itemArr) {
	if (!scroll)
		return;
	var refBox = this.find(5490);
	var startPos = scroll.m_startPos;
	for (var i = 0; i < itemArr.length; i++) {
		var pos = cc.p(startPos.x, startPos.y + i * scroll.m_padding);

		var bgBox = cc.Sprite.createWithTexture(refBox.getTexture());
		bgBox.setPosition(pos);
		bgBox.notTouch = true;
		scroll.addChild(bgBox);

		scroll.addChild(itemArr[i]);
		itemArr[i].setPosition(pos);
	}
	scroll.setDirty();
}

CDlgHerosLayoutEditor.prototype.onHeroEquipPressItem = function (touchSpr) {
	if (!touchSpr)
		return;
	var heroData = touchSpr.getUserData();
	var uiKeys = this.getKeysByPosIdx(heroData.position); // [前0 中1 后2]
	//for (var i = 0; i < uiKeys.length;i++)
	//   this.m_equipUI.setItemStateByKey(itemStateMode_Active, uiKeys[i]);

	for (var j = 0; j < this.m_keys.length; j++) {
		var key = this.m_keys[j];
		if (uiKeys.indexOf(key) === -1)
			this.m_equipUI.setItemStateByKey(itemStateMode_Disable, key);
	}
}

CDlgHerosLayoutEditor.prototype.onHeroEquipEndPress = function (touchSpr, touchPos) {
	if (touchSpr == null)
		return;

	this.m_equipUI.resetItemsState();
	var heroData = touchSpr.getUserData();
	var uiKeys = this.getKeysByPosIdx(heroData.position);

	var isDrop = false;
	if (this.m_equipUI.containsPoint(touchPos)) {
		var dragPos = this.m_equipUI.m_scroll.convertToNodeSpace(touchPos);
		var dragRect = new cc.Rect(dragPos.x, dragPos.y, 64, 64);

		var bgs = this.m_equipUI.getItemsByKeys(uiKeys);
		for (var i = 0; i < bgs.length; i++) {
			var bgRect = bgs[i].getBoundingBox();
			if (cc.Rect.CCRectContainsPoint(bgRect, dragPos)) {
				isDrop = true;
				//if (this.m_positionSystem.isHerosMax())
				//    gamePrompt("武将出战数量达到上限！");
				//else
				{
					this.m_positionSystem.preChangeHeroPosition(heroData._id, parseInt(uiKeys[i]))
				}
				break;
			}
		}
	}
	if (!isDrop && this.m_pressedHeroItem == null) {
		var docId = touchSpr.getUserData()._id;
		this.removeHeroFromLayout(docId);
	}
	rpgGame.getGameRoot().removeChild(touchSpr);

	return isDrop;
}

CDlgHerosLayoutEditor.prototype.getActiveSprTagByPos = function (posIdx) {
	if (posIdx === 0) return 5280; // ["0"];
	else if (posIdx < 4) return 5281; // ["1", "2", "3"];
	else return 5284; // ["4", "5", "6"];
}
CDlgHerosLayoutEditor.prototype.getKeysByPosIdx = function (posIdx) {
	if (posIdx === 0) return ["0"];
	else if (posIdx === 1) return ["1", "2", "3"];
	else return ["4", "5", "6"];
}

CDlgHerosLayoutEditor.prototype.removeHeroFromLayout = function (docId) {
	if (isMainPlayer(docId)) {
		gamePrompt("主将不能下阵！");
		return;
	}
	this.m_positionSystem.preRemoveHero(docId);
}

CDlgHerosLayoutEditor.prototype.onFlashLayoutList = function (docId, index) {
	this.flashLayoutUI();
	this.flashHeroListUI();
}

CDlgHerosLayoutEditor.prototype.onFlashSkillUI = function (skillId) {
	this.flashSkillBox();
	this.activeSkillItemById(skillId);
}

CDlgHerosLayoutEditor.prototype.onHeroItemPress = function (touchSpr) {
	if(touchSpr._currentState === itemStateMode_Active)
		return;

	this.m_dragHeroItem = touchSpr.copy(rpgGame.getGameRoot());
	this.onHeroEquipPressItem(touchSpr);
	this.m_pressedHeroItem = touchSpr;
	var pos = rpgGame.getGameRoot().convertToNodeSpace(touchSpr.getParent().convertToWorldSpace(touchSpr.getPosition()));
	this.m_dragHeroItem.setPosition(pos);
}

CDlgHerosLayoutEditor.prototype.onHeroItemClick = function (touchSpr) {
	//BTG.actionUtil.pressAction(touchSpr);
}
CDlgHerosLayoutEditor.prototype.onHeroItemDragMove = function (touchPos) {
	if (this.m_dragHeroItem) {
		this.m_dragHeroItem.setPosition(rpgGame.getGameRoot().convertToNodeSpace(touchPos));
	}
}

CDlgHerosLayoutEditor.prototype.onHeroItemEndPress = function (touchPos) {
	rpgGame.getGameRoot().removeChild(this.m_dragHeroItem);
	this.onHeroEquipEndPress(this.m_dragHeroItem, touchPos);
	//if (this.onHeroEquipEndPress(this.m_dragHeroItem, touchPos))
	//{
	//    this.m_heroListStateCtrl.setItemState(this.m_pressedHeroItem, itemStateMode_Active);
	//}
	this.m_pressedHeroItem = null;
}

CDlgHerosLayoutEditor.prototype.onSkillItemClick = function (touchSpr) {
	if (touchSpr instanceof cc.PageTipItem) touchSpr.showTip();
}

CDlgHerosLayoutEditor.prototype.onSkillItemhDoubleClick = function (touchSpr, touchPos) {
	var skillId = touchSpr.getUserData().resId;
	rpgGame.getClientRole().preSelectSkill(skillId);
}


CDlgHerosLayoutEditor.prototype.onSkillItemPress = function (touchSpr) {
	if (touchSpr._currentState === itemStateMode_Active)
		return;

	this.m_dragSkillItem = touchSpr.copy(rpgGame.getGameRoot());
	this.m_dragSkillItem.setZOrder(BTG.GZOrder_Top);
	this.m_pressedSkillItem = touchSpr;
	this.m_dragSkillItem.setScale(1.2);
	this.m_dragSkillItem.setOpacity(180);
}

CDlgHerosLayoutEditor.prototype.onSkillItemEndPress = function (touchPos) {
	var localPos = this.m_pRoot.convertToNodeSpace(touchPos);
	var rect = this.m_skillBg.getBoundingBox();
	if (cc.Rect.CCRectContainsPoint(rect, localPos)) {
		rpgGame.getClientRole().preSelectSkill(this.m_dragSkillItem.getUserData().resId);
	}
	rpgGame.getGameRoot().removeChild(this.m_dragSkillItem);
}

CDlgHerosLayoutEditor.prototype.onSkillItemDragMove = function (touchPos) {
	if (this.m_dragSkillItem) {
		this.m_dragSkillItem.setPosition(rpgGame.getGameRoot().convertToNodeSpace(touchPos));
	}
}
CDlgHerosLayoutEditor.prototype.scrollContainsPoint = function (scroll, point) {
	var rect = scroll.getBoundingBox();
	var localPos = scroll.getParent().convertToNodeSpace(point);
	if (cc.Rect.CCRectContainsPoint(rect, localPos)) {
		return true;
	}
	return false;
}
//CDlgHerosLayoutEditor.prototype.onTouchBegin = function(touchPos) {
//    this.m_itemTouchCtrl.touchBegin(touchPos);
//}
//CDlgHerosLayoutEditor.prototype.onTouchEnd = function (touchPos) {
//    this.m_itemTouchCtrl.touchEnd(touchPos);
//}
//CDlgHerosLayoutEditor.prototype.onTouchMove = function (offset,touchPos) {
//    this.m_itemTouchCtrl.touchMove(touchPos);
//}