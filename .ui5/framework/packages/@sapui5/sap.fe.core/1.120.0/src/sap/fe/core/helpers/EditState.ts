const enumEditState = {
	CLEAN: 0,
	PROCESSED: 1,
	DIRTY: 2
};
let currentEditState = enumEditState.CLEAN;

export default {
	/**
	 * This sets the edit state as dirty, meaning bindings have to be refreshed.
	 *
	 * @final
	 */
	setEditStateDirty: function () {
		currentEditState = enumEditState.DIRTY;
	},

	/**
	 * This sets the edit state as processed, meaning is can be reset to clean after all bindings are refreshed.
	 *
	 * @final
	 */
	setEditStateProcessed: function () {
		currentEditState = enumEditState.PROCESSED;
	},

	/**
	 * Resets the edit state to the initial state.
	 *
	 * @final
	 */
	resetEditState: function () {
		currentEditState = enumEditState.CLEAN;
	},

	/**
	 * Returns true if the edit state is not clean, meaning bindings have to be refreshed
	 *
	 * @final
	 */

	isEditStateDirty: function () {
		return currentEditState !== enumEditState.CLEAN;
	},

	/**
	 * Cleans the edit state if it has been processed, i.e. bindings have been properly refreshed.
	 *
	 * @final
	 */
	cleanProcessedEditState: function () {
		if (currentEditState === enumEditState.PROCESSED) {
			currentEditState = enumEditState.CLEAN;
		}
	}
};
