/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor","sap/fe/core/helpers/StableIdHelper","sap/ui/mdc/enums/FieldEditMode","./DisplayStyle","./EditStyle"],function(e,i,l,t,n){"use strict";var a=i.generate;var o=e.xml;function r(e,i){let t;if(e.formatOptions.fieldMode==="nowrapper"&&e.editMode===l.Display){return i}if(e._apiId){t=e._apiId}else if(e.idPrefix){t=a([e.idPrefix,"Field"])}else{t=undefined}if(e.onChange===null||e.onChange==="null"){e.onChange=undefined}return o`
			<macroField:FieldAPI
				core:require="{TableAPI: 'sap/fe/macros/table/TableAPI'}"
				xmlns:macroField="sap.fe.macros.field"
				change="${e.onChange}"
				liveChange="${e.onLiveChange}"
				id="${t}"
				required="${e.requiredExpression}"
				editable="${e.editableExpression}"
				collaborationEnabled="${e.collaborationEnabled}"
				visible="${e.visible}"
				mainPropertyRelativePath="${e.mainPropertyRelativePath}"
			>
				${i}
			</macroField:FieldAPI>
		`}function s(e){let i;if(e._flexId){i=e._flexId}else if(e.idPrefix){i=a([e.idPrefix,"Field-content"])}else{i=undefined}const l=t.getTemplate(e);const r=n.getTemplateWithWrapper(e);return o`<controls:FieldWrapper
		xmlns:controls="sap.fe.macros.controls"
		id="${i}"
		editMode="${e.editMode}"
		visible="${e.visible}"
		width="100%"
		textAlign="${e.textAlign}"
		class="${e.class}"
		>

		<controls:contentDisplay>
			${l}
		</controls:contentDisplay>
		<controls:contentEdit>
			${r}
		</controls:contentEdit>

	</controls:FieldWrapper>`}function d(e){if(e.displayStyle==="Avatar"||e.displayStyle==="Contact"||e.displayStyle==="Button"||e.displayStyle==="File"){if(e.displayStyle==="File"&&(e.collaborationEnabled??false)&&e.editMode!==l.Display){const i=o`
				<HBox xmlns="sap.m" width="100%" alignItems="End">
					<VBox width="100%">
						${t.getFileTemplate(e)}
					</VBox>
					${n.getCollaborationAvatar(e)}
				</HBox>`;return r(e,i)}else{return r(e,t.getTemplate(e))}}else if(e.formatOptions.fieldMode==="nowrapper"&&e.editMode===l.Display){return t.getTemplate(e)}else{const i=s(e);return r(e,i)}}return d},false);
//# sourceMappingURL=FieldStructure.js.map