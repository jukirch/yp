/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/fe/core/TemplateModel","sap/fe/core/buildingBlocks/BuildingBlockBase","sap/fe/core/buildingBlocks/BuildingBlockSupport","sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor","sap/fe/core/converters/MetaModelConverter","sap/fe/core/converters/controls/Common/DataVisualization","sap/fe/core/converters/controls/ListReport/FilterBar","sap/fe/core/helpers/MetaModelFunction","sap/fe/core/helpers/ModelHelper","sap/fe/core/helpers/StableIdHelper","sap/fe/core/templating/FilterHelper","sap/fe/macros/CommonHelper"],function(e,t,r,i,a,l,n,o,s,u,c,p,d){"use strict";var f,b,h,g,m,y,v,F,C,P,S,B,w,I,$,_,D,x,z,A,M,k,E,H,T,R,O,V,L,N,j,q,U,J,X,G,W,K,Q,Y,Z,ee,te,re,ie,ae,le,ne,oe,se,ue,ce,pe,de,fe,be,he,ge,me,ye,ve,Fe,Ce;var Pe={};var Se=p.getFilterConditions;var Be=c.generate;var we=s.getSearchRestrictions;var Ie=o.getSelectionFields;var $e=n.getSelectionVariant;var _e=l.getInvolvedDataModelObjects;var De=a.xml;var xe=i.defineBuildingBlock;var ze=i.blockEvent;var Ae=i.blockAttribute;var Me=i.blockAggregation;function ke(e,t,r,i){if(!r)return;Object.defineProperty(e,t,{enumerable:r.enumerable,configurable:r.configurable,writable:r.writable,value:r.initializer?r.initializer.call(i):void 0})}function Ee(e){if(e===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return e}function He(e,t){e.prototype=Object.create(t.prototype);e.prototype.constructor=e;Te(e,t)}function Te(e,t){Te=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(t,r){t.__proto__=r;return t};return Te(e,t)}function Re(e,t,r,i,a){var l={};Object.keys(i).forEach(function(e){l[e]=i[e]});l.enumerable=!!l.enumerable;l.configurable=!!l.configurable;if("value"in l||l.initializer){l.writable=true}l=r.slice().reverse().reduce(function(r,i){return i(e,t,r)||r},l);if(a&&l.initializer!==void 0){l.value=l.initializer?l.initializer.call(a):void 0;l.initializer=undefined}if(l.initializer===void 0){Object.defineProperty(e,t,l);l=null}return l}function Oe(e,t){throw new Error("Decorating class property failed. Please ensure that "+"proposal-class-properties is enabled and runs after the decorators transform.")}const Ve=function(e,t){t.slotName=t.key;t.key=t.key.replace("InlineXML_","");t.label=e.getAttribute("label");t.required=e.getAttribute("required")==="true";return t};let Le=(f=xe({name:"FilterBar",namespace:"sap.fe.macros.internal",publicNamespace:"sap.fe.macros",returnTypes:["sap.fe.macros.filterBar.FilterBarAPI"]}),b=Ae({type:"string",isPublic:true}),h=Ae({type:"boolean",isPublic:true}),g=Ae({type:"sap.ui.model.Context"}),m=Ae({type:"string"}),y=Ae({type:"sap.ui.model.Context",isPublic:true}),v=Ae({type:"sap.ui.model.Context",isPublic:true}),F=Ae({type:"boolean",isPublic:true}),C=Ae({type:"string"}),P=Ae({type:"boolean"}),S=Ae({type:"boolean"}),B=Ae({type:"boolean"}),w=Ae({type:"sap.ui.mdc.FilterBarP13nMode[]"}),I=Ae({type:"string"}),$=Ae({type:"boolean"}),_=Ae({type:"boolean",isPublic:true}),D=Ae({type:"string",required:false}),x=Ae({type:"boolean"}),z=Ae({type:"boolean"}),A=Ae({type:"boolean"}),M=Ae({type:"string"}),k=Ae({type:"string"}),E=Ae({type:"boolean",isPublic:true}),H=Ae({type:"boolean"}),T=ze(),R=ze(),O=ze(),V=ze(),L=ze(),N=ze(),j=Me({type:"sap.fe.macros.FilterField",isPublic:true,hasVirtualNode:true,processAggregations:Ve}),f(q=(U=function(r){He(i,r);function i(i,a,l){var n,o,s,c,p;var f;f=r.call(this,i,a,l)||this;ke(f,"id",J,Ee(f));ke(f,"visible",X,Ee(f));ke(f,"selectionFields",G,Ee(f));ke(f,"filterBarDelegate",W,Ee(f));ke(f,"metaPath",K,Ee(f));ke(f,"contextPath",Q,Ee(f));ke(f,"showMessages",Y,Ee(f));ke(f,"variantBackreference",Z,Ee(f));ke(f,"hideBasicSearch",ee,Ee(f));ke(f,"enableFallback",te,Ee(f));ke(f,"showAdaptFiltersButton",re,Ee(f));ke(f,"p13nMode",ie,Ee(f));ke(f,"propertyInfo",ae,Ee(f));ke(f,"useSemanticDateRange",le,Ee(f));ke(f,"liveMode",ne,Ee(f));ke(f,"filterConditions",oe,Ee(f));ke(f,"suspendSelection",se,Ee(f));ke(f,"showDraftEditState",ue,Ee(f));ke(f,"isDraftCollaborative",ce,Ee(f));ke(f,"toggleControlId",pe,Ee(f));ke(f,"initialLayout",de,Ee(f));ke(f,"showClearButton",fe,Ee(f));ke(f,"_applyIdToContent",be,Ee(f));ke(f,"search",he,Ee(f));ke(f,"filterChanged",ge,Ee(f));ke(f,"stateChange",me,Ee(f));ke(f,"internalFilterChanged",ye,Ee(f));ke(f,"internalSearch",ve,Ee(f));ke(f,"afterClear",Fe,Ee(f));ke(f,"filterFields",Ce,Ee(f));f.checkIfCollaborationDraftSupported=e=>{if(u.isCollaborationDraftSupported(e)){f.isDraftCollaborative=true}};f.getEntityTypePath=e=>e[0].endsWith("/")?e[0]:e[0]+"/";f.getSearch=()=>{if(!f.hideBasicSearch){return De`<control:basicSearchField>
			<mdc:FilterField
				id="${Be([f.id,"BasicSearchField"])}"
				placeholder="{sap.fe.i18n>M_FILTERBAR_SEARCH}"
				conditions="{$filters>/conditions/$search}"
				dataType="sap.ui.model.odata.type.String"
				maxConditions="1"
			/>
		</control:basicSearchField>`}return""};f.processSelectionFields=()=>{var e,t,r,i;let a="";if(f.showDraftEditState){a=`<core:Fragment fragmentName="sap.fe.core.filter.DraftEditState" type="XML" />`}f._valueHelps=[];f._filterFields=[];(e=f._filterFields)===null||e===void 0?void 0:e.push(a);if(!Array.isArray(f.selectionFields)){f.selectionFields=f.selectionFields.getObject()}(t=f.selectionFields)===null||t===void 0?void 0:t.forEach((e,t)=>{if(e.availability==="Default"){f.setFilterFieldsAndValueHelps(e,t)}});f._filterFields=((r=f._filterFields)===null||r===void 0?void 0:r.length)>0?f._filterFields:"";f._valueHelps=((i=f._valueHelps)===null||i===void 0?void 0:i.length)>0?f._valueHelps:""};f.setFilterFieldsAndValueHelps=(e,t)=>{if(e.template===undefined&&e.type!=="Slot"){f.pushFilterFieldsAndValueHelps(e)}else if(Array.isArray(f._filterFields)){var r;(r=f._filterFields)===null||r===void 0?void 0:r.push(De`<template:with path="selectionFields>${t}" var="item">
					<core:Fragment fragmentName="sap.fe.macros.filter.CustomFilter" type="XML" />
				</template:with>`)}};f.pushFilterFieldsAndValueHelps=e=>{if(Array.isArray(f._filterFields)){var t;(t=f._filterFields)===null||t===void 0?void 0:t.push(De`<internalMacro:FilterField
			idPrefix="${Be([f.id,"FilterField",d.getNavigationPath(e.annotationPath)])}"
			vhIdPrefix="${Be([f.id,"FilterFieldValueHelp"])}"
			property="${e.annotationPath}"
			contextPath="${f._getContextPathForFilterField(e,f._internalContextPath)}"
			useSemanticDateRange="${f.useSemanticDateRange}"
			settings="${d.stringifyCustomData(e.settings)}"
			visualFilter="${e.visualFilter}"
			/>`)}if(Array.isArray(f._valueHelps)){var r;(r=f._valueHelps)===null||r===void 0?void 0:r.push(De`<macro:ValueHelp
			idPrefix="${Be([f.id,"FilterFieldValueHelp"])}"
			conditionModel="$filters"
			property="${e.annotationPath}"
			contextPath="${f._getContextPathForFilterField(e,f._internalContextPath)}"
			filterFieldValueHelp="true"
			useSemanticDateRange="${f.useSemanticDateRange}"
		/>`)}};if(!f.metaPath){e.error("Context Path not available for FilterBar Macro.");return Ee(f)}const b=f.metaPath.getPath();let h="";const g=(b===null||b===void 0?void 0:b.split("/@com.sap.vocabularies.UI.v1.SelectionFields"))||[];if(g.length>0){h=f.getEntityTypePath(g)}const m=u.getEntitySetPath(h);const y=(n=f.contextPath)===null||n===void 0?void 0:n.getModel();f._internalContextPath=y===null||y===void 0?void 0:y.createBindingContext(h);const v="@com.sap.vocabularies.UI.v1.SelectionFields";const F="@com.sap.vocabularies.UI.v1.SelectionFields"+(g.length&&g[1]||"");const C={};C[v]={filterFields:f.filterFields};const P=_e(f._internalContextPath);const S=f.getConverterContext(P,undefined,l,C);if(!f.propertyInfo){f.propertyInfo=Ie(S,[],F).sPropertyInfo}if(!f.selectionFields){const e=Ie(S,[],F).selectionFields;f.selectionFields=new t(e,y).createBindingContext("/");const r=S.getEntityType(),i=$e(r,S),a=y.getContext(m),l=Se(a,{selectionVariant:i});f.filterConditions=l}f._processPropertyInfos(f.propertyInfo);const B=_e(f.metaPath,f.contextPath).targetEntitySet;if(B!==null&&B!==void 0&&(o=B.annotations)!==null&&o!==void 0&&(s=o.Common)!==null&&s!==void 0&&s.DraftRoot||B!==null&&B!==void 0&&(c=B.annotations)!==null&&c!==void 0&&(p=c.Common)!==null&&p!==void 0&&p.DraftNode){f.showDraftEditState=true;f.checkIfCollaborationDraftSupported(y)}if(f._applyIdToContent){f._apiId=f.id+"::FilterBar";f._contentId=f.id}else{f._apiId=f.id;f._contentId=f.getContentId(f.id+"")}if(f.hideBasicSearch!==true){const e=we(m,y);f.hideBasicSearch=Boolean(e&&!e.Searchable)}f.processSelectionFields();return f}Pe=i;var a=i.prototype;a._processPropertyInfos=function e(t){const r=[];if(t){const e=t.replace(/\\{/g,"{").replace(/\\}/g,"}");const i=JSON.parse(e);const a=this.getTranslatedText("FILTERBAR_EDITING_STATUS");i.forEach(function(e){if(e.isParameter){r.push(e.name)}if(e.path==="$editState"){e.label=a}});this.propertyInfo=JSON.stringify(i).replace(/\{/g,"\\{").replace(/\}/g,"\\}")}this._parameters=JSON.stringify(r)};a._getContextPathForFilterField=function e(t,r){let i=r;if(t.isParameter){const e=t.annotationPath;i=e.substring(0,e.lastIndexOf("/")+1)}return i};a.getTemplate=function e(){var t;const r=(t=this._internalContextPath)===null||t===void 0?void 0:t.getPath();let i="";if(this.filterBarDelegate){i=this.filterBarDelegate}else{i="{name:'sap/fe/macros/filterBar/FilterBarDelegate', payload: {entityTypePath: '"+r+"'}}"}return De`<macroFilterBar:FilterBarAPI
        xmlns:template="http://schemas.sap.com/sapui5/extension/sap.ui.core.template/1"
        xmlns:core="sap.ui.core"
        xmlns:mdc="sap.ui.mdc"
        xmlns:control="sap.fe.core.controls"
        xmlns:macroFilterBar="sap.fe.macros.filterBar"
        xmlns:macro="sap.fe.macros"
        xmlns:internalMacro="sap.fe.macros.internal"
        xmlns:customData="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
		id="${this._apiId}"
		search="${this.search}"
		filterChanged="${this.filterChanged}"
		afterClear="${this.afterClear}"
		internalSearch="${this.internalSearch}"
		internalFilterChanged="${this.internalFilterChanged}"
		stateChange="${this.stateChange}"
	>
		<control:FilterBar
			core:require="{API: 'sap/fe/macros/filterBar/FilterBarAPI'}"
			id="${this._contentId}"
			liveMode="${this.liveMode}"
			delegate="${i}"
			variantBackreference="${this.variantBackreference}"
			showAdaptFiltersButton="${this.showAdaptFiltersButton}"
			showClearButton="${this.showClearButton}"
			p13nMode="${this.p13nMode}"
			search="API.handleSearch($event)"
			filtersChanged="API.handleFilterChanged($event)"
			filterConditions="${this.filterConditions}"
			suspendSelection="${this.suspendSelection}"
			showMessages="${this.showMessages}"
			toggleControl="${this.toggleControlId}"
			initialLayout="${this.initialLayout}"
			propertyInfo="${this.propertyInfo}"
			customData:localId="${this.id}"
			visible="${this.visible}"
			customData:hideBasicSearch="${this.hideBasicSearch}"
			customData:showDraftEditState="${this.showDraftEditState}"
			customData:useSemanticDateRange="${this.useSemanticDateRange}"
			customData:entityType="${r}"
			customData:parameters="${this._parameters}"
		>
			<control:dependents>
				${this._valueHelps}
			</control:dependents>
			${this.getSearch()}
			<control:filterItems>
				${this._filterFields}
			</control:filterItems>
		</control:FilterBar>
	</macroFilterBar:FilterBarAPI>`};return i}(r),J=Re(U.prototype,"id",[b],{configurable:true,enumerable:true,writable:true,initializer:null}),X=Re(U.prototype,"visible",[h],{configurable:true,enumerable:true,writable:true,initializer:null}),G=Re(U.prototype,"selectionFields",[g],{configurable:true,enumerable:true,writable:true,initializer:null}),W=Re(U.prototype,"filterBarDelegate",[m],{configurable:true,enumerable:true,writable:true,initializer:null}),K=Re(U.prototype,"metaPath",[y],{configurable:true,enumerable:true,writable:true,initializer:null}),Q=Re(U.prototype,"contextPath",[v],{configurable:true,enumerable:true,writable:true,initializer:null}),Y=Re(U.prototype,"showMessages",[F],{configurable:true,enumerable:true,writable:true,initializer:function(){return false}}),Z=Re(U.prototype,"variantBackreference",[C],{configurable:true,enumerable:true,writable:true,initializer:null}),ee=Re(U.prototype,"hideBasicSearch",[P],{configurable:true,enumerable:true,writable:true,initializer:null}),te=Re(U.prototype,"enableFallback",[S],{configurable:true,enumerable:true,writable:true,initializer:function(){return false}}),re=Re(U.prototype,"showAdaptFiltersButton",[B],{configurable:true,enumerable:true,writable:true,initializer:function(){return true}}),ie=Re(U.prototype,"p13nMode",[w],{configurable:true,enumerable:true,writable:true,initializer:function(){return"Item,Value"}}),ae=Re(U.prototype,"propertyInfo",[I],{configurable:true,enumerable:true,writable:true,initializer:null}),le=Re(U.prototype,"useSemanticDateRange",[$],{configurable:true,enumerable:true,writable:true,initializer:function(){return true}}),ne=Re(U.prototype,"liveMode",[_],{configurable:true,enumerable:true,writable:true,initializer:function(){return false}}),oe=Re(U.prototype,"filterConditions",[D],{configurable:true,enumerable:true,writable:true,initializer:null}),se=Re(U.prototype,"suspendSelection",[x],{configurable:true,enumerable:true,writable:true,initializer:function(){return false}}),ue=Re(U.prototype,"showDraftEditState",[z],{configurable:true,enumerable:true,writable:true,initializer:function(){return false}}),ce=Re(U.prototype,"isDraftCollaborative",[A],{configurable:true,enumerable:true,writable:true,initializer:function(){return false}}),pe=Re(U.prototype,"toggleControlId",[M],{configurable:true,enumerable:true,writable:true,initializer:null}),de=Re(U.prototype,"initialLayout",[k],{configurable:true,enumerable:true,writable:true,initializer:function(){return"compact"}}),fe=Re(U.prototype,"showClearButton",[E],{configurable:true,enumerable:true,writable:true,initializer:function(){return false}}),be=Re(U.prototype,"_applyIdToContent",[H],{configurable:true,enumerable:true,writable:true,initializer:function(){return false}}),he=Re(U.prototype,"search",[T],{configurable:true,enumerable:true,writable:true,initializer:null}),ge=Re(U.prototype,"filterChanged",[R],{configurable:true,enumerable:true,writable:true,initializer:null}),me=Re(U.prototype,"stateChange",[O],{configurable:true,enumerable:true,writable:true,initializer:null}),ye=Re(U.prototype,"internalFilterChanged",[V],{configurable:true,enumerable:true,writable:true,initializer:null}),ve=Re(U.prototype,"internalSearch",[L],{configurable:true,enumerable:true,writable:true,initializer:null}),Fe=Re(U.prototype,"afterClear",[N],{configurable:true,enumerable:true,writable:true,initializer:null}),Ce=Re(U.prototype,"filterFields",[j],{configurable:true,enumerable:true,writable:true,initializer:null}),U))||q);Pe=Le;return Pe},false);
//# sourceMappingURL=FilterBar.block.js.map