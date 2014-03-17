(function(BTG) {
	BTG.PreLoadMulRes2SingleFun = function(callbackFun, callbackObj) {//加载多个资源调用一个回调函数
		this.m_fileName2funcMap = new Object();
		this.m_callbackObj = new BTG.Callback(callbackFun, callbackObj);
		this.m_resLoadCurCount = 0;
		this.m_resLoadMaxCount = 0;
		this.m_isPreEnd = false;
	};

	BTG.PreLoadMulRes2SingleFun.prototype.onLoad = function () {
		this.m_resLoadCurCount++;
		if(this.m_isPreEnd == true)
			this.endPre();
	}

	BTG.PreLoadMulRes2SingleFun.prototype.preImage = function (resFileName) {
		rpgGame.getLoadingBar().setLoadStr("Load..." + resFileName);
		if (this.m_fileName2funcMap[resFileName]) {
			return;
		}

		this.m_fileName2funcMap[resFileName] = 1;

		if(cc.config.isApp == false)
			cc.TextureCache.getInstance().addImageAsync(resFileName, this, this.onLoad);
		else
			this.onLoad();

		this.m_resLoadMaxCount++;
	}
	BTG.PreLoadMulRes2SingleFun.prototype.endPre = function (callbackFun, callbackObj) {
		this.m_isPreEnd = true;
		if(this.m_resLoadCurCount >= this.m_resLoadMaxCount) {//所有资源加载完成
			this.m_callbackObj.run();
			this.m_resLoadCurCount = 0;
			this.m_resLoadMaxCount = 0;
			this.m_fileName2funcMap = new Object();
		}
	}

	BTG.SingleResCallBack = function(tobject, fileNameMap) {
		this.m_fileName = fileNameMap;
		this.m_pObject = tobject;
		this.run = function () {
			for (var i = 0; i < this.m_pObject.m_fileName2funcMap[this.m_fileName].length; i++) {
				this.m_pObject.m_fileName2funcMap[this.m_fileName][i].run();
			}
			this.m_pObject.m_fileName2funcMap[this.m_fileName].length = 0;
			delete this.m_pObject.m_fileName2funcMap[this.m_fileName];
		}
	};

	BTG.PreLoadSingleRes2SingleFun = function() {//加载单个资源调用一个回调函数
		this.m_fileName2funcMap = new Object();
	};

	BTG.PreLoadSingleRes2SingleFun.prototype.preImage = function (resFileName, callbackFun, callbackObj) {
		if (this.m_fileName2funcMap[resFileName] != undefined) {
			var flength = this.m_fileName2funcMap[resFileName].length;
			this.m_fileName2funcMap[resFileName][flength] = new BTG.Callback(callbackFun, callbackObj);
			return;
		}

		this.m_fileName2funcMap[resFileName] = new Array(1);
		this.m_fileName2funcMap[resFileName][0] = new BTG.Callback(callbackFun, callbackObj);

		var ppp = new BTG.SingleResCallBack(this, resFileName);
		if(cc.config.isApp == false)
			cc.TextureCache.getInstance().addImageAsync(resFileName, ppp, ppp.run);
		else
			ppp.run();
	}
})(BTG);