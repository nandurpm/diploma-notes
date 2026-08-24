const MALAYALAM_SCRIPT = /[\u0D00-\u0D7F]/;
const MALAYALAM_REQUEST = /\b(?:reply|answer|respond|explain|write|translate|translation|responding|speak|use)\s+(?:in|to)\s+malayalam\b|\bmalayalam\s+(?:please|reply|answer|explanation|translation)\b|\b(?:in|to)\s+malayalam\b/i;

/**
 * English is the safe default. Malayalam is selected only when the latest
 * user message explicitly requests it or is itself written in Malayalam.
 * Supplied page context and previous messages must never change this choice.
 */
export function resolvePreferredLanguage(bodyOrMessage) {
  const body = bodyOrMessage && typeof bodyOrMessage === "object" ? bodyOrMessage : { message: bodyOrMessage };
  const explicit = String(body.preferredLanguage || "").trim().toLowerCase();
  if (explicit === "ml" || explicit === "malayalam") return "ml";

  const message = String(body.message || "").trim();
  if (MALAYALAM_SCRIPT.test(message) || MALAYALAM_REQUEST.test(message)) return "ml";
  return "en";
}

export function languageInstruction(language) {
  if (language === "ml") {
    return "Preferred language: Malayalam or mixed Malayalam-English because the latest user message explicitly requests Malayalam or is written in Malayalam. Keep essential technical terms readable in English. Do not switch to English unless the user asks for English.";
  }
  return "Preferred language: English. Answer entirely in English. Do not switch to Malayalam or another language because supplied context, saved history, browser language, or source records contain Malayalam. Switch language only when the user explicitly asks for Malayalam.";
}
