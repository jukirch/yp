/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/m/Button", "sap/ui/core/Core", "sap/ui/dom/units/Rem"], function (Button, Core, Rem) {
  "use strict";

  const SizeHelper = {
    calls: 0,
    hiddenButton: undefined,
    /**
     * Creates a hidden button and places it in the static area.
     */
    init: function () {
      // Create a new button in static area
      this.calls++;
      this.hiddenButton = this.hiddenButton ? this.hiddenButton : new Button().placeAt(Core.getStaticAreaRef());
      // Hide button from accessibility tree
      this.hiddenButton.setVisible(false);
    },
    /**
     * Method to calculate the width of the button from a temporarily created button placed in the static area.
     *
     * @param text The text to measure inside the Button.
     * @returns The value of the Button width.
     */
    getButtonWidth: function (text) {
      var _this$hiddenButton$ge;
      if (!text || !this.hiddenButton) {
        return 0;
      }
      this.hiddenButton.setVisible(true);
      this.hiddenButton.setText(text);
      this.hiddenButton.rerender();
      const buttonWidth = Rem.fromPx((_this$hiddenButton$ge = this.hiddenButton.getDomRef()) === null || _this$hiddenButton$ge === void 0 ? void 0 : _this$hiddenButton$ge.scrollWidth);
      this.hiddenButton.setVisible(false);
      return Math.round(buttonWidth * 100) / 100;
    },
    /**
     * Deletes the hidden button if not needed anymore.
     */
    exit: function () {
      this.calls--;
      if (this.calls === 0) {
        var _this$hiddenButton;
        (_this$hiddenButton = this.hiddenButton) === null || _this$hiddenButton === void 0 ? void 0 : _this$hiddenButton.destroy();
        this.hiddenButton = undefined;
      }
    }
  };
  return SizeHelper;
}, false);
