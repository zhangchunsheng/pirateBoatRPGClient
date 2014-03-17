(function(BTG) {
	function CreaterFactory() {
		this.m_createArray = new Object();

		this.isMulView = function (createID) {
			return this.m_createArray[createID][1] != null;
		}
		this.bind = function (createID, layoutFileName, funcPhoneViewCreate, funcPcViewCreate) {
			this.m_createArray[createID] = new Array(5);
			this.m_createArray[createID][0] = funcPhoneViewCreate;
			this.m_createArray[createID][1] = funcPcViewCreate;
			this.m_createArray[createID][2] = layoutFileName;
		}

		this.create = function (createID) {
			var v_View = 0;
			var v_FileName = 1;
			var retArray = new Array(2); //0视图 1逻辑 2文件名
			retArray[v_FileName] = this.m_createArray[createID][2];
			if (this.m_createArray[createID] == undefined) {
				cc.alert("[Error] not bind ui dlg id:" + createID);
			}
			if (this.m_createArray[createID][1] == null) {//共享
				retArray[v_View] = this.m_createArray[createID][0]();
			} else {
				if (rpgGame.getSystem().isPC()) {
					retArray[v_View] = this.m_createArray[createID][1]();
				} else {
					retArray[v_View] = this.m_createArray[createID][0]();
				}
			}
			return retArray;
		}
	};

	BTG.UIUtil = function() {
		this.m_pHylink = new BTG.HyperlinkUtil();
		this.m_curTouchDlg = null;
		this.m_curTouchPoint = cc.p(0, 0);
		this.m_uiArray = new Array();

		this.m_uiFactory = new CreaterFactory();

		this.m_uiFactory.bind("DlgLogin", "login.scene",
			function () {
				return new CDlgLogin();
			}, null
		);
		this.m_uiFactory.bind("DlgCreateRole", "chuangjianjuese.scene",
			function () {
				return new CDlgCreateCharacter();
			}, null
		);
		
		this.m_uiFactory.bind("DlgMainUI_LT", "main_leftTop.scene",//左上角
			function () {
				return new CDlgMainUI_LT();
			}, null
		);
		this.m_uiFactory.bind("DlgMainUI_LB", "main_leftBottom.scene",//左下角
			function () {
				return new CDlgMainUI_LB();
			}, null
		);
		this.m_uiFactory.bind("DlgMainUI_RT", "main_rightTop.scene",//右上角
			function () {
				return new CDlgMainUI_RT();
			}, null
		);
		this.m_uiFactory.bind("DlgMainUI_RB", "main_rightBottom.scene",//右下角
			function () {
				return new CDlgMainUI_RBForPhone();
			}, null //function () { return new CDlgMainUI_RBForPc(); }
		);

		this.m_uiFactory.bind("DlgSpeak", "ceshi.scene",
			function () {
				return new CDlgSpeak();
			}, null
		);
		this.m_uiFactory.bind("DlgBigMap", "daditu.scene",
			function () {
				return new CDlgBigMap();
			}, null
		);

		this.m_uiFactory.bind("DlgMinLevel", "zhangbuju.scene",
			function () {
				return new CDlgMinLevel();
			}, null
		);

		this.m_uiFactory.bind("DlgPackage", "beibao.scene",
			function () {
				return new CDlgPackage();
			}, null
		);

		this.m_uiFactory.bind("DlgSale", "chushou.scene",
			function () {
				return new CDlgSale();
			}, null
		);

		this.m_uiFactory.bind("DlgGoHome", "huicheng.scene",
			function () {
				return new CDlgGoHome();
			}, null
		);

		this.m_uiFactory.bind("DlgPackageItemTip", "tip.scene",
			function () {
				return new CDlgPackageItemTip();
			}, null
		);
		this.m_uiFactory.bind("DlgPlayerEditor", "yingxiong.scene",
			function () {
				return new CDlgPlayerEditor();
			}, null
		);
		this.m_uiFactory.bind("DlgPlayerEditorSubUI", "zhuangbei_fenye.scene",
			function () {
				return new CDlgPlayerEditorSubUI();
			}, null
		);
		this.m_uiFactory.bind("DlgPlayerEditorSubUI2", "zhuangbei_fenye2.scene",
			function () {
				return new CDlgPlayerEditorSubUI2();
			}, null
		);
		this.m_uiFactory.bind("DlgPlayerEditorSubUI3", "zhuangbei_fenye3.scene",
			function () {
				return new CDlgPlayerEditorSubUI3();
			}, null
		);
		this.m_uiFactory.bind("DlgNumberInput", "shiyong_shuliang.scene",
			function () {
				return new CDlgNumberInput();
			}, null
		);
		this.m_uiFactory.bind("DlgTask", "renwu.scene",
			function () {
				return new CDlgTask();
			}, null
		);
		this.m_uiFactory.bind("DlgHerosLayoutEditor", "buzhen.scene",
			function () {
				return new CDlgHerosLayoutEditor();
			}, null
		);
		this.m_uiFactory.bind("DlgConfirm", "queren.scene",
			function () {
				return new CDlgConfirm();
			}, null
		);
		this.m_uiFactory.bind("DlgFilmSpeak", "duihua.scene",
			function () {
				return new CDlgFilmSpeak();
			}, null
		);
		this.m_uiFactory.bind("DlgFightAward", "zhandoujiangli.scene",
			function () {
				return new CDlgFightAward();
			}, null
		);
		this.m_uiFactory.bind("DlgFightResult", "tongguan.scene",
			function () {
				return new CDlgFightResult();
			}, null
		);

		this.m_uiFactory.bind("DlgPub", "jiuguan1.scene",
			function () {
				return new CDlgPub();
			}, null
		);
		this.m_uiFactory.bind("DlgPubGame", "jiuguan2.scene",
			function () {
				return new CDlgPubGame();
			}, null
		);

		this.m_uiFactory.bind("DlgSkillItemTip", "tip_jineng.scene",
			function () {
				return new CDlgSkillItemTip();
			}, null
		);
		this.m_uiFactory.bind("DlgHerosStarEditor", "jiangxing_kuang.scene",
			function () {
				return new CDlgHerosStarEditor();
			}, null
		);
		this.m_uiFactory.bind("DlgHerosStarLayout", "jiangxing1.scene",
			function () {
				return new CDlgHerosStarLayout();
			}, null
		);
	};
	BTG.UIUtil.prototype.enableMainUIMenu = function (isEnable) {
		var arr = ["DlgMainUI_LT", "DlgMainUI_LB", "DlgMainUI_RT", "DlgMainUI_RB"];
		for (var i = 0; i < arr.length; i++) {
			var pDlg = this.find(arr[i]);
			if (pDlg.m_pMenu) {
				pDlg.m_pMenu.setEnabled(isEnable);
			}
		}
	}
	BTG.UIUtil.prototype.forceHideAll = function () {
		for (var i = 0; i < this.m_uiArray.length; i++)
			this.m_uiArray[i].forceHide();
	}

	BTG.UIUtil.prototype.recoveryForceHideAll = function () {
		for (var i = 0; i < this.m_uiArray.length; i++)
			this.m_uiArray[i].recoveryForceHide();
	}
	BTG.UIUtil.prototype.find = function (szCreateId) {
		for (var i = 0; i < this.m_uiArray.length; i++) {
			if (szCreateId == this.m_uiArray[i].getID())
				return this.m_uiArray[i];
		}
		return null;
	}
	BTG.UIUtil.prototype.hidePopDlg = function () {
		for (var i = 0; i < this.m_uiArray.length; i++) {
			if (this.m_uiArray[i].m_uiAttr.bHasTouch)
				if (this.m_uiArray[i].isShow())
					this.m_uiArray[i].show(false);
		}
	}
	BTG.UIUtil.prototype.DlgHide = function (szCreateID) {
		dlgObj = this.find(szCreateID);
		dlgObj && dlgObj.show(false);
	}

	BTG.UIUtil.prototype.del = function (szCreateId) {
		for (var i = 0; i < this.m_uiArray.length; i++) {
			if (szCreateId == this.m_uiArray[i].getID()) {
				this.m_uiArray[i].del();
				this.m_uiArray.splice(i, 1);
				return;
			}
		}
	}

	BTG.UIUtil.prototype.update = function (ftime) {
		this.m_pHylink.update(ftime);
		for (var i = this.m_uiArray.length - 1; i >= 0; --i) {
			if (this.m_uiArray[i].isLoadFinal() === false)
				continue;
			if (this.m_uiArray[i].isShow() === false)
				continue;
			this.m_uiArray[i]._update(ftime);
		}
	}
	BTG.UIUtil.prototype.DlgTouch = function (vPos) {
		for (var i = this.m_uiArray.length - 1; i >= 0; --i) {
			if (this.m_uiArray[i].isLoadFinal() === false)
				continue;
			if (this.m_uiArray[i].isShow() === false)
				continue;
			if (this.m_uiArray[i]._isHasTouch() === false)
				continue;
			if (this.m_uiArray[i]._touchTest(vPos))
				return this.m_uiArray[i];
		}
		return null;
	}
	BTG.UIUtil.prototype.getNavigation = function () {
		return this.m_pHylink.m_pNavigation;
	}
	BTG.UIUtil.prototype.addNavigation = function (hylinkType, htlinkData) {
		this.m_pHylink.m_pNavigation.to(hylinkType, htlinkData);
	}
	BTG.UIUtil.prototype.stopNavigation = function () {
		this.m_pHylink.m_pNavigation.stop();
	}
	BTG.UIUtil.prototype.getHylink = function () {
		return this.m_pHylink;
	}
	BTG.UIUtil.prototype.touchBegin = function (vPos) {
		if (this.m_pHylink.touchBegin(vPos))
			return true;
		this.m_curTouchDlg = this.DlgTouch(vPos);
		if (this.m_curTouchDlg !== null) {
			this.m_curTouchPoint = vPos;
			return true;
		} else return false;
	}
	BTG.UIUtil.prototype.touchMove = function (vPos) {
		if (this.m_curTouchDlg == null)
			return false;
		var offsetPos = cc.p(vPos.x - this.m_curTouchPoint.x, vPos.y - this.m_curTouchPoint.y);
		this.m_curTouchPoint.x = vPos.x;
		this.m_curTouchPoint.y = vPos.y;
		this.m_curTouchDlg._touchMove(offsetPos, vPos);
		return true;
	}
	BTG.UIUtil.prototype.touchEnd = function (vPos) {
		if (this.m_curTouchDlg == null)
			return false;
		this.m_curTouchDlg._touchEnd(vPos);
		this.m_curTouchDlg = null;
		return true;
	}

	function comZorderDlg(dlg1, dlg2) {
		if (dlg1._getZOrder() < dlg2._getZOrder())
			return -1;
		else if (dlg1._getZOrder() > dlg2._getZOrder())
			return 1;
		else
			return 0;
	}
	BTG.UIUtil.prototype.add = function (tCreateID, param0_n, bIsShow) {
		var isShow = bIsShow === undefined ? true : bIsShow;
		for (var i = 0; i < this.m_uiArray.length; i++) {
			if (this.m_uiArray[i].getID() == tCreateID) {
				this.m_uiArray[i].show(isShow, param0_n);
				return this.m_uiArray[i];
			}
		}

		var findIndex = this.m_uiArray.length;

		var view_layoutFileName = this.m_uiFactory.create(tCreateID);
		var layoutFileName = view_layoutFileName[1];
		var bIsMulView = this.m_uiFactory.isMulView(tCreateID);
		var fileName = "";

		if (bIsMulView == false || rpgGame.getSystem().isPC() == false) {
			fileName = "res/l/" + layoutFileName;
		} else {
			fileName = "res/lp/" + "p_" + layoutFileName;
		}
		this.m_uiArray[findIndex] = view_layoutFileName[0];
		this.m_uiArray[findIndex]._create(tCreateID, fileName, param0_n, isShow);
		this.m_uiArray.sort(comZorderDlg);

		return this.m_uiArray[findIndex];
	}

	BTG.UIUtil.prototype.windowSizeChange = function () {
		for (var i = 0; i < this.m_uiArray.length; i++) {
			this.m_uiArray[i]._windowSizeChange();
		}
	}
})(BTG);