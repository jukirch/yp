/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/ObjectPath", "sap/base/util/extend", "sap/fe/core/helpers/ClassSupport", "sap/m/library", "sap/ui/core/Component", "sap/ui/core/Core", "sap/ui/core/Fragment", "sap/ui/core/XMLTemplateProcessor", "sap/ui/core/mvc/ControllerExtension", "sap/ui/core/mvc/OverrideExecution", "sap/ui/core/routing/HashChanger", "sap/ui/core/util/XMLPreprocessor", "sap/ui/model/json/JSONModel"], function (Log, ObjectPath, extend, ClassSupport, library, Component, Core, Fragment, XMLTemplateProcessor, ControllerExtension, OverrideExecution, HashChanger, XMLPreprocessor, JSONModel) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _class, _class2;
  var publicExtension = ClassSupport.publicExtension;
  var methodOverride = ClassSupport.methodOverride;
  var finalExtension = ClassSupport.finalExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  let oLastFocusedControl;
  /**
   * A controller extension offering hooks into the routing flow of the application
   *
   * @hideconstructor
   * @public
   * @since 1.86.0
   */
  let ShareUtils = (_dec = defineUI5Class("sap.fe.core.controllerextensions.Share"), _dec2 = methodOverride(), _dec3 = methodOverride(), _dec4 = publicExtension(), _dec5 = finalExtension(), _dec6 = publicExtension(), _dec7 = extensible(OverrideExecution.After), _dec8 = publicExtension(), _dec9 = extensible(OverrideExecution.After), _dec10 = publicExtension(), _dec11 = finalExtension(), _dec12 = publicExtension(), _dec13 = finalExtension(), _dec14 = publicExtension(), _dec15 = finalExtension(), _dec16 = publicExtension(), _dec17 = finalExtension(), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    _inheritsLoose(ShareUtils, _ControllerExtension);
    function ShareUtils() {
      return _ControllerExtension.apply(this, arguments) || this;
    }
    var _proto = ShareUtils.prototype;
    _proto.onInit = function onInit() {
      const shareInfoModel = new JSONModel({
        saveAsTileClicked: false,
        collaborationInfo: {
          url: "",
          appTitle: "",
          subTitle: "",
          minifyUrlForChat: true,
          appId: ""
        }
      });
      this.base.getView().setModel(shareInfoModel, "shareInfo");
    };
    _proto.onExit = function onExit() {
      var _this$base, _this$base$getView;
      const shareInfoModel = (_this$base = this.base) === null || _this$base === void 0 ? void 0 : (_this$base$getView = _this$base.getView()) === null || _this$base$getView === void 0 ? void 0 : _this$base$getView.getModel("shareInfo");
      if (shareInfoModel) {
        shareInfoModel.destroy();
      }
    }

    /**
     * Opens the share sheet.
     *
     * @param oControl The control to which the ActionSheet is opened.
     * @public
     * @since 1.93.0
     */;
    _proto.openShareSheet = function openShareSheet(oControl) {
      this._openShareSheetImpl(oControl);
    }

    /**
     * Get adaptive card definition.
     */;
    _proto.getCardDefinition = function getCardDefinition() {
      return;
    }

    /**
     * Adapts the metadata used while sharing the page URL via 'Send Email', 'Share in SAP Jam', and 'Save as Tile'.
     *
     * @param oShareMetadata Object containing the share metadata.
     * @param oShareMetadata.url Default URL that will be used via 'Send Email', 'Share in SAP Jam', and 'Save as Tile'
     * @param oShareMetadata.title Default title that will be used as 'email subject' in 'Send Email', 'share text' in 'Share in SAP Jam' and 'title' in 'Save as Tile'
     * @param oShareMetadata.email Email-specific metadata.
     * @param oShareMetadata.email.url URL that will be used specifically for 'Send Email'. This takes precedence over oShareMetadata.url.
     * @param oShareMetadata.email.title Title that will be used as "email subject" in 'Send Email'. This takes precedence over oShareMetadata.title.
     * @param oShareMetadata.jam SAP Jam-specific metadata.
     * @param oShareMetadata.jam.url URL that will be used specifically for 'Share in SAP Jam'. This takes precedence over oShareMetadata.url.
     * @param oShareMetadata.jam.title Title that will be used as 'share text' in 'Share in SAP Jam'. This takes precedence over oShareMetadata.title.
     * @param oShareMetadata.tile Save as Tile-specific metadata.
     * @param oShareMetadata.tile.url URL that will be used specifically for 'Save as Tile'. This takes precedence over oShareMetadata.url.
     * @param oShareMetadata.tile.title Title to be used for the tile. This takes precedence over oShareMetadata.title.
     * @param oShareMetadata.tile.subtitle Subtitle to be used for the tile.
     * @param oShareMetadata.tile.icon Icon to be used for the tile.
     * @param oShareMetadata.tile.queryUrl Query URL of an OData service from which data for a dynamic tile is read.
     * @returns Share Metadata or a Promise resolving the Share Metadata
     * @public
     * @since 1.93.0
     */;
    _proto.adaptShareMetadata = function adaptShareMetadata(oShareMetadata) {
      return oShareMetadata;
    };
    _proto._openShareSheetImpl = async function _openShareSheetImpl(by) {
      let oShareActionSheet;
      const sHash = HashChanger.getInstance().getHash(),
        sBasePath = HashChanger.getInstance().hrefForAppSpecificHash ? HashChanger.getInstance().hrefForAppSpecificHash("") : "",
        oShareMetadata = {
          url: window.location.origin + window.location.pathname + window.location.search + (sHash ? sBasePath + sHash : window.location.hash),
          title: document.title,
          email: {
            url: "",
            title: ""
          },
          jam: {
            url: "",
            title: ""
          },
          tile: {
            url: "",
            title: "",
            subtitle: "",
            icon: "",
            queryUrl: ""
          }
        };
      oLastFocusedControl = by;
      const setShareEmailData = function (shareActionSheet, oModelData) {
        const oShareMailModel = shareActionSheet.getModel("shareData");
        const oNewMailData = extend(oShareMailModel.getData(), oModelData);
        oShareMailModel.setData(oNewMailData);
      };
      try {
        var _this$base$getView$ge, _this$base$getView$ge2, _oModelData$tile, _oModelData$tile2, _oModelData$tile3, _oModelData$tile4, _oModelData$tile5;
        const oModelData = await ((_this$base$getView$ge = this.base.getView().getController()) === null || _this$base$getView$ge === void 0 ? void 0 : (_this$base$getView$ge2 = _this$base$getView$ge.share) === null || _this$base$getView$ge2 === void 0 ? void 0 : _this$base$getView$ge2.adaptShareMetadata(oShareMetadata));
        const fragmentController = {
          shareEmailPressed: function () {
            const oMailModel = oShareActionSheet.getModel("shareData");
            const oMailData = oMailModel.getData();
            const oResource = Core.getLibraryResourceBundle("sap.fe.core");
            const sEmailSubject = oMailData.email.title ? oMailData.email.title : oResource.getText("T_SHARE_UTIL_HELPER_SAPFE_EMAIL_SUBJECT", [oMailData.title]);
            library.URLHelper.triggerEmail(undefined, sEmailSubject, oMailData.email.url ? oMailData.email.url : oMailData.url);
          },
          shareMSTeamsPressed: function () {
            const msTeamsModel = oShareActionSheet.getModel("shareData");
            const msTeamsData = msTeamsModel.getData();
            const message = msTeamsData.email.title ? msTeamsData.email.title : msTeamsData.title;
            const url = msTeamsData.email.url ? msTeamsData.email.url : msTeamsData.url;
            const newWindowOpen = window.open("", "ms-teams-share-popup", "width=700,height=600");
            newWindowOpen.opener = null;
            newWindowOpen.location = `https://teams.microsoft.com/share?msgText=${encodeURIComponent(message)}&href=${encodeURIComponent(url)}`;
          },
          onSaveTilePress: function () {
            // TODO it seems that the press event is executed before the dialog is available - adding a timeout is a cheap workaround
            setTimeout(function () {
              var _Core$byId;
              (_Core$byId = Core.byId("bookmarkDialog")) === null || _Core$byId === void 0 ? void 0 : _Core$byId.attachAfterClose(function () {
                oLastFocusedControl.focus();
              });
            }, 0);
          },
          shareJamPressed: () => {
            var _oModelData$jam, _oModelData$jam2;
            this._doOpenJamShareDialog(oModelData !== null && oModelData !== void 0 && (_oModelData$jam = oModelData.jam) !== null && _oModelData$jam !== void 0 && _oModelData$jam.title ? oModelData.jam.title : oModelData.title, oModelData !== null && oModelData !== void 0 && (_oModelData$jam2 = oModelData.jam) !== null && _oModelData$jam2 !== void 0 && _oModelData$jam2.url ? oModelData.jam.url : oModelData.url);
          }
        };
        fragmentController.onCancelPressed = function () {
          oShareActionSheet.close();
        };
        fragmentController.setShareSheet = function (oShareSheet) {
          by.shareSheet = oShareSheet;
        };
        const oThis = new JSONModel({});
        const oPreprocessorSettings = {
          bindingContexts: {
            this: oThis.createBindingContext("/")
          },
          models: {
            this: oThis
          }
        };
        const oTileData = {
          title: oModelData !== null && oModelData !== void 0 && (_oModelData$tile = oModelData.tile) !== null && _oModelData$tile !== void 0 && _oModelData$tile.title ? oModelData.tile.title : oModelData.title,
          subtitle: oModelData === null || oModelData === void 0 ? void 0 : (_oModelData$tile2 = oModelData.tile) === null || _oModelData$tile2 === void 0 ? void 0 : _oModelData$tile2.subtitle,
          icon: oModelData === null || oModelData === void 0 ? void 0 : (_oModelData$tile3 = oModelData.tile) === null || _oModelData$tile3 === void 0 ? void 0 : _oModelData$tile3.icon,
          url: oModelData !== null && oModelData !== void 0 && (_oModelData$tile4 = oModelData.tile) !== null && _oModelData$tile4 !== void 0 && _oModelData$tile4.url ? oModelData.tile.url : oModelData.url.substring(oModelData.url.indexOf("#")),
          queryUrl: oModelData === null || oModelData === void 0 ? void 0 : (_oModelData$tile5 = oModelData.tile) === null || _oModelData$tile5 === void 0 ? void 0 : _oModelData$tile5.queryUrl
        };
        if (by.shareSheet) {
          oShareActionSheet = by.shareSheet;
          const oShareModel = oShareActionSheet.getModel("share");
          this._setStaticShareData(oShareModel);
          const oNewData = extend(oShareModel.getData(), oTileData);
          oShareModel.setData(oNewData);
          setShareEmailData(oShareActionSheet, oModelData);
          oShareActionSheet.openBy(by);
        } else {
          const sFragmentName = "sap.fe.macros.share.ShareSheet";
          const oPopoverFragment = XMLTemplateProcessor.loadTemplate(sFragmentName, "fragment");
          try {
            const oFragment = await XMLPreprocessor.process(oPopoverFragment, {
              name: sFragmentName
            }, oPreprocessorSettings);
            oShareActionSheet = await Fragment.load({
              definition: oFragment,
              controller: fragmentController
            });
            oShareActionSheet.setModel(new JSONModel(oTileData || {}), "share");
            const oShareModel = oShareActionSheet.getModel("share");
            this._setStaticShareData(oShareModel);
            const oNewData = extend(oShareModel.getData(), oTileData);
            oShareModel.setData(oNewData);
            oShareActionSheet.setModel(new JSONModel(oModelData || {}), "shareData");
            setShareEmailData(oShareActionSheet, oModelData);
            by.addDependent(oShareActionSheet);
            oShareActionSheet.openBy(by);
            fragmentController.setShareSheet(oShareActionSheet);
          } catch (oError) {
            Log.error("Error while opening the share fragment", oError);
          }
        }
      } catch (oError) {
        Log.error("Error while fetching the share model data", oError);
      }
    };
    _proto._setStaticShareData = function _setStaticShareData(shareModel) {
      const oResource = Core.getLibraryResourceBundle("sap.fe.core");
      shareModel.setProperty("/jamButtonText", oResource.getText("T_COMMON_SAPFE_SHARE_JAM"));
      shareModel.setProperty("/emailButtonText", oResource.getText("T_SEMANTIC_CONTROL_SEND_EMAIL"));
      shareModel.setProperty("/msTeamsShareButtonText", oResource.getText("T_COMMON_SAPFE_SHARE_MSTEAMS"));
      // Share to Microsoft Teams is feature which for now only gets enabled for selected customers.
      // The switch "sapHorizonEnabled" and check for it was aligned with the Fiori launchpad team.
      if (ObjectPath.get("sap-ushell-config.renderers.fiori2.componentData.config.sapHorizonEnabled") === true) {
        shareModel.setProperty("/msTeamsVisible", true);
      } else {
        shareModel.setProperty("/msTeamsVisible", false);
      }
      const fnGetUser = ObjectPath.get("sap.ushell.Container.getUser");
      shareModel.setProperty("/jamVisible", !!fnGetUser && fnGetUser().isJamActive());
      shareModel.setProperty("/saveAsTileVisible", !!(sap && sap.ushell && sap.ushell.Container));
    }

    //the actual opening of the JAM share dialog
    ;
    _proto._doOpenJamShareDialog = function _doOpenJamShareDialog(text, sUrl) {
      const oShareDialog = Component.create({
        name: "sap.collaboration.components.fiori.sharing.dialog",
        settings: {
          object: {
            id: sUrl,
            share: text
          }
        }
      });
      oShareDialog.open();
    }

    /**
     * Triggers the email flow.
     *
     */;
    _proto._triggerEmail = async function _triggerEmail() {
      const shareMetadata = await this._adaptShareMetadata();
      const oResource = Core.getLibraryResourceBundle("sap.fe.core");
      const sEmailSubject = shareMetadata.email.title ? shareMetadata.email.title : oResource.getText("T_SHARE_UTIL_HELPER_SAPFE_EMAIL_SUBJECT", [shareMetadata.title]);
      library.URLHelper.triggerEmail(undefined, sEmailSubject, shareMetadata.email.url ? shareMetadata.email.url : shareMetadata.url);
    }

    /**
     * Triggers the share to jam flow.
     *
     */;
    _proto._triggerShareToJam = async function _triggerShareToJam() {
      const shareMetadata = await this._adaptShareMetadata();
      this._doOpenJamShareDialog(shareMetadata.jam.title ? shareMetadata.jam.title : shareMetadata.title, shareMetadata.jam.url ? shareMetadata.jam.url : window.location.origin + window.location.pathname + shareMetadata.url);
    }

    /**
     * Triggers the save as tile flow.
     *
     * @param [source]
     */;
    _proto._saveAsTile = async function _saveAsTile(source) {
      var _this$base2, _this$base2$getView;
      const shareInfoModel = (_this$base2 = this.base) === null || _this$base2 === void 0 ? void 0 : (_this$base2$getView = _this$base2.getView()) === null || _this$base2$getView === void 0 ? void 0 : _this$base2$getView.getModel("shareInfo");
      if (shareInfoModel) {
        // set the saveAsTileClicked flag to true when save as tile is clicked
        shareInfoModel.setProperty("/saveAsTileClicked", true);
      }
      const shareMetadata = await this._adaptShareMetadata(),
        internalAddBookmarkButton = source.getDependents()[0],
        sHash = HashChanger.getInstance().getHash(),
        sBasePath = HashChanger.getInstance().hrefForAppSpecificHash ? HashChanger.getInstance().hrefForAppSpecificHash("") : "";
      shareMetadata.url = sHash ? sBasePath + sHash : window.location.hash;

      // set AddBookmarkButton properties
      internalAddBookmarkButton.setTitle(shareMetadata.tile.title ? shareMetadata.tile.title : shareMetadata.title);
      internalAddBookmarkButton.setSubtitle(shareMetadata.tile.subtitle);
      internalAddBookmarkButton.setTileIcon(shareMetadata.tile.icon);
      internalAddBookmarkButton.setCustomUrl(shareMetadata.tile.url ? shareMetadata.tile.url : shareMetadata.url);
      internalAddBookmarkButton.setServiceUrl(shareMetadata.tile.queryUrl);
      internalAddBookmarkButton.setDataSource({
        type: "OData",
        settings: {
          odataVersion: "4.0"
        }
      });

      // once the service url is read, set the saveAsTileClicked flag to false
      if (shareInfoModel) {
        shareInfoModel.setProperty("/saveAsTileClicked", false);
      }

      // addBookmarkButton fire press
      internalAddBookmarkButton.firePress();
    }

    /**
     * Call the adaptShareMetadata extension.
     *
     * @returns Share Metadata
     */;
    _proto._adaptShareMetadata = function _adaptShareMetadata() {
      const sHash = HashChanger.getInstance().getHash(),
        sBasePath = HashChanger.getInstance().hrefForAppSpecificHash ? HashChanger.getInstance().hrefForAppSpecificHash("") : "",
        oShareMetadata = {
          url: window.location.origin + window.location.pathname + window.location.search + (sHash ? sBasePath + sHash : window.location.hash),
          title: document.title,
          email: {
            url: "",
            title: ""
          },
          jam: {
            url: "",
            title: ""
          },
          tile: {
            url: "",
            title: "",
            subtitle: "",
            icon: "",
            queryUrl: ""
          }
        };
      return this.base.getView().getController().share.adaptShareMetadata(oShareMetadata);
    };
    return ShareUtils;
  }(ControllerExtension), (_applyDecoratedDescriptor(_class2.prototype, "onInit", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "onInit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onExit", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "onExit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "openShareSheet", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "openShareSheet"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getCardDefinition", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "getCardDefinition"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "adaptShareMetadata", [_dec8, _dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "adaptShareMetadata"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "_triggerEmail", [_dec10, _dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "_triggerEmail"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "_triggerShareToJam", [_dec12, _dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "_triggerShareToJam"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "_saveAsTile", [_dec14, _dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "_saveAsTile"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "_adaptShareMetadata", [_dec16, _dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "_adaptShareMetadata"), _class2.prototype)), _class2)) || _class);
  return ShareUtils;
}, false);
