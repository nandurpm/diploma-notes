globalThis.POLY_ASSET_MANIFEST = Object.freeze({
  lessonCodes: Object.freeze(["1001","1002","1003","1004","1005","1006","1007","1008","2001","2002","2003","2031","2032","2038","2039","2041","2049","3023","3031","3032","3041","3042","3043","3044","3045","3046","3047","3048","3049","3132","4001","4031","4041","4042","4043","5041","5042","5043","6002","6041","6041A","6041B","6042A","6042B","6042C","6042D"]),
  notesCodes: Object.freeze(["1001","1002","1003","1004","1005","1006","1008","2001","2002","2003","2031","2032","2038","2041","3023","3031","3032","3041","3043","3044","3045","3046","3047","3132","4001","6002"])
});

(() => {
  const scripts = [
    '/assets/js/ask-poly-config.js',
    '/assets/js/ask-poly-remote.js',
    '/assets/js/ask-poly-general-ai-extension.js'
  ];
  const load = (src) => new Promise((resolve) => {
    if ([...document.scripts].some((script) => new URL(script.src || '', window.location.href).pathname === src)) { resolve(); return; }
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', resolve, { once: true });
    document.head.append(script);
  });
  (async () => { for (const src of scripts) await load(src); })();
})();
