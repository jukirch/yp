/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/base/Object"], function (BaseObject) {
  "use strict";

  var _exports = {};
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  /**
   * This is the successor of {@link sap.ui.generic.app.navigation.service.NavError}.<br> An object that provides error handling information during runtime.
   *
   * @public
   * @class
   * @param {string} errorCode The code for an internal error of a consumer that allows you to track the source locations
   * @extends sap.ui.base.Object
   * @since 1.83.0
   * @name sap.fe.navigation.NavError
   */
  let NavError = /*#__PURE__*/function (_BaseObject) {
    _inheritsLoose(NavError, _BaseObject);
    /**
     * Constructor requiring the error code as input.
     *
     * @param errorCode String based error code.
     */
    function NavError(errorCode) {
      var _this;
      _this = _BaseObject.call(this) || this;
      _this._sErrorCode = errorCode;
      return _this;
    }

    /**
     * Returns the error code with which the instance has been created.
     *
     * @public
     * @returns {string} The error code of the error
     */
    _exports.NavError = NavError;
    var _proto = NavError.prototype;
    _proto.getErrorCode = function getErrorCode() {
      return this._sErrorCode;
    };
    return NavError;
  }(BaseObject); // Exporting the class as properly typed UI5Class
  _exports.NavError = NavError;
  const UI5Class = BaseObject.extend("sap.fe.navigation.NavError", NavError.prototype);
  return UI5Class;
}, false);
