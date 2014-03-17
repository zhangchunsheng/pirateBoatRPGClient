(function(BTG) {
	BTG.RPGGame = function() {
		this.m_pSocket = null;
		this.m_pGameData = new BTG.GameData();

		this.m_pGameRoot = null;
		this.m_pLoadingBar = null;
		this.m_pLoadImage = null;
		this.m_pGameScene = null;
		this.m_pCharacterActionUtil = null;
		this.m_pCharacterUtil = null;
		this.m_pEffectUtil = null;

		this.m_pUIUtil = null;
		this.m_pDebugStr = null;
		this.m_pSystem = null;
		this.m_pFilm = null;
		this.m_pMsg = new BTG.Message();
		this.m_pMgrState = new BTG.GameState(this);
		this.m_resPreLoad = new BTG.PreLoadSingleRes2SingleFun();

		this.m_pItemDataUtil = new BTG.ItemDataUtil();
		this.m_pMgrData = null;

		this.m_nLockGame = 0;

		this.m_clientRole = null;
		this.m_pCache = new BTG.ActionImageCache();
	};
	BTG.RPGGame.prototype.getCache = function () {
		return this.m_pCache;
	}
	BTG.RPGGame.prototype.lockGame = function () {
		this.m_nLockGame++;
		cc.log("lock+" + this.m_nLockGame);
	}

	BTG.RPGGame.prototype.unlockGame = function () {
		this.m_nLockGame--;
		if(this.m_nLockGame < 0)
			this.m_nLockGame = 0;
	}
	BTG.RPGGame.prototype.isLockGame = function () {
		return this.m_nLockGame > 0;
	}
	BTG.RPGGame.prototype.createData = function () {
		this.m_pMgrData = require("/game/dataMgr").dataMgr;
		dataMgr = this.m_pMgrData;
		dataKey = require("/game/dataMgr").dataKey;
		dataMgr.loadFiles();
		var pThis = this;

		this.lockGame();
		dataMgr.on("fileDone", function () {
			pThis.unlockGame();
		});
	}

	BTG.RPGGame.prototype.getData = function () {
		return this.m_pMgrData;
	}
	BTG.RPGGame.prototype.preLoadRes = function (fileName, callbackFun, callbackObj) {
		this.m_resPreLoad.preImage(fileName, callbackFun, callbackObj);
	}

	BTG.RPGGame.prototype.setGameState = function (game_state) {
		this.m_pMgrState.setState(game_state);

	}
	BTG.RPGGame.prototype.getGameState = function () {
		return this.m_pMgrState.getState();
	}

	var tImage = new Array();

	BTG.RPGGame.prototype.init = function (gameRoot) {
		this.createData();
		this.m_pSystem = new BTG.System();
		this.m_pSystem.init();
		this.m_pGameRoot = gameRoot;
		this.m_pLoadingBar = new LoadingText();
		this.m_pLoadImage = new LoadImage();
		this.m_pEffectUtil = new BTG.EffectUtil();
		this.m_pCharacterActionUtil = new BTG.CharacterActionUtil();
		this.m_pCharacterUtil = new BTG.CharacterUtil();
		this.m_pGameScene = new BTG.GameScene();

		this.m_pDebugStr = cc.LabelTTF.create("00.0", "Arial", 12);
		this.m_pGameRoot.addChild(this.m_pDebugStr, 9999);
		this.m_pDebugStr.setPosition(cc.p(500, 14));
		this.m_pGameData.init();
		this.m_pUIUtil = new BTG.UIUtil();

		//var createscene = function ()
		this.m_pFilm = new BTG.Film();
		rpgGame.getCharacterUtil().init(rpgGame.getGameScene().getSceneRoot());

		this.m_pSocket = new BTG.SocketUtil();

		//聊天部分
		if (cc.config.isApp == false) {
			showChatWindow(true);
			setChatWindowPos(0, BTG.windowSize.height);
		}
	}
	BTG.RPGGame.prototype.xDebug = function (strx) {
		if(this.m_pDebugStr)
			this.m_pDebugStr.setString(strx);
	}

	BTG.RPGGame.prototype.update = function (ftime) {
		this.m_pLoadImage.update(ftime);
		this.m_pLoadingBar.update(ftime);

		this.m_pFilm.update(ftime);

		this.m_pCharacterActionUtil.update(ftime);
		this.m_pCharacterUtil.update(ftime);
		this.m_pGameScene.update(ftime);
		this.m_pEffectUtil.update(ftime);
		this.m_pUIUtil.update(ftime);
	}
	BTG.RPGGame.prototype.touchBegin = function (vPos) {
		if(this.m_pUIUtil.touchBegin(vPos))
			return true;
		if(this.isLockGame())
			return true;
		if(this.getGameState() != BTG.GS_GameRun)
			return true;
		if(this.m_pFilm.isRunFilm())
			return true;

		if(this.m_pGameScene.isHasLoad() == true)
			return true;
		if(this.m_pGameScene.isFighting())
			return true;
		this.m_pCharacterUtil.touchBegin(vPos);
	}
	BTG.RPGGame.prototype.touchMove = function (vPos) {
		this.m_pUIUtil.touchMove(vPos);
	}
	BTG.RPGGame.prototype.touchEnd = function (vPos) {
		this.m_pUIUtil.touchEnd(vPos);
	}
	BTG.RPGGame.prototype.getFilm = function () {
		return this.m_pFilm;
	}

	BTG.RPGGame.prototype.getMsg = function () {
		return this.m_pMsg;
	}

	BTG.RPGGame.prototype.getSocketUtil = function () {
		return this.m_pSocket;
	}

	BTG.RPGGame.prototype.getMainPlayer = function () {
		return this.m_pCharacterUtil.getMainPlayer();
	}

	BTG.RPGGame.prototype.getSystem = function () {
		return this.m_pSystem;
	}

	BTG.RPGGame.prototype.getEffectUtil = function () {
		return this.m_pEffectUtil;
	}

	BTG.RPGGame.prototype.getCharacterUtil = function () {
		return this.m_pCharacterUtil;
	}
	BTG.RPGGame.prototype.getCharacterActionUtil = function () {
		return this.m_pCharacterActionUtil;
	}
	BTG.RPGGame.prototype.getGameScene = function () {
		return this.m_pGameScene;
	}
	BTG.RPGGame.prototype.getGameRoot = function () {
		return this.m_pGameRoot;
	}
	BTG.RPGGame.prototype.getLoadingBar = function () {
		return this.m_pLoadingBar;
	}
	BTG.RPGGame.prototype.getUIUtil = function () {
		return this.m_pUIUtil;
	}

	BTG.RPGGame.prototype.getGameData = function () {
		return this.m_pGameData;
	}

	BTG.RPGGame.prototype.getItemDataUtil = function () {
		if (this.m_clientRole) {
			this.m_pItemDataUtil.init();
			return this.m_pItemDataUtil;
		} else {
			console.log("clientRole is null");
			return null;
		}
	}
	BTG.RPGGame.prototype.getClientRole = function () {
		return this.m_clientRole;
	}
	BTG.RPGGame.prototype.setClientRole = function (clientRole) {
		this.m_clientRole = clientRole;
		clientRole.on("change:silver", function (gameid) {
			var pDlg = rpgGame.getUIUtil().find("DlgMainUI_LT");
			pDlg && pDlg.flash();
		});
		clientRole.on("change:army", function (gameid) {
			var pDlg = rpgGame.getUIUtil().find("DlgMainUI_LT");
			pDlg && pDlg.flash();
		});

		var heroSystem = this.m_clientRole.getHeroSystem();
		heroSystem.on("expChange", function (gameid) {
			if (gameid !== rpgGame.m_pCharacterUtil.getMainPlayer().getID())
				return;
			var pDlg = rpgGame.getUIUtil().find("DlgMainUI_LT");
			pDlg && pDlg.flash();

			pDlg = rpgGame.getUIUtil().find("DlgMainUI_RB");
			pDlg && pDlg.flashExp();

		});
		heroSystem.on("levelChange", function (gameid) {
			if (gameid !== rpgGame.m_pCharacterUtil.getMainPlayer().getID())
				return;
			rpgGame.getEffectUtil().add("lev.json", rpgGame.getGameScene().getSceneRoot(),
			BTG.GZOrder_Effect, rpgGame.getMainPlayer().getPosition());

			var pDlg = rpgGame.getUIUtil().find("DlgMainUI_LT");
			pDlg && pDlg.flash();
		});
	}
})(BTG);