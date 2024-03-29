/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/macros/table/Utils"], function (Log, Utils) {
  "use strict";

  let DataQueryWatcher = /*#__PURE__*/function () {
    function DataQueryWatcher(_oEventProvider, _fnOnFinished) {
      this._aBindingRegistrations = [];
      this._aOtherEventSources = [];
      this._isSearchPending = false;
      this._aMDCTables = [];
      this._aMDCCharts = [];
      this._oEventProvider = _oEventProvider;
      this._fnOnFinished = _fnOnFinished;
    }

    // Accessors
    var _proto = DataQueryWatcher.prototype;
    _proto.isSearchPending = function isSearchPending() {
      return this._isSearchPending;
    };
    _proto.isDataReceived = function isDataReceived() {
      return this._isDataReceived;
    };
    _proto.resetDataReceived = function resetDataReceived() {
      this._isDataReceived = undefined;
    }

    /**
     * Reset the state: unsubscribe to all data events and remove all registered objects.
     */;
    _proto.reset = function reset() {
      // Remove all remaining callbacks
      this._aBindingRegistrations.forEach(reg => {
        reg.binding.detachEvent("dataRequested", this.onDataRequested, this);
        reg.binding.detachEvent("dataReceived", this.onDataReceived, this);
      });
      this._aOtherEventSources.forEach(oElement => {
        oElement.detachEvent("search", this.onSearch, this);
        oElement.detachEvent("bindingUpdated", this.register, this);
      });
      this._aBindingRegistrations = [];
      this._aOtherEventSources = [];
      this._aMDCTables = [];
      this._aMDCCharts = [];
      this._isSearchPending = false;
      this._isDataReceived = undefined;
    }

    // //////////////////////////////////////////////////
    // Callback when data is received on a binding.
    ;
    _proto.onDataReceived = function onDataReceived(oEvent, params) {
      // Look for the corresponding binding registration
      const binding = oEvent.getSource();
      const bindingRegistration = this._aBindingRegistrations.find(reg => {
        return reg.binding === binding;
      });
      if (!bindingRegistration) {
        Log.error("PageReady - data received on an unregistered binding");
        return;
      }
      switch (binding.getGroupId()) {
        case "$auto.Workers":
          this._oEventProvider.fireEvent("workersBatchReceived");
          break;
        case "$auto.Heroes":
          this._oEventProvider.fireEvent("heroesBatchReceived");
          break;
        default:
      }
      bindingRegistration.receivedCount++;
      if (bindingRegistration.receivedCount < bindingRegistration.requestedCount) {
        // There are other request pending --> resubscribe to wait until they return
        binding.attachEventOnce("dataReceived", {
          triggeredBySearch: params.triggeredBySearch
        }, this.onDataReceived, this);
        return;
      }
      // Check if at least one binding has requested data, and all bindings that have requested data have received it
      const bAllDone = this._aBindingRegistrations.some(reg => {
        return reg.requestedCount !== 0;
      }) && this._aBindingRegistrations.every(reg => {
        return reg.requestedCount === 0 || reg.receivedCount >= reg.requestedCount;
      });
      if (params.triggeredBySearch || bindingRegistration.receivedCount >= bindingRegistration.requestedCount) {
        this._isSearchPending = false;
      }
      if (bAllDone) {
        this._isDataReceived = true;
        this._fnOnFinished();
      }
    }

    // //////////////////////////////////////////////////
    // Callback when data is requested on a binding.
    ;
    _proto.onDataRequested = function onDataRequested(oEvent, params) {
      // Look for the corresponding binding registration
      const binding = oEvent.getSource();
      const bindingRegistration = this._aBindingRegistrations.find(reg => {
        return reg.binding === binding;
      });
      if (!bindingRegistration) {
        Log.error("PageReady - data requested on an unregistered binding");
        return;
      }
      bindingRegistration.requestedCount++;
      this._isDataReceived = false;
      if (bindingRegistration.requestedCount - bindingRegistration.receivedCount === 1) {
        // Listen to dataReceived only if there's no other request pending
        // Otherwise the 'dataReceived' handler would be called several times when the first query returns
        // and we wouldn't wait for all queries to be finished
        // (we will resubscribe to the dataReceived event in onDataReceived if necessary)
        binding.attachEventOnce("dataReceived", {
          triggeredBySearch: params.triggeredBySearch
        }, this.onDataReceived, this);
      }
    }

    // //////////////////////////////////////////////////
    // Callback when a search is triggered from a filterbar
    ;
    _proto.onSearch = function onSearch(oEvent) {
      const aMDCTableLinkedToFilterBar = this._aMDCTables.filter(oTable => {
        var _oTable$getParent;
        return oEvent.getSource().sId === oTable.getFilter() && oTable.getVisible() && !((_oTable$getParent = oTable.getParent()) !== null && _oTable$getParent !== void 0 && _oTable$getParent.getProperty("bindingSuspended"));
      });
      const aMDCChartsLinkedToFilterBar = this._aMDCCharts.filter(oChart => {
        return oEvent.getSource().sId === oChart.getFilter() && oChart.getVisible();
      });
      if (aMDCTableLinkedToFilterBar.length > 0 || aMDCChartsLinkedToFilterBar.length > 0) {
        this._isSearchPending = true;
      }
      aMDCTableLinkedToFilterBar.forEach(oTable => {
        this.registerTable(oTable, true);
      });
      aMDCChartsLinkedToFilterBar.forEach(async oChart => {
        try {
          if (oChart.innerChartBoundPromise) {
            await oChart.innerChartBoundPromise;
          }
          this.registerChart(oChart, true);
        } catch (oError) {
          Log.error("Cannot find a inner bound chart", oError);
        }
      });
    }

    // //////////////////////////////////////////////////
    // Register a binding (with an optional table/chart)
    // and attach callbacks on dateRequested/dataReceived events
    ;
    _proto.register = function register(_event, data) {
      var _data$table, _data$chart;
      const binding = data.binding || ((_data$table = data.table) === null || _data$table === void 0 ? void 0 : _data$table.getRowBinding()) || ((_data$chart = data.chart) === null || _data$chart === void 0 ? void 0 : _data$chart.getControlDelegate().getInnerChart(data.chart).getBinding("data"));
      const boundControl = data.table || data.chart;
      if (!binding) {
        return;
      }
      // Check if the binding is already registered
      let bindingRegistration = this._aBindingRegistrations.find(reg => {
        return reg.binding === binding;
      });
      if (bindingRegistration) {
        if (boundControl) {
          // The binding was already registerd without boundControl information --> update boundControl
          bindingRegistration.boundControl = boundControl;
        }
        // This binding has already requested data, but we're registering it again (on search) --> attach to dataRequested again
        if (bindingRegistration.requestedCount > 0) {
          binding.detachEvent("dataRequested", this.onDataRequested, this);
          binding.attachEventOnce("dataRequested", {
            triggeredBySearch: data.triggeredBySearch
          }, this.onDataRequested, this);
        }
        return;
      }
      if (boundControl) {
        // Check if there's a different binding registered for the bound control
        bindingRegistration = this._aBindingRegistrations.find(reg => {
          return reg.boundControl === boundControl;
        });
        if (bindingRegistration && bindingRegistration.binding !== binding) {
          // The control had a different binding. This can happen in case of MDC charts who recreated their binding after search
          // The previous binding is destroyed, we can replace it with the new and reset counters
          bindingRegistration.binding = binding;
          bindingRegistration.requestedCount = 0;
          bindingRegistration.receivedCount = 0;
        }
      }
      if (!bindingRegistration) {
        bindingRegistration = {
          binding: binding,
          boundControl: boundControl,
          requestedCount: 0,
          receivedCount: 0
        };
        this._aBindingRegistrations.push(bindingRegistration);
      }
      binding.detachEvent("dataRequested", this.onDataRequested, this);
      binding.attachEventOnce("dataRequested", {
        triggeredBySearch: data.triggeredBySearch
      }, this.onDataRequested, this);
    }

    /**
     * Registers a binding for watching its data events (dataRequested and dataReceived).
     *
     * @param binding The binding
     */;
    _proto.registerBinding = function registerBinding(binding) {
      this.register(null, {
        binding,
        triggeredBySearch: false
      });
    }

    /**
     * Registers an MDCTable for watching the data events on its row binding (dataRequested and dataReceived).
     *
     * @param table The table
     * @param triggeredBySearch True if this registration is triggered by a filterBar search
     */;
    _proto.registerTable = function registerTable(table) {
      let triggeredBySearch = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      if (!this._aMDCTables.includes(table)) {
        this._aMDCTables.push(table);
      }
      const oRowBinding = table.getRowBinding();
      if (oRowBinding) {
        this.register(null, {
          table,
          triggeredBySearch
        });
      }
      if (!this._aOtherEventSources.includes(table)) {
        table.attachEvent("bindingUpdated", {
          table,
          triggeredBySearch
        }, this.register, this);
        this._aOtherEventSources.push(table);
      }
    }

    /**
     * Registers an MDCChart for watching the data events on its inner data binding (dataRequested and dataReceived).
     *
     * @param chart The chart
     * @param triggeredBySearch True if this registration is triggered by a filterBar search
     */;
    _proto.registerChart = function registerChart(chart) {
      let triggeredBySearch = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      if (!this._aMDCCharts.includes(chart)) {
        this._aMDCCharts.push(chart);
      }
      const oInnerChart = chart.getControlDelegate().getInnerChart(chart);
      const binding = oInnerChart === null || oInnerChart === void 0 ? void 0 : oInnerChart.getBinding("data");
      if (binding) {
        this.register(null, {
          chart,
          triggeredBySearch
        });
      }
      if (!this._aOtherEventSources.includes(chart)) {
        chart.attachEvent("bindingUpdated", {
          chart,
          triggeredBySearch
        }, this.register, this);
        this._aOtherEventSources.push(chart);
      }
    }

    /**
     * Registers an MDCTable or MDCChart for watching the data events on its inner data binding (dataRequested and dataReceived).
     *
     * @param element  The table or chart
     */;
    _proto.registerTableOrChart = async function registerTableOrChart(element) {
      if (!element.isA("sap.ui.mdc.Table") && !element.isA("sap.ui.mdc.Chart")) {
        return;
      }
      try {
        await element.initialized(); // access binding only after table/chart is bound
        if (element.isA("sap.ui.mdc.Table")) {
          this.registerTable(element);
          //If the autoBindOnInit is enabled, the table will be rebound
          //Then we need to wait for this rebind to occur to ensure the pageReady will also wait for the data to be received
          if (element.getAutoBindOnInit() && element.getDomRef()) {
            await Utils.whenBound(element);
          }
        } else {
          this.registerChart(element);
        }
      } catch (oError) {
        Log.error("PageReady - Cannot register a table or a chart", oError);
      }
    }

    /**
     * Registers an MDCFilterBar for watching its search event.
     *
     * @param filterBar The filter bar
     */;
    _proto.registerFilterBar = function registerFilterBar(filterBar) {
      filterBar.attachEvent("search", this.onSearch, this);
      this._aOtherEventSources.push(filterBar);
    };
    return DataQueryWatcher;
  }();
  return DataQueryWatcher;
}, false);
