sap.ui.define([
    "sap/ui/base/Object",
    "sap/base/util/extend",
	"sap/ui/model/base/ManagedObjectModel",
    "sap/suite/ui/generic/template/genericUtilities/controlHelper",
	"sap/suite/ui/generic/template/genericUtilities/expressionHelper",
    "sap/suite/ui/generic/template/genericUtilities/testableHelper",
	"sap/m/plugins/CellSelector"
], function(BaseObject, extend, ManagedObjectModel, controlHelper, expressionHelper, testableHelper, CellSelector) {
    "use strict";
    
	function getMethods(oController, oCommonUtils, oComponentUtils, oSmartTable) {
        // Immutable instance attributes
        var oInnerTable = oSmartTable.getTable();
		var bIsMTable = controlHelper.isMTable(oInnerTable);
		var bIsUiTable = controlHelper.isUiTable(oInnerTable);
		var bIsTreeTable = controlHelper.isTreeTable(oInnerTable);
		var sEntryAggregationName = bIsUiTable ? "rows" : "items";
        
        function fnGetBinding() {
            return oInnerTable.getBinding(sEntryAggregationName);
        }

        function fnGetBindingPath() {
            return oSmartTable.getTableBindingPath();
        }

        function fnGetVisibleProperties(bSort) {
            return oInnerTable.getColumns(bSort);
		}

		function getSelectedIndicesForUiTable(){
			var oSelectionPlugin = oInnerTable.getPlugins().find(function (oPlugin) {
				return oPlugin.isA("sap.ui.table.plugins.SelectionPlugin");
			});
			var aIndex = oSelectionPlugin ? oSelectionPlugin.getSelectedIndices() : oInnerTable.getSelectedIndices();
			return aIndex || []; // getSelectedIndices() doesn't return anything if rows are not loaded			
		}

		function fnIndicesToContexts(aIndices){ // only valid for UiTables
			var aRet = [];
			aIndices.forEach(function(i){
				var oContext = oInnerTable.getContextByIndex(i);
				if (oContext) { // edge case handling where sap.ui.table maintains selection for a row when last item in the table is deleted
					aRet.push(oContext);
				}
			});
			return aRet;			
		}

		function fnGetSelectedContexts() {
			if (bIsMTable) {
				return oInnerTable.getSelectedContexts();
			} 
			// UiTable
			var aIndices = getSelectedIndicesForUiTable();
			return fnIndicesToContexts(aIndices);
		}
		
        // This is done on basis of best effort. If no list binding is there currently a faulty value is returned. For special table types (TreeTable, Analytical table) the result
        // might be problematic (could be faulty or an array containing faulty entries).
        function getCurrentContexts(){
			var oListBinding = fnGetBinding();			
			if (!oListBinding){
				return null;
			}
			if (bIsTreeTable) { // special handling for Tree tables
				var iContextsLength = (oListBinding.getLength() > 0 ) ? oListBinding.getLength() : 0;
				var aRet = [];
				for (var index = 0; index < iContextsLength; index++) {
					var oContext = oListBinding.getContextByIndex(index);
					aRet.push(oContext);
				}
				return aRet;
			}
			
			return oListBinding.getAllCurrentContexts();
        }

		function fnGetModel() {
			return oSmartTable.getModel();
		}

		function getTemplateSortOrder() {
			var aSortOrder = [];
			var oTemplateSortOrder = oSmartTable.getCustomData().find(function (element) {
				return element.getKey() === "TemplateSortOrder";
			});
			var sTemplateSortOrder = oTemplateSortOrder && oTemplateSortOrder.getValue();
			if (sTemplateSortOrder) {
				sTemplateSortOrder.split(", ").forEach(function (oSort) {
					var aSort = oSort.split(" ");
					aSortOrder.push({
						Property: aSort[0],
						Descending: aSort.length > 1
					});
				});
			}
			return aSortOrder;
		}
        
        function fnGetItems() {
			return oInnerTable.getAggregation(sEntryAggregationName);
        }

		function fnSetEnabledToolbarButtons() {
			/* TODO: the only information retrieved from the control itself is the selected contexts, its model and the toolbar. For this, we already have methods in this 
			   class, so ideally, this information should be passed to a corresponding method in commonUtils, that would not need to know the presentationControl.
			   So, setEnabledToolbarButtons method in commonUtils should be refactored accordingly. */
			return oCommonUtils.setEnabledToolbarButtons(oSmartTable);
		}

		function fnSetEnabledFooterButtons() {
			/* TODO: the only information retrieved from the control itself is the selected contexts and the entity set. So ideally, this information should be passed to a 
			   corresponding method in commonUtils, that would not need to know the presentationControl. So, setEnabledFooterButtons method in commonUtils should be refactored
			   accordingly.*/
			return oCommonUtils.setEnabledFooterButtons(oSmartTable);
		}

		function fnSetCurrentVariantId(sVariantId) {
			oSmartTable.attachAfterVariantInitialise(function () {
				oSmartTable.setCurrentVariantId(sVariantId);
			});
			// incase the control variant is already initialized
			oSmartTable.setCurrentVariantId(sVariantId);
		}

		function fnGetBindingInfo() {
			return oInnerTable.getBindingInfo(sEntryAggregationName);
		}
		
		function fnHandleReceivedEvent(fnResolve, fnReject, oEvent){
			fnResolve(oEvent);
		}

		/* @param {string} sBatchGroupId - Batch GroupId Id is used to merge the batch request
		   @param {boolean} bNoMessageRefresh - can be used to suppress the refresh of the header messages in edit mode. Used in lazy loading.*/
		function fnRefresh(sBatchGroupId, bNoMessageRefresh) {
			var oBindingInfo = fnGetBindingInfo();
			if (oBindingInfo && oBindingInfo.binding) {
				return new Promise(function(fnResolve, fnReject){
					var fnDataReceived = function(oEvent){
						oBindingInfo.binding.detachDataReceived(fnDataReceived);
						fnHandleReceivedEvent(fnResolve, fnReject, oEvent);
					};
					oBindingInfo.binding.attachDataReceived(fnDataReceived);
					// Pass the BatchGroupId only if it is being supplied
					if (sBatchGroupId) {
						oBindingInfo.binding.refresh(sBatchGroupId);
					} else {
						oBindingInfo.binding.refresh();
					}
					if (!bNoMessageRefresh && oController.getView().getModel("ui").getProperty("/editable")) {
						oComponentUtils.messagesRefresh(sBatchGroupId);
					}					
				});
			} else {
				return fnRebind();
			}
		}

        function fnRebind() {
			return new Promise(function(fnResolve, fnReject){
				var fnBeforeRebindTable = function(oEvent){
					oSmartTable.detachBeforeRebindTable(fnBeforeRebindTable);
					var oBindingParams = oEvent.getParameters().bindingParams;
					var fnDataReceived = oBindingParams.events.dataReceived || Function.prototype;
					var fnDataReceivedExtended = function(oReceivedEvent){
						fnDataReceived.call(this, oReceivedEvent);
						fnHandleReceivedEvent(fnResolve, fnReject, oReceivedEvent);
					};
					oBindingParams.events.dataReceived = fnDataReceivedExtended;
				};
				oSmartTable.attachBeforeRebindTable(fnBeforeRebindTable);
				oSmartTable.rebindTable();
			});
		}

		function fnApplyNavigationSortOrder(aNavigationSortOrders) {
            var oOwnerComponent = oController.getOwnerComponent();
            var oMetaModel = oOwnerComponent.getModel().getMetaModel();
            var aNonSortableProperties = [];
            var oSortRestrictions = oMetaModel.getODataEntitySet(oOwnerComponent.getEntitySet())["Org.OData.Capabilities.V1.SortRestrictions"];
            if (oSortRestrictions && oSortRestrictions.NonSortableProperties) {
                aNonSortableProperties = oSortRestrictions.NonSortableProperties.map(function(oProperty) {
                    return oProperty.PropertyPath;
                });
            }
            var aRelevantSortOrders = aNavigationSortOrders.filter(function(oProperty) {
                return !aNonSortableProperties.includes(oProperty.Property);
            });
            var oUiState = oSmartTable.getUiState();
            var oPresentationVariant = oUiState.getPresentationVariant();
            if (!oPresentationVariant.SortOrder) {
                oPresentationVariant.SortOrder = getTemplateSortOrder();
            }
            oPresentationVariant.SortOrder = oPresentationVariant.SortOrder.concat(aRelevantSortOrders);
            oUiState.setPresentationVariant(oPresentationVariant);
            oSmartTable.setUiState(oUiState);
        }

        function fnScrollToSelectedItemAsPerChildContext(sCurrentChildContext) {
            if (bIsMTable){ // currently only mTable is supported
                var iIndex = oInnerTable.getItems().findIndex(function(oItem) {
                    return oItem.getBindingContextPath() === sCurrentChildContext;
                });
                if (iIndex > -1) {
                    oInnerTable.scrollToIndex(iIndex);
                }
            }
        }
        
		//Accepts row context object and returns the index of Grid Table row
		function getGridTableRowIndexFromContext(oContext) {
			var sRowPath = oContext.getPath();
			var iRet = -2;
			for (var iRowIndex = 0; iRet === -2; iRowIndex++) {
				var oRowContext = oInnerTable.getContextByIndex(iRowIndex); //Get the row context for each row starting from first
				var sCurrentPath = oRowContext && oRowContext.getPath();
				if (sCurrentPath === sRowPath) { //Check to find the row that matches with new row context by comparing path
					iRet = iRowIndex; //Row found. No further iterations required
				} else if (!oRowContext) {
					iRet = -1; //Row not found. Return -1 to indicate
				}
			}
			return iRet;
		}

		//Accepts row context in Grid Table and returns the Grid table row
		function getGridTableRow(oContext) {
			var iFirstVisibleRowIndex = oInnerTable.getFirstVisibleRow();
			var iVisibleRowCount = oInnerTable.getVisibleRowCount();
			var sRowPath = oContext.getPath();
			for (var i = 0; i < iVisibleRowCount; i++) {
				if (oInnerTable.getContextByIndex(iFirstVisibleRowIndex + i).getPath() === sRowPath) {
					return oInnerTable.getRows()[i];
				}
			}
		}

		// Returns the sap.m.Column instance relevant for oCell provided oCell is a control that is (contained in) a cell of the table
		function getColumnForCell(oCell){
			var oCellControl = oCell;
			var oTableRow, bIsRow;
			// After the following loop oTableRow will be an instance of either sap.ui.table.Row or sap.m.ColumnListItem containing oCell.
			// oCellControl will be the direct child of oRow that contains (or is equal to) oCell.
			// bIsRow will be true if oTableRow is actually a sap.ui.table.Row (expected to be equivalent to bIsUiTable)
			for (var oCandidate; oCellControl && !oTableRow; oCellControl = oTableRow ? oCellControl : oCandidate){
				var oCandidate = oCellControl.getParent();
				var bIsRow = controlHelper.isRow(oCandidate);
				oTableRow = (bIsRow || controlHelper.isColumnListItem(oCandidate)) && oCandidate;
			}
			if (oTableRow){ // if the controls could be identified as described above
				var iIndex = oTableRow.indexOfCell(oCellControl);
				var aColumns = oInnerTable.getColumns();
				if (bIsRow){ // in this case we need to eliminate the columns that are invisible
					aColumns = aColumns.filter(function(oColumn){
						return oColumn.getVisible();
					});
				}
				return aColumns[iIndex];
			}
		}
		
		// Returns the label for the specified column. Thereby vColumnDef is either an instance of sap..Column or a string (namely the ColumnKey).
		function getColumnLabel(vColumnDef){
			// Use a private api of SmartTable until they provide a better method
			return oSmartTable._getColumnLabel(vColumnDef);                            
		}
		
		// Expose selected private functions to unit tests
		/* eslint-disable */
		testableHelper.testable(getGridTableRow, "getGridTableRow");
		testableHelper.testable(getGridTableRowIndexFromContext, "getGridTableRowIndexFromContext");
		/* eslint-enable */

		function getFirstFocussableInputForRow(oTableRow){
			var oRet = controlHelper.searchInTree(oTableRow, function(oControl){
				return controlHelper.isSmartField(oControl) ? controlHelper.getSmartFieldIsFocussableForInputPromise(oControl).then(function(bIsFocussable){
					return bIsFocussable && oControl;
				}) : null;	
			});
			return Promise.resolve(oRet);
		}
		
		function setFocusOnFirstEditableFieldInTableRowImpl(oTableRow){
			getFirstFocussableInputForRow(oTableRow).then(function(oTarget){
				controlHelper.focusUI5Control(oTarget || oTableRow); // if no focussable cell could be found, focus on the whole row
			});
		}

		function getRowForContextInMTable(oContext){
			var aItems = oInnerTable.getItems(); //Get all the rows of table
			var oTableRow = aItems.find(function(oItem){
				return oContext.getPath() === oItem.getBindingContext().getPath();
			});
			return oTableRow;			
		}

		function fnSetFocusOnFirstEditableFieldInTableRow(oContext){
			if (bIsMTable) {
				var oTableRow = getRowForContextInMTable(oContext);
				if (oTableRow) {
					setTimeout(function () {
						setFocusOnFirstEditableFieldInTableRowImpl(oTableRow);
					}, 0);
				}
			} else {
				var iRowIndex = getGridTableRowIndexFromContext(oContext);
				if (iRowIndex !== -1) { //If row found
					oInnerTable.setFirstVisibleRow(iRowIndex); //Make the Table row visible. This does not ensure position of row in the visible view port
					//setTimeout being a macrotask ensures event has propagated at all levels and screen has rendered with changes
					setTimeout(function () {
						var oTableRow = getGridTableRow(oContext);
						setFocusOnFirstEditableFieldInTableRowImpl(oTableRow);
					}, 0);
				}
			}
		} 
		
		function getFirstFocussableEditableCellPromise(){
			return new Promise(function(fnResolve, fnReject){
				fnExecuteWhenUnbusy(function(){
					Promise.resolve(controlHelper.searchInTree(oInnerTable, function(oControl){
						if (controlHelper.isSmartField(oControl)){ // check whether the SmartField is the correct target for focussing
							return  controlHelper.getSmartFieldIsFocussableForInputPromise(oControl).then(function(bIsFocussable){
								return bIsFocussable && oControl; // If the SmartField has turned out to be focussable take it. Otherwise no need to investigate the subtree below it. 
							});
						}
					})).then(fnResolve);
				});
			});
		}
        
        function getThreshold(){
			return bIsMTable ? oInnerTable.getGrowingThreshold() : oInnerTable.getThreshold();
        }
        
        function getDataStateIndicator(){
			return oSmartTable.getDataStateIndicator();
        }
        
        function isMTable(){
			return bIsMTable;
        }

		function getToolbar(){
			return oSmartTable.getToolbar();
		}

		function fnGetTitleInfoForItem(oItemContext){
			if (!oItemContext) {
				return;
			}
			var oModel = oItemContext.getModel();
			var sEntitySet = oSmartTable.getEntitySet();
			var oAtI18nModel = oSmartTable.getModel("@i18n");
			var oRb = oAtI18nModel && oAtI18nModel.getResourceBundle();
			var oAnnotationFormatter = expressionHelper.getAnnotationFormatter(oModel, sEntitySet, "/com.sap.vocabularies.UI.v1.HeaderInfo/Title/Value", oRb);
			var sTitle = oAnnotationFormatter.format(oItemContext);
			oAnnotationFormatter.done();
			oAnnotationFormatter = expressionHelper.getAnnotationFormatter(oModel, sEntitySet, "/com.sap.vocabularies.UI.v1.HeaderInfo/Description/Value", oRb);
			var sSubTitle = oAnnotationFormatter.format(oItemContext);
			oAnnotationFormatter.done();			
			return {
				title: sTitle,
				subTitle: sSubTitle
			};
		}

		function fnExecuteWhenUnbusy(fnExecute){
			if (!oInnerTable.getBusy()){
				fnExecute();
				return;
			}
			var oMOM = new ManagedObjectModel(oInnerTable);
			var oBusyBinding = oMOM.bindProperty("/busy");
			var fnChangeHandler = function(){
				oMOM.destroy();
				fnExecuteWhenUnbusy(fnExecute);
			};
			oBusyBinding.attachChange(fnChangeHandler);
		}

		function getUnbusyPromise(){
			return new Promise(function(fnResolve){
				fnExecuteWhenUnbusy(fnResolve);
			});
		}

		function fnIsLengthFinal () {
			return bIsMTable || fnGetBinding().isLengthFinal();
		}

		function fnGetFirstTransientRowContext () {
			var aItems = fnGetItems(),
				iRowCount = bIsMTable ? aItems.length : fnGetBinding().getLength();

			for (var i = 0; i < iRowCount; i++) {
				var oCurrentRowContext = bIsMTable ? aItems.at(i).getBindingContext() : oInnerTable.getContextByIndex(i);
				if (oCurrentRowContext.isInactive()) {
					return oCurrentRowContext;
				}
			}
		}

		function fnFocusOnFirstTransientRow () {
			var oFirstTransientRowContext = fnGetFirstTransientRowContext();
			if (oFirstTransientRowContext) {
				fnSetFocusOnFirstEditableFieldInTableRow(oFirstTransientRowContext);
			}
		}

		function fnGetPressedItemParameter() {
			return bIsMTable ? "listItem" : "item";
		}

		// As this function is synchronous it may fail for grid tables if the requested row is currently not visible. See fnSetFocusOnFirstEditableFieldInTableRow for a way to overcome this
		function getRowForContext(oContext){
			return bIsMTable ? getRowForContextInMTable(oContext) : getGridTableRow(oContext);
		}

		/* Analyzes the right mouse click event which was triggered for this table and returns information which row contexts should be affected by the click event. */
		function getFocusInfoForContextMenuEvent(oEvent){
			var oFocussedBindingContext;
			if (bIsMTable){
				var oFocussedListItem = oEvent.getParameter("listItem");
				oFocussedBindingContext = oFocussedListItem && oFocussedListItem.getBindingContext();
			} else {
				var iFocussedRowIndex = oEvent.getParameter("rowIndex");
				var aFocussedContexts = iFocussedRowIndex < 0 ? [] : fnIndicesToContexts([iFocussedRowIndex]);
				oFocussedBindingContext = aFocussedContexts[0];
			}
			var aSelectedContexts = fnGetSelectedContexts();
			var bIsFocussedContextSelected = !!oFocussedBindingContext && aSelectedContexts.indexOf(oFocussedBindingContext) >= 0;
			var bDoesApplicableEqualSelected = bIsFocussedContextSelected || !oFocussedBindingContext;
			var aApplicableContexts = bDoesApplicableEqualSelected ? aSelectedContexts : [oFocussedBindingContext]; 
			return {
				focussedBindingContext: oFocussedBindingContext,
				applicableContexts: aApplicableContexts,
				doesApplicableEqualSelected: bDoesApplicableEqualSelected
			};			
		}

		/**
		 * Returns the array of property names of visible columns in the table
		 */
		function fnFindVisibleColumnProperties () {
			var aVisibleColumns = bIsMTable ? oInnerTable.getRenderedColumns() : oInnerTable._getVisibleColumns();
            return aVisibleColumns.map(function (oColumn) {
				return oColumn.data("p13nData").leadingProperty;
			});
		}

		/**
		 * For the given array of properties, returns the hidden properties in the table p13n
		 * @param {Array<String>} aProps Array of properties
		 */
		function fnFindHiddenColumnProperties (aProps) {
			var aVisiblePropsInTable = fnFindVisibleColumnProperties();
            return aProps.filter(function (sProp) {
                return !aVisiblePropsInTable.includes(sProp);
            });
		}

		function fnAddCellSelector() {
			if (bIsUiTable) {
				oSmartTable.addDependent(new CellSelector());
			}
		}

		// public instance methods
		return {
            getBinding: fnGetBinding,
            getBindingPath: fnGetBindingPath,
            getSelectedContexts: fnGetSelectedContexts,
            getCurrentContexts: getCurrentContexts,
            getVisibleProperties: fnGetVisibleProperties,
            getItems: fnGetItems,
			getBindingInfo: fnGetBindingInfo,
			getModel: fnGetModel,
            setEnabledToolbarButtons: fnSetEnabledToolbarButtons,
            setEnabledFooterButtons: fnSetEnabledFooterButtons,
            setCurrentVariantId: fnSetCurrentVariantId,
            setCurrentTableVariantId: fnSetCurrentVariantId,
            setCurrentChartVariantId: Function.prototype,
            refresh: fnRefresh,
            rebind: fnRebind,
			getUnbusyPromise: getUnbusyPromise,
            applyNavigationSortOrder: fnApplyNavigationSortOrder,
            scrollToSelectedItemAsPerChildContext: fnScrollToSelectedItemAsPerChildContext,
			getColumnForCell: getColumnForCell,
			getColumnLabel: getColumnLabel,
			getFirstFocussableEditableCellPromise: getFirstFocussableEditableCellPromise,
            setFocusOnFirstEditableFieldInTableRow: fnSetFocusOnFirstEditableFieldInTableRow,
            getThreshold: getThreshold,
            getDataStateIndicator: getDataStateIndicator,
			getToolbar: getToolbar,
			getTitleInfoForItem: fnGetTitleInfoForItem,
			isLengthFinal: fnIsLengthFinal,
			focusOnFirstTransientRow: fnFocusOnFirstTransientRow,
            isMTable: isMTable, // for temporary use only. Maybe removed in future.
			getPressedItemParameter: fnGetPressedItemParameter,
			findVisibleColumnProperties: fnFindVisibleColumnProperties,
			findHiddenColumnProperties: fnFindHiddenColumnProperties,
			getRowForContext: getRowForContext,
			getFocusInfoForContextMenuEvent: getFocusInfoForContextMenuEvent,
			addCellSelector: fnAddCellSelector
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.lib.presentationControl.SmartTableHandler", {
		constructor: function(oController, oCommonUtils, oComponentUtils, oSmartTable) {
			extend(this, getMethods(oController, oCommonUtils, oComponentUtils, oSmartTable));
		}
	});
});