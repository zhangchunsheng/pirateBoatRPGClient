function CDlgMainUI_RT() {//右上角 任务导航
	BTG.DlgBase.call(this, this); //继承属性
	this.m_ctrlTTF = null;
};

CDlgMainUI_RT.prototype = new BTG.DlgBase(); //继承方法

CDlgMainUI_RT.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bHasTouch = false;
	return ret;
}

CDlgMainUI_RT.prototype.flashTask = function (taskSystem) {
	var accDoArray = new Array();
	var levelArray = new Array();
	var finalArray = new Array();
	var playCurLevel = rpgGame.getClientRole().getMainHero().level;
	var pTemp = [taskSystem.getCliTasks(), taskSystem.getCliAccTasks()];
	var pArray = [];

	for (var i = 0; i < 2; i++)
	for (var k = 0; k < pTemp[i].length; k++)
	pArray[pArray.length] = pTemp[i][k];
	for (var i = 0; i < pArray.length; i++) {
		if (pArray[i].taskDb === undefined) {
			if (playCurLevel < pArray[i].levelLimit) {
				pArray[i].taskFinalState = "levBuZu";
				levelArray[levelArray.length] = pArray[i];
			} else {
				pArray[i].taskFinalState = "jiedaohang";
				accDoArray[accDoArray.length] = pArray[i];
			}
		} else if (pArray[i].taskDb.done) {
			pArray[i].taskData.taskFinalState = "jiaodaohang";
			finalArray[finalArray.length] = pArray[i].taskData;
		} else {
			pArray[i].taskData.taskFinalState = "goalText";
			accDoArray[accDoArray.length] = pArray[i].taskData;
		}
	}

	this.m_ctrlTTF.setColor(cc.c3(128, 128, 255));
	if (finalArray.length > 0) {//完成
		finalArray.sort(comFunction("resId"));
		this.m_ctrlTTF.setUserData(finalArray[0]);
		this.m_ctrlTTF.setString(finalArray[0].name);
	} else if (accDoArray.length > 0) {//可接
		accDoArray.sort(comFunction("resId"));
		this.m_ctrlTTF.setUserData(accDoArray[0]);
		this.m_ctrlTTF.setString(accDoArray[0].name);
	} else if (levelArray.length > 0) {//可接，但等级不够
		levelArray.sort(comFunction("resId"));
		this.m_ctrlTTF.setUserData(levelArray[0]);
		this.m_ctrlTTF.setString(levelArray[0].name);
		this.m_ctrlTTF.setColor(cc.c3(255, 0, 0));
	}

}
CDlgMainUI_RT.prototype.onCreateFinal = function () {
	this.m_ctrlTTF = this.find(5272);
	this.flashTask(rpgGame.getClientRole().getTaskSystem());
}
CDlgMainUI_RT.prototype.onButtonDown = function (pSend) {
	if(pSend.getTag() === 5273)
		rpgGame.getUIUtil().add("DlgTask");
	else {//导航
		var taskData = this.m_ctrlTTF.getUserData();
		if (taskData.taskFinalState === "levBuZu") {
			rpgGame.getUIUtil().add("DlgConfirm", "等级不足,升级到" + taskData.levelLimit + "级才可接任务");
		} else {
			var hylinkStr = taskData[taskData.taskFinalState];
			var hylinkObj = BTG.HyperLink.getHylinkData(hylinkStr);
			rpgGame.getUIUtil().addNavigation(hylinkObj.hylinkType, hylinkObj.hylinkData);
		}
	}
}