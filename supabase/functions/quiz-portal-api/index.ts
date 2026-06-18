import { withSupabase } from "npm:@supabase/server";
import {
  CORS,
  ALLOWED_ORIGINS,
  QUESTIONS_PER_DAY,
  addDays,
  attemptCount,
  dateKeyIST,
  json,
  corsForRequest,
  sanitizeUsername,
} from "./shared.ts";
import {
  SUBJECTS,
  normalizeSubject,
  startRetry,
  subjectCatalog,
  subjectState,
  submitQuiz,
} from "./quiz.ts";
import {
  adminClearResults,
  adminDeleteUser,
  adminUpdateUser,
  adminUserResults,
  adminUsers,
  deleteOwnAccount,
  updateUsername,
} from "./admin.ts";

async function ensureProfile(admin, userId, email, claims) {
  const current = await admin
    .from("profiles")
    .select("id,username,role")
    .eq("id", userId)
    .maybeSingle();
  if (current.error) throw current.error;
  if (current.data) return current.data;

  const fallback = `student-${userId.slice(0, 8)}`;
  const requested = sanitizeUsername(
    claims?.user_metadata?.username,
    sanitizeUsername(email.split("@")[0], fallback),
  );

  for (const username of [
    requested,
    `${requested.slice(0, 24)}-${userId.slice(0, 5)}`,
  ]) {
    const result = await admin
      .from("profiles")
      .insert({ id: userId, username, role: "student" })
      .select("id,username,role")
      .single();

    if (!result.error) return result.data;
    if (result.error.code !== "23505") throw result.error;
  }

  throw new Error("A unique profile could not be created.");
}

function scorePercent(row) {
  return Math.round(
    (Number(row.best_score ?? 0) /
      Number(row.total_questions || QUESTIONS_PER_DAY)) * 100,
  );
}

