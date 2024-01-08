/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/buildingBlocks/BuildingBlockBase", "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor", "sap/fe/core/buildingBlocks/RuntimeBuildingBlockFragment", "sap/fe/core/helpers/TypeGuards", "sap/ui/core/Core"], function (Log, BuildingBlockBase, BuildingBlockTemplateProcessor, RuntimeBuildingBlockFragment, TypeGuards, Core) {
  "use strict";

  var _exports = {};
  var isContext = TypeGuards.isContext;
  var storeRuntimeBlock = RuntimeBuildingBlockFragment.storeRuntimeBlock;
  var xml = BuildingBlockTemplateProcessor.xml;
  var registerBuildingBlock = BuildingBlockTemplateProcessor.registerBuildingBlock;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  /**
   * Base class for runtime building blocks
   */
  let RuntimeBuildingBlock = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(RuntimeBuildingBlock, _BuildingBlockBase);
    function RuntimeBuildingBlock() {
      return _BuildingBlockBase.apply(this, arguments) || this;
    }
    _exports = RuntimeBuildingBlock;
    RuntimeBuildingBlock.register = function register() {
      registerBuildingBlock(this);
      storeRuntimeBlock(this);
    };
    RuntimeBuildingBlock.load = async function load() {
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
    var _proto = RuntimeBuildingBlock.prototype;
    _proto.getTemplate = function getTemplate(_oNode) {
      const metadata = this.constructor.metadata;
      const className = `${metadata.namespace ?? metadata.publicNamespace}.${metadata.name}`;
      const extraProps = [];
      // Function are defined as string but need to be resolved by UI5, as such we store them in an `event` property and will redispatch them later
      const functionHolderDefinition = [];
      const propertiesAssignedToFunction = [];
      const functionStringInOrder = [];
      for (const propertiesKey in metadata.properties) {
        let propertyValue = this[propertiesKey];
        if (propertyValue !== undefined && propertyValue !== null) {
          if (isContext(propertyValue)) {
            propertyValue = propertyValue.getPath();
          }
          if (metadata.properties[propertiesKey].type === "function") {
            functionHolderDefinition.push(propertyValue);
            functionStringInOrder.push(propertyValue);
            propertiesAssignedToFunction.push(propertiesKey);
          } else {
            extraProps.push(xml`feBB:${propertiesKey}="${propertyValue}"`);
          }
        }
      }
      if (functionHolderDefinition.length > 0) {
        extraProps.push(xml`functionHolder="${functionHolderDefinition.join(";")}"`);
        extraProps.push(xml`feBB:functionStringInOrder="${functionStringInOrder.join(",")}"`);
        extraProps.push(xml`feBB:propertiesAssignedToFunction="${propertiesAssignedToFunction.join(",")}"`);
      }
      return xml`<feBB:RuntimeBuildingBlockFragment
					xmlns:core="sap.ui.core"
					xmlns:feBB="sap.fe.core.buildingBlocks"
					fragmentName="${className}"

					id="{this>id}"
					type="FE_COMPONENTS"
					${extraProps.length > 0 ? extraProps : ""}
				>
				</feBB:RuntimeBuildingBlockFragment>`;
    };
    return RuntimeBuildingBlock;
  }(BuildingBlockBase);
  RuntimeBuildingBlock.isRuntime = true;
  _exports = RuntimeBuildingBlock;
  return _exports;
}, false);
