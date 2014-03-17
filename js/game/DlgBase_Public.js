(function(BTG) {
	BTG.DlgBase.prototype.forceHide = function () {
		this.m_lastShowState = this.m_pRoot.isVisible();
		this.m_pRoot.setVisible(false);
	}
	BTG.DlgBase.prototype.recoveryForceHide = function () {
		this.m_pRoot.setVisible(this.m_lastShowState);

	}
	BTG.DlgBase.prototype.getID = function () {
		return this.m_createId;
	}

	BTG.DlgBase.prototype.setPosition = function (vPos) {
		this.m_pRoot.setPosition(cc.p(vPos.x, vPos.y));
	}
	BTG.DlgBase.prototype.getPosition = function () {
		return this.m_pRoot.getPosition();
	}
	BTG.DlgBase.prototype.setPositionForBase = function (vPos) {
		var basePos = rpgGame.getSystem().getBasePos(this.m_centerType);
		this.m_pRoot.setPosition(cc.p(basePos.x + vPos.x, basePos.y + vPos.y));
	}

	BTG.DlgBase.prototype.bindMsg = function (msgStr) {
		this.m_msgSet[this.m_msgSet.length] = msgStr;
		rpgGame.getMsg()._bind(this, msgStr);
	}
	BTG.DlgBase.prototype.findDel = function (tagArray) {
		for (var i = 0; i < tagArray.length; i++) {
			var child = this.find(tagArray[i]);
			if (child) {
				child.getParent().removeChild(child, true);
				child = null;
			}
		}
	}
	BTG.DlgBase.prototype.findButton = function (tag) {
		var ret = this.m_pMenu.getChildByTag(tag);
		if (ret == null) {
			assert(0 && (this.m_createId + ":tagID:" + tag + " not find:findButton()"));
		}
		return ret;
	}
	BTG.DlgBase.prototype.find = function (tag) {
		var ret = this.m_pRoot.getChildByTag(tag);
		if (ret == null) {
			assert(0 && (this.m_createId + ":tagID:" + tag + " not find:find()"));
		}
		return ret;
	}
	BTG.DlgBase.prototype.isLoadFinal = function () {
		return this.m_isLoadFinal;
	}

	BTG.DlgBase.prototype.show = function (bIsShow, param0_n) {
		this.m_lastShowState = bIsShow;
		if (this.isLoadFinal() === false)
			return;

		if (bIsShow === true) {
			if (this.m_uiAttr.bIsModel) {
				rpgGame.getUIUtil().enableMainUIMenu(false);
				var isHasModel = false;
				for (var i = 0; i < BTG.DlgBase._modelDlg.length; i++) {
					if (BTG.DlgBase._modelDlg[i] == this) {
						isHasModel = true;
						break;
					}
				}
				if (!isHasModel)
					BTG.DlgBase._modelDlg[BTG.DlgBase._modelDlg.length] = this;
			}
			if (this.m_parNode === null || this.m_pRoot === null)
				return;
			this.m_parNode.reorderChild(this.m_pRoot, ++BTG._zorderUI);
		} else {
			if (this.m_uiAttr.bIsModel) {
				rpgGame.getUIUtil().enableMainUIMenu(true);
				for (var i = 0; i < BTG.DlgBase._modelDlg.length; i++) {
					if (BTG.DlgBase._modelDlg[i] == this) {
						BTG.DlgBase._modelDlg.splice(i, 1);
						break;
					}
				}
			}
		}

		if (this.m_uiAttr.bIsOpenHideScene === true) {
			if (bIsShow)
				rpgGame.getCharacterUtil().setShowList([BTG.CharacterType_UI]);
			else
				rpgGame.getCharacterUtil().setShowList("all");
		}

		this.m_pRoot.setVisible(bIsShow);
		this.onShow(bIsShow, param0_n);
		if (bIsShow && this.m_uiAttr.bIsAutoScale)
			BTG.actionUtil.showWindow(this.m_pRoot, this._posForType());
	}

	BTG.DlgBase.prototype.isShow = function () {
		return this.m_pRoot.isVisible();
	}
})(BTG);