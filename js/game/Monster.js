(function(BTG) {
	BTG.Monster = function() {
		BTG.CharacterBase.call(this, this); //继承属性
		this.move_Speed = 350;
		this.m_nFightPos = -1;
		this.m_ABCRect = cc.RectMake(0, 0, 0, 0);
		this.m_ABCIdx = -1;
		this.m_AIType = -1;
		this.m_mosterPackIdXML = -1;
		this.m_childArray = null; // has child  main monster
		this.move_Speed = 130;
		this.m_waitTime = Math.random() * 2;
		this.m_isFighting = false;
		this.isLoadBoat = true;
	};

	BTG.Monster.prototype = new BTG.CharacterBase(); //继承方法

	BTG.Monster.fightFront = 0;
	BTG.Monster.fightMid0 = 1;
	BTG.Monster.fightMid1 = 2;
	BTG.Monster.fightMid2 = 3;
	BTG.Monster.fightBack0 = 4;
	BTG.Monster.fightBack1 = 5;
	BTG.Monster.fightBack2 = 6;
	/*
	 * 2*    5*
	 * 1*    4*
	 * 3*    6*
	 */
	var g_monsterPosArr = [
	cc.p(0, 0),
	cc.p(80, 80),
	cc.p(110, 0),
	cc.p(140, -80),
	cc.p(220, 80),
	cc.p(250, 0),
	cc.p(280, -80)];
	BTG.Monster.fightSideIdx2Pos = function (side, idx) {
		assert(idx >= 0 && idx < 7);
		if (side === 1) //右边
		return g_monsterPosArr[idx];
		else {
			return cc.p(-g_monsterPosArr[idx].x, g_monsterPosArr[idx].y);
		}
	}

	BTG.Monster.prototype.updateGroupTarget = function (vTagertPos) {
		var vPos = vTagertPos;
		var offpos = g_monsterPosArr[this.m_childArray[0].m_nFightPos];
		for (var i = 0; i < this.m_childArray.length; i++) {
			var fightPosIdx = this.m_childArray[i].m_nFightPos;
			this.m_childArray[i].setMoveTarget(cc.p(vPos.x + g_monsterPosArr[fightPosIdx].x - offpos.x, vPos.y + g_monsterPosArr[fightPosIdx].y - offpos.y));
		}
	}

	BTG.Monster.prototype.setFightIdx = function (fightIdx0_2, packId) {
		this.m_mosterPackIdXML = packId;
		// var fightPos = BTG.Monster.fightFront;
		// if (fightIdx0_2 >= 1 && fightIdx0_2<=3)
		//     fightPos = BTG.Monster.fightMid0;
		//  else if(fightIdx0_2>=4)
		fightPos = BTG.Monster.fightBack0;
		this.m_nFightPos = fightIdx0_2;
	}

	BTG.Monster.prototype.onDel = function () {
		if(this.m_childArray === null)
			return;

		for (var i = 1; i < this.m_childArray.length; i++) {// 第0个是自己 主怪
			if (this.m_childArray[i] !== this)
				rpgGame.getCharacterUtil().delForObject(this.m_childArray[i]);
		}
		this.m_childArray.length = 0;
	}
	BTG.Monster.prototype.modFightIdx = function(fightIdxType) {
		var arrayCount = new Array();
		for (var i = 0; i < this.m_childArray.length; i++) {
			if (this.m_childArray[i].m_nFightPos === fightIdxType) {
				arrayCount[arrayCount.length] = this.m_childArray[i];
			}
		}
		if (arrayCount.length <= 1) return;
		if (arrayCount.length > 3) {
			cc.alert("[Error]fightPos number >3");
		}
		for (var i = 1; i < arrayCount.length; i++)
		arrayCount[i].m_nFightPos = fightIdxType + i;
	}
	BTG.Monster.prototype.setGroupChild = function (AIType, ABCPos0_2, childArray) {
		this.m_AIType = AIType;
		var singleWidth = BTG.scene_Width / 4;
		this.m_ABCIdx = ABCPos0_2;
		this.m_ABCRect = cc.RectMake(
			singleWidth + ABCPos0_2 * singleWidth,
			rpgGame.getGameScene().getBottom(),
			singleWidth,
			rpgGame.getGameScene().getTop() - rpgGame.getGameScene().getBottom()
		);

		this.m_childArray = childArray; //第0个是自己 主怪

		//this.ModFightIdx(BTG.Monster.fightMid0);
		//this.ModFightIdx(BTG.Monster.fightBack0);
		var center = cc.p(singleWidth + ABCPos0_2 * singleWidth + singleWidth / 2, cc.Rect.CCRectGetMidY(this.m_ABCRect));

		for (var i = 0; i < this.m_childArray.length; i++)
			this.m_childArray[i].setPosition(
				cc.p(
					center.x + g_monsterPosArr[this.m_childArray[i].m_nFightPos].x,
					center.y + g_monsterPosArr[this.m_childArray[i].m_nFightPos].y
				)
			);

	}

	BTG.Monster.prototype.onUpdate = function (ftime) {
		if (this.m_childArray === null) return;
		if (this.m_isFighting === false) {
			var mainPlayerPos = rpgGame.getMainPlayer().getPosition();
			if (this.m_AIType === 0) {//小关 走格子AI
				var playerIsInRect = cc.Rect.CCRectContainsPoint(this.m_ABCRect, mainPlayerPos);
				if (playerIsInRect) {
					this.updateGroupTarget(mainPlayerPos);
				} else {
					if (this.isMove() === false) {
						this.m_waitTime += ftime;
						if (this.m_waitTime > 7) {
							this.m_waitTime = 0;
							var minRect = rectScale(this.m_ABCRect, 0.7);
							this.updateGroupTarget(rectRandPoint(minRect));
						}
					}
				}
			} else {// 根据玩家距离判断AI
				
			}


			// for (var i = 0; i < this.m_childArray.length; i++)
			{
				var tPos = this.getPosition();
				// fDistanceSq = P2PDisNoSQ(tPos, mainPlayerPos);

				if (mainPlayerPos.x >= tPos.x) {
					this.m_isFighting = true;
					// rpgGame.getSocketUtil().sendMessage("customsFight", this.m_ABCIdx);
					rpgGame.getSocketUtil().sendMessage("customsFight", this.m_ABCIdx);
					rpgGame.getMainPlayer().stop();
					rpgGame.getGameScene().setFightingABCIdx(this.m_ABCIdx);
					rpgGame.lockGame();
					return;
				}
			}

		}
	}
	BTG.Monster.prototype.resetFight = function () {
		this.m_isFighting = false;
		for (var i = 0; i < this.m_childArray.length; i++)
		this.m_childArray[i].m_isFighting = false;

	}
	BTG.Monster.prototype.setAction = function (AA_type, finalNextAction) {
		if(AA_type === BTG.CA_Stand)
			AA_type = BTG.CA_FightStand;
		BTG.CharacterBase.prototype.setAction.call(this, AA_type, finalNextAction);
	}
})(BTG);