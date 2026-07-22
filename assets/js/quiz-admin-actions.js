/* Purpose: Quiz admin actions - Descriptive comment added for clarity */
(() => {
  "use strict";

  const Q = window.PolyQuiz;
  if (!Q) return;

  const portalUpgrade = document.createElement("script");
  portalUpgrade.src = "/assets/js/mock-exam-portal-upgrade.js?v=20260620-nospace1";
  portalUpgrade.async = false;
  document.head.append(portalUpgrade);

  async function clearSavedResults(targetUserId) {
    const { data, error } = await Q.state.client.functions.invoke(
      "quiz-admin-clear-results",
      { body: { targetUserId } },
    );

    if (error) {
      let message = error.message || "Request failed.";
      try {
        message = (await error.context.json()).error || message;
      } catch {
        // Keep the Supabase client error when the response is not JSON.
      }
      throw new Error(message);
    }

    if (data?.error) throw new Error(data.error);
    return data;
  }

  Q.adminClearResults = async (userId) => {
    const E = Q.elements;
    if (!window.confirm("Delete every saved quiz result for this user? This cannot be undone.")) return;

    Q.message(E.adminMessage, "Clearing saved quiz results…");

    try {
      const result = await clearSavedResults(userId);
      E.adminUserResults.classList.add("hidden");
      E.adminUserResults.innerHTML = "";
      await Q.loadAdminUsers();
      Q.message(
        E.adminMessage,
        `${result.deletedCount ?? 0} saved quiz result${result.deletedCount === 1 ? "" : "s"} cleared successfully.`,
        "success",
      );
    } catch (error) {
      Q.message(E.adminMessage, error.message || "Results could not be cleared.", "error");
    }
  };
})();
