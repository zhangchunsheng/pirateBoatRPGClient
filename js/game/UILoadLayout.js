var create8Grid = function (fileDirect, rootContentSize) {
	var ret = cc.Grid9.create(fileDirect);
	ret.setTag(BTG.DefineTag_9Grid);
	ret.setContentSize(rootContentSize);
	return ret;
	var ret = cc.Node.create();

	ret.setAnchorPoint(cc.p(0, 0));
	ret.setPosition(cc.p(0, 0));
	ret.ignoreAnchorPointForPosition(false);
	var grid9 = new Array(9);
	for (var i = 0; i < 9; i++) {
		grid9[i] = cc.Sprite.create("res/dlg/" + fileDirect + "/" + i + ".png");
		ret.addChild(grid9[i], 0);
	}
	grid9[1].setAnchorPoint(cc.p(0, 1));
	grid9[3].setAnchorPoint(cc.p(1, 1));
	grid9[5].setAnchorPoint(cc.p(1, 0));
	grid9[7].setAnchorPoint(cc.p(0, 0));

	grid9[1].setPosition(cc.p(0, rootContentSize.height)); //left top
	grid9[3].setPosition(cc.p(rootContentSize.width, rootContentSize.height)); //right top
	grid9[5].setPosition(cc.p(rootContentSize.width, 0)); //right bottoom
	grid9[7].setPosition(cc.p(0, 0)); //left bottom


	var leftToRight = rootContentSize.width - grid9[1].getContentSize().width - grid9[3].getContentSize().width;
	var topToBottom = rootContentSize.height - grid9[1].getContentSize().height - grid9[7].getContentSize().height;

	// top edge
	grid9[2].setAnchorPoint(cc.p(0.5, 1));
	grid9[2].setScaleX(leftToRight / grid9[2].getContentSize().width);
	grid9[2].setPosition(cc.p(rootContentSize.width / 2, rootContentSize.height));
	// bottom edge
	grid9[6].setAnchorPoint(cc.p(0.5, 0));
	grid9[6].setScaleX(leftToRight / grid9[6].getContentSize().width);
	grid9[6].setPosition(cc.p(rootContentSize.width / 2, 0));
	// right edge
	grid9[4].setAnchorPoint(cc.p(1, 0.5));
	grid9[4].setScaleY(topToBottom / grid9[4].getContentSize().height);
	grid9[4].setPosition(cc.p(rootContentSize.width, rootContentSize.height / 2));

	//left edge
	grid9[8].setAnchorPoint(cc.p(0, 0.5));
	grid9[8].setScaleY(topToBottom / grid9[8].getContentSize().height);
	grid9[8].setPosition(cc.p(0, rootContentSize.height / 2));
	//center
	grid9[0].setAnchorPoint(cc.p(0.5, 0.5));
	grid9[0].setPosition(cc.p(rootContentSize.width / 2, rootContentSize.height / 2));
	grid9[0].setScaleX(leftToRight / grid9[0].getContentSize().width);
	grid9[0].setScaleY(topToBottom / grid9[0].getContentSize().height);

	return ret;
}
var createNode = function(nodeType, initParam, uiObj, rootContentSize) {
	var retNode = null;
	switch (nodeType) {
		case "C9Grid":
			retNode = create8Grid(initParam, rootContentSize);
			break;
		case "CCEditbox":
			cc.log(initParam);
			var paramValue = new Array(3);
			var strParam = initParam.split(",", 3);
			for (var i = 0; i < 3; i++) {
				var strValue = strParam[i].split(":", 2);
				paramValue[i] = strValue[1];
			}
			retNode = TextEditBox.create("", "Thonburi", parseInt(paramValue[2]));
			retNode.setString("html5");
			break;
		case "CCMenu":
			retNode = cc.Menu.create();
			break;
		case "CCLayer":
			retNode = cc.Node.create();
			break;
		case "CCSpriteTargetTouch":
			//会转成button
			retNode = cc.MenuItemImage.create("res/" + initParam, "res/" + initParam, uiObj, uiObj._buttonDown);
			break;
		case "CCSprite":
			retNode = cc.Sprite.create("res/" + initParam);
			break;
		case "CCLabelTTF":
			// label:a,fontName:string,fontSize:17
			var strParam = initParam.split(",", 6);
			var paramValue = new Array(6);
			if (strParam.length == 3) {
				for (var i = 0; i < 3; i++) {
					var strValue = strParam[i].split(":", 2);
					paramValue[i] = strValue[1];
				}

				if (paramValue[0] !== 'a' && uiObj.m_uiAttr.bIsTransfromTTF) {
					var newParam = LGG(paramValue[0]);
					if (newParam === undefined) {
						cc.alert("not define in \"language.js\" flag:" + paramValue[0] + "\n+fileName:" + uiObj.m_fileName);
					}
					paramValue[0] = newParam;
				}

				retNode = cc.LabelTTF.create(paramValue[0], paramValue[1], parseInt(paramValue[2]));
			} else {
				if (strParam.length != 6) cc.alert("[Error]wen zi param:" + initParam);
				for (var i = 0; i < 6; i++) {
					var strValue = strParam[i].split(":", 2);
					paramValue[i] = strValue[1];
				}

				if (paramValue[0] !== 'a' && uiObj.m_uiAttr.bIsTransfromTTF) {
					var newParam = LGG(paramValue[0]);
					if (newParam === undefined) {
						cc.alert("not define in \"language.js\" flag:" + paramValue[0]);
					}
					paramValue[0] = newParam;
				}

				var labstr = paramValue[0];
				var fontName = paramValue[4];
				var fontSize = parseInt(paramValue[5]);
				var dimensions = cc.size(parseInt(paramValue[1]), parseInt(paramValue[2]));
				var hAlignment = parseInt(paramValue[3]);
				//Value="label:a,width:310,height:60,alignment:0,fontName:string,fontSize:16
				retNode = cc.LabelTTF.create(labstr, fontName, fontSize, dimensions, hAlignment);
			}
			break;
		case "CCMenuItemImage":
			//normalImage:ui/btn/btn_21_nrom.png,selectedImage:ui/btn/btn_21_down.png
			var strValue = initParam.split(",", 3);
			var strFN = new Array();
			for (var i = 0; i < strValue.length; i++) {
				var tStrAttr = strValue[i].split(":", 2);
				strFN[strFN.length] = "res/" + tStrAttr[1];
			}
			retNode = cc.MenuItemImage.create(strFN[0], strFN[1], uiObj, uiObj._buttonDown);

			break;
		default:
			cc.alert("[Error]createNode 未定义的节点类型 " + nodeType);
	}
	return retNode;
}
var preLoadUIRes = function (preLoad, nodeType, initParam) {
	switch (nodeType) {
		case "C9Grid":
			for (var i = 0; i < 9; i++) {
				preLoad.preImage("res/dlg/" + initParam + "/" + i + ".png");
			}
			break;
		case "CCEditbox":
		case "CCMenu":
		case "CCLayer":
		case "CCLabelTTF":
			break;
		case "CCSprite":
		case "CCSpriteTargetTouch":
			preLoad.preImage("res/" + initParam);
			break;
		case "CCMenuItemImage":
			//normalImage:ui/btn/btn_21_nrom.png,selectedImage:ui/btn/btn_21_down.png
			var strValue = initParam.split(",", 3);

			for (var i = 0; i < strValue.length; i++) {
				var strFN = strValue[i].split(":", 2);
				preLoad.preImage("res/" + strFN[1]);
			}
			break;
		default:
			cc.alert("preLoadUIRes nodeType not define " + nodeType);
	}
}

