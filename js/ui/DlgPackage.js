function CDlgPackage() {
	DlgPageBase.call(this, this); //继承属性
	this.m_saleMode = false;
	this.m_currPick = null;
	this.m_packSystem = null;
};

CDlgPackage.prototype = new DlgPageBase(); //继承方法
CDlgPackage.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bIsOpenHideScene = true;
	ret.bIsAutoScale = false;

	return ret;
}
//派生覆盖
CDlgPackage.prototype.init = function () {
	this.m_prevBtnTag = 4964;
	this.m_nextBtnTag = 4965;
	this.m_pageLblTag = 4966;
	//this.m_padding = 14;
	this.m_row = 4;
	this.m_column = 4;

	var refItem = this.find(1);

	this.m_itemBgTexture = refItem.getTexture();
	this.m_itemActiveTexture = this.find(5024).getTexture(); //this.find(5024).setVisible(true);
	this.m_itemSize = refItem.getContentSize();

	this.m_scrollPage = this.find(BTG.DefineTag_ScrollLayer);
}

//scrollLayerTag 10000;  容量：4961  个数 4962（1/500）    4964(prevBtn) 4966(page) 4965（nextBtn）出售：4963  
// [leftBtns 5025 - 5031 activeSpr 5032 ]   选中框 5024

CDlgPackage.prototype.createToggleList = function () {
	var toggleSprs = [];
	for (var i = 5025; i < 5032; i++) {
		var toggle = this.find(i);
		toggle.setTag(i - 5025);
		toggleSprs.push(toggle);
	}
	this.m_radioBox = new BTG.Radiobox();
	this.m_radioBox.create(0, this.find(5032), null, null, toggleSprs);
}

CDlgPackage.prototype.onShow = function (bIsShow) {// lefttag 4841  box tag 1  num 4969  
	if (bIsShow == false) {
		rpgGame.getUIUtil().DlgHide("DlgSale");
		rpgGame.getUIUtil().DlgHide("DlgPackageItemTip");
		rpgGame.getItemDataUtil().unRegistFlashDlg(this);
		return;
	}
	this.m_currType = 0;
	this.m_radioBox.activeBoxByIdx(0);
	rpgGame.getItemDataUtil().registFlashDlg(this);
	this.flash();

	BTG.actionUtil.showWindow(this.m_pRoot);
}

CDlgPackage.prototype.flash = function (tArray) {
	var itemMgr = rpgGame.getItemDataUtil();

	var sprArr = itemMgr.getTipItemWithNumByType(this.m_currType, this.m_itemSize);
	this.setScrollItems(sprArr);

	var rongLiangStr = "";
	if (this.m_currType === 6)
		rongLiangStr = itemMgr.getTempItemCount() + "/" + itemMgr.maxTempItemCount;
	else
		rongLiangStr = itemMgr.getItemCount() + "/" + itemMgr.MaxItemCount;
	this.find(4961).setString(LGG("rongliang") + ":" + rongLiangStr);

	if (this.m_saleMode) {
		var saleDlg = rpgGame.getUIUtil().find("DlgSale");
		var saleItemsDb = saleDlg.getItemsData();
		if (saleItemsDb && saleItemsDb.length > 0) for (var i = 0; i < saleItemsDb.length; i++) {
			this.activeItemById(saleItemsDb[i]._id, true);
		}
	}
}

