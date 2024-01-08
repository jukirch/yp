/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockBase","sap/fe/core/buildingBlocks/BuildingBlockSupport","sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor"],function(e,o,t){"use strict";var n,r;var i={};var c=t.xml;var l=o.defineBuildingBlock;function s(e,o){e.prototype=Object.create(o.prototype);e.prototype.constructor=e;a(e,o)}function a(e,o){a=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(o,t){o.__proto__=t;return o};return a(e,o)}let p=(n=l({name:"FlexibleColumnLayoutActions",namespace:"sap.fe.macros.fcl",publicNamespace:"sap.fe.macros",returnTypes:["sap.m.OverflowToolbarButton"]}),n(r=function(e){s(o,e);function o(){return e.apply(this,arguments)||this}i=o;var t=o.prototype;t.getTemplate=function e(){return c`
            <m:OverflowToolbarButton
                id="fe::FCLStandardAction::FullScreen"
                type="Transparent"
                icon="{fclhelper>/actionButtonsInfo/switchIcon}"
                visible="{fclhelper>/actionButtonsInfo/switchVisible}"
                press="._routing.switchFullScreen()"
            />
            <m:OverflowToolbarButton
                id="fe::FCLStandardAction::Close"
                type="Transparent"
                icon="sap-icon://decline"
                tooltip="{sap.fe.i18n>C_COMMON_SAPFE_CLOSE}"
                visible="{fclhelper>/actionButtonsInfo/closeVisible}"
                press="._routing.closeColumn()"
            />`};return o}(e))||r);i=p;return i},false);
//# sourceMappingURL=FlexibleColumnLayoutActions.block.js.map