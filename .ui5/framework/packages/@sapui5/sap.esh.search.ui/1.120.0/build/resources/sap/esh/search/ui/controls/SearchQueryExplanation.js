/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["sap/ui/core/Control", "./TypeGuardForControls", "sap/m/Tree", "sap/m/StandardTreeItem", "sap/ui/model/json/JSONModel"], function (Control, ___TypeGuardForControls, Tree, StandardTreeItem, JSONModel) {
  var typesafeRender = ___TypeGuardForControls["typesafeRender"];
  /**
   * @namespace sap.esh.search.ui.controls
   */
  var SearchQueryExplanation = Control.extend("sap.esh.search.ui.controls.SearchQueryExplanation", {
    renderer: {
      apiVersion: 2,
      render: function render(oRm, oControl) {
        // const oSearchModel = oControl.getModel() as SearchModel;
        var oItems = {
          items: [{
            text: oControl.getProperty("text")
          }]
        };
        var oItemModel = new JSONModel({
          items: oItems
        });
        var settings = {
          items: {
            path: "conditionTree>/items",
            template: new StandardTreeItem({
              title: "{conditionTree>text}"
            })
          }
        };
        var oConditionTree = new Tree("".concat(oControl.getId(), "-conditionTree"), settings);
        oConditionTree.setModel(oItemModel, "conditionTree");
        typesafeRender(oConditionTree, oRm);
      }
    },
    metadata: {
      properties: {
        /* query: {
            type: "object",
        }, */
        text: {
          type: "string",
          defaultValue: ""
        }
      }
    },
    constructor: function _constructor(sId, settings) {
      Control.prototype.constructor.call(this, sId, settings);
    }
  });
  return SearchQueryExplanation;
});
})();