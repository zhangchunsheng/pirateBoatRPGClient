(function(BTG) {
	BTG.SceneRender = function() {
		this.m_pImage = [0, 0, 0, 0];
		this.m_fSpeed = [0.5, 0.75, 1, 1];

		this.m_nChangeSceneState = null;
		this.m_blackColorAlpha = 0;
		this.m_blackColor = cc.LayerColor.create(cc.c4(0, 0, 0, 0), BTG.windowSize.width * 1.5, BTG.windowSize.height);
		this.m_blackColor.setVisible(false);
		rpgGame.getGameRoot().addChild(this.m_blackColor, BTG.GZOrder_Top);

		this.jsonObj = 0;
		this.rootNode = 0;
		this.sceneId = 0;
	}

	BTG.SceneRender.sky = 0;
	BTG.SceneRender.mid = 1;
	BTG.SceneRender.scene = 2;
	BTG.SceneRender.front = 3;
	BTG.SceneRender.count = 4;

	BTG.SceneRender.prototype.changeScene = function () {
		this.m_nChangeSceneState = "add";
		if (this.rootNode === 0) {
			this.m_blackColorAlpha = 255;
		}
		rpgGame.m_pLoadImage.begin();
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
	BTG.SceneRender.prototype.updateBk = function (scenePosX) {
		for (var i = 0; i < BTG.SceneRender.count; i++) {
			if (this.m_pImage[i] == 0)
				continue;
			if (this.m_fSpeed[i] == 1)
				continue;
			var tPos = this.m_pImage[i].getPosition();
			this.m_pImage[i].setPosition(cc.p(-scenePosX * this.m_fSpeed[i], tPos.y));
		}
	}
	BTG.SceneRender.prototype.getFileName = function (jsonObj, sceneId) {
		var m_file = new Array(BTG.SceneRender.count);
		for (var i = 0; i < BTG.SceneRender.count; i++)
		m_file[i] = null;
		if (jsonObj[0]["di"] === undefined) {//html
			m_file[BTG.SceneRender.scene] = "res/scene/" + sceneId + "/scene" + sceneId + ".jpg";
		} else {//pc
			m_file[BTG.SceneRender.scene] = "res/scene_pc/" + sceneId + "/" + jsonObj[0]["di"];
			if (jsonObj[0]["skyY"] !== undefined)
				m_file[BTG.SceneRender.sky] = "res/scene_pc/" + sceneId + "/" + jsonObj[0]["skyY"];
			if (jsonObj[0]["di"] !== undefined)
				m_file[BTG.SceneRender.mid] = "res/scene_pc/" + sceneId + "/" + jsonObj[0]["di"];
			if (jsonObj[0]["qian"] !== undefined)
				m_file[BTG.SceneRender.front] = "res/scene_pc/" + sceneId + "/" + jsonObj[0]["qian"];
		}
		return m_file;
	}
	BTG.SceneRender.prototype.realCreate = function () {
		//for (var i = 0; i < 3; i++) {
		//	var p = rpgGame.getCharacterUtil().add("xxx", BTG.CharacterType_Other, 7, 0, cc.p(50 + k * 100, 100 + i * 150));
		//}
		rpgGame.getGameScene().createNpc_Monster();
		for (var i = 0; i < BTG.SceneRender.count; i++) {
			if (this.m_pImage[i]) {
				this.rootNode.removeChild(this.m_pImage[i], true);
				this.m_pImage[i] = 0;
			}
		}

		var fileName = this.getFileName(this.jsonObj, this.sceneId);
		var pSpr = {};
		var copyNum = 2;
		var conSize = {};
		var pSpr_copy = [];
		var layer = 0;
		for (var i = 0; i < BTG.SceneRender.count; i++) {
			if (fileName[i] === null)
				continue;
			this.m_pImage[i] = cc.Sprite.create(fileName[i]);
			pSpr = this.m_pImage[i];
			copyNum = 0;
			pSpr_copy = [];
			cc.log(pSpr.getContentSize());

			layer = 0;
			if (i === BTG.SceneRender.front)
				layer = BTG.GZOrder_Effect;
			this.rootNode.addChild(pSpr, layer);
			switch (i) {
				case BTG.SceneRender.sky:
					copyNum = 0;
				case BTG.SceneRender.mid:
					pSpr.setPosition(cc.p(0, BTG.windowSize.height));
					pSpr.setAnchorPoint(cc.p(0, 1));
					conSize = pSpr.getContentSize();
					for(var j = 0 ; j < copyNum ; j++) {
						pSpr_copy[j] = copySprite(pSpr);
						pSpr_copy[j].setPosition(cc.p(conSize.width * (j + 1), pSpr.getPosition().y));
						pSpr_copy[j].setAnchorPoint(cc.p(0, 1));
						cc.log(pSpr_copy[j]);
						this.rootNode.addChild(pSpr_copy[j], layer);
					}
					break;
				case BTG.SceneRender.scene:
				case BTG.SceneRender.front:
					pSpr.setAnchorPoint(cc.p(0, 0));
					for(var j = 0 ; j < copyNum ; j++) {
						pSpr_copy[j] = copySprite(pSpr);
						pSpr_copy[j].setPosition(cc.p(conSize.width * (j + 1), pSpr.getPosition().y));
						pSpr_copy[j].setAnchorPoint(cc.p(0, 0));
						cc.log(pSpr_copy[j]);
						this.rootNode.addChild(pSpr_copy[j], layer);
					}
					break;
			}
		}
	}

	BTG.SceneRender.prototype.create = function (jsonObj, rootNode, sceneId) {
		this.jsonObj = jsonObj;
		this.rootNode = rootNode;
		this.sceneId = sceneId;
		this.m_nChangeSceneState = "create";
	}

	BTG.SceneRender.prototype.getPreLoadImageFN = function (jsonObj, sceneId) {
		return this.getFileName(jsonObj, sceneId);
	}
})(BTG);