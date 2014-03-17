/**
 * cocos2d配置
 * 作者：张春生
 * 日期：2012-12-04
 */
(function() {
	var d = document;
	var c = {
		COCOS2D_DEBUG: 2,
		box2d: false,
		showFPS: true,
		frameRate: 60,
		tag: "gameCanvas",
		engineDir: "cocos2d2.0/",
		appFiles: [
			"js/map2.0/CCBTGRenderTexture.js",
			"js/map2.0/CCBTGSpriteBatchNode.js",
			"js/map2.0/CCBTGTMXLayer.js",
			"js/map2.0/CCBTGTMXXMLParser.js",
			"js/map2.0/CCBTGTMXTiledMap.js",
			"js/map2.0/CCBTGTMXObjectGroup.js",
			"js/resource.js",
			"js/function.js",
			"js/common.js",
			"js/init.js",
            'js/lib/socket.io.js',
			"js/lib/md5.js",
			"js/game/GameLayer.js",
			
            'js/game/helper.js',
            'js/game/require.js',
            'js/game/Socket.js',
			'js/game/define.js',
			'js/lang/zh-CN.js',
			'js/game/SocketUtil.js',
			'js/game/System.js',
			'js/game/FileGet.js',
			'js/game/GameData.js',
			'js/game/Message.js',

			'js/game/ResourcePreLoad.js',
			'js/game/LoadProgress.js',
			'js/game/ProxySprite.js',
			'js/game/Radiobox.js',
			'js/game/CCScrollLayer.js',
			'js/game/CCScrollLayerPage.js',
			'js/game/CCPageItem.js',
			//character
			"js/game/CharacterRender.js",
			'js/game/CharacterAction.js',
			'js/game/CharacterActionBind.js',
			'js/game/ActionImageCache.js',

			'js/game/CharacterBase.js',
			'js/game/MainPlayer.js',
			'js/game/Monster.js',
			'js/game/Npc.js',
			'js/game/UICharacter.js',
			'js/game/FilmCharacter.js',

			'js/game/OtherPlayer.js',
			'js/game/Fighter.js',
			'js/game/CharacterUtil.js',
			//effect
			'js/game/EffectData.js',
			'js/game/EffectPlay.js',
			'js/game/EffectUtil.js',

			'js/game/Film.js',
			'js/game/GameState.js',
			//item
			'js/game/ItemDataUtil.js',
			//ui
			'js/game/Grid9.js',
			'js/game/UILoadLayout.js',
			'js/game/DlgBase.js',
			'js/game/DlgBase_Private.js',
			'js/game/DlgBase_Public.js',
			'js/game/UIUtil.js',
			'js/game/TextInput.js',
			'js/game/Hyperlink.js',
			'js/game/Navigation.js',
			'js/game/UIHeroEquip.js',
			'js/game/ItemStateControl.js',
			'js/game/ItemTouchControl.js',
			//dlg
			'js/ui/DlgSpeak.js',
			'js/ui/DlgLogin.js',
			'js/ui/DlgCreateCharacter.js',
			'js/ui/DlgMainUI_LT.js',
			'js/ui/DlgMainUI_LB.js',
			'js/ui/DlgMainUI_RT.js',
			'js/ui/DlgGoHome.js',
			'js/ui/DlgMainUI_RBBase.js',
			'js/ui/DlgMainUI_RBForPc.js',
			'js/ui/DlgMainUI_RBForPhone.js',
			'js/ui/DlgBigMap.js',
			'js/ui/DlgMinLevel.js',
			'js/ui/DlgTask.js',

			'js/ui/DlgPageBase.js',
			'js/ui/DlgPackage.js',
			'js/ui/DlgSale.js',
			'js/ui/DlgPackageItemTip.js',
			'js/ui/DlgSkillItemTip.js',
			'js/ui/DlgPlayerEditor.js',
			'js/ui/DlgPlayerEditorSubUI.js',
			'js/ui/DlgPlayerEditorSubUI2.js',
			'js/ui/DlgPlayerEditorSubUI3.js',
			'js/ui/DlgNumberInput.js',
			'js/ui/DlgHerosLayoutEditor.js',
			'js/ui/DlgConfirm.js',
			'js/ui/DlgFilmSpeak.js',
			'js/ui/DlgFightResult.js',
			'js/ui/DlgFightAward.js',
			'js/ui/DlgPubGame.js',
			'js/ui/DlgPub.js',

			'js/game/SceneRender.js',
			'js/game/GameScene.js',
			'js/game/FightEffect.js',
			'js/game/Fight.js',
			'js/game/RPGGame.js',
			'js/index.js',

			//Action
			'js/game/ActionUtil.js'
		]
	};
	window.addEventListener("DOMContentLoaded", function() {
		var s = d.createElement("script");
		if(c.SingleEngineFile && !c.engineDir) {
			s.src = c.SingleEngineFile;
		} else if(c.engineDir && !c.SingleEngineFile) {
			s.src = c.engineDir + "platform/jsloader.js";
		} else {
			alert("You must specify either the single engine file or the engine directory in 'cocos2d.js'");
		}
		document.ccConfig = c;
		d.body.appendChild(s);
		s.c = c;
		s.id = "cocos2d-html5";
	});
})();