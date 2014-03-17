var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved);
    var cached = require.cache[resolved];
    var res = cached ? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js", ".coffee", ".json"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if(!cwd)
			cwd = '/';

        if (require._core[x])
			return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';

        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x)) || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }

        var n = loadNodeModulesSync(x, y);
        if (n) return n;

        throw new Error("Cannot find module '" + x + "'");

        function loadAsFileSync(x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }

            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }

        function loadAsDirectorySync(x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m)
						return m;
                } else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m)
						return m;
                } else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m)
						return m;
                }
            }

            return loadAsFileSync(x + '/index');
        }

        function loadNodeModulesSync(x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m)
					return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n)
					return n;
            }

            var m = loadAsFileSync(x);
            if (m)
				return m;
        }

        function nodeModulesPathsSync(start) {
            var parts;
            if (start === '/') parts = [''];
            else parts = path.normalize(start).split('/');

            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    } catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);

    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        } else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;

    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }

        var dirname = require._core[filename] ? '' : require.modules.path().dirname(filename);

        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id: filename,
            filename: filename,
            exports: {},
            loaded: false,
            parent: null
        };

        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
            module_.exports,
            require_,
            module_,
            module_.exports,
            dirname,
            filename,
            process,
            global);
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path", function (require, module, exports, __dirname, __filename, process, global) {
    function filter(xs, fn) {
        var res = [];
        for (var i = 0; i < xs.length; i++) {
            if (fn(xs[i], i, xs)) res.push(xs[i]);
        }
        return res;
    }

    // resolves . and .. elements in a path array with directory names there
    // must be no slashes, empty elements, or device names (c:\) in the array
    // (so also no leading and trailing slashes - it does not distinguish
    // relative and absolute paths)
    function normalizeArray(parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length; i >= 0; i--) {
            var last = parts[i];
            if (last == '.') {
                parts.splice(i, 1);
            } else if (last === '..') {
                parts.splice(i, 1);
                up++;
            } else if (up) {
                parts.splice(i, 1);
                up--;
            }
        }

        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
            for (; up--; up) {
                parts.unshift('..');
            }
        }

        return parts;
    }

    // Regex to split a filename into [*, dir, basename, ext]
    // posix version
    var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

    // path.resolve([from ...], to)
    // posix version
    exports.resolve = function () {
        var resolvedPath = '',
            resolvedAbsolute = false;

        for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
            var path = (i >= 0) ? arguments[i] : process.cwd();

            // Skip empty and invalid entries
            if (typeof path !== 'string' || !path) {
                continue;
            }

            resolvedPath = path + '/' + resolvedPath;
            resolvedAbsolute = path.charAt(0) === '/';
        }

        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)

        // Normalize the path
        resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function (p) {
            return !!p;
        }), !resolvedAbsolute).join('/');

        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
    };

    // path.normalize(path)
    // posix version
    exports.normalize = function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.slice(-1) === '/';

        // Normalize the path
        path = normalizeArray(filter(path.split('/'), function (p) {
            return !!p;
        }), !isAbsolute).join('/');

        if (!path && !isAbsolute) {
            path = '.';
        }
        if (path && trailingSlash) {
            path += '/';
        }

        return (isAbsolute ? '/' : '') + path;
    };


    // posix version
    exports.join = function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return exports.normalize(filter(paths, function (p, index) {
            return p && typeof p === 'string';
        }).join('/'));
    };


    exports.dirname = function (path) {
        var dir = splitPathRe.exec(path)[1] || '';
        var isWindows = false;
        if (!dir) {
            // No dirname
            return '.';
        } else if (dir.length === 1 || (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
            // It is just a slash or a drive letter with a slash
            return dir;
        } else {
            // It is a full dirname, strip trailing slash
            return dir.substring(0, dir.length - 1);
        }
    };

    exports.basename = function (path, ext) {
        var f = splitPathRe.exec(path)[2] || '';
        // TODO: make this comparison case-insensitive on windows?
        if (ext && f.substr(-1 * ext.length) === ext) {
            f = f.substr(0, f.length - ext.length);
        }
        return f;
    };

    exports.extname = function (path) {
        return splitPathRe.exec(path)[3] || '';
    };
});

require.define("__browserify_process", function (require, module, exports, __dirname, __filename, process, global) {
    var process = module.exports = {};

    process.nextTick = (function () {
        var canSetImmediate = typeof window !== 'undefined' && window.setImmediate;
        var canPost = typeof window !== 'undefined' && window.postMessage && window.addEventListener;

        if (canSetImmediate) {
            return window.setImmediate;
        }

        if (canPost) {
            var queue = [];
            window.addEventListener('message', function (ev) {
                if (ev.source === window && ev.data === 'browserify-tick') {
                    ev.stopPropagation();
                    if (queue.length > 0) {
                        var fn = queue.shift();
                        fn();
                    }
                }
            }, true);

            return function nextTick(fn) {
                queue.push(fn);
                window.postMessage('browserify-tick', '*');
            };
        }

        return function nextTick(fn) {
            setTimeout(fn, 0);
        };
    })();

    process.title = 'browser';
    process.browser = true;
    process.env = {};
    process.argv = [];

    process.binding = function (name) {
        if (name === 'evals') return (require)('vm')
        else throw new Error('No such module. (Possibly not yet loaded)')
    };

    (function () {
        var cwd = '/';
        var path;
        process.cwd = function () {
            return cwd
        };
        process.chdir = function (dir) {
            if (!path) path = require('path');
            cwd = path.resolve(dir, cwd);
        };
    })();

});

require.define("/node_modules/underscore/package.json", function (require, module, exports, __dirname, __filename, process, global) {
    module.exports = {
        "main": "underscore.js"
    }
});

require.define("/node_modules/underscore/underscore.js", function (require, module, exports, __dirname, __filename, process, global) { //     Underscore.js 1.4.2
    //     http://underscorejs.org
    //     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
    //     Underscore may be freely distributed under the MIT license.

    (function () {
        // Baseline setup
        // --------------

        // Establish the root object, `window` in the browser, or `global` on the server.
        var root = this;

        // Save the previous value of the `_` variable.
        var previousUnderscore = root._;

        // Establish the object that gets returned to break out of a loop iteration.
        var breaker = {};

        // Save bytes in the minified (but not gzipped) version:
        var ArrayProto = Array.prototype,
            ObjProto = Object.prototype,
            FuncProto = Function.prototype;

        // Create quick reference variables for speed access to core prototypes.
        var push = ArrayProto.push,
            slice = ArrayProto.slice,
            concat = ArrayProto.concat,
            unshift = ArrayProto.unshift,
            toString = ObjProto.toString,
            hasOwnProperty = ObjProto.hasOwnProperty;

        // All **ECMAScript 5** native function implementations that we hope to use
        // are declared here.
        var
        nativeForEach = ArrayProto.forEach,
            nativeMap = ArrayProto.map,
            nativeReduce = ArrayProto.reduce,
            nativeReduceRight = ArrayProto.reduceRight,
            nativeFilter = ArrayProto.filter,
            nativeEvery = ArrayProto.every,
            nativeSome = ArrayProto.some,
            nativeIndexOf = ArrayProto.indexOf,
            nativeLastIndexOf = ArrayProto.lastIndexOf,
            nativeIsArray = Array.isArray,
            nativeKeys = Object.keys,
            nativeBind = FuncProto.bind;

        // Create a safe reference to the Underscore object for use below.
        var _ = function (obj) {
            if (obj instanceof _) return obj;
            if (!(this instanceof _)) return new _(obj);
            this._wrapped = obj;
        };

        // Export the Underscore object for **Node.js**, with
        // backwards-compatibility for the old `require()` API. If we're in
        // the browser, add `_` as a global object via a string identifier,
        // for Closure Compiler "advanced" mode.
        if (typeof exports !== 'undefined') {
            if (typeof module !== 'undefined' && module.exports) {
                exports = module.exports = _;
            }
            exports._ = _;
        } else {
            root['_'] = _;
        }

        // Current version.
        _.VERSION = '1.4.2';

        // Collection Functions
        // --------------------

        // The cornerstone, an `each` implementation, aka `forEach`.
        // Handles objects with the built-in `forEach`, arrays, and raw objects.
        // Delegates to **ECMAScript 5**'s native `forEach` if available.
        var each = _.each = _.forEach = function (obj, iterator, context) {
            if (obj == null) return;
            if (nativeForEach && obj.forEach === nativeForEach) {
                obj.forEach(iterator, context);
            } else if (obj.length === +obj.length) {
                for (var i = 0, l = obj.length; i < l; i++) {
                    if (iterator.call(context, obj[i], i, obj) === breaker) return;
                }
            } else {
                for (var key in obj) {
                    if (_.has(obj, key)) {
                        if (iterator.call(context, obj[key], key, obj) === breaker) return;
                    }
                }
            }
        };

        // Return the results of applying the iterator to each element.
        // Delegates to **ECMAScript 5**'s native `map` if available.
        _.map = _.collect = function (obj, iterator, context) {
            var results = [];
            if (obj == null) return results;
            if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
            each(obj, function (value, index, list) {
                results[results.length] = iterator.call(context, value, index, list);
            });
            return results;
        };

        // **Reduce** builds up a single result from a list of values, aka `inject`,
        // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
        _.reduce = _.foldl = _.inject = function (obj, iterator, memo, context) {
            var initial = arguments.length > 2;
            if (obj == null) obj = [];
            if (nativeReduce && obj.reduce === nativeReduce) {
                if (context) iterator = _.bind(iterator, context);
                return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
            }
            each(obj, function (value, index, list) {
                if (!initial) {
                    memo = value;
                    initial = true;
                } else {
                    memo = iterator.call(context, memo, value, index, list);
                }
            });
            if (!initial) throw new TypeError('Reduce of empty array with no initial value');
            return memo;
        };

        // The right-associative version of reduce, also known as `foldr`.
        // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
        _.reduceRight = _.foldr = function (obj, iterator, memo, context) {
            var initial = arguments.length > 2;
            if (obj == null) obj = [];
            if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
                if (context) iterator = _.bind(iterator, context);
                return arguments.length > 2 ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
            }
            var length = obj.length;
            if (length !== +length) {
                var keys = _.keys(obj);
                length = keys.length;
            }
            each(obj, function (value, index, list) {
                index = keys ? keys[--length] : --length;
                if (!initial) {
                    memo = obj[index];
                    initial = true;
                } else {
                    memo = iterator.call(context, memo, obj[index], index, list);
                }
            });
            if (!initial) throw new TypeError('Reduce of empty array with no initial value');
            return memo;
        };

        // Return the first value which passes a truth test. Aliased as `detect`.
        _.find = _.detect = function (obj, iterator, context) {
            var result;
            any(obj, function (value, index, list) {
                if (iterator.call(context, value, index, list)) {
                    result = value;
                    return true;
                }
            });
            return result;
        };

        // Return all the elements that pass a truth test.
        // Delegates to **ECMAScript 5**'s native `filter` if available.
        // Aliased as `select`.
        _.filter = _.select = function (obj, iterator, context) {
            var results = [];
            if (obj == null) return results;
            if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
            each(obj, function (value, index, list) {
                if (iterator.call(context, value, index, list)) results[results.length] = value;
            });
            return results;
        };

        // Return all the elements for which a truth test fails.
        _.reject = function (obj, iterator, context) {
            var results = [];
            if (obj == null) return results;
            each(obj, function (value, index, list) {
                if (!iterator.call(context, value, index, list)) results[results.length] = value;
            });
            return results;
        };

        // Determine whether all of the elements match a truth test.
        // Delegates to **ECMAScript 5**'s native `every` if available.
        // Aliased as `all`.
        _.every = _.all = function (obj, iterator, context) {
            iterator || (iterator = _.identity);
            var result = true;
            if (obj == null) return result;
            if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
            each(obj, function (value, index, list) {
                if (!(result = result && iterator.call(context, value, index, list))) return breaker;
            });
            return !!result;
        };

        // Determine if at least one element in the object matches a truth test.
        // Delegates to **ECMAScript 5**'s native `some` if available.
        // Aliased as `any`.
        var any = _.some = _.any = function (obj, iterator, context) {
            iterator || (iterator = _.identity);
            var result = false;
            if (obj == null) return result;
            if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
            each(obj, function (value, index, list) {
                if (result || (result = iterator.call(context, value, index, list))) return breaker;
            });
            return !!result;
        };

        // Determine if the array or object contains a given value (using `===`).
        // Aliased as `include`.
        _.contains = _.include = function (obj, target) {
            var found = false;
            if (obj == null) return found;
            if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
            found = any(obj, function (value) {
                return value === target;
            });
            return found;
        };

        // Invoke a method (with arguments) on every item in a collection.
        _.invoke = function (obj, method) {
            var args = slice.call(arguments, 2);
            return _.map(obj, function (value) {
                return (_.isFunction(method) ? method : value[method]).apply(value, args);
            });
        };

        // Convenience version of a common use case of `map`: fetching a property.
        _.pluck = function (obj, key) {
            return _.map(obj, function (value) {
                return value[key];
            });
        };

        // Convenience version of a common use case of `filter`: selecting only objects
        // with specific `key:value` pairs.
        _.where = function (obj, attrs) {
            if (_.isEmpty(attrs)) return [];
            return _.filter(obj, function (value) {
                for (var key in attrs) {
                    if (attrs[key] !== value[key]) return false;
                }
                return true;
            });
        };

        // Return the maximum element or (element-based computation).
        // Can't optimize arrays of integers longer than 65,535 elements.
        // See: https://bugs.webkit.org/show_bug.cgi?id=80797
        _.max = function (obj, iterator, context) {
            if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
                return Math.max.apply(Math, obj);
            }
            if (!iterator && _.isEmpty(obj)) return -Infinity;
            var result = {
                computed: -Infinity
            };
            each(obj, function (value, index, list) {
                var computed = iterator ? iterator.call(context, value, index, list) : value;
                computed >= result.computed && (result = {
                    value: value,
                    computed: computed
                });
            });
            return result.value;
        };

        // Return the minimum element (or element-based computation).
        _.min = function (obj, iterator, context) {
            if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
                return Math.min.apply(Math, obj);
            }
            if (!iterator && _.isEmpty(obj)) return Infinity;
            var result = {
                computed: Infinity
            };
            each(obj, function (value, index, list) {
                var computed = iterator ? iterator.call(context, value, index, list) : value;
                computed < result.computed && (result = {
                    value: value,
                    computed: computed
                });
            });
            return result.value;
        };

        // Shuffle an array.
        _.shuffle = function (obj) {
            var rand;
            var index = 0;
            var shuffled = [];
            each(obj, function (value) {
                rand = _.random(index++);
                shuffled[index - 1] = shuffled[rand];
                shuffled[rand] = value;
            });
            return shuffled;
        };

        // An internal function to generate lookup iterators.
        var lookupIterator = function (value) {
            return _.isFunction(value) ? value : function (obj) {
                return obj[value];
            };
        };

        // Sort the object's values by a criterion produced by an iterator.
        _.sortBy = function (obj, value, context) {
            var iterator = lookupIterator(value);
            return _.pluck(_.map(obj, function (value, index, list) {
                return {
                    value: value,
                    index: index,
                    criteria: iterator.call(context, value, index, list)
                };
            }).sort(function (left, right) {
                var a = left.criteria;
                var b = right.criteria;
                if (a !== b) {
                    if (a > b || a === void 0) return 1;
                    if (a < b || b === void 0) return -1;
                }
                return left.index < right.index ? -1 : 1;
            }), 'value');
        };

        // An internal function used for aggregate "group by" operations.
        var group = function (obj, value, context, behavior) {
            var result = {};
            var iterator = lookupIterator(value);
            each(obj, function (value, index) {
                var key = iterator.call(context, value, index, obj);
                behavior(result, key, value);
            });
            return result;
        };

        // Groups the object's values by a criterion. Pass either a string attribute
        // to group by, or a function that returns the criterion.
        _.groupBy = function (obj, value, context) {
            return group(obj, value, context, function (result, key, value) {
                (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
            });
        };

        // Counts instances of an object that group by a certain criterion. Pass
        // either a string attribute to count by, or a function that returns the
        // criterion.
        _.countBy = function (obj, value, context) {
            return group(obj, value, context, function (result, key, value) {
                if (!_.has(result, key)) result[key] = 0;
                result[key]++;
            });
        };

        // Use a comparator function to figure out the smallest index at which
        // an object should be inserted so as to maintain order. Uses binary search.
        _.sortedIndex = function (array, obj, iterator, context) {
            iterator = iterator == null ? _.identity : lookupIterator(iterator);
            var value = iterator.call(context, obj);
            var low = 0,
                high = array.length;
            while (low < high) {
                var mid = (low + high) >>> 1;
                iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
            }
            return low;
        };

        // Safely convert anything iterable into a real, live array.
        _.toArray = function (obj) {
            if (!obj) return [];
            if (obj.length === +obj.length) return slice.call(obj);
            return _.values(obj);
        };

        // Return the number of elements in an object.
        _.size = function (obj) {
            return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
        };

        // Array Functions
        // ---------------

        // Get the first element of an array. Passing **n** will return the first N
        // values in the array. Aliased as `head` and `take`. The **guard** check
        // allows it to work with `_.map`.
        _.first = _.head = _.take = function (array, n, guard) {
            return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
        };

        // Returns everything but the last entry of the array. Especially useful on
        // the arguments object. Passing **n** will return all the values in
        // the array, excluding the last N. The **guard** check allows it to work with
        // `_.map`.
        _.initial = function (array, n, guard) {
            return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
        };

        // Get the last element of an array. Passing **n** will return the last N
        // values in the array. The **guard** check allows it to work with `_.map`.
        _.last = function (array, n, guard) {
            if ((n != null) && !guard) {
                return slice.call(array, Math.max(array.length - n, 0));
            } else {
                return array[array.length - 1];
            }
        };

        // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
        // Especially useful on the arguments object. Passing an **n** will return
        // the rest N values in the array. The **guard**
        // check allows it to work with `_.map`.
        _.rest = _.tail = _.drop = function (array, n, guard) {
            return slice.call(array, (n == null) || guard ? 1 : n);
        };

        // Trim out all falsy values from an array.
        _.compact = function (array) {
            return _.filter(array, function (value) {
                return !!value;
            });
        };

        // Internal implementation of a recursive `flatten` function.
        var flatten = function (input, shallow, output) {
            each(input, function (value) {
                if (_.isArray(value)) {
                    shallow ? push.apply(output, value) : flatten(value, shallow, output);
                } else {
                    output.push(value);
                }
            });
            return output;
        };

        // Return a completely flattened version of an array.
        _.flatten = function (array, shallow) {
            return flatten(array, shallow, []);
        };

        // Return a version of the array that does not contain the specified value(s).
        _.without = function (array) {
            return _.difference(array, slice.call(arguments, 1));
        };

        // Produce a duplicate-free version of the array. If the array has already
        // been sorted, you have the option of using a faster algorithm.
        // Aliased as `unique`.
        _.uniq = _.unique = function (array, isSorted, iterator, context) {
            var initial = iterator ? _.map(array, iterator, context) : array;
            var results = [];
            var seen = [];
            each(initial, function (value, index) {
                if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
                    seen.push(value);
                    results.push(array[index]);
                }
            });
            return results;
        };

        // Produce an array that contains the union: each distinct element from all of
        // the passed-in arrays.
        _.union = function () {
            return _.uniq(concat.apply(ArrayProto, arguments));
        };

        // Produce an array that contains every item shared between all the
        // passed-in arrays.
        _.intersection = function (array) {
            var rest = slice.call(arguments, 1);
            return _.filter(_.uniq(array), function (item) {
                return _.every(rest, function (other) {
                    return _.indexOf(other, item) >= 0;
                });
            });
        };

        // Take the difference between one array and a number of other arrays.
        // Only the elements present in just the first array will remain.
        _.difference = function (array) {
            var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
            return _.filter(array, function (value) {
                return !_.contains(rest, value);
            });
        };

        // Zip together multiple lists into a single array -- elements that share
        // an index go together.
        _.zip = function () {
            var args = slice.call(arguments);
            var length = _.max(_.pluck(args, 'length'));
            var results = new Array(length);
            for (var i = 0; i < length; i++) {
                results[i] = _.pluck(args, "" + i);
            }
            return results;
        };

        // Converts lists into objects. Pass either a single array of `[key, value]`
        // pairs, or two parallel arrays of the same length -- one of keys, and one of
        // the corresponding values.
        _.object = function (list, values) {
            var result = {};
            for (var i = 0, l = list.length; i < l; i++) {
                if (values) {
                    result[list[i]] = values[i];
                } else {
                    result[list[i][0]] = list[i][1];
                }
            }
            return result;
        };

        // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
        // we need this function. Return the position of the first occurrence of an
        // item in an array, or -1 if the item is not included in the array.
        // Delegates to **ECMAScript 5**'s native `indexOf` if available.
        // If the array is large and already in sort order, pass `true`
        // for **isSorted** to use binary search.
        _.indexOf = function (array, item, isSorted) {
            if (array == null) return -1;
            var i = 0,
                l = array.length;
            if (isSorted) {
                if (typeof isSorted == 'number') {
                    i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
                } else {
                    i = _.sortedIndex(array, item);
                    return array[i] === item ? i : -1;
                }
            }
            if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
            for (; i < l; i++) if (array[i] === item) return i;
            return -1;
        };

        // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
        _.lastIndexOf = function (array, item, from) {
            if (array == null) return -1;
            var hasIndex = from != null;
            if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
                return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
            }
            var i = (hasIndex ? from : array.length);
            while (i--) if (array[i] === item) return i;
            return -1;
        };

        // Generate an integer Array containing an arithmetic progression. A port of
        // the native Python `range()` function. See
        // [the Python documentation](http://docs.python.org/library/functions.html#range).
        _.range = function (start, stop, step) {
            if (arguments.length <= 1) {
                stop = start || 0;
                start = 0;
            }
            step = arguments[2] || 1;

            var len = Math.max(Math.ceil((stop - start) / step), 0);
            var idx = 0;
            var range = new Array(len);

            while (idx < len) {
                range[idx++] = start;
                start += step;
            }

            return range;
        };

        // Function (ahem) Functions
        // ------------------

        // Reusable constructor function for prototype setting.
        var ctor = function () {};

        // Create a function bound to a given object (assigning `this`, and arguments,
        // optionally). Binding with arguments is also known as `curry`.
        // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
        // We check for `func.bind` first, to fail fast when `func` is undefined.
        _.bind = function bind(func, context) {
            var bound, args;
            if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
            if (!_.isFunction(func)) throw new TypeError;
            args = slice.call(arguments, 2);
            return bound = function () {
                if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
                ctor.prototype = func.prototype;
                var self = new ctor;
                var result = func.apply(self, args.concat(slice.call(arguments)));
                if (Object(result) === result) return result;
                return self;
            };
        };

        // Bind all of an object's methods to that object. Useful for ensuring that
        // all callbacks defined on an object belong to it.
        _.bindAll = function (obj) {
            var funcs = slice.call(arguments, 1);
            if (funcs.length == 0) funcs = _.functions(obj);
            each(funcs, function (f) {
                obj[f] = _.bind(obj[f], obj);
            });
            return obj;
        };

        // Memoize an expensive function by storing its results.
        _.memoize = function (func, hasher) {
            var memo = {};
            hasher || (hasher = _.identity);
            return function () {
                var key = hasher.apply(this, arguments);
                return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
            };
        };

        // Delays a function for the given number of milliseconds, and then calls
        // it with the arguments supplied.
        _.delay = function (func, wait) {
            var args = slice.call(arguments, 2);
            return setTimeout(function () {
                return func.apply(null, args);
            }, wait);
        };

        // Defers a function, scheduling it to run after the current call stack has
        // cleared.
        _.defer = function (func) {
            return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
        };

        // Returns a function, that, when invoked, will only be triggered at most once
        // during a given window of time.
        _.throttle = function (func, wait) {
            var context, args, timeout, throttling, more, result;
            var whenDone = _.debounce(function () {
                more = throttling = false;
            }, wait);
            return function () {
                context = this;
                args = arguments;
                var later = function () {
                    timeout = null;
                    if (more) {
                        result = func.apply(context, args);
                    }
                    whenDone();
                };
                if (!timeout) timeout = setTimeout(later, wait);
                if (throttling) {
                    more = true;
                } else {
                    throttling = true;
                    result = func.apply(context, args);
                }
                whenDone();
                return result;
            };
        };

        // Returns a function, that, as long as it continues to be invoked, will not
        // be triggered. The function will be called after it stops being called for
        // N milliseconds. If `immediate` is passed, trigger the function on the
        // leading edge, instead of the trailing.
        _.debounce = function (func, wait, immediate) {
            var timeout, result;
            return function () {
                var context = this,
                    args = arguments;
                var later = function () {
                    timeout = null;
                    if (!immediate) result = func.apply(context, args);
                };
                var callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) result = func.apply(context, args);
                return result;
            };
        };

        // Returns a function that will be executed at most one time, no matter how
        // often you call it. Useful for lazy initialization.
        _.once = function (func) {
            var ran = false,
                memo;
            return function () {
                if (ran) return memo;
                ran = true;
                memo = func.apply(this, arguments);
                func = null;
                return memo;
            };
        };

        // Returns the first function passed as an argument to the second,
        // allowing you to adjust arguments, run code before and after, and
        // conditionally execute the original function.
        _.wrap = function (func, wrapper) {
            return function () {
                var args = [func];
                push.apply(args, arguments);
                return wrapper.apply(this, args);
            };
        };

        // Returns a function that is the composition of a list of functions, each
        // consuming the return value of the function that follows.
        _.compose = function () {
            var funcs = arguments;
            return function () {
                var args = arguments;
                for (var i = funcs.length - 1; i >= 0; i--) {
                    args = [funcs[i].apply(this, args)];
                }
                return args[0];
            };
        };

        // Returns a function that will only be executed after being called N times.
        _.after = function (times, func) {
            if (times <= 0) return func();
            return function () {
                if (--times < 1) {
                    return func.apply(this, arguments);
                }
            };
        };

        // Object Functions
        // ----------------

        // Retrieve the names of an object's properties.
        // Delegates to **ECMAScript 5**'s native `Object.keys`
        _.keys = nativeKeys || function (obj) {
            if (obj !== Object(obj)) throw new TypeError('Invalid object');
            var keys = [];
            for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
            return keys;
        };

        // Retrieve the values of an object's properties.
        _.values = function (obj) {
            var values = [];
            for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
            return values;
        };

        // Convert an object into a list of `[key, value]` pairs.
        _.pairs = function (obj) {
            var pairs = [];
            for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
            return pairs;
        };

        // Invert the keys and values of an object. The values must be serializable.
        _.invert = function (obj) {
            var result = {};
            for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
            return result;
        };

        // Return a sorted list of the function names available on the object.
        // Aliased as `methods`
        _.functions = _.methods = function (obj) {
            var names = [];
            for (var key in obj) {
                if (_.isFunction(obj[key])) names.push(key);
            }
            return names.sort();
        };

        // Extend a given object with all the properties in passed-in object(s).
        _.extend = function (obj) {
            each(slice.call(arguments, 1), function (source) {
                for (var prop in source) {
                    obj[prop] = source[prop];
                }
            });
            return obj;
        };

        // Return a copy of the object only containing the whitelisted properties.
        _.pick = function (obj) {
            var copy = {};
            var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
            each(keys, function (key) {
                if (key in obj) copy[key] = obj[key];
            });
            return copy;
        };

        // Return a copy of the object without the blacklisted properties.
        _.omit = function (obj) {
            var copy = {};
            var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
            for (var key in obj) {
                if (!_.contains(keys, key)) copy[key] = obj[key];
            }
            return copy;
        };

        // Fill in a given object with default properties.
        _.defaults = function (obj) {
            each(slice.call(arguments, 1), function (source) {
                for (var prop in source) {
                    if (obj[prop] == null) obj[prop] = source[prop];
                }
            });
            return obj;
        };

        // Create a (shallow-cloned) duplicate of an object.
        _.clone = function (obj) {
            if (!_.isObject(obj)) return obj;
            return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
        };

        // Invokes interceptor with the obj, and then returns obj.
        // The primary purpose of this method is to "tap into" a method chain, in
        // order to perform operations on intermediate results within the chain.
        _.tap = function (obj, interceptor) {
            interceptor(obj);
            return obj;
        };

        // Internal recursive comparison function for `isEqual`.
        var eq = function (a, b, aStack, bStack) {
            // Identical objects are equal. `0 === -0`, but they aren't identical.
            // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
            if (a === b) return a !== 0 || 1 / a == 1 / b;
            // A strict comparison is necessary because `null == undefined`.
            if (a == null || b == null) return a === b;
            // Unwrap any wrapped objects.
            if (a instanceof _) a = a._wrapped;
            if (b instanceof _) b = b._wrapped;
            // Compare `[[Class]]` names.
            var className = toString.call(a);
            if (className != toString.call(b)) return false;
            switch (className) {
                // Strings, numbers, dates, and booleans are compared by value.
                case '[object String]':
                    // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
                    // equivalent to `new String("5")`.
                    return a == String(b);
                case '[object Number]':
                    // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
                    // other numeric values.
                    return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
                case '[object Date]':
                case '[object Boolean]':
                    // Coerce dates and booleans to numeric primitive values. Dates are compared by their
                    // millisecond representations. Note that invalid dates with millisecond representations
                    // of `NaN` are not equivalent.
                    return +a == +b;
                    // RegExps are compared by their source patterns and flags.
                case '[object RegExp]':
                    return a.source == b.source && a.global == b.global && a.multiline == b.multiline && a.ignoreCase == b.ignoreCase;
            }
            if (typeof a != 'object' || typeof b != 'object') return false;
            // Assume equality for cyclic structures. The algorithm for detecting cyclic
            // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
            var length = aStack.length;
            while (length--) {
                // Linear search. Performance is inversely proportional to the number of
                // unique nested structures.
                if (aStack[length] == a) return bStack[length] == b;
            }
            // Add the first object to the stack of traversed objects.
            aStack.push(a);
            bStack.push(b);
            var size = 0,
                result = true;
            // Recursively compare objects and arrays.
            if (className == '[object Array]') {
                // Compare array lengths to determine if a deep comparison is necessary.
                size = a.length;
                result = size == b.length;
                if (result) {
                    // Deep compare the contents, ignoring non-numeric properties.
                    while (size--) {
                        if (!(result = eq(a[size], b[size], aStack, bStack))) break;
                    }
                }
            } else {
                // Objects with different constructors are not equivalent, but `Object`s
                // from different frames are.
                var aCtor = a.constructor,
                    bCtor = b.constructor;
                if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) && _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
                    return false;
                }
                // Deep compare objects.
                for (var key in a) {
                    if (_.has(a, key)) {
                        // Count the expected number of properties.
                        size++;
                        // Deep compare each member.
                        if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
                    }
                }
                // Ensure that both objects contain the same number of properties.
                if (result) {
                    for (key in b) {
                        if (_.has(b, key) && !(size--)) break;
                    }
                    result = !size;
                }
            }
            // Remove the first object from the stack of traversed objects.
            aStack.pop();
            bStack.pop();
            return result;
        };

        // Perform a deep comparison to check if two objects are equal.
        _.isEqual = function (a, b) {
            return eq(a, b, [], []);
        };

        // Is a given array, string, or object empty?
        // An "empty" object has no enumerable own-properties.
        _.isEmpty = function (obj) {
            if (obj == null) return true;
            if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
            for (var key in obj) if (_.has(obj, key)) return false;
            return true;
        };

        // Is a given value a DOM element?
        _.isElement = function (obj) {
            return !!(obj && obj.nodeType === 1);
        };

        // Is a given value an array?
        // Delegates to ECMA5's native Array.isArray
        _.isArray = nativeIsArray || function (obj) {
            return toString.call(obj) == '[object Array]';
        };

        // Is a given variable an object?
        _.isObject = function (obj) {
            return obj === Object(obj);
        };

        // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
        each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function (name) {
            _['is' + name] = function (obj) {
                return toString.call(obj) == '[object ' + name + ']';
            };
        });

        // Define a fallback version of the method in browsers (ahem, IE), where
        // there isn't any inspectable "Arguments" type.
        if (!_.isArguments(arguments)) {
            _.isArguments = function (obj) {
                return !!(obj && _.has(obj, 'callee'));
            };
        }

        // Optimize `isFunction` if appropriate.
        if (typeof (/./) !== 'function') {
            _.isFunction = function (obj) {
                return typeof obj === 'function';
            };
        }

        // Is a given object a finite number?
        _.isFinite = function (obj) {
            return _.isNumber(obj) && isFinite(obj);
        };

        // Is the given value `NaN`? (NaN is the only number which does not equal itself).
        _.isNaN = function (obj) {
            return _.isNumber(obj) && obj != +obj;
        };

        // Is a given value a boolean?
        _.isBoolean = function (obj) {
            return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
        };

        // Is a given value equal to null?
        _.isNull = function (obj) {
            return obj === null;
        };

        // Is a given variable undefined?
        _.isUndefined = function (obj) {
            return obj === void 0;
        };

        // Shortcut function for checking if an object has a given property directly
        // on itself (in other words, not on a prototype).
        _.has = function (obj, key) {
            return hasOwnProperty.call(obj, key);
        };

        // Utility Functions
        // -----------------

        // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
        // previous owner. Returns a reference to the Underscore object.
        _.noConflict = function () {
            root._ = previousUnderscore;
            return this;
        };

        // Keep the identity function around for default iterators.
        _.identity = function (value) {
            return value;
        };

        // Run a function **n** times.
        _.times = function (n, iterator, context) {
            for (var i = 0; i < n; i++) iterator.call(context, i);
        };

        // Return a random integer between min and max (inclusive).
        _.random = function (min, max) {
            if (max == null) {
                max = min;
                min = 0;
            }
            return min + (0 | Math.random() * (max - min + 1));
        };

        // List of HTML entities for escaping.
        var entityMap = {
            escape: {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                '/': '&#x2F;'
            }
        };
        entityMap.unescape = _.invert(entityMap.escape);

        // Regexes containing the keys and values listed immediately above.
        var entityRegexes = {
            escape: new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
            unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
        };

        // Functions for escaping and unescaping strings to/from HTML interpolation.
        _.each(['escape', 'unescape'], function (method) {
            _[method] = function (string) {
                if (string == null) return '';
                return ('' + string).replace(entityRegexes[method], function (match) {
                    return entityMap[method][match];
                });
            };
        });

        // If the value of the named property is a function then invoke it;
        // otherwise, return it.
        _.result = function (object, property) {
            if (object == null) return null;
            var value = object[property];
            return _.isFunction(value) ? value.call(object) : value;
        };

        // Add your own custom functions to the Underscore object.
        _.mixin = function (obj) {
            each(_.functions(obj), function (name) {
                var func = _[name] = obj[name];
                _.prototype[name] = function () {
                    var args = [this._wrapped];
                    push.apply(args, arguments);
                    return result.call(this, func.apply(_, args));
                };
            });
        };

        // Generate a unique integer id (unique within the entire client session).
        // Useful for temporary DOM ids.
        var idCounter = 0;
        _.uniqueId = function (prefix) {
            var id = idCounter++;
            return prefix ? prefix + id : id;
        };

        // By default, Underscore uses ERB-style template delimiters, change the
        // following template settings to use alternative delimiters.
        _.templateSettings = {
            evaluate: /<%([\s\S]+?)%>/g,
            interpolate: /<%=([\s\S]+?)%>/g,
            escape: /<%-([\s\S]+?)%>/g
        };

        // When customizing `templateSettings`, if you don't want to define an
        // interpolation, evaluation or escaping regex, we need one that is
        // guaranteed not to match.
        var noMatch = /(.)^/;

        // Certain characters need to be escaped so that they can be put into a
        // string literal.
        var escapes = {
            "'": "'",
            '\\': '\\',
            '\r': 'r',
            '\n': 'n',
            '\t': 't',
            '\u2028': 'u2028',
            '\u2029': 'u2029'
        };

        var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

        // JavaScript micro-templating, similar to John Resig's implementation.
        // Underscore templating handles arbitrary delimiters, preserves whitespace,
        // and correctly escapes quotes within interpolated code.
        _.template = function (text, data, settings) {
            settings = _.defaults({}, settings, _.templateSettings);

            // Combine delimiters into one regular expression via alternation.
            var matcher = new RegExp([
            (settings.escape || noMatch).source, (settings.interpolate || noMatch).source, (settings.evaluate || noMatch).source].join('|') + '|$', 'g');

            // Compile the template source, escaping string literals appropriately.
            var index = 0;
            var source = "__p+='";
            text.replace(matcher, function (match, escape, interpolate, evaluate, offset) {
                source += text.slice(index, offset)
                    .replace(escaper, function (match) {
                    return '\\' + escapes[match];
                });
                source += escape ? "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'" : interpolate ? "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'" : evaluate ? "';\n" + evaluate + "\n__p+='" : '';
                index = offset + match.length;
            });
            source += "';\n";

            // If a variable is not specified, place data values in local scope.
            if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

            source = "var __t,__p='',__j=Array.prototype.join," +
                "print=function(){__p+=__j.call(arguments,'');};\n" + source + "return __p;\n";

            try {
                var render = new Function(settings.variable || 'obj', '_', source);
            } catch (e) {
                e.source = source;
                throw e;
            }

            if (data) return render(data, _);
            var template = function (data) {
                return render.call(this, data, _);
            };

            // Provide the compiled function source as a convenience for precompilation.
            template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

            return template;
        };

        // Add a "chain" function, which will delegate to the wrapper.
        _.chain = function (obj) {
            return _(obj).chain();
        };

        // OOP
        // ---------------
        // If Underscore is called as a function, it returns a wrapped object that
        // can be used OO-style. This wrapper holds altered versions of all the
        // underscore functions. Wrapped objects may be chained.

        // Helper function to continue chaining intermediate results.
        var result = function (obj) {
            return this._chain ? _(obj).chain() : obj;
        };

        // Add all of the Underscore functions to the wrapper object.
        _.mixin(_);

        // Add all mutator Array functions to the wrapper.
        each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function (name) {
            var method = ArrayProto[name];
            _.prototype[name] = function () {
                var obj = this._wrapped;
                method.apply(obj, arguments);
                if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
                return result.call(this, obj);
            };
        });

        // Add all accessor Array functions to the wrapper.
        each(['concat', 'join', 'slice'], function (name) {
            var method = ArrayProto[name];
            _.prototype[name] = function () {
                return result.call(this, method.apply(this._wrapped, arguments));
            };
        });

        _.extend(_.prototype, {

            // Start chaining a wrapped Underscore object.
            chain: function () {
                this._chain = true;
                return this;
            },

            // Extracts the result from a wrapped and chained object.
            value: function () {
                return this._wrapped;
            }

        });

    }).call(this);

});

