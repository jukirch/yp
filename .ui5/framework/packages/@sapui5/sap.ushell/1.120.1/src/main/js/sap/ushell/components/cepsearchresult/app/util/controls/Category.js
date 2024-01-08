// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define(
  [
    "sap/ui/core/Control",
    "sap/ui/model/json/JSONModel",
    "sap/m/Title",
    "sap/m/List",
    "sap/m/CustomListItem",
    "sap/m/FlexBox",
    "sap/m/Avatar",
    "sap/m/ObjectIdentifier",
    "sap/m/OverflowToolbar",
    "sap/m/ToolbarSpacer",
    "sap/m/Button",
    "sap/m/SegmentedButton",
    "sap/m/SegmentedButtonItem",
    "sap/m/IllustratedMessage",
    "./Paginator",
    "../appendStyleVars",
    "sap/ui/dom/includeStylesheet",
    "./Highlighter",
    "sap/ui/core/ResizeHandler",
    "sap/m/library"
    // "sap/base/util/fetch",
  ],
  function (
    Control,
    JSONModel,
    Title,
    List,
    CustomListItem,
    FlexBox,
    Avatar,
    ObjectIdentifier,
    OverflowToolbar,
    ToolbarSpacer,
    Button,
    SegmentedButton,
    SegmentedButtonItem,
    IllustratedMessage,
    Paginator,
    appendStyleVars,
    includeStylesheet,
    Highlighter,
    ResizeHandler,
    mLibrary
    // fetch
  ) {
    "use strict";
    appendStyleVars([
      "sapUiShadowLevel0",
      "sapUiElementBorderCornerRadius",
      "sapUiMarginSmall",
      "sapUiMarginMedium",
      "sapUiMarginTiny",
      "sapUiListBorderColor",
      "sapUiListBackground",
      "sapUiLink",
      "sapMFontMediumSize",
      "sapUiIndication8HoverBackground",
      "sapUiButtonCriticalBackground",
      "sapUiAccentBackgroundColor10",
      "sapUiButtonNegativeActiveBackground",
      "sapUiButtonSuccessActiveBackground",
      "sapUiButtonNeutralBackground",
      "sapUiTileBackground",
      "sapUiExtraLightBG"
    ]);

    // Include the css for the control once
    includeStylesheet(sap.ui.require.toUrl("sap/ushell/components/cepsearchresult/app/util/controls/Category.css"));

    var IllustrationType = mLibrary.IllustratedMessageType;

    var defaultItemWidths = {
      tile: 190,
      card: 400
    };

    // Fix object identifier handle press
    ObjectIdentifier.prototype._handlePress = function (oEvent) {
      var oClickedItem = oEvent.target;
      if (this.getTitleActive() && this.getDomRef().querySelector(".sapMObjectIdentifierTitle").contains(oClickedItem)) { // checking if the title is clicked
        this.fireTitlePress({
          domRef: oClickedItem
        });

        // mark the event that it is handled by the control
        oEvent.setMarked();
      }
    };

    var Category = Control.extend(
      "sap.ushell.components.cepsearchresult.app.util.controls.Category", /** @lends sap.ushell.components.cepsearchresult.app.categories.util.Category.prototype */ {
        constructor: function (mCategoryConfig, oEdition, mSettings) {
          this._oCategoryConfig = mCategoryConfig;
          this._oEdition = oEdition;
          Control.apply(this, [mSettings]);
        },
        metadata: {
          properties: {
            pageSize: {
              type: "int",
              defaultValue: 10
            },
            showHeader: {
              type: "boolean",
              defaultValue: true
            },
            showFooter: {
              type: "boolean",
              defaultValue: true
            },
            allowViewSwitch: {
              type: "boolean",
              defaultValue: true
            },
            currentView: {
              type: "string",
              defaultValue: "categoryDefault"
            },
            highlightResult: {
              type: "boolean",
              defaultValue: true
            },
            useIllustrations: {
              type: "boolean",
              defaultValue: false
            },
            initialPlaceholder: {
              type: "boolean",
              defaultValue: false
            }
          },
          aggregations: {
            _header: {
              type: "sap.ui.core.Control",
              multiple: false
            },
            _list: {
              type: "sap.ui.core.Control",
              multiple: false
            },
            _footer: {
              type: "sap.ui.core.Control",
              multiple: false
            },
            _nodata: {
              type: "sap.ui.core.Control",
              multiple: false
            }
          },
          events: {
            itemNavigate: {},
            viewAll: {},
            beforeSearch: {},
            afterSearch: {},
            afterRendering: {}
          }
        },
        renderer: function (rm, oControl) {

          rm.openStart("div", oControl);
          rm.class("sapUiCEPSearchCat");
          rm.openEnd();

          var oHeader = oControl.getAggregation("_header"),
            oList = oControl.getAggregation("_list"),
            oFooter = oControl.getAggregation("_footer"),
            oNoDataIllustration = oControl.getAggregation("_nodata");

          if (oHeader) {
            rm.renderControl(oHeader);
          }
          if (oControl.getUseIllustrations() &&
            oNoDataIllustration &&
            oNoDataIllustration.getVisible()) {
            rm.renderControl(oNoDataIllustration);
          } else if (oList) {
            rm.renderControl(oList);
          }
          if (oFooter) {
            rm.renderControl(oFooter);
          }
          rm.close("div");
        }
    });

    Category._iDataRefreshMs = 1000000000;
    Category._iCountRefreshMs = 1000000000;

    Category.CustomListItem = CustomListItem.extend("sap.ushell.components.cepsearchresult.app.util.controls.Category.CustomListItem", {
      renderer: CustomListItem.getMetadata().getRenderer()
    });

    Category.CustomListItem.prototype.onAfterRendering = function () {
      if (CustomListItem.prototype.onAfterRendering) {
        CustomListItem.prototype.onAfterRendering.apply(this, arguments);
      }
      this._activeHandling(this.$());
    };

    Category.CustomListItem.prototype._activeHandling = function ($This) {
      $This.removeClass("sapMLIBActive");
      $This.removeClass("sapMLIBActionable");
      $This.removeClass("sapMLIBHoverable");
      $This.toggleClass("sapUiCEPSearchCatLIActive", this._active);

      if (this.isActionable(true)) {
        $This.toggleClass("sapUiCEPSearchCatLIHoverable", !this._active);
      }
    };

    Category.SearchResultList = List.extend("sap.ushell.components.cepsearchresult.app.util.controls.Category.SearchResultList", {
      renderer: List.getMetadata().getRenderer()
    });

    Category.SearchResultList.prototype._getCurrentColCount = function () {
      if (this.getDomRef()) {
        var aItems = this.getDomRef().querySelectorAll(".sapMListItems > LI"),
          iCols = 1,
          iTop = aItems[0].offsetTop;
        for (var i = 1; i < aItems.length && aItems[i].offsetTop <= iTop; i++) {
          iCols++;
        }
        return iCols;
      }
    };

    Category.SearchResultList.prototype._startItemNavigation = function () {
      List.prototype._startItemNavigation.apply(this, [false]);
      if (this._oItemNavigation) {
        var aTiles = Array.from(this.getDomRef().querySelectorAll(".sapMGT"));
        if (aTiles.length > 0) {
          this._oItemNavigation.setItemDomRefs(aTiles);
        }
      }
      this._oItemNavigation.setTableMode(false, true).setColumns(this._getCurrentColCount());
    };

    Category.prototype.init = function () {
      var oResourceModel = this.getResourceModel();
      this.setModel(oResourceModel, "i18n");
      this.setModel(new JSONModel({}), "data");
      this._oResourceBundle = oResourceModel.getResourceBundle();
      this._iCurrentCount = 0;
      this._oDirty = {
        iDataFetchRequired: 0,
        iCountFetchRequired: 0
      };
      this._oNoDataIllustration = null;
      this._oErrorIllustration = null;
      this._iCurrentHeight = 0;
      this._iAfterRendering = 0;
      this._iAfterRenderingEventDelay = 60;
      this.addContent();
    };

    Category.prototype.addContent = function () {
      this.setAggregation("_header", this.createHeader());
      this.setAggregation("_list", this.createList());
      this.setAggregation("_footer", this.createFooter());
    };

    Category.prototype.getKey = function () {
      return this._oCategoryConfig.name;
    };

    Category.prototype.translate = function (sSubKey, aArgs) {
      var sCatKey = this._oCategoryConfig.translation;
      return this._oResourceBundle.getText(sCatKey + "." + sSubKey, aArgs || []);
    };

    Category.prototype.updateDataModel = function (oData) {
      this.setModel(new JSONModel(oData), "data");
    };

    Category.prototype.initialData = function (iCount) {
      var oModel = this.getModel("data");
      if (!oModel && this.getInitialPlaceholder() && this.getPlaceholderData()) {
        var aData = [];
        for (var i = 0; i < iCount; i++) {
          aData.push(this.getPlaceholderData());
        }
        this.updateDataModel({
          data: aData
        });
      }
    };

    Category.prototype.resetDataRequired = function (sSearchTerm, iSkip, iTop) {
      if (this._bResetData) {
        this._sSearchTerm = sSearchTerm;
        this._iSkip = iSkip;
        this._iTop = iTop;
        return true;
      }
      var bVisible = this.getVisible();
      if (
        this._sSearchTerm === sSearchTerm &&
        (this._iSkip === iSkip &&
        this._iTop === iTop &&
        (bVisible && this._oDirty.iDataFetchRequired > Date.now())) ||
        (!bVisible && this._oDirty.iCountFetchRequired > Date.now())
      ) {
        return false;
      }
      this._sSearchTerm = sSearchTerm;
      this._iSkip = iSkip;
      this._iTop = iTop;
      return true;
    };

    Category.prototype.resetData = function () {
      this._bResetData = true;
      this.updateDataModel({});
    };

    Category.prototype.search = function (sSearchTerm, iSkip, iTop, bForced) {
      iTop = isNaN(iTop) || iTop < 0 ? this._iTop || this.getPageSize() : iTop;
      iSkip = isNaN(iSkip) || iSkip < 0 ? this._iSkip || 0 : iSkip;
      if (typeof sSearchTerm !== "string") {
        sSearchTerm = this.getSearchTerm();
      }
      var bVisible = this.getVisible(),
        bSearchTermChanged = this._sSearchTerm !== sSearchTerm,
        pFetch,
        oCurrentData = this.getModel("data").getData() || {};

      if (!bForced && !this.resetDataRequired(sSearchTerm, iSkip, iTop)) {
        this.fireFetchEvent("before", "skipped", oCurrentData);
        this.fireFetchEvent("after", "skipped", oCurrentData);
        return;
      }

      this._iCurrentCount = 0;
      this._bResetData = false;
      this._bIsLoading = true;

      this.fireFetchEvent("before", bVisible ? "data" : "count", performance.now(), oCurrentData);

      if (bVisible) {
        this.setNoDataText(this.translate("LoadingData"), "Loading");
        this.initialData(iTop);
        this.showLoadingPlaceholder(true);
        this._oDirty.iDataFetchRequired = (Date.now() + Category._iDataRefreshMs);
        pFetch = this.fetchData(sSearchTerm, iSkip, iTop);
        pFetch = pFetch.then(this.applyDataChange.bind(this, bSearchTermChanged));
      } else {
        pFetch = this.fetchCount(sSearchTerm, iSkip, iTop);
        pFetch = pFetch.then(this.applyCount.bind(this));
      }
      this._oDirty.iCountFetchRequired = (Date.now() + Category._iCountRefreshMs);

      if (pFetch) {
        pFetch.then(function (oData) {
          this._iCurrentCount = oData.count || 0;
          setTimeout(function() {
            this.setNoDataText(this.translate("NoData"), "NoData");
          }.bind(this), 100);
          this.fireFetchEvent("after", bVisible ? "data" : "count", oData);
        }.bind(this));
      }
    };

    Category.prototype.getMaxRowItemsAsync = function () {
      if (!this.getDomRef()) {
        return new Promise(function(resolve) {
          setTimeout(function() {
            resolve(this._getMaxRowItems());
          }.bind(this), 200);
        }.bind(this));
      }
      return Promise.resolve(this._getMaxRowItems());
    };

    Category.prototype._getMaxRowItems = function () {
      if (this.getDomRef()) {
        var iPixelWidth = this.getDomRef().clientWidth;
        return Math.floor(iPixelWidth / (defaultItemWidths[this.getCurrentView()] || iPixelWidth));
      }
      return 1;
    };


    Category.prototype.applyDataChange = function (bSearchTermChanged, oResultData) {
      var oData = {
        count: oResultData.count,
        top: this.getPageSize(),
        skip: this._iSkip,
        page: Math.floor(this._iSkip / this.getPageSize()) + 1,
        data: oResultData.data
      };
      this.showLoadingPlaceholder(false, function () {
        this.updateDataModel(oData);
        this.fixHeight(bSearchTermChanged);
      }.bind(this));
      return oData;
    };

    Category.prototype.applyCount = function (oResultData) {
      var oData = {
        count: oResultData.count,
        top: this._iTop,
        skip: this._iSkip,
        page: Math.floor(this._iSkip / this._iTop) + 1,
        data: []
      };
      this.updateDataModel(oData);
      return oData;
    };

    Category.prototype.fireFetchEvent = function (sBeforeAfter, sFetchType, oResultData) {
      var oEventData = {
        count: oResultData ? oResultData.count || 0 : 0,
        category: this.getKey(),
        top: this._iTop,
        skip: this._iSkip,
        page: (this._iSkip / this._iTop) + 1,
        searchTerm: this._sSearchTerm,
        visible: this.getVisible(),
        time: performance.now(),
        fetchType: sFetchType
      };
      if (sBeforeAfter === "before") {
        this.fireBeforeSearch(oEventData);
      } else if (sBeforeAfter === "after") {
        this.fireAfterSearch(oEventData);
      }
    };

    Category.prototype.fetchData = function (sSearchTerm, iSkip, iTop) {
      return Promise.resolve({
        data: [],
        count: 0
      });
    };

    Category.prototype.fetchCount = function (sSearchTerm, iSkip, iTop) {
      return Promise.resolve({
        data: [],
        count: 0
      });
    };

    Category.prototype.showLoadingPlaceholder = function (bShow, fAfterPlaceholderHidden) {
      if (bShow) {
        if (this._iShowLoader) {
          clearTimeout(this._iShowLoader);
        }
        this._iShowLoader = setTimeout(
          function () {
            this._oList.addStyleClass("loading");
          }.bind(this), 200
        );
      } else if (this._iShowLoader) {
        clearTimeout(this._iShowLoader);
        this._iShowLoader = setTimeout(
          function () {
            this._oList.removeStyleClass("loading");
            if (fAfterPlaceholderHidden) {
              fAfterPlaceholderHidden();
            }
            this.invalidate();
            this._bIsLoading = false;
          }.bind(this), this._oList.hasStyleClass("loading") ? 100 : 0
        );
      }
    };

    Category.prototype.isLoading = function () {
      return this._bIsLoading;
    };

    Category.prototype.getPlaceholderData = function () {
      return {
        text: " ",
        description: " "
      };
    };

    Category.prototype.refreshData = function () {
      this._oDirty.iDataFetchRequired = 0;
      this.search(this.getSearchTerm(), 0, this.getPageSize());
    };

    Category.prototype.bindListViewItems = function (sView) {
      var oTemplate = this.getItemTemplate(sView);
      this._oList.addStyleClass(sView);
      this._oList.bindItems({
        path: "data>/data",
        template: oTemplate
      });
    };

    Category.prototype.setNoDataText = function (sText, sType) {
      this.updateIllustration(sText, "Hide");
      if (this._oList && !this.bPaging) {
        this._oList.setNoDataText(" ");
        this.updateIllustration(sText, sType);
        this._oList.setNoDataText(sText);
      }
    };

    Category.prototype.getItemTemplate = function (sView) {
      var oTemplate = null;
      switch (sView) {
        case "card": oTemplate = this.createCardItemTemplate(); break;
        case "tile": oTemplate = this.createTileItemTemplate(); break;
        default: oTemplate = this.createListItemTemplate();
      }
      return oTemplate.addStyleClass("sapUiCEPSearchCatLI " + sView + " " + this.getKey());
    };

    Category.prototype.setFooter = function (sType) {
      if (sType === "viewAll") {
        this.setAggregation("_footer", this.createFooter(sType));
      }
    };

    Category.prototype.createHeader = function () {
      this._oHeader = new OverflowToolbar({
        content: [
          new ToolbarSpacer({ width: ".5rem" }),
          this.createTitle(),
          this.createCounter(),
          new ToolbarSpacer(),
          this.createViewButtons(),
          new ToolbarSpacer({ width: "1rem" })
        ]
      }).addStyleClass("sapUiCEPSearchCatHeaderTB");
      return this._oHeader;
    };

    Category.prototype.getPaginatorSettings = function () {
      return {
        visible: true,
        count: "{= ${data>/count}}",
        pageSize: "{= ${data>/top}}",
        currentPage: "{= ${data>/page}}",
        selectPage: function (oEvent) {

          this.fixHeight();
          this.bPaging = true;
          this.search(
            this.getSearchTerm(),
            oEvent.getParameter("startIndex"),
            oEvent.getParameter("pageSize")
          );
          this.bPaging = false;
        }.bind(this)
      };
    };

    Category.prototype.getSearchTerm = function () {
      return this._sSearchTerm || "";
    };

    Category.prototype.getResultCount = function () {
      this.getModel("data").getProperty("/count");
    };

    Category.prototype.getResourceModel = function () {
      return this._oEdition.getResourceModel();
    };

    Category.prototype.getViewSettings = function () {
      return {
        views: [
          {
            key: "list",
            icon: "sap-icon://text-align-justified"
          },
          {
            key: "card",
            icon: "sap-icon://business-card"
          }
        ],
        default: "list"
      };
    };

    Category.prototype.getDefaultIcon = function () {
      return this._oCategoryConfig.icon.src;
    };

    Category.prototype.getCurrentView = function () {
      var sCurrentView = this.getProperty("currentView");
      if (sCurrentView === "categoryDefault") {
        this.setProperty("currentView", this.getViewSettings().default);
        return this.getViewSettings().default;
      }
      return sCurrentView;
    };

    Category.prototype.setShowHeader = function (bShow) {
      this._oHeader.setVisible(bShow);
      this._oList.removeStyleClass("noheader");
      if (!bShow) {
        this._oList.addStyleClass("noheader");
      }
      return this.setProperty("showHeader", bShow);
    };

    Category.prototype.setShowFooter = function (bShow) {
      this.getAggregation("_footer").setVisible(bShow);
      return this.setProperty("showFooter", bShow);
    };

    Category.prototype.setAllowViewSwitch = function (bShow) {
      this._oViewSwitch.setVisible(bShow && this._oViewSwitch.getItems().length > 1);
      return this.setProperty("allowViewSwitch", bShow);
    };

    Category.prototype.setCurrentView = function (sView) {
      var sPreviousView = this.getCurrentView();
      if (sPreviousView !== sView) {
        this._oList.unbindItems();
        this.setProperty("currentView", sView);
        sView = this.getCurrentView();
        this._oViewSwitch.setSelectedKey(sView);
        this._oList.removeStyleClass(sPreviousView);
        this.bindListViewItems(sView);
        this._oList.addStyleClass(sView);
        this._iCurrentHeight = 0;
        this.search(this._sSearchTerm, this._iSkip, this.iTop, true);
      }
      return this;
    };

    Category.prototype.setPageSize = function (iValue) {
      this.setProperty("pageSize", iValue);
      if (this.getDomRef()) {
        this.refreshData();
      }
      return this;
    };

    Category.prototype.createCounter = function () {
      return new Title({
        text: "{= isNaN(${data>/count}) ? '...' : '('+ ${data>/count} + ')'}",
        level: "H4"
      });
    };

    Category.prototype.createTitle = function () {
      this._oTitle = new Title({
        text: this._oCategoryConfig.title,
        level: "H4"
      });
      return this._oTitle;
    };

    Category.prototype.createList = function () {
      this._oList = new Category.SearchResultList({
        inset: false,
        noDataText: " ",
        growingThreshold: this.getPageSize()
      });
      this._oList.addStyleClass("sapUiCEPSearchCatList");
      this.bindListViewItems(this.getCurrentView());
      return this._oList;
    };

    Category.prototype.createViewButtons = function () {
      var oViewSettings = this.getViewSettings();
      var aItems = oViewSettings.views.map(function (oView) {
        var sKey = oView.key.charAt(0).toUpperCase() + oView.key.slice(1);
        oView.tooltip = "{i18n>CATEGORY.Views." + sKey + "ButtonTooltip}";
        return new SegmentedButtonItem(oView);
      });
      this._oViewSwitch = new SegmentedButton({
        selectedKey: this.getCurrentView(),
        visible: aItems.length > 1,
        items: aItems,
        selectionChange: function (oEvent) {
          var oItem = oEvent.getParameter("item");
          this.setCurrentView(oItem.getKey());
        }.bind(this)
      });
      return this._oViewSwitch;
    };

    Category.prototype.createDefaultItemTemplate = function () {
      var oListItem = new Category.CustomListItem({
        press: this.itemNavigate.bind(this),
        type: "Active",
        content: [
          new FlexBox({
            direction: "Column",
            items: [
              new FlexBox({
                direction: "Row",
                items: [
                  new Avatar(this.getItemAvatarSettings())
                    .addStyleClass("sapUiSmallMarginBegin"),
                  new ObjectIdentifier(this.getItemObjectIdentifierSettings())
                    .addStyleClass("sapUiSmallMarginBeginEnd")
                ]
              })
            ]
          })
        ]
      });
      return oListItem;
    };

    Category.prototype.getItemObjectIdentifierSettings = function () {
      return {
        text: "{data>description}",
        title: "{data>title}",
        titleActive: "{= !!${data>_navigation} || !!${data>url}}",
        titlePress: this.itemNavigate.bind(this)
      };
    };

    Category.prototype.getItemAvatarSettings = function (sIconBinding) {
      return {
        fallbackIcon: this._oCategoryConfig.icon.src,
        src: sIconBinding || "{data>icon}",
        displaySize: this._oCategoryConfig.icon.size,
        displayShape: this._oCategoryConfig.icon.shape,
        imageFitType: this._oCategoryConfig.icon.imageFitType || "Contain",
        backgroundColor: this._oCategoryConfig.icon.backgroundColor
      };
    };

    Category.prototype.createListItemTemplate = function () {
      return this.createDefaultItemTemplate().addStyleClass("list");
    };

    Category.prototype.createCardItemTemplate = function () {
      return this.createListItemTemplate().addStyleClass("card");
    };

    Category.prototype.createTileItemTemplate = function () {
      return this.createListItemTemplate().addStyleClass("tile");
    };

    Category.prototype.createFooter = function (sType) {
      if (sType === "viewAll") {
        this._oFooter = new OverflowToolbar({
          style: "Clear",
          content: [
            new ToolbarSpacer(),
            new Button({
              text: "{i18n>CATEGORIES.All.ViewAll}",
              press: function () {
                this.fireViewAll({
                  key: this.getKey(),
                  currentView: this.getCurrentView()
                });
              }.bind(this)
            }),
            new ToolbarSpacer({ width: "1rem" })
          ]
        }).addStyleClass("sapCEPCategoryFooterTB");
      } else {
        this._oFooter = new OverflowToolbar({
          style: "Clear",
          content: [
            new ToolbarSpacer(),
            new Paginator(this.getPaginatorSettings())
          ]
        }).addStyleClass("sapCEPCategoryFooterTB");
      }
      return this._oFooter;
    };

    Category.prototype.itemNavigate = function (oEvent) {
    };

    Category.prototype.updateIllustration = function (sText, sType) {
      if (!this.getUseIllustrations()) {
        return;
      }
      if (!this._oNoDataIllustration) {
        this._oNoDataIllustration = new IllustratedMessage({
          illustrationType: IllustrationType.SimpleNotFoundMagnifier,
          enableDefaultTitleAndDescription: false,
          illustrationSize: "Spot",
          additionalContent: [new Button({
            text: this._oResourceBundle.getText("CATEGORY.Views.RefreshButton"),
            visible: false,
            press: function () {
              this.fixHeight();
              setTimeout(function () {
                this.refreshData();
              }.bind(this), 600);
              this.updateIllustration(this.translate("LoadingData"), "Loading");
            }.bind(this)
          })]
        });
      }
      if (this._iCurrentCount === 0) {
        if (sType === "NoData") {
          if (this._iCurrentCount === 0) {
            this._oNoDataIllustration.setTitle(sText);
            this._oNoDataIllustration.setIllustrationType(IllustrationType.SimpleNotFoundMagnifier);
            this.setAggregation("_nodata", this._oNoDataIllustration);
            this._oNoDataIllustration.getAdditionalContent()[0].setVisible(true);
          }
        } else if (sType === "Loading") {
          if (this._iCurrentCount === 0) {
            this._oNoDataIllustration.setTitle(sText);
            this._oNoDataIllustration.setIllustrationType(IllustrationType.SimpleNotFoundMagnifier);
            this.setAggregation("_nodata", this._oNoDataIllustration);
            this._oNoDataIllustration.getAdditionalContent()[0].setVisible(false);
          }
        }
      } else {
        this.setAggregation("_nodata", null);
      }
    };

    Category.prototype.fixHeight = function (bReset) {
      if (!this.getDomRef()) {
        return;
      }
      if (bReset) {
        this.getDomRef().style.setProperty("--tmpPageSize", "unset");
        this._iCurrentHeight = 0;
        return;
      }
      if (this._oList && this._oList.getVisible() && this._oList.getDomRef()) {
        this._iCurrentHeight = Math.max(this._oList.getDomRef().offsetHeight, this._iCurrentHeight);
      }
      if (this._iCurrentHeight) {
        this.getDomRef().style.setProperty("--tmpPageSize", this._iCurrentHeight + "px");
      }
    };

    Category.prototype.onResize = function (oEvent) {
      if (this._oList && this._oList._oItemNavigation) {
        this._oList._oItemNavigation.setColumns(this._oList._getCurrentColCount());
      }
      this.fixHeight(true);
      if (Math.abs(oEvent.oldSize.width - oEvent.size.width) > 50) {
        if (this._iResizeTimer) {
          clearTimeout(this._iResizeTimer);
        }
        this._iResizeTimer = setTimeout(function() {
          this.search(this._sSearchTerm, this._iSkip, this._iTop);
        }.bind(this), 300);
      }
      if (oEvent.oldSize && oEvent.size && oEvent.oldSize.width !== oEvent.size.width) {
        this._iCurrentHeight = 0;
      }
    };

    Category.prototype.onBeforeRendering = function () {
      if (this._oHighlighter) {
        this._oHighlighter.destroy();
      }
      this._oHighlighter = null;
      if (this._iResizeListenerId) {
        ResizeHandler.deregister(this._iResizeListenerId);
        this._iResizeListenerId = null;
      }
    };

    Category.prototype.onAfterRendering = function () {
      if (!this._iResizeListenerId) {
        this._fnResizeListener = this.onResize.bind(this);
        this._iResizeListenerId = ResizeHandler.register(this, this._fnResizeListener);
      }
      if (!this._oHighlighter && this.getHighlightResult()) {
        this._oHighlighter = new Highlighter(this.getDomRef(), {
          isCaseSensitive: false,
          shouldBeObserved: true,
          querySelector: ".sapUiCEPSearchCatLI"
        });
        this._oHighlighter.highlight(this.getSearchTerm());
      }
      this.fixHeight();
      if (this._iAfterRendering) {
        clearTimeout(this._iAfterRendering);
      }
      this._iAfterRendering = setTimeout(
        function () {
          this.fireAfterRendering.bind(this)();
          this._iAfterRendering = null;
        }.bind(this), this._iAfterRenderingEventDelay
      );
    };

    return Category;

  });
