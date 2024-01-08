/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/Core","sap/ui/mdc/condition/FilterOperatorUtil","sap/ui/mdc/condition/Operator","sap/ui/mdc/enums/ConditionValidated","sap/ui/mdc/enums/OperatorValueType","sap/ui/model/Filter","sap/ui/model/FilterOperator","sap/ui/model/json/JSONModel"],function(e,t,a,r,i,n,s,o){"use strict";const A=e.getLibraryResourceBundle("sap.fe.core");const l={ALL:{id:"ALL",display:A.getText("C_DRAFT_EDIT_STATE_DRAFT_ALL_FILTER")},UNCHANGED:{id:"UNCHANGED",display:A.getText("C_DRAFT_EDIT_STATE_DRAFT_UNCHANGED_FILTER")},OWN_DRAFT:{id:"OWN_DRAFT",display:A.getText("C_DRAFT_EDIT_STATE_DRAFT_OWN_DRAFT_FILTER")},LOCKED:{id:"LOCKED",display:A.getText("C_DRAFT_EDIT_STATE_DRAFT_LOCKED_FILTER")},UNSAVED_CHANGES:{id:"UNSAVED_CHANGES",display:A.getText("C_DRAFT_EDIT_STATE_DRAFT_UNSAVED_CHANGES_FILTER")},ALL_HIDING_DRAFTS:{id:"ALL_HIDING_DRAFTS",display:A.getText("C_DRAFT_EDIT_STATE_DRAFT_ALL_HIDING_DRAFTS_FILTER")},SAVED_ONLY:{id:"SAVED_ONLY",display:A.getText("C_DRAFT_EDIT_STATE_DRAFT_SAVED_ONLY_FILTER")},MY_DRAFTS:{id:"MY_DRAFTS",display:A.getText("C_DRAFT_EDIT_STATE_DRAFT_MY_DRAFTS_FILTER")},getEditStatesContext:function(e){let t;if(e.getProperty("isDraftCollaborative")){t=[l.ALL,l.MY_DRAFTS,l.SAVED_ONLY]}else{t=[l.ALL,l.ALL_HIDING_DRAFTS,l.UNCHANGED,l.OWN_DRAFT,l.LOCKED,l.UNSAVED_CHANGES]}return new o(t).bindContext("/").getBoundContext()},getCurrentUserID:function(){var e,t,a;return(e=sap.ushell)===null||e===void 0?void 0:(t=e.Container)===null||t===void 0?void 0:(a=t.getUser())===null||a===void 0?void 0:a.getId()},getFilterForEditState:function(e){switch(e){case l.UNCHANGED.id:return new n({filters:[new n({path:"IsActiveEntity",operator:s.EQ,value1:true}),new n({path:"HasDraftEntity",operator:s.EQ,value1:false})],and:true});case l.OWN_DRAFT.id:return new n({path:"IsActiveEntity",operator:s.EQ,value1:false});case l.LOCKED.id:return new n({filters:[new n({path:"IsActiveEntity",operator:s.EQ,value1:true}),new n({path:"SiblingEntity/IsActiveEntity",operator:s.EQ,value1:null}),new n({path:"DraftAdministrativeData/InProcessByUser",operator:s.NE,value1:""}),new n({path:"DraftAdministrativeData/InProcessByUser",operator:s.NE,value1:null})],and:true});case l.UNSAVED_CHANGES.id:return new n({filters:[new n({path:"IsActiveEntity",operator:s.EQ,value1:true}),new n({path:"SiblingEntity/IsActiveEntity",operator:s.EQ,value1:null}),new n({path:"DraftAdministrativeData/InProcessByUser",operator:s.EQ,value1:""})],and:true});case l.ALL_HIDING_DRAFTS.id:case l.SAVED_ONLY.id:return new n({path:"IsActiveEntity",operator:s.EQ,value1:true});case l.MY_DRAFTS.id:const e=this.getCurrentUserID();return e?new n({filters:[new n({path:"IsActiveEntity",operator:s.EQ,value1:false}),new n({path:"DraftAdministrativeData/DraftAdministrativeUser",operator:s.Any,variable:"user",condition:new n({path:"user/UserID",operator:s.EQ,value1:this.getCurrentUserID()})})],and:true}):new n({path:"IsActiveEntity",operator:s.EQ,value1:false});default:return new n({filters:[new n({path:"IsActiveEntity",operator:s.EQ,value1:false}),new n({path:"SiblingEntity/IsActiveEntity",operator:s.EQ,value1:null})],and:false})}},addDraftEditStateOperator:function(){t.addOperator(new a({name:"DRAFT_EDIT_STATE",filterOperator:"",valueTypes:[i.Self,i.Self],tokenParse:"^(.*)$",format:function(e){return e&&e.values[1]},getModelFilter:function(e){return l.getFilterForEditState(e.values[0])},parse:function(e){return e},validateInput:true,checkValidated:function(e){e.validated=r.Validated}}))}};return l},false);
//# sourceMappingURL=DraftEditState.js.map