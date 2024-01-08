
/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/FlexBox",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/ScrollContainer",
    "sap/m/Title",
    "sap/ui/integration/widgets/Card",
    "sap/ui/layout/Grid",
    "../utils/AppConstants",
    "sap/m/Link",
    "sap/m/Label",
    "sap/insights/CardHelper",
    "../utils/oDataModelProvider",
    "sap/ui/core/CustomData",
    "../utils/MetadataAnalyser",
    "../utils/V4MetadataAnalyser",
    "sap/m/Token",
    "sap/ui/core/date/UI5Date",
    "../utils/UrlGenerateHelper",
    "../utils/SelectionVariantHelper",
    "sap/fe/navigation/SelectionVariant",
    'sap/ui/core/IconPool',
    "sap/base/util/deepClone",
    "sap/ui/comp/util/DateTimeUtil",
    "sap/ui/layout/form/SimpleForm",
    "sap/m/Toolbar",
    "sap/m/Input",
    "sap/m/DynamicDateRange",
    "sap/m/Button",
    "sap/m/Page",
    "../utils/CardPreviewManager",
    "sap/base/Log",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    'sap/ui/model/resource/ResourceModel',
    "sap/ui/mdc/MultiValueField",
    "sap/ui/mdc/field/MultiValueFieldItem",
    "sap/m/Text",
    'sap/ui/model/json/JSONModel',
    "../base/InMemoryCachingHost",
    "sap/ui/core/Element",
    "sap/ui/core/Lib"
], function(
    Control,
    FlexBox,
    VBox,
    HBox,
    ScrollContainer,
    Title,
    Card,
    Grid,
    AppConstants,
    Link,
    Label,
    CardHelper,
    oDataModelProvider,
    CustomData,
    MetadataAnalyser,
    V4MetadataAnalyser,
    Token,
    UI5Date,
    UrlGenerateHelper,
    SelectionVariantHelper,
    SelectionVariant,
    IconPool,
    deepClone,
    DateTimeUtil,
    SimpleForm,
    Toolbar,
    Input,
    DynamicDateRange,
    Button,
    Page,
    CardPreviewManager,
    Log,
    MessageToast,
    MessageBox,
    ResourceModel,
    MultiValueField,
    MultiValueFieldItem,
    Text,
    JSONModel,
    InMemoryCachingHost,
    Element,
    CoreLib
) {
    "use strict";

  /**
	 * Constructor for  CardDetails.
	 *
	 * @class
	 * This control shows the details of a selected card in display and edit mode
	 * @extends sap.ui.core.Control
	 * @private
   * @since 1.119
   * @alias sap.insights.manageCards.CardDetails
	 */
    var CardDetails = Control.extend("sap.insights.manageCards.CardDetails", {
        metadata: {
            properties: {
              /**
               * Sets the manifest of the currently viewed card in card details
               */
                manifest: {
                    type: "string",
                    defaultValue: null,
                    group: "Data",
                    bindable: true,
                    invalidate: true
                },
                /**
                 * Sets the editable property of the which decides whether to show the card detail
                 * in display(editable=false) mode or copy (editable = true) mode
                 */
                editable: {
                    type: "boolean",
                    group: "Behavior",
                    defaultValue: false,
                    invalidate: true
                },
                /**
                 * Defines the width of the control.
                 */
                width: {
                  type: "sap.ui.core.CSSSize",
                  group: "Dimension",
                  defaultValue: "100%"
                },
                /**
                 * Defines the height of the control.
                 */
                height: {
                  type: "sap.ui.core.CSSSize",
                  group: "Dimension",
                  defaultValue: "100%"
                }
            },
            aggregations: {

                /**
                 * Hidden aggregation of page control.
                 */
                _page: {
                  type: "sap.m.Page",
                  multiple: false,
                  visibility: "hidden"
              }
            },
            events: {
              /**
               * Is fired when one of the following happens:
               * 1. when Nav back button pressed
               * 2. when user creates a new card
               * 3. when user deletes a card
               * 4. when user click on parent app navigation link
               */
                navigate: {
                    allowPreventDefault: true,
                    parameters: {
                    }
                }
            }
        },
        renderer: {
            apiVersion: 2,
            render: function (oRm, oControl) {
              oRm.openStart("div", oControl);
              oRm.style("height", oControl.getHeight());
              oRm.style("width", oControl.getWidth());
              oRm.openEnd();
              oRm.renderControl(oControl.getAggregation("_page"));
              oRm.close("div");
              return;
            }
          }
    });


    /**
		 * Initializes the control.
		 */
    CardDetails.prototype.init = function () {

        CardHelper.getServiceAsync().then(function (oService) {
          this.oCardHelperServiceInstance = oService;
          oService._getUserAllCards().then(function (aCards) {
            this.aCards = aCards;
          }.bind(this));
        }.bind(this));

        this.parentAppUrl = null;
        this.oLogger = Log.getLogger("sap.insights.manageCards.CardDetails");
        // get resource translation bundle;
        var I18_BUNDLE = CoreLib.getResourceBundleFor("sap.insights");
        this.i18Bundle = new ResourceModel({ bundle: I18_BUNDLE }).getResourceBundle();
        this.host = new InMemoryCachingHost("CardDetailHost");

        this.oFlexBox = new FlexBox(this.getId() + "idCardsPreviewFlex",{
            height:"100%",
            direction:"Column"
        }).addStyleClass("sapUiTinyMarginBeginEnd");

        this.oInnerDeleteButton = new sap.m.Button( {
            text: this.i18Bundle.getText("delete"),
            press: this._handleCardDeleteConfirm.bind(this)
        });
        this._createStaticControls();

        this.oPage =  new Page({
          id: this.getId() + "insightCardPage",
          headerContent: [this.oInnerDeleteButton],
          content: this.oFlexBox ,
          showNavButton: true,
          navButtonPress: this._navigateToList.bind(this)
        });
        this.oSmartFormMap = {};
        this.oDraftCardParams = {};
        this.setAggregation("_page", this.oPage);

    };

    /**
		 * Called for initialising static controls within the card details
     * All static controls will only be called during initialisation, dynamic values bound to these controls
     * will be updated before rendering of the control
     * @private
     * @experimental Since 1.119
		 */
    CardDetails.prototype._createStaticControls = function () {
      //Preview Section
      //preview title
      this.oPreviewTitle = new Title(this.getId() + "--previewTitle",{
          text: this.i18Bundle.getText("preview"),
          titleStyle: "H4"
      }).addStyleClass("sapUiSmallMargin");

      //preview card
      this.oCard = new Card(this.getId() + "--previewCard", {
          width: "17rem",
          height: "23.5rem",
          manifest: this.getManifest() ?  this.getManifest() : "",
          visible: true,
          manifestReady: this._setCopyVisible.bind(this),
          manifestApplied: this._setPreviewCardAriaText.bind(this, 'preview')
      });

      //overflow box for list and table cards
      this.oOverflowInnerHBox = new HBox(this.getId() + "--insightsPreviewOverflowInnerHBox").addStyleClass("insightsCardOverflowLayer insightsCardOverflowTop insightsPreviewOverLaySize");
      this.oOverFlowHBox = new HBox(this.getId() + "insightsPreviewOverflowLayer", {
              height: "0",
              items:[ this.oOverflowInnerHBox]
          }).addStyleClass("sapMFlexBoxJustifyCenter");

      this.oPreviewVBox = new VBox(this.getId() + "--idCardsPreviewVBox",{
          alignItems: "Center",
          justifyContent: "Center",
          items: [ this.oCard, this.oOverFlowHBox ]
      });

      //FilteredBySection
      this.oSmartFormFlex = new FlexBox(this.getId() + "--smartFormFlex",{
          justifyContent:"Center",
          direction:"Column",
          visible: false,
          items:[]
      }).addStyleClass("sapUiTinyMarginTop");


      //Others Section
      this.oOtherTitle = new Title(this.getId() + "--otherSectionTitle",{
          text: this.i18Bundle.getText("otherSectionTitle"),
          titleStyle: "H5"
      }).addStyleClass("sapUiSmallMargin");
      this.oTitleVBox = new VBox(this.getId() + "--otherSectionTitleVBox",{
          width: "100%",
          items: [this.oOtherTitle]
      });

      this.parentLink = new Link(this.getId() + "--parentAppLink", {
          ariaLabelledBy: "parentAppLabel parentAppLink",
          press: this._navigateToParentApp.bind(this),
          wrapping: true
      });
      this.parentAppLabel = new Label(this.getId() + "--parentAppLabel", {
          text: this.i18Bundle.getText("parentApp")
      });
      this.parentLinkVBox = new VBox(this.getId() + "--parentAppLinkVBox",{
          width: "100%",
          items: [this.parentLink]
      }).addStyleClass("sapUiSmallMarginEnd");

      this.appLabelVBox = new VBox(this.getId() + "--parentAppLabelVBox",{
          width: "100%",
          alignItems: "End",
          items: [this.parentAppLabel]
      }).addStyleClass("sapUiSmallMarginEnd");

      this.parentAppGrid = new Grid(this.getId() + "--parentAppLinkGrid", {
          width: "100%",
          vSpacing: 0,
          hSpacing: 1,
          position: "Left",
          defaultSpan: "XL6 L6 M4 S6",
          defaultIndent: "XL0 L0 M0 S0",
          content: [this.appLabelVBox ,  this.parentLinkVBox]
      });
      this.otherSection = new HBox(this.getId() + "--otherSectionHBox", {
          direction: "Column",
          items:[this.oTitleVBox , this.parentAppGrid]
      });

      //parent Vbox
      this.outerMainVBox = new VBox(this.getId() + "--idPreviewOuterVBox",{
          height: "100%",
          width: "100%",
          items: [this.oPreviewTitle , this.oPreviewVBox, this.oSmartFormFlex, this.otherSection]

      });

      this.scrollContainer = new ScrollContainer(this.getId() + "--idCardsPreviewContainer", {
          vertical: true,
          horizontal: false,
          height: "100%",
          content: [this.outerMainVBox]
      });

  };

  /**
   * Called for initialising static controls for copy card scenario
   * All static controls used within the copy card scenario will only be called
   * during initialisation, dynamic values bound to these controls
   * will be updated before rendering of the control
   * @private
   * @experimental Since 1.119
   */
  CardDetails.prototype._createCopyStaticControls = function () {
    //Copy Card Section
    //Deatils title
    this.oDetailsTitle = new Title(this.getId() + "--detailsTitle",{
      text: this.i18Bundle.getText("editDetails"),
      titleStyle: "H5"
    }).addStyleClass("sapUiSmallMarginBegin sapUiSmallMarginEnd sapUiSmallMarginTop");

    //Copy Title label
    this.oCopyTitleLabel = new Label(this.getId() + "--copyCardsEditTitleLabel",{
      text: this.i18Bundle.getText("title"),
      required: true
    });

    //Copy Title Input
    this.oCopyTitleInput = new Input(this.getId() + "--copyCardsEditTitleField", {
      change: this._handleCardsInputChange.bind(this)
    });

    //Copy SubTitle label
    this.oCopySubLabel = new Label(this.getId() + "--copyCardsEditSubTitleLabel",{
      text: this.i18Bundle.getText("subTitle")
    });
    //Copy SubTitle Input
    this.oCopySubInput = new Input(this.getId() + "--copyCardsEditSubTitleField", {
      change: this._handleCardsInputChange.bind(this)

    });

    this._oCopyForm = new SimpleForm(this.getId() + "--copyCardsEditDetailsForm", {
      layout: "ColumnLayout",
      backgroundDesign: "Transparent",
      width: "100%",
      editable: true,
      content: [this.oCopyTitleLabel, this.oCopyTitleInput, this.oCopySubLabel, this.oCopySubInput]
    }).addStyleClass("sapContrastPlus sapUiSmallMarginEnd sapUiSmallMarginBegin");

    //parent Vbox for copy form
    this.outerCopyFormVBox = new VBox(this.getId() + "--idCopyFormVBox",{
      height: "100%",
      width: "100%",
      items: [this.oDetailsTitle , this._oCopyForm]
    });

    this.oDynDate = new DynamicDateRange(this.getId() + "--hiddenDDR", {
      hideInput: true
    });

    this.oDynDateFilter = new DynamicDateRange(this.getId() + "--hiddenFilterDDR", {
      hideInput: true
    });

    //Preview Title
    this.oCopyPreviewTitle = new Title(this.getId() + "--copyCardPreviewTitle",{
      text: this.i18Bundle.getText("preview"), //change
      titleStyle: "H5"
    }).addStyleClass("sapUiSmallMarginTop sapUiSmallMarginBegin");

    //Refresh button get updated preview of the card
    this.oRefreshButton = new Button(this.getId() + "--copyCardPreviewRefreshButton", {
      type: "Transparent",
      text: this.i18Bundle.getText("refresh"),
      press: this._handleCardPreviewPress.bind(this)
    });

    this.oCopyHbox = new HBox(this.getId() + "--copyCardPreviewHBox", {
      alignItems: "Center",
      justifyContent: "SpaceBetween",
      width: "100%",
      items: [this.oCopyPreviewTitle, this.oRefreshButton]
    });

    this.oCopyCard = new Card(this.getId() + "--copyCardPreview", {
      manifestApplied: this._setPreviewCardAriaText.bind(this, 'preview'),
      width: "17rem",
      height: "23.5rem"
    });

    this.oCopyInnerOverflow = new HBox(this.getId() + "--insightsCopyOverflowInnerHBox").addStyleClass("insightsCardOverflowLayer insightsCardOverflowTop insightsPreviewOverLaySize");

    this.oCopyOverflow = new HBox(this.getId() + "--insightsCopyOverflowLayer", {
      height: "0",
      items: [this.oCopyInnerOverflow]
    }).addStyleClass("sapMFlexBoxJustifyCenter");

    this.oCopyPreviewVBox = new VBox(this.getId() + "--copyCardsPreviewVBox",{
      alignItems: "Center",
      items: [this.oCopyCard, this.oCopyOverflow]

    }).addStyleClass("sapUiMediumMarginBottom");

    this.oCopyVBox = new VBox(this.getId() + "--copyCardPreviewVBoxWrapper",{
      backgroundDesign: "Transparent",
      height: "100%",
      width: "100%",
      items: [this.oCopyHbox, this.oCopyPreviewVBox]

    }).addStyleClass("sapUiMediumMarginTop");

  };

  /**
   * Function to save  the card
   * @private
   * @experimental Since 1.119
   */
  CardDetails.prototype._handleCardSavePress = function () {
    var oSmartFormContainer = this.oSmartFormFlex,
    oSmartForm = oSmartFormContainer && oSmartFormContainer.getItems()[0];
    if (oSmartForm && !oSmartForm.getSmartFields().some(function (oSmartField) { return oSmartField.checkClientError({ handleSuccess: true }); })) {
      if (this.oCopyCardManifest.descriptorContent["sap.card"].header.title) {
        this.oPage.setBusy(true);
        var oOriginalCard = this.oActualManifest;
        var sOriginalCardId = oOriginalCard.descriptorContent["sap.app"].id;
        var oNewCard = this.oCopyCardManifest;
        var sNewCardId = sOriginalCardId + "." + Date.now();
        var aCardList = this.aCards || [];

        this.oDraftCardParams[sNewCardId] = {};
        oNewCard = this._mergeDraftParamsIncard(oNewCard);
        oNewCard.descriptorContent["sap.app"].id = sNewCardId;
        var aVisibleCards = aCardList.filter(function (oCard) {
          return oCard.visibility;
        });
        oNewCard.descriptorContent["sap.insights"].visible = aVisibleCards.length < 10 ? true : false;
        oNewCard.visibility = aVisibleCards.length < 10 ? true : false;
        oNewCard.descriptorContent["sap.insights"].parentAppId = oOriginalCard.descriptorContent["sap.insights"].parentAppId;
        oNewCard.descriptorContent["sap.insights"].isDtCardCopy = false;
        oNewCard.descriptorContent["sap.ui5"].componentName = sNewCardId;
        var bSkipValidation = false;
        //if card is a copy of ovp card with older extension file skip validation
        if (oNewCard.descriptorContent["sap.card"] && oNewCard.descriptorContent["sap.card"].extension && oNewCard.descriptorContent["sap.card"].extension === "module:sap/insights/OVPCardExtension") {
            bSkipValidation = true;
        }
        CardHelper.getServiceAsync().then(function (oService) {
          oService._createCard(oNewCard.descriptorContent, bSkipValidation).then(function () {
            var cardTitle = oOriginalCard.descriptorContent["sap.card"].header.title;
            var msg = this.i18Bundle.getText("copyCardSuccessMsg", cardTitle);
            MessageToast.show(msg);
            this.oPage.setShowNavButton(true);
            oService._getUserAllCardModel().then(function(oUserCardModel){
              this.aCards = oUserCardModel.getProperty("/cards");
            }.bind(this));
            // Navigate Back to List Page
            this._navigateToList();
          }.bind(this)).catch(function (oError) {
            if (oError && (oError.message === '/UI2/INSIGHTS_MSG/007')) {
              MessageBox.error(this.i18Bundle.getText("INT_CARD_MAXLIMIT"));
            } else {
              MessageToast.show(oError.message);
            }
          }.bind(this)).finally(function () {
            this.oPage.setBusy(false);
          }.bind(this));
        }.bind(this));
      }
    } else {
      this.oLogger.error(this.i18Bundle.getText("cardCopyErrorMsg"));
    }
  };

    /**
     * Function to set card details to display or edit mode
     * @param {boolean} bValue if true, sets the control to edit or copy mode
     * and to display mode when bValue is false
     * @private
     * @experimental Since 1.119
     */
    CardDetails.prototype._setEditable = function (bValue) {
      this.oFlexBox.removeAllItems();
      var bV4Card;

      var oSapApp = this.oActualManifest.descriptorContent["sap.app"];
      var oDataSources = oSapApp && oSapApp.dataSources;
      var oFilterService = oDataSources && oDataSources.filterService;

      // check if its v4 card
      if (oFilterService && oFilterService.settings && oFilterService.settings.odataVersion === AppConstants.ODATA_VERSION_4) {
        bV4Card =  true;
      }
      //if not v4 card and bValue true,
      // specific check is set for V4 card as we do not support copy scenario for V4 cards
      if (bValue && !bV4Card) {
        // check if copystatic controls have been initiliased
        if (!this.oCopyVBox ) {
          this._createCopyStaticControls();
        }
        this.oInnerSaveBtn.setVisible(true);
        this.oInnerCancelBtn.setVisible(true);
        this.oInnerDeleteButton.setVisible(false);
        this.oInnerCopyBtn.setVisible(false);
        this.oFlexBox.addItem(this.oCopyTitle);
        this.oFlexBox.addItem(this.outerCopyFormVBox);
        this.oFlexBox.addItem(this.oSmartFormFlex);
        this.oFlexBox.addItem(this.oDynDate);
        this.oFlexBox.addItem(this.oDynDateFilter);
        this.oFlexBox.addItem(this.oCopyVBox);
      } else {
        this.oInnerDeleteButton.setVisible(true);
        //if already initialised then set visibility false
        if (  this.oInnerSaveBtn) {
          this.oInnerSaveBtn.setVisible(false);
          this.oInnerCancelBtn.setVisible(false);
        }

        // if smartform flexbox not present insert it
        if ( this.outerMainVBox.indexOfItem(this.oSmartFormFlex) == "-1") {
          this.outerMainVBox.insertItem(this.oSmartFormFlex, 2);
        }
        //only for v2 cards we support copy scenario and hence Copy button should be visible
        if ( this.oInnerCopyBtn) {
          if (!bV4Card) {
            this.oInnerCopyBtn.setVisible(true);
          } else {
            this.oInnerCopyBtn.setVisible(false);
          }
        }

        this.oFlexBox.addItem(this.scrollContainer);
      }
    };

    /**
     * Function to set card manifest
     * @param {Object} oManifest, we get the preview manifest (which doesn't include actions)
     * of the provided oManifest and sets this as manifest to oCopyCard if getEditable is true
     * else to oCard
     *  @private
     * @experimental Since 1.119
     */
    CardDetails.prototype._setManifest = function (oManifest) {
      if (this.getEditable()) { // if copy scenario set manifest to copycard
        this.oCopyPreview =  CardPreviewManager.getCardPreviewManifest(oManifest.descriptorContent); //getCardPreviewManifest, returns manifest without actions
        this.oCopyCard.setManifest(this.oCopyPreview);
      } else { // else set manifest to oCard
        this.oPreviewManifest = CardPreviewManager.getCardPreviewManifest(oManifest.descriptorContent); //getCardPreviewManifest, returns manifest without actions

        this.oPage.setTitle(oManifest.descriptorContent["sap.card"].header.title);
        this.oCard.setManifest(this.oPreviewManifest);
        this.oCard.setHost(this.host);
      }

      // if value updated or if in edit mode or if in display mode , check if its the different card than the previous card
      if ( oManifest.descriptorContent["sap.app"].id !== this.currentCardId || this.getEditable() || this.bValueUpdate) {
          if ( oManifest.descriptorContent["sap.card"]["type"] ===  'Analytical' ) {
              this.oOverFlowHBox.setVisible(false);
          } else {
              this.oOverFlowHBox.setVisible(true);
          }
          this._setSmartFormForCardEdit();
          //update currentcardId to latest manifest's id
          this.currentCardId = oManifest.descriptorContent["sap.app"].id;
      }
    };

     /**
     * Function to navigate to card list control
     * @private
     * @experimental Since 1.119
     */
    CardDetails.prototype._navigateToList = function () {
      this._navigateCancel();
      this.fireNavigate();
    };

    /**
    * Function to set Copy button visible
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._setCopyVisible = function () {
      var oManifest = this.oPreviewManifest;
      this.oSmartFormFlex.setVisible(false);

      if (oManifest) {
          var oCardDataSource = oManifest["sap.app"].dataSources;
          var oFilterService = oCardDataSource.filterService;
          var uri = oFilterService && oFilterService.uri;
          var oTempSettings = oFilterService && oFilterService.settings;
          if (uri && oTempSettings) {
            this.oSmartFormFlex.setVisible(true);
          }
          if (uri && oTempSettings && oManifest["sap.insights"].isDtCardCopy) {
            //if Copy button  not initialised ,do it
            if (!this.oInnerCopyBtn) {
              this.oInnerCopyBtn = new sap.m.Button( {
                text: this.i18Bundle.getText("copy"),
                press: this._navigateToCopyCard.bind(this),
                visible: true
              });
              this.oPage.insertHeaderContent(  this.oInnerCopyBtn, 1 );
            }
            this.oInnerCopyBtn.setVisible(true);
          } else if (this.oInnerCopyBtn) {
            this.oInnerCopyBtn.setVisible(false);
          }
      }
    };

    /**
    * Function to cancel all changes made during Copy mode
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._navigateCancel = function () {

      var bError;
      // check if smartform 'check' function returns any error field
      if (this.oSmartFormFlex.getItems()[0] && this.oSmartFormFlex.getItems()[0].isA('sap.ui.comp.smartform.SmartForm') && this.oSmartFormFlex.getItems()[0].getEditable()) {
        bError = this.oSmartFormFlex.getItems()[0].check().length;
      }

      // if there is error in smartform, on cancel all that changes need to be reverted. As we try to set the same smartform to editable false,
      // the smartform internally will check for error and if there is error, setting editable false will fail. Hence in such case, we recreate
      // the smartform, since without recreation the error persist in the existing smartform
      if (this.bValueUpdate && bError) {
        this.oSmartFormFlex.removeAllItems();
        this.setProperty("editable", false);
      } else {
        this.setProperty("editable", false);
        if (this.oSmartFormFlex.getItems()[0] ) {
          this.oSmartFormFlex.getItems()[0].setEditable(false);
        }
      }
      this.oPage.setShowNavButton(true);
    };

    /**
		 * Called before the control is rendered.
     */
    CardDetails.prototype.onBeforeRendering = function () {
      //actual manifest property always contain the complete manifest
      //this.oPreviewManifest contains the copy of the manifest without actions
      if (this.getManifest()) {
        this.oActualManifest = JSON.parse(this.getManifest());
        this._setManifest(this.oActualManifest);
        this._updateParentDetails(this.oActualManifest);
      }

      this.oCard.refresh();
      if (this.getEditable()) {
        this._setEditable(true);
      } else {
        this._setEditable(false);
      }
    };

     /**
		 * Called on manifestApplied of the card, used to set
     * ariatext for the card
     * @param {String} sId, prefix to be set to the current aria text of the card
     * @param {Object} oEvent oEvent
     * @private
     * @experimental Since 1.119
     */
    CardDetails.prototype._setPreviewCardAriaText = function (sId,oEvent) {
      var ariaText = oEvent.getSource()._ariaText.getText();
      var sTitle = this.i18Bundle.getText(sId);
      oEvent.getSource()._ariaText.setText(sTitle + ariaText);
    };

    /**
		* Called when user click on Copy button, used to switch the control
    * to copy scenario
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._navigateToCopyCard = function () {
        var sCardId = this.oActualManifest.descriptorContent["sap.app"].id;
        this.oPage.setShowNavButton(false);
        if (this.oDraftCardParams) {
          this.oDraftCardParams[sCardId] = {};
        }

        // check if copystatic controls have been initiliased
        if (!this.oCopyVBox ) {
          this._createCopyStaticControls();
        }
        if (!this.oInnerCancelBtn && !this.oInnerSaveBtn) {
          this.oInnerCancelBtn = new sap.m.Button( {
            text: this.i18Bundle.getText("cancelButton"),
            press: this._navigateCancel.bind(this)
          });

          this.oInnerSaveBtn = new sap.m.Button( {
            text: this.i18Bundle.getText("save"),
            press: this._handleCardSavePress.bind(this)
          });
          this.oPage.insertHeaderContent(this.oInnerSaveBtn, 2);
          this.oPage.insertHeaderContent(this.oInnerCancelBtn, 3);
       }
        this.setEditable(true);
        this.bValueUpdate = false;

        this.oCopyCardManifest = JSON.parse(JSON.stringify(this.oActualManifest));   // Deep copy original card
        this.oCopyPreview = JSON.parse(JSON.stringify(this.oPreviewManifest));
        this.oCopyCard.setManifest(this.oCopyPreview);

        this.oCopyTitleInput.setValue(this.oCopyCardManifest.descriptorContent["sap.card"].header.title);
        this.oCopySubInput.setValue(this.oCopyCardManifest.descriptorContent["sap.card"].header.subTitle);
        this.oPage.setTitle(this.i18Bundle.getText("copyCard"));
    };


    /**
		* Function to update title and subtitle of the card
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._handleCardsInputChange = function (oEvent) {
        var oInput = oEvent.getSource(),
          sValue = oInput.getValue(),
          sId = oInput.getId();
        //if no value given for title field set Error value state
        if (sId && sId.includes("copyCardsEditTitleField")) {
          if (!sValue) {
            oInput.setValueState("Error");
          } else {
            oInput.setValueState("None");
          }
          this.oCopyCardManifest.descriptorContent["sap.card"].header.title = sValue;
        } else if (sId && sId.includes("copyCardsEditSubTitleField")) {
          this.oCopyCardManifest.descriptorContent["sap.card"].header.subTitle = sValue;
        }
    };

    /**
		* Function invoked on click of Refresh action to refresh the preview of the card
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._handleCardPreviewPress = function () {
      if (this.oCopyCardManifest.descriptorContent["sap.card"].header.title) {
        var oCard = this._mergeDraftParamsIncard(this.oCopyCardManifest);

        /* Get Manifest For Preview  */
        this.oCopyPreview =  CardPreviewManager.getCardPreviewManifest(oCard.descriptorContent);
        this.oCopyCard.setManifest(this.oCopyPreview);
        this.oCopyCard.refresh();
      }
    };

    /**
		* Function to set the form of FilteredBy section of the control
    * with filter values
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._setSmartFormForCardEdit = function () {
      if (this.oActualManifest.descriptorContent && this.oActualManifest.descriptorContent && this.oActualManifest.descriptorContent["sap.app"]) {
        var oSapApp = this.oActualManifest.descriptorContent["sap.app"];
        var oDataSources = oSapApp && oSapApp.dataSources;
        var oFilterService = oDataSources && oDataSources.filterService;
        // show filteredBy section only for odata v2 version
        if (oFilterService && oFilterService.settings && oFilterService.settings.odataVersion === AppConstants.ODATA_VERSION_2) {
          var id = this.oActualManifest.descriptorContent["sap.app"].id,
          oFetchSmartFormPromise = this.oSmartFormMap[id] && !this.getEditable() && !this.bValueUpdate ? Promise.resolve(this.oSmartFormMap[id]) : this._createSmartFormForCardEdit(this.oActualManifest.descriptorContent, this.getEditable());

          oFetchSmartFormPromise.then(function (oSmartForm) {
            if (this.getEditable()) {
              oSmartForm.setEditable(true);
            } else {
              oSmartForm.setEditable(false);
            }
            var formElement =  this.oSmartFormFlex;
            formElement.removeAllItems(); //remove all items from the smartform flexbox

            var oDataSource = this.oActualManifest.descriptorContent["sap.app"].dataSources;
            oDataModelProvider.getOdataModel(oDataSource).then(function (oModel) {
              var bLoaded = oModel && oModel.loaded;
              var bVisible = false;
              if (oSmartForm.getGroups() && oSmartForm.getGroups().length && oSmartForm.getGroups()[0].getGroupElements()) {
                bVisible = oSmartForm.getGroups()[0].getGroupElements().some(function(oGroupElement){
                    return oGroupElement.getElements().some(function(oElement){
                        return oElement.getVisible();
                    });
                });
              }
              if (oSmartForm.getAggregation("content").getFormContainers().length && bLoaded && bVisible) {
                oSmartForm.setVisible(true);
                //content's layoutdata takes some time to be available in some cases , hence keeping it under a settimeout
                setTimeout(function() {
                  var oSmartFormLayout = oSmartForm.getAggregation("content").getLayout();
                  if (oSmartFormLayout) {
                      oSmartFormLayout.setBackgroundDesign("Transparent");
                  }
                  formElement.addItem(oSmartForm);
                }, 0);
              } else {
                this._setFilterTextForNoData(oSmartForm, bLoaded, true);
                formElement.addItem(oSmartForm);
              }
            }.bind(this));
          }.bind(this));
        } else if (oFilterService && oFilterService.settings && oFilterService.settings.odataVersion === AppConstants.ODATA_VERSION_4) { //if v4 manifest create a simple form
          this._createSimpleForm(this.oActualManifest.descriptorContent);
        }
      }
    };

    /**
		* Function to create simple form for filteredby section for v4 cards
    * @param {Object} oManifestCard contains manifest of the card for which filteredby Section is to be set
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._createSimpleForm = function (oManifestCard) {
        oDataModelProvider.getOdataModel(this._search(oManifestCard, "/sap.app/dataSources"))
          .then(function (oModel) {
            var oFormWrapper = this.oSmartFormFlex,
                oDescriptor = oManifestCard,
                oDataModel = oModel.oData,
                sID = this._search(oDescriptor, "/sap.app/id"),
                fnGenerateNoFilterText = function (sText) {
                  return new Text({
                    text: sText,
                    textAlign: "Center"
                  });
                };

            //Reset Form Wrapper
            oFormWrapper.removeAllItems();
            this._oSimpleForm = this._oSimpleForm || {};
            //setting transparent background design after form is rendered
            var oDelegate = {
              onAfterRendering: function() {
                // Act when the afterRendering event is fired on the element
                if (this._oSimpleForm[sID].getAggregation("form").getLayout() && this._oSimpleForm[sID].getAggregation("form").getLayout().setBackgroundDesign) {
                  this._oSimpleForm[sID].getAggregation("form").getLayout().setBackgroundDesign("Transparent");
                  this._oSimpleForm[sID].fireEvent("Rendered");
                }
              }.bind(this)
            };
            var detachFunction = function() {
              this._oSimpleForm[sID].removeEventDelegate(oDelegate);
            };
            if (!this._oSimpleForm[sID]) {
              this._oSimpleForm[sID] = new SimpleForm({
                layout: "ColumnLayout",
                editable: false,
                toolbar: new Toolbar({
                  style: "Clear",
                  content: [
                    new Title({
                      text: this.i18Bundle.getText("filterBy"),
                      titleStyle: "H5"
                    })
                  ]
                }).addStyleClass("sapThemeBaseBG-asBackgroundColor") //to make background color transparent for toolbar part as just setting backgrounddesign doesn't help in dark theme
              });

              this._oSimpleForm[sID].addEventDelegate(oDelegate);
              if (oModel.loaded) {
                Promise.all([
                  this._fetchRelevantFilters(oDescriptor, oDataModel),
                  this._fetchParameterizedFilters(oDescriptor, oDataModel)
                ])
                .then(function (aResults) {
                  var aRelevantFilters = aResults[0],
                      aParameterizedFilters = aResults[1];

                    if (aRelevantFilters.length || aParameterizedFilters.length) {
                      aParameterizedFilters.concat(aRelevantFilters).forEach(function (oFilter) {
                        this._oSimpleForm[sID].addContent(new sap.m.Label({ text: oFilter.name }));
                        this._oSimpleForm[sID].addContent(this._generateMultiValueField(oFilter.tokens));
                      }.bind(this));
                    } else {
                      //No Actual Filters
                      this._oSimpleForm[sID].addContent(fnGenerateNoFilterText(this.i18Bundle.getText("noFilterMsg")));
                    }
                    this._oSimpleForm[sID].attachEventOnce("Rendered",null, detachFunction.bind(this), this._oSimpleForm[sID]);
                    oFormWrapper.addItem(this._oSimpleForm[sID]);
                }.bind(this));
              } else {
                //No Model Loaded
                this._oSimpleForm[sID].addContent(fnGenerateNoFilterText(this.i18Bundle.getText("noFilterLoaded")));
                this._oSimpleForm[sID].attachEventOnce("Rendered",null, detachFunction.bind(this), this._oSimpleForm[sID]);
                oFormWrapper.addItem(this._oSimpleForm[sID]);
              }
            } else {
                this._oSimpleForm[sID].addEventDelegate(oDelegate);
                this._oSimpleForm[sID].attachEventOnce("Rendered",null, detachFunction.bind(this), this._oSimpleForm[sID]);
                oFormWrapper.addItem(this._oSimpleForm[sID]);
            }
          }.bind(this));
    };


    /**
		* Function to set the relevant parameters for the v4 card
    * @param {Object} oDescriptor contains manifest of the card for which to fetch the relevant parameters
    * @param {Object} oDataModel contains odata model of the card
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._fetchParameterizedFilters = function (oDescriptor, oDataModel) {
      var oConfigParams = this._search(oDescriptor, "/sap.card/configuration/parameters"),
          aRelevantParameters = this._search(oConfigParams, "/_relevantODataParameters/value") || [];

      return aRelevantParameters.reduce(function (pFetchLabel, sParamName) {
        return pFetchLabel.then(function (aFilters) {
          return V4MetadataAnalyser.getAnnotations(oDataModel, oDescriptor, sParamName, [
              "@com.sap.vocabularies.Common.v1.Label",
              "@com.sap.vocabularies.UI.v1.Hidden"
            ])
            .then(function(aAnnotations) {
              var sParamLabel = aAnnotations[0],
                  bIsHidden = aAnnotations[1],
                  sParamValue = oConfigParams[sParamName].value,
                  sParamText = oConfigParams[sParamName].label;

              if (sParamValue && !bIsHidden) {
                aFilters.push({
                  name: sParamLabel || sParamName,
                  tokens: [
                    new Token({
                      key: sParamValue,
                      text: sParamText ? sParamText : sParamValue
                    })
                  ]
                });
              }

              return Promise.resolve(aFilters);
            });
        });
      }, Promise.resolve([]));
    };

    /**
		* Function to set relevant  filters for v4 card
    * @param {Object} oDescriptor contains manifest of the card for which to fetch the relevant filters
    * @param {Object} oDataModel contains odata model of the card
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._fetchRelevantFilters = function (oDescriptor, oDataModel) {
      var oConfigParams = this._search(oDescriptor, "/sap.card/configuration/parameters"),
          aRelevantFilters = this._search(oConfigParams, "/_relevantODataFilters/value") || [];

      return aRelevantFilters.reduce(function (pFetchLabel, sFilterName) {
        return pFetchLabel.then(function (aFilters) {
          return V4MetadataAnalyser.getAnnotations(oDataModel, oDescriptor, sFilterName, [
              "@com.sap.vocabularies.Common.v1.Label",
              "@com.sap.vocabularies.UI.v1.Hidden"
            ])
            .then(function(aAnnotations) {
              var sFilterLabel = aAnnotations[0],
                  bIsHidden = aAnnotations[1],
                  sValue = oConfigParams[sFilterName].value,
                  oFilterSV = new SelectionVariant(sValue),
                  aSelectOptions = oFilterSV.getSelectOption(sFilterName);

              if (aSelectOptions.length && !bIsHidden) {
                var aTokens = SelectionVariantHelper.getTokenFromSelectOptions(aSelectOptions, sFilterName);
                aFilters.push({
                  name: sFilterLabel || sFilterName,
                  tokens: aTokens
                });
              }

              return Promise.resolve(aFilters);
            });
        });
      }, Promise.resolve([]));
    };

    /**
		* Function to create multivalue field for filters and parameters of v4 cards
    * @param {Array} aTokens contains the token value and text of the filters
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._generateMultiValueField = function (aTokens) {
      var oModel = new JSONModel(aTokens.map(function (oToken) {
        return {
          key: oToken.getKey(),
          name: oToken.getText()
        };
      }));

      var oMultiValueField = new MultiValueField({
        editMode: "Display",
        display: "Description",
        width: "100%",
        items: {
          path: "/",
          template: new MultiValueFieldItem({
            description: "{name}",
            key: "{key}"
          })
        }
      });

      oMultiValueField.setModel(oModel);
      return oMultiValueField;
    };

    /**
		* Function to get the property value from the object, shortcut for oObject[sPath]
    * @param {Object} oObject contains the original object from which a property  has to be fetched
    * @param {String} sPath contains the path at which the property value to be fetched
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._search = function (oObject, sPath) {
      return sPath ? sPath.split("/").reduce(function (oObj, sKey) { return oObj && sKey ? oObj[sKey] : oObj; }, oObject) : undefined;
    };

    /**
		* Function to show Delete card confirmation messagebox
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._handleCardDeleteConfirm = function () {
      MessageBox.show(this.i18Bundle.getText("deleteCardMsg"), {
          icon: MessageBox.Icon.WARNING,
          title: this.i18Bundle.getText("delete"),
          actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
          emphasizedAction: MessageBox.Action.DELETE,
          onClose: function (sAction) {
              if (sAction === MessageBox.Action.DELETE) {
                  this._handleCardDelete(this.currentCardPreviewPath);
              }
          }.bind(this)
      });
    };

    /**
		* Function to Delete card
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._handleCardDelete = function () {
      this.oPage.setBusy(true);
      var oCard = this.oActualManifest;
      var sCardId = oCard.descriptorContent["sap.app"].id;
      var sCardTitle = oCard.descriptorContent["sap.card"].header.title;
      this.oCardHelperServiceInstance._deleteCard(sCardId).then(function () {
          var aNewCardSet = this.aCards.filter(function (oCard) {
              return oCard.descriptorContent["sap.app"].id !== sCardId;
          });
          this.aCards = aNewCardSet;
            this.oPage.setBusy(false);
            MessageToast.show(this.i18Bundle.getText("deleteCardSuccess", sCardTitle));
            this.fireNavigate();

      }.bind(this)).catch(function (oError) {
          this.oPage.setBusy(false);
          MessageToast.show(oError.message);
      }.bind(this));
    };


    /**
		* Function to show noFilter text when no filters are available
    * @param {Object} smartForm in which noFilter Text to be shown
    * @param {Boolean} bLoaded whether oDatamodel is loaded for the card
    * @param {Boolean} bSetLayout flag to check whether Transparent backgrounddesign has to be set
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._setFilterTextForNoData = function (smartForm, bLoaded, bSetLayout) {
      CoreLib.load({name: "sap.ui.comp"})
        .then(function () {
            sap.ui.require([
                "sap/ui/comp/smartform/Group",
                "sap/ui/comp/smartform/GroupElement",
                "sap/ui/comp/smartform/Layout"
            ], function (Group, GroupElement, Layout) {
                smartForm.removeAllGroups();
                var oFilterGroup = new Group();
                var oFilterGroupElement = new GroupElement();
                var oFilterTextBox = new Text({
                    text: bLoaded ? this.i18Bundle.getText("noFilterMsg") : this.i18Bundle.getText("noFilterLoaded"),
                    textAlign: "Center"
                  });
                oFilterGroupElement.addElement(oFilterTextBox);
                oFilterGroup.addGroupElement(oFilterGroupElement);
                smartForm.setLayout(new Layout());
                smartForm.addGroup(oFilterGroup);
                if (bSetLayout) {
                  smartForm.getAggregation("content").getLayout().setBackgroundDesign("Transparent");
                }
            }.bind(this));
        }.bind(this));

    };


    /**
		* Function to merge the draft parameter values to copied card's config params on Save or Refresh
    * @param {Object} oCard the current card
    * @returns oCard with the  config params updated with draft parameters
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._mergeDraftParamsIncard = function (oCard) {
        var oCardParams = oCard.descriptorContent["sap.card"].configuration.parameters;
        var cardId = oCard.descriptorContent["sap.app"].id;
        var oParams = this.oDraftCardParams[cardId];
        Object.keys(oParams).forEach(function (sParam) {
          if (oParams[sParam]) {
            if (oCardParams[sParam]) {
              if (oCardParams[sParam].type === "datetime" && typeof (oCardParams[sParam].value) === "string" && oCardParams[sParam].value.includes("operation")) {
                var tempDateValue = JSON.parse(oCardParams[sParam].value);
                tempDateValue.operation = oParams[sParam];
                oCardParams[sParam].value = JSON.stringify(tempDateValue);
              } else {
                //for backward compatibility
                  oCardParams[sParam].value = oParams[sParam].value ? oParams[sParam].value : oParams[sParam];
                  if (oParams[sParam].label) {
                      oCardParams[sParam].label = oParams[sParam].label;
                  }
                  oCardParams[sParam].description = oParams[sParam].description;
              }
            } else if (sParam.indexOf("P_") === 0 && oCardParams[sParam.replace("P_", "")]) {
              oParams[sParam.replace("P_", "")] = oParams[sParam].replace("P_", "");
              oCardParams[sParam.replace("P_", "")].value = oParams[sParam].replace("P_", "");
              delete oParams[sParam];
            }
          }
        });
        UrlGenerateHelper.processPrivateParams( oCard, oParams);
        Object.keys(oCardParams).forEach(function(sParam){
          var paramVal = oCardParams[sParam].value;
          //if type is of datettime but value is in string format with datetime prefix, split and store the date part as value
          if (oCardParams[sParam].type === "datetime" && typeof (paramVal) === "string" && paramVal.includes("datetime")) {
            paramVal = paramVal.split("datetime");
            paramVal = paramVal[paramVal.length - 1];
            paramVal = paramVal.replace(/["']/g, "");
            oCardParams[sParam].value = paramVal;
          }
        });
        return oCard;
    };

    /**
		* Function to get options of the DynamicDateRange filter
    * @param {Object} oSemanticDateSetting contains the card config parameters' _semanticDateRangeSetting
    * @param {String} sProperty the filter name
    * @returns aDynamicDateFilters, having available set of date options for the dynamic date filter
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._getOptionsForDynamicDate = function(oSemanticDateSetting, sProperty){
        var aDynamicDateFilters;
        if (oSemanticDateSetting[sProperty]["sap:filter-restriction"] === "single-value"){
            aDynamicDateFilters = AppConstants.DATE_OPTIONS.SINGLE_OPTIONS;
        } else if (oSemanticDateSetting[sProperty]["sap:filter-restriction"] === "interval"){
            aDynamicDateFilters = AppConstants.DATE_OPTIONS.RANGE_OPTIONS;
            aDynamicDateFilters = aDynamicDateFilters.concat(AppConstants.DATE_OPTIONS.SINGLE_OPTIONS);
        }
        if (oSemanticDateSetting && oSemanticDateSetting[sProperty].exclude) {
          aDynamicDateFilters = aDynamicDateFilters.filter(function(sFilterKey) {
              return !oSemanticDateSetting[sProperty].selectedValues.includes(sFilterKey);
          });
        }
        return aDynamicDateFilters;
    };

    /**
		* attachInitialise to the all fields of the oGroupElement
    * @param {Object} oGroupElement contains the current group element
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._attachInitialiseToGroupElement = function(oGroupElement){
        if (oGroupElement.getFields() && oGroupElement.getFields().length) {
          oGroupElement.getFields()[0].attachInitialise(function () {
            // check if fields present, if field is hidden we remove field from the group element
            if (oGroupElement.getFields().length && oGroupElement.getLabelControl() && !oGroupElement.getLabelControl().getText()) {
              var sBindingPath = oGroupElement.getFields()[0].getBindingPath("value");
              //if field is visible set text label
              if (sBindingPath && oGroupElement.getFields()[0].getVisible()) {
                oGroupElement.getFields()[0].setTextLabel(sBindingPath);
              }
            }
          });
        }
    };

    /**
		* creates new Smartform which contains the filters of filteredBy section
    * @param {Object} oManifestCard contains the manifest
    * @returns a promise that resolves with a new smartform
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._createSmartFormForCardEdit = function (oManifestCard) {
        return new Promise(function (resolve) {
          Promise.all([CoreLib.load({name:"sap.ui.comp"}), CoreLib.load({name:"sap.m"})])
            .then(function () {
              sap.ui.require([
                "sap/ui/comp/smartmultiinput/SmartMultiInput",
                "sap/ui/comp/smartform/SmartForm",
                "sap/ui/comp/smartform/Group",
                "sap/ui/comp/smartform/GroupElement",
                "sap/ui/comp/smartform/Layout",
                "sap/m/Title",
                "sap/m/Toolbar"
              ], function (SmartMultiInput, SmartForm, Group, GroupElement, Layout, Title, Toolbar) {
                var oDescriptor = oManifestCard;
                var oCardParameters = oDescriptor["sap.card"].configuration.parameters;
                var sEntitySet = oDescriptor["sap.insights"].filterEntitySet;
                var sCardEntitySet = oCardParameters && oCardParameters._entitySet.value;
                var oDataSource = oDescriptor["sap.app"].dataSources;
                oDataModelProvider.getOdataModel(oDataSource).then(function (oModel) {
                  var bLoaded = oModel && oModel.loaded;
                  var oConfig = {
                    layout: new Layout({
                      labelSpanS: 6
                    }),
                    customToolbar: new Toolbar({
                      content: [
                        new Title({
                          text:  this.i18Bundle.getText("filterBy"),
                          titleStyle: "H5"
                        })
                      ],
                      style: "Clear"
                    })
                  };
                  var oSmartForm = new SmartForm(oConfig);
                  var group = new Group();
                  var aMandatoryParameters = [], aMandatoryFilters = [], aRelevantParameters = [], aRelevantFilters = [], oSemanticDateSetting, oSemanticDateRangeSetting, aSemanticDateFields = [];
                  if (oCardParameters) {
                    aMandatoryParameters =  oCardParameters._mandatoryODataParameters.value || [];
                    aMandatoryFilters = oCardParameters._mandatoryODataFilters.value || [];
                    aRelevantParameters = oCardParameters._relevantODataParameters.value || [];
                    aRelevantFilters = oCardParameters._relevantODataFilters.value || [];
                    oSemanticDateRangeSetting = oCardParameters._semanticDateRangeSetting;
                    if (oSemanticDateRangeSetting) {
                      oSemanticDateSetting = JSON.parse(oSemanticDateRangeSetting.value);
                      aSemanticDateFields = Object.keys(oSemanticDateSetting) || [];
                    }
                  }
                  oSmartForm.attachEditToggled(function (oEvent) {
                    var bEditable = oEvent.getParameters().editable;
                    var oGroup = oEvent.getSource().getGroups() && oEvent.getSource().getGroups().length ? oEvent.getSource().getGroups()[0] : null;
                    if (bEditable && oGroup) {
                      oGroup.getGroupElements().forEach(function (oGroupElem) {
                        oGroupElem.getFields().forEach(function (oField) {
                          oField.attachInnerControlsCreated(function (oControlEvent) {
                            var oSmartMultiInput = oControlEvent.getSource(),
                              sFieldPath = oSmartMultiInput.getBindingPath("value");
                              //if filter part of mandatory parameters or filters then mark them as mandatory
                            if ((aMandatoryParameters.includes(sFieldPath) || aMandatoryFilters.includes(sFieldPath)) && oSmartMultiInput.getProperty("editable")) {
                              oSmartMultiInput.setMandatory(true);
                            } else if (oSmartMultiInput.getMandatory()) {//if filter has mandatory annotation set to true but this is not a mandatory filter for the card,setMandatory to false
                              oSmartMultiInput.setMandatory(false);
                            }
                            oSmartMultiInput.checkClientError();
                          });
                        });
                      });
                    }
                  });
                  var fnAddDateInformation = function (oToken, oDate) {
                    // Store Date Information in Token as Custom Data
                    if (oDate) {
                      var oCustomData = new CustomData({
                        key: "date",
                        value: oDate
                      });
                      oToken.insertCustomData(oCustomData);
                    }
                  };
                  var sParameterisedEntitySet = oModel && MetadataAnalyser.getParameterisedEntitySetByEntitySet(oModel.oData, sEntitySet);
                  var aParameterisedEntitySetProperties = sParameterisedEntitySet ? MetadataAnalyser.getPropertyNamesOfEntitySet(oModel.oData, sParameterisedEntitySet) : [];
                  if (bLoaded) {
                    if (aRelevantParameters.length) {
                      aRelevantParameters.forEach(function (sParams) {
                        var tempEntySet = sParameterisedEntitySet;
                        var editable = true;
                        if (aParameterisedEntitySetProperties.indexOf(sParams) === -1) {
                          tempEntySet = sCardEntitySet;
                          editable = false;
                        }
                        var bIsFixedValueList = MetadataAnalyser.isValueListWithFixedValues(oModel.oData, tempEntySet, sParams);
                        var bIsDate = MetadataAnalyser.isDate(oModel.oData, tempEntySet, sParams);
                        var bIsSemanticDate = aSemanticDateFields.includes(sParams);
                        var oGroupElement = new GroupElement();
                        var oElement = new SmartMultiInput({
                          entitySet: tempEntySet,
                          value: "{" + sParams + "}",
                          editable: editable,
                          visible: editable,
                          singleTokenMode: true,
                          supportRanges: false,
                          innerControlsCreated: this._handleVisibilityChange.bind(this, bIsSemanticDate, true)
                        });
                        if (bIsFixedValueList) {
                          oElement.attachInnerControlsCreated(function (oEvent) {
                            var oField = oEvent.getSource();
                            if (oField.getMode() === "edit") {
                              var aInnerControls = oField.getInnerControls();
                              if (Array.isArray(aInnerControls) && aInnerControls.length) {
                                var aInitialTokens = oField.getAggregation("_initialTokens");
                                if (oField.getSingleTokenMode()) {
                                  //Handle Single Token Mode
                                  var oSelect = aInnerControls[0],
                                    oInitialToken = Array.isArray(aInitialTokens) && aInitialTokens.length ? aInitialTokens[0] : null;
                                  if (oSelect.setForceSelection) {
                                    oSelect.setForceSelection(false);
                                    if (oInitialToken) {
                                      oSelect.setSelectedKey(oInitialToken.getKey());
                                    } else {
                                      oSelect.setSelectedItem(null);
                                    }
                                  }
                                } else {
                                  //Handle Multi Token Mode
                                  var oMultiComboBox = aInnerControls[0];
                                  if (Array.isArray(aInitialTokens) && aInitialTokens.length) {
                                    oMultiComboBox.setSelectedKeys(aInitialTokens.map(function (oToken) {
                                      return oToken.getKey();
                                    }));
                                  }
                                }
                                if (oField.getMandatory()) {
                                  oField.checkClientError();
                                }
                              }
                            }
                          });
                          oElement.checkClientError = function(){
                            return this._checkClientError(oElement);
                          }.bind(this);
                          oElement.attachSelectionChange(this._handleParameterSelectionChange.bind(this));
                        } else {
                          if (bIsSemanticDate) {
                            oElement.addStyleClass('semanticDateInsight');
                          }
                          oElement.attachTokenUpdate(this._handleParameterTokenUpdate.bind(this, null, bIsSemanticDate));
                        }
                        var sParamValue = oCardParameters[sParams].value;
                        var sParamText =  oCardParameters[sParams].label;
                        if (sParamValue) {
                          var oToken = new Token({
                            key: sParamValue,
                            text: sParamText ? sParamText : sParamValue
                          });
                          if (bIsDate) {
                            if (!aSemanticDateFields.includes(sParams)) {
                              fnAddDateInformation(oToken, UI5Date.getInstance(sParamValue));
                            } else {
                              if (oSemanticDateSetting && this.getEditable()) {
                                var aDynamicDateFilters = this._getOptionsForDynamicDate(oSemanticDateSetting, sParams);
                                var oDynamicDate = this.oDynDate;
                                oDynamicDate.setStandardOptions(aDynamicDateFilters);
                              }
                              sParamValue =  UrlGenerateHelper.formatSemanticDateTime(sParamValue, "Parameter", oCardParameters[sParams].type )[0];
                              fnAddDateInformation(oToken, sParamValue);
                            }
                          }
                          if (bIsFixedValueList && oElement.getInnerControls().length) {
                            var oControl = oElement.getInnerControls()[0];
                            oControl.setSelectedKey(oToken.getKey());
                          }
                          oElement.addAggregation("_initialTokens", oToken);
                        }
                        if (sParamValue && oElement.getVisible()) { //show filter only if there is value in display mode
                          oGroupElement.addElement(oElement);
                          group.addGroupElement(oGroupElement);
                        } else if (this.getEditable() && oElement.getVisible()) { //in edit mode show all filters if visible
                          oGroupElement.addElement(oElement);
                          group.addGroupElement(oGroupElement);
                        }
                        this._attachInitialiseToGroupElement(oGroupElement);
                      }.bind(this));
                    }

                    var aFilterProperties = MetadataAnalyser.getPropertyNamesOfEntitySet(oModel.oData, sEntitySet);
                    aRelevantFilters.forEach(function (filter) {
                      var sFiltername = filter;
                      if (!(sFiltername === "DisplayCurrency" && aRelevantParameters.indexOf("P_DisplayCurrency") > -1)) {
                        var tempEntySet = sEntitySet;
                        var editable = true;
                        if (aFilterProperties.indexOf(sFiltername) === -1) {
                          var tempFiltername = "P_" + sFiltername;
                          if (aParameterisedEntitySetProperties.indexOf(tempFiltername) > -1) {
                            tempEntySet = sParameterisedEntitySet;
                            sFiltername = tempFiltername;
                          } else {
                            tempEntySet = sCardEntitySet;
                            editable = false;
                          }
                        }
                        var bIsFixedValueList = MetadataAnalyser.isValueListWithFixedValues(oModel.oData, tempEntySet, sFiltername);
                        var bIsDate = MetadataAnalyser.isDate(oModel.oData, tempEntySet, sFiltername);
                        var bIsSemanticDate = aSemanticDateFields.includes(sFiltername);
                        var groupElement = new GroupElement();
                        var bSingleValueRestrictionFilter;
                        if (sFiltername.indexOf("P_") === 0) {
                          bSingleValueRestrictionFilter = true;
                        } else {
                          bSingleValueRestrictionFilter = MetadataAnalyser.getPropertyFilterRestrictionByEntitySet(oModel.oData, tempEntySet, sFiltername);
                        }
                        var oElement = new SmartMultiInput({
                          entitySet: tempEntySet,
                          value: "{" + sFiltername + "}",
                          editable: editable,
                          visible: editable,
                          supportRanges: !bSingleValueRestrictionFilter,
                          singleTokenMode: bSingleValueRestrictionFilter,
                          innerControlsCreated: this._handleVisibilityChange.bind(this, bIsSemanticDate, false)
                        });
                        if (bIsFixedValueList) {
                          oElement.attachInnerControlsCreated(function (oEvent) {
                            var oField = oEvent.getSource();
                            if (oField.getMode() === "edit") {
                              var aInnerControls = oField.getInnerControls();
                              if (Array.isArray(aInnerControls) && aInnerControls.length) {
                                var aInitialTokens = oField.getAggregation("_initialTokens");
                                if (oField.getSingleTokenMode()) {
                                  //Handle Single Token Mode
                                  var oSelect = aInnerControls[0],
                                    oInitialToken = Array.isArray(aInitialTokens) && aInitialTokens.length ? aInitialTokens[0] : null;
                                  if (oSelect.setForceSelection) {
                                    oSelect.setForceSelection(false);
                                    if (oInitialToken) {
                                      oSelect.setSelectedKey(oInitialToken.getKey());
                                    } else {
                                      oSelect.setSelectedItem(null);
                                    }
                                  }
                                } else {
                                  //Handle Multi Token Mode
                                  var oMultiComboBox = aInnerControls[0];
                                  if (Array.isArray(aInitialTokens) && aInitialTokens.length) {
                                    oMultiComboBox.setSelectedKeys(aInitialTokens.map(function (oToken) {
                                      return oToken.getKey();
                                    }));
                                  }
                                }
                                if (oField.getMandatory()) {
                                  oField.checkClientError();
                                }
                              }
                            }
                          });
                          oElement.checkClientError = function(){
                            return this._checkClientError(oElement);
                          }.bind(this);
                          oElement.attachSelectionChange(this._handleFilterSelectionChange.bind(this));
                        } else {
                          if (bIsSemanticDate) {
                            oElement.setSingleTokenMode(true);
                            oElement.addStyleClass('semanticDateInsight');
                          }
                          oElement.attachTokenUpdate(this._handleFilterTokenUpdate.bind(this, null, bIsSemanticDate));
                        }
                        var filterValueSV = new SelectionVariant(oCardParameters[filter].value);
                        var aSelectOptions = filterValueSV.getSelectOption(filter);
                        if (aSelectOptions && aSelectOptions.length) {
                          var aTokens = [], aFilterRange = [];
                          aTokens = SelectionVariantHelper.getTokenFromSelectOptions(aSelectOptions, filter);
                          aTokens.forEach(function (oToken, idx) {
                            if (bIsDate) {
                              if (!aSemanticDateFields.includes(filter)) {
                                fnAddDateInformation(oToken,UI5Date.getInstance(oToken.getKey()));
                              } else {
                                  if (oSemanticDateSetting && this.getEditable()) {
                                    var aDynamicDateFilters = this._getOptionsForDynamicDate(oSemanticDateSetting, filter);
                                    var oDynamicDate = this.oDynDateFilter;
                                    oDynamicDate.setStandardOptions(aDynamicDateFilters);
                                  }
                                  aFilterRange = UrlGenerateHelper.formatSemanticDateTime(aSelectOptions[idx], "Filter", oCardParameters[filter].type);
                                  aFilterRange.forEach(function(sFilterVal){
                                    fnAddDateInformation(oToken, sFilterVal);
                                  });
                              }
                            }
                            if (bIsFixedValueList && oElement.getInnerControls().length) {
                              var oControl = oElement.getInnerControls()[0];
                              oControl.setSelectedKey(oToken.getKey());
                            }
                            oElement.addAggregation("_initialTokens", oToken);
                          }.bind(this));
                          groupElement.addElement(oElement);
                          group.addGroupElement(groupElement);
                        } else if (this.getEditable()) {
                          groupElement.addElement(oElement);
                          group.addGroupElement(groupElement);
                        }

                        this._attachInitialiseToGroupElement(groupElement);
                      }

                    }.bind(this));
                  }

                  if (group.getAggregation("formElements") && group.getAggregation("formElements").length) {
                    oSmartForm.addGroup(group);
                  }
                  var cardId = oDescriptor["sap.app"].id;
                  if (bLoaded) {
                    oSmartForm.setModel(oModel.oData);
                  }
                  this.oSmartFormMap[cardId] = oSmartForm;
                  this.bValueUpdate = false;
                  resolve(oSmartForm);
                }.bind(this));
              }.bind(this));
            }.bind(this));
        }.bind(this));
    };


    /**
		* attachSelectionChange event for parameter type filters
    * @param {Object} oEvent
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._handleParameterSelectionChange = function (oEvent) {
        var oSelectedItem = oEvent.getParameter("selectedItem");
        var oSmartMultiInput = oEvent.getSource(), sText = "";
        var oValue = {value: "", label: "", description: ""};
        if (oSelectedItem) {
          oSmartMultiInput.setValueState("None");
          sText = oSelectedItem.getText() ? oSelectedItem.getText() : oSelectedItem.getKey();
          oValue.value = oSelectedItem.getKey();
          oValue.label = sText;
        }
        oSmartMultiInput.removeAllAggregation("_initialTokens");
        oSmartMultiInput.addAggregation("_initialTokens", new Token({
          key: oValue.value,
          text: oValue.label
        }));
        var sProperty = oEvent.getSource().getBinding("value").getPath();
        var cardId = this.oActualManifest.descriptorContent["sap.app"].id;
        this.oDraftCardParams[cardId][sProperty] = oValue;
        this.bValueUpdate = true;

    };

    /**
		* _checkClientError function to check for error for mandatory paramters and filters
    * @param {Object} oElement filter for which client error is beingchecked
    * @return {Boolean} bError stating whether error is there or not
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._checkClientError = function (oElement) {
        var bNoKeySelected = oElement.getSingleTokenMode() && oElement.getInnerControls()[0] ?
          !oElement.getInnerControls()[0].getSelectedKey() :
          !oElement.getInnerControls()[0].getSelectedKeys().length,
          bIsError = oElement.getMandatory() && bNoKeySelected;
        oElement.setValueState(bIsError ? "Error" : "None");
        return bIsError;
    };


     /**
		* Function attached to token update and press event of parameter type
    * @param {Object} oSourceField , the smartMultiInput field's reference
    * @param {Boolean} bIsSemanticDate if its a semantic date field will be true and false otherwise
    * @param {Object} oEvent
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._handleParameterTokenUpdate  = function (oSourceField, bIsSemanticDate, oEvent) {
        var oSource = oSourceField ? oSourceField : oEvent.getSource();
        if (oSource.getMandatory()) {
          oSource.checkClientError();
        }
        var sProperty = oSource.getBinding("value").sPath;
        var aTokens = oSource.getTokens();
        //check if setting oCard is relevant
        var cardId = this.oActualManifest.descriptorContent["sap.app"].id;
        var oValue = { value: "", label: "", description: "" };
        var oModel = oSource.getModel();
        var bIsDate = MetadataAnalyser.isDate(oModel, oSource.getEntitySet(), sProperty);
        var sValue, oDynamicDate;
        if (bIsSemanticDate && (!aTokens.length || oSourceField)) {
          oDynamicDate =  this.oDynDate;
          this.bValueApplied = true;

          oDynamicDate.attachEventOnce("change",null, this._onSemanticParameterDateChange.bind(this, sProperty, oSource), oDynamicDate);
          oDynamicDate.openBy(oSource.getDomRef());
        }
        if (aTokens.length) {
          oValue.label = aTokens[0].getText() ? aTokens[0].getText() : aTokens[0].getKey();
          if (bIsSemanticDate && !oDynamicDate) {
            oDynamicDate =   this.oDynDate;
          }
          if (oDynamicDate &&  oDynamicDate._parseValue) {
            sValue = oDynamicDate._parseValue(aTokens[0].getKey());
            if (sValue) {
              oDynamicDate.setValue(sValue);
              oValue.value = UrlGenerateHelper.getDateRangeValue(sValue, true);
              oValue.description = JSON.stringify(sValue);
              var oLabelInfo;
              if (sProperty && sValue) {
                oLabelInfo = this._getLabelForField(oSourceField, "Parameter");
              }
              var sText = "";
              var bIsDateOperator = sValue.operator === "DATE";
              if (oLabelInfo && typeof oLabelInfo === "string") {
                sText = oLabelInfo.substring(0, oLabelInfo.indexOf("(") - 1);
                if (!sText && bIsDateOperator) {
                  sText = oLabelInfo;
                }
              }
              oValue.label = sText ? sText : sValue.operator;
            } else {
              oValue.value =  aTokens[0].getKey();
              // if value is a string
              if (Date.parse(oValue.value)) {
                oValue.value = UI5Date.getInstance(oValue.value);
              }
              oValue.description  = oDynamicDate.getValue() ? JSON.stringify( oDynamicDate.getValue()) : "";
              var aCardParams = this.oActualManifest.descriptorContent["sap.card"].configuration.parameters;
              // when user choose to change semantic date value for the first time after clicking on Copy ,dynamic date control value will be null and
              // the value from manifest configuration parameters can be used to set value in the dynamic date control
              if (!oDynamicDate.getValue() && aCardParams[sProperty] && aCardParams[sProperty].description) {
                var oDynValue;
                oValue.description =  aCardParams[sProperty].description;
                oDynValue = JSON.parse(oValue.description);
                // for these list the values are dates and not numeric values
                if (AppConstants.DATE_OPTIONS.DATE_LIST.includes(oDynValue.operator)) {
                  oDynValue.values[0] = UI5Date.getInstance(oDynValue.values[0]);
                  oValue.value = typeof aTokens[0].getKey() === "string" ? UI5Date.getInstance( aTokens[0].getKey()) : aTokens[0].getKey(); // convert to Date
                }
                oDynamicDate.setValue(oDynValue);
              } else {
                oDynamicDate.setValue(oDynamicDate.getValue());
              }
            }
          } else  {
            // if not semantic date
            sValue = oSource._parseValue && oSource._parseValue(aTokens[0].getKey());
            if (bIsDate && sValue) {
              sValue = oSource.getModel().formatValue(sValue, oSource.getDataType());
              oValue.value = sValue;
            } else if (sValue) {
              oValue.value = sValue;
            } else {
              sValue = aTokens[0].getKey();
              oValue.value = sValue;
            }
          }
        }
        this.oDraftCardParams[cardId][sProperty] = oValue;
        this.bValueUpdate = true;
    };

     /**
		* Function attached to token update and press event of filter type
    * @param {Object} oSourceField , the smartMultiInput field's reference
    * @param {Boolean} bIsSemanticDate if its a semantic date field will be true and false otherwise
    * @param {Object} oEvent
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._handleFilterTokenUpdate = function (oSourceField, bIsSemanticDate, oEvent) {
        var oSource = oSourceField ? oSourceField : oEvent.getSource();
        if (oSource.getMandatory()) {
          oSource.checkClientError();
        }
        var sProperty = oSource.getBinding("value").sPath;
        var aTokens = oSource.getTokens();
        var oManifestCard = this.oCopyCardManifest.descriptorContent;
        var cardId = oManifestCard["sap.app"].id;
        var oModel = oSource.getModel();
        var bIsDate = MetadataAnalyser.isDate(oModel, oSource.getEntitySet(), sProperty);
        var oDynamicDate, sSemanticValue = "", oCardParams, oValue = {value: "", label: "", description:""};
        oCardParams = oManifestCard["sap.card"].configuration.parameters;
        if (bIsSemanticDate && (!aTokens.length || oSourceField)) {
          oDynamicDate = this.oDynDateFilter;
          oDynamicDate.attachEventOnce("change",null, this._onSemanticFilterDateChange.bind(this, sProperty, oSource), oDynamicDate);
          this.bValueApplied = true;
          oDynamicDate.openBy(oSource.getDomRef());
          if (!aTokens.length) {
            oValue.value = SelectionVariantHelper.getEmptySVStringforProperty(sProperty);
          } else {
              sSemanticValue = oDynamicDate._parseValue(aTokens[0].getKey());
              if (sSemanticValue) {
                oDynamicDate.setValue(sSemanticValue);
              } else {
                  oValue.description  = oDynamicDate.getValue() ? JSON.stringify( oDynamicDate.getValue()) : "";
                  // when user choose to change semantic date value for the first time after clicking on Copy ,dynamic date control value will be null and
                  // the value from manifest configuration parameters can be used to set value in the dynamic date control
                  if (!oDynamicDate.getValue() && oCardParams[sProperty] && oCardParams[sProperty].description) {
                    var oDynValue;
                    oValue.description =  oCardParams[sProperty].description;
                    oValue.value = oCardParams[sProperty].value;
                    oDynValue = JSON.parse(oValue.description);
                    oDynValue.values.forEach(function(oValue, idx) {
                      if (AppConstants.DATE_OPTIONS.DATE_LIST.includes(oDynValue.operator)){
                        var oDateValue = UI5Date.getInstance(oValue);
                        // if already in standardized date format no need to convert again to local
                        if (oValue.match && !(oValue.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3})Z$/gm) &&
                            oValue.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3})Z$/gm).length)) {
                              oDynValue.values[idx] = DateTimeUtil.utcToLocal(oDateValue);
                              if (!["DATETIMERANGE", "FROMDATETIME", "TODATETIME","DATETIME"].includes(oDynValue.operator)){
                                oDynValue.values[idx] = DateTimeUtil.normalizeDate(oDynValue.values[idx], true);
                              }
                          } else {
                            oDynValue.values[idx] = oDateValue;
                          }
                      }
                    });
                  oDynamicDate.setValue(oDynValue);
                } else {
                  oDynamicDate.setValue(oDynamicDate.getValue());
                }
            }
          }
        } else if (aTokens.length) {
          var oSV = new SelectionVariant();
          var aSelectOptions = [];
          var sText = "";
          aTokens.forEach(function (oToken) {
            sText = "";
            if (oToken.data("selectOption")) {
              var oTokenSelectOption = oToken.data("selectOption");
              // in few cases oToken.data("selectOption") does not contain Text property though oToken.getText
              // has value hence adding an additional check
              if (!oTokenSelectOption.Text) {
                oTokenSelectOption.Text = oToken.getText ? oToken.getText() : null;
              }
              aSelectOptions.push(oTokenSelectOption);
            } else if (oToken.data("range")) {
              var oRange = oToken.data("range");
              var oSelectOption = SelectionVariantHelper.getSelectOptionFromRange(oRange, oToken.getText());
              aSelectOptions.push(oSelectOption);
            } else if (bIsDate) {
              var sDateValue = oModel.formatValue(oToken.getKey(), "Edm.DateTime");
              oSV.addSelectOption(sProperty, "I", "EQ", sDateValue, null, sDateValue);
            } else if (oSource._parseValue) {
              var sValue = oSource._parseValue(oToken.getKey());
              sText = oToken.getText() ? oToken.getText() : oToken.getKey();
              oSV.addSelectOption(sProperty, "I", "EQ", sValue, null, sText);
            } else {
              sText = oToken.getText() ? oToken.getText() : oToken.getKey();
              oSV.addSelectOption(sProperty, "I", "EQ", oToken.getKey(), null, sText);
            }
          });
          oSV.massAddSelectOption(sProperty, aSelectOptions);
          oValue.value = oSV.toJSONString();
        } else {
          oValue.value = SelectionVariantHelper.getEmptySVStringforProperty(sProperty);
        }
        this.oDraftCardParams[cardId][sProperty] = oValue.value ? oValue : this.oDraftCardParams[cardId][sProperty];
        this.bValueUpdate = true;
    };

    /**
		* Function triggered on innercontrolcreated event of filters to control visibility of fields
    * and its corresponding groupelements
    * @param {Object} oSourceField , the smartMultiInput field's reference
    * @param {Boolean} bIsSemanticDate if its a semantic date field will be true and false otherwise
    * @param {Boolean} bIsParameter if its parameter type or filter type, will be true if its parameter type
    * @param {Object} oEvent
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._handleVisibilityChange = function (bIsSemanticDate, bIsParameter, oEvent) {
        var oSmartMultiInput = oEvent.getSource();
        var formElement = this.oSmartFormFlex;
        var oSmartForm = formElement && formElement.getItems()[0];
        var bIsVisible = false;
        if (bIsSemanticDate && oSmartMultiInput.getMode() === "edit") {
          var oDynamicDate = bIsParameter ? this.oDynDate : this.oDynDateFilter;
          oDynamicDate.setValue(null);
          var sProperty = oSmartMultiInput.getBinding("value").sPath;
          var aInnerControls = oSmartMultiInput.getInnerControls();
          if (aInnerControls.length) {
            var oInnerMultiInput = aInnerControls[0];
            //if its a dynamic date type filter, then standard smartmultiinput valuehelp and suggestion should be set false.
            oSmartMultiInput.setShowValueHelp(false);
            oSmartMultiInput.setShowSuggestion(false);
            if (!Element.getElementById(oInnerMultiInput.getId() + "-dynamicDateIcon")) {
              //set the type of endicon as dynamicdate's icon and on click of it, dynamicdatecontrol should open
              oInnerMultiInput.addEndIcon({
                id: oInnerMultiInput.getId() + "-dynamicDateIcon",
                src: IconPool.getIconURI("check-availability"),
                press: bIsParameter ? this._handleParameterTokenUpdate.bind(this, oSmartMultiInput, true) : this._handleFilterTokenUpdate.bind(this, oSmartMultiInput, true)
              });
              oInnerMultiInput.attachLiveChange(function (){
                this.bValueApplied = true;
                oInnerMultiInput.setValue("");
                oDynamicDate.attachEventOnce("change", null,
                  bIsParameter ? this._onSemanticParameterDateChange.bind(this, sProperty, oSmartMultiInput) :
                  this._onSemanticFilterDateChange.bind(this, sProperty, oSmartMultiInput), oDynamicDate);
                oDynamicDate.openBy(oSmartMultiInput.getDomRef());
              }.bind(this));
            }
          }
        }
        setTimeout(function() {
          if (oSmartForm) {
            var oGroup = oSmartForm.getGroups() && oSmartForm.getGroups().length ? oSmartForm.getGroups()[0] : null;
            var aGroupElements = oGroup && oGroup.getGroupElements();
            if (aGroupElements && aGroupElements.length) {
              aGroupElements.forEach(function (oGroupElement) {
                var aFields = oGroupElement.getFields();
                aFields.forEach(function (oField) {
                  if (!this.getEditable() && oField.getId() === oSmartMultiInput.getId() && (oField.getTokens && oField.getTokens().length === 0)) {
                    oGroupElement.removeField(oField);
                  }
                  if (oGroupElement.getVisible() && oField.getVisible() && oField.getTokens && oField.getTokens().length) {
                    bIsVisible = true;
                  }
                }.bind(this));
                if (!oGroupElement.getFields().length) {
                  oGroup.removeGroupElement(oGroupElement);
                }
              }.bind(this));
            }
          }
          // if there are no field visible in filtered by form, then show Filtered by None message
          // formElement is same now for both display and copy scenario hence check for editable value and in case eitable is true, then
          // even if no token available for field we still display the field
          if (!bIsVisible && formElement && !this.getEditable()) {
            formElement.removeAllItems();
            this._setFilterTextForNoData(oSmartForm, true, false);
            formElement.addItem(oSmartForm);
          }
        }.bind(this), 0);
    };

    /**
    *  attachSelectionChange event for filter type config params and adds the updated value to draft params
    * @param {Object} oEvent
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._handleFilterSelectionChange = function (oEvent) {
        var oEventParams = oEvent.getParameters();
        var sProperty = oEvent.getSource().getBinding("value").getPath();
        var oManifestCard = this.oActualManifest.descriptorContent;
        var cardId = oManifestCard["sap.app"].id;
        var oSmartMultiInput = oEvent.getSource();
        var oSV = new SelectionVariant();
        var sText = "", oValue = { value:"", label:"", description:""};
        if (oEventParams.selectedItem) {
          oSmartMultiInput.setValueState("None");
          var oSelectedItem = oEvent.getParameter("selectedItem");
          if (oSelectedItem) {
            sText = oSelectedItem.getText() ? oSelectedItem.getText() : oSelectedItem.getKey();
            oSmartMultiInput.removeAllAggregation("_initialTokens");
            oSmartMultiInput.addAggregation("_initialTokens", new Token({
              key: oSelectedItem.getKey(),
              text: sText
            }));
            oSV.addSelectOption(sProperty, "I", "EQ", oSelectedItem.getKey(), null, sText);
            oValue.value = oSV.toJSONString();
          } else {
            oValue.value = SelectionVariantHelper.getEmptySVStringforProperty(sProperty);
          }
        } else {
          var aChangedItems = oEvent.getSource().getInnerControls()[0].getSelectedItems();
          if (aChangedItems.length) {
            oSmartMultiInput.setValueState("None");
            oSmartMultiInput.removeAllAggregation("_initialTokens");
            aChangedItems.forEach(function (oChangedItem) {
              sText =  oChangedItem.getText() ?  oChangedItem.getText() :  oChangedItem.getKey();
              oSmartMultiInput.addAggregation("_initialTokens", new Token({
                key: oChangedItem.getKey(),
                text: sText
              }));
              oSV.addSelectOption(sProperty, "I", "EQ", oChangedItem.getKey(), null, sText);
            });
            oValue.value = oSV.toJSONString();
          } else {
            oValue.value = SelectionVariantHelper.getEmptySVStringforProperty(sProperty);
          }
        }
        this.oDraftCardParams[cardId][sProperty] = oValue;
        this.bValueUpdate = true;

    };

    /**
    * Triggered on change of DynamicDateRange change for parameter type config params
    * @param {String} sProperty, property name of semantic date params
    * @param {String} oSourceField, source field from which event is triggered
    * @param {Object} oEvent oEvent
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._onSemanticParameterDateChange = function (sProperty, oSourceField, oEvent) {
      if (this.bValueApplied) {
        var sValue = oEvent.getParameter("value");
        var oInnerMultiInput = oSourceField.getInnerControls()[0];
        // var oManifestCard = this._oParentViewModel.getProperty("/oCard");
        var oManifestCard = this.oActualManifest.descriptorContent;
        var cardId = oManifestCard["sap.app"].id;
        var oLabelInfo;
        if (sProperty && sValue) {
          oLabelInfo = this._getLabelForField(oSourceField, "Parameter");
        }
        var sText = "";
        var bIsDateOperator = sValue.operator === "DATE";
        if (oLabelInfo && typeof oLabelInfo === "string") {
          sText = oLabelInfo.substring(0, oLabelInfo.indexOf("(") - 1);
          if (!sText && bIsDateOperator) {
            sText = oLabelInfo;
          }
        }
        if (!this.oDraftCardParams[cardId][sProperty]) {
          this.oDraftCardParams[cardId][sProperty] = {};
        }
        this.oDraftCardParams[cardId][sProperty].value = bIsDateOperator ? sValue.values[0] : sValue.operator;
        this.oDraftCardParams[cardId][sProperty].label = bIsDateOperator ? sValue.values[0] : sValue.operator;
        this.oDraftCardParams[cardId][sProperty].description = JSON.stringify(sValue);

        oInnerMultiInput.setTokens([]);
        if (sText) {
          this.oDraftCardParams[cardId][sProperty].label = sText;
        }
        var oToken = new Token({
          key: this.oDraftCardParams[cardId][sProperty].value,
          text: this.oDraftCardParams[cardId][sProperty].label
        });

        oInnerMultiInput.setTokens([oToken]);
        var bIsDateValid = oEvent.getParameter("valid");
        oSourceField.setValueState(bIsDateValid ? "None" : "Error");
        this.bValueApplied = false;
        this.bValueUpdate = true;
      }
    };

    /**
    * Triggered on change of DynamicDateRange change for filter type config params
    * @param {String} sProperty, property name of semantic date filter
    * @param {Object} oSourceField, source field from which event is triggered
    * @param {Object} oEvent
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._onSemanticFilterDateChange = function (sProperty, oSourceField, oEvent) {
         //setting this flag to prevent invokation of this function more than once
         if (this.bValueApplied) {
            var oInnerMultiInput = oSourceField.getInnerControls()[0];
            var oDynDate = oEvent.getParameter("value");
            var oLabelInfo;
            if (sProperty && oDynDate) {
              oLabelInfo = this._getLabelForField(oSourceField, "Filter");
            }
            // deep copy
            var sValue = deepClone(oDynDate);
            var oDateRangeValue = UrlGenerateHelper.getDateRangeValue(sValue, false, oLabelInfo);
            var oManifestCard = this.oActualManifest.descriptorContent;

            var cardId = oManifestCard["sap.app"].id;
            var oSelectionVariant = new SelectionVariant();
            if (!oDateRangeValue.High) {
              oDateRangeValue.High = "";
            }
            if (!this.oDraftCardParams[cardId][sProperty]) {
              this.oDraftCardParams[cardId][sProperty] = {};
            }
            oSelectionVariant.addSelectOption(sProperty, "I", oDateRangeValue.Option, oDateRangeValue.Low, oDateRangeValue.High, oDateRangeValue.Text);
            this.oDraftCardParams[cardId][sProperty].value = oSelectionVariant.toJSONString();
            this.oDraftCardParams[cardId][sProperty].description = JSON.stringify(sValue);

            oInnerMultiInput.setTokens([]);
            var aTokens = SelectionVariantHelper.getTokenFromSelectOptions(oSelectionVariant.getSelectOption(sProperty), sProperty);
            oInnerMultiInput.setTokens(aTokens);

            var bIsDateValid = oEvent.getParameter("valid");
            oSourceField.setValueState(bIsDateValid ? "None" : "Error");
            this.bValueApplied = false; //reset flag
            this.bValueUpdate = true;
          }

    };

    /**
    * Get label for dynamic date field
    * @param {Object} oSourceField, source field
    * @param {String} sType, whether its Parameter type or String type
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._getLabelForField = function (oSourceField, sType) {
      var oControl = sType === "Parameter" ? this.oDynDate : this.oDynDateFilter;
      var sIdForLabel = oControl.getIdForLabel() || "";
      sIdForLabel = sIdForLabel.substring(0, sIdForLabel.lastIndexOf("-"));

      if (sIdForLabel) {
        var sInputControl = Element.getElementById(sIdForLabel);
        return sInputControl && sInputControl.getValue();
      } else if (oControl && oControl.getProperty("value")) {
        return oControl.getProperty("value");
      } else if (oSourceField && typeof oSourceField.getTokens === 'function') {
        var aTokens = oSourceField.getTokens() || [],
            aTexts = aTokens.map(function(oToken) {
            return oToken.getText();
        });
        return { type: "filters", value: aTexts };
      }
    };


    /**
    * Function to update the parent details section
    * @param {Object} oCurrentCard, the current card whose parent details need to be fetched
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._updateParentDetails = function (oCurrentCard) {
        return CardHelper.getServiceAsync().then(function (oService) {
            oService.getParentAppDetails(oCurrentCard).then(function(oParentAppDetails) {
                if (this._getIsNavigationEnabled(oParentAppDetails)) {
                    this.parentLink.setText(oParentAppDetails.title);
                    this.otherSection.setVisible(true);
                    this.parentAppUrl = oParentAppDetails.semanticURL;
                } else {
                    this.otherSection.setVisible(false);
                }
            }.bind(this));
        }.bind(this));

    };

    /**
    * Function to navigate to the parent app
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._navigateToParentApp = function() {
        var sUrl = this.parentAppUrl;
        sap.ushell.Container.getServiceAsync("CrossApplicationNavigation").then(function (oCrossAppNavigator) {
            oCrossAppNavigator.toExternal({
                target: {
                    shellHash: sUrl
                }
            });
            this.fireNavigate();
        }.bind(this));
    };

    /**
    * Function to check if navigation is supported
    * @param {Object} oParentAppDetails, the app of which we check navigation is supported or not
    * @return resolves to true or false based on whether navigation supported or not
    * @private
    * @experimental Since 1.119
    */
    CardDetails.prototype._getIsNavigationEnabled = function(oParentAppDetails) {
        return sap.ushell.Container.getServiceAsync("CrossApplicationNavigation")
            .then(function (crossApplicationNavigationService) {
                return crossApplicationNavigationService.isNavigationSupported([{
                    target: {
                        semanticObject: oParentAppDetails.semanticObject,
                        action: oParentAppDetails.action
                    }
                }]);
            })
            .then(function(aResponses){
                return aResponses[0].supported || false;
            });
    };



    return CardDetails;

});