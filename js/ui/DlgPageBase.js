function DlgPageBase() {
	BTG.DlgBase.call(this, this); //继承属性

	this.m_currType = 0;
	this.m_padding;

	this.m_row = 4;
	this.m_column = 4;
	this.m_itemSize = cc.size(64, 64);
	this.m_itemBgTexture = null;
	this.m_itemActiveTexture = null;
	this.m_scrollPage = null;

	this.m_radioBox = null;

	this.m_dragItem = null;

	this.m_prevBtnTag = -1;
	this.m_nextBtnTag = -1;
	this.m_pageLblTag = -1;

	this.m_tipDlg = null;
	//    this.m_refScrollTag = 10000;
};

DlgPageBase.prototype = new BTG.DlgBase(); //继承方法

//派生覆盖
DlgPageBase.prototype.init = function () {}
DlgPageBase.prototype.onCreate = function (param_0) {}
DlgPageBase.prototype.createToggleList = function (param_0) {} //必须设置按钮的tag 指向物品类型
DlgPageBase.prototype.onSpriteClick = function (touchSpr, pos) {}
DlgPageBase.prototype.onButtonClick = function (touchSpr) {}
DlgPageBase.prototype.onDoubleClick = function (touchSpr, touchPos) {
	return null;
}
DlgPageBase.prototype.onPressItem = function (node, touchPos) {}
DlgPageBase.prototype.onEndPressItem = function (touchPos) {}
DlgPageBase.prototype.onClickToggleBtn = function (node, idx) {}


DlgPageBase.prototype.onCreateFinal = function (param_0) {
	this.init();
	this.createScroll();
	this.createToggleList(param_0);
	this.setupToggleList();
	this.onCreate(param_0);
}

DlgPageBase.prototype.createScroll = function () {
	if (!this.m_scrollPage)
		return;

	var scroll = cc.ScrollLayerPage.createWithLayer(this.m_scrollPage);

	this.m_scrollPage = scroll;

	this.m_scrollPage.setCallbackFunc(this, this.onPageChange, this.spriteClick, this.doubleClick, this.pressItem, this.endPressItem, this.touchMove);
	this.m_scrollPage.setPageGrid(this.m_row, this.m_column, this.m_itemSize, this.m_padding);
	this.m_scrollPage.setItemTextures(this.m_itemBgTexture, this.m_itemActiveTexture, null, this.m_itemBgTexture);

	this.m_pRoot.addChild(this.m_scrollPage, 100);

}

DlgPageBase.prototype.setScrollItems = function (items, currPage) {
	this.m_scrollPage.setItems(items, currPage);
}

DlgPageBase.prototype.setupToggleList = function () {
	if (!this.m_radioBox)
		return;
	if (this.m_radioBox.m_callbackObj == null)
		this.m_radioBox.m_callbackObj = this;
	if (this.m_radioBox.m_callbackFunc == null)
		this.m_radioBox.m_callbackFunc = this.onClickRadioBtn;
}

DlgPageBase.prototype.onTouchBegin = function (touchPoint) {
	if (this.m_radioBox)
		this.m_radioBox.touchBegin(touchPoint);
	return true;
}

DlgPageBase.prototype.touchMove = function (touchPos) {
	if (this.m_dragItem) this.m_dragItem.setPosition(rpgGame.getGameRoot().convertToNodeSpace(touchPos));
}

DlgPageBase.prototype.doubleClick = function (touchSpr, touchPos) {
	this.m_dragItem = BTG.actionUtil.copyItem(touchSpr);

	if (!this.m_dragItem)
		return;

	var clickCallback = this.onDoubleClick(touchSpr, touchPos);

	if (!clickCallback)
		clickCallback = this.removeDragSprite;
	var act = cc.Sequence.create(
	cc.ScaleBy.create(0.05, 1.3),
	cc.FadeOut.create(0.5),
	cc.CallFunc.create(this, clickCallback));

	this.m_dragItem.runAction(act);
}

DlgPageBase.prototype.onClickRadioBtn = function (node, idx) {
	var tagPick = node.getTag();
	if (tagPick != this.m_currType) {
		this.m_currType = tagPick;
		this.m_scrollPage._currentPage = -1; // 初始翻到0页
		this.flash();
	}
	this.onClickToggleBtn(node, idx);
}

DlgPageBase.prototype.onButtonDown = function (pSend) {
	if (this.m_tipDlg)
		this.m_tipDlg.show(false);

	this.pageButtonDown(pSend.getTag());
	this.onButtonClick(pSend);
}

DlgPageBase.prototype.pageButtonDown = function (tag) {
	if (tag == this.m_prevBtnTag) {//上一页
		this.m_scrollPage.nextPage(1);
	} else if (tag == this.m_nextBtnTag) {//下一页
		this.m_scrollPage.nextPage(-1);
	}
}

DlgPageBase.prototype.pressItem = function (node, pos) {
	//this.CreateDragSprite(node);
	this.m_dragItem = BTG.actionUtil.copyItem(node);
	this.onPressItem(node, pos);
}

DlgPageBase.prototype.endPressItem = function (touchPos) {
	this.onEndPressItem(this.m_dragItem, touchPos);
	this.removeDragSprite();
}

DlgPageBase.prototype.spriteClick = function (touchSpr, pos) {
	if (touchSpr && touchSpr instanceof cc.PageTipItem)
		this.m_tipDlg = touchSpr.showTip();
	this.onSpriteClick(touchSpr, pos);
}

DlgPageBase.prototype.onPageChange = function (pageTxt) {
	this.find(this.m_pageLblTag).setString(pageTxt);
}

DlgPageBase.prototype.onMouseWheel = function (delta) {
	this.m_scrollPage.nextPage(delta);
}

DlgPageBase.prototype.removeItemByTag = function (tag, cleanUp) {
	this.removeChildByTag(tag, cleanUp);
}

DlgPageBase.prototype.getChildById = function (id) {
	var children = this.m_scrollPage.getChildren();
	if (children && children.length > 0) {
		for (var i = 0; i < children.length; i++) {
			if (children[i] instanceof cc.PageItemBase && children[i].getUserData()._id == id)
				return children[i];
		}
	}
	return null;
}

DlgPageBase.prototype.activeItemById = function (id, isActive) {
	var node = this.getChildById(id);
	if (node) this.m_scrollPage.setItemActive(node, isActive);
}

DlgPageBase.prototype.disableItemById = function (id, isDisable) {
	var node = this.getChildById(id);
	if (node) this.m_scrollPage.setItemDisable(node, isDisable);
}

DlgPageBase.prototype.removeDragSprite = function () {
	if (this.m_dragItem) rpgGame.getGameRoot().removeChild(this.m_dragItem);
}

DlgPageBase.prototype.getCurrentPage = function () {
	return this.m_scrollPage._currentPage;
}