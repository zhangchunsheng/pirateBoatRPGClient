/**
 * 应用入口文件
 * 作者：张春生
 * 日期：2012-12-04
 */
var BTG = BTG || {};
var rpgGame = new BTG.RPGGame();

BTG.RPGGameLayer = cc.Layer.extend({
	ctor: function () {
		cc.associateWithNative(this, cc.Layer);
	},
	registerWithTouchDispatcher: function () {
		cc.Director.getInstance().getTouchDispatcher().addStandardDelegate(this, cc.MENU_HANDLER_PRIORITY);
	},
	onTouchesBegan: function (touch, event) {
		var pos = touch[0].getLocation();
		rpgGame.touchBegin(pos);
		return true;
	},
	onTouchesMoved: function (touch, event) {
		var pos = touch[0].getLocation();
		rpgGame.touchMove(pos);
		return true;
	},
	onTouchesEnded: function(touch, event) {//ccTouchBegan
		if(touch[0] === undefined)
			return true;
		var pos = touch[0].getLocation();
		rpgGame.touchEnd(pos);
		return true;
	},
	init: function() {
		this._super();
		this.setTouchEnabled(true);
		
		this.ignoreAnchorPointForPosition(false);
		this.setAnchorPoint(cc.p(0, 0.0));
		if (BTG.screen_Scale < 0.8) {
			this.setScale(BTG.screen_Scale);
		}
		rpgGame.init(this);
		this.scheduleUpdate();
		return true;
	},
	update: function (dt) {
		if(dt > 0.3)
			dt = 0.3;
		if(cc.config.isApp)
			updateTimeOut(dt);
		rpgGame.update(dt);
	}
});

BTG.RPGGameScene = cc.Scene.extend({
	onEnter: function() {
		this._super();
		var layer = new BTG.RPGGameLayer();
		layer.init();
		this.addChild(layer);
	}
});