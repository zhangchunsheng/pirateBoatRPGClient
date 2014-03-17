(function(BTG) {
	BTG.ItemTouchControl = function () {
		this.m_Items = [];
		this.m_touchNode = null;
		this.m_lastTouchNode = null;
		this.m_copyNode = null;

		this.m_callbackObj = null;
		this.m_clickCallFunc = null;
		this.m_dbClickCallFunc = null;
		this.m_pressCallFunc = null;
		this.m_pressEndCallFunc = null;
		//private vars
		this._delayTime = 0;
		this._touchCount = 0;
		this._touchPoint = null;
	}

	BTG.ItemTouchControl.prototype.setItems = function (items) {
		this.m_items = items;
	}

	BTG.ItemTouchControl.prototype.addItem = function (item) {
		this.m_items.push(item);
	}

	BTG.ItemTouchControl.prototype.setFunctions = function (obj, click, dbclick, press, pressEnd) {
		this.m_callbackObj = obj;
		this.m_clickCallFunc = click;
		this.m_dbClickCallFunc = dbclick;
		this.m_pressCallFunc = press;
		this.m_pressEndCallFunc = pressEnd;
	}
	BTG.ItemTouchControl.prototype.touchBegin = function (touchPos) {
		this._touchPoint = touchPos;
		this.m_touchNode = this.GetTouchChildNode(touchPos);
		if (this.m_touchNode) {
			if (this._touchCount === 0) this.PressBegin();
			return true;
		}
		return false;
	}

	BTG.ItemTouchControl.prototype.pressBegin = function (touchPos) {
		var delayAct = cc.DelayTime.create(0.2);
		var _this = this;
		var act = cc.Sequence.create(
		delayAct,
		cc.CallFunc.create(_this, _this.pressItem))
		this.m_touchNode.runAction(act);
	}

	BTG.ItemTouchControl.prototype.pressItem = function (touchPos) {
		console.log("press");
		this.m_copyNode = BTG.actionUtil.copyItem(this.m_touchNode);
		//if(this.m_pressCallFunc)
		//    this.m_pressCallFunc.call(this.m_callbackObj, this.m_touchNode, touchPos);
	}

	BTG.ItemTouchControl.prototype.touchMove = function (touchPos) {
		if (this.m_copyNode) this.m_copyNode.setPosition(rpgGame.getGameRoot().convertToNodeSpace(touchPos));
	}

	BTG.ItemTouchControl.prototype.touchEnd = function (touchPos) {
		if (this.m_touchNode) this.m_touchNode.stopAllActions();
		if (Math.abs(this._touchPoint.x - touchPos.x) > 1 && Math.abs(this._touchPoint.y - touchPos.y) > 1) {
			this._touchCount = 0;
			return;
		}

		if (this.m_copyNode) {//press ok
			rpgGame.getGameRoot().removeChild(this.m_copyNode);
			if (this.m_pressEndCallFunc)
				this.m_pressEndCallFunc.call(this.m_callbackObj, this.m_copyNode, touchPos);
			this._touchCount = 0;
			this.m_copyNode = null;
		} else if (this.m_touchNode) {
			this._touchCount++;
			if (this._touchCount === 1) {
				if (this.m_clickCallFunc) {
					this.m_touchNode.runAction(
					cc.Sequence.create(
					cc.DelayTime.create(0.3),
					cc.CallFunc.create(this, this.Click)))
				} else this._touchCount = 0;
			} else if (this._touchCount === 2) {
				console.log("dbclick");
				if (this.m_dbClickCallFunc) this.DBClick(touchPos);
				this._touchCount = 0;
			}
		}
	}

	BTG.ItemTouchControl.prototype.click = function () {
		console.log("click");
		this.m_clickCallFunc.call(this.m_callbackObj, this.m_touchNode, this._touchPoint);
		this._touchCount = 0;
	}
	BTG.ItemTouchControl.prototype.DBClick = function (touchPos) {
		this.m_dbClickCallFunc.call(this.m_callbackObj, this.m_touchNode, touchPos);
	}

	BTG.ItemTouchControl.prototype.getTouchChildNode = function (vTouchPos) {
		if (this.m_items.length === 0)
			return null;
		for (var i = 0; i < this.m_items.length; i++) {
			if (this.m_items[i].notTouch)
				continue;
			if (this.m_items[i].isVisible() === false)
				continue;
			var childPos = this.m_items[i].convertToNodeSpace(vTouchPos);
			var conSize = this.m_items[i].getContentSize();
			
			if (childPos.x < 0 || childPos.x > conSize.width || childPos.y < 0 || childPos.y > conSize.height) {
				continue;
			} else {
				return this.m_items[i];
			}
		}

		return null;
	}
})(BTG);