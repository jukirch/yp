// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
    "./controls/categories/Application",
    "./controls/categories/All"
], function (
    Application,
    All
  ) {
    "use strict";
    return {
        defaultCategory: "app",
        categories: [
            {
                class: All,
                name: "all",
                translation: "CATEGORIES.All",
                title: "{i18n>CATEGORIES.All.Title}",
                shortTitle: "{i18n>CATEGORIES.All.ShortTitle}",
                icon: {
                    src: "sap-icon://search",
                    backgroundColor: "Accent9",
                    shape: "Square",
                    size: "S"
                },
                card: {
                    title: "{i18n>CATEGORIES.All.Card.Title}",
                    subTitle: "{i18n>CATEGORIES.All.Card.SubTitle}"
                },
                subCategories: [
                    {
                        name: "app",
                        pageSize: 15
                    }
                ],
                noDataText: "{i18n>CATEGORIES.All.NoData}",
                loadingDataText: "{i18n>CATEGORIES.All.LoadingData}"
            },
            {
                class: Application,
                name: "app",
                translation: "CATEGORIES.App",
                title: "{i18n>CATEGORIES.App.Title}",
                shortTitle: "{i18n>CATEGORIES.App.ShortTitle}",
                icon: {
                    src: "sap-icon://header",
                    backgroundColor: "Accent9",
                    shape: "Square",
                    size: "S"
                },
                card: {
                    title: "{i18n>CATEGORIES.App.Card.Title}",
                    subTitle: "{i18n>CATEGORIES.App.Card.SubTitle}"
                }
            }
        ]
    };
});

