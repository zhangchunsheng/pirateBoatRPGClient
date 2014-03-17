/**
 * cocos2d配置
 * 作者：张春生
 * 日期：2012-12-04
 */
(function() {
	var d = document;
	var c = {
		COCOS2D_DEBUG: 2,
		box2d: false,
		showFPS: true,
		frameRate: 60,
		tag: "gameCanvas",
		engineDir: "cocos2d/",
		appFiles: [
			"js/resource.js",
			"js/index.js"
		]
	};
	window.addEventListener("DOMContentLoaded", function() {
		var s = d.createElement("script");
		if(c.SingleEngineFile && !c.engineDir) {
			s.src = c.SingleEngineFile;
		} else if(c.engineDir && !c.SingleEngineFile) {
			s.src = c.engineDir + "platform/jsloader";
		} else {
			alert("You must specify either the single engine file or the engine directory in 'cocos2d.js'");
		}
		d.body.appendChild(s);
		s.c = c;
		s.id = "cocos2d-html5";
	});
})();