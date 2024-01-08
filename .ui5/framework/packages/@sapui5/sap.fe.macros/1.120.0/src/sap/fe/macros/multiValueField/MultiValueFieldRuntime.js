/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["../field/FieldRuntime"],function(e){"use strict";const n={handleChange:function(n,t){const i=t.getSource(),o=i.getBindingContext().isTransient(),s=t.getParameter("promise")||Promise.resolve();const r=e._getExtensionController(n);r.editFlow.syncTask(s);if(o){return}r._sideEffects.prepareSideEffectsForField(t,true,s)},onValidateFieldGroup:async function(n,t){const i=e._getExtensionController(n);await i._sideEffects.handleFieldGroupChange(t)}};return n},false);
//# sourceMappingURL=MultiValueFieldRuntime.js.map