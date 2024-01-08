/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/m/MessageBox", "sap/ui/core/Core", "sap/ui/core/util/PasteHelper"], function (Log, MessageBox, Core, CorePasteHelper) {
  "use strict";

  const getInfoForEntityProperty = function (propertyPath, rowBindingPath, metaContext, metaModel) {
    const property = metaContext.getProperty(propertyPath),
      formatOptions = {
        parseKeepsEmptyString: true
      },
      type = metaModel.getUI5Type(`${rowBindingPath}/${propertyPath}`, formatOptions),
      isIgnored = !property || metaContext.getProperty(`${propertyPath}@Org.OData.Core.V1.Computed`);
    return {
      property: propertyPath,
      ignore: isIgnored,
      type: type
    };
  };
  const displayErrorMessages = function (errorMessages) {
    const messageDetails = [...errorMessages];
    const resourceBundle = Core.getLibraryResourceBundle("sap.fe.core"),
      errorCorrectionMessage = resourceBundle.getText("C_PASTE_HELPER_SAPFE_PASTE_ERROR_CORRECTION_MESSAGE"),
      noteMessage = resourceBundle.getText("C_PASTE_HELPER_SAPFE_PASTE_ERROR_CORRECTION_NOTE");
    let pasteErrorMessage;
    if (messageDetails.length > 1) {
      pasteErrorMessage = resourceBundle.getText("C_PASTE_HELPER_SAPFE_PASTE_ERROR_MESSAGE_PLURAL", [messageDetails.length]);
    } else {
      pasteErrorMessage = resourceBundle.getText("C_PASTE_HELPER_SAPFE_PASTE_ERROR_MESSAGE_SINGULAR");
    }
    messageDetails.unshift(""); // To show space between the short text and the list of errors
    messageDetails.unshift(noteMessage);
    messageDetails.unshift(errorCorrectionMessage);
    MessageBox.error(pasteErrorMessage, {
      title: resourceBundle.getText("C_COMMON_SAPFE_ERROR_MESSAGES_PAGE_TITLE_ERROR"),
      details: messageDetails.join("<br>")
    });
  };
  const PasteHelper = {
    displayErrorMessages: displayErrorMessages,
    formatCustomMessage: function (validationMessages, iRowNumber) {
      let errorMessage = "";
      const numberMessages = validationMessages.length;
      const resourceBundle = Core.getLibraryResourceBundle("sap.fe.core"),
        i18nRow = resourceBundle.getText("T_MESSAGE_GROUP_DESCRIPTION_TABLE_ROW");
      if (numberMessages > 0) {
        errorMessage += `${i18nRow} ${iRowNumber}: `;
        validationMessages.forEach((message, indexMessage) => {
          if (message.messageText) {
            errorMessage += message.messageText + (indexMessage + 1 !== numberMessages ? " " : "");
          }
        });
      }
      return errorMessage;
    },
    getColumnInfo: function (table) {
      const model = table.getRowBinding().getModel(),
        metaModel = model.getMetaModel(),
        rowBindingPath = model.resolve(table.getRowBinding().getPath(), table.getRowBinding().getContext()),
        metaContext = metaModel.getMetaContext(rowBindingPath);
      return table.getControlDelegate().fetchProperties(table).then(propertyInfo => {
        const PropertyInfoDict = Object.assign({}, ...propertyInfo.map(property => ({
          [property.name]: property
        })));
        const columnInfos = [];
        table.getColumns().forEach(column => {
          const infoProperty = PropertyInfoDict[column.getDataProperty()];
          // Check if it's a complex property (property associated to multiple simple properties)
          if (infoProperty.propertyInfos) {
            // Get data from simple property
            infoProperty.propertyInfos.forEach(property => {
              const dataProperty = PropertyInfoDict[property];
              // Non exported columns should be parte of the columnInfos
              if (dataProperty.exportSettings !== null) {
                // Check a navigation property within the current Complex property --> ignore
                if (property.indexOf("/") > -1) {
                  columnInfos.push({
                    property: dataProperty.path,
                    ignore: true
                  });
                } else {
                  columnInfos.push(this.getInfoForEntityProperty(dataProperty.path, rowBindingPath, metaContext, metaModel));
                }
              }
            });
            if (infoProperty.exportDataPointTargetValue) {
              columnInfos.push({
                property: "targetValueFromDataPoint",
                ignore: true
              });
            }
            // Non exported columns should be parte of the columnInfos
          } else if (infoProperty.exportSettings !== null) {
            if (infoProperty.path) {
              columnInfos.push(this.getInfoForEntityProperty(infoProperty.path, rowBindingPath, metaContext, metaModel));
            } else {
              // Empty column --> ignore
              columnInfos.push({
                property: "unused",
                type: null,
                ignore: true
              });
            }
          }
        });
        return columnInfos;
      });
    },
    getInfoForEntityProperty: getInfoForEntityProperty,
    parsePastedData: function (rawData, table) {
      return this.getColumnInfo(table).then(function (pasteInfos) {
        // Check if we have data for at least the first editable column
        const pastedColumnCount = rawData.length ? rawData[0].length : 0;
        let firstEditableColumnIndex = -1;
        for (let I = 0; I < pasteInfos.length && firstEditableColumnIndex < 0; I++) {
          if (!pasteInfos[I].ignore) {
            firstEditableColumnIndex = I;
          }
        }
        return firstEditableColumnIndex < 0 || firstEditableColumnIndex > pastedColumnCount - 1 ? Promise.resolve({}) // We don't have data for an editable column --> return empty parsed data
        : CorePasteHelper.parse(rawData, pasteInfos);
      }).then(parseResult => {
        if (parseResult.errors) {
          const errorMessages = parseResult.errors.map(function (oElement) {
            return oElement.message;
          });
          this.displayErrorMessages(errorMessages);
          return []; // Errors --> return nothing
        } else {
          return parseResult.parsedData ? parseResult.parsedData : [];
        }
      });
    },
    pasteData: function (rawData, table, controller) {
      const editFlow = controller.editFlow;
      const tableDefinition = table.getParent().getTableDefinition();
      let aData = [];
      return this.parsePastedData(rawData, table).then(aParsedData => {
        aData = aParsedData || [];
        return Promise.all(aData.map(mData => {
          var _tableDefinition$cont;
          return editFlow.validateDocument(table.getBindingContext(), {
            data: mData,
            customValidationFunction: tableDefinition === null || tableDefinition === void 0 ? void 0 : (_tableDefinition$cont = tableDefinition.control) === null || _tableDefinition$cont === void 0 ? void 0 : _tableDefinition$cont.customValidationFunction
          });
        }));
      }).then(aValidationMessages => {
        const aErrorMessages = aValidationMessages.reduce(function (aMessages, aCustomMessages, index) {
          if (aCustomMessages.length > 0) {
            aMessages.push({
              messages: aCustomMessages,
              row: index + 1
            });
          }
          return aMessages;
        }, []);
        if (aErrorMessages.length > 0) {
          const aRowMessages = aErrorMessages.map(mError => this.formatCustomMessage(mError.messages, mError.row));
          this.displayErrorMessages(aRowMessages);
          return [];
        }
        return aData;
      }).then(aValidatedData => {
        var _tableDefinition$cont2;
        return aValidatedData.length > 0 ? editFlow.createMultipleDocuments(table.getRowBinding(), aValidatedData, tableDefinition === null || tableDefinition === void 0 ? void 0 : (_tableDefinition$cont2 = tableDefinition.control) === null || _tableDefinition$cont2 === void 0 ? void 0 : _tableDefinition$cont2.createAtEnd, true, controller.editFlow.onBeforeCreate) : undefined;
      }).catch(oError => {
        Log.error("Error while pasting data", oError);
      });
    }
  };
  return PasteHelper;
}, false);
