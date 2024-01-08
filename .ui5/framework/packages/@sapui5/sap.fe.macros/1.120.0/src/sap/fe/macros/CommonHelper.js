/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/fe/core/CommonUtils","sap/fe/core/helpers/BindingToolkit","sap/fe/core/helpers/MetaModelFunction","sap/fe/core/helpers/ModelHelper","sap/m/library","sap/ui/Device","sap/ui/mdc/enums/FieldEditMode","sap/ui/model/Context","sap/ui/model/odata/v4/AnnotationHelper"],function(t,e,n,i,o,r,a,s,c,l){"use strict";var u=i.isPropertyFilterable;var f=n.ref;var d=n.fn;var g=n.compileExpression;const p=r.ValueColor;const h={getPathToKey:function(t){return t.getObject()},isVisible:function(t,e){const n=e.context.getModel(),i=e.context.getPath(),o=n.getObject(`${i}@`),r=o["@com.sap.vocabularies.UI.v1.Hidden"];return typeof r==="object"?"{= !${"+r.$Path+"} }":!r},getParameterEditMode:function(t,e){const n=e.context.getModel(),i=e.context.getPath(),o=n.getObject(`${i}@`),r=o["@com.sap.vocabularies.Common.v1.FieldControl"],a=o["@Org.OData.Core.V1.Immutable"],c=o["@Org.OData.Core.V1.Computed"];let l=s.Editable;if(a||c){l=s.ReadOnly}else if(r){if(r.$EnumMember){if(r.$EnumMember==="com.sap.vocabularies.Common.v1.FieldControlType/ReadOnly"){l=s.ReadOnly}if(r.$EnumMember==="com.sap.vocabularies.Common.v1.FieldControlType/Inapplicable"||r.$EnumMember==="com.sap.vocabularies.Common.v1.FieldControlType/Hidden"){l=s.Disabled}}if(r.$Path){l="{= %{"+r.$Path+"} < 3 ? (%{"+r.$Path+"} === 0 ? '"+s.Disabled+"' : '"+s.ReadOnly+"') : '"+s.Editable+"'}"}}return l},getMetaPath:function(t,e){return e&&e.context&&e.context.getPath()||undefined},isDesktop:function(){return a.system.desktop===true},getTargetCollectionPath:function(t,e){let n=t.getPath();if(t.getMetadata().getName()==="sap.ui.model.Context"&&(t.getObject("$kind")==="EntitySet"||t.getObject("$ContainsTarget")===true)){return n}if(t.getModel){n=t.getModel().getMetaPath&&t.getModel().getMetaPath(n)||t.getModel().getMetaModel().getMetaPath(n)}const i=n.split("/").filter(function(t){return t&&t!="$Type"});const o=`/${i[0]}`;if(i.length===1){return o}const r=e===undefined?i.slice(1).join("/$NavigationPropertyBinding/"):e;return`${o}/$NavigationPropertyBinding/${r}`},isPropertyFilterable:function(t,e){const n=t.getModel(),i=t.getPath(),o=h.getLocationForPropertyPath(n,i),r=i.replace(`${o}/`,"");if(e&&(e.$Type==="com.sap.vocabularies.UI.v1.DataFieldForAction"||e.$Type==="com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation")){return false}return u(n,o,r)},getLocationForPropertyPath:function(t,e){let n;let i=e.slice(0,e.lastIndexOf("/"));if(t.getObject(`${i}/$kind`)==="EntityContainer"){n=i.length+1;i=e.slice(n,e.indexOf("/",n))}return i},gotoActionParameter:function(t){const n=t.getPath(),i=t.getObject(`${n}/$Name`);return e.getParameterPath(n,i)},getEntitySetName:function(t,e){const n=t.getObject("/");for(const t in n){if(typeof n[t]==="object"&&n[t].$Type===e){return t}}return undefined},getActionPath:function(t,e,n,i){let o=t.getPath().split("/@")[0];n=!n?t.getObject(t.getPath()):n;if(n&&n.includes("(")){n=n.split("(")[0]}else if(t.getObject(o)){const e=t.getObject(o).$Type;const n=this.getEntitySetName(t.getModel(),e);if(n){o=`/${n}`}}else{return o}if(i){return t.getObject(`${o}/${n}@Org.OData.Core.V1.OperationAvailable`)}if(e){return`${o}/${n}`}else{return{sContextPath:o,sProperty:t.getObject(`${o}/${n}@Org.OData.Core.V1.OperationAvailable/$Path`),sBindingParameter:t.getObject(`${o}/${n}/@$ui5.overload/0/$Parameter/0/$Name`)}}},getNavigationContext:function(t){return l.getNavigationPath(t.getPath())},getNavigationPath:function(t,e){const n=t.startsWith("/");const i=t.split("/").filter(function(t){return!!t});if(n){i.shift()}if(!e){i.pop()}return i.join("/")},getActionContext:function(t){return h.getActionPath(t,true)},getPathToBoundActionOverload:function(t){const e=h.getActionPath(t,true);return`${e}/@$ui5.overload/0`},addSingleQuotes:function(t,e){if(e&&t){t=this.escapeSingleQuotes(t)}return`'${t}'`},escapeSingleQuotes:function(t){return t.replace(/[']/g,"\\'")},generateFunction:function(t){let e="";for(let t=0;t<(arguments.length<=1?0:arguments.length-1);t++){e+=t+1<1||arguments.length<=t+1?undefined:arguments[t+1];if(t<(arguments.length<=1?0:arguments.length-1)-1){e+=", "}}let n=`${t}()`;if(e){n=`${t}(${e})`}return n},getHeaderDataPointLinkVisibility:function(t,e,n){let i;if(n){i=e?"{= ${internal>isHeaderDPLinkVisible/"+t+"} === true && "+n+"}":"{= ${internal>isHeaderDPLinkVisible/"+t+"} !== true && "+n+"}"}else{i=e?"{= ${internal>isHeaderDPLinkVisible/"+t+"} === true}":"{= ${internal>isHeaderDPLinkVisible/"+t+"} !== true}"}return i},objectToString:function(t){let e=Object.keys(t).length,n="";for(const i in t){let o=t[i];if(o&&typeof o==="object"){o=this.objectToString(o)}n+=`${i}: ${o}`;if(e>1){--e;n+=", "}}return`{ ${n}}`},removeEscapeCharacters:function(t){return t?t.replace(/\\?\\([{}])/g,"$1"):undefined},stringifyObject:function(e){if(!e||e==="{}"){return undefined}else{const n=JSON.parse(e);if(typeof n==="object"&&!Array.isArray(n)){const t={ui5object:true};Object.assign(t,n);return JSON.stringify(t)}else{const e=Array.isArray(n)?"Array":typeof n;t.error(`Unexpected object type in stringifyObject (${e}) - only works with object`);throw new Error("stringifyObject only works with objects!")}}},stringifyCustomData:function(t){const e={ui5object:true};e["customData"]=t instanceof c?t.getObject():t;return JSON.stringify(e)},parseCustomData:function(t){t=typeof t==="string"?JSON.parse(t):t;if(t&&t.hasOwnProperty("customData")){return t["customData"]}return t},getContextPath:function(t,e){const n=e&&e.context&&e.context.getPath();return n[n.length-1]==="/"?n.slice(0,-1):n},getSortConditions:function(t,e,n){if(e&&h._isPresentationVariantAnnotation(n)&&e.SortOrder){const n={sorters:[]};const i=t.getPath(0).split("@")[0];e.SortOrder.forEach(function(){let e=arguments.length>0&&arguments[0]!==undefined?arguments[0]:{};let o={};const r={};if(e.DynamicProperty){var a;o=(a=t.getModel(0).getObject(i+e.DynamicProperty.$AnnotationPath))===null||a===void 0?void 0:a.Name}else if(e.Property){o=e.Property.$PropertyPath}if(o){r.name=o;r.descending=!!e.Descending;n.sorters.push(r)}else{throw new Error("Please define the right path to the sort property")}});return JSON.stringify(n)}return undefined},_isPresentationVariantAnnotation:function(t){return t.includes(`@${"com.sap.vocabularies.UI.v1.PresentationVariant"}`)||t.includes(`@${"com.sap.vocabularies.UI.v1.SelectionPresentationVariant"}`)},createPresentationPathContext:function(t){const e=t.sPath.split("@")||[];const n=t.getModel();if(e.length&&e[e.length-1].indexOf("com.sap.vocabularies.UI.v1.SelectionPresentationVariant")>-1){const e=t.sPath.split("/PresentationVariant")[0];return n.createBindingContext(`${e}@sapui.name`)}return n.createBindingContext(`${t.sPath}@sapui.name`)},getPressHandlerForDataFieldForIBN:function(t,e,n){if(!t)return undefined;const i={navigationContexts:e?e:"${$source>/}.getBindingContext()"};if(t.RequiresContext&&!t.Inline&&n){i.applicableContexts="${internal>ibn/"+t.SemanticObject+"-"+t.Action+"/aApplicable/}";i.notApplicableContexts="${internal>ibn/"+t.SemanticObject+"-"+t.Action+"/aNotApplicable/}";i.label=this.addSingleQuotes(t.Label,true)}if(t.Mapping){i.semanticObjectMapping=this.addSingleQuotes(JSON.stringify(t.Mapping))}return this.generateFunction(n?"._intentBasedNavigation.navigateWithConfirmationDialog":"._intentBasedNavigation.navigate",this.addSingleQuotes(t.SemanticObject),this.addSingleQuotes(t.Action),this.objectToString(i))},getEntitySet:function(t){const e=t.getPath();return o.getEntitySetPath(e)},handleVisibilityOfMenuActions:function(t){const e=[];if(Array.isArray(t)){for(let n=0;n<t.length;n++){if(t[n].indexOf("{")>-1&&t[n].indexOf("{=")===-1){t[n]="{="+t[n]+"}"}if(t[n].split("{=").length>0){t[n]=t[n].split("{=")[1].slice(0,-1)}e.push(`(${t[n]})`)}}return e.length>0?`{= ${e.join(" || ")}}`:t},getCriticalityCalculationBinding:function(e,n,i,o,r,a,s,c){let l=p.Neutral;n=`%${n}`;i=i||-Infinity;o=o||i;r=r||o;c=c||Infinity;s=s||c;a=a||s;i=i&&(+i?+i:`%${i}`);o=o&&(+o?+o:`%${o}`);r=r&&(+r?+r:`%${r}`);a=a&&(+a?+a:`%${a}`);s=s&&(+s?+s:`%${s}`);c=c&&(+c?+c:`%${c}`);if(e.includes("Minimize")){l="{= "+n+" <= "+a+" ? '"+p.Good+"' : "+n+" <= "+s+" ? '"+p.Neutral+"' : "+"("+c+" && "+n+" <= "+c+") ? '"+p.Critical+"' : '"+p.Error+"' }"}else if(e.includes("Maximize")){l="{= "+n+" >= "+r+" ? '"+p.Good+"' : "+n+" >= "+o+" ? '"+p.Neutral+"' : "+"("+i+" && "+n+" >= "+i+") ? '"+p.Critical+"' : '"+p.Error+"' }"}else if(e.includes("Target")){l="{= ("+n+" <= "+a+" && "+n+" >= "+r+") ? '"+p.Good+"' : "+"(("+n+" >= "+o+" && "+n+" < "+r+") || ("+n+" > "+a+" && "+n+" <= "+s+")) ? '"+p.Neutral+"' : "+"(("+i+" && ("+n+" >= "+i+") && ("+n+" < "+o+")) || (("+n+" > "+s+") && "+c+" && ("+n+" <= "+c+"))) ? '"+p.Critical+"' : '"+p.Error+"' }"}else{t.warning("Case not supported, returning the default Value Neutral")}return l},getMeasureAttributeIndex:function(t,e){var n,i;let o,r;if((e===null||e===void 0?void 0:(n=e.Measures)===null||n===void 0?void 0:n.length)>0){o=e.Measures;r=o[t].$PropertyPath}else if((e===null||e===void 0?void 0:(i=e.DynamicMeasures)===null||i===void 0?void 0:i.length)>0){o=e.DynamicMeasures;r=o[t].$AnnotationPath}let a;const s=e.MeasureAttributes;let c=-1;const l=function(t,e,n){if(e){if(e.Measure&&e.Measure.$PropertyPath===t){c=n;return true}else if(e.DynamicMeasure&&e.DynamicMeasure.$AnnotationPath===t){c=n;return true}}};if(s){a=s.some(l.bind(null,r))}return a&&c>-1&&c},getMeasureAttribute:function(e){const n=e.getModel(),i=e.getPath();return n.requestObject(i).then(function(e){const n=e.MeasureAttributes,o=h.getMeasureAttributeIndex(0,e);const r=o>-1&&n[o]&&n[o].DataPoint?`${i}/MeasureAttributes/${o}/`:undefined;if(r===undefined){t.warning("DataPoint missing for the measure")}return r?`${r}DataPoint/$AnnotationPath/`:r})},getMeasureAttributeForMeasure:function(e){const n=e.getModel(),i=e.getPath(),o=i.substring(0,i.lastIndexOf("Measure")),r=i.replace(/.*\//,"");const a=n.getObject(o);const s=a.MeasureAttributes,c=h.getMeasureAttributeIndex(r,a);const l=c>-1&&s[c]&&s[c].DataPoint?`${o}MeasureAttributes/${c}/`:undefined;if(l===undefined){t.warning("DataPoint missing for the measure")}return l?`${l}DataPoint/$AnnotationPath/`:l},isDraftParentEntityForContainment:function(t,e){if(t){if(e&&e.parentEntitySet&&e.parentEntitySet.sPath){const t=e.parentEntitySet.sPath;const n=e.parentEntitySet.oModel.getObject(`${t}@com.sap.vocabularies.Common.v1.DraftRoot`);const i=e.parentEntitySet.oModel.getObject(`${t}@com.sap.vocabularies.Common.v1.DraftNode`);if(n||i){return true}else{return false}}}return false},getDataFromTemplate:function(t){const e=t.getPath().split("/");const n=e[e.length-1];const i=`/${e.slice(1,-2).join("/")}/@`;const o=t.getObject(i);const r=o.Template;const a=r.split("}");const s=[];for(let t=0;t<a.length-1;t++){const e=a[t].split("{")[1].trim();s.push(e)}Object.keys(o.Data).forEach(function(t){if(t.startsWith("$")){delete o.Data[t]}});const c=Object.keys(o.Data).indexOf(n);return`/${e.slice(1,-2).join("/")}/Data/${s[c]}`},notLastIndex:function(t,e){const n=t.Template;const i=n.split("}");const o=[];let r=false;for(let t=0;t<i.length-1;t++){const e=i[t].split("{")[1].trim();o.push(e)}o.forEach(function(n){const i=o.length-1;if(t.Data[n]===e&&o.indexOf(n)<i){r=true}});return r},getDelimiter:function(t){return t.split("}")[1].split("{")[0].trim()},oMetaModel:undefined,setMetaModel:function(t){this.oMetaModel=t},getMetaModel:function(t,e){if(t){return e.context.getModel()}return this.oMetaModel},getParameters:function(t,n){if(t){const t=n.context.getModel();const i=n.context.getPath();const o=e.getParameterInfo(t,i);if(o.parameterProperties){return Object.keys(o.parameterProperties)}}return[]},buildActionWrapper:function(t,e){const n=[f("$event"),t.handlerModule,t.handlerMethod];if(e&&e.id){const t={contexts:f("${internal>selectedContexts}")};n.push(t)}return g(d("FPM.actionWrapper",n))},getHiddenPathExpression:function(t){if(t["@com.sap.vocabularies.UI.v1.Hidden"]!==null){const e=t["@com.sap.vocabularies.UI.v1.Hidden"];return typeof e==="object"?"{= !${"+e.$Path+"} }":!e}return true},validatePresentationMetaPath:function(t,e){if(t.includes(e.slice(0,e.lastIndexOf(".")))){const n=["com.sap.vocabularies.UI.v1.PresentationVariant","com.sap.vocabularies.UI.v1.SelectionPresentationVariant",e];if(!n.some(e=>t.search(new RegExp(`${e}(#|/|$)`))>-1)){throw new Error(`Annotation Path ${t} mentioned in the manifest is not valid for ${e}`)}}}};h.getSortConditions.requiresIContext=true;return h},false);
//# sourceMappingURL=CommonHelper.js.map