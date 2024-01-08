//@ui5-bundle sap/fe/macros/designtime/library-preload.designtime.js
/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.predefine("sap/fe/macros/contact/Contact.designtime", [],function(){"use strict";return{annotations:{contact:{namespace:"com.sap.vocabularies.Communication.v1",annotation:"Contact",target:["EntityType"],since:"1.75"}}}},false);
/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.predefine("sap/fe/macros/filterBar/FilterBar.designtime", [],function(){"use strict";return{annotations:{selectionFields:{namespace:"com.sap.vocabularies.UI.v1",annotation:"SelectionFields",target:["EntityType"],since:"1.75"},searchRestrictions:{namespace:"org.OData.Capabilities.V1",annotation:"SearchRestrictions",target:["EntitySet"],since:"1.75"}}}},false);
/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.predefine("sap/fe/macros/form/Form.designtime", [],function(){"use strict";return{annotations:{CollectionFacet:{namespace:"com.sap.vocabularies.UI.v1",annotation:"CollectionFacet",target:["Property"],since:"1.75"},ReferenceFacet:{namespace:"com.sap.vocabularies.UI.v1",annotation:"ReferenceFacet",target:["Property"],since:"1.75"},hidden:{namespace:"com.sap.vocabularies.UI.v1",annotation:"Hidden",target:["Property"],since:"1.75"}}}},false);
/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.predefine("sap/fe/macros/form/FormContainer.designtime", [],function(){"use strict";return{annotations:{hidden:{namespace:"com.sap.vocabularies.UI.v1",annotation:"Hidden",target:["Property","Record"],since:"1.75"}}}},false);
/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.predefine("sap/fe/macros/internal/Field.designtime", [],function(){"use strict";return{annotations:{hidden:{namespace:"com.sap.vocabularies.UI.v1",annotation:"Hidden",target:["Property","Record"],since:"1.75"},dataField:{namespace:"com.sap.vocabularies.UI.v1",annotation:"DataField",target:["Property"],since:"1.75"},dataFieldWithUrl:{namespace:"com.sap.vocabularies.UI.v1",annotation:"DataFieldWithUrl",target:["Property"],since:"1.75"},dataFieldForAnnotation:{namespace:"com.sap.vocabularies.UI.v1",annotation:"DataFieldForAnnotation",target:["Property"],since:"1.75"},dataFieldForAction:{namespace:"com.sap.vocabularies.UI.v1",annotation:"DataFieldForAction",target:["Property"],since:"1.75"},dataPoint:{namespace:"com.sap.vocabularies.UI.v1",annotation:"DataPoint",target:["Property"],since:"1.75"},dataFieldDefault:{namespace:"com.sap.vocabularies.UI.v1",annotation:"DataFieldDefault",target:["Property"],since:"1.75"},semanticObject:{namespace:"com.sap.vocabularies.Common.v1",annotation:"SemanticObject",target:["EntitySet","EntityType","Property"],since:"1.75"},semanticObjectMapping:{namespace:"com.sap.vocabularies.Common.v1",annotation:"SemanticObjectMapping",target:["EntitySet","EntityType","Property"],defaultValue:null,since:"1.75"},semanticObjectUnavailableActions:{namespace:"com.sap.vocabularies.Common.v1",annotation:"SemanticObjectUnavailableActions",target:["EntitySet","EntityType","Property"],defaultValue:null,since:"1.75"},semanticKey:{namespace:"com.sap.vocabularies.Common.v1",annotation:"SemanticKey",target:["EntityType"],defaultValue:null,since:"1.75"},isImageURL:{namespace:"com.sap.vocabularies.UI.v1",annotation:"IsImageURL",target:["Property"],defaultValue:true,since:"1.75"},fieldControl:{namespace:"com.sap.vocabularies.Common.v1",annotation:"FieldControl",target:["Property","Record"],defaultValue:3,since:"1.75"},currencyCode:{namespace:"Org.OData.Measures.V1",annotation:"ISOCurrency",target:["Property"],defaultValue:null,since:"1.75"},unitOfMeasure:{namespace:"Org.OData.Measures.V1",annotation:"Unit",target:["Property"],defaultValue:null,since:"1.75"},multiLineText:{namespace:"com.sap.vocabularies.UI.v1",annotation:"MultiLineText",target:["Property"],defaultValue:true,since:"1.75"},computed:{namespace:"Org.OData.Core.V1",annotation:"Computed",target:["Property"],defaultValue:true,since:"1.75"},immutable:{namespace:"Org.OData.Core.V1",annotation:"Immutable",target:["Property"],defaultValue:true,since:"1.75"},sideEffects:{namespace:"com.sap.vocabularies.Common.v1",annotation:"SideEffects",target:["EntitySet","EntityType","ComplexType"],defaultValue:null,since:"1.75"},valueList:{namespace:"com.sap.vocabularies.Common.v1",annotation:"ValueList",target:["Property","Parameter"],defaultValue:null,since:"1.75"},valueListReferences:{namespace:"com.sap.vocabularies.Common.v1",annotation:"ValueListReferences",target:["Property","Parameter"],defaultValue:null,since:"1.75"},valueListMapping:{namespace:"com.sap.vocabularies.Common.v1",annotation:"ValueListMapping",target:["Property","Parameter"],defaultValue:null,since:"1.75"},isEmailAddress:{namespace:"com.sap.vocabularies.Communication.v1",annotation:"IsEmailAddress",target:["Property"],defaultValue:true,since:"1.75"},isPhoneNumber:{namespace:"com.sap.vocabularies.Communication.v1",annotation:"IsPhoneNumber",target:["Property"],defaultValue:true,since:"1.75"}}}},false);
/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.predefine("sap/fe/macros/internal/FilterField.designtime", [],function(){"use strict";return{annotations:{filterRestrictions:{namespace:"Org.OData.Capabilities.V1",annotation:"FilterRestrictions",target:["EntitySet"],since:"1.75"},hidden:{namespace:"com.sap.vocabularies.UI.v1",annotation:"Hidden",target:["Property","Record"],since:"1.75"},hiddenFilter:{namespace:"com.sap.vocabularies.UI.v1",annotation:"HiddenFilter",target:["Property"],since:"1.75"},label:{namespace:"com.sap.vocabularies.Common.v1",annotation:"Label",target:["Property"],since:"1.75"},text:{namespace:"com.sap.vocabularies.Common.v1",annotation:"Text",target:["Property"],since:"1.75"},textArrangement:{namespace:"com.sap.vocabularies.UI.v1",annotation:"TextArrangement",target:["Annotation","EntityType"],since:"1.75"},iSOCurrency:{namespace:"Org.OData.Measures.V1",annotation:"ISOCurrency",target:["Property"],since:"1.75"},unit:{namespace:"Org.OData.Measures.V1",annotation:"Unit",target:["Property"],since:"1.75"},valueList:{namespace:"com.sap.vocabularies.Common.v1",annotation:"ValueList",target:["Property","Parameter"],since:"1.75"},valueListMapping:{namespace:"com.sap.vocabularies.Common.v1",annotation:"ValueListMapping",target:["Property","Parameter"],since:"1.75"},valueListReferences:{namespace:"com.sap.vocabularies.Common.v1",annotation:"ValueListReferences",target:["Property","Parameter"],since:"1.75"}}}},false);
/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.predefine("sap/fe/macros/internal/valuehelp/ValueHelp.designtime", [],function(){"use strict";return{annotations:{valueList:{namespace:"com.sap.vocabularies.Common.v1",annotation:"ValueList",target:["Property","Parameter"],since:"1.75"},valueListMapping:{namespace:"com.sap.vocabularies.Common.v1",annotation:"ValueListMapping",target:["Property","Parameter"],since:"1.75"},valueListReferences:{namespace:"com.sap.vocabularies.Common.v1",annotation:"ValueListReferences",target:["Property","Parameter"],since:"1.75"},valueListParameterDisplayOnly:{namespace:"com.sap.vocabularies.Common.v1",annotation:"ValueListParameterDisplayOnly",target:["PropertyPath"],since:"1.75"},valueListParameterIn:{namespace:"com.sap.vocabularies.Common.v1",annotation:"ValueListParameterIn",target:["PropertyPath"],since:"1.75"},valueListParameterInOut:{namespace:"com.sap.vocabularies.Common.v1",annotation:"ValueListParameterInOut",target:["PropertyPath"],since:"1.75"},valueListParameterOut:{namespace:"com.sap.vocabularies.Common.v1",annotation:"ValueListParameterOut",target:["PropertyPath"],since:"1.75"},valueListWithFixedValues:{namespace:"com.sap.vocabularies.Common.v1",annotation:"ValueListWithFixedValues",target:["Property","Parameter"],since:"1.75"},importance:{namespace:"com.sap.vocabularies.UI.v1",annotation:"Importance",target:["Annotation","Record"],since:"1.75"},searchRestrictions:{namespace:"Org.OData.Capabilities.V1",annotation:"SearchRestrictions",target:["EntitySet"],since:"1.75"},hidden:{namespace:"com.sap.vocabularies.UI.v1",annotation:"Hidden",target:["Property","Record"],since:"1.75"},hiddenFilter:{namespace:"com.sap.vocabularies.UI.v1",annotation:"HiddenFilter",target:["Property"],since:"1.75"},label:{namespace:"com.sap.vocabularies.Common.v1",annotation:"Label",target:["Property"],since:"1.75"},text:{namespace:"com.sap.vocabularies.Common.v1",annotation:"Text",target:["Property"],since:"1.75"},iSOCurrency:{namespace:"Org.OData.Measures.V1",annotation:"ISOCurrency",target:["Property"],since:"1.75"},unit:{namespace:"Org.OData.Measures.V1",annotation:"Unit",target:["Property"],since:"1.75"}}}},false);
/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.predefine("sap/fe/macros/quickView/QuickView.designtime", [],function(){"use strict";return{annotations:{headerInfo:{namespace:"com.sap.vocabularies.UI.v1.HeaderInfo",annotation:"HeaderInfo",target:["EntityType"],since:"1.75"},quickViewFacets:{namespace:"com.sap.vocabularies.UI.v1.QuickViewFacets",annotation:"QuickViewFacets",target:["EntityType"],since:"1.75"},isNaturalPerson:{namespace:"com.sap.vocabularies.Common.v1.IsNaturalPerson",annotation:"IsNaturalPerson",target:["EntityType"],since:"1.75"},semanticObject:{namespace:"com.sap.vocabularies.Common.v1",annotation:"SemanticObject",target:["EntitySet","EntityType","Property"],since:"1.75"},semanticObjectMapping:{namespace:"com.sap.vocabularies.Common.v1",annotation:"SemanticObjectMapping",target:["EntitySet","EntityType","Property"],defaultValue:null,since:"1.75"},semanticObjectUnavailableActions:{namespace:"com.sap.vocabularies.Common.v1",annotation:"SemanticObjectUnavailableActions",target:["EntitySet","EntityType","Property"],defaultValue:null,since:"1.75"}}}},false);
//# sourceMappingURL=library-preload.designtime.js.map
