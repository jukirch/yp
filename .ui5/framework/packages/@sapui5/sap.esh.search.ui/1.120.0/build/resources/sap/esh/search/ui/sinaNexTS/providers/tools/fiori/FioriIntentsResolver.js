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
function _call(body, then, direct) {
  if (direct) {
    return then ? then(body()) : body();
  }
  try {
    var result = Promise.resolve(body());
    return then ? result.then(then) : result;
  } catch (e) {
    return Promise.reject(e);
  }
}
function _invoke(body, then) {
  var result = body();
  if (result && result.then) {
    return result.then(then);
  }
  return then(result);
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
sap.ui.define(["../../../sina/SinaObject", "../../../sina/AttributeType", "./NavigationServiceFactory"], function (_____sina_SinaObject, _____sina_AttributeType, ___NavigationServiceFactory) {
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
  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
  }
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
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
  function _iterableToArrayLimit(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _s, _e;
    try {
      for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);
        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }
    return _arr;
  }
  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
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
  var SinaObject = _____sina_SinaObject["SinaObject"];
  var AttributeType = _____sina_AttributeType["AttributeType"];
  var getNavigationService = ___NavigationServiceFactory["getNavigationService"];
  var FioriIntentsResolver = /*#__PURE__*/function (_SinaObject) {
    _inherits(FioriIntentsResolver, _SinaObject);
    var _super = _createSuper(FioriIntentsResolver);
    function FioriIntentsResolver(properties) {
      var _window, _window$sap, _window$sap$ushell;
      var _this;
      _classCallCheck(this, FioriIntentsResolver);
      _this = _super.call(this, properties);
      var uShellContainer = typeof window !== "undefined" ? (_window = window) === null || _window === void 0 ? void 0 : (_window$sap = _window.sap) === null || _window$sap === void 0 ? void 0 : (_window$sap$ushell = _window$sap.ushell) === null || _window$sap$ushell === void 0 ? void 0 : _window$sap$ushell["Container"] : null; // not available for sina on node.js
      if (uShellContainer) {
        _this._fioriFrontendSystemInfo = {
          systemId: uShellContainer.getLogonSystem().getName(),
          client: uShellContainer.getLogonSystem().getClient()
        };
        _this._primaryIntentAction = "-displayFactSheet";
        _this._suppressInSearchTag = "suppressInEnterpriseSearch".toLowerCase();
      } else {
        _this._fioriFrontendSystemInfo = {
          systemId: _this.getLogonSystem().getName(),
          client: _this.getLogonSystem().getClient()
        };
      }
      return _this;
    }
    _createClass(FioriIntentsResolver, [{
      key: "resolveIntents",
      value: function resolveIntents(vArgs) {
        const _this3 = this;
        var _this2 = _this3;
        // check navigation service
        return _call(getNavigationService, function (navigationService) {
          if (!navigationService || !vArgs) {
            return {
              defaultNavigationTarget: vArgs.fallbackDefaultNavigationTarget
            };
          }
          if (Array.isArray(vArgs)) {
            // mass request
            var promises = vArgs.map(function (_vArgs) {
              return _this2.doResolveIntents(_vArgs);
            });
            return _await(Promise.all(promises));
          } else {
            // single object request
            return _await(_this3.doResolveIntents(vArgs));
          }
        });
      }
    }, {
      key: "doResolveIntents",
      value: function doResolveIntents(options) {
        try {
          var _await$Promise$all, _await$Promise$all2, primaryIntent, secondaryIntents;
          const _this4 = this;
          // destructuring of input parameters
          var semanticObjectType = options.semanticObjectType;
          var semanticObjectTypeAttrs = options.semanticObjectTypeAttributes;
          var systemId = options.systemId;
          var client = options.client;
          var fallbackDefaultNavigationTarget = options.fallbackDefaultNavigationTarget;

          // no semantic object type -> return fallback navigation target
          if (!semanticObjectType || semanticObjectType.length === 0) {
            return _await({
              defaultNavigationTarget: fallbackDefaultNavigationTarget
            });
          }

          // no semantic object type attributes -> return undefined (TODO: why not fallback navigation target?)
          if (!semanticObjectTypeAttrs || semanticObjectTypeAttrs.length === 0) {
            return _await(undefined);
          }

          // convert semantic object type params into format suitable for navigation service
          var semanticObjectTypeAttrsAsParams = _this4.convertSemanticObjectTypeAttrs(semanticObjectTypeAttrs);

          // fetch primary intent & secondary intents
          return _await(Promise.all([_this4.getPrimaryIntent(semanticObjectType, semanticObjectTypeAttrsAsParams), _this4.getSecondaryIntents(semanticObjectType, semanticObjectTypeAttrsAsParams)]), function (_Promise$all2) {
            _await$Promise$all = _Promise$all2;
            _await$Promise$all2 = _slicedToArray(_await$Promise$all, 2);
            primaryIntent = _await$Promise$all2[0];
            secondaryIntents = _await$Promise$all2[1]; // create result structure
            var result = {
              defaultNavigationTarget: undefined,
              navigationTargets: []
            };

            // assemble sap system
            var sapSystem = _this4.assembleSapSystem(systemId, client);

            // assemble default navigation target from primary intent
            var defaultNavigationTarget;
            return _invoke(function () {
              if (primaryIntent && !_this4.shallIntentBeSuppressed(primaryIntent)) {
                return _await(_this4.getNavigationTargetForIntent(primaryIntent, sapSystem), function (_this4$getNavigationT) {
                  defaultNavigationTarget = _this4$getNavigationT;
                  result.defaultNavigationTarget = defaultNavigationTarget;
                });
              }
            }, function () {
              var primaryIntentExists = result.defaultNavigationTarget !== undefined;

              // assemble additional navigation targets from secondary intents
              if (!secondaryIntents) {
                return result;
              }
              var validSecondaryIntents = [];
              var validNavigationTargetPromises = [];
              var _iterator = _createForOfIteratorHelper(secondaryIntents),
                _step;
              try {
                for (_iterator.s(); !(_step = _iterator.n()).done;) {
                  var secondaryIntent = _step.value;
                  if (_this4.shallIntentBeSuppressed(secondaryIntent)) {
                    continue;
                  }
                  validSecondaryIntents.push(secondaryIntent);
                  validNavigationTargetPromises.push(_this4.getNavigationTargetForIntent(secondaryIntent, sapSystem));
                }
              } catch (err) {
                _iterator.e(err);
              } finally {
                _iterator.f();
              }
              return _await(Promise.all(validNavigationTargetPromises), function (validNavigationTargets) {
                for (var i = 0; i < validSecondaryIntents.length; ++i) {
                  var validSecondaryIntent = validSecondaryIntents[i];
                  var validNavigationTarget = validNavigationTargets[i];
                  if (!primaryIntentExists && _this4.isPrimaryIntentAction(validSecondaryIntent)) {
                    result.defaultNavigationTarget = validNavigationTarget;
                    primaryIntentExists = true;
                  } else if (!defaultNavigationTarget || !validNavigationTarget.isEqualTo(defaultNavigationTarget)) {
                    result.navigationTargets.push(validNavigationTarget);
                  }
                }
                return result;
              });
            });
          });
        } catch (e) {
          return Promise.reject(e);
        }
      }
    }, {
      key: "isPrimaryIntentAction",
      value: function isPrimaryIntentAction(intent) {
        var action = intent.intent.substring(intent.intent.indexOf("-"), intent.intent.indexOf("?"));
        return action === this._primaryIntentAction;
      }
    }, {
      key: "assembleSapSystem",
      value: function assembleSapSystem(systemId, client) {
        // Set sap-system parameter if:
        // 0) we run on cFLP in the cloud which is indicated by the global variable sap.cf
        // 1) systemId or client from search response are not undefined or empty
        // 2) fioriFrontendSystemInfo is *NOT* set
        // 3) fioriFrontendSystemInfo is set, but it contains different systemId and client info than the search response
        // TODO: this comment is misleading because it neglects the AND, OR conjunctions
        var sapSystem = {
          systemId: systemId || this._fioriFrontendSystemInfo && this._fioriFrontendSystemInfo.systemId,
          client: client || this._fioriFrontendSystemInfo.client && this._fioriFrontendSystemInfo.client
        };
        if (window.sap && window.sap["cf"] ||
        // 0)
        systemId && systemId.trim().length > 0 && client && client.trim().length > 0 && (
        // 1)
        !this._fioriFrontendSystemInfo ||
        // 2)
        !(this._fioriFrontendSystemInfo.systemId === systemId && this._fioriFrontendSystemInfo.client === client))) {
          // 3)
          sapSystem.urlParameter = "sap-system=sid(" + systemId + "." + client + ")";
        }
        return sapSystem;
      }
    }, {
      key: "convertSemanticObjectTypeAttrs",
      value: function convertSemanticObjectTypeAttrs(semanticObjectTypeAttrs) {
        var semanticObjectTypeAttrsAsParams = {};
        var _iterator2 = _createForOfIteratorHelper(semanticObjectTypeAttrs),
          _step2;
        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var semanticObjectTypeAttr = _step2.value;
            var value = this.convertAttributeValueToUI5DataTypeFormats(semanticObjectTypeAttr.value, semanticObjectTypeAttr.type);
            semanticObjectTypeAttrsAsParams[semanticObjectTypeAttr.name] = value;
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
        return semanticObjectTypeAttrsAsParams;
      }
    }, {
      key: "getPrimaryIntent",
      value: function getPrimaryIntent(semanticObjectType, semanticObjectTypeAttrsAsParams) {
        const _this5 = this;
        return _call(getNavigationService, function (navigationService) {
          return !navigationService || !navigationService.getPrimaryIntent ? undefined : _catch(function () {
            return _await(_this5.convertJQueryDeferredToPromise(navigationService.getPrimaryIntent(semanticObjectType, semanticObjectTypeAttrsAsParams)));
          }, function () {
            return undefined; // TODO logging
          });
        });
      }
    }, {
      key: "getSecondaryIntents",
      value: function getSecondaryIntents(semanticObjectType, semanticObjectTypeAttrsAsParams) {
        const _this6 = this;
        return _call(getNavigationService, function (navigationService) {
          return navigationService ? navigationService.getLinks ? _catch(function () {
            return _await(_this6.convertJQueryDeferredToPromise(navigationService.getLinks({
              semanticObject: semanticObjectType,
              params: semanticObjectTypeAttrsAsParams,
              withAtLeastOneUsedParam: true,
              sortResultOnTexts: true
            })));
          }, function () {
            return undefined; // TODO logging
          }) : undefined : undefined;
        });
      }
    }, {
      key: "shallIntentBeSuppressed",
      value: function shallIntentBeSuppressed(intent) {
        if (intent.tags) {
          for (var i = 0; i < intent.tags.length; i++) {
            if (intent.tags[i].toLowerCase() === this._suppressInSearchTag) {
              return true;
            }
          }
        }
        return false;
      }
    }, {
      key: "getNavigationTargetForIntent",
      value: function getNavigationTargetForIntent(intent, sapSystem) {
        const _this7 = this;
        return _call(getNavigationService, function (navigationService) {
          var that = _this7;
          var shellHash = intent.intent;
          if (sapSystem.urlParameter) {
            if (shellHash.indexOf("?") === -1) {
              shellHash += "?";
            } else {
              shellHash += "&";
            }
            shellHash += sapSystem.urlParameter;
          }
          var externalTarget = {
            target: {
              shellHash: shellHash
            }
          };
          return _await(_this7.convertJQueryDeferredToPromise(navigationService.hrefForExternalAsync(externalTarget)), function (externalHash) {
            var navigationObject = that.sina._createNavigationTarget({
              text: intent.text,
              targetUrl: externalHash,
              customWindowOpenFunction: function customWindowOpenFunction() {
                navigationService.toExternal(externalTarget);
              }
            });
            return navigationObject;
          });
        });
      }
    }, {
      key: "convertAttributeValueToUI5DataTypeFormats",
      value: function convertAttributeValueToUI5DataTypeFormats(value, sinaAttributeType) {
        var year, month, day, hour, minute, seconds, microseconds;
        switch (sinaAttributeType) {
          case AttributeType.Timestamp:
            // sina: JavaScript Date object
            // UI5: "YYYY-MM-DDTHH:MM:SS.mmm"
            year = value.getUTCFullYear();
            month = value.getUTCMonth() + 1;
            day = value.getUTCDate();
            hour = value.getUTCHours();
            minute = value.getUTCMinutes();
            seconds = value.getUTCSeconds();
            microseconds = value.getUTCMilliseconds() * 1000;
            value = this.addLeadingZeros(year.toString(), 4) + "-" + this.addLeadingZeros(month.toString(), 2) + "-" + this.addLeadingZeros(day.toString(), 2) + "T" + this.addLeadingZeros(hour.toString(), 2) + ":" + this.addLeadingZeros(minute.toString(), 2) + ":" + this.addLeadingZeros(seconds.toString(), 2) + "." + this.addLeadingZeros(microseconds.toString(), 3);
            break;
          case AttributeType.Date:
            // sina: JavaScript Date object
            // UI5: "YYYY-MM-DD"
            value = value.slice(0, 4) + "-" + value.slice(5, 7) + "-" + value.slice(8, 10);
            break;
        }
        return value;
      }
    }, {
      key: "addLeadingZeros",
      value: function addLeadingZeros(value, length) {
        return "00000000000000".slice(0, length - value.length) + value;
      }
    }, {
      key: "getLogonSystem",
      value: function getLogonSystem() {
        return {
          getName: function getName() {
            return;
          },
          getClient: function getClient() {
            return;
          },
          getPlatform: function getPlatform() {
            return;
          }
        };
      }
    }, {
      key: "convertJQueryDeferredToPromise",
      value: function convertJQueryDeferredToPromise(deferred) {
        if (deferred.always) {
          // is deferred, convert needed
          return new Promise(function (resolve, reject) {
            deferred.then(resolve, reject);
          });
        } else {
          // is promise, convert not needed
          return deferred;
        }
      }
    }]);
    return FioriIntentsResolver;
  }(SinaObject);
  var __exports = {
    __esModule: true
  };
  __exports.FioriIntentsResolver = FioriIntentsResolver;
  return __exports;
});
})();