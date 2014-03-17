(function(BTG) {
	BTG.ProxySprite = cc.Sprite.extend({
		ctor: function () {
			cc.associateWithNative(this, cc.Sprite);
		},
		isLoadFinal: false,
		tempPos: null,
		tempParNode: null,
		tempLayer: null,
		tempTag: null,
		tempFileName: null,
		tempCallback: null,
		tempAction: null,
		tempAh: null,
		tempScale: null,
		preScale: function (scal) {
			if (this.isLoadFinal)
				this.setScale(scal.x, scal.y);
			else
				this.tempScale = scal;
		},
		preAh: function (pAh) {
			if (this.isLoadFinal)
				this.setAnchorPoint(pAh);
			else
				this.tempAh = pAh;
		},
		preAction: function (pAction) {
			if (this.isLoadFinal)
				this.runAction(pAction);
			else
				this.tempAction = pAction;
		},
		draw: function (cx) {
			if (!this.isLoadFinal)
				return;
			this._super(cx);
		},
		onLoadFinal: function () {
			this.initWithFile(this.tempFileName);
			if (this.tempParNode)
				this.tempParNode.addChild(this, this.tempLayer);
			if (this.tempPos)
				this.setPosition(this.tempPos);
			if (this.tempAction)
				this.runAction(this.tempAction);
			if (this.tempAh)
				this.setAnchorPoint(this.tempAh);
			if (this.tempCallback)
				this.tempCallback.Run();
			if (this.tempScale)
				this.setScale(this.tempScale.x, this.tempScale.y);

			this.isLoadFinal = true;

			this.removeChild(this.noLoadSpr, true);
			this.noLoadSpr = null;
		},
		noLoadSpr: null,
		setParam: function (fileName, parNode, pos, layer, tag, callbackFunc, callbackObj) {
			this.tempFileName = fileName;
			this.tempPos = pos;
			this.tempParNode = parNode;
			this.tempLayer = layer !== undefined ? layer : 0;
			this.tempTag = tag !== undefined ? tag : -1;
			this.setTag(this.tempTag);
			if (callbackFunc) {
				this.tempCallback = new BTG.Callback(callbackFunc, callbackObj);
			}
			this.noLoadSpr = cc.Sprite.create("res/noload.png");
			this.addChild(this.noLoadSpr);
			this.noLoadSpr.setPosition(cc.p(0, 0));
			this.noLoadSpr.setAnchorPoint(cc.p(0, 0));

			rpgGame.preLoadRes(fileName, this.onLoadFinal, this);
		}
	});

	BTG.ProxySprite.create = function(fileName, parNode, pos, layer, tag, callbackFunc, callbackObj) {
		var ret = new BTG.ProxySprite();
		ret.setParam(fileName, parNode, pos, layer, tag, callbackFunc, callbackObj);
		return ret;
	}
})(BTG);