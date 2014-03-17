/**
 * 角色
 * 作者：peter
 * 日期
 */
(function(BTG) {
	BTG.s_ImageKeyName = [
		"gen",
		"shen",
		"tou",
		"shou_z_s",
		"shou_y_s",
		"shou_z_mid",
		"shou_y_mid",
		"shou_z_x",
		"shou_y_x",
		"tui_z_s",
		"tui_y_s",
		"tui_z_mid",
		"tui_y_mid",
		"tui_z_x",
		"tui_y_x",
		"wuqi"
	];
	BTG.noUserFlag = -1;

	BTG.CharacterLayoutData = function() {
		this.m_parNode = "";
		this.m_actorType = BTG.noUserFlag; //类型=-1 表示没有这个块
		this.m_layer = 0;
		this.m_pointAH = cc.p(0.5, 0.5);
		this.m_initPos = cc.p(0, 0);
	};

	var g_layerDataMap = new Object(); //布局数据
	BTG.CharacterRender = function() {
		this.m_eqMapArray = new Array(BTG.EQP_Count);
		this.m_initEqMap = null;
		for (var i = 0; i < BTG.EQP_Count; i++)
			this.m_eqMapArray[i] = 0;

		this.m_overPlayActionAA_type = null;
		this.m_curActionAA_type = null;
		this.m_owner = null;
		this.m_isLoadFinal = false;
		this.m_nActorResID = null;
		this.m_parNode = null;
		this.m_layer = 0;
		this.m_actorDataArray = null;
		this.m_spriteImage = new Array(BTG.CT_Count);
		this.m_bIsShow = true;

		this.m_AABBBox = cc.rect(0, 0, 0, 0);

		this.m_curAllRunTime = 0;
		this.m_runTime = new Array(BTG.CT_Count);
		for (var i = 0; i < BTG.CT_Count; i++) {
			this.m_runTime[i] = 0.0;
			this.m_spriteImage[i] = null;
		}
		this.m_pBatch = null;

		this.m_curPos = cc.p(0, 0);
		this.m_curActionObjForCache = null;

		this.m_rightParentNode = -1;
	}
	BTG.ARSD_Right = -1;
	BTG.ARSD_Left = 1;
	BTG.CharacterRender.tag_Shadow = 998;
	BTG.CharacterRender.tag_Name = 997;
	BTG.CharacterRender.prototype.getResId = function () {
		return this.m_nActorResID;
	}
	BTG.CharacterRender.prototype.getEqList = function () {
		return this.m_eqMapArray;
	}

	//为了在换装时新生成贴图
	BTG.CharacterRender.prototype.setCurPlayActionForCache = function (pAction) {
		this.m_curActionObjForCache = pAction;
	}
	BTG.CharacterRender.prototype.getOwner = function () {
		return this.m_owner;
	}
	BTG.CharacterRender.prototype.getBoundboxCenterX = function () {
		return 0;
		return this.m_AABBBox.origin.x + this.m_AABBBox.size.width / 2;
	}
	BTG.CharacterRender.prototype.getHeadPosForWorld = function () {
		var rootPos = this.m_pBatch.getPosition();
		var ret = cc.p(rootPos.x + this.getBoundboxCenterX(),
		this.m_AABBBox.size.height + rootPos.y);

		return ret;
	}
	BTG.CharacterRender.prototype.getCenterForWorld = function () {
		var rootPos = this.m_pBatch.getPosition();
		var ret = cc.p(rootPos.x + this.getBoundboxCenterX(),
		this.m_AABBBox.size.height / 2 + rootPos.y);
		
		return ret;
	}
	BTG.CharacterRender.prototype.getHeadPosForNode = function () {
		var ret = cc.p(0, this.m_AABBBox.origin.y + this.m_AABBBox.size.height);
		return ret;
	}
	BTG.CharacterRender.prototype.actionFinal = function () {
		if (this.m_owner) {
			if (this.m_overPlayActionAA_type !== null) {
				this.runAction(this.m_overPlayActionAA_type);
				this.m_overPlayActionAA_type = null;
			}
			this.m_owner.actionFinal();
		}
	}
	//只有角色支持换装
	BTG.CharacterRender.prototype.resetEq = function (eqFlagArray6) {
		if (this.m_isLoadFinal == false) {//没load
			this.m_initEqMap = eqFlagArray6;
			return;
		}
		for (var i = 0; i < BTG.EQP_Count; i++) {
			if (this.m_eqMapArray[i] == eqFlagArray6[i]) //跟上次的一样
			continue;

			if (this.m_curActionObjForCache) {
				this.m_curActionObjForCache.cacheDel();
			}

			this.m_eqMapArray[i] = eqFlagArray6[i];
			// tou
			if (i == BTG.EQP_Head) {
				this.setImageBlock(BTG.CT_Head, eqFlagArray6[i]);
				continue;
			}
			//裤子2块
			if (i == BTG.EQP_Trousers) {
				this.setImageBlock(BTG.CT_LeftLeg, eqFlagArray6[i]);
				this.setImageBlock(BTG.CT_RightLeg, eqFlagArray6[i]);

				continue;
			}
			//鞋子4块
			if (i == BTG.EQP_Shoes) {
				for (var iXie = BTG.CT_LeftMiniLeg; iXie <= BTG.CT_RightFoot; ++iXie)
				this.setImageBlock(iXie, eqFlagArray6[i]);
				continue;
			}

			//手腕2k
			if (i == BTG.EQP_Wrist) {
				this.setImageBlock(BTG.CT_LeftHandMid, eqFlagArray6[i]);
				this.setImageBlock(BTG.CT_RightHandMid, eqFlagArray6[i]);
				continue;
			}
			//sheng
			if (i == BTG.EQP_Clothes) {
				this.setImageBlock(BTG.CT_Body, eqFlagArray6[i]);
				this.setImageBlock(BTG.CT_LeftHandUp, eqFlagArray6[i]);
				this.setImageBlock(BTG.CT_RightHandUp, eqFlagArray6[i]);
				continue;
			}
			if (i == BTG.EQP_Weapon) {
				this.setImageBlock(BTG.CT_Weapon, eqFlagArray6[i]);
				continue;
			}
		}
	}

	BTG.CharacterRender.prototype.setImageBlock = function (AT_type, nEqId) {
		var spriteFC = cc.SpriteFrameCache.getInstance();
		var blockFileName = this.m_nActorResID + "_" + BTG.s_ImageKeyName[AT_type] + "_" + nEqId + ".png";

		var nodePar = this.m_spriteImage[AT_type].getParent();
		var childresNodes = this.m_spriteImage[AT_type].getChildren();

		if (this.m_spriteImage[AT_type]) nodePar.removeChild(this.m_spriteImage[AT_type], true);

		this.m_spriteImage[AT_type] = cc.Sprite.createWithSpriteFrameName(blockFileName);
		if (this.m_spriteImage[AT_type] === null) {
			cc.alert("[error]setImageBlock  not find,fileName:" + blockFileName);
		}
		for (var i = 0; i < childresNodes.length; i++)
			this.m_spriteImage[AT_type].addChild(childresNodes[i], childresNodes[i].getZOrder(), childresNodes[i].getTag());
		nodePar.addChild(this.m_spriteImage[AT_type], this.m_actorDataArray[AT_type].m_layer);
		this.m_spriteImage[AT_type].setAnchorPoint(cc.p(this.m_actorDataArray[AT_type].m_pointAH.x, this.m_actorDataArray[AT_type].m_pointAH.y));
		this.m_spriteImage[AT_type].setPosition(cc.p(this.m_actorDataArray[AT_type].m_initPos.x, this.m_actorDataArray[AT_type].m_initPos.y));

	}
	BTG.CharacterRender.prototype.isShow = function () {
		return this.m_bIsShow;
	}
	BTG.CharacterRender.prototype.show = function (isShow) {
		this.m_bIsShow = isShow;
		this.m_pBatch.setVisible(isShow);
	}
	BTG.CharacterRender.prototype.del = function () {
		rpgGame.getCharacterActionUtil().remove(this); //删除动作管理器中的
		this.m_parNode.removeChild(this.m_pBatch, true);
	}
	BTG.CharacterRender.prototype.resetZOrder = function (newZOrder) {
		if (this.m_pBatch.getZOrder() != newZOrder) this.m_parNode.reorderChild(this.m_pBatch, newZOrder);
	}

	BTG.CharacterRender.prototype.getRoot = function () {
		return this.m_pBatch;
	}
	BTG.CharacterRender.prototype.setChildPosRot = function (iKey, pos, rot) {
		if (this.m_spriteImage[iKey]) {
			this.m_spriteImage[iKey].setPosition(cc.p(pos.x, pos.y));
			this.m_spriteImage[iKey].setRotation(rot);
		}
	}
	BTG.CharacterRender.prototype.getSprite = function (iKey) {
		return this.m_spriteImage[iKey];
	}
	BTG.CharacterRender.prototype.getSpriteWorldPos = function (iKey, ahPoint) {
		var pos = cc.p(0, 0);
		if (this.m_spriteImage[iKey] === null)
			return pos;
		var size = this.m_spriteImage[iKey].getContentSize();
		pos.x = ahPoint.x * size.width;
		pos.y = ahPoint.y * size.height;

		return this.m_spriteImage[iKey].convertToWorldSpace(pos);
	}
	BTG.CharacterRender.prototype.setChildRot = function (iKey, rot) {
		if (this.m_spriteImage[iKey]) {
			this.m_spriteImage[iKey].setRotation(rot);
		}
	}
	BTG.CharacterRender.prototype.replay = function () {
		this.m_curAllRunTime = 0;
		for (var i = 0; i < BTG.CT_Count; i++) {
			this.m_runTime[i] = 0;
		}
	}

	BTG.CharacterRender.prototype.updateActionTime = function (dt) {
		//cc.log("time"+this.m_curAllRunTime);
		this.m_curAllRunTime += dt;

		for (var i = 0; i < BTG.CT_Count; i++) {
			this.m_runTime[i] += dt;
		}
		//this.m_AABBBox = this.calcBoundbox();
		//var p = this.m_pBatch.getChildByTag(  999);
		//p.setPosition(this.m_AABBBox.origin);
		//p.setContentSize(this.m_AABBBox.size);
	}

	BTG.CharacterRender.prototype.runAction = function (AA_type, overPlayAction_AA_type) {
		if (AA_type === this.m_curActionAA_type)
			return;
		// AA_type = BTG.CA_Dodge;
		if (this.m_pBatch.isVisible() === false)
			return;

		var actionFile = rpgGame.getGameData().getActionFile(this.m_nActorResID, AA_type);
		if (actionFile === null) //配置文件没加载完成
		return;
		if (AA_type === BTG.CA_Embattled) {
			var actionList = [];
			var pos = this.getPos();
			var rect = cc.rect(pos.x - 7, pos.y - 7, 14, 14);
			for (var i = 0; i < 10; i++) {
				var randPos = rectRandPoint(rect);
				actionList[i] = cc.MoveTo.create(0.03, randPos);
			}
			this.m_pBatch.runAction(cc.Sequence.create(actionList));
		}
		this.m_overPlayActionAA_type = overPlayAction_AA_type === undefined ? null : overPlayAction_AA_type;
		this.m_curActionAA_type = AA_type;
		rpgGame.getCharacterActionUtil().add(this, actionFile);
	}


	BTG.CharacterRender.prototype.setPos = function (pos) {
		this.m_curPos = cc.p(pos.x, pos.y);
		if (this.m_pBatch) {
			this.m_pBatch.setPosition(cc.p(pos.x, pos.y));
		}
	}
	BTG.CharacterRender.prototype.getPos = function () {
		return this.m_pBatch.getPosition();
	}

	BTG.CharacterRender.prototype.getDir = function () {
		if (this.m_pBatch.getScaleX() < 0)
			return BTG.ARSD_Right;
		else
			return BTG.ARSD_Left;
	}
	BTG.CharacterRender.prototype.setDirection = function (direction) {
		this.m_pBatch.setScaleX(direction);
	}

	BTG.CharacterRender.prototype.init = function () {
		this.m_isLoadFinal = true;
		this.m_pBatch.removeChildByTag(999, true);
		var plistName = "res/c/" + this.m_nActorResID + "/" + this.m_nActorResID + ".plist";
		var pngName = "res/c/" + this.m_nActorResID + "/" + this.m_nActorResID + ".png";

		var spriteFC = cc.SpriteFrameCache.getInstance();
		spriteFC.addSpriteFrames(plistName, pngName);
		
		for (var i = 0; i < BTG.s_ImageKeyName.length; i++) {
			if (this.m_actorDataArray[i].m_actorType === BTG.noUserFlag) //没使用这个块
				continue;
			if (i == BTG.CT_Root) {//根
				// var pFrame = spriteFC.getSpriteFrame(this.m_nActorResID + "_" + BTG.s_ImageKeyName[1] + ".png");
				//this.m_spriteImage[ i  ] = cc.Sprite.createWithTexture(pFrame.getTexture() , cc.RectMake(0,0,1,1) );
				this.m_spriteImage[i] = cc.Node.create();
				//this.m_spriteImage[i] = cc.LayerColor.create(cc.c4(255, 0, 0,255), 100, 100);
			} else {
				var blockFileName = this.m_nActorResID + "_" + BTG.s_ImageKeyName[i] + "_0.png"; //初始默认为第0套
				//this.m_spriteImage[i ] =  cc.Sprite.createWithBatchNode (this.m_pBatch , pFrame.getRect());
				//this.m_spriteImage[i] = cc.Sprite.createWithTexture(pFrame.getTexture(), pFrame.getRect());
				this.m_spriteImage[i] = cc.Sprite.createWithSpriteFrameName(blockFileName);
				if (this.m_spriteImage[i] === null) {
					cc.alert("[Error]" + blockFileName + "plist have, image not find");
					this.m_actorDataArray[i].m_actorType = BTG.noUserFlag;
					continue;
				}
			}

			var pCurSpr = this.m_spriteImage[i];
			var pActorData = this.m_actorDataArray[i];

			pCurSpr.setAnchorPoint(pActorData.m_pointAH);
			pCurSpr.setPosition(cc.p(pActorData.m_initPos.x, pActorData.m_initPos.y));
		}

		for (var i = 0; i < BTG.s_ImageKeyName.length; i++) {
			var pCurSpr = this.m_spriteImage[i];
			var pActorData = this.m_actorDataArray[i];
			if (this.m_actorDataArray[i].m_actorType === BTG.noUserFlag) //没使用这个块
				continue;

			if (i == BTG.CT_Root)
				this.m_pBatch.addChild(pCurSpr, 0);
			else {
				if (!this.m_spriteImage[pActorData.m_parNode]) {
					cc.alert("[error]parent" + pActorData.m_parNode + " cur " + BTG.s_ImageKeyName[i] + "[not par Node ]");
					continue;
				}
				this.m_spriteImage[pActorData.m_parNode].addChild(pCurSpr, pActorData.m_layer);
			}
		}
		this.m_AABBBox = this.calcBoundbox();
		this.m_pBatch.setContentSize(this.m_AABBBox.size);

		if (this.m_initEqMap) {
			this.resetEq(this.m_initEqMap)
			this.m_initEqMap = null;
		}
		var shadow = BTG.ProxySprite.create("res/c/shadow.png", this.m_pBatch, cc.p(0, 0), -1000, BTG.CharacterRender.tag_Shadow);
		if (this.m_owner)
			this.m_owner.resLoad();
	}

	BTG.CharacterRender.prototype.create = function (owner, nCharacterResID, parNode, pos, layer) {
		this.m_owner = owner;
		
		this.m_nActorResID = nCharacterResID;
		this.m_parNode = parNode;
		this.m_layer = layer;
		//this.m_pBatch = cc.LayerColor.create(cc.c4(255, 0, 0, 255), 5000, 5000);
		//this.m_pBatch.ignoreAnchorPointForPosition(false);
		// this.m_pBatch.setAnchorPoint(cc.p(0.5, 1));
		this.m_pBatch = cc.Node.create();
		// this.m_pBatch = CharacterRootNode.create();
		this.m_parNode.addChild(this.m_pBatch, this.m_layer);
		this.setPos(cc.p(pos.x, pos.y));

		var _loadingImage = cc.Sprite.create("res/c/loading.png");

		_loadingImage.setAnchorPoint(cc.p(0.5, 0));
		this.m_pBatch.addChild(_loadingImage, 0, 999);

		if (g_layerDataMap[nCharacterResID] != undefined) {
			this.m_actorDataArray = g_layerDataMap[this.m_nActorResID];
			this.init();
		} else
			loadCharacter_("res/c/" + nCharacterResID + "/" + nCharacterResID, this);
	}

	BTG.CharacterRender.prototype.parseXmlData = function (xmlObject) {
		if (g_layerDataMap[this.m_nActorResID] != undefined) {
			this.m_actorDataArray = g_layerDataMap[this.m_nActorResID];
			this.init();
			return;
		}

		g_layerDataMap[this.m_nActorResID] = new Array(BTG.CT_Count);

		for (var i = 0; i < BTG.CT_Count; i++)
		g_layerDataMap[this.m_nActorResID][i] = new BTG.CharacterLayoutData();

		this.m_actorDataArray = g_layerDataMap[this.m_nActorResID];

		for (var i = 0; i < BTG.CT_Count; i++) {
			var nodes = xmlObject[BTG.s_ImageKeyName[i]];
			if (nodes === undefined) {
				this.m_actorDataArray[i].m_actorType = BTG.noUserFlag;
				continue;
			}
			this.m_actorDataArray[i].m_actorType = i;

			var parIndex = -1;
			var szParNode = nodes["parnode"];

			for (var k = 0; k < BTG.CT_Count; k++) {
				if (szParNode === BTG.s_ImageKeyName[k]) {
					parIndex = k;
					break;
				}
			}
			this.m_actorDataArray[i].m_parNode = parIndex;
			this.m_actorDataArray[i].m_layer = parseInt(nodes["layer"]); //

			this.m_actorDataArray[i].m_pointAH.x = parseFloat(nodes["ahx"]);
			this.m_actorDataArray[i].m_pointAH.y = parseFloat(nodes["ahy"]);

			this.m_actorDataArray[i].m_initPos.x = parseFloat(nodes["posx"]);
			this.m_actorDataArray[i].m_initPos.y = parseFloat(nodes["posy"]);
		}
		this.init();
	}

	BTG.CharacterRender.prototype.pointInRect = function (tTouchScenePos) {
		var vPos = this.m_pBatch.getPosition();
		var tempPos = cc.p(tTouchScenePos.x - vPos.x, tTouchScenePos.y - vPos.y);
		return cc.Rect.CCRectContainsPoint(this.m_AABBBox, tempPos);
	}
	BTG.CharacterRender.prototype.isLoadFinal = function () {
		return this.m_isLoadFinal;
	}
	BTG.CharacterRender.prototype.inRectLR = function (tSceneLeft, tSceneRight) {
		if (this.isLoadFinal() == false)
			return true;

		var vPos = this.m_pBatch.getPosition();
		if (vPos.x + 80 < tSceneLeft)
			return false;
		if (vPos.x - 80 > tSceneRight)
			return false;
		return true;
	}

	BTG.CharacterRender.prototype.calcBoundbox = function () {
		var boundboxRect = cc.rect(0, 0, 0, 0);

		for (var i = 0; i < BTG.s_ImageKeyName.length; i++) {
			if (this.m_actorDataArray[i].m_actorType === BTG.noUserFlag) //没使用这个块
				continue;
			if (i === BTG.CT_Root || i === BTG.CT_RightHandUp || i === BTG.CT_RightHand || i === BTG.CT_RightHandMid)
				continue;

			var pCurSpr = this.m_spriteImage[i];
			var trect = pCurSpr.getBoundingBoxToWorld();
			trect.origin = this.m_pBatch.convertToNodeSpace(trect.origin);
			boundboxRect = cc.Rect.CCRectUnion(boundboxRect, trect);
		}
		return boundboxRect;
	}
})(BTG);