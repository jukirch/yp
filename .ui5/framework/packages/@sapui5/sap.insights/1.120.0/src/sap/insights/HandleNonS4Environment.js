/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 * This code handles S/4 cards in SAP Start and SAP Mobile Start
 */
sap.ui.define(
	["sap/ushell/utils/UrlParsing", "sap/base/Log", "sap/ui/core/Configuration"
],
	function (UrlParsing, Log, Configuration) {
		"use strict";

		var sS4DestinationNameAlias = "(runtimeURL)";
		var sSAPLanguage = Configuration.getSAPLogonLanguage();

		/**
		 * Creates an xapp-state guid
		 *
		 * @returns {string} GUID
		 */
		var createAppStateId = function () {
			// copied from sap/ushell/utils
			var sChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
			var sResult = "";
			var aRandomValues = new window.Uint32Array(40);

			window.crypto.getRandomValues(aRandomValues);

			var getRandomAlphaNumeric = function (i) {
				var randomIndex = aRandomValues[i] % sChars.length;
				return sChars[randomIndex];
			};

			while (sResult.length < 40) {
				sResult += getRandomAlphaNumeric(sResult.length);
			}
			return sResult;
		};

		/**
		 * Creates the intent from the given IBN parameter
		 *
		 * @param {object} oParameters IBN parameter
		 * @param {object} sXappStateId XApp State Indentifier
		 * @returns {string} The serialized and encoded intent including '#'
		 */
		var getIntent = function (oParameters, sXappStateId) {
			var oClonedParams = JSON.parse(JSON.stringify(oParameters)),
				targetIntent = "",
				oArgs = {};

			if (oClonedParams.ibnParams && oClonedParams.ibnParams["sap-xapp-state-data"]) {
				delete oClonedParams.ibnParams["sap-xapp-state-data"];
			}

			oArgs = {
				target: oClonedParams.ibnTarget,
				params: oClonedParams.ibnParams
			};

			if (sXappStateId) {
				oArgs.appStateKey = sXappStateId;
			}

			targetIntent = UrlParsing.constructShellHash(oArgs);
			targetIntent = encodeURI(targetIntent);
			targetIntent = "#" + targetIntent;
			return targetIntent;
		};

		/**
		 * Fetches the host url of the S/4 system.
		 *
		 * This function calls the hosts getDestination function with the dedicated
		 * sS4DestinationNameAlias. Every host that shows cards from S/4 must
		 * return the url property for the runtime destination for apps as defined
		 * by the SAP Build Workzone integration scenario SAP_COM_0472.
		 *
		 * @param {sap.ui.integration.widgets.Card} oCard Integration Card Control Instance
		 * @returns {Promise} Promise to URL for S/4
		 */
		var getRuntimeDestinationUrl = function (oCard) {
			var sRuntimeDestinationUrl;
			if (oCard) {
				var oHost = oCard.getHostInstance();
				if (oHost) {
					sRuntimeDestinationUrl = oHost.getDestination(
						sS4DestinationNameAlias,
						oCard
					);
				}
			}
			if (!sRuntimeDestinationUrl) {
				sRuntimeDestinationUrl = Promise.reject("S/4 runtime destination URL could not be determined!");
			}
			return sRuntimeDestinationUrl;
		};

		/**
		 * Adds additional query parameter to the runtime destination url.
		 *
		 * @param {string} sURL URL that needs additional query parameter
		 * @param {object} oCard oCard
		 * @returns {Promise} Rerturns Promise which resolves to URL with additional query parameter
		 */
		var addQueryParameter = async function(sURL, oCard) {
			var sResultUrl = sURL;
			if (sResultUrl.indexOf("?") < 0) {
				sResultUrl += "?";
			} else {
				sResultUrl += "&";
			}
			//add sap-language
			sResultUrl += "sap-language=" + sSAPLanguage;

			/* In SAP Mobile Start, launching S/4 cards should provide the same user experience as other cards
				and will be launched in a headerless shell. Additionally handled considering launch parameters.
			*/
			var defaultNavParameters = oCard ? await oCard.getHostInstance()?.getContextValue("navigation/flp/defaultQueryParams/value") : null;
			if (defaultNavParameters) {
                defaultNavParameters = JSON.parse(defaultNavParameters);
				var parameters = Object.keys(defaultNavParameters);
				if (parameters.length) {
					parameters.forEach(function(sParameter, index) {
						sResultUrl += "&" + sParameter + "=" + defaultNavParameters[sParameter];
					});
				}
			}

			return sResultUrl;
		};

		/**
		 * Remotely saves the sap-xapp-state-data in the S/4 system.
		 *
		 * This is necessary for the navigation resolution of a standalone (not embedded)
		 * launch of the S/4 FLP with an intent and while specifying the corresponding
		 * xapp-state-id.
		 *
		 * @param {object} oCard Card interface for extensions
		 * @param {string} sXAppStateId XApp State Indentifier
		 * @param {string} sXAppStateData Stringified XApp State Data
		 * @returns {void}
		 */
		var saveXAppState = function (oCard, sXAppStateId, sXAppStateData) {
			var oPayload = {
				id: sXAppStateId,
				sessionKey: "",
				component: "",
				appName: "",
				value: sXAppStateData.replaceAll("{", "\\{") // card.request is looking for bindings we need to escape so it is treated as an object
				// see snippix https://snippix.only.sap/#591142
			};

			return oCard
				.request({
					url: "{{destinations.service}}/sap/opu/odata/UI2/INTEROP/GlobalContainers",
					method: "POST",
					parameters: oPayload,
					headers: {
						Accept: "application/json",
						// "Accept-Language": "{{parameters.LOCALE}}",
						"X-CSRF-Token": "{{csrfTokens.token1}}",
						"content-type": "application/json"
					}
				})
				.then(function (oResponseData) {
					return;
				})
				.catch(function (exc) {
					Log.error("FAILED to save sap-xapp-state-data in S/4");
				});
		};

		/**
		 * Event Handler for card action in non S/4 environment.
		 *
		 * This includes SAP Start and SAP Mobile Start.
		 *
		 * @param {object} oEvent Action event for UI Integation Cards
		 */
		var handleAction = async function (oEvent) {
			if (oEvent.getParameter("type") !== "Navigation") {
				return;
			}
			var oCard = this.getCard(); // oCard is the card interface for extensions
			var oActionParams = oEvent.getParameter("parameters");

			if (oActionParams && oActionParams.url) {
				return; // Second time! We leave it to host or card framework now
			}

			var bHasXAppStateData =
				oActionParams &&
				oActionParams.ibnParams &&
				oActionParams.ibnParams["sap-xapp-state-data"];
			var sXappStateId = bHasXAppStateData ? createAppStateId() : "";
			var sIntent = getIntent(oActionParams, sXappStateId);

			if (sIntent) {
				oEvent.preventDefault(true);

				if (bHasXAppStateData) {
					await saveXAppState(
						oCard,
						sXappStateId,
						oActionParams.ibnParams["sap-xapp-state-data"]
					);
				}

				try {
					var sRuntimeDestinationUrl = await getRuntimeDestinationUrl(this._oCard); //_oCard is the card control instance
					if (sRuntimeDestinationUrl) {
					// We only navigate if we have the RuntimeDestination
						var sURL = await addQueryParameter(sRuntimeDestinationUrl, this._oCard);
						sURL += sIntent;
						this.getCard().triggerAction({
							type: "Navigation",
							parameters: {
								url: sURL,
								target: "_blank"
							}
						});
					}
				} catch (e) {
					Log.error(e);
				}
			}
		};
		var initialize = function (oCardExtension) {
			oCardExtension.attachAction(handleAction.bind(oCardExtension));
		};

		return {
			initialize: initialize,
			_: {
				createAppStateId: createAppStateId,
				getIntent: getIntent,
				getRuntimeDestinationUrl: getRuntimeDestinationUrl,
				addQueryParameter: addQueryParameter,
				saveXAppState: saveXAppState,
				handleAction: handleAction
			}
		};
	}
);
