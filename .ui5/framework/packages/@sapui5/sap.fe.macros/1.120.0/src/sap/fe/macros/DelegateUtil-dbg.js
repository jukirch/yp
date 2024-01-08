/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/CommonUtils", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/PropertyFormatters", "sap/fe/macros/field/FieldHelper", "sap/fe/macros/internal/valuehelp/ValueHelpTemplating"], function (Log, CommonUtils, StableIdHelper, PropertyFormatters, FieldHelper, ValueHelpTemplating) {
  "use strict";

  var generateID = ValueHelpTemplating.generateID;
  var getRelativePropertyPath = PropertyFormatters.getRelativePropertyPath;
  var generate = StableIdHelper.generate;
  const NS_MACRODATA = "http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1";
  function _retrieveModel() {
    this.control.detachModelContextChange(_retrieveModel, this);
    const sModelName = this.modelName,
      oModel = this.control.getModel(sModelName);
    if (oModel) {
      this.resolve(oModel);
    } else {
      this.control.attachModelContextChange(_retrieveModel, this);
    }
  }
  async function getCustomDataWithModifier(oControl, sProperty, oModifier) {
    const aCustomData = [];
    const aRetrievedCustomData = await Promise.resolve().then(oModifier.getAggregation.bind(oModifier, oControl, "customData"));
    const oPromise = aRetrievedCustomData.reduce((oPreviousPromise, oCustomData) => {
      return oPreviousPromise.then(oModifier.getProperty.bind(oModifier, oCustomData, "key")).then(function (sKey) {
        if (sKey === sProperty) {
          aCustomData.push(oCustomData);
        }
        return;
      });
    }, Promise.resolve());
    await oPromise;
    if (aCustomData.length === 1) {
      return oModifier.getProperty(aCustomData[0], "value");
    } else {
      return undefined;
    }
  }
  const FETCHED_PROPERTIES_DATA_KEY = "sap_fe_ControlDelegate_propertyInfoMap";
  const DelegateUtil = {
    setCachedProperties(control, fetchedProperties) {
      // do not cache during templating, else it becomes part of the cached view
      if (control instanceof window.Element) {
        return;
      }
      const key = FETCHED_PROPERTIES_DATA_KEY;
      DelegateUtil.setCustomData(control, key, fetchedProperties);
    },
    getCachedProperties(control) {
      // properties are not cached during templating
      if (control instanceof window.Element) {
        return null;
      }
      const key = FETCHED_PROPERTIES_DATA_KEY;
      return DelegateUtil.getCustomData(control, key);
    },
    getCustomData(oControl, sProperty, oModifier) {
      // If Modifier is given, the method must execute asynchronously and return a Promise
      if (oModifier) {
        return getCustomDataWithModifier(oControl, sProperty, oModifier);
      } else {
        // Delegate invoked from a non-flex change - FilterBarDelegate._addP13nItem for OP table filtering, FilterBarDelegate.fetchProperties etc.
        if (oControl && sProperty) {
          if (oControl instanceof window.Element) {
            return oControl.getAttributeNS(NS_MACRODATA, sProperty);
          }
          if (oControl.data instanceof Function) {
            return oControl.data(sProperty);
          }
        }
        return undefined;
      }
    },
    setCustomData(oControl, sProperty, vValue) {
      if (oControl && sProperty) {
        if (oControl instanceof window.Element) {
          return oControl.setAttributeNS(NS_MACRODATA, `customData:${sProperty}`, vValue);
        }
        if (oControl.data instanceof Function) {
          return oControl.data(sProperty, vValue);
        }
      }
    },
    fetchPropertiesForEntity(sEntitySet, oMetaModel) {
      return oMetaModel.requestObject(`${sEntitySet}/`);
    },
    fetchAnnotationsForEntity(sEntitySet, oMetaModel) {
      return oMetaModel.requestObject(`${sEntitySet}@`);
    },
    fetchModel(oControl) {
      return new Promise(resolve => {
        const sModelName = oControl.getDelegate().payload && oControl.getDelegate().payload.modelName,
          oContext = {
            modelName: sModelName,
            control: oControl,
            resolve: resolve
          };
        _retrieveModel.call(oContext);
      });
    },
    templateControlFragment(sFragmentName, oPreprocessorSettings, oOptions, oModifier) {
      return CommonUtils.templateControlFragment(sFragmentName, oPreprocessorSettings, oOptions, oModifier);
    },
    doesValueHelpExist(mParameters) {
      const sPropertyName = mParameters.sPropertyName || "";
      const sValueHelpType = mParameters.sValueHelpType || "";
      const oMetaModel = mParameters.oMetaModel;
      const oModifier = mParameters.oModifier;
      const sOriginalProperty = `${mParameters.sBindingPath}/${sPropertyName}`;
      const oPropertyContext = oMetaModel.createBindingContext(sOriginalProperty);
      let sValueHelpProperty = FieldHelper.valueHelpProperty(oPropertyContext);
      const bIsAbsolute = mParameters.sBindingPath && mParameters.sBindingPath.indexOf("/") === 0;

      // unit/currency
      if (sValueHelpProperty.includes("$Path")) {
        sValueHelpProperty = oMetaModel.getObject(sValueHelpProperty);
      }
      if (bIsAbsolute && sValueHelpProperty.indexOf("/") !== 0) {
        sValueHelpProperty = `${mParameters.sBindingPath}/${sValueHelpProperty}`;
      }
      const sGeneratedId = generateID(mParameters.flexId, generate([oModifier ? oModifier.getId(mParameters.oControl) : mParameters.oControl.getId(), sValueHelpType]), getRelativePropertyPath(oPropertyContext.getProperty(sOriginalProperty), {
        context: {
          getModel: () => {
            return mParameters.oMetaModel;
          },
          getPath: () => {
            return sOriginalProperty;
          }
        }
      }), getRelativePropertyPath(oPropertyContext.getProperty(sValueHelpProperty), {
        context: {
          getModel: () => {
            return mParameters.oMetaModel;
          },
          getPath: () => {
            return sValueHelpProperty;
          }
        }
      }));
      return Promise.resolve().then(function () {
        if (oModifier) {
          return oModifier.getAggregation(mParameters.oControl, "dependents");
        }
        return mParameters.oControl.getAggregation("dependents");
      }).then(function (aDependents) {
        return aDependents && aDependents.some(function (oDependent) {
          return oModifier ? oModifier.getId(oDependent) === sGeneratedId : oDependent.getId() === sGeneratedId;
        });
      });
    },
    isValueHelpRequired(mParameters, bInFilterField) {
      const sPropertyName = mParameters.sPropertyName || "",
        oMetaModel = mParameters.oMetaModel,
        sProperty = `${mParameters.sBindingPath}/${sPropertyName}`,
        oPropertyContext = oMetaModel.createBindingContext(sProperty),
        sValueHelpProperty = FieldHelper.valueHelpProperty(oPropertyContext, bInFilterField);
      return this.getCustomData(mParameters.oControl, "displayModePropertyBinding", mParameters.oModifier).then(function (bReadOnly) {
        // Check whether the control is read-only. If yes, no need of a value help.
        bReadOnly = typeof bReadOnly === "boolean" ? bReadOnly : bReadOnly === "true";
        if (bReadOnly) {
          return false;
        }
        // Else, check whether Value Help relevant annotation exists for the property.
        // TODO use PropertyFormatter.hasValueHelp () => if doing so, QUnit tests fail due to mocked model implementation
        return Promise.all([oMetaModel.requestObject(`${sValueHelpProperty}@com.sap.vocabularies.Common.v1.ValueListWithFixedValues`), oMetaModel.requestObject(`${sValueHelpProperty}@com.sap.vocabularies.Common.v1.ValueListReferences`), oMetaModel.requestObject(`${sValueHelpProperty}@com.sap.vocabularies.Common.v1.ValueListMapping`), oMetaModel.requestObject(`${sValueHelpProperty}@com.sap.vocabularies.Common.v1.ValueList`)]);
      }).then(function (aResults) {
        return !!aResults[0] || !!aResults[1] || !!aResults[2] || !!aResults[3];
      }).catch(function (oError) {
        Log.warning("Error while retrieving custom data / value list annotation values", oError);
      });
    },
    isMultiValue(oProperty) {
      let bIsMultiValue = true;
      //SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
      switch (oProperty.filterExpression) {
        case "SearchExpression":
        case "SingleRange":
        case "SingleValue":
          bIsMultiValue = false;
          break;
        default:
          break;
      }
      if (oProperty.type && oProperty.type.indexOf("Boolean") > 0) {
        bIsMultiValue = false;
      }
      return bIsMultiValue;
    }
  };
  return DelegateUtil;
}, false);
