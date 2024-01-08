/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["./SearchConfigurationSettings", "sap/base/Log", "./sinaNexTS/core/Log", "./navigationtrackers/CustomNavigationTracker", "./navigationtrackers/EventLoggerNavigationTracker"], function (___SearchConfigurationSettings, Log, ___sinaNexTS_core_Log, ___navigationtrackers_CustomNavigationTracker, ___navigationtrackers_EventLoggerNavigationTracker) {
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
  var sinaParameters = ___SearchConfigurationSettings["sinaParameters"];
  var Level = Log["Level"];
  var Severity = ___sinaNexTS_core_Log["Severity"];
  var generateCustomNavigationTracker = ___navigationtrackers_CustomNavigationTracker["generateCustomNavigationTracker"];
  var generateEventLoggerNavigationTracker = ___navigationtrackers_EventLoggerNavigationTracker["generateEventLoggerNavigationTracker"];
  var SinaConfigurator = /*#__PURE__*/function () {
    function SinaConfigurator(model) {
      _classCallCheck(this, SinaConfigurator);
      this.model = model;
    }
    _createClass(SinaConfigurator, [{
      key: "configure",
      value: function configure(sinaConfigurations) {
        var resultSinaConfigurations = [];
        var _iterator = _createForOfIteratorHelper(sinaConfigurations),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var sinaConfiguration = _step.value;
            resultSinaConfigurations.push(this.configureSina(sinaConfiguration, {
              configureLogging: true,
              configureCommonParameters: true,
              configureNavigationTracckers: true
            }));
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
        return resultSinaConfigurations;
      }
    }, {
      key: "configureSina",
      value: function configureSina(sinaConfiguration, configurationOptions) {
        var _this = this;
        sinaConfiguration = this.normalizeConfiguration(sinaConfiguration);
        if (configurationOptions.configureCommonParameters) {
          this.configureCommonParameters(sinaConfiguration);
        }
        if (configurationOptions.configureLogging) {
          this.configureLogging(sinaConfiguration);
        }
        if (configurationOptions.configureNavigationTracckers) {
          this.configureNavigationTracking(sinaConfiguration);
        }
        if (sinaConfiguration.subProviders) {
          sinaConfiguration.subProviders = sinaConfiguration.subProviders.map(function (subProviderConfiguration) {
            return _this.configureSina(subProviderConfiguration, {
              configureNavigationTracckers: true
            });
          });
        }
        return sinaConfiguration;
      }
    }, {
      key: "normalizeConfiguration",
      value: function normalizeConfiguration(sinaConfiguration) {
        if (typeof sinaConfiguration === "string") {
          return {
            provider: sinaConfiguration,
            url: ""
          };
        }
        return sinaConfiguration;
      }
    }, {
      key: "configureNavigationTracking",
      value: function configureNavigationTracking(sinaConfiguration) {
        sinaConfiguration.navigationTrackers = sinaConfiguration.navigationTrackers || [];
        sinaConfiguration.navigationTrackers.push(generateCustomNavigationTracker(this.model));
        sinaConfiguration.navigationTrackers.push(generateEventLoggerNavigationTracker(this.model));
      }
    }, {
      key: "configureCommonParameters",
      value: function configureCommonParameters(sinaConfiguration) {
        var _iterator2 = _createForOfIteratorHelper(sinaParameters),
          _step2;
        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var parameterName = _step2.value;
            if (!sinaConfiguration[parameterName]) {
              sinaConfiguration[parameterName] = this.model.config[parameterName];
            }
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
      }
    }, {
      key: "configureLogging",
      value: function configureLogging(sinaConfiguration) {
        var sinaUI5Log = Log.getLogger("sap.esh.search.ui.eshclient");
        // log target
        sinaConfiguration.logTarget = {
          debug: sinaUI5Log.debug,
          info: sinaUI5Log.info,
          warn: sinaUI5Log.warning,
          error: sinaUI5Log.error
        };
        // map UI5 loglevel to Sina loglevel:
        var sinaLogLevel = Severity.ERROR;
        switch (sinaUI5Log.getLevel()) {
          case Level.ALL:
          case Level.TRACE:
          case Level.DEBUG:
            sinaLogLevel = Severity.DEBUG;
            break;
          case Level.INFO:
            sinaLogLevel = Severity.INFO;
            break;
          case Level.WARNING:
            sinaLogLevel = Severity.WARN;
            break;
        }
        sinaConfiguration.logLevel = sinaLogLevel;
      }
    }]);
    return SinaConfigurator;
  }();
  var __exports = {
    __esModule: true
  };
  __exports.SinaConfigurator = SinaConfigurator;
  return __exports;
});
})();