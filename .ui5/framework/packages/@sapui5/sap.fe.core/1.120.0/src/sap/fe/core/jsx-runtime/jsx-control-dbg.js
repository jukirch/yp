/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/helpers/BindingToolkit", "sap/m/Text", "sap/ui/base/DataType", "sap/ui/core/mvc/EventHandlerResolver"], function (Log, BindingToolkit, Text, DataType, EventHandlerResolver) {
  "use strict";

  var isConstant = BindingToolkit.isConstant;
  var isBindingToolkitExpression = BindingToolkit.isBindingToolkitExpression;
  var compileExpression = BindingToolkit.compileExpression;
  var compileConstant = BindingToolkit.compileConstant;
  const addChildAggregation = function (aggregationChildren, aggregationName, child) {
    if (child === undefined || typeof child === "string") {
      return;
    }
    if (!aggregationChildren[aggregationName]) {
      aggregationChildren[aggregationName] = [];
    }
    if (isChildAnElement(child)) {
      aggregationChildren[aggregationName].push(child);
    } else if (Array.isArray(child)) {
      child.forEach(subChild => {
        addChildAggregation(aggregationChildren, aggregationName, subChild);
      });
    } else {
      Object.keys(child).forEach(childKey => {
        addChildAggregation(aggregationChildren, childKey, child[childKey]);
      });
    }
  };
  const isChildAnElement = function (children) {
    var _isA, _ref;
    return children === null || children === void 0 ? void 0 : (_isA = (_ref = children).isA) === null || _isA === void 0 ? void 0 : _isA.call(_ref, "sap.ui.core.Element");
  };
  const isAControl = function (children) {
    return !!(children !== null && children !== void 0 && children.getMetadata);
  };
  function processAggregations(metadata, mSettings) {
    const metadataAggregations = metadata.getAllAggregations();
    const defaultAggregationName = metadata.getDefaultAggregationName();
    const aggregationChildren = {};
    addChildAggregation(aggregationChildren, defaultAggregationName, mSettings.children);
    delete mSettings.children;
    // find out which aggregation are bound (both in children and directly under it)
    Object.keys(metadataAggregations).forEach(aggregationName => {
      if (aggregationChildren[aggregationName] !== undefined) {
        if (mSettings.hasOwnProperty(aggregationName)) {
          // always use the first item as template according to UI5 logic
          mSettings[aggregationName].template = aggregationChildren[aggregationName][0];
        } else {
          mSettings[aggregationName] = aggregationChildren[aggregationName];
        }
      }
    });
  }

  /**
   * Processes the properties.
   *
   * If the property is a bindingToolkit expression we need to compile it.
   * Else if the property is set as string (compiled binding expression returns string by default even if it's a boolean, int, etc.) and it doesn't match with expected
   * format the value is parsed to provide expected format.
   *
   * @param metadata Metadata of the control
   * @param settings Settings of the control
   * @returns A map of late properties that need to be awaited after the control is created
   */
  function processProperties(metadata, settings) {
    let settingsKey;
    const lateProperties = {};
    for (settingsKey in settings) {
      const value = settings[settingsKey];
      if (isBindingToolkitExpression(value)) {
        const bindingToolkitExpression = value;
        if (isConstant(bindingToolkitExpression)) {
          settings[settingsKey] = compileConstant(bindingToolkitExpression, false, true, true);
        } else {
          settings[settingsKey] = compileExpression(bindingToolkitExpression);
        }
      } else if (value !== null && typeof value === "object" && value.then) {
        lateProperties[settingsKey] = value;
        delete settings[settingsKey];
      } else if (typeof value === "string" && !value.startsWith("{")) {
        var _metadata$getAllPrope, _metadata$getAllPrope2, _metadata$getAllPrope3;
        const propertyType = (_metadata$getAllPrope = metadata.getAllProperties()[settingsKey]) === null || _metadata$getAllPrope === void 0 ? void 0 : (_metadata$getAllPrope2 = (_metadata$getAllPrope3 = _metadata$getAllPrope).getType) === null || _metadata$getAllPrope2 === void 0 ? void 0 : _metadata$getAllPrope2.call(_metadata$getAllPrope3);
        if (propertyType && propertyType instanceof DataType && ["boolean", "int", "float"].includes(propertyType.getName())) {
          settings[settingsKey] = propertyType.parseValue(value);
        }
      }
    }
    return lateProperties;
  }

  /**
   * Processes the command.
   *
   * Resolves the command set on the control via the intrinsic class attribute "jsx:command".
   * If no command has been set or the targeted event doesn't exist, no configuration is set.
   *
   * @param metadata Metadata of the control
   * @param settings Settings of the control
   */
  function processCommand(metadata, settings) {
    const commandProperty = settings["jsx:command"];
    if (commandProperty) {
      const [command, eventName] = commandProperty.split("|");
      const event = metadata.getAllEvents()[eventName];
      if (event && command.startsWith("cmd:")) {
        settings[event.name] = EventHandlerResolver.resolveEventHandler(command);
      }
    }
    delete settings["jsx:command"];
  }
  const jsxControl = function (ControlType, settings, key, jsxContext) {
    let targetControl;
    if (ControlType !== null && ControlType !== void 0 && ControlType.isFragment) {
      targetControl = settings.children;
    } else if (ControlType !== null && ControlType !== void 0 && ControlType.isRuntime) {
      const runtimeBuildingBlock = new ControlType(settings);
      targetControl = runtimeBuildingBlock.getContent(jsxContext.view, jsxContext.appComponent);
    } else if (isAControl(ControlType)) {
      const metadata = ControlType.getMetadata();
      if (key !== undefined) {
        settings["key"] = key;
      }
      processCommand(metadata, settings);
      processAggregations(metadata, settings);
      const classDef = settings.class;
      const refDef = settings.ref;
      delete settings.ref;
      delete settings.class;
      const lateProperties = processProperties(metadata, settings);
      const targetControlInstance = new ControlType(settings);
      if (classDef) {
        targetControlInstance.addStyleClass(classDef);
      }
      if (refDef) {
        refDef.setCurrent(targetControlInstance);
      }
      for (const latePropertiesKey in lateProperties) {
        lateProperties[latePropertiesKey].then(value => {
          return targetControlInstance.setProperty(latePropertiesKey, value);
        }).catch(error => {
          Log.error(`Couldn't set property ${latePropertiesKey} on ${ControlType.getMetadata().getName()}`, error, "jsxControl");
        });
      }
      targetControl = targetControlInstance;
    } else if (typeof ControlType === "function") {
      const controlTypeFn = ControlType;
      targetControl = controlTypeFn(settings);
    } else {
      targetControl = new Text({
        text: "Missing component " + ControlType
      });
    }
    return targetControl;
  };
  return jsxControl;
}, false);
