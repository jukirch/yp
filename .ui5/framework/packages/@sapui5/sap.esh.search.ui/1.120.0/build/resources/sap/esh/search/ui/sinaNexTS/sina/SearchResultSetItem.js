/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["./ResultSetItem", "../core/core"], function (___ResultSetItem, ___core_core) {
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
  var ResultSetItem = ___ResultSetItem["ResultSetItem"];
  var generateGuid = ___core_core["generateGuid"];
  var SearchResultSetItem = /*#__PURE__*/function (_ResultSetItem) {
    _inherits(SearchResultSetItem, _ResultSetItem);
    var _super = _createSuper(SearchResultSetItem);
    // _meta: {
    //     properties: {
    //         dataSource: {
    //             required: true
    //         },
    //         titleAttributes: {
    //             required: true,
    //             aggregation: true
    //         },
    //         titleDescriptionAttributes: {
    //             required: false,
    //             aggregation: true
    //         },
    //         detailAttributes: {
    //             required: true,
    //             aggregation: true
    //         },
    //         defaultNavigationTarget: {
    //             required: false,
    //             aggregation: true
    //         },
    //         navigationTargets: {
    //             required: false,
    //             aggregation: true
    //         },
    //         score: {
    //             required: false,
    //             default: 0
    //         }
    //     }
    // },

    function SearchResultSetItem(properties) {
      var _properties$dataSourc, _properties$score, _properties$hierarchy;
      var _this;
      _classCallCheck(this, SearchResultSetItem);
      _this = _super.call(this, properties);
      _defineProperty(_assertThisInitialized(_this), "score", 0);
      _this.dataSource = (_properties$dataSourc = properties.dataSource) !== null && _properties$dataSourc !== void 0 ? _properties$dataSourc : _this.dataSource;
      _this.setAttributes(properties.attributes || []);
      _this.setTitleAttributes(properties.titleAttributes);
      _this.setTitleDescriptionAttributes(properties.titleDescriptionAttributes);
      _this.setDetailAttributes(properties.detailAttributes);
      _this.setDefaultNavigationTarget(properties.defaultNavigationTarget);
      _this.setNavigationTargets(properties.navigationTargets || []);
      _this.score = (_properties$score = properties.score) !== null && _properties$score !== void 0 ? _properties$score : _this.score;
      _this.hierarchyNodePaths = (_properties$hierarchy = properties.hierarchyNodePaths) !== null && _properties$hierarchy !== void 0 ? _properties$hierarchy : _this.hierarchyNodePaths;
      return _this;
    }
    _createClass(SearchResultSetItem, [{
      key: "setDefaultNavigationTarget",
      value: function setDefaultNavigationTarget(navigationTarget) {
        if (!navigationTarget) {
          this.defaultNavigationTarget = undefined;
          return;
        }
        this.defaultNavigationTarget = navigationTarget;
        navigationTarget.parent = this;
      }
    }, {
      key: "setNavigationTargets",
      value: function setNavigationTargets(navigationTargets) {
        this.navigationTargets = [];
        if (!navigationTargets) {
          return;
        }
        var _iterator = _createForOfIteratorHelper(navigationTargets),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var navigationTarget = _step.value;
            this.addNavigationTarget(navigationTarget);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
    }, {
      key: "addNavigationTarget",
      value: function addNavigationTarget(navigationTarget) {
        this.navigationTargets.push(navigationTarget);
        navigationTarget.parent = this;
      }
    }, {
      key: "setAttributes",
      value: function setAttributes(attributes) {
        this.attributes = [];
        this.attributesMap = {};
        var _iterator2 = _createForOfIteratorHelper(attributes),
          _step2;
        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var attribute = _step2.value;
            this.attributes.push(attribute);
            this.attributesMap[attribute.id] = attribute;
            attribute.parent = this;
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
      }
    }, {
      key: "setTitleAttributes",
      value: function setTitleAttributes(titleAttributes) {
        this.titleAttributes = [];
        if (!Array.isArray(titleAttributes) || titleAttributes.length < 1) {
          return this;
        }
        for (var i = 0; i < titleAttributes.length; i++) {
          var item = titleAttributes[i];
          item.parent = this;
          this.titleAttributes.push(item);
        }
        return this;
      }
    }, {
      key: "setTitleDescriptionAttributes",
      value: function setTitleDescriptionAttributes(titleDescriptionAttributes) {
        this.titleDescriptionAttributes = [];
        if (!Array.isArray(titleDescriptionAttributes) || titleDescriptionAttributes.length < 1) {
          return this;
        }
        for (var i = 0; i < titleDescriptionAttributes.length; i++) {
          var item = titleDescriptionAttributes[i];
          item.parent = this;
          this.titleDescriptionAttributes.push(item);
        }
        return this;
      }
    }, {
      key: "setDetailAttributes",
      value: function setDetailAttributes(detailAttributes) {
        this.detailAttributes = [];
        if (!Array.isArray(detailAttributes) || detailAttributes.length < 1) {
          return this;
        }
        for (var i = 0; i < detailAttributes.length; i++) {
          var item = detailAttributes[i];
          item.parent = this;
          this.detailAttributes.push(item);
        }
        return this;
      }
    }, {
      key: "key",
      get: function get() {
        var parts = [];
        parts.push(this.dataSource.id);
        var _iterator3 = _createForOfIteratorHelper(this.titleAttributes),
          _step3;
        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var titleAttribute = _step3.value;
            var subAttributes = titleAttribute.getSubAttributes();
            var _iterator4 = _createForOfIteratorHelper(subAttributes),
              _step4;
            try {
              for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                var subAttribute = _step4.value;
                parts.push(subAttribute.value);
              }
            } catch (err) {
              _iterator4.e(err);
            } finally {
              _iterator4.f();
            }
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }
        if (parts.length === 1) {
          // no title attributes -> use guid
          parts.push(generateGuid());
        }
        return parts.join("-");
      }
    }, {
      key: "toString",
      value: function toString() {
        var i;
        var result = [];
        var title = [];
        for (i = 0; i < this.titleAttributes.length; ++i) {
          var titleAttribute = this.titleAttributes[i];
          title.push(titleAttribute.toString());
        }
        result.push("--" + title.join(" "));
        for (i = 0; i < this.detailAttributes.length; ++i) {
          var detailAttribute = this.detailAttributes[i];
          result.push(detailAttribute.toString());
        }
        return result.join("\n");
      }
    }]);
    return SearchResultSetItem;
  }(ResultSetItem);
  var __exports = {
    __esModule: true
  };
  __exports.SearchResultSetItem = SearchResultSetItem;
  return __exports;
});
})();