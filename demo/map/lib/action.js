/**
 * @author Suker
 * 动画组件
 */
(function($) {
	/**
	 * 动画相关功能集合
	 */
	$.action = (function() {
		return {
			/**
			 * 角色实体类
			 * @param {Array} sprites
			 * @param {number} x
			 * @param {number} y
			 * @param {number} current
			 */
			role: (function() {
				var _setSprite = function(r, cr) {
					r.current = cr >= r.sprites.length ? r.sprites.length - 1 : cr > 0 ? cr : 0;
					r.sprites[r.current].setFrame(0);//改变动作后将帧指针归零
					return r;
				};
				var _returnSprite = function(sprites, imageNames, rects, frames, actions) {
					if (actions.length > 0) {
						var _sprites = [], frames, _act;
						for (var i = 0; i < actions.length; i++) {
							frames = []; //取帧
							_act = actions[i].frames;
							for (var j = 0; j < _act.length; j++) {
								frames.push({ args: [_act[j][0], _act[j][1], _act[j][2]], step: _act[j][3] });
							}
							_sprites.push(new $.action.sprite(frames, actions[i].loop, 0, 0)); //取精灵
						}
						return _sprites;
					}
					else
						return sprites;
				};
				var _actionRoleGetFrames = function(that) {
					return that.frames[that.getSprite().getFrame().args[0]];
				};
				return function(sprites, x, y, current, imageNames, rects, frames, actions) {
					this.imageNames = imageNames || [];
					this.rects = rects || [];
					this.frames = frames || [];
					this.actions = actions || [];
					this.sprites = _returnSprite(sprites, this.imageNames, this.rects, this.frames, this.actions) || [];
					this.x = x || 0;
					this.y = y || 0;
					this.current = current || 0;
					this.zoom = 1;
					/**
					 * 设置当前角色的动作
					 * @param {number} cr
					 */
					this.setSprite = function(cr) {
						return _setSprite(this, cr);
					};
					/**
					 * 获取当前角色的动作
					 */
					this.getSprite = function() {
						return this.sprites[this.current];
					};
					/**
					 * 取得帧数据
					 */
					this.getFrame = function() {
						return _actionRoleGetFrames(this);
					};
					/**
					 * 移动
					 */
					this.action = function() {
						this.x += this.getSprite().getFrame().args[1];
						this.y += this.getSprite().getFrame().args[2];
					};
					/**
					 * 渲染
					 * @param {bool} act
					 * @param {canvas2d} context
					 */
					this.render = function(act, context) {
						if (!act) {
							this.x += this.getSprite().getFrame().args[1];
							this.y += this.getSprite().getFrame().args[2];
						}
						var _fa = this.frames[this.getSprite().getFrame().args[0]].frameArray, _len = _fa.length, _actRenderContext = context ? context : $.canvas, _actRenderImage;
						for (var i = 0; i < _len; i++) {
							if (context)
								_actRenderImage = $.getImage(this.imageNames[_fa[i][0]]);
							else
								_actRenderImage = this.imageNames[_fa[i][0]];
							_actRenderContext.drawImage(
								_actRenderImage,
								this.rects[_fa[i][0]][_fa[i][1]][0],
								this.rects[_fa[i][0]][_fa[i][1]][1],
								this.rects[_fa[i][0]][_fa[i][1]][2],
								this.rects[_fa[i][0]][_fa[i][1]][3],
								parseInt(this.x + _fa[i][2] * this.zoom),
								parseInt(this.y + _fa[i][3] * this.zoom),
								parseInt(this.rects[_fa[i][0]][_fa[i][1]][2] * this.zoom),
								parseInt(this.rects[_fa[i][0]][_fa[i][1]][3] * this.zoom)
							);
						}
						_actRenderImage = null;
						_actRenderContext = null;
						_len = null;
						_fa = null;
					};
					/**
					 * 设置缩放比例
					 * @param {number} zoom
					 */
					this.setZoom = function(zoom) {
						if (zoom > 0) {
							this.zoom = zoom;
						}
					};
					/**
					 * 取得角色身体矩形数据
					 */
					this.getBodyRect = function() {
						var br = this.getFrame().bodyRect;
						if (this.zoom == 1) {
							return br;
						} else {
							return [br[0] * this.zoom, br[1] * this.zoom, br[2] * this.zoom, br[3] * this.zoom];
						}
					};
					/**
					 * 取得角色攻击矩形数据
					 */
					this.getAttackRect = function() {
						var ar = this.getFrame().actRect;
						if (this.zoom == 1) {
							return ar;
						} else {
							return [ar[0] * this.zoom, ar[1] * this.zoom, ar[2] * this.zoom, ar[3] * this.zoom];
						}
					};
				}
			})(),
			/**
			 * 精灵实体类
			 * @param {Array} frames
			 * @param {bool} loop
			 * @param {number} current
			 * @param {number} step
			 */
			sprite: (function() {
				var _setFrame = function(s, cf) {
					s.current = cf >= s.frames.length ? s.frames.length - 1 : cf > 0 ? cf : 0;
					if (s.getFrame().step)
						s.runStep = s.getFrame().step;
					return s;
				};
				var _nextFrame = function(s) {
                    if (!s.loop && s.endFrame())
                        return s;
					if (s.frames.length > 0) {
						if (s.runStep <= 0) {
							if (s.loop) {
								s.current++;
								s.current %= s.frames.length;
							}
							else {
								if (s.current < s.frames.length - 1)
									s.current++;
							}
							//如果单帧播放延迟值不为空那以帧的播放延迟为基准，否则以精灵的播放延迟为基准
							if (s.getFrame().step)
								s.runStep = s.getFrame().step;
							else
								s.runStep = s.step;
						}
						else {
							s.runStep--;
						}
					}
					return s;
				};
				var _preFrame = function(s) {
                    if (!s.loop && s.endFrame())
                        return s;
					if (s.frames.length > 0) {
						if (s.runStep <= 0) {
							//s.runStep = s.step;
							if (s.loop) {
								s.current--;
								if (s.current < 0)
									s.current = s.frames.length - 1;
							}
							else {
								if (s.current > 0)
									s.current--;
							}

							//如果单帧播放延迟值不为空那以帧的播放延迟为基准，否则以精灵的播放延迟为基准
							if (s.getFrame().step)
								s.runStep = s.getFrame().step;
							else
								s.runStep = s.step;
						}
						else {
							s.runStep--;
						}
					}
					return s;
				};
				return function(frames, loop, current, step) {
					this.frames = frames || [];
					this.loop = loop;
					this.current = current || 0;
					this.step = step || 0;
					/**
					 * 设置帧指针
					 * @param {number} cf
					 */
					this.setFrame = function(cf) {
						return _setFrame(this, cf);
					};
					/**
					 * 获取帧指针
					 */
					this.getFrame = function() {
						return this.frames[this.current];
					};
					/**
					 * 下一帧
					 */
					this.nextFrame = function() {
						return _nextFrame(this);
					};
					/**
					 * 上一帧
					 */
					this.preFrame = function() {
						return _preFrame(this);
					};
					/**
					 * 判断是否到达动画帧集合尾部
					 */
					this.endFrame = function() {
						return this.current == this.frames.length - 1 &&
						this.runStep == 0;
					};
					this.setFrame(current);
					this.runStep = this.getFrame().step ? this.getFrame().step : this.step;
				};
			})(),
			/**
			 * 动作片段实体类
			 * @param {Array} sprites
			 */
			fragment: (function() {
				var _getff;
				var _fragmentNext = function(f) {
					if (f.sprites.length > 0) {
						if (f.sprites[0].frames.length > 0) {
							if (f.sprites[0].runStep <= 0) {
								f.sprites[0].runStep = f.sprites[0].step;
								_getff = f.sprites[0].frames.shift();
								if (f.sprites[0].frames.length == 0)
									f.sprites.shift();
							}
							else {
								_getff = f.sprites[0].getFrame();
								f.sprites[0].runStep--;
							}
						}
					}
					else
						_getff = null;
					return _getff;
				};
				var _fragmentQueue = function(f) {
					return _fragmentNext(f);
				};
				return function(sprites) {
					this.sprites = sprites || [];
					/**
					 * 动作片段帧出队列，直到值为null
					 */
					this.queue = function() {
						return _fragmentQueue(this);
					};
				}
			})()
		};
	})();
})(lib);
