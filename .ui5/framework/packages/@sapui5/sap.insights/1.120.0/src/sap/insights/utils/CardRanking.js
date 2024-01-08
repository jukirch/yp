/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
    "./BatchHelper"
], function (BatchHelper) {
	"use strict";

    // -----------------------------------------------------------------|| Class Information ||----------------------------------------------------------------------------------//
	//
	// This file is intended to do ranking calculation for cards on drag & drop.
	//
	// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------//

    function getMidChar(sChar1, sChar2) {
        if (!sChar1) {
            sChar1 = '!';
        }
        if (!sChar2) {
            sChar2 = '~';
        }
        return String.fromCharCode(Math.floor((sChar1.charCodeAt(0) + sChar2.charCodeAt(0)) / 2));
    }

    function findMidStr(str1, str2) {
        if (!str1) {
            str1 = '!';
        }
        if (!str2) {
            str2 = '~';
        }
        if (str1 >= str2) {
            throw new Error("Second Argument should be greater than the first one");
        }
        var rank = "";
        var maxLen = str1.length > str2.length ? str1.length : str2.length;
        for (var i = 0; i < maxLen; i++) {
            rank += getMidChar(str1[i], str2[i]);
        }
        if (rank === str1) {
            return rank + "0";
        } else if (rank >= str2) {
            throw new Error("No Mid possible between " + str1 + " and " + str2);
        }
        return rank;
    }

    function getRankWeight(rank) {
        var len = rank.length;
        var weight = 0;
        for (var i = 0; i < len; i++) {
            weight += rank.charCodeAt(i) * Math.pow(10, len - i - 1);
        }
        return weight;
    }

    function getWeightedDifference(rank1, rank2) {
        return Math.abs(getRankWeight(rank1) - getRankWeight(rank2));
    }

    function reindex(arrItem, index1, index2) {
        var aChanged = [];
        var wd1 = getWeightedDifference(arrItem[index1 - 1].rank, arrItem[index1].rank);
        var wd2 = getWeightedDifference(arrItem[index2].rank, arrItem[index2 + 1].rank);
        var shiftRank1, shiftRank2, index;
        if (wd1 > wd2) {
            shiftRank1 = index1 - 1;
            index = shiftRank2 = index1;
        } else {
            index = shiftRank1 = index2;
            shiftRank2 = index2 + 1;
        }
        try {
            arrItem[index].rank = findMidStr(arrItem[shiftRank1].rank, arrItem[shiftRank2].rank);
        } catch (error) {
            aChanged = aChanged.concat(reindex(arrItem, shiftRank1, shiftRank2));
            arrItem[index].rank = findMidStr(arrItem[shiftRank1].rank, arrItem[shiftRank2].rank);
        }
        aChanged.push(arrItem[index]);
        return aChanged;
    }

    function reorder(arrItem, initPos, finalPos) {
        var aChanged = [],
            oItem = arrItem[initPos],
            prevIndex = finalPos - 1,
            nextIndex = finalPos,
            oPrevItem = arrItem[prevIndex],
            oNextItem = arrItem[nextIndex],
            oPrevItemRank = oPrevItem ? oPrevItem.rank : undefined,
            oNextItemRank = oNextItem ? oNextItem.rank : undefined;
        try {
            oItem.rank = findMidStr(oPrevItemRank, oNextItemRank);
        } catch (error) {
            aChanged = aChanged.concat(reindex(arrItem, prevIndex, nextIndex));
            oItem.rank = findMidStr(oPrevItemRank, oNextItemRank);
        }
        aChanged.push(oItem);
        return aChanged;
    }

    return {
        reorder: reorder
    };
});