/* Purpose: Quiz account admin - Descriptive comment added for clarity */
(() => {
  "use strict";
  const Q = window.PolyQuiz;

  Q.openAccount = () => {
    const E = Q.elements;
    Q.showView("accountView");
    const guest = Q.state.mode === "guest";
    E.accountGuestOnly.classList.toggle("hidden", !guest);
    E.accountControls.classList.toggle("hidden", guest);
    if (!guest) {
      E.newUsername.value = Q.state.profile?.username || "";
      E.deleteConfirm.value = "";
      E.deleteAccount.disabled = true;
      [E.usernameMessage, E.passwordMessage, E.deleteMessage].forEach((element) => Q.message(element, ""));
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  Q.saveUsername = async (event) => {
    event.preventDefault();
    const username = Q.elements.newUsername.value.trim();
    if (!/^[A-Za-z0-9_.-]{3,30}$/.test(username)) {
      Q.message(Q.elements.usernameMessage, "Use 3–30 letters, numbers, dot, underscore or hyphen.", "error");
      return;
    }
    try {
      const result = await Q.callApi("account_update", { username });
      Q.state.profile.username = result.username;
      if (Q.state.dashboard?.profile) Q.state.dashboard.profile.username = result.username;
      Q.elements.welcomeTitle.textContent = `Welcome, ${result.username}`;
      Q.message(Q.elements.usernameMessage, "Username updated.", "success");
    } catch (error) {
      Q.message(Q.elements.usernameMessage, error.message || "Username could not be updated.", "error");
    }
  };

  Q.changePassword = async (event) => {
    event.preventDefault();
    const E = Q.elements;
    if (E.newPassword.value !== E.newPasswordConfirm.value) {
      Q.message(E.passwordMessage, "Password and confirmation do not match.", "error");
      return;
    }
    try {
      const { error } = await Q.state.client.auth.updateUser({ password: E.newPassword.value });
      if (error) throw error;
      E.passwordForm.reset();
      Q.message(E.passwordMessage, "Password changed successfully.", "success");
    } catch (error) {
      Q.message(E.passwordMessage, error.message || "Password could not be changed.", "error");
    }
  };

  Q.deleteAccount = async () => {
    const E = Q.elements;
    if (E.deleteConfirm.value !== "DELETE") return;
    if (!window.confirm("Permanently delete this account and every saved result? This cannot be undone.")) return;
    E.deleteAccount.disabled = true;
    try {
      await Q.callApi("account_delete");
      await Q.state.client.auth.signOut().catch(() => {});
      Q.showAuth("Account permanently deleted.");
    } catch (error) {
      Q.message(E.deleteMessage, error.message || "Account could not be deleted.", "error");
      E.deleteAccount.disabled = false;
    }
  };

  Q.openAdmin = async () => {
    if (Q.state.profile?.role !== "admin") return;
    Q.showView("adminView");
    window.scrollTo({ top: 0, behavior: "smooth" });
    await Q.loadAdminUsers();
  };

  Q.loadAdminUsers = async () => {
    const E = Q.elements;
    E.adminUsers.innerHTML = '<div class="empty-state">Loading users…</div>';
    E.adminUserResults.classList.add("hidden");
    Q.message(E.adminMessage, "");
    try {
      const data = await Q.callApi("admin_users");
      const summary = [
        ["Registered Users", data.summary.totalUsers],
        ["Administrators", data.summary.adminUsers],
        ["Saved Quizzes", data.summary.totalResults],
        ["Average Score", `${data.summary.averagePercent}%`],
      ];
      E.adminSummary.innerHTML = summary.map(([label, value]) =>
        `<article class="summary-card"><span>${Q.escape(label)}</span><b>${Q.escape(value)}</b></article>`
      ).join("");

      E.adminUsers.innerHTML = `<table class="data-table">
        <thead><tr><th>User</th><th>Role</th><th>Quizzes</th><th>Average</th><th>Last Sign-in</th><th>Control</th></tr></thead>
        <tbody>${data.users.map((user) => `<tr>
          <td><b>${Q.escape(user.username)}</b><br><small>${Q.escape(user.email)}</small></td>
          <td>${Q.escape(user.role)}</td><td>${Q.escape(user.quizCount)}</td>
          <td>${Q.escape(user.averagePercent)}%</td><td>${Q.escape(user.lastSignIn || "Never")}</td>
          <td><div class="admin-actions">
            <button class="btn soft admin-results" data-user="${Q.escape(user.id)}" type="button">Results</button>
            <button class="btn soft admin-edit" data-user="${Q.escape(user.id)}" data-name="${Q.escape(user.username)}" type="button">Edit</button>
            <button class="btn soft admin-role" data-user="${Q.escape(user.id)}" data-role="${Q.escape(user.role)}" type="button">Role</button>
            <button class="btn warning admin-clear" data-user="${Q.escape(user.id)}" type="button">Clear Results</button>
            <button class="btn danger admin-delete" data-user="${Q.escape(user.id)}" data-name="${Q.escape(user.username)}" type="button">Delete</button>
          </div></td></tr>`).join("")}</tbody></table>`;
      Q.bindAdminActions();
    } catch (error) {
      E.adminUsers.innerHTML = `<div class="empty-state">${Q.escape(error.message || "Users could not be loaded.")}</div>`;
    }
  };

  Q.bindAdminActions = () => {
    const root = Q.elements.adminUsers;
    root.querySelectorAll(".admin-results").forEach((button) =>
      button.addEventListener("click", () => Q.viewAdminResults(button.dataset.user)));
    root.querySelectorAll(".admin-edit").forEach((button) =>
      button.addEventListener("click", () => Q.adminEditUsername(button.dataset.user, button.dataset.name)));
    root.querySelectorAll(".admin-role").forEach((button) =>
      button.addEventListener("click", () => Q.adminChangeRole(button.dataset.user, button.dataset.role)));
    root.querySelectorAll(".admin-clear").forEach((button) =>
      button.addEventListener("click", () => Q.adminClearResults(button.dataset.user)));
    root.querySelectorAll(".admin-delete").forEach((button) =>
      button.addEventListener("click", () => Q.adminDeleteUser(button.dataset.user, button.dataset.name)));
  };

  Q.viewAdminResults = async (userId) => {
    const E = Q.elements;
    try {
      const data = await Q.callApi("admin_user_results", { targetUserId: userId });
      E.adminUserResults.classList.remove("hidden");
      E.adminUserResults.innerHTML = `<h3>${Q.escape(data.user.username)} · Results</h3>${data.results.length ? `
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Subject</th><th>Best</th><th>Attempts</th></tr></thead>
        <tbody>${data.results.map((result) => `<tr><td>${Q.escape(result.date)}</td><td>${Q.escape(result.subjectTitle)}</td><td>${Q.escape(result.bestScore)}/${Q.escape(result.totalQuestions)}</td><td>${Q.escape(result.attemptCount)}</td></tr>`).join("")}</tbody></table></div>` : '<p>No saved results.</p>'}`;
      E.adminUserResults.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (error) {
      Q.message(E.adminMessage, error.message || "Results could not be loaded.", "error");
    }
  };

  Q.adminEditUsername = async (userId, currentName) => {
    const username = window.prompt("Enter the new username:", currentName);
    if (username === null) return;
    try {
      await Q.callApi("admin_update_user", { targetUserId: userId, username: username.trim() });
      Q.message(Q.elements.adminMessage, "Username updated.", "success");
      await Q.loadAdminUsers();
    } catch (error) { Q.message(Q.elements.adminMessage, error.message || "Username could not be updated.", "error"); }
  };

  Q.adminChangeRole = async (userId, currentRole) => {
    const role = window.prompt("Enter role: student or admin", currentRole);
    if (role === null) return;
    try {
      await Q.callApi("admin_update_user", { targetUserId: userId, role: role.trim().toLowerCase() });
      Q.message(Q.elements.adminMessage, "Role updated.", "success");
      await Q.loadAdminUsers();
    } catch (error) { Q.message(Q.elements.adminMessage, error.message || "Role could not be updated.", "error"); }
  };

  Q.adminClearResults = async (userId) => {
    if (!window.confirm("Delete every saved quiz result for this user?")) return;
    try {
      await Q.callApi("admin_clear_results", { targetUserId: userId });
      Q.message(Q.elements.adminMessage, "Quiz results cleared.", "success");
      await Q.loadAdminUsers();
    } catch (error) { Q.message(Q.elements.adminMessage, error.message || "Results could not be cleared.", "error"); }
  };

  Q.adminDeleteUser = async (userId, username) => {
    if (!window.confirm(`Permanently delete ${username} and all saved data?`)) return;
    try {
      await Q.callApi("admin_delete_user", { targetUserId: userId });
      Q.message(Q.elements.adminMessage, "User permanently deleted.", "success");
      await Q.loadAdminUsers();
    } catch (error) { Q.message(Q.elements.adminMessage, error.message || "User could not be deleted.", "error"); }
  };
})();
