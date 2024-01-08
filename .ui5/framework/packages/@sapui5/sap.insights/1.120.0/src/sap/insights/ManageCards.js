/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/NavContainer",
    "sap/ui/model/resource/ResourceModel",
    "./manageCards/CardsList",
    "./manageCards/CardDetails",
    "sap/insights/CardHelper",
    "sap/ui/core/Lib"
], function (
    Control,
    NavContainer,
    ResourceModel,
    CardsList,
    CardDetails,
    CardHelper,
    CoreLib
) {
    "use strict";

    /**
	 * Constructor for  ManageCards.
	 *
	 * @class
	 * This control shows list of all user cards and allows perform actions like change visibility, change order.
     * It also allows user to get preview of particular card, delete or copy.
	 * @extends sap.ui.core.Control
	 * @public
     * @since 1.119
     * @alias sap.insights.ManageCards
	 */
    var I18_BUNDLE = CoreLib.getResourceBundleFor("sap.insights");
    var ManageCards = Control.extend("sap.insights.ManageCards", {
        metadata: {
            properties: {
                /**
                 * Sets enableResetAllCards property
                 */
                enableResetAllCards: {
                    type: "boolean",
                    group: "Behavior",
                    defaultValue: false
                },
                 /**
                 * Sets the cardId property  which decides whether to render the details page or cardlist page,
                 *  if cardId is provided , cardDetails page is rendered
                 */
                cardId: {
                    type: "string",
                    group: "Behavior",
                    defaultValue: null
                }
            },
            aggregations: {
                _navContainer: {
                    type: "sap.m.NavContainer",
                    multiple: false,
                    visibility: "hidden"
                }
            }
        },
        renderer: {
            apiVersion: 2,
            render: function (oRm, oControl) {
                oRm.openStart("div", oControl);
                oRm.style("height", "100%");
                oRm.style("width", "100%");
                oRm.openEnd();
                oControl._oNavContainer.to(oControl._oNavContainer.getInitialPage());
                oRm.renderControl(oControl.getAggregation("_navContainer"));
                oRm.close("div");
            }
        }
    });

    ManageCards.prototype.onAfterRendering = function() {
        this._oNavContainer.setBusy(true);
        CardHelper.getServiceAsync().then(function (oService) {
            return oService._getUserAllCardModel();
       }).then(function(oUserCardModel) {

        if (!this._cardDetailControl) {
            // Add CardList Page
            this._cardListPage = new CardsList(this.getId() + "cardList", {
                enableResetAllCards: this.getEnableResetAllCards(),
                listPress: this._navToDetails.bind(this)
            });
            this._cardListPage.setModel(oUserCardModel);
            this._cardListPage._handleModelChange(); //one time call during initialisation
            oUserCardModel.bindProperty("/cards").attachChange(function(event) {
                this._cardListPage._handleModelChange(); //whenever 'cards' change invoke _handleModelChange
            }.bind(this));

            this._cardDetailControl = new CardDetails(this.getId() + "previewPage",{
                navigate: this.navigateTo.bind(this)
            });

            this._oNavContainer.addPage(this._cardListPage);
        }

           var sCardId = this.getCardId();
           if (sCardId) {
               var aCards = oUserCardModel.getProperty("/cards");
               var oCard = aCards.find(function(oCard){
                   return oCard.id === sCardId;
                });
                if (oCard) {
                this._oNavContainer.addPage( this._cardDetailControl );
                var manifest = JSON.stringify(oCard);
                this._cardDetailControl.setProperty("manifest", manifest, false);
                this._oNavContainer.to(this._cardDetailControl);
            }
           } else {
                this._oNavContainer.setInitialPage(this._cardListPage);
                this._oNavContainer.to(this._cardListPage);

           }
           this._oNavContainer.setBusy(false);
       }.bind(this));
    };

    ManageCards.prototype.init = function() {
        //Instantiate NavContainer creation
        this._oNavContainer = new NavContainer(this.getId() + "--selectionNavCon", {
            busy: true
        });
        this._oNavContainer.setModel(new ResourceModel({ bundle: I18_BUNDLE }), "i18n");
        this.setAggregation("_navContainer", this._oNavContainer);
	};

    /**
	* Function to navigate to the specified page , if no sPageId provided navigate to CardList by default
    * @param {Object} oEvent, oEvent object
    * @param {String} sPageId, page id to which to navigate to
    * @public
    */
    ManageCards.prototype.navigateTo = function (oEvent, sPageId) {
        if (!oEvent && sPageId) {
            this._oNavContainer.to(sPageId);
        } else {
            this._oNavContainer.to(this._cardListPage.getId());
        }
    };

    /**
	* Function to navigate to to cardDetails page
    * @param {Object} oDetails, object containing manifest as a property. This is the manifest
    * of the card whose detail will be be displayed after navigation
    * @private
    * @experimental Since 1.119
    */
    ManageCards.prototype._navToDetails = function (oDetails) {
        if (oDetails && oDetails.getParameter("manifest")) {
            this._cardDetailControl.setProperty("manifest",oDetails.getParameter("manifest"),false);
            //if not already added to NavContainer add cardDetailPage to navcontainer
            if (!this._oNavContainer.getPage(this._cardDetailControl.getId())) {
                this._oNavContainer.addPage( this._cardDetailControl );
            }
            this._cardDetailControl.oPage.setShowNavButton(true);
            this._cardDetailControl.setEditable(false);
            this._oNavContainer.to(this._cardDetailControl);
        }
    };

    return ManageCards;
});
