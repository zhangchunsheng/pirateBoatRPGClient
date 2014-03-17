(function(BTG) {
	function ActionData() {
		this.m_time = 0;
		this.m_pos = cc.p(0, 0);
		this.m_rot = 0;
	};

	BTG.CharacterAction = function() {
		this.m_fileName = "";
		this.m_AA_Type = "";
		this.m_maxRunTime = 0;
		this.m_lerpData = new ActionData();
		this.m_isWhile = 0;
		this.m_isLoadFinal = false;
		this.m_acionData = new Array(BTG.CT_Count);
		this.characterActionData = {};
		this.boatActionData = {};

		for(var i = 0; i < BTG.CT_Count; i++) {
			this.m_acionData[i] = new Array();
		}
	}

	BTG.CharacterAction.prototype.isPlayFinal = function (curRunTime) {
		if (this.m_isWhile != 0)
			return false;
		if (curRunTime >= this.m_maxRunTime)
			return true;
		else
			return false;
	}

	BTG.LerpCharacter = function(start, end, curTime, startTime, endTime) {
		curTime -= startTime;
		endTime -= startTime;
		curTime /= endTime;

		return start * (1 - curTime) + end * curTime;
	}

	BTG.CharacterAction.prototype.getRunKeyForTimeKey = function (timeKey, nKeyId) {
		if (this.m_acionData[nKeyId].length == 0)
			return null;

		var tempList = this.m_acionData[nKeyId];

		var startIdx = -1;
		for (var i = 1; i < tempList.length; i++) {
			if (timeKey <= tempList[i].m_time) {
				startIdx = i;
				break;
			}
		}

		if (startIdx == -1) {
			return tempList[tempList.length - 1];
		}

		var pStart = tempList[startIdx - 1];

		var pEnd = tempList[startIdx];

		if (nKeyId == BTG.CT_Root) {
			this.m_lerpData.m_pos.x = BTG.LerpCharacter(pStart.m_pos.x, pEnd.m_pos.x, timeKey, pStart.m_time, pEnd.m_time);
			this.m_lerpData.m_pos.y = BTG.LerpCharacter(pStart.m_pos.y, pEnd.m_pos.y, timeKey, pStart.m_time, pEnd.m_time);
			this.m_lerpData.m_rot = tempList[0].m_rot;
		} else
			this.m_lerpData.m_rot = BTG.LerpCharacter(pStart.m_rot, pEnd.m_rot, timeKey, pStart.m_time, pEnd.m_time);

		return this.m_lerpData;
	}
	BTG.CharacterAction.prototype.getRunKey = function (nKeyId, apActor) {
		if (this.m_acionData[nKeyId].length == 0)
			return null;

		var tempList = this.m_acionData[nKeyId];

		var startIdx = -1;
		for (var i = 1; i < tempList.length; i++) {
			if (apActor.m_runTime[nKeyId] <= tempList[i].m_time) {
				startIdx = i;
				break;
			}
		}

		if (startIdx == -1) {
			if (this.m_isWhile == 0)
				return tempList[tempList.length - 1];
			else {
				apActor.m_runTime[nKeyId] -= tempList[tempList.length - 1].m_time;
				startIdx = 1;
			}
		}

		var pStart = tempList[startIdx - 1];
		var pEnd = tempList[startIdx];

		if (nKeyId == BTG.CT_Root) {
			this.m_lerpData.m_pos.x = BTG.LerpCharacter(pStart.m_pos.x, pEnd.m_pos.x, apActor.m_runTime[nKeyId], pStart.m_time, pEnd.m_time);
			this.m_lerpData.m_pos.y = BTG.LerpCharacter(pStart.m_pos.y, pEnd.m_pos.y, apActor.m_runTime[nKeyId], pStart.m_time, pEnd.m_time);
			this.m_lerpData.m_rot = tempList[0].m_rot;
		} else
			this.m_lerpData.m_rot = BTG.LerpCharacter(pStart.m_rot, pEnd.m_rot, apActor.m_runTime[nKeyId], pStart.m_time, pEnd.m_time);

		return this.m_lerpData;
	}

	BTG.CharacterAction.prototype.create = function (actionFileName) {
		this.m_fileName = "res/action/" + actionFileName;
		cc.log("this.m_fileName:" + this.m_fileName);
		this.m_AA_Type = actionFileName;
		loadXML(this.m_fileName, this);
	}

	BTG.CharacterAction.prototype.parseXmlData = function (xmlDoc) {
		this.m_isLoadFinal = true;
		this.m_isWhile = parseInt(xmlDoc["while"]);
	}
})(BTG)