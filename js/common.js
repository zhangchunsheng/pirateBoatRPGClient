/**
 * 通用
 * 作者：peter
 * 日期：2012-12-10
 */
var BTG = BTG || {};
(function(BTG) {
	(function(n) {
		var OS_PC = "pc",
			OS_IPHONE = "iPhone",
			OS_IPOD = "iPod",
			OS_IPAD = "iPad",
			OS_ANDROID = "Android";
		BTG.os = OS_PC;
		if(n.indexOf(OS_IPHONE) > 0) {
			BTG.os = OS_IPHONE;
			BTG.canTouch = true;
		} else if (n.indexOf(OS_IPOD) > 0) {
			BTG.os = OS_IPOD;
			BTG.canTouch = true;
		} else if (n.indexOf(OS_IPAD) > 0) {
			BTG.os = OS_IPAD;
			BTG.canTouch = true;
		} else if (n.indexOf(OS_ANDROID) > 0) {
			BTG.os = OS_ANDROID;
			BTG.canTouch = true;
		}
	})(navigator.userAgent);
})(BTG);