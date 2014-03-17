(function(BTG) {
	BTG.Radiobox = function() {
		this.m_pSprFlag = null;
		this.m_pButtonArray = new Array();
		this.m_callbackObj = null;
		this.m_callbackFunc = null;
		this.m_curIdx = -1;
	}

	//callbackFunc(pSender, idx)
	BTG.Radiobox.prototype.create = function (nDefaultSelIdx, pFlagSpr, callbackObj, callbackFunc, sprArr) {
		this.m_pSprFlag = pFlagSpr;
		this.m_curIdx = nDefaultSelIdx;
		this.m_callbackObj = callbackObj;
		this.m_callbackFunc = callbackFunc;

		this.m_pButtonArray = sprArr;
		//for (var i = 4; i < arguments.length; i++) {
		//    this.m_pButtonArray[i - 4] = arguments[i];
		//}

		var pos = this.m_pButtonArray[this.m_curIdx].getPosition();
		//var contentSize = this.m_pButtonArray[this.m_curIdx].getContentSize();
		this.m_pSprFlag.setPosition(cc.p(pos.x, pos.y));
	}

	BTG.Radiobox.prototype.touchBegin = function (vPos) {
		for (var i = 0; i < this.m_pButtonArray.length; i++) {
			if (ptInNode(vPos, this.m_pButtonArray[i])) {
				if(this.m_curIdx === i)
					return;

				this.activeBoxByIdx(i)

				this.m_callbackFunc.call(this.m_callbackObj, this.m_pButtonArray[this.m_curIdx], this.m_curIdx);
				return;
			}
		}
	}
	BTG.Radiobox.prototype.setButtons = function (btns) {
		this.m_pButtonArray = btns;
	}
	BTG.Radiobox.prototype.activeBoxByIdx = function (idx) {
		this.m_curIdx = idx;
		var pos = this.m_pButtonArray[this.m_curIdx].getPosition();
		var contentSize = this.m_pButtonArray[this.m_curIdx].getContentSize();
		this.m_pSprFlag.setPosition(cc.p(pos.x, pos.y));
	}
})(BTG);