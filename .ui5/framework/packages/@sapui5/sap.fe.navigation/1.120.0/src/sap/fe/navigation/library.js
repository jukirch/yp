/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/Core","sap/ui/core/library"],function(a,e){"use strict";var n={};let i;(function(a){a["SelVarWins"]="SelVarWins";a["URLParamWins"]="URLParamWins";a["InsertInSelOpt"]="InsertInSelOpt"})(i||(i={}));n.ParamHandlingMode=i;let r;(function(a){a["initial"]="initial";a["URLParams"]="URLParams";a["xAppState"]="xAppState";a["iAppState"]="iAppState";a["hybrid"]="hybrid"})(r||(r={}));n.NavType=r;let t;(function(a){a[a["standard"]=0]="standard";a[a["ignoreEmptyString"]=1]="ignoreEmptyString";a[a["raiseErrorOnNull"]=2]="raiseErrorOnNull";a[a["raiseErrorOnUndefined"]=4]="raiseErrorOnUndefined"})(t||(t={}));n.SuppressionBehavior=t;let s;(function(a){a["ODataV2"]="ODataV2";a["ODataV4"]="ODataV4"})(s||(s={}));n.Mode=s;const o="sap.fe.navigation";n.feNavigationNamespace=o;const p=a.initLibrary({name:"sap.fe.navigation",version:"1.120.0",dependencies:["sap.ui.core"],types:["sap.fe.navigation.NavType","sap.fe.navigation.ParamHandlingMode","sap.fe.navigation.SuppressionBehavior"],interfaces:[],controls:[],elements:[],noLibraryCSS:true});p.ParamHandlingMode=i;p.NavType=r;p.SuppressionBehavior=t;p.Mode=s;return p},false);
//# sourceMappingURL=library.js.map