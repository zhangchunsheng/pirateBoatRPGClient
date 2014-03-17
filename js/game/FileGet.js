// callBackFun 如参数为 null 请求发生错误
var FileGet = function(fileName, callBackFun, callObj) {
	var argCount = arguments.length;
	if (cc.config.isApp == false) {
		var m_xhr = new XMLHttpRequest();
		
		m_xhr.onload = function () {
			if (m_xhr.readyState == 4) {//完成
				if ((m_xhr.status >= 200 && m_xhr.status < 300) || m_xhr.status == 304) {
					rpgGame.getLoadingBar().setLoadStr("loadFinal..." + fileName);
					if(argCount == 3)
						callBackFun.call(callObj, m_xhr.responseText, fileName);
					else
						callBackFun(m_xhr.responseText, fileName);

				} else {
					cc.alert("getfile failed , Id:" + m_xhr.status + " fileName:" + fileName);
				}
			}
		}

		m_xhr.open("get", fileName, true);
		m_xhr.send(null);
	} else {
		var retBuf = getFileBuf(fileName);
		if (argCount == 3) {
			callBackFun.call(callObj, retBuf, fileName);
		} else {
			callBackFun(retBuf, fileName);
		}
	}
}