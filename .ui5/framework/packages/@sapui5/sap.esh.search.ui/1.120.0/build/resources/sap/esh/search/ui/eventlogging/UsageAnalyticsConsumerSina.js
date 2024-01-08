/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
function _await(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }
  if (!value || !value.then) {
    value = Promise.resolve(value);
  }
  return then ? value.then(then) : value;
}
sap.ui.define(["sap/base/Log", "./EventConsumer"], function (Log, __EventConsumer) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
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
  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  var EventConsumer = _interopRequireDefault(__EventConsumer);
  /**
   * Sina Usage Analytics Event Consumer.
   * Currently implementations are only available for abap_odata and InAV2 providers.
   * It is up to other sina providers to implement the logUserEvent method.
   */
  var UsageAnalyticsConsumerSina = /*#__PURE__*/function (_EventConsumer) {
    _inherits(UsageAnalyticsConsumerSina, _EventConsumer);
    var _super = _createSuper(UsageAnalyticsConsumerSina);
    function UsageAnalyticsConsumerSina(sinaNext) {
      var _this;
      _classCallCheck(this, UsageAnalyticsConsumerSina);
      _this = _super.call(this);
      _defineProperty(_assertThisInitialized(_this), "label", "sina");
      _defineProperty(_assertThisInitialized(_this), "isLoggingEnabled", false);
      _defineProperty(_assertThisInitialized(_this), "log", Log.getLogger("sap.esh.search.ui.eventlogging.UsageAnalyticsConsumerSina"));
      _this.sinaNext = sinaNext;
      return _this;
    }
    _createClass(UsageAnalyticsConsumerSina, [{
      key: "initAsync",
      value: function initAsync() {
        try {
          const _this2 = this;
          return _await(_this2.sinaNext.getConfigurationAsync(), function (sinaConfig) {
            if (sinaConfig.personalizedSearch) {
              _this2.isLoggingEnabled = true;
              _this2.log.debug("sina usage analytics consumer is enabled");
            } else {
              _this2.log.debug("sina usage analytics consumer is disabled");
            }
          });
        } catch (e) {
          return Promise.reject(e);
        }
      }
    }, {
      key: "logEvent",
      value: function logEvent(event) {
        if (this.isLoggingEnabled) {
          this.sinaNext.logUserEvent(event);
          this.log.debug("[".concat(this.label, "] Logged user event ").concat(event.type));
        }
      }
    }]);
    return UsageAnalyticsConsumerSina;
  }(EventConsumer);
  return UsageAnalyticsConsumerSina;
});
})();