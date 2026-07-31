/* Purpose: Quiz portal - Descriptive comment added for clarity */
(() => {
  "use strict";
  const parts = ["01","02","03","04","05"].map((part) => `/assets/js/quiz-portal-parts/part-${part}.txt?v=20260618-v2`);
  window.QuizPortalReady = Promise.all(parts.map(async (url) => {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Unable to load quiz module: ${url}`);
    return response.text();
  })).then((sourceParts) => new Promise((resolve, reject) => {
    const blobUrl = URL.createObjectURL(new Blob([sourceParts.join("")], { type: "text/javascript" }));
    const script = document.createElement("script");
    script.src = blobUrl;
    script.onload = () => { URL.revokeObjectURL(blobUrl); resolve(); };
    script.onerror = () => { URL.revokeObjectURL(blobUrl); reject(new Error("Quiz application could not start.")); };
    document.head.append(script);
  })).catch((error) => {
    console.error(error);
    const warning = document.getElementById("serviceWarning");
    if (warning) { warning.textContent = error.message; warning.classList.remove("hidden"); }
  });
})();
