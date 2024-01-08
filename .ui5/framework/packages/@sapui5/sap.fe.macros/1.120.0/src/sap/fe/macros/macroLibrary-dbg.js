/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/controls/DataLossOrDraftDiscard/DraftDataLossDialog.block", "sap/fe/core/controls/Recommendations/ConfirmRecommendationDialog.block", "sap/fe/macros/field/PublicField.block", "sap/fe/macros/form/FormElement.block", "sap/fe/macros/notes/Notes.block", "sap/fe/macros/richtexteditor/RichTextEditor.block", "sap/fe/macros/richtexteditor/RichTextEditorWithMetadata.block", "sap/fe/macros/situations/SituationsIndicator.block", "sap/fe/macros/table/QuickFilterSelector.block", "sap/fe/macros/table/TableFullScreenDialog.block", "./actions/CustomAction.block", "./actions/DataFieldForAction.block", "./chart/Chart.block", "./contact/Contact.block", "./contact/Email.block", "./contact/TeamContactOptions.block", "./draftIndicator/DraftIndicator.block", "./fcl/FlexibleColumnLayoutActions.block", "./filterBar/FilterBar.block", "./form/Form.block", "./form/FormContainer.block", "./fpm/CustomFragment.block", "./ina/MultiDimensionalGrid.block", "./internal/ActionCommand.block", "./internal/DataPoint.block", "./internal/FilterField.block", "./internal/InternalField.block", "./kpiTag/AnalyticalKPITag.block", "./kpiTag/KPITag.block", "./microchart/MicroChart.block", "./multiValueField/MultiValueField.block", "./paginator/Paginator.block", "./quickView/QuickView.block", "./share/Share.block", "./table/Table.block", "./valuehelp/ValueHelp.block", "./valuehelp/ValueHelpFilterBar.block", "./visualfilters/VisualFilter.block"], function (DraftDataLossDialogBlock, ConfirmRecommendationDialogBlock, PublicFieldBlock, FormElementBlock, NotesBuildingBlock, RichTextEditorBlock, RichTextEditorWithMetadataBlock, SituationsIndicatorBlock, QuickFilterSelector, TableFullScreenDialogBlock, CustomAction, DataFieldForAction, ChartBlock, ContactBlock, EmailBlock, TeamContactOptionsBlock, DraftIndicatorBlock, FlexibleColumnLayoutActionsBlock, FilterBarBlock, FormBlock, FormContainerBlock, CustomFragmentBlock, MultiDimensionalGridBlock, ActionCommandBlock, DataPointBlock, FilterFieldBlock, InternalFieldBlock, AnalyticalKPITagBlock, KPITagBlock, MicroChartBlock, MultiValueFieldBlock, PaginatorBlock, QuickViewBlock, ShareBlock, TableBlock, ValueHelpBlock, ValueHelpFilterBarBlock, VisualFilterBlock) {
  "use strict";

  const buildingBlocks = [ActionCommandBlock, ChartBlock, ContactBlock, CustomAction, CustomFragmentBlock, DataFieldForAction, DataPointBlock, DraftDataLossDialogBlock, ConfirmRecommendationDialogBlock, DraftIndicatorBlock, EmailBlock, FilterBarBlock, FilterFieldBlock, FlexibleColumnLayoutActionsBlock, FormBlock, FormContainerBlock, FormElementBlock, InternalFieldBlock, KPITagBlock, AnalyticalKPITagBlock, MicroChartBlock, MultiDimensionalGridBlock, MultiValueFieldBlock, PaginatorBlock, PublicFieldBlock, QuickViewBlock, ShareBlock, SituationsIndicatorBlock, TableBlock, TableFullScreenDialogBlock, TeamContactOptionsBlock, ValueHelpBlock, ValueHelpFilterBarBlock, VisualFilterBlock, QuickFilterSelector, RichTextEditorBlock, RichTextEditorWithMetadataBlock, NotesBuildingBlock];
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
  return {
    register: registerAll,
    unregister: unregisterAll
  };
}, false);
