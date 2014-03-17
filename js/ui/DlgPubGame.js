function CDlgPubGame() {//右上角 回城
	BTG.DlgBase.call(this, this); //继承属性
	this.m_pSprHunImage = []; //金 紫 蓝
	this.m_pPubHeadTemplate = new sPubHead();
	this.m_sprSel = null;
	this.m_sprHeadImage = [];
	this.m_curSelWjIdx = -1;
	this.m_btnIdx = -1;
	this.m_nCurWin = 0;
	this.m_uiActor = [null, null];
	this.m_playAniState = "no";
	this.m_playAniTime = 0;

	this.m_lrPos = [];
	this.m_lrRealSpr = [];
	this.m_lrQuanTou = [];
	this.m_bu_jian_cuiTemp = [];

	this.m_curWjIdx = -1;
	this.m_curResId = -1;
};

CDlgPubGame.prototype = new BTG.DlgBase(); //继承方法
CDlgPubGame.prototype.setSel = function (nIdx) {
	this.m_curSelWjIdx = nIdx;
	this.m_sprSel.setPosition(this.m_sprHeadImage[nIdx].sprRootDiKuang.getPosition());
	if (this.m_uiActor[1]) {
		rpgGame.getCharacterUtil().delForObject(this.m_uiActor[1]);
		this.m_uiActor[1] = null;
	}

	var bardataResId = this.m_sprHeadImage[nIdx].sprRootDiKuang.getUserData();
	this.m_uiActor[1] = rpgGame.getCharacterUtil().createUICharacter(bardataResId,
	this.find(5421).getPosition(), undefined, this.m_pRoot);
}
CDlgPubGame.prototype.flashSel_Win = function () {
	var pubSystem = rpgGame.getClientRole().getBarSystem();
	var idx = pubSystem.bar_.index;
	var len = pubSystem.bar_.heros.length;
	if (pubSystem.bar_.inProgress === false) {//全完了
		if (this.m_nCurWin >= 0) {
			len = 3;
			idx = 3;
			this.setSel(2);
		}

	} else this.setSel(idx);
	for (var i = 0; i < len; i++) {
		if (i < idx) {
			if (this.m_sprHeadImage[i].sprIsJop === null)
				this.m_sprHeadImage[i].sprIsJop = copySprite(this.m_pPubHeadTemplate.sprIsJop, this.m_sprHeadImage[i].sprRootDiKuang);
		}
	}
}
CDlgPubGame.prototype.createOneHead = function (isWin, resId, pos, barData) {
	var ret = new sPubHead();
	var pHeroData = rpgGame.getData().find(dataKey.heroTable, resId);
	ret.sprRootDiKuang = copySprite(this.m_pPubHeadTemplate.sprRootDiKuang, this.m_pRoot);
	ret.sprRootDiKuang.setPosition(pos);
	ret.sprRootDiKuang.setUserData(barData);

	ret.sprHeadIconDiKuang = copySprite(this.m_pPubHeadTemplate.sprHeadIconDiKuang, ret.sprRootDiKuang);
	ret.sprHeadIcon = copySprite(this.m_pPubHeadTemplate.sprHeadIcon, ret.sprRootDiKuang);; //头像暂时没有，这个没设置

	ret.ttfName = copyMinTTF(this.m_pPubHeadTemplate.ttfName, ret.sprRootDiKuang);
	ret.ttfHun = copyMinTTF(this.m_pPubHeadTemplate.ttfHun, ret.sprRootDiKuang);
	// ret.ttfLev = copyMinTTF(this.m_pPubHeadTemplate.ttfLev, ret.sprRootDiKuang);

	ret.ttfName.setString(pHeroData.name);
	// ret.ttfLev.setString(pHeroData.level + " ");
	ret.ttfHun.setString(pHeroData.giveSoul + " ");

	//win lose
	if (isWin) ret.sprIsJop = copySprite(this.m_pPubHeadTemplate.sprIsJop, ret.sprRootDiKuang);
	//hun
	switch (pHeroData.soulType) {
		case "goldSoul":
			ret.sprHunImage = copySprite(this.m_pSprHunImage[0], ret.sprRootDiKuang);
			break;
		case "purpleSoul":
			ret.sprHunImage = copySprite(this.m_pSprHunImage[1], ret.sprRootDiKuang);
			break;
		case "blueSoul":
			ret.sprHunImage = copySprite(this.m_pSprHunImage[2], ret.sprRootDiKuang);
			break;
	}

	ret.sprHunImage.setPosition(this.m_pPubHeadTemplate.sprHunImage.getPosition());

	return ret;

}
CDlgPubGame.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bIsModel = true;
	ret.bIsOpenHideScene = true;
	return ret;
}

