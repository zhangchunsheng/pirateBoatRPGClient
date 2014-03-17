function CDlgMainUI_LT() {//左上角 主角色头像
	BTG.DlgBase.call(this, this); //继承属性
};

CDlgMainUI_LT.prototype = new BTG.DlgBase(); //继承方法

CDlgMainUI_LT.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bHasTouch = false;
	return ret;
}

CDlgMainUI_LT.prototype.flash = function () {
	if(rpgGame.getMainPlayer().getServerData() === null)
		return;
	var clientRole = rpgGame.getClientRole().roleDb_;
	this.find(324).setString(clientRole.name); //名字
	this.find(325).setString(rpgGame.getClientRole().getLevel().toString()); //等级
	this.find(325).setColor(cc.c3(246, 223, 1));
	if (clientRole.gold !== undefined)
		this.find(326).setString(clientRole.gold.toString()); //金币

	if (clientRole.gift !== undefined)
		this.find(327).setString(clientRole.gift.toString()); //礼券
	if (clientRole.silver !== undefined) {
		var pString = this.find(328);
		var org = parseInt(pString.getString());
		pString.setString(clientRole.silver.toString()); //银币

		if (!isNaN(org)) {
			if (org != clientRole.silver) {
				var money = clientRole.silver - org;
				BTG.actionUtil.fadeOutWithScaleAndMove((money > 0 ? "+" : "-") + money,
				cc.c3(255, 128, 0), pString.getParent(),
				pString.getPosition(), 18, true);
			}
		}
	}
	if (clientRole.army !== undefined)
		this.find(329).setString(clientRole.army.toString()); //军令
	//this.find(5176).setString(clientRole.army.toString());//vip

}
CDlgMainUI_LT.prototype.onShow = function (bShow) {
	this.flash();
}