// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define(["sap/ui/integration/Designtime"], function (
	Designtime
) {
	"use strict";
	return function () {
		var oDT = new Designtime({
			form: {
				items: {
					groupheader1: {
						label: "{i18n>CARD.Config.HeaderSettings}",
						type: "group",
						expanded: false
					},
					header: {
						manifestpath: "/sap.card/configuration/parameters/header/value",
						type: "string",
						label: "{i18n>CARD.Config.HeaderType.Lbl}",
						control: "Select",
						cols: 2,
						values: {
							data: {
								json: {
									values: [
										{ text: "{i18n>CARD.Config.HeaderType.Default}", key: "default" },
										{ text: "{i18n>CARD.Config.HeaderType.Custom}", key: "custom" },
										{ text: "{i18n>CARD.Config.HeaderType.None}", key: "none" }
									]
								},
								path: "/values"
							},
							item: {
								text: "{text}",
								key: "{key}"
							}
						}
					},
					title: {
						manifestpath: "/sap.card/header/title",
						type: "string",
						label: "{i18n>CARD.Config.Header.Title.Lbl}",
						description: "{i18n>CARD.Config.Header.Title.Desc}",
						translatable: true,
						visible: "{= ${items>header/value} === 'custom'}",
						cols: 2
					},
					subtitle: {
						manifestpath: "/sap.card/header/subtitle",
						type: "string",
						label: "{i18n>CARD.Config.Header.SubTitle.Lbl}",
						description: "{i18n>CARD.Config.Header.SubTitle.Desc}",
						translatable: true,
						visible: "{= ${items>header/value} === 'custom'}",
						cols: 2
					},
					icon: {
						manifestpath: "/sap.card/header/icon/src",
						type: "string",
						label: "{i18n>CARD.Config.Header.Icon.Lbl}",
						cols: 2,
						allowDynamicValues: false,
						allowSettings: false,
						visible: "{= ${items>header/value} === 'custom'}",
						visualization: {
							type: "IconSelect",
							settings: {
								value: "{currentSettings>value}",
								editable: "{currentSettings>editable}"
							}
						}
					},
					color: {
						manifestpath: "/sap.card/header/icon/backgroundColor",
						type: "string",
						label: "{i18n>CARD.Config.Header.IconColor.Lbl}",
						visible: "{= ${items>header/value} === 'custom'}",
						visualization: {
							type: "ColorSelect",
							settings: {
								enumValue: "{currentSettings>value}",
								editable: "{currentSettings>editable}"
							}
						},
						cols: 1
					},
					shape: {
						manifestpath: "/sap.card/header/icon/shape",
						type: "string",
						label: "{i18n>CARD.Config.Header.IconShape.Lbl}",
						visible: "{= ${items>header/value} === 'custom'}",
						visualization: {
							type: "ShapeSelect",
							settings: {
								value: "{currentSettings>value}",
								editable: "{currentSettings>editable}"
							}
						},
						cols: 1
					},
					headerNavigation: {
						manifestpath: "/sap.card/configuration/parameters/headerNavigation/value",
						type: "boolean",
						label: "{i18n>CARD.Config.Header.Nav.Lbl}",
						description: "{i18n>CARD.Config.Header.Nav.Desc}",
						visible: "{= ${items>header/value} === 'custom'}",
						cols: 2,
						visualization: {
							type: "Switch",
							settings: {
								state: "{currentSettings>value}",
								customTextOn: "{i18n>CARD.Config.Yes}",
								customTextOff: "{i18n>CARD.Config.No}",
								enabled: "{currentSettings>editable}"
							}
						}
					},
					groupheader2: {
						label: "Content Settings",
						type: "group"
					},
					searchTerm: {
						manifestpath: "/sap.card/configuration/parameters/searchTerm/value",
						type: "string",
						label: "{i18n>CARD.Config.Content.SearchTerm.Lbl}",
						translatable: false,
						cols: 2,
						allowDynamicValues: true
					},
					category: {
						manifestpath: "/sap.card/configuration/parameters/category/value",
						type: "string",
						label: "{i18n>CARD.Config.Content.Category.Lbl}",
						values: {
							data: {
								extension: {
									method: "getCategoryListItems"
								},
								path: "/"
							},
							item: {
								text: "{text}",
								key: "{key}",
								icon: "{icon}"
							}
						}
					},
					view: {
						manifestpath: "/sap.card/configuration/parameters/view/value",
						type: "string",
						label: "{i18n>CARD.Config.Content.View.Lbl}",
						cols: 2,
						values: {
							data: {
								extension: {
									method: "getCategoryViews",
									args: ["{items>category/value}"]
								},
								path: "/views"
							},
							item: {
								text: "{text}",
								key: "{key}",
								icon: "{icon}"
							}
						}
					},
					pageSize: {
						manifestpath: "/sap.card/configuration/parameters/pageSize/value",
						type: "integer",
						label: "{i18n>CARD.Config.Content.PageSize.Lbl}",
						cols: 2,
						visualization: {
							type: "Slider",
							settings: {
								value: "{currentSettings>value}",
								min: 0,
								max: 20,
								width: "100%",
								showAdvancedTooltip: true,
								showHandleTooltip: false,
								inputsAsTooltips: true,
								enabled: "{currentSettings>editable}"
							}
						}
					},
					highlightResult: {
						manifestpath: "/sap.card/configuration/parameters/highlightResult/value",
						type: "boolean",
						label: "{i18n>CARD.Config.Content.Highlight.Lbl}",
						description: "{i18n>CARD.Config.Content.Highlight.Desc}",
						cols: 1,
						visualization: {
							type: "Switch",
							settings: {
								state: "{currentSettings>value}",
								customTextOn: "{i18n>CARD.Config.Yes}",
								customTextOff: "{i18n>CARD.Config.No}",
								enabled: "{currentSettings>editable}"
							}
						}
					},
					footer: {
						manifestpath: "/sap.card/configuration/parameters/footer/value",
						type: "string",
						label: "{i18n>CARD.Config.Content.FooterActions.Lbl}",
						control: "Select",
						cols: 2,
						values: {
							data: {
								json: {
									values: [
										{ text: "{i18n>CARD.Config.Content.FooterActions.Page}", key: "paginator"},
										{ text: "{i18n>CARD.Config.Content.FooterActions.Navigate}", key: "viewAll"},
										{ text: "{i18n>CARD.Config.Content.FooterActions.None}", key: "none" }
									]
								},
								path: "/values"
							},
							item: {
								text: "{text}",
								key: "{key}",
								additionalText: "{additionalText}",
								icon: "{icon}"
							}
						}

					}
				}
			},
			preview: {
				modes: "Live"
			}
		});
		return oDT;
	};
});
