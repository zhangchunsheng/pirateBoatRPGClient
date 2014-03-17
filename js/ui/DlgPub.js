function sPubHead() {
	this.sprRootDiKuang = null;
	this.sprIsJop = null;
	this.sprHeadIconDiKuang = null;
	this.sprHeadIcon = null;
	this.ttfName = null;

	this.sprHunImage = null;
	this.ttfHun = null;
}

function CDlgPub() {
	BTG.DlgBase.call(this, this); //继承属性
	this.m_scrollbar = null;
	this.m_pGroup = null;
	this.m_pPubHeadTemplate = new sPubHead();
	this.m_nLineStrip = 0;
	this.m_startPos = null;


	this.m_pSprHunImage = []; //金 紫 蓝
	this.m_sprSel = null;
	this.m_nCurSelWJ = -1;
	this.m_nCurSelPage = -1;
	this.m_pCurWjMode = null;

	this.m_ctrlWjTTF = [];

	this.m_oneKey10Time = 0;
	this.m_oneKey10Data = new Object();

	this.m_playSelAni = "no";
	this.m_sprPlaySelAni = null;
};

CDlgPub.prototype = new BTG.DlgBase(); //继承方法

CDlgPub.prototype.setSelPage = function (nSelPage) {
	if (this.m_nCurSelPage === nSelPage) return;
	this.m_nCurSelPage = nSelPage;
	this.setSelWJ(0);
}
CDlgPub.prototype.setSelWJ = function (nSelWjIdx) {
	this.m_nCurSelWJ = nSelWjIdx;
	var pCurCtrl = this.m_pGroup[this.m_nCurSelPage][this.m_nCurSelWJ];
	var pData = pCurCtrl.sprRootDiKuang.getUserData();
	this.m_sprSel.setPosition(pCurCtrl.sprRootDiKuang.getPosition());

	this.flashMoney(pData.soulType);
	var pSkillData = rpgGame.getData().find(dataKey.skillTable, pData.skillId);
	this.find(25).setString(pSkillData.skillName);
	this.find(26).setString(pSkillData.skillDes);
	if (this.m_pCurWjMode) {
		rpgGame.getCharacterUtil().delForObject(this.m_pCurWjMode);
		this.m_pCurWjMode = null;
	}

	this.m_pCurWjMode = rpgGame.getCharacterUtil().createUICharacter(pData.resId,
		this.find(5397).getPosition(), undefined, this.m_pRoot
	);

	var curKeyValue = "";
	for (var i = 0; i < this.m_ctrlWjTTF.length; i++) {
		if (i % 2 === 0) {
			curKeyValue = this.m_ctrlWjTTF[i].getUserData();
			continue;
		}
		if (curKeyValue == "ruodian")
			continue;

		var curValue = pData[curKeyValue];
		if (curValue === undefined)
			curValue = pData["baseAttr"][curKeyValue];
		if (curValue === undefined)
			curValue = pData["baseRise"][curKeyValue];
		assert(curValue !== undefined, curKeyValue);
		if (curKeyValue == "vocation")
			this.m_ctrlWjTTF[i].setString(LGG(curValue + "Voc"));
		else if (curKeyValue == "position")
			this.m_ctrlWjTTF[i].setString(LGG(curValue + "Pos"));
		else
			this.m_ctrlWjTTF[i].setString(curValue + " ");
	}
}
CDlgPub.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bIsModel = true;
	ret.bIsOpenHideScene = true;
	ret.bIsTransfromTTF = false;
	return ret;
}
CDlgPub.prototype.clearAll = function () {
	if (this.m_pGroup === null) return;
	for (var i = 0; i < this.m_pGroup.length; i++) {
		for (var k = 0; k < this.m_pGroup[i].length; k++) {
			this.m_scrollbar.removeChild(this.m_pGroup[i][k].sprRootDiKuang, true);
			this.m_pGroup[i][k].sprRootDiKuang = null;
		}
	}
	this.m_pGroup = null;
}
CDlgPub.prototype.onButtonDown = function (pSend) {
	if (this.m_playSelAni !== "no")
		return;

	var pubSystem = rpgGame.getClientRole().getBarSystem();
	var pCurCtrl = this.m_pGroup[this.m_nCurSelPage][this.m_nCurSelWJ];
	var pData = pCurCtrl.sprRootDiKuang.getUserData();
	if (pSend.getTag() === 5359) {//jop
		pubSystem.preBuyHero(pCurCtrl.groupData.resId, pData.resId);
		this.flashHun();
	} else if (pSend.getTag() === 5360) {//一键十次必胜
	} else if (pSend.getTag() === 5361) {//一键十次
		pubSystem.preOnekeyChallenge(pCurCtrl.groupData.resId);
	} else if (pSend.getTag() === 5362) {//普通
		pubSystem.preChallenge(pCurCtrl.groupData.resId);
	}
}
CDlgPub.prototype.flashHun = function () {
	var clientRole = rpgGame.getClientRole().roleDb_;
	this.find(5392).setString(clientRole.goldSoul); //金色
	this.find(5394).setString(clientRole.purpleSoul); //紫色
	this.find(5396).setString(clientRole.blueSoul); //蓝色
}
CDlgPub.prototype.onShow = function (bIsShow) {
	this.m_sprSel.setVisible(true);
	this.clearAll();
	if (this.m_sprPlaySelAni) {
		for (var i = 0; i < this.m_sprPlaySelAni.length; i++)
		this.m_scrollbar.removeChild(this.m_sprPlaySelAni[i], true);
		this.m_sprPlaySelAni = null;
	}
	if (bIsShow === false) {
		return;
	}
	//刷新魂数
	var clientRole = rpgGame.getClientRole().roleDb_;
	this.flashHun();

	var pubSystem = rpgGame.getClientRole().getBarSystem();

	var showList = pubSystem.getShowList();
	//这里屏蔽掉将，只显示5个
	showList.length = 1;

	this.m_pGroup = new Array(showList.length);

	var createPos = cc.p(this.m_startPos.x, this.m_startPos.y);
	for (var i = 0; i < showList.length; i++) {
		var pUserTable = pubSystem.getHeroTable(showList[i].resId);
		this.m_pGroup[i] = new Array(pUserTable.length);

		for (var iHero = 0; iHero < pUserTable.length; iHero++) {
			this.m_pGroup[i][iHero] = this.createOneHead(i, showList[i], pUserTable[iHero], cc.p(createPos.x, createPos.y));
			createPos.x += this.m_nLineStrip;
		}
		break;
	}

	var curPage = (this.m_pGroup.length - 1);
	if (curPage > 0)
		this.m_scrollbar.scrollTo(-curPage * this.m_scrollbar.getContentSize().width, 0);
	this.setSelPage(this.m_pGroup.length - 1);
}


