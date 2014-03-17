(function(BTG) {
	var itemDragMode_Copy = 0;
	var itemDragMode_Move = 1;

	BTG.UIHeroEquip = function() {
		this.m_scroll = null;
		this.m_parDlg = null;
		this.m_labelTags = [];
		this.m_itemTags = [];
		this.m_itemActiveSpr = null;
		this.m_itemNormalTexture = null;
		this.m_uiData = null;
		this.m_items = [];
		this.m_scaleOffset = 0;

		this.m_posKey = null;
		this.m_dragItem = null;
		this.m_dragBg = null;

		this.m_itemStateCtrl = null;
		this.m_canDropSelfItem = false;

		this.m_itemCanScale = false;
	}
	//param scroll = scrollLayer or refLayer
	BTG.UIHeroEquip.prototype.init = function (scroll) {
		
	}

	BTG.UIHeroEquip.prototype.create = function (parDlg, uiData, scrollTag) {
		this.m_parDlg = parDlg;

		var refLayer = parDlg.find(scrollTag);
		this.m_scroll = UIHelp_CreateScrollFormLayer(parDlg.m_pRoot, refLayer);
		this.m_scroll.enablePage(refLayer.getContentSize());
		this.m_scroll.enableTouchChild(this, this.onClickSprite, this.onDoubleClick, this.onPressItem, this.onEndPress, this.onTouchMove);

		this.m_itemStateCtrl = new BTG.ItemStateControl();
		if (uiData) {
			this.createStateItems(uiData);
		}
	}

	BTG.UIHeroEquip.prototype.setUIData = function (uiData) {
		this.m_uiData = uiData;
	}
	BTG.UIHeroEquip.prototype.setPositionKey = function (key) {
		this.m_posKey = key;
	}

	BTG.UIHeroEquip.prototype.setItems = function (tipItems, key) {
		if (!this.m_scroll)
			return;
		if (key != undefined)
			this.m_posKey = key;
		else if (this.m_posKey == null)
			return;

		this.clearItems();
		for (var i = 0; i < tipItems.length; i++) {
			this.m_scroll.addChild(tipItems[i], 200);
			this.setItemPosByKey(tipItems[i], this.m_posKey);
			this.m_items.push(tipItems[i]);
			//if (this.m_scroll._itemDisableSprite)
			//    tipItems[i]._disableSpr = this.m_scroll._itemDisableSprite;
			//if (this.m_scroll._itemActiveSprite)
			//    tipItems[i]._activeSpr = this.m_scroll._itemActiveSprite;
		}
	}
	BTG.UIHeroEquip.prototype.pushItem = function (item) {
		this.m_items.push(item);
	}
	BTG.UIHeroEquip.prototype.createStateItems = function (uiData) {
		if (!this.m_scroll) return;
		if (uiData) this.m_uiData = uiData;

		var items = [];

		for (var key in uiData) {
			var tag = uiData[key];
			var bg = null;
			if (tag instanceof Array) {
				bg = UIHelp_ReplaceCtrl(this.m_scroll, this.m_parDlg.m_pRoot, tag[0]);
				if (tag[1] != null) {
					var activeSpr = UIHelp_ReplaceCtrl(this.m_scroll, this.m_parDlg.m_pRoot, tag[1]);

					activeSpr.notTouch = true;
					bg._activeSpr = activeSpr;
					activeSpr.setVisible(false);
					activeSpr.setZOrder(100);
				}
				if (tag[2] != null) {
					var disableSpr = UIHelp_ReplaceCtrl(this.m_scroll, this.m_parDlg.m_pRoot, tag[2]);

					disableSpr.notTouch = true;
					bg._disableSpr = disableSpr;
					disableSpr.setVisible(false);
					disableSpr.setZOrder(100);
				}
			} else bg = UIHelp_ReplaceCtrl(this.m_scroll, this.m_parDlg.m_pRoot, tag);

			bg.notTouch = true;
			items.push(bg);
		}
		this.m_itemStateCtrl.setItems(items);
	}

	BTG.UIHeroEquip.prototype.enableShareItemState = function (activeTag, disableTag) {
		var activeSpr, disableSpr
		if (activeTag) activeSpr = UIHelp_ReplaceCtrl(this.m_scroll, this.m_parDlg.m_pRoot, activeTag);
		if (disableTag) disableSpr = UIHelp_ReplaceCtrl(this.m_scroll, this.m_parDlg.m_pRoot, disableTag);
		this.m_itemStateCtrl.enableShareState(activeSpr, disableSpr)
	}
	BTG.UIHeroEquip.prototype.enableDropSelf = function (canDrop) {
		this.m_canDropSelfItem = canDrop;
	}
	BTG.UIHeroEquip.prototype.enableItemScale = function (offset) {
		this.m_scaleOffset = offset;
		this.m_itemCanScale = true;
	}
	//BTG.UIHeroEquip.prototype.setItemDragMode = function(mode) {
	//    this.m_dragMode = mode;
	//}
	BTG.UIHeroEquip.prototype.holdLablesKey = function (labelTags) {
		for (var i = 0; i < this.labelTags.length; i++) {
			var lbl = this.m_parDlg.find(labelTags[i])
			lbl.setUserData(lbl.getString());
			lbl.setString(g_userString[lbl.getUserData()]);
		}
	}

	BTG.UIHeroEquip.prototype.setItemPosByKey = function (itemSpr, key) {
		if (key != undefined) this.m_posKey = key;
		else if (this.m_posKey == null) return;

		var itemData = itemSpr.getUserData();
		if (!itemData) return;

		var keyValue = itemData[this.m_posKey];
		var bg = this.getBgByKey(keyValue);
		if (bg) {
			bg.notTouch = true;
			if (this.m_itemCanScale) {
				var size1 = bg.getContentSize();
				var size2 = itemSpr.getContentSize();
				var rate = cc.size((size1.width - this.m_scaleOffset.width) / size2.width, (size1.height - this.m_scaleOffset.height) / size2.height);
				itemSpr.setScale(rate.width, rate.height);
			}
			var pos = bg.getPosition();
			itemSpr.setPosition(pos);
			itemSpr._posBg = bg;
		}
	}

	BTG.UIHeroEquip.prototype.setItemStateByKey = function (state, itemkey) {
		var item = this.getBgByKey(itemkey);
		if (item)
			this.m_itemStateCtrl.setItemState(item, state);
	}

	BTG.UIHeroEquip.prototype.getBgByKey = function (itemKey) {
		var tag = this.m_uiData[itemKey];
		if (tag instanceof Array) tag = tag[0];
		var bg = this.m_scroll._childRootNode.getChildByTag(tag);
		return bg;
	}
	BTG.UIHeroEquip.prototype.getParent = function () {
		return this.m_parDlg;
	}
	BTG.UIHeroEquip.prototype.getChildByTag = function (tag) {
		return this.m_scroll.getChildByTag(tag);
	}
	BTG.UIHeroEquip.prototype.removeChild = function (item) {
		this.m_scroll.removeChild(item);
	}

	BTG.UIHeroEquip.prototype.getChildren = function () {
		return this.m_scroll.getChildren();
	}

	BTG.UIHeroEquip.prototype.clearItems = function () {
		for (var i = 0; i < this.m_items.length; i++) {
			this.m_scroll.removeChild(this.m_items[i], true);
			if (this.m_items[i] instanceof cc.PagePlayerItem) this.m_items[i].remove();
		}
		this.m_items = [];
	}
	BTG.UIHeroEquip.prototype.resetItemsState = function () {
		this.m_itemStateCtrl.resetItemsState();
	}
	//touch event
	BTG.UIHeroEquip.prototype.onClickSprite = function (touchSpr, touchPos) {
		if (touchSpr instanceof cc.PageTipItem) touchSpr.showTip();
	}
	BTG.UIHeroEquip.prototype.onDoubleClick = function (touchSpr, touchPos) {
		//if (this.m_posKey == null) return;
		if (touchSpr != null) {
			if (this.m_parDlg.onDoubleClick) this.m_parDlg.onDoubleClick(touchSpr, touchPos);
		}
	}
	BTG.UIHeroEquip.prototype.onPressItem = function (touchSpr) {
		if (touchSpr != null) {
			this.m_dragItem = BTG.actionUtil.copyItem(touchSpr); //touchSpr.copy(rpgGame.getGameRoot(),BTG.GZOrder_Top);

			if (this.m_parDlg.onHeroEquipPressItem) {
				this.m_parDlg.onHeroEquipPressItem(touchSpr);
			}
			this.m_dragBg = touchSpr._posBg;
		}
	}
	BTG.UIHeroEquip.prototype.onEndPress = function (touchPos) {
		if (this.m_dragItem == null)
			return;
		if (this.m_parDlg.onHeroEquipEndPress)
			this.m_parDlg.onHeroEquipEndPress(this.m_dragItem, touchPos);

		this.m_dragItem = null;
	}
	BTG.UIHeroEquip.prototype.onTouchMove = function (touchPos) {
		if (this.m_dragItem)
			this.m_dragItem.setPosition(rpgGame.getGameRoot().convertToNodeSpace(touchPos));
	}
	BTG.UIHeroEquip.prototype.getRect = function () {
		return this.m_scroll.getBoundingBox();
	}
	BTG.UIHeroEquip.prototype.containsPoint = function (touchPos) {
		var rect = this.m_scroll.getBoundingBox();
		var localPos = this.m_scroll.getParent().convertToNodeSpace(touchPos);
		if (cc.Rect.CCRectContainsPoint(rect, localPos)) {
			return true;
		} else
			return false;
	}
	BTG.UIHeroEquip.prototype.getItemsByKeys = function (keys) {
		var arr = [];
		for (var i = 0; i < keys.length; i++) {
			var bg = this.getBgByKey(keys[i]);
			arr.push(bg);
		}
		return arr;
	}
	BTG.UIHeroEquip.prototype.resetDragPos = function () {
		this.m_dragItem.setPosition(this.m_dragBg.getPosition());
	}
	BTG.UIHeroEquip.prototype.changeItemPos = function (item, itemBg) {
		item.setPosition(itemBg.getPosition())
		item._posBg = itemBg;
	}
})(BTG);