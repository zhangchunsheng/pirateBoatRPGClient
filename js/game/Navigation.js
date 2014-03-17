(function(BTG) {
	BTG.Navigation = function() {
		this.m_curType = null;
		this.m_data0 = null;
		this.m_data1 = null;
		this.m_curState = "no";
	};
	BTG.Navigation.prototype.to = function (hylinkType, htlinkData) {
		cc.log("dao hang to:" + htlinkData);
		this.m_curType = hylinkType;
		switch (this.m_curType) {
			case "npc":
				this.m_data0 = parseInt(htlinkData);
				var mapFileIni = rpgGame.getData().dataTables_.mapTable;
				this.m_data1 = -1;
				for (var i = 0; i < mapFileIni.length; i++) {
					if (mapFileIni[i].type !== "all") continue;
					for (var iNpc = 0; iNpc < mapFileIni[i].npcIds.length; iNpc++) {
						if (mapFileIni[i].npcIds[iNpc] === this.m_data0) {
							this.m_data1 = mapFileIni[i].resId;
							break;
						}
					}

				}
				if (this.m_data1 == -1) {
					cc.alert("npc not find   type:" + hylinkType + "data:" + htlinkData);
				}
				//与npc在同张图上
				if (rpgGame.getGameScene().getGameID() === this.m_data1) {
					var pNpc = rpgGame.getCharacterUtil().find(this.m_data0);
					rpgGame.getMainPlayer().setNpcSpeak(pNpc);
				} else {
					
				}
				break;
			case "map":
				var strParam = htlinkData.split(",", 2);
				if (strParam > length !== 2)
					strParam = htlinkData.split("，", 2);
				assert(strParam.length === 2 && "pos format error");
				this.m_data0 = parseInt(strParam[0]);
				this.m_data1 = parseInt(strParam[1]);
				var pDoor = rpgGame.getGameScene().m_sendDoor;
				if (pDoor === null)
					cc.alert("map任务导航不能发生在没有传送门的地图上 id:" + hylinkType);
				var doorPos = pDoor.getPosition();
				rpgGame.getMainPlayer().setMoveTarget(doorPos);
				this.m_curState = "toDoor";
				this.m_curType = hylinkType;
				break;
			case "ui":
				break;
			default:
				cc.alert("Navigation not define type:" + hylinkType);
				break;
		}

	}
	BTG.Navigation.prototype.stop = function () {
		this.m_curType = null;
		this.m_curState = "no";
	}


	BTG.Navigation.prototype.update = function (dt) {
		if (this.m_curType === null)
			return;
	}
})(BTG);