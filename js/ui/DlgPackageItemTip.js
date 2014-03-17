function CDlgPackageItemTip() {
	BTG.DlgBase.call(this, this); //继承属性
	this.m_tipItem = null;
	this.m_startPos = cc.p(10, 10);
	//this.m_isDlgCreate = false;
	this.m_scroll = null;
	this.m_posArr = [];
	this.m_padding = 5;
	this.m_tipHeight = 760;

	this.m_attrList = [];
	this.m_tempLbls = [];
};

CDlgPackageItemTip.prototype = new BTG.DlgBase(); //继承方法

CDlgPackageItemTip.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bIsTransfromTTF = false;
	ret.bIsClickExternClose = true;
	ret.bIsModel = true;
	ret.bIsAutoScale = false;
	return ret;
}
//[ LblTag 5036 - 5065 ]
CDlgPackageItemTip.prototype.onCreateFinal = function (param_0) {
	var layerRef = this.find(BTG.DefineTag_ScrollLayer);

	var scrollSize = layerRef.getContentSize();
	this.m_scroll = cc.ScrollLayer.create();
	this.m_scroll.setScrollModel(cc.SCROLL_MODEL_VERTICAL);
	this.m_scroll.setContentSize(cc.size(scrollSize.width, BTG.windowSize.height - 15));
	this.m_scroll.setPosition(layerRef.getPosition());

	var children = this.m_pRoot.getChildren();
	var arr = [];
	for (var i = 5036; i < 5066; i++) {
		var node = this.m_pRoot.getChildByTag(i);
		if (node) {
			arr.push(node);
		}
	}
	for (var i = 0; i < arr.length; i++) {
		if (arr[i] instanceof cc.LabelTTF) arr[i].setUserData(arr[i].getString());

		this.m_pRoot.removeChild(arr[i], false);
		this.m_scroll.addChild(arr[i]);
	}
	var icon = this.find(5034);

	this.m_pRoot.removeChild(icon, false);
	this.m_scroll.addChild(icon, 10);

	this.m_pRoot.addChild(this.m_scroll, 100);
}

//[textureTag 5034]
CDlgPackageItemTip.prototype.onShow = function (bIsShow, pickSpr) {
	if (!bIsShow && !(pickSpr instanceof cc.PageTipItem)) return;
	else {
		this.removeExtLbls();
		this.m_tipItem = pickSpr;
		this.flash(pickSpr);

		BTG.actionUtil.showTip(this.m_pRoot, pickSpr.getPosition());
	}
}
CDlgPackageItemTip.prototype.flash = function (pickSpr) {
	this.setPositionByNode(pickSpr);
	this.setupNameAndIcon(pickSpr);
	this.setupTipText(pickSpr);
	this.m_scroll.setDirty();
}
CDlgPackageItemTip.prototype.removeExtLbls = function () {
	for (var i = 0; i < this.m_tempLbls.length; i++) {
		this.m_scroll.removeChild(this.m_tempLbls[i], true);
	}
	this.m_tempLbls.length = 0;
}
CDlgPackageItemTip.prototype.setPositionByNode = function (pickSpr) {
	var itemData = pickSpr.getUserData();
	var localPos = rpgGame.getGameRoot().convertToNodeSpace(pickSpr.getParent().convertToWorldSpace(pickSpr.getPosition()));
	this.setPosition(cc.p(localPos.x + this.m_pRoot.getContentSize().width / 2, BTG.windowSize.height / 2));
}

CDlgPackageItemTip.prototype.setupNameAndIcon = function (pickSpr) {
	var itemData = pickSpr.getUserData();
	var iconSprite = this.findByTag(5034);

	iconSprite.setTexture(pickSpr.getTexture());

	var nameLbl = this.findByTag(5036);
	nameLbl.setString(itemData.name);

	//没有数据临时注释
	var strongLbl = this.findByTag(5037);
	//if (itemData.strengthen && !pickSpr.isInTempPackage() && !itemDataUtil.canTypeStack(itemData.type)) {
	//    strongLbl.setString(itemData.strengthen.toString());
	//}
	strongLbl.setVisible(false);
}

