/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/collaboration/ActivitySync", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/ClassSupport", "sap/fe/core/helpers/ResourceModelHelper", "sap/m/BusyDialog", "./FieldWrapper"], function (CommonUtils, ActivitySync, MetaModelConverter, ClassSupport, ResourceModelHelper, BusyDialog, FieldWrapper) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let FileWrapper = (_dec = defineUI5Class("sap.fe.macros.controls.FileWrapper"), _dec2 = property({
    type: "sap.ui.core.URI"
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "string"
  }), _dec6 = aggregation({
    type: "sap.m.Avatar",
    multiple: false
  }), _dec7 = aggregation({
    type: "sap.ui.core.Icon",
    multiple: false
  }), _dec8 = aggregation({
    type: "sap.m.Link",
    multiple: false
  }), _dec9 = aggregation({
    type: "sap.m.Text",
    multiple: false
  }), _dec10 = aggregation({
    type: "sap.ui.unified.FileUploader",
    multiple: false
  }), _dec11 = aggregation({
    type: "sap.m.Button",
    multiple: false
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_FieldWrapper) {
    _inheritsLoose(FileWrapper, _FieldWrapper);
    function FileWrapper() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _FieldWrapper.call(this, ...args) || this;
      _initializerDefineProperty(_this, "uploadUrl", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "propertyPath", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "filename", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "mediaType", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "avatar", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "icon", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "link", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "text", _descriptor8, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "fileUploader", _descriptor9, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "deleteButton", _descriptor10, _assertThisInitialized(_this));
      _this._busy = false;
      _this.avatarCacheBustingInitialized = false;
      return _this;
    }
    var _proto = FileWrapper.prototype;
    _proto.getAccessibilityInfo = function getAccessibilityInfo() {
      const accInfo = [];
      if (this.avatar) {
        accInfo.push(this.avatar);
      }
      if (this.icon) {
        accInfo.push(this.icon);
      }
      if (this.link) {
        accInfo.push(this.link);
      }
      if (this.text) {
        accInfo.push(this.text);
      }
      if (this.fileUploader) {
        accInfo.push(this.fileUploader);
      }
      if (this.deleteButton) {
        accInfo.push(this.deleteButton);
      }
      return {
        children: accInfo
      };
    };
    _proto.onBeforeRendering = function onBeforeRendering() {
      this._setAriaLabels();
      this._addSideEffects();
      this._refreshAvatar();
    }

    /**
     * If in the collaborative draft, send a request to reload the file.
     */;
    _proto._refreshAvatar = function _refreshAvatar() {
      if (ActivitySync.isCollaborationEnabled(CommonUtils.getTargetView(this))) {
        var _this$avatar;
        const avatarBinding = (_this$avatar = this.avatar) === null || _this$avatar === void 0 ? void 0 : _this$avatar.getBindingInfo("src").binding;
        if (avatarBinding && !this.avatarCacheBustingInitialized) {
          avatarBinding.attachEvent("change", () => {
            var _this$avatar2;
            (_this$avatar2 = this.avatar) === null || _this$avatar2 === void 0 ? void 0 : _this$avatar2.refreshAvatarCacheBusting();
          });
          this.avatarCacheBustingInitialized = true;
        }
      }
    };
    _proto._setAriaLabels = function _setAriaLabels() {
      this._setAriaLabelledBy(this.avatar);
      this._setAriaLabelledBy(this.icon);
      this._setAriaLabelledBy(this.link);
      this._setAriaLabelledBy(this.text);
      this._setAriaLabelledBy(this.fileUploader);
      this._setAriaLabelledBy(this.deleteButton);
    };
    _proto._addSideEffects = function _addSideEffects() {
      var _this$_getSideEffectC;
      // add control SideEffects for stream content, filename and mediatype
      const navigationProperties = [],
        view = CommonUtils.getTargetView(this),
        viewDataFullContextPath = view.getViewData().fullContextPath,
        metaModel = view.getModel().getMetaModel(),
        metaModelPath = metaModel.getMetaPath(viewDataFullContextPath),
        viewContext = metaModel.getContext(viewDataFullContextPath),
        dataViewModelPath = MetaModelConverter.getInvolvedDataModelObjects(viewContext),
        sourcePath = this.data("sourcePath"),
        fieldPath = sourcePath.replace(`${metaModelPath}`, ""),
        path = fieldPath.replace(this.propertyPath, "");
      navigationProperties.push({
        $NavigationPropertyPath: fieldPath
      });
      if (this.filename) {
        navigationProperties.push({
          $NavigationPropertyPath: path + this.filename
        });
      }
      if (this.mediaType) {
        navigationProperties.push({
          $NavigationPropertyPath: path + this.mediaType
        });
      }
      (_this$_getSideEffectC = this._getSideEffectController()) === null || _this$_getSideEffectC === void 0 ? void 0 : _this$_getSideEffectC.addControlSideEffects(dataViewModelPath.targetEntityType.fullyQualifiedName, {
        sourceProperties: [fieldPath],
        targetEntities: navigationProperties,
        sourceControlId: this.getId()
      });
    };
    _proto._getSideEffectController = function _getSideEffectController() {
      const controller = this._getViewController();
      return controller ? controller._sideEffects : undefined;
    };
    _proto._getViewController = function _getViewController() {
      const view = CommonUtils.getTargetView(this);
      return view && view.getController();
    };
    _proto.getUploadUrl = function getUploadUrl() {
      // set upload url as canonical url for NavigationProperties
      // this is a workaround as some backends cannot resolve NavigationsProperties for stream types
      const context = this.getBindingContext();
      return context && this.uploadUrl ? this.uploadUrl.replace(context.getPath(), context.getCanonicalPath()) : "";
    };
    _proto.setUIBusy = function setUIBusy(busy) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const that = this;
      this._busy = busy;
      if (busy) {
        if (!this.busyDialog) {
          this.busyDialog = new BusyDialog({
            text: getResourceModel(this).getText("M_FILEWRAPPER_BUSY_DIALOG_TITLE"),
            showCancelButton: false
          });
        }
        setTimeout(function () {
          if (that._busy) {
            var _that$busyDialog;
            (_that$busyDialog = that.busyDialog) === null || _that$busyDialog === void 0 ? void 0 : _that$busyDialog.open();
          }
        }, 1000);
      } else {
        var _this$busyDialog;
        (_this$busyDialog = this.busyDialog) === null || _this$busyDialog === void 0 ? void 0 : _this$busyDialog.close(false);
      }
    };
    _proto.getUIBusy = function getUIBusy() {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      return this._busy;
    };
    FileWrapper.render = function render(renderManager, fileWrapper) {
      renderManager.openStart("div", fileWrapper); // FileWrapper control div
      renderManager.style("width", fileWrapper.width);
      renderManager.openEnd();

      // Outer Box
      renderManager.openStart("div"); // div for all controls
      renderManager.style("display", "flex");
      renderManager.style("box-sizing", "border-box");
      renderManager.style("justify-content", "space-between");
      renderManager.style("align-items", "center");
      renderManager.style("flex-wrap", "wrap");
      renderManager.style("align-content", "stretch");
      renderManager.style("width", "100%");
      renderManager.openEnd();

      // Display Mode
      renderManager.openStart("div"); // div for controls shown in Display mode
      renderManager.style("display", "flex");
      renderManager.style("align-items", "center");
      renderManager.openEnd();
      if (fileWrapper.avatar) {
        renderManager.renderControl(fileWrapper.avatar); // render the Avatar Control
      } else {
        renderManager.renderControl(fileWrapper.icon); // render the Icon Control
        renderManager.renderControl(fileWrapper.link); // render the Link Control
        renderManager.renderControl(fileWrapper.text); // render the Text Control for empty file indication
      }

      renderManager.close("div"); // div for controls shown in Display mode

      // Additional content for Edit Mode
      renderManager.openStart("div"); // div for controls shown in Display + Edit mode
      renderManager.style("display", "flex");
      renderManager.style("align-items", "center");
      renderManager.openEnd();
      renderManager.renderControl(fileWrapper.fileUploader); // render the FileUploader Control
      renderManager.renderControl(fileWrapper.deleteButton); // render the Delete Button Control
      renderManager.close("div"); // div for controls shown in Display + Edit mode

      renderManager.close("div"); // div for all controls

      renderManager.close("div"); // end of the complete Control
    };
    _proto.destroy = function destroy(bSuppressInvalidate) {
      const oSideEffects = this._getSideEffectController();
      if (oSideEffects) {
        oSideEffects.removeControlSideEffects(this);
      }
      delete this.busyDialog;
      FieldWrapper.prototype.destroy.apply(this, [bSuppressInvalidate]);
    };
    return FileWrapper;
  }(FieldWrapper), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "uploadUrl", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "propertyPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "filename", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "mediaType", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "avatar", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "icon", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "link", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "text", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "fileUploader", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "deleteButton", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  return FileWrapper;
}, false);