require.define("/game/role.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var EventEmitter, ExSocket, IdEquals, Prompt, Role, SetLockScreen, dataKey, dataMgr, gameLog, getProperty, setProperty, utilties, _,
        __hasProp = {}.hasOwnProperty,
            __extends = function (child, parent) {
                for (var key in parent) {
                    if (__hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            };

        _ = require("underscore");

        EventEmitter = require('events').EventEmitter;

        gameLog = require("../lib/logger").gameLog;

        getProperty = require("../lib/assist").getProperty;

        setProperty = require("../lib/assist").setProperty;

        dataMgr = require("./dataMgr").dataMgr;

        dataKey = require("./dataMgr").dataKey;

        utilties = require("./utilities");

        Prompt = utilties.Prompt;

        IdEquals = utilties.IdEquals;

        SetLockScreen = utilties.SetLockScreen;

        ExSocket = utilties.ExSocket;

        Role = (function (_super) {

            __extends(Role, _super);

            Role.moduleName = "Role";

            Role.skillFunc = ["selectSkill", "addRoleSkill", "removeRoleSkill"];

            Role.chatType = ["world", "country", "army", "private", "system"];

            Role.chatMax = 50;

            Role.eventChangeMap = "changeMap";

            Role.eventChange = "change";

            function Role(roleDb_, socket_) {
                var name;
                this.roleDb_ = roleDb_;
                this.socket_ = socket_;
                name = this.roleDb_.name;
                this.currency_ = this.roleDb_.currency;
                this.name_ = name;
                this.roleDb_.loginTime = Date.now();
                if (this.socket_ != null) {
                    ExSocket(this.socket_);
                    this.socket_.set("name", name);
                    this.socket_.set("role", this);
                }
            }

            Role.prototype.init = function () {};

            Role.prototype.addTranspondEvent = function (object, eventName) {
                var _this = this;
                return object.on(eventName, function () {
                    return _this.emit.apply(_this, arguments);
                });
            };

            Role.prototype.save = function () {};

            Role.prototype.setLocation = function (location_) {
                this.location_ = location_;
            };

            Role.prototype.getLocation = function () {
                return this.location_;
            };

            Role.prototype.changeSilver = function (silver) {
                this.roleDb_.silver += silver;
                if (this.roleDb_.silver < 0) {
                    this.roleDb_.silver = 0;
                }
                return this.emit("silverChange", this.roleDb_.silver);
            };

            Role.prototype.changeAndNotice = function (key, value) {
                return this.change(key, value);
            };

            Role.prototype.change = function (key, value) {
                if (_.isNumber(this.roleDb_[key]) && _.isNumber(value)) {
                    this.roleDb_[key] += value;
                    this.emit("change:" + key, this.roleDb_[key]);
                    return true;
                }
                return false;
            };

            Role.prototype.changeMap = function (properties) {
                var changeProp, key, value;
                changeProp = false;
                for (key in properties) {
                    value = properties[key];
                    changeProp = true;
                    this.change(key, value);
                }
                if (changeProp) {
                    return this.emit(Role.eventChangeMap, properties);
                }
            };

            Role.prototype.isEnough = function (key, value) {
                if (_.isNumber(this.roleDb_[key]) && _.isNumber(value)) {
                    return this.roleDb_[key] >= value;
                }
                return false;
            };

            Role.prototype.getPackSystem = function () {
                return this.packSystem_;
            };

            Role.prototype.getName = function () {
                return this.name_;
            };

            Role.prototype.getRoleId = function () {
                return this.roleDb_._id;
            };

            Role.prototype.getMainHero = function () {
                return this.getHeroSystem().getMainHero();
            };

            Role.prototype.getHero = function (docId) {
                return this.getHeroSystem().getHero(docId);
            };

            Role.prototype.getLevel = function () {
                return this.roleDb_.heroTable[0].level;
            };

            Role.prototype.getSocket = function () {
                return this.socket_;
            };

            Role.prototype.getArmy = function () {
                return this.roleDb_.army;
            };

            Role.prototype.getCountry = function () {
                return this.roleDb_.country;
            };

            Role.prototype.getPositionSystem = function () {
                return this.positionSystem_;
            };

            Role.prototype.getHeroSystem = function () {
                return this.heroSystem_;
            };

            Role.prototype.getTaskSystem = function () {
                return this.taskSystem_;
            };

            Role.prototype.getChapterSystem = function () {
                return this.chapterSystem_;
            };

            Role.prototype.getFriendSystem = function () {
                return this.friendSystem_;
            };

            Role.prototype.getEmailSystem = function () {
                return this.emailSystem_;
            };

            Role.prototype.getBarSystem = function () {
                return this.barSystem_;
            };

            Role.prototype.getHeroStarSystem = function () {
                return this.heroStarSystem_;
            };

            Role.prototype.prompt = function (message) {
                if (typeof window !== "undefined" && window !== null) {
                    return Prompt(message);
                } else {
                    return Prompt(message, this.socket_);
                }
            };

            Role.prototype.setLockScreen = function (lock) {
                if (typeof window !== "undefined" && window !== null) {
                    return SetLockScreen(lock);
                } else {
                    return SetLockScreen(lock, this.socket_);
                }
            };

            Role.prototype.getSkillTable = function () {
                return this.roleDb_.skillTable;
            };

            Role.prototype.existSkill = function (skillId) {
                return _.contains(this.roleDb_.skillTable, skillId);
            };

            Role.prototype.selectSkill = function (skillId) {
                var index, result;
                result = false;
                if (_.isNumber(skillId)) {
                    index = _.indexOf(this.roleDb_.skillTable, skillId);
                    if (index !== -1) {
                        result = true;
                        this.setCurrentSkill(this.roleDb_.skillTable[index]);
                    }
                }
                return result;
            };

            Role.prototype.setCurrentSkill = function (skillId) {
                if (_.isNumber(skillId)) {
                    return this.roleDb_.heroTable[0].skillId = skillId;
                }
            };

            Role.prototype.addRoleSkill = function (skillId) {
                var result;
                result = false;
                if (_.isNumber(skillId) && !this.existSkill(skillId) && ((dataMgr.find(dataKey.skillTable, skillId)) != null)) {
                    this.roleDb_.skillTable.push(skillId);
                    result = true;
                }
                return result;
            };

            Role.prototype.removeRoleSkill = function (skillId) {
                var index, result;
                result = false;
                if (_.isNumber(skillId)) {
                    index = _.indexOf(this.roleDb_.skillTable, skillId);
                    if (index !== -1) {
                        result = true;
                        this.roleDb_.skillTable.splice(index, 1);
                    }
                }
                return result;
            };

            Role.prototype.canChat = function (type, str) {
                return _.isString(type) && _.contains(Role.chatType, type) && _.isString(str) && str.length <= Role.chatMax && str.length > 0;
            };

            return Role;

        })(EventEmitter);

        module.exports = Role;

    }).call(this);

});

require.define("events", function (require, module, exports, __dirname, __filename, process, global) {
    if (!process.EventEmitter) process.EventEmitter = function () {};

    var EventEmitter = exports.EventEmitter = process.EventEmitter;
    var isArray = typeof Array.isArray === 'function' ? Array.isArray : function (xs) {
            return Object.prototype.toString.call(xs) === '[object Array]'
        };

    // By default EventEmitters will print a warning if more than
    // 10 listeners are added to it. This is a useful default which
    // helps finding memory leaks.
    //
    // Obviously not all Emitters should be limited to 10. This function allows
    // that to be increased. Set to zero for unlimited.
    var defaultMaxListeners = 10;
    EventEmitter.prototype.setMaxListeners = function (n) {
        if (!this._events) this._events = {};
        this._events.maxListeners = n;
    };


    EventEmitter.prototype.emit = function (type) {
        // If there is no 'error' event listener then throw.
        if (type === 'error') {
            if (!this._events || !this._events.error || (isArray(this._events.error) && !this._events.error.length)) {
                if (arguments[1] instanceof Error) {
                    throw arguments[1]; // Unhandled 'error' event
                } else {
                    throw new Error("Uncaught, unspecified 'error' event.");
                }
                return false;
            }
        }

        if (!this._events) return false;
        var handler = this._events[type];
        if (!handler) return false;

        if (typeof handler == 'function') {
            switch (arguments.length) {
                // fast cases
                case 1:
                    handler.call(this);
                    break;
                case 2:
                    handler.call(this, arguments[1]);
                    break;
                case 3:
                    handler.call(this, arguments[1], arguments[2]);
                    break;
                    // slower
                default:
                    var args = Array.prototype.slice.call(arguments, 1);
                    handler.apply(this, args);
            }
            return true;

        } else if (isArray(handler)) {
            var args = Array.prototype.slice.call(arguments, 1);

            var listeners = handler.slice();
            for (var i = 0, l = listeners.length; i < l; i++) {
                listeners[i].apply(this, args);
            }
            return true;

        } else {
            return false;
        }
    };

    // EventEmitter is defined in src/node_events.cc
    // EventEmitter.prototype.emit() is also defined there.
    EventEmitter.prototype.addListener = function (type, listener) {
        if ('function' !== typeof listener) {
            throw new Error('addListener only takes instances of Function');
        }

        if (!this._events) this._events = {};

        // To avoid recursion in the case that type == "newListeners"! Before
        // adding it to the listeners, first emit "newListeners".
        this.emit('newListener', type, listener);

        if (!this._events[type]) {
            // Optimize the case of one listener. Don't need the extra array object.
            this._events[type] = listener;
        } else if (isArray(this._events[type])) {

            // Check for listener leak
            if (!this._events[type].warned) {
                var m;
                if (this._events.maxListeners !== undefined) {
                    m = this._events.maxListeners;
                } else {
                    m = defaultMaxListeners;
                }

                if (m && m > 0 && this._events[type].length > m) {
                    this._events[type].warned = true;
                    console.error('(node) warning: possible EventEmitter memory ' +
                        'leak detected. %d listeners added. ' +
                        'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
                    console.trace();
                }
            }

            // If we've already got an array, just append.
            this._events[type].push(listener);
        } else {
            // Adding the second element, need to change to array.
            this._events[type] = [this._events[type], listener];
        }

        return this;
    };

    EventEmitter.prototype.on = EventEmitter.prototype.addListener;

    EventEmitter.prototype.once = function (type, listener) {
        var self = this;
        self.on(type, function g() {
            self.removeListener(type, g);
            listener.apply(this, arguments);
        });

        return this;
    };

    EventEmitter.prototype.removeListener = function (type, listener) {
        if ('function' !== typeof listener) {
            throw new Error('removeListener only takes instances of Function');
        }

        // does not use listeners(), so no side effect of creating _events[type]
        if (!this._events || !this._events[type]) return this;

        var list = this._events[type];

        if (isArray(list)) {
            var i = list.indexOf(listener);
            if (i < 0) return this;
            list.splice(i, 1);
            if (list.length == 0) delete this._events[type];
        } else if (this._events[type] === listener) {
            delete this._events[type];
        }

        return this;
    };

    EventEmitter.prototype.removeAllListeners = function (type) {
        // does not use listeners(), so no side effect of creating _events[type]
        if (type && this._events && this._events[type]) this._events[type] = null;
        return this;
    };

    EventEmitter.prototype.listeners = function (type) {
        if (!this._events) this._events = {};
        if (!this._events[type]) this._events[type] = [];
        if (!isArray(this._events[type])) {
            this._events[type] = [this._events[type]];
        }
        return this._events[type];
    };

});

require.define("/lib/logger.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var gameLog, libLog, winston;

        if (typeof window !== "undefined" && window !== null) {
            module.exports.gameLog = console;
            module.exports.libLog = console;
            return;
        }

        winston = require('winston');

        gameLog = new winston.Logger({
            transports: [
            new winston.transports.Console({
                colorize: true,
                timestamp: function () {
                    return Date();
                }
            }), new winston.transports.File({
                filename: '../log/gameLog.log',
                colorize: true,
                timestamp: function () {
                    return Date();
                }
            })]
        });

        libLog = new winston.Logger({
            transports: [
            new winston.transports.Console({
                colorize: true,
                timestamp: function () {
                    return Date();
                }
            }), new winston.transports.File({
                filename: '../log/libLog.log',
                colorize: true,
                timestamp: function () {
                    return Date();
                }
            })]
        });

        module.exports.gameLog = gameLog;

        module.exports.libLog = libLog;

    }).call(this);

});

require.define("/lib/assist.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var findIndexAndObject, getProperty, setProperty, _;

        _ = require("underscore");

        getProperty = function (object, path) {
            var part, parts, _i, _len;
            parts = path.split(".");
            if (parts.length === 1) {
                return object[path];
            } else {
                for (_i = 0, _len = parts.length; _i < _len; _i++) {
                    part = parts[_i];
                    object = object[part];
                    if (object === void 0) {
                        return void 0;
                    }
                }
                return object;
            }
        };

        setProperty = function (object, path, value) {
            var index, part, parts, partsEnd, _i, _len;
            parts = path.split(".");
            if (parts.length === 1) {
                return object[path] = value;
            } else {
                partsEnd = parts.length - 1;
                for (index = _i = 0, _len = parts.length; _i < _len; index = ++_i) {
                    part = parts[index];
                    if (index === partsEnd) {
                        object[part] = value;
                    } else if (_.isObject(object[part])) {
                        object = object[part];
                    } else {
                        return;
                    }
                }
            }
        };

        module.exports.getProperty = getProperty;

        module.exports.setProperty = setProperty;

        module.exports.findIndexAndObject = findIndexAndObject = function (table, value, key, func) {
            var index, iter, iterIndex, object, _i, _j, _len, _len1;
            index = -1;
            object = null;
            if (_.isFunction(func)) {
                for (iterIndex = _i = 0, _len = table.length; _i < _len; iterIndex = ++_i) {
                    iter = table[iterIndex];
                    if (func(iter[key], value)) {
                        index = iterIndex;
                        object = iter;
                        break;
                    }
                }
            } else {
                for (iterIndex = _j = 0, _len1 = table.length; _j < _len1; iterIndex = ++_j) {
                    iter = table[iterIndex];
                    if (iter[key] === value) {
                        index = iterIndex;
                        object = iter;
                        break;
                    }
                }
            }
            return [index, object];
        };

        module.exports.findObject = function (table, value, key, func) {
            return findIndexAndObject(table, value, key, func)[1];
        };

        module.exports.indexOfObject = function (table, value, key, func) {
            return findIndexAndObject(table, value, key, func)[0];
        };

        module.exports.existObject = function (table, value, key, func) {
            return findIndexAndObject(table, value, key, func)[0] !== -1;
        };

        module.exports.getClassName = function (object) {
            var funcNameRegex, results;
            funcNameRegex = /function (.{1,})\(/;
            results = funcNameRegex.exec(object.constructor.toString());
            if (results && results.length > 1) {
                return results[1];
            } else {
                return "";
            }
        };

    }).call(this);

});

require.define("/game/dataMgr.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var DataMgr, EventEmitter, async, dataKey, dataMgr, dataTables, gameLog, jf, readFile, _,
        __hasProp = {}.hasOwnProperty,
            __extends = function (child, parent) {
                for (var key in parent) {
                    if (__hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            };

        async = require('async');

        EventEmitter = require('events').EventEmitter;

        dataTables = require('../config/dataTables');

        _ = require('underscore');

        gameLog = require("../lib/logger").gameLog;

        if (typeof window !== "undefined" && window !== null) {
            readFile = function (fileName, callback) {
                return $.ajax({
                    url: fileName,
                    dataType: "json",
                    success: function (data) {
                        return callback(null, data);
                    },
                    error: function (xhr, textStatus, errorThrown) {
                        return callback(errorThrown, null);
                    }
                });
            };
        } else {
            jf = require("jsonfile");
            readFile = jf.readFile;
        }

        /**
         * 数据表管理器
         * @module dataMgr
         * @class DataMgr 
         * @extends {EventEmitter}
         * @constructor
         */


        DataMgr = (function (_super) {

            __extends(DataMgr, _super);

            DataMgr.haveKey = function (data, key) {
                var value;
                value = data[key];
                return (value != null) && value === 1;
            };

            function DataMgr() {
                this.dataTables_ = {};
            }

            /**
             * 加载服务器数据并且加载完毕触发fileDone事件
             * @method loadFiles
             * @public
             */


            DataMgr.prototype.loadFiles = function () {
                var callback_, file, fileName, name, parcallarr, path,
                _this = this;
                path = "gameData/";
                if (dataTables != null) {
                    parcallarr = [];
                    for (name in dataTables) {
                        file = dataTables[name];
                        fileName = path + file;
                        callback_ = (function (name, fileName) {
                            return function (callback) {
                                return readFile(fileName, function (err, result) {
                                    if (!err) {
                                        _this.dataTables_[name] = result;
                                    }
                                    return callback(err, result);
                                });
                            };
                        })(name, fileName);
                        parcallarr.push(callback_);
                    }
                    return async.parallel(parcallarr, function (err, results) {
                        if (err) {
                            return gameLog.error(err);
                        } else {
                            gameLog.info("服务器数据加载完毕!");
                            return _this.emit("fileDone");
                        }
                    });
                } else {
                    return gameLog.error("服务器数据配置文件读取失败!");
                }
            };

            /**
             * @method find
             * @public
             * @param  {String} name dataKey的键
             * @param  {Number} id   数据id
             * @return {Object}      表中一行
             */


            DataMgr.prototype.find = function (name, id) {
                var dataTable, result;
                result = null;
                dataTable = this.dataTables_[name];
                if (dataTable != null) {
                    result = dataTable[id];
                }
                return result;
            };

            DataMgr.prototype.getDataTable = function (key) {
                return this.dataTables_[key];
            };

            DataMgr.dataTables_;

            return DataMgr;

        })(EventEmitter);

        dataKey = {
            heroTable: "heroTable",
            mapTable: "mapTable",
            itemTable: "itemTable",
            baseOdds: "baseOdds",
            chapter: "chapter",
            monster: "monster",
            monsterPack: "monsterPack",
            skillTable: "skillTable",
            taskTable: "taskTable",
            expTable: "expTable",
            equipRandTable: "equipRandTable",
            bar: "bar",
            heroStar: "heroStar",
            npcTable: "npcTable"
        };

        dataMgr = new DataMgr;

        module.exports.dataMgr = dataMgr;

        module.exports.dataKey = dataKey;

    }).call(this);

});

require.define("/node_modules/async/package.json", function (require, module, exports, __dirname, __filename, process, global) {
    module.exports = {
        "main": "./index"
    }
});

require.define("/node_modules/async/index.js", function (require, module, exports, __dirname, __filename, process, global) { // This file is just added for convenience so this repository can be
    // directly checked out into a project's deps folder
    module.exports = require('./lib/async');

});

