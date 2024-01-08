/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/fe/core/buildingBlocks/BuildingBlockBase","sap/fe/core/buildingBlocks/BuildingBlockSupport","sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor","sap/ui/core/Core"],function(e,r,t,i,a){"use strict";var n,o,l,u,s,c,f;var b={};var p=i.xml;var d=t.defineBuildingBlock;var m=t.blockAttribute;function g(e,r,t,i){if(!t)return;Object.defineProperty(e,r,{enumerable:t.enumerable,configurable:t.configurable,writable:t.writable,value:t.initializer?t.initializer.call(i):void 0})}function h(e){if(e===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return e}function y(e,r){e.prototype=Object.create(r.prototype);e.prototype.constructor=e;v(e,r)}function v(e,r){v=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(r,t){r.__proto__=t;return r};return v(e,r)}function w(e,r,t,i,a){var n={};Object.keys(i).forEach(function(e){n[e]=i[e]});n.enumerable=!!n.enumerable;n.configurable=!!n.configurable;if("value"in n||n.initializer){n.writable=true}n=t.slice().reverse().reduce(function(t,i){return i(e,r,t)||t},n);if(a&&n.initializer!==void 0){n.value=n.initializer?n.initializer.call(a):void 0;n.initializer=undefined}if(n.initializer===void 0){Object.defineProperty(e,r,n);n=null}return n}function P(e,r){throw new Error("Decorating class property failed. Please ensure that "+"proposal-class-properties is enabled and runs after the decorators transform.")}let B=(n=d({name:"Notes",namespace:"sap.fe.macros",libraries:["sap/nw/core/gbt/notes/lib/reuse"]}),o=m({type:"string",isPublic:true,required:true}),l=m({type:"sap.ui.model.Context",isPublic:true,required:true}),n(u=(s=function(r){y(t,r);function t(){var e;for(var t=arguments.length,i=new Array(t),a=0;a<t;a++){i[a]=arguments[a]}e=r.call(this,...i)||this;g(e,"id",c,h(e));g(e,"contextPath",f,h(e));return e}b=t;t.load=async function r(){if(this.metadata.libraries){try{await Promise.all(this.metadata.libraries.map(async e=>a.loadLibrary(e,{async:true})))}catch(r){const t=`Couldn't load building block ${this.metadata.name} please make sure the following libraries are available ${this.metadata.libraries.join(",")}`;e.error(t);throw new Error(t)}}return Promise.resolve(this)};var i=t.prototype;i.getTemplate=async function e(){try{await t.load()}catch(e){return p`<m:Label text="${e}"/>`}return p`<fpm:CustomFragment xmlns:fpm="sap.fe.macros.fpm" id="${this.id}" contextPath="{contextPath>}" fragmentName="sap.nw.core.gbt.notes.lib.reuse.fe.fragment.NoteList"/>`};return t}(r),c=w(s.prototype,"id",[o],{configurable:true,enumerable:true,writable:true,initializer:null}),f=w(s.prototype,"contextPath",[l],{configurable:true,enumerable:true,writable:true,initializer:null}),s))||u);b=B;return b},false);
//# sourceMappingURL=Notes.block.js.map