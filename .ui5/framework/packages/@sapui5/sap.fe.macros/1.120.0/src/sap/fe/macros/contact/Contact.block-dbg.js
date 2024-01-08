/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockBase", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/macros/contact/ContactHelper"], function (BuildingBlockBase, BuildingBlockSupport, BuildingBlockTemplateProcessor, MetaModelConverter, BindingToolkit, StableIdHelper, DataModelPathHelper, ContactHelper) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7;
  var _exports = {};
  var getMsTeamsMail = ContactHelper.getMsTeamsMail;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var generate = StableIdHelper.generate;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var convertMetaModelContext = MetaModelConverter.convertMetaModelContext;
  var xml = BuildingBlockTemplateProcessor.xml;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let ContactBlock = (
  /**
   * Macro for creating a Contact based on provided OData v4 metadata.
   *
   *
   * Usage example:
   * <pre>
   * &lt;macro:Contact
   *   id="someID"
   *   contact="{contact>}"
   *   contextPath="{contextPath>}"
   * /&gt;
   * </pre>
   *
   * @private
   * @experimental
   */
  _dec = defineBuildingBlock({
    name: "Contact",
    namespace: "sap.fe.macros",
    designtime: "sap/fe/macros/Contact.designtime"
  }), _dec2 = blockAttribute({
    type: "string"
  }), _dec3 = blockAttribute({
    type: "string"
  }), _dec4 = blockAttribute({
    type: "sap.ui.model.Context",
    expectedTypes: ["com.sap.vocabularies.Communication.v1.ContactType"],
    required: true
  }), _dec5 = blockAttribute({
    type: "sap.ui.model.Context",
    expectedTypes: ["EntitySet", "NavigationProperty", "EntityType", "Singleton"]
  }), _dec6 = blockAttribute({
    type: "string"
  }), _dec7 = blockAttribute({
    type: "boolean"
  }), _dec8 = blockAttribute({
    type: "boolean"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(ContactBlock, _BuildingBlockBase);
    function ContactBlock() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BuildingBlockBase.call(this, ...args) || this;
      _initializerDefineProperty(_this, "idPrefix", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "_flexId", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "metaPath", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "ariaLabelledBy", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "visible", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "showEmptyIndicator", _descriptor7, _assertThisInitialized(_this));
      return _this;
    }
    _exports = ContactBlock;
    var _proto = ContactBlock.prototype;
    /**
     * The building block template function.
     *
     * @returns An XML-based string with the definition of the field control
     */
    _proto.getTemplate = function getTemplate() {
      let id;
      if (this._flexId) {
        //in case a flex id is given, take this one
        id = this._flexId;
      } else {
        //alternatively check for idPrefix and generate an appropriate id
        id = this.idPrefix ? generate([this.idPrefix, "Field-content"]) : undefined;
      }
      const convertedContact = convertMetaModelContext(this.metaPath);
      const myDataModel = getInvolvedDataModelObjects(this.metaPath, this.contextPath);
      const value = getExpressionFromAnnotation(convertedContact.fn, getRelativePaths(myDataModel));
      const delegateConfiguration = {
        name: "sap/fe/macros/contact/ContactDelegate",
        payload: {
          contact: this.metaPath.getPath(),
          mail: getMsTeamsMail(myDataModel)
        }
      };
      return xml`<mdc:Field
		xmlns:mdc="sap.ui.mdc"
		delegate="{name: 'sap/fe/macros/field/FieldBaseDelegate'}"
		${this.attr("id", id)}
		editMode="Display"
		width="100%"
		${this.attr("visible", this.visible)}
		${this.attr("showEmptyIndicator", this.showEmptyIndicator)}
		${this.attr("value", value)}
		${this.attr("ariaLabelledBy", this.ariaLabelledBy)}
	>
		<mdc:fieldInfo>
			<mdc:Link
				core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
				enablePersonalization="false"
				${this.attr("delegate", JSON.stringify(delegateConfiguration))}
			/>
		</mdc:fieldInfo>
	</mdc:Field>
			`;
    };
    return ContactBlock;
  }(BuildingBlockBase), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "idPrefix", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_flexId", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "ariaLabelledBy", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "showEmptyIndicator", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = ContactBlock;
  return _exports;
}, false);
