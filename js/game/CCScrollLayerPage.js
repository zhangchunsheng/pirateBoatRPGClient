cc.ScrollLayerPage = cc.ScrollLayer.extend({
	_callbackObj: null,
	_nextPageCallbackFunc: null,
	_itemClickCallbackFunc: null,
	_itemDblClickCallbackFunc: null,
	_itemPressCallbackFunc: null,
	_itemPressEndCallbackFunc: null,

	_row: 3,
	_column: 3,
	_padding: cc.p(0, 0),
	_emptySprBgTexture: null,

	_itemNormalTexture: null,
	_itemActiveTexture: null,
	_itemDisableTexture: null,
	_currentPage: -1,
	_maxPage: 1,
	_itemSize: cc.size(64, 64),
	_startPos: null,

	_tempBgArr: [],
	_itemsArr: [],
	_startPos: cc.p(0, 0),

	getChildByTag: function (tag) {
		return this._childRootNode.getChildByTag(tag);
	},

	init: function () {
		this._super();
		return true;
	},

	setItemTextures: function (normalTex, activeTex, disableTex, emptyItemTex) {
		this._itemNormalTexture = normalTex;
		this._itemActiveTexture = activeTex;
		this._itemDisableTexture = disableTex;
		this._emptySprBgTexture = emptyItemTex;
	},

	setPageGrid: function (row, column, itemSize, padding) {
		if (row)
			this._row = row;
		if (column)
			this._column = column;
		if (itemSize)
			this._itemSize = itemSize;
		if (padding != undefined) {
			if (this._padding instanceof cc.Point)
				this._padding = padding;
			else
				this._padding = cc.p(padding, padding);
		} else {
			var conSize = this.getContentSize();
			this._padding = cc.p((conSize.width - (this._row * this._itemSize.width)) / this._row, (conSize.height - (this._column * this._itemSize.height)) / this._column);
		}

		this.enablePage(this.getContentSize().width);
	},

	setCallbackFunc: function (obj, nextPage, click, dblClick, press, pressEnd, dragMove) {
		this._callbackObj = obj
		this._nextPageCallbackFunc = nextPage;

		this._changePageObject = this,
		this._changePageFunc = this.onScrollPage;

		this.enableTouchChild(obj, click, dblClick, press, pressEnd, dragMove);
	},

	setItems: function (itemArr) {
		this.reset();
		var xIdx = 0;
		var yIdx = 0;
		this._itemsArr = itemArr;
		for (var i = 0; i < itemArr.length; i++) {
			var item = itemArr[i];
			var size = item.getContentSize();

			if (this._emptySprBgTexture) {
				var emptyBgSpr = this._tempBgArr[i]; //cc.Sprite.createWithTexture(this._emptySprBgTexture);

				item.setPosition(cc.p(emptyBgSpr.getPosition().x, emptyBgSpr.getPosition().y));
				this.addChild(item, 10);
				//this.removeChild(emptyBgSpr);
				//item.addChild(emptyBgSpr, -1);

				//emptyBgSpr.setPosition(cc.p(item.getContentSize().width / 2, item.getContentSize().height / 2));
				//emptyBgSpr.setVisible(false);
				emptyBgSpr.setUserData(item.getUserData()._id);
			} else {
				item.setPosition(cc.p(this._startPos.x + xIdx * (this._itemSize.width + this._padding.x), this._startPos.y - yIdx * (this._itemSize.height + this._padding.y)));
				this.addChild(item);
			}

			xIdx++;
			if (xIdx === this._row) {
				xIdx = 0;
				if (i != itemArr.length - 1) {
					yIdx++;
					if (yIdx === this._column) {
						this._maxPage++;
						xIdx = yIdx = 0;
						this._startPos.x += (this._padding.x + this._itemSize.width) * this._row;
						this.newPage();
					}
				}
			}
		}
		if (this._currentPage >= this._maxPage) {
			this._currentPage = this._maxPage;
			this.nextPage(1);
		} else if (this._currentPage == -1) {
			this.scrollTo(0, 0);
		}
		this.setDirty();
		this.onScrollPage(this._currentPage === -1 ? 0 : this._currentPage);
	},

	getChildren: function () {
		return this._childRootNode.getChildren();
	},

	getRoot: function () {
		return this._childRootNode;
	},

	newPage: function () {
		if (!this._emptySprBgTexture) return;

		for (var r = 0; r < this._column; r++) {
			for (var c = 0; c < this._row; c++) {
				var emptyBgSpr = cc.Sprite.createWithTexture(this._emptySprBgTexture);
				emptyBgSpr.notTouch = true;
				emptyBgSpr.setPosition(cc.p(this._startPos.x + c * (this._itemSize.width + this._padding.x), this._startPos.y - r * (this._itemSize.height + this._padding.y)));
				this.addChild(emptyBgSpr, 1);
				this._tempBgArr.push(emptyBgSpr);
			}
		}
	},

	nextPage: function (direction) {
		if ((this._currentPage == 0 && direction == 1) || (this._currentPage == this._maxPage - 1 && direction == -1)) return;

		var currPage = this._currentPage * -1;
		currPage += direction;
		if (this._scrollModel === cc.SCROLL_MODEL_HORIZONTAL) this.scrollTo(currPage * ((this._padding.x + this._itemSize.width) * this._row), 0);
		else if (this._scrollModel === cc.SCROLL_MODEL_VERTICAL) this.scrollTo(0, currPage * ((this._padding.y + this._itemSize.width) * this._column));

		this.onScrollPage(currPage * -1);
	},

	reset: function () {
		this._childRootNode.removeAllChildrenWithCleanup(true);

		this._maxPage = 1;
		this._tempBgArr = [];
		var conSize = this.getContentSize();
		//if (this._padding == null)
		//    this._padding = cc.p((conSize.width - (this._row * this._itemSize.width)) / this._row, (conSize.height - (this._column * this._itemSize.height)) / this._column);
		//this._startPos = cc.p(this._padding.x + this._itemSize.width / 2, this.getContentSize().height - (this._padding.y + this._itemSize.height / 2));
		this._startPos = cc.p(this._padding.x / 2 + this._itemSize.width / 2, conSize.height - this._padding.y / 2 - this._itemSize.height / 2);
		this.newPage();
	},

	setAllItemsState: function (isActive) {
		if (!this._itemActiveTexture && !this._itemDisableTexture) return;
		//var children = this.getChildren();
		for (var i = 0; i < this._itemsArr.length; i++) {
			//var bgSpr = null;
			//if (children[i] instanceof cc.PageItemBase)
			//{
			//    bgSpr = children[i].getBgSprite();
			//}
			//else if (children[i] instanceof cc.Sprite)
			//    bgSpr = children[i];

			//if(bgSpr)
			//{
			//    bgSpr.setTexture(isActive?this._itemActiveTexture:this._itemNormalTexture);
			//}

			//this._itemsArr[i].setTexture(isActive ? this._itemActiveTexture : this._itemNormalTexture);
			this.setItemActive(this._itemsArr[i], isActive);
		}
	},

	setItemActive: function (node, isActive) {
		if (!this._itemActiveTexture && !this._itemNormalTexture) return;

		var selSpr = node.getChildByTag(100);
		if (isActive) {
			if (selSpr == undefined) {
				var selSpr = cc.Sprite.createWithTexture(this._itemActiveTexture);
				node.addChild(selSpr, 1, 100);
				selSpr.setPosition(cc.p(node.getContentSize().width / 2, node.getContentSize().height / 2));
			} else selSpr.setVisible(true);

		} else {
			if (selSpr) selSpr.setVisible(false);
		}
		//var bg = this.getBgByUserData(node.getUserData()._id);
		//if (bg)
		//bg.setTexture(isActive ? this._itemActiveTexture : this._itemNormalTexture);
		//if (node instanceof cc.PageItemBase)
		//    node.getBgSprite().setTexture(isActive ? this._itemActiveTexture : this._itemNormalTexture);
		//else if (node instanceof cc.Sprite)
		//    node.setTexture(isActive ? this._itemActiveTexture : this._itemNormalTexture);
	},

	setItemDisable: function (node, isDisable) {
		if (!this._itemNormalTexture || !this._itemDisableTexture) return;
		node.setTexture(isDisable ? this._itemDisableTexture : this._itemNormalTexture);
	},

	activeItemByTag: function (tag, isActive) {
		var node = this.getChildByTag(tag);
		if (node) this.setItemActive(node, isActive);
	},

	onScrollPage: function (currPage) {
		if (this._currentPage == currPage) return;

		this._currentPage = currPage;

		if (this._nextPageCallbackFunc) this._nextPageCallbackFunc.call(this._callbackObj, this._currentPage + 1 + "/" + this._maxPage);
	},
	getBgByUserData: function (docId) {
		for (var i = 0; i < this._tempBgArr.length; i++) {
			if (this._tempBgArr[i].getUserData() == docId) return this._tempBgArr[i];
		}
		return null;
	}
});

cc.ScrollLayerPage.create = function () {
	var a = new cc.ScrollLayerPage;
	return a && a.init() ? a : null;
}
cc.ScrollLayerPage.createWithLayer = function (pLayer) {
	var a = new cc.ScrollLayerPage;
	a.setContentSize(pLayer.getContentSize());
	a.setPosition(pLayer.getPosition());
	return a && a.init() ? a : null;
}