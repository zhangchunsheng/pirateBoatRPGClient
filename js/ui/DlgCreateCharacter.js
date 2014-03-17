function CDlgCreateCharacter() {
	BTG.DlgBase.call(this, this); //继承属性
	this.m_curSelIdx = BTG.characterId;
};

CDlgCreateCharacter.prototype = new BTG.DlgBase(); //继承方法

CDlgCreateCharacter.prototype.onButtonDown = function (pSend) {
	if (pSend.getTag() == 254) {
		this.m_curSelIdx = 0;
	} else if (pSend.getTag() == 255) {
		this.m_curSelIdx = 1;
	}
	if (pSend.getTag() == 257) {
		this.m_curSelIdx = BTG.characterId;
		var editBox = this.find(263);
		var strName = editBox.getString();
		rpgGame.getSocketUtil().sendMessage("selectRole", this.m_curSelIdx, strName);
	}
}