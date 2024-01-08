import ManagedObject from "sap/ui/base/ManagedObject";

export type AnyType = ManagedObject & {
	mBindingInfos: object;
	getAny(): any;
	getAnyText(): any;
	setAny(value: any): void;
	setAnyText(value: any): void;
	getBindingInfo(property: string): object;
	extend(sName: string, sExtension: any): AnyType;
};

/**
 * A custom element to evaluate the value of Binding.
 *
 * @hideconstructor
 */
const Any = ManagedObject.extend("sap.fe.core.controls.Any", {
	metadata: {
		properties: {
			any: "any",
			anyText: "string",
			anyBoolean: "boolean"
		}
	},
	updateProperty: function (this: AnyType, sName: string) {
		// Avoid Promise processing in ManagedObject and set Promise as value directly
		if (sName === "any") {
			this.setAny(this.getBindingInfo(sName).binding.getExternalValue());
		} else {
			this.setAnyText(this.getBindingInfo(sName).binding.getExternalValue());
		}
	}
});

export default Any as any;
