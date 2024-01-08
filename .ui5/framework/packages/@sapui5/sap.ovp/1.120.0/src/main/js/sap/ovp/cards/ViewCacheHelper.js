/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ui/core/cache/CacheManager",
    "sap/ui/core/Component",
    "sap/ovp/app/OVPLogger"
], function(CacheManager, Component, OVPLogger) {
    "use strict";

    var oLogger = new OVPLogger("ovp.cards.ViewCacheHelper");

	/**
	 * 
	 * @param {sap.ui.core.mvc.XML} oSrcElement 
	 * @returns {object}
	 */
    function _getRootComponent(oSrcElement) {
		var oComponent;

		while (oSrcElement) {
			var oCandidateComponent = Component.getOwnerComponentFor(oSrcElement);
			if (oCandidateComponent) {
				oSrcElement = oComponent = oCandidateComponent;
			} else {
				if (oSrcElement instanceof Component) {
					oComponent = oSrcElement;
				}
				oSrcElement = oSrcElement.getParent && oSrcElement.getParent();
			}
		}
		return oComponent;
	}

	/**
	 * Create a prefix key for card with view switch
	 * @param {sap.ui.core.mvc.XMLView} oView 
	 * @returns {Promise} returns a prefix for card with view switch
	 */
    function _getCacheKeyPrefix(oView) {
        var oRootComponent = _getRootComponent(oView);
		var sComponentName = oRootComponent && oRootComponent.getMetadata().getName();
		var aCacheKeyParts = [
			sComponentName || window.location.host + window.location.pathname,
			oView.getId().split("_Tab")[0]
		];
		var sCacheKeyPrefix = aCacheKeyParts.join('_');
		return Promise.resolve(sCacheKeyPrefix);
    }

	/**
	 * Delete view cache for a card containing view switch
	 * This method will delete all cache entries for a card including tabbed view caches
	 * @param {sap.ui.core.mvc.XMLView} oView 
	 * @returns {Promise}
	 */
	function fnClearViewCacheForTabbedCard(oView) {
		return _getCacheKeyPrefix(oView).then(function(sKeyPrefix) {
			return CacheManager.delWithFilters({prefix: sKeyPrefix});
		}).catch(function(oError) {
			oLogger.error(oError);
		});            
	}

    return {
        clearViewCacheForTabbedCard: fnClearViewCacheForTabbedCard
    };
});