import Element from "sap/ui/core/Element";

export type AnyElementType = Element & {
	mBindingInfos: object;
	getAnyText(): any;
	setAnyText(value: any): void;
	getBindingInfo(property: string): object;
	extend(sName: string, sExtension: any): AnyElementType;
};

/**
 * A custom element to evaluate the value of Binding.
 *
 * @hideconstructor
 */
const AnyElement = Element.extend("sap.fe.core.controls.AnyElement", {
	metadata: {
		properties: {
			anyText: "string"
		}
	},
	updateProperty: function (this: AnyElementType, sName: string) {
		// Avoid Promise processing in Element and set Promise as value directly
		if (sName === "anyText") {
			this.setAnyText(this.getBindingInfo(sName).binding.getExternalValue());
		}
	}
});

export default AnyElement as any;
