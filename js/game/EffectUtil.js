(function(BTG) {
	BTG.EffectUtil = function() {
		this.m_effectDataMap = new Object();
		this.m_effectPlayArray = new Array();
	}

	BTG.EffectUtil.prototype.getEffectData = function (effFileName) {
		//cc.alert("GetEffectData begin");
		//var tEffDataObj = this.m_effectDataMap[effFileName];
		//cc.alert("GetEffectData end");
		if (this.m_effectDataMap[effFileName] === undefined) {
			// cc.alert("new CEffectData() begin");
			this.m_effectDataMap[effFileName] = new BTG.EffectData();
			//cc.alert("new CEffectData end");
			this.m_effectDataMap[effFileName].create(effFileName);
			// this.m_effectDataMap[effFileName] = tEffDataObj;
		}
		return this.m_effectDataMap[effFileName];
	}
	BTG.EffectUtil.prototype.add = function (effFileName, parNode, layer, vPos) {
		var tEffDataObj = this.getEffectData(effFileName);

		var tempEffPlay = new BTG.EffectPlay();
		this.m_effectPlayArray[this.m_effectPlayArray.length] = tempEffPlay;
		tempEffPlay.create(tEffDataObj, parNode, layer, vPos);
		return tempEffPlay;
	}
	BTG.EffectUtil.prototype.del = function (effPlayObj) {
		for (var i = 0; i < this.m_effectPlayArray.length; i++) {
			if (this.m_effectPlayArray[i] == effPlayObj) {
				this.m_effectPlayArray[i].del();
				this.m_effectPlayArray.splice(i, 1);
				return;
			}
		}
	}

	BTG.EffectUtil.prototype.delForFileName = function (fileName) {
		for (var i = 0; i < this.m_effectPlayArray.length; i++) {
			if (this.m_effectPlayArray[i].m_pEffectObject.m_fileName == fileName) {
				this.m_effectPlayArray[i].del();
				this.m_effectPlayArray.splice(i, 1);
				return;
			}
		}
	}
	BTG.EffectUtil.prototype.update = function (ftime) {
		for (var i = 0; i < this.m_effectPlayArray.length; i++) {
			this.m_effectPlayArray[i].update(ftime);
		}
		for (var i = 0; i < this.m_effectPlayArray.length; i++) {
			if (this.m_effectPlayArray[i].isStop()) {
				this.m_effectPlayArray[i].del();
				this.m_effectPlayArray.splice(i, 1);
				break;
			}
		}
	}
})(BTG);