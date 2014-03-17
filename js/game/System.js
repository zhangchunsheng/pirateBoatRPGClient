(function(BTG) {
	BTG.System = function() {
		this.init = function () {
			
		}
		this.isPC = function () {
			return IsPc();
		}
		this.getOperSys = function () {
			return m_operSystem;
		}
		this.getBasePos = function (nPosType) {
			assert(typeof nPosType == "number");
			switch (nPosType) {
				case 0:
					//中心点
					return cc.p(BTG.windowSize.width / 2, BTG.windowSize.height / 2);
					break;
				case 1:
					//左下角
					return cc.p(0, 0);
					break;
				case 2:
					//下边中点
					return cc.p(BTG.windowSize.width / 2, 0);
					break;
				case 3:
					//右下角
					return cc.p(BTG.windowSize.width, 0);
					break;
				case 4:
					//右边中点
					return cc.p(BTG.windowSize.width, BTG.windowSize.height / 2);
					break;
				case 5:
					//右上角
					return cc.p(BTG.windowSize.width, BTG.windowSize.height);
					break;
				case 6:
					//上边中点
					return cc.p(BTG.windowSize.width / 2, BTG.windowSize.height);
					break;
				case 7:
					//左上角
					return cc.p(0, BTG.windowSize.height);
					break;
				case 8:
					//左边中点
					return cc.p(0, cc.Director.getInstance().getWinSize().height / 2);
					break;
				default:
					assert(0, "GetBasePos :nPosType not definde");
			}
			return null;
		}
	};

	BTG.Callback = function(objectFunc, object, fileName) {
		this.m_object = object;
		this.m_objectFunc = objectFunc;
		this.m_fileName = null;
		if(fileName)
			this.m_fileName = fileName;
	};

	BTG.Callback.prototype.run = function () {
		if(this.m_object && this.m_object !== undefined)
			this.m_objectFunc.call(this.m_object);
		else
			this.m_objectFunc.call();

		if(this.m_fileName)
			rpgGame.getLoadingBar().setLoadStr("load..." + this.m_fileName);
	}
})(BTG);