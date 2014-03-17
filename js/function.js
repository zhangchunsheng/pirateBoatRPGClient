/**
 * 函数
 * 作者：peter
 * 日期：2012-12-10
 */
function gameConfirm(msg, callback) {
    var confirmDlg = rpgGame.getUIUtil().add("DlgConfirm", msg);
    confirmDlg.setCallback(callback);
}

function gamePrompt(msg, isPlayer) {
    var root = null;
    var pos = null;
    if (isPlayer) {
        var player = rpgGame.getMainPlayer();
        pos = player.m_pImage.getHeadPosForNode();
        root = player.getRoot();
    }
    BTG.actionUtil.fadeOutWithScaleAndMove(msg, undefined, root, pos);
}

function setLockScreen(isLock) {
    if(isLock)
		rpgGame.lockGame();
    else
		rpgGame.unlockGame();
}

function isMainPlayer(docId) {
    return docId == rpgGame.getClientRole().getMainHero()._id;
}

var OST_App = -1;
var OST_Win32 = 0;
var OST_Mac = 1;
var OST_Nuix = 2;
var OST_iPad = 3;
var OST_Phone = 4;
var m_operSystem = -1;

if(cc.config.isApp == false) {
    if ((navigator.platform == "Win32") || (navigator.platform == "Windows"))
		m_operSystem = OST_Win32;
    else if ((navigator.platform == "Mac68k") || (navigator.platform == "MacPPC") || (navigator.platform == "Macintosh"))
		m_operSystem = OST_Win32;
    else if ((navigator.platform == "X11"))
		m_operSystem = OST_Nuix;
    else if (navigator.platform == "iPad")
		m_operSystem = OST_iPad;
    else
		m_operSystem = OST_Phone;
} else {
    m_operSystem = OST_App;
}

function isPc() {
    return m_operSystem < OST_iPad;
}

function getGameZOrder(szFlag) {
    return szFlag;
}

function calcZOrder(fPosY) {
    return BTG.GZOrder_Scene + (BTG.windowSize.height - fPosY);
}

function ptInTTF(clientViewPos, ttf) {
    var xOffset = 0,
        yOffset = 0;
    switch (ttf._hAlignment) {
        case cc.TEXT_ALIGNMENT_LEFT:
            xOffset = 0;
            break;
        case cc.TEXT_ALIGNMENT_RIGHT:
            xOffset = ttf._dimensions.width;
            break;
        case cc.TEXT_ALIGNMENT_CENTER:
            xOffset = ttf._dimensions.width / 2;
            break;
        default:
            break;
    }

    switch (ttf._vAlignment) {
        case cc.VERTICAL_TEXT_ALIGNMENT_TOP:
            yOffset = -ttf._dimensions.height;
            break;
        case cc.VERTICAL_TEXT_ALIGNMENT_CENTER:
            yOffset = -ttf._dimensions.height / 2;
            break;
        case cc.VERTICAL_TEXT_ALIGNMENT_BOTTOM:
            yOffset = 0;
            break;
        default:
            break;
    }

    var ttfPos = ttf.getParent().convertToWorldSpace(ttf.getPosition());
    var pos = cc.p(ttf._dimensions.width * ttf._anchorPoint.x + xOffset + ttfPos.x,
    ttfPos.y - (ttf._dimensions.height * ttf._anchorPoint.y + yOffset));

    var rect = cc.rect(pos.x, pos.y, ttf.getContentSize().width, ttf.getContentSize().height);
    return cc.Rect.CCRectContainsPoint(rect, clientViewPos)
}

function ptInNode(clientViewPos, tNode) {
    var localPos = tNode.convertToNodeSpace(clientViewPos);
    //cc.alert( "tag:"+ tNode.getTag()+ "pos:"+localPos.x);

    var conSize = tNode.getContentSize();
    if (localPos.x < 0) return 0;
    if (localPos.x > conSize.width) return 0;
    if (localPos.y < 0 || localPos.y > conSize.height) {
        return 0;
    }
    return 1;
}

function P2PDis(pos0, pos1) {
    return Math.sqrt((pos0.x - pos1.x) * (pos0.x - pos1.x) + (pos0.y - pos1.y) * (pos0.y - pos1.y));
}

function P2PDisNoSQ(pos0, pos1) {
    return (pos0.x - pos1.x) * (pos0.x - pos1.x) + (pos0.y - pos1.y) * (pos0.y - pos1.y);
}

