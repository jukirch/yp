import type { EnhanceWithUI5 } from "sap/fe/core/helpers/ClassSupport";
import { aggregation, defineUI5Class, event, implementInterface, property } from "sap/fe/core/helpers/ClassSupport";
import { getEditStatusFilter } from "sap/fe/core/templating/FilterHelper";
import SearchField from "sap/m/SearchField";
import Control from "sap/ui/core/Control";
import type RenderManager from "sap/ui/core/RenderManager";
import type { IFilter } from "sap/ui/mdc/library";
import TypeMap from "sap/ui/mdc/odata/v4/TypeMap";

@defineUI5Class("sap.fe.macros.table.BasicSearch")
class BasicSearch extends Control implements IFilter {
	@implementInterface("sap.ui.mdc.IFilter")
	__implements__sap_ui_mdc_IFilter = true;

	__implements__sap_ui_mdc_IFilterSource = true;

	/**
	 * The 'filterChanged' can be optionally implemented to display an overlay
	 * when the filter value of the IFilter changes
	 */
	@event(/*{ conditionsBased: {
		 	type: "boolean"
		 }}*/)
	filterChanged!: Function;

	/**
	 * The 'search' event is a mandatory IFilter event to trigger a search query
	 * on the consuming control
	 */
	@event(/*{
				conditions: {
					type: "object"
				}
			}*/)
	search!: Function;

	@aggregation({
		type: "sap.ui.core.Control",
		multiple: false
	})
	filter!: SearchField;

	@property({
		type: "boolean"
	})
	useDraftEditState = false;

	init() {
		this.setAggregation(
			"filter",
			new SearchField({
				placeholder: "{sap.fe.i18n>M_FILTERBAR_SEARCH}",
				search: () => {
					this.fireEvent("search");
				}
			})
		);
	}

	getConditions() {
		if (this.useDraftEditState) {
			return getEditStatusFilter();
		}
		return {};
	}

	getTypeMap(): object {
		return TypeMap;
	}

	getPropertyInfoSet() {
		if (this.useDraftEditState) {
			return [
				{
					name: "$editState",
					path: "$editState",
					groupLabel: "",
					group: "",
					typeConfig: TypeMap.getTypeConfig("sap.ui.model.odata.type.String", {}, {}),
					dataType: "sap.ui.model.odata.type.String",
					hiddenFilter: false
				}
			];
		}
		return [];
	}

	getSearch() {
		return this.filter.getValue();
	}

	validate() {
		return Promise.resolve();
	}

	static render(oRm: RenderManager, oControl: BasicSearch) {
		oRm.openStart("div", oControl);
		oRm.openEnd();
		oRm.renderControl(oControl.filter);
		oRm.close("div");
	}
}

export default BasicSearch as unknown as EnhanceWithUI5<BasicSearch>;
