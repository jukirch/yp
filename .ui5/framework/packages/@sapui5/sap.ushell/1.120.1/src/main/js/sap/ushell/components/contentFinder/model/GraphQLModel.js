// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ushell/components/contentFinder/model/GraphQLListBinding"
], function (
    JSONModel,
    GraphQLListBinding
) {
    "use strict";

    return JSONModel.extend("sap.ushell.components.contentFinder.model.GraphQLModel", {
        /**
         * Override to return a custom list binding, which is necessary for the paginated list.
         *
         * @param {string} sPath
         *   The path pointing to the list / array that should be bound
         * @param {sap.ui.model.Context} [oContext]
         *   The context object for this data binding
         * @param {sap.ui.model.Sorter|sap.ui.model.Sorter[]} [aSorters]
         *   Initial sort order (can be either a sorter or an array of sorters)
         * @param {sap.ui.model.Filter|sap.ui.model.Filter[]} [aFilters]
         *   Predefined filter/s (can be either a filter or an array of filters)
         * @param {object} [mParameters]
         *   Additional model-specific parameters
         *
         * @since 1.115.0
         * @returns {sap.ui.model.ListBinding}
         *   The newly created binding
         */
        bindList: function (sPath, oContext, aSorters, aFilters, mParameters) {
            return new GraphQLListBinding(this, sPath, oContext, aSorters, aFilters, mParameters);
        }
    });
});
