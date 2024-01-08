/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/fe/core/buildingBlocks/BuildingBlockBase","sap/fe/core/buildingBlocks/BuildingBlockSupport","sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor","sap/fe/core/converters/MetaModelConverter","sap/fe/core/helpers/BindingToolkit","sap/fe/core/helpers/StableIdHelper","sap/fe/core/templating/DataModelPathHelper","sap/fe/core/templating/PropertyFormatters","sap/fe/macros/CommonHelper","sap/fe/macros/field/FieldHelper","sap/fe/macros/filter/FilterFieldHelper","sap/fe/macros/filter/FilterFieldTemplating"],function(e,t,i,r,a,n,l,o,s,u,c,p,d){"use strict";var f,m,b,v,h,y,g,P,F,x,$,C,B,O,T,w,z;var D={};var V=d.getFilterFieldDisplayFormat;var E=p.maxConditions;var I=p.isRequiredInFilter;var j=p.getPlaceholder;var k=p.getDataType;var H=p.getConditionsBinding;var q=p.formatOptions;var S=p.constraints;var A=s.getRelativePropertyPath;var L=o.getTargetObjectPath;var M=l.generate;var R=n.constant;var _=n.compileExpression;var W=r.xml;var U=r.SAP_UI_MODEL_CONTEXT;var N=i.defineBuildingBlock;var X=i.blockAttribute;function G(e,t,i,r){if(!i)return;Object.defineProperty(e,t,{enumerable:i.enumerable,configurable:i.configurable,writable:i.writable,value:i.initializer?i.initializer.call(r):void 0})}function J(e){if(e===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return e}function K(e,t){e.prototype=Object.create(t.prototype);e.prototype.constructor=e;Q(e,t)}function Q(e,t){Q=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(t,i){t.__proto__=i;return t};return Q(e,t)}function Y(e,t,i,r,a){var n={};Object.keys(r).forEach(function(e){n[e]=r[e]});n.enumerable=!!n.enumerable;n.configurable=!!n.configurable;if("value"in n||n.initializer){n.writable=true}n=i.slice().reverse().reduce(function(i,r){return r(e,t,i)||i},n);if(a&&n.initializer!==void 0){n.value=n.initializer?n.initializer.call(a):void 0;n.initializer=undefined}if(n.initializer===void 0){Object.defineProperty(e,t,n);n=null}return n}function Z(e,t){throw new Error("Decorating class property failed. Please ensure that "+"proposal-class-properties is enabled and runs after the decorators transform.")}let ee=(f=N({name:"FilterField",namespace:"sap.fe.macros.internal"}),m=X({type:"sap.ui.model.Context",required:true,isPublic:true}),b=X({type:"sap.ui.model.Context",required:true,isPublic:true}),v=X({type:"sap.ui.model.Context",isPublic:true}),h=X({type:"string",isPublic:true}),y=X({type:"string",isPublic:true}),g=X({type:"boolean",isPublic:true}),P=X({type:"string",isPublic:true}),f(F=(x=function(t){K(i,t);function i(e,i,r){var n,l,o,s;var p;p=t.call(this,e,i,r)||this;G(p,"property",$,J(p));G(p,"contextPath",C,J(p));G(p,"visualFilter",B,J(p));G(p,"idPrefix",O,J(p));G(p,"vhIdPrefix",T,J(p));G(p,"useSemanticDateRange",w,J(p));G(p,"settings",z,J(p));const d=a.convertMetaModelContext(p.property);const f=a.getInvolvedDataModelObjects(p.property,p.contextPath);const m=d.name,b=!!((n=d.annotations)!==null&&n!==void 0&&(l=n.Common)!==null&&l!==void 0&&l.ValueListWithFixedValues);p.controlId=p.idPrefix&&M([p.idPrefix,m]);p.sourcePath=L(f);p.dataType=k(d);const v=d===null||d===void 0?void 0:(o=d.annotations)===null||o===void 0?void 0:(s=o.Common)===null||s===void 0?void 0:s.Label;const h=(v===null||v===void 0?void 0:v.toString())??R(m);p.label=_(h)||m;p.conditionsBinding=H(f)||"";p.placeholder=j(d);p.vfEnabled=!!p.visualFilter&&!(p.idPrefix&&p.idPrefix.includes("Adaptation"));p.vfId=p.vfEnabled?M([p.idPrefix,m,"VisualFilter"]):undefined;const y=p.property,g=y.getModel(),P=c.valueHelpPropertyForFilterField(y),F=u.isPropertyFilterable(y),x=y.getObject(),D={context:y};p.display=V(f,d,D);p.isFilterable=!(F===false||F==="false");p.maxConditions=E(x,D);p.dataTypeConstraints=S(x,D);p.dataTypeFormatOptions=q(x,D);p.required=I(x,D);p.operators=c.operators(y,x,p.useSemanticDateRange,p.settings||"",p.contextPath.getPath());const W=g.createBindingContext(P);const U=W.getObject(),N={context:W},X=A(U,N),K=A(x,D);p.valueHelpProperty=c.getValueHelpPropertyForFilterField(y,x,x.$Type,p.vhIdPrefix,K,X,b,p.useSemanticDateRange);return p}D=i;var r=i.prototype;r.getVisualFilterContent=function e(){var t,i;let r=this.visualFilter,a="";if(!this.vfEnabled||!r){return a}if((t=r)!==null&&t!==void 0&&(i=t.isA)!==null&&i!==void 0&&i.call(t,U)){r=r.getObject()}const{contextPath:n,presentationAnnotation:l,outParameter:o,inParameters:s,valuelistProperty:c,selectionVariantAnnotation:p,multipleSelectionAllowed:d,required:f,requiredProperties:m=[],showOverlayInitially:b,renderLineChart:v,isValueListWithFixedValues:h}=r;a=W`
				<macro:VisualFilter
					id="${this.vfId}"
					contextPath="${n}"
					metaPath="${l}"
					outParameter="${o}"
					inParameters="${s}"
					valuelistProperty="${c}"
					selectionVariantAnnotation="${p}"
					multipleSelectionAllowed="${d}"
					required="${f}"
					requiredProperties="${u.stringifyCustomData(m)}"
					showOverlayInitially="${b}"
					renderLineChart="${v}"
					isValueListWithFixedValues="${h}"
					filterBarEntityType="${n}"
				/>
			`;return a};r.getTemplate=async function t(){let i=``;if(this.isFilterable){let t;try{t=await this.display}catch(t){e.error(`FE : FilterField BuildingBlock : Error fetching display property for ${this.sourcePath} : ${t}`)}i=W`
				<mdc:FilterField
					xmlns:mdc="sap.ui.mdc"
					xmlns:macro="sap.fe.macros"
					xmlns:unittest="http://schemas.sap.com/sapui5/preprocessorextension/sap.fe.unittesting/1"
					xmlns:customData="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
					unittest:id="UnitTest::FilterField"
					customData:sourcePath="${this.sourcePath}"
					id="${this.controlId}"
					delegate="{name: 'sap/fe/macros/field/FieldBaseDelegate', payload:{isFilterField:true}}"
					label="${this.label}"
					dataType="${this.dataType}"
					display="${t}"
					maxConditions="${this.maxConditions}"
					valueHelp="${this.valueHelpProperty}"
					conditions="${this.conditionsBinding}"
					dataTypeConstraints="${this.dataTypeConstraints}"
					dataTypeFormatOptions="${this.dataTypeFormatOptions}"
					required="${this.required}"
					operators="${this.operators}"
					placeholder="${this.placeholder}"

				>
					${this.vfEnabled?this.getVisualFilterContent():""}
				</mdc:FilterField>
			`}return i};return i}(t),$=Y(x.prototype,"property",[m],{configurable:true,enumerable:true,writable:true,initializer:null}),C=Y(x.prototype,"contextPath",[b],{configurable:true,enumerable:true,writable:true,initializer:null}),B=Y(x.prototype,"visualFilter",[v],{configurable:true,enumerable:true,writable:true,initializer:null}),O=Y(x.prototype,"idPrefix",[h],{configurable:true,enumerable:true,writable:true,initializer:function(){return"FilterField"}}),T=Y(x.prototype,"vhIdPrefix",[y],{configurable:true,enumerable:true,writable:true,initializer:function(){return"FilterFieldValueHelp"}}),w=Y(x.prototype,"useSemanticDateRange",[g],{configurable:true,enumerable:true,writable:true,initializer:function(){return true}}),z=Y(x.prototype,"settings",[P],{configurable:true,enumerable:true,writable:true,initializer:function(){return""}}),x))||F);D=ee;return D},false);
//# sourceMappingURL=FilterField.block.js.map