async function dashboard(admin, userId, email, claims) {
  const profile = await ensureProfile(admin, userId, email, claims);
  const today = dateKeyIST();

  const { data, error } = await admin
    .from("daily_quiz_results")
    .select("*")
    .eq("user_id", userId)
    .gte("quiz_date", addDays(today, -365))
    .order("quiz_date", { ascending: false })
    .order("submitted_at", { ascending: false });

  if (error) throw error;
  const rows = data ?? [];
  const completed = rows.filter((row) => attemptCount(row) > 0);
  const percentages = completed.map(scorePercent);

  const completedDates = new Set(
    completed
      .filter((row) => row.completed)
      .map((row) => String(row.quiz_date)),
  );
  let cursor = completedDates.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (streak < 366 && completedDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  const subjects = subjectCatalog().map((subject) => {
    const subjectRows = completed.filter(
      (row) => row.subject_code === subject.code,
    );
    const subjectPercentages = subjectRows.map(scorePercent);
    const todayRow = rows.find(
      (row) =>
        row.subject_code === subject.code &&
        String(row.quiz_date) === today,
    );

    return {
      ...subject,
      today: todayRow
        ? {
            attemptCount: attemptCount(todayRow),
            bestScore: Number(todayRow.best_score ?? 0),
            totalQuestions: Number(
              todayRow.total_questions ?? QUESTIONS_PER_DAY,
            ),
            retryStarted: Boolean(todayRow.retry_started_at),
          }
        : null,
      stats: {
        quizzes: subjectRows.length,
        averagePercent: subjectPercentages.length
          ? Math.round(
              subjectPercentages.reduce((sum, value) => sum + value, 0) /
                subjectPercentages.length,
            )
          : 0,
        bestPercent: subjectPercentages.length
          ? Math.max(...subjectPercentages)
          : 0,
      },
    };
  });

  return {
    profile: {
      username: profile.username,
      email,
      role: profile.role,
    },
    analytics: {
      totalQuizzes: completed.length,
      totalAttempts: completed.reduce(
        (sum, row) => sum + attemptCount(row),
        0,
      ),
      averagePercent: percentages.length
        ? Math.round(
            percentages.reduce((sum, value) => sum + value, 0) /
              percentages.length,
          )
        : 0,
      bestPercent: percentages.length ? Math.max(...percentages) : 0,
      streak,
      completedToday: completed.filter(
        (row) => String(row.quiz_date) === today,
      ).length,
    },
    subjects,
    recentResults: completed.slice(0, 20).map((row) => ({
      date: row.quiz_date,
      subjectCode: row.subject_code,
      subjectTitle: SUBJECTS[row.subject_code]?.title ?? row.subject_code,
      bestScore: Number(row.best_score ?? 0),
      totalQuestions: Number(row.total_questions ?? QUESTIONS_PER_DAY),
      attemptCount: attemptCount(row),
    })),
  };
}

const authenticatedHandler = withSupabase(
  { auth: "user" },
  async (request, context) => {
    const admin = context.supabaseAdmin;
    const claims = context.userClaims ?? {};
    const userId = String(claims.sub ?? claims.id ?? "");
    const email = String(claims.email ?? "");

    if (!userId) return json({ error: "Unauthorized." }, 401);

    const rate = await admin.rpc("consume_quiz_rate_limit", {
      p_user_id: userId,
      p_action: "request",
      p_limit: 60,
      p_window_seconds: 60,
    });
    if (rate.error) throw rate.error;
    if (!rate.data) return json({ error: "Too many requests. Try again shortly." }, 429);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Request body must be valid JSON." }, 400);
    }

    const action = String(body.action ?? "dashboard");

    try {
      await ensureProfile(admin, userId, email, claims);

      if (action === "dashboard") {
        return json(await dashboard(admin, userId, email, claims));
      }

      if (
        action === "subject_state" ||
        action === "start_retry" ||
        action === "submit"
      ) {
        const subjectCode = normalizeSubject(body.subject);
        if (!subjectCode) {
          return json({ error: "Unknown quiz subject." }, 400);
        }

        if (action === "subject_state") {
          return json(await subjectState(admin, userId, subjectCode));
        }
        if (action === "start_retry") {
          return json(await startRetry(admin, userId, subjectCode));
        }
        return json(
          await submitQuiz(
            admin,
            userId,
            subjectCode,
            body.answers,
          ),
        );
      }

      if (action === "account_update") {
        return json(await updateUsername(admin, userId, body.username));
      }
      if (action === "account_delete") {
        return json(await deleteOwnAccount(admin, userId));
      }
      if (action === "admin_users") {
        return json(await adminUsers(admin, userId));
      }
      if (action === "admin_user_results") {
        return json(
          await adminUserResults(
            admin,
            userId,
            String(body.targetUserId ?? ""),
          ),
        );
      }
      if (action === "admin_update_user") {
        return json(
          await adminUpdateUser(
            admin,
            userId,
            String(body.targetUserId ?? ""),
            body.username,
            body.role,
          ),
        );
      }
      if (action === "admin_clear_results") {
        return json(
          await adminClearResults(
            admin,
            userId,
            String(body.targetUserId ?? ""),
            body.reason,
          ),
        );
      }
      if (action === "admin_delete_user") {
        return json(
          await adminDeleteUser(
            admin,
            userId,
            String(body.targetUserId ?? ""),
            body.reason,
          ),
        );
      }

      return json({ error: "Unsupported action." }, 400);
    } catch (error) {
      const status = Number(error?.status ?? 500);
      console.error("quiz_portal_request_failed", {
        action,
        userId,
        error,
      });
      return json(
        {
          error:
            status >= 500
              ? "The secure quiz service could not complete the request. Please try again."
              : String(error?.message ?? "Request failed."),
        },
        status,
      );
    }
  },
);

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin") || "";
  const requestCors = corsForRequest(request);
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return Response.json({ error: "Origin not allowed." }, { status: 403, headers: CORS });
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: requestCors });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {
    const response = await authenticatedHandler(request);
    const headers = new Headers(response.headers);
    Object.entries(requestCors).forEach(([key, value]) => {
      headers.set(key, value);
    });
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error("quiz_portal_unhandled_failure", error);
    return json(
      {
        error:
          "The secure quiz service is temporarily unavailable. Please try again.",
      },
      500,
    );
  }
});
