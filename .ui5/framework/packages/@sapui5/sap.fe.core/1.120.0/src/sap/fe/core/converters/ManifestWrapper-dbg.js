/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/ManifestSettings", "sap/ui/Device"], function (ManifestSettings, Device) {
  "use strict";

  var VariantManagementType = ManifestSettings.VariantManagementType;
  function ensureAnnotationPath(obj, property) {
    const propertyValue = obj === null || obj === void 0 ? void 0 : obj[property];
    if (Array.isArray(propertyValue)) {
      propertyValue.forEach(entry => ensureAnnotationPath(entry, "annotationPath"));
    } else if (propertyValue && !propertyValue.includes("@")) {
      obj[property] = "@" + propertyValue;
    }
  }

  /**
   *
   */
  let ManifestWrapper = /*#__PURE__*/function () {
    /**
     * Creates a wrapper object to ensure the data returned from the manifest is consistent and everything is merged correctly.
     *
     * @param oManifestSettings The manifest settings for the current page
     * @param mergeFn A function that will be used to perform the merge
     * @returns The manifest wrapper object
     */
    function ManifestWrapper(oManifestSettings, mergeFn) {
      var _views;
      this.oManifestSettings = oManifestSettings;
      this.mergeFn = mergeFn;
      // Ensure that properties which are meant to contain an *annotation* path contain a '@'
      ensureAnnotationPath(this.oManifestSettings, "defaultTemplateAnnotationPath");
      (_views = this.oManifestSettings.views) === null || _views === void 0 ? void 0 : _views.paths.forEach(path => {
        ensureAnnotationPath(path, "annotationPath");
        ensureAnnotationPath(path, "primary");
        ensureAnnotationPath(path, "secondary");
      });
      if (this.oManifestSettings.controlConfiguration) {
        for (const controlConfiguration of Object.values(this.oManifestSettings.controlConfiguration)) {
          var _tableSettings;
          const quickVariantSelection = (_tableSettings = controlConfiguration.tableSettings) === null || _tableSettings === void 0 ? void 0 : _tableSettings.quickVariantSelection;
          ensureAnnotationPath(quickVariantSelection, "paths");
        }
      }
    }

    /**
     * Returns the current template type.
     *
     * @returns The type of the current template
     */
    var _proto = ManifestWrapper.prototype;
    _proto.getTemplateType = function getTemplateType() {
      return this.oManifestSettings.converterType;
    }

    /**
     * Checks whether the current template should display the filter bar.
     *
     * @returns `true` if the filter bar should be hidden
     */;
    _proto.isFilterBarHidden = function isFilterBarHidden() {
      var _this$oManifestSettin;
      return !!((_this$oManifestSettin = this.oManifestSettings) !== null && _this$oManifestSettin !== void 0 && _this$oManifestSettin.hideFilterBar);
    };
    _proto.useHiddenFilterBar = function useHiddenFilterBar() {
      var _this$oManifestSettin2;
      return !!((_this$oManifestSettin2 = this.oManifestSettings) !== null && _this$oManifestSettin2 !== void 0 && _this$oManifestSettin2.useHiddenFilterBar);
    }

    /**
     * Checks whether the current environment is a desktop or not.
     *
     * @returns `true` if we are on a desktop
     */;
    _proto.isDesktop = function isDesktop() {
      return !!this.oManifestSettings.isDesktop;
    }

    /**
     * Checks whether the current environment is a mobile phone or not.
     *
     * @returns `true` if we are on a mobile phone
     */;
    _proto.isPhone = function isPhone() {
      return !!this.oManifestSettings.isPhone;
    }

    /**
     * Retrieves the form containers (field groups or identification) defined in the manifest.
     *
     * @param facetTarget The target annotation path for this form
     * @returns A set of form containers defined in the manifest indexed by an iterable key
     */;
    _proto.getFormContainer = function getFormContainer(facetTarget) {
      var _this$oManifestSettin3;
      return (_this$oManifestSettin3 = this.oManifestSettings.controlConfiguration) === null || _this$oManifestSettin3 === void 0 ? void 0 : _this$oManifestSettin3[facetTarget];
    }

    /**
     * Retrieves the header facets defined in the manifest.
     *
     * @returns A set of header facets defined in the manifest indexed by an iterable key
     */;
    _proto.getHeaderFacets = function getHeaderFacets() {
      var _this$oManifestSettin4, _this$oManifestSettin5, _content, _content$header;
      return this.mergeFn({}, (_this$oManifestSettin4 = this.oManifestSettings.controlConfiguration) === null || _this$oManifestSettin4 === void 0 ? void 0 : (_this$oManifestSettin5 = _this$oManifestSettin4["@com.sap.vocabularies.UI.v1.HeaderFacets"]) === null || _this$oManifestSettin5 === void 0 ? void 0 : _this$oManifestSettin5.facets, (_content = this.oManifestSettings.content) === null || _content === void 0 ? void 0 : (_content$header = _content.header) === null || _content$header === void 0 ? void 0 : _content$header.facets);
    }

    /**
     * Retrieves the header actions defined in the manifest.
     *
     * @returns A set of actions defined in the manifest indexed by an iterable key
     */;
    _proto.getHeaderActions = function getHeaderActions() {
      var _this$oManifestSettin6, _this$oManifestSettin7;
      return ((_this$oManifestSettin6 = this.oManifestSettings.content) === null || _this$oManifestSettin6 === void 0 ? void 0 : (_this$oManifestSettin7 = _this$oManifestSettin6.header) === null || _this$oManifestSettin7 === void 0 ? void 0 : _this$oManifestSettin7.actions) || {};
    }

    /**
     * Retrieves the footer actions defined in the manifest.
     *
     * @returns A set of actions defined in the manifest indexed by an iterable key
     */;
    _proto.getFooterActions = function getFooterActions() {
      var _this$oManifestSettin8, _this$oManifestSettin9;
      return ((_this$oManifestSettin8 = this.oManifestSettings.content) === null || _this$oManifestSettin8 === void 0 ? void 0 : (_this$oManifestSettin9 = _this$oManifestSettin8.footer) === null || _this$oManifestSettin9 === void 0 ? void 0 : _this$oManifestSettin9.actions) || {};
    }

    /**
     * Retrieves the variant management as defined in the manifest.
     *
     * @returns A type of variant management
     */;
    _proto.getVariantManagement = function getVariantManagement() {
      return this.oManifestSettings.variantManagement || VariantManagementType.None;
    }

    /**
     * Retrieves the annotation Path for the SPV in the manifest.
     *
     * @returns The annotation path for the default SPV or undefined.
     */;
    _proto.getDefaultTemplateAnnotationPath = function getDefaultTemplateAnnotationPath() {
      return this.oManifestSettings.defaultTemplateAnnotationPath;
    }

    /**
     * Retrieves the control configuration as defined in the manifest for a specific annotation path.
     *
     * @param sAnnotationPath The relative annotation path
     * @returns The control configuration
     */;
    _proto.getControlConfiguration = function getControlConfiguration(sAnnotationPath) {
      var _this$oManifestSettin10, _this$oManifestSettin11;
      return ((_this$oManifestSettin10 = this.oManifestSettings) === null || _this$oManifestSettin10 === void 0 ? void 0 : (_this$oManifestSettin11 = _this$oManifestSettin10.controlConfiguration) === null || _this$oManifestSettin11 === void 0 ? void 0 : _this$oManifestSettin11[sAnnotationPath]) || {};
    }

    /**
     * Retrieves the configured settings for a given navigation target.
     *
     * @param navigationOrCollectionName The name of the navigation to check
     * @returns The navigation settings configuration
     */;
    _proto.getNavigationConfiguration = function getNavigationConfiguration(navigationOrCollectionName) {
      var _this$oManifestSettin12, _this$oManifestSettin13;
      return ((_this$oManifestSettin12 = this.oManifestSettings) === null || _this$oManifestSettin12 === void 0 ? void 0 : (_this$oManifestSettin13 = _this$oManifestSettin12.navigation) === null || _this$oManifestSettin13 === void 0 ? void 0 : _this$oManifestSettin13[navigationOrCollectionName]) || {};
    }

    /**
     * Retrieves the view level.
     *
     * @returns The current view level
     */;
    _proto.getViewLevel = function getViewLevel() {
      var _this$oManifestSettin14;
      return ((_this$oManifestSettin14 = this.oManifestSettings) === null || _this$oManifestSettin14 === void 0 ? void 0 : _this$oManifestSettin14.viewLevel) || -1;
    }

    /**
     * Retrieves the contentDensities setting of the application.
     *
     * @returns The current content density
     */;
    _proto.getContentDensities = function getContentDensities() {
      var _this$oManifestSettin15;
      return ((_this$oManifestSettin15 = this.oManifestSettings) === null || _this$oManifestSettin15 === void 0 ? void 0 : _this$oManifestSettin15.contentDensities) || {
        cozy: false,
        compact: false
      };
    }

    /**
     * Checks whether we are in FCL mode or not.
     *
     * @returns `true` if we are in FCL
     */;
    _proto.isFclEnabled = function isFclEnabled() {
      var _this$oManifestSettin16;
      return !!((_this$oManifestSettin16 = this.oManifestSettings) !== null && _this$oManifestSettin16 !== void 0 && _this$oManifestSettin16.fclEnabled);
    }

    /**
     * Checks whether the current settings (application / shell) allows us to use condensed layout.
     *
     * @returns `true` if we can use the condensed layout, false otherwise
     */;
    _proto.isCondensedLayoutCompliant = function isCondensedLayoutCompliant() {
      var _this$oManifestSettin17, _this$oManifestSettin18;
      const manifestContentDensity = ((_this$oManifestSettin17 = this.oManifestSettings) === null || _this$oManifestSettin17 === void 0 ? void 0 : _this$oManifestSettin17.contentDensities) || {
        cozy: false,
        compact: false
      };
      const shellContentDensity = ((_this$oManifestSettin18 = this.oManifestSettings) === null || _this$oManifestSettin18 === void 0 ? void 0 : _this$oManifestSettin18.shellContentDensity) || "compact";
      let isCondensedLayoutCompliant = true;
      const isSmallDevice = !Device.system.desktop || Device.resize.width <= 320;
      if ((manifestContentDensity === null || manifestContentDensity === void 0 ? void 0 : manifestContentDensity.cozy) === true && (manifestContentDensity === null || manifestContentDensity === void 0 ? void 0 : manifestContentDensity.compact) !== true || shellContentDensity === "cozy" || isSmallDevice) {
        isCondensedLayoutCompliant = false;
      }
      return isCondensedLayoutCompliant;
    }

    /**
     * Checks whether the current settings (application / shell) uses compact mode as content density.
     *
     * @returns `true` if compact mode is set as content density, false otherwise
     */;
    _proto.isCompactType = function isCompactType() {
      var _this$oManifestSettin19;
      const manifestContentDensity = this.getContentDensities();
      const shellContentDensity = ((_this$oManifestSettin19 = this.oManifestSettings) === null || _this$oManifestSettin19 === void 0 ? void 0 : _this$oManifestSettin19.shellContentDensity) || "compact";
      return manifestContentDensity.compact !== false || shellContentDensity === "compact" ? true : false;
    }

    //region OP Specific

    /**
     * Retrieves the section layout defined in the manifest.
     *
     * @returns The type of section layout of the object page
     */;
    _proto.getSectionLayout = function getSectionLayout() {
      return this.oManifestSettings.sectionLayout ?? "Tabs";
    }

    /**
     * Retrieves the sections defined in the manifest.
     *
     * @returns A set of manifest sections indexed by an iterable key
     */;
    _proto.getSections = function getSections() {
      var _this$oManifestSettin20, _this$oManifestSettin21, _content2, _content2$body;
      return this.mergeFn({}, (_this$oManifestSettin20 = this.oManifestSettings.controlConfiguration) === null || _this$oManifestSettin20 === void 0 ? void 0 : (_this$oManifestSettin21 = _this$oManifestSettin20["@com.sap.vocabularies.UI.v1.Facets"]) === null || _this$oManifestSettin21 === void 0 ? void 0 : _this$oManifestSettin21.sections, (_content2 = this.oManifestSettings.content) === null || _content2 === void 0 ? void 0 : (_content2$body = _content2.body) === null || _content2$body === void 0 ? void 0 : _content2$body.sections);
    }

    /**
     * Returns true of the header of the application is editable and should appear in the facets.
     *
     * @returns `true` if the header if editable
     */;
    _proto.isHeaderEditable = function isHeaderEditable() {
      return this.getShowObjectPageHeader() && !!this.oManifestSettings.editableHeaderContent;
    }

    /**
     * Returns true if we should show the object page header.
     *
     * @returns `true` if the header should be displayed
     */;
    _proto.getShowAnchorBar = function getShowAnchorBar() {
      var _content3, _content3$header, _content4, _content4$header;
      return ((_content3 = this.oManifestSettings.content) === null || _content3 === void 0 ? void 0 : (_content3$header = _content3.header) === null || _content3$header === void 0 ? void 0 : _content3$header.anchorBarVisible) !== undefined ? !!((_content4 = this.oManifestSettings.content) !== null && _content4 !== void 0 && (_content4$header = _content4.header) !== null && _content4$header !== void 0 && _content4$header.anchorBarVisible) : true;
    }

    /**
     * Defines whether or not the section will be displayed in different tabs.
     *
     * @returns `true` if the icon tab bar should be used instead of scrolling
     */;
    _proto.useIconTabBar = function useIconTabBar() {
      return this.getShowAnchorBar() && this.oManifestSettings.sectionLayout === "Tabs";
    }

    /**
     * Returns true if the object page header is to be shown.
     *
     * @returns `true` if the object page header is to be displayed
     */;
    _proto.getShowObjectPageHeader = function getShowObjectPageHeader() {
      var _content5, _content5$header, _content6, _content6$header;
      return ((_content5 = this.oManifestSettings.content) === null || _content5 === void 0 ? void 0 : (_content5$header = _content5.header) === null || _content5$header === void 0 ? void 0 : _content5$header.visible) !== undefined ? !!((_content6 = this.oManifestSettings.content) !== null && _content6 !== void 0 && (_content6$header = _content6.header) !== null && _content6$header !== void 0 && _content6$header.visible) : true;
    }

    /**
     * Returns whether the lazy loader should be enabled for this page or not.
     *
     * @returns `true` if the lazy loader should be enabled
     */;
    _proto.getEnableLazyLoading = function getEnableLazyLoading() {
      return this.oManifestSettings.enableLazyLoading ?? false;
    }

    //endregion OP Specific

    //region LR Specific

    /**
     * Retrieves the multiple view configuration from the manifest.
     *
     * @returns The views that represent the manifest object
     */;
    _proto.getViewConfiguration = function getViewConfiguration() {
      return this.oManifestSettings.views;
    }

    /**
     * Retrieves the stickyMultiTabHeader configuration from the manifest.
     *
     * @returns Returns True if stickyMultiTabHeader is enabled or undefined
     */;
    _proto.getStickyMultiTabHeaderConfiguration = function getStickyMultiTabHeaderConfiguration() {
      const bStickyMultiTabHeader = this.oManifestSettings.stickyMultiTabHeader;
      return bStickyMultiTabHeader !== undefined ? bStickyMultiTabHeader : true;
    }

    /**
     * Retrieves the KPI configuration from the manifest.
     *
     * @returns Returns a map between KPI names and their respective configuration
     */;
    _proto.getKPIConfiguration = function getKPIConfiguration() {
      return this.oManifestSettings.keyPerformanceIndicators || {};
    }

    /**
     * Retrieves the filter configuration from the manifest.
     *
     * @returns The filter configuration from the manifest
     */;
    _proto.getFilterConfiguration = function getFilterConfiguration() {
      return this.getControlConfiguration("@com.sap.vocabularies.UI.v1.SelectionFields");
    }

    /**
     * Returns true if there are multiple entity sets to be displayed.
     *
     * @returns `true` if there are multiple entity sets
     */;
    _proto.hasMultipleEntitySets = function hasMultipleEntitySets() {
      const viewConfig = this.getViewConfiguration() || {
        paths: []
      };
      const manifestEntitySet = this.oManifestSettings.entitySet;
      return viewConfig.paths.find(path => {
        var _path;
        if ((_path = path) !== null && _path !== void 0 && _path.template) {
          return undefined;
        } else if (this.hasMultipleVisualizations(path)) {
          const {
            primary,
            secondary
          } = path;
          return primary.some(primaryPath => primaryPath.entitySet && primaryPath.entitySet !== manifestEntitySet) || secondary.some(secondaryPath => secondaryPath.entitySet && secondaryPath.entitySet !== manifestEntitySet);
        } else {
          path = path;
          return path.entitySet && path.entitySet !== manifestEntitySet;
        }
      }) !== undefined;
    }

    /**
     * Returns the context path for the template if it is specified in the manifest.
     *
     * @returns The context path for the template
     */;
    _proto.getContextPath = function getContextPath() {
      var _this$oManifestSettin22;
      return (_this$oManifestSettin22 = this.oManifestSettings) === null || _this$oManifestSettin22 === void 0 ? void 0 : _this$oManifestSettin22.contextPath;
    }

    /**
     * Returns true if there are multiple visualizations.
     *
     * @param path The path from the view
     * @returns `true` if there are multiple visualizations
     */;
    _proto.hasMultipleVisualizations = function hasMultipleVisualizations(path) {
      var _primary2, _secondary2;
      if (!path) {
        const viewConfig = this.getViewConfiguration() || {
          paths: []
        };
        return viewConfig.paths.some(viewPath => {
          var _primary, _secondary;
          return ((_primary = viewPath.primary) === null || _primary === void 0 ? void 0 : _primary.length) > 0 && ((_secondary = viewPath.secondary) === null || _secondary === void 0 ? void 0 : _secondary.length) > 0;
        });
      }
      return ((_primary2 = path.primary) === null || _primary2 === void 0 ? void 0 : _primary2.length) > 0 && ((_secondary2 = path.secondary) === null || _secondary2 === void 0 ? void 0 : _secondary2.length) > 0;
    }

    /**
     * Retrieves the entity set defined in the manifest.
     *
     * @returns The entity set defined in the manifest
     */;
    _proto.getEntitySet = function getEntitySet() {
      return this.oManifestSettings.entitySet;
    }

    //end region LR Specific
    ;
    return ManifestWrapper;
  }();
  return ManifestWrapper;
}, false);
