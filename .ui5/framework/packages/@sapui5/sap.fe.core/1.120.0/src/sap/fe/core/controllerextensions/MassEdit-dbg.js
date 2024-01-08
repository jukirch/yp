/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/helpers/ClassSupport", "sap/fe/core/helpers/MassEditHelper", "sap/fe/core/helpers/ModelHelper", "sap/m/MessageBox", "sap/ui/core/mvc/ControllerExtension", "sap/ui/core/mvc/OverrideExecution", "../CommonUtils"], function (Log, ClassSupport, MassEditHelper, ModelHelper, MessageBox, ControllerExtension, OverrideExecution, CommonUtils) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2;
  var publicExtension = ClassSupport.publicExtension;
  var privateExtension = ClassSupport.privateExtension;
  var finalExtension = ClassSupport.finalExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  /**
   * Controller extension providing hooks for the mass edit in a table.
   *
   * @hideconstructor
   */
  let MassEdit = (_dec = defineUI5Class("sap.fe.core.controllerextensions.MassEdit"), _dec2 = publicExtension(), _dec3 = finalExtension(), _dec4 = publicExtension(), _dec5 = finalExtension(), _dec6 = privateExtension(), _dec7 = extensible(OverrideExecution.After), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    _inheritsLoose(MassEdit, _ControllerExtension);
    function MassEdit() {
      return _ControllerExtension.apply(this, arguments) || this;
    }
    var _proto = MassEdit.prototype;
    _proto.getMessageDetailForNonEditable = function getMessageDetailForNonEditable(oResourceBundle, typeName, typeNamePlural) {
      const sHeader = oResourceBundle.getText("C_MASS_EDIT_CONFIRM_MESSAGE_DETAIL_HEADER"),
        sReasonGroup = oResourceBundle.getText("C_MASS_EDIT_CONFIRM_MESSAGE_DETAIL_REASON", [typeNamePlural]),
        sReasonDraft = oResourceBundle.getText("C_MASS_EDIT_CONFIRM_MESSAGE_DETAIL_REASON_DRAFT", [typeName]),
        sReasonNonEditable = oResourceBundle.getText("C_MASS_EDIT_CONFIRM_MESSAGE_DETAIL_REASON_NON_EDITABLE", [typeName]);
      return `<p><strong>${sHeader}</strong></p>\n` + (!!sReasonGroup && `<p>${sReasonGroup}</p>\n` + `<ul>` + (!!sReasonDraft && `<li>${sReasonDraft}</li>`) + (!!sReasonNonEditable && `<li>${sReasonNonEditable}</li>`) + `</ul>`);
    };
    _proto.getResourceText = function getResourceText(exp, control) {
      const resolvedText = exp && CommonUtils.getTranslatedTextFromExpBindingString(exp, control);
      return resolvedText && resolvedText.toLocaleLowerCase();
    };
    _proto._openConfirmDialog = async function _openConfirmDialog(oTable, aContexts, iSelectedContexts) {
      const iUpdatableContexts = (aContexts || []).length;
      const view = this.getView();
      return new Promise(resolve => {
        view.getModel("sap.fe.i18n").getResourceBundle().then(oResourceBundle => {
          const sEditButton = oResourceBundle.getText("C_MASS_EDIT_CONFIRM_BUTTON_TEXT"),
            sCancelButton = oResourceBundle.getText("C_COMMON_OBJECT_PAGE_CANCEL"),
            iNonEditable = iSelectedContexts - iUpdatableContexts,
            entityTypePath = oTable.data("entityType"),
            metaModel = oTable.getModel().getMetaModel(),
            headerInfoAnno = metaModel.getObject(`${entityTypePath}@com.sap.vocabularies.UI.v1.HeaderInfo`),
            typeName = headerInfoAnno && this.getResourceText(headerInfoAnno.TypeName, view) || oResourceBundle.getText("C_MASS_EDIT_DIALOG_DEFAULT_TYPENAME"),
            typeNamePlural = headerInfoAnno && this.getResourceText(headerInfoAnno.TypeNamePlural, view) || oResourceBundle.getText("C_MASS_EDIT_DIALOG_DEFAULT_TYPENAME_PLURAL"),
            sMessage = oResourceBundle.getText("C_MASS_EDIT_CONFIRM_MESSAGE", [iNonEditable, iSelectedContexts, iUpdatableContexts, typeNamePlural]),
            sPath = oTable.data("targetCollectionPath"),
            oMetaModel = oTable.getModel().getMetaModel(),
            bIsDraft = ModelHelper.isDraftSupported(oMetaModel, sPath),
            bDisplayMode = oTable.data("displayModePropertyBinding") === "true",
            sMessageDetail = bIsDraft && bDisplayMode && this.getMessageDetailForNonEditable(oResourceBundle, typeName, typeNamePlural);
          MessageBox.warning(sMessage, {
            details: sMessageDetail,
            actions: [sEditButton, sCancelButton],
            emphasizedAction: sEditButton,
            contentWidth: "100px",
            onClose: function (sSelection) {
              let aContextsForEdit = [];
              if (sSelection === sEditButton) {
                Log.info("Mass Edit: Confirmed to edit ", iUpdatableContexts.toString(), " selections.");
                aContextsForEdit = aContexts;
              } else if (sSelection === sCancelButton) {
                Log.info("Mass Edit: Cancelled.");
              }
              resolve(aContextsForEdit);
            }
          });
        }).catch(function (error) {
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
     */;
    _proto.openMassEditDialog = async function openMassEditDialog(table) {
      try {
        const controller = this.getView().getController(),
          contextsForEdit = (await this.fetchContextsForEdit(table)) ?? [],
          iSelectedContexts = table.getBindingContext("internal").getProperty("numberOfSelectedContexts") || 0,
          contexts = contextsForEdit.length && contextsForEdit.length !== iSelectedContexts ? await this._openConfirmDialog(table, contextsForEdit, iSelectedContexts) : contextsForEdit,
          dialog = contexts !== null && contexts !== void 0 && contexts.length ? await MassEditHelper.createDialog(table, contexts, controller) : undefined;
        if (dialog) {
          table.addDependent(dialog);
          dialog.open();
        }
      } catch (error) {
        Log.error("Mass Edit: Something went wrong in mass edit dialog creation.", error);
      }
    }

    /**
     * Returns a promise that resolves to the contexts for mass edit.
     *
     * @param oTable Table for mass edit.
     * @returns A promise to be resolved with an array of context(s) which should be considered for mass edit.
     */;
    _proto.fetchContextsForEdit = function fetchContextsForEdit(oTable) {
      //To be overridden by the application
      const oInternalModelContext = oTable.getBindingContext("internal"),
        aSelectedContexts = oInternalModelContext.getProperty("updatableContexts") || [];
      return Promise.resolve(aSelectedContexts);
    };
    return MassEdit;
  }(ControllerExtension), (_applyDecoratedDescriptor(_class2.prototype, "getMessageDetailForNonEditable", [_dec2, _dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "getMessageDetailForNonEditable"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "openMassEditDialog", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "openMassEditDialog"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fetchContextsForEdit", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "fetchContextsForEdit"), _class2.prototype)), _class2)) || _class);
  return MassEdit;
}, false);
