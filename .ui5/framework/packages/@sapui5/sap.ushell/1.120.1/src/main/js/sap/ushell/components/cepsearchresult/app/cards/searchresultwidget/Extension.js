// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
  "sap/ui/integration/Extension"
], function (Extension) {

  "use strict";

  var DTExtension = Extension.extend("sap.ushell.components.cepsearchresult.cards.searchresultwidget.Extension");

  DTExtension.prototype.onCardReady = function () {
    this._oCard = this.getCard();
  };

  DTExtension.prototype.editionLoaded = function () {
    this.oCard = this.getCard();
    return new Promise(function (resolve) {
      sap.ui.require(["sap/ushell/components/cepsearchresult/app/util/Edition"], function (Edition) {
        this._oEdition = new Edition(Edition.getEditionName());
        this._oEdition.loaded().then(function () {
          resolve();
        });
      }.bind(this));
    }.bind(this));
  };

  DTExtension.prototype.getCategoryListItems = function () {
    return this.editionLoaded().then(function () {
      return this._oEdition.getCategoryListItems();
    }.bind(this));
  };

  DTExtension.prototype.getCategoryViews = function (sCategoryKey) {
    return this.editionLoaded().then(function () {
      return this._oEdition.getCategoryViews(sCategoryKey);
    }.bind(this));
  };

  return DTExtension;
});
