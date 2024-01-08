/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["sap/esh/search/ui/SearchHelper", "sap/f/GridContainer", "sap/m/ImageContent", "sap/m/GenericTile", "sap/m/TileContent", "../sinaNexTS/sina/NavigationTarget"], function (SearchHelper, GridContainer, ImageContent, GenericTile, TileContent, ___sinaNexTS_sina_NavigationTarget) {
  var NavigationTarget = ___sinaNexTS_sina_NavigationTarget["NavigationTarget"];
  /**
   * @namespace sap.esh.search.ui.controls
   */
  var SearchResultGrid = GridContainer.extend("sap.esh.search.ui.controls.SearchResultGrid", {
    renderer: {
      apiVersion: 2
    },
    constructor: function _constructor(sId, options) {
      var _this = this;
      GridContainer.prototype.constructor.call(this, sId, options);
      GridContainer.prototype.constructor.apply(this, [sId, options]);
      this.bindAggregation("items", {
        path: "/results",
        factory: function factory(id, context) {
          var item = context.getObject();
          var imageContent = new ImageContent({
            src: item.imageUrl || item.titleIconUrl
          });
          if (item.imageFormat === "round") {
            imageContent.addStyleClass("sapUshellResultListGrid-ImageContainerRound");
          }
          return new GenericTile("", {
            header: item.title,
            subheader: item.titleDescription,
            tileContent: new TileContent({
              content: imageContent
            }),
            press: function press(oEvent) {
              var binding = _this.getModel().getProperty(oEvent.getSource().getBindingContext().getPath());
              var titleNavigation = binding.titleNavigation;
              if (titleNavigation instanceof NavigationTarget) {
                titleNavigation.performNavigation();
              }
            }
          });
        }
      });
      this.addStyleClass("sapUshellResultListGrid");
    },
    onAfterRendering: function _onAfterRendering(oEvent) {
      GridContainer.prototype.onAfterRendering.call(this, oEvent);
      SearchHelper.boldTagUnescaper(this.getDomRef());
    }
  });
  return SearchResultGrid;
});
})();