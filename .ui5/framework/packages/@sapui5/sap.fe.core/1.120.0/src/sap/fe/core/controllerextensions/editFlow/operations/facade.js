/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/fe/core/ActionRuntime","sap/fe/core/CommonUtils","sap/fe/core/controllerextensions/BusyLocker","sap/fe/core/controllerextensions/messageHandler/messageHandling","sap/fe/core/helpers/FPMHelper","sap/fe/core/helpers/ResourceModelHelper","sap/fe/core/helpers/StableIdHelper","sap/fe/core/library","sap/m/Button","sap/m/Dialog","sap/m/MessageBox","sap/ui/core/Core","sap/ui/core/Fragment","sap/ui/core/XMLTemplateProcessor","sap/ui/core/library","sap/ui/core/message/Message","sap/ui/core/util/XMLPreprocessor","sap/ui/model/json/JSONModel","../../../operationsHelper","./_internal"],function(e,t,n,i,o,s,a,r,l,c,d,u,g,f,p,m,h,M,E,v,P){"use strict";var C=P._validateProperties;var x=P._addMessageForActionParameter;var b=m.MessageType;var A=r.generate;var O=a.getResourceModel;const S=l.Constants,y=l.InvocationGrouping;const $=u.Action;function T(e,n,i,o,s,a){if(!a){a={is412Executed:false,strictHandlingTransitionFails:[],strictHandlingPromises:[],strictHandlingWarningMessages:[],delaySuccessMessages:[],processedMessageIds:[]}}if(!n||n.length===0){return Promise.reject("Bound actions always requires at least one context")}const r=Array.isArray(n);s.aContexts=r?n:[n];const l=i.getMetaModel(),c=`${l.getMetaPath(s.aContexts[0].getPath())}/${e}`,d=l.createBindingContext(`${c}/@$ui5.overload/0`);s.isCriticalAction=t.getIsActionCritical(l,c,s.aContexts);const u=function(e){if(e[0].status==="fulfilled"){return e[0].value}else{throw e[0].reason||e}};return B(e,i,d,o,s,a).then(e=>{if(r){return e}else{return u(e)}},e=>{if(r){throw e}else{return u(e)}})}function _(e,n,i,o,s){if(!n){return Promise.reject("Action expects a model/context for execution")}const a=n.getMetaModel(),r=n.bindContext(`/${e}`).getPath(),l=a.createBindingContext(`/${a.createBindingContext(r).getObject("$Action")}/0`);o.isCriticalAction=t.getIsActionCritical(a,`${r}/@$ui5.overload`);return B(e,n,l,i,o,s)}function w(e,t,n){if(!t){return Promise.reject("Bound functions always requires a context")}const i=n.getMetaModel(),o=`${i.getMetaPath(t.getPath())}/${e}`,s=i.createBindingContext(o);return I(e,n,s,t)}function N(e,t){if(!e){return Promise.resolve()}const n=t.getMetaModel(),i=t.bindContext(`/${e}`).getPath(),o=n.createBindingContext(`/${n.createBindingContext(i).getObject("$Function")}/0`);return I(e,t,o)}function I(e,t,n,i){let o;if(!n||!n.getObject()){return Promise.reject(new Error(`Function ${e} not found`))}if(i){n=t.bindContext(`${i.getPath()}/${e}(...)`);o="functionGroup"}else{n=t.bindContext(`/${e}(...)`);o="functionImport"}const s=n.execute(o);t.submitBatch(o);return s.then(function(){return n.getBoundContext()})}function B(e,t,n,i,o,s){if(!s){s={is412Executed:false,strictHandlingTransitionFails:[],strictHandlingPromises:[],strictHandlingWarningMessages:[],delaySuccessMessages:[],processedMessageIds:[]}}o.bGrouped=o.invocationGrouping===y.ChangeSet;return new Promise(async function(a,r){let l={};let c;let d;const u=o.label;const f=o.skipParameterDialog;const p=o.aContexts;const m=o.bIsCreateAction;const h=o.isCriticalAction;let M;let E;let v;let P;let C;let x;let b;const A=n.getObject();if(!n||!n.getObject()){return r(new Error(`Action ${e} not found`))}const O=j(n);const S=O.length>0&&!(O.length===1&&O[0].$Name==="ResultIsActiveEntity");const $=o.parameterValues;const T=i.getComponentData();const _=T&&T.startupParameters||{};if(S&&f){b=K(m,O,$,_)}c=null;if(S){if(!(f&&b)){c=F}}else if(h){c=H}l={fnOnSubmitted:o.onSubmitted,fnOnResponse:o.onResponse,actionName:e,model:t,aActionParameters:O,bGetBoundContext:o.bGetBoundContext,defaultValuesExtensionFunction:o.defaultValuesExtensionFunction,label:o.label,selectedItems:o.selectedItems};if(n.getObject("$IsBound")){var w,N;if(((w=o.additionalSideEffect)===null||w===void 0?void 0:(N=w.pathExpressions)===null||N===void 0?void 0:N.length)>0){M=t.getMetaModel();E=M.getMetaPath(p[0].getPath());v=M.getObject(`${E}/@com.sap.vocabularies.Common.v1.Messages/$Path`);if(v){P=o.additionalSideEffect.pathExpressions.findIndex(function(e){return typeof e==="string"&&e===v});x=n.getObject("$ReturnType");C=x&&!x.$isCollection&&n.getModel().getObject(E).$Type===x.$Type;if(P>-1||C){o.mBindingParameters=o.mBindingParameters||{};if(n.getObject(`$ReturnType/$Type/${v}`)&&(!o.mBindingParameters.$select||o.mBindingParameters.$select.split(",").indexOf(v)===-1)){o.mBindingParameters.$select=o.mBindingParameters.$select?`${o.mBindingParameters.$select},${v}`:v;if(P===-1){o.additionalSideEffect.pathExpressions.push("*")}if(o.additionalSideEffect.triggerActions.length===0&&P>-1){o.additionalSideEffect.pathExpressions.splice(P,1)}}}}}l.aContexts=p;l.mBindingParameters=o.mBindingParameters;l.additionalSideEffect=o.additionalSideEffect;l.bGrouped=o.invocationGrouping===y.ChangeSet;l.internalModelContext=o.internalModelContext;l.operationAvailableMap=o.operationAvailableMap;l.isCreateAction=m;l.bObjectPage=o.bObjectPage;l.disableStrictHandling=o.disableStrictHandling;l.groupId=o.groupId;if(o.controlId){l.control=o.parentControl.byId(o.controlId);o.control=l.control}else{l.control=o.parentControl;o.control=o.parentControl}}if(m){l.bIsCreateAction=m}const I=(A.$Parameter||[]).some(e=>(A.$EntitySetPath&&A.$EntitySetPath===e.$Name||A.$IsBound)&&e.$isCollection);l.isStatic=I;if(c){d=c(e,i,u,l,O,$,n,o.parentControl,o.entitySetName,o.messageHandler,s);return d.then(function(e){R(o,l,A);a(e)}).catch(function(e){r(e)})}else{if($){for(const e in l.aActionParameters){var B;l.aActionParameters[e].value=$===null||$===void 0?void 0:(B=$.find(t=>t.name===l.aActionParameters[e].$Name))===null||B===void 0?void 0:B.value}}else{for(const e in l.aActionParameters){var D;l.aActionParameters[e].value=(D=_[l.aActionParameters[e].$Name])===null||D===void 0?void 0:D[0]}}let e;try{e=await U(i,l,o.parentControl,o.messageHandler,s);const t=g.getMessageManager().getMessageModel().getData();if(s&&s.is412Executed&&s.strictHandlingTransitionFails.length){s.delaySuccessMessages=s.delaySuccessMessages.concat(t)}z.afterActionResolution(o,l,A);a(e)}catch{r(e)}finally{var L,V;if(s&&s.is412Executed&&s.strictHandlingTransitionFails.length&&o.aContexts.length>1){try{const e=s.strictHandlingTransitionFails;const t=[];e.forEach(function(e){t.push(e.oAction.getContext())});l.aContexts=t;const n=await U(i,l,o.parentControl,o.messageHandler,s);s.strictHandlingTransitionFails=[];g.getMessageManager().addMessages(s.delaySuccessMessages);R(o,l,A);a(n)}catch(e){r(e)}}let e=false;if(o.bGrouped&&s&&s.strictHandlingPromises.length||q(o.bGrouped)){e=true}o===null||o===void 0?void 0:(L=o.messageHandler)===null||L===void 0?void 0:L.showMessageDialog({control:(V=l)===null||V===void 0?void 0:V.control,onBeforeShowMessage:function(t,n){return G(o,p,undefined,t,n,e)},aSelectedContexts:o.aContexts,sActionName:u});if(s){s={is412Executed:false,strictHandlingTransitionFails:[],strictHandlingPromises:[],strictHandlingWarningMessages:[],delaySuccessMessages:[],processedMessageIds:[]}}}}})}function H(e,t,n,i,o,s,a,r,l,c){return new Promise((n,o)=>{let s=e?e:null;s=s.indexOf(".")>=0?s.split(".")[s.split(".").length-1]:s;const a=s&&l?`${l}|${s}`:"";const d=O(r);const g=d.getText("C_OPERATIONS_ACTION_CONFIRM_MESSAGE",undefined,a);u.confirm(g,{onClose:async function(e){if(e===$.OK){try{const e=await U(t,i,r,c);n(e)}catch(e){try{await c.showMessageDialog();o(e)}catch(t){o(e)}}}else{n(S.CancelActionDialog)}}})})}async function D(e,t,n,i,o,s,a,r){var l;const c=await U(e,t,n,i,r);if((l=t.aContexts)!==null&&l!==void 0&&l.length){if(c!==null&&c!==void 0&&c.some(e=>e.status==="rejected")){throw c}}const d=g.getMessageManager().getMessageModel().getData();if(r&&r.is412Executed&&r.strictHandlingTransitionFails.length){if(!a){r.delaySuccessMessages=r.delaySuccessMessages.concat(d)}else{g.getMessageManager().addMessages(r.delaySuccessMessages);let e=false;if(t.bGrouped&&r.strictHandlingPromises.length||q(t.bGrouped)){e=true}if(d.length){s.attachEventOnce("afterClose",function(){i.showMessageDialog({onBeforeShowMessage:function(n,i){return G(t,o,s,n,i,e)},control:t.control,aSelectedContexts:t.aContexts,sActionName:t.label})})}}}else if(d.length){let e=false;if(t.bGrouped&&r&&r.strictHandlingPromises.length||q(t.bGrouped)){e=true}s.attachEventOnce("afterClose",function(){i.showMessageDialog({isActionParameterDialogOpen:t===null||t===void 0?void 0:t.oDialog.isOpen(),onBeforeShowMessage:function(n,i){return G(t,o,s,n,i,e)},control:t.control,aSelectedContexts:t.aContexts,sActionName:t.label})})}return c}function R(e,n,i){if(n.internalModelContext&&n.operationAvailableMap&&n.aContexts&&n.aContexts.length&&i.$IsBound){const i=n.isStatic;if(!i){t.setActionEnablement(n.internalModelContext,JSON.parse(n.operationAvailableMap),e.selectedItems,"table")}else if(n.control){const e=n.control;if(e.isA("sap.ui.mdc.Table")){const i=e.getSelectedContexts();t.setActionEnablement(n.internalModelContext,JSON.parse(n.operationAvailableMap),i,"table")}}}}function G(e,t,n,i,s,a){let r=s.showMessageBox,l=s.showMessageDialog;const c=e.control;const d=g.getLibraryResourceBundle("sap.fe.core");const u=i.filter(function(e){var t;return((t=e.getTargets())===null||t===void 0?void 0:t[0])===""});const f=i.filter(function(t){var n,i;return t.getTargets&&((n=t.getTargets())===null||n===void 0?void 0:n[0].indexOf(e.actionName))!==-1&&(e===null||e===void 0?void 0:(i=e.aActionParameters)===null||i===void 0?void 0:i.some(function(e){var n;return((n=t.getTargets())===null||n===void 0?void 0:n[0].indexOf(e.$Name))!==-1}))});f===null||f===void 0?void 0:f.forEach(function(e){e.isAPDTarget=true});const p=f.length?true:false;let m=false;if(a&&!p){var M;m=true;let t=d.getText("C_COMMON_DIALOG_CANCEL_ERROR_MESSAGES_TEXT");let n=d.getText("C_COMMON_DIALOG_CANCEL_ERROR_MESSAGES_DETAIL_TEXT");const s=g.getMessageManager().getMessageModel();const a=s.getData();const u=o.getMessages(true);let f;const p=c&&c.getModel("ui").getProperty("/isEditable");const E=i.findIndex(function(e){return e.getType()==="Error"||e.getType()==="Warning"});const v=a.findIndex(function(e){return e.getType()==="Error"||e.getType()==="Warning"});if(E!==1&&v!==-1&&(e===null||e===void 0?void 0:(M=e.aContexts)===null||M===void 0?void 0:M.length)>1){if(a.length===1&&u.length===1){if(p===false){a[0].setMessage(d.getText("C_COMMON_DIALOG_CANCEL_SINGLE_ERROR_MESSAGE_TEXT")+"\n\n"+a[0].getMessage())}else{t=p?d.getText("C_COMMON_DIALOG_CANCEL_SINGLE_ERROR_MESSAGE_TEXT_EDIT"):d.getText("C_COMMON_DIALOG_CANCEL_SINGLE_ERROR_MESSAGE_TEXT");n="";f=new h({message:t,type:b.Error,target:"",persistent:true,description:n,code:"FE_CUSTOM_MESSAGE_CHANGESET_ALL_FAILED"});i.unshift(f);if(i.length===1){r=true;l=false}else{l=true;r=false}}}else{f=new h({message:t,type:b.Error,target:"",persistent:true,description:n,code:"FE_CUSTOM_MESSAGE_CHANGESET_ALL_FAILED"});i.unshift(f);if(i.length===1){r=true;l=false}else{l=true;r=false}}}}if(n&&n.isOpen()&&t.length!==0&&!e.isStatic){if(!e.bGrouped){if(t.length>1||!p){n.close();n.destroy()}}else if(!p){n.close();n.destroy()}}let E=[];const v=n&&n.isOpen();if(!m){var P,C;if(i.length===1&&i[0].getTargets&&((P=i[0].getTargets())===null||P===void 0?void 0:P[0])!==undefined&&((C=i[0].getTargets())===null||C===void 0?void 0:C[0])!==""){if(c&&c.getModel("ui").getProperty("/isEditable")===false||!c){r=!p;l=false}else if(c&&c.getModel("ui").getProperty("/isEditable")===true){r=false;l=false}}else if(c){if(c.getModel("ui").getProperty("/isEditable")===false){if(v&&p){l=false}}else if(c.getModel("ui").getProperty("/isEditable")===true){if(!v&&p){l=true;E=u.concat(f)}else if(!v&&u.length===0){l=false}}}}return{showMessageBox:r,showMessageDialog:l,filteredMessages:E.length?E:i,fnGetMessageSubtitle:c&&c.isA("sap.ui.mdc.Table")&&o.setMessageSubtitle.bind({},c,t),showChangeSetErrorDialog:e.bGrouped}}function F(t,o,a,r,l,m,h,v,P,b,y){const $=X(h,t),T=h.getModel().oModel.getMetaModel(),_=T.createBindingContext($),N=h.getObject("$IsBound")?h.getPath().split("/@$ui5.overload/0")[0]:h.getPath().split("/0")[0],I=T.createBindingContext(N),B=r.isCreateAction,H="sap/fe/core/controls/ActionParameterDialog";return new Promise(async function($,T){let N;const R=g.getMessageManager();const F=e=>{const t=R.getMessageModel().getData();const n=A(["APD_",e.$Name]);const i=t.filter(e=>e.getControlIds().some(e=>n.split("-").includes(e)));R.removeMessages(i)};const j={handleChange:async function(e){const t=e.getSource();const n=N.find(e=>e.field===t);F(n.parameter);n.validationPromise=e.getParameter("promise");try{n.value=await n.validationPromise;n.hasError=false}catch(e){delete n.value;n.hasError=true;x(R,[{actionParameterInfo:n,message:e.message}])}}};const V=p.loadTemplate(H,"fragment");const k=new E({$displayMode:{}});try{const p=await M.process(V,{name:H},{bindingContexts:{action:h,actionName:I,entitySet:_},models:{action:h.getModel(),actionName:I.getModel(),entitySet:_.getModel(),metaModel:_.getModel()}});const x=r.aContexts||[];const J=[];let z;await n.setUserDefaults(o,l,k,true);const Y=await f.load({definition:p,controller:j});N=l.map(e=>{const t=g.byId(A(["APD_",e.$Name]));const n=t.isA("sap.ui.mdc.MultiValueField");return{parameter:e,field:t,isMultiValue:n}});const Q=O(v);let Z={dialogCancelled:true,result:undefined};const ee=new d(A(["fe","APD_",t]),{title:a||Q.getText("C_OPERATIONS_ACTION_PARAMETER_DIALOG_TITLE"),content:[Y],escapeHandler:function(){ee.close()},beginButton:new c(A(["fe","APD_",t,"Action","Ok"]),{text:B?Q.getText("C_TRANSACTION_HELPER_SAPFE_ACTION_CREATE_BUTTON"):L(Q,a,t,P),type:"Emphasized",press:async function(){try{if(!await C(R,N,Q)){return}i.lock(ee);let e=[];try{b.removeTransitionMessages();let t;const n=z&&z.getParameterContext();for(const e in l){if(l[e].$isCollection){const n=ee.getModel("mvfview").getProperty(`/${l[e].$Name}`),i=[];for(const e in n){i.push(n[e].Key)}t=i}else{t=n.getProperty(l[e].$Name)}l[e].value=t;t=undefined}const s=Object.assign({},r);s.label=a;try{const e=await D(o,s,v,b,x,ee,false,y);Z={dialogCancelled:false,result:e};ee.close()}catch(e){const t=sap.ui.getCore().getMessageManager().getMessageModel().getData();if(y&&y.is412Executed&&y.strictHandlingTransitionFails.length){y.delaySuccessMessages=y.delaySuccessMessages.concat(t)}throw e}finally{if(y&&y.is412Executed&&y.strictHandlingTransitionFails.length){try{e=y.strictHandlingTransitionFails.map(e=>e.oAction.getContext());s.aContexts=e;const t=await D(o,s,v,b,x,ee,true,y);y.strictHandlingTransitionFails=[];Z={dialogCancelled:false,result:t}}catch{if(y.is412Executed&&y.strictHandlingTransitionFails.length){g.getMessageManager().addMessages(y.delaySuccessMessages)}let e=false;if(r.bGrouped&&y.strictHandlingPromises.length||q(r.bGrouped)){e=true}await b.showMessageDialog({isActionParameterDialogOpen:ee.isOpen(),onBeforeShowMessage:function(t,n){return G(s,x,ee,t,n,e)},aSelectedContexts:undefined,sActionName:a})}}if(i.isLocked(ee)){i.unlock(ee)}}}catch(t){let n=true;let i=false;if(r.bGrouped&&y&&y.strictHandlingPromises.length||q(r.bGrouped)){i=true}await b.showMessages({context:e[0],isActionParameterDialogOpen:ee.isOpen(),messagePageNavigationCallback:function(){ee.close()},onBeforeShowMessage:function(e,t){const o=G(r,x,ee,e,t,i);n=o.showMessageDialog;return o},aSelectedContexts:undefined,sActionName:a,control:r.control});if(n){if(ee.isOpen()){}else{T(t)}}}}finally{if(y){y={is412Executed:false,strictHandlingTransitionFails:[],strictHandlingPromises:[],strictHandlingWarningMessages:[],delaySuccessMessages:[],processedMessageIds:[]}}if(i.isLocked(ee)){i.unlock(ee)}}}}),endButton:new c(A(["fe","APD_",t,"Action","Cancel"]),{text:Q.getText("C_COMMON_ACTION_PARAMETER_DIALOG_CANCEL"),press:function(){ee.close()}}),beforeOpen:async function(t){const i=Object.assign({},t);b.removeTransitionMessages();const o=function(){const e=ee.getModel().getMetaModel(),t=h.sPath&&h.sPath.split("/@")[0],n=e.getObject(`${t}@com.sap.vocabularies.Common.v1.DefaultValuesFunction`);return n};const a=async function(t){const a=o();const c=async function(i,o){if(o!==undefined){if(x.length>0&&o.$Path){try{let e=await n.requestSingletonProperty(o.$Path,z.getModel());if(e===null){e=await z.getParameterContext().requestProperty(o.$Path)}if(x.length>1){let n=o.$Path;if(n.indexOf(`${t}/`)===0){n=n.replace(`${t}/`,"")}for(let t=1;t<x.length;t++){if(x[t].getProperty(n)!==e){return{paramName:i,value:undefined,bNoPossibleValue:true}}}}return{paramName:i,value:e}}catch(t){e.error("Error while reading default action parameter",i,r.actionName);return{paramName:i,value:undefined,bLatePropertyError:true}}}else{return{paramName:i,value:o}}}else if(k&&k.oData[i]){return{paramName:i,value:k.oData[i]}}else{return{paramName:i,value:undefined}}};const d=function(e){const t=ee.getModel().getMetaModel(),i=n.getParameterPath(h.getPath(),e)+"@",o=t.getObject(i),s=o&&o["@com.sap.vocabularies.UI.v1.ParameterDefaultValue"];return s};const g=[];let f,p;for(const e in l){f=l[e].$Name;p=d(f);g.push(c(f,p))}if(h.getObject("$IsBound")&&x.length>0){if(a&&a.length>0&&typeof a==="string"){for(const e in x){J.push(w(a,x[e],r.model))}}}const M=Promise.all(g);let E=Promise.resolve([]);let v;if(J&&J.length>0){E=Promise.all(J)}if(r.defaultValuesExtensionFunction){const e=r.defaultValuesExtensionFunction.substring(0,r.defaultValuesExtensionFunction.lastIndexOf(".")||-1).replace(/\./gi,"/"),t=r.defaultValuesExtensionFunction.substring(r.defaultValuesExtensionFunction.lastIndexOf(".")+1,r.defaultValuesExtensionFunction.length);v=s.actionWrapper(i,e,t,{contexts:x})}try{const e=await Promise.all([M,E,v]);const t=e[0];const n=e[1];const i=e[2];let o;for(const e in l){var P;o=l[e].$Name;const s=m===null||m===void 0?void 0:(P=m.find(t=>t.name===l[e].$Name))===null||P===void 0?void 0:P.value;if(s){z.setParameter(l[e].$Name,s)}else if(i&&i.hasOwnProperty(o)){z.setParameter(l[e].$Name,i[o])}else if(t[e]&&t[e].value!==undefined){z.setParameter(l[e].$Name,t[e].value)}else if(a&&!t[e].bNoPossibleValue){if(x.length>1){let t=0;while(t<x.length-1){if(n[t]&&n[t+1]&&n[t].getObject(o)===n[t+1].getObject(o)){t++}else{break}}if(t===x.length-1){z.setParameter(l[e].$Name,n[t].getObject(o))}}else if(n[0]&&n[0].getObject(o)){z.setParameter(l[e].$Name,n[0].getObject(o))}}}const s=t.some(function(e){if(e.bLatePropertyError){return e.bLatePropertyError}});if(s){const e=Q.getText("C_APP_COMPONENT_SAPFE_ETAG_LATE_PROPERTY");u.warning(e,{contentWidth:"25em"})}}catch(t){e.error("Error while retrieving the parameter",t)}};const c=async function(){if(h.getObject("$IsBound")&&x.length>0){const t=h.getObject("$Parameter");const n=t[0]&&t[0].$Name;try{const e=await x[0].requestObject();if(e){z.setParameter(n,e)}await a(n)}catch(t){e.error("Error while retrieving the parameter",t)}}else{await a()}};await c();for(const e of N){const t=e.isMultiValue?e.field.getItems():e.field.getValue();e.value=t;e.validationPromise=Promise.resolve(t)}},afterClose:function(){l.forEach(F);ee.destroy();if(Z.dialogCancelled){T(S.CancelActionDialog)}else{$(Z.result)}}});r.oDialog=ee;ee.setModel(h.getModel().oModel);ee.setModel(k,"paramsModel");ee.bindElement({path:"/",model:"paramsModel"});const te=new E({});ee.setModel(te,"mvfview");for(const e of N){if(e.isMultiValue){var W,U;e===null||e===void 0?void 0:(W=e.field)===null||W===void 0?void 0:(U=W.getBinding("items"))===null||U===void 0?void 0:U.attachChange(()=>{F(e.parameter)})}else{var X,K;e===null||e===void 0?void 0:(X=e.field)===null||X===void 0?void 0:(K=X.getBinding("value"))===null||K===void 0?void 0:K.attachChange(()=>{F(e.parameter)})}}let ne=`${t}(...)`;if(!x.length){ne=`/${ne}`}ee.bindElement({path:ne});if(v){v.addDependent(ee)}if(x.length>0){ee.setBindingContext(x[0])}z=ee.getObjectBinding();ee.open()}catch(e){T(e)}})}function j(e){const t=e.getObject("$Parameter")||[];if(t&&t.length){if(e.getObject("$IsBound")){return t.slice(1,t.length)||[]}}return t}function L(e,t,n,i){let o=n?n:null;const s=o.split(".");o=o.indexOf(".")>=0?s[s.length-1]:o;const a=o&&i?`${i}|${o}`:"";const r="ACTION_PARAMETER_DIALOG_ACTION_NAME";const l=e.checkIfResourceKeyExists(`${r}|${a}`);if(t){if(l){return e.getText(r,undefined,a)}else if(e.checkIfResourceKeyExists(`${r}|${i}`)){return e.getText(r,undefined,`${i}`)}else if(e.checkIfResourceKeyExists(`${r}`)){return e.getText(r)}else{return t}}else{return e.getText("C_COMMON_DIALOG_OK")}}function V(e,t,n,i,o,s,a,r,l,c,d){let u,g=true;if(t){t.internalOperationsPromiseResolve=l}if(n){var f;const n=e.getBoundContext().getPath();const i=e.getModel().getMetaModel().getMetaPath(n);const o=e.getModel().getMetaModel().getObject(i);if(o&&((f=o[0])===null||f===void 0?void 0:f.$kind)!=="Action"){g=false}if(t.disableStrictHandling){g=false}}if(!g){u=e.execute(i).then(function(){l(e.getBoundContext());return e.getBoundContext()})}else{u=n?e.execute(i,undefined,v.fnOnStrictHandlingFailed.bind(z,i,t,o,r,e.getContext(),a,s,d)).then(function(){if(d&&!t.bGrouped){k(e,i,d,t)}l(e.getBoundContext());return e.getBoundContext()}).catch(function(){if(d&&!t.bGrouped){k(e,i,d,t)}c();throw S.ActionExecutionFailed}):e.execute(i,undefined,v.fnOnStrictHandlingFailed.bind(z,i,t,o,r,e.getContext(),a,s,d)).then(function(n){if(d&&!t.bGrouped){k(e,i,d,t)}l(n);return n}).catch(function(){if(d&&!t.bGrouped){k(e,i,d,t)}c();throw S.ActionExecutionFailed})}return u.catch(()=>{c();throw S.ActionExecutionFailed})}function k(e,t,n,i){const o=sap.ui.getCore().getMessageManager().getMessageModel().getData();const{processedMessageIds:s,delaySuccessMessages:a,strictHandlingTransitionFails:r}=n;const l=o.filter(function(e){const t=s.find(function(t){return e.id===t});if(!t){s.push(e.id);if(e.type===b.Success){a.push(e)}}return e.persistent===true&&e.type!==b.Success&&!t});if(l.length){if(i!==null&&i!==void 0&&i.internalModelContext){r.push({oAction:e,groupId:t})}}}function W(){let t=null,n=null;const i=new Promise(function(e,i){t=e;n=i}).catch(function(t){e.error("Error while executing action ",t)});return{oLocalActionPromise:i,internalOperationsPromiseResolve:t,internalOperationsPromiseReject:n}}function q(e){let t=[];if(e){const e=o.getMessages();const n=o.getMessages(true);t=[...e,...n]}return t.some(function(e){return e.getType()==="Error"||e.getType()==="Warning"})}function U(t,n,i,o,s){const a=n.aContexts||[];const r=n.model;const l=n.aActionParameters||[];const c=n.actionName;const d=n.fnOnSubmitted;const u=n.fnOnResponse;const f=O(i);let p;function m(){if(l&&l.length){for(let e=0;e<l.length;e++){if(!l[e].value){switch(l[e].$Type){case"Edm.String":l[e].value="";break;case"Edm.Boolean":l[e].value=false;break;case"Edm.Byte":case"Edm.Int16":case"Edm.Int32":case"Edm.Int64":l[e].value=0;break;default:break}}p.setParameter(l[e].$Name,l[e].value)}}}if(a.length){return new Promise(function(i){const l=n.mBindingParameters;const u=n.bGrouped;const h=n.bGetBoundContext;const M=[];let E;let P;let C;const x=W();const b=function(e,i,a,r){m();const l=[];C=!u?`$auto.${i}`:e.getUpdateGroupId();n.requestSideEffects=J.bind(z,t,a,n,C,l);E=V(e,n,h,C,f,o,r,i,x.internalOperationsPromiseResolve,x.internalOperationsPromiseReject,s);M.push(E);l.push(x.oLocalActionPromise);J(t,a,n,C,l);return Promise.allSettled(l)};const A=function(e,i,a,l){const c=[];m();C=n.groupId||`apiMode${i}`;n.requestSideEffects=J.bind(z,t,a,n,C,c);E=V(e,n,h,C,f,o,l,i,x.internalOperationsPromiseResolve,x.internalOperationsPromiseReject,s);M.push(E);c.push(x.oLocalActionPromise);J(t,a,n,C,c);r.submitBatch(C);return Promise.allSettled(c)};async function O(){const t=[];for(P=0;P<a.length;P++){p=r.bindContext(`${c}(...)`,a[P],l);t.push(b(p,a.length<=1?null:P,{context:a[P],pathExpressions:n.additionalSideEffect&&n.additionalSideEffect.pathExpressions,triggerActions:n.additionalSideEffect&&n.additionalSideEffect.triggerActions},a.length))}(d||function e(){})(M);await Promise.allSettled(t);if(s&&s.strictHandlingPromises.length){try{if(!q(true)){await v.renderMessageView(n,f,o,s.strictHandlingWarningMessages,s,a.length>1)}else{s.strictHandlingPromises.forEach(function(e){e.resolve(false)});const e=g.getMessageManager().getMessageModel();const t=e.getData();e.setData(t.concat(s.strictHandlingWarningMessages))}}catch{e.error("Retriggering of strict handling actions failed")}}y()}async function S(e){(d||function e(){})(M);function t(e,t,i){var o,s,a;p=r.bindContext(`${c}(...)`,e,l);const d=(o=n.control)===null||o===void 0?void 0:(s=o.getRowBinding)===null||s===void 0?void 0:(a=s.call(o))===null||a===void 0?void 0:a.getHeaderContext();return A(p,t,{context:d&&d.getPath()===e.getPath()?d:e,pathExpressions:n.additionalSideEffect&&n.additionalSideEffect.pathExpressions,triggerActions:n.additionalSideEffect&&n.additionalSideEffect.triggerActions},i)}await e.reduce(async(e,n,i)=>{await e;await t(n,i+1,a.length)},Promise.resolve());if(s&&s.strictHandlingPromises.length){await v.renderMessageView(n,f,o,s.strictHandlingWarningMessages,s,a.length>1)}y()}if(!u){S(a)}else{O()}function y(){return Promise.allSettled(M).then(i)}}).finally(function(){(u||function e(){})()})}else{p=r.bindContext(`/${c}(...)`);m();const t="actionImport";const i=p.execute(t,undefined,v.fnOnStrictHandlingFailed.bind(z,t,{label:n.label,model:r},f,null,null,null,o,s));r.submitBatch(t);(d||function e(){})(i);return i.then(function(e){if(e){return e}else{var t,n,i;return(t=(n=p).getBoundContext)===null||t===void 0?void 0:(i=t.call(n))===null||i===void 0?void 0:i.getObject()}}).catch(function(t){e.error("Error while executing action "+c,t);throw t}).finally(function(){(u||function e(){})()})}}function X(e,t){let n=e.getPath();n=e.getObject("$IsBound")?n.split("@$ui5.overload")[0]:n.split("/0")[0];return n.split(`/${t}`)[0]}function K(e,t,n,i){if(n){for(const e of t){if(e.$Name!=="ResultIsActiveEntity"&&!(n!==null&&n!==void 0&&n.find(t=>t.name===e.$Name))){return false}}}else if(e&&i){for(const e of t){if(!i[e.$Name]){return false}}}return true}function J(n,i,o,s,a){const r=n.getSideEffectsService();let l;if(i&&i.triggerActions&&i.triggerActions.length){i.triggerActions.forEach(function(e){if(e){l=r.executeAction(e,i.context,s);if(a){a.push(l)}}})}if(i&&i.pathExpressions&&i.pathExpressions.length>0){l=r.requestSideEffects(i.pathExpressions,i.context,s);if(a){a.push(l)}l.then(function(){if(o.operationAvailableMap&&o.internalModelContext){t.setActionEnablement(o.internalModelContext,JSON.parse(o.operationAvailableMap),o.selectedItems,"table")}}).catch(function(t){e.error("Error while requesting side effects",t)})}}const z={callBoundAction:T,callActionImport:_,callBoundFunction:w,callFunctionImport:N,executeDependingOnSelectedContexts:V,createinternalOperationsPromiseForActionExecution:W,valuesProvidedForAllParameters:K,getActionParameterActionName:L,actionParameterShowMessageCallback:G,afterActionResolution:R,isChangeSetAndHasErrorsOrWarnings:q};return z},false);
//# sourceMappingURL=facade.js.map