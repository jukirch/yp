/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  /**
   * Indicates that you must declare the property to be used as an XML attribute that can be used from outside the building block.
   *
   * When you define a runtime building block, ensure that you use the correct type: Depending on its metadata,
   * a property can either be a {@link sap.ui.model.Context} (<code>type: 'sap.ui.model.Context'</code>),
   * a constant (<code>bindable: false</code>), or a {@link BindingToolkitExpression} (<code>bindable: true</code>).
   *
   * Use this decorator only for properties that are to be set from outside or are used in inner XML templating.
   * If you just need simple computed properties, use undecorated, private TypeScript properties.
   *
   * @param attributeDefinition
   * @returns The decorated property
   */
  function blockAttribute(attributeDefinition) {
    return function (target, propertyKey, propertyDescriptor) {
      var _propertyDescriptor$i;
      const metadata = target.constructor.metadata;
      // If there is no defaultValue we can take the value from the initializer (natural way of defining defaults)
      attributeDefinition.defaultValue = (_propertyDescriptor$i = propertyDescriptor.initializer) === null || _propertyDescriptor$i === void 0 ? void 0 : _propertyDescriptor$i.call(propertyDescriptor);
      delete propertyDescriptor.initializer;
      if (metadata.properties[propertyKey.toString()] === undefined) {
        metadata.properties[propertyKey.toString()] = attributeDefinition;
      }
      return propertyDescriptor;
    }; // Needed to make TS happy with those decorators;
  }

  /**
   * Decorator for building blocks.
   *
   * This is an alias for @blockAttribute({ type: "function" }).
   *
   * @returns The decorated property
   */
  _exports.blockAttribute = blockAttribute;
  function blockEvent() {
    return blockAttribute({
      type: "function"
    });
  }

  /**
   * Indicates that the property shall be declared as an xml aggregation that can be used from the outside of the building block.
   *
   * @param aggregationDefinition
   * @returns The decorated property
   */
  _exports.blockEvent = blockEvent;
  function blockAggregation(aggregationDefinition) {
    return function (target, propertyKey, propertyDescriptor) {
      const metadata = target.constructor.metadata;
      delete propertyDescriptor.initializer;
      if (metadata.aggregations[propertyKey] === undefined) {
        metadata.aggregations[propertyKey] = aggregationDefinition;
      }
      if (aggregationDefinition.isDefault === true) {
        metadata.defaultAggregation = propertyKey;
      }
      return propertyDescriptor;
    };
  }
  _exports.blockAggregation = blockAggregation;
  function defineBuildingBlock(buildingBlockDefinition) {
    return function (classDefinition) {
      const metadata = classDefinition.metadata;
      metadata.namespace = buildingBlockDefinition.namespace;
      metadata.publicNamespace = buildingBlockDefinition.publicNamespace;
      metadata.name = buildingBlockDefinition.name;
      metadata.xmlTag = buildingBlockDefinition.xmlTag;
      metadata.fragment = buildingBlockDefinition.fragment;
      metadata.designtime = buildingBlockDefinition.designtime;
      metadata.isOpen = buildingBlockDefinition.isOpen;
      metadata.libraries = buildingBlockDefinition.libraries;
    };
  }
  _exports.defineBuildingBlock = defineBuildingBlock;
  return _exports;
}, false);
