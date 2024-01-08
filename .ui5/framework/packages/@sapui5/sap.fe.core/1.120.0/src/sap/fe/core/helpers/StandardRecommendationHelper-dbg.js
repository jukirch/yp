/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/MetaModelConverter", "../templating/UIFormatters"], function (MetaModelConverter, UIFormatters) {
  "use strict";

  var _exports = {};
  var getDisplayMode = UIFormatters.getDisplayMode;
  const standardRecommendationHelper = {
    /**
     * This function will process and set the recommendations according to data received from backend.
     *
     * @param recommendations The data received from backend
     * @param internalModel The internal json model
     * @param recommendationsContexts The contexts for which recommendations are being fetched
     */
    storeRecommendations: (recommendations, internalModel, recommendationsContexts) => {
      const recommendationsData = internalModel.getProperty("/recommendationsData") || {};
      standardRecommendationHelper.clearRecommendationsForContextOnly(recommendationsData, recommendationsContexts);
      standardRecommendationHelper.enhanceRecommendationModel(recommendations, recommendationsData);
      //Setting the version to 2.0 to segregate the processing
      recommendationsData["version"] = 2.0;
      internalModel.setProperty("/recommendationsData", recommendationsData);
      internalModel.refresh(true);
    },
    /**
     * This function clears the old recommendations for the context.
     *
     * @param recommendationsData The recommendation data which is stored
     * @param recommendationsContexts The contexts for which recommendations are being fetched
     */
    clearRecommendationsForContextOnly: (recommendationsData, recommendationsContexts) => {
      if (recommendationsContexts) {
        Object.keys(recommendationsData).forEach(target => {
          //We need to only clear the recommendations of current context and not the children's context.The index will fetch the context of the recommendation property.
          const idx = target.lastIndexOf(")");
          if (recommendationsContexts.find(context => context.getPath() === target.substring(0, idx + 1))) {
            delete recommendationsData[target];
          }
        });
      }
    },
    /**
     * This function will enhance the recommendations according to data received from backend.
     *
     * @param recommendations The data received from backend
     * @param recommendationsData The existing recommendation Model
     */
    enhanceRecommendationModel: (recommendations, recommendationsData) => {
      recommendations === null || recommendations === void 0 ? void 0 : recommendations.forEach(recommendation => {
        const target = recommendation.AIRecommendedFieldPath;
        if (target) {
          var _recommendation$_AIAl;
          // loop through all the recommendations sent from backend
          const additionalValues = [];
          let isPlaceholderValueFound = false;

          // set the other alternatives as recommendations
          (_recommendation$_AIAl = recommendation._AIAltvRecmddFldVals) === null || _recommendation$_AIAl === void 0 ? void 0 : _recommendation$_AIAl.forEach(alternativeRecommendation => {
            const standardRecommendationsData = {
              value: alternativeRecommendation.AIRecommendedFieldValue,
              probability: alternativeRecommendation.AIRecommendedFieldScoreValue
            };
            if (recommendation.AIRecommendedFieldValue === alternativeRecommendation.AIRecommendedFieldValue) {
              isPlaceholderValueFound = true;
            }
            additionalValues.push(standardRecommendationsData);
          });
          recommendationsData[target] = {
            value: isPlaceholderValueFound ? recommendation.AIRecommendedFieldValue : undefined,
            text: isPlaceholderValueFound ? recommendation.AIRecommendedFieldDescription : undefined,
            additionalValues: additionalValues
          };
        }
      });
    },
    /**
     * This function returns recommendations from standard recommendations model.
     *
     * @param bindingContext Binding Context of the field
     * @param propertyPath Property path of the field
     * @param recommendationData Object containing recommendations
     * @returns Recommendation data for the field
     */
    getStandardRecommendations: function (bindingContext, propertyPath, recommendationData) {
      if (bindingContext && propertyPath) {
        const fullPath = bindingContext.getPath() + "/" + propertyPath;
        return recommendationData[fullPath] || undefined;
      }
    },
    /**
     * Fetches the display mode for a given target path.
     *
     * @param targetPath
     * @param model
     * @returns Display mode for target path
     */
    getDisplayModeForTargetPath(targetPath, model) {
      const involvedDataModelObject = standardRecommendationHelper.getInvolvedDataModelObjectsForTargetPath(targetPath, model);
      const displayMode = involvedDataModelObject && getDisplayMode(involvedDataModelObject);
      return displayMode ? displayMode : "DescriptionValue";
    },
    /**
     * Fetches the DataModel Object Path for a given target path.
     *
     * @param targetPath
     * @param model
     * @returns DataModel Object Path for target path
     */
    getInvolvedDataModelObjectsForTargetPath(targetPath, model) {
      var _model$getMetaModel, _model$getMetaModel2;
      const metaPath = model === null || model === void 0 ? void 0 : (_model$getMetaModel = model.getMetaModel()) === null || _model$getMetaModel === void 0 ? void 0 : _model$getMetaModel.getMetaPath(targetPath);
      const metaContext = metaPath ? model === null || model === void 0 ? void 0 : (_model$getMetaModel2 = model.getMetaModel()) === null || _model$getMetaModel2 === void 0 ? void 0 : _model$getMetaModel2.getContext(metaPath) : undefined;
      return metaContext && MetaModelConverter.getInvolvedDataModelObjects(metaContext);
    },
    /**
     * Function which informs whether a recommendation field is null or not.
     *
     * @param context
     * @param key
     * @param propertyPath
     * @returns boolean value based on whether a recommendation field is null or not
     */

    isRecommendationFieldNull(context, key, propertyPath) {
      const property = standardRecommendationHelper.getInvolvedDataModelObjectsForTargetPath(key, context === null || context === void 0 ? void 0 : context.getModel());
      if (!(context !== null && context !== void 0 && context.getProperty(propertyPath))) {
        const displayMode = standardRecommendationHelper.getDisplayModeForTargetPath(key, context === null || context === void 0 ? void 0 : context.getModel());
        if (displayMode && displayMode !== "Value") {
          var _property$targetObjec, _property$targetObjec2, _property$targetObjec3, _property$targetObjec4;
          const text = property === null || property === void 0 ? void 0 : (_property$targetObjec = property.targetObject) === null || _property$targetObjec === void 0 ? void 0 : (_property$targetObjec2 = _property$targetObjec.annotations) === null || _property$targetObjec2 === void 0 ? void 0 : (_property$targetObjec3 = _property$targetObjec2.Common) === null || _property$targetObjec3 === void 0 ? void 0 : (_property$targetObjec4 = _property$targetObjec3.Text) === null || _property$targetObjec4 === void 0 ? void 0 : _property$targetObjec4.path;
          return text ? !(context !== null && context !== void 0 && context.getProperty(text)) : true;
        }
        return true;
      }
      return false;
    }
  };
  _exports.standardRecommendationHelper = standardRecommendationHelper;
  return _exports;
}, false);
