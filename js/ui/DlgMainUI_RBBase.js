function CDlgMainUI_RBBase() {//右下角 装备栏
	BTG.DlgBase.call(this, this); //继承属性
	this.m_buttonList = null;
};

CDlgMainUI_RBBase.prototype = new BTG.DlgBase(); //继承方法

CDlgMainUI_RBBase.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bHasTouch = false;
	return ret;
}

CDlgMainUI_RBBase.prototype.onButtonDown = function (pSender) {
	if (pSender.getTag() === 322) {// big map
		rpgGame.getUIUtil().add("DlgBigMap");
	}
	if (pSender.getTag() === 315) {//Package
		rpgGame.getUIUtil().add("DlgPackage");
	}
	if (pSender.getTag() === 4780) {//Package
		rpgGame.getUIUtil().add("DlgPlayerEditor");
	}
	if (pSender.getTag() === 312)
		rpgGame.getUIUtil().add("DlgPlayerEditor");
	if (pSender.getTag() === 314)
		rpgGame.getUIUtil().add("DlgHerosLayoutEditor");
}