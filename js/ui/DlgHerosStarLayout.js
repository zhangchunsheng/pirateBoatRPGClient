function CDlgHerosStarLayout() {
	BTG.DlgBase.call(this, this);

}
CDlgHerosStarLayout.prototype = new BTG.DlgBase(); //继承方法

CDlgHerosStarLayout.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bIsOpenHideScene = true;
	return ret;
}
CDlgHerosStarLayout.prototype.onCreateFinal = function () {

}