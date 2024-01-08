/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/ManifestSettings","sap/ui/Device"],function(t,n){"use strict";var i=t.VariantManagementType;function e(t,n){const i=t===null||t===void 0?void 0:t[n];if(Array.isArray(i)){i.forEach(t=>e(t,"annotationPath"))}else if(i&&!i.includes("@")){t[n]="@"+i}}let o=function(){function t(t,n){var i;this.oManifestSettings=t;this.mergeFn=n;e(this.oManifestSettings,"defaultTemplateAnnotationPath");(i=this.oManifestSettings.views)===null||i===void 0?void 0:i.paths.forEach(t=>{e(t,"annotationPath");e(t,"primary");e(t,"secondary")});if(this.oManifestSettings.controlConfiguration){for(const t of Object.values(this.oManifestSettings.controlConfiguration)){var o;const n=(o=t.tableSettings)===null||o===void 0?void 0:o.quickVariantSelection;e(n,"paths")}}}var o=t.prototype;o.getTemplateType=function t(){return this.oManifestSettings.converterType};o.isFilterBarHidden=function t(){var n;return!!((n=this.oManifestSettings)!==null&&n!==void 0&&n.hideFilterBar)};o.useHiddenFilterBar=function t(){var n;return!!((n=this.oManifestSettings)!==null&&n!==void 0&&n.useHiddenFilterBar)};o.isDesktop=function t(){return!!this.oManifestSettings.isDesktop};o.isPhone=function t(){return!!this.oManifestSettings.isPhone};o.getFormContainer=function t(n){var i;return(i=this.oManifestSettings.controlConfiguration)===null||i===void 0?void 0:i[n]};o.getHeaderFacets=function t(){var n,i,e,o;return this.mergeFn({},(n=this.oManifestSettings.controlConfiguration)===null||n===void 0?void 0:(i=n["@com.sap.vocabularies.UI.v1.HeaderFacets"])===null||i===void 0?void 0:i.facets,(e=this.oManifestSettings.content)===null||e===void 0?void 0:(o=e.header)===null||o===void 0?void 0:o.facets)};o.getHeaderActions=function t(){var n,i;return((n=this.oManifestSettings.content)===null||n===void 0?void 0:(i=n.header)===null||i===void 0?void 0:i.actions)||{}};o.getFooterActions=function t(){var n,i;return((n=this.oManifestSettings.content)===null||n===void 0?void 0:(i=n.footer)===null||i===void 0?void 0:i.actions)||{}};o.getVariantManagement=function t(){return this.oManifestSettings.variantManagement||i.None};o.getDefaultTemplateAnnotationPath=function t(){return this.oManifestSettings.defaultTemplateAnnotationPath};o.getControlConfiguration=function t(n){var i,e;return((i=this.oManifestSettings)===null||i===void 0?void 0:(e=i.controlConfiguration)===null||e===void 0?void 0:e[n])||{}};o.getNavigationConfiguration=function t(n){var i,e;return((i=this.oManifestSettings)===null||i===void 0?void 0:(e=i.navigation)===null||e===void 0?void 0:e[n])||{}};o.getViewLevel=function t(){var n;return((n=this.oManifestSettings)===null||n===void 0?void 0:n.viewLevel)||-1};o.getContentDensities=function t(){var n;return((n=this.oManifestSettings)===null||n===void 0?void 0:n.contentDensities)||{cozy:false,compact:false}};o.isFclEnabled=function t(){var n;return!!((n=this.oManifestSettings)!==null&&n!==void 0&&n.fclEnabled)};o.isCondensedLayoutCompliant=function t(){var i,e;const o=((i=this.oManifestSettings)===null||i===void 0?void 0:i.contentDensities)||{cozy:false,compact:false};const s=((e=this.oManifestSettings)===null||e===void 0?void 0:e.shellContentDensity)||"compact";let t=true;const a=!n.system.desktop||n.resize.width<=320;if((o===null||o===void 0?void 0:o.cozy)===true&&(o===null||o===void 0?void 0:o.compact)!==true||s==="cozy"||a){t=false}return t};o.isCompactType=function t(){var n;const i=this.getContentDensities();const e=((n=this.oManifestSettings)===null||n===void 0?void 0:n.shellContentDensity)||"compact";return i.compact!==false||e==="compact"?true:false};o.getSectionLayout=function t(){return this.oManifestSettings.sectionLayout??"Tabs"};o.getSections=function t(){var n,i,e,o;return this.mergeFn({},(n=this.oManifestSettings.controlConfiguration)===null||n===void 0?void 0:(i=n["@com.sap.vocabularies.UI.v1.Facets"])===null||i===void 0?void 0:i.sections,(e=this.oManifestSettings.content)===null||e===void 0?void 0:(o=e.body)===null||o===void 0?void 0:o.sections)};o.isHeaderEditable=function t(){return this.getShowObjectPageHeader()&&!!this.oManifestSettings.editableHeaderContent};o.getShowAnchorBar=function t(){var n,i,e,o;return((n=this.oManifestSettings.content)===null||n===void 0?void 0:(i=n.header)===null||i===void 0?void 0:i.anchorBarVisible)!==undefined?!!((e=this.oManifestSettings.content)!==null&&e!==void 0&&(o=e.header)!==null&&o!==void 0&&o.anchorBarVisible):true};o.useIconTabBar=function t(){return this.getShowAnchorBar()&&this.oManifestSettings.sectionLayout==="Tabs"};o.getShowObjectPageHeader=function t(){var n,i,e,o;return((n=this.oManifestSettings.content)===null||n===void 0?void 0:(i=n.header)===null||i===void 0?void 0:i.visible)!==undefined?!!((e=this.oManifestSettings.content)!==null&&e!==void 0&&(o=e.header)!==null&&o!==void 0&&o.visible):true};o.getEnableLazyLoading=function t(){return this.oManifestSettings.enableLazyLoading??false};o.getViewConfiguration=function t(){return this.oManifestSettings.views};o.getStickyMultiTabHeaderConfiguration=function t(){const n=this.oManifestSettings.stickyMultiTabHeader;return n!==undefined?n:true};o.getKPIConfiguration=function t(){return this.oManifestSettings.keyPerformanceIndicators||{}};o.getFilterConfiguration=function t(){return this.getControlConfiguration("@com.sap.vocabularies.UI.v1.SelectionFields")};o.hasMultipleEntitySets=function t(){const n=this.getViewConfiguration()||{paths:[]};const i=this.oManifestSettings.entitySet;return n.paths.find(t=>{var n;if((n=t)!==null&&n!==void 0&&n.template){return undefined}else if(this.hasMultipleVisualizations(t)){const{primary:n,secondary:e}=t;return n.some(t=>t.entitySet&&t.entitySet!==i)||e.some(t=>t.entitySet&&t.entitySet!==i)}else{t=t;return t.entitySet&&t.entitySet!==i}})!==undefined};o.getContextPath=function t(){var n;return(n=this.oManifestSettings)===null||n===void 0?void 0:n.contextPath};o.hasMultipleVisualizations=function t(n){var i,e;if(!n){const t=this.getViewConfiguration()||{paths:[]};return t.paths.some(t=>{var n,i;return((n=t.primary)===null||n===void 0?void 0:n.length)>0&&((i=t.secondary)===null||i===void 0?void 0:i.length)>0})}return((i=n.primary)===null||i===void 0?void 0:i.length)>0&&((e=n.secondary)===null||e===void 0?void 0:e.length)>0};o.getEntitySet=function t(){return this.oManifestSettings.entitySet};return t}();return o},false);
//# sourceMappingURL=ManifestWrapper.js.map