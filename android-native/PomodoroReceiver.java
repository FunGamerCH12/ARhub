package com.schoolhub.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import org.json.JSONArray;
import org.json.JSONObject;

/** Dipanggil AlarmManager saat satu fase selesai: bunyikan alarm, lalu tampilkan hitung mundur fase berikutnya. */
public class PomodoroReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !PomodoroNotifier.ACTION_PHASE_END.equals(intent.getAction())) return;

        try {
            String raw = PomodoroNotifier.prefs(context).getString(PomodoroNotifier.KEY_PLAN, null);
            if (raw == null) return;

            JSONArray plan = new JSONArray(raw);
            int index = intent.getIntExtra("index", -1);
            if (index < 0 || index >= plan.length()) return;

            JSONObject ended = plan.getJSONObject(index);
            long now = System.currentTimeMillis();
            int active = PomodoroNotifier.activeIndex(plan, now);

            // Bunyi hanya untuk fase terakhir yang selesai (alarm yang telat berbarengan tidak menumpuk)
            if (active == -1 || active == index + 1) {
                String next = ended.optString("next", "");
                PomodoroNotifier.showAlert(
                        context,
                        ended.optString("label", "Sesi") + " selesai",
                        next.isEmpty() ? "Sesi berakhir." : "Saatnya " + next + ".");
            }

            if (active == -1) {
                PomodoroNotifier.cancelTimerNotification(context);
                PomodoroNotifier.prefs(context).edit().remove(PomodoroNotifier.KEY_PLAN).apply();
            } else {
                PomodoroNotifier.showCountdown(context, plan.getJSONObject(active));
            }
        } catch (Exception ignored) {
            // jangan sampai receiver membuat aplikasi crash
        }
    }
}
