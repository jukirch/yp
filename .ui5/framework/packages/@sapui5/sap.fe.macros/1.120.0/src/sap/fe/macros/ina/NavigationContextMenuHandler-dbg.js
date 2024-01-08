/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/macros/ina/AbstractContextMenuHandler"], function ($AbstractContextMenuHandler) {
  "use strict";

  var _exports = {};
  var AbstractContextMenuHandler = $AbstractContextMenuHandler.AbstractContextMenuHandler;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  /**
   * Manages the creation and handling of the context menu item for MultiDimensionalGrid navigation ("Go to Details")
   */
  let NavigationContextMenuHandler = /*#__PURE__*/function (_AbstractContextMenuH) {
    _inheritsLoose(NavigationContextMenuHandler, _AbstractContextMenuH);
    function NavigationContextMenuHandler(appComponent, view, dataProvider, dimensionalMapping) {
      var _this;
      _this = _AbstractContextMenuH.call(this, dataProvider, dimensionalMapping) || this;
      _this.appComponent = appComponent;
      _this.view = view;
      return _this;
    }
    _exports = NavigationContextMenuHandler;
    var _proto = NavigationContextMenuHandler.prototype;
    _proto.isActionVisible = async function isActionVisible(context) {
      const {
        dimensionMapping
      } = context;
      if ((dimensionMapping === null || dimensionMapping === void 0 ? void 0 : dimensionMapping.navigationType) === "internal") {
        return !!dimensionMapping.navigationEntitySet;
      } else if ((dimensionMapping === null || dimensionMapping === void 0 ? void 0 : dimensionMapping.navigationType) === "external") {
        return !!dimensionMapping.navigationSemanticObject && !!(await this.appComponent.getShellServices().getPrimaryIntent(dimensionMapping.navigationSemanticObject));
      } else {
        return false;
      }
    };
    _proto.isActionEnabled = async function isActionEnabled(context) {
      var _context$cell;
      return Promise.resolve(!!context.dimensionMapping && !!((_context$cell = context.cell) !== null && _context$cell !== void 0 && _context$cell.Member));
    }

    /**
     * Navigates to the configured target of a dimension if the action is pressed, using routing or intent-based navigation.
     *
     * @param context
     * @returns A promise
     */;
    _proto.triggerAction = async function triggerAction(context) {
      const {
        cell,
        dimensionMapping
      } = context;
      if (!cell || !dimensionMapping) {
        return;
      }
      if (dimensionMapping.navigationType === "internal" && dimensionMapping.navigationEntitySet) {
        const targetContext = this.appComponent.getModel().createBindingContext(`/${dimensionMapping.navigationEntitySet}(${cell.Member})`);
        await this.view.getController()._routing.navigateForwardToContext(targetContext);
      } else if (dimensionMapping.navigationType === "external" && dimensionMapping.navigationKeyProperty && dimensionMapping.navigationSemanticObject) {
        const link = await this.appComponent.getShellServices().getPrimaryIntent(dimensionMapping.navigationSemanticObject);
        if (link) {
          var _this$appComponent$ge;
          const navigationTarget = {
            target: {
              shellHash: `${link.intent}?${dimensionMapping.navigationKeyProperty}=${cell.Member}`
            }
          };
          await ((_this$appComponent$ge = this.appComponent.getShellServices().crossAppNavService) === null || _this$appComponent$ge === void 0 ? void 0 : _this$appComponent$ge.toExternal(navigationTarget));
        }
      }
    };
    return NavigationContextMenuHandler;
  }(AbstractContextMenuHandler);
  _exports = NavigationContextMenuHandler;
  return _exports;
}, false);
