/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport", "sap/ui/core/mvc/ControllerExtension", "sap/ui/core/mvc/OverrideExecution", "sap/ui/model/json/JSONModel"], function (ClassSupport, ControllerExtension, OverrideExecution, JSONModel) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _class, _class2;
  var publicExtension = ClassSupport.publicExtension;
  var privateExtension = ClassSupport.privateExtension;
  var methodOverride = ClassSupport.methodOverride;
  var finalExtension = ClassSupport.finalExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  /**
   * Controller extension providing hooks for the navigation using paginators
   *
   * @hideconstructor
   * @public
   * @since 1.94.0
   */
  let Paginator = (_dec = defineUI5Class("sap.fe.core.controllerextensions.Paginator"), _dec2 = methodOverride(), _dec3 = publicExtension(), _dec4 = finalExtension(), _dec5 = publicExtension(), _dec6 = finalExtension(), _dec7 = privateExtension(), _dec8 = extensible(OverrideExecution.After), _dec9 = privateExtension(), _dec10 = extensible(OverrideExecution.After), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    _inheritsLoose(Paginator, _ControllerExtension);
    function Paginator() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _ControllerExtension.call(this, ...args) || this;
      _this._iCurrentIndex = -1;
      return _this;
    }
    var _proto = Paginator.prototype;
    _proto.onInit = function onInit() {
      this._oView = this.base.getView();
      this._oView.setModel(new JSONModel({
        navUpEnabled: false,
        navDownEnabled: false
      }), "paginator");
    }

    /**
     * Initiates the paginator control.
     *
     * @param oBinding ODataListBinding object
     * @param oContext Current context where the navigation is initiated
     * @public
     * @since 1.94.0
     */;
    _proto.initialize = function initialize(oBinding, oContext) {
      if (oBinding && oBinding.getAllCurrentContexts) {
        this._oListBinding = oBinding;
        oBinding.attachEvent("change", this._updateCurrentIndexAndButtonEnablement.bind(this));
      }
      if (oContext) {
        this._oCurrentContext = oContext;
      }
      this._updateCurrentIndexAndButtonEnablement();
    };
    _proto._updateCurrentIndexAndButtonEnablement = function _updateCurrentIndexAndButtonEnablement() {
      if (this._oCurrentContext && this._oListBinding) {
        const sPath = this._oCurrentContext.getPath();
        // Storing the currentIndex in global variable
        this._iCurrentIndex = this._oListBinding.getAllCurrentContexts().findIndex(function (oContext) {
          return oContext && oContext.getPath() === sPath;
        });
        const oCurrentIndexContext = this._oListBinding.getAllCurrentContexts()[this._iCurrentIndex];
        if (!this._iCurrentIndex && this._iCurrentIndex !== 0 || !oCurrentIndexContext || this._oCurrentContext.getPath() !== oCurrentIndexContext.getPath()) {
          this._updateCurrentIndex();
        }
      }
      this._handleButtonEnablement();
    };
    _proto._handleButtonEnablement = function _handleButtonEnablement() {
      //Enabling and Disabling the Buttons on change of the control context
      const mButtonEnablementModel = this.base.getView().getModel("paginator");
      if (this._oListBinding && this._oListBinding.getAllCurrentContexts().length > 1 && this._iCurrentIndex > -1) {
        if (this._iCurrentIndex === this._oListBinding.getAllCurrentContexts().length - 1) {
          mButtonEnablementModel.setProperty("/navDownEnabled", false);
        } else if (this._oListBinding.getAllCurrentContexts()[this._iCurrentIndex + 1].isInactive()) {
          //check the next context is not an inactive context
          mButtonEnablementModel.setProperty("/navDownEnabled", false);
        } else {
          mButtonEnablementModel.setProperty("/navDownEnabled", true);
        }
        if (this._iCurrentIndex === 0) {
          mButtonEnablementModel.setProperty("/navUpEnabled", false);
        } else if (this._oListBinding.getAllCurrentContexts()[this._iCurrentIndex - 1].isInactive()) {
          mButtonEnablementModel.setProperty("/navUpEnabled", false);
        } else {
          mButtonEnablementModel.setProperty("/navUpEnabled", true);
        }
      } else {
        // Don't show the paginator buttons
        // 1. When no listbinding is available
        // 2. Only '1' or '0' context exists in the listBinding
        // 3. The current index is -ve, i.e the currentIndex is invalid.
        mButtonEnablementModel.setProperty("/navUpEnabled", false);
        mButtonEnablementModel.setProperty("/navDownEnabled", false);
      }
    };
    _proto._updateCurrentIndex = function _updateCurrentIndex() {
      if (this._oCurrentContext && this._oListBinding) {
        const sPath = this._oCurrentContext.getPath();
        // Storing the currentIndex in global variable
        this._iCurrentIndex = this._oListBinding.getAllCurrentContexts().findIndex(function (oContext) {
          return oContext && oContext.getPath() === sPath;
        });
      }
    };
    _proto.updateCurrentContext = async function updateCurrentContext(iDeltaIndex) {
      var _this$_oCurrentContex, _this$_oCurrentContex2;
      if (!this._oListBinding) {
        return;
      }
      const oModel = (_this$_oCurrentContex = this._oCurrentContext) !== null && _this$_oCurrentContex !== void 0 && _this$_oCurrentContex.getModel ? (_this$_oCurrentContex2 = this._oCurrentContext) === null || _this$_oCurrentContex2 === void 0 ? void 0 : _this$_oCurrentContex2.getModel() : undefined;
      //Submitting any pending changes that might be there before navigating to next context.
      await (oModel === null || oModel === void 0 ? void 0 : oModel.submitBatch("$auto"));
      const aCurrentContexts = this._oListBinding.getAllCurrentContexts();
      const iNewIndex = this._iCurrentIndex + iDeltaIndex;
      const oNewContext = aCurrentContexts[iNewIndex];
      if (oNewContext) {
        const bPreventIdxUpdate = this.onBeforeContextUpdate(this._oListBinding, this._iCurrentIndex, iDeltaIndex);
        if (!bPreventIdxUpdate) {
          this._iCurrentIndex = iNewIndex;
          this._oCurrentContext = oNewContext;
        }
        this.onContextUpdate(oNewContext);
      }
      this._handleButtonEnablement();
    }

    /**
     * Called before context update.
     *
     * @param _oListBinding ODataListBinding object
     * @param _iCurrentIndex Current index of context in listBinding from where the navigation is initiated
     * @param _iIndexUpdate The delta index for update
     * @returns `true` to prevent the update of current context.
     */;
    _proto.onBeforeContextUpdate = function onBeforeContextUpdate(_oListBinding, _iCurrentIndex, _iIndexUpdate) {
      return false;
    }

    /**
     * Returns the updated context after the paginator operation.
     *
     * @param oContext Final context returned after the paginator action
     * @public
     * @since 1.94.0
     */;
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onContextUpdate = function onContextUpdate(oContext) {
      //To be overridden by the application
    };
    return Paginator;
  }(ControllerExtension), (_applyDecoratedDescriptor(_class2.prototype, "onInit", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "onInit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "initialize", [_dec3, _dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "initialize"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "updateCurrentContext", [_dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "updateCurrentContext"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeContextUpdate", [_dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeContextUpdate"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onContextUpdate", [_dec9, _dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "onContextUpdate"), _class2.prototype)), _class2)) || _class);
  return Paginator;
}, false);
