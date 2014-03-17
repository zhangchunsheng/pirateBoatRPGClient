cc.Grid9 = cc.Node.extend({
	ctor: function () {
		cc.associateWithNative(this, cc.Node);
	},
	_array9: null,
	setContentSize: function (tSize) {
		this._super(tSize);

		var rootContentSize = tSize;

		this._array9[1].setPosition(cc.p(0, rootContentSize.height)); //left top
		this._array9[3].setPosition(cc.p(rootContentSize.width, rootContentSize.height)); //right top
		this._array9[5].setPosition(cc.p(rootContentSize.width, 0)); //right bottoom
		this._array9[7].setPosition(cc.p(0, 0)); //left bottom

		var leftToRight = rootContentSize.width - this._array9[1].getContentSize().width - this._array9[3].getContentSize().width;
		var topToBottom = rootContentSize.height - this._array9[1].getContentSize().height - this._array9[7].getContentSize().height;

		// top edge
		this._array9[2].setScaleX(leftToRight / this._array9[2].getContentSize().width);
		this._array9[2].setPosition(cc.p(rootContentSize.width / 2, rootContentSize.height));
		// bottom edge
		this._array9[6].setScaleX(leftToRight / this._array9[6].getContentSize().width);
		this._array9[6].setPosition(cc.p(rootContentSize.width / 2, 0));
		// right edge
		this._array9[4].setScaleY(topToBottom / this._array9[4].getContentSize().height);
		this._array9[4].setPosition(cc.p(rootContentSize.width, rootContentSize.height / 2));
		//left edge
		this._array9[8].setScaleY(topToBottom / this._array9[8].getContentSize().height);
		this._array9[8].setPosition(cc.p(0, rootContentSize.height / 2));
		//center
		this._array9[0].setPosition(cc.p(rootContentSize.width / 2, rootContentSize.height / 2));
		this._array9[0].setScaleX(leftToRight / this._array9[0].getContentSize().width);
		this._array9[0].setScaleY(topToBottom / this._array9[0].getContentSize().height);
	},
	setFileName: function (directFileName) {
		this._array9 = new Array(9);
		for (var i = 0; i < 9; i++) {
			this._array9[i] = cc.Sprite.create("res/dlg/" + directFileName + "/" + i + ".png");
			this.addChild(this._array9[i], 0);
		}

		this._array9[1].setAnchorPoint(cc.p(0, 1));
		this._array9[3].setAnchorPoint(cc.p(1, 1));
		this._array9[5].setAnchorPoint(cc.p(1, 0));
		this._array9[7].setAnchorPoint(cc.p(0, 0));

		this._array9[2].setAnchorPoint(cc.p(0.5, 1));
		this._array9[6].setAnchorPoint(cc.p(0.5, 0));
		this._array9[4].setAnchorPoint(cc.p(1, 0.5));
		this._array9[8].setAnchorPoint(cc.p(0, 0.5));

		this._array9[0].setAnchorPoint(cc.p(0.5, 0.5));
	},
	init: function () {
		this._super();
		this.setAnchorPoint(cc.p(0, 0));
		this.ignoreAnchorPointForPosition(false);

		return true;
	}
});

cc.Grid9.create = function (directFileName) {
	var pGrid = new cc.Grid9();
	pGrid.setFileName(directFileName);
	return pGrid;
};