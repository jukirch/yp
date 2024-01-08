/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["./SinaObject"], function (___SinaObject) {
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
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
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
  var SinaObject = ___SinaObject["SinaObject"];
  var AttributeMetadataBase = /*#__PURE__*/function (_SinaObject) {
    _inherits(AttributeMetadataBase, _SinaObject);
    var _super = _createSuper(AttributeMetadataBase);
    // _meta: {
    //     properties: {
    //         id: {
    //             required: true
    //         },
    //         usage: {
    //             required: true
    //         },
    //         displayOrder: {
    //             required: false
    //         },
    //         groups: { // array of AttributeGroupMembership instances
    //             required: false,
    //             default: function () {
    //                 return [];
    //             }
    //         }
    //     }
    // }

    function AttributeMetadataBase(properties) {
      var _properties$id, _properties$usage, _properties$displayOr, _properties$groups;
      var _this;
      _classCallCheck(this, AttributeMetadataBase);
      _this = _super.call(this, properties);
      _defineProperty(_assertThisInitialized(_this), "groups", []);
      _this.id = (_properties$id = properties.id) !== null && _properties$id !== void 0 ? _properties$id : _this.id;
      _this.usage = (_properties$usage = properties.usage) !== null && _properties$usage !== void 0 ? _properties$usage : _this.usage;
      _this.displayOrder = (_properties$displayOr = properties.displayOrder) !== null && _properties$displayOr !== void 0 ? _properties$displayOr : _this.displayOrder;
      _this.groups = (_properties$groups = properties.groups) !== null && _properties$groups !== void 0 ? _properties$groups : _this.groups;
      _this.type = properties.type;
      return _this;
    }
    return _createClass(AttributeMetadataBase);
  }(SinaObject);
  var __exports = {
    __esModule: true
  };
  __exports.AttributeMetadataBase = AttributeMetadataBase;
  return __exports;
});
})();