require.define("/node_modules/async/lib/async.js", function (require, module, exports, __dirname, __filename, process, global) { /*global setTimeout: false, console: false */
    (function () {

        var async = {};

        // global on the server, window in the browser
        var root = this,
            previous_async = root.async;

        if (typeof module !== 'undefined' && module.exports) {
            module.exports = async;
        } else {
            root.async = async;
        }

        async.noConflict = function () {
            root.async = previous_async;
            return async;
        };

        //// cross-browser compatiblity functions ////

        var _forEach = function (arr, iterator) {
            if (arr.forEach) {
                return arr.forEach(iterator);
            }
            for (var i = 0; i < arr.length; i += 1) {
                iterator(arr[i], i, arr);
            }
        };

        var _map = function (arr, iterator) {
            if (arr.map) {
                return arr.map(iterator);
            }
            var results = [];
            _forEach(arr, function (x, i, a) {
                results.push(iterator(x, i, a));
            });
            return results;
        };

        var _reduce = function (arr, iterator, memo) {
            if (arr.reduce) {
                return arr.reduce(iterator, memo);
            }
            _forEach(arr, function (x, i, a) {
                memo = iterator(memo, x, i, a);
            });
            return memo;
        };

        var _keys = function (obj) {
            if (Object.keys) {
                return Object.keys(obj);
            }
            var keys = [];
            for (var k in obj) {
                if (obj.hasOwnProperty(k)) {
                    keys.push(k);
                }
            }
            return keys;
        };

        //// exported async module functions ////

        //// nextTick implementation with browser-compatible fallback ////
        if (typeof process === 'undefined' || !(process.nextTick)) {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
        } else {
            async.nextTick = process.nextTick;
        }

        async.forEach = function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length) {
                return callback();
            }
            var completed = 0;
            _forEach(arr, function (x) {
                iterator(x, function (err) {
                    if (err) {
                        callback(err);
                        callback = function () {};
                    } else {
                        completed += 1;
                        if (completed === arr.length) {
                            callback(null);
                        }
                    }
                });
            });
        };

        async.forEachSeries = function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length) {
                return callback();
            }
            var completed = 0;
            var iterate = function () {
                iterator(arr[completed], function (err) {
                    if (err) {
                        callback(err);
                        callback = function () {};
                    } else {
                        completed += 1;
                        if (completed === arr.length) {
                            callback(null);
                        } else {
                            iterate();
                        }
                    }
                });
            };
            iterate();
        };

        async.forEachLimit = function (arr, limit, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish() {
                if (completed === arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        } else {
                            completed += 1;
                            running -= 1;
                            if (completed === arr.length) {
                                callback();
                            } else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };


        var doParallel = function (fn) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return fn.apply(null, [async.forEach].concat(args));
            };
        };
        var doSeries = function (fn) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return fn.apply(null, [async.forEachSeries].concat(args));
            };
        };


        var _asyncMap = function (eachfn, arr, iterator, callback) {
            var results = [];
            arr = _map(arr, function (x, i) {
                return {
                    index: i,
                    value: x
                };
            });
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err, v) {
                    results[x.index] = v;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        };
        async.map = doParallel(_asyncMap);
        async.mapSeries = doSeries(_asyncMap);


        // reduce only has a series version, as doing reduce in parallel won't
        // work in many situations.
        async.reduce = function (arr, memo, iterator, callback) {
            async.forEachSeries(arr, function (x, callback) {
                iterator(memo, x, function (err, v) {
                    memo = v;
                    callback(err);
                });
            }, function (err) {
                callback(err, memo);
            });
        };
        // inject alias
        async.inject = async.reduce;
        // foldl alias
        async.foldl = async.reduce;

        async.reduceRight = function (arr, memo, iterator, callback) {
            var reversed = _map(arr, function (x) {
                return x;
            }).reverse();
            async.reduce(reversed, memo, iterator, callback);
        };
        // foldr alias
        async.foldr = async.reduceRight;

        var _filter = function (eachfn, arr, iterator, callback) {
            var results = [];
            arr = _map(arr, function (x, i) {
                return {
                    index: i,
                    value: x
                };
            });
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (v) {
                    if (v) {
                        results.push(x);
                    }
                    callback();
                });
            }, function (err) {
                callback(_map(results.sort(function (a, b) {
                    return a.index - b.index;
                }), function (x) {
                    return x.value;
                }));
            });
        };
        async.filter = doParallel(_filter);
        async.filterSeries = doSeries(_filter);
        // select alias
        async.select = async.filter;
        async.selectSeries = async.filterSeries;

        var _reject = function (eachfn, arr, iterator, callback) {
            var results = [];
            arr = _map(arr, function (x, i) {
                return {
                    index: i,
                    value: x
                };
            });
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (v) {
                    if (!v) {
                        results.push(x);
                    }
                    callback();
                });
            }, function (err) {
                callback(_map(results.sort(function (a, b) {
                    return a.index - b.index;
                }), function (x) {
                    return x.value;
                }));
            });
        };
        async.reject = doParallel(_reject);
        async.rejectSeries = doSeries(_reject);

        var _detect = function (eachfn, arr, iterator, main_callback) {
            eachfn(arr, function (x, callback) {
                iterator(x, function (result) {
                    if (result) {
                        main_callback(x);
                        main_callback = function () {};
                    } else {
                        callback();
                    }
                });
            }, function (err) {
                main_callback();
            });
        };
        async.detect = doParallel(_detect);
        async.detectSeries = doSeries(_detect);

        async.some = function (arr, iterator, main_callback) {
            async.forEach(arr, function (x, callback) {
                iterator(x, function (v) {
                    if (v) {
                        main_callback(true);
                        main_callback = function () {};
                    }
                    callback();
                });
            }, function (err) {
                main_callback(false);
            });
        };
        // any alias
        async.any = async.some;

        async.every = function (arr, iterator, main_callback) {
            async.forEach(arr, function (x, callback) {
                iterator(x, function (v) {
                    if (!v) {
                        main_callback(false);
                        main_callback = function () {};
                    }
                    callback();
                });
            }, function (err) {
                main_callback(true);
            });
        };
        // all alias
        async.all = async.every;

        async.sortBy = function (arr, iterator, callback) {
            async.map(arr, function (x, callback) {
                iterator(x, function (err, criteria) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, {
                            value: x,
                            criteria: criteria
                        });
                    }
                });
            }, function (err, results) {
                if (err) {
                    return callback(err);
                } else {
                    var fn = function (left, right) {
                        var a = left.criteria,
                            b = right.criteria;
                        return a < b ? -1 : a > b ? 1 : 0;
                    };
                    callback(null, _map(results.sort(fn), function (x) {
                        return x.value;
                    }));
                }
            });
        };

        async.auto = function (tasks, callback) {
            callback = callback || function () {};
            var keys = _keys(tasks);
            if (!keys.length) {
                return callback(null);
            }

            var results = {};

            var listeners = [];
            var addListener = function (fn) {
                listeners.unshift(fn);
            };
            var removeListener = function (fn) {
                for (var i = 0; i < listeners.length; i += 1) {
                    if (listeners[i] === fn) {
                        listeners.splice(i, 1);
                        return;
                    }
                }
            };
            var taskComplete = function () {
                _forEach(listeners.slice(0), function (fn) {
                    fn();
                });
            };

            addListener(function () {
                if (_keys(results).length === keys.length) {
                    callback(null, results);
                    callback = function () {};
                }
            });

            _forEach(keys, function (k) {
                var task = (tasks[k] instanceof Function) ? [tasks[k]] : tasks[k];
                var taskCallback = function (err) {
                    if (err) {
                        callback(err);
                        // stop subsequent errors hitting callback multiple times
                        callback = function () {};
                    } else {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        results[k] = args;
                        taskComplete();
                    }
                };
                var requires = task.slice(0, Math.abs(task.length - 1)) || [];
                var ready = function () {
                    return _reduce(requires, function (a, x) {
                        return (a && results.hasOwnProperty(x));
                    }, true) && !results.hasOwnProperty(k);
                };
                if (ready()) {
                    task[task.length - 1](taskCallback, results);
                } else {
                    var listener = function () {
                        if (ready()) {
                            removeListener(listener);
                            task[task.length - 1](taskCallback, results);
                        }
                    };
                    addListener(listener);
                }
            });
        };

        async.waterfall = function (tasks, callback) {
            callback = callback || function () {};
            if (!tasks.length) {
                return callback();
            }
            var wrapIterator = function (iterator) {
                return function (err) {
                    if (err) {
                        callback(err);
                        callback = function () {};
                    } else {
                        var args = Array.prototype.slice.call(arguments, 1);
                        var next = iterator.next();
                        if (next) {
                            args.push(wrapIterator(next));
                        } else {
                            args.push(callback);
                        }
                        async.nextTick(function () {
                            iterator.apply(null, args);
                        });
                    }
                };
            };
            wrapIterator(async.iterator(tasks))();
        };

        async.parallel = function (tasks, callback) {
            callback = callback || function () {};
            if (tasks.constructor === Array) {
                async.map(tasks, function (fn, callback) {
                    if (fn) {
                        fn(function (err) {
                            var args = Array.prototype.slice.call(arguments, 1);
                            if (args.length <= 1) {
                                args = args[0];
                            }
                            callback.call(null, err, args);
                        });
                    }
                }, callback);
            } else {
                var results = {};
                async.forEach(_keys(tasks), function (k, callback) {
                    tasks[k](function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        results[k] = args;
                        callback(err);
                    });
                }, function (err) {
                    callback(err, results);
                });
            }
        };

        async.series = function (tasks, callback) {
            callback = callback || function () {};
            if (tasks.constructor === Array) {
                async.mapSeries(tasks, function (fn, callback) {
                    if (fn) {
                        fn(function (err) {
                            var args = Array.prototype.slice.call(arguments, 1);
                            if (args.length <= 1) {
                                args = args[0];
                            }
                            callback.call(null, err, args);
                        });
                    }
                }, callback);
            } else {
                var results = {};
                async.forEachSeries(_keys(tasks), function (k, callback) {
                    tasks[k](function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        results[k] = args;
                        callback(err);
                    });
                }, function (err) {
                    callback(err, results);
                });
            }
        };

        async.iterator = function (tasks) {
            var makeCallback = function (index) {
                var fn = function () {
                    if (tasks.length) {
                        tasks[index].apply(null, arguments);
                    }
                    return fn.next();
                };
                fn.next = function () {
                    return (index < tasks.length - 1) ? makeCallback(index + 1) : null;
                };
                return fn;
            };
            return makeCallback(0);
        };

        async.apply = function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            return function () {
                return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments)));
            };
        };

        var _concat = function (eachfn, arr, fn, callback) {
            var r = [];
            eachfn(arr, function (x, cb) {
                fn(x, function (err, y) {
                    r = r.concat(y || []);
                    cb(err);
                });
            }, function (err) {
                callback(err, r);
            });
        };
        async.concat = doParallel(_concat);
        async.concatSeries = doSeries(_concat);

        async.whilst = function (test, iterator, callback) {
            if (test()) {
                iterator(function (err) {
                    if (err) {
                        return callback(err);
                    }
                    async.whilst(test, iterator, callback);
                });
            } else {
                callback();
            }
        };

        async.until = function (test, iterator, callback) {
            if (!test()) {
                iterator(function (err) {
                    if (err) {
                        return callback(err);
                    }
                    async.until(test, iterator, callback);
                });
            } else {
                callback();
            }
        };

        async.queue = function (worker, concurrency) {
            var workers = 0;
            var q = {
                tasks: [],
                concurrency: concurrency,
                saturated: null,
                empty: null,
                drain: null,
                push: function (data, callback) {
                    if (data.constructor !== Array) {
                        data = [data];
                    }
                    _forEach(data, function (task) {
                        q.tasks.push({
                            data: task,
                            callback: typeof callback === 'function' ? callback : null
                        });
                        if (q.saturated && q.tasks.length == concurrency) {
                            q.saturated();
                        }
                        async.nextTick(q.process);
                    });
                },
                process: function () {
                    if (workers < q.concurrency && q.tasks.length) {
                        var task = q.tasks.shift();
                        if (q.empty && q.tasks.length == 0) q.empty();
                        workers += 1;
                        worker(task.data, function () {
                            workers -= 1;
                            if (task.callback) {
                                task.callback.apply(task, arguments);
                            }
                            if (q.drain && q.tasks.length + workers == 0) q.drain();
                            q.process();
                        });
                    }
                },
                length: function () {
                    return q.tasks.length;
                },
                running: function () {
                    return workers;
                }
            };
            return q;
        };

        var _console_fn = function (name) {
            return function (fn) {
                var args = Array.prototype.slice.call(arguments, 1);
                fn.apply(null, args.concat([function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (typeof console !== 'undefined') {
                        if (err) {
                            if (console.error) {
                                console.error(err);
                            }
                        } else if (console[name]) {
                            _forEach(args, function (x) {
                                console[name](x);
                            });
                        }
                    }
                }]));
            };
        };
        async.log = _console_fn('log');
        async.dir = _console_fn('dir');
        /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

        async.memoize = function (fn, hasher) {
            var memo = {};
            var queues = {};
            hasher = hasher || function (x) {
                return x;
            };
            var memoized = function () {
                var args = Array.prototype.slice.call(arguments);
                var callback = args.pop();
                var key = hasher.apply(null, args);
                if (key in memo) {
                    callback.apply(null, memo[key]);
                } else if (key in queues) {
                    queues[key].push(callback);
                } else {
                    queues[key] = [callback];
                    fn.apply(null, args.concat([function () {
                        memo[key] = arguments;
                        var q = queues[key];
                        delete queues[key];
                        for (var i = 0, l = q.length; i < l; i++) {
                            q[i].apply(null, arguments);
                        }
                    }]));
                }
            };
            memoized.unmemoized = fn;
            return memoized;
        };

        async.unmemoize = function (fn) {
            return function () {
                return (fn.unmemoized || fn).apply(null, arguments);
            };
        };

    }());

});

require.define("/config/dataTables.json", function (require, module, exports, __dirname, __filename, process, global) {
    module.exports = {
        "heroTable": "heroTable.json",
        "mapTable": "mapTable.json",
        "itemTable": "item.json",
        "baseOdds": "baseOdds.json",
        "chapter": "chapter.json",
        "monster": "monster.json",
        "monsterPack": "monsterPack.json",
        "skillTable": "skillTable.json",
        "taskTable": "task.json",
        "expTable": "exp.json",
        "equipRandTable": "equipRandTable.json",
        "bar": "bar.json",
        "npcTable": "npcTable.json",
        "heroStar": "heroStar.json"
    };

});

require.define("/node_modules/jsonfile/package.json", function (require, module, exports, __dirname, __filename, process, global) {
    module.exports = {
        "main": "./lib/jsonfile.js"
    }
});

require.define("/node_modules/jsonfile/lib/jsonfile.js", function (require, module, exports, __dirname, __filename, process, global) {
    var fs = require('fs');

    module.exports.spaces = 4;

    function readFile(file, callback) {
        fs.readFile(file, 'utf8', function (err, data) {
            if (err) {
                callback(err, null);
            } else {
                try {
                    var obj = JSON.parse(data);
                    callback(null, obj);
                } catch (err2) {
                    callback(err2, null);
                }
            }
        })
    }

    function readFileSync(file) {
        var data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
    }

    function writeFile(file, obj, callback) {
        var str = '';
        try {
            str = JSON.stringify(obj, null, module.exports.spaces);
        } catch (err) {
            callback(err, null);
        }
        fs.writeFile(file, str, callback);
    }

    function writeFileSync(file, obj) {
        var str = JSON.stringify(obj, null, module.exports.spaces);
        return fs.writeFileSync(file, str); //not sure if fs.writeFileSync returns anything, but just in case
    }


    module.exports.readFile = readFile;
    module.exports.readFileSync = readFileSync;
    module.exports.writeFile = writeFile;
    module.exports.writeFileSync = writeFileSync;
});

require.define("fs", function (require, module, exports, __dirname, __filename, process, global) { // nothing to see here... no file methods for the browser

});

require.define("/game/utilities.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var ExSocket, OnRemoteCall, RegisterRemoteCall, attache, _;

        _ = require("underscore");

        attache = require("attache.js");

        /**
         * 全局函数
         * @class Global
         */


        if (typeof window !== "undefined" && window !== null) {
            /**
             * @method gamePrompt
             * @param {String} message 要说的话
             */

            module.exports.Prompt = window.gamePrompt;
            /**
             * @method setLockScreen
             * @param {Boolean} lock 是否锁屏
             */

            module.exports.SetLockScreen = function () {};
        } else {
            module.exports.Prompt = function (message, socket) {
                if (socket != null) {
                    return socket.emit("gamePrompt", message);
                }
            };
            module.exports.SetLockScreen = function () {};
        }

        module.exports.EventTranspond = function (source, eventName, func, target) {
            return source.on(eventName, function () {
                return func.apply(target, arguments);
            });
        };

        module.exports.OnRemoteCall = OnRemoteCall = function (object, methodName, socket, module, targetFunc) {
            var eventnName;
            if (targetFunc == null) {
                targetFunc = null;
            }
            if (_.isString(module)) {
                eventnName = module + "::" + methodName;
            } else {
                eventnName = methodName;
            }
            if (targetFunc != null) {
                methodName = targetFunc;
            }
            return socket.on(eventnName, function () {
                if ((_.isObject(object)) && (_.isFunction(object[methodName]))) {
                    return object[methodName].apply(object, arguments);
                }
            });
        };

        module.exports.OnArrRemoteCall = function (object, methodNames, socket, module) {
            var name, _i, _len, _results;
            _results = [];
            for (_i = 0, _len = methodNames.length; _i < _len; _i++) {
                name = methodNames[_i];
                _results.push(OnRemoteCall(object, name, socket, module));
            }
            return _results;
        };

        module.exports.RegisterRemoteCall = RegisterRemoteCall = function (object, methodName, socket, module, needReturnTrue) {
            var eventnName;
            if (needReturnTrue == null) {
                needReturnTrue = false;
            }
            if (_.isString(module)) {
                eventnName = module + "::" + methodName;
            } else {
                eventnName = methodName;
            }
            return attache.after(object, methodName, (function () {
                var args;
                args = Array.prototype.slice.call(arguments);
                args.unshift(eventnName);
                return socket.emit.apply(socket, args);
            }), needReturnTrue);
        };

        module.exports.RegArrRemoteCall = function (object, methodNames, socket, module, needReturnTrue) {
            var name, _i, _len, _results;
            if (needReturnTrue == null) {
                needReturnTrue = false;
            }
            _results = [];
            for (_i = 0, _len = methodNames.length; _i < _len; _i++) {
                name = methodNames[_i];
                _results.push(RegisterRemoteCall(object, name, socket, module));
            }
            return _results;
        };

        module.exports.RemoteCall = function (module, methodName, socket, args) {
            var eventnName;
            if (_.isString(module)) {
                eventnName = module + "::" + methodName;
            } else {
                eventnName = methodName;
            }
            args = Array.prototype.slice.call(args);
            args.unshift(eventnName);
            return socket.emit.apply(socket, args);
        };

        if (typeof window !== "undefined" && window !== null) {
            module.exports.IdEquals = function (_id, id) {
                return _id === id;
            };
        } else {
            module.exports.IdEquals = function (_id, id) {
                return _id.equals(id);
            };
        }

        if (typeof window !== "undefined" && window !== null) {
            module.exports.SetValue = function (table, index, val) {
                return table[index] = val;
            };
        } else {
            module.exports.SetValue = function (table, index, val) {
                return table.set(index, val);
            };
        }

        if (typeof window !== "undefined" && window !== null) {
            module.exports.toObject = function (object) {
                return object;
            };
        } else {
            module.exports.toObject = function (object) {
                return object.toObject();
            };
        }

        ExSocket = function (socket) {
            if (typeof window !== "undefined" && window !== null) {
                socket.data = {};
                socket.get = function (key, fn) {
                    fn(null, this.data[key] === void 0 ? null : this.data[key]);
                    return this;
                };
                socket.set = function (key, value, fn) {
                    this.data[key] = value;
                    fn && fn(null);
                    return this;
                };
                socket.has = function (key, fn) {
                    return fn(null, key in this.data);
                };
                return socket.del = function (key, fn) {
                    delete this.data[key];
                    fn && fn(null);
                    return this;
                };
            }
        };

        module.exports.ExSocket = ExSocket;

        module.exports.emitEvent = function (object, eventName, args) {
            args = Array.prototype.slice.call(args);
            args.unshift(eventName);
            if (_.isFunction(object.emit)) {
                return object.emit.apply(object, args);
            }
        };

        module.exports.callOriginFunc = function (obj, funcName) {
            var args;
            args = Array.prototype.slice.call(arguments);
            args.splice(0, 2);
            return obj.origins[funcName].apply(obj, args);
        };

    }).call(this);

});

require.define("/node_modules/attache.js/package.json", function (require, module, exports, __dirname, __filename, process, global) {
    module.exports = {
        "main": "attache.js"
    }
});

require.define("/node_modules/attache.js/attache.js", function (require, module, exports, __dirname, __filename, process, global) {
    module.exports = (function () {
        var getObject = function (obj) {
            if (obj === null || typeof (obj) === "undefined") {
                obj = function () {
                    return this;
                }.call();
            }

            if (typeof (obj) !== "object") {
                throw new TypeError();
            }

            return obj;
        }

        var buildFunctionStack = function (obj, fnName) {
            var functionStack = [];

            if (fnName.constructor === Array) {
                functionStack = fnName;
            }

            if (fnName.constructor === RegExp) {
                for (var key in obj) {
                    if (fnName.test(key)) {
                        functionStack.push(key);
                    }
                }
            }

            if (fnName.constructor === String) {
                functionStack.push(fnName);
            }

            return functionStack;
        }
        var addToContainer = function (obj, name, key, value) {
            if (typeof (obj[name]) === "undefined") {
                obj[name] = {};
            }

            if (typeof (obj[name][key]) === "undefined") {
                obj[name][key] = value;
            }
        }

        return {
            add: function (obj, fnName, aspectFn, when, once, needReturnTrue) {
                if (needReturnTrue == null) needReturnTrue = false
                obj = getObject(obj);
                var functionStack = buildFunctionStack(obj, fnName);

                //Remember original aspect function
                var aspectFnOrigin = aspectFn;
                var aspectObj = this;

                for (var idx in functionStack) {
                    var funcName = functionStack[idx];
                    var currentFunction = obj[funcName];

                    addToContainer(obj, "origins", funcName, currentFunction);
                    addToContainer(obj, "aspectContainer", funcName, {
                        after: [],
                        before: []
                    });

                    //Managing 'once' condition
                    if (once) {
                        //Overriding aspect
                        var exactAspect = function (funcName) {
                            return function () {
                                aspectFnOrigin.apply(obj, arguments);
                                //Self-removing
                                aspectObj.remove(obj, funcName, exactAspect, when);
                            }
                        }(functionStack[idx]);
                    } else {
                        var exactAspect = aspectFn;
                    }

                    if (when === "after") {
                        obj.aspectContainer[funcName].after.push({
                            exactAspect: exactAspect,
                            needReturnTrue: needReturnTrue
                        });
                    } else {
                        obj.aspectContainer[funcName].before.push(exactAspect);
                    }

                    //Overriding original function with passing proper function into new scope
                    obj[funcName] = function (funcName) {
                        return function () {
                            aspectObj.execute(obj.aspectContainer[funcName].before, obj, arguments);
                            //Calling original function name and saving return value
                            var originalReturn = obj.origins[funcName].apply(obj, arguments);

                            aspectObj.executeAfter(obj.aspectContainer[funcName].after, obj, arguments, originalReturn);

                            return originalReturn;
                        }
                    }(functionStack[idx]);
                }
            },

            remove: function (obj, fnName, aspectFn, when) {
                var properCont = obj.aspectContainer[fnName][when];
                //Finding aspect to remove
                for (var i = 0; i < properCont.length; i++) {
                    if (properCont[i] === aspectFn) {
                        properCont.splice(i, 1);
                    }
                }

                //Restoring original function when all aspects are removed
                var aspectCont = obj.aspectContainer[fnName];
                if (aspectCont.after.length == 0 && aspectCont.before.length == 0) {
                    obj[fnName] = obj.origins[fnName];
                }
            },

            after: function (obj, fnName, aspectFn, needReturnTrue) {
                this.add(obj, fnName, aspectFn, "after", false, needReturnTrue);
            },

            remove_after: function (obj, fnName, aspectFn) {
                this.remove(obj, fnName, aspectFn, "after");
            },

            once_after: function (obj, fnName, aspectFn, needReturnTrue) {
                this.add(obj, fnName, aspectFn, "after", true, needReturnTrue);
            },

            before: function (obj, fnName, aspectFn) {
                this.add(obj, fnName, aspectFn);
            },

            remove_before: function (obj, fnName, aspectFn) {
                this.remove(obj, fnName, aspectFn, "before");
            },

            once_before: function (obj, fnName, aspectFn) {
                this.add(obj, fnName, aspectFn, "before", true);
            },

            cloneAndExecute: function (container, obj, arguments) {
                var cloneCont = [];
                for (var i = 0; i < container.length; i++) {
                    cloneCont[i] = container[i];
                    cloneCont[i].apply(obj, arguments);
                }
            },

            execute: function (container, obj, arguments) {
                for (var i = 0; i < container.length; i++) {
                    container[i].apply(obj, arguments);
                }
            },

            executeAfter: function (container, obj, arguments, originalReturn) {
                for (var i = 0; i < container.length; i++) {
                    if (container[i].needReturnTrue) {
                        if (originalReturn === true) {
                            container[i].exactAspect.apply(obj, arguments);
                        }
                    } else {
                        container[i].exactAspect.apply(obj, arguments);
                    }
                }
            }
        }
    })();

});

require.define("/game/clientPackSystem.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var ClientPackSystem, OnArrRemoteCall, PackSystem, attache, dataKey, dataMgr, packSystemPrompt, strformat, _,
        __hasProp = {}.hasOwnProperty,
            __extends = function (child, parent) {
                for (var key in parent) {
                    if (__hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            };

        _ = require("underscore");

        attache = require("attache.js");

        PackSystem = require("./packSystem");

        packSystemPrompt = require("gameData/prompt").packSystem;

        strformat = require("strformat");

        OnArrRemoteCall = require("./utilities").OnArrRemoteCall;

        dataMgr = require("./dataMgr").dataMgr;

        dataKey = require("./dataMgr").dataKey;

        /**
         * @module packSystem
         * @class ClientPackSystem
         * @extends {PackSystem}
         */


        ClientPackSystem = (function (_super) {

            __extends(ClientPackSystem, _super);

            /**
             * @event eventNeedRefreshUI
             * @description 如果包裹是显示状态的时候需要刷新包裹格子与当前格子数量
             */


            ClientPackSystem.eventNeedRefreshUI = "needRefreshUI";

            ClientPackSystem.eventSucceedUplevelStone = "succeedUplevelStone";

            function ClientPackSystem(role_, socket_) {
                ClientPackSystem.__super__.constructor.call(this, role_, socket_);
            }

            ClientPackSystem.prototype.init = function () {
                var moduleName, remoteCalls,
                _this = this;
                moduleName = PackSystem.moduleName;
                this.socket_.on("addNewItem", _.bind(this.addItem, this));
                this.socket_.on("pickItem", _.bind(this.pickItem, this));
                this.socket_.on("pickItems", _.bind(this.pickItems, this));
                remoteCalls = ["removeItemByDocId", "sellItemAndNotice", "sellItemList", "clearPack", "clearTemporaryPack"];
                OnArrRemoteCall(this, remoteCalls, this.socket_, moduleName);
                attache.after(this, remoteCalls, function () {
                    _this.emit(ClientPackSystem.eventNeedRefreshUI);
                    return _this.role_.setLockScreen(false);
                });
                this.socket_.on("uplevelStone", _.bind(this.uplevelStone, this));
                this.socket_.on("composeEquip", _.bind(this.composeEquip, this));
                this.extendAllItemData();
                this.sortAllUnstackItems();
                return this.extendArrayItemData(this.temporaryItems_);
            };

            ClientPackSystem.prototype.extendAllItemData = function () {
                var items, type, _i, _ref, _results;
                _results = [];
                for (type = _i = 0, _ref = PackSystem.typeMax; _i < _ref; type = _i += 1) {
                    items = this.innItems_[type];
                    _results.push(this.extendArrayItemData(items));
                }
                return _results;
            };

            ClientPackSystem.prototype.extendArrayItemData = function (items) {
                var itemData, itemIndex, itemObj, itemTable, _i, _len, _results;
                itemTable = dataKey.itemTable;
                if (_.isArray(items) && items.length > 0) {
                    _results = [];
                    for (itemIndex = _i = 0, _len = items.length; _i < _len; itemIndex = ++_i) {
                        itemObj = items[itemIndex];
                        itemData = dataMgr.find(itemTable, itemObj.resId);
                        if (itemData != null) {
                            _results.push(items[itemIndex] = _.extend(itemObj, itemData));
                        } else {
                            _results.push(void 0);
                        }
                    }
                    return _results;
                }
            };

            /**
             * @method preRemoveItem
             * @param  {Number} type  物品类型
             * @param  {String} docId 物品Id
             */


            ClientPackSystem.prototype.preRemoveItem = function (type, docId) {
                if ((_.isNumber(type)) && _.isString(docId)) {
                    this.socket_.emit("removeItem", type, docId);
                    return this.role_.setLockScreen(true);
                }
            };

            /**
             * @method preSellItem
             * @param  {Number} type  物品类型
             * @param  {String} docId 物品Id
             */


            ClientPackSystem.prototype.preSellItem = function (type, docId) {
                if ((_.isNumber(type)) && _.isString(docId)) {
                    this.socket_.emit("sellItem", type, docId);
                    return this.role_.setLockScreen(true);
                }
            };

            /**
             * @method preSellItemList
             * @param  {Array} list 要出售的物品列表
             */


            ClientPackSystem.prototype.preSellItemList = function (list) {
                if (_.isArray(list)) {
                    this.socket_.emit("sellItemList", list);
                    return this.role_.setLockScreen(true);
                }
            };

            /**
             * @method prePickItem
             * @param {String} docId 拾取的物品Id
             */


            ClientPackSystem.prototype.prePickItem = function (docId) {
                if (this.canPickItem(docId)) {
                    this.socket_.emit("pickItem", docId);
                    return this.role_.setLockScreen(true);
                } else {
                    return this.role_.prompt(packSystemPrompt.pickError);
                }
            };

            ClientPackSystem.prototype.prePickItems = function () {
                var itemSet;
                itemSet = this.tempItemsToSet();
                if (this.canPickItems(itemSet)) {
                    this.socket_.emit("pickItems");
                    return this.role_.setLockScreen(true);
                } else {
                    return this.role_.prompt(packSystemPrompt.aTypePackFail);
                }
            };

            /**
             * @method getExpItems
             * @description 获取经验卡道具
             * @return {Array} 经验卡列表
             */


            ClientPackSystem.prototype.getExpItems = function () {
                var expItems, item, _i, _len, _ref;
                expItems = [];
                _ref = this.items_.commonItems;
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    item = _ref[_i];
                    if (item.subType === 2) {
                        expItems.push(item);
                    }
                }
                return expItems;
            };

            /**
             * @method getFilterItems
             * @description 获取物品过滤 根据等级和职业过滤
             * @param  {Number} type      物品类型
             * @param  {Number} heroIndex 英雄索引
             * @return {Array}  过滤后的物品列表
             */


            ClientPackSystem.prototype.getFilterItems = function (type, heroId) {
                var filterItems, hero, item, items, level, vocation, _i, _len;
                filterItems = [];
                if (_.isNumber(type) && _.isString(heroId)) {
                    hero = this.role_.getHeroSystem().getHero(heroId);
                    items = this.getItemsByType(type);
                    if (_.isArray(items) && (hero != null)) {
                        level = hero.level;
                        vocation = hero.vocation;
                        for (_i = 0, _len = items.length; _i < _len; _i++) {
                            item = items[_i];
                            if (level >= item.level && (vocation === item.vocation || item.vocation < 0)) {
                                filterItems.push(item);
                            }
                        }
                    }
                }
                return filterItems;
            };

            /**
             * private
             */


            ClientPackSystem.prototype.useItemTemplate = function (hero, itemData, resId, count) {
                return this.socket_.emit("useItem", hero._id, resId, count);
            };

            ClientPackSystem.prototype.sellItemAndNotice = function (type, docId) {
                var sum;
                sum = this.sellItem(type, docId);
                if (sum > 0) {
                    return this.role_.prompt(strformat(packSystemPrompt.sellSucceed, sum));
                }
            };

            ClientPackSystem.prototype.sellItemList = function (itemList) {
                var sum;
                sum = ClientPackSystem.__super__.sellItemList.call(this, itemList);
                if (sum > 0) {
                    return this.role_.prompt(strformat(packSystemPrompt.sellSucceed, sum));
                }
            };

            ClientPackSystem.prototype.sortUnstackItems = function (type) {
                var items;
                if (this.checkType(type) && !this.allowStack(type)) {
                    items = this.innItems_[type];
                    return items.sort(function (item1, item2) {
                        var level;
                        level = item2.level - item1.level;
                        if (level === 0) {
                            return item1.resId - item2.resId;
                        }
                        return level;
                    });
                }
            };

            ClientPackSystem.prototype.sortAllUnstackItems = function () {
                var type, _i, _ref, _results;
                _results = [];
                for (type = _i = 0, _ref = PackSystem.typeMax; _i < _ref; type = _i += 1) {
                    _results.push(this.sortUnstackItems(type));
                }
                return _results;
            };

            ClientPackSystem.prototype.addItem = function (addObj) {
                this.addItemImpl(addObj);
                return this.emit(ClientPackSystem.eventNeedRefreshUI);
            };

            ClientPackSystem.prototype.addItemImpl = function (addObj, needSort) {
                var appItems, beginIndex, endIndex, existCount, itemData, resId, stackList, stackObj, type, unstackList, _ref;
                if (needSort == null) {
                    needSort = true;
                }
                if (_.isObject(addObj) && _.isNumber(addObj.resId) && _.isNumber(addObj.type)) {
                    resId = addObj.resId;
                    type = addObj.type;
                    itemData = this.findItemDataByResId(resId);
                    if (itemData === null) {
                        return;
                    }
                    if (_.isArray(addObj.temporaryList)) {
                        this.extendArrayItemData(addObj.temporaryList);
                        Array.prototype.push.apply(this.temporaryItems_, addObj.temporaryList);
                    }
                    if (_.isArray(addObj.unstackList) && !this.allowStack(type)) {
                        unstackList = addObj.unstackList;
                        this.extendArrayItemData(unstackList);
                        Array.prototype.push.apply(this.innItems_[type], unstackList);
                        this.changeGridCount(unstackList.length);
                        if (needSort) {
                            return this.sortUnstackItems(type);
                        }
                    } else if (_.isObject(addObj.stackObj)) {
                        stackObj = addObj.stackObj;
                        appItems = this.innItems_[type];
                        _ref = this.getStackItemCountAndRange(type, resId), existCount = _ref[0], beginIndex = _ref[1], endIndex = _ref[2];
                        if (_.isArray(stackObj.stackList) && stackObj.stackList.length > 0) {
                            stackList = stackObj.stackList;
                            this.extendArrayItemData(stackList);
                            if (beginIndex !== endIndex) {
                                appItems[endIndex - 1].count = itemData.stackNumber;
                            }
                            this.changeGridCount(stackList.length);
                            stackList.unshift(endIndex, 0);
                            return Array.prototype.splice.apply(appItems, stackList);
                        } else if (_.isNumber(stackObj.remainder) && stackObj.remainder > 0 && beginIndex !== endIndex) {
                            return appItems[endIndex - 1].count = stackObj.remainder;
                        }
                    }
                }
            };

            ClientPackSystem.prototype.pickItem = function (docId, itemObj) {
                if (_.isString(docId) && _.isObject(itemObj)) {
                    this.removeTemporaryItemByDocId(docId);
                    this.addItemImpl(itemObj);
                    this.emit(ClientPackSystem.eventNeedRefreshUI);
                    this.role_.setLockScreen(false);
                    return this.role_.prompt(packSystemPrompt.pickSucceed);
                }
            };

            ClientPackSystem.prototype.pickItems = function (sendItems) {
                var itemObj, _i, _len;
                if (_.isArray(sendItems)) {
                    this.clearTemporaryPack();
                    for (_i = 0, _len = sendItems.length; _i < _len; _i++) {
                        itemObj = sendItems[_i];
                        this.addItemImpl(itemObj, false);
                    }
                    this.sortAllUnstackItems();
                    this.emit(ClientPackSystem.eventNeedRefreshUI);
                    this.role_.setLockScreen(false);
                    return this.role_.prompt(packSystemPrompt.aTypePackSucceed);
                }
            };

            ClientPackSystem.prototype.addItems = function (items) {
                var itemObj, _i, _len;
                if (_.isArray(items) && items.length > 0) {
                    for (_i = 0, _len = items.length; _i < _len; _i++) {
                        itemObj = items[_i];
                        this.addItemImpl(itemObj, false);
                    }
                    this.sortAllUnstackItems();
                    return this.emit(ClientPackSystem.eventNeedRefreshUI);
                }
            };

            /**
             * stone
             */


            ClientPackSystem.prototype.preUplevelStone = function (resId, count) {
                var itemData, targetItemData;
                if (_.isNumber(resId) && _.isNumber(count) && count >= 2 && count % 2 === 0) {
                    itemData = dataMgr.find(dataKey.itemTable, resId);
                    if ((itemData != null) && this.canUplevelStone(itemData) && this.getStackItemCount(PackSystem.type.stone, resId) >= count) {
                        targetItemData = dataMgr.find(dataKey.itemTable, itemData.gemTargetId);
                        if (targetItemData != null) {
                            if (this.getCanInsertCount(targetItemData) >= parseInt(count / 2)) {
                                return this.socket_.emit("uplevelStone", resId, count);
                            } else {
                                return this.role_.prompt(packSystemPrompt.packFullStoneErr);
                            }
                        }
                    }
                }
            };

            ClientPackSystem.prototype.uplevelStone = function (resId, count, addObj) {
                var itemData;
                itemData = dataMgr.find(dataKey.itemTable, resId);
                if (itemData != null) {
                    this.removeStackItemByResId(itemData.resId, count, itemData.type, itemData.stackNumber);
                }
                this.addItemImpl(addObj);
                this.emit(ClientPackSystem.eventSucceedUplevelStone);
                return this.role_.prompt(packSystemPrompt.stoneUplevelSucceed);
            };

            /**
             * equip
             */


            ClientPackSystem.prototype.preComposeEquip = function (resId) {
                var itemData, itemTypes, materials;
                if (_.isNumber(resId)) {
                    itemTypes = PackSystem.type;
                    itemData = dataMgr.find(dataKey.itemTable, resId);
                    if ((itemData != null) && itemData.type === itemTypes.equip) {
                        materials = itemData.materials;
                        if (!this.materialEnough(materials)) {
                            return this.role_.prompt(packSystemPrompt.materialNotEnough);
                        } else if (itemData.level > this.role_.getLevel()) {
                            return this.role_.prompt(packSystemPrompt.composeLevelErr);
                        } else if (!this.role_.isEnough("silver", itemData.composeCost)) {
                            return this.role_.prompt(packSystemPrompt.composeSilverErr);
                        } else if (this.isPackFull()) {
                            return this.role_.prompt(packSystemPrompt.composePackFull);
                        } else {
                            return this.socket_.emit("composeEquip", resId);
                        }
                    }
                }
            };

            ClientPackSystem.prototype.composeEquip = function (addObj, composeCost, materials) {
                if (_.isObject(addObj) && _.isNumber(composeCost) && _.isArray(materials)) {
                    this.removeMaterials(materials);
                    this.addItemImpl(addObj);
                    this.role_.change("silver", -composeCost);
                    return this.role_.prompt(packSystemPrompt.composeSucceed);
                }
            };

            return ClientPackSystem;

        })(PackSystem);

        module.exports = ClientPackSystem;

    }).call(this);

});

