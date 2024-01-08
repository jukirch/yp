/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/fe/core/buildingBlocks/BuildingBlockBase","sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor","sap/fe/core/buildingBlocks/RuntimeBuildingBlockFragment","sap/fe/core/helpers/TypeGuards","sap/ui/core/Core"],function(e,t,i,r,n,o){"use strict";var s={};var a=n.isContext;var c=r.storeRuntimeBlock;var u=i.xml;var l=i.registerBuildingBlock;function p(e,t){e.prototype=Object.create(t.prototype);e.prototype.constructor=e;f(e,t)}function f(e,t){f=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(t,i){t.__proto__=i;return t};return f(e,t)}let d=function(t){p(i,t);function i(){return t.apply(this,arguments)||this}s=i;i.register=function e(){l(this);c(this)};i.load=async function t(){if(this.metadata.libraries){try{await Promise.all(this.metadata.libraries.map(async e=>o.loadLibrary(e,{async:true})))}catch(t){const i=`Couldn't load building block ${this.metadata.name} please make sure the following libraries are available ${this.metadata.libraries.join(",")}`;e.error(i);throw new Error(i)}}return Promise.resolve(this)};var r=i.prototype;r.getTemplate=function e(t){const i=this.constructor.metadata;const r=`${i.namespace??i.publicNamespace}.${i.name}`;const n=[];const o=[];const s=[];const c=[];for(const e in i.properties){let t=this[e];if(t!==undefined&&t!==null){if(a(t)){t=t.getPath()}if(i.properties[e].type==="function"){o.push(t);c.push(t);s.push(e)}else{n.push(u`feBB:${e}="${t}"`)}}}if(o.length>0){n.push(u`functionHolder="${o.join(";")}"`);n.push(u`feBB:functionStringInOrder="${c.join(",")}"`);n.push(u`feBB:propertiesAssignedToFunction="${s.join(",")}"`)}return u`<feBB:RuntimeBuildingBlockFragment
					xmlns:core="sap.ui.core"
					xmlns:feBB="sap.fe.core.buildingBlocks"
					fragmentName="${r}"

					id="{this>id}"
					type="FE_COMPONENTS"
					${n.length>0?n:""}
				>
				</feBB:RuntimeBuildingBlockFragment>`};return i}(t);d.isRuntime=true;s=d;return s},false);
//# sourceMappingURL=RuntimeBuildingBlock.js.map