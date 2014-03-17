(function(BTG) {
	BTG.MainPlayer = function() {
		BTG.CharacterBase.call(this, this); //继承属性
		this.m_loginName = "";
		this.m_serverData = null;
		this.m_clientRole = null;
		this.m_pCurNpc = null;

	};
	BTG.MainPlayer.prototype = new BTG.CharacterBase(); //继承方法

	BTG.CharacterBase.prototype.getClientRole = function () {
		return this.m_clientRole;
	}
	BTG.CharacterBase.prototype.setClientRole = function (clientRole) {
		this.m_clientRole = clientRole;
	}

	BTG.MainPlayer.prototype.onUpdate = function (ftime) {
		if (this.m_isMove == false)
			return;

		rpgGame.getGameScene().updateBk(this.getPosition().x, this.getPosition().y);
	}
	BTG.MainPlayer.prototype.onSetPosition = function (vPos) {
		rpgGame.getGameScene().updateBk(vPos.x, vPos.y);
	}
	BTG.MainPlayer.prototype.touchBegin = function (tTouchScenePos) {
		if (this.isLockZorder)
			return;
		var _targetPos = cc.p(tTouchScenePos.x, tTouchScenePos.y);

		if (!rpgGame.getGameScene().inScene(_targetPos))
			return false;

		var orgPos = this.getPosition();
		var dDistance = P2PDisNoSQ(orgPos, _targetPos);
		if (dDistance < 20 * 20)
			return true;
		this.setMoveTarget(_targetPos);

		return true;
	}
	BTG.MainPlayer.prototype.onCreate = function () {
		
	}
	BTG.MainPlayer.prototype.onSetMoveTarget = function (vPos) {
		rpgGame.getSocketUtil().sendMessage("rolePosition", {
			x: vPos.x,
			y: vPos.y
		});
		rpgGame.getUIUtil().stopNavigation();
		rpgGame.getEffectUtil().add("arrow1.json", rpgGame.getGameScene().getSceneRoot(), getGameZOrder(BTG.GZOrder_Effect), vPos);
		this.m_pCurNpc = null;
	}
	BTG.MainPlayer.prototype.onStop = function () {
		this.setAction(BTG.CA_Stand);

		rpgGame.getGameScene().playerMoveStop(this.getPosition());

		if (this.m_pCurNpc) {
			rpgGame.getUIUtil().add("DlgSpeak", this.m_pCurNpc);
			this.m_pCurNpc = 0;
		}
	}
	BTG.MainPlayer.prototype.setNpcSpeak = function (pNpc) {
		var newPos = pNpc.getPosition();
		newPos.y -= 50;
		this.setMoveTarget(newPos);
		this.m_pCurNpc = pNpc;
	}
})(BTG);