require.define("/game/packSystem.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var EventEmitter, IdEquals, PackSystem, dataKey, dataMgr, existObject, findObject, packSystemPrompt, _,
        __hasProp = {}.hasOwnProperty,
            __extends = function (child, parent) {
                for (var key in parent) {
                    if (__hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            };

        _ = require("underscore");

        EventEmitter = require('events').EventEmitter;

        dataMgr = require("./dataMgr").dataMgr;

        dataKey = require("./dataMgr").dataKey;

        packSystemPrompt = require("gameData/prompt").packSystem;

        IdEquals = require("./utilities").IdEquals;

        existObject = require("../lib/assist").existObject;

        findObject = require("../lib/assist").findObject;

        /**
         * @module packSystem
         * @class PackSystem
         * @extends {EventEmitter}
         */


        PackSystem = (function (_super) {

            __extends(PackSystem, _super);

            /**
             * @property {Object} type 物品类型
             * @static
             */


            PackSystem.type = {
                common: 0,
                equip: 1,
                material: 2,
                stone: 3,
                treasure: 4,
                ornament: 5
            };

            PackSystem.typeMax = 6;

            PackSystem.moduleName = "PackSystem";

            /**
             * @property {Array} forbidStackList 禁止堆叠列表
             * @static
             */


            PackSystem.allowStackList = [0, 2, 3];

            PackSystem.temporaryGridCount = 500;

            /**
             * @public
             */


            function PackSystem(role_, socket_) {
                var items, type;
                this.role_ = role_;
                this.socket_ = socket_;
                items = this.role_.roleDb_.items;
                this.items_ = items;
                this.innItems_ = [];
                type = PackSystem.type;
                this.innItems_[type.common] = items.commonItems;
                this.innItems_[type.equip] = items.equipItems;
                this.innItems_[type.material] = items.materialItems;
                this.innItems_[type.stone] = items.stoneItems;
                this.innItems_[type.treasure] = items.treasureItems;
                this.innItems_[type.ornament] = items.ornamentItems;
                this.temporaryItems_ = items.temporaryItems;
            }

            /**
             * @method isFull
             * @return {Boolean} 包裹和临时包裹是否已满
             */


            PackSystem.prototype.isFull = function () {
                return this.isPackFull() && this.isTemporaryPackFull();
            };

            /**
             * @method getPackGridCount
             * @return {Number} 包裹格子数量
             */


            PackSystem.prototype.getPackGridCount = function () {
                return this.items_.gridCount;
            };

            PackSystem.prototype.getPackRemainGridCount = function () {
                return this.items_.gridMaxCount - this.items_.gridCount;
            };

            PackSystem.prototype.getPackGridMaxCount = function () {
                return this.items_.gridMaxCount;
            };

            /**
             * @method getTemporaryPackGridCount
             * @return {Number} 临时包裹剩余格子数量
             */


            PackSystem.prototype.getTemporaryPackGridCount = function () {
                return this.temporaryItems_.length;
            };

            /**
             * @method getTemporaryItems 
             * @return {Array} 获取临时包裹内的物品
             */


            PackSystem.prototype.getTemporaryItems = function () {
                return this.temporaryItems_;
            };

            /**
             * @method getItemsByType
             * @param  {Number} type 物品类型
             * @return {Array}  根据类型获取物品
             */


            PackSystem.prototype.getItemsByType = function (type) {
                var items;
                items = null;
                if (this.checkType(type)) {
                    items = this.innItems_[type];
                }
                return items;
            };

            /**
             * @method useItem
             * @description 使用物品
             * @param  {String} heroDocId 英雄Id
             * @param  {Number} resId     物品资源Id
             * @param  {Number} count     物品数量
             */


            PackSystem.prototype.useItem = function (heroDocId, resId, count) {
                var hero, itemData;
                if (count == null) {
                    count = 1;
                }
                if ((_.isString(heroDocId)) && (_.isNumber(resId)) && (_.isNumber(count))) {
                    itemData = this.findItemDataByResId(resId);
                    if (itemData === null) {
                        return;
                    }
                    hero = this.role_.getHeroSystem().getHero(heroDocId);
                    if (itemData === null || hero === null) {
                        return;
                    }
                    if (this.canUse(hero, count, itemData)) {
                        return this.useItemTemplate(hero, itemData, resId, count);
                    }
                }
            };

            PackSystem.prototype.canUse = function (hero, count, itemData) {
                var itemCount, type;
                type = itemData.type;
                if (type === void 0 || type !== 0) {
                    return false;
                }
                itemCount = this.getUnstackItemCount(type, itemData.resId);
                if (itemCount < count) {
                    this.role_.prompt(packSystemPrompt.countLimit);
                    return false;
                }
                if ((itemData.nUse != null) && (itemData.nUse === 1)) {
                    this.role_.prompt(packSystemPrompt.nUse);
                    return false;
                }
                if (hero.level < itemData.level) {
                    this.role_.prompt(packSystemPrompt.levelLimit);
                    return false;
                }
                if (IdEquals(this.role_.getRoleId(), hero._id) && (itemData.useTarget !== 0 && itemData.useTarget !== 1)) {
                    this.role_.prompt(packSystemPrompt.targetError);
                    return false;
                }
                if (!IdEquals(this.role_.getRoleId(), hero._id) && (itemData.useTarget !== 0 && itemData.useTarget !== 2)) {
                    this.role_.prompt(packSystemPrompt.targetError);
                    return false;
                }
                return true;
            };

            PackSystem.prototype.pushEquipDb = function (equipDb) {
                this.innItems_[PackSystem.type.equip].push(equipDb);
                return this.changeGridCount(1);
            };

            PackSystem.prototype.pushEquipDbs = function () {
                var equip, equips;
                equip = PackSystem.type.equip;
                equips = this.innItems_[equip];
                equips.push.apply(equips, arguments);
                return this.changeGridCount(arguments.length);
            };

            PackSystem.prototype.existItemByResId = function (table, resId) {
                var beginIndex, endIndex, resIdObj, result;
                resIdObj = {
                    resId: resId
                };
                result = true;
                beginIndex = _.sortedIndex(table, resIdObj, function (iter) {
                    return iter.resId;
                });
                resIdObj.resId += 1;
                endIndex = _.sortedIndex(table, resIdObj, function (iter) {
                    return iter.resId;
                });
                if (beginIndex === endIndex) {
                    result = false;
                }
                return [result, beginIndex, endIndex];
            };

            PackSystem.prototype.existItem = function (type, itemId) {
                var items;
                items = this.innItems_[type];
                if (items != null) {
                    return existObject(items, itemId, "_id", IdEquals);
                }
                return false;
            };

            PackSystem.prototype.findItem = function (type, itemId) {
                var item, items;
                items = this.innItems_[type];
                item = null;
                if (items != null) {
                    item = findObject(items, itemId, "_id", IdEquals);
                }
                return item;
            };

            PackSystem.prototype.removeStackItemByResId = function (resId, count, type, stackNumber) {
                var appItems, beginIndex, canRemove, endIndex, existCount, oldLength, remainCount, remainGrids, remainder, removeGrids, _ref;
                canRemove = false;
                if (this.allowStack(type) && count > 0) {
                    appItems = this.innItems_[type];
                    _ref = this.getStackItemCountAndRange(type, resId), existCount = _ref[0], beginIndex = _ref[1], endIndex = _ref[2];
                    oldLength = endIndex - beginIndex;
                    if (existCount >= count) {
                        canRemove = true;
                        remainCount = existCount - count;
                        if (remainCount !== 0) {
                            remainGrids = Math.ceil(remainCount / stackNumber);
                            remainder = remainCount % stackNumber;
                            if (remainder === 0) {
                                remainder = stackNumber;
                            }
                            removeGrids = oldLength - remainGrids;
                            if (removeGrids !== 0) {
                                appItems.splice(beginIndex, removeGrids);
                                this.changeGridCount(-removeGrids);
                            }
                            appItems[beginIndex + remainGrids - 1].count = remainder;
                        } else {
                            appItems.splice(beginIndex, oldLength);
                            this.changeGridCount(-oldLength);
                        }
                    }
                }
                return canRemove;
            };

            PackSystem.prototype.getPickItemNeedGrids = function (itemDb) {
                var itemData, needGrids;
                needGrids = 0;
                if (itemDb != null) {
                    if (!this.allowStack(itemDb.type)) {
                        needGrids = itemDb.count;
                    } else {
                        itemData = this.findItemDataByResId(itemDb.resId);
                        if (itemData != null) {
                            needGrids = Math.ceil(itemDb.count / itemData.stackNumber);
                        }
                    }
                }
                return needGrids;
            };

            PackSystem.prototype.tempItemsToSet = function () {
                var item, items, resId, sepItem, _i, _len, _ref;
                items = {};
                _ref = this.temporaryItems_;
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    item = _ref[_i];
                    resId = item.resId;
                    sepItem = items[resId];
                    if (sepItem != null) {
                        sepItem.count += item.count;
                    } else {
                        items[resId] = {
                            resId: resId,
                            type: item.type,
                            count: item.count
                        };
                    }
                }
                return items;
            };

            PackSystem.prototype.canPickItems = function (itemSet) {
                var itemDb, needGrids, resId;
                if (this.temporaryItems_.length !== 0) {
                    needGrids = 0;
                    for (resId in itemSet) {
                        itemDb = itemSet[resId];
                        needGrids += this.getPickItemNeedGrids(itemDb);
                    }
                    return this.getPackRemainGridCount() >= needGrids;
                }
                return false;
            };

            PackSystem.prototype.canPickItem = function (itemDb) {
                if (_.isString(itemDb)) {
                    itemDb = this.findItemDb(this.temporaryItems_, itemDb);
                }
                if (itemDb != null) {
                    return this.getPackRemainGridCount() >= this.getPickItemNeedGrids(itemDb);
                }
                return false;
            };

            /**
             * @method getStackItemCount
             * @description 获取某个堆叠物品的总数
             * @param  {Number} type  物品类型
             * @param  {Number} resId 物品资源Id
             * @return {Number}       物品总数
             */


            PackSystem.prototype.getStackItemCount = function (type, resId) {
                var count;
                count = this.getStackItemCountAndRange(type, resId)[0];
                return count;
            };

            PackSystem.prototype.getStackItemCountAndRange = function (type, resId) {
                var appItems, beginIndex, count, endIndex, i, result, _i, _ref;
                count = 0;
                appItems = this.innItems_[type];
                _ref = this.existItemByResId(appItems, resId), result = _ref[0], beginIndex = _ref[1], endIndex = _ref[2];
                if (result) {
                    for (i = _i = beginIndex; _i < endIndex; i = _i += 1) {
                        count += appItems[i].count;
                    }
                }
                return [count, beginIndex, endIndex];
            };

            PackSystem.prototype.getCanInsertCount = function (itemData) {
                var count, stackNumber;
                stackNumber = itemData.stackNumber;
                count = this.getStackItemCount(itemData.type, itemData.resId);
                if (count !== 0) {
                    count = stackNumber - count % stackNumber;
                }
                return this.getPackRemainGridCount() * itemData.stackNumber + count;
            };

            /**
             * stone
             */


            PackSystem.prototype.getUplevelStoneMax = function (resId) {
                var stoneType;
                stoneType = PackSystem.type.stone;
                return parseInt((this.getStackItemCount(stoneType, resId)) / 2);
            };

            PackSystem.prototype.canUplevelStone = function (itemData) {
                return itemData.gemTargetId != null;
            };

            /**
             * equip
             */


            PackSystem.prototype.materialEnough = function (materials) {
                var material, materialType, result, _i, _len;
                result = false;
                if (_.isArray(materials) && materials.length === 2) {
                    result = true;
                    materialType = PackSystem.type.material;
                    for (_i = 0, _len = materials.length; _i < _len; _i++) {
                        material = materials[_i];
                        if (this.getStackItemCount(materialType, material.itemId) < material.count) {
                            result = false;
                            break;
                        }
                    }
                }
                return result;
            };

            PackSystem.prototype.getComposeEquipCount = function (materials) {
                var count, counts, index, material, materialType, _i, _len;
                count = 0;
                if (_.isArray(materials) && materials.length === 2) {
                    materialType = PackSystem.type.material;
                    counts = [];
                    for (index = _i = 0, _len = materials.length; _i < _len; index = ++_i) {
                        material = materials[index];
                        counts[index] = this.getStackItemCount(materialType, material.itemId) / material.count;
                    }
                    count = _.min(counts);
                }
                return count;
            };

            PackSystem.prototype.removeMaterials = function (materials) {
                var itemData, material, _i, _len, _results;
                if (_.isArray(materials) && materials.length === 2) {
                    _results = [];
                    for (_i = 0, _len = materials.length; _i < _len; _i++) {
                        material = materials[_i];
                        itemData = dataMgr.find(dataKey.itemTable, material.itemId);
                        if (itemData != null) {
                            _results.push(this.removeStackItemByResId(material.itemId, material.count, itemData.type, itemData.stackNumber));
                        } else {
                            _results.push(void 0);
                        }
                    }
                    return _results;
                }
            };

            /**
             * @protected
             */


            PackSystem.prototype.removeItemByDocId = function (type, docId) {
                var appItems, index, result;
                result = false;
                if (this.checkType(type)) {
                    appItems = this.innItems_[type];
                    index = this.indexOf(appItems, docId);
                    if (index !== -1) {
                        this.spliceItem(appItems, index);
                        result = true;
                    }
                }
                return result;
            };

            PackSystem.prototype.spliceItem = function (table, index) {
                table.splice(index, 1);
                return this.changeGridCount(-1);
            };

            PackSystem.prototype.removeTemporaryItemByDocId = function (docId) {
                var removeIndex;
                removeIndex = this.indexOf(this.temporaryItems_, docId);
                if (removeIndex !== -1) {
                    return this.temporaryItems_.splice(removeIndex, 1);
                }
            };

            PackSystem.prototype.sellItem = function (type, docId) {
                var appItems, index, itemData, itemDb, sum, _ref;
                sum = 0;
                if (this.checkType(type)) {
                    appItems = this.innItems_[type];
                    _ref = this.findItemDbAndIndex(appItems, docId), itemDb = _ref[0], index = _ref[1];
                    if (itemDb != null) {
                        itemData = this.findItemDataByResId(itemDb.resId);
                        if ((itemData != null) && _.isNumber(itemData.price) && (itemData.nSell === void 0 || itemData.nSell === 0)) {
                            if (_.isNumber(itemDb.count)) {
                                sum = itemData.price * itemDb.count;
                            } else {
                                sum = itemData.price;
                            }
                            this.role_.changeSilver(sum);
                            this.spliceItem(appItems, index);
                        }
                    }
                }
                return sum;
            };

            PackSystem.prototype.sellItemList = function (itemList) {
                var obj, sum, _i, _len;
                sum = 0;
                if (_.isArray(itemList)) {
                    for (_i = 0, _len = itemList.length; _i < _len; _i++) {
                        obj = itemList[_i];
                        if ((_.isNumber(obj.type)) && _.isString(obj.docId)) {
                            sum += this.sellItem(obj.type, obj.docId);
                        }
                    }
                }
                return sum;
            };

            /**
             * @private
             */


            PackSystem.prototype.checkItemData = function (data) {
                var itemData, type;
                if (_.isObject(data && _.isNumber(data.resId))) {
                    itemData = this.findItemByDataMgr(data.resId);
                    if (itemData != null) {
                        type = itemData.type;
                        if (_.isNumber(type)) {
                            return [true, type];
                        }
                    }
                }
                return [false, null];
            };

            PackSystem.prototype.allowStack = function (type) {
                return _.contains(PackSystem.allowStackList, type);
            };

            PackSystem.prototype.findItemDataByResId = function (resId) {
                return dataMgr.find(dataKey.itemTable, resId);
            };

            PackSystem.prototype.findItemDbAndDataByDocId = function (type, docId) {
                var appItems, itemData, itemDb;
                itemData = null;
                if (this.checkType(type)) {
                    appItems = this.innItems_[type];
                    itemDb = this.findItemDb(appItems, docId);
                    if (itemDb != null) {
                        itemData = this.findItemDataByResId(itemDb.resId);
                    }
                }
                return [itemDb, itemData];
            };

            PackSystem.prototype.findItemDbByDocId = function (type, docId) {
                var appItems, itemDb;
                itemDb = null;
                appItems = this.innItems_[type];
                if (appItems != null) {
                    itemDb = this.findItemDb(appItems, docId);
                }
                return itemDb;
            };

            /**
             * @method isPackFull
             * @return {Boolean} 包裹是否已满
             */


            PackSystem.prototype.isPackFull = function () {
                return this.items_.gridCount >= this.items_.gridMaxCount;
            };

            /**
             * @method isTemporaryPackFull
             * @return {Boolean} 临时包裹是否已满
             */


            PackSystem.prototype.isTemporaryPackFull = function () {
                return this.temporaryItems_.length >= PackSystem.temporaryGridCount;
            };

            PackSystem.prototype.changeGridCount = function (number) {
                this.items_.gridCount += number;
                if (this.items_.gridCount > this.items_.gridMaxCount) {
                    this.items_.gridCount = this.items_.gridMaxCount;
                }
                if (this.items_.gridCount < 0) {
                    return this.items_.gridCount = 0;
                }
            };

            PackSystem.prototype.setGridCount = function (number) {
                return this.items_.gridCount = number;
            };

            PackSystem.prototype.clearPack = function (type) {
                var appItems, _i, _len, _ref;
                if (_.isNumber(type)) {
                    if (type >= 0 && type < PackSystem.typeMax) {
                        appItems = this.innItems_[type];
                        this.changeGridCount(-appItems.length);
                        return appItems.splice(0, appItems.length);
                    }
                } else {
                    _ref = this.innItems_;
                    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                        appItems = _ref[_i];
                        appItems.splice(0, appItems.length);
                    }
                    return this.items_.gridCount = 0;
                }
            };

            PackSystem.prototype.clearTemporaryPack = function () {
                return this.temporaryItems_.splice(0, this.temporaryItems_.length);
            };

            PackSystem.prototype.checkType = function (type) {
                return type >= 0 && type < PackSystem.typeMax;
            };

            PackSystem.prototype.indexOf = function (array, id) {
                var index, itemIndex, itemObj, _i, _len;
                index = -1;
                for (itemIndex = _i = 0, _len = array.length; _i < _len; itemIndex = ++_i) {
                    itemObj = array[itemIndex];
                    if (IdEquals(itemObj._id, id)) {
                        index = itemIndex;
                    }
                }
                return index;
            };

            PackSystem.prototype.findItemDb = function (array, id) {
                var resObj;
                resObj = this.findItemDbAndIndex(array, id)[0];
                return resObj;
            };

            PackSystem.prototype.findItemDbAndIndex = function (array, id) {
                var index, obj, resIndex, resObj, _i, _len;
                resObj = null;
                resIndex = -1;
                for (index = _i = 0, _len = array.length; _i < _len; index = ++_i) {
                    obj = array[index];
                    if (IdEquals(obj._id, id)) {
                        resObj = obj;
                        resIndex = index;
                        break;
                    }
                }
                return [resObj, resIndex];
            };

            return PackSystem;

        })(EventEmitter);

        module.exports = PackSystem;

    }).call(this);

});

require.define("gameData/prompt.json", function (require, module, exports, __dirname, __filename, process, global) {
    module.exports = ﻿ {
        "role": {
            "selectSkill": "技能切换成功",
            "nameError": "输入的名字无效",
            "nExist": "查无此人",
            "targetNotExist": "目标不在线",
            "forbidChat": "对方屏蔽你的聊天",
            "fightMonster": "{0}成功击杀{1}"
        },
        "roleDb": {
            "blueSoul": "蓝魂",
            "purpleSoul": "紫魂",
            "goldSoul": "金魂",
            "orangeSoul": "橙魂"
        },
        "fightObject": {
            "physicsAttack": "物理攻击",
            "physicsDefense": "物理防御",
            "strategyAttack": "法术攻击",
            "strategyDefense": "法术防御",
            "life": "生命",
            "speed": "速度"
        },
        "packSystem": {
            "levelLimit": "等级不够无法使用",
            "targetError": "使用目标错误",
            "countLimit": "物品数量不足无法使用",
            "sellError": "该物品不能出售",
            "sellSucceed": "出售成功，获得：{0}银币",
            "expTargetError": "主将不能使用经验卡",
            "expUse": "经验值+{0}",
            "openBox": "恭喜你，获得'{0}'x{1}",
            "silverCard": "获得{0}银币",
            "aTypePackFail": "包裹已满,一键入包失败!",
            "aTypePackSucceed": "一键入包成功",
            "pickSucceed": "物品拾取成功",
            "pickError": "包裹已满,拾取失败",
            "packFullStoneErr": "包裹已满,请先清理包裹再进行合成宝石",
            "stoneUplevelSucceed": "宝石合成成功",
            "materialNotEnough": "材料不足,无法合成装备",
            "composeSilverErr": "合成金钱不足,无法合成装备",
            "composeLevelErr": "等级不够,无法合成装备",
            "composePackFull": "包裹已满,无法合成装备",
            "composeSucceed": "成功合成装备"
        },
        "heroSystem": {
            "roleAddLevel": "{0} 升到了 {1} 级。",
            "heroAddLevel": "{0} 升到了 {1} 级。",
            "useExpCardError": "武将经验值满，不能使用经验卡。",
            "unloadAllEquipError": "无东西可卸载",
            "unloadAllEquipError1": "包裹已满,无法卸载全部装备",
            "unloadAllEquipSucceed": "全部卸载装备成功",
            "unloadEquipError": "包裹已满,无法卸载装备",
            "unloadEquipSucceed": "卸载装备成功",
            "changeEquipError": "换装失败",
            "changeEquipSucceed": "换装成功",
            "levelError": "等级不够无法装备",
            "vocationError": "职业不匹配",
            "typeError": "装备类型不匹配",
            "rmHeroError": "包裹无法装下卸载的装备",
            "rmHeroReturn": "解聘副将返还{0}{1}个",
            "randAttrsNotEnoughSilver": "没有足够的银币进行洗练",
            "randAttrsNotEnoughGold": "没有足够的金币进行定向洗练",
            "randAttrsSucceed": "洗练成功",
            "stoneEmpty": "没有孔镶嵌宝石",
            "stoneFull": "宝石孔已满,无法继续镶嵌",
            "stoneLoad": "镶嵌宝石成功",
            "stoneSame": "无法镶嵌相同类型的宝石",
            "stoneUnload": "卸载宝石成功",
            "stoneItemFullErr": "包裹已满,无法卸载宝石"
        },
        "heroStarSystem": {
            "notEnoughPotential": "潜能不足,无法将星",
            "heroStarSucceed": "成功将星"
        },
        "taskSystem": {
            "接受任务": "接受任务",
            "完成任务": "完成任务"
        },
        "positionSystem": {
            "positionFull": "出战英雄数量达到限制",
            "changeSucceed": "换位成功",
            "removeSucceed": "移除成功"
        },
        "emailSystem": {
            "sendError": "无效的发送邮件",
            "rmEmailSucceed": "删除邮件成功",
            "saveEmailSucceed": "保存邮件成功",
            "subjectEmpty": "请添加主题",
            "maxSubject": "主题最多10个字符",
            "detailsEmpty": "请添加内容",
            "maxDetails": "主题最多140个字符",
            "existBlack": "对方在你的黑名单中,无法发送",
            "oppositeExistBlack": "对方屏蔽你的邮件,无法发送",
            "sendSucceed": "发送邮件成功",
            "receiveEmail": "你有一封新邮件",
            "sendSelf": "无法给自己发送邮件"
        },
        "barSystem": {
            "notEnoughSilver": "银币不足无法对酒",
            "notEnoughSoul": "魂魄不够无法购买武将",
            "notEnoughGold": "金币不足,无法必胜",
            "notEnoughLevel": "等级不足,无法购买",
            "heroFull": "武将已满,无法进行招聘",
            "existHero": "你已拥有此武将,无法再次招聘",
            "broadcastBuy": "{0} 招聘了 [{1}]为自己副将",
            "buySucceed": "成功购买武将",
            "fistSucceed": "与{0}对酒成功获得{1}将魂",
            "fistFail": "与{0}对酒失败获得{1}银币",
            "fistIndex": "第{0}局对酒:"
        },
        "friendSystem": {
            "existFriendError": "好友已经在好友列表中,无需添加",
            "existBlack": "对方在你的屏蔽列表里是否添加为好友?",
            "nameError": "你输入的用户名无效,无法添加",
            "alreadyExistBlack": "对方已经在黑名单列表中,无需添加",
            "existFriend": "对方在你的好友列表里,是否屏蔽?",
            "friendMax": "到达了好友上限,请先移除再进行添加",
            "addFriendSucceed": "添加角色成功",
            "addBlackSucceed": "添加黑名单成功",
            "rmFriendSucceed": "移除好友成功",
            "rmBlackSucceed": "移除黑名单成功",
            "addSelfFriend": "无法添加自己为好友",
            "addSelfBlack": "无法添加自己为黑名单"
        },
        "宝石系统": {
            "放入宝石": "宝石数量不足",
            "合成成功": "合成成功",
            "镶嵌同类型宝石": "不能镶嵌同类型的多个宝石",
            "镶嵌成功": "镶嵌成功",
            "拆宝石": "拆卸成功"
        }
    };

});

require.define("/node_modules/strformat/package.json", function (require, module, exports, __dirname, __filename, process, global) {
    module.exports = {
        "main": "./strformat.js"
    }
});

require.define("/node_modules/strformat/strformat.js", function (require, module, exports, __dirname, __filename, process, global) {
    /*
     * Copyright (c) 2012 Frank Hellwig
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to
     * deal in the Software without restriction, including without limitation the
     * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
     * sell copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
     * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
     * IN THE SOFTWARE.
     */

    // Matches '{{', '}}', and '{<token>}' where <token> is one or more
    // word characters (letter, number, or underscore).
    var RE = /\{\{|\}\}|\{([^\}]+)\}/g;

    // Gets a property from an object by string.
    function getProperty(o, s) {
        s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
        s = s.replace(/^\./, ''); // strip a leading dot
        var a = s.split('.');
        while (a.length) {
            var n = a.shift();
            if (n in o) {
                o = o[n];
            } else {
                return;
            }
        }
        return o;
    }

    /**
     * Formats the specified string by replacing placeholders in the string with
     * replacement values from the function arguments. Placeholders are specified
     * with curly braces.
     *
     * The arguments can be a list of values, an array, or an object. For a list of
     * values or an array, numeric placeholders are used. For an object, property
     * name placeholders are used.
     *
     * Placeholders are escaped by doubling them (e.g., {{0}}). Any placeholder not
     * matching an argument is left alone.
     *
     * strformat('Error {0}: {1}', 404, 'Not Found');
     *      Returns: 'Error 404: Not Found' (uses argument position placeholders)
     *
     * strformat('{0}, {1}, and {2}', ['Red', 'Green', 'Blue']);
     *      Returns: 'Red, Green, and Blue' (uses array index placeholders)
     *
     * strformat('Hi {first} {last}', {first: 'John', last: 'Doe'});
     *      Returns: 'Hi John Doe' (uses object property name placeholders)
     */
    function strformat(str, args) {
        args = Array.prototype.slice.call(arguments, 1);
        if (args.length < 1) {
            return str; // nothing to replace
        } else if ((args.length < 2) && (typeof args[0] === 'object')) {
            args = args[0]; // handle a single array or object
        }
        return str.replace(RE, function (m, n) {
            if (m == '{{') {
                return '{';
            }
            if (m == '}}') {
                return '}';
            }
            var val = getProperty(args, n);
            return (typeof val === 'undefined') ? m : val;
        });
    }

    module.exports = strformat;

});

require.define("/game/clientPositionSystem.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var ClientPositionSystem, OnArrRemoteCall, PositionSystem, Prompt, attache, emitEvent, _,
        __hasProp = {}.hasOwnProperty,
            __extends = function (child, parent) {
                for (var key in parent) {
                    if (__hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            };

        attache = require("attache.js");

        PositionSystem = require("./positionSystem");

        emitEvent = require("./utilities").emitEvent;

        OnArrRemoteCall = require("./utilities").OnArrRemoteCall;

        Prompt = require("gameData/prompt").positionSystem;

        _ = require("underscore");

        ClientPositionSystem = (function (_super) {

            __extends(ClientPositionSystem, _super);

            ClientPositionSystem.eventChangeHeroPosition = "changeHeroPosition";

            ClientPositionSystem.eventRemoveHero = "removeHero";

            function ClientPositionSystem(role_, socket_) {
                ClientPositionSystem.__super__.constructor.call(this, role_, socket_);
            }

            ClientPositionSystem.prototype.init = function () {
                var _this = this;
                ClientPositionSystem.__super__.init.call(this);
                OnArrRemoteCall(this, PositionSystem.positionFunc, this.socket_, PositionSystem.moduleName);
                attache.after(this, "changeHeroPosition", (function () {
                    emitEvent(_this, ClientPositionSystem.eventChangeHeroPosition, arguments);
                    return _this.role_.prompt(Prompt.changeSucceed);
                }), true);
                return attache.after(this, "removeHero", (function () {
                    emitEvent(_this, ClientPositionSystem.eventRemoveHero, arguments);
                    return _this.role_.prompt(Prompt.removeSucceed);
                }), true);
            };

            ClientPositionSystem.prototype.preChangeHeroPosition = function (docId, index) {
                var sourceIndex;
                if (!_.isString(docId)) {
                    return;
                }
                sourceIndex = this.getIndex(docId);
                if (this.canChangeHeroPosition(sourceIndex, index)) {
                    return this.socket_.emit("changeHeroPosition", docId, index);
                } else {
                    return this.role_.prompt(Prompt.positionFull);
                }
            };

            ClientPositionSystem.prototype.preRemoveHero = function (docId) {
                return this.socket_.emit("removeHero", docId);
            };

            return ClientPositionSystem;

        })(PositionSystem);

        module.exports = ClientPositionSystem;
    }).call(this);
});

