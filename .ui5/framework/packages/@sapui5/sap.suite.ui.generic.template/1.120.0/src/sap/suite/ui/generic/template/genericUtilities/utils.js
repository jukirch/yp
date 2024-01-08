// This static class contains generic utilities which do not find into any of the specialized helper utility classes
sap.ui.define([], function() {
	"use strict";

		// If images are included in the UI app they need to specify the path relatively (e.g. images/image.jpg) to support
		// different platforms like ABAP and HCP. The relative path has to be used because the absolute paths differ from platform
		// to platform. The rule is if the image url doesn't start with a / or sap-icon:// or http(s):// then it's a relative url and the absolute
		// path has to be added by the framework. This path can be retrieved with sap.ui.require.toUrl and the component name.
		function fnAdjustImageUrlPath(sImageUrl, sAppComponentName, bSuppressIcons) {
			if (!sImageUrl) {
				return "";
			}
			var bIsIcon = sImageUrl.startsWith("sap-icon://");
			if (bSuppressIcons && bIsIcon) {
				return "";
			}
			if (bIsIcon || sImageUrl.startsWith("/") || sImageUrl.startsWith("http://") || sImageUrl.startsWith("https://")) {
				return sImageUrl; // Absolute URL, nothing has to be changed
			} 
			// Relative URL, has to be adjusted
			return sap.ui.require.toUrl(sAppComponentName.replace(/\./g, "/")) + "/" + sImageUrl; //replacing dots by slashes before calling sap.ui.require.toUrl method. com.xyz.abc to com/xyz/abc
		}

	return {
		adjustImageUrlPath: fnAdjustImageUrlPath
	};
});
