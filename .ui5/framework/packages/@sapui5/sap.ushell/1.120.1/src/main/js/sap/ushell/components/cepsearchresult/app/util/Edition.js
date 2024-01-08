// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define(
  [ "sap/ui/model/resource/ResourceModel",
    "sap/m/IconTabFilter",
    "./controls/Category"
  ],
  function (ResourceModel, Tab, Category) {
    "use strict";

    var oResourceModel = new ResourceModel({
      bundleName: "sap.ushell.components.cepsearchresult.app.util.i18n.i18n"
    });

    var mEditions = {
      standard: null,
      advanced: null
    };

    var Edition = function (sEdition) {
      this._sEdition = sEdition;
      this._mCategories = {};
      if (!mEditions[sEdition]) {
        mEditions[sEdition] = new Promise(function (resolve, reject) {
          var sEditionToUpper = sEdition.charAt(0).toUpperCase() + sEdition.slice(1);
          sap.ui.require(["sap/ushell/components/cepsearchresult/app/util/Edition" + sEditionToUpper],
            function (EditionClass) {
              resolve(EditionClass);
            },
            function () {
              reject();
            }
          );
        });
      }
      this._loaded = mEditions[sEdition].then(function (EditionClass) {
        this._oConfig = EditionClass;
        // faster access to categories
        this._oConfig.categories.map(function (oCategory) {
          this._mCategories[oCategory.name] = Object.assign({}, oCategory);
        }.bind(this));
      }.bind(this));
    };

    Edition.prototype.loaded = function () {
      return this._loaded;
    };

    Edition.prototype.getConfiguration = function () {
      return this._oConfig;
    };

    Edition.prototype.getResourceModel = function () {
      return oResourceModel;
    };

    Edition.prototype.getCategoryList = function () {
      return this._oConfig.categories;
    };

    Edition.prototype.createCategoryInstance = function (sCategory, mSettings) {
      var oCategory = this._mCategories[sCategory];
      if (!oCategory.class) {
        oCategory.class = Category;
      }
      // eslint-disable-next-line new-cap
      return new oCategory.class(oCategory, this, mSettings);
    };

    Edition.prototype.getCategoryInstance = function (sCategory) {
      var oCategory = this._mCategories[sCategory];
      if (!oCategory) {
        return null;
      }
      if (oCategory.instance && !oCategory.instance.isDestroyed()) {
        return oCategory.instance;
      }
      oCategory.instance = this.createCategoryInstance(sCategory);
      return oCategory.instance;
    };

    Edition.prototype.getDefaultCategory = function () {
      var sKey = this._oConfig.defaultCategory || "all";
      return this.getCategoryInstance(sKey);
    };

    Edition.prototype.getAppMenuItems = function () {
      // the all menu item
      var aItems = [];
      // menu items that are in the all sub-categories
      if (this._mCategories.all) {
        // the all category is the leading one for apps menu
        var oItem = this.createMenuItem(this._mCategories.all);
        if (oItem) {
          aItems.push(oItem);
        }
        var aMainItems = this.getSubMenuItems(this._mCategories.all);
        if (aMainItems.length === 1) {
          return aMainItems;
        }
        return aItems.concat(this.getSubMenuItems(this._mCategories.all));
      }
      return [];
    };

    Edition.prototype.getSubMenuItems = function (oCategoryItem) {
      // menu items that are in the sub-categories of the given category
      var aItems = [];
      if (oCategoryItem && oCategoryItem.subCategories) {
        oCategoryItem.subCategories.map(function (oSubCategoryItem) {
          this.addMenuItem(this._mCategories[oSubCategoryItem.name], aItems);
        }.bind(this));
      }
      return aItems;
    };

    Edition.prototype.addMenuItem = function (oCategoryItem, aItems) {
      var oItem = this.createMenuItem(oCategoryItem);
      if (oItem) {
        aItems.push(oItem);
      }
    };

    Edition.prototype.createMenuItem = function (oCategoryItem) {
      if (oCategoryItem) {
        var aSubItems = [];
        if (oCategoryItem.name !== "all") {
          aSubItems = this.getSubMenuItems(oCategoryItem);
        }
        var oTab = new Tab({
          key: oCategoryItem.name,
          text: oCategoryItem.shortTitle,
          icon: oCategoryItem.icon.src,
          count: "{counts>/" + oCategoryItem.name + "}",
          tooltip: oCategoryItem.title,
          items: aSubItems
        });
        oTab._getCategoryInstance = function () {
          return this.getCategoryInstance(oCategoryItem.name);
        }.bind(this);
        return oTab;
      }
      return null;
    };

    Edition.getEditionName = function () {
      if (window["sap-ushell-config"] &&
        window["sap-ushell-config"].ushell &&
        window["sap-ushell-config"].ushell.cepSearchConfig) {
        return window["sap-ushell-config"].ushell.cepSearchConfig || "standard";
      }
      return "standard";
    };

    Edition.prototype.translate = function (sTranslationKey) {
      var oResourceBundle = this.getResourceModel().getResourceBundle();
      try {
        return oResourceBundle.getText(sTranslationKey);
      } catch (ex) {
        return sTranslationKey;
      }
    };

    Edition.prototype.getCategoryListItems = function () {
      var aEditionCategories = this.getCategoryList(),
        aCategories = [];
      aEditionCategories.forEach(function (o) {
        if (o.name === "all") {
          return;
        }
        aCategories.push({
          key: o.name,
          icon: o.icon.src,
          text: this.translate(o.title.substring(6, o.title.length - 1))
        });
      }.bind(this));
      return aCategories;
    };

    Edition.prototype.getCategoryViews = function (vCategory) {
      var oCategory = typeof vCategory === "string" ? this.createCategoryInstance(vCategory) : vCategory,
        oViews = oCategory.getViewSettings();
      oViews.views
        .sort(function (o1, o2) {
          if (o1.key === oViews.default) {
            return -1;
          }
          return o1.key > o2;
      }).forEach(function (oView) {
        var sKey = oView.key.charAt(0).toUpperCase() + oView.key.slice(1);
        oView.text = this.translate("CATEGORY.Views." + sKey + "ButtonText");
      }.bind(this));
      return oViews;
    };

    return Edition;

  });
