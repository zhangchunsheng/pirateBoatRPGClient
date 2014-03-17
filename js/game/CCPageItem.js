var itemStateMode_Normal = 0;
var itemStateMode_Active = 1;
var itemStateMode_Disable = 2;
cc.PageItemBase = cc.Sprite.extend({
	_pMenu: null,
	m_pRoot: null,

	_tempFileName: null,
	_btnCallbackFuncObj: null,
	_btnCallbackFunc: null,

	_activeSpr: null,
	_disableSpr: null,
	_currentStateSpr: null,
	_currentState: itemStateMode_Normal,

	addChildByParam: function (param) {
		if (param instanceof cc.Node) {
			this.addChild(param);
		} else if (param instanceof Array) {
			for (var i = 0; i < param.length; i++) {
				this.addChild(param[i]);
			}
		}
	},

	_createFinal: function (menuNodeObj) {
		this._pMenu = menuNodeObj;
	},

	setButtonCallbackFunnc: function (callbackObj, callbackFunc) {
		this._btnCallbackFuncObj = callbackObj;
		this._btnCallbackFunc = callbackFunc;
	},

	_buttonDown: function (pSend) {
		if (this._callBackFunc) this._callBackFunc.call(this._callBackObj, pSend);
	},

	initWithLayout: function (layout) {
		if (typeof layout == "string") {
			h5_LoadUILayout("res/layoutUI/" + layout, this);
		}
	},
	onLoadFinal: function () {
		this.initWithFile(this._tempFileName);
		this.setOpacity(255);
	},

	proLoadRes: function (file) {
		this._tempFileName = file;
		rpgGame.preLoadRes(file, this.onLoadFinal, this);
	},
	copy: function (parNode) {
		var item = cc.PageItemBase.createWithTexture(this.getTexture());
		item.setUserData(this.getUserData());
		var localPos = cc.p(this.getPosition().x, this.getPosition().y);
		if (parNode) {
			localPos = parNode.convertToNodeSpace(this.getParent().convertToWorldSpace(this.getPosition()));
			parNode.addChild(item, BTG.GZOrder_Top);
		}
		item.setPosition(localPos);
		return item;
	}
})

cc.PageItemBase.create = function (file, size, tag) {
	var a = new cc.PageItemBase();
	a.setOpacity(0);
	if (size) a.setContentSize(cc.size(size.width, size.height));
	if (tag) a.setTag(tag);
	else a.setTag(BTG.DefineTag_TipItemIcon);
	a.proLoadRes(file);
	return a;
}
cc.PageItemBase.createWithTexture = function (tex, tag, param0) {
	var a = new cc.PageItemBase();
	a.initWithTexture(tex);
	if (tag) a.setTag(tag);
	else a.setTag(BTG.DefineTag_TipItemIcon);
	if (param0) a.addChildByParam(param0);
	return a;
}
cc.PageItemBase.createWithSprite = function (spr, param0, needChild) {
	var a = new cc.PageItemBase();
	a.initWithTexture(spr.getTexture());
	a.setPosition(cc.p(spr.getPosition().x, spr.getPosition().y));
	a.setTag(BTG.DefineTag_TipItemIcon);
	if (param0) a.addChildByParam(param0);
}
cc.PageItemBase.createWithParam = function (param0, tag) {
	var a = new cc.PageItemBase;
	if (a) {
		a.addChildByParam(param0);
		a.setTag(tag);
	}

	return a;
}

//tipItem
//
//function sItemAttr() {
//    canUse = true;
//    useTarget = BTG.GameData.NotDef;//不填通用 0 都能用 1 主角 2 副将
//    needJob = BTG.GameData.NotDef;//不填通用 0 战士 1 弓箭手 2 法师
//    quality = 0;
//    needLv = 1;
//    type = -1;
//    count = 0;
//    _id = -1;
//    resId = -1;
//}
var itemIn_Package = 0;
var itemIn_TempPackage = 1;
var itemIn_EquipPackage = 2;
cc.PageTipItem = cc.PageItemBase.extend({
	_tipId: "DlgPackageItemTip",
	_itemData: null,
	_itemInPlace: itemIn_Package,
	showTip: function () {
		if (this._tipId == null) return;
		tipPos = this.getParent().convertToWorldSpace(this.getPosition());
		return rpgGame.getUIUtil().add(this._tipId, this);
	},
	isInTempPackage: function () {
		return this._itemInPlace === itemIn_TempPackage;
	},
	copy: function (parNode, order, tag) {
		var item = cc.PageTipItem.createWithTexture(this.getTexture());
		item.setUserData(this.getUserData());
		var localPos = cc.p(this.getPosition().x, this.getPosition().y);
		if (parNode) {
			localPos = parNode.convertToNodeSpace(this.getParent().convertToWorldSpace(this.getPosition()));
			parNode.addChild(item, order, tag);
		}
		item.setPosition(localPos);
		item.setScale(this.getScale());
		return item;
	}
})

