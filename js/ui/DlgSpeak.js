function CreateTaskAwardTTF(templateTTF, jianglibaoId, itemPosArray, itemNameArray, diKuangArray) {
	var retBatch = cc.Node.create();
	templateTTF.getParent().addChild(retBatch, 9999);
	retBatch.setPosition(templateTTF.getPosition());
	var itemData = rpgGame.getData().find(dataKey.baseOdds, jianglibaoId);

	var ttfList = [];

	//经验
	ttfList[0] = copyMinTTF(templateTTF);
	ttfList[1] = copyMinTTF(templateTTF);
	ttfList[0].setString(LGG("exp") + ":");
	ttfList[1].setString(itemData.exp + " ");
	//其它
	var idx = 2;
	for (var p in itemData.properties) {
		if (itemData.properties[p] === undefined)
			continue;
		if (itemData.properties[p] === null)
			continue;
		if (itemData.properties[p] === 0)
			continue;

		ttfList[idx] = copyMinTTF(templateTTF);
		ttfList[idx + 1] = copyMinTTF(templateTTF);

		ttfList[idx].setString(LGG(p) + ":");
		ttfList[idx + 1].setString(itemData.properties[p] + "\t");
		idx += 2;
	}
	var startPos = cc.p(0, 0);
	for (var i = 0; i < ttfList.length; i++) {
		retBatch.addChild(ttfList[i]);
		ttfList[i].setColor(i % 2 === 0 ? cc.c3(255, 128, 64) : cc.c3(128, 255, 128));
		ttfList[i].setPosition(cc.p(startPos.x, startPos.y));
		startPos.x += ttfList[i].getContentSize().width;
	}

	// item
	var itemArray = [];

	for(var i = 0; i < (itemData.items.length) && (i < 3); i++) {
		if(diKuangArray[i] != undefined)
			diKuangArray[i].setVisible(true);
		itemNameArray[i].setVisible(true);
		var itemDataObj = rpgGame.getData().find(dataKey.itemTable, itemData.items[i].itemId);
		itemArray[i] = BTG.ProxySprite.create("res/icon/" + itemDataObj.iconId + ".jpg",
		templateTTF.getParent(), itemPosArray[i], 9999);
		itemNameArray[i].setString(itemDataObj.name);
	}

	var ret = new Object();
	ret.TTF = retBatch;
	ret.ItemIconArray = itemArray;
	return ret;
}

function CDlgSpeak() {
	BTG.DlgBase.call(this, this); //继承属性
	this.m_pCurNpc = 0;
	this.MaxButNums = 3;
	this.m_ctrlNameTTF = 0;
	this.m_ctrlTextTTF = 0;
	this.m_ctrlBtnList = new Array(this.MaxButNums);
	this.m_ctrlBtnText = new Array(this.MaxButNums);

	this.m_ctrlJLItemPos = new Array(this.MaxButNums);
	this.m_ctrlJLTTF = 0; //奖励标题
	this.m_ctrlJLTemplate = 0; //奖励文字
	this.m_batchJLTTF = null;
	this.m_batchJLIcon = null;
	this.m_batchJLIconNameTTF = [];

	this.m_bIsChildMenu = false;
	this.m_pNpcPos = null;
	this.m_pNpcHeadImage = null;
};

