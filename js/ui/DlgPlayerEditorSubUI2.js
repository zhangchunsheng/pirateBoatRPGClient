function CDlgPlayerEditorSubUI2() {
	BTG.DlgBase.call(this, this); //继承属性
};

CDlgPlayerEditorSubUI2.prototype = new BTG.DlgBase(); //继承方法

CDlgPlayerEditorSubUI2.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.pParentNode = rpgGame.getUIUtil().find("DlgPlayerEditor").m_pRoot;
	ret.bIsAutoScale = false;
	return ret;
}

CDlgPlayerEditorSubUI2.prototype.onShow = function (bIsShow) {
	if (!bIsShow) return;

	var posRefSpr = this.m_pRoot.getParent().getChildByTag(5062);
	this.setPosition(cc.p(posRefSpr.getPosition().x, posRefSpr.getPosition().y));
}