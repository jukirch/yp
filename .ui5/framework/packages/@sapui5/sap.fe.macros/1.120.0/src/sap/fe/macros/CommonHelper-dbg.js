/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/CommonUtils", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/MetaModelFunction", "sap/fe/core/helpers/ModelHelper", "sap/m/library", "sap/ui/Device", "sap/ui/mdc/enums/FieldEditMode", "sap/ui/model/Context", "sap/ui/model/odata/v4/AnnotationHelper"], function (Log, CommonUtils, BindingToolkit, MetaModelFunction, ModelHelper, mLibrary, Device, FieldEditMode, Context, ODataModelAnnotationHelper) {
  "use strict";

  var isPropertyFilterable = MetaModelFunction.isPropertyFilterable;
  var ref = BindingToolkit.ref;
  var fn = BindingToolkit.fn;
  var compileExpression = BindingToolkit.compileExpression;
  const ValueColor = mLibrary.ValueColor;
  const CommonHelper = {
    getPathToKey: function (oCtx) {
      return oCtx.getObject();
    },
    /**
     * Determines if a field is visible.
     *
     * @param target Target instance
     * @param oInterface Interface instance
     * @returns Returns true, false, or expression with path
     */
    isVisible: function (target, oInterface) {
      const oModel = oInterface.context.getModel(),
        sPropertyPath = oInterface.context.getPath(),
        oAnnotations = oModel.getObject(`${sPropertyPath}@`),
        hidden = oAnnotations["@com.sap.vocabularies.UI.v1.Hidden"];
      return typeof hidden === "object" ? "{= !${" + hidden.$Path + "} }" : !hidden;
    },
    /**
     * Determine if field is editable.
     *
     * @param target Target instance
     * @param oInterface Interface instance
     * @returns A Binding Expression to determine if a field should be editable or not.
     */
    getParameterEditMode: function (target, oInterface) {
      const oModel = oInterface.context.getModel(),
        sPropertyPath = oInterface.context.getPath(),
        oAnnotations = oModel.getObject(`${sPropertyPath}@`),
        fieldControl = oAnnotations["@com.sap.vocabularies.Common.v1.FieldControl"],
        immutable = oAnnotations["@Org.OData.Core.V1.Immutable"],
        computed = oAnnotations["@Org.OData.Core.V1.Computed"];
      let sEditMode = FieldEditMode.Editable;
      if (immutable || computed) {
        sEditMode = FieldEditMode.ReadOnly;
      } else if (fieldControl) {
        if (fieldControl.$EnumMember) {
          if (fieldControl.$EnumMember === "com.sap.vocabularies.Common.v1.FieldControlType/ReadOnly") {
            sEditMode = FieldEditMode.ReadOnly;
          }
          if (fieldControl.$EnumMember === "com.sap.vocabularies.Common.v1.FieldControlType/Inapplicable" || fieldControl.$EnumMember === "com.sap.vocabularies.Common.v1.FieldControlType/Hidden") {
            sEditMode = FieldEditMode.Disabled;
          }
        }
        if (fieldControl.$Path) {
          sEditMode = "{= %{" + fieldControl.$Path + "} < 3 ? (%{" + fieldControl.$Path + "} === 0 ? '" + FieldEditMode.Disabled + "' : '" + FieldEditMode.ReadOnly + "') : '" + FieldEditMode.Editable + "'}";
        }
      }
      return sEditMode;
    },
    /**
     * Get the complete metapath to the target.
     *
     * @param target
     * @param oInterface
     * @returns The metapath
     */
    getMetaPath: function (target, oInterface) {
      return oInterface && oInterface.context && oInterface.context.getPath() || undefined;
    },
    isDesktop: function () {
      return Device.system.desktop === true;
    },
    getTargetCollectionPath: function (context, navCollection) {
      let sPath = context.getPath();
      if (context.getMetadata().getName() === "sap.ui.model.Context" && (context.getObject("$kind") === "EntitySet" || context.getObject("$ContainsTarget") === true)) {
        return sPath;
      }
      if (context.getModel) {
        sPath = context.getModel().getMetaPath && context.getModel().getMetaPath(sPath) || context.getModel().getMetaModel().getMetaPath(sPath);
      }
      //Supporting sPath of any format, either '/<entitySet>/<navigationCollection>' <OR> '/<entitySet>/$Type/<navigationCollection>'
      const aParts = sPath.split("/").filter(function (sPart) {
        return sPart && sPart != "$Type";
      }); //filter out empty strings and parts referring to '$Type'
      const entitySet = `/${aParts[0]}`;
      if (aParts.length === 1) {
        return entitySet;
      }
      const navigationCollection = navCollection === undefined ? aParts.slice(1).join("/$NavigationPropertyBinding/") : navCollection;
      return `${entitySet}/$NavigationPropertyBinding/${navigationCollection}`; // used in gotoTargetEntitySet method in the same file
    },

    isPropertyFilterable: function (context, oDataField) {
      const oModel = context.getModel(),
        sPropertyPath = context.getPath(),
        // LoacationPath would be the prefix of sPropertyPath, example: sPropertyPath = '/Customer/Set/Name' -> sPropertyLocationPath = '/Customer/Set'
        sPropertyLocationPath = CommonHelper.getLocationForPropertyPath(oModel, sPropertyPath),
        sProperty = sPropertyPath.replace(`${sPropertyLocationPath}/`, "");
      if (oDataField && (oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" || oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation")) {
        return false;
      }
      return isPropertyFilterable(oModel, sPropertyLocationPath, sProperty);
    },
    getLocationForPropertyPath: function (oModel, sPropertyPath) {
      let iLength;
      let sCollectionPath = sPropertyPath.slice(0, sPropertyPath.lastIndexOf("/"));
      if (oModel.getObject(`${sCollectionPath}/$kind`) === "EntityContainer") {
        iLength = sCollectionPath.length + 1;
        sCollectionPath = sPropertyPath.slice(iLength, sPropertyPath.indexOf("/", iLength));
      }
      return sCollectionPath;
    },
    gotoActionParameter: function (oContext) {
      const sPath = oContext.getPath(),
        sPropertyName = oContext.getObject(`${sPath}/$Name`);
      return CommonUtils.getParameterPath(sPath, sPropertyName);
    },
    /**
     * Returns the entity set name from the entity type name.
     *
     * @param oMetaModel OData v4 metamodel instance
     * @param sEntityType EntityType of the actiom
     * @returns The EntitySet of the bound action
     * @private
     * @ui5-restricted
     */
    getEntitySetName: function (oMetaModel, sEntityType) {
      const oEntityContainer = oMetaModel.getObject("/");
      for (const key in oEntityContainer) {
        if (typeof oEntityContainer[key] === "object" && oEntityContainer[key].$Type === sEntityType) {
          return key;
        }
      }
      return undefined;
    },
    /**
     * Returns the metamodel path correctly for bound actions if used with bReturnOnlyPath as true,
     * else returns an object which has 3 properties related to the action. They are the entity set name,
     * the $Path value of the OperationAvailable annotation and the binding parameter name. If
     * bCheckStaticValue is true, returns the static value of OperationAvailable annotation, if present.
     * e.g. for bound action someNameSpace.SomeBoundAction
     * of entity set SomeEntitySet, the string "/SomeEntitySet/someNameSpace.SomeBoundAction" is returned.
     *
     * @param oAction The context object of the action
     * @param bReturnOnlyPath If false, additional info is returned along with metamodel path to the bound action
     * @param sActionName The name of the bound action of the form someNameSpace.SomeBoundAction
     * @param bCheckStaticValue If true, the static value of OperationAvailable is returned, if present
     * @returns The string or object as specified by bReturnOnlyPath
     * @private
     * @ui5-restricted
     */
    getActionPath: function (oAction, bReturnOnlyPath, sActionName, bCheckStaticValue) {
      let sContextPath = oAction.getPath().split("/@")[0];
      sActionName = !sActionName ? oAction.getObject(oAction.getPath()) : sActionName;
      if (sActionName && sActionName.includes("(")) {
        // action bound to another entity type
        sActionName = sActionName.split("(")[0];
      } else if (oAction.getObject(sContextPath)) {
        // TODO: this logic sounds wrong, to be corrected
        const sEntityTypeName = oAction.getObject(sContextPath).$Type;
        const sEntityName = this.getEntitySetName(oAction.getModel(), sEntityTypeName);
        if (sEntityName) {
          sContextPath = `/${sEntityName}`;
        }
      } else {
        return sContextPath;
      }
      if (bCheckStaticValue) {
        return oAction.getObject(`${sContextPath}/${sActionName}@Org.OData.Core.V1.OperationAvailable`);
      }
      if (bReturnOnlyPath) {
        return `${sContextPath}/${sActionName}`;
      } else {
        return {
          sContextPath: sContextPath,
          sProperty: oAction.getObject(`${sContextPath}/${sActionName}@Org.OData.Core.V1.OperationAvailable/$Path`),
          sBindingParameter: oAction.getObject(`${sContextPath}/${sActionName}/@$ui5.overload/0/$Parameter/0/$Name`)
        };
      }
    },
    getNavigationContext: function (oContext) {
      return ODataModelAnnotationHelper.getNavigationPath(oContext.getPath());
    },
    /**
     * Returns the path without the entity type (potentially first) and property (last) part (optional).
     * The result can be an empty string if it is a simple direct property.
     *
     * If and only if the given property path starts with a slash (/), it is considered that the entity type
     * is part of the path and will be stripped away.
     *
     * @param sPropertyPath
     * @param bKeepProperty
     * @returns The navigation path
     */
    getNavigationPath: function (sPropertyPath, bKeepProperty) {
      const bStartsWithEntityType = sPropertyPath.startsWith("/");
      const aParts = sPropertyPath.split("/").filter(function (part) {
        return !!part;
      });
      if (bStartsWithEntityType) {
        aParts.shift();
      }
      if (!bKeepProperty) {
        aParts.pop();
      }
      return aParts.join("/");
    },
    /**
     * Returns the correct metamodel path for bound actions.
     *
     * Since this method is called irrespective of the action type, this will be applied to unbound actions.
     * In such a case, if an incorrect path is returned, it is ignored during templating.
     *
     * Example: for the bound action someNameSpace.SomeBoundAction of entity set SomeEntitySet,
     * the string "/SomeEntitySet/someNameSpace.SomeBoundAction" is returned.
     *
     * @function
     * @static
     * @name sap.fe.macros.CommonHelper.getActionContext
     * @memberof sap.fe.macros.CommonHelper
     * @param oAction Context object for the action
     * @returns Correct metamodel path for bound and incorrect path for unbound actions
     * @private
     * @ui5-restricted
     */
    getActionContext: function (oAction) {
      return CommonHelper.getActionPath(oAction, true);
    },
    /**
     * Returns the metamodel path correctly for overloaded bound actions. For unbound actions,
     * the incorrect path is returned, but ignored during templating.
     * e.g. for bound action someNameSpace.SomeBoundAction of entity set SomeEntitySet,
     * the string "/SomeEntitySet/someNameSpace.SomeBoundAction/@$ui5.overload/0" is returned.
     *
     * @function
     * @static
     * @name sap.fe.macros.CommonHelper.getPathToBoundActionOverload
     * @memberof sap.fe.macros.CommonHelper
     * @param oAction The context object for the action
     * @returns The correct metamodel path for bound action overload and incorrect path for unbound actions
     * @private
     * @ui5-restricted
     */
    getPathToBoundActionOverload: function (oAction) {
      const sPath = CommonHelper.getActionPath(oAction, true);
      return `${sPath}/@$ui5.overload/0`;
    },
    /**
     * Returns the string with single quotes.
     *
     * @function
     * @memberof sap.fe.macros.CommonHelper
     * @param sValue Some string that needs to be converted into single quotes
     * @param [bEscape] Should the string be escaped beforehand
     * @returns - String with single quotes
     */
    addSingleQuotes: function (sValue, bEscape) {
      if (bEscape && sValue) {
        sValue = this.escapeSingleQuotes(sValue);
      }
      return `'${sValue}'`;
    },
    /**
     * Returns the string with escaped single quotes.
     *
     * @function
     * @memberof sap.fe.macros.CommonHelper
     * @param sValue Some string that needs escaping of single quotes
     * @returns - String with escaped single quotes
     */
    escapeSingleQuotes: function (sValue) {
      return sValue.replace(/[']/g, "\\'");
    },
    /**
     * Returns the function string
     * The first argument of generateFunction is name of the generated function string.
     * Remaining arguments of generateFunction are arguments of the newly generated function string.
     *
     * @function
     * @memberof sap.fe.macros.CommonHelper
     * @param sFuncName Some string for the function name
     * @param args The remaining arguments
     * @returns - Function string depends on arguments passed
     */
    generateFunction: function (sFuncName) {
      let sParams = "";
      for (let i = 0; i < (arguments.length <= 1 ? 0 : arguments.length - 1); i++) {
        sParams += i + 1 < 1 || arguments.length <= i + 1 ? undefined : arguments[i + 1];
        if (i < (arguments.length <= 1 ? 0 : arguments.length - 1) - 1) {
          sParams += ", ";
        }
      }
      let sFunction = `${sFuncName}()`;
      if (sParams) {
        sFunction = `${sFuncName}(${sParams})`;
      }
      return sFunction;
    },
    /*
     * Returns the visibility expression for datapoint title/link
     *
     * @function
     * @param {string} [sPath] annotation path of data point or Microchart
     * @param {boolean} [bLink] true if link visibility is being determined, false if title visibility is being determined
     * @param {boolean} [bFieldVisibility] true if field is vsiible, false otherwise
     * @returns  {string} sVisibilityExp Used to get the  visibility binding for DataPoints title in the Header.
     *
     */

    getHeaderDataPointLinkVisibility: function (sPath, bLink, bFieldVisibility) {
      let sVisibilityExp;
      if (bFieldVisibility) {
        sVisibilityExp = bLink ? "{= ${internal>isHeaderDPLinkVisible/" + sPath + "} === true && " + bFieldVisibility + "}" : "{= ${internal>isHeaderDPLinkVisible/" + sPath + "} !== true && " + bFieldVisibility + "}";
      } else {
        sVisibilityExp = bLink ? "{= ${internal>isHeaderDPLinkVisible/" + sPath + "} === true}" : "{= ${internal>isHeaderDPLinkVisible/" + sPath + "} !== true}";
      }
      return sVisibilityExp;
    },
    /**
     * Converts object to string(different from JSON.stringify or.toString).
     *
     * @function
     * @memberof sap.fe.macros.CommonHelper
     * @param oParams Some object
     * @returns - Object string
     */
    objectToString: function (oParams) {
      let iNumberOfKeys = Object.keys(oParams).length,
        sParams = "";
      for (const sKey in oParams) {
        let sValue = oParams[sKey];
        if (sValue && typeof sValue === "object") {
          sValue = this.objectToString(sValue);
        }
        sParams += `${sKey}: ${sValue}`;
        if (iNumberOfKeys > 1) {
          --iNumberOfKeys;
          sParams += ", ";
        }
      }
      return `{ ${sParams}}`;
    },
    /**
     * Removes escape characters (\) from an expression.
     *
     * @function
     * @memberof sap.fe.macros.CommonHelper
     * @param sExpression An expression with escape characters
     * @returns Expression string without escape characters or undefined
     */
    removeEscapeCharacters: function (sExpression) {
      return sExpression ? sExpression.replace(/\\?\\([{}])/g, "$1") : undefined;
    },
    /**
     * Makes updates to a stringified object so that it works properly in a template by adding ui5Object:true.
     *
     * @param sStringified
     * @returns The updated string representation of the object
     */
    stringifyObject: function (sStringified) {
      if (!sStringified || sStringified === "{}") {
        return undefined;
      } else {
        const oObject = JSON.parse(sStringified);
        if (typeof oObject === "object" && !Array.isArray(oObject)) {
          const oUI5Object = {
            ui5object: true
          };
          Object.assign(oUI5Object, oObject);
          return JSON.stringify(oUI5Object);
        } else {
          const sType = Array.isArray(oObject) ? "Array" : typeof oObject;
          Log.error(`Unexpected object type in stringifyObject (${sType}) - only works with object`);
          throw new Error("stringifyObject only works with objects!");
        }
      }
    },
    /**
     * Create a string representation of the given data, taking care that it is not treated as a binding expression.
     *
     * @param vData The data to stringify
     * @returns The string representation of the data.
     */
    stringifyCustomData: function (vData) {
      const oObject = {
        ui5object: true
      };
      oObject["customData"] = vData instanceof Context ? vData.getObject() : vData;
      return JSON.stringify(oObject);
    },
    /**
     * Parses the given data, potentially unwraps the data.
     *
     * @param vData The data to parse
     * @returns The result of the data parsing
     */
    parseCustomData: function (vData) {
      vData = typeof vData === "string" ? JSON.parse(vData) : vData;
      if (vData && vData.hasOwnProperty("customData")) {
        return vData["customData"];
      }
      return vData;
    },
    getContextPath: function (oValue, oInterface) {
      const sPath = oInterface && oInterface.context && oInterface.context.getPath();
      return sPath[sPath.length - 1] === "/" ? sPath.slice(0, -1) : sPath;
    },
    /**
     * Returns a stringified JSON object containing  Presentation Variant sort conditions.
     *
     * @param oContext
     * @param oPresentationVariant Presentation variant Annotation
     * @param sPresentationVariantPath
     * @returns Stringified JSON object
     */
    getSortConditions: function (oContext, oPresentationVariant, sPresentationVariantPath) {
      if (oPresentationVariant && CommonHelper._isPresentationVariantAnnotation(sPresentationVariantPath) && oPresentationVariant.SortOrder) {
        const aSortConditions = {
          sorters: []
        };
        const sEntityPath = oContext.getPath(0).split("@")[0];
        oPresentationVariant.SortOrder.forEach(function () {
          let oCondition = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
          let oSortProperty = {};
          const oSorter = {};
          if (oCondition.DynamicProperty) {
            var _oContext$getModel$ge;
            oSortProperty = (_oContext$getModel$ge = oContext.getModel(0).getObject(sEntityPath + oCondition.DynamicProperty.$AnnotationPath)) === null || _oContext$getModel$ge === void 0 ? void 0 : _oContext$getModel$ge.Name;
          } else if (oCondition.Property) {
            oSortProperty = oCondition.Property.$PropertyPath;
          }
          if (oSortProperty) {
            oSorter.name = oSortProperty;
            oSorter.descending = !!oCondition.Descending;
            aSortConditions.sorters.push(oSorter);
          } else {
            throw new Error("Please define the right path to the sort property");
          }
        });
        return JSON.stringify(aSortConditions);
      }
      return undefined;
    },
    _isPresentationVariantAnnotation: function (annotationPath) {
      return annotationPath.includes(`@${"com.sap.vocabularies.UI.v1.PresentationVariant"}`) || annotationPath.includes(`@${"com.sap.vocabularies.UI.v1.SelectionPresentationVariant"}`);
    },
    createPresentationPathContext: function (oPresentationContext) {
      const aPaths = oPresentationContext.sPath.split("@") || [];
      const oModel = oPresentationContext.getModel();
      if (aPaths.length && aPaths[aPaths.length - 1].indexOf("com.sap.vocabularies.UI.v1.SelectionPresentationVariant") > -1) {
        const sPath = oPresentationContext.sPath.split("/PresentationVariant")[0];
        return oModel.createBindingContext(`${sPath}@sapui.name`);
      }
      return oModel.createBindingContext(`${oPresentationContext.sPath}@sapui.name`);
    },
    getPressHandlerForDataFieldForIBN: function (oDataField, sContext, bNavigateWithConfirmationDialog) {
      if (!oDataField) return undefined;
      const mNavigationParameters = {
        navigationContexts: sContext ? sContext : "${$source>/}.getBindingContext()"
      };
      if (oDataField.RequiresContext && !oDataField.Inline && bNavigateWithConfirmationDialog) {
        mNavigationParameters.applicableContexts = "${internal>ibn/" + oDataField.SemanticObject + "-" + oDataField.Action + "/aApplicable/}";
        mNavigationParameters.notApplicableContexts = "${internal>ibn/" + oDataField.SemanticObject + "-" + oDataField.Action + "/aNotApplicable/}";
        mNavigationParameters.label = this.addSingleQuotes(oDataField.Label, true);
      }
      if (oDataField.Mapping) {
        mNavigationParameters.semanticObjectMapping = this.addSingleQuotes(JSON.stringify(oDataField.Mapping));
      }
      return this.generateFunction(bNavigateWithConfirmationDialog ? "._intentBasedNavigation.navigateWithConfirmationDialog" : "._intentBasedNavigation.navigate", this.addSingleQuotes(oDataField.SemanticObject), this.addSingleQuotes(oDataField.Action), this.objectToString(mNavigationParameters));
    },
    getEntitySet: function (oContext) {
      const sPath = oContext.getPath();
      return ModelHelper.getEntitySetPath(sPath);
    },
    /**
     * Handles the visibility of form menu actions both in path based and static value scenarios.
     *
     * @function
     * @memberof sap.fe.macros.CommonHelper
     * @param sVisibleValue Either static boolean values or Array of path expressions for visibility of menu button.
     * @returns The binding expression determining the visibility of menu actions.
     */
    handleVisibilityOfMenuActions: function (sVisibleValue) {
      const combinedConditions = [];
      if (Array.isArray(sVisibleValue)) {
        for (let i = 0; i < sVisibleValue.length; i++) {
          if (sVisibleValue[i].indexOf("{") > -1 && sVisibleValue[i].indexOf("{=") === -1) {
            sVisibleValue[i] = "{=" + sVisibleValue[i] + "}";
          }
          if (sVisibleValue[i].split("{=").length > 0) {
            sVisibleValue[i] = sVisibleValue[i].split("{=")[1].slice(0, -1);
          }
          combinedConditions.push(`(${sVisibleValue[i]})`);
        }
      }
      return combinedConditions.length > 0 ? `{= ${combinedConditions.join(" || ")}}` : sVisibleValue;
    },
    /**
     * Method to do the calculation of criticality in case CriticalityCalculation present in the annotation
     *
     * The calculation is done by comparing a value to the threshold values relevant for the specified improvement direction.
     * For improvement direction Target, the criticality is calculated using both low and high threshold values. It will be
     *
     * - Positive if the value is greater than or equal to AcceptanceRangeLowValue and lower than or equal to AcceptanceRangeHighValue
     * - Neutral if the value is greater than or equal to ToleranceRangeLowValue and lower than AcceptanceRangeLowValue OR greater than AcceptanceRangeHighValue and lower than or equal to ToleranceRangeHighValue
     * - Critical if the value is greater than or equal to DeviationRangeLowValue and lower than ToleranceRangeLowValue OR greater than ToleranceRangeHighValue and lower than or equal to DeviationRangeHighValue
     * - Negative if the value is lower than DeviationRangeLowValue or greater than DeviationRangeHighValue
     *
     * For improvement direction Minimize, the criticality is calculated using the high threshold values. It is
     * - Positive if the value is lower than or equal to AcceptanceRangeHighValue
     * - Neutral if the value is greater than AcceptanceRangeHighValue and lower than or equal to ToleranceRangeHighValue
     * - Critical if the value is greater than ToleranceRangeHighValue and lower than or equal to DeviationRangeHighValue
     * - Negative if the value is greater than DeviationRangeHighValue
     *
     * For improvement direction Maximize, the criticality is calculated using the low threshold values. It is
     *
     * - Positive if the value is greater than or equal to AcceptanceRangeLowValue
     * - Neutral if the value is less than AcceptanceRangeLowValue and greater than or equal to ToleranceRangeLowValue
     * - Critical if the value is lower than ToleranceRangeLowValue and greater than or equal to DeviationRangeLowValue
     * - Negative if the value is lower than DeviationRangeLowValue
     *
     * Thresholds are optional. For unassigned values, defaults are determined in this order:
     *
     * - For DeviationRange, an omitted LowValue translates into the smallest possible number (-INF), an omitted HighValue translates into the largest possible number (+INF)
     * - For ToleranceRange, an omitted LowValue will be initialized with DeviationRangeLowValue, an omitted HighValue will be initialized with DeviationRangeHighValue
     * - For AcceptanceRange, an omitted LowValue will be initialized with ToleranceRangeLowValue, an omitted HighValue will be initialized with ToleranceRangeHighValue.
     *
     * @param sImprovementDirection ImprovementDirection to be used for creating the criticality binding
     * @param sValue Value from Datapoint to be measured
     * @param sDeviationLow ExpressionBinding for Lower Deviation level
     * @param sToleranceLow ExpressionBinding for Lower Tolerance level
     * @param sAcceptanceLow ExpressionBinding for Lower Acceptance level
     * @param sAcceptanceHigh ExpressionBinding for Higher Acceptance level
     * @param sToleranceHigh ExpressionBinding for Higher Tolerance level
     * @param sDeviationHigh ExpressionBinding for Higher Deviation level
     * @returns Returns criticality calculation as expression binding
     */
    getCriticalityCalculationBinding: function (sImprovementDirection, sValue, sDeviationLow, sToleranceLow, sAcceptanceLow, sAcceptanceHigh, sToleranceHigh, sDeviationHigh) {
      let sCriticalityExpression = ValueColor.Neutral; // Default Criticality State

      sValue = `%${sValue}`;

      // Setting Unassigned Values
      sDeviationLow = sDeviationLow || -Infinity;
      sToleranceLow = sToleranceLow || sDeviationLow;
      sAcceptanceLow = sAcceptanceLow || sToleranceLow;
      sDeviationHigh = sDeviationHigh || Infinity;
      sToleranceHigh = sToleranceHigh || sDeviationHigh;
      sAcceptanceHigh = sAcceptanceHigh || sToleranceHigh;

      // Dealing with Decimal and Path based bingdings
      sDeviationLow = sDeviationLow && (+sDeviationLow ? +sDeviationLow : `%${sDeviationLow}`);
      sToleranceLow = sToleranceLow && (+sToleranceLow ? +sToleranceLow : `%${sToleranceLow}`);
      sAcceptanceLow = sAcceptanceLow && (+sAcceptanceLow ? +sAcceptanceLow : `%${sAcceptanceLow}`);
      sAcceptanceHigh = sAcceptanceHigh && (+sAcceptanceHigh ? +sAcceptanceHigh : `%${sAcceptanceHigh}`);
      sToleranceHigh = sToleranceHigh && (+sToleranceHigh ? +sToleranceHigh : `%${sToleranceHigh}`);
      sDeviationHigh = sDeviationHigh && (+sDeviationHigh ? +sDeviationHigh : `%${sDeviationHigh}`);

      // Creating runtime expression binding from criticality calculation for Criticality State
      if (sImprovementDirection.includes("Minimize")) {
        sCriticalityExpression = "{= " + sValue + " <= " + sAcceptanceHigh + " ? '" + ValueColor.Good + "' : " + sValue + " <= " + sToleranceHigh + " ? '" + ValueColor.Neutral + "' : " + "(" + sDeviationHigh + " && " + sValue + " <= " + sDeviationHigh + ") ? '" + ValueColor.Critical + "' : '" + ValueColor.Error + "' }";
      } else if (sImprovementDirection.includes("Maximize")) {
        sCriticalityExpression = "{= " + sValue + " >= " + sAcceptanceLow + " ? '" + ValueColor.Good + "' : " + sValue + " >= " + sToleranceLow + " ? '" + ValueColor.Neutral + "' : " + "(" + sDeviationLow + " && " + sValue + " >= " + sDeviationLow + ") ? '" + ValueColor.Critical + "' : '" + ValueColor.Error + "' }";
      } else if (sImprovementDirection.includes("Target")) {
        sCriticalityExpression = "{= (" + sValue + " <= " + sAcceptanceHigh + " && " + sValue + " >= " + sAcceptanceLow + ") ? '" + ValueColor.Good + "' : " + "((" + sValue + " >= " + sToleranceLow + " && " + sValue + " < " + sAcceptanceLow + ") || (" + sValue + " > " + sAcceptanceHigh + " && " + sValue + " <= " + sToleranceHigh + ")) ? '" + ValueColor.Neutral + "' : " + "((" + sDeviationLow + " && (" + sValue + " >= " + sDeviationLow + ") && (" + sValue + " < " + sToleranceLow + ")) || ((" + sValue + " > " + sToleranceHigh + ") && " + sDeviationHigh + " && (" + sValue + " <= " + sDeviationHigh + "))) ? '" + ValueColor.Critical + "' : '" + ValueColor.Error + "' }";
      } else {
        Log.warning("Case not supported, returning the default Value Neutral");
      }
      return sCriticalityExpression;
    },
    /**
     * To fetch measure attribute index.
     *
     * @param iMeasure Chart Annotations
     * @param oChartAnnotations Chart Annotations
     * @returns MeasureAttribute index.
     * @private
     */
    getMeasureAttributeIndex: function (iMeasure, oChartAnnotations) {
      var _oChartAnnotations$Me, _oChartAnnotations$Dy;
      let aMeasures, sMeasurePropertyPath;
      if ((oChartAnnotations === null || oChartAnnotations === void 0 ? void 0 : (_oChartAnnotations$Me = oChartAnnotations.Measures) === null || _oChartAnnotations$Me === void 0 ? void 0 : _oChartAnnotations$Me.length) > 0) {
        aMeasures = oChartAnnotations.Measures;
        sMeasurePropertyPath = aMeasures[iMeasure].$PropertyPath;
      } else if ((oChartAnnotations === null || oChartAnnotations === void 0 ? void 0 : (_oChartAnnotations$Dy = oChartAnnotations.DynamicMeasures) === null || _oChartAnnotations$Dy === void 0 ? void 0 : _oChartAnnotations$Dy.length) > 0) {
        aMeasures = oChartAnnotations.DynamicMeasures;
        sMeasurePropertyPath = aMeasures[iMeasure].$AnnotationPath;
      }
      let bMeasureAttributeExists;
      const aMeasureAttributes = oChartAnnotations.MeasureAttributes;
      let iMeasureAttribute = -1;
      const fnCheckMeasure = function (sMeasurePath, oMeasureAttribute, index) {
        if (oMeasureAttribute) {
          if (oMeasureAttribute.Measure && oMeasureAttribute.Measure.$PropertyPath === sMeasurePath) {
            iMeasureAttribute = index;
            return true;
          } else if (oMeasureAttribute.DynamicMeasure && oMeasureAttribute.DynamicMeasure.$AnnotationPath === sMeasurePath) {
            iMeasureAttribute = index;
            return true;
          }
        }
      };
      if (aMeasureAttributes) {
        bMeasureAttributeExists = aMeasureAttributes.some(fnCheckMeasure.bind(null, sMeasurePropertyPath));
      }
      return bMeasureAttributeExists && iMeasureAttribute > -1 && iMeasureAttribute;
    },
    getMeasureAttribute: function (oContext) {
      const oMetaModel = oContext.getModel(),
        sChartAnnotationPath = oContext.getPath();
      return oMetaModel.requestObject(sChartAnnotationPath).then(function (oChartAnnotations) {
        const aMeasureAttributes = oChartAnnotations.MeasureAttributes,
          iMeasureAttribute = CommonHelper.getMeasureAttributeIndex(0, oChartAnnotations);
        const sMeasureAttributePath = iMeasureAttribute > -1 && aMeasureAttributes[iMeasureAttribute] && aMeasureAttributes[iMeasureAttribute].DataPoint ? `${sChartAnnotationPath}/MeasureAttributes/${iMeasureAttribute}/` : undefined;
        if (sMeasureAttributePath === undefined) {
          Log.warning("DataPoint missing for the measure");
        }
        return sMeasureAttributePath ? `${sMeasureAttributePath}DataPoint/$AnnotationPath/` : sMeasureAttributePath;
      });
    },
    /**
     * This function returns the measureAttribute for the measure.
     *
     * @param oContext Context to the measure annotation
     * @returns Path to the measureAttribute of the measure
     */
    getMeasureAttributeForMeasure: function (oContext) {
      const oMetaModel = oContext.getModel(),
        sMeasurePath = oContext.getPath(),
        sChartAnnotationPath = sMeasurePath.substring(0, sMeasurePath.lastIndexOf("Measure")),
        iMeasure = sMeasurePath.replace(/.*\//, "");
      const oChartAnnotations = oMetaModel.getObject(sChartAnnotationPath);
      const aMeasureAttributes = oChartAnnotations.MeasureAttributes,
        iMeasureAttribute = CommonHelper.getMeasureAttributeIndex(iMeasure, oChartAnnotations);
      const sMeasureAttributePath = iMeasureAttribute > -1 && aMeasureAttributes[iMeasureAttribute] && aMeasureAttributes[iMeasureAttribute].DataPoint ? `${sChartAnnotationPath}MeasureAttributes/${iMeasureAttribute}/` : undefined;
      if (sMeasureAttributePath === undefined) {
        Log.warning("DataPoint missing for the measure");
      }
      return sMeasureAttributePath ? `${sMeasureAttributePath}DataPoint/$AnnotationPath/` : sMeasureAttributePath;
    },
    /**
     * Method to determine if the contained navigation property has a draft root/node parent entitySet.
     *
     * @function
     * @name isDraftParentEntityForContainment
     * @param oTargetCollectionContainsTarget Target collection has ContainsTarget property
     * @param oTableMetadata Table metadata for which draft support shall be checked
     * @returns Returns true if draft
     */
    isDraftParentEntityForContainment: function (oTargetCollectionContainsTarget, oTableMetadata) {
      if (oTargetCollectionContainsTarget) {
        if (oTableMetadata && oTableMetadata.parentEntitySet && oTableMetadata.parentEntitySet.sPath) {
          const sParentEntitySetPath = oTableMetadata.parentEntitySet.sPath;
          const oDraftRoot = oTableMetadata.parentEntitySet.oModel.getObject(`${sParentEntitySetPath}@com.sap.vocabularies.Common.v1.DraftRoot`);
          const oDraftNode = oTableMetadata.parentEntitySet.oModel.getObject(`${sParentEntitySetPath}@com.sap.vocabularies.Common.v1.DraftNode`);
          if (oDraftRoot || oDraftNode) {
            return true;
          } else {
            return false;
          }
        }
      }
      return false;
    },
    /**
     * Ensures the data is processed as defined in the template.
     * Since the property Data is of the type 'object', it may not be in the same order as required by the template.
     *
     * @function
     * @memberof sap.fe.macros.CommonHelper
     * @param dataElement The data that is currently being processed.
     * @returns The correct path according to the template.
     */
    getDataFromTemplate: function (dataElement) {
      const splitPath = dataElement.getPath().split("/");
      const dataKey = splitPath[splitPath.length - 1];
      const connectedDataPath = `/${splitPath.slice(1, -2).join("/")}/@`;
      const connectedObject = dataElement.getObject(connectedDataPath);
      const template = connectedObject.Template;
      const splitTemp = template.split("}");
      const tempArray = [];
      for (let i = 0; i < splitTemp.length - 1; i++) {
        const key = splitTemp[i].split("{")[1].trim();
        tempArray.push(key);
      }
      Object.keys(connectedObject.Data).forEach(function (sKey) {
        if (sKey.startsWith("$")) {
          delete connectedObject.Data[sKey];
        }
      });
      const index = Object.keys(connectedObject.Data).indexOf(dataKey);
      return `/${splitPath.slice(1, -2).join("/")}/Data/${tempArray[index]}`;
    },
    /**
     * Checks if the end of the template has been reached.
     *
     * @function
     * @memberof sap.fe.macros.CommonHelper
     * @param target The target of the connected fields.
     * @param element The element that is currently being processed.
     * @returns True or False (depending on the template index).
     */
    notLastIndex: function (target, element) {
      const template = target.Template;
      const splitTemp = template.split("}");
      const tempArray = [];
      let isLastIndex = false;
      for (let i = 0; i < splitTemp.length - 1; i++) {
        const dataKey = splitTemp[i].split("{")[1].trim();
        tempArray.push(dataKey);
      }
      tempArray.forEach(function (templateInfo) {
        const lastIndex = tempArray.length - 1;
        if (target.Data[templateInfo] === element && tempArray.indexOf(templateInfo) < lastIndex) {
          isLastIndex = true;
        }
      });
      return isLastIndex;
    },
    /**
     * Determines the delimiter from the template.
     *
     * @function
     * @memberof sap.fe.macros.CommonHelper
     * @param template The template string.
     * @returns The delimiter in the template string.
     */
    getDelimiter: function (template) {
      return template.split("}")[1].split("{")[0].trim();
    },
    oMetaModel: undefined,
    setMetaModel: function (oMetaModel) {
      this.oMetaModel = oMetaModel;
    },
    getMetaModel: function (oContext, oInterface) {
      if (oContext) {
        return oInterface.context.getModel();
      }
      return this.oMetaModel;
    },
    getParameters: function (oContext, oInterface) {
      if (oContext) {
        const oMetaModel = oInterface.context.getModel();
        const sPath = oInterface.context.getPath();
        const oParameterInfo = CommonUtils.getParameterInfo(oMetaModel, sPath);
        if (oParameterInfo.parameterProperties) {
          return Object.keys(oParameterInfo.parameterProperties);
        }
      }
      return [];
    },
    /**
     * Build an expression calling an action handler via the FPM helper's actionWrapper function
     *
     * This function assumes that the 'FPM.actionWrapper()' function is available at runtime.
     *
     * @param oAction Action metadata
     * @param oAction.handlerModule Module containing the action handler method
     * @param oAction.handlerMethod Action handler method name
     * @param [oThis] `this` (if the function is called from a macro)
     * @param oThis.id The table's ID
     * @returns The action wrapper binding	expression
     */
    buildActionWrapper: function (oAction, oThis) {
      const aParams = [ref("$event"), oAction.handlerModule, oAction.handlerMethod];
      if (oThis && oThis.id) {
        const oAdditionalParams = {
          contexts: ref("${internal>selectedContexts}")
        };
        aParams.push(oAdditionalParams);
      }
      return compileExpression(fn("FPM.actionWrapper", aParams));
    },
    /**
     * Returns the value whether or not the element should be visible depending on the Hidden annotation.
     * It is inverted as the UI elements have a visible property instead of a hidden one.
     *
     * @param dataFieldAnnotations The dataField object
     * @returns A path or a Boolean
     */
    getHiddenPathExpression: function (dataFieldAnnotations) {
      if (dataFieldAnnotations["@com.sap.vocabularies.UI.v1.Hidden"] !== null) {
        const hidden = dataFieldAnnotations["@com.sap.vocabularies.UI.v1.Hidden"];
        return typeof hidden === "object" ? "{= !${" + hidden.$Path + "} }" : !hidden;
      }
      return true;
    },
    validatePresentationMetaPath: function (metaPath, objectTerm) {
      // perform validation only if annotation set (to avoid backwards compatibility issues for test without annotations)
      if (metaPath.includes(objectTerm.slice(0, objectTerm.lastIndexOf(".")))) {
        const allowedTerms = ["com.sap.vocabularies.UI.v1.PresentationVariant", "com.sap.vocabularies.UI.v1.SelectionPresentationVariant", objectTerm];
        if (!allowedTerms.some(term => {
          return metaPath.search(new RegExp(`${term}(#|/|$)`)) > -1;
        })) {
          throw new Error(`Annotation Path ${metaPath} mentioned in the manifest is not valid for ${objectTerm}`);
        }
      }
    }
  };
  CommonHelper.getSortConditions.requiresIContext = true;
  return CommonHelper;
}, false);
