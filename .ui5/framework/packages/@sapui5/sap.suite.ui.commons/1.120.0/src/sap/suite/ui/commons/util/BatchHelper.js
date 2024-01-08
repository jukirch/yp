sap.ui.define([
    "sap/ui/base/Object"
], function (BaseObject) {
    "use strict";

    const BatchHelper = BaseObject.extend("ux.eng.s4producthomes1.utils.BatchHelper", {});

    /**
     * Creates a MultiPartRequest object.
     *
     * @param {string} url - The URL for the multipart request.
     * @returns {Object} - MultiPartRequest object.
     * @constructor
     */
    function MultiPartRequest(url) {
        this.url = encodeURI(url);
        this.options = {};
        this.batchRequests = [];
        this.boundary = "batch_id_" + Date.now() + "_01";
        this.options.headers = {};
        this.options.method = "GET";
        this.options.headers["content-type"] = "multipart/mixed;boundary=" + this.boundary;
        return this;
    }

    /**
     * Adds a request to the MultiPartRequest batch.
     *
     * @param {Object} request - The request to add to the batch.
     */
    MultiPartRequest.prototype.addRequest = function (request) {
        this.batchRequests.push(request);
    };

    /**
     * Constructs the body for the multipart request.
     *
     * @returns {string} - The constructed body.
     * @private
     */
    MultiPartRequest.prototype._constructBody = function () {
        const BOUNDARY = "--" + this.boundary;
        const NEW_LINE = "\r\n";
        const REQUEST_HEADERS = "Content-Type: application/http" + NEW_LINE
            + "Content-Transfer-Encoding: binary" + NEW_LINE;

        let body = BOUNDARY + NEW_LINE;

        for (let iIndex = 0; iIndex < this.batchRequests.length; iIndex++) {
            const request = this.batchRequests[iIndex];
            body += REQUEST_HEADERS + NEW_LINE;
            body += request.options.method + " " + request.url + " HTTP/1.1 " + NEW_LINE;
            body += "Accept: application/json" + NEW_LINE + NEW_LINE + NEW_LINE;
            body += BOUNDARY;
            body += iIndex === (this.batchRequests.length - 1) ? "--" + NEW_LINE : NEW_LINE;
        }

        return body;
    };

    /**
     * Parses multipart body response and returns an array of values called in the batch request.
     *
     * @param {string} value - Multipart body response.
     * @returns {Object[]} - Array of values in the multipart request.
     * @returns {Object[]} - An array of values in the multipart request.
     */
    function getDataFromRawValue(value) {
        const finalData = [];
        const newArray = [];
        let parsedValue = [];
        try {
            parsedValue = value.split("\r\n");
        } catch (error) {
            throw new Error();
        }
        // Removing empty lines
        parsedValue.forEach(function (data) {
            if (data !== "") {
                newArray.push(data);
            }
        });
        let contentTypeValue = '';
        for (let index = 1; index < newArray.length - 1; index++) {
            contentTypeValue = newArray[index].includes("Content-Type: ") ? newArray[index].split("Content-Type: ")[1] : contentTypeValue;
            if (newArray[index + 1].includes(newArray[0])) {
                if (contentTypeValue === "application/json") {
                    newArray[index] = JSON.parse(newArray[index]);
                    finalData.push(newArray[index]);
                } else {
                    finalData.push(newArray[index]);
                }
            }
        }
        return finalData;
    }

    /**
     * Creates a multipart batch request with multiple URLs.
     *
     * @param {string} batchUrl - The URL for the batch request.
     * @param {string[]} urls - An array of URLs for individual requests.
     * @returns {Promise} - A promise that resolves to the data from the batch request.
     */
    BatchHelper.createMultipartRequest = async function (batchUrl, urls) {
        this.url = batchUrl;
        this.batchRequests = [];
        let request;
        for (let urlIndex = 0; urlIndex < urls.length; urlIndex++) {
            const url = urls[urlIndex];
            const multRequest = new MultiPartRequest(url);
            if (!request) {
                request = multRequest;
            }
            request.addRequest(multRequest);
        }
        return await this.fetchData(request);
    };

    /**
     * Fetches data from the multipart batch request.
     *
     * @param {Object} multiPartRequest - The MultiPartRequest object.
     * @returns {Promise} - A promise that resolves to the data from the batch request.
     */
    BatchHelper.fetchData = async function (multiPartRequest) {
        multiPartRequest.options.body = multiPartRequest._constructBody();
        multiPartRequest.options.method = "POST";
        const response = await fetch(this.url, multiPartRequest.options);
        if (!response.ok) {
            throw new Error();
        }
        const text = await response.text();
        return getDataFromRawValue(text);
    };

    return BatchHelper;
});
