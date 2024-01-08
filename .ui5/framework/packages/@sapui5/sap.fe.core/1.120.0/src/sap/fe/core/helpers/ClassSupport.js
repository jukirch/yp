/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/merge","sap/base/util/ObjectPath","sap/base/util/uid","sap/ui/base/Metadata","sap/ui/core/mvc/ControllerMetadata"],function(t,e,n,r,o){"use strict";var i={};const a=function(e){e.metadata=t({controllerExtensions:{},properties:{},aggregations:{},associations:{},methods:{},events:{},interfaces:[]},e.metadata||{});return e.metadata};function s(t){return function(e,n){if(!e.override){e.override={}}let r=e.override;if(t){if(!r.extension){r.extension={}}if(!r.extension[t]){r.extension[t]={}}r=r.extension[t]}r[n.toString()]=e[n.toString()]}}i.methodOverride=s;function c(t){return function(e,n){const r=a(e);if(!r.methods[n.toString()]){r.methods[n.toString()]={}}r.methods[n.toString()].overrideExecution=t}}i.extensible=c;function u(){return function(t,e,n){const r=a(t);n.enumerable=true;if(!r.methods[e.toString()]){r.methods[e.toString()]={}}r.methods[e.toString()].public=true}}i.publicExtension=u;function d(){return function(t,e,n){const r=a(t);n.enumerable=true;if(!r.methods[e.toString()]){r.methods[e.toString()]={}}r.methods[e.toString()].public=false}}i.privateExtension=d;function f(){return function(t,e,n){const r=a(t);n.enumerable=true;if(!r.methods[e.toString()]){r.methods[e.toString()]={}}r.methods[e.toString()].final=true}}i.finalExtension=f;function l(t){return function(e,n,r){const o=a(e);delete r.initializer;o.controllerExtensions[n.toString()]=t;return r}}i.usingExtension=l;function g(){return function(t,e){const n=a(t);if(!n.events[e.toString()]){n.events[e.toString()]={}}}}i.event=g;function m(t){return function(e,n,r){const o=a(e);if(!o.properties[n]){o.properties[n]=t}delete r.writable;delete r.initializer;return r}}i.property=m;function p(t){return function(e,n,r){const o=a(e);if(t.multiple===undefined){t.multiple=false}if(!o.aggregations[n]){o.aggregations[n]=t}if(t.isDefault){o.defaultAggregation=n}delete r.writable;delete r.initializer;return r}}i.aggregation=p;function h(t){return function(e,n,r){const o=a(e);if(!o.associations[n]){o.associations[n]=t}delete r.writable;delete r.initializer;return r}}i.association=h;function v(t){return function(e){const n=a(e);n.interfaces.push(t)}}i.implementInterface=v;function y(){return function(t,e){const n=t.constructor;n[e.toString()]=function(){for(var t=arguments.length,r=new Array(t),o=0;o<t;o++){r[o]=arguments[o]}if(r&&r.length){const t=n.getAPI(r[0]);t===null||t===void 0?void 0:t[e.toString()](...r)}}}}i.xmlEventHandler=y;function b(t,e){return function(n){if(!n.prototype.metadata){n.prototype.metadata={}}if(e){for(const t in e){n.prototype.metadata[t]=e[t]}}return S(n,t,n.prototype)}}i.defineUI5Class=b;function x(){return{current:undefined,setCurrent:function(t){this.current=t}}}i.createReference=x;function E(){return function(t,e,n){delete n.writable;delete n.initializer;n.initializer=x;return n}}i.defineReference=E;function S(t,i,a){var s,c,u,d;if(t.getMetadata&&t.getMetadata().isA("sap.ui.core.mvc.ControllerExtension")){Object.getOwnPropertyNames(a).forEach(t=>{const e=Object.getOwnPropertyDescriptor(a,t);if(e&&!e.enumerable){e.enumerable=true}})}const f={};f.metadata=a.metadata||{};f.override=a.override;f.constructor=t;f.metadata.baseType=Object.getPrototypeOf(t.prototype).getMetadata().getName();if((t===null||t===void 0?void 0:(s=t.getMetadata())===null||s===void 0?void 0:s.getStereotype())==="control"){const e=a.renderer||t.renderer||t.render;f.renderer={apiVersion:2};if(typeof e==="function"){f.renderer.render=e}else if(e!=undefined){f.renderer=e}}f.metadata.interfaces=((c=a.metadata)===null||c===void 0?void 0:c.interfaces)||((u=t.metadata)===null||u===void 0?void 0:u.interfaces);Object.keys(t.prototype).forEach(e=>{if(e!=="metadata"){try{f[e]=t.prototype[e]}catch(t){}}});if((d=f.metadata)!==null&&d!==void 0&&d.controllerExtensions&&Object.keys(f.metadata.controllerExtensions).length>0){for(const t in f.metadata.controllerExtensions){f[t]=f.metadata.controllerExtensions[t]}}const l=t.extend(i,f);const g=l.prototype.init;l.prototype.init=function(){var t=this;if(g){for(var e=arguments.length,n=new Array(e),r=0;r<e;r++){n[r]=arguments[r]}g.apply(this,n)}this.metadata=f.metadata;if(f.metadata.properties){const t=Object.keys(f.metadata.properties);t.forEach(t=>{Object.defineProperty(this,t,{configurable:true,set:e=>this.setProperty(t,e),get:()=>this.getProperty(t)})});const e=Object.keys(f.metadata.aggregations);e.forEach(t=>{Object.defineProperty(this,t,{configurable:true,set:e=>this.setAggregation(t,e),get:()=>{const e=this.getAggregation(t);if(f.metadata.aggregations[t].multiple){return e||[]}else{return e}}})});const n=Object.keys(f.metadata.associations);n.forEach(t=>{Object.defineProperty(this,t,{configurable:true,set:e=>this.setAssociation(t,e),get:()=>{const e=this.getAssociation(t);if(f.metadata.associations[t].multiple){return e||[]}else{return e}}})})}if(f.metadata.methods){for(const e in f.metadata.methods){const n=f.metadata.methods[e];if(n.overrideExecution==="AfterAsync"||n.overrideExecution==="BeforeAsync"){if(!this.methodHolder){this.methodHolder=[]}this.methodHolder[e]=[this[e]];Object.defineProperty(this,e,{configurable:true,set:t=>this.methodHolder[e].push(t),get:()=>async function(){const r=t.methodHolder[e];if(n.overrideExecution==="BeforeAsync"){r.reverse()}for(var o=arguments.length,i=new Array(o),a=0;a<o;a++){i[a]=arguments[a]}for(const e of r){await e.apply(t,i)}}})}}}};t.override=function(e){const i={};i.constructor=function(){for(var e=arguments.length,n=new Array(e),r=0;r<e;r++){n[r]=arguments[r]}return t.apply(this,n)};const a=r.createClass(t,`anonymousExtension~${n()}`,i,o);a.getMetadata()._staticOverride=e;a.getMetadata()._override=t.getMetadata()._override;return a};e.set(i,l);return l}return i},false);
//# sourceMappingURL=ClassSupport.js.map