(function(BTG) {
	BTG.Npc = function() {
		BTG.CharacterBase.call(this, this); //继承属性
		this.m_taskHeadState = "no";

		this.m_curHeadSpr = null;
		this.m_bIfFlashOpenTaskDlg = 0;

		this.m_npcData = null;
	};

	BTG.Npc.prototype = new BTG.CharacterBase(); //继承方法

	BTG.Npc.prototype.touchBegin = function (tTouchScenePos) {
		var isTouch = this.m_pImage.pointInRect(tTouchScenePos);
		if (this.m_curHeadSpr && !isTouch) {
			var screenPos = rpgGame.getGameScene().sceneToScreen(tTouchScenePos);
			isTouch = ptInNode(screenPos, this.m_curHeadSpr);
		}
		if (isTouch) {
			rpgGame.getMainPlayer().setNpcSpeak(this);
		}

		return isTouch;
	}
	BTG.Npc.prototype.flashHead = function () {
		var taskSystem = rpgGame.getClientRole().getTaskSystem();

		var npcTask = taskSystem.getNpc(this.getID());

		if (this.m_curHeadSpr !== null) {
			this.m_curHeadSpr.stopAllActions();
			this.m_curHeadSpr.getParent().removeChild(this.m_curHeadSpr, true);
			this.m_curHeadSpr = null;
		}

		if (npcTask === undefined || npcTask.options_.length === 0) {
			this.m_taskHeadState = "no";
			this.m_bIfFlashOpenTaskDlg--;
			this.setGNIcon();
			return;
		}
		var nState = npcTask.getHeadState();
		//cc.log(" npc change state:" + nState + " id" + this.getID());
		if (nState === 0) {
			this.m_taskHeadState = "wancheng";
		} else if (nState === 1) {
			this.m_taskHeadState = "kejie";
		} else if (nState === 2)
			this.m_taskHeadState = "yijie";
		else
			this.m_taskHeadState = "no";

		if (this.m_taskHeadState !== "no") {
			var pos = this.m_pImage.getHeadPosForNode();
			pos.y += 60;
			this.m_curHeadSpr = BTG.ProxySprite.create("res/icon/" + this.m_taskHeadState + ".png",
			this.m_pImage.m_pBatch, pos, BTG.GZOrder_Effect);
			var movedown = cc.MoveTo.create(0.5, cc.p(pos.x, pos.y - 10));
			var moveup = cc.MoveTo.create(0.5, cc.p(pos.x, pos.y));
			this.m_curHeadSpr.preAction(cc.RepeatForever.create(cc.Sequence.create(movedown, moveup)));
		}
		if (this.m_bIfFlashOpenTaskDlg > 0) {
			this.m_bIfFlashOpenTaskDlg = 0;
			if (this.m_taskHeadState !== "no")
				rpgGame.getMainPlayer().setNpcSpeak(this);
		}
		//没任务时显示功能NPC
		if (this.m_taskHeadState == "no") {
			this.setGNIcon();
		}
	}
	BTG.Npc.prototype.setGNIcon = function () {
		if (this.m_npcData) {
			var pos = this.m_pImage.getHeadPosForNode();
			pos.y += 60;
			this.m_curHeadSpr = BTG.ProxySprite.create(
				"res/icon/" + this.m_npcData.headIcon, this.m_pImage.m_pBatch, pos, BTG.GZOrder_Effect
			);

			var movedown = cc.MoveTo.create(0.5, cc.p(pos.x, pos.y - 10));
			var moveup = cc.MoveTo.create(0.5, cc.p(pos.x, pos.y));
			this.m_curHeadSpr.preAction(cc.RepeatForever.create(cc.Sequence.create(movedown, moveup)));
		}
	}
	BTG.Npc.prototype.onResLoad = function () {
		this.m_npcData = rpgGame.getData().find(dataKey.npcTable, this.getID());
		if (this.m_npcData.npcOptions.length == 0)
			this.m_npcData = null;
		this.flashHead();
	}
})(BTG);