CDlgPackage.prototype.onDoubleClick = function (touchItem, touchPos) {
	if (!(touchItem instanceof cc.PageItemBase))
		return;
	var wpData = touchItem.getUserData();
	var clickCallback = null;
	if (this.m_saleMode) {
		this.addItemToSaleList(touchItem);
	} else if (touchItem._isInTempPackage) {
		rpgGame.getItemDataUtil().exportToPackage(wpData._id);
	} else {
		// rpgGame.getItemDataUtil().getItemData(touchItem._type, touchItem._id);
		if (resId < 0) {
			console.log("package DblClick touchItem's tag < 0");
			return;
		}

		var itemType = wpData.type;
		var resId = wpData.resId;
		var subType = wpData.subType;
		//itemType=[1 5] 装备界面  
		if (itemType === BTG.GItemType_Equipment || itemType === BTG.GItemType_Food) {
			var packageDlg = this;
			clickCallback = function () {
				var playerDlg = rpgGame.getUIUtil().add("DlgPlayerEditor", itemType);
				packageDlg.show(false);
				packageDlg.removeDragSprite();
			}
		} else if (itemType === BTG.GItemType_Props) {//0
			if (subType === 0 || subType === 3) {
				//直接使用 弹出数量界面
				var itemUseInfo = rpgGame.getItemDataUtil().IsItemCanUse(touchItem);
				if (itemUseInfo == "ok") {
					var count = 0;
					var numWin = rpgGame.getUIUtil().add("DlgNumberInput", this);

					this.m_currPick = touchItem;
					if (subType === 3) {
						//+buff[buffId]

					}
				} else {
					BTG.actionUtil.fadeOutWithScaleAndMove(itemUseInfo);
				}
			} else if (subType === 1 || subType === 2) {
				//打开界面[winId]
				var winId = wpData.uiId;
				var packageDlg = this;
				clickCallback = function () {
					var playerDlg = rpgGame.getUIUtil().add(winId, itemType);
					packageDlg.show(false);
					packageDlg.removeDragSprite();
				}
			}
		} else if (itemType === BTG.GItemType_Material) {//winid 
			
		}
	}
	return clickCallback;
}

CDlgPackage.prototype.onEndPressItem = function (touchSpr, touchPos) {
	if (this.m_saleMode) {
		var saleDlg = rpgGame.getUIUtil().find("DlgSale");
		var saleWinRect = saleDlg.m_pRoot.getBoundingBox();
		if (cc.Rect.CCRectContainsPoint(saleWinRect, touchPos)) this.addItemToSaleList(touchSpr);
		this.removeDragSprite();
	} else {
		var winRect = this.m_pRoot.getBoundingBox();
		if (!cc.Rect.CCRectContainsPoint(winRect, touchPos)) {
			if (this.m_dragItem instanceof cc.PageItemBase) {
				rpgGame.getItemDataUtil().removeItem(this.m_dragItem);
			}
		}
	}
}

CDlgPackage.prototype.onButtonClick = function (pSend) {
	if (pSend.getTag() == 4963) {//出售列表
		if (this.m_currType == 6) {
			rpgGame.getItemDataUtil().exportToPackage();
		} else {
			var saleDlg = rpgGame.getUIUtil().add("DlgSale");
			this.setSaleMode(true);
		}
	}
}

CDlgPackage.prototype.onClickToggleBtn = function (node, idx) {
	var lbl = this.find(5175)
	if (node.getTag() == 6) {
		lbl.setString("一键入包");
	} else {
		lbl.setString("批量出售");
	}
}
CDlgPackage.prototype.addItemToSaleList = function (item) {
	if (!item || !item instanceof cc.PageItemBase) return;
	var saleDlg = rpgGame.getUIUtil().find("DlgSale");

	var isAdd = saleDlg.addItem(item);
	this.activeItemById(item.getUserData()._id, isAdd);
}

CDlgPackage.prototype.setSaleMode = function (bMode) {
	this.m_saleMode = bMode;
	if (!bMode) {
		this.m_scrollPage.setAllItemsState(false);
	}
}

CDlgPackage.prototype.delItemData = function (item) {
	//var udata = item.getUData();
	//rpgGame.getItemDataUtil().removeFromServerData(udata[eItemUserDataIdx.Id], this.m_currType);
}
CDlgPackage.prototype.useItem = function (num) {
	if (num > 0) {
		var uId = rpgGame.getMainPlayer().getID();
		rpgGame.getItemDataUtil().useItem(uId, this.m_currPick._resId, num);
	}
}
CDlgPackage.prototype.setWinOffset = function (offsetX) {
	this.m_uiAttr.pos.x = offsetX;
	this._WindowSizeChange();
}