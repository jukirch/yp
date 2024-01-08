/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["../i18n", "sap/m/Toolbar", "sap/m/library", "sap/m/Button", "sap/m/ToolbarLayoutData", "sap/m/ToolbarSpacer", "sap/m/ActionSheet", "sap/ui/core/InvisibleText", "sap/ui/core/IconPool", "sap/ui/core/delegate/ItemNavigation", "sap/ui/core/Control", "../sinaNexTS/sina/NavigationTarget", "./SearchLink"], function (__i18n, Toolbar, sap_m_library, Button, ToolbarLayoutData, ToolbarSpacer, ActionSheet, InvisibleText, IconPool, ItemNavigation, Control, ___sinaNexTS_sina_NavigationTarget, __SearchLink) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  var i18n = _interopRequireDefault(__i18n);
  var ToolbarDesign = sap_m_library["ToolbarDesign"];
  var ButtonType = sap_m_library["ButtonType"];
  var PlacementType = sap_m_library["PlacementType"];
  var NavigationTarget = ___sinaNexTS_sina_NavigationTarget["NavigationTarget"];
  var SearchLink = _interopRequireDefault(__SearchLink);
  /**
   * @namespace sap.esh.search.ui.controls
   */
  var SearchRelatedObjectsToolbar = Control.extend("sap.esh.search.ui.controls.SearchRelatedObjectsToolbar", {
    renderer: {
      apiVersion: 2,
      render: function render(oRm, oControl) {
        oRm.openStart("div", oControl);
        oRm["class"]("sapUshellSearchResultListItem-RelatedObjectsToolbar");
        var oModel = oControl.getModel();
        if (oModel.config.optimizeForValueHelp) {
          oRm["class"]("sapUshellSearchResultListItem-RelatedObjectsToolbarValueHelp");
        }
        oRm.openEnd();
        oRm.renderControl(oControl.getAggregation("_ariaDescriptionForLinks"));
        oControl._renderToolbar(oRm, oControl);
        oRm.close("div");
      }
    },
    metadata: {
      properties: {
        itemId: "string",
        navigationObjects: {
          type: "object",
          multiple: true
        },
        positionInList: "int"
      },
      aggregations: {
        _relatedObjectActionsToolbar: {
          type: "sap.m.Toolbar",
          multiple: false,
          visibility: "hidden"
        },
        _ariaDescriptionForLinks: {
          type: "sap.ui.core.InvisibleText",
          multiple: false,
          visibility: "hidden"
        }
      }
    },
    constructor: function _constructor(sId, settings) {
      var _this = this;
      Control.prototype.constructor.call(this, sId, settings);
      var relatedObjectActionsToolbar = new Toolbar("".concat(this.getId(), "--toolbar"), {
        design: ToolbarDesign.Solid
      });
      relatedObjectActionsToolbar.data("sap-ui-fastnavgroup", "false", true /* write into DOM */);
      relatedObjectActionsToolbar.addStyleClass("sapUshellSearchResultListItem-RelatedObjectsToolbar-Toolbar");
      relatedObjectActionsToolbar.addEventDelegate({
        onAfterRendering: this.layoutToolbarElements.bind(this)
      });
      this.setAggregation("_relatedObjectActionsToolbar", relatedObjectActionsToolbar);
      this.setAggregation("_ariaDescriptionForLinks", new InvisibleText({
        text: i18n.getText("result_list_item_aria_has_more_links")
      }));
      $(window).on("resize", function () {
        _this.layoutToolbarElements();
      });
    },
    exit: function _exit() {
      if (Control.prototype.exit) {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        // check whether superclass implements the method
        Control.prototype.exit.apply(this, args); // call the method with the original arguments
      }

      if (this._overFlowSheet) {
        this._overFlowSheet.destroy();
      }
    },
    _renderToolbar: function _renderToolbar(oRm, oControl) {
      var _this2 = this;
      var oModel = oControl.getModel();
      var _relatedObjectActionsToolbar = oControl.getAggregation("_relatedObjectActionsToolbar");
      _relatedObjectActionsToolbar.destroyContent();
      if (oModel.config.optimizeForValueHelp) {
        _relatedObjectActionsToolbar.addStyleClass("sapUshellSearchResultListItem-RelatedObjectsToolbar-ToolbarValueHelp");
      }
      var navigationObjects = oControl.getProperty("navigationObjects");
      if (Array.isArray(navigationObjects) && navigationObjects.length > 0) {
        var navigationObjectsLinks = [];
        for (var i = 0; i < navigationObjects.length; i++) {
          var navigationObject = navigationObjects[i];
          var link = new SearchLink("".concat(oControl.getId(), "--link_").concat(i), {
            text: (navigationObject === null || navigationObject === void 0 ? void 0 : navigationObject.text) || "",
            navigationTarget: navigationObject,
            layoutData: new ToolbarLayoutData({
              shrinkable: false
            })
          });
          link.addStyleClass("sapUshellSearchResultListItem-RelatedObjectsToolbar-Element");
          navigationObjectsLinks.push(link);
        }

        // 1. spacer
        var toolbarSpacer = new ToolbarSpacer();
        toolbarSpacer.addStyleClass("sapUshellSearchResultListItem-RelatedObjectsToolbar-Spacer");
        _relatedObjectActionsToolbar.addContent(toolbarSpacer);

        // 2. navigation objects
        for (var _i = 0; _i < navigationObjectsLinks.length; _i++) {
          _relatedObjectActionsToolbar.addContent(navigationObjectsLinks[_i]);
        }

        // 3. overFlowButton
        this._overFlowButton = new Button("".concat(this.getId(), "--overflowButton"), {
          icon: IconPool.getIconURI("overflow")
        });
        this._overFlowButton.addStyleClass("sapUshellSearchResultListItem-RelatedObjectsToolbar-OverFlowButton");
        if (oModel.config.optimizeForValueHelp) {
          this._overFlowButton.addStyleClass("sapUiSmallMarginBegin");
          this._overFlowButton.addStyleClass("sapUiTinyMarginEnd");
          this._overFlowButton.setType(ButtonType.Transparent);
        }
        _relatedObjectActionsToolbar.addContent(this._overFlowButton);

        // 4. overFlowSheet
        if (!this._overFlowSheet) {
          this._overFlowSheet = new ActionSheet("".concat(this.getId(), "--actionSheet"), {
            placement: PlacementType.Top
          });
        }
        this._overFlowButton.attachPress(function () {
          if (_this2._overFlowSheet.isOpen()) {
            _this2._overFlowSheet.close();
          } else {
            _this2._overFlowSheet.openBy(_this2._overFlowButton);
          }
        });
        oRm.renderControl(_relatedObjectActionsToolbar);
      }
    },
    onAfterRendering: function _onAfterRendering() {
      if (this.getAggregation("_relatedObjectActionsToolbar")) {
        this._addAriaInformation();
      }
    },
    layoutToolbarElements: function _layoutToolbarElements() {
      if (this.isDestroyed() || this.isDestroyStarted()) {
        return;
      }
      var _relatedObjectActionsToolbar = this.getAggregation("_relatedObjectActionsToolbar");
      if (!(this.getDomRef() && _relatedObjectActionsToolbar.getDomRef())) {
        return;
      }
      var $toolbar = $(_relatedObjectActionsToolbar.getDomRef());
      var toolbarWidth = $toolbar.width();

      // following return can cause issues in case of control being rendered more than once immediately after the first render
      // if (toolbarWidth === 0 || (this.toolbarWidth && this.toolbarWidth === toolbarWidth)) {
      //     return;
      // }

      if ($(this.getDomRef()).css("display") === "none" || $toolbar.css("display") === "none") {
        return;
      }
      this.toolbarWidth = toolbarWidth;
      var $overFlowButton = $(this._overFlowButton.getDomRef());
      $overFlowButton.css("display", "none");
      var toolbarElementsWidth = 0;
      var pressButton = function pressButton(event, _navigationObject) {
        if (_navigationObject instanceof NavigationTarget) {
          _navigationObject.performNavigation({
            event: event
          });
        }
      };
      var $toolbarElements = $toolbar.find(".sapUshellSearchResultListItem-RelatedObjectsToolbar-Element" // ToDo
      );

      for (var i = 0; i < $toolbarElements.length; i++) {
        var $element = $($toolbarElements[i]);
        $element.css("display", "");
        var _toolbarElementsWidth = toolbarElementsWidth + $element.outerWidth(true);
        if (_toolbarElementsWidth > toolbarWidth) {
          // if (i < $toolbarElements.length) {
          $overFlowButton.css("display", "");
          var overFlowButtonWidth = $overFlowButton.outerWidth(true);
          for (; i >= 0; i--) {
            $element = $($toolbarElements[i]);
            _toolbarElementsWidth -= $element.outerWidth(true);
            if (_toolbarElementsWidth + overFlowButtonWidth <= toolbarWidth) {
              break;
            }
          }
          // }

          var navigationObjects = this.getProperty("navigationObjects");
          this._overFlowSheet.destroyButtons();
          i = i >= 0 ? i : 0;
          for (; i < $toolbarElements.length; i++) {
            $element = $($toolbarElements[i]);
            $element.css("display", "none");
            var navigationObject = navigationObjects[i];
            var button = new Button({
              text: (navigationObject === null || navigationObject === void 0 ? void 0 : navigationObject.text) || ""
            });
            button.attachPress(navigationObject, pressButton);
            this._overFlowSheet.addButton(button);
          }
          break;
        }
        toolbarElementsWidth = _toolbarElementsWidth;
      }
      this._setupItemNavigation();
    },
    _setupItemNavigation: function _setupItemNavigation() {
      if (!this._theItemNavigation) {
        this._theItemNavigation = new ItemNavigation(null, []);
        this["addDelegate"](this._theItemNavigation);
      }
      this._theItemNavigation.setCycling(false);
      this._theItemNavigation.setRootDomRef(this.getDomRef());
      var itemDomRefs = [];
      var _relatedObjectActionsToolbar = this.getAggregation("_relatedObjectActionsToolbar");
      var content = _relatedObjectActionsToolbar.getContent();
      for (var i = 0; i < content.length; i++) {
        if (!content[i].hasStyleClass("sapUshellSearchResultListItem-RelatedObjectsToolbar-Element")) {
          continue;
        }
        if (!$(content[i].getDomRef()).attr("tabindex")) {
          var tabindex = "-1";
          if (content[i]["getPressed"] && content[i]["getPressed"]()) {
            tabindex = "0";
          }
          $(content[i].getDomRef()).attr("tabindex", tabindex);
        }
        itemDomRefs.push(content[i].getDomRef());
      }
      var overFlowButtonDomRef = this._overFlowButton.getDomRef();
      itemDomRefs.push(overFlowButtonDomRef);
      $(overFlowButtonDomRef).attr("tabindex", "-1");
      this._theItemNavigation.setItemDomRefs(itemDomRefs);
    },
    _addAriaInformation: function _addAriaInformation() {
      var $toolbar = $(this.getAggregation("_relatedObjectActionsToolbar").getDomRef());
      var $navigationLinks = $toolbar.find(".sapUshellSearchResultListItem-RelatedObjectsToolbar-Element");
      var $overFlowButton = $(this._overFlowButton.getDomRef());
      if ($navigationLinks.length > 0 || $overFlowButton.is(":visible")) {
        var ariaDescriptionId = this.getAggregation("_ariaDescriptionForLinks").getId();
        $navigationLinks.each(function () {
          var $this = $(this);
          var ariaDescription = $this.attr("aria-describedby") || "";
          ariaDescription += " " + ariaDescriptionId;
          $this.attr("aria-describedby", ariaDescription);
        });
        if ($overFlowButton.is(":visible")) {
          var ariaDescription = $overFlowButton.attr("aria-describedby") || "";
          ariaDescription += " " + ariaDescriptionId;
          $overFlowButton.attr("aria-describedby", ariaDescription);
        }
      }
    }
  });
  return SearchRelatedObjectsToolbar;
});
})();