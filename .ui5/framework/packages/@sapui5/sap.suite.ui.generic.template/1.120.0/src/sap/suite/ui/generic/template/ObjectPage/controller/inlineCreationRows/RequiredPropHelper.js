sap.ui.define([
    "sap/ui/base/Object",
    "sap/base/util/extend",
    "sap/base/util/deepEqual",
    "sap/ui/core/message/Message",
    "sap/suite/ui/generic/template/genericUtilities/controlHelper",
    "sap/suite/ui/generic/template/lib/MessageUtils"
], function (BaseObject, extend, deepEqual, Message, controlHelper, MessageUtils) {
    "use strict";
    /**
     * This class takes care of the error message handling for the required properties in inline creation rows
     * for one table on the object page.
     * 1. It creates row level error messages for unfilled required props
     * 2. Also creates an error message strip when some required prop columns are hidden
     */
    function getMethods(oTemplateUtils, oSmartTable, oSmartTableHandler, oController, oObjectPage, oMessageStripHelper) {
        /** Immutable variables **/
        // Array of all the required fields
        var aAllRequiredProps = oSmartTable.data("inlineCreationRowsConfig").requiredProps;
        // Flag indicates whether the table has required props
        var bHasRequiredProps = aAllRequiredProps.length > 0;
        // Function which returns the array of unfilled required properties in the given row context
        var fnGetUnfilledRequiredProps = oTemplateUtils.oServices.oCRUDManager.getUnfilledProperties.bind(null, aAllRequiredProps);
        
        /** Mutable variables **/
        // Context path of object page
        var sCurrentObjectPagePath = oObjectPage.getBindingContext().getPath();
        // Property names of hidden required prop columns
        var aHiddenRequiredPropColumns = [];
        /**
         * Key value pair to store the row level validation error messages. Where,
         *   Key: The context path of inactive row which contains the error messages.
         *   Value: The array of error message ids which belongs to the row context.
         * 
         * Notes:
         * 1. Here, context path is used as the key as it's the stable identifier for a table row.
         * 2. Map data structure is used here as multiple rows can contain the validation error messages.
         */
        var mErrorMessagesByContextPath = new Map();
        /**
         * The "uiStateChange" event handler is executed only when this flag is true.
         * The flag becomes true when,
         *   1. The object page is reloaded with a new instance and the inline creation rows have validation errors.
         *   2. The user's first interaction on an inline creation row after the object page is reloaded.
         * It becomes false when,
         *   1. When the object page is reloaded with a new instance without any row level validation errors.
         */ 
        var bEnableUiStateChangeEvent = false;
        /**
         * Flag to indicate whether we are waiting for the first data received event after object page is reloaded.
         *  1. When the object page is reloaded with different instance, it's set to true. (Refer the method "fnOnBeforeRebindObjectPage")
         *  2. Once first data received event is completed, it's reset to false. (Refer the method "fnOnTableDataReceived")
         */
        var bWaitingForFirstDataReceived = true;
        // Attaching "uiStateChange" event handler
        oSmartTable.attachUiStateChange(onSmartTableUiStateChange);

        /**
         * This method is invoked when the object page content changes. For example, 
         * 1. When "Edit" or "Discard Draft" actions performed
         * 2. When a different record is selected in LR page
         */
        function fnOnBeforeRebindObjectPage() {
            var sUpdatedObjectPagePath = oObjectPage.getBindingContext().getPath();
            if (sUpdatedObjectPagePath === sCurrentObjectPagePath) {
                return;
            }
            sCurrentObjectPagePath = sUpdatedObjectPagePath;
            // Disable the UI State change event
            bEnableUiStateChangeEvent = false;
            // Wait for the first data received event
            bWaitingForFirstDataReceived = true;
            // Remove all the row level error messages
            fnRemoveAllExistingRowLevelErrorMessages();
        }

        /**
         * This method will be invoked by InlineRowCreationHelper when "dataReceived" event is triggered on table
         * 
         * If it's the first data received event after the object page reload,
         * it rebuilds the row level error messages
         */
        function fnOnTableDataReceived() {
            if (!bWaitingForFirstDataReceived) {
                return;
            }
            // Reset the flag
            bWaitingForFirstDataReceived = false;
            fnRebuildErrorMessagesAfterDataReceived();
        }

        /**
         * It iterates through all the the row contexts which contains validation errors
         * and removes all the error messages from the message manager.
         */
        function fnRemoveAllExistingRowLevelErrorMessages() {
            var aErrorMessageIdsToBeRemoved = [];
            Array.from(mErrorMessagesByContextPath.entries()).forEach(function(aMapEntry){
                var sContextPath = aMapEntry[0],
                    aErrorMessageIdsInCurrentContext = aMapEntry[1];
                if (aErrorMessageIdsInCurrentContext.length > 0) {
                    aErrorMessageIdsToBeRemoved = aErrorMessageIdsToBeRemoved.concat(aErrorMessageIdsInCurrentContext);
                    /**
                     * Here, we are not removing the "sContextPath" from the map.
                     * When the user moves to different object page context and comes back to the current context,
                     * we need the list of of contexts which containing errors to rebuild the row level error messages.
                     */
                    mErrorMessagesByContextPath.set(sContextPath, []);
                }    
            });
            MessageUtils.deleteMessages(aErrorMessageIdsToBeRemoved);
        }

        /**
         * After the table data is received,
         * If table contains the inactive rows with errors,
         *    a. Rebuilds the error messages for unfilled required props
         *    b. Activates the UI State Change event
         *    c. Initializes the message strip
         * Otherwise 
         *    a. Resets the value of "aHiddenRequiredPropColumns"
         *    b. Hides the message strip
         */
        function fnRebuildErrorMessagesAfterDataReceived() {
            var aRowContextsWithErrors = fnFindInactiveRowContextsWithErrors();
            if (aRowContextsWithErrors.length > 0) {
                fnRebuildRowLevelErrorMessages(aRowContextsWithErrors);
                bEnableUiStateChangeEvent = true;
                fnComputeHiddenColumnsAndUpdateMessageStrip();
            } else {
                aHiddenRequiredPropColumns = [];
                fnUpdateErrorMessageStrip();
            }
        }

        // Computes the visibility of required prop columns and update the visibility of message strip
        function fnComputeHiddenColumnsAndUpdateMessageStrip() {
            // Compute the column info when the object is initiated
            aHiddenRequiredPropColumns = oSmartTableHandler.findHiddenColumnProperties(aAllRequiredProps);
            fnUpdateErrorMessageStrip();
        }

        /**
         * The SmartTable triggers "uiStateChange" event whenever the personalization data changes.
         * This method listens the event and if any required field column is added / removed in the personalization,
         * it updates the error message strip.
         */
        function onSmartTableUiStateChange (oEvent) {
            if (!bEnableUiStateChangeEvent) {
                return;
            }

            // If the visibility of any required prop column is changed, initialize the message strip
            var aUpdatedHiddenColumns = oSmartTableHandler.findHiddenColumnProperties(aAllRequiredProps);
            var bHiddenColumnsChanged = !deepEqual(aHiddenRequiredPropColumns, aUpdatedHiddenColumns);
            if (bHiddenColumnsChanged) {
                aHiddenRequiredPropColumns = aUpdatedHiddenColumns;
                fnUpdateErrorMessageStrip();
            }
        }

        // Finds all the inactive row contexts with errors
        function fnFindInactiveRowContextsWithErrors() {
            return oSmartTableHandler.getBinding().getAllCurrentContexts().filter(function (oRowContext) {
                return oRowContext.isInactive() && mErrorMessagesByContextPath.has(oRowContext.getPath());
            });
        }

        // Recreates the error messages for the given row contexts
        function fnRebuildRowLevelErrorMessages (aRowContexts) {
            aRowContexts.forEach(function (oRowContext) {
                fnUpdateRowLevelErrorMessages(oRowContext, true);
            });
        }
        
        /**
         * Updates the visibility of error message strip.
         * Shows the message strip if there is any hidden required field. Otherwise hides it.
         * 
         * Note: If setTechnicalMessage is invoked with "oMessage = null", then the message will be removed.
         */
        function fnUpdateErrorMessageStrip() {
             var oMessage = (aHiddenRequiredPropColumns && aHiddenRequiredPropColumns.length > 0) ?  
                {
                    message: fnGetHiddenRequiredPropColumnsErrorMessage(aHiddenRequiredPropColumns),
                    type: sap.ui.core.MessageType.Error
                } : null;
            
            oMessageStripHelper.setTechnicalMessage(oMessage, oSmartTable.getId());
        }

        // This method is invoked when the user interacts with the inline creation row.
        function fnHandleActivateRow(oRowContext) {
            return fnUpdateRowLevelErrorMessages(oRowContext);
        }

        /**
         * This method does the following
         *  a. Removes the existing error messages in the current context
         *  b. Adds the new error messages for the unfilled required props
         * 
         * @returns {boolean} Flag to indicate whether the context can be activated
         */
        function fnUpdateRowLevelErrorMessages(oRowContext, bIsProgrammatic) {
            var sRowContextPath = oRowContext.getPath(),
                aExistingErrorMessageIds = mErrorMessagesByContextPath.get(sRowContextPath);

            // If the table doesn't have any required props, return true right away
            if (!bHasRequiredProps) {
                return true;
            }    
            
            // Initialize the error message strip on the first interaction
            if (!bEnableUiStateChangeEvent && !bIsProgrammatic) {
                bEnableUiStateChangeEvent = true;
                fnComputeHiddenColumnsAndUpdateMessageStrip();
            }
                
            if (aExistingErrorMessageIds && aExistingErrorMessageIds.length > 0) {
                MessageUtils.deleteMessages(aExistingErrorMessageIds);
                mErrorMessagesByContextPath.delete(sRowContextPath);
            }

            var aUnfilledRequiredProps = fnGetUnfilledRequiredProps(oRowContext),
                bHasUnfilledRequiredProps = aUnfilledRequiredProps.length > 0;

            if (bHasUnfilledRequiredProps) {
                var aErrorMessageIds = fnCreateErrorMessageForUnfilledRequiredProps(oRowContext, aUnfilledRequiredProps);
                mErrorMessagesByContextPath.set(sRowContextPath, aErrorMessageIds);
            } 

            return !bHasUnfilledRequiredProps;
        }

        /**
         * Creates error message for each unfilled required prop
         * @returns {Array<string>} Array of error message ids
         */
        function fnCreateErrorMessageForUnfilledRequiredProps (oRowContext, aUnfilledRequiredProps) {
            var sRowContextPath = oRowContext.getPath(),
                oModel = oSmartTable.getModel(),
                oMessageManager = sap.ui.getCore().getMessageManager(),
                aErrorMessageIds = [];
            
            aUnfilledRequiredProps.forEach(function (sPropName) {
                var sFullTarget = oRowContext.getDeepPath() + "/" + sPropName,
                    sTarget = sRowContextPath + "/" + sPropName,
                    sErrorMessage = fnGetRequiredPropErrorMessage(sPropName);
                
                var oMessage = new Message({
                    message: sErrorMessage,
                    persistent: false,
                    validation: true,
                    technical: false,
                    target: sTarget,
                    fullTarget: sFullTarget,
                    type: sap.ui.core.MessageType.Error,
                    processor: oModel
                });
                oMessageManager.addMessages(oMessage);
                aErrorMessageIds.push(oMessage.id);
            });

            return aErrorMessageIds;
        }

        /**
         * This method returns the app-specific error message if available, 
         * otherwise returns the standard framework message (Please refer the message in 18n file with the key "REQUIRED_PROP_ERROR")
         * 
         * The apps should override the standard framework message with their custom message. 
         * The i18n key of custom message should be in the following format: REQUIRED_PROP_ERROR|<SPECIFIC_I18N_KEY_FOR_SMART_TABLE>|sPropName
         * 
         * The logic of calculating "SPECIFIC_I18N_KEY_FOR_SMART_TABLE" can be found at CommonUtils.getSpecificI18nKeyForSmartControl method.
         * @param {string} sPropName Name of the required property
         */
        function fnGetRequiredPropErrorMessage(sPropName) {
            var sContextIdForProp = fnFindSpecificI18nKeyForProperty(sPropName);
            return oTemplateUtils.oCommonUtils.getSpecializedText("REQUIRED_PROP_ERROR", sContextIdForProp);
        }

        function fnFindSpecificI18nKeyForProperty(sPropName) {            
			var sContextIdForTable = oTemplateUtils.oCommonUtils.getSpecificI18nKeyForSmartControl(oSmartTable.getId());
            return sContextIdForTable + "|" + sPropName;    
        }

        /**
         * Returns the error message for the message strip
         * 
         * @param {Array<string>} aHiddenColumnProps 
         * @returns {string} error message
         */
        function fnGetHiddenRequiredPropColumnsErrorMessage (aHiddenColumnProps) {
            var aColumnLabels = aHiddenColumnProps.map(function (sPropName) {
                return fnGetLabelFromTableColumnHeader(sPropName);
            });
            var sErrorMessageParam = aColumnLabels.join(", ");
            var sI18nKey = aHiddenColumnProps.length > 1 ? "REQUIRED_PROP_COLUMN_HIDDEN_ERROR_PLURAL" : "REQUIRED_PROP_COLUMN_HIDDEN_ERROR";

            return oTemplateUtils.oCommonUtils.getText(sI18nKey, [sErrorMessageParam]);
        }

        // Finds the label from table column header by the property name
        function fnGetLabelFromTableColumnHeader(sPropName) {
            var oSmartTableInfoObject = oTemplateUtils.oInfoObjectHandler.getControlInformation(oSmartTable.getId());
            var sColumnKey = oSmartTableInfoObject.getColumnKeyForProperty(sPropName);
            return oSmartTableHandler.getColumnLabel(sColumnKey);
        }

        return {
            getUnfilledRequiredProps: fnGetUnfilledRequiredProps,
            handleActivateRow: fnHandleActivateRow,
            onBeforeRebindObjectPage: fnOnBeforeRebindObjectPage,
            onTableDataReceived: fnOnTableDataReceived
        };
    }

    return BaseObject.extend("sap.suite.ui.generic.template.ObjectPage.controller.inlineCreationRows.RequiredPropHelper", {
        constructor: function (oTemplateUtils, oSmartTable, oSmartTableHandler, oController, oObjectPage, oMessageStripHelper) {
            extend(this, getMethods(oTemplateUtils, oSmartTable, oSmartTableHandler, oController, oObjectPage, oMessageStripHelper));
        }
    });
});