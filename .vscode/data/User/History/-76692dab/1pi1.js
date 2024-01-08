sap.ui.define([
    "sap/ui/core/Control",
    "sap/ui/dom/includeStyleSheet"
],
    
    function (Control, includeStyleSheet) {
        "use strict";

        return Control.extend("s330601.FlightConnections.js", {
            metadata: {
                properties: {
                    width: {
                        type: "sap.ui.core.CSSSize",
                        defaultValue: "50px"
                    },
                    height: {
                        type: "sap.ui.core.CSSSize",
                        defaultValue: "auto"
                    }
                },
                aggregations: {}
            },
            
            init: function() {

                includeStyleSheet("/css/style.css")
                
            },

            renderer: function(oRm, oControl) {
                
                var sWidth = oControl.getWidth();
                var sHeight = oControl.getHeight();
                
                var sStyleInfo = "style=\"width: " + sWidth + "; height: " + sHeight + ";\"";

                oRm.write("<div " + sStyleInfo +">");
                oRm.write("<span><h2>Hello, this is a custom Controller.</h2></span>");
                oRm.write("</div>")

            },

            onAfterRendering: function() {
             if(sap.ui.core.Control.prototype.onAfterRendering) {
                sap.ui.core.Control.prototype.onAfterRendering.apply(this, arguments);
             }   
            }

        });
    });
