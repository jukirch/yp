/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/fe/core/helpers/ClassSupport", "sap/fe/core/helpers/KeepAliveHelper", "sap/m/QuickViewPage"], function (CommonUtils, ClassSupport, KeepAliveHelper, QuickViewPage) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let CustomQuickViewPage = (_dec = defineUI5Class("sap.fe.macros.controls.CustomQuickViewPage"), _dec2 = aggregation({
    type: "sap.m.QuickViewGroup",
    multiple: true,
    singularName: "group"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_QuickViewPage) {
    _inheritsLoose(CustomQuickViewPage, _QuickViewPage);
    function CustomQuickViewPage() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _QuickViewPage.call(this, ...args) || this;
      _initializerDefineProperty(_this, "groups", _descriptor, _assertThisInitialized(_this));
      return _this;
    }
    var _proto = CustomQuickViewPage.prototype;
    /**
     * Called before the control is rendered in order to set the link of the title.
     *
     * @param event
     */
    _proto.onBeforeRendering = function onBeforeRendering(event) {
      this.setTitleLink();
      _QuickViewPage.prototype.onBeforeRendering.call(this, event);
    }

    /**
     * Find the mdc link control.
     *
     * @param mdcLinkControl
     * @returns The mdc link control
     */;
    _proto.findMdcLinkControl = function findMdcLinkControl(mdcLinkControl) {
      while (mdcLinkControl && !mdcLinkControl.isA("sap.ui.mdc.Link")) {
        mdcLinkControl = mdcLinkControl.getParent();
      }
      return mdcLinkControl;
    }

    /**
     * Set the url for the title of the quickview.
     *
     * @returns The title url of the quickview is set
     */;
    _proto.setTitleLink = function setTitleLink() {
      const sQuickViewPageTitleLinkHref = this.data("titleLink");
      if (sQuickViewPageTitleLinkHref) {
        this.setCrossAppNavCallback(() => {
          // eslint-disable-line
          const oView = CommonUtils.getTargetView(this);
          const oAppComponent = CommonUtils.getAppComponent(oView);
          const oShellServiceHelper = oAppComponent.getShellServices();
          let oShellHash = oShellServiceHelper.parseShellHash(sQuickViewPageTitleLinkHref);
          const oNavArgs = {
            target: {
              semanticObject: oShellHash.semanticObject,
              action: oShellHash.action
            },
            params: oShellHash.params
          };
          const sQuickViewPageTitleLinkIntent = `${oNavArgs.target.semanticObject}-${oNavArgs.target.action}`;
          if (sQuickViewPageTitleLinkIntent && typeof sQuickViewPageTitleLinkIntent === "string" && sQuickViewPageTitleLinkIntent !== "" && this.oCrossAppNavigator && this.oCrossAppNavigator.isNavigationSupported([sQuickViewPageTitleLinkIntent])) {
            var _mdcLinkControl$getMo;
            const mdcLinkControl = this.findMdcLinkControl(this.getParent());
            const sTargetHref = mdcLinkControl === null || mdcLinkControl === void 0 ? void 0 : (_mdcLinkControl$getMo = mdcLinkControl.getModel("$sapuimdcLink")) === null || _mdcLinkControl$getMo === void 0 ? void 0 : _mdcLinkControl$getMo.getProperty("/titleLinkHref");
            if (sTargetHref) {
              oShellHash = oShellServiceHelper.parseShellHash(sTargetHref);
            } else {
              oShellHash = oShellServiceHelper.parseShellHash(sQuickViewPageTitleLinkIntent);
              oShellHash.params = oNavArgs.params;
            }
            KeepAliveHelper.storeControlRefreshStrategyForHash(oView, oShellHash);
            return {
              target: {
                semanticObject: oShellHash.semanticObject,
                action: oShellHash.action
              },
              params: oShellHash.params
            };
          } else {
            const oCurrentShellHash = oShellServiceHelper.parseShellHash(window.location.hash);
            KeepAliveHelper.storeControlRefreshStrategyForHash(oView, oCurrentShellHash);
            return {
              target: {
                semanticObject: oCurrentShellHash.semanticObject,
                action: oCurrentShellHash.action,
                appSpecificRoute: oCurrentShellHash.appSpecificRoute
              },
              params: oCurrentShellHash.params
            };
          }
        });
      }
      return undefined;
    };
    return CustomQuickViewPage;
  }(QuickViewPage), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "groups", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  return CustomQuickViewPage;
}, false);
