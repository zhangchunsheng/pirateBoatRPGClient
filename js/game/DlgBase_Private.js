(function(BTG) {
	BTG.DlgBase._modelDlg = [];
	BTG.DlgBase.getCurModel = function () {
		if (BTG.DlgBase._modelDlg.length == 0)
			return null;
		return BTG.DlgBase._modelDlg[BTG.DlgBase._modelDlg.length - 1];
	}
	BTG.DlgBase.prototype._isHasTouch = function () {
		return this.m_uiAttr.bHasTouch;
	}

	BTG.DlgBase.isCanInput = function (ui_pRoot) {
		if (rpgGame.isLockGame())
			return false;
		var pCurModel = BTG.DlgBase.getCurModel();
		if (pCurModel === null)
			return true;

		if (pCurModel.m_pRoot === ui_pRoot)
			return true;

		if (pCurModel.m_uiAttr.childWindowList_DlgBase !== null) {
			for (var i = 0; i < pCurModel.m_uiAttr.childWindowList_DlgBase.length; i++) {
				if (pCurModel.m_uiAttr.childWindowList_DlgBase[i].m_pRoot === ui_pRoot)
					return true;
			}
		}

		return false;
	}
	BTG.DlgBase.prototype._getZOrder = function () {
		if (this.m_pRoot === null)
			return BTG._zorderUI;
		return this.m_pRoot.getZOrder();
	}
	BTG.DlgBase.prototype._posForType = function () {//根据停靠类型与initPos 设置位置
		var basePos = rpgGame.getSystem().getBasePos(this.m_centerType);
		return cc.p(this.m_pRootInitPos.x + this.m_uiAttr.pos.x + basePos.x, this.m_pRootInitPos.y + this.m_uiAttr.pos.y + basePos.y);
	}
	BTG.DlgBase.prototype._windowSizeChange = function () {
		if (this.m_isLoadFinal === false)
			return;

		this.m_pRoot.setPosition(this._posForType());
	}
	BTG.DlgBase.prototype._del = function () {
		for (var i = 0; i < this.m_msgSet.length; i++)
			rpgGame.getMsg()._del(this.m_msgSet[i]);

		this.m_parNode.removeChild(this.m_pRoot, true);
		this.m_pRoot = 0;
	}

	BTG.DlgBase.prototype._buttonDown = function (pSender) {
		if (BTG.DlgBase.isCanInput(this.m_pRoot) == false) {
			return;
		}
		if (rpgGame.getGameScene().isHasLoad())
			return;
		if (pSender.isVisible() === false)
			return;
		if (pSender.getTag() === BTG.DefineTag_Close) {//默认关闭按钮
			this.show(false);
			return;
		}
		this.onButtonDown(pSender);
	}

	BTG.DlgBase.prototype._createFinal = function (menuNodeObj) {
		this.m_pRootInitPos = this.m_pRoot.getPosition();
		this.m_pMenu = menuNodeObj;

		this.m_centerType = this.m_pRoot.getTag();
		this.m_isLoadFinal = true;
		this._windowSizeChange();
		this.onCreateFinal(this.m_tempParam);

		//处理 消息缓存
		if (this.m_messageCache != null) {
			for (var i = 0; i < this.m_messageCache.length; i++) {
				this._message(this.m_messageCache[i]);
			}
			this.m_messageCache = null;
		}

		this.show(this.m_lastShowState, this.m_tempParam);
		if (this.m_uiAttr.bHasTouch)
			rpgGame.m_pLoadImage.end();
	}

	BTG.DlgBase.prototype._create = function (createId, uiLayoutFile, param0_n_array, isShow) {
		this.m_lastShowState = isShow;
		this.m_fileName = uiLayoutFile;
		cc.log("create dlg " + createId);
		this.m_uiAttr = this.onGetUIAttr();
		if (this.m_uiAttr.bHasTouch)
			rpgGame.m_pLoadImage.begin();
		this.m_pRoot = cc.Node.create();

		this.m_parNode = this.m_uiAttr.pParentNode;
		this.m_parNode.addChild(this.m_pRoot, this.m_uiAttr.zOrder);

		this.m_createId = createId;
		this.m_tempParam = param0_n_array;
		//公共的创建代码，比如加载
		LoadUILayout(uiLayoutFile, this);

	}
	BTG.DlgBase.prototype._message = function (msg_param_array) {
		if (this.isLoadFinal() === false) {
			if (this.m_messageCache === null)
				this.m_messageCache = new Array();

			this.m_messageCache[this.m_messageCache.length] = msg_param_array;
			return;
		}
		this.onMessage(msg_param_array);
	}

	BTG.DlgBase.prototype._touchBegin = function (touchPos) {
		this.onTouchBegin(touchPos);
	}
	BTG.DlgBase.prototype._update = function (ftime) {
		this.onUpdate(ftime);
	}

	BTG.DlgBase.prototype._touchMove = function (touchOffsetPos, vPos) {
		this.onTouchMove(touchOffsetPos, vPos);
	}
	BTG.DlgBase.prototype._touchEnd = function (touchPos) {
		this.onTouchEnd(touchPos);
	}

	BTG.DlgBase.prototype._touchTest = function (touchPos) {
		if (rpgGame.isLockGame())
			return false;
		if (BTG.DlgBase.getCurModel()) {
			if (this.m_uiAttr.bIsModel === false)
				return false;
			else {
				if (BTG.DlgBase.getCurModel() !== this)
					return false;
				else {
					this._touchBegin(touchPos);
					return true; //模态对话框处理所有的touch
				}
			}
		}
		if (ptInNode(touchPos, this.m_pRoot)) {
			this._touchBegin(touchPos);
			return true;
		}

		if (this.m_uiAttr.bIsClickExternClose === true) {
			this.show(false);
			return true;
		}
		return false;
	}
})(BTG);