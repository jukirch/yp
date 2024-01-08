/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport", "sap/fe/core/TemplateComponent"], function (ClassSupport, TemplateComponent) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _descriptor3;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  /**
   * Component that can be used as a wrapper component for custom pages.
   *
   * The component can be used in case you want to use SAP Fiori elements Building Blocks or XML template
   * constructions. You can either extend the component and set the viewName and contextPath within your code
   * or you can use it to wrap your custom XML view directly the manifest when you define your custom page
   * under sapui5/routing/targets:
   *
   * <pre>
   * "myCustomPage": {
   *	"type": "Component",
   *	"id": "myCustomPage",
   *	"name": "sap.fe.core.fpm",
   *	"title": "My Custom Page",
   *	"options": {
   *		"settings": {
   *			"viewName": "myNamespace.myView",
   *			"contextPath": "/MyEntitySet"
   *			}
   *		}
   *	}
   * </pre>
   *
   * @public
   * @experimental As of version 1.92.0
   * @since 1.92.0
   */
  let FPMComponent = (_dec = defineUI5Class("sap.fe.core.fpm.Component", {
    manifest: "json"
  }), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_TemplateComponent) {
    _inheritsLoose(FPMComponent, _TemplateComponent);
    /**
     * Name of the XML view which is used for this page. The XML view can contain SAP Fiori elements Building Blocks and XML template constructions.
     *
     * @public
     */

    function FPMComponent(mSettings) {
      var _this;
      if (mSettings.viewType === "JSX") {
        mSettings._mdxViewName = mSettings.viewName;
        mSettings.viewName = "module:sap/fe/core/jsx-runtime/ViewLoader";
        // Remove the cache property from the settings as it is not supported by the ViewLoader
        delete mSettings.cache;
      }
      _this = _TemplateComponent.call(this, mSettings) || this;
      _initializerDefineProperty(_this, "viewName", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "controllerName", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "_mdxViewName", _descriptor3, _assertThisInitialized(_this));
      return _this;
    }
    return FPMComponent;
  }(TemplateComponent), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "viewName", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "controllerName", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_mdxViewName", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  })), _class2)) || _class);
  return FPMComponent;
}, false);
