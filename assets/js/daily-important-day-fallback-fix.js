/* Purpose: Daily important day fallback fix - Descriptive comment added for clarity */
(() => {
  "use strict";

  const quotes = [
    ["Start with one clear step.", "One useful action today is better than a big plan left untouched.\nഇന്ന് ചെയ്യുന്ന ഒരു ചെറിയ നല്ല പ്രവൃത്തി, ചെയ്യാതെ കിടക്കുന്ന വലിയ പദ്ധതിയേക്കാൾ മികച്ചതാണ്."],
    ["Keep moving forward.", "Small progress done honestly every day becomes strong progress over time.\nദിവസവും സത്യസന്ധമായി ചെയ്യുന്ന ചെറിയ മുന്നേറ്റങ്ങൾ കാലക്രമേണ വലിയ ശക്തിയാകും."],
    ["Learn something useful today.", "A new skill learned today can solve tomorrow's problem.\nഇന്ന് പഠിക്കുന്ന ഒരു പുതിയ കഴിവ് നാളത്തെ പ്രശ്നം പരിഹരിക്കാൻ സഹായിക്കും."],
    ["Do the important work first.", "Finish the task that matters most before the day becomes crowded.\nദിവസം തിരക്കാകുന്നതിന് മുമ്പ് ഏറ്റവും പ്രധാനപ്പെട്ട ജോലി പൂർത്തിയാക്കുക."],
    ["Build discipline, not pressure.", "Consistency makes study and work easier than last-minute stress.\nഅവസാന നിമിഷ സമ്മർദ്ദത്തേക്കാൾ സ്ഥിരതയാണ് പഠനവും ജോലിയും എളുപ്പമാക്കുന്നത്."],
    ["Check, correct, improve.", "Good work is not magic; it is checking mistakes and correcting them.\nനല്ല ജോലി മായാജാലമല്ല; തെറ്റുകൾ പരിശോധിച്ച് തിരുത്തുന്നതാണ്."],
    ["Use today properly.", "Time will pass anyway. Use it for something that improves your future.\nസമയം എങ്ങനെയും കടന്നുപോകും; അത് നിങ്ങളുടെ ഭാവി മെച്ചപ്പെടുത്താൻ ഉപയോഗിക്കുക."],
    ["Focus on the next task.", "Do not fight the whole mountain. Finish the next step.\nമുഴുവൻ മല കയറാൻ ഇപ്പോൾ ചിന്തിക്കേണ്ട; അടുത്ത പടി പൂർത്തിയാക്കുക."],
    ["Make your work cleaner.", "Neat work saves time, reduces rework and shows professionalism.\nവൃത്തിയായ ജോലി സമയം ലാഭിക്കും, വീണ്ടും ജോലി ചെയ്യുന്നത് കുറയ്ക്കും, പ്രൊഫഷണലിസം കാണിക്കും."],
    ["One correction can change the result.", "Find one weak point today and fix it properly.\nഇന്ന് ഒരു ദുർബല ഭാഗം കണ്ടെത്തി ശരിയായി തിരുത്തുക."],
    ["Be steady, not random.", "Daily discipline beats occasional hard work.\nഅവസരപ്പോഴുള്ള കഠിനാധ്വാനത്തേക്കാൾ ദിവസേനയുള്ള ശിസ്തമാണ് മികച്ചത്."],
    ["Make today count.", "A little progress every day builds a better future.\nഓരോ ദിവസത്തെയും ചെറിയ മുന്നേറ്റങ്ങൾ വലിയ വിജയത്തിലേക്ക് നയിക്കുന്നു."],
    ["Think clearly before acting.", "Clear thinking prevents wrong work and wasted effort.\nവ്യക്തമായി ചിന്തിക്കുന്നത് തെറ്റായ ജോലിയും വെറുതെയുള്ള പരിശ്രമവും ഒഴിവാക്കും."],
    ["Finish one pending thing.", "Closing one pending task gives more confidence than starting five new ones.\nപുതിയ അഞ്ച് കാര്യങ്ങൾ തുടങ്ങുന്നതിനെക്കാൾ ഒരു ബാക്കി ജോലി തീർക്കുന്നത് കൂടുതൽ ആത്മവിശ്വാസം നൽകും."]
  ];

  // PERFORMANCE OPTIMIZATION: Pre-compile and cache the DateTimeFormat instance in module-scoped variable
  // to avoid reconstructing the object repeatedly inside scheduling/observing loops.
  let cachedFormatter = null;

  function indiaDateKey(date = new Date()) {
    if (window.PolyUtils && typeof window.PolyUtils.formatDateKey === "function") {
      return window.PolyUtils.formatDateKey(date);
    }
    if (window.DiplomaImportantDays && typeof window.DiplomaImportantDays.getIndiaDateKey === "function") {
      return window.DiplomaImportantDays.getIndiaDateKey(date);
    }
    if (!cachedFormatter) {
      cachedFormatter = new Intl.DateTimeFormat("en", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
    }
    const parts = cachedFormatter.formatToParts(date).reduce((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function indexFor(dateKey) {
    let total = 0;
    String(dateKey).split("").forEach((char) => { total = (total * 31 + char.charCodeAt(0)) >>> 0; });
    return total % quotes.length;
  }

  function applyFallbackVariation() {
    const card = document.querySelector("[data-important-card]");
    if (!card) return;
    const title = card.querySelector("[data-important-title]");
    const message = card.querySelector("[data-important-message]");
    const date = card.querySelector("[data-important-date]");
    if (!title || !message || !date) return;

    const titleText = (title.textContent || "").trim();
    const messageText = (message.textContent || "").trim();
    const isDefaultFallback = /^Make today count\.?$/i.test(titleText) || /A little progress every day builds a better future/i.test(messageText);
    const isRealEvent = titleText && !isDefaultFallback && !/Loading today/i.test(titleText);
    if (isRealEvent) return;

    const dateKey = date.getAttribute("datetime") || indiaDateKey();
    const [newTitle, newMessage] = quotes[indexFor(dateKey)];
    title.textContent = newTitle;
    title.lang = "en";
    message.textContent = newMessage;
    message.lang = "ml";
    message.hidden = false;
  }

  let timer = 0;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(applyFallbackVariation, 180);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule, { once: true });
  else schedule();
  setTimeout(applyFallbackVariation, 700);
  setTimeout(applyFallbackVariation, 1500);
  const card = document.querySelector("[data-important-card]");
  if (card) new MutationObserver(schedule).observe(card, { childList: true, subtree: true, characterData: true });
})();
