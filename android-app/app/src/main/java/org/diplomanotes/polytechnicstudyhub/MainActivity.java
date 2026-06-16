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

public class MainActivity extends ComponentActivity {
    private static final String HOME_URL = "https://polypmna.dpdns.org/";
    private static final String TRUSTED_HOST = "polypmna.dpdns.org";
    private static final String ERROR_PAGE_URL = "file:///android_asset/offline.html";
    private static final String APP_ACTION_SCHEME = "polytechnic-study-hub";

    private final Map<View, String> navigationItems = new LinkedHashMap<>();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Runnable slowLoadRunnable = () -> {
        if (!launchOverlayDismissed && toolbarSubtitle != null) {
            toolbarSubtitle.setText(R.string.loading_slow);
        }
    };

    private DrawerLayout drawerLayout;
    private WebView webView;
    private ProgressBar progressBar;
    private View launchOverlay;
    private TextView toolbarSubtitle;
    private ValueCallback<Uri[]> fileChooserCallback;
    private boolean launchOverlayDismissed;
    private String lastFailedUrl = HOME_URL;

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
            if (webView != null && webView.getUrl() != null && webView.getUrl().startsWith(ERROR_PAGE_URL)) {
                retryLastFailedUrl();
            } else if (webView != null) {
                webView.reload();
            }
        });

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
        cookieManager.setAcceptThirdPartyCookies(webView, false);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }

        webView.setWebViewClient(new HubWebViewClient());
        webView.setWebChromeClient(new HubWebChromeClient());
        webView.setDownloadListener(createDownloadListener());
    }

    private void hideLaunchOverlay() {
        mainHandler.removeCallbacks(slowLoadRunnable);
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
                        if (launchOverlay != null) {
                            launchOverlay.setVisibility(View.GONE);
                        }
                    }
                })
                .start();
    }

    private DownloadListener createDownloadListener() {
        return (url, userAgent, contentDisposition, mimeType, contentLength) -> {
            Uri downloadUri = parseUri(url);
            if (!isAllowedDownloadUri(downloadUri)) {
                Toast.makeText(this, R.string.download_blocked, Toast.LENGTH_LONG).show();
                return;
            }

            try {
                DownloadManager manager = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                if (manager == null) {
                    throw new IllegalStateException("Download service is unavailable.");
                }

                DownloadManager.Request request = new DownloadManager.Request(downloadUri);
                if (userAgent != null && !userAgent.trim().isEmpty()) {
                    request.addRequestHeader("User-Agent", userAgent);
                }

                String cookie = CookieManager.getInstance().getCookie(downloadUri.toString());
                if (cookie != null && !cookie.trim().isEmpty()) {
                    request.addRequestHeader("Cookie", cookie);
                }

                String currentPage = webView == null ? null : webView.getUrl();
                Uri currentPageUri = parseUri(currentPage);
                if (isTrustedUri(currentPageUri)) {
                    request.addRequestHeader("Referer", currentPageUri.toString());
                }

                if (mimeType != null && !mimeType.trim().isEmpty()) {
                    request.setMimeType(mimeType);
                }
                request.setNotificationVisibility(
                        DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
                );
                request.setAllowedOverMetered(true);
                request.setAllowedOverRoaming(false);

                String fileName = URLUtil.guessFileName(url, contentDisposition, mimeType);
                request.setTitle(fileName);
                request.setDescription(getString(R.string.downloading_file));
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);

                long downloadId = manager.enqueue(request);
                if (downloadId <= 0) {
                    throw new IllegalStateException("Download manager rejected the request.");
                }
                Toast.makeText(this, R.string.download_started, Toast.LENGTH_SHORT).show();
            } catch (SecurityException | IllegalArgumentException | IllegalStateException error) {
                Toast.makeText(this, R.string.download_failed, Toast.LENGTH_LONG).show();
            }
        };
    }

    private Uri parseUri(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return Uri.parse(value.trim());
        } catch (Exception ignored) {
            return null;
        }
    }

    private boolean isAllowedDownloadUri(Uri uri) {
        return isTrustedUri(uri);
    }

    private boolean isTrustedUri(Uri uri) {
        if (uri == null || !"https".equalsIgnoreCase(uri.getScheme())) {
            return false;
        }
        if (!TRUSTED_HOST.equalsIgnoreCase(uri.getHost()) || uri.getUserInfo() != null) {
            return false;
        }
        int port = uri.getPort();
        return port == -1 || port == 443;
    }

    private boolean handleUri(Uri uri) {
        if (uri == null) {
            return true;
        }

        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        if (isTrustedUri(uri)) {
            return false;
        }

        if (APP_ACTION_SCHEME.equals(scheme)) {
            String action = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
            if ("retry".equals(action)) {
                retryLastFailedUrl();
            } else if ("home".equals(action)) {
                webView.loadUrl(HOME_URL);
            }
            return true;
        }

        if ("http".equals(scheme) || "https".equals(scheme)
                || "mailto".equals(scheme) || "tel".equals(scheme)
                || "sms".equals(scheme) || "geo".equals(scheme)) {
            openExternal(uri);
            return true;
        }

        if ("intent".equals(scheme)) {
            Toast.makeText(this, R.string.intent_link_blocked, Toast.LENGTH_LONG).show();
            return true;
        }

        Toast.makeText(this, R.string.unsafe_page_blocked, Toast.LENGTH_SHORT).show();
        return true;
    }

    private void retryLastFailedUrl() {
        String retryUrl = isTrustedUri(parseUri(lastFailedUrl)) ? lastFailedUrl : HOME_URL;
        webView.loadUrl(retryUrl);
    }

    private void openExternal(Uri uri) {
        try {
            Intent externalIntent = new Intent(Intent.ACTION_VIEW, uri);
            externalIntent.addCategory(Intent.CATEGORY_BROWSABLE);
            externalIntent.setComponent(null);
            externalIntent.setSelector(null);
            startActivity(externalIntent);
        } catch (ActivityNotFoundException | SecurityException error) {
            Toast.makeText(this, R.string.no_app_found, Toast.LENGTH_SHORT).show();
        }
    }

    private boolean isNetworkError(int errorCode) {
        return errorCode == WebViewClient.ERROR_HOST_LOOKUP
                || errorCode == WebViewClient.ERROR_CONNECT
                || errorCode == WebViewClient.ERROR_TIMEOUT
                || errorCode == WebViewClient.ERROR_IO
                || errorCode == WebViewClient.ERROR_PROXY_AUTHENTICATION;
    }

    private void showErrorPage(String failedUrl, boolean offline) {
        Uri failedUri = parseUri(failedUrl);
        if (isTrustedUri(failedUri)) {
            lastFailedUrl = failedUri.toString();
        }
        hideLaunchOverlay();
        String reason = offline ? "offline" : "error";
        webView.loadUrl(ERROR_PAGE_URL + "?reason=" + reason);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
            webView.resumeTimers();
        }
    }

    @Override
    protected void onPause() {
        if (webView != null) {
            webView.onPause();
            webView.pauseTimers();
        }
        super.onPause();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) {
            webView.saveState(outState);
        }
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onDestroy() {
        mainHandler.removeCallbacksAndMessages(null);

        if (fileChooserCallback != null) {
            fileChooserCallback.onReceiveValue(null);
            fileChooserCallback = null;
        }

        if (webView != null) {
            webView.stopLoading();
            webView.setDownloadListener(null);
            webView.setWebChromeClient(null);
            webView.setWebViewClient(null);
            webView.loadUrl("about:blank");
            webView.clearHistory();
            ViewParent parent = webView.getParent();
            if (parent instanceof ViewGroup) {
                ((ViewGroup) parent).removeView(webView);
            }
            webView.removeAllViews();
            webView.destroy();
            webView = null;
        }

        super.onDestroy();
    }

    private final class HubWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return handleUri(parseUri(url));
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return handleUri(request == null ? null : request.getUrl());
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            progressBar.setVisibility(View.VISIBLE);
            toolbarSubtitle.setText(R.string.loading_page);
        }

        @Override
        public void onPageCommitVisible(WebView view, String url) {
            hideLaunchOverlay();
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            progressBar.setVisibility(View.GONE);
            if (isTrustedUri(parseUri(url))) {
                markActiveNavigation(url);
            }
            hideLaunchOverlay();
        }

        @Override
        public void onReceivedError(
                WebView view,
                WebResourceRequest request,
                WebResourceError error
        ) {
            if (request != null && request.isForMainFrame()) {
                int errorCode = error == null ? WebViewClient.ERROR_UNKNOWN : error.getErrorCode();
                showErrorPage(request.getUrl() == null ? HOME_URL : request.getUrl().toString(), isNetworkError(errorCode));
            }
        }

        @SuppressWarnings("deprecation")
        @Override
        public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
                showErrorPage(failingUrl, isNetworkError(errorCode));
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
            if (title == null || title.trim().isEmpty()) {
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
            } catch (ActivityNotFoundException | SecurityException error) {
                fileChooserCallback = null;
                Toast.makeText(MainActivity.this, R.string.no_file_picker, Toast.LENGTH_SHORT).show();
                return false;
            }
        }
    }
}
