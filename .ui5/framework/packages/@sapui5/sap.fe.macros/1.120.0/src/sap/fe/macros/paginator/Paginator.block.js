/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockBase","sap/fe/core/buildingBlocks/BuildingBlockSupport","sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor","sap/fe/core/helpers/BindingToolkit","sap/fe/core/helpers/StableIdHelper"],function(e,r,i,t,n){"use strict";var a,o,l,u,s;var c={};var p=n.generate;var d=t.pathInModel;var f=t.or;var b=i.xml;var g=r.defineBuildingBlock;var v=r.blockAttribute;function m(e,r,i,t){if(!i)return;Object.defineProperty(e,r,{enumerable:i.enumerable,configurable:i.configurable,writable:i.writable,value:i.initializer?i.initializer.call(t):void 0})}function O(e){if(e===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return e}function h(e,r){e.prototype=Object.create(r.prototype);e.prototype.constructor=e;B(e,r)}function B(e,r){B=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(r,i){r.__proto__=i;return r};return B(e,r)}function T(e,r,i,t,n){var a={};Object.keys(t).forEach(function(e){a[e]=t[e]});a.enumerable=!!a.enumerable;a.configurable=!!a.configurable;if("value"in a||a.initializer){a.writable=true}a=i.slice().reverse().reduce(function(i,t){return t(e,r,i)||i},a);if(n&&a.initializer!==void 0){a.value=a.initializer?a.initializer.call(n):void 0;a.initializer=undefined}if(a.initializer===void 0){Object.defineProperty(e,r,a);a=null}return a}function y(e,r){throw new Error("Decorating class property failed. Please ensure that "+"proposal-class-properties is enabled and runs after the decorators transform.")}let P=(a=g({name:"Paginator",namespace:"sap.fe.macros.internal",publicNamespace:"sap.fe.macros",returnTypes:["sap.m.HBox"]}),o=v({type:"string",isPublic:true}),a(l=(u=function(e){h(r,e);function r(){var r;for(var i=arguments.length,t=new Array(i),n=0;n<i;n++){t[n]=arguments[n]}r=e.call(this,...t)||this;m(r,"id",s,O(r));return r}c=r;var i=r.prototype;i.getTemplate=function e(){const r=d("/navUpEnabled","paginator");const i=d("/navDownEnabled","paginator");const t=f(r,i);const n=d("T_PAGINATOR_CONTROL_PAGINATOR_TOOLTIP_UP","sap.fe.i18n");const a=d("T_PAGINATOR_CONTROL_PAGINATOR_TOOLTIP_DOWN","sap.fe.i18n");return b`
			<m:HBox displayInline="true" id="${this.id}" visible="${t}">
				<uxap:ObjectPageHeaderActionButton
					xmlns:uxap="sap.uxap"
					id="${p([this.id,"previousItem"])}"
					enabled="${r}"
					tooltip="${n}"
					icon="sap-icon://navigation-up-arrow"
					press=".paginator.updateCurrentContext(-1)"
					type="Transparent"
					importance="High"
				/>
				<uxap:ObjectPageHeaderActionButton
					xmlns:uxap="sap.uxap"
					id="${p([this.id,"nextItem"])}"
					enabled="${i}"
					tooltip="${a}"
					icon="sap-icon://navigation-down-arrow"
					press=".paginator.updateCurrentContext(1)"
					type="Transparent"
					importance="High"
				/>
			</m:HBox>`};return r}(e),s=T(u.prototype,"id",[o],{configurable:true,enumerable:true,writable:true,initializer:function(){return""}}),u))||l);c=P;return c},false);
//# sourceMappingURL=Paginator.block.js.map