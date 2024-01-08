/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor","sap/fe/core/converters/ManifestSettings","sap/fe/core/converters/MetaModelConverter","sap/fe/core/converters/annotations/DataField","sap/fe/core/converters/controls/Common/Action","sap/fe/core/converters/controls/Common/table/StandardActions","sap/fe/core/helpers/BindingToolkit","sap/fe/core/helpers/StableIdHelper","sap/fe/core/templating/UIFormatters","../CommonHelper","../internal/helpers/DefaultActionHandler","./TableHelper"],function(t,e,n,a,o,i,l,c,r,s,d,u){"use strict";var m={};var b=r.getDataModelObjectPath;var p=c.generate;var v=l.pathInModel;var f=l.notEqual;var A=i.StandardActionKeys;var $=o.ButtonType;var x=a.isDataModelObjectPathForActionWithDialog;var T=a.isDataFieldForIntentBasedNavigation;var g=a.isDataFieldForAction;var D=e.ActionType;var M=t.xml;function h(t,e,a,o){var i,l,c,r,d;if(!a.annotationPath){return""}const m=s.getActionContext(o.metaPath.getModel().createBindingContext(a.annotationPath+"/Action"));const b=o.metaPath.getModel().createBindingContext(m);const p=b?n.getInvolvedDataModelObjects(b,o.collection):undefined;const v=(i=t.ActionTarget)===null||i===void 0?void 0:i.isBound;const f=((l=t.ActionTarget)===null||l===void 0?void 0:(c=l.annotations)===null||c===void 0?void 0:(r=c.Core)===null||r===void 0?void 0:(d=r.OperationAvailable)===null||d===void 0?void 0:d.valueOf())!==false;const A=a.command?"cmd:"+a.command:u.pressEventDataFieldForActionButton({contextObjectPath:o.contextObjectPath,id:o.id},t,o.collectionEntity.name,o.tableDefinition.operationAvailableMap,b.getObject(),e.isNavigable,a.enableAutoScroll,a.defaultValuesExtensionFunction);const $=a.enabled!==undefined?a.enabled:u.isDataFieldForActionEnabled(o.tableDefinition,t.Action,!!v,b.getObject(),a.enableOnSelect,p===null||p===void 0?void 0:p.targetEntityType);if(v!==true||f){return M`<MenuItem
				text="${t.Label}"
				press="${A}"
				enabled="${$}"
				visible="${a.visible}"
				/>`}else{return""}}function B(t,e,n){const a=e.annotationPath?n.metaPath.getModel().createBindingContext(e.annotationPath):null;return M`<MenuItem xmlns:macrodata="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
			text="${t.Label}"
			press="${e.command?"cmd:"+e.command:s.getPressHandlerForDataFieldForIBN(a===null||a===void 0?void 0:a.getObject(),"${internal>selectedContexts}",!n.tableDefinition.enableAnalytics)}"
			enabled="${e.enabled!==undefined?e.enabled:u.isDataFieldForIBNEnabled({collection:n.collection,tableDefinition:n.tableDefinition},t,t.RequiresContext,t.NavigationAvailable)}"
			visible="${e.visible}"
			macrodata:IBNData="${!t.RequiresContext?`{semanticObject: '${t.SemanticObject}' , action : '${t.Action}'}`:undefined}"
		/>`}function P(t,e,n){const a=e.annotationPath?n.convertedMetaData.resolvePath(e.annotationPath).target:undefined;switch(a&&e.type){case"ForAction":if(g(a)){return h(a,t,e,n)}break;case"ForNavigation":if(T(a)){return B(a,e,n)}break;default:}const o=e.noWrap?e.press:s.buildActionWrapper(e,{id:n.id});return M`<MenuItem
				core:require="{FPM: 'sap/fe/core/helpers/FPMHelper'}"
				text="${e===null||e===void 0?void 0:e.text}"
				press="${e.command?"cmd:"+e.command:o}"
				visible="${e.visible}"
				enabled="${e.enabled}"
			/>`}function y(t,e,a){var o;const i=a.metaPath.getModel().createBindingContext(e.annotationPath+"/Action");const l=s.getActionContext(i);const c=a.metaPath.getModel().createBindingContext(l);const r=c?n.getInvolvedDataModelObjects(c,a.collection):undefined;const d=(o=t.ActionTarget)===null||o===void 0?void 0:o.isBound;const m=e.command?"cmd:"+e.command:u.pressEventDataFieldForActionButton({contextObjectPath:a.contextObjectPath,id:a.id},t,a.collectionEntity.name,a.tableDefinition.operationAvailableMap,c.getObject(),e.isNavigable,e.enableAutoScroll,e.defaultValuesExtensionFunction);const v=e.enabled!==undefined?e.enabled:u.isDataFieldForActionEnabled(a.tableDefinition,t.Action,!!d,c.getObject(),e.enableOnSelect,r===null||r===void 0?void 0:r.targetEntityType);return M`<Button xmlns="sap.m"
					id="${p([a.id,t])}"
					text="${t.Label}"
					ariaHasPopup="${x(b({},{context:i}))}"
					press="${m}"
					type="${$.Transparent}"
					enabled="${v}"
					visible="${e.visible}"
				/>`}function C(t,e,n){const a=e.annotationPath?n.metaPath.getModel().createBindingContext(e.annotationPath):null;return M`<Button xmlns="sap.m"
					id="${p([n.id,t])}"
					text="${t.Label}"
					press="${e.command?"cmd:"+e.command:s.getPressHandlerForDataFieldForIBN(a===null||a===void 0?void 0:a.getObject(),"${internal>selectedContexts}",!n.tableDefinition.enableAnalytics)}"
					type="${$.Transparent}"
					enabled="${e.enabled!==undefined?e.enabled:u.isDataFieldForIBNEnabled({collection:n.collection,tableDefinition:n.tableDefinition},t,t.RequiresContext,t.NavigationAvailable)}"
					visible="${e.visible}"
					macrodata:IBNData="${!t.RequiresContext?"{semanticObject: '"+t.SemanticObject+"' , action : '"+t.Action+"'}":undefined}"
				/>`}function E(t,e){const n=t.annotationPath?e.convertedMetaData.resolvePath(t.annotationPath).target:undefined;let a="";if(!n){return a}switch(t.type){case"ForAction":if(g(n)){var o,i,l,c,r;const s=(o=n.ActionTarget)===null||o===void 0?void 0:o.isBound;const d=((i=n.ActionTarget)===null||i===void 0?void 0:(l=i.annotations)===null||l===void 0?void 0:(c=l.Core)===null||c===void 0?void 0:(r=c.OperationAvailable)===null||r===void 0?void 0:r.valueOf())!==false;if(s!==true||d){a+=y(n,t,e)}}break;case"ForNavigation":if(T(n)){a+=C(n,t,e)}break;default:}return a!==""?`<mdcat:ActionToolbarAction\n\t\t\txmlns="sap.m"\n\t\t\txmlns:mdcat="sap.ui.mdc.actiontoolbar"\n\t\t\txmlns:macrodata="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1">\n\t\t\t${a}\n\t\t\t</mdcat:ActionToolbarAction>`:""}function F(t,e){var n;let a=`<mdcat:ActionToolbarAction\n\t\t\t\t\t\txmlns="sap.m"\n\t\t\t\t\t\txmlns:mdcat="sap.ui.mdc.actiontoolbar">`;const o=t.defaultAction;const i=o!==null&&o!==void 0&&o.annotationPath?e.convertedMetaData.resolvePath(o.annotationPath).target:null;const l=o!==null&&o!==void 0&&o.annotationPath?s.getActionContext(e.metaPath.getModel().createBindingContext(o.annotationPath+"/Action")):null;a+=M`<MenuButton
						text="${t.text}"
						type="${$.Transparent}"
						menuPosition="BeginBottom"
						id="${p([e.id,t.id])}"
						visible="${t.visible}"
						enabled="${t.enabled}"
						useDefaultActionOnly="${d.getUseDefaultActionOnly(t)}"
						buttonMode="${d.getButtonMode(t)}"
						defaultAction="${d.getDefaultActionHandler(e,t,i,l,"Table")}"
						>
					<menu>
						<Menu>`;(n=t.menu)===null||n===void 0?void 0:n.forEach(n=>{if(typeof n!=="string"){a+=P(t,n,e)}});a+=`</Menu>\n\t\t\t\t</menu>\n\t\t\t</MenuButton>\n\t\t</mdcat:ActionToolbarAction>`;return a}function O(t,e){const n=t.noWrap?t.press:s.buildActionWrapper(t,{id:e.id});return M`<mdcat:ActionToolbarAction
		xmlns="sap.m"
		xmlns:mdcat="sap.ui.mdc.actiontoolbar">
		<Button
			core:require="{FPM: 'sap/fe/core/helpers/FPMHelper'}"
			id="${p([e.id,t.id])}"
			text="${t.text}"
			press="${t.command?"cmd:"+t.command:n}"
			type="${$.Transparent}"
			visible="${t.visible}"
			enabled="${t.enabled}"
		/>
	</mdcat:ActionToolbarAction>`}function I(t,e){switch(t.type){case"Default":if("noWrap"in t){return O(t,e)}break;case"Menu":return F(t,e);default:}return E(t,e)}function S(t,e){const n=t.annotationPath?e.convertedMetaData.resolvePath(t.annotationPath).target:undefined;return M`<mdcat:ActionToolbarAction
				xmlns="sap.m"
				xmlns:mdcat="sap.ui.mdc.actiontoolbar">
				  <Button
					  id="${p([e.id,n])}"
					  text="${t.text}"
					  press="${n?u.pressEventDataFieldForActionButton({contextObjectPath:e.contextObjectPath,id:e.id},n,e.collectionEntity.name,e.tableDefinition.operationAvailableMap,"${internal>selectedContexts}",t.isNavigable,t.enableAutoScroll,t.defaultValuesExtensionFunction):undefined}"
					  type="${$.Transparent}"
					  enabled="${t.enabled}"
					  visible="${t.visible}"
					/>
			</mdcat:ActionToolbarAction>`}function N(t,e){const n=e.collectionEntity.name;const a=e.getTranslatedText("M_COMMON_TABLE_CREATE",undefined,n);return M`<mdcat:ActionToolbarAction
				xmlns="sap.m"
				xmlns:mdcat="sap.ui.mdc.actiontoolbar"
				xmlns:macrodata="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1">
					<Button
						id="${p([e.id,t.key])}"
						text="${a}"
						press="cmd:Create"
						type="${$.Transparent}"
						visible="${t.visible}"
						enabled="${t.enabled}"
						macrodata:IBNData="${u.getIBNData(e.createOutboundDetail)}"
					/>
				</mdcat:ActionToolbarAction>`}function j(t,e){const n=e.collectionEntity.name;const a=e.getTranslatedText("M_COMMON_TABLE_CREATE",undefined,n);const o=e.tableDefinition.control.nodeType.values;const i=e.tableDefinition.control.createEnablement!==undefined;let l=`<mdcat:ActionToolbarAction\n\t\t\t\t\t\txmlns="sap.m"\n\t\t\t\t\t\txmlns:mdcat="sap.ui.mdc.actiontoolbar">`;l+=M`<MenuButton
							text="${a}"
							type="${$.Transparent}"
							menuPosition="BeginBottom"
							id="${p([e.id,t.key])}"
							visible="${t.visible}"
							enabled="${t.enabled}"
							>
							<menu>
								<Menu>`;o.forEach((t,e)=>{const n=i?f(v(`createEnablement/Create_${e}`,"internal"),false):undefined;l+=M`<MenuItem
								text="${t.text}"
								enabled="${n}"
								press="TableRuntime.onCreateMenuItemPress($event, ${e}, \${internal>selectedContexts})"
							/>`});l+=`</Menu>\n\t\t\t\t</menu>\n\t\t\t</MenuButton>\n\t\t</mdcat:ActionToolbarAction>`;return l}function _(t,e){const n=e.collectionEntity.name;const a=e.getTranslatedText("M_COMMON_TABLE_DELETE",undefined,n);return M`<mdcat:ActionToolbarAction
				xmlns="sap.m"
				xmlns:mdcat="sap.ui.mdc.actiontoolbar">
				<Button
					id="${p([e.id,t.key])}"
					text="${a}"
					press="cmd:DeleteEntry"
					type="${$.Transparent}"
					visible="${t.visible}"
					enabled="${t.enabled}"
				/>
			</mdcat:ActionToolbarAction>`}function k(t,e){if(t.isTemplated==="false"){return""}switch(t.key){case A.Create:if(!e.tableDefinition.annotation.isInsertUpdateActionsTemplated){return""}else if(e.tableDefinition.control.nodeType){return j(t,e)}else{return N(t,e)}case A.Delete:return _(t,e);case A.Cut:return R(t,e);case A.MassEdit:if(e.tableDefinition.annotation.isInsertUpdateActionsTemplated){return M`<mdcat:ActionToolbarAction xmlns="sap.m" xmlns:mdcat="sap.ui.mdc.actiontoolbar">
								<Button
									id="${p([e.id,t.key])}"
									text="{sap.fe.i18n>M_COMMON_TABLE_MASSEDIT}"
									press="API.onMassEditButtonPressed($event, $controller)"
									visible="${t.visible}"
									enabled="${t.enabled}"
								/>
							</mdcat:ActionToolbarAction>`}return"";case A.Insights:return M`<mdcat:ActionToolbarAction xmlns="sap.m" xmlns:mdcat="sap.ui.mdc.actiontoolbar" visible="${t.visible}">
							<Button
								id="${p([e.id,t.key])}"
								text="{sap.fe.i18n>M_COMMON_INSIGHTS_CARD}"
								press="API.onAddCardToInsightsPressed($event, $controller)"
								visible="${t.visible}"
								enabled="${t.enabled}"
							>
								<layoutData>
									<OverflowToolbarLayoutData priority="AlwaysOverflow" />
								</layoutData>
							</Button>
						</mdcat:ActionToolbarAction>`;default:return""}}function H(t){let e=t.tableDefinition.actions.reduce((e,n)=>{switch(n.type){case D.Standard:return e+k(n,t);case D.Copy:return e+S(n,t);default:return e+I(n,t)}},"");e+=q(t);return e}function L(t){if(t.useBasicSearch){return M`<mdcat:ActionToolbarAction xmlns:mdcat="sap.ui.mdc.actiontoolbar" xmlns:macroTable="sap.fe.macros.table">
						<macroTable:BasicSearch id="${t.filterBarId}" useDraftEditState="${t._collectionIsDraftEnabled}"/>
					</mdcat:ActionToolbarAction>`}return""}function w(t){if(t.enableFullScreen){return M`<mdcat:ActionToolbarAction xmlns:mdcat="sap.ui.mdc.actiontoolbar" xmlns:macroTable="sap.fe.macros.table">
						<macroTable:TableFullScreenDialog id="${p([t.id,"StandardAction","FullScreen"])}" />
					</mdcat:ActionToolbarAction>`}return""}function R(t,e){return M`<mdcat:ActionToolbarAction
				xmlns="sap.m"
				xmlns:mdcat="sap.ui.mdc.actiontoolbar">
				  <Button
					  id="${p([e.id,"Cut"])}"
					  text="{sap.fe.i18n>M_TABLE_CUT}"
					  press="cmd:Cut"
					  visible="${t.visible}"
					  enabled="${t.enabled}"
					/>
			</mdcat:ActionToolbarAction>`}function q(t){if(t.tableType==="TreeTable"){return M`<mdcat:ActionToolbarAction
				xmlns="sap.m"
				xmlns:mdcat="sap.ui.mdc.actiontoolbar">
				  <Button
					  id="${p([t.id,"Paste"])}"
					  text="{sap.fe.i18n>M_PASTE}"
					  press="cmd:Paste"
					  visible="${t.pasteVisible}"
					  enabled="${t.enablePaste}"
					/>
			</mdcat:ActionToolbarAction>`}return""}function W(t){return L(t)+H(t)+w(t)}m.getTableActionTemplate=W;return m},false);
//# sourceMappingURL=ActionsTemplating.js.map