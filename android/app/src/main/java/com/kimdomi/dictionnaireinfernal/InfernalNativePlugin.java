package com.kimdomi.dictionnaireinfernal;

import android.app.Activity;
import android.content.Intent;
import android.view.WindowManager;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "InfernalNative")
public class InfernalNativePlugin extends Plugin {
    private boolean awakeRequested = false;
    private boolean exportPending = false;

    @Override
    public void load() {
        getActivity().runOnUiThread(() -> getActivity().getOnBackPressedDispatcher().addCallback(
            getActivity(), new OnBackPressedCallback(true) {
                @Override
                public void handleOnBackPressed() {
                    bridge.triggerWindowJSEvent("infernal-back");
                }
            }
        ));
    }

    @PluginMethod
    public void backgroundApp(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            getActivity().moveTaskToBack(true);
            call.resolve();
        });
    }

    @PluginMethod
    public void setScreenAwake(PluginCall call) {
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        getActivity().runOnUiThread(() -> {
            awakeRequested = enabled;
            applyScreenAwake(enabled);
            call.resolve();
        });
    }

    private void applyScreenAwake(boolean enabled) {
        if (enabled) getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        else getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    @Override
    protected void handleOnPause() {
        applyScreenAwake(false);
    }

    @Override
    protected void handleOnResume() {
        applyScreenAwake(awakeRequested);
        bridge.triggerWindowJSEvent("infernal-app-resume");
    }

    @Override
    protected void handleOnDestroy() {
        applyScreenAwake(false);
    }

    @PluginMethod
    public void exportBackup(PluginCall call) {
        if (exportPending) {
            call.reject("이미 백업 파일 저장 창이 열려 있어요.");
            return;
        }
        if (call.getString("data") == null) {
            call.reject("저장할 서재 정보가 없어요.");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, call.getString("filename", "dictionnaire-infernal.json"));
        exportPending = true;
        try {
            startActivityForResult(call, intent, "backupDestination");
        } catch (Exception exception) {
            exportPending = false;
            call.reject("파일 저장 창을 열 수 없어요.", exception);
        }
    }

    @ActivityCallback
    private void backupDestination(PluginCall call, ActivityResult result) {
        exportPending = false;
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            call.resolve(new JSObject().put("cancelled", true));
            return;
        }
        bridge.execute(() -> {
            try (OutputStream output = getContext().getContentResolver().openOutputStream(result.getData().getData(), "wt")) {
                if (output == null) throw new IllegalStateException("Cannot open destination");
                output.write(call.getString("data", "").getBytes(StandardCharsets.UTF_8));
                call.resolve(new JSObject().put("cancelled", false));
            } catch (Exception exception) {
                call.reject("백업 파일을 저장하지 못했어요. 다른 위치에 다시 저장해 주세요.", exception);
            }
        });
    }
}
