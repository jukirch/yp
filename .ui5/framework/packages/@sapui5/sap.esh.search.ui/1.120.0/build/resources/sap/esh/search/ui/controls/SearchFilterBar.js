/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["../i18n", "sap/m/Text", "sap/m/Toolbar", "sap/m/ToolbarSpacer", "sap/m/library", "sap/ui/core/Icon", "../eventlogging/UserEvents", "../sinaNexTS/sina/HierarchyDisplayType", "../error/errors"], function (__i18n, Text, Toolbar, ToolbarSpacer, sap_m_library, Icon, ___eventlogging_UserEvents, ___sinaNexTS_sina_HierarchyDisplayType, __errors) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  var i18n = _interopRequireDefault(__i18n);
  var ToolbarDesign = sap_m_library["ToolbarDesign"];
  var UserEventType = ___eventlogging_UserEvents["UserEventType"];
  var HierarchyDisplayType = ___sinaNexTS_sina_HierarchyDisplayType["HierarchyDisplayType"];
  var errors = _interopRequireDefault(__errors);
  /**
   * @namespace sap.esh.search.ui.controls
   */
  var SearchFilterBar = Toolbar.extend("sap.esh.search.ui.controls.SearchFilterBar", {
    renderer: {
      apiVersion: 2
    },
    constructor: function _constructor(sId, settings) {
      Toolbar.prototype.constructor.call(this, sId, settings);

      // blue bar
      this.setProperty("design", ToolbarDesign.Info);
      this.addStyleClass("sapUshellSearchFilterContextualBar");

      // bind file formatter
      this.filterFormatter = this.filterFormatter.bind(this);

      // filter text string
      this.filterText = new Text(this.getId() + "-resetFilterText", {
        text: {
          parts: [{
            path: "/uiFilter/rootCondition"
          }, {
            path: "/facets"
          }],
          formatter: this.filterFormatter
        },
        tooltip: {
          parts: [{
            path: "/uiFilter/rootCondition"
          }, {
            path: "/facets"
          }],
          formatter: this.filterFormatter
        }
      }).addStyleClass("sapUshellSearchFilterText");
      this.filterText.setMaxLines(1);
      this.filterText.clampText();
      this.addContent(this.filterText);

      // filter middle space
      this.addContent(new ToolbarSpacer());

      // filter reset button
      this.resetButton = new Icon(this.getId() + "-resetFilterButton", {
        src: "sap-icon://clear-filter",
        tooltip: i18n.getText("resetFilterButton_tooltip")
      }).addStyleClass("sapUshellSearchFilterResetButton");
      this.addContent(this.resetButton);
    },
    filterFormatter: function _filterFormatter(rootCondition, facets) {
      if (!rootCondition || !rootCondition.hasFilters()) {
        return "";
      }
      var model = this.getModel();
      if (model.config.formatFilterBarText) {
        // 1) exit
        try {
          return model.config.formatFilterBarText(this._assembleFilterLabels(rootCondition, facets));
        } catch (error) {
          var oError = new errors.ConfigurationExitError("formatFilterBarText", model.config.applicationComponent, error);
          var searchCompositeControl = model.getSearchCompositeControlInstanceByChildControl(this);
          searchCompositeControl === null || searchCompositeControl === void 0 ? void 0 : searchCompositeControl.errorHandler.onError(oError);
          return this._formatFilterText(rootCondition, facets); // fallback default formatter
        }
      } else {
        // 2) default formatter
        return this._formatFilterText(rootCondition, facets);
      }
    },
    _assembleFilterLabels: function _assembleFilterLabels(rootCondition, facets) {
      var attributeFilters = [];
      // sort filter values, use same order as in facets
      rootCondition = this.sortConditions(rootCondition, facets);
      // collect all filter values
      for (var i = 0; i < rootCondition.conditions.length; ++i) {
        var _model$getProperty, _model$config;
        var complexCondition = rootCondition.conditions[i];
        var model = this.getModel();
        var attribute = complexCondition.getFirstAttribute();
        var attributeMetadata = (_model$getProperty = model.getProperty("/uiFilter")) === null || _model$getProperty === void 0 ? void 0 : _model$getProperty.dataSource.attributeMetadataMap[attribute];
        if (attributeMetadata && attributeMetadata.isHierarchy === true && attributeMetadata.hierarchyDisplayType === HierarchyDisplayType.StaticHierarchyFacet) {
          continue;
        }
        // DWC exit, ignore the space facet
        if (complexCondition.containsAttribute((_model$config = model.config) === null || _model$config === void 0 ? void 0 : _model$config.dimensionNameSpace_Description)) {
          continue;
        }
        var attributeFilter = {
          attributeName: attributeMetadata.id,
          attributeLabel: "",
          attributeFilterValueLabels: []
        };
        attributeFilters.push(attributeFilter);
        for (var j = 0; j < complexCondition.conditions.length; ++j) {
          var filterCondition = complexCondition.conditions[j]; // ToDo
          if (j === 0) {
            attributeFilter.attributeLabel = filterCondition.attributeLabel;
          }
          attributeFilter.attributeFilterValueLabels.push(this._formatLabel(filterCondition.valueLabel || filterCondition.value, filterCondition.operator));
        }
      }
      return attributeFilters;
    },
    _formatFilterText: function _formatFilterText(rootCondition, facets) {
      var attributeFilters = this._assembleFilterLabels(rootCondition, facets);
      var result = attributeFilters.map(function (attributeFilter) {
        return attributeFilter.attributeLabel + " (" + attributeFilter.attributeFilterValueLabels.join(", ") + ")";
      });
      return i18n.getText("filtered_by", [result.join(", ")]);
    },
    _formatLabel: function _formatLabel(label, operator) {
      var labelFormatted;
      switch (operator) {
        case this.getModel().sinaNext.ComparisonOperator.Bw:
          // "Bw"
          labelFormatted = label + "*";
          break;
        case this.getModel().sinaNext.ComparisonOperator.Ew:
          // "Ew"
          labelFormatted = "*" + label;
          break;
        case this.getModel().sinaNext.ComparisonOperator.Co:
          // "Co"
          labelFormatted = "*" + label + "*";
          break;
        default:
          labelFormatted = label;
          break;
      }
      return labelFormatted;
    },
    sortConditions: function _sortConditions(rootCondition, facets) {
      // cannot sort without facets
      if (facets.length === 0) {
        return rootCondition;
      }
      // helper: get attribute from a complex condition
      var getAttribute = function getAttribute(complexCondition) {
        var firstFilter = complexCondition.conditions[0];
        if (firstFilter.attribute) {
          return firstFilter.attribute;
        }
        return firstFilter.conditions[0].attribute;
      };
      // helper get list index
      var getIndex = function getIndex(list, attribute, value) {
        for (var i = 0; i < list.length; ++i) {
          var element = list[i];
          if (element[attribute] === value) {
            return i;
          }
        }
      };
      // clone: we don't want to modify the original filter
      rootCondition = rootCondition.clone();
      // 1) sort complexConditons (each complexCondition holds the filters for a certain attribute)
      rootCondition.conditions.sort(function (complexCondition1, complexCondition2) {
        var attribute1 = getAttribute(complexCondition1);
        var index1 = getIndex(facets, "dimension", attribute1);
        var attribute2 = getAttribute(complexCondition2);
        var index2 = getIndex(facets, "dimension", attribute2);
        return index1 - index2;
      });
      // 2) sort filters within a complexConditon
      var sortValues = function sortValues(complexCondition) {
        var attribute = getAttribute(complexCondition);
        var index = getIndex(facets, "dimension", attribute);
        if (!index) {
          return;
        }
        var facet = facets[index];
        if (facet.facetType === "hierarchy") {
          return; // no sort for hierarchy
        }

        var valueSortFunction = function valueSortFunction(filter1, filter2) {
          return getIndex(facet.items, "label", filter1.valueLabel) - getIndex(facet.items, "label", filter2.valueLabel);
        };
        complexCondition.conditions.sort(valueSortFunction);
      };
      for (var i = 0; i < rootCondition.conditions.length; ++i) {
        var complexCondition = rootCondition.conditions[i];
        sortValues(complexCondition);
      }
      return rootCondition;
    },
    onAfterRendering: function _onAfterRendering(oEvent) {
      var _this = this;
      Toolbar.prototype.onAfterRendering.call(this, oEvent);

      // don't have model until after rendering
      // attach press action
      this.resetButton.attachPress(function () {
        var model = _this.getModel();
        model.eventLogger.logEvent({
          type: UserEventType.CLEAR_ALL_FILTERS
        });
        model.resetFilterByFilterConditions(true);
      });

      // add aria label
      var $filterText = jQuery(".sapUshellSearchFilterText");
      $filterText.attr("aria-label", i18n.getText("filtered_by_aria_label"));
    }
  });
  return SearchFilterBar;
});
})();