CDlgPubGame.prototype.onShow = function (bIsShow) {
	for (var i = 0; i < this.m_sprHeadImage.length; i++)
	this.m_pRoot.removeChild(this.m_sprHeadImage[i].sprRootDiKuang, true);
	for (var i = 0; i < 2; i++) {
		this.m_lrQuanTou[i].stopAllActions();
		this.m_lrQuanTou[i].setPosition(this.m_lrPos[i]);
	}
	this.m_sprHeadImage = [];
	this.m_playAniState = "no";
	this.m_playAniTime = 0;
	for (var i = 0; i < 2; i++) {
		if (this.m_uiActor[i]) {
			rpgGame.getCharacterUtil().delForObject(this.m_uiActor[i]);
			this.m_uiActor[i] = null;
		}
		this.m_lrQuanTou[i].setVisible(bIsShow);
	}
	if (this.m_lrRealSpr) {
		this.m_pRoot.removeChild(this.m_lrRealSpr[0], true);
		this.m_pRoot.removeChild(this.m_lrRealSpr[1], true);
		this.m_lrRealSpr = null;
	}
	if (bIsShow === false)
		return;
	var pHero = rpgGame.getMainPlayer();
	this.m_uiActor[0] = rpgGame.getCharacterUtil().createUICharacter(pHero.getResID(),
	this.find(5420).getPosition(), pHero.m_pImage.getEqList(), this.m_pRoot);
	this.m_uiActor[0].setDirection(BTG.ARSD_Right);
	this.flashHun();

	this.m_sprHeadImage = [];
	var pubSystem = rpgGame.getClientRole().getBarSystem();
	this.m_curWjIdx = pubSystem.bar_.index;
	this.m_curResId = pubSystem.bar_.heros[this.m_curWjIdx];
	for (var i = 0; i < pubSystem.bar_.heros.length; i++) {
		this.m_sprHeadImage[i] = this.createOneHead(i < pubSystem.bar_.index, pubSystem.bar_.heros[i], cc.p(this.m_startPos.x + this.m_nLineStrip * i, this.m_startPos.y), pubSystem.bar_.heros[i]);

	}
	this.setSel(pubSystem.bar_.index);
}

CDlgPubGame.prototype.flashHun = function () {
	var clientRole = rpgGame.getClientRole().roleDb_;
	this.find(5412).setString(clientRole.goldSoul); //金色
	this.find(5411).setString(clientRole.purpleSoul); //紫色
	this.find(5410).setString(clientRole.blueSoul); //蓝色
}

