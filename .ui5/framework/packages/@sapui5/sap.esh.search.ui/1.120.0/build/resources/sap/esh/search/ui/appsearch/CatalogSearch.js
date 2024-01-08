/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
function _await(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }
  if (!value || !value.then) {
    value = Promise.resolve(value);
  }
  return then ? value.then(then) : value;
}
function _catch(body, recover) {
  try {
    var result = body();
  } catch (e) {
    return recover(e);
  }
  if (result && result.then) {
    return result.then(void 0, recover);
  }
  return result;
}
sap.ui.define(["../error/ErrorHandler", "sap/ui/Device", "./JsSearchFactory", "sap/base/Log", "../error/errors", "../SearchModel"], function (__ErrorHandler, device, __jsSearchFactory, Log, ___error_errors, __SearchModel) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  function _typeof(obj) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, _typeof(obj);
  }
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
  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  /*!
   * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	
   */
  var ErrorHandler = _interopRequireDefault(__ErrorHandler);
  // TODO
  var jsSearchFactory = _interopRequireDefault(__jsSearchFactory);
  var AppSearchError = ___error_errors["AppSearchError"];
  var ESHUIError = ___error_errors["ESHUIError"];
  var SearchModel = _interopRequireDefault(__SearchModel);
  var CatalogSearch = /*#__PURE__*/function () {
    function CatalogSearch() {
      _classCallCheck(this, CatalogSearch);
      _defineProperty(this, "logger", Log.getLogger("sap.esh.search.ui.appsearch.catalogsearch"));
      this.errorHandler = new ErrorHandler({
        model: SearchModel.getModelSingleton({}, "flp")
      });
      this.initPromise = this.initAsync();
    }
    _createClass(CatalogSearch, [{
      key: "initAsync",
      value: function initAsync() {
        try {
          const _this = this;
          // check cached promise
          if (_this.initPromise) {
            return _await(_this.initPromise);
          }
          return _await(_catch(function () {
            return _await(window.sap.ushell.Container.getServiceAsync("SearchableContent"), function (searchService) {
              return _await(searchService.getApps(), function (flpApps) {
                // format
                var apps = _this.formatApps(flpApps);
                _this.logger.debug("Adding ".concat(apps.length, " flp apps to the search index"));

                // decide whether jsSearch should do normalization
                var shouldNormalize = true;
                var isIE = device && device.browser && device.browser.msie || false;
                if (!String.prototype.normalize || isIE) {
                  shouldNormalize = false;
                }

                // create js search engine
                _this.searchEngine = jsSearchFactory.createJsSearch({
                  objects: apps,
                  fields: ["title", "subtitle", "keywords"],
                  shouldNormalize: shouldNormalize,
                  algorithm: {
                    id: "contains-ranked",
                    options: [50, 49, 40, 39, 5, 4, 51]
                  }
                });
              });
            });
          }, function (error) {
            var flpError = new ESHUIError("FLP SearchableContent Service Failed - App Search won't be available.");
            flpError.previous = error;
            throw flpError;
          }));
        } catch (e) {
          return Promise.reject(e);
        }
      }
    }, {
      key: "formatApps",
      value: function formatApps(apps) {
        var resultApps = [];
        apps.forEach(function (app) {
          app.visualizations.forEach(function (vis) {
            var label = vis.title;
            if (vis.subtitle) {
              label = label + " - " + vis.subtitle;
            }
            resultApps.push({
              title: vis.title || "",
              subtitle: vis.subtitle || "",
              keywords: vis.keywords ? vis.keywords.join(" ") : "",
              icon: vis.icon || "",
              label: label,
              visualization: vis,
              url: vis.targetURL
            });
          });
        });
        return resultApps;
      }
    }, {
      key: "prefetch",
      value: function prefetch() {
        // empty
      }
    }, {
      key: "search",
      value: function search(query) {
        try {
          const _this2 = this;
          return _await(_catch(function () {
            return _await(_this2.initAsync(), function () {
              // use js search for searching
              var searchResults = _this2.searchEngine.search({
                searchFor: query.searchTerm,
                top: query.top,
                skip: query.skip
              });

              // convert to result structure
              var items = [];
              for (var i = 0; i < searchResults.results.length; ++i) {
                var result = searchResults.results[i];
                var formattedResult = Object.assign({}, result.object);
                var highlightedLabel = formattedResult.title;
                var hasHighlightedSubtitle = false;
                if (_typeof(result.highlighted) === "object" && result.highlighted) {
                  if ("title" in result.highlighted && typeof result.highlighted.title === "string") {
                    highlightedLabel = result.highlighted.title;
                  }
                  if ("subtitle" in result.highlighted && typeof result.highlighted.subtitle === "string") {
                    highlightedLabel = highlightedLabel + " - " + result.highlighted.subtitle;
                    hasHighlightedSubtitle = true;
                  }
                }
                if (!hasHighlightedSubtitle && formattedResult.subtitle) {
                  highlightedLabel = highlightedLabel + " - " + formattedResult.subtitle;
                }
                formattedResult.label = highlightedLabel;
                items.push(formattedResult);
              }

              // return search result
              return {
                totalCount: searchResults.totalCount,
                tiles: items
              };
            });
          }, function (error) {
            var appSearchError = new AppSearchError(error);
            appSearchError.previous = error;
            _this2.errorHandler.onError(appSearchError);
            return {
              totalCount: 0,
              tiles: []
            };
          }));
        } catch (e) {
          return Promise.reject(e);
        }
      }
    }]);
    return CatalogSearch;
  }();
  return CatalogSearch;
});
})();