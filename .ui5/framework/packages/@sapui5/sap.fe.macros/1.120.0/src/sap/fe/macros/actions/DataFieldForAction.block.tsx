import type { DataFieldForAction } from "@sap-ux/vocabularies-types/vocabularies/UI";
import { blockAttribute, defineBuildingBlock } from "sap/fe/core/buildingBlocks/BuildingBlockSupport";
import RuntimeBuildingBlock from "sap/fe/core/buildingBlocks/RuntimeBuildingBlock";
import { isActionWithDialog } from "sap/fe/core/converters/annotations/DataField";
import type { AnnotationAction } from "sap/fe/core/converters/controls/Common/Action";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import type { CommandProperties } from "sap/fe/core/jsx-runtime/jsx";
import type { CoreLib } from "sap/fe/core/library";
import library from "sap/fe/core/library";
import * as CriticalityFormatters from "sap/fe/core/templating/CriticalityFormatters";
import Button from "sap/m/Button";
import type Event from "sap/ui/base/Event";
import type Controller from "sap/ui/core/mvc/Controller";
import type View from "sap/ui/core/mvc/View";
import type Context from "sap/ui/model/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";

type ControllerWithAction = Controller & {
	handlers: {
		onCallAction: Function;
	};
};
@defineBuildingBlock({ name: "DataFieldForAction", namespace: "sap.fe.macros.actions" })
export default class DataFieldForActionBlock extends RuntimeBuildingBlock {
	@blockAttribute({ type: "object", required: true })
	action!: AnnotationAction;

	@blockAttribute({ type: "sap.ui.model.Context", required: true })
	contextPath!: Context;

	@blockAttribute({
		type: "string",
		required: true
	})
	id!: string;

	getContent(view: View) {
		const controller = view.getController();
		const dataViewModelPath = getInvolvedDataModelObjects(this.contextPath);
		const odataMetaModel = this.contextPath.getModel() as ODataMetaModel;
		const annotationPath = this.action.annotationPath;
		let pressEvent: { press: (event: Event) => void } | { "jsx:command": CommandProperties };
		if (annotationPath) {
			const annotationPathContext = odataMetaModel.getContext(annotationPath);
			const dataFieldContextModelPath = getInvolvedDataModelObjects(annotationPathContext);
			const dataFieldForAction = dataFieldContextModelPath.targetObject as DataFieldForAction | undefined;
			if (dataFieldForAction) {
				const actionParameters = {
					entitySetName: dataViewModelPath.targetEntitySet?.name,
					invocationGrouping:
						dataFieldForAction.InvocationGrouping === "UI.OperationGroupingType/ChangeSet"
							? (library as CoreLib).InvocationGrouping.ChangeSet
							: (library as CoreLib).InvocationGrouping.Isolated,
					label: dataFieldForAction.Label?.toString(),
					isNavigable: this.action.isNavigable,
					defaultValuesExtensionFunction: this.action.defaultValuesExtensionFunction
				};
				if (!this.action.command) {
					pressEvent = {
						press: () => {
							(controller as ControllerWithAction).handlers.onCallAction(view, dataFieldForAction.Action as string, {
								...actionParameters,
								...{
									contexts: view.getBindingContext(),
									model: view.getModel()
								}
							});
						}
					};
				} else {
					pressEvent = { "jsx:command": `${this.action.command}|press` as CommandProperties };
				}
				return (
					<Button
						id={this.id}
						text={actionParameters.label}
						{...pressEvent}
						ariaHasPopup={isActionWithDialog(dataFieldContextModelPath.targetObject as DataFieldForAction)}
						visible={this.action.visible}
						enabled={this.action.enabled}
						type={CriticalityFormatters.buildExpressionForCriticalityButtonType(dataFieldContextModelPath)}
					/>
				) as Button;
			}
		}
	}
}
