package org.diplomanotes.polytechnicstudyhub;

import android.app.Activity;
import android.app.Application;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.TextView;

import androidx.core.view.GravityCompat;
import androidx.drawerlayout.widget.DrawerLayout;

/** Adds the new quiz dashboard to the native app drawer without duplicating web UI. */
public final class QuizNavigationApplication extends Application {
    private static final String QUIZ_URL = "https://polypmna.dpdns.org/daily-quiz.html";
    private static final String QUIZ_TAG = "native_quiz_dashboard_item";

    @Override
    public void onCreate() {
        super.onCreate();
        registerActivityLifecycleCallbacks(new ActivityLifecycleCallbacks() {
            @Override
            public void onActivityCreated(Activity activity, Bundle savedInstanceState) {
                if (activity instanceof MainActivity) {
                    installQuizNavigation(activity);
                }
            }

            @Override public void onActivityStarted(Activity activity) { }
            @Override public void onActivityResumed(Activity activity) { }
            @Override public void onActivityPaused(Activity activity) { }
            @Override public void onActivityStopped(Activity activity) { }
            @Override public void onActivitySaveInstanceState(Activity activity, Bundle outState) { }
            @Override public void onActivityDestroyed(Activity activity) { }
        });
    }

    private void installQuizNavigation(Activity activity) {
        TextView studyMaterials = activity.findViewById(R.id.navStudyMaterials);
        WebView webView = activity.findViewById(R.id.webView);
        DrawerLayout drawerLayout = activity.findViewById(R.id.drawerLayout);
        if (studyMaterials == null || webView == null || drawerLayout == null) {
            return;
        }

        ViewGroup parent = (ViewGroup) studyMaterials.getParent();
        if (parent.findViewWithTag(QUIZ_TAG) != null) {
            return;
        }

        TextView quizItem = new TextView(activity, null, 0, R.style.DrawerMenuItem);
        quizItem.setTag(QUIZ_TAG);
        quizItem.setText(R.string.nav_daily_quiz);
        quizItem.setCompoundDrawablesRelativeWithIntrinsicBounds(
                R.drawable.ic_question,
                0,
                0,
                0
        );
        quizItem.setContentDescription(activity.getString(R.string.nav_daily_quiz_description));
        quizItem.setOnClickListener(view -> {
            drawerLayout.closeDrawer(GravityCompat.START);
            webView.loadUrl(QUIZ_URL);
        });

        int position = parent.indexOfChild(studyMaterials) + 1;
        parent.addView(quizItem, position);
    }
}
