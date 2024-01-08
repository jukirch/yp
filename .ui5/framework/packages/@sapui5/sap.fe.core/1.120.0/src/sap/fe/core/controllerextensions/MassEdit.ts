import Log from "sap/base/Log";
import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import type PageController from "sap/fe/core/PageController";
import { defineUI5Class, extensible, finalExtension, privateExtension, publicExtension } from "sap/fe/core/helpers/ClassSupport";
import MassEditHelper from "sap/fe/core/helpers/MassEditHelper";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import MessageBox from "sap/m/MessageBox";
import type Control from "sap/ui/core/Control";
import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import OverrideExecution from "sap/ui/core/mvc/OverrideExecution";
import type Table from "sap/ui/mdc/Table";
import type Context from "sap/ui/model/Context";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type ResourceModel from "sap/ui/model/resource/ResourceModel";
import CommonUtils from "../CommonUtils";

/**
 * Controller extension providing hooks for the mass edit in a table.
 *
 * @hideconstructor
 */
@defineUI5Class("sap.fe.core.controllerextensions.MassEdit")
class MassEdit extends ControllerExtension {
	@publicExtension()
	@finalExtension()
	getMessageDetailForNonEditable(oResourceBundle: ResourceBundle, typeName: string, typeNamePlural: string) {
		const sHeader = oResourceBundle.getText("C_MASS_EDIT_CONFIRM_MESSAGE_DETAIL_HEADER"),
			sReasonGroup = oResourceBundle.getText("C_MASS_EDIT_CONFIRM_MESSAGE_DETAIL_REASON", [typeNamePlural]),
			sReasonDraft = oResourceBundle.getText("C_MASS_EDIT_CONFIRM_MESSAGE_DETAIL_REASON_DRAFT", [typeName]),
			sReasonNonEditable = oResourceBundle.getText("C_MASS_EDIT_CONFIRM_MESSAGE_DETAIL_REASON_NON_EDITABLE", [typeName]);

		return (
			`<p><strong>${sHeader}</strong></p>\n` +
			(!!sReasonGroup &&
				`<p>${sReasonGroup}</p>\n` +
					`<ul>` +
					(!!sReasonDraft && `<li>${sReasonDraft}</li>`) +
					(!!sReasonNonEditable && `<li>${sReasonNonEditable}</li>`) +
					`</ul>`)
		);
	}

	getResourceText(exp: string, control: Control) {
		const resolvedText = exp && CommonUtils.getTranslatedTextFromExpBindingString(exp, control);
		return resolvedText && resolvedText.toLocaleLowerCase();
	}

	async _openConfirmDialog(oTable: Table, aContexts: Context[], iSelectedContexts: number): Promise<ODataV4Context[]> {
		const iUpdatableContexts = (aContexts || []).length;
		const view = this.getView();

		return new Promise((resolve) => {
			((view.getModel("sap.fe.i18n") as ResourceModel).getResourceBundle() as Promise<ResourceBundle>)
				.then((oResourceBundle) => {
					const sEditButton = oResourceBundle.getText("C_MASS_EDIT_CONFIRM_BUTTON_TEXT"),
						sCancelButton = oResourceBundle.getText("C_COMMON_OBJECT_PAGE_CANCEL"),
						iNonEditable = iSelectedContexts - iUpdatableContexts,
						entityTypePath = oTable.data("entityType"),
						metaModel = (oTable.getModel() as ODataModel).getMetaModel(),
						headerInfoAnno = metaModel.getObject(`${entityTypePath}@com.sap.vocabularies.UI.v1.HeaderInfo`),
						typeName =
							(headerInfoAnno && this.getResourceText(headerInfoAnno.TypeName, view)) ||
							oResourceBundle.getText("C_MASS_EDIT_DIALOG_DEFAULT_TYPENAME"),
						typeNamePlural =
							(headerInfoAnno && this.getResourceText(headerInfoAnno.TypeNamePlural, view)) ||
							oResourceBundle.getText("C_MASS_EDIT_DIALOG_DEFAULT_TYPENAME_PLURAL"),
						sMessage = oResourceBundle.getText("C_MASS_EDIT_CONFIRM_MESSAGE", [
							iNonEditable,
							iSelectedContexts,
							iUpdatableContexts,
							typeNamePlural
						]),
						sPath = oTable.data("targetCollectionPath"),
						oMetaModel = (oTable.getModel() as ODataModel).getMetaModel(),
						bIsDraft = ModelHelper.isDraftSupported(oMetaModel, sPath),
						bDisplayMode = oTable.data("displayModePropertyBinding") === "true",
						sMessageDetail =
							bIsDraft && bDisplayMode && this.getMessageDetailForNonEditable(oResourceBundle, typeName, typeNamePlural);

					MessageBox.warning(sMessage, {
						details: sMessageDetail,
						actions: [sEditButton, sCancelButton],
						emphasizedAction: sEditButton,
						contentWidth: "100px",
						onClose: function (sSelection: string) {
							let aContextsForEdit: any[] = [];
							if (sSelection === sEditButton) {
								Log.info("Mass Edit: Confirmed to edit ", iUpdatableContexts.toString(), " selections.");
								aContextsForEdit = aContexts;
							} else if (sSelection === sCancelButton) {
								Log.info("Mass Edit: Cancelled.");
							}
							resolve(aContextsForEdit);
						}
					} as any);
				})
				.catch(function (error) {
					Log.error(error);
				});
		});
	}

	/**
	 * The following operations are performed by method openMassEditDialog:
	 * => Opens the mass edit dialog.
	 * => Implements the save and cancel functionality.
	 * => Sets the runtime model to the dialog.
	 * => Sets the static model's context to the dialog.
	 *
	 * @param table Instance of the table
	 * @returns A promise that resolves on open of the mass edit dialog.
	 */
	@publicExtension()
	@finalExtension()
	async openMassEditDialog(table: Table): Promise<void> {
		try {
			const controller = this.getView().getController() as PageController,
				contextsForEdit = ((await this.fetchContextsForEdit(table)) as ODataV4Context[] | undefined) ?? [],
				iSelectedContexts =
					(table.getBindingContext("internal") as InternalModelContext).getProperty("numberOfSelectedContexts") || 0,
				contexts =
					contextsForEdit.length && contextsForEdit.length !== iSelectedContexts
						? await this._openConfirmDialog(table, contextsForEdit, iSelectedContexts)
						: contextsForEdit,
				dialog = contexts?.length ? await MassEditHelper.createDialog(table, contexts, controller) : undefined;
			if (dialog) {
				table.addDependent(dialog);
				dialog.open();
			}
		} catch (error: unknown) {
			Log.error("Mass Edit: Something went wrong in mass edit dialog creation.", error as string);
		}
	}

	/**
	 * Returns a promise that resolves to the contexts for mass edit.
	 *
	 * @param oTable Table for mass edit.
	 * @returns A promise to be resolved with an array of context(s) which should be considered for mass edit.
	 */
	@privateExtension()
	@extensible(OverrideExecution.After)
	fetchContextsForEdit(oTable: Table) {
		//To be overridden by the application
		const oInternalModelContext = oTable.getBindingContext("internal") as InternalModelContext,
			aSelectedContexts = oInternalModelContext.getProperty("updatableContexts") || [];

		return Promise.resolve(aSelectedContexts);
	}
}

export default MassEdit;
