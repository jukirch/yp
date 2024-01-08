// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview Sync Shell View
 *
 * @deprecated since 1.110
 */
 sap.ui.define([
    "sap/base/Log",
    "sap/ui/Device",
    "sap/ushell/components/_HeaderManager/ControlManager",
    "sap/ushell/components/_HeaderManager/ShellHeader.controller",
    "sap/ushell/ui/launchpad/AccessibilityCustomData",
    "sap/ushell/EventHub",
    "sap/ushell/resources",
    "sap/ushell/utils",
    "sap/ushell/Config",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/mvc/XMLView",
    "sap/ui/core/Core",
    "sap/ushell/renderer/ShellLayout"
], function (
    Log,
    Device,
    HeaderControlManager,
    ShellHeaderController,
    AccessibilityCustomData,
    EventHub,
    resources,
    utils,
    Config,
    JSONModel,
    XMLView,
    Core,
    ShellLayout
) {
    "use strict";

    var ShellLayoutMapping = ShellLayout.LAYOUT_MAPPING;

    var BINDING_TYPE = {
        Property: "Property",
        List: "List"
    };

    function fnShellUpdateAggItem (sId, oContext) {
        return sap.ui.getCore().byId(oContext.getObject());
    }

    // eslint-disable-next-line ushell/no-deprecated
    sap.ui.jsview("sap.ushell.renderers.fiori2.Shell", { // LEGACY API (deprecated)
        getControllerName: function () {
            return "sap.ushell.renderers.fiori2.Shell";
        },

        waitForShellLayout: function () {
            if (!this._oShellLayoutPromise) {
                this._oShellLayoutPromise = new Promise(function (resolve) {
                    this.getController().addDoable(EventHub.once("ShellLayoutApplied").do(resolve));
                }.bind(this));
            }
            return this._oShellLayoutPromise;
        },

        getShellModel: function () {
            return this.getViewData().shellModel;
        },

        getHelperModel: function () {
            return this.getViewData().helperModel;
        },

        getViewDataConfig: function () {
            var oViewData = this.getViewData() || {};
            var oConfig = oViewData.config || {};
            return oConfig;
        },

        /**
         * Most of the following code acts just as placeholder for new Unified Shell Control.
         * renderers/fiori2/Shell.view.js uses deprecated and synchronous APIs. It is replaced by renderer/Shell.view.js
         *
         * @returns {sap.ui.core.Control} The root control of the Renderer
         *
         * @deprecated since 1.99. Please use {@link sap.ushell.renderer.Shell.view} instead.
         */
        createContent: function () {
            // Change config if more then three buttons moved to the header
            this._allowUpToThreeActionInShellHeader();

            // BackgroundImage
            this.initBackgroundImage();

            // ShellHeader + HeaderControlManager.init
            this.createShellHeaderSync();

            // NavigationBar
            this.setNavigationBarMinHeight();

            // RendererRootView / viewPortContainer
            var oRendererRootView = this.createRendererRootViewSync();

            this.initCanvasShapesManager();

            this.setDisplayBlock(true);

            utils.setPerformanceMark("FLP - Shell.view rendering started!");

            return oRendererRootView;
        },

        initBackgroundImage: function () {
            this.waitForShellLayout().then(function () {
                var oDomRef = document.getElementById(ShellLayoutMapping.BackgroundImage);
                var sBackgroundHtml = [
                    // "Shell Canvas" category in ThemeDesigner
                    "<div class='sapUiShellBackgroundImage sapUiGlobalBackgroundImageForce sapContrastPlus'></div>",
                    // "Application Background" category in ThemeDesigner
                    "<div class='sapMShellBG sapUiGlobalBackgroundImage'></div>"
                ].join("\n");
                oDomRef.insertAdjacentHTML("afterbegin", sBackgroundHtml);
            });
        },

        createRendererRootViewSync: function () {
            var oController = this.getController();
            // eslint-disable-next-line ushell/no-deprecated
            var oRendererRootView = sap.ui.xmlfragment("sap.ushell.ui.RendererRootView", oController); // LEGACY API (deprecated)
            oRendererRootView.updateAggregation = this.updateShellAggregation;

            sap.ui.getCore().byId("viewPortContainer");

            return oRendererRootView;
        },

        createShellHeaderSync: function () {
            var oConfig = this.getViewDataConfig();
            var oShellModel = this.getShellModel();
            // Create own model for the header
            var oShellHeaderModel = Config.createModel("/core/shellHeader", JSONModel);
            var oHeaderController = new ShellHeaderController();
            oHeaderController.onInit();

            // eslint-disable-next-line ushell/no-deprecated
            var oShellHeader = sap.ui.xmlfragment("sap.ushell.ui.ShellHeader", oHeaderController); // LEGACY API (deprecated)
            oShellHeader.updateAggregation = this.updateShellAggregation;
            HeaderControlManager.init(oConfig, oHeaderController, oShellModel);

            if (oConfig.appState === "embedded") {
                oShellHeader.setNoLogo();
            }

            // Assign models to the Shell Header
            oShellHeader.setModel(oShellHeaderModel);
            oShellHeader.setModel(resources.i18nModel, "i18n");
            this.addDanglingControl(oShellHeader);
            // save for later use
            this._oShellHeader = oShellHeader;

            this.waitForShellLayout().then(function () {
                oShellHeader.placeAt(ShellLayoutMapping.ShellHeader, "only");
            });
            return oShellHeader;
        },

        setNavigationBarMinHeight: function () {
            return sap.ushell.Container.getServiceAsync("Menu")
                .then(function (oMenuService) {
                    return oMenuService.isMenuEnabled();
                }).then(function (bMenuEnabled) {
                    if (!bMenuEnabled) {
                        return;
                    }

                    this.waitForShellLayout().then(function () {
                        var navigationBar = document.getElementById(ShellLayoutMapping.NavigationBar);
                        navigationBar.classList.add("sapUshellMenuBarHeight");
                    });
                }.bind(this))
                .catch(function (vError) {
                    Log.info("Could not apply min-height of the navigationBar", vError);
                });
        },

        createRightFloatingContainer: function () {
            sap.ui.require(["sap/ushell/ui/shell/RightFloatingContainer"], function (RightFloatingContainer) {
                var oRightFloatingContainer = new RightFloatingContainer({
                    id: "right-floating-container",
                    top: "2",
                    hideItemsAfterPresentation: true,
                    visible: "{/currentState/showRightFloatingContainer}",
                    floatingContainerItems: {
                        path: "/currentState/RightFloatingContainerItems",
                        factory: fnShellUpdateAggItem
                    }
                });
                oRightFloatingContainer.updateAggregation = this.updateShellAggregation;

                oRightFloatingContainer.setModel(this.getShellModel());
                this.addDanglingControl(oRightFloatingContainer);
                // save for later use
                this._oRightFloatingContainer = oRightFloatingContainer;

                this.waitForShellLayout().then(function () {
                    oRightFloatingContainer.placeAt(ShellLayoutMapping.RightFloatingContainer, "only");
                });
            }.bind(this));
        },

        initCanvasShapesManager: function () {
            this.bindFactory({
                model: this.getShellModel(),
                factory: this.createCanvasShapesManager.bind(this),
                bindingPath: "/enableBackGroundShapes",
                bindingType: BINDING_TYPE.Property,
                valueCheck: function (bValue) {
                    return !!bValue;
                }
            });
        },

        createCanvasShapesManager: function () {
            var iInterval = setInterval(function () {
                if (Core.isThemeApplied()) {
                    clearInterval(iInterval);
                    sap.ui.require(["sap/ushell/CanvasShapesManager"], function (CanvasShapesManager) {
                        CanvasShapesManager.drawShapes();
                    });
                }
            }, 200);
        },

        createSubHeader: function () {
            sap.ui.require(["sap/ushell/ui/shell/SubHeader"], function (SubHeader) {
                var oSubHeader = new SubHeader({
                    id: "subhdr",
                    content: {
                        path: "/currentState/subHeader",
                        factory: fnShellUpdateAggItem
                    }
                });
                oSubHeader.updateAggregation = this.updateShellAggregation;

                oSubHeader.setModel(this.getShellModel());
                this.addDanglingControl(oSubHeader);

                this.waitForShellLayout().then(function () {
                    oSubHeader.placeAt(ShellLayoutMapping.SubHeader, "only");
                });
            }.bind(this));
        },

        createFloatingContainer: function () {
            return new Promise(function (resolve, reject) {
                sap.ui.require([
                    "sap/ushell/ui/shell/FloatingContainer",
                    "sap/ui/util/Storage"
                ], function (FloatingContainer, Storage) {
                    var oFloatingContainer = new FloatingContainer({
                        id: "shell-floatingContainer",
                        visible: "{helper>/shell/floatingContainerVisible}",
                        content: {
                            path: "/currentState/floatingContainerContent",
                            factory: fnShellUpdateAggItem
                        }
                    });
                    oFloatingContainer.updateAggregation = this.updateShellAggregation;

                    if (Device.system.desktop) {
                        // add tabindex for the floating container so it can be tab/f6
                        oFloatingContainer.addCustomData(new AccessibilityCustomData({
                            key: "tabindex",
                            value: "-1",
                            writeToDom: true
                        }));
                    }

                    oFloatingContainer.setModel(this.getShellModel());
                    oFloatingContainer.setModel(this.getHelperModel(), "helper");
                    this.addDanglingControl(oFloatingContainer);

                    this.waitForShellLayout().then(function () {
                        oFloatingContainer.placeAt(ShellLayoutMapping.FloatingContainer, "only");

                        var oStorage = new Storage(Storage.Type.local, "com.sap.ushell.adapters.local.FloatingContainer");
                        var oFloatingContainerWrapper = document.getElementById(ShellLayoutMapping.FloatingContainer);

                        var bFirstTimeRender = !oFloatingContainerWrapper.classList.contains("sapUshellFloatingContainerWrapper");
                        var sCssStyles = oStorage.get("floatingContainerStyle");

                        if (bFirstTimeRender && !sCssStyles) {
                            var emSize = jQuery(".sapUshellShellHeadItm").position() ? jQuery(".sapUshellShellHeadItm").position().left : 0;
                            var iLeftPos = (jQuery(window).width() - jQuery("#shell-floatingContainer").width() - emSize) * 100 / jQuery(window).width();
                            var iTopPos = jQuery(".sapUshellShellHeader").height() * 100 / jQuery(window).height();
                            oFloatingContainerWrapper.style.left = iLeftPos + "%";
                            oFloatingContainerWrapper.style.top = iTopPos + "%";
                            oFloatingContainerWrapper.style.position = "absolute";
                            oStorage.put("floatingContainerStyle", oFloatingContainerWrapper.style.cssText);

                        } else if (sCssStyles) {
                            oFloatingContainerWrapper.style.cssText = sCssStyles;
                        }

                        oFloatingContainerWrapper.classList.add("sapUshellFloatingContainerWrapper");

                        resolve();
                    });
                }.bind(this));
            }.bind(this));
        },

        createSidePane: function () {
            sap.ui.require(["sap/ushell/ui/shell/SidePane"], function (SidePane) {
                var oSidePane = new SidePane({
                    id: "shell-sidePane",
                    visible: "{/currentState/showPane}",
                    content: {
                        path: "/currentState/paneContent",
                        factory: fnShellUpdateAggItem
                    }
                });
                oSidePane.updateAggregation = this.updateShellAggregation;

                oSidePane.setModel(this.getShellModel());
                this.addDanglingControl(oSidePane);

                this.waitForShellLayout().then(function () {
                    oSidePane.placeAt(ShellLayoutMapping.SidePane, "only");
                });
            }.bind(this));
        },

        createToolArea: function () {
            sap.ui.require(["sap/ushell/ui/shell/ToolArea"], function (ToolArea) {
                var oShellToolArea = new ToolArea({
                    id: "shell-toolArea",
                    visible: "{/currentState/toolAreaVisible}",
                    toolAreaItems: {
                        path: "/currentState/toolAreaItems",
                        factory: fnShellUpdateAggItem
                    }
                });
                oShellToolArea.updateAggregation = this.updateShellAggregation;

                oShellToolArea.setModel(this.getShellModel());
                this.addDanglingControl(oShellToolArea);

                this.waitForShellLayout().then(function () {
                    oShellToolArea.placeAt(ShellLayoutMapping.ToolArea, "only");
                });
            }.bind(this));
        },

        createFloatingActions: function () {
            sap.ui.require(["sap/ushell/ui/shell/ShellFloatingActions"], function (ShellFloatingActions) {
                var oShellFloatingActions = new ShellFloatingActions({
                    id: "shell-floatingActions",
                    floatingActions: {
                        path: "/currentState/floatingActions",
                        factory: fnShellUpdateAggItem
                    }
                });
                oShellFloatingActions.updateAggregation = this.updateShellAggregation;

                oShellFloatingActions.setModel(this.getShellModel());
                this.addDanglingControl(oShellFloatingActions);

                this.waitForShellLayout().then(function () {
                    oShellFloatingActions.placeAt(ShellLayoutMapping.FloatingActions, "only");
                });
            }.bind(this));
        },

        initAllMyAppsView: function () {
            return sap.ushell.Container.getServiceAsync("AllMyApps").then(function (oAllMyApps) {
                if (oAllMyApps.isEnabled()) {
                    return this.createAllMyAppsView();
                }
            }.bind(this));
        },

        createAllMyAppsView: function () {
            return XMLView.create({
                id: "allMyAppsView",
                viewName: "sap.ushell.renderer.allMyApps.AllMyApps"
            }).then(function (allMyAppsView) {
                allMyAppsView.setModel(this.getShellModel());
                allMyAppsView.setModel(resources.i18nModel, "i18n");
                allMyAppsView.addCustomData(new AccessibilityCustomData({
                    key: "aria-label",
                    value: resources.i18n.getText("allMyApps_headerTitle"),
                    writeToDom: true
                }));
                this.addDanglingControl(allMyAppsView);
                this.getShellHeader().getAppTitle().setAllMyApps(allMyAppsView);
            }.bind(this));
        },

        /**
         * Begin factory functions for lazy instantiation of Shell Layout controls
         */
        createPostCoreExtControls: function () {
            var oShellModel = this.getShellModel();

            // apply the highest z-index used by the shell
            sap.ui.require(["sap/ui/core/Popup"], function (Popup) {
                Popup.setInitialZIndex(11);
            });

            // RightFloatingContainer
            this.bindFactory({
                model: oShellModel,
                factory: this.createRightFloatingContainer.bind(this),
                bindingPath: "/currentState/showRightFloatingContainer",
                bindingType: BINDING_TYPE.Property,
                valueCheck: function (bValue) {
                    return !!bValue;
                }
            });

            // SubHeader
            this.bindFactory({
                model: oShellModel,
                factory: this.createSubHeader.bind(this),
                bindingPath: "/currentState/subHeader",
                bindingType: BINDING_TYPE.List,
                valueCheck: function (aValues) {
                    return !!aValues.length;
                }
            });

            // ToolArea
            this.bindFactory({
                model: oShellModel,
                factory: this.createToolArea.bind(this),
                bindingPath: "/currentState/toolAreaVisible",
                bindingType: BINDING_TYPE.Property,
                valueCheck: function (bValue) {
                    return !!bValue;
                }
            });

            // (Left)SidePane
            this.bindFactory({
                model: oShellModel,
                factory: this.createSidePane.bind(this),
                bindingPath: "/currentState/showPane",
                bindingType: BINDING_TYPE.Property,
                valueCheck: function (bValue) {
                    return !!bValue;
                }
            });

            // FloatingActions (deprecated)
            this.bindFactory({
                model: oShellModel,
                factory: this.createFloatingActions.bind(this),
                bindingPath: "/currentState/floatingActions",
                bindingType: BINDING_TYPE.List,
                valueCheck: function (aValues) {
                    return !!aValues.length;
                }
            });

            this.addPendingInitialization(this.initAllMyAppsView());
        },

        /**
         * allow up to 3 actions in shell header
         */
        _allowUpToThreeActionInShellHeader: function () {
            var oConfig = this.getViewDataConfig();
            // in order to save performance time when these properties are not defined
            if (Object.keys(oConfig).length > 3) {
                var aParameter = [
                    "moveAppFinderActionToShellHeader",
                    "moveUserSettingsActionToShellHeader",
                    "moveContactSupportActionToShellHeader",
                    "moveEditHomePageActionToShellHeader"
                ];
                var count = 0;
                var sParameter;

                // count the number of "true" values, once get to three, force the other to be "false"
                for (var index = 0; index < 5; index++) {
                    sParameter = aParameter[index];
                    if (count === 3) {
                        // if 3 user actions have already been moved to the shell header, assign false to every other parameter
                        oConfig[sParameter] = false;
                    } else if (oConfig[sParameter]) {
                        count++;
                    }
                }
            }
        },

        /**
         * @returns {sap.ui.core.Control} The ShellHeader
         *
         * @private
         * @ui5-restricted sap.ui.rta
         * @since 1.114.0
         */
        getShellHeader: function () {
            return this._oShellHeader;
        },

        getRightFloatingContainer: function () {
            return this._oRightFloatingContainer;
        },

        updateShellAggregation: function (sName) {
            var oBindingInfo = this.mBindingInfos[sName];
            var oAggregationInfo = this.getMetadata().getJSONKeys()[sName];
            var oClone;

            this[oAggregationInfo._sGetter]().forEach(function (v) {
                this[oAggregationInfo._sRemoveMutator](v);
            }.bind(this));
            oBindingInfo.binding.getContexts().forEach(function (v, i) {
                oClone = oBindingInfo.factory(this.getId() + "-" + i, v)
                    ? oBindingInfo.factory(this.getId() + "-" + i, v).setBindingContext(v, oBindingInfo.model)
                    : "";
                this[oAggregationInfo._sMutator](oClone);
            }.bind(this));
        },

        /**
         * Executes the factory instantly in case the <code>model already fulfills the valueCheck.
         * Otherwise binds the factory against the model path.
         * Once the binding fulfills the valueCheck the binding gets destroyed.
         *
         * @param {object} oSettings The settings
         * @param {sap.ui.model.Model} oSettings.model The model
         * @param {function} oSettings.factory The handler which gets executed
         * @param {string} oSettings.bindingPath The binding path
         * @param {string} oSettings.bindingType The type of binding. Either "Property" or "List".
         * @param {function} oSettings.valueCheck The check function.
         *  it receives the bound property as argument. It should return true once the value fulfills the requirements.
         *
         * @private
         * @since 1.115.0
         */
        bindFactory: function (oSettings) {
            var oModel = oSettings.model;
            var fnFactory = oSettings.factory;
            var sPath = oSettings.bindingPath;
            var sBindingType = oSettings.bindingType;
            var fnValueCheck = oSettings.valueCheck;

            var vValue = oModel.getProperty(sPath);
            if (fnValueCheck(vValue)) {
                fnFactory();
            } else {
                var oBinding;
                switch (sBindingType) {
                    case BINDING_TYPE.List:
                        oBinding = oModel.bindList(sPath);
                        break;
                    default: // BINDING_TYPE.Property
                        oBinding = oModel.bindProperty(sPath);
                }
                this.addDanglingBinding(oBinding);
                oBinding.attachChange(function () {
                    vValue = oBinding.getModel().getProperty(oBinding.getPath());
                    if (fnValueCheck(vValue)) {
                        this.removeDanglingBinding(oBinding);
                        oBinding.destroy();
                        fnFactory();
                    }
                }, this);
            }
        },

        /**
         * Adds a binding which is destroyed on Renderer destroy
         * @param {sap.ui.model.Binding} oBinding The Binding
         * @see sap.ushell.renderer.Shell.controller#onExit
         *
         * @private
         * @since 1.114.0
         */
        addDanglingBinding: function (oBinding) {
            this.getController().addDanglingBinding(oBinding);
        },

        /**
         * @param {sap.ui.model.Binding} oBinding The Binding
         * @see sap.ushell.renderer.Shell.controller#onExit
         *
         * @private
         * @since 1.114.0
         */
        removeDanglingBinding: function (oBinding) {
            this.getController().removeDanglingBinding(oBinding);
        },

        /**
         * @param {sap.ui.core.Control} oControl The Control
         * @see sap.ushell.renderer.Shell.controller#onExit
         *
         * @private
         * @since 1.114.0
         */
        addDanglingControl: function (oControl) {
            this.getController().addDanglingControl(oControl);
        },

        /**
         * Adds a promise to the list of initializations
         * Only used in test environments!
         * @param {Promise} oPromise A Promise
         * @returns {Promise} Returns the provided promise to allow chaining
         *
         * @private
         * @since 1.114.0
         */
        addPendingInitialization: function (oPromise) {
            return this.getController().addPendingInitialization(oPromise);
        }
    });
});
