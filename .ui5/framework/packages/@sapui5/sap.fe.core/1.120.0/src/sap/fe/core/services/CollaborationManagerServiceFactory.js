/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/ui/core/service/Service","sap/ui/core/service/ServiceFactory"],function(e,t,i){"use strict";function r(e){return new Promise((t,i)=>{sap.ui.require([e],i=>{if(!(i&&i.__esModule)){i=i===null||!(typeof i==="object"&&e.endsWith("/library"))?{default:i}:i;Object.defineProperty(i,"__esModule",{value:true})}t(i)},e=>{i(e)})})}var s={};function n(e,t){e.prototype=Object.create(t.prototype);e.prototype.constructor=e;a(e,t)}function a(e,t){a=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(t,i){t.__proto__=i;return t};return a(e,t)}let o=function(t){n(i,t);function i(){var e;for(var i=arguments.length,r=new Array(i),s=0;s<i;s++){r[s]=arguments[s]}e=t.call(this,...r)||this;e.__implements__sap_insights_ICardProvider=true;e.registered=false;return e}s.CollaborationManagerService=i;var a=i.prototype;a.getCardsChannel=async function e(){const{default:t}=await r("sap/insights/CardHelper");const i=await t.getServiceAsync("UIService");return i.getCardsChannel()};a.connect=async function t(i,r){try{const e=await this.getCardsChannel();if(e.isEnabled()){this.onRetrieveAvailableCards=r;this.channel=e;this.id=i;this.consumers={};this.sharedCards=[];await this.registerProvider()}}catch(t){e.debug("Collaboration Manager connection failed",t)}return this};a.onConsumerConnected=async function e(t){if(!this.consumers[t]){var i;this.consumers[t]=true;await((i=this.onRetrieveAvailableCards)===null||i===void 0?void 0:i.call(this));this.shareAvailableCards(t)}return Promise.resolve(Object.keys(this.consumers).length)};a.onConsumerDisconnected=async function e(t){if(this.consumers[t]){delete this.consumers[t]}return Promise.resolve(Object.keys(this.consumers).length)};a.onCardRequested=function e(t,i){const r=this.sharedCards.find(e=>(e===null||e===void 0?void 0:e.id)===i);r===null||r===void 0?void 0:r.callback(r.card);return r};a.onViewUpdate=async function e(t){if(this.registered!==t){if(t){await this.registerProvider();this.updateConsumers()}else{await this.unregisterProvider()}}else if(this.registered){this.updateConsumers()}};a.registerProvider=async function e(){if(this.channel){await this.channel.registerProvider(this.id,this);this.registered=true}};a.unregisterProvider=async function e(){if(this.channel){await this.channel.unregister(this.id);this.registered=false;this.consumers={};this.sharedCards=[]}};a.updateConsumers=function e(){this.shareAvailableCards()};a.shareAvailableCards=function e(){let t=arguments.length>0&&arguments[0]!==undefined?arguments[0]:"*";this.channel.publishAvailableCards(this.id,this.sharedCards,t)};a.addCardsToCollaborationManager=function e(t,i){this.sharedCards=[];for(const[e,r]of Object.entries(t)){this.sharedCards.push({id:e,title:r.title,parentAppId:i,callback:r.callback,card:r.card})}};a.publishCard=function e(t){this.channel.publishCard(this.id,{id:t["sap.app"].id,descriptorContent:t},"*")};return i}(t);s.CollaborationManagerService=o;let c=function(e){n(t,e);function t(){return e.apply(this,arguments)||this}s=t;var i=t.prototype;i.createInstance=async function e(t){this.instance=new o(t);return Promise.resolve(this.instance)};i.getInstance=function e(){return this.instance};return t}(i);c.serviceClass=o;s=c;return s},false);
//# sourceMappingURL=CollaborationManagerServiceFactory.js.map