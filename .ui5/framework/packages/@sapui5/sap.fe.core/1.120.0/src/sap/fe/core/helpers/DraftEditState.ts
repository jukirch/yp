import Core from "sap/ui/core/Core";
import type { ConditionObject } from "sap/ui/mdc/condition/Condition";
import FilterOperatorUtil from "sap/ui/mdc/condition/FilterOperatorUtil";
import Operator from "sap/ui/mdc/condition/Operator";
import ConditionValidated from "sap/ui/mdc/enums/ConditionValidated";
import OperatorValueType from "sap/ui/mdc/enums/OperatorValueType";
import type Context from "sap/ui/model/Context";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import JSONModel from "sap/ui/model/json/JSONModel";

const feBundle = Core.getLibraryResourceBundle("sap.fe.core");
/**
 * Enum for edit state of a document in an draft enabled service collection.
 * Allows to simplify filtering on a set of documents as described by the
 * individual state
 *
 * @readonly
 * @enum {string}
 */
const EDITSTATE = {
	/**
	 * Active documents that don't have a corresponding draft and all own draft documents
	 */
	ALL: {
		id: "ALL",
		display: feBundle.getText("C_DRAFT_EDIT_STATE_DRAFT_ALL_FILTER")
	},
	/**
	 * Active documents that don't have a draft document
	 */
	UNCHANGED: {
		id: "UNCHANGED",
		display: feBundle.getText("C_DRAFT_EDIT_STATE_DRAFT_UNCHANGED_FILTER")
	},
	/**
	 * Own draft documents
	 */
	OWN_DRAFT: {
		id: "OWN_DRAFT",
		display: feBundle.getText("C_DRAFT_EDIT_STATE_DRAFT_OWN_DRAFT_FILTER")
	},
	/**
	 * Active documents that are locked by other users
	 */
	LOCKED: {
		id: "LOCKED",
		display: feBundle.getText("C_DRAFT_EDIT_STATE_DRAFT_LOCKED_FILTER")
	},
	/**
	 * Active documents that have draft documents by other users
	 *
	 */
	UNSAVED_CHANGES: {
		id: "UNSAVED_CHANGES",
		display: feBundle.getText("C_DRAFT_EDIT_STATE_DRAFT_UNSAVED_CHANGES_FILTER")
	},
	/**
	 * Active documents only
	 */
	ALL_HIDING_DRAFTS: {
		id: "ALL_HIDING_DRAFTS",
		display: feBundle.getText("C_DRAFT_EDIT_STATE_DRAFT_ALL_HIDING_DRAFTS_FILTER")
	},
	/**
	 * Active documents only (with collaborative draft)
	 */
	SAVED_ONLY: {
		id: "SAVED_ONLY",
		display: feBundle.getText("C_DRAFT_EDIT_STATE_DRAFT_SAVED_ONLY_FILTER")
	},
	/**
	 * My drafts, i.e. the drafts I have created, have been invited to or have made a change in (with collaborative draft)
	 */
	MY_DRAFTS: {
		id: "MY_DRAFTS",
		display: feBundle.getText("C_DRAFT_EDIT_STATE_DRAFT_MY_DRAFTS_FILTER")
	},

	/**
	 * Determines the context of the edit state of the document.
	 *
	 * @param macroProps The macro properties
	 * @returns The bound context.
	 */
	getEditStatesContext: function (macroProps: Context): Context {
		let availableEditStates: Record<string, string>[];
		if (macroProps.getProperty("isDraftCollaborative")) {
			availableEditStates = [EDITSTATE.ALL, EDITSTATE.MY_DRAFTS, EDITSTATE.SAVED_ONLY];
		} else {
			availableEditStates = [
				EDITSTATE.ALL,
				EDITSTATE.ALL_HIDING_DRAFTS,
				EDITSTATE.UNCHANGED,
				EDITSTATE.OWN_DRAFT,
				EDITSTATE.LOCKED,
				EDITSTATE.UNSAVED_CHANGES
			];
		}

		return new JSONModel(availableEditStates).bindContext("/").getBoundContext()!;
	},

	/**
	 * Determines the current user id.
	 *
	 * @returns The id of the current user.
	 */
	getCurrentUserID: function (): string | undefined {
		return sap.ushell?.Container?.getUser()?.getId();
	},

	/**
	 * Determines the filter of the current edit state of the document.
	 *
	 * @param editState The current editState
	 * @returns The associated filter.
	 */
	getFilterForEditState: function (editState: string): Filter {
		switch (editState) {
			case EDITSTATE.UNCHANGED.id:
				return new Filter({
					filters: [
						new Filter({ path: "IsActiveEntity", operator: FilterOperator.EQ, value1: true }),
						new Filter({ path: "HasDraftEntity", operator: FilterOperator.EQ, value1: false })
					],
					and: true
				});
			case EDITSTATE.OWN_DRAFT.id:
				return new Filter({ path: "IsActiveEntity", operator: FilterOperator.EQ, value1: false });
			case EDITSTATE.LOCKED.id:
				return new Filter({
					filters: [
						new Filter({ path: "IsActiveEntity", operator: FilterOperator.EQ, value1: true }),
						new Filter({
							path: "SiblingEntity/IsActiveEntity",
							operator: FilterOperator.EQ,
							value1: null
						}),
						new Filter({
							path: "DraftAdministrativeData/InProcessByUser",
							operator: FilterOperator.NE,
							value1: ""
						}),
						new Filter({
							path: "DraftAdministrativeData/InProcessByUser",
							operator: FilterOperator.NE,
							value1: null
						})
					],
					and: true
				});
			case EDITSTATE.UNSAVED_CHANGES.id:
				return new Filter({
					filters: [
						new Filter({ path: "IsActiveEntity", operator: FilterOperator.EQ, value1: true }),
						new Filter({
							path: "SiblingEntity/IsActiveEntity",
							operator: FilterOperator.EQ,
							value1: null
						}),
						new Filter({
							path: "DraftAdministrativeData/InProcessByUser",
							operator: FilterOperator.EQ,
							value1: ""
						})
					],
					and: true
				});
			case EDITSTATE.ALL_HIDING_DRAFTS.id:
			case EDITSTATE.SAVED_ONLY.id:
				return new Filter({ path: "IsActiveEntity", operator: FilterOperator.EQ, value1: true });
			case EDITSTATE.MY_DRAFTS.id:
				const currentUserID = this.getCurrentUserID();
				return currentUserID
					? new Filter({
							filters: [
								new Filter({ path: "IsActiveEntity", operator: FilterOperator.EQ, value1: false }),
								new Filter({
									path: "DraftAdministrativeData/DraftAdministrativeUser",
									operator: FilterOperator.Any,
									variable: "user",
									condition: new Filter({
										path: "user/UserID",
										operator: FilterOperator.EQ,
										value1: this.getCurrentUserID()
									})
								})
							],
							and: true
					  })
					: new Filter({ path: "IsActiveEntity", operator: FilterOperator.EQ, value1: false }); // Couldn't find current user (e.g. no shell) --> show all drafts
			default:
				// ALL
				return new Filter({
					filters: [
						new Filter({ path: "IsActiveEntity", operator: FilterOperator.EQ, value1: false }),
						new Filter({
							path: "SiblingEntity/IsActiveEntity",
							operator: FilterOperator.EQ,
							value1: null
						})
					],
					and: false
				});
		}
	},

	/**
	 * Adds a new operator to the current edit state.
	 */
	addDraftEditStateOperator: function (): void {
		FilterOperatorUtil.addOperator(
			new Operator({
				name: "DRAFT_EDIT_STATE",
				filterOperator: "",
				valueTypes: [OperatorValueType.Self, OperatorValueType.Self],
				tokenParse: "^(.*)$",
				format: function (value: ConditionObject): string {
					return value && value.values[1];
				},
				getModelFilter: function (condition: ConditionObject): Filter {
					return EDITSTATE.getFilterForEditState(condition.values[0]);
				},
				parse: function (parm: unknown[]): unknown[] {
					return parm;
				},
				validateInput: true,
				checkValidated: function (condition: ConditionObject): void {
					// This ensures that the listfieldhelp is also called for old variants saved with Validated parameter as undefined.
					condition.validated = ConditionValidated.Validated;
				}
			})
		);
	}
};

export default EDITSTATE;