// valueType 单个数字,  点，分隔， 
var VT_Float = 0;
var VT_Point = 1;
var VT_Size = 2;
var VT_String = 3;
var VT_Bool = 4;
var getDataType = function (attrName) {
	switch (attrName) {
		case "AnchorPoint":
		case "Position":
		case "WindowSize":
			return VT_Point;
		case "ContentSize":
			return VT_Size;
		case "String":
			return VT_String;
		case "IsRelativeAnchorPoint":
		case "IsTouchEnabled":
		case "IsOpacityModifyRGB":
			return VT_Bool;
		default:
			return VT_Float;
	}
}

var parseValue = function (VT_type, strvalue) {
	var valueArray = strvalue.split(",", 2);
	switch (VT_type) {
		case VT_Bool:
			return (parseInt(valueArray[0]) != 0);
			break;
		case VT_Float:
			return parseFloat(valueArray[0]);
		case VT_Point:
			var xPos = valueArray[0].split(":", 2);
			var yPos = valueArray[1].split(":", 2);
			return cc.p(parseFloat(xPos[1]), parseFloat(yPos[1]));
		case VT_Size:
			var xPos = valueArray[0].split(":", 2);
			var yPos = valueArray[1].split(":", 2);
			return cc.SizeMake(parseFloat(xPos[1]), parseFloat(yPos[1]));
		case VT_String:
			return strvalue;
		default:
			cc.alert("[Error]parseValue() type not define" + strvalue + ":" + VT_type);
			return undefined;
	}
}