require.define("/game/positionSystem.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var EventEmitter, IdEquals, PositionSystem, SetValue, _,
        __hasProp = {}.hasOwnProperty,
            __extends = function (child, parent) {
                for (var key in parent) {
                    if (__hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            };

        _ = require("underscore");

        IdEquals = require("./utilities").IdEquals;

        SetValue = require("./utilities").SetValue;

        EventEmitter = require('events').EventEmitter;

        PositionSystem = (function (_super) {

            __extends(PositionSystem, _super);

            PositionSystem.moduleName = "PositionSystem";

            PositionSystem.positionCount = 5;

            PositionSystem.positionFunc = ["changeHeroPosition", "removeHero"];

            function PositionSystem(role_, socket_) {
                this.role_ = role_;
                this.socket_ = socket_;
                this.currentCount_ = 0;
                this.positions_ = this.role_.roleDb_.positions;
                this.heros_ = [];
            }

            PositionSystem.prototype.init = function () {
                var hero, posIndex, position, _i, _len, _ref, _results;
                _ref = this.positions_;
                _results = [];
                for (posIndex = _i = 0, _len = _ref.length; _i < _len; posIndex = ++_i) {
                    position = _ref[posIndex];
                    if (position != null) {
                        ++this.currentCount_;
                        hero = this.role_.getHeroSystem().getHeroObject(position);
                        if (hero != null) {
                            _results.push(this.heros_[posIndex] = hero);
                        } else {
                            _results.push(void 0);
                        }
                    } else {
                        _results.push(void 0);
                    }
                }
                return _results;
            };

            PositionSystem.prototype.getHeros = function () {
                return this.heros_;
            };

            PositionSystem.prototype.getCurrentCount = function () {
                return this.currentCount_;
            };

            PositionSystem.prototype.isFightingState = function (docId) {
                var position, _i, _len, _ref;
                _ref = this.positions_;
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    position = _ref[_i];
                    if ((position != null) && IdEquals(position, docId)) {
                        return true;
                    }
                }
                return false;
            };

            PositionSystem.prototype.isHerosMax = function () {
                return this.currentCount_ >= PositionSystem.positionCount;
            };

            PositionSystem.prototype.canChangeHeroPosition = function (sourceIndex, targetIndex) {
                return _.isNumber(targetIndex) && targetIndex >= 0 && targetIndex <= 6 && (this.currentCount_ < PositionSystem.positionCount || (this.positions_[targetIndex] != null) || (this.positions_[sourceIndex] != null));
            };

            PositionSystem.prototype.changeHeroPosition = function (docId, targetIndex) {
                var hero, indexPosition, result, sourceIndex;
                result = false;
                if (!_.isString(docId)) {
                    return result;
                }
                sourceIndex = this.getIndex(docId);
                if (this.canChangeHeroPosition(sourceIndex, targetIndex)) {
                    hero = this.role_.getHero(docId);
                    if (hero != null) {
                        indexPosition = this.getIndexToPosition(targetIndex);
                        if ((indexPosition != null) && hero.position === indexPosition && sourceIndex !== targetIndex) {
                            result = true;
                            if ((this.positions_[targetIndex] != null) && sourceIndex !== -1) {
                                this.swapHero(sourceIndex, targetIndex);
                            } else {
                                if (sourceIndex === -1 && !this.positions_[targetIndex]) {
                                    ++this.currentCount_;
                                } else if (this.positions_[sourceIndex] != null) {
                                    this.setValue(sourceIndex, null);
                                }
                                this.setValue(targetIndex, hero._id);
                            }
                        }
                    }
                }
                return result;
            };

            PositionSystem.prototype.swapHero = function (sourceIndex, targetIndex) {
                var tempHero, tempPos;
                tempPos = this.positions_[sourceIndex];
                this.positions_[sourceIndex] = this.positions_[targetIndex];
                this.positions_[targetIndex] = tempPos;
                tempHero = this.heros_[sourceIndex];
                this.heros_[sourceIndex] = this.heros_[targetIndex];
                return this.heros_[targetIndex] = this.heros_[sourceIndex];
            };

            PositionSystem.prototype.removeHero = function (docId) {
                var index, position, result, _i, _len, _ref;
                result = false;
                if (_.isString(docId) && !this.role_.getHeroSystem().isMainHero(docId)) {
                    _ref = this.positions_;
                    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
                        position = _ref[index];
                        if ((position != null) && IdEquals(position, docId)) {
                            this.cancelIndexValue(index);
                            result = true;
                            break;
                        }
                    }
                }
                return result;
            };

            PositionSystem.prototype.bindRemoveHeroEvent = function (index) {
                var hero, heroIndex;
                if (_.isNumber(index)) {
                    hero = this.role_.roleDb_.heroTable[index];
                    if (hero != null) {
                        heroIndex = this.getIndex(hero._id);
                        if (heroIndex !== -1) {
                            return this.cancelIndexValue(heroIndex);
                        }
                    }
                }
            };

            PositionSystem.prototype.getIndex = function (docId) {
                var i, index, position, _i, _len, _ref;
                index = -1;
                _ref = this.positions_;
                for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
                    position = _ref[i];
                    if ((position != null) && IdEquals(position, docId)) {
                        index = i;
                        break;
                    }
                }
                return index;
            };

            PositionSystem.prototype.cancelIndexValue = function (index) {
                if (this.positions_[index] != null) {
                    this.setValue(index, null);
                    return --this.currentCount_;
                }
            };

            PositionSystem.prototype.setValue = function (index, heroId) {
                var hero;
                SetValue(this.positions_, index, heroId);
                if (heroId != null) {
                    hero = this.role_.getHeroSystem().getHeroObject(heroId);
                    if (hero != null) {
                        return this.heros_[index] = hero;
                    }
                } else {
                    return this.heros_[index] = null;
                }
            };

            PositionSystem.prototype.getIndexToPosition = function (index) {
                var position;
                position = null;
                if (index === 0) {
                    position = 0;
                } else if (index > 0 && index <= 3) {
                    position = 1;
                } else if (index > 3 && index <= 6) {
                    position = 2;
                }
                return position;
            };

            return PositionSystem;

        })(EventEmitter);
        module.exports = PositionSystem;
    }).call(this);
});

require.define("/game/clientHeroSystem.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var ClientHeroSystem, HeroSystem, OnArrRemoteCall, OnRemoteCall, attache, dataKey, dataMgr, fightObjectPrompt, heroSystemPrompt, prompt, randAttrsGold, roleDbPrompt, strformat, _,
        __hasProp = {}.hasOwnProperty,
            __extends = function (child, parent) {
                for (var key in parent) {
                    if (__hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            };

        _ = require("underscore");

        HeroSystem = require("./heroSystem");

        OnRemoteCall = require("./utilities").OnRemoteCall;

        OnArrRemoteCall = require("./utilities").OnArrRemoteCall;

        attache = require("attache.js");

        prompt = require("gameData/prompt");

        heroSystemPrompt = prompt.heroSystem;

        roleDbPrompt = prompt.roleDb;

        fightObjectPrompt = prompt.fightObject;

        strformat = require("strformat");

        dataMgr = require("./dataMgr").dataMgr;

        dataKey = require("./dataMgr").dataKey;

        randAttrsGold = require("gameData/gameConfig").randAttrsGold;

        ClientHeroSystem = (function (_super) {

            __extends(ClientHeroSystem, _super);

            ClientHeroSystem.eventRefreshHeroList = "refreshHeroList";

            ClientHeroSystem.eventRefreshEquipList = "refreshEquipList";

            ClientHeroSystem.eventRandAttsResult = "randAttrsResult";

            ClientHeroSystem.eventConfirmRandAttrs = "confirmRandAttrs";

            ClientHeroSystem.eventSetStone = "setStone";

            ClientHeroSystem.eventUnsetStone = "unsetStone";

            function ClientHeroSystem(role_, socket_) {
                ClientHeroSystem.__super__.constructor.call(this, role_, socket_);
                this.oldFightAttr_ = {};
            }

            ClientHeroSystem.prototype.init = function () {
                var equipFuncTable, moduleName, remoteCalls,
                _this = this;
                ClientHeroSystem.__super__.init.call(this);
                moduleName = HeroSystem.moduleName;
                remoteCalls = HeroSystem.remoteCalls;
                OnRemoteCall(this, "addExp", this.socket_, moduleName);
                OnRemoteCall(this, "addHeroImpl", this.socket_, moduleName);
                OnArrRemoteCall(this, remoteCalls, this.socket_, moduleName);
                attache.after(this, "addHeroImpl", function () {
                    return _this.emit(ClientHeroSystem.eventRefreshHeroList);
                });
                equipFuncTable = ["unloadHeroAllEquip", "unloadHeroEquip", "changeHeroEquip"];
                attache.before(this, equipFuncTable, function (docId) {
                    var heroOject;
                    heroOject = _this.getHeroObject(docId);
                    if (heroOject != null) {
                        return _this.oldFightAttr_ = _.pick(heroOject.getFightAttr(), "physicsAttack", "physicsDefense", "strategyAttack", "strategyDefense", "speed", "life");
                    }
                });
                attache.after(this, equipFuncTable, function (docId) {
                    var changeValue, fightAttr, heroOject, key, str, value, _ref, _results;
                    _this.packSystem_.sortUnstackItems(1);
                    heroOject = _this.getHeroObject(docId);
                    if (heroOject != null) {
                        fightAttr = heroOject.getFightAttr();
                        _ref = _this.oldFightAttr_;
                        _results = [];
                        for (key in _ref) {
                            value = _ref[key];
                            changeValue = fightAttr[key] - value;
                            if (changeValue > 0) {
                                str = fightObjectPrompt[key] + " +" + changeValue;
                                _results.push(_this.role_.prompt(str));
                            } else if (changeValue < 0) {
                                str = fightObjectPrompt[key] + " " + changeValue;
                                _results.push(_this.role_.prompt(str));
                            } else {
                                _results.push(void 0);
                            }
                        }
                        return _results;
                    }
                });
                attache.after(this, equipFuncTable, (function () {
                    return _this.emit(ClientHeroSystem.eventRefreshEquipList);
                }), true);
                attache.after(this, "removeHeroByDocId", (function () {
                    return _this.emit(ClientHeroSystem.eventRefreshHeroList);
                }), true);
                attache.after(this, "confirmRandAttrs", (function (randAttrsObject) {
                    _this.emit(ClientHeroSystem.eventConfirmRandAttrs, randAttrsObject);
                    return _this.role_.prompt(heroSystemPrompt.randAttrsSucceed);
                }), true);
                attache.after(this, "setStone", (function (itemId, resId, heroId) {
                    _this.emit(ClientHeroSystem.eventSetStone, itemId, resId, heroId);
                    return _this.role_.prompt(heroSystemPrompt.stoneLoad);
                }), true);
                this.socket_.on("randAttsResult", function (randAttrsObject) {
                    return _this.emit(ClientHeroSystem.eventRandAttsResult, randAttrsObject);
                });
                this.socket_.on("unsetStone", _.bind(this.unsetStone, this));
                this.initHerosEquipTable();
                return this.on("rmHero", function (soulType, returnSoul) {
                    return _this.role_.prompt(strformat(heroSystemPrompt.rmHeroReturn, roleDbPrompt[soulType], returnSoul));
                });
            };

            ClientHeroSystem.prototype.initHerosEquipTable = function () {
                var equip, equipIndex, equipTable, hero, itemData, itemTable, _i, _len, _ref, _results;
                itemTable = dataKey.itemTable;
                _ref = this.heros_;
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    hero = _ref[_i];
                    equipTable = hero.equipTable;
                    _results.push((function () {
                        var _j, _len1, _results1;
                        _results1 = [];
                        for (equipIndex = _j = 0, _len1 = equipTable.length; _j < _len1; equipIndex = ++_j) {
                            equip = equipTable[equipIndex];
                            if (equip != null) {
                                itemData = dataMgr.find(itemTable, equip.resId);
                                if (itemData != null) {
                                    _results1.push(equipTable[equipIndex] = _.extend(equip, itemData));
                                } else {
                                    _results1.push(void 0);
                                }
                            } else {
                                _results1.push(void 0);
                            }
                        }
                        return _results1;
                    })());
                }
                return _results;
            };

            ClientHeroSystem.prototype.preRemoveHeroByDocId = function (docId) {
                if (this.canUnloadAllEquip(docId)) {
                    return this.socket_.emit("removeHeroByDocId", docId);
                } else {
                    return this.role_.prompt(heroSystemPrompt.rmHeroError);
                }
            };

            ClientHeroSystem.prototype.preUnloadAllEquip = function (docId) {
                var hero;
                hero = this.getHero(docId);
                if ((hero != null) && this.getEquipCount(hero.equipTable) === 0) {
                    this.role_.prompt(heroSystemPrompt.unloadAllEquipError);
                    return;
                }
                if (!this.canUnloadAllEquip(docId)) {
                    this.role_.prompt(heroSystemPrompt.unloadAllEquipError1);
                    return;
                }
                return this.socket_.emit("unloadAllEquip", docId);
            };

            ClientHeroSystem.prototype.preUnloadEquip = function (docId, index) {
                if (_.isString(docId) && _.isNumber(index)) {
                    if (this.canUnloadEquip(docId, index)) {
                        return this.socket_.emit("unloadEquip", docId, index);
                    } else {
                        return this.role_.prompt(heroSystemPrompt.unloadEquipError);
                    }
                }
            };

            ClientHeroSystem.prototype.preChangeEquip = function (heroDocId, itemDocId) {
                var hero, itemData, itemDb, _ref;
                if (_.isString(itemDocId) && _.isString(heroDocId)) {
                    _ref = this.packSystem_.findItemDbAndDataByDocId(1, itemDocId), itemDb = _ref[0], itemData = _ref[1];
                    hero = this.getHero(heroDocId);
                    if ((itemDb != null) && (itemData != null) && (hero != null) && itemData.subType < HeroSystem.equipMax) {
                        if (hero.level < itemData.level) {
                            return this.role_.prompt(heroSystemPrompt.levelError);
                        } else if (itemData.vocation >= 0 && hero.vocation !== itemData.vocation) {
                            return this.role_.prompt(heroSystemPrompt.vocationError);
                        } else if (itemData.type !== 1) {
                            return this.role_.prompt(heroSystemPrompt.typeError);
                        } else {
                            return this.socket_.emit("changeEquip", heroDocId, itemDocId);
                        }
                    }
                }
            };

            ClientHeroSystem.prototype.preRandAttrs = function (itemId, heroId) {
                var itemData, itemDb;
                itemDb = this.findItem(itemId, heroId)[0];
                if (itemDb != null) {
                    itemData = dataMgr.find(dataKey.itemTable, itemDb.resId);
                    if ((itemData != null) && itemData.addAttrs > 0) {
                        if (!this.role_.isEnough("silver", this.getRandAttrsSilver(itemData.level, itemData.quality))) {
                            return this.role_.prompt(heroSystemPrompt.randAttrsNotEnoughSilver);
                        } else {
                            return this.socket_.emit("randAttrs", itemId, heroId);
                        }
                    }
                }
            };

            ClientHeroSystem.prototype.preAppointRandAttrs = function (itemId, heroId) {
                var itemData, itemDb;
                itemDb = this.findItem(itemId, heroId)[0];
                if (itemDb != null) {
                    itemData = dataMgr.find(dataKey.itemTable, itemDb.resId);
                    if ((itemData != null) && itemData.addAttrs > 0) {
                        if (!this.role_.isEnough("gold", randAttrsGold)) {
                            return this.role_.prompt(heroSystemPrompt.randAttrsNotEnoughGold);
                        } else {
                            return this.socket_.emit("appointRandAttrs", itemId, heroId);
                        }
                    }
                }
            };

            ClientHeroSystem.prototype.preConfirmRandAttrs = function () {
                return this.socket_.emit("confirmRandAttrs");
            };

            ClientHeroSystem.prototype.preSetStone = function (itemId, resId, heroId) {
                var itemData, itemDb, stoneTable;
                itemDb = this.findItem(itemId, heroId)[0];
                if (itemDb != null) {
                    stoneTable = itemDb.stoneTable;
                    itemData = dataMgr.find(dataKey.itemTable, resId);
                    if (itemData != null) {
                        if (itemData.gemCount === 0) {
                            return this.role_.prompt(heroSystemPrompt.stoneEmpty);
                        } else if (stoneTable.length >= itemData.gemCount) {
                            return this.role_.prompt(heroSystemPrompt.stoneFull);
                        } else if (this.haveSameStone(stoneTable, itemData.attrName)) {
                            return this.role_.prompt(heroSystemPrompt.stoneSame);
                        } else {
                            return this.socket_.emit("setStone", itemId, resId, heroId);
                        }
                    }
                }
            };

            ClientHeroSystem.prototype.preUnsetStone = function (itemId, index, heroId) {
                var itemData, itemDb, stoneAttr, stoneTable;
                itemDb = this.findItem(itemId, heroId)[0];
                if ((itemDb != null) && _.isNumber(index)) {
                    stoneTable = itemDb.stoneTable;
                    if (index < stoneTable.length) {
                        stoneAttr = stoneTable[index];
                        itemData = dataMgr.find(dataKey.itemTable, stoneAttr.resId);
                        if (itemData != null) {
                            if (this.packSystem_.getCanInsertCount(itemData > 0)) {
                                return this.socket_.emit("unsetStone", itemId, index, heroId);
                            } else {
                                return this.role_.prompt(heroSystemPrompt.stoneItemFullErr);
                            }
                        }
                    }
                }
            };

            ClientHeroSystem.prototype.unsetStone = function (itemId, index, addObj, heroId) {
                var heroObject, itemDb, stoneAttr, stoneTable, _ref;
                _ref = this.findItem(itemId, heroId), itemDb = _ref[0], heroObject = _ref[1];
                if ((itemDb != null) && _.isNumber(index)) {
                    stoneTable = itemDb.stoneTable;
                    if (index < stoneTable.length) {
                        stoneAttr = stoneTable[index];
                        this.packSystem_.addItemImpl(addObj);
                        if (addObj.remainCount === 0) {
                            if (heroObject != null) {
                                heroObject.changeExtraAttr(stoneAttr.attrName, -stoneAttr.attrValue);
                            }
                            stoneTable.splice(index, 1);
                            this.emit(ClientHeroSystem.eventUnsetStone, itemId, heroId);
                            return this.role_.prompt(heroSystemPrompt.stoneUnload);
                        }
                    }
                }
            };

            ClientHeroSystem.prototype.addHeroImpl = function (heroDb) {
                if (!this.existHeroByResId(heroDb.resId)) {
                    return ClientHeroSystem.__super__.addHeroImpl.call(this, heroDb);
                }
            };

            ClientHeroSystem.prototype.addLevel = function (hero) {
                ClientHeroSystem.__super__.addLevel.call(this, hero);
                if (this.isMainHero(hero._id)) {
                    return this.role_.prompt(strformat(heroSystemPrompt.roleAddLevel, hero.name, hero.level));
                }
            };

            return ClientHeroSystem;

        })(HeroSystem);
        module.exports = ClientHeroSystem;
    }).call(this);
});

require.define("/game/heroSystem.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var EventEmitter, Hero, HeroSystem, IdEquals, RoleHero, SetValue, assist, dataKey, dataMgr, equipType, existObject, findObject, indexOfObject, _,
        __hasProp = {}.hasOwnProperty,
            __extends = function (child, parent) {
                for (var key in parent) {
                    if (__hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            };

        _ = require("underscore");

        assist = require("../lib/assist");

        indexOfObject = assist.indexOfObject;

        findObject = assist.findObject;

        existObject = assist.existObject;

        EventEmitter = require("events").EventEmitter;

        IdEquals = require("./utilities").IdEquals;

        SetValue = require("./utilities").SetValue;

        dataMgr = require("./dataMgr").dataMgr;

        dataKey = require("./dataMgr").dataKey;

        Hero = require("./hero").Hero;

        RoleHero = require("./hero").RoleHero;

        equipType = require("./packSystem").type.equip;

        HeroSystem = (function (_super) {

            __extends(HeroSystem, _super);

            HeroSystem.herosMax = 10;

            HeroSystem.moduleName = "HeroSystem";

            HeroSystem.eventRemoveHero = "removeHero";

            HeroSystem.eventExpChange = "expChange";

            HeroSystem.eventLevelChange = "levelChange";

            HeroSystem.equipMax = 6;

            HeroSystem.remoteCalls = ["removeHeroByDocId", "unloadHeroAllEquip", "unloadHeroEquip", "changeHeroEquip", "confirmRandAttrs", "setStone"];

            HeroSystem.maxLevel = 150;

            function HeroSystem(role_, socket_) {
                var hero, herosLength, i, roleDb, roleHero, _i;
                this.role_ = role_;
                this.socket_ = socket_;
                roleDb = this.role_.roleDb_;
                this.heros_ = roleDb.heroTable;
                this.packSystem_ = null;
                this.heroObjects_ = [];
                roleHero = new RoleHero(this.heros_[0], roleDb.starMap);
                roleHero.init();
                this.heroObjects_.push(roleHero);
                herosLength = this.heros_.length;
                for (i = _i = 1; _i < herosLength; i = _i += 1) {
                    hero = new Hero(this.heros_[i]);
                    hero.init();
                    this.heroObjects_.push(hero);
                }
            }

            HeroSystem.prototype.init = function () {
                return this.packSystem_ = this.role_.getPackSystem();
            };

            HeroSystem.prototype.isHeroTableFull = function () {
                return this.heros_.length >= HeroSystem.herosMax;
            };

            HeroSystem.prototype.getMainHero = function () {
                return this.heros_[0];
            };

            HeroSystem.prototype.getMainHeroObject = function () {
                return this.heroObjects_[0];
            };

            HeroSystem.prototype.getMainHeroResId = function () {
                return this.getMainHero().resId;
            };

            HeroSystem.prototype.getRoleEquipResId = function () {
                var equip, equipTable, index, resIds, _i, _len;
                equipTable = this.heros_[0].equipTable;
                resIds = [];
                for (index = _i = 0, _len = equipTable.length; _i < _len; index = ++_i) {
                    equip = equipTable[index];
                    if (equip != null) {
                        resIds[index] = equip.resId;
                    }
                }
                return resIds;
            };

            HeroSystem.prototype.getHeroResIds = function (hero) {
                var equip, equipTable, index, resIds, _i, _len;
                resIds = [];
                if (_.isString(hero)) {
                    hero = this.getHero(hero);
                }
                if (hero != null) {
                    equipTable = hero.equipTable;
                    for (index = _i = 0, _len = equipTable.length; _i < _len; index = ++_i) {
                        equip = equipTable[index];
                        if (equip != null) {
                            resIds[index] = equip.resId;
                        }
                    }
                }
                return resIds;
            };

            HeroSystem.prototype.getLevelExp = function (level) {
                var exp, levelObj;
                exp = 0;
                levelObj = dataMgr.find(dataKey.expTable, level);
                if (levelObj != null) {
                    exp = levelObj.exp;
                }
                return exp;
            };

            HeroSystem.prototype.addExp = function (heroObject, exp) {
                var heroDb, oldLevel, result;
                if (_.isString(heroObject)) {
                    heroObject = this.getHeroObject(heroObject);
                }
                heroDb = heroObject.heroDb_;
                oldLevel = heroDb.level;
                result = this.addExpImple(heroDb, exp);
                this.emit(HeroSystem.eventExpChange, heroDb._id, heroDb.experience);
                if (heroDb.level !== oldLevel) {
                    heroObject.updateResultAttr();
                }
                return result;
            };

            HeroSystem.prototype.addExpImple = function (hero, exp) {
                var heroLevel, levelExp, levelObj, remainExp, result;
                result = 0;
                heroLevel = hero.level;
                levelObj = dataMgr.find(dataKey.expTable, heroLevel);
                if (levelObj === null) {
                    return result;
                }
                levelExp = levelObj.exp;
                if ((hero != null) && _.isNumber(exp) && exp > 0 && _.isNumber(levelExp) && hero.experience < levelExp && heroLevel <= HeroSystem.maxLevel) {
                    hero.experience += exp;
                    if (hero.experience >= levelExp) {
                        if (!this.isMainHero(hero._id) && heroLevel + 1 > this.getMainHero().level) {
                            hero.experience = levelExp;
                            result = -1;
                            return result;
                        }
                        remainExp = hero.experience - levelExp;
                        if (heroLevel < HeroSystem.maxLevel) {
                            hero.experience = 0;
                            this.addLevel(hero);
                            if (remainExp > 0) {
                                this.addExpImple(hero, remainExp);
                            }
                        } else {
                            hero.experience = levelExp;
                        }
                    }
                }
                return result;
            };

            HeroSystem.prototype.changeHerosExp = function (exp) {
                var hero, heros, positionSystem, _i, _len, _results;
                positionSystem = this.role_.getPositionSystem();
                heros = positionSystem.getHeros();
                if (_.isArray(heros)) {
                    _results = [];
                    for (_i = 0, _len = heros.length; _i < _len; _i++) {
                        hero = heros[_i];
                        if (hero != null) {
                            _results.push(this.addExp(hero, exp));
                        } else {
                            _results.push(void 0);
                        }
                    }
                    return _results;
                }
            };

            HeroSystem.prototype.addLevel = function (hero) {
                this.emit(HeroSystem.eventLevelChange, hero._id);
                return hero.level += 1;
            };

            HeroSystem.prototype.getFightPosition = function (docId) {
                var hero, position;
                position = null;
                hero = this.getHero(docId);
                if (hero != null) {
                    position = hero.position;
                }
                return position;
            };

            HeroSystem.prototype.isMainHero = function (docId) {
                return IdEquals(this.heros_[0]._id, docId);
            };

            HeroSystem.prototype.isMainHeroByResId = function (resId) {
                return this.heros_[0].resId === resId;
            };

            HeroSystem.prototype.getHeroIndex = function (docId) {
                var hero, heroIndex, index, _i, _len, _ref;
                index = -1;
                _ref = this.heros_;
                for (heroIndex = _i = 0, _len = _ref.length; _i < _len; heroIndex = ++_i) {
                    hero = _ref[heroIndex];
                    if (IdEquals(hero._id, docId)) {
                        index = heroIndex;
                        break;
                    }
                }
                return index;
            };

            HeroSystem.prototype.existHero = function (docId) {
                return this.getHeroIndex(docId !== -1);
            };

            HeroSystem.prototype.getHeroByIndex = function (index) {
                return this.heros_[index];
            };

            HeroSystem.prototype.existHeroByResId = function (resId) {
                return indexOfObject(this.heros_, resId, "resId") !== -1;
            };

            HeroSystem.prototype.getHeroIndexByResId = function (resId) {
                return indexOfObject(this.heros_, resId, "resId");
            };

            HeroSystem.prototype.addHeroImpl = function (heroDb) {
                this.heros_.push(heroDb);
                heroDb = this.heros_[this.heros_.length - 1];
                return this.heroObjects_.push(new Hero(heroDb));
            };

            HeroSystem.prototype.removeHeroByDocId = function (docId) {
                var hero, heroData, result, returnSoul, rmIndex, soulType;
                result = false;
                if (_.isString(docId) && !this.isMainHero(docId)) {
                    hero = this.getHero(docId);
                    heroData = dataMgr.find(dataKey.heroTable, hero.resId);
                    if ((hero != null) && (heroData != null) && this.canUnloadAllEquip(hero)) {
                        rmIndex = this.getHeroIndex(docId);
                        if (rmIndex !== -1) {
                            soulType = heroData.soulType;
                            returnSoul = parseInt(heroData.needSoul * 0.4);
                            this.role_.change(soulType, returnSoul);
                            this.emit("rmHero", soulType, returnSoul);
                            this.unloadAllEquip(hero.equipTable);
                            result = this.removeHeroByIndex(rmIndex);
                        }
                    }
                }
                return result;
            };

            HeroSystem.prototype.removeHeroByIndex = function (index) {
                var result;
                result = false;
                if (index >= 0 && index < this.heros_.length) {
                    this.emit(HeroSystem.eventRemoveHero, index);
                    this.heros_.splice(index, 1);
                    this.heroObjects_.splice(index, 1);
                    result = true;
                }
                return result;
            };

            HeroSystem.prototype.unloadAllEquip = function (equips) {
                var equip, _i, _len;
                for (_i = 0, _len = equips.length; _i < _len; _i++) {
                    equip = equips[_i];
                    if (equip != null) {
                        this.packSystem_.pushEquipDb(equip);
                    }
                }
                return equips.splice(0, equips.length);
            };

            HeroSystem.prototype.canUnloadAllEquip = function (hero) {
                var equipCount, remainCount;
                if (_.isString(hero)) {
                    hero = this.getHero(hero);
                }
                if (hero != null) {
                    remainCount = this.packSystem_.getPackRemainGridCount();
                    equipCount = this.getEquipCount(hero.equipTable);
                    return remainCount >= equipCount;
                }
                return false;
            };

            HeroSystem.prototype.unloadHeroAllEquip = function (docId) {
                var hero, heroDb, result;
                result = false;
                if (_.isString(docId)) {
                    hero = this.getHeroObject(docId);
                    if (hero != null) {
                        heroDb = hero.heroDb_;
                        if (this.canUnloadAllEquip(heroDb)) {
                            hero.unloadAllEquips();
                            this.unloadAllEquip(heroDb.equipTable);
                            result = true;
                        }
                    }
                }
                return result;
            };

            HeroSystem.prototype.unloadEquip = function (equips, index) {
                this.packSystem_.pushEquipDb(equips[index]);
                return SetValue(equips, index, void 0);
            };

            HeroSystem.prototype.canUnloadEquip = function (hero, index) {
                if (_.isString(hero)) {
                    hero = this.getHero(hero);
                }
                if ((hero != null) && (hero.equipTable[index] != null)) {
                    return this.packSystem_.getPackRemainGridCount() >= 1;
                }
                return false;
            };

            HeroSystem.prototype.unloadHeroEquip = function (docId, index) {
                var equipTable, hero, heroDb_, result;
                result = false;
                if (_.isString(docId) && _.isNumber(index)) {
                    hero = this.getHeroObject(docId);
                    heroDb_ = hero.heroDb_;
                    if (this.canUnloadEquip(heroDb_, index)) {
                        result = true;
                        equipTable = heroDb_.equipTable;
                        hero.reduceEquipAttr(equipTable[index]);
                        this.unloadEquip(equipTable, index);
                    }
                }
                return result;
            };

            HeroSystem.prototype.canChangeEquip = function (itemDb, itemData, hero) {
                if ((itemDb != null) && (itemData != null) && (hero != null)) {
                    return hero.level >= itemData.level && (hero.vocation === itemData.vocation || itemData.vocation < 0) && itemData.subType < HeroSystem.equipMax && itemData.type === 1;
                }
                return false;
            };

            HeroSystem.prototype.changeEquip = function (itemDb, index, hero) {
                var equipTable;
                equipTable = hero.heroDb_.equipTable;
                this.packSystem_.removeItemByDocId(1, itemDb._id);
                if (equipTable[index] != null) {
                    hero.reduceEquipAttr(equipTable[index]);
                    this.packSystem_.pushEquipDb(equipTable[index]);
                }
                SetValue(equipTable, index, itemDb);
                return hero.addEquipAttr(itemDb);
            };

            HeroSystem.prototype.changeHeroEquip = function (heroDocId, itemDocId) {
                var hero, itemData, itemDb, result, _ref;
                result = false;
                if (_.isString(itemDocId) && _.isString(heroDocId)) {
                    _ref = this.packSystem_.findItemDbAndDataByDocId(1, itemDocId), itemDb = _ref[0], itemData = _ref[1];
                    hero = this.getHeroObject(heroDocId);
                    if (this.canChangeEquip(itemDb, itemData, hero.heroDb_)) {
                        this.changeEquip(itemDb, itemData.subType, hero);
                        result = true;
                    }
                }
                return result;
            };

            HeroSystem.prototype.getHero = function (docId) {
                return findObject(this.heros_, docId, "_id", IdEquals);
            };

            HeroSystem.prototype.getHeroObject = function (docId) {
                return findObject(this.heroObjects_, docId, "_id", IdEquals);
            };

            HeroSystem.prototype.getEquipCount = function (equips) {
                var count, equip, _i, _len;
                count = 0;
                for (_i = 0, _len = equips.length; _i < _len; _i++) {
                    equip = equips[_i];
                    if (equip != null) {
                        ++count;
                    }
                }
                return count;
            };

            HeroSystem.prototype.existItem = function (itemId, heroId) {
                var heroObject, result;
                result = false;
                if (_.isString(itemId)) {
                    if (_.isString(heroId)) {
                        heroObject = this.getHeroObject(heroId);
                        if (heroObject != null) {
                            result = heroObject.existItem(itemId);
                        }
                    } else {
                        result = this.packSystem_.existItem(equipType, itemId);
                    }
                }
                return result;
            };

            HeroSystem.prototype.findItem = function (itemId, heroId) {
                var heroObject, itemDb;
                itemDb = null;
                if (_.isString(itemId)) {
                    if (_.isString(heroId)) {
                        heroObject = this.getHeroObject(heroId);
                        if (heroObject != null) {
                            itemDb = heroObject.findItem(itemId);
                        }
                    } else {
                        itemDb = this.packSystem_.findItem(equipType, itemId);
                    }
                }
                return [itemDb, heroObject];
            };

            HeroSystem.prototype.getRandAttrsSilver = function (level, quality) {
                return parseInt(Math.pow(level + quality * 5, 2) * 6);
            };

            HeroSystem.prototype.confirmRandAttrs = function (randAttrsObject) {
                var heroId, heroObject, itemDb, itemId, result;
                result = false;
                if (randAttrsObject != null) {
                    itemDb = null;
                    itemId = randAttrsObject.itemId;
                    heroId = randAttrsObject.heroId;
                    if (_.isString(itemId)) {
                        if (_.isString(heroId)) {
                            heroObject = this.getHeroObject(heroId);
                            if (heroObject != null) {
                                itemDb = heroObject.findItem(itemId);
                                if (itemDb != null) {
                                    heroObject.reduceExtraAttrGroup(itemDb.appendAttrs);
                                    heroObject.addExtraAttrGroup(randAttrsObject.properties);
                                }
                            }
                        } else {
                            itemDb = this.packSystem_.findItem(equipType, itemId);
                        }
                        if (itemDb != null) {
                            result = true;
                            itemDb.appendAttrs = randAttrsObject.properties;
                        }
                    }
                }
                return result;
            };

            HeroSystem.prototype.haveSameStone = function (stoneTable, attrName) {
                return existObject(stoneTable, attrName, "attrName");
            };

            HeroSystem.prototype.setStone = function (itemId, resId, heroId) {
                var attrName, attrValue, heroObject, itemData, itemDb, stoneTable, _ref;
                _ref = this.findItem(itemId, heroId), itemDb = _ref[0], heroObject = _ref[1];
                if (itemDb != null) {
                    stoneTable = itemDb.stoneTable;
                    itemData = dataMgr.find(dataKey.itemTable, resId);
                    if ((itemData != null) && !this.haveSameStone(stoneTable, itemData.attrName && itemData.gemCount > stoneTable.length && this.packSystem_.removeStackItemByResId(itemData.resId, 1, itemData.type, itemData.stackNumber))) {
                        attrName = itemData.attrName;
                        attrValue = itemData.attrValue;
                        itemDb.push({
                            resId: itemData.resId,
                            attrName: attrName,
                            attrValue: attrValue
                        });
                        if (heroObject != null) {
                            heroObject.changeExtraAttr(attrName, attrValue);
                        }
                        return true;
                    }
                }
                return false;
            };

            return HeroSystem;

        })(EventEmitter);
        module.exports = HeroSystem;
    }).call(this);
});

