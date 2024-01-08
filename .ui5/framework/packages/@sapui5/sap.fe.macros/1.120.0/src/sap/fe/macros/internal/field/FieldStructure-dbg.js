/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor", "sap/fe/core/helpers/StableIdHelper", "sap/ui/mdc/enums/FieldEditMode", "./DisplayStyle", "./EditStyle"], function (BuildingBlockTemplateProcessor, StableIdHelper, FieldEditMode, DisplayStyle, EditStyle) {
  "use strict";

  var generate = StableIdHelper.generate;
  var xml = BuildingBlockTemplateProcessor.xml;
  function getTemplateWithFieldApi(internalField, template) {
    let id;
    if (internalField.formatOptions.fieldMode === "nowrapper" && internalField.editMode === FieldEditMode.Display) {
      return template;
    }
    if (internalField._apiId) {
      id = internalField._apiId;
    } else if (internalField.idPrefix) {
      id = generate([internalField.idPrefix, "Field"]);
    } else {
      id = undefined;
    }
    if (internalField.onChange === null || internalField.onChange === "null") {
      internalField.onChange = undefined;
    }
    return xml`
			<macroField:FieldAPI
				core:require="{TableAPI: 'sap/fe/macros/table/TableAPI'}"
				xmlns:macroField="sap.fe.macros.field"
				change="${internalField.onChange}"
				liveChange="${internalField.onLiveChange}"
				id="${id}"
				required="${internalField.requiredExpression}"
				editable="${internalField.editableExpression}"
				collaborationEnabled="${internalField.collaborationEnabled}"
				visible="${internalField.visible}"
				mainPropertyRelativePath="${internalField.mainPropertyRelativePath}"
			>
				${template}
			</macroField:FieldAPI>
		`;
  }

  /**
   * Create the fieldWrapper control for use cases with display and edit styles.
   *
   * @param internalField Reference to the current internal field instance
   * @returns An XML-based string with the definition of the field control
   */
  function createFieldWrapper(internalField) {
    let fieldWrapperID;
    if (internalField._flexId) {
      fieldWrapperID = internalField._flexId;
    } else if (internalField.idPrefix) {
      fieldWrapperID = generate([internalField.idPrefix, "Field-content"]);
    } else {
      fieldWrapperID = undefined;
    }

    // compute the display part and the edit part for the fieldwrapper control
    const contentDisplay = DisplayStyle.getTemplate(internalField);
    // content edit part needs to be wrapped further with an hbox in case of collaboration mode
    // that´s why we need to call this special helper here which finally calls internally EditStyle.getTemplate
    const contentEdit = EditStyle.getTemplateWithWrapper(internalField);
    return xml`<controls:FieldWrapper
		xmlns:controls="sap.fe.macros.controls"
		id="${fieldWrapperID}"
		editMode="${internalField.editMode}"
		visible="${internalField.visible}"
		width="100%"
		textAlign="${internalField.textAlign}"
		class="${internalField.class}"
		>

		<controls:contentDisplay>
			${contentDisplay}
		</controls:contentDisplay>
		<controls:contentEdit>
			${contentEdit}
		</controls:contentEdit>

	</controls:FieldWrapper>`;
  }

  /**
   * Helps to calculate the field structure wrapper.
   *
   * @param internalField Reference to the current internal field instance
   * @returns An XML-based string with the definition of the field control
   */
  function getFieldStructureTemplate(internalField) {
    //compute the field in case of mentioned display styles
    if (internalField.displayStyle === "Avatar" || internalField.displayStyle === "Contact" || internalField.displayStyle === "Button" || internalField.displayStyle === "File") {
      // check for special handling in case a file type is used with the collaboration mode
      // (renders an avatar directly)
      if (internalField.displayStyle === "File" && (internalField.collaborationEnabled ?? false) && internalField.editMode !== FieldEditMode.Display) {
        const box = xml`
				<HBox xmlns="sap.m" width="100%" alignItems="End">
					<VBox width="100%">
						${DisplayStyle.getFileTemplate(internalField)}
					</VBox>
					${EditStyle.getCollaborationAvatar(internalField)}
				</HBox>`;
        return getTemplateWithFieldApi(internalField, box);
      } else {
        //for all other cases render the displayStyles with a field api wrapper
        return getTemplateWithFieldApi(internalField, DisplayStyle.getTemplate(internalField));
      }
    } else if (internalField.formatOptions.fieldMode === "nowrapper" && internalField.editMode === FieldEditMode.Display) {
      //renders a display based building block (e.g. a button) that has no field api wrapper around it.
      return DisplayStyle.getTemplate(internalField);
    } else {
      //for all other cases create a field wrapper
      const fieldWrapper = createFieldWrapper(internalField);
      return getTemplateWithFieldApi(internalField, fieldWrapper);
    }
  }
  return getFieldStructureTemplate;
}, false);
