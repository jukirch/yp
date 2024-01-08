// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
sap.ui.define([
    "./UserRecentsBase",
    "sap/base/Log",
    "sap/ushell/utils"
], function (UserRecentsBase, Log, utils) {
    "use strict";

    /**
     * User action collector counter of user usage of applications according to the URL hash.
     *
     * @class
     * @private
     */
    var RecentAppsUsage = UserRecentsBase.extend("sap.ushell.services.RecentAppsUsage", {
        constructor: function () {
            UserRecentsBase.call(this, "AppsUsage");
        }
    });

    RecentAppsUsage.MAX_DAYS = 30; // Number of days to be considered "recent"

    /**
     * Initialization of RecentAppsUsage.
     * Called from shell.controller's <code>init</code> function
     *   - Loads user personalized data
     *   - Defines a new day is the data structure, if needed
     *   - Cleans empty hash usage arrays
     *
     * @private
     */
    RecentAppsUsage.prototype.init = function () {
        return new Promise((resolve, reject) => {
            const sCurrentDay = this.getDayFromDateObj(new Date());
            let bDataLoadedTriggered = false;

            // Personalized data not loaded yet
            if (!bDataLoadedTriggered || sCurrentDay !== this.oAppsUsageData.recentDay) {
                bDataLoadedTriggered = true;

                // Load data
                this._load()
                    .then(data => {
                        // Initialize structure from the loaded data, or define new
                        this.oAppsUsageData = data || {
                            recentDay: null,
                            recentAppsUsageMap: {}
                        };

                        // Update usage
                        this.calculateInitialUsage(sCurrentDay);
                        resolve(this.oAppsUsageData);
                    })
                    .catch(() => {
                        Log.error("UShell-lib ; RecentAppsUsage ; Load data in Init failed");
                        reject();
                    });
            }
        });
    };

    /**
     * @private
     * @param {string} currentDay The current day in the format YYYY/mm/dd.
     */
    RecentAppsUsage.prototype.calculateInitialUsage = function (currentDay) {
        // If the current day is different than the recent one -
        // add a new entry (for the current day's usage) to each hash usage array
        if (currentDay !== this.oAppsUsageData.recentDay) {
            this.addNewDay();
            this.oAppsUsageData.recentDay = currentDay;

            // Remove hash entries that weren't touched lately
            // postpone to not delay main flow
            setTimeout(function () {
                this.cleanUnusedHashes();
            }.bind(this), 3000);

            // Save the data after the "new day" routine
            this.saveAppsUsage(this.oAppsUsageData);
        }
    };

    /**
     * Records applications usage according to URL hashes
     *   - Check hash validity
     *   - Gets the relevant hash usage array
     *   - Add this usage (increment the value) or create a new array if needed
     *   - Save the data structure
     *
     * @param {string} hash The hash of the application for which a usage should be registered.
     * @private
     */
    RecentAppsUsage.prototype.addAppUsage = function (hash) {
        // Check hash validity
        if (!utils.validHash(hash)) {
            return Promise.reject("Non valid hash");
        }

        return this.init()
            .then(() => {
                // Get the data (usage per day) for the given hash
                const aAppUsageArray = this.oAppsUsageData.recentAppsUsageMap[hash] || [];

                // New app that wasn't opened so far. Insert "1" since this is the first time it is opened
                if (aAppUsageArray.length === 0) {
                    aAppUsageArray[0] = 1;
                } else {
                    // Increment the existing counter of this day for this hash (i.e. the last entry in the array)
                    aAppUsageArray[aAppUsageArray.length - 1] += 1;
                }
                this.oAppsUsageData.recentAppsUsageMap[hash] = aAppUsageArray;
                this.saveAppsUsage(this.oAppsUsageData);
            })
            .catch(() => {
                Log.error("Ushell-lib ; addAppUsage ; Initialization falied!");
            });
    };

    /**
     * Summarises and returns the usage per hash and the minimum and maximum values
     */
    RecentAppsUsage.prototype.getAppsUsage = function () {
        return new Promise((resolve, reject) => {
            this.init()
                .then(() => {
                    resolve(this.summarizeUsage());
                })
                .catch(() => {
                    reject("Not initialized yet");
                });
        });
    };

    RecentAppsUsage.prototype.summarizeUsage = function () {
        var usageMap = {};
        var maxUsage,
            minUsage;
        var firstHashUsage = true;

        for (var hash in this.oAppsUsageData.recentAppsUsageMap) {
            usageMap[hash] = this.getHashUsageSum(hash);
            if (firstHashUsage) {
                maxUsage = minUsage = usageMap[hash];
                firstHashUsage = false;
            } else if (usageMap[hash] < minUsage) {
                minUsage = usageMap[hash];
            } else if (usageMap[hash] > maxUsage) {
                maxUsage = usageMap[hash];
            }
        }
        return { usageMap: usageMap, maxUsage: maxUsage, minUsage: minUsage };
    };

    RecentAppsUsage.prototype.addNewDay = function () {
        var aAppUsageArray;
        for (var hash in this.oAppsUsageData.recentAppsUsageMap) {
            // Get the array of app/hash usage
            aAppUsageArray = this.oAppsUsageData.recentAppsUsageMap[hash];

            // Add an item in the Array for the new day
            aAppUsageArray[aAppUsageArray.length] = 0;

            // If the array size is > iMaximumDays, remove the first (oldest) entry
            if (aAppUsageArray.length > RecentAppsUsage.MAX_DAYS) {
                aAppUsageArray = aAppUsageArray.shift();
            }
        }
    };

    RecentAppsUsage.prototype.cleanUnusedHashes = function () {
        var iUsages;

        for (var hash in this.oAppsUsageData.recentAppsUsageMap) {
            iUsages = this.getHashUsageSum(hash);

            if (iUsages === 0) {
                delete (this.oAppsUsageData.recentAppsUsageMap[hash]);
            }
        }
    };

    RecentAppsUsage.prototype.getHashUsageSum = function (hash) {
        var sum = 0;
        var dayIndex;
        var appUsageArray = this.oAppsUsageData.recentAppsUsageMap[hash];
        var length = appUsageArray.length;

        for (dayIndex = 0; dayIndex < length; dayIndex++) {
            sum += appUsageArray[dayIndex];
        }
        return sum;
    };

    RecentAppsUsage.prototype.saveAppsUsage = function (obj) {
        return this._save(obj)
            .catch(() => {
                Log.error("Ushell-lib ; saveAppsUsage ; Save action failed");
            });
    };

    RecentAppsUsage.prototype.getDayFromDateObj = function (dateObj) {
        return (dateObj.getUTCFullYear() + "/" + (dateObj.getUTCMonth() + 1) + "/" + dateObj.getUTCDate());
    };

    return RecentAppsUsage;
});
