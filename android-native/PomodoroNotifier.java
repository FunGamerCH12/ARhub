package com.schoolhub.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Semua urusan notifikasi timer ada di sini (dipakai plugin dan receiver).
 * Hitung mundur digerakkan oleh sistem Android lewat Chronometer,
 * jadi tetap berjalan walau aplikasi ditutup.
 */
final class PomodoroNotifier {
    static final String CH_TIMER = "pomodoro_timer_v1";
    static final String CH_ALERT = "pomodoro_alert_v1";
    static final int ID_TIMER = 2001;
    static final int ID_ALERT = 2002;
    static final String PREFS = "pomodoro_native";
    static final String KEY_PLAN = "plan";
    static final String ACTION_PHASE_END = "com.schoolhub.app.PHASE_END";

    private PomodoroNotifier() {}

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static NotificationManager manager(Context c) {
        return (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
    }

    static void ensureChannels(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = manager(c);

        NotificationChannel timer = new NotificationChannel(
                CH_TIMER, "Timer berjalan", NotificationManager.IMPORTANCE_LOW);
        timer.setDescription("Hitung mundur sesi fokus dan istirahat");
        timer.setShowBadge(false);
        nm.createNotificationChannel(timer);

        NotificationChannel alert = new NotificationChannel(
                CH_ALERT, "Pemberitahuan sesi", NotificationManager.IMPORTANCE_HIGH);
        alert.setDescription("Bunyi saat sesi fokus atau istirahat selesai");
        alert.enableVibration(true);
        nm.createNotificationChannel(alert);
    }

    private static Notification.Builder builder(Context c, String channel) {
        if (Build.VERSION.SDK_INT >= 26) return new Notification.Builder(c, channel);
        return new Notification.Builder(c);
    }

    private static int smallIcon(Context c) {
        int id = c.getResources().getIdentifier("ic_stat_pomodoro", "drawable", c.getPackageName());
        return id != 0 ? id : c.getApplicationInfo().icon;
    }

    private static PendingIntent openAppIntent(Context c) {
        Intent launch = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        if (launch == null) launch = new Intent();
        launch.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(c, 0, launch,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Minta Android 16+ menampilkan ini sebagai Live Update (HyperOS 3: Hyper Island). */
    private static void requestPromoted(Notification.Builder b) {
        String key = "android.requestPromotedOngoing";
        try {
            Object value = Notification.class.getField("EXTRA_REQUEST_PROMOTED_ONGOING").get(null);
            if (value instanceof String) key = (String) value;
        } catch (Throwable ignored) {
            // pakai nilai bawaan di atas
        }
        Bundle extras = new Bundle();
        extras.putBoolean(key, true);
        b.addExtras(extras);
    }

    /** Notifikasi hitung mundur: angka bergerak sendiri, tanpa aplikasi berjalan. */
    static void showCountdown(Context c, JSONObject phase) {
        ensureChannels(c);
        long endsAt = phase.optLong("endsAt", 0);
        String label = phase.optString("label", "Fokus");
        String next = phase.optString("next", "");

        Notification.Builder b = builder(c, CH_TIMER)
                .setSmallIcon(smallIcon(c))
                .setContentTitle(label)
                .setContentText(next.isEmpty() ? "Sisa waktu" : "Berikutnya: " + next)
                .setContentIntent(openAppIntent(c))
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setShowWhen(true)
                .setWhen(endsAt)
                .setUsesChronometer(true)
                .setCategory(Notification.CATEGORY_PROGRESS);
        if (Build.VERSION.SDK_INT >= 24) b.setChronometerCountDown(true);
        if (Build.VERSION.SDK_INT < 26) b.setPriority(Notification.PRIORITY_LOW);
        requestPromoted(b);

        try {
            manager(c).notify(ID_TIMER, b.build());
        } catch (SecurityException ignored) {
            // izin notifikasi belum diberikan
        }
    }

    /** Notifikasi saat timer dijeda: teks tetap, tanpa hitung mundur. */
    static void showPaused(Context c, String label, long remainingMs) {
        ensureChannels(c);
        long total = Math.max(0, remainingMs) / 1000;
        String clock = String.format(java.util.Locale.US, "%02d:%02d", total / 60, total % 60);

        Notification.Builder b = builder(c, CH_TIMER)
                .setSmallIcon(smallIcon(c))
                .setContentTitle(label + " dijeda")
                .setContentText("Sisa " + clock)
                .setContentIntent(openAppIntent(c))
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setShowWhen(false);
        if (Build.VERSION.SDK_INT < 26) b.setPriority(Notification.PRIORITY_LOW);

        try {
            manager(c).notify(ID_TIMER, b.build());
        } catch (SecurityException ignored) {
        }
    }

    /** Notifikasi berbunyi saat sesi selesai. */
    static void showAlert(Context c, String title, String text) {
        ensureChannels(c);
        Notification.Builder b = builder(c, CH_ALERT)
                .setSmallIcon(smallIcon(c))
                .setContentTitle(title)
                .setContentText(text)
                .setContentIntent(openAppIntent(c))
                .setAutoCancel(true)
                .setCategory(Notification.CATEGORY_REMINDER)
                .setDefaults(Notification.DEFAULT_ALL);
        if (Build.VERSION.SDK_INT < 26) b.setPriority(Notification.PRIORITY_HIGH);

        try {
            manager(c).notify(ID_ALERT, b.build());
        } catch (SecurityException ignored) {
        }
    }

    static void cancelTimerNotification(Context c) {
        manager(c).cancel(ID_TIMER);
    }

    /** Fase aktif = fase pertama yang waktu selesainya belum lewat. -1 kalau semua sudah lewat. */
    static int activeIndex(JSONArray plan, long now) {
        for (int i = 0; i < plan.length(); i++) {
            if (plan.optJSONObject(i).optLong("endsAt", 0) > now) return i;
        }
        return -1;
    }
}
