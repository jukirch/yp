/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  const writeChildren = function (val) {
    if (Array.isArray(val)) {
      return val.join("");
    } else {
      return val;
    }
  };
  const addChildAggregation = function (aggregationChildren, aggregationName, child) {
    if (child === undefined) {
      return;
    }
    if (!aggregationChildren[aggregationName]) {
      aggregationChildren[aggregationName] = [];
    }
    if (typeof child === "string" && child.trim().length > 0) {
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
  const FL_DELEGATE = "fl:delegate";
  const jsxXml = function (type, mSettings, key) {
    const metadata = type.getMetadata();
    const namesSplit = metadata.getName().split(".");
    if (key !== undefined) {
      mSettings["key"] = key;
    }
    const metadataProperties = metadata.getAllProperties();
    const metadataAggregations = metadata.getAllAggregations();
    metadataProperties["class"] = {
      name: "class"
    };
    metadataProperties["id"] = {
      name: "id"
    };
    metadataProperties[FL_DELEGATE] = {
      name: FL_DELEGATE
    };
    metadataProperties["xmlns:fl"] = {
      name: FL_DELEGATE
    };
    if (metadata.getName() === "sap.ui.core.Fragment") {
      metadataProperties["fragmentName"] = {
        name: "fragmentName"
      };
    }
    const namespace = namesSplit.slice(0, -1);
    const name = namesSplit[namesSplit.length - 1];
    const namespaceAlias = namespace[namespace.length - 1];
    const tagName = `${namespaceAlias}:${name}`;
    const propertiesString = [];
    const aggregationString = [];
    const defaultAggregationName = metadata.getDefaultAggregationName();
    Object.keys(metadataProperties).forEach(propertyName => {
      if (mSettings.hasOwnProperty(propertyName) && mSettings[propertyName] !== undefined) {
        if (typeof mSettings[propertyName] === "object") {
          propertiesString.push(`${propertyName}='${JSON.stringify(mSettings[propertyName])}'`);
        } else {
          propertiesString.push(`${propertyName}='${mSettings[propertyName]}'`);
        }
      }
    });
    const aggregationChildren = {
      [defaultAggregationName]: []
    };
    addChildAggregation(aggregationChildren, defaultAggregationName, mSettings.children);
    Object.keys(metadataAggregations).forEach(aggregationName => {
      if (aggregationChildren.hasOwnProperty(aggregationName) && aggregationChildren[aggregationName].length > 0) {
        aggregationString.push(`<${namespaceAlias}:${aggregationName}>
						${writeChildren(aggregationChildren[aggregationName])}
					</${namespaceAlias}:${aggregationName}>`);
      }
      if (mSettings.hasOwnProperty(aggregationName) && mSettings[aggregationName] !== undefined) {
        propertiesString.push(`${aggregationName}='${JSON.stringify(mSettings[aggregationName])}'`);
      }
    });
    return `<${tagName} xmlns:${namespaceAlias}="${namespace.join(".")}" ${propertiesString.join(" ")}>${aggregationString.join("")}</${tagName}>`;
  };
  return jsxXml;
}, false);
