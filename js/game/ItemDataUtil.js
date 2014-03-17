(function(BTG) {
	BTG.eItemUserDataIdx = {
		id: 0,
		resId: 1,
		name: 2,
		count: 3,
		type: 4
	}

	BTG.ItemDataUtil = function() {
		this.m_tempTable = null;
		this.m_itemTable = null;
		this.m_playerAttr = null;

		this.m_dlgs = []; //需要刷新界面的对话框
		this.MaxItemCount = 0;
		this.maxTempItemCount = 0;
		this.m_packSystem = null;
	}

	BTG.ItemDataUtil.prototype.init = function () {
		if (!this.m_packSystem) {
			var PackageSystem = require("/game/packSystem");
			var ClientPackageSystem = require("/game/clientPackSystem");
			//bind packageSys Func
			this.m_packSystem = rpgGame.getClientRole().getPackSystem();
			_this = this;
			this.m_packSystem.on(ClientPackageSystem.eventNeedRefreshUI, function () {
				_this.OnFlashUI.apply(_this, arguments);
			});

			this.maxTempItemCount = PackageSystem.temporaryGridCount;
			this.MaxItemCount = this.m_packSystem.getPackGridMaxCount();
		}
	}
	BTG.ItemDataUtil.prototype.registFlashDlg = function (dlg) {
		this.m_dlgs.push(dlg);
	}

	BTG.ItemDataUtil.prototype.unRegistFlashDlg = function (dlg) {
		for (var i = 0; i < this.m_dlgs.length; i++) {
			if (this.m_dlgs[i] == dlg) {
				this.m_dlgs.splice(i, 1);
				return;
			}
		}
	}

	BTG.ItemDataUtil.prototype.canTypeStack = function (type) {
		return this.m_packSystem.allowStack(type);
	}

	BTG.ItemDataUtil.prototype.getItemsByType = function (type) {
		return this.m_packSystem.getItemsByType(type);
	}

	BTG.ItemDataUtil.prototype.getItemCount = function () {
		return this.m_packSystem.getPackGridCount();
	}
	BTG.ItemDataUtil.prototype.getTempItemCount = function () {
		return this.m_packSystem.getTemporaryPackGridCount();
	}
	BTG.ItemDataUtil.prototype.getItemData = function (type, id) {
		var itemTable = type === 6 ? this.m_packSystem.getTemporaryItems() : this.m_packSystem.getItemsByType(type);
		if (itemTable == null) return null;
		for (var i = 0; i < itemTable.length; i++) {
			if (itemTable[i]._id == id) return itemTable[i];
		}
	}
	BTG.ItemDataUtil.prototype.getTipItemWithNumByType = function (type, size, withNum) {
		var itemTable = type === 6 ? this.m_packSystem.getTemporaryItems() : this.m_packSystem.getItemsByType(type);
		withNum = withNum == undefined ? true : withNum;
		var place = type === 6 ? itemIn_TempPackage : itemIn_Package;
		return this.createTipItemsByTable(itemTable, size, place, withNum);
	}
	BTG.ItemDataUtil.prototype.createTipItemsByTable = function (itemTable, size, inPlace, withNum) {
		var arr = [];
		for (var i = 0; i < itemTable.length; i++) {
			var item = itemTable[i];
			if (!item) continue;
			var pageItem = cc.PageTipItem.create("res/icon/" + item.iconId + ".jpg", size);
			pageItem.setUserData(item);
			pageItem._itemInPlace = inPlace;

			if (withNum) {
				var canStack = this.canTypeStack(item.type);
				if (canStack) {
					var numLbl = cc.LabelTTF.create(item.count.toString(), "Arial", 20);
					numLbl.setPosition(cc.p(size.width - 10, 10));
					pageItem.addChild(numLbl);
				}
			}
			arr.push(pageItem);
		}
		return arr;
	}
	BTG.ItemDataUtil.prototype.isItemCanUse = function (pageItem, currWJId) {
		var itemData = this.getItemData(pageItem._type, pageItem._id);
		var nUse = itemData.nUse;
		if (nUse === 1) {
			return "此物品不能使用";
		}

		var useTarget = itemData.useTarget;
		if (useTarget !== BTG.GameData.NotDef && useTarget !== currWJId) {
			return "物品不能用于此武将";
		}
		return "ok";
	}

	BTG.ItemDataUtil.prototype.useItem = function (heroDocId, resId, count) {
		this.m_packSystem.useItem(heroDocId, resId, count);
	}

	BTG.ItemDataUtil.prototype.removeItem = function (itemSpr) {
		var itemData = itemSpr.getUserData();
		var packSys = this.m_packSystem;
		var callback = function () {
			return packSys.preRemoveItem(itemData.type, itemData._id);
		}
		gameConfirm("确定要删除物品吗?", callback);
	}
	//obj._id
	//obj._type
	BTG.ItemDataUtil.prototype.sellItem = function (itemData) {
		this.m_packSystem.preSellItem(itemData.type, itemData.docId);
	}

	//arr[obj,obj]
	//obj._id
	//obj._type
	BTG.ItemDataUtil.prototype.sellItemList = function (itemDataList) {
		this.m_packSystem.preSellItemList(itemDataList);
	}
	BTG.ItemDataUtil.prototype.exportToPackage = function (id) {
		if (id != undefined) this.m_packSystem.prePickItem(id);
		else if (this.m_tempTable && this.m_tempTable.length > 0) this.m_packSystem.prePickItems();
	}
	// 监听服务器事件
	BTG.ItemDataUtil.prototype.onFlashUI = function () {
		for (var i = 0; i < this.m_dlgs.length; i++) {
			this.m_dlgs[i].flash();
		}
	}
})(BTG);