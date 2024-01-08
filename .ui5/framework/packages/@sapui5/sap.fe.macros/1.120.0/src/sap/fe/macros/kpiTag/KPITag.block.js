/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockBase","sap/fe/core/buildingBlocks/BuildingBlockSupport","sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor"],function(e,t,r){"use strict";var i,n,u,a,l,o,s,c,p,b,f,d,g,m,y,h,v,w,z;var B={};var k=r.xml;var O=t.defineBuildingBlock;var $=t.blockEvent;var j=t.blockAttribute;function P(e,t,r,i){if(!r)return;Object.defineProperty(e,t,{enumerable:r.enumerable,configurable:r.configurable,writable:r.writable,value:r.initializer?r.initializer.call(i):void 0})}function I(e){if(e===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return e}function T(e,t){e.prototype=Object.create(t.prototype);e.prototype.constructor=e;x(e,t)}function x(e,t){x=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(t,r){t.__proto__=r;return t};return x(e,t)}function E(e,t,r,i,n){var u={};Object.keys(i).forEach(function(e){u[e]=i[e]});u.enumerable=!!u.enumerable;u.configurable=!!u.configurable;if("value"in u||u.initializer){u.writable=true}u=r.slice().reverse().reduce(function(r,i){return i(e,t,r)||r},u);if(n&&u.initializer!==void 0){u.value=u.initializer?u.initializer.call(n):void 0;u.initializer=undefined}if(u.initializer===void 0){Object.defineProperty(e,t,u);u=null}return u}function _(e,t){throw new Error("Decorating class property failed. Please ensure that "+"proposal-class-properties is enabled and runs after the decorators transform.")}let q=(i=O({name:"KPITag",namespace:"sap.fe.macros"}),n=j({type:"string",required:true}),u=j({type:"string"}),a=j({type:"string",allowedValues:["Success","Error","Warning","None","Information"]}),l=j({type:"string"}),o=$(),s=j({type:"number",required:true}),c=j({type:"string"}),p=j({type:"boolean",required:false}),i(b=(f=function(e){T(t,e);function t(){var t;for(var r=arguments.length,i=new Array(r),n=0;n<r;n++){i[n]=arguments[n]}t=e.call(this,...i)||this;P(t,"id",d,I(t));P(t,"text",g,I(t));P(t,"status",m,I(t));P(t,"tooltip",y,I(t));P(t,"press",h,I(t));P(t,"number",v,I(t));P(t,"unit",w,I(t));P(t,"showIcon",z,I(t));return t}B=t;var r=t.prototype;r.getTemplate=function e(){return k`<m:GenericTag
			id="${this.id}"
			text="${this.text}"
			design="${this.showIcon?"Full":"StatusIconHidden"}"
			status="${this.status}"
			class="sapUiTinyMarginBegin"
			tooltip="${this.tooltip}"
			press="${this.press}"
		>
			<m:ObjectNumber
				state="${this.status}"
				emphasized="false"
				number="${this.number}"
				unit="${this.unit}"

			/>
		</m:GenericTag>`};return t}(e),d=E(f.prototype,"id",[n],{configurable:true,enumerable:true,writable:true,initializer:null}),g=E(f.prototype,"text",[u],{configurable:true,enumerable:true,writable:true,initializer:null}),m=E(f.prototype,"status",[a],{configurable:true,enumerable:true,writable:true,initializer:function(){return"None"}}),y=E(f.prototype,"tooltip",[l],{configurable:true,enumerable:true,writable:true,initializer:null}),h=E(f.prototype,"press",[o],{configurable:true,enumerable:true,writable:true,initializer:null}),v=E(f.prototype,"number",[s],{configurable:true,enumerable:true,writable:true,initializer:null}),w=E(f.prototype,"unit",[c],{configurable:true,enumerable:true,writable:true,initializer:null}),z=E(f.prototype,"showIcon",[p],{configurable:true,enumerable:true,writable:true,initializer:function(){return false}}),f))||b);B=q;return B},false);
//# sourceMappingURL=KPITag.block.js.map