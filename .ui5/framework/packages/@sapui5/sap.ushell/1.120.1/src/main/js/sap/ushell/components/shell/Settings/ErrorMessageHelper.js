// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ui/core/Messaging"
], function (Messaging) {
    "use strict";
    var sUserSettingsErrorDialogTarget = "sapUshellSettingsDialog/";

    return {
        addMessage: addMessage,
        filterMessagesToDisplay: filterMessagesToDisplay,
        removeErrorMessages: removeErrorMessages
    };

    /**
     * Add a message to the MessageManager with the correct target
     *
     * @param {sap.ui.core.message.Message} message The message to be added
     * @private
     */
    function addMessage (message) {
        message.setTargets([sUserSettingsErrorDialogTarget]);
        Messaging.addMessages(message);
    }

    /**
     * Filter messages of the MessageManager based on the target
     *
     * @returns {array} An array of messages to be displayed
     * @private
     */
    function filterMessagesToDisplay () {
        return Messaging.getMessageModel().getData().filter(function (oMessage) {
            return oMessage.getTargets() && oMessage.getTargets().indexOf(sUserSettingsErrorDialogTarget) === 0;
        });
    }

    /**
     * Remove messages from the MessageManager based on the target
     *
     * @private
     */
    function removeErrorMessages () {
        Messaging.getMessageModel().getData().forEach(function (oMessage) {
            if (oMessage.getTargets() && oMessage.getTargets().indexOf(sUserSettingsErrorDialogTarget) === 0) {
                Messaging.removeMessages(oMessage);
            }
        });
    }
});
