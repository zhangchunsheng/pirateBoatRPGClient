CDlgNumberInput = function () {
	BTG.DlgBase.call(this, this); //继承属性

	this.m_parentDlg = null;
}
CDlgNumberInput.prototype = new BTG.DlgBase(); //继承方法

//tag[maxNumBtn5057  useBtn 5058  input 5060]
CDlgNumberInput.prototype.onCreateFinal = function (param0) {
	var input = this.find(5060);
	input.setString("1");
	input.setCallback(this, this.inputCtrl);
	this.m_parentDlg = param0;
}

CDlgNumberInput.prototype.onButtonDown = function (pSend) {
	if (pSend.getTag() == 5057) {

	} else if (pSend.getTag() == 5058) {
		var num = parseInt(this.find(5060).getString());
		this.m_parentDlg.useItem(num);
	}

}

CDlgNumberInput.prototype.inputCtrl = function (str) {
	if (str == "") return;
	var strReg = str.match(/\d+/g);
	if (!strReg) {
		this.find(5060).setString(str == "" ? "" : "1");
	} else if (strReg.toString() != str) this.find(5060).setString(strReg.toString());
	else if (str == "0") {
		this.find(5060).setString("1");
	}
}