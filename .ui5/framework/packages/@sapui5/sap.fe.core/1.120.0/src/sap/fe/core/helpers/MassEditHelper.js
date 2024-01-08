/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/fe/core/CommonUtils","sap/fe/core/TemplateModel","sap/fe/core/converters/annotations/DataField","sap/fe/core/helpers/BindingToolkit","sap/fe/core/helpers/TypeGuards","sap/fe/core/library","sap/fe/core/templating/DataModelPathHelper","sap/fe/core/templating/PropertyHelper","sap/fe/macros/field/FieldTemplating","sap/fe/macros/table/TableHelper","sap/m/Button","sap/m/Dialog","sap/m/MessageToast","sap/ui/core/Core","sap/ui/core/Fragment","sap/ui/core/XMLTemplateProcessor","sap/ui/core/util/XMLPreprocessor","sap/ui/mdc/enums/FieldEditMode","sap/ui/model/json/JSONModel","../controllerextensions/messageHandler/messageHandling","../controls/Any","../converters/MetaModelConverter","../templating/FieldControlHelper","../templating/UIFormatters"],function(e,t,n,o,a,i,r,s,l,u,d,c,p,f,g,y,P,h,v,x,E,m,b,T,O){"use strict";var F=O.isMultiValueField;var M=O.getRequiredExpression;var D=O.getEditMode;var C=T.isReadOnlyExpression;var V=b.getInvolvedDataModelObjects;var S=b.convertMetaModelContext;var B=u.setEditStyleProperties;var $=u.getTextBinding;var I=l.hasValueHelpWithFixedValues;var k=l.hasValueHelp;var j=l.hasUnit;var A=l.hasCurrency;var _=l.getAssociatedUnitPropertyPath;var w=l.getAssociatedUnitProperty;var H=s.getRelativePaths;var R=s.enhanceDataModelPath;var L=i.isProperty;var U=a.pathInModel;var N=a.or;var G=a.not;var q=a.ifElse;var Q=a.constant;var K=a.compileExpression;var X=o.isDataFieldTypes;var z=o.isDataFieldForIntentBasedNavigation;var J=o.isDataFieldForAnnotation;var Y=o.isDataFieldForAction;const W={initLastLevelOfPropertyPath:function(e,t){let n;let o=0;const a=e.split("/");let i="";a.forEach(function(a){if(!t[a]&&o===0){t[a]={};n=t[a];i=i+a;o++}else if(!n[a]){i=`${i}/${a}`;if(i!==e){n[a]={};n=n[a]}else{n[a]=[]}}});return n},getUniqueValues:function(e,t,n){return e!=undefined&&e!=null?n.indexOf(e)===t:undefined},getValueForMultiLevelPath:function(e,t){let n;if(e&&e.indexOf("/")>0){const o=e.split("/");o.forEach(function(e){n=t&&t[e]?t[e]:n&&n[e]})}return n},getDefaultSelectionPathComboBox:function(e,t){let n;if(t&&e.length>0){const o=e,a=[];o.forEach(function(e){const n=e.getObject();const o=t.includes("/")&&n.hasOwnProperty(t.split("/")[0]);if(e&&(n.hasOwnProperty(t)||o)){a.push(e.getObject(t))}});const i=a.filter(W.getUniqueValues);if(i.length>1){n=`Default/${t}`}else if(i.length===0){n=`Empty/${t}`}else if(i.length===1){n=`${t}/${i[0]}`}}return n},getHiddenValueForContexts:function(e,t){if(e&&e.$Path){return!t.some(function(t){return t.getObject(e.$Path)===false})}return e},getInputType:function(e,t,n){const o={};let a;if(e){B(o,t,n,true);a=(o===null||o===void 0?void 0:o.editStyle)||""}const i=a&&!["DatePicker","TimePicker","DateTimePicker","RatingIndicator"].includes(a)&&!F(n)&&!I(e);return(i||"")&&a},getIsFieldGrp:function(e){return e&&e.$Type==="com.sap.vocabularies.UI.v1.DataFieldForAnnotation"&&e.Target&&e.Target.value&&e.Target.value.indexOf("FieldGroup")>-1},getTextPath:function(e,t,n){let o;if(t&&(t.path||t.parameters&&t.parameters.length)&&e){if(t.path&&n==="Description"){o=t.path}else if(t.parameters){t.parameters.forEach(function(t){if(t.path&&t.path!==e){o=t.path}})}}return o},prepareDataForDialog:function(e,n,o){const a=e&&e.getModel().getMetaModel(),i=e.data("metaPath"),r=W.getTableFields(e),s=a.getContext(`${i}/@`),l=a.getContext(i),u=V(s);const d=new x;let c;let p;let f;let g;let y;let P;r.forEach(function(e){if(!e.annotationPath){return}const r=e.dataProperty;if(r){var s,d,h,x,E,m,b;let F=r&&a.getObject(`${i}/${r}@`);p=e.label||F&&F["@com.sap.vocabularies.Common.v1.Label"]||r;if(u){u.targetObject=u.targetEntityType.entityProperties.filter(function(e){return e.name===r})}u.targetObject=u.targetObject[0]||{};P=$(u,{},true)||{};const B=a.getContext(e.annotationPath),I=S(B),U=a.getContext(`${i}/${r}@`),N=U&&U.getInterface();let G=V(B,l);if(X(I)&&(I===null||I===void 0?void 0:(s=I.Value)===null||s===void 0?void 0:(d=s.path)===null||d===void 0?void 0:d.length)>0){G=R(G,r)}const q=W.getHiddenValueForContexts(B&&B.getObject()["@com.sap.vocabularies.UI.v1.Hidden"],n)||false;const K=F&&F["@com.sap.vocabularies.UI.v1.IsImageURL"];N.context={getModel:function(){return N.getModel()},getPath:function(){return`${i}/${r}`}};if(L(I)){F=I}else if(X(I)){var T;F=I===null||I===void 0?void 0:(T=I.Value)===null||T===void 0?void 0:T.$target}else if(J(I)){var O;F=I===null||I===void 0?void 0:(O=I.Target)===null||O===void 0?void 0:O.$target}else{F=undefined}const Z=F&&F.term&&F.term==="com.sap.vocabularies.UI.v1.Chart";const ee=(Y(I)||z(I))&&!!I.Action;const te=W.getIsFieldGrp(I);if(K||q||Z||ee||te){return}g=(A(F)||j(F))&&_(F)||"";const ne=g&&w(F);f=k(F);y=ne&&k(ne);const oe=(f||y)&&(((h=F)===null||h===void 0?void 0:(x=h.annotations)===null||x===void 0?void 0:(E=x.Common)===null||E===void 0?void 0:E.ValueListRelevantQualifiers)||ne&&(ne===null||ne===void 0?void 0:(m=ne.annotations)===null||m===void 0?void 0:(b=m.Common)===null||b===void 0?void 0:b.ValueListRelevantQualifiers));if(oe){return}const ae=F&&F.Value?F.Value:F;const ie=D(ae,G,false,false,I,Q(true));const re=Object.keys(v);const se=!!ie&&re.includes(ie);const le=!!ie&&(se&&ie===v.Editable||!se);const ue=r.includes("/")&&f;if(!le||ue){return}const de=W.getInputType(F,I,G);if(de){const e=H(G);const a=C(F,e);const s=t.computeDisplayMode(U.getObject());const l=f?f:false;const u=y&&!g.includes("/")?y:false;const d=g&&!r.includes("/")?g:false;c={label:p,dataProperty:r,isValueHelpEnabled:f?f:false,unitProperty:d,isFieldRequired:M(F,I,true,false,{},G),defaultSelectionPath:r?W.getDefaultSelectionPathComboBox(n,r):false,defaultSelectionUnitPath:g?W.getDefaultSelectionPathComboBox(n,g):false,entitySet:i,display:s,descriptionPath:W.getTextPath(r,P,s),nullable:F.nullable!==undefined?F.nullable:true,isPropertyReadOnly:a!==undefined?a:false,inputType:de,editMode:le?ie:undefined,propertyInfo:{hasVH:l,runtimePath:"fieldsInfo>/values/",relativePath:r,propertyFullyQualifiedName:F.fullyQualifiedName,propertyPathForValueHelp:`${i}/${r}`},unitInfo:d&&{hasVH:u,runtimePath:"fieldsInfo>/unitData/",relativePath:d,propertyPathForValueHelp:`${i}/${d}`}};o.push(c)}}});d.setData(o);return d},getTableFields:function(e){const t=e&&e.getColumns()||[];const n=e&&e.getParent().getTableDefinition().columns;return t.map(function(e){const t=e&&e.getDataProperty(),o=n&&n.filter(function(e){return e.name===t&&e.type==="Annotation"});return{dataProperty:t,label:e.getHeader(),annotationPath:o&&o[0]&&o[0].annotationPath}})},getDefaultTextsForDialog:function(e,t,n){const o=n.data("displayModePropertyBinding")==="true";return{keepExistingPrefix:"< Keep",leaveBlankValue:"< Leave Blank >",clearFieldValue:"< Clear Values >",massEditTitle:e.getText("C_MASS_EDIT_DIALOG_TITLE",t.toString()),applyButtonText:o?e.getText("C_MASS_EDIT_SAVE_BUTTON_TEXT"):e.getText("C_MASS_EDIT_APPLY_BUTTON_TEXT"),useValueHelpValue:"< Use Value Help >",cancelButtonText:e.getText("C_COMMON_OBJECT_PAGE_CANCEL"),noFields:e.getText("C_MASS_EDIT_NO_EDITABLE_FIELDS"),okButtonText:e.getText("C_COMMON_DIALOG_OK")}},setDefaultValuesToDialog:function(e,t,n,o){const a=o?n.unitProperty:n.dataProperty,i=n.inputType,r=n.isFieldRequired;const s="Values";e.defaultOptions=e.defaultOptions||[];const l=e.selectOptions&&e.selectOptions.length>0;const u={text:`${t.keepExistingPrefix} ${s} >`,key:`Default/${a}`};if(i==="CheckBox"){const t={text:"No",key:`${a}/false`,textInfo:{value:false}};const n={text:"Yes",key:`${a}/true`,textInfo:{value:true}};e.unshift(t);e.defaultOptions.unshift(t);e.unshift(n);e.defaultOptions.unshift(n);e.unshift(u);e.defaultOptions.unshift(u)}else{var d,c;if(n!==null&&n!==void 0&&(d=n.propertyInfo)!==null&&d!==void 0&&d.hasVH||n!==null&&n!==void 0&&(c=n.unitInfo)!==null&&c!==void 0&&c.hasVH&&o){const n={text:t.useValueHelpValue,key:`UseValueHelpValue/${a}`};e.unshift(n);e.defaultOptions.unshift(n)}if(l){if(r!=="true"&&!o){const n={text:t.clearFieldValue,key:`ClearFieldValue/${a}`};e.unshift(n);e.defaultOptions.unshift(n)}e.unshift(u);e.defaultOptions.unshift(u)}else{const n={text:t.leaveBlankValue,key:`Default/${a}`};e.unshift(n);e.defaultOptions.unshift(n)}}},getTextArrangementInfo:function(t,n,o,a){let i=a.getObject(t),r,s;if(n&&t){switch(o){case"Description":r=a.getObject(n)||"";s=r;break;case"Value":i=a.getObject(t)||"";s=i;break;case"ValueDescription":i=a.getObject(t)||"";r=a.getObject(n)||"";s=r?`${i} (${r})`:i;break;case"DescriptionValue":i=a.getObject(t)||"";r=a.getObject(n)||"";s=r?`${r} (${i})`:i;break;default:e.info(`Display Property not applicable: ${t}`);break}}return{textArrangement:o,valuePath:t,descriptionPath:n,value:i,description:r,fullText:s}},isEditable:function(e){const t=e.getBinding("any");const n=t.getExternalValue();return n===v.Editable},onContextEditableChange:function(e,t){const n=e.getProperty(`/values/${t}/objectsForVisibility`)||[];const o=n.some(W.isEditable);if(o){e.setProperty(`/values/${t}/visible`,o)}},updateOnContextChange:function(e,t,n,o){const a=e.getBinding("any");o.objectsForVisibility=o.objectsForVisibility||[];o.objectsForVisibility.push(e);a===null||a===void 0?void 0:a.attachChange(W.onContextEditableChange.bind(null,t,n))},getBoundObject:function(e,t){const n=new m({any:e});const o=t.getModel();n.setModel(o);n.setBindingContext(t);return n},getFieldVisiblity:function(e,t,n,o,a){const i=W.getBoundObject(e,a);const r=W.isEditable(i);if(!r){W.updateOnContextChange(i,t,n,o)}return r},setRuntimeModelOnDialog:function(e,t,n,o){const a=[];const i=[];const r=[];const s=[];const l=[];const u={values:a,unitData:i,results:r,readablePropertyData:l,selectedKey:undefined,textPaths:s,noFields:n.noFields};const d=new x(u);t.forEach(function(t){let n;let r;let l;const u={};const d={};if(t.dataProperty&&t.dataProperty.indexOf("/")>-1){const o=W.initLastLevelOfPropertyPath(t.dataProperty,a);const i=t.dataProperty.split("/");for(const a of e){const e=a.getObject(t.dataProperty);r=`${t.dataProperty}/${e}`;if(!u[r]&&o[i[i.length-1]]){n=W.getTextArrangementInfo(t.dataProperty,t.descriptionPath,t.display,a);o[i[i.length-1]].push({text:n&&n.fullText||e,key:r,textInfo:n});u[r]=e}}o[i[i.length-1]].textInfo={descriptionPath:t.descriptionPath,valuePath:t.dataProperty,displayMode:t.display}}else{a[t.dataProperty]=a[t.dataProperty]||[];a[t.dataProperty]["selectOptions"]=a[t.dataProperty]["selectOptions"]||[];if(t.unitProperty){i[t.unitProperty]=i[t.unitProperty]||[];i[t.unitProperty]["selectOptions"]=i[t.unitProperty]["selectOptions"]||[]}for(const o of e){const e=o.getObject();r=`${t.dataProperty}/${e[t.dataProperty]}`;if(t.dataProperty&&e[t.dataProperty]&&!u[r]){if(t.inputType!="CheckBox"){n=W.getTextArrangementInfo(t.dataProperty,t.descriptionPath,t.display,o);const i={text:n&&n.fullText||e[t.dataProperty],key:r,textInfo:n};a[t.dataProperty].push(i);a[t.dataProperty]["selectOptions"].push(i)}u[r]=e[t.dataProperty]}if(t.unitProperty&&e[t.unitProperty]){l=`${t.unitProperty}/${e[t.unitProperty]}`;if(!d[l]){if(t.inputType!="CheckBox"){n=W.getTextArrangementInfo(t.unitProperty,t.descriptionPath,t.display,o);const a={text:n&&n.fullText||e[t.unitProperty],key:l,textInfo:n};i[t.unitProperty].push(a);i[t.unitProperty]["selectOptions"].push(a)}d[l]=e[t.unitProperty]}}}a[t.dataProperty].textInfo={descriptionPath:t.descriptionPath,valuePath:t.dataProperty,displayMode:t.display};if(Object.keys(u).length===1){o.setProperty(t.dataProperty,r&&u[r])}if(Object.keys(d).length===1){o.setProperty(t.unitProperty,l&&d[l])}}s[t.dataProperty]=t.descriptionPath?[t.descriptionPath]:[]});t.forEach(function(t){let o={};if(t.dataProperty.indexOf("/")>-1){const e=W.getValueForMultiLevelPath(t.dataProperty,a);if(!e){e.push({text:n.leaveBlankValue,key:`Empty/${t.dataProperty}`})}else{W.setDefaultValuesToDialog(e,n,t)}o=e}else if(a[t.dataProperty]){a[t.dataProperty]=a[t.dataProperty]||[];W.setDefaultValuesToDialog(a[t.dataProperty],n,t);o=a[t.dataProperty]}if(i[t.unitProperty]&&i[t.unitProperty].length){W.setDefaultValuesToDialog(i[t.unitProperty],n,t,true);i[t.unitProperty].textInfo={};i[t.unitProperty].selectedKey=W.getDefaultSelectionPathComboBox(e,t.unitProperty);i[t.unitProperty].inputType=t.inputType}else if(t.dataProperty&&a[t.dataProperty]&&!a[t.dataProperty].length||t.unitProperty&&i[t.unitProperty]&&!i[t.unitProperty].length){const o=a[t.dataProperty]&&a[t.dataProperty].some(function(e){return e.text==="< Clear Values >"||e.text==="< Leave Blank >"});if(t.dataProperty&&!o){a[t.dataProperty].push({text:n.leaveBlankValue,key:`Empty/${t.dataProperty}`})}const r=i[t.unitProperty]&&i[t.unitProperty].some(function(e){return e.text==="< Clear Values >"||e.text==="< Leave Blank >"});if(t.unitProperty){if(!r){i[t.unitProperty].push({text:n.leaveBlankValue,key:`Empty/${t.unitProperty}`})}i[t.unitProperty].textInfo={};i[t.unitProperty].selectedKey=W.getDefaultSelectionPathComboBox(e,t.unitProperty);i[t.unitProperty].inputType=t.inputType}}if(t.isPropertyReadOnly&&typeof t.isPropertyReadOnly==="boolean"){l.push({property:t.dataProperty,value:t.isPropertyReadOnly,type:"Default"})}else if(t.isPropertyReadOnly&&t.isPropertyReadOnly.operands&&t.isPropertyReadOnly.operands[0]&&t.isPropertyReadOnly.operands[0].operand1&&t.isPropertyReadOnly.operands[0].operand2){l.push({property:t.dataProperty,propertyPath:t.isPropertyReadOnly.operands[0].operand1.path,propertyValue:t.isPropertyReadOnly.operands[0].operand2.value,type:"Path"})}if(t.editMode){o.visible=t.editMode===v.Editable||e.some(W.getFieldVisiblity.bind(W,t.editMode,d,t.dataProperty,o))}else{o.visible=true}o.selectedKey=W.getDefaultSelectionPathComboBox(e,t.dataProperty);o.inputType=t.inputType;o.unitProperty=t.unitProperty});return d},getDialogContext:function(e,t){let n=t===null||t===void 0?void 0:t.getBindingContext();if(!n){const t=e.getModel();const o=e.getRowBinding();const a=t.bindList(o.getPath(),o.getContext(),[],[],{$$updateGroupId:"submitLater"});a.refreshInternal=function(){};n=a.create({},true)}return n},onDialogOpen:function(e){const t=e.getSource();const n=t.getModel("fieldsInfo");n.setProperty("/isOpen",true)},closeDialog:function(e){e.close();e.destroy()},messageHandlingForMassEdit:async function(e,t,n,o,a,i){var s,l,u,d;const c=r.DraftStatus;const p=g.getLibraryResourceBundle("sap.fe.core");(s=n.getView())===null||s===void 0?void 0:(l=s.getBindingContext("internal"))===null||l===void 0?void 0:l.setProperty("getBoundMessagesForMassEdit",true);n.messageHandler.showMessages({onBeforeShowMessage:function(o,r){r.fnGetMessageSubtitle=E.setMessageSubtitle.bind({},e,t);const s=[];o.forEach(function(e){if(!e.getTarget()){s.push(e)}});if(a.length>0&&i.length===0){n.editFlow.setDraftStatus(c.Saved);const e=p.getText("C_MASS_EDIT_SUCCESS_TOAST");f.show(e)}else if(i.length<e.getSelectedContexts().length){n.editFlow.setDraftStatus(c.Saved)}else if(i.length===e.getSelectedContexts().length){n.editFlow.setDraftStatus(c.Clear)}if(n.getModel("ui").getProperty("/isEditable")&&s.length===0){r.showMessageBox=false;r.showMessageDialog=false}return r}});if(o.isOpen()){var y,P;W.closeDialog(o);(y=n.getView())===null||y===void 0?void 0:(P=y.getBindingContext("internal"))===null||P===void 0?void 0:P.setProperty("skipPatchHandlers",false)}(u=n.getView())===null||u===void 0?void 0:(d=u.getBindingContext("internal"))===null||d===void 0?void 0:d.setProperty("getBoundMessagesForMassEdit",false)},getSideEffectDataForKey:function(e,t,n,o){const a=e.getProperty("$Type");const i={};o.forEach(e=>{const o=t.getSideEffectsService().computeFieldGroupIds(a,e.propertyFullyQualifiedName??"")??[];i[e.keyValue]=n._sideEffects.getSideEffectsMapForFieldGroups(o)});return i},fnGetPathForSourceProperty:function(e,t,n){const o=e.indexOf("/")>0?"/"+t+"/"+e.substr(0,e.lastIndexOf("/")+1)+"@sapui.name":false,a=!o?Promise.resolve(t):n.requestObject(o);e=o?e.substr(e.lastIndexOf("/")+1):e;return{sPath:e,pOwnerEntity:a,sNavigationPath:o}},fnGetEntityTypeOfOwner:function(e,t,n,o,a){const i=n.getProperty("$Type");const{$Type:r,$Partner:s}=e.getObject(`${n}/${t}`);if(s){const t=e.getObject(`/${r}/${s}`);if(t){const e=t["$Type"];if(e!==i){a.push(o)}}}else{a.push(o)}return a},fnGetTargetsForMassEdit:function(e,t,n,o){const{targetProperties:a,targetEntities:i}=e;const r=[];let s=[];const l=t.getProperty("$Type");if(n===l){i===null||i===void 0?void 0:i.forEach(e=>{e=e["$NavigationPropertyPath"];let n;if(e.includes("/")){n=e.split("/")[0]}else{n=e}s=W.fnGetEntityTypeOfOwner(o,n,t,e,s)})}if(a.length){a.forEach(e=>{const{pOwnerEntity:a}=W.fnGetPathForSourceProperty(e,n,o);r.push(a.then(n=>{if(n===l){s.push(e)}else if(e.includes("/")){const n=e.split("/")[0];s=W.fnGetEntityTypeOfOwner(o,n,t,e,s)}return Promise.resolve(s)}))})}else{r.push(Promise.resolve(s))}return Promise.all(r)},checkIfEntityExistsAsTargetEntity:(e,t)=>{const n=t.getProperty("$Type");const o=Object.values(e).filter(e=>!e.name.includes(n));const a=t.getPath().split("/").pop();const i=o.filter(e=>{const t=e.sideEffects.targetEntities;return t!==null&&t!==void 0&&t.filter(e=>e["$NavigationPropertyPath"]===a).length?e:false});return i.length},handleMassEditFieldUpdateAndRequestSideEffects:async function(e){const{controller:n,fieldPromise:o,sideEffectsMap:a,textPaths:i,groupId:r,key:s,entitySetContext:l,metaModel:u,selectedContext:c,deferredTargetsForAQualifiedName:p}=e;const f=n.getView();const g=[o];const y=l.getProperty("$Type");const P=t.getAppComponent(f).getSideEffectsService();const h=W.checkIfEntityExistsAsTargetEntity(a,l);if(a){for(const e in a){const t=a[e];const o=e.split("#")[0];const i=n._sideEffects.getContextForSideEffects(c,o);p[s]={};if(i){const e=async e=>{const t=await W.fnGetTargetsForMassEdit(e,l,o,u);let n=t[0];const a=e.triggerAction;const r=(e.targetProperties??[]).filter(e=>!n.includes(e));const c=a&&o===y&&!d._isStaticAction(u.getObject(`/${a}`),a)?a:undefined;p[s][e.fullyQualifiedName]={aTargets:r,oContext:i,oDataSideEffect:e,TriggerAction:a&&!c?a:undefined};if(h){n=[]}return{aTargets:n,TriggerAction:c}};g.push(n._sideEffects.requestSideEffects(t.sideEffects,i,r,e));n._sideEffects.unregisterFailedSideEffects(t.sideEffects.fullyQualifiedName,i)}}const e=n._sideEffects.getRegisteredFailedRequests();for(const t of[c,f.getBindingContext()]){if(t){const o=t.getPath();const a=e[o]??[];n._sideEffects.unregisterFailedSideEffectsForAContext(o);for(const e of a){g.push(n._sideEffects.requestSideEffects(e,t))}}}}if(i!==null&&i!==void 0&&i[s]&&i[s].length){g.push(P.requestSideEffects(i[s],c,r))}return Promise.allSettled(g)},createDialog:async function(n,o,a){const i=[],r=g.getLibraryResourceBundle("sap.fe.core"),s=W.getDefaultTextsForDialog(r,o.length,n),l=W.prepareDataForDialog(n,o,i),u=W.getDialogContext(n),d=W.setRuntimeModelOnDialog(o,i,s,u),f=n.getModel(),P=f.getMetaModel(),h=P.getMetaPath(u.getPath()),v=await W.createFragment(P,l,h);const x=await y.load({definition:v});const m=new p({resizable:true,title:s.massEditTitle,content:[x],afterOpen:W.onDialogOpen,beginButton:new c({text:W.helpers.getExpBindingForApplyButtonTxt(s,l.getObject("/")),type:"Emphasized",press:async function(i){var r,s;E.removeBoundTransitionMessages();E.removeUnboundTransitionMessages();(r=a.getView())===null||r===void 0?void 0:(s=r.getBindingContext("internal"))===null||s===void 0?void 0:s.setProperty("skipPatchHandlers",true);const l=t.getAppComponent(a.getView());const u=i.getSource().getParent();const d=u.getModel("fieldsInfo");const c=d.getProperty("/results");const p=n&&n.getModel().getMetaModel(),f=n.data("metaPath"),g=p.getContext(f);const y=[];const P=d.getProperty("/textPaths");const h=d.getProperty("/readablePropertyData");let v;const x=[];const b={};const T=o.length;const O={};const F=W.getSideEffectDataForKey(g,l,a,c);o.forEach(function(t,n){c.forEach(o=>{if(!b.hasOwnProperty(o.keyValue)){b[o.keyValue]=0}if(h){h.some(function(e){if(o.keyValue===e.property){if(e.type==="Default"){return e.value===true}else if(e.type==="Path"&&e.propertyValue&&e.propertyPath){return t.getObject(e.propertyPath)===e.propertyValue}}})}v=`$auto.${n}`;const i=t.setProperty(o.keyValue,o.value,v).catch(async n=>{y.push(t.getObject());e.error("Mass Edit: Something went wrong in updating entries.",n);b[o.keyValue]=b[o.keyValue]+1;return Promise.reject({isFieldUpdateFailed:true})});const r={controller:a,fieldPromise:i,sideEffectsMap:F[o.keyValue],textPaths:P,groupId:v,key:o.keyValue,entitySetContext:g,metaModel:p,selectedContext:t,deferredTargetsForAQualifiedName:O};x.push(W.handleMassEditFieldUpdateAndRequestSideEffects(r))})});await Promise.allSettled(x).then(async function(){v=`$auto.massEditDeferred`;const e=[];const t=Object.values(O);const n=Object.keys(O);t.forEach((t,o)=>{const i=n[o];if(b[i]!==T){const n=Object.values(t);n.forEach(t=>{const{aTargets:n,oContext:o,TriggerAction:i,mSideEffect:r}=t;const s=function(){return n};const l=function(){return{aTargets:s(),TriggerAction:i}};e.push(a._sideEffects.requestSideEffects(r,o,v,l))})}})}).then(function(){W.messageHandlingForMassEdit(n,o,a,u,c,y)}).catch(e=>{W.closeDialog(m);return Promise.reject(e)})}}),endButton:new c({text:s.cancelButtonText,visible:W.helpers.hasEditableFieldsBinding(l.getObject("/"),true),press:function(e){const t=e.getSource().getParent();W.closeDialog(t)}})});m.setModel(d,"fieldsInfo");m.setModel(f);m.setBindingContext(u);return m},createFragment:async function(e,t,o){const a="sap/fe/core/controls/massEdit/MassEditDialog",i=new n(t.getData(),e),r=P.loadTemplate(a,"fragment");return Promise.resolve(h.process(r,{name:a},{bindingContexts:{dataFieldModel:i.createBindingContext("/"),metaModel:e.createBindingContext("/"),contextPath:e.createBindingContext(o)},models:{dataFieldModel:i,metaModel:e,contextPath:e}}))},helpers:{getBindingExpForHasEditableFields:(e,t)=>{const n=e.reduce((e,t)=>N(e,U("/values/"+t.dataProperty+"/visible","fieldsInfo")),Q(false));return t?n:G(n)},getExpBindingForApplyButtonTxt:(e,t)=>{const n=W.helpers.getBindingExpForHasEditableFields(t,true);const o=q(n,Q(e.applyButtonText),Q(e.okButtonText));return K(o)},hasEditableFieldsBinding:(e,t)=>{const n=K(W.helpers.getBindingExpForHasEditableFields(e,t));if(n==="true"){return true}else if(n==="false"){return false}else{return n}}}};return W},false);
//# sourceMappingURL=MassEditHelper.js.map