// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ui/model/json/JSONListBinding"
], function (
    JSONListBinding
) {
    "use strict";

    return JSONListBinding.extend("sap.ushell.components.contentFinder.model.GraphQLListBinding", {
        /**
         * Override to return the totalCount returned by the server.
         * The amount of items in the model will not represent the total count because the data may be paginated.
         *
         * @since 1.115.0
         * @returns {int} The count.
         */
        getLength: function () {
            // Check if filters have been set. this.aFilters might contain an empty aFilters array
            if (this.aFilters && this.aFilters.length > 0 && this.aFilters[0].getFilters().length > 0) {
                return this.iLength;
            }
            return this.getModel().getProperty("/appSearch/totalCount") || 0;
        },

        /**
         * Override to determine the correct return value:
         * The length is final if the amount of items is the same as the totalCount returned by the server.
         *
         * @since 1.115.0
         * @returns {boolean} True if the condition applies.
         */
        isLengthFinal: function () {
            return this.oList.length >= this.getLength();
        }
    });
});
