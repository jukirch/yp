/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/TemplateModel", "sap/fe/core/buildingBlocks/BuildingBlockBase", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/controls/Common/DataVisualization", "sap/fe/core/converters/controls/ListReport/FilterBar", "sap/fe/core/helpers/MetaModelFunction", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/FilterHelper", "sap/fe/macros/CommonHelper"], function (Log, TemplateModel, BuildingBlockBase, BuildingBlockSupport, BuildingBlockTemplateProcessor, MetaModelConverter, DataVisualization, FilterBar, MetaModelFunction, ModelHelper, StableIdHelper, FilterHelper, CommonHelper) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _descriptor26, _descriptor27, _descriptor28, _descriptor29, _descriptor30;
  var _exports = {};
  var getFilterConditions = FilterHelper.getFilterConditions;
  var generate = StableIdHelper.generate;
  var getSearchRestrictions = MetaModelFunction.getSearchRestrictions;
  var getSelectionFields = FilterBar.getSelectionFields;
  var getSelectionVariant = DataVisualization.getSelectionVariant;
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
  const setCustomFilterFieldProperties = function (childFilterField, aggregationObject) {
    aggregationObject.slotName = aggregationObject.key;
    aggregationObject.key = aggregationObject.key.replace("InlineXML_", "");
    aggregationObject.label = childFilterField.getAttribute("label");
    aggregationObject.required = childFilterField.getAttribute("required") === "true";
    return aggregationObject;
  };

  /**
   * Building block for creating a FilterBar based on the metadata provided by OData V4.
   *
   *
   * Usage example:
   * <pre>
   * &lt;macro:FilterBar
   *   id="SomeID"
   *   showAdaptFiltersButton="true"
   *   p13nMode=["Item","Value"]
   *   listBindingNames = "sap.fe.tableBinding"
   *   liveMode="true"
   *   search=".handlers.onSearch"
   *   filterChanged=".handlers.onFiltersChanged"
   * /&gt;
   * </pre>
   *
   * Building block for creating a FilterBar based on the metadata provided by OData V4.
   *
   * @since 1.94.0
   */
  let FilterBarBlock = (_dec = defineBuildingBlock({
    name: "FilterBar",
    namespace: "sap.fe.macros.internal",
    publicNamespace: "sap.fe.macros",
    returnTypes: ["sap.fe.macros.filterBar.FilterBarAPI"]
  }), _dec2 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec3 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec4 = blockAttribute({
    type: "sap.ui.model.Context"
  }), _dec5 = blockAttribute({
    type: "string"
  }), _dec6 = blockAttribute({
    type: "sap.ui.model.Context",
    isPublic: true
  }), _dec7 = blockAttribute({
    type: "sap.ui.model.Context",
    isPublic: true
  }), _dec8 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec9 = blockAttribute({
    type: "string"
  }), _dec10 = blockAttribute({
    type: "boolean"
  }), _dec11 = blockAttribute({
    type: "boolean"
  }), _dec12 = blockAttribute({
    type: "boolean"
  }), _dec13 = blockAttribute({
    type: "sap.ui.mdc.FilterBarP13nMode[]"
  }), _dec14 = blockAttribute({
    type: "string"
  }), _dec15 = blockAttribute({
    type: "boolean"
  }), _dec16 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec17 = blockAttribute({
    type: "string",
    required: false
  }), _dec18 = blockAttribute({
    type: "boolean"
  }), _dec19 = blockAttribute({
    type: "boolean"
  }), _dec20 = blockAttribute({
    type: "boolean"
  }), _dec21 = blockAttribute({
    type: "string"
  }), _dec22 = blockAttribute({
    type: "string"
  }), _dec23 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec24 = blockAttribute({
    type: "boolean"
  }), _dec25 = blockEvent(), _dec26 = blockEvent(), _dec27 = blockEvent(), _dec28 = blockEvent(), _dec29 = blockEvent(), _dec30 = blockEvent(), _dec31 = blockAggregation({
    type: "sap.fe.macros.FilterField",
    isPublic: true,
    hasVirtualNode: true,
    processAggregations: setCustomFilterFieldProperties
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(FilterBarBlock, _BuildingBlockBase);
    /**
     * ID of the FilterBar
     */

    /**
     * selectionFields to be displayed
     */

    /**
     * Displays possible errors during the search in a message box
     */

    /**
     * ID of the assigned variant management
     */

    /**
     * Don't show the basic search field
     */

    /**
     * Enables the fallback to show all fields of the EntityType as filter fields if com.sap.vocabularies.UI.v1.SelectionFields are not present
     */

    /**
     * Handles visibility of the 'Adapt Filters' button on the FilterBar
     */

    /**
     * Specifies the personalization options for the filter bar.
     */

    /**
     * Specifies the Sematic Date Range option for the filter bar.
     */

    /**
     * If set the search will be automatically triggered, when a filter value was changed.
     */

    /**
     * Filter conditions to be applied to the filter bar
     */

    /**
     * If set to <code>true</code>, all search requests are ignored. Once it has been set to <code>false</code>,
     * a search is triggered immediately if one or more search requests have been triggered in the meantime
     * but were ignored based on the setting.
     */

    /**
     * Id of control that will allow for switching between normal and visual filter
     */

    /**
     * Handles the visibility of the 'Clear' button on the FilterBar.
     */

    /**
     * Event handler to react to the search event of the FilterBar
     */

    /**
     * Event handler to react to the filterChange event of the FilterBar
     */

    /**
     * Event handler to react to the stateChange event of the FilterBar.
     */

    /**
     * Event handler to react to the filterChanged event of the FilterBar. Exposes parameters from the MDC filter bar
     */

    /**
     * Event handler to react to the search event of the FilterBar. Exposes parameteres from the MDC filter bar
     */

    /**
     * Event handler to react to the afterClear event of the FilterBar
     */

    function FilterBarBlock(props, configuration, mSettings) {
      var _this$contextPath, _targetEntitySet$anno, _targetEntitySet$anno2, _targetEntitySet$anno3, _targetEntitySet$anno4;
      var _this;
      _this = _BuildingBlockBase.call(this, props, configuration, mSettings) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "visible", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "selectionFields", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "filterBarDelegate", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "metaPath", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "showMessages", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "variantBackreference", _descriptor8, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "hideBasicSearch", _descriptor9, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "enableFallback", _descriptor10, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "showAdaptFiltersButton", _descriptor11, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "p13nMode", _descriptor12, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "propertyInfo", _descriptor13, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "useSemanticDateRange", _descriptor14, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "liveMode", _descriptor15, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "filterConditions", _descriptor16, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "suspendSelection", _descriptor17, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "showDraftEditState", _descriptor18, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "isDraftCollaborative", _descriptor19, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "toggleControlId", _descriptor20, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "initialLayout", _descriptor21, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "showClearButton", _descriptor22, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "_applyIdToContent", _descriptor23, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "search", _descriptor24, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "filterChanged", _descriptor25, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "stateChange", _descriptor26, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "internalFilterChanged", _descriptor27, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "internalSearch", _descriptor28, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "afterClear", _descriptor29, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "filterFields", _descriptor30, _assertThisInitialized(_this));
      _this.checkIfCollaborationDraftSupported = oMetaModel => {
        if (ModelHelper.isCollaborationDraftSupported(oMetaModel)) {
          _this.isDraftCollaborative = true;
        }
      };
      _this.getEntityTypePath = metaPathParts => {
        return metaPathParts[0].endsWith("/") ? metaPathParts[0] : metaPathParts[0] + "/";
      };
      _this.getSearch = () => {
        if (!_this.hideBasicSearch) {
          return xml`<control:basicSearchField>
			<mdc:FilterField
				id="${generate([_this.id, "BasicSearchField"])}"
				placeholder="{sap.fe.i18n>M_FILTERBAR_SEARCH}"
				conditions="{$filters>/conditions/$search}"
				dataType="sap.ui.model.odata.type.String"
				maxConditions="1"
			/>
		</control:basicSearchField>`;
        }
        return "";
      };
      _this.processSelectionFields = () => {
        var _this$_filterFields, _this$selectionFields, _this$_filterFields2, _this$_valueHelps;
        let draftEditState = "";
        if (_this.showDraftEditState) {
          draftEditState = `<core:Fragment fragmentName="sap.fe.core.filter.DraftEditState" type="XML" />`;
        }
        _this._valueHelps = [];
        _this._filterFields = [];
        (_this$_filterFields = _this._filterFields) === null || _this$_filterFields === void 0 ? void 0 : _this$_filterFields.push(draftEditState);
        if (!Array.isArray(_this.selectionFields)) {
          _this.selectionFields = _this.selectionFields.getObject();
        }
        (_this$selectionFields = _this.selectionFields) === null || _this$selectionFields === void 0 ? void 0 : _this$selectionFields.forEach((selectionField, selectionFieldIdx) => {
          if (selectionField.availability === "Default") {
            _this.setFilterFieldsAndValueHelps(selectionField, selectionFieldIdx);
          }
        });
        _this._filterFields = ((_this$_filterFields2 = _this._filterFields) === null || _this$_filterFields2 === void 0 ? void 0 : _this$_filterFields2.length) > 0 ? _this._filterFields : "";
        _this._valueHelps = ((_this$_valueHelps = _this._valueHelps) === null || _this$_valueHelps === void 0 ? void 0 : _this$_valueHelps.length) > 0 ? _this._valueHelps : "";
      };
      _this.setFilterFieldsAndValueHelps = (selectionField, selectionFieldIdx) => {
        if (selectionField.template === undefined && selectionField.type !== "Slot") {
          _this.pushFilterFieldsAndValueHelps(selectionField);
        } else if (Array.isArray(_this._filterFields)) {
          var _this$_filterFields3;
          (_this$_filterFields3 = _this._filterFields) === null || _this$_filterFields3 === void 0 ? void 0 : _this$_filterFields3.push(xml`<template:with path="selectionFields>${selectionFieldIdx}" var="item">
					<core:Fragment fragmentName="sap.fe.macros.filter.CustomFilter" type="XML" />
				</template:with>`);
        }
      };
      _this.pushFilterFieldsAndValueHelps = selectionField => {
        if (Array.isArray(_this._filterFields)) {
          var _this$_filterFields4;
          (_this$_filterFields4 = _this._filterFields) === null || _this$_filterFields4 === void 0 ? void 0 : _this$_filterFields4.push(xml`<internalMacro:FilterField
			idPrefix="${generate([_this.id, "FilterField", CommonHelper.getNavigationPath(selectionField.annotationPath)])}"
			vhIdPrefix="${generate([_this.id, "FilterFieldValueHelp"])}"
			property="${selectionField.annotationPath}"
			contextPath="${_this._getContextPathForFilterField(selectionField, _this._internalContextPath)}"
			useSemanticDateRange="${_this.useSemanticDateRange}"
			settings="${CommonHelper.stringifyCustomData(selectionField.settings)}"
			visualFilter="${selectionField.visualFilter}"
			/>`);
        }
        if (Array.isArray(_this._valueHelps)) {
          var _this$_valueHelps2;
          (_this$_valueHelps2 = _this._valueHelps) === null || _this$_valueHelps2 === void 0 ? void 0 : _this$_valueHelps2.push(xml`<macro:ValueHelp
			idPrefix="${generate([_this.id, "FilterFieldValueHelp"])}"
			conditionModel="$filters"
			property="${selectionField.annotationPath}"
			contextPath="${_this._getContextPathForFilterField(selectionField, _this._internalContextPath)}"
			filterFieldValueHelp="true"
			useSemanticDateRange="${_this.useSemanticDateRange}"
		/>`);
        }
      };
      if (!_this.metaPath) {
        Log.error("Context Path not available for FilterBar Macro.");
        return _assertThisInitialized(_this);
      }
      const sMetaPath = _this.metaPath.getPath();
      let entityTypePath = "";
      const _metaPathParts = (sMetaPath === null || sMetaPath === void 0 ? void 0 : sMetaPath.split("/@com.sap.vocabularies.UI.v1.SelectionFields")) || []; // [0]: entityTypePath, [1]: SF Qualifier.
      if (_metaPathParts.length > 0) {
        entityTypePath = _this.getEntityTypePath(_metaPathParts);
      }
      const sEntitySetPath = ModelHelper.getEntitySetPath(entityTypePath);
      const _oMetaModel = (_this$contextPath = _this.contextPath) === null || _this$contextPath === void 0 ? void 0 : _this$contextPath.getModel();
      _this._internalContextPath = _oMetaModel === null || _oMetaModel === void 0 ? void 0 : _oMetaModel.createBindingContext(entityTypePath);
      const sObjectPath = "@com.sap.vocabularies.UI.v1.SelectionFields";
      const annotationPath = "@com.sap.vocabularies.UI.v1.SelectionFields" + (_metaPathParts.length && _metaPathParts[1] || "");
      const oExtraParams = {};
      oExtraParams[sObjectPath] = {
        filterFields: _this.filterFields
      };
      const oVisualizationObjectPath = getInvolvedDataModelObjects(_this._internalContextPath);
      const oConverterContext = _this.getConverterContext(oVisualizationObjectPath, undefined, mSettings, oExtraParams);
      if (!_this.propertyInfo) {
        _this.propertyInfo = getSelectionFields(oConverterContext, [], annotationPath).sPropertyInfo;
      }

      //Filter Fields and values to the field are filled based on the selectionFields and this would be empty in case of macro outside the FE template
      if (!_this.selectionFields) {
        const oSelectionFields = getSelectionFields(oConverterContext, [], annotationPath).selectionFields;
        _this.selectionFields = new TemplateModel(oSelectionFields, _oMetaModel).createBindingContext("/");
        const oEntityType = oConverterContext.getEntityType(),
          oSelectionVariant = getSelectionVariant(oEntityType, oConverterContext),
          oEntitySetContext = _oMetaModel.getContext(sEntitySetPath),
          oFilterConditions = getFilterConditions(oEntitySetContext, {
            selectionVariant: oSelectionVariant
          });
        _this.filterConditions = oFilterConditions;
      }
      _this._processPropertyInfos(_this.propertyInfo);
      const targetEntitySet = getInvolvedDataModelObjects(_this.metaPath, _this.contextPath).targetEntitySet;
      if (targetEntitySet !== null && targetEntitySet !== void 0 && (_targetEntitySet$anno = targetEntitySet.annotations) !== null && _targetEntitySet$anno !== void 0 && (_targetEntitySet$anno2 = _targetEntitySet$anno.Common) !== null && _targetEntitySet$anno2 !== void 0 && _targetEntitySet$anno2.DraftRoot || targetEntitySet !== null && targetEntitySet !== void 0 && (_targetEntitySet$anno3 = targetEntitySet.annotations) !== null && _targetEntitySet$anno3 !== void 0 && (_targetEntitySet$anno4 = _targetEntitySet$anno3.Common) !== null && _targetEntitySet$anno4 !== void 0 && _targetEntitySet$anno4.DraftNode) {
        _this.showDraftEditState = true;
        _this.checkIfCollaborationDraftSupported(_oMetaModel);
      }
      if (_this._applyIdToContent) {
        _this._apiId = _this.id + "::FilterBar";
        _this._contentId = _this.id;
      } else {
        _this._apiId = _this.id;
        _this._contentId = _this.getContentId(_this.id + "");
      }
      if (_this.hideBasicSearch !== true) {
        const oSearchRestrictionAnnotation = getSearchRestrictions(sEntitySetPath, _oMetaModel);
        _this.hideBasicSearch = Boolean(oSearchRestrictionAnnotation && !oSearchRestrictionAnnotation.Searchable);
      }
      _this.processSelectionFields();
      return _this;
    }
    _exports = FilterBarBlock;
    var _proto = FilterBarBlock.prototype;
    _proto._processPropertyInfos = function _processPropertyInfos(propertyInfo) {
      const aParameterFields = [];
      if (propertyInfo) {
        const sFetchedProperties = propertyInfo.replace(/\\{/g, "{").replace(/\\}/g, "}");
        const aFetchedProperties = JSON.parse(sFetchedProperties);
        const editStateLabel = this.getTranslatedText("FILTERBAR_EDITING_STATUS");
        aFetchedProperties.forEach(function (propInfo) {
          if (propInfo.isParameter) {
            aParameterFields.push(propInfo.name);
          }
          if (propInfo.path === "$editState") {
            propInfo.label = editStateLabel;
          }
        });
        this.propertyInfo = JSON.stringify(aFetchedProperties).replace(/\{/g, "\\{").replace(/\}/g, "\\}");
      }
      this._parameters = JSON.stringify(aParameterFields);
    };
    _proto._getContextPathForFilterField = function _getContextPathForFilterField(selectionField, filterBarContextPath) {
      let contextPath = filterBarContextPath;
      if (selectionField.isParameter) {
        // Example:
        // FilterBarContextPath: /Customer/Set
        // ParameterPropertyPath: /Customer/P_CC
        // ContextPathForFilterField: /Customer
        const annoPath = selectionField.annotationPath;
        contextPath = annoPath.substring(0, annoPath.lastIndexOf("/") + 1);
      }
      return contextPath;
    };
    _proto.getTemplate = function getTemplate() {
      var _this$_internalContex;
      const internalContextPath = (_this$_internalContex = this._internalContextPath) === null || _this$_internalContex === void 0 ? void 0 : _this$_internalContex.getPath();
      let filterDelegate = "";
      if (this.filterBarDelegate) {
        filterDelegate = this.filterBarDelegate;
      } else {
        filterDelegate = "{name:'sap/fe/macros/filterBar/FilterBarDelegate', payload: {entityTypePath: '" + internalContextPath + "'}}";
      }
      return xml`<macroFilterBar:FilterBarAPI
        xmlns:template="http://schemas.sap.com/sapui5/extension/sap.ui.core.template/1"
        xmlns:core="sap.ui.core"
        xmlns:mdc="sap.ui.mdc"
        xmlns:control="sap.fe.core.controls"
        xmlns:macroFilterBar="sap.fe.macros.filterBar"
        xmlns:macro="sap.fe.macros"
        xmlns:internalMacro="sap.fe.macros.internal"
        xmlns:customData="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
		id="${this._apiId}"
		search="${this.search}"
		filterChanged="${this.filterChanged}"
		afterClear="${this.afterClear}"
		internalSearch="${this.internalSearch}"
		internalFilterChanged="${this.internalFilterChanged}"
		stateChange="${this.stateChange}"
	>
		<control:FilterBar
			core:require="{API: 'sap/fe/macros/filterBar/FilterBarAPI'}"
			id="${this._contentId}"
			liveMode="${this.liveMode}"
			delegate="${filterDelegate}"
			variantBackreference="${this.variantBackreference}"
			showAdaptFiltersButton="${this.showAdaptFiltersButton}"
			showClearButton="${this.showClearButton}"
			p13nMode="${this.p13nMode}"
			search="API.handleSearch($event)"
			filtersChanged="API.handleFilterChanged($event)"
			filterConditions="${this.filterConditions}"
			suspendSelection="${this.suspendSelection}"
			showMessages="${this.showMessages}"
			toggleControl="${this.toggleControlId}"
			initialLayout="${this.initialLayout}"
			propertyInfo="${this.propertyInfo}"
			customData:localId="${this.id}"
			visible="${this.visible}"
			customData:hideBasicSearch="${this.hideBasicSearch}"
			customData:showDraftEditState="${this.showDraftEditState}"
			customData:useSemanticDateRange="${this.useSemanticDateRange}"
			customData:entityType="${internalContextPath}"
			customData:parameters="${this._parameters}"
		>
			<control:dependents>
				${this._valueHelps}
			</control:dependents>
			${this.getSearch()}
			<control:filterItems>
				${this._filterFields}
			</control:filterItems>
		</control:FilterBar>
	</macroFilterBar:FilterBarAPI>`;
    };
    return FilterBarBlock;
  }(BuildingBlockBase), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "selectionFields", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "filterBarDelegate", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "showMessages", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "variantBackreference", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "hideBasicSearch", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "enableFallback", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "showAdaptFiltersButton", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "p13nMode", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "Item,Value";
    }
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "propertyInfo", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "useSemanticDateRange", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "liveMode", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "filterConditions", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "suspendSelection", [_dec18], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "showDraftEditState", [_dec19], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "isDraftCollaborative", [_dec20], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "toggleControlId", [_dec21], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "initialLayout", [_dec22], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "compact";
    }
  }), _descriptor22 = _applyDecoratedDescriptor(_class2.prototype, "showClearButton", [_dec23], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor23 = _applyDecoratedDescriptor(_class2.prototype, "_applyIdToContent", [_dec24], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor24 = _applyDecoratedDescriptor(_class2.prototype, "search", [_dec25], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor25 = _applyDecoratedDescriptor(_class2.prototype, "filterChanged", [_dec26], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor26 = _applyDecoratedDescriptor(_class2.prototype, "stateChange", [_dec27], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor27 = _applyDecoratedDescriptor(_class2.prototype, "internalFilterChanged", [_dec28], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor28 = _applyDecoratedDescriptor(_class2.prototype, "internalSearch", [_dec29], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor29 = _applyDecoratedDescriptor(_class2.prototype, "afterClear", [_dec30], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor30 = _applyDecoratedDescriptor(_class2.prototype, "filterFields", [_dec31], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = FilterBarBlock;
  return _exports;
}, false);
