/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/library"],function(e){"use strict";var r=e.TitleLevel;const t={isReferenceFacetPartOfPreview:function(e,r){r=r.toString();if(e.$Type==="com.sap.vocabularies.UI.v1.ReferenceFacet"){const t=e["@com.sap.vocabularies.UI.v1.PartOfPreview"];return r==="true"&&t!==false||r==="false"&&t===false}return false},create$Select:function(e){return(e||[]).map(e=>e.$PropertyPath).join(",")},generateBindingExpression:function(e,r){if(!e&&!r){return""}const n={path:e||""};if(r){n.parameters={$select:t.create$Select(r)}}return JSON.stringify(n)},getFormContainerTitleLevel:function(e,t){if(!e){return t}switch(t){case r.H1:return r.H2;case r.H2:return r.H3;case r.H3:return r.H4;case r.H4:return r.H5;case r.H5:case r.H6:return r.H6;default:return r.Auto}}};return t},false);
//# sourceMappingURL=FormHelper.js.map