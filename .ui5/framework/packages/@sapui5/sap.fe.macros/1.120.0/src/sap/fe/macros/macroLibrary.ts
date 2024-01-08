import type BuildingBlockBase from "sap/fe/core/buildingBlocks/BuildingBlockBase";
import DraftDataLossDialogBlock from "sap/fe/core/controls/DataLossOrDraftDiscard/DraftDataLossDialog.block";
import ConfirmRecommendationDialogBlock from "sap/fe/core/controls/Recommendations/ConfirmRecommendationDialog.block";
import PublicFieldBlock from "sap/fe/macros/field/PublicField.block";
import FormElementBlock from "sap/fe/macros/form/FormElement.block";
import NotesBuildingBlock from "sap/fe/macros/notes/Notes.block";
import RichTextEditorBlock from "sap/fe/macros/richtexteditor/RichTextEditor.block";
import RichTextEditorWithMetadataBlock from "sap/fe/macros/richtexteditor/RichTextEditorWithMetadata.block";
import SituationsIndicatorBlock from "sap/fe/macros/situations/SituationsIndicator.block";
import QuickFilterSelector from "sap/fe/macros/table/QuickFilterSelector.block";
import TableFullScreenDialogBlock from "sap/fe/macros/table/TableFullScreenDialog.block";
import CustomAction from "./actions/CustomAction.block";
import DataFieldForAction from "./actions/DataFieldForAction.block";
import ChartBlock from "./chart/Chart.block";
import ContactBlock from "./contact/Contact.block";
import EmailBlock from "./contact/Email.block";
import TeamContactOptionsBlock from "./contact/TeamContactOptions.block";
import DraftIndicatorBlock from "./draftIndicator/DraftIndicator.block";
import FlexibleColumnLayoutActionsBlock from "./fcl/FlexibleColumnLayoutActions.block";
import FilterBarBlock from "./filterBar/FilterBar.block";
import FormBlock from "./form/Form.block";
import FormContainerBlock from "./form/FormContainer.block";
import CustomFragmentBlock from "./fpm/CustomFragment.block";
import MultiDimensionalGridBlock from "./ina/MultiDimensionalGrid.block";
import ActionCommandBlock from "./internal/ActionCommand.block";
import DataPointBlock from "./internal/DataPoint.block";
import FilterFieldBlock from "./internal/FilterField.block";
import InternalFieldBlock from "./internal/InternalField.block";
import AnalyticalKPITagBlock from "./kpiTag/AnalyticalKPITag.block";
import KPITagBlock from "./kpiTag/KPITag.block";
import MicroChartBlock from "./microchart/MicroChart.block";
import MultiValueFieldBlock from "./multiValueField/MultiValueField.block";
import PaginatorBlock from "./paginator/Paginator.block";
import QuickViewBlock from "./quickView/QuickView.block";
import ShareBlock from "./share/Share.block";
import TableBlock from "./table/Table.block";
import ValueHelpBlock from "./valuehelp/ValueHelp.block";
import ValueHelpFilterBarBlock from "./valuehelp/ValueHelpFilterBar.block";
import VisualFilterBlock from "./visualfilters/VisualFilter.block";

const buildingBlocks: (typeof BuildingBlockBase)[] = [
	ActionCommandBlock,
	ChartBlock,
	ContactBlock,
	CustomAction,
	CustomFragmentBlock,
	DataFieldForAction,
	DataPointBlock,
	DraftDataLossDialogBlock,
	ConfirmRecommendationDialogBlock,
	DraftIndicatorBlock,
	EmailBlock,
	FilterBarBlock,
	FilterFieldBlock,
	FlexibleColumnLayoutActionsBlock,
	FormBlock,
	FormContainerBlock,
	FormElementBlock,
	InternalFieldBlock,
	KPITagBlock,
	AnalyticalKPITagBlock,
	MicroChartBlock,
	MultiDimensionalGridBlock,
	MultiValueFieldBlock,
	PaginatorBlock,
	PublicFieldBlock,
	QuickViewBlock,
	ShareBlock,
	SituationsIndicatorBlock,
	TableBlock,
	TableFullScreenDialogBlock,
	TeamContactOptionsBlock,
	ValueHelpBlock,
	ValueHelpFilterBarBlock,
	VisualFilterBlock,
	QuickFilterSelector,
	RichTextEditorBlock,
	RichTextEditorWithMetadataBlock,
	NotesBuildingBlock
];

function registerAll() {
	for (const buildingBlock of buildingBlocks) {
		buildingBlock.register();
	}
}

//This is needed in for templating test utils
function unregisterAll() {
	for (const buildingBlock of buildingBlocks) {
		buildingBlock.unregister();
	}
}

//Always register when loaded for compatibility
registerAll();

export default {
	register: registerAll,
	unregister: unregisterAll
};
