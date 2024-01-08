/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/SemanticObjectHelper", "sap/fe/macros/field/FieldTemplating", "sap/fe/core/buildingBlocks/BuildingBlockBase", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor", "sap/fe/core/templating/DataModelPathHelper"], function (MetaModelConverter, BindingToolkit, TypeGuards, SemanticObjectHelper, FieldTemplating, BuildingBlockBase, BuildingBlockSupport, BuildingBlockTemplateProcessor, DataModelPathHelper) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _descriptor3;
  var _exports = {};
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var xml = BuildingBlockTemplateProcessor.xml;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  var isUsedInNavigationWithQuickViewFacets = FieldTemplating.isUsedInNavigationWithQuickViewFacets;
  var getPropertyWithSemanticObject = FieldTemplating.getPropertyWithSemanticObject;
  var getDataModelObjectPathForValue = FieldTemplating.getDataModelObjectPathForValue;
  var getSemanticObjects = SemanticObjectHelper.getSemanticObjects;
  var getSemanticObjectUnavailableActions = SemanticObjectHelper.getSemanticObjectUnavailableActions;
  var getSemanticObjectMappings = SemanticObjectHelper.getSemanticObjectMappings;
  var getDynamicPathFromSemanticObject = SemanticObjectHelper.getDynamicPathFromSemanticObject;
  var isProperty = TypeGuards.isProperty;
  var pathInModel = BindingToolkit.pathInModel;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var compileExpression = BindingToolkit.compileExpression;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let QuickViewBlock = (_dec = defineBuildingBlock({
    name: "QuickView",
    namespace: "sap.fe.macros",
    designtime: "sap/fe/macros/quickView/QuickView.designtime"
  }), _dec2 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true,
    expectedTypes: ["Property"],
    expectedAnnotationTypes: ["com.sap.vocabularies.UI.v1.DataField", "com.sap.vocabularies.UI.v1.DataFieldWithUrl", "com.sap.vocabularies.UI.v1.DataFieldForAnnotation", "com.sap.vocabularies.UI.v1.DataPointType"]
  }), _dec3 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true,
    expectedTypes: ["EntitySet", "NavigationProperty", "EntityType", "Singleton"]
  }), _dec4 = blockAttribute({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(QuickViewBlock, _BuildingBlockBase);
    /**
     * Metadata path to the dataField.
     * This property is usually a metadataContext pointing to a DataField having
     * $Type of DataField, DataFieldWithUrl, DataFieldForAnnotation, DataFieldForAction, DataFieldForIntentBasedNavigation, DataFieldWithNavigationPath, or DataPointType.
     * But it can also be a Property with $kind="Property"
     */
    /**
     * Metadata path to the entity set
     */
    /**
     * Custom semantic object
     */
    /**
     * Get the relative path to the entity which quick view Facets we want to display.
     *
     * @param propertyDataModelPath
     * @returns A path if it exists.
     */
    QuickViewBlock.getRelativePathToQuickViewEntity = function getRelativePathToQuickViewEntity(propertyDataModelPath) {
      let relativePathToQuickViewEntity;
      const quickViewNavProp = this.getNavPropToQuickViewEntity(propertyDataModelPath);
      if (quickViewNavProp) {
        relativePathToQuickViewEntity = propertyDataModelPath.navigationProperties.reduce((relativPath, navProp) => {
          var _propertyDataModelPat;
          if (navProp.name !== quickViewNavProp.name && !((_propertyDataModelPat = propertyDataModelPath.contextLocation) !== null && _propertyDataModelPat !== void 0 && _propertyDataModelPat.navigationProperties.find(contextNavProp => contextNavProp.name === navProp.name))) {
            // we keep only navProperties that are part of the relativePath and not the one for quickViewNavProp
            return `${relativPath}${navProp.name}/`;
          }
          return relativPath;
        }, "");
        relativePathToQuickViewEntity = `${relativePathToQuickViewEntity}${quickViewNavProp.name}`;
      }
      return relativePathToQuickViewEntity;
    }

    /**
     * Get the semanticObject compile biding from metadata and a map to the qualifiers.
     *
     * @param propertyWithSemanticObject The property that holds semanticObject annotataions if it exists
     * @returns An object containing semanticObjectList and qualifierMap
     */;
    QuickViewBlock.getSemanticObjectsForPayloadAndQualifierMap = function getSemanticObjectsForPayloadAndQualifierMap(propertyWithSemanticObject) {
      const qualifierMap = {};
      const semanticObjectsList = [];
      if (propertyWithSemanticObject !== undefined) {
        for (const semanticObject of getSemanticObjects(propertyWithSemanticObject)) {
          const compiledSemanticObject = compileExpression(getExpressionFromAnnotation(semanticObject));
          // this should not happen, but we make sure not to add twice the semanticObject otherwise the mdcLink crashes
          if (compiledSemanticObject && !semanticObjectsList.includes(compiledSemanticObject)) {
            qualifierMap[semanticObject.qualifier || ""] = compiledSemanticObject;
            semanticObjectsList.push(compiledSemanticObject);
          }
        }
      }
      return {
        semanticObjectsList,
        qualifierMap
      };
    }

    /**
     * Get the semanticObjectMappings from metadata in the payload expected structure.
     *
     * @param propertyWithSemanticObject
     * @param qualifierMap
     * @returns A payload structure for semanticObjectMappings
     */;
    QuickViewBlock.getSemanticObjectMappingsForPayload = function getSemanticObjectMappingsForPayload(propertyWithSemanticObject, qualifierMap) {
      const semanticObjectMappings = [];
      if (propertyWithSemanticObject !== undefined) {
        for (const semanticObjectMapping of getSemanticObjectMappings(propertyWithSemanticObject)) {
          const correspondingSemanticObject = qualifierMap[semanticObjectMapping.qualifier || ""];
          if (correspondingSemanticObject) {
            semanticObjectMappings.push({
              semanticObject: correspondingSemanticObject,
              items: semanticObjectMapping.map(semanticObjectMappingType => {
                return {
                  key: semanticObjectMappingType.LocalProperty.value,
                  value: semanticObjectMappingType.SemanticObjectProperty.valueOf()
                };
              })
            });
          }
        }
      }
      return semanticObjectMappings;
    }

    /**
     * Get the semanticObjectUnavailableActions from metadata in the payload expected structure.
     *
     * @param propertyWithSemanticObject
     * @param qualifierMap
     * @returns A payload structure for semanticObjectUnavailableActions
     */;
    QuickViewBlock.getSemanticObjectUnavailableActionsForPayload = function getSemanticObjectUnavailableActionsForPayload(propertyWithSemanticObject, qualifierMap) {
      const semanticObjectUnavailableActions = [];
      if (propertyWithSemanticObject !== undefined) {
        for (const unavailableActionAnnotation of getSemanticObjectUnavailableActions(propertyWithSemanticObject)) {
          const correspondingSemanticObject = qualifierMap[unavailableActionAnnotation.qualifier || ""];
          if (correspondingSemanticObject) {
            semanticObjectUnavailableActions.push({
              semanticObject: correspondingSemanticObject,
              actions: unavailableActionAnnotation.map(unavailableAction => unavailableAction)
            });
          }
        }
      }
      return semanticObjectUnavailableActions;
    }

    /**
     * Add customObject(s) to the semanticObject list for the payload if it exists.
     *
     * @param semanticObjectsList
     * @param customSemanticObject
     */;
    QuickViewBlock.addCustomSemanticObjectToSemanticObjectListForPayload = function addCustomSemanticObjectToSemanticObjectListForPayload(semanticObjectsList, customSemanticObject) {
      if (customSemanticObject) {
        // the custom semantic objects are either a single string/key to custom data or a stringified array
        if (!customSemanticObject.startsWith("[")) {
          // customSemanticObject = "semanticObject" | "{pathInModel}"
          if (!semanticObjectsList.includes(customSemanticObject)) {
            semanticObjectsList.push(customSemanticObject);
          }
        } else {
          // customSemanticObject = '["semanticObject1","semanticObject2"]'
          for (const semanticObject of JSON.parse(customSemanticObject)) {
            if (!semanticObjectsList.includes(semanticObject)) {
              semanticObjectsList.push(semanticObject);
            }
          }
        }
      }
    }

    /**
     * Get the navigationProperty to an entity with QuickViewFacets that can be linked to the property.
     *
     * @param propertyDataModelPath
     * @returns A navigation property if it exists.
     */;
    QuickViewBlock.getNavPropToQuickViewEntity = function getNavPropToQuickViewEntity(propertyDataModelPath) {
      var _propertyDataModelPat2;
      //TODO we should investigate to put this code as common with FieldTemplating.isUsedInNavigationWithQuickViewFacets
      const property = propertyDataModelPath.targetObject;
      const navigationProperties = propertyDataModelPath.targetEntityType.navigationProperties;
      let quickViewNavProp = navigationProperties.find(navProp => {
        return navProp.referentialConstraint.some(referentialConstraint => {
          var _navProp$targetType$a;
          return referentialConstraint.sourceProperty === property.name && ((_navProp$targetType$a = navProp.targetType.annotations.UI) === null || _navProp$targetType$a === void 0 ? void 0 : _navProp$targetType$a.QuickViewFacets);
        });
      });
      if (!quickViewNavProp && ((_propertyDataModelPat2 = propertyDataModelPath.contextLocation) === null || _propertyDataModelPat2 === void 0 ? void 0 : _propertyDataModelPat2.targetEntitySet) !== propertyDataModelPath.targetEntitySet) {
        var _propertyDataModelPat3, _propertyDataModelPat4;
        const semanticKeys = ((_propertyDataModelPat3 = propertyDataModelPath.targetEntityType.annotations.Common) === null || _propertyDataModelPat3 === void 0 ? void 0 : _propertyDataModelPat3.SemanticKey) || [];
        const isPropertySemanticKey = semanticKeys.some(semanticKey => semanticKey.$target === property);
        const lastNavProp = propertyDataModelPath.navigationProperties[propertyDataModelPath.navigationProperties.length - 1];
        if ((isPropertySemanticKey || property.isKey) && (_propertyDataModelPat4 = propertyDataModelPath.targetEntityType.annotations.UI) !== null && _propertyDataModelPat4 !== void 0 && _propertyDataModelPat4.QuickViewFacets) {
          quickViewNavProp = lastNavProp;
        }
      }
      return quickViewNavProp;
    };
    function QuickViewBlock(props, controlConfiguration, settings) {
      var _metaPathDataModelPat, _metaPathDataModelPat2, _metaPathDataModelPat3, _valueProperty$annota, _valueProperty$annota2;
      var _this;
      _this = _BuildingBlockBase.call(this, props, controlConfiguration, settings) || this;
      _initializerDefineProperty(_this, "dataField", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "semanticObject", _descriptor3, _assertThisInitialized(_this));
      let metaPathDataModelPath = MetaModelConverter.getInvolvedDataModelObjects(_this.dataField, _this.contextPath);
      const valueDataModelPath = getDataModelObjectPathForValue(metaPathDataModelPath);
      if (valueDataModelPath) {
        _this.valueDataModelPath = valueDataModelPath;
      }
      metaPathDataModelPath = valueDataModelPath || metaPathDataModelPath;
      const valueProperty = isProperty(metaPathDataModelPath.targetObject) ? metaPathDataModelPath.targetObject : undefined;
      const hasQuickViewFacets = valueProperty && isUsedInNavigationWithQuickViewFacets(metaPathDataModelPath, valueProperty) ? "true" : "false";
      const relativePathToQuickViewEntity = QuickViewBlock.getRelativePathToQuickViewEntity(metaPathDataModelPath);
      // it can be that there is no targetEntityset for the context location so we use the targetObjectFullyQualifiedName
      const absoluteContextPath = ((_metaPathDataModelPat = metaPathDataModelPath.contextLocation) === null || _metaPathDataModelPat === void 0 ? void 0 : (_metaPathDataModelPat2 = _metaPathDataModelPat.targetEntitySet) === null || _metaPathDataModelPat2 === void 0 ? void 0 : _metaPathDataModelPat2.name) ?? ((_metaPathDataModelPat3 = metaPathDataModelPath.contextLocation) === null || _metaPathDataModelPat3 === void 0 ? void 0 : _metaPathDataModelPat3.targetObject).fullyQualifiedName;
      const quickViewEntity = relativePathToQuickViewEntity ? `/${absoluteContextPath}/${relativePathToQuickViewEntity}` : undefined;
      const navigationPath = relativePathToQuickViewEntity ? compileExpression(pathInModel(relativePathToQuickViewEntity)) : undefined;
      const propertyWithSemanticObject = getPropertyWithSemanticObject(metaPathDataModelPath);
      let mainSemanticObject;
      const {
        semanticObjectsList,
        qualifierMap
      } = QuickViewBlock.getSemanticObjectsForPayloadAndQualifierMap(propertyWithSemanticObject);
      const semanticObjectMappings = QuickViewBlock.getSemanticObjectMappingsForPayload(propertyWithSemanticObject, qualifierMap);
      const semanticObjectUnavailableActions = QuickViewBlock.getSemanticObjectUnavailableActionsForPayload(propertyWithSemanticObject, qualifierMap);
      if (propertyWithSemanticObject) {
        mainSemanticObject = qualifierMap.main || qualifierMap[""];
        if (!mainSemanticObject) {
          mainSemanticObject = Object.keys(qualifierMap)[0];
        }
      }
      QuickViewBlock.addCustomSemanticObjectToSemanticObjectListForPayload(semanticObjectsList, _this.semanticObject);
      const propertyPathLabel = (valueProperty === null || valueProperty === void 0 ? void 0 : (_valueProperty$annota = valueProperty.annotations.Common) === null || _valueProperty$annota === void 0 ? void 0 : (_valueProperty$annota2 = _valueProperty$annota.Label) === null || _valueProperty$annota2 === void 0 ? void 0 : _valueProperty$annota2.valueOf()) || "";
      _this.payload = {
        semanticObjects: semanticObjectsList,
        entityType: quickViewEntity,
        semanticObjectUnavailableActions: semanticObjectUnavailableActions,
        semanticObjectMappings: semanticObjectMappings,
        mainSemanticObject: mainSemanticObject,
        propertyPathLabel: propertyPathLabel,
        dataField: quickViewEntity === undefined ? _this.dataField.getPath() : undefined,
        contact: undefined,
        navigationPath: navigationPath,
        hasQuickViewFacets: hasQuickViewFacets
      };
      return _this;
    }

    /**
     * The building block template function.
     *
     * @returns An XML-based string with the definition of the field control
     */
    _exports = QuickViewBlock;
    var _proto = QuickViewBlock.prototype;
    _proto.getTemplate = function getTemplate() {
      const delegateConfiguration = {
        name: "sap/fe/macros/quickView/QuickViewDelegate",
        payload: this.payload
      };
      return xml`<mdc:Link xmlns:mdc="sap.ui.mdc" delegate="${JSON.stringify(delegateConfiguration)}">
			${this.writeCustomData(this.payload.semanticObjects, this.valueDataModelPath)}
			</mdc:Link>`;
    };
    _proto.writeCustomData = function writeCustomData(semanticObjects, valueDataModelPath) {
      let customData = "";
      const relativeLocation = valueDataModelPath && getRelativePaths(valueDataModelPath);
      for (const semanticObject of semanticObjects) {
        const dynamicPathFromSemanticObject = getDynamicPathFromSemanticObject(semanticObject);
        if (dynamicPathFromSemanticObject) {
          const dynamicPathWithRelativeLocation = compileExpression(pathInModel(dynamicPathFromSemanticObject, undefined, relativeLocation));
          const dynamicPath = dynamicPathWithRelativeLocation && getDynamicPathFromSemanticObject(dynamicPathWithRelativeLocation);
          if (dynamicPath) {
            customData = `${customData}
				<core:CustomData xmlns:core="sap.ui.core" key="${dynamicPath}" value="${dynamicPathWithRelativeLocation}" />`;
          }
        }
      }
      if (customData.length) {
        return `<mdc:customData>
				${customData}
			</mdc:customData>`;
      }
      return "";
    };
    return QuickViewBlock;
  }(BuildingBlockBase), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "dataField", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "semanticObject", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = QuickViewBlock;
  return _exports;
}, false);
