/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/ui/core/mvc/OverrideExecution"
], function (
    ControllerExtension,
    OverrideExecution
) {
    "use strict";
    /**
     * This class contains all extension functions that can be implemented by the application developers in their extension code. 
     * Application developers must not override any methods that are not mentioned in this documentation.
     * @namespace sap.ovp.app.TemplateBaseExtension
     * @protected
     */
    return ControllerExtension.extend("sap.ovp.app.TemplateBaseExtension", {
        metadata: {
            methods: {
                provideExtensionAppStateData: {
                    "public": true,
                    "final": false,
                    overrideExecution: OverrideExecution.After
                },
                restoreExtensionAppStateData: {
                    "public": true,
                    "final": false,
                    overrideExecution: OverrideExecution.After
                },
                addFilters: {
                    "public": true,
                    "final": false,
                    overrideExecution: OverrideExecution.After
                },
                provideStartupExtension: {
                    "public": true,
                    "final": false,
                    overrideExecution: OverrideExecution.After
                },
                provideExtensionNavigation: {
                    "public": true,
                    "final": false,
                    overrideExecution: OverrideExecution.After
                },
                provideCustomActionPress: {
                    "public": true,
                    "final": false,
                    overrideExecution: OverrideExecution.After
                },
                provideCustomParameter: {
                    "public": true,
                    "final": false,
                    overrideExecution: OverrideExecution.After
                }
            }
        },

        /**
         * @callback fnSetAppStateCallback
         * @param {sap.ui.core.mvc.ControllerExtension} oControllerExtension instance of the controller extension
         * @param {object} oAppState The content of the custom field to be stored
         */

        /**
         * Can be used to store specific state. Therefore, the implementing controller extension must call fnSetAppStateData(oControllerExtension, oAppState).
         * oControllerExtension must be the ControllerExtension instance for which the state should be stored. oAppState is the content of the custom field to be stored, 
         * so that it can be restored later. For example, after a back navigation.
         * The developer must ensure, that the content of the field is stored in the oAppState.
         * Note that the call is ignored if oAppState is faulty
         * @param {fnSetAppStateCallback} fnSetAppStateData This callback funtion must be called by the implementing controller
         * @protected
         */
        provideExtensionAppStateData: function (fnSetAppStateData) {
        },

        /**
         * @callback fnGetAppStateDataCallback
         * @param {sap.ui.core.mvc.ControllerExtension} oControllerExtension instance of controller extension
         * @returns {object} the state information which has been stored in the current state for the controller extension
         */

        /**
         * Allows extensions to restore their state according to a state which was previously stored.
         * Therefore, the implementing controller extension can call fnGetAppStateData(oControllerExtension) 
         * in order to retrieve the state information which has been stored in the current state for this controller extension.
         * undefined is returned by this function if no state or a faulty state is stored.
         * @param {fnGetAppStateDataCallback} fnGetAppStateData 
         * @protected
         */
        restoreExtensionAppStateData: function (fnGetAppStateData) {
        },
        
        /**
         * @callback fnAddFilterCallback
         * @param {sap.ui.core.mvc.ControllerExtension} oControllerExtension instance of controller extension
         * @param {sap.ui.model.Filter} oFilter 
         */

        /** 
         * Allows extension to add filters. They will be combined via AND with all other filters
         * For each filter the extension must call fnAddFilter(oControllerExtension, oFilter)
         * oControllerExtension must be the ControllerExtension instance which adds the filter
         * oFilter must be an instance of sap.ui.model.Filter
         * @protected
         * @param {fnAddFilterCallback} fnAddFilter
         */
        addFilters: function (fnAddFilter) {
        },

        /**
         * Modifies the selection variant to be set to the SFB
         * @param {sap.fe.navigation.SelectionVariant} oCustomSelectionVariant reference to the custom selection variant expected by OVP library
         * @protected
         */
        provideStartupExtension: function (oCustomSelectionVariant) {
        },

        /**
         * This function takes the standard navigation entry details (if present) for a particular card and context.
         * Returns a new/modified custom navigation entry to the core. The core will then uses the custom
         * navigation entry to perform navigation
         * @param {string} sCardId Card id as defined in manifest for a card
         * @param {sap.ui.model.Context} oContext Context of line item that is clicked (empty for header click)
         * @param {object} oNavigationEntry Custom navigation entry to be used for navigation
         * @returns {object} Properties are {type, semanticObject, action, url, label}
         * @protected
         */
        provideExtensionNavigation: function (sCardId, oContext, oNavigationEntry) {
        },

        /**
         * This function takes the press event text and returns the event corresponsing to it
         * The method you are defining should also be defined in the controller extension
         * @param {string} sCustomAction The press event name
         * @returns {function} Event Corresponding to the name passed
         * @protected
         */
        provideCustomActionPress: function (sCustomAction) {
        },

        /**
         * This function takes the name or key corresponding to a method that is then returned
         * The method that is returned will resolve to give the custom parameters
         * The method to be returned should also be defined in the extension controller
         * @param {string} sCustomParams Name or key corresponding to a method
         * @returns {object} Method that will resolve to give the Custom parameter required for navigation
         * @protected
         */
        provideCustomParameter: function (sCustomParams) {
        }
    });
});
