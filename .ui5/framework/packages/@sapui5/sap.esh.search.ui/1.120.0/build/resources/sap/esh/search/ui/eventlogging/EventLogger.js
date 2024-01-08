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
function _catch(body, recover) {
  try {
    var result = body();
  } catch (e) {
    return recover(e);
  }
  if (result && result.then) {
    return result.then(void 0, recover);
  }
  return result;
}
function _continueIgnored(value) {
  if (value && value.then) {
    return value.then(_empty);
  }
}
function _continue(value, then) {
  return value && value.then ? value.then(then) : then(value);
}
sap.ui.define(["sap/base/Log", "sap/esh/search/ui/eventlogging/UsageAnalyticsConsumerSina", "sap/esh/search/ui/flp/UsageAnalyticsConsumerFlp"], function (Log, UsageAnalyticsConsumerSina, UsageAnalyticsConsumerFlp) {
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
  var EventLogger = /*#__PURE__*/function () {
    function EventLogger(properties) {
      _classCallCheck(this, EventLogger);
      _defineProperty(this, "consumers", []);
      _defineProperty(this, "log", Log.getLogger("sap.esh.search.ui.eventlogging.EventLogger"));
      this.searchModel = properties.searchModel;
      this.sinaNext = properties.sinaNext;
      var _iterator = _createForOfIteratorHelper(properties.eventConsumers),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var consumer = _step.value;
          this.addConsumer(consumer);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }

    /**
     * Async initialization of "internal" event consumers sina and flp
     */
    _createClass(EventLogger, [{
      key: "initAsync",
      value: function initAsync() {
        try {
          const _this = this;
          return _await(_continue(_catch(function () {
            return _invokeIgnored(function () {
              if (_this.searchModel.config.isUshell) {
                var consumerFlp = new UsageAnalyticsConsumerFlp();
                return _await(consumerFlp.initAsync(), function () {
                  _this.addConsumer(consumerFlp);
                });
              }
            });
          }, function (e) {
            _this.log.debug("Couldn't initialize flp user event consumer", e);
          }), function () {
            return _continueIgnored(_catch(function () {
              var sinaConsumer = new UsageAnalyticsConsumerSina(_this.sinaNext);
              return _await(sinaConsumer.initAsync(), function () {
                _this.addConsumer(sinaConsumer);
              });
            }, function (e) {
              _this.log.debug("Couldn't initialize sina user event consumer", e);
            }));
          }));
        } catch (e) {
          return Promise.reject(e);
        }
      }
    }, {
      key: "addConsumer",
      value: function addConsumer(consumer) {
        this.consumers.push(consumer);
        this.log.debug("[".concat(consumer.label, "] Event consumer added"));
      }
    }, {
      key: "setConsumers",
      value: function setConsumers(consumers) {
        var _iterator2 = _createForOfIteratorHelper(consumers),
          _step2;
        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var consumer = _step2.value;
            this.addConsumer(consumer);
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
      }
    }, {
      key: "logEvent",
      value: function logEvent(event) {
        var _event$timeStamp;
        event.sessionId = EventLogger.sessionId;
        event.timeStamp = (_event$timeStamp = event.timeStamp) !== null && _event$timeStamp !== void 0 ? _event$timeStamp : new Date().getTime().toString();
        event.eventNumber = EventLogger.eventNumber++;
        for (var i = 0; i < this.consumers.length; ++i) {
          var consumer = this.consumers[i];
          try {
            consumer.logEvent(event);
            this.log.debug("[".concat(consumer.label, "] Logged user event ").concat(event.type));
          } catch (err) {
            this.log.debug("[".concat(consumer.label, "] Error while logging user event ").concat(event.type), err.stack || err);
          }
        }
      }
    }]);
    return EventLogger;
  }();
  _defineProperty(EventLogger, "eventNumber", 0);
  _defineProperty(EventLogger, "sessionId", new Date().getTime().toString());
  return EventLogger;
});
})();