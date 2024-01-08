// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
/**
 * @file This file contains miscellaneous utility functions for post message communication
 */
sap.ui.define([
    "sap/base/Log",
    "sap/ui/thirdparty/URI"
], function (
    Log,
    URI
) {
    "use strict";

    var oApplication,
        oBlueBoxHandler;

    var PostMessageUtils = {};

    PostMessageUtils.init = function (inApplication, inBlueBoxHandler) {
        oApplication = inApplication;
        oBlueBoxHandler = inBlueBoxHandler;
    };

    PostMessageUtils.createPostMessageRequest = function (sServiceName, oMessageBody) {
        var sRequestId = Date.now().toString();

        return {
            type: "request",
            request_id: sRequestId,
            service: sServiceName,
            body: oMessageBody || {}
        };
    };

    PostMessageUtils.createPostMessageResponse = function (sServiceName, sRequestId, oMessageBody, bSuccess) {
        return {
            type: "response",
            request_id: sRequestId,
            service: sServiceName,
            status: (bSuccess ? "success" : "error"),
            body: oMessageBody || {}
        };
    };

    PostMessageUtils.postMessageToIframeApp = function (oContainer, sServiceName, sInterface, oMessageBody, bWaitForResponse) {
        var sService = sServiceName + "." + sInterface,
            oMessage = this.createPostMessageRequest(sService, oMessageBody);

        return this.postMessageToIframe(oMessage, oContainer, bWaitForResponse);
    };

    PostMessageUtils.postMessageToIframe = function (oMessage, oContainer, bWaitForResponse) {
        var oIFrame = oContainer._getIFrame && oContainer._getIFrame(),
            oUri,
            sTargetDomain;

        if (!oIFrame || !oContainer._getIFrameUrl) {
            return Promise.resolve();
        }

        oUri = new URI(oContainer._getIFrameUrl(oIFrame));
        sTargetDomain = oUri.protocol() + "://" + oUri.host();

        return this.postMessageToIframeObject(oMessage, oIFrame, sTargetDomain, bWaitForResponse, true);
    };

    PostMessageUtils.postMessageToIframeObject = function (oMessage, oIFrame, sTargetDomain, bWaitForResponse, bFromContainer) {
        var sRequestId = oMessage.request_id;

        return new Promise(function (fnNotifySuccess, fnNotifyError) {
            function fnProcessClientMessage (oEvent) {
                var oEventData;

                try {
                    //only messages from the
                    if ((bFromContainer === true ? oIFrame.contentWindow : oIFrame) !== oEvent.source) {
                        return;
                    }

                    if (typeof oEvent.data === "string" && oEvent.data.indexOf("{") === 0) {
                        try {
                            oEventData = JSON.parse(oEvent.data);
                        } catch (e) {
                            oEventData = {};
                        }
                    } else {
                        return;
                    }

                    if (!oEventData.request_id || sRequestId !== oEventData.request_id) {
                        return;
                    }

                    window.removeEventListener("message", fnProcessClientMessage);

                    if (oEventData.status === "success") {
                        fnNotifySuccess(oEventData);
                    } else {
                        fnNotifyError(oEventData);
                    }
                } catch (e) {
                    // Not gonna break because of a potential quirk in the framework that responded to postMessage
                    fnNotifySuccess();
                    Log.warning("Obtained bad response from framework in response to message " + oMessage.request_id);
                    Log.debug("Underlying framework returned invalid response data: '" + oEvent.data + "'");
                }
            }

            if (!oIFrame) {
                fnNotifySuccess();
            } else {
                var sMessage = JSON.stringify(oMessage);

                Log.debug("Sending postMessage " + sMessage + " to iframe with domain '" + sTargetDomain + "'");
                if (bWaitForResponse === true) {
                    window.addEventListener("message", fnProcessClientMessage, false);
                    if (bFromContainer === true) {
                        oIFrame.contentWindow.postMessage(sMessage, sTargetDomain);
                    } else {
                        oIFrame.postMessage(sMessage, sTargetDomain);
                    }
                } else {
                    if (bFromContainer === true) {
                        oIFrame.contentWindow.postMessage(sMessage, sTargetDomain);
                    } else {
                        oIFrame.postMessage(sMessage, sTargetDomain);
                    }
                    fnNotifySuccess();
                }
            }
        });
    };

    PostMessageUtils.postMessageToMultipleIframes = function (sServiceName, sInterface, oMessageBody, bWaitForResponse) {
        //this is a temporary check that will be removed after the issue of the central logout
        //will be implemented. In the case here, for FLP@ABAP, we do not want to send logout message to
        //CRM, WebGui and WDA iframes ifames as this is not needed. Sending it will cause an issue with the
        //main FLP logout
        function checkIfPostIsNeeded (oCurrContainer) {
            if (sServiceName === "sap.ushell.sessionHandler" && sInterface === "logout") {
                if (oCurrContainer && oCurrContainer.getApplicationType && ",WCF,GUI,TR,WDA,".indexOf(oCurrContainer.getApplicationType()) > 0) {
                    return false;
                }
            }
            return true;
        }

        if (!oApplication || !oBlueBoxHandler) {
            return Promise.all([]);
        }

        var oContainer = oApplication.getActiveAppContainer(),
            bActiveContainerPostSent = false,
            aContainers = [];
        if (oContainer && oContainer._getIFrame && oContainer._getIFrame() &&
            (oBlueBoxHandler.isCapabilitySupported(oContainer, sServiceName, sInterface) || oApplication.isAppTypeSupported(oContainer, sServiceName, sInterface)) &&
            checkIfPostIsNeeded(oContainer) === true) {
            aContainers.push(
                PostMessageUtils.postMessageToIframeApp(oContainer, sServiceName, sInterface, oMessageBody, bWaitForResponse)
            );
            bActiveContainerPostSent = true;
        }

        //for all other stored applications
        if (oBlueBoxHandler.getBlueBoxesCount() > 0 && !oApplication.isActiveOnly(sServiceName, sInterface)) {
            oBlueBoxHandler.forEach(function (OBBContainer) {
                if (bActiveContainerPostSent === true && OBBContainer === oContainer) {
                    return;
                }
                if (OBBContainer._getIFrame && OBBContainer._getIFrame()) {
                    if ((oBlueBoxHandler.isCapabilitySupported(OBBContainer, sServiceName, sInterface) || oApplication.isAppTypeSupported(OBBContainer, sServiceName, sInterface)) &&
                        checkIfPostIsNeeded(OBBContainer) === true) {
                        aContainers.push(
                            PostMessageUtils.postMessageToIframeApp(OBBContainer, sServiceName, sInterface, oMessageBody, bWaitForResponse)
                        );
                    }
                }
            });
        }

        return Promise.all(aContainers);
    };

    return PostMessageUtils;
}, /* bExport= */ false);
