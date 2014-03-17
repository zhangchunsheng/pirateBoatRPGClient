function CDlgSale() {
	BTG.DlgBase.call(this, this); //继承属性

	this.m_itemList = [];
	this.m_padding = 40;
	this.m_startPos = cc.p(0, 0);
	this.m_itemSize = cc.size(0, 0);
	this.m_scroll = null;
};

CDlgSale.prototype = new BTG.DlgBase(); //继承方法

CDlgSale.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bIsAutoScale = false;
	return ret;
}

//tag:[ listBg 5001   itemName 5002  itemNum 5003 ]
CDlgSale.prototype.onCreateFinal = function () {
	//var titleLbl = this.find(4997); 
	//titleLbl.setString(LGG("piliangchushou"));

	var refItemSpr = this.find(5001);
	this.m_itemSize = refItemSpr.getContentSize();

	var layerRef = this.find(10000);
	var scrollSize = layerRef.getContentSize();

	this.m_scroll = cc.ScrollLayer.create();
	this.m_scroll.setScrollModel(cc.SCROLL_MODEL_VERTICAL);
	this.m_scroll.setContentSize(scrollSize);
	this.m_scroll.setPosition(layerRef.getPosition());

	this.m_padding = refItemSpr.getContentSize().height;

	this.m_pRoot.addChild(this.m_scroll, 100);
	this.m_startPos = this.m_scroll.convertToNodeSpace(this.m_pRoot.convertToWorldSpace(refItemSpr.getPosition()));

	//var pos = this.getPosition();
	//pos.x -= this.m_pRoot.getContentSize().width / 2+5;
	//this.setPosition(pos);

}
CDlgSale.prototype.onShow = function (bIsShow) {
	var packageDlg = rpgGame.getUIUtil().find("DlgPackage");
	var pos = cc.p(BTG.windowSize.width / 2, BTG.windowSize.height / 2);

	var saleDlgSize = this.m_pRoot.getContentSize();
	var pkgDlgSize = packageDlg.m_pRoot.getContentSize();

	var tPos1 = cc.p(pos.x - saleDlgSize.width / 2, pos.y);
	var tPos2 = cc.p(tPos1.x + (saleDlgSize.width + pkgDlgSize.width) / 2, pos.y);

	if (!bIsShow) {
		if (packageDlg) {
			packageDlg.setSaleMode(false);
			BTG.actionUtil.moveTo(packageDlg.m_pRoot, tPos1, pos);
		}
		this.clean();
		rpgGame.getItemDataUtil().unRegistFlashDlg(this);
	} else {
		rpgGame.getItemDataUtil().registFlashDlg(this);
		BTG.actionUtil.moveTo(packageDlg.m_pRoot, pos, tPos1);
		BTG.actionUtil.moveTo(this.m_pRoot, pos, tPos2);
	}
}
CDlgSale.prototype.flash = function () {
	this.clean();
}
CDlgSale.prototype.clean = function () {
	this.m_scroll._childRootNode.removeAllChildrenWithCleanup(true);
	this.m_itemList = [];
}

//param0: [_id,resId,name,num,type]

CDlgSale.prototype.addItem = function (pickItem) {
	var itemData = pickItem.getUserData();
	var idx = this.findItem(itemData._id);
	if (idx >= 0) {
		this.removeItem(idx);
		return false;
	} else {
		var newPosY = this.m_startPos.y - this.m_padding * this.m_itemList.length;
		var itemSpr = cc.PageItemBase.createWithTexture(this.find(5001).getTexture());

		itemSpr.setPosition(cc.p(this.m_scroll.getContentSize().width / 2, newPosY));
		this.m_scroll.addChild(itemSpr, 10);
		itemSpr.setUserData(itemData);

		var newNameLbl = cc.LabelTTF.create(itemData.name, "Arial", 20);
		newNameLbl.setPosition(cc.p(newNameLbl.getContentSize().width / 2, this.m_padding / 2));
		var count = itemData.count != undefined ? itemData.count : 1;
		var newNumLbl = cc.LabelTTF.create(count, "Arial", 20);
		newNumLbl.setPosition(cc.p(itemSpr.getContentSize().width - 20, this.m_padding / 2));

		itemSpr.addChild(newNameLbl, 11, 0);
		itemSpr.addChild(newNumLbl, 11, 1);

		this.pushItemObj(itemData._id, itemData.type);
		return true;
	}

}
CDlgSale.prototype.findItem = function (itemId) {
	for (var i = 0; i < this.m_itemList.length; i++) {
		if (this.m_itemList[i].docId == itemId) return i;
	}
	return -1;
}

CDlgSale.prototype.removeItem = function (idx) {
	var docId = this.m_itemList[idx].docId;
	var children = this.m_scroll.getChildren()
	//for (var i = 0; i < children.length; i++)
	//{
	//    if(children[i].getUserData() == docId)
	//    {
	//        this.m_scroll._childRootNode.removeChild(children[i]);
	//    }
	//}
	this.m_scroll._childRootNode.removeChild(children[idx]);
	this.m_itemList.splice(idx, 1);

	this.sortItems();
}

CDlgSale.prototype.pushItemObj = function (id, _type) {
	var obj = {
		docId: id,
		type: _type
	};
	this.m_itemList.push(obj);
}
CDlgSale.prototype.sortItems = function () {
	var children = this.m_scroll.getChildren();
	if (children && children.length > 0) for (var i = 0; i < children.length; i++) {
		children[i].setPosition(cc.p(children[i].getPosition().x, this.m_startPos.y - this.m_padding * i));
	}
}

CDlgSale.prototype.onButtonDown = function (pSend) {
	if (pSend.getTag() == 4999) {
		if (this.m_itemList.length == 0)
			return;
		if (this.m_itemList.length > 1) {
			rpgGame.getItemDataUtil().sellItemList(this.m_itemList);
		} else {
			rpgGame.getItemDataUtil().sellItem(this.m_itemList[0]);
		}
	}
}

CDlgSale.prototype.getChildren = function () {
	return this.m_scroll.getChildren();
}
CDlgSale.prototype.getItemsData = function () {
	return this.m_itemList;
}