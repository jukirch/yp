/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
function _createForOfIteratorHelper(o, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
  if (!it) {
    if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
      if (it) o = it;
      var i = 0;
      var F = function F() {};
      return {
        s: F,
        n: function n() {
          if (i >= o.length) return {
            done: true
          };
          return {
            done: false,
            value: o[i++]
          };
        },
        e: function e(_e) {
          throw _e;
        },
        f: F
      };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  var normalCompletion = true,
    didErr = false,
    err;
  return {
    s: function s() {
      it = it.call(o);
    },
    n: function n() {
      var step = it.next();
      normalCompletion = step.done;
      return step;
    },
    e: function e(_e2) {
      didErr = true;
      err = _e2;
    },
    f: function f() {
      try {
        if (!normalCompletion && it["return"] != null) it["return"]();
      } finally {
        if (didErr) throw err;
      }
    }
  };
}
function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }
  return arr2;
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
window.onload = function () {
  sap.ui.loader.config({
    baseUrl: "../../../../../../resources/",
    paths: {
      "sap/esh/search/ui": "/resources/sap/esh/search/ui"
    }
  });
  sap.ui.getCore().attachInit(function () {
    sap.ui.require(["sap/esh/search/ui/SearchCompositeControl", "sap/m/Button", "sap/m/library", "sap/m/OverflowToolbarButton", "sap/m/ToolbarSeparator", "sap/m/MessageBox"], function (SearchCompositeControl, Button, sapmlibrary, OverflowToolbarButton, ToolbarSeparator, MessageBox) {
      var SearchResultSetFormatter /* extends Formatter.Formatter */ = /*#__PURE__*/function () {
        function SearchResultSetFormatter() {
          _classCallCheck(this, SearchResultSetFormatter);
        }
        _createClass(SearchResultSetFormatter, [{
          key: "formatAsync",
          value: function formatAsync(resultSet) {
            var _iterator = _createForOfIteratorHelper(resultSet.items),
              _step;
            try {
              var _loop = function _loop() {
                var item = _step.value;
                if (typeof item.navigationTargets === "undefined") {
                  item.navigationTargets = [];
                }
                // info icon
                var salary = item.detailAttributes.filter(function (attr) {
                  return attr.id === "SALARY";
                });
                if (salary.length > 0) {
                  var salaryAttr = salary[0];
                  if (salaryAttr.value > 2900) {
                    salaryAttr["infoIconUrl"] = "sap-icon://loan";
                    item.titleAttributes.push(salaryAttr);
                  }
                }
                // default navigation
                if (
                // add nav., if there is no (Wikipedia) title link yet
                typeof item.defaultNavigationTarget === "undefined" && typeof item.titleAttributes[0] !== "undefined") {
                  var titleNavigationTarget = resultSet.sina._createNavigationTarget({
                    text: item.titleAttributes[0].valueFormatted,
                    // targetUrl: "...",
                    targetFunction: function targetFunction(event) {
                      // make sure 'event.getSource' is filled
                      if (typeof event !== "undefined" && typeof event.getSource == "function") {
                        MessageBox.information("Default nav. target via 'targetFunction'");
                      } else {
                        MessageBox.error("'event.getSource' n.a.");
                      }
                    }
                  });
                  item.setDefaultNavigationTarget(titleNavigationTarget);
                } else {
                  var _loop2 = function _loop2(i) {
                    item.addNavigationTarget(resultSet.sina._createNavigationTarget({
                      text: "Navigation Target_".concat(i),
                      // targetUrl: "...",
                      targetFunction: function targetFunction() {
                        MessageBox.information("Nav. target via 'targetFunction' (index: ".concat(i, ")"));
                      }
                    }));
                  };
                  // add nav. to result item , if there is a (Wikipedia) title link
                  for (var i = 0; i < 10; i++) {
                    _loop2(i);
                  }
                }
                // attribute navigation
                if (item.attributesMap.LOCATION) {
                  var locationNavigationTarget = resultSet.sina._createNavigationTarget({
                    text: item.attributesMap.LOCATION.valueFormatted,
                    targetFunction: function targetFunction() {
                      MessageBox.information("Attribute nav. target via 'targetFunction' for location '".concat(item.attributesMap.LOCATION.valueFormatted, "'"));
                    }
                  });
                  item.attributesMap.LOCATION.setDefaultNavigationTarget(locationNavigationTarget);
                }
              };
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                _loop();
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
          }
        }]);
        return SearchResultSetFormatter;
      }();
      var eshComp;
      var options = {
        useEshGpt: true,
        enableMultiSelectionResultItems: true,
        // see SearchCompositeControl.ts and SearchConfigurationSettings.ts for available options
        sinaConfiguration: {
          provider: "sample",
          searchResultSetFormatters: [new SearchResultSetFormatter()]
        },
        getCustomToolbar: function getCustomToolbar() {
          return [new OverflowToolbarButton({
            id: "SearchDevGuide",
            text: "Search Dev. Guide",
            tooltip: "SAP HANA Search Developer Guide",
            type: sapmlibrary.ButtonType.Transparent,
            press: function press() {
              return window.open("https://help.sap.com/viewer/691cb949c1034198800afde3e5be6570/2.0.05/en-US/ce86ef2fd97610149eaaaa0244ca4d36.html");
            }
          }), new Button({
            id: "SearchPageHelpSap",
            text: "Search (help.sap)",
            tooltip: "Search and Operational Analytics",
            press: function press() {
              return window.open("https://help.sap.com/viewer/6522d0462aeb4909a79c3462b090ec51/1709%20002/en-US");
            }
          }), new Button({
            id: "ResultStatistics",
            text: "Result Statistics",
            tooltip: "Search Result Statistics",
            press: function press() {
              var resultSet = eshComp.getSearchResultSet();
              MessageBox.information("Number of loaded results: ".concat(resultSet.items.length));
            }
          }), new Button({
            id: "SelectTheRich",
            text: "Select the Rich",
            icon: "sap-icon://loan",
            tooltip: "Select people with high salary",
            press: function press() {
              var resultSet = eshComp.getSearchResultSet();
              var _iterator2 = _createForOfIteratorHelper(resultSet.items),
                _step2;
              try {
                for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                  var resultSetItem = _step2.value;
                  if (resultSetItem.data.attributesMap.SALARY.value > 2900) {
                    resultSetItem.setSelected(true);
                    // resultSetItem.enableSelection(false);
                  }
                }
              } catch (err) {
                _iterator2.e(err);
              } finally {
                _iterator2.f();
              }
            }
          }), new ToolbarSeparator(), new OverflowToolbarButton({
            id: "About",
            icon: "sap-icon://hint",
            text: "About",
            tooltip: "About this Sample UI",
            type: sapmlibrary.ButtonType.Transparent,
            press: function press() {
              return MessageBox.information("This is SAP Search UI, based on UI5 control 'sap.esh.search.ui.SearchCompositeControl' and 'Sample Data Provider'.");
            }
          })];
        }
        /* extendTableColumn: {    // extending columns does not work, needs refactoring
        column: {
            name: "ExtendTableCol",
            attributeId: "EXTEND_TABLE_COL",
            width: "500px",
        },
        // eslint-disable-next-line no-unused-vars
        assembleCell: (data) => {
            const itemId = "EXTEND_TABLE_COL";
            const cell = {
                isExtendTableColumnCell: true,
                itemId: itemId,
            };
            return cell;
        },
        // eslint-disable-next-line no-unused-vars
        bindingFunction: (bindingObject) => {
            new sap.m.Text({ text: "This is cell content of custom column" });
        },
        }, */
      };

      eshComp = new SearchCompositeControl(options);
      window.addEventListener("hashchange", function () {
        eshComp.getModel().parseURL();
      }, false);
      eshComp.placeAt("content");
    });
    document.documentElement.style.overflowY = "auto";
    document.documentElement.style.height = "100%";
  });
};
})();