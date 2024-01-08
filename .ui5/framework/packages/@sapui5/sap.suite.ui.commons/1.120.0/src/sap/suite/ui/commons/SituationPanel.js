sap.ui.define([
    "sap/suite/ui/commons/ToDoPanel",
    "sap/m/GenericTile",
    "sap/m/TileContent",
    "sap/f/GridListItem",
    "sap/m/library",
    "sap/m/Text",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/format/NumberFormat",
    "sap/base/Log"
], function (
    ToDoPanel,
    GenericTile,
    TileContent,
    GridListItem,
    mobileLibrary,
    Text,
    ODataModel,
    DateFormat,
    NumberFormat,
    Log
) {
    "use strict";

    const URLHelper = mobileLibrary.URLHelper;

    const SituationPanel = ToDoPanel.extend("sap.suite.ui.commons.SituationPanel");

    /**
     * Init lifecycle method
     *
     */
    SituationPanel.prototype.init = function () {
        this.setKey("situations");
        this.setTitle(this.getResourceBundle().getText("situationsTabTitle"));

        ToDoPanel.prototype.init.apply(this, arguments);
    };

    /**
     * Generate a card template for the SituationPanel.
     *
     * @param {string} id - The ID for the template.
     * @param {object} context - The context for the template.
     * @returns {object} The generated card template.
     */
    SituationPanel.prototype.generateCardTemplate = function (id, context) {
        return new GridListItem(`${id}-gridListItem`, {
            content: [
                new GenericTile(`${id}-tile`, {
                    mode: "ActionMode",
                    frameType: "TwoByOne",
                    pressEnabled: true,
                    header: "{_toDos>title}",
                    width: "{_toDos>/cardWidth}",
                    state: "{_toDos>status}",
                    url: "{_toDos>link}",
                    headerImage: "{_toDos>headerImage}",
                    valueColor: this._convertToValueColor(context.getProperty("priority")),
                    press: this._onPressSituation.bind(this),
                    tileContent: [
                        new TileContent(`${id}-tileContent`, {
                            priority: "{_toDos>priority}",
                            priorityText: this.getResourceBundle().getText(
                                this.toPriorityText(context.getProperty("priority"))
                            ),
                            footer: "{_toDos>footerText}",
                            content: [
                                new Text(`${id}-situationContent`, {
                                    text: "{_toDos>text}"
                                })
                            ]
                        })
                    ]
                })
            ]
        }).addStyleClass("sapMGT");
    };

    /**
     * Handle the press event for a situation.
     *
     * @param {object} event - The event object.
     */
    SituationPanel.prototype._onPressSituation = async function (event) {
        const control = event.getSource();
        const context = control.getBindingContext("_toDos");
        const status = context.getProperty("status");
        const id = context.getProperty("id");
        const url = context.getProperty("link");

        if (status !== "Loading") {
            if (id) {
                try {
                    await this._mixInSituationsSupport();
                    const data = await this._fetchNavigationTargetData(this._oSituationsModel, id);
                    await this._executeNavigation(data, this.getOwnerComponent());
                } catch (error) {
                    if (error._sErrorCode === "NavigationHandler.isIntentSupported.notSupported") {
                        // Navigate to the situations app
                        URLHelper.redirect(this.getAppUrl(), false);
                    }
                }
            } else {
                URLHelper.redirect(url, false);
            }
        }
    };

    /**
     * Mixes in the support for situations if not already mixed in.
     *
     * @returns {Promise} A promise that resolves when support for situations is mixed in.
     */
    SituationPanel.prototype._mixInSituationsSupport = function () {
        return this._executeNavigation
            ? Promise.resolve()
            : new Promise(function (resolve) {
                sap.ui
                    .getCore()
                    .loadLibrary("s4.cfnd.sit.reuse", { async: true })
                    .then(() => {
                        sap.ui.require(
                            [
                                "sap/fe/navigation/NavigationHandler",
                                "s4/cfnd/sit/reuse/util/SituationNavigationHelperSupport"
                            ],
                            function (NH, SituationNavigationHelperSupport) {
                                SituationNavigationHelperSupport.mixInto(this);
                                //Mixin needs a v2 OData Model
                                this._oSituationsModel = new ODataModel(
                                    "/sap/opu/odata/sap/C_SITNMYSITUATION_CDS/"
                                );
                                resolve();
                            }.bind(this)
                        );
                    })
                    .catch((error) => {
                        Log.error(error);
                    });
            }.bind(this));
    };

    /**
     * Process the situation data and populate the tiles with relevant information.
     *
     * @param {Object[]} situations - An array of situation data.
     */
    SituationPanel.prototype.processData = function (situations) {
        this._oData.displayTiles = this._oData.tiles = (situations || []).map(
            (situation) => ({
                id: situation.SitnInstanceID,
                title: situation.SitnDefShortText,
                text: this._getSituationText(
                    situation.SitnDefLongText,
                    situation.to_InstanceMessageParameter.results
                ),
                priority: "Medium",
                showPriorityText: false,
                link: "#SituationInstance-display?ui-type=objectbased",
                formatContent: false,
                headerImage: "sap-icon://message-warning",
                footerText: this.getResourceBundle().getText("createdSituation", [
                    this.toRelativeDateTime(this._getSituationDate(situation.CreationDateTime))
                ])
            })
        );
    };

    /**
     * Compose the situation text by replacing placeholders with formatted parameter values.
     *
     * @param {string} rawText - The raw text containing placeholders.
     * @param {Object[]} params - An array of parameters to replace in the text.
     * @returns {string} The composed text with replaced placeholders.
     */
    SituationPanel.prototype._getSituationText = function (rawText, params) {
        if (!rawText || !rawText.split) {
            return rawText;
        }

        let composedText = rawText;

        if (!this._dateFormatter) {
            const datePattern = sap.ui.getCore().getConfiguration().getFormatSettings().getDatePattern("medium") || "dd/MM/yyyy";
            this._dateFormatter = DateFormat.getDateInstance({ pattern: datePattern });
        }

        if (!this._decimalFormatter) {
            this._decimalFormatter = NumberFormat.getInstance({
                decimalSeparator: sap.ui.getCore().getConfiguration().getFormatSettings().getNumberSymbol("decimal") || ".",
                groupingSeparator: sap.ui.getCore().getConfiguration().getFormatSettings().getNumberSymbol("group") || ",",
                groupingEnabled: true
            });
        }

        if (params && params.length) {
            params.forEach((param) => {
                if (param.SitnMsgParamName && param.SitnMsgParamName.length > 0) {
                    let formattedVal;
                    let rawVal = param.SitnMsgParamVal.trim();

                    switch (param.SitnMsgParamType) {
                        case "Edm.DateTime":
                            formattedVal = this._dateFormatter.format(this._dateFormatter.parse(rawVal));
                            break;
                        case "Edm.Decimal":
                            // If the parameter string ends with a minus sign, move it to the first position
                            if (rawVal.endsWith("-")) {
                                rawVal = "-" + rawVal.substring(0, rawVal.length - 1);
                            }
                            formattedVal = this._decimalFormatter.format(rawVal);
                            break;
                        default:
                            formattedVal = rawVal;
                    }

                    // Replace placeholders with formatted values
                    composedText = composedText.split("{" + param.SitnMsgParamName + "}").join(formattedVal);
                }
            });
        }

        return composedText;
    };

    /**
     * Parse and convert an OData date string to a JavaScript Date object.
     *
     * @param {string} sODataDate - The OData date string to parse.
     * @returns {Date} A JavaScript Date object.
     */
    SituationPanel.prototype._getSituationDate = function (sODataDate) {
        const regex = /\/Date\((\d*)([+-])(\d*)\)\//;
        const dateParts = sODataDate.match(regex);
        const ticks = dateParts[1];
        const operator = dateParts[2];
        const offset = dateParts[3];
        const nTicks = ticks * 1;
        const nOffset = offset * 60000; //convert minutes to millisecond
        const nDate = operator === "-" ? nTicks - nOffset : nTicks + nOffset;

        return new Date(nDate);
    };

    /**
     * Convert a priority value to a corresponding value color.
     *
     * @param {string} priority - The priority value to convert.
     * @returns {string} The corresponding value color.
     */
    SituationPanel.prototype._convertToValueColor = function (priority) {
        const priorityValueColorMap = {
            "VeryHigh": "Error",
            "High": "Error",
            "Medium": "Critical",
            "Low": "Good",
            "Neutral": "Neutral"
        };

        return priorityValueColorMap[priority] || priorityValueColorMap.Neutral;
    };

    /**
     * Get the text for the "View All Items" list item.
     *
     * @returns {string} The text for the "View All Items" list item.
     */
    SituationPanel.prototype.getViewAllItemsText = function () {
        return this.getResourceBundle().getText("viewAllSituationsTitle");
    };

    /**
     * Get the text for the "No Data" message.
     *
     * @returns {string} The text for the "No Data" message.
     */
    SituationPanel.prototype.getNoDataText = function () {
        return this.getResourceBundle().getText("noSituationTitle");
    };

    return SituationPanel;
});
