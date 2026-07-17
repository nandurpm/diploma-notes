(() => {
  "use strict";

  // Compatibility file retained for older cached pages.
  // Shared navigation, metadata, breadcrumbs and loading states are now owned
  // by their source HTML or dedicated page scripts. Do not add runtime repair
  // logic, delayed DOM rewrites or dynamic stylesheet injection here.
  window.PolySiteConsistency = Object.freeze({
    version: "20260717-architecture-clean1",
    deprecated: true
  });
})();
