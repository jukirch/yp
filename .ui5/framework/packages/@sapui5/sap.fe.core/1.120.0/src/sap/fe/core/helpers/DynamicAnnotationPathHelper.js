/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/base/BindingParser"],function(s){"use strict";var t={};function r(s,t){if(!s){return null}const e=t.split("/");if(e.length===1){return s[t]}else{return r(s[e[0]],e.splice(1).join("/"))}}function e(t,n){if(t.indexOf("[")!==-1){const i=t.indexOf("[");const u=t.substr(0,i);const a=t.substr(i+1);const l=a.indexOf("]");const o=n.getObject(u);const f=s.parseExpression(a.substr(0,l));if(Array.isArray(o)&&f&&f.result&&f.result.parts&&f.result.parts[0]&&f.result.parts[0].path){let s;let i=false;for(s=0;s<o.length&&!i;s++){const t=r(o[s],f.result.parts[0].path);const e=f.result.formatter(t);if(e){i=true}}if(i){t=e(u+(s-1)+a.substr(l+1),n)}}}return t}t.resolveDynamicExpression=e;return t},false);
//# sourceMappingURL=DynamicAnnotationPathHelper.js.map