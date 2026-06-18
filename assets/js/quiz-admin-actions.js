(() => {
  "use strict";

  const Q = window.PolyQuiz;
  if (!Q) return;

  async function callAdminAction(action, extra = {}) {
    const { data, error } = await Q.state.client.functions.invoke("quiz-admin-actions", {
      body: { action, ...extra },
    });

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

  Q.deleteAccount = async () => {
    const E = Q.elements;
    if (E.deleteConfirm.value !== "DELETE") return;
    if (!window.confirm("Permanently delete this account and every saved result? This cannot be undone.")) return;

    E.deleteAccount.disabled = true;
    Q.message(E.deleteMessage, "Deleting account…");

    try {
      await callAdminAction("account_delete");
      await Q.state.client.auth.signOut().catch(() => {});
      Q.showAuth("Account permanently deleted.");
    } catch (error) {
      Q.message(E.deleteMessage, error.message || "Account could not be deleted.", "error");
      E.deleteAccount.disabled = false;
    }
  };

  Q.adminClearResults = async (userId) => {
    const E = Q.elements;
    if (!window.confirm("Delete every saved quiz result for this user? This cannot be undone.")) return;

    Q.message(E.adminMessage, "Clearing saved quiz results…");

    try {
      const response = await callAdminAction("admin_clear_results", { targetUserId: userId });
      E.adminUserResults.classList.add("hidden");
      E.adminUserResults.innerHTML = "";
      Q.message(
        E.adminMessage,
        `${response.deletedCount ?? 0} saved quiz result${response.deletedCount === 1 ? "" : "s"} cleared.`,
        "success",
      );
      await Q.loadAdminUsers();
      Q.message(E.adminMessage, "Quiz results cleared successfully.", "success");
    } catch (error) {
      Q.message(E.adminMessage, error.message || "Results could not be cleared.", "error");
    }
  };

  Q.adminDeleteUser = async (userId, username) => {
    const E = Q.elements;
    if (!window.confirm(`Permanently delete ${username} and all saved data?`)) return;

    Q.message(E.adminMessage, `Deleting ${username}…`);

    try {
      await callAdminAction("admin_delete_user", { targetUserId: userId });
      E.adminUserResults.classList.add("hidden");
      E.adminUserResults.innerHTML = "";
      Q.message(E.adminMessage, "User permanently deleted.", "success");
      await Q.loadAdminUsers();
    } catch (error) {
      Q.message(E.adminMessage, error.message || "User could not be deleted.", "error");
    }
  };
})();
