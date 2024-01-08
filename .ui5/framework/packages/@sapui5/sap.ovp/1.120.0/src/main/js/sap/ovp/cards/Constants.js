/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([], function() {
    'use strict';

    return {
        ItemLength: {
            List_condensed: {
                phone: 5,
                tablet: 5,
                desktop: 5
            },
            List_extended: {
                phone: 3,
                tablet: 3,
                desktop: 3
            },
            List_condensed_bar: {
                phone: 5,
                tablet: 5,
                desktop: 5
            },
            List_extended_bar: {
                phone: 3,
                tablet: 3,
                desktop: 3
            },
            Table: {
                phone: 5,
                tablet: 5,
                desktop: 5
            },
            Stack_simple: {
                phone: 20,
                tablet: 20,
                desktop: 20
            },
            Stack_complex: {
                phone: 5,
                tablet: 5,
                desktop: 5
            }
        },
        Criticality:  {
            StateValues: {
                None: "None",
                Negative: "Error",
                Critical: "Warning",
                Positive: "Success"
            },
            ColorValues: {
                None: "Neutral",
                Negative: "Error",
                Critical: "Critical",
                Positive: "Good"
            }
        },
        /* All constants for analytical card error messages feature here */
        errorMessages : {
            CARD_WARNING: "OVP-AC: Analytic card: Warning: ",
            CARD_ERROR: "OVP-AC: Analytic card Error: ",
            DATA_ANNO_ERROR: "OVP-AC: Analytic card Error:",
            CARD_ANNO_ERROR: "OVP-AC: Analytic card: Error ",
            CHART_ANNO_ERROR: "OVP-AC: Analytic card: Error ",
            INVALID_CHART_ANNO: "OVP-AC: Analytic Cards: Invalid Chart Annotation.",
            ANALYTICAL_CONFIG_ERROR: "Analytic card configuration error",
            CACHING_ERROR: "no model defined while caching OdataMetaData",
            INVALID_MAXITEMS: "maxItems is Invalid. ",
            NO_DATASET: "OVP-AC: Analytic Cards: Could not obtain dataset.",
            SORTORDER_WARNING: "SortOrder is present in PresentationVariant, but it is empty or not well formed.",
            BOOLEAN_ERROR: "Boolean value is not present in PresentationVariant.",
            IS_MANDATORY: "is mandatory.",
            IS_MISSING: "is missing.",
            NOT_WELL_FORMED: "is not found or not well formed)",
            MISSING_CHARTTYPE: "Missing ChartType in ",
            CHART_ANNO: "Chart Annotation.",
            DATA_ANNO: "Data Annotation",
            CARD_ANNO: "card annotation.",
            CARD_CONFIG: "card configuration.",
            CARD_CONFIG_ERROR: "Could not obtain configuration for ",
            CARD_CONTAINER_ERROR: "Could not obtain card container. ",
            DATA_UNAVAIALABLE: "No data available.",
            CONFIG_LOAD_ERROR: "Failed to load config.json. Reason: ",
            INVALID_CHARTTYPE: "Invalid ChartType given for ",
            INVALID_CONFIG: "No valid configuration given for ",
            CONFIG_JSON: "in config.json",
            ENTER_INTEGER: "Please enter an Integer.",
            NO_CARD_MODEL: "Could not obtain Cards model.",
            ANNO_REF: "com.sap.vocabularies.UI.v1 annotation.",
            INVALID_REDUNDANT: "Invalid/redundant role configured for ",
            CHART_IS: "chart is/are ",
            CARD_CONFIG_JSON: "card from config.json",
            ALLOWED_ROLES: "Allowed role(s) for ",
            DIMENSIONS_MANDATORY: "DimensionAttributes are mandatory.",
            MEASURES_MANDATORY: "MeasureAttributes are mandatory.",
            CARD_LEAST: "card: Enter at least ",
            CARD_MOST: "card: Enter at most ",
            FEEDS: "feed(s).",
            MIN_FEEDS: "Minimum number of feeds required for ",
            FEEDS_OBTAINED: "card is not configured. Obtained ",
            FEEDS_REQUIRED: "feed(s), Required: ",
            INVALID_SEMANTIC_MEASURES: "More than one measure is being semantically coloured",
            INVALID_IMPROVEMENT_DIR: "No Improvement Direction Found",
            INVALID_CRITICALITY: "Invalid criticality values",
            INVALID_DIMMEAS: "Invalid number of Measures or Dimensions",
            INVALID_FORECAST: "Invalid/Redundant Datapoint or Forecast measure",
            INVALID_TARGET: "Invalid/Redundant Datapoint or Target measure",
            ERROR_MISSING_AXISSCALES: "Minimum and Maximum values are mandatory for AxisScale MinMax to work"
        },
         /* All constants feature here */
        Annotations : {
            LABEL_KEY: "sap:label",
            LABEL_KEY_V4: "com.sap.vocabularies.Common.v1.Label", //as part of supporting V4 annotation
            TEXT_KEY: "sap:text",
            TEXT_KEY_V4: "com.sap.vocabularies.Common.v1.Text", //as part of supporting V4 annotation
            TEXT_ARRANGEMENT_ANNO: "com.sap.vocabularies.UI.v1.TextArrangement",
            TYPE_KEY: "type",
            DISPLAY_FORMAT_KEY: "sap:display-format",
            SEMANTICS_KEY: "sap:semantics",
            UNIT_KEY: "sap:unit",
            UNIT_KEY_V4_ISOCurrency: "Org.OData.Measures.V1.ISOCurrency", //as part of supporting V4 annotation
            UNIT_KEY_V4_Unit: "Org.OData.Measures.V1.Unit", //as part of supporting V4 annotation
            CURRENCY_CODE: "currency-code",
            NAME_KEY: "name",
            NAME_CAP_KEY: "Name",
            EDM_TYPE: "type",
            EDM_INT32: "Edm.Int32",
            EDM_INT64: "Edm.Int64",
            SCATTER_CHARTTYPE: "com.sap.vocabularies.UI.v1.ChartType/Scatter",
            BUBBLE_CHARTTYPE: "com.sap.vocabularies.UI.v1.ChartType/Bubble",
            LINE_CHARTTYPE: "com.sap.vocabularies.UI.v1.ChartType/Line",
            COLUMNSTACKED_CHARTTYPE: "com.sap.vocabularies.UI.v1.ChartType/ColumnStacked",
            VERTICALBULLET_CHARTTYPE: "com.sap.vocabularies.UI.v1.ChartType/VerticalBullet",
            COLUMN_CHARTTYPE: "com.sap.vocabularies.UI.v1.ChartType/Column",
            BAR_CHARTTYPE: "com.sap.vocabularies.UI.v1.ChartType/Bar",
            COMBINATION_CHARTTYPE: "com.sap.vocabularies.UI.v1.ChartType/Combination",
            DONUT_CHARTTYPE: "com.sap.vocabularies.UI.v1.ChartType/Donut"
        }
    };
});