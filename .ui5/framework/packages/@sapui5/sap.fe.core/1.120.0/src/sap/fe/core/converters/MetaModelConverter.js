/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/common/AnnotationConverter","sap/fe/core/helpers/TypeGuards","../helpers/StableIdHelper"],function(e,t,n){"use strict";var i={};var o=n.prepareId;var a=t.isSingleton;var r=t.isServiceObject;var l=t.isNavigationProperty;var s=t.isEntityType;var p=t.isEntitySet;var y=t.isEntityContainer;const f={Chart:true,MicroChart:true,UShell:true,IntentBasedNavigation:true,AppState:true,InsightsSupported:false};i.DefaultEnvironmentCapabilities=f;function c(e,t,n,i,o){let a;const r=typeof e;if(e===null){a={type:"Null",Null:null}}else if(r==="string"){a={type:"String",String:e}}else if(r==="boolean"){a={type:"Bool",Bool:e}}else if(r==="number"){a={type:"Int",Int:e}}else if(Array.isArray(e)){a={type:"Collection",Collection:e.map((e,a)=>u(e,`${n}/${t}/${a}`,i,o))};if(e.length>0){if(e[0].hasOwnProperty("$PropertyPath")){a.Collection.type="PropertyPath"}else if(e[0].hasOwnProperty("$Path")){a.Collection.type="Path"}else if(e[0].hasOwnProperty("$NavigationPropertyPath")){a.Collection.type="NavigationPropertyPath"}else if(e[0].hasOwnProperty("$AnnotationPath")){a.Collection.type="AnnotationPath"}else if(e[0].hasOwnProperty("$Type")){a.Collection.type="Record"}else if(e[0].hasOwnProperty("$If")){a.Collection.type="If"}else if(e[0].hasOwnProperty("$Or")){a.Collection.type="Or"}else if(e[0].hasOwnProperty("$And")){a.Collection.type="And"}else if(e[0].hasOwnProperty("$Eq")){a.Collection.type="Eq"}else if(e[0].hasOwnProperty("$Ne")){a.Collection.type="Ne"}else if(e[0].hasOwnProperty("$Not")){a.Collection.type="Not"}else if(e[0].hasOwnProperty("$Gt")){a.Collection.type="Gt"}else if(e[0].hasOwnProperty("$Ge")){a.Collection.type="Ge"}else if(e[0].hasOwnProperty("$Lt")){a.Collection.type="Lt"}else if(e[0].hasOwnProperty("$Le")){a.Collection.type="Le"}else if(e[0].hasOwnProperty("$Apply")){a.Collection.type="Apply"}else if(typeof e[0]==="object"){a.Collection.type="Record"}else{a.Collection.type="String"}}}else if(e.$Path!==undefined){a={type:"Path",Path:e.$Path}}else if(e.$Decimal!==undefined){a={type:"Decimal",Decimal:parseFloat(e.$Decimal)}}else if(e.$PropertyPath!==undefined){a={type:"PropertyPath",PropertyPath:e.$PropertyPath}}else if(e.$NavigationPropertyPath!==undefined){a={type:"NavigationPropertyPath",NavigationPropertyPath:e.$NavigationPropertyPath}}else if(e.$If!==undefined){a={type:"If",If:e.$If}}else if(e.$And!==undefined){a={type:"And",And:e.$And}}else if(e.$Or!==undefined){a={type:"Or",Or:e.$Or}}else if(e.$Not!==undefined){a={type:"Not",Not:e.$Not}}else if(e.$Eq!==undefined){a={type:"Eq",Eq:e.$Eq}}else if(e.$Ne!==undefined){a={type:"Ne",Ne:e.$Ne}}else if(e.$Gt!==undefined){a={type:"Gt",Gt:e.$Gt}}else if(e.$Ge!==undefined){a={type:"Ge",Ge:e.$Ge}}else if(e.$Lt!==undefined){a={type:"Lt",Lt:e.$Lt}}else if(e.$Le!==undefined){a={type:"Le",Le:e.$Le}}else if(e.$Apply!==undefined){a={type:"Apply",Apply:e.$Apply,Function:e.$Function}}else if(e.$AnnotationPath!==undefined){a={type:"AnnotationPath",AnnotationPath:e.$AnnotationPath}}else if(e.$EnumMember!==undefined){a={type:"EnumMember",EnumMember:e.$EnumMember}}else{a={type:"Record",Record:u(e,n,i,o)}}return{name:t,value:a}}function u(e,t,n,i){let o={};const a=typeof e;if(e===null){o={type:"Null",Null:null}}else if(a==="string"){o={type:"String",String:e}}else if(a==="boolean"){o={type:"Bool",Bool:e}}else if(a==="number"){o={type:"Int",Int:e}}else if(e.$AnnotationPath!==undefined){o={type:"AnnotationPath",AnnotationPath:e.$AnnotationPath}}else if(e.$Path!==undefined){o={type:"Path",Path:e.$Path}}else if(e.$Decimal!==undefined){o={type:"Decimal",Decimal:parseFloat(e.$Decimal)}}else if(e.$PropertyPath!==undefined){o={type:"PropertyPath",PropertyPath:e.$PropertyPath}}else if(e.$If!==undefined){o={type:"If",If:e.$If}}else if(e.$And!==undefined){o={type:"And",And:e.$And}}else if(e.$Or!==undefined){o={type:"Or",Or:e.$Or}}else if(e.$Not!==undefined){o={type:"Not",Not:e.$Not}}else if(e.$Eq!==undefined){o={type:"Eq",Eq:e.$Eq}}else if(e.$Ne!==undefined){o={type:"Ne",Ne:e.$Ne}}else if(e.$Gt!==undefined){o={type:"Gt",Gt:e.$Gt}}else if(e.$Ge!==undefined){o={type:"Ge",Ge:e.$Ge}}else if(e.$Lt!==undefined){o={type:"Lt",Lt:e.$Lt}}else if(e.$Le!==undefined){o={type:"Le",Le:e.$Le}}else if(e.$Apply!==undefined){o={type:"Apply",Apply:e.$Apply,Function:e.$Function}}else if(e.$NavigationPropertyPath!==undefined){o={type:"NavigationPropertyPath",NavigationPropertyPath:e.$NavigationPropertyPath}}else if(e.$EnumMember!==undefined){o={type:"EnumMember",EnumMember:e.$EnumMember}}else if(Array.isArray(e)){const a=o;a.collection=e.map((e,o)=>u(e,`${t}/${o}`,n,i));if(e.length>0){if(e[0].hasOwnProperty("$PropertyPath")){a.collection.type="PropertyPath"}else if(e[0].hasOwnProperty("$Path")){a.collection.type="Path"}else if(e[0].hasOwnProperty("$NavigationPropertyPath")){a.collection.type="NavigationPropertyPath"}else if(e[0].hasOwnProperty("$AnnotationPath")){a.collection.type="AnnotationPath"}else if(e[0].hasOwnProperty("$Type")){a.collection.type="Record"}else if(e[0].hasOwnProperty("$If")){a.collection.type="If"}else if(e[0].hasOwnProperty("$And")){a.collection.type="And"}else if(e[0].hasOwnProperty("$Or")){a.collection.type="Or"}else if(e[0].hasOwnProperty("$Eq")){a.collection.type="Eq"}else if(e[0].hasOwnProperty("$Ne")){a.collection.type="Ne"}else if(e[0].hasOwnProperty("$Not")){a.collection.type="Not"}else if(e[0].hasOwnProperty("$Gt")){a.collection.type="Gt"}else if(e[0].hasOwnProperty("$Ge")){a.collection.type="Ge"}else if(e[0].hasOwnProperty("$Lt")){a.collection.type="Lt"}else if(e[0].hasOwnProperty("$Le")){a.collection.type="Le"}else if(e[0].hasOwnProperty("$Apply")){a.collection.type="Apply"}else if(typeof e[0]==="object"){a.collection.type="Record"}else{a.collection.type="String"}}}else{if(e.$Type){const t=e.$Type;o.type=t}const a=[];Object.keys(e).forEach(o=>{if(o!=="$Type"&&o!=="$If"&&o!=="$Apply"&&o!=="$And"&&o!=="$Or"&&o!=="$Ne"&&o!=="$Gt"&&o!=="$Ge"&&o!=="$Lt"&&o!=="$Le"&&o!=="$Not"&&o!=="$Eq"&&!o.startsWith("@")){a.push(c(e[o],o,t,n,i))}else if(o.startsWith("@")){v({[o]:e[o]},t,n,i)}});o.propertyValues=a}return o}function $(e,t){if(!t.hasOwnProperty(e)){t[e]={target:e,annotations:[]}}return t[e]}function d(e){const t=e.ID??e.Target.$AnnotationPath;return t?o(t):t}function h(e){return e.filter(e=>{if(e.Target&&e.Target.$AnnotationPath){return e.Target.$AnnotationPath.indexOf(`@${"com.sap.vocabularies.UI.v1.Chart"}`)===-1}else{return true}})}function P(e){return e.filter(e=>e.$Type!=="com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation")}function m(e){return e.filter(e=>e.$AnnotationPath!==`@${"com.sap.vocabularies.UI.v1.Chart"}`)}function v(e,t,n,i){var o;if(Object.keys(e).length===0){return}const a=$(t,n);if(!i.MicroChart){delete e[`@${"com.sap.vocabularies.UI.v1.Chart"}`]}for(const r in e){let l=r;let s=e[l];switch(l){case`@${"com.sap.vocabularies.UI.v1.HeaderFacets"}`:if(!i.MicroChart){s=h(s);e[l]=s}break;case`@${"com.sap.vocabularies.UI.v1.Identification"}`:if(!i.IntentBasedNavigation){s=P(s);e[l]=s}break;case`@${"com.sap.vocabularies.UI.v1.LineItem"}`:if(!i.IntentBasedNavigation){s=P(s);e[l]=s}if(!i.MicroChart){s=h(s);e[l]=s}break;case`@${"com.sap.vocabularies.UI.v1.FieldGroup"}`:if(!i.IntentBasedNavigation){s.Data=P(s.Data);e[l]=s}if(!i.MicroChart){s.Data=h(s.Data);e[l]=s}break;case`@${"com.sap.vocabularies.UI.v1.PresentationVariant"}`:if(!i.Chart&&s.Visualizations){s.Visualizations=m(s.Visualizations);e[l]=s}break;case`@com.sap.vocabularies.Common.v1.DraftRoot`:if(e[`@Org.OData.Capabilities.V1.FilterRestrictions`]&&(o=e[`@Org.OData.Capabilities.V1.FilterRestrictions`].FilterExpressionRestrictions)!==null&&o!==void 0&&o.length){if(!e[`@Org.OData.Capabilities.V1.FilterRestrictions`].FilterExpressionRestrictions.some(e=>{var t;return e===null||e===void 0?void 0:(t=e.Property)===null||t===void 0?void 0:t.$PropertyPath.includes("DraftAdministrativeData")})){e[`@Org.OData.Capabilities.V1.FilterRestrictions`].FilterExpressionRestrictions.push({$Type:"Org.OData.Capabilities.V1.FilterExpressionRestrictionType",AllowedExpressions:"SingleRange",Property:{$PropertyPath:"DraftAdministrativeData/CreationDateTime"}},{$Type:"Org.OData.Capabilities.V1.FilterExpressionRestrictionType",AllowedExpressions:"SingleRange",Property:{$PropertyPath:"DraftAdministrativeData/LastChangeDateTime"}})}}break;default:break}let p=a;const y=l.split("@");if(y.length>2){p=$(`${t}@${y[1]}`,n);l=y[2]}else{l=y[1]}const f=l.split("#");const d=f[1];l=f[0];const g={term:l,qualifier:d};let N=`${t}@${g.term}`;if(d){N+=`#${d}`}let O=false;const b=typeof s;if(s===null){g.value={type:"Null"}}else if(b==="string"){g.value={type:"String",String:s}}else if(b==="boolean"){g.value={type:"Bool",Bool:s}}else if(b==="number"){g.value={type:"Int",Int:s}}else if(s.$If!==undefined){g.value={type:"If",If:s.$If}}else if(s.$And!==undefined){g.value={type:"And",And:s.$And}}else if(s.$Or!==undefined){g.value={type:"Or",Or:s.$Or}}else if(s.$Not!==undefined){g.value={type:"Not",Not:s.$Not}}else if(s.$Eq!==undefined){g.value={type:"Eq",Eq:s.$Eq}}else if(s.$Ne!==undefined){g.value={type:"Ne",Ne:s.$Ne}}else if(s.$Gt!==undefined){g.value={type:"Gt",Gt:s.$Gt}}else if(s.$Ge!==undefined){g.value={type:"Ge",Ge:s.$Ge}}else if(s.$Lt!==undefined){g.value={type:"Lt",Lt:s.$Lt}}else if(s.$Le!==undefined){g.value={type:"Le",Le:s.$Le}}else if(s.$Apply!==undefined){g.value={type:"Apply",Apply:s.$Apply,Function:s.$Function}}else if(s.$Path!==undefined){g.value={type:"Path",Path:s.$Path}}else if(s.$AnnotationPath!==undefined){g.value={type:"AnnotationPath",AnnotationPath:s.$AnnotationPath}}else if(s.$Decimal!==undefined){g.value={type:"Decimal",Decimal:parseFloat(s.$Decimal)}}else if(s.$EnumMember!==undefined){g.value={type:"EnumMember",EnumMember:s.$EnumMember}}else if(Array.isArray(s)){O=true;g.collection=s.map((e,t)=>u(e,`${N}/${t}`,n,i));if(s.length>0){if(s[0].hasOwnProperty("$PropertyPath")){g.collection.type="PropertyPath"}else if(s[0].hasOwnProperty("$Path")){g.collection.type="Path"}else if(s[0].hasOwnProperty("$NavigationPropertyPath")){g.collection.type="NavigationPropertyPath"}else if(s[0].hasOwnProperty("$AnnotationPath")){g.collection.type="AnnotationPath"}else if(s[0].hasOwnProperty("$Type")){g.collection.type="Record"}else if(s[0].hasOwnProperty("$If")){g.collection.type="If"}else if(s[0].hasOwnProperty("$Or")){g.collection.type="Or"}else if(s[0].hasOwnProperty("$Eq")){g.collection.type="Eq"}else if(s[0].hasOwnProperty("$Ne")){g.collection.type="Ne"}else if(s[0].hasOwnProperty("$Not")){g.collection.type="Not"}else if(s[0].hasOwnProperty("$Gt")){g.collection.type="Gt"}else if(s[0].hasOwnProperty("$Ge")){g.collection.type="Ge"}else if(s[0].hasOwnProperty("$Lt")){g.collection.type="Lt"}else if(s[0].hasOwnProperty("$Le")){g.collection.type="Le"}else if(s[0].hasOwnProperty("$And")){g.collection.type="And"}else if(s[0].hasOwnProperty("$Apply")){g.collection.type="Apply"}else if(typeof s[0]==="object"){g.collection.type="Record"}else{g.collection.type="String"}}}else{const e={propertyValues:[]};if(s.$Type){const t=s.$Type;e.type=`${t}`}const t=[];for(const e in s){if(e!=="$Type"&&!e.startsWith("@")){t.push(c(s[e],e,N,n,i))}else if(e.startsWith("@")){v({[e]:s[e]},N,n,i)}}e.propertyValues=t;g.record=e}g.isCollection=O;p.annotations.push(g)}}function g(e,t,n){return{_type:"Property",name:n,fullyQualifiedName:`${t.fullyQualifiedName}/${n}`,type:e.$Type,maxLength:e.$MaxLength,precision:e.$Precision,scale:e.$Scale,nullable:e.$Nullable}}function N(e,t,n){let i=[];if(e.$ReferentialConstraint){i=Object.keys(e.$ReferentialConstraint).map(n=>({sourceTypeName:t.name,sourceProperty:n,targetTypeName:e.$Type,targetProperty:e.$ReferentialConstraint[n]}))}const o={_type:"NavigationProperty",name:n,fullyQualifiedName:`${t.fullyQualifiedName}/${n}`,partner:e.$Partner,isCollection:e.$isCollection?e.$isCollection:false,containsTarget:e.$ContainsTarget,targetTypeName:e.$Type,referentialConstraint:i};return o}function O(e,t){if(e){return Object.fromEntries(Object.entries(e).map(e=>{let[n,i]=e;return[n,`${t}/${i}`]}))}return{}}function b(e,t,n){return{_type:"EntitySet",name:t,navigationPropertyBinding:O(e.$NavigationPropertyBinding,n),entityTypeName:e.$Type,fullyQualifiedName:`${n}/${t}`}}function A(e,t,n){return{_type:"Singleton",name:t,navigationPropertyBinding:O(e.$NavigationPropertyBinding,n),entityTypeName:e.$Type,fullyQualifiedName:`${n}/${t}`,nullable:true}}function T(e,t,n){return{_type:"ActionImport",name:t,fullyQualifiedName:`${n}/${t}`,actionName:e.$Action}}function C(e,t,n){const i={_type:"TypeDefinition",name:t.substring(n.length),fullyQualifiedName:t,underlyingType:e.$UnderlyingType};return i}function I(e,t,n){const i={_type:"ComplexType",name:t.substring(n.length),fullyQualifiedName:t,properties:[],navigationProperties:[]};const o=Object.keys(e).filter(t=>{if(t!="$Key"&&t!="$kind"){return e[t].$kind==="Property"}}).sort((e,t)=>e>t?1:-1).map(t=>g(e[t],i,t));i.properties=o;const a=Object.keys(e).filter(t=>{if(t!="$Key"&&t!="$kind"){return e[t].$kind==="NavigationProperty"}}).sort((e,t)=>e>t?1:-1).map(t=>N(e[t],i,t));i.navigationProperties=a;return i}function w(e,t){if(!e.$Key&&e.$BaseType){return w(t[e.$BaseType],t)}return e.$Key??[]}function E(e,t,n,i){var o,a,r;const l={_type:"EntityType",name:t.substring(n.length),fullyQualifiedName:t,keys:[],entityProperties:[],navigationProperties:[],actions:{}};for(const t in e){const n=e[t];switch(n.$kind){case"Property":const e=g(n,l,t);l.entityProperties.push(e);break;case"NavigationProperty":const i=N(n,l,t);l.navigationProperties.push(i);break}}l.keys=w(e,i).map(e=>l.entityProperties.find(t=>t.name===e)).filter(e=>e!==undefined);(o=i.$Annotations[l.fullyQualifiedName])===null||o===void 0?void 0:(a=o[`@${"com.sap.vocabularies.UI.v1.FilterFacets"}`])===null||a===void 0?void 0:a.forEach(e=>{e.ID=d(e)});if(!!(l!==null&&l!==void 0&&l.keys.length)&&i.$Annotations[l.fullyQualifiedName]&&!((r=i.$Annotations[l.fullyQualifiedName])!==null&&r!==void 0&&r[`@${"com.sap.vocabularies.UI.v1.HeaderInfo"}`])){const e={$Type:`${"com.sap.vocabularies.UI.v1.HeaderInfoType"}`,TypeName:`${l.name}`,TypeNamePlural:"",Title:{$Type:`${"com.sap.vocabularies.UI.v1.DataField"}`,Value:{$Path:`${l.keys[0].name}`}}};i.$Annotations[l.fullyQualifiedName][`@${"com.sap.vocabularies.UI.v1.HeaderInfo"}`]=e}for(const e of l.entityProperties){if(!i.$Annotations[e.fullyQualifiedName]){i.$Annotations[e.fullyQualifiedName]={}}if(!i.$Annotations[e.fullyQualifiedName][`@${"com.sap.vocabularies.UI.v1.DataFieldDefault"}`]){i.$Annotations[e.fullyQualifiedName][`@${"com.sap.vocabularies.UI.v1.DataFieldDefault"}`]={$Type:"com.sap.vocabularies.UI.v1.DataField",Value:{$Path:e.name}}}}return l}function D(e,t,n){var i,o;let a;if(e.$kind==="Function"){a=e.$Parameter??[]}else{a=e.$IsBound?[e.$Parameter[0]]:[]}const r=a.map(e=>e.$isCollection?`Collection(${e.$Type})`:e.$Type).join(",");const l=`${t}(${r})`;const s=e.$Parameter??[];return{_type:"Action",name:t.substring(n.length),fullyQualifiedName:l,isBound:e.$IsBound??false,isFunction:e.$kind==="Function",sourceType:((i=a[0])===null||i===void 0?void 0:i.$Type)??"",returnType:((o=e.$ReturnType)===null||o===void 0?void 0:o.$Type)??"",parameters:s.map(e=>({_type:"ActionParameter",fullyQualifiedName:`${l}/${e.$Name}`,isCollection:e.$isCollection??false,name:e.$Name,type:e.$Type,nullable:e.$Nullable??false,maxLength:e.$MaxLength,precision:e.$Precision,scale:e.$Scale}))}}function L(e,t,n,i){i.entityContainer={_type:"EntityContainer",name:t.substring(e.length),fullyQualifiedName:t};for(const e in n){const o=n[e];switch(o.$kind){case"EntitySet":i.entitySets.push(b(o,e,t));break;case"Singleton":i.singletons.push(A(o,e,t));break;case"ActionImport":i.actionImports.push(T(o,e,t));break}}}function G(e,t){const n={};for(const i in e){v(e[i],i,n,t)}return Object.values(n)}function k(e){const t=Object.keys(e).find(t=>e[t].$kind==="Schema")??"";const n={namespace:t.slice(0,-1),entityContainer:{_type:"EntityContainer",name:"",fullyQualifiedName:""},entitySets:[],entityTypes:[],complexTypes:[],typeDefinitions:[],singletons:[],associations:[],associationSets:[],actions:[],actionImports:[],annotations:{}};const i=(i,o)=>{switch(o.$kind){case"EntityContainer":L(t,i,o,n);break;case"Action":case"Function":n.actions.push(D(o,i,t));break;case"EntityType":n.entityTypes.push(E(o,i,t,e));break;case"ComplexType":n.complexTypes.push(I(o,i,t));break;case"TypeDefinition":n.typeDefinitions.push(C(o,i,t));break}};for(const t in e){const n=e[t];if(Array.isArray(n)){for(const e of n){i(t,e)}}else{i(t,n)}}return n}function S(t){let n=arguments.length>1&&arguments[1]!==undefined?arguments[1]:f;const i={identification:"metamodelResult",version:"4.0",references:[]};e.lazy(i,"schema",()=>{const i=t.getObject("/$");const o=k(i);e.lazy(o.annotations,"metamodelResult",()=>G(i.$Annotations,n));return o});return i}i.parseMetaModel=S;const F={};function M(t,n){const i=t.id;if(!F.hasOwnProperty(i)){const o=S(t,n);try{F[i]=e.convert(o)}catch(e){throw new Error(e)}}return F[i]}i.convertTypes=M;function j(e){const t=e.getModel();if(!t.isA("sap.ui.model.odata.v4.ODataMetaModel")){throw new Error("This should only be called on a ODataMetaModel")}return M(t)}i.getConvertedTypes=j;function B(e){if(e){delete F[e.id]}}i.deleteModelCacheData=B;function R(e){let t=arguments.length>1&&arguments[1]!==undefined?arguments[1]:false;const n=M(e.getModel());const i=e.getPath();const o=i.split("/");let a=o[1];let r=2;if(n.entityContainer.fullyQualifiedName===a){a=o[2];r++}let l=n.entitySets.find(e=>e.name===a);if(!l){l=n.singletons.find(e=>e.name===a)}let s=o.slice(r).join("/");const p=[l];while(s&&s.length>0&&s.startsWith("$NavigationPropertyBinding")){var y;let e=s.split("/");let t=0;let n,i;e=e.slice(1);while(!n&&e.length>t){if(e[t]!=="$NavigationPropertyBinding"){i=e.slice(0,t+1).join("/").replace("/$NavigationPropertyBinding","");n=l&&l.navigationPropertyBinding[i]}t++}if(!n){i=e[0]}const o=((y=i)===null||y===void 0?void 0:y.split("/"))||[];let a=l&&l.entityType;for(const e of o){const t=a&&a.navigationProperties.find(t=>t.name===e);if(t){p.push(t);a=t.targetType}else{break}}l=l&&n||l&&l.navigationPropertyBinding[e[0]];if(l){p.push(l)}e=e.slice(o.length||1);if(e.length&&e[0]==="$"){e.shift()}s=e.join("/")}if(s.startsWith("$Type")){if(s.startsWith("$Type@")){s=s.replace("$Type","")}else{s=o.slice(3).join("/")}}if(l&&s.length){const e=l.entityType.resolvePath(s,t);if(e){if(t){e.visitedObjects=p.concat(e.visitedObjects)}}else if(l.entityType&&l.entityType.actions){const e=l.entityType&&l.entityType.actions;const t=s.split("/");if(e[t[0]]){const n=e[t[0]];if(t[1]&&n.parameters){const e=t[1];return n.parameters.find(t=>t.fullyQualifiedName.endsWith(`/${e}`))}else if(s.length===1){return n}}}return e}else{if(t){return{target:l,visitedObjects:p}}return l}}i.convertMetaModelContext=R;function Q(e,t){const n=M(e.getModel());const i=R(e,true);let o;if(t&&t.getPath()!=="/"){o=Q(t)}return x(i,n,o)}i.getInvolvedDataModelObjects=Q;function x(e,t,n){let i=arguments.length>3&&arguments[3]!==undefined?arguments[3]:false;const o=e.visitedObjects.filter(e=>r(e)&&!s(e)&&!y(e));if(r(e.target)&&!s(e.target)&&o[o.length-1]!==e.target&&!i){o.push(e.target)}const f=[];const c=o[0];let u=c;let $=c.entityType;let d;let h=[];for(let e=1;e<o.length;e++){d=o[e];if(l(d)){var P;h.push(d.name);f.push(d);$=d.targetType;const e=(P=u)===null||P===void 0?void 0:P.navigationPropertyBinding[h.join("/")];if(e!==undefined){u=e;h=[]}}if(p(d)||a(d)){u=d;$=u.entityType}}if(h.length>0){u=undefined}if(n&&n.startingEntitySet!==c){const e=o.indexOf(n.startingEntitySet);if(e!==-1){const t=o.slice(0,e);n.startingEntitySet=c;n.navigationProperties=t.filter(l).concat(n.navigationProperties)}}const m={startingEntitySet:c,targetEntitySet:u,targetEntityType:$,targetObject:e.target,navigationProperties:f,contextLocation:n,convertedTypes:t};if(!r(m.targetObject)&&i){m.targetObject=r(d)?d:undefined}if(!m.contextLocation){m.contextLocation=m}return m}i.getInvolvedDataModelObjectFromPath=x;return i},false);
//# sourceMappingURL=MetaModelConverter.js.map