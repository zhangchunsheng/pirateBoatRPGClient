(function(BTG) {
	//场景背景图左下角对齐
	BTG.GameScene = function(nSceneID) {
		this.eScene_Type_All = 0; //多人
		this.eScene_Type_Single = 1; //单人
		this.m_sceneType = this.eScene_Type_All;

		this.m_bIsHasLoad = false;
		this.m_mainMosterList = new Array();

		this.m_curSceneID = -1;
		this.m_resId = -1;

		this.m_sceneEffectList = new Array();
		this.m_sendDoor = null;
		this.m_parNode = null;
		this.m_sceneRoot = cc.Layer.create();
		this.m_sceneRoot.setPosition(cc.p(0, 0));
		this.m_sceneRoot.setAnchorPoint(cc.p(0, 0));
		rpgGame.getGameRoot().addChild(this.m_sceneRoot, getGameZOrder(BTG.GZOrder_Scene));

		this.m_sceneRender = new BTG.SceneRender(); //(isPc() || cc.config.isApp

		this.m_doorTagget = 0;

		this.m_szSceneName = "";
		this.m_pFight = null;
		this.m_tempFightResult = 0;
		this.m_fightABCIdx = -1;

		this.m_polyArray = new Array();
		this.m_polyAABB = [0, 0, 0, 0];
		this.m_cacheOtherList = [];
		this.m_cacheOtherListPos_Id = [];
		this.tmxPath = "";
		this.map = null;
		this.m_tmxbackground;

	};
	BTG.GameScene.prototype.setFightingABCIdx = function (abc_idx) {
		this.m_fightABCIdx = abc_idx;
	}
	BTG.GameScene.prototype.show = function (bIsShow) {
		if (this.m_sceneRoot) {
			this.m_sceneRoot.setVisible(bIsShow);
		}
	}
	BTG.GameScene.prototype.playerMoveStop = function (vPos) {
		if (this.m_sendDoor === null)
			return;
		//if (!this.m_sendDoor.PointIn(vPoos))
		//    return;

		if (P2PDisNoSQ(vPos, this.m_sendDoor.getPosition()) > 60 * 60)
			return;

		if (this.m_doorTagget === 0) {
			rpgGame.getUIUtil().add("DlgBigMap");
		} else {//向服务器发送切地图信息
			
		}
	}

	BTG.GameScene.prototype.update = function (ftime) {
		this.m_sceneRender.update(ftime);
		if (this.m_pFight) {
			this.m_pFight.update(ftime, this.m_tempFightResult, this.m_curSceneID, this.m_fightABCIdx);
			if (this.m_pFight.isOver()) {
				this.delFight();
				//if (this.m_mainMosterList.length === 0) {
					// rpgGame.getUIUtil().add("DlgFightResult", xxx);
				//}
			}
			return;
		}
	}
	BTG.GameScene.prototype.isHasLoad = function () {
		if(this.m_sceneRender.m_nChangeSceneState !== null)
			return true;
		return this.m_bIsHasLoad;
	}

	BTG.GameScene.prototype.createNpc_Monster = function () {
		var mapFileIni = rpgGame.getData().find(dataKey.mapTable, this.m_curSceneID);

		// load npc and monster
		for (var i = 0; i < mapFileIni.monsterPackId.length; i++) {// monster bao
			var monsterBaoId = mapFileIni.monsterPackId[i];
			if (monsterBaoId === undefined || monsterBaoId === null)
				continue;
			var Scene_ABC_Pos = i;

			var monsterPack = rpgGame.getData().find(dataKey.monsterPack, monsterBaoId);
			var monsterAI = monsterPack.aiId; //ai
			var childMonsterList = new Array();
			for (var i = 0; i < monsterPack.monsterId.length; i++) {//最后物品包
				var monsterGameId = -1;
				var monsterCeHuaId = monsterPack.monsterId[iM]; // resid 7
				if (monsterCeHuaId === undefined || monsterCeHuaId === null)
					continue;

				var monsterFightIdx = i; //布阵位置
				var pMonster = rpgGame.getCharacterUtil().add("xxx", BTG.CharacterType_Monster, monsterGameId, monsterCeHuaId, cc.p(100 + iM * 100 + Scene_ABC_Pos * 600, 100));

				pMonster.setFightIdx(monsterFightIdx, monsterBaoId);
				childMonsterList[childMonsterList.length] = pMonster;
			}
			if (childMonsterList.length > 0) {
				childMonsterList[0].setGroupChild(monsterAI, Scene_ABC_Pos, childMonsterList);
				this.m_mainMosterList[this.m_mainMosterList.length] = childMonsterList[0];
			}
		}
		//npc
		for (var i = 0; i < mapFileIni.npcIds.length; i++) {
			var npcGameId = -1;
			var npcCehuaId = mapFileIni.npcIds[i];
			if (npcCehuaId === BTG.GameData.NotDef)
				continue;
			var npcData = rpgGame.getGameData().getNpcFile(npcCehuaId);
			var npcPos = cc.p(npcData.x, npcData.y);
			var pNpc = rpgGame.getCharacterUtil().add("xxx", BTG.CharacterType_Npc, npcGameId, npcCehuaId, npcPos);
		}
	}

	BTG.GameScene.prototype.getGameID = function () {
		return this.m_curSceneID;
	}
	BTG.GameScene.prototype.cacheOtherPlayerPostion = function (arrayPos_id) {
		this.m_cacheOtherListPos_Id[this.m_cacheOtherListPos_Id.length] = arrayPos_id;
		if (this.m_sceneRender.m_nChangeSceneState === null) {
			for (var i = 0; i < this.m_cacheOtherListPos_Id.length; i++)
				rpgGame.getCharacterUtil().setOtherPlayerPosition(this.m_cacheOtherListPos_Id[i][1], this.m_cacheOtherListPos_Id[i][0]);

			this.m_cacheOtherListPos_Id = [];
		}
	}
	BTG.GameScene.prototype.cacheOtherPlay = function (arrayOtherPlay) {
		this.m_cacheOtherList[this.m_cacheOtherList.length] = arrayOtherPlay;
		if (this.m_sceneRender.m_nChangeSceneState === null) {
			for (var i = 0; i < this.m_cacheOtherList.length; i++)
				rpgGame.getCharacterUtil().createOtherPlayer(this.m_cacheOtherList[i]);
			this.m_cacheOtherList = [];

		}
	}
	BTG.GameScene.prototype.loadScene = function(nSceneID) {
		//cc.log("loadscene:" + nSceneID);
		var mapFileIni = rpgGame.getData().find(dataKey.mapTable, nSceneID);
		var nResId = mapFileIni.mapRes; //资源id
		this.m_szSceneName = mapFileIni.mapName; //场景名字
		if (mapFileIni.type === "all") {
			this.m_sceneType = this.eScene_Type_All;
			if(rpgGame.getCharacterUtil().getMainPlayer()) {
				var mainPlayer = rpgGame.getCharacterUtil().getMainPlayer();
				mainPlayer.createCharacter();
			}
		} else if (mapFileIni.type === "single") {
			this.m_sceneType = this.eScene_Type_Single;
			if(rpgGame.getCharacterUtil().getMainPlayer()) {
				var mainPlayer = rpgGame.getCharacterUtil().getMainPlayer();
				mainPlayer.createBoat();
			}
		} else {
			cc.alert("map info not:" + mapFileIni.type);
		}

		var pRBUIDlg = rpgGame.getUIUtil().find("DlgMainUI_RB");
		if (this.m_sceneType === this.eScene_Type_Single) {
			pRBUIDlg.hideBtn([CDlgMainUI_RBForPhone.Tag_Map, CDlgMainUI_RBForPhone.Tag_System]);
		} else {
			pRBUIDlg.reset();
		}
		if (this.m_sceneType === this.eScene_Type_All) {
			rpgGame.getUIUtil().add("DlgMainUI_RT");
			rpgGame.getUIUtil().DlgHide("DlgGoHome");
		} else {
			rpgGame.getUIUtil().add("DlgGoHome");
			rpgGame.getUIUtil().DlgHide("DlgMainUI_RT");
		}

		if(rpgGame.getCharacterUtil().getMainPlayer()) {
			rpgGame.getCharacterUtil().removeAll();
			rpgGame.getCharacterUtil().getMainPlayer().stop();
		}
		//if (this.m_curSceneID === nSceneID && this.m_resId === nResId)
		//    return;

		rpgGame.getUIUtil().hidePopDlg();
		for (var i = 0; i < this.m_sceneEffectList.length; i++)
			rpgGame.getEffectUtil().del(this.m_sceneEffectList[i]);
		this.m_sceneEffectList.length = 0;

		//传送门
		this.m_sendDoor = null;
		this.m_doorTagget = 0; // mapGameData.targetMap;
		if (mapFileIni.endPosX !== undefined) {
			this.m_sendDoor = rpgGame.getEffectUtil().add("chuansong1.json", rpgGame.getGameScene().getSceneRoot(),
				calcZOrder(mapFileIni.endPosY), cc.p(mapFileIni.endPosX, mapFileIni.endPosY)
			);
			this.m_sceneEffectList[this.m_sceneEffectList.length] = this.m_sendDoor;
		}
		this.m_sceneRender.changeScene();
		this.m_curSceneID = nSceneID;
		this.m_resId = nResId;
		this.m_mainMosterList.length = 0;

		this.m_bIsHasLoad = true;
		rpgGame.m_pLoadImage.begin(0.9);
		if(!isPc())
			loadTiledMap("res/w/c/" + this.m_resId + "/" + "map.tmx", this);
		else
			loadTiledMap("res/w/c/" + this.m_resId + "/" + "map.tmx", this);
	}
	BTG.GameScene.prototype.initTiledMap = function (sceneId) {
		sceneId = 1;
		this.tmxPath = "res/w/c/" + sceneId + "/" + "map.tmx";
		loadTiledMap(this.tmxPath, this);
	}
	BTG.GameScene.prototype.setMap = function (map) {
		this.map = map;
	}
	BTG.GameScene.prototype.getMap = function () {
		return this.map;
	}
	BTG.GameScene.prototype.callbackSceneChangeEnd = function () {
		var mapFileIni = rpgGame.getData().find(dataKey.mapTable, this.m_curSceneID);
		if (rpgGame.getCharacterUtil().getMainPlayer()) {
			rpgGame.getCharacterUtil().getMainPlayer().setPosition(cc.p(mapFileIni.startPosX, mapFileIni.startPosY));
		}
		for (var i = 0; i < this.m_cacheOtherList.length; i++)
			rpgGame.getCharacterUtil().createOtherPlayer(this.m_cacheOtherList[i]);
		this.m_cacheOtherList = [];

		for (var i = 0; i < this.m_cacheOtherListPos_Id.length; i++)
			rpgGame.getCharacterUtil().setOtherPlayerPosition(this.m_cacheOtherListPos_Id[i][1], this.m_cacheOtherListPos_Id[i][0]);

		this.m_cacheOtherListPos_Id = [];
	}
	BTG.GameScene.prototype.getSceneRoot = function () {
		if (this.m_sceneRoot == null)
			cc.alert("scene not loading");
		return this.m_sceneRoot;
	}

	BTG.GameScene.prototype.screenToWorld = function (tPosX) {
		return tPosX - this.m_sceneRoot.getPosition().x;
	}
	BTG.GameScene.prototype.updateBk = function (xPlayerPos, yPlayerPos) {
		cc.log("xPlayerPos:" + xPlayerPos + " yPlayerPos:" + yPlayerPos);
		var pos = this.m_sceneRoot.getPosition();
		var scenePosx = -xPlayerPos + BTG.windowSize.width / 2;//人物向右地图向左
		if (scenePosx > 0)
			scenePosx = 0;
		if (scenePosx + BTG.scene_Width < BTG.windowSize.width)
			scenePosx = BTG.windowSize.width - BTG.scene_Width;
		var scenePosy = -yPlayerPos;
		if(yPlayerPos >= 0) {
			scenePosy = -yPlayerPos + BTG.windowSize.height / 2;//人物向上地图向下
			if (scenePosy > 0)
				scenePosy = 0;
			if (scenePosy + BTG.scene_Height < BTG.windowSize.height)
				scenePosy = BTG.windowSize.height - BTG.scene_Height;
		} else {
			scenePosy = -yPlayerPos + BTG.windowSize.height / 2;//人物向下地图向上
			if (BTG.scene_Height - scenePosy < BTG.windowSize.height)
				scenePosy = BTG.scene_Height - BTG.windowSize.height;
		}
		cc.log("scenePosx:" + scenePosx + " scenePosy:" + scenePosy);
		this.m_sceneRoot.setPosition(cc.p(scenePosx, scenePosy));
		this.m_sceneRender.updateBk(scenePosx, scenePosy);
	}
	BTG.GameScene.prototype.sceneToScreen = function (tScenePos) {
		return this.m_sceneRoot.convertToWorldSpace(tScenePos);
	}
	BTG.GameScene.prototype.screenToScene = function (tScreenPos) {
		return this.m_sceneRoot.convertToNodeSpace(tScreenPos);
	}

	BTG.GameScene.prototype._createScene = function (xmlObj) {
		this.m_sceneRender.create(xmlObj, this.map, this.m_sceneRoot, this.m_resId);
		this.m_bIsHasLoad = false;
	}
	BTG.GameScene.prototype._createSceneObject = function (xmlObj) {
		//add effect
		for (var i = this.m_polyArray.length + 1; i < xmlObj.length; i++) {
			var type = xmlObj[i]["type"];
			var fileName = xmlObj[i]["name"];
			var strPos = xmlObj[i]["pos"].split("|", 2);
			var objPos = cc.p(parseInt(strPos[0]), parseInt(strPos[1]));
			if (type === "door") {
				cc.log("error: not door type");
			} else if (type === "effect") {
				if (fileName.charAt(fileName.length - 1) != "t") {// plist粒子
					var strLayerBefor = xmlObj[i]["playHou"];
					var effLayer = (strLayerBefor === "1") ? getGameZOrder(BTG.GZOrder_CharacterBefore) : getGameZOrder(BTG.GZOrder_Effect);
					this.m_sceneEffectList[this.m_sceneEffectList.length] = rpgGame.getEffectUtil().add(
						fileName,
						rpgGame.getGameScene().getSceneRoot(),
						effLayer,
						objPos
					);
				} else {
					//var cocosptc = cc.ParticleSystemQuad.create("res/effect/penquan.plist");
					//cocosptc.setPositionType(cc.PARTICLE_TYPE_GROUPED);
					//cocosptc.setPosition(objPos);
					//this.m_miniBlock[0].addChild(cocosptc);
				}
			} else if (type === "npc" || type === "monster") {
				
			}
		}
	}

	BTG.GameScene.prototype.getTop = function () {
		return this.m_polyAABB[3];
	}
	BTG.GameScene.prototype.getBottom = function () {
		return this.m_polyAABB[1];
	}
	BTG.GameScene.prototype.inScene = function (pos) {
		return pointInPolygon(pos, this.m_polyArray);
	}
	BTG.GameScene.prototype.init = function (xmlObj) {
		/*左下角
		 * 0: 0
		 * 1: -1100
		 * 2: 4300
		 * 3: 1100
		 * 
		 * 0: 106
		 * 1: 4
		 * 2: 1906
		 * 3: 329
		 */
		this.m_polyAABB[0] = 99999;//左
		this.m_polyAABB[1] = 99999;//下
		this.m_polyAABB[2] = -99999;//右
		this.m_polyAABB[3] = -99999;//上

		//this._createSceneObject(xmlObj);
		this._createScene(xmlObj);
		var mapSize = this.map.getMapSize();
		var tileSize = this.map.getTileSize();
		var contentSize = this.map.getContentSize();
		//this.m_tmxbackground = this.map.getLayer("layer_1");
		//cc.TMXObjectGroup objects = this.map.getObjectGroup("obj_1");
		//var object = objects.objectNamed("SpawnPoint");
		cc.log("SpawnPoint");
		//cc.log(object);
		BTG.scene_Width = contentSize.width;
		BTG.scene_Height = contentSize.height;
		this.setPolyArray(0, -contentSize.height / 2, contentSize.width, contentSize.height / 2);
		this.m_sceneRender.setChangeSceneState();
		//rpgGame.getFilm().runFilm("res/film0.json");
	}
	
	BTG.GameScene.prototype.setViewpointCenter = function(point) {
		var winSize = cc.Director.getInstance().getWinSize();

		var x = Math.max(point.x, winSize.width / 2);
		var y = Math.max(point.y, winSize.height / 2);
		x = Math.min(x, (this.map.getMapSize().width * this.map.getTileSize().width) - winSize.width / 2);
		y = Math.min(y, (this.map.getMapSize().height * this.map.getTileSize().height) - winSize.height/ 2);

		var viewPoint = sub(cc.p(winSize.width / 2, winSize.height / 2), cc.p(x, y));
		this.m_sceneRoot.setPosition(viewPoint);
		this.m_sceneRender.updateBk(viewPoint.x, viewPoint.y);
	}
	
	BTG.GameScene.prototype.setPolyArray = function (left, bottom, right, top) {
		this.m_polyArray = [];
		this.m_polyArray.length = 4;
		for (var i = 0; i < this.m_polyArray.length; i++) {
			this.m_polyArray[i] = cc.p(0, 0);
		}
		this.m_polyArray[0].x = left;
		this.m_polyArray[0].y = top;
		this.m_polyArray[1].x = left;
		this.m_polyArray[1].y = bottom;
		this.m_polyArray[2].x = right;
		this.m_polyArray[2].y = bottom;
		this.m_polyArray[3].x = right;
		this.m_polyArray[3].y = top;
		
		this.m_polyAABB[0] = left;
		this.m_polyAABB[1] = bottom;
		this.m_polyAABB[2] = right;
		this.m_polyAABB[3] = top;
	};

	BTG.GameScene.prototype.createFight = function (sevFightObject) {
		this.m_tempFightResult = sevFightObject.fightReports.result;
		this.m_pFight = new BTG.Fight();
		this.m_pFight.create(sevFightObject, this.m_curSceneID, this.m_fightABCIdx, true);
	}
	BTG.GameScene.prototype.delFight = function () {
		assert(this.m_fightABCIdx !== -1);
		if (this.m_tempFightResult) {
			rpgGame.getCharacterUtil().delForObject(this.m_mainMosterList[this.m_fightABCIdx]);
			this.m_mainMosterList[this.m_fightABCIdx] = null;
		} else {
			this.m_mainMosterList[this.m_fightABCIdx].resetFight(); //m_isFighting = false;
			var pos = rpgGame.getMainPlayer().getPosition();
			rpgGame.getMainPlayer().setPosition(cc.p(pos.x - 200, pos.y));
		}

		var pUI = rpgGame.getUIUtil().find("DlgGoHome");
		var monstCount = 0;
		for (var i = 0; i < this.m_mainMosterList.length; i++)
			if (this.m_mainMosterList[i] != null)
				monstCount++;
		pUI.flash(monstCount);

		this.m_pFight.del();
		this.m_pFight = null;
	}

	BTG.GameScene.prototype.isFighting = function () {
		return this.m_pFight;
	}
})(BTG);