require.define("/game/hero.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var Hero, IdEquals, RoleHero, dataKey, dataMgr, fightValue, getBaseAttrValue, _,
        __hasProp = {}.hasOwnProperty,
            __extends = function (child, parent) {
                for (var key in parent) {
                    if (__hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            };

        _ = require("underscore");

        dataMgr = require("./dataMgr").dataMgr;

        dataKey = require("./dataMgr").dataKey;

        getBaseAttrValue = require("./fightMath").getBaseAttrValue;

        IdEquals = require("./utilities").IdEquals;

        fightValue = require("gameData/gameConfig").fightValue;

        Hero = (function () {

            function Hero(heroDb_) {
                this.heroDb_ = heroDb_;
                this.extraAttr_ = this.heroDb_.extraAttr;
                this.heroData_ = dataMgr.find(dataKey.heroTable, this.heroDb_.resId);
                this.baseResultAttr_ = _.clone(this.heroData_.baseAttr);
                this._id = this.heroDb_._id;
            }

            Hero.prototype.init = function () {
                return this.updateResultAttr();
            };

            Hero.prototype.updateResultAttr = function () {
                return this.calculateHeroDataAttr(this.heroData_.baseAttr, this.heroData_.baseRise);
            };

            Hero.prototype.calculateHeroDataAttr = function (baseAttr, baseRise) {
                var level, vocation;
                level = this.heroDb_.level;
                vocation = this.heroDb_.vocation;
                this.baseResultAttr_.power = getBaseAttrValue("power", level, vocation, baseAttr, baseRise);
                this.baseResultAttr_.wit = getBaseAttrValue("wit", level, vocation, baseAttr, baseRise);
                this.baseResultAttr_.quick = getBaseAttrValue("quick", level, vocation, baseAttr, baseRise);
                return this.baseResultAttr_.life = getBaseAttrValue("life", level, vocation, baseAttr, baseRise);
            };

            Hero.prototype.getFightAttr = function () {
                var fightAttr, key, life, power, quick, value, wit, _ref;
                fightAttr = _.clone(this.extraAttr_);
                _ref = this.baseResultAttr_;
                for (key in _ref) {
                    value = _ref[key];
                    fightAttr[key] += value;
                }
                power = fightAttr.power;
                fightAttr.power = parseInt(power + power * fightAttr.powerRate);
                wit = fightAttr.wit;
                fightAttr.wit = parseInt(wit + wit * fightAttr.witRate);
                quick = fightAttr.quick;
                fightAttr.quick = parseInt(quick + quick * fightAttr.quickRate);
                life = fightAttr.life;
                fightAttr.life = parseInt(life + fightAttr.life * fightAttr.lifeRate);
                fightAttr.physicsAttack += parseInt(power);
                fightAttr.physicsDefense += parseInt(power * 0.7);
                fightAttr.strategyAttack += parseInt(wit);
                fightAttr.strategyDefense += parseInt(wit * 0.7);
                fightAttr.speed = parseInt(fightAttr.speed + fightAttr.quick);
                return fightAttr;
            };

            Hero.prototype.getFightAttrEx = function () {
                var attack, attackPVE, attackType, fightAttr, result, results, sum, _i, _len;
                results = [];
                fightAttr = this.getFightAttr();
                results.push(fightAttr.speed / fightValue.speed);
                results.push(fightAttr.life / fightValue.life);
                attackType = this.heroDb_.attackType;
                if (attackType === 0 || attackType === 1) {
                    if (attackType === 0) {
                        attack = fightAttr.physicsAttack;
                        delete fightAttr.physicsAttack;
                        attackPVE = fightValue.physicsAttack;
                    } else if (attackType === 1) {
                        attack = fightAttr.strategyAttack;
                        delete fightAttr.strategyAttack;
                        attackPVE = fightValue.strategyAttack;
                    }
                    fightAttr.attack = attack;
                    results.push(attack / attackPVE);
                    results.push(attack * (100 - fightAttr.hit) / 100 * fightValue.hit / attackPVE);
                    results.push(attack * fightAttr.blast / 100 * fightValue.blast / attackPVE);
                    results.push(attack * fightAttr.miss / 100 * fightValue.miss / attackPVE);
                    results.push(attack * fightAttr.block / 100 * fightValue.block / attackPVE);
                }
                results.push(fightAttr.physicsDefense / fightValue.physicsDefense);
                results.push(fightAttr.strategyDefense / fightValue.strategyDefense);
                sum = 0;
                for (_i = 0, _len = results.length; _i < _len; _i++) {
                    result = results[_i];
                    sum += result;
                }
                fightAttr.sum = parseInt(sum);
                _.extend(fightAttr, this.heroData_.baseRise);
                return fightAttr;
            };

            Hero.prototype.getRedId = function () {
                return this.heroDb_.resId;
            };

            Hero.prototype.getHeroName = function () {
                return this.heroDb_.name;
            };

            Hero.prototype.getLevel = function () {
                return this.heroDb_.level;
            };

            Hero.prototype.getExperience = function () {
                return this.heroDb_.experience;
            };

            Hero.prototype.getVocation = function () {
                return this.heroDb_.vocation;
            };

            Hero.prototype.getQuality = function () {
                return this.heroDb_.quality;
            };

            Hero.prototype.getSkillId = function () {
                return this.heroDb_.skillId;
            };

            Hero.prototype.getPosition = function () {
                return this.heroDb_.position;
            };

            Hero.prototype.getAttackType = function () {
                return this.heroDb_.attackType;
            };

            Hero.prototype.getEquipTable = function () {
                return this.heroDb_.equipTable;
            };

            Hero.prototype.changeExtraAttr = function (key, value) {
                return this.extraAttr_[key] += value;
            };

            Hero.prototype.addExtraAttrGroup = function (attrs) {
                var key, value, _results;
                _results = [];
                for (key in attrs) {
                    value = attrs[key];
                    _results.push(this.extraAttr_[key] += value);
                }
                return _results;
            };

            Hero.prototype.reduceExtraAttrGroup = function (attrs) {
                var key, value, _results;
                _results = [];
                for (key in attrs) {
                    value = attrs[key];
                    _results.push(this.extraAttr_[key] -= value);
                }
                return _results;
            };

            Hero.prototype.addEquipAttr = function (itemDb) {
                var stone, _i, _len, _ref, _results;
                this.extraAttr_[itemDb.attrName] += itemDb.attrValue;
                this.addExtraAttrGroup(itemDb.appendAttrs);
                _ref = itemDb.stoneTable;
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    stone = _ref[_i];
                    _results.push(this.extraAttr_[stone.attrName] += stone.attrValue);
                }
                return _results;
            };

            Hero.prototype.reduceEquipAttr = function (itemDb) {
                var stone, _i, _len, _ref, _results;
                this.extraAttr_[itemDb.attrName] -= itemDb.attrValue;
                this.reduceExtraAttrGroup(itemDb.appendAttrs);
                _ref = itemDb.stoneTable;
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    stone = _ref[_i];
                    _results.push(this.extraAttr_[stone.attrName] -= stone.attrValue);
                }
                return _results;
            };

            Hero.prototype.unloadAllEquips = function () {
                var equip, equipTable, _i, _len, _results;
                equipTable = this.heroDb_.equipTable;
                _results = [];
                for (_i = 0, _len = equipTable.length; _i < _len; _i++) {
                    equip = equipTable[_i];
                    if (equip != null) {
                        _results.push(this.reduceEquipAttr(equip));
                    } else {
                        _results.push(void 0);
                    }
                }
                return _results;
            };

            Hero.prototype.existItem = function (itemId) {
                var equip, equipTable, _i, _len;
                equipTable = this.heroDb_.equipTable;
                for (_i = 0, _len = equipTable.length; _i < _len; _i++) {
                    equip = equipTable[_i];
                    if ((equip != null) && IdEquals(equip._id, itemId)) {
                        return true;
                    }
                }
                return false;
            };

            Hero.prototype.findItem = function (itemId) {
                var equip, equipTable, _i, _len;
                equipTable = this.heroDb_.equipTable;
                for (_i = 0, _len = equipTable.length; _i < _len; _i++) {
                    equip = equipTable[_i];
                    if ((equip != null) && IdEquals(equip._id, itemId)) {
                        return equip;
                    }
                }
                return null;
            };

            return Hero;

        })();

        RoleHero = (function (_super) {

            __extends(RoleHero, _super);

            function RoleHero(heroDb_, starMap_) {
                this.starMap_ = starMap_;
                RoleHero.__super__.constructor.call(this, heroDb_);
            }

            RoleHero.prototype.calculateHeroDataAttr = function (baseAttr, baseRise) {
                var key, value, _ref, _ref1;
                baseAttr = _.clone(baseAttr);
                baseRise = _.clone(baseRise);
                _ref = this.starMap_.baseAttr;
                for (key in _ref) {
                    value = _ref[key];
                    baseAttr[key] += value;
                }
                _ref1 = this.starMap_.baseRise;
                for (key in _ref1) {
                    value = _ref1[key];
                    baseRise[key] += value;
                }
                return RoleHero.__super__.calculateHeroDataAttr.call(this, baseAttr, baseRise);
            };

            return RoleHero;

        })(Hero);
        module.exports.Hero = Hero;
        module.exports.RoleHero = RoleHero;
    }).call(this);
});

require.define("/game/fightMath.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var heroTableConfig;

        heroTableConfig = require("gameData/heroTableConfig");

        module.exports.getBaseAttrValue = function (attr, level, vocation, baseAttr, baseRise) {
            return baseAttr[attr] + Math.pow(level, 2) * 0.075 * baseRise[attr + "Rise"] + level * heroTableConfig[vocation][attr];
        };
    }).call(this);
});

require.define("gameData/heroTableConfig.json", function (require, module, exports, __dirname, __filename, process, global) {
    module.exports = [{
        "power": 11.5,
        "wit": 8.6,
        "quick": 8.5,
        "life": 26.2
    }, {
        "power": 10,
        "wit": 10,
        "quick": 11.5,
        "life": 25
    }, {
        "power": 8.8,
        "wit": 11.5,
        "quick": 10,
        "life": 24.2
    }, {
        "power": 11.5,
        "wit": 10,
        "quick": 7,
        "life": 32
    }];
});

require.define("gameData/gameConfig.json", function (require, module, exports, __dirname, __filename, process, global) {
    module.exports = {
        "randAttrsGold": 5,
        "customsReward": {
            "giftRate": 20,
            "armyRate": 10,
            "expRate": 10,
            "silverRate": 10,
            "gift": 10,
            "army": 1
        },
        "fightValue": {
            "speed": 3,
            "life": 9.2,
            "physicsAttack": 1.81,
            "physicsDefense": 5,
            "strategyAttack": 2,
            "strategyDefense": 10,
            "hit": 0.2,
            "blast": 0.5,
            "miss": 0.2,
            "block": 0.5
        }
    };
});

require.define("/game/clientTaskSystem.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var ClientTaskSystem, OnArrRemoteCall, OnRemoteCall, RemoteCall, TaskNpc, TaskSystem, dataKey, dataMgr, _,
        __hasProp = {}.hasOwnProperty,
            __extends = function (child, parent) {
                for (var key in parent) {
                    if (__hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            };

        _ = require("underscore");

        TaskSystem = require("./taskSystem");

        OnArrRemoteCall = require("./utilities").OnArrRemoteCall;

        OnRemoteCall = require("./utilities").OnRemoteCall;

        dataMgr = require("./dataMgr").dataMgr;

        dataKey = require("./dataMgr").dataKey;

        RemoteCall = require("./utilities").RemoteCall;

        /**
         * @module taskSystem
         * @class  TaskNpc
         */


        TaskNpc = (function () {
            /**
             * @property {Object} [npcHeadStates] NPC头顶状态
             * @static
             * @type {[type]}
             */

            TaskNpc.npcHeadStates = {
                Done: 0,
                Acceptable: 1,
                Doing: 2
            };

            function TaskNpc() {
                this.options_ = [];
            }

            TaskNpc.prototype.insertOption = function (taskData, taskDb) {
                var insertIndex;
                if (taskDb == null) {
                    taskDb = null;
                }
                if (!taskData) {
                    return;
                }
                if (taskDb != null) {
                    if (taskDb.done) {
                        return this.options_.unshift({
                            taskData: taskData,
                            taskDb: taskDb
                        });
                    } else {
                        return this.options_.push({
                            taskData: taskData,
                            taskDb: taskDb
                        });
                    }
                } else {
                    insertIndex = this.getAcceptInsertIndex();
                    return this.options_.splice(insertIndex, 0, {
                        taskData: taskData
                    });
                }
            };

            TaskNpc.prototype.getAcceptInsertIndex = function () {
                var index, optIndex, option, taskDb, _i, _len, _ref;
                index = 0;
                _ref = this.options_;
                for (optIndex = _i = 0, _len = _ref.length; _i < _len; optIndex = ++_i) {
                    option = _ref[optIndex];
                    taskDb = option.taskDb;
                    if (!taskDb || taskDb.done === false) {
                        index = optIndex;
                    }
                }
                return index;
            };

            /**
             * @method findOptionById
             * @description 通过任务Id查找选项 
             * @param  {Number} taskId 任务Id
             * @return {Object} taskData: taskData,taskDb: taskDb
             */


            TaskNpc.prototype.findOptionById = function (taskId) {
                return this.options_[findIndexById(taskId)];
            };

            /**
             * @method findOptionByIndex
             * @description 通过选项索引查找选项
             * taskData是taskTable中的一行,taskDb在./dbFormat/role taskSchema
             * @param  {Number} index 选项索引
             * @return {Object} taskData: taskData,taskDb: taskDb
             */


            TaskNpc.prototype.findOptionByIndex = function (index) {
                return this.options_[index];
            };

            /**
             * @method findIndexById
             * @description 通过索引查找Id
             * @param  {Number} taskId 任务Id
             * @return {Number}        选项索引
             */


            TaskNpc.prototype.findIndexById = function (taskId) {
                var optIndex, option, taskData, _i, _len, _ref;
                _ref = this.options_;
                for (optIndex = _i = 0, _len = _ref.length; _i < _len; optIndex = ++_i) {
                    option = _ref[optIndex];
                    taskData = option.taskData;
                    if ((taskData != null) && taskData.resId === taskId) {
                        return optIndex;
                    }
                }
                return -1;
            };

            TaskNpc.prototype.removeOptionByTaskId = function (taskId) {
                var index;
                index = this.findIndexById(taskId);
                if (index !== -1) {
                    return this.options_.splice(index, 1);
                }
            };

            /**
             * @method getHeadState
             * @return {Number|null} 获取NPC的头顶状态
             */


            TaskNpc.prototype.getHeadState = function () {
                return this.getStateByIndex(0);
            };

            /**
             * @method getStateByIndex 
             * @param  {Number} index 选项索引
             * @return {Number|null}  获取NPC的头顶状态
             */


            TaskNpc.prototype.getStateByIndex = function (index) {
                var npcHeadStates, option, state;
                npcHeadStates = TaskNpc.npcHeadStates;
                state = null;
                option = this.options_[index];
                if (option != null) {
                    if (option.taskDb != null) {
                        if (option.taskDb.done) {
                            state = npcHeadStates.Done;
                        } else {
                            state = npcHeadStates.Doing;
                        }
                    } else {
                        state = npcHeadStates.Acceptable;
                    }
                }
                return state;
            };

            TaskNpc.prototype.updateDoneTask = function (taskId) {
                var index, option;
                index = this.findIndexById(taskId);
                if (index !== -1) {
                    option = this.options_[index];
                    if ((option != null) && (option.taskDb != null) && option.taskDb.done === true) {
                        this.options_.splice(index, 1);
                        return this.options_.unshift(option);
                    }
                }
            };

            return TaskNpc;

        })();

        /**
         * @module taskSystem
         * @class ClientTaskSystem
         * @extends TaskSystem
         */


        ClientTaskSystem = (function (_super) {

            __extends(ClientTaskSystem, _super);

            /**
             * @event eventNpcStateChange
             * @description npc状态改变
             * @param {Number} npcId 改变状态的NPCId
             */


            ClientTaskSystem.eventNpcStateChange = "npcStateChange";

            ClientTaskSystem.eventRefreshList = "refreshList";

            /**
             * @event eventPushTask
             * @description 新任务
             * @param {Object} taskObj
             */


            ClientTaskSystem.eventPushTask = "pushTask";

            /**
             * @event eventRemoveTask
             * @description 移除任务
             * @param {Number} taskId
             */


            ClientTaskSystem.eventRemoveTask = "removeTask";

            /**
             * @event eventPushAcceptableTask
             * @description 新可接任务
             * @param {Object} taskData 任务数据
             */


            ClientTaskSystem.eventPushAcceptableTask = "pushAcceptableTask";

            /**
             * @event eventRemoveAcceptableTask
             * @description 移除可接任务
             * @type {Number} taskId
             */


            ClientTaskSystem.eventRemoveAcceptableTask = "removeAcceptableTask";

            function ClientTaskSystem(role_, socket_) {
                ClientTaskSystem.__super__.constructor.call(this, role_, socket_);
                this.cliAccTasks_ = [];
                this.cliTasks_ = [];
                this.npcs_ = [];
                this.limitTasks_ = [];
            }

            ClientTaskSystem.prototype.init = function () {
                var moduleName, socket,
                _this = this;
                moduleName = TaskSystem.moduleName;
                socket = this.socket_;
                OnArrRemoteCall(this, TaskSystem.syncCalls, socket, moduleName);
                OnRemoteCall(this, "doneTaskImple", socket, moduleName);
                socket.on("progressChange", _.bind(this.progressChange, this));
                this.role_.getHeroSystem().on("levelChange", function (heroId) {
                    var deleteArray, deleteIndex, roleLevel, taskData, taskIndex, _i, _j, _len, _len1, _ref, _results;
                    if (_this.role_.getHeroSystem().isMainHero(heroId)) {
                        deleteArray = [];
                        roleLevel = _this.role_.getLevel();
                        _ref = _this.limitTasks_;
                        for (taskIndex = _i = 0, _len = _ref.length; _i < _len; taskIndex = ++_i) {
                            taskData = _ref[taskIndex];
                            if (roleLevel >= taskData.levelLimit) {
                                _this.pushAcceptableOptImple(taskData);
                                deleteArray.push(taskIndex);
                            }
                        }
                        if (deleteArray.length !== 0) {
                            _results = [];
                            for (_j = 0, _len1 = deleteArray.length; _j < _len1; _j++) {
                                deleteIndex = deleteArray[_j];
                                _results.push(_this.limitTasks_.splice(deleteIndex, 1));
                            }
                            return _results;
                        }
                    }
                });
                this.initAcceptableTasks();
                this.initTasks();
                this.initNpcs();
                return this.emit(ClientTaskSystem.eventRefreshList);
            };

            ClientTaskSystem.prototype.initAcceptableTasks = function () {
                var index, taskData, taskId, taskTableKey, _i, _len, _ref;
                taskTableKey = dataKey.taskTable;
                _ref = this.acceptableTasks_;
                for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
                    taskId = _ref[index];
                    taskData = dataMgr.find(taskTableKey, taskId);
                    this.cliAccTasks_[index] = taskData;
                }
            };

            ClientTaskSystem.prototype.initTasks = function () {
                var index, task, taskData, taskDb, taskTableKey, _i, _len, _ref;
                taskTableKey = dataKey.taskTable;
                _ref = this.tasks_;
                for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
                    taskDb = _ref[index];
                    taskData = dataMgr.find(taskTableKey, taskDb.taskId);
                    task = {
                        taskData: taskData,
                        taskDb: taskDb
                    };
                    this.cliTasks_[index] = task;
                }
            };

            ClientTaskSystem.prototype.initNpcs = function () {
                var endNpcId, taskData, taskObj, _i, _j, _len, _len1, _ref, _ref1, _results;
                _ref = this.cliAccTasks_;
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    taskData = _ref[_i];
                    if (taskData != null) {
                        this.pushAcceptableOpt(taskData);
                    }
                }
                _ref1 = this.cliTasks_;
                _results = [];
                for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                    taskObj = _ref1[_j];
                    taskData = taskObj.taskData;
                    endNpcId = taskObj.taskData.endNpcId;
                    if (_.isNumber(endNpcId)) {
                        this.npcs_[endNpcId] = this.npcs_[endNpcId] || new TaskNpc;
                        _results.push(this.npcs_[endNpcId].insertOption(taskData, taskObj.taskDb));
                    } else {
                        _results.push(void 0);
                    }
                }
                return _results;
            };

            ClientTaskSystem.prototype.progressChange = function (taskDb) {
                var task;
                task = this.findTask(taskDb.taskId);
                if (task != null) {
                    task.progress = taskDb.progress;
                    /**
                     * @event eventProgressChange
                     * @param {Object} taskDb ./dbFormat/role
                     */

                    return this.emit(TaskSystem.eventProgressChange, taskDb);
                }
            };

            /**
             * @method getNpcStates
             * @description 获取NPC状态 根据地图Id
             * @param  {Number} mapId 地图Id
             * @return {Array|null}  状态列表
             */


            ClientTaskSystem.prototype.getNpcStates = function (mapId) {
                var index, mapData, npc, npcId, npcIds, states, _i, _len;
                mapData = dataMgr.find(dataKey.mapTable, mapId);
                states = null;
                if (mapData != null) {
                    npcIds = mapData;
                    if ((_.isArray(npcIds)) && npcIds.length > 0) {
                        states = [];
                        for (index = _i = 0, _len = npcIds.length; _i < _len; index = ++_i) {
                            npcId = npcIds[index];
                            npc = this.npcs_[npcId];
                            if (npc != null) {
                                states[index] = npc.getState();
                            }
                        }
                    }
                }
                return states;
            };

            /**
             * @method getNpc
             * @param  {Number} npcId 
             * @return {Object<TaskNpc>} 获取任务NPC
             */


            ClientTaskSystem.prototype.getNpc = function (npcId) {
                return this.npcs_[npcId];
            };

            /**
             * @method getCliAccTasks
             * @return {Array<taskData>} 获取可接受任务列表
             */


            ClientTaskSystem.prototype.getCliAccTasks = function () {
                return this.cliAccTasks_;
            };

            /**
             * @method getCliTasks
             * @return {Array<Object<taskData,taskDb>>} 获取任务列表
             */


            ClientTaskSystem.prototype.getCliTasks = function () {
                return this.cliTasks_;
            };

            ClientTaskSystem.prototype.acceptTaskTemplate = function (taskData) {
                return this.socket_.emit("acceptTask", taskData.resId);
            };

            ClientTaskSystem.prototype.acceptTaskImple = function (taskDb) {
                var beginNpc, beginNpcId, endNpc, endNpcId, taskData, taskId;
                if (!this.existTask(taskDb.taskId)) {
                    ClientTaskSystem.__super__.acceptTaskImple.call(this, taskDb);
                    taskId = taskDb.taskId;
                    taskData = dataMgr.find(dataKey.taskTable, taskId);
                    this.removeCliAcceptableTaskById(taskId);
                    if (taskData != null) {
                        this.pushCliTask(taskData, taskDb);
                        beginNpcId = taskData.beginNpcId;
                        endNpcId = taskData.endNpcId;
                        beginNpc = this.npcs_[beginNpcId];
                        if (beginNpcId === endNpcId) {
                            beginNpc.removeOptionByTaskId(taskData.resId);
                            beginNpc.insertOption(taskData, taskDb);
                            this.emit(ClientTaskSystem.eventNpcStateChange, beginNpcId);
                        } else {
                            beginNpc.removeOptionByTaskId(taskData.resId);
                            this.emit(ClientTaskSystem.eventNpcStateChange, beginNpcId);
                            endNpc = this.npcs_[endNpcId];
                            if (endNpc === void 0) {
                                endNpc = new TaskNpc;
                                this.npcs_[endNpcId] = endNpc;
                            }
                            endNpc.insertOption(taskData, taskDb);
                            this.emit(ClientTaskSystem.eventNpcStateChange, endNpcId);
                        }
                    }
                    return this.emit(ClientTaskSystem.eventRefreshList);
                }
            };

            ClientTaskSystem.prototype.pushAcceptableTaskImple = function (taskId) {
                var taskData;
                if (!this.existAcceptableTask(taskId)) {
                    ClientTaskSystem.__super__.pushAcceptableTaskImple.call(this, taskId);
                    taskData = dataMgr.find(dataKey.taskTable, taskId);
                    if (taskData != null) {
                        this.pushAcceptableOpt(taskData);
                        this.pushCliAcceptableTask(taskData);
                        return this.emit(ClientTaskSystem.eventRefreshList);
                    }
                }
            };

            ClientTaskSystem.prototype.handOverTaskImple = function (taskId, triggerTaskIds) {
                var endNpc, endNpcId, taskData, taskTableKey, triggerTaskId, _i, _len;
                if (this.canHandOverTask(taskId)) {
                    ClientTaskSystem.__super__.handOverTaskImple.call(this, taskId, triggerTaskIds);
                    this.removeCliTaskById(taskId);
                    taskTableKey = dataKey.taskTable;
                    taskData = dataMgr.find(taskTableKey, taskId);
                    if (taskData != null) {
                        endNpcId = taskData.endNpcId;
                        endNpc = this.npcs_[endNpcId];
                        if (endNpc != null) {
                            endNpc.removeOptionByTaskId(taskId);
                            this.emit(ClientTaskSystem.eventNpcStateChange, endNpcId);
                        }
                    }
                    if ((_.isArray(triggerTaskIds)) && triggerTaskIds.length > 0) {
                        for (_i = 0, _len = triggerTaskIds.length; _i < _len; _i++) {
                            triggerTaskId = triggerTaskIds[_i];
                            taskData = dataMgr.find(taskTableKey, triggerTaskId);
                            if (taskData != null) {
                                this.pushAcceptableOpt(taskData);
                                this.pushCliAcceptableTask(taskData);
                            }
                        }
                    }
                    return this.emit(ClientTaskSystem.eventRefreshList);
                }
            };

            ClientTaskSystem.prototype.pushAcceptableOpt = function (taskData) {
                if (this.role_.getLevel() >= taskData.levelLimit) {
                    return this.pushAcceptableOptImple(taskData);
                } else {
                    return this.limitTasks_.push(taskData);
                }
            };

            ClientTaskSystem.prototype.pushAcceptableOptImple = function (taskData) {
                var beginNpcId;
                beginNpcId = taskData.beginNpcId;
                if (_.isNumber(beginNpcId)) {
                    this.npcs_[beginNpcId] = this.npcs_[beginNpcId] || new TaskNpc;
                    this.npcs_[beginNpcId].insertOption(taskData);
                    return this.emit(ClientTaskSystem.eventNpcStateChange, beginNpcId);
                }
            };

            ClientTaskSystem.prototype.pushCliAcceptableTask = function (taskData) {
                this.cliAccTasks_.push(taskData);
                return this.emit(ClientTaskSystem.eventPushAcceptableTask, taskData);
            };

            ClientTaskSystem.prototype.pushCliTask = function (taskData, taskDb) {
                var taskObj;
                taskObj = {
                    taskData: taskData,
                    taskDb: taskDb
                };
                this.cliTasks_.push(taskObj);
                return this.emit(ClientTaskSystem.eventPushTask, taskObj);
            };

            ClientTaskSystem.prototype.doneTaskImple = function (taskDb) {
                var endNpcId, task, taskData, taskId;
                if (taskDb != null) {
                    taskId = taskDb.taskId;
                    task = this.findTask(taskId);
                    if (task != null) {
                        task.done = true;
                        task.progress = taskDb.progress;
                        taskData = dataMgr.find(dataKey.taskTable, taskId);
                        if (taskData != null) {
                            endNpcId = taskData.endNpcId;
                            if (_.isNumber(endNpcId)) {
                                if (this.npcs_[endNpcId] != null) {
                                    this.npcs_[endNpcId].updateDoneTask(taskId);
                                    this.emit(ClientTaskSystem.eventNpcStateChange, endNpcId);
                                }
                            }
                        }
                        return this.emit(ClientTaskSystem.eventRefreshList);
                    }
                }
            };

            ClientTaskSystem.prototype.removeCliAcceptableTaskById = function (taskId) {
                var cliTaskData, index, _i, _len, _ref;
                _ref = this.cliAccTasks_;
                for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
                    cliTaskData = _ref[index];
                    if (cliTaskData.resId === taskId) {
                        this.cliAccTasks_.splice(index, 1);
                        this.emit(ClientTaskSystem.removeAcceptableTask, cliTaskData.resId);
                        return;
                    }
                }
            };

            ClientTaskSystem.prototype.removeCliTaskById = function (taskId) {
                var cliTask, index, _i, _len, _ref;
                _ref = this.cliTasks_;
                for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
                    cliTask = _ref[index];
                    if (cliTask.taskData.resId === taskId) {
                        this.cliTasks_.splice(index, 1);
                        this.emit(ClientTaskSystem.removeTask, cliTask.taskData.resId);
                        return;
                    }
                }
            };

            /**
             * @method preHandOverTask
             * @description 交任务
             * @param  {Number} taskId 任务Id
             */


            ClientTaskSystem.prototype.preHandOverTask = function (taskId) {
                if (this.canHandOverTask(taskId)) {
                    return RemoteCall(TaskSystem.moduleName, "preHandOverTask", this.socket_, arguments);
                }
            };

            return ClientTaskSystem;

        })(TaskSystem);
        module.exports = ClientTaskSystem;
    }).call(this);
});

