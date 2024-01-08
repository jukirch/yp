// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define(
  [
    "../Category",
    "sap/ushell/services/VisualizationInstantiation",
    "sap/ui/thirdparty/jquery"
  ],
  function (
    Category,
    VisualizationInstantiation,
    jQuery
  ) {
    "use strict";
    var Application = Category.extend(
      "sap.ushell.components.cepsearchresult.app.util.controls.categories.Application", /** @lends sap.ushell.components.cepsearchresult.app.util.controls.categories.Application.prototype */ {
      renderer: Category.getMetadata().getRenderer()
    }
    );

    var oInstanceFactory = new VisualizationInstantiation();
    var iTileActivationTime = 500;

    Application.prototype.getViewSettings = function () {
      return {
        views: [
          {
            key: "list",
            icon: "sap-icon://text-align-justified"
          },
          {
            key: "tile",
            icon: "sap-icon://grid"
          }
        ],
        default: "tile"
      };
    };

    Application.prototype.createListItemTemplate = function () {
      var oListItem = Category.prototype.createListItemTemplate.apply(this);
      oListItem.attachModelContextChange(this.addTile.bind(this));
      return oListItem;
    };

    Application.prototype.createCardItemTemplate = function () {
      var oListItem = Category.prototype.createListItemTemplate.apply(this);
      oListItem.attachModelContextChange(this.addTile.bind(this));
      return oListItem;
    };

    Application.prototype.createTileItemTemplate = function () {
      var oListItem = new Category.CustomListItem({});
      oListItem.attachModelContextChange(this.addTile.bind(this));
      return oListItem;
    };

    Application.prototype.addTile = function (oEvent) {
      var oItem = oEvent.getSource();
      if (oItem.getBindingContext("data")) {
        var oContextData = oItem.getBindingContext("data").getObject(),
          oVizData = oContextData.visualization;
        if (!oVizData) {
          return;
        }
        if (oItem._oViz) {
          oItem._oViz.destroy();
        }
        var oViz = oInstanceFactory.instantiateVisualization(oVizData);
        oViz.addStyleClass(oVizData.displayFormatHint);
        oItem._oViz = oViz;
        if (this.getCurrentView() === "tile") {
          oItem.destroyContent();
          oItem.addContent(oViz);
          this.activateTile(oViz, true, iTileActivationTime);
        } else {
          // render a hidden tile to trigger event in itemNavigate
          oItem.addContent(oViz.addStyleClass("hiddentile"));
        }
      }
    };

    Application.prototype.activateTile = function (oViz, bActivate, iTime) {
      setTimeout(function () {
        if (sap.ushell.Container) {
          sap.ushell.Container.getServiceAsync("ReferenceResolver").then(function () {
            oViz.setActive(bActivate, false);
            this.activateTile(oViz, false, 1000);
          }.bind(this));
        }
      }.bind(this), iTime);
    };

    Application.prototype.itemNavigate = function (oEvent) {
      if (this.isLoading()) {
        return;
      }
      var oItem = oEvent.getSource();
      if (oItem.isA("sap.m.ObjectIdentifier")) {
        oItem = oItem.getParent().getParent().getParent();
      }
      // trigger a tap event on the hidden tile
      jQuery(oItem._oViz.getDomRef().querySelector("a")).trigger("tap");
    };

    Application.prototype._getSearchParameters = function (sSearchTerm, iSkip, iTop) {
      return {
        includeAppsWithoutVisualizations: false,
        enableVisualizationPreview: false,
        searchTerm: sSearchTerm,
        skip: iSkip,
        top: iTop,
        filter: {
          filters: [
            {
              path: "technicalAttributes",
              operator: "NotContains",
              value1: "APPTYPE_SEARCHAPP"
            },
            {
              path: "technicalAttributes",
              operator: "NotContains",
              value1: "APPTYPE_HOMEPAGE"
            }
          ],
          and: true
        },
        sort: {
          path: "title",
          descending: false
        }
      };
    };

    Application.prototype.fetchData = function (sSearchTerm, iSkip, iTop) {
      return this.getMaxRowItemsAsync().then(function (iMaxRowItems) {
        var iMaxTop = Math.ceil(iTop / iMaxRowItems) * iMaxRowItems;
        return this.getData(this._getSearchParameters(sSearchTerm, iSkip, iMaxTop)).then(function(oData) {
          var aData = oData.data;
          aData.forEach(function (o, i) {
            if (aData.length > iTop && o.visualization.displayFormatHint === "standardWide") {
              aData.pop();
            }
          });
          oData.pageGap = aData.length - iTop;
          return oData;
        });
      }.bind(this));
    };

    Application.prototype.fetchCount = function (sSearchTerm, iSkip, iTop) {
      return this.getData(this._getSearchParameters(sSearchTerm, iSkip, iTop));
    };

    Application.prototype.getPlaceholderData = function () {
      return {
        title: new Array(10).join("\u00A0"),
        description: new Array(35).join("\u00A0"),
        keywords: "",
        icon: "sap-icon://person-placeholder",
        label: new Array(17).join("\u00A0"),
        url: ""
      };
    };


    Application.prototype.getData = function (oSearchParameters) {
      var oResult = {
        data: [],
        count: 0
      };
      // embedded in flp
      if (sap.ushell.Container && sap.ushell.Container.getServiceAsync) {
        return sap.ushell.Container.getServiceAsync("SearchCEP")
          .then(function (oSearchCEPService) {
            return oSearchCEPService.search(oSearchParameters);
          });
      }
      return Promise.resolve(oResult);
    };
    return Application;
  });
