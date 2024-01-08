/*!
 * Copyright (c) 2009-2023 SAP SE, All Rights Reserved
 */

sap.ui.define([
    "sap/f/GridContainer",
    "sap/f/GridContainerSettings",
    "sap/f/dnd/GridDropInfo",
    "sap/m/IllustratedMessage",
    "sap/m/IllustratedMessageSize",
    "sap/m/IllustratedMessageType",
    "sap/ui/core/Control",
    "sap/ui/core/dnd/DragInfo",
    "sap/ui/core/library",
    "sap/ui/core/ResizeHandler",
    "sap/ushell/ui/launchpad/ExtendedChangeDetection"
], function (
    GridContainer,
    GridContainerSettings,
    GridDropInfo,
    IllustratedMessage,
    IllustratedMessageSize,
    IllustratedMessageType,
    Control,
    DragInfo,
    coreLibrary,
    ResizeHandler,
    ExtendedChangeDetection
) {
    "use strict";


    // shortcut for sap.ui.core.dnd.DropLayout
    var DropLayout = coreLibrary.dnd.DropLayout;

    // shortcut for sap.ui.core.dnd.DropPosition
    var DropPosition = coreLibrary.dnd.DropPosition;

    /**
     * Constructor for a new WorkPageCell.
     *
     * @param {string} [sId] ID for the new control, generated automatically if no ID is given
     * @param {object} [mSettings] Initial settings for the new control
     *
     * @class
     * The WorkPageCell represents a collection of WidgetContainers.
     * @extends sap.ui.core.Control
     *
     *
     * @version 1.120.1
     *
     * @private
     * @experimental
     * @alias sap.ushell.components.workPageBuilder.controls.WorkPageCell
     */
    var WorkPageCell = Control.extend("sap.ushell.components.workPageBuilder.controls.WorkPageCell",
        /** @lends sap.ushell.components.workPageBuilder.controls.WorkPageCell.prototype */ {
            metadata: {
                library: "sap.ushell",
                properties: {
                    /**
                     * Tooltip to display for the "Delete Widget" button
                     */
                    deleteWidgetTooltip: { type: "string", defaultValue: "", bindable: true },
                    /**
                     * The button text to display
                     */
                    addApplicationButtonText: { type: "string", defaultValue: "", bindable: true },
                    /**
                     * Flag to show / hide the edit mode controls.
                     */
                    editMode: { type: "boolean", defaultValue: false, bindable: true },
                    /**
                     * Flag to enable / disable Drag and Drop of Widgets in the widgets aggregation.
                     */
                    tileMode: { type: "boolean", defaultValue: false, bindable: true },
                    /**
                     * Specifies the default value for the grid container's gap property for different screen sizes
                     */
                    gridContainerGap: { type: "string", group: "Appearance", defaultValue: "0.5rem", bindable: true },

                    /**
                     * Specifies the default value for the row size for different screen sizes
                     */
                    gridContainerRowSize: { type: "string", group: "Appearance", defaultValue: "5.25rem", bindable: true },

                    /**
                     * Title to display in the empty cell illustration
                     */
                    emptyIllustrationTitle: { type: "string", group: "Misc", defaultValue: "", bindable: true },
                    /**
                     * Message to display in the empty cell illustration
                     */
                    emptyIllustrationMessage: { type: "string", group: "Misc", defaultValue: "", bindable: true }
                },
                defaultAggregation: "widgets",
                aggregations: {
                    /**
                     * A set of widgets.
                     */
                    widgets: {
                        type: "sap.ui.core.Control",
                        multiple: true,
                        singularName: "widget",
                        bindable: true,
                        dnd: true,
                        forwarding: {
                            getter: "getGridContainer",
                            aggregation: "items"
                        }
                    },
                    /**
                     * Internal aggregation to hold the grid container
                     */
                    _gridContainer: {
                        type: "sap.f.GridContainer",
                        multiple: false,
                        visibility: "hidden"
                    },
                    /**
                     * The header toolbar that contains the delete and add buttons of the WorkPageCell.
                     */
                    headerBar: { type: "sap.m.OverflowToolbar", multiple: false },

                    /**
                     * Private aggregation for the Illustrated Message that is displayed if the WorkPageCell is empty.
                     * @private
                     */
                    _emptyIllustration: { type: "sap.m.IllustratedMessage", multiple: false, visibility: "hidden" }
                },
                events: {
                    /**
                     * Fired when a viz is moved via drag and drop
                     */
                    moveVisualization: {},
                    /**
                     * Fired when the gridContainer adds or removes grid columns (the grid is resized)
                     */
                    gridColumnsChange: {},
                    /**
                     * Fired when the border of a GridContainer is reached when using keyboard navigation
                     */
                    gridContainerBorderReached: {}
                }
            },

            renderer: {
                apiVersion: 2,

                /**
                 * Renders the HTML for the WorkPageCell, using the provided {@link sap.ui.core.RenderManager}.
                 *
                 * @param {sap.ui.core.RenderManager} rm The RenderManager.
                 * @param {sap.ushell.components.workPageBuilder.controls.WorkPageCell} workPageCell The WorkPageCell to be rendered.
                 */
                render: function (rm, workPageCell) {
                    rm.openStart("div", workPageCell);
                    rm.class("workPageCell");
                    // To avoid having a padding around cards in the grid container in the cell we need to set an additional class here
                    if (workPageCell.getTileMode()) {
                        rm.class("workPageCellTileMode");
                    } else {
                        rm.class("workPageCellCardMode");
                    }
                    rm.openEnd(); // div - tag


                    rm.openStart("div");
                    rm.class("workpageCellWidgetToolbar");
                    rm.openEnd(); // div - tag

                    rm.renderControl(workPageCell.getHeaderBar());

                    rm.close("div");



                    var aWidgets = workPageCell.getAggregation("widgets");
                    if (aWidgets.length <= 0) {
                        rm.renderControl(workPageCell.getIllustratedMessage());
                    } else {
                        rm.renderControl(workPageCell.getGridContainer());
                    }

                    rm.close("div");
                }
            }
        });

    /**
     * Initializes the control
     * Extended Change Detection for the widgets aggregation
     */
    WorkPageCell.prototype.init = function () {
        this._aRegistrationIds = [];
        this._oWidgetsChangeDetection = new ExtendedChangeDetection("widgets", this);
        this._oWidgetsChangeDetection.attachItemAdded(this.invalidate, this);
        Control.prototype.init.apply(this, arguments);
    };

    /**
     * Called if the control is destroyed.
     * Detaches event handlers.
     */
    WorkPageCell.prototype.exit = function () {
        this._deregisterResizeHandles();
        this._oWidgetsChangeDetection.destroy();
        Control.prototype.exit.apply(this, arguments);
    };

    /**
     * Deregister any existing registration ids for resize handlers.
     *
     * @private
     * @since 1.116.0
     */
    WorkPageCell.prototype._deregisterResizeHandles = function () {
        if (this._aRegistrationIds.length > 0) {
            this._aRegistrationIds.forEach(function (sRegistrationId) {
                ResizeHandler.deregister(sRegistrationId);
            });
            this._aRegistrationIds = [];
        }
    };

    /**
     * If a card is inserted into the WorkPageCell, register a ResizeHandler to set the width of the card to the width of the WorkPageCell.
     * This is required for the card to "break out" of the GridContainer.
     *
     * @param {string} sAggregationName The aggregationName.
     * @param {object} oObject The control, potentially a card.
     * @param {int} iIndex The index of the control in the aggregation.
     * @param {boolean} bSuppressInvalidate flag to suppress invalidation.
     * @since 1.116.0
     */
    WorkPageCell.prototype.insertAggregation = function (sAggregationName, oObject, iIndex, bSuppressInvalidate) {
        if (sAggregationName === "widgets" && oObject.isA("sap.ui.integration.widgets.Card")) {
            this._aRegistrationIds.push(ResizeHandler.register(this, this._resizeCard.bind(this, oObject)));
        }
        Control.prototype.insertAggregation.apply(this, arguments);
    };

    /**
     * Called if the WorkPageCell is resized. The card will be set to the full width of the WorkPageCell.
     * This workaround is necessary because we are using tiles and cards in the GridContainer, in order to show them mixed in the future.
     *
     * @param {sap.ui.integration.widgets.Card} oCard The card control.
     * @param {sap.base.Event} oEvent The resize event, containing the new cell width
     * @private
     * @since 1.116.0
     */
    WorkPageCell.prototype._resizeCard = function (oCard, oEvent) {
        var oDomRef = this.getAggregation("_gridContainer") &&
            this.getAggregation("_gridContainer").getDomRef();

        if (!oDomRef) {
            return;
        }

        var iWidth = parseFloat(window.getComputedStyle(oDomRef).width);

        if (iWidth) {
            oCard.setWidth(iWidth + "px");
        }
    };

    /**
     * Creates a new GridContainer if it does not exist yet and saves it to the _gridContainer aggregation.
     * Applies layout data and drag & drop config accordingly.
     *
     * @returns {sap.f.GridContainer} The GridContainer control instance.
     */
    WorkPageCell.prototype.getGridContainer = function () {
        var oGridContainer = this.getAggregation("_gridContainer");
        if (!oGridContainer) {
            oGridContainer = this._createGridContainer()
                .attachColumnsChange(function (oEvent) {
                    this.fireEvent("gridColumnsChange", oEvent.getParameters());
                }.bind(this));
            this.setAggregation("_gridContainer", oGridContainer.addStyleClass("workPageGridContainer"));
        }

        // Prevent drop target if we are not in edit mode, if the widgets contain a card inside or if the cell is empty (in this case an Illustrated Message will be shown in the future)
        if (!this.getEditMode() || !this.getTileMode() || oGridContainer.getItems().length === 0) {
            oGridContainer.removeAllDragDropConfig();
        } else if (oGridContainer.getDragDropConfig().length === 0) {
            oGridContainer
                .addDragDropConfig(new DragInfo({
                    groupName: "CellGridContainer",
                    sourceAggregation: "items"
                }))
                .addDragDropConfig(new GridDropInfo({
                    groupName: "CellGridContainer",
                    targetAggregation: "items",
                    dropIndicatorSize: function (oDraggedControl) {
                        var iColumns = 2;
                        if (oDraggedControl.getLayoutData() && oDraggedControl.getLayoutData().getColumns()) {
                            iColumns = oDraggedControl.getLayoutData().getColumns();
                        }
                        return {
                            rows: 1,
                            columns: iColumns
                        };
                    },
                    dropPosition: DropPosition.Between,
                    dropLayout: DropLayout.Horizontal,
                    drop: this.onDrop.bind(this)
                }));
        }

        return oGridContainer
            .setInlineBlockLayout(true)
            .setSnapToRow(false)
            .setLayout(new GridContainerSettings({
                columnSize: this.getGridContainerRowSize(),
                gap: this.getGridContainerGap()
            }));
    };

    /**
     * Creates a new GridContainer and saves it to the aggregation.
     * If it already exists, returns the existing instance.
     *
     * @returns {sap.f.GridContainer} The GridContainer control instance.
     * @private
     */
    WorkPageCell.prototype._createGridContainer = function () {
        return new GridContainer(`${this.getId()}--workPageCellGridContainer`, {
            containerQuery: false,
            minHeight: "0",
            borderReached: this.onBorderReached.bind(this)
        });
    };

    /**
     * Called when the border of a GridContainer is reached using keyboard navigation
     *
     * @param {sap.base.Event} oEvent The original Event of the GridContainer
     */
    WorkPageCell.prototype.onBorderReached = function (oEvent) {
        this.fireEvent("gridContainerBorderReached", oEvent.getParameters());
    };

    /**
     * Called when a viz is dropped into the cell.
     * @param {sap.f.dnd.GridDropInfo} oEvent The GridDropInfo
     */
    WorkPageCell.prototype.onDrop = function (oEvent) {
        this.fireEvent("moveVisualization", oEvent.getParameters());
    };

    /**
     * Checks if the private aggregation "_emptyIllustration" exists.
     * If not, the control is created and stored in the aggregation.
     *
     * @returns {sap.m.IllustratedMessage} The IllustratedMessage control.
     */
    WorkPageCell.prototype.getIllustratedMessage = function () {
        if (!this.getAggregation("_emptyIllustration")) {
            this.setAggregation("_emptyIllustration", this._createIllustratedMessage());
        }
        return this.getAggregation("_emptyIllustration");
    };

    /**
     * Creates an IllustratedMessage control.
     * This control is displayed if the WorkPageCell is empty.
     *
     * @returns {sap.m.IllustratedMessage} The IllustratedMessage control.
     * @private
     */
    WorkPageCell.prototype._createIllustratedMessage = function () {
        return new IllustratedMessage(`${this.getId()}-emptyCellMessage`, {
            illustrationType: IllustratedMessageType.NoColumnsSet,
            illustrationSize: IllustratedMessageSize.Spot,
            title: this.getEmptyIllustrationTitle(),
            description: this.getEmptyIllustrationMessage(),
            visible: "{/editMode}"
        });
    };

    /**
     * Called when the control or any child element of the control gains focus.
     * Adds focused class to control.
     */
    WorkPageCell.prototype.onfocusin = function () {
        if (!this.hasStyleClass("workPageCellFocused")) {
            this.addStyleClass("workPageCellFocused");
        }
    };

    /**
     * Called when focus leaves the control and any child element of the control.
     * Removes focused class from control.
     */
    WorkPageCell.prototype.onfocusout = function () {
        if (this.hasStyleClass("workPageCellFocused")) {
            this.removeStyleClass("workPageCellFocused");
        }
    };

    return WorkPageCell;
});
