function CDlgMainUI_LB() {//左下角 聊天
	BTG.DlgBase.call(this, this); //继承属性
};

CDlgMainUI_LB.prototype = new BTG.DlgBase(); //继承方法

CDlgMainUI_LB.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bHasTouch = false;
	return ret;
}

CDlgMainUI_LB.prototype.flash = function () {
	cc.log("CDlgMainUI_LB");
}

CDlgMainUI_LB.prototype.onShow = function (bShow) {
	this.flash();
}