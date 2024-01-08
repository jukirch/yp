/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define(["sap/base/util/isPlainObject"], function (isPlainObject) {
    "use strict";

    // static variables
    var ovpUtils = {
        bCRTLPressed: false
    };

    // constants
    ovpUtils.constants = {
        explace: "explace",
        inplace: "inplace"
    };
    ovpUtils.Annotations = {
        dataPoint: "dataPoint",
        title: "title",
        subTitle: "subtitle",
        valueSelectionInfo: "value Selection Info",
        listFlavor: "listFlavor"
    };
    ovpUtils.Layers = {
        vendor: "VENDOR",
        customer: "CUSTOMER",
        customer_base: "CUSTOMER_BASE"
    };
    ovpUtils.loadingState = {
        ERROR: "Error",
        LOADING: "Loading",
        GLOBALFILTERFILLED: false
    };

    // Copy of jQuery.extend method, the merge method provided by UI5 library ignores undefined values that is causing navigation issues in the application
    ovpUtils.merge = function () {
        var options, name, src, copy, copyIsArray, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;

        // Handle a deep copy situation
        if (typeof target === "boolean") {
            deep = target;
            target = arguments[1] || {};
            // skip the boolean and the target
            i = 2;
        }

        // Handle case when target is a string or something (possible in deep copy)
        if (typeof target !== "object" && typeof target !== "function") {
            target = {};
        }

        if (length === i) {
            target = this;
            --i;
        }

        for (; i < length; i++) {
            // Only deal with non-null/undefined values
            if ((options = arguments[i]) == null) {
                continue;
            }
            // Extend the base object
            for (name in options) {
                src = target[name];
                copy = options[name];
                // Prevent never-ending loop
                if (target === copy) {
                    continue;
                }
                // Recurse if we're merging plain objects or arrays
                if (deep && copy && (isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
                    if (copyIsArray) {
                        copyIsArray = false;
                        clone = src && Array.isArray(src) ? src : [];

                    } else {
                        clone = src && isPlainObject(src) ? src : {};
                    }

                    // Never move original objects, clone them
                    target[name] = this.merge(deep, clone, copy);

                    // Don't bring in undefined values
                } else if (copy !== undefined) {
                    target[name] = copy;
                }
            }
        }

        // Return the modified object
        return target;
    };

    return ovpUtils;

}, /* bExport= */ true);