require.define("/game/taskSystem.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var EventEmitter, IdEquals, TaskSystem, dataKey, dataMgr, _,
        __hasProp = {}.hasOwnProperty,
            __extends = function (child, parent) {
                for (var key in parent) {
                    if (__hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            };

        _ = require("underscore");

        EventEmitter = require('events').EventEmitter;

        dataMgr = require("./dataMgr").dataMgr;

        dataKey = require("./dataMgr").dataKey;

        IdEquals = require("./utilities").IdEquals;

        /**
         * @module taskSystem
         * @class TaskSystem
         * @constructor
         * @param  {[Object]} role_   [数据库数据]
         * @param  {[Object]} socket_ [Socket]
         */


        TaskSystem = (function (_super) {

            __extends(TaskSystem, _super);

            TaskSystem.moduleName = "TaskSystem";

            TaskSystem.syncCalls = ["acceptTaskImple", "pushAcceptableTaskImple", "handOverTaskImple"];

            function TaskSystem(role_, socket_) {
                var roleDb;
                this.role_ = role_;
                this.socket_ = socket_;
                roleDb = this.role_.roleDb_;
                this.tasks_ = roleDb.tasks;
                this.acceptableTasks_ = roleDb.acceptableTasks;
            }

            /**
             * @method [init]
             */


            TaskSystem.prototype.init = function () {};

            TaskSystem.prototype.getRole = function () {
                return this.role_;
            };

            /**
             * @method [getAcceptableTasks]
             * @return {[Array]} [可接任务列表]
             */


            TaskSystem.prototype.getAcceptableTasks = function () {
                return this.acceptableTasks_;
            };

            /**
             * @method [getTasks]
             * @return {[Array]} [已接受任务列表]
             */


            TaskSystem.prototype.getTasks = function () {
                return this.tasks_;
            };

            /**
             * 接受任务
             * @method acceptTask
             * @param  {Number} taskId 任务Id
             */


            TaskSystem.prototype.acceptTask = function (taskId) {
                var taskData;
                taskData = dataMgr.find(dataKey.taskTable, taskId);
                if (this.canAcceptTask(taskData)) {
                    return this.acceptTaskTemplate(taskData);
                }
            };

            TaskSystem.prototype.canAcceptTask = function (taskData) {
                if ((taskData != null) && this.role_.getLevel() >= taskData.levelLimit && !this.existTask(taskData.resId) && ((this.existAcceptableTask(taskData.resId)) || ((taskData.nPreTask != null) && taskData.nPreTask === 1))) {
                    return true;
                }
                return false;
            };

            TaskSystem.prototype.acceptTaskImple = function (taskDb) {
                this.tasks_.push(taskDb);
                return this.removeAcceptableTask(taskDb.taskId);
            };

            TaskSystem.prototype.pushAcceptableTaskImple = function (taskId) {
                return this.acceptableTasks_.push(taskId);
            };

            TaskSystem.prototype.doneCallback = function (taskDb) {
                return this.doneTaskImple(taskDb);
            };

            TaskSystem.prototype.pushTasks = function (taskIds) {
                return this.acceptableTasks_.push.apply(this.acceptableTasks_, taskIds);
            };

            TaskSystem.prototype.doneTaskImple = function (taskDb) {};

            TaskSystem.prototype.handOverTaskImple = function (taskId, triggerTaskIds) {
                this.removeTask(taskId);
                if (_.isArray(triggerTaskIds) && triggerTaskIds.length > 0) {
                    return this.pushTasks(triggerTaskIds);
                }
            };

            TaskSystem.prototype.existAcceptableTask = function (taskId) {
                return _.contains(this.acceptableTasks_, taskId);
            };

            TaskSystem.prototype.existTask = function (taskId) {
                var value, _i, _len, _ref;
                _ref = this.tasks_;
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    value = _ref[_i];
                    if (value.taskId === taskId) {
                        true;
                    }
                }
                return false;
            };

            TaskSystem.prototype.findTask = function (taskId) {
                var task, value, _i, _len, _ref;
                task = null;
                _ref = this.tasks_;
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    value = _ref[_i];
                    if (value.taskId === taskId) {
                        task = value;
                        break;
                    }
                }
                return task;
            };

            TaskSystem.prototype.findIndexAndTask = function (taskId) {
                var task, taskIndex, _i, _len, _ref;
                _ref = this.tasks_;
                for (taskIndex = _i = 0, _len = _ref.length; _i < _len; taskIndex = ++_i) {
                    task = _ref[taskIndex];
                    if (task.taskId === taskId) {
                        [taskIndex, task];
                    }
                }
                return [-1, null];
            };

            TaskSystem.prototype.removeAcceptableTask = function (taskId) {
                var index;
                index = _.indexOf(this.acceptableTasks_, taskId);
                if (index !== -1) {
                    return this.acceptableTasks_.splice(index, 1);
                }
            };

            TaskSystem.prototype.removeTask = function (taskId) {
                var index, taskDb, taskDbIndex, _i, _len, _ref;
                index = -1;
                _ref = this.tasks_;
                for (taskDbIndex = _i = 0, _len = _ref.length; _i < _len; taskDbIndex = ++_i) {
                    taskDb = _ref[taskDbIndex];
                    if (taskDb.taskId === taskId) {
                        index = taskDbIndex;
                        break;
                    }
                }
                if (index !== -1) {
                    return this.tasks_.splice(index, 1);
                }
            };

            TaskSystem.prototype.canHandOverTask = function (taskId) {
                var task;
                task = this.findTask(taskId);
                if ((task != null) && task.done === true) {
                    return true;
                }
                return false;
            };
            return TaskSystem;
        })(EventEmitter);
        module.exports = TaskSystem;
    }).call(this);
});

require.define("/game/clientChapterSystem.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var ChapterSystem, ClientChapterSystem, OnArrRemoteCall, _,
        __hasProp = {}.hasOwnProperty,
            __extends = function (child, parent) {
                for (var key in parent) {
                    if (__hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            };

        _ = require("underscore");

        ChapterSystem = require("./chapterSystem");

        OnArrRemoteCall = require("./utilities").OnArrRemoteCall;

        ClientChapterSystem = (function (_super) {

            __extends(ClientChapterSystem, _super);

            function ClientChapterSystem(role_, socket_) {
                ClientChapterSystem.__super__.constructor.call(this, role_, socket_);
            }

            ClientChapterSystem.prototype.init = function () {
                return OnArrRemoteCall(this, ChapterSystem.remoteCalls, this.socket_, ChapterSystem.moduleName);
            };

            ClientChapterSystem.prototype.preEnterCustoms = function (chapterIndex, customsIndex) {
                var chapterData, mapData;
                if (_.isNumber(chapterIndex) && _.isNumber(customsIndex)) {
                    chapterData = dataMgr.find(dataKey.chapter, chapterIndex);
                    mapData = ChapterSystem.getMap(chapterData, customsIndex);
                    if (this.canEnterCustoms(chapterData, mapData) && this.canChallengeCustoms(chapterIndex, customsIndex)) {
                        return this.socket_.emit("enterCustoms", chapterIndex, customsIndex);
                    }
                }
            };

            return ClientChapterSystem;

        })(ChapterSystem);
        module.exports = ClientChapterSystem;
    }).call(this);
});

require.define("/game/chapterSystem.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var ChapterSystem, SetValue, dataKey, dataMgr, _;

        _ = require("underscore");

        dataKey = require("./dataMgr").dataKey;

        dataMgr = require("./dataMgr").dataMgr;

        SetValue = require("./utilities").SetValue;

        ChapterSystem = (function () {

            ChapterSystem.getMap = function (chapter, customsIndex) {
                var mapData, mapId;
                mapData = null;
                if (chapter != null) {
                    mapId = chapter.mapId[customsIndex];
                    if (mapId != null) {
                        mapId = mapId;
                        if (mapId !== NaN) {
                            mapData = dataMgr.find(dataKey.mapTable, mapId);
                        }
                    }
                }
                return mapData;
            };

            ChapterSystem.remoteCalls = ["initCustoms", "setFightIndex", "setFightStar", "setFightFinish"];

            ChapterSystem.moduleName = "ChapterSystem";

            function ChapterSystem(role_, socket_) {
                this.role_ = role_;
                this.socket_ = socket_;
                this.chapterTable_ = this.role_.roleDb_.chapterTable;
            }

            ChapterSystem.prototype.getChapterLength = function () {
                return this.chapterTable_.length;
            };

            ChapterSystem.prototype.getChapter = function (chapterIndex) {
                return this.chapterTable_[chapterIndex];
            };

            ChapterSystem.prototype.hasCustoms = function (chapterIndex, customsIndex) {
                var chapter;
                chapter = this.roleDb_.chapterTable[chapterIndex];
                return (chapter != null) && (chapter[customsIndex] != null);
            };

            ChapterSystem.prototype.canEnterCustoms = function (chapterData, mapData) {
                var customsLevel, result, roleLevel;
                result = false;
                if ((chapterData != null) && (mapData != null)) {
                    customsLevel = mapData.needLevel;
                    roleLevel = this.role_.getLevel();
                    if (roleLevel >= customsLevel) {
                        result = true;
                    }
                }
                return result;
            };

            ChapterSystem.prototype.canChallengeCustoms = function (chapterIndex, customsIndex) {
                var canChallege, chapter;
                canChallege = false;
                chapter = this.chapterTable_[chapterIndex];
                if (chapterIndex === 0) {
                    return true;
                } else if (chapter === void 0 && (this.chapterTable_[chapterIndex - 1] != null)) {
                    canChallege = true;
                } else if (customsIndex <= chapter.length && (customsIndex === 0 || (chapter[customsIndex - 1] != null))) {
                    canChallege = true;
                }
                return canChallege;
            };

            ChapterSystem.prototype.needCreateCustoms = function (chapterIndex, customsIndex) {
                if (this.chapterTable_[chapterIndex] === void 0) {
                    return true;
                } else if (this.chapterTable_[chapterIndex][customsIndex] === void 0) {
                    return true;
                }
                return false;
            };

            ChapterSystem.prototype.initCustoms = function (chapterIndex, customsIndex) {
                var chapter;
                if (this.needCreateCustoms(chapterIndex, customsIndex)) {
                    chapter = this.chapterTable_[chapterIndex];
                    if (chapter === void 0) {
                        chapter = [];
                        SetValue(this.chapterTable_, chapterIndex, chapter);
                        chapter = this.chapterTable_[chapterIndex];
                    }
                    if (chapter[customsIndex] === void 0) {
                        chapter[customsIndex] = {
                            fightIndex: 0,
                            star: 0,
                            finish: false
                        };
                    }
                    return true;
                }
                return false;
            };

            ChapterSystem.prototype.setFightIndex = function (chapterIndex, customsIndex, fightIndex) {
                var customs;
                customs = this.getCustoms(chapterIndex, customsIndex);
                if ((customs != null) && fightIndex > customs.fightIndex) {
                    customs.fightIndex = fightIndex;
                    return true;
                }
                return false;
            };

            ChapterSystem.prototype.setFightStar = function (chapterIndex, customsIndex, star) {
                var customs;
                customs = this.getCustoms(chapterIndex, customsIndex);
                if ((customs != null) && star > customs.star) {
                    customs.star = star;
                    return true;
                }
                return false;
            };

            ChapterSystem.prototype.setFightFinish = function (chapterIndex, customsIndex) {
                var customs;
                customs = this.getCustoms(chapterIndex, customsIndex);
                if ((customs != null) && !customs.finish) {
                    customs.finish = true;
                    return true;
                }
                return false;
            };

            ChapterSystem.prototype.getCustoms = function (chapterIndex, customsIndex) {
                var chapter, customs;
                customs = null;
                chapter = this.chapterTable_[chapterIndex];
                if (chapter != null) {
                    customs = chapter[customsIndex];
                }
                return customs;
            };

            return ChapterSystem;

        })();
        module.exports = ChapterSystem;
    }).call(this);
});

require.define("/game/clientFriendSystem.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var ClientFriendSystem, FriendSystem, OnArrRemoteCall, Prompt, attache, _,
        __hasProp = {}.hasOwnProperty,
            __extends = function (child, parent) {
                for (var key in parent) {
                    if (__hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            };

        _ = require("underscore");

        FriendSystem = require("./friendSystem");

        Prompt = require("gameData/prompt").friendSystem;

        OnArrRemoteCall = require("./utilities").OnArrRemoteCall;

        attache = require("attache.js");

        ClientFriendSystem = (function (_super) {

            __extends(ClientFriendSystem, _super);

            ClientFriendSystem.eventFriendListLoaded = "friendListLoaded";

            function ClientFriendSystem(role_, socket_) {
                ClientFriendSystem.__super__.constructor.call(this, role_, socket_);
                this.already_ = false;
            }

            ClientFriendSystem.prototype.init = function () {
                var moduleName, remoteCalls,
                _this = this;
                moduleName = FriendSystem.moduleName;
                remoteCalls = FriendSystem.remoteCalls;
                OnArrRemoteCall(this, remoteCalls, this.socket_, moduleName);
                attache.after(this, "addFriend", (function () {
                    return _this.role_.prompt(Prompt.addFriendSucceed);
                }), true);
                attache.after(this, "addBlack", (function () {
                    return _this.role_.prompt(Prompt.addBlackSucceed);
                }), true);
                attache.after(this, "removeFriend", (function () {
                    return _this.role_.prompt(Prompt.rmFriendSucceed);
                }), true);
                return attache.after(this, "removeBlack", (function () {
                    return _this.role_.prompt(Prompt.rmBlackSucceed);
                }), true);
            };

            ClientFriendSystem.prototype.preAddFriend = function (name) {
                var result;
                if (_.isString(name) && name.length > 0) {
                    if (this.friendTable_.length >= FriendSystem.maxFriends) {
                        return this.role_.prompt(Prompt.friendMax);
                    } else if (name.length > FriendSystem.maxNameLength) {
                        return this.role_.prompt(Prompt.nameError);
                    } else if (name === this.role_.getName()) {
                        return this.role_.prompt(Prompt.addSelfFriend);
                    } else if (this.existFriend(name)) {
                        return this.role_.prompt(Prompt.existFriendError);
                    } else if (this.existBlack(name)) {
                        result = confirm(Prompt.existBlack);
                        if (result) {
                            return this.socket_.emit("addFriend", name);
                        }
                    } else {
                        return this.socket_.emit("addFriend", name);
                    }
                }
            };

            ClientFriendSystem.prototype.preAddBlack = function (name) {
                var result;
                if (_.isString(name) && name.length > 0) {
                    if (name.length > FriendSystem.maxNameLength) {
                        return this.role_.prompt(Prompt.nameError);
                    } else if (name === this.role_.getName()) {
                        return this.role_.prompt(Prompt.addSelfBlack);
                    } else if (this.existBlack(name)) {
                        return this.role_.prompt(Prompt.alreadyExistBlack);
                    } else if (this.existFriend(name)) {
                        result = confirm(Prompt.existFriend);
                        if (result) {
                            return this.socket_.emit("addBlack", name);
                        }
                    } else {
                        return this.socket_.emit("addBlack", name);
                    }
                }
            };

            ClientFriendSystem.prototype.preRemoveFriend = function (name) {
                if (_.isString(name)) {
                    return this.socket_.emit("removeFriend", name);
                }
            };

            ClientFriendSystem.prototype.preRemoveBlack = function (name) {
                if (_.isString(name)) {
                    return this.socket_.emit("removeBlack", name);
                }
            };

            ClientFriendSystem.prototype.preNeedFriendList = function () {
                var _this = this;
                if (!this.already_) {
                    this.already_ = true;
                    return this.socket_.emit("friendList", function (friendInfoTable, blackInfoTable) {
                        if (_.isObject(friendInfoTable) && _.isObject(blackInfoTable)) {
                            _this.friendInfoTable_ = friendInfoTable;
                            _this.blackInfoTable_ = blackInfoTable;
                            return _this.emit(ClientFriendSystem.eventFriendListLoaded);
                        }
                    });
                }
            };

            return ClientFriendSystem;

        })(FriendSystem);
        module.exports = ClientFriendSystem;
    }).call(this);
});

require.define("/game/friendSystem.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var EventEmitter, FriendSystem, _,
        __hasProp = {}.hasOwnProperty,
            __extends = function (child, parent) {
                for (var key in parent) {
                    if (__hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            };

        _ = require("underscore");

        EventEmitter = require('events').EventEmitter;

        FriendSystem = (function (_super) {

            __extends(FriendSystem, _super);

            FriendSystem.maxFriends = 5;

            FriendSystem.maxNameLength = 10;

            FriendSystem.moduleName = "friendSystem";

            FriendSystem.remoteCalls = ["addFriend", "addBlack", "removeFriend", "removeBlack"];

            function FriendSystem(role_, socket_) {
                var roleDb;
                this.role_ = role_;
                this.socket_ = socket_;
                roleDb = this.role_.roleDb_;
                this.friendTable_ = roleDb.friendTable;
                this.blackTable_ = roleDb.blackTable;
                this.friendInfoTable_ = {};
                this.blackInfoTable_ = {};
            }

            FriendSystem.prototype.getFriendTable = function () {
                return this.friendInfoTable_;
            };

            FriendSystem.prototype.getBlackTable = function () {
                return this.blackInfoTable_;
            };

            FriendSystem.prototype.addBlack = function (friendInfo) {
                var name;
                name = friendInfo.name;
                if (!this.existBlack(name)) {
                    this.blackTable_.push(name);
                    this.blackInfoTable_[name] = friendInfo;
                    this.removeFriendImple(name);
                    return true;
                }
                return false;
            };

            FriendSystem.prototype.getBlackIndexOf = function (name) {
                return _.indexOf(this.blackTable_, name);
            };

            FriendSystem.prototype.existBlack = function (name) {
                return _.contains(this.blackTable_, name);
            };

            FriendSystem.prototype.removeBlack = function (name) {
                return this.removeBlackImple(name);
            };

            FriendSystem.prototype.removeBlackImple = function (name) {
                var index;
                index = this.getBlackIndexOf(name);
                if (index !== -1) {
                    this.blackTable_.splice(index, 1);
                    delete this.blackInfoTable_[name];
                    return true;
                }
                return false;
            };

            FriendSystem.prototype.canAddBlack = function (name) {
                return this.verifyName(name) && !this.existBlack(name) && name !== this.role_.getName();
            };

            FriendSystem.prototype.canAddFriend = function (name) {
                return this.verifyName(name) && !this.existFriend(name) && this.friendTable_.length <= FriendSystem.maxFriends && name !== this.role_.getName();
            };

            FriendSystem.prototype.verifyName = function (name) {
                return _.isString(name) && name.length > 0 && name.length <= FriendSystem.maxNameLength;
            };

            FriendSystem.prototype.addFriend = function (friendInfo) {
                var name;
                name = friendInfo.name;
                if (!this.existFriend(name)) {
                    this.friendTable_.push(name);
                    this.friendInfoTable_[name] = friendInfo;
                    this.removeBlackImple(name);
                    return true;
                }
                return false;
            };

            FriendSystem.prototype.getFriendIndexOf = function (name) {
                return _.indexOf(this.friendTable_, name);
            };

            FriendSystem.prototype.existFriend = function (name) {
                return _.contains(this.friendTable_, name);
            };

            FriendSystem.prototype.removeFriend = function (name) {
                return this.removeFriendImple(name);
            };

            FriendSystem.prototype.removeFriendImple = function (name) {
                var index;
                index = this.getFriendIndexOf(name);
                if (index !== -1) {
                    this.friendTable_.splice(index, 1);
                    delete this.friendInfoTable_[name];
                    return true;
                }
                return false;
            };

            return FriendSystem;

        })(EventEmitter);
        module.exports = FriendSystem;
    }).call(this);
});

require.define("/game/clientEmailSystem.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var ClientEmailSystem, EmailSystem, OnArrRemoteCall, OnRemoteCall, Prompt, attache, emailTypeList, emitEvent, indexOfObject, nameError, verifyName, _,
        __hasProp = {}.hasOwnProperty,
            __extends = function (child, parent) {
                for (var key in parent) {
                    if (__hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            };

        _ = require("underscore");

        Prompt = require("gameData/prompt").emailSystem;

        nameError = require("gameData/prompt").role.nameError;

        EmailSystem = require("./emailSystem");

        attache = require("attache.js");

        OnArrRemoteCall = require("./utilities").OnArrRemoteCall;

        OnRemoteCall = require("./utilities").OnRemoteCall;

        emitEvent = require("./utilities").emitEvent;

        verifyName = require("./gameAssist").verifyName;

        indexOfObject = require("../lib/assist").indexOfObject;

        emailTypeList = ["inbox", "outbox", "savebox"];

        ClientEmailSystem = (function (_super) {

            __extends(ClientEmailSystem, _super);

            ClientEmailSystem.eventReadEmail = "readEmail";

            ClientEmailSystem.eventSendSucceed = "sendSucceed";

            ClientEmailSystem.eventReceiveEmail = "receiveEmail";

            ClientEmailSystem.eventRefreshList = "refreshList";

            function ClientEmailSystem(role_, socket_) {
                ClientEmailSystem.__super__.constructor.call(this, role_, socket_);
            }

            ClientEmailSystem.prototype.init = function () {
                var moduleName, remoteCalls,
                _this = this;
                moduleName = EmailSystem.moduleName;
                remoteCalls = EmailSystem.remoteCalls;
                OnArrRemoteCall(this, remoteCalls, this.socket_, moduleName);
                OnRemoteCall(this, "readEmail", this.socket_, moduleName);
                attache.after(this, "removeEmail", function () {
                    _this.role_.prompt(Prompt.rmEmailSucceed);
                    return _this.emit(ClientEmailSystem.eventRefreshList);
                });
                attache.after(this, "saveInboxEmail", function () {
                    _this.role_.prompt(Prompt.saveEmailSucceed);
                    return _this.emit(ClientEmailSystem.eventRefreshList);
                });
                return attache.after(this, "readEmail", (function () {
                    return emitEvent(_this, ClientEmailSystem.eventReadEmail, arguments);
                }), true);
            };

            ClientEmailSystem.prototype.deliverInbox = function (email) {
                if (indexOfObject(this.inbox_, email._id, "_id" === -1)) {
                    this.inbox_.unshift(email);
                    this.role_.prompt(Prompt.receiveEmail);
                    return this.emit(ClientEmailSystem.eventReceiveEmail, email);
                }
            };

            ClientEmailSystem.prototype.deliverOutbox = function (email) {
                if (indexOfObject(this.outbox_, email._id, "_id" === -1)) {
                    this.outbox_.unshift(email);
                    this.role_.prompt(Prompt.sendSucceed);
                    return this.emit(ClientEmailSystem.eventSendSucceed, email);
                }
            };

            ClientEmailSystem.prototype.preSendEmail = function (name, subject, details) {
                if (_.isString(subject) && _.isString(details)) {
                    if (!verifyName(name)) {
                        return this.role_.prompt(nameError);
                    } else if (name === this.role_.getName()) {
                        return this.role_.prompt(Prompt.sendSelf);
                    } else if (subject.length === 0) {
                        return this.role_.prompt(Prompt.subjectEmpty);
                    } else if (subject.length > EmailSystem.maxSubject) {
                        return this.role_.prompt(Prompt.maxSubject);
                    } else if (details.length === 0) {
                        return this.role_.prompt(Prompt.detailsEmpty);
                    } else if (details.length > EmailSystem.maxDetails) {
                        return this.role_.prompt(Prompt.maxDetails);
                    } else if (this.role_.getFriendSystem().existBlack(name)) {
                        return this.role_.prompt(Prompt.existBlack);
                    } else {
                        return this.socket_.emit("sendEmail", name, subject, details);
                    }
                }
            };

            ClientEmailSystem.prototype.preRemoveEmail = function (boxType, table) {
                if (_.isString(boxType) && _.contains(emailTypeList, boxType)) {
                    _.isArray(table) && table.length !== 0 && this.emailTable_.length > 0;
                }
                return this.socket_.emit("removeEmail", boxType, table);
            };

            ClientEmailSystem.prototype.preReadEmail = function (boxType, docId) {
                if (this.canReadEmail(boxType, docId)) {
                    return this.socket_.emit("readEmail", boxType, docId);
                }
            };

            ClientEmailSystem.prototype.preSaveInboxEmail = function (table) {
                if (_.isArray(table) && table.length !== 0 && this.inbox_.length > 0) {
                    return this.socket_.emit("saveInboxEmail", table);
                }
            };

            return ClientEmailSystem;

        })(EmailSystem);

        module.exports = ClientEmailSystem;

    }).call(this);

});

require.define("/game/emailSystem.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var EmailSystem, IdEquals, findIndexAndObject, indexOfObject, verifyName, _;

        _ = require("underscore");

        indexOfObject = require("../lib/assist").indexOfObject;

        findIndexAndObject = require("../lib/assist").findIndexAndObject;

        IdEquals = require("./utilities").IdEquals;

        verifyName = require("./gameAssist").verifyName;

        EmailSystem = (function () {

            EmailSystem.moduleName = "emailSystem";

            EmailSystem.inboxDeleteTime = 5 * 86400000;

            EmailSystem.outboxDeleteTime = 5 * 86400000;

            EmailSystem.maxDetails = 140;

            EmailSystem.maxSubject = 10;

            EmailSystem.saveboxMax = 1000;

            EmailSystem.remoteCalls = ["removeEmail", "saveInboxEmail", "deliverInbox", "deliverOutbox"];

            function EmailSystem(role_, socket_) {
                var emailTable;
                this.role_ = role_;
                this.socket_ = socket_;
                emailTable = this.role_.roleDb_.emailTable;
                this.inbox_ = emailTable.inbox;
                this.outbox_ = emailTable.outbox;
                this.savebox_ = emailTable.savebox;
                this.emailTable_ = emailTable;
            }

            EmailSystem.prototype.init = function () {};

            EmailSystem.prototype.deliverInbox = function (email) {
                return this.inbox_.unshift(email);
            };

            EmailSystem.prototype.deliverOutbox = function (email) {
                return this.outbox_.unshift(email);
            };

            EmailSystem.prototype.canSendEmail = function (name, subject, details) {
                if (verifyName(name) && name !== this.role_.getName()) {
                    _.isString(subject) && subject.length > 0 && subject.length <= EmailSystem.maxSubject && _.isString(details) && details.length > 0 && details.length <= EmailSystem.maxDetails && !this.role_.getFriendSystem().existBlack(name);
                }
                return true;
                return false;
            };

            EmailSystem.prototype.canReadEmail = function (boxType, docId) {
                return _.isString(boxType) && boxType === "inbox" || boxType === "savebox" && _.isString(docId);
            };

            EmailSystem.prototype.readEmail = function (boxType, docId) {};

            EmailSystem.prototype.removeEmail = function (key, removeTable) {
                var docId, emailBox, index, _i, _len, _results;
                emailBox = this.emailTable_[key];
                if (emailBox != null) {
                    _results = [];
                    for (_i = 0, _len = removeTable.length; _i < _len; _i++) {
                        docId = removeTable[_i];
                        index = indexOfObject(emailBox, docId, "_id", IdEquals);
                        if (index !== -1) {
                            _results.push(emailBox.splice(index, 1));
                        } else {
                            _results.push(void 0);
                        }
                    }
                    return _results;
                }
            };

            EmailSystem.prototype.saveInboxEmail = function (saveTable) {
                var deleteTable, docId, index, object, _i, _len, _ref;
                if (_.isArray(saveTable) && saveTable.length !== 0) {
                    deleteTable = [];
                    for (_i = 0, _len = saveTable.length; _i < _len; _i++) {
                        docId = saveTable[_i];
                        _ref = findIndexAndObject(this.inbox_, docId, "_id", IdEquals), index = _ref[0], object = _ref[1];
                        if (index !== -1) {
                            this.inbox_.splice(index, 1);
                            deleteTable.push(object);
                        }
                    }
                    if (deleteTable.length !== 0) {
                        return this.savebox_.unshift.apply(this.savebox_, deleteTable);
                    }
                }
            };

            return EmailSystem;

        })();
        module.exports = EmailSystem;
    }).call(this);
});