cc.PageTipItem.create = function (file, size, tag) {
	var a = new cc.PageTipItem();
	a.setOpacity(0);
	a.setTag(tag != null ? tag : BTG.DefineTag_TipItemIcon);
	if (size) a.setContentSize(cc.size(size.width, size.height));
	a.proLoadRes(file);
	return a;
}

cc.PageTipItem.createWithFile = function (file, size, tag) {
	var a = new cc.PageTipItem();
	a.setOpacity(0);
	a.setTag(tag != null ? tag : -1);
	if (size) a.setContentSize(cc.size(size.width, size.height));
	var spr = BTG.ProxySprite.create("res/icon/" + file + ".jpg", null, null, 1, null, a, a.onFinishLoad);
	return spr;
}
cc.PageTipItem.createWithSprite = function (spr, tipId, param0) {
	var a = new cc.PageTipItem();

	if (a.initWithTexture(spr.getTexture())) {
		a.setPosition(cc.p(spr.getPosition().x, spr.getPosition().y));
		a.setTag(BTG.DefineTag_TipItemIcon);
		if (param0) a.addChildByParam(param0);

		if (tipId) a._tipId = tipId;
		return a;
	}

	return null;
}
cc.PageTipItem.createWithTexture = function (tex, tag, param0) {
	var a = new cc.PageTipItem();
	if (a.initWithTexture(tex)) {
		if (tag) a.setTag(tag);
		else a.setTag(BTG.DefineTag_TipItemIcon);
		if (param0) a.addChildByParam(param0);
	}
	return a;
}

cc.PagePlayerItem = cc.PageTipItem.extend({
	_playerResId: null,
	_actorUI: null,

	createActor: function (resId, parNode) {
		this._playerResId = resId;
		var pos = cc.p(this.getContentSize().width / 2, 0);
		this._actorUI = rpgGame.getCharacterUtil().createUICharacter(resId, pos, undefined, parNode == undefined ? this : parNode);
		//var rect = this._actorUI.GetRect();
		//this.setContentSize(this._actorUI.getRoot().getContentSize());
		//this._actorUI.setZOrder(BTG.GZOrder_Top);
		//this._actorUI.lockZorder(true,-1);
		this._actorUI.setDirection(BTG.ARSD_Right);
		return this._actorUI;
	},

	copy: function (parNode) {
		var conSize = this.getContentSize();
		var item = cc.PagePlayerItem.create(conSize, this._playerResId);

		item.setUserData(this.getUserData());
		var localPos = cc.p(this.getPosition().x, this.getPosition().y);
		if (parNode != undefined) {
			if (this.getParent() == null) cc.log("copy item parent is null");
			else localPos = parNode.convertToNodeSpace(this.getParent().convertToWorldSpace(localPos));
			parNode.addChild(item, BTG.GZOrder_Top);
		}
		item.setPosition(localPos);

		//item.setOpacity(0);
		//item._actorUI = c;

		return item;
	},
	remove: function () {
		rpgGame.getCharacterUtil().delForObject(this._actorUI);
	},
	setOpacity: function (value) {
		if (this._actorUI) {
			this._super(0);
			this._actorUI.SetAlpha(value);
		} else this._super(value);
	}
})
cc.PagePlayerItem.create = function (size, playerResId) {
	var a = new cc.PagePlayerItem();

	if (a.init()) {
		a.setContentSize(size);
		a.setAnchorPoint(cc.p(0.5, 0));
		a.setOpacity(0);
		if (playerResId != undefined) a.createActor(playerResId)
		return a;
	}
}

cc.PagePlayerItem.createWithTexture = function (tex, playerResId) {
	var a = new cc.PagePlayerItem();

	if (a.initWithTexture(tex)) {
		if (playerResId != undefined) a.createActor(playerResId);
		//a.setAnchorPoint(cc.p(0.5, 0));
		return a;
	}

}
//cc.PagePlayerItem.createWithTexture_ = function (tex, playerResId) {
//    var a = new cc.PagePlayerItem();
//    var spr = new cc.Sprite();
//    if (spr.initWithTexture(tex)) {
//        if (playerResId != undefined)
//            a.createActor(playerResId);
//        var conSize = spr.getContentSize();
//        if (a.initWithColor(cc.c4(0, 0, 0, 0), conSize.width, conSize.height)) {
//            a.ignoreAnchorPointForPosition(false);
//            a.setAnchorPoint(cc.p(0.5, 0.5));
//            spr.setPosition(cc.p(conSize.width / 2, conSize.height / 2));
//            a.addChild(spr);
//            return a;
//        }
//    }

//}