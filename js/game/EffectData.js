(function(BTG) {
	function EffectTextureKey() {
		this.m_time = undefined;
		this.m_pos = undefined;
		this.m_rot = undefined;
		this.m_xsize = undefined;
		this.m_ysize = undefined;
		this.m_alpha = undefined;
		this.m_color3 = undefined;
		this.m_xskew = undefined;
		this.m_yskew = undefined;
	};

	function EffectAni() {
		this.m_timeStrip = 0;
		this.m_count = 0;
	};

	BTG.EffectData = function() {
		this.m_effectType = BTG.SE_Texture;
		this.m_fileName = "";
		this.m_isWhile = false;
		this.m_childEffectFNArray = null;
		this.m_isLiang = 0;
		this.m_gColor = undefined;

		this.m_pImageArray = null;
		this.m_isLoadFinal = false;

		this.m_pAniData = null; //特效数据，动画数据sEffectAni
		this.m_pTextureKeyData = null; //关键贞sEffectTextureKey 
		this.m_lerpData = new EffectTextureKey();

		this.m_uvDir = null; // 's x z y'
		this.m_uvSpeed = 0;
		this.m_isSelfRot = false;
	};

	BTG.EffectData.prototype.getAniKey = function (effectPlayObj) {
		var curFrame = Math.floor(effectPlayObj.m_runTime);
		if (curFrame > this.m_pAniData.m_count - 1) {
			if (this.m_isWhile) {
				effectPlayObj.m_runTime = 0;
				curFrame = 0;
			} else {
				curFrame = this.m_pAniData.m_count - 1;
				effectPlayObj.stop();
			}
		}
		return curFrame;
	}

	BTG.EffectData.prototype.getTextureKey = function (effectPlayObj) {
		var tempList = this.m_pTextureKeyData;

		var startIdx = -1;
		for (var i = 1; i < tempList.length; i++) {
			if (effectPlayObj.m_runTime <= tempList[i].m_time) {
				startIdx = i;
				break;
			}
		}

		if (startIdx == -1) {
			if (this.m_isWhile == 0) {
				effectPlayObj.stop();
				return tempList[tempList.length - 1];
			} else {
				effectPlayObj.m_runTime = 0;
				startIdx = 1;
			}
		}

		var pStart = tempList[startIdx - 1];

		var pEnd = tempList[startIdx];

		if (this.m_lerpData.m_pos != undefined) {
			this.m_lerpData.m_pos.x = BTG.LerpCharacter(pStart.m_pos.x, pEnd.m_pos.x, effectPlayObj.m_runTime, pStart.m_time, pEnd.m_time);
			this.m_lerpData.m_pos.y = BTG.LerpCharacter(pStart.m_pos.y, pEnd.m_pos.y, effectPlayObj.m_runTime, pStart.m_time, pEnd.m_time);
		}

		if (this.m_lerpData.m_rot != undefined) {
			this.m_lerpData.m_rot = BTG.LerpCharacter(pStart.m_rot, pEnd.m_rot, effectPlayObj.m_runTime, pStart.m_time, pEnd.m_time);
		}

		if (this.m_lerpData.m_xsize != undefined) {
			this.m_lerpData.m_xsize = BTG.LerpCharacter(pStart.m_xsize, pEnd.m_xsize, effectPlayObj.m_runTime, pStart.m_time, pEnd.m_time);
		}

		if (this.m_lerpData.m_ysize != undefined) {
			this.m_lerpData.m_ysize = BTG.LerpCharacter(pStart.m_ysize, pEnd.m_ysize, effectPlayObj.m_runTime, pStart.m_time, pEnd.m_time);
		}

		if (this.m_lerpData.m_xskew != undefined) {
			this.m_lerpData.m_xskew = BTG.LerpCharacter(pStart.m_xskew, pEnd.m_xskew, effectPlayObj.m_runTime, pStart.m_time, pEnd.m_time);
		}

		if (this.m_lerpData.m_yskew != undefined) {
			this.m_lerpData.m_yskew = BTG.LerpCharacter(pStart.m_yskew, pEnd.m_yskew, effectPlayObj.m_runTime, pStart.m_time, pEnd.m_time);
		}

		if (this.m_lerpData.m_alpha != undefined) {
			this.m_lerpData.m_alpha = BTG.LerpCharacter(pStart.m_alpha, pEnd.m_alpha, effectPlayObj.m_runTime, pStart.m_time, pEnd.m_time);
		}

		if (this.m_lerpData.m_color3 != undefined) {
			this.m_lerpData.m_color3.r = BTG.LerpCharacter(pStart.m_color3.r, pEnd.m_color3.r, effectPlayObj.m_runTime, pStart.m_time, pEnd.m_time);
			this.m_lerpData.m_color3.g = BTG.LerpCharacter(pStart.m_color3.g, pEnd.m_color3.g, effectPlayObj.m_runTime, pStart.m_time, pEnd.m_time);
			this.m_lerpData.m_color3.b = BTG.LerpCharacter(pStart.m_color3.b, pEnd.m_color3.b, effectPlayObj.m_runTime, pStart.m_time, pEnd.m_time);
		}

		return this.m_lerpData;
	}

	BTG.EffectData.prototype.isLoadFinal = function () {
		return this.m_isLoadFinal;
	}

	BTG.EffectData.prototype.create = function (effectFileName) {
		this.m_fileName = effectFileName;
		var fullPath = "res/effect/" + effectFileName;
		loadEffect(fullPath, this);
	}

	BTG.EffectData.prototype._init = function (jsonObj) {
		if (jsonObj[0]["child"]) {
			this.m_childEffectFNArray = jsonObj[0]["child"].split("|", 5);
		}
		if (jsonObj[0]["rotType"]) this.m_isSelfRot = parseInt(jsonObj[0]["rotType"]) === 1;
		if (jsonObj[0]["uv"]) {
			var uvArr = jsonObj[0]["uv"].split("|", 2);
			this.m_uvDir = uvArr[0]; // 's x z y'
			this.m_uvSpeed = parseInt(uvArr[1]);
		}
		this.m_isWhile = parseInt(jsonObj[0]["while"]);
		this.m_isLiang = parseInt(jsonObj[0]["liang"]);
		//cc.alert("2len:" + jsonObj.length);
		var valueArray = jsonObj[0]["color"].split("|", 3);
		var tempGColor = cc.c3(parseInt(valueArray[0]), parseInt(valueArray[1]), parseInt(valueArray[2]));

		if (tempGColor.r != 255 || tempGColor.g != 255 || tempGColor.b != 255)
			this.m_gColor = tempGColor;

		if (jsonObj[0]["type"] == "ani") {
			this.m_effectType = BTG.SE_Sequence;
			this._CreateAni(jsonObj);
		} else {
			this.m_effectType = BTG.SE_Texture;
			this._createTexutre(jsonObj);
		}
		this.m_isLoadFinal = true;
	}

	BTG.EffectData.prototype._createTexutre = function (jsonObj) {
		this.m_pImageArray = new Array(1);
		this.m_pImageArray[0] = cc.Sprite.create("res/effect/" + jsonObj[0].image);

		if (cc.config.isApp) {//本地应用中如果不添加到根节点中，下贞会被删除。。。 你妹的
			this.m_pImageArray[0].setVisible(false);
			rpgGame.getGameRoot().addChild(this.m_pImageArray[0]);
		}
		this.m_pTextureKeyData = new Array(jsonObj.length - 1);
		//data
		for (var i = 1; i < jsonObj.length; i++) {
			this.m_pTextureKeyData[i - 1] = new EffectTextureKey();
			var tempKey = this.m_pTextureKeyData[i - 1];
			if (jsonObj[i].time == undefined)
				cc.alert(this.m_fileName + "texture effect no [time] key");

			tempKey.m_time = parseFloat(jsonObj[i].time);
			if (jsonObj[i].pos) {
				var valueArray = jsonObj[i].pos.split("|", 2);
				tempKey.m_pos = cc.p(parseFloat(valueArray[0]), parseFloat(valueArray[1]));
			}
			if (jsonObj[i].xscal) {
				tempKey.m_xsize = parseFloat(jsonObj[i].xscal);
			}
			if (jsonObj[i].yscal) {
				tempKey.m_ysize = parseFloat(jsonObj[i].yscal);
			}

			if (jsonObj[i].xskew) {
				tempKey.m_xskew = parseFloat(jsonObj[i].xskew);
			}
			if (jsonObj[i].yskew) {
				tempKey.m_yskew = parseFloat(jsonObj[i].yskew);
			}

			if (jsonObj[i].rot) {
				tempKey.m_rot = parseFloat(jsonObj[i].rot);
			}

			if (jsonObj[i].color) {
				var valueArray = jsonObj[i].color.split("|", 3);
				tempKey.m_color3 = cc.c3(parseInt(valueArray[0]), parseInt(valueArray[1]), parseInt(valueArray[2]));
			}
			if (jsonObj[i].alpha) {
				tempKey.m_alpha = parseInt(jsonObj[i].alpha);
			}
		}

		if(this.m_pTextureKeyData[0].m_pos != undefined)
			this.m_lerpData.m_pos = cc.p(this.m_pTextureKeyData[0].m_pos.x, this.m_pTextureKeyData[0].m_pos.y);
		this.m_lerpData.m_xsize = this.m_pTextureKeyData[0].m_xsize;
		this.m_lerpData.m_ysize = this.m_pTextureKeyData[0].m_ysize;
		this.m_lerpData.m_xskew = this.m_pTextureKeyData[0].m_xskew;
		this.m_lerpData.m_yskew = this.m_pTextureKeyData[0].m_yskew;
		this.m_lerpData.m_rot = this.m_pTextureKeyData[0].m_rot;
		if (this.m_pTextureKeyData[0].m_color3 != undefined)
			this.m_lerpData.m_color3 = cc.c3(this.m_pTextureKeyData[0].m_color3.r, this.m_pTextureKeyData[0].m_color3.g, this.m_pTextureKeyData[0].m_color3.b);
		this.m_lerpData.m_alpha = this.m_pTextureKeyData[0].m_alpha;
	}

	BTG.EffectData.prototype._createAni = function(jsonObj) {
		// image
		var effImage = cc.Sprite.create("res/effect/" + jsonObj[0].image);
		// cc.alert(effImage);
		var imageSize = effImage.getContentSize();
		var count = parseInt(jsonObj[0].count);

		var texWidth = imageSize.width / count;

		this.m_pImageArray = new Array(count);
		for (var i = 0; i < count; i++) {
			this.m_pImageArray[i] = cc.Sprite.createWithTexture(effImage.getTexture(),
			cc.RectMake(texWidth * i, 0, texWidth, imageSize.height));
			if (cc.config.isApp) {//本地应用中如果不添加到根节点中，下贞会被删除
				this.m_pImageArray[i].setVisible(false);
				rpgGame.getGameRoot().addChild(this.m_pImageArray[i]);
			}
		}
		// data
		this.m_pAniData = new EffectAni();
		this.m_pAniData.m_count = count;
		this.m_pAniData.m_timeStrip = parseFloat(jsonObj[0].time);
	}
})(BTG);