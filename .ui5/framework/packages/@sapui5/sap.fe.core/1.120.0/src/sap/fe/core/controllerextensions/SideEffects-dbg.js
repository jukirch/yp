/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/ui/core/mvc/ControllerExtension", "../CommonUtils", "../helpers/ClassSupport"], function (Log, ControllerExtension, CommonUtils, ClassSupport) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _dec35, _dec36, _dec37, _dec38, _dec39, _dec40, _class, _class2;
  var publicExtension = ClassSupport.publicExtension;
  var privateExtension = ClassSupport.privateExtension;
  var methodOverride = ClassSupport.methodOverride;
  var finalExtension = ClassSupport.finalExtension;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  const IMMEDIATE_REQUEST = "$$ImmediateRequest";
  let SideEffectsControllerExtension = (_dec = defineUI5Class("sap.fe.core.controllerextensions.SideEffects"), _dec2 = methodOverride(), _dec3 = publicExtension(), _dec4 = finalExtension(), _dec5 = publicExtension(), _dec6 = finalExtension(), _dec7 = publicExtension(), _dec8 = finalExtension(), _dec9 = publicExtension(), _dec10 = finalExtension(), _dec11 = publicExtension(), _dec12 = finalExtension(), _dec13 = publicExtension(), _dec14 = finalExtension(), _dec15 = publicExtension(), _dec16 = finalExtension(), _dec17 = publicExtension(), _dec18 = finalExtension(), _dec19 = publicExtension(), _dec20 = finalExtension(), _dec21 = publicExtension(), _dec22 = finalExtension(), _dec23 = publicExtension(), _dec24 = finalExtension(), _dec25 = publicExtension(), _dec26 = finalExtension(), _dec27 = publicExtension(), _dec28 = finalExtension(), _dec29 = privateExtension(), _dec30 = finalExtension(), _dec31 = publicExtension(), _dec32 = finalExtension(), _dec33 = publicExtension(), _dec34 = finalExtension(), _dec35 = privateExtension(), _dec36 = finalExtension(), _dec37 = privateExtension(), _dec38 = finalExtension(), _dec39 = publicExtension(), _dec40 = finalExtension(), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    _inheritsLoose(SideEffectsControllerExtension, _ControllerExtension);
    function SideEffectsControllerExtension() {
      return _ControllerExtension.apply(this, arguments) || this;
    }
    var _proto = SideEffectsControllerExtension.prototype;
    _proto.onInit = function onInit() {
      this._view = this.base.getView();
      this._sideEffectsService = CommonUtils.getAppComponent(this._view).getSideEffectsService();
      this._registeredFieldGroupMap = {};
      this._fieldGroupInvalidity = {};
      this._registeredFailedSideEffects = {};
    }

    /**
     * Adds a SideEffects control.
     *
     * @param entityType Name of the entity where the SideEffects control will be registered
     * @param controlSideEffects SideEffects to register. Ensure the sourceControlId matches the associated SAPUI5 control ID.
     */;
    _proto.addControlSideEffects = function addControlSideEffects(entityType, controlSideEffects) {
      this._sideEffectsService.addControlSideEffects(entityType, controlSideEffects);
    }

    /**
     * Removes SideEffects created by a control.
     *
     * @param control SAPUI5 Control
     */;
    _proto.removeControlSideEffects = function removeControlSideEffects(control) {
      var _control$isA;
      const controlId = ((_control$isA = control.isA) === null || _control$isA === void 0 ? void 0 : _control$isA.call(control, "sap.ui.base.ManagedObject")) && control.getId();
      if (controlId) {
        this._sideEffectsService.removeControlSideEffects(controlId);
      }
    }

    /**
     * Gets the appropriate context on which SideEffects can be requested.
     * The correct one must have the binding parameter $$patchWithoutSideEffects.
     *
     * @param bindingContext Initial binding context
     * @param sideEffectEntityType EntityType of the sideEffects
     * @returns SAPUI5 Context or undefined
     */;
    _proto.getContextForSideEffects = function getContextForSideEffects(bindingContext, sideEffectEntityType) {
      let contextForSideEffects = bindingContext,
        entityType = this._sideEffectsService.getEntityTypeFromContext(bindingContext);
      if (sideEffectEntityType !== entityType) {
        contextForSideEffects = bindingContext.getBinding().getContext();
        if (contextForSideEffects) {
          entityType = this._sideEffectsService.getEntityTypeFromContext(contextForSideEffects);
          if (sideEffectEntityType !== entityType) {
            contextForSideEffects = contextForSideEffects.getBinding().getContext();
            if (contextForSideEffects) {
              entityType = this._sideEffectsService.getEntityTypeFromContext(contextForSideEffects);
              if (sideEffectEntityType !== entityType) {
                return undefined;
              }
            }
          }
        }
      }
      return contextForSideEffects || undefined;
    }

    /**
     * Gets the SideEffects map for a field
     * These SideEffects are
     * - listed into FieldGroupIds (coming from an OData Service)
     * - generated by a control or controls and that configure this field as SourceProperties.
     *
     * @param field Field control
     * @returns SideEffects map
     */;
    _proto.getFieldSideEffectsMap = function getFieldSideEffectsMap(field) {
      let sideEffectsMap = {};
      const fieldGroupIds = field.getFieldGroupIds(),
        viewEntitySetSetName = this._view.getViewData().entitySet,
        viewEntitySet = this._sideEffectsService.getConvertedMetaModel().entitySets.find(entitySet => {
          return entitySet.name === viewEntitySetSetName;
        });

      // SideEffects coming from an OData Service
      sideEffectsMap = this.getSideEffectsMapForFieldGroups(fieldGroupIds, field.getBindingContext());

      // SideEffects coming from control(s)
      if (viewEntitySetSetName && viewEntitySet) {
        const viewEntityType = viewEntitySet.entityType.fullyQualifiedName,
          fieldPath = this.getTargetProperty(field),
          context = this.getContextForSideEffects(field.getBindingContext(), viewEntityType);
        if (fieldPath && context) {
          const controlSideEffectsEntityType = this._sideEffectsService.getControlEntitySideEffects(viewEntityType);
          Object.keys(controlSideEffectsEntityType).forEach(sideEffectsName => {
            const oControlSideEffects = controlSideEffectsEntityType[sideEffectsName];
            if (oControlSideEffects.sourceProperties.includes(fieldPath)) {
              const name = `${sideEffectsName}::${viewEntityType}`;
              sideEffectsMap[name] = {
                name: name,
                immediate: true,
                sideEffects: oControlSideEffects,
                context: context
              };
            }
          });
        }
      }
      return sideEffectsMap;
    }

    /**
     * Gets the sideEffects map for fieldGroups.
     *
     * @param fieldGroupIds Field group ids
     * @param fieldContext Field binding context
     * @returns SideEffects map
     */;
    _proto.getSideEffectsMapForFieldGroups = function getSideEffectsMapForFieldGroups(fieldGroupIds, fieldContext) {
      const mSideEffectsMap = {};
      fieldGroupIds.forEach(fieldGroupId => {
        const {
          name,
          immediate,
          sideEffects,
          sideEffectEntityType
        } = this._getSideEffectsPropertyForFieldGroup(fieldGroupId);
        const oContext = fieldContext ? this.getContextForSideEffects(fieldContext, sideEffectEntityType) : undefined;
        if (sideEffects && (!fieldContext || fieldContext && oContext)) {
          mSideEffectsMap[name] = {
            name,
            immediate,
            sideEffects
          };
          if (fieldContext) {
            mSideEffectsMap[name].context = oContext;
          }
        }
      });
      return mSideEffectsMap;
    }

    /**
     * Clear recorded validation status for all properties.
     *
     */;
    _proto.clearFieldGroupsValidity = function clearFieldGroupsValidity() {
      this._fieldGroupInvalidity = {};
    }

    /**
     * Clear recorded validation status for all properties.
     *
     * @param fieldGroupId Field group id
     * @param context Context
     * @returns SAPUI5 Context or undefined
     */;
    _proto.isFieldGroupValid = function isFieldGroupValid(fieldGroupId, context) {
      const id = this._getFieldGroupIndex(fieldGroupId, context);
      return Object.keys(this._fieldGroupInvalidity[id] ?? {}).length === 0;
    }

    /**
     * Gets the relative target property related to the Field.
     *
     * @param field Field control
     * @returns Relative target property
     */;
    _proto.getTargetProperty = function getTargetProperty(field) {
      var _this$_view$getBindin;
      const fieldPath = field.data("sourcePath");
      const metaModel = this._view.getModel().getMetaModel();
      const viewBindingPath = (_this$_view$getBindin = this._view.getBindingContext()) === null || _this$_view$getBindin === void 0 ? void 0 : _this$_view$getBindin.getPath();
      const viewMetaModelPath = viewBindingPath ? `${metaModel.getMetaPath(viewBindingPath)}/` : "";
      return fieldPath === null || fieldPath === void 0 ? void 0 : fieldPath.replace(viewMetaModelPath, "");
    }

    /**
     * Caches deferred SideEffects that will be executed when the FieldGroup is unfocused.
     *
     * @param event SAPUI5 event that comes from a field change
     * @param fieldValidity
     * @param fieldGroupPreRequisite Promise to be fulfilled before executing deferred SideEffects
     */;
    _proto.prepareSideEffectsForField = function prepareSideEffectsForField(event, fieldValidity, fieldGroupPreRequisite) {
      const field = event.getSource();
      this._saveFieldPropertiesStatus(field, fieldValidity);
      if (!fieldValidity) {
        return;
      }
      const sideEffectsMap = this.getFieldSideEffectsMap(field);

      // register field group SideEffects
      Object.keys(sideEffectsMap).filter(sideEffectsName => sideEffectsMap[sideEffectsName].immediate !== true).forEach(sideEffectsName => {
        const sideEffectsProperties = sideEffectsMap[sideEffectsName];
        this.registerFieldGroupSideEffects(sideEffectsProperties, fieldGroupPreRequisite);
      });
    }

    /**
     * Manages the workflow for SideEffects with related changes to a field
     * The following scenarios are managed:
     *  - Register: caches deferred SideEffects that will be executed when the FieldGroup is unfocused
     *  - Execute: triggers immediate SideEffects requests if the promise for the field event is fulfilled.
     *
     * @param event SAPUI5 event that comes from a field change
     * @param fieldValidity
     * @param fieldGroupPreRequisite Promise to be fulfilled before executing deferred SideEffects
     * @returns  Promise on SideEffects request(s)
     */;
    _proto.handleFieldChange = async function handleFieldChange(event, fieldValidity, fieldGroupPreRequisite) {
      const field = event.getSource();
      this.prepareSideEffectsForField(event, fieldValidity, fieldGroupPreRequisite);
      return this._manageSideEffectsFromField(field);
    }

    /**
     * Manages SideEffects with a related 'focus out' to a field group.
     *
     * @param event SAPUI5 Event
     * @returns Promise returning true if the SideEffects have been successfully executed
     */;
    _proto.handleFieldGroupChange = async function handleFieldGroupChange(event) {
      const field = event.getSource(),
        fieldGroupIds = event.getParameter("fieldGroupIds") ?? [],
        fieldGroupsSideEffects = fieldGroupIds.reduce((results, fieldGroupId) => {
          return results.concat(this.getRegisteredSideEffectsForFieldGroup(fieldGroupId));
        }, []);
      return Promise.all(fieldGroupsSideEffects.map(fieldGroupSideEffects => {
        return this._requestFieldGroupSideEffects(fieldGroupSideEffects);
      })).catch(error => {
        var _field$getBindingCont;
        const contextPath = (_field$getBindingCont = field.getBindingContext()) === null || _field$getBindingCont === void 0 ? void 0 : _field$getBindingCont.getPath();
        Log.debug(`Error while processing FieldGroup SideEffects on context ${contextPath}`, error);
      });
    }

    /**
     * Request SideEffects on a specific context.
     *
     * @param sideEffects SideEffects to be executed
     * @param context Context where SideEffects need to be executed
     * @param groupId
     * @param fnGetTargets The callback function which will give us the targets and actions if it was coming through some specific handling.
     * @param ignoreTriggerActions If true, we do not trigger actions defined in the side effect
     * @returns SideEffects request on SAPUI5 context
     */;
    _proto.requestSideEffects = async function requestSideEffects(sideEffects, context, groupId, fnGetTargets) {
      let ignoreTriggerActions = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
      let targets, triggerAction;
      if (fnGetTargets) {
        const targetsAndActionData = await fnGetTargets(sideEffects);
        targets = targetsAndActionData["aTargets"];
        triggerAction = targetsAndActionData["TriggerAction"];
      } else {
        targets = [...(sideEffects.targetEntities ?? []), ...(sideEffects.targetProperties ?? [])];
        triggerAction = sideEffects.triggerAction;
      }
      if (triggerAction && !ignoreTriggerActions) {
        this._sideEffectsService.executeAction(triggerAction, context, groupId);
      }
      if (targets.length) {
        return this._sideEffectsService.requestSideEffects(targets, context, groupId).catch(error => {
          this.registerFailedSideEffects([sideEffects], context);
          throw error;
        });
      }
    }

    /**
     * Request multiple SideEffects on a specific context.
     *
     * @param multiSideEffects SideEffects to be executed
     * @param context Context where SideEffects need to be executed
     * @param groupId The group id of the batch
     * @returns SideEffects request on SAPUI5 context
     */;
    _proto.requestMultipleSideEffects = async function requestMultipleSideEffects(multiSideEffects, context, groupId) {
      let properties = new Set();
      let navigationProperties = new Set();
      const actions = multiSideEffects.reduce((actions, sideEffects) => {
        const sideEffectAction = sideEffects.triggerAction;
        if (sideEffectAction) {
          actions.push(sideEffectAction);
        }
        return actions;
      }, []);
      for (const action of actions) {
        this._sideEffectsService.executeAction(action, context, groupId);
      }
      for (const sideEffects of multiSideEffects) {
        properties = (sideEffects.targetProperties ?? []).reduce((mySet, property) => mySet.add(property), properties);
        navigationProperties = (sideEffects.targetEntities ?? []).reduce((mySet, navigationProperty) => mySet.add(navigationProperty.$NavigationPropertyPath), navigationProperties);
      }
      return this._sideEffectsService.requestSideEffects([...Array.from(properties), ...Array.from(navigationProperties).map(navigationProperty => {
        return {
          $NavigationPropertyPath: navigationProperty
        };
      })], context, groupId).catch(error => {
        this.registerFailedSideEffects(multiSideEffects, context);
        throw error;
      });
    }

    /**
     * Gets failed SideEffects.
     *
     * @returns Registered SideEffects requests that have failed
     */;
    _proto.getRegisteredFailedRequests = function getRegisteredFailedRequests() {
      return this._registeredFailedSideEffects;
    }

    /**
     * Adds SideEffects to the queue of the failed SideEffects
     * The SideEffects are retriggered on the next request on the same context.
     *
     * @param sideEffects SideEffects that need to be retriggered
     * @param context Context where SideEffects have failed
     */;
    _proto.registerFailedSideEffects = function registerFailedSideEffects(multiSideEffects, context) {
      const contextPath = context.getPath();
      this._registeredFailedSideEffects[contextPath] = this._registeredFailedSideEffects[contextPath] ?? [];
      for (const sideEffects of multiSideEffects) {
        const isNotAlreadyListed = this._registeredFailedSideEffects[contextPath].every(mFailedSideEffects => sideEffects.fullyQualifiedName !== mFailedSideEffects.fullyQualifiedName);
        if (isNotAlreadyListed) {
          this._registeredFailedSideEffects[contextPath].push(sideEffects);
        }
      }
    }

    /**
     * Deletes SideEffects in the queue of the failed SideEffects for a context.
     *
     * @param contextPath Context path where SideEffects have failed
     */;
    _proto.unregisterFailedSideEffectsForAContext = function unregisterFailedSideEffectsForAContext(contextPath) {
      delete this._registeredFailedSideEffects[contextPath];
    }

    /**
     * Deletes SideEffects to the queue of the failed SideEffects.
     *
     * @param sideEffectsFullyQualifiedName SideEffects that need to be retriggered
     * @param context Context where SideEffects have failed
     */;
    _proto.unregisterFailedSideEffects = function unregisterFailedSideEffects(sideEffectsFullyQualifiedName, context) {
      var _this$_registeredFail;
      const contextPath = context.getPath();
      if ((_this$_registeredFail = this._registeredFailedSideEffects[contextPath]) !== null && _this$_registeredFail !== void 0 && _this$_registeredFail.length) {
        this._registeredFailedSideEffects[contextPath] = this._registeredFailedSideEffects[contextPath].filter(sideEffects => sideEffects.fullyQualifiedName !== sideEffectsFullyQualifiedName);
      }
    }

    /**
     * Adds SideEffects to the queue of a FieldGroup
     * The SideEffects are triggered when event related to the field group change is fired.
     *
     * @param sideEffectsProperties SideEffects properties
     * @param fieldGroupPreRequisite Promise to fullfil before executing the SideEffects
     */;
    _proto.registerFieldGroupSideEffects = function registerFieldGroupSideEffects(sideEffectsProperties, fieldGroupPreRequisite) {
      const id = this._getFieldGroupIndex(sideEffectsProperties.name, sideEffectsProperties.context);
      if (!this._registeredFieldGroupMap[id]) {
        this._registeredFieldGroupMap[id] = {
          promise: fieldGroupPreRequisite ?? Promise.resolve(),
          sideEffectProperty: sideEffectsProperties
        };
      }
    }

    /**
     * Deletes SideEffects to the queue of a FieldGroup.
     *
     * @param sideEffectsProperties SideEffects properties
     */;
    _proto.unregisterFieldGroupSideEffects = function unregisterFieldGroupSideEffects(sideEffectsProperties) {
      const {
        context,
        name
      } = sideEffectsProperties;
      const id = this._getFieldGroupIndex(name, context);
      delete this._registeredFieldGroupMap[id];
    }

    /**
     * Gets the registered SideEffects into the queue for a field group id.
     *
     * @param fieldGroupId Field group id
     * @returns Array of registered SideEffects and their promise
     */;
    _proto.getRegisteredSideEffectsForFieldGroup = function getRegisteredSideEffectsForFieldGroup(fieldGroupId) {
      const sideEffects = [];
      for (const registryIndex of Object.keys(this._registeredFieldGroupMap)) {
        if (registryIndex.startsWith(`${fieldGroupId}_`)) {
          sideEffects.push(this._registeredFieldGroupMap[registryIndex]);
        }
      }
      return sideEffects;
    }

    /**
     * Gets a status index.
     *
     * @param fieldGroupId The field group id
     * @param context SAPUI5 Context
     * @returns Index
     */;
    _proto._getFieldGroupIndex = function _getFieldGroupIndex(fieldGroupId, context) {
      return `${fieldGroupId}_${context.getPath()}`;
    }

    /**
     * Gets sideEffects properties from a field group id
     * The properties are:
     *  - name
     *  - sideEffects definition
     *  - sideEffects entity type
     *  - immediate sideEffects.
     *
     * @param fieldGroupId
     * @returns SideEffects properties
     */;
    _proto._getSideEffectsPropertyForFieldGroup = function _getSideEffectsPropertyForFieldGroup(fieldGroupId) {
      var _this$_sideEffectsSer;
      /**
       * string "$$ImmediateRequest" is added to the SideEffects name during templating to know
       * if this SideEffects must be immediately executed requested (on field change) or must
       * be deferred (on field group focus out)
       *
       */
      const immediate = fieldGroupId.includes(IMMEDIATE_REQUEST),
        name = fieldGroupId.replace(IMMEDIATE_REQUEST, ""),
        sideEffectParts = name.split("#"),
        sideEffectEntityType = sideEffectParts[0],
        sideEffectPath = `${sideEffectEntityType}@com.sap.vocabularies.Common.v1.SideEffects${sideEffectParts.length === 2 ? `#${sideEffectParts[1]}` : ""}`,
        sideEffects = (_this$_sideEffectsSer = this._sideEffectsService.getODataEntitySideEffects(sideEffectEntityType)) === null || _this$_sideEffectsSer === void 0 ? void 0 : _this$_sideEffectsSer[sideEffectPath];
      return {
        name,
        immediate,
        sideEffects,
        sideEffectEntityType
      };
    }

    /**
     * Manages the SideEffects for a field.
     *
     * @param field Field control
     * @returns Promise related to the requested immediate sideEffects
     */;
    _proto._manageSideEffectsFromField = async function _manageSideEffectsFromField(field) {
      const sideEffectsMap = this.getFieldSideEffectsMap(field);
      try {
        const sideEffectsToExecute = {};
        const addSideEffects = (context, sideEffects) => {
          const contextPath = context.getPath();
          if (sideEffectsToExecute[contextPath]) {
            sideEffectsToExecute[contextPath].sideEffects.push(sideEffects);
          } else {
            sideEffectsToExecute[contextPath] = {
              context,
              sideEffects: [sideEffects]
            };
          }
        };

        //Get Immediate SideEffects
        for (const sideEffectsProperties of Object.values(sideEffectsMap).filter(sideEffectsProperties => sideEffectsProperties.immediate === true)) {
          // if this SideEffects is recorded as failed SideEffects, need to remove it.
          this.unregisterFailedSideEffects(sideEffectsProperties.sideEffects.fullyQualifiedName, sideEffectsProperties.context);
          addSideEffects(sideEffectsProperties.context, sideEffectsProperties.sideEffects);
        }

        //Replay failed SideEffects related to the view or Field
        for (const context of [field.getBindingContext(), this._view.getBindingContext()].filter(context => !!context)) {
          const contextPath = context.getPath();
          const failedSideEffects = this._registeredFailedSideEffects[contextPath] ?? [];
          this.unregisterFailedSideEffectsForAContext(contextPath);
          for (const failedSideEffect of failedSideEffects) {
            addSideEffects(context, failedSideEffect);
          }
        }
        await Promise.all(Object.values(sideEffectsToExecute).map(async sideEffectsProperties => sideEffectsProperties.sideEffects.length === 1 ? this.requestSideEffects(sideEffectsProperties.sideEffects[0], sideEffectsProperties.context) : this.requestMultipleSideEffects(sideEffectsProperties.sideEffects, sideEffectsProperties.context)));
      } catch (e) {
        Log.debug(`Error while managing Field SideEffects`, e);
      }
    }

    /**
     * Requests the SideEffects for a fieldGroup.
     *
     * @param fieldGroupSideEffects Field group sideEffects with its promise
     * @returns Promise returning true if the SideEffects have been successfully executed
     */;
    _proto._requestFieldGroupSideEffects = async function _requestFieldGroupSideEffects(fieldGroupSideEffects) {
      this.unregisterFieldGroupSideEffects(fieldGroupSideEffects.sideEffectProperty);
      try {
        await fieldGroupSideEffects.promise;
      } catch (e) {
        Log.debug(`Error while processing FieldGroup SideEffects`, e);
        return;
      }
      try {
        const {
          sideEffects,
          context,
          name
        } = fieldGroupSideEffects.sideEffectProperty;
        if (this.isFieldGroupValid(name, context)) {
          await this.requestSideEffects(sideEffects, context);
        }
      } catch (e) {
        Log.debug(`Error while executing FieldGroup SideEffects`, e);
      }
    }

    /**
     * Saves the validation status of properties related to a field control.
     *
     * @param field The field control
     * @param success Status of the field validation
     */;
    _proto._saveFieldPropertiesStatus = function _saveFieldPropertiesStatus(field, success) {
      const sideEffectsMap = this.getFieldSideEffectsMap(field);
      Object.keys(sideEffectsMap).forEach(key => {
        const {
          name,
          immediate,
          context
        } = sideEffectsMap[key];
        if (!immediate) {
          const id = this._getFieldGroupIndex(name, context);
          if (success) {
            var _this$_fieldGroupInva;
            (_this$_fieldGroupInva = this._fieldGroupInvalidity[id]) === null || _this$_fieldGroupInva === void 0 ? true : delete _this$_fieldGroupInva[field.getId()];
          } else {
            this._fieldGroupInvalidity[id] = {
              ...this._fieldGroupInvalidity[id],
              ...{
                [field.getId()]: true
              }
            };
          }
        }
      });
    };
    return SideEffectsControllerExtension;
  }(ControllerExtension), (_applyDecoratedDescriptor(_class2.prototype, "onInit", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "onInit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "addControlSideEffects", [_dec3, _dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "addControlSideEffects"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "removeControlSideEffects", [_dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "removeControlSideEffects"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getContextForSideEffects", [_dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "getContextForSideEffects"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getFieldSideEffectsMap", [_dec9, _dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "getFieldSideEffectsMap"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getSideEffectsMapForFieldGroups", [_dec11, _dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "getSideEffectsMapForFieldGroups"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "clearFieldGroupsValidity", [_dec13, _dec14], Object.getOwnPropertyDescriptor(_class2.prototype, "clearFieldGroupsValidity"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "isFieldGroupValid", [_dec15, _dec16], Object.getOwnPropertyDescriptor(_class2.prototype, "isFieldGroupValid"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getTargetProperty", [_dec17, _dec18], Object.getOwnPropertyDescriptor(_class2.prototype, "getTargetProperty"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "prepareSideEffectsForField", [_dec19, _dec20], Object.getOwnPropertyDescriptor(_class2.prototype, "prepareSideEffectsForField"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "handleFieldChange", [_dec21, _dec22], Object.getOwnPropertyDescriptor(_class2.prototype, "handleFieldChange"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "handleFieldGroupChange", [_dec23, _dec24], Object.getOwnPropertyDescriptor(_class2.prototype, "handleFieldGroupChange"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "requestSideEffects", [_dec25, _dec26], Object.getOwnPropertyDescriptor(_class2.prototype, "requestSideEffects"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getRegisteredFailedRequests", [_dec27, _dec28], Object.getOwnPropertyDescriptor(_class2.prototype, "getRegisteredFailedRequests"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "registerFailedSideEffects", [_dec29, _dec30], Object.getOwnPropertyDescriptor(_class2.prototype, "registerFailedSideEffects"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "unregisterFailedSideEffectsForAContext", [_dec31, _dec32], Object.getOwnPropertyDescriptor(_class2.prototype, "unregisterFailedSideEffectsForAContext"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "unregisterFailedSideEffects", [_dec33, _dec34], Object.getOwnPropertyDescriptor(_class2.prototype, "unregisterFailedSideEffects"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "registerFieldGroupSideEffects", [_dec35, _dec36], Object.getOwnPropertyDescriptor(_class2.prototype, "registerFieldGroupSideEffects"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "unregisterFieldGroupSideEffects", [_dec37, _dec38], Object.getOwnPropertyDescriptor(_class2.prototype, "unregisterFieldGroupSideEffects"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getRegisteredSideEffectsForFieldGroup", [_dec39, _dec40], Object.getOwnPropertyDescriptor(_class2.prototype, "getRegisteredSideEffectsForFieldGroup"), _class2.prototype)), _class2)) || _class);
  return SideEffectsControllerExtension;
}, false);
