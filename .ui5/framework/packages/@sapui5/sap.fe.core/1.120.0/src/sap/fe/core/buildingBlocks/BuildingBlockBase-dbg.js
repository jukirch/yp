/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/deepClone", "sap/base/util/merge", "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor", "sap/fe/core/converters/ConverterContext", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/DataModelPathHelper"], function (deepClone, merge, BuildingBlockTemplateProcessor, ConverterContext, BindingToolkit, StableIdHelper, DataModelPathHelper) {
  "use strict";

  var _exports = {};
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var generate = StableIdHelper.generate;
  var isUndefinedExpression = BindingToolkit.isUndefinedExpression;
  var xml = BuildingBlockTemplateProcessor.xml;
  var unregisterBuildingBlock = BuildingBlockTemplateProcessor.unregisterBuildingBlock;
  var registerBuildingBlock = BuildingBlockTemplateProcessor.registerBuildingBlock;
  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
  function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
  function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
  /**
   * Base class for building blocks
   */
  let BuildingBlockBase = /*#__PURE__*/function () {
    function BuildingBlockBase(props, _controlConfiguration, _visitorSettings) {
      var _visitorSettings$mode;
      this.isPublic = false;
      this.getConverterContext = function (dataModelObjectPath, contextPath, settings, extraParams) {
        var _settings$models$view;
        const appComponent = settings.appComponent;
        const originalViewData = (_settings$models$view = settings.models.viewData) === null || _settings$models$view === void 0 ? void 0 : _settings$models$view.getData();
        let viewData = Object.assign({}, originalViewData);
        delete viewData.resourceModel;
        delete viewData.appComponent;
        viewData = deepClone(viewData);
        let controlConfiguration = {};
        // Only merge in page control configuration if the building block is on the same context
        const relativePath = getTargetObjectPath(dataModelObjectPath.contextLocation ?? dataModelObjectPath);
        if (relativePath === (originalViewData === null || originalViewData === void 0 ? void 0 : originalViewData.contextPath) || relativePath === `/${originalViewData === null || originalViewData === void 0 ? void 0 : originalViewData.entitySet}`) {
          controlConfiguration = viewData.controlConfiguration;
        }
        viewData.controlConfiguration = merge(controlConfiguration, extraParams || {});
        return ConverterContext.createConverterContextForMacro(dataModelObjectPath.startingEntitySet.name, settings.models.metaModel, appComponent === null || appComponent === void 0 ? void 0 : appComponent.getDiagnostics(), merge, dataModelObjectPath.contextLocation, viewData);
      };
      Object.keys(props).forEach(propName => {
        this[propName] = props[propName];
      });
      this.resourceModel = _visitorSettings === null || _visitorSettings === void 0 ? void 0 : (_visitorSettings$mode = _visitorSettings.models) === null || _visitorSettings$mode === void 0 ? void 0 : _visitorSettings$mode["sap.fe.i18n"];
    }

    /**
     * Only used internally
     *
     */
    _exports = BuildingBlockBase;
    var _proto = BuildingBlockBase.prototype;
    /**
     * Convert the given local element ID to a globally unique ID by prefixing with the Building Block ID.
     *
     * @param stringParts
     * @returns Either the global ID or undefined if the Building Block doesn't have an ID
     */
    _proto.createId = function createId() {
      // If the child instance has an ID property use it otherwise return undefined
      if (this.id) {
        for (var _len = arguments.length, stringParts = new Array(_len), _key = 0; _key < _len; _key++) {
          stringParts[_key] = arguments[_key];
        }
        return generate([this.id, ...stringParts]);
      }
      return undefined;
    }

    /**
     * Get the ID of the content control.
     *
     * @param buildingBlockId
     * @returns Return the ID
     */;
    _proto.getContentId = function getContentId(buildingBlockId) {
      return `${buildingBlockId}-content`;
    }

    /**
     * Returns translated text for a given resource key.
     *
     * @param textID ID of the Text
     * @param parameters Array of parameters that are used to create the text
     * @param metaPath Entity set name or action name to overload a text
     * @returns Determined text
     */;
    _proto.getTranslatedText = function getTranslatedText(textID, parameters, metaPath) {
      var _this$resourceModel;
      return ((_this$resourceModel = this.resourceModel) === null || _this$resourceModel === void 0 ? void 0 : _this$resourceModel.getText(textID, parameters, metaPath)) || textID;
    };
    /**
     * Only used internally.
     *
     * @returns All the properties defined on the object with their values
     */
    _proto.getProperties = function getProperties() {
      const allProperties = {};
      for (const oInstanceKey in this) {
        if (this.hasOwnProperty(oInstanceKey)) {
          allProperties[oInstanceKey] = this[oInstanceKey];
        }
      }
      return allProperties;
    };
    BuildingBlockBase.register = function register() {
      registerBuildingBlock(this);
    };
    BuildingBlockBase.unregister = function unregister() {
      unregisterBuildingBlock(this);
    }

    /**
     * Add a part of string based on the condition.
     *
     * @param condition
     * @param partToAdd
     * @returns The part to add if the condition is true, otherwise an empty string
     */;
    _proto.addConditionally = function addConditionally(condition, partToAdd) {
      if (condition) {
        return partToAdd;
      } else {
        return "";
      }
    }

    /**
     * Add an attribute depending on the current value of the property.
     * If it's undefined the attribute is not added.
     *
     * @param attributeName
     * @param value
     * @returns The attribute to add if the value is not undefined, otherwise an empty string
     */;
    _proto.attr = function attr(attributeName, value) {
      if (value !== undefined && !isUndefinedExpression(value)) {
        return () => xml`${attributeName}="${value}"`;
      } else {
        return () => "";
      }
    };
    _createClass(BuildingBlockBase, null, [{
      key: "metadata",
      get: function () {
        // We need to store the metadata on the actual subclass, not on BuildingBlockBase
        this.internalMetadata ??= {
          namespace: "",
          name: "",
          properties: {},
          aggregations: {},
          stereotype: "xmlmacro"
        };
        return this.internalMetadata;
      }
    }]);
    return BuildingBlockBase;
  }();
  BuildingBlockBase.isRuntime = false;
  _exports = BuildingBlockBase;
  return _exports;
}, false);
