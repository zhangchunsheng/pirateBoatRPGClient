function CDlgGoHome() {//右上角 回城
	BTG.DlgBase.call(this, this); //继承属性
};

CDlgGoHome.prototype = new BTG.DlgBase(); //继承方法

CDlgGoHome.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bHasTouch = false;
	return ret;
}
CDlgGoHome.prototype.flash = function (mosterNums) {
	this.find(5009).setString(mosterNums.toString());
}
CDlgGoHome.prototype.onButtonDown = function (pSend) {

	if (pSend.getTag() === 5006) {
		var chapSys = rpgGame.getClientRole().goHome();
	}
}

CDlgGoHome.prototype.onShow = function (bIsShow) {
	this.flash(3);
	this.find(5007).setString(rpgGame.getGameScene().m_szSceneName);
}