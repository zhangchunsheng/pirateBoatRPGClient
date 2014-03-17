(function(BTG) {
	BTG.FightCommand = function() {
		this.m_pFighter = null;
		this.m_type = null;
		this.m_data0 = null;
		this.m_data1 = null;
		this.m_waitTime = 0;
	};

	BTG.FightCommand.fightCom_MoveTo = 0;
	BTG.FightCommand.fightCom_Action = 1;
	BTG.FightCommand.fightCom_Effecct = 2;
	BTG.FightCommand.fightCom_DelayTime = 3;
	BTG.FightCommand.fightCom_AddMorale = 4;

	function EffectActionData() {
		this.m_skillId = 0;
		this.m_effectactionId = 0;
		this.m_strIconName = 0;
		this.m_strMiaoShu = 0;
		this.m_curBlut = 0;

		this.m_pSpr = 0;
	};

	BTG.Fighter = function() {
		BTG.CharacterBase.call(this, this); //继承属性
		this.m_strDieState = null;
		this.m_pBloodSpr = null;
		this.m_curBlood = undefined;
		this.m_maxBlood = undefined;
		this.m_pMoraleSpr = null;
		this.m_curMorale = undefined;

		this.m_effectAcitonArray = new Array();

		this.m_subBlood = 0;
		this.m_bBlast = false;
		this.m_aa_type = -1;
		this.m_fFrameRate = 0;
		this.szCallbackType = "";
		this.m_callbackParam0 = null;
		this.m_callbackParam1 = null;

		this.m_farEffect = new Array();
	};

	BTG.Fighter.prototype = new BTG.CharacterBase(); //继承方法

	BTG.Fighter.prototype.onDel = function () {
		for (var i = 0; i < this.m_farEffect.length; i++) {
			this.m_farEffect[i].stopAllActions();
			this.m_farEffect[i].getParent().removeChild(this.m_farEffect[i], true);
		}
		this.m_farEffect.length = 0;
	}
	BTG.Fighter.prototype.onStop = function () {
		
	}

	BTG.Fighter.prototype.bindActionCallback = function (aa_type, szBindType, fFrameRate, callbackParam0, callbackParam1) {
		this.m_szCallbackType = szBindType;
		this.m_callbackParam0 = callbackParam0;
		this.m_callbackParam1 = callbackParam1;
		this.m_fFrameRate = fFrameRate;
		this.m_aa_type = aa_type;
	}
	BTG.Fighter.prototype.doActionCallback = function () {
		if (this.m_szCallbackType === "减血")
			BTG.FightEffect.fightSubBlood(this, this.m_callbackParam0, 0, this.m_callbackParam1);
		else if (this.m_szCallbackType === "远程攻击")
			this.playFarAttack(this.m_callbackParam0, this.m_callbackParam1);
	}
	BTG.Fighter.prototype.updateBlut = function () {
		for (var i = 0; i < this.m_effectAcitonArray.length;) {
			this.m_effectAcitonArray[i].m_curBlut--;
			if (this.m_effectAcitonArray[i].m_curBlut < 0) {
				this.m_pImage.m_pBatch.removeChild(this.m_effectAcitonArray[i].m_pSpr);
				this.m_effectAcitonArray[i].m_pSpr = null;
				this.m_effectAcitonArray.splice(i, 1);
			} else
				i++;
		}
	}
	BTG.Fighter.prototype.setEffectAction = function (effectIconFileName, nChiXuHuiHe, strMiaoShu, skillId, effactionId) {
		for (var i = 0; i < this.m_effectAcitonArray.length; i++) {
			if (this.m_effectAcitonArray[i].m_skillId === skillId && this.m_effectAcitonArray[i].m_effectactionId === effactionId) {
				this.m_effectAcitonArray[i].m_curBlut = nChiXuHuiHe;
				return;
			}
		}
		var pData = new EffectActionData();
		this.m_effectAcitonArray[this.m_effectAcitonArray.length] = pData;

		pData.m_skillId = skillId;
		pData.m_effectactionId = effactionId;
		pData.m_curBlut = nChiXuHuiHe;
		pData.m_strIconName = effectIconFileName;
		pData.m_strMiaoShu = strMiaoShu;

		var pos = this.m_pImage.getHeadPosForNode();
		pos.y -= 50;
		pos.x -= 50;
		pData.m_pSpr = BTG.ProxySprite.create("res/icon/" + effectIconFileName,
			this.m_pImage.m_pBatch,
			cc.p(0, 0), BTG.GZOrder_UI
		);
		for (var i = 0; i < this.m_effectAcitonArray.length; i++) {
			this.m_effectAcitonArray[i].m_pSpr.setPosition(cc.p(pos.x, pos.y - i * 32));
		}
	}

	BTG.Fighter.prototype.setAction = function () {
		
	}
	BTG.Fighter.prototype.fightAction = function (action, finalNextAction) {
		BTG.CharacterBase.prototype.setAction.call(this, action, finalNextAction);
		this.m_pImage.replay();
	}
	BTG.Fighter.prototype.isDie = function () {
		return this.m_curBlood <= 0;
	}
	BTG.Fighter.prototype.checkDie = function () {
		if(this.m_curBlood <= 0 && this.m_strDieState !== "die") {
			this.m_strDieState = "die";
			var objPos = this.getCenterForWorld();
			var pEffect = rpgGame.getEffectUtil().add("siwang.json", rpgGame.getGameScene().getSceneRoot(),
				BTG.GZOrder_Effect,
				objPos
			);
		}
	}

	BTG.Fighter.prototype.setMorale = function (nShiQi) {
		this.m_curMorale = nShiQi;
		if (this.m_curMorale > 100)
			this.m_curMorale = 100;
		if (this.m_curMorale < 0)
			this.m_curMorale = 0;
		if (this.m_pImage.isLoadFinal() === false)
			return;
		if (this.m_pMoraleSpr === null) {
			var pos = this.m_pImage.getHeadPosForNode();
			pos.y += 20;
			var jd = cc.Sprite.create("res/chuangkou/shiqi.png");
			jd.setAnchorPoint(cc.p(0.5, 1.0));
			this.m_pMoraleSpr = cc.ProgressTimer.create(jd);
			this.m_pMoraleSpr.setType(cc.PROGRESS_TIMER_TYPE_BAR);
			this.m_pMoraleSpr.setMidpoint(cc.p(0, 0));
			this.m_pMoraleSpr.setBarChangeRate(cc.p(1, 0));
			this.m_pMoraleSpr.setPosition(pos);
			this.m_pImage.m_pBatch.addChild(this.m_pMoraleSpr, 101);
			this.addFlipChildNode(this.m_pMoraleSpr);
		}
		this.m_pMoraleSpr.setPercentage(0 | (this.m_curMorale));
	}
	BTG.Fighter.prototype.getMorale = function () {
		return this.m_curMorale;
	}

	BTG.Fighter.prototype.addBlood = function (addBlood) {
		cc.log(this.m_curBlood + "/" + this.m_maxBlood);
		this.m_curBlood += addBlood;
		cc.log(this.m_curBlood + "/" + this.m_maxBlood);
		if (this.m_curBlood < 0)
			this.m_curBlood = 0;
		if (this.m_curBlood > this.m_maxBlood)
			this.m_curBlood = this.m_maxBlood;
		if (this.m_pImage.isLoadFinal() === false)
			return;
		if (this.m_pBloodSpr === null) {
			var pos = this.m_pImage.getHeadPosForNode();
			pos.y += 26;

			var sprBk = cc.Sprite.create("res/chuangkou/xuetiao1.png");
			sprBk.setOpacity(200);
			sprBk.setPosition(pos);
			var jd = cc.Sprite.create("res/chuangkou/xuetiao2.png");
			jd.setAnchorPoint(cc.p(0.5, 0));
			this.m_pBloodSpr = cc.ProgressTimer.create(jd);

			this.m_pBloodSpr.setType(cc.PROGRESS_TIMER_TYPE_BAR);
			this.m_pBloodSpr.setMidpoint(cc.p(0, 0));
			this.m_pBloodSpr.setBarChangeRate(cc.p(1, 0));
			this.m_pBloodSpr.setPosition(pos);

			//this.m_pImage.m_pBatch.addChild(sprBk, 100);
			this.m_pImage.m_pBatch.addChild(this.m_pBloodSpr, 101);
			this.addFlipChildNode(this.m_pBloodSpr);
		}

		cc.log("test:" + (this.m_curBlood / this.m_maxBlood * 100));
		this.m_pBloodSpr.setPercentage(0 | (this.m_curBlood / this.m_maxBlood * 100));
	}

	BTG.Fighter.prototype.setMaxBlood = function (maxBlood) {
		this.m_maxBlood = maxBlood;
		this.m_curBlood = maxBlood;
		this.addBlood(0);
	}

	BTG.Fighter.doFightCommand = function (ftime) {
		if (BTG.Fighter.m_fightCommandArray === null)
			return;
		
		BTG.Fighter.m_fightTime += ftime;

		if (BTG.Fighter.m_fightTime >= BTG.Fighter.m_fightCommandArray[0].m_waitTime) {
			BTG.Fighter.m_fightTime = 0;
			var curCommand = BTG.Fighter.m_fightCommandArray[0];

			switch (curCommand.m_type) {
				case BTG.FightCommand.fightCom_AddMorale:
					curCommand.m_pFighter.setMorale(curCommand.m_data0);
					break;
				case BTG.FightCommand.fightCom_Action:
					cc.log("curCommand.m_data0:" + curCommand.m_data0);
					curCommand.m_pFighter.fightAction(curCommand.m_data0, curCommand.m_data1);
					break;
				case BTG.FightCommand.fightCom_MoveTo:
					curCommand.m_pFighter.setMoveTargetForTime(curCommand.m_data0, curCommand.m_data1);
					break;
				case BTG.FightCommand.fightCom_Effecct:
					curCommand.m_pFighter.playEffect(curCommand.m_data0);
					break;
			}
			BTG.Fighter.m_fightCommandArray.splice(0, 1);
			if (BTG.Fighter.m_fightCommandArray.length <= 0) {
				BTG.Fighter.m_fightCommandArray = null;
				BTG.Fighter.m_fightCommandMaxTime = 0.5;
			}
		}
	}
	BTG.Fighter.prototype.setDirection = function (direction) {
		if (arguments.length === 2)
			BTG.CharacterBase.prototype.setDirection.call(this, direction);
		else
			return;

	}

	BTG.Fighter.prototype.onSetAction = function (AA_type) {
		
	}

	BTG.Fighter.prototype.onResLoad = function () {
		if (this.m_curBlood !== undefined) {
			this.addBlood(0);
		}
		if (this.m_curMorale !== undefined)
			this.setMorale(this.m_curMorale);
	}
	BTG.Fighter.prototype.onUpdate = function (ftime) {
		if (this.m_strDieState === null) return;
		var pSpr = this.m_pImage.m_pBatch;
		var scaleY = pSpr.getScaleX();
		scaleY -= ftime * 3;
		if (scaleY < 0) {
			scaleY = 0;
			this.m_strDieState = null;
		}
		pSpr.setScaleX(scaleY);
	}

	BTG.Fighter.prototype.playFarAttack = function(imageFileName, beAttackFighter) {
		var pos = rpgGame.getGameRoot().convertToNodeSpace(this.m_pImage.getSpriteWorldPos(BTG.CT_LeftHand, cc.p(0.5, 0.5)));
		var beAttackPos = rpgGame.getGameRoot().convertToNodeSpace(beAttackFighter.m_pImage.getSpriteWorldPos(BTG.CT_Root, cc.p(0, 0)));

		var pEffSpr = BTG.ProxySprite.create(imageFileName, rpgGame.getGameRoot(),
		pos, BTG.GZOrder_Effect);
		pEffSpr.preAh(cc.p(0.8, 0.5));
		this.m_farEffect[this.m_farEffect.length] = pEffSpr;
		var direction = subPoint(beAttackPos, pos);
		var angle = calcDirAngle(cc.p(1, 0), direction);
		if (direction.x < 0 || direction.y < 0)
			angle = Math.PI - angle;
		pEffSpr.setRotation(angle);
		var fo = cc.FadeOut.create(0.2);
		var mt = cc.MoveTo.create(0.3, beAttackPos);
		var hide = cc.Hide.create();
		pEffSpr.preAction(cc.Sequence.create([mt, fo, hide]));
		pEffSpr.setBlendFunc(gl.SRC_ALPHA, gl.ONE);
	}

	BTG.Fighter.m_fightCommandArray = null;
	BTG.Fighter.m_fightTime = 0;
	BTG.Fighter.m_fightCommandMaxTime = 0.5;

	BTG.Fighter.addFightCommand = function(fighter, fightCom_type, waitTime, data0, data1) {
		if (BTG.Fighter.m_fightCommandArray === null)
			BTG.Fighter.m_fightCommandArray = new Array();

		var pCommand = new BTG.FightCommand();
		pCommand.m_pFighter = fighter;
		pCommand.m_type = fightCom_type;
		pCommand.m_data0 = data0;
		pCommand.m_data1 = data1;
		pCommand.m_waitTime = waitTime;
		BTG.Fighter.m_fightCommandArray[BTG.Fighter.m_fightCommandArray.length] = pCommand;

		BTG.Fighter.m_fightCommandMaxTime += waitTime;
	}

	BTG.Fighter.prototype.playEffect = function (effectFileName) {
		var direction = this.getDir();
		var objPos = this.getCenterForWorld();

		var pEffect = rpgGame.getEffectUtil().add(effectFileName,
			rpgGame.getGameScene().getSceneRoot(),
			BTG.GZOrder_Effect,
			objPos
		);
		if (direction === BTG.ARSD_Left)
			pEffect.flipX();
	}
	BTG.Fighter.getFightCommandMaxTime = function () {
		return BTG.Fighter.m_fightCommandMaxTime;
	}
})(BTG);