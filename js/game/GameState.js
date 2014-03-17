(function(BTG) {
	//游戏状态ID
	BTG.GS_Disconnect = -1; //掉线
	BTG.GS_WaitConnectLoginSever = 0; //等待连接登录服务器
	BTG.GS_WaitConnectGameSever = 2; // 等待连接游戏服务器
	BTG.GS_ConnetSuccess = 3; //
	BTG.GS_CreateActor = 4; //创建角色
	BTG.GS_GameRun = 5; //运行游戏


	//游戏状态
	BTG.GameState = function(rpgGame) {
		this.m_rpgGame = rpgGame;
		this.m_gameState = BTG.GS_WaitConnectLoginSever;
	}

	BTG.GameState.prototype.setState = function (GS_type) {
		cc.log("gamestate:" + GS_type);
		this.m_gameState = GS_type;
		switch (this.m_gameState) {
			case BTG.GS_GameRun:
				this.m_rpgGame.getUIUtil().add("DlgMainUI_LT");
				this.m_rpgGame.getUIUtil().add("DlgMainUI_LB");
				this.m_rpgGame.getUIUtil().add("DlgMainUI_RB");
				this.m_rpgGame.getUIUtil().add("DlgMainUI_RT");
				break;
		}
	}

	BTG.GameState.prototype.getState = function (GS_type) {
		return this.m_gameState;
	}
})(BTG);