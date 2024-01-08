import Log from "sap/base/Log";
import type AppComponent from "sap/fe/core/AppComponent";
import CommonUtils from "sap/fe/core/CommonUtils";
import type { FormElement } from "sap/fe/core/converters/controls/Common/Form";
import { KeyHelper } from "sap/fe/core/converters/helpers/Key";
import { UI } from "sap/fe/core/helpers/BindingHelper";
import type { BindingToolkitExpression } from "sap/fe/core/helpers/BindingToolkit";
import { compileExpression, constant, equal, ifElse, or } from "sap/fe/core/helpers/BindingToolkit";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { isRequiredExpression } from "sap/fe/core/templating/FieldControlHelper";
import { getAlignmentExpression } from "sap/fe/core/templating/UIFormatters";
import CommonHelper from "sap/fe/macros/CommonHelper";
import type { ValueHelpPayload } from "sap/fe/macros/internal/valuehelp/ValueListHelper";
import ValueListHelper from "sap/fe/macros/internal/valuehelp/ValueListHelper";
import ManagedObject from "sap/ui/base/ManagedObject";
import type BaseContext from "sap/ui/model/Context";
import AnnotationHelper from "sap/ui/model/odata/v4/AnnotationHelper";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";

const ISOCurrency = "@Org.OData.Measures.V1.ISOCurrency",
	Unit = "@Org.OData.Measures.V1.Unit";

