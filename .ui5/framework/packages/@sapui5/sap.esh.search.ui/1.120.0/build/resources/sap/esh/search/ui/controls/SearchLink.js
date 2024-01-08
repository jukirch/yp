/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["sap/esh/search/ui/SearchHelper", "sap/ui/core/Icon", "sap/m/Link", "../sinaNexTS/sina/NavigationTarget"], function (SearchHelper, Icon, Link, ___sinaNexTS_sina_NavigationTarget) {
  var NavigationTarget = ___sinaNexTS_sina_NavigationTarget["NavigationTarget"];
  /**
   * @namespace sap.esh.search.ui.controls
   */
  var SearchLink = Link.extend("sap.esh.search.ui.controls.SearchLink", {
    renderer: {
      apiVersion: 2
    },
    metadata: {
      properties: {
        navigationTarget: {
          type: "object",
          group: "Data"
        }
      },
      aggregations: {
        icon: {
          type: "sap.ui.core.Icon",
          multiple: false
        }
      }
    },
    constructor: function _constructor(sId, settings) {
      Link.prototype.constructor.call(this, sId, settings);
      this._pressHandlerAttached = false;
    },
    pressHandlerSearchLink: function _pressHandlerSearchLink(oEvent) {
      var navTarget = this.getNavigationTarget();
      if (navTarget.targetUrl) {
        // 1) navigation target has target url
        // - navigation itself is performed by clicking on <a> tag
        // - performNavigation is just called for tracking
        navTarget.performNavigation({
          trackingOnly: true,
          event: oEvent
        });
      } else {
        // 2) no target url instead there is a js target function
        // performNavigation does tracking + navigation (window.open...)
        oEvent.preventDefault(); // really necessary?
        navTarget.performNavigation({
          event: oEvent
        });
      }
      // oEvent.preventDefault does work for
      // -desktop
      // -mobile in case targetUrl=empty
      // oEvent.preventDefault does not work for mobile in case targetUrl is filled
      // reason: for mobile there is a UI5 async event simulation so preventDefault does not work
      // for sap.m.Link this a special logic which makes preventDefault working for mobile in case
      // targetUrl=empty (href='#')
    },

    setNavigationTarget: function _setNavigationTarget(navigationTarget) {
      var _navigationTarget$tar;
      this.setProperty("navigationTarget", navigationTarget);

      // calculate enabled
      var text = this.getText();
      if ((typeof (navigationTarget === null || navigationTarget === void 0 ? void 0 : navigationTarget.targetUrl) !== "string" || (navigationTarget === null || navigationTarget === void 0 ? void 0 : (_navigationTarget$tar = navigationTarget.targetUrl) === null || _navigationTarget$tar === void 0 ? void 0 : _navigationTarget$tar.length) === 0) && typeof (navigationTarget === null || navigationTarget === void 0 ? void 0 : navigationTarget.targetFunction) !== "function" || !(typeof text === "string" && text !== "–")) {
        this.setProperty("enabled", false);
      } else {
        this.setProperty("enabled", true);
      }

      // set href
      var navigationTargetHref = navigationTarget === null || navigationTarget === void 0 ? void 0 : navigationTarget.targetUrl;
      if (typeof navigationTargetHref === "string" && (navigationTargetHref === null || navigationTargetHref === void 0 ? void 0 : navigationTargetHref.length) > 0) {
        this.setProperty("href", navigationTargetHref);
      } else {
        this.setProperty("href", "");
      }

      // set target
      var navigationTargetTarget = navigationTarget === null || navigationTarget === void 0 ? void 0 : navigationTarget.target;
      if (typeof navigationTargetTarget === "string" && (navigationTargetTarget === null || navigationTargetTarget === void 0 ? void 0 : navigationTargetTarget.length) > 0) {
        this.setProperty("target", navigationTargetTarget);
      } else {
        this.setProperty("target", "_self");
      }

      // set icon
      var navigationTargetIcon = navigationTarget === null || navigationTarget === void 0 ? void 0 : navigationTarget.icon;
      if (!(this.getAggregation("icon") instanceof Icon) && typeof navigationTargetIcon === "string" && (navigationTargetIcon === null || navigationTargetIcon === void 0 ? void 0 : navigationTargetIcon.length) > 0) {
        this.setAggregation("icon", new Icon("", {
          src: navigationTargetIcon
        }));
      }

      // set icon
      var navigationTargetTooltip = navigationTarget === null || navigationTarget === void 0 ? void 0 : navigationTarget.tooltip;
      if (!this.getTooltip() && typeof navigationTargetTooltip === "string" && (navigationTargetTooltip === null || navigationTargetTooltip === void 0 ? void 0 : navigationTargetTooltip.length) > 0) {
        this.setTooltip(navigationTargetTooltip);
      }
      return this;
    },
    setText: function _setText(sText) {
      var _navigationTarget$tar2;
      this.setProperty("text", sText);
      var navigationTarget = this.getNavigationTarget();
      if (!(navigationTarget instanceof NavigationTarget)) {
        return this;
      }
      if ((typeof (navigationTarget === null || navigationTarget === void 0 ? void 0 : navigationTarget.targetUrl) !== "string" || (navigationTarget === null || navigationTarget === void 0 ? void 0 : (_navigationTarget$tar2 = navigationTarget.targetUrl) === null || _navigationTarget$tar2 === void 0 ? void 0 : _navigationTarget$tar2.length) === 0) && typeof (navigationTarget === null || navigationTarget === void 0 ? void 0 : navigationTarget.targetFunction) !== "function" || !(typeof sText === "string" && sText !== "–")) {
        this.setProperty("enabled", false);
      }
      return this;
    },
    getNavigationTarget: function _getNavigationTarget() {
      return this.getProperty("navigationTarget");
    },
    setEnabled: function _setEnabled(bEnabled) {
      if (bEnabled === true) {
        var _navigationTarget$tar3;
        var navigationTarget = this.getNavigationTarget();
        var text = this.getText();
        if (navigationTarget instanceof NavigationTarget && (typeof navigationTarget.targetUrl !== "string" || ((_navigationTarget$tar3 = navigationTarget.targetUrl) === null || _navigationTarget$tar3 === void 0 ? void 0 : _navigationTarget$tar3.length) === 0) && typeof navigationTarget.targetFunction !== "function" || !(typeof text === "string" && text !== "–")) {
          this.setProperty("enabled", false);
          return this;
        }
      }
      this.setProperty("enabled", bEnabled);
      return this;
    },
    onAfterRendering: function _onAfterRendering(oEvent) {
      Link.prototype.onAfterRendering.call(this, oEvent);
      if (!this._pressHandlerAttached) {
        this.attachPress(this.pressHandlerSearchLink, this);
        this._pressHandlerAttached = true;
      }
      var d = this.getDomRef();

      // recover bold tag with the help of text() in a safe way
      SearchHelper.boldTagUnescaper(d);
      var icon = this.getAggregation("icon");
      if (icon) {
        var oRm = sap.ui.getCore().createRenderManager();
        var iconContainer = document.createElement("span");
        d.prepend(" ");
        d.prepend(iconContainer);
        oRm.render(icon, iconContainer);
        oRm.destroy();
      }
    },
    _handlePress: function _handlePress(oEvent) {
      // in case of highlighting the target property of the event is a <b> element inside the Link.
      // therefore setting it manually to Links DomRef / parentElement of the target.
      if (oEvent.target.localName === "b") {
        var oTarget = this.getDomRef() ? this.getDomRef() : oEvent.target.parentElement;
        oEvent.target = oTarget;
      }
      // eslint-disable-next-line prefer-rest-params
      Link.prototype["_handlePress"].apply(this, arguments);
    },
    onsapenter: function _onsapenter(oEvent) {
      this._handlePress(oEvent);
    },
    onclick: function _onclick(oEvent) {
      this._handlePress(oEvent);
    }
  });
  return SearchLink;
});
})();