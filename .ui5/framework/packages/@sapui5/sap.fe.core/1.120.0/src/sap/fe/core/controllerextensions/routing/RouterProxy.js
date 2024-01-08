/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/fe/core/helpers/ClassSupport","sap/fe/core/helpers/Synchronization","sap/ui/base/Object","sap/ui/core/Core","sap/ui/thirdparty/URI"],function(t,e,s,i,n,o){"use strict";var a,r;var h=e.defineUI5Class;function u(t,e){t.prototype=Object.create(e.prototype);t.prototype.constructor=t;c(t,e)}function c(t,e){c=Object.setPrototypeOf?Object.setPrototypeOf.bind():function t(e,s){e.__proto__=s;return e};return c(t,e)}const l={EQUAL:0,COMPATIBLE:1,ANCESTOR:2,DIFFERENT:3};const f={LAYOUTPARAM:"layout",IAPPSTATEPARAM:"sap-iapp-state"};function d(t){return{_guardHash:t.replace(/\?[^?]*$/,""),check:function(t){return t.indexOf(this._guardHash)===0}}}function g(t){return t.replace(new RegExp(`[&?]*${f.IAPPSTATEPARAM}=[^&]*`),"")}let p=(a=h("sap.fe.core.RouterProxy"),a(r=function(e){u(i,e);function i(){var t;for(var s=arguments.length,i=new Array(s),n=0;n<s;n++){i[n]=arguments[n]}t=e.call(this,...i)||this;t.bIsRebuildHistoryRunning=false;t.bIsComputingTitleHierachy=false;t.bIsGuardCrossAllowed=false;t.sIAppStateKey=null;t._bActivateRouteMatchSynchro=false;t._bApplyRestore=false;t._bDelayedRebuild=false;t._pathMappings=[];t.restoreHistoryTriggered=false;return t}var a=i.prototype;a.init=function e(s,i){s.getService("shellServices").then(()=>{this._oShellServices=s.getShellServices();this.initRaw(s.getRouter());this.waitForRouteMatchBeforeNavigation();history.replaceState(Object.assign({feLevel:0},history.state),"",window.location);this.fclEnabled=i;this._fnBlockingNavFilter=this._blockingNavigationFilter.bind(this);this._oShellServices.registerNavigationFilter(this._fnBlockingNavFilter)}).catch(function(e){t.error("Cannot retrieve the shell services",e)});this._fnHashGuard=this.hashGuard.bind(this);window.addEventListener("popstate",this._fnHashGuard);this._bDisableOnHashChange=false;this._bIgnoreRestore=false;this._bForceFocus=true};a.destroy=function t(){if(this._oShellServices){this._oShellServices.unregisterNavigationFilter(this._fnBlockingNavFilter)}window.removeEventListener("popstate",this._fnHashGuard)};a.setAppStateInHash=function t(e,s){let i;if(e.includes(f.IAPPSTATEPARAM)){i=e.replace(new RegExp(`${f.IAPPSTATEPARAM}=[^&]*`),`${f.IAPPSTATEPARAM}=${s}`)}else{if(!e.includes("?")){i=`${e}?`}else{i=`${e}&`}i+=`${f.IAPPSTATEPARAM}=${s}`}return i};a.findAppStateInHash=function t(e){const s=e.match(new RegExp(`\\?.*${f.IAPPSTATEPARAM}=([^&]*)`));return s&&s.length>1?s[1]:null};a.initRaw=function t(e){this._oRouter=e;this._oManagedHistory=[];this._oNavigationGuard=null;const s=this.getHash();this._oManagedHistory.push(this._extractStateFromHash(s));this.sIAppStateKey=this.findAppStateInHash(s)};a.getHash=function t(){return this._oRouter.getHashChanger().getHash()};a.isFocusForced=function t(){return this._bForceFocus};a.setFocusForced=function t(e){this._bForceFocus=e};a.removeIAppStateKey=function t(){this.sIAppStateKey=null};a.navToHash=function t(e,s,i,n,o){if(o!==false){this._oShellServices.setBackNavigation()}if(this._oRouteMatchSynchronization){return this._oRouteMatchSynchronization.waitFor().then(()=>{this._oRouteMatchSynchronization=undefined;return this._internalNavToHash(e,s,i,n)})}else{if(this._bActivateRouteMatchSynchro){this.waitForRouteMatchBeforeNavigation()}return this._internalNavToHash(e,s,i,n)}};a._internalNavToHash=function t(e,s,i,o){if(this.fclEnabled&&this.sIAppStateKey&&!this.findAppStateInHash(e)){e=this.setAppStateInHash(e,this.sIAppStateKey)}if(!this.checkHashWithGuard(e)){if(!this.oResourceBundle){this.oResourceBundle=n.getLibraryResourceBundle("sap.fe.core")}if(!confirm(this.oResourceBundle.getText("C_ROUTER_PROXY_SAPFE_EXIT_NOTSAVED_MESSAGE"))){return Promise.resolve(false)}this.bIsGuardCrossAllowed=true}const a=this._extractStateFromHash(e);if(!this._bForceFocus){const t=this._extractEntitySetsFromHash(this.getHash());this._bForceFocus=o||t.length<a.keys.length&&t.every(function(t,e){return t===a.keys[e]})}const r=this._pushNewState(a,false,s,i);this.storeFocusInfoForCurrentHash();return this._rebuildBrowserHistory(r,false)};a.restoreHistory=function t(){if(this._bApplyRestore){this._bApplyRestore=false;let t=this.getHash();t=t.replace(/(\?|&)restoreHistory=true/,"");const e=this._extractStateFromHash(t);const s=this._pushNewState(e,true,false,true);this.restoreHistoryTriggered=true;return this._rebuildBrowserHistory(s,true)}else{return Promise.resolve()}};a.checkRestoreHistoryWasTriggered=function t(){return this.restoreHistoryTriggered};a.resetRestoreHistoryFlag=function t(){this.restoreHistoryTriggered=false};a.navBack=function t(){const e=this.getHash();let s;for(let t=this._oManagedHistory.length-1;t>0;t--){if(this._oManagedHistory[t].hash===e){s=this._oManagedHistory[t-1].hash;break}}if(s){return this.navToHash(s)}else{window.history.back();return Promise.resolve()}};a.navTo=function t(e,s){const i=this._oRouter.getURL(e,s);return this.navToHash(i,false,s.noPreservationCache,false,!s.bIsStickyMode)};a.exitFromApp=function t(){return this._oShellServices.backToPreviousApp()};a.isCurrentStateImpactedBy=function t(e){if(e[0]==="/"){e=e.substring(1)}const s=d(e);return s.check(this.getHash())};a.isNavigationFinalized=function t(){return!this.bIsRebuildHistoryRunning&&!this._bDelayedRebuild};a.setNavigationGuard=function t(e){this._oNavigationGuard=d(e);this.bIsGuardCrossAllowed=false};a.discardNavigationGuard=function t(){this._oNavigationGuard=null};a.hasNavigationGuard=function t(){return this._oNavigationGuard!==null};a.checkHashWithGuard=function t(e){return this._oNavigationGuard===null||this._oNavigationGuard.check(e)};a.isGuardCrossAllowedByUser=function t(){return this.bIsGuardCrossAllowed};a.activateRouteMatchSynchronization=function t(){this._bActivateRouteMatchSynchro=true};a.resolveRouteMatch=function t(){if(this._oRouteMatchSynchronization){this._oRouteMatchSynchronization.resolve()}};a.waitForRouteMatchBeforeNavigation=function t(){this._oRouteMatchSynchronization=new s;this._bActivateRouteMatchSynchro=false};a._extractEntitySetsFromHash=function t(e){if(e===undefined){e=""}const s=e.split("?")[0];const i=s.split("/");const n=[];i.forEach(t=>{if(t.length){n.push(t.split("(")[0])}});return n};a._extractStateFromHash=function t(e){if(e===undefined){e=""}const s={keys:this._extractEntitySetsFromHash(e)};const i=e.match(new RegExp(`\\?.*${f.LAYOUTPARAM}=([^&]*)`));s.sLayout=i&&i.length>1?i[1]:null;if(s.sLayout==="MidColumnFullScreen"){s.screenMode=1}else if(s.sLayout==="EndColumnFullScreen"){s.screenMode=2}else{s.screenMode=0}s.hash=e;return s};a._pushNewState=function t(e,s,i,n){const o=this.getHash();let a=this._oManagedHistory.length-1;let r=s?1:0;if(!s){while(a>=0&&this._oManagedHistory[a].hash!==o){this._oManagedHistory.pop();a--}if(this._oManagedHistory.length===0){this._oManagedHistory.push(this._extractStateFromHash(o));history.replaceState(Object.assign({feLevel:0},history.state),"")}}if(i&&!n){this._oManagedHistory[this._oManagedHistory.length-1].preserved=true}let h;while(this._oManagedHistory.length>0){const t=this._oManagedHistory[this._oManagedHistory.length-1];if((n||!t.preserved)&&this._compareCacheStates(t,e)!==l.ANCESTOR){h=this._oManagedHistory.pop();r++}else if(t.preserved&&g(t.hash)===g(e.hash)){h=this._oManagedHistory.pop();r++;e.preserved=true;break}else{break}}this.sIAppStateKey=this.findAppStateInHash(e.hash);if(!this.fclEnabled&&h){const t=this.findAppStateInHash(h.hash);const s=this._compareCacheStates(h,e);if(!this.sIAppStateKey&&t&&(s===l.EQUAL||s===l.COMPATIBLE)){e.hash=this.setAppStateInHash(e.hash,t)}}const u=h&&e.hash===h.hash;if(this._oManagedHistory.length===0||this._oManagedHistory[this._oManagedHistory.length-1].hash!==e.hash){this._oManagedHistory.push(e);if(h&&g(h.hash)===g(e.hash)){e.focusControlId=h.focusControlId;e.focusInfo=h.focusInfo}}if(r===0){return{type:"append"}}else if(r===1){return u?{type:"none"}:{type:"replace"}}else{return u?{type:"back",steps:r-1}:{type:"back-replace",steps:r-1}}};a._blockingNavigationFilter=function t(){return this._bDisableOnHashChange?"Custom":"Continue"};a._disableEventOnHashChange=function t(){this._bDisableOnHashChange=true;this._oRouter.stop()};a._enableEventOnHashChange=function t(e){this._bDisableOnHashChange=false;this._oRouter.initialize(e)};a._rebuildBrowserHistory=function t(e,s){const i=this;return new Promise(t=>{var n;this.bIsRebuildHistoryRunning=true;const o=this._oManagedHistory[this._oManagedHistory.length-1],a=this._oManagedHistory.length-1;function r(){if(!s){i._enableEventOnHashChange(true)}i._oRouter.getHashChanger().replaceHash(o.hash);history.replaceState(Object.assign({feLevel:a},history.state),"");if(s){setTimeout(function(){i._enableEventOnHashChange(true)},0)}i.bIsRebuildHistoryRunning=false;t(true)}function h(){window.removeEventListener("popstate",h);setTimeout(function(){r()},0)}function u(){window.removeEventListener("popstate",u);i.bIsRebuildHistoryRunning=false;t(true)}i._bIgnoreRestore=true;switch(e.type){case"replace":const s=(n=history.state)===null||n===void 0?void 0:n.focusInfo;i._oRouter.getHashChanger().replaceHash(o.hash);history.replaceState(Object.assign({feLevel:a,focusInfo:s},history.state),"");i.bIsRebuildHistoryRunning=false;t(true);break;case"append":i._oRouter.getHashChanger().setHash(o.hash);history.replaceState(Object.assign({feLevel:a},history.state),"");i.bIsRebuildHistoryRunning=false;t(true);break;case"back":window.addEventListener("popstate",u);history.go(-e.steps);break;case"back-replace":this._disableEventOnHashChange();window.addEventListener("popstate",h);history.go(-e.steps);break;default:this.bIsRebuildHistoryRunning=false;t(false)}})};a.getLastHistoryEntry=function t(){return this._oManagedHistory[this._oManagedHistory.length-1]};a.setPathMapping=function t(e){this._pathMappings=e.filter(t=>t.oldPath!==t.newPath)};a.hashGuard=function t(){let e=window.location.hash;if(e.includes("restoreHistory=true")){this._bApplyRestore=true}else if(!this.bIsRebuildHistoryRunning){const t=this._pathMappings.find(t=>e.includes(t.oldPath));if(t){e=e.replace(t.oldPath,t.newPath);history.replaceState(Object.assign({},history.state),"",e)}const s=e.split("&/");const i=s[1]?s[1]:"";if(this.checkHashWithGuard(i)){this._bDelayedRebuild=true;const t=this._extractStateFromHash(i);this._pushNewState(t,false,false,true);setTimeout(()=>{this._bDelayedRebuild=false},0)}}};a._compareCacheStates=function t(e,s){if(e.keys.length>s.keys.length){return l.DIFFERENT}let i=true;let n;for(n=0;i&&n<e.keys.length;n++){if(e.keys[n]!==s.keys[n]){i=false}}if(!i){return l.DIFFERENT}if(e.keys.length<s.keys.length||e.screenMode<s.screenMode){return l.ANCESTOR}if(e.screenMode>s.screenMode){return l.DIFFERENT}return e.sLayout===s.sLayout?l.EQUAL:l.COMPATIBLE};a.checkIfBackIsOutOfGuard=function t(e){let s;let i;if(e===undefined){const t=this._oShellServices.splitHash(window.location.hash);if(t&&t.appSpecificRoute){i=t.appSpecificRoute;if(i.indexOf("&/")===0){i=i.substring(2)}}else{i=window.location.hash.substring(1);if(i[0]==="/"){i=i.substring(1)}}}else{i=e}e=o.decode(i);if(this._oNavigationGuard){for(let t=this._oManagedHistory.length-1;t>0;t--){if(this._oManagedHistory[t].hash===e){s=this._oManagedHistory[t-1].hash;break}}return!s||!this.checkHashWithGuard(s)}return false};a.checkIfBackHasSameContext=function t(){if(this._oManagedHistory.length<2){return false}const e=this._oManagedHistory[this._oManagedHistory.length-1];const s=this._oManagedHistory[this._oManagedHistory.length-2];return e.hash.split("?")[0]===s.hash.split("?")[0]};a.restoreFocusForCurrentHash=function t(){const e=g(this.getHash());const s=this._oManagedHistory.find(t=>g(t.hash)===e);let i=false;if(s!==null&&s!==void 0&&s.focusControlId){const t=sap.ui.getCore().byId(s.focusControlId);t===null||t===void 0?void 0:t.focus(s.focusInfo);i=t!==undefined}return i};a.storeFocusInfoForCurrentHash=function t(){const e=g(this.getHash());const s=this._oManagedHistory.find(t=>g(t.hash)===e);if(s){const t=sap.ui.getCore().getCurrentFocusedControlId();const e=t?sap.ui.getCore().byId(t):undefined;s.focusControlId=t;s.focusInfo=e===null||e===void 0?void 0:e.getFocusInfo()}};a.findLayoutForHash=function t(e){var s;if(!this.fclEnabled){return undefined}const i=e.split("?")[0];let n;for(let t=this._oManagedHistory.length-1;t>=0&&n===undefined;t--){if(this._oManagedHistory[t].hash.split("?")[0]===i){n=this._oManagedHistory[t]}}return(s=n)===null||s===void 0?void 0:s.sLayout};return i}(i))||r);return p},false);
//# sourceMappingURL=RouterProxy.js.map