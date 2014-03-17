(function(BTG) {
	BTG.FightEffect = {};
	BTG.FightEffect.m_pFontArray = new Array();

	BTG.FightEffect.release = function () {
		for (var i = 0; i < BTG.FightEffect.m_pFontArray.length; i++) {
			BTG.FightEffect.m_pFontArray[i].stopAllActions();
			BTG.FightEffect.m_pFontArray[i].getParent().removeChild(BTG.FightEffect.m_pFontArray[i], true);
		}
		BTG.FightEffect.m_pFontArray.length = 0;
	}
	BTG.FightEffect.subBlood = function (target, array) {
		array[0].checkDie();
	}
	BTG.FightEffect.calcAngleTargetPT = function () {
		var ret = new Object();
		ret.angle = Math.random() * 90 - 45;
		var distance = 100 + Math.random() * 50;
		var speed = 100 + Math.random() * 100;
		var orgDir = cc.p(0, 1);
		var direction = cc.p(0, 0);
		var arc = ret.angle * (3.1415 / 180.0);
		direction.x = -(orgDir.x * Math.cos(arc) - orgDir.y * Math.sin(arc));
		direction.y = orgDir.x * Math.sin(arc) + orgDir.y * Math.cos(arc);
		ret.target = cc.p(direction.x * distance, direction.y * distance);
		ret.toTime = distance / speed;
		return ret;
	}
	BTG.FightEffect.showText = function (pFighter, strType, text, fDelay, isBaoJi) {
		var pos = pFighter.m_pImage.getHeadPosForWorld();
		var parNode = rpgGame.getGameScene().getSceneRoot();
		var pTextObj = null;
		switch (strType) {
			case "加士气":
				pTextObj = cc.LabelAtlas.create(text.toString(), "res/font/shiqi.png", 20, 17, '.');
				break;
			case "减士气":
				text = -text;
				pTextObj = cc.LabelAtlas.create('.' + text.toString(), "res/font/shiqi.png", 20, 17, '.');
				break;
			case "加血":
				pTextObj = cc.LabelAtlas.create('.' + text.toString(), "res/font/add.png", 20, 17, '.');
				break;
			case "减血":
				text = -text;
				pTextObj = cc.LabelAtlas.create("." + text.toString(), "res/font/sub.png", 20, 17, '.');
				break;
			case "技能":
				pTextObj = cc.LabelTTF.create(text.toString(), "", 30);
				break;
			case "文字":
				switch (text) {
					case "闪避":
						pTextObj = BTG.ProxySprite.create("res/font/shanbi.png", parNode, pos, BTG.GZOrder_Effect);
						break;
					case "招架":
						pTextObj = BTG.ProxySprite.create("res/font/zhaojia.png", parNode, pos, BTG.GZOrder_Effect);
						break;
					case "免疫":
						pTextObj = BTG.ProxySprite.create("res/font/mianyi.png", parNode, pos, BTG.GZOrder_Effect);
						break;
					case "援助":
						pTextObj = BTG.ProxySprite.create("res/font/yuanzhu.png", parNode, pos, BTG.GZOrder_Effect);
						break;
					case "额外回合":
						pTextObj = BTG.ProxySprite.create("res/font/ewaihuihe.png", parNode, pos, BTG.GZOrder_Effect);
						break;
					default:
						cc.alert("[Error]BTG.FightEffect.showText" + strType + ": " + text);
				}
				break;
			default:
				cc.alert("[Error]BTG.FightEffect.showText" + strType + ": " + text);
		}
		pTextObj.setPosition(pos);
		pTextObj.setVisible(false);
		pTextObj.ignoreAnchorPointForPosition(false);
		pTextObj.setAnchorPoint(cc.p(0.5, 0.5));

		BTG.FightEffect.m_pFontArray[BTG.FightEffect.m_pFontArray.length] = pTextObj;

		var delay = cc.DelayTime.create(fDelay);
		var show = cc.Show.create();
		var delayWait = cc.DelayTime.create(0.2);
		var moveFade = cc.Spawn.create(
		cc.FadeOut.create(1.5),
		cc.MoveTo.create(1.0, cc.p(pos.x, pos.y + 100)));

		var call = cc.CallFunc.create(this, this.SubBlood, [pFighter]);

		var seq = null;
		if (strType !== "技能")
			seq = cc.Sequence.create([delay, show, delayWait, moveFade, call]);
		else {
			seq = cc.Sequence.create([delay, show, delayWait, cc.FadeOut.create(1.5), call]);
		}

		if (isBaoJi) {
			pTextObj.setScale(1.5);
			var scale0 = cc.ScaleTo.create(0.2, 2, 2);
			var scale1 = cc.ScaleTo.create(0.5, 1.5, 1.5);

			seq = cc.Sequence.create([delay, show, delayWait, scale0, scale1, moveFade, call]);
		}

		if (strType === "文字") {
			pTextObj.preAction(seq);
		} else {
			pTextObj.runAction(seq);
			parNode.addChild(pTextObj, BTG.GZOrder_Effect);
		}
	}

	BTG.FightEffect.fightSubBlood = function(fighter, nNumber, fDelay, bBlast) {
		cc.log("fightSubBlood");
		if(nNumber === 0)
			return;
		fighter.addBlood(nNumber);
		BTG.FightEffect.showText(fighter, nNumber > 0 ? "加血" : "减血", nNumber, fDelay, bBlast);
	}
	BTG.FightEffect.fightMorale = function(fighter, nNumber, fDelay) {
		BTG.FightEffect.showText(fighter, nNumber > 0 ? "加士气" : "减士气", nNumber, fDelay);
	}
})(BTG);