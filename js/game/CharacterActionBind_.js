(function(BTG) {
	BTG.CharacterActionBind = function() {
		this.pCharacter = null;
		this.pAction = null;
		this.pCacheTexArray = null;
		this.fCurTime = 0;
		this.fMaxTime = 0;
		this.nCurIdx = 0;
	};
	BTG.CharacterActionBind.prototype.cacheShowPlayChild = function (bIsShow) {
		for (var i = 0; i < BTG.CT_Count; i++) {
			if (this.pCharacter.m_spriteImage[i]) {
				this.pCharacter.m_spriteImage[i].setVisible(bIsShow);
			}
		}
	}
	BTG.CharacterActionBind.prototype.cacheDel = function () {
		this.pCharacter.setCurPlayActionForCache(null);
		if (this.pCacheTexArray) {
			this.nCurIdx = 0;
			//显示batch所有其它子块
			for (var i = 0; i < this.pCacheTexArray.length; i++) {
				this.pCharacter.m_pBatch.removeChild(this.pCacheTexArray[i], true);
			}
			this.pCacheTexArray.length = 0;
			this.pCacheTexArray = null;
			this.cacheShowPlayChild(true);

			//这里也要删除cache...
			var resId = this.pCharacter.getResId();
			var eqList = this.pCharacter.getEqList();

			var pCache = rpgGame.getCache().del(resId, eqList);
		}
	}

	BTG.CharacterActionBind.prototype.cacheChangeEQ = function () {
		if (this.pCacheTexArray) {
			this.cacheDel();
		}

	}
	var stat = 0;
	BTG.CharacterActionBind.prototype.cacheUpdate = function (dt) {
		this.fCurTime += dt;
		if (this.fCurTime > this.fMaxTime) {
			this.fCurTime = 0;
		}
		var curIdx = 0 | (this.fCurTime / this.fMaxTime * BTG.ActionImageCache.cacheTextureCount);
		if (this.nCurIdx === curIdx)
			return;
		if (curIdx >= BTG.ActionImageCache.cacheTextureCount) {
			curIdx = 0;
			this.fCurTime = 0;
		}
		if (this.pCacheTexArray[curIdx] === undefined) {
			cc.log("[Error] cache animtion CacheTexArray[this.nCurIdx] === undefined ");
			cc.log(this.pCacheTexArray[this.nCurIdx]);
			cc.log(this.pCacheTexArray[this.curIdx]);
			this.cacheDel();
			return;
		}
		this.pCacheTexArray[this.nCurIdx].setVisible(false);
		this.pCacheTexArray[curIdx].setVisible(true);
		this.nCurIdx = curIdx;
	}

	BTG.CharacterActionBind.prototype.cacheCreate = function () {
		// 隐藏所有其它子块
		this.pCharacter.setCurPlayActionForCache(this.pAction);

		var resId = this.pCharacter.getResId();
		var eqList = this.pCharacter.getEqList();

		this.fMaxTime = this.pAction.m_maxRunTime;
		var pCache = rpgGame.getCache().add(resId, eqList, this);

		this.cacheShowPlayChild(false);
		
		//var p = cc.Sprite.createWithTexture(pCache.renderTexture.getSprite().getTexture());

		//p.setPosition(cc.p(0,0));
		//p.setAnchorPoint(cc.p(0, 0));
		//rpgGame.getGameRoot().addChild(p, 999999);
		this.pCacheTexArray = new Array(BTG.ActionImageCache.cacheTextureCount);

		for (var i = 0; i < BTG.ActionImageCache.cacheTextureCount; i++) {
			this.pCacheTexArray[i] = cc.Sprite.createWithTexture(pCache.renderTexture.getSprite().getTexture(),
			pCache.texRectArray[i]);
			if (this.pCacheTexArray[i] === null)
				cc.alert("createWithTexture xxx");

			this.pCacheTexArray[i].setAnchorPoint(cc.p(0, 0));
			this.pCacheTexArray[i].setPosition(cc.p(this.pCharacter.m_AABBBox.origin.x, this.pCharacter.m_AABBBox.origin.y));
			this.pCharacter.m_pBatch.addChild(this.pCacheTexArray[i], 999);
			this.pCacheTexArray[i].setVisible(false);
		}

		this.pCacheTexArray[0].setVisible(true);
	}

	BTG.CharacterActionBind.prototype.cacheGetBoundBox = function () {
		return this.pCharacter.m_AABBBox;
	}

	BTG.CharacterActionBind.prototype.cacheRenderTo = function (vPos0, iFrame, renderContext) {
		var pPlayer = this.pCharacter;
		var orgPos = pPlayer.getPos();

		vPos = cc.p(vPos0.x, vPos0.y);
		vPos.x -= this.pCharacter.m_AABBBox.origin.x;
		vPos.y -= this.pCharacter.m_AABBBox.origin.y;
		pPlayer.setPos(vPos);
		var pShadow = this.pCharacter.m_pBatch.getChildByTag(BTG.CharacterRender.Tag_Shadow);
		var oldShow = false;
		if (pShadow) {
			var oldShow = pShadow.isVisible();
			pShadow.setVisible(false);
		}
		var pAction = this.pAction;
		this.fMaxTime = pAction.m_maxRunTime;
		var actionKeyTime = this.fMaxTime / (BTG.ActionImageCache.cacheTextureCount - 1);
		for (var iAct = 0; iAct < BTG.CT_Count; iAct++) {
			if (pPlayer.getSprite(iAct) === null)
				continue;

			var pRunAction = pAction.getRunKeyForTimeKey(iFrame * actionKeyTime, iAct);

			if (!pRunAction) continue;

			if (iAct === BTG.CT_Root) {
				pPlayer.setChildPosRot(iAct, pRunAction.m_pos, pRunAction.m_rot);
			}
			else {
				pPlayer.setChildRot(iAct, pRunAction.m_rot);
			}
		}
		pPlayer.m_pBatch.visit(renderContext);
		if(pShadow)
			pShadow.setVisible(oldShow);
		pPlayer.setPos(orgPos);
	}

	BTG.CharacterActionBind.prototype.update = function (dt) {
		if (this.pCacheTexArray) {// user cache
			assert(this.pCharacter.m_curActionAA_type === BTG.CA_Stand);
			this.cacheUpdate(dt);
			return;
		}
		var pPlayer = this.pCharacter;

		var pAction = this.pAction;

		if (pPlayer.m_pBatch.isVisible() === false)
			return;
		if (pAction.m_isLoadFinal === false) {
			return;
		}
		if (pPlayer.m_isLoadFinal === false)
			return;
		
		if (pPlayer.m_curActionAA_type === BTG.CA_Stand && pPlayer.m_owner.getType() === BTG.CharacterType_Other) {
			this.cacheCreate();
			return;
		}

		pPlayer.updateActionTime(dt);
		if (pAction.isPlayFinal(pPlayer.m_curAllRunTime)) {
			pPlayer.actionFinal();
			return;
		}

		//action callback
		if (pPlayer.m_owner.m_aa_type !== -1) {
			if (pPlayer.m_curActionAA_type === pPlayer.m_owner.m_aa_type) {
				var fFrame = pPlayer.m_curAllRunTime / pAction.m_maxRunTime;
				if (fFrame >= pPlayer.m_owner.m_fFrameRate) {
					pPlayer.m_owner.doActionCallback();
					pPlayer.m_owner.m_aa_type = -1;
				}
			}
		}

		//检测旋转可以优化
		for (var iAct = 0; iAct < BTG.CT_Count; iAct++) {
			if (pPlayer.getSprite(iAct) === null)
				continue;

			var pRunAction = pAction.getRunKey(iAct, pPlayer);
			if (!pRunAction)
				continue;

			if (iAct === BTG.CT_Root) {
				pPlayer.setChildPosRot(iAct, pRunAction.m_pos, pRunAction.m_rot);
			} else {
				pPlayer.setChildRot(iAct, pRunAction.m_rot);
			}
		}
	}

	BTG.CharacterActionUtil = function() {
		this.m_actionObjMap = new Object();
		this.m_runListArray = new Array();

		this.update = function (dt) {
			for (var i = 0; i < this.m_runListArray.length; i++) {
				this.m_runListArray[i].update(dt);
			}
		}

		this.remove = function (character) {
			for (var i = 0; i < this.m_runListArray.length; i++) {
				if (this.m_runListArray[i].pCharacter == character) {
					this.m_runListArray[i].cacheDel();
					this.m_runListArray.splice(i, 1);
					return;
				}
			}
		}

		this.add = function (character, strFileName) {
			//这里可以优化
			for (var i = 0; i < this.m_runListArray.length; i++) {
				if (this.m_runListArray[i].pCharacter == character) {
					if (this.m_runListArray[i].pAction.m_AA_Type == strFileName) {
						if (this.m_runListArray[i].pAction.m_isWhile == 0) {// no while replay
							this.m_runListArray[i].pCharacter.replay();
						}
						this.m_runListArray[i].cacheDel();
						return this.m_runListArray[i].pAction;
					}
				}
			}
			this.remove(character);

			var curRunObj = new BTG.CharacterActionBind();
			curRunObj.pCharacter = character;
			this.m_runListArray[this.m_runListArray.length] = curRunObj;

			if (this.m_actionObjMap[strFileName]) {
				
			} else {
				this.m_actionObjMap[strFileName] = new BTG.CharacterAction;
				this.m_actionObjMap[strFileName].create(strFileName);
			}
			curRunObj.pAction = this.m_actionObjMap[strFileName];
		}
	}
})(BTG);