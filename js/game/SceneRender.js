(function(BTG) {
	BTG.SceneRender = function() {
		this.m_fSpeed = 0.5;

		this.m_nChangeSceneState = null;
		this.m_blackColorAlpha = 0;
		this.m_blackColor = cc.LayerColor.create(cc.c4(0, 0, 0, 0), BTG.windowSize.width * 1.5, BTG.windowSize.height);
		this.m_blackColor.setVisible(false);
		rpgGame.getGameRoot().addChild(this.m_blackColor, BTG.GZOrder_Top);

		this.xmlObj = 0;
		this.rootNode = 0;
		this.sceneId = 0;
		this.map = null;
	}

	BTG.SceneRender.prototype.changeScene = function () {
		this.m_nChangeSceneState = "add";
		if (this.rootNode === 0) {
			this.m_blackColorAlpha = 255;
		}
		this.m_blackColor.setVisible(true);
	}
	BTG.SceneRender.prototype.update = function (ftime) {
		if (this.m_nChangeSceneState === null)
			return;
		switch (this.m_nChangeSceneState) {
			case "add":
				this.m_blackColorAlpha += ftime * 255 * 2;
				break;
			case "create":
				this.m_blackColorAlpha += ftime * 255 * 2;
				if (this.m_blackColorAlpha >= 255) {
					rpgGame.getGameScene().callbackSceneChangeEnd();
					this.realCreate();
					this.m_nChangeSceneState = "sub"
					rpgGame.m_pLoadImage.end();
				}
				break;
			case "sub":
				this.m_blackColorAlpha -= ftime * 255 * 0.5;
				if (this.m_blackColorAlpha < 0) {
					this.m_nChangeSceneState = null;
					rpgGame.getFilm().setEnterMap(rpgGame.getGameScene().getGameID());
				}
				break;
		}

		if (this.m_blackColorAlpha > 255)
			this.m_blackColorAlpha = 255;
		if (this.m_blackColorAlpha < 0)
			this.m_blackColorAlpha = 0;

		this.m_blackColor.setOpacity(0 | this.m_blackColorAlpha);
	}
	BTG.SceneRender.prototype.updateBk = function (scenePosX, scenePosY) {
		if(this.map == null)
			return;
		var tPos = this.map.getPosition();
		this.map.setPosition(cc.p(-scenePosX * this.m_fSpeed, scenePosY * this.m_fSpeed));
	}
	BTG.SceneRender.prototype.realCreate = function () {
		if(this.rootNode == 0) {
			return;
		}
		//for (var i = 0; i < 3; i++) {
		//	var p = rpgGame.getCharacterUtil().add("xxx", BTG.CharacterType_Other, 7, 0, cc.p(50 + k * 100, 100 + i * 150));
		//}
		rpgGame.getGameScene().createNpc_Monster();
		if(this.map) {
			this.rootNode.removeChild(this.map, true);
			this.map = null;
		}

		this.map = rpgGame.getGameScene().getMap();
		//this.map.setPosition(new cc.Point(-contentSize.width / 2, -contentSize.height / 2));
		//this.map.setPosition(new cc.Point(-Math.round(contentSize.width * Math.sin(Math.PI / 4)), -Math.round(contentSize.height  * Math.sin(Math.PI / 4))));
		//this.map.setAnchorPoint(new cc.Point(0.1, 0.3));
		var layer = 0;
		this.rootNode.addChild(this.map, layer);
	}
	BTG.SceneRender.prototype.setMap = function(map) {
		this.map = map;
	}

	BTG.SceneRender.prototype.create = function (xmlObj, map, rootNode, sceneId) {
		this.xmlObj = xmlObj;
		this.map = map;
		this.rootNode = rootNode;
		this.sceneId = sceneId;
	}
	
	BTG.SceneRender.prototype.setChangeSceneState = function() {
		this.m_nChangeSceneState = "create";
	}
})(BTG);