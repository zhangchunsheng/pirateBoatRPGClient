/**
 * @author Suker
 * 核心库
 */
var lib = window.lib || {};
(function() {
	var _args = {
		pageLoad: null,
		run: null,
		loadingRun: function(loaded, count) {
			var screenW = lib.canvas.screen.getWidth(),
			screenH = lib.canvas.screen.getHeight(),
			pw = parseInt(screenW * 0.5),
			ph = 20,
			sLeft = parseInt((screenW - pw) >> 1),
			sTop = parseInt((screenH - ph) >> 1),
            loadStor = 'loading: ' + loaded + ' / ' + count;
			lib.canvas.fillStyle(_args.canvas.bgColor).fillRect(0, 0, screenW, screenH)
            .strokeRect(sLeft, sTop, pw, ph)
            .fillStyle('#FFFFFF').fillRect(sLeft, sTop, pw, ph)
			.fillStyle('#00FFFF').fillRect(sLeft + 1, sTop + 1, parseInt((loaded / count) * (pw - 2)), ph - 2)
            .drawString(loadStor, 0, sTop + 14, lib.graphics.VCENTER, true, '#000000', '#FFFFFF');
            screenW = screenH = pw = ph = sLeft = sTop = loadStor = null;
		},
		runFun: null,
		runTimeout: null,
		imgs: [],
		images: {},
		countLoaded: 0,
		/**
		 * 画布相关参数集合
		 */
		canvas: {
			/**
			 * 当前画布Id
			 */
			id: 'canvas',
			/**
			 * 默认画布Id
			 */
			defaultId: 'canvas',
			/**
			 * 默认字体
			 */
			defaultFont: '12px Arial',
			/**
			 * 默认屏幕宽度
			 */
			defaultWidth: 240,
			/**
			 * 默认屏幕高度
			 */
			defaultHeight: 320,
			/**
			 * 默认颜色
			 */
			defaultColor: 'rgb(0, 0, 0)',
			/**
			 * 背景颜色
			 */
			bgColor: '#6A6A6A',
			/**
			 * canvas Dom对象集合
			 */
			cavansDoms: [],
			/**
		     * canvas的getContext('2d')对象集合
			 */
			ctxs: [],
			/**
			 * 设备名称
			 */
			device: '',
			/**
			 * 频率倍数
			 */
			fps: 1,
			/**
			 * 是否为触屏设备
			 */
			touch: false,
			/**
			 * 分辨率倍数
			 */
			zoom: 1,
			/**
			 * 默认频率
			 */
			frequency: 30
		}
	};
	var _enums = {
		/**
	 * 画布相关枚举集合
	 */
		canvas: {
			/**
		 * canvas的getContext('2d')对象集合索引
		 */
			context: {
				/**
			 * 默认
			 */
				base: 0
			},
			/**
		 * 图形锚点操作类型枚举
		 */
			graphics: {
				HCENTER: 1,
				VCENTER: 2,
				LEFT: 4,
				RIGHT: 8,
				TOP: 16,
				BOTTOM: 32,
				ANCHOR_LT: 20,
				ANCHOR_LV: 6,
				ANCHOR_LB: 36,
				ANCHOR_HT: 17,
				ANCHOR_HV: 3,
				ANCHOR_HB: 33,
				ANCHOR_RT: 24,
				ANCHOR_RV: 10,
				ANCHOR_RB: 40
			},
			/**
		 * 图形翻转类型枚举
		 */
			trans: {
				TRANS_MIRROR: 2,
				TRANS_NONE: 0,
				TRANS_ROT90: 5,
				TRANS_ROT180: 3,
				TRANS_ROT270: 6,
				TRANS_MIRROR_ROT90: 7,
				TRANS_MIRROR_ROT180: 1,
				TRANS_MIRROR_ROT270: 4
			}
		}
	};
	//API定义
	lib = {
		//初始化
		init: function(width, height, frequency) {
			if (width && height) {
				_args.canvas.defaultWidth = width;
				_args.canvas.defaultHeight = height;
				_args.canvas.frequency = frequency || 30;
			}
			return lib;
		},
		//入口函数
		pageLoad: function(fn) {
			if (!_args.pageLoad && typeof fn == 'function') {
				_args.pageLoad = fn;
				window.onload = function() {
					lib.canvas.init(); //初始化canvas
					_args.runFun = function() {
						if (_args.countLoaded <= _args.imgs.length) {
							_args.loadingRun(_args.countLoaded, _args.imgs.length);
							_args.runTimeout = setTimeout(_args.runFun, _args.canvas.frequency);
							_args.countLoaded++;
						}
						else {
							_args.pageLoad(lib);
						}
					};
					_args.runFun();
				};
			}
			return lib;
		},
		//设置资源加载动画回调
		loadingRun: function(fn) {
			if (typeof fn == 'function') {
				_args.loadingRun = fn;
			}
			return lib;
		},
		//主循环启动
		run: function(fn) {
			if (!_args.run && typeof fn == 'function') {
				_args.run = fn;
				if (_args.runTimeout) {
					clearTimeout(_args.runTimeout);
					_args.runTimeout = null;
				}
				_args.runFun = function() {
					_args.run(lib);
					_args.runTimeout = setTimeout(_args.runFun, _args.canvas.frequency);
				};
				_args.runFun();
			}
			return lib;
		},
		//取得一张图形对象
		getImage: function(id) {
			if (_args.images[id])
				return _args.images[id];
		},
		//初始化图形资源
		initImages: function(imgs) {
			_args.imgs = imgs || [];
			for (var i = 0, len = _args.imgs.length; i < len; i++) {
				_args.images[_args.imgs[i].id] = new Image();
				_args.images[_args.imgs[i].id].src = _args.imgs[i].src;
				_args.images[_args.imgs[i].id].onload = function() {
					_args.countLoaded++;
				};
				_args.images[_args.imgs[i].id].onerror = function(event) {
                    alert('图形加载错误');
				};
			}
			return lib;
		},
		//获取dom节点
		getDom: function(id) {
			try {
                return document.getElementById(id);
            }
            catch (e) {
                return document.all[id];
            }
		},
		//canvas命名空间
		canvas: (function() {
			var _canvas, _ctx, _drawImageArgs, _setColorArgs, _strokeRectArgs, _fillRectArgs, _drawStringArgs, _canvasDom, _deviceInfo,
			_currentW, _currentH;
			return {
				/**
				 * 初始化
				 */
				init: function() {
					_canvas = this;
					_drawImageArgs = { x: 0, y: 0 };
					_setColorArgs = { fillColor: '#000000', strokeColor: '#000000' };
					_strokeRectArgs = { x: 0, y: 0 };
					_fillRectArgs = { x: 0, y: 0 };
					_drawStringArgs = { x: 0, y: 0, fillStyle: '#FFFFFF', strokeStyle: '#CCCCCC' };
					return _canvas.pass();
				},
				/**
				 * 移交画布根
				 * @param {string} id
				 * @param {number} width
				 * @param {number} height
				 */
				pass: function(id, width, height) {
					var _id, _c;
					if (!id || id == '')
						_id = _args.canvas.defaultId;
					else
						_id = id;

					if (!_args.canvas.ctxs[_id]) {
						//不指定id的话则取前台canvas，否则创建缓冲区
						_c = id ? document.createElement('canvas') : _canvas.base().getDom(_id);
						_args.canvas.ctxs[_id] = null;
						delete(_args.canvas.ctxs[_id]);
						_args.canvas.ctxs[_id] = _c.getContext('2d');
						_c.width = width ? width : _args.canvas.defaultWidth;
						_c.style.width = parseInt(_c.width * _args.canvas.zoom) + 'px'; //等比缩放宽
						_c.height = height ? height : _args.canvas.defaultHeight;
						_c.style.height = parseInt(_c.height * _args.canvas.zoom) + 'px'; //等比缩放高
						_args.canvas.cavansDoms[_id] = null;
						delete(_args.canvas.cavansDoms[_id]);
						_args.canvas.cavansDoms[_id] = _c;
					}
					_ctx = _args.canvas.ctxs[_id];
					_ctx.font = _args.canvas.defaultFont;
					_canvasDom = _args.canvas.cavansDoms[_id];
					_currentW = parseInt(_canvasDom.width);
					_currentH = parseInt(_canvasDom.height);
					return _canvas.screen.setId(_id);
				},
				/**
				 * 设置字体
				 * @param {string} font
				 */
				font: function(font) {
					_args.canvas.defaultFont = font;
					_ctx.font = _args.canvas.defaultFont;
					return _canvas;
				},
				/**
				 * 移除缓冲区
				 * @param {string} id
				 */
				del: function(id) {
					if (_args.canvas.ctxs[id]) {
						_args.canvas.ctxs[id] = null;
						delete(_args.canvas.ctxs[id]);
						_args.canvas.cavansDoms[id] = null;
						delete(_args.canvas.cavansDoms[id]);
					}
					return _canvas;
				},/**
				 * 当前焦点画布数据
				 */
				screen: {
					/**
					 * 设置焦点画布Id
					 * @param {Object} id
					 */
					setId: function(id) {
						if (_args.canvas.ctxs[id])
							_args.canvas.id = id;
						return _canvas;
					},
					/**
					 * 获取焦点画布Id
					 */
					getId: function() {
						return _args.canvas.id;
					},
					/**
					 * 获取焦点画布宽度
					 */
					getWidth: function() {
						return _currentW;
					},
					/**
					 * 设置画布宽度
					 * @param {number} width
					 */
					setWidth: function(width) {
						_args.canvas.defaultWidth = width;
						if (_canvasDom) {
							_canvasDom.width = _args.canvas.defaultWidth;
							_canvasDom.style.width = _canvasDom.width + 'px';
							_currentW = parseInt(_canvasDom.width);
						}
						return _canvas;
					},
					/**
					 * 获取焦点画布高度
					 */
					getHeight: function() {
						return _currentH;
					},
					/**
					 * 设置画布高度
					 * @param {number} height
					 */
					setHeight: function(height) {
						_args.canvas.defaultHeight = height;
						if (_canvasDom) {
							_canvasDom.height = _args.canvas.defaultHeight;
							_canvasDom.style.height = _canvasDom.height + 'px';
							_currentH = parseInt(_canvasDom.height);
						}
						return _canvas;
					},
					/**
					 * 获取设备名
					 */
					getDevice: function() {
						return _args.canvas.device;
					},
					/**
					 * 获取频率倍数
					 */
					getFps: function() {
						return _args.canvas.fps;
					},
					/**
					 * 设置频率倍数
					 * @param {number} fps
					 */
					setFps: function(fps) {
						if (fps > 0)
							_args.canvas.fps = fps;
						return _canvas;
					},
					/**
					 * 识别是否为触屏设备
					 */
					getTouch: function() {
						return _args.canvas.touch;
					},
					/**
					 * 获取分辨率倍数
					 */
					getZoom: function() {
						return _args.canvas.zoom;
					}
				},
				/**
				 * 设置填充颜色
				 * @param {string} color
				 */
				fillStyle: function(color) {
					_ctx.fillStyle = color;
					return _canvas;
				},
				/**
				 * 填充矩形
				 * @param {number} x
				 * @param {number} y
				 * @param {number} width
				 * @param {number} height
				 * @param {number} anchor
				 */
				fillRect: function(x, y, width, height, anchor) {
					width = width ? width : 0;
					height = height ? height : 0;
					if (anchor) {
						_fillRectArgs = _events.getAnchor(x, y, width, height, anchor);
					}
					else {
						_fillRectArgs.x = x;
						_fillRectArgs.y = y;
					}
					_ctx.fillRect(_fillRectArgs.x, _fillRectArgs.y, width, height);
					return _canvas;
				},
				/**
				 * 输出文本
				 * @param {string} text
				 * @param {number} x
				 * @param {number} y
				 * @param {string} font
				 */
				fillText: function(text, x, y, font) {
					_ctx.font = font || _args.canvas.defaultFont;
					_ctx.fillText(text, x, y);
					return _canvas
				},
				/**
				 * 清除矩形
				 * @param {number} x
				 * @param {number} y
				 * @param {number} width
				 * @param {number} height
				 */
				clearRect: function(x, y, width, height) {
					_ctx.clearRect(x, y, width, height);
					return _canvas;
				},
				/**
				 * 清除整个屏幕
				 */
				clearScreen: function() {
					return _canvas.clearRect(0, 0, _currentW, _currentH);
				},
				/**
				 * 填充整个屏幕
				 */
				fillScreen: function() {
					return _canvas.fillRect(0, 0, _currentW, _currentH);
				},
				/**
				 * 设置边框颜色
				 * @param {string} color
				 */
				strokeStyle: function(color) {
					_ctx.strokeStyle = color;
					return _canvas;
				},
				/**
				 * 设置边线宽度
				 * @param {number} width
				 */
				lineWidth: function(width) {
					_ctx.lineWidth = width || 1;
					return _canvas;
				},
				/**
				 * 绘制矩形边框
				 * @param {number} x
				 * @param {number} y
				 * @param {number} width
				 * @param {number} height
				 * @param {number} anchor
				 */
				strokeRect: function(x, y, width, height, anchor) {
					if (anchor) {
						_strokeRectArgs = _events.getAnchor(x, y, width, height, anchor);
					}
					else {
						_strokeRectArgs.x = x;
						_strokeRectArgs.y = y;
					}
					_ctx.strokeRect(_strokeRectArgs.x, _strokeRectArgs.y, width, height);
					return _canvas;
				},
				/**
				 * 绘制文字边框
				 * @param {string} text
				 * @param {number} x
				 * @param {number} y
				 * @param {string} font
				 */
				strokeText: function(text, x, y, font) {
					_ctx.font = font || _args.canvas.defaultFont;
					_ctx.strokeText(text, x, y);
					return _canvas;
				},
				/**
				 * 设置填充和边框颜色
				 * 重载(+3)
				 * setColor(color);
				 * setColor(fillColor, strokeColor);
				 * setColor(r, g, b);
				 * @param {string/number} fillColor
				 * @param {string/number} strokeColor
				 * @param {number} rgbCtrl
				 */
				setColor: function(fillColor, strokeColor, rgbCtrl) {
					if (rgbCtrl == null) {
						_setColorArgs.fillColor = fillColor;
						_setColorArgs.strokeColor = strokeColor ? strokeColor : fillColor;
					}
					else {
						_setColorArgs.fillColor = 'rgb(' + fillColor + ', ' + strokeColor + ', ' + rgbCtrl + ')';
						_setColorArgs.strokeColor = _setColorArgs.fillColor;
					}
					return _canvas.fillStyle(_setColorArgs.fillColor).strokeStyle(_setColorArgs.strokeColor);
				},
				/**
				 * * 绘制图像
				 * 重载(+4)
				 * drawImage(imageid, x, y);
				 * drawImage(imageid, x, y, anchor);
				 * drawImage(imageid, sx, sy, sWidth, sHeight, x, y, width, height);
				 * drawImage(imageid, sx, sy, sWidth, sHeight, x, y, width, height, anchor);
				 * @param {string} imageid
				 * @param {number} sx
				 * @param {number} sy
				 * @param {number} sWidth
				 * @param {number} sHeight
				 * @param {number} x
				 * @param {number} y
				 * @param {number} width
				 * @param {number} height
				 * @param {number} anchor
				 */
				drawImage: function(imageid, sx, sy, sWidth, sHeight, x, y, width, height, anchor) {
//					console.log(imageid + ',' + sx + ',' + sy + ',' + sWidth + ',' + sHeight + ',' + x + ',' + y + ',' + width + ',' + height + ',' + anchor);
					if (!sWidth)
						_ctx.drawImage(lib.getImage(imageid), sx, sy);
					else if (!sHeight) {
						_drawImageArgs = _events.getAnchor(sx, sy, lib.getImage(imageid).width, lib.getImage(imageid).height, sWidth);
						_ctx.drawImage(lib.getImage(imageid), _drawImageArgs.x, _drawImageArgs.y);
					}
					else if (!anchor)
						_ctx.drawImage(lib.getImage(imageid), sx, sy, sWidth, sHeight, x, y, width, height);
					else {
						_drawImageArgs = _events.getAnchor(x, y, width, height, anchor);
						_ctx.drawImage(lib.getImage(imageid), sx, sy, sWidth, sHeight, _drawImageArgs.x, _drawImageArgs.y, width, height);
					}
					return _canvas;
				},
				/**
				 * 旋转图形
				 * @param {string} id
				 * @param {number} sx
				 * @param {number} sy
				 * @param {number} sWidth
				 * @param {number} sHeight
				 * @param {number} x
				 * @param {number} y
				 * @param {number} width
				 * @param {number} height
				 * @param {number} rot
				 */
				drawRotate: function(id, sx, sy, sWidth, sHeight, x, y, width, height, rot) {
					var _hw = parseInt(width >> 1), _hh = parseInt(height >> 1),
					_getImage = lib.getImage(id), _image = _getImage ? _getImage : _args.canvas.cavansDoms[id];
					x -= _hw; //换算中心店坐标
					y -= _hh;
					_ctx.save();
					_ctx.translate(x + _hw, y + _hh);
					_ctx.rotate(rot * Math.PI / 180);
					_ctx.translate(-(x + _hw), -(y + _hh));
					_ctx.drawImage(_image,  sx, sy, sWidth, sHeight, x, y, width, height);
					_ctx.restore();
					_image = null;
					_getImage = null;
					_hh = null;
					_hw = null;
					return _canvas;
				},
				/**
				 * 渲染缓冲区
				 * @param {string} id
				 * @param {number} sx
				 * @param {number} sy
				 * @param {number} sWidth
				 * @param {number} sHeight
				 * @param {number} x
				 * @param {number} y
				 * @param {number} width
				 * @param {number} height
				 * @param {number} anchor
				 */
				drawCache: function(id, sx, sy, sWidth, sHeight, x, y, width, height, anchor) {
					var _cache = _args.canvas.cavansDoms[id];
					if (_cache) {
						if (!sWidth)
							_ctx.drawImage(_cache, sx, sy);
						else if (!sHeight) {
							_drawImageArgs = _events.getAnchor(sx, sy, _cache.width, _cache.height, sWidth);
							_ctx.drawImage(_cache, _drawImageArgs.x, _drawImageArgs.y);
						}
						else if (!anchor)
							_ctx.drawImage(_cache, sx, sy, sWidth, sHeight, x, y, width, height);
						else {
							_drawImageArgs = _events.getAnchor(x, y, width, height, anchor);
							_ctx.drawImage(_cache, sx, sy, sWidth, sHeight, _drawImageArgs.x, _drawImageArgs.y, width, height);
						}
					}
					_cache = null;
					return _canvas;
				},
				/**
				 * 绘制翻转图形
				 * @param {string} imageid
				 * @param {number} sx
				 * @param {number} sy
				 * @param {number} sw
				 * @param {number} sh
				 * @param {number} trans
				 * @param {number} x
				 * @param {number} y
				 * @param {number} anchor
				 */
				drawRegion: function(imageid, sx, sy, sw, sh, trans, x, y, anchor){
					switch (trans) {
			            case _enums.canvas.trans.TRANS_NONE:
						default:
			                _ctx.setTransform(1, 0, 0, 1, x, y);
			                break;
			            case _enums.canvas.trans.TRANS_ROT90:
			                _ctx.setTransform(0, 1, -1, 0, sh + x, y);
			                break;
			            case _enums.canvas.trans.TRANS_ROT180:
			                _ctx.setTransform(-1, 0, 0, -1, sw + x, sh + y);
			                break;
			            case _enums.canvas.trans.TRANS_ROT270:
			                _ctx.setTransform(0, -1, 1, 0, x, sw + y);
			                break;
			            case _enums.canvas.trans.TRANS_MIRROR:
			                _ctx.setTransform(-1, 0, 0, 1, sw + x, y);
			                break;
			            case _enums.canvas.trans.TRANS_MIRROR_ROT90:
			                _ctx.setTransform(0, -1, -1, 0, sh + x, sw + y);
			                break;
			            case _enums.canvas.trans.TRANS_MIRROR_ROT180:
			                _ctx.setTransform(1, 0, 0, -1, x, sh + y);
			                break;
			            case _enums.canvas.trans.TRANS_MIRROR_ROT270:
			                _ctx.setTransform(0, 1, 1, 0, x, y);
			                break;
			        }
					var _image = lib.getImage(imageid), _drawMethod = _image ? _canvas.drawImage : _canvas.drawCache;
			        _drawMethod(imageid, sx, sy, sw, sh, 0, 0, sw, sh);
			        _ctx.setTransform(1, 0, 0, 1, 0, 0);
					_drawMethod = null;
					_image = null
					return _canvas;
			    },
				/**
				 * 绘制数字图形
				 * @param {number} numbers
				 * @param {string} imageid
				 * @param {number} numberWidth
				 * @param {number} numberHeight
				 * @param {number} x
				 * @param {number} y
				 * @param {bool} against
				 * @param {number} scaleWidth
				 * @param {number} scaleHeight
				 */
				drawNumber: function(numbers, imageid, numberWidth, numberHeight, x, y, against, scaleWidth, scaleHeight) {
					var _num = numbers.toString(), _len = _num.length, _showW = scaleWidth ? scaleWidth : numberWidth, _showH = scaleHeight ? scaleHeight : numberHeight;
					if (against)
						for (var i = 0; i < _len; i++) {
							_canvas.drawImage(imageid, parseInt(_num.charAt(i)) * numberWidth, 0, numberWidth, numberHeight, x + (i * _showW), y, _showW, _showH);
						}
					else
						for (var i = _len - 1; i >= 0; i--) {
							_canvas.drawImage(imageid, parseInt(_num.charAt(i)) * numberWidth, 0, numberWidth, numberHeight, x - ((_len - 1 - i) * _showW), y, _showW, _showH, lib.graphics.ANCHOR_RT);
						}
					_showH = null;
					_showW = null;
					_len = null;
					_num = null;
					return _canvas;
				},
				/**
				 * 设置笔触
				 * @param {number} x
				 * @param {number} y
				 */
				moveTo: function(x, y) {
					_ctx.moveTo(x, y);
					return _canvas;
				},
				/**
				 * 绘制直线
				 * @param {number} x
				 * @param {number} y
				 */
				lineTo: function(x, y) {
					_ctx.lineTo(x, y);
					return _canvas;
				},
				/**
				 * 描边
				 */
				stroke: function() {
					_ctx.stroke();
					return _canvas;
				},
				/**
				 * 填充
				 */
				fill: function() {
					_ctx.fill();
					return _canvas;
				},
				/**
				 * 开始路径
				 */
				beginPath: function() {
					_ctx.beginPath();
					return _canvas;
				},
				/**
				 * 关闭路径
				 */
				closePath: function() {
					_ctx.closePath();
					return _canvas;
				},
				/**
				 * 绘制弧线
				 * @param {number} x
				 * @param {number} y
				 * @param {number} radius
				 * @param {number} startAngle
				 * @param {number} endAngle
				 * @param {number} anticlockwise
				 */
				arc: function(x, y, radius, startAngle, endAngle, anticlockwise) {
					_ctx.arc(x, y, radius, startAngle, endAngle, anticlockwise);
					return _canvas;
				},
				/**
				 * 绘制二次方曲线
				 * @param {number} cp1x
				 * @param {number} cp1y
				 * @param {number} x
				 * @param {number} y
				 */
				quadraticCurveTo: function(cp1x, cp1y, x, y) {
					_ctx.quadraticCurveTo(cp1x, cp1y, x, y);
					return _canvas;
				},
				/**
				 * 绘制贝塞尔曲线
				 * @param {number} cp1x
				 * @param {number} cp1y
				 * @param {number} cp2x
				 * @param {number} cp2y
				 * @param {number} x
				 * @param {number} y
				 */
				bezierCurveTo: function(cp1x, cp1y, cp2x, cp2y, x, y) {
					_ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
					return _canvas;
				},
				/**
				 * 返回文本宽度
				 * @param {string} text
				 */
				measureText: function(text) {
					var _mt = _ctx.measureText(text), _tw = _mt.width, _th = _mt.height ? _mt.height : parseInt(_ctx.font);
					return { width: _canvas.screen.getDevice() == 'j2me' ? _ctx.measureText(text) : _tw, height: _th };
				},
				/**
				 * 画布偏移
				 * @param {number} x
				 * @param {number} y
				 */
				translate: function(x, y) {
					_ctx.translate(x, y);
					return _canvas;
				},
				/**
				 * 绘一条直线
				 * @param {number} x1
				 * @param {number} y1
				 * @param {number} x2
				 * @param {number} y2
				 */
				drawLine: function(x1, y1, x2, y2) {
					return _canvas.beginPath().moveTo(x1, y1).lineTo(x2, y2).closePath().stroke();
				},
				/**
				 * 绘制矩形框(支持锚点)
				 * @param {number} x
				 * @param {number} y
				 * @param {number} width
				 * @param {number} height
				 * @param {number} anchor
				 */
				drawRect: function(x, y, width, height, anchor) {
					return _canvas.strokeRect(x, y, width, height, anchor);
				},
				/**
				 * 按照对齐方式绘制文字
				 * @param {string} str
				 * @param {number} x
				 * @param {number} y
				 * @param {number} align
				 * @param {bool} drawStroke
				 * @param {string} fillStyle
				 * @param {string} strokeStyle
				 * @param {string} font
				 */
				drawString: function(str, x, y, align, drawStroke, fillStyle, strokeStyle, font) {
					_drawStringArgs.x = x;
					_drawStringArgs.y = y;
					_ctx.font = font || _args.canvas.defaultFont;
					if (align) {
						switch (align) {
							case _enums.canvas.graphics.LEFT:
								_drawStringArgs.x = 0;
								break;
							case _enums.canvas.graphics.VCENTER:
								_drawStringArgs.x = parseInt((_canvas.screen.getWidth() - _canvas.measureText(str).width) >> 1);
								break;
							case _enums.canvas.graphics.RIGHT:
								_drawStringArgs.x = _canvas.screen.getWidth() - _canvas.measureText(str).width;
								break;
							default:
								break;
						}
					}

					if (drawStroke) {
						if (fillStyle)
							_drawStringArgs.fillStyle = fillStyle;
						else
							_drawStringArgs.fillStyle = '#000000';
						if (strokeStyle)
							_drawStringArgs.strokeStyle = strokeStyle;
						else
							_drawStringArgs.strokeStyle = '#CCCCCC';
						_canvas.fillStyle(_drawStringArgs.strokeStyle).fillText(str, _drawStringArgs.x + 1, _drawStringArgs.y + 1, font).fillStyle(_drawStringArgs.fillStyle);
					}

					return _canvas.fillText(str, _drawStringArgs.x, _drawStringArgs.y, font).fillStyle(_args.canvas.defaultColor);
				},
				/**
				 * 切割文字后按照对齐方式绘制文字
				 * @param {string} str
				 * @param {number} offset
				 * @param {number} len
				 * @param {number} x
				 * @param {number} y
				 * @param {number} align
				 * @param {bool} drawStroke
				 * @param {string} fillStyle
				 * @param {string} strokeStyle
				 * @param {string} font
				 */
				drawSubstring: function(str, offset, len, x, y, align, drawStroke, fillStyle, strokeStyle, font) {
					return _canvas.drawString(str.substring(offset, offset + len), x, y, align, drawStroke, fillStyle, strokeStyle, font);
				},
				/**
				 * 使用当前路径作为连续绘制操作的剪切区域
				 */
				clip: function() {
					_ctx.clip();
					return _canvas;
				},
				/**
				 * 保存 CanvasRenderingContext2D 对象的属性、剪切区域和变换矩阵
				 */
				save: function() {
					_ctx.save();
					return _canvas;
				},
				/**
				 * 为画布重置为最近保存的图像状态
				 */
				restore: function() {
					_ctx.restore();
					return _canvas;
				},
				/**
				 * 为当前路径添加一条矩形子路径
				 * @param {number} x
				 * @param {number} y
				 * @param {number} width
				 * @param {number} height
				 */
				rect: function(x, y, width, height) {
					_ctx.rect(x, y, width, height);
					return _canvas;
				},
				/**
				 * 旋转画布的坐标系统
				 * @param {number} angle - 旋转的量，用弧度表示。正值表示顺时针方向旋转，负值表示逆时针方向旋转。
				 */
				rotate: function(angle) {
					_ctx.rotate(angle);
					return _canvas;
				},
				/**
				 * 绘制变形图形
				 * @param {number} m11
				 * @param {number} m12
				 * @param {number} m21
				 * @param {number} m22
				 * @param {number} dx
				 * @param {number} dy
				 */
				setTransform: function(m11, m12, m21, m22, dx, dy) {
					_ctx.setTransform(m11, m12, m21, m22, dx, dy);
					return _canvas;
				},
				/**
				 * 标注画布的用户坐标系统 缩放画布
				 * @param {number} sx
				 * @param {number} sy
				 */
				scale: function(sx, sy) {
					_ctx.scale(sx, sy);
					return _canvas;
				},
				/**
				 * 指定在画布上绘制的内容的不透明度
				 * @param {number} alpha
				 */
				globalAlpha: function(alpha) {
					_ctx.globalAlpha = alpha || 1.0;
					return _canvas;
				},
				/**
				 * 获取画布原生 CanvasRenderingContext2D 对象
				 */
				getContext: function() {
					return _ctx;
				},
				/**
				 * 将方法链交给lib
				 */
				base: function() {
					return lib;
				}
			};
		})(),
		/**
		 * 图形锚点操作常量命名空间
		 */
		graphics: (function() {
			return {
				HCENTER: _enums.canvas.graphics.HCENTER,
				VCENTER: _enums.canvas.graphics.VCENTER,
				LEFT: _enums.canvas.graphics.LEFT,
				RIGHT: _enums.canvas.graphics.RIGHT,
				TOP: _enums.canvas.graphics.TOP,
				BOTTOM: _enums.canvas.graphics.BOTTOM
			};
		})(),
		/**
		 * 图形翻转操作常量命名空间
		 */
		trans: (function() {
			return {
				TRANS_NONE: _enums.canvas.trans.TRANS_NONE,
				TRANS_ROT90: _enums.canvas.trans.TRANS_ROT90,
				TRANS_ROT180: _enums.canvas.trans.TRANS_ROT180,
				TRANS_ROT270: _enums.canvas.trans.TRANS_ROT270,
				TRANS_MIRROR: _enums.canvas.trans.TRANS_MIRROR,
				TRANS_MIRROR_ROT90: _enums.canvas.trans.TRANS_MIRROR_ROT90,
				TRANS_MIRROR_ROT180: _enums.canvas.trans.TRANS_MIRROR_ROT180,
				TRANS_MIRROR_ROT270: _enums.canvas.trans.TRANS_MIRROR_ROT270
			};
		})(),
		/**
        * 通用方法集合
        */
        commandFuns: (function() {
			var _getArrayArgs = { arr: [], len: 0, v: 0 };
			return {
	            /**
	             * 订阅事件
	             * @param {object} observer
	             * @param {Function} fn
	             */
	            registerNotify: function(observer, fn) {
	                if (observer != null)
	                    observer.register(fn);
	            },

	            /**
	             * 批量订阅
	             * @param {object} observer
	             * @param {array} range
	             */
	            rangeRegisterNotify: function(observer, range) {
	                for (var i = 0; i < range.length; i++) {
	                    lib.commandFuns.registerNotify(observer, range[i]);
	                }
	            },

	            /**
	             * 取消订阅事件
	             * @param {object} observer
	             * @param {Function} fn
	             */
	            unRegisterNotify: function(observer, fn) {
	                if (observer != null)
	                    observer.unregister(fn);
	            },

	            /**
	             * 批量取消
	             * @param {object} observer
	             * @param {array} range
	             */
	            rangeUnRegisterNotify: function(observer, range) {
	                for (var i = 0; i < range.length; i++) {
	                    lib.commandFuns.unRegisterNotify(observer, range[i]);
	                }
	            },
				/**
				 * 取随机数
				 * @param {number} min
				 * @param {number} max
				 */
				getRandom: function(min, max) {
					if (!max) {
						var _seed = min;
						if (!_seed || _seed < 0)
							_seed = 0;
						return Math.round(Math.random() * _seed);
					}
					else {
						return Math.round(Math.random() * (max - min) + min);
					}
				},
				/**
				 * 将数字转换为数组
				 * @param {number} num
				 * @param {bool} isReverse
				 */
				getArray: function(num, isReverse) {
					_getArrayArgs.arr = [];
					_getArrayArgs.len = num.toString().length;
					_getArrayArgs.v = num;
					for (var i = 0; i < _getArrayArgs.len; i++) {
						_getArrayArgs.arr.push(_getArrayArgs.v % 10);
						_getArrayArgs.v = parseInt(_getArrayArgs.v / 10);
					}
					if (!isReverse)
						_getArrayArgs.arr.reverse();
					return _getArrayArgs.arr;
				},
				/**
				 * 取得特定元素在数组中的索引通用方法 (1.5 New)
				 * @param {object} obj
				 * @param {array} arr
				 */
				inArray: function(obj, arr) {
					var _ii, _len = arr.length;
					for(_ii = 0; _ii < _len; _ii++) {
						if (obj == arr[_ii])
							return _ii;
					}
					return -1;
				},
				/**
				 * 矩形碰撞检测
				 * @param {number} x1
				 * @param {number} y1
				 * @param {number} w1
				 * @param {number} h1
				 * @param {number} x2
				 * @param {number} y2
				 * @param {number} w2
				 * @param {number} h2
				 */
				collisionCheck: function(x1, y1, w1, h1, x2, y2, w2, h2) {
					//lib.canvas.fillStyle('#FF0000').fillRect(x1, y1, w1, h1).fillStyle('#0000FF').fillRect(x2, y2, w2, h2);
					if(w2 && Math.abs((x1 + parseInt(w1/2)) - (x2 + parseInt(w2/2))) < parseInt((w1 + w2) / 2) && Math.abs((y1 + parseInt(h1/2)) - (y2 + parseInt(h2/2))) < parseInt((h1 + h2) / 2))
				  		return true;
					return false;
				},
				/**
				 * 圆形碰撞检测
				 * @param {number} x1
				 * @param {number} y1
				 * @param {number} radius1
				 * @param {number} x2
				 * @param {number} y2
				 * @param {number} radius2
				 */
				circleCollisionCheck: function(x1, y1, radius1, x2, y2, radius2) {
					 var _mx = Math.abs(x1 - x2), _my = Math.abs(y1 - y2);
					 if ((Math.sqrt(_mx * _mx + _my * _my)) < (radius1 + radius2))
						return true;
					return false;
				}
	        }
		})()
	};
})();
