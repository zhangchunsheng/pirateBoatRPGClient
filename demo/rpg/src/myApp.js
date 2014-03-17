var Helloworld = cc.Layer.extend({
	sprite: null,
	spriteFrameNamePrefix: "run",
	spriteFrameIndex: 1,
	init: function() {
		this._super();
		var size = cc.Director.getInstance().getWinSize();
		//this.initWithColor(new cc.Color4B(0, 0, 0, 255));
		var cache = cc.SpriteFrameCache.getInstance();
		cache.addSpriteFrames("res/1.plist", "res/1.png");
		
		var map = cc.TMXTiledMap.create(s_tmx2);
		//var map = cc.TileMapAtlas.create(s_png1, s_tmx1, 120, 90);
		var mapSize = map.getMapSize();
		var tileSize = map.getTileSize();
		cc.log(mapSize);//height: 40 width: 40
		cc.log(tileSize);//height: 46 width: 88
		map.setPosition(new cc.Point(-100, -100));
		//map.setAnchorPoint(new cc.Point(mapSize.height * tileSize.height / 2, mapSize.width * tileSize.width / 2));
		//this.schedule(this.updateMap, 0.2);
		this.addChild(map);
		
		this.sprite = cc.Sprite.createWithSpriteFrameName(this.spriteFrameNamePrefix + "0001.png");
		this.sprite.setPosition(new cc.Point(300, 300));
		this.sprite.setScale(1);
		this.sprite.setFlipX(true);
		this.addChild(this.sprite);
		
		this.setKeyboardEnabled(true);
		return this;
	},
	onKeyUp: function(e) {
		
	},
	onKeyDown: function(e) {
		if(e == cc.KEY.left || e == cc.KEY.right) {
			var prevPrefix = this.spriteFrameNamePrefix;
			if(e == cc.KEY.left) {
				this.spriteFrameNamePrefix = "run";
			} else {
				this.spriteFrameNamePrefix = "run";
			}
			if(prevPrefix !== this.spriteFrameNamePrefix)
				this.spriteFrameIndex = 0;
			
			if(this.spriteFrameIndex > 8)
				this.spriteFrameIndex = 1;
			var indexAsString;
			if(this.spriteFrameIndex < 10)
				indexAsString = "000" + this.spriteFrameIndex.toString();
			else
				indexAsString = "00" + this.spriteFrameIndex.toString();
			
			this.removeChild(this.sprite);
			this.sprite = cc.Sprite.createWithSpriteFrameName(
				this.spriteFrameNamePrefix + indexAsString + ".png"
			);
			
			this.sprite.setPosition(new cc.Point(300, 300));
			this.sprite.setScale(1);
			this.sprite.setFlipX(true);
			this.addChild(this.sprite);
			this.spriteFrameIndex++;
		}
	},
	onTouchBegan: function(e) {
		
	},
	onTouchCancelled: function(e) {
		
	},
	onTouchEnded: function(e) {
		
	},
	onTouchMoved: function(e) {
		
	}
});

var HelloWorldScene = cc.Scene.extend({
	onEnter: function() {
		this._super();
		var layer = new Helloworld();
		layer.init();
		this.addChild(layer);
	}
});