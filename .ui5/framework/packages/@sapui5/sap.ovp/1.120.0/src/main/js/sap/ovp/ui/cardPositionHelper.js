/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([], function () {
    "use strict";
    var cardPosition = {
        getDependentColumns: function (oColumn, currentRow, currentRowSpan, currentColumn) {
            var aDependentColumns = [];
            var oDependentColumnsMap = {};
            var getCurrentRowColumns = function (
                aColumn,
                currentRow,
                currentColumn,
                aDependentColumns,
                aDependentColumnsMap
            ) {
                if (oColumn && currentRow) {
                    oDependentColumnsMap[oColumn.id] = true;
                    aColumn.forEach(function (oColumn) {
                        if (
                            (oColumn.dashboardLayout.row < currentRow ||
                                (oColumn.dashboardLayout.row === currentRow &&
                                    oColumn.dashboardLayout.column < currentColumn)) &&
                            !aDependentColumnsMap[oColumn.id] &&
                            !oColumn.visited
                        ) {
                            aDependentColumns.push(oColumn);
                            aDependentColumnsMap[oColumn.id] = true;
                        } else if (
                            oColumn.dashboardLayout.row + oColumn.dashboardLayout.rowSpan === currentRow &&
                            !aDependentColumnsMap[oColumn.id] &&
                            !oColumn.visited
                        ) {
                            aDependentColumnsMap[oColumn.id] = true;
                            aDependentColumns.push(oColumn);
                        }
                    }, this);
                }
            }.bind(this);
            for (var i = 0; i < this.allColumns.length; i++) {
                getCurrentRowColumns(
                    this.allColumns[i],
                    currentRow,
                    currentColumn,
                    aDependentColumns,
                    oDependentColumnsMap
                );
            }
            return aDependentColumns;
        },
        getNextIndexColumns: function (aColumn, rowValue, columnValue, oPositionMap, index, count, oInstance) {
            var fnSetAriaPosForCards = function (
                aColumn,
                index,
                oPositionMap,
                count,
                finalResult,
                currentRow,
                currentRowSpan,
                oInstance
            ) {
                aColumn[index].visited = true;
                oPositionMap[aColumn[index].id] = count + 1;
                finalResult.rowValue = currentRow + currentRowSpan;
                finalResult.Result = true;
                var oCardElement =
                    oInstance.getCardDomId(aColumn[index].id) &&
                    document.getElementById(oInstance.getCardDomId(aColumn[index].id));
                if (oCardElement) {
                    oCardElement.ariaPosInSet = count + 1;
                }
            };
            var finalResult = { Result: false, rowValue: "" },
                currentRow = aColumn[index] && aColumn[index].dashboardLayout && aColumn[index].dashboardLayout.row,
                currentRowSpan =
                    aColumn[index] && aColumn[index].dashboardLayout && aColumn[index].dashboardLayout.rowSpan,
                currentColumn =
                    aColumn[index] && aColumn[index].dashboardLayout && aColumn[index].dashboardLayout.column;
            if (currentRow === rowValue && currentColumn === columnValue && aColumn[index] && !aColumn[index].visited) {
                fnSetAriaPosForCards(
                    aColumn,
                    index,
                    oPositionMap,
                    count,
                    finalResult,
                    currentRow,
                    currentRowSpan,
                    oInstance
                );
            } else {
                var aDependentColumns = this.getDependentColumns(
                    aColumn[index],
                    currentRow,
                    currentRowSpan,
                    currentColumn
                );
                if (aDependentColumns && !aDependentColumns.length && aColumn[index]) {
                    fnSetAriaPosForCards(
                        aColumn,
                        index,
                        oPositionMap,
                        count,
                        finalResult,
                        currentRow,
                        currentRowSpan,
                        oInstance
                    );
                }
            }
            return finalResult;
        },
        processAllColumns: function (aColumnsInfo, rowVal, oPositionMap, aIndex, count, oInstance) {
            var oResult;
            for (var i = 0; i < aColumnsInfo.length; i++) {
                var currentColumn = aColumnsInfo[i];
                if (
                    currentColumn &&
                    currentColumn.length &&
                    currentColumn[aIndex[i]] &&
                    !currentColumn[aIndex[i]].visited
                ) {
                    oResult = this.getNextIndexColumns(
                        currentColumn,
                        rowVal[i],
                        currentColumn[aIndex[i]].dashboardLayout.column,
                        oPositionMap,
                        aIndex[i],
                        count,
                        oInstance
                    );
                    if (oResult.Result) {
                        rowVal[i] = oResult.rowValue;
                        count = count + 1;
                        aIndex[i] = aIndex[i] + 1;
                    }
                }
            }
            var bNeedToProcessColumn = function (aColumnsInfo) {
                return aColumnsInfo.some(function (aColumn) {
                    return aColumn.some(function (oColumn) {
                        return oColumn.visited === false;
                    });
                });
            };
            if (!bNeedToProcessColumn(aColumnsInfo)) {
                return;
            }
            this.processAllColumns(aColumnsInfo, rowVal, oPositionMap, aIndex, count, oInstance);
        },
        fnSetAriaPos: function (oColumns, oInstance) {
            var oPositionMap = oInstance.ariaPos,
                count = 0,
                aIndex = [],
                rowVal = [],
                aColumnsInfo = [];

            for (var i = 0; i < oColumns.length; i++) {
                aIndex[i] = 0;
                rowVal[i] = 1;
                aColumnsInfo[i] = oColumns[i] || [];
            }
            this.allColumns = aColumnsInfo;
            this.processAllColumns(aColumnsInfo, rowVal, oPositionMap, aIndex, count, oInstance);
        }
    };
    return {
        setAriaPosition: cardPosition.fnSetAriaPos,
        getNextIndexColumns: cardPosition.getNextIndexColumns,
        getDependentColumns: cardPosition.getDependentColumns,
        processAllColumns: cardPosition.processAllColumns
    };
});
