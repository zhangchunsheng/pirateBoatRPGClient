BTG.scene_Width = 960 * 2;
BTG.scene_Height = 640;
BTG.windowSize = cc.size(BTG.scene_Width / 2, BTG.scene_Height);
BTG.screen_Scale = 1;
//角色行走方向 CharacterMoveDirection
BTG.CMD_E = 1;//East
BTG.CMD_W = 2;//West
BTG.CMD_N = 3;//North
BTG.CMD_S = 4;//South
BTG.CMD_EN = 5;//East North
BTG.CMD_ES = 6;//East South
BTG.CMD_WN = 7;//West North
BTG.CMD_WS = 8;//West South
//角色动作ID CharacterAction
BTG.CA_Run = 0;
BTG.CA_Stand = 2;
BTG.CA_FightStand = 5;
BTG.CA_NormalAttack0 = 6;
BTG.CA_Critical = 8;
BTG.CA_Embattled = 10;
BTG.CA_Dodge = 11;

//角色小块Id
BTG.CT_Root = 0;
BTG.CT_Body = 1;
BTG.CT_Head = 2;
BTG.CT_LeftHandUp = 3;
BTG.CT_RightHandUp = 4;
BTG.CT_LeftHandMid = 5;
BTG.CT_RightHandMid = 6;
BTG.CT_LeftHand = 7;
BTG.CT_RightHand = 8;
BTG.CT_LeftLeg = 9;
BTG.CT_RightLeg = 10;
BTG.CT_LeftMiniLeg = 11;
BTG.CT_RightMiniLeg = 12;
BTG.CT_LeftFoot = 13;
BTG.CT_RightFoot = 14;
BTG.CT_Weapon = 15;
BTG.CT_Count = 16;

//角色装备ID
BTG.EQP_Head = 1;
BTG.EQP_Wrist = 5;
BTG.EQP_Clothes = 2;
BTG.EQP_Trousers = 3;
BTG.EQP_Shoes = 4;
BTG.EQP_Weapon = 0;
BTG.EQP_Count = 6;

//角色类型Id
BTG.CharacterType_MainPlayer = 0;
BTG.CharacterType_Other = 1;
BTG.CharacterType_Monster = 2;
BTG.CharacterType_Npc = 3;
BTG.CharacterType_FighterOther = 4;
BTG.CharacterType_FighterMonster = 5;
BTG.CharacterType_UI = 6;
BTG.CharacterType_Film = 7;
BTG.CharacterNameColorArray = [
	cc.c3(246, 223, 1),
	cc.c3(255, 0, 0),
	cc.c3(255, 128, 100),
	cc.c3(246, 223, 1),
	cc.c3(0, 0, 255),
	cc.c3(0, 0, 255),
	cc.c3(0, 0, 255),
	cc.c3(0, 0, 255)
];

BTG.characterBoatAction = ["stand","attack","block","death"];

//特效类型ID special efficiency ID
BTG.SE_Texture = 0;//单片贴图特效
BTG.SE_Sequence = 1;//序列贞特效

//游戏zOrder
BTG.GZOrder_Scene = 0;
BTG.GZOrder_Npc = 1;
BTG.GZOrder_CharacterBefore = 2;
BTG.GZOrder_Character = 3;
BTG.GZOrder_Effect = 1900;
BTG.GZOrder_UIBefor = 1901;
BTG.GZOrder_UI = 1902; 
BTG.GZOrder_Top = 999999;

BTG.DefineTag_9Grid = 20000;
BTG.DefineTag_Close = 9999;
BTG.DefineTag_ScrollLayer = 10000;
BTG.DefineTag_TipItemIcon = 30001;
BTG.DefineTag_TipItemBg = 30002;

//游戏物品
BTG.GItem_MaxCount = 500;
BTG.GItemType_Props = 0;
BTG.GItemType_Equipment = 1;
BTG.GItemType_Material = 2;
BTG.GItemType_Diamond = 3;
BTG.GItemType_Treasure = 4;
BTG.GItemType_Food = 5;

BTG.FT_HeroPosition = ["前军", "中军", "后军"];//formation
BTG.ProfessionType = ["战士", "弓手", "法师"];
BTG.EquipmentType = ["武器","头盔","衣服","裤子","靴子","护腕"];