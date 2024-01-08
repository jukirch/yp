/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/PropertyHelper", "sap/ui/core/service/Service", "sap/ui/core/service/ServiceFactory", "../templating/DataModelPathHelper"], function (Log, MetaModelConverter, TypeGuards, PropertyHelper, Service, ServiceFactory, DataModelPathHelper) {
  "use strict";

  var _exports = {};
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var getTargetNavigationPath = DataModelPathHelper.getTargetNavigationPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var getAssociatedTextPropertyPath = PropertyHelper.getAssociatedTextPropertyPath;
  var isProperty = TypeGuards.isProperty;
  var isEntityType = TypeGuards.isEntityType;
  var isComplexType = TypeGuards.isComplexType;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var convertTypes = MetaModelConverter.convertTypes;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  let SideEffectsService = /*#__PURE__*/function (_Service) {
    _inheritsLoose(SideEffectsService, _Service);
    function SideEffectsService() {
      return _Service.apply(this, arguments) || this;
    }
    _exports.SideEffectsService = SideEffectsService;
    var _proto = SideEffectsService.prototype;
    // !: means that we know it will be assigned before usage
    _proto.init = function init() {
      this.sideEffectsRegistry = {
        oData: {
          entities: {},
          actions: {}
        },
        control: {}
      };
      this.recommendationRegistry = {
        roles: {}
      };
      this.isInitialized = false;
      this.initPromise = Promise.resolve(this);
    }

    /**
     * Adds a SideEffects control
     * SideEffects definition is added by a control to keep data up to date
     * These SideEffects get limited scope compared with SideEffects coming from an OData service:
     * - Only one SideEffects definition can be defined for the combination entity type - control Id
     * - Only SideEffects source properties are recognized and used to trigger SideEffects
     *
     * Ensure the sourceControlId matches the associated SAPUI5 control ID.
     *
     * @param entityType Name of the entity type
     * @param sideEffect SideEffects definition
     */;
    _proto.addControlSideEffects = function addControlSideEffects(entityType, sideEffect) {
      if (sideEffect.sourceControlId) {
        const controlSideEffect = {
          ...sideEffect,
          fullyQualifiedName: `${entityType}/SideEffectsForControl/${sideEffect.sourceControlId}`
        };
        const entityControlSideEffects = this.sideEffectsRegistry.control[entityType] || {};
        entityControlSideEffects[controlSideEffect.sourceControlId] = controlSideEffect;
        this.sideEffectsRegistry.control[entityType] = entityControlSideEffects;
      }
    }

    /**
     * Executes SideEffects action.
     *
     * @param triggerAction Name of the action
     * @param context Context
     * @param groupId The group ID to be used for the request
     * @returns A promise that is resolved without data or with a return value context when the action call succeeded
     */;
    _proto.executeAction = function executeAction(triggerAction, context, groupId) {
      const action = context.getModel().bindContext(`${triggerAction}(...)`, context);
      return action.execute(groupId || context.getBinding().getUpdateGroupId());
    }

    /**
     * Gets converted OData metaModel.
     *
     * @returns Converted OData metaModel
     */;
    _proto.getConvertedMetaModel = function getConvertedMetaModel() {
      return convertTypes(this.getMetaModel(), this.capabilities);
    }

    /**
     * Gets the entity type of a context.
     *
     * @param context Context
     * @returns Entity Type
     */;
    _proto.getEntityTypeFromContext = function getEntityTypeFromContext(context) {
      const metaModel = context.getModel().getMetaModel(),
        metaPath = metaModel.getMetaPath(context.getPath()),
        entityType = metaModel.getObject(metaPath)["$Type"];
      return entityType;
    }

    /**
     * Gets the SideEffects that come from an OData service.
     *
     * @param entityTypeName Name of the entity type
     * @returns SideEffects dictionary
     */;
    _proto.getODataEntitySideEffects = function getODataEntitySideEffects(entityTypeName) {
      return this.sideEffectsRegistry.oData.entities[entityTypeName] || {};
    }

    /**
     * Gets the global SideEffects that come from an OData service.
     *
     * @param entityTypeName Name of the entity type
     * @returns Global SideEffects
     */;
    _proto.getGlobalODataEntitySideEffects = function getGlobalODataEntitySideEffects(entityTypeName) {
      const entitySideEffects = this.getODataEntitySideEffects(entityTypeName);
      const globalSideEffects = [];
      for (const key in entitySideEffects) {
        const sideEffects = entitySideEffects[key];
        if (!sideEffects.sourceEntities && !sideEffects.sourceProperties) {
          globalSideEffects.push(sideEffects);
        }
      }
      return globalSideEffects;
    }

    /**
     * Gets the SideEffects that come from an OData service.
     *
     * @param actionName Name of the action
     * @param context Context
     * @returns SideEffects definition
     */;
    _proto.getODataActionSideEffects = function getODataActionSideEffects(actionName, context) {
      if (context) {
        const entityType = this.getEntityTypeFromContext(context);
        if (entityType) {
          var _this$sideEffectsRegi;
          return (_this$sideEffectsRegi = this.sideEffectsRegistry.oData.actions[entityType]) === null || _this$sideEffectsRegi === void 0 ? void 0 : _this$sideEffectsRegi[actionName];
        }
      }
      return undefined;
    }

    /**
     * Generates the dictionary for the SideEffects.
     *
     * @param capabilities The current capabilities
     */;
    _proto.initializeSideEffects = function initializeSideEffects(capabilities) {
      this.capabilities = capabilities;
      if (!this.isInitialized) {
        const sideEffectSources = {
          entities: {},
          properties: {}
        };
        const convertedMetaModel = this.getConvertedMetaModel();
        convertedMetaModel.entityTypes.forEach(entityType => {
          this.mapFieldAnnotations(entityType);
          this.sideEffectsRegistry.oData.entities[entityType.fullyQualifiedName] = this.retrieveODataEntitySideEffects(entityType);
          this.sideEffectsRegistry.oData.actions[entityType.fullyQualifiedName] = this.retrieveODataActionsSideEffects(entityType); // only bound actions are analyzed since unbound ones don't get SideEffects
          this.mapSideEffectSources(entityType, sideEffectSources);
        });
        this.sourcesToSideEffectMappings = sideEffectSources;
        this.isInitialized = true;
      }
    };
    _proto.mapFieldAnnotations = function mapFieldAnnotations(source) {
      source.entityProperties.forEach(property => {
        const commonAnno = property.annotations.Common;
        if (commonAnno !== null && commonAnno !== void 0 && commonAnno.RecommendationRole) {
          const roleType = commonAnno.RecommendationRole;
          if (roleType.valueOf().includes("Input")) {
            if (!this.recommendationRegistry.roles.hasOwnProperty(`${source.name}`)) {
              this.recommendationRegistry.roles[`${source.name}`] = {
                input: []
              };
            }
            this.recommendationRegistry.roles[`${source.name}`].input.push(property.name);
          }
        }
      });
    };
    _proto.getRecommendationsMapping = function getRecommendationsMapping() {
      return this.recommendationRegistry;
    }

    /**
     * This function will return true if field is part of Recommendation's input mapping and from the same entity.
     * Otherwise return false.
     *
     * @param field
     * @returns True if field is has recommendation role - Input annotation
     */;
    _proto.checkIfFieldIsRecommendationRelevant = function checkIfFieldIsRecommendationRelevant(field) {
      const context = field.getBindingContext();
      const propertyName = field.data().sourcePath.split("/").pop();
      if (context) {
        var _targetDataModelObjec, _targetDataModelObjec2, _recommendationRolesF;
        const metaModel = context === null || context === void 0 ? void 0 : context.getModel().getMetaModel();
        const metaContext = metaModel === null || metaModel === void 0 ? void 0 : metaModel.getMetaContext(context.getPath());
        const targetDataModelObject = MetaModelConverter.getInvolvedDataModelObjects(metaContext).targetObject;
        const targetEntityTypeName = ((_targetDataModelObjec = targetDataModelObject.entityType) === null || _targetDataModelObjec === void 0 ? void 0 : _targetDataModelObjec.name) || ((_targetDataModelObjec2 = targetDataModelObject.targetType) === null || _targetDataModelObjec2 === void 0 ? void 0 : _targetDataModelObjec2.name);
        const recommendationRolesForEntity = this.recommendationRegistry.roles[targetEntityTypeName];
        if (recommendationRolesForEntity !== null && recommendationRolesForEntity !== void 0 && (_recommendationRolesF = recommendationRolesForEntity.input) !== null && _recommendationRolesF !== void 0 && _recommendationRolesF.includes(propertyName)) {
          return true;
        }
      }
      return false;
    }

    /**
     * Removes all SideEffects related to a control.
     *
     * @param controlId Control Id
     */;
    _proto.removeControlSideEffects = function removeControlSideEffects(controlId) {
      Object.keys(this.sideEffectsRegistry.control).forEach(sEntityType => {
        if (this.sideEffectsRegistry.control[sEntityType][controlId]) {
          delete this.sideEffectsRegistry.control[sEntityType][controlId];
        }
      });
    }

    /**
     * Requests the SideEffects on a specific context.
     *
     * @param pathExpressions Targets of SideEffects to be executed
     * @param context Context where SideEffects need to be executed
     * @param groupId The group ID to be used for the request
     * @returns Promise on SideEffects request
     */;
    _proto.requestSideEffects = function requestSideEffects(pathExpressions, context, groupId) {
      this.logRequest(pathExpressions, context);
      return context.requestSideEffects(pathExpressions, groupId);
    }

    /**
     * Requests the SideEffects for an OData action.
     *
     * @param sideEffects SideEffects definition
     * @param context Context where SideEffects need to be executed
     * @returns Promise on SideEffects requests and action execution
     */;
    _proto.requestSideEffectsForODataAction = function requestSideEffectsForODataAction(sideEffects, context) {
      var _sideEffects$triggerA, _sideEffects$pathExpr;
      let promises;
      if ((_sideEffects$triggerA = sideEffects.triggerActions) !== null && _sideEffects$triggerA !== void 0 && _sideEffects$triggerA.length) {
        promises = sideEffects.triggerActions.map(actionName => {
          return this.executeAction(actionName, context);
        });
      } else {
        promises = [];
      }
      if ((_sideEffects$pathExpr = sideEffects.pathExpressions) !== null && _sideEffects$pathExpr !== void 0 && _sideEffects$pathExpr.length) {
        promises.push(this.requestSideEffects(sideEffects.pathExpressions, context));
      }
      return promises.length ? Promise.all(promises) : Promise.resolve([]);
    }

    /**
     * Requests the SideEffects for a navigation property on a specific context.
     *
     * @param navigationProperty Navigation property
     * @param context Context where SideEffects need to be executed
     * @param groupId Batch group for the query
     * @param ignoreTriggerActions If true, we do not trigger actions defined in the side effect
     * @returns SideEffects request on SAPUI5 context
     */;
    _proto.requestSideEffectsForNavigationProperty = function requestSideEffectsForNavigationProperty(navigationProperty, context, groupId) {
      let ignoreTriggerActions = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      const baseEntityType = this.getEntityTypeFromContext(context);
      if (baseEntityType) {
        const navigationPath = `${navigationProperty}/`;
        const entitySideEffects = this.getODataEntitySideEffects(baseEntityType);
        let targetProperties = [];
        let targetEntities = [];
        let sideEffectsTargets = [];
        Object.keys(entitySideEffects).filter(
        // Keep relevant SideEffects
        // 1. SourceEntities match OR
        // 2. Only 1 SourceProperties and match
        annotationName => {
          var _sideEffects$sourcePr;
          const sideEffects = entitySideEffects[annotationName];
          return (sideEffects.sourceEntities || []).some(navigation => navigation.$NavigationPropertyPath === navigationProperty) || ((_sideEffects$sourcePr = sideEffects.sourceProperties) === null || _sideEffects$sourcePr === void 0 ? void 0 : _sideEffects$sourcePr.length) === 1 && sideEffects.sourceProperties.some(propertyPath => propertyPath.startsWith(navigationPath) && !propertyPath.replace(navigationPath, "").includes("/"));
        }).forEach(sAnnotationName => {
          const sideEffects = entitySideEffects[sAnnotationName];
          if (sideEffects.triggerAction && !ignoreTriggerActions) {
            this.executeAction(sideEffects.triggerAction, context, groupId);
          }
          targetProperties = targetProperties.concat(sideEffects.targetProperties);
          targetEntities = targetEntities.concat(sideEffects.targetEntities);
        });
        // Remove duplicate targets
        const sideEffectsTargetDefinition = this.removeDuplicateTargets({
          targetProperties: targetProperties,
          targetEntities: targetEntities
        });
        sideEffectsTargets = [...sideEffectsTargetDefinition.targetProperties, ...sideEffectsTargetDefinition.targetEntities];
        if (sideEffectsTargets.length) {
          return this.requestSideEffects(sideEffectsTargets, context, groupId).catch(error => Log.error(`SideEffects - Error while processing SideEffects for Navigation Property ${navigationProperty}`, error));
        }
      }
      return Promise.resolve();
    }

    /**
     * Gets the SideEffects that come from controls.
     *
     * @param entityTypeName Entity type Name
     * @returns SideEffects dictionary
     */;
    _proto.getControlEntitySideEffects = function getControlEntitySideEffects(entityTypeName) {
      return this.sideEffectsRegistry.control[entityTypeName] || {};
    }

    /**
     * Gets SideEffects' qualifier and owner entity where this entity is used as source.
     *
     * @param entityTypeName Entity type fully qualified name
     * @returns Array of sideEffects info
     */;
    _proto.getSideEffectWhereEntityIsSource = function getSideEffectWhereEntityIsSource(entityTypeName) {
      return this.sourcesToSideEffectMappings.entities[entityTypeName] || [];
    }

    /**
     * Common method to get the field groupIds for a source entity and a source property.
     *
     * @param sourceEntityType
     * @param sourceProperty
     * @returns A collection of fieldGroupIds
     */;
    _proto.computeFieldGroupIds = function computeFieldGroupIds(sourceEntityType, sourceProperty) {
      const entityFieldGroupIds = this.getSideEffectWhereEntityIsSource(sourceEntityType).map(sideEffectInfo => this.getFieldGroupIdForSideEffect(sideEffectInfo, true));
      return entityFieldGroupIds.concat(this.getSideEffectWherePropertyIsSource(sourceProperty).map(sideEffectInfo => this.getFieldGroupIdForSideEffect(sideEffectInfo)));
    }

    /**
     * Gets SideEffects' qualifier and owner entity where this property is used as source.
     *
     * @param propertyName Property fully qualified name
     * @returns Array of sideEffects info
     */;
    _proto.getSideEffectWherePropertyIsSource = function getSideEffectWherePropertyIsSource(propertyName) {
      return this.sourcesToSideEffectMappings.properties[propertyName] || [];
    }

    /**
     * Adds the text properties required for SideEffects
     * If a property has an associated text then this text needs to be added as targetProperties.
     *
     * @param sideEffectsTargets SideEffects Targets
     * @param entityType Entity type
     * @returns SideEffects definition with added text properties
     */;
    _proto.addTextProperties = function addTextProperties(sideEffectsTargets, entityType) {
      const setOfProperties = new Set(sideEffectsTargets.targetProperties);
      const setOfEntities = new Set(sideEffectsTargets.targetEntities.map(target => target.$NavigationPropertyPath));

      // Generate all dataModelPath for the properties to analyze (cover "*" and /*)
      const propertiesToAnalyze = sideEffectsTargets.targetProperties.reduce((dataModelPropertyPaths, propertyPath) => {
        return dataModelPropertyPaths.concat(this.getDataModelPropertiesFromAPath(propertyPath, entityType));
      }, []);

      // Generate all paths related to the text properties and not already covered by the SideEffects
      for (const dataModelPropertyPath of propertiesToAnalyze) {
        const associatedTextPath = getAssociatedTextPropertyPath(dataModelPropertyPath.targetObject);
        if (associatedTextPath) {
          const dataModelTextPath = enhanceDataModelPath(dataModelPropertyPath, associatedTextPath);
          const relativeNavigation = getTargetNavigationPath(dataModelTextPath, true);
          const targetPath = getTargetObjectPath(dataModelTextPath, true);
          if (isProperty(dataModelTextPath.targetObject) && !setOfProperties.has(targetPath) &&
          // the property is already listed
          !setOfProperties.has(`${relativeNavigation}${dataModelTextPath.navigationProperties.length ? "/" : ""}*`) &&
          // the property is already listed thanks to the "*"
          !setOfEntities.has(`${relativeNavigation}`) // the property is not part of a TargetEntities
          ) {
            // The Text association is added as TargetEntities if
            //  - it's contained on a different entitySet than the SideEffects
            //  -  and it's contained on a different entitySet than the sourced property
            // Otherwise it's added as targetProperties
            if (dataModelPropertyPath.targetEntitySet !== dataModelTextPath.targetEntitySet && dataModelTextPath.navigationProperties && dataModelTextPath.targetEntityType) {
              setOfEntities.add(relativeNavigation);
            } else {
              setOfProperties.add(targetPath);
            }
          }
        }
      }
      return {
        targetProperties: Array.from(setOfProperties),
        targetEntities: Array.from(setOfEntities).map(navigation => {
          return {
            $NavigationPropertyPath: navigation
          };
        })
      };
    }

    /**
     * Converts the SideEffects to expected format
     *  - Set TriggerAction as string
     *  - Converts SideEffects targets to expected format
     *  - Removes binding parameter from SideEffects targets properties
     *  - Adds the text properties
     *  - Replaces TargetProperties having reference to Source Properties for a SideEffects.
     *
     * @param sideEffects SideEffects definition
     * @param entityType Entity type
     * @param bindingParameter Name of the binding parameter
     * @returns SideEffects definition
     */;
    _proto.convertSideEffects = function convertSideEffects(sideEffects, entityType, bindingParameter) {
      const triggerAction = sideEffects.TriggerAction;
      const newSideEffects = this.convertSideEffectsFormat(sideEffects);
      let sideEffectsTargets = {
        targetProperties: newSideEffects.targetProperties,
        targetEntities: newSideEffects.targetEntities
      };
      sideEffectsTargets = this.removeBindingParameter(sideEffectsTargets, bindingParameter);
      sideEffectsTargets = this.addTextProperties(sideEffectsTargets, entityType);
      sideEffectsTargets = this.removeDuplicateTargets(sideEffectsTargets);
      return {
        ...newSideEffects,
        ...{
          targetEntities: sideEffectsTargets.targetEntities,
          targetProperties: sideEffectsTargets.targetProperties,
          triggerAction
        }
      };
    }

    /**
     * Converts the SideEffects targets (TargetEntities and TargetProperties) to expected format
     *  - TargetProperties as array of string
     *  - TargetEntities as array of object with property $NavigationPropertyPath.
     *
     * @param sideEffects SideEffects definition
     * @returns Converted SideEffects
     */;
    _proto.convertSideEffectsFormat = function convertSideEffectsFormat(sideEffects) {
      const formatProperties = properties => {
        return properties ? properties.reduce((targetProperties, target) => {
          const path = target.type && target.value || target;
          if (path) {
            targetProperties.push(path);
          } else {
            Log.error(`SideEffects - Error while processing TargetProperties for SideEffects ${sideEffects.fullyQualifiedName}`);
          }
          return targetProperties;
        }, []) : properties;
      };
      const formatEntities = entities => {
        return entities ? entities.map(targetEntity => {
          return {
            $NavigationPropertyPath: targetEntity.value
          };
        }) : entities;
      };
      return {
        fullyQualifiedName: sideEffects.fullyQualifiedName,
        sourceProperties: formatProperties(sideEffects.SourceProperties),
        sourceEntities: formatEntities(sideEffects.SourceEntities),
        targetProperties: formatProperties(sideEffects.TargetProperties) ?? [],
        targetEntities: formatEntities(sideEffects.TargetEntities) ?? []
      };
    }

    /**
     * Gets all dataModelObjectPath related to properties listed by a path
     *
     * The path can be:
     *  - a path targeting a property on a complexType or an EntityType
     *  - a path with a star targeting all properties on a complexType or an EntityType.
     *
     * @param path The path to analyze
     * @param entityType Entity type
     * @returns Array of dataModelObjectPath representing the properties
     */;
    _proto.getDataModelPropertiesFromAPath = function getDataModelPropertiesFromAPath(path, entityType) {
      let dataModelObjectPaths = [];
      const convertedMetaModel = this.getConvertedMetaModel();
      const entitySet = convertedMetaModel.entitySets.find(relatedEntitySet => relatedEntitySet.entityType === entityType) || convertedMetaModel.singletons.find(singleton => singleton.entityType === entityType);
      if (entitySet) {
        const metaModel = this.getMetaModel(),
          entitySetContext = metaModel.createBindingContext(`/${entitySet.name}`);
        if (entitySetContext) {
          const dataModelEntitySet = getInvolvedDataModelObjects(entitySetContext);
          const dataModelObjectPath = enhanceDataModelPath(dataModelEntitySet, path.replace("*", "") || "/"),
            // "*" is replaced by "/" to target the current EntityType
            targetObject = dataModelObjectPath.targetObject;
          if (isProperty(targetObject)) {
            if (isComplexType(targetObject.targetType)) {
              dataModelObjectPaths = dataModelObjectPaths.concat(targetObject.targetType.properties.map(property => enhanceDataModelPath(dataModelObjectPath, property.name)));
            } else {
              dataModelObjectPaths.push(dataModelObjectPath);
            }
          } else if (isEntityType(targetObject)) {
            dataModelObjectPaths = dataModelObjectPaths.concat(dataModelObjectPath.targetEntityType.entityProperties.map(entityProperty => {
              return enhanceDataModelPath(dataModelObjectPath, entityProperty.name);
            }));
          }
          entitySetContext.destroy();
        }
      }
      return dataModelObjectPaths.filter(dataModelObjectPath => dataModelObjectPath.targetObject);
    }

    /**
     * Gets the Odata metamodel.
     *
     * @returns The OData metamodel
     */;
    _proto.getMetaModel = function getMetaModel() {
      const oContext = this.getContext();
      const oComponent = oContext.scopeObject;
      return oComponent.getModel().getMetaModel();
    }

    /**
     * Gets the SideEffects related to an entity type or action that come from an OData Service
     * Internal routine to get, from converted oData metaModel, SideEffects related to a specific entity type or action
     * and to convert these SideEffects with expected format.
     *
     * @param source Entity type or action
     * @returns Array of SideEffects
     */;
    _proto.getSideEffectsFromSource = function getSideEffectsFromSource(source) {
      var _source$annotations;
      let bindingAlias = "";
      const isSourceEntityType = isEntityType(source);
      const entityType = isSourceEntityType ? source : source.sourceEntityType;
      const commonAnnotation = (_source$annotations = source.annotations) === null || _source$annotations === void 0 ? void 0 : _source$annotations.Common;
      if (entityType && commonAnnotation) {
        if (!isSourceEntityType) {
          var _source$parameters;
          const bindingParameter = (_source$parameters = source.parameters) === null || _source$parameters === void 0 ? void 0 : _source$parameters.find(parameter => parameter.type === entityType.fullyQualifiedName);
          bindingAlias = (bindingParameter === null || bindingParameter === void 0 ? void 0 : bindingParameter.fullyQualifiedName.split("/")[1]) ?? "";
        }
        return this.getSideEffectsAnnotationFromSource(source).map(sideEffectAnno => this.convertSideEffects(sideEffectAnno, entityType, bindingAlias));
      }
      return [];
    }

    /**
     * Gets the SideEffects related to an entity type or action that come from an OData Service
     * Internal routine to get, from converted oData metaModel, SideEffects related to a specific entity type or action.
     *
     * @param source Entity type or action
     * @returns Array of SideEffects
     */;
    _proto.getSideEffectsAnnotationFromSource = function getSideEffectsAnnotationFromSource(source) {
      var _source$annotations2;
      const sideEffects = [];
      const commonAnnotation = (_source$annotations2 = source.annotations) === null || _source$annotations2 === void 0 ? void 0 : _source$annotations2.Common;
      for (const key in commonAnnotation) {
        const annotation = commonAnnotation[key];
        if (this.isSideEffectsAnnotation(annotation)) {
          sideEffects.push(annotation);
        }
      }
      return sideEffects;
    }

    /**
     * Checks if the annotation is a SideEffects annotation.
     *
     * @param annotation Annotation
     * @returns Boolean
     */;
    _proto.isSideEffectsAnnotation = function isSideEffectsAnnotation(annotation) {
      return (annotation === null || annotation === void 0 ? void 0 : annotation.$Type) === "com.sap.vocabularies.Common.v1.SideEffectsType";
    }

    /**
     * Logs the SideEffects request.
     *
     * @param pathExpressions SideEffects targets
     * @param context Context
     */;
    _proto.logRequest = function logRequest(pathExpressions, context) {
      const targetPaths = pathExpressions.reduce(function (paths, target) {
        return `${paths}\n\t\t${target.$NavigationPropertyPath || target || ""}`;
      }, "");
      Log.debug(`SideEffects - Request:\n\tContext path : ${context.getPath()}\n\tProperty paths :${targetPaths}`);
    }

    /**
     * Removes the name of the binding parameter on the SideEffects targets.
     *
     * @param sideEffectsTargets SideEffects Targets
     * @param bindingParameterName Name of binding parameter
     * @returns SideEffects definition
     */;
    _proto.removeBindingParameter = function removeBindingParameter(sideEffectsTargets, bindingParameterName) {
      if (bindingParameterName) {
        const replaceBindingParameter = function (value) {
          return value.replace(new RegExp(`^${bindingParameterName}/?`), "");
        };
        return {
          targetProperties: sideEffectsTargets.targetProperties.map(targetProperty => replaceBindingParameter(targetProperty)),
          targetEntities: sideEffectsTargets.targetEntities.map(targetEntity => {
            return {
              $NavigationPropertyPath: replaceBindingParameter(targetEntity.$NavigationPropertyPath)
            };
          })
        };
      }
      return {
        targetProperties: sideEffectsTargets.targetProperties,
        targetEntities: sideEffectsTargets.targetEntities
      };
    }

    /**
     * Remove duplicates in SideEffects targets.
     *
     * @param sideEffectsTargets SideEffects Targets
     * @returns SideEffects targets without duplicates
     */;
    _proto.removeDuplicateTargets = function removeDuplicateTargets(sideEffectsTargets) {
      const targetEntitiesPaths = sideEffectsTargets.targetEntities.map(targetEntity => targetEntity.$NavigationPropertyPath);
      const uniqueTargetedEntitiesPath = new Set(targetEntitiesPaths);
      const uniqueTargetProperties = new Set(sideEffectsTargets.targetProperties);
      const uniqueTargetedEntities = Array.from(uniqueTargetedEntitiesPath).map(entityPath => {
        return {
          $NavigationPropertyPath: entityPath
        };
      });
      return {
        targetProperties: Array.from(uniqueTargetProperties),
        targetEntities: uniqueTargetedEntities
      };
    }

    /**
     * Gets SideEffects action type that come from an OData Service
     * Internal routine to get, from converted oData metaModel, SideEffects on actions
     * related to a specific entity type and to convert these SideEffects with
     * expected format.
     *
     * @param entityType Entity type
     * @returns Entity type SideEffects dictionary
     */;
    _proto.retrieveODataActionsSideEffects = function retrieveODataActionsSideEffects(entityType) {
      const sideEffects = {};
      const actions = entityType.actions;
      if (actions) {
        Object.keys(actions).forEach(actionName => {
          const action = entityType.actions[actionName];
          const triggerActions = new Set();
          let targetProperties = [];
          let targetEntities = [];
          this.getSideEffectsFromSource(action).forEach(oDataSideEffect => {
            const triggerAction = oDataSideEffect.triggerAction;
            targetProperties = targetProperties.concat(oDataSideEffect.targetProperties);
            targetEntities = targetEntities.concat(oDataSideEffect.targetEntities);
            if (triggerAction) {
              triggerActions.add(triggerAction);
            }
          });
          const sideEffectsTargets = this.removeDuplicateTargets({
            targetProperties,
            targetEntities
          });
          sideEffects[actionName] = {
            pathExpressions: [...sideEffectsTargets.targetProperties, ...sideEffectsTargets.targetEntities],
            triggerActions: Array.from(triggerActions)
          };
        });
      }
      return sideEffects;
    }

    /**
     * Gets SideEffects entity type that come from an OData Service
     * Internal routine to get, from converted oData metaModel, SideEffects
     * related to a specific entity type and to convert these SideEffects with
     * expected format.
     *
     * @param entityType Entity type
     * @returns Entity type SideEffects dictionary
     */;
    _proto.retrieveODataEntitySideEffects = function retrieveODataEntitySideEffects(entityType) {
      const entitySideEffects = {};
      this.getSideEffectsFromSource(entityType).forEach(sideEffects => {
        entitySideEffects[sideEffects.fullyQualifiedName] = sideEffects;
      });
      return entitySideEffects;
    }

    /**
     * Defines a map for the Sources of sideEffect on the entity to track where those sources are used in SideEffects annotation.
     *
     * @param entityType The entityType we look for side Effects annotation
     * @param sideEffectsSources The mapping object in construction
     * @param sideEffectsSources.entities
     * @param sideEffectsSources.properties
     */;
    _proto.mapSideEffectSources = function mapSideEffectSources(entityType, sideEffectsSources) {
      for (const sideEffectDefinition of this.getSideEffectsAnnotationFromSource(entityType)) {
        var _sideEffectDefinition;
        for (const sourceEntity of sideEffectDefinition.SourceEntities ?? []) {
          var _sourceEntity$$target;
          const targetEntityType = sourceEntity.value ? (_sourceEntity$$target = sourceEntity.$target) === null || _sourceEntity$$target === void 0 ? void 0 : _sourceEntity$$target.targetType : entityType;
          if (targetEntityType) {
            if (!sideEffectsSources.entities[targetEntityType.fullyQualifiedName]) {
              sideEffectsSources.entities[targetEntityType.fullyQualifiedName] = [];
            }
            sideEffectsSources.entities[targetEntityType.fullyQualifiedName].push({
              entity: entityType.fullyQualifiedName,
              qualifier: sideEffectDefinition.qualifier
            });
          }
        }
        const hasUniqueSourceProperty = ((_sideEffectDefinition = sideEffectDefinition.SourceProperties) === null || _sideEffectDefinition === void 0 ? void 0 : _sideEffectDefinition.length) === 1;
        for (const sourceProperty of sideEffectDefinition.SourceProperties ?? []) {
          if (sourceProperty.$target) {
            if (!sideEffectsSources.properties[sourceProperty.$target.fullyQualifiedName]) {
              sideEffectsSources.properties[sourceProperty.$target.fullyQualifiedName] = [];
            }
            sideEffectsSources.properties[sourceProperty.$target.fullyQualifiedName].push({
              entity: entityType.fullyQualifiedName,
              qualifier: sideEffectDefinition.qualifier,
              hasUniqueSourceProperty
            });
          }
        }
      }
    }

    /**
     * Get the fieldGroupId based on the stored information on th side effect.
     *
     * @param sideEffectInfo
     * @param isImmediate
     * @returns A string for the fieldGroupId.
     */;
    _proto.getFieldGroupIdForSideEffect = function getFieldGroupIdForSideEffect(sideEffectInfo) {
      let isImmediate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      const sideEffectWithQualifier = sideEffectInfo.qualifier ? `${sideEffectInfo.entity}#${sideEffectInfo.qualifier}` : sideEffectInfo.entity;
      return isImmediate || sideEffectInfo.hasUniqueSourceProperty === true ? `${sideEffectWithQualifier}$$ImmediateRequest` : sideEffectWithQualifier;
    };
    _proto.getInterface = function getInterface() {
      return this;
    };
    return SideEffectsService;
  }(Service);
  _exports.SideEffectsService = SideEffectsService;
  let SideEffectsServiceFactory = /*#__PURE__*/function (_ServiceFactory) {
    _inheritsLoose(SideEffectsServiceFactory, _ServiceFactory);
    function SideEffectsServiceFactory() {
      return _ServiceFactory.apply(this, arguments) || this;
    }
    var _proto2 = SideEffectsServiceFactory.prototype;
    _proto2.createInstance = function createInstance(oServiceContext) {
      const SideEffectsServiceService = new SideEffectsService(oServiceContext);
      return SideEffectsServiceService.initPromise;
    };
    return SideEffectsServiceFactory;
  }(ServiceFactory);
  return SideEffectsServiceFactory;
}, false);
