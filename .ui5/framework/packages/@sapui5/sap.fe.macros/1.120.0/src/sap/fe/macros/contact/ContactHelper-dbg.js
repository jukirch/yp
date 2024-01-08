/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/BindingToolkit", "sap/fe/core/templating/DataModelPathHelper"], function (BindingToolkit, DataModelPathHelper) {
  "use strict";

  var _exports = {};
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var compileExpression = BindingToolkit.compileExpression;
  /**
   * Provides the URI to be used, based on the item type.
   *
   * @param itemType
   * @param value
   *
   * @returns The formatted URI
   */
  const formatUri = function (itemType, value) {
    switch (itemType) {
      case "phone":
        return `tel:${value}`;
      case "mail":
        return `mailto:${value}`;
      default:
        return value;
    }
  };
  /**
   * Formats the address based on the different parts given by the contact annotation.
   * @param street
   * @param code
   * @param locality
   * @param region
   * @param country
   *
   * @returns The formatted address
   */
  _exports.formatUri = formatUri;
  const formatAddress = function (street, code, locality, region, country) {
    const textToWrite = [];
    if (street) {
      textToWrite.push(street);
    }
    if (code && locality) {
      textToWrite.push(`${code} ${locality}`);
    } else {
      if (code) {
        textToWrite.push(code);
      }
      if (locality) {
        textToWrite.push(locality);
      }
    }
    if (region) {
      textToWrite.push(region);
    }
    if (country) {
      textToWrite.push(country);
    }
    return textToWrite.join(", ");
  };

  /**
   * Retrieves the right text depending on the phoneType.
   * @param phoneType
   *
   * @returns The text
   */
  _exports.formatAddress = formatAddress;
  const computePhoneLabel = function (phoneType) {
    if (phoneType.includes("fax")) {
      return "{sap.fe.i18n>POPOVER_CONTACT_SECTION_FAX}";
    } else if (phoneType.includes("cell")) {
      return "{sap.fe.i18n>POPOVER_CONTACT_SECTION_MOBILE}";
    } else {
      return "{sap.fe.i18n>POPOVER_CONTACT_SECTION_PHONE}";
    }
  };

  /**
   * Gets the binding for the email to be considered for the integration with Microsoft Teams.
   * @param contactDataModelObject
   *
   * @returns The email binding
   */
  _exports.computePhoneLabel = computePhoneLabel;
  const getMsTeamsMail = function (contactDataModelObject) {
    var _contactDataModelObje, _contactDataModelObje2, _contactDataModelObje3, _contactDataModelObje4, _contactDataModelObje5, _contactDataModelObje6;
    // teams email is the first preferred  email
    let teamsMail = (_contactDataModelObje = contactDataModelObject.targetObject) === null || _contactDataModelObje === void 0 ? void 0 : (_contactDataModelObje2 = _contactDataModelObje.email) === null || _contactDataModelObje2 === void 0 ? void 0 : _contactDataModelObje2.find(emailAnnotation => {
      var _emailAnnotation$type;
      return (_emailAnnotation$type = emailAnnotation.type) === null || _emailAnnotation$type === void 0 ? void 0 : _emailAnnotation$type.includes("Communication.ContactInformationType/preferred");
    });
    // or the first work email
    teamsMail = teamsMail || ((_contactDataModelObje3 = contactDataModelObject.targetObject) === null || _contactDataModelObje3 === void 0 ? void 0 : (_contactDataModelObje4 = _contactDataModelObje3.email) === null || _contactDataModelObje4 === void 0 ? void 0 : _contactDataModelObje4.find(emailAnnotation => {
      var _emailAnnotation$type2;
      return (_emailAnnotation$type2 = emailAnnotation.type) === null || _emailAnnotation$type2 === void 0 ? void 0 : _emailAnnotation$type2.includes("Communication.ContactInformationType/work");
    }));
    //or the first mail
    teamsMail = teamsMail || ((_contactDataModelObje5 = contactDataModelObject.targetObject) === null || _contactDataModelObje5 === void 0 ? void 0 : (_contactDataModelObje6 = _contactDataModelObje5.email) === null || _contactDataModelObje6 === void 0 ? void 0 : _contactDataModelObje6.length) && contactDataModelObject.targetObject.email[0];
    return teamsMail ? compileExpression(getExpressionFromAnnotation(teamsMail.address, getRelativePaths(contactDataModelObject))) : undefined;
  };
  _exports.getMsTeamsMail = getMsTeamsMail;
  return _exports;
}, false);
