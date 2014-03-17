var TEXT_INPUT_FONT_NAME = "Thonburi";

var textInputGetRect = function (node) {
	var rc = cc.rect(node.getPosition().x, node.getPosition().y, node.getContentSize().width, node.getContentSize().height);
	rc.origin.x -= rc.size.width / 2;
	rc.origin.y -= rc.size.height / 2;

	return rc;
};

//////////////////////////////////////////////////////////////////////////
// KeyboardNotificationLayer for test IME keyboard notification.
//////////////////////////////////////////////////////////////////////////
var ptempfunc_ = cc.config.isApp ? cc.LabelTTF.extend({}) : cc.TextFieldTTF.extend({});
var _TextFieldTTF = ptempfunc_.extend({
	ctor: function () {
		if (!cc.config.isApp)
			this._super();
		cc.associateWithNative(this, cc.config.isApp ? cc.LabelTTF : cc.TextFieldTTF);
	},
	m_maxLength: 0,
	m_isPassword: false,
	m_password: "",
	m_callbackObj: null,
	m_callbackFunc: null,

	getString: function () {
		if (this.m_isPassword == false) {
			return this._super();
		} else {
			return this.m_password;
		}
	},
	setString: function (tstr) {
		if(this.m_isPassword == true) {
			this.m_password = new String(tstr);
			var tempStr = "";
			for (var i = 0; i < tstr.length; i++)
				tempStr += "*";
			tstr = tempStr;
		}

		if(this.m_maxLength == 0 || tstr.length < this.m_maxLength) {
			this._super(tstr);
		} else {
			this._super(tstr.substr(0, this.m_maxLength));
		}
		if(this.m_callbackFunc)
			this.m_callbackFunc.call(this.m_callbackObj, tstr);
	}
});

_TextFieldTTF.create = function (placeholder, fontName, fontSize) {
	var ret = new _TextFieldTTF();
	if (ret.initWithString([placeholder, fontName, fontSize])) {
		if (placeholder) {
			ret.setPlaceHolder(placeholder);
		}
		return ret;
	}

	cc.alert("initWithString _CTextFieldTTF：initWithString ");
}

var TextEditBox = cc.Layer.extend({
	ctor: function () {
		cc.associateWithNative(this, cc.Layer);
		this.setTouchEnabled(true);
	},
	_pTrackNode: null,
	_beginPos: null,
	onClickTrackNode: function (clicked) {
		
	},

	registerWithTouchDispatcher: function () {
		cc.Director.getInstance().getTouchDispatcher().addTargetedDelegate(this, 0, false);
	},
	keyboardWillShow: function (info) {
		if (!this._pTrackNode) {
			return;
		}

		var rectTracked = textInputGetRect(this._pTrackNode);

		// if the keyboard area doesn't intersect with the tracking node area, nothing need to do.
		if (!cc.Rect.CCRectIntersectsRect(rectTracked, info.end)) {
			return;
		}

		// assume keyboard at the bottom of screen, calculate the vertical adjustment.
		var adjustVert = cc.Rect.CCRectGetMaxY(info.end) - cc.Rect.CCRectGetMinY(rectTracked);

		// move all the children node of KeyboardNotificationLayer
		var children = this.getChildren();
		for (var i = 0; i < children.length; ++i) {
			var node = children[i];
			var pos = node.getPosition();
			pos.y += adjustVert;
			node.setPosition(pos);
		}
	},

	onTouchBegan: function (touch, event) {
		this._beginPos = touch.getLocation();
		this._beginPos = this.convertToNodeSpace(this._beginPos);
		return true;
	},

	onTouchEnded: function (touch, event) {
		if (!this._pTrackNode) {
			return;
		}

		var endPos = touch.getLocation();
		endPos = this.convertToNodeSpace(endPos);

		var delta = 5.0;
		if (Math.abs(endPos.x - this._beginPos.x) > delta || Math.abs(endPos.y - this._beginPos.y) > delta) {
			// not click
			this._beginPos.x = this._beginPos.y = -1;
			return;
		}

		// decide the trackNode is clicked.
		var point = endPos; // this.convertTouchToNodeSpaceAR(touch);
		//var point = endPos;

		var rect = textInputGetRect(this._pTrackNode);

		this.onClickTrackNode(cc.Rect.CCRectContainsPoint(rect, point));
	},
	setString: function (str) {
		this._pTrackNode.setString(str);
	},
	setPosition: function (vPos) {
		this._pTrackNode.setPosition(cc.p(vPos.x, vPos.y));
	},
	getString: function () {
		return this._pTrackNode.getString();
	},
	setMaxStringCount: function (maxCount) {
		this._pTrackNode.m_maxLength = maxCount;
	},
	enablePassword: function () {
		this._pTrackNode.m_isPassword = true;
	},
	onClickTrackNode: function (clicked) {
		var textField = this._pTrackNode;
		if (clicked) {
			textField.attachWithIME();
		} else {
			//TextFieldTTFTest not be clicked
			textField.detachWithIME();
		}
	},
	setCallback: function (inputCallbackObj, inputCallbackFunc) {
		if (inputCallbackObj && inputCallbackFunc) {
			this._pTrackNode.m_callbackObj = inputCallbackObj;
			this._pTrackNode.m_callbackFunc = inputCallbackFunc;
		}
	}
});

TextEditBox.create = function(defaultText, fontName, fontSize) {
	var pEditbox = new TextEditBox();
	pEditbox._pTrackNode = _TextFieldTTF.create(defaultText, fontName, fontSize);
	pEditbox.addChild(pEditbox._pTrackNode);
	return pEditbox;
}