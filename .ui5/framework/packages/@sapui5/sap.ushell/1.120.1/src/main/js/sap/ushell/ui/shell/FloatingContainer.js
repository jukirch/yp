// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * An invisible container,
 * located (i.e. floats) at the top right side of the shell and can host any <code>sap.ui.core.Control</code> object.<br>
 * Extends <code>sap.ui.core.Control</code>
 */
sap.ui.define([
    "sap/ui/core/Configuration",
    "sap/ui/core/Control",
    "sap/ui/core/Core",
    "sap/ui/Device",
    "sap/ui/performance/Measurement",
    "sap/ui/thirdparty/jquery",
    "sap/ui/util/Storage",
    "sap/ushell/EventHub",
    "sap/ushell/library" // css style dependency
], function (
    Configuration,
    Control,
    Core,
    Device,
    Measurement,
    jQuery,
    Storage,
    EventHub,
    ushellLibrary
) {
    "use strict";

    var FloatingContainer = Control.extend("sap.ushell.ui.shell.FloatingContainer", {
        metadata: {
            library: "sap.ushell",
            properties: {
                visible: { type: "boolean", defaultValue: true }
            },
            aggregations: {
                content: { type: "sap.ui.core.Control", multiple: true }
            }
        },
        renderer: {
            apiVersion: 2,
            render: function (rm, oContainer) {
                rm.openStart("div", oContainer);
                rm.class("sapUshellFloatingContainer");

                if (!oContainer.getVisible()) {
                    rm.class("sapUshellShellHidden");
                }

                rm.openEnd();

                if (oContainer.getContent() && oContainer.getContent().length) {
                    rm.renderControl(oContainer.getContent()[0]);
                }
                rm.close("div");
            }
        }
    });

    FloatingContainer.prototype.init = function () {
        Device.resize.attachHandler(FloatingContainer.prototype._handleResize, this);
        this.oStorage = new Storage(Storage.Type.local, "com.sap.ushell.adapters.local.FloatingContainer");
    };

    FloatingContainer.prototype.onAfterRendering = function () {
        if (this._bFirstRenderingDone) {
            return;
        }

        this._bFirstRenderingDone = true;
        // old css styles might not fit the new screen size after first rendering
        this.adjustPosition();
    };

    FloatingContainer.prototype._getWindowHeight = function () {
        return jQuery(window).height();
    };

    FloatingContainer.prototype._setContainerHeight = function (oContainer, iFinalHeight) {
        oContainer.css("max-height", iFinalHeight);
    };

    FloatingContainer.prototype._getWrapper = function () {
        return this.getDomRef() && this.getDomRef().parentNode;
    };

    FloatingContainer.prototype._isDocked = function () {
        var oWrapper = this._getWrapper();
        return oWrapper && oWrapper.classList.contains("sapUshellContainerDocked");
    };

    FloatingContainer.prototype._getDockingDirection = function () {
        var bIsDocked = this._isDocked();
        if (!bIsDocked) {
            return null;
        }
        var oWrapper = this._getWrapper();
        return oWrapper.classList.contains("sapUshellContainerDockedStart") ? "start" : "end";
    };

    FloatingContainer.prototype._handleResize = function (oEvent) {
        Measurement.start("FLP:FloatingContainer_handleResize", "resizing floating container", "FLP");

        var iWindowWidth = jQuery(window).width();
        var oWrapper = this._getWrapper();
        var bHasWrapper = !!oWrapper;
        var bIsDocked = this._isDocked();

        if (bHasWrapper && !bIsDocked) {
            oWrapper.style.cssText = this.oStorage.get("floatingContainerStyle");
            this.adjustPosition(oEvent);

        } else if (bHasWrapper && bIsDocked) {
            var sDockingDirection = this._getDockingDirection();
            // when copilot is docked to the left and window is resized - we need to align his left
            if (sDockingDirection === "end") {
                var iUpdatedLeft;
                if (Configuration.getRTL()) {
                    jQuery(oWrapper).css("left", (416 / iWindowWidth * 100) + "%");
                    iUpdatedLeft = 416 / iWindowWidth * 100 + "%;";
                } else {
                    jQuery(oWrapper).css("left", 100 - 416 / iWindowWidth * 100 + "%");
                    iUpdatedLeft = 100 - 416 / iWindowWidth * 100 + "%;";
                }
                oWrapper.style.cssText = "left:" + iUpdatedLeft + oWrapper.style.cssText.substring(oWrapper.style.cssText.indexOf("top"));

                this.oStorage.put("floatingContainerStyle", oWrapper.style.cssText);
            }
        }

        if (bIsDocked) {
            Core.getEventBus().publish("launchpad", "shellFloatingContainerDockedIsResize");
            EventHub.emit("ShellFloatingContainerDockedIsResized", Date.now());
        }

        // handle case when co-pilot is dock but screen is less then desktop or landscape tablet
        var sDevice = Device.media.getCurrentRange(Device.media.RANGESETS.SAP_STANDARD);
        if (sDevice.name !== "Desktop" && bIsDocked) {
            EventHub.emit("ShellFloatingContainerUndockOnResize", Date.now());
        }
        Measurement.end("FLP:FloatingContainer_handleResize");
    };

    FloatingContainer.prototype._isSSize = function () {
        return window.matchMedia ? window.matchMedia("(max-width: 417px)").matches : false;
    };

    FloatingContainer.prototype.adjustPosition = function (oEvent) {
        var iWindowWidth = oEvent ? oEvent.width : jQuery(window).width();
        var iWindowHeight = oEvent ? oEvent.height : jQuery(window).height();
        var oDomRef = this.getDomRef();
        var iContainerWidth = jQuery(oDomRef).width();
        var iContainerHeight = jQuery(oDomRef).height();
        var bContainerPosExceedWindowWidth,
            bContainerPosExceedWindowHeight,
            iLeftPos,
            iTopPos;
        var isRTL = Configuration.getRTL();

        var bIsSSize = this._isSSize();

        var oWrapper = this._getWrapper();
        if (oWrapper) {
            iLeftPos = oWrapper.style.left.replace("%", "");
            iLeftPos = iWindowWidth * iLeftPos / 100;
            iTopPos = oWrapper.style.top.replace("%", "");
            iTopPos = iWindowHeight * iTopPos / 100;

            //If we are in the S size screen defined as 417 px, then there is a css class applied to  the container
            //And we want to preserve the position before going into S size in case the screen is resized back.
            if (!isNaN(iLeftPos) && !isNaN(iTopPos) && !bIsSSize) { //check if iTopPos or iLeftPos is NaN
                if (isRTL) {
                    bContainerPosExceedWindowWidth = (iLeftPos < iContainerWidth) || (iLeftPos > iWindowWidth);
                    if (bContainerPosExceedWindowWidth) {
                        iLeftPos = iLeftPos < iContainerWidth ? iContainerWidth : iWindowWidth;
                    }
                } else {
                    bContainerPosExceedWindowWidth = (iLeftPos < 0) || (iWindowWidth < (iLeftPos + iContainerWidth));
                    if (bContainerPosExceedWindowWidth) {
                        iLeftPos = iLeftPos < 0 ? 0 : (iWindowWidth - iContainerWidth);
                    }
                } bContainerPosExceedWindowHeight = (iTopPos < 0) || (iWindowHeight < (iTopPos + iContainerHeight));

                if (bContainerPosExceedWindowHeight) {
                    iTopPos = iTopPos < 0 ? 0 : (iWindowHeight - iContainerHeight);
                }

                if (!bContainerPosExceedWindowWidth && !bContainerPosExceedWindowHeight) {
                    oWrapper.style.left = iLeftPos * 100 / iWindowWidth + "%";
                    oWrapper.style.top = iTopPos * 100 / iWindowHeight + "%";
                    oWrapper.style.position = "absolute";
                    return;
                }
                oWrapper.style.left = iLeftPos * 100 / iWindowWidth + "%";
                oWrapper.style.top = iTopPos * 100 / iWindowHeight + "%";
                oWrapper.style.position = "absolute";
            }
        }
    };

    FloatingContainer.prototype.handleDrop = function () {
        var oWrapper = this._getWrapper();
        if (oWrapper) {
            this.adjustPosition();
            this.oStorage.put("floatingContainerStyle", oWrapper.style.cssText);
        }
    };

    FloatingContainer.prototype.setContent = function (aContent) {
        if (this.getDomRef()) {
            var rm = Core.createRenderManager();
            rm.renderControl(aContent);
            rm.flush(this.getDomRef());
            rm.destroy();
        }
        this.setAggregation("content", aContent, true);
    };

    FloatingContainer.prototype.setVisible = function (bVisible) {
        var oDomRef = this.getDomRef();
        if (oDomRef) {
            oDomRef.classList.toggle("sapUshellShellHidden", !bVisible);
        }
        if (bVisible && !this._isDocked()) {
            this._handleResize();
        }
        this.setProperty("visible", bVisible, true);
    };

    FloatingContainer.prototype.exit = function () {
        Device.resize.detachHandler(FloatingContainer.prototype._resizeHandler, this);
    };

    return FloatingContainer;
});