const FieldHelper = {
	isNotAlwaysHidden: function (oDataField: any, oDetails: any) {
		// this is used in HeaderDataPointTitle.fragment
		const oContext = oDetails.context;
		let isAlwaysHidden: any = false;
		if (oDataField.Value && oDataField.Value.$Path) {
			isAlwaysHidden = oContext.getObject("Value/$Path@com.sap.vocabularies.UI.v1.Hidden");
		}
		if (!isAlwaysHidden || isAlwaysHidden.$Path) {
			isAlwaysHidden = oContext.getObject("@com.sap.vocabularies.UI.v1.Hidden");
			if (!isAlwaysHidden || isAlwaysHidden.$Path) {
				isAlwaysHidden = false;
			}
		}
		return !isAlwaysHidden;
	},
	isRequired: function (oFieldControl: any, sEditMode: any) {
		// this is used in actionParameterDialog.fragment
		if (sEditMode === "Display" || sEditMode === "ReadOnly" || sEditMode === "Disabled") {
			return false;
		}
		if (oFieldControl) {
			if ((ManagedObject as any).bindingParser(oFieldControl)) {
				return "{= %" + oFieldControl + " === 7}";
			} else {
				return oFieldControl == "com.sap.vocabularies.Common.v1.FieldControlType/Mandatory";
			}
		}
		return false;
	},

	getActionParameterVisibility: function (oParam: any, oContext: any) {
		// To use the UI.Hidden annotation for controlling visibility the value needs to be negated
		if (typeof oParam === "object") {
			if (oParam && oParam.$If && oParam.$If.length === 3) {
				// In case the UI.Hidden contains a dynamic expression we do this
				// by just switching the "then" and "else" part of the erpression
				// oParam.$If[0] <== Condition part
				// oParam.$If[1] <== Then part
				// oParam.$If[2] <== Else part
				const oNegParam: any = { $If: [] };
				oNegParam.$If[0] = oParam.$If[0];
				oNegParam.$If[1] = oParam.$If[2];
				oNegParam.$If[2] = oParam.$If[1];
				return AnnotationHelper.value(oNegParam, oContext);
			} else {
				return "{= !%{" + oParam.$Path + "} }";
			}
		} else if (typeof oParam === "boolean") {
			return AnnotationHelper.value(!oParam, oContext);
		} else {
			return undefined;
		}
	},

	/**
	 * Computed annotation that returns vProperty for a string and @sapui.name for an object.
	 *
	 * @param vProperty The property
	 * @param oInterface The interface instance
	 * @returns The property name
	 */
	propertyName: function (vProperty: any, oInterface: any) {
		let sPropertyName;
		if (typeof vProperty === "string") {
			if (oInterface.context.getPath().indexOf("$Path") > -1 || oInterface.context.getPath().indexOf("$PropertyPath") > -1) {
				// We could end up with a pure string property (no $Path), and this is not a real property in that case
				sPropertyName = vProperty;
			}
		} else if (vProperty.$Path || vProperty.$PropertyPath) {
			const sPath = vProperty.$Path ? "/$Path" : "/$PropertyPath";
			const sContextPath = oInterface.context.getPath();
			sPropertyName = oInterface.context.getObject(`${sContextPath + sPath}/$@sapui.name`);
		} else if (vProperty.Value && vProperty.Value.$Path) {
			sPropertyName = vProperty.Value.$Path;
		} else {
			sPropertyName = oInterface.context.getObject("@sapui.name");
		}

		return sPropertyName;
	},

	fieldControl: function (sPropertyPath: any, oInterface: any) {
		// editable header facet
		const oModel = oInterface && oInterface.context.getModel();
		const sPath = oInterface && oInterface.context.getPath();
		const oFieldControlContext = oModel && oModel.createBindingContext(`${sPath}@com.sap.vocabularies.Common.v1.FieldControl`);
		const oFieldControl = oFieldControlContext && oFieldControlContext.getProperty();
		if (oFieldControl) {
			if (oFieldControl.hasOwnProperty("$EnumMember")) {
				return oFieldControl.$EnumMember;
			} else if (oFieldControl.hasOwnProperty("$Path")) {
				return AnnotationHelper.value(oFieldControl, { context: oFieldControlContext });
			}
		} else {
			return undefined;
		}
	},

	/**
	 * Method to get the value help property from a DataField or a PropertyPath (in case a SelectionField is used)
	 * Priority from where to get the property value of the field (examples are "Name" and "Supplier"):
	 * 1. If oPropertyContext.getObject() has key '$Path', then we take the value at '$Path'.
	 * 2. Else, value at oPropertyContext.getObject().
	 * If there is an ISOCurrency or if there are Unit annotations for the field property,
	 * then the Path at the ISOCurrency or Unit annotations of the field property is considered.
	 *
	 * @memberof sap.fe.macros.field.FieldHelper.js
	 * @param oPropertyContext The context from which value help property need to be extracted.
	 * @param bInFilterField Whether or not we're in the filter field and should ignore
	 * @returns The value help property path
	 */
	valueHelpProperty: function (oPropertyContext: BaseContext, bInFilterField?: boolean) {
		/* For currency (and later Unit) we need to forward the value help to the annotated field */
		const sContextPath = oPropertyContext.getPath();
		const oContent = oPropertyContext.getObject() || {};
		let sPath = oContent.$Path ? `${sContextPath}/$Path` : sContextPath;
		const sAnnoPath = `${sPath}@`;
		const oPropertyAnnotations = oPropertyContext.getObject(sAnnoPath);
		let sAnnotation;
		if (oPropertyAnnotations) {
			sAnnotation =
				(oPropertyAnnotations.hasOwnProperty(ISOCurrency) && ISOCurrency) || (oPropertyAnnotations.hasOwnProperty(Unit) && Unit);
			if (sAnnotation && !bInFilterField) {
				const sUnitOrCurrencyPath = `${sPath + sAnnotation}/$Path`;
				// we check that the currency or unit is a Property and not a fixed value
				if (oPropertyContext.getObject(sUnitOrCurrencyPath)) {
					sPath = sUnitOrCurrencyPath;
				}
			}
		}
		return sPath;
	},

	/**
	 * Dedicated method to avoid looking for unit properties.
	 *
	 * @param oPropertyContext
	 * @returns The value help property path
	 */
	valueHelpPropertyForFilterField: function (oPropertyContext: any) {
		return FieldHelper.valueHelpProperty(oPropertyContext, true);
	},

	/**
	 * Method to generate the ID for Value Help.
	 *
	 * @function
	 * @name getIDForFieldValueHelp
	 * @memberof sap.fe.macros.field.FieldHelper.js
	 * @param sFlexId Flex ID of the current object
	 * @param sIdPrefix Prefix for the ValueHelp ID
	 * @param sOriginalPropertyName Name of the property
	 * @param sPropertyName Name of the ValueHelp Property
	 * @returns The ID generated for the ValueHelp
	 */
	getIDForFieldValueHelp: function (sFlexId: string | null, sIdPrefix: string, sOriginalPropertyName: string, sPropertyName: string) {
		if (sFlexId) {
			return sFlexId;
		}
		let sProperty = sPropertyName;
		if (sOriginalPropertyName !== sPropertyName) {
			sProperty = `${sOriginalPropertyName}::${sPropertyName}`;
		}
		return generate([sIdPrefix, sProperty]);
	},

	/*
	 * Method to get the valueHelp property of the FilterField.
	 *
	 * @function
	 * @name getValueHelpPropertyForFilterField
	 * @memberof sap.fe.macros.field.FieldHelper.js
	 * @param propertyContext Property context for filter field
	 * @param oProperty The object of the ValueHelp property
	 * @param sPropertyType The $Type of the property
	 * @param sVhIdPrefix The ID prefix of the value help
	 * @param sPropertyName The name of the property
	 * @param sValueHelpPropertyName The property name of the value help
	 * @param bHasValueListWithFixedValues `true` if there is a value list with a fixed value annotation
	 * @param bUseSemanticDateRange `true` if the semantic date range is set to 'true' in the manifest
	 * @returns The field help property of the value help
	 */
	getValueHelpPropertyForFilterField: function (
		propertyContext: BaseContext,
		oProperty: any,
		sPropertyType: string,
		sVhIdPrefix: string,
		sPropertyName: string,
		sValueHelpPropertyName: string,
		bHasValueListWithFixedValues: boolean,
		bUseSemanticDateRange: boolean | string
	): string | undefined {
		const sProperty = FieldHelper.propertyName(oProperty, { context: propertyContext }),
			bSemanticDateRange = bUseSemanticDateRange === "true" || bUseSemanticDateRange === true;
		const oModel = propertyContext.getModel() as ODataMetaModel,
			sPropertyPath = propertyContext.getPath(),
			sPropertyLocationPath = CommonHelper.getLocationForPropertyPath(oModel, sPropertyPath),
			oFilterRestrictions = CommonUtils.getFilterRestrictionsByPath(sPropertyLocationPath, oModel);
		if (
			((sPropertyType === "Edm.DateTimeOffset" || sPropertyType === "Edm.Date") &&
				bSemanticDateRange &&
				oFilterRestrictions &&
				oFilterRestrictions.FilterAllowedExpressions &&
				oFilterRestrictions.FilterAllowedExpressions[sProperty] &&
				(oFilterRestrictions.FilterAllowedExpressions[sProperty].includes("SingleRange") ||
					oFilterRestrictions.FilterAllowedExpressions[sProperty].includes("SingleValue"))) ||
			(sPropertyType === "Edm.Boolean" && !bHasValueListWithFixedValues)
		) {
			return undefined;
		}
		return FieldHelper.getIDForFieldValueHelp(null, sVhIdPrefix || "FilterFieldValueHelp", sPropertyName, sValueHelpPropertyName);
	},

	/*
	 * Method to compute the delegate with payload
	 * @function
	 * @param {object} delegateName - name of the delegate methode
	 * @param {boolean} retrieveTextFromValueList - added to the payload of the delegate methode
	 * @return {object} - returns the delegate with payload
	 */
	computeFieldBaseDelegate: function (delegateName: string, retrieveTextFromValueList: boolean) {
		if (retrieveTextFromValueList) {
			return JSON.stringify({
				name: delegateName,
				payload: {
					retrieveTextFromValueList: retrieveTextFromValueList
				}
			});
		}
		return `{name: '${delegateName}'}`;
	},
	_getPrimaryIntents: function (aSemanticObjectsList: any[]): Promise<any[]> {
		const aPromises: any[] = [];
		if (aSemanticObjectsList) {
			const oUshellContainer = sap.ushell && sap.ushell.Container;
			const oService = oUshellContainer && oUshellContainer.getService("CrossApplicationNavigation");
			aSemanticObjectsList.forEach(function (semObject) {
				if (typeof semObject === "string") {
					aPromises.push(oService.getPrimaryIntent(semObject, {}));
				}
			});
		}
		return Promise.all(aPromises)
			.then(function (aSemObjectPrimaryAction) {
				return aSemObjectPrimaryAction;
			})
			.catch(function (oError) {
				Log.error("Error fetching primary intents", oError);
				return [];
			});
	},
	_checkIfSemanticObjectsHasPrimaryAction: function (
		oSemantics: any,
		aSemanticObjectsPrimaryActions: any,
		appComponent: AppComponent
	): boolean {
		const _fnIsSemanticObjectActionUnavailable = function (_oSemantics: any, _oPrimaryAction: any, _index: string) {
			for (const unavailableActionsIndex in _oSemantics.semanticObjectUnavailableActions[_index].actions) {
				if (
					_oPrimaryAction.intent
						.split("-")[1]
						.indexOf(_oSemantics.semanticObjectUnavailableActions[_index].actions[unavailableActionsIndex]) === 0
				) {
					return false;
				}
			}
			return true;
		};

		oSemantics.semanticPrimaryActions = aSemanticObjectsPrimaryActions;
		const oPrimaryAction =
			oSemantics.semanticObjects &&
			oSemantics.mainSemanticObject &&
			oSemantics.semanticPrimaryActions[oSemantics.semanticObjects.indexOf(oSemantics.mainSemanticObject)];
		const sCurrentHash = appComponent.getShellServices().getHash();
		if (oSemantics.mainSemanticObject && !!oPrimaryAction && oPrimaryAction.intent !== sCurrentHash) {
			for (const index in oSemantics.semanticObjectUnavailableActions) {
				if (oSemantics.mainSemanticObject.indexOf(oSemantics.semanticObjectUnavailableActions[index].semanticObject) === 0) {
					return _fnIsSemanticObjectActionUnavailable(oSemantics, oPrimaryAction, index);
				}
			}
			return true;
		} else {
			return false;
		}
	},
	checkPrimaryActions: function (oSemantics: any, bGetTitleLink: boolean, appComponent: AppComponent) {
		return this._getPrimaryIntents(oSemantics && oSemantics.semanticObjects)
			.then((aSemanticObjectsPrimaryActions: any[]) => {
				return bGetTitleLink
					? {
							titleLink: aSemanticObjectsPrimaryActions,
							hasTitleLink: this._checkIfSemanticObjectsHasPrimaryAction(
								oSemantics,
								aSemanticObjectsPrimaryActions,
								appComponent
							),
							payload: oSemantics
					  }
					: this._checkIfSemanticObjectsHasPrimaryAction(oSemantics, aSemanticObjectsPrimaryActions, appComponent);
			})
			.catch(function (oError) {
				Log.error("Error in checkPrimaryActions", oError);
			});
	},
	_getTitleLinkWithParameters: function (_oSemanticObjectModel: any, _linkIntent: string) {
		if (_oSemanticObjectModel && _oSemanticObjectModel.titlelink) {
			return _oSemanticObjectModel.titlelink;
		} else {
			return _linkIntent;
		}
	},

	getPrimaryAction: function (oSemantics: any) {
		return oSemantics.semanticPrimaryActions[oSemantics.semanticObjects.indexOf(oSemantics.mainSemanticObject)].intent
			? FieldHelper._getTitleLinkWithParameters(
					oSemantics,
					oSemantics.semanticPrimaryActions[oSemantics.semanticObjects.indexOf(oSemantics.mainSemanticObject)].intent
			  )
			: oSemantics.primaryIntentAction;
	},
	/**
	 * Method to fetch the filter restrictions. Filter restrictions can be annotated on an entity set or a navigation property.
	 * Depending on the path to which the control is bound, we check for filter restrictions on the context path of the control,
	 * or on the navigation property (if there is a navigation).
	 * Eg. If the table is bound to '/EntitySet', for property path '/EntitySet/_Association/PropertyName', the filter restrictions
	 * on '/EntitySet' win over filter restrictions on '/EntitySet/_Association'.
	 * If the table is bound to '/EntitySet/_Association', the filter restrictions on '/EntitySet/_Association' win over filter
	 * retrictions on '/AssociationEntitySet'.
	 *
	 * @param oContext Property Context
	 * @param oProperty Property object in the metadata
	 * @param bUseSemanticDateRange Boolean Suggests if semantic date range should be used
	 * @param sSettings Stringified object of the property settings
	 * @param contextPath Path to which the parent control (the table or the filter bar) is bound
	 * @returns String containing comma-separated list of operators for filtering
	 */
	operators: function (oContext: BaseContext, oProperty: any, bUseSemanticDateRange: boolean, sSettings: string, contextPath: string) {
		// this is used in FilterField.block
		if (!oProperty || !contextPath) {
			return undefined;
		}
		let operators: string[];
		const sProperty = FieldHelper.propertyName(oProperty, { context: oContext });
		const oModel = oContext.getModel() as ODataMetaModel,
			sPropertyPath = oContext.getPath(),
			sPropertyLocationPath = CommonHelper.getLocationForPropertyPath(oModel, sPropertyPath),
			propertyType = oProperty.$Type;

		if (propertyType === "Edm.Guid") {
			return CommonUtils.getOperatorsForGuidProperty();
		}

		// remove '/'
		contextPath = contextPath.slice(0, -1);
		const isTableBoundToNavigation: boolean = contextPath.lastIndexOf("/") > 0;
		const isNavigationPath: boolean =
			(isTableBoundToNavigation && contextPath !== sPropertyLocationPath) ||
			(!isTableBoundToNavigation && sPropertyLocationPath.lastIndexOf("/") > 0);
		const navigationPath: string =
			(isNavigationPath && sPropertyLocationPath.substr(sPropertyLocationPath.indexOf(contextPath) + contextPath.length + 1)) || "";
		const propertyPath: string = (isNavigationPath && navigationPath + "/" + sProperty) || sProperty;

		if (!isTableBoundToNavigation) {
			if (!isNavigationPath) {
				// /SalesOrderManage/ID
				operators = CommonUtils.getOperatorsForProperty(
					sProperty,
					sPropertyLocationPath,
					oModel,
					propertyType,
					bUseSemanticDateRange,
					sSettings
				);
			} else {
				// /SalesOrderManange/_Item/Material
				//let operators
				operators = CommonUtils.getOperatorsForProperty(
					propertyPath,
					contextPath,
					oModel,
					propertyType,
					bUseSemanticDateRange,
					sSettings
				);
				if (operators.length === 0) {
					operators = CommonUtils.getOperatorsForProperty(
						sProperty,
						sPropertyLocationPath,
						oModel,
						propertyType,
						bUseSemanticDateRange,
						sSettings
					);
				}
			}
		} else if (!isNavigationPath) {
			// /SalesOrderManage/_Item/Material
			operators = CommonUtils.getOperatorsForProperty(
				propertyPath,
				contextPath,
				oModel,
				propertyType,
				bUseSemanticDateRange,
				sSettings
			);
			if (operators.length === 0) {
				operators = CommonUtils.getOperatorsForProperty(
					sProperty,
					ModelHelper.getEntitySetPath(contextPath),
					oModel,
					propertyType,
					bUseSemanticDateRange,
					sSettings
				);
			}
			return operators?.length > 0 ? operators.toString() : undefined;
		} else {
			// /SalesOrderManage/_Item/_Association/PropertyName
			// This is currently not supported for tables
			operators = CommonUtils.getOperatorsForProperty(
				propertyPath,
				contextPath,
				oModel,
				propertyType,
				bUseSemanticDateRange,
				sSettings
			);
			if (operators.length === 0) {
				operators = CommonUtils.getOperatorsForProperty(
					propertyPath,
					ModelHelper.getEntitySetPath(contextPath),
					oModel,
					propertyType,
					bUseSemanticDateRange,
					sSettings
				);
			}
		}

		if ((!operators || operators.length === 0) && (propertyType === "Edm.Date" || propertyType === "Edm.DateTimeOffset")) {
			operators = CommonUtils.getOperatorsForDateProperty(propertyType);
		}

		return operators.length > 0 ? operators.toString() : undefined;
	},
	/**
	 * Return the path of the DaFieldDefault (if any). Otherwise, the DataField path is returned.
	 *
	 * @param oDataFieldContext Context of the DataField
	 * @returns Object path
	 */
	getDataFieldDefault: function (oDataFieldContext: any) {
		// this is used in column.fragment
		const oDataFieldDefault = oDataFieldContext
			.getModel()
			.getObject(`${oDataFieldContext.getPath()}@com.sap.vocabularies.UI.v1.DataFieldDefault`);
		return oDataFieldDefault
			? `${oDataFieldContext.getPath()}@com.sap.vocabularies.UI.v1.DataFieldDefault`
			: oDataFieldContext.getPath();
	},
	/*
	 * Method to get visible expression for DataFieldActionButton
	 * @function
	 * @name isDataFieldActionButtonVisible
	 * @param {object} oThis - Current Object
	 * @param {object} oDataField - DataPoint's Value
	 * @param {boolean} bIsBound - DataPoint action bound
	 * @param {object} oActionContext - ActionContext Value
	 * @return {boolean} - returns boolean
	 */
	isDataFieldActionButtonVisible: function (oThis: any, oDataField: any, bIsBound: any, oActionContext: any) {
		return oDataField["@com.sap.vocabularies.UI.v1.Hidden"] !== true && (bIsBound !== true || oActionContext !== false);
	},
	/**
	 * Method to get press event for DataFieldActionButton.
	 *
	 * @function
	 * @name getPressEventForDataFieldActionButton
	 * @param oThis Current Object
	 * @param oDataField DataPoint's Value
	 * @returns The binding expression for the DataFieldActionButton press event
	 */
	getPressEventForDataFieldActionButton: function (oThis: any, oDataField: any) {
		let sInvocationGrouping = "Isolated";
		if (
			oDataField.InvocationGrouping &&
			oDataField.InvocationGrouping.$EnumMember === "com.sap.vocabularies.UI.v1.OperationGroupingType/ChangeSet"
		) {
			sInvocationGrouping = "ChangeSet";
		}
		let bIsNavigable = oThis.navigateAfterAction;
		bIsNavigable = bIsNavigable === "false" ? false : true;

		const entities: Array<string> = oThis?.entitySet?.getPath().split("/");
		const entitySetName: string = entities[entities.length - 1];

		const oParams = {
			contexts: "${$source>/}.getBindingContext()",
			invocationGrouping: CommonHelper.addSingleQuotes(sInvocationGrouping),
			model: "${$source>/}.getModel()",
			label: CommonHelper.addSingleQuotes(oDataField.Label, true),
			isNavigable: bIsNavigable,
			entitySetName: CommonHelper.addSingleQuotes(entitySetName)
		};

		return CommonHelper.generateFunction(
			".editFlow.invokeAction",
			CommonHelper.addSingleQuotes(oDataField.Action),
			CommonHelper.objectToString(oParams)
		);
	},

	isNumericDataType: function (sDataFieldType: any) {
		const _sDataFieldType = sDataFieldType;
		if (_sDataFieldType !== undefined) {
			const aNumericDataTypes = [
				"Edm.Int16",
				"Edm.Int32",
				"Edm.Int64",
				"Edm.Byte",
				"Edm.SByte",
				"Edm.Single",
				"Edm.Decimal",
				"Edm.Double"
			];
			return !aNumericDataTypes.includes(_sDataFieldType) ? false : true;
		} else {
			return false;
		}
	},

	isDateOrTimeDataType: function (sPropertyType: any) {
		if (sPropertyType !== undefined) {
			const aDateTimeDataTypes = ["Edm.DateTimeOffset", "Edm.DateTime", "Edm.Date", "Edm.TimeOfDay", "Edm.Time"];
			return aDateTimeDataTypes.includes(sPropertyType);
		} else {
			return false;
		}
	},
	isDateTimeDataType: function (sPropertyType: any) {
		if (sPropertyType !== undefined) {
			const aDateDataTypes = ["Edm.DateTimeOffset", "Edm.DateTime"];
			return aDateDataTypes.includes(sPropertyType);
		} else {
			return false;
		}
	},
	isDateDataType: function (sPropertyType: any) {
		return sPropertyType === "Edm.Date";
	},
	isTimeDataType: function (sPropertyType: any) {
		if (sPropertyType !== undefined) {
			const aDateDataTypes = ["Edm.TimeOfDay", "Edm.Time"];
			return aDateDataTypes.includes(sPropertyType);
		} else {
			return false;
		}
	},

	/**
	 * To display a text arrangement showing text and id, we need a string field on the UI.
	 *
	 * @param oAnnotations All the annotations of a property
	 * @param sType The property data type
	 * @returns The type to be used on the UI for the alignment
	 * @private
	 */
	getDataTypeForVisualization: function (oAnnotations: any, sType: string) {
		const sTextAnnotation = "@com.sap.vocabularies.Common.v1.Text",
			sTextArrangementAnnotation = "@com.sap.vocabularies.Common.v1.Text@com.sap.vocabularies.UI.v1.TextArrangement";

		/*
		  In case of TextSeparate, the returned is used for the filed itself only showing
		   the value of the original property, thus also the type of the property needs to be used.
		  In case of TextOnly, we consider it to be Edm.String according to the definition
		   in the vocabulary, even if it's not.
		  In other cases, we return Edm.String, as the value is build using a text template.
		 */
		return oAnnotations?.[sTextArrangementAnnotation]?.$EnumMember !== "com.sap.vocabularies.UI.v1.TextArrangementType/TextSeparate" &&
			oAnnotations?.[sTextAnnotation]?.$Path
			? "Edm.String"
			: sType;
	},

	getColumnAlignment: function (oDataField: any, oTable: any) {
		const sEntityPath = oTable.collection.sPath,
			oModel = oTable.collection.oModel;
		if (
			(oDataField["$Type"] === "com.sap.vocabularies.UI.v1.DataFieldForAction" ||
				oDataField["$Type"] === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") &&
			oDataField.Inline &&
			oDataField.IconUrl
		) {
			return "Center";
		}
		// Columns containing a Semantic Key must be Begin aligned
		const aSemanticKeys = oModel.getObject(`${sEntityPath}/@com.sap.vocabularies.Common.v1.SemanticKey`);
		if (oDataField["$Type"] === "com.sap.vocabularies.UI.v1.DataField") {
			const sPropertyPath = oDataField.Value.$Path;
			const bIsSemanticKey =
				aSemanticKeys &&
				!aSemanticKeys.every(function (oKey: any) {
					return oKey.$PropertyPath !== sPropertyPath;
				});
			if (bIsSemanticKey) {
				return "Begin";
			}
		}
		return FieldHelper.getDataFieldAlignment(oDataField, oModel, sEntityPath);
	},
	/**
	 * Get alignment based only on the property.
	 *
	 * @param sType The property's type
	 * @param oFormatOptions The field format options
	 * @param [oComputedEditMode] The computed Edit mode of the property is empty when directly called from the ColumnProperty fragment
	 * @returns The property alignment
	 */
	getPropertyAlignment: function (sType: string, oFormatOptions: any, oComputedEditMode?: BindingToolkitExpression<string>) {
		let sDefaultAlignment = "Begin" as any;
		const sTextAlignment = oFormatOptions ? oFormatOptions.textAlignMode : "";
		switch (sTextAlignment) {
			case "Form":
				if (this.isNumericDataType(sType)) {
					sDefaultAlignment = "Begin";
					if (oComputedEditMode) {
						sDefaultAlignment = getAlignmentExpression(oComputedEditMode, "Begin", "End");
					}
				}
				break;
			default:
				if (this.isNumericDataType(sType) || this.isDateOrTimeDataType(sType)) {
					sDefaultAlignment = "Right";
				}
				break;
		}
		return sDefaultAlignment;
	},

	getDataFieldAlignment: function (oDataField: any, oModel: any, sEntityPath: any, oFormatOptions?: any, oComputedEditMode?: any) {
		let sDataFieldPath,
			sDefaultAlignment = "Begin",
			sType,
			oAnnotations;

		if (oDataField["$Type"] === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {
			sDataFieldPath = oDataField.Target.$AnnotationPath;
			if (
				oDataField.Target["$AnnotationPath"] &&
				oDataField.Target["$AnnotationPath"].indexOf("com.sap.vocabularies.UI.v1.FieldGroup") >= 0
			) {
				const oFieldGroup = oModel.getObject(`${sEntityPath}/${sDataFieldPath}`);

				for (let i = 0; i < oFieldGroup.Data.length; i++) {
					sType = oModel.getObject(`${sEntityPath}/${sDataFieldPath}/Data/${i.toString()}/Value/$Path/$Type`);
					oAnnotations = oModel.getObject(`${sEntityPath}/${sDataFieldPath}/Data/${i.toString()}/Value/$Path@`);
					sType = this.getDataTypeForVisualization(oAnnotations, sType);
					sDefaultAlignment = this.getPropertyAlignment(sType, oFormatOptions, oComputedEditMode);

					if (sDefaultAlignment === "Begin") {
						break;
					}
				}
				return sDefaultAlignment;
			} else if (
				oDataField.Target["$AnnotationPath"] &&
				oDataField.Target["$AnnotationPath"].indexOf("com.sap.vocabularies.UI.v1.DataPoint") >= 0 &&
				oModel.getObject(`${sEntityPath}/${sDataFieldPath}/Visualization/$EnumMember`) ===
					"com.sap.vocabularies.UI.v1.VisualizationType/Rating"
			) {
				return sDefaultAlignment;
			} else {
				sType = oModel.getObject(`${sEntityPath}/${sDataFieldPath}/$Type`);
				if (sType === "com.sap.vocabularies.UI.v1.DataPointType") {
					sType = oModel.getObject(`${sEntityPath}/${sDataFieldPath}/Value/$Path/$Type`);
					oAnnotations = oModel.getObject(`${sEntityPath}/${sDataFieldPath}/Value/$Path@`);
					sType = this.getDataTypeForVisualization(oAnnotations, sType);
				}
				sDefaultAlignment = this.getPropertyAlignment(sType, oFormatOptions, oComputedEditMode);
			}
		} else {
			sDataFieldPath = oDataField.Value.$Path;
			sType = oModel.getObject(`${sEntityPath}/${sDataFieldPath}/$Type`);
			oAnnotations = oModel.getObject(`${sEntityPath}/${sDataFieldPath}@`);
			sType = this.getDataTypeForVisualization(oAnnotations, sType);
			if (!(oModel.getObject(`${sEntityPath}/`)["$Key"].indexOf(sDataFieldPath) === 0)) {
				sDefaultAlignment = this.getPropertyAlignment(sType, oFormatOptions, oComputedEditMode);
			}
		}
		return sDefaultAlignment;
	},

	/**
	 * Method to get enabled expression for DataFieldActionButton.
	 *
	 * @function
	 * @name isDataFieldActionButtonEnabled
	 * @param oDataField DataPoint's Value
	 * @param bIsBound DataPoint action bound
	 * @param oActionContext ActionContext Value
	 * @param sActionContextFormat Formatted value of ActionContext
	 * @returns A boolean or string expression for enabled property
	 */
	isDataFieldActionButtonEnabled: function (oDataField: any, bIsBound: boolean, oActionContext: any, sActionContextFormat: string) {
		if (bIsBound !== true) {
			return "true";
		}
		return (oActionContext === null ? "{= !${#" + oDataField.Action + "} ? false : true }" : oActionContext)
			? sActionContextFormat
			: "true";
	},

	/**
	 * Method to compute the label for a DataField.
	 * If the DataField's label is an empty string, it's not rendered even if a fallback exists.
	 *
	 * @function
	 * @name computeLabelText
	 * @param {object} oDataField The DataField being processed
	 * @param {object} oInterface The interface for context instance
	 * @returns {string} The computed text for the DataField label.
	 */

	computeLabelText: function (oDataField: any, oInterface: any) {
		const oModel = oInterface.context.getModel();
		let sContextPath = oInterface.context.getPath();
		if (sContextPath.endsWith("/")) {
			sContextPath = sContextPath.slice(0, sContextPath.lastIndexOf("/"));
		}
		const sDataFieldLabel = oModel.getObject(`${sContextPath}/Label`);
		//We do not show an additional label text for a button:
		if (
			oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" ||
			oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation"
		) {
			return undefined;
		}
		if (sDataFieldLabel) {
			return sDataFieldLabel;
		} else if (sDataFieldLabel === "") {
			return "";
		}
		let sDataFieldTargetTitle;
		if (oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {
			if (
				oDataField.Target.$AnnotationPath.indexOf("@com.sap.vocabularies.UI.v1.DataPoint") > -1 ||
				oDataField.Target.$AnnotationPath.indexOf("@com.sap.vocabularies.UI.v1.Chart") > -1
			) {
				sDataFieldTargetTitle = oModel.getObject(`${sContextPath}/Target/$AnnotationPath@/Title`);
			}
			if (oDataField.Target.$AnnotationPath.indexOf("@com.sap.vocabularies.Communication.v1.Contact") > -1) {
				sDataFieldTargetTitle = oModel.getObject(
					`${sContextPath}/Target/$AnnotationPath@/fn/$Path@com.sap.vocabularies.Common.v1.Label`
				);
			}
		}
		if (sDataFieldTargetTitle) {
			return sDataFieldTargetTitle;
		}
		let sDataFieldTargetLabel;
		if (oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {
			sDataFieldTargetLabel = oModel.getObject(`${sContextPath}/Target/$AnnotationPath@/Label`);
		}
		if (sDataFieldTargetLabel) {
			return sDataFieldTargetLabel;
		}

		const sDataFieldValueLabel = oModel.getObject(`${sContextPath}/Value/$Path@com.sap.vocabularies.Common.v1.Label`);
		if (sDataFieldValueLabel) {
			return sDataFieldValueLabel;
		}

		let sDataFieldTargetValueLabel;
		if (oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {
			sDataFieldTargetValueLabel = oModel.getObject(
				`${sContextPath}/Target/$AnnotationPath/Value/$Path@com.sap.vocabularies.Common.v1.Label`
			);
		}
		if (sDataFieldTargetValueLabel) {
			return sDataFieldTargetValueLabel;
		}
		return "";
	},
	/**
	 * Method to align the data fields with their label.
	 *
	 * @function
	 * @name buildExpressionForAlignItems
	 * @param sVisualization
	 * @returns Expression binding for alignItems property
	 */
	buildExpressionForAlignItems: function (sVisualization: string) {
		const fieldVisualizationBindingExpression = constant(sVisualization);
		const progressVisualizationBindingExpression = constant("com.sap.vocabularies.UI.v1.VisualizationType/Progress");
		const ratingVisualizationBindingExpression = constant("com.sap.vocabularies.UI.v1.VisualizationType/Rating");
		return compileExpression(
			ifElse(
				or(
					equal(fieldVisualizationBindingExpression, progressVisualizationBindingExpression),
					equal(fieldVisualizationBindingExpression, ratingVisualizationBindingExpression)
				),
				constant("Center"),
				ifElse(UI.IsEditable, constant("Center"), constant("Stretch"))
			)
		);
	},

	/**
	 * Method to check ValueListReferences, ValueListMapping and ValueList inside ActionParameters for ValueHelp.
	 *
	 * @function
	 * @name hasValueHelp
	 * @param oPropertyAnnotations Action parameter object
	 * @returns `true` if there is a ValueList* annotation defined
	 */
	hasValueHelpAnnotation: function (oPropertyAnnotations: any) {
		if (oPropertyAnnotations) {
			return !!(
				oPropertyAnnotations["@com.sap.vocabularies.Common.v1.ValueListReferences"] ||
				oPropertyAnnotations["@com.sap.vocabularies.Common.v1.ValueListMapping"] ||
				oPropertyAnnotations["@com.sap.vocabularies.Common.v1.ValueList"]
			);
		}
		return false;
	},
	/**
	 * Method to get display property for ActionParameter dialog.
	 *
	 * 	@function
	 * @name getAPDialogDisplayFormat
	 * @param oProperty The action parameter instance
	 * @param oInterface The interface for the context instance
	 * @returns The display format  for an action parameter Field
	 */
	getAPDialogDisplayFormat: function (oProperty: any, oInterface: any) {
		let oAnnotation;
		const oModel = oInterface.context.getModel();
		const sContextPath = oInterface.context.getPath();
		const sPropertyName = oProperty.$Name || oInterface.context.getProperty(`${sContextPath}@sapui.name`);
		const oActionParameterAnnotations = oModel.getObject(`${sContextPath}@`);
		const oValueHelpAnnotation =
			oActionParameterAnnotations["@com.sap.vocabularies.Common.v1.ValueList"] ||
			oActionParameterAnnotations["@com.sap.vocabularies.Common.v1.ValueListMapping"] ||
			oActionParameterAnnotations["@com.sap.vocabularies.Common.v1.ValueListReferences"];
		const getValueListPropertyName = function (oValueList: any) {
			const oValueListParameter = oValueList.Parameters.find(function (oParameter: any) {
				return oParameter.LocalDataProperty && oParameter.LocalDataProperty.$PropertyPath === sPropertyName;
			});
			return oValueListParameter && oValueListParameter.ValueListProperty;
		};
		let sValueListPropertyName;
		if (
			oActionParameterAnnotations["@com.sap.vocabularies.Common.v1.TextArrangement"] ||
			oActionParameterAnnotations["@com.sap.vocabularies.Common.v1.Text@com.sap.vocabularies.UI.v1.TextArrangement"]
		) {
			return CommonUtils.computeDisplayMode(oActionParameterAnnotations, undefined);
		} else if (oValueHelpAnnotation) {
			if (oValueHelpAnnotation.CollectionPath) {
				// get the name of the corresponding property in value list collection
				sValueListPropertyName = getValueListPropertyName(oValueHelpAnnotation);
				if (!sValueListPropertyName) {
					return "Value";
				}
				// get text for this property
				oAnnotation = oModel.getObject(`/${oValueHelpAnnotation.CollectionPath}/${sValueListPropertyName}@`);
				return oAnnotation && oAnnotation["@com.sap.vocabularies.Common.v1.Text"]
					? CommonUtils.computeDisplayMode(oAnnotation, undefined)
					: "Value";
			} else {
				return oModel.requestValueListInfo(sContextPath, true).then(function (oValueListInfo: any) {
					// get the name of the corresponding property in value list collection
					sValueListPropertyName = getValueListPropertyName(oValueListInfo[""]);
					if (!sValueListPropertyName) {
						return "Value";
					}
					// get text for this property
					oAnnotation = oValueListInfo[""].$model
						.getMetaModel()
						.getObject(`/${oValueListInfo[""]["CollectionPath"]}/${sValueListPropertyName}@`);
					return oAnnotation && oAnnotation["@com.sap.vocabularies.Common.v1.Text"]
						? CommonUtils.computeDisplayMode(oAnnotation, undefined)
						: "Value";
				});
			}
		} else {
			return "Value";
		}
	},
	/*
	 * Method to get display property for ActionParameter dialog ValueHelp.
	 *
	 * @function
	 * @name getActionParameterDialogValueHelp
	 * @param oActionParameter Action parameter object
	 * @param sSapUIName Action sapui name
	 * @param sParamName The parameter name
	 * @returns The ID of the fieldHelp used by this action parameter
	 */
	getActionParameterDialogValueHelp: function (oActionParameter: object, sSapUIName: string, sParamName: string): string | undefined {
		return this.hasValueHelpAnnotation(oActionParameter) ? generate([sSapUIName, sParamName]) : undefined;
	},
	/**
	 * Method to get the delegate configuration for ActionParameter dialog.
	 *
	 * @function
	 * @name getValueHelpDelegate
	 * @param isBound Action is bound
	 * @param entityTypePath The EntityType Path
	 * @param sapUIName The name of the Action
	 * @param paramName The name of the ActionParameter
	 * @returns The delegate configuration object as a string
	 */
	getValueHelpDelegate: function (isBound: boolean, entityTypePath: string, sapUIName: string, paramName: string) {
		const delegateConfiguration: { name: string; payload: ValueHelpPayload } = {
			name: CommonHelper.addSingleQuotes("sap/fe/macros/valuehelp/ValueHelpDelegate"),
			payload: {
				propertyPath: CommonHelper.addSingleQuotes(
					ValueListHelper.getPropertyPath({
						UnboundAction: !isBound,
						EntityTypePath: entityTypePath,
						Action: sapUIName,
						Property: paramName
					})
				),
				qualifiers: {},
				valueHelpQualifier: CommonHelper.addSingleQuotes(""),
				isActionParameterDialog: true
			}
		};
		return CommonHelper.objectToString(delegateConfiguration);
	},
	/**
	 * Method to get the delegate configuration for NonComputedVisibleKeyField dialog.
	 *
	 * @function
	 * @name getValueHelpDelegateForNonComputedVisibleKeyField
	 * @param propertyPath The current property path
	 * @returns The delegate configuration object as a string
	 */
	getValueHelpDelegateForNonComputedVisibleKeyField: function (propertyPath: string) {
		const delegateConfiguration: { name: string; payload: ValueHelpPayload } = {
			name: CommonHelper.addSingleQuotes("sap/fe/macros/valuehelp/ValueHelpDelegate"),
			payload: {
				propertyPath: CommonHelper.addSingleQuotes(propertyPath),
				qualifiers: {},
				valueHelpQualifier: CommonHelper.addSingleQuotes("")
			}
		};
		return CommonHelper.objectToString(delegateConfiguration);
	},

	/**
	 * Method to fetch entity from a path containing multiple associations.
	 *
	 * @function
	 * @name _getEntitySetFromMultiLevel
	 * @param oContext The context whose path is to be checked
	 * @param sPath The path from which entity has to be fetched
	 * @param sSourceEntity The entity path in which nav entity exists
	 * @param iStart The start index : beginning parts of the path to be ignored
	 * @param iDiff The diff index : end parts of the path to be ignored
	 * @returns The path of the entity set
	 */
	_getEntitySetFromMultiLevel: function (oContext: Context, sPath: string, sSourceEntity: string, iStart: any, iDiff: any) {
		let aNavParts = sPath.split("/").filter(Boolean);
		aNavParts = aNavParts.filter(function (sPart: string) {
			return sPart !== "$NavigationPropertyBinding";
		});
		if (aNavParts.length > 0) {
			for (let i = iStart; i < aNavParts.length - iDiff; i++) {
				sSourceEntity = `/${oContext.getObject(`${sSourceEntity}/$NavigationPropertyBinding/${aNavParts[i]}`)}`;
			}
		}
		return sSourceEntity;
	},

	/**
	 * When the value displayed is in text arrangement TextOnly we also want to retrieve the Text value for tables even if we don't show it.
	 * This method will return the value of the original data field.
	 *
	 * @param oThis The current object
	 * @param oDataFieldTextArrangement DataField using text arrangement annotation
	 * @param oDataField DataField containing the value using text arrangement annotation
	 * @returns The binding to the value
	 */
	getBindingInfoForTextArrangement: function (oThis: object, oDataFieldTextArrangement: any, oDataField: any) {
		// this is used in ColumnContent fragment
		if (
			oDataFieldTextArrangement &&
			oDataFieldTextArrangement.$EnumMember &&
			oDataFieldTextArrangement.$EnumMember === "com.sap.vocabularies.UI.v1.TextArrangementType/TextOnly" &&
			oDataField
		) {
			return `{${oDataField.Value.$Path}}`;
		}
		return undefined;
	},

	getPathForIconSource: function (sPropertyPath: any) {
		return "{= FIELDRUNTIME.getIconForMimeType(%{" + sPropertyPath + "@odata.mediaContentType})}";
	},
	getFilenameExpr: function (sFilename: any, sNoFilenameText: any) {
		if (sFilename) {
			if (sFilename.indexOf("{") === 0) {
				// filename is referenced via path, i.e. @Core.ContentDisposition.Filename : path
				return "{= $" + sFilename + " ? $" + sFilename + " : $" + sNoFilenameText + "}";
			}
			// static filename, i.e. @Core.ContentDisposition.Filename : 'someStaticName'
			return sFilename;
		}
		// no @Core.ContentDisposition.Filename
		return sNoFilenameText;
	},

	calculateMBfromByte: function (iByte: any) {
		return iByte ? (iByte / (1024 * 1024)).toFixed(6) : undefined;
	},
	getDownloadUrl: function (propertyPath: string) {
		return propertyPath + "{= ${internal>/stickySessionToken} ? ('?SAP-ContextId=' + ${internal>/stickySessionToken}) : '' }";
	},
	getMarginClass: function (compactSemanticKey: string | boolean | undefined) {
		return compactSemanticKey === "true" || compactSemanticKey === true ? "sapMTableContentMargin" : undefined;
	},
	getRequired: function (immutableKey: any, target: any, requiredProperties: any) {
		let targetRequiredExpression: any = constant(false);
		if (target !== null) {
			targetRequiredExpression = isRequiredExpression(target?.targetObject);
		}
		return compileExpression(or(targetRequiredExpression, requiredProperties.indexOf(immutableKey) > -1));
	},

	/**
	 * The method checks if the field is already part of a form.
	 *
	 * @param dataFieldCollection The list of the fields of the form
	 * @param dataFieldObjectPath The data model object path of the field which needs to be checked in the form
	 * @returns `true` if the field is already part of the form, `false` otherwise
	 */
	isFieldPartOfForm: function (dataFieldCollection: FormElement[], dataFieldObjectPath: DataModelObjectPath) {
		//generating key for the received data field
		const connectedDataFieldKey = KeyHelper.generateKeyFromDataField(dataFieldObjectPath.targetObject);
		// trying to find the generated key in already existing form elements
		const isFieldFound = dataFieldCollection.find((field) => {
			return field.key === connectedDataFieldKey;
		});
		return isFieldFound ? true : false;
	}
};
(FieldHelper.fieldControl as any).requiresIContext = true;
(FieldHelper.getAPDialogDisplayFormat as any).requiresIContext = true;
(FieldHelper.computeLabelText as any).requiresIContext = true;
(FieldHelper.getActionParameterVisibility as any).requiresIContext = true;

export default FieldHelper;
