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
function _awaitIgnored(value, direct) {
  if (!direct) {
    return value && value.then ? value.then(_empty) : Promise.resolve();
  }
}
sap.ui.define(["../tree/TreeNode"], function (__TreeNode) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
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
  function _get() {
    if (typeof Reflect !== "undefined" && Reflect.get) {
      _get = Reflect.get.bind();
    } else {
      _get = function _get(target, property, receiver) {
        var base = _superPropBase(target, property);
        if (!base) return;
        var desc = Object.getOwnPropertyDescriptor(base, property);
        if (desc.get) {
          return desc.get.call(arguments.length < 3 ? target : receiver);
        }
        return desc.value;
      };
    }
    return _get.apply(this, arguments);
  }
  function _superPropBase(object, property) {
    while (!Object.prototype.hasOwnProperty.call(object, property)) {
      object = _getPrototypeOf(object);
      if (object === null) break;
    }
    return object;
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
  var TreeNode = _interopRequireDefault(__TreeNode);
  var SearchHierarchyStaticTreeNode = /*#__PURE__*/function (_TreeNode) {
    _inherits(SearchHierarchyStaticTreeNode, _TreeNode);
    var _super = _createSuper(SearchHierarchyStaticTreeNode);
    function SearchHierarchyStaticTreeNode(props) {
      var _this;
      _classCallCheck(this, SearchHierarchyStaticTreeNode);
      _this = _super.call(this, props);
      _this.icon = props.icon;
      _this.getData().facet = props.facet;
      return _this;
    }
    _createClass(SearchHierarchyStaticTreeNode, [{
      key: "setExpanded",
      value: function setExpanded(expanded, updateUI) {
        try {
          const _this2 = this;
          return _await(_get(_getPrototypeOf(SearchHierarchyStaticTreeNode.prototype), "setExpanded", _this2).call(_this2, expanded, false), function () {
            _this2.getData().facet.mixinFilterNodes();
            if (updateUI) {
              _this2.getTreeNodeFactory().updateUI();
            }
          });
        } catch (e) {
          return Promise.reject(e);
        }
      }
    }, {
      key: "toggleFilter",
      value: function toggleFilter() {
        try {
          const _this3 = this;
          var facet = _this3.getData().facet;
          if (!_this3.hasFilter) {
            // set filter
            _this3.setFilter(true);
          } else {
            // remove filter
            _this3.setFilter(false);
          }
          return _await(_awaitIgnored(facet.activateFilters()));
        } catch (e) {
          return Promise.reject(e);
        }
      }
    }, {
      key: "setFilter",
      value: function setFilter(set) {
        var facet = this.getData().facet;
        var filterCondition = facet.sina.createSimpleCondition({
          operator: facet.sina.ComparisonOperator.DescendantOf,
          attribute: facet.attributeId,
          attributeLabel: facet.title,
          // TODO
          value: this.id,
          valueLabel: this.label
        });
        var uiFilter = facet.model.getProperty("/uiFilter");
        if (set) {
          this.removeExistingFilters();
          if (facet.model.config.searchInAreaOverwriteMode) {
            facet.model.config.resetQuickSelectDataSourceAll(facet.model);
          }
          facet.model.setSearchBoxTerm("", false);
          facet.model.resetFilterByFilterConditions(false);
          uiFilter.autoInsertCondition(filterCondition);
        } else {
          uiFilter.autoRemoveCondition(filterCondition);
        }
      }
    }, {
      key: "removeExistingFilters",
      value: function removeExistingFilters() {
        var facet = this.getData().facet;
        var uiFilter = facet.model.getProperty("/uiFilter");
        var filterConditonsForRemoval = uiFilter.rootCondition.getAttributeConditions(facet.attributeId);
        var _iterator = _createForOfIteratorHelper(filterConditonsForRemoval),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var filterCondition = _step.value;
            uiFilter.autoRemoveCondition(filterCondition);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
    }, {
      key: "fetchChildTreeNodes",
      value: function fetchChildTreeNodes() {
        try {
          const _this4 = this;
          var facet;
          // helper functions
          var getId = function getId(item) {
            for (var i = 0; i < item.attributes.length; ++i) {
              var attribute = item.attributes[i];
              if (attribute.id === facet.attributeId) {
                return attribute.value;
              }
            }
          };
          var getLabel = function getLabel(item) {
            var label = [];
            for (var i = 0; i < item.titleAttributes.length; ++i) {
              var titleAttribute = item.titleAttributes[i];
              if (!titleAttribute.value.startsWith("sap-icon://")) {
                label.push(titleAttribute.valueFormatted);
              }
            }
            return label.join(" ");
          };
          var getIcon = function getIcon(item) {
            for (var i = 0; i < item.attributes.length; ++i) {
              var attribute = item.attributes[i];
              if (typeof attribute.value === "string" && attribute.value.startsWith("sap-icon://")) {
                return attribute.value;
              }
            }
            return "sap-icon://none";
          };
          facet = _this4.getData().facet;
          var filter = facet.sina.createFilter({
            dataSource: facet.dataSource
          });
          filter.autoInsertCondition(facet.sina.createSimpleCondition({
            attribute: facet.attributeId,
            value: _this4.id,
            operator: facet.sina.ComparisonOperator.ChildOf
          }));
          var query = facet.sina.createSearchQuery({
            filter: filter,
            top: 100
          });
          return _await(query.getResultSetAsync(), function (resultSet) {
            var childTreeNodes = [];
            for (var i = 0; i < resultSet.items.length; ++i) {
              var item = resultSet.items[i];
              var node = facet.treeNodeFactory.createTreeNode({
                facet: facet,
                id: getId(item),
                label: getLabel(item),
                icon: getIcon(item),
                expandable: !item.attributesMap.HASHIERARCHYNODECHILD || item.attributesMap.HASHIERARCHYNODECHILD.value === "true"
              });
              childTreeNodes.push(node);
            }
            return childTreeNodes;
          });
        } catch (e) {
          return Promise.reject(e);
        }
      }
    }, {
      key: "updateNodePath",
      value: function updateNodePath(path, index) {
        if (path[index].id !== this.id) {
          throw new Error("program error"); // TODO
        }

        if (index + 1 >= path.length) {
          return;
        }
        var pathPart = path[index + 1];
        var childNode = this.getChildTreeNodeById(pathPart.id);
        if (!childNode) {
          var facet = this.getData().facet;
          childNode = facet.treeNodeFactory.createTreeNode({
            facet: facet,
            id: pathPart.id,
            label: pathPart.label
          });
          this.addChildTreeNode(childNode);
        }
        childNode.updateNodePath(path, index + 1);
      }
    }]);
    return SearchHierarchyStaticTreeNode;
  }(TreeNode);
  return SearchHierarchyStaticTreeNode;
});
})();