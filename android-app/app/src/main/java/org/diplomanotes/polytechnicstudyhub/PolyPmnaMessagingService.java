package org.diplomanotes.polytechnicstudyhub;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

public class PolyPmnaMessagingService extends FirebaseMessagingService {
    private static final String DEFAULT_URL = "https://polypmna.dpdns.org/";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();
        RemoteMessage.Notification notification = remoteMessage.getNotification();

        String title = firstNonBlank(
                data.get("title"),
                notification == null ? null : notification.getTitle(),
                getString(R.string.notification_default_title)
        );
        String body = firstNonBlank(
                data.get("body"),
                notification == null ? null : notification.getBody(),
                getString(R.string.notification_default_body)
        );
        String url = trustedUrl(data.get("url"));

        showNotification(title, body, url, data.get("subjectCode"));
    }

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        FirebaseMessaging.getInstance().subscribeToTopic(NotificationBootstrapActivity.TOPIC_NEW_LESSONS);
        FirebaseMessaging.getInstance().subscribeToTopic(NotificationBootstrapActivity.TOPIC_ALL_USERS);
    }

    private void showNotification(String title, String body, String url, String subjectCode) {
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null) return;
        ensureChannel(manager);

        Intent openLesson = new Intent(this, MainActivity.class)
                .setAction(Intent.ACTION_VIEW)
                .setData(Uri.parse(url))
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        int requestCode = Math.abs((url + firstNonBlank(subjectCode, "lesson")).hashCode());
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                requestCode,
                openLesson,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, NotificationBootstrapActivity.CHANNEL_ID)
                : new Notification.Builder(this);

        builder.setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new Notification.BigTextStyle().bigText(body))
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setColor(Color.rgb(29, 78, 216))
                .setPriority(Notification.PRIORITY_HIGH)
                .setCategory(Notification.CATEGORY_RECOMMENDATION);

        manager.notify(requestCode, builder.build());
    }

    private void ensureChannel(NotificationManager manager) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O
                || manager.getNotificationChannel(NotificationBootstrapActivity.CHANNEL_ID) != null) return;
        NotificationChannel channel = new NotificationChannel(
                NotificationBootstrapActivity.CHANNEL_ID,
                getString(R.string.notification_channel_new_lessons),
                NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription(getString(R.string.notification_channel_new_lessons_description));
        channel.enableVibration(true);
        manager.createNotificationChannel(channel);
    }

    private String trustedUrl(String candidate) {
        try {
            Uri uri = Uri.parse(firstNonBlank(candidate, DEFAULT_URL));
            if ("https".equalsIgnoreCase(uri.getScheme())
                    && "polypmna.dpdns.org".equalsIgnoreCase(uri.getHost())) return uri.toString();
        } catch (Exception ignored) {
            // Fall through to the website home page.
        }
        return DEFAULT_URL;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.trim().isEmpty()) return value.trim();
        }
        return "";
    }
}
