(function(BTG) {
	BTG.GameDataFile = function() {
		this.m_idMap = new Object();
		this.m_attrNameArray = new Array();
		this.m_lieCount = 0;
	}
})(BTG);
/*
 * 数据格式 
 * id(整数) 字符串0~n
 */
(function(BTG) {
	BTG.GameData = function() {
		this.m_fileNameMap = new Object();
		this.m_loadCount = 0;
	};
	BTG.GameData.notDef = -999999;

	BTG.GameData.prototype.getNpcFile = function (nCeHuaId) {
		return rpgGame.getData().find(dataKey.npcTable, nCeHuaId);
	}

	BTG.GameData.prototype.getActionFile = function (resID, AA_type) {
		var _actorResMap = this.m_fileNameMap["res/d/characterData.txt"];
		if(!_actorResMap)
			return null;
		if(_actorResMap.m_idMap[resID] === undefined) {
			cc.log("[Error]resID:" + resID + " not find In getActionFile()");
			return null;
		}
		if(_actorResMap.m_idMap[resID][AA_type] === BTG.GameData.notDef) {
			cc.log("[Error]getActionFile() resID:" + resID + " AA_type===BTG.GameData.notDef  AA_type:" + AA_type);
			return null;
		}
		console.log(AA_type + "/" + _actorResMap.m_idMap[resID][AA_type] + ".xml");
		return AA_type + "/" + _actorResMap.m_idMap[resID][AA_type] + ".xml";
	}

	BTG.GameData.prototype.onload = function (strTxt, fileName) {
		var strTxtArray = strTxt.split('\n', 2000);
		var tMapData = this.m_fileNameMap[fileName];
		var tDataType = new Array();
		for (var i = 0; i < strTxtArray.length; i++) {
			if (i === 0) {
				var tLieCount = strTxtArray[i].split('\t', 100);
				for (var k = 1; k < tLieCount.length; k++)
				tDataType[k - 1] = parseInt(tLieCount[k]);
				tMapData.m_lieCount = parseInt(tLieCount[0]);
				if (isNaN(tMapData.m_lieCount)) {
					cc.alert(fileName + "not lie");
				}
				continue; //注释
			}
			if (strTxtArray[i].length < tMapData.m_lieCount) continue;
			var strFlagBlock = strTxtArray[i].split('\t', 100);
			if (tMapData.m_lieCount !== strFlagBlock.length) {
				cc.alert(fileName + ":lie shu cuo wu line:" + i + "shi ji lie:" + strFlagBlock.length + "zheng que lie:" + tMapData.m_lieCount);
				continue;
			}
			var userID = parseInt(strFlagBlock[0]);
			tMapData.m_idMap[userID] = new Array(strFlagBlock.length - 1);
			for (var iBlock = 1; iBlock < strFlagBlock.length; iBlock++) {
				if (strFlagBlock[iBlock].length <= 0)
					tMapData.m_idMap[userID][iBlock - 1] = BTG.GameData.notDef;
				else if (tDataType[iBlock - 1] === 1) //数字
					tMapData.m_idMap[userID][iBlock - 1] = parseInt(strFlagBlock[iBlock]);
				else //字符串
					tMapData.m_idMap[userID][iBlock - 1] = strFlagBlock[iBlock];
			}
		}
		assert(tMapData.m_lieCount != 0, fileName + "no liecount");

		this.m_loadCount--;
		if(this.m_loadCount <= 0)
			rpgGame.unlockGame();
	}

	BTG.GameData.prototype._addFile = function(fileName) {
		this.m_loadCount++;
		this.m_fileNameMap[fileName] = new BTG.GameDataFile();
		FileGet(fileName, this.onload, this);
	}

	BTG.GameData.prototype.init = function () {
		rpgGame.lockGame();
		this._addFile("res/d/characterData.txt");
		this._addFile("res/d/npcData.txt");
	}
})(BTG);