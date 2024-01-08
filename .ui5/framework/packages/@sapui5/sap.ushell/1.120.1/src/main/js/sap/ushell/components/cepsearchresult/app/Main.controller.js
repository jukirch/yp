//Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @private
 */

sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/Core",
  "sap/ui/model/json/JSONModel",
  "./util/Edition",
  "sap/m/library",
  "sap/m/Menu",
  "sap/m/MenuItem",
  "sap/ushell/ui/footerbar/AddBookmarkButton",
  "sap/f/GridContainerItemLayoutData",
  "sap/ushell/EventHub"
], function (Controller, Core, JSONModel, Edition, mLib, Menu, MenuItem, AddBookmarkButton, GridContainerItemLayoutData, EventHub) {

  "use strict";
  var URLHelper = mLib.URLHelper;
  return Controller.extend("sap.ushell.components.cepsearchresult.app.Main", {

    totalCounts: {},

    onInit: function () {
      this._sSearchTerm = "";
      this._iTotalCount = 0;
      this._oTabBar = this.byId("searchCategoriesTabs");
      this._oResourceModel = this.getView().getModel("appI18n");
      this._oCountModel = new JSONModel(this.totalCounts);
      this._oTabBar.setModel(this._oCountModel, "counts");
      this.updateTitles();
      this.applyPersonalization();
      this.getView().setVisible(false);
      this.changeEdition(Edition.getEditionName());
      if (sap.ushell.Container && sap.ushell.Container.getRenderer) {
        var oShellRenderer = sap.ushell.Container.getRenderer();
        if (oShellRenderer && oShellRenderer.getRouter && oShellRenderer.getRouter()) {
          oShellRenderer.getRouter().getRoute("wzsearch").attachMatched(this.onRouteMatched.bind(this));
        }
      }
    },

    onRouteMatched: function (oEvent) {
      var oArgs = oEvent.getParameter("arguments"),
        oQuery = oArgs["?query"],
        sQuerySearchTerm = oQuery && oQuery.searchTerm,
        sQueryCategory = oQuery && oQuery.category;
      this._oEdition.loaded().then(function () {
        if (sQuerySearchTerm !== this.getSearchTerm() &&
          sQueryCategory === this.getCategory()) {
          this.changeSearchTerm(sQuerySearchTerm);
        } else if (sQueryCategory !== this.getCategory()) {
          if (sQuerySearchTerm !== this.getSearchTerm()) {
            this._sSearchTerm = sQuerySearchTerm;
          }
          this.changeCategory(sQueryCategory);
        }
        this.getView().setVisible(true);

        // Close FESR Record - consumed in ShellAnalytics
        EventHub.emit("CloseFesrRecord", Date.now());
      }.bind(this));
    },

    changeEdition: function (sEditionName) {
      if (sEditionName === this._sEditionName) {
        return Promise.resolve();
      }
      this._sEditionName = sEditionName;
      this._oEdition = new Edition(this._sEditionName);
      return this._oEdition.loaded().then(function () {
        var oCategory = this._oEdition.getDefaultCategory();
        this._sCategory = oCategory.getKey();
        this.updateTabs();
        this.updateCategories(true);
        this.getView().setVisible(true);
      }.bind(this));
    },

    changeCategory: function (sCategory) {
      this._sCategory = sCategory;
      this.updateTabs();
    },

    changeSearchTerm: function (sSearchTerm) {
      this._sSearchTerm = sSearchTerm;
      this.updateCategories(true);
    },

    getEditionName: function () {
      return this._sEditionName;
    },

    getSearchTerm: function () {
      return this._sSearchTerm;
    },

    getCategory: function () {
      return this._sCategory;
    },

    applyPersonalization: function () {
      // Currently personalization is not saved
    },

    getPersonalization: function (sKey, vDefault) {
      //personalization service missing
      var sValue;
      if (sap.ushell.Container) {
        sValue = localStorage.getItem("sap.ushell.components.cepsearchresult.app-" + sKey);
        return Promise.resolve(sValue !== undefined ? sValue : vDefault);
      }
      sValue = localStorage.getItem("sap.ushell.components.cepsearchresult.app-" + sKey);
      return Promise.resolve(sValue !== undefined ? sValue : vDefault);
    },

    setPersonalization: function (sKey, vValue) {
      //personalization service missing
      if (sap.ushell.Container) {
        localStorage.setItem("sap.ushell.components.cepsearchresult.app-" + sKey, vValue + "");
      }
      localStorage.setItem("sap.ushell.components.cepsearchresult.app-" + sKey, vValue + "");
    },

    updateTabs: function () {
      var oTabs = this._oTabBar;
      oTabs.removeAllItems();
      this._oEdition.getAppMenuItems().map(function (oItem) {
        oTabs.addItem(oItem);
      });
      oTabs.setModel(this._oEdition.getResourceModel(), "i18n");
      oTabs.setSelectedKey(this.getCategory());
      oTabs.setVisible(oTabs.getItems().length > 2);
      this.totalCounts = {};
      this._oCountModel.setData(this.totalCounts);
      this.updateTitles();
    },

    updateCategories: function (bReset) {
      var oTabs = this._oTabBar,
        sKey = oTabs.getSelectedKey();
      oTabs.getItems().map(function (oItem) {
        var s = oItem.getKey(),
          oCategory = oItem._getCategoryInstance();
        if (bReset) {
          this.detachCategory(oCategory);
          oCategory.resetData();
        }
        if (s === sKey) {
          this.showCategory(oCategory);
        }
        oCategory.setVisible(s === sKey);
        this.updateResult(oCategory);
      }.bind(this));
    },

    tabSelectionChange: function (oEvent) {
      this.updateCategories(false);
    },

    showCategory: function (oCategory) {
      var oContentCell = this.byId("contentCell");
      oContentCell.removeAllWidgets();
      oCategory.setLayoutData(new GridContainerItemLayoutData({
        columns: 16,
        minRows: 2
      }));
      oContentCell.addWidget(oCategory);
    },

    updateTitles: function () {
      var iTotalCount = 0;
      for (var n in this.totalCounts) {
        if (n !== "all") {
          iTotalCount += this.totalCounts[n];
        }
      }
      this.totalCounts.all = iTotalCount;
      this.updateAppTitle(iTotalCount);
      this._oCountModel.checkUpdate(true, true);
    },

    updateAppTitle: function (iTotalCount) {
      var oTitle = this.byId("titleText");
      if (!oTitle) {
        return;
      }
      var sNumberText = "...",
        oResourceBundle = this._oResourceModel.getResourceBundle();
      if (Number.isInteger(iTotalCount)) {
        sNumberText = "(" + iTotalCount + ")";
      }
      oTitle.setText(
        oResourceBundle.getText(
          "SEARCHRESULTAPP.HeaderTitle",
          [this.getSearchTerm() || "", sNumberText])
      );
    },

    updateResult: function (oCategory) {
      this.attachCategory(oCategory);
      oCategory.search(this.getSearchTerm());
    },

    attachCategory: function (oCategory) {
      if (!oCategory._attached) {
        oCategory.attachAfterSearch(this.handleAfterSearch, this);
        oCategory.attachViewAll(this.handleViewAll, this);
        oCategory._attached = true;
      }
    },

    detachCategory: function (oCategory) {
      if (oCategory._attached) {
        oCategory.detachAfterSearch(this.handleAfterSearch, this);
        oCategory.detachViewAll(this.handleViewAll, this);
        oCategory._attached = false;
      }
    },

    viewAll: function (sKey, sView) {
      this._oTabBar.setSelectedKey(sKey);
      var oTabs = this._oTabBar;
      oTabs.getItems().map(function (oItem) {
        if (oItem.getKey() === sKey) {
          oItem._getCategoryInstance().setCurrentView(sView);
        }
      });
      this.updateCategories();
    },

    handleAfterSearch: function (oEvent) {
      this._oCountModel.setProperty("/" + oEvent.getParameter("category"), oEvent.getParameter("count"));
      this.updateTitles();
    },

    handleViewAll: function (oEvent) {
      this.viewAll(oEvent.getParameter("key"), oEvent.getParameter("currentView"));
    },



    onAfterRendering: function () {
      this.adaptScrollArea();
    },

    adaptScrollArea: function () {
      if (this.getView().getDomRef()) {
        var oContentArea = this.getView().getDomRef().querySelector(".sapUiCEPSRAppScroll");
        oContentArea.style.height = "calc( 100% - " + oContentArea.offsetTop + "px )";
      }
    },

    /**
     * Opens the title menu and creates the menu items once.
     * The "save as tile" menu item is currently disabled.
     * @param {*} oEvent the event from the MenuButton
     */
    openTitleMenu: function (oEvent) {
      if (!this._oTitleMenu) {
        this._oTitleMenu = new Menu({
          items: [
            new MenuItem({
              text: "{appI18n>SEARCHRESULTAPP.TitleMenu.SaveAsTile}",
              icon: "sap-icon://header",
              press: this.triggerBookmark.bind(this),
              visible: false
            }),
            new MenuItem({
              text: "{appI18n>SEARCHRESULTAPP.TitleMenu.Email}",
              icon: "sap-icon://email",
              press: this.triggerEmail.bind(this)
            })
          ]
        });
        this._oTitleMenu.setModel(this._oResourceModel, "appI18n");
      }
      this._oTitleMenu.openBy(oEvent.getSource());
    },

    /**
     * Triggers the creation of a bookmark tile to this search term via AddBookmarkButton
     * @see sap/ushell/ui/footerbar/AddBookmarkButton
     */
     triggerBookmark: function () {
       var oBundle = this._oResourceModel.getResourceBundle(),
         sSearchTerm = this.getSearchTerm(),
         oBookmark = new AddBookmarkButton({
           title: oBundle.getText("SEARCHRESULTAPP.Bookmark.Title", [sSearchTerm]),
           subtitle: "",
           tileIcon: "sap-icon://search",
           keywords: "search,result," + sSearchTerm,
           showGroupSelection: false,
           customUrl: document.location.hash
        });
      oBookmark.firePress();
    },

    /**
     * Triggers native mailto: to send the search URL via mail
     */
    triggerEmail: function () {
      var oBundle = this._oResourceModel.getResourceBundle();
      URLHelper.triggerEmail(
        "",
        oBundle.getText("SEARCHRESULTAPP.EMail.Subject", [this.getSearchTerm()]),
        document.location.href);
    },

    onExit: function () {
      var oTabs = this._oTabBar;
      oTabs.getItems().map(function (oItem) {
        var oCategory = oItem._getCategoryInstance();
        this.detachCategory(oCategory);
        oCategory.resetData();
      }.bind(this));
    }
  });
});
