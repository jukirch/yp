/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/fe/core/helpers/ResourceModelHelper","sap/fe/core/library","sap/m/MessageBox","sap/ui/core/Core","../../operationsHelper"],function(e,t,n,o,i,c){"use strict";var s=t.getResourceModel;const r=n.ProgrammingModel;async function a(e,t){const n=e.getModel(),o=n.getMetaModel(),i=o.getMetaPath(e.getPath()),r=o.getObject(`${i}@com.sap.vocabularies.Session.v1.StickySessionSupported/EditAction`);if(!r){throw new Error(`Edit Action for Sticky Session not found for ${i}`)}const a=s(t);const d=a.getText("C_COMMON_OBJECT_PAGE_EDIT");const u=n.bindContext(`${r}(...)`,e,{$$inheritExpandSelect:true});const f="direct";const g=u.execute(f,undefined,c.fnOnStrictHandlingFailed.bind(l,f,{label:d,model:n},a,null,null,null,undefined,undefined));n.submitBatch(f);const S=await g;const M=t.getSideEffectsService().getODataActionSideEffects(r,S);if(M!==null&&M!==void 0&&M.triggerActions&&M.triggerActions.length){await t.getSideEffectsService().requestSideEffectsForODataAction(M,S)}return S}async function d(t,n){const o=t.getModel(),i=o.getMetaModel(),r=i.getMetaPath(t.getPath()),a=i.getObject(`${r}@com.sap.vocabularies.Session.v1.StickySessionSupported/SaveAction`);if(!a){throw new Error(`Save Action for Sticky Session not found for ${r}`)}const d=s(n);const u=d.getText("C_OP_OBJECT_PAGE_SAVE");const f=o.bindContext(`${a}(...)`,t,{$$inheritExpandSelect:true});const g="direct";const S=f.execute(g,undefined,c.fnOnStrictHandlingFailed.bind(l,g,{label:u,model:o},d,null,null,null,undefined,undefined));o.submitBatch(g);try{return await S}catch(o){const c=i.getObject(`${r}/@${"com.sap.vocabularies.Common.v1.Messages"}/$Path`);if(c){try{await n.getSideEffectsService().requestSideEffects([c],t)}catch(t){e.error("Error while requesting side effects",t)}}throw o}}function u(e){const t=e.getModel(),n=t.getMetaModel(),o=n.getMetaPath(e.getPath()),i=n.getObject(`${o}@com.sap.vocabularies.Session.v1.StickySessionSupported/DiscardAction`);if(!i){throw new Error(`Discard Action for Sticky Session not found for ${o}`)}const c=t.bindContext(`/${i}(...)`);return c.execute("$direct").then(function(){return e})}function f(t,n,c){const s=n.getModel("ui").getProperty("/isEditable"),a=i.getLibraryResourceBundle("sap.fe.templates"),d=a&&a.getText("T_COMMON_UTILS_NAVIGATION_AWAY_MSG"),u=a&&a.getText("T_COMMON_UTILS_NAVIGATION_AWAY_CONFIRM_BUTTON"),f=a&&a.getText("T_COMMON_UTILS_NAVIGATION_AWAY_CANCEL_BUTTON");if(c===r.Sticky&&s){return o.warning(d,{actions:[u,f],emphasizedAction:u,onClose:function(n){if(n===u){e.info("Navigation confirmed.");t()}else{e.info("Navigation rejected.")}}})}return t()}const l={editDocumentInStickySession:a,activateDocument:d,discardDocument:u,processDataLossConfirmation:f};return l},false);
//# sourceMappingURL=sticky.js.map