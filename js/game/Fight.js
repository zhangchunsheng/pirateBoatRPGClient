(function() {
	function EffectAction() {
		this.side = 0;
		this.index = new Array();
	};

	function FightBoutData() {
		this.side = 0;
		this.index = 0;
		this.skillFight = false;
		this.groupFight = false;
		this.effects = undefined;
		this.actions = undefined;
		this.targets = undefined;
		this.treatTargets = undefined;
		/*{
			this.index =1;
			this.hit =true;
			this.blast =true;
			this.block =true;//隔挡
			this.groupFight =true;//X
			this.rescue =true;//圆弧
			this.rescueIndex =4;
			this.targetBlood =455;
			this.sourceBlood =14;
			this.suckBlood =11;//洗血
			this.fallBlood =-50;
			this.fallBloodBout =5
		}*/

		/*
		this.treatBlood =41;
		this.treatBlast =true*/
	};

	function BoutSubBlood() {
		this.m_pFighter = 0;
		this.m_blood = 0;
		this.m_boutCount = 0;
	};

	BTG.Fight = function() {
		this.m_pStartPos = new Array(2);

		this.m_boutData = new Array();
		this.m_fighterData = new Array(2);

		for (var i = 0; i < 2; i++) {
			this.m_fighterData[i] = new Array();

		}
		this.m_fightState = "start";
		this.m_curExeBout = 0;
		this.m_curActorIdx = 0;
		this.m_curDoBoutTime = 0;
		this.m_maxDoBoutTime = 0;
		this.m_pFightServerData = null;
		this.m_boutSubBooldArray = new Array();
	};
	BTG.Fight.left = 0;
	BTG.Fight.right = 1;
	BTG.Fight.prototype.findFighter = function (side, idx) {
		for (var i = 0; i < this.m_fighterData[side].length; i++) {
			if (this.m_fighterData[side][i].fightIdx === idx)
				return this.m_fighterData[side][i].fightObject;
		}

		cc.alert("not find fighter:side " + side + "idx:" + idx);
	}
	BTG.Fight.prototype.findData = function (side, idx) {
		for (var i = 0; i < this.m_fighterData[side].length; i++) {
			if (this.m_fighterData[side][i].fightIdx === idx)
				return this.m_fighterData[side][i];
		}

		cc.alert("not find fighter:side " + side + "idx:" + idx);
	}
	BTG.Fight.prototype.isOver = function () {
		return this.m_fightState === "over";
	}

	BTG.Fight.prototype.update = function (ftime, isWin, sceneId, ABCIdx) {
		switch (this.m_fightState) {
		case "over":
			return;
		case "waitFightBeforScript": {
				if (rpgGame.getFilm().isRunFilm() === false) {
					this.relCreate();
					this.m_fightState = "start";
				}
				return;
			}
		case "waitFightWinScript": {
				if (rpgGame.getFilm().isRunFilm() === false) {
					this.m_fightState = "overDlg";
				}
				return;
			}
		case "overDlg": {
				rpgGame.getUIUtil().add("DlgFightAward", this.m_pFightServerData);
				this.m_fightState = "waitOverDlg";
				return;
			}
		case "waitOverDlg": {
				var pDlg = rpgGame.getUIUtil().find("DlgFightAward");

				if (!pDlg.isShow())
					this.m_fightState = "over";
				return;
			}
		}

		BTG.Fighter.doFightCommand(ftime);
		this.m_curDoBoutTime += ftime;
		if(this.m_curDoBoutTime >= this.m_maxDoBoutTime) {
			if (this.m_curExeBout >= this.m_boutData.length) {
				this.m_curExeBout = 0;
				this.m_curActorIdx = 0;
				this.m_fightState = "over";

				if (isWin) {
					this.m_fightState = "overDlg";
					if (rpgGame.getFilm().setFightFilm(sceneId, ABCIdx, false)) {
						for(var i = 0; i < this.m_fighterData.length; i++) {
							for (var k = 0; k < this.m_fighterData[i].length; k++) {
								rpgGame.getCharacterUtil().delForObject(this.m_fighterData[i][k].fightObject);
							}
						}
						this.m_fighterData.length = 0;
						this.m_fightState = "waitFightWinScript";
					}
				}
				return;
			}
			var pBout = this.m_boutData[this.m_curExeBout];
			var pSingleActor = pBout[this.m_curActorIdx];

			this.doBout(pSingleActor);

			this.m_curActorIdx++;
			if (this.m_curActorIdx >= this.m_boutData[this.m_curExeBout].length) {
				this.m_curActorIdx = 0;
				this.m_curExeBout++;

				//更新所有角色 effect action 
				for (var i = 0; i < 1; i++) {
					for (var k = 0; k < this.m_fighterData[i].length; k++) {
						this.m_fighterData[i][k].fightObject.updateBlut();
					}
				}
			}
		}
	}

	BTG.Fight.prototype.calcAttackPos = function (attackSide, beAttackSide, beAttackIdx) {
		var pFighter = this.findFighter(beAttackSide, beAttackIdx);
		var offsetPixel = (attackSide == BTG.Fight.left) ? -100 : 100;
		var beAttackPos = pFighter.getPosition();
		beAttackPos.x += offsetPixel;
		return beAttackPos;
	}

	BTG.Fight.prototype.setupSkill = function (pAttack, skillID, skillDataObj, boutDataObj) {
		BTG.FightEffect.showText(pAttack, "技能", skillDataObj["skillName"], 0.1);
		BTG.Fighter.addFightCommand(pAttack, BTG.FightCommand.fightCom_Effecct, 0.2, skillDataObj["castEffect"], null); //预置特效
		BTG.Fighter.addFightCommand(pAttack, BTG.FightCommand.fightCom_DelayTime, 0.5, null, null); //延时
		//添加回合效果与action
		var effectArray = boutDataObj["effects"];
		var skillActionArray = boutDataObj["actions"];
		var pArray = [effectArray, skillActionArray];
		for (var iEffectAction = 0; iEffectAction < pArray.length; iEffectAction++) {
			if (pArray[iEffectAction] === undefined)
				continue;

			for (var i = 0; i < pArray[iEffectAction].length; i++) {
				/*
				 *{"side": 0,"indexes": [1,2,3]}
				*/
				var pEffect = pArray[iEffectAction][i];
				for (var iCount = 0; iCount < pEffect["indexes"].length; iCount++) {
					pFighter = this.findFighter(pEffect.side, pEffect["indexes"][iCount]);
					pFighter.setEffectAction(
						skillDataObj["effects"][i]["effIcon"],
						skillDataObj["effects"][i]["bout"],
						skillDataObj["effects"][i]["effDes"],
						skillID,
						i + iEffectAction * 2
					);
				}
			}
		}
	}
	BTG.Fight.prototype.doBout = function (boutDataSingle) {
		cc.log("doBout");
		cc.log(boutDataSingle);
		this.m_curDoBoutTime = 0;
		this.m_maxDoBoutTime = 0;

		var boutDataObj = boutDataSingle;
		var pAttack = this.findFighter(boutDataObj["side"], boutDataObj["index"]);

		if (boutDataObj["treatTargets"] !== undefined) {//治疗
			BTG.Fighter.addFightCommand(pAttack, BTG.FightCommand.fightCom_Action, 0.1, BTG.CA_NormalAttack0, BTG.CA_FightStand);

			for (var i = 0; i < boutDataObj["treatTargets"]["treatTargets"].length; i++) {
				var pTreatObj = this.findFighter(boutDataObj["side"], boutDataObj["treatTargets"]["treatTargets"][i]);
				BTG.FightEffect.fightSubBlood(pTreatObj, boutDataObj["treatTargets"]["treatBlood"], 0.5, boutDataObj["treatTargets"]["treatBlast"]);
			}
			return;
		}
		var bIsUserSkill = boutDataObj["skillFight"];
		if (bIsUserSkill === undefined)
			bIsUserSkill = false;
		var skillDataObj = null;
		var attackEffName = null;
		var beAttackEffName = null;
		var bIsFarAttack = pAttack.getRaceId() !== 0; //0战士 1弓手 2法师
		if (bIsUserSkill) {//技能攻击 先播放一段技能预置 播特效
			BTG.FightEffect.fightMorale(pAttack, -pAttack.getMorale(), 0);
			pAttack.setMorale(0); //播放技能，士气清零
			var skillID = this.findData(boutDataObj["side"], boutDataObj["index"]).skillId;
			skillDataObj = rpgGame.getData().find(dataKey.skillTable, skillID);
			bIsFarAttack = skillDataObj.skillType !== 0;
			attackEffName = skillDataObj["attEffect"];
			beAttackEffName = skillDataObj["hitEffect"];

			this.setupSkill(pAttack, skillID, skillDataObj, boutDataObj);
		}
		var pBeAttack = new Array(boutDataObj["targets"].length);

		var otherSide = (boutDataObj["side"] === BTG.Fight.left) ? BTG.Fight.right : BTG.Fight.left;
		assert(boutDataObj["targets"].length > 0);
		var beAttackIdx = 999;
		for (var i = 0; i < boutDataObj["targets"].length; i++) {
			pBeAttack[i] = this.findFighter(otherSide, boutDataObj["targets"][i].index);
			if (beAttackIdx > boutDataObj["targets"][i].index)
				beAttackIdx = boutDataObj["targets"][i].index;
		}

		var orgPos = pAttack.getPosition();
		var attackPos = this.calcAttackPos(boutDataObj["side"], otherSide, beAttackIdx);
		//addPoint(BTG.Monster.fightSideIdx2Pos(otherSide, 0), orgPos);

		if (!bIsFarAttack) //0近战 1远战
			BTG.Fighter.addFightCommand(pAttack, BTG.FightCommand.fightCom_MoveTo, 0.1, attackPos, 0.2); //移到目标
		BTG.Fighter.addFightCommand(pAttack, BTG.FightCommand.fightCom_Action, 0.2, BTG.CA_NormalAttack0, BTG.CA_FightStand); //攻击动作

		//攻击效果   如果有技能播放技能特效，否则 播放近或远攻击
		if (bIsUserSkill) {
			BTG.Fighter.addFightCommand(pAttack, BTG.FightCommand.fightCom_Effecct, 0.2, attackEffName, null);
			// BTG.Fighter.addFightCommand(pAttack, BTG.FightCommand.fightCom_DelayTime, 0.5, null, null);//延时
		} else {
			//if (!bIsFarAttack)
			//    pAttack.addFightCommand(BTG.FightCommand.fightCom_Effecct, 0.2, "pugong01.json", null);//攻击
			//else //根据种族 1弓手，2法师 播放不同效果
			if (bIsFarAttack)
				pAttack.bindActionCallback(BTG.CA_NormalAttack0, "远程攻击", 0.1, "res/effect/yuanshejian.jpg", pBeAttack[0]);
		}

		//攻击方是合击被呼唤方
		if (boutDataObj["groupFight"]) {
			BTG.FightEffect.showText(pAttack, "文字", "额外回合", 0.0);
		}

		var blast = 1;
		var bIsHasAttack = false;
		//处理被攻击玩家
		for (var i = 0; i < pBeAttack.length; i++) {//被击方
			if (boutDataObj["targets"][i].hit === undefined) {//闪避
				if (bIsUserSkill)
					BTG.Fighter.addFightCommand(pBeAttack[i], BTG.FightCommand.fightCom_Effecct, 0.0, beAttackEffName, null);
				BTG.FightEffect.showText(pBeAttack[i], "文字", "闪避", 0.5);
				BTG.Fighter.addFightCommand(pBeAttack[i], BTG.FightCommand.fightCom_Action, 0.4, BTG.CA_Dodge, BTG.CA_FightStand);
				continue;
			}
			bIsHasAttack = true;
			//暴击
			if(boutDataObj["targets"][i].blast !== undefined) {
				blast = 2;
			}
			var beAttackTime = 0;
			if(bIsUserSkill)
				beAttackTime = (i === 0 ? 1.2 : 0.0);
			else
				beAttackTime = (i === 0 ? 0.4 : 0.0);
			BTG.Fighter.addFightCommand(pBeAttack[i], BTG.FightCommand.fightCom_Action, beAttackTime, BTG.CA_Embattled, BTG.CA_FightStand);
			BTG.Fighter.addFightCommand(pBeAttack[i], BTG.FightCommand.fightCom_Effecct, 0.0, bIsUserSkill ? beAttackEffName : "beiji.json", null);
			pBeAttack[i].bindActionCallback(BTG.CA_Embattled, "减血", 0.1, boutDataObj["targets"][i].targetBlood, blast === 2);
			//援助， 此索引与玩家一起分担
			if (boutDataObj["targets"][i].rescueIndex !== undefined) {
				BTG.FightEffect.showText(pBeAttack[i], "文字", "援助", 0.1);
				var pRescueFighter = this.findFighter(otherSide, boutDataObj["targets"][i].rescueIndex);
				BTG.FightEffect.fightSubBlood(pRescueFighter, boutDataObj["targets"][i].targetBlood, 0.2);
			}

			//隔挡
			if (boutDataObj["targets"][i].block) {
				BTG.FightEffect.showText(pBeAttack[i], "文字", "招架", 0.1);
			}

			//反震
			if (boutDataObj["targets"][i].sourceBlood !== undefined) {
				BTG.FightEffect.fightSubBlood(pAttack, boutDataObj["targets"][i].sourceBlood, 0.2);
			}

			//吸血 给攻击方加血
			if (boutDataObj["targets"][i].suckBlood !== undefined) {
				BTG.FightEffect.fightSubBlood(pAttack, boutDataObj["targets"][i].suckBlood, 0.2);
			}

			//攻击导致敌人每回合掉血
			if (boutDataObj["targets"][i].fallBlood !== undefined) {
				assert(boutDataObj["targets"][i].fallBloodBout !== undefined);
				var pSubFighter = new BoutSubBlood();
				this.m_boutSubBooldArray[this.m_boutSubBooldArray.length] = pSubFighter;
				pSubFighter.m_pFighter = pBeAttack[i];
				pSubFighter.m_blood = boutDataObj["targets"][i].fallBlood;
				pSubFighter.m_boutCount = boutDataObj["targets"][i].fallBloodBout;
			}
		}


		//增加攻击方士气
		if (bIsUserSkill === false) {
			if (pAttack.getMorale() < 100 && bIsHasAttack) {
				var morale = 0;
				if (boutDataObj.boutAddMorale !== undefined)
					morale = boutDataObj.boutAddMorale * blast;
				else
					morale = 50 * blast;
				BTG.Fighter.addFightCommand(pAttack, BTG.FightCommand.fightCom_AddMorale, 0.0, pAttack.getMorale() + morale);
			}
		}
		BTG.Fighter.addFightCommand(pAttack, BTG.FightCommand.fightCom_MoveTo, 0.8, orgPos, 0.1); //移回

		this.m_maxDoBoutTime = BTG.Fighter.getFightCommandMaxTime();

		//每回合掉血
		for (var i = 0; i < this.m_boutSubBooldArray.length; i++) {
			if (this.m_boutSubBooldArray[i].m_boutCount <= 0 || this.m_boutSubBooldArray[i].m_pFighter.isDie())
				continue;

			this.m_boutSubBooldArray[i].m_boutCount--;

			BTG.FightEffect.fightSubBlood(this.m_boutSubBooldArray[i].m_pFighter, this.m_boutSubBooldArray[i].m_blood, 0);
		}
	}

	BTG.Fight.prototype.createFighter = function (fightParam, side, idx) {
		var pFighter = null;
		if (fightParam.resIds === undefined) {// monster
			var cehuaId = fightParam.resId;
			var gameId = -1;
			var pos = addPoint(BTG.Monster.fightSideIdx2Pos(side, idx), this.m_pStartPos[side]);

			pFighter = rpgGame.getCharacterUtil().add("xxx", BTG.CharacterType_FighterMonster, gameId, cehuaId, pos, 1);
			var monstTable = rpgGame.getData().find(dataKey.monster, cehuaId);
			pFighter.setAttackType(monstTable.attackType);
			pFighter.setRaceId(monstTable.vocation);
		} else {// palyer
			var resId = fightParam.resId;
			var gameId = -1;
			var pos = addPoint(BTG.Monster.fightSideIdx2Pos(side, idx), this.m_pStartPos[side]);
			// var pGameActor =  
			var name = rpgGame.getMainPlayer().getName();
			var attackType = rpgGame.getMainPlayer().getAttackType();
			var voc = rpgGame.getMainPlayer().getRaceId();
			var eqFlagArray6 = [0, 0, 0, 0, 0, 0];
			if(resId < 10) {//主角色，其他是副将
				for (var k = 0; k < fightParam.resIds.length; k++) {
					if (fightParam.resIds[k] != null) {
						var itemObj = dataMgr.find(dataKey.itemTable, fightParam.resIds[k]);
						eqFlagArray6[k] = itemObj.resSuit;
					}
				}
			} else {
				var heroData = rpgGame.getData().find(dataKey.heroTable, resId);
				name = heroData.name;
				attackType = heroData.attackType;
				voc = heroData.vocation;
			}
			pFighter = rpgGame.getCharacterUtil().add(name, BTG.CharacterType_FighterOther, gameId, resId, pos, 1, eqFlagArray6);
			pFighter.setAttackType(attackType);
			pFighter.setRaceId(voc);
		}
		pFighter.setDirection(side !== 0 ? BTG.ARSD_Left : BTG.ARSD_Right, true);
		pFighter.setMaxBlood(fightParam.maxLife);
		pFighter.setMorale(fightParam.morale);
		// pFighter.FightParam = fightParam;
		pFighter.fightAction(BTG.CA_FightStand);
		return pFighter;
	}

	BTG.Fight.prototype.relCreate = function () {
		var fightSevObject = this.m_pFightServerData.fightReports;
		var center = cc.p(BTG.windowSize.width / 2, BTG.windowSize.height / 2);
		center.x = rpgGame.getGameScene().screenToWorld(center.x);
		this.m_pStartPos[BTG.Fight.left] = cc.p(center.x - 150, center.y - 200);
		this.m_pStartPos[BTG.Fight.right] = cc.p(center.x + 150, center.y - 200);
		var strFlag = ["sourceConfig", "targetConfig"];
		//attr
		for (var i = BTG.Fight.left; i <= BTG.Fight.right; i++) {
			for (var k = 0; k < fightSevObject[strFlag[i]].length; k++) {
				var dataObj = fightSevObject[strFlag[i]][k];
				var fightParam = new Object();
				this.m_fighterData[i][this.m_fighterData[i].length] = fightParam;
				fightParam.fightIdx = dataObj.index;
				fightParam.maxLife = dataObj.life;

				fightParam.resId = dataObj.resId;
				fightParam.resIds = dataObj.resIds;

				fightParam.skillId = dataObj.skillId;
				fightParam.morale = dataObj.morale;
				fightParam.boutAddMorale = dataObj.boutMorale;
				fightParam.fightObject = this.createFighter(fightParam, i, dataObj.index);
			}
		}
		//bout
		this.m_boutData = new Array(fightSevObject.bouts.length);
		for (var i = 0; i < fightSevObject.bouts.length; i++) {
			this.m_boutData[i] = new Array(fightSevObject.bouts[i].length);
			for (var kObj = 0; kObj < this.m_boutData[i].length; kObj++) {
				var boutObj = fightSevObject.bouts[i][kObj];
				var pBoutData = new FightBoutData();
				this.m_boutData[i][kObj] = pBoutData;

				pBoutData.side = boutObj.side;
				pBoutData.index = boutObj.index;
				if(boutObj.skillFight !== undefined)
					pBoutData.skillFight = boutObj.skillFight;
				if(boutObj.groupFight !== undefined)
					pBoutData.groupFight = boutObj.groupFight;
				if(boutObj.effects !== undefined) {
					pBoutData.effects = boutObj.effects;
				}
				if(boutObj.actions !== undefined) {
					pBoutData.actions = boutObj.actions;
				}

				//治疗 target
				if (boutObj.treatTargets !== undefined) {
					pBoutData.treatTargets = new Object();
					pBoutData.treatTargets.treatTargets = boutObj.treatTargets;
					pBoutData.treatTargets.treatBlood = boutObj.treatBlood;
					pBoutData.treatTargets.treatBlast = boutObj.treatBlast;
				} else {
					assert(boutObj.targets !== undefined);
					pBoutData.targets = boutObj.targets;
				}
			}
		}
	}
	BTG.Fight.prototype.create = function (fightSevObject____, sceneId, ABCIdx) {
		rpgGame.getCharacterUtil().setShowList([BTG.CharacterType_FighterOther, BTG.CharacterType_FighterMonster]);
		rpgGame.getUIUtil().forceHideAll();
		this.m_pFightServerData = fightSevObject____;
		if (rpgGame.getFilm().setFightFilm(sceneId, ABCIdx, true) === false) {
			this.relCreate();
		} else
			this.m_fightState = "waitFightBeforScript";
	}

	BTG.Fight.prototype.del = function () {
		BTG.FightEffect.release();
		for(var i = 0; i < this.m_fighterData.length; i++)
			for(var k = 0; k < this.m_fighterData[i].length; k++) {
				rpgGame.getCharacterUtil().delForObject(this.m_fighterData[i][k].fightObject);
			}
		rpgGame.getUIUtil().recoveryForceHideAll();
		rpgGame.getCharacterUtil().setShowList("all");
	}
})(BTG);