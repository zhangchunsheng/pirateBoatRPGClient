// Generated by CoffeeScript 1.3.3
(function () {
	var DataTable, WrapData, async, gameLog, readFile, xml2js, _;

	async = require('async');

	xml2js = require('xml2js');

	_ = require('underscore');

	gameLog = console;

	readFile = require("fs").readFile;

	WrapData = (function () {

		function WrapData(data_, dataTable_) {
			this.data_ = data_;
			this.dataTable_ = dataTable_;
		}

		WrapData.prototype.ref = function (key) {
			return this.dataTable_.ref(this.data_, key);
		};

		WrapData.prototype.refWrap = function (key) {
			return this.dataTable_.refWrap(this.data_, key);
		};

		WrapData.data_;

		WrapData.dataTable_;

		return WrapData;

	})();

	DataTable = (function () {

		function DataTable(dataMgr_) {
			this.dataMgr_ = dataMgr_;
			this.config_ = null;
		}

		DataTable.prototype.loadFromFile = function (file, config, callback) {
			var _this = this;
			this.setConfig(config);
			return this.parserXml(file, function (err, result) {
				var row, temp;
				if (err != null) {
					return callback(err, null);
				} else {
					row = result.root.row;
					if (!(_.isArray(row))) {
						temp = row;
						row = [temp];
					}
					_this.dataToNumber(row);
					_this.data_ = _this.rowIdTransform(row);
					if ((_this.config_ != null) && (_this.config_.arrayList != null)) {
						_this.objectToArray(_this.data_, _this.config_.arrayList);
					}
					return callback(null, _this.data_);
				}
			});
		};

		DataTable.prototype.dataToNumber = function (rowTable) {
			var k, k1, numberReg, row, v, v1, _i, _len, _results;
			numberReg = /^-?\d+(\.\d+)?$/;
			_results = [];
			for (_i = 0, _len = rowTable.length; _i < _len; _i++) {
				row = rowTable[_i];
				_results.push((function () {
					var _results1;
					_results1 = [];
					for (k in row) {
						v = row[k];
						if (_.isObject(v)) {
							_results1.push((function () {
								var _results2;
								_results2 = [];
								for (k1 in v) {
									v1 = v[k1];
									if (numberReg.test(v1)) {
										_results2.push(v[k1] = parseFloat(v1));
									} else {
										_results2.push(void 0);
									}
								}
								return _results2;
							})());
						} else if (numberReg.test(v)) {
							_results1.push(row[k] = parseFloat(v));
						} else {
							_results1.push(void 0);
						}
					}
					return _results1;
				})());
			}
			return _results;
		};

		DataTable.prototype.rowIdTransform = function (arr) {
			var resultArr, value, _i, _len;
			resultArr = [];
			for (_i = 0, _len = arr.length; _i < _len; _i++) {
				value = arr[_i];
				resultArr[value.resId] = value;
			}
			return resultArr;
		};

		DataTable.prototype.setConfig = function (config_) {
			this.config_ = config_ != null ? config_ : null;
			if ((this.config_ != null) && (this.config_.refList != null)) {
				this.refList_ = this.config_.refList;
				return delete this.config_.refList;
			}
		};

		DataTable.prototype.parserXml = function (fileName, fn) {
			var xmlParser,
			_this = this;
			xmlParser = new xml2js.Parser({
				ignoreAttrs: true,
				explicitArray: false
			});
			async.waterfall([

			function (callback) {
				readFile(fileName, function (err, data) {
					return callback(err, data);
				});
			}, function (data, callback) {
				xmlParser.parseString(data, function (err, result) {
					callback(err, result);
					fn(err, result);
				});
			}], function (err, result) {
				if (err != null) {
					gameLog.error(err);
				}
			});
		};

		DataTable.prototype.find = function (id) {
			if (this.data_[id] != null) {
				return this.data_[id];
			}
			return null;
		};

		DataTable.prototype.findWrap = function (id) {
			var data;
			data = this.find(id);
			if (data != null) {
				return new WrapData(data, this);
			}
			return null;
		};

		DataTable.prototype.ref = function (data, key) {
			var i, resultArray, tableName, v, value, _i, _len;
			value = data[key];
			tableName = this.getRefTableName(key);
			if (tableName != null) {
				if (_.isString(value)) {
					return this.dataMgr_.find(tableName, value);
				} else if (_.isArray(value)) {
					resultArray = [];
					for (i = _i = 0, _len = value.length; _i < _len; i = ++_i) {
						v = value[i];
						resultArray[i] = this.dataMgr_.find(tableName, v);
					}
					return resultArray;
				}
			}
			return null;
		};

		DataTable.prototype.refWrap = function (data, key) {
			var i, resultArray, tableName, v, value, _i, _len;
			value = data[key];
			tableName = this.getRefTableName(key);
			if (tableName != null) {
				if (_.isString(value)) {
					return this.dataMgr_.findWrap(tableName, value);
				} else if (_.isArray(value)) {
					resultArray = [];
					for (i = _i = 0, _len = value.length; _i < _len; i = ++_i) {
						v = value[i];
						resultArray[i] = this.dataMgr_.findWrap(tableName, v);
					}
					return resultArray;
				}
			}
			return null;
		};

		DataTable.prototype.getRefTableName = function (key) {
			var k, v, _ref;
			_ref = this.refList_;
			for (k in _ref) {
				v = _ref[k];
				if (key === k) {
					return v;
				}
			}
			return null;
		};

		DataTable.prototype.objectToArray = function (data, arrayList) {
			var arr, force, key, max, singleData, singleDataSet, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
			singleDataSet = function (key, max, force, singleData) {
				var index, indexValue, keyArray, _i;
				keyArray = [];
				for (index = _i = 0; 0 <= max ? _i <= max : _i >= max; index = 0 <= max ? ++_i : --_i) {
					indexValue = singleData[key + index];
					if (indexValue != null) {
						if (!((_.isObject(indexValue)) && _.isEmpty(indexValue))) {
							keyArray.push(indexValue);
						}
						delete singleData[key + index];
					} else if (!force) {
						break;
					} else if (force) {
						keyArray.push(void 0);
					}
				}
				return singleData[key] = keyArray;
			};
			if (_.isArray(arrayList)) {
				for (_i = 0, _len = arrayList.length; _i < _len; _i++) {
					arr = arrayList[_i];
					key = arr.key;
					max = arr.max;
					force = (_ref = arr.force) != null ? _ref : false;
					if ((_.isString(key)) && _.isNumber(max)) {
						for (_j = 0, _len1 = data.length; _j < _len1; _j++) {
							singleData = data[_j];
							if (singleData != null) {
								singleDataSet(key, max, force, singleData);
							}
						}
					}
				}
			} else if (_.isObject(arrayList)) {
				key = arrayList.key;
				max = arrayList.max;
				force = (_ref1 = arrayList.force) != null ? _ref1 : false;
				if ((_.isString(key)) && (_.isNumber(max))) {
					for (_k = 0, _len2 = data.length; _k < _len2; _k++) {
						singleData = data[_k];
						if (singleData != null) {
							singleDataSet(key, max, force, singleData);
						}
					}
				}
			}
		};

		DataTable.prototype.additionXml = function (callback) {
			var arrayList, filename, singleData, xml, xmlKey, xmlList, _i, _j, _len, _len1, _ref,
			_this = this;
			if (this.config_ != null) {
				xmlList = this.config_.xmlList;
				if (_.isArray(xmlList)) {
					_ref = this.data_;
					for (_i = 0, _len = _ref.length; _i < _len; _i++) {
						singleData = _ref[_i];
						for (_j = 0, _len1 = xmlList.length; _j < _len1; _j++) {
							xml = xmlList[_j];
							xmlKey = xml.xmlKey;
							arrayList = xml.arrayList;
							if (!xmlKey) {
								continue;
							}
							filename = singleData[xmlKey];
							if (filename != null) {
								(function (singleData, xml, arrayList) {
									return _this.parserXml(filename, function (err, result) {
										var xmlData;
										if (err != null) {
											callback(err, null);
										} else {
											xmlData = this.rowIdTransform(result.row);
											if (arrayList != null) {
												this.objectToArray(xmlData, arrayList);
											}
											singleData[xml] = xmlData;
											callback(null, null);
											return;
										}
									});
								})(singleData, xml, arrayList);
							}
						}
					}
				} else {
					callback(null, null);
				}
			} else {
				callback(null, null);
			}
		};

		DataTable.config_;

		DataTable.data_;

		DataTable.refList_;

		DataTable.dataMgr_;

		return DataTable;

	})();

	module.exports = DataTable;

}).call(this);