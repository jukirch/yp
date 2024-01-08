/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
    "sap/base/Log",
    "sap/ui/core/Core",
    "sap/base/security/URLListValidator",
    "./CollaborationHelper",
    "./BaseHelperService",
    "sap/ui/core/Element",
    "./ContactHelper",
    "sap/ui/Device",
    "./CollaborationCardHelper",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/ui/core/Lib"
], function (Log, Core, URLListValidator, CollaborationHelper, BaseHelperService, Element, ContactHelper, Device, CollaborationCardHelper, Fragment, MessageBox, Library) {
    "use strict";

    /**
     * Provides the Share options
     * @namespace
     * @since 1.104
     * @alias module:sap/suite/ui/commons/collaboration/TeamsHelperService
     * @private
     * @ui5-restricted
     * @experimental Since 1.108
     */
    var TeamsHelperService = BaseHelperService.extend("sap.suite.ui.commons.collaboration.TeamsHelperService", {
        constructor: function (oProviderConfig) {
            this._providerConfig = oProviderConfig;
            this._providerConfig.shareAsLinkUrl = "https://teams.microsoft.com/share";
            this._getShareAsTabUrl().then(function(sShareAsTabUrl) {
                this._providerConfig.shareAsTabUrl = sShareAsTabUrl;
            }.bind(this));
        }
    });

    /**
     * sTeamsAppID is hardcoded as of now, will be changed when app is published at org level.
     */
    var COLLABORATION_MSTEAMS_APPID = 'db5b69c6-0430-4ae1-8d6e-a65c2220b50c';
    var oLogger = Log.getLogger("sap.suite.ui.commons.collaboration.TeamsHelperService");

    var oResourceBundle = Core.getLibraryResourceBundle("sap.suite.ui.commons");
    var PARAM_SAP_CARD_TITLE = "sap-ui-cardTitle";
    var PARAM_SAP_CARD_ID = "sap-ui-xx-cardId";
    var PARAM_SAP_CARD_VERSION = "sap-ui-xx-cardVersion";

    var oBusyDailog;
    let iTimeoutId;
    const AUTO_CLOSE_BUSY_DIALOG_TIME = 60 * 1000; // 1 sec = 1000, here 60 sec
    var PARAM_SAP_STAGEVIEW_HASH = "sap-stageview-hash";
    var oTeamsParams = {};
    var windowWidthAndHeight = "width=720,height=720";

    /**
     * Gives list of all Collaboration Options
     * @param {object} oParams Optional argument in case consumer wants to influence the options, otherwise pass as undefined
     * @param {boolean} oParams.isShareAsLinkEnabled Allow Share as Chat option
     * @param {boolean} oParams.isShareAsTabEnabled Allow Share as Tab option
     * @param {boolean} oParams.isShareAsCardEnabled Allow Share as Card option
     * @returns {array} Array of available options
     * @private
     * @ui5-restricted
     * @experimental Since 1.108
     */
    TeamsHelperService.prototype.getOptions = function (oParams) {
        oTeamsParams = {
            isShareAsLinkEnabled: (oParams && typeof oParams.isShareAsLinkEnabled !== 'undefined') ? oParams.isShareAsLinkEnabled : true,
            isShareAsTabEnabled: (oParams && typeof oParams.isShareAsTabEnabled !== 'undefined') ? oParams.isShareAsTabEnabled : true,
            isShareAsCardEnabled: (oParams && typeof oParams.isShareAsCardEnabled !== 'undefined') ? oParams.isShareAsCardEnabled : false
        };

        var aOptions = [];
        var aFinalOptions = [];

        if (Device.system.desktop) {
            if (oTeamsParams.isShareAsLinkEnabled) {
                if (this._providerConfig.isShareAsLinkEnabled) {
                    aOptions.push({
                        "text": oResourceBundle.getText("COLLABORATION_MSTEAMS_CHAT"),
                        "key": "COLLABORATION_MSTEAMS_CHAT",
                        "icon": "sap-icon://post",
                        "fesrStepName": "MST:ShareAsLink"
                    });
                } else {
                    oLogger.info("Share as Chat option is not enabled in the tenant");
                }
            } else {
                oLogger.info("Consumer disable Share as Chat option");
            }
        } else {
            oLogger.info("Share as Chat option is not supported in Phone and Tablet");
        }

        if (Device.system.desktop) {
            if (oTeamsParams.isShareAsTabEnabled) {
                if (this._providerConfig.isShareAsTabEnabled) {
                    aOptions.push({
                        "text": oResourceBundle.getText("COLLABORATION_MSTEAMS_TAB"),
                        "key": "COLLABORATION_MSTEAMS_TAB",
                        "icon": "sap-icon://image-viewer",
                        "fesrStepName": "MST:ShareAsTab"
                    });
                } else {
                    oLogger.info("Share as Tab option is not enabled in the tenant");
                }
            } else {
                oLogger.info("Consumer disable Share as Tab option");
            }
        } else {
            oLogger.info("Share as Tab option is not supported in Phone and Tablet");
        }

        if (Device.system.desktop) {
            if (oTeamsParams.isShareAsCardEnabled) {
                if (this._providerConfig.isShareAsCardEnabled === "ENABLED") {
                    aOptions.push({
                        "text": oResourceBundle.getText("COLLABORATION_MSTEAMS_CARD"),
                        "key": "COLLABORATION_MSTEAMS_CARD",
                        "icon": "sap-icon://ui-notifications",
                        "fesrStepName": "MST:ShareAsCard"
                    });
                } else {
                    oLogger.info("Share as Card option is not enabled in the tenant");
                }
            } else {
                oLogger.info("Consumer disable Share as Card option");
            }
        } else {
            oLogger.info("Share as Card option is not supported in Phone and Tablet");
        }

        if (aOptions.length === 1) {
            aFinalOptions = aOptions;
            if (aFinalOptions[0].key === "COLLABORATION_MSTEAMS_CHAT") {
                aFinalOptions[0].text = oResourceBundle.getText("COLLABORATION_MSTEAMS_CHAT_SINGLE");
            } else if (aFinalOptions[0].key === "COLLABORATION_MSTEAMS_TAB") {
                aFinalOptions[0].text = oResourceBundle.getText("COLLABORATION_MSTEAMS_TAB_SINGLE");
            } else if (aFinalOptions[0].key === "COLLABORATION_MSTEAMS_CARD") {
                aFinalOptions[0].text = oResourceBundle.getText("COLLABORATION_MSTEAMS_CARD_SINGLE");
            }
            return aFinalOptions;
        }

        if (aOptions.length > 1) {
            aFinalOptions.push({
                "type": "microsoft",
                "text": oResourceBundle.getText("COLLABORATION_MSTEAMS_SHARE"),
                "icon": "sap-icon://collaborate",
                "subOptions": aOptions
            });
        }

        return aFinalOptions;
    };

    /**
     * Method to be called to trigger the share operation
     *
     * @param {Object} oOption Option Object/SubObject which is clicked
     * @param {Object} oParams Parameter object which contain the information to share
     * @param {string} oParams.url Url of the application which needs to be shared
     * @param {string} oParams.appTitle Title of the application which needs to be used while integration
     * @param {string} oParams.subTitle Title of the object page which needs to be used while integration
     * @param {boolean} oParams.minifyUrlForChat Set the flag to 'true' to minimize the URL
     * @param {Object} oParams.cardManifest Card to be shared for 'Share as Card' option
     * @param {string} oParams.cardId ID of the Card to be stored. This need to constuct from SemanticObject_Action
     * @returns {void}
     * @private
     * @ui5-restricted
     * @experimental Since 1.108
     */
    TeamsHelperService.prototype.share = function (oOption, oParams) {

        if (!oParams.url) {
            oLogger.error("url is not supplied in object so terminating Click");
            return;
        }

        if (!URLListValidator.validate(oParams.url)) {
            oLogger.error("Invalid URL supplied");
            return;
        }

        if (oOption.key === "COLLABORATION_MSTEAMS_CHAT") {
            this._shareAsChat(oParams);
            return;
        }

        if (oOption.key === "COLLABORATION_MSTEAMS_TAB") {
            this._shareAsTab(oParams);
            return;
        }

        if (oOption.key === "COLLABORATION_MSTEAMS_CARD") {
            this._shareAsCard(oParams);
            return;
        }
    };

    /**
     * Helper method which shares the URL as Link
     *
     * @param {Object} oParams Parameter object which contain the information to share
     * @param {string} oParams.url Url of the application which needs to be shared
     * @param {string} oParams.appTitle Title of the application which needs to be used in the chat message
     * @param {string} oParams.subTitle Title of the object page which needs to be used in the chat message
     * @param {boolean} oParams.minifyUrlForChat Experimental flag. Set to true to minify the Url.
     * @returns {void}
     * @private
     * @ui5-restricted
     * @experimental Since 1.108
     */
    TeamsHelperService.prototype._shareAsChat = function (oParams) {
        var newWindow = window.open(
            "",
            "_blank",
            windowWidthAndHeight
        );
        var sMessage = oParams.appTitle;
        if (oParams.subTitle.length > 0) {
            sMessage += ": " + oParams.subTitle;
        }

        newWindow.opener = null;
        if (oParams.minifyUrlForChat) {
			CollaborationHelper.compactHash(oParams.url, []).then(async function (sShortURL) {
                var sModifiedUrl = await this._modifyUrlForNavigationContext(oParams, sShortURL.url);
				newWindow.location = this._providerConfig.shareAsLinkUrl + "?msgText=" + encodeURIComponent(sMessage) + "&href=" + encodeURIComponent(sModifiedUrl);
			}.bind(this));
		} else {
			newWindow.location = this._providerConfig.shareAsLinkUrl + "?msgText=" + encodeURIComponent(sMessage) + "&href=" + encodeURIComponent(oParams.url);
		}
    };

    TeamsHelperService.prototype._modifyUrlForShareAsTab = async function(sUrl) {
        var sAppUri = sUrl;
        var iIndexOfHash = sAppUri.indexOf('#');
        if (iIndexOfHash !== -1) {
            var sUriForHeaderLess = sAppUri.substring(0, iIndexOfHash);
            var iIndexOfQuestionMark = sUriForHeaderLess.indexOf('?', 0);
            var sParam = 'appState=lean&sap-collaboration-teams=true';
            if (iIndexOfQuestionMark !== -1) {
                sUriForHeaderLess = sUriForHeaderLess.substring(0, iIndexOfQuestionMark + 1) + sParam + '&' + sUriForHeaderLess.substring(iIndexOfQuestionMark + 1);
            } else {
                sUriForHeaderLess += ("?" + sParam);
            }
            sAppUri = sUriForHeaderLess + sAppUri.substring(iIndexOfHash);
            sAppUri = await this._addNavmodeInUrl(sAppUri, 'explace');
        }
        return sAppUri;
    };

    /**
     * Helper method which shares the application as a Tab in MS Teams
     *
     * @param {Object} oParams Parameter object which contain the information to share
     * @param {string} oParams.url Url of the application which needs to be shared
     * @param {string} oParams.appTitle Title of the application which needs to be used in the Tab title
     * @param {string} oParams.subTitle Title of the object page which needs to be used in the Tab title
     * @returns {void}
     * @private
     * @ui5-restricted
     * @experimental Since 1.108
     */
    TeamsHelperService.prototype._shareAsTab = async function (oParams) {
        var sAppUri = await this._modifyUrlForShareAsTab(oParams.url);

        var oData = {
            "subEntityId": {
                "url": sAppUri,
                "appTitle": oParams.appTitle,
                "subTitle": oParams.subTitle,
                "mode": "tab"
            }
        };
        if (oParams.minifyUrlForChat) {
			CollaborationHelper.compactHash(sAppUri, []).then(async function (sShortURL) {
                var sModifiedUrl = await this._modifyUrlForNavigationContext(oParams, sShortURL.url);
				oData.subEntityId.url = await this._addNavmodeInUrl(sModifiedUrl, 'explace');
				var sURL = this._providerConfig.shareAsTabUrl + "?&context=" + encodeURIComponent(JSON.stringify(oData));
		        sap.m.URLHelper.redirect(sURL, true);
			}.bind(this));
		} else {
			var sURL = this._providerConfig.shareAsTabUrl + "?&context=" + encodeURIComponent(JSON.stringify(oData));
			sap.m.URLHelper.redirect(sURL, true);
		}
    };

    TeamsHelperService.prototype._addNavmodeInUrl = function (sURL, sNavMode) {
        const UshellContainer = sap.ui.require("sap/ushell/Container");
        return UshellContainer && UshellContainer.getServiceAsync("URLParsing").then(function(oURLParsing) {
            var sAppUri = sURL;
            var iIndexOfHash = sAppUri.indexOf('#');
            var oHashPartOfUri = oURLParsing.parseShellHash(sAppUri.substring(iIndexOfHash));
            oHashPartOfUri.params['sap-ushell-navmode'] = sNavMode;
            oHashPartOfUri.params['sap-ushell-next-navmode'] = sNavMode;
            var sHashOfUri = oURLParsing.constructShellHash(oHashPartOfUri);
            sAppUri = sAppUri.substring(0, iIndexOfHash) + '#' + sHashOfUri;
            return Promise.resolve(sAppUri);
        });
    };

    TeamsHelperService.prototype._modifyUrlForNavigationContext = function(oParams, sURL) {
        // The following condition applies when URL shortening hasn't been performed.
        // In this case, there's no requirement to make any changes to navigation context.
        if (oParams.url === sURL) {
            return Promise.resolve(sURL);
        }
        const UshellContainer = sap.ui.require("sap/ushell/Container");
        return UshellContainer && UshellContainer.getServiceAsync("URLParsing").then(function(oURLParsing) {
            var sAppUri = oParams.url;
            var iIndexOfHash = sAppUri.indexOf('#');
            var oHashPartOfUri = oURLParsing.parseShellHash(sAppUri.substring(iIndexOfHash));
            var iParamsCount = Object.keys(oHashPartOfUri.params).length;
            var oUrl = new URL(sURL);
            if (iParamsCount > 0){
                if (!oUrl.searchParams.has("sap-collaboration-teams")) {
                    oUrl.searchParams.set("sap-collaboration-teams", "true");
                } else {
                    oUrl.searchParams.delete("sap-collaboration-teams");
                }
            }
            return Promise.resolve(oUrl.toString());
        });
    };

    /**
     * Helper method which shares the URL as Card
     *
     * @param {Object} oParams Parameter object which contain the information to share
     * @param {string} oParams.url Url of the application which needs to be shared
     * @returns {void}
     * @private
     * @ui5-restricted
     * @experimental Since 1.108
     */
    TeamsHelperService.prototype._shareAsCard = function (oParams) {
        if (oParams.cardId && oParams.cardId.length > 0 && oParams.cardManifest && this.isFeatureFlagEnabled()) {
            // Card Id and Card Manifest Passed. It will show busy helper and store card into DB.
            Fragment.load({
                name: "sap.suite.ui.commons.collaboration.CollaborationBusyDialog",
                controller: this,
                type:  "XML"
            }).then(function (oDialog) {
                oBusyDailog = oDialog;
                oBusyDailog.open();
                iTimeoutId = setTimeout(function() {
                    oBusyDailog.close();
                    oBusyDailog.destroy();
                }, AUTO_CLOSE_BUSY_DIALOG_TIME);
                CollaborationCardHelper.postCard(oParams.cardId, oParams.cardManifest).then(function (response) {
                    var bSuccessScenario = true;
                    var oResponseData = {
                        cardId: response.card_id,
                        version: response.version
                    };
                    if (response.error) {
                        if (response.error.code === "APS_UI_MSG/001") {
                            // Card ID with same CardManifest detail is present so it will get version and open Teams Dialog
                            bSuccessScenario = true;
                            oResponseData.cardId = oParams.cardId;
                            if (response.error.message.length > 0){
                                try {
                                    var sCardVersion = JSON.parse(atob(response.error.message)).version;
                                    oResponseData.version = sCardVersion;
                                } catch (e) {
                                    bSuccessScenario = false;
                                }
                            }
                        } else {
                            bSuccessScenario = false;
                        }
                    }
                    if (bSuccessScenario) {
                        this._updateUrl(oParams, oResponseData);
                    } else {
                        MessageBox.error(oResourceBundle.getText("SAVE_CARD_ERROR"));
                        this._closeBusyDailog();
                    }
                }.bind(this));
            }.bind(this));
        } else {
            // Base Card to unfurl
            this._updateUrl(oParams, {});
        }
    };

    TeamsHelperService.prototype._updateUrl = async function(oParams, oResponseData) {
        if (oParams.minifyUrlForChat) {
			CollaborationHelper.compactHash(oParams.url, []).then(async function (sShortURL) {
                var sModifiedUrl = await this._modifyUrlForNavigationContext(oParams, sShortURL.url);
                if (oTeamsParams.isShareAsTabEnabled && this._providerConfig.isShareAsTabEnabled) {
                    var sUrlForTab = await this._modifyUrlForShareAsTab(oParams.url);
                    var sShortURLTab = await CollaborationHelper.compactHash(sUrlForTab, []);
                    var sStageViewHash = sShortURLTab.url.split("sap-url-hash=")[1];
                    // Scenario in which URL shortening is enabled, but the iAppState is set to Transient.
                    if (sStageViewHash) {
                        sModifiedUrl += "&" + PARAM_SAP_STAGEVIEW_HASH + "=" + sStageViewHash;
                    } else {
                        sModifiedUrl = await this._addNavmodeInUrl(sModifiedUrl, 'inplace');
                    }
                    this._closeBusyDialogAndOpenTeamsDialog(sModifiedUrl, oParams, oResponseData);
                } else {
                    this._closeBusyDialogAndOpenTeamsDialog(sModifiedUrl, oParams, oResponseData);
                }
            }.bind(this));
        } else {
            var sModifiedUrl = oParams.url;
            if (oTeamsParams.isShareAsTabEnabled && this._providerConfig.isShareAsTabEnabled) {
                sModifiedUrl = await this._addNavmodeInUrl(oParams.url, 'inplace');
            }
            this._closeBusyDialogAndOpenTeamsDialog(sModifiedUrl, oParams, oResponseData);
        }
    };

    TeamsHelperService.prototype._closeBusyDailog = function() {
        if (oBusyDailog) {
            oBusyDailog.close();
            oBusyDailog.destroy();
            clearTimeout(iTimeoutId);
        }
    };

    TeamsHelperService.prototype._closeBusyDialogAndOpenTeamsDialog = function(sUrl, oParams, response) {
        this._closeBusyDailog();
        var newWindow = window.open(
            "",
            "_blank",
            windowWidthAndHeight
        );
        newWindow.opener = null;
        newWindow.location = this._addCardParamsInUrl(sUrl, oParams.appTitle, response);
    };

    TeamsHelperService.prototype._addCardParamsInUrl = function(sUrl, sAppTitle, response) {
        if (response.cardId) {
            sUrl = sUrl + "&" + PARAM_SAP_CARD_ID + "=" + response.cardId;
        }
        if (response.version) {
            sUrl = sUrl + "&" + PARAM_SAP_CARD_VERSION + "=" + response.version;
        }
        sUrl = sUrl + "&" + PARAM_SAP_CARD_TITLE + "=" + sAppTitle;
        sUrl = this._providerConfig.shareAsLinkUrl + "?href=" + encodeURIComponent(sUrl);
        return sUrl;
    };

    TeamsHelperService.prototype._getShareAsTabUrl = function () {
        return this._getApplicationID().then(function(sTeamsAppID) {
            return "https://teams.microsoft.com/l/entity/" + sTeamsAppID + "/tab";
        });
    };

    TeamsHelperService.prototype._getApplicationID = function () {
        const UshellContainer = sap.ui.require("sap/ushell/Container");
        return UshellContainer && UshellContainer.getServiceAsync("URLParsing").then(function(oURLParsing) {
            return CollaborationHelper._getCurrentUrl().then(function (sCurrentUrl) {
                var sBeforeHashURL = sCurrentUrl.split("#")[0];
                if (sBeforeHashURL.indexOf('?') !== -1) {
                    var oParsedUrl = oURLParsing && oURLParsing.parseParameters(sBeforeHashURL.substring(sBeforeHashURL.indexOf('?')));
                    if (oParsedUrl &&
                        oParsedUrl["sap-collaboration-xx-TeamsAppId"] &&
                        oParsedUrl["sap-collaboration-xx-TeamsAppId"][0] &&
                        oParsedUrl["sap-collaboration-xx-TeamsAppId"][0].length > 0) {
                        return Promise.resolve(oParsedUrl["sap-collaboration-xx-TeamsAppId"][0]);
                    }
                    return Promise.resolve(COLLABORATION_MSTEAMS_APPID);
                } else {
                    return Promise.resolve(COLLABORATION_MSTEAMS_APPID);
                }
            });
        });
    };

    /**
     * Method tobe called to know if feature flag is enabled and based on that Adapptive Card Generation code can be executed or skipped.
     * @returns {boolean} A boolean indicating feature flag is enabled
     * @private
     */
    TeamsHelperService.prototype.isFeatureFlagEnabled = function () {
        // if (window["sap-ushell-config"] &&
		// 	window["sap-ushell-config"].renderers &&
		// 	window["sap-ushell-config"].renderers.fiori2 &&
		// 	window["sap-ushell-config"].renderers.fiori2.componentData &&
		// 	window["sap-ushell-config"].renderers.fiori2.componentData.config &&
		// 	window["sap-ushell-config"].renderers.fiori2.componentData.config.sapHorizonEnabled) {
        //         return true;
        //     }

        return false;
    };

    /**
     * Checks if collaboration with contacts is supported in teams AD
     *
     * @returns {boolean} A boolean indicating collaboration is supported
     * @private
     */

    TeamsHelperService.prototype.isContactsCollaborationSupported = function () {
        return true;
    };

    /**
     * Enables collaboration with contacts in teams AD
     * @param {string} sEmail email of the contact to enable the communication
     * @private
     */

    TeamsHelperService.prototype.enableContactsCollaboration = function (sEmail) {
        if (this._providerConfig.applicationId && this._providerConfig.tenantId && sEmail) {
            if (!this.oContactHelper) {
                this.oContactHelper = new ContactHelper(this._providerConfig);
            }
            return this.oContactHelper.loadContactPopover(sEmail);
        }
    };

    /**
     * Enables Teams collaboration by providing a popover with options for contact
     * @param {string} sEmail email of the contact to enable the communication
     * @returns {object} instance of a popver with data modelled to provide options
     * @private
     */

    TeamsHelperService.prototype.enableMinimalContactsCollaboration = async function (sEmail) {
        const isTeamMode = await CollaborationHelper.isTeamsModeActive();
        if (isTeamMode || !sEmail || this._providerConfig.isDirectCommunicationEnabled !== "ENABLED") {
            return Promise.reject();
        }
        if (!this.oContactHelper) {
            this.oContactHelper = new ContactHelper();
        }
        return this.oContactHelper.loadMinimalContactPopover(sEmail);
    };

    /**
     * Provide Teams collaboration options for contact
     * @returns {object} Options for teams collaboration
     * @private
     */

    TeamsHelperService.prototype.getTeamsContactCollabOptions = async function () {
        const isTeamMode = await CollaborationHelper.isTeamsModeActive();
        if (isTeamMode || this._providerConfig.isDirectCommunicationEnabled !== "ENABLED") {
            return Promise.reject();
        }
        if (!this.oContactHelper) {
            this.oContactHelper = new ContactHelper();
        }
        return this.oContactHelper.getTeamsContactOptions();
    };

    return TeamsHelperService;
});