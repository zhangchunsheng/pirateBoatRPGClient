(function(BTG) {
	function HyperLink() {
		this.ctrlTTF = null;
		this.hylinkType = null;
		this.hylinkData = null;
	}

	BTG.HyperLink = function() {
		this.m_TTFList = new Array;
		this.m_pBatch = cc.Node.create();
		this.m_callBack = null;
		this.m_pHylink = null;
	}

	function parseJsonHy(strTxt) {
		var strMem = strTxt.split("\",", 50);
		var tempObj = new Object();

		for (var iMem = 0; iMem < strMem.length; iMem++) {
			if (strMem[iMem].length < 3)
				continue;
			var men_value = strMem[iMem].split("\"", 10);
			tempObj[men_value[1]] = men_value[3];
		}
		return tempObj;
	}

	BTG.HyperLink.getHylinkData = function (orgStr) {
		var ret = new HyperLink();
		var strSplice = orgStr.split("<", 3);

		if (strSplice.length > 1) {
			strSp2 = strSplice[1].split(">", 2);
		} else strSp2 = strSplice[0].split(">", 2);

		var jsonObj = parseJsonHy(strSp2[0]);

		ret.hylinkType = jsonObj["type"];
		ret.hylinkData = jsonObj["typeData"];
		return ret;

	}
	BTG.HyperLink.isHylink = function (str) {
		return str.split("<", 3).length >= 2;
	}
	BTG.HyperLink.prototype.create = function (parNode, orgStr, callObj, callFunc, templateTTF, nTaskJindu) {
		if (BTG.HyperLink.isHylink(orgStr) === false)
			return;

		this.m_callBack = new BTG.Callback(callFunc, callObj);
		this.m_TTFList = new Array();
		var strSplice = orgStr.split("<", 3);
		var strSp2 = null;
		if (strSplice.length > 1) {
			var pHy = new HyperLink;
			this.m_TTFList[this.m_TTFList.length] = pHy;
			pHy.ctrlTTF = copyMinTTF(templateTTF);
			pHy.ctrlTTF.setString(strSplice[0]);

			strSp2 = strSplice[1].split(">", 2);
		} else
			strSp2 = strSplice[0].split(">", 2);

		var jsonObj = parseJsonHy(strSp2[0]);

		var pHy = new HyperLink;
		this.m_TTFList[this.m_TTFList.length] = pHy;
		pHy.ctrlTTF = copyMinTTF(templateTTF);
		pHy.ctrlTTF.setString(jsonObj["text"]);
		pHy.hylinkType = jsonObj["type"];
		pHy.hylinkData = jsonObj["typeData"];
		this.m_pHylink = pHy;

		if (jsonObj["color"]) {
			var color = jsonObj["color"].split(",", 3);
			pHy.ctrlTTF.setColor(cc.c3(parseInt(color[0]), parseInt(color[1]), parseInt(color[2])));
		}

		if (strSp2.length > 1) {
			var pHy = new HyperLink;
			this.m_TTFList[this.m_TTFList.length] = pHy;
			pHy.ctrlTTF = copyMinTTF(templateTTF);
			pHy.ctrlTTF.setString(strSp2[1]);
		}
		if (nTaskJindu.length == 2) {//显示当前任务进度
			var pHy = new HyperLink;
			this.m_TTFList[this.m_TTFList.length] = pHy;
			pHy.ctrlTTF = copyMinTTF(templateTTF);
			pHy.ctrlTTF.setString("(" + nTaskJindu[0] + "/" + nTaskJindu[1] + ")");
			if(nTaskJindu[0] === nTaskJindu[1])
				pHy.ctrlTTF.setColor(cc.c3(0, 255, 0));
		} else if (nTaskJindu.length == 1) {//显示需求等级
			var pHy = new HyperLink;
			this.m_TTFList[this.m_TTFList.length] = pHy;
			pHy.ctrlTTF = copyMinTTF(templateTTF);
			pHy.ctrlTTF.setString("(" + nTaskJindu[0] + LGG("ji") + ")");
			pHy.ctrlTTF.setColor(cc.c3(255, 0, 0));
		}

		var startPos = cc.p(0, 0);
		for (var i = 0; i < this.m_TTFList.length; i++) {
			this.m_pBatch.addChild(this.m_TTFList[i].ctrlTTF);
			this.m_TTFList[i].ctrlTTF.setPosition(cc.p(startPos.x, startPos.y));
			this.m_TTFList[i].ctrlTTF.ignoreAnchorPointForPosition(false);
			this.m_TTFList[i].ctrlTTF.setAnchorPoint(cc.p(0.0, 0.0));
			var conSize = this.m_TTFList[i].ctrlTTF.getContentSize();
			startPos.x += conSize.width;
		}

		parNode.addChild(this.m_pBatch, templateTTF.getZOrder());
		this.m_pBatch.setPosition(templateTTF.getPosition());
	}

	BTG.HyperLink.prototype.del = function () {
		if (this.m_pBatch)
			this.m_pBatch.getParent().removeChild(this.m_pBatch);
	}

	BTG.HyperLink.prototype.do = function () {
		rpgGame.getUIUtil().addNavigation(this.m_pHylink.hylinkType, this.m_pHylink.hylinkData);
	}

	BTG.HyperLink.prototype.touchBegin = function (vPos) {
		for (var i = 0; i < this.m_TTFList.length; i++) {
			if (this.m_TTFList[i].hylinkType === null) continue;
			if (this.m_TTFList[i].ctrlTTF.getParent().isVisible() === false)
				continue;
			if (ptInNode(vPos, this.m_TTFList[i].ctrlTTF)) {
				this.m_callBack.Run();
				this.do();
				return true;
			}
		}
		return false;
	}

	BTG.HyperlinkUtil = function() {
		this.m_hylinkList = new Array();
		this.m_pNavigation = new BTG.Navigation();
	}

	BTG.HyperlinkUtil.prototype.add = function (parNode, orgStr, callObj, callFunc, templateTTF, nTaskJindu) {
		this.m_hylinkList[this.m_hylinkList.length] = new BTG.HyperLink();
		this.m_hylinkList[this.m_hylinkList.length - 1].create(parNode, orgStr, callObj, callFunc, templateTTF, nTaskJindu);
		return this.m_hylinkList[this.m_hylinkList.length - 1];
	}
	BTG.HyperlinkUtil.prototype.del = function (hylink) {
		for (var i = 0; i < this.m_hylinkList.length; i++) {
			if (hylink === this.m_hylinkList[i]) {
				this.m_hylinkList[i].del();
				this.m_hylinkList.splice(i, 1);
				return;
			}
		}
	}
	BTG.HyperlinkUtil.prototype.update = function (dt) {
		this.m_pNavigation.update(dt);
	}
	BTG.HyperlinkUtil.prototype.touchBegin = function (vPos) {
		for (var i = 0; i < this.m_hylinkList.length; i++) {
			if (this.m_hylinkList[i].touchBegin(vPos))
				return true;
		}
		return false;
	}
})(BTG);