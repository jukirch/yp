/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/merge", "sap/base/util/ObjectPath", "sap/base/util/uid", "sap/ui/base/Metadata", "sap/ui/core/mvc/ControllerMetadata"], function (merge, ObjectPath, uid, Metadata, ControllerMetadata) {
  "use strict";

  var _exports = {};
  const ensureMetadata = function (target) {
    target.metadata = merge({
      controllerExtensions: {},
      properties: {},
      aggregations: {},
      associations: {},
      methods: {},
      events: {},
      interfaces: []
    }, target.metadata || {});
    return target.metadata;
  };

  /* #region CONTROLLER EXTENSIONS */

  /**
   * Defines that the following method is an override for the method name with the same name in the specific controller extension or base implementation.
   *
   * @param extensionName The name of the extension that will be overridden
   * @returns The decorated method
   */
  function methodOverride(extensionName) {
    return function (target, propertyKey) {
      if (!target.override) {
        target.override = {};
      }
      let currentTarget = target.override;
      if (extensionName) {
        if (!currentTarget.extension) {
          currentTarget.extension = {};
        }
        if (!currentTarget.extension[extensionName]) {
          currentTarget.extension[extensionName] = {};
        }
        currentTarget = currentTarget.extension[extensionName];
      }
      currentTarget[propertyKey.toString()] = target[propertyKey.toString()];
    };
  }

  /**
   * Defines that the method can be extended by other controller extension based on the defined overrideExecutionType.
   *
   * @param overrideExecutionType The OverrideExecution defining when the override should run (Before / After / Instead)
   * @returns The decorated method
   */
  _exports.methodOverride = methodOverride;
  function extensible(overrideExecutionType) {
    return function (target, propertyKey) {
      const metadata = ensureMetadata(target);
      if (!metadata.methods[propertyKey.toString()]) {
        metadata.methods[propertyKey.toString()] = {};
      }
      metadata.methods[propertyKey.toString()].overrideExecution = overrideExecutionType;
    };
  }

  /**
   * Defines that the method will be publicly available for controller extension usage.
   *
   * @returns The decorated method
   */
  _exports.extensible = extensible;
  function publicExtension() {
    return function (target, propertyKey, descriptor) {
      const metadata = ensureMetadata(target);
      descriptor.enumerable = true;
      if (!metadata.methods[propertyKey.toString()]) {
        metadata.methods[propertyKey.toString()] = {};
      }
      metadata.methods[propertyKey.toString()].public = true;
    };
  }
  /**
   * Defines that the method will be only available for internal usage of the controller extension.
   *
   * @returns The decorated method
   */
  _exports.publicExtension = publicExtension;
  function privateExtension() {
    return function (target, propertyKey, descriptor) {
      const metadata = ensureMetadata(target);
      descriptor.enumerable = true;
      if (!metadata.methods[propertyKey.toString()]) {
        metadata.methods[propertyKey.toString()] = {};
      }
      metadata.methods[propertyKey.toString()].public = false;
    };
  }
  /**
   * Defines that the method cannot be further extended by other controller extension.
   *
   * @returns The decorated method
   */
  _exports.privateExtension = privateExtension;
  function finalExtension() {
    return function (target, propertyKey, descriptor) {
      const metadata = ensureMetadata(target);
      descriptor.enumerable = true;
      if (!metadata.methods[propertyKey.toString()]) {
        metadata.methods[propertyKey.toString()] = {};
      }
      metadata.methods[propertyKey.toString()].final = true;
    };
  }

  /**
   * Defines that we are going to use instantiate a controller extension under the following variable name.
   *
   * @param extensionClass The controller extension that will be instantiated
   * @returns The decorated property
   */
  _exports.finalExtension = finalExtension;
  function usingExtension(extensionClass) {
    return function (target, propertyKey, propertyDescriptor) {
      const metadata = ensureMetadata(target);
      delete propertyDescriptor.initializer;
      metadata.controllerExtensions[propertyKey.toString()] = extensionClass;
      return propertyDescriptor;
    }; // This is technically an accessor decorator, but somehow the compiler doesn't like it if I declare it as such.
  }

  /* #endregion */

  /* #region CONTROL */
  /**
   * Indicates that the property shall be declared as an event on the control metadata.
   *
   * @returns The decorated property
   */
  _exports.usingExtension = usingExtension;
  function event() {
    return function (target, eventKey) {
      const metadata = ensureMetadata(target);
      if (!metadata.events[eventKey.toString()]) {
        metadata.events[eventKey.toString()] = {};
      }
    };
  }

  /**
   * Defines the following property in the control metatada.
   *
   * @param attributeDefinition The property definition
   * @returns The decorated property.
   */
  _exports.event = event;
  function property(attributeDefinition) {
    return function (target, propertyKey, propertyDescriptor) {
      const metadata = ensureMetadata(target);
      if (!metadata.properties[propertyKey]) {
        metadata.properties[propertyKey] = attributeDefinition;
      }
      delete propertyDescriptor.writable;
      delete propertyDescriptor.initializer;
      return propertyDescriptor;
    }; // This is technically an accessor decorator, but somehow the compiler doesn't like it if i declare it as such.;
  }
  /**
   * Defines and configure the following aggregation in the control metatada.
   *
   * @param aggregationDefinition The aggregation definition
   * @returns The decorated property.
   */
  _exports.property = property;
  function aggregation(aggregationDefinition) {
    return function (target, propertyKey, propertyDescriptor) {
      const metadata = ensureMetadata(target);
      if (aggregationDefinition.multiple === undefined) {
        // UI5 defaults this to true but this is just weird...
        aggregationDefinition.multiple = false;
      }
      if (!metadata.aggregations[propertyKey]) {
        metadata.aggregations[propertyKey] = aggregationDefinition;
      }
      if (aggregationDefinition.isDefault) {
        metadata.defaultAggregation = propertyKey;
      }
      delete propertyDescriptor.writable;
      delete propertyDescriptor.initializer;
      return propertyDescriptor;
    }; // This is technically an accessor decorator, but somehow the compiler doesn't like it if i declare it as such.;
  }

  /**
   * Defines and configure the following association in the control metatada.
   *
   * @param ui5AssociationMetadata The definition of the association.
   * @returns The decorated property
   */
  _exports.aggregation = aggregation;
  function association(ui5AssociationMetadata) {
    return function (target, propertyKey, propertyDescriptor) {
      const metadata = ensureMetadata(target);
      if (!metadata.associations[propertyKey]) {
        metadata.associations[propertyKey] = ui5AssociationMetadata;
      }
      delete propertyDescriptor.writable;
      delete propertyDescriptor.initializer;
      return propertyDescriptor;
    }; // This is technically an accessor decorator, but somehow the compiler doesn't like it if i declare it as such.;
  }

  /**
   * Defines in the metadata that this control implements a specific interface.
   *
   * @param interfaceName The name of the implemented interface
   * @returns The decorated method
   */
  _exports.association = association;
  function implementInterface(interfaceName) {
    return function (target) {
      const metadata = ensureMetadata(target);
      metadata.interfaces.push(interfaceName);
    };
  }

  /**
   * Indicates that the following method should also be exposed statically so we can call it from XML.
   *
   * @returns The decorated method
   */
  _exports.implementInterface = implementInterface;
  function xmlEventHandler() {
    return function (target, propertykey) {
      const currentConstructor = target.constructor;
      currentConstructor[propertykey.toString()] = function () {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        if (args && args.length) {
          const currentTarget = currentConstructor.getAPI(args[0]);
          currentTarget === null || currentTarget === void 0 ? void 0 : currentTarget[propertykey.toString()](...args);
        }
      };
    };
  }

  /**
   * Indicates that the following class should define a UI5 control of the specified name.
   *
   * @param sTarget The fully qualified name of the UI5 class
   * @param metadataDefinition Inline metadata definition
   * @returns A class decorator that will create a ui5 class
   */
  _exports.xmlEventHandler = xmlEventHandler;
  function defineUI5Class(sTarget, metadataDefinition) {
    return function (constructor) {
      if (!constructor.prototype.metadata) {
        constructor.prototype.metadata = {};
      }
      if (metadataDefinition) {
        for (const key in metadataDefinition) {
          constructor.prototype.metadata[key] = metadataDefinition[key];
        }
      }
      return registerUI5Metadata(constructor, sTarget, constructor.prototype);
    };
  }
  _exports.defineUI5Class = defineUI5Class;
  function createReference() {
    return {
      current: undefined,
      setCurrent: function (oControlInstance) {
        this.current = oControlInstance;
      }
    };
  }
  /**
   * Defines that the following object will hold a reference to a control through jsx templating.
   *
   * @returns The decorated property.
   */
  _exports.createReference = createReference;
  function defineReference() {
    return function (target, propertyKey, propertyDescriptor) {
      delete propertyDescriptor.writable;
      delete propertyDescriptor.initializer;
      propertyDescriptor.initializer = createReference;
      return propertyDescriptor;
    }; // This is technically an accessor decorator, but somehow the compiler doesn't like it if i declare it as such.;
  }

  /**
   * Internal heavy lifting that will take care of creating the class property for ui5 to use.
   *
   * @param clazz The class prototype
   * @param name The name of the class to create
   * @param inObj The metadata object
   * @returns The metadata class
   */
  _exports.defineReference = defineReference;
  function registerUI5Metadata(clazz, name, inObj) {
    var _clazz$getMetadata, _inObj$metadata, _clazz$metadata, _obj$metadata;
    if (clazz.getMetadata && clazz.getMetadata().isA("sap.ui.core.mvc.ControllerExtension")) {
      Object.getOwnPropertyNames(inObj).forEach(objName => {
        const descriptor = Object.getOwnPropertyDescriptor(inObj, objName);
        if (descriptor && !descriptor.enumerable) {
          descriptor.enumerable = true;
          //		Log.error(`Property ${objName} from ${name} should be decorated as public`);
        }
      });
    }

    const obj = {};
    obj.metadata = inObj.metadata || {};
    obj.override = inObj.override;
    obj.constructor = clazz;
    obj.metadata.baseType = Object.getPrototypeOf(clazz.prototype).getMetadata().getName();
    if ((clazz === null || clazz === void 0 ? void 0 : (_clazz$getMetadata = clazz.getMetadata()) === null || _clazz$getMetadata === void 0 ? void 0 : _clazz$getMetadata.getStereotype()) === "control") {
      const rendererDefinition = inObj.renderer || clazz.renderer || clazz.render;
      obj.renderer = {
        apiVersion: 2
      };
      if (typeof rendererDefinition === "function") {
        obj.renderer.render = rendererDefinition;
      } else if (rendererDefinition != undefined) {
        obj.renderer = rendererDefinition;
      }
    }
    obj.metadata.interfaces = ((_inObj$metadata = inObj.metadata) === null || _inObj$metadata === void 0 ? void 0 : _inObj$metadata.interfaces) || ((_clazz$metadata = clazz.metadata) === null || _clazz$metadata === void 0 ? void 0 : _clazz$metadata.interfaces);
    Object.keys(clazz.prototype).forEach(key => {
      if (key !== "metadata") {
        try {
          obj[key] = clazz.prototype[key];
        } catch (e) {
          //console.log(e);
        }
      }
    });
    if ((_obj$metadata = obj.metadata) !== null && _obj$metadata !== void 0 && _obj$metadata.controllerExtensions && Object.keys(obj.metadata.controllerExtensions).length > 0) {
      for (const cExtName in obj.metadata.controllerExtensions) {
        obj[cExtName] = obj.metadata.controllerExtensions[cExtName];
      }
    }
    const output = clazz.extend(name, obj);
    const fnInit = output.prototype.init;
    output.prototype.init = function () {
      var _this = this;
      if (fnInit) {
        for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }
        fnInit.apply(this, args);
      }
      this.metadata = obj.metadata;
      if (obj.metadata.properties) {
        const aPropertyKeys = Object.keys(obj.metadata.properties);
        aPropertyKeys.forEach(propertyKey => {
          Object.defineProperty(this, propertyKey, {
            configurable: true,
            set: v => {
              return this.setProperty(propertyKey, v);
            },
            get: () => {
              return this.getProperty(propertyKey);
            }
          });
        });
        const aAggregationKeys = Object.keys(obj.metadata.aggregations);
        aAggregationKeys.forEach(aggregationKey => {
          Object.defineProperty(this, aggregationKey, {
            configurable: true,
            set: v => {
              return this.setAggregation(aggregationKey, v);
            },
            get: () => {
              const aggregationContent = this.getAggregation(aggregationKey);
              if (obj.metadata.aggregations[aggregationKey].multiple) {
                return aggregationContent || [];
              } else {
                return aggregationContent;
              }
            }
          });
        });
        const aAssociationKeys = Object.keys(obj.metadata.associations);
        aAssociationKeys.forEach(associationKey => {
          Object.defineProperty(this, associationKey, {
            configurable: true,
            set: v => {
              return this.setAssociation(associationKey, v);
            },
            get: () => {
              const aggregationContent = this.getAssociation(associationKey);
              if (obj.metadata.associations[associationKey].multiple) {
                return aggregationContent || [];
              } else {
                return aggregationContent;
              }
            }
          });
        });
      }
      if (obj.metadata.methods) {
        for (const methodName in obj.metadata.methods) {
          const methodDefinition = obj.metadata.methods[methodName];
          if (methodDefinition.overrideExecution === "AfterAsync" || methodDefinition.overrideExecution === "BeforeAsync") {
            if (!this.methodHolder) {
              this.methodHolder = [];
            }
            this.methodHolder[methodName] = [this[methodName]];
            Object.defineProperty(this, methodName, {
              configurable: true,
              set: v => {
                return this.methodHolder[methodName].push(v);
              },
              get: () => {
                return async function () {
                  const methodArrays = _this.methodHolder[methodName];
                  if (methodDefinition.overrideExecution === "BeforeAsync") {
                    methodArrays.reverse();
                  }
                  for (var _len3 = arguments.length, methodArgs = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                    methodArgs[_key3] = arguments[_key3];
                  }
                  for (const arg of methodArrays) {
                    await arg.apply(_this, methodArgs);
                  }
                };
              }
            });
          }
        }
      }
    };
    clazz.override = function (oExtension) {
      const pol = {};
      pol.constructor = function () {
        for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
          args[_key4] = arguments[_key4];
        }
        return clazz.apply(this, args);
      };
      const oClass = Metadata.createClass(clazz, `anonymousExtension~${uid()}`, pol, ControllerMetadata);
      oClass.getMetadata()._staticOverride = oExtension;
      oClass.getMetadata()._override = clazz.getMetadata()._override;
      return oClass;
    };
    ObjectPath.set(name, output);
    return output;
  }
  return _exports;
}, false);
