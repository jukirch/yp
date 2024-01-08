/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/merge", "sap/fe/core/CommonUtils", "sap/fe/core/helpers/MetaModelFunction", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/macros/CommonHelper", "sap/fe/macros/DelegateUtil", "sap/fe/macros/chart/ChartHelper", "sap/fe/macros/chart/ChartUtils", "sap/fe/macros/filter/FilterUtils", "sap/ui/core/Core", "sap/ui/mdc/enums/ChartItemRoleType", "sap/ui/mdc/odata/v4/util/DelegateUtil", "sap/ui/mdc/odata/v4/vizChart/ChartDelegate", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "../filterBar/FilterBarDelegate"], function (Log, merge, CommonUtils, MetaModelFunction, ResourceModelHelper, CommonHelper, MacrosDelegateUtil, ChartHelper, ChartUtils, FilterUtils, Core, ChartItemRoleType, DelegateUtil, BaseChartDelegate, Filter, FilterOperator, FilterBarDelegate) {
  "use strict";

  var getResourceModel = ResourceModelHelper.getResourceModel;
  var isMultiValueFilterExpression = MetaModelFunction.isMultiValueFilterExpression;
  var getSortRestrictionsInfo = MetaModelFunction.getSortRestrictionsInfo;
  var getFilterRestrictionsInfo = MetaModelFunction.getFilterRestrictionsInfo;
  // /**
  //  * Helper class for sap.ui.mdc.Chart.
  //  * <h3><b>Note:</b></h3>
  //  * The class is experimental and the API/behaviour is not finalised
  //  * and hence this should not be used for productive usage.
  //  * Especially this class is not intended to be used for the FE scenario,
  //  * here we shall use sap.fe.macros.ChartDelegate that is especially tailored for V4
  //  * meta model
  //  *
  //  * @author SAP SE
  //  * @private
  //  * @experimental
  //  * @since 1.62
  //  * @alias sap.fe.macros.ChartDelegate
  //  */
  const ChartDelegate = Object.assign({}, BaseChartDelegate);
  BaseChartDelegate.apiVersion = 2;
  ChartDelegate._loadChart = async function () {
    await Core.loadLibrary("sap.chart");
    return BaseChartDelegate._loadChart();
  };
  ChartDelegate._setChartNoDataText = function (oChart, oBindingInfo) {
    let sNoDataKey = "";
    const oChartFilterInfo = ChartUtils.getAllFilterInfo(oChart),
      suffixResourceKey = oBindingInfo.path.startsWith("/") ? oBindingInfo.path.substr(1) : oBindingInfo.path;
    const _getNoDataTextWithFilters = function () {
      if (oChart.data("multiViews")) {
        return "M_TABLE_AND_CHART_NO_DATA_TEXT_MULTI_VIEW";
      } else {
        return "T_TABLE_AND_CHART_NO_DATA_TEXT_WITH_FILTER";
      }
    };
    if (oChart.getFilter()) {
      if (oChartFilterInfo.search || oChartFilterInfo.filters && oChartFilterInfo.filters.length) {
        sNoDataKey = _getNoDataTextWithFilters();
      } else {
        sNoDataKey = "T_TABLE_AND_CHART_NO_DATA_TEXT";
      }
    } else if (oChartFilterInfo.search || oChartFilterInfo.filters && oChartFilterInfo.filters.length) {
      sNoDataKey = _getNoDataTextWithFilters();
    } else {
      sNoDataKey = "M_TABLE_AND_CHART_NO_FILTERS_NO_DATA_TEXT";
    }
    oChart.setNoDataText(getResourceModel(oChart).getText(sNoDataKey, undefined, suffixResourceKey));
  };
  ChartDelegate._handleProperty = function (oMDCChart, mEntitySetAnnotations, mKnownAggregatableProps, mCustomAggregates, aProperties, sCriticality) {
    const oApplySupported = CommonHelper.parseCustomData(oMDCChart.data("applySupported"));
    const sortRestrictionsInfo = getSortRestrictionsInfo(mEntitySetAnnotations);
    const oFilterRestrictions = mEntitySetAnnotations["@Org.OData.Capabilities.V1.FilterRestrictions"];
    const oFilterRestrictionsInfo = getFilterRestrictionsInfo(oFilterRestrictions);
    const oObj = this.getModel().getObject(this.getPath());
    const sKey = this.getModel().getObject(`${this.getPath()}@sapui.name`);
    const oMetaModel = this.getModel();
    const aModes = oMDCChart.getP13nMode();
    checkForNonfilterableEntitySet(oMDCChart, aModes);
    if (oObj && oObj.$kind === "Property") {
      // ignore (as for now) all complex properties
      // not clear if they might be nesting (complex in complex)
      // not clear how they are represented in non-filterable annotation
      // etc.
      if (oObj.$isCollection) {
        //Log.warning("Complex property with type " + oObj.$Type + " has been ignored");
        return;
      }
      const oPropertyAnnotations = oMetaModel.getObject(`${this.getPath()}@`);
      const sPath = oMetaModel.getObject("@sapui.name", oMetaModel.getMetaContext(this.getPath()));
      const aGroupableProperties = oApplySupported && oApplySupported.GroupableProperties;
      const aAggregatableProperties = oApplySupported && oApplySupported.AggregatableProperties;
      let bGroupable = aGroupableProperties ? checkPropertyType(aGroupableProperties, sPath) : false;
      let bAggregatable = aAggregatableProperties ? checkPropertyType(aAggregatableProperties, sPath) : false;
      if (!aGroupableProperties || aGroupableProperties && !aGroupableProperties.length) {
        bGroupable = oPropertyAnnotations["@Org.OData.Aggregation.V1.Groupable"];
      }
      if (!aAggregatableProperties || aAggregatableProperties && !aAggregatableProperties.length) {
        bAggregatable = oPropertyAnnotations["@Org.OData.Aggregation.V1.Aggregatable"];
      }

      //Right now: skip them, since we can't create a chart from it
      if (!bGroupable && !bAggregatable) {
        return;
      }
      checkPropertyIsBothGroupableAndAggregatable(mCustomAggregates, sKey, bGroupable, bAggregatable);
      const customAggregates = Object.keys(mCustomAggregates);
      if (bAggregatable) {
        const aAggregateProperties = ChartDelegate._createPropertyInfosForAggregatable(oMDCChart, sKey, oPropertyAnnotations, oFilterRestrictionsInfo, sortRestrictionsInfo, mKnownAggregatableProps, mCustomAggregates);
        aAggregateProperties.forEach(function (oAggregateProperty) {
          aProperties.push(oAggregateProperty);
        });
        //Add transformation aggregated properties to chart properties
        if (aModes && aModes.includes("Filter")) {
          const aKnownAggregatableProps = Object.keys(mKnownAggregatableProps);
          const aGroupablePropertiesValues = aGroupableProperties.map(oProperty => oProperty.$PropertyPath);
          // Add transformation aggregated property to chart so that in the filter dropdown it's visible
          // Also mark visibility false as this property should not come up in under chart section of personalization dialog
          if (aKnownAggregatableProps.includes(sKey) && !aGroupablePropertiesValues.includes(sKey)) {
            var _oFilterRestrictionsI, _oFilterRestrictionsI2;
            aProperties = addPropertyToChart(aProperties, sKey, oPropertyAnnotations, customAggregates.includes(sKey) ? false : (oFilterRestrictionsInfo === null || oFilterRestrictionsInfo === void 0 ? void 0 : (_oFilterRestrictionsI = oFilterRestrictionsInfo.propertyInfo) === null || _oFilterRestrictionsI === void 0 ? void 0 : (_oFilterRestrictionsI2 = _oFilterRestrictionsI[sKey]) === null || _oFilterRestrictionsI2 === void 0 ? void 0 : _oFilterRestrictionsI2.filterable) ?? true, oFilterRestrictionsInfo, sortRestrictionsInfo, oMDCChart, sCriticality, oObj, false, customAggregates.includes(sKey) ? false : true, undefined, true);
          }
        }
      }
      if (bGroupable) {
        var _oFilterRestrictionsI3, _oFilterRestrictionsI4;
        const sName = sKey || "",
          sTextProperty = oPropertyAnnotations["@com.sap.vocabularies.Common.v1.Text"] ? oPropertyAnnotations["@com.sap.vocabularies.Common.v1.Text"].$Path : null;
        let bIsNavigationText = false;
        if (sName && sName.includes("/")) {
          Log.error(`$expand is not yet supported. Property: ${sName} from an association cannot be used`);
          return;
        }
        if (sTextProperty && sTextProperty.indexOf("/") > -1) {
          Log.error(`$expand is not yet supported. Text Property: ${sTextProperty} from an association cannot be used`);
          bIsNavigationText = true;
        }
        aProperties = addPropertyToChart(aProperties, sKey, oPropertyAnnotations, customAggregates.includes(sKey) ? false : (oFilterRestrictionsInfo === null || oFilterRestrictionsInfo === void 0 ? void 0 : (_oFilterRestrictionsI3 = oFilterRestrictionsInfo.propertyInfo) === null || _oFilterRestrictionsI3 === void 0 ? void 0 : (_oFilterRestrictionsI4 = _oFilterRestrictionsI3[sKey]) === null || _oFilterRestrictionsI4 === void 0 ? void 0 : _oFilterRestrictionsI4.filterable) ?? true, oFilterRestrictionsInfo, sortRestrictionsInfo, oMDCChart, sCriticality, oObj, customAggregates.includes(sKey) ? false : true, false, bIsNavigationText);
      }
    }
  };
  // create properties for chart
  function addPropertyToChart(aProperties, sKey, oPropertyAnnotations, isFilterable, oFilterRestrictionsInfo, sortRestrictionsInfo, oMDCChart, sCriticality, oObj, bIsGroupable, bIsAggregatable, bIsNavigationText, bIsHidden) {
    aProperties.push({
      name: "_fe_groupable_" + sKey,
      propertyPath: sKey,
      label: oPropertyAnnotations["@com.sap.vocabularies.Common.v1.Label"] || sKey,
      sortable: ChartDelegate._getSortable(oMDCChart, sortRestrictionsInfo.propertyInfo[sKey], false),
      filterable: isFilterable,
      groupable: bIsGroupable,
      aggregatable: bIsAggregatable,
      maxConditions: isMultiValueFilterExpression(oFilterRestrictionsInfo.propertyInfo[sKey]) ? -1 : 1,
      sortKey: sKey,
      path: sKey,
      role: ChartItemRoleType.category,
      //standard, normally this should be interpreted from UI.Chart annotation
      criticality: sCriticality,
      //To be implemented by FE
      typeConfig: _getChartPropertyTypeConfig(oMDCChart, isFilterable, oObj),
      visible: bIsHidden ? !bIsHidden : true,
      textProperty: !bIsNavigationText && oPropertyAnnotations["@com.sap.vocabularies.Common.v1.Text"] ? oPropertyAnnotations["@com.sap.vocabularies.Common.v1.Text"].$Path : null,
      //To be implemented by FE
      textFormatter: oPropertyAnnotations["@com.sap.vocabularies.Common.v1.Text@com.sap.vocabularies.UI.v1.TextArrangement"]
    });
    return aProperties;
  }

  // for every property of chart, configure the typeConfig which we would like to see in the filter dropdrown list
  function _getChartPropertyTypeConfig(oMDCChart, filterable, oObj) {
    let typeConfig;
    if (filterable) {
      var _oMDCChart$getTypeMap;
      typeConfig = oMDCChart === null || oMDCChart === void 0 ? void 0 : (_oMDCChart$getTypeMap = oMDCChart.getTypeMap()) === null || _oMDCChart$getTypeMap === void 0 ? void 0 : _oMDCChart$getTypeMap.getTypeConfig(oObj.$Type);
    }
    return typeConfig;
  }

  // If entityset is non filterable,then from p13n modes remove Filter so that on UI filter option doesn't show up
  function checkForNonfilterableEntitySet(oMDCChart, aModes) {
    var _oMDCChart$getModel, _oMDCChart$getModel$g, _oMDCChart$getModel$g2;
    const bEntitySetFilerable = oMDCChart === null || oMDCChart === void 0 ? void 0 : (_oMDCChart$getModel = oMDCChart.getModel()) === null || _oMDCChart$getModel === void 0 ? void 0 : (_oMDCChart$getModel$g = _oMDCChart$getModel.getMetaModel()) === null || _oMDCChart$getModel$g === void 0 ? void 0 : (_oMDCChart$getModel$g2 = _oMDCChart$getModel$g.getObject(`${oMDCChart.data("targetCollectionPath")}@Org.OData.Capabilities.V1.FilterRestrictions`)) === null || _oMDCChart$getModel$g2 === void 0 ? void 0 : _oMDCChart$getModel$g2.Filterable;
    if (bEntitySetFilerable !== undefined && !bEntitySetFilerable) {
      aModes = aModes.filter(item => item !== "Filter");
      oMDCChart.setP13nMode(aModes);
    }
  }

  //  check if Groupable /Aggregatable property is present or not
  function checkPropertyType(aProperties, sPath) {
    if (aProperties.length) {
      for (const element of aProperties) {
        var _element$Property;
        if ((element === null || element === void 0 ? void 0 : element.$PropertyPath) === sPath || (element === null || element === void 0 ? void 0 : (_element$Property = element.Property) === null || _element$Property === void 0 ? void 0 : _element$Property.$PropertyPath) === sPath) {
          return true;
        }
      }
    }
  }

  //If same custom property is configured as groupable and aggregatable throw an error
  function checkPropertyIsBothGroupableAndAggregatable(mCustomAggregates, sKey, bGroupable, bAggregatable) {
    const customProperties = Object.keys(mCustomAggregates);
    if (bGroupable && bAggregatable && customProperties.includes(sKey)) {
      throw new Error("Same property can not be configured as groupable and aggregatable");
    }
  }
  ChartDelegate.formatText = function (oValue1, oValue2) {
    const oTextArrangementAnnotation = this.textFormatter;
    if (!oTextArrangementAnnotation || oTextArrangementAnnotation.$EnumMember === "com.sap.vocabularies.UI.v1.TextArrangementType/TextFirst") {
      return `${oValue2} (${oValue1})`;
    } else if (oTextArrangementAnnotation.$EnumMember === "com.sap.vocabularies.UI.v1.TextArrangementType/TextLast") {
      return `${oValue1} (${oValue2})`;
    } else if (oTextArrangementAnnotation.$EnumMember === "com.sap.vocabularies.UI.v1.TextArrangementType/TextOnly") {
      return oValue2;
    }
    return oValue2 ? oValue2 : oValue1;
  };
  ChartDelegate.updateBindingInfo = function (oChart, oBindingInfo) {
    const internalBindingContext = oChart.getBindingContext("internal");
    internalBindingContext.setProperty("isInsightsEnabled", true);
    ChartDelegate._setChartNoDataText(oChart, oBindingInfo);
    const oFilter = sap.ui.getCore().byId(oChart.getFilter());
    const mConditions = oChart.getConditions();
    if (!oBindingInfo) {
      oBindingInfo = {};
    }
    if (!oBindingInfo.parameters) {
      oBindingInfo.parameters = {};
    }
    if (oFilter) {
      // Search
      const oInfo = FilterUtils.getFilterInfo(oFilter, {});
      const oApplySupported = CommonHelper.parseCustomData(oChart.data("applySupported"));
      if (oApplySupported && oApplySupported.enableSearch && oInfo.search) {
        oBindingInfo.parameters.$search = CommonUtils.normalizeSearchTerm(oInfo.search);
      } else if (oBindingInfo.parameters.$search) {
        delete oBindingInfo.parameters.$search;
      }
    }
    const sParameterPath = mConditions ? DelegateUtil.getParametersInfo(oFilter, mConditions) : null;
    if (sParameterPath) {
      oBindingInfo.path = sParameterPath;
    }
    const oFilterInfo = ChartUtils.getAllFilterInfo(oChart);

    // remove prefixes so that entityset will match with the property names with these field
    if (oFilterInfo.filters) {
      oFilterInfo.filters = CommonUtils.getChartPropertiesWithoutPrefixes(oFilterInfo.filters);
    }
    oBindingInfo.filters = oFilterInfo.filters.length > 0 ? new Filter({
      filters: oFilterInfo.filters,
      and: true
    }) : undefined;
    oBindingInfo.sorter = this.getSorters(oChart);
    ChartDelegate._checkAndAddDraftFilter(oChart, oBindingInfo);
  };
  ChartDelegate.fetchProperties = function (oMDCChart) {
    const oModel = this._getModel(oMDCChart);
    let pCreatePropertyInfos;
    if (!oModel) {
      pCreatePropertyInfos = new Promise(resolve => {
        oMDCChart.attachModelContextChange({
          resolver: resolve
        }, onModelContextChange, this);
      }).then(oRetrievedModel => {
        return this._createPropertyInfos(oMDCChart, oRetrievedModel);
      });
    } else {
      pCreatePropertyInfos = this._createPropertyInfos(oMDCChart, oModel);
    }
    return pCreatePropertyInfos.then(function (aProperties) {
      if (oMDCChart.data) {
        oMDCChart.data("$mdcChartPropertyInfo", aProperties);
        // store the properties to fetch during p13n calculation
        MacrosDelegateUtil.setCachedProperties(oMDCChart, aProperties);
      }
      return aProperties;
    });
  };
  function onModelContextChange(oEvent, oData) {
    const oMDCChart = oEvent.getSource();
    const oModel = this._getModel(oMDCChart);
    if (oModel) {
      oMDCChart.detachModelContextChange(onModelContextChange);
      oData.resolver(oModel);
    }
  }
  ChartDelegate._createPropertyInfos = async function (oMDCChart, oModel) {
    const sEntitySetPath = `/${oMDCChart.data("entitySet")}`;
    const oMetaModel = oModel.getMetaModel();
    const aResults = await Promise.all([oMetaModel.requestObject(`${sEntitySetPath}/`), oMetaModel.requestObject(`${sEntitySetPath}@`)]);
    const aProperties = [];
    const oEntityType = aResults[0];
    const mEntitySetAnnotations = aResults[1];
    const mCustomAggregates = CommonHelper.parseCustomData(oMDCChart.data("customAgg"));
    getCustomAggregate(mCustomAggregates, oMDCChart);
    let sAnno;
    const aPropertyPromise = [];
    for (const sAnnoKey in mEntitySetAnnotations) {
      if (sAnnoKey.startsWith("@Org.OData.Aggregation.V1.CustomAggregate")) {
        sAnno = sAnnoKey.replace("@Org.OData.Aggregation.V1.CustomAggregate#", "");
        const aAnno = sAnno.split("@");
        if (aAnno.length == 2 && aAnno[1] == "com.sap.vocabularies.Common.v1.Label") {
          mCustomAggregates[aAnno[0]] = mEntitySetAnnotations[sAnnoKey];
        }
      }
    }
    const mTypeAggregatableProps = CommonHelper.parseCustomData(oMDCChart.data("transAgg"));
    const mKnownAggregatableProps = {};
    for (const sAggregatable in mTypeAggregatableProps) {
      const sPropKey = mTypeAggregatableProps[sAggregatable].propertyPath;
      mKnownAggregatableProps[sPropKey] = mKnownAggregatableProps[sPropKey] || {};
      mKnownAggregatableProps[sPropKey][mTypeAggregatableProps[sAggregatable].aggregationMethod] = {
        name: mTypeAggregatableProps[sAggregatable].name,
        label: mTypeAggregatableProps[sAggregatable].label
      };
    }
    for (const sKey in oEntityType) {
      if (sKey.indexOf("$") !== 0) {
        aPropertyPromise.push(ChartHelper.fetchCriticality(oMetaModel, oMetaModel.createBindingContext(`${sEntitySetPath}/${sKey}`)).then(ChartDelegate._handleProperty.bind(oMetaModel.getMetaContext(`${sEntitySetPath}/${sKey}`), oMDCChart, mEntitySetAnnotations, mKnownAggregatableProps, mCustomAggregates, aProperties)));
      }
    }
    await Promise.all(aPropertyPromise);
    return aProperties;
  };
  function getCustomAggregate(mCustomAggregates, oMDCChart) {
    const aDimensions = [],
      aMeasures = [];
    if (mCustomAggregates && Object.keys(mCustomAggregates).length >= 1) {
      const aChartItems = oMDCChart.getItems();
      for (const key in aChartItems) {
        if (aChartItems[key].getType() === "groupable") {
          aDimensions.push(ChartDelegate.getInternalChartNameFromPropertyNameAndKind(aChartItems[key].getName(), "groupable"));
        } else if (aChartItems[key].getType() === "aggregatable") {
          aMeasures.push(ChartDelegate.getInternalChartNameFromPropertyNameAndKind(aChartItems[key].getName(), "aggregatable"));
        }
      }
      if (aMeasures.filter(function (val) {
        return aDimensions.includes(val);
      }).length >= 1) {
        Log.error("Dimension and Measure has the sameProperty Configured");
      }
    }
  }
  ChartDelegate._createPropertyInfosForAggregatable = function (oMDCChart, sKey, oPropertyAnnotations, oFilterRestrictionsInfo, sortRestrictionsInfo, mKnownAggregatableProps, mCustomAggregates) {
    const aAggregateProperties = [];
    if (Object.keys(mKnownAggregatableProps).includes(sKey)) {
      for (const sAggregatable in mKnownAggregatableProps[sKey]) {
        aAggregateProperties.push({
          name: "_fe_aggregatable_" + mKnownAggregatableProps[sKey][sAggregatable].name,
          propertyPath: sKey,
          label: mKnownAggregatableProps[sKey][sAggregatable].label || `${oPropertyAnnotations["@com.sap.vocabularies.Common.v1.Label"]} (${sAggregatable})` || `${sKey} (${sAggregatable})`,
          sortable: sortRestrictionsInfo.propertyInfo[sKey] ? sortRestrictionsInfo.propertyInfo[sKey].sortable : true,
          filterable: false,
          groupable: false,
          aggregatable: true,
          path: sKey,
          aggregationMethod: sAggregatable,
          maxConditions: isMultiValueFilterExpression(oFilterRestrictionsInfo.propertyInfo[sKey]) ? -1 : 1,
          role: ChartItemRoleType.axis1,
          datapoint: null //To be implemented by FE
        });
      }
    }

    if (Object.keys(mCustomAggregates).includes(sKey)) {
      for (const sCustom in mCustomAggregates) {
        if (sCustom === sKey) {
          const oItem = merge({}, mCustomAggregates[sCustom], {
            name: "_fe_aggregatable_" + sCustom,
            groupable: false,
            aggregatable: true,
            filterable: false,
            role: ChartItemRoleType.axis1,
            propertyPath: sCustom,
            datapoint: null //To be implemented by FE
          });

          aAggregateProperties.push(oItem);
          break;
        }
      }
    }
    return aAggregateProperties;
  };
  ChartDelegate.rebind = function (oMDCChart, oBindingInfo) {
    const sSearch = oBindingInfo.parameters.$search;
    if (sSearch) {
      delete oBindingInfo.parameters.$search;
    }
    BaseChartDelegate.rebind(oMDCChart, oBindingInfo);
    if (sSearch) {
      const oInnerChart = oMDCChart.getControlDelegate().getInnerChart(oMDCChart),
        oChartBinding = oInnerChart && oInnerChart.getBinding("data");

      // Temporary workaround until this is fixed in MDCChart / UI5 Chart
      // In order to avoid having 2 OData requests, we need to suspend the binding before setting some aggregation properties
      // and resume it once the chart has added other aggregation properties (in onBeforeRendering)
      oChartBinding.suspend();
      oChartBinding.setAggregation({
        search: sSearch
      });
      const oInnerChartDelegate = {
        onBeforeRendering: function () {
          oChartBinding.resume();
          oInnerChart.removeEventDelegate(oInnerChartDelegate);
        }
      };
      oInnerChart.addEventDelegate(oInnerChartDelegate);
    }
    oMDCChart.fireEvent("bindingUpdated");
  };
  ChartDelegate._setChart = function (oMDCChart, oInnerChart) {
    const oChartAPI = oMDCChart.getParent();
    oInnerChart.setVizProperties(oMDCChart.data("vizProperties"));
    oInnerChart.detachSelectData(oChartAPI.handleSelectionChange.bind(oChartAPI));
    oInnerChart.detachDeselectData(oChartAPI.handleSelectionChange.bind(oChartAPI));
    oInnerChart.detachDrilledUp(oChartAPI.handleSelectionChange.bind(oChartAPI));
    oInnerChart.attachSelectData(oChartAPI.handleSelectionChange.bind(oChartAPI));
    oInnerChart.attachDeselectData(oChartAPI.handleSelectionChange.bind(oChartAPI));
    oInnerChart.attachDrilledUp(oChartAPI.handleSelectionChange.bind(oChartAPI));
    oInnerChart.setSelectionMode(oMDCChart.getPayload().selectionMode.toUpperCase());
    BaseChartDelegate._setChart(oMDCChart, oInnerChart);
  };
  ChartDelegate._getBindingInfo = function (oMDCChart) {
    if (this._getBindingInfoFromState(oMDCChart)) {
      return this._getBindingInfoFromState(oMDCChart);
    }
    const oMetadataInfo = oMDCChart.getDelegate().payload;
    const oMetaModel = oMDCChart.getModel() && oMDCChart.getModel().getMetaModel();
    const sTargetCollectionPath = oMDCChart.data("targetCollectionPath");
    const sEntitySetPath = (oMetaModel.getObject(`${sTargetCollectionPath}/$kind`) !== "NavigationProperty" ? "/" : "") + oMetadataInfo.contextPath;
    const oParams = merge({}, oMetadataInfo.parameters, {
      entitySet: oMDCChart.data("entitySet")
    });
    return {
      path: sEntitySetPath,
      events: {
        dataRequested: oMDCChart.getParent().onInternalDataRequested.bind(oMDCChart.getParent())
      },
      parameters: oParams
    };
  };
  ChartDelegate.removeItemFromInnerChart = function (oMDCChart, oMDCChartItem) {
    BaseChartDelegate.removeItemFromInnerChart.call(this, oMDCChart, oMDCChartItem);
    if (oMDCChartItem.getType() === "groupable") {
      const oInnerChart = this.getInnerChart(oMDCChart);
      oInnerChart.fireDeselectData();
    }
  };
  ChartDelegate._getSortable = function (oMDCChart, sortRestrictionsProperty, bIsTransAggregate) {
    if (bIsTransAggregate) {
      if (oMDCChart.data("draftSupported") === "true") {
        return false;
      } else {
        return sortRestrictionsProperty ? sortRestrictionsProperty.sortable : true;
      }
    }
    return sortRestrictionsProperty ? sortRestrictionsProperty.sortable : true;
  };
  ChartDelegate._checkAndAddDraftFilter = function (oChart, oBindingInfo) {
    if (oChart.data("draftSupported") === "true") {
      if (!oBindingInfo) {
        oBindingInfo = {};
      }
      if (!oBindingInfo.filters) {
        oBindingInfo.filters = [];
        oBindingInfo.filters.push(new Filter("IsActiveEntity", FilterOperator.EQ, true));
      } else {
        var _oBindingInfo$filters, _oBindingInfo$filters2;
        (_oBindingInfo$filters = oBindingInfo.filters) === null || _oBindingInfo$filters === void 0 ? void 0 : (_oBindingInfo$filters2 = _oBindingInfo$filters.aFilters) === null || _oBindingInfo$filters2 === void 0 ? void 0 : _oBindingInfo$filters2.push(new Filter("IsActiveEntity", FilterOperator.EQ, true));
      }
    }
  };

  /**
   * This function returns an ID which should be used in the internal chart for the measure or dimension.
   * For standard cases, this is just the ID of the property.
   * If it is necessary to use another ID internally inside the chart (e.g. on duplicate property IDs) this method can be overwritten.
   * In this case, <code>getPropertyFromNameAndKind</code> needs to be overwritten as well.
   *
   * @param name ID of the property
   * @param kind Type of the property (measure or dimension)
   * @returns Internal ID for the sap.chart.Chart
   */
  ChartDelegate.getInternalChartNameFromPropertyNameAndKind = function (name, kind) {
    return name.replace("_fe_" + kind + "_", "");
  };

  /**
   * This maps an id of an internal chart dimension or measure & type of a property to its corresponding property entry.
   *
   * @param name ID of internal chart measure or dimension
   * @param kind The kind of property that is used
   * @param mdcChart Reference to the MDC_Chart
   * @returns PropertyInfo object
   */
  ChartDelegate.getPropertyFromNameAndKind = function (name, kind, mdcChart) {
    return mdcChart.getPropertyHelper().getProperty("_fe_" + kind + "_" + name);
  };

  /**
   * Provide the chart's filter delegate to provide basic filter functionality such as adding FilterFields.
   *
   * @returns Object for the personalization of the chart filter
   */
  ChartDelegate.getFilterDelegate = function () {
    return Object.assign({
      apiVersion: 2
    }, FilterBarDelegate, {
      addItem: function (oParentControl, sPropertyInfoName) {
        const prop = ChartDelegate.getInternalChartNameFromPropertyNameAndKind(sPropertyInfoName, "groupable");
        return FilterBarDelegate.addItem(oParentControl, prop).then(oFilterItem => {
          oFilterItem === null || oFilterItem === void 0 ? void 0 : oFilterItem.bindProperty("conditions", {
            path: "$filters>/conditions/" + sPropertyInfoName
          });
          return oFilterItem;
        });
      }
    });
  };
  return ChartDelegate;
}, false);
