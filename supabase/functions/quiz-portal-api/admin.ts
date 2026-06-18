import {
  QUESTIONS_PER_DAY,
  attemptCount,
  sanitizeUsername,
} from "./shared.ts";
import { SUBJECTS } from "./quiz.ts";

function scorePercent(row) {
  return Math.round(
    (Number(row.best_score ?? 0) /
      Number(row.total_questions || QUESTIONS_PER_DAY)) * 100,
  );
}

export async function requireAdmin(admin, userId) {
  const { data, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (error) throw error;
  if (data.role !== "admin") {
    const denied = new Error("Administrator access is required.");
    denied.status = 403;
    throw denied;
  }
}

async function audit(admin, actorId, targetId, action, details = {}) {
  const { error } = await admin.from("admin_audit_log").insert({
    admin_user_id: actorId,
    target_user_id: targetId || null,
    action,
    details,
  });
  if (error) console.error("admin_audit_failed", action, error);
}

export async function updateUsername(admin, userId, value) {
  const username = sanitizeUsername(value);
  if (!username) {
    const invalid = new Error(
      "Use 3–30 letters, numbers, dot, underscore or hyphen.",
    );
    invalid.status = 400;
    throw invalid;
  }

  const { data, error } = await admin
    .from("profiles")
    .update({ username, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("username")
    .single();

  if (error) {
    if (error.code === "23505") {
      const conflict = new Error("That username is already in use.");
      conflict.status = 409;
      throw conflict;
    }
    throw error;
  }

  const authUser = await admin.auth.admin.getUserById(userId);
  if (!authUser.error && authUser.data?.user) {
    const metadata = authUser.data.user.user_metadata ?? {};
    const authUpdate = await admin.auth.admin.updateUserById(userId, {
      user_metadata: { ...metadata, username },
    });
    if (authUpdate.error) {
      console.error("auth_username_sync_failed", userId, authUpdate.error);
    }
  }

  return { username: data.username };
}

async function listAllAuthUsers(admin) {
  const users = [];
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    const current = data?.users ?? [];
    users.push(...current);
    if (current.length < 1000) break;
  }
  return users;
}

export async function adminUsers(admin, userId) {
  await requireAdmin(admin, userId);

  const [authUsers, profiles, results] = await Promise.all([
    listAllAuthUsers(admin),
    admin.from("profiles").select("id,username,role"),
    admin
      .from("daily_quiz_results")
      .select("user_id,best_score,total_questions"),
  ]);

  if (profiles.error) throw profiles.error;
  if (results.error) throw results.error;

  const profileMap = new Map(
    (profiles.data ?? []).map((profile) => [profile.id, profile]),
  );
  const resultMap = new Map();

  for (const row of results.data ?? []) {
    const list = resultMap.get(row.user_id) ?? [];
    list.push(row);
    resultMap.set(row.user_id, list);
  }

  const users = authUsers.map((user) => {
    const profile = profileMap.get(user.id) ?? {
      username: sanitizeUsername(
        user.user_metadata?.username,
        user.email?.split("@")[0] ?? "student",
      ),
      role: "student",
    };
    const userResults = resultMap.get(user.id) ?? [];
    const averagePercent = userResults.length
      ? Math.round(
          userResults.reduce(
            (sum, result) => sum + scorePercent(result),
            0,
          ) / userResults.length,
        )
      : 0;

    return {
      id: user.id,
      email: user.email ?? "",
      username: profile.username,
      role: profile.role,
      quizCount: userResults.length,
      averagePercent,
      lastSignIn: user.last_sign_in_at ?? null,
      createdAt: user.created_at ?? null,
    };
  });

  const allResults = results.data ?? [];
  return {
    summary: {
      totalUsers: users.length,
      adminUsers: users.filter((user) => user.role === "admin").length,
      totalResults: allResults.length,
      averagePercent: allResults.length
        ? Math.round(
            allResults.reduce(
              (sum, result) => sum + scorePercent(result),
              0,
            ) / allResults.length,
          )
        : 0,
    },
    users,
  };
}

export async function adminUserResults(admin, userId, targetUserId) {
  await requireAdmin(admin, userId);
  if (!targetUserId) {
    const invalid = new Error("Target user is required.");
    invalid.status = 400;
    throw invalid;
  }

  const [profile, results] = await Promise.all([
    admin
      .from("profiles")
      .select("id,username,role")
      .eq("id", targetUserId)
      .single(),
    admin
      .from("daily_quiz_results")
      .select("*")
      .eq("user_id", targetUserId)
      .order("quiz_date", { ascending: false }),
  ]);

  if (profile.error) throw profile.error;
  if (results.error) throw results.error;

  return {
    user: profile.data,
    results: (results.data ?? []).map((row) => ({
      date: row.quiz_date,
      subjectCode: row.subject_code,
      subjectTitle: SUBJECTS[row.subject_code]?.title ?? row.subject_code,
      bestScore: Number(row.best_score ?? 0),
      totalQuestions: Number(row.total_questions ?? QUESTIONS_PER_DAY),
      attemptCount: attemptCount(row),
    })),
  };
}

export async function adminUpdateUser(
  admin,
  userId,
  targetUserId,
  usernameValue,
  roleValue,
) {
  await requireAdmin(admin, userId);
  if (!targetUserId) {
    const invalid = new Error("Target user is required.");
    invalid.status = 400;
    throw invalid;
  }

  const previous = await admin
    .from("profiles")
    .select("username,role")
    .eq("id", targetUserId)
    .single();
  if (previous.error) throw previous.error;

  const updates = { updated_at: new Date().toISOString() };

  if (usernameValue !== undefined) {
    const username = sanitizeUsername(usernameValue);
    if (!username) {
      const invalid = new Error("The supplied username is invalid.");
      invalid.status = 400;
      throw invalid;
    }
    updates.username = username;
  }

  if (roleValue !== undefined) {
    const role = String(roleValue).trim().toLowerCase();
    if (!["student", "admin"].includes(role)) {
      const invalid = new Error("Role must be student or admin.");
      invalid.status = 400;
      throw invalid;
    }
    if (targetUserId === userId && role !== "admin") {
      const conflict = new Error(
        "You cannot remove your own administrator role.",
      );
      conflict.status = 409;
      throw conflict;
    }

    if (role === "student") {
      if (previous.data.role === "admin") {
        const countResult = await admin
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "admin");
        if (countResult.error) throw countResult.error;
        if (Number(countResult.count ?? 0) <= 1) {
          const conflict = new Error(
            "At least one administrator account must remain.",
          );
          conflict.status = 409;
          throw conflict;
        }
      }
    }
    updates.role = role;
  }

  if (Object.keys(updates).length === 1) {
    const invalid = new Error("No changes were supplied.");
    invalid.status = 400;
    throw invalid;
  }

  const { data, error } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", targetUserId)
    .select("id,username,role")
    .single();

  if (error) {
    if (error.code === "23505") {
      const conflict = new Error("That username is already in use.");
      conflict.status = 409;
      throw conflict;
    }
    throw error;
  }

  if (updates.username) {
    const authUser = await admin.auth.admin.getUserById(targetUserId);
    if (!authUser.error && authUser.data?.user) {
      const metadata = authUser.data.user.user_metadata ?? {};
      const authUpdate = await admin.auth.admin.updateUserById(targetUserId, {
        user_metadata: { ...metadata, username: updates.username },
      });
      if (authUpdate.error) {
        console.error("admin_auth_username_sync_failed", targetUserId, authUpdate.error);
      }
    }
  }

  await audit(admin, userId, targetUserId, "admin_update_user", {
    before: previous.data,
    after: data,
  });

  return { user: data };
}

export async function adminClearResults(admin, userId, targetUserId, reasonValue) {
  await requireAdmin(admin, userId);
  if (!targetUserId) {
    const invalid = new Error("Target user is required.");
    invalid.status = 400;
    throw invalid;
  }

  const reason = String(reasonValue || "").trim().slice(0, 300);
  if (reason.length < 5) {
    const invalid = new Error("A short audit reason is required.");
    invalid.status = 400;
    throw invalid;
  }

  const { data, error } = await admin
    .from("daily_quiz_results")
    .delete()
    .eq("user_id", targetUserId)
    .select("id");
  if (error) throw error;

  await audit(admin, userId, targetUserId, "admin_clear_results", {
    reason,
    deletedCount: data?.length ?? 0,
  });
  return { success: true, deletedCount: data?.length ?? 0 };
}

async function cleanupPublicUserRows(admin, targetUserId) {
  const operations = [
    admin.from("daily_quiz_results").delete().eq("user_id", targetUserId),
    admin.from("sample_paper_attempts").delete().eq("user_id", targetUserId),
    admin.from("profiles").delete().eq("id", targetUserId),
  ];
  const results = await Promise.all(operations);
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}

export async function deleteOwnAccount(admin, userId) {
  const authDelete = await admin.auth.admin.deleteUser(userId, false);
  if (authDelete.error) throw authDelete.error;
  await cleanupPublicUserRows(admin, userId);
  return { success: true };
}

export async function adminDeleteUser(admin, userId, targetUserId, reasonValue) {
  await requireAdmin(admin, userId);
  if (!targetUserId) {
    const invalid = new Error("Target user is required.");
    invalid.status = 400;
    throw invalid;
  }
  if (targetUserId === userId) {
    const conflict = new Error("You cannot delete the account currently in use.");
    conflict.status = 409;
    throw conflict;
  }

  const reason = String(reasonValue || "").trim().slice(0, 300);
  if (reason.length < 5) {
    const invalid = new Error("A short audit reason is required.");
    invalid.status = 400;
    throw invalid;
  }

  const target = await admin
    .from("profiles")
    .select("role")
    .eq("id", targetUserId)
    .maybeSingle();
  if (target.error) throw target.error;

  if (target.data?.role === "admin") {
    const countResult = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (countResult.error) throw countResult.error;
    if (Number(countResult.count ?? 0) <= 1) {
      const conflict = new Error("The final administrator account cannot be deleted.");
      conflict.status = 409;
      throw conflict;
    }
  }

  await audit(admin, userId, targetUserId, "admin_delete_user", {
    reason,
    previousRole: target.data?.role ?? null,
  });
  const authDelete = await admin.auth.admin.deleteUser(targetUserId, false);
  if (authDelete.error) throw authDelete.error;
  await cleanupPublicUserRows(admin, targetUserId);
  return { success: true };
}
