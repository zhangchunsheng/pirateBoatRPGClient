function CDlgConfirm() {
	BTG.DlgBase.call(this, this);
	this.m_msg = "";
	this.m_callBack = null;
}
CDlgConfirm.prototype = new BTG.DlgBase();

CDlgConfirm.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bIsModel = true;
	return ret;
}
CDlgConfirm.prototype.onCreateFinal = function (param0) {
	this.m_msg = param0;
}
CDlgConfirm.prototype.onShow = function (isShow, param0) {
	if (!isShow)
		return;

	this.m_msg = param0;
	var lbl = this.find(5053);
	lbl.setString(param0);
}
CDlgConfirm.prototype.setCallback = function (func) {
	this.m_callBack = func;
}
CDlgConfirm.prototype.onButtonDown = function (pSend) {
	var tag = pSend.getTag()
	if (tag == 5243) {
		if (this.m_callBack)
			this.m_callBack();
		this.show(false);
	} else if (tag == 5244) {
		this.show(false);
	}
}