function CDlgSkillItemTip() {
	BTG.DlgBase.call(this, this);
}
CDlgSkillItemTip.prototype = new BTG.DlgBase(); //继承方法

CDlgSkillItemTip.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bIsTransfromTTF = false;
	ret.bIsClickExternClose = true;
	ret.bIsModel = true;
	ret.bIsAutoScale = false;
	return ret;
}

CDlgSkillItemTip.prototype.onCreateFinal = function () {
	this.m_pRoot.setScale(0.5);
}

CDlgSkillItemTip.prototype.onShow = function (isShow, tipItem) {
	if (!isShow) {
		this.m_pRoot.setScale(0.5);
		return;
	}

	var skillData = tipItem.getUserData();

	this.find(5435).setString(skillData.skillName);
	this.find(5436).setString(skillData.skillDes);
	this.find(5437).setTexture(tipItem.getTexture());

	var pos = tipItem.getParent().convertToWorldSpace(tipItem.getPosition());
	this.setPosition(cc.p(pos.x + this.m_pRoot.getContentSize().width / 2, pos.y - this.m_pRoot.getContentSize().height / 2));

	//this.m_pRoot.runAction(cc.ScaleTo.create(0.05,1, 1));
	BTG.actionUtil.showTip(this.m_pRoot, tipItem.getPosition());
}
CDlgSkillItemTip.prototype.onTouchBegin = function () {
	this.show(false);
}