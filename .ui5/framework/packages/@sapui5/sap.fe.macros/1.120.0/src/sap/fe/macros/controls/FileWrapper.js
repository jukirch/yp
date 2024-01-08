/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils","sap/fe/core/controllerextensions/collaboration/ActivitySync","sap/fe/core/converters/MetaModelConverter","sap/fe/core/helpers/ClassSupport","sap/fe/core/helpers/ResourceModelHelper","sap/m/BusyDialog","./FieldWrapper"],function(e,t,i,r,a,l,n){"use strict";var o,s,u,p,c,f,d,h,y,b,g,v,m,w,_,C,B,z,E,P,x,U,A;var I=a.getResourceModel;var S=r.property;var T=r.defineUI5Class;var L=r.aggregation;function D(e,t,i,r){if(!i)return;Object.defineProperty(e,t,{enumerable:i.enumerable,configurable:i.configurable,writable:i.writable,value:i.initializer?i.initializer.call(r):void 0})}function M(e){if(e===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return e}function O(e,t){e.prototype=Object.create(t.prototype);e.prototype.constructor=e;j(e,t)}function j(e,t){j=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(t,i){t.__proto__=i;return t};return j(e,t)}function k(e,t,i,r,a){var l={};Object.keys(r).forEach(function(e){l[e]=r[e]});l.enumerable=!!l.enumerable;l.configurable=!!l.configurable;if("value"in l||l.initializer){l.writable=true}l=i.slice().reverse().reduce(function(i,r){return r(e,t,i)||i},l);if(a&&l.initializer!==void 0){l.value=l.initializer?l.initializer.call(a):void 0;l.initializer=undefined}if(l.initializer===void 0){Object.defineProperty(e,t,l);l=null}return l}function R(e,t){throw new Error("Decorating class property failed. Please ensure that "+"proposal-class-properties is enabled and runs after the decorators transform.")}let V=(o=T("sap.fe.macros.controls.FileWrapper"),s=S({type:"sap.ui.core.URI"}),u=S({type:"string"}),p=S({type:"string"}),c=S({type:"string"}),f=L({type:"sap.m.Avatar",multiple:false}),d=L({type:"sap.ui.core.Icon",multiple:false}),h=L({type:"sap.m.Link",multiple:false}),y=L({type:"sap.m.Text",multiple:false}),b=L({type:"sap.ui.unified.FileUploader",multiple:false}),g=L({type:"sap.m.Button",multiple:false}),o(v=(m=function(r){O(a,r);function a(){var e;for(var t=arguments.length,i=new Array(t),a=0;a<t;a++){i[a]=arguments[a]}e=r.call(this,...i)||this;D(e,"uploadUrl",w,M(e));D(e,"propertyPath",_,M(e));D(e,"filename",C,M(e));D(e,"mediaType",B,M(e));D(e,"avatar",z,M(e));D(e,"icon",E,M(e));D(e,"link",P,M(e));D(e,"text",x,M(e));D(e,"fileUploader",U,M(e));D(e,"deleteButton",A,M(e));e._busy=false;e.avatarCacheBustingInitialized=false;return e}var o=a.prototype;o.getAccessibilityInfo=function e(){const t=[];if(this.avatar){t.push(this.avatar)}if(this.icon){t.push(this.icon)}if(this.link){t.push(this.link)}if(this.text){t.push(this.text)}if(this.fileUploader){t.push(this.fileUploader)}if(this.deleteButton){t.push(this.deleteButton)}return{children:t}};o.onBeforeRendering=function e(){this._setAriaLabels();this._addSideEffects();this._refreshAvatar()};o._refreshAvatar=function i(){if(t.isCollaborationEnabled(e.getTargetView(this))){var r;const e=(r=this.avatar)===null||r===void 0?void 0:r.getBindingInfo("src").binding;if(e&&!this.avatarCacheBustingInitialized){e.attachEvent("change",()=>{var e;(e=this.avatar)===null||e===void 0?void 0:e.refreshAvatarCacheBusting()});this.avatarCacheBustingInitialized=true}}};o._setAriaLabels=function e(){this._setAriaLabelledBy(this.avatar);this._setAriaLabelledBy(this.icon);this._setAriaLabelledBy(this.link);this._setAriaLabelledBy(this.text);this._setAriaLabelledBy(this.fileUploader);this._setAriaLabelledBy(this.deleteButton)};o._addSideEffects=function t(){var r;const a=[],l=e.getTargetView(this),n=l.getViewData().fullContextPath,o=l.getModel().getMetaModel(),s=o.getMetaPath(n),u=o.getContext(n),p=i.getInvolvedDataModelObjects(u),c=this.data("sourcePath"),f=c.replace(`${s}`,""),d=f.replace(this.propertyPath,"");a.push({$NavigationPropertyPath:f});if(this.filename){a.push({$NavigationPropertyPath:d+this.filename})}if(this.mediaType){a.push({$NavigationPropertyPath:d+this.mediaType})}(r=this._getSideEffectController())===null||r===void 0?void 0:r.addControlSideEffects(p.targetEntityType.fullyQualifiedName,{sourceProperties:[f],targetEntities:a,sourceControlId:this.getId()})};o._getSideEffectController=function e(){const t=this._getViewController();return t?t._sideEffects:undefined};o._getViewController=function t(){const i=e.getTargetView(this);return i&&i.getController()};o.getUploadUrl=function e(){const t=this.getBindingContext();return t&&this.uploadUrl?this.uploadUrl.replace(t.getPath(),t.getCanonicalPath()):""};o.setUIBusy=function e(t){const i=this;this._busy=t;if(t){if(!this.busyDialog){this.busyDialog=new l({text:I(this).getText("M_FILEWRAPPER_BUSY_DIALOG_TITLE"),showCancelButton:false})}setTimeout(function(){if(i._busy){var e;(e=i.busyDialog)===null||e===void 0?void 0:e.open()}},1e3)}else{var r;(r=this.busyDialog)===null||r===void 0?void 0:r.close(false)}};o.getUIBusy=function e(){return this._busy};a.render=function e(t,i){t.openStart("div",i);t.style("width",i.width);t.openEnd();t.openStart("div");t.style("display","flex");t.style("box-sizing","border-box");t.style("justify-content","space-between");t.style("align-items","center");t.style("flex-wrap","wrap");t.style("align-content","stretch");t.style("width","100%");t.openEnd();t.openStart("div");t.style("display","flex");t.style("align-items","center");t.openEnd();if(i.avatar){t.renderControl(i.avatar)}else{t.renderControl(i.icon);t.renderControl(i.link);t.renderControl(i.text)}t.close("div");t.openStart("div");t.style("display","flex");t.style("align-items","center");t.openEnd();t.renderControl(i.fileUploader);t.renderControl(i.deleteButton);t.close("div");t.close("div");t.close("div")};o.destroy=function e(t){const i=this._getSideEffectController();if(i){i.removeControlSideEffects(this)}delete this.busyDialog;n.prototype.destroy.apply(this,[t])};return a}(n),w=k(m.prototype,"uploadUrl",[s],{configurable:true,enumerable:true,writable:true,initializer:null}),_=k(m.prototype,"propertyPath",[u],{configurable:true,enumerable:true,writable:true,initializer:null}),C=k(m.prototype,"filename",[p],{configurable:true,enumerable:true,writable:true,initializer:null}),B=k(m.prototype,"mediaType",[c],{configurable:true,enumerable:true,writable:true,initializer:null}),z=k(m.prototype,"avatar",[f],{configurable:true,enumerable:true,writable:true,initializer:null}),E=k(m.prototype,"icon",[d],{configurable:true,enumerable:true,writable:true,initializer:null}),P=k(m.prototype,"link",[h],{configurable:true,enumerable:true,writable:true,initializer:null}),x=k(m.prototype,"text",[y],{configurable:true,enumerable:true,writable:true,initializer:null}),U=k(m.prototype,"fileUploader",[b],{configurable:true,enumerable:true,writable:true,initializer:null}),A=k(m.prototype,"deleteButton",[g],{configurable:true,enumerable:true,writable:true,initializer:null}),m))||v);return V},false);
//# sourceMappingURL=FileWrapper.js.map