//Copyright (c) 2009-2023 SAP SE, All Rights Reserved
/**
 * @fileOverview this module mocks jQuery.Deferred but returns a native Promise
 */

sap.ui.define([], function () {
    "use strict";

    /**
     * A deferred object that creates a native promise and manages its state.
     * The promise is resolved by resolve and reject methods of the deferred object.
     * The resulting native promise has additional proxy methods done, fail, always, and state attached.
     * The class does not replace jQuery.Deferred.
     * @since 1.120.0
     * @private
     */
    class Deferred {

        #promise = null;
        #resolve = null;
        #reject = null;

        /**
         * Creates a Deferred object
         */
        constructor () {
            let _resolve;
            let _reject;
            const promise = new Promise((resolve, reject) => {
                _resolve = resolve;
                _reject = reject;
            });
            this.#resolve = _resolve.bind(promise);
            this.#reject = _reject.bind(promise);

            promise._state = "pending";

            promise.done = (args) => {
                promise.then(args);
                return promise;
            };
            promise.fail = (args) => {
                promise.catch(args);
                return promise;
            };
            promise.always = (args) => {
                promise.finally(args);
                return promise;
            };
            promise.state = () => promise._state;
            this.#promise = promise;
        }

        /**
         * Sets the Promise object into resolved state.
         * @param {any} args return value of the promise.
         * @returns {Promise} the promise object
         */
        resolve (args) {
            this.#promise._state = "resolved";
            this.#resolve(args);
            return this.#promise;
        }

        /**
         * Sets the Promise object into rejected state.
         * @param {any} args reject value of the promise.
         * @returns {Promise} the promise object
         * @public
         */
        reject (args) {
            this.#promise._state = "rejected";
            this.#reject(args);
            return this.#promise;
        }

        /**
         * Returns the Promise object.
         *
         * Methods then, catch and finally of the promise can be also accessed via done, fail and always aliaces like in jQuery.Deferred.
         * @returns {Promise} the promise object
         */
        promise () {
            return this.#promise;
        }
    }
    return Deferred;
});
