function CDlgFightAward() {//右上角 回城
	BTG.DlgBase.call(this, this); //继承属性
	this.m_ctrlMoney = null;
	this.m_ctrlExp = null;
	this.m_ctrlQianNeng = null;
	this.m_ctrlDiKuang = [null, null, null, null];
	this.m_ctrlName = [null, null, null, null];
	this.m_ctrlIcon = [];
	this.m_severAward = null;
	this.m_severAllData = null;
};

CDlgFightAward.prototype = new BTG.DlgBase(); //继承方法

CDlgFightAward.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bIsModel = true;
	ret.bIsAutoScale = false;
	return ret;
}
CDlgFightAward.prototype.onCreateFinal = function () {
	this.m_ctrlMoney = this.find(5300);
	this.m_ctrlExp = this.find(5298);
	this.m_ctrlQianNeng = this.find(5302);

	for (var i = 0; i < 4; i++) {
		this.m_ctrlDiKuang[i] = this.find(5305 + i);
		this.m_ctrlName[i] = this.find(5188 + i);
	}
}
CDlgFightAward.prototype.onShow = function (bIsShow, fightAward) {
	if (bIsShow === false) {
		rpgGame.getClientRole().reward(this.m_severAward);
		if (this.m_severAllData.customsAward != undefined) rpgGame.getUIUtil().add("DlgFightResult", this.m_severAllData);
		return;
	}
	this.m_severAllData = fightAward;
	this.m_severAward = fightAward.monsterAward;

	assert(this.m_severAward);
	this.m_ctrlMoney.setString(this.m_severAward.properties.silver);
	this.m_ctrlExp.setString("" + this.m_severAward.exp);
	if (this.m_severAward.properties.potential !== undefined) {
		this.m_ctrlQianNeng.setVisible(true);
		this.m_ctrlQianNeng.setString("" + this.m_severAward.properties.potential);
	} else {
		this.m_ctrlQianNeng.setVisible(false);
	}
	for (var i = 0; i < 4; i++)
	this.m_ctrlName[i].setVisible(false);
	for (var i = 0; i < this.m_ctrlIcon.length; i++) {
		this.m_pRoot.removeChild(this.m_ctrlIcon[i], true);

	}
	this.m_ctrlIcon.length = 0;
	this.m_ctrlIcon.length = this.m_severAward.items.length;
	for (var i = 0; i < this.m_ctrlIcon.length; i++) {
		this.m_ctrlName[i].setVisible(true);
		var itemData = rpgGame.getData().find(dataKey.itemTable, this.m_severAward.items[i].resId);
		this.m_ctrlIcon[i] = BTG.ProxySprite.create("res/icon/" + itemData.iconId + ".jpg",
		this.m_pRoot, this.m_ctrlDiKuang[i].getPosition(), 9999);
		this.m_ctrlName[i].setString(itemData.name);
	}
}
CDlgFightAward.prototype.onTouchBegin = function () {
	this.show(false);
}