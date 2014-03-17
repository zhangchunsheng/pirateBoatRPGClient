var CircleSprite = cc.Sprite.extend({
	_radians: 0,
	ctor: function() {
		this._super();
	},
	draw: function() {
		cc.renderContext.fillStyle = "rgba(255,255,255,1)";
		cc.renderContext.strokeStyle = "rgba(255,255,255,1)";
		
		if(this._radians < 0)
			this._radians = 360;
		cc.drawingUtil.drawCircle(cc.PointZero(), 30, cc.DEGREES_TO_RADIANS(this._radians), 60, true);
	},
	myUpdate: function(dt) {
		this._radians -= 6;
	}
});

var Helloworld = cc.Layer.extend({
	isMouseDown: false,
	helloImg: null,
	helloLabel: null,
	circle: null,
	sprite: null,
	
	init: function() {
		var selfPointer = this;
		
		this._super();
		
		var size = cc.Director.getInstance().getWinSize();
		
		var closeItem = cc.MenuItemImage.create(
			"res/CloseNormal.png",
			"res/CloseSelected.png",
			this,
			function() {
				history.go(-1);
			}
		);
		closeItem.setAnchorPoint(cc.p(0.5, 0.5));
		
		var menu = cc.Menu.create(closeItem);
		menu.setPosition(cc.PointZero());
		this.addChild(menu, 1);
		closeItem.setPosition(cc.p(size.width - 20, 20));
		
		this.helloLabel = cc.LabelTTF.create("Hello World", "Arial", 38);
		this.helloLabel.setPosition(cc.p(size.width / 2, 0));
		this.addChild(this.helloLabel, 5);
		
		var lazyLayer = new cc.LazyLayer();
		this.addChild(lazyLayer);
		
		this.sprite = cc.Sprite.create("res/HelloWorld.png");
		this.sprite.setPosition(cc.p(size.width / 2, size.height / 2));
		this.sprite.setScale(0.5);
		this.sprite.setRotation(180);
		
		lazyLayer.addChild(this.sprite, 0);
		
		var rotateToA = cc.RotateTo.create(2, 0);
		var scaleToA = cc.ScaleTo.create(2, 1, 1);
		
		this.sprite.runAction(cc.Sequence.create(rotateToA, scaleToA));
		
		this.circle = new CircleSprite();
		this.circle.setPosition(cc.p(40, size.height - 60));
		this.addChild(this.circle, 2);
		this.circle.schedule(this.circle.myUpdate, 1 / 60);
		
		this.helloLabel.runAction(cc.MoveBy.create(2.5, cc.p(0, size.height - 40)));
		
		this.setTouchEnabled(true);
		this.adjustSizeForWindow();
		lazyLayer.adjustSizeForCanvas();
		window.addEventListener("resize", function(event) {
			selfPointer.adjustSizeForWindow();
		});
		return true;
	},
	
	adjustSizeForWindow: function() {
		var margin = document.documentElement.clientWidth - document.body.clientWidth;
		if(document.documentElement.clientWidth < cc.originalCanvasSize.width) {
			cc.canvas.width = cc.originalCanvasSize.width;
		} else {
			cc.canvas.width = document.documentElement.clientWidth - margin;
		}
		if(document.documentElement.clientHeight < cc.originalCanvasSize.height) {
			cc.canvas.height = cc.originalCanvasSize.height;
		} else {
			cc.canvas.height = document.documentElement.clientHeight - margin;
		}
		
		var xScale = cc.canvas.width / cc.originalCanvasSize.width;
		var yScale = cc.canvas.height / cc.originalCanvasSize.height;
		if(xScale > yScale) {
			xScale = yScale;
		}
		cc.canvas.width = cc.originalCanvasSize.width * xScale;
		cc.canvas.height = cc.originalCanvasSize.height * yScale;
		var parentDiv = document.getElementById("Cocos2dGameContainer");
		if(parentDiv) {
			parentDiv.style.width = cc.canvas.width + "px";
			parentDiv.style.height = cc.canvas.height + "px";
		}
		cc.renderContext.translate(0, cc.canvas.height);
		cc.renderContext.scale(xScale, xScale);
		cc.Director.getInstance().setContentScaleFactor(xScale);
	},
	menuCloseCallback: function(sender) {
		cc.Director.getInstance().end();
	},
	onTouchesBegan: function(touches, event) {
		this.isMouseDown = true;
	},
	onTouchesMoved: function(touches, event) {
		if(this.isMouseDown) {
			if(touches) {
				//this.circle.setPosition(cc.p(touches[0].getLocation().x, touches[0].getLocation().y));
			}
		}
	},
	onTouchesEnded: function(touches, event) {
		this.isMouseDown = false;
	},
	onTouchesCancelled: function(touches, event) {
		console.log("onTouchesCancelled");
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