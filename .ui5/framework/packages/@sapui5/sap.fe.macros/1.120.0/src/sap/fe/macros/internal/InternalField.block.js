/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockBase","sap/fe/core/buildingBlocks/BuildingBlockSupport","sap/fe/core/controllerextensions/collaboration/CollaborationCommon","sap/fe/core/converters/MetaModelConverter","sap/fe/core/formatters/CollaborationFormatter","sap/fe/core/formatters/ValueFormatter","sap/fe/core/helpers/BindingToolkit","sap/fe/core/helpers/MetaModelFunction","sap/fe/core/helpers/ModelHelper","sap/fe/core/helpers/StableIdHelper","sap/fe/core/helpers/TitleHelper","sap/fe/core/helpers/TypeGuards","sap/fe/core/templating/DataModelPathHelper","sap/fe/core/templating/PropertyHelper","sap/fe/core/templating/UIFormatters","sap/fe/macros/field/FieldTemplating","sap/fe/macros/situations/SituationsIndicator.block","sap/ui/mdc/enums/FieldEditMode","./field/FieldStructure","./valuehelp/AdditionalValueFormatter"],function(e,t,i,a,r,o,n,l,d,s,u,p,c,f,y,v,m,b,g,h){"use strict";var I,x,P,O,M,F,S,D,E,w,T,C,A,U,j,V,B,z,L,R,$,k,W,_,N,q,K,H,Q,G,J,X,Y,Z,ee,te,ie,ae,re,oe,ne,le,de,se,ue,pe,ce,fe,ye,ve,me,be,ge,he,Ie,xe,Pe;var Oe={};var Me=f.isSemanticKey;var Fe=c.getTargetObjectPath;var Se=c.getRelativePaths;var De=c.getContextRelativeTargetObjectPath;var Ee=p.isProperty;var we=u.getTitleBindingExpression;var Te=s.generate;var Ce=l.getRequiredPropertiesFromUpdateRestrictions;var Ae=l.getRequiredPropertiesFromInsertRestrictions;var Ue=n.wrapBindingExpression;var je=n.pathInModel;var Ve=n.not;var Be=n.ifElse;var ze=n.getExpressionFromAnnotation;var Le=n.formatWithTypeInformation;var Re=n.formatResult;var $e=n.fn;var ke=n.constant;var We=n.compileExpression;var _e=n.and;var Ne=i.CollaborationFieldGroupPrefix;var qe=t.defineBuildingBlock;var Ke=t.blockEvent;var He=t.blockAttribute;function Qe(e,t,i,a){if(!i)return;Object.defineProperty(e,t,{enumerable:i.enumerable,configurable:i.configurable,writable:i.writable,value:i.initializer?i.initializer.call(a):void 0})}function Ge(e){if(e===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return e}function Je(e,t){e.prototype=Object.create(t.prototype);e.prototype.constructor=e;Xe(e,t)}function Xe(e,t){Xe=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(t,i){t.__proto__=i;return t};return Xe(e,t)}function Ye(e,t,i,a,r){var o={};Object.keys(a).forEach(function(e){o[e]=a[e]});o.enumerable=!!o.enumerable;o.configurable=!!o.configurable;if("value"in o||o.initializer){o.writable=true}o=i.slice().reverse().reduce(function(i,a){return a(e,t,i)||i},o);if(r&&o.initializer!==void 0){o.value=o.initializer?o.initializer.call(r):void 0;o.initializer=undefined}if(o.initializer===void 0){Object.defineProperty(e,t,o);o=null}return o}function Ze(e,t){throw new Error("Decorating class property failed. Please ensure that "+"proposal-class-properties is enabled and runs after the decorators transform.")}let et=(I=qe({name:"Field",namespace:"sap.fe.macros.internal",designtime:"sap/fe/macros/internal/Field.designtime"}),x=He({type:"string"}),P=He({type:"string"}),O=He({type:"string"}),M=He({type:"string"}),F=He({type:"string"}),S=He({type:"string"}),D=He({type:"string"}),E=He({type:"sap.ui.model.Context",required:true,expectedTypes:["EntitySet","NavigationProperty","EntityType","Singleton"]}),w=He({type:"boolean"}),T=He({type:"sap.ui.model.Context",required:true,expectedTypes:["Property"],expectedAnnotationTypes:["com.sap.vocabularies.UI.v1.DataField","com.sap.vocabularies.UI.v1.DataFieldWithUrl","com.sap.vocabularies.UI.v1.DataFieldForAnnotation","com.sap.vocabularies.UI.v1.DataFieldForAction","com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation","com.sap.vocabularies.UI.v1.DataFieldWithAction","com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation","com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath","com.sap.vocabularies.UI.v1.DataPointType"]}),C=He({type:"sap.ui.mdc.enums.EditMode"}),A=He({type:"boolean"}),U=He({type:"string"}),j=He({type:"string"}),V=He({type:"sap.ui.core.TextAlign"}),B=He({type:"string",required:false}),z=He({type:"string"}),L=He({type:"boolean"}),R=He({type:"boolean"}),$=He({type:"object",validate:function(e){if(e.textAlignMode&&!["Table","Form"].includes(e.textAlignMode)){throw new Error(`Allowed value ${e.textAlignMode} for textAlignMode does not match`)}if(e.displayMode&&!["Value","Description","ValueDescription","DescriptionValue"].includes(e.displayMode)){throw new Error(`Allowed value ${e.displayMode} for displayMode does not match`)}if(e.fieldMode&&!["nowrapper",""].includes(e.fieldMode)){throw new Error(`Allowed value ${e.fieldMode} for fieldMode does not match`)}if(e.measureDisplayMode&&!["Hidden","ReadOnly"].includes(e.measureDisplayMode)){throw new Error(`Allowed value ${e.measureDisplayMode} for measureDisplayMode does not match`)}if(e.textExpandBehaviorDisplay&&!["InPlace","Popover"].includes(e.textExpandBehaviorDisplay)){throw new Error(`Allowed value ${e.textExpandBehaviorDisplay} for textExpandBehaviorDisplay does not match`)}if(e.semanticKeyStyle&&!["ObjectIdentifier","Label",""].includes(e.semanticKeyStyle)){throw new Error(`Allowed value ${e.semanticKeyStyle} for semanticKeyStyle does not match`)}if(typeof e.isAnalytics==="string"){e.isAnalytics=e.isAnalytics==="true"}if(typeof e.forInlineCreationRows==="string"){e.forInlineCreationRows=e.forInlineCreationRows==="true"}if(typeof e.hasDraftIndicator==="string"){e.hasDraftIndicator=e.hasDraftIndicator==="true"}return e}}),k=He({type:"sap.ui.model.Context"}),W=He({type:"boolean"}),_=He({type:"string"}),N=He({type:"string"}),q=Ke(),K=Ke(),H=He({type:"string"}),I(Q=(G=function(e){Je(i,e);var t=i.prototype;t.getOverrides=function e(t,i){const a={};if(t){const e=t[i];if(e){Object.keys(e).forEach(function(t){a[t]=e[t]})}}return a};t.getObjectIdentifierText=function e(t,i){var a,r;let n=je(De(i));const l=t===null||t===void 0?void 0:t.displayMode;const d=i.targetObject.type==="PropertyPath"?i.targetObject.$target:i.targetObject;const s=(a=d.annotations)===null||a===void 0?void 0:(r=a.Common)===null||r===void 0?void 0:r.Text;if(s===undefined){return undefined}n=Le(d,n);switch(l){case"ValueDescription":const e=Se(i);return We(ze(s,e));case"DescriptionValue":return We(Re([n],o.formatToKeepWhitespace));default:return undefined}};t.setUpDataPointType=function e(t){if((t===null||t===void 0?void 0:t.term)==="com.sap.vocabularies.UI.v1.DataPoint"){t.$Type=t.$Type||"com.sap.vocabularies.UI.v1.DataPointType"}};t.setUpVisibleProperties=function e(t){const i=a.getInvolvedDataModelObjects(t.dataField,t.entitySet);t.visible=v.getVisibleExpression(i,t.formatOptions);t.displayVisible=t.formatOptions.fieldMode==="nowrapper"?t.visible:undefined};t.getContentId=function e(t){return`${t}-content`};t.setUpFormatOptions=function e(t,i,a,r){var o;const n=this.getOverrides(a,t.dataField.getPath());if(!t.formatOptions.displayMode){t.formatOptions.displayMode=y.getDisplayMode(i)}if(t.formatOptions.displayMode==="Description"){t.valueAsStringBindingExpression=v.getValueBinding(i,t.formatOptions,true,true,undefined,true)}t.formatOptions.textLinesEdit=n.textLinesEdit||n.formatOptions&&n.formatOptions.textLinesEdit||t.formatOptions.textLinesEdit||4;t.formatOptions.textMaxLines=n.textMaxLines||n.formatOptions&&n.formatOptions.textMaxLines||t.formatOptions.textMaxLines;if((o=r.models.viewData)!==null&&o!==void 0&&o.getProperty("/retrieveTextFromValueList")){t.formatOptions.retrieveTextFromValueList=v.isRetrieveTextFromValueListEnabled(i.targetObject,t.formatOptions);if(t.formatOptions.retrieveTextFromValueList){var l,d,s;const e=!!(i!==null&&i!==void 0&&(l=i.targetEntityType)!==null&&l!==void 0&&(d=l.annotations)!==null&&d!==void 0&&(s=d.UI)!==null&&s!==void 0&&s.TextArrangement);t.formatOptions.displayMode=e?t.formatOptions.displayMode:"DescriptionValue"}}if(t.formatOptions.fieldMode==="nowrapper"&&t.editMode==="Display"){if(t._flexId){t.noWrapperId=t._flexId}else{t.noWrapperId=t.idPrefix?Te([t.idPrefix,"Field-content"]):undefined}}};t.setUpDisplayStyle=function e(t,i,a){var r,o,n,l,d,s,u,p,c,f,b,g,h,I,x,P,O,M;const F=a.targetObject;if(!a.targetObject){t.displayStyle="Text";return}t.hasUnitOrCurrency=((r=F.annotations)===null||r===void 0?void 0:(o=r.Measures)===null||o===void 0?void 0:o.Unit)!==undefined||((n=F.annotations)===null||n===void 0?void 0:(l=n.Measures)===null||l===void 0?void 0:l.ISOCurrency)!==undefined;t.hasValidAnalyticalCurrencyOrUnit=y.hasValidAnalyticalCurrencyOrUnit(a);t.textFromValueList=Ue(We($e("FieldRuntime.retrieveTextFromValueList",[je(De(a)),`/${F.fullyQualifiedName}`,t.formatOptions.displayMode])),false);if(F.type==="Edm.Stream"){t.displayStyle="File";return}if((d=F.annotations)!==null&&d!==void 0&&(s=d.UI)!==null&&s!==void 0&&s.IsImageURL){t.displayStyle="Avatar";return}switch(i.$Type){case"com.sap.vocabularies.UI.v1.DataPointType":t.displayStyle="DataPoint";return;case"com.sap.vocabularies.UI.v1.DataFieldForAnnotation":if(((u=i.Target)===null||u===void 0?void 0:(p=u.$target)===null||p===void 0?void 0:p.$Type)==="com.sap.vocabularies.UI.v1.DataPointType"){t.displayStyle="DataPoint";return}else if(((c=i.Target)===null||c===void 0?void 0:(f=c.$target)===null||f===void 0?void 0:f.$Type)==="com.sap.vocabularies.Communication.v1.ContactType"){t.displayStyle="Contact";return}break;case"com.sap.vocabularies.UI.v1.DataFieldForAction":case"com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":t.displayStyle="Button";return;case"com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":case"com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":case"com.sap.vocabularies.UI.v1.DataFieldWithAction":t.displayStyle="Link";return}const S=v.isUsedInNavigationWithQuickViewFacets(a,F);const D=!!v.getPropertyWithSemanticObject(a)||t.semanticObject!==undefined&&t.semanticObject!=="";if(Me(F,a)&&t.formatOptions.semanticKeyStyle){var E,w,T,C,A,U,j,V;t.hasQuickView=S||D;t.hasSituationsIndicator=m.getSituationsNavigationProperty(a.targetEntityType)!==undefined;this.setUpObjectIdentifierTitleAndText(t,a);if((E=a.contextLocation)!==null&&E!==void 0&&(w=E.targetEntitySet)!==null&&w!==void 0&&(T=w.annotations)!==null&&T!==void 0&&(C=T.Common)!==null&&C!==void 0&&C.DraftRoot&&(A=a.targetEntitySet)!==null&&A!==void 0&&(U=A.annotations)!==null&&U!==void 0&&(j=U.Common)!==null&&j!==void 0&&j.DraftRoot&&t.formatOptions.hasDraftIndicator!==false){t.draftIndicatorVisible=v.getDraftIndicatorVisibleBinding(a.targetObject.name);t.displayStyle="SemanticKeyWithDraftIndicator";return}t.showErrorIndicator=((V=a.contextLocation)===null||V===void 0?void 0:V.targetObject._type)==="NavigationProperty"&&!t.formatOptions.fieldGroupDraftIndicatorPropertyPath;t.situationsIndicatorPropertyPath=a.targetObject.name;t.displayStyle=t.formatOptions.semanticKeyStyle==="ObjectIdentifier"?"ObjectIdentifier":"LabelSemanticKey";return}if(i.Criticality){t.hasQuickView=S||D;t.displayStyle="ObjectStatus";return}if((b=F.annotations)!==null&&b!==void 0&&(g=b.Measures)!==null&&g!==void 0&&g.ISOCurrency&&String(t.formatOptions.isCurrencyAligned)==="true"&&t.formatOptions.measureDisplayMode!=="Hidden"){t.valueAsStringBindingExpression=v.getValueBinding(a,t.formatOptions,true,true,undefined,true);t.unitBindingExpression=We(y.getBindingForUnitOrCurrency(a));t.displayStyle="AmountWithCurrency";return}if((h=F.annotations)!==null&&h!==void 0&&(I=h.Communication)!==null&&I!==void 0&&I.IsEmailAddress||(x=F.annotations)!==null&&x!==void 0&&(P=x.Communication)!==null&&P!==void 0&&P.IsPhoneNumber){t.displayStyle="Link";return}if((O=F.annotations)!==null&&O!==void 0&&(M=O.UI)!==null&&M!==void 0&&M.MultiLineText){t.displayStyle="ExpandableText";return}if(S||D){t.hasQuickView=true;t.displayStyle="LinkWithQuickView";return}if(i.$Type==="com.sap.vocabularies.UI.v1.DataFieldWithUrl"){t.displayStyle="Link";return}t.displayStyle="Text"};t.setUpEditStyle=function e(t){if(this.idPrefix){this.editStyleId=Te([this.idPrefix,"Field-edit"])}v.setEditStyleProperties(this,this.convertedDataField,this.dataModelPath);this.computeFieldGroupIds(t)};t.computeFieldGroupIds=function e(t){var i,a;const r=["InputWithValueHelp","TextArea","DatePicker","TimePicker","DateTimePicker","InputWithUnit","Input"];if(!t){return}const o=t.getSideEffectsService();const n=o.computeFieldGroupIds(((i=this.dataModelPath.targetEntityType)===null||i===void 0?void 0:i.fullyQualifiedName)??"",((a=this.dataModelPath.targetObject)===null||a===void 0?void 0:a.fullyQualifiedName)??"");if(this.collaborationEnabled&&r.includes(this.editStyle||"")){const e=`${Ne}${this.dataSourcePath}`;n.push(e);this.mainPropertyRelativePath=Ee(this.dataModelPath.targetObject)?De(this.dataModelPath):undefined}this.fieldGroupIds=n.length?n.join(","):undefined};t.setUpObjectIdentifierTitleAndText=function e(t,i){var a;const r=(a=t.formatOptions)===null||a===void 0?void 0:a.semanticKeyStyle;const o=t.formatOptions.displayMode;t.identifierTitle=we(i,v.getTextBindingExpression,{displayMode:o,splitTitleOnTwoLines:true},undefined,undefined);t.identifierText=r==="ObjectIdentifier"?this.getObjectIdentifierText(t.formatOptions,i):undefined};t.setUpValueState=function e(t){var i,a,r,o;let n;const l=t.formatOptions.textAlignMode;const d=je(De(t.dataModelPath));const s=ze((i=t.dataModelPath)===null||i===void 0?void 0:(a=i.targetObject)===null||a===void 0?void 0:(r=a.annotations)===null||r===void 0?void 0:(o=r.Common)===null||o===void 0?void 0:o.Text);if(l==="Table"){n=Re([je(`/recommendationsData`,"internal"),je(`/isEditable`,"ui"),t.dataSourcePath,d,s],h.formatValueState,t.dataModelPath.targetEntityType)}else{n=Re([je(`/recommendationsData`,"internal"),je(`/isEditable`,"ui"),t.dataSourcePath,d,s],h.formatValueState)}t.valueState=We(n)};t.setInputWithValuehelpPlaceholder=function e(t){let i;const a=t.editStylePlaceholder;const r=t.formatOptions.textAlignMode;if(r==="Table"){i=t.dataModelPath.targetEntityType}const o=Re([je(`/recommendationsData`,"internal"),je(`/currentCtxt`,"internal"),je(`${t.dataModelPath.targetObject.name}@$ui5.fe.messageType`),a,t.formatOptions.displayMode],h.formatPlaceholder,i);t.editStylePlaceholder=We(o)};function i(t,i,a){var r,o,n;var l;l=e.call(this,t)||this;Qe(l,"dataSourcePath",J,Ge(l));Qe(l,"emptyIndicatorMode",X,Ge(l));Qe(l,"_flexId",Y,Ge(l));Qe(l,"idPrefix",Z,Ge(l));Qe(l,"_apiId",ee,Ge(l));Qe(l,"noWrapperId",te,Ge(l));Qe(l,"vhIdPrefix",ie,Ge(l));Qe(l,"entitySet",ae,Ge(l));Qe(l,"navigateAfterAction",re,Ge(l));Qe(l,"dataField",oe,Ge(l));Qe(l,"editMode",ne,Ge(l));Qe(l,"wrap",le,Ge(l));Qe(l,"class",de,Ge(l));Qe(l,"ariaLabelledBy",se,Ge(l));Qe(l,"textAlign",ue,Ge(l));Qe(l,"semanticObject",pe,Ge(l));Qe(l,"requiredExpression",ce,Ge(l));Qe(l,"visible",fe,Ge(l));Qe(l,"showErrorObjectStatus",ye,Ge(l));Qe(l,"formatOptions",ve,Ge(l));Qe(l,"entityType",me,Ge(l));Qe(l,"collaborationEnabled",be,Ge(l));Qe(l,"_vhFlexId",ge,Ge(l));Qe(l,"valueState",he,Ge(l));Qe(l,"onChange",Ie,Ge(l));Qe(l,"onLiveChange",xe,Ge(l));l.hasQuickView=false;l.hasUnitOrCurrency=undefined;l.hasValidAnalyticalCurrencyOrUnit=undefined;l.textFromValueList=undefined;l.editStyleId=undefined;Qe(l,"editStylePlaceholder",Pe,Ge(l));l.ratingIndicatorTooltip=undefined;l.ratingIndicatorTargetValue=undefined;l.showErrorIndicator=false;l.situationsIndicatorPropertyPath="";l.hasPropertyInsertRestrictions=false;l.computeCommonProperties(Ge(l),a);l.setUpDataPointType(l.convertedDataField);l.setUpVisibleProperties(Ge(l));if(l._flexId){l._apiId=l._flexId;l._flexId=l.getContentId(l._flexId);l._vhFlexId=`${l._flexId}_${l.vhIdPrefix}`}l.dataSourcePath=Fe(l.dataModelPath);l.entityType=l.metaModel.createBindingContext(`/${l.dataModelPath.targetEntityType.fullyQualifiedName}`);if(((r=l.formatOptions)===null||r===void 0?void 0:r.forInlineCreationRows)===true){l.hasPropertyInsertRestrictions=v.hasPropertyInsertRestrictions(l.dataModelPath)}l.computeEditMode(Ge(l));l.computeCollaborationProperties(Ge(l));l.computeEditableExpressions(Ge(l));l.setUpFormatOptions(Ge(l),l.dataModelPath,i,a);l.setUpDisplayStyle(Ge(l),l.convertedDataField,l.dataModelPath);l.setUpEditStyle(a.appComponent);l.setUpValueState(Ge(l));if(l.editStyle==="InputWithValueHelp"){l.setInputWithValuehelpPlaceholder(Ge(l))}const d=["Avatar","AmountWithCurrency"];if(l.displayStyle&&!d.includes(l.displayStyle)&&l.dataModelPath.targetObject){l.text=l.text??v.getTextBinding(l.dataModelPath,l.formatOptions)}else{l.text=""}l.emptyIndicatorMode=l.formatOptions.showEmptyIndicator?"On":undefined;if(Ee(l.convertedDataField)&&((o=l.convertedDataField.annotations)===null||o===void 0?void 0:(n=o.UI)===null||n===void 0?void 0:n.DataFieldDefault)!==undefined){l.dataField=l.metaModel.createBindingContext(`@${"com.sap.vocabularies.UI.v1.DataFieldDefault"}`,l.dataField)}return l}Oe=i;t.computeCommonProperties=function e(t,i){var r,o,n;const l=a.convertMetaModelContext(t.dataField);let d=a.getInvolvedDataModelObjects(t.dataField,t.entitySet);d=v.getDataModelObjectPathForValue(d)||d;const s=d.targetObject;this.convertedDataField=l;this.dataModelPath=d;this.property=s;this.metaModel=i.models.metaModel||i.models.entitySet;this.propertyForFieldControl=(r=this.dataModelPath)!==null&&r!==void 0&&(o=r.targetObject)!==null&&o!==void 0&&o.Value?this.dataModelPath.targetObject.Value:(n=this.dataModelPath)===null||n===void 0?void 0:n.targetObject};t.computeEditMode=function e(t){if(t.editMode!==undefined&&t.editMode!==null){t.editModeAsObject=t.editMode}else{const e=t.formatOptions.measureDisplayMode?t.formatOptions.measureDisplayMode==="ReadOnly":false;t.editModeAsObject=y.getEditMode(t.propertyForFieldControl,t.dataModelPath,e,true,t.convertedDataField);t.editMode=We(Be(_e(je("@$ui5.context.isInactive"),t.hasPropertyInsertRestrictions),"Display",t.editModeAsObject))}};t.computeCollaborationProperties=function e(t){const i=y.getEditableExpressionAsObject(t.propertyForFieldControl,t.convertedDataField,t.dataModelPath);if(d.isCollaborationDraftSupported(t.metaModel)&&t.editMode!==b.Display){t.collaborationEnabled=true;t.collaborationExpression=y.getCollaborationExpression(t.dataModelPath,r.hasCollaborationActivity);t.editableExpression=We(_e(i,Ve(t.collaborationExpression)));t.editMode=We(Be(t.collaborationExpression,ke("ReadOnly"),Be(_e(je("@$ui5.context.isInactive"),t.hasPropertyInsertRestrictions),"Display",t.editModeAsObject)))}else{t.editableExpression=We(i)}};t.computeEditableExpressions=function e(t){var i,a;const r=Ae((i=t.entitySet)===null||i===void 0?void 0:i.getPath().replaceAll("/$NavigationPropertyBinding/","/"),t.metaModel);const o=Ce((a=t.entitySet)===null||a===void 0?void 0:a.getPath().replaceAll("/$NavigationPropertyBinding/","/"),t.metaModel);const n={requiredPropertiesFromInsertRestrictions:r,requiredPropertiesFromUpdateRestrictions:o};t.liveChangeEnabled=!!t.onLiveChange;t.enabledExpression=y.getEnabledExpression(t.propertyForFieldControl,t.convertedDataField,false,t.dataModelPath);t.requiredExpression=y.getRequiredExpression(t.propertyForFieldControl,t.convertedDataField,false,false,n,t.dataModelPath)};t.getTemplate=function e(){return g(this)};return i}(e),J=Ye(G.prototype,"dataSourcePath",[x],{configurable:true,enumerable:true,writable:true,initializer:null}),X=Ye(G.prototype,"emptyIndicatorMode",[P],{configurable:true,enumerable:true,writable:true,initializer:null}),Y=Ye(G.prototype,"_flexId",[O],{configurable:true,enumerable:true,writable:true,initializer:null}),Z=Ye(G.prototype,"idPrefix",[M],{configurable:true,enumerable:true,writable:true,initializer:null}),ee=Ye(G.prototype,"_apiId",[F],{configurable:true,enumerable:true,writable:true,initializer:null}),te=Ye(G.prototype,"noWrapperId",[S],{configurable:true,enumerable:true,writable:true,initializer:null}),ie=Ye(G.prototype,"vhIdPrefix",[D],{configurable:true,enumerable:true,writable:true,initializer:function(){return"FieldValueHelp"}}),ae=Ye(G.prototype,"entitySet",[E],{configurable:true,enumerable:true,writable:true,initializer:null}),re=Ye(G.prototype,"navigateAfterAction",[w],{configurable:true,enumerable:true,writable:true,initializer:function(){return true}}),oe=Ye(G.prototype,"dataField",[T],{configurable:true,enumerable:true,writable:true,initializer:null}),ne=Ye(G.prototype,"editMode",[C],{configurable:true,enumerable:true,writable:true,initializer:null}),le=Ye(G.prototype,"wrap",[A],{configurable:true,enumerable:true,writable:true,initializer:null}),de=Ye(G.prototype,"class",[U],{configurable:true,enumerable:true,writable:true,initializer:null}),se=Ye(G.prototype,"ariaLabelledBy",[j],{configurable:true,enumerable:true,writable:true,initializer:null}),ue=Ye(G.prototype,"textAlign",[V],{configurable:true,enumerable:true,writable:true,initializer:null}),pe=Ye(G.prototype,"semanticObject",[B],{configurable:true,enumerable:true,writable:true,initializer:null}),ce=Ye(G.prototype,"requiredExpression",[z],{configurable:true,enumerable:true,writable:true,initializer:null}),fe=Ye(G.prototype,"visible",[L],{configurable:true,enumerable:true,writable:true,initializer:null}),ye=Ye(G.prototype,"showErrorObjectStatus",[R],{configurable:true,enumerable:true,writable:true,initializer:null}),ve=Ye(G.prototype,"formatOptions",[$],{configurable:true,enumerable:true,writable:true,initializer:function(){return{}}}),me=Ye(G.prototype,"entityType",[k],{configurable:true,enumerable:true,writable:true,initializer:null}),be=Ye(G.prototype,"collaborationEnabled",[W],{configurable:true,enumerable:true,writable:true,initializer:null}),ge=Ye(G.prototype,"_vhFlexId",[_],{configurable:true,enumerable:true,writable:true,initializer:null}),he=Ye(G.prototype,"valueState",[N],{configurable:true,enumerable:true,writable:true,initializer:null}),Ie=Ye(G.prototype,"onChange",[q],{configurable:true,enumerable:true,writable:true,initializer:null}),xe=Ye(G.prototype,"onLiveChange",[K],{configurable:true,enumerable:true,writable:true,initializer:null}),Pe=Ye(G.prototype,"editStylePlaceholder",[H],{configurable:true,enumerable:true,writable:true,initializer:null}),G))||Q);Oe=et;return Oe},false);
//# sourceMappingURL=InternalField.block.js.map