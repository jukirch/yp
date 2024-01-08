/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define(["sap/ovp/cards/CommonUtils"], function (CommonUtils) {
    "use strict";

    /**
     * Change handler object configuration for hiding/unhiding componentContainer
     *
     * @returns {object} Card change handler configuration object
     */
    function getCardChangeHandlerObjectConfig() {
        return {
            changeHandler: {},
            layers: {
                VENDOR: true,
                CUSTOMER_BASE: true,
                CUSTOMER: true,
                USER: true
            }
        };
    }

    /**
     * Create new change content if it contains legacy content.
     * The new change content contains an object with 'card' as key and stores local card id and idIsLocal property as true
     * to remove change dependency on component prefix (to make it intent independent)
     * @param {sap.ui.fl.oChange} oChange 
     * @returns {object} Change content based on new format
     */
    function createNewChangeFormatFromLegacy(oChange) {
        var oChangeContent = oChange.getContent();
        if (!oChangeContent.card) {
            // If the change does not contain card definition then it's a legacy change, it should be converted to new format
            var oNewChangeContent = {
                "card": {
                    id: CommonUtils.removePrefixAndReturnLocalId(oChangeContent.id),
                    idIsLocal: true
                }
            };
            return oNewChangeContent;
        }
        return oChangeContent;
    }

    var PersonalizationDefaultConfig = {
        changeHandler: {
            applyChange: function (oChange, oPanel, mPropertyBag) {
                var personalizationDefaultMainController = CommonUtils.getApp();
                personalizationDefaultMainController.appendIncomingDeltaChange(oChange);
                return;
            },
            completeChangeContent: function (oChange, oSpecificChangeInfo, mPropertyBag) {
                return;
            },
            revertChange: function (oChange, oControl, mPropertyBag) {
                return;
            }
        },
        layers: {
            CUSTOMER_BASE: true,
            CUSTOMER: true,
            USER: true
        }
    };

    /**
     * Change handler for unhiding/revealing cards of the layout .
     * @alias sap.ui.fl.changeHandler.UnhideControl
     * @author SAP SE
     * @version 1.120.0
     * @experimental Since 1.27.0
     */
    var UnhideControlConfig = {
        changeHandler: "default",
        layers: {
            CUSTOMER_BASE: true,
            CUSTOMER: true,
            USER: true
        }
    };

    var HideCardContainer = getCardChangeHandlerObjectConfig();
    var UnhideCardContainer = getCardChangeHandlerObjectConfig();

    /*
     * Hides a componentContainer control.
     *
     * @param {sap.ui.fl.Change} oChange change object with instructions to be applied on the control map
     * @param {sap.ui.core.Control} oControl control that matches the change selector for applying the change
     * @param {objenct} mPropertyBag - map of properties
     * @returns {boolean} true - if change could be applied
     * @public
     */
    HideCardContainer.changeHandler.applyChange = function (oChange, oControl, mPropertyBag) {
        oChange.setContent(createNewChangeFormatFromLegacy(oChange));
        return _applyChange(oChange, oControl, mPropertyBag, false);
    };

    /**
     * Reverts hiding of a componentContainer control.
     *
     * @param {sap.ui.fl.Change} oChange change object with instructions to be applied on the control map
     * @param {sap.ui.core.Control} oControl control that matches the change selector for applying the change
     * @param {object} mPropertyBag - map of properties
     * @returns {boolean} true - if change could be applied
     * @public
     */
    HideCardContainer.changeHandler.revertChange = function (oChange, oControl, mPropertyBag) {
        return _revertChange(oChange, oControl, mPropertyBag, true);
    };

    /**
     * Completes the change by adding change handler specific content
     *
     * @param {sap.ui.fl.oChange} oChange change object to be completed
     * @param {object} oSpecificChangeInfo as an empty object since no additional attributes are required for this operation
     * @param {object} mPropertyBag - map of properties
     * @param {sap.ui.core.UiComponent} mPropertyBag.appComponent component in which the change should be applied
     * @public
     */
    HideCardContainer.changeHandler.completeChangeContent = function (oChange, oSpecificChangeInfo, mPropertyBag) {
        var sLocalCardId = CommonUtils.removePrefixAndReturnLocalId(oSpecificChangeInfo.removedElement.id);
        var oChangeContent = {
            "card": {
                "id": sLocalCardId,
                "idIsLocal": true
            }
        };
        return Promise.resolve().then(function() {
            oChange.setContent(oChangeContent);
        });
    };

    /**
     * Unhides a componentContainer control.
     *
     * @param {sap.ui.fl.Change} oChange change object with instructions to be applied on the control map
     * @param {sap.ui.core.Control} oControl control that matches the change selector for applying the change
     * @param {object} mPropertyBag - map of properties
     * @returns {boolean} true - if change could be applied
     * @public
     */
    UnhideCardContainer.changeHandler.applyChange = function (oChange, oControl, mPropertyBag) {
        oChange.setContent(createNewChangeFormatFromLegacy(oChange));
        return _applyChange(oChange, oControl, mPropertyBag, true);
    };

    /**
     * Reverts unhiding of a componentContainer control.
     *
     * @param {sap.ui.fl.Change} oChange change object with instructions to be applied on the control map
     * @param {sap.ui.core.Control} oControl control that matches the change selector for applying the change
     * @param {object} mPropertyBag - map of properties
     * @returns {boolean} true - if change could be applied
     * @public
     */
    UnhideCardContainer.changeHandler.revertChange = function (oChange, oControl, mPropertyBag) {
        return _revertChange(oChange, oControl, mPropertyBag, false);
    };

    /**
     * Completes the change by adding change handler specific content
     *
     * @param {sap.ui.fl.oChange} oChange change object to be completed
     * @param {object} oSpecificChangeInfo as an empty object since no additional attributes are required for this operation
     * @param {object} mPropertyBag - map of properties
     * @param {sap.ui.core.UiComponent} mPropertyBag.appComponent component in which the change should be applied
     * @public
     */
    UnhideCardContainer.changeHandler.completeChangeContent = function (oChange, oSpecificChangeInfo, mPropertyBag) {
        var sLocalCardId = CommonUtils.removePrefixAndReturnLocalId(oSpecificChangeInfo.revealedElementId);
        var oChangeContent = {
            "card": {
                "id": sLocalCardId,
                "idIsLocal": true
            }
        };
        return Promise.resolve().then(function(){
            oChange.setContent(oChangeContent);
        });
    };

    function _revertChange(oChange, oControl, mPropertyBag, visibility) {
        var oModifier = mPropertyBag.modifier,
            oAppComponent = mPropertyBag.appComponent,
            oMainController = CommonUtils.getApp(),
            oUIModel = oMainController.getUIModel(),
            oLayout = oMainController.getLayout(),
            sCardId = oAppComponent.createId(oChange.getRevertData().id),
            oCardControl = oModifier.bySelector(oChange.getRevertData(), oAppComponent);

        oModifier.setVisible(oCardControl, visibility);
        oChange.resetRevertData(); // Clear the revert data on the change
        if (oUIModel.getProperty("/containerLayout") === "resizable") {
            var oLayoutUtil = oLayout.getDashboardLayoutUtil();
            oLayoutUtil.updateCardVisibility([
                { id: oLayoutUtil.getCardIdFromComponent(sCardId), visibility: visibility }
            ]);
        }
        oLayout.invalidate();
        return Promise.resolve(true);
    }

    function _applyChange(oChange, oControl, mPropertyBag, visibility) {
        var oModifier = mPropertyBag.modifier,
            oMainController = CommonUtils.getApp(),
            oMainView = oMainController && oMainController.getView();

        if (!oMainView) {
            throw new Error("Main view is not initialized yet.");
        }

        var oUIModel = oMainController.getUIModel(),
            oLayout = oMainController.getLayout(),
            oChangeContent = oChange.getContent(),
            oAppComponent = mPropertyBag.appComponent,
            sCardId = oAppComponent.createId(oChangeContent.card.id),
            oCardControl = oModifier.bySelector(oChangeContent.card, oAppComponent, oMainView);

        // check if the user level changes have happened before the key user changes
        // if so, there is a change on same card then dont apply the key user
        var isUserChange = oMainController.deltaChanges.filter(function (a) {
            return (
                a.getSelector().id === oChangeContent.card.id &&
                a.getChangeType() === "visibility"
            );
        });

        // if the main controller has executed before the key user changes then default all cards visibility is true
        // so to keep key user changes when resetiing, should change the aManifestOrderedCards
        if (oMainController.aManifestOrderedCards) {
            for (var i = 0; i < oMainController.aManifestOrderedCards.length; i++) {
                var sContentChangeId = sCardId;
                var iMainComponentIdEndIndex = sContentChangeId.indexOf("---") + 3;
                var sMainViewId = sContentChangeId.substring(iMainComponentIdEndIndex);
                if (oMainController.aManifestOrderedCards[i].id === sMainViewId.split("--")[1]) {
                    oMainController.oView.oController.aManifestOrderedCards[i].visibility =
                        oChange.getChangeType() === "hideCardContainer" ? false : true;
                }
            }
        }
        if (!oMainController.aManifestOrderedCards || isUserChange.length === 0) {
            oChange.setRevertData(oChangeContent.card);
            oModifier.setVisible(oCardControl, visibility);

            if (oUIModel.getProperty("/containerLayout") === "resizable") {
                var oLayoutUtil = oLayout.getDashboardLayoutUtil();
                if (oLayoutUtil.aCards) {
                    oLayoutUtil.updateCardVisibility([
                        {
                            id: oLayoutUtil.getCardIdFromComponent(sCardId),
                            visibility: visibility
                        }
                    ]);
                }
                oMainController.appendIncomingDeltaChange(oChange);
            }
            if (visibility) {
                var oCardView = oMainView.byId(sCardId);
                /**
                 *  Scenario: If a card is hidden at Vendor or Customer Layer
                 *  then no component is created on initial load of the application
                 *
                 *  Solution: We have to create the component for that card specifically
                 *  for that we use "recreateRTAClonedCard" function from Main controller
                 *  and check if we are not executing it on load of the application using
                 *  flag "bFinishedCardsCreationProcess" in Main controller which is set to
                 *  true only if all the cards have started the creation process. Since in
                 *  RTA mode all cards have been created already this flag will be true.
                 *  But on initial load it will be false.
                 */
                if (!oCardView.getComponentInstance() && oMainController.bFinishedCardsCreationProcess) {
                    var oCardManifest = oMainController._getCardFromManifest(oMainController._getCardId(sCardId));
                    oMainController.recreateRTAClonedCard(oCardManifest);
                }
            }
            oLayout.invalidate();
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    }

    return {
        HideCardContainer: HideCardContainer,
        UnhideCardContainer: UnhideCardContainer,
        PersonalizationDefaultConfig: PersonalizationDefaultConfig,
        UnhideControlConfig: UnhideControlConfig
    };
});
