/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/helpers/Key"], function (Key) {
  "use strict";

  var _exports = {};
  var KeyHelper = Key.KeyHelper;
  var ActionType;
  (function (ActionType) {
    ActionType["Default"] = "Default";
  })(ActionType || (ActionType = {}));
  const getVisibilityEnablementFormMenuActions = actions => {
    let menuActionVisible, menuActionVisiblePaths;
    actions.forEach(menuActions => {
      var _menuActions$menu;
      menuActionVisible = false;
      menuActionVisiblePaths = [];
      if (menuActions !== null && menuActions !== void 0 && (_menuActions$menu = menuActions.menu) !== null && _menuActions$menu !== void 0 && _menuActions$menu.length) {
        var _menuActions$menu2;
        menuActions === null || menuActions === void 0 ? void 0 : (_menuActions$menu2 = menuActions.menu) === null || _menuActions$menu2 === void 0 ? void 0 : _menuActions$menu2.forEach(menuItem => {
          const menuItemVisible = menuItem.visible;
          if (!menuActionVisible) {
            if (menuItemVisible && typeof menuItemVisible === "boolean" || menuItemVisible.valueOf() === "true") {
              menuActionVisible = true;
            } else if (menuItemVisible && menuItemVisible.valueOf() !== "false") {
              menuActionVisiblePaths.push(menuItemVisible.valueOf());
            }
          }
        });
        if (menuActionVisiblePaths.length) {
          menuActions.visible = menuActionVisiblePaths;
        } else {
          menuActions.visible = menuActionVisible.toString();
        }
      }
    });
    return actions;
  };
  _exports.getVisibilityEnablementFormMenuActions = getVisibilityEnablementFormMenuActions;
  const mergeFormActions = (source, target) => {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        target[key] = source[key];
      }
    }
    return source;
  };
  _exports.mergeFormActions = mergeFormActions;
  const getFormHiddenActions = (facetDefinition, converterContext) => {
    var _converterContext$get, _converterContext$get2;
    const formActions = getFormActions(facetDefinition, converterContext) || [],
      annotations = converterContext === null || converterContext === void 0 ? void 0 : (_converterContext$get = converterContext.getEntityType()) === null || _converterContext$get === void 0 ? void 0 : (_converterContext$get2 = _converterContext$get.annotations) === null || _converterContext$get2 === void 0 ? void 0 : _converterContext$get2.UI;
    const hiddenFormActions = [];
    for (const property in annotations) {
      var _annotations$property, _annotations$property3, _annotations$property4;
      if (((_annotations$property = annotations[property]) === null || _annotations$property === void 0 ? void 0 : _annotations$property.$Type) === "com.sap.vocabularies.UI.v1.FieldGroupType") {
        var _annotations$property2;
        (_annotations$property2 = annotations[property]) === null || _annotations$property2 === void 0 ? void 0 : _annotations$property2.Data.forEach(dataField => {
          if (dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" && formActions.hasOwnProperty(`DataFieldForAction::${dataField.Action}`)) {
            var _dataField$annotation, _dataField$annotation2, _dataField$annotation3;
            if ((dataField === null || dataField === void 0 ? void 0 : (_dataField$annotation = dataField.annotations) === null || _dataField$annotation === void 0 ? void 0 : (_dataField$annotation2 = _dataField$annotation.UI) === null || _dataField$annotation2 === void 0 ? void 0 : (_dataField$annotation3 = _dataField$annotation2.Hidden) === null || _dataField$annotation3 === void 0 ? void 0 : _dataField$annotation3.valueOf()) === true) {
              hiddenFormActions.push({
                type: ActionType.Default,
                key: KeyHelper.generateKeyFromDataField(dataField)
              });
            }
          } else if (dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" && formActions.hasOwnProperty(`DataFieldForIntentBasedNavigation::${dataField.Action}`)) {
            var _dataField$annotation4, _dataField$annotation5, _dataField$annotation6;
            if ((dataField === null || dataField === void 0 ? void 0 : (_dataField$annotation4 = dataField.annotations) === null || _dataField$annotation4 === void 0 ? void 0 : (_dataField$annotation5 = _dataField$annotation4.UI) === null || _dataField$annotation5 === void 0 ? void 0 : (_dataField$annotation6 = _dataField$annotation5.Hidden) === null || _dataField$annotation6 === void 0 ? void 0 : _dataField$annotation6.valueOf()) === true) {
              hiddenFormActions.push({
                type: ActionType.Default,
                key: KeyHelper.generateKeyFromDataField(dataField)
              });
            }
          }
        });
      } else if (((_annotations$property3 = annotations[property]) === null || _annotations$property3 === void 0 ? void 0 : _annotations$property3.term) === "com.sap.vocabularies.UI.v1.Identification" || ((_annotations$property4 = annotations[property]) === null || _annotations$property4 === void 0 ? void 0 : _annotations$property4.term) === "@com.sap.vocabularies.UI.v1.StatusInfo") {
        var _annotations$property5;
        (_annotations$property5 = annotations[property]) === null || _annotations$property5 === void 0 ? void 0 : _annotations$property5.forEach(dataField => {
          if (dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" && formActions.hasOwnProperty(`DataFieldForAction::${dataField.Action}`)) {
            var _dataField$annotation7, _dataField$annotation8, _dataField$annotation9;
            if ((dataField === null || dataField === void 0 ? void 0 : (_dataField$annotation7 = dataField.annotations) === null || _dataField$annotation7 === void 0 ? void 0 : (_dataField$annotation8 = _dataField$annotation7.UI) === null || _dataField$annotation8 === void 0 ? void 0 : (_dataField$annotation9 = _dataField$annotation8.Hidden) === null || _dataField$annotation9 === void 0 ? void 0 : _dataField$annotation9.valueOf()) === true) {
              hiddenFormActions.push({
                type: ActionType.Default,
                key: KeyHelper.generateKeyFromDataField(dataField)
              });
            }
          } else if (dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" && formActions.hasOwnProperty(`DataFieldForIntentBasedNavigation::${dataField.Action}`)) {
            var _dataField$annotation10, _dataField$annotation11, _dataField$annotation12;
            if ((dataField === null || dataField === void 0 ? void 0 : (_dataField$annotation10 = dataField.annotations) === null || _dataField$annotation10 === void 0 ? void 0 : (_dataField$annotation11 = _dataField$annotation10.UI) === null || _dataField$annotation11 === void 0 ? void 0 : (_dataField$annotation12 = _dataField$annotation11.Hidden) === null || _dataField$annotation12 === void 0 ? void 0 : _dataField$annotation12.valueOf()) === true) {
              hiddenFormActions.push({
                type: ActionType.Default,
                key: KeyHelper.generateKeyFromDataField(dataField)
              });
            }
          }
        });
      }
    }
    return hiddenFormActions;
  };
  _exports.getFormHiddenActions = getFormHiddenActions;
  const getFormActions = (facetDefinition, converterContext) => {
    const manifestWrapper = converterContext.getManifestWrapper();
    let targetValue, manifestFormContainer;
    let actions = {};
    if ((facetDefinition === null || facetDefinition === void 0 ? void 0 : facetDefinition.$Type) === "com.sap.vocabularies.UI.v1.CollectionFacet") {
      if (facetDefinition !== null && facetDefinition !== void 0 && facetDefinition.Facets) {
        facetDefinition === null || facetDefinition === void 0 ? void 0 : facetDefinition.Facets.forEach(facet => {
          var _facet$Target, _manifestFormContaine;
          targetValue = facet === null || facet === void 0 ? void 0 : (_facet$Target = facet.Target) === null || _facet$Target === void 0 ? void 0 : _facet$Target.value;
          manifestFormContainer = manifestWrapper.getFormContainer(targetValue);
          if ((_manifestFormContaine = manifestFormContainer) !== null && _manifestFormContaine !== void 0 && _manifestFormContaine.actions) {
            var _manifestFormContaine2;
            for (const actionKey in manifestFormContainer.actions) {
              // store the correct facet an action is belonging to for the case it's an inline form action
              manifestFormContainer.actions[actionKey].facetName = facet.fullyQualifiedName;
            }
            actions = mergeFormActions((_manifestFormContaine2 = manifestFormContainer) === null || _manifestFormContaine2 === void 0 ? void 0 : _manifestFormContaine2.actions, actions);
          }
        });
      }
    } else if ((facetDefinition === null || facetDefinition === void 0 ? void 0 : facetDefinition.$Type) === "com.sap.vocabularies.UI.v1.ReferenceFacet") {
      var _facetDefinition$Targ, _manifestFormContaine3;
      targetValue = facetDefinition === null || facetDefinition === void 0 ? void 0 : (_facetDefinition$Targ = facetDefinition.Target) === null || _facetDefinition$Targ === void 0 ? void 0 : _facetDefinition$Targ.value;
      manifestFormContainer = manifestWrapper.getFormContainer(targetValue);
      if ((_manifestFormContaine3 = manifestFormContainer) !== null && _manifestFormContaine3 !== void 0 && _manifestFormContaine3.actions) {
        for (const actionKey in manifestFormContainer.actions) {
          // store the correct facet an action is belonging to for the case it's an inline form action
          manifestFormContainer.actions[actionKey].facetName = facetDefinition.fullyQualifiedName;
        }
        actions = manifestFormContainer.actions;
      }
    }
    return actions;
  };
  _exports.getFormActions = getFormActions;
  return _exports;
}, false);
