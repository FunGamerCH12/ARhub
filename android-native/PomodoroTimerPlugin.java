package com.schoolhub.app;

import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "PomodoroTimer")
public class PomodoroTimerPlugin extends Plugin {

    private PendingIntent alarmIntent(Context c, int index, int flags) {
        Intent intent = new Intent(c, PomodoroReceiver.class);
        intent.setAction(PomodoroNotifier.ACTION_PHASE_END);
        intent.putExtra("index", index);
        return PendingIntent.getBroadcast(c, 3000 + index, intent, flags | PendingIntent.FLAG_IMMUTABLE);
    }

    private boolean canExact(AlarmManager am) {
        return Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms();
    }

    private void cancelAlarms(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        String raw = PomodoroNotifier.prefs(c).getString(PomodoroNotifier.KEY_PLAN, null);
        int count = 0;
        try {
            if (raw != null) count = new JSONArray(raw).length();
        } catch (Exception ignored) {
        }
        for (int i = 0; i < Math.max(count, 24); i++) {
            PendingIntent pi = alarmIntent(c, i, PendingIntent.FLAG_NO_CREATE);
            if (pi != null) {
                am.cancel(pi);
                pi.cancel();
            }
        }
    }

    /** schedule({ phases: [{ label, next, startsAt, endsAt }] }) */
    @PluginMethod
    public void schedule(PluginCall call) {
        Context c = getContext();
        try {
            JSArray phases = call.getArray("phases");
            if (phases == null || phases.length() == 0) {
                call.reject("phases kosong");
                return;
            }

            cancelAlarms(c);

            JSONArray plan = new JSONArray();
            for (int i = 0; i < phases.length(); i++) {
                JSONObject src = phases.getJSONObject(i);
                JSONObject item = new JSONObject();
                item.put("label", src.optString("label", "Fokus"));
                item.put("next", src.optString("next", ""));
                item.put("startsAt", src.optLong("startsAt", 0));
                item.put("endsAt", src.optLong("endsAt", 0));
                plan.put(item);
            }
            PomodoroNotifier.prefs(c).edit().putString(PomodoroNotifier.KEY_PLAN, plan.toString()).apply();

            AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
            boolean exact = canExact(am);
            long now = System.currentTimeMillis();

            for (int i = 0; i < plan.length(); i++) {
                long at = plan.getJSONObject(i).optLong("endsAt", 0);
                if (at <= now) continue;
                PendingIntent pi = alarmIntent(c, i, PendingIntent.FLAG_UPDATE_CURRENT);
                if (exact) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
                else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            }

            int active = PomodoroNotifier.activeIndex(plan, now);
            if (active >= 0) PomodoroNotifier.showCountdown(c, plan.getJSONObject(active));

            JSObject result = new JSObject();
            result.put("exact", exact);
            result.put("phases", plan.length());
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Gagal menjadwalkan: " + e.getMessage());
        }
    }

    /** showPaused({ label, remainingMs }) : batalkan jadwal, tampilkan status dijeda */
    @PluginMethod
    public void showPaused(PluginCall call) {
        Context c = getContext();
        cancelAlarms(c);
        PomodoroNotifier.prefs(c).edit().remove(PomodoroNotifier.KEY_PLAN).apply();
        String label = call.getString("label", "Fokus");
        Long remaining = call.getLong("remainingMs", 0L);
        PomodoroNotifier.showPaused(c, label, remaining == null ? 0 : remaining);
        call.resolve();
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        Context c = getContext();
        cancelAlarms(c);
        PomodoroNotifier.prefs(c).edit().remove(PomodoroNotifier.KEY_PLAN).apply();
        PomodoroNotifier.cancelTimerNotification(c);
        call.resolve();
    }

    /** Info dukungan untuk halaman Pengaturan. */
    @PluginMethod
    public void getInfo(PluginCall call) {
        Context c = getContext();
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        NotificationManager nm = PomodoroNotifier.manager(c);

        boolean promote = false;
        if (Build.VERSION.SDK_INT >= 36) {
            try {
                promote = (Boolean) nm.getClass().getMethod("canPostPromotedNotifications").invoke(nm);
            } catch (Throwable ignored) {
            }
        }

        JSObject info = new JSObject();
        info.put("sdk", Build.VERSION.SDK_INT);
        info.put("manufacturer", Build.MANUFACTURER);
        info.put("exactAlarm", canExact(am));
        info.put("liveUpdates", promote);
        call.resolve(info);
    }

    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {
        Context c = getContext();
        try {
            Intent intent;
            if (Build.VERSION.SDK_INT >= 31) {
                intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                        Uri.parse("package:" + c.getPackageName()));
            } else {
                intent = appSettingsIntent(c);
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            c.startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Tidak bisa membuka pengaturan alarm");
        }
    }

    /** Buka pengaturan Live Updates (Android 16). Kalau tidak ada, buka pengaturan notifikasi aplikasi. */
    @PluginMethod
    public void openLiveUpdateSettings(PluginCall call) {
        Context c = getContext();
        String action = "android.settings.MANAGE_APP_PROMOTED_NOTIFICATIONS";
        try {
            Object value = Settings.class.getField("ACTION_MANAGE_APP_PROMOTED_NOTIFICATIONS").get(null);
            if (value instanceof String) action = (String) value;
        } catch (Throwable ignored) {
        }

        try {
            Intent intent = new Intent(action, Uri.parse("package:" + c.getPackageName()));
            intent.putExtra(Settings.EXTRA_APP_PACKAGE, c.getPackageName());
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            c.startActivity(intent);
            call.resolve();
        } catch (Exception first) {
            try {
                Intent fallback = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                fallback.putExtra(Settings.EXTRA_APP_PACKAGE, c.getPackageName());
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                c.startActivity(fallback);
                call.resolve();
            } catch (Exception second) {
                call.reject("Tidak bisa membuka pengaturan notifikasi");
            }
        }
    }

    private Intent appSettingsIntent(Context c) {
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        intent.setData(Uri.parse("package:" + c.getPackageName()));
        return intent;
    }
}
