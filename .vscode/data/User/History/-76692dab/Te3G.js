sap.ui.define([
    "sap/ui/core/Control",
    "sap/ui/dom/includeStylesheet",
    "sap/m/MessageToast"
],
    
    function (Control, includeStyleSheet, MessageToast) {
        "use strict";

        return Control.extend("s330601.FlightConnections.js", {
            metadata: {
                properties: {
                    width: {
                        type: "sap.ui.core.CSSSize",
                        defaultValue: "auto"
                    },
                    height: {
                        type: "sap.ui.core.CSSSize",
                        defaultValue: "auto"
                    }
                },
                aggregations: {
                    content: {
                        type: "sap.ui.core.Control"
                    }
                },
                defaultAggregation: "content",
                events: {
                    "iconPress": { 
                        parameters: {
                            value: {
                                type: "string"
                            }
                        }
                    }
                }
            },
            
            init: function() {

                includeStyleSheet("/css/cust.css");
                
            },

            renderer: function(oRm, oControl) {
                
                var sWidth = oControl.getWidth();
                var sHeight = oControl.getHeight();
                var sStyleInfo = "style=\"width: " + sWidth + "; height: " + sHeight + ";\"";

                oRm.write("<div " + sStyleInfo );
                oRm.addClass("custFlightConnections");
                oRm.writeClasses(oControl);
                oRm.writeControlData(oControl);
                oRm.write(">");

                // oRm.write("<span><h2>Hello, this is a custom Controller.</h2></span>");
                
                $(oControl.getContent()).each(function(){
                    oRm.renderControl(this);
                });

                oRm.write("</div>")

            },

            onAfterRendering: function() {
             if(sap.ui.core.Control.prototype.onAfterRendering) {
                sap.ui.core.Control.prototype.onAfterRendering.apply(this, arguments);                
             }
             this.attachIconPress(this.onIconPress);   
            },

            onIconPress: function(oEvent) {
                    var sString = oEvent.getParameter("value");
                    MessageToast.show(sString);
            },

            onclick: function(){
                this.fireIconPress({"value": "Flugzeug Icon"});
            }

        });
    });
