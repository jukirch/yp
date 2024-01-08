/* eslint-disable no-console */
/* eslint-disable no-undef */
// eslint-disable-next-line no-undef
sap.ui.define([], function () {
	"use strict";

	// eslint-disable-next-line no-restricted-globals
	var uri = location.origin + location.pathname;

	var oGraphApiConfig = {
		msalConfig: {
			auth: {
				clientId: "",
				authority: "",
				redirectUri: uri
			},
			cache: {
				cacheLocation: "sessionStorage", // This configures where your cache will be stored
				storeAuthStateInCookie: false // Set this to "true" if you are having issues on IE11 or Edge
			},
			system: {
				loggerOptions: {
					loggerCallback: function (level, message, containsPii) {
						if (containsPii) {
							return;
						}
						switch (level) {
							// eslint-disable-next-line no-undef
							case msal.LogLevel.Error:
								// eslint-disable-next-line no-console
								console.error(message);
								return;
							// eslint-disable-next-line no-undef
							case msal.LogLevel.Info:
								// eslint-disable-next-line no-console
								console.info(message);
								return;
							// eslint-disable-next-line no-undef
							case msal.LogLevel.Verbose:
								// eslint-disable-next-line no-console
								console.debug(message);
								return;
							// eslint-disable-next-line no-undef
							case msal.LogLevel.Warning:
								// eslint-disable-next-line no-console
								console.warn(message);
								return;
							default:
								break;
						}
					}
				}
			}
		},
		loginRequest: {
			scopes: ["User.Read", "User.Read.All", "Presence.Read.All", "Chat.Create", "Chat.ReadWrite"]
		},
		graphApiEndpoints: {
			graphUserEndpoint: "https://graph.microsoft.com/v1.0/users"
		}
	};

	return {
		getConfig: function (oProviderConfig) {
			if (oProviderConfig && !Object.keys(oProviderConfig).length) {
				return;
			}
			oGraphApiConfig.msalConfig.auth.clientId = oProviderConfig.applicationId;
			oGraphApiConfig.msalConfig.auth.authority = oProviderConfig.tenantId;
			// oGraphApiConfig.msalConfig.auth.clientId = "757953cf-7d8e-4586-a375-050c6f21b1b6";
			// oGraphApiConfig.msalConfig.auth.authority = "https://login.microsoftonline.com/1b0f7603-f987-4314-a473-7ae253c7569a";
			return oGraphApiConfig;
		}
	};
});
