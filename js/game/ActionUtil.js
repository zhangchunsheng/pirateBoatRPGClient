(function(BTG) {
	BTG.tipPos = cc.p(0, 0);

	BTG.ActionUtil = function() {
		this.delayTime = 0;
	}
	BTG.actionUtil = new BTG.ActionUtil();

	BTG.ActionUtil.prototype.fadeOutWithScaleAndMove = function (param, color, parNode, pos, fondSize, isBSE) {
		var userFontSize = fondSize == undefined ? 24 : fondSize;
		if (pos == undefined)
			pos = cc.p(BTG.windowSize.width / 2, BTG.windowSize.height / 2);
		if (parNode == undefined)
			parNode = rpgGame.getGameRoot();

		var arr = [];
		if (typeof param == "string") {
			arr.push(param);
		} else if (param instanceof Array) {
			arr = param;
		}
		if (arr.length > 0) {
			for (var i = 0; i < arr.length; i++) {
				var node = cc.LabelTTF.create(arr[i], "Arial", userFontSize);
				parNode.addChild(node, BTG.GZOrder_Top);

				node.setColor(color == undefined ? cc.c3(255, 200, 0) : color);
				node.setPosition(pos);
				node.setOpacity(0);

				var act = isBSE ? this.BSELineAction(pos) : this.paoPaoAction(pos);

				node.runAction(act);
				if (rpgGame.getMainPlayer() && parNode == rpgGame.getMainPlayer().getRoot()) {
					rpgGame.getMainPlayer().addFlipChildNode(node);
				}
			}
		} else if (param instanceof cc.Node) {
			var node = param;
			var act = isBSE ? this.BSELineAction(pos) : this.paoPaoAction(pos);
			node.runAction(act); //(node, actDelay);
		}
	}
	BTG.ActionUtil.prototype.paoPaoAction = function (pos) {
		var _this = this;
		this.delayTime += 0.3;
		var spawnAct = cc.Spawn.create(
			cc.FadeIn.create(0.01),
			cc.ScaleBy.create(1, 1.2),
			cc.FadeOut.create(1.5),
			cc.MoveTo.create(1, cc.pAdd(pos, cc.p(0, 100)))
		);
		var actDelay = cc.Sequence.create(
			cc.DelayTime.create(this.delayTime),
			spawnAct,
			cc.CallFunc.create(_this, _this.removeActionNode)
		);
		return actDelay;
	}

	BTG.ActionUtil.prototype.BSELineAction = function (pos) {
		var bse = new cc.BezierConfig;
		bse.controlPoint_1 = cc.p(pos.x + 20, pos.y - 40);
		bse.controlPoint_2 = cc.p(pos.x + 70, pos.y - 30);
		bse.endPosition = cc.p(pos.x + 120, pos.y + 120);
		var _this = this;
		this.delayTime += 0.3;
		var spawnAct = cc.Spawn.create(
			cc.ScaleBy.create(1, 1.2),
			cc.FadeOut.create(5.5),
			cc.BezierTo.create(1.5, bse)
		);
		var actDelay = cc.Sequence.create(
			cc.DelayTime.create(this.delayTime),
			spawnAct,
			cc.CallFunc.create(_this, _this.removeActionNode)
		);
		return actDelay;
	}

	BTG.ActionUtil.prototype.itemLoading = function () {

	}
	BTG.ActionUtil.prototype.removeActionNode = function (pSend) {
		if (!pSend) return;
		var parNode = pSend.getParent();
		if (parNode) {
			if (parNode == rpgGame.getMainPlayer()) {
				rpgGame.getMainPlayer().delFlipChildNode(node);
			}
			parNode.removeChild(pSend, true);
			this.delayTime -= 0.3;
		}
	}
	BTG.ActionUtil.prototype.moveTo = function (node, start, end, time) {
		if (time == undefined)
			time = 0.2;
		node.setPosition(start);
		var act = cc.MoveTo.create(time, end);
		node.runAction(act);
	}
	BTG.ActionUtil.prototype.showWindow = function (node, orgPos) {
		node.setScale(0.1);

		var pos = orgPos === undefined ? node.getPosition() : orgPos;
		node.setPosition(cc.p(BTG.windowSize.width / 2, 0));
		var act = cc.Spawn.create(
		cc.ScaleTo.create(0.2, 1, 1),
		cc.MoveTo.create(0.2, pos));
		node.runAction(act);
	}

	BTG.ActionUtil.prototype.showTip = function (node) {
		var scaleRate = 0.1;
		node.setScale(scaleRate);
		var conSize = node.getContentSize();
		var xdir = 1;
		if (tipPos.x > BTG.windowSize.width - conSize.width) xdir = -1;
		if (tipPos.y < conSize.height) tipPos.y = conSize.height;

		var size = cc.p(conSize.width / 2 * scaleRate * xdir, conSize.height * scaleRate / -2);
		node.setPosition(cc.pAdd(tipPos, size));
		var targetPos = cc.pAdd(tipPos, cc.p(conSize.width / 2 * xdir, conSize.height / -2));

		var act = cc.Spawn.create(
		cc.ScaleTo.create(0.07, 1, 1),
		cc.MoveTo.create(0.07, targetPos));
		node.runAction(act);
	}
	BTG.ActionUtil.prototype.copyItem = function (item) {
		if (!item)
			return;
		var newPItem = null;
		if (item.copy != undefined)
			newPItem = item.copy();
		else {
			newPItem = cc.Sprite.createWithTexture(icon.getTexture());
			if (item.getUserData())
				newPItem.setUserData(item.getUserData());
		}

		var localPos = rpgGame.getGameRoot().convertToNodeSpace(item.getParent().convertToWorldSpace(item.getPosition()));

		newPItem.setPosition(localPos);
		newPItem.setOpacity(180);
		//var act = cc.Sequence.create(
		//	cc.ScaleTo.create(0.05,1.2)
		//);
		newPItem.runAction(cc.ScaleBy.create(0.05, 1.3));
		//newPItem.setScale(1.2);
		rpgGame.getGameRoot().addChild(newPItem, BTG.GZOrder_Top);

		return newPItem;
	}
	BTG.ActionUtil.prototype.pressAction = function (item) {
		var act = cc.Sequence.create(
			cc.ScaleTo(0.1, 0.7),
			cc.ScaleTo(0.2, 1.5)
		)
		item.runAction(act);
	}
})(BTG);