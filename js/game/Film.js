(function(BTG) {
	var doType_MoveTo = 0;
	var doType_Speak = 1;
	var doType_Action = 2;
	var doType_Effect = 3;
	var doType_Hide = 4;
	var doType_End = 5;

	var TempFilmString = ["移动", "说话", "动作", "特效", "显示"];

	function doFilm() {
		this.m_type = -1;
		this.m_time = 0;
		this.m_name = "";
		this.m_szValue = new Array(3); //目前最多三条指令
	}

	BTG.Film = function() {
		this.FS_No = 0;
		this.FS_WaitLoad = 1;
		this.FS_Run = 2;
		this.FS_WaitEnd = 3;
		this.m_filmState = this.FS_No;

		this.m_npcList = new Array();
		this.m_doList = new Array();
		this.m_runTime = 0;
		this.m_curMainPlayerID = -1;
		this.m_curSpeak = null;

		this.m_colorLayer = null;
		this.m_isFightScript = false;
	};
	BTG.Film.prototype.setTaskFilm = function (type, task) {
		if (type === "wancheng") {
			if (task.goalScriptId) {
				rpgGame.getFilm().runFilm("res/script/" + task.goalScriptId + ".json");
				return true;
			}
		} else {//接任务
			if (task.acceptScriptId) {
				this.runFilm("res/script/" + task.acceptScriptId + ".json");
				return true;
			}
		}
		return false;
	}
	BTG.Film.prototype.setEnterMap = function (ceHuaId) {
		var taskSystem = rpgGame.getClientRole().getTaskSystem();
		var pArray = taskSystem.getCliTasks();
		//关卡脚本，只处理已经接的，并且未完成的
		for (var i = 0; i < pArray.length; i++) {
			if (pArray[i].taskDb === undefined)
				continue;
			if (pArray[i].taskDb.done)
				continue;
			if (pArray[i].taskData.mapIndexId === undefined || pArray[i].taskData.mapIndexId === null)
				continue;
			if (pArray[i].taskData.customsBeginScriptId === undefined)
				continue;
			if (pArray[i].taskData.mapIndexId === ceHuaId) {
				this.runFilm("res/script/" + pArray[i].taskData.customsBeginScriptId + ".json");
				break;
			}
		}
	}
	BTG.Film.prototype.setFightFilm = function (nCeHuaSceneId, fightABCIdx, isFightBefor) {
		var taskSystem = rpgGame.getClientRole().getTaskSystem();
		var pArray = taskSystem.getCliTasks();

		//关卡脚本，只处理已经接的，并且未完成的
		for (var i = 0; i < pArray.length; i++) {
			if (pArray[i].taskDb === undefined)
				continue;
			if (pArray[i].taskDb.done)
				continue;
			if (pArray[i].taskData.mapIndexId === undefined || pArray[i].taskData.mapIndexId === null)
				continue;
			if (pArray[i].taskData.mapIndexId !== nCeHuaSceneId)
				continue;
			var fightScript = isFightBefor ? pArray[i].taskData.fightBeginScriptId : pArray[i].taskData.fightWinScriptId;
			if (fightScript === undefined || fightScript === null)
				continue;

			var scriptIdx_Name = fightScript.split(",", 2);
			assert(scriptIdx_Name.length === 2);
			if (parseInt(scriptIdx_Name[0] !== fightABCIdx))
				continue;

			this.m_isFightScript = true;
			this.runFilm("res/script/" + scriptIdx_Name[1] + ".json");
			return true;
		}
		return false;
	}
	BTG.Film.prototype.getValue = function (str) {
		var p = str.split(":", 2);
		if (p.length !== 2) {
			cc.alert(str + " file error");
		}
		return p[1];
	}
	BTG.Film.prototype.isRunFilm = function () {
		return this.m_filmState != this.FS_No;
	}
	BTG.Film.prototype.onLoadJson = function (szTxt) {
		this.m_filmState = this.FS_Run;
		//创建NPC
		var comList = szTxt.split(";", 100);

		for (var i = 0; i < comList.length; i++) {
			if (comList[i].length < 8) continue;
			var tempSingle = comList[i].split("|", 10);
			var comSingle = new Array();
			comSingle[0] = tempSingle[0];
			for (var k = 1; k < tempSingle.length; k++)
				comSingle[k] = this.GetValue(tempSingle[k]);
			if (comSingle.length > 8)
				cc.alert("[Error] com count line:" + i);
			var tempComFlag = comSingle[0];
			if (tempComFlag.indexOf("创建") != -1) {//创建NPC
				var usrName = comSingle[2];
				//(name, CharacterType_type, nGameID, characterResId, vCharacterPos, eqFlagArray6)
				if (usrName === "null") {//copy 主角
					var pMainPlay = rpgGame.getMainPlayer();
					this.m_curMainPlayerID = this.m_npcList.length;
					this.m_npcList[this.m_npcList.length] = rpgGame.getCharacterUtil().createUICharacter(pMainPlay.getResID(),
					cc.p(parseInt(comSingle[3]), parseInt(comSingle[4])), pMainPlay.m_pImage.getEqList(),
					rpgGame.getGameRoot());
					this.m_npcList[this.m_npcList.length - 1].setName(pMainPlay.getName());
					//this.m_npcList[this.m_npcList.length] = rpgGame.getCharacterUtil().add(pMainPlay.getName(),
					//BTG.CharacterType_Film, -1, pMainPlay.getResID(),
					//cc.p(parseInt(comSingle[3]), parseInt(comSingle[4])), pMainPlay.m_pImage.getEqList());
				} else {
					this.m_npcList[this.m_npcList.length] = rpgGame.getCharacterUtil().createUICharacter(parseInt(comSingle[1]),
					cc.p(parseInt(comSingle[3]), parseInt(comSingle[4])), undefined,
					rpgGame.getGameRoot());
					this.m_npcList[this.m_npcList.length - 1].setName(comSingle[2]);

					//this.m_npcList[this.m_npcList.length] = rpgGame.getCharacterUtil().add(comSingle[2],
					//BTG.CharacterType_Film, -1, parseInt(comSingle[1]),
					//cc.p(parseInt(comSingle[3]), parseInt(comSingle[4])));
				}
				if (comSingle[5] === 'y') //翻转
					this.m_npcList[this.m_npcList.length - 1].setDirection(BTG.ARSD_Right);
			} else if (tempComFlag.indexOf("结束") != -1) {
				var tIndex = this.m_doList.length;
				this.m_doList[tIndex] = new doFilm();
				this.m_doList[tIndex].m_type = doType_End;
				this.m_doList[tIndex].m_time = parseFloat(comSingle[1]);
			} else {
				var isFindCom = false;
				for (var iType = 0; iType < TempFilmString.length; iType++) {
					if (tempComFlag.indexOf(TempFilmString[iType]) != -1) {
						isFindCom = true;
						var tIndex = this.m_doList.length;
						this.m_doList[tIndex] = new doFilm();
						this.m_doList[tIndex].m_type = iType;

						this.m_doList[tIndex].m_time = parseFloat(comSingle[1]);
						this.m_doList[tIndex].m_name = comSingle[2];

						for (var k = 3; k < comSingle.length; k++) {
							var tempFloat = parseFloat(comSingle[k]);
							if (isNaN(tempFloat)) {
								this.m_doList[tIndex].m_szValue[k - 3] = comSingle[k];
							} else {
								this.m_doList[tIndex].m_szValue[k - 3] = tempFloat;
							}
						}
						break;
					}
				}
				if (isFindCom == false) {
					cc.alert("[Error] " + tempComFlag + "not");
				}
			}
		}
	}

	BTG.Film.prototype.runFilm = function (filmFileName, isFight) {
		rpgGame.getCharacterUtil().setShowList([BTG.CharacterType_UI, BTG.CharacterType_Film]);
		if (this.m_isFightScript === false) {
			rpgGame.getUIUtil().forceHideAll();
		}

		var lcHeight = 50;
		if (this.m_colorLayer == null) {
			this.m_colorLayer = new Array(2);
			this.m_colorLayer[0] = cc.LayerColor.create(cc.c4(0, 0, 0, 220), BTG.windowSize.width, lcHeight);
			this.m_colorLayer[1] = cc.LayerColor.create(cc.c4(0, 0, 0, 220), BTG.windowSize.width, lcHeight);
			//this.m_colorLayer[0].setAnchorPoint(cc.p(0, 0));
			//this.m_colorLayer[1].setAnchorPoint(cc.p(0, 1));
			rpgGame.getGameRoot().addChild(this.m_colorLayer[0], 0);
			rpgGame.getGameRoot().addChild(this.m_colorLayer[1], 0);
		}
		this.m_colorLayer[0].setPosition(cc.p(0, BTG.windowSize.height));
		this.m_colorLayer[1].setPosition(cc.p(0, -lcHeight));

		this.m_colorLayer[0].setVisible(true);
		this.m_colorLayer[1].setVisible(true);

		this.m_colorLayer[0].runAction(cc.MoveTo.create(1.0, cc.p(0, BTG.windowSize.height - lcHeight)));
		this.m_colorLayer[1].runAction(cc.MoveTo.create(1.0, cc.p(0, 0)));

		this.m_filmState = this.FS_WaitLoad;
		h5_loadString(filmFileName, this);
	}

	BTG.Film.prototype.getNpc = function (szName) {
		if (szName == "null") {
			assert(this.m_curMainPlayerID !== -1);
			return this.m_npcList[this.m_curMainPlayerID];
		}
		for (var i = 0; i < this.m_npcList.length; i++) {
			if (this.m_npcList[i].getName() == szName) return this.m_npcList[i];
		}

		return null;
	}
	BTG.Film.prototype.doCom = function () {
		if (this.m_doList[0].m_type == doType_End) {
			this.m_doList.length = 0;
			return;
		}
		var pNpc = this.getNpc(this.m_doList[0].m_name);

		if (pNpc == null) {
			cc.alert("[Error]npc not find time:" + this.m_doList[0].m_time + "type:" + this.m_doList[0].m_type);
		}
		switch (this.m_doList[0].m_type) {
			case doType_Speak:
				this.m_curSpeak = rpgGame.getUIUtil().add("DlgFilmSpeak", [this.m_doList[0].m_szValue[0], this.m_doList[0].m_szValue[1], pNpc]);
				break;
			case doType_MoveTo:
				pNpc.setMoveTargetForTime(
				cc.p(this.m_doList[0].m_szValue[1], this.m_doList[0].m_szValue[2]),
				this.m_doList[0].m_szValue[0]);
				break;
			case doType_Action:
				pNpc.setAction(this.m_doList[0].m_szValue[0]);
				break;
			case doType_Effect:
				var zOrder = 100
				var pParNode = rpgGame.getGameRoot();
				var userPos = cc.p(this.m_doList[0].m_szValue[1], this.m_doList[0].m_szValue[2]);

				if (this.m_doList[0].m_szValue[3] != "0") {
					var pFindNpc = this.GetNpc(this.m_doList[0].m_szValue[3]);
					pParNode = pFindNpc.m_pImage.m_pBatch;
					if (this.m_doList[0].m_szValue[4] == "q") zOrder = 1;
					else zOrder = -1;
				}
				rpgGame.getEffectUtil().add(this.m_doList[0].m_szValue[0], pParNode, zOrder, userPos);
				break;
			case doType_Hide:
				pNpc.show(this.m_doList[0].m_szValue[0]);
				break;
		}
	}

	BTG.Film.prototype.update = function (ftime) {
		if (this.m_curSpeak) {
			if (this.m_curSpeak.isFinal()) {
				this.m_curSpeak = null;
			} else return;
		}
		if (this.m_filmState < this.FS_Run)
			return;
		this.m_runTime += ftime;
		if (this.m_filmState == this.FS_Run) {
			if (this.m_runTime >= this.m_doList[0].m_time) {
				this.doCom();
				if (this.m_doList.length > 0) this.m_doList.splice(0, 1);
				if (this.m_doList.length <= 0) {
					this.m_filmState = this.FS_WaitEnd;

					this.m_runTime = 0;

					this.m_colorLayer[0].runAction(cc.MoveTo.create(1.0, cc.p(0, BTG.windowSize.height)));
					this.m_colorLayer[1].runAction(cc.MoveTo.create(1.0, cc.p(0, -this.m_colorLayer[1].getContentSize().height)));
				}
			}
		} else if (this.m_filmState == this.FS_WaitEnd) {
			if (this.m_runTime >= 1) {
				this.m_curMainPlayerID = -1;
				this.m_runTime = 0;
				this.m_filmState = this.FS_No;
				this.m_colorLayer[0].setVisible(false);
				this.m_colorLayer[1].setVisible(false);
				for (var i = 0; i < this.m_npcList.length; i++)
				rpgGame.getCharacterUtil().delForObject(this.m_npcList[i]);
				this.m_npcList.length = 0;
				if (this.m_isFightScript === false) {
					rpgGame.getUIUtil().recoveryForceHideAll();
					rpgGame.getCharacterUtil().setShowList("all");
				} else rpgGame.getCharacterUtil().setShowList([BTG.CharacterType_FighterOther, BTG.CharacterType_FighterMonster]);
				this.m_isFightScript = false;
			}
		}
	}
})(BTG);