function CCNodeAttr2Name() {
	this.name = 0;
	this.value = 0;
}

function CCNodeAttr() {
	this.type = null;
	this.initParam = null;
	this.zOrder = 0;
	this.attrArray = new Array();
	this.curName = "";
}

function LoadUILayout(layoutFileName, uiObject) {
	var m_uiRootNode = uiObject.m_pRoot;
	var m_uiMenu = null;
	var m_touchSpriteList = new Array();

	var m_nodeList = new Array();
	this.onLoad_UIImage = function () {
		cc.log("LoadUILayout");
		cc.log(m_nodeList);
		var curNode = 0;
		for (var i = 0; i < m_nodeList.length; i++) {
			if (i === 0)
				curNode = m_uiRootNode;
			else {
				if (m_nodeList[i].type === "CCLabelTTF") {//editbox  name==CCEditbox
					if (m_nodeList[i].curName.indexOf("CCEditbox") != -1)
						m_nodeList[i].type = "CCEditbox";
				}
				if (m_nodeList[i].type === "CCMenu") {
					if (m_uiMenu == null) {
						m_uiMenu = cc.Menu.create();
					}
					curNode = m_uiMenu;
				} else
					curNode = createNode(m_nodeList[i].type, m_nodeList[i].initParam, uiObject, m_uiRootNode.getContentSize());
				//cc.log("curNode :" + m_nodeList[i].initParam);
				if (m_nodeList[i].type === "CCMenuItemImage" || m_nodeList[i].type === "CCSpriteTargetTouch") {
					m_touchSpriteList[m_touchSpriteList.length] = {
						tnode: curNode,
						zorder: m_nodeList[i].zOrder
					};
				} else {
					m_uiRootNode.addChild(curNode, m_nodeList[i].zOrder);
				}
			}
			if (m_nodeList[i].type === "C9Grid") {//菜单不设置属性
				continue;
			}
			for (var iNodeAttr = 0; iNodeAttr < m_nodeList[i].attrArray.length; iNodeAttr++) {
				//if (m_nodeList[i].attrArray[iNodeAttr].name == "ContentSize")
				//    continue;
				var attrStrName = "set" + m_nodeList[i].attrArray[iNodeAttr].name;

				if (m_nodeList[i].type === "CCEditbox") {//editbox not setOpacityModifyRGB
					if (m_nodeList[i].attrArray[iNodeAttr].name != "Position" && m_nodeList[i].attrArray[iNodeAttr].name != "Tag") {
						continue;
					}
				}
				if (m_nodeList[i].type === "CCLabelTTF") {
					if (m_nodeList[i].attrArray[iNodeAttr].name == "ContentSize")
						continue;
				}
				if (m_nodeList[i].attrArray[iNodeAttr].name === "IsRelativeAnchorPoint") {
					attrStrName = "ignoreAnchorPointForPosition";
				} else if (m_nodeList[i].attrArray[iNodeAttr].name === "IsOpacityModifyRGB") {
					continue;
					attrStrName = "setOpacityModifyRGB";
				} else if (m_nodeList[i].attrArray[iNodeAttr].name == "IsTouchEnabled") {
					attrStrName = "setTouchEnabled";
				} else if (m_nodeList[i].attrArray[iNodeAttr].name == "IsVisible") {
					attrStrName = "setVisible";
				}
				if (attrStrName.indexOf("Color") != -1) {
					//目前不支持颜色设置
					continue;
				}
				if (attrStrName.indexOf("String") != -1) {
					//只能初始化改值
					continue;
				}
				var attrValue = parseValue(getDataType(m_nodeList[i].attrArray[iNodeAttr].name),
				m_nodeList[i].attrArray[iNodeAttr].value);
				if (attrStrName === "ignoreAnchorPointForPosition")
					attrValue = !attrValue;
				if (!curNode[attrStrName])
					cc.alert("not define :" + attrStrName);
				
				curNode[attrStrName](attrValue);
			}
			if (i === 0)
				curNode.ignoreAnchorPointForPosition(false);
		}

		for (var i = 0; i < m_touchSpriteList.length; i++) {
			m_uiMenu.addChild(m_touchSpriteList[i].tnode, m_touchSpriteList[i].zorder);
		}

		uiObject._createFinal(m_uiMenu);
	}

	var m_preLoad = new BTG.PreLoadMulRes2SingleFun(this.onLoad_UIImage, this);

	this.onLoad_LoadUILayout = function (file_buf_text) {
		var fileNodeList = file_buf_text.split("<CCNode", 200);
		for (var iNode = 1; iNode < fileNodeList.length; ++iNode) {
			var nodeIdx = m_nodeList.length;
			m_nodeList[nodeIdx] = new CCNodeAttr();

			var fileNodeAttrList = fileNodeList[iNode].split(">", 20);

			var blockList = fileNodeAttrList[0].split("\"", 10);
			if (blockList.length > 3)
				m_nodeList[nodeIdx].zOrder = parseInt(blockList[3]);

			m_nodeList[nodeIdx].type = blockList[1];
			blockList = fileNodeAttrList[1].split("\"", 10);
			m_nodeList[nodeIdx].initParam = blockList[3];

			for (var iAttr = 2; iAttr < fileNodeAttrList.length; iAttr++) {
				blockList = fileNodeAttrList[iAttr].split("\"", 10);

				if (blockList[1] === "WindowSize") //屏蔽属性
					continue;
				if (blockList[1] === "Name") {//屏蔽属性
					m_nodeList[nodeIdx].curName = blockList[3];
					continue;
				}

				if (blockList.length < 5)
					continue;
				var childIdx = m_nodeList[nodeIdx].attrArray.length;
				m_nodeList[nodeIdx].attrArray[childIdx] = new CCNodeAttr2Name();
				m_nodeList[nodeIdx].attrArray[childIdx].name = blockList[1];
				m_nodeList[nodeIdx].attrArray[childIdx].value = blockList[3];
			}

			if (m_nodeList[nodeIdx].type === "CCSprite") {
				if (m_nodeList[nodeIdx].curName.indexOf("C9Grid") != -1) {
					var tempInitParam = m_nodeList[nodeIdx].curName.split("_", 2);
					assert(tempInitParam.length === 2, "grid type  xxx_xxx");
					m_nodeList[nodeIdx].type = "C9Grid";
					m_nodeList[nodeIdx].initParam = tempInitParam[1];
				}
			}
			preLoadUIRes(m_preLoad, m_nodeList[nodeIdx].type, m_nodeList[nodeIdx].initParam);
		}
		m_preLoad.endPre();
		//uiObject.init(m_uiRootNode);
	}
	FileGet(layoutFileName, this.onLoad_LoadUILayout, this);
};