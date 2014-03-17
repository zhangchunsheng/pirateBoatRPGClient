function TaskDbToStr(taskDb) {
	if (taskDb === undefined)
		return "(" + LGG("kejie") + ")";
	else if (taskDb.done)
		return "(" + LGG("wancheng") + ")";
	else
		return "(" + LGG("yijie") + ")";
}

function TaskDbToBtnStr(taskDb) {
	if (taskDb === undefined)
		return LGG("jieyenwu");
	else if (taskDb.done)
		return LGG("yijingwancheng");
	else
		return LGG("zuoyenwu");
}

function TaskDbToDaoHang(taskDb) {
	if (taskDb === undefined)
		return "jiedaohang";
	else if (taskDb.done)
		return "jiaodaohang";
	else
		return "goalText";
}

function CDlgTask() {
	BTG.DlgBase.call(this, this); //继承属性

	this.m_radioboxTask = null;
	this.m_scrollbar = null;
	this.m_mainTaskText = null;
	this.m_otherTaskText = null;
	this.m_startPos = cc.p(0, 0);
	this.m_nLineStrip = 0;
	this.m_ctrlMiaoShu = null;
	this.m_ctrlTiaoJian = null;
	this.m_ctrlJiangLiTemplate = null;

	this.m_ctrlJLItemPos = [];
	this.m_ctrlJLIconNameTTF = [];
	this.m_batchJLTTF = null;
	this.m_batchJLIcon = null;

	this.m_buttonTTF = null;

	this.m_curRadioType = "cur"; //"acc"
	this.m_curTaskCtrlList = new Array();
	this.m_curSelTaskTTF = null;
	this.m_curSelTaskBk = null;

	this.m_pHylink = null;
};

CDlgTask.prototype = new BTG.DlgBase(); //继承方法

