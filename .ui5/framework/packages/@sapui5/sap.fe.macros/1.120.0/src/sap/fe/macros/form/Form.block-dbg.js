/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockBase", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/controls/Common/Form", "sap/fe/core/converters/helpers/ID", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/macros/form/FormHelper", "sap/ui/core/library", "sap/ui/model/odata/v4/AnnotationHelper"], function (BuildingBlockBase, BuildingBlockSupport, BuildingBlockTemplateProcessor, MetaModelConverter, Form, ID, BindingHelper, BindingToolkit, DataModelPathHelper, FormHelper, library, AnnotationHelper) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13;
  var _exports = {};
  var TitleLevel = library.TitleLevel;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var ifElse = BindingToolkit.ifElse;
  var equal = BindingToolkit.equal;
  var compileExpression = BindingToolkit.compileExpression;
  var UI = BindingHelper.UI;
  var getFormContainerID = ID.getFormContainerID;
  var createFormDefinition = Form.createFormDefinition;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var xml = BuildingBlockTemplateProcessor.xml;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockEvent = BuildingBlockSupport.blockEvent;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  var blockAggregation = BuildingBlockSupport.blockAggregation;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let FormBlock = (
  /**
   * Building block for creating a Form based on the metadata provided by OData V4.
   * <br>
   * It is designed to work based on a FieldGroup annotation but can also work if you provide a ReferenceFacet or a CollectionFacet
   *
   *
   * Usage example:
   * <pre>
   * &lt;macro:Form id="MyForm" metaPath="@com.sap.vocabularies.UI.v1.FieldGroup#GeneralInformation" /&gt;
   * </pre>
   *
   * @alias sap.fe.macros.Form
   * @public
   */
  _dec = defineBuildingBlock({
    name: "Form",
    namespace: "sap.fe.macros.internal",
    publicNamespace: "sap.fe.macros",
    returnTypes: ["sap.fe.macros.form.FormAPI"]
  }), _dec2 = blockAttribute({
    type: "string",
    isPublic: true,
    required: true
  }), _dec3 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true,
    isPublic: true,
    expectedTypes: ["EntitySet", "NavigationProperty", "Singleton", "EntityType"]
  }), _dec4 = blockAttribute({
    type: "sap.ui.model.Context",
    isPublic: true,
    required: true,
    expectedAnnotationTypes: ["com.sap.vocabularies.UI.v1.FieldGroupType", "com.sap.vocabularies.UI.v1.CollectionFacet", "com.sap.vocabularies.UI.v1.ReferenceFacet"],
    expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"]
  }), _dec5 = blockAttribute({
    type: "array"
  }), _dec6 = blockAttribute({
    type: "boolean"
  }), _dec7 = blockAttribute({
    type: "boolean"
  }), _dec8 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec9 = blockAttribute({
    type: "sap.ui.core.TitleLevel",
    isPublic: true
  }), _dec10 = blockAttribute({
    type: "string"
  }), _dec11 = blockAttribute({
    type: "string"
  }), _dec12 = blockEvent(), _dec13 = blockAggregation({
    type: "sap.fe.macros.form.FormElement",
    isPublic: true,
    slot: "formElements",
    isDefault: true
  }), _dec14 = blockAttribute({
    type: "object",
    isPublic: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(FormBlock, _BuildingBlockBase);
    /**
     * The identifier of the form control.
     */

    /**
     * Defines the path of the context used in the current page or block.
     * This setting is defined by the framework.
     *
     * @public
     */

    /**
     * Defines the relative path of the property in the metamodel, based on the current contextPath.
     *
     * @public
     */

    /**
     * The manifest defined form containers to be shown in the action area of the table
     */

    /**
     * Control the rendering of the form container labels
     */

    /**
     * Toggle Preview: Part of Preview / Preview via 'Show More' Button
     */

    /**
     * The title of the form control.
     *
     * @public
     */

    /**
     * Defines the "aria-level" of the form title, titles of internally used form containers are nested subsequently
     */

    /**
     * 	If set to false, the Form is not rendered.
     */

    // Independent from the form title, can be a bit confusing in standalone usage at is not showing anything by default

    // Just proxied down to the Field may need to see if needed or not

    /**
     * Defines the layout to be used within the form.
     * It defaults to the ColumnLayout, but you can also use a ResponsiveGridLayout.
     * All the properties of the ResponsiveGridLayout can be added to the configuration.
     */

    function FormBlock(props, configuration, mSettings) {
      var _this;
      _this = _BuildingBlockBase.call(this, props, configuration, mSettings) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "metaPath", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "formContainers", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "useFormContainerLabels", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "partOfPreview", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "title", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "titleLevel", _descriptor8, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "displayMode", _descriptor9, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "isVisible", _descriptor10, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "onChange", _descriptor11, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "formElements", _descriptor12, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "layout", _descriptor13, _assertThisInitialized(_this));
      if (_this.metaPath && _this.contextPath && (_this.formContainers === undefined || _this.formContainers === null)) {
        const oContextObjectPath = getInvolvedDataModelObjects(_this.metaPath, _this.contextPath);
        const mExtraSettings = {};
        let oFacetDefinition = oContextObjectPath.targetObject;
        let hasFieldGroup = false;
        if (oFacetDefinition && oFacetDefinition.$Type === "com.sap.vocabularies.UI.v1.FieldGroupType") {
          // Wrap the facet in a fake Facet annotation
          hasFieldGroup = true;
          oFacetDefinition = {
            $Type: "com.sap.vocabularies.UI.v1.ReferenceFacet",
            Label: oFacetDefinition.Label,
            Target: {
              $target: oFacetDefinition,
              fullyQualifiedName: oFacetDefinition.fullyQualifiedName,
              path: "",
              term: "",
              type: "AnnotationPath",
              value: getContextRelativeTargetObjectPath(oContextObjectPath)
            },
            annotations: {},
            fullyQualifiedName: oFacetDefinition.fullyQualifiedName
          };
          mExtraSettings[oFacetDefinition.Target.value] = {
            fields: _this.formElements
          };
        }
        const oConverterContext = _this.getConverterContext(oContextObjectPath, /*this.contextPath*/undefined, mSettings, mExtraSettings);
        const oFormDefinition = createFormDefinition(oFacetDefinition, _this.isVisible, oConverterContext);
        if (hasFieldGroup) {
          oFormDefinition.formContainers[0].annotationPath = _this.metaPath.getPath();
        }
        _this.formContainers = oFormDefinition.formContainers;
        _this.useFormContainerLabels = oFormDefinition.useFormContainerLabels;
        _this.facetType = oFacetDefinition && oFacetDefinition.$Type;
      } else {
        var _this$metaPath$getObj;
        _this.facetType = (_this$metaPath$getObj = _this.metaPath.getObject()) === null || _this$metaPath$getObj === void 0 ? void 0 : _this$metaPath$getObj.$Type;
      }
      if (!_this.isPublic) {
        _this._apiId = _this.createId("Form");
        _this._contentId = _this.id;
      } else {
        _this._apiId = _this.id;
        _this._contentId = `${_this.id}-content`;
      }
      // if displayMode === true -> _editable = false
      // if displayMode === false -> _editable = true
      //  => if displayMode === {myBindingValue} -> _editable = {myBindingValue} === true ? true : false
      // if DisplayMode === undefined -> _editable = {ui>/isEditable}
      if (_this.displayMode !== undefined) {
        _this._editable = compileExpression(ifElse(equal(resolveBindingString(_this.displayMode, "boolean"), false), true, false));
      } else {
        _this._editable = compileExpression(UI.IsEditable);
      }
      return _this;
    }
    _exports = FormBlock;
    var _proto = FormBlock.prototype;
    _proto.getDataFieldCollection = function getDataFieldCollection(formContainer, facetContext) {
      const facet = getInvolvedDataModelObjects(facetContext).targetObject;
      let navigationPath;
      let idPart;
      if (facet.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet") {
        navigationPath = AnnotationHelper.getNavigationPath(facet.Target.value);
        idPart = facet;
      } else {
        const contextPathPath = this.contextPath.getPath();
        let facetPath = facetContext.getPath();
        if (facetPath.startsWith(contextPathPath)) {
          facetPath = facetPath.substring(contextPathPath.length);
        }
        navigationPath = AnnotationHelper.getNavigationPath(facetPath);
        idPart = facetPath;
      }
      const titleLevel = FormHelper.getFormContainerTitleLevel(this.title, this.titleLevel);
      const title = this.useFormContainerLabels && facet ? AnnotationHelper.label(facet, {
        context: facetContext
      }) : "";
      const id = this.id ? getFormContainerID(idPart) : undefined;
      return xml`
					<macro:FormContainer
					xmlns:macro="sap.fe.macros"
					${this.attr("id", id)}
					title="${title}"
					titleLevel="${titleLevel}"
					contextPath="${navigationPath ? formContainer.entitySet : this.contextPath}"
					metaPath="${facetContext}"
					dataFieldCollection="${formContainer.formElements}"
					navigationPath="${navigationPath}"
					visible="${formContainer.isVisible}"
					displayMode="${this.displayMode}"
					onChange="${this.onChange}"
					actions="${formContainer.actions}"
				>
				<macro:formElements>
					<slot name="formElements" />
				</macro:formElements>
			</macro:FormContainer>`;
    };
    _proto.getFormContainers = function getFormContainers() {
      if (this.formContainers.length === 0) {
        return "";
      }
      if (this.facetType.includes("com.sap.vocabularies.UI.v1.CollectionFacet")) {
        return this.formContainers.map((formContainer, formContainerIdx) => {
          if (formContainer.isVisible) {
            const facetContext = this.contextPath.getModel().createBindingContext(formContainer.annotationPath, this.contextPath);
            const facet = facetContext.getObject();
            if (facet.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet" && FormHelper.isReferenceFacetPartOfPreview(facet, this.partOfPreview)) {
              if (facet.Target.$AnnotationPath.$Type === "com.sap.vocabularies.Communication.v1.AddressType") {
                return xml`<template:with path="formContainers>${formContainerIdx}" var="formContainer">
											<template:with path="formContainers>${formContainerIdx}/annotationPath" var="facet">
												<core:Fragment fragmentName="sap.fe.macros.form.AddressSection" type="XML" />
											</template:with>
										</template:with>`;
              }
              return this.getDataFieldCollection(formContainer, facetContext);
            }
          }
          return "";
        });
      } else if (this.facetType === "com.sap.vocabularies.UI.v1.ReferenceFacet") {
        return this.formContainers.map(formContainer => {
          if (formContainer.isVisible) {
            const facetContext = this.contextPath.getModel().createBindingContext(formContainer.annotationPath, this.contextPath);
            return this.getDataFieldCollection(formContainer, facetContext);
          } else {
            return "";
          }
        });
      }
      return "";
    }

    /**
     * Create the proper layout information based on the `layout` property defined externally.
     *
     * @returns The layout information for the xml.
     */;
    _proto.getLayoutInformation = function getLayoutInformation() {
      switch (this.layout.type) {
        case "ResponsiveGridLayout":
          return xml`<f:ResponsiveGridLayout adjustLabelSpan="${this.layout.adjustLabelSpan}"
													breakpointL="${this.layout.breakpointL}"
													breakpointM="${this.layout.breakpointM}"
													breakpointXL="${this.layout.breakpointXL}"
													columnsL="${this.layout.columnsL}"
													columnsM="${this.layout.columnsM}"
													columnsXL="${this.layout.columnsXL}"
													emptySpanL="${this.layout.emptySpanL}"
													emptySpanM="${this.layout.emptySpanM}"
													emptySpanS="${this.layout.emptySpanS}"
													emptySpanXL="${this.layout.emptySpanXL}"
													labelSpanL="${this.layout.labelSpanL}"
													labelSpanM="${this.layout.labelSpanM}"
													labelSpanS="${this.layout.labelSpanS}"
													labelSpanXL="${this.layout.labelSpanXL}"
													singleContainerFullSize="${this.layout.singleContainerFullSize}" />`;
        case "ColumnLayout":
        default:
          return xml`<f:ColumnLayout
								columnsM="${this.layout.columnsM}"
								columnsL="${this.layout.columnsL}"
								columnsXL="${this.layout.columnsXL}"
								labelCellsLarge="${this.layout.labelCellsLarge}"
								emptyCellsLarge="${this.layout.emptyCellsLarge}" />`;
      }
    };
    _proto.getTemplate = function getTemplate() {
      const onChangeStr = this.onChange && this.onChange.replace("{", "\\{").replace("}", "\\}") || "";
      const metaPathPath = this.metaPath.getPath();
      const contextPathPath = this.contextPath.getPath();
      if (!this.isVisible) {
        return "";
      } else {
        return xml`<macro:FormAPI xmlns:macro="sap.fe.macros.form"
					xmlns:macrodata="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
					xmlns:f="sap.ui.layout.form"
					xmlns:fl="sap.ui.fl"
					id="${this._apiId}"
					metaPath="${metaPathPath}"
					contextPath="${contextPathPath}">
				<f:Form
					fl:delegate='{
						"name": "sap/fe/macros/form/FormDelegate",
						"delegateType": "complete"
					}'
					id="${this._contentId}"
					editable="${this._editable}"
					macrodata:entitySet="{contextPath>@sapui.name}"
					visible="${this.isVisible}"
					class="sapUxAPObjectPageSubSectionAlignContent"
					macrodata:navigationPath="${contextPathPath}"
					macrodata:onChange="${onChangeStr}"
				>
					${this.addConditionally(this.title !== undefined, xml`<f:title>
							<core:Title level="${this.titleLevel}" text="${this.title}" />
						</f:title>`)}
					<f:layout>
					${this.getLayoutInformation()}

					</f:layout>
					<f:formContainers>
						${this.getFormContainers()}
					</f:formContainers>
				</f:Form>
			</macro:FormAPI>`;
      }
    };
    return FormBlock;
  }(BuildingBlockBase), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "formContainers", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "useFormContainerLabels", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "partOfPreview", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "title", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "titleLevel", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return TitleLevel.Auto;
    }
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "displayMode", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "isVisible", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "true";
    }
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "onChange", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "formElements", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "layout", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return {
        type: "ColumnLayout",
        columnsM: 2,
        columnsXL: 6,
        columnsL: 3,
        labelCellsLarge: 12
      };
    }
  })), _class2)) || _class);
  _exports = FormBlock;
  return _exports;
}, false);
