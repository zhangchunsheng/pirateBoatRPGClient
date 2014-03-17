(function(BTG) {
	//Npc角色对象必须实现  getPosition()  del() 
	BTG.CharacterUtil = function() {
		this.m_pMainPlayer = null;
		this.m_pSceneRootNode = null;
		this.m_allCharacterArray = new Array();
		this.m_updateCounter = 1;
		this.m_fUpdateTime = 0;
		this.m_curShowTypeList = "all";
	}

	BTG.CharacterUtil.prototype.find = function (nGameId) {
		for (var i = 0; i < this.m_allCharacterArray.length; i++) {
			if (this.m_allCharacterArray[i].getID() === nGameId) {
				return this.m_allCharacterArray[i];
			}
		}

		assert(0 && "BTG.CharacterUtil.find");
	}
	BTG.CharacterUtil.prototype.setShowList = function (showList) {
		this.m_curShowTypeList = showList;
		for (var i = 0; i < this.m_allCharacterArray.length; i++) {
			this.userShowList(this.m_allCharacterArray[i]);
		}
	}
	BTG.CharacterUtil.prototype.userShowList = function (object) {
		if (this.m_curShowTypeList === "all") {
			object.show(true);
			return;
		}
		var isShow = false
		for (var k = 0; k < this.m_curShowTypeList.length; k++) {
			if (this.m_curShowTypeList[k] === object.getType()) {
				isShow = true;
				break;
			}
		}
		object.show(isShow);
	}

	BTG.CharacterUtil.prototype.flashNpcHead = function (nNpcId) {
		for (var i = 0; i < this.m_allCharacterArray.length; i++) {
			if (nNpcId === this.m_allCharacterArray[i].getID()) {
				this.m_allCharacterArray[i].flashHead();
				return;
			}
		}
		// cc.alert("flashNpcHead  nNpcId not find npcID:" + nNpcId);
	}

	BTG.CharacterUtil.prototype.getMainPlayer = function () {
		return this.m_pMainPlayer;
	}
	BTG.CharacterUtil.prototype.createUICharacter = function (nCharacterResID, vCharacterPos, eqFlagArray6, parNode) {
		var ret = new BTG.UICharacter();
		ret.setType(BTG.CharacterType_UI);
		ret.create(nCharacterResID, vCharacterPos, eqFlagArray6, parNode);

		ret.setAction(BTG.CA_Stand);

		this.m_allCharacterArray[this.m_allCharacterArray.length] = ret;
		return ret;
	}
	BTG.CharacterUtil.prototype.add = function(name, CharacterType_type, nGameID, characterResId, vCharacterPos, isBoat, eqFlagArray6) {
		cc.log("CharacterType_type:" + CharacterType_type);
		var nCharacterResID = characterResId;
		var username = name;
		var gameObject = null;
		if (CharacterType_type === BTG.CharacterType_Npc) {// npc
			nGameID = characterResId; //npc比较特殊，没有游戏ID
			gameObject = new BTG.Npc();
			var npcIniData = rpgGame.getGameData().getNpcFile(characterResId);
			nCharacterResID = npcIniData.npcResId;
			username = npcIniData.name.toString();
		} else if (BTG.CharacterType_Film === CharacterType_type) {//脚本演员
			nGameID = characterResId;
			gameObject = new BTG.FilmCharacter();
		} else if (CharacterType_type === BTG.CharacterType_MainPlayer) {
			gameObject = new BTG.MainPlayer();
		} else if (CharacterType_type === BTG.CharacterType_Other) {//other player
			gameObject = new BTG.OtherPlayer();
		} else if (CharacterType_type === BTG.CharacterType_Monster) {//monster
			gameObject = new BTG.Monster();
			var monsterDataObj = rpgGame.getData().find(dataKey.monster, characterResId);
			nCharacterResID = monsterDataObj.resArt;
			username = monsterDataObj.monName;
		} else if (CharacterType_type === BTG.CharacterType_FighterOther) {
			gameObject = new BTG.Fighter();
		} else if (CharacterType_type === BTG.CharacterType_FighterMonster) {
			gameObject = new BTG.Fighter();
			var monsterDataObj = rpgGame.getData().find(dataKey.monster, characterResId);
			nCharacterResID = monsterDataObj.resArt;
			username = monsterDataObj.monName;
		} else
			cc.alert(0, "BTG.CharacterUtil.add( CharacterType_type not define) ");

		//if (BTG.CharacterType_Monster === CharacterType_type)
		//    nCharacterResID = 315;
		gameObject.setType(CharacterType_type);
		if(isBoat) {
			gameObject.isLoadBoat = 1;
			gameObject.create(nGameID, nCharacterResID, vCharacterPos, eqFlagArray6);
		} else {
			gameObject.create(nGameID, nCharacterResID, vCharacterPos, eqFlagArray6);
		}
		// if (CharacterType_type != BTG.CharacterType_Npc)
		gameObject.setAction(BTG.CA_Stand);
		gameObject.setName(username);
		gameObject.attchEffect(characterResId);

		this.m_allCharacterArray[this.m_allCharacterArray.length] = gameObject;

		this.userShowList(gameObject);
		return gameObject;
	}

	BTG.CharacterUtil.prototype.delForID = function (createId) {
		for (var i = 0; i < this.m_allCharacterArray.length; i++) {
			if (this.m_allCharacterArray[i].getID() === createId) {
				this.m_allCharacterArray[i].del();
				this.m_allCharacterArray.splice(i, 1);
				break;
			}
		}
	}
	BTG.CharacterUtil.prototype.delForObject = function (object) {
		for (var i = 0; i < this.m_allCharacterArray.length; i++) {
			if (this.m_allCharacterArray[i] === object) {
				// cc.log("[remove player] player :" + this.m_allCharacterArray[i].getName());
				this.m_allCharacterArray[i].del();
				this.m_allCharacterArray.splice(i, 1);
				break;
			}
		}
	}

	BTG.CharacterUtil.prototype.setOtherPlayerPosition = function (gameId, vPos) {
		for (var i = 0; i < this.m_allCharacterArray.length; i++) {
			if (this.m_allCharacterArray[i].getID() === gameId) {
				this.m_allCharacterArray[i].setMoveTarget(vPos);
				return;
			}
		}
		cc.alert("not find otherplayer:" + gameId);
	}

	BTG.CharacterUtil.prototype.createOtherPlayer = function(otherRoleInfoArray) {
		var dataMgr = rpgGame.getData();
		for (var i = 0; i < otherRoleInfoArray.length; i++) {
			var resId = otherRoleInfoArray[i].resId;
			var gameId = otherRoleInfoArray[i].clientId;
			var pos = cc.p(otherRoleInfoArray[i].position.x, otherRoleInfoArray[i].position.y);
			var name = otherRoleInfoArray[i].name;
			var eqFlagArray6 = [0, 0, 0, 0, 0, 0];
			for (var k = 0; k < otherRoleInfoArray[i].EquipResId.length; k++) {
				if (otherRoleInfoArray[i].EquipResId[k] !== null && otherRoleInfoArray[i].EquipResId[k] !== undefined) {
					var ceHuaId = otherRoleInfoArray[i].EquipResId[k];
					var itemObj = dataMgr.find(dataKey.itemTable, ceHuaId);
					if (itemObj === null) {
						cc.alert("[error] item.xml not find id" + ceHuaId);
					}
					eqFlagArray6[k] = itemObj.resSuit;
				}
			}
			var pOtherPlayer = this.add(name, BTG.CharacterType_Other, gameId, resId, pos, eqFlagArray6);
			//cc.log("[create] player :" + name);
			pOtherPlayer.setServerData(otherRoleInfoArray);
			if (rpgGame.getGameScene().isFighting() || rpgGame.getFilm().isRunFilm()) {//如果战斗中，隐藏其它玩家
				pOtherPlayer.show(false);
			}
		}
	}

	BTG.CharacterUtil.prototype.removeAll = function () {
		// cc.log("[remove All] player :" );
		for (var i = 0; i < this.m_allCharacterArray.length; i++) {
			if (this.m_allCharacterArray[i] === this.m_pMainPlayer) continue;

			this.m_allCharacterArray[i].del();
		}
		this.m_allCharacterArray.length = 0;
		this.m_allCharacterArray[this.m_allCharacterArray.length] = this.m_pMainPlayer;

	}
	BTG.CharacterUtil.prototype.createMainPlayer = function (clientRole) {
		var heroInfoObj = clientRole.getMainHero()
		if (this.m_pMainPlayer != null) return;
		var eqFlagArray6 = [0, 0, 0, 0, 0, 0];
		for (var i = 0; i < heroInfoObj.equipTable.length; i++) {
			if (heroInfoObj.equipTable[i] !== null && heroInfoObj.equipTable[i] !== undefined) {
				eqFlagArray6[i] = heroInfoObj.equipTable[i].resSuit;
			}
		}
		this.m_pMainPlayer = this.add(heroInfoObj.name, BTG.CharacterType_MainPlayer, heroInfoObj._id, heroInfoObj.resId, cc.p(0, 0), eqFlagArray6); //, eqFlagArray6);

		//setup mainpalyer info
		this.m_pMainPlayer.setClientRole(clientRole);
		this.m_pMainPlayer.setServerData(heroInfoObj);
		this.m_pMainPlayer.setAttackType(clientRole.getMainHero().attackType);
		this.m_pMainPlayer.setRaceId(clientRole.getMainHero().vocation);
	}
	BTG.CharacterUtil.prototype.init = function (sceneRootNode) {
		/*
		var BTG.EQP_Head = 0;
		var BTG.EQP_Wrist = 1;
		var BTG.EQP_Clothes = 2;
		var BTG.EQP_Trousers = 3;
		var BTG.EQP_Shoes = 4;
		var BTG.EQP_Weapon = 5;
		var BTG.EQP_Count = 6;*/
		// var eqFlagArray6 = [0, 0, 0, 0, 0, 0];
		//this.m_pMainPlayer = this.add("xxx",BTG.CharacterType_MainPlayer, -1, 0, cc.p(100,300), eqFlagArray6);

		//setup mainpalyer info
		// this.m_pMainPlayer.setName(LGG("npc0name"));

		this.m_pSceneRootNode = sceneRootNode;
		// var eqFlagArray6 = [0, 0, 0, 0, 0,0];
	}

	BTG.CharacterUtil.prototype.update = function (ftime) {
		if (this.m_pMainPlayer === null)
			return;

		this.m_fUpdateTime += ftime;
		this.m_pMainPlayer.update(ftime);
		this.m_updateCounter++;
		var renderCount = 0;
		// if (this.m_updateCounter % 2 == 0)
		{
			var sceneLeft = rpgGame.getGameScene().screenToWorld(0);
			var sceneRight = rpgGame.getGameScene().screenToWorld(BTG.windowSize.width);
			for (var i = 0; i < this.m_allCharacterArray.length; i++) {
				if (this.m_allCharacterArray[i] != this.m_pMainPlayer) {
					if (!rpgGame.getGameScene().isFighting() || !rpgGame.getFilm().isRunFilm()) {//战斗中不裁剪
						if (this.m_allCharacterArray[i].getType() !== BTG.CharacterType_UI) {
							var isClip = !this.m_allCharacterArray[i].inRectLR(sceneLeft, sceneRight);
							if (isClip == false) renderCount++;
							this.m_allCharacterArray[i].clip(isClip);
						}
					}
					this.m_allCharacterArray[i].update(this.m_fUpdateTime);
				}
			}
			rpgGame.xDebug(renderCount);
			this.m_fUpdateTime = 0;
		}
	}
	BTG.CharacterUtil.prototype.touchBegin = function (tpos) {
		if (this.m_pMainPlayer === null)
			return false;
		var touchScenePos = rpgGame.getGameScene().screenToScene(cc.p(tpos.x, tpos.y));
		if (this.touchNpc(touchScenePos) === false) {
			var retv = this.m_pMainPlayer.touchBegin(touchScenePos);
			return retv;
		} else
			return true;
	}

	BTG.CharacterUtil.prototype.touchNpc = function (touchPos) {
		for (var i = 0; i < this.m_allCharacterArray.length; i++) {
			if (this.m_allCharacterArray[i].getType() != BTG.CharacterType_Npc)
				continue;
			if (this.m_allCharacterArray[i].touchBegin(touchPos)) {
				//rpgGame.getUIUtil().add("DlgSpeak");
				//cc.alert("click:" + this.m_allCharacterArray[i].m_ID);
				return true;
			}
		}
		return false;
	}
})(BTG);