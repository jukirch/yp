/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport", "sap/ui/base/Object", "sap/ui/model/json/JSONModel"], function (ClassSupport, BaseObject, JSONModel) {
  "use strict";

  var _dec, _class;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  let TemplateModel = (_dec = defineUI5Class("sap.fe.core.TemplateModel"), _dec(_class = /*#__PURE__*/function (_BaseObject) {
    _inheritsLoose(TemplateModel, _BaseObject);
    function TemplateModel(pageConfig, oMetaModel) {
      var _this;
      _this = _BaseObject.call(this) || this;
      _this.oMetaModel = oMetaModel;
      _this.oConfigModel = new JSONModel();
      // don't limit aggregation bindings
      _this.oConfigModel.setSizeLimit(Number.MAX_VALUE);
      _this.bConfigLoaded = false;
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const that = _assertThisInitialized(_this);
      if (typeof pageConfig === "function") {
        const fnGetObject = _this.oConfigModel._getObject.bind(_this.oConfigModel);
        _this.oConfigModel._getObject = function (sPath, oContext) {
          if (!that.bConfigLoaded) {
            this.setData(pageConfig());
          }
          return fnGetObject(sPath, oContext);
        };
      } else {
        _this.oConfigModel.setData(pageConfig);
      }
      _this.fnCreateMetaBindingContext = _this.oMetaModel.createBindingContext.bind(_this.oMetaModel);
      _this.fnCreateConfigBindingContext = _this.oConfigModel.createBindingContext.bind(_this.oConfigModel);
      _this.fnSetData = _this.oConfigModel.setData.bind(_this.oConfigModel);
      _this.oConfigModel.createBindingContext = _this.createBindingContext.bind(_assertThisInitialized(_this));
      _this.oConfigModel.setData = _this.setData.bind(_assertThisInitialized(_this));
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return _this.oConfigModel || _assertThisInitialized(_this);
    }

    /**
     * Overwrite the standard setData to keep track whether the external configuration has been loaded or not.
     *
     * @param dataToSet The data to set to the json model containing the configuration
     */
    var _proto = TemplateModel.prototype;
    _proto.setData = function setData(dataToSet) {
      this.fnSetData(dataToSet);
      this.bConfigLoaded = true;
    };
    _proto.createBindingContext = function createBindingContext(sPath, oContext, mParameters, fnCallBack) {
      var _oBindingContext;
      let oBindingContext;
      const bNoResolve = mParameters && mParameters.noResolve;
      oBindingContext = this.fnCreateConfigBindingContext(sPath, oContext, mParameters, fnCallBack);
      const sResolvedPath = !bNoResolve && ((_oBindingContext = oBindingContext) === null || _oBindingContext === void 0 ? void 0 : _oBindingContext.getObject());
      if (sResolvedPath && typeof sResolvedPath === "string") {
        oBindingContext = this.fnCreateMetaBindingContext(sResolvedPath, oContext, mParameters, fnCallBack);
      }
      return oBindingContext;
    };
    _proto.destroy = function destroy() {
      this.oConfigModel.destroy();
      JSONModel.prototype.destroy.apply(this);
    };
    return TemplateModel;
  }(BaseObject)) || _class);
  return TemplateModel;
}, false);
