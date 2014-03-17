(function() {
	var d = document;
	var c = {
		COCOS2D_DEBUG: 2,
		box2d: false,
		showFPS: true,
		frameRate: 60,
		tag: "gameCanvas",
		engineDir: "../../cocos2d2.0/",
		appFiles: [
			"../../js/map2.0/CCBTGRenderTexture.js",
			"../../js/map2.0/CCBTGSpriteBatchNode.js",
			"../../js/map2.0/CCBTGTMXLayer.js",
			"../../js/map2.0/CCBTGTMXXMLParser.js",
			"../../js/map2.0/CCBTGTMXTiledMap.js",
			"../../js/map2.0/CCBTGTMXObjectGroup.js",
			"src/resource.js",
			"src/myApp.js"
		],
		webgl: true,
		mainFile: "main.js"
	};
	window.addEventListener("DOMContentLoaded", function() {
		var s = d.createElement("script");
		if(c.SingleEngineFile && !c.engineDir) {
			s.src = c.SingleEngineFile;
		} else if(c.engineDir && !c.SingleEngineFile) {
			s.src = c.engineDir + "platform/jsloader.js";
		} else {
			alert("You must specify either the single engine file or the engine directory in 'cocos2d.js'");
		}
		document.ccConfig = c;
		d.body.appendChild(s);
		s.c = c;
		s.id = "cocos2d-html5";
	});
})();