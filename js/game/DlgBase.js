(function(BTG) {
	//派生类型可以修改UIAttr，改变对话框的行为
	BTG._zorderUI = BTG.GZOrder_UI;

	BTG.UIAttr = function() {
		this.pParentNode = rpgGame.getGameRoot();
		this.pos = cc.p(0, 0); // 初始偏移位置
		this.zOrder = ++BTG._zorderUI; //层
		this.bHasTouch = true; //接受触摸，可以穿透的对话框
		this.bIsClickExternClose = false; //点击外部关闭对话框
		this.bIsOpenHideScene = false; //打开界面时隐藏游戏场景
		this.bIsTransfromTTF = true; //是否转换 文字标记
		this.bIsModel = false; //模态对话框
		this.bIsAutoScale = false; //是否自动缩放
		this.childWindowList_DlgBase = null; //模态窗口模式下，子窗口依然可以接到消息
	}

	BTG.DlgBase = function() {
		this.m_ownerDlg = null;
		this.m_pRoot = null;
		this.m_pRootInitPos = null;
		this.m_pMenu = null;
		this.m_centerType = 1;
		this.m_createId = null;
		this.m_isLoadFinal = false;
		this.m_messageCache = null; //消息缓存 如果还没加载完成，暂时缓存
		this.m_msgSet = new Array(); //消息集
		this.m_uiAttr = null;
		this.m_parNode = null;
		this.m_tempParam = null;
		this.m_fileName = 0;
		this.m_lastShowState = true;
	};
	BTG.DlgBase.prototype.getID = function () {
		return this.m_createId;
	}
	//覆盖OnSetUIAttr 修改对话框属性
	BTG.DlgBase.prototype.onGetUIAttr = function () {
		return new BTG.UIAttr();
	}

	//派生覆盖的 创建函数 (资源加载完成)
	BTG.DlgBase.prototype.onCreateFinal = function (param_0) {}

	//派生类覆盖此函数，接受消息  [0]:消息ID   [1～ N] 参数
	BTG.DlgBase.prototype.onMessage = function (msg_param0_n_array) {}

	BTG.DlgBase.prototype.onButtonDown = function (pSend) {}
	BTG.DlgBase.prototype.onShow = function (bIsShow, param0_n) {}

	BTG.DlgBase.prototype.onTouchBegin = function (touchPos) {}; //{ cc.log("click"); }
	BTG.DlgBase.prototype.onTouchMove = function (touchOffsetPos, touchPos) {}
	BTG.DlgBase.prototype.onTouchEnd = function (touchPos) {}
	BTG.DlgBase.prototype.onUpdate = function (ftime) {}
	BTG.DlgBase.prototype.flash = function (tArray) {}
})(BTG);