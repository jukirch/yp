
sap.ui.define([
    "sap/ui/base/Object",
    "sap/suite/ui/generic/template/genericUtilities/controlHelper",
    "sap/base/util/extend",
    "sap/suite/ui/generic/template/ObjectPage/controller/inlineCreationRows/RequiredPropHelper"
], function (BaseObject, controlHelper, extend, RequiredPropHelper) {
        "use strict";

        /**
         * This class handles the creation of multiple empty rows (inline creation rows) in the table. 
         * The empty rows are created when the table receives the data.
         * 
         * The code flow starts from "fnOnBeforeRebindControl" method. 
         * This method attaches listener for "dataReceived" event for the table.
         * 
         * --------------------
         * Pre-conditions
         * --------------------
         * In order to create empty rows, the following conditions should be met
         * 1. The application is draft enabled
         * 2. The table type should be either Responsive Table or Grid Table
         * 3. In the table's manifest setting, the value of "createMode" should be either "creationRows" or "creationRowsHiddenInEditMode"
         * 
         * If the "createMode" is "creationRows"
         *  - The inline creation rows added to the table when the page is in either "Create" or "Edit" mode
         * If the "createMode" is "creationRowsHiddenInEditMode"
         *  - When the page is in "Create" mode, it works same as "creationRows"
         *  - When the page is in "Edit" mode, the inline creation rows are added to the table only after "Create" button is clicked
         * 
         * Note: Please refer the method "fnHandleAddEntry" to understand the "Create" button functionality
         * --------------------
         * Creation phase
         * --------------------
         * 1. The inline creation rows are created at
         *  a. The top of Responsive Table
         *  b. The bottom of Grid Table
         * 2. When the current inline creation row is edited, a new inline creation row will be created below the current one
         * 
         * --------------------
         * Post process
         * --------------------
         * This class also makes the following changes after inline creation rows are added to the table.
         * In both Responsive & Grid tables,
         *      a. Navigation & inline delete icons are hidden from the newly created inline creation rows (Row is in "inactive" state)
         *      b. Navigation & inline delete icons are restored when the the inline creation rows are edited (Row is in "transient" state)
         * In Responsive table,
         *      The "Create" button is hidden in the table toolbar
         * In Grid table,
         *      When the "Create" button in the toolbar is clicked, it scrolls down to the bottom of the table
         */

        function getMethods(oObjectPage, oTemplateUtils, fnGetSmartTableCreationMode, oController, oMessageStripHelper) {
            var BINDING_PATH_TRANSIENT_CONTEXT = "@$ui5.context.isTransient",
                BINDING_PATH_INACTIVE_CONTEXT = "@$ui5.context.isInactive",
                CREATION_MODE = {
                    INLINE_CREATION_ROWS: "creationRows",
                    INLINE_CREATION_ROWS_HIDDEN_IN_EDIT_MODE: "creationRowsHiddenInEditMode"
                };
            /**
             * In order to create the inline creation rows,
             *  - The UI model's "/editable" property should be true for the "creationRows" mode.
             *  - Similarly, UI model's "/createMode" property should be true for the "creationRowsHiddenInEditMode" mode.
             * 
             * If the corresponding UI model property is false, the table ids will be added to the respective set in the below "oTablesToBeProcessed" object.
             * Please refer the function "fnCheckUIModelProp" for the same.
             * 
             * When the UI model property becomes true, inline creation rows will be added to all the tables stored in the set.
             * Please refer the function "onUIModelPropChanged". Once the inline creation rows added to a table, it's id will be removed from the set.
             * 
             */
            var oTablesToBeProcessed = {
                creationRows: new Set(),
                creationRowsHiddenInEditMode: new Set()
            };
            var oUIModelPropForCreationMode = {
                creationRows: "/editable",
                creationRowsHiddenInEditMode: "/createMode"
            };

            var oBindingSet = new Set(),
            mDefaultRowTypeByTableId = new Map(),
            oUIModelPropsWithChangeEventAttached = new Set(),
            mContextWithCreatablePathByTableId = new Map(),
            oEditedRowContexts = new Set(),
            mRequiredPropHelperByTableId = new Map();

            /**
             * This method is invoked when the object page content changes. For example, 
             * 1. When "Edit" or "Discard Draft" actions performed
             * 2. When a different record is selected in LR page
             */
            function fnOnBeforeRebindObjectPage(){
                //Clear the cache
                oTablesToBeProcessed.creationRows.clear();
                oTablesToBeProcessed.creationRowsHiddenInEditMode.clear();
                //Invoke "beforeRebindObjectPage" on all the RequiredPropHelper instances
                Array.from(mRequiredPropHelperByTableId.values()).forEach(function (oRequiredPropHelper) {
                    oRequiredPropHelper.onBeforeRebindObjectPage();
                });
            }

            /***
             * Utility functions
             */
            function fnIsCreationAllowedByBoolAndPathRestrictions (oSmartTable) {
                var vPathRestrictions = oSmartTable.data("isCreationAllowedByBoolAndPathRestrictions");
                return ["true", true].includes(vPathRestrictions);
            }

            function fnDoesTableHaveCreationRows (oItemsBinding) {
                return oItemsBinding.getAllCurrentContexts().some(function (oContext){
                    return oContext.isInactive() && !oEditedRowContexts.has(oContext.getPath());
                });
            }

            function fnGetSmartTableHandler (oSmartTable) {
                return oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oSmartTable);
            }

            /**
             * 
             * @param {*} oSmartTable 
             */
            function fnGetRequiredPropHelper (oSmartTable) {
                var sTableId = oSmartTable.getId(),
                    oRequiredPropHelper = mRequiredPropHelperByTableId.get(sTableId);
                if (!oRequiredPropHelper) {
                    oRequiredPropHelper = new RequiredPropHelper(oTemplateUtils, oSmartTable, fnGetSmartTableHandler(oSmartTable), oController, oObjectPage, oMessageStripHelper);
                    mRequiredPropHelperByTableId.set(sTableId, oRequiredPropHelper);
                }
                return oRequiredPropHelper;
            }

            // Should be called by the outside in the onBeforeRebind event of any of the affected smart controls.
            function fnOnBeforeRebindControl (oEvent) {
                //Inline Creation Rows are supported only on draft based apps
                if (!oTemplateUtils.oComponentUtils.isDraftEnabled()) {
                    return;
                }
                var oSmartTable = oEvent.getSource();
                var oTable = oSmartTable.getTable();
                //Inline Creation Rows are not supported in AnalyticalTable and TreeTable
                if (controlHelper.isAnalyticalTable(oTable) || controlHelper.isTreeTable(oTable)) {
                    return;
                }
                //Smart table's creation mode should support inline creation rows
                var sSmartTableCreationMode = fnGetSmartTableCreationMode(oSmartTable);
                var bIsInlineCreateEnabled = [
                    CREATION_MODE.INLINE_CREATION_ROWS,
                    CREATION_MODE.INLINE_CREATION_ROWS_HIDDEN_IN_EDIT_MODE
                ].includes(sSmartTableCreationMode);

                if (!bIsInlineCreateEnabled) {
                    return;
                }

                oSmartTable.addEventDelegate({
					oninput: function() {
                        fnHandleUserInput(oSmartTable);
					}
				});

                var oBindingParams = oEvent.getParameters().bindingParams;
                var fnOldDataReceived = oBindingParams.events.dataReceived || Function.prototype;
                oBindingParams.events.dataReceived = function (oDataReceivedEvent) {
                    fnOldDataReceived.call(this, oDataReceivedEvent);
                    var oSmartTableHandler = fnGetSmartTableHandler(oSmartTable),
                        oItemsBinding = oSmartTableHandler.getBinding();
                
                    if (fnDoesTableHaveCreationRows(oItemsBinding)) {
                        /**
                         * If the table already has inline creation rows
                         * 1. If the dataReceived event triggered by side-effect
                         *      a. Delete the existing inline creation rows and 
                         *      b. Continue with the process of creating new inline creation rows
                         * 2. Otherwise, the dataReceived event would have been triggered by 
                         *    adding columns on personalization (or) object page is reloaded with different instance.
                         *    In that case,
                         *      a. Update the inline control on the inline creation row
                         *      b. Attach the "createActivate" event to the list binding
                         *      c. Invoke "dataReceived" method on required prop helper
                         */
                        var bIsTriggeredBySideEffect = oDataReceivedEvent.getParameter("reason") === "SIDE_EFFECT_TARGET";
                        if (bIsTriggeredBySideEffect) {
                            fnDeleteCreationRows(oSmartTable);
                        } else {
                            fnUpdateTableRows(oSmartTable.getTable());
                            fnAttachCreateActivateEventOnItemsBinding(oSmartTable, oItemsBinding);
                            fnInvokeDataReceivedOnRequiredPropHelper(oSmartTable);
                            return;
                        }
                    }
                    // Check the UI model and proceed with creation of inline creation rows
                    fnCheckUIModelProp(oSmartTable);
                    fnAttachChangeHandlerOnCreatablePath(oSmartTable);
                };
            }

            function fnInvokeDataReceivedOnRequiredPropHelper(oSmartTable) {
                var sSmartTableId = oSmartTable.getId();
                if (mRequiredPropHelperByTableId.has(sSmartTableId)) {
                    mRequiredPropHelperByTableId.get(sSmartTableId).onTableDataReceived();
                }
            }

            function fnHandleUserInput(oSmartTable) {
                var oSourceControl = controlHelper.getControlWithFocus();

                var fnHandleFirstUserInputOnEmptyRow = function(oBindingContext) {
                    var sPath = oBindingContext.getPath && oBindingContext.getPath();
                    if (sPath && !oEditedRowContexts.has(sPath)) {
                        fnAddCreationRows(oSmartTable, true);
                        oEditedRowContexts.add(sPath);// Maintain the context in a Set so that an Empty row is created only once
                    }
                };
                var fnCheckIfBindingIsTransient = function(oSourceControl) {
                    var oBindingContext = oSourceControl.getBindingContext && oSourceControl.getBindingContext();
                    return oBindingContext.isTransient && oBindingContext.isTransient() ? oBindingContext : false;
                };
                // Identify if the oninput event was raised from field which is rendered within an empty transient row , if then add a new empty transient row once
                while (oSourceControl) {
                    var oBindingContext = fnCheckIfBindingIsTransient(oSourceControl);

                    // New empty row is created only once per row
                    if (oBindingContext && (controlHelper.isSmartField(oSourceControl) || controlHelper.isColumnListItem(oSourceControl) || controlHelper.isRow(oSourceControl))) {
                        fnHandleFirstUserInputOnEmptyRow(oBindingContext);
                        break;
                    } else if (controlHelper.isSmartTable(oSourceControl)) {
                        break; // For any non smart field input break here
                    }
                    oSourceControl = oSourceControl.getParent();
                }
            }

            function fnCheckUIModelProp (oSmartTable) {
                var oUIModel = oObjectPage.getModel("ui"),
                    sSmartTableCreationMode = fnGetSmartTableCreationMode(oSmartTable),
                    sUIModelProp = oUIModelPropForCreationMode[sSmartTableCreationMode],
                    sSmartTableId = oSmartTable.getId();
                // Ignore it when the table is already in process
                if (oTablesToBeProcessed[sSmartTableCreationMode].has(sSmartTableId)) {
                    return;
                }    
                //Add the smart table id to the list of tables to be processed
                oTablesToBeProcessed[sSmartTableCreationMode].add(sSmartTableId);
                //If the property is true, proceed with the creating inline creation rows
                if (oUIModel.getProperty(sUIModelProp)) {
                    fnAddCreationRows(oSmartTable);
                }
                //Additionally, ensure the required registration of "onEditablePropertyChanged". See more there
                if (!oUIModelPropsWithChangeEventAttached.has(sUIModelProp)) {
                    oUIModel.bindProperty(sUIModelProp).attachChange(onUIModelPropChanged.bind(null, sSmartTableCreationMode));
                    oUIModelPropsWithChangeEventAttached.add(sUIModelProp);
                }
            }

            /**
             * This method is invoked when "editable" or "createMode" property of the UI model is changed.
             * When the property value becomes true, this method invokes the logic of creating inline rows
             * Note: This method is registered at the UI model once in function "fnCheckUIModelProp" 
             */
            function onUIModelPropChanged(sSmartTableCreationMode, oEvent) {
                if (oEvent.getSource().getValue()) { // called by the change of UI Model
                    var oTablesToBeProcessedOnCreationMode = oTablesToBeProcessed[sSmartTableCreationMode];
                    oTablesToBeProcessedOnCreationMode.forEach(function (sSmartTableId) {
                        var oControl = sap.ui.getCore().byId(sSmartTableId);
                        fnAddCreationRows(oControl);
                    });
                }
            }


            /**
             * When the creation on smart table is controlled by an object page header property (creatable path),
             * the inline creation rows should be shown/hidden based on the header property value.
             * 
             * This method adds a change event to the creatable path. 
             * Whenever the creatable path value changes, it invokes the appropriate logic to show/hide the inline creation rows.
             * @param {*} oSmartTable 
             */
            function fnAttachChangeHandlerOnCreatablePath (oSmartTable) {
                var oObjectPageBindingContext = oObjectPage.getBindingContext(),
                    sSmartTableId = oSmartTable.getId();
                // If the change event is already attached to the same binding context, don't process
                if (mContextWithCreatablePathByTableId.get(sSmartTableId) === oObjectPageBindingContext) {
                    return;
                }
                // Get the creatable path from custom data
                var oInlineCreationRowsConfig = oSmartTable.data("inlineCreationRowsConfig"),
                    oCreatablePathObj = oInlineCreationRowsConfig.creatablePath,
                    vCreatablePath = oCreatablePathObj.creatable;
                // If the creatable path is boolean, no need to process further as we need to attach change event only on the path
                if (typeof vCreatablePath === "boolean") {
                    return;
                }
                oObjectPage.getModel().bindProperty(vCreatablePath, oObjectPageBindingContext).attachChange(function (oEvent){
                    var bCreationAllowed = !!oEvent.getSource().getValue();
                    //If negate = true (non-insertable navigation property), invert the flag
                    bCreationAllowed = oCreatablePathObj.negate ? !bCreationAllowed : bCreationAllowed;
                    
                    if (bCreationAllowed) {
                        //Display the inline creation rows
                        fnCheckUIModelProp(oSmartTable);
                    } else {
                        //Delete the inline creation rows
                        fnDeleteCreationRows(oSmartTable);
                    }
                });
                // Update the map with the latest binding context
                mContextWithCreatablePathByTableId.set(sSmartTableId, oObjectPageBindingContext);

            }

            /**
             * It fetches the default values and then invokes the logic to create the "Inline Creation Rows"
             * @param {*} oSmartTable
             * @param {boolean} bIsOnUserInput is true only in case where user types into a field rendered inside a transient row
             */
             function fnAddCreationRows (oSmartTable, bIsOnUserInput) {
                var oSmartTableHandler = fnGetSmartTableHandler(oSmartTable);
                var oItemsBinding = oSmartTableHandler.getBinding();
                var mParameters = {
                    itemsBinding : oItemsBinding,
                    isLengthFinal : oSmartTableHandler.isLengthFinal(),
                    isResponsiveTable : oSmartTableHandler.isMTable()
                };

                return new Promise(function(fnResolve) {
                    fnFetchDefaultValues(oSmartTable).then(function (oDefaultValues) {
                        // In cases of user input then create a new empty row
                        if (bIsOnUserInput) {
                            createInactiveLineItem(oItemsBinding, oDefaultValues, true);
                            fnUpdateTableRows(oSmartTable.getTable());
                        } else {
                            fnAddCreationRowsImpl(oSmartTable, oDefaultValues, mParameters);
                        }
                        fnResolve();
                    });
                });
            }
            /***
             * Invokes "createInactiveLineItem" method to create inline rows.
             * 
             * If the table is "Responsive Table", the inline rows are created at the beginning of the table. 
             * But for "Grid Table", rows are created at the end
             */
            function fnAddCreationRowsImpl(oSmartTable, oDefaultValues, mParameters) {
                var oTable = oSmartTable.getTable();
                var sSmartTableCreationMode = fnGetSmartTableCreationMode(oSmartTable);
                var bResponsiveTable = mParameters.isResponsiveTable;
                var oItemsBinding = mParameters.itemsBinding;
                // for grid table, all creations are at the end. only add creation rows when list binding's length is final
                var bIsLengthFinal = mParameters.isLengthFinal;

                var bIsCreationAllowedByPath = fnIsCreationAllowedByBoolAndPathRestrictions(oSmartTable);
                var bTableHasCreationRows = fnDoesTableHaveCreationRows(oItemsBinding);
                if (bIsLengthFinal && oItemsBinding.isResolved() && bIsCreationAllowedByPath && !bTableHasCreationRows) { // no inline creation rows have been added yet
                    // for responsive table, the very first creation is at the start and the following at the end
                    createInactiveLineItem(oItemsBinding, oDefaultValues, !bResponsiveTable);
                    // Remove the smart table id from the list of tables to be processed
                    oTablesToBeProcessed[sSmartTableCreationMode].delete(oSmartTable.getId());
                    // Hide navigation and delete controls on inactive rows
                    var fnAfterRenderCallback = fnUpdateTableRows.bind(null, oTable);
                    fnInvokeCallbackAfterRendering(oTable, fnAfterRenderCallback);
                    // Attach the "createActivate" event to the items binding
                    fnAttachCreateActivateEventOnItemsBinding(oSmartTable, oItemsBinding);
                }
            }

            /**
             * When an empty is edited, "createActivate" event is triggered.
             * This method listens the event and
             * 1. Invoke the logic to create a new empty new below the current row.
             * 2. If the current transient row has any unfilled required fields,
             *      a. Invokes the logic to display the error messages
             *      b. Avoids the draft row creation by preventing the event
             *    Otherwise,
             *      a. Executes side effects where source entity is the table's binding path
             */
            function fnAttachCreateActivateEventOnItemsBinding(oSmartTable, oItemsBinding) {
                // If the event is already attached, ignore it
                if (oBindingSet.has(oItemsBinding)) {
                    return;
                }
                oBindingSet.add(oItemsBinding);
                oItemsBinding.attachCreateActivate(function (oEvent) {                    
                    var oRowContext = oEvent.getParameter("context");
                        
                    var oInnerTable = oSmartTable.getTable();
                    if (controlHelper.isMTable(oInnerTable)) {
                        var aRows = oInnerTable.getItems();
                        var oTransientRow = aRows.find(function (oRow) {
                            return oRow.getBindingContext() === oRowContext;
                        });
                        var aCells = oTransientRow.getCells();
                        for (var j = 0; j < aCells.length; j++) {
                            aCells[j].setEditable && aCells[j].setEditable(true);
                        }
                    }

                    if (oRowContext && !oEditedRowContexts.has(oRowContext.getPath && oRowContext.getPath())) {
                        fnAddCreationRows(oSmartTable, true);
                        oEditedRowContexts.add(oRowContext.getPath());
                    }
                    // If the table contains required props, validate them and show error messages
                    var oRequiredPropHelper = fnGetRequiredPropHelper(oSmartTable);
                    var bCanActivateContext = oRequiredPropHelper.handleActivateRow(oRowContext);
                    if (!bCanActivateContext) {
                        oEvent.preventDefault();
                        return;
                    }
                    /***
                     * Execute side effects where source entity is the table's binding path
                     * 
                     * Note: Need to revisit the logic when the inline creation rows support mandatory fields.
                     * When the user edits the row and few mandatory fields are not yet filled, 
                     * the POST call for creation shouldn't be triggered and side effect also shouldn't be triggered.
                     */
                    var oTableContext = oSmartTable.getBindingContext(),
                        sTableBindingPath = oSmartTable.getTableBindingPath();
                    oTemplateUtils.oServices.oApplicationController.executeSideEffects(oTableContext, [], [sTableBindingPath]);
                }); 
            }

            /**
             * Actual implementation of creating inline rows.
             * It invokes the ODataListBinding#create method with the parameter "inactive" as true. 
             * 
             * @param {*} oItemsBinding Items binding of the table
             * @param {*} oDefaultValues Default values 
             * @param {*} bAtEnd Flag determines whether the new row should be added at the beginning or end
             */
            function createInactiveLineItem(oItemsBinding, oDefaultValues, bAtEnd) {
				oItemsBinding.create(oDefaultValues, bAtEnd, { inactive: true, changeSetId: "Create" });
            }

            /***
             * Fetches the default values for the table.
             * 
             * @param {*} oSmartTable Smart table 
             */
            function fnFetchDefaultValues (oSmartTable) {
                return new Promise(function (fnResolve) {
                    var oGetDefaultValuesPromise = oTemplateUtils.oServices.oCRUDManager.getDefaultValues(oSmartTable, null, true);

                    if (oGetDefaultValuesPromise instanceof Promise) {
                        oGetDefaultValuesPromise.then(function (aResponse){
                            var oDefaultValues = aResponse[0];
                            fnResolve(oDefaultValues);
                        }).catch(function(){
                            fnResolve(null);
                        });
                    } else {
                        fnResolve(null);
                    }
                });
            }
            //Based on the table type, this method invokes the appropriate method to update table rows
            function fnUpdateTableRows(oTable) {
                if (controlHelper.isMTable(oTable)) {
                    fnUpdateResponsiveTableRows(oTable);
                }
            }

            /**
             * Filters out the transient rows which are not yet bounded with the "Context.isTransient" path.
             * And, invokes "fnHideInlineControlsOnInactiveRow" for each rows
             * @param {sap.m.Table} oTable 
             */
            function fnUpdateResponsiveTableRows(oTable) {
                var sDefaultRowType,
                    sTableId = oTable.getId(),
                    oInactiveAndTransientRow = getInactiveAndTransientRows(oTable);

                if (!oInactiveAndTransientRow.oInActiveRow) {
                    return;
                }

                fnUpdateResponsiveTableRowsBasedOnNonInsertableProperties(oTable, oInactiveAndTransientRow.oInActiveRow);
                
                // Preserving the default row type into "mDefaultRowTypeByTableId".
                // sDefaultRowType is used by "fnHideInlineControlsOnInactiveRow" to restore the row type when the row is persisted 
                if (mDefaultRowTypeByTableId.get(sTableId)) {
                    sDefaultRowType = mDefaultRowTypeByTableId.get(sTableId);
                } else {
                    sDefaultRowType = oInactiveAndTransientRow.oInActiveRow.getProperty("type");
                    mDefaultRowTypeByTableId.set(sTableId, sDefaultRowType);
                }
                fnInvokeCallbackAfterRendering(oInactiveAndTransientRow.oInActiveRow, fnHideInlineControlsOnInactiveRow.bind(null, oInactiveAndTransientRow.oInActiveRow, sDefaultRowType));
            }

            function getInactiveAndTransientRows(oTable) {
                var aTransientRows = [], oInActiveRow;
                oTable.getItems().forEach(function(oItem) {
                    var oBindingContext = oItem.getBindingContext();
                    var sBindingPath = oItem.getBinding("type") && oItem.getBinding("type").getPath();

                    if (oBindingContext.isInactive() && sBindingPath !== BINDING_PATH_INACTIVE_CONTEXT) {
                        oInActiveRow = oItem;
                    } else if (oBindingContext.isTransient() && sBindingPath !== BINDING_PATH_TRANSIENT_CONTEXT) {
                        aTransientRows.push(oItem);
                    }
                });

                return {
                    aTransientRows: aTransientRows,
                    oInActiveRow: oInActiveRow
                };
            }

            function fnUpdateResponsiveTableRowsBasedOnNonInsertableProperties(oTable, oInActiveRow) {
                // Support NonInsertableProperties to disable the field while creation
                var oSmartTable = oTable.getParent();
                var aColumns = oTable.getColumns();
                var aNonInsertableProperties = oSmartTable.data("inlineCreationRowsConfig").nonInsertableProperties;
                var aIndexOfNonInsertableProperties = [];
                if (aNonInsertableProperties && aNonInsertableProperties.length > 0) {
                    for (var i = 0; i < oInActiveRow.getCells().length; i++) {
                        for (var j = 0; j < aNonInsertableProperties.length; j++) {
                            if (aNonInsertableProperties[j].PropertyPath === aColumns[i].data("p13nData").leadingProperty) {
                                aIndexOfNonInsertableProperties.push(i);
                            }
                        }
                    }
                    var aTransientRowsCell = oInActiveRow.getCells();
                    for (var j = 0; j < aIndexOfNonInsertableProperties.length; j++) {
                        aTransientRowsCell[aIndexOfNonInsertableProperties[j]].setEditable && aTransientRowsCell[aIndexOfNonInsertableProperties[j]].setEditable(false);
                    }
                }
            }

            /**
             * This method binds the row type and the visibility of delete control with row's binding context
             * 1. When the binding context is inactive ($context.isInactive = true)
             *  a. Row type becomes inactive. So that, the navigation icon is hidden
             *  b. Delete control becomes invisible
             * 2. When the binding context is persisted ($context.isInactive = false)
             *  a. Restores the List Type (i.e., restores the navigation icon)
             *  b. Restores the delete control
             * 3. When the transient row becomes draft row and the row is selected, enables the relevant toolbar buttons 
             * @param {sap.m.ColumnListItem} oTableRow Responsive table row
             * @param {sap.m.ListType} sDefaultRowType Default row type
             */
            function fnHideInlineControlsOnInactiveRow (oTableRow, sDefaultRowType) {
                var oDeleteControl = oTableRow.getDeleteControl();

                oTableRow.bindProperty("type", {
                    path: BINDING_PATH_INACTIVE_CONTEXT,
                    formatter: function (bIsInactive) {
                        return bIsInactive ? "Inactive" : sDefaultRowType;
                    }
                });
                oDeleteControl && oDeleteControl.bindProperty("visible", {
                    path: BINDING_PATH_INACTIVE_CONTEXT,
                    formatter: function (bIsInactive) {
                        return !bIsInactive;
                    }
                });

                //The "created" method returns a promise and it's resolved when the transient row becomes a draft row
                var oContextCreationPromise = oTableRow.getBindingContext().created();
                oContextCreationPromise && oContextCreationPromise.then(function(){
                    //If the row is selected, enable the relevant toolbar buttons
                    oTableRow.isSelected() && oTemplateUtils.oCommonUtils.setEnabledToolbarButtons(oTableRow);
                });
            }

            /**
             *
             * This method iterates through the contexts in the table 
             * and removes the inactive contexts (inline creation rows) which are not yet edited.
             * @param {*} oSmartTable
             */
               function fnDeleteCreationRows (oSmartTable) {
                var oSmartTableHandler = fnGetSmartTableHandler(oSmartTable),
                    oItemsBinding = oSmartTableHandler.getBinding();

                if (oItemsBinding.isResolved() && oItemsBinding.isLengthFinal()) {
                    oItemsBinding.getAllCurrentContexts().forEach(function (oContext){
                        if (oContext.isInactive() && !oEditedRowContexts.has(oContext.getPath())) {
                            oContext.delete();
                        }
                    });
                }
            }

            /**
             * When the component is already rendered, immediately invokes the callback.
             * Otherwise, invokes the callback after the first render.
             *
             * @param {sap.ui.core.Control} oControl Control to be rendered
             * @param {Function} fnCallback Callback function to be invoked after render
             */
             function fnInvokeCallbackAfterRendering (oControl, fnCallback) {
                var oEventDelegate;

                if (oControl.getDomRef()) {
                    fnCallback();
                } else {
                    oEventDelegate = oControl.addEventDelegate({
                        onAfterRendering: function () {
                            fnCallback();
                            oControl.removeEventDelegate(oEventDelegate);
                        }
                    });
                }
            }

            /**
             * ------------------------------------ 
             * Handling the creation button click
             * ------------------------------------
             * If table's creation mode is "creationRows"
             *  - Focuses the first editable field on the first inline creation row
             * If creation mode is "creationRowsHiddenInEditMode"
             *  - If the doesn't have "Inline Creation Rows", adds them
             *  - Otherwise, focuses the first editable field on the first inline creation row
             * 
             * @param {*} oSmartTable Smart Table
             */
            function fnHandleAddEntry (oSmartTable) {
                var oSmartTableHandler = fnGetSmartTableHandler(oSmartTable),
                    sSmartTableCreationMode = fnGetSmartTableCreationMode(oSmartTable);

                if (sSmartTableCreationMode === CREATION_MODE.INLINE_CREATION_ROWS) {
                    oSmartTableHandler.focusOnFirstTransientRow();
                }  else if (sSmartTableCreationMode === CREATION_MODE.INLINE_CREATION_ROWS_HIDDEN_IN_EDIT_MODE) {                    
                    if (!fnDoesTableHaveCreationRows(oSmartTableHandler.getBinding()))  {
                        fnAddCreationRows(oSmartTable);
                    } else {
                        oSmartTableHandler.focusOnFirstTransientRow();                   
                    }
                }   
            }

            return {
                onBeforeRebindObjectPage: fnOnBeforeRebindObjectPage,
                addCreationRows: fnAddCreationRows,
                addCreationRowsImpl: fnAddCreationRowsImpl,
                onBeforeRebindControl: fnOnBeforeRebindControl,
                handleAddEntry: fnHandleAddEntry
            };

        }

        return BaseObject.extend("sap.suite.ui.generic.template.ObjectPage.controller.inlineCreationRows.InlineCreationRowsHelper", {
            constructor: function (oObjectPage, oTemplateUtils, fnGetSmartTableCreationMode, oController, oMessageStripHelper) {
                extend(this, getMethods(oObjectPage, oTemplateUtils, fnGetSmartTableCreationMode, oController, oMessageStripHelper));
            }
        });
    });