//[ nameTag 5036 - 5065 ]

CDlgPackageItemTip.prototype.setupTipText = function (pickSpr) {
	var itemData = this.changeItemData(pickSpr.getUserData());

	var maxH = 0;
	var apTag = 0;
	var grpFlag = false;
	this.m_attrList = [];
	for (var tagIdx = 5038; tagIdx < 5066; tagIdx += 2) {
		var isHide = false;
		var nameLbl = this.findByTag(tagIdx);
		var valueLbl = this.findByTag(tagIdx + 1);
		if (valueLbl) {
			var valueKey = valueLbl.getUserData();
			if (itemData[valueKey] == undefined) {
				valueLbl.setVisible(false);
				isHide = true;
			} else {
				var nameLblPos = nameLbl.getPosition();
				if (valueKey == "appendAttrs") {//附加属性
					this.m_attrList.push({
						"tag": tagIdx,
						"childTag": -1
					});
					maxH += (this.m_padding + valueLbl.getContentSize().height);

					var apAttrs = itemData[valueKey];

					for (var key in apAttrs) {
						var apNameLbl = cc.LabelTTF.create(LGG(key) + ":", "Arial", 20);
						apNameLbl.setColor(cc.green());
						apNameLbl.setPosition(cc.p(nameLblPos.x + 10, nameLblPos.y));

						var apValueLbl = cc.LabelTTF.create(apAttrs[key].toString(), "Arial", 20);
						apValueLbl.setPosition(cc.p(nameLblPos.x + apValueLbl.getContentSize().width + 50, nameLblPos.y));
						apValueLbl.setColor(cc.green());

						this.m_scroll.addChild(apNameLbl, 10, apTag);
						this.m_scroll.addChild(apValueLbl, 10, apTag + 1);
						this.m_tempLbls.push(apNameLbl);
						this.m_tempLbls.push(apValueLbl);

						this.m_attrList.push({
							"tag": apTag,
							"childTag": apTag + 1
						});
						apTag += 2;
						maxH += (this.m_padding + apNameLbl.getContentSize().height);
					}
					grpFlag = true;
				} else if (valueKey == "gemCount") {
					if (itemData.gemCount > 0) {
						valueLbl.setString(itemData[valueKey] + "");
						valueLbl.setVisible(true);
						this.m_attrList.push({
							"tag": tagIdx,
							"childTag": tagIdx + 1
						});
						maxH += (this.m_padding + valueLbl.getContentSize().height);

						for (var gem = 0; gem < itemData.gemCount; gem++) {
							var gemLbl = cc.LabelTTF.create("未镶嵌", "Arial", 20);
							gemLbl.setColor(cc.yellow());
							this.m_scroll.addChild(gemLbl, 10, apTag);
							gemLbl.setPosition(cc.p(nameLblPos.x + 10, nameLblPos.y));
							this.m_attrList.push({
								"tag": apTag,
								"childTag": -1
							});
							this.m_tempLbls.push(gemLbl);
							apTag += 1;
							maxH += (this.m_padding + gemLbl.getContentSize().height);
						}

						grpFlag = true;
					} else {
						isHide = true;
						valueLbl.setVisible(false);
					}
				} else {
					this.m_attrList.push({
						"tag": tagIdx,
						"childTag": tagIdx + 1
					});
					valueLbl.setVisible(true);
					valueLbl.setString(itemData[valueKey] + "");

					maxH += (this.m_padding + valueLbl.getContentSize().height);
					grpFlag = true;
				}
			}
		} else if (nameLbl instanceof cc.Sprite) {//分割线  没有右侧值lbl
			var sliceSpr = nameLbl;
			if (!sliceSpr)
				console.log("Error: sliceSpr not find. tag:" + tagIdx);
			else {
				if (grpFlag) {
					grpFlag = false;
					maxH += (this.m_padding + sliceSpr.getContentSize().height);
					sliceSpr.setVisible(true);
					this.m_attrList.push({
						"tag": tagIdx,
						"childTag": -1
					});
				} else {
					sliceSpr.setVisible(false);
				}
			}
			continue;
		}

		//var nameLbl = this.findByTag(tagIdx);
		if (nameLbl) {
			if (isHide)
				nameLbl.setVisible(false);
			else {
				nameLbl.setVisible(true);
				var txt = nameLbl.getUserData();
				if (txt && LGG(txt))
					nameLbl.setString(LGG(txt));
			}
		}
	}
	this.sortItems(maxH);
}
CDlgPackageItemTip.prototype.findItemInTable = function (_id) {
	var itemTable = rpgGame.getMainPlayer().getServerData().itemTable;
	for (var i = 0; i < itemTable.length; i++) {
		var item = itemTable[i];
		if (item._id === _id) return item;
	}
	return null;
}