CDlgPubGame.prototype.onCreateFinal = function () {
	this.m_bu_jian_cuiTemp[0] = this.find(5497);
	this.m_bu_jian_cuiTemp[1] = this.find(5496);
	this.m_bu_jian_cuiTemp[2] = this.find(5495);
	for (var i = 0; i < 2; i++) {
		this.m_lrQuanTou[i] = copySprite(this.m_bu_jian_cuiTemp[2], this.m_pRoot);
		this.m_lrPos[i] = this.find(5427 + i).getPosition();
		this.m_lrQuanTou[i].setPosition(this.m_lrPos[i]);
		this.m_pRoot.removeChildByTag(5427 + i, true);
	}
	this.m_lrQuanTou[1].setScaleX(-1);
	this.find(5420).setVisible(false); //武将站位
	this.find(5421).setVisible(false);

	for (var i = 0; i < 3; i++)
		this.m_bu_jian_cuiTemp[i].setVisible(false);

	this.m_pSprHunImage[0] = this.find(5409); //
	this.m_pSprHunImage[1] = this.find(5408);
	this.m_pSprHunImage[2] = this.find(5407);

	this.m_pPubHeadTemplate.sprIsJop = this.find(5433);
	this.m_pPubHeadTemplate.sprRootDiKuang = this.find(5413);
	this.m_startPos = this.m_pPubHeadTemplate.sprRootDiKuang.getPosition();

	this.m_pPubHeadTemplate.sprHeadIconDiKuang = this.find(5414);
	this.m_pPubHeadTemplate.sprHeadIcon = this.find(5415);
	this.m_pPubHeadTemplate.ttfName = this.find(5416);
	// this.m_pPubHeadTemplate.ttfLev = this.find(5351);
	this.m_pPubHeadTemplate.ttfHun = this.find(5418);
	this.m_pPubHeadTemplate.sprHunImage = this.find(5417);

	var nextHead = this.find(5419);
	this.m_nLineStrip = nextHead.getPosition().x - this.m_pPubHeadTemplate.sprRootDiKuang.getPosition().x;
	this.m_pRoot.removeChild(nextHead, true);

	//修正
	var rootPos = this.m_pPubHeadTemplate.sprRootDiKuang.getPosition();
	rootPos.x -= this.m_pPubHeadTemplate.sprRootDiKuang.getContentSize().width / 2;
	rootPos.y -= this.m_pPubHeadTemplate.sprRootDiKuang.getContentSize().height / 2;
	for (var p in this.m_pPubHeadTemplate) {
		if (this.m_pPubHeadTemplate[p] === null)
			continue;
		if (this.m_pPubHeadTemplate[p].setVisible === undefined)
			continue;
		this.m_pPubHeadTemplate[p].setVisible(false);

		var pos = this.m_pPubHeadTemplate[p].getPosition();
		pos.x -= rootPos.x;
		pos.y -= rootPos.y;
		this.m_pPubHeadTemplate[p].setPosition(pos);
	}

	this.m_sprSel = this.find(5485);

	var pubSystem = rpgGame.getClientRole().getBarSystem();
	var pThis = this;

	pubSystem.on("fistResult", function (result) {//点石头后等  普通输赢
		pThis.waitResult(result);
	});
}
CDlgPubGame.prototype.onButtonDown = function (pSend) {
	if (this.m_playAniState !== "no")
		return;
	var pubSystem = rpgGame.getClientRole().getBarSystem();
	if (pSend.getTag() === 5423 || pSend.getTag() === 5424 || pSend.getTag() === 5425) {
		this.m_btnIdx = pSend.getTag() - 5423;
		pubSystem.preGuessFist();
	} else if (pSend.getTag() === 5426) {
		this.m_btnIdx = (0 | (Math.random() * 6)) % 3;
		pubSystem.preMustWinFist();
	}

	this.m_curWjIdx = pubSystem.bar_.index;
	this.m_curResId = pubSystem.bar_.heros[this.m_curWjIdx];

	//this.m_uiActor[0].setAction(BTG.CA_NormalAttack0);
	//this.m_uiActor[1].setAction(BTG.CA_NormalAttack0);
}
CDlgPubGame.prototype.waitResult = function (result) {
	for (var i = 0; i < 2; i++) {
		this.m_lrQuanTou[i].setPosition(this.m_lrPos[i]);
		this.m_lrQuanTou[i].setVisible(true);
		var pos = this.m_lrQuanTou[i].getPosition();
		var moveTo2 = cc.MoveTo.create(0.4, cc.p(pos.x, pos.y));
		var moveTo3 = cc.MoveTo.create(0.4, cc.p(pos.x, pos.y + 20));
		this.m_lrQuanTou[i].runAction(
		cc.RepeatForever.create(cc.Sequence.create(moveTo2, moveTo3)));
	}

	this.m_nCurWin = result;
	var pubSystem = rpgGame.getClientRole().getBarSystem();

	this.m_playAniState = "waitShow";
	if (this.m_lrRealSpr) {
		this.m_pRoot.removeChild(this.m_lrRealSpr[0], true);
		this.m_pRoot.removeChild(this.m_lrRealSpr[1], true);
	}
	this.m_lrRealSpr = [];
	this.m_lrRealSpr[0] = copySprite(this.m_bu_jian_cuiTemp[this.m_btnIdx], this.m_pRoot);
	var idx2 = 0;
	if (result === 0)
		idx2 = this.m_btnIdx;
	else if (result < 0) {
		idx2 = this.m_btnIdx + 1;
		if (idx2 > 2)
			idx2 = 0;
	} else {
		idx2 = this.m_btnIdx - 1;
		if (idx2 < 0)
			idx2 = 2;
	}
	this.m_lrRealSpr[1] = copySprite(this.m_bu_jian_cuiTemp[idx2], this.m_pRoot);
	this.m_lrRealSpr[1].setScaleX(-1);
	for (var i = 0; i < 2; i++) {
		this.m_lrRealSpr[i].setPosition(cc.p(this.m_lrPos[i].x, this.m_lrPos[i].y + 30));
		this.m_lrRealSpr[i].setVisible(false);
	}
}

