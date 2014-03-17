(function(BTG) {
	var EffectRootNode = cc.Sprite.extend({
		ctor: function () {
			cc.associateWithNative(this, cc.Sprite);
		},
		transform: function (ctx) {
			var context = ctx || cc.renderContext;
			// transformations

			if (!this._ignoreAnchorPointForPosition) {
				if (this._parent) {
					context.translate(0 | (this._position.x - this._parent._anchorPointInPoints.x), -(0 | (this._position.y - this._parent._anchorPointInPoints.y)));
				} else {
					context.translate(0 | this._position.x, -(0 | this._position.y));
				}
			} else {
				if (this._parent) {
					context.translate(0 | (this._position.x - this._parent._anchorPointInPoints.x + this._anchorPointInPoints.x), -(0 | (this._position.y - this._parent._anchorPointInPoints.y + this._anchorPointInPoints.y)));
				} else {
					context.translate(0 | (this._position.x + this._anchorPointInPoints.x), -(0 | (this._position.y + this._anchorPointInPoints.y)));
				}
			}

			if ((this._skewX != 0) || (this._skewY != 0)) {
				context.transform(1, -Math.tan(cc.DEGREES_TO_RADIANS(this._skewY)), -Math.tan(cc.DEGREES_TO_RADIANS(this._skewX)),
				1, 0, 0);
			}

			if ((this._scaleX != 1) || (this._scaleY != 1)) {
				context.scale(this._scaleX, this._scaleY);
			}
			if (this._rotation != 0) {
				//context.rotate(cc.DEGREES_TO_RADIANS(this._rotation));
				context.rotate(this._rotationRadians);
			}
		}
	});

	EffectRootNode.create = function (texture, rect) {
		var tNode = new EffectRootNode();
		tNode.initWithTexture(texture, rect);
		return tNode;
	}
	//特效播放器
	BTG.EffectPlay = function() {
		this.m_pEffectObject = null;
		this.m_pImageArray = null;
		this.m_isCanPlay = false;
		this.m_isStop = false;
		this.m_runTime = 0;
		this.m_rootNode = null;
		this.m_parNode = null;
		this.m_layer = 0;
		this.m_uvSize = null;
		this.m_pUv0 = null;
		this.m_pUv1 = null;

		this.m_curFrame = 0;
		this.m_childObject = new Array();
	}
	BTG.EffectPlay.prototype.pointIn = function (localPos) {
		if (this.m_pImageArray === null)
			return false;
		return cc.Rect.CCRectContainsPoint(this.m_pImageArray[0].getBoundingBoxToWorld(), localPos);
	}
	BTG.EffectPlay.prototype.flipX = function () {
		this.m_rootNode.setScaleX(-this.m_rootNode.getScaleX());
	}
	BTG.EffectPlay.prototype.getPosition = function () {
		assert(this.m_rootNode !== null);
		return this.m_rootNode.getPosition();
	}
	BTG.EffectPlay.prototype.addChildEffect = function (_thisObjChild) {
		this.m_childObject[this.m_childObject.length] = _thisObjChild;
		if (this.m_childObject.length > 5)
			cc.alert("child effect > 5");
	}
	BTG.EffectPlay.prototype.getImageSize = function () {
		return this.m_pImageArray[0].getContentSize();
	}
	BTG.EffectPlay.prototype.isInPoint = function (vPos) {
		if (this.m_pImageArray == null) return false;
		return ptInNode(vPos, this.m_pImageArray[0]);
	}
	BTG.EffectPlay.prototype.stop = function () {
		this.m_isStop = true;
	}
	BTG.EffectPlay.prototype.isStop = function () {
		return this.m_isStop;
	}

	BTG.EffectPlay.prototype.del = function () {
		for (var i = 0; i < this.m_childObject.length; i++) {
			rpgGame.getEffectUtil().del(this.m_childObject[i]);
		}
		this.m_parNode.removeChild(this.m_rootNode, true);
		this.m_rootNode = null;
	}
	BTG.EffectPlay.prototype.setPosition = function (vPos) {
		this.m_rootNode.setPosition(cc.p(vPos.x, vPos.y));
	}

	BTG.EffectPlay.prototype.create = function (effectDataObject, parNode, layer, vPos) {
		this.m_layer = layer;
		this.m_parNode = parNode;
		this.m_rootNode = cc.Node.create();
		this.m_parNode.addChild(this.m_rootNode, this.m_layer);
		this.m_rootNode.setPosition(cc.p(vPos.x, vPos.y));

		this.m_pEffectObject = effectDataObject;

		if (this.m_pEffectObject.isLoadFinal() == false) return;
		else this.init();

	}

	BTG.EffectPlay.prototype.update = function (ftime) {
		if (this.isStop())
			return;

		if (this.m_isCanPlay == false) {
			// rpgGame.xDebug(this.m_pEffectObject.m_fileName+"  "+ this.m_pEffectObject.m_isLoadFinal);
			if(this.m_pEffectObject.isLoadFinal() == false)
				return;
			else
				this.init();
			return;
		}

		if (this.m_pEffectObject.m_effectType === BTG.SE_Sequence) {
			this.m_runTime += (ftime * this.m_pEffectObject.m_pAniData.m_timeStrip);
			var nFrame = this.m_pEffectObject.GetAniKey(this);
			if (nFrame != this.m_curFrame) {
				this.m_pImageArray[this.m_curFrame].setVisible(false);
				this.m_pImageArray[nFrame].setVisible(true);
				this.m_curFrame = nFrame;
			}
		} else {
			this.m_runTime += ftime;
			var tLerpData = this.m_pEffectObject.getTextureKey(this);

			//if (this.m_pEffectObject.m_uvDir)
			//{
			//    this.UpdateUVAni(ftime);
			//}
			//else
			{
				if (tLerpData.m_pos != undefined) {
					this.m_pImageArray[0].setPosition(cc.p(tLerpData.m_pos.x, tLerpData.m_pos.y));
				}
				if (tLerpData.m_rot != undefined) {
					this.m_pImageArray[0].setRotation(tLerpData.m_rot);
				}
				if (tLerpData.m_xsize != undefined) {
					this.m_pImageArray[0].setScaleX(tLerpData.m_xsize);
				}

				if (tLerpData.m_ysize != undefined) {
					this.m_pImageArray[0].setScaleY(tLerpData.m_ysize);
				}

				if (tLerpData.m_xskew != undefined) {
					this.m_pImageArray[0].setSkewX(tLerpData.m_xskew);
				}

				if (tLerpData.m_yskew != undefined) {
					this.m_pImageArray[0].setSkewY(tLerpData.m_yskew);
				}
			}

			if (tLerpData.m_alpha != undefined) {
				for (var i = 0; i < this.m_pImageArray.length; i++)
					this.m_pImageArray[i].setOpacity(tLerpData.m_alpha);
			}

			if (tLerpData.m_color3 != undefined) {
				cc.alert("effect not color");
				this.m_pImageArray[0].setColor(tLerpData.m_color3);
			}
		}
	}

	BTG.EffectPlay.prototype.init = function () {
		this.m_isCanPlay = true;
		var count = this.m_pEffectObject.m_pImageArray.length;
		this.m_pImageArray = new Array(count);

		for (var i = 0; i < count; i++) {
			//  this.m_pImageArray[i] = cc.Sprite.createWithTexture(this.m_pEffectObject.m_pImageArray[i].getTexture(),
			//     this.m_pEffectObject.m_pImageArray[i].getTextureRect());
			if (this.m_pEffectObject.m_isSelfRot) {
				this.m_pImageArray[i] = EffectRootNode.create(this.m_pEffectObject.m_pImageArray[i].getTexture(),
				this.m_pEffectObject.m_pImageArray[i].getTextureRect());
			} else {
				this.m_pImageArray[i] = cc.Sprite.createWithTexture(this.m_pEffectObject.m_pImageArray[i].getTexture(),
				this.m_pEffectObject.m_pImageArray[i].getTextureRect());
			}
			this.m_rootNode.addChild(this.m_pImageArray[i], 0);

			this.m_pImageArray[i].setVisible(false);

			if (this.m_pEffectObject.m_gColor != undefined) {
				this.m_pImageArray[i].setColor(this.m_pEffectObject.m_gColor);
			}

			if (this.m_pEffectObject.m_isLiang != 0) {
				this.m_pImageArray[i].setBlendFunc(gl.SRC_ALPHA, gl.ONE);
			}
		}
		this.m_pImageArray[0].setVisible(true);

		if (this.m_pEffectObject.m_effectType == BTG.SE_Texture) {
			var tLerpData = this.m_pEffectObject.m_lerpData;
			if (tLerpData.m_pos != undefined) {
				this.m_pImageArray[0].setPosition(cc.p(tLerpData.m_pos.x, tLerpData.m_pos.y));
			}
			if (tLerpData.m_rot != undefined) {
				this.m_pImageArray[0].setRotation(tLerpData.m_rot);
			}
			if (tLerpData.m_xsize != undefined) {
				this.m_pImageArray[0].setScaleX(tLerpData.m_xsize);
			}

			if (tLerpData.m_ysize != undefined) {
				this.m_pImageArray[0].setScaleY(tLerpData.m_ysize);
			}

			if (tLerpData.m_xskew != undefined) {
				this.m_pImageArray[0].setSkewX(tLerpData.m_xskew);
			}

			if (tLerpData.m_yskew != undefined) {
				this.m_pImageArray[0].setSkewY(tLerpData.m_yskew);
			}

			if (tLerpData.m_alpha != undefined) {
				this.m_pImageArray[0].setOpacity(tLerpData.m_alpha);
			}

			if (tLerpData.m_color3 != undefined) {
				cc.alert("effect not color");
				this.m_pImageArray[0].setColor(tLerpData.m_color3);
			}
		}
		this.createUVAni();
		// set uv

		// add childeffect
		if (this.m_pEffectObject.m_childEffectFNArray) {
			for (var i = 0; i < this.m_pEffectObject.m_childEffectFNArray.length; i++) {
				var tEffectPlayChild = rpgGame.getEffectUtil().add(this.m_pEffectObject.m_childEffectFNArray[i], this.m_rootNode,
				i, cc.p(0, 0));
				this.addChildEffect(tEffectPlayChild);
			}
		}

	}
	BTG.EffectPlay.prototype.updateUVAni = function (ftime) {
		return;
		var pos0 = this.m_pUv0.getPosition();
		var pos1 = this.m_pUv1.getPosition();

		var fSpeed = 5; // this.m_pEffectObject.m_uvSpeed;
		switch (this.m_pEffectObject.m_uvDir) {
			case 's':
				pos0.y += ftime * fSpeed;
				if (pos0.y >= this.m_uvSize.height) {
					pos0.y = this.m_uvSize.height;
				}
				break;
		}
		this.m_pUv0.setPosition(pos0);
		//this.m_pUv1.setPosition(pos1);

		if (pos0.y >= this.m_uvSize.height) {
			this.m_pUv0.setPosition(cc.p(0, 0));
			this.m_pUv0.setTextureRect(cc.rect(0, this.m_uvSize.height, this.m_uvSize.width, 0));
			var pT = this.m_pUv0;
			this.m_pUv0 = this.m_pUv1;
			this.m_pUv1 = pT;
		}
	}
	BTG.EffectPlay.prototype.createUVAni = function () {
		return;
		this.m_rootNode.removeChild(this.m_pImageArray[0], true);
		this.m_uvSize = this.m_pEffectObject.m_pImageArray[0].getContentSize();

		var pTex = this.m_pEffectObject.m_pImageArray[0].getTexture();

		this.m_pUv0 = cc.ProgressTimer.create(pTex);
		this.m_pUv0.setType(cc.PROGRESS_TIMER_TYPE_BAR);
		this.m_pUv0.setMidpoint(cc.p(0, 0));
		this.m_pUv0.setBarChangeRate(cc.p(0, 1));
		this.m_pImageArray[0] = this.m_pUv0;

		this.m_pUv1 = cc.ProgressTimer.create(pTex);
		this.m_pUv1.setType(cc.PROGRESS_TIMER_TYPE_BAR);
		this.m_pUv1.setMidpoint(cc.p(0, 0));
		this.m_pUv1.setBarChangeRate(cc.p(0, 1));
		this.m_pImageArray[1] = this.m_pUv1;
	}
})(BTG);