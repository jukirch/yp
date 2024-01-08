sap.ui.define([
    "sap/suite/ui/commons/BasePanel",
    "sap/ui/model/json/JSONModel",
    "sap/suite/ui/commons/MenuButton",
    "sap/m/Button",
    "./util/BatchHelper",
    "sap/ui/Device",
    "sap/f/GridList",
    "sap/ui/layout/cssgrid/GridBasicLayout",
    "sap/base/Log",
    "sap/m/VBox",
    "sap/m/HeaderContainer",
    "sap/m/Popover",
    "sap/m/List",
    "sap/m/StandardListItem",
    "sap/m/library",
    "sap/ui/core/library",
    "sap/m/IllustratedMessage",
    "sap/f/Card",
    "sap/ui/core/format/DateFormat"
], function (
    BasePanel,
    JSONModel,
    MenuButton,
    Button,
    BatchHelper,
    Device,
    GridList,
    GridBasicLayout,
    Log,
    VBox,
    HeaderContainer,
    Popover,
    List,
    StandardListItem,
    mobileLibrary,
    coreLib,
    IllustratedMessage,
    Card,
    DateFormat
) {
    "use strict";

    const URLHelper = mobileLibrary.URLHelper;

    const Priority = mobileLibrary.Priority ? mobileLibrary.Priority : coreLib.Priority;

    const relativeDateFormatter = DateFormat.getDateTimeInstance({
        style: "medium",
        relative: true,
        relativeStyle:"short"
    });

    const AppConstants = {
        SITUATION_ICON: "sap-icon://message-warning",
        PLACEHOLDER_ITEMS_COUNT: 5,
        TODO_CARDS_LIMIT: 5000,
        TODO_SECTION_LIMIT: 6,
        TODOS_REFRESH_INTERVAL: 65000,
        MOBILE_DEVICE_MAX_WIDTH: 600
    };

    /**
     * Calculates the card width based on the available width and certain constraints.
     *
     * @param {number} availableWidth - The available width for card rendering.
     * @returns {number} The calculated card width within specified constraints.
     */
    const calculateCardWidth = (availableWidth) => {
        const minWidth = 320;
        const maxWidth = 400;
        const gap = 14.5;
        let count = 1;
        let cardWidth = minWidth;

        while (availableWidth / count >= minWidth + gap) {
            cardWidth = availableWidth / count;
            count += 1;
        }
        cardWidth -= gap;

        return cardWidth > maxWidth ? maxWidth : cardWidth;
    };

    /**
     * Fetches specified element properties from a DOM reference.
     *
     * @param {HTMLElement} domRef - The DOM element to fetch properties from.
     * @param {string[]} properties - An array of property names to fetch.
     * @returns {Object} An object containing the fetched properties.
     */
    const fetchElementProperties = (domRef, properties) => {
        const props = {};
        const fetchDOMValue = (domRef, propertyName) => parseFloat(window.getComputedStyle(domRef, null).getPropertyValue(propertyName));

        properties.forEach((propertyName) => {
            props[propertyName] = fetchDOMValue(domRef, propertyName);
        });

        return props;
    };

    const ToDoPanel = BasePanel.extend("sap.suite.ui.commons.ToDoPanel", {
        metadata : {
            properties : {
                serviceUrl: { type: "string", group: "Misc", defaultValue: '' },
                countUrl: { type: "string", group: "Misc", defaultValue: '' },
                dataUrl: { type: "string", group: "Misc", defaultValue: '' },
                targetAppUrl: { type: "string", group: "Misc", defaultValue: '' }
            }
        }
    });

    /**
     * Init lifecycle method
     *
     */
    ToDoPanel.prototype.init = function () {
        //Initialise ToDos Model
        this._oData = {
            length: 0,
            isLoaded: false,
            hasError: false,
            cardWidth: "20rem",
            getSupported: false,
            isExpandedOnce: false,
            isCountCalledOnce: false,
            illustrationType: "sapIllus-NoTasks",
            refreshInfo: this.toRelativeDateTime(new Date()),
            todoHorizontalCardCount: AppConstants.PLACEHOLDER_ITEMS_COUNT,
            illustrationTitle: this.getResourceBundle().getText("noToDoTitle"),
            illustrationDescription: this.getResourceBundle().getText("noToDoDesc"),
            isPhone: Device.resize.width < AppConstants.MOBILE_DEVICE_MAX_WIDTH || Device.system.phone,
            tiles: new Array(AppConstants.PLACEHOLDER_ITEMS_COUNT).fill({ status: "Loading" }),
            displayTiles: new Array(AppConstants.PLACEHOLDER_ITEMS_COUNT).fill({ status: "Loading" })
        };
        this._controlModel = new JSONModel(this._oData);
        this.setModel(this._controlModel, "_toDos");

        //Initialize Request Queue
        this.requests = [];

        //Add Wrapper Container to Panel
        this._toDoWrapper = new VBox(`${this.getId()}-toDosWrapper`, {
            items: [
                this._generateCardContainer(),
                this._generateMobileCardContainer(),
                this._generateErrorMessage()
            ]
        });
        this.addContent(this._toDoWrapper);

        //Setup Header Content
        this.addAggregation("menuButtons", new MenuButton(`${this.getId()}-menuButton`, {
            icon: "sap-icon://slim-arrow-down",
            press: this._onPressMenuButton.bind(this)
        }));

        this._refreshBtn = new Button(`${this.getId()}-refreshBtn`, {
            icon: "sap-icon://refresh",
            text: this.toRelativeDateTime(new Date()),
            press: this._onPressRefresh.bind(this)
        });
        this.addAggregation("actionButtons", this._refreshBtn);

        BasePanel.prototype.init.apply(this, arguments);
    };

    /**
     * Handler for the Refresh button for each panel.
     * Reloads the selected panel
     *
     */
    ToDoPanel.prototype._onPressRefresh = function () {
        this.getParent()?.getSelectedPanel()?.loadToDos();
    };

    /**
     * Generates the card container (GridList) for displaying cards.
     *
     * @returns {sap.m.GridList} The generated card container.
     */
    ToDoPanel.prototype._generateCardContainer = function () {
        //create container
        if (!this.cardContainer) {
            this.cardContainer = new GridList(`${this.getId()}-flexContainer`, {
                visible: "{= !${_toDos>/isPhone} && !${_toDos>/hasError} && (!${_toDos>/isLoaded} || ${_toDos>/length} > 0) }",
                showNoData: false,
                customLayout: new GridBasicLayout(`${this.getId()}-layout`, {
                    gridTemplateColumns: "repeat({_toDos>/todoHorizontalCardCount}, {_toDos>/cardWidth})",
                    gridGap: "1rem"
                })
            }).addStyleClass("sapUiToDoCardsContainer");
            this.cardContainer.setModel(this._controlModel, "_toDos");
        }

        //bind items
        this.cardContainer.bindAggregation("items", {
            path: "_toDos>/displayTiles",
            length: 1000,
            factory: this.generateCardTemplate.bind(this)
        });

        return this.cardContainer;
    };

    /**
     * Generates the mobile card container (HeaderContainer) for displaying cards on mobile devices.
     *
     * @returns {sap.m.HeaderContainer} The generated mobile card container.
     */
    ToDoPanel.prototype._generateMobileCardContainer = function () {
        // Create a HeaderContainer for mobile devices
        if (!this.mobileCardContainer) {
            this.mobileCardContainer = new HeaderContainer(`${this.getId()}-headerContainer`, {
                visible: "{_toDos>/isPhone}",
                scrollStep: 0,
                gridLayout: true,
                scrollTime: 1000,
                showDividers: false
            });

            this.mobileCardContainer.addStyleClass("sapMHeaderContainerAlign");
            this.mobileCardContainer.addStyleClass("sapMHeaderContainerToDoAlign");
            this.mobileCardContainer.addStyleClass("toDoCardHeight");
            this.mobileCardContainer.setModel(this._controlModel, "_toDos");
        }

        // Create Binding for mobile card container
        this.mobileCardContainer.bindAggregation("content", {
            path: "_toDos>/displayTiles",
            length: 1000,
            factory: this.generateCardTemplate.bind(this)
        });

        return this.mobileCardContainer;
    };

    /**
     * Generates the error message card for displaying error messages.
     *
     * @returns {sap.f.Card} The generated error message card.
     */
    ToDoPanel.prototype._generateErrorMessage = function () {
        if (!this.errorCard) {
            this.errorMessage = new IllustratedMessage(`${this.getId()}-errorMessage`, {
                illustrationSize: "Spot",
                title: "{_toDos>/illustrationTitle}",
                description: "{_toDos>/illustrationDescription}",
                illustrationType: "{_toDos>/illustrationType}"
            });
            this.errorCard = new Card(`${this.getId()}-errorCard`, {
                content: [this.errorMessage],
                visible: "{= ${_toDos>/tiles/length} === 0 || ${_toDos>/hasError} === true }"
            });
            this.errorCard.setModel(this._controlModel, "_toDos");
        }

        return this.errorCard;
    };

    /**
     * Handles the press event of the menu button.
     *
     * @param {sap.ui.base.Event} oEvent - The event object.
     */
    ToDoPanel.prototype._onPressMenuButton = function (oEvent) {
        if (!this._menuPopover) {
            this._menuPopover = new Popover(`${this.getId()}-popover`, {
                placement: "VerticalPreferredBottom",
                showHeader: false,
                content: [
                    new List(`${this.getId()}-list`, {
                        itemPress: this._closePopover.bind(this),
                        items: [
                            new StandardListItem(`${this.getId()}-viewAllListItem`, {
                                type: "Active",
                                icon: "sap-icon://inbox",
                                title: this.getViewAllItemsText(),
                                press: this.onPressViewAll.bind(this)
                            }),
                            new StandardListItem(`${this.getId()}-refreshItems`, {
                                type: "Active",
                                icon: "sap-icon://refresh",
                                title: this.getResourceBundle().getText("refresh"),
                                press: this._onPressRefresh.bind(this)
                            })
                        ]
                    })
                ]
            });
        }
        this._menuPopover.openBy(oEvent.getParameter("button"));
    };

    /**
     * Closes the menu popover.
     *
     */
    ToDoPanel.prototype._closePopover = function () {
        this._menuPopover.close();
    };

    /**
     * Handles the press event to view all items.
     */
    ToDoPanel.prototype.onPressViewAll = function () {
        URLHelper.redirect(this.getTargetAppUrl(), false);
    };

    /**
     * Sets the supported status of the panel.
     *
     * @param {boolean} value - The value to set for supported status.
     */
    ToDoPanel.prototype.setSupported = function (value) {
        this._oData.getSupported = value;
    };

    /**
     * Gets the supported status of the panel.
     *
     * @returns {boolean} The supported status of the panel.
     */
    ToDoPanel.prototype.getSupported = function () {
        return this._oData.getSupported;
    };

    /**
     * Extracts the app intent from the target app URL.
     *
     * @returns {Object|null} The app intent object with target and parameters, or null if not found.
     */
    ToDoPanel.prototype.getAppIntent = function () {
        const pattern = /#([^-\?]+)-([^?#]+)(\?(.+))?/;
        const match = this.getTargetAppUrl().match(pattern);

        if (match) {
            const target = {
                semanticObject: match[1],
                action: match[2]
            };
            const params = {};

            if (match[4]) {
                const paramsArray = match[4].split("&");
                for (const param of paramsArray) {
                    const [key, value] = param.split("=");
                    params[key] = value;
                }
            }

            return {
                target,
                params
            };
        } else {
            return null;
        }
    };

    /**
     * Generates a request object for batch requests.
     *
     * @param {Object} properties - Additional properties for generating the request object.
     * @param {boolean} [properties.excludeCount=false] - Whether to exclude count from the request.
     * @param {boolean} [properties.onlyCount=false] - Whether to include only the count in the request.
     * @returns {Object} The generated request object.
     */
    ToDoPanel.prototype._generateRequestObject = function (properties) {
        const cardCount = this._calculateCardCount();
        const urls = [
            this.getCountUrl(),
            `${this.getDataUrl()}&$skip=0&$top=${cardCount}`
        ];

        if (properties && properties.excludeCount) {
            urls.shift();
        } else if (properties && properties.onlyCount) {
            urls.splice(1, 1);
        }

        return {
            rootURL: `${this.getServiceUrl()}$batch`,
            requestURLs: urls,
            success: (...args) => {
                const [count, data] = properties && properties.excludeCount ? [args[0], args[1]] : args;
                this._oData.length = count;

                if (!properties || (properties && !properties.onlyCount)) {
                    this.processData(data);
                    this._handleEmptyCards();
                }
            }
        };
    };

    /**
     * Handles the scenario when there are no cards to display.
     * Updates the illustration and description based on the selected panel and card count.
     */
    ToDoPanel.prototype._handleEmptyCards = function () {
        if (this._oData.length === 0) {
            this._oData.illustrationType = "sapIllus-EmptyPlanningCalendar";
            this._oData.illustrationTitle = this.isExclusivePanel()
                ? this.getResourceBundle().getText("noToDoTitle")
                : this.getResourceBundle().getText(this.getNoDataText());
            this._oData.illustrationDescription = this.isExclusivePanel()
                ? this.getResourceBundle().getText("noToDoDesc")
                : this.getResourceBundle().getText("emptyToDoDesc");
        }
    };

    /**
     * Submits a batch request for multiple URLs and processes the responses.
     *
     * @returns {Promise} A Promise that resolves when all batch requests are completed.
     */
    ToDoPanel.prototype.submitBatch = function () {
        return Promise.all(
            this.requests.map(async (oRequest) => {
                try {
                    const responses = await BatchHelper.createMultipartRequest(oRequest.rootURL, oRequest.requestURLs);

                    if (responses.length) {
                        const processedResponses = responses.map((response) => {
                            if (typeof response === "string") {
                                response = JSON.parse(response);
                            }
                            return (
                                (response && response.d && response.d.results) ||
                                (response && response.d && !isNaN(+response.d) && +response.d) ||
                                (!isNaN(+response) && +response) ||
                                0
                            );
                        });

                        // Call success callback, if any
                        if (oRequest.success && typeof oRequest.success === "function") {
                            oRequest.success.apply(oRequest, processedResponses);
                        }

                        return processedResponses;
                    } else {
                        throw new Error("Invalid response");
                    }
                } catch (error) {
                    this._handleError(error);
                } finally {
                    this.clearRequests();
                }
            })
        );
    };

    /**
     * Handles errors by updating the data and logging the error.
     *
     * @param {Error} error - The error object to handle.
     */
    ToDoPanel.prototype._handleError = function (error) {
        this._oData.displayTiles = this._oData.tiles = [];
        this._oData.getSupported = this._oData.isLoaded = this._oData.hasError = true;
        this._oData.illustrationType = "sapIllus-UnableToLoad";
        this._oData.illustrationTitle = this._oData.illustrationDescription = "";

        Log.error(error);
        this._controlModel.refresh();
    };

    /**
     * Clears the list of requests.
     *
     */
    ToDoPanel.prototype.clearRequests = function () {
        this.requests = [];
    };

    /**
     * Loads the To-Do cards for the panel.
     *
     * @returns {Promise} A promise that resolves when the cards are loaded.
     */
    ToDoPanel.prototype.loadToDos = function () {
        if (this._loadToDos) {
            return this._loadToDos;
        } else {
            this._loadToDos = new Promise((resovle) => {
                const selectedKey = this.getParent()?.getSelectedKey();
                const requests = [];

                this._oData.isLoaded = false;
                this._oData.isCountCalledOnce = false;
                this.setCount();

                if (this.getSupported()) {
                    // Load Placeholder Cards
                    this._generatePlaceHolderTiles();

                    // Add Initial Batch Requests
                    requests.push(this._generateRequestObject({ type: selectedKey, onlyCount: selectedKey !== this.getKey() }));
                    this.requests = this.requests.concat(requests);

                    //Submit Batch Requests
                    this.submitBatch()
                        .then(function () {
                            this._oData.isLoaded = selectedKey === this.getKey();
                            this._oData.isCountCalledOnce = true;
                            this.setCount(this._oData.length);
                            this._setSectionRefreshInterval();
                            this._oData.refreshInfo = this.toRelativeDateTime(new Date());
                            this._oData.lastRefreshedTime = new Date();
                            this.updateRefreshInformation();

                            //Update Container Header if the panel is exclusive
                            if (this.isExclusivePanel()) {
                                this.getParent().setTitle(`${this.getResourceBundle().getText("toDosTitle")} (${this._oData.length})`);
                            }
                        }.bind(this))
                        .finally(function () {
                            this._controlModel.refresh();
                            this.attachResizeHandler();
                            this._loadToDos = undefined;
                            resovle();
                        }.bind(this));
                } else {
                    this._handleError(`User not authorized to access: + ${this.getTargetAppUrl()}`);

                    // Remove Item from IconTabBar
                    this.getParent()?.removeContent(this);
                }
            });
        }
        return this._loadToDos;
    };

    /**
     * Attaches a resize handler to the parent container to adjust
     * the layout based on device size changes.
     *
     */
    ToDoPanel.prototype.attachResizeHandler = function () {
        const parentContainer = this.getParent();

        if (parentContainer) {
            this._resizeObserver?.disconnect();
            this._resizeObserver = new ResizeObserver(this._adjustLayout.bind(this));
            this._resizeObserver.observe(parentContainer.getDomRef());
        }
    };

    /**
     * Checks if the panel is exclusive based on support and the number of panels.
     *
     * @returns {boolean} True if the panel is exclusive, otherwise false.
     */
    ToDoPanel.prototype.isExclusivePanel = function () {
        const allPanels = this.getParent().getContent();
        const supportedPanels = allPanels.filter((panel) => panel.getSupported());

        return supportedPanels.length === 1 || (allPanels.length === 1 && this.getSupported());
    };

    /**
     * Sets the interval for refreshing the section.
     *
     */
    ToDoPanel.prototype._setSectionRefreshInterval = function () {
        clearInterval(this._oData.refreshFn);
        this._oData.refreshFn = setInterval(() => {
            this._oData.lastRefreshedTime = this._oData.lastRefreshedTime || new Date();
            this._oData.refreshInfo = this.toRelativeDateTime(this._oData.lastRefreshedTime);
            this.updateRefreshInformation();
        }, AppConstants.TODOS_REFRESH_INTERVAL);
    };

    /**
     * Updates the refresh information and adjusts the layout.
     *
     */
    ToDoPanel.prototype.updateRefreshInformation = function () {
        if (this.getParent().getSelectedKey() === this.getKey()) {
            this._refreshBtn.setText(this._oData.refreshInfo);
            this.getParent()?.updateContainerHeader();
        }

        this._adjustLayout();
    };

    /**
     * Adjusts the layout based on card count and device type.
     *
     */
    ToDoPanel.prototype._adjustLayout = function () {
        const cardCount = this._calculateCardCount();
        const isPhone = Device.resize.width < AppConstants.MOBILE_DEVICE_MAX_WIDTH || Device.system.phone;

        if (this._oData.tiles.length && !this._oData.hasError) {
            const displayCards = this._oData.tiles.slice(0, cardCount);
            this._controlModel.setProperty("/displayTiles", displayCards);
            this._controlModel.setProperty("/viewAllVisible", this._oData.length > cardCount);
            this._controlModel.setProperty("/viewAllUrl", this.getTargetAppUrl());
        }

        this._controlModel.setProperty("/isPhone", isPhone);
    };

    /**
     * Checks if the panel is loaded.
     *
     * @returns {boolean} true if the panel is loaded, false otherwise.
     */
    ToDoPanel.prototype.isLoaded = function () {
        const selectedKey = this.getParent().getSelectedKey();
        let isLoaded = this._oData.isLoaded;

        if (selectedKey !== this.getKey() && !isLoaded) {
            isLoaded = this._oData.isCountCalledOnce;
        }

        return isLoaded;
    };

    /**
     * Set the loaded status of the ToDoPanel.
     *
     * @param {boolean} value - The new loaded status to set for the ToDoPanel.
     */
    ToDoPanel.prototype.setLoaded = function (value) {
        this._oData.isLoaded = value;
    };

    /**
     * Generates placeholder tiles for the panel.
     *
     */
    ToDoPanel.prototype._generatePlaceHolderTiles = function () {
        this._cardCount = this._calculateCardCount();
        this._oData.displayTiles = this._oData.tiles = new Array(this._cardCount).fill({ status: "Loading" });
        this._oData.isLoaded = this._oData.hasError = false;
        this._controlModel.refresh();
    };

    /**
     * Calculates the number of cards to be displayed in the panel.
     *
     * @returns {number} The calculated card count.
     */
    ToDoPanel.prototype._calculateCardCount = function () {
        const isMobileDevice = this._controlModel.getProperty("/isPhone");
        const toDosWrapperDomRef = this._toDoWrapper?.getDomRef();
        let cardCount = isMobileDevice ? AppConstants.TODO_SECTION_LIMIT : 1;

        if (toDosWrapperDomRef && !isMobileDevice) {
            const calculateHorizontalCardCount = (oDomRef) => {
                const domProperties = fetchElementProperties(oDomRef, [
                    "width",
                    "padding-left",
                    "padding-right",
                    "margin-left",
                    "margin-right"
                ]);
                const availableWidth = Object.values(domProperties).slice(1).reduce((acc, val) => acc - val, domProperties["width"]);
                const cardWidth = calculateCardWidth(availableWidth);

                // Calculate Horizontal Card Count
                let horizontalCardCount = Math.floor(availableWidth / cardWidth);
                horizontalCardCount = horizontalCardCount > 0 ? horizontalCardCount : 1;
                this._controlModel.setProperty("/cardWidth", `${cardWidth / 16}rem`);
                this._controlModel.setProperty("/todoHorizontalCardCount", horizontalCardCount);

                return horizontalCardCount;
            };

            const horizontalCardCount = calculateHorizontalCardCount(toDosWrapperDomRef);
            cardCount = Math.min(horizontalCardCount, AppConstants.TODO_CARDS_LIMIT);
        }

        return cardCount;
    };

    /**
     * Convert a priority string to a corresponding priority value.
     *
     * @param {string} priorityString - The task priority string.
     * @returns {string} The corresponding priority value.
     */
    ToDoPanel.prototype.toPriority = function (priorityString) {
        if (priorityString === "VERY_HIGH") {
            return Priority.VeryHigh ? Priority.VeryHigh : Priority.None;
        } else if (priorityString === "HIGH") {
            return Priority.High;
        } else if (priorityString === "MEDIUM") {
            return Priority.Medium;
        } else if (priorityString === "LOW") {
            return Priority.Low;
        } else {
            return Priority.None;
        }
    };

    /**
     * Convert a priority string to a corresponding priority text.
     *
     * @param {string} priority - The priority string.
     * @returns {string} The corresponding priority text.
     */
    ToDoPanel.prototype.toPriorityText = function (priority) {
        if (priority === "VERY_HIGH" || priority === "VeryHigh") {
            return "veryHighPriority";
        } else if (priority === "HIGH" || priority === "High") {
            return "highPriority";
        } else if (priority === "MEDIUM" || priority === "Medium") {
            return "mediumPriority";
        } else if (priority === "LOW" || priority === "Low") {
            return "lowPriority";
        } else {
            return "nonePriority";
        }
    };

    /**
     * Formats the given date to a relative date.
     *
     * @param {Date} date Date object or Date String
     * @returns {string} Formatted Date
     */
    ToDoPanel.prototype.toRelativeDateTime = function (date) {
        return relativeDateFormatter.format(new Date(date));
    };

    return ToDoPanel;
});
