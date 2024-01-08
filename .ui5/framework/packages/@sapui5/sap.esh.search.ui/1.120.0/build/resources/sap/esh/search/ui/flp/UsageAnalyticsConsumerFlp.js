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
function _empty() {}
function _invokeIgnored(body) {
  var result = body();
  if (result && result.then) {
    return result.then(_empty);
  }
}
sap.ui.define(["../eventlogging/UserEvents", "../eventlogging/EventConsumer", "../suggestions/SuggestionType", "sap/base/Log"], function (___eventlogging_UserEvents, __EventConsumer, __SuggestionType, Log) {
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
  /*!
   * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	
   */
  var UserEventType = ___eventlogging_UserEvents["UserEventType"];
  var EventConsumer = _interopRequireDefault(__EventConsumer);
  var SuggestionType = _interopRequireDefault(__SuggestionType);
  /**
   * Usage Analytics Event Consumer for Fiori Launchpad
   */
  var UsageAnalyticsConsumerFlp = /*#__PURE__*/function (_EventConsumer) {
    _inherits(UsageAnalyticsConsumerFlp, _EventConsumer);
    var _super = _createSuper(UsageAnalyticsConsumerFlp);
    function UsageAnalyticsConsumerFlp() {
      var _this;
      _classCallCheck(this, UsageAnalyticsConsumerFlp);
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _super.call.apply(_super, [this].concat(args));
      _defineProperty(_assertThisInitialized(_this), "log", Log.getLogger("sap.esh.search.ui.eventlogging.UsageAnalyticsConsumerFlp"));
      _defineProperty(_assertThisInitialized(_this), "actionPrefix", "FLP: ");
      _defineProperty(_assertThisInitialized(_this), "label", "FLP");
      return _this;
    }
    _createClass(UsageAnalyticsConsumerFlp, [{
      key: "initAsync",
      value: function initAsync() {
        try {
          const _this2 = this;
          var _window$sap, _window$sap$ushell;
          return _await(_invokeIgnored(function () {
            if ((_window$sap = window.sap) !== null && _window$sap !== void 0 && (_window$sap$ushell = _window$sap.ushell) !== null && _window$sap$ushell !== void 0 && _window$sap$ushell.Container) {
              return _await(window.sap.ushell.Container.getServiceAsync("UsageAnalytics"), function (_window$sap$ushell$Co) {
                _this2.analytics = _window$sap$ushell$Co;
              });
            }
          }));
        } catch (e) {
          return Promise.reject(e);
        }
      }
    }, {
      key: "logEvent",
      value: function logEvent(event) {
        if (!this.analytics) {
          return;
        }
        switch (event.type) {
          case UserEventType.RESULT_LIST_ITEM_NAVIGATE:
            this.analytics.logCustomEvent("".concat(this.actionPrefix, "Search"), "Launch Object", [event.targetUrl]);
            break;
          case UserEventType.RESULT_LIST_ITEM_ATTRIBUTE_NAVIGATE:
            this.analytics.logCustomEvent("".concat(this.actionPrefix, "Search"), "Launch Object", [event.targetUrl]);
            break;
          case UserEventType.SUGGESTION_SELECT:
            switch (event.suggestionType) {
              case SuggestionType.App:
                this.analytics.logCustomEvent("".concat(this.actionPrefix, "Search"), "Suggestion Select App", [event.suggestionTitle, event.targetUrl, event.searchTerm]);
                this.analytics.logCustomEvent("".concat(this.actionPrefix, "Application Launch point"), "Search Suggestions", [event.suggestionTitle, event.targetUrl, event.searchTerm]);
                break;
              case SuggestionType.DataSource:
                this.analytics.logCustomEvent("".concat(this.actionPrefix, "Search"), "Suggestion Select Datasource", [event.dataSourceKey, event.searchTerm]);
                break;
              case SuggestionType.Object:
                this.analytics.logCustomEvent("".concat(this.actionPrefix, "Search"), "Suggestion Select Object Data", [event.suggestionTerm, event.dataSourceKey, event.searchTerm]);
                break;
              case SuggestionType.Recent:
                this.analytics.logCustomEvent("".concat(this.actionPrefix, "Search"), "Suggestion Select Object Data", [event.suggestionTerm, event.dataSourceKey, event.searchTerm]);
                break;
            }
            break;
          case UserEventType.SEARCH_REQUEST:
            this.analytics.logCustomEvent("".concat(this.actionPrefix, "Search"), "Search", [event.searchTerm, event.dataSourceKey]);
            break;
          case UserEventType.RESULT_LIST_ITEM_NAVIGATE_CONTEXT:
            this.analytics.logCustomEvent("".concat(this.actionPrefix, "Search"), "Launch Related Object", [event.targetUrl]);
            break;
          case UserEventType.SUGGESTION_REQUEST:
            this.analytics.logCustomEvent("".concat(this.actionPrefix, "Search"), "Suggestion", [event.suggestionTerm, event.dataSourceKey]);
            break;
          case UserEventType.TILE_NAVIGATE:
            this.analytics.logCustomEvent("".concat(this.actionPrefix, "Search"), "Launch App", [event.tileTitle, event.targetUrl]);
            this.analytics.logCustomEvent("".concat(this.actionPrefix, "Application Launch point"), "Search Results", [event.tileTitle, event.targetUrl]);
            break;
        }
        this.log.debug("[".concat(this.label, "] Logged user event ").concat(event.type));
      }
    }]);
    return UsageAnalyticsConsumerFlp;
  }(EventConsumer);
  return UsageAnalyticsConsumerFlp;
});
})();