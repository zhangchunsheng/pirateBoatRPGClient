(function(BTG) {
	//AnchorPoint left bottom
	BTG.LoadProgress = cc.Node.extend({
		m_pImageArray: null,
		m_isLoadFinal: false,
		m_fCurValue: -1,
		m_nPixelWidth: 0,
		setValue: function (value0_1) {
			assert(value0_1 >= 0 && value0_1 <= 1);
			this.m_fCurValue = value0_1;
			if (this.m_isLoadFinal == false)
				return;

			var conSize = this.m_pImageArray[1].getContentSize();
			var midPixel = this.m_nPixelWidth - this.m_pImageArray[0].getContentSize().width - this.m_pImageArray[2].getContentSize().width;
			var realPixel = midPixel * value0_1;
			var scaleX = realPixel / conSize.width;

			this.m_pImageArray[1].setScaleX(scaleX);
			this.m_pImageArray[2].setPosition(cc.p(this.m_pImageArray[0].getContentSize().width + realPixel, 0));
		},
		loadFinal: function () {
			this.m_isLoadFinal = true;
			var pos = cc.p(0, 0);
			for (var i = 0; i < this.m_pImageArray.length; i++) {
				this.m_pImageArray[i].setAnchorPoint(cc.p(0, 0.0));
				this.m_pImageArray[i].setPosition(cc.p(pos.x, pos.y));
				pos.x += this.m_pImageArray[i].getContentSize().width;
			}
			if(this.m_fCurValue == -1)
				this.setValue(1);
			else
				this.setValue(this.m_fCurValue);
		},
		create: function (sprOrStr_Left, sprOrStr_Mid, sprOrStr_Right, nPixelWidth) {
			this.m_nPixelWidth = nPixelWidth;
			this.m_pImageArray = new Array(3);
			for (var i = 0; i < 3; i++) {
				var pImage = arguments[i];
				if (typeof pImage == "string") {
					this.m_pImageArray[i] = cc.Sprite.create(pImage);
					this.addChild(this.m_pImageArray[i]);
				} else {
					this.m_pImageArray[i] = copySprite(pImage, this);
				}
			}
			this.loadFinal();
		}
	});

	BTG.LoadProgress.create = function(sprOrStr_Left, sprOrStr_Mid, sprOrStr_Right, nPixelWidth) {
		var ret = new BTG.LoadProgress();
		ret.create(sprOrStr_Left, sprOrStr_Mid, sprOrStr_Right, nPixelWidth);
		return ret;
	};
})(BTG);