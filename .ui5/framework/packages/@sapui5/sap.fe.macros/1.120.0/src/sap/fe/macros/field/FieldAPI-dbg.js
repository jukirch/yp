/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/controllerextensions/collaboration/ActivitySync", "sap/fe/core/controllerextensions/collaboration/CollaborationCommon", "sap/fe/core/helpers/ClassSupport", "sap/ui/core/Core", "sap/ui/core/message/Message", "../MacroAPI"], function (CollaborationActivitySync, CollaborationCommon, ClassSupport, Core, Message, MacroAPI) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14;
  var xmlEventHandler = ClassSupport.xmlEventHandler;
  var property = ClassSupport.property;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var association = ClassSupport.association;
  var CollaborationFieldGroupPrefix = CollaborationCommon.CollaborationFieldGroupPrefix;
  var Activity = CollaborationCommon.Activity;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  /**
   * Returns the first visible control in the FieldWrapper.
   *
   * @param oControl FieldWrapper
   * @returns The first visible control
   */
  function getControlInFieldWrapper(oControl) {
    if (oControl.isA("sap.fe.macros.controls.FieldWrapper")) {
      const oFieldWrapper = oControl;
      const aControls = oFieldWrapper.getEditMode() === "Display" ? [oFieldWrapper.getContentDisplay()] : oFieldWrapper.getContentEdit();
      if (aControls.length >= 1) {
        return aControls.length ? aControls[0] : undefined;
      }
    } else {
      return oControl;
    }
    return undefined;
  }

  /**
   * Building block for creating a field based on the metadata provided by OData V4.
   * <br>
   * Usually, a DataField or DataPoint annotation is expected, but the field can also be used to display a property from the entity type.
   *
   *
   * Usage example:
   * <pre>
   * &lt;macro:Field id="MyField" metaPath="MyProperty" /&gt;
   * </pre>
   *
   * @alias sap.fe.macros.Field
   * @public
   */
  let FieldAPI = (_dec = defineUI5Class("sap.fe.macros.field.FieldAPI", {
    returnTypes: ["sap.fe.core.controls.FormElementWrapper" /*, not sure i want to add those yet "sap.fe.macros.field.FieldAPI", "sap.m.HBox", "sap.fe.macros.controls.ConditionalWrapper", "sap.m.Button"*/]
  }), _dec2 = property({
    type: "boolean"
  }), _dec3 = property({
    type: "boolean"
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "string",
    expectedAnnotations: [],
    expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty", "Property"]
  }), _dec6 = property({
    type: "string",
    expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"]
  }), _dec7 = event(), _dec8 = event(), _dec9 = association({
    type: "sap.ui.core.Control",
    multiple: true,
    singularName: "ariaLabelledBy"
  }), _dec10 = property({
    type: "boolean"
  }), _dec11 = property({
    type: "sap.fe.macros.FieldFormatOptions"
  }), _dec12 = property({
    type: "string"
  }), _dec13 = property({
    type: "boolean"
  }), _dec14 = property({
    type: "boolean"
  }), _dec15 = property({
    type: "string"
  }), _dec16 = xmlEventHandler(), _dec17 = xmlEventHandler(), _dec(_class = (_class2 = /*#__PURE__*/function (_MacroAPI) {
    _inheritsLoose(FieldAPI, _MacroAPI);
    function FieldAPI() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _MacroAPI.call(this, ...args) || this;
      _initializerDefineProperty(_this, "editable", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "readOnly", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "id", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "metaPath", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "change", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "liveChange", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "ariaLabelledBy", _descriptor8, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "required", _descriptor9, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "formatOptions", _descriptor10, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "semanticObject", _descriptor11, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "collaborationEnabled", _descriptor12, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "visible", _descriptor13, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "mainPropertyRelativePath", _descriptor14, _assertThisInitialized(_this));
      _this.focusHandlersAttached = false;
      return _this;
    }
    var _proto = FieldAPI.prototype;
    _proto.handleChange = function handleChange(oEvent) {
      this.fireChange({
        value: this.getValue(),
        isValid: oEvent.getParameter("valid")
      });
    };
    _proto.handleLiveChange = function handleLiveChange(_event) {
      this.fireEvent("liveChange");
    };
    FieldAPI.getAPI = function getAPI(ui5Event) {
      return _MacroAPI.getAPI.call(this, ui5Event, "sap.fe.macros.field.FieldAPI");
    };
    _proto.onBeforeRendering = function onBeforeRendering() {
      const isArialLabelledByCompliant = function (control) {
        return control.isA(["sap.m.Button", "sap.fe.macros.controls.FieldWrapper", "sap.ui.mdc.Field", "sap.fe.macros.controls.FileWrapper"]);
      };
      const oContent = this.content;
      if (oContent && isArialLabelledByCompliant(oContent) && oContent.addAriaLabelledBy) {
        const aAriaLabelledBy = this.getAriaLabelledBy();
        for (let i = 0; i < aAriaLabelledBy.length; i++) {
          const sId = aAriaLabelledBy[i];
          const aAriaLabelledBys = oContent.getAriaLabelledBy() || [];
          if (aAriaLabelledBys.indexOf(sId) === -1) {
            oContent.addAriaLabelledBy(sId);
          }
        }
      }
    }

    /**
     * Gets the id of the last focused FieldAPI (if any).
     *
     * @returns ID
     */;
    FieldAPI.getLastFocusId = function getLastFocusId() {
      return FieldAPI.lastFocusId;
    }

    /**
     * Gets the fieldgroups of the last focused FieldAPI (if any).
     *
     * @returns A string containing the fieldgroups separated by ','
     */;
    FieldAPI.getLastFocusFieldGroups = function getLastFocusFieldGroups() {
      return FieldAPI.lastFocusFieldGroups;
    }

    /**
     * Stores information about the last focused FieldAPI (id and fieldgroups).
     *
     * @param focusedFieldAPI
     */;
    FieldAPI.setLastFocusInformation = function setLastFocusInformation(focusedFieldAPI) {
      FieldAPI.lastFocusId = focusedFieldAPI === null || focusedFieldAPI === void 0 ? void 0 : focusedFieldAPI.getId();
      FieldAPI.lastFocusFieldGroups = focusedFieldAPI === null || focusedFieldAPI === void 0 ? void 0 : focusedFieldAPI.getFieldGroupIds().join(",");
    }

    /**
     * Gets the path used to send collaboration messages.
     *
     * @returns The path (or undefined is no valid path could be found)
     */;
    _proto.getCollaborationPath = function getCollaborationPath() {
      // Note: we send messages even if the context is inactive (empty creation rows),
      // otherwise we can't update the corresponding locks when the context is activated.
      const bindingContext = this.getBindingContext();
      if (!this.mainPropertyRelativePath || !bindingContext) {
        return undefined;
      }
      const fieldWrapper = this.content;
      if ((fieldWrapper === null || fieldWrapper === void 0 ? void 0 : fieldWrapper.getProperty("editMode")) !== "Editable") {
        // The field is not in edit mode --> no collaboration messages
        return undefined;
      }
      return `${bindingContext.getPath()}/${this.mainPropertyRelativePath}`;
    }

    /**
     * If collaboration is enabled, send a Lock collaboration message.
     */;
    _proto.sendFocusInMessage = function sendFocusInMessage() {
      const collaborationPath = this.getCollaborationPath();
      if (collaborationPath) {
        CollaborationActivitySync.send(this, {
          action: Activity.Lock,
          content: collaborationPath
        });
      }
    }

    /**
     * If collaboration is enabled, send an Unlock collaboration message.
     */;
    _proto.sendFocusOutMessage = function sendFocusOutMessage() {
      const collaborationPath = this.getCollaborationPath();
      if (collaborationPath) {
        CollaborationActivitySync.send(this, {
          action: Activity.Unlock,
          content: collaborationPath
        });
      }
    }

    /**
     * Callback when the focus is set in the FieldAPI or one of its children.
     *
     * @param focusEvent
     */;
    _proto.handleContentFocusIn = function handleContentFocusIn(focusEvent) {
      var _this$getDomRef;
      // We send the event only if the focus was previously out of the FieldAPI
      if (!((_this$getDomRef = this.getDomRef()) !== null && _this$getDomRef !== void 0 && _this$getDomRef.contains(focusEvent.relatedTarget))) {
        // We need to handle the case where the newly focused FieldAPI is different from the previous one, but they share the same fieldGroupIDs
        // (e.g. fields in different rows in the same column of a table)
        // In such case, the focusOut handler was not called (because we stay in the same fieldGroupID), so we need to send a focusOut event manually
        if (FieldAPI.getLastFocusId() != this.getId() && FieldAPI.getLastFocusFieldGroups() === this.getFieldGroupIds().join(",")) {
          const lastFocused = Core.byId(FieldAPI.getLastFocusId());
          lastFocused === null || lastFocused === void 0 ? void 0 : lastFocused.sendFocusOutMessage();
        }
        FieldAPI.setLastFocusInformation(this);
        this.sendFocusInMessage();
      }
    }

    /**
     * Callback when the focus is removed from the FieldAPI or one of its children.
     *
     * @param fieldGroupEvent
     */;
    _proto.handleContentFocusOut = function handleContentFocusOut(fieldGroupEvent) {
      const fieldGroupIds = fieldGroupEvent.getParameter("fieldGroupIds");

      // We send the event only if the validated fieldCroup corresponds to a collaboration group
      if (fieldGroupIds.some(groupId => {
        return groupId.startsWith(CollaborationFieldGroupPrefix);
      })) {
        const sourceControl = fieldGroupEvent.getSource();

        // Determine if the control that sent the event still has the focus (or one of its children).
        // This could happen e.g. if the user pressed <Enter> to validate the input.
        let currentFocusedControl = Core.byId(Core.getCurrentFocusedControlId());
        while (currentFocusedControl && currentFocusedControl !== sourceControl) {
          currentFocusedControl = currentFocusedControl.getParent();
        }
        if (currentFocusedControl !== sourceControl) {
          // The control that sent the event isn't focused anymore
          this.sendFocusOutMessage();
          if (FieldAPI.getLastFocusId() === this.getId()) {
            FieldAPI.setLastFocusInformation(undefined);
          }
        }
      }
    };
    _proto.onAfterRendering = function onAfterRendering() {
      if (this.collaborationEnabled && !this.focusHandlersAttached) {
        var _this$content, _this$content2;
        // The event delegate doesn't work on the FieldAPI, we need to put it on its content (FieldWrapper)
        (_this$content = this.content) === null || _this$content === void 0 ? void 0 : _this$content.addEventDelegate({
          onfocusin: this.handleContentFocusIn
        }, this);

        // The validatefieldgroup event doesn't work on the FieldAPI, we need to put it on its content (FieldWrapper)
        (_this$content2 = this.content) === null || _this$content2 === void 0 ? void 0 : _this$content2.attachValidateFieldGroup(this.handleContentFocusOut, this);
        this.focusHandlersAttached = true; // To avoid attaching events twice
      }
    };
    _proto.enhanceAccessibilityState = function enhanceAccessibilityState(_oElement, mAriaProps) {
      const oParent = this.getParent();
      if (oParent && oParent.enhanceAccessibilityState) {
        // forward  enhanceAccessibilityState call to the parent
        oParent.enhanceAccessibilityState(_oElement, mAriaProps);
      }
      return mAriaProps;
    };
    _proto.getAccessibilityInfo = function getAccessibilityInfo() {
      const oContent = this.content;
      return oContent && oContent.getAccessibilityInfo ? oContent.getAccessibilityInfo() : {};
    }

    /**
     * Returns the DOMNode ID to be used for the "labelFor" attribute.
     *
     * We forward the call of this method to the content control.
     *
     * @returns ID to be used for the <code>labelFor</code>
     */;
    _proto.getIdForLabel = function getIdForLabel() {
      const oContent = this.content;
      return oContent.getIdForLabel();
    }

    /**
     * Retrieves the current value of the field.
     *
     * @public
     * @returns The current value of the field
     */;
    _proto.getValue = function getValue() {
      var _oControl, _oControl2, _oControl3, _oControl4;
      let oControl = getControlInFieldWrapper(this.content);
      if (this.collaborationEnabled && (_oControl = oControl) !== null && _oControl !== void 0 && _oControl.isA("sap.m.HBox")) {
        oControl = oControl.getItems()[0];
      }
      if ((_oControl2 = oControl) !== null && _oControl2 !== void 0 && _oControl2.isA("sap.m.CheckBox")) {
        return oControl.getSelected();
      } else if ((_oControl3 = oControl) !== null && _oControl3 !== void 0 && _oControl3.isA("sap.m.InputBase")) {
        return oControl.getValue();
      } else if ((_oControl4 = oControl) !== null && _oControl4 !== void 0 && _oControl4.isA("sap.ui.mdc.Field")) {
        return oControl.getValue(); // FieldWrapper
      } else {
        throw "getting value not yet implemented for this field type";
      }
    }

    /**
     * Adds a message to the field.
     *
     * @param [parameters] The parameters to create message
     * @param parameters.type Type of the message
     * @param parameters.message Message text
     * @param parameters.description Message description
     * @param parameters.persistent True if the message is persistent
     * @returns The id of the message
     * @public
     */;
    _proto.addMessage = function addMessage(parameters) {
      const msgManager = this.getMessageManager();
      const oControl = getControlInFieldWrapper(this.content);
      let path; //target for oMessage
      if (oControl !== null && oControl !== void 0 && oControl.isA("sap.m.CheckBox")) {
        var _getBinding;
        path = (_getBinding = oControl.getBinding("selected")) === null || _getBinding === void 0 ? void 0 : _getBinding.getResolvedPath();
      } else if (oControl !== null && oControl !== void 0 && oControl.isA("sap.m.InputBase")) {
        var _getBinding2;
        path = (_getBinding2 = oControl.getBinding("value")) === null || _getBinding2 === void 0 ? void 0 : _getBinding2.getResolvedPath();
      } else if (oControl !== null && oControl !== void 0 && oControl.isA("sap.ui.mdc.Field")) {
        path = oControl.getBinding("value").getResolvedPath();
      }
      const oMessage = new Message({
        target: path,
        type: parameters.type,
        message: parameters.message,
        processor: oControl === null || oControl === void 0 ? void 0 : oControl.getModel(),
        description: parameters.description,
        persistent: parameters.persistent
      });
      msgManager.addMessages(oMessage);
      return oMessage.getId();
    }

    /**
     * Removes a message from the field.
     *
     * @param id The id of the message
     * @public
     */;
    _proto.removeMessage = function removeMessage(id) {
      const msgManager = this.getMessageManager();
      const arr = msgManager.getMessageModel().getData();
      const result = arr.find(e => e.id === id);
      if (result) {
        msgManager.removeMessages(result);
      }
    };
    _proto.getMessageManager = function getMessageManager() {
      return Core.getMessageManager();
    };
    return FieldAPI;
  }(MacroAPI), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "editable", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "readOnly", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "change", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "liveChange", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "ariaLabelledBy", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "required", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "formatOptions", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "semanticObject", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "collaborationEnabled", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "mainPropertyRelativePath", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _applyDecoratedDescriptor(_class2.prototype, "handleChange", [_dec16], Object.getOwnPropertyDescriptor(_class2.prototype, "handleChange"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "handleLiveChange", [_dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "handleLiveChange"), _class2.prototype)), _class2)) || _class);
  return FieldAPI;
}, false);
