/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
    "sap/base/Log",
    "sap/ui/model/json/JSONModel",
    "sap/insights/CardsChannel",
    "./utils/BatchHelper",
    "./utils/AppConstants",
    "sap/ui/core/Lib"
], function (Log, JSONModel, CardsChannel, BatchHelper, AppConstants, CoreLib) {
    "use strict";

    var oLogger = Log.getLogger("sap.insights.CardHelper");
    var I18_BUNDLE = CoreLib.getResourceBundleFor("sap.insights");

    function _getCardEntityUrl(sCardId) {
        return AppConstants.REPO_BASE_URL + AppConstants.CARD_ENTITY_NAME + "('" + sCardId + "')";
    }

    function _fetchCSRFToken() {
        return fetch(AppConstants.REPO_BASE_URL, {
            method: "HEAD",
            headers: {
                "X-CSRF-Token": "Fetch"
            }
        }).then(function (resposne) {
            var token = resposne.headers.get("X-CSRF-Token");
            if (resposne.ok && token) {
                return token;
            }
            _logAndThrowException(I18_BUNDLE.getText('tokenFetchError'));
        });
    }

    function _merge(oPayload, sCSRFToken, sMethod) {
        if ([AppConstants.PUT, AppConstants.POST].indexOf(sMethod) === -1) {
            _logAndThrowException("Method not supported.");
        }

        var sCardId = oPayload["sap.app"].id;
        var sUrl = sMethod === AppConstants.PUT ? _getCardEntityUrl(sCardId) : AppConstants.REPO_BASE_URL + AppConstants.CARD_ENTITY_NAME;
        oPayload = {
            "descriptorContent": JSON.stringify(oPayload),
            "id": sCardId
        };

        var sPayload = JSON.stringify(oPayload);

        return fetch(sUrl, {
            method: sMethod,
            headers: {
                "X-CSRF-Token": sCSRFToken,
                "content-type": "application/json;odata.metadata=minimal;charset=utf-8"
            },
            body: sPayload
        }).then(function (response) {
            return response.json();
        }).then(function (oResponse) {
            if (oResponse.error && oResponse.error.code === "/UI2/INSIGHTS_MSG/007" ) {
                oLogger.error(oResponse.error.message);
                throw new Error(oResponse.error.code);
            } else if (oResponse.error) {
                _logAndThrowException(oResponse.error.message);
            }
            return JSON.parse(oResponse.descriptorContent);
        });
    }

    function _validateCardId(sCardId) {
        var aTempArray = sCardId.split(".");
        if (aTempArray[0] !== "user") {
            _logAndThrowException("sap.app.id value should start with user.<id>.");
        }
    }

    function _handleDeleteCard(sCardId, sCSRFToken) {
        return fetch(_getCardEntityUrl(sCardId), {
            method: "DELETE",
            headers: {
                "X-CSRF-Token": sCSRFToken
            }
        }).then(function (oResponse) {
            return oResponse.ok ? {} : oResponse.json();
        }).then(function (oResponse) {
            if (oResponse.error) {
                _logAndThrowException(oResponse.error.message);
            }
            return sCardId;
        });
    }

    function _isSupported() {
        var DISABLED_ERR_MSG = "sap.insights is not enabled for this system.";
        var CUSTOM_HOME_COMP_ID = "ux.eng.s4producthomes1";
        try {
            var uShellConfig = window["sap-ushell-config"];
            var bInsightsEnabled = uShellConfig.apps.insights.enabled;
            var sCustomHomeComponentId = uShellConfig.ushell.homeApp.component.name;
            var bComponentIdCorrect = sCustomHomeComponentId === CUSTOM_HOME_COMP_ID;
            var bSpacesSupported = uShellConfig.ushell.spaces.enabled;
            if (bInsightsEnabled && bComponentIdCorrect && bSpacesSupported) {
                return Promise.resolve(true);
            }
            return Promise.reject(new Error(DISABLED_ERR_MSG));
        } catch (oError) {
            return Promise.reject(new Error(DISABLED_ERR_MSG));
        }
    }

    function _logAndThrowException(sMsg) {
        oLogger.error(sMsg);
        throw new Error(sMsg);
    }

    function _checkIbnAction(oParameters) {
        var bActionExists = false;
        if (oParameters
            && oParameters.parameters
            && oParameters.parameters.ibnTarget
            && oParameters.parameters.ibnTarget.semanticObject
            && oParameters.parameters.ibnTarget.action
        ) {
            bActionExists = true;
        }
        if (oParameters
            && oParameters.ibnTarget
            && oParameters.ibnTarget.semanticObject
            && oParameters.ibnTarget.action
        ) {
            bActionExists = true;
        }
        return bActionExists;
    }

    function _validateCardManifest(oCardManifest) {
        var bInvalidManifest = false;

        if (!oCardManifest["sap.app"]) {
            oLogger.error("Invalid card manifest. sap.app namespace do not exists.");
            bInvalidManifest = true;
        }
        if (!bInvalidManifest && !oCardManifest["sap.app"].id) {
            oLogger.error("Invalid card manifest. sap.app.id do not exists.");
            bInvalidManifest = true;
        }
        if (!bInvalidManifest) {
            _validateCardId(oCardManifest["sap.app"].id, false);
        }
        if (!bInvalidManifest && !oCardManifest["sap.app"].type) {
            oLogger.error("Invalid card manifest. sap.app.type do not exists.");
            bInvalidManifest = true;
        }
        if (!bInvalidManifest && oCardManifest["sap.app"].type.toLowerCase() !== "card") {
            oLogger.error("Invalid card manifest. invalid value for sap.app.type, expected card.");
            bInvalidManifest = true;
        }
        if (!bInvalidManifest && !oCardManifest["sap.card"]) {
            oLogger.error("Invalid card manifest. sap.card namespace do not exists.");
            bInvalidManifest = true;
        }
        if (!bInvalidManifest && !oCardManifest["sap.card"].type) {
            oLogger.error("Invalid card manifest. sap.card.type do not exists.");
            bInvalidManifest = true;
        }
        var aValidCardType = [
            // "AdaptiveCard",
            "Analytical",
            // "AnalyticsCloud",
            // "Calendar",
            // "Component",
            "List",
            // "Object",
            // "Timeline",
            // "WebPage",
            "Table"
        ];
        if (!bInvalidManifest && aValidCardType.indexOf(oCardManifest["sap.card"].type) === -1) {
            oLogger.error("Invalid card manifest. Invalid value for sap.card.type. Supported types: " + aValidCardType);
            bInvalidManifest = true;
        }
        if (!bInvalidManifest && !oCardManifest["sap.insights"]) {
            oLogger.error("Invalid card manifest. sap.insights namespace do not exists.");
            bInvalidManifest = true;
        }
        if (!bInvalidManifest && !oCardManifest["sap.insights"].parentAppId) {
            oLogger.error("Invalid card manifest. sap.insights.parentAppId do not exists.");
            bInvalidManifest = true;
        }
        if (!bInvalidManifest && !oCardManifest["sap.insights"].cardType) {
            oLogger.error("Invalid card manifest. sap.insights.cardType do not exists.");
            bInvalidManifest = true;
        }
        if (!bInvalidManifest && oCardManifest["sap.insights"].cardType !== "RT") {
            oLogger.error("Invalid card manifest. Invalid value for sap.insights.cardType, supported value is RT");
            bInvalidManifest = true;
        }
        if (!bInvalidManifest && !oCardManifest["sap.insights"].versions || !oCardManifest["sap.insights"].versions.ui5) {
            oLogger.error("Invalid card manifest. Invalid value for sap.insights version");
            bInvalidManifest = true;
        }
        if (!bInvalidManifest && oCardManifest["sap.insights"].templateName === "OVP") {
            var aContentActions,
                aHeaderActions,
                oParameters,
                bActionExists = false,
                sCardType = oCardManifest["sap.card"].type;

            // Analytical Card
            if (sCardType === "Analytical") {
                // Backward Compatilbility (For 2202 manifests)
                aContentActions = oCardManifest["sap.card"].content.actions || [];
                aHeaderActions = oCardManifest["sap.card"].header.actions || [];
                aContentActions = aContentActions.filter(function(oAction){
                    return oAction.type === "Navigation" && oAction.parameters && oAction.parameters.ibnTarget && oAction.parameters.ibnTarget.semanticObject && oAction.parameters.ibnTarget.action;
                });
                aHeaderActions = aHeaderActions.filter(function(oAction){
                    return oAction.type === "Navigation" && oAction.parameters && oAction.parameters.ibnTarget && oAction.parameters.ibnTarget.semanticObject && oAction.parameters.ibnTarget.action;
                });
                if (aContentActions.length > 0 || aHeaderActions.length > 0) {
                    bActionExists = true;
                }

                // For 2302 manifests
                if (oCardManifest["sap.card"].configuration.parameters.state && oCardManifest["sap.card"].configuration.parameters.state.value) {
                    oParameters = JSON.parse(oCardManifest["sap.card"].configuration.parameters.state.value);
                    bActionExists = _checkIbnAction(oParameters);
                }
            }

            // List or Table Card
            if (sCardType === "List" || sCardType === "Table") {
                aContentActions = (sCardType === "List" ? oCardManifest["sap.card"].content.item.actions : oCardManifest["sap.card"].content.row.actions) || [];
                aHeaderActions = oCardManifest["sap.card"].header.actions || [];
                aContentActions = aContentActions.filter(function(oAction){
                    return oAction.type === "Navigation";
                });
                aHeaderActions = aHeaderActions.filter(function(oAction){
                    return oAction.type === "Navigation";
                });
                if (aContentActions.length > 0 || aHeaderActions.length > 0) {
                    var oHeaderStateParameters = {},
                        oContentStateParameters = {};
                    // Check for HeaderState and lineItemState
                    if (oCardManifest["sap.card"].configuration.parameters.headerState && oCardManifest["sap.card"].configuration.parameters.headerState.value) {
                        oHeaderStateParameters = JSON.parse(oCardManifest["sap.card"].configuration.parameters.headerState.value);
                    }
                    if (oCardManifest["sap.card"].configuration.parameters.lineItemState && oCardManifest["sap.card"].configuration.parameters.lineItemState.value) {
                        oContentStateParameters = JSON.parse(oCardManifest["sap.card"].configuration.parameters.lineItemState.value);
                    }
                    var bHeaderAction = _checkIbnAction(oHeaderStateParameters),
                        bContentAction = _checkIbnAction(oContentStateParameters);

                    bActionExists = bHeaderAction || bContentAction;
                }
            }

            if (!bActionExists) {
                oLogger.error("Invalid card manifest. Card should have navigation.");
                bInvalidManifest = true;
            }
        }

        if (bInvalidManifest) {
            throw new Error(I18_BUNDLE.getText('invalidManifest'));
        }
    }

    var cardsChannel;

    /**
	 * Public (experimental) interface of the sap.insights.CardHelperService
	 *
	 * @name sap.insights.CardHelperService
	 * @interface
     * @public
     * @experimental
	 */
    var CardHelperService = {
        localCardCache: {},
        userCardModel: new JSONModel().setDefaultBindingMode("OneWay"),
        userVisibleCardModel: new JSONModel().setDefaultBindingMode("OneWay"),
        parentAppDetailsCache: {},
        _oViewCache: {},

        _mergeCard: function (oCardManifest, sMethod, bSkipValidation) {
            try {
                if (!bSkipValidation) {
                    _validateCardManifest(oCardManifest);
                }
            } catch (oError) {
                return Promise.reject(oError);
            }
            this.userVisibleCardModel.setProperty("/isLoading", true);
            return _fetchCSRFToken().then(function (sCSRFToken) {
                return _merge(oCardManifest, sCSRFToken, sMethod);
            }).then(function (oResponse) {
                this.localCardCache = {};
                this.userVisibleCardModel.setProperty("/isLoading", false);
                return oResponse;
            }.bind(this)).catch(function (oError) {
                this.userVisibleCardModel.setProperty("/isLoading", false);
                return Promise.reject(oError);
            }.bind(this));
        },
        /**
         * Support creation of the insight card in SAP Insights service.
         * @param {object} oCardManifest Card manifest which needs to be stored in the repository
         * @param {boolean} bSkipValidation boolean to decide whether validation should be skipped
         * @returns {Promise} Returns promise which is resolved to created card manifest
         * @private
         * @experimental Since 1.102
         * @static
         */
        _createCard: function (oCardManifest, bSkipValidation) {
            return this._mergeCard(oCardManifest, AppConstants.POST, bSkipValidation);
        },

        /**
         * Support creation of the insight cards in SAP Insights service.
         * @param {object[]} aCardManifest Card manifests which needs to be stored in the repository
         * @returns {Promise} Returns promise which is resolved to created card manifest
         * @private
         * @experimental Since 1.102
         * @static
         */
        _createCards: function (aCardManifest) {
            var _getValidCardManifests = function(aCardManifest){
                return aCardManifest.filter(function (oCardManifest) {
                    try {
                        _validateCardManifest(oCardManifest);
                        return true;
                    } catch (oError){
                        return false;
                    }
                });
            };

            var _getCards = function(aCardManifest){
                return aCardManifest.map(function(oCardManifest){
                    var oCard = JSON.parse(JSON.stringify(oCardManifest));
                    return {
                        id: oCard["sap.app"].id,
                        descriptorContent: JSON.stringify(oCard)
                    };
                });
            };

            var aValidCardManifest = _getValidCardManifests(aCardManifest);
            if (aValidCardManifest.length > 0){
                return this._updateMultipleCards(_getCards(aValidCardManifest), AppConstants.POST);
            }
            return Promise.resolve();
        },

        /**
         * Support updation of  insight card in SAP Insights service.
         * @param {object} oCardManifest Card manifest which needs to be stored in the repository
         * @param {boolean} bSkipValidation boolean to decide whether validation should be skipped
         * @returns {Promise} Returns promise which is resolved to created card manifest
         * @private
         * @experimental Since 1.102
         * @static
         */
        _updateCard: function (oCardManifest, bSkipValidation) {
            return this._mergeCard(oCardManifest, AppConstants.PUT, bSkipValidation);
        },

        /**
         * Support deletion the insight card from SAP Insights service.
         * @param {string} sCardId ID of the card manifest
         * @returns {Promise} Returns promise which is resolved card ID of the deleted card
         * @private
         * @experimental Since 1.102
         * @static
         */
        _deleteCard: function (sCardId) {
            try {
                _validateCardId(sCardId);
            } catch (oError) {
                return Promise.reject(oError);
            }
            this.userVisibleCardModel.setProperty("/isLoading", true);
            return _fetchCSRFToken().then(function (sCSRFToken) {
                return _handleDeleteCard(sCardId, sCSRFToken);
            }).then(function (sCardId) {
                this.localCardCache = {};
                this.userVisibleCardModel.setProperty("/isLoading", false);
                var aCards = this.userCardModel.getProperty("/cards");
                var iCardIndex = aCards.findIndex(function(oCard){
                    return oCard.id === sCardId;
                });
                if (iCardIndex > -1) {
                    aCards.splice(iCardIndex, 1);
                }
                this.userCardModel.setProperty("/cards", aCards);
                return sCardId;
            }.bind(this));
        },

        /**
         * Retrieve the insight cards from SAP Insights service for the current user.
         *
         * @returns {array} Returns array of user cards
         * @private
         * @experimental Since 1.102
         * @static
         */
        _getUserAllCards: function () {
            if (this.localCardCache && this.localCardCache.userCards) {
                return Promise.resolve(this.localCardCache.userCards);
            }
            var url = AppConstants.CARD_READ_URL + "?$orderby=rank";
            return this._readCard(url).then(function (aCards) {
                this.localCardCache.userCards = aCards;
                return aCards;
            }.bind(this));
        },

        /**
         * Retrieve the insight cards from SAP Insights service for the current user.
         *
         * @returns {JSONModel} Returns array of user cards
         * @private
         * @experimental Since 1.102
         * @static
         */
        _getUserAllCardModel: function () {
            return this._getUserAllCards().then(function (aCards) {
                var aVisibleCards = aCards.filter(function (oCard) {
                    return oCard.visibility;
                });
                this.userCardModel.setProperty("/cards", aCards);
                this.userCardModel.setProperty("/cardCount", aCards.length);
                this.userCardModel.setProperty("/visibleCardCount", aVisibleCards.length);
                return this.userCardModel;
            }.bind(this));
        },

        /**
         * Retrieve the insight cards from SAP Insights service for the current user.
         *
         * @returns {Promise} Returns a promise which resolves to an array of suggested cards.
         * @private
         * @experimental Since 1.102
         * @static
         */
        _getUserVisibleCards: function () {
            if (this.localCardCache.userVisibleCards) {
                return Promise.resolve(this.localCardCache.userVisibleCards);
            }
            var url = AppConstants.CARD_READ_URL + "?$filter=visibility eq true&$select=descriptorContent,visibility,rank&$orderby=rank&$skip=0&$top=10";
            return this._readCard(url).then(function (aCards) {
                this.localCardCache.userVisibleCards = aCards;
                return aCards;
            }.bind(this));
        },

        /**
         * Retrieve the insight cards from SAP Insights service for the current user.
         *
         * @returns {Promise} Returns a promise which resolves to an array of suggested cards.
         * @private
         * @experimental Since 1.102
         * @static
         */
        _getUserVisibleCardModel: function () {
            return this._getUserVisibleCards().then(function (aCards) {
                this.userVisibleCardModel.setProperty("/cards", aCards);
                this.userVisibleCardModel.setProperty("/cardCount", aCards.length);
                this.userVisibleCardModel.setProperty("/isLoading", false);
                return this.userVisibleCardModel;
            }.bind(this));
        },

        _readCard: function (url) {
            return fetch(url).then(function (response) {
                if (response.ok) {
                    return response.json();
                }
                _logAndThrowException("Cannot read user's suggested cards.");
            }).then(function (oData) {
                oData.value.forEach(function (oCard) {
                    if (oCard.descriptorContent) {
                        oCard.descriptorContent = JSON.parse(oCard.descriptorContent);
                    }
                });
                return oData.value;
            });
        },

        /**
         * Refresh User Cards.
         *
         * @param {boolean} oFlag .
         * @returns {Promise} Returns a promise.
         * @private
         * @experimental Since 1.102
         * @static
         */
        _refreshUserCards: function (oFlag) {
            this.userVisibleCardModel.setProperty("/isLoading", true);
            this.userCardModel.setProperty("/isLoading", true);
            var oBody = oFlag ? {"deleteAllCards": "X"} : {};
            return new Promise(function (resolve) {
                fetch(AppConstants.REPO_BASE_URL, {
                    method: "HEAD",
                    headers: {
                        "X-CSRF-Token": "Fetch"
                    }
                }).then(function (resposne) {
                    var token = resposne.headers.get("X-CSRF-Token");
                    fetch(AppConstants.REPO_BASE_URL + AppConstants.CARD_ENTITY_NAME + "/com.sap.gateway.srvd.ui2.insights_cards_repo_srv.v0001.deleteCards?", {
                        method: AppConstants.POST,
                        headers: {
                            "X-CSRF-Token": token,
                            "content-type": "application/json;odata.metadata=minimal;charset=utf-8"
                        },
                        body: JSON.stringify(oBody)
                    }).then(function(response){
                        return response.json();
                    }).then(function(oData){
                        var aCards = oData.value || [];
                        this.iVisCardCount = 0;
                        aCards.forEach(function (oCard) {
                            if (oCard.descriptorContent) {
                                oCard.descriptorContent = JSON.parse(oCard.descriptorContent);
                            }
                            //count the no. of visible cards
                            if (oCard.visibility) {
                                this.iVisCardCount++;
                            }
                        }.bind(this));
                        this.localCardCache = {};
                        this.localCardCache.userCards = aCards;
                        this.userVisibleCardModel.setProperty("/isLoading", false);
                        return this._getUserAllCardModel().then(function(){
                            this.userCardModel.setProperty("/isLoading", false);
                            resolve();
                        }.bind(this));
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        },

        /**
         * Get Cards parent app details.
         *
         * @param {Object} oCard .
         * @returns {Object} Returns a object with scemanticObject and title.
         * @public
         * @experimental Since 1.102
         * @static
         */
        getParentAppDetails: function (oCard) {
            if (this.parentAppDetailsCache[oCard.descriptorContent["sap.app"].id]) {
                return Promise.resolve(this.parentAppDetailsCache[oCard.descriptorContent["sap.app"].id]);
            }
            var oParentApp = {};
            var sParentAppUrl = oCard.descriptorContent["sap.insights"].parentAppUrl;

            // if parent app url is present
            if (sParentAppUrl) {
                return sap.ushell.Container.getServiceAsync("URLParsing").then(function (URLParsingService) {
                    var oShellHash = URLParsingService.parseShellHash(sParentAppUrl);

                    return sap.ushell.Container.getServiceAsync("CrossApplicationNavigation")
                        .then(function (crossApplicationNavigationService) {
                            return crossApplicationNavigationService.isNavigationSupported([{
                                target: {
                                    semanticObject: oShellHash.semanticObject,
                                    action: oShellHash.action
                                },
                                params: oShellHash.params
                            }]);
                        })
                        .then(function (aResponses) {
                            if (aResponses[0].supported) {
                                oParentApp.semanticObject = oShellHash.semanticObject;
                                oParentApp.action = oShellHash.action;
                                oParentApp.semanticURL = sParentAppUrl;
                                oParentApp.title = oCard.descriptorContent["sap.app"].title;
                                this.parentAppDetailsCache[oCard.descriptorContent["sap.app"].id] = oParentApp;

                                return Promise.resolve(oParentApp);
                            } else {
                                return this._getParentApp(oCard);
                            }
                        }.bind(this));
                }.bind(this));
            } else {
                // follow the existing approach
                return this._getParentApp(oCard);
            }

        },

        /**
         * Get Cards parent app details for cards when no parent app url is present.
         *
         * @param {Object} oCard .
         * @returns {Object} Returns a object with scemanticObject and title.
         * @public
         * @experimental Since 1.102
         * @static
         */
        _getParentApp: function (oCard) {
            var oParentApp = {};
            return sap.ushell.Container.getServiceAsync("ClientSideTargetResolution").then(function(ClientSideTargetResolution) {
                var aAvailableApps = ClientSideTargetResolution._oAdapter._aInbounds || [];
                var oApp = aAvailableApps.find(function(oApp) {
                    return oApp.resolutionResult && oApp.resolutionResult.applicationDependencies && oApp.resolutionResult.applicationDependencies.name === oCard.descriptorContent["sap.insights"].parentAppId;
                });
                if (oApp){
                    oParentApp.semanticObject = oApp.semanticObject;
                    oParentApp.action = oApp.action;
                    oParentApp.semanticURL = "#" + oApp.semanticObject + "-" + oApp.action;
                    oParentApp.title = oCard.descriptorContent["sap.app"].title;

                    this.parentAppDetailsCache[oCard.descriptorContent["sap.app"].id] = oParentApp;
                }
                return oParentApp;
            }.bind(this));
        },

        /**
         * Update Multiple cards in Batch Call
         *
         * @param {Array} aUpdatedCards Array of cards needs to be updated.
         * @param {string} sRequestMethod HTTP method type
         * @returns {Object} Returns a object with scemanticObject and title.
         * @private
         * @experimental Since 1.102
         * @static
         */
        _updateMultipleCards: function (aUpdatedCards, sRequestMethod) {
            try {
                return BatchHelper.createMultipartRequest(aUpdatedCards, sRequestMethod)
                    .then(function () {
                        this.localCardCache = {};
                        return Promise.resolve();
                    }.bind(this))
                    .catch(function(oError) {
                        return Promise.reject(oError);
                    });
            } catch (oError) {
                return Promise.reject(oError);
            }
        },

        /**
         * Show preview for a given card
         *
         * @param {object} oCard card manifest for which preview will be generated
         * @param {boolean} bTransform boolean to determine whether card can be transfrormed
         * @param {object} oCardMessageInfo object which includes type and message text related to Message
         * @param {string} sConfirmButtonText text for confirm button on the dialog
         * @param {function} onConfirm callback event to be called when confirm button is pressed
         * @returns {Promise<void>} Returns promise, which generates preview for the passed card manifest
         * @public
         * @experimental
         * @function
         * @name sap.insights.CardHelperService.showCardPreview
         */
        showCardPreview: function (oCard, bTransform, oCardMessageInfo, sConfirmButtonText, onConfirm) {
            return new Promise(function (resolve, reject) {
                try {
                    // sap.ui.require will load the module only once.
                    sap.ui.require(["sap/insights/ManagePreview"], function (ManagePreview) {
                        if (!this._oManagePreviewDialog) {
                            this._oManagePreviewDialog = new ManagePreview({
                                transformation: bTransform,
                                cardMessageInfo: oCardMessageInfo,
                                confirmButtonText: sConfirmButtonText,
                                manifest: oCard
                            });
                        } else {
                            this._oManagePreviewDialog.setTransformation(bTransform);
                            this._oManagePreviewDialog.setCardMessageInfo(oCardMessageInfo);
                            this._oManagePreviewDialog.setConfirmButtonText(sConfirmButtonText);
                            this._oManagePreviewDialog.setManifest(oCard);
                            this._removeAllEventListeners(this._oManagePreviewDialog, "onConfirmButtonPress");
                        }
                        if (onConfirm){
                            this._oManagePreviewDialog.attachOnConfirmButtonPress(onConfirm);
                        }
                        this._oManagePreviewDialog.openPreviewDialog();
                        resolve(this._oManagePreviewDialog);
                    }.bind(this));
                } catch (error) {
                    oLogger.error(error.message);
                    reject(error.message);
                }
            }.bind(this));
        },

        /**
         * Removes all the event listeners from event registry for give control and eventId
         *
         * @param {Object} oManageControl Control form which all the listeners to be removed
         * @param {string} sEventId event id of the event for which all the listeners to be removed
         * @private
         * @experimental Since 1.120
         * @static
         */
        _removeAllEventListeners: function (oManageControl, sEventId) {
            if (oManageControl.hasListeners(sEventId)) {
                oManageControl.mEventRegistry[sEventId].forEach(function (oEvent) {
                    oManageControl.detachEvent(sEventId, oEvent.fFunction, oEvent.oListener);
                });
            }
        },

        /**
         * Get a promise for the singleton instance of the cards channel.
         *
         * @returns {Promise<sap.insights.CardsChannel>} .
         * @public
         * @experimental
         * @function
         */
        getCardsChannel: function() {
            if (cardsChannel) {
                return Promise.resolve(cardsChannel);
            } else {
                return new Promise(function(resolve) {
                    cardsChannel = new CardsChannel();
                    cardsChannel.init().then( function() { resolve(cardsChannel); });
                });
            }
        }
    };

    /**
     * Provides functionality for Insight cards CRUD operations.
     *
     * @namespace sap.insights.CardHelper
     * @since 1.102
     * @public
     * @experimental Since 1.102
     */
    return /** @lends sap.insights.CardHelper */ {
        /**
         * Function to get an instance of the CardHelper service.
         *
         * @returns {Promise<sap.insights.CardHelperService>} Returns promise which is resolved to instance of CardHelper service.
         * @internal
         */
        getServiceAsync: function () {
            return _isSupported().then(function () {
                return CardHelperService;
            }).catch(function (oError) {
                return Promise.reject(oError);
            });
        }
    };
});