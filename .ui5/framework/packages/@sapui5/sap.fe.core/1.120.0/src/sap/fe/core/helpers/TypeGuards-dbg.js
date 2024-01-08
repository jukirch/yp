/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  function isContext(potentialContext) {
    var _isA, _ref;
    return potentialContext === null || potentialContext === void 0 ? void 0 : (_isA = (_ref = potentialContext).isA) === null || _isA === void 0 ? void 0 : _isA.call(_ref, "sap.ui.model.Context");
  }
  _exports.isContext = isContext;
  function isFunctionArray(potentialFunctionArray) {
    return Array.isArray(potentialFunctionArray) && potentialFunctionArray.length > 0 && potentialFunctionArray.every(item => typeof item === "function");
  }
  _exports.isFunctionArray = isFunctionArray;
  function isAnnotationOfType(potentialAnnotationType, typeName) {
    return potentialAnnotationType.$Type === typeName;
  }

  /**
   * Checks whether the argument is a {@link ServiceObject}.
   *
   * @param serviceObject The object to be checked.
   * @returns Whether the argument is a {@link ServiceObject}.
   */
  _exports.isAnnotationOfType = isAnnotationOfType;
  function isServiceObject(serviceObject) {
    return (serviceObject === null || serviceObject === void 0 ? void 0 : serviceObject.hasOwnProperty("_type")) ?? false;
  }

  /**
   * Checks whether the argument is a {@link ComplexType}.
   *
   * @param serviceObject The object to be checked.
   * @returns Whether the argument is a {@link ComplexType}.
   */
  _exports.isServiceObject = isServiceObject;
  function isComplexType(serviceObject) {
    return (serviceObject === null || serviceObject === void 0 ? void 0 : serviceObject._type) === "ComplexType";
  }

  /**
   * Checks whether the argument is a {@link TypeDefinition}.
   *
   * @param serviceObject The object to be checked.
   * @returns Whether the argument is a {@link TypeDefinition}.
   */
  _exports.isComplexType = isComplexType;
  function isTypeDefinition(serviceObject) {
    return (serviceObject === null || serviceObject === void 0 ? void 0 : serviceObject._type) === "TypeDefinition";
  }

  /**
   * Checks whether the argument is an {@link EntityContainer}.
   *
   * @param serviceObject The object to be checked.
   * @returns Whether the argument is an {@link EntityContainer}.
   */
  _exports.isTypeDefinition = isTypeDefinition;
  function isEntityContainer(serviceObject) {
    return (serviceObject === null || serviceObject === void 0 ? void 0 : serviceObject._type) === "EntityContainer";
  }

  /**
   * Checks whether the argument is an {@link EntitySet}.
   *
   * @param serviceObject The object to be checked.
   * @returns Whether the argument is an {@link EntitySet}.
   */
  _exports.isEntityContainer = isEntityContainer;
  function isEntitySet(serviceObject) {
    return (serviceObject === null || serviceObject === void 0 ? void 0 : serviceObject._type) === "EntitySet";
  }

  /**
   * Checks whether the argument is a {@link Singleton}.
   *
   * @param serviceObject The object to be checked.
   * @returns Whether the argument is a {@link Singleton}
   */
  _exports.isEntitySet = isEntitySet;
  function isSingleton(serviceObject) {
    return (serviceObject === null || serviceObject === void 0 ? void 0 : serviceObject._type) === "Singleton";
  }

  /**
   * Checks whether the argument is an {@link EntityType}.
   *
   * @param serviceObject The object to be checked.
   * @returns Whether the argument is an {@link EntityType}
   */
  _exports.isSingleton = isSingleton;
  function isEntityType(serviceObject) {
    return (serviceObject === null || serviceObject === void 0 ? void 0 : serviceObject._type) === "EntityType";
  }

  /**
   * Checks whether the argument is a {@link Property}.
   *
   * @param serviceObject The object to be checked.
   * @returns Whether the argument is a {@link Property}.
   */
  _exports.isEntityType = isEntityType;
  function isProperty(serviceObject) {
    return (serviceObject === null || serviceObject === void 0 ? void 0 : serviceObject._type) === "Property";
  }

  /**
   * Checks whether the argument is a {@link NavigationProperty}.
   *
   * Hint: There are also the more specific functions {@link isSingleNavigationProperty} and {@link isMultipleNavigationProperty}. These can be
   * used to check for to-one and to-many navigation properties, respectively.
   *
   * @param serviceObject The object to be checked.
   * @returns Whether the argument is a {@link NavigationProperty}.
   */
  _exports.isProperty = isProperty;
  function isNavigationProperty(serviceObject) {
    return (serviceObject === null || serviceObject === void 0 ? void 0 : serviceObject._type) === "NavigationProperty";
  }

  /**
   * Checks whether the argument is a {@link SingleNavigationProperty}.
   *
   * @param serviceObject The object to be checked.
   * @returns Whether the argument is a {@link SingleNavigationProperty}.
   */
  _exports.isNavigationProperty = isNavigationProperty;
  function isSingleNavigationProperty(serviceObject) {
    return isNavigationProperty(serviceObject) && !serviceObject.isCollection;
  }

  /**
   * Checks whether the argument is a {@link MultipleNavigationProperty}.
   *
   * @param serviceObject The object to be checked.
   * @returns Whether the argument is a {@link MultipleNavigationProperty}.
   */
  _exports.isSingleNavigationProperty = isSingleNavigationProperty;
  function isMultipleNavigationProperty(serviceObject) {
    return isNavigationProperty(serviceObject) && serviceObject.isCollection;
  }

  /**
   * Checks whether the argument is a {@link PathAnnotationExpression}.
   *
   * @param expression The object to be checked.
   * @returns Whether the argument is a {@link PathAnnotationExpression}.
   */
  _exports.isMultipleNavigationProperty = isMultipleNavigationProperty;
  function isPathAnnotationExpression(expression) {
    return (expression === null || expression === void 0 ? void 0 : expression.type) === "Path";
  }

  /**
   * Checks whether the argument is a {@link AnnotationPathExpression}.
   *
   * @param expression The object to be checked.
   * @returns Whether the argument is a {@link AnnotationPathExpression}.
   */
  _exports.isPathAnnotationExpression = isPathAnnotationExpression;
  function isAnnotationPath(expression) {
    return (expression === null || expression === void 0 ? void 0 : expression.type) === "AnnotationPath";
  }

  /**
   * Checks whether the argument is a {@link PropertyPath}.
   *
   * @param expression The object to be checked.
   * @returns Whether the argument is a {@link PropertyPath}.
   */
  _exports.isAnnotationPath = isAnnotationPath;
  function isPropertyPathExpression(expression) {
    return (expression === null || expression === void 0 ? void 0 : expression.type) === "PropertyPath";
  }
  _exports.isPropertyPathExpression = isPropertyPathExpression;
  return _exports;
}, false);
