// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/m/FlexBox",
  "sap/f/cards/Header"

], function (UIComponent, FlexBox) {
  "use strict";

  /**
   * Component of the Search Result Widget (Component Card - UI Integration Card)
   * The Card should be registered as a visualization of the Search Result Application
   * It is reusable on any WorkPage for the standard and advanced editions of Work Zone.
   *
   * @param {string} sId Component id
   * @param {object} oParams Component parameter
   *
   * @class
   * @extends sap.ui.core.UIComponent
   *
   * @private
   *
   * @since 1.110.0
   * @alias sap.ushell.components.cepsearchresult.cards.searchresultwidget.Component
   */
  var Component = UIComponent.extend("sap.ushell.components.cepsearchresult.cards.searchresultwidget.Component", /** @lends sap.ushell.components.cepsearchresult.cards.searchresultwidget.Component */{

    onCardReady: function (oCard) {
      // Holds the card for use inside the controller
      this._oCard = oCard;
      // add a style class to identify the card root in css
      this._oCard.addStyleClass("sapCEPSearchResultCard");
      // allow access to the card parameter via model
      this._mCardParameters = oCard.getCombinedParameters();
      this._oResourceBundle = this.getModel("i18n").getResourceBundle();
      if (this._bContent) {
        this.addContent();
      }
    },

    createContent: function () {
      if (this.getAggregation("rootControl")) {
        return this.getAggregation("rootControl");
      }
      var oFlexBox = new FlexBox({
        width: "100%",
        direction: "Column"
      });
      this._bContent = true;
      if (this._oCard) {
        this.addContent();
      }
      return oFlexBox;
    },

    editionLoaded: function () {
      return new Promise(function (resolve) {
        sap.ui.require(["sap/ushell/components/cepsearchresult/app/util/Edition"], function (Edition) {
          this._oEdition = new Edition(Edition.getEditionName());
          resolve(this._oEdition.loaded());
        }.bind(this));
      }.bind(this));
    },

    search: function (sTerm) {
      this._oCategory.search(sTerm);
    },

    addContent: function () {
      this.editionLoaded().then(function () {
        this._oCategory = this.createCategory();
        this.addCategory(this.getRootControl());
        this.updateCardHeader();
        this._oCard.getModel("parameters").setProperty("/init/value", true);
      }.bind(this));
    },

    addCategory: function (oFlexBox) {
      oFlexBox.addItem(this._oCategory);
      this.search(this._mCardParameters.searchTerm);
    },

    createCategory: function () {
      var mParams = this._mCardParameters;
      var oCategory = this._oEdition.createCategoryInstance(mParams.category,
        {
          pageSize: mParams.pageSize,
          showFooter: mParams.footer !== "none",
          showHeader: false,
          initialPlaceholder: true,
          allowViewSwitch: mParams.allowViewSwitch,
          highlightResult: mParams.highlightResult,
          currentView: mParams.view || "categoryDefault",
          useIllustrations: true,
          beforeSearch: function (oEvent) {
            this.updateCardHeader(oEvent.getParameters());
            this._oCard.fireEvent("beforeSearch", oEvent.getParameters());
          }.bind(this),
          afterSearch: function (oEvent) {
            this.updateCardHeader(oEvent.getParameters());
            this._oCard.fireEvent("afterSearch", oEvent.getParameters());
          }.bind(this),
          afterRendering: function (oEvent) {
            this._oCard.fireEvent("afterRendering", oEvent.getParameters());
            if (this._mCardParameters.header !== "none") {
              oCategory.getDomRef().style.borderTop = "1px solid var(--sapUiListBorderColor)";
            }
          }.bind(this)
        }
      );

      oCategory.setFooter(mParams.footer);
      return oCategory;
    },

    updateCardHeader: function (oParameters) {
      var oHeader = this._oCard.getCardHeader(),
        oCategory = this._oCategory,
        sTitle,
        sSubtitle;
      if (this._mCardParameters.header === "default") {
        oHeader
          .setIconVisible(!!oCategory.getDefaultIcon())
          .setIconDisplayShape(oCategory._oCategoryConfig.icon.shape)
          .setIconBackgroundColor(oCategory._oCategoryConfig.icon.backgroundColor)
          .setIconSrc(oCategory.getDefaultIcon());

        sTitle = oCategory.translate("Card.Title");
        sSubtitle = this._oResourceBundle.getText(
          "CARD.List.Title.SearchResults",
          ["'" + this._mCardParameters.searchTerm + "'"]
        );
      } else {
        oHeader
          .setIconVisible(!!this._oCard.getManifestEntry("/sap.card/header/icon/src"))
          .setIconDisplayShape(this._oCard.getManifestEntry("/sap.card/header/icon/shape"))
          .setIconBackgroundColor(this._oCard.getManifestEntry("/sap.card/header/icon/backgroundColor"))
          .setIconSrc(this._oCard.getManifestEntry("/sap.card/header/icon/src"));
        sTitle = this._oCard.getManifestEntry("/sap.card/header/title");
        sSubtitle = this._oCard.getManifestEntry("/sap.card/header/subtitle");
        sTitle = sTitle.replace("($searchText)", this._mCardParameters.searchTerm);
        sSubtitle = sSubtitle.replace("($searchText)", this._mCardParameters.searchTerm);
      }

      if (!oParameters || !Number.isInteger(oParameters.count)) {
        if (this._mCardParameters.header === "custom") {
          sTitle = sTitle.replace("($count)", "--");
          sSubtitle = sSubtitle.replace("($count)", "--");
        }
        oHeader.setStatusText("");
      } else if (Number.isInteger(oParameters.count)) {
        var sStatusText = this._oResourceBundle.getText(
          "CARD.List.RowStatus",
          [
            Math.min(oParameters.skip + 1, oParameters.count),
            Math.min(oParameters.skip + oParameters.top, oParameters.count),
            oParameters.count
          ]);
        oHeader.setStatusText(oParameters.count > 0 ? sStatusText : "");
        if (this._mCardParameters.header === "default") {
          sTitle = sTitle + " (($count))";
        }
        sTitle = sTitle.replace("($count)", oParameters.count);
        sSubtitle = sSubtitle.replace("($count)", oParameters.count);
      }
      oHeader.setTitle(sTitle);
      oHeader.setSubtitle(sSubtitle);
    }
  });
  return Component;
});
