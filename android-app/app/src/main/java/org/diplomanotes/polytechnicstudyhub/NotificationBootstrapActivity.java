package org.diplomanotes.polytechnicstudyhub;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;

import androidx.activity.ComponentActivity;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;

import com.google.firebase.messaging.FirebaseMessaging;

public class NotificationBootstrapActivity extends ComponentActivity {
    public static final String CHANNEL_ID = "new_lessons";
    public static final String TOPIC_NEW_LESSONS = "new-lessons";
    public static final String TOPIC_ALL_USERS = "all-users";

    private final ActivityResultLauncher<String> notificationPermissionLauncher =
            registerForActivityResult(new ActivityResultContracts.RequestPermission(), granted -> openMainApp());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createNotificationChannel();
        subscribeToTopics();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS);
        } else {
            openMainApp();
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null || manager.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                getString(R.string.notification_channel_new_lessons),
                NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription(getString(R.string.notification_channel_new_lessons_description));
        channel.enableVibration(true);
        manager.createNotificationChannel(channel);
    }

    private void subscribeToTopics() {
        try {
            FirebaseMessaging messaging = FirebaseMessaging.getInstance();
            messaging.subscribeToTopic(TOPIC_NEW_LESSONS);
            messaging.subscribeToTopic(TOPIC_ALL_USERS);
        } catch (IllegalStateException ignored) {
            // Firebase activates after google-services.json is supplied during the APK build.
        }
    }

    private void openMainApp() {
        Intent target = new Intent(this, MainActivity.class);
        if (getIntent() != null && getIntent().getData() != null) target.setData(getIntent().getData());
        target.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(target);
        finish();
    }
}
