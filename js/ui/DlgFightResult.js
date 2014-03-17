function sFightResult() {
	this.sprDiKuang = null;
	this.sprGai = null;
	this.ttf = [];

	this.create = function (templateCtrl, pos, tag, obj, objCallback) {
		this.sprDiKuang = copySprite(templateCtrl.sprDiKuang, templateCtrl.sprDiKuang.getParent());
		//this.sprDiKuang.setUserData(serverData);

		this.sprGai = copyMenuItem(templateCtrl.sprGai, obj, objCallback, templateCtrl.sprGai.getParent());
		this.sprGai.setPosition(templateCtrl.sprDiKuang.getPosition());
		this.sprGai.setTag(tag);
		this.sprGai.setUserData(this);
		for (var i = 0; i < 8; i++)
		this.ttf[i] = copyMinTTF(templateCtrl.ttf[i], templateCtrl.sprDiKuang.getParent());

		var offset = cc.p(pos.x - templateCtrl.sprDiKuang.getPosition().x,
		pos.y - templateCtrl.sprDiKuang.getPosition().y);
		var pTemp = this;
		for (var p in pTemp) {

			if (pTemp[p] != pTemp.ttf) {
				if (pTemp[p].getPosition === undefined) continue;
				var vpos = pTemp[p].getPosition();
				vpos.x += offset.x;
				vpos.y += offset.y;
				this[p].setPosition(vpos);
			} else {
				for (var i = 0; i < pTemp.ttf.length; i++) {
					var vpos = pTemp.ttf[i].getPosition();
					vpos.x += offset.x;
					vpos.y += offset.y;
					pTemp.ttf[i].setPosition(vpos);
				}
			}

		}
	}
}

function CDlgFightResult() {//战斗结果
	BTG.DlgBase.call(this, this); //继承属性

	this.m_ctrlStar = [];
	this.m_sprSel = null;
	this.m_pDiKuang = [];
	this.m_serverData = null;
	this.gaiTag = 5520;
};

CDlgFightResult.prototype = new BTG.DlgBase(); //继承方法

CDlgFightResult.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bIsModel = true;
	return ret;
}

CDlgFightResult.prototype.onCreateFinal = function () {
	this.m_sprSel = this.find(5327);
	for (var i = 0; i < 5; i++)
	this.m_ctrlStar[i] = this.find(5334 + i);
	
	this.m_pDiKuang[0] = new sFightResult();

	this.m_pDiKuang[0].sprDiKuang = this.find(5318);
	this.m_pDiKuang[0].sprGai = this.findButton(this.gaiTag);
	this.m_pDiKuang[0].sprGai.setUserData(this.m_pDiKuang[0]);
	this.m_pDiKuang[0].ttf = [];
	for (var i = 0; i < 8; i++)
	this.m_pDiKuang[0].ttf[i] = this.find(5319 + i);
	var startPos = this.m_pDiKuang[0].sprDiKuang.getPosition();
	for (var i = 1; i < 3; i++) {
		this.m_pDiKuang[i] = new sFightResult();
		this.m_pDiKuang[i].create(this.m_pDiKuang[0],
		cc.p(startPos.x + (this.m_pDiKuang[0].sprDiKuang.getContentSize().width + 33) * i,
		startPos.y), this.gaiTag + i, this, this.onButtonDown);
	}
}
CDlgFightResult.prototype.onShow = function (bIsShow, param) {
	if (bIsShow === false)
		return;

	this.findButton(5317).setVisible(false);
	this.findButton(5316).setVisible(false);
	this.find(5339).setVisible(false);
	this.find(5340).setVisible(false);
	this.m_serverData = param;

	this.m_sprSel.setVisible(false);
	this.find(5312).setString(rpgGame.getGameScene().m_szSceneName);
	//star
	for (var i = 0; i < 5; i++) {
		this.m_ctrlStar[i].setVisible(i < this.m_serverData.star);
	}
	for (var i = 0; i < 3; i++) {
		this.m_pDiKuang[i].sprGai.setVisible(true);
	}

}
CDlgFightResult.prototype.onButtonDown = function (pSend) {
	var tag = pSend.getTag();
	if (this.m_sprSel.isVisible() == false && tag >= this.gaiTag && tag <= this.gaiTag + 2) {
		var curDKRoot = pSend.getUserData();
		this.m_sprSel.setVisible(true);
		this.m_sprSel.setPosition(curDKRoot.sprDiKuang.getPosition());
		//两button
		this.findButton(5317).setVisible(true);
		this.findButton(5316).setVisible(true);
		this.find(5339).setVisible(true);
		this.find(5340).setVisible(true);
		rpgGame.getClientRole().reward(this.m_serverData.customsAward);

		var awData = rpgGame.getClientRole().getCustomsRewards(this.m_serverData.customsAward, tag - this.gaiTag);
		for (var k = 0; k < 3; k++) {
			this.m_pDiKuang[k].sprGai.setVisible(false);
			//经验
			this.m_pDiKuang[k].ttf[0 * 2 + 1].setString(awData[k].exp.toString());
			//银币
			this.m_pDiKuang[k].ttf[1 * 2 + 1].setString(awData[k].properties.silver.toString());
			//军令与
			if (awData[k].properties.army == undefined) {
				this.m_pDiKuang[k].ttf[2 * 2].setVisible(false);
				this.m_pDiKuang[k].ttf[2 * 2 + 1].setVisible(false);
			} else {
				this.m_pDiKuang[k].ttf[2 * 2].setVisible(true);
				this.m_pDiKuang[k].ttf[2 * 2 + 1].setVisible(true);
				this.m_pDiKuang[k].ttf[2 * 2 + 1].setString(awData[k].properties.army.toString());
			}
			//点券
			if (awData[k].properties.gift == undefined) {
				this.m_pDiKuang[k].ttf[3 * 2].setVisible(false);
				this.m_pDiKuang[k].ttf[3 * 2 + 1].setVisible(false);
			} else {
				this.m_pDiKuang[k].ttf[3 * 2].setVisible(true);
				this.m_pDiKuang[k].ttf[3 * 2 + 1].setVisible(true);
				this.m_pDiKuang[k].ttf[3 * 2 + 1].setString(awData[k].properties.gift.toString());
			}
		}
		return;
	}
	this.show(false);
	if (pSend.getTag() === 5317) {
		rpgGame.getClientRole().goHome();
	} else {
		rpgGame.getSocketUtil().sendMessage("customsFightAgain", function () {
			rpgGame.getGameScene().loadScene(rpgGame.getGameScene().getGameID());
		});
	}
}
CDlgFightResult.prototype.onTouchBegin = function (touchPos) {

}