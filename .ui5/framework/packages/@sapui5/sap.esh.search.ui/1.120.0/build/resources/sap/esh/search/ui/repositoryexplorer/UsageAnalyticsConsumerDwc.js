/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
// import UsageAnalyticsConsumer from "sap/esh/search/ui/eventlogging/UsageAnalyticsConsumer";

// export default class UsageAnalyticsConsumerDwc extends UsageAnalyticsConsumer {
//     // =======================================================================
//     //  Usage Analytics Event Consumer --- DWC
//     // =======================================================================

//     analytics: any; // dummy

//     public init(properties: any): void {
//         if (typeof properties.usageCollectionService === "object") {
//             // see DWC, ShellUsageCollectionService.ts / ShellContainer.SERVICES.usageCollection
//             const analyticsService = {
//                 logCustomEvent: function (what, where, eventList) {
//                     properties.usageCollectionService?.recordAction({
//                         action: `${what} --- ${where}`,
//                         feature: "repositoryexplorer", // see DWCFeature
//                         eventtype: "click", // see EventType
//                         options: [
//                             {
//                                 param: "eventList",
//                                 value: eventList.toString(),
//                             },
//                         ],
//                     });
//                 },
//             };
//             this.analytics = analyticsService;
//             this.actionPrefix = "Search UI: ";
//         }
//     }
// }
})();