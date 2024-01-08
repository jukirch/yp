//Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview Provides control sap.ushell.ui.launchpad.Section
 *
 * @version 1.120.1
 */
sap.ui.define([
    "sap/base/Log",
    "sap/base/util/deepClone",
    "sap/f/dnd/GridDropInfo",
    "sap/f/GridContainer",
    "sap/f/GridContainerItemLayoutData",
    "sap/f/GridContainerSettings",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/Label",
    "sap/m/library",
    "sap/m/Text",
    "sap/m/Title",
    "sap/m/ToolbarSpacer",
    "sap/m/OverflowToolbar",
    "sap/m/OverflowToolbarLayoutData",
    "sap/ui/core/Control",
    "sap/ui/core/Core",
    "sap/ui/core/CustomData",
    "sap/ui/core/dnd/DragInfo",
    "sap/ui/core/dnd/DropInfo",
    "sap/ui/core/InvisibleMessage",
    "sap/ui/core/library",
    "sap/ui/events/KeyCodes",
    "sap/ui/model/Filter",
    "sap/ushell/resources",
    "sap/ushell/ui/launchpad/ExtendedChangeDetection",
    "sap/ushell/library",
    "sap/ushell/ui/launchpad/section/CompactArea",
    "sap/ui/core/Element",
    "sap/ushell/ui/launchpad/SectionRenderer"
], function (
    Log,
    deepClone,
    GridDropInfo,
    GridContainer,
    GridContainerItemLayoutData,
    GridContainerSettings,
    Button,
    Input,
    Label,
    mobileLibrary,
    Text,
    Title,
    ToolbarSpacer,
    OverflowToolbar,
    OverflowToolbarLayoutData,
    Control,
    Core,
    CustomData,
    DragInfo,
    DropInfo,
    InvisibleMessage,
    coreLibrary,
    KeyCodes,
    Filter,
    resources,
    ExtendedChangeDetection,
    ushellLibrary,
    CompactArea,
    Element,
    SectionRenderer
) {
    "use strict";

    // shortcut for sap.m.ButtonType
    var ButtonType = mobileLibrary.ButtonType;

    // shortcut for sap.m.OverflowToolbarPriority
    var OverflowToolbarPriority = mobileLibrary.OverflowToolbarPriority;

    // shortcut for sap.m.TileSizeBehavior
    var TileSizeBehavior = mobileLibrary.TileSizeBehavior;

    // shortcut for sap.ui.core.dnd.DropLayout
    var DropLayout = coreLibrary.dnd.DropLayout;

    // shortcut for sap.ui.core.dnd.DropPosition
    var DropPosition = coreLibrary.dnd.DropPosition;

    // shortcut for sap.ui.core.InvisibleMessageMode
    var InvisibleMessageMode = coreLibrary.InvisibleMessageMode;

    // shortcut for sap.ui.core.TextAlign
    var TextAlign = coreLibrary.TextAlign;

    // shortcut for sap.ui.core.TitleLevel
    var TitleLevel = coreLibrary.TitleLevel;

    // shortcut for sap.ushell.DisplayFormat
    var DisplayFormat = ushellLibrary.DisplayFormat;

    // with given HTMLElement, loop the aViz array and find the nearest visualization (compare distances between rectangle centers)
    function _getNearestViz (oRefItem, aViz, bAbove) {
        if (!Array.isArray(aViz) || !aViz.length) {
            return null;
        }
        if (oRefItem && oRefItem.getDomRef) {
            oRefItem = oRefItem.getDomRef();
        }
        if (!oRefItem) {
            return aViz[bAbove ? aViz.length - 1 : 0]; // last item if above (going up), first item if below (going down)
        }

        // measure of distance between centers of two rectangles (square of double, to spare calculations)
        function getDistance (r1, r2) {
            var dx = r1.left + r1.right - r2.left - r2.right;
            var dy = r1.top + r1.bottom - r2.top - r2.bottom;
            return dx * dx + dy * dy;
        }

        // line tiles may contain line break and need special handling: use the sapMGTLineStyleHelper rectangle
        function getItemRect (oElement) {
            var oLineStyleHelper = oElement.querySelector(".sapMGTLineStyleHelper");
            return (oLineStyleHelper || oElement).getBoundingClientRect();
        }

        var oRefRect = getItemRect(oRefItem);
        var oNearestViz = null;
        var nMinDistance = 0;
        var oRect;
        var oItem;
        var nDistance;
        // Find the nearest visualization below or above. Compare distances between centers of the visualization and the reference DOM element.
        for (var i = aViz.length - 1; i >= 0; i--) {
            oItem = aViz[i].getDomRef();
            if (oItem) {
                oRect = getItemRect(oItem);
                if (!oRect.width && !oRect.height) { // element is not visible
                    continue;
                }
                if (bAbove && oRect.top >= oRefRect.top || !bAbove && oRect.bottom <= oRefRect.bottom) { // check if the element is really above/below
                    continue;
                }
                nDistance = getDistance(oRect, oRefRect);
                if (!oNearestViz || nDistance < nMinDistance) {
                    oNearestViz = aViz[i];
                    nMinDistance = nDistance;
                }
            }
        }
        return oNearestViz;
    }

    /**
     * Constructor for a new Section.
     *
     * @param {string} [sId] ID for the new control, generated automatically if no ID is given
     * @param {object} [mSettings] Initial settings for the new control
     *
     * @class
     * The Section represents a structured collection of visualizations.
     * @extends sap.ui.core.XMLComposite
     *
     * @author SAP SE
     * @version 1.120.1
     *
     * @private
     * @alias sap.ushell.ui.launchpad.Section
     * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
     */
    var Section = Control.extend("sap.ushell.ui.launchpad.Section", /** @lends sap.ushell.ui.launchpad.Section.prototype */ {
        metadata: {
            library: "sap.ushell",
            properties: {

                /**
                 * Specifies the data-help-id attribute of the Section.
                 * If left empty, the attribute is not rendered.
                 * If the default property is set to true, the data-help-id is: "recently-added-apps"
                 */
                dataHelpId: { type: "string", group: "Misc", defaultValue: "" },

                /**
                 * Specifies if the section is a default section.
                 * A default section contains tiles that are added to a page using the App Finder.
                 * The title of the default section is predefined and cannot be changed.
                 * Users cannot add tiles to a default section using drag and drop or keyboard keys.
                 * However, users can move or remove the tiles from, and rearrange the tiles inside of a default section.
                 * There should be only one default section on the page. It is always the topmost section and its position cannot be changed.
                 * An empty default section is not displayed.
                 */
                default: { type: "boolean", group: "Misc", defaultValue: false },

                /**
                 * Specifies if the section should display in the edit mode.
                 */
                editable: { type: "boolean", group: "Misc", defaultValue: false },

                /**
                 * Specifies if the 'Add Visualization' button should be shown during editing of the section. (See editable property)
                 * The 'Add Visualization' button triggers the add event when it is pressed.
                 */
                enableAddButton: { type: "boolean", group: "Behavior", defaultValue: true },

                /**
                 * Specifies if the 'Delete Section' button should be shown during editing of the section. (See editable property)
                 * The 'Delete Section' button triggers the delete event when it is pressed.
                 */
                enableDeleteButton: { type: "boolean", group: "Behavior", defaultValue: true },

                /**
                 * Specifies if the grid breakpoints are used.
                 * This is to limit the reordering during resizing, it might break certain layouts.
                 */
                enableGridBreakpoints: { type: "boolean", group: "Appearance", defaultValue: false },

                /**
                 * Specifies if the grid container query is used.
                 * This is to use the outer container size instead of the window size to calculate breakpoints.
                 */
                enableGridContainerQuery: { type: "boolean", group: "Appearance", defaultValue: false },

                /**
                 * Specifies if the 'Reset Section' button should be shown during editing of the section. (See editable property)
                 * The 'Reset Section' button triggers the reset event when it is pressed.
                 */
                enableResetButton: { type: "boolean", group: "Behavior", defaultValue: true },

                /**
                 * Specifies if the 'Show / Hide Section' button should be shown during editing of the section. (See editable property)
                 */
                enableShowHideButton: { type: "boolean", group: "Behavior", defaultValue: true },

                /**
                 * Specifies whether visualization reordering is enabled. Relevant only for desktop devices.
                 */
                enableVisualizationReordering: { type: "boolean", group: "Behavior", defaultValue: false },

                /**
                 * Specifies the default value for the grid container's gap property for different screen sizes
                 */
                gridContainerGap: { type: "string", group: "Appearance", defaultValue: "0.5rem" },
                gridContainerGapXS: { type: "string", group: "Appearance", defaultValue: "0.475rem" },
                gridContainerGapS: { type: "string", group: "Appearance", defaultValue: "0.475rem" },
                gridContainerGapM: { type: "string", group: "Appearance", defaultValue: "0.5rem" },
                gridContainerGapL: { type: "string", group: "Appearance", defaultValue: "0.5rem" },
                gridContainerGapXL: { type: "string", group: "Appearance", defaultValue: "0.5rem" },

                /**
                 * Specifies the default value for the row size for different screen sizes
                 */
                gridContainerRowSize: { type: "string", group: "Appearance", defaultValue: "5.25rem" },
                gridContainerRowSizeXS: { type: "string", group: "Appearance", defaultValue: "4.375rem" },
                gridContainerRowSizeS: { type: "string", group: "Appearance", defaultValue: "5.25rem" },
                gridContainerRowSizeM: { type: "string", group: "Appearance", defaultValue: "5.25rem" },
                gridContainerRowSizeL: { type: "string", group: "Appearance", defaultValue: "5.25rem" },
                gridContainerRowSizeXL: { type: "string", group: "Appearance", defaultValue: "5.25rem" },

                /**
                 * This text is displayed when the control contains no visualizations.
                 */
                noVisualizationsText: { type: "string", group: "Appearance", defaultValue: resources.i18n.getText("Section.NoVisualizationsText") },

                /**
                 * Specifies the title of the section.
                 */
                title: { type: "string", group: "Appearance", defaultValue: "" },

                /**
                 * Defines whether or not the text specified in the <code>noVisualizationsText</code> property is displayed.
                 */
                showNoVisualizationsText: { type: "boolean", group: "Behavior", defaultValue: false },

                /**
                 * Specifies if the section should be visible during non editing of the section. (See editable property)
                 */
                showSection: { type: "boolean", group: "Misc", defaultValue: true },

                /**
                 * Specifies if the link area is visible.
                 */
                showLinks: { type: "boolean", group: "Behavior", defaultValue: true },

                /**
                 * Specifies the sizeBehavior of the grid.
                 */
                sizeBehavior: { type: "sap.m.TileSizeBehavior", group: "Misc", defaultValue: TileSizeBehavior.Responsive }
            },
            defaultAggregation: "visualizations",
            aggregations: {

                /**
                 * Dummy aggregation for visualizations in this section. Aggregation manipulation API should not be used.
                 * The content should be provided with the binding on the "visualisations" path of the model.
                 * There is only the following API available: bindVisualizations, getVisualizations and indexOfVisualization.
                 * @private
                 */
                visualizations: {
                    type: "sap.ui.core.Control",
                    bindable: "bindable",
                    multiple: true
                },
                /**
                 * Visualizations in the default area (normal tiles). This aggregation should be never accessed directly.
                 * @private
                 */
                defaultItems: {
                    type: "sap.ui.core.Control",
                    multiple: true,
                    forwarding: {
                        idSuffix: "-defaultArea",
                        aggregation: "items",
                        forwardBinding: false
                    },
                    dnd: true
                },
                /**
                 * Visualizations in the flat area (flat and flat wide tiles). This aggregation should be never accessed directly.
                 * @private
                 */
                flatItems: {
                    type: "sap.ui.core.Control",
                    multiple: true,
                    forwarding: {
                        idSuffix: "-flatArea",
                        aggregation: "items",
                        forwardBinding: false
                    },
                    dnd: true
                },
                /**
                 * Visualizations in the compact area (link tiles). This aggregation should be never accessed directly.
                 * @private
                 */
                compactItems: {
                    type: "sap.ui.core.Control",
                    multiple: true,
                    forwarding: {
                        idSuffix: "-compactArea",
                        aggregation: "items",
                        forwardBinding: false
                    },
                    dnd: true
                },
                _title: {
                    type: "sap.m.Title",
                    multiple: false,
                    hidden: true
                },
                _header: {
                    type: "sap.m.OverflowToolbar",
                    multiple: false,
                    hidden: true
                },
                _noVisualizationsText: {
                    type: "sap.m.Text",
                    multiple: false,
                    hidden: true
                },
                _defaultArea: {
                    type: "sap.f.GridContainer",
                    multiple: false,
                    hidden: true
                },
                _flatArea: {
                    type: "sap.f.GridContainer",
                    multiple: false,
                    hidden: true
                },
                _compactArea: {
                    type: "sap.ushell.ui.launchpad.section.CompactArea",
                    multiple: false,
                    hidden: true
                }
            },
            events: {

                /**
                 * Fires when the add visualization button is pressed.
                 */
                add: {},

                /**
                 * Fires when the delete button is pressed
                 */
                delete: {},

                /**
                 * Fires when the reset button is pressed.
                 */
                reset: {},

                /**
                 * Fires when the title is changed.
                 */
                titleChange: {},

                /**
                 * Fires when a control is dropped on the grid.
                 */
                visualizationDrop: {
                    parameters: {

                        /**
                         * The control that was dragged.
                         */
                        draggedControl: { type: "sap.ui.core.Control" },

                        /**
                         * The control where the dragged control was dropped.
                         */
                        droppedControl: { type: "sap.ui.core.Control" },

                        /**
                         * A string defining from what direction the dragging happend.
                         */
                        dropPosition: { type: "string" }
                    }
                },

                areaDragEnter: {
                    parameters: {

                        /**
                         * The original event object of the area's onDragEnter event. Use its preventDefault function
                         * to prevent the drop into the target area.
                         */
                        originalEvent: { type: "sap.ui.base.Event" },

                        /**
                         * The control that was dragged.
                         */
                        dragControl: { type: "sap.ui.core.Control" },

                        /**
                         * The source area's display format.
                         */
                        sourceArea: { type: "string" },

                        /**
                         * The target area's display format.
                         */
                        targetArea: { type: "string" }
                    }
                },

                /**
                 * Fires when the section hides or unhides changed.
                 */
                sectionVisibilityChange: {
                    parameters: {

                        /**
                         * Determines whether the section is now visible or invisible.
                         */
                        visible: { type: "boolean" }
                    }
                },

                /**
                 * Fires when the user attempts to do keyboard navigation out of the section
                 * (e.g. right arrow when the last item is focused), so that an application can react on this.
                 */
                borderReached: {
                    parameters: {
                        /**
                         * Event that leads to the focus change.
                         */
                        event: { type: "jQuery.Event" }
                    }
                }
            }
        },
        renderer: SectionRenderer,
        resourceModel: resources.i18nModel
    });

    // Function members without JSDOC below are either closure functions
    // that should never be called outside except for the qUnit tests
    // or specific ManagedObject overrides.

    // Get the display format hint from model data
    function getDisplayFormatHint (oConfig) {
        for (var sDisplayFormatName in DisplayFormat) {
            if (oConfig.displayFormatHint === DisplayFormat[sDisplayFormatName]) {
                return DisplayFormat[sDisplayFormatName];
            }
        }

        // Legacy issue: The service returned "tile" instead of "default" for some time.
        // As "old" service version might run with current ushell, "tile" must work.
        // In the CDM runtime site the displayFormatHint is not mandatory and defaults to "standard".
        if (oConfig.displayFormatHint && oConfig.displayFormatHint !== "tile") {
            Log.error("DisplayFormat '" + oConfig.displayFormatHint + "' not valid - 'standard' is used");
        }
        return DisplayFormat.Standard;
    }

    // Standard filter condition for the default area binding
    function getDefaultAreaFilter () {
        return new Filter({
            path: "",
            caseSensitive: true,
            test: function (oConfig) {
                var sDisplayFormatHint = getDisplayFormatHint(oConfig);
                return sDisplayFormatHint === DisplayFormat.Standard || sDisplayFormatHint === DisplayFormat.StandardWide;
            }
        });
    }

    // Standard filter condition for the flat area binding
    function getFlatAreaFilter () {
        return new Filter({
            path: "",
            caseSensitive: true,
            test: function (oConfig) {
                var sDisplayFormatHint = getDisplayFormatHint(oConfig);
                return sDisplayFormatHint === DisplayFormat.Flat || sDisplayFormatHint === DisplayFormat.FlatWide;
            }
        });
    }

    // Standard filter condition for the compact area binding
    function getCompactAreaFilter () {
        return new Filter({
            path: "",
            caseSensitive: true,
            test: function (oConfig) {
                return getDisplayFormatHint(oConfig) === DisplayFormat.Compact;
            }
        });
    }


    // Override bindVisualizations and forward item creation to the corresponding areas.
    // Visualizations with displayHint:
    // - "default" are created in the default area
    // - "flat" are created in the flat area
    // - "flatWide" are created in the flat area
    // - "compact" - in the compact area.
    // The order of visualization in the model is not changed.
    // Visualization instances are never moved between areas. A new instance is always created instead.
    Section.prototype.bindAggregation = function (sAggregationName, oBindingInfo) {
        if (sAggregationName === "visualizations") {
            if (oBindingInfo.filters) {
                // TODO: combine with pre-existing filters in binding, if any
                Log.error("bind visualizations with pre-existing filters is not implemented.");
            }

            var oDefaultBinding = deepClone(oBindingInfo);
            oDefaultBinding.filters = getDefaultAreaFilter();
            Control.prototype.bindAggregation.call(this, "defaultItems", oDefaultBinding);

            var oFlatBinding = deepClone(oBindingInfo);
            oFlatBinding.filters = getFlatAreaFilter();
            Control.prototype.bindAggregation.call(this, "flatItems", oFlatBinding);

            var oLinkBinding = deepClone(oBindingInfo);
            oLinkBinding.filters = getCompactAreaFilter();
            Control.prototype.bindAggregation.call(this, "compactItems", oLinkBinding);
        } else {
            Control.prototype.bindAggregation.call(this, sAggregationName, oBindingInfo);
        }
        return this;
    };

    /**
     * Returns all visualization instances of a section in the visual order.
     * @returns {object[]} Array of visualizations.
     */
    Section.prototype.getAllItems = function () {
        return this.getDefaultItems().concat(this.getFlatItems(), this.getCompactItems());
    };

    /**
     * Returns all available visualization instances of a section in the order as defined in the model.
     * @returns {object[]} Array of visualizations.
     */
    Section.prototype.getVisualizations = function () {
        var aVisualizations = this.getAllItems();

        aVisualizations.sort(function (oViz1, oViz2) {
            var sPath = oViz1.getBindingContext().getPath();
            var iIndex1 = parseInt(sPath.split("/").pop(), 10);
            sPath = oViz2.getBindingContext().getPath();
            var iIndex2 = parseInt(sPath.split("/").pop(), 10);

            // If the index of the binding is the same, sort by array the index.
            if (iIndex1 === iIndex2) {
                iIndex1 = aVisualizations.indexOf(oViz1);
                iIndex2 = aVisualizations.indexOf(oViz2);
            }

            return (iIndex1 < iIndex2) ? -1 : 1;
        });

        return aVisualizations;
    };

    // Filter visualizations according to the given filter criteria.
    // This function is needed for the role context preview.
    // Each area is filtered separately.
    Section.prototype.filterVisualizations = function (oFilter) {
        var oDefaultFilter = oFilter ? new Filter({
                filters: [getDefaultAreaFilter(), oFilter],
                and: true
            }) : getDefaultAreaFilter();
        var oFlatFilter = oFilter ? new Filter({
                filters: [getFlatAreaFilter(), oFilter],
                and: true
            }) : getFlatAreaFilter();
        var oCompactFilter = oFilter ? new Filter({
                filters: [getCompactAreaFilter(), oFilter],
                and: true
            }) : getCompactAreaFilter();
        this.getBinding("defaultItems").filter(oDefaultFilter);
        this.getBinding("flatItems").filter(oFlatFilter);
        this.getBinding("compactItems").filter(oCompactFilter);
    };

    /** Returns index of a visualization according to the model.
     * @param {object} oVisualization Visualization instance.
     * @returns {int} Index of the visualization in the model.
     */
    Section.prototype.indexOfVisualization = function (oVisualization) {
        return this.getVisualizations().indexOf(oVisualization);
    };

    // Override setters to make sure that the "visualizations" aggregation is never accessed directly.
    Section.prototype.addVisualization = function (visualization, bSuppressInvalidate) {
        Log.error("Section.prototype.addVisualization should not be called");
        return this.addAggregation("visualizations", visualization, bSuppressInvalidate);
    };

    Section.prototype.insertVisualization = function (visualization, index, bSuppressInvalidate) {
        Log.error("Section.prototype.insertVisualization should not be called");
        return this.insertAggregation("visualizations", visualization, index, bSuppressInvalidate);
    };

    Section.prototype.removeVisualization = function (visualization, bSuppressInvalidate) {
        Log.error("Section.prototype.removeVisualization should not be called");
        return this.removeAggregation("visualizations", visualization, bSuppressInvalidate);
    };

    // Listener for the borderReached event of specific areas, when the arrow keyboard navigation gets over the last item in one of the areas.
    // The function navigates to the next area or, if the next area is empty or does not exist, emits a Section.borderReached event.
    Section.prototype.onBorderReached = function (oEvent) {
        var oViz;
        var oOrigEvent = oEvent.getParameter("event");
        var sKeyCode = oOrigEvent.keyCode;
        var sType = oOrigEvent.type;
        var oItem = Element.closestTo(oOrigEvent.target.firstElementChild);

        switch (sKeyCode) {
            case KeyCodes.ARROW_UP:
                oViz = this.getClosestVizualization(oItem, true);
                break;
            case KeyCodes.ARROW_DOWN:
                oViz = this.getClosestVizualization(oItem, false);
                break;
            case KeyCodes.ARROW_LEFT:
                oViz = this._getPreviousViz(oItem);
                break;
            case KeyCodes.ARROW_RIGHT:
                oViz = this._getNextViz(oItem);
                break;
            default:
                break;
        }

        if (oViz) { // Focus the next item.
            this._focusItem(this.getItemPosition(oViz));
            oOrigEvent.preventDefault(); // prevent scrolling
        } else { // There is no next item. Emit the borderReached event.
            this.fireBorderReached({
                event: oEvent,
                section: this,
                direction: sType === "sapnext" ? "down" : "up"
            });
        }
    };

    // Get the next visualization in the visual order (default first, then flat, then compact)
    Section.prototype._getNextViz = function (oViz) {
        var aViz = this.getAllItems();
        var index = aViz.indexOf(oViz);
        return index === -1 ? aViz[0] : aViz[index + 1];
    };

    // Get the previous visualization in the visual order (default first, then flat, then compact)
    Section.prototype._getPreviousViz = function (oViz) {
        var aViz = this.getAllItems();
        var index = aViz.indexOf(oViz);
        return index === -1 ? aViz[aViz.length - 1] : aViz[index - 1];
    };

    // Toggle the container visibility in case there are no visualizations in the section.
    Section.prototype.handleEmptyContentAreas = function () {
        var bDefaultAreaHasItems = !!this.getDefaultItems().length;
        var bFlatAreaHasItems = !!this.getFlatItems().length;
        var bCompactAreaHasItems = !!this.getCompactItems().length;
        var bSectionEmpty = !bDefaultAreaHasItems && !bCompactAreaHasItems && !bFlatAreaHasItems;

        this.toggleStyleClass("sapUshellSectionNoVisualizations", bSectionEmpty);
        this.getAggregation("_defaultArea").toggleStyleClass("sapUshellSectionDefaultArea", bDefaultAreaHasItems);
        this.getAggregation("_flatArea").toggleStyleClass("sapUshellSectionFlatArea", bFlatAreaHasItems);

        var oDomRef = this.getDomRef();
        if (oDomRef) {
            if (this.getEditable() && this.getShowNoVisualizationsText() && bSectionEmpty) {
                oDomRef.setAttribute("aria-describedBy", this.getAggregation("_noVisualizationsText").getId());
            } else {
                oDomRef.removeAttribute("aria-describedBy");
            }
        }
    };

    Section.prototype.init = function () {
        this.setAggregation("_title", new Title({
            text: this.getTitle(),
            level: TitleLevel.H3,
            visible: !this.getEditable() && this.getShowSection()
        }).addStyleClass("sapUshellSectionTitle sapContrastPlus"));

        this._initHeaderAggregation();

        this.setAggregation("_noVisualizationsText", new Text({
            text: this.getNoVisualizationsText(),
            textAlign: TextAlign.Center,
            visible: this.getEditable() && this.getShowNoVisualizationsText()
        }).addStyleClass("sapUshellSectionNoVisualizationsText"));

        this._initGridContainerAggregation(); // defaultArea
        this._initGridContainerAggregation(true); // flatArea
        this._initCompactAreaAggregation(true); // compactArea


        this._oInvisibleMessageInstance = InvisibleMessage.getInstance();

        this._oDefaultItemsChangeDetection = new ExtendedChangeDetection("defaultItems", this, ["flatItems", "compactItems"]);
        this._oFlatItemsChangeDetection = new ExtendedChangeDetection("flatItems", this, ["defaultItems", "compactItems"]);
        this._oCompactItemsChangeDetection = new ExtendedChangeDetection("compactItems", this, ["defaultItems", "flatItems"]);

        // mouse DnD uses implicit Conversion
        this._fnGlobalDragStart = function () {
            var aFlatAreaDragDropConfig = this.getAggregation("_flatArea").getDragDropConfig();
            var aCompactAreaDragDropConfig = this.getAggregation("_compactArea").getDragDropConfig();
            aFlatAreaDragDropConfig[0].setGroupName("Section");
            aFlatAreaDragDropConfig[1].setGroupName("Section");
            aCompactAreaDragDropConfig[0].setGroupName("Section");
            aCompactAreaDragDropConfig[1].setGroupName("Section");
            aCompactAreaDragDropConfig[2].setGroupName("Section");
        }.bind(this);

        this._fnGlobalDragEnd = function () {
            var aFlatAreaDragDropConfig = this.getAggregation("_flatArea").getDragDropConfig();
            var aCompactAreaDragDropConfig = this.getAggregation("_compactArea").getDragDropConfig();
            aFlatAreaDragDropConfig[0].setGroupName("FlatArea");
            aFlatAreaDragDropConfig[1].setGroupName("FlatArea");
            aCompactAreaDragDropConfig[0].setGroupName("CompactArea");
            aCompactAreaDragDropConfig[1].setGroupName("CompactArea");
            aCompactAreaDragDropConfig[2].setGroupName("CompactArea");
        }.bind(this);

        document.addEventListener("dragstart", this._fnGlobalDragStart, false);
        document.addEventListener("dragend", this._fnGlobalDragEnd, false);
    };

    Section.prototype._initHeaderAggregation = function () {
        var sTitle = this.getTitle();
        var bDefault = this.getDefault();

        var oInput = new Input({
            maxLength: 100,
            placeholder: resources.i18n.getText("Section.TitlePlaceholder"),
            value: sTitle,
            valueLiveUpdate: true,
            visible: !bDefault,
            change: function (oEvent) {
                this.setTitle(oEvent.getParameter("value"));
                this.fireTitleChange();
            }.bind(this),
            layoutData: new OverflowToolbarLayoutData({
                priority: OverflowToolbarPriority.NeverOverflow,
                shrinkable: true,
                minWidth: "9rem",
                maxWidth: "40rem"
            })
        });

        this.setAggregation("_header", new OverflowToolbar({
            content: [
                new Text({
                    text: sTitle,
                    visible: bDefault,
                    layoutData: new OverflowToolbarLayoutData({
                        priority: OverflowToolbarPriority.NeverOverflow
                    })
                }),
                new Label({
                    text: resources.i18n.getText("Section.Label.Title"),
                    labelFor: oInput.getId(),
                    showColon: true,
                    visible: !bDefault,
                    layoutData: new OverflowToolbarLayoutData({
                        priority: OverflowToolbarPriority.NeverOverflow
                    })
                }),
                oInput,
                new ToolbarSpacer(),
                new Button({
                    text: resources.i18n.getText("Section.Button.AddVisualization"),
                    type: ButtonType.Transparent,
                    press: this.fireAdd.bind(this, { section: this }),
                    visible: this.getEnableAddButton() && !bDefault
                }),
                new Button({
                    text: this.getShowSection() ? resources.i18n.getText("Section.Button.Hide") : resources.i18n.getText("Section.Button.Show"),
                    type: ButtonType.Transparent,
                    press: function () {
                        var bValue = !this.getShowSection();
                        // temporary work around until sap.m.Button announces a label change to the user.
                        var oMResources = Core.getLibraryResourceBundle("sap.m");
                        this._oInvisibleMessageInstance.announce([
                            resources.i18n.getText(bValue ? "Section.nowBeingShown" : "Section.nowBeingHidden"),
                            resources.i18n.getText("Section.ButtonLabelChanged"),
                            resources.i18n.getText(bValue ? "Section.Button.Hide" : "Section.Button.Show"),
                            oMResources.getText("ACC_CTR_TYPE_BUTTON")
                        ].join(" "), InvisibleMessageMode.Polite);

                        this.setShowSection(bValue);
                        this.fireSectionVisibilityChange({ visible: bValue });
                    }.bind(this),
                    visible: this.getEnableShowHideButton() && !bDefault
                }),
                new Button({
                    text: resources.i18n.getText("Section.Button.Reset"),
                    type: ButtonType.Transparent,
                    press: this.fireReset.bind(this),
                    visible: this.getEnableResetButton() && !bDefault
                }),
                new Button({
                    text: resources.i18n.getText("Section.Button.Delete"),
                    type: ButtonType.Transparent,
                    press: this.fireDelete.bind(this),
                    visible: this.getEnableDeleteButton() && !bDefault
                })
            ],
            visible: this.getEditable()
        }).addStyleClass("sapUshellSectionHeader"));
    };

    Section.prototype._initGridContainerAggregation = function (bFlatArea) {
        var oGridContainer = new GridContainer({
            id: this.getId() + (bFlatArea ? "-flatArea" : "-defaultArea"),
            containerQuery: this.getEnableGridContainerQuery(),
            minHeight: "0",
            visible: this.getEditable() || this.getShowSection(),
            customData: [
                new CustomData({
                    key: "default",
                    value: this.getDefault()
                }),
                new CustomData({
                    key: "area",
                    value: bFlatArea ? DisplayFormat.Flat : DisplayFormat.Standard
                })
            ],
            layout: new GridContainerSettings({
                rowSize: this.getGridContainerRowSize(),
                columnSize: this.getGridContainerRowSize(),
                gap: this.getGridContainerGap()
            }),
            layoutXS: new GridContainerSettings({
                columns: 0,
                rowSize: this.getGridContainerRowSizeXS(),
                columnSize: this.getGridContainerRowSizeXS(),
                gap: this.getGridContainerGapXS()
            }),
            layoutS: new GridContainerSettings({
                columns: 0,
                rowSize: this.getGridContainerRowSizeS(),
                columnSize: this.getGridContainerRowSizeS(),
                gap: this.getGridContainerGapS()
            }),
            layoutM: new GridContainerSettings({
                columns: 0,
                rowSize: this.getGridContainerRowSizeM(),
                columnSize: this.getGridContainerRowSizeM(),
                gap: this.getGridContainerGapM()
            }),
            layoutL: new GridContainerSettings({
                columns: 0,
                rowSize: this.getGridContainerRowSizeL(),
                columnSize: this.getGridContainerRowSizeL(),
                gap: this.getGridContainerGapL()
            }),
            layoutXL: new GridContainerSettings({
                columns: 0,
                rowSize: this.getGridContainerRowSizeXL(),
                columnSize: this.getGridContainerRowSizeXL(),
                gap: this.getGridContainerGapXL()
            }),
            dragDropConfig: [
                new DragInfo({
                    enabled: this.getEnableVisualizationReordering(),
                    groupName: bFlatArea ? "flatArea" : "Section",
                    sourceAggregation: "items"
                }),
                new GridDropInfo({
                    enabled: this.getEnableVisualizationReordering(),
                    groupName: bFlatArea ? "flatArea" : "Section",
                    dropLayout: DropLayout.Horizontal,
                    dropPosition: DropPosition.Between,
                    targetAggregation: "items",
                    dropIndicatorSize: bFlatArea ? this._getFlatDropIndicatorSize.bind(this) : this._getDefaultDropIndicatorSize.bind(this),
                    dragEnter: this._onDragEnter.bind(this),
                    drop: this._reorderVisualizations.bind(this)
                })
            ]
        }).addStyleClass("sapUshellSectionGridContainer");

        if (this.getEnableGridBreakpoints()) {
            var bSmallSize = this.getSizeBehavior() === "Small";

            oGridContainer.getLayoutXS().setColumns(4);
            oGridContainer.getLayoutS().setColumns(4);
            oGridContainer.getLayoutM().setColumns(6);
            oGridContainer.getLayoutL().setColumns(bSmallSize ? 12 : 10);
            oGridContainer.getLayoutXL().setColumns(bSmallSize ? 16 : 14);
        }

        oGridContainer.addEventDelegate({
            onAfterRendering: this.handleEmptyContentAreas.bind(this)
        });
        oGridContainer.attachBorderReached(this.onBorderReached.bind(this));

        this.setAggregation(bFlatArea ? "_flatArea" : "_defaultArea", oGridContainer);
    };

    Section.prototype._initCompactAreaAggregation = function () {
        var oCompactArea = new CompactArea({
            id: this.getId() + "-compactArea",
            enableLinkReordering: this.getEnableVisualizationReordering(),
            itemDrop: this._reorderVisualizations.bind(this),
            customData: [
                new CustomData({
                    key: "default",
                    value: this.getDefault()
                }),
                new CustomData({
                    key: "area",
                    value: DisplayFormat.Compact
                })
            ],
            dragDropConfig: [
                new DragInfo({
                    enabled: this.getEnableVisualizationReordering(),
                    groupName: "CompactArea",
                    sourceAggregation: "items"
                }),
                new DropInfo({
                    enabled: this.getEnableVisualizationReordering(),
                    groupName: "CompactArea",
                    dropLayout: DropLayout.Horizontal,
                    dropPosition: DropPosition.Between,
                    targetAggregation: "items",
                    dragEnter: this._onDragEnter.bind(this),
                    drop: this._reorderVisualizations.bind(this)
                }),
                new DropInfo({
                    enabled: this.getEnableVisualizationReordering(),
                    groupName: "CompactArea",
                    dragEnter: this._onDragEnter.bind(this),
                    drop: this._reorderVisualizations.bind(this)
                })
            ]
        }).addStyleClass("sapUshellSectionGridContainer");
        oCompactArea.addEventDelegate({
            onAfterRendering: this.handleEmptyContentAreas.bind(this)
        });
        oCompactArea.attachBorderReached(this.onBorderReached.bind(this));
        this.setAggregation("_compactArea", oCompactArea);
    };

    Section.prototype.setDefault = function (value) {
        this.setProperty("default", value, true);
        var aHeaderContent = this.getAggregation("_header").getContent();
        aHeaderContent[0].setVisible(value);
        aHeaderContent[1].setVisible(!value);
        aHeaderContent[2].setVisible(!value);
        aHeaderContent[4].setVisible(this.getEnableAddButton() && !value);
        aHeaderContent[5].setVisible(this.getEnableShowHideButton() && !value);
        aHeaderContent[6].setVisible(this.getEnableResetButton() && !value);
        aHeaderContent[7].setVisible(this.getEnableDeleteButton() && !value);
        this.getAggregation("_defaultArea").getCustomData()[0].setValue(value);
        this.getAggregation("_flatArea").getCustomData()[0].setValue(value);
        this.getAggregation("_compactArea").getCustomData()[0].setValue(value);
        return this;
    };

    Section.prototype.setEditable = function (value) {
        if (value === undefined || this.getEditable() === value) {
            return this;
        }

        this.setProperty("editable", value, true);
        this.toggleStyleClass("sapUshellSectionEdit", value);
        this.getAggregation("_title").setVisible(!value && this.getShowSection());
        this.getAggregation("_header").setVisible(value);
        this.getAggregation("_noVisualizationsText").setVisible(value && this.getShowNoVisualizationsText());
        this.getAggregation("_defaultArea").setVisible(value || this.getShowSection());
        this.getAggregation("_flatArea").setVisible(value || this.getShowSection());
        this.getAggregation("_compactArea").setVisible(value || this.getShowSection());

        var oDomRef = this.getDomRef();
        if (oDomRef) {
            if (value) {
                oDomRef.setAttribute("tabindex", "0");
                if (this.getShowNoVisualizationsText()) {
                    oDomRef.setAttribute("aria-describedBy", this.getAggregation("_noVisualizationsText").getId());
                } else {
                    oDomRef.removeAttribute("aria-describedBy");
                }
            } else {
                oDomRef.removeAttribute("tabindex");
            }
        }
        return this;
    };

    Section.prototype.setEnableAddButton = function (value) {
        this.setProperty("enableAddButton", value, true);
        this.getAggregation("_header").getContent()[4].setVisible(value && !this.getDefault());
        return this;
    };

    Section.prototype.setEnableDeleteButton = function (value) {
        this.setProperty("enableDeleteButton", value, true);
        this.getAggregation("_header").getContent()[7].setVisible(value && !this.getDefault());
        return this;
    };

    Section.prototype.setEnableGridBreakpoints = function (value) {
        this.setProperty("enableGridBreakpoints", value, true);
        var oDefaultArea = this.getAggregation("_defaultArea");
        var oFlatArea = this.getAggregation("_flatArea");

        if (value) {
            var bSmallSize = this.getSizeBehavior() === "Small";

            oDefaultArea.getLayoutXS().setColumns(4);
            oDefaultArea.getLayoutS().setColumns(4);
            oDefaultArea.getLayoutM().setColumns(6);
            oDefaultArea.getLayoutL().setColumns(bSmallSize ? 12 : 10);
            oDefaultArea.getLayoutXL().setColumns(bSmallSize ? 16 : 14);
            oFlatArea.getLayoutXS().setColumns(4);
            oFlatArea.getLayoutS().setColumns(4);
            oFlatArea.getLayoutM().setColumns(6);
            oFlatArea.getLayoutL().setColumns(bSmallSize ? 12 : 10);
            oFlatArea.getLayoutXL().setColumns(bSmallSize ? 16 : 14);
        } else {
            oDefaultArea.getLayoutXS().setColumns(0);
            oDefaultArea.getLayoutS().setColumns(0);
            oDefaultArea.getLayoutM().setColumns(0);
            oDefaultArea.getLayoutL().setColumns(0);
            oDefaultArea.getLayoutXL().setColumns(0);
            oFlatArea.getLayoutXS().setColumns(0);
            oFlatArea.getLayoutS().setColumns(0);
            oFlatArea.getLayoutM().setColumns(0);
            oFlatArea.getLayoutL().setColumns(0);
            oFlatArea.getLayoutXL().setColumns(0);
        }

        return this;
    };

    Section.prototype.setEnableGridContainerQuery = function (value) {
        this.setProperty("enableGridContainerQuery", value, true);
        this.getAggregation("_defaultArea").setContainerQuery(value);
        this.getAggregation("_flatArea").setContainerQuery(value);
        return this;
    };

    Section.prototype.setEnableResetButton = function (value) {
        this.setProperty("enableResetButton", value, true);
        this.getAggregation("_header").getContent()[6].setVisible(value && !this.getDefault());
        return this;
    };

    Section.prototype.setEnableShowHideButton = function (value) {
        this.setProperty("enableShowHideButton", value, true);
        this.getAggregation("_header").getContent()[5].setVisible(value && !this.getDefault());
        return this;
    };

    Section.prototype.setEnableVisualizationReordering = function (value) {
        this.setProperty("enableVisualizationReordering", value, true);
        var oCompactArea = this.getAggregation("_compactArea");
        var aDefaultAreaDragDropConfig = this.getAggregation("_defaultArea").getDragDropConfig();
        var aFlatAreaDragDropConfig = this.getAggregation("_flatArea").getDragDropConfig();
        var aCompactAreaDragDropConfig = oCompactArea.getDragDropConfig();

        oCompactArea.setEnableLinkReordering(value);
        aDefaultAreaDragDropConfig[0].setEnabled(value);
        aDefaultAreaDragDropConfig[1].setEnabled(value);
        aFlatAreaDragDropConfig[0].setEnabled(value);
        aFlatAreaDragDropConfig[1].setEnabled(value);
        aCompactAreaDragDropConfig[0].setEnabled(value);
        aCompactAreaDragDropConfig[1].setEnabled(value);
        aCompactAreaDragDropConfig[2].setEnabled(value);
        return this;
    };

    Section.prototype.setGridContainerGap = function (value) {
        this.setProperty("gridContainerGap", value, true);
        this.getAggregation("_defaultArea").getLayout().setGap(value);
        this.getAggregation("_flatArea").getLayout().setGap(value);
        return this;
    };

    Section.prototype.setGridContainerGapXS = function (value) {
        this.setProperty("gridContainerGapXS", value, true);
        this.getAggregation("_defaultArea").getLayoutXS().setGap(value);
        this.getAggregation("_flatArea").getLayoutXS().setGap(value);
        return this;
    };

    Section.prototype.setGridContainerGapS = function (value) {
        this.setProperty("gridContainerGapS", value, true);
        this.getAggregation("_defaultArea").getLayoutS().setGap(value);
        this.getAggregation("_flatArea").getLayoutS().setGap(value);
        return this;
    };

    Section.prototype.setGridContainerGapM = function (value) {
        this.setProperty("gridContainerGapM", value, true);
        this.getAggregation("_defaultArea").getLayoutM().setGap(value);
        this.getAggregation("_flatArea").getLayoutM().setGap(value);
        return this;
    };

    Section.prototype.setGridContainerGapL = function (value) {
        this.setProperty("gridContainerGapL", value, true);
        this.getAggregation("_defaultArea").getLayoutL().setGap(value);
        this.getAggregation("_flatArea").getLayoutL().setGap(value);
        return this;
    };

    Section.prototype.setGridContainerGapXL = function (value) {
        this.setProperty("gridContainerGapXL", value, true);
        this.getAggregation("_defaultArea").getLayoutXL().setGap(value);
        this.getAggregation("_flatArea").getLayoutXL().setGap(value);
        return this;
    };

    Section.prototype.setGridContainerRowSize = function (value) {
        this.setProperty("gridContainerRowSize", value, true);
        var oDefaultArea = this.getAggregation("_defaultArea");
        var oFlatArea = this.getAggregation("_flatArea");

        oDefaultArea.getLayout().setRowSize(value);
        oDefaultArea.getLayout().setColumnSize(value);
        oFlatArea.getLayout().setRowSize(value);
        oFlatArea.getLayout().setColumnSize(value);
        return this;
    };

    Section.prototype.setGridContainerRowSizeXS = function (value) {
        this.setProperty("gridContainerRowSizeXS", value, true);
        var oDefaultArea = this.getAggregation("_defaultArea");
        var oFlatArea = this.getAggregation("_flatArea");

        oDefaultArea.getLayoutXS().setRowSize(value);
        oDefaultArea.getLayoutXS().setColumnSize(value);
        oFlatArea.getLayoutXS().setRowSize(value);
        oFlatArea.getLayoutXS().setColumnSize(value);
        return this;
    };

    Section.prototype.setGridContainerRowSizeS = function (value) {
        this.setProperty("gridContainerRowSizeS", value, true);
        var oDefaultArea = this.getAggregation("_defaultArea");
        var oFlatArea = this.getAggregation("_flatArea");

        oDefaultArea.getLayoutS().setRowSize(value);
        oDefaultArea.getLayoutS().setColumnSize(value);
        oFlatArea.getLayoutS().setRowSize(value);
        oFlatArea.getLayoutS().setColumnSize(value);
        return this;
    };

    Section.prototype.setGridContainerRowSizeM = function (value) {
        this.setProperty("gridContainerRowSizeM", value, true);
        var oDefaultArea = this.getAggregation("_defaultArea");
        var oFlatArea = this.getAggregation("_flatArea");

        oDefaultArea.getLayoutM().setRowSize(value);
        oDefaultArea.getLayoutM().setColumnSize(value);
        oFlatArea.getLayoutM().setRowSize(value);
        oFlatArea.getLayoutM().setColumnSize(value);
        return this;
    };

    Section.prototype.setGridContainerRowSizeL = function (value) {
        this.setProperty("gridContainerRowSizeL", value, true);
        var oDefaultArea = this.getAggregation("_defaultArea");
        var oFlatArea = this.getAggregation("_flatArea");

        oDefaultArea.getLayoutL().setRowSize(value);
        oDefaultArea.getLayoutL().setColumnSize(value);
        oFlatArea.getLayoutL().setRowSize(value);
        oFlatArea.getLayoutL().setColumnSize(value);
        return this;
    };

    Section.prototype.setGridContainerRowSizeXL = function (value) {
        this.setProperty("gridContainerRowSizeXL", value, true);
        var oDefaultArea = this.getAggregation("_defaultArea");
        var oFlatArea = this.getAggregation("_flatArea");

        oDefaultArea.getLayoutXL().setRowSize(value);
        oDefaultArea.getLayoutXL().setColumnSize(value);
        oFlatArea.getLayoutXL().setRowSize(value);
        oFlatArea.getLayoutXL().setColumnSize(value);
        return this;
    };

    Section.prototype.setNoVisualizationsText = function (value) {
        this.setProperty("noVisualizationsText", value, true);
        this.getAggregation("_noVisualizationsText").setText(value);
        return this;
    };

    Section.prototype.setTitle = function (value) {
        this.setProperty("title", value, true);
        this.getAggregation("_title").setText(value);
        this.getAggregation("_header").getContent()[0].setText(value);
        this.getAggregation("_header").getContent()[2].setValue(value);

        var oDomRef = this.getDomRef();
        if (oDomRef) {
            oDomRef.setAttribute("aria-label", this.getAriaLabel());
        }
        return this;
    };

    Section.prototype.setShowNoVisualizationsText = function (value) {
        this.setProperty("showNoVisualizationsText", value, true);
        this.getAggregation("_noVisualizationsText").setVisible(this.getEditable() && value);
        var oDomRef = this.getDomRef();
        if (oDomRef) {
            if (this.getEditable() && value) {
                oDomRef.setAttribute("aria-describedBy", this.getAggregation("_noVisualizationsText").getId());
            } else {
                oDomRef.removeAttribute("aria-describedBy");
            }
        }
        return this;
    };

    Section.prototype.setShowSection = function (value) {
        if (value === undefined || this.getShowSection() === value) {
            return this;
        }

        this.setProperty("showSection", value, true);
        this.toggleStyleClass("sapUshellSectionHidden", !value);
        this.getAggregation("_title").setVisible(!this.getEditable() && value);
        this.getAggregation("_defaultArea").setVisible(this.getEditable() || value);
        this.getAggregation("_flatArea").setVisible(this.getEditable() || value);
        this.getAggregation("_compactArea").setVisible(this.getEditable() || value);
        this.getAggregation("_header").getContent()[5].setText(value ? resources.i18n.getText("Section.Button.Hide") : resources.i18n.getText("Section.Button.Show"));
        return this;
    };

    Section.prototype.setSizeBehavior = function (value) {
        this.setProperty("sizeBehavior", value, true);
        if (this.getEnableGridBreakpoints()) {
            var oDefaultArea = this.getAggregation("_defaultArea");
            var oFlatArea = this.getAggregation("_flatArea");

            oDefaultArea.getLayoutL().setColumns(value ? 12 : 10);
            oDefaultArea.getLayoutXL().setColumns(value ? 16 : 14);
            oFlatArea.getLayoutL().setColumns(value ? 12 : 10);
            oFlatArea.getLayoutXL().setColumns(value ? 16 : 14);
        }
        return this;
    };

    Section.prototype.destroy = function () {
        Control.prototype.destroy.apply(this, arguments);
        this._oDefaultItemsChangeDetection.destroy();
        this._oFlatItemsChangeDetection.destroy();
        this._oCompactItemsChangeDetection.destroy();

        document.removeEventListener("dragstart", this._fnGlobalDragStart, false);
        document.removeEventListener("dragend", this._fnGlobalDragEnd, false);

        if (this._oInvisibleMessageInstance) {
            this._oInvisibleMessageInstance.destroy();
        }
    };

    /**
     * Generates the localized aria label string for the section.
     *
     * @returns {string} the localized aria label containing the title of the section.
     */
    Section.prototype.getAriaLabel = function () {
        var sTitle = this.getTitle() && this.getTitle().trim();
        if (sTitle) {
            return resources.i18n.getText("Section.Description", [sTitle]);
        }
        return resources.i18n.getText("Section.Description.EmptySectionTitle");
    };

    /**
     * @returns {sap.m.Input} the title input from the section header.
     *
     * @since 1.117.0
     */
    Section.prototype.getTitleInput = function () {
        return this.getAggregation("_header").getContent()[2];
    };

    /**
     * Delegates event to reorder visualizations
     *
     * @param {object} oInfo Drag and drop event data
     * @private
     */
    Section.prototype._reorderVisualizations = function (oInfo) {
        this.fireVisualizationDrop(oInfo.getParameters());
    };

    /**
     * Calculates and returns the the closest visualization to the given HTMLElement.
     *
     * @param {sap.ui.core.Control | HTMLElement} oRefItem The given reference control or HTMLElement that should be searched from.
     * @param {boolean} bAbove If the item should be above or below the given HTMLElement.
     * @returns {sap.ui.core.Control} The closest visualization.
     */
    Section.prototype.getClosestVizualization = function (oRefItem, bAbove) {
        var aViz = this.getAllItems();
        return _getNearestViz(oRefItem, aViz, bAbove);
    };

    /**
     * Calculates and returns the index of the closest visualization to the given HTMLElement.
     *
     * @param {HTMLElement} oDomRef The given HTMLElement that should be searched from.
     * @param {boolean} bAbove If the item should be above or below the given HTMLElement.
     * @returns {int} The index of the closest visualization.
     */
    Section.prototype.getClosestVizIndex = function (oDomRef, bAbove) {
        var oViz = this.getClosestVizualization(oDomRef, bAbove);
        return oViz ? this.indexOfVisualization(oViz) : -1;
    };

    /**
     * Calculates and returns the index of the closest visualization in a compact Area to the given HTMLElement.
     *
     * @param {HTMLElement} oDomRef The given HTMLElement that should be searched from.
     * @param {boolean} bAbove If the item should be above or below the given HTMLElement.
     * @returns {int} The index of the closest visualization in the compact Area.
     */
    Section.prototype.getClosestCompactItemIndex = function (oDomRef, bAbove) {
        var oNearestViz = _getNearestViz(oDomRef, this.getCompactItems(), bAbove);
        if (oNearestViz) {
            return this.indexOfVisualization(oNearestViz);
        }
        return bAbove ? this.getVisualizations().length : 0;
    };

    /**
     * Drag event listener to disable visualization drag into the default section
     * and to provide an event to check for compatibilty of the display formats.
     *
     * @param {object} oEvent Drag event object.
     * @private
     */
    Section.prototype._onDragEnter = function (oEvent) {
        var oDragSession = oEvent.getParameter("dragSession");
        var oDragControl = oDragSession.getDragControl();
        var oSourceArea = oDragControl.getParent();
        var oTargetArea = oDragSession.getDropControl && oDragSession.getDropControl(); // not available in case of keyboard DnD

        if (!oTargetArea) {
            return;
        }

        if (!oTargetArea.data("area")) {
            // for the grids we get the grid directly as drop control but for the link area
            // the drop control is the link control
            oTargetArea = oTargetArea.getParent();
        }

        if (oTargetArea.data("default") && !oSourceArea.data("default")) {
            // prevent the dropping from other sections into an area of the default section
            oEvent.preventDefault();
        }

        this.fireAreaDragEnter({
            originalEvent: oEvent,
            dragControl: oDragControl,
            sourceArea: oSourceArea.data("area"),
            targetArea: oTargetArea.data("area")
        });
    };

    Section.prototype.addAggregation = function (sAggregationName, oObject) {
        if (sAggregationName === "defaultItems" || sAggregationName === "flatItems") {
            this._addVisualizationLayoutData(oObject);
        }
        Control.prototype.addAggregation.apply(this, arguments);
        this.handleEmptyContentAreas();
        return this;
    };

    Section.prototype.insertAggregation = function (sAggregationName, oObject/*, iIndex*/) {
        if (sAggregationName === "defaultItems" || sAggregationName === "flatItems") {
            this._addVisualizationLayoutData(oObject, sAggregationName);
        }
        Control.prototype.insertAggregation.apply(this, arguments);
        this.handleEmptyContentAreas();
        return this;
    };

    /**
     * Does a lookup on the internal aggregations and searches for a proper dom ref to focus
     *
     * @returns {HTMLElement} the dom ref to focus
     * @private
     */
    Section.prototype.getFocusDomRef = function () {
        if (this.getEditable()) {
            return this.getDomRef();
        }
        if (this.getDefaultItems().length) {
            return this.getAggregation("_defaultArea").getFocusDomRef();
        }
        if (this.getFlatItems().length) {
            return this.getAggregation("_flatArea").getFocusDomRef();
        }
        return this.getAggregation("_compactArea").getFocusDomRef();
    };

    /**
     * Returns the LayoutData for the given item.
     *
     * @param {sap.ui.core.Control} oVisualization The visualization to retrieve the LayoutData from.
     * @returns {sap.ui.core.LayoutData} The LayoutData object.
     * @private
     */
    Section.prototype._getVisualizationLayoutData = function (oVisualization) {
        if (oVisualization.getLayout) {
            return oVisualization.getLayout();
        }
        // fallback for controls dragged from the TileSelector (that are not "grid visualizations" yet);
        // when TileSelector items are of the same type, then only "oVisualization.getLayout()" should be used.
        return { rows: 2, columns: 2 };
    };

    /**
     * Returns the LayoutData for the given item.
     *
     * @param {sap.ui.core.Control} oVisualization The visualization to retrieve the LayoutData from.
     * @returns {sap.ui.core.LayoutData} The LayoutData object.
     * @private
     */
    Section.prototype._getFlatVisualizationLayoutData = function (oVisualization) {
        if (oVisualization.getLayout) {
            return oVisualization.getLayout();
        }
        // fallback for controls dragged from the TileSelector (that are not "grid visualizations" yet);
        // when TileSelector items are of the same type, then only "oVisualization.getLayout()" should be used.
        return { rows: 1, columns: 2 };
    };

    /**
     * Adds GridContainerItemLayoutData to a visualization
     *
     * @param {sap.ui.core.Control} oVisualization A visualization which gets a layout
     * @param {string} sAggregationName The aggregation name of the content area
     * @private
     */
    Section.prototype._addVisualizationLayoutData = function (oVisualization, sAggregationName) {
        if (!oVisualization.getLayoutData()) {
            var oLayoutData = sAggregationName === "defaultItems" ? this._getVisualizationLayoutData(oVisualization) : this._getFlatVisualizationLayoutData(oVisualization);
            oVisualization.setLayoutData(new GridContainerItemLayoutData(oLayoutData));
        }
    };

    /**
     * Returns the drop indicator size for the passed visualization in the default content area
     *
     * @param {sap.ui.core.Control} oVisualization The visualization to get the drop indicator size for
     * @returns {object} An object containing the number of rows and columns for the drop target
     *
     * @since 1.85.0
     * @private
     */
    Section.prototype._getDefaultDropIndicatorSize = function (oVisualization) {
        return this._getDropIndicatorSize(oVisualization, DisplayFormat.Standard);
    };

    /**
     * Returns the drop indicator size for the passed visualization in the flat content area
     *
     * @param {sap.ui.core.Control} oVisualization The visualization to get the drop indicator size for
     * @returns {object} An object containing the number of rows and columns for the drop target
     *
     * @since 1.85.0
     * @private
     */
    Section.prototype._getFlatDropIndicatorSize = function (oVisualization) {
        return this._getDropIndicatorSize(oVisualization, DisplayFormat.Flat);
    };

    /**
     * Returns the drop indicator size for the passed visualization and content area
     *
     * @param {sap.ui.core.Control} oVisualization The visualization to get the drop indicator size for
     * @param {string} sTargetAreaType The drop target area type
     * @returns {object} An object containing the number of rows and columns for the drop target.
     *
     * @since 1.85.0
     * @private
     */
    Section.prototype._getDropIndicatorSize = function (oVisualization, sTargetAreaType) {
        var oParentControl = oVisualization.getParent();
        var sSourceArea = oParentControl && oParentControl.data("area");

        if (sTargetAreaType === sSourceArea &&
            oVisualization.getLayoutData) {
            // the visualization keeps its size when moving within the same area type
            var oLayoutData = oVisualization.getLayoutData();
            return {
                rows: oLayoutData.getRows(),
                columns: oLayoutData.getColumns()
            };
        }

        // the visualization gets the target areas default size when moving
        // into a different target area type
        var oLayout = {};
        var aSupportedDisplayFormats = [];
        if (oVisualization.getSupportedDisplayFormats) {
            aSupportedDisplayFormats = oVisualization.getSupportedDisplayFormats();
        }
        if (sTargetAreaType === DisplayFormat.Flat) {
            oLayout.rows = 1;
            oLayout.columns = 2;

            // Visualization only supports flatWide
            if (!aSupportedDisplayFormats.includes(DisplayFormat.Flat)
                && aSupportedDisplayFormats.includes(DisplayFormat.FlatWide)) {
                oLayout.columns = 4;
            }
        } else {
            oLayout.rows = 2;
            oLayout.columns = 2;

            // Visualization only supports standardWide
            if (!aSupportedDisplayFormats.includes(DisplayFormat.Standard)
                && aSupportedDisplayFormats.includes(DisplayFormat.StandardWide)) {
                oLayout.columns = 4;
            }
        }

        return oLayout;
    };

    /**
     * Returns the visual position of a visualization in a section. It is not the same as the order in the model.
     *
     * @param {object | int} viz Visualization control that belongs to a section or its index in the model.
     * @returns {object} Position of the visualization ({index, area},
     * where index is relative position of a visualization in the area and
     * area is either "default" for normal tiles, "flat" for flat and flat wide tiles and "compact" for links)
     * @private
     */
    Section.prototype.getItemPosition = function (viz) {
        if (isFinite(viz)) {
            viz = this.getVisualizations()[viz];
        }
        var index = this.getAggregation("_defaultArea").getItems().indexOf(viz);
        if (index >= 0) {
            return {
                index: index,
                area: DisplayFormat.Standard
            };
        }
        index = this.getAggregation("_flatArea").getItems().indexOf(viz);
        if (index >= 0) {
            return {
                index: index,
                area: DisplayFormat.Flat
            };
        }
        index = this.getAggregation("_compactArea").getItems().indexOf(viz);
        if (index >= 0) {
            return {
                index: index,
                area: DisplayFormat.Compact
            };
        }
        return {
            index: -1,
            area: DisplayFormat.Standard
        };
    };

    /**
     * Focuses a visualization in a section.
     * Visualizations have different order:
     * default items come first, then the flat area items and then the compact area items.
     * If the last focused item is removed from the default area, the fist item in the compact area is focused.
     *
     * @param {object | int} pos Position of the visualization to focus ({index, area} or index)
     * @private
     */
    Section.prototype._focusItem = function (pos) {
        window.setTimeout(function () {
            var area = pos && pos.area ? pos.area : DisplayFormat.Standard;
            var index = pos && pos.index ? pos.index : pos;
            var nDefaultItems = this.getAggregation("_defaultArea").getItems().length;
            var nFlatItems = this.getAggregation("_flatArea").getItems().length;
            var nCompactItems = this.getAggregation("_compactArea").getItems().length;

            // checks
            if (isNaN(index) || index < 0) { // focus the first item by default
                index = 0;
            }
            if (area === DisplayFormat.Standard && nDefaultItems === 0) {
                // there is nothing to focus in the default area
                area = DisplayFormat.Flat;
            }
            if (area === DisplayFormat.Flat && nFlatItems === 0) {
                // there is nothing to focus in the flat area
                area = DisplayFormat.Compact;
            }
            if (area === DisplayFormat.Compact && nCompactItems === 0) {
                area = DisplayFormat.Standard;
            }
            if (nDefaultItems + nFlatItems + nCompactItems === 0) {
                area = "section";
            }

            // action
            switch (area) {
                case "section":
                    this.focus();
                    break;
                case DisplayFormat.Flat:
                    if (index >= nFlatItems) { // focus the last item
                        index = nFlatItems - 1;
                    }
                    this.getAggregation("_flatArea").focusItem(index);
                    break;
                case DisplayFormat.Compact:
                    this.getAggregation("_compactArea").focusItem(index);
                    break;
                default: // "default area"
                    if (index >= nDefaultItems) { // focus the last item
                        index = nDefaultItems - 1;
                    }
                    this.getAggregation("_defaultArea").focusItem(index);
                    break;
            }
        }.bind(this), 0);
    };

    /**
     * Focuses a visualization in a section.
     * Visualizations have different order:
     * default items come first, then the flat area items and then the compact area items.
     * If the last focused item is removed from the default area, the fist item in the compact area is focused.
     *
     * @param {object} item Visualization or position of the visualization to focus. The position object contains
     * either (area, index) coordinates or (keycode, ref) - arrow key and a reference DOM element. In the second case,
     * the section focuses the nearest to the given DOM element visualization to mimic vertical column navigation.
     * @returns {boolean} true if focus is possible (the section is visible and contains visualizations).
     * @private
     */
    Section.prototype.focusVisualization = function (item) {
        var oViz;
        if (!this.getShowSection() && !this.getEditable()) {
            return false;
        }
        var aViz = this.getAllItems();
        if (!aViz.length) {
            return false;
        }
        if (item && item.area) { // item position is given directly
            this._focusItem(item);
            return true;
        }

        // Find the item to focus.

        if (item && item.getMetadata) { // focus the visualization directly
            oViz = item;
        }
        if (!oViz && item && item.keycode) { // keycode is given, look up an item using keyboard navigation
            switch (item.keycode) {
                case KeyCodes.ARROW_UP:
                    oViz = this.getClosestVizualization(item.ref, true);
                    break;
                case KeyCodes.ARROW_DOWN:
                    oViz = this.getClosestVizualization(item.ref, false);
                    break;
                case KeyCodes.ARROW_LEFT:
                    item = -1; // select last item
                    break;
                default: // ARROW_RIGHT etc. - select the first item
                    break;
            }
        }
        if (!oViz && item === -1) { // focus the last item
            oViz = aViz[aViz.length - 1];
        }
        if (!oViz) { // Last case: focus the first item
            oViz = aViz[0];
        }

        this._focusItem(this.getItemPosition(oViz));
        return true;

    };

    return Section;
});
