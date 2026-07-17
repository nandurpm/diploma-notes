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
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
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
import java.util.Set;

public class MainActivity extends ComponentActivity {
    private static final String HOME_URL = "https://polypmna.dpdns.org/";
    private static final String TRUSTED_HOST = "polypmna.dpdns.org";
    private static final String ERROR_PAGE_URL = "file:///android_asset/offline.html";
    private static final String APP_ACTION_SCHEME = "polytechnic-study-hub";
    private static final Set<String> APPROVED_EXTERNAL_HOSTS = Set.of(
            "sitttrkerala.ac.in",
            "www.sitttrkerala.ac.in",
            "drive.google.com",
            "docs.google.com",
            "github.com",
            "raw.githubusercontent.com"
    );

    private final Map<View, String> navigationItems = new LinkedHashMap<>();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private DrawerLayout drawerLayout;
    private WebView webView;
    private ProgressBar progressBar;
    private View launchOverlay;
    private TextView toolbarSubtitle;
    private ValueCallback<Uri[]> fileChooserCallback;
    private boolean launchOverlayDismissed;
    private String lastFailedUrl = HOME_URL;

    private final Runnable slowLoadRunnable = () -> {
        if (!launchOverlayDismissed && toolbarSubtitle != null) {
            toolbarSubtitle.setText(R.string.loading_slow);
        }
    };

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
            loadIncomingIntent(getIntent(), true);
        } else {
            hideLaunchOverlay();
        }

        mainHandler.postDelayed(slowLoadRunnable, 15000L);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        loadIncomingIntent(intent, false);
    }

    private void loadIncomingIntent(Intent intent, boolean fallBackHome) {
        Uri deepLink = intent == null ? null : intent.getData();
        if (isTrustedUri(deepLink)) {
            webView.loadUrl(deepLink.toString());
        } else if (fallBackHome) {
            webView.loadUrl(HOME_URL);
        }
    }

    private void configureNativeShell() {
        drawerLayout.setScrimColor(0x66081733);
        findViewById(R.id.menuButton).setOnClickListener(
                view -> drawerLayout.openDrawer(GravityCompat.START)
        );
        findViewById(R.id.refreshButton).setOnClickListener(view -> {
            if (webView == null) {
                return;
            }
            if (webView.getUrl() != null && webView.getUrl().startsWith(ERROR_PAGE_URL)) {
                retryLastFailedUrl();
            } else {
                webView.reload();
            }
        });

        bindNavigation(R.id.navHome, "/");
        bindNavigation(R.id.navRevision2026, "/revision-2026.html");
        bindNavigation(R.id.navRevision2021, "/revision-2021.html");
        bindNavigation(R.id.navDailyQuiz, "/daily-quiz.html");
        bindNavigation(R.id.navAskPoly, "/ask-poly.html");
        bindNavigation(R.id.navTools, "/tools-v2.html");
        bindNavigation(R.id.navStudyMaterials, "/model-question-papers.html");
        bindNavigation(R.id.navMaterials2015, "/materials-2015.html");
        bindNavigation(R.id.navAbout, "/about.html");
        bindNavigation(R.id.navContact, "/contact.html");

        TextView version = findViewById(R.id.drawerVersion);
        version.setText("Version " + BuildConfig.VERSION_NAME + "  •  REV2026 content ready");
    }

    private void bindNavigation(int viewId, String path) {
        View item = findViewById(viewId);
        navigationItems.put(item, path);
        item.setOnClickListener(view -> {
            drawerLayout.closeDrawer(GravityCompat.START);
            String target = buildTrustedUrl(path);
            if (webView != null && !target.equals(webView.getUrl())) {
                webView.loadUrl(target);
            }
        });
    }

    private String buildTrustedUrl(String path) {
        String normalizedPath = path == null || path.trim().isEmpty() ? "/" : path.trim();
        if (!normalizedPath.startsWith("/")) {
            normalizedPath = "/" + normalizedPath;
        }
        return Uri.parse(HOME_URL)
                .buildUpon()
                .encodedPath(normalizedPath)
                .clearQuery()
                .fragment(null)
                .build()
                .toString();
    }

    private void markActiveNavigation(String pageUrl) {
        String currentPath = "/";
        try {
            Uri uri = Uri.parse(pageUrl == null ? HOME_URL : pageUrl);
            if (uri.getPath() != null && !uri.getPath().isEmpty()) {
                currentPath = uri.getPath();
            }
        } catch (Exception ignored) {
            // Keep Home active for malformed URLs.
        }

        if ("/index.html".equals(currentPath)) {
            currentPath = "/";
        } else if ("/ask-poly-v2.html".equals(currentPath)) {
            currentPath = "/ask-poly.html";
        } else if ("/tools.html".equals(currentPath)) {
            currentPath = "/tools-v2.html";
        }

        for (Map.Entry<View, String> entry : navigationItems.entrySet()) {
            entry.getKey().setActivated(pathMatches(currentPath, entry.getValue()));
        }
    }

    private boolean pathMatches(String currentPath, String targetPath) {
        if ("/revision-2026.html".equals(targetPath)) {
            return "/revision-2026.html".equals(currentPath)
                    || currentPath.startsWith("/revision-2026/")
                    || currentPath.startsWith("/revision-2026-content/");
        }
        if ("/revision-2021.html".equals(targetPath)) {
            return "/revision-2021.html".equals(currentPath)
                    || currentPath.startsWith("/revision-2021/")
                    || currentPath.startsWith("/lessons/")
                    || currentPath.startsWith("/notes/");
        }
        return targetPath.equals(currentPath);
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
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setSupportMultipleWindows(false);
        settings.setUserAgentString(
                settings.getUserAgentString() + " PolyPmnaAndroid/" + BuildConfig.VERSION_NAME
        );

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, false);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }

        webView.setWebViewClient(new HubWebViewClient());
        webView.setWebChromeClient(new HubWebChromeClient());
        webView.setDownloadListener(createDownloadListener());
    }

    private void injectNativeAppChrome(WebView target) {
        if (target == null) {
            return;
        }
        target.evaluateJavascript(
                "(function(){try{" +
                        "var d=document;d.documentElement.classList.add('polytechnic-native-app');" +
                        "var lesson=/^\\\/(?:revision-2026-content\\\/)?lessons\\\/lessons-[^\\\/]+\\.html$/i.test(location.pathname);" +
                        "if(lesson){d.documentElement.classList.add('poly-lesson-page');if(d.body){d.body.classList.add('poly-lesson-page');}}" +
                        "var css='html.polytechnic-native-app .topbar,html.polytechnic-native-app .skip-link{display:none!important;}' +" +
                        "'html.polytechnic-native-app body{padding-top:0!important;margin-top:0!important;}' +" +
                        "'html.polytechnic-native-app main{margin-top:0!important;}' +" +
                        "'html.polytechnic-native-app.poly-lesson-page .hb-topbar,html.polytechnic-native-app.poly-lesson-page .lesson-topbar,html.polytechnic-native-app.poly-lesson-page .lesson-header,html.polytechnic-native-app.poly-lesson-page body>nav.top,html.polytechnic-native-app.poly-lesson-page body>header.top,html.polytechnic-native-app.poly-lesson-page .chapter-nav,html.polytechnic-native-app.poly-lesson-page .revision-back-button,html.polytechnic-native-app.poly-lesson-page .nav-arrows{display:none!important;height:0!important;min-height:0!important;max-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important;}' +" +
                        "'html.polytechnic-native-app.poly-lesson-page .lesson-shell,html.polytechnic-native-app.poly-lesson-page main,html.polytechnic-native-app.poly-lesson-page .content{display:block!important;width:100%!important;max-width:none!important;margin:0!important;padding-top:7px!important;}' +" +
                        "'html.polytechnic-native-app .app-download:not([data-app-button-state=update]){display:none!important;}';" +
                        "var s=d.getElementById('poly-native-app-header-cleanup');" +
                        "if(!s){s=d.createElement('style');s.id='poly-native-app-header-cleanup';s.textContent=css;(d.head||d.documentElement).appendChild(s);}" +
                        "var h=d.querySelector('.topbar');if(h){h.hidden=true;h.setAttribute('aria-hidden','true');}" +
                        "var skip=d.querySelector('.skip-link');if(skip){skip.hidden=true;}" +
                        "}catch(e){}})();",
                null
        );
    }

    private DownloadListener createDownloadListener() {
        return (url, userAgent, contentDisposition, mimetype, contentLength) -> {
            if (!isTrustedDownload(url)) {
                Toast.makeText(this, R.string.download_blocked, Toast.LENGTH_SHORT).show();
                return;
            }
            try {
                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                String guessedName = URLUtil.guessFileName(url, contentDisposition, mimetype);
                String cookies = CookieManager.getInstance().getCookie(url);
                if (cookies != null) {
                    request.addRequestHeader("Cookie", cookies);
                }
                request.addRequestHeader("User-Agent", userAgent);
                request.setTitle(guessedName);
                request.setDescription(getString(R.string.downloading_file));
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, guessedName);
                request.setMimeType(
                        mimetype == null || mimetype.isEmpty()
                                ? "application/octet-stream"
                                : mimetype
                );
                DownloadManager manager = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                if (manager != null) {
                    manager.enqueue(request);
                    Toast.makeText(this, R.string.download_started, Toast.LENGTH_SHORT).show();
                }
            } catch (Exception error) {
                Toast.makeText(this, R.string.download_failed, Toast.LENGTH_SHORT).show();
            }
        };
    }

    private boolean isTrustedUri(Uri uri) {
        return uri != null
                && "https".equalsIgnoreCase(uri.getScheme())
                && TRUSTED_HOST.equalsIgnoreCase(uri.getHost());
    }

    private boolean isApprovedExternalHttps(Uri uri) {
        return uri != null
                && "https".equalsIgnoreCase(uri.getScheme())
                && uri.getHost() != null
                && APPROVED_EXTERNAL_HOSTS.contains(uri.getHost().toLowerCase(Locale.ROOT));
    }

    private boolean isTrustedDownload(String url) {
        try {
            Uri uri = Uri.parse(url);
            if (!isTrustedUri(uri)) {
                return false;
            }
            String path = uri.getPath();
            return path != null && (
                    path.startsWith("/notes/")
                            || path.startsWith("/revision-2026-content/notes/")
                            || path.startsWith("/downloads/")
                            || path.endsWith(".pdf")
                            || path.endsWith(".apk")
            );
        } catch (Exception ignored) {
            return false;
        }
    }

    private boolean isSafeExternalScheme(Uri uri) {
        if (uri == null || uri.getScheme() == null) {
            return false;
        }
        String scheme = uri.getScheme().toLowerCase(Locale.ROOT);
        return "mailto".equals(scheme) || "tel".equals(scheme);
    }

    private void openExternal(Intent intent, int errorMessageResId) {
        try {
            startActivity(intent);
        } catch (ActivityNotFoundException error) {
            Toast.makeText(this, errorMessageResId, Toast.LENGTH_SHORT).show();
        }
    }

    private void retryLastFailedUrl() {
        if (webView != null) {
            webView.getSettings().setCacheMode(WebSettings.LOAD_DEFAULT);
            webView.loadUrl(lastFailedUrl == null ? HOME_URL : lastFailedUrl);
        }
    }

    private void hideLaunchOverlay() {
        if (launchOverlayDismissed || launchOverlay == null) {
            return;
        }
        launchOverlayDismissed = true;
        mainHandler.removeCallbacks(slowLoadRunnable);
        launchOverlay.animate()
                .alpha(0f)
                .setDuration(180L)
                .setListener(new AnimatorListenerAdapter() {
                    @Override
                    public void onAnimationEnd(Animator animation) {
                        ViewParent parent = launchOverlay.getParent();
                        if (parent instanceof ViewGroup) {
                            ((ViewGroup) parent).removeView(launchOverlay);
                        } else {
                            launchOverlay.setVisibility(View.GONE);
                        }
                    }
                })
                .start();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) {
            webView.saveState(outState);
        }
    }

    @Override
    protected void onDestroy() {
        mainHandler.removeCallbacksAndMessages(null);
        if (webView != null) {
            webView.stopLoading();
            webView.setWebChromeClient(null);
            webView.setWebViewClient(null);
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    private final class HubWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return handleNavigation(url == null ? null : Uri.parse(url));
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return handleNavigation(request == null ? null : request.getUrl());
        }

        private boolean handleNavigation(Uri uri) {
            if (isTrustedUri(uri)) {
                return false;
            }
            if (isApprovedExternalHttps(uri) || isSafeExternalScheme(uri)) {
                openExternal(new Intent(Intent.ACTION_VIEW, uri), R.string.no_app_found);
            } else if (uri != null && APP_ACTION_SCHEME.equalsIgnoreCase(uri.getScheme())) {
                Toast.makeText(MainActivity.this, R.string.intent_link_blocked, Toast.LENGTH_SHORT).show();
            } else {
                Toast.makeText(MainActivity.this, R.string.unsafe_page_blocked, Toast.LENGTH_SHORT).show();
            }
            return true;
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            progressBar.setVisibility(View.VISIBLE);
            progressBar.setIndeterminate(true);
            toolbarSubtitle.setText(R.string.loading_page);
            markActiveNavigation(url);
            super.onPageStarted(view, url, favicon);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            progressBar.setIndeterminate(false);
            progressBar.setProgress(100);
            progressBar.setVisibility(View.GONE);
            toolbarSubtitle.setText(R.string.app_subtitle);
            view.getSettings().setCacheMode(WebSettings.LOAD_DEFAULT);
            markActiveNavigation(url);
            injectNativeAppChrome(view);
            hideLaunchOverlay();
            super.onPageFinished(view, url);
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request != null && request.isForMainFrame()) {
                Uri failingUri = request.getUrl();
                lastFailedUrl = failingUri == null ? HOME_URL : failingUri.toString();
                view.getSettings().setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
                view.loadUrl(ERROR_PAGE_URL);
            }
            super.onReceivedError(view, request, error);
        }
    }

    private final class HubWebChromeClient extends WebChromeClient {
        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            progressBar.setIndeterminate(false);
            progressBar.setProgress(newProgress);
            progressBar.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
            super.onProgressChanged(view, newProgress);
        }

        @Override
        public boolean onShowFileChooser(
                WebView webView,
                ValueCallback<Uri[]> filePathCallback,
                FileChooserParams fileChooserParams
        ) {
            if (fileChooserCallback != null) {
                fileChooserCallback.onReceiveValue(null);
            }
            fileChooserCallback = filePathCallback;
            Intent intent = fileChooserParams == null
                    ? new Intent(Intent.ACTION_GET_CONTENT)
                    : fileChooserParams.createIntent();
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            try {
                fileChooserLauncher.launch(intent);
                return true;
            } catch (ActivityNotFoundException error) {
                fileChooserCallback = null;
                Toast.makeText(MainActivity.this, R.string.no_file_picker, Toast.LENGTH_SHORT).show();
                return false;
            }
        }
    }
}
