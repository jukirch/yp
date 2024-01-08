/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/merge","sap/fe/core/converters/helpers/IssueManager","./ConverterContext","./ManifestSettings","./MetaModelConverter","./templates/ListReportConverter","./templates/ObjectPageConverter"],function(e,t,o,n,i,a,s){"use strict";var l={};var v=i.getInvolvedDataModelObjects;var c=i.convertTypes;var d=n.TemplateType;var r=t.IssueSeverity;var u=t.IssueCategoryType;var f=t.IssueCategory;function g(e,t,o,n){e.forEach(e=>{let i=`For entity set ${o}`;if((e===null||e===void 0?void 0:e.$Type)==="com.sap.vocabularies.UI.v1.CollectionFacet"&&!(e!==null&&e!==void 0&&e.ID)){var a;i=`${i}, `+`level ${n}, the collection facet does not have an ID.`;t.addIssue(f.Facets,r.High,i,u,u===null||u===void 0?void 0:(a=u.Facets)===null||a===void 0?void 0:a.MissingID)}if((e===null||e===void 0?void 0:e.$Type)==="com.sap.vocabularies.UI.v1.CollectionFacet"&&n>=3){var s;i=`${i}, collection facet ${e.Label} is not supported at `+`level ${n}`;t.addIssue(f.Facets,r.Medium,i,u,u===null||u===void 0?void 0:(s=u.Facets)===null||s===void 0?void 0:s.UnSupportedLevel)}if(e!==null&&e!==void 0&&e.Facets){g(e===null||e===void 0?void 0:e.Facets,t,o,++n);n=n-1}})}function p(t,n,i,l,u,p,I){var y;const h=c(n,p);h.diagnostics.forEach(e=>{const t=l.checkIfIssueExists(f.Annotation,r.High,e.message);if(!t){l.addIssue(f.Annotation,r.High,e.message)}});h===null||h===void 0?void 0:(y=h.entityTypes)===null||y===void 0?void 0:y.forEach(e=>{var t,o;if(e!==null&&e!==void 0&&(t=e.annotations)!==null&&t!==void 0&&(o=t.UI)!==null&&o!==void 0&&o.Facets){var n,i;g(e===null||e===void 0?void 0:(n=e.annotations)===null||n===void 0?void 0:(i=n.UI)===null||i===void 0?void 0:i.Facets,l,e===null||e===void 0?void 0:e.name,1)}});const F=i.entitySet;const m=(i===null||i===void 0?void 0:i.contextPath)||(u==="/"?u+F:u);const C=n.createBindingContext(m);const b=v(C);if(b){let n={};const v=new o(h,i,l,e,b);switch(t){case d.ListReport:case d.AnalyticalListPage:n=a.convertPage(v);break;case d.ObjectPage:n=s.convertPage(v);break}if(I!==null&&I!==void 0&&I.extendPageDefinition){n=I.extendPageDefinition(n,v)}return n}return undefined}l.convertPage=p;return l},false);
//# sourceMappingURL=TemplateConverter.js.map