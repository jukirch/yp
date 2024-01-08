// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
    "./controls/categories/All",
    "./controls/categories/Application",
    "./controls/categories/Workpage",
    "./controls/categories/People",
    "./controls/categories/Event"
], function (
    All,
    Application,
    Workpage,
    People,
    Event
  ) {

    "use strict";
    return {
        defaultCategory: "all",
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
                showSubCategories: false,
                subCategories: [
                    {
                        name: "app",
                        pageSize: 7
                    },
                    {
                        name: "workpage",
                        pageSize: 5
                    },
                    {
                        name: "workspace",
                        pageSize: 5
                    },
                    {
                        name: "content",
                        pageSize: 5
                    },
                    {
                        name: "people",
                        pageSize: 5
                    },
                    {
                        name: "event",
                        pageSize: 5
                    },
                    {
                        name: "knowledgeBase",
                        pageSize: 5
                    },
                    {
                        name: "forum",
                        pageSize: 5
                    },
                    {
                        name: "task",
                        pageSize: 5
                    },
                    {
                        name: "tag",
                        pageSize: 5
                    },
                    {
                        name: "comment",
                        pageSize: 5
                    },
                    {
                        name: "businessrecord",
                        pageSize: 10
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
            },
            {
                class: Workpage,
                name: "workpage",
                translation: "CATEGORIES.WorkPage",
                title: "{i18n>CATEGORIES.WorkPage.Title}",
                shortTitle: "{i18n>CATEGORIES.WorkPage.ShortTitle}",
                icon: {
                    src: "sap-icon://document-text",
                    backgroundColor: "Accent1",
                    shape: "Square",
                    size: "S"
                },
                card: {
                    title: "{i18n>CATEGORIES.WorkPage.Card.Title}",
                    subTitle: "{i18n>CATEGORIES.WorkPage.Card.SubTitle}"
                }
            },
            {
                name: "workspace",
                title: "{i18n>CATEGORIES.WorkSpace.Title}",
                translation: "CATEGORIES.WorkSpace",
                shortTitle: "{i18n>CATEGORIES.WorkSpace.ShortTitle}",
                icon: {
                    src: "sap-icon://meeting-room",
                    backgroundColor: "Accent2",
                    shape: "Square",
                    size: "S"
                },
                card: {
                    title: "{i18n>CATEGORIES.WorkSpace.Card.Title}",
                    subTitle: "{i18n>CATEGORIES.WorkSpace.Card.SubTitle}"
                }
            },
            {
                name: "content",
                translation: "CATEGORIES.Content",
                title: "{i18n>CATEGORIES.Content.Title}",
                shortTitle: "{i18n>CATEGORIES.Content.ShortTitle}",
                icon: {
                    src: "sap-icon://document",
                    backgroundColor: "Accent7",
                    shape: "Square",
                    size: "S"
                },
                card: {
                    title: "{i18n>CATEGORIES.Content.Card.Title}",
                    subTitle: "{i18n>CATEGORIES.Content.Card.SubTitle}"
                },
                subCategories: [
                    {
                        name: "document",
                        pageSize: 10
                    },
                    {
                        name: "video",
                        pageSize: 10
                    }
                ]
            },
            {
                name: "people",
                class: People,
                translation: "CATEGORIES.People",
                title: "{i18n>CATEGORIES.People.Title}",
                shortTitle: "{i18n>CATEGORIES.People.ShortTitle}",
                icon: {
                    src: "sap-icon://person-placeholder",
                    backgroundColor: "Accent8",
                    shape: "Circle",
                    size: "S"
                },
                card: {
                    title: "{i18n>CATEGORIES.People.Card.Title}",
                    subTitle: "{i18n>CATEGORIES.People.Card.SubTitle}"
                }
            },
            {
                name: "event",
                class: Event,
                translation: "CATEGORIES.Event",
                title: "{i18n>CATEGORIES.Event.Title}",
                shortTitle: "{i18n>CATEGORIES.Event.ShortTitle}",
                icon: {
                    src: "sap-icon://calendar",
                    backgroundColor: "Accent6",
                    shape: "Square",
                    size: "S"
                },
                card: {
                    title: "{i18n>CATEGORIES.Event.Card.Title}",
                    subTitle: "{i18n>CATEGORIES.Event.Card.SubTitle}"
                }
            },
            {
                name: "knowledgeBase",
                translation: "CATEGORIES.KnowledgeBase",
                title: "{i18n>CATEGORIES.KnowledgeBase.Title}",
                shortTitle: "{i18n>CATEGORIES.KnowledgeBase.ShortTitle}",
                icon: {
                    src: "sap-icon://study-leave",
                    backgroundColor: "Accent5",
                    shape: "Square",
                    size: "S"
                },
                card: {
                    title: "{i18n>CATEGORIES.KnowledgeBase.Card.Title}",
                    subTitle: "{i18n>CATEGORIES.KnowledgeBase.Card.SubTitle}"
                }
            },
            {
                name: "forum",
                translation: "CATEGORIES.Forum",
                title: "{i18n>CATEGORIES.Forum.Title}",
                shortTitle: "{i18n>CATEGORIES.Forum.ShortTitle}",
                icon: {
                    src: "sap-icon://discussion-2",
                    backgroundColor: "Accent4",
                    shape: "Square",
                    size: "S"
                },
                card: {
                    title: "{i18n>CATEGORIES.Forum.Card.Title}",
                    subTitle: "{i18n>CATEGORIES.Forum.Card.SubTitle}"
                }
            },
            {
                name: "task",
                translation: "CATEGORIES.Task",
                title: "{i18n>CATEGORIES.Task.Title}",
                shortTitle: "{i18n>CATEGORIES.Task.ShortTitle}",
                icon: {
                    src: "sap-icon://checklist",
                    backgroundColor: "Accent3",
                    shape: "Square",
                    size: "S"
                },
                card: {
                    title: "{i18n>CATEGORIES.Task.Card.Title}",
                    subTitle: "{i18n>CATEGORIES.Task.Card.SubTitle}"
                }
            },
            {
                name: "tag",
                translation: "CATEGORIES.Tag",
                title: "{i18n>CATEGORIES.Tag.Title}",
                shortTitle: "{i18n>CATEGORIES.Tag.ShortTitle}",
                icon: {
                    src: "sap-icon://blank-tag-2",
                    backgroundColor: "Accent6",
                    shape: "Square",
                    size: "S"
                },
                card: {
                    title: "{i18n>CATEGORIES.Tag.Card.Title}",
                    subTitle: "{i18n>CATEGORIES.Tag.Card.SubTitle}"
                }
            },
            {
                name: "comment",
                translation: "CATEGORIES.Comment",
                title: "{i18n>CATEGORIES.Comment.Title}",
                shortTitle: "{i18n>CATEGORIES.Comment.ShortTitle}",
                icon: {
                    src: "sap-icon://comment",
                    backgroundColor: "Accent1",
                    shape: "Square",
                    size: "S"
                },
                card: {
                    title: "{i18n>CATEGORIES.Comment.Card.Title}",
                    subTitle: "{i18n>CATEGORIES.Comment.Card.SubTitle}"
                }
            },
            {
                name: "businessrecord",
                translation: "CATEGORIES.BusinessRecord",
                title: "{i18n>CATEGORIES.BusinessRecord.Title}",
                shortTitle: "{i18n>CATEGORIES.BusinessRecord.ShortTitle}",
                icon: {
                    src: "sap-icon://tools-opportunity",
                    backgroundColor: "Accent10",
                    shape: "Square",
                    size: "S"
                },
                card: {
                    title: "{i18n>CATEGORIES.BusinessRecord.Card.Title}",
                    subTitle: "{i18n>CATEGORIES.BusinessRecord.Card.SubTitle}"
                }
            },
            {
                name: "document",
                translation: "CATEGORIES.Document",
                title: "{i18n>CATEGORIES.Document.Title}",
                shortTitle: "{i18n>CATEGORIES.Document.ShortTitle}",
                icon: {
                    src: "sap-icon://document-text",
                    backgroundColor: "Accent3",
                    shape: "Square",
                    size: "S"
                },
                card: {
                    title: "{i18n>CATEGORIES.Document.Card.Title}",
                    subTitle: "{i18n>CATEGORIES.Document.Card.SubTitle}"
                }
            },
            {
                name: "video",
                translation: "CATEGORIES.Video",
                title: "{i18n>CATEGORIES.Video.Title}",
                shortTitle: "{i18n>CATEGORIES.Video.ShortTitle}",
                icon: {
                    src: "sap-icon://video",
                    backgroundColor: "Accent3",
                    shape: "Square",
                    size: "S"
                },
                card: {
                    title: "{i18n>CATEGORIES.Video.Card.Title}",
                    subTitle: "{i18n>CATEGORIES.Video.Card.SubTitle}"
                }
            }
        ]
    }
    ;
});