function rectRandPoint(tRect) {
    return cc.p(Math.random() * (cc.Rect.CCRectGetMaxX(tRect) - cc.Rect.CCRectGetMinX(tRect)) + cc.Rect.CCRectGetMinX(tRect),
    Math.random() * (cc.Rect.CCRectGetMaxY(tRect) - cc.Rect.CCRectGetMinY(tRect)) + cc.Rect.CCRectGetMinY(tRect));
}

function rectToVertex2(rc) {
    var pRTMax = cc.p(rc.origin.x + rc.size.width, rc.origin.y + rc.size.height);
    var pLBMin = cc.p(rc.origin.x, rc.origin.y);
    return [pLBMin, pRTMax];
}

function rectUnion(rc0, rc1) {
    var pRc0 = rectToVertex2(rc0);
    var pRc1 = rectToVertex2(rc1);
}

function rectScale(tRect, scale) {
    scale *= 0.5;
    return cc.rect(tRect.origin.x + tRect.size.width * scale,
    tRect.origin.y + tRect.size.height * scale,
    tRect.size.width * scale,
    tRect.size.height * scale);
}

function pointLen(pos) {
    return Math.sqrt(pos.x * pos.x + pos.y * pos.y);
}

function calcDirAngle(dir0, dir1) {
    var d0 = pointLen(dir0);
    var d1 = pointLen(dir1);
    dir0.x /= d0;
    dir0.y /= d0;
    dir1.x /= d1;
    dir1.y /= d1;

    var _angle = Math.acos(dir0.x * dir1.x + dir0.y * dir1.y);
    _angle *= (180 / 3.1415);
    return -_angle;
}

function subPoint(pos0, pos1) {
    return cc.p(pos0.x - pos1.x, pos0.y - pos1.y);
}

function pointInPolygon(p, polyArray) {
    var nCross = 0;
    for(var i = 0; i < polyArray.length; i++) {
        var p1 = polyArray[i];
        var p2 = polyArray[(i + 1) % polyArray.length];

        //y=p.y与p1p2的交点
        if (p1.y == p2.y) //p1p2与y=p0.y平行
			continue;
        if (p.y < Math.min(p1.y, p2.y)) //交点在p1p2延长线上
			continue;
        if (p.y >= Math.max(p1.y, p2.y)) //交点在p1p2延长线上
			continue;

        //求交点的X坐标
        var x = (p.y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y) + p1.x;

        if (x > p.x)
			nCross++; // 只统计单边交点
    }
    //单边交点为偶数，点在多边形之外
    return (nCross % 2 == 1);
}

function addPoint(pos0, pos1) {
    return cc.p(pos0.x + pos1.x, pos0.y + pos1.y);
}

function lerpPoint(pos0, pos1, ftime) {
    return cc.p(pos0.x * (1 - ftime) + pos1.x * ftime, pos0.y * (1 - ftime) + pos1.y * ftime);
}

function copyRect(trect) {
    return cc.rect(trect.origin.x, trect.origin.y, trect.size.width, trect.size.height);
}

function copySprite(orgSprite, parRoot) {
    var pSpr = cc.Sprite.createWithTexture(orgSprite.getTexture());
    pSpr.setPosition(orgSprite.getPosition());
    if (parRoot) {
        parRoot.addChild(pSpr, orgSprite.getZOrder(), orgSprite.getTag());
    }
    return pSpr;
}

function copyTTF(orgTTF, parRoot) {
    var retTTF = cc.LabelTTF.create(
		orgTTF.getString(),
		orgTTF._fontName,
		orgTTF._fontSize,
		orgTTF._dimensions,
		orgTTF._hAlignment
	);
    retTTF.setPosition(orgTTF.getPosition());
    retTTF.setAnchorPoint(orgTTF.getAnchorPoint());
    if (parRoot) {
        parRoot.addChild(retTTF, orgTTF.getZOrder(), orgTTF.getTag());
    }
    return retTTF;
}

function copyMinTTF(orgTTF, parRoot) {
    var retTTF = cc.LabelTTF.create(orgTTF.getString(), orgTTF._fontName, orgTTF._fontSize);
    retTTF.setPosition(orgTTF.getPosition());
    retTTF.setAnchorPoint(orgTTF.getAnchorPoint());
    if (parRoot) {
        parRoot.addChild(retTTF, orgTTF.getZOrder(), orgTTF.getTag());
    }
    return retTTF;
}

