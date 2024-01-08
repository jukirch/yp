// Erstellen Sie die View
sap.ui.core.mvc.View.create({ id: "mainView", 
                                viewName: "calculator.view.Calculator", 
                                    type: sap.ui.core.mvc.ViewType.XML}).then(function(oView) {
                                        oView.placeAt("calculatorView")            
                                    });
                             