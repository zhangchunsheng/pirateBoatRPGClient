/**
 * 角色
 * 作者：peter
 * 日期
 */
(function(BTG) {
	BTG.characterFrames = [];
	BTG.characterStandSpriteFrames = [];
	BTG.characterRunSpriteFrames = [];
	BTG.characterActionDelayTime = 300;
	BTG.characterRunActionDelayTime = 200;
	BTG.characterBoatSpriteFrames = [];
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
		this.m_spriteImage = [];
		this.m_runSpriteImage = [];
		this.m_bIsShow = true;
		this.frames = [];
		this.standFrames = [];
		this.runFrames = [];
		this.rootNode = null;
		this.currentSprite = 0;
		this.currentRunSprite = 0;
		this.count = 1;
		this.isLoadBoat = false;
		this.boatFrames = {};
		this.m_boatSpriteImage = {};
		this.currentBoatSprite = {};
		this.currentPicture = "";

		this.m_AABBBox = cc.rect(0, 0, 0, 0);

		this.m_curAllRunTime = 0;
		this.m_runTime = [];
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
		//this.setImageBlock(0, 1);
	}

	BTG.CharacterRender.prototype.setImageBlock = function (AT_type, nEqId) {
		var spriteFC = cc.SpriteFrameCache.getInstance();
		var blockFileName = this.standFrames[AT_type];

		var nodePar = this.m_spriteImage[AT_type].getParent();
		var childresNodes = this.m_spriteImage[AT_type].getChildren();

		if (this.m_spriteImage[AT_type])
			nodePar.removeChild(this.m_spriteImage[AT_type], true);

		this.m_spriteImage[AT_type] = cc.Sprite.createWithSpriteFrameName(blockFileName);
		if (this.m_spriteImage[AT_type] === null) {
			cc.alert("[error]setImageBlock  not find,fileName:" + blockFileName);
		}
		for (var i = 0; i < childresNodes.length; i++)
			this.m_spriteImage[AT_type].addChild(childresNodes[i], childresNodes[i].getZOrder(), childresNodes[i].getTag());
		nodePar.addChild(this.m_spriteImage[AT_type], 0);
		this.m_spriteImage[AT_type].setAnchorPoint(cc.p(0, 0));
		this.m_spriteImage[AT_type].setPosition(cc.p(100, 100));
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
		if (this.m_pBatch.getZOrder() != newZOrder)
			this.m_parNode.reorderChild(this.m_pBatch, newZOrder);
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
		var sprite = null;
		if(this.isLoadBoat) {
			sprite = this.m_boatSpriteImage["stand"][0];
		} else {
			sprite = this.m_spriteImage[0];
		}
		var pos = cc.p(0, 0);
		if(sprite === null)
			return pos;
		var size = sprite.getContentSize();
		pos.x = ahPoint.x * size.width;
		pos.y = ahPoint.y * size.height;

		return sprite.convertToWorldSpace(pos);
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
		//cc.log("time" + this.m_curAllRunTime);
		this.m_curAllRunTime += dt;

		for (var i = 0; i < BTG.CT_Count; i++) {
			this.m_runTime[i] += dt;
		}
		//this.m_AABBBox = this.calcBoundbox();
		//var p = this.m_pBatch.getChildByTag(999);
		//p.setPosition(this.m_AABBBox.origin);
		//p.setContentSize(this.m_AABBBox.size);
	}
	
	BTG.CharacterRender.prototype.updateStand = function() {
		if(this.rootNode == null)
			return;
		if(this.count < BTG.characterActionDelayTime) {
			this.count += 60;
			return;
		}
		if(this.isLoadBoat) {
			/*this.rootNode.addChild(this.m_boatSpriteImage["stand"][this.currentBoatSprite["stand"]]);
			this.rootNode.removeChild(this.m_boatSpriteImage["stand"][this.currentBoatSprite["stand"]]);
			this.currentBoatSprite["stand"]++;
			if(this.currentBoatSprite["stand"] >= this.m_boatSpriteImage["stand"].length)
				this.currentBoatSprite["stand"] = 0;
			this.rootNode.addChild(this.m_boatSpriteImage["stand"][this.currentBoatSprite["stand"]]);*/
		} else {
			this.rootNode.removeChild(this.m_spriteImage[this.currentSprite]);
			this.rootNode.removeChild(this.m_runSpriteImage[this.currentRunSprite]);
			//this.rootNode.removeAllChildrenWithCleanup(true);
			this.currentSprite++;
			if(this.currentSprite >= this.standFrames.length)
				this.currentSprite = 0;
			this.rootNode.addChild(this.m_spriteImage[this.currentSprite]);
		}
		this.count = 1;
	}
	
	BTG.CharacterRender.prototype.updateRun = function() {
		if(this.rootNode == null)
			return;
		if(this.count < BTG.characterRunActionDelayTime) {
			this.count += 60;
			return;
		}
		if(this.isLoadBoat) {
			
		} else {
			this.rootNode.removeChild(this.m_spriteImage[this.currentSprite]);
			this.rootNode.removeChild(this.m_runSpriteImage[this.currentRunSprite]);
			//this.rootNode.removeAllChildrenWithCleanup(true);
			this.currentRunSprite++;
			if(this.currentRunSprite >= this.runFrames.length)
				this.currentRunSprite = 0;
			this.rootNode.addChild(this.m_runSpriteImage[this.currentRunSprite]);
		}
		this.count = 1;
	}

	BTG.CharacterRender.prototype.runAction = function (AA_type, overPlayAction_AA_type) {
		cc.log("runAction:" + AA_type);
		if (AA_type === this.m_curActionAA_type)
			return;
		//AA_type = BTG.CA_Dodge;
		if(this.m_pBatch.isVisible() === false)
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
		if(this.currentPicture == "character")
			return;
		this.m_isLoadFinal = true;
		this.m_pBatch.removeChildByTag(999, true);
		var plistName = "res/c/" + this.m_nActorResID + "/" + this.m_nActorResID + ".plist";
		var pngName = "res/c/" + this.m_nActorResID + "/" + this.m_nActorResID + ".png";
		cc.log("plistName:" + plistName);
		cc.log("pngName:" + pngName);

		var spriteFC = cc.SpriteFrameCache.getInstance();
		spriteFC.addSpriteFrames(plistName, pngName);

		for (var i = 0; i < this.standFrames.length; i++) {
			var blockFileName = this.standFrames[i];
			this.m_spriteImage[i] = cc.Sprite.createWithSpriteFrameName(blockFileName);
			if (this.m_spriteImage[i] === null) {
				cc.alert("[Error]" + blockFileName + "plist have, image not find");
				continue;
			}

			this.m_spriteImage[i].setAnchorPoint(cc.p(0.5, 0.5));
			this.m_spriteImage[i].setPosition(0, 0);
			this.m_spriteImage[i].setFlipX(true);
		}
		for (var i = 0; i < this.runFrames.length; i++) {
			var blockFileName = this.runFrames[i];
			this.m_runSpriteImage[i] = cc.Sprite.createWithSpriteFrameName(blockFileName);
			if (this.m_runSpriteImage[i] === null) {
				cc.alert("[Error]" + blockFileName + "plist have, image not find");
				continue;
			}

			this.m_runSpriteImage[i].setAnchorPoint(cc.p(0.5, 0.5));
			this.m_runSpriteImage[i].setPosition(0, 0);
			this.m_runSpriteImage[i].setFlipX(true);
		}
		this.rootNode = cc.Node.create();
		this.rootNode.addChild(this.m_spriteImage[this.currentSprite]);
		//this.rootNode.addChild(this.m_runSpriteImage[this.currentRunSprite]);
		this.m_pBatch.addChild(this.rootNode, 0);
		this.m_AABBBox = this.calcBoundbox();
		this.m_pBatch.setContentSize(this.m_AABBBox.size);
		this.currentPicture = "character";

		if (this.m_initEqMap) {
			this.resetEq(this.m_initEqMap)
			this.m_initEqMap = null;
		}
		var shadow = BTG.ProxySprite.create("res/c/shadow.png", this.m_pBatch, cc.p(0, -60), -1000, BTG.CharacterRender.tag_Shadow);
		if (this.m_owner)
			this.m_owner.resLoad(true);
	}
	
	BTG.CharacterRender.prototype.initBoat = function () {
		if(this.currentPicture == "boat")
			return;
		this.m_isLoadFinal = true;
		this.m_pBatch.removeChildByTag(999, true);
		for(var i = 0 ; i < BTG.characterBoatAction.length ; i++) {
			var plistName = "res/p/" + this.m_nActorResID + "/p" + this.m_nActorResID + "_" + BTG.characterBoatAction[i] + ".plist";
			var pngName = "res/p/" + this.m_nActorResID + "/p" + this.m_nActorResID + "_" + BTG.characterBoatAction[i] + ".png";
			cc.log("plistName:" + plistName);
			cc.log("pngName:" + pngName);

			var spriteFC = cc.SpriteFrameCache.getInstance();
			spriteFC.addSpriteFrames(plistName, pngName);

			for (var j = 0; j < this.boatFrames[BTG.characterBoatAction[i]].length; j++) {
				var blockFileName = this.boatFrames[BTG.characterBoatAction[i]][j];
				this.m_boatSpriteImage[BTG.characterBoatAction[i]][j] = cc.Sprite.createWithSpriteFrameName(blockFileName);
				if (this.m_boatSpriteImage[BTG.characterBoatAction[i]][j] === null) {
					cc.alert("[Error]" + blockFileName + "plist have, image not find");
					continue;
				}

				this.m_boatSpriteImage[BTG.characterBoatAction[i]][j].setAnchorPoint(cc.p(0.5, 0.5));
				this.m_boatSpriteImage[BTG.characterBoatAction[i]][j].setPosition(0, 0);
				this.m_boatSpriteImage[BTG.characterBoatAction[i]][j].setFlipX(false);
			}
			this.currentBoatSprite[BTG.characterBoatAction[i]] = 0;
		}
		
		this.rootNode = cc.Node.create();
		this.rootNode.addChild(this.m_boatSpriteImage["stand"][this.currentBoatSprite["stand"]]);
		//this.rootNode.addChild(this.m_runSpriteImage[this.currentRunSprite]);
		this.m_pBatch.addChild(this.rootNode, 0);
		this.m_AABBBox = this.calcBoatBoundbox();
		this.m_pBatch.setContentSize(this.m_AABBBox.size);
		this.currentPicture = "boat";

		if (this.m_initEqMap) {
			this.resetEq(this.m_initEqMap)
			this.m_initEqMap = null;
		}
		//var shadow = BTG.ProxySprite.create("res/c/shadow.png", this.m_pBatch, cc.p(0, -60), -1000, BTG.CharacterRender.tag_Shadow);
		if (this.m_owner)
			this.m_owner.resLoad(true);
	}
	
	BTG.CharacterRender.prototype.changePicture = function(type) {
		this.m_parNode.removeChild(this.m_pBatch);
		this.m_pBatch = null;
		this.rootNode = null;
		this.m_pBatch = cc.Node.create();
		this.m_parNode.addChild(this.m_pBatch, this.m_layer);
		if(type == "boat") {
			this.currentPicture = "boat";
			for(var i = 0 ; i < BTG.characterBoatAction.length ; i++) {
				this.currentBoatSprite[BTG.characterBoatAction[i]] = 0;
			}
			this.rootNode = cc.Node.create();
			this.rootNode.addChild(this.m_boatSpriteImage["stand"][this.currentBoatSprite["stand"]]);
			this.m_pBatch.addChild(this.rootNode, 0);
			this.m_AABBBox = this.calcBoatBoundbox();
			this.m_pBatch.setContentSize(this.m_AABBBox.size);
		} else {
			this.currentPicture = "character";
			this.currentSprite = 0;
			this.currentRunSprite = 0;
			this.rootNode = cc.Node.create();
			this.rootNode.addChild(this.m_spriteImage[this.currentSprite]);
			//this.rootNode.addChild(this.m_runSpriteImage[this.currentRunSprite]);
			this.m_pBatch.addChild(this.rootNode, 0);
			this.m_AABBBox = this.calcBoundbox();
			this.m_pBatch.setContentSize(this.m_AABBBox.size);
		}
	}

	BTG.CharacterRender.prototype.create = function(owner, nCharacterResID, parNode, pos, layer) {
		this.m_owner = owner;
		this.isLoadBoat = false;

		this.m_nActorResID = nCharacterResID;
		this.m_parNode = parNode;
		this.m_layer = layer;
		//this.m_pBatch = cc.LayerColor.create(cc.c4(255, 0, 0, 255), 5000, 5000);
		//this.m_pBatch.ignoreAnchorPointForPosition(false);
		// this.m_pBatch.setAnchorPoint(cc.p(0.5, 1));
		if(this.m_pBatch != null)
			this.m_parNode.removeChild(this.m_pBatch);
		this.m_pBatch = cc.Node.create();
		// this.m_pBatch = CharacterRootNode.create();
		this.m_parNode.addChild(this.m_pBatch, this.m_layer);
		this.setPos(cc.p(pos.x, pos.y));
		cc.log("this.m_nActorResID" + this.m_nActorResID);

		var _loadingImage = cc.Sprite.create("res/c/loading.png");

		_loadingImage.setAnchorPoint(cc.p(0.5, 0));
		this.m_pBatch.addChild(_loadingImage, 0, 999);
		cc.log(BTG.characterFrames);

		if(typeof BTG.characterFrames[this.m_nActorResID] == "object") {
			this.frames = BTG.characterFrames[this.m_nActorResID];
			this.standFrames = BTG.characterStandSpriteFrames[this.m_nActorResID];
			this.runFrames = BTG.characterRunSpriteFrames[this.m_nActorResID];
			this.init();
		} else
			loadCharacter("res/c/" + this.m_nActorResID + "/" + this.m_nActorResID, "res/c/" + this.m_nActorResID + "/run", this);
	}
	
	BTG.CharacterRender.prototype.createBoat = function(owner, nCharacterResID, parNode, pos, layer) {
		this.m_owner = owner;
		this.isLoadBoat = true;

		this.m_nActorResID = nCharacterResID;
		this.m_parNode = parNode;
		this.m_layer = layer;
		//this.m_pBatch = cc.LayerColor.create(cc.c4(255, 0, 0, 255), 5000, 5000);
		//this.m_pBatch.ignoreAnchorPointForPosition(false);
		// this.m_pBatch.setAnchorPoint(cc.p(0.5, 1));
		if(this.m_pBatch != null)
			this.m_parNode.removeChild(this.m_pBatch);
		this.m_pBatch = cc.Node.create();
		// this.m_pBatch = CharacterRootNode.create();
		this.m_parNode.addChild(this.m_pBatch, this.m_layer);
		this.setPos(cc.p(pos.x, pos.y));
		cc.log("this.m_nActorResID" + this.m_nActorResID);
		for(var i = 0 ; i < BTG.characterBoatAction.length ; i++) {
			this.m_boatSpriteImage[BTG.characterBoatAction[i]] = [];
		}

		var _loadingImage = cc.Sprite.create("res/c/loading.png");

		_loadingImage.setAnchorPoint(cc.p(0.5, 0));
		this.m_pBatch.addChild(_loadingImage, 0, 999);
		cc.log(BTG.characterBoatSpriteFrames);

		if(typeof BTG.characterBoatSpriteFrames[this.m_nActorResID] == "object") {
			this.boatFrames = BTG.characterBoatSpriteFrames[this.m_nActorResID];
			this.initBoat();
		} else
			loadCharacterBoat("res/p/" + this.m_nActorResID + "/p" + this.m_nActorResID, this);
	}

	BTG.CharacterRender.prototype.parseXmlData = function (xmlObject) {
		if(typeof BTG.characterFrames[this.m_nActorResID] == "object") {
			this.frames = BTG.characterFrames[this.m_nActorResID];
			this.standFrames = BTG.characterStandSpriteFrames[this.m_nActorResID];
			this.runFrames = BTG.characterRunSpriteFrames[this.m_nActorResID];
			this.init();
			return;
		}
		BTG.characterFrames[this.m_nActorResID] = [];
		BTG.characterStandSpriteFrames[this.m_nActorResID] = [];
		BTG.characterRunSpriteFrames[this.m_nActorResID] = [];
		for( var i in xmlObject.frames ) {
			if (xmlObject.frames.hasOwnProperty(i)){
				BTG.characterFrames[this.m_nActorResID].push(i);
				if(i.indexOf("stand") == 0) {
					BTG.characterStandSpriteFrames[this.m_nActorResID].push(i);
				} else if(i.indexOf("run") == 0) {
					BTG.characterRunSpriteFrames[this.m_nActorResID].push(i);
				} else {
					BTG.characterStandSpriteFrames[this.m_nActorResID].push(i);
				}
			}
		}
		this.frames = BTG.characterFrames[this.m_nActorResID];
		this.standFrames = BTG.characterStandSpriteFrames[this.m_nActorResID];
		this.runFrames = BTG.characterRunSpriteFrames[this.m_nActorResID];
		for (var i = 0; i < BTG.characterStandSpriteFrames[this.m_nActorResID].length ; i++) {
			this.m_spriteImage[i] = null;
		}
		for (var i = 0; i < BTG.characterRunSpriteFrames[this.m_nActorResID].length ; i++) {
			this.m_runTime[i] = 0.0;
			this.m_runSpriteImage[i] = null;
		}
		this.init();
	}
	
	BTG.CharacterRender.prototype.parseXmlData_boat = function (xmlObjects) {
		if(typeof BTG.characterBoatSpriteFrames[this.m_nActorResID] == "object") {
			this.boatFrames = BTG.characterBoatSpriteFrames[this.m_nActorResID];
			this.initBoat();
			return;
		}
		BTG.characterBoatSpriteFrames[this.m_nActorResID] = {};
		for(var i = 0 ; i < BTG.characterBoatAction.length ; i++) {
			xmlObject = xmlObjects[BTG.characterBoatAction[i]];
			BTG.characterBoatSpriteFrames[this.m_nActorResID][BTG.characterBoatAction[i]] = [];
			for(var j in xmlObject.frames) {
				if (xmlObject.frames.hasOwnProperty(j)){
					BTG.characterBoatSpriteFrames[this.m_nActorResID][BTG.characterBoatAction[i]].push(j);
				}
			}
			this.boatFrames = BTG.characterBoatSpriteFrames[this.m_nActorResID];
			this.m_boatSpriteImage[BTG.characterBoatAction[i]] = [];
			for (var j = 0; j < BTG.characterBoatSpriteFrames[this.m_nActorResID][BTG.characterBoatAction[i]].length ; j++) {
				this.m_boatSpriteImage[BTG.characterBoatAction[i]][j] = null;
			}
		}
		this.initBoat();
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
		var pCurSpr = this.m_spriteImage[0];
		var trect = pCurSpr.getBoundingBoxToWorld();
		trect.origin = this.m_pBatch.convertToNodeSpace(trect.origin);
		boundboxRect = cc.Rect.CCRectUnion(boundboxRect, trect);
		return boundboxRect;
	}
	
	BTG.CharacterRender.prototype.calcBoatBoundbox = function () {
		var boundboxRect = cc.rect(0, 0, 0, 0);
		var pCurSpr = this.m_boatSpriteImage["stand"][0];
		var trect = pCurSpr.getBoundingBoxToWorld();
		trect.origin = this.m_pBatch.convertToNodeSpace(trect.origin);
		boundboxRect = cc.Rect.CCRectUnion(boundboxRect, trect);
		return boundboxRect;
	}
})(BTG);