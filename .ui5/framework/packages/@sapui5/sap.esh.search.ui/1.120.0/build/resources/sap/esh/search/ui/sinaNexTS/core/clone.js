/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define([], function () {
  function _createForOfIteratorHelper(o, allowArrayLike) {
    var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
    if (!it) {
      if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
        if (it) o = it;
        var i = 0;
        var F = function () {};
        return {
          s: F,
          n: function () {
            if (i >= o.length) return {
              done: true
            };
            return {
              done: false,
              value: o[i++]
            };
          },
          e: function (e) {
            throw e;
          },
          f: F
        };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var normalCompletion = true,
      didErr = false,
      err;
    return {
      s: function () {
        it = it.call(o);
      },
      n: function () {
        var step = it.next();
        normalCompletion = step.done;
        return step;
      },
      e: function (e) {
        didErr = true;
        err = e;
      },
      f: function () {
        try {
          if (!normalCompletion && it.return != null) it.return();
        } finally {
          if (didErr) throw err;
        }
      }
    };
  }
  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }
  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
    return arr2;
  }
  function _typeof(obj) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, _typeof(obj);
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }
  var Type;
  (function (Type) {
    Type["Primitive"] = "Primitive";
    Type["List"] = "List";
    Type["Object"] = "Object";
  })(Type || (Type = {}));
  var CloneBuffer = /*#__PURE__*/function () {
    function CloneBuffer() {
      _classCallCheck(this, CloneBuffer);
      this.cloneBuffer = [];
    }
    _createClass(CloneBuffer, [{
      key: "put",
      value: function put(object, clonedObject) {
        this.cloneBuffer.push({
          object: object,
          clonedObject: clonedObject
        });
      }
    }, {
      key: "get",
      value: function get(object) {
        var cloneBufferEntry = this.cloneBuffer.find(function (bufferEntry) {
          return bufferEntry.object === object;
        });
        if (!cloneBufferEntry) {
          return undefined;
        }
        return cloneBufferEntry.clonedObject;
      }
    }]);
    return CloneBuffer;
  }();
  var CloneService = /*#__PURE__*/function () {
    function CloneService(config) {
      _classCallCheck(this, CloneService);
      this.config = config !== null && config !== void 0 ? config : {
        classes: []
      };
    }
    _createClass(CloneService, [{
      key: "getType",
      value: function getType(obj) {
        if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean" || typeof obj === "undefined") {
          return Type.Primitive;
        }
        if (_typeof(obj) == "object") {
          if (Array.isArray(obj)) {
            return Type.List;
          } else {
            return Type.Object;
          }
        }
        throw "program error: unknown type"; // TODO
      }
    }, {
      key: "clone",
      value: function clone(obj) {
        this.buffer = new CloneBuffer();
        return this.internalClone(obj);
      }
    }, {
      key: "internalClone",
      value: function internalClone(obj) {
        switch (this.getType(obj)) {
          case Type.List:
            return this.cloneList(obj);
          case Type.Object:
            return this.cloneObject(obj);
          case Type.Primitive:
            return this.clonePrimitive(obj);
        }
      }
    }, {
      key: "cloneList",
      value: function cloneList(obj) {
        // check buffer for list
        var clonedList = this.buffer.get(obj);
        if (clonedList) {
          return clonedList;
        }
        // create new list
        clonedList = [];
        this.buffer.put(obj, clonedList);
        // clone list entries
        var _iterator = _createForOfIteratorHelper(obj),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var element = _step.value;
            if (!this.isCloneableObject(element)) {
              continue;
            }
            clonedList.push(this.internalClone(element));
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
        return clonedList;
      }
    }, {
      key: "cloneObject",
      value: function cloneObject(obj) {
        // check buffer for object
        var clonedObj = this.buffer.get(obj);
        if (clonedObj) {
          return clonedObj;
        }
        // create new object
        clonedObj = {};
        this.buffer.put(obj, clonedObj);
        // clone object properties
        for (var property in obj) {
          if (!this.isCloneableProperty(obj, property)) {
            continue;
          }
          clonedObj[property] = this.internalClone(obj[property]);
        }
        return clonedObj;
      }
    }, {
      key: "clonePrimitive",
      value: function clonePrimitive(obj) {
        return obj;
      }
    }, {
      key: "getClassConfig",
      value: function getClassConfig(obj) {
        if (this.classConfigCache && obj instanceof this.classConfigCache["class"]) {
          return this.classConfigCache;
        }
        this.classConfigCache = this.config.classes.find(function (classConfig) {
          return obj instanceof classConfig["class"];
        });
        return this.classConfigCache;
      }
    }, {
      key: "isCloneableObject",
      value: function isCloneableObject(obj) {
        if ((obj === null || obj === void 0 ? void 0 : obj.constructor) === Object) {
          return true; // plain objects
        }

        var classConfig = this.getClassConfig(obj);
        if (!classConfig) {
          return false;
        }
        return true;
      }
    }, {
      key: "isCloneableProperty",
      value: function isCloneableProperty(obj, property) {
        if ((obj === null || obj === void 0 ? void 0 : obj.constructor) === Object) {
          return true; // plain objects
        }

        var classConfig = this.getClassConfig(obj);
        if (!classConfig) {
          return false;
        }
        return classConfig.properties.indexOf(property) >= 0;
      }
    }]);
    return CloneService;
  }();
  var __exports = {
    __esModule: true
  };
  __exports.CloneService = CloneService;
  return __exports;
});
})();