CDlgPub.prototype.createOneHead = function (index, pShowData, heroData, pos) {
	var ret = new sPubHead();
	ret.groupData = pShowData;
	ret.sprRootDiKuang = copySprite(this.m_pPubHeadTemplate.sprRootDiKuang, this.m_scrollbar);
	ret.sprRootDiKuang.setPosition(pos);
	ret.sprRootDiKuang.setUserData(heroData);

	ret.sprHeadIconDiKuang = copySprite(this.m_pPubHeadTemplate.sprHeadIconDiKuang, ret.sprRootDiKuang);
	ret.sprHeadIcon = copySprite(this.m_pPubHeadTemplate.sprHeadIcon, ret.sprRootDiKuang);; //头像暂时没有，这个没设置

	ret.ttfName = copyMinTTF(this.m_pPubHeadTemplate.ttfName, ret.sprRootDiKuang);
	ret.ttfHun = copyMinTTF(this.m_pPubHeadTemplate.ttfHun, ret.sprRootDiKuang);

	ret.ttfName.setString(heroData.name);
	ret.ttfHun.setString(heroData.needSoul + " ");

	//zhaopin
	if(heroData.ownHero)
		ret.sprIsJop = copySprite(this.m_pPubHeadTemplate.sprIsJop, ret.sprRootDiKuang);
	//hun
	switch (heroData.soulType) {
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
CDlgPub.prototype.flashMoney = function (hunType) {
	this.find(5533).setString(h5_barConfig.gold);
	this.find(5534).setString(h5_barConfig[hunType] * 10);
	this.find(5535).setString(h5_barConfig[hunType]);
}

CDlgPub.prototype.callbackPage = function (nCurPage) {
	if (this.m_playSelAni !== "no")
		return;
	assert(nCurPage >= 0 && nCurPage < this.m_pGroup.length);
	this.setSelPage(nCurPage);
}
CDlgPub.prototype.callbackSel = function (pSend) {
	if (this.m_playSelAni !== "no")
		return;
	var p = this.m_pGroup[this.m_nCurSelPage];
	for (var i = 0; i < p.length; i++) {
		if (p[i].sprRootDiKuang === pSend) {
			this.setSelWJ(i);
			return;
		}
	}
}
CDlgPub.prototype.flashJop = function (resId) {
	for (var i = 0; i < this.m_pGroup.length; i++) {
		for (var k = 0; k < this.m_pGroup[i].length; k++) {
			var userData = this.m_pGroup[i][k].sprRootDiKuang.getUserData();
			if (userData.resId === resId) {
				this.m_pGroup[i][k].sprIsJop = copySprite(this.m_pPubHeadTemplate.sprIsJop, this.m_pGroup[i][k].sprRootDiKuang);
				return;
			}
		}
	}
}
CDlgPub.prototype.onCreateFinal = function () {
	for (var i = 0; i < 3; i++) {
		var p = this.find(5527 + i);
		p.setString(LGG(p.getString()));
		var p = this.find(5530 + i);
		p.setString(LGG(p.getString()));
	}
	var p = this.find(5541);
	p.setString(LGG(p.getString()));
	this.find(5397).setVisible(false);
	this.m_pPubHeadTemplate.sprIsJop = this.find(5432);
	this.m_pPubHeadTemplate.sprRootDiKuang = this.find(5347);
	this.m_startPos = this.m_pPubHeadTemplate.sprRootDiKuang.getPosition();
	this.m_startPos = this.m_pRoot.convertToWorldSpace(this.m_startPos);
	this.m_pPubHeadTemplate.sprHeadIconDiKuang = this.find(5348);
	this.m_pPubHeadTemplate.sprHeadIcon = this.find(5349);
	this.m_pPubHeadTemplate.ttfName = this.find(5350);

	this.m_pPubHeadTemplate.ttfHun = this.find(5353);
	this.m_pPubHeadTemplate.sprHunImage = this.find(5352);

	var nextHead = this.find(5354);
	this.m_nLineStrip = nextHead.getPosition().x - this.m_pPubHeadTemplate.sprRootDiKuang.getPosition().x;
	this.m_pRoot.removeChild(nextHead, true);

	//修正
	var rootPos = this.m_pPubHeadTemplate.sprRootDiKuang.getPosition();
	rootPos.x -= this.m_pPubHeadTemplate.sprRootDiKuang.getContentSize().width / 2;
	rootPos.y -= this.m_pPubHeadTemplate.sprRootDiKuang.getContentSize().height / 2;
	for (var p in this.m_pPubHeadTemplate) {
		if (this.m_pPubHeadTemplate[p].setVisible === undefined)
			continue;
		this.m_pPubHeadTemplate[p].setVisible(false);

		var pos = this.m_pPubHeadTemplate[p].getPosition();
		pos.x -= rootPos.x;
		pos.y -= rootPos.y;
		this.m_pPubHeadTemplate[p].setPosition(pos);
	}
	// WJ info
	for (var i = 0; i < 24; i++) {
		this.m_ctrlWjTTF[i] = this.find(1 + i);
		if (i % 2 === 0) {
			this.m_ctrlWjTTF[i].setUserData(this.m_ctrlWjTTF[i].getString());
			this.m_ctrlWjTTF[i].setString(LGG(this.m_ctrlWjTTF[i].getString()));
		}
	}
	//scroll
	this.m_scrollbar = UIHelp_CreateScrollFormLayer(this.m_pRoot, this.find(BTG.DefineTag_ScrollLayer));

	this.m_scrollbar.enableTouchChild(this, this.callbackSel);
	this.m_scrollbar.enablePage(this.m_scrollbar.getContentSize().width, this, this.callbackPage);
	this.m_startPos = this.m_scrollbar.convertToNodeSpace(this.m_startPos);
	for (var i = 0; i < 3; i++)
	this.m_pSprHunImage[i] = this.find(5391 + i * 2);

	this.m_sprSel = UIHelp_ReplaceCtrl(this.m_scrollbar, this.m_pRoot, 5431);
	this.m_sprSel.notTouch = true;

	var pubSystem = rpgGame.getClientRole().getBarSystem();
	var pThis = this;
	pubSystem.on("startChallenge", function () {//酒馆界面普通开始 后等
		pThis.waitNormal();
		//barsys.bar_;
	});
	pubSystem.on("buyHero", function (resId) {//酒馆界面普通开始 后等
		pThis.flashJop(resId);
		//barsys.bar_;
	});
	//pubSystem.on("fistResult", function (result) {//点石头后等  普通输赢

	//}
	//);
	//CDlgPub.prototype.waitSJB = function(result);

	pubSystem.on("onekeyChallenge", function (data, result, moneyRate, money) {//一键10次后等
		pThis.waitOneKey10(data, result, moneyRate, money);
	});
}

CDlgPub.prototype.waitOneKey10 = function (data, result, moneyRate, money) {
	this.m_oneKey10Data.data = data;
	this.m_oneKey10Data.result = result;
	this.m_oneKey10Data.moneyRate = moneyRate;
	this.m_oneKey10Data.money = money;

	this.m_playSelAni = "playOneKey10";
	this.m_oneKey10Time = 0;
}
CDlgPub.prototype.waitNormal = function () {
	this.m_playSelAni = "playNormal";
	var pubSystem = rpgGame.getClientRole().getBarSystem();
	var bar_ = pubSystem.bar_;
	this.m_sprPlaySelAni = [];

	var realPos = [];
	var pCurGroup = this.m_pGroup[this.m_nCurSelPage];
	for (var i = 0; i < bar_.heros.length; i++) {
		var realPos = this.findWJ(bar_.heros[i]).sprRootDiKuang.getPosition();
		this.m_sprPlaySelAni[i] = copySprite(this.m_sprSel, this.m_scrollbar);
		this.m_sprSel.notTouch = true;
		var randIdx = (0 | (Math.random() * 6)) % pCurGroup.length;
		var moveTo0 = cc.MoveTo.create(0.4, pCurGroup[randIdx].sprRootDiKuang.getPosition());
		randIdx = (0 | (Math.random() * 6)) % pCurGroup.length;
		var moveTo1 = cc.MoveTo.create(0.4, pCurGroup[randIdx].sprRootDiKuang.getPosition());
		randIdx = (0 | (Math.random() * 6)) % pCurGroup.length;
		var moveTo2 = cc.MoveTo.create(0.4, pCurGroup[randIdx].sprRootDiKuang.getPosition());
		var moveTo3 = cc.MoveTo.create(0.4, realPos);
		this.m_sprPlaySelAni[i].runAction(cc.Sequence.create(moveTo0, moveTo1, moveTo2, moveTo3));

	}
	this.m_sprSel.setVisible(false);

}
CDlgPub.prototype.findWJ = function (resId) {
	var p = this.m_pGroup[this.m_nCurSelPage];
	for (var i = 0; i < p.length; i++) {
		var userData = p[i].sprRootDiKuang.getUserData();
		if (userData.resId === resId) {
			return p[i];
		}
	}
	assert(0 && "not find wj");
}
CDlgPub.prototype.autoSelWJ = function (resId) {
	var p = this.m_pGroup[this.m_nCurSelPage];
	for (var i = 0; i < p.length; i++) {
		var userData = p[i].sprRootDiKuang.getUserData();
		if (userData.resId === resId) {
			this.setSelWJ(i);
			return;
		}
	}
}
CDlgPub.prototype.onUpdate = function (dt) {
	if (this.m_playSelAni === "no")
		return;
	if (this.m_playSelAni === "playNormal") {
		this.m_oneKey10Time += dt;
		if (this.m_oneKey10Time > 2.0) {
			this.m_playSelAni = "no";
			this.m_oneKey10Time = 0;
			for (var i = 0; i < this.m_sprPlaySelAni.length; i++)
			this.m_scrollbar.removeChild(this.m_sprPlaySelAni[i], true);
			this.m_sprPlaySelAni = null;
			this.show(false);
			// add pubGame dlg
			rpgGame.getUIUtil().add("DlgPubGame");
		}
		return;
	}
	//this.m_playSelAni =="playOneKey10"
	this.m_oneKey10Time += dt;
	if (this.m_oneKey10Time < 1.0) return;
	this.m_oneKey10Time = 0;
	var pubSystem = rpgGame.getClientRole().getBarSystem();
	var pResult = this.m_oneKey10Data.result;
	for (var y = 0; y < pResult.length; y++) {
		var winIdx = this.m_oneKey10Data.result[y].heroIndex;
		for (var x = 0; x < pResult[y].heros.length; x++) {
			if (pResult[y].heros[x] === -1) continue;
			this.autoSelWJ(pResult[y].heros[x]);
			var strInfo = "";
			if (x < winIdx) {// win
				strInfo = "战胜了武将 " + pResult[y].heroDatas[x].name + " ,得到了" + LGG(pResult[y].heroDatas[x].soulType) + pResult[y].heroDatas[x].giveSoul + "个";
				pubSystem.role_.change(pResult[y].heroDatas[x].soulType, pResult[y].heroDatas[x].giveSoul);

			} else {// lost
				var pHeroData = rpgGame.getData().find(dataKey.heroTable, pResult[y].heros[x]);

				strInfo = "败给了武将 " + pHeroData.name + " ,返还金钱" + this.m_oneKey10Data.moneyRate[x] * this.m_oneKey10Data.money;
				pubSystem.role_.change("silver", this.m_oneKey10Data.moneyRate[x] * this.m_oneKey10Data.money);
			}
			this.flashHun();
			BTG.actionUtil.fadeOutWithScaleAndMove(strInfo);
			pResult[y].heros[x] = -1;
			return;
		}
	}
	this.m_playSelAni = "no";
}