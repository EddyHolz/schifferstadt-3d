package de.schifferstadt.explore;

import android.app.Activity;
import android.os.Bundle;
import android.net.Uri;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Locale;

/** Serves the bundled renderer at a stable HTTPS origin, without file:// access or a JS bridge. */
public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String HOME = "https://" + HOST + "/assets/index.html";
    private WebView webView;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setSafeBrowsingEnabled(true);
        WebView.setWebContentsDebuggingEnabled(false);
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !isLocal(request.getUrl());
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (!isLocal(request.getUrl()) || !"GET".equals(request.getMethod())) {
                    return response(403, "Forbidden", "text/plain", "Externe Ressource gesperrt.");
                }
                String path = safeAssetPath(request.getUrl());
                if (path == null) return response(403, "Forbidden", "text/plain", "Ungültiger Dateipfad.");
                try {
                    InputStream stream = getAssets().open(path);
                    return new WebResourceResponse(mime(path), "UTF-8", 200, "OK",
                        Collections.singletonMap("X-Content-Type-Options", "nosniff"), stream);
                } catch (IOException error) {
                    return response(404, "Not Found", "text/html", "<!doctype html><html lang='de'><meta name='viewport' content='width=device-width'><title>Datei fehlt</title><body style='font:18px sans-serif;padding:32px'><h1>Stadtdaten fehlen</h1><p>Die mitgelieferten App-Dateien sind unvollständig. Bitte die App mit dem vollständigen dist-Ordner neu bauen.</p></body></html>");
                }
            }
        });
        webView.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets;
        });
        setContentView(webView);
        webView.loadUrl(HOME);
    }

    private static boolean isLocal(Uri uri) {
        return "https".equals(uri.getScheme()) && HOST.equals(uri.getHost())
            && (uri.getPort() == -1 || uri.getPort() == 443) && uri.getUserInfo() == null;
    }

    private static String safeAssetPath(Uri uri) {
        String path = uri.getPath(); // Android decodes percent escapes once.
        if (path == null || !path.startsWith("/assets/")) return null;
        String relative = path.substring(8);
        if (relative.isEmpty() || relative.indexOf('\\') >= 0 || relative.indexOf('%') >= 0
            || relative.indexOf('\0') >= 0) return null;
        for (String part : relative.split("/", -1)) {
            if (part.isEmpty() || part.equals(".") || part.equals("..")) return null;
            for (int i = 0; i < part.length(); i++) if (Character.isISOControl(part.charAt(i))) return null;
        }
        return relative;
    }

    private static String mime(String path) {
        String value = path.toLowerCase(Locale.ROOT);
        if (value.endsWith(".html")) return "text/html";
        if (value.endsWith(".js") || value.endsWith(".mjs")) return "text/javascript";
        if (value.endsWith(".css")) return "text/css";
        if (value.endsWith(".json") || value.endsWith(".geojson")) return "application/json";
        if (value.endsWith(".svg")) return "image/svg+xml";
        if (value.endsWith(".png")) return "image/png";
        if (value.endsWith(".jpg") || value.endsWith(".jpeg")) return "image/jpeg";
        if (value.endsWith(".webp")) return "image/webp";
        if (value.endsWith(".wasm")) return "application/wasm";
        if (value.endsWith(".woff2")) return "font/woff2";
        return "application/octet-stream";
    }

    private static WebResourceResponse response(int code, String reason, String type, String body) {
        return new WebResourceResponse(type, "UTF-8", code, reason,
            Collections.singletonMap("X-Content-Type-Options", "nosniff"),
            new ByteArrayInputStream(body.getBytes(StandardCharsets.UTF_8)));
    }

    @Override protected void onPause() { super.onPause(); webView.onPause(); }
    @Override protected void onResume() { super.onResume(); if (webView != null) webView.onResume(); }
    @Override public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack(); else super.onBackPressed();
    }
    @Override protected void onDestroy() {
        webView.stopLoading(); webView.destroy(); super.onDestroy();
    }
}
