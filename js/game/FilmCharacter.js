(function(BTG) {
	BTG.FilmCharacter = function() {
		BTG.CharacterBase.call(this, this); //继承属性
	};

	BTG.FilmCharacter.prototype = new BTG.CharacterBase(); //继承方法
})(BTG);