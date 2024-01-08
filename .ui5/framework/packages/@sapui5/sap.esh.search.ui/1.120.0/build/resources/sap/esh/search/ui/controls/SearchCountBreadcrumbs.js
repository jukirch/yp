/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["sap/ui/core/Control", "sap/m/library", "sap/ui/core/Icon", "sap/m/Label", "sap/m/Breadcrumbs", "sap/esh/search/ui/controls/SearchLink", "sap/base/strings/formatMessage", "sap/m/HBox", "../i18n", "sap/m/VBox"], function (Control, sap_m_library, Icon, Label, Breadcrumbs, SearchLink, formatMessage, HBox, __i18n, VBox) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  var LabelDesign = sap_m_library["LabelDesign"];
  var BreadcrumbsSeparatorStyle = sap_m_library["BreadcrumbsSeparatorStyle"];
  var i18n = _interopRequireDefault(__i18n);
  /**
   * @namespace sap.esh.search.ui.controls
   */
  var SearchCountBreadcrumbs = Control.extend("sap.esh.search.ui.controls.SearchCountBreadcrumbs", {
    renderer: {
      apiVersion: 2,
      render: function render(oRm, oControl) {
        oRm.openStart("div", oControl);
        oRm["class"]("sapUshellSearchTotalCountBreadcrumbs");
        oRm.openEnd();
        var searchModel = oControl.getModel();

        // In case of folder mode/search mode, display additional folderModeLabel
        if (searchModel.config.folderMode === true && searchModel.config.optimizeForValueHelp !== true) {
          var hBox = oControl.getAggregation("containerHbox");
          hBox.addItem(oControl.getAggregation("folderModeLabel"));
          hBox.addItem(oControl.getAggregation("icon"));
          hBox.addItem(oControl.getAggregation("label"));
          if (searchModel.config.FF_hierarchyBreadcrumbs === true) {
            // For sake of responsiveness, additional container is needed
            var vBox = oControl.getAggregation("breadcrumbsContainerVbox");
            vBox === null || vBox === void 0 ? void 0 : vBox.addItem(oControl.getAggregation("breadcrumbs"));
            hBox.addItem(vBox);
            oRm.renderControl(hBox);
          }
        } else {
          oRm.renderControl(oControl.getAggregation("icon"));
          oRm.renderControl(oControl.getAggregation("label"));
          if (searchModel.config.FF_hierarchyBreadcrumbs === true) {
            oRm.renderControl(oControl.getAggregation("breadcrumbs"));
          }
        }
        oRm.close("div");
      }
    },
    metadata: {
      aggregations: {
        containerHbox: {
          type: "sap.m.HBox",
          multiple: false
        },
        folderModeLabel: {
          type: "sap.m.Label",
          multiple: false
        },
        icon: {
          type: "sap.ui.core.Icon",
          multiple: false
        },
        label: {
          type: "sap.m.Label",
          multiple: false
        },
        breadcrumbsContainerVbox: {
          type: "sap.m.VBox",
          multiple: false
        },
        breadcrumbs: {
          type: "sap.m.Breadcrumbs",
          multiple: false
        }
      }
    },
    constructor: function _constructor(sId, settings) {
      Control.prototype.constructor.call(this, sId, settings);
      this.initContainerHbox();
      this.initFolderModeLabel();
      this.initIcon();
      this.initLabel();
      this.initBreadcrumbsContainerVbox();
      this.initBreadCrumbs();
    },
    initContainerHbox: function _initContainerHbox() {
      var hBox = new HBox(this.getId() + "-ContainerHbox", {});
      hBox.addStyleClass("sapUiNoMargin");
      this.setAggregation("containerHbox", hBox);
    },
    initFolderModeLabel: function _initFolderModeLabel() {
      var label = new Label(this.getId() + "-FolderModeLabel", {
        design: LabelDesign.Bold,
        text: {
          parts: [{
            path: "/isFolderMode"
          }],
          formatter: function formatter(isFolderMode) {
            if (isFolderMode === true) {
              return i18n.getText("result_list_folder_mode");
            }
            return i18n.getText("result_list_search_mode");
          }
        }
      });
      label.addStyleClass("sapUshellSearchTotalCountSelenium");
      label.addStyleClass("sapUiTinyMarginEnd");
      label.addStyleClass("sapElisaFolderModeLabel");
      this.setAggregation("folderModeLabel", label);
    },
    initIcon: function _initIcon() {
      var icon = new Icon(this.getId() + "-Icon", {
        visible: {
          parts: [{
            path: "/count"
          }, {
            path: "/breadcrumbsHierarchyNodePaths"
          }],
          formatter: function formatter(count, breadcrumbs) {
            if (breadcrumbs && Array.isArray(breadcrumbs) && breadcrumbs.length > 0) {
              return false;
            }
            return true;
            // return count !== 0;
          }
        },

        src: {
          path: "/searchInIcon"
        }
      });
      icon.addStyleClass("sapUiTinyMarginEnd");
      icon.addStyleClass("sapUshellSearchTotalCountBreadcrumbsIcon");
      this.setAggregation("icon", icon);
    },
    initLabel: function _initLabel() {
      var label = new Label(this.getId() + "-Label", {
        visible: {
          parts: [{
            path: "/count"
          }, {
            path: "/breadcrumbsHierarchyNodePaths"
          }],
          formatter: function formatter(count, breadcrumbs) {
            if (breadcrumbs && Array.isArray(breadcrumbs) && breadcrumbs.length > 0) {
              return false;
            }
            return true;
            // return count !== 0;
          }
        },

        design: LabelDesign.Bold,
        text: {
          path: "/countText"
        }
      });
      label.addStyleClass("sapUshellSearchTotalCountSelenium");
      label.addStyleClass("sapUshellSearchTotalCountStandalone");
      this.setAggregation("label", label);
    },
    initBreadcrumbsContainerVbox: function _initBreadcrumbsContainerVbox() {
      var vBox = new VBox(this.getId() + "-BreadcrumbsContainerVbox", {});
      vBox.addStyleClass("sapElisaBreadcrumbsFolderContainerVbox");
      vBox.addStyleClass("sapUiNoMargin");
      this.setAggregation("breadcrumbsContainerVbox", vBox);
    },
    initBreadCrumbs: function _initBreadCrumbs() {
      var _this = this;
      var linkIcon = new Icon(this.getId() + "-SearchLinkIcon", {
        src: {
          path: "icon"
        }
      });
      linkIcon.addStyleClass("sapElisaSearchLinkIcon");
      var links = {
        path: "/breadcrumbsHierarchyNodePaths",
        template: new SearchLink("", {
          navigationTarget: {
            parts: [{
              path: "id"
            }, {
              path: "label"
            }],
            formatter: function formatter(_id, _label) {
              var searchModel = _this.getModel();
              var sina = searchModel.sinaNext;
              var dataSource = searchModel.getDataSource();
              var attrName = searchModel.getProperty("/breadcrumbsHierarchyAttribute");
              var navTarget = sina.createStaticHierarchySearchNavigationTarget(_id, _label, dataSource, "", attrName);
              return navTarget;
            }
          },
          text: {
            path: "label"
          },
          icon: linkIcon,
          visible: true
          // emphasized: {
          //     path: "isLast",
          //     formatter: (isLastPath: boolean): boolean => {
          //         if (isLastPath === true) {
          //             return true;
          //         }
          //         return false;
          //     },
          // },
        }).addStyleClass("sapUshellSearchTotalCountBreadcrumbsLinks"),
        templateShareable: false
      };
      var breadCrumbsSettings = {
        visible: {
          parts: [{
            path: "/breadcrumbsHierarchyNodePaths"
          }],
          formatter: function formatter(path) {
            if (path && Array.isArray(path) && path.length > 0) {
              return true;
            }
            return false;
          }
        },
        currentLocationText: {
          parts: [{
            path: "i18n>countnumber"
          }, {
            path: "/count"
          }],
          formatter: formatMessage
        },
        separatorStyle: BreadcrumbsSeparatorStyle.GreaterThan,
        links: links
      };
      var breadCrumbs = new Breadcrumbs(this.getId() + "-Breadcrumbs", breadCrumbsSettings).addStyleClass("sapElisaBreadcrumbs sapUiNoMarginBottom");
      this.setAggregation("breadcrumbs", breadCrumbs);
    },
    handleBreadcrumbLinkPress: function _handleBreadcrumbLinkPress(oEvent) {
      var oSrc = oEvent.getSource();
      var valueRaw = oSrc.data().containerId;
      var valueLabel = oSrc.data().containerName;
      var searchModel = oSrc.getModel();
      var sina = searchModel.sinaNext;
      var dataSource = searchModel.getDataSource();
      var attrName = searchModel.getProperty("/breadcrumbsHierarchyAttribute");
      var navTarget = sina.createStaticHierarchySearchNavigationTarget(valueRaw, valueLabel, dataSource, "", attrName);
      navTarget.performNavigation();
    },
    setModel: function _setModel(model) {
      this.getAggregation("folderModeLabel").setModel(model);
      this.getAggregation("icon").setModel(model);
      this.getAggregation("label").setModel(model);
      this.getAggregation("breadcrumbs").setModel(model);
      return this;
    }
  });
  return SearchCountBreadcrumbs;
});
})();