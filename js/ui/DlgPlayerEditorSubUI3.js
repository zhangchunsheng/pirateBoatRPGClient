function CDlgPlayerEditorSubUI3() {
	BTG.DlgBase.call(this, this); //继承属性
	this.m_currHeroId = "";
};

CDlgPlayerEditorSubUI3.prototype = new BTG.DlgBase(); //继承方法

CDlgPlayerEditorSubUI3.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bIsTransfromTTF = false;
	ret.pParentNode = rpgGame.getUIUtil().find("DlgPlayerEditor").m_pRoot;
	ret.bIsAutoScale = false;
	return ret;
}

CDlgPlayerEditorSubUI3.prototype.onCreateFinal = function (param0) {
	var arr = [];
	for (var i = 5112; i < 5141; i += 2) {
		arr.push(i);
	}
	UIHelp_TranslateLabels(this.m_pRoot, arr);
}

CDlgPlayerEditorSubUI3.prototype.onShow = function (bIsShow, param0) {
	if (!bIsShow) return;

	var posRefSpr = this.m_pRoot.getParent().getChildByTag(5062);
	this.setPosition(cc.p(posRefSpr.getPosition().x, posRefSpr.getPosition().y));

	this.m_currHeroId = param0;
	this.flash(param0);
}
//[物理攻击 5120]
CDlgPlayerEditorSubUI3.prototype.flash = function (param0) {
	var heroObj = rpgGame.getClientRole().getHeroSystem().getHeroObject(param0);


	if (heroObj) {
		var zhiye = heroObj.vocation;
		if (zhiye === 1) this.find(5120).setString("法术攻击");

		var fightAttr = heroObj.getFightAttrEx();
		var arr = [];
		//5113 - 5141
		for (var i = 5113; i < 5142; i += 2) {
			arr.push(i);
		}
		UIHelp_SetLabelValue(fightAttr, this.m_pRoot, arr, cc.yellow()); //
	}
}