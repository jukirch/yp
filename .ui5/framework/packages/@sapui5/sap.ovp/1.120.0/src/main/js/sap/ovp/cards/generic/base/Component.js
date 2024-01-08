/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/ovp/cards/CommonUtils",
    "sap/ui/Device",
    "sap/ui/model/resource/ResourceModel",
    "sap/ui/core/mvc/ViewType",
    "sap/base/util/merge",
    "sap/ovp/app/OVPUtils",
    "sap/ovp/app/OVPLogger",
    "sap/ui/core/mvc/XMLView",
    "sap/ui/base/Object",
    "sap/ui/core/Core",
    "sap/ui/core/Component"
], function (
    UIComponent,
    JSONModel,
    CommonUtils,
    Device,
    ResourceModel,
    ViewType,
    merge,
    OVPUtils,
    OVPLogger,
    XMLView,
    BaseObject,
    Core,
    CoreComponent
) {
    "use strict";

    var oLogger = new OVPLogger("OVP.generic.base.Component");
    
    return UIComponent.extend("sap.ovp.cards.generic.base.Component", {
        // use inline declaration instead of component.json to save 1 round trip
        metadata: {
            properties: {
                contentFragment: {
                    type: "string"
                },
                controllerName: {
                    type: "string",
                    defaultValue: "sap.ovp.cards.generic.Card"
                },
                headerExtensionFragment: {
                    type: "string"
                },
                contentPosition: {
                    type: "string",
                    defaultValue: "Middle"
                },
                headerFragment: {
                    type: "string",
                    defaultValue: "sap.ovp.cards.generic.Header"
                },
                footerFragment: {
                    type: "string"
                },
                identificationAnnotationPath: {
                    type: "string",
                    defaultValue: "com.sap.vocabularies.UI.v1.Identification"
                },
                selectionAnnotationPath: {
                    type: "string"
                },
                filters: {
                    type: "object"
                },
                parameters: {
                    type: "object"
                },
                addODataSelect: {
                    type: "boolean",
                    defaultValue: false
                },
                enableAddToInsights: { 
                    type: "boolean",
                    defaultValue: false
                }
            },
            version: "1.120.0",
            library: "sap.ovp",
            includes: [],
            dependencies: {
                libs: [],
                components: []
            },
            config: {}
        },

        /**
         * Sets the selectionAnnotationPath into the oSettings object
         * @param oSelectionVariantPath
         * @param oSettings
         */
        setSelectionVariant: function (sSelectionVariantPath, oSettings) {
            if (/^@/.test(sSelectionVariantPath)) {
                    sSelectionVariantPath = sSelectionVariantPath.slice(1);
            }
            oSettings.selectionAnnotationPath = sSelectionVariantPath;
        },
        getCustomizing: function(sType) {
            return CoreComponent.getCustomizing(this, {type: sType});
        },

        /**
         * Sets the presentationvariant and visualization properties into
         * the osettings object
         * @param oPresentationVariantPath
         * @param oSettings
         * @param oEntityType
         * @param bODataV4
         */
        setPresentationVariant: function (sPresentationVariantPath, oSettings, oEntityType, bODataV4) {
            if (/^@/.test(sPresentationVariantPath) && !bODataV4) {
                sPresentationVariantPath = sPresentationVariantPath.slice(1);
            }
            oSettings.presentationAnnotationPath = sPresentationVariantPath;
            var splitedPresentationVariantPath = sPresentationVariantPath.split("/");
            var aVisualizations =
                splitedPresentationVariantPath.length === 1 
                    ? oEntityType[sPresentationVariantPath].Visualizations
                    : oEntityType[splitedPresentationVariantPath[0]][splitedPresentationVariantPath[1]][splitedPresentationVariantPath[2]].Visualizations;
            var index;
            /*
             *   For annotationPath (LineItem) in Visualizations
             * */
            for (index = 0; index < aVisualizations.length; index++) {
                var sVisualizations = bODataV4 ? aVisualizations[index].$AnnotationPath : aVisualizations[index].AnnotationPath;
                if (sVisualizations) {
                    if (/^@/.test(sVisualizations)) {
                        sVisualizations = sVisualizations.slice(1);
                    }
                    if (/.LineItem/.test(sVisualizations)) {
                        oSettings.annotationPath = sVisualizations;
                        break;
                    }
                }
            }

            /*
             *   For chartAnnotationPath (Chart) in Visualizations
             * */
            for (index = 0; index < aVisualizations.length; index++) {
                var sVisualizations = bODataV4 ? aVisualizations[index].$AnnotationPath : aVisualizations[index].AnnotationPath;
                if (sVisualizations) {
                    if (/^@/.test(sVisualizations)) {
                        sVisualizations = sVisualizations.slice(1);
                    }
                    if (/.Chart/.test(sVisualizations)) {
                        oSettings.chartAnnotationPath = sVisualizations;
                        break;
                    }
                }
            }
        },

        setDataPointAnnotationPath: function (sDataPointAnnotationPath, oSettings) {
            if (/^@/.test(sDataPointAnnotationPath)) {
                sDataPointAnnotationPath = sDataPointAnnotationPath.slice(1);
            }
            oSettings.dataPointAnnotationPath = sDataPointAnnotationPath;
        },

        /**
         * Default "abstract" empty function.
         * In case there is a need to enrich the default preprocessor which provided by OVP, the extended Component should provide this function and return a preprocessor object.
         * @public
         * @returns {Object} SAPUI5 preprocessor object
         */
        getCustomPreprocessor: function () { },

        getPreprocessors: function (pOvplibResourceBundle) {
            var oComponentData = this.getComponentData(),
                oSettings = oComponentData.settings,
                oModel = oComponentData.model,
                oMetaModel,
                oEntityType,
                oEntityTypeContext,
                oEntityTypeAnno,
                oEntitySetContext;

            //Backwards compatibility to support "description" property
            if (oSettings.description && !oSettings.subTitle) {
                oSettings.subTitle = oSettings.description;
            }
            var bODataV4 = CommonUtils.isODataV4(oModel);
            if (oModel && bODataV4) {
                oMetaModel = oModel && oModel.getMetaModel();
                var entitySetPath = "/" + oSettings.entitySet;
                var oEntityType = oMetaModel.getObject(entitySetPath);
                oEntitySetContext = oMetaModel.createBindingContext(entitySetPath);
                if (oEntityType && oEntityType["$Type"]) {
                    oEntityTypeContext = oMetaModel.createBindingContext("/" + oEntityType["$Type"]);
                    var sAnnotationPath = "/" + oEntityType["$Type"] + "/@";
                    oEntityTypeAnno = oMetaModel.getObject(sAnnotationPath);
                }
            } else if (oModel && oSettings.entitySet) {
                oMetaModel = oModel && oModel.getMetaModel();
                var oEntitySet = oMetaModel.getODataEntitySet(oSettings.entitySet);
                var sEntitySetPath = oMetaModel.getODataEntitySet(oSettings.entitySet, true);
                oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
                oEntitySetContext = oMetaModel.createBindingContext(sEntitySetPath);
                oEntityTypeContext = oMetaModel.createBindingContext(oEntityType.$path);
            }

            var oCardProperties = this._getCardPropertyDefaults();
            var oCardLayoutData = this._completeLayoutDefaults(oCardProperties, oSettings);
            //To get Global Parameters
            var showDateInRelativeFormat, disableTableCardFlexibility;
            if (
                oComponentData.appComponent &&
                oComponentData.appComponent.getModel("ui") &&
                oComponentData.appComponent.getModel("ui").oData
            ) {
                var appComponentData = oComponentData.appComponent.getModel("ui").oData;
                showDateInRelativeFormat = appComponentData.showDateInRelativeFormat;
                disableTableCardFlexibility = appComponentData.disableTableCardFlexibility;
            } else {
                if (oComponentData.showDateInRelativeFormat) {
                    showDateInRelativeFormat = oComponentData.showDateInRelativeFormat;
                }
                if (oComponentData.disableTableCardFlexibility) {
                    disableTableCardFlexibility = oComponentData.disableTableCardFlexibility;
                }
            }

            if (oComponentData.ovpCardsAsApi && oComponentData.parentView && typeof oComponentData.parentView.getViewName === 'function' && oComponentData.parentView.getViewName() !== "sap.ovp.cards.rta.SettingsDialog") {
                oComponentData.settings.enableAddToInsights = false; // Disable Additional card actions if component is created from OVPCardsAsApi utility, for KeyUser RT preview and ALP kpi tag
            }

            var oOvpConfig = (oComponentData && oComponentData.appComponent && oComponentData.appComponent.ovpConfig) || {};
            var bEnableManageCards = true;

            if (oComponentData.ovpCardsAsApi) {
                bEnableManageCards = false;
            }

            var bInsightEnabled = oOvpConfig.bInsightDTEnabled || oOvpConfig.bInsightRTEnabled || false;
            // Hide "Add Card to Insights" when OVP application is opened in Teams
            if (oOvpConfig.isTeamsModeActive) {
                bInsightEnabled = false;
            }

            var oAdditionalData = {
                metaModel: oMetaModel,
                entityType: oEntityType,
                webkitSupport: Device.browser.webkit,
                layoutDetail: oCardLayoutData && oCardLayoutData.cardLayout ? oCardLayoutData.cardLayout.containerLayout : "fixed",
                bInsightDTEnabled: oOvpConfig.bInsightDTEnabled || false,
                bInsightRTEnabled: oOvpConfig.bInsightRTEnabled || false,
                bInsightEnabled: bInsightEnabled,
                showDateInRelativeFormat: showDateInRelativeFormat,
                disableTableCardFlexibility: disableTableCardFlexibility,
                cardId: oComponentData.cardId,
                enableAdditionalActionsManageCards: bEnableManageCards
            };
            if (!!oComponentData && !!oComponentData.cardId) {
                var oMainComponent = oComponentData.mainComponent;
                var oTemplate = null;
                if (!!oMainComponent) {
                    oTemplate = oMainComponent._getCardFromManifest(oComponentData.cardId)
                        ? oMainComponent._getCardFromManifest(oComponentData.cardId).template
                        : null;
                } else {
                    oTemplate = oComponentData.template;
                }
                if (!!oTemplate) {
                    oAdditionalData.template = oTemplate;
                }
                if (oAdditionalData.template === "sap.ovp.cards.charts.analytical") {
                    oAdditionalData.enableOVPCardAsAPI = oComponentData.ovpCardsAsApi || false;
                }
                var aInsightsEnabledV4Cards = [
                    "sap.ovp.cards.v4.charts.analytical",
                    "sap.ovp.cards.v4.table",
                    "sap.ovp.cards.v4.list"
                ];
                if (oOvpConfig.enableV4Insight && aInsightsEnabledV4Cards.includes(oTemplate)) {
                    oComponentData.settings.enableAddToInsights = true;
                }
            }
            //set the densityProperty for the card
            oCardProperties.densityStyle = CommonUtils._setCardpropertyDensityAttribute();
            if (oComponentData.errorReason) {
                var oErrorReason = oComponentData.errorReason;
                var oParameters = oErrorReason.getParameters ? oErrorReason.getParameters() : oErrorReason.mParameters;
                var sErrorIcon = "sapIllus-UnableToLoad";
                if (oParameters && oParameters.response) {
                    oCardProperties.errorStatusCode = oParameters.response.statusCode;
                    oCardProperties.errorStatusText = oParameters.response.statusText;
                    oCardProperties.responseText = oParameters.response.responseText;
                    oCardProperties.sMessageIcon = oParameters.response.sIcon ? oParameters.response.sIcon : sErrorIcon;
                }
            }
            if (oCardLayoutData) {
                oAdditionalData.cardLayout = oCardLayoutData.cardLayout;
            }

            /**
             * Setting selectionAnnotationPath, presentationAnnotationPath
             * annotationPath and chartAnnotationPath
             * using selectionPresentationAnnotationPath if
             * SelectionPresentationVariant is present in annotations
             */
            if (oCardProperties.state !== "Error") {
                // The kpi annotation gets the first preference here, if a kpi annotation is defined, the selection
                // and presentation variants are picked up from the kpi annotation
                if (oSettings && oSettings.kpiAnnotationPath) {
                    var oKpiAnnotation = oEntityType[oSettings.kpiAnnotationPath];
                    var contentFragment = oCardProperties.contentFragment;
                    if (
                        oKpiAnnotation &&
                        [
                            "sap.ovp.cards.charts.analytical.analyticalChart", 
                            "sap.ovp.cards.v4.charts.analytical.analyticalChart",
                            "sap.ovp.cards.charts.smart.analyticalChart"
                        ].includes(contentFragment)
                    ) {
                        var sSelectionVariantPath =
                            oKpiAnnotation.SelectionVariant && oKpiAnnotation.SelectionVariant.Path
                                ? oKpiAnnotation.SelectionVariant.Path
                                : oSettings.kpiAnnotationPath + "/SelectionVariant";
                        if (sSelectionVariantPath) {
                            this.setSelectionVariant(sSelectionVariantPath, oSettings);
                        }
                        var sPresentationVariantPath =
                            oKpiAnnotation.Detail &&
                                oKpiAnnotation.Detail.DefaultPresentationVariant &&
                                oKpiAnnotation.Detail.DefaultPresentationVariant.Path
                                ? oKpiAnnotation.Detail.DefaultPresentationVariant.Path
                                : oSettings.kpiAnnotationPath + "/Detail/DefaultPresentationVariant";
                        if (sPresentationVariantPath) {
                            this.setPresentationVariant(sPresentationVariantPath, oSettings, oEntityType, bODataV4);
                        }
                        var sDataPointAnnotationPath =
                            oKpiAnnotation.DataPoint && oKpiAnnotation.DataPoint.Path
                                ? oKpiAnnotation.DataPoint.Path
                                : oSettings.kpiAnnotationPath + "/DataPoint";
                        if (sDataPointAnnotationPath) {
                            this.setDataPointAnnotationPath(sDataPointAnnotationPath, oSettings);
                        }
                    }
                } else if (oSettings && oSettings.selectionPresentationAnnotationPath) {
                    var sSelectionAnnotationPath = bODataV4 ? "@" + oSettings.selectionPresentationAnnotationPath : oSettings.selectionPresentationAnnotationPath;
                    var oSelectionPresentationVariant = bODataV4 ? oEntityTypeAnno[sSelectionAnnotationPath] : oEntityType[sSelectionAnnotationPath];
                    if (oSelectionPresentationVariant) {
                        var sSelectionVariantPath =
                            oSelectionPresentationVariant.SelectionVariant && (bODataV4 ? oSelectionPresentationVariant.SelectionVariant.$Path : oSelectionPresentationVariant.SelectionVariant.Path);
                        if (sSelectionVariantPath) {
                            this.setSelectionVariant(sSelectionVariantPath, oSettings);
                        }
                        var sPresentationVariantPath =
                            oSelectionPresentationVariant.PresentationVariant && (bODataV4 ? oSelectionPresentationVariant.PresentationVariant.$Path : oSelectionPresentationVariant.PresentationVariant.Path);
                        if (sPresentationVariantPath) {
                            var oEntityPresentation = bODataV4 ? oEntityTypeAnno : oEntityType;
                            this.setPresentationVariant(sPresentationVariantPath, oSettings, oEntityPresentation, bODataV4);
                        }
                    }
                }
            }

            /**
             * For External filters in API
             * Remove Selection Variant From card settings
             * Static Id's for External filter text in KPI Header
             */
            if (oComponentData.ovpCardsAsApi && oSettings.ignoreSelectionVariant) {
                oSettings.selectionAnnotationPath = "";
                var aIdForExternalFilters = [];
                for (var counter = 0; !!oSettings.filters && counter < oSettings.filters.length; counter++) {
                    aIdForExternalFilters.push({
                        id: "headerFilterText--" + (counter + 1),
                        index: counter
                    });
                }
                oSettings.idForExternalFilters = aIdForExternalFilters;
            }

            /*
             *   Static Id's for Selection Variant text in KPI Header
             * */

            if (
                !!oAdditionalData.entityType &&
                !!oSettings.selectionAnnotationPath &&
                !!oAdditionalData.entityType[oSettings.selectionAnnotationPath]
            ) {
                var oSelectOptions = oAdditionalData.entityType[oSettings.selectionAnnotationPath].SelectOptions;
                for (var select = 0; !!oSelectOptions && select < oSelectOptions.length; select++) {
                    oSelectOptions[select].id = "headerFilterText--" + (select + 1);
                }
                oAdditionalData.entityType[oSettings.selectionAnnotationPath].SelectOptions = oSelectOptions;
            }

            /*
             *   Static Id's for LinkList Static Card having list Flavour Standard
             * */

            if (
                (oAdditionalData.template === "sap.ovp.cards.linklist" || oAdditionalData.template === "sap.ovp.cards.v4.linklist") &&
                !!oSettings.staticContent
            ) {
                for (var i = 0; i < oSettings.staticContent.length; i++) {
                    oSettings.staticContent[i].id = "linkListItem--" + (i + 1);
                }
                if (oSettings.staticContent) {
                    oCardProperties.showRefresh = false;
                }
            } else if (oAdditionalData.template === "sap.ovp.cards.charts.analytical" || oAdditionalData.template === "sap.ovp.cards.v4.charts.analytical") {
                oSettings.dataStep = oSettings.dataStep ? oSettings.dataStep : 10;
            }
            oCardProperties = OVPUtils.merge(true, {}, oAdditionalData, oCardProperties, oSettings);
            var oOvpCardPropertiesModel = new JSONModel(oCardProperties);
            //var ovplibResourceBundle = this.getOvplibResourceBundle();

            var oDefaultPreprocessors = {
                xml: {
                    bindingContexts: {
                        entityType: oEntityTypeContext,
                        entitySet: oEntitySetContext
                    },
                    models: {
                        device: CommonUtils.deviceModel,
                        entityType: oMetaModel,
                        entitySet: oMetaModel,
                        ovpMeta: oMetaModel,
                        ovpCardProperties: oOvpCardPropertiesModel,
                        ovplibResourceBundle: pOvplibResourceBundle,
                        ovpConstants: CommonUtils.ovpConstantModel
                    },
                    ovpCardProperties: oOvpCardPropertiesModel,
                    dataModel: oModel,
                    _ovpCache: {}
                }
            };
            return merge({}, this.getCustomPreprocessor(), oDefaultPreprocessors);
        },

        _completeLayoutDefaults: function (oCardProperties, oSettings) {
            var oCardLayoutData = {},
                oComponentData = this.getComponentData(),
                oConfig = null,
                oDashboardUtil = null;
            if (oComponentData.appComponent) {
                oConfig = oComponentData.appComponent.getOvpConfig();
            }
            if (!oConfig) {
                return null;
            }
            if (
                oConfig.containerLayout === "resizable" &&
                oComponentData.cardId &&
                oCardProperties.contentFragment !== "sap.ovp.cards.quickview.Quickview"
            ) {
                oDashboardUtil = oComponentData.appComponent.getDashboardLayoutUtil();
                //in resizable card layout each card may contain layout data -> use this if available
                var sCardId = oComponentData.cardId;
                var oCardObj = oDashboardUtil.aCards.filter(function (item) {
                    return item.id === sCardId;
                });
                oCardLayoutData.cardLayout = oCardObj[0].dashboardLayout;
                oCardLayoutData.cardLayout.containerLayout = oConfig.containerLayout;
                oCardLayoutData.cardLayout.iRowHeightPx = oDashboardUtil.ROW_HEIGHT_PX;
                oCardLayoutData.cardLayout.iCardBorderPx = oDashboardUtil.CARD_BORDER_PX;
                oCardLayoutData.cardLayout.headerHeight = oCardObj[0].dashboardLayout.headerHeight;
            }
            return oCardLayoutData;
        },

        _getCardPropertyDefaults: function () {
            var oCardProperties = {};
            var oPropsDef = this.getMetadata().getAllProperties();
            var oPropDef;

            for (var propName in oPropsDef) {
                oPropDef = oPropsDef[propName];
                if (oPropDef.defaultValue !== undefined) {
                    oCardProperties[oPropDef.name] = oPropDef.defaultValue;
                }
            }

            return oCardProperties;
        },

        getOvplibResourceBundle: function () {
            if (!this.ovplibResourceBundle) {
                var oResourceBundle = Core.getLibraryResourceBundle("sap.ovp");
                this.ovplibResourceBundle = oResourceBundle
                    ? new ResourceModel({
                        bundleUrl: oResourceBundle.oUrlInfo.url
                    })
                    : null;
            }
            return this.ovplibResourceBundle;
        },

        /* Function to calculate the cache keys for the view
         * "useViewCache" is the manifest entry
         * @returns {array}
         * @private
         * */
        _getCacheKeys: function () {
            var oComponentData = this.getComponentData && this.getComponentData();
            if (oComponentData.ovpCardsAsApi) {
                return;
            }
            if (oComponentData.appComponent && !(BaseObject.isA(oComponentData.appComponent, "sap.ui.base.ManagedObject"))) {
                return;
            }
            var bIsObjectStream = oComponentData && oComponentData.settings && oComponentData.settings.isObjectStream;
            //No cache required for object streams (quick view card)
            if (bIsObjectStream) {
                return;
            }

            var oModel = oComponentData && oComponentData.model;
            if (oModel) {
                var aCacheKeys = [];
                if (oModel.metadataLoaded && typeof oModel.metadataLoaded === "function") {
                    var pGetMetadataLastModified = oModel.metadataLoaded().then(function (mParams) {
                        var sCacheKey;
                        if (mParams && mParams.lastModified) {
                            sCacheKey = new Date(mParams.lastModified).getTime() + "";
                        } else {
                            oLogger.error("No valid cache key segment last modification date provided by the OData Model");
                            sCacheKey = new Date().getTime() + ""; //to keep the application working the current timestamp is used
                        }
                        return sCacheKey;
                    });

                    aCacheKeys.push(pGetMetadataLastModified);
                }

                if (oModel.annotationsLoaded && typeof oModel.metadataLoaded === "function") {
                    var pGetAnnotationsLastModified = oModel.annotationsLoaded().then(function (mParams) {
                        var iCacheKey = 0;
                        if (mParams) {
                            for (var i = 0; i < mParams.length; i++) {
                                if (mParams[i].lastModified) {
                                    var iLastModified = new Date(mParams[i].lastModified).getTime();
                                    if (iLastModified > iCacheKey) {
                                        iCacheKey = iLastModified;
                                    }
                                }
                            }
                        }
                        if (iCacheKey === 0) {
                            oLogger.error("No valid cache key segment last modification date provided by OData annotations");
                            iCacheKey = new Date().getTime(); //to keep the application working the current timestamp is used
                        }
                        return iCacheKey + "";
                    });
                    aCacheKeys.push(pGetAnnotationsLastModified);
                }

                return aCacheKeys;
            }
        },

        createContent: function () {
            var oComponentData = this.getComponentData && this.getComponentData();
            var oModel = oComponentData.model;
            var pOvplibResourceBundle;
            var oPreprocessors;

            var oMainComponent = oComponentData && oComponentData.mainComponent;
            var oModelViewMap = oMainComponent && oMainComponent.oModelViewMap;
            var sModelName = oComponentData && oComponentData.modelName;

            var fnCombineBatch = function () {
                if (oModel && sModelName) {
                    oModel.bIncludeInCurrentBatch = false;
                    if (oModelViewMap && sModelName && oModelViewMap[sModelName] && oModelViewMap[sModelName][oComponentData.cardId]) {
                        delete oModelViewMap[sModelName][oComponentData.cardId]; //delete view being processed from map
                        //After deleting the current view from model map, if there are other views attached
                        //to the model then include them in current batch
                        if (Object.keys(oModelViewMap[sModelName]).length > 0) {
                            oModel.bIncludeInCurrentBatch = true;
                        }
                    }
                }
            };

            if (oComponentData && oComponentData.mainComponent) {
                pOvplibResourceBundle = oComponentData.mainComponent._getOvplibResourceBundle();
            } else {
                pOvplibResourceBundle = this.getOvplibResourceBundle();
            }
            oPreprocessors = this.getPreprocessors(pOvplibResourceBundle);

            var oViewConfig = {
                preprocessors: oPreprocessors,
                type: ViewType.XML,
                viewName: CommonUtils.isODataV4(oModel) ? "sap.ovp.cards.v4.generic.Card" : "sap.ovp.cards.generic.Card",
                async: true
            };
            // Get the cache keys for the view, if present set the keys (async is
            // prerequisite for cached view)
            var aCacheKeys = this._getCacheKeys();
            if (aCacheKeys && aCacheKeys.length && aCacheKeys.length > 0) {
                oViewConfig.cache = {
                    keys: aCacheKeys
                };
            }
            /**
             * power user
             * temp change
             */
            var sLoadingOrErrorState = this._getCardPropertyDefaults().state;
            var sIdForCardView = oComponentData.cardId + (sLoadingOrErrorState ? sLoadingOrErrorState : "Original");
            if (!sLoadingOrErrorState) {
                sIdForCardView =
                    sIdForCardView + (oComponentData.settings.selectedKey ? "_Tab" + oComponentData.settings.selectedKey : "");
            }

            if (oModel && oModel.bUseBatch && !oViewConfig.async) {
                fnCombineBatch();
            }

            if (oComponentData.appComponent && typeof oComponentData.appComponent.createId === "function") {
                sIdForCardView = oComponentData.appComponent.createId(sIdForCardView);
            }
            // if the card is for settings dialog, don't set an ID to the card view
            var oView = new XMLView(
                oComponentData.containerId === "dialogCard" ? undefined : sIdForCardView,
                oViewConfig
            );
            /**
             * end
             */

            //For async view creation, model read and request fire happens from
            //method onControllerConnected, so before this executes, insert some
            //custom code to handle model batch
            if (oViewConfig.async) {
                var fnOnControllerConnected = oView.onControllerConnected;
                oView.onControllerConnected = function () {
                    if (oModel && oModel.bUseBatch) {
                        fnCombineBatch();
                    }
                    fnOnControllerConnected.apply(oView, arguments);
                };
            }

            oView.setModel(oModel);

            // check if i18n model is available and then add it to card view
            if (oComponentData.i18n) {
                oView.setModel(oComponentData.i18n, "@i18n");
            }
            oView.setModel(oPreprocessors.xml.ovpCardProperties, "ovpCardProperties");
            oView.setModel(pOvplibResourceBundle, "ovplibResourceBundle");

            return oView;
        }
    });
});
