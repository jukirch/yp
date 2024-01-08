sap.ui.define([
    "sap/suite/ui/commons/ToDoPanel",
    "sap/m/GenericTile",
    "sap/m/TileContent",
    "sap/f/GridListItem",
    "sap/m/FlexBox",
    "sap/m/Link",
    "sap/m/Text",
    "sap/base/Log",
    "sap/m/ObjectAttribute",
    "sap/m/library",
    "sap/ui/core/format/DateFormat"
], function (
    ToDoPanel,
    GenericTile,
    TileContent,
    GridListItem,
    FlexBox,
    Link,
    Text,
    Log,
    ObjectAttribute,
    mobileLibrary,
    DateFormat
) {
    "use strict";

    const URLHelper = mobileLibrary.URLHelper;

    const TaskPanel = ToDoPanel.extend("sap.suite.ui.commons.TaskPanel");

    /**
     * Init lifecycle method
     *
     */
    TaskPanel.prototype.init = function () {
        //Configure Header
        this.setKey("tasks");
        this.setTitle(this.getResourceBundle().getText("tasksTabTitle"));

        ToDoPanel.prototype.init.apply(this, arguments);
    };

    /**
     * Generates a card template for tasks.
     *
     * @param {string} id - The ID for the template.
     * @param {Object} context - The context object.
     * @returns {sap.f.GridListItem} The generated card template.
     */
    TaskPanel.prototype.generateCardTemplate = function (id, context) {
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
                    press: this._onPressTask.bind(this),
                    tileContent: [
                        new TileContent(`${id}-tileContent`, {
                            priority: "{_toDos>priority}",
                            priorityText: this.getResourceBundle().getText(
                                this.toPriorityText(context.getProperty("priority"))
                            ),
                            footer: "{_toDos>footerText}",
                            content: [
                                this._getCardContentTemplate(id, context.getProperty("attributes"))
                            ]
                        })
                    ]
                })
            ]
        }).addStyleClass("sapMGT");
    };

    /**
     * Handles the press event of a task.
     *
     * @param {sap.ui.base.Event} event - The press event.
     */
    TaskPanel.prototype._onPressTask = function (event) {
        const control = event.getSource();
        const context = control.getBindingContext("_toDos");
        const status = context.getProperty("status");

        if (!this._disableNavigation) {
            if (status !== "Loading") {
                URLHelper.redirect(context.getProperty("link"), false);
            }
        }
    };

    /**
     * Generates the content template for a task.
     *
     * @param {string} id - The ID for the template.
     * @param {Object []} attributes - The task attributes.
     * @returns {sap.m.FlexBox} - The content template.
     */
    TaskPanel.prototype._getCardContentTemplate = function (id, attributes) {
        const fetchProperty = (sKey, sPropertyName) => {
            const attribute = attributes?.find((attribute) => attribute.name === sKey) || {};
            return attribute[sPropertyName];
        };

        return new FlexBox(`${id}-contentContainer`, {
            direction: "Column",
            items: [
                new ObjectAttribute(`${id}-dueDateContent`, {
                    title: fetchProperty("dueDate", "label"),
                    visible: fetchProperty("dueDate", "value") !== "",
                    customContent: [
                        new Text(`${id}-dueDateText`, {
                            text: fetchProperty("dueDate", "value")
                        })
                    ]
                }),
                new ObjectAttribute(`${id}-createdByContent`, {
                    title: fetchProperty("createdBy", "label"),
                    visible: fetchProperty("createdBy", "value") !== "",
                    customContent: [
                        new Link(`${id}-createdByLink`, {
                            text: fetchProperty("createdBy", "value"),
                            press: this._onClickCreatedBy.bind(this)
                        })
                    ]
                })
            ]
        });
    };

    /**
     * Fetches user information for a specific user.
     *
     * @param {string} originId - The origin ID.
     * @param {string} userId - The user ID.
     * @returns {Promise} - A promise that resolves to the user information.
     */
    TaskPanel.prototype.fetchUserInfo = async function (originId, userId) {
        try {
            const response = await fetch(
                `/sap/opu/odata/IWPGW/TASKPROCESSING;mo;v=2/UserInfoCollection(SAP__Origin='${originId}',UniqueName='${userId}')?$format=json`
            );

            if (!response.ok) {
                throw new Error(`Failed to Fetch User Info for: ${userId}`);
            }

            const data = await response.json();
            this.userInfo[userId] = data.d;
            return this.userInfo[userId];
        } catch (error) {
            Log.error(error.message);
            return {};
        }
    };

    /**
     * Fetches user details if required.
     *
     * @param {string} originId - The origin ID.
     * @param {string} userId - The user ID.
     * @returns {Promise} - A promise that resolves to the user information.
     */
    TaskPanel.prototype.fetchUserDetailsIfRequired = function (originId, userId) {
        this.userInfo = this.userInfo || {};

        if (Object.keys(this.userInfo).includes(userId)) {
            return Promise.resolve(this.userInfo[userId]);
        } else {
            return this.fetchUserInfo(originId, userId);
        }
    };

    /**
     * Handles the click event on the "Created By" link.
     * Triggers email or opens a contact card if configuration is enabled
     *
     * @param {object} event - The event object.
     */
    TaskPanel.prototype._onClickCreatedBy = async function (event) {
        const sourceControl = event.getSource();
        const context = event.getSource().getBindingContext("_toDos");
        const attributes = context.getProperty("attributes");
        const fetchValue = (key) => {
            const attribute = attributes.find((content) => content.name === key) || {};
            return attribute.value;
        };
        const triggerEmail = (email) => {
            URLHelper.triggerEmail(email);
            setTimeout(() => { this._disableNavigation = false; }, 0);
        };
        const originId = fetchValue("originId");
        const userId = fetchValue("userId");

        this._disableNavigation = true;

        const userData = await this.fetchUserDetailsIfRequired(originId, userId);
        if (userData.Email) {
            sap.ui.require(["sap/suite/ui/commons/collaboration/ServiceContainer"], async (serviceContainer) => {
                const teamsHelper = await serviceContainer.getServiceAsync();

                if (teamsHelper.enableMinimalContactsCollaboration) {
                    try {
                        const popover = await teamsHelper.enableMinimalContactsCollaboration(userData.Email);
                        popover.openBy(sourceControl);
                    } catch (error) {
                        triggerEmail(userData.Email);
                    }
                } else {
                    triggerEmail(userData.Email);
                }
            });
        } else {
            setTimeout(() => { this._disableNavigation = false; }, 0);
        }
    };

    /**
     * Get the priority text based on the priority value.
     *
     * @param {string} priority - The priority value.
     * @returns {string} - The priority text.
     */
    TaskPanel.prototype._getPriorityText = function (priority) {
        const priorityMappings = {
            VeryHigh: "veryHighPriority",
            High: "highPriority",
            Medium: "mediumPriority",
            Low: "lowPriority",
            None: "nonePriority"
        };

        const priorityKey = priorityMappings[priority] || priorityMappings.None;
        return this.getResourceBundle().getText(priorityKey);
    };

    /**
     * Process the task data and populate the tiles with relevant information.
     *
     * @param {Object []} data - The task data to process.
     */
    TaskPanel.prototype.processData = function (data) {
        this._oData.displayTiles = this._oData.tiles = (data || []).map(
            (oTask) => ({
                title: oTask.TaskTitle,
                priority: this.toPriority(oTask.Priority),
                priorityText: this.getResourceBundle().getText(
                    this.toPriorityText(oTask.Priority)
                ),
                criticality: "None",
                attributes: this._getDefaultAttributes(oTask),
                link: this._getTaskUrl(oTask),
                formatContent: true,
                footerText: this.getResourceBundle().getText("createdTask", [
                    this.toRelativeDateTime(this._getDateFromString(oTask.CreatedOn))
                ])
            })
        );
    };

    /**
     * Convert an OData date string to a JavaScript Date object.
     *
     * @param {string} oDataDateString - The OData date string.
     * @returns {Date} The converted Date object.
     */
    TaskPanel.prototype._getDateFromString = function (oDataDateString) {
        const dateRegex = /\/Date\((\d*)\)\//;
        const dateParts = oDataDateString.match(dateRegex);
        const ticks = dateParts && dateParts[1];

        if (ticks) {
            const timestamp = +ticks;
            return new Date(timestamp);
        }

        return new Date(oDataDateString);
    };

    /**
     * Get the task URL for a given task.
     *
     * @param {Object} task - The task object.
     * @returns {string} The task URL.
     */
    TaskPanel.prototype._getTaskUrl = function (task) {
        const taskInstanceURL = `?showAdditionalAttributes=true` +
            `&/detail/${task.SAP__Origin}/${task.InstanceID}/TaskCollection(SAP__Origin='${task.SAP__Origin}',InstanceID='${task.InstanceID}')`;

        return this.getTargetAppUrl() + taskInstanceURL;
    };


    /**
     * Get the default attributes for a task.
     *
     * @param {Object} task - The task object.
     * @returns {Object[]} An array of default attributes.
     */
    TaskPanel.prototype._getDefaultAttributes = function (task) {
        return [
            {
                name: "originId",
                label: "",
                value: task.SAP__Origin
            },
            {
                name: "userId",
                label: "",
                value: task.CreatedBy
            },
            {
                name: "dueDate",
                label: this.getResourceBundle().getText("dueDate"),
                value: task.CompletionDeadline ? this._formatDate(task.CompletionDeadline) : ""
            },
            {
                name: "createdBy",
                label: this.getResourceBundle().getText("createdBy"),
                value: task.CreatedByName ? task.CreatedByName : ""
            }
        ];
    };

    /**
     * Format a date string to a custom date and time format.
     *
     * @param {string} dateStr - The date string to format.
     * @returns {string} The formatted date string.
     */
    TaskPanel.prototype._formatDate = function (dateStr) {
        const date = this._getDateFromString(dateStr);
        const locale = sap.ui.getCore().getConfiguration().getFormatSettings().getFormatLocale();
        const dateFormat = DateFormat.getDateTimeInstance({ pattern: "MMM dd, yyyy hh:mm a" }, locale);

        return dateFormat.format(date);
    };

    /**
     * Format a date into a user-friendly format.
     *
     * @param {string} date - The date to format.
     * @returns {string} The formatted date.
     */
    TaskPanel.prototype._formatDate = function (date) {
        const oDate = this._getDateFromString(date);
        const oLocale = sap.ui.getCore().getConfiguration().getFormatSettings().getFormatLocale();
        const oDateFormat = DateFormat.getDateTimeInstance({ pattern: "MMM dd, yyyy hh:mm a" }, oLocale);

        return oDateFormat.format(oDate);
    };

    /**
     * Get the text for the "View All Items" list item.
     *
     * @returns {string} The text for the "View All Items" list item.
     */
    TaskPanel.prototype.getViewAllItemsText = function () {
        return this.getResourceBundle().getText("viewAllTasksTitle");
    };

    /**
     * Get the text for the "No Data" message.
     *
     * @returns {string} The text for the "No Data" message.
     */
    TaskPanel.prototype.getNoDataText = function () {
        return this.getResourceBundle().getText("noTaskTitle");
    };

    return TaskPanel;
});
