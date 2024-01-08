// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ushell/services/PersonalizationV2/constants",
    "sap/ushell/services/PersonalizationV2/constants.private",
    "sap/ushell/utils",
    "sap/ui/thirdparty/jquery",
    "sap/base/Log"
], function (oConstants, oPrivateConstants, ushellUtils, jQuery, Log) {
    "use strict";

    /**
     * Checks if given value is part of enum
     * @param {string} entry The entry to check
     * @param {object} passedEnum The enum to check
     * @returns {boolean} Whether the entry exists in the enum
     *
     * @since 1.120.0
     * @private
     */
    function checkIfEntryExistsInEnum (entry, passedEnum) {
        let enumElement;
        for (enumElement in passedEnum) {
            if (typeof passedEnum[enumElement] !== "function") {
                if (passedEnum.hasOwnProperty(enumElement)) {
                    if (enumElement === entry) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Adds a prefix to the container key
     * @param {string} sContainerKey The container key
     * @returns {string} The prefixed container key
     *
     * @since 1.120.0
     * @private
     */
    function addContainerPrefix (sContainerKey) {
        if (sContainerKey.length > 40) {
            Log.error("Personalization Service container key (\"" + sContainerKey + "\") should be less than 40 characters [current :" + sContainerKey.length + "]");
        }

        return oPrivateConstants.S_CONTAINER_PREFIX + sContainerKey;
    }

    /**
     * Chooses one adapter based on the given scope.
     *
     * @param {object} oOriginalScope
     *   The original, unadjusted scope.
     * @param {object} oTransientAdapter
     *   An adapter that stores transient data.
     * @param {object} oPersistentAdapter
     *   An adapter that persists data.
     *
     * @returns {variant}
     *   A loaded or not-yet-loaded adapter. If the adapter is not loaded, the
     *   return value is a function that when called returns a promise - that
     *   resolves to the adapter.
     *
     * @see #loadAdapter
     *
     * @since 1.120.0
     * @private
     */
    function pickAdapter (oOriginalScope, oTransientAdapter, oPersistentAdapter) {
        if (oOriginalScope && oOriginalScope.validity === 0) {
            return oTransientAdapter;
        }

        return oPersistentAdapter;
    }

    /**
     * Construct a cleansed scope object, returning only valid recognized parameters
     * This functionality is used to cleanse user input
     *
     * @param {object} oScope The original scope
     *
     * @returns {object} The adjusted scope
     *
     * @since 1.120.0
     * @private
     */
    function adjustScope (oScope) {
        const oAdjustedScope = {
            validity: Infinity,
            keyCategory: oConstants.keyCategory.GENERATED_KEY,
            writeFrequency: oConstants.writeFrequency.HIGH,
            clientStorageAllowed: false
        };

        if (oScope) {
            oAdjustedScope.validity = oScope.validity;
            if (oAdjustedScope.validity === null || oAdjustedScope.validity === undefined || typeof oAdjustedScope.validity !== "number") {
                oAdjustedScope.validity = Infinity;
            }
            if (!(typeof oAdjustedScope.validity === "number" && ((oAdjustedScope.validity >= 0 && oAdjustedScope.validity < 1000) || oAdjustedScope.validity === Infinity))) {
                oAdjustedScope.liftime = Infinity;
            }

            oAdjustedScope.keyCategory = checkIfEntryExistsInEnum(oScope.keyCategory, oConstants.keyCategory) ? oScope.keyCategory : oAdjustedScope.keyCategory;
            oAdjustedScope.writeFrequency = checkIfEntryExistsInEnum(oScope.writeFrequency, oConstants.writeFrequency) ? oScope.writeFrequency : oAdjustedScope.writeFrequency;
            if (typeof oScope.clientStorageAllowed === "boolean" && (oScope.clientStorageAllowed === true || oScope.clientStorageAllowed === false)) {
                oAdjustedScope.clientStorageAllowed = oScope.clientStorageAllowed;
            }

            // todo: check comment below
            //Combination of FixKey & CrossUserRead is an illegal combination because the user who was creating the container is no longer available
            //The other users have no chance to write on that container
            //if (oAdjustedScope.keyCategory === oConstants.keyCategory.FIXED_KEY && oAdjustedScope.access === oConstants.access.CROSS_USER_READ) {
            //    throw new utils.Error("Wrong defined scope. FixKey and CrossUserRead is an illegal combination: sap.ushell.services.Personalization", " ");
            // }
        }

        return oAdjustedScope;
    }

    /**
     * Loads the chosen adapter.
     *
     * @param {variant} oAdapter
     *   An object like: <pre>{
     *      lazy: <boolean>,
     *      instance: <function> or <object>
     *   }</pre>
     *
     * @returns {Promise<object>}
     *   A promise that resolves with a loaded adapter or rejects with an error
     *   message in case something went wrong while the adapter was being
     *   loaded.
     *
     * @since 1.120.0
     * @private
     */
    function loadAdapter (oAdapter) {
        if (!oAdapter.lazy) {
            return ushellUtils.promisify(jQuery.when(oAdapter.instance));
        }

        try {
            return ushellUtils.promisify(oAdapter.create.call(null));
        } catch (oError) {
            return Promise.reject(oError);
        }
    }

    /**
     * Detects whether a given app component is an app variant based on the
     * component manifest.
     *
     * @param {sap.ui.core.Component} [oComponent] The application component.
     *
     * @returns {boolean} Whether this application is an AppVariant
     *
     * @since 1.120.0
     * @private
     */
    function isAppVariant (oComponent) {
        if (!oComponent) {
            return false;
        }

        const oAppManifest = oComponent.getManifestObject();
        if (!oAppManifest) {
            return false;
        }

        const sAppVarId = oAppManifest.getEntry("/sap.ui5/appVariantId");
        if (!sAppVarId) {
            return false;
        }

        const sComponentName = oAppManifest.getComponentName();
        if (sAppVarId === sComponentName) {
            return false;
        }

        return true;
    }

    /**
     * Tries to parse json string
     * @param {string} sJson A stringified JSON object
     * @returns {object} the parsed object or undefined
     *
     * @since 1.120.0
     * @private
     */
    function cloneToObject (sJson) {
        if (sJson === undefined) {
            return undefined;
        }
        try {
            return JSON.parse(sJson);
        } catch (e) {
            return undefined;
        }
    }

    /**
     * Basic clone
     * @param {object} oObject the object to clone
     * @returns {object} the cloned object or undefined
     *
     * @since 1.120.0
     * @private
     */
    function clone (oObject) {
        if (oObject === undefined) {
            return undefined;
        }
        try {
            return JSON.parse(JSON.stringify(oObject));
        } catch (e) {
            return undefined;
        }
    }

    return {
        adjustScope: adjustScope,
        cloneToObject: cloneToObject,
        clone: clone,
        addContainerPrefix: addContainerPrefix,
        pickAdapter: pickAdapter,
        isAppVariant: isAppVariant,
        loadAdapter: loadAdapter
    };
});
