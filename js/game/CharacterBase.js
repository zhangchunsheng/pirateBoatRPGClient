(function(BTG) {
	BTG.characterName_bg = null;
	BTG.CharacterBase = function() {
		this.move_Speed = 260;
		this.m_ID = -1;
		this.m_ResID = -1;
		this.m_pImage = null;
		this.m_isMove = false;
		this.m_targetPos = cc.p(0, 0);
		this.m_startPos = cc.p(0, 0);
		this.m_lerpTime = 0;
		this.m_lerpSpeed = 1;
		this.m_runCount = 0;
		this.m_pNameTTF = null;
		this.m_pNameBg = null;
		this.m_szName = "";
		this.m_actorType = -1;
		this.m_boatId = this.m_ResID;
		this.isLoadBoat = false;

		this.m_serverData = null;

		this.m_isForceHide = true;

		this.isLockZorder = false;
		this.m_bindEffectList = [];

		this.m_nAttackType = -1; //攻击类型 0近 1远
		this.raceId = 0; //职业ID 0战士 1弓手 2法师
		this.m_childNodeFilpList = [];
	};
	BTG.CharacterBase.prototype.setRaceId = function (nVocation) {
		this.raceId = nVocation;
	}
	BTG.CharacterBase.prototype.getRaceId = function () {
		return this.raceId;
	}
	BTG.CharacterBase.prototype.setAttackType = function (attackType) {
		this.m_nAttackType = attackType;
	}
	BTG.CharacterBase.prototype.getAttackType = function () {
		assert(this.m_nAttackType !== -1);
		return this.m_nAttackType;
	}
	BTG.CharacterBase.prototype.isMove = function () {
		return this.m_isMove;
	}
	BTG.CharacterBase.prototype.getServerData = function () {
		return this.m_serverData;
	}

	BTG.CharacterBase.prototype.setServerData = function (severDataObj) {
		this.m_serverData = severDataObj;
	}
	BTG.CharacterBase.prototype.getID = function () {
		return this.m_ID;
	}
	BTG.CharacterBase.prototype.getResID = function () {
		return this.m_ResID;
	}
	BTG.CharacterBase.prototype.del = function () {
		for (var i = 0; i < this.m_bindEffectList.length; i++)
			rpgGame.getEffectUtil().del(this.m_bindEffectList[i]);

		this.m_bindEffectList.length = 0;
		this.m_pImage.del();
		this.onDel();
	}
	BTG.CharacterBase.prototype.getRoot = function () {
		return this.m_pImage.m_pBatch;
	}
	BTG.CharacterBase.prototype.getType = function () {
		return this.m_actorType;
	}
	BTG.CharacterBase.prototype.setType = function (AcotrType_type) {
		this.m_actorType = AcotrType_type;
	}
	BTG.CharacterBase.prototype.getName = function () {
		return this.m_szName;
	}

	BTG.CharacterBase.prototype.resLoad = function (flag) {
		if(flag)
			this.setName(this.m_szName);
		if (this.m_pNameTTF === null)
			this.setName(this.m_szName);

		this.onResLoad();
	}

	BTG.CharacterBase.prototype.setName = function (szName) {
		this.m_szName = szName;
		if (this.m_pImage.isLoadFinal() === false)
			return;
		if (this.m_pNameTTF) {
			this.delFlipChildNode(this.m_pNameTTF);
			this.m_pImage.m_pBatch.removeChild(this.m_pNameTTF, true);
		}
		if(BTG.characterName_bg == null)
			BTG.characterName_bg = cc.TextureCache.getInstance().addImage(characterName_bg);
		this.m_pNameBg = cc.Sprite.createWithTexture(BTG.characterName_bg);
		this.m_pNameBg.setAnchorPoint(cc.p(0.5, 0.5));
		//this.m_pImage.m_pBatch.addChild(this.m_pNameBg, 100);
		this.m_pNameTTF = cc.LabelTTF.create(szName, "黑体", 16);
		this.m_pNameTTF.setAnchorPoint(cc.p(0.5, 0.5));
		//this.m_pImage.m_pBatch.addChild(this.m_pNameTTF, 100);

		var pos = this.m_pImage.getHeadPosForNode();
		pos.y += 6;
		this.m_pNameTTF.setPosition(pos);
		this.m_pNameBg.setPosition(pos);
		this.m_pNameTTF.setColor(BTG.CharacterNameColorArray[this.m_actorType]);
		this.addFlipChildNode(this.m_pNameTTF);
		this.addFlipChildNode(this.m_pNameBg);
	}
	BTG.CharacterBase.prototype.actionFinal = function () {
		
	}

	BTG.CharacterBase.prototype.setAction = function (AA_type, overPlayActionAA_type) {
		if (this.m_actorType === BTG.CharacterType_Npc && AA_type !== BTG.CA_Stand)
			return;
		this.m_pImage.runAction(AA_type, overPlayActionAA_type);
		this.onSetAction(AA_type);
	}
	BTG.CharacterBase.prototype.setMoveTargetForTime = function (vTargetPos, userTime) {
		this.setMoveTarget(vTargetPos);
		this.m_lerpSpeed = 1 / userTime;
	}

	BTG.CharacterBase.prototype.setMoveTarget = function (vTargetPos) {
		this.setAction(BTG.CA_Run);
		var bIsResetDir = this.m_targetPos.x != vTargetPos.x;
		this.m_targetPos = cc.p(vTargetPos.x, vTargetPos.y);
		this.m_startPos = cc.p(this.m_pImage.getRoot().getPosition().x, this.m_pImage.getRoot().getPosition().y);
		this.m_lerpTime = 0;
		this.m_isMove = true;

		var tdir = subPoint(this.m_targetPos, this.m_startPos);
		var dis = pointLen(tdir);
		this.m_lerpSpeed = 1 / (dis / this.move_Speed);

		if (bIsResetDir) {
			var nDir = (tdir.x > 0) ? BTG.ARSD_Right : BTG.ARSD_Left;
			this.setDirection(nDir);
		}

		this.onSetMoveTarget(vTargetPos);
	}
	BTG.CharacterBase.prototype.getCenterForWorld = function () {
		if (this.m_pImage === null)
			return cc.p(0, 0);
		return this.m_pImage.getCenterForWorld();
	}
	BTG.CharacterBase.prototype.getDir = function () {
		return this.m_pImage.getDir();
	}
	BTG.CharacterBase.prototype.setDirection = function (ARSD_type) {
		this.m_pImage.setDirection(ARSD_type);
		for (var i = 0; i < this.m_childNodeFilpList.length; i++)
			this.m_childNodeFilpList[i].setScaleX(ARSD_type);
	}

	BTG.CharacterBase.prototype.onSetAction = function (AA_type) {}
	BTG.CharacterBase.prototype.onResLoad = function () {}
	BTG.CharacterBase.prototype.onDel = function () {}
	BTG.CharacterBase.prototype.onCreate = function () {}
	BTG.CharacterBase.prototype.onShow = function (bIsShow) {}
	BTG.CharacterBase.prototype.onUpdate = function (ftime) {}
	BTG.CharacterBase.prototype.onSetPosition = function (vPos) {}
	BTG.CharacterBase.prototype.onSetMoveTarget = function (vPos) {}
	BTG.CharacterBase.prototype.onStop = function () {
		this.setAction(BTG.CA_Stand);
	}

	BTG.CharacterBase.prototype.stop = function () {
		if (this.m_isMove === false)
			return;
		this.m_startPos = this.m_targetPos;
		this.m_lerpTime = 1;
		this.m_isMove = false;

		this.onStop();
	}
	BTG.CharacterBase.prototype.update = function (ftime) {
		//cc.log("BTG.CharacterBase.prototype.update");
		if (this.m_pImage.isShow() === false)
			return;

		if (this.m_isMove) {
			this.m_lerpTime += ftime * this.m_lerpSpeed;
			if (this.m_lerpTime >= 1) {
				this.stop();
			}

			var scenePos = lerpPoint(this.m_startPos, this.m_targetPos, this.m_lerpTime);
			this.setPosition(scenePos);
		}
		if (!this.isLockZorder) {
			this.m_runCount += ftime;
			if (this.m_runCount >= 0.4) {
				this.m_runCount = 0;
				var zOrder = calcZOrder(this.getPosition().y);
				this.m_pImage.resetZOrder(zOrder);
			}
		}
		this.onUpdate(ftime);
	}
	BTG.CharacterBase.prototype.inRectLR = function (tSceneLeft, tSceneRight) {
		return this.m_pImage.inRectLR(tSceneLeft, tSceneRight);
	}

	BTG.CharacterBase.prototype.clip = function (bIsClip) {
		if (!this.m_pImage.isShow())
			return;
		//这里可以优化，暂时注释掉
		this.m_pImage.m_pBatch.setVisible(!bIsClip);
	}
	BTG.CharacterBase.prototype.isShow = function () {
		return this.m_pImage.isShow();
	}
	BTG.CharacterBase.prototype.show = function (bIsShow) {
		this.m_pImage.show(bIsShow);
		this.onShow(bIsShow);
	}
	BTG.CharacterBase.prototype.flashEq = function () {
		var eqFlagArray6 = getHeroEquipArray(this.m_ID)
		this.setupEq(eqFlagArray6);
	}
	BTG.CharacterBase.prototype.setupEq = function (eqFlagArray6) {
		this.m_pImage.resetEq(eqFlagArray6);
	}

	BTG.CharacterBase.prototype.getParentNode = function () {
		return rpgGame.getGameScene().getSceneRoot();
	}
	BTG.CharacterBase.prototype.create = function (nGameID, nCharacterResID, vPos, eqFlagArray6) {
		this.m_ResID = nCharacterResID;
		this.m_ID = nGameID;
		if (arguments.length <= 2)
			vPos = cc.p(0, 0);

		this.m_pImage = new BTG.CharacterRender();
		if(this.isLoadBoat) {
			this.m_pImage.createBoat(this, nCharacterResID, this.getParentNode(), vPos, calcZOrder(vPos.y));
		} else {
			this.m_pImage.create(this, nCharacterResID, this.getParentNode(), vPos, calcZOrder(vPos.y));
		}
		//setup eq
		this.m_eqArray = eqFlagArray6;
		if (eqFlagArray6 != undefined) {
			this.setupEq(eqFlagArray6);
		}
		this.onCreate();
	}
	
	BTG.CharacterBase.prototype.createCharacter = function () {
		this.isLoadBoat = false;
		vPos = cc.p(0, 0);
		this.m_pImage.create(this, this.m_ResID, this.getParentNode(), vPos, calcZOrder(vPos.y));
	}
	
	BTG.CharacterBase.prototype.createBoat = function () {
		this.isLoadBoat = true;
		vPos = cc.p(0, 0);
		this.m_pImage.createBoat(this, this.m_ResID, this.getParentNode(), vPos, calcZOrder(vPos.y));
	}

	BTG.CharacterBase.prototype.setPosition = function (vPos) {
		this.m_pImage.setPos(vPos);
		this.onSetPosition(vPos);
	}
	BTG.CharacterBase.prototype.getPosition = function () {
		return this.m_pImage.getPos();
	}
	BTG.CharacterBase.prototype.lockZorder = function (isLock, zOrder) {
		this.isLockZorder = isLock;
		if (zOrder)
			this.m_pImage.resetZOrder(zOrder);
	}
	BTG.CharacterBase.prototype.setParent = function (pParent, zOrder, tag) {
		var par = this.getRoot().getParent();
		par.removeChild(this.getRoot());
		pParent.addChild(this.getRoot(), zOrder, tag);
	}
	BTG.CharacterBase.prototype.showName = function (isShow) {
		this.m_pNameTTF.setVisible(isShow);
		this.m_pNameBg.setVisible(isShow);
	}
	BTG.CharacterBase.prototype.getRect = function () {
		return this.m_pImage.m_AABBBox;
	}

	BTG.CharacterBase.prototype.attchEffect = function (characterResId) {
		//临时处理npc加特效
		if (characterResId >= 100 && characterResId < 200) {
			var npcData = rpgGame.getData().find(dataKey.npcTable, characterResId);
			if (npcData.effects === undefined) return;

			for (var i = 0; i < npcData.effects.length; i++) {
				if (npcData.effects[i].name === undefined)
					continue;
				this.m_bindEffectList[this.m_bindEffectList.length] = rpgGame.getEffectUtil().add(npcData.effects[i].name,
				this.m_pImage.m_pBatch,
				npcData.effects[i].zOrder, cc.p(npcData.effects[i].x, npcData.effects[i].y));
			}
		} else if (characterResId > 300) {//怪物
			
		}
	}
	BTG.CharacterBase.prototype.addFlipChildNode = function (node) {
		node.setScaleX(this.m_pImage.getDir());
		this.m_childNodeFilpList[this.m_childNodeFilpList.length] = node;
	}
	BTG.CharacterBase.prototype.delFlipChildNode = function (node) {
		for (var i = 0; i < this.m_childNodeFilpList.length; i++) {
			if (node === this.m_childNodeFilpList[i]) {
				this.m_childNodeFilpList.splice(i, 1);
				return;
			}
		}
	}
})(BTG);