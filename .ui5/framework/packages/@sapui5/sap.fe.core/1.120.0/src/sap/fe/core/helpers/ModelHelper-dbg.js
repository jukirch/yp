/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/TypeGuards", "sap/ui/model/BindingMode", "sap/ui/model/json/JSONModel"], function (MetaModelConverter, TypeGuards, BindingMode, JSONModel) {
  "use strict";

  var isEntitySet = TypeGuards.isEntitySet;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  const ModelHelper = {
    // global switch to disable the collaboration draft by a private manifest flag
    // this allows customers to disable the collaboration draft in case we run into issues with the first delivery
    // this will be removed with the next S/4 release
    disableCollaborationDraft: false,
    /**
     * Method to determine if the programming model is sticky.
     *
     * @param metaModel ODataModelMetaModel to check for sticky enabled entity
     * @returns Returns true if sticky, else false
     */
    isStickySessionSupported: function (metaModel) {
      const entityContainer = metaModel.getObject("/");
      for (const entitySetName in entityContainer) {
        if (entityContainer[entitySetName].$kind === "EntitySet" && metaModel.getObject(`/${entitySetName}@com.sap.vocabularies.Session.v1.StickySessionSupported`)) {
          return true;
        }
      }
      return false;
    },
    /**
     * Method to determine if the programming model is draft.
     *
     * @param metaModel ODataModelMetaModel of the context for which draft support shall be checked
     * @param path Path for which draft support shall be checked
     * @returns Returns true if draft, else false
     */
    isDraftSupported: function (metaModel, path) {
      const metaContext = metaModel.getMetaContext(path);
      const objectPath = getInvolvedDataModelObjects(metaContext);
      return this.isObjectPathDraftSupported(objectPath);
    },
    /**
     * Checks if draft is supported for the data model object path.
     *
     * @param dataModelObjectPath
     * @returns `true` if it is supported
     */
    isObjectPathDraftSupported: function (dataModelObjectPath) {
      var _dataModelObjectPath$, _dataModelObjectPath$2, _dataModelObjectPath$3, _dataModelObjectPath$4, _dataModelObjectPath$5, _dataModelObjectPath$6, _dataModelObjectPath$7;
      const currentEntitySet = dataModelObjectPath.targetEntitySet;
      const bIsDraftRoot = ModelHelper.isDraftRoot(currentEntitySet);
      const bIsDraftNode = ModelHelper.isDraftNode(currentEntitySet);
      const bIsDraftParentEntityForContainment = (_dataModelObjectPath$ = dataModelObjectPath.targetObject) !== null && _dataModelObjectPath$ !== void 0 && _dataModelObjectPath$.containsTarget && ((_dataModelObjectPath$2 = dataModelObjectPath.startingEntitySet) !== null && _dataModelObjectPath$2 !== void 0 && (_dataModelObjectPath$3 = _dataModelObjectPath$2.annotations) !== null && _dataModelObjectPath$3 !== void 0 && (_dataModelObjectPath$4 = _dataModelObjectPath$3.Common) !== null && _dataModelObjectPath$4 !== void 0 && _dataModelObjectPath$4.DraftRoot || (_dataModelObjectPath$5 = dataModelObjectPath.startingEntitySet) !== null && _dataModelObjectPath$5 !== void 0 && (_dataModelObjectPath$6 = _dataModelObjectPath$5.annotations) !== null && _dataModelObjectPath$6 !== void 0 && (_dataModelObjectPath$7 = _dataModelObjectPath$6.Common) !== null && _dataModelObjectPath$7 !== void 0 && _dataModelObjectPath$7.DraftNode) ? true : false;
      return bIsDraftRoot || bIsDraftNode || !currentEntitySet && bIsDraftParentEntityForContainment;
    },
    /**
     * Method to determine if the service, supports collaboration draft.
     *
     * @param metaObject MetaObject to be used for determination
     * @param templateInterface API provided by UI5 templating if used
     * @returns Returns true if the service supports collaboration draft, else false
     */
    isCollaborationDraftSupported: function (metaObject, templateInterface) {
      if (!this.disableCollaborationDraft) {
        var _templateInterface$co;
        const oMetaModel = (templateInterface === null || templateInterface === void 0 ? void 0 : (_templateInterface$co = templateInterface.context) === null || _templateInterface$co === void 0 ? void 0 : _templateInterface$co.getModel()) || metaObject;
        const oEntityContainer = oMetaModel.getObject("/");
        for (const sEntitySet in oEntityContainer) {
          if (oEntityContainer[sEntitySet].$kind === "EntitySet" && oMetaModel.getObject(`/${sEntitySet}@com.sap.vocabularies.Common.v1.DraftRoot/ShareAction`)) {
            return true;
          }
        }
      }
      return false;
    },
    /**
     * Method to get the path of the DraftRoot path according to the provided context.
     *
     * @param oContext OdataModel context
     * @returns Returns the path of the draftRoot entity, or undefined if no draftRoot is found
     */
    getDraftRootPath: function (oContext) {
      const oMetaModel = oContext.getModel().getMetaModel();
      const getRootPath = function (sPath, model) {
        var _RegExp$exec;
        let firstIteration = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
        const sIterationPath = firstIteration ? sPath : (_RegExp$exec = new RegExp(/.*(?=\/)/).exec(sPath)) === null || _RegExp$exec === void 0 ? void 0 : _RegExp$exec[0]; // *Regex to get the ancestor
        if (sIterationPath && sIterationPath !== "/") {
          var _mDataModel$targetEnt, _mDataModel$targetEnt2;
          const sEntityPath = oMetaModel.getMetaPath(sIterationPath);
          const mDataModel = MetaModelConverter.getInvolvedDataModelObjects(oMetaModel.getContext(sEntityPath));
          if ((_mDataModel$targetEnt = mDataModel.targetEntitySet) !== null && _mDataModel$targetEnt !== void 0 && (_mDataModel$targetEnt2 = _mDataModel$targetEnt.annotations.Common) !== null && _mDataModel$targetEnt2 !== void 0 && _mDataModel$targetEnt2.DraftRoot) {
            return sIterationPath;
          }
          return getRootPath(sIterationPath, model, false);
        }
        return undefined;
      };
      return getRootPath(oContext.getPath(), oContext.getModel());
    },
    /**
     * Method to get the path of the StickyRoot path according to the provided context.
     *
     * @param oContext OdataModel context
     * @returns Returns the path of the StickyRoot entity, or undefined if no StickyRoot is found
     */
    getStickyRootPath: function (oContext) {
      const oMetaModel = oContext.getModel().getMetaModel();
      const getRootPath = function (sPath, model) {
        var _RegExp$exec2;
        let firstIteration = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
        const sIterationPath = firstIteration ? sPath : (_RegExp$exec2 = new RegExp(/.*(?=\/)/).exec(sPath)) === null || _RegExp$exec2 === void 0 ? void 0 : _RegExp$exec2[0]; // *Regex to get the ancestor
        if (sIterationPath && sIterationPath !== "/") {
          var _mDataModel$targetEnt3, _mDataModel$targetEnt4, _mDataModel$targetEnt5;
          const sEntityPath = oMetaModel.getMetaPath(sIterationPath);
          const mDataModel = MetaModelConverter.getInvolvedDataModelObjects(oMetaModel.getContext(sEntityPath));
          if ((_mDataModel$targetEnt3 = mDataModel.targetEntitySet) !== null && _mDataModel$targetEnt3 !== void 0 && (_mDataModel$targetEnt4 = _mDataModel$targetEnt3.annotations) !== null && _mDataModel$targetEnt4 !== void 0 && (_mDataModel$targetEnt5 = _mDataModel$targetEnt4.Session) !== null && _mDataModel$targetEnt5 !== void 0 && _mDataModel$targetEnt5.StickySessionSupported) {
            return sIterationPath;
          }
          return getRootPath(sIterationPath, model, false);
        }
        return undefined;
      };
      return getRootPath(oContext.getPath(), oContext.getModel());
    },
    /**
     * Returns the path to the target entity set via navigation property binding.
     *
     * @param oContext Context for which the target entity set will be determined
     * @returns Returns the path to the target entity set
     */
    getTargetEntitySet: function (oContext) {
      const sPath = oContext.getPath();
      if (oContext.getObject("$kind") === "EntitySet" || oContext.getObject("$kind") === "Action" || oContext.getObject("0/$kind") === "Action") {
        return sPath;
      }
      const sEntitySetPath = ModelHelper.getEntitySetPath(sPath);
      return `/${oContext.getObject(sEntitySetPath)}`;
    },
    /**
     * Returns complete path to the entity set via using navigation property binding. Note: To be used only after the metamodel has loaded.
     *
     * @param path Path for which complete entitySet path needs to be determined from entityType path
     * @param odataMetaModel Metamodel to be used.(Optional in normal scenarios, but needed for parameterized service scenarios)
     * @returns Returns complete path to the entity set
     */
    getEntitySetPath: function (path, odataMetaModel) {
      let entitySetPath = "";
      if (!odataMetaModel) {
        // Previous implementation for getting entitySetPath from entityTypePath
        entitySetPath = `/${path.split("/").filter(ModelHelper.filterOutNavPropBinding).join("/$NavigationPropertyBinding/")}`;
      } else {
        // Calculating the entitySetPath from MetaModel.
        const pathParts = path.split("/").filter(ModelHelper.filterOutNavPropBinding);
        if (pathParts.length > 1) {
          const initialPathObject = {
            growingPath: "/",
            pendingNavPropBinding: ""
          };
          const pathObject = pathParts.reduce((pathUnderConstruction, pathPart, idx) => {
            const delimiter = !!idx && "/$NavigationPropertyBinding/" || "";
            let {
              growingPath,
              pendingNavPropBinding
            } = pathUnderConstruction;
            const tempPath = growingPath + delimiter;
            const navPropBindings = odataMetaModel.getObject(tempPath);
            const navPropBindingToCheck = pendingNavPropBinding ? `${pendingNavPropBinding}/${pathPart}` : pathPart;
            if (navPropBindings && Object.keys(navPropBindings).length > 0 && navPropBindings.hasOwnProperty(navPropBindingToCheck)) {
              growingPath = tempPath + navPropBindingToCheck.replace("/", "%2F");
              pendingNavPropBinding = "";
            } else {
              pendingNavPropBinding += pendingNavPropBinding ? `/${pathPart}` : pathPart;
            }
            return {
              growingPath,
              pendingNavPropBinding
            };
          }, initialPathObject);
          entitySetPath = pathObject.growingPath;
        } else {
          entitySetPath = `/${pathParts[0]}`;
        }
      }
      return entitySetPath;
    },
    /**
     * Gets the path for the items property of MultiValueField parameters.
     *
     * @param oParameter Action Parameter
     * @returns Returns the complete model path for the items property of MultiValueField parameters
     */
    getActionParameterItemsModelPath: function (oParameter) {
      return oParameter && oParameter.$Name ? `{path: 'mvfview>/${oParameter.$Name}'}` : undefined;
    },
    filterOutNavPropBinding: function (sPathPart) {
      return sPathPart !== "" && sPathPart !== "$NavigationPropertyBinding";
    },
    /**
     * Adds a setProperty to the created binding contexts of the internal JSON model.
     *
     * @param Internal JSON Model which is enhanced
     */

    enhanceInternalJSONModel: function (oInternalModel) {
      const fnBindContext = oInternalModel.bindContext;
      oInternalModel.bindContext = function (sPath, oContext, mParameters) {
        for (var _len = arguments.length, args = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
          args[_key - 3] = arguments[_key];
        }
        oContext = fnBindContext.apply(this, [sPath, oContext, mParameters, ...args]);
        const fnGetBoundContext = oContext.getBoundContext;
        oContext.getBoundContext = function () {
          for (var _len2 = arguments.length, subArgs = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            subArgs[_key2] = arguments[_key2];
          }
          const oBoundContext = fnGetBoundContext.apply(this, ...subArgs);
          if (oBoundContext && !oBoundContext.setProperty) {
            oBoundContext.setProperty = function (propertyPath, value) {
              if (this.getObject() === undefined) {
                // initialize
                this.getModel().setProperty(this.getPath(), {});
              }
              const propertyPathSplit = propertyPath.split("/");
              // let's ensure that sub objects are initialized
              for (let i = 0; i < propertyPathSplit.length - 1; i++) {
                if (this.getObject(propertyPathSplit[i]) === undefined) {
                  // initialize
                  this.getModel().setProperty(this.getPath(propertyPathSplit[i]), {});
                }
              }
              this.getModel().setProperty(propertyPath, value, this);
            };
          }
          return oBoundContext;
        };
        return oContext;
      };
    },
    /**
     * Adds an handler on propertyChange.
     * The property "/editMode" is changed according to property '/isEditable' when this last one is set
     * in order to be compliant with former versions where building blocks use the property "/editMode"
     *
     * @param uiModel JSON Model which is enhanced
     * @param library Core library of SAP Fiori elements
     */

    enhanceUiJSONModel: function (uiModel, library) {
      const fnSetProperty = uiModel.setProperty;
      uiModel.setProperty = function () {
        for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          args[_key3] = arguments[_key3];
        }
        const value = args[1];
        if (args[0] === "/isEditable") {
          uiModel.setProperty("/editMode", value ? library.EditMode.Editable : library.EditMode.Display, args[2], args[3]);
        }
        return fnSetProperty.apply(this, [...args]);
      };
    },
    enhanceViewJSONModel: function (viewModel) {
      const fnGetObject = viewModel._getObject;
      viewModel._getObject = function (sPath, oContext) {
        if (sPath === undefined || sPath === "") {
          sPath = "/";
        }
        return fnGetObject.apply(this, [sPath, oContext]);
      };
    },
    /**
     * Returns whether filtering on the table is case sensitive.
     *
     * @param oMetaModel The instance of the meta model
     * @returns Returns 'false' if FilterFunctions annotation supports 'tolower', else 'true'
     */
    isFilteringCaseSensitive: function (oMetaModel) {
      if (!oMetaModel) {
        return undefined;
      }
      const aFilterFunctions = oMetaModel.getObject("/@Org.OData.Capabilities.V1.FilterFunctions");
      // Get filter functions defined at EntityContainer and check for existence of 'tolower'
      return aFilterFunctions ? aFilterFunctions.indexOf("tolower") === -1 : true;
    },
    /**
     * Get MetaPath for the context.
     *
     * @param oContext Context to be used
     * @returns Returns the metapath for the context.
     */
    getMetaPathForContext: function (oContext) {
      const oModel = oContext.getModel(),
        oMetaModel = oModel.getMetaModel(),
        sPath = oContext.getPath();
      return oMetaModel && sPath && oMetaModel.getMetaPath(sPath);
    },
    /**
     * Get MetaPath for the context.
     *
     * @param contextPath MetaPath to be used
     * @returns Returns the root entity set path.
     */
    getRootEntitySetPath: function (contextPath) {
      let rootEntitySetPath = "";
      const aPaths = contextPath ? contextPath.split("/") : [];
      if (aPaths.length > 1) {
        rootEntitySetPath = aPaths[1];
      }
      return rootEntitySetPath;
    },
    /**
     * Get MetaPath for the listBinding.
     *
     * @param oView View of the control using listBinding
     * @param vListBinding ODataListBinding object or the binding path for a temporary list binding
     * @returns Returns the metapath for the listbinding.
     */
    getAbsoluteMetaPathForListBinding: function (oView, vListBinding) {
      const oMetaModel = oView.getModel().getMetaModel();
      let sMetaPath;
      if (typeof vListBinding === "string") {
        if (vListBinding.startsWith("/")) {
          // absolute path
          sMetaPath = oMetaModel.getMetaPath(vListBinding);
        } else {
          // relative path
          const oBindingContext = oView.getBindingContext();
          const sRootContextPath = oBindingContext.getPath();
          sMetaPath = oMetaModel.getMetaPath(`${sRootContextPath}/${vListBinding}`);
        }
      } else {
        // we already get a list binding use this one
        const oBinding = vListBinding;
        const oRootBinding = oBinding.getRootBinding();
        if (oBinding === oRootBinding) {
          // absolute path
          sMetaPath = oMetaModel.getMetaPath(oBinding.getPath());
        } else {
          // relative path
          const sRootBindingPath = oRootBinding.getPath();
          const sRelativePath = oBinding.getPath();
          sMetaPath = oMetaModel.getMetaPath(`${sRootBindingPath}/${sRelativePath}`);
        }
      }
      return sMetaPath;
    },
    /**
     * Method to determine whether the argument is a draft root.
     *
     * @param entitySet EntitySet | Singleton | undefined
     * @returns Whether the argument is a draft root
     */
    isDraftRoot: function (entitySet) {
      return this.getDraftRoot(entitySet) !== undefined;
    },
    /**
     * Method to determine whether the argument is a draft node.
     *
     * @param entitySet EntitySet | Singleton | undefined
     * @returns Whether the argument is a draft node
     */
    isDraftNode: function (entitySet) {
      return this.getDraftNode(entitySet) !== undefined;
    },
    /**
     * Method to determine whether the argument is a sticky session root.
     *
     * @param entitySet EntitySet | Singleton | undefined
     * @returns Whether the argument is a sticky session root
     */
    isSticky: function (entitySet) {
      return this.getStickySession(entitySet) !== undefined;
    },
    /**
     * Method to determine if entity is updatable or not.
     *
     * @param entitySet EntitySet | Singleton | undefined
     * @param entityType EntityType
     * @returns True if updatable else false
     */
    isUpdateHidden: function (entitySet, entityType) {
      if (isEntitySet(entitySet)) {
        var _entitySet$annotation, _entityType$annotatio;
        return ((_entitySet$annotation = entitySet.annotations.UI) === null || _entitySet$annotation === void 0 ? void 0 : _entitySet$annotation.UpdateHidden) ?? (entityType === null || entityType === void 0 ? void 0 : (_entityType$annotatio = entityType.annotations.UI) === null || _entityType$annotatio === void 0 ? void 0 : _entityType$annotatio.UpdateHidden);
      }
    },
    /**
     * Gets the @Common.DraftRoot annotation if the argument is an EntitySet.
     *
     * @param entitySet EntitySet | Singleton | undefined
     * @returns DraftRoot
     */
    getDraftRoot: function (entitySet) {
      var _entitySet$annotation2;
      return isEntitySet(entitySet) ? (_entitySet$annotation2 = entitySet.annotations.Common) === null || _entitySet$annotation2 === void 0 ? void 0 : _entitySet$annotation2.DraftRoot : undefined;
    },
    /**
     * Gets the @Common.DraftNode annotation if the argument is an EntitySet.
     *
     * @param entitySet EntitySet | Singleton | undefined
     * @returns DraftRoot
     */
    getDraftNode: function (entitySet) {
      var _entitySet$annotation3;
      return isEntitySet(entitySet) ? (_entitySet$annotation3 = entitySet.annotations.Common) === null || _entitySet$annotation3 === void 0 ? void 0 : _entitySet$annotation3.DraftNode : undefined;
    },
    /**
     * Helper method to get sticky session.
     *
     * @param entitySet EntitySet | Singleton | undefined
     * @returns Session StickySessionSupported
     */
    getStickySession: function (entitySet) {
      var _entitySet$annotation4;
      return isEntitySet(entitySet) ? (_entitySet$annotation4 = entitySet.annotations.Session) === null || _entitySet$annotation4 === void 0 ? void 0 : _entitySet$annotation4.StickySessionSupported : undefined;
    },
    /**
     * Method to get the visibility state of delete button.
     *
     * @param entitySet EntitySet | Singleton | undefined
     * @param entityType EntityType
     * @returns True if delete button is hidden
     */
    getDeleteHidden: function (entitySet, entityType) {
      if (isEntitySet(entitySet)) {
        var _entitySet$annotation5, _entityType$annotatio2;
        return ((_entitySet$annotation5 = entitySet.annotations.UI) === null || _entitySet$annotation5 === void 0 ? void 0 : _entitySet$annotation5.DeleteHidden) ?? ((_entityType$annotatio2 = entityType.annotations.UI) === null || _entityType$annotatio2 === void 0 ? void 0 : _entityType$annotatio2.DeleteHidden);
      }
    },
    /**
     * This function will return metapath for the given list binding.
     *
     * @param listBinding ListBinding.
     * @returns MetaPath
     */
    getAbsolutePathFromListBinding(listBinding) {
      const metamodel = listBinding.getModel().getMetaModel();
      let metaPath;
      const rootBinding = listBinding.getRootBinding();
      if (listBinding === rootBinding) {
        metaPath = metamodel.getMetaPath(listBinding.getPath());
      } else {
        const rootBindingPath = rootBinding === null || rootBinding === void 0 ? void 0 : rootBinding.getPath();
        const relativePath = listBinding.getPath();
        metaPath = metamodel.getMetaPath(`${rootBindingPath}/${relativePath}`);
      }
      return metaPath;
    },
    enhanceODataModel(odataModel) {
      const fnMessage = odataModel.setMessages;
      const localAnnotationModel = new JSONModel({});
      localAnnotationModel.setDefaultBindingMode(BindingMode.OneWay);
      const baseSetProperty = localAnnotationModel.setProperty;
      localAnnotationModel.setProperty = function (path, value, context, asyncUpdate) {
        let fullPath = path;
        if (context) {
          fullPath = context.getPath(path);
        }
        const propertyPathSplit = fullPath.split("/");
        // let's ensure that sub objects are initialized
        let pathFromRoot = "";
        for (let i = 0; i < propertyPathSplit.length - 1; i++) {
          if (i > 0) {
            pathFromRoot += "/";
          }
          pathFromRoot += propertyPathSplit[i];
          if (this.getObject(pathFromRoot) === undefined) {
            // initialize
            this.setProperty(pathFromRoot, {});
          }
        }
        return baseSetProperty.apply(this, [path, value, context, asyncUpdate]);
      };
      function clearAnnotationType(annotationTypes, dataSet) {
        for (const contextPath in dataSet) {
          if (typeof dataSet[contextPath] === "object") {
            dataSet[contextPath] = clearAnnotationType(annotationTypes, dataSet[contextPath]);
            if (Object.keys(dataSet[contextPath]).length === 0) {
              delete dataSet[contextPath];
            }
          }
          for (const annotationType of annotationTypes) {
            if (contextPath.endsWith(annotationType)) {
              delete dataSet[contextPath];
            }
          }
        }
        return dataSet;
      }
      odataModel._localAnnotationModel = localAnnotationModel;
      odataModel.getLocalAnnotationModel = function () {
        return this._localAnnotationModel;
      };
      odataModel.setMessages = function (messages) {
        const cleanedData = clearAnnotationType(["@$ui5.fe.messageType", "@$ui5.fe.messageText"], this._localAnnotationModel.getData());
        this._localAnnotationModel.setData(cleanedData);
        for (const messageTarget in messages) {
          this._localAnnotationModel.setProperty(`${messageTarget}@$ui5.fe.messageType`, messages[messageTarget][0].getType());
          this._localAnnotationModel.setProperty(`${messageTarget}@$ui5.fe.messageText`, messages[messageTarget][0].getMessage());
        }
        fnMessage.apply(this, [messages]);
      };
      const fnBindProperty = odataModel.bindProperty.bind(odataModel);
      odataModel.bindProperty = function (path, context, parameters) {
        if (path.includes("@$ui5.fe.")) {
          return this._localAnnotationModel.bindProperty(path);
        }
        return fnBindProperty(path, context, parameters);
      };
      const fnDestroy = odataModel.destroy.bind(odataModel);
      odataModel.destroy = function () {
        this._localAnnotationModel.destroy();
        return fnDestroy.apply(this);
      };
    }
  };
  return ModelHelper;
}, false);
