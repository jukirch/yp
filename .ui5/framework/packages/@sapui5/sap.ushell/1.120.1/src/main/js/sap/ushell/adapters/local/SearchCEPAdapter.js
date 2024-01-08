// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview The Unified Shell's Search adapter for CEP Search
 *
 * @version 1.120.1
 */
/*eslint-disable quote-props*/
sap.ui.define([], function () {
    "use strict";

    var SearchCEPAdapter = function (oSystem, sParameters, oConfig) {
        this._oConfig = (oConfig && oConfig.config) || {};
    };

    SearchCEPAdapter.prototype.search = function (oParameters) {
        var oSearchResult = [
            {
                "title": "App For On Close",
                "description": "",
                "keywords": "App For On Close",
                "icon": "sap-icon://business-objects-experience",
                "label": "App For On Close",
                "visualization": {
                    "id": "demoapps.AppBeforeCloseEvent.AppBeforeCloseEvent",
                    "vizId": "demoapps.AppBeforeCloseEvent.AppBeforeCloseEvent",
                    "vizType": "",
                    "title": "App For On Close",
                    "subtitle": "",
                    "icon": "sap-icon://business-objects-experience",
                    "info": "iframe",
                    "keywords": [
                        "App For On Close"
                    ],
                    "technicalAttributes": [],
                    "target": {
                        "type": "URL",
                        "url": "#AppBeforeCloseEvent-Action?sap-ui-app-id-hint=demoapps.AppBeforeCloseEvent.AppBeforeCloseEvent"
                    },
                    "targetURL": "#AppBeforeCloseEvent-Action?sap-ui-app-id-hint=demoapps.AppBeforeCloseEvent.AppBeforeCloseEvent",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#AppBeforeCloseEvent-Action?sap-ui-app-id-hint=demoapps.AppBeforeCloseEvent.AppBeforeCloseEvent",
                "technicalAttributes": "",
                "text": "App For On Close"
            },
            {
                "title": "App Nav Sample",
                "description": "",
                "keywords": "App Nav Sample",
                "icon": "sap-icon://business-objects-experience",
                "label": "App Nav Sample",
                "visualization": {
                    "id": "sap.ushell.demo.AppNavSample",
                    "vizId": "sap.ushell.demo.AppNavSample",
                    "vizType": "",
                    "title": "App Nav Sample",
                    "subtitle": "",
                    "icon": "sap-icon://business-objects-experience",
                    "info": "iframe",
                    "keywords": [
                        "App Nav Sample"
                    ],
                    "technicalAttributes": [],
                    "target": {
                        "type": "URL",
                        "url": "#Action-toappnavsample?sap-ui-app-id-hint=sap.ushell.demo.AppNavSample"
                    },
                    "targetURL": "#Action-toappnavsample?sap-ui-app-id-hint=sap.ushell.demo.AppNavSample",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#Action-toappnavsample?sap-ui-app-id-hint=sap.ushell.demo.AppNavSample",
                "technicalAttributes": "",
                "text": "App Nav Sample"
            },
            {
                "title": "App Nav Sample - With Transformation",
                "description": "",
                "keywords": "App Nav Sample - With Transformation",
                "icon": "sap-icon://business-objects-experience",
                "label": "App Nav Sample - With Transformation",
                "visualization": {
                    "id": "sap.ushell.demo.AppNavSampleT",
                    "vizId": "sap.ushell.demo.AppNavSampleT",
                    "vizType": "",
                    "title": "App Nav Sample - With Transformation",
                    "subtitle": "",
                    "icon": "sap-icon://business-objects-experience",
                    "info": "iframe",
                    "keywords": [
                        "App Nav Sample - With Transformation"
                    ],
                    "technicalAttributes": [],
                    "target": {
                        "type": "URL",
                        "url": "#ActionT-toappnavsampleT?sap-ui-app-id-hint=sap.ushell.demo.AppNavSampleT"
                    },
                    "targetURL": "#ActionT-toappnavsampleT?sap-ui-app-id-hint=sap.ushell.demo.AppNavSampleT",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#ActionT-toappnavsampleT?sap-ui-app-id-hint=sap.ushell.demo.AppNavSampleT",
                "technicalAttributes": "",
                "text": "App Nav Sample - With Transformation"
            },
            {
                "title": "App Nav Sample SPA1",
                "description": "",
                "keywords": "App Nav Sample SPA1",
                "icon": "sap-icon://BusinessSuiteInAppSymbols/icon-marked-for-deletion",
                "label": "App Nav Sample SPA1",
                "visualization": {
                    "id": "sap.ushell.demo.AppNavSample-SAP1",
                    "vizId": "sap.ushell.demo.AppNavSample-SAP1",
                    "vizType": "",
                    "title": "App Nav Sample SPA1",
                    "subtitle": "",
                    "icon": "sap-icon://BusinessSuiteInAppSymbols/icon-marked-for-deletion",
                    "info": "SPA",
                    "keywords": [
                        "App Nav Sample SPA1"
                    ],
                    "technicalAttributes": [],
                    "target": {
                        "type": "URL",
                        "url": "#AppNav-SAP1?sap-ui-app-id-hint=sap.ushell.demo.AppNavSample-SAP1"
                    },
                    "targetURL": "#AppNav-SAP1?sap-ui-app-id-hint=sap.ushell.demo.AppNavSample-SAP1",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#AppNav-SAP1?sap-ui-app-id-hint=sap.ushell.demo.AppNavSample-SAP1",
                "technicalAttributes": "",
                "text": "App Nav Sample SPA1"
            },
            {
                "title": "App Nav Sample SPA2",
                "description": "",
                "keywords": "App Nav Sample SPA2",
                "icon": "sap-icon://business-objects-experience",
                "label": "App Nav Sample SPA2",
                "visualization": {
                    "id": "sap.ushell.demo.AppNavSample-SAP2",
                    "vizId": "sap.ushell.demo.AppNavSample-SAP2",
                    "vizType": "",
                    "title": "App Nav Sample SPA2",
                    "subtitle": "",
                    "icon": "sap-icon://business-objects-experience",
                    "info": "SPA",
                    "keywords": [
                        "App Nav Sample SPA2"
                    ],
                    "technicalAttributes": [],
                    "target": {
                        "type": "URL",
                        "url": "#AppNav-SAP2?sap-ui-app-id-hint=sap.ushell.demo.AppNavSample-SAP2"
                    },
                    "targetURL": "#AppNav-SAP2?sap-ui-app-id-hint=sap.ushell.demo.AppNavSample-SAP2",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#AppNav-SAP2?sap-ui-app-id-hint=sap.ushell.demo.AppNavSample-SAP2",
                "technicalAttributes": "",
                "text": "App Nav Sample SPA2"
            },
            {
                "title": "App Nav Sample ui5appruntime min (ABAP)",
                "description": "",
                "keywords": "App Nav Sample ui5appruntime min (ABAP)",
                "icon": "sap-icon://business-objects-experience",
                "label": "App Nav Sample ui5appruntime min (ABAP)",
                "visualization": {
                    "id": "sap.ushell.demo.AppNavSample4",
                    "vizId": "sap.ushell.demo.AppNavSample4",
                    "vizType": "",
                    "title": "App Nav Sample ui5appruntime min (ABAP)",
                    "subtitle": "",
                    "icon": "sap-icon://business-objects-experience",
                    "info": "iframe",
                    "keywords": [
                        "App Nav Sample ui5appruntime min (ABAP)"
                    ],
                    "technicalAttributes": [],
                    "target": {
                        "type": "URL",
                        "url": "#AppNavSample-MinABAP?sap-ui-app-id-hint=sap.ushell.demo.AppNavSample4"
                    },
                    "targetURL": "#AppNavSample-MinABAP?sap-ui-app-id-hint=sap.ushell.demo.AppNavSample4",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#AppNavSample-MinABAP?sap-ui-app-id-hint=sap.ushell.demo.AppNavSample4",
                "technicalAttributes": "",
                "text": "App Nav Sample ui5appruntime min (ABAP)"
            },
            {
                "title": "App Nav Sample ui5appruntime min (CF)",
                "description": "",
                "keywords": "App Nav Sample ui5appruntime min (CF)",
                "icon": "sap-icon://business-objects-experience",
                "label": "App Nav Sample ui5appruntime min (CF)",
                "visualization": {
                    "id": "sap.ushell.demo.AppNavSample3",
                    "vizId": "sap.ushell.demo.AppNavSample3",
                    "vizType": "",
                    "title": "App Nav Sample ui5appruntime min (CF)",
                    "subtitle": "",
                    "icon": "sap-icon://business-objects-experience",
                    "info": "iframe",
                    "keywords": [
                        "App Nav Sample ui5appruntime min (CF)"
                    ],
                    "technicalAttributes": [],
                    "target": {
                        "type": "URL",
                        "url": "#Action-toappnavsample?sap-ui-app-id-hint=sap.ushell.demo.AppNavSample3"
                    },
                    "targetURL": "#Action-toappnavsample?sap-ui-app-id-hint=sap.ushell.demo.AppNavSample3",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#Action-toappnavsample?sap-ui-app-id-hint=sap.ushell.demo.AppNavSample3",
                "technicalAttributes": "",
                "text": "App Nav Sample ui5appruntime min (CF)"
            },
            {
                "title": "App Runtime Renderer API Sample",
                "description": "",
                "keywords": "App Runtime Renderer API Sample",
                "icon": "sap-icon://business-objects-experience",
                "label": "App Runtime Renderer API Sample",
                "visualization": {
                    "id": "sap.ushell.demo.AppRuntimeRendererSample",
                    "vizId": "sap.ushell.demo.AppRuntimeRendererSample",
                    "vizType": "",
                    "title": "App Runtime Renderer API Sample",
                    "subtitle": "",
                    "icon": "sap-icon://business-objects-experience",
                    "info": "iframe",
                    "keywords": [
                        "App Runtime Renderer API Sample"
                    ],
                    "technicalAttributes": [],
                    "target": {
                        "type": "URL",
                        "url": "#Renderer-Sample?sap-ui-app-id-hint=sap.ushell.demo.AppRuntimeRendererSample"
                    },
                    "targetURL": "#Renderer-Sample?sap-ui-app-id-hint=sap.ushell.demo.AppRuntimeRendererSample",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#Renderer-Sample?sap-ui-app-id-hint=sap.ushell.demo.AppRuntimeRendererSample",
                "technicalAttributes": "",
                "text": "App Runtime Renderer API Sample"
            },
            {
                "title": "BB1 Application A",
                "description": "",
                "keywords": "BB1 Application A",
                "icon": "sap-icon://business-objects-experience",
                "label": "BB1 Application A",
                "visualization": {
                    "id": "demoapps.IframeReuseSample.IframeReuseSampleA",
                    "vizId": "demoapps.IframeReuseSample.IframeReuseSampleA",
                    "vizType": "",
                    "title": "BB1 Application A",
                    "subtitle": "",
                    "icon": "sap-icon://business-objects-experience",
                    "info": "iframe",
                    "keywords": [
                        "BB1 Application A"
                    ],
                    "technicalAttributes": [],
                    "target": {
                        "type": "URL",
                        "url": "#Application-A?sap-ui-app-id-hint=demoapps.IframeReuseSample.IframeReuseSampleA"
                    },
                    "targetURL": "#Application-A?sap-ui-app-id-hint=demoapps.IframeReuseSample.IframeReuseSampleA",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#Application-A?sap-ui-app-id-hint=demoapps.IframeReuseSample.IframeReuseSampleA",
                "technicalAttributes": "",
                "text": "BB1 Application A"
            },
            {
                "title": "BB1 Application B",
                "description": "",
                "keywords": "BB1 Application B",
                "icon": "sap-icon://business-objects-experience",
                "label": "BB1 Application B",
                "visualization": {
                    "id": "demoapps.IframeReuseSample.IframeReuseSampleB",
                    "vizId": "demoapps.IframeReuseSample.IframeReuseSampleB",
                    "vizType": "",
                    "title": "BB1 Application B",
                    "subtitle": "",
                    "icon": "sap-icon://business-objects-experience",
                    "info": "iframe",
                    "keywords": [
                        "BB1 Application B"
                    ],
                    "technicalAttributes": [],
                    "target": {
                        "type": "URL",
                        "url": "#Application-B?sap-ui-app-id-hint=demoapps.IframeReuseSample.IframeReuseSampleB"
                    },
                    "targetURL": "#Application-B?sap-ui-app-id-hint=demoapps.IframeReuseSample.IframeReuseSampleB",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#Application-B?sap-ui-app-id-hint=demoapps.IframeReuseSample.IframeReuseSampleB",
                "technicalAttributes": "",
                "text": "BB1 Application B"
            },
            {
                "title": "BB1 Application C",
                "description": "",
                "keywords": "BB1 Application C",
                "icon": "sap-icon://business-objects-experience",
                "label": "BB1 Application C",
                "visualization": {
                    "id": "demoapps.IframeReuseSample.IframeReuseSampleC",
                    "vizId": "demoapps.IframeReuseSample.IframeReuseSampleC",
                    "vizType": "",
                    "title": "BB1 Application C",
                    "subtitle": "",
                    "icon": "sap-icon://business-objects-experience",
                    "info": "iframe",
                    "keywords": [
                        "BB1 Application C"
                    ],
                    "technicalAttributes": [],
                    "target": {
                        "type": "URL",
                        "url": "#Application-C?sap-ui-app-id-hint=demoapps.IframeReuseSample.IframeReuseSampleC"
                    },
                    "targetURL": "#Application-C?sap-ui-app-id-hint=demoapps.IframeReuseSample.IframeReuseSampleC",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#Application-C?sap-ui-app-id-hint=demoapps.IframeReuseSample.IframeReuseSampleC",
                "technicalAttributes": "",
                "text": "BB1 Application C"
            },
            {
                "title": "Fiori Elements App",
                "description": "",
                "keywords": "Fiori Elements App",
                "icon": "sap-icon://business-objects-experience",
                "label": "Fiori Elements App",
                "visualization": {
                    "id": "sap.ushell.demo.FE1Iframe",
                    "vizId": "sap.ushell.demo.FE1Iframe",
                    "vizType": "",
                    "title": "Fiori Elements App",
                    "subtitle": "",
                    "icon": "sap-icon://business-objects-experience",
                    "info": "iframe",
                    "keywords": [
                        "Fiori Elements App"
                    ],
                    "technicalAttributes": [],
                    "target": {
                        "type": "URL",
                        "url": "#FE1-iframe?sap-ui-app-id-hint=sap.ushell.demo.FE1Iframe"
                    },
                    "targetURL": "#FE1-iframe?sap-ui-app-id-hint=sap.ushell.demo.FE1Iframe",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#FE1-iframe?sap-ui-app-id-hint=sap.ushell.demo.FE1Iframe",
                "technicalAttributes": "",
                "text": "Fiori Elements App"
            }
        ];
        var oExternalSearchApps = [
            {
                "title": "Google.com",
                "description": "",
                "keywords": "Google.com",
                "icon": "sap-icon://nutrition-activity",
                "label": "Google.com",
                "visualization": {
                    "id": "search_providers_mainline.search.provider.google#defaultLauncher",
                    "vizId": "search_providers_mainline.search.provider.google#defaultLauncher",
                    "vizType": "",
                    "title": "Google.com",
                    "subtitle": "",
                    "icon": "sap-icon://nutrition-activity",
                    "info": "Google.com (New Tab)",
                    "keywords": [
                        "Google.com"
                    ],
                    "technicalAttributes": [
                        "APPTYPE_SEARCHAPP",
                        "APPTYPE_HOMEPAGE"
                    ],
                    "target": {
                        "type": "URL",
                        "url": "#google-search?sap-ui-app-id-hint=search_providers_mainline.search.provider.google"
                    },
                    "targetURL": "#google-search?sap-ui-app-id-hint=search_providers_mainline.search.provider.google",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#google-search?sap-ui-app-id-hint=search_providers_mainline.search.provider.google",
                "technicalAttributes": "APPTYPE_SEARCHAPP APPTYPE_HOMEPAGE",
                "text": "Google.com"
            },
            {
                "title": "Office.com",
                "description": "",
                "keywords": "Office.com",
                "icon": "sap-icon://nutrition-activity",
                "label": "Office.com",
                "visualization": {
                    "id": "search_providers_mainline.search.provider.office#defaultLauncher",
                    "vizId": "search_providers_mainline.search.provider.office#defaultLauncher",
                    "vizType": "",
                    "title": "Office.com",
                    "subtitle": "",
                    "icon": "sap-icon://nutrition-activity",
                    "info": "Office.com (New Tab)",
                    "keywords": [
                        "Office.com"
                    ],
                    "technicalAttributes": [
                        "APPTYPE_SEARCHAPP"
                    ],
                    "target": {
                        "type": "URL",
                        "url": "#office-search?sap-ui-app-id-hint=search_providers_mainline.search.provider.office"
                    },
                    "targetURL": "#office-search?sap-ui-app-id-hint=search_providers_mainline.search.provider.office",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#office-search?sap-ui-app-id-hint=search_providers_mainline.search.provider.office",
                "technicalAttributes": "APPTYPE_SEARCHAPP",
                "text": "Office.com"
            },
            {
                "text": "Enterprise Search",
                "description": "Enterprise Search",
                "icon": "sap-icon://search",
                "inboundIdentifier": "38cd162a-e185-448c-9c37-a4fc02b3d39d___GenericDefaultSemantic-__GenericDefaultAction",
                // eslint-disable-next-line max-len
                "url": "http://localhost:8080/ushell/test-resources/sap/ushell/shells/demo/FioriLaunchpad.Isolation.html?sap-isolation-enabled=true&sap-ui-debug=true#Action-search&/top=20&filter={\"dataSource\":{\"type\":\"Category\",\"id\":\"All\",\"label\":\"All\",\"labelPlural\":\"All\"},\"searchTerm\":\"app\",\"rootCondition\":{\"type\":\"Complex\",\"operator\":\"And\",\"conditions\":[]}}",
                "target": "_blank",
                "recent": false,
                "semanticObject": "Action",
                "semanticObjectAction": "search",
                "_type": "app",
                "isEnterpriseSearch": true
            }
        ];
        var oHomepageResult = [
            {
                "title": "Google.com",
                "description": "",
                "keywords": "Google.com",
                "icon": "sap-icon://nutrition-activity",
                "label": "Google.com",
                "visualization": {
                    "id": "search_providers_mainline.search.provider.google#defaultLauncher",
                    "vizId": "search_providers_mainline.search.provider.google#defaultLauncher",
                    "vizType": "",
                    "title": "Google.com",
                    "subtitle": "",
                    "icon": "sap-icon://nutrition-activity",
                    "info": "Google.com (New Tab)",
                    "keywords": [
                        "Google.com"
                    ],
                    "technicalAttributes": [
                        "APPTYPE_SEARCHAPP",
                        "APPTYPE_HOMEPAGE"
                    ],
                    "target": {
                        "type": "URL",
                        "url": "#google-search?sap-ui-app-id-hint=search_providers_mainline.search.provider.google"
                    },
                    "targetURL": "#google-search?sap-ui-app-id-hint=search_providers_mainline.search.provider.google",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#google-search?sap-ui-app-id-hint=search_providers_mainline.search.provider.google",
                "technicalAttributes": "APPTYPE_SEARCHAPP APPTYPE_HOMEPAGE",
                "text": "Google.com"
            },
            {
                "title": "Homepage Application cc8",
                "description": "",
                "keywords": "Homepage Application cc8",
                "icon": "sap-icon://nutrition-activity",
                "label": "Homepage Application cc8",
                "visualization": {
                    "id": "search_providers_mainline.search.provider.cc8#defaultLauncher",
                    "vizId": "search_providers_mainline.search.provider.cc8#defaultLauncher",
                    "vizType": "",
                    "title": "Homepage Application cc8",
                    "subtitle": "",
                    "icon": "sap-icon://nutrition-activity",
                    "info": "CC8 Homepage (New Tab)",
                    "keywords": [
                        "Homepage Application cc8"
                    ],
                    "technicalAttributes": [
                        "APPTYPE_HOMEPAGE"
                    ],
                    "target": {
                        "type": "URL",
                        "url": "#cc8-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.cc8"
                    },
                    "targetURL": "#cc8-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.cc8",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#cc8-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.cc8",
                "technicalAttributes": "APPTYPE_HOMEPAGE",
                "text": "Homepage Application cc8"
            },
            {
                "title": "Homepage Sample Application",
                "description": "",
                "keywords": "Homepage Sample Application",
                "icon": "sap-icon://nutrition-activity",
                "label": "Homepage Sample Application",
                "visualization": {
                    "id": "search_providers_mainline.search.provider.homepageSampleApp#defaultLauncher",
                    "vizId": "search_providers_mainline.search.provider.homepageSampleApp#defaultLauncher",
                    "vizType": "",
                    "title": "Homepage Sample Application",
                    "subtitle": "",
                    "icon": "sap-icon://nutrition-activity",
                    "info": "Homepage Sample (New Tab)",
                    "keywords": [
                        "Homepage Sample Application"
                    ],
                    "technicalAttributes": [
                        "APPTYPE_HOMEPAGE"
                    ],
                    "target": {
                        "type": "URL",
                        "url": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp"
                    },
                    "targetURL": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp",
                "technicalAttributes": "APPTYPE_HOMEPAGE",
                "text": "Homepage Sample Application"
            },
            {
                "title": "Homepage Sample Application 2",
                "description": "",
                "keywords": "Homepage Sample Application 2",
                "icon": "sap-icon://nutrition-activity",
                "label": "Homepage Sample Application 2",
                "visualization": {
                    "id": "search_providers_mainline.search.provider.homepageSampleApp2#defaultLauncher",
                    "vizId": "search_providers_mainline.search.provider.homepageSampleApp2#defaultLauncher",
                    "vizType": "",
                    "title": "Homepage Sample Application 2",
                    "subtitle": "",
                    "icon": "sap-icon://nutrition-activity",
                    "info": "Homepage Sample (New Tab)",
                    "keywords": [
                        "Homepage Sample Application 2"
                    ],
                    "technicalAttributes": [
                        "APPTYPE_HOMEPAGE"
                    ],
                    "target": {
                        "type": "URL",
                        "url": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp2"
                    },
                    "targetURL": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp2",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp2",
                "technicalAttributes": "APPTYPE_HOMEPAGE",
                "text": "Homepage Sample Application 2"
            },
            {
                "title": "Homepage Sample Application 3",
                "description": "",
                "keywords": "Homepage Sample Application 3",
                "icon": "sap-icon://nutrition-activity",
                "label": "Homepage Sample Application 3",
                "visualization": {
                    "id": "search_providers_mainline.search.provider.homepageSampleApp3#defaultLauncher",
                    "vizId": "search_providers_mainline.search.provider.homepageSampleApp3#defaultLauncher",
                    "vizType": "",
                    "title": "Homepage Sample Application 3",
                    "subtitle": "",
                    "icon": "sap-icon://nutrition-activity",
                    "info": "Homepage Sample (New Tab)",
                    "keywords": [
                        "Homepage Sample Application 3"
                    ],
                    "technicalAttributes": [
                        "APPTYPE_HOMEPAGE"
                    ],
                    "target": {
                        "type": "URL",
                        "url": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp3"
                    },
                    "targetURL": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp3",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp3",
                "technicalAttributes": "APPTYPE_HOMEPAGE",
                "text": "Homepage Sample Application 3"
            },
            {
                "title": "Homepage Sample Application 4",
                "description": "",
                "keywords": "Homepage Sample Application 4",
                "icon": "sap-icon://nutrition-activity",
                "label": "Homepage Sample Application 4",
                "visualization": {
                    "id": "search_providers_mainline.search.provider.homepageSampleApp4#defaultLauncher",
                    "vizId": "search_providers_mainline.search.provider.homepageSampleApp4#defaultLauncher",
                    "vizType": "",
                    "title": "Homepage Sample Application 4",
                    "subtitle": "",
                    "icon": "sap-icon://nutrition-activity",
                    "info": "Homepage Sample (New Tab)",
                    "keywords": [
                        "Homepage Sample Application 4"
                    ],
                    "technicalAttributes": [
                        "APPTYPE_HOMEPAGE"
                    ],
                    "target": {
                        "type": "URL",
                        "url": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp4"
                    },
                    "targetURL": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp4",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp4",
                "technicalAttributes": "APPTYPE_HOMEPAGE",
                "text": "Homepage Sample Application 4"
            },
            {
                "title": "Homepage Sample Application 5",
                "description": "",
                "keywords": "Homepage Sample Application 5",
                "icon": "sap-icon://nutrition-activity",
                "label": "Homepage Sample Application 5",
                "visualization": {
                    "id": "search_providers_mainline.search.provider.homepageSampleApp5#defaultLauncher",
                    "vizId": "search_providers_mainline.search.provider.homepageSampleApp5#defaultLauncher",
                    "vizType": "",
                    "title": "Homepage Sample Application 5",
                    "subtitle": "",
                    "icon": "sap-icon://nutrition-activity",
                    "info": "Homepage Sample (New Tab)",
                    "keywords": [
                        "Homepage Sample Application 5"
                    ],
                    "technicalAttributes": [
                        "APPTYPE_HOMEPAGE"
                    ],
                    "target": {
                        "type": "URL",
                        "url": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp5"
                    },
                    "targetURL": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp5",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp5",
                "technicalAttributes": "APPTYPE_HOMEPAGE",
                "text": "Homepage Sample Application 5"
            },
            {
                "title": "Homepage Sample Application 6",
                "description": "",
                "keywords": "Homepage Sample Application 6",
                "icon": "sap-icon://nutrition-activity",
                "label": "Homepage Sample Application 6",
                "visualization": {
                    "id": "search_providers_mainline.search.provider.homepageSampleApp6#defaultLauncher",
                    "vizId": "search_providers_mainline.search.provider.homepageSampleApp6#defaultLauncher",
                    "vizType": "",
                    "title": "Homepage Sample Application 6",
                    "subtitle": "",
                    "icon": "sap-icon://nutrition-activity",
                    "info": "Homepage Sample (New Tab)",
                    "keywords": [
                        "Homepage Sample Application 6"
                    ],
                    "technicalAttributes": [
                        "APPTYPE_HOMEPAGE"
                    ],
                    "target": {
                        "type": "URL",
                        "url": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp6"
                    },
                    "targetURL": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp6",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp6",
                "technicalAttributes": "APPTYPE_HOMEPAGE",
                "text": "Homepage Sample Application 6"
            },
            {
                "title": "Homepage Sample Application 7",
                "description": "",
                "keywords": "Homepage Sample Application 7",
                "icon": "sap-icon://nutrition-activity",
                "label": "Homepage Sample Application 7",
                "visualization": {
                    "id": "search_providers_mainline.search.provider.homepageSampleApp7#defaultLauncher",
                    "vizId": "search_providers_mainline.search.provider.homepageSampleApp7#defaultLauncher",
                    "vizType": "",
                    "title": "Homepage Sample Application 7",
                    "subtitle": "",
                    "icon": "sap-icon://nutrition-activity",
                    "info": "Homepage Sample (New Tab)",
                    "keywords": [
                        "Homepage Sample Application 7"
                    ],
                    "technicalAttributes": [
                        "APPTYPE_HOMEPAGE"
                    ],
                    "target": {
                        "type": "URL",
                        "url": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp7"
                    },
                    "targetURL": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp7",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp7",
                "technicalAttributes": "APPTYPE_HOMEPAGE",
                "text": "Homepage Sample Application 7"
            },
            {
                "title": "Homepage Sample Application 8",
                "description": "",
                "keywords": "Homepage Sample Application 8",
                "icon": "sap-icon://nutrition-activity",
                "label": "Homepage Sample Application 8",
                "visualization": {
                    "id": "search_providers_mainline.search.provider.homepageSampleApp8#defaultLauncher",
                    "vizId": "search_providers_mainline.search.provider.homepageSampleApp8#defaultLauncher",
                    "vizType": "",
                    "title": "Homepage Sample Application 8",
                    "subtitle": "",
                    "icon": "sap-icon://nutrition-activity",
                    "info": "Homepage Sample (New Tab)",
                    "keywords": [
                        "Homepage Sample Application 8"
                    ],
                    "technicalAttributes": [
                        "APPTYPE_HOMEPAGE"
                    ],
                    "target": {
                        "type": "URL",
                        "url": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp8"
                    },
                    "targetURL": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp8",
                    "_instantiationData": {
                        "platform": "CDM",
                        "vizType": {
                            "sap.ui5": {
                                "componentName": "sap.ushell.components.tiles.cdm.applauncher"
                            }
                        }
                    }
                },
                "url": "#sample-homepage?sap-ui-app-id-hint=search_providers_mainline.search.provider.homepageSampleApp8",
                "technicalAttributes": "APPTYPE_HOMEPAGE",
                "text": "Homepage Sample Application 8"
            }
        ];
        var oResult = {};
        if (oParameters.filter.value1 && oParameters.filter.value1 === "APPTYPE_HOMEPAGE") {
            oResult.data = oHomepageResult;
        } else if (oParameters.filter.value1 && oParameters.filter.value1 === "APPTYPE_SEARCHAPP") {
            oResult.data = oExternalSearchApps;
        } else {
            oResult.data = oSearchResult;
        }
        return Promise.resolve(oResult);
    };

    return SearchCEPAdapter;
}, false);
/*eslint-enable quote-props*/
