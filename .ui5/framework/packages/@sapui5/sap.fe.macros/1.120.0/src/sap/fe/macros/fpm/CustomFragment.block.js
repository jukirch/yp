/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockBase","sap/fe/core/buildingBlocks/BuildingBlockSupport","sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor"],function(e,t,r){"use strict";var i,n,a,o,l,u,c,s,m,f,p;var g={};var d=r.xml;var b=t.defineBuildingBlock;var h=t.blockAttribute;var y=t.blockAggregation;function v(e,t,r,i){if(!r)return;Object.defineProperty(e,t,{enumerable:r.enumerable,configurable:r.configurable,writable:r.writable,value:r.initializer?r.initializer.call(i):void 0})}function C(e){if(e===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return e}function w(e,t){e.prototype=Object.create(t.prototype);e.prototype.constructor=e;k(e,t)}function k(e,t){k=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(t,r){t.__proto__=r;return t};return k(e,t)}function z(e,t,r,i,n){var a={};Object.keys(i).forEach(function(e){a[e]=i[e]});a.enumerable=!!a.enumerable;a.configurable=!!a.configurable;if("value"in a||a.initializer){a.writable=true}a=r.slice().reverse().reduce(function(r,i){return i(e,t,r)||r},a);if(n&&a.initializer!==void 0){a.value=a.initializer?a.initializer.call(n):void 0;a.initializer=undefined}if(a.initializer===void 0){Object.defineProperty(e,t,a);a=null}return a}function B(e,t){throw new Error("Decorating class property failed. Please ensure that "+"proposal-class-properties is enabled and runs after the decorators transform.")}let O=(i=b({name:"CustomFragment",namespace:"sap.fe.macros.fpm"}),n=h({type:"string",required:true}),a=h({type:"sap.ui.model.Context",required:false}),o=h({type:"string",required:true}),l=y({type:"sap.ui.core.CustomData",slot:"childCustomData"}),i(u=(c=function(e){w(t,e);function t(){var t;for(var r=arguments.length,i=new Array(r),n=0;n<r;n++){i[n]=arguments[n]}t=e.call(this,...i)||this;v(t,"id",s,C(t));v(t,"contextPath",m,C(t));v(t,"fragmentName",f,C(t));v(t,"childCustomData",p,C(t));return t}g=t;var r=t.prototype;r.getTemplate=function e(){const t=this.fragmentName+"-JS".replace(/\//g,".");const r=this.childCustomData;const i={};let n=r===null||r===void 0?void 0:r.firstElementChild;while(n){const e=n.getAttribute("key");if(e!==null){i[e]=n.getAttribute("value")}n=n.nextElementSibling}return d`<macros:CustomFragmentFragment
			xmlns:compo="http://schemas.sap.com/sapui5/extension/sap.ui.core.xmlcomposite/1"
			xmlns:macros="sap.fe.macros.fpm"
			fragmentName="${t}"
			${this.attr("childCustomData",Object.keys(i).length?JSON.stringify(i):undefined)}
			id="${this.id}"
			type="CUSTOM"
		>
			<compo:fragmentContent>
				<core:FragmentDefinition>
					<core:Fragment fragmentName="${this.fragmentName}" type="XML"/>
				</core:FragmentDefinition>
			</compo:fragmentContent>
		</macros:CustomFragmentFragment>`};return t}(e),s=z(c.prototype,"id",[n],{configurable:true,enumerable:true,writable:true,initializer:null}),m=z(c.prototype,"contextPath",[a],{configurable:true,enumerable:true,writable:true,initializer:null}),f=z(c.prototype,"fragmentName",[o],{configurable:true,enumerable:true,writable:true,initializer:null}),p=z(c.prototype,"childCustomData",[l],{configurable:true,enumerable:true,writable:true,initializer:null}),c))||u);g=O;return g},false);
//# sourceMappingURL=CustomFragment.block.js.map