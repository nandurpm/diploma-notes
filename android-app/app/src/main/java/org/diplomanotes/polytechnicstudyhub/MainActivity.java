package org.diplomanotes.polytechnicstudyhub;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.view.GravityCompat;
import androidx.drawerlayout.widget.DrawerLayout;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

public class MainActivity extends ComponentActivity {
    private static final String HOME_URL = "https://polypmna.dpdns.org/";
    private static final String TRUSTED_HOST = "polypmna.dpdns.org";

    private final Map<View, String> navigationItems = new LinkedHashMap<>();

    private DrawerLayout drawerLayout;
    private WebView webView;
    private ProgressBar progressBar;
    private View launchOverlay;
    private TextView toolbarSubtitle;
    private ValueCallback<Uri[]> fileChooserCallback;
    private boolean launchOverlayDismissed;

    private final ActivityResultLauncher<Intent> fileChooserLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                ValueCallback<Uri[]> callback = fileChooserCallback;
                fileChooserCallback = null;
                if (callback == null) {
                    return;
                }

                Uri[] selectedFiles = WebChromeClient.FileChooserParams.parseResult(
                        result.getResultCode(),
                        result.getData()
                );
                callback.onReceiveValue(selectedFiles);
            }
    );

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        drawerLayout = findViewById(R.id.drawerLayout);
        webView = findViewById(R.id.webView);
        progressBar = findViewById(R.id.progressBar);
        launchOverlay = findViewById(R.id.launchOverlay);
        toolbarSubtitle = findViewById(R.id.toolbarSubtitle);

        configureNativeShell();
        configureBackNavigation();
        configureWebView();

        if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null) {
            Uri deepLink = getIntent() != null ? getIntent().getData() : null;
            webView.loadUrl(isTrustedUri(deepLink) ? deepLink.toString() : HOME_URL);
        } else {
            hideLaunchOverlay();
        }

        launchOverlay.postDelayed(this::hideLaunchOverlay, 9000L);
    }

    private void configureNativeShell() {
        drawerLayout.setScrimColor(0x66081733);

        findViewById(R.id.menuButton).setOnClickListener(
                view -> drawerLayout.openDrawer(GravityCompat.START)
        );
        findViewById(R.id.refreshButton).setOnClickListener(view -> webView.reload());

        bindNavigation(R.id.navHome, "/");
        bindNavigation(R.id.navRevision2021, "/revision-2021.html");
        bindNavigation(R.id.navLessons, "/lessons.html");
        bindNavigation(R.id.navStudyMaterials, "/study-materials.html");
        bindNavigation(R.id.navSyllabus, "/syllabus.html");
        bindNavigation(R.id.navPreviousQuestions, "/previous-question-papers.html");
        bindNavigation(R.id.navModelQuestions, "/model-question-papers.html");
        bindNavigation(R.id.navMaterials2015, "/materials-2015.html");
        bindNavigation(R.id.navAbout, "/about.html");
        bindNavigation(R.id.navContact, "/contact.html");

        TextView version = findViewById(R.id.drawerVersion);
        version.setText("Version " + BuildConfig.VERSION_NAME + "  •  Online study content");
    }

    private void bindNavigation(int viewId, String path) {
        View item = findViewById(viewId);
        navigationItems.put(item, path);
        item.setOnClickListener(view -> {
            drawerLayout.closeDrawer(GravityCompat.START);
            String target = HOME_URL.substring(0, HOME_URL.length() - 1) + path;
            if (!target.equals(webView.getUrl())) {
                webView.loadUrl(target);
            }
        });
    }

    private void markActiveNavigation(String pageUrl) {
        String currentPath = "/";
        try {
            Uri uri = Uri.parse(pageUrl == null ? HOME_URL : pageUrl);
            if (uri.getPath() != null && !uri.getPath().isEmpty()) {
                currentPath = uri.getPath();
            }
        } catch (Exception ignored) {
            // Keep the home item selected when a malformed URL is received.
        }

        if ("/index.html".equals(currentPath)) {
            currentPath = "/";
        }
        for (Map.Entry<View, String> entry : navigationItems.entrySet()) {
            entry.getKey().setActivated(entry.getValue().equals(currentPath));
        }
    }

    private void configureBackNavigation() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (drawerLayout.isDrawerOpen(GravityCompat.START)) {
                    drawerLayout.closeDrawer(GravityCompat.START);
                    return;
                }
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                    return;
                }

                setEnabled(false);
                getOnBackPressedDispatcher().onBackPressed();
                setEnabled(true);
            }
        });
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setUserAgentString(
                settings.getUserAgentString() + " PolytechnicStudyHubAndroid/" + BuildConfig.VERSION_NAME
        );

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }

        webView.setWebViewClient(new HubWebViewClient());
        webView.setWebChromeClient(new HubWebChromeClient());
        webView.setDownloadListener(createDownloadListener());
    }

    private void hideLaunchOverlay() {
        if (launchOverlayDismissed || launchOverlay == null) {
            return;
        }
        launchOverlayDismissed = true;
        launchOverlay.animate()
                .alpha(0f)
                .setDuration(260L)
                .setListener(new AnimatorListenerAdapter() {
                    @Override
                    public void onAnimationEnd(Animator animation) {
                        launchOverlay.setVisibility(View.GONE);
                    }
                })
                .start();
    }

    private DownloadListener createDownloadListener() {
        return (url, userAgent, contentDisposition, mimeType, contentLength) -> {
            if (url == null || !url.toLowerCase(Locale.ROOT).startsWith("https://")) {
                Toast.makeText(this, R.string.download_blocked, Toast.LENGTH_SHORT).show();
                return;
            }

            try {
                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                request.addRequestHeader("User-Agent", userAgent == null ? "" : userAgent);
                request.setNotificationVisibility(
                        DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
                );
                request.setAllowedOverMetered(true);
                request.setAllowedOverRoaming(false);

                String fileName = android.webkit.URLUtil.guessFileName(url, contentDisposition, mimeType);
                request.setTitle(fileName);
                request.setDescription(getString(R.string.downloading_file));
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);

                DownloadManager manager = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                manager.enqueue(request);
                Toast.makeText(this, R.string.download_started, Toast.LENGTH_SHORT).show();
            } catch (Exception error) {
                openExternal(Uri.parse(url));
            }
        };
    }

    private boolean isTrustedUri(Uri uri) {
        return uri != null
                && "https".equalsIgnoreCase(uri.getScheme())
                && TRUSTED_HOST.equalsIgnoreCase(uri.getHost());
    }

    private boolean handleUri(Uri uri) {
        if (uri == null) {
            return false;
        }

        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        if (isTrustedUri(uri)) {
            return false;
        }

        if ("http".equals(scheme) || "https".equals(scheme)
                || "mailto".equals(scheme) || "tel".equals(scheme)
                || "sms".equals(scheme) || "geo".equals(scheme)) {
            openExternal(uri);
            return true;
        }

        if ("intent".equals(scheme)) {
            try {
                Intent intent = Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME);
                startActivity(intent);
            } catch (Exception ignored) {
                Toast.makeText(this, R.string.no_app_found, Toast.LENGTH_SHORT).show();
            }
            return true;
        }

        return true;
    }

    private void openExternal(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException error) {
            Toast.makeText(this, R.string.no_app_found, Toast.LENGTH_SHORT).show();
        }
    }

    private void showOfflinePage() {
        webView.loadUrl("file:///android_asset/offline.html");
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    private final class HubWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return handleUri(request.getUrl());
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            progressBar.setVisibility(View.VISIBLE);
            toolbarSubtitle.setText("Loading…");
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            progressBar.setVisibility(View.GONE);
            markActiveNavigation(url);
            hideLaunchOverlay();
        }

        @Override
        public void onReceivedError(
                WebView view,
                WebResourceRequest request,
                WebResourceError error
        ) {
            if (request.isForMainFrame()) {
                showOfflinePage();
            }
        }
    }

    private final class HubWebChromeClient extends WebChromeClient {
        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            progressBar.setProgress(newProgress);
            progressBar.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
        }

        @Override
        public void onReceivedTitle(WebView view, String title) {
            if (title == null || title.isBlank()) {
                toolbarSubtitle.setText(R.string.app_subtitle);
                return;
            }
            String cleaned = title
                    .replace("Polytechnic Study Hub", "")
                    .replace("Kerala Polytechnic Study Hub", "")
                    .replace("|", "")
                    .replace("–", "")
                    .trim();
            toolbarSubtitle.setText(cleaned.isEmpty() ? getString(R.string.app_subtitle) : cleaned);
        }

        @Override
        public boolean onShowFileChooser(
                WebView webView,
                ValueCallback<Uri[]> callback,
                FileChooserParams fileChooserParams
        ) {
            if (fileChooserCallback != null) {
                fileChooserCallback.onReceiveValue(null);
            }
            fileChooserCallback = callback;

            try {
                fileChooserLauncher.launch(fileChooserParams.createIntent());
                return true;
            } catch (ActivityNotFoundException error) {
                fileChooserCallback = null;
                Toast.makeText(MainActivity.this, R.string.no_file_picker, Toast.LENGTH_SHORT).show();
                return false;
            }
        }
    }
}
