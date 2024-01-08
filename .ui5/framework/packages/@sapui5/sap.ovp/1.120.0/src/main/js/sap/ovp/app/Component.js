/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/fe/core/AppComponent",
    "sap/fe/navigation/NavigationHandler",
    "sap/base/util/ObjectPath",
    "sap/ui/model/json/JSONModel",
    "sap/ovp/ui/DashboardLayoutUtil",
    "sap/ui/core/mvc/ViewType",
    "sap/ui/model/resource/ResourceModel",
    "sap/ovp/app/resources",
    "sap/ui/core/CustomData",
    "sap/base/util/merge",
    "sap/base/util/isEmptyObject",
    "sap/ovp/app/OVPLogger",
    "sap/ui/Device",
    "sap/ovp/cards/CommonUtils",
    "sap/ovp/placeholder/placeholderHelper",
    "sap/m/App",
    "sap/m/DynamicDateUtil",
    "sap/ovp/cards/MetadataAnalyser",
    "sap/ui/core/Core",
    "sap/insights/CardHelper",
    "sap/ui/VersionInfo",
    "sap/ui/core/mvc/View",
    "sap/suite/ui/commons/collaboration/CollaborationHelper",
    "sap/ovp/cards/charts/OVPChartFormatter",
    "sap/ovp/insights/CardProvider",
    "sap/ui/rta/RuntimeAuthoring"    /*Don't Remove this. Important for Personalization to work*/
], function (
    AppComponent,
    NavigationHandler,
    ObjectPath,
    JSONModel,
    DashboardLayoutUtil,
    ViewType,
    ResourceModel,
    OvpResources,
    CustomData,
    merge,
    isEmptyObject,
    OVPLogger,
    Device,
    CommonUtils,
    placeholderHelper,
    App,
    DynamicDateUtil,
    MetadataAnalyser,
    Core,
    CardHelper,
    VersionInfo,
    View,
    CollaborationHelper,
    OVPChartFormatter,
    CardProvider,
    RuntimeAuthoring
) {
    "use strict";
    // We need to require RuntimeAuthoring 'sap.ui.rta.RuntimeAuthoring' in the very beginning to be able to personalize.
    // Without RuntimeAuthoring at this point or maybe a little later but not too late, for instance, in Main controller,
    // the change handler will not be called by sap.ui.fl
    var oLogger = new OVPLogger("OVP.app.Component");

    /**
	 * Main class used for Overview Page Application Component
	 * @class Overview Page Application Component
	 * 
	 * @public
	 * @extends sap.fe.core.AppComponent
	 * @abstract
	 * @author SAP SE
	 * @version 1.120.0
	 * @name sap.ovp.app.Component
     * @namespace
	 */
    return AppComponent.extend("sap.ovp.app.Component", {
        // use inline declaration instead of component.json to save 1 round trip
        metadata: {
            "manifest": "json",
            routing: {
                config: {
                    routerClass: "sap.m.routing.Router"
                },
                targets: {},
                routes: []
            },

            properties: {},

            // For AppComponent, override designtime to make OVP adaptable
            designtime: {
                actions: {},
                // This object defines hooks that are being called when a tool, e.g. Runtime Adaptation, is started and stopped.
                tool: {
                    start: function(oAppComponent) {
                        var oUIModel = oAppComponent.getModel("ui");
                        if (oUIModel) {
                            oUIModel.setProperty("/bRTAActive", true);
                        }
                    },
                    stop: function(oAppComponent) {
                        var oUIModel = oAppComponent.getModel("ui");
                        if (oUIModel) {
                            oUIModel.setProperty("/bRTAActive", false);
                        }
                    }
                },
                aggregations: {
                    rootControl: {
                        actions: {},
                        propagateMetadata: function () {
                            return {};
                         }
                    }
                }
            },

            version: "1.120.0",

            library: "sap.ovp.app",

            dependencies: {
                // OVP Library load is required in case it is not mentioned in app manifest
                libs: ["sap.ovp"],
                components: []
            },
            config: {
                fullWidth: true,
                hideLightBackground: true
            }
        },

        // Declaration/override is required to use AppComponent
        onServicesStarted: function() { },

        // Declaration/override is required to use AppComponent
        getRoutingService: function() {
            return {
                beforeExit: function() {}
            };
        },

        /**
         * @private
         * @returns {object} - model of dashboard layout util
         */
        getDashboardLayoutUtil: function() {
            return this.oDashboardLayoutUtil;
        },

        /**
         * @param {string} sCardId - Id of the card for which config is needed
         * @returns {object} - Configuration of card for named sCardId
         */
        _getOvpCardOriginalConfig: function (sCardId) {
            var oOvpConfig = this.getOvpConfig();
            return oOvpConfig.cards[sCardId];
        },

        suspend: function() {
            if (this.ovpConfig.bInsightRTEnabled) {
                CardProvider.unregisterProvider(this.getId());
            }
        },

        isCollaborationManagerServiceEnabled: function() {
            return false;
        },

        /**
         * function will be invoked when navigating to an application that was suspended
         * there is a need to restore this application from the suspend mode to active mode
         * when sap-keep-alive is set to true.
         */
        restore: function () {
            var aOVPCardsConfig = this.ovpConfig.cards,
                sMainViewId = this.createId("mainView"),
                oMainApp = this.byId(sMainViewId);
            var oEntitySetForRefresh = this.ovpConfig.refreshStrategyOnAppRestore &&
                                    this.ovpConfig.refreshStrategyOnAppRestore.entitySets;

            var oMainController = oMainApp.getController();
            var oNavHandler = new NavigationHandler(oMainController);
            CommonUtils.enable(oMainController, oNavHandler);

            if (typeof oEntitySetForRefresh === "object") {
                var aEntitySetForRefresh = Object.keys(oEntitySetForRefresh);
                var aCardsToRefresh = aOVPCardsConfig.filter(function(oCardConfig) {
                    return aEntitySetForRefresh.includes(oCardConfig.settings.entitySet);
                });
    
                for (var i = 0; i < aCardsToRefresh.length; i++) {
                    var oCardConfig = aCardsToRefresh[i];
                    var sCardId = oMainApp.createId(oCardConfig.id);
                    var oCard = this.byId(sCardId);
                    var oCardController = oCard.getComponentInstance() &&
                            oCard.getComponentInstance().getRootControl() &&
                            oCard.getComponentInstance().getRootControl().getController();
    
                    if (oCardController) {
                        oCardController.refreshCardContent();
                    }
                } 
            }
            OVPChartFormatter.registerCustomFormatters();

            if (this.ovpConfig.bInsightRTEnabled) {
                var sAppId = this.getMetadata().getManifestEntry("sap.app").id,
                    oRawManifest = this.getManifestObject().getRawJson(),
                    sFiorAppID = (oRawManifest["sap.fiori"] && 
                            oRawManifest["sap.fiori"].registrationIds && 
                            oRawManifest["sap.fiori"].registrationIds[0]) || sAppId;

                aOVPCardsConfig.forEach(function(oCardConfig) {
                    var sCardId = oMainApp.createId(oCardConfig.id),
                        oCard = this.byId(sCardId),
                        oCardController = oCard.getComponentInstance() &&
                                oCard.getComponentInstance().getRootControl() &&
                                oCard.getComponentInstance().getRootControl().getController(),
                        oOvpCardPropertiesModel = oCardController && 
                                oCardController.getView() && 
                                oCardController.getView().getModel("ovpCardProperties");
                    
                    CardProvider.addInsightCard(oOvpCardPropertiesModel, sFiorAppID);
                }.bind(this));

                CardProvider.init(this.getId());
            }
        },

        /**
         * get the merged sap.ovp section from all component hierarchy
         * @returns merged sap.ovp section from manifes files
         */
        getOvpConfig: function () {
            var oOvpConfig;
            var aExtendArgs = [];
            var oManifest = this.getMetadata();
            //loop over the manifest hierarchy till we reach the current generic component
            while (oManifest && oManifest.getComponentName() !== "sap.ovp.app") {
                oOvpConfig = oManifest.getManifestEntry("sap.ovp");
                if (oOvpConfig) {
                    //as the last object is the dominant one we use unshift and not push
                    aExtendArgs.unshift(oOvpConfig);
                }
                oManifest = oManifest.getParent();
            }
            //add an empty object for the merged config as we don't whant to change the actual manifest objects
            aExtendArgs.unshift({});
            //add deep flag so the merge would be recurcive
            aExtendArgs.unshift(true);
            oOvpConfig = merge.apply(merge, aExtendArgs);
            return oOvpConfig;
        },

        /**
         *  Removing extra array elements in oSettings array
         *
         *  @param {object} oSettings - Original Manifest settings
         *  @param {object} oCustomerSettings - Customer Modified settings
         *  @private
         */
        _removeExtraArrayElements: function (oSettings, oCustomerSettings) {
            var aSetStaCon = oSettings["staticContent"],
                aCusSetStaCon = oCustomerSettings["staticContent"],
                aSetTabs = oSettings["tabs"],
                aCusSetTabs = oCustomerSettings["tabs"];
            /**
             *  Checking if there is staticContent Array
             */
            if (aSetStaCon && aCusSetStaCon) {
                /**
                 *  Checking if oSettings Array length is greater than oCustomerSettings
                 */
                if (aSetStaCon.length > aCusSetStaCon.length) {
                    oSettings["staticContent"].splice(aCusSetStaCon.length, aSetStaCon.length - aCusSetStaCon.length);
                }
            }

            /**
             *  Checking if there is tabs Array
             */
            if (aSetTabs && aCusSetTabs) {
                /**
                 *  Checking if oSettings Array length is greater than oCustomerSettings
                 */
                if (aSetTabs.length > aCusSetTabs.length) {
                    oSettings["tabs"].splice(aCusSetTabs.length, aSetTabs.length - aCusSetTabs.length);
                }
            }
        },

        /**
         *  Emptying all array elements in oSettings array
         *
         *  @param {object} oSettings - Original Manifest settings
         *  @private
         */
        _emptyAllArrayElements: function (oSettings, oCustomSettings) {
            var aSettingsStaticContent = oSettings["staticContent"],
                aCustomerStaticContent = oCustomSettings["staticContent"],
                aSettingsTabContent = oSettings["tabs"],
                aCustomerTabContent = oCustomSettings["tabs"];
            /**
             *  Checking if there is staticContent Array
             */
            if (aSettingsStaticContent && aCustomerStaticContent) {
                /**
                 *  Emptying all array elements in staticContent array
                 */
                for (var i = 0; i < aSettingsStaticContent.length; i++) {
                    oSettings["staticContent"][i] = {};
                }
            }

            /**
             *  Checking if there is tabs Array
             */
            if (aSettingsTabContent && aCustomerTabContent) {
                /**
                 *  Emptying all array elements in tabs array
                 */
                for (var i = 0; i < aSettingsTabContent.length; i++) {
                    oSettings["tabs"][i] = {};
                }
            }
        },

        /**
         *  Returns an object after merging oObject2 inside oObject1
         *
         *  @param {object} oObject1 - First Object
         *  @param {object} oObject2 - Second Object
         *  @returns {object} - Merged Object
         *  @private
         */
        _mergeObjects: function (oObject1, oObject2) {
            for (var prop in oObject2) {
                if (oObject2.hasOwnProperty(prop)) {
                    var val = oObject2[prop];
                    if (typeof val == "object" && oObject1[prop]) { // this also applies to arrays or null!
                        if (val.operation === "DELETE") {
                            delete oObject1[prop];
                        } else {
                            this._mergeObjects(oObject1[prop], val);
                        }
                    } else {
                        /**
                         *  This Scenario comes when we are trying to delete
                         *  the property which does not exists in the object
                         *
                         *  Skip assigning val to oObject1 for the current key
                         *  if val is an object containing "DELETE" operation
                         */
                        if (typeof val == "object" && !oObject1[prop] && val.operation === "DELETE") {
                            continue;
                        }
                        oObject1[prop] = val;
                    }
                }
            }

            return oObject1;
        },

        /**
         *  Returns an object after merging layer settings object to the original settings object
         *
         *  @param {Object} oCard - Card Configuration Object
         *  @param {String} sLayer - Layer Name
         *  @returns {Object} - New Card Configuration Object
         *  @private
         */
        _mergeLayerObject: function (oCard, sLayer) {
            if (!oCard[sLayer + ".settings"]) {
                return oCard;
            }

            var oSettings = merge({}, oCard["settings"]),
                oCustomSettings = merge({}, oCard[sLayer + ".settings"]);
            /**
             *  Handling case where oSettings has an array whose length
             *  is greater than length of a similar array in oCustomSettings
             *
             *  Here we delete extra elements from oSettings array
             */
            this._removeExtraArrayElements(oSettings, oCustomSettings);

            /**
             *  Emptying all the array elements in oSettings to
             *  remove unnecessary properties getting merged in final settings
             */
            this._emptyAllArrayElements(oSettings, oCustomSettings);

            oCard["settings"] = this._mergeObjects(oSettings, oCustomSettings);

            return oCard;
        },

        /**
         *  Returns the card descriptor fully merged with Key User Changes
         *
         *  @param {object} oCard - Card descriptor
         *  @returns {object} - final card descriptor
         *  @private
         */
        _mergeKeyUserChanges: function (oCard) {
            if (!oCard.hasOwnProperty("customer.settings") && !oCard.hasOwnProperty("customer_base.settings") && !oCard.hasOwnProperty("vendor.settings")) {
                return oCard;
            }

            /**
             *  Priority of Layers
             *  1. Vendor
             *  2. Customer Base
             *  3. Customer
             */
            /**
             *  Vendor Layer
             */
            oCard = this._mergeLayerObject(oCard, "vendor");

            /**
             *  Customer_Base Layer
             */
            oCard = this._mergeLayerObject(oCard, "customer_base");

            /**
             *  Customer Layer
             */
            oCard = this._mergeLayerObject(oCard, "customer");

            return oCard;
        },

        /**
         * Returns the fully qualified name of an entity which is e.g. "com.sap.GL.ZAF.GL_ACCOUNT" from the specified type name.
         *
         * @param {string} sEntityTypeName - the entity Type name which needs to be converted
         * @returns {string} - the fully qualified name for this entity
         * @private
         */
        _getFullyQualifiedNameForEntity: function (sEntityTypeName, oFilterModel) {
            var sNamespace = "", sResult;
            if (!sEntityTypeName) {
                return "";
            }
            // if entity type name already has a ".", this means namespace is already there, just return it
            if (sEntityTypeName.indexOf(".") > -1) {
                return sEntityTypeName;
            }
            var oFilterMetaModel = oFilterModel.getMetaModel();

            //There can be multiple schemas each having a different namespace in a particular metadata, in such a scenario,
            //the below code will populate namespace from default entity container
            if (CommonUtils.isODataV4(oFilterModel)) {
                var oEntityContainer = oFilterMetaModel.getObject("/");
                var oEntitySet = oEntityContainer[sEntityTypeName];
                sNamespace = oEntitySet.$Type;
                return sNamespace;
            } else {
                var oDefaultEntityContainer = oFilterMetaModel && oFilterMetaModel.getODataEntityContainer();

                sNamespace = oDefaultEntityContainer && oDefaultEntityContainer.namespace;
                if (sNamespace && !(sEntityTypeName.indexOf(sNamespace) > -1)) {
                    sResult = sNamespace + "." + sEntityTypeName;
                } else {
                    sResult = sEntityTypeName;
                }
                return sResult;
            }
        },

        _getDatePropertiesFromEntitySet: function (oFilterModel, oFilterBarEntityType, sEntityType) {
            var aProperties = [], aDateProperties = [];
            var oFilterMetaModel = oFilterModel.getMetaModel();
            var oEntityContainer = oFilterMetaModel && oFilterMetaModel.getODataEntityContainer();
            var aEntityType = oEntityContainer.entitySet.filter(function(oEntitySet) {
                return oEntitySet.entityType === sEntityType;
            });
            
            var oEntityType = aEntityType.length > 0 ? aEntityType[0] : {};
            var bParameterised = MetadataAnalyser.checkAnalyticalParameterisedEntitySet(oFilterModel, oEntityType.name);
            if (bParameterised) {
                var oParametersInfo = MetadataAnalyser.getParametersByEntitySet(oFilterModel, oEntityType.name);
                if (oParametersInfo.entitySetName) {
                    aProperties = MetadataAnalyser.getPropertyOfEntitySet(oFilterModel, oParametersInfo.entitySetName);
                    // enhance analytical parameter metadata to include filter restriction
                    // for parameter property filter restriction will always be single-value
                    aProperties.forEach(function(oProperty) {
                        oProperty._filterRestriction = "single-value";
                    });
                }
            }

            aProperties = aProperties.concat(oFilterBarEntityType.property);
            for (var key in aProperties) {
                var oDatePropertyPath = {};
                if (CommonUtils.isDate(aProperties[key])) {
                    oDatePropertyPath.PropertyPath = aProperties[key].name;
                }
                if (!isEmptyObject(oDatePropertyPath)) {
                    aDateProperties.push(oDatePropertyPath);
                }
            }
            return aDateProperties;
        },

        _getAllControlConfiguration: function (aDateProperties, aSelectionFieldProperties, oDatePropertiesSettings) {
            for (var i = 0; i < aDateProperties.length; i++) {
                if (oDatePropertiesSettings[aDateProperties[i].PropertyPath]) {
                    var bIsDatePropertyInSelectionField = false;
                    for (var j = 0; j < aSelectionFieldProperties.length; j++) {
                        if (aSelectionFieldProperties[j].PropertyPath === aDateProperties[i].PropertyPath) {
                            bIsDatePropertyInSelectionField = true;
                        }
                    }
                    if (!bIsDatePropertyInSelectionField) {
                        aDateProperties[i].bNotPartOfSelectionField = true;
                        aSelectionFieldProperties.push(aDateProperties[i]);
                    }
                }
            }
            return aSelectionFieldProperties;
        },
        _getSettingsForDateProperties: function (aDateProperties, oDateSettingsFromManifest) {
            var oDatePropertiesResult = {};
            for (var key in aDateProperties) {
                if (oDateSettingsFromManifest.fields && oDateSettingsFromManifest.fields[aDateProperties[key].PropertyPath]) {
                    oDatePropertiesResult[aDateProperties[key].PropertyPath] = this.getConditionTypeForDateSetting(oDateSettingsFromManifest.fields[aDateProperties[key].PropertyPath]);
                } else {
                    if (oDateSettingsFromManifest.customDateRangeImplementation || oDateSettingsFromManifest.filter || oDateSettingsFromManifest.selectedValues) {
                        oDatePropertiesResult[aDateProperties[key].PropertyPath] = this.getConditionTypeForDateSetting(oDateSettingsFromManifest);
                    }
                }
            }
            return oDatePropertiesResult;
        },
        getConditionTypeForDateSetting: function (oDateRangeTypeConfiguration) {
            if (oDateRangeTypeConfiguration.customDateRangeImplementation) {
                return { customDateRangeImplementation: oDateRangeTypeConfiguration.customDateRangeImplementation };
            } else if (oDateRangeTypeConfiguration.filter) {
                return { filter: oDateRangeTypeConfiguration.filter };
            } else if (oDateRangeTypeConfiguration.selectedValues) {
                return { selectedValues: oDateRangeTypeConfiguration.selectedValues, exclude: (oDateRangeTypeConfiguration.exclude !== undefined) ? oDateRangeTypeConfiguration.exclude : true };
            } else if (oDateRangeTypeConfiguration.defaultValue) {
                return { defaultValue: oDateRangeTypeConfiguration.defaultValue };
            }
            return undefined;
        },
        getViewSettings: function (ovpConfig) {
            if (this.getRouter()) {
                this.getRouter().initialize();
            }
            var appConfig = this.getMetadata().getManifestEntry("sap.app");
            var uiConfig = this.getMetadata().getManifestEntry("sap.ui");
            var sIcon = ObjectPath.get("icons.icon", uiConfig);

            var oFilterModel = this.getModel(ovpConfig.globalFilterModel);
            var oFilterMetaModel = oFilterModel && oFilterModel.getMetaModel();
            this.setModel(oFilterModel);

            var sComponentName = this.getMetadata().getComponentName();
            // sComponentNameForURL is created by replacing all the '.' to '/' to support sap.ui.require.toUrl API
            var sComponentNameForURL = sComponentName.replace(/\./g, "/");
            ovpConfig.baseUrl = sap.ui.require.toUrl(sComponentNameForURL);
            ovpConfig.useMacroFilterBar = oFilterModel ? CommonUtils.isODataV4(oFilterModel) : false;

            if (ovpConfig.smartVariantRequired === undefined || ovpConfig.smartVariantRequired === null) {
                ovpConfig.smartVariantRequired = true;
            }
            if (ovpConfig.enableLiveFilter === undefined || ovpConfig.enableLiveFilter === null) {
                ovpConfig.enableLiveFilter = true;
            }
            if (ovpConfig.showDateInRelativeFormat === undefined || ovpConfig.showDateInRelativeFormat === null) {
                ovpConfig.showDateInRelativeFormat = true;
            }
            if ((ovpConfig.filterSettings && ovpConfig.filterSettings.dateSettings && (ovpConfig.filterSettings.dateSettings.useDateRange !== undefined)) && ovpConfig.useDateRangeType !== undefined) {
                throw new Error("Defining both useDateRange and useDateRangeType in the manifest is not allowed");
            }
            ovpConfig.useDateRangeType = (ovpConfig.filterSettings && ovpConfig.filterSettings.dateSettings && (ovpConfig.filterSettings.dateSettings.useDateRange !== undefined)) ? ovpConfig.filterSettings.dateSettings.useDateRange : ovpConfig.useDateRangeType;
            if (ovpConfig.useDateRangeType === undefined || ovpConfig.useDateRangeType === null) {
                ovpConfig.useDateRangeType = false;
            }
            if (ovpConfig.bHeaderExpanded === undefined || ovpConfig.bHeaderExpanded === null) {
                ovpConfig.bHeaderExpanded = Device.system.desktop ? true : false;
            }

            if (ovpConfig.chartSettings === undefined || ovpConfig.chartSettings === null) {
                ovpConfig.chartSettings = {};
            }
            if (ovpConfig.chartSettings.showDataLabel === undefined || ovpConfig.chartSettings.showDataLabel === null) {
                ovpConfig.chartSettings.showDataLabel = false;
            }

            //If global filter entity set is provided, then populate entity type using that entity set
            if (ovpConfig.globalFilterEntitySet && ovpConfig.globalFilterEntitySet !== " ") {
                var oEntitySet = oFilterMetaModel && oFilterMetaModel.getODataEntitySet(ovpConfig.globalFilterEntitySet);
                ovpConfig.globalFilterEntityType = oEntitySet && oEntitySet.entityType;
            }
            var sEntitySet = ovpConfig.globalFilterEntityType;
            //Get fully-qualified and non-qualified entity type name
            if (ovpConfig.globalFilterEntityType && ovpConfig.globalFilterEntityType !== " " &&
                ovpConfig.globalFilterEntityType.length > 0) {
                ovpConfig.globalFilterEntityType = this._getFullyQualifiedNameForEntity(ovpConfig.globalFilterEntityType, oFilterModel);
                ovpConfig.globalFilterEntityTypeNQ = ovpConfig.globalFilterEntityType.split(".").pop();
            }
            var uiModel = new JSONModel(ovpConfig);
            var bRTAStarting = RuntimeAuthoring.willRTAStartAfterReload();
            uiModel.setProperty("/bRTAActive", bRTAStarting);
            uiModel.setProperty("/applicationId", ObjectPath.get("id", appConfig));
            uiModel.setProperty("/title", ObjectPath.get("title", appConfig));
            uiModel.setProperty("/description", ObjectPath.get("description", appConfig));
            if (ovpConfig.globalFilterEntityType) {
                var aAllControlConfiguration, oEntityType;
                if (CommonUtils.isODataV4(oFilterModel)) {
                    aAllControlConfiguration = oFilterMetaModel.getObject("/" + ovpConfig.globalFilterEntityType + "@com.sap.vocabularies.UI.v1.SelectionFields");
                    oEntityType = oFilterMetaModel.getObject("/" + ovpConfig.globalFilterEntityType);
                    uiModel.setProperty("/mainEntityVersion", "ODataV4");
                } else {
                    oEntityType = oFilterMetaModel.getODataEntityType(ovpConfig.globalFilterEntityType);
                    aAllControlConfiguration = merge([], oEntityType["com.sap.vocabularies.UI.v1.SelectionFields"]);
                    uiModel.setProperty("/mainEntityVersion", "ODataV2");
                    //Support for Semantic Date for smart filter bar
                    if (ovpConfig.filterSettings && ovpConfig.filterSettings.dateSettings) {
                        //Get all DateProperties from the FilterBar EntitySet
                        var aDateProperties = this._getDatePropertiesFromEntitySet(oFilterModel, oEntityType, ovpConfig.globalFilterEntityType);
                        //get settings defined for the date properties from the manifest
                        var oDatePropertiesSettings = this._getSettingsForDateProperties(aDateProperties, ovpConfig.filterSettings.dateSettings);
                        //handles the dateSettings both in case of useDateRange true and dateSettings exists
                        if (uiModel.getProperty("/useDateRangeType") && oDatePropertiesSettings && !isEmptyObject(oDatePropertiesSettings)) {
                            uiModel.setProperty("/useDateRangeType", false);
                            aDateProperties.forEach(function (oDateProperty) {
                                if (!oDatePropertiesSettings.hasOwnProperty(oDateProperty["PropertyPath"]) || !oDatePropertiesSettings[oDateProperty["PropertyPath"]]) {
                                    var sPath = oDateProperty["PropertyPath"];
                                    oDatePropertiesSettings[sPath] = { "selectedValues": DynamicDateUtil.getAllOptionKeys().toString(), "exclude": false };
                                }
                            });
                        }
                        //Get a union of both DateProperties and SelectionFields and set as fields required for creating date configuration
                        aAllControlConfiguration = this._getAllControlConfiguration(aDateProperties, aAllControlConfiguration, oDatePropertiesSettings);
                        uiModel.setProperty("/datePropertiesSettings", oDatePropertiesSettings);
                    }
                }
                uiModel.setProperty("/allControlConfiguration", aAllControlConfiguration);
                uiModel.setProperty("/mainEntityType", oEntityType);
            }
            if (sIcon) {
                if (sIcon.indexOf("sap-icon") < 0 && sIcon.charAt(0) !== '/') {
                    sIcon = ovpConfig.baseUrl + "/" + sIcon;
                }
                uiModel.setProperty("/icon", sIcon);
            }

            //convert cards object into sorted array
            var oCards = ovpConfig.cards;
            var aCards = [];
            var oCard;
            for (var cardKey in oCards) {
                if (oCards.hasOwnProperty(cardKey) && oCards[cardKey]) {
                    oCard = this._mergeKeyUserChanges(oCards[cardKey]);
                    oCard.id = cardKey;
                    aCards.push(oCard);
                }
            }

            aCards.sort(function (card1, card2) {
                if (card1.id < card2.id) {
                    return -1;
                } else if (card1.id > card2.id) {
                    return 1;
                } else {
                    return 0;
                }
            });

            uiModel.setProperty("/cards", aCards);
            if (this.inResizableTestMode() === true) {
                ovpConfig.containerLayout = "resizable";
            }

            // Layout switch: read 'containerLayout' property from manifest
            if (ovpConfig.containerLayout && ovpConfig.containerLayout === "resizable") {
                uiModel.setProperty("/cardContainerFragment", "sap.ovp.app.DashboardCardContainer");
                //Read all the property "/resizableLayout" from the manifest and set it to "/dashboardLayout" property
                uiModel.setProperty("/dashboardLayout", ovpConfig.resizableLayout);
                var oDblUtil = new DashboardLayoutUtil(uiModel);
                this.oDashboardLayoutUtil = oDblUtil;
            } else {
                // default + compatibility --> EasyScanLayout
                uiModel.setProperty("/cardContainerFragment", "sap.ovp.app.CardContainer");
            }

            this.setModel(uiModel, "ui");

            /* What: Using Resource Bundle to get strings to display on error page. */
            var ovplibResourceBundle = this._getOvpLibResourceBundle();
            this.setModel(ovplibResourceBundle, "ovplibResourceBundle");

            var oEntityType;
            if (CommonUtils.isODataV4(oFilterModel)) {
                oEntityType = "/" + ovpConfig.globalFilterEntityType;
            } else {
                oEntityType = oFilterMetaModel && oFilterMetaModel.getODataEntityType(ovpConfig.globalFilterEntityType, true);
            }
            var sMainComponentId = this.createId("mainView");
            var oConverterContext = new JSONModel({}); // Converter Context model is required to load FE Macro filter bar
            /**
             * power user
             * temp
             */
            return {
                id: sMainComponentId,
                height: "100%",
                preprocessors: {
                    xml: {
                        bindingContexts: {
                            ui: uiModel.createBindingContext("/"),
                            meta: oFilterMetaModel.createBindingContext(oEntityType),
                            contextPath: oFilterMetaModel.createBindingContext("/" + sEntitySet),
                            entitySet: sEntitySet,
                            converterContext: oConverterContext.createBindingContext("/")
                        },
                        models: {
                            ui: uiModel,
                            meta: oFilterMetaModel,
                            contextPath: oFilterMetaModel,
                            metaModel: oFilterMetaModel,
                            converterContext: oConverterContext
                        }
                    }
                },
                type: ViewType.XML,
                viewName: "sap.ovp.app.Main",
                async: true,
                //To get the template for Overview Page Extensibility via UI Adaptation Editor tool
                customData: [new CustomData({
                    key: "sap-ui-custom-settings",
                    value: {
                        "sap.ui.dt": {
                            "designtime": "sap/ovp/ui/OVPWrapper.designtime"
                        }
                    }
                })]
            };
        },

        _showErrorPage: function () {
            /* About: this function
             *  When: If error occurs and getMetaModel.loaded() promise gets rejected
             *  How: Loads Error Page into the Root Container and sets Aggregation
             */
            var ovplibResourceBundle = this._getOvpLibResourceBundle();
            View.create({
                height: "100%",
                type: ViewType.XML,
                viewName: "sap.ovp.app.Error"
            }).then(function(oView) {
                /* What: Using Resource Bundle to get strings to display on error page. */
                oView.setModel(ovplibResourceBundle, "ovplibResourceBundle");
                this.setAggregation("rootControl", oView);
                if (this.oContainer) {
                    this.oContainer.invalidate();
                }
            }.bind(this));
        },

        _formParamString: function (oParams) {
            var aKeys = Object.keys(oParams);
            var index;
            var sParams = "?";
            for (index = 0; index < aKeys.length; index++) {
                sParams = sParams + aKeys[index] + "=" + oParams[aKeys[index]] + "&";
            }
            return sParams.slice(0, -1);
        },

        /**
         * If a card has "requireAppAuthorization" in its manifest property, we need to validate if the user has
         * autherization to view the card. Cards without autherization are removed.
         * @param {object} oOvpConfig 
         * @returns {Promise<object>} A promise that contains the oOvpConfig after removing unautherized cards configuration
         */
        _checkForAuthorizationForCards: function (oOvpConfig) {
            var oCoreConfig = Core.getConfiguration();
            var bDesignMode = oCoreConfig && oCoreConfig.getDesignMode();

            //If application is in Design Mode, requireAppAuthorization checks should be skipped.
            if (bDesignMode) {
                return Promise.resolve(oOvpConfig);
            }

            var aCardsIntent = [];
            var aRequireAuthCardId = [];
            for (var sCardId in oOvpConfig.cards) {
                var oCard = oOvpConfig.cards[sCardId];
                if (oCard && oCard.settings && oCard.settings.requireAppAuthorization) {
                    aRequireAuthCardId.push(sCardId);
                    aCardsIntent.push({ 
                        "target": { 
                            "shellHash": oCard.settings.requireAppAuthorization 
                        } 
                    });
                }
            }

            if (aCardsIntent.length > 0 && sap.ushell && sap.ushell.Container) {
                return sap.ushell.Container.getServiceAsync("CrossApplicationNavigation")
                    .then(function (CrossApplicationNavigationService) {
                        return CrossApplicationNavigationService.isNavigationSupported(aCardsIntent);
                    })
                    .then( function(oResponse) {
                        var aUnsupportedCards = aRequireAuthCardId.filter(function(sCardId, index) {
                            if (!oResponse[index].supported) {
                                return sCardId;
                            }
                        });
                        for (var i = 0; i < aUnsupportedCards.length; i++) {
                            for (var sCardId in oOvpConfig.cards) {
                                if (aUnsupportedCards[i] === sCardId) {
                                    delete oOvpConfig.cards[sCardId];
                                    break;
                                }
                            }
                        }
                        return Promise.resolve(oOvpConfig);
                    })
                    .catch(function(oError) {
                        oLogger.error(oError);
                        return Promise.reject(oError);
                    });
            } else {
                return Promise.resolve(oOvpConfig);
            }
        },
        _checkForAuthorizationForLineItems: function () {
            return new Promise(function (resolve, reject) {
                var aAllIntents = [],
                    aCardsWithStaticContent = [],
                    aCardsIntent = [];
                var oOvpConfig = this.getOvpConfig();
                var oCards = oOvpConfig["cards"];
                for (var sCard in oCards) {
                    if (oCards.hasOwnProperty(sCard) && oCards[sCard]) {
                        var card = oCards[sCard];
                        var oSettings = card.settings;
                        if ((card.template === "sap.ovp.cards.linklist" || card.template === "sap.ovp.cards.v4.linklist") && oSettings.listFlavor === "standard" && oSettings.staticContent) {
                            var aStaticContent = oSettings.staticContent;
                            for (var i = 0; i < aStaticContent.length; i++) {
                                if (aStaticContent[i].semanticObject || aStaticContent[i].action) {
                                    var sIntent = "#" + aStaticContent[i].semanticObject + "-" + aStaticContent[i].action;
                                    if (aStaticContent[i].params) {
                                        var sParams = this._formParamString(aStaticContent[i].params);
                                        sIntent = sIntent + sParams;
                                    }
                                    if (aCardsWithStaticContent.indexOf(sCard) === -1) {
                                        aCardsWithStaticContent.push(sCard);
                                    }
                                    if (aAllIntents.indexOf(sIntent) === -1) {
                                        aAllIntents.push(sIntent);
                                        aCardsIntent.push({ 
                                            "target": { 
                                                "shellHash": sIntent
                                            } 
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
                // Checks for the supported Intents for the user
                if (sap.ushell && sap.ushell.Container) {
                    return sap.ushell.Container.getServiceAsync('CrossApplicationNavigation').then(function (oCrossAppNavigationService) {
                        oCrossAppNavigationService.isNavigationSupported(aCardsIntent).then(function (aResponses) {
                            var oOvpConfig = this.getOvpConfig();
                            this._aCardsWithStaticContent = aCardsWithStaticContent;
                            for (var i = 0; i < aResponses.length; i++) {
                                if (aResponses[i].supported === false && this._aCardsWithStaticContent) {
                                    for (var j = 0; j < this._aCardsWithStaticContent.length; j++) {
                                        var aStaticContent = oOvpConfig["cards"][this._aCardsWithStaticContent[j]].settings.staticContent;

                                        for (var k = aStaticContent.length - 1; k >= 0; k--) {
                                            var sIntent = "#" + aStaticContent[k].semanticObject + "-" + aStaticContent[k].action;
                                            if (aStaticContent[k].params) {
                                                var sParams = this._formParamString(aStaticContent[k].params);
                                                sIntent = sIntent + sParams;
                                            }
                                            if (aAllIntents[i] === sIntent) {
                                                aStaticContent.splice(k, 1);
                                            }
                                        }
                                        oOvpConfig["cards"][this._aCardsWithStaticContent[j]].settings.staticContent = aStaticContent;
                                    }
                                }
                            }

                            delete this._aCardsWithStaticContent;

                            resolve(oOvpConfig);
                        }.bind(this))
                            .catch(function (oError) {
                                oLogger.error(oError);
                                return Promise.reject(oError);
                            });
                    }.bind(this));
                } else {
                    resolve(oOvpConfig);
                }
            }.bind(this));
        },

        createContent: function () {
            if (CollaborationHelper && CollaborationHelper.processAndExpandHash && typeof CollaborationHelper.processAndExpandHash === "function") {
                CollaborationHelper.processAndExpandHash().catch(function (oError) {
                    oLogger.error(oError);
                }).finally(function (){
                    this._createContent();
                }.bind(this));
            } else {
                this._createContent();
            }
        },

        _createContent: function () {
            var ovpConfig = this.getOvpConfig();
            var oFilterModel = this.getModel(ovpConfig.globalFilterModel);
            var aPromises = [
                this._checkForAuthorizationForLineItems(ovpConfig),
                OvpResources.pResourcePromise,
                this._isInsightRTEnabled(),
                VersionInfo.load({
                    library: "sap.ui.core"
                }),
               this._isTeamsModeActive()
            ];
            if (CommonUtils.isODataV4(oFilterModel)) {
                aPromises.unshift(oFilterModel && oFilterModel.getMetaModel().requestObject("/" + ovpConfig.globalFilterModel));
            } else {
                aPromises.unshift(oFilterModel && oFilterModel.getMetaModel().loaded());
            }
            if (oFilterModel && !this.getAggregation("rootControl")) {
                Promise.all(aPromises).then(function (aResponse) {
                    var bInsightRTEnabled = aResponse[3];
                    this.ovpConfig = aResponse[1];
                    this.ovpConfig.sapUICoreVersionInfo = aResponse[4];
                    this.ovpConfig.isTeamsModeActive = aResponse[5];
                    this.ovpConfig.enableV4Insight = this._isInsightEnabledForV4Cards();
                    if (this._isInsightDTEnabled()) {
                        this.ovpConfig.bInsightDTEnabled = true;
                        return Promise.resolve(this.ovpConfig);
                    } else {
                        this.ovpConfig.bInsightRTEnabled = bInsightRTEnabled ? true : false;
                        return this._checkForAuthorizationForCards(this.ovpConfig);
                    }
                }.bind(this)).then(function (aResponse) {
                    this.oOvpConfig = aResponse;
                    // Do the templating once the metamodel is loaded
                    this.runAsOwner(function () {
                        var sNavContainerId = this.createId("host"),
                            oNavContainer = new App(sNavContainerId),
                            oViewSettings = this.getViewSettings(this.oOvpConfig);
                        View.create(oViewSettings).then(function (oView) {
                            // ref: 2370029692, create an 'internal' model for FE Macro
                            oView.bindElement({
                                path: '/',
                                model: "internal"
                            });
                            //Setting viewData model as the setSelectionVariant API from macro filter bar does not work without setting this model
                            var oViewDataModel = new JSONModel({});
                            oView.setModel(oViewDataModel, "viewData");
                            if (placeholderHelper.isPlaceHolderEnabled()) {
                                oNavContainer.addPage(oView);
                                this.setAggregation("rootControl", oNavContainer);
                                placeholderHelper.showPlaceholder(oNavContainer);
                            } else {
                                this.setAggregation("rootControl", oView);
                            }
                            this.oContainer.invalidate();
                        }.bind(this));
                    }.bind(this));
                }.bind(this));
                if (!CommonUtils.isODataV4(oFilterModel)) {
                    oFilterModel.attachMetadataFailed(function () {
                        /*To show error page if metadata Model doesn't get loaded*/
                        this._showErrorPage();
                    }.bind(this));
                }
            }
        },
        _getOvpLibResourceBundle: function () {
            if (!this.ovplibResourceBundle) {
                var oResourceBundle = Core.getLibraryResourceBundle("sap.ovp");
                this.ovplibResourceBundle = oResourceBundle ? new ResourceModel({
                    bundleUrl: oResourceBundle.oUrlInfo.url,
                    bundle: oResourceBundle  //Reuse created bundle to stop extra network calls
                }) : null;
            }
            return this.ovplibResourceBundle;
        },

        createMapForEntityContainer: function (oEntityContainer) {
            var oEntitySetMap = {};
            var oEntitySets = oEntityContainer.entitySet;
            for (var i = 0; i < oEntitySets.length; i++) {
                oEntitySetMap[oEntitySets[i].name] = oEntitySets[i].entityType;
            }
            return oEntitySetMap;
        },

        //Changes to test the Resizable layout in running applications
        inResizableTestMode: function () {
            // get the URL parameter from the parent frame
            return this._getQueryParamUpToTop('resizableTest') == 'true';
        },

        inLazyLoadingTestMode: function() {
            return (this._getQueryParamUpToTop('sap-ovp-xx-lazyloadingtest') == 'true' || this._getQueryParamUpToTop('sap-fe-xx-lazyloadingtest') == 'true');
        },
    
        _isInsightEnabledForV4Cards: function () {
            return this._getQueryParamUpToTop('enable-v4-insight') === 'true';
        },

        _isInsightDTEnabled: function () {
            return this._getQueryParamUpToTop('mode') === 'myInsight' || this._getQueryParamUpToTop('mode') === 'DT';
        },
        
        _isInsightRTEnabled: function() {
            var bRTUrlParameter = this._getQueryParamUpToTop('mode') === 'RT';
            return new Promise(function (resolve, reject) {
                if (!CardHelper || !CardHelper.getServiceAsync) {
                    resolve(bRTUrlParameter);
                    return;
                }
                return CardHelper.getServiceAsync()
                    .then(function (CardHelperServiceInstance) {
                        resolve(!!CardHelperServiceInstance || bRTUrlParameter);
                    })
                    .catch(function (oError) {
                        oLogger.info("Failed to get CardHelperServiceInstance." + oError);
                        resolve(bRTUrlParameter);
                    });
            });
        },

        // check to determine whether OVP is opened in Microsoft Teams environment.
        _isTeamsModeActive: function () {
            var isActive = false;
            return new Promise(function (resolve, reject) {
                if  (CollaborationHelper && CollaborationHelper.isTeamsModeActive && typeof CollaborationHelper.isTeamsModeActive === "function") {
                    return CollaborationHelper.isTeamsModeActive()
                        .then(function(bIsActive) {
                            isActive = bIsActive;
                        })
                        .catch(function (oError) {
                            oLogger.error("Failed to get Collaboration Helper." + oError);
                        })
                        .finally(function () {
                            resolve(isActive);
                        });
                } else {
                    resolve(isActive);
                }
            });
        },

        _getQueryParamUpToTop: function (name) {
            var win = window;
            var val = this.getQueryParam(win.location.search, name);
            if (val != null) {
                return val;
            }
            if (win == win.parent) {
                return null;
            }
            win = win.parent;
            return null;
        },

        getQueryParam: function (query, name) {
            var val = null;
            if (!query) {
                return val;
            }
            if (query.indexOf('?') != -1) {
                query = query.substring(query.indexOf('?'));
            }
            if (query.length > 1 && query.indexOf(name) != -1) {
                query = query.substring(1); // remove '?'
                var params = query.split('&');
                for (var i = 0; i < params.length; i++) {
                    var nameVal = params[i].split('=');
                    if (nameVal[0] == name) {
                        val = nameVal[1];
                        break;
                    }
                }
            }
            return val;
        }
    });
}
);