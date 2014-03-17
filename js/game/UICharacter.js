(function(BTG) {
	BTG.UICharacter = function() {
		BTG.CharacterBase.call(this, this); //继承属性
		this.m_pPar = null;
	};

	BTG.UICharacter.prototype = new BTG.CharacterBase(); //继承方法

	BTG.UICharacter.prototype.getParentNode = function () {
		assert(this.m_pPar);
		return this.m_pPar;
	}

	BTG.UICharacter.prototype.create = function (nCharacterResID, vPos, eqFlagArray6, parNode) {
		this.m_pPar = parNode;
		BTG.CharacterBase.prototype.create.call(this, -1, 0, vPos, eqFlagArray6);
	}
	BTG.UICharacter.prototype.setAlpha = function (n0_255) {
		for (var i = 0; i < BTG.CT_Count; i++) {
			if (this.m_pImage.m_spriteImage[i] === null || i === BTG.CT_Root)
				continue;
			this.m_pImage.m_spriteImage[i].setOpacity(n0_255);
		}
	}
})(BTG);