require.define("/game/gameAssist.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var dataKey, dataMgr, getHeroData, getMonsterPackData, getOddsAward, getRole, uniform, _;

        _ = require("underscore");

        dataMgr = require("./dataMgr").dataMgr;

        dataKey = require("./dataMgr").dataKey;

        uniform = require("rand").uniform;

        getRole = function (socket) {
            var role;
            role = null;
            socket.get("role", function (err, role1) {
                if (role1 != null) {
                    return role = role1;
                }
            });
            return role;
        };

        getOddsAward = function (oddsId) {
            var awardItems, baseNumber, item, items, odds, oddsAward, oddsData, oddsDataType, randNumber, _i, _j, _len, _len1;
            oddsAward = null;
            oddsData = dataMgr.find(dataKey.baseOdds, oddsId);
            if (oddsData != null) {
                oddsAward = {};
                if (_.isNumber(oddsData.exp)) {
                    oddsAward.exp = oddsData.exp;
                }
                oddsAward.properties = _.clone(oddsData.properties);
                oddsDataType = oddsData.oddType;
                if (oddsData.items.length !== 0 && oddsDataType < 3) {
                    awardItems = [];
                    items = oddsData.items;
                    if (oddsDataType === 0) {
                        awardItems = items;
                    } else if (oddsDataType === 1) {
                        randNumber = uniform(0, 100);
                        baseNumber = 0;
                        for (_i = 0, _len = items.length; _i < _len; _i++) {
                            item = items[_i];
                            odds = item.odds + baseNumber;
                            if (randNumber <= odds) {
                                awardItems.push(item);
                                break;
                            } else {
                                baseNumber += odds;
                            }
                        }
                    } else if (oddsDataType === 2) {
                        for (_j = 0, _len1 = items.length; _j < _len1; _j++) {
                            item = items[_j];
                            if (uniform(0, 100) <= item.odds) {
                                awardItems.push(item);
                            }
                        }
                    }
                    oddsAward.items = awardItems;
                }
            }
            return oddsAward;
        };

        getMonsterPackData = function (monsterPack) {
            var index, monster, monsterId, monsterIds, monsters, skill, skillId, _i, _len;
            monsters = [];
            if (monsterPack != null) {
                monsterIds = monsterPack.monsterId;
                for (index = _i = 0, _len = monsterIds.length; _i < _len; index = ++_i) {
                    monsterId = monsterIds[index];
                    if (monsterId != null) {
                        monster = dataMgr.find(dataKey.monster, monsterId);
                        if (monster != null) {
                            monsters[index] = monster;
                            if (monster.skillData === void 0) {
                                skillId = monster.skillId;
                                if (skillId != null) {
                                    skill = dataMgr.find(dataKey.skillTable, skillId);
                                }
                                if (skill != null) {
                                    monster.skillData = skill;
                                }
                            }
                        }
                    }
                }
            }
            return monsters;
        };

        getHeroData = function (role) {
            var hero, heroData, heroDb, heros, herosData, index, skillData, _i, _len, _results;
            heros = role.getPositionSystem().getHeros();
            herosData = [];
            _results = [];
            for (index = _i = 0, _len = heros.length; _i < _len; index = ++_i) {
                hero = heros[index];
                if (hero != null) {
                    heroDb = hero.heroDb_;
                    heroData = _.pick(heroDb, "resId", "level", "vocation", "quality", "talent_0", "talent_1", "skillId", "attackType");
                    heroData.fightAttr = hero.getFightAttr();
                    skillData = dataMgr.find(dataKey.skillTable, heroDb.skillId);
                    if (skillData != null) {
                        heroData.skillData = skillData;
                    }
                    heroData.resIds = role.getHeroSystem().getHeroResIds(heroDb);
                    _results.push(herosData[index] = heroData);
                } else {
                    _results.push(void 0);
                }
            }
            return _results;
        };

        module.exports.getRole = getRole;

        module.exports.getOddsAward = getOddsAward;

        module.exports.getMonsterPackData = getMonsterPackData;

        module.exports.getHeroData = getHeroData;

        module.exports.verifyName = function (name) {
            return _.isString(name) && name.length > 0 && name.length <= 10;
        };
    }).call(this);
});

require.define("/node_modules/rand/package.json", function (require, module, exports, __dirname, __filename, process, global) {
    module.exports = {
        "main": "rand.js"
    }
});

require.define("/node_modules/rand/rand.js", function (require, module, exports, __dirname, __filename, process, global) { // Copyright (c) 2011 Kaleb Hornsby
    /**
     * @fileoverview JS Random Extensions
     * @author <a href="http://kaleb.hornsby.ws">Kaleb Hornsby</a>
     * @version 2011-06-11
     */
        "use strict";
    /** @namespace rand */
    //module.exports = Math.random;

    /**
     * @return random
     * @example
     * var n = rand.uniform(2, 3);
     * 1 <= n && n <= 2;
     * //-> true
     * rand.uniform(2, 2);
     * //-> 2
     */
    exports.uniform = function (a, b) /**number*/
    {
        return Math.random() * (b - a) + a;
    };

    //////////////////////////////////////////////////////////////////////////////
    // Functions for integers:
    //////////////////////////////////////////////////////////////////////////////

    /**
     * @return random
     * @example
     * var n = rand.int_(2, 4);
     * 2 <= n && n < 4
     * //-> true
     * rand.int_(2, 3);
     * //-> 2
     */
    exports.int_ = function (j, k) /**int*/
    {
        return Math.floor(exports.uniform(j, k));
    };

    /**
     * @return a randomly selected element from {{start, start + step, ..., stop}}.
     */
    exports.range = function (start, stop, step) {
        switch (arguments.length) {
            case 1:
                return exports.int_(0, start);
            case 2:
                return exports.int_(start, stop);
            case 3:
                return exports.int_(start, stop / step) * step;
            default:
                return 0;
        }
    };

    /**
     * @name int
     * @function
     * @memberOf rand
     * @param j
     * @param k
     * @return random
     * @example
     * var n = rand.int(2, 3);
     * 2 <= n && n <= 3
     * //-> true
     * rand.int(2, 2);
     * //-> 2;
     */
    exports['int'] = function (j, k) /**int*/
    {
        return exports.int_(j, k + 1);
    };

    //////////////////////////////////////////////////////////////////////////////
    // Functions for arrays and sequences:
    //////////////////////////////////////////////////////////////////////////////

    /**
     * @return random index
     * @example
     * var n = rand.index(new Array(3));
     * 0 <= n && n < 3;
     * //-> true
     * rand.index('c');
     * //-> 0
     */
    exports.index = function (seq) /**int*/
    {
        return exports.int_(0, seq.length);
    };

    /**
     * @return {*} random item
     * @example
     * var o = rand.item(['a','b']);
     * o == 'a' || o == 'b';
     * //-> true
     * rand.item('c');
     * //-> 'c'
     */
    exports.item = function (ary) {
        return ary[exports.index(ary)];
    };

    //////////////////////////////////////////////////////////////////////////////
    // Functions for objects:
    //////////////////////////////////////////////////////////////////////////////

    /**
     * @private
     */
    exports.key_ = function (obj) /**string*/
    {
        var k, r, i = 0;
        for (k in obj) {
            if (obj.hasOwnProperty(k) && rand() < 1 / ++i) {
                r = k;
            }
        }
        return r;
    };

    /**
     * @return random key
     */
    exports.key = function (obj) /**string*/
    {
        if (!Object.keys) {
            return exports.key_(obj);
        }
        return exports.item(Object.keys(obj));
    };

    /**
     * @return {*} random property
     */
    exports.choice = function (obj) {
        return obj[exports.key(obj)];
    };
});

require.define("/game/clientBarSystem.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var BarSystem, ClientBarSystem, OnRemoteCall, Prompt, barConfig, dataKey, dataMgr, strformat, _,
        __hasProp = {}.hasOwnProperty,
            __extends = function (child, parent) {
                for (var key in parent) {
                    if (__hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            };

        _ = require("underscore");

        BarSystem = require("./barSystem");

        Prompt = require("gameData/prompt").barSystem;

        dataMgr = require("./dataMgr").dataMgr;

        dataKey = require("./dataMgr").dataKey;

        barConfig = require("gameData/barConfig");

        OnRemoteCall = require("./utilities").OnRemoteCall;

        strformat = require("strformat");

        ClientBarSystem = (function (_super) {

            __extends(ClientBarSystem, _super);

            function ClientBarSystem(role_, socket_) {
                ClientBarSystem.__super__.constructor.call(this, role_, socket_);
            }

            ClientBarSystem.prototype.init = function () {
                var moduleName;
                moduleName = BarSystem.moduleName;
                this.socket_.on("fistResult", _.bind(this.fistResult, this));
                this.socket_.on("buyHero", _.bind(this.buyHero, this));
                this.socket_.on("onekeyChallenge", _.bind(this.onekeyChallenge, this));
                return OnRemoteCall(this, "startChallenge", this.socket_, moduleName);
            };

            ClientBarSystem.prototype.preChallenge = function (resId) {
                var barData;
                if (_.isNumber(resId)) {
                    barData = dataMgr.find(dataKey.bar, resId);
                    if ((barData != null) && this.verifyLevel(barData) && !this.bar_.inProgress) {
                        if (this.enoughSilver(barData)) {
                            return this.socket_.emit("challenge", resId);
                        } else {
                            return this.role_.prompt(Prompt.notEnoughSilver);
                        }
                    }
                }
            };

            ClientBarSystem.prototype.preOnekeyChallenge = function (resId) {
                var barData;
                if (_.isNumber(resId)) {
                    barData = dataMgr.find(dataKey.bar, resId);
                    if ((barData != null) && this.verifyLevel(barData) && !this.bar_.inProgress) {
                        if (this.enoughSilverOnekey(barData)) {
                            return this.socket_.emit("onekeyChallenge", resId);
                        } else {
                            return this.role_.prompt(Prompt.notEnoughSilver);
                        }
                    }
                }
            };

            ClientBarSystem.prototype.preBuyHero = function (barResId, heroResId) {
                var barData, heroData, heroSystem;
                if (_.isNumber(barResId) && _.isNumber(heroResId)) {
                    barData = dataMgr.find(dataKey.bar, barResId);
                    heroData = dataMgr.find(dataKey.heroTable, heroResId);
                    if ((heroData != null) && (barData != null)) {
                        heroSystem = this.role_.getHeroSystem();
                        if (barData.level > this.role_.getLevel()) {
                            return this.role_.prompt(Prompt.notEnoughLevel);
                        } else if (heroSystem.existHeroByResId(heroResId)) {
                            return this.role_.prompt(Prompt.existHero);
                        } else if (heroSystem.isHeroTableFull()) {
                            return this.role_.prompt(Prompt.heroFull);
                        } else if (!this.role_.isEnough(heroData.soulType, heroData.needSoul)) {
                            return this.role_.prompt(Prompt.notEnoughSoul);
                        } else {
                            return this.socket_.emit("buyHero", barResId, heroResId);
                        }
                    }
                }
            };

            ClientBarSystem.prototype.preGuessFist = function () {
                if (this.canChoice()) {
                    return this.socket_.emit("guessFist");
                }
            };

            ClientBarSystem.prototype.preMustWinFist = function () {
                if (!this.role_.isEnough("gold", barConfig.gold) && this.canChoice()) {
                    return this.role_.prompt(Prompt.notEnoughGold);
                } else {
                    return this.socket_.emit("mustWinFist");
                }
            };

            ClientBarSystem.prototype.buyHero = function (heroDb, soulType, needSoul) {
                if (_.isObject(heroDb) && _.isString(soulType) && _.isNumber(needSoul)) {
                    this.role_.getHeroSystem().addHeroImpl(heroDb);
                    this.role_.change(soulType, -needSoul);
                    this.role_.prompt(Prompt.buySucceed);
                    return this.emit("buyHero", heroDb.resId);
                }
            };

            ClientBarSystem.prototype.fistResult = function (result) {
                this.executeResult(result);
                return this.emit("fistResult", result);
            };

            ClientBarSystem.prototype.onekeyChallenge = function (resId, results) {
                var barData, changeSilver, changeSoul, heroIndex, heroTable, heros, i, maxHeros, needSilver, result, resultIndex, returnSilver, soulType, sumIndex, _i, _j, _len;
                console.log(results);
                if (_.isNumber(resId) && _.isArray(results)) {
                    barData = dataMgr.find(dataKey.bar, resId);
                    if (barData != null) {
                        soulType = barData.soulType;
                        this.role_.change("silver", -(barConfig[soulType] * 10));
                        maxHeros = BarSystem.maxHeros;
                        returnSilver = barConfig.returnSilver;
                        needSilver = barConfig[soulType];
                        heroTable = dataMgr.getDataTable(dataKey.heroTable);
                        sumIndex = 0;
                        for (resultIndex = _i = 0, _len = results.length; _i < _len; resultIndex = ++_i) {
                            result = results[resultIndex];
                            heros = result.heros;
                            result.heroDatas = [];
                            heroIndex = result.heroIndex;
                            sumIndex += heroIndex;
                            console.log(strformat(Prompt.fistIndex, resultIndex));
                            for (i = _j = 0; _j < heroIndex; i = _j += 1) {
                                result.heroDatas[i] = heroTable[heros[i]];
                                changeSoul = heroTable[heros[i]].giveSoul;
                                console.log(strformat(Prompt.fistSucceed, heroTable[heros[i]].name, changeSoul));
                            }
                            if (heroIndex !== maxHeros) {
                                changeSilver = parseInt(returnSilver[heroIndex] * needSilver);
                                console.log(strformat(Prompt.fistFail, heroTable[heros[heroIndex]].name, changeSilver));
                            }
                        }
                        this.emit("onekeyChallenge", barData, results, returnSilver, needSilver);
                        return console.log(sumIndex);
                    }
                }
            };

            return ClientBarSystem;

        })(BarSystem);
        module.exports = ClientBarSystem;
    }).call(this);
});

require.define("/game/barSystem.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var BarSystem, EventEmitter, EventTranspond, barConfig, dataKey, dataMgr, utilities, _,
        __hasProp = {}.hasOwnProperty,
            __extends = function (child, parent) {
                for (var key in parent) {
                    if (__hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            };

        _ = require("underscore");

        dataMgr = require("./dataMgr").dataMgr;

        dataKey = require("./dataMgr").dataKey;

        barConfig = require("gameData/barConfig");

        utilities = require("./utilities");

        EventTranspond = utilities.EventTranspond;

        EventEmitter = require('events').EventEmitter;

        BarSystem = (function (_super) {

            __extends(BarSystem, _super);

            BarSystem.moduleName = "barSystem";

            BarSystem.maxHeros = 3;

            BarSystem.eventStartChallenge = "startChallenge";

            BarSystem.eventWinChallenge = "winChallenge";

            BarSystem.eventFailChallenge = "failChallenge";

            BarSystem.choiceList = ["stone", "scissors", "cloth", "win"];

            function BarSystem(role_, socket_) {
                this.role_ = role_;
                this.socket_ = socket_;
                this.bar_ = this.role_.roleDb_.bar;
            }

            BarSystem.prototype.getShowList = function () {
                var barData, barTable, roleLevel, showTable, _i, _len;
                roleLevel = this.role_.getLevel();
                barTable = dataMgr.getDataTable(dataKey.bar);
                showTable = [];
                if (_.isArray(barTable)) {
                    for (_i = 0, _len = barTable.length; _i < _len; _i++) {
                        barData = barTable[_i];
                        if (roleLevel >= barData.level) {
                            showTable.push(barData);
                        }
                    }
                }
                return showTable;
            };

            BarSystem.prototype.getHeroTable = function (resId) {
                var barData, hero, heroData, heroIndex, heroSystem, heros, resHeroData, resHeros, roleCountry, _i, _len;
                barData = dataMgr.find(dataKey.bar, resId);
                resHeros = [];
                if (barData != null) {
                    heros = barData.heros;
                    heroSystem = this.role_.getHeroSystem();
                    roleCountry = this.role_.getCountry();
                    for (heroIndex = _i = 0, _len = heros.length; _i < _len; heroIndex = ++_i) {
                        hero = heros[heroIndex];
                        heroData = dataMgr.find(dataKey.heroTable, hero);
                        if (heroData != null) {
                            resHeroData = _.clone(heroData);
                            if (resHeroData.country === roleCountry) {
                                resHeroData.needSoul = parseInt(heroData.needSoul * 0.8);
                            }
                            resHeroData.skillData = dataMgr.find(dataKey.skillTable, heroData.skillId);
                            resHeroData.ownHero = heroSystem.existHeroByResId(hero);
                            resHeros.push(resHeroData);
                        }
                    }
                }
                return resHeros;
            };

            BarSystem.prototype.verifyLevel = function (barData) {
                return this.role_.getLevel() >= barData.level;
            };

            BarSystem.prototype.enoughSilver = function (barData) {
                return this.role_.isEnough("silver", barConfig[barData.soulType]);
            };

            BarSystem.prototype.enoughSilverOnekey = function (barData) {
                return this.role_.isEnough("silver", barConfig[barData.soulType] * 10);
            };

            BarSystem.prototype.canChoice = function () {
                return this.bar_.inProgress && this.bar_.index < BarSystem.maxHeros;
            };

            BarSystem.prototype.startChallenge = function (resId, heros, silver) {
                this.bar_.inProgress = true;
                this.bar_.resId = resId;
                this.bar_.index = 0;
                this.bar_.heros.push.apply(this.bar_.heros, heros);
                this.role_.change("silver", -silver);
                return this.emit(BarSystem.eventStartChallenge);
            };

            BarSystem.prototype.getWinSoul = function () {
                var heroData, heroId, winSoul;
                winSoul = 0;
                heroId = this.bar_.heros[this.bar_.index];
                heroData = dataMgr.find(dataKey.heroTable, hero.heroId);
                if (heroData != null) {
                    winSoul = heroData.giveSoul;
                }
                return winSoul;
            };

            BarSystem.prototype.executeResult = function (result, barData) {
                var giveSoul, heroData, heroId, returnSilver, soulType;
                if (result === 1) {
                    heroId = this.bar_.heros[this.bar_.index];
                    heroData = dataMgr.find(dataKey.heroTable, heroId);
                    if (heroData != null) {
                        soulType = heroData.soulType;
                        giveSoul = heroData.giveSoul;
                        this.role_.change(soulType, giveSoul);
                        ++this.bar_.index;
                        if (this.bar_.index === BarSystem.maxHeros) {
                            this.clearBar();
                            return this.emit(BarSystem.eventWinChallenge, soulType, giveSoul);
                        }
                    }
                } else if (result === -1) {
                    if (barData === void 0) {
                        barData = dataMgr.find(dataKey.bar, this.bar_.resId);
                    }
                    returnSilver = parseInt(barConfig.returnSilver[this.bar_.index] * barConfig[barData.soulType]);
                    this.role_.change("silver", returnSilver);
                    this.emit(BarSystem.eventFailChallenge, returnSilver);
                    return this.clearBar();
                }
            };

            BarSystem.prototype.clearBar = function () {
                this.bar_.inProgress = false;
                this.bar_.index = 0;
                this.bar_.resId = 0;
                return this.bar_.heros.splice(0, this.bar_.heros.length);
            };

            return BarSystem;

        })(EventEmitter);
        module.exports = BarSystem;
    }).call(this);
});

require.define("gameData/barConfig.json", function (require, module, exports, __dirname, __filename, process, global) {
    module.exports = {
        "blueSoul": 100,
        "purpleSoul": 150,
        "goldSoul": 300,
        "gold": 1,
        "returnSilver": [0.8, 0.6, 0.4]
    };
});

require.define("/game/clientHeroStarSystem.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var ClientHeroStarSystem, HeroStarSystem, OnRemoteCall, Prompt, attache, dataKey, dataMgr, heroStarConfig,
        __hasProp = {}.hasOwnProperty,
            __extends = function (child, parent) {
                for (var key in parent) {
                    if (__hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            };

        dataMgr = require("./dataMgr").dataMgr;

        dataKey = require("./dataMgr").dataKey;

        heroStarConfig = require("gameData/heroStarConfig");

        Prompt = require("gameData/prompt").heroStarSystem;

        OnRemoteCall = require("./utilities").OnRemoteCall;

        attache = require("attache.js");

        HeroStarSystem = require("./heroStarSystem");

        ClientHeroStarSystem = (function (_super) {

            __extends(ClientHeroStarSystem, _super);

            function ClientHeroStarSystem() {
                return ClientHeroStarSystem.__super__.constructor.apply(this, arguments);
            }

            ClientHeroStarSystem.eventUplevelSucceed = "uplevelSucceed";

            ClientHeroStarSystem.prototype.init = function () {
                var _this = this;
                OnRemoteCall(this, "upLevelHeroStar", this.socket_, "heroStarSystem");
                return attache.after(this, "upLevelHeroStar", (function () {
                    _this.role_.prompt(Prompt.heroStarSucceed);
                    return _this.emit(ClientHeroStarSystem.eventUplevelSucceed);
                }), true);
            };

            ClientHeroStarSystem.prototype.getPageData = function (page) {
                var dataTable, pageData, result;
                dataTable = dataMgr.getDataTable(dataKey.heroStar);
                pageData = heroStarConfig[page];
                result = [];
                if (pageData != null) {
                    result = dataTable.slice(pageData.start, pageData.end);
                }
                return result;
            };

            ClientHeroStarSystem.prototype.getCurrentPageData = function () {
                return this.getPageData(this.roleDb_.heroStarPage);
            };

            ClientHeroStarSystem.prototype.preUplevelHeroStar = function () {
                var heroStarData;
                heroStarData = this.getNextLevelData();
                if (heroStarData != null) {
                    if (this.role_.isEnough("potential", heroStarData.potential)) {
                        return this.socket_.emit("upLevelHeroStar");
                    } else {
                        return this.role_.prompt(Prompt.notEnoughPotential);
                    }
                }
            };
            return ClientHeroStarSystem;
        })(HeroStarSystem);
        module.exports = ClientHeroStarSystem;
    }).call(this);
});

require.define("gameData/heroStarConfig.json", function (require, module, exports, __dirname, __filename, process, global) {
    module.exports = [{
        "start": 0,
        "end": 10,
        "sence": ""
    }, {
        "start": 10,
        "end": 20,
        "sence": ""
    }, {
        "start": 20,
        "end": 35,
        "sence": ""
    }, {
        "start": 35,
        "end": 55,
        "sence": ""
    }, {
        "start": 55,
        "end": 75,
        "sence": ""
    }];
});

require.define("/game/heroStarSystem.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var EventEmitter, HeroStarSystem, callOriginFunc, dataKey, dataMgr, heroStarConfig,
        __hasProp = {}.hasOwnProperty,
            __extends = function (child, parent) {
                for (var key in parent) {
                    if (__hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            };

        dataMgr = require("./dataMgr").dataMgr;

        dataKey = require("./dataMgr").dataKey;

        EventEmitter = require('events').EventEmitter;

        heroStarConfig = require("gameData/heroStarConfig");

        callOriginFunc = require("./utilities").callOriginFunc;

        HeroStarSystem = (function (_super) {

            __extends(HeroStarSystem, _super);

            function HeroStarSystem(role_, socket_) {
                this.role_ = role_;
                this.socket_ = socket_;
                this.roleDb_ = this.role_.roleDb_;
            }

            HeroStarSystem.prototype.init = function () {};

            HeroStarSystem.prototype.getPage = function () {
                return this.roleDb_.heroStarPage;
            };

            HeroStarSystem.prototype.getIndex = function () {
                return this.roleDb_.heroStarIndex;
            };

            HeroStarSystem.prototype.getNextLevelData = function () {
                var dataTable, heroStarData, index, page;
                dataTable = dataMgr.getDataTable(dataKey.heroStar);
                page = this.roleDb_.heroStarPage;
                index = this.roleDb_.heroStarIndex;
                heroStarData = null;
                if (index < heroStarConfig[page].end - heroStarConfig[page].start) {
                    heroStarData = this.getHeroStarData(dataTable, page, index);
                } else if (page < heroStarConfig.length - 1) {
                    heroStarData = this.getHeroStarData(dataTable, page + 1, 0);
                }
                return heroStarData;
            };

            HeroStarSystem.prototype.getHeroStarData = function (dataTable, page, index) {
                var pageData;
                pageData = heroStarConfig[page];
                return dataTable[pageData.start + index];
            };

            HeroStarSystem.prototype.upLevelHeroStar = function () {
                var attr, baseAttr, baseRise, heroAttrs, heroData, heroStarData, herosys, index, key, mainHero, page, result, starMap, _i, _len;
                result = false;
                heroStarData = this.getNextLevelData();
                if ((heroStarData != null) && this.role_.isEnough("potential", heroStarData.potential)) {
                    page = this.roleDb_.heroStarPage;
                    index = this.roleDb_.heroStarIndex;
                    if (index < heroStarConfig[page].end - heroStarConfig[page].start) {
                        ++this.roleDb_.heroStarIndex;
                    } else if (page < heroStarConfig.length - 1) {
                        ++this.roleDb_.heroStarPage;
                        this.roleDb_.heroStarIndex = 0;
                    }
                    this.role_.change("potential", -heroStarData.potential);
                    if (heroStarData.type === 0) {
                        callOriginFunc(this.role_, "addRoleSkill", heroStarData.skillId);
                    } else {
                        heroAttrs = heroStarData.heroAttrs;
                        if (heroAttrs.length !== 0) {
                            starMap = this.roleDb_.starMap;
                            baseAttr = starMap.baseAttr;
                            baseRise = starMap.baseRise;
                            for (_i = 0, _len = heroAttrs.length; _i < _len; _i++) {
                                attr = heroAttrs[_i];
                                key = attr.key;
                                if (baseAttr[key] != null) {
                                    baseAttr[key] += attr.value;
                                } else if (baseRise[key] != null) {
                                    baseRise[key] += attr.value;
                                }
                            }
                            herosys = this.role_.getHeroSystem();
                            mainHero = herosys.getMainHeroObject();
                            heroData = mainHero.heroData_;
                            mainHero.calculateHeroDataAttr(heroData.baseAttr, heroData.baseRise);
                        }
                    }
                    result = true;
                }
                return result;
            };

            return HeroStarSystem;

        })(EventEmitter);
        module.exports = HeroStarSystem;
    }).call(this);
});

require.define("/game/clientRole.js", function (require, module, exports, __dirname, __filename, process, global) { // Generated by CoffeeScript 1.3.3
    (function () {
        var ClientBarSystem, ClientChapterSystem, ClientEmailSystem, ClientFriendSystem, ClientHeroStarSystem, ClientHeroSystem, ClientPackSystem, ClientPositionSystem, ClientRole, ClientTaskSystem, OnArrRemoteCall, OnRemoteCall, Role, attache, customsReward, emitEvent, rolePrompt, uniform, utilities, verifyName, _,
        __hasProp = {}.hasOwnProperty,
            __extends = function (child, parent) {
                for (var key in parent) {
                    if (__hasProp.call(parent, key)) child[key] = parent[key];
                }
                function ctor() {
                    this.constructor = child;
                }
                ctor.prototype = parent.prototype;
                child.prototype = new ctor();
                child.__super__ = parent.prototype;
                return child;
            };
        _ = require("underscore");
        Role = require("./role");
        ClientPackSystem = require("./clientPackSystem");
        ClientPositionSystem = require("./clientPositionSystem");
        ClientHeroSystem = require("./clientHeroSystem");
        ClientTaskSystem = require("./clientTaskSystem");
        ClientChapterSystem = require("./clientChapterSystem");
        ClientFriendSystem = require("./clientFriendSystem");
        ClientEmailSystem = require("./clientEmailSystem");
        ClientBarSystem = require("./clientBarSystem");
        ClientHeroStarSystem = require("./clientHeroStarSystem");
        rolePrompt = require("gameData/prompt").role;
        utilities = require("./utilities");
        OnRemoteCall = utilities.OnRemoteCall;
        OnArrRemoteCall = utilities.OnArrRemoteCall;
        emitEvent = utilities.emitEvent;
        attache = require("attache.js");
        verifyName = require("./gameAssist").verifyName;
        customsReward = require("gameData/gameConfig").customsReward;
        uniform = require("rand").uniform;
        ClientRole = (function (_super) {
            __extends(ClientRole, _super);
            ClientRole.eventRefreshSkillList = "refreshSkillList";
            ClientRole.eventWatchOtherRole = "watchOtherRole";
            ClientRole.eventSelectSkill = "selectSkill";
            function ClientRole(roleDb_, socket_) {
                ClientRole.__super__.constructor.call(this, roleDb_, socket_);
                this.packSystem_ = new ClientPackSystem(this, this.socket_);
                this.positionSystem_ = new ClientPositionSystem(this, this.socket_);
                this.heroSystem_ = new ClientHeroSystem(this, this.socket_);
                this.taskSystem_ = new ClientTaskSystem(this, this.socket_);
                this.chapterSystem_ = new ClientChapterSystem(this, this.socket_);
                this.friendSystem_ = new ClientFriendSystem(this, this.socket_);
                this.emailSystem_ = new ClientEmailSystem(this, this.socket_);
                this.barSystem_ = new ClientBarSystem(this, this.socket_);
                this.heroStarSystem_ = new ClientHeroStarSystem(this, this.socket_);
            }
            ClientRole.prototype.init = function () {
                var moduleName, skillFunc,
                _this = this;
                ClientRole.__super__.init.call(this);
                this.packSystem_.init();
                this.positionSystem_.init();
                this.heroSystem_.init();
                this.taskSystem_.init();
                this.chapterSystem_.init();
                this.friendSystem_.init();
                this.emailSystem_.init();
                this.barSystem_.init();
                this.heroStarSystem_.init();
                moduleName = Role.moduleName;
                skillFunc = Role.skillFunc;
                OnArrRemoteCall(this, skillFunc, this.socket_, moduleName);
                OnRemoteCall(this, "changeAndNotice", this.socket_, moduleName);
                attache.after(this, skillFunc, (function () {
                    return _this.emit(ClientRole.eventRefreshSkillList);
                }), true);
                attache.after(this, "selectSkill", (function () {
                    _this.prompt(rolePrompt.selectSkill);
                    return emitEvent(_this, ClientRole.eventSelectSkill, arguments);
                }), true);
                this.socket_.on("reward", _.bind(this.reward, this));
                return this.socket_.on("customsReward", function (oddsAward) {
                    return console.log(_this.getCustomsRewards(oddsAward));
                });
            };

            ClientRole.prototype.preSelectSkill = function (skillId) {
                if (_.isNumber(skillId) && skillId !== this.getHeroSystem().getMainHero().skillId) {
                    return this.socket_.emit("selectSkill", skillId);
                }
            };

            ClientRole.prototype.goHome = function () {
                return this.socket_.emit("goHome");
            };

            ClientRole.prototype.watchOtherRole = function (name) {
                var _this = this;
                if (verifyName(name) && name !== this.getName()) {
                    return this.socket_.emit("watchOtherRole", name, function (heroTable) {
                        if (_.isArray(heroTable)) {
                            console.log(heroTable);
                            return _this.emit("watchOtherRole", heroTable);
                        }
                    });
                }
            };

            ClientRole.prototype.chat = function (type, str, targetName) {
                if (_.isString(str) && str.length > Role.chatMax) {
                    str.length = Role.chatMax;
                }
                if (this.canChat(type, str)) {
                    if (type === "private") {
                        if (verifyName(targetName && targetName !== this.getName())) {
                            return this.socket_.emit("chat", type, str, targetName);
                        }
                    } else {
                        return this.socket_.emit("chat", type, str);
                    }
                }
            };

            ClientRole.prototype.reward = function (oddsAward, rewardType) {
                if (oddsAward != null) {
                    if (_.isNumber(oddsAward.exp)) {
                        this.getHeroSystem().changeHerosExp(oddsAward.exp);
                    }
                    this.changeMap(oddsAward.properties);
                    return this.getPackSystem().addItems(oddsAward.items);
                }
            };

            ClientRole.prototype.getCustomsRewards = function (oddsAward, index) {
                var armyRate, award, awards, exp, giftRate, i, properties, silver, _i;
                awards = [];
                exp = oddsAward.exp;
                silver = oddsAward.properties.silver;
                for (i = _i = 0; _i < 2; i = _i += 1) {
                    award = {};
                    award.properties = {};
                    if (_.isNumber(exp)) {
                        award.exp = exp - parseInt(exp * (uniform(0.2, 0.3)));
                    }
                    if (_.isNumber(silver)) {
                        award.properties.silver = silver - parseInt(silver * (uniform(0.2, 0.3)));
                    }
                    awards.push(award);
                }
                properties = oddsAward.properties;
                if (!_.isNumber(properties.gift)) {
                    giftRate = uniform(0, 100);
                    if (customsReward.giftRate < giftRate) {
                        awards[0].properties.gift = customsReward.gift;
                    }
                }
                if (!_.isNumber(properties.army)) {
                    armyRate = uniform(0, 100);
                    if (customsReward.armyRate < armyRate) {
                        awards[1].properties.army = customsReward.army;
                    }
                }
                if (_.isNumber(index) && index >= 0 && index <= 2) {
                    awards.splice(index, 0, oddsAward);
                } else {
                    awards.splice(0, 0, oddsAward);
                }
                return awards;
            };
            return ClientRole;

        })(Role);
        module.exports = ClientRole;
    }).call(this);
});
require("/game/clientRole.js");