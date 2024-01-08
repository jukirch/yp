/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/deepClone","sap/fe/core/CommonUtils","sap/fe/macros/chart/ChartUtils","sap/fe/macros/DelegateUtil","sap/fe/macros/table/delegates/TableDelegate","sap/fe/macros/table/Utils","sap/ui/model/Filter"],function(e,t,n,i,o,a,l){"use strict";const s=Object.assign({},o,{apiVersion:2,_internalUpdateBindingInfo:function(o,r){var c,g;let d;let f={},u={};let p;Object.assign(r,e(i.getCustomData(o,"rowsBindingInfo")));if(o.getRowBinding()){r.suspended=false}const h=t.getTargetView(o);const C=(c=(g=h.getController()).getChartControl)===null||c===void 0?void 0:c.call(g);const b=C===null||C===void 0?void 0:C.getParent();const v=b===null||b===void 0?void 0:b.hasSelections();u=a.getAllFilterInfo(o);const m=u&&u.filters;d=u;if(v){f=n.getAllFilterInfo(C);p=f&&f.filters?t.getChartPropertiesWithoutPrefixes(f.filters):null;d=f}const P=(m&&p?m.concat(p):p||m)||[];const I=P.length>0&&new l({filters:P,and:true});if(d.bindingPath){r.path=d.bindingPath}s.updateBindingInfoWithSearchQuery(r,d,I)},rebind:function(e,t){const n=e.getBindingContext("pageInternal");const i=n===null||n===void 0?void 0:n.getProperty(`${n.getPath()}/alpContentView`);if(i!=="Chart"){o.rebind(e,t)}}});return s},false);
//# sourceMappingURL=ALPTableDelegate.js.map