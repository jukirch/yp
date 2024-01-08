sap.ui.define([
	"sap/suite/ui/commons/collaboration/ServiceContainer"
], function(ServiceContainer) {
    "use strict";

    /**
     * This method is called when the QuickView popup for for any of the Conatcts is needed to be shown. This will trigger a
     * batch request to retrive the the conrresponding data for the specific conatct. Next time onwards to it will consider
     * the cached data in the model.
     * 
     * @param {sap.suite.ui.template.lib.CommonUtils} oCommonUtils - The common utils instance providing common functionality
     * @param {sap.ui.base.EventProvider} oSourceControl - Returns the event provider on which the event was fired i.e. when the hyperlink is pressed
     * @param {object} oContactData - Returns the the contact card populating data
     * @private
    */
    
    function fnPopulateDataInContactQuickView(oCommonUtils, oSourceControl, oContactData, aTeamsCollabOptions) {
        var oContactAnnotation = JSON.parse(oSourceControl.data("contactDetails"));
        var sEmail = "", sEnumTypeContactEmail;

        if (oContactAnnotation.email && oContactAnnotation.email[0]) {
            sEnumTypeContactEmail =  (oContactAnnotation.email[0].type) && (oContactAnnotation.email[0].type.EnumMember);
                if (sEnumTypeContactEmail && sEnumTypeContactEmail.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType/work") > -1) {
                    if (oContactAnnotation.email[0].address && oContactAnnotation.email[0].address.Path) {
                        sEmail = oContactData.getProperty(oContactAnnotation.email[0].address.Path);
                    } else {
                        sEmail = (oContactAnnotation.email[0].address && oContactAnnotation.email[0].address.String);
                    }
                }
            }

        var renderContactDetailsFragment = function() {
            oCommonUtils.getDialogFragmentAsync("sap.suite.ui.generic.template.fragments.ContactDetails", {
                formatUri: function (sValue) {
                    var mailregex = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
                    if (mailregex.test(sValue)) {
                        return "mailto:" + sValue;
                    } else {
                        return "tel:" + sValue;
                    }
                },
                onTeamsCollabOptionPress: function(oEvent) {
                    var sType = oEvent.getSource().data("type");
                    var oSelectedOption = aTeamsCollabOptions.find(function(option) {
                        return option.key === sType;
                    });
                    oSelectedOption.callBackHandler.call(this, oEvent);
                },
                afterClose: function(oEvent) {
                    var oPopover = oEvent.getSource();
                    oPopover.close();
                }
            }, "contact").then(function (oContactPopover) {
                var oContactModel = oContactPopover.getModel("contact");
                var sEnumType;

                // initializing the model
                oContactModel.setProperty("/", {});
                oContactModel.setProperty("/device", sap.ui.Device);
                // setting properties for contact model, to bind to the contactDetails fragment
                (oContactAnnotation.fn && oContactAnnotation.fn.Path) ? oContactModel.setProperty("/fn", (oContactData.getProperty(oContactAnnotation.fn.Path))) :
                    oContactModel.setProperty("/fn", (oContactAnnotation.fn && oContactAnnotation.fn.String));

                (oContactAnnotation.title && oContactAnnotation.title.Path) ? oContactModel.setProperty("/title", (oContactData.getProperty(oContactAnnotation.title.Path))) :
                    oContactModel.setProperty("/title", (oContactAnnotation.title && oContactAnnotation.title.String));

                (oContactAnnotation.photo && oContactAnnotation.photo.Path) ? oContactModel.setProperty("/photo", (oContactData.getProperty(oContactAnnotation.photo.Path))) :
                    oContactModel.setProperty("/photo", (oContactAnnotation.photo && oContactAnnotation.photo.String));

                (oContactAnnotation.role && oContactAnnotation.role.Path) ? oContactModel.setProperty("/role", (oContactData.getProperty(oContactAnnotation.role.Path))) :
                    oContactModel.setProperty("/role", (oContactAnnotation.role && oContactAnnotation.role.String));

                (oContactAnnotation.org && oContactAnnotation.org.Path) ? oContactModel.setProperty("/org", (oContactData.getProperty(oContactAnnotation.org && oContactAnnotation.org.Path))) :
                    oContactModel.setProperty("/org", (oContactAnnotation.org && oContactAnnotation.org.String));

                oContactModel.setProperty("/email", sEmail);

                if (oContactAnnotation.adr && oContactAnnotation.adr[0] &&  !oContactModel.getProperty("/adr")) {
                    sEnumType =  oContactAnnotation.adr[0].type && oContactAnnotation.adr[0].type.EnumMember;
                    if (sEnumType && sEnumType.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType") > -1) {
                        var sFormattedAddress = getFormattedAddress(oContactData,oContactAnnotation);
                        oContactModel.setProperty("/adr", sFormattedAddress);
                    }
                }

                var len = (oContactAnnotation.tel && oContactAnnotation.tel.length) || 0;
                for (var i = 0; i < len; i++) {
                    if (oContactAnnotation.tel[i] && !oContactModel.getProperty("/fax")) {
                        sEnumType =  oContactAnnotation.tel[i].type && oContactAnnotation.tel[i].type.EnumMember;
                        if (sEnumType && sEnumType.indexOf("com.sap.vocabularies.Communication.v1.PhoneType/fax") > -1) {
                            if (oContactAnnotation.tel[i].uri && oContactAnnotation.tel[i].uri.Path) {
                                oContactModel.setProperty("/fax", (oContactData.getProperty(oContactAnnotation.tel[i].uri.Path)));
                            } else {
                                oContactModel.setProperty("/fax", (oContactAnnotation.tel[i].uri && oContactAnnotation.tel[i].uri.String));
                            }
                            continue;
                        }
                    }
                    if (oContactAnnotation.tel[i] && !oContactModel.getProperty("/cell")) {
                        sEnumType =  oContactAnnotation.tel[i].type && oContactAnnotation.tel[i].type.EnumMember;
                        if (sEnumType && sEnumType.indexOf("com.sap.vocabularies.Communication.v1.PhoneType/cell") > -1) {
                            if (oContactAnnotation.tel[i].uri && oContactAnnotation.tel[i].uri.Path) {
                                oContactModel.setProperty("/cell", (oContactData.getProperty(oContactAnnotation.tel[i].uri.Path)));
                            } else {
                                oContactModel.setProperty("/cell", (oContactAnnotation.tel[i].uri && oContactAnnotation.tel[i].uri.String));
                            }
                            continue;
                        }
                    }
                    if (oContactAnnotation.tel[i] &&  !oContactModel.getProperty("/work")) {
                        sEnumType =  oContactAnnotation.tel[i].type && oContactAnnotation.tel[i].type.EnumMember;
                        if (sEnumType && sEnumType.indexOf("com.sap.vocabularies.Communication.v1.PhoneType/work") > -1) {
                            if (oContactAnnotation.tel[i].uri && oContactAnnotation.tel[i].uri.Path) {
                                oContactModel.setProperty("/work", (oContactData.getProperty(oContactAnnotation.tel[i].uri.Path)));
                            } else {
                                oContactModel.setProperty("/work", (oContactAnnotation.tel[i].uri && oContactAnnotation.tel[i].uri.String));
                            }
                            continue;
                        }
                    }
                }
                if (aTeamsCollabOptions && aTeamsCollabOptions.length && sEmail) {
                    oContactModel.setProperty("/teamsCollabOptions", aTeamsCollabOptions);
                }
                oContactPopover.openBy(oSourceControl);
            });
        };

        renderContactDetailsFragment.call(this); // To be removed when we consume the Teams Contacts Collaboration Helper

        var skipBelowCode = true;
        if (!skipBelowCode) {	// Below code is to consume Teams Contacts Collaboration. Commenting this code until we get clarity on CA
            ServiceContainer.getServiceAsync().then(function (oTeamsHelper) {
                if (typeof oTeamsHelper.isContactsCollaborationSupported === 'function' && oTeamsHelper.isContactsCollaborationSupported()) {
                    return oTeamsHelper.enableContactsCollaboration(sEmail);
                } else {
                    return Promise.reject();
                }
            })
            .then(function (oPopover) {
                oPopover.openBy(oSourceControl);
            })
            .catch(function (oError) {
                renderContactDetailsFragment.call(this);
            });
        }
    }

    function getFormattedAddress(oContactData, oContactAnnotation) {
        if (oContactAnnotation.adr[0].label && oContactAnnotation.adr[0].label.Path) {
            return oContactData.getProperty(oContactAnnotation.adr[0].label.Path);
        } else if (oContactAnnotation.adr[0].label && oContactAnnotation.adr[0].label.String){
            return oContactAnnotation.adr[0].label.String;
        } else {
            //street, code, locality, region and country
            var sAddress = "";
            if (oContactAnnotation.adr[0].street && oContactAnnotation.adr[0].street.Path) {
                sAddress += oContactData.getProperty(oContactAnnotation.adr[0].street.Path) + ', ';
            } else if (oContactAnnotation.adr[0].street && oContactAnnotation.adr[0].street.String) {
                sAddress += oContactAnnotation.adr[0].street.String + ', ';
            }
            if (oContactAnnotation.adr[0].code && oContactAnnotation.adr[0].code.Path) {
                sAddress += oContactData.getProperty(oContactAnnotation.adr[0].code.Path) + ', ';
            } else if (oContactAnnotation.adr[0].code && oContactAnnotation.adr[0].code.String) {
                sAddress += oContactAnnotation.adr[0].code.String + ', ';
            }
            if (oContactAnnotation.adr[0].locality && oContactAnnotation.adr[0].locality.Path) {
                sAddress += oContactData.getProperty(oContactAnnotation.adr[0].locality.Path) + ', ';
            } else if (oContactAnnotation.adr[0].locality && oContactAnnotation.adr[0].locality.String) {
                sAddress += oContactAnnotation.adr[0].locality.String + ', ';
            }
            if (oContactAnnotation.adr[0].region && oContactAnnotation.adr[0].region.Path) {
                sAddress += oContactData.getProperty(oContactAnnotation.adr[0].region.Path) + ', ';
            } else if (oContactAnnotation.adr[0].region && oContactAnnotation.adr[0].region.String) {
                sAddress += oContactAnnotation.adr[0].region.String + ', ';
            }
            if (oContactAnnotation.adr[0].country && oContactAnnotation.adr[0].country.Path) {
                sAddress += oContactData.getProperty(oContactAnnotation.adr[0].country.Path) + ', ';
            } else if (oContactAnnotation.adr[0].country && oContactAnnotation.adr[0].country.String) {
                sAddress += oContactAnnotation.adr[0].country.String + ', ';
            }
            return sAddress.slice(0,sAddress.length - 2);
        }
    }

    return {
        populateDataInContactQuickView: fnPopulateDataInContactQuickView
    };
});