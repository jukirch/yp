/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/buildingBlocks/BuildingBlockBase", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/BindingToolkit", "sap/fe/macros/situations/SituationsPopover"], function (Log, BuildingBlockBase, BuildingBlockSupport, BuildingBlockTemplateProcessor, MetaModelConverter, BindingToolkit, SituationsPopover) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  var _exports = {};
  var showPopover = SituationsPopover.showPopover;
  var ref = BindingToolkit.ref;
  var pathInModel = BindingToolkit.pathInModel;
  var ifElse = BindingToolkit.ifElse;
  var greaterThan = BindingToolkit.greaterThan;
  var fn = BindingToolkit.fn;
  var equal = BindingToolkit.equal;
  var and = BindingToolkit.and;
  var convertMetaModelContext = MetaModelConverter.convertMetaModelContext;
  var xml = BuildingBlockTemplateProcessor.xml;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let SituationsIndicatorBlock = (_dec = defineBuildingBlock({
    name: "SituationsIndicator",
    namespace: "sap.fe.macros.internal.situations"
  }), _dec2 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true
  }), _dec3 = blockAttribute({
    type: "string",
    required: false
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(SituationsIndicatorBlock, _BuildingBlockBase);
    function SituationsIndicatorBlock() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BuildingBlockBase.call(this, ...args) || this;
      _initializerDefineProperty(_this, "entitySet", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "propertyPath", _descriptor2, _assertThisInitialized(_this));
      return _this;
    }
    _exports = SituationsIndicatorBlock;
    SituationsIndicatorBlock.getSituationsNavigationProperty = function getSituationsNavigationProperty(context) {
      let navigationProperties;
      switch (context._type) {
        case "NavigationProperty":
          navigationProperties = context.targetType.navigationProperties;
          break;
        case "EntityType":
          navigationProperties = context.navigationProperties;
          break;
        default:
          navigationProperties = context.entityType.navigationProperties;
      }
      const situationsNavProps = navigationProperties.filter(navigationProperty => {
        var _navigationProperty$t, _navigationProperty$t2;
        return !navigationProperty.isCollection && ((_navigationProperty$t = navigationProperty.targetType.annotations.Common) === null || _navigationProperty$t === void 0 ? void 0 : (_navigationProperty$t2 = _navigationProperty$t.SAPObjectNodeType) === null || _navigationProperty$t2 === void 0 ? void 0 : _navigationProperty$t2.Name) === "BusinessSituation";
      });
      const situationsNavProp = situationsNavProps.length >= 1 ? situationsNavProps[0] : undefined;

      // only one navigation property may lead to an entity tagged as "BusinessSituation"
      if (situationsNavProps.length > 1) {
        const navPropNames = situationsNavProps.map(prop => `'${prop.name}'`).join(", ");
        let name;
        switch (context._type) {
          case "NavigationProperty":
            name = context.targetType.name;
            break;
          case "EntityType":
            name = context.name;
            break;
          default:
            name = context.entityType.name;
        }
        Log.error(`Entity type '${name}' has multiple paths to SAP Situations (${navPropNames}). Using '${situationsNavProp === null || situationsNavProp === void 0 ? void 0 : situationsNavProp.name}'.
Hint: Make sure there is at most one navigation property whose target entity type is annotated with
<Annotation Term="com.sap.vocabularies.Common.v1.SAPObjectNodeType">
  <Record>
    <PropertyValue Property="Name" String="BusinessSituation" />
  </Record>
</Annotation>.`);
      }
      return situationsNavProp;
    };
    var _proto = SituationsIndicatorBlock.prototype;
    _proto.getTemplate = function getTemplate() {
      const context = convertMetaModelContext(this.entitySet);
      if (!context) {
        // We weren't able to find the context object, unlikely but could happen
        return;
      }
      const situationsNavProp = SituationsIndicatorBlock.getSituationsNavigationProperty(context);
      if (!situationsNavProp) {
        // No path to SAP Situations. That is, the entity type is not situation-enabled. Ignore this fragment.
        return undefined;
      }
      const numberOfSituations = pathInModel(`${situationsNavProp.name}/SitnNumberOfInstances`);

      // Indicator visibility
      let visible;
      if (!this.propertyPath) {
        // no propertyPath --> visibility depends on the number of situations only
        visible = greaterThan(numberOfSituations, 0);
      } else {
        // propertyPath --> visibility depends on the number of situations and on the semantic key used for showing indicators
        visible = and(greaterThan(numberOfSituations, 0), equal(pathInModel("semanticKeyHasDraftIndicator", "internal"), this.propertyPath));
      }

      // Button text: the number of situations if there are multiple, the empty string otherwise
      const text = ifElse(greaterThan(numberOfSituations, 1), numberOfSituations, "");

      // Button tooltip: "There is one situation" / "There are <n> situations"
      const tooltip = ifElse(equal(numberOfSituations, 1), this.getTranslatedText("situationsTooltipSingular"), fn("formatMessage", [this.getTranslatedText("situationsTooltipPlural"), numberOfSituations]));

      // 'press' handler
      const onPress = fn(showPopover, [ref("$controller"), ref("$event"), situationsNavProp.name]);
      return xml`
			<m:Button core:require="{rt: 'sap/fe/macros/situations/SituationsPopover', formatMessage: 'sap/base/strings/formatMessage'}"
				type="Attention"
				icon="sap-icon://alert"
				text="${text}"
				tooltip="${tooltip}"
				visible="${visible}"
				press="${onPress}"
			/>`;
    };
    return SituationsIndicatorBlock;
  }(BuildingBlockBase), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "entitySet", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "propertyPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = SituationsIndicatorBlock;
  return _exports;
}, false);
