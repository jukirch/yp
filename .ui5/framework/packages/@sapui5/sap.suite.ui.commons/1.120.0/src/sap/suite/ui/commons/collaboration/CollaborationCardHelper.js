/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
    "sap/ui/base/Object"
], function (BaseObject) {
    "use strict";

    var BASE_URL = "/sap/opu/odata4/sap/aps_ui_card_srv/srvd_a2x/sap/";
    var REPO_BASE_URL = BASE_URL + "aps_ui_card/0001/";
    var CARD_ENTITY_NAME = "Card";
    var CARD_READ_URL = BASE_URL + "aps_ui_card/0001/" + CARD_ENTITY_NAME;
    var POST = "POST";
    var HEAD = "HEAD";

    /**
     * CollaborationCardHelper for service integration functionalities
     * @namespace
     * @since 1.119
     * @alias module:sap/suite/ui/commons/collaboration/CollaborationCardHelper
     * @private
     */
    var CollaborationCardHelper = BaseObject.extend(
        "sap.suite.ui.commons.collaboration.CollaborationCardHelper"
    );

    CollaborationCardHelper.fetchCSRFToken = function() {
        return fetch(REPO_BASE_URL, {
            method: HEAD,
            headers: {
                "X-CSRF-Token": "Fetch"
            }
        }).then(function (resposne) {
            var token = resposne.headers.get("X-CSRF-Token");
            if (resposne.ok && token) {
                return token;
            }
            return undefined;
        });
    };

    /**
     * Post Card
     * @param {string} oContent Adaptive Card Base64
     * @returns {object} response
     */
    CollaborationCardHelper.postCard = function(sCardId, oContent) {
        return this.fetchCSRFToken().then(function (sCSRFToken) {
            var sContent = btoa(JSON.stringify(oContent));
            var sPayload = JSON.stringify({ content: sContent, card_id: sCardId });
            return fetch(CARD_READ_URL, {
                method: POST,
                headers: {
                   "X-CSRF-Token": sCSRFToken,
                   "content-type": "application/json;odata.metadata=minimal;charset=utf-8"
                },
                body: sPayload
            }).then(function (oResponse) {
                return oResponse.json();
            });
        });
    };

    return CollaborationCardHelper;

});