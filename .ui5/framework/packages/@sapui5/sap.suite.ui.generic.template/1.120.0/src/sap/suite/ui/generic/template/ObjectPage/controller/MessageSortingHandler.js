sap.ui.define([
	"sap/ui/base/Object",
	"sap/base/util/extend",
	"sap/ui/model/Sorter",
	"sap/ui/core/library",
	"sap/suite/ui/generic/template/lib/MessageUtils",
	"sap/suite/ui/generic/template/genericUtilities/controlHelper"
], function(BaseObject, extend, Sorter, SapCoreLibrary, MessageUtils, controlHelper) {
	"use strict";

	// shortcut for sap.ui.core.MessageType
	var MessageType = SapCoreLibrary.MessageType;

	// This class is a helper class to implement function fnPrepareForMessageHandling within the ControllerImplementation of the object page.
	// For this purpose it provides a single public function getPrepareMessageDisplayPromise, which implements the part of that function
	// that deals with the list binding for the messages to be displayed in the popup/popover.
	// Note that a new instance of this class is created whenever the MessagePopover or the MessageInfluencingCRUDAction popup is opened.
	// The MessageDialog (used for transient messages) is (yet) not using this class.
	function getMethods(oController, oTemplateUtils, oObjectPage) {
		var fnHeartBeat = Function.prototype; // A function that is called when new subtitle information is available. Will be set to a more specific function below.
		
		var mMessageToPlacementInfo; // Cache for message placement infos (see function getMessagePlacementInfo)
		
		var mTableIdToTableInfo; // Cache for table infos (see function getTableInfo). Will be filled for all tables which relate to at least one message.

		var iResortingId; // an id representing a resorting which is already planned for asynchronous execution. Initial if no such resorting is planned.
		
		function fnReset(){ // remove all collected information and prepare to collect new one. Also used for initialization.
			mMessageToPlacementInfo = Object.create(null);
			if (mTableIdToTableInfo){
				for (var sId in mTableIdToTableInfo){
					var oTableInfo = mTableIdToTableInfo[sId];
					oTableInfo.destroy();
				}
			}
			mTableIdToTableInfo = Object.create(null); 
		}

		// adds the following attributes to oPlacementInfo: controlId, pathToControlId, groupers, getItemBindingPath (see getMessagePlacementInfo() below)
		// Thereby aCandidates is the list of controlIds which should be considered.
		function addControlIdToPlacementInfo(aCandidates, oPlacementInfo){
			var mChildToParent = Object.create(null); // helper map that maps each relevant control id to the parent control. Will be filled as a bonus via onElementVisited while executing getPositionableControlId to find the target control for the message 
			var onElementVisited = function (sElementId, oControl, oChild) { // will be called for sElementId being a member of aControlIds and oControl being one of its ancestors, oChild is a child of oControl and was visited previously
				if (oChild) {
					mChildToParent[oChild.getId()] = oControl;
				}
			};
			oPlacementInfo.controlId = oTemplateUtils.oCommonUtils.getPositionableControlId(aCandidates, true, onElementVisited); // Now we have decided which controlId we want to use for sorting and placing of this message. Note that this entry might be faulty
			var aPathToControlId = []; // an array of strings starting with the id of the identified control and ending at the view id. Thereby the array steps up the control hierarchy step by step.
			var oSection, oTable; // will be set to be the section and table the message belongs to (if such controls can be identified)
			// fill aPathToControlId and determine oSection and oTable if possible. This is done by following the child-parent relationship given by mChildToParent starting from oPlacementInfo.controlId. 
			var sControlId;
			for (var oControl = oPlacementInfo.controlId && controlHelper.byId(oPlacementInfo.controlId); oControl; oControl = mChildToParent[sControlId]){
				sControlId = oControl.getId();
				aPathToControlId.push(sControlId);
				oSection = oSection || (controlHelper.isObjectPageSection(oControl) && oControl);
				oTable = oTable || (controlHelper.isSmartTable(oControl) && oControl);					
			}
			aPathToControlId.reverse(); // reverse the order in the path. Now it has the right order for property pathToControlId of the placement info
			oPlacementInfo.pathToControlId = aPathToControlId;
			// Determine groupers from oSection and oTable
			oPlacementInfo.groupers = oSection ? [oSection] : [];
			if (oSection && oTable) { // we might need to determine getItemBindingPath
				oPlacementInfo.groupers.push(oTable);
				if (oPlacementInfo.message.validation){ // as getItemBindingPath is used to retrieve data of table entries currently not shown, this is not relevant for validation messages
					oPlacementInfo.getItemBindingPath = Function.prototype;
				} else {
					var oTableInfo = getTableInfo(oTable);
					if (oTableInfo){
						var sViewBindingPath = oTemplateUtils.oComponentUtils.getBindingPath();
						var sTableBindingPath = oTableInfo.presentationControlHandler.getBindingPath();
						var sFullTableBindingPath = sViewBindingPath + "/" + sTableBindingPath;
						oPlacementInfo.getItemBindingPath = function(){
							var sFullTarget = oPlacementInfo.message.aFullTargets.find(function(sCandidate){ // find a full target which fits to the binding path of the table
								return sCandidate.startsWith(sFullTableBindingPath);
							});
							if (!sFullTarget){
								return null;
							}
							// sFullTarget should now have the following structure: <sFullTableBindingPath><key information within the table>[/<path to a field or sub entity>]
							// Thereby, the [] is optional. The item binding path which should be returned by this function is just <sFullTableBindingPath><key information within the table>.
							// Thus, we have to remove the []-part. Thereby we assume that <key information within the table> does not contain any "/"
							var sTail = sFullTarget.substring(sFullTableBindingPath.length);
							var sKey = sTail.split("/")[0];
							return sFullTableBindingPath + sKey;
						};
					} else { // no table info was created (i.e. oTable does not have a binding)
						oPlacementInfo.getItemBindingPath = Function.prototype;
					}
				}
			} else {
				oPlacementInfo.getItemBindingPath = Function.prototype;
			}			
		}
		
		// This function retrieves placement info for a message on the object page. The placement info is an object possessing the following properties:
		// - message -> the message
		// - controlIds -> maps the control ids which are currently considered for the message to the corresponding control.
		// - controlId -> The control id which is currently taken to determine the placement of the message in the object page (faulty if no placement is possible).
		//   Note that this is possibly not contained in controlIds (namely, if it has been set by fnFindTableForMessage).
		// - pathToControlId -> an array of controlIds starting with the id of the view down to controlId representing the path via a parent-child relationship (empty if controlId is faulty)
		// - groupers -> an array of controls representing the group the message should belong to.
		//   Currently the structure of this array (if not empty) is as follows:
		//   ~ The first entry is the section the message belongs to
		//   ~ A possible second entry contains the SmartTable the message belongs to
		// - getItemBindingPath -> A function that is only relevant if the message belongs to a SmartTable. In this case it returns the binding path for an item within this table
		//   which is related to this message. Note that the function may also return a faulty value (e.g. if the function relates to the table as a whole).
		// Note that mMessageToPlacementInfo is used as a cash, so that the corresponding information can be reused when the same message id with the same (relevant) list of control ids is passed again.
		// Note that parameter oMessage is optional. However, it must be provided if the message identified by sMsgId is no longer in the message model and no entry for sMsgId is contained in
		// mMessageToPlacementInfo, yet.
		function getMessagePlacementInfo(sMsgId, oMessage) {
			var oRet = mMessageToPlacementInfo[sMsgId]; // the placement info to be returned
			if (oRet) { // check whether if is needs to be invalidated due to change of controlIds which is the case if either a new controlId is present or the chosen one is no longer present
				oMessage = oRet.message; // if oMessage is provided, this should be no change. Otherwise we can take the message from the cache.
				var bControlIdChange = oRet.controlId && oRet.controlIds[oRet.controlId]; // if there is a control id which was taken from the list of control ids, we assume a change until we find it
				oMessage.controlIds.some(function (sControlId) {
					if (sControlId === oRet.controlId){
						bControlIdChange = false; // the chosen control id is still present, so this possible reason for invalidation can be excluded
					} else if (!oRet.controlIds[sControlId]){
						bControlIdChange = true;
						return true; // new controlId identified -> invalidation necessary, exit loop
					}
				});
				oRet = !bControlIdChange && oRet; // invalidate cache entry if necessary
			}
			if (!oRet) { // need to determine the placement info
				oMessage = oMessage || MessageUtils.getMessageById(sMsgId);
				var mControlIds = Object.create(null);
				oMessage.controlIds.forEach(function(sControlId){
					mControlIds[sControlId] = controlHelper.byId(sControlId);
				});
				oRet = {
					message: oMessage,
					controlIds: mControlIds
				};
				addControlIdToPlacementInfo(oMessage.controlIds, oRet); // add the missing attributes to oRet
				mMessageToPlacementInfo[sMsgId] = oRet; // add to the cash	
			}
			return oRet;
		}
		
		// This function retrieves table info for a SmartTable on the object page. The table info is an object possessing the following properties:
		// - table -> the corresponding SmartTable
		// - presentationControlHandler -> the corresponding instance of sap.suite.ui.generic.template.lib.presentationControl.SmartTableHandler
		// - messageToMsgInTableInfo -> a map that maps the ids of messages belonging to rows in this table to detailed information about this relationship
		//   More precisely, the detailed information is an object containing the following attributes:
		//   ~ index -> The index of the entry in the table relating to this message, resp. 9999999 if no such entry could be found
		//   ~ rowCurrentlyShown -> Information whether the row this message relates to is currently shown
		//   ~ rowIdentifier -> The human readable identification of the row the message relates to
		//   ~ columnInfo -> Information about the column the message relates to (resp. a faulty value, if no such column could be identified)
		//     More precisely, this is an object containing properties 'label' (string identifying the column) and 'hidden' (boolean informing whether the column is hidden)
		//   This information is set (maybe asynchronously) by addContextInfoToMessageToMsgInTableInfo resp. getDetailsRetrievedPromise.  
		// - tableLoaded -> a Promise which is resolved when the table has finished loading its data and the data which have been loaded have
		//   been used to update the content of the messageToMsgInTableInfo property
		// - destroy ->  a destroy function for this instance
		// - columnInfo -> a map (created on demand) mapping paths that represent columns to the columnInfo as described above
		// Note that mTableIdToTableInfo is used as a cash.
		// Moreover, note that this function returns a faulty value if the table does not possess a binding. However, this information is not cached.		
		function getTableInfo(oTable){
			var sTableId = oTable.getId();
			var oRet = mTableIdToTableInfo[sTableId];
			if (!oRet){
				oRet = createTableInfo(oTable);
				mTableIdToTableInfo[sTableId] = oRet;	
			}
			return oRet;
		}

		// returns the string which is used to identify a row (specified by oContext) within a SmartTable (specified by its PresentationControlHandler)
		function getRowIdentifier(oPresentationControlHandler, oContext){
			var oTitleInfo = oPresentationControlHandler.getTitleInfoForItem(oContext);
			return oTitleInfo && oTitleInfo.title;	
		}

		// creates the columnInfo (see getTableInfo) for a column in a table
		function getColumnInfoForColumn(oTableInfo, oColumn){
			return oColumn && {
				label: oTableInfo.presentationControlHandler.getColumnLabel(oColumn),
				hidden: !oColumn.getVisible()
			};
		}

		// creates the columnInfo (see getTableInfo) for a column specified by a path in a table 
		function createColumnInfoForPath(oTableInfo, sColumnPath){
			var aColumns = oTableInfo.table.getTable().getColumns();
			var oColumnForPath = aColumns.find(function(oColumn){
				var sLeadingProperty = oColumn.getLeadingProperty ? oColumn.getLeadingProperty() : oColumn.data("p13nData").leadingProperty;
				return sLeadingProperty === sColumnPath;
			});
			return getColumnInfoForColumn(oTableInfo, oColumnForPath);
		}

		// retrieves the columnInfo (see getTableInfo) for a column specified by a path in a table
		function getColumnInfoForPath(oTableInfo, sColumnPath){
			var mColumnInfo = oTableInfo.columnInfo;
			if (mColumnInfo){ // if the columnInfo cache already exists
				var oRet = mColumnInfo[sColumnPath];
				if (oRet){       // If the cache possesses an entry for the given column path we can return it
					return oRet;
				}
			} else { // the columnInfo cache needs to be created
				mColumnInfo = Object.create(null);
				oTableInfo.columnInfo = mColumnInfo;
			}
			var oColumnInfo = createColumnInfoForPath(oTableInfo, sColumnPath); // determine the columnInfo for sColumnPath
			mColumnInfo[sColumnPath] = oColumnInfo;                              // and add it to the columnInfo cache
			return oColumnInfo;
		}

		// Determine the columnInfo (see getTableInfo) for the message represented by oPlacementInfo within the table represented by oTableInfo
		function getColumnInfoForMessage(oPlacementInfo, oTableInfo){
			var sBindingPath = oPlacementInfo.getItemBindingPath();
			var sRelevantTarget = oPlacementInfo.message.aFullTargets.find(function(sFullTarget){
				return sFullTarget.startsWith(sBindingPath);
			}); // find the relevant target information 
			if (!sRelevantTarget){
				return;
			}
			// determine the path to the column
			var sColumnPath = sRelevantTarget.substring(sBindingPath.length);
			if (sColumnPath.startsWith("/")){
				sColumnPath = sColumnPath.substring(1);
			}
			// if sColumnPath is empty the whole table should be considered as target. If sColumnPath contains a "(" the target points to a sub entity of the current item
			// In both cases no column can be identified
			if (!sColumnPath || sColumnPath.indexOf("(") > 0){
				return;
			}
			return getColumnInfoForPath(oTableInfo, sColumnPath);
		}
		
		// This function analyzes a context belonging to a table and adds the information about the
		// messages related to this context to oTableInfo.messageToMsgInTableInfo.
		function addContextInfoToMessageToMsgInTableInfo(oTableInfo, oContext, iPosition){
			var aMessages = oContext && oContext.getMessages();
			if (aMessages && aMessages.length){ // if this context has at least one message
				var sRowIdentifier = getRowIdentifier(oTableInfo.presentationControlHandler, oContext);
				aMessages.forEach(function(oMessage){
					var oPlacementInfo = getMessagePlacementInfo(oMessage.id, oMessage);
					if (!oPlacementInfo.controlId){ // no control has been determined for this message yet -> the table can be used
						addControlIdToPlacementInfo([oTableInfo.table.getId()], oPlacementInfo);
					}
					if (oPlacementInfo.groupers[1] === oTableInfo.table){ // ignore messages that are grouped somewhere else 
						var	oEntry = {
							index: iPosition < 0 ? 9999999 : iPosition,
							rowCurrentlyShown: iPosition >= 0,
							rowIdentifier: sRowIdentifier,
							columnInfo: getColumnInfoForMessage(oPlacementInfo, oTableInfo)
						};
						oTableInfo.messageToMsgInTableInfo[oMessage.id] = oEntry;
					}					
				});
			}
		}
		
		// create the table info object (see getTableInfo above) which does not exist yet.
		function createTableInfo(oTable){
			var oPresentationControlHandler = oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oTable);
			var oBinding = oPresentationControlHandler.getBinding();
			if (!oBinding){
				return null;
			}
			var bDestroyed = false;
			var oRet = {
				table: oTable,
				presentationControlHandler: oPresentationControlHandler,
				messageToMsgInTableInfo: Object.create(null)
			};
			var fnSetMessageToMsgInTableInfo = function(){ // sets or resets the messageToMsgInTableInfo property of oRet
				if (bDestroyed){
					return;
				}
				var mPreviousMessageToMsgInTableInfo = oRet.messageToMsgInTableInfo; // the old content might be useful (see below)
				oRet.messageToMsgInTableInfo = Object.create(null);  // However, we create the content from scratch now
				// Analyze all rows currently existing in the table for messages belonging to them
				if (!controlHelper.isTreeTable(oTable.getTable())) {	// temporarily disabled for tree tables until oContext.getMessages() is fixed by the model component
					var fnHandleContext = addContextInfoToMessageToMsgInTableInfo.bind(null, oRet);
					var aContexts = oPresentationControlHandler.getCurrentContexts() || [];
					aContexts.forEach(fnHandleContext);
				}
				// mPreviousMessageToMsgInTableInfo might contain information for messages belonging to rows
				// meanwhile filtered out. Do not loose this information.
				for (var sMsgId in mPreviousMessageToMsgInTableInfo){
					if (!oRet.messageToMsgInTableInfo[sMsgId]){
						var oPreviousEntry = mPreviousMessageToMsgInTableInfo[sMsgId];
						var oMessage = MessageUtils.getMessageById(sMsgId);
						oPreviousEntry.rowCurrentlyShown = oMessage && oMessage.validation;
						oRet.messageToMsgInTableInfo[sMsgId] = oPreviousEntry;
					}
				}
				fnHeartBeat(); // new information available -> inform clients that they may need to update
			};
			// messageToMsgInTableInfo will be filled the first time when the data for the table have been selected.
			// tableLoaded indicates when this has happened.
			oRet.tableLoaded = oPresentationControlHandler.getUnbusyPromise().then(fnSetMessageToMsgInTableInfo);
			// when the binding reloads data the information should be updated
			oBinding.attachChange(fnSetMessageToMsgInTableInfo);
			// when the ui state changes we need to clean more information, since in this case even the visibility
			// information for the columns may have changed.
			oTable.attachUiStateChange(fnReset);
			oRet.destroy = function(){
				bDestroyed = true;
				oBinding.detachChange(fnSetMessageToMsgInTableInfo);
				oTable.detachUiStateChange(fnReset);
			};
			return oRet;
		}

		// Function to get group name for a message. Messages are grouped based on the controls they refer to.
		// The corresponding controls are contained in property 'groupers' of the placement info for that message.
		// groupers is an array which is either empty (message could not be assigned to a specific group), contains one entry which is an object page section,
		// or contains two entries (an object page section and a table within this section). 
		// Depending on the case the group is built.
		function getGroupTitle(sMsgId) {
			var oPlacementInfo = getMessagePlacementInfo(sMsgId);
			var aGroupers = oPlacementInfo.groupers;
			switch (aGroupers.length) {
				case 0:
					return oTemplateUtils.oCommonUtils.getText("GENERIC_MESSAGE_GROUP_NAME");
				case 1:
					return aGroupers[0].getTitle();
				default:
					var sTitle = aGroupers[0].getTitle();
					var oTable = aGroupers[1];
					var sTableHeader = oTable.getHeader();
					return oTemplateUtils.oCommonUtils.getText("MESSAGE_GROUP_TABLE", [sTitle, sTableHeader]);
			}
		}

		// This function returns bias value based on the type of message
		function getBiasForMessageType(sMessageType) {
			switch (sMessageType) {
				case MessageType.Error:
					return 1;
				case MessageType.Warning:
					return 2;
				case MessageType.Success:
					return 3;
				case MessageType.Information:
					return 4;
				case MessageType.None:
					return 5;
				default:
					return 6;
			}
		}

		// Sorter that compares the position of two child controls which have a common parent. One (but not both) of the children might be faulty (which would make it the larger one).
		// Returns a positive integer when oChild1 is larger, a negative number if oChild2 is larger, and 0 if they are identical
		function fnControlSorter(oCommonParent, oChild1, oChild2) {
			if (!oChild1) {
				return oChild2 ? 1 : 0;
			}
			if (!oChild2) {
				return -1;
			}
			return controlHelper.sortChildControls(oCommonParent, oChild1, oChild2);
		}

		// This method implements the ordering which should be applied to the list of messages.
		// Therefore the method provides a comparison between two messages (oMsgObj1, oMsgObj2), returning a negative number if oMsgObj1 should be listed first,
		// a positive number, if oMsgObj2 should be displayed first, and 0 if there is no preference.
		// The logic is as follows:
		// If the messages belong to different sections they should be sorted according to the position of those sections on the page.
		// If one of the messages belongs to a section but the other one not, then the one belonging to a section should be shown first.
		// If both messages do not belong to a section they should be sorted by reverse severity
		// If both messages belong to the same section, but one of them belongs to a table whereas the other does not, then the message belonging to a table should be shown first
		// If both messages belong to the same section but to different tables within this section they should be sorted according to the position of the tables within the section
		// If both messages belong to the same table, but to different selected rows within the table they should be sorted according to the position of that table
		// If both messages belong to the same table, but only one of them to a selected row, this one should be shown first
		// If both messages belong the same table, but to different non-selected rows an artificial stable sorting of those rows is assumed (based on the item binding path)
		// If both messages belong to the same table and to the same row (which may be none) or to the same section and both to no table then they are sorted by
		// - reverse severity (if the severity is different) 
		// - position of the most specific control which has been found for them (if the severity is equal)
		// If none of the above conditions provides a distinction then the messages are sorted alphabetically 
		function fnCompare(oMsgObj1, oMsgObj2) {
			var oPlacementInfo1 = getMessagePlacementInfo(oMsgObj1.id);
			var oPlacementInfo2 = getMessagePlacementInfo(oMsgObj2.id);
			var bSameGroup = oPlacementInfo1.groupers.length === oPlacementInfo2.groupers.length && oPlacementInfo1.groupers.every(function (oControl, i) {
				return oPlacementInfo2.groupers[i] === oControl;
			});
			if (bSameGroup) {
				var sItemBindingPath1 = oPlacementInfo1.getItemBindingPath();
				var sItemBindingPath2 = oPlacementInfo2.getItemBindingPath();
				if (sItemBindingPath1 !== sItemBindingPath2){
					var oTable = oPlacementInfo1.groupers[1];
					var oTableInfo = getTableInfo(oTable);
					var oMessageInTableInfo1 = oTableInfo && oTableInfo.messageToMsgInTableInfo[oMsgObj1.id];
					var oMessageInTableInfo2 = oTableInfo && oTableInfo.messageToMsgInTableInfo[oMsgObj2.id];
					if (oMessageInTableInfo1 && oMessageInTableInfo2){
						if (oMessageInTableInfo1.index !== oMessageInTableInfo2.index){
							return oMessageInTableInfo1.index - oMessageInTableInfo2.index;
						}
					} else if (oMessageInTableInfo1 || oMessageInTableInfo2){
						return 1 - 2 * !oMessageInTableInfo2;
					}
					return ("" + sItemBindingPath1).localeCompare("" + sItemBindingPath2);
				}
				var iRet = getBiasForMessageType(oMsgObj1.type) - getBiasForMessageType(oMsgObj2.type); // check whether they can be sorted by severity
				if (iRet || !(oPlacementInfo1.controlId || oPlacementInfo2.controlId)) { // if yes, we are done. We are also done, if both messages could not be assigned to a place on the UI
					return iRet || oMsgObj1.message.localeCompare(oMsgObj2.message);
				}
			}
			if (!bSameGroup && (oPlacementInfo1.groupers.length === 1 || oPlacementInfo2.groupers.length === 1) && oPlacementInfo1.groupers[0] === oPlacementInfo2.groupers[0]) {
				// message belong to the same section, but one belongs to a table and one cannot be associated to a table
				return oPlacementInfo1.groupers.length - oPlacementInfo2.groupers.length;
			}
			// Try to sort be position within the page
			var aPath1 = oPlacementInfo1.pathToControlId;
			var aPath2 = oPlacementInfo2.pathToControlId;
			var iMaxPathLength = Math.max(aPath1.length, aPath2.length);
			for (var i = 0; i < iMaxPathLength; i++) {
				if (aPath1[i] !== aPath2[i]) {
					var oLastCommonParent = i === 0 ? oObjectPage : controlHelper.byId(aPath1[i - 1]);
					return fnControlSorter(oLastCommonParent, (i < aPath1.length) && controlHelper.byId(aPath1[i]), (i < aPath2.length) && controlHelper.byId(aPath2[i]));
				}
			}
			return oMsgObj1.message.localeCompare(oMsgObj2.message);
		}

		// Read the entry for the specified binding path without updating the state messages, and call the specified function on the context obtained from this read (resp. null, if the read did not succeed)
		// Note: Suppressing the state messages is done to prevent that the content of the itemBinding this class relies on is modified while this instance is in use.
		function performFunctionOnContext(oModel, sBindingPath, fnFunction){
			// The commented code is not supported by the OData model yet
/*			oModel.createBindingContext(sBindingPath, null, {
				transitionMessagesOnly: true
			}, fnFunction);
*/

			oModel.read(sBindingPath, {
				headers: {"sap-messages" : "transientOnly"},
				canonicalRequest : false,
				error : fnFunction.bind(null, null),
				updateAggregatedMessages : false,
				success: function(oData){
					var sKey = oData && oModel._getKey(oData);	
					var oNewContext = sKey ? oModel.getContext('/' + sKey, sBindingPath) : null;
					fnFunction(oNewContext);
				}
			});			
		}

		// sBindingPath is a binding path pointing to a potential row in a SmartTable. oTableInfo is the info object for this table (see getTableInfo above).
		// aBindingPathMessages is an array containing messages which are considered to belong to the potential row.
		// Note that the array may be updated even after this method has been called.
		// This method will consider all messages that have been added to aBindingPathMessages before the callback passed to performFunctionOnContext is executed.
		// The purpose of this function is to add the information that can be retrieved from the specified row to property messageToMsgInTableInfo of the table info.
		// As this is done asynchronously the method returns a Promise which is resolved as soon as this has happened.
		function getDetailsRetrievedPromise(sBindingPath, oTableInfo, aBindingPathMessages){
			return new Promise(function(fnResolve){
				var oModel = oObjectPage.getModel();
				// Try to retrieve the context for the specified row
				performFunctionOnContext(oModel, sBindingPath, function(oContext){
					if (oContext){ // Data for the specified row could be selected
						// Note: In this case we ignore aBindingPathMessages as we assume that addContextInfoToMessageToMsgInTableInfo will identify the messages belonging to oContext on its own
						addContextInfoToMessageToMsgInTableInfo(oTableInfo, oContext, -1);
					} else { // could not retrieve data for the given row
						// Loop over all messages we have been interested in and add info
						aBindingPathMessages.forEach(function(sMsgId){
							var oPlacementInfo = getMessagePlacementInfo(sMsgId);
							var oTable = oPlacementInfo.groupers[1];
							var oCurrentTableInfo = oTable && getTableInfo(oTable);  // we would expect this to be identical to oTableInfo. However, the assignment of the message could have changed meanwhile.
							if (!oCurrentTableInfo || oCurrentTableInfo.messageToMsgInTableInfo[sMsgId]){ // If the message is no longer attached to a table or message info has already been added
								return;                                                                   // we consider that info to be as good as the one we could provide. Still this is only expected
							}                                                                             // to happen in edge cases
							// Add information that is as good as it can be determined
							oCurrentTableInfo.messageToMsgInTableInfo[sMsgId] = {
								index: 9999999,
								rowCurrentlyShown: false,
								rowIdentifier: "",
								columnInfo: getColumnInfoForMessage(oPlacementInfo, oCurrentTableInfo)
							};
						});
					}
					fnResolve();
				});
			});
		}

		// This function is used to identify a table that can be assigned for the message oMessage. This is only used in case that the standard mechanism provided by UI5 that assigns controls
		// to messages has not provided any result (yet).
		// In this case we loop over all SmartTable known to us until we find a suitable candidate.
		// For this purpose we check whether the binding path of the table "fits" to a full target of the message.
		// Thereby the binding path of the table is determined by concatenating sBindingPathPrefix with the navigation property of the table.
		// If the table is found the corresponding information will be added to mTableInfosReadyPromise by either adding a new entry for the table or extending the existing one.
		function fnFindTableForMessage(oMessage, mTableInfosReadyPromise, sBindingPathPrefix){
			var bFound = false;
			oMessage.aFullTargets.some(function(sFullPath){
				if (sFullPath.startsWith(sBindingPathPrefix)){ // This full target points to a place on the current object page
					oTemplateUtils.oInfoObjectHandler.executeForAllInformationObjects("smartTable", function(oInfoObject){ // Check for all tables whether it even points to the table
						if (!bFound){ // If a suitable table has already been identified skip all other tables
							var sStart = sBindingPathPrefix + oInfoObject.getNavigationProperty();
							if (sFullPath === sStart || sFullPath.startsWith(sStart + "(")){ // If the full target really identifies the table or an entry within the table
								bFound = true;
								var sTableId = oInfoObject.getId();
								var oReadyPromise = mTableInfosReadyPromise[sTableId];
								if (oReadyPromise){ // Table has already been registered for another message
									oReadyPromise.messages.push(oMessage); // add this message to the assignment
								} else { // table not registered yet
									var aMessages = [oMessage]; // additional messages may be added later (see above)
									oReadyPromise = {
										messages: aMessages,
										promise: oInfoObject.getControlAsync().then(function(oSmartTable){
											var oTableInfo = getTableInfo(oSmartTable);
											return oTableInfo && oTableInfo.tableLoaded.then(function(){ // when the data for this table are loaded we can relate the messages found for this table to the table entries
												aMessages.forEach(function(oCollectedMessage){
													var oPlacementInfo = getMessagePlacementInfo(oCollectedMessage.id, oCollectedMessage);
													if (!oPlacementInfo.controlId){ // Only act if still no other logic has assigned a control to this message
														addControlIdToPlacementInfo([sTableId], oPlacementInfo);
													} 
												});
											});
										})
									};
									mTableInfosReadyPromise[sTableId] = oReadyPromise;
								}
							}
						}
					}, true);
				}
				return bFound;
			});
		}
		
		// The public function provided by this class. It is called from function fnPrepareForMessageHandling in ControllerImplementation.
		// Thereby it is assumed that (if considered necessary) all controls on the OP have been rendered and bound.
		// This should ensure that for all considered messages the connection to their controls has already been established.
		// However, this connection is created by ui5 in an asynchronous way, and currently they do not provide a mechanism which
		// lets us wait until this process has been finished.
		// Therefore, as a second chance we try to establish the connection between messages and tables ourselves, based on metadata.
		// This does not help for messages that belong to forms. For these messages the map messageToUpdateFunction is used (see below).
		// Note that for messages which cannot be assigned to tables (i.e. messages that belong to forms) it might be necessary to do a resorting later.
		// - oItemBinding is the binding of the message popover which displays the messages.
		// - aMessages is the array of messages displayed (actually this is redundant, as it could also be retrieved from oItemBinding)
		// - oHelperModel is a JSONModel which is used to communicate with the MessageButtonHelper and the message popover
		// - sBindingPath is the path the object page is currently bound to
		// The purpose of this function is:
		// - Sort oItemBinding correctly
		// - Add the following maps to oHelperModel (key is always the message id):
		//   + messageToGroupName: maps a message to the name of the group it should belong to
		//   + messageToSubtitle: maps a message to its subtitle
		//   + messageToUpdateFunction: maps only those messages which belong to the generic group yet to a function that can be used to repeat the sorting when new information is available for that message
		// - Make sure that function fnHeartBeat (see above) will update property heartBeat in oHelperModel
		// - return a Promise that is resolved as soon as the preparation is done. This Promise resolves to an object which currently has one property 'getSubtitle'. This is actually the
		//   function with this name (see below).
		//   Note: The subtitle function is actually returned twice, namely once by adding messageToSubtitle to oHelperModel and once by returning the corresponding function. 
		function getPrepareMessageDisplayPromise(oItemBinding, aMessages, oHelperModel, sBindingPath){
			fnReset(); // initialize caches
			var mTableInfosReadyPromise = Object.create(null);  // used to collect information about tables which could only be identified via second try
																// maps the id of such a table to an object with attributes:
																// - promise: A Promise resolved when the table is ready and placement info for corresponding messages has been updated
																// - messages: List of messages waiting for which this Promise is used
			aMessages.forEach(function(oMessage){ // create placement info for each relevant message
				var sMsgId = oMessage.id;
				getMessagePlacementInfo(sMsgId, oMessage); // creates and caches the placement info for the message
				if (oMessage.controlIds.length === 0){ // if no control is assigned to this message yet, try the second chance
					fnFindTableForMessage(oMessage, mTableInfosReadyPromise, sBindingPath + "/");
				}
			});
			var aTableInfosReadyPromises = []; // Collect the Promises for all the tables waiting for the second chance in an array
			for (var sTableId in mTableInfosReadyPromise){
				aTableInfosReadyPromises.push(mTableInfosReadyPromise[sTableId].promise);
			}
			var fnSetMapsAndSort = function(){ // The function to be executed when the sufficient information has been collected to sort the messages and update oHelperModel accordingly
				if (iResortingId){ // stop any other resorting which still may be planned and document that currently no resorting is planned
					clearTimeout(iResortingId);
					iResortingId = 0;	
				}
				// Initialize the maps that should be added to oHelperModel
				var mMessageToGroupName = Object.create(null);
				var mMessageToSubtitle = Object.create(null);
				var mMessageToUpdateFunction = Object.create(null);
				var fnSortAgain; // The function that should be called when a resorting is triggered. Initialized on demand
				aMessages.forEach(function(oMessage){ // for each message ensure that it is added to the maps
					var oPlacementInfo = getMessagePlacementInfo(oMessage.id, oMessage); // retrieve the current placement information
					if (oPlacementInfo.groupers.length === 0){ // If the message can only be added to the generic group yet, make sure that it is marked for resorting 
						fnSortAgain = fnSortAgain || function(){
							iResortingId = iResortingId || setTimeout(fnSetMapsAndSort); // if no resorting is planned yet, plan it now
							oHelperModel.setProperty("/messageToUpdateFunction", null); // no further resorting needs to be planned (probably makes the above || superfluous)
						};
						mMessageToUpdateFunction[oMessage.id] = fnSortAgain; // register the message for resorting
					}						
					mMessageToGroupName[oMessage.id] = getGroupTitle(oMessage.id);
					mMessageToSubtitle[oMessage.id] = getSubtitle(oMessage.id, oMessage.additionalText);
				});
				// Update the helper model with the maps
				oHelperModel.setProperty("/messageToGroupName", mMessageToGroupName);
				oHelperModel.setProperty("/messageToSubtitle", mMessageToSubtitle);
				oHelperModel.setProperty("/messageToUpdateFunction", mMessageToUpdateFunction);
				// Trigger the sorting
				var oSorter = new Sorter("");
				oSorter.fnCompare = fnCompare;						
				oItemBinding.sort(oSorter);				
			};
			return Promise.all(aTableInfosReadyPromises).then(function(){ // all tables are ready
				return getMessageSorterForTableInfos().then(function(){				
					fnSetMapsAndSort();
					fnHeartBeat = function(){
						var iHeartBeat = oHelperModel.getProperty("/heartBeat") || 0;
						iHeartBeat++;
						oHelperModel.setProperty("/heartBeat", iHeartBeat);
					};
					return {
						getSubtitle: getSubtitle
					};
				});
			});
		}

		// Returns a Promise which resolves as soon as the loading of relevant table data has finished and the messages which belong to rows already loaded have been assigned accordingly.
		function getMessageSorterForTableInfos(){
			var aTableInfoPromises = [];
			// We are collecting the tableLoaded-Promises of all relevant tables in order to wait for them.
			// Note that this is actually superfluous for those tables which have been found relevant with the second try (see above), since this function will only be called
			// when the corresponding promise in mTableInfosReadyPromise (see above) has been resolved. That promise can only be resolved when the corresponding tableLoaded promise has been resolved.
			for (var sTableId in mTableIdToTableInfo){
				var oTableInfo = mTableIdToTableInfo[sTableId];
				if (oTableInfo){
					aTableInfoPromises.push(oTableInfo.tableLoaded);
				}
			}
			// First we build a Promise that is resolved when the data for all relevant tables (i.e. the tables collected in mTableIdToTableInfo) have been loaded.
			// Note that there may still be messages for which the required table data have not been loaded (due to size limitations of the table or filters which are currently applied).
			// Therefore, a second round of data loading may be required. This will be executed in getMessageSorterForPlacementInfos.
			return Promise.all(aTableInfoPromises).then(getMessageSorterForPlacementInfos);
		}

		// This function is called for all validation messages belonging to cells inside a table.
		// It will update the messageInTableInfo for this message within oTableInfo (see getTableInfo) and also return the messageToTableInfo.
		// This is necessary since the normal mechanism for building this info does not work for validation messages, 
		// as validation messages are not provided by oContext.getMessages(), if oContext is the binding context of the row which contains the validation error.
		function fnAddValidationInfoToTableInfo(oMessage, oTableInfo){
			var oTargetControl = controlHelper.byId(oMessage.controlIds[0]); // As oMessage is a validation message we expect exactly one control to be associated to it
			var oContext = oTargetControl.getBindingContext(); // This should be the row context for the message
			// Now search for oContext within the table in order to determine the position
			var aContexts = oTableInfo.presentationControlHandler.getCurrentContexts() || [];
			var iPosition = -1;
			aContexts.some(function(oCandidateContext, i){ 
				if (oCandidateContext === oContext){
					iPosition = i;
					return true;
				}
			});
			var oColumn = oTableInfo.presentationControlHandler.getColumnForCell(oTargetControl);			
			var oMessageInTableInfo = {
				index: iPosition,
				rowCurrentlyShown: true,
				rowIdentifier: getRowIdentifier(oTableInfo.presentationControlHandler, oContext),
				columnInfo: getColumnInfoForColumn(oTableInfo, oColumn)
			};						
			oTableInfo.messageToMsgInTableInfo[oMessage.id] = oMessageInTableInfo;
			return oMessageInTableInfo;			
		}
		
		// This method is called when the data for all tables that are relevant for messages have been loaded and we have looped over the rows within these tables in
		// order to add them to messageToMsgInTableInfo of the corresponding table info.
		// This may still not have provided the required information for all table related messages due to three possible reasons
		// - The message does not belong to a specific cell within the table but to the table as a whole
		// - The message is a validation message
		// - The message belongs to a row which has not been loaded
		// For the first case we do not have to take any additional action.
		// For the second case we immediately add the missing information using fnAddValidationInfoToTableInfo.
		// For the third case we trigger an additional backend request which will fetch the data for the missing table row.
		// The method returns to a Promise which is resolved as soon as all additional backend requests created for the third case have been executed and their results
		// have also been added to the corresponding messageToMsgInTableInfo.
		// Thus, all in all the returned Promise is resolved as soon as all relevant table data have been fetched and processed.
		function getMessageSorterForPlacementInfos(){
			var aMessageDetailsRetrievedPromises = [];
			var mBindingPathsToMessageList = Object.create(null);
			var fnHandleMessage = function(sMsgId){
				var oPlacementInfo = getMessagePlacementInfo(sMsgId);
				var oTable = oPlacementInfo.groupers[1];
				// Special handling for messages belonging to tables but is temporarily disabled for tree tables until oContext.getMessages() is fixed by the model component
				var oTableInfo = oTable && !controlHelper.isTreeTable(oTable.getTable()) && getTableInfo(oTable);
				if (oTableInfo) {
					var oMessage = oPlacementInfo.message;
					var oMessageInTableInfo = oTableInfo.messageToMsgInTableInfo[sMsgId];
					if (!(oMessageInTableInfo && oMessageInTableInfo.rowCurrentlyShown)){
						if (oMessage.validation){ // second case
							fnAddValidationInfoToTableInfo(oMessage, oTableInfo);
						} else {
							var sBindingPath = oPlacementInfo.getItemBindingPath();
							if (sBindingPath){ // third case
								var aBindingPathMessages = mBindingPathsToMessageList[sBindingPath];
								if (aBindingPathMessages){
									aBindingPathMessages.push(sMsgId);
								} else {
									aBindingPathMessages = [sMsgId];
									mBindingPathsToMessageList[sBindingPath] = aBindingPathMessages;
									var oDetailsRetrievedPromise = getDetailsRetrievedPromise(sBindingPath, oTableInfo, aBindingPathMessages);
									aMessageDetailsRetrievedPromises.push(oDetailsRetrievedPromise);
								}
							} // else: first case
						}
					}														
				}
			};
			for (var sMsgId in mMessageToPlacementInfo){
				fnHandleMessage(sMsgId);
			}			
			return Promise.all(aMessageDetailsRetrievedPromises);			
		}
		
		function getSubtitleForRow(oMessageInTableInfo){
			var sI18NKey = "MSG_SUBTITLE_ROW";
			var aParams = [oMessageInTableInfo.rowIdentifier];
			if (!oMessageInTableInfo.rowCurrentlyShown){
				sI18NKey += "_HIDDEN";
			}
			if (oMessageInTableInfo.columnInfo){
				aParams.push(oMessageInTableInfo.columnInfo.label);
				sI18NKey += "_COLUMN";
				if (oMessageInTableInfo.columnInfo.hidden){
					sI18NKey += "_HIDDEN";
				}
			}
			return oTemplateUtils.oCommonUtils.getText(sI18NKey, aParams);
		}
		
		function getSubtitle(sMsgId, sAdditionalText){
			var oPlacementInfo = getMessagePlacementInfo(sMsgId);
			var oTable = oPlacementInfo.groupers[1];
			if (!oTable){
				return sAdditionalText;
			}
			var oTableInfo = getTableInfo(oTable);
			if (oTableInfo){
				var oMessageInTableInfo = oTableInfo.messageToMsgInTableInfo[sMsgId];
				if (!oMessageInTableInfo && oPlacementInfo.message.validation){
					oMessageInTableInfo = fnAddValidationInfoToTableInfo(oPlacementInfo.message, oTableInfo);
				}
				if (oMessageInTableInfo && oMessageInTableInfo.rowIdentifier){
					return getSubtitleForRow(oMessageInTableInfo); 
				}
			}
			return sAdditionalText;
		}

		// public instance methods
		return {
			getPrepareMessageDisplayPromise: getPrepareMessageDisplayPromise
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.ObjectPage.controller.MessageSortingHandler", {
		constructor: function(oController, oTemplateUtils, oObjectPage) {
			extend(this, getMethods(oController, oTemplateUtils, oObjectPage));
		}
	});
});