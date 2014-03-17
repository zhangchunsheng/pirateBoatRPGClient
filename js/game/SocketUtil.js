(function (BTG) {
    BTG.SocketUtil = function() {
        this.m_socketOnCount = 0;
        this.m_socketEmitCount = 0;
        this.m_loginName = "";

        this.m_socketLogin = new BTG.Socket();

		//ws://ec2-23-22-46-229.compute-1.amazonaws.com:9000
        this.m_socketLogin.connect("ws://222.126.242.105:9000");//ws://119.161.210.55:9000
        var this_ = this;
        //连接服务器成功
        if (rpgGame.getGameState() == BTG.GS_WaitConnectLoginSever) {
            rpgGame.getLoadingBar().setLoadStr("connect...login sever");
            this.m_socketLogin.on('connect', function () {
                rpgGame.setGameState(BTG.GS_WaitConnectGameSever);
                this_.m_socketLogin.emit("getServerList", function (serverList) {
					cc.log(serverList);
                    rpgGame.getUIUtil().add("DlgLogin", [serverList]);
                });
            });
        }
        this.m_socket = new BTG.Socket();
    };
    BTG.SocketUtil.prototype.connectToServer = function (adr) {
        rpgGame.getLoadingBar().setLoadStr("connect...Game sever");
        this.m_socket.connect(adr);
        this.init();
    }
    BTG.SocketUtil.prototype.sendMessage = function (msg) {
        var tlog = "socket_emit:" + (++this.m_socketEmitCount) + "|" + msg;
        for (var i = 1; i < arguments.length; i++) {
            tlog += "["
            for (var pObj in arguments[i])
				tlog += "," + arguments[i][pObj].toString();
            tlog += "]"
        }
        cc.log(tlog);

        this.m_socket.emit.apply(this.m_socket, arguments);
    }

    BTG.SocketUtil.prototype.onmessage = function (msg, callback) {
        var bind_ = function (fn, _this, eventName) {
            return function () {
                var tlog = "socket_on:" + (++_this.m_socketOnCount) + "|" + eventName;
                cc.log(tlog);
                fn.apply(_this, arguments);
            }
        }

        this.m_socket.on(msg, bind_(callback, this, msg));

    }
    BTG.SocketUtil.prototype.init = function () {
        var _socket = this;
        //没创建角色  创建角色
        this.onmessage('createRole', function () {
            rpgGame.setGameState(BTG.GS_CreateActor);
            rpgGame.getUIUtil().DlgHide("DlgLogin");
            //rpgGame.getUIUtil().add("DlgCreateRole");
            this.sendMessage("selectRole", 0, "Guest_" + parseInt(Math.random(0, 1) * 10000));
        });
        //创建角色成功
        this.onmessage('enterMap', function (mapID) {
            rpgGame.getGameScene().loadScene(mapID);
        });
        this.onmessage('roleLoginSucceed', function () {
            rpgGame.getUIUtil().DlgHide("DlgCreateRole");
            rpgGame.getUIUtil().DlgHide("DlgLogin");
        });

        //收到主角色信息
        var tThsi = this;
        this.onmessage('roleInfo', function (roleObj) {
			cc.log("roleInfo:" + roleObj);
            //roleObj.level = 1;
            var clirole = require("/game/clientRole");
            var soc = tThsi.m_socket.m_socket;
            var clientRole = new clirole(roleObj, soc);
            clientRole.init();

            rpgGame.getCharacterUtil().createMainPlayer(clientRole);
            rpgGame.setClientRole(clientRole);
            rpgGame.setGameState(BTG.GS_GameRun);

            clientRole.getTaskSystem().on("npcStateChange", function (changeNpcId) {
                rpgGame.getCharacterUtil().flashNpcHead(changeNpcId);
            });
            clientRole.getTaskSystem().on("refreshList", function () {
                rpgGame.getUIUtil().find("DlgMainUI_RT").flashTask(clientRole.getTaskSystem());
            });
            role = clientRole;
        });
        this.onmessage('otherPosition', function (otherPlayerMovePos, opID) {
            //rpgGame.getGameScene().cacheOtherPlayerPostion([otherPlayerMovePos, opID]);
            rpgGame.getCharacterUtil().setOtherPlayerPosition(opID, otherPlayerMovePos);
        });

        this.onmessage('mapRolesInfo', function (otherPlayerObjList) {
            //rpgGame.getGameScene().cacheOtherPlay(otherPlayerObjList);
            rpgGame.getCharacterUtil().createOtherPlayer(otherPlayerObjList);
        });
        this.onmessage('otherEnterMap', function (otherPlayerObj) {
			cc.log(otherPlayerObj);
            //rpgGame.getGameScene().cacheOtherPlay([otherPlayerObj]);
            rpgGame.getCharacterUtil().createOtherPlayer([otherPlayerObj]);
        });

        this.onmessage("connect", function () {
            rpgGame.setGameState(BTG.GS_ConnetSuccess);
        });
        this.onmessage("nameTooLength", function () {
            cc.alert("[Error]nameTooLength");
        });
        this.onmessage("nameRuleError", function () {
            cc.alert("[Error]nameRuleError");
        });
        this.onmessage("nameAlreadyExist", function () {
            cc.alert("[Error]nameAlreadyExist");
        });

        //询问角色信息
        this.onmessage('checkRole', function(callback) {
			cc.log(callback);
			cc.log(_socket);
            callback(_socket.m_loginName);
        });

        this.onmessage('disconnect', function () {
            rpgGame.setGameState(BTG.GS_Disconnect);
            rpgGame.getUIUtil().add("DlgConfirm", "网络连接已断开");
        });
        this.onmessage('otherSiteLogin', function () {
            rpgGame.setGameState(BTG.GS_Disconnect);
            rpgGame.getUIUtil().add("DlgConfirm", "在其它地点登录");
        });

        this.onmessage('otherleaveMap', function (clientId) {
            rpgGame.getCharacterUtil().delForID(clientId);
        });

        this.onmessage('chat', function (type, msg, uname) {
            addChatMessage(msg, type, uname);
        });
        this.onmessage('customsFightResult', function (msg) {
            rpgGame.unlockGame();
            rpgGame.getGameScene().createFight(msg);
        });

        //GM
        this.onmessage('sendMessage', function (msg) {
            addChatMessage(msg, 'GM');
        })
        this.onmessage('addItem', function (item, gridChanged) {
            rpgGame.getItemDataUtil().AddToServerData(item, false);
        })
        this.onmessage('addTempItem', function (item, gridChanged) {
            rpgGame.getItemDataUtil().AddToServerData(item, true);
        })

        //serverUIMessage
        this.onmessage('gamePrompt', function (msg) {
            gamePrompt(msg);
        })
    }

    BTG.getAdrParam = function(key) {
        var reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);

        if(r != null)
			return new String(unescape(r[2]));
        return null;
    }
})(BTG);