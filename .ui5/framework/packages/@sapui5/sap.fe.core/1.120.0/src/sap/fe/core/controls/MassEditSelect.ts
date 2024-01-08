/**
 * Constructor for a new custom combobox.
 *
 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
 * @param {object} [mSettings] Initial settings for the new control
 * Represents a custom combobox on the UI.
 * @since 1.98.0
 */

import Select from "sap/m/Select";
import SelectRenderer from "sap/m/SelectRenderer";

const MassEditSelect = Select.extend("sap.fe.core.controls.MassEditSelect", {
	metadata: {
		properties: {
			showValueHelp: {
				type: "boolean"
			},
			valueHelpIconSrc: {
				type: "string"
			},
			selectValue: {
				type: "string"
			}
		},
		events: {
			valueHelpRequest: {}
		},
		interfaces: ["sap.ui.core.IFormContent"]
	},
	renderer: {
		apiVersion: 2,
		render: SelectRenderer.render
	}
});

export default MassEditSelect;