var h5_barConfig = require("gameData/barConfig");

CDlgPubGame.prototype.addText = function () {
	var strInfo = "";
	var pubSystem = rpgGame.getClientRole().getBarSystem();

	var pHeroData = rpgGame.getData().find(dataKey.heroTable, this.m_curResId);

	if (this.m_nCurWin === 0) {
		strInfo = "与武将" + pHeroData.name + "战平局了";
	} else if (this.m_nCurWin > 0) {
		strInfo = "战胜武将" + pHeroData.name + "获得了" + LGG(pHeroData.soulType) + pHeroData.giveSoul + "个";
	} else {
		strInfo = "被武将" + pHeroData.name + "战胜,返还了银币" + h5_barConfig.returnSilver[this.m_curWjIdx] * h5_barConfig[pHeroData.soulType];;
	}
	BTG.actionUtil.fadeOutWithScaleAndMove(strInfo);
}
CDlgPubGame.prototype.onUpdate = function (dt) {
	if (this.m_playAniState === "no")
		return;

	this.m_playAniTime += dt;
	if (this.m_playAniState === "waitShow") {
		if (this.m_playAniTime > 3) {
			this.m_playAniTime = 0;

			for (var i = 0; i < 2; i++) {
				this.m_lrRealSpr[i].setVisible(true);
				this.m_lrQuanTou[i].setVisible(false);
				var moveTo3 = cc.MoveTo.create(0.4, cc.p(this.m_lrPos[i].x, this.m_lrPos[i].y));
				this.m_lrRealSpr[i].runAction(moveTo3);
			}
			this.m_playAniState = "waitWenZi";
			this.flashSel_Win();
			this.addText();
			this.flashHun();
		}
	} else if (this.m_playAniState === "waitWenZi") {
		if (this.m_playAniTime > 1) {
			this.m_playAniTime = 0; //本次结束
			this.m_playAniState = "no";
			var pubSystem = rpgGame.getClientRole().getBarSystem();
			if (pubSystem.bar_.inProgress === false) {
				this.show(false);
				rpgGame.getUIUtil().add("DlgPub");
			}
		}
	}
}