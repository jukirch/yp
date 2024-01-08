/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport", "sap/m/MessageItem", "sap/m/MessagePopover"], function (ClassSupport, MessageItem, MessagePopover) {
  "use strict";

  var _dec, _class;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  let FeMessagePopover = (_dec = defineUI5Class("sap.fe.macros.messages.MessagePopover"), _dec(_class = /*#__PURE__*/function (_MessagePopover) {
    _inheritsLoose(FeMessagePopover, _MessagePopover);
    function FeMessagePopover() {
      return _MessagePopover.apply(this, arguments) || this;
    }
    var _proto = FeMessagePopover.prototype;
    _proto.init = function init() {
      MessagePopover.prototype.init.apply(this);
      this.setModel(sap.ui.getCore().getMessageManager().getMessageModel(), "message");
      this.bindAggregation("items", {
        path: "message>/",
        length: 9999,
        template: new MessageItem({
          type: "{message>type}",
          title: "{message>message}",
          description: "{message>description}",
          markupDescription: true,
          longtextUrl: "{message>descriptionUrl}",
          subtitle: "{message>additionalText}",
          activeTitle: "{= ${message>controlIds}.length > 0 ? true : false}"
        })
      });
      this.setGroupItems(true);
    };
    return FeMessagePopover;
  }(MessagePopover)) || _class);
  return FeMessagePopover;
}, false);
