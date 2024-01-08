/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["../../helpers/StableIdHelper"],function(t){"use strict";var e={};var n=t.generate;const o=["fe"];function r(){for(var t=arguments.length,e=new Array(t),r=0;r<t;r++){e[r]=arguments[r]}return function(){for(var t=arguments.length,r=new Array(t),a=0;a<t;a++){r[a]=arguments[a]}return n(o.concat(...e,...r))}}e.createIDGenerator=r;const a=r("HeaderFacet");e.getHeaderFacetID=a;const c=r("HeaderFacetContainer");e.getHeaderFacetContainerID=c;const i=r("HeaderFacet","Form");e.getHeaderFacetFormID=i;const s=r("HeaderFacetCustomContainer");e.getCustomHeaderFacetID=s;const u=r("EditableHeaderSection");e.getEditableHeaderSectionID=u;const g=r("FacetSection");e.getSectionID=g;const I=r("CustomSection");e.getCustomSectionID=I;const D=r("FacetSubSection");e.getSubSectionID=D;const d=r("CustomSubSection");e.getCustomSubSectionID=d;const C=r("SideContent");e.getSideContentID=C;const m=function(t){return n(["fe",t,"SideContentLayout"])};e.getSideContentLayoutID=m;const F=r("Form");e.getFormID=F;const S=r("FormContainer");e.getFormContainerID=S;const f=function(t,e){return n(["fe","FormContainer",t,"StandardAction",e])};e.getFormStandardActionButtonID=f;const l=r("table");e.getTableID=l;const b=r("CustomTab");e.getCustomTabID=b;const H=r("FilterBar");e.getFilterBarID=H;const p=function(){return"fe::ListReport"};e.getDynamicListReportID=p;const A=r("TabMultipleMode");e.getIconTabBarID=A;const h=function(t){return n([t,"VariantManagement"])};e.getFilterVariantManagementID=h;const y=r("Chart");e.getChartID=y;const T=function(t){return n(["CustomAction",t])};e.getCustomActionID=T;const v=r("KPI");e.getKPIID=v;return e},false);
//# sourceMappingURL=ID.js.map