function copyArray(tarray) {
    var p = new Array(tarray.length);
    for (var i = 0; i < tarray.length; i++)
    p[i] = tarray[i];

    return p;
}

function copyMenuItem(menuItemImage, callObj, callFun, parRoot) {
    var retBtn = new cc.MenuItemImage();
    var pNor = cc.Sprite.createWithTexture(menuItemImage.getNormalImage().getTexture());
    var pSel = cc.Sprite.createWithTexture(menuItemImage.getSelectedImage().getTexture());
    retBtn.initWithNormalSprite(pNor, pSel, null, callObj, callFun);
    retBtn.setPosition(menuItemImage.getPosition());

    if (parRoot) {
        parRoot.addChild(retBtn, menuItemImage.getZOrder(), menuItemImage.getTag());
    }
    return retBtn;
}

function getFunctionName(func) {
    if (typeof func == 'function' || typeof func == 'object') {
        var name = ('' + func).match(/function\s*([\w\$]*)\s*\(/);
    }
    return name && name[1];
}

function assert(bValue, strMsg) {
    if (!bValue) {
        if (!cc.config.isApp)
			console.log(bValue);
        else
			_appAssert(bValue);
        if(strMsg !== undefined)
			cc.alert(strMsg);
    }
}

function comFunction(propertyName) {
    return function (obj1, obj2) {
        var v1 = obj1[propertyName];
        var v2 = obj2[propertyName];
        if(v1 < v2)
			return -1;
        else
			return 1;
    }
}

function UIHelp_CreateScrollFormLayer(parNode, tLayer) {
    var m_pScrollLayer = cc.ScrollLayer.create();

    m_pScrollLayer.setPosition(tLayer.getPosition());
    m_pScrollLayer.setContentSize(tLayer.getContentSize());
    var zOrder = tLayer.getZOrder();
    tLayer.getParent().removeChild(tLayer, true);
    parNode.addChild(m_pScrollLayer, zOrder, BTG.DefineTag_ScrollLayer);

    return m_pScrollLayer;
}

function UIHelp_ReplaceCtrl(dest, src, srcCtrlTag) {
    var tNode = src.getChildByTag(srcCtrlTag);
    assert(tNode !== null);
    var worldPos = src.convertToWorldSpace(tNode.getPosition());
    var newPos = dest.convertToNodeSpace(worldPos);
    src.removeChild(tNode, false);
    dest.addChild(tNode, tNode.getZOrder(), srcCtrlTag);
    tNode.setTag(srcCtrlTag);
    tNode.setPosition(newPos);

    return tNode;
}

function UIHelp_TranslateLabels(parNode, tags, color) {
    for (var i = 0; i < tags.length; i++) {
        var child = parNode.getChildByTag(tags[i]);
        if (child instanceof cc.LabelTTF) {
            var userString = LGG(child.getString());
            if (userString == undefined)
				continue;
            child.setUserData(child.getString());
            child.setString(userString);
            if (color)
				child.setColor(color);
        }
    }
}

function UIHelp_SetLabelValue(table, parNode, tags, color) {
    for (var i = 0; i < tags.length; i++) {
        var child = parNode.getChildByTag(tags[i]);
        if (child instanceof cc.LabelTTF) {
            var key = child.getUserData();
            if (key == null) {
                key = child.getString();
                if (key == null)
					continue;
                child.setUserData(key);
            }

            var keyValue = table[key];
            if (keyValue != null)
				child.setString(keyValue.toString());
            if (color)
				child.setColor(color);
        }
    }
}

function addEnterToString(str, widthNums) {
    var ret = "\t\t\t\t";
    var k = 3;
    for (var i = 0; i < str.length; i++, k++) {
        ret += str[i];
        if (k + 1 >= widthNums) {
            ret += '\n';
            k = 0;
        }
    }
    return ret;
}

function getHeroEquipArray(heroId) {
    var equipTable = rpgGame.getClientRole().getHero(heroId).equipTable;
    var eqFlagArray6 = [0, 0, 0, 0, 0, 0];
    for (var i = 0; i < equipTable.length; i++) {
        if (equipTable[i] != null) {
            eqFlagArray6[equipTable[i].subType] = equipTable[i].resSuit;
        }
    }
    return eqFlagArray6;
}

function parseJson(strTxt) {
	var jsonObj = new Array();

	var strObject = strTxt.split("},", 200);
	for (var i = 0; i < strObject.length; i++) {
		if (strObject[i].length < 3)
			continue;

		var strMem = strObject[i].split(",", 50);
		var tempObj = new Object();
		jsonObj[jsonObj.length] = tempObj;
		for (var iMem = 0; iMem < strMem.length; iMem++) {
			if (strMem[iMem].length < 3)
				continue;

			var men_value = strMem[iMem].split("\"", 10);
			tempObj[men_value[1]] = men_value[3];
		}
	}
	return jsonObj;
}

//使用此函数的gameObj对象必须包含preLoadImage与init方法
function loadScene(jsonFileName, gameScene) {
	var m_jsonObj = null;

	var onPreLoadFinal_loadScene = function () {
		gameScene.init(m_jsonObj);
	}
	var onLoadJsonScript_loadScene = function (scene_file_buf) {
		var m_preLoad = new BTG.PreLoadMulRes2SingleFun(onPreLoadFinal_loadScene);
		m_jsonObj = parseJson(scene_file_buf);
		var resArray = gameScene.getPreLoadImageFN(m_jsonObj);

		for (var i = 0; i < resArray.length; i++) {
			if (!resArray[i])
				continue;
			m_preLoad.preImage(resArray[i]);
		}
		m_preLoad.endPre();
	}
	FileGet(jsonFileName, onLoadJsonScript_loadScene);
};

function loadTiledMap(tmxFileName, gameScene) {
	var map = null;

	var onPreLoadFinal_loadTiledMap = function (scene_file_buf) {
		cc.SAXParser.shareParser().preloadPlist(tmxFileName);
		map = cc.TMXTiledMap.create(tmxFileName);
		gameScene.setMap(map);
		gameScene.init(scene_file_buf);
	}
	var onLoadTMXMap_loadTileMap = function(scene_file_buf) {
		onPreLoadFinal_loadTiledMap(scene_file_buf);
	}
	FileGet(tmxFileName, onLoadTMXMap_loadTileMap);
};

function loadEffect(jsonFileName, effectObj) {
	var m_jsonObj = null;

	var onLoadFinal_loadEffect = function () {
		effectObj._init(m_jsonObj);
	}
	var onLoadJsonScript_loadEffect = function (scene_file_buf) {
		m_jsonObj = parseJson(scene_file_buf);
		//cc.alert("888" + effectObj.m_fileName + "|" + this.m_jsonObj[0].image);
		rpgGame.preLoadRes("res/effect/" + m_jsonObj[0].image, onLoadFinal_loadEffect);
	}
	FileGet(jsonFileName, onLoadJsonScript_loadEffect);
};

function loadCharacter(characterDirFileName, characterRunFileName, actorObj) {
	var m_xmlLayout = null;
	var m_loadCount = 0;
	var directName = characterDirFileName;
	var onLoadLayout_loadCharacter = function() {
		m_xmlLayout = cc.SAXParser.shareParser().parse(directName + ".plist");
		m_loadCount++;
		if (m_loadCount >= 2)
			actorObj.parseXmlData(m_xmlLayout);
	}

	var onLoad_loadCharacter = function (scene_file_buf) {
		m_loadCount++;
		if (m_loadCount >= 2)
			actorObj.parseXmlData(m_xmlLayout);
	}
	cc.SAXParser.shareParser().preloadPlist(directName + ".plist");
	onLoadLayout_loadCharacter();
	cc.log(directName + ".plist");
	//FileGet(directName + ".plist", onLoadLayout_loadCharacter);
	rpgGame.preLoadRes(directName + ".png", onLoad_loadCharacter);
}

function loadCharacterBoat(characterBoatDirFileName, actorObj) {
	var m_xmlLayout = {};
	var m_loadCount = 0;
	var directName = characterBoatDirFileName;
	var array = BTG.characterBoatAction;
	var onLoadLayout_loadCharacterBoat = function() {
		m_xmlLayout[array[m_loadCount]] = cc.SAXParser.shareParser().parse(directName + "_" + array[m_loadCount] + ".plist");
		m_loadCount++;
		if (m_loadCount >= array.length)
			actorObj.parseXmlData_boat(m_xmlLayout);
	}

	var onLoad_loadCharacterBoat = function (scene_file_buf) {
		if (m_loadCount >= array.length)
			actorObj.parseXmlData_boat(m_xmlLayout);
	}
	for(var i = 0 ; i < array.length ; i++) {
		cc.SAXParser.shareParser().preloadPlist(directName + "_" + array[i] + ".plist");
		onLoadLayout_loadCharacterBoat();
		cc.log(directName + "_" + array[i] + ".plist");
		//FileGet(directName + "_" + array[i] + ".plist", onLoadLayout_loadCharacterBoat);
		rpgGame.preLoadRes(directName + "_" + array[i] + ".png", onLoad_loadCharacterBoat);
	}
}

function loadCharacter_(characterDirFileName, actorObj) {
	var m_xmlLayout = null;
	var m_loadCount = 0;
	var directName = characterDirFileName;
	var onLoadLayout_loadCharacter = function(scene_file_buf) {
		m_xmlLayout = parseXmlFile(scene_file_buf);
		m_loadCount++;
		if (m_loadCount >= 2)
			actorObj.parseXmlData(m_xmlLayout);
	}

	var onLoad_loadCharacter = function (scene_file_buf) {
		m_loadCount++;
		if (m_loadCount >= 2)
			actorObj.parseXmlData(m_xmlLayout);
	}

	//cc.SAXParser.shareParser().preloadPlist(directName+".plist");
	//FileGet(directName + ".plist", onLoadXml);
	FileGet(directName + ".xml", onLoadLayout_loadCharacter);
	rpgGame.preLoadRes(directName + ".png", onLoad_loadCharacter);
}

function loadXML(xmlFileName, xmlUserObj) {
	var m_xmlLayout = null;
	var onLoad_loadXML = function (scene_file_buf) {
		m_xmlLayout = parseXmlFile(scene_file_buf, "text/xml");
		xmlUserObj.parseXmlData(m_xmlLayout);
	}
	FileGet(xmlFileName, onLoad_loadXML);
}

function loadString(jsonFileName, gameObj) {
	var onLoadJsonScripth5_loadString = function (scene_file_buf) {
		gameObj.onLoadJson(scene_file_buf);
	}
	FileGet(jsonFileName, onLoadJsonScripth5_loadString);
};

function parseXmlFile(xml_txt) {
	var retObj = new Object();
	var strLine = xml_txt.split("\n", 800);

	for(var i = 0; i < strLine.length; i++) {
		if(strLine[i].length < 8)
			continue;

		if(strLine[i].lastIndexOf("/>") === -1) {//attr
			var miniStr = strLine[i].split("<", 2);
			var key_value = miniStr[1].split(">", 2);
			retObj[key_value[0]] = key_value[1];
		} else {
			var miniStr = strLine[i].split(" ", 20);
			var startK = 0;
			while (1) {
				if (miniStr[startK].length < 2) {
					startK++;
					continue;
				}
				break;

			}
			var pTemp = new Object();
			retObj[miniStr[startK].slice(1)] = pTemp;
			for (var k = startK; k < miniStr.length; k++) {
				var key_value = miniStr[k].split("=", 3);
				if(key_value.length < 2)
					continue;
				pTemp[key_value[0]] = key_value[1].slice(1, key_value[1].length - 1);
			}
		}
	}
	return retObj;
}

function LoadingText() {
	this.m_bIsShow = false;

	this.m_pImage = new Array(this.ImageCount);
	this.m_showTime = 0;
	this.m_pImage = cc.LayerColor.create(cc.c4(0, 0, 0, 128), 400, 20);

	this.m_pImage.ignoreAnchorPointForPosition(false);
	this.m_pImage.setAnchorPoint(cc.p(0.5, 1.0));

	rpgGame.getGameRoot().addChild(this.m_pImage, 999999);
	this.m_ttf = cc.LabelTTF.create("0%", "Arial", 14);
	this.m_ttf.setAnchorPoint(cc.p(0.5, 1.0));
	rpgGame.getGameRoot().addChild(this.m_ttf, 999999);
	this.m_ttf.setPosition(rpgGame.getSystem().getBasePos(6));
	this.m_pImage.setPosition(rpgGame.getSystem().getBasePos(6));
	this.m_ttf.setVisible(false);

	this.setLoadStr = function (msgStr) {
		this._show(true);
		this.m_showTime = 0;
		this.m_ttf.setString(msgStr);
	}
	this._show = function (bIsShow) {
		if (this.m_bIsShow === bIsShow)
			return;
		this.m_bIsShow = bIsShow;
		this.m_pImage.setVisible(bIsShow);
		this.m_ttf.setVisible(bIsShow);
	};

	this.update = function (ftime) {
		if (this.m_bIsShow === false)
			return;
		this.m_showTime += ftime;
		if (this.m_showTime > 2.0) {
			this._show(false);
			return;
		}
	}

	//this.m_imageProg = cc.ProgressTimer.create(tempJD);
	//this.m_imageProg.setType(cc.PROGRESS_TIMER_TYPE_BAR);
	//this.m_imageProg.setMidpoint(cc.p(0, 0));
	//this.m_imageProg.setBarChangeRate(cc.p(1, 0));
}

function LoadImage() {
	this.waitTime = 0.03;
	this.width = 639;
	this.setVisible = function (bisV) {
		this.m_progress.setVisible(bisV);
		this.m_pSprbk.setVisible(bisV);
		this.m_ttf.setVisible(bisV);
	}
	this.m_pSprbk = cc.Sprite.create("res/jindutiao.png");
	this.m_pSprbk.setAnchorPoint(cc.p(0, 0));

	rpgGame.getGameRoot().addChild(this.m_pSprbk, 999999998);

	var pTemp = BTG.ProxySprite.create("res/ui/logo.png", this.m_pSprbk,
		cc.p(this.m_pSprbk.getContentSize().width / 2, this.m_pSprbk.getContentSize().height + 50)
	);
	pTemp.preScale(cc.p(0.5, 0.5));
	this.m_progress = BTG.LoadProgress.create("res/jindutiao_1.png", "res/jindutiao_2.png", "res/jindutiao_3.png", this.width);
	this.m_progress.setPosition(cc.p((BTG.windowSize.width - 639) / 2, BTG.windowSize.height * 0.5));
	this.m_pSprbk.setPosition(cc.p((BTG.windowSize.width - 639) / 2, BTG.windowSize.height * 0.5));
	this.m_progress.setValue(0);

	this.m_ttf = cc.LabelTTF.create("0%", "Arial", 14);
	rpgGame.getGameRoot().addChild(this.m_progress, 999999999);
	rpgGame.getGameRoot().addChild(this.m_ttf, 9999999999);
	this.m_ttf.setPosition(cc.p(BTG.windowSize.width / 2, BTG.windowSize.height * 0.5 + 32));
	this.m_ttf.setColor(cc.c3(255, 0, 0));
	this.setVisible(false);

	this.m_curTime = 0;
	this.m_isEnd = false;
	this.m_isShow = false;

	this.begin = function(curTime) {
		if (this.m_isShow)
			return;

		if (rpgGame.getMainPlayer())
			rpgGame.getMainPlayer().stop();
		rpgGame.lockGame();
		this.m_isShow = true;
		this.m_curTime = 0;
		if(curTime)
			this.m_curTime = curTime;
		this.m_progress.setValue(0);

	}
	this.end = function () {
		if (this.m_isEnd)
			return;
		this.m_isEnd = true;
		if (this.m_curTime < this.waitTime) {
			rpgGame.unlockGame();
			this.m_curTime = 0;
			this.setVisible(false);

			this.m_isShow = false;
			this.m_isEnd = false;
		}

	}
	this.update = function (dt) {
		if (this.m_isShow == false)
			return;
		var speed = this.m_isEnd ? 1.5 : 0.03;

		this.m_curTime += dt * (speed); //* Math.cos(this.m_curTime);
		cc.log(this.m_curTime);
		if (this.m_curTime > this.waitTime && !this.m_pSprbk.isVisible()) {
			this.setVisible(true);
		}
		if (this.m_curTime > 1) {
			if (this.m_isEnd) {
				rpgGame.unlockGame();
				this.m_curTime = 0;
				this.setVisible(false);
				this.m_isShow = false;
				this.m_isEnd = false;
			} else
				this.m_curTime = 0;
		}
		this.m_ttf.setString("Loading:" + (0 | (this.m_curTime / 1 * 100)) + "%");
		this.m_progress.setValue(this.m_curTime);
	}
}