sap.ui.define([
	"sap/base/util/deepEqual"
], function(deepEqual) {
	"use strict";

	/**
	 * Calculate delta of old list and new list.
	 *
	 * This partly implements the algorithm described in "A Technique for Isolating Differences Between Files"
	 * but instead of working with hashes, it does compare each entry of the old list with each entry of the new
	 * list, which causes terrible performance on large datasets.
	 *
	 * <b>Note:</b>This is copied from the deprecated <code>jQuery.sap.arrayDiff</code>.
	 * @param {Array} aOld Old Array
	 * @param {Array} aNew New Array
	 * @param {function} [fnCompare] Function to compare list entries
	 * @param {boolean} [bUniqueEntries] Whether entries are unique, so no duplicate entries exist
	 * @returns {Array} List of changes
	 * @since 1.120
	 * @private
	 * @ui5-restricted sap.ui.vk.threejs
	 */
	function arrayDiff(aOld, aNew, fnCompare, bUniqueEntries){
		fnCompare = fnCompare || function(vValue1, vValue2) {
			return deepEqual(vValue1, vValue2);
		};

		const aOldRefs = [];
		const aNewRefs = [];

		// Find references
		const aMatches = [];
		for (let i = 0; i < aNew.length; i++) {
			const oNewEntry = aNew[i];
			let iFound = 0;
			let iTempJ;
			// if entries are unique, first check for whether same index is same entry
			// and stop searching as soon the first matching entry is found
			if (bUniqueEntries && fnCompare(aOld[i], oNewEntry)) {
				iFound = 1;
				iTempJ = i;
			} else {
				for (let j = 0; j < aOld.length; j++) {
					if (fnCompare(aOld[j], oNewEntry)) {
						iFound++;
						iTempJ = j;
						if (bUniqueEntries || iFound > 1) {
							break;
						}
					}
				}
			}
			if (iFound == 1) {
				const oMatchDetails = {
					oldIndex: iTempJ,
					newIndex: i
				};
				if (aMatches[iTempJ]) {
					delete aOldRefs[iTempJ];
					delete aNewRefs[aMatches[iTempJ].newIndex];
				} else {
					aNewRefs[i] = {
						data: aNew[i],
						row: iTempJ
					};
					aOldRefs[iTempJ] = {
						data: aOld[iTempJ],
						row: i
					};
					aMatches[iTempJ] = oMatchDetails;
				}
			}
		}

		// Pass 4: Find adjacent matches in ascending order
		for (let i = 0; i < aNew.length - 1; i++) {
			if (aNewRefs[i] &&
				!aNewRefs[i + 1] &&
				aNewRefs[i].row + 1 < aOld.length &&
				!aOldRefs[aNewRefs[i].row + 1] &&
				fnCompare(aOld[ aNewRefs[i].row + 1 ], aNew[i + 1])) {

				aNewRefs[i + 1] = {
					data: aNew[i + 1],
					row: aNewRefs[i].row + 1
				};
				aOldRefs[aNewRefs[i].row + 1] = {
					data: aOldRefs[aNewRefs[i].row + 1],
					row: i + 1
				};

			}
		}

		// Pass 5: Find adjacent matches in descending order
		for (let i = aNew.length - 1; i > 0; i--) {
			if (aNewRefs[i] &&
				!aNewRefs[i - 1] &&
				aNewRefs[i].row > 0 &&
				!aOldRefs[aNewRefs[i].row - 1] &&
				fnCompare(aOld[aNewRefs[i].row - 1], aNew[i - 1])) {

				aNewRefs[i - 1] = {
					data: aNew[i - 1],
					row: aNewRefs[i].row - 1
				};
				aOldRefs[aNewRefs[i].row - 1] = {
					data: aOldRefs[aNewRefs[i].row - 1],
					row: i - 1
				};

			}
		}

		// Pass 6: Generate diff data
		const aDiff = [];

		if (aNew.length == 0) {
			// New list is empty, all items were deleted
			for (let i = 0; i < aOld.length; i++) {
				aDiff.push({
					index: 0,
					type: "delete"
				});
			}
		} else {
			let iNewListIndex = 0;
			if (!aOldRefs[0]) {
				// Detect all deletions at the beginning of the old list
				for (let i = 0; i < aOld.length && !aOldRefs[i]; i++) {
					aDiff.push({
						index: 0,
						type: "delete"
					});
					iNewListIndex = i + 1;
				}
			}

			for (let i = 0; i < aNew.length; i++) {
				if (!aNewRefs[i] || aNewRefs[i].row > iNewListIndex) {
					// Entry doesn't exist in old list = insert
					aDiff.push({
						index: i,
						type: "insert"
					});
				} else {
					iNewListIndex = aNewRefs[i].row + 1;
					for (let j = aNewRefs[i].row + 1; j < aOld.length && (!aOldRefs[j] || aOldRefs[j].row < i); j++) {
						aDiff.push({
							index: i + 1,
							type: "delete"
						});
						iNewListIndex = j + 1;
					}
				}
			}
		}

		return aDiff;
	}

	return arrayDiff;
});
