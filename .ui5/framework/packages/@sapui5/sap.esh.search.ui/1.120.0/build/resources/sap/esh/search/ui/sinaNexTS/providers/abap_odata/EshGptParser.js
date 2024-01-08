/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define([], function () {
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }
  /*!
   * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	
   */
  var EshGptParser = /*#__PURE__*/function () {
    function EshGptParser(provider) {
      _classCallCheck(this, EshGptParser);
      this.provider = provider;
      this.sina = provider.sina;
    }
    _createClass(EshGptParser, [{
      key: "getActiveResult",
      value: function getActiveResult(results) {
        for (var i = 0; i < results.length; ++i) {
          var result = results[i];
          if (result.IsCurrentQuery) {
            return result;
          }
        }
        return null;
      }
    }, {
      key: "parse",
      value: function parse(response) {
        var _response$headers, _response$headers2;
        // default result
        var nlqResult = {
          success: false,
          description: ""
        };
        var chatGptResponse = (response === null || response === void 0 ? void 0 : (_response$headers = response.headers) === null || _response$headers === void 0 ? void 0 : _response$headers["Chatgptresponse"]) || (response === null || response === void 0 ? void 0 : (_response$headers2 = response.headers) === null || _response$headers2 === void 0 ? void 0 : _response$headers2["chatgptresponse"]);
        if (chatGptResponse) {
          nlqResult.success = true;
          try {
            nlqResult.description = JSON.stringify(JSON.parse(chatGptResponse), null, 4);
          } catch (e) {
            nlqResult.description = chatGptResponse;
          }
          chatGptResponse;
        }
        return nlqResult;
      }
    }]);
    return EshGptParser;
  }();
  var __exports = {
    __esModule: true
  };
  __exports.EshGptParser = EshGptParser;
  return __exports;
});
})();