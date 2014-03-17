(function(BTG) {
	BTG.OtherPlayer = function() {
		BTG.CharacterBase.call(this, this); //继承属性
	};

	BTG.OtherPlayer.prototype = new BTG.CharacterBase(); //继承方法
})(BTG);