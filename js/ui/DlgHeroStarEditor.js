function CDlgHerosStarEditor() {
	BTG.DlgBase.call(this, this);

}
CDlgHerosStarEditor.prototype = new BTG.DlgBase(); //继承方法

CDlgHerosStarEditor.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bIsOpenHideScene = true;
	return ret;
}
CDlgHerosStarEditor.prototype.onCreateFinal = function () {

}