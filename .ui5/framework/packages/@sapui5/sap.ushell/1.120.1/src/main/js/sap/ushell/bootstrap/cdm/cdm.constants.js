// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
sap.ui.define([
    "../common/common.util"
], function (oCommonBootUtil) {
    "use strict";

    return oCommonBootUtil.deepFreeze({
        // default ushell config object with all local adapters configured which
        // are not available for CDM, yet
        defaultConfig: {
            defaultRenderer: "fiori2",
            ushell: {
                home: {
                    tilesWrappingType: "Hyphenated"
                },
                customPreload: {
                    enabled: true,
                    coreResources: [
                        "sap/ushell/bootstrap/core-min-0.js",
                        "sap/ushell/bootstrap/core-min-1.js",
                        "sap/ushell/bootstrap/core-min-2.js",
                        "sap/ushell/bootstrap/core-min-3.js"
                    ],
                    coreResourcesComplement: [
                        "sap/ushell/preload-bundles/core-ext-light-0.js",
                        "sap/ushell/preload-bundles/core-ext-light-1.js",
                        "sap/ushell/preload-bundles/core-ext-light-2.js",
                        "sap/ushell/preload-bundles/core-ext-light-3.js"
                    ]
                }
            },
            renderers: {
                fiori2: {
                    componentData: {
                        config: {
                            sessionTimeoutReminderInMinutes: 5,
                            sessionTimeoutIntervalInMinutes: -1,
                            sessionTimeoutTileStopRefreshIntervalInMinutes: 15,
                            enableAutomaticSignout: true,
                            enableHideGroups: true,
                            enablePersonalization: true,
                            enableAbout: true,
                            enableTagFiltering: false,
                            enableSearch: false,
                            searchBusinessObjects: false,
                            enableSetTheme: true,
                            enableAccessibility: true,
                            enableHelp: false,
                            enableUserDefaultParameters: true,
                            enableRecentActivity: true,
                            enableRecentActivityLogging: true,
                            preloadLibrariesForRootIntent: false,
                            applications: {
                                "Shell-home": {
                                    enableEasyAccess: false,
                                    enableTileActionsIcon: false,
                                    enableHideGroups: false
                                }
                            },
                            rootIntent: "Shell-home"
                        }
                    }
                }
            },
            services: {
                Container: {
                    adapter: {
                        config: {
                            userProfile: {
                                metadata: {
                                    ranges: {
                                        theme: {
                                            sap_horizon: {
                                                displayName: "SAP Morning Horizon",
                                                themeRoot: ""
                                            },
                                            sap_horizon_dark: {
                                                displayName: "SAP Evening Horizon",
                                                themeRoot: ""
                                            },
                                            sap_horizon_hcb: {
                                                displayName: "SAP HCB (SAP Horizon)",
                                                themeRoot: ""
                                            },
                                            sap_horizon_hcw: {
                                                displayName: "SAP HCW (SAP Horizon)",
                                                themeRoot: ""
                                            }
                                        }
                                    }
                                },
                                defaults: {
                                    theme: "sap_belize"
                                }
                            }
                        }
                    }
                },
                Personalization: {
                    adapter: {
                        module: "sap.ushell.adapters.local.PersonalizationAdapter"
                    }
                },
                AppState: {
                    adapter: {
                        module: "sap.ushell.adapters.local.AppStateAdapter"
                    },
                    config: {
                        transient: true
                    }
                },
                NavTargetResolution: {
                    config: {
                        allowTestUrlComponentConfig: false,
                        enableClientSideTargetResolution: true
                    },
                    adapter: {
                        module: "sap.ushell.adapters.local.NavTargetResolutionAdapter"
                    }
                },
                SupportTicket: {
                    config: {
                        enabled: false
                    },
                    adapter: {
                        module: "sap.ushell.adapters.local.SupportTicketAdapter"
                    }
                },
                UserInfo: {
                    adapter: {
                        module: "sap.ushell.adapters.local.UserInfoAdapter"
                    }
                },
                UserDefaultParameterPersistence: {
                    adapter: {
                        module: "sap.ushell.adapters.local.UserDefaultParameterPersistenceAdapter"
                    }
                },
                NavigationDataProvider: {
                    adapter: {
                        module: "sap.ushell.adapters.cdm.ClientSideTargetResolutionAdapter"
                    }
                },
                VisualizationDataProvider: {
                    adapter: {
                        module: "sap.ushell.adapters.cdm.v3.LaunchPageAdapter"
                    }
                }
            },
            ui5: {
                libs: {
                    "sap.ui.core": true,
                    "sap.m": true,
                    "sap.ushell": true
                }
            }
        }
    });
});