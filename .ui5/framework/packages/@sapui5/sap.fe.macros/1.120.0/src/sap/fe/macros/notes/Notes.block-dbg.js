/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/buildingBlocks/BuildingBlockBase", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor", "sap/ui/core/Core"], function (Log, BuildingBlockBase, BuildingBlockSupport, BuildingBlockTemplateProcessor, Core) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  var _exports = {};
  var xml = BuildingBlockTemplateProcessor.xml;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let NotesBuildingBlock = (_dec = defineBuildingBlock({
    name: "Notes",
    namespace: "sap.fe.macros",
    libraries: ["sap/nw/core/gbt/notes/lib/reuse"]
  }), _dec2 = blockAttribute({
    type: "string",
    isPublic: true,
    required: true
  }), _dec3 = blockAttribute({
    type: "sap.ui.model.Context",
    isPublic: true,
    required: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(NotesBuildingBlock, _BuildingBlockBase);
    function NotesBuildingBlock() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BuildingBlockBase.call(this, ...args) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor2, _assertThisInitialized(_this));
      return _this;
    }
    _exports = NotesBuildingBlock;
    NotesBuildingBlock.load = async function load() {
      if (this.metadata.libraries) {
        // Required before usage to ensure the library is loaded and not each file individually
        try {
          await Promise.all(this.metadata.libraries.map(async libraryName => Core.loadLibrary(libraryName, {
            async: true
          })));
        } catch (e) {
          const errorMessage = `Couldn't load building block ${this.metadata.name} please make sure the following libraries are available ${this.metadata.libraries.join(",")}`;
          Log.error(errorMessage);
          throw new Error(errorMessage);
        }
      }
      return Promise.resolve(this);
    };
    var _proto = NotesBuildingBlock.prototype;
    _proto.getTemplate = async function getTemplate() {
      // Required before usage to ensure the library is loaded and not each file individually
      try {
        await NotesBuildingBlock.load();
      } catch (e) {
        return xml`<m:Label text="${e}"/>`;
      }
      return xml`<fpm:CustomFragment xmlns:fpm="sap.fe.macros.fpm" id="${this.id}" contextPath="{contextPath>}" fragmentName="sap.nw.core.gbt.notes.lib.reuse.fe.fragment.NoteList"/>`;
    };
    return NotesBuildingBlock;
  }(BuildingBlockBase), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = NotesBuildingBlock;
  return _exports;
}, false);
