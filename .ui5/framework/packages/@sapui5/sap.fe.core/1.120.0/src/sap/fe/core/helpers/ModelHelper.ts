/* This class contains helpers to be used at runtime to retrieve further information on the model */
import type { EntitySet, EntityType, Singleton } from "@sap-ux/vocabularies-types";
import type { DraftNode, DraftRoot } from "@sap-ux/vocabularies-types/vocabularies/Common";
import type { StickySessionSupported } from "@sap-ux/vocabularies-types/vocabularies/Session";
import type { DeleteHidden, UpdateHidden } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { FEView } from "sap/fe/core/BaseController";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { isEntitySet } from "sap/fe/core/helpers/TypeGuards";
import type Message from "sap/ui/core/message/Message";
import type BaseContext from "sap/ui/model/Context";

import BindingMode from "sap/ui/model/BindingMode";
import JSONModel from "sap/ui/model/json/JSONModel";
import type { default as Context, default as ODataV4Context } from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type ODataPropertyBinding from "sap/ui/model/odata/v4/ODataPropertyBinding";
import type { DataModelObjectPath } from "../templating/DataModelPathHelper";

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
	isStickySessionSupported: function (metaModel: ODataMetaModel) {
		const entityContainer = metaModel.getObject("/");
		for (const entitySetName in entityContainer) {
			if (
				entityContainer[entitySetName].$kind === "EntitySet" &&
				metaModel.getObject(`/${entitySetName}@com.sap.vocabularies.Session.v1.StickySessionSupported`)
			) {
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
	isDraftSupported: function (metaModel: ODataMetaModel, path: string) {
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
	isObjectPathDraftSupported: function (dataModelObjectPath: DataModelObjectPath): boolean {
		const currentEntitySet = dataModelObjectPath.targetEntitySet as EntitySet;
		const bIsDraftRoot = ModelHelper.isDraftRoot(currentEntitySet);
		const bIsDraftNode = ModelHelper.isDraftNode(currentEntitySet);
		const bIsDraftParentEntityForContainment =
			dataModelObjectPath.targetObject?.containsTarget &&
			((dataModelObjectPath.startingEntitySet as EntitySet)?.annotations?.Common?.DraftRoot ||
				(dataModelObjectPath.startingEntitySet as EntitySet)?.annotations?.Common?.DraftNode)
				? true
				: false;

		return bIsDraftRoot || bIsDraftNode || (!currentEntitySet && bIsDraftParentEntityForContainment);
	},

	/**
	 * Method to determine if the service, supports collaboration draft.
	 *
	 * @param metaObject MetaObject to be used for determination
	 * @param templateInterface API provided by UI5 templating if used
	 * @returns Returns true if the service supports collaboration draft, else false
	 */
	isCollaborationDraftSupported: function (metaObject: any, templateInterface?: any) {
		if (!this.disableCollaborationDraft) {
			const oMetaModel = (templateInterface?.context?.getModel() || metaObject) as ODataMetaModel;
			const oEntityContainer = oMetaModel.getObject("/");
			for (const sEntitySet in oEntityContainer) {
				if (
					oEntityContainer[sEntitySet].$kind === "EntitySet" &&
					oMetaModel.getObject(`/${sEntitySet}@com.sap.vocabularies.Common.v1.DraftRoot/ShareAction`)
				) {
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
	getDraftRootPath: function (oContext: Context): string | undefined {
		const oMetaModel = oContext.getModel().getMetaModel();
		const getRootPath = function (sPath: string, model: ODataModel, firstIteration = true): string | undefined {
			const sIterationPath = firstIteration ? sPath : new RegExp(/.*(?=\/)/).exec(sPath)?.[0]; // *Regex to get the ancestor
			if (sIterationPath && sIterationPath !== "/") {
				const sEntityPath = oMetaModel.getMetaPath(sIterationPath);
				const mDataModel = MetaModelConverter.getInvolvedDataModelObjects(oMetaModel.getContext(sEntityPath));
				if ((mDataModel.targetEntitySet as EntitySet)?.annotations.Common?.DraftRoot) {
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
	getStickyRootPath: function (oContext: Context): string | undefined {
		const oMetaModel = oContext.getModel().getMetaModel();
		const getRootPath = function (sPath: string, model: ODataModel, firstIteration = true): string | undefined {
			const sIterationPath = firstIteration ? sPath : new RegExp(/.*(?=\/)/).exec(sPath)?.[0]; // *Regex to get the ancestor
			if (sIterationPath && sIterationPath !== "/") {
				const sEntityPath = oMetaModel.getMetaPath(sIterationPath);
				const mDataModel = MetaModelConverter.getInvolvedDataModelObjects(oMetaModel.getContext(sEntityPath));
				if ((mDataModel.targetEntitySet as EntitySet)?.annotations?.Session?.StickySessionSupported) {
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
	getTargetEntitySet: function (oContext: BaseContext) {
		const sPath = oContext.getPath();
		if (
			oContext.getObject("$kind") === "EntitySet" ||
			oContext.getObject("$kind") === "Action" ||
			oContext.getObject("0/$kind") === "Action"
		) {
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
	getEntitySetPath: function (path: string, odataMetaModel?: ODataMetaModel) {
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

				const pathObject = pathParts.reduce((pathUnderConstruction: any, pathPart: string, idx: number) => {
					const delimiter = (!!idx && "/$NavigationPropertyBinding/") || "";
					let { growingPath, pendingNavPropBinding } = pathUnderConstruction;
					const tempPath = growingPath + delimiter;
					const navPropBindings = odataMetaModel.getObject(tempPath);
					const navPropBindingToCheck = pendingNavPropBinding ? `${pendingNavPropBinding}/${pathPart}` : pathPart;
					if (
						navPropBindings &&
						Object.keys(navPropBindings).length > 0 &&
						navPropBindings.hasOwnProperty(navPropBindingToCheck)
					) {
						growingPath = tempPath + navPropBindingToCheck.replace("/", "%2F");
						pendingNavPropBinding = "";
					} else {
						pendingNavPropBinding += pendingNavPropBinding ? `/${pathPart}` : pathPart;
					}
					return { growingPath, pendingNavPropBinding };
				}, initialPathObject as any);

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
	getActionParameterItemsModelPath: function (oParameter: any) {
		return oParameter && oParameter.$Name ? `{path: 'mvfview>/${oParameter.$Name}'}` : undefined;
	},

	filterOutNavPropBinding: function (sPathPart: any) {
		return sPathPart !== "" && sPathPart !== "$NavigationPropertyBinding";
	},

	/**
	 * Adds a setProperty to the created binding contexts of the internal JSON model.
	 *
	 * @param Internal JSON Model which is enhanced
	 */

	enhanceInternalJSONModel: function (oInternalModel: any) {
		const fnBindContext = oInternalModel.bindContext;
		oInternalModel.bindContext = function (sPath: any, oContext: any, mParameters: any, ...args: any[]) {
			oContext = fnBindContext.apply(this, [sPath, oContext, mParameters, ...args]);
			const fnGetBoundContext = oContext.getBoundContext;

			oContext.getBoundContext = function (...subArgs: any[]) {
				const oBoundContext = fnGetBoundContext.apply(this, ...subArgs);
				if (oBoundContext && !oBoundContext.setProperty) {
					oBoundContext.setProperty = function (propertyPath: string, value: unknown): void {
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

	enhanceUiJSONModel: function (uiModel: JSONModel, library: any) {
		const fnSetProperty = uiModel.setProperty as any;
		uiModel.setProperty = function (...args: any[]) {
			const value = args[1];
			if (args[0] === "/isEditable") {
				uiModel.setProperty("/editMode", value ? library.EditMode.Editable : library.EditMode.Display, args[2], args[3]);
			}
			return fnSetProperty.apply(this, [...args]);
		};
	},

	enhanceViewJSONModel: function (viewModel: JSONModel & { _getObject: Function }): void {
		const fnGetObject = viewModel._getObject;
		viewModel._getObject = function (sPath: string, oContext?: Context): unknown {
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
	isFilteringCaseSensitive: function (oMetaModel: any) {
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
	getMetaPathForContext: function (oContext: any) {
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
	getRootEntitySetPath: function (contextPath: string) {
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
	getAbsoluteMetaPathForListBinding: function (oView: FEView, vListBinding: ODataListBinding | string) {
		const oMetaModel = oView.getModel().getMetaModel();
		let sMetaPath;

		if (typeof vListBinding === "string") {
			if (vListBinding.startsWith("/")) {
				// absolute path
				sMetaPath = oMetaModel.getMetaPath(vListBinding);
			} else {
				// relative path
				const oBindingContext = oView.getBindingContext();
				const sRootContextPath = oBindingContext!.getPath();
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
				const sRootBindingPath = oRootBinding!.getPath();
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
	isDraftRoot: function (entitySet: EntitySet | Singleton | undefined): boolean {
		return this.getDraftRoot(entitySet) !== undefined;
	},

	/**
	 * Method to determine whether the argument is a draft node.
	 *
	 * @param entitySet EntitySet | Singleton | undefined
	 * @returns Whether the argument is a draft node
	 */
	isDraftNode: function (entitySet: EntitySet | Singleton | undefined): boolean {
		return this.getDraftNode(entitySet) !== undefined;
	},

	/**
	 * Method to determine whether the argument is a sticky session root.
	 *
	 * @param entitySet EntitySet | Singleton | undefined
	 * @returns Whether the argument is a sticky session root
	 */
	isSticky: function (entitySet: EntitySet | Singleton | undefined): boolean {
		return this.getStickySession(entitySet) !== undefined;
	},

	/**
	 * Method to determine if entity is updatable or not.
	 *
	 * @param entitySet EntitySet | Singleton | undefined
	 * @param entityType EntityType
	 * @returns True if updatable else false
	 */
	isUpdateHidden: function (entitySet: EntitySet | Singleton | undefined, entityType: EntityType): UpdateHidden | undefined {
		if (isEntitySet(entitySet)) {
			return entitySet.annotations.UI?.UpdateHidden ?? entityType?.annotations.UI?.UpdateHidden;
		}
	},
	/**
	 * Gets the @Common.DraftRoot annotation if the argument is an EntitySet.
	 *
	 * @param entitySet EntitySet | Singleton | undefined
	 * @returns DraftRoot
	 */
	getDraftRoot: function (entitySet: EntitySet | Singleton | undefined): DraftRoot | undefined {
		return isEntitySet(entitySet) ? entitySet.annotations.Common?.DraftRoot : undefined;
	},

	/**
	 * Gets the @Common.DraftNode annotation if the argument is an EntitySet.
	 *
	 * @param entitySet EntitySet | Singleton | undefined
	 * @returns DraftRoot
	 */
	getDraftNode: function (entitySet: EntitySet | Singleton | undefined): DraftNode | undefined {
		return isEntitySet(entitySet) ? entitySet.annotations.Common?.DraftNode : undefined;
	},

	/**
	 * Helper method to get sticky session.
	 *
	 * @param entitySet EntitySet | Singleton | undefined
	 * @returns Session StickySessionSupported
	 */
	getStickySession: function (entitySet: EntitySet | Singleton | undefined): StickySessionSupported | undefined {
		return isEntitySet(entitySet) ? entitySet.annotations.Session?.StickySessionSupported : undefined;
	},

	/**
	 * Method to get the visibility state of delete button.
	 *
	 * @param entitySet EntitySet | Singleton | undefined
	 * @param entityType EntityType
	 * @returns True if delete button is hidden
	 */
	getDeleteHidden: function (entitySet: EntitySet | Singleton | undefined, entityType: EntityType): DeleteHidden | undefined {
		if (isEntitySet(entitySet)) {
			return entitySet.annotations.UI?.DeleteHidden ?? entityType.annotations.UI?.DeleteHidden;
		}
	},
	/**
	 * This function will return metapath for the given list binding.
	 *
	 * @param listBinding ListBinding.
	 * @returns MetaPath
	 */
	getAbsolutePathFromListBinding(listBinding: ODataListBinding): string {
		const metamodel = listBinding.getModel().getMetaModel();
		let metaPath;
		const rootBinding = listBinding.getRootBinding();
		if (listBinding === rootBinding) {
			metaPath = metamodel.getMetaPath(listBinding.getPath());
		} else {
			const rootBindingPath = rootBinding?.getPath();
			const relativePath = listBinding.getPath();
			metaPath = metamodel.getMetaPath(`${rootBindingPath}/${relativePath}`);
		}
		return metaPath;
	},

	enhanceODataModel(odataModel: ODataModel): void {
		const fnMessage = odataModel.setMessages;
		const localAnnotationModel = new JSONModel({});
		localAnnotationModel.setDefaultBindingMode(BindingMode.OneWay);
		const baseSetProperty = localAnnotationModel.setProperty;
		localAnnotationModel.setProperty = function (path, value, context, asyncUpdate): boolean {
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
		function clearAnnotationType(annotationTypes: string[], dataSet: Record<string, unknown>): object {
			for (const contextPath in dataSet) {
				if (typeof dataSet[contextPath] === "object") {
					dataSet[contextPath] = clearAnnotationType(annotationTypes, dataSet[contextPath] as Record<string, unknown>);
					if (Object.keys(dataSet[contextPath] as object).length === 0) {
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
		odataModel.getLocalAnnotationModel = function (): JSONModel {
			return this._localAnnotationModel;
		};
		odataModel.setMessages = function (messages: Record<string, Message[]>): void {
			const cleanedData = clearAnnotationType(["@$ui5.fe.messageType", "@$ui5.fe.messageText"], this._localAnnotationModel.getData());
			this._localAnnotationModel.setData(cleanedData);
			for (const messageTarget in messages) {
				this._localAnnotationModel.setProperty(`${messageTarget}@$ui5.fe.messageType`, messages[messageTarget][0].getType());
				this._localAnnotationModel.setProperty(`${messageTarget}@$ui5.fe.messageText`, messages[messageTarget][0].getMessage());
			}
			fnMessage.apply(this, [messages]);
		};
		const fnBindProperty = odataModel.bindProperty.bind(odataModel);
		odataModel.bindProperty = function (path: string, context: ODataV4Context, parameters): ODataPropertyBinding {
			if (path.includes("@$ui5.fe.")) {
				return this._localAnnotationModel.bindProperty(path) as unknown as ODataPropertyBinding;
			}
			return fnBindProperty(path, context, parameters);
		};
		const fnDestroy = odataModel.destroy.bind(odataModel);
		odataModel.destroy = function (): void {
			this._localAnnotationModel.destroy();
			return fnDestroy.apply(this);
		};
	}
};

export type InternalModelContext = { getModel(): JSONModel } & BaseContext & {
		setProperty(sPath: string, vValue: any): void;
	};

export default ModelHelper;
