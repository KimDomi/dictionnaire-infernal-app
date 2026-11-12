package com.kimdomi.dictionnaireinfernal;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(InfernalNativePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
