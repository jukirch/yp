/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockBase","sap/fe/core/buildingBlocks/BuildingBlockSupport","sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor","sap/fe/core/converters/MetaModelConverter","sap/fe/core/helpers/BindingToolkit","sap/fe/core/helpers/StableIdHelper","sap/fe/core/templating/DataModelPathHelper","sap/fe/macros/contact/ContactHelper"],function(e,t,i,r,a,n,l,o){"use strict";var s,c,u,p,d,f,b,m,h,y,g,v,P,w,x,B,z;var I={};var k=o.getMsTeamsMail;var C=l.getRelativePaths;var E=n.generate;var O=a.getExpressionFromAnnotation;var M=r.getInvolvedDataModelObjects;var T=r.convertMetaModelContext;var _=i.xml;var j=t.defineBuildingBlock;var F=t.blockAttribute;function D(e,t,i,r){if(!i)return;Object.defineProperty(e,t,{enumerable:i.enumerable,configurable:i.configurable,writable:i.writable,value:i.initializer?i.initializer.call(r):void 0})}function $(e){if(e===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return e}function L(e,t){e.prototype=Object.create(t.prototype);e.prototype.constructor=e;S(e,t)}function S(e,t){S=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(t,i){t.__proto__=i;return t};return S(e,t)}function R(e,t,i,r,a){var n={};Object.keys(r).forEach(function(e){n[e]=r[e]});n.enumerable=!!n.enumerable;n.configurable=!!n.configurable;if("value"in n||n.initializer){n.writable=true}n=i.slice().reverse().reduce(function(i,r){return r(e,t,i)||i},n);if(a&&n.initializer!==void 0){n.value=n.initializer?n.initializer.call(a):void 0;n.initializer=undefined}if(n.initializer===void 0){Object.defineProperty(e,t,n);n=null}return n}function A(e,t){throw new Error("Decorating class property failed. Please ensure that "+"proposal-class-properties is enabled and runs after the decorators transform.")}let H=(s=j({name:"Contact",namespace:"sap.fe.macros",designtime:"sap/fe/macros/Contact.designtime"}),c=F({type:"string"}),u=F({type:"string"}),p=F({type:"sap.ui.model.Context",expectedTypes:["com.sap.vocabularies.Communication.v1.ContactType"],required:true}),d=F({type:"sap.ui.model.Context",expectedTypes:["EntitySet","NavigationProperty","EntityType","Singleton"]}),f=F({type:"string"}),b=F({type:"boolean"}),m=F({type:"boolean"}),s(h=(y=function(e){L(t,e);function t(){var t;for(var i=arguments.length,r=new Array(i),a=0;a<i;a++){r[a]=arguments[a]}t=e.call(this,...r)||this;D(t,"idPrefix",g,$(t));D(t,"_flexId",v,$(t));D(t,"metaPath",P,$(t));D(t,"contextPath",w,$(t));D(t,"ariaLabelledBy",x,$(t));D(t,"visible",B,$(t));D(t,"showEmptyIndicator",z,$(t));return t}I=t;var i=t.prototype;i.getTemplate=function e(){let t;if(this._flexId){t=this._flexId}else{t=this.idPrefix?E([this.idPrefix,"Field-content"]):undefined}const i=T(this.metaPath);const r=M(this.metaPath,this.contextPath);const a=O(i.fn,C(r));const n={name:"sap/fe/macros/contact/ContactDelegate",payload:{contact:this.metaPath.getPath(),mail:k(r)}};return _`<mdc:Field
		xmlns:mdc="sap.ui.mdc"
		delegate="{name: 'sap/fe/macros/field/FieldBaseDelegate'}"
		${this.attr("id",t)}
		editMode="Display"
		width="100%"
		${this.attr("visible",this.visible)}
		${this.attr("showEmptyIndicator",this.showEmptyIndicator)}
		${this.attr("value",a)}
		${this.attr("ariaLabelledBy",this.ariaLabelledBy)}
	>
		<mdc:fieldInfo>
			<mdc:Link
				core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
				enablePersonalization="false"
				${this.attr("delegate",JSON.stringify(n))}
			/>
		</mdc:fieldInfo>
	</mdc:Field>
			`};return t}(e),g=R(y.prototype,"idPrefix",[c],{configurable:true,enumerable:true,writable:true,initializer:null}),v=R(y.prototype,"_flexId",[u],{configurable:true,enumerable:true,writable:true,initializer:null}),P=R(y.prototype,"metaPath",[p],{configurable:true,enumerable:true,writable:true,initializer:null}),w=R(y.prototype,"contextPath",[d],{configurable:true,enumerable:true,writable:true,initializer:null}),x=R(y.prototype,"ariaLabelledBy",[f],{configurable:true,enumerable:true,writable:true,initializer:null}),B=R(y.prototype,"visible",[b],{configurable:true,enumerable:true,writable:true,initializer:null}),z=R(y.prototype,"showEmptyIndicator",[m],{configurable:true,enumerable:true,writable:true,initializer:null}),y))||h);I=H;return I},false);
//# sourceMappingURL=Contact.block.js.map