CDlgPackageItemTip.prototype.sortItems = function (maxH) {
	maxH += 50;
	if (maxH > BTG.windowSize.height)
		maxH = BTG.windowSize.height;
	this.m_pRoot.setContentSize(cc.size(this.m_pRoot.getContentSize().width, maxH));
	this.m_scroll.setContentSize(cc.size(this.m_scroll.getContentSize().width, maxH));
	this.m_scroll.enablePage(maxH);
	var grid9 = this.find(BTG.DefineTag_9Grid);
	grid9.setContentSize(cc.size(grid9.getContentSize().width, maxH));

	var currH = 20;
	// name label

	var itemNameLbl = this.findByTag(5036);
	var strongLbl = this.findByTag(5037);
	itemNameLbl.setPosition(cc.p(itemNameLbl.getPosition().x, maxH - (this.m_padding + itemNameLbl.getContentSize().height / 2) - 20));
	strongLbl.setPosition(cc.p(strongLbl.getPosition().x, maxH - (this.m_padding + strongLbl.getContentSize().height / 2) - 20));
	currH += itemNameLbl.getContentSize().height + this.m_padding;

	//icon
	var icon = this.findByTag(5034);
	icon.setPosition(cc.p(icon.getPosition().x, maxH - icon.getContentSize().height / 2 - 20));

	for (var i = 0; i < this.m_attrList.length; i++) {
		var tagObj = this.m_attrList[i];
		var nameLbl = this.findByTag(tagObj["tag"]);
		if (nameLbl && nameLbl.isVisible()) {
			nameLbl.setPosition(cc.p(nameLbl.getPosition().x, maxH - (currH + nameLbl.getContentSize().height / 2)));

			if (tagObj.childTag > 0) {
				var valueLbl = this.findByTag(tagObj.childTag);
				if (valueLbl) {
					valueLbl.setPosition(cc.p(valueLbl.getPosition().x, maxH - (currH + nameLbl.getContentSize().height / 2)));
				}
			}
			currH += this.m_padding + nameLbl.getContentSize().height;
		}
	}
}
CDlgPackageItemTip.prototype.findByTag = function (tag) {
	return this.m_scroll._childRootNode.getChildByTag(tag);
}
CDlgPackageItemTip.prototype.onTouchBegin = function () {
	this.show(false);
}

CDlgPackageItemTip.prototype.changeItemData = function (itemData, key) {
	var _ = require("underscore")
	var data = _.clone(itemData);

	data.vocation = BTG.ProfessionType[itemData.vocation];
	data.type = BTG.EquipmentType[itemData["type"]];
	//武器技能还没有
	//itemData.itemSkill = (dataMgr.find(dataKey.skillTable, itemData.itemSkill).skillName);
	return data;
}