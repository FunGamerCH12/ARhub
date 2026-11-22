package com.schoolhub.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PomodoroTimerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
