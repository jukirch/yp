// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define(
  ["../Category"],
  function (Category) {
    "use strict";
    var All = Category.extend(
      "sap.ushell.components.cepsearchresult.app.util.controls.categories.All", /** @lends sap.ushell.components.cepsearchresult.app.util.controls.categories.All.prototype */ {
      metadata: {
        aggregations: {
          _content: {
            type: "sap.ui.core.Control",
            multiple: true
          }
        }
      },
      renderer: function (rm, oControl) {
        rm.openStart("div", oControl);
        rm.class("sapUiCEPSearchCatGroup");
        rm.openEnd();
        var aContent = oControl.getAggregation("_content");
        aContent.forEach(function (oContent) {
          rm.renderControl(oContent);
        });
        rm.close("div");
      }
    });

    All.prototype.addContent = function () {
      var aSubCategories = this._oCategoryConfig.subCategories;
      aSubCategories.forEach(function (oSubCategory) {
        oSubCategory.instance = this._oEdition.createCategoryInstance(oSubCategory.name);
        oSubCategory.instance.setFooter("viewAll");
        oSubCategory.instance.setPageSize(oSubCategory.pageSize);
        oSubCategory.instance.attachBeforeSearch(function (oEvent) {
          this.fireBeforeSearch(oEvent.getParameters());
        }.bind(this));
        oSubCategory.instance.attachAfterSearch(function (oEvent) {
          this.fireAfterSearch(oEvent.getParameters());
        }.bind(this));
        oSubCategory.instance.attachItemNavigate(function (oEvent) {
          this.fireItemNavigateSearch(oEvent.getParameters());
        }.bind(this));
        oSubCategory.instance.attachViewAll(function (oEvent) {
          this.fireViewAll(oEvent.getParameters());
        }.bind(this));
        this.addAggregation("_content", oSubCategory.instance);
      }.bind(this));
    };

    All.prototype.resetData = function () {
      this.getAggregation("_content").forEach(function (oCategory) {
        oCategory.resetData();
      });
    };

    All.prototype.search = function (sSearchTerm, iSkip, iTop) {
      this.getAggregation("_content").forEach(function (oCategory) {
        oCategory.setVisible(this.getVisible());
        oCategory.search(sSearchTerm, iSkip, iTop);
      }.bind(this));
    };

    return All;
  });
