/**
 * 初始化
 * 作者：peter
 * 日期：2012-12-10
 */
var BTG = BTG || {};
BTG.maxWindowWidthSize = 1260;
BTG.canvasSize = cc.size(0, 0);

(function(BTG) {
	BTG.calculateWindowSize = function() {
		if (BTG.os == "pc") {
			BTG.windowSize.width = BTG.canvasSize.width = BTG.maxWindowWidthSize;
			BTG.windowSize.height = BTG.canvasSize.height = 640;
			return;
		}

		BTG.maxWindowWidthSize = 1260;
		var bodyWidth = window.innerWidth;
		var bodyHeight = window.innerHeight;
		
		
		BTG.canvasSize.width = bodyWidth - 20 ;
		BTG.canvasSize.height = bodyHeight;

		if (bodyHeight < 400)
			BTG.canvasSize.height = 400;
		if (bodyHeight > 640)
			BTG.canvasSize.height = 640;

		if (BTG.canvasSize.width > BTG.maxWindowWidthSize)
			BTG.canvasSize.width = BTG.maxWindowWidthSize;

		BTG.windowSize.width = BTG.canvasSize.width;
		BTG.windowSize.height = 640;

		BTG.screen_Scale = BTG.canvasSize.height / 640;
		 
		if(BTG.screen_Scale < 0.8)
			BTG.windowSize.width *= (1 / BTG.screen_Scale);
	};
	BTG.calculateCanvasSize = function () {
		this.calculateWindowSize();
		 
		var gameCanvas = document.getElementById("gameCanvas");
		gameCanvas.width = BTG.canvasSize.width;
		gameCanvas.height = BTG.canvasSize.height;
	};
})(BTG);