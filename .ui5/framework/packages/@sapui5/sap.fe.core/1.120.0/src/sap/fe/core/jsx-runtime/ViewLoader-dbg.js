/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport", "sap/m/Page", "sap/ui/base/ManagedObject", "sap/ui/core/mvc/View", "sap/fe/core/jsx-runtime/jsx"], function (ClassSupport, Page, ManagedObject, View, _jsx) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let ViewLoader = (_dec = defineUI5Class("sap.fe.core.jsx-runtime.MDXViewLoader"), _dec2 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_View) {
    _inheritsLoose(ViewLoader, _View);
    function ViewLoader() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _View.call(this, ...args) || this;
      _initializerDefineProperty(_this, "viewName", _descriptor, _assertThisInitialized(_this));
      return _this;
    }
    _exports = ViewLoader;
    var _proto = ViewLoader.prototype;
    _proto.loadDependency = async function loadDependency(name) {
      return new Promise(resolve => {
        sap.ui.require([name], async MDXContent => {
          resolve(MDXContent);
        });
      });
    };
    _proto.getControllerName = function getControllerName() {
      const viewData = this.getViewData();
      return viewData.controllerName;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ;
    _proto.createContent = async function createContent(oController) {
      const viewData = this.getViewData();
      const MDXContent = viewData.viewContent || (await this.loadDependency(viewData._mdxViewName));
      ViewLoader.preprocessorData = this.mPreprocessors.xml;
      ViewLoader.controller = oController;
      const mdxContent = ManagedObject.runWithPreprocessors(() => {
        return MDXContent();
      }, {
        id: sId => {
          return this.createId(sId);
        },
        settings: function () {
          this.controller = oController;
        }
      });
      return _jsx(Page, {
        class: "sapUiContentPadding",
        children: {
          content: mdxContent
        }
      });
    };
    return ViewLoader;
  }(View), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "viewName", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = ViewLoader;
  return _exports;
}, false);
