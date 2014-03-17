cc.SCROLL_MODEL_VERTICAL = 0;
cc.SCROLL_MODEL_HORIZONTAL = 1;
cc.SCROLL_MODEL_All = 2;
// 不支持锚点， 不支持旋转 
cc.DoubleClickTime = 0.5;
cc.ScrollLayer = cc.Layer.extend({
	ctor: function () {
		cc.associateWithNative(this, cc.Layer);
	},
	_touchPos: cc.p(0, 0),
	_curTouchNode: null,

	_scrollModel: cc.SCROLL_MODEL_HORIZONTAL,
	_offsetAcc: cc.p(0, 0),
	_right: Number.MAX_VALUE,
	_left: Number.MAX_VALUE,
	_top: Number.MAX_VALUE,
	_bottom: Number.MAX_VALUE,
	_isAutoCalcRange: true,
	_isDirtyRange: false,
	_userPagePixel: 0,
	_changePageObject: null,
	_changePageFunc: null, //_changePage=Funcfunction( curPage);
	_childRootNode: null,
	_touchBeingPointForCallback: null,
	_touchChildCallbackObj: null,
	_touchChildCallbackFunc: null, //_touchChildCallbackFunc = function( childNode ,touchPos);

	_touchChildCallbackDoubleClickFunc: null, //_touchChildCallbackFunc = function( childNode ,touchPos);
	_touchChildCallbackPressFunc: null,
	_touchChildCallbackEndPressFunc: null,
	_touchTimeCount: 0,
	_isTouchEnd: false,
	_isDragItem: false,
	/*
	 * @param {Number} xPixel
	 * @param {Number} yPixel
	 */
	scrollTo: function (xPixel, yPixel) {
		if (xPixel > this._right) {
			xPixel = this._right;
		}
		if (yPixel > this._top) {
			yPixel = this._top;
		}
		if (-xPixel > this._left) {
			xPixel = -this._left;
		}
		if (-yPixel > this._bottom) {
			yPixel = -this._bottom;
		}
		this._offsetAcc = cc.p(xPixel, yPixel);
		this._childRootNode.runAction(cc.EaseIn.create(cc.MoveTo.create(0.5, this._offsetAcc), 0.3));
	},
	/* 
	 * @param {Number} leftOffset
	 * @param {Number} rightOffset
	 * @param {Number} topOffset
	 * @param {Number} bottomOffset
	 */
	setScrollMaxRange: function (leftOffset, rightOffset, topOffset, bottomOffset) {
		this._isAutoCalcRange = false;
		this._left = leftOffset;
		if (rightOffset !== undefined)
			this._right = rightOffset;
		if (topOffset !== undefined)
			this._top = topOffset;
		if (bottomOffset !== undefined)
			this._bottom = bottomOffset;
	},
	/** <p>如果需要点击子节点 <br/> </p>
	 * @param {Object} callbackObj
	 * @param {Object.Function(touchNode, touchPos)} callbackFun
	 */
	enableTouchChild: function (callbackObj, callbackClickFun, callbackDoubleClick, callbackPressFunc, endPressFunc, moveFunc) {
		this._touchChildCallbackFunc = callbackClickFun;
		this._touchChildCallbackObj = callbackObj;
		this._touchChildCallbackDoubleClickFunc = callbackDoubleClick;
		this._touchChildCallbackPressFunc = callbackPressFunc;
		this._touchChildCallbackEndPressFunc = endPressFunc;
		this._touchMoveCallback = moveFunc;
	},
	/** <p>如果需要按页面宽度滚动 <br/> </p>
	 * @param {Number} nPageWidthForPixel
	 * @param {Object} pageChangeCallbackObject
	 * @param {Object.Function(curPageNums)} pageChangeCallbackFunc
	 */
	enablePage: function (nPageWidthOrHeight_ForPixel, pageChangeCallbackObject, pageChangeCallbackFunc) {//按页滚动,只支持X轴向
		if (pageChangeCallbackFunc !== undefined && pageChangeCallbackObject !== undefined) {
			this._changePageFunc = pageChangeCallbackFunc;
			this._changePageObject = pageChangeCallbackObject;
		}
		this._userPagePixel = 0 | nPageWidthOrHeight_ForPixel;
	},
	/** <p>如果需要改变滚动模式，默认为横向滚动 <br/> </p>
     *cc.SCROLL_MODEL_VERTICAL = 0;
     *cc.SCROLL_MODEL_HORIZONTAL = 1;
     *cc.SCROLL_MODEL_All = 2;
	 * @param {Object} scrollModel
	 */

	setScrollModel: function (scrollModel) {//cc.SCROLL_MODEL_...
		this._scrollModel = scrollModel;
	},
	addChild: function (child, zOrder, tag) {
		this._isDirtyRange = true;
		if (this._childRootNode) this._childRootNode.addChild(child, zOrder, tag);
		else {
			this._childRootNode = cc.Node.create();
			this._super(this._childRootNode, zOrder, tag);
		}
	},
	removeChild: function (child, cleanup) {
		this._isDirtyRange = true;
		if(this._childRootNode)
			this._childRootNode.removeChild(child, cleanup);
	},
	removeChildByTag: function (tag, cleanup) {
		this._isDirtyRange = true;
		if(this._childRootNode) {
			this._childRootNode.removeChildByTag(tag, cleanup);
		}
	},
	getChildByTag: function (tag) {
		return this._childRootNode.getChildByTag(tag);
	},
	getChildren: function () {
		return this._childRootNode.getChildren();
	},
	calcChildRange: function () {
		if (this._isAutoCalcRange === false)
			return;
		if (this._isDirtyRange === false)
			return;
		this._isDirtyRange = false;

		var tempChildren = this._childRootNode._children;
		if (!tempChildren)
			return null;
		if (tempChildren.length === 0)
			return null;

		var tRect = cc.rect(0, 0, 0, 0);
		for (var i = 0; i < tempChildren.length; i++) {
			if (tempChildren[i].isVisible() === false)
				continue;
			tRect = cc.Rect.CCRectUnion(tRect, tempChildren[i].getBoundingBox());
		}
		var conSize = this.getContentSize();

		this._left = tRect.origin.x + tRect.size.width;
		if (this._scrollModel === cc.SCROLL_MODEL_HORIZONTAL && this._userPagePixel > 0)
			this._left -= this._userPagePixel;
		else
			this._left -= conSize.width;
		if (this._left < 0)
			this._left = 0;
		this._bottom = tRect.origin.y + tRect.size.height - conSize.height;
		//
		if (this._scrollModel === cc.SCROLL_MODEL_VERTICAL && this._userPagePixel > 0)
			this._bottom -= this._userPagePixel;
		else
			this._bottom -= conSize.height;
		//
		if (this._bottom < 0)
			this._bottom = 0;

		this._right = -tRect.origin.x;
		if (this._right < 0)
			this._right = 0;
		this._top = -tRect.origin.y;
		if (this._top < 0)
			this._top = 0;
		if (this._userPagePixel) {
			//if (this._left <= this._userPagePixel)
			//    this._left = 0;
		}
	},
	registerWithTouchDispatcher: function () {
		cc.Director.getInstance().getTouchDispatcher().addTargetedDelegate(this, cc.MENU_HANDLER_PRIORITY, false);
	},
	onTouchEnded: function (touch, event) {
		if (this._touchPos === null)
			return;
		if (this._isDragItem) {
			this._isDragItem = false;
			if (this._touchChildCallbackEndPressFunc)
				this._touchChildCallbackEndPressFunc.call(this._touchChildCallbackObj, touch.getLocation());
			return;
		}
		var touchPos = touch.getLocation();

		//if (this._touchChildCallbackDoubleClickFunc)
		//{
		if (Math.abs(this._touchBeingPointForCallback.x - touchPos.x) <= 1 && Math.abs(this._touchBeingPointForCallback.y - touchPos.y) <= 1) {
			if (this._curTouchNode) {
				if (this._touchChildCallbackDoubleClickFunc) {
					if (this._touchTimeCount < cc.DoubleClickTime && this._isTouchEnd === true) {
						this._touchChildCallbackDoubleClickFunc.call(this._touchChildCallbackObj, this._curTouchNode, touchPos);
						this._curTouchNode = null;
						this._touchTimeCount = 0;

						this._isTouchEnd = false;
					} else
						this._isTouchEnd = true;
				} else {//当没双击回调时，立即处理单机回调 2012.11.21
					if (this._touchChildCallbackFunc) {
						this._touchChildCallbackFunc.call(this._touchChildCallbackObj, this._curTouchNode, this._touchBeingPointForCallback);

						this._curTouchNode = null;
						this._touchTimeCount = 0;
						this._curTouchNode = null;
						this._isTouchEnd = false;
					} else this._isTouchEnd = true;
				}
			}
		} else {
			this._curTouchNode = null;
			this._touchTimeCount = 0;
		}
		//}
		//else
		//{
		//    var touchPos = touch.getLocation();
		//    if (Math.abs(this._touchBeingPointForCallback.x - touchPos.x) <= 1 &&
		//       Math.abs(this._touchBeingPointForCallback.y - touchPos.y) <= 1) {
		//        if (this._curTouchNode) {
		//            this._isTouchEnd = true;
		//        }
		//    }
		//}

		this._touchPos = null;

		if (this._userPagePixel === 0)
			return;
		if (this._scrollModel === cc.SCROLL_MODEL_HORIZONTAL) {
			var curScroll = -(this._offsetAcc.x) % this._userPagePixel;
			if (Math.abs(curScroll) > this._userPagePixel / 2) {
				if (curScroll > 0) curScroll = -(this._userPagePixel - curScroll);
				else curScroll = this._userPagePixel + curScroll;
			}
			this._offsetAcc.x += curScroll;

			if (this._changePageFunc) {
				this._changePageFunc.call(this._changePageObject, 0 | Math.abs(this._offsetAcc.x / this._userPagePixel));
			}
			var pos = this._childRootNode.getPosition();
			pos.x += curScroll;
			this._childRootNode.runAction(cc.EaseIn.create(cc.MoveTo.create(0.5, pos), 0.3));
		} else if (this._scrollModel === cc.SCROLL_MODEL_VERTICAL) {
			var curScroll = -(this._offsetAcc.y) % this._userPagePixel;
			if (Math.abs(curScroll) > this._userPagePixel / 2) {
				if (curScroll > 0) curScroll = -(this._userPagePixel - curScroll);
				else curScroll = this._userPagePixel + curScroll;
			}
			this._offsetAcc.y += curScroll;

			if (this._changePageFunc) {
				this._changePageFunc.call(this._changePageObject, 0 | Math.abs(this._offsetAcc.y / this._userPagePixel));
			}
			var pos = this._childRootNode.getPosition();
			pos.y += curScroll;
			this._childRootNode.runAction(cc.EaseIn.create(cc.MoveTo.create(0.5, pos), 0.3));
		}

	},
	onTouchBegan: function (touch, event) {
		if (BTG.DlgBase.isCanInput(this.getParent()) == false) {
			return false;
		}
		var nodes = this;
		while (nodes) {
			if (nodes.isVisible() === false)
				return false;
			nodes = nodes.getParent();
		}

		this.calcChildRange();
		this._touchPos = touch.getLocation();

		this._touchBeingPointForCallback = cc.p(this._touchPos.x, this._touchPos.y);

		var localPos = this.convertToNodeSpace(this._touchPos);

		var conSize = this.getContentSize();
		var scalX = this.getScaleX();
		var scalY = this.getScaleY();
		conSize.width *= scalX;
		conSize.height *= scalY;
		if (localPos.x < 0 || localPos.x > conSize.width || localPos.y < 0 || localPos.y > conSize.height) {
			this._touchPos = null;
			this._curTouchNode = null;
		} else
			this._curTouchNode = this.getTouchChildNode(this._touchPos);

		return true;
	},
	onTouchMoved: function (touch, event) {
		if (this._touchPos === null)
			return true;
		var pos = touch.getLocation();
		var offsetPos = cc.p(0 | (pos.x - this._touchPos.x), 0 | (pos.y - this._touchPos.y));

		if (this._touchMoveCallback != null)
			this._touchMoveCallback.call(this._touchChildCallbackObj, touch.getLocation());


		if (this._isDragItem)
			return true;
		else if (this._curTouchNode) {
			this._curTouchNode = null;
			this._touchTimeCount = 0;
		}

		if (this._scrollModel === cc.SCROLL_MODEL_VERTICAL) {
			offsetPos.x = 0;
		} else if (this._scrollModel === cc.SCROLL_MODEL_HORIZONTAL) {
			offsetPos.y = 0;
		}

		this._touchPos = pos;
		this._offsetAcc.x += offsetPos.x;
		this._offsetAcc.y += offsetPos.y;

		if (this._offsetAcc.x > this._right) {
			this._offsetAcc.x = this._right;
		}

		if (this._offsetAcc.y > this._top) {
			this._offsetAcc.y = this._top;
		}
		if (-this._offsetAcc.x > this._left) {
			this._offsetAcc.x = -this._left;
		}
		if (-this._offsetAcc.y > this._bottom) {
			this._offsetAcc.y = -this._bottom;
		}
		//if (this._childRootNode.getPosition().x === this._offsetAcc.x)
		//    this._touchPos = null;
		this._childRootNode.setPosition(cc.p(this._offsetAcc.x, this._offsetAcc.y));
		return true;
	},

	ignoreAnchorPointForPosition: function (onlyTrue) {
		this._super(true); //not anchorPoint
	},
	init: function () {
		this._super();
		this.setTouchEnabled(true);
		this.addChild(this._childRootNode);
		this.schedule(this.update, 1 / 60);
		return true;
	},
	update: function (ftime) {
		if (this._isTouchEnd) {
			this._touchTimeCount += ftime;
			if (this._touchChildCallbackFunc && this._touchTimeCount > cc.DoubleClickTime) {
				this._touchChildCallbackFunc.call(this._touchChildCallbackObj, this._curTouchNode, this._touchBeingPointForCallback);
				this._curTouchNode = null;
				this._touchTimeCount = 0;
				this._curTouchNode = null;
				this._isTouchEnd = false;
			}
		} else if (this._curTouchNode) {
			this._touchTimeCount += ftime;
			if (this._touchTimeCount > 0.2) {
				//console.log("drag"); 
				if (this._touchChildCallbackPressFunc) {
					this._touchChildCallbackPressFunc.call(this._touchChildCallbackObj, this._curTouchNode, this._touchBeingPointForCallback);
					this._isDragItem = true;
				}
				this._touchTimeCount = 0;
				this._curTouchNode = null;
			}
		}
	},
	setRotation: function (rot) {
		cc.log("[Error] cc.ScrollLayer not Rotation");

	},
	getTouchChildNode: function (vTouchPos) {
		var tempChildren = this._childRootNode._children;
		if (!tempChildren) return null;
		if (tempChildren.length === 0) return null;

		for (var i = 0; i < tempChildren.length; i++) {
			if (tempChildren[i].notTouch) continue;
			if (tempChildren[i].isVisible() === false) continue;
			var childPos = tempChildren[i].convertToNodeSpace(vTouchPos);
			var conSize = tempChildren[i].getContentSize();

			if (childPos.x < 0 || childPos.x > conSize.width || childPos.y < 0 || childPos.y > conSize.height) {
				continue;
			} else {
				//cc.log("sel:"+tempChildren[i].getString());
				return tempChildren[i];
			}
		}
		return null;
	},
	getTouchNode: function () {
		return this._curTouchNode;
	},
	visit: function (ctx) {
		// quick return if not visible
		if (!this._isVisible) {
			return;
		}
		var context = ctx || cc.renderContext;
		var i;
		if (cc.renderContextType !== cc.CANVAS) {
			return;
		}
		context.save();
		var clipSize = this.getContentSize();
		var pos = this.getPosition();
		var parentNode = this.getParent();
		while (parentNode) {
			if (parentNode.isIgnoreAnchorPointForPosition()) {
				parentNode = parentNode.getParent();
				continue;
			}
			var anchorPoint = parentNode.getAnchorPoint();
			var conSize = parentNode.getContentSize();
			pos.x -= anchorPoint.x * conSize.width;
			pos.y -= anchorPoint.y * conSize.height;
			parentNode = parentNode.getParent();
			break;
		}

		var scalX = this.getScaleX();
		var scalY = this.getScaleY();
		clipSize.width *= scalX;
		clipSize.height *= scalY;

		context.beginPath();
		context.rect((pos.x), -(pos.y), clipSize.width, -clipSize.height);
		context.closePath();
		context.clip();

		this.transform(context);

		if (this._children && this._children.length > 0) {
			this.sortAllChildren();
			// draw children zOrder < 0
			for (i = 0; i < this._children.length; i++) {
				if (this._children[i] && this._children[i]._zOrder < 0) {
					this._children[i].visit(context);
				} else {
					break;
				}
			}
			//if (this._isInDirtyRegion()) {
			// self draw
			this.draw(context);
			//}
			// draw children zOrder >= 0
			if (this._children) {
				for (; i < this._children.length; i++) {
					if (this._children[i] && this._children[i]._zOrder >= 0) {
						this._children[i].visit(context);
					}
				}
			}
		} else {
			//if (this._isInDirtyRegion()) {
			// self draw
			this.draw(context);
			//}
		}
		this._orderOfArrival = 0;
		context.restore();
	},
	setDirty: function () {
		this._isDirtyRange = true;
	}
});

cc.ScrollLayer.create = function () {
	var a = new cc.ScrollLayer;
	return a && a.init() ? a : null;
}