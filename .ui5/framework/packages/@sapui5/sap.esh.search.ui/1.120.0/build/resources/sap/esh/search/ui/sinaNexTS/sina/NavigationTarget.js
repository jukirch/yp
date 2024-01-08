/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["./SinaObject"], function (___SinaObject) {
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
  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    Object.defineProperty(subClass, "prototype", {
      writable: false
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }
  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
    return _setPrototypeOf(o, p);
  }
  function _createSuper(Derived) {
    var hasNativeReflectConstruct = _isNativeReflectConstruct();
    return function _createSuperInternal() {
      var Super = _getPrototypeOf(Derived),
        result;
      if (hasNativeReflectConstruct) {
        var NewTarget = _getPrototypeOf(this).constructor;
        result = Reflect.construct(Super, arguments, NewTarget);
      } else {
        result = Super.apply(this, arguments);
      }
      return _possibleConstructorReturn(this, result);
    };
  }
  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    } else if (call !== void 0) {
      throw new TypeError("Derived constructors may only return object or undefined");
    }
    return _assertThisInitialized(self);
  }
  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return self;
  }
  function _isNativeReflectConstruct() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;
    try {
      Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
      return true;
    } catch (e) {
      return false;
    }
  }
  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }
  /*!
   * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	
   */
  var SinaObject = ___SinaObject["SinaObject"];
  var NavigationTarget = /*#__PURE__*/function (_SinaObject) {
    _inherits(NavigationTarget, _SinaObject);
    var _super = _createSuper(NavigationTarget);
    function NavigationTarget(properties) {
      var _properties$targetUrl, _properties$targetFun, _properties$text, _properties$icon, _properties$tooltip, _ref, _properties$target;
      var _this;
      _classCallCheck(this, NavigationTarget);
      _this = _super.call(this, properties);
      _this.targetUrl = (_properties$targetUrl = properties.targetUrl) !== null && _properties$targetUrl !== void 0 ? _properties$targetUrl : _this.targetUrl;
      _this.targetFunction = (_properties$targetFun = properties.targetFunction) !== null && _properties$targetFun !== void 0 ? _properties$targetFun : _this.targetFunction;
      _this.customWindowOpenFunction = properties.customWindowOpenFunction;
      _this.text = (_properties$text = properties.text) !== null && _properties$text !== void 0 ? _properties$text : _this.text;
      _this.icon = (_properties$icon = properties.icon) !== null && _properties$icon !== void 0 ? _properties$icon : _this.icon;
      _this.tooltip = (_properties$tooltip = properties.tooltip) !== null && _properties$tooltip !== void 0 ? _properties$tooltip : _this.tooltip;
      _this.target = (_ref = (_properties$target = properties.target) !== null && _properties$target !== void 0 ? _properties$target : _this.target) !== null && _ref !== void 0 ? _ref : "_self";
      return _this;
    }
    _createClass(NavigationTarget, [{
      key: "trackNavigation",
      value: function trackNavigation() {
        var _this$sina, _this$sina$configurat;
        var navigationTrackers = (_this$sina = this.sina) === null || _this$sina === void 0 ? void 0 : (_this$sina$configurat = _this$sina.configuration) === null || _this$sina$configurat === void 0 ? void 0 : _this$sina$configurat.navigationTrackers;
        if (!navigationTrackers) {
          return;
        }
        var _iterator = _createForOfIteratorHelper(navigationTrackers),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var navigationTracker = _step.value;
            navigationTracker(this);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
    }, {
      key: "performNavigation",
      value: function performNavigation(params) {
        params = params || {};
        var trackingOnly = params.trackingOnly || false;
        this.trackNavigation();
        if (trackingOnly) {
          return;
        }
        if (this.targetFunction) {
          var _params;
          // 1) js target function
          this.targetFunction((_params = params) === null || _params === void 0 ? void 0 : _params.event);
        } else {
          // 2) url
          if (this.customWindowOpenFunction) {
            this.customWindowOpenFunction();
            return;
          }
          if (this.target) {
            window.open(this.targetUrl, this.target, "noopener,noreferrer");
          } else {
            window.open(this.targetUrl, "_blank", "noopener,noreferrer");
          }
        }
      }
    }, {
      key: "isEqualTo",
      value: function isEqualTo(otherNavigationObject) {
        if (!otherNavigationObject) {
          return false;
        }
        return this.targetUrl == otherNavigationObject.targetUrl && this.targetFunction === otherNavigationObject.targetFunction;
      }
    }]);
    return NavigationTarget;
  }(SinaObject);
  var __exports = {
    __esModule: true
  };
  __exports.NavigationTarget = NavigationTarget;
  return __exports;
});
})();