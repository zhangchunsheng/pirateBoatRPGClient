/**
 * @author John Carmack
 * trans by Suker
 * 卡马克算法
 */
lib.carmark = (function($) {
	var _carmarkArgs, _carmarkPrivate = {
		/**
		 * 第一次绘制缓冲区
		 */
		initBuffer: function() {
			console.log(_carmarkArgs);
			for (var _ci = 0; _ci < _carmarkArgs.carTitleHeight; _ci++) {
				if (!_carmarkArgs.map[_ci])
					continue;
	            for (var _cj = 0; _cj < _carmarkArgs.carTitleWidth; _cj++) {
	                var tileid = _carmarkArgs.map[_ci][_cj];
	                if (tileid != 0) {//为0时候代表改块为空
	                    tileid = tileid < 0 ? -tileid : tileid;
						var tile = _carmarkArgs.tiles[tileid];
						if (tile)
							_carmarkArgs.carGp.drawImage($.getImage(tile.imageid), tile.sx, tile.sy, _carmarkArgs.titleW, _carmarkArgs.titleH, _cj * _carmarkArgs.titleW, _ci * _carmarkArgs.titleH, _carmarkArgs.titleW, _carmarkArgs.titleH);
						tile = null;
	                } else {//以背景色彩填充之
						_carmarkArgs.carGp.fillStyle = '#333333';
						_carmarkArgs.carGp.fillRect(_cj * _carmarkArgs.titleW, _ci * _carmarkArgs.titleH, _carmarkArgs.titleW, _carmarkArgs.titleH);

	                }
	            }
	        }
		},
		/**
		 * 卷动一步
		 * @param {Object} x
		 * @param {Object} y
		 */
		scrollDelt: function(x, y) {
			x += _carmarkArgs.mapOffx;
	        y += _carmarkArgs.mapOffy;
//			_carmarkArgs.xState = 0;
//			_carmarkArgs.yState = 0;
	        if (x < 0) {
				_carmarkArgs.xState = x;
	            return false;
	        }
			if (y < 0) {
				_carmarkArgs.yState = y;
	            return false;
	        }
	        if (x > _carmarkArgs.mapLastx) {
				_carmarkArgs.xState = x - _carmarkArgs.mapLastx;
	            _carmarkArgs.mapOffx = _carmarkArgs.mapLastx;
	            return false;
	        }
	        if (y > _carmarkArgs.mapLasty) {
				_carmarkArgs.yState = y - _carmarkArgs.mapLasty;
	            _carmarkArgs.mapOffy = _carmarkArgs.mapLasty;
	            return false;
	        }
//			if (_carmarkArgs.xState != 0 || _carmarkArgs.yState != 0)
//				return false;
	        _carmarkPrivate.updateBuffer(x, y);
		},
		/**
		 * 更新
		 * @param {Object} x
		 * @param {Object} y
		 */
		updateBuffer: function(x, y) {
			//处理卡马克线
			_carmarkArgs.mapOffx = x;
	        _carmarkArgs.mapOffy = y;
	        if (x > _carmarkArgs.carx + _carmarkArgs.buffW) {
	            var indexMapLastX = _carmarkPrivate.getIndexBuffLastX();
	            if (indexMapLastX < _carmarkArgs.titleW) {
	                _carmarkPrivate.copyBufferX(indexMapLastX, _carmarkPrivate.getIndexCarY(), _carmarkPrivate.getTitleHeight(),
	                        _carmarkPrivate.getBufferCarX(), _carmarkPrivate.getBufferCarY());
	                _carmarkArgs.carx += _carmarkArgs.titleW;
	            }
	        }
	        if (x < _carmarkArgs.carx) {
	            _carmarkArgs.carx -= _carmarkArgs.titleW;
	            _carmarkPrivate.copyBufferX(_carmarkPrivate.getIndexCarX(), _carmarkPrivate.getIndexCarY(), _carmarkPrivate.getTitleHeight(),
	                    _carmarkPrivate.getBufferCarX(), _carmarkPrivate.getBufferCarY());
	        }
	        if (y > _carmarkArgs.cary + _carmarkArgs.buffH) {
	            var indexMapLastY = _carmarkPrivate.getIndexBuffLastY();
	            if (indexMapLastY < _carmarkArgs.titleH)
	            {
	                _carmarkPrivate.copyBufferY(_carmarkPrivate.getIndexCarX(), indexMapLastY, _carmarkPrivate.getTitelWidth(),
	                        _carmarkPrivate.getBufferCarX(), _carmarkPrivate.getBufferCarY());
	                _carmarkArgs.cary += _carmarkArgs.titleH;
	            }
	        }
	        if (y < _carmarkArgs.cary) {
	            _carmarkArgs.cary -= _carmarkArgs.titleH;
	            _carmarkPrivate.copyBufferY(_carmarkPrivate.getIndexCarX(), _carmarkPrivate.getIndexCarY(), _carmarkPrivate.getTitelWidth(),
	                    _carmarkPrivate.getBufferCarX(), _carmarkPrivate.getBufferCarY());
	        }
		},
		getIndexCarX: function() {
			return _carmarkArgs.carx / _carmarkArgs.titleW;
		},
		getIndexCarY: function() {
	        return _carmarkArgs.cary / _carmarkArgs.titleH;
	    },
		getBufferCarX: function() {
	        return _carmarkArgs.carx % _carmarkArgs.carWidth;
	    },
		getBufferCarY: function() {
	        return _carmarkArgs.cary % _carmarkArgs.carHeight;
	    },
		getIndexBuffLastX: function() {
	        return (_carmarkArgs.carx + _carmarkArgs.carWidth) / _carmarkArgs.titleW;
	    },
		getIndexBuffLastY: function() {
	        return (_carmarkArgs.cary + _carmarkArgs.carHeight) / _carmarkArgs.titleH;
	    },
		getTitleHeight: function() {
	        return (_carmarkArgs.carHeight - _carmarkArgs.cary % _carmarkArgs.carHeight) / _carmarkArgs.titleH;
	    },
		getTitelWidth: function() {
	        return (_carmarkArgs.carWidth - _carmarkArgs.carx % _carmarkArgs.carWidth) / _carmarkArgs.titleW;
	    },
		copyBufferX: function(indexMapx, indexMapy, titleHeight, destx, desty) {
			var vy;
	        for (var _bj = 0; _bj < titleHeight; _bj++) {
	            vy = _bj * _carmarkArgs.titleH + desty;
				if (!_carmarkArgs.map[indexMapy + _bj])
					continue;
	            var tileid = _carmarkArgs.map[indexMapy + _bj][indexMapx];
	            if (tileid != 0) {
	                tileid = tileid < 0 ? -tileid : tileid;
					var tile = _carmarkArgs.tiles[tileid];
					if (tile)
						_carmarkArgs.carGp.drawImage($.getImage(tile.imageid), tile.sx, tile.sy, _carmarkArgs.titleW, _carmarkArgs.titleH, destx, vy, _carmarkArgs.titleW, _carmarkArgs.titleH);
	            	tile = null;
				} else {
	                _carmarkArgs.carGp.fillStyle = '#333333';
					_carmarkArgs.carGp.fillRect(destx, vy, _carmarkArgs.titleW, _carmarkArgs.titleH);
	            }
	        }
	        for (var _bk = titleHeight; _bk < _carmarkArgs.carTitleHeight; _bk++) {
	            vy = (_bk - titleHeight) * _carmarkArgs.titleH;
				if (!_carmarkArgs.map[indexMapy + _bk])
					continue;
	            var tileid = _carmarkArgs.map[indexMapy + _bk][indexMapx];
	            if (tileid != 0){
	                tileid = tileid < 0 ? -tileid : tileid;
					var tile = _carmarkArgs.tiles[tileid];
					if (tile)
						_carmarkArgs.carGp.drawImage($.getImage(tile.imageid), tile.sx, tile.sy, _carmarkArgs.titleW, _carmarkArgs.titleH, destx, vy, _carmarkArgs.titleW, _carmarkArgs.titleH);
	            	tile = null;
				} else {
	                _carmarkArgs.carGp.fillStyle = '#333333';
					_carmarkArgs.carGp.fillRect(destx, vy, _carmarkArgs.titleW, _carmarkArgs.titleH);
	            }
	        }
		},
		copyBufferY: function(indexMapx, indexMapy, titleWidth, destx, desty) {
			var vx;
	        for (var _ci = 0; _ci < titleWidth; _ci++) {
	            vx = _ci * _carmarkArgs.titleW + destx;
				if (!_carmarkArgs.map[indexMapy])
					continue;
	            var tileid = _carmarkArgs.map[indexMapy][indexMapx + _ci];
	            if (tileid != 0) {
	                tileid = tileid < 0 ? -tileid : tileid;
					var tile = _carmarkArgs.tiles[tileid];
					if (tile)
						_carmarkArgs.carGp.drawImage($.getImage(tile.imageid), tile.sx, tile.sy, _carmarkArgs.titleW, _carmarkArgs.titleH, vx, desty, _carmarkArgs.titleW, _carmarkArgs.titleH);
	            	tile = null;
				} else {
					_carmarkArgs.carGp.fillStyle = '#333333';
					_carmarkArgs.carGp.fillRect(vx, desty, _carmarkArgs.titleW, _carmarkArgs.titleH);
	            }
	        }
	        for (var _ck = titleWidth; _ck < _carmarkArgs.carTitleWidth; _ck++) {
	            vx = (_ck - titleWidth) * _carmarkArgs.titleW;
				if (!_carmarkArgs.map[indexMapy])
					continue;
	            var tileid =_carmarkArgs.map[indexMapy][indexMapx + _ck];
	            if (tileid != 0) {
	                tileid = tileid < 0 ? -tileid : tileid;
					var tile = _carmarkArgs.tiles[tileid];
					if (tile)
						_carmarkArgs.carGp.drawImage($.getImage(tile.imageid), tile.sx, tile.sy, _carmarkArgs.titleW, _carmarkArgs.titleH, vx, desty, _carmarkArgs.titleW, _carmarkArgs.titleH);
	            	tile = null;
			    } else {
					_carmarkArgs.carGp.fillStyle = '#333333';
					_carmarkArgs.carGp.fillRect(vx, desty, _carmarkArgs.titleW, _carmarkArgs.titleH);
	            }

	        }
		},
		/**
		 * 绘制一个区
		 * @param {Object} g
		 * @param {Object} img
		 * @param {Object} x_src
		 * @param {Object} y_src
		 * @param {Object} width
		 * @param {Object} height
		 * @param {Object} x_dest
		 * @param {Object} y_dest
		 */
		drawRange: function(g, img, x_src, y_src, width, height, x_dest, y_dest) {
			if (width <= 0 || height <= 0) {
	            return false;
	        }
	        if (width > _carmarkArgs.scrWidth) {
	            width = _carmarkArgs.scrWidth;
	        }
	        if (height > _carmarkArgs.scrHeight) {
	            height = _carmarkArgs.scrHeight;
	        }
        	g.drawImage(img, x_src, y_src, width, height, x_dest, y_dest, width, height);
		}
	};

	return function(scrW, scrH, titleW, titleH, offsetTitleNumber, map, tiles, cache) {
		_carmarkArgs = {
			carWidth: 0,
			carHeight: 0,
			carTitleWidth: 0,
			carTitleHeight: 0,
			scrWidth: 0,
			scrHeight: 0,
			carx: 0, //卡马克线坐标
			cary: 0,
			mapOffx: 0,
			mapOffy: 0,
			carBuffer: null,
			carGp: null,
			buffSize: 0,
			titleSize: 0,
			titleW: 0,
			titleH: 0,
			mapLastx: 0,
			mapLasty: 0,
			map: [[]],
			tiles: null,
			xState: 0,
			yState: 0
		};
		_carmarkArgs.scrWidth = scrW; //屏幕宽高
        _carmarkArgs.scrHeight = scrH;
        _carmarkArgs.titleW = titleW; //地砖宽高
        _carmarkArgs.titleH = titleH;
        _carmarkArgs.buffW = titleW * offsetTitleNumber; //外圈缓冲地砖宽高
        _carmarkArgs.buffH = titleH * offsetTitleNumber;
		_carmarkArgs.map = map; //地图数组
		_carmarkArgs.tiles = tiles; //地砖数组


        var temp = 0;
        while (temp < _carmarkArgs.scrWidth) {
            temp += titleW;
        }
        _carmarkArgs.carWidth = _carmarkArgs.buffW + temp;
        temp = 0;
        while (temp < _carmarkArgs.scrHeight) {
            temp += titleH;
        }
		console.log("temp:" + temp);
        _carmarkArgs.carHeight = _carmarkArgs.buffH + temp;
		//地砖个数
        _carmarkArgs.carTitleWidth = _carmarkArgs.carWidth / titleW;
        _carmarkArgs.carTitleHeight = _carmarkArgs.carHeight / titleH;
		//创建缓冲区
		if (cache)
			_carmarkArgs.carBuffer = cache;
		else {
			_carmarkArgs.carBuffer = document.createElement('canvas');
			_carmarkArgs.carBuffer.width = _carmarkArgs.carWidth;
			_carmarkArgs.carBuffer.height = _carmarkArgs.carHeight;
			_carmarkArgs.carBuffer.style.width = _carmarkArgs.carBuffer.width + 'px';
			_carmarkArgs.carBuffer.style.height = _carmarkArgs.carBuffer.height + 'px';
		}

		//缓冲区上下文赋值
        _carmarkArgs.carGp = _carmarkArgs.carBuffer.getContext('2d');

		_carmarkArgs.titleSH = _carmarkArgs.map.length;
        _carmarkArgs.titleSW = _carmarkArgs.map[0].length;
        _carmarkArgs.mapLastx = _carmarkArgs.titleSW * titleW - _carmarkArgs.scrWidth;
        _carmarkArgs.mapLasty = _carmarkArgs.titleSH * titleH - _carmarkArgs.scrHeight;

		this.carWidth = _carmarkArgs.carWidth;
		this.carHeight = _carmarkArgs.carHeight;
		this.tileW = _carmarkArgs.titleSW;
		this.tileH = _carmarkArgs.titleSH;
		this.mapW = this.tileW * _carmarkArgs.map[0].length;
		this.mapH = this.tileH * _carmarkArgs.map.length;
		this.scrWidth = _carmarkArgs.scrWidth;
		this.scrHeight = _carmarkArgs.scrHeight;
		/**
		 * 全绘制缓冲区
		 */
		this.mapRender = function() {
			_carmarkPrivate.initBuffer();
		};
		/**
		 * 卷动
		 * @param {Object} dx
		 * @param {Object} dy
		 */
		this.scroll = function(dx, dy){
			//x方向
			var temp = 0;
			if (dx != 0) {
				temp = dx;
				temp = temp < 0 ? -temp : temp;
				if (temp <= _carmarkArgs.titleW) {
					_carmarkPrivate.scrollDelt(dx, 0);
				} else {
					var times = temp / _carmarkArgs.titleW;
					temp = temp % _carmarkArgs.titleW;
					for (var _si = 0; _si < times; _si++) {
						_carmarkPrivate.scrollDelt(dx < 0 ? -_carmarkArgs.titleW : _carmarkArgs.titleW, 0);
					}
					_carmarkPrivate.scrollDelt(dx < 0 ? -temp : temp, 0);
				}
			}
			//y方向:
			if (dy != 0) {
				temp = dy;
				temp = temp < 0 ? -temp : temp;
				if (temp <= _carmarkArgs.titleH) {
					_carmarkPrivate.scrollDelt(0, dy);
				} else {
					var times = temp / _carmarkArgs.titleH;
					temp = temp % _carmarkArgs.titleH;
					for (var _si = 0; _si < times; _si++) {
						_carmarkPrivate.scrollDelt(0, dy < 0 ? -_carmarkArgs.titleH : _carmarkArgs.titleH);
					}
					_carmarkPrivate.scrollDelt(0, dy < 0 ? -temp : temp);
				}
			}
		};
		/**
		 * 渲染缓冲区
		 * @param {Object} g
		 * @param {Object} x
		 * @param {Object} y
		 */
		this.paint = function(g, x, y) {
			var tempx = _carmarkArgs.mapOffx % _carmarkArgs.carWidth;
	        var tempy = _carmarkArgs.mapOffy % _carmarkArgs.carHeight;
	        var rightWidth = _carmarkArgs.carWidth - tempx;
	        var rightHeight = _carmarkArgs.carHeight - tempy;

	        _carmarkPrivate.drawRange(g, _carmarkArgs.carBuffer, tempx, tempy, rightWidth, rightHeight, x, y);//左上区域
	        _carmarkPrivate.drawRange(g, _carmarkArgs.carBuffer, 0, tempy, _carmarkArgs.scrWidth - rightWidth, rightHeight, x + rightWidth, y);
	        _carmarkPrivate.drawRange(g, _carmarkArgs.carBuffer, tempx, 0, rightWidth, _carmarkArgs.scrHeight - rightHeight, x, y + rightHeight);
        	_carmarkPrivate.drawRange(g, _carmarkArgs.carBuffer, 0, 0, _carmarkArgs.scrWidth - rightWidth, _carmarkArgs.scrHeight - rightHeight, x + rightWidth, y + rightHeight);
		};
		this.setMap = function(map) {
			_carmarkArgs.map = map;
		};
		this.getContext = function() {
			return _carmarkArgs.carGp;
		},
		this.getCanvas = function() {
			return _carmarkArgs.carBuffer;
		}
		this.loopScroll = function() {
			var _lsx = 0, _lsy = 0;
			if (_carmarkArgs.xState < 0) {
				_carmarkArgs.xState = 0;
				//this.scroll(this.mapW - this.carWidth + _carmarkArgs.xState, 0);
				_lsx = this.mapW - this.carWidth;
			} else if (_carmarkArgs.xState > 0) {
				_carmarkArgs.xState = 0;
				//this.scroll(-(this.mapW - this.carWidth - _carmarkArgs.xState), 0);
				_lsx = -(this.mapW - this.carWidth);
			}
			if (_carmarkArgs.yState < 0) {
				_carmarkArgs.yState = 0;
				//this.scroll(0, this.mapH - this.carHeight + _carmarkArgs.yState);
				_lsy = this.mapH - this.carHeight;
			} else if (_carmarkArgs.yState > 0) {
				_carmarkArgs.yState = 0;
				//this.scroll(0, -(this.mapH - this.carHeight - _carmarkArgs.yState));
				_lsy = -(this.mapH - this.carHeight);
			}
			this.scroll(_lsx, _lsy);
		};
	};
})(lib);
