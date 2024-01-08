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
sap.ui.define(["../SearchQuery", "./Formatter", "../util", "../FilteredDataSource"], function (___SearchQuery, ___Formatter, sinaUtil, ___FilteredDataSource) {
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
  var SearchQuery = ___SearchQuery["SearchQuery"];
  var Formatter = ___Formatter["Formatter"];
  var FilteredDataSource = ___FilteredDataSource["FilteredDataSource"];
  var HierarchyResultSetFormatter = /*#__PURE__*/function (_Formatter) {
    _inherits(HierarchyResultSetFormatter, _Formatter);
    var _super = _createSuper(HierarchyResultSetFormatter);
    function HierarchyResultSetFormatter() {
      _classCallCheck(this, HierarchyResultSetFormatter);
      return _super.apply(this, arguments);
    }
    _createClass(HierarchyResultSetFormatter, [{
      key: "initAsync",
      value:
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      function initAsync() {
        return Promise.resolve();
      }
    }, {
      key: "format",
      value: function format(resultSet) {
        return resultSet;
      }
    }, {
      key: "formatAsync",
      value: function formatAsync(resultSet) {
        try {
          const _this2 = this;
          var _this = _this2;
          // check feature flag: title links, tooltips, attribute links are only generated in case the breadcrumb is switched on
          if (!resultSet.sina.configuration.FF_hierarchyBreadcrumbs) {
            return _await(resultSet);
          }

          // Only reformat search results instead of facet items in show more dialog
          // The second condition is to exclude hierarchy facets which also send SearchQuery
          if (!(resultSet.query instanceof SearchQuery) || resultSet.query.top > 99) {
            return _await(resultSet);
          }

          // check that there is a hierarchy datasource
          var dataSource = resultSet.query.filter.dataSource;
          var hierarchyDataSource = dataSource.getHierarchyDataSource();
          if (!hierarchyDataSource) {
            return _await(resultSet);
          }
          var staticHierarchyAttributeMetadata = dataSource.getStaticHierarchyAttributeMetadata();

          // process all items
          resultSet.items.forEach(function (resultSetItem) {
            _this.processResultSetItem({
              resultSetItem: resultSetItem,
              dataSource: dataSource,
              hierarchyDataSource: hierarchyDataSource,
              staticHierarchyAttributeMetadata: staticHierarchyAttributeMetadata
            });
          });
          return _await(resultSet);
        } catch (e) {
          return Promise.reject(e);
        }
      }
    }, {
      key: "getHierarchyNodePath",
      value: function getHierarchyNodePath(hierarchyNodePaths, hierarchyAttributeName) {
        if (!hierarchyNodePaths) {
          return;
        }
        var _iterator = _createForOfIteratorHelper(hierarchyNodePaths),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var hierarchyNodePath = _step.value;
            if (hierarchyNodePath.name === hierarchyAttributeName) {
              return hierarchyNodePath;
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
    }, {
      key: "processResultSetItem",
      value: function processResultSetItem(params) {
        this.assembleTitleNavigationTarget(params);
        this.assembleHierarchyAttributeNavigationTarget(params);
      }
    }, {
      key: "assembleTitleNavigationTarget",
      value: function assembleTitleNavigationTarget(params) {
        // determine hierarchy node id of result list item (= folder in DWC) (needed for filter condition)
        var hierarchyNodePath = this.getHierarchyNodePath(params.resultSetItem.hierarchyNodePaths, params.staticHierarchyAttributeMetadata.id);
        if (!hierarchyNodePath || !hierarchyNodePath.path || hierarchyNodePath.path.length < 1) {
          return;
        }
        var lastNode = hierarchyNodePath.path[hierarchyNodePath.path.length - 1];

        // determine static hierarch attribute
        var staticHierarchyAttribute = params.resultSetItem.attributesMap[params.staticHierarchyAttributeMetadata.id];

        // assemble title
        var mergedTitleValues = sinaUtil.assembleTitle(params.resultSetItem);

        // assemble navigation target
        params.resultSetItem.setDefaultNavigationTarget(params.resultSetItem.sina.createStaticHierarchySearchNavigationTarget(lastNode.id, mergedTitleValues || (staticHierarchyAttribute === null || staticHierarchyAttribute === void 0 ? void 0 : staticHierarchyAttribute.value) || "", this.exchangeDataSourceForFilteredDataSource(params.dataSource), "", params.staticHierarchyAttributeMetadata.id));
      }
    }, {
      key: "assembleHierarchyAttributeNavigationTarget",
      value: function assembleHierarchyAttributeNavigationTarget(params) {
        var staticHierarchyAttribute = params.resultSetItem.attributesMap[params.staticHierarchyAttributeMetadata.id];
        if (!staticHierarchyAttribute) {
          return;
        }
        staticHierarchyAttribute.setDefaultNavigationTarget(params.resultSetItem.sina.createStaticHierarchySearchNavigationTarget(staticHierarchyAttribute.value, staticHierarchyAttribute.label, this.exchangeDataSourceForFilteredDataSource(params.dataSource), "", params.staticHierarchyAttributeMetadata.id));
        staticHierarchyAttribute.tooltip = this._constructTooltip(params);
      }
    }, {
      key: "exchangeDataSourceForFilteredDataSource",
      value: function exchangeDataSourceForFilteredDataSource(dataSource) {
        var _dataSource$sina$conf;
        if (((_dataSource$sina$conf = dataSource.sina.configuration) === null || _dataSource$sina$conf === void 0 ? void 0 : _dataSource$sina$conf.searchInAreaOverwriteMode) === true && dataSource instanceof FilteredDataSource) {
          dataSource = dataSource.dataSource;
        }
        return dataSource;
      }
    }, {
      key: "_constructTooltip",
      value: function _constructTooltip(params) {
        // get hierarchy node path
        var hierarchyNodePath = this.getHierarchyNodePath(params.resultSetItem.hierarchyNodePaths, params.staticHierarchyAttributeMetadata.id);
        if (!hierarchyNodePath || !hierarchyNodePath.path || hierarchyNodePath.path.length < 1) {
          return "";
        }
        var path = hierarchyNodePath.path;
        // remove last part of path in case of a folder object
        // for folder objects the path includes also the folder itself (an not only the path to the parent folder)
        var lastNode = path[path.length - 1];
        if (lastNode.id !== params.resultSetItem.attributesMap[params.staticHierarchyAttributeMetadata.id].value) {
          path.splice(path.length - 1, 1);
        }
        // join path parts
        return path.map(function (path) {
          return path.label;
        }).join(" / ");
      }
    }]);
    return HierarchyResultSetFormatter;
  }(Formatter);
  var __exports = {
    __esModule: true
  };
  __exports.HierarchyResultSetFormatter = HierarchyResultSetFormatter;
  return __exports;
});
})();