CDlgTask.prototype.onGetUIAttr = function () {
	var ret = new BTG.UIAttr();
	ret.bIsModel = true;
	return ret;
}
CDlgTask.prototype.callbackTaskRadio = function (pSend, idx) {
	if (idx === 0)
		this.m_curRadioType = "cur";
	else
		this.m_curRadioType = "acc";

	this.setTask();
}
//按钮
CDlgTask.prototype.onButtonDown = function (pSend) {
	if (this.m_curSelTaskTTF === null)
		return;

	if (this.m_pHylink)
		this.m_pHylink.do();
	this.show(false);
}
//任务选择
CDlgTask.prototype.callbackSelTask = function (pSend) {
	this.m_curSelTaskTTF = pSend;
	this.selectTask();
}
CDlgTask.prototype.onTouchBegin = function (touchPos) {
	if (this.m_radioboxTask)
		this.m_radioboxTask.touchBegin(touchPos);
}
CDlgTask.prototype.onCreateFinal = function (param) {
	this.m_radioboxTask = new BTG.Radiobox();
	this.m_radioboxTask.create(0, this.find(5191), this, this.callbackTaskRadio, [this.find(5189), this.find(5190)]);
	//scroll
	this.m_scrollbar = UIHelp_CreateScrollFormLayer(this.m_pRoot, this.find(BTG.DefineTag_ScrollLayer));
	this.m_scrollbar.setScrollModel(cc.SCROLL_MODEL_VERTICAL);
	this.m_scrollbar.enableTouchChild(this, this.callbackSelTask);
	this.m_mainTaskText = UIHelp_ReplaceCtrl(this.m_scrollbar, this.m_pRoot, 5180);

	this.m_otherTaskText = UIHelp_ReplaceCtrl(this.m_scrollbar, this.m_pRoot, 5182);
	this.m_curSelTaskBk = UIHelp_ReplaceCtrl(this.m_scrollbar, this.m_pRoot, 5187);

	this.m_mainTaskText.notTouch = true;
	this.m_otherTaskText.notTouch = true;
	this.m_curSelTaskBk.notTouch = true;

	this.m_startPos = this.m_otherTaskText.getPosition();
	this.m_nLineStrip = this.m_mainTaskText.getPosition().y - this.m_startPos.y;

	//描述
	this.m_ctrlMiaoShu = this.find(5184);
	this.m_ctrlTiaoJian = this.find(5185);
	this.m_ctrlTiaoJian.setVisible(false);
	this.m_ctrlJiangLiTemplate = this.find(5186);
	this.m_buttonTTF = this.find(5193);

	this.m_ctrlJiangLiTemplate.setVisible(false);

	for (var i = 0; i < 3; i++) {
		var itemIcon = this.find(5400 + i);
		this.m_ctrlJLItemPos[i] = itemIcon.getPosition();
		this.m_pRoot.removeChild(itemIcon, true);
		this.m_ctrlJLIconNameTTF[i] = this.find(5403 + i);
		this.find(5537 + i).setVisible(false);
	}
}
CDlgTask.prototype.callHylink = function () {
	this.show(false);
}
CDlgTask.prototype.selectTask = function () {
	for (var i = 0; i < 3; i++) {
		this.m_ctrlJLIconNameTTF[i].setVisible(false);
		this.find(5537 + i).setVisible(false);
	}
	if (this.m_batchJLTTF) this.m_pRoot.removeChild(this.m_batchJLTTF, true);
	this.m_batchJLTTF = null;
	if (this.m_batchJLIcon) {
		for (var i = 0; i < this.m_batchJLIcon.length; i++)
		this.m_pRoot.removeChild(this.m_batchJLIcon[i], true);
		this.m_batchJLIcon = null;
	}

	if (this.m_pHylink) {
		rpgGame.getUIUtil().getHylink().del(this.m_pHylink);
		this.m_pHylink = null;
	}
	if (this.m_curSelTaskTTF === null) {
		this.m_curSelTaskBk.setVisible(false);
		this.m_ctrlMiaoShu.setVisible(false);
		return;
	}
	this.m_ctrlMiaoShu.setVisible(true);

	this.m_curSelTaskBk.setVisible(true);

	this.m_curSelTaskBk.setPosition(this.m_curSelTaskTTF.getPosition());

	var taskDataObj = this.m_curSelTaskTTF.getUserData();
	var taskData = null;
	if (taskDataObj.taskData)
		taskData = taskDataObj.taskData;
	else
		taskData = taskDataObj;
	this.m_ctrlMiaoShu.setString(addEnterToString(taskData.acceptText, 20));

	//显示任务进度 只有在已接中显示
	var nTaskJindu = new Array;
	if (taskDataObj.taskDb) {
		if (taskDataObj.taskDb.done === false) {
			if (taskDataObj.taskData.eventGoal > 1) {
				nTaskJindu[1] = taskDataObj.taskData.eventGoal;
				nTaskJindu[0] = taskDataObj.taskDb.progress;
			}
		}
	} else {
		//不满足需求等级的，用红字提示
		var playCurLevel = rpgGame.getClientRole().getMainHero().level;
		if (playCurLevel < taskData.levelLimit)
			nTaskJindu[0] = taskData.levelLimit;
	}
	this.m_pHylink = rpgGame.getUIUtil().getHylink().add(this.m_pRoot,
	taskData[TaskDbToDaoHang(taskDataObj.taskDb)], this, this.callHylink, this.m_ctrlTiaoJian, nTaskJindu);

	//this.m_ctrlTiaoJian.setString(taskData.goalText);

	if (this.m_curRadioType === "acc")
		this.m_buttonTTF.setString(LGG("qujie"));
	else {
		assert(taskDataObj.taskData !== undefined)
		if (taskDataObj.taskDb.done) {
			this.m_buttonTTF.setString(LGG("qujiao"));
		} else
			this.m_buttonTTF.setString(LGG("quzuo"));
	}

	var jiangliPackId = taskData.baseOddsId;
	var ret = CreateTaskAwardTTF(this.m_ctrlJiangLiTemplate,
	jiangliPackId,
	this.m_ctrlJLItemPos,
	this.m_ctrlJLIconNameTTF, [this.find(5537), this.find(5538), this.find(5539)]);
	this.m_batchJLTTF = ret.TTF;
	this.m_batchJLIcon = ret.ItemIconArray;
}
CDlgTask.prototype.setTask = function () {
	this.m_curSelTaskTTF = null;
	for (var i = 0; i < this.m_curTaskCtrlList.length; i++) {
		this.m_scrollbar.removeChild(this.m_curTaskCtrlList[i], true);
	}
	this.m_curTaskCtrlList.length = 0;

	var taskSystem = rpgGame.getClientRole().getTaskSystem();
	var taskList = null;
	if (this.m_curRadioType === "cur") {
		taskList = taskSystem.getCliTasks();
	} else {//acc
		taskList = taskSystem.getCliAccTasks();
	}

	//区分主线直线任务
	var mainTask = new Array();
	var otherTask = new Array();
	for (var i = 0; i < taskList.length; i++) {
		var pCurTask = taskList[i].taskData ? taskList[i].taskData : taskList[i];

		if (pCurTask.taskType === 0) {//主线
			mainTask[mainTask.length] = taskList[i];
		} else {//其它
			otherTask[otherTask.length] = taskList[i];
		}
	}
	//设置主线
	var curPos = cc.p(this.m_startPos.x + 20, this.m_startPos.y);
	for (var i = 0; i < mainTask.length; i++) {
		var pCurTask = mainTask[i].taskData ? mainTask[i].taskData : mainTask[i];
		var pTTF = copyMinTTF(this.m_otherTaskText);
		pTTF.setPosition(cc.p(curPos.x, curPos.y));
		curPos.y -= this.m_nLineStrip;
		pTTF.setUserData(mainTask[i]);
		pTTF.setString(pCurTask.name + TaskDbToStr(mainTask[i].taskDb));
		pTTF.ignoreAnchorPointForPosition(false);
		pTTF.setAnchorPoint(cc.p(0.0, 0.0));

		this.m_scrollbar.addChild(pTTF, 999);
		this.m_curTaskCtrlList[this.m_curTaskCtrlList.length] = pTTF;
		if (i === 0) this.m_curSelTaskTTF = pTTF;
	}
	this.m_otherTaskText.setPosition(cc.p(this.m_startPos.x, curPos.y));
	curPos.y -= this.m_nLineStrip;

	for (var i = 0; i < otherTask.length; i++) {
		var pCurTask = otherTask[i].taskData ? otherTask[i].taskData : otherTask[i];
		var pTTF = copyMinTTF(this.m_otherTaskText);
		pTTF.setPosition(cc.p(curPos.x, curPos.y));
		curPos.y -= this.m_nLineStrip;
		pTTF.setUserData(otherTask[i]);
		pTTF.ignoreAnchorPointForPosition(false);
		pTTF.setAnchorPoint(cc.p(0.0, 0.0));
		pTTF.setString(pCurTask.name + TaskDbToStr(mainTask[i].taskDb));
		this.m_scrollbar.addChild(pTTF, 999);
		this.m_curTaskCtrlList[this.m_curTaskCtrlList.length] = pTTF;
		if (i === 0 && this.m_curSelTaskTTF === null)
			this.m_curSelTaskTTF = pTTF;
	}
	this.selectTask();
}
CDlgTask.prototype.onShow = function (bIsShow) {
	if (bIsShow === false) {
		if (this.m_pHylink) {
			rpgGame.getUIUtil().getHylink().del(this.m_pHylink);
			this.m_pHylink = null;
		}
		return;
	}
	this.setTask();
}