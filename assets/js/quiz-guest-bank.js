(() => {
  "use strict";
  const parts = ["01","02","03","04","05","06"].map((part) => `/assets/js/quiz-guest-bank-parts/part-${part}.txt?v=20260618-v2`);
  window.QuizGuestBankReady = Promise.all(parts.map(async (url) => {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Unable to load guest question bank: ${url}`);
    return response.text();
  })).then((sourceParts) => new Promise((resolve, reject) => {
    const blobUrl = URL.createObjectURL(new Blob([sourceParts.join("")], { type: "text/javascript" }));
    const script = document.createElement("script");
    script.src = blobUrl;
    script.onload = () => { URL.revokeObjectURL(blobUrl); resolve(window.QuizGuestBank); };
    script.onerror = () => { URL.revokeObjectURL(blobUrl); reject(new Error("Guest question bank could not start.")); };
    document.head.append(script);
  }));
})();