CDlgSpeak.prototype = new BTG.DlgBase(); //继承方法
CDlgSpeak.prototype.hideAll = function () {
	if (this.m_batchJLTTF)
		this.m_pRoot.removeChild(this.m_batchJLTTF, true);
	this.m_batchJLTTF = null;
	if (this.m_batchJLIcon) {
		for (var i = 0; i < this.m_batchJLIcon.length; i++)
			this.m_pRoot.removeChild(this.m_batchJLIcon[i], true);
		this.m_batchJLIcon = null;
	}

	for (var i = 0; i < this.MaxButNums; i++) {
		this.m_ctrlBtnList[i].setVisible(false);
		this.m_ctrlBtnText[i].setVisible(false);
		this.m_batchJLIconNameTTF[i].setVisible(false);
		this.find(5550 + i).setVisible(false);
	}
	this.m_ctrlJLTTF.setVisible(false);
}
CDlgSpeak.prototype.setNpcGNBtn = function (npcData, btnIndex) {
	if (npcData == null)
		return;
	this.m_ctrlBtnList[btnIndex].setVisible(true);
	this.m_ctrlBtnText[btnIndex].setVisible(true);
	this.m_ctrlBtnList[btnIndex].setUserData(npcData);
	this.m_ctrlBtnText[btnIndex].setString(npcData.npcOptions[0].text);
	this.m_ctrlBtnText[btnIndex].setColor(cc.c3(255, 255, 255));
}
CDlgSpeak.prototype.flashUi = function (taskObj) {//taskObj 第一级菜单
	var line = 26;
	this.m_ctrlNameTTF.setString(this.m_pCurNpc.getName());
	var taskSystem = rpgGame.getClientRole().getTaskSystem();

	var taskDataNpc = taskSystem.getNpc(this.m_pCurNpc.getID());
	if (taskDataNpc === undefined || taskDataNpc.options_.length == 0) {
		var npcIni = rpgGame.getGameData().getNpcFile(this.m_pCurNpc.getID());
		this.m_ctrlTextTTF.setString(addEnterToString(npcIni.npcText.toString(), line));
		this.setNpcGNBtn(this.m_pCurNpc.m_npcData, 0);
		return;
	}

	//获取描述文字，第一级是NPC对话， 第二级才是任务描述
	if (taskObj === null) {
		var npcIni = rpgGame.getGameData().getNpcFile(this.m_pCurNpc.getID());
		this.m_ctrlTextTTF.setString(addEnterToString(npcIni.npcText.toString(), line));
		var taskOptionsArray = taskDataNpc.options_;
		for (var i = 0; i < this.MaxButNums; i++) {
			if (i < taskOptionsArray.length) {
				this.m_ctrlBtnList[i].setVisible(true);
				this.m_ctrlBtnText[i].setVisible(true);
				this.m_ctrlBtnList[i].setUserData(taskOptionsArray[i]);
				this.m_ctrlBtnText[i].setString(taskOptionsArray[i].taskData.name + TaskDbToStr(taskOptionsArray[i].taskDb));
				this.m_ctrlBtnText[i].setColor(cc.c3(255, 255, 255));
			}
		}
		this.m_ctrlJLTTF.setVisible(false);
		if (taskOptionsArray.length < this.MaxButNums)
			this.setNpcGNBtn(this.m_pCurNpc.m_npcData, taskOptionsArray.length);

	} else {
		if (taskObj.taskDb === undefined)
			this.m_ctrlTextTTF.setString(addEnterToString(taskObj.taskData.acceptText, line));
		else
			this.m_ctrlTextTTF.setString(addEnterToString(taskObj.taskData.finishText, line));

		//设置按钮
		this.m_ctrlBtnList[0].setUserData(taskObj);
		this.m_ctrlBtnList[0].setVisible(true);
		this.m_ctrlBtnText[0].setVisible(true);
		this.m_ctrlBtnText[0].setString(TaskDbToBtnStr(taskObj.taskDb));
		if (taskObj.taskDb === undefined || taskObj.taskDb.done) {
			this.m_ctrlBtnText[0].setColor(cc.c3(0, 255, 0));
		} else {
			this.m_ctrlBtnText[0].setColor(cc.c3(255, 255, 255));
		}

		this.m_ctrlJLTTF.setVisible(true);

		//设置任务奖励
		var jiangliPackId = taskObj.taskData.baseOddsId;

		var diKuang = [this.find(5550), this.find(5551), this.find(5552)];
		var ret = CreateTaskAwardTTF(this.m_ctrlJLTemplate, jiangliPackId, this.m_ctrlJLItemPos, this.m_batchJLIconNameTTF, diKuang);
		this.m_batchJLTTF = ret.TTF;
		this.m_batchJLIcon = ret.ItemIconArray;
	}
}
CDlgSpeak.prototype.onShow = function (bIsShow, pNpc) {
	this.m_pCurNpc = pNpc;
	this.hideAll();
	if (this.m_pNpcHeadImage) {
		rpgGame.getCharacterUtil().delForObject(this.m_pNpcHeadImage);
		this.m_pNpcHeadImage = null;
	}
	if (bIsShow === false) {
		this.m_bIsChildMenu = false;
		return;
	}
	if (typeof param === "string") { //临时使用
		this.find(4789).setString(pNpc);
		return;
	}

	this.m_pNpcHeadImage = rpgGame.getCharacterUtil().createUICharacter(
		this.m_pCurNpc.getResID(),
		this.m_pNpcPos, undefined, this.m_pRoot
	);

	this.flashUi(null);
}
CDlgSpeak.prototype.onButtonDown = function (pSend) {
	var taskObj = pSend.getUserData();
	var npdData = taskObj;
	if (npdData.npcOptions != undefined) {
		var pubSystem = rpgGame.getClientRole().getBarSystem();
		if (pubSystem.bar_.inProgress === false)
			rpgGame.getUIUtil().add("DlgPub");
		else
			rpgGame.getUIUtil().add("DlgPubGame");

		this.show(false);
		return;
	}
	if (this.m_bIsChildMenu === false) {
		this.m_bIsChildMenu = true;
		this.flashUi(taskObj);
	} else {
		var taskState = "yijie";
		if (taskObj.taskDb) {
			if (taskObj.taskDb.done === true)
				taskState = "wancheng";
		} else
			taskState = "kejie";

		var taskSystem = rpgGame.getClientRole().getTaskSystem();
		var hylinkType = "goalText";
		switch (taskState) {
			case "kejie":
				taskSystem.acceptTask(taskObj.taskData.resId);
				hylinkType = "goalText";
				rpgGame.getFilm().setTaskFilm("jie", taskObj.taskData);
				break;
			case "wancheng":
				hylinkType = "no";
				taskSystem.preHandOverTask(taskObj.taskData.resId);
				rpgGame.getFilm().setTaskFilm("wancheng", taskObj.taskData);
				break;
		}

		//设置超链接导航
		if (rpgGame.getFilm().isRunFilm() === false) {
			if (hylinkType !== "no") {
				var hylinkStr = taskObj.taskData[hylinkType];
				var hylinkObj = BTG.HyperLink.getHylinkData(hylinkStr);
				//新任务如果是导航到当前NPC，等待服务器消息再导航
				if (hylinkObj.hylinkType === "npc" && parseInt(hylinkObj.hylinkData) === this.m_pCurNpc.getID()) {
					this.m_pCurNpc.m_bIfFlashOpenTaskDlg = 2;
				} else {//其它NPC才导航
					rpgGame.getUIUtil().addNavigation(hylinkObj.hylinkType, hylinkObj.hylinkData);
					this.show(false);
					return;
				}
			} else {
				this.m_pCurNpc.m_bIfFlashOpenTaskDlg = 2;
			}
		}
		this.show(false);
	}
}

CDlgSpeak.prototype.onCreateFinal = function () {
	var pNpcHead = this.find(4788);
	this.m_pNpcPos = pNpcHead.getPosition();
	this.m_pRoot.removeChild(pNpcHead, true);
	this.m_ctrlJLTTF = this.find(5182);
	this.m_ctrlJLTemplate = this.find(5183);
	this.m_ctrlNameTTF = this.find(5201);
	this.m_ctrlTextTTF = this.find(4789);
	this.m_ctrlNameTTF.setColor(cc.c3(0, 255, 0));
	this.m_ctrlTextTTF.setColor(cc.c3(255, 128, 64));
	this.m_ctrlJLTemplate.setVisible(false);
	for (var i = 0; i < this.MaxButNums; i++) {
		this.m_batchJLIconNameTTF[i] = this.find(5192 + i);
		this.m_ctrlBtnList[i] = this.findButton(5202 + i);
		this.m_ctrlBtnText[i] = this.find(5176 + i);
		var item = this.find(5179 + i);
		this.m_ctrlJLItemPos[i] = item.getPosition();
		this.m_pRoot.removeChild(item, true);
	}
}