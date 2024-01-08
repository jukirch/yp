/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/m/Button","sap/ui/core/Core","sap/ui/dom/units/Rem"],function(t,i,n){"use strict";const e={calls:0,hiddenButton:undefined,init:function(){this.calls++;this.hiddenButton=this.hiddenButton?this.hiddenButton:(new t).placeAt(i.getStaticAreaRef());this.hiddenButton.setVisible(false)},getButtonWidth:function(t){var i;if(!t||!this.hiddenButton){return 0}this.hiddenButton.setVisible(true);this.hiddenButton.setText(t);this.hiddenButton.rerender();const e=n.fromPx((i=this.hiddenButton.getDomRef())===null||i===void 0?void 0:i.scrollWidth);this.hiddenButton.setVisible(false);return Math.round(e*100)/100},exit:function(){this.calls--;if(this.calls===0){var t;(t=this.hiddenButton)===null||t===void 0?void 0:t.destroy();this.hiddenButton=undefined}}};return e},false);
//# sourceMappingURL=SizeHelper.js.map