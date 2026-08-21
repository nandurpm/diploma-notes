package org.diplomanotes.polytechnicstudyhub;

import android.Manifest;
import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.res.ColorStateList;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Picture;
import android.graphics.pdf.PdfDocument;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ImageButton;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;

import androidx.core.content.ContextCompat;
import androidx.core.view.GravityCompat;
import androidx.core.widget.TextViewCompat;
import androidx.drawerlayout.widget.DrawerLayout;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.google.firebase.messaging.FirebaseMessaging;

import java.io.File;
import java.io.FileInputStream;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

public class MainActivity extends ComponentActivity {
    private static final String HOME_URL = "https://polypmna.dpdns.org/";
    private static final String TRUSTED_HOST = "polypmna.dpdns.org";
    private static final String ERROR_PAGE_URL = "file:///android_asset/offline.html";
    private static final String APP_ACTION_SCHEME = "polytechnic-study-hub";
    private static final String PRINT_LOG_TAG = "PolyNativePrint";
    private static final String WEB_ASSET_SECURITY_VERSION_PREF = "web_asset_security_version";
    // In-app developer portfolio pages. The Developer footer link opens these
    // inside the app's own WebView via the open-external app action. Only the
    // exact allowlisted URLs below may be loaded — no other destination is
    // permitted, so the allowlist cannot be widened from the web side.
    private static final Set<String> DEVELOPER_ALLOWED_PAGES = Set.of(
            "https://nandakumarm.dpdns.org/about.html",
            "https://nandakumarm.dpdns.org/about",
            "https://nandakumarm.dpdns.org/"
    );

    private static boolean isAllowedDeveloperPage(String target) {
        if (target == null || target.isEmpty()) {
            return false;
        }
        return DEVELOPER_ALLOWED_PAGES.contains(target.trim());
    }
    // Conservative external-link policy: only official/public-interest resources and
    // verified educational institutions are allowed to open outside the WebView.
    // Suspected, malformed, HTTP-only, commercial, blog, and mirror links remain blocked.
    private static final Set<String> APPROVED_EXTERNAL_HOSTS = Set.of(
            // Existing official/site-specific destinations.
            "sitttrkerala.ac.in",
            "www.sitttrkerala.ac.in",
            "github.com",
            "raw.githubusercontent.com",
            // The About/Home Instagram CTA is intentionally opened outside the app.
            "instagram.com",
            "www.instagram.com",
            // Wikipedia.
            "en.wikipedia.org",
            // Official government and public-sector resources.
            "afdc.energy.gov",
            "aud.delhi.gov.in",
            "beeindia.gov.in",
            "bharatskills.gov.in",
            "etenders.kerala.gov.in",
            "india.gov.in",
            "www.india.gov.in",
            "indiabudget.gov.in",
            "www.indiabudget.gov.in",
            "indiacode.nic.in",
            "www.indiacode.nic.in",
            "ncert.nic.in",
            "nios.ac.in",
            "www.nios.ac.in",
            "panchayat.gov.in",
            "www.panchayat.gov.in",
            "rural.nic.in",
            "sdgs.un.org",
            "swayam.gov.in",
            "www.swayam.gov.in",
            "www.epa.gov",
            "www.sba.gov",
            // Official NPTEL, SWAYAM, IIT virtual-lab, and library resources.
            "archive.nptel.ac.in",
            "nptel.ac.in",
            "www.nptel.ac.in",
            "onlinecourses.nptel.ac.in",
            "onlinecourses.swayam2.ac.in",
            "be-iitkgp.vlabs.ac.in",
            "bes-iitr.vlabs.ac.in",
            "em-coep.vlabs.ac.in",
            "vem-iitg.vlabs.ac.in",
            "vlabs.iitb.ac.in",
            "ndl.iitkgp.ac.in",
            // Verified colleges, universities, and institutional domains.
            "www.amrita.edu",
            "catalog.tri-c.edu",
            "catalog.udayton.edu",
            "www.cl.cam.ac.uk",
            "ee.cet.ac.in",
            "files.mlrit.ac.in",
            "www.ganeshpolytechnic.edu.in",
            "gpkalahandi.in",
            "www.gtu.ac.in",
            "www.gwpctsr.ac.in",
            "www.iare.ac.in",
            "ise.rpi.edu",
            "www.kjei.edu.in",
            "lit.laxmi.edu.in",
            "www.mona.uwi.edu",
            "www.monroeccc.edu",
            "neurodiversity-engineering.media.uconn.edu",
            "www.ntc.edu",
            "pec.ac.in",
            "sist.sathyabama.ac.in",
            "stevenscollege.edu",
            "www.tezu.ernet.in",
            "www.washington.edu",
            "web.iit.edu",
            "wiki.auckland.ac.nz",
            "ocw.mit.edu",
            "phet.colorado.edu",
            "pmc.ncbi.nlm.nih.gov"
    );
    private static final String TRUSTED_GITHUB_REPOSITORY_PATH = "/nandurpm/diploma-notes";

    private final Map<View, String> navigationItems = new LinkedHashMap<>();
    private final List<TextView> themableTextViews = new ArrayList<>();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private DrawerLayout drawerLayout;
    private View navigationDrawer;
    private View rootColumn;
    private View appBar;
    private View drawerFooterDivider;
    private WebView webView;
    private SwipeRefreshLayout swipeRefresh;
    private ProgressBar progressBar;
    private View launchOverlay;
    private ImageButton menuButton;
    private ImageButton refreshButton;
    private ImageButton bookmarkButton;
    private ImageButton shareButton;
    private TextView toolbarTitle;
    private TextView toolbarSubtitle;
    private TextView drawerVersion;
    private TextView navSaveOffline;
    private TextView navSavedPages;
    private TextView navShareApp;

    private OfflineCacheManager offlineCache;
    private BookmarkManager bookmarks;
    private SharedPreferences prefs;
    private ForceUpdateGate forceUpdateGate;
    private boolean darkMode;

    private ValueCallback<Uri[]> fileChooserCallback;
    private boolean launchOverlayDismissed;
    private boolean nativePrintBusy;
    private String pendingPdfJobName;
    private String lastTrustedLessonUrl;
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

    private final ActivityResultLauncher<Intent> savedPagesLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            this::handleSavedPagesResult
    );

    private final ActivityResultLauncher<Intent> pdfSaveLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            this::handlePdfSaveResult
    );


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        drawerLayout = findViewById(R.id.drawerLayout);
        navigationDrawer = findViewById(R.id.navigationDrawer);
        rootColumn = findViewById(R.id.rootColumn);
        appBar = findViewById(R.id.appBar);
        drawerFooterDivider = findViewById(R.id.drawerFooterDivider);
        webView = findViewById(R.id.webView);
        swipeRefresh = findViewById(R.id.swipeRefresh);
        progressBar = findViewById(R.id.progressBar);
        launchOverlay = findViewById(R.id.launchOverlay);
        menuButton = findViewById(R.id.menuButton);
        refreshButton = findViewById(R.id.refreshButton);
        bookmarkButton = findViewById(R.id.bookmarkButton);
        shareButton = findViewById(R.id.shareButton);
        toolbarTitle = findViewById(R.id.toolbarTitle);
        toolbarSubtitle = findViewById(R.id.toolbarSubtitle);
        drawerVersion = findViewById(R.id.drawerVersion);
        navSaveOffline = findViewById(R.id.navSaveOffline);
        navSavedPages = findViewById(R.id.navSavedPages);
        navShareApp = findViewById(R.id.navShareApp);

        offlineCache = new OfflineCacheManager(getApplicationContext());
        bookmarks = new BookmarkManager(this);
        prefs = bookmarks.preferences();
        darkMode = false;
        refreshWebCacheForAppVersion();

        configureNativeShell();
        configureBackNavigation();
        configureWebView();
        configureSwipeRefresh();
        configureBookmarkButton();
        configureShareButton();
        configureSupportRow();

        applyTheme(darkMode);

        forceUpdateGate = new ForceUpdateGate(this);
        Runnable releaseWebView = () -> {
            if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null) {
                loadIncomingIntent(getIntent(), true);
            } else {
                hideLaunchOverlay();
            }
        };
        // Do not load or restore WebView content until the native policy check
        // confirms that this APK is still supported.
        forceUpdateGate.enforce(releaseWebView);

        offlineCache.preloadEssentialPages(HOME_URL, TRUSTED_HOST);
        mainHandler.postDelayed(slowLoadRunnable, 15000L);
    }

    private void refreshWebCacheForAppVersion() {
        String currentVersion = String.valueOf(BuildConfig.VERSION_CODE);
        String appliedVersion = prefs.getString(WEB_ASSET_SECURITY_VERSION_PREF, "");
        if (currentVersion.equals(appliedVersion)) {
            return;
        }
        // The website's JavaScript assets are immutable for normal browser caching.
        // Clear only the WebView HTTP cache once per APK version so upgraded users
        // receive the current security-hardened client without losing cookies,
        // Supabase sessions, local storage, or saved app data.
        webView.clearCache(true);
        prefs.edit().putString(WEB_ASSET_SECURITY_VERSION_PREF, currentVersion).apply();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (forceUpdateGate != null) {
            forceUpdateGate.enforce(() -> loadIncomingIntent(intent, false));
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (forceUpdateGate != null) {
            forceUpdateGate.onResume(() -> {
                // The initial startup callback owns the first WebView load.
                // Resume checks only release an already-authorized Activity.
            });
        }
    }



    private void loadIncomingIntent(Intent intent, boolean fallBackHome) {
        Uri deepLink = notificationOrDeepLinkUri(intent);
        if (isTrustedUri(deepLink)) {
            webView.loadUrl(deepLink.toString());
        } else if (fallBackHome) {
            webView.loadUrl(HOME_URL);
        }
    }

    private Uri notificationOrDeepLinkUri(Intent intent) {
        if (intent == null) {
            return null;
        }
        Uri data = intent.getData();
        if (isTrustedUri(data)) {
            return data;
        }
        String notificationUrl = intent.getStringExtra("url");
        if (notificationUrl == null || notificationUrl.trim().isEmpty()) {
            return null;
        }
        try {
            return Uri.parse(notificationUrl.trim());
        } catch (Exception ignored) {
            return null;
        }
    }

    private void configureNativeShell() {
        drawerLayout.setScrimColor(0x66081733);
        menuButton.setOnClickListener(view -> drawerLayout.openDrawer(GravityCompat.START));
        refreshButton.setOnClickListener(view -> {
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
        bindNavigation(R.id.navTools, "/tools.html");
        bindNavigation(R.id.navStudyMaterials, "/model-question-papers.html");
        bindNavigation(R.id.navMaterials2015, "/materials-2015.html");
        bindNavigation(R.id.navAbout, "/about.html");
        bindNavigation(R.id.navContact, "/contact.html");

        // Section labels take part in theming but not in the search filter.
        int[] labelIds = {
                R.id.labelStudy,
                R.id.labelResources
        };
        for (int id : labelIds) {
            View label = findViewById(id);
            if (label instanceof TextView) {
                themableTextViews.add((TextView) label);
            }
        }

        drawerVersion.setText("Version " + BuildConfig.VERSION_NAME + "  \u2022  Offline ready");
    }

    private void bindNavigation(int viewId, String path) {
        View item = findViewById(viewId);
        navigationItems.put(item, path);
        if (item instanceof TextView) {
            themableTextViews.add((TextView) item);
        }
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

    private String normalizedPath(Uri uri) {
        String path = uri == null ? null : uri.getPath();
        return (path == null || path.isEmpty()) ? "/" : path;
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
            currentPath = "/tools.html";
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

    private void configureSwipeRefresh() {
        if (swipeRefresh == null) {
            return;
        }
        swipeRefresh.setColorSchemeResources(R.color.brand_blue, R.color.brand_cyan, R.color.brand_teal);
        swipeRefresh.setOnRefreshListener(() -> {
            if (webView != null) {
                if (webView.getUrl() != null && webView.getUrl().startsWith(ERROR_PAGE_URL)) {
                    retryLastFailedUrl();
                } else {
                    webView.reload();
                }
            }
            mainHandler.postDelayed(() -> swipeRefresh.setRefreshing(false), 900L);
        });
    }

    private void updateSwipeRefreshForPage(String pageUrl) {
        if (swipeRefresh == null) {
            return;
        }
        String path = normalizedPath(pageUrl == null ? null : Uri.parse(pageUrl));
        boolean isAskPoly = "/ask-poly.html".equals(path) || "/ask-poly-v2.html".equals(path);
        // SwipeRefreshLayout sits above the WebView. On Ask POLY it can intercept the
        // downward portion of a nested message-list gesture, so use the toolbar refresh
        // action there and leave the WebView's scroll events entirely to the chat.
        swipeRefresh.setEnabled(!isAskPoly);
        if (isAskPoly) {
            swipeRefresh.setRefreshing(false);
        }
    }

    private void configureBookmarkButton() {
        if (bookmarkButton == null) {
            return;
        }
        bookmarkButton.setOnClickListener(v -> {
            if (webView == null || webView.getUrl() == null) {
                return;
            }
            Uri uri = Uri.parse(webView.getUrl());
            if (!isTrustedUri(uri)) {
                return;
            }
            String path = normalizedPath(uri);
            webView.evaluateJavascript("document.title", value -> {
                String title = decodeJsString(value);
                if (title == null || title.trim().isEmpty()) {
                    title = path;
                }
                bookmarks.toggleBookmark(path, title);
                boolean nowBookmarked = bookmarks.isBookmarked(path);
                int bookmarkMessageRes = nowBookmarked ? R.string.bookmark_added : R.string.bookmark_removed;
                Toast.makeText(MainActivity.this, bookmarkMessageRes, Toast.LENGTH_SHORT).show();
                updateBookmarkButtonState(webView.getUrl());
            });
        });
    }

    private void configureShareButton() {
        if (shareButton == null) {
            return;
        }
        shareButton.setOnClickListener(v -> {
            if (webView == null || webView.getUrl() == null) {
                return;
            }
            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType("text/plain");
            shareIntent.putExtra(Intent.EXTRA_TEXT, webView.getUrl());
            if (webView.getTitle() != null) {
                shareIntent.putExtra(Intent.EXTRA_SUBJECT, webView.getTitle());
            }
            openExternal(
                    Intent.createChooser(shareIntent, getString(R.string.share_page_chooser)),
                    R.string.no_app_found
            );
        });
    }

    private void configureSupportRow() {
        if (navSaveOffline != null) {
            themableTextViews.add(navSaveOffline);
            navSaveOffline.setOnClickListener(v -> saveCurrentPageOffline());
        }
        if (navSavedPages != null) {
            themableTextViews.add(navSavedPages);
            navSavedPages.setOnClickListener(v -> {
                drawerLayout.closeDrawer(GravityCompat.START);
                savedPagesLauncher.launch(new Intent(MainActivity.this, SavedPagesActivity.class));
            });
        }
        if (navShareApp != null) {
            themableTextViews.add(navShareApp);
            navShareApp.setOnClickListener(v -> {
                drawerLayout.closeDrawer(GravityCompat.START);
                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType("text/plain");
                shareIntent.putExtra(Intent.EXTRA_TEXT, getString(R.string.share_app_text));
                openExternal(
                        Intent.createChooser(shareIntent, getString(R.string.share_page_chooser)),
                        R.string.no_app_found
                );
            });
        }
    }

    private void handleSavedPagesResult(ActivityResult result) {
        if (result.getResultCode() != RESULT_OK || result.getData() == null) {
            return;
        }
        String path = result.getData().getStringExtra("path");
        if (path != null && webView != null) {
            webView.loadUrl(buildTrustedUrl(path));
        }
    }

    private void saveCurrentPageOffline() {
        if (webView == null || webView.getUrl() == null) {
            Toast.makeText(this, R.string.offline_save_failed, Toast.LENGTH_SHORT).show();
            return;
        }
        Uri uri = Uri.parse(webView.getUrl());
        if (!isTrustedUri(uri)) {
            Toast.makeText(this, R.string.offline_save_failed, Toast.LENGTH_SHORT).show();
            return;
        }
        String path = normalizedPath(uri);
        String pageUrl = webView.getUrl();
        webView.evaluateJavascript(
                "(function(){return document.title + '\\u0001' + document.documentElement.outerHTML;})();",
                value -> {
                    if (value == null || "null".equals(value)) {
                        Toast.makeText(MainActivity.this, R.string.offline_save_failed, Toast.LENGTH_SHORT).show();
                        return;
                    }
                    String decoded = decodeJsString(value);
                    int sep = decoded.indexOf('\u0001');
                    String title = sep > 0 ? decoded.substring(0, sep) : path;
                    String html = sep > 0 ? decoded.substring(sep + 1) : decoded;
                    if (html.trim().isEmpty()) {
                        Toast.makeText(MainActivity.this, R.string.offline_save_failed, Toast.LENGTH_SHORT).show();
                        return;
                    }
                    offlineCache.saveCurrentPageAsync(path, title, html, pageUrl, TRUSTED_HOST);
                    Toast.makeText(MainActivity.this, R.string.offline_saved, Toast.LENGTH_SHORT).show();
                }
        );
    }

    private void updateBookmarkButtonState(String url) {
        if (bookmarkButton == null) {
            return;
        }
        boolean bookmarked = false;
        if (url != null) {
            Uri uri = Uri.parse(url);
            if (isTrustedUri(uri)) {
                bookmarked = bookmarks.isBookmarked(normalizedPath(uri));
            }
        }
        bookmarkButton.setImageResource(bookmarked ? R.drawable.ic_star_filled : R.drawable.ic_star_outline);
        if (darkMode && !bookmarked) {
            bookmarkButton.setColorFilter(ContextCompat.getColor(this, R.color.dark_icon_tint));
        } else {
            bookmarkButton.clearColorFilter();
        }
    }

    private String decodeJsString(String raw) {
        if (raw == null) {
            return "";
        }
        String s = raw;
        if (s.length() >= 2 && s.startsWith("\"") && s.endsWith("\"")) {
            s = s.substring(1, s.length() - 1);
        }
        StringBuilder out = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '\\' && i + 1 < s.length()) {
                char next = s.charAt(i + 1);
                switch (next) {
                    case 'n':
                        out.append('\n');
                        i++;
                        break;
                    case 'r':
                        out.append('\r');
                        i++;
                        break;
                    case 't':
                        out.append('\t');
                        i++;
                        break;
                    case '"':
                        out.append('"');
                        i++;
                        break;
                    case '\\':
                        out.append('\\');
                        i++;
                        break;
                    case 'u':
                        if (i + 5 < s.length()) {
                            String hex = s.substring(i + 2, i + 6);
                            try {
                                out.append((char) Integer.parseInt(hex, 16));
                                i += 5;
                            } catch (NumberFormatException e) {
                                out.append(c);
                            }
                        } else {
                            out.append(c);
                        }
                        break;
                    default:
                        out.append(next);
                        i++;
                }
            } else {
                out.append(c);
            }
        }
        return out.toString();
    }

    private void applyItemThemeColors(TextView item, int textColor, int iconTint) {
        item.setTextColor(textColor);
        TextViewCompat.setCompoundDrawableTintList(item, ColorStateList.valueOf(iconTint));
    }

    private void applyTheme(boolean dark) {
        int bgColor = ContextCompat.getColor(this, dark ? R.color.dark_app_background : R.color.app_background);
        int surfaceColor = ContextCompat.getColor(this, dark ? R.color.dark_surface : R.color.surface);
        int textPrimary = ContextCompat.getColor(this, dark ? R.color.dark_text_primary : R.color.text_primary);
        int textSecondary = ContextCompat.getColor(this, dark ? R.color.dark_text_secondary : R.color.text_secondary);
        int dividerColor = ContextCompat.getColor(this, dark ? R.color.dark_divider : R.color.divider);
        int iconTint = ContextCompat.getColor(this, dark ? R.color.dark_icon_tint : R.color.brand_indigo);

        rootColumn.setBackgroundColor(bgColor);
        appBar.setBackgroundColor(surfaceColor);
        navigationDrawer.setBackgroundColor(surfaceColor);
        drawerFooterDivider.setBackgroundColor(dividerColor);
        if (webView != null) {
            webView.setBackgroundColor(bgColor);
        }

        toolbarTitle.setTextColor(textPrimary);
        toolbarSubtitle.setTextColor(textSecondary);
        drawerVersion.setTextColor(textSecondary);

        for (TextView item : themableTextViews) {
            applyItemThemeColors(item, textPrimary, iconTint);
        }

        for (ImageButton button : new ImageButton[]{menuButton, refreshButton, shareButton}) {
            if (button == null) {
                continue;
            }
            if (dark) {
                button.setColorFilter(iconTint);
            } else {
                button.clearColorFilter();
            }
        }
        updateBookmarkButtonState(webView == null ? null : webView.getUrl());

        getWindow().setStatusBarColor(
                ContextCompat.getColor(this, dark ? R.color.dark_surface : R.color.status_bar)
        );
        getWindow().setNavigationBarColor(surfaceColor);
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

        // Lesson pages use window.print(). Android WebView does not supply a browser
        // print dialog, so expose a narrow bridge that only prints trusted lesson URLs.
        webView.addJavascriptInterface(new NativePrintBridge(), "PolyNativePrint");

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
        String darkClassOp = darkMode
                ? "d.documentElement.classList.add('poly-dark-mode');"
                : "d.documentElement.classList.remove('poly-dark-mode');";
        target.evaluateJavascript(
                "(function(){try{" +
                        "var d=document;d.documentElement.classList.add('polytechnic-native-app');" +
                        darkClassOp +
                        "var lesson=/^\\/(?:revision-2026-content\\/)?lessons\\/lessons-[^\\/]+\\.html$/i.test(location.pathname);" +
                        "if(lesson){d.documentElement.classList.add('poly-lesson-page');if(d.body){d.body.classList.add('poly-lesson-page');}}" +
                        "var css='html.polytechnic-native-app .topbar,html.polytechnic-native-app .skip-link{display:none!important;}' +" +
                        "'html.polytechnic-native-app body{padding-top:0!important;margin-top:0!important;}' +" +
                        "'html.polytechnic-native-app main{margin-top:0!important;}' +" +
                        "'html.polytechnic-native-app.poly-lesson-page .hb-topbar,html.polytechnic-native-app.poly-lesson-page .lesson-topbar,html.polytechnic-native-app.poly-lesson-page .lesson-header,html.polytechnic-native-app.poly-lesson-page body>nav.top,html.polytechnic-native-app.poly-lesson-page body>header.top,html.polytechnic-native-app.poly-lesson-page .chapter-nav,html.polytechnic-native-app.poly-lesson-page .revision-back-button,html.polytechnic-native-app.poly-lesson-page .nav-arrows{display:none!important;height:0!important;min-height:0!important;max-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important;}' +" +
                        "'html.polytechnic-native-app.poly-lesson-page .lesson-shell,html.polytechnic-native-app.poly-lesson-page main,html.polytechnic-native-app.poly-lesson-page .content{display:block!important;width:100%!important;max-width:none!important;margin:0!important;padding-top:7px!important;}' +" +
                        "'html.polytechnic-native-app .app-download:not([data-app-button-state=update]){display:none!important;}' +" +
                        "'html.poly-dark-mode{filter:invert(1) hue-rotate(180deg);background:#0b1220!important;}' +" +
                        "'html.poly-dark-mode img,html.poly-dark-mode svg,html.poly-dark-mode video,html.poly-dark-mode iframe,html.poly-dark-mode picture{filter:invert(1) hue-rotate(180deg);}';" +
                        "var s=d.getElementById('poly-native-app-header-cleanup');" +
                        "if(!s){s=d.createElement('style');s.id='poly-native-app-header-cleanup';(d.head||d.documentElement).appendChild(s);}" +
                        "s.textContent=css;" +
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
        if (uri == null
                || !"https".equalsIgnoreCase(uri.getScheme())
                || uri.getHost() == null) {
            return false;
        }
        String host = uri.getHost().toLowerCase(Locale.ROOT);
        if (!APPROVED_EXTERNAL_HOSTS.contains(host)) {
            return false;
        }
        // The user’s repository is approved, not arbitrary GitHub content.
        if ("github.com".equals(host) || "raw.githubusercontent.com".equals(host)) {
            String path = uri.getPath();
            return path != null
                    && (path.equals(TRUSTED_GITHUB_REPOSITORY_PATH)
                    || path.startsWith(TRUSTED_GITHUB_REPOSITORY_PATH + "/"));
        }
        return true;
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

    private String buildCachedListParam() {
        StringBuilder builder = new StringBuilder();
        for (OfflineCacheManager.CachedPage page : offlineCache.listCachedPages()) {
            if (builder.length() > 0) {
                builder.append(',');
            }
            try {
                builder.append(URLEncoder.encode(page.path, "UTF-8"))
                        .append('|')
                        .append(URLEncoder.encode(page.title, "UTF-8"));
            } catch (Exception ignored) {
                // Skip this entry if it can't be encoded.
            }
        }
        return builder.toString();
    }

    private String buildOfflinePageUrl(String reason) {
        StringBuilder builder = new StringBuilder(ERROR_PAGE_URL).append('?');
        if (reason != null) {
            builder.append("reason=").append(reason).append('&');
        }
        builder.append("cached=").append(buildCachedListParam());
        return builder.toString();
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
        if (forceUpdateGate != null) {
            forceUpdateGate.destroy();
            forceUpdateGate = null;
        }
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

    private boolean isTrustedLessonUrl(String url) {
        try {
            Uri uri = Uri.parse(url == null ? "" : url);
            if (!isTrustedUri(uri)) {
                return false;
            }
            String path = uri.getPath();
            return path != null && path.matches(
                    "^/(?:revision-2026-content/)?lessons/lessons-[A-Za-z0-9_-]+\\.html$"
            );
        } catch (Exception ignored) {
            return false;
        }
    }

    private String safePrintJobName(String requestedTitle) {
        String fallback = "POLY PMNA printable notes";
        String cleaned = requestedTitle == null ? "" : requestedTitle
                .replaceAll("[\\r\\n\\t]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
        if (cleaned.isEmpty()) {
            return fallback;
        }
        return cleaned.length() > 96 ? cleaned.substring(0, 96).trim() : cleaned;
    }

    private void printCurrentLesson(String requestedTitle) {
        if (nativePrintBusy) {
            Log.i(PRINT_LOG_TAG, "Ignoring duplicate print request while the system save dialog is opening.");
            return;
        }
        if (webView == null) {
            Log.w(PRINT_LOG_TAG, "Print request rejected because WebView is unavailable.");
            Toast.makeText(this, R.string.print_unavailable, Toast.LENGTH_SHORT).show();
            return;
        }
        String currentUrl = webView.getUrl();
        if (!isTrustedLessonUrl(currentUrl)) {
            currentUrl = lastTrustedLessonUrl;
        }
        if (!isTrustedLessonUrl(currentUrl)) {
            Log.w(PRINT_LOG_TAG, "Print request rejected for untrusted/non-lesson URL: " + webView.getUrl());
            Toast.makeText(this, R.string.print_unavailable, Toast.LENGTH_SHORT).show();
            return;
        }
        String jobName = safePrintJobName(requestedTitle);
        nativePrintBusy = true;
        Log.i(PRINT_LOG_TAG, "Opening system Save as PDF picker for " + currentUrl + " as " + jobName);
        openDirectPdfSave(jobName);
    }

    private void openDirectPdfSave(String jobName) {
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/pdf");
        intent.putExtra(Intent.EXTRA_TITLE, jobName.endsWith(".pdf") ? jobName : jobName + ".pdf");
        pendingPdfJobName = jobName;
        try {
            pdfSaveLauncher.launch(intent);
        } catch (ActivityNotFoundException error) {
            pendingPdfJobName = null;
            nativePrintBusy = false;
            Log.e(PRINT_LOG_TAG, "No system document picker is available for direct PDF save", error);
            Toast.makeText(this, R.string.print_failed, Toast.LENGTH_SHORT).show();
        }
    }

    private void handlePdfSaveResult(ActivityResult result) {
        String jobName = pendingPdfJobName;
        pendingPdfJobName = null;
        if (result.getResultCode() != RESULT_OK || result.getData() == null || result.getData().getData() == null || webView == null) {
            nativePrintBusy = false;
            Log.i(PRINT_LOG_TAG, "Save as PDF picker was cancelled.");
            return;
        }
        Uri outputUri = result.getData().getData();
        PdfDocument document = null;
        try (OutputStream output = getContentResolver().openOutputStream(outputUri, "w")) {
            if (output == null) {
                throw new IllegalStateException("Could not open selected PDF destination");
            }
            Picture picture = webView.capturePicture();
            int contentWidth = picture.getWidth();
            int contentHeight = picture.getHeight();
            if (contentWidth <= 0 || contentHeight <= 0) {
                throw new IllegalStateException("Printable lesson has no renderable content");
            }
            final int pageWidth = 595;
            final int pageHeight = 842;
            float scale = pageWidth / (float) contentWidth;
            int scaledHeight = Math.max(1, Math.round(contentHeight * scale));
            int pageCount = Math.max(1, (scaledHeight + pageHeight - 1) / pageHeight);
            document = new PdfDocument();
            for (int pageNumber = 0; pageNumber < pageCount; pageNumber++) {
                PdfDocument.Page page = document.startPage(new PdfDocument.PageInfo.Builder(pageWidth, pageHeight, pageNumber + 1).create());
                Canvas canvas = page.getCanvas();
                canvas.drawColor(Color.WHITE);
                canvas.save();
                canvas.scale(scale, scale);
                canvas.translate(0, -(pageNumber * pageHeight) / scale);
                picture.draw(canvas);
                canvas.restore();
                document.finishPage(page);
            }
            document.writeTo(output);
            Log.i(PRINT_LOG_TAG, "Direct PDF save completed for " + jobName + " with " + pageCount + " pages.");
            Toast.makeText(this, R.string.print_saved, Toast.LENGTH_SHORT).show();
        } catch (Exception error) {
            Log.e(PRINT_LOG_TAG, "Direct PDF save failed", error);
            Toast.makeText(this, R.string.print_failed, Toast.LENGTH_SHORT).show();
        } finally {
            if (document != null) {
                document.close();
            }
            nativePrintBusy = false;
        }
    }

    public final class NativePrintBridge {
        @JavascriptInterface
        public void printLesson(String title) {
            Log.i(PRINT_LOG_TAG, "JavaScript print bridge invoked.");
            // JavaScript interfaces may be called off the UI thread; the Android
            // print framework and WebView adapter must always run on the main thread.
            mainHandler.post(() -> printCurrentLesson(title));
        }
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
            if (uri != null && APP_ACTION_SCHEME.equalsIgnoreCase(uri.getScheme())) {
                handleAppAction(uri);
                return true;
            }
            if (isApprovedExternalHttps(uri) || isSafeExternalScheme(uri)) {
                openExternal(new Intent(Intent.ACTION_VIEW, uri), R.string.no_app_found);
            } else {
                Toast.makeText(MainActivity.this, R.string.unsafe_page_blocked, Toast.LENGTH_SHORT).show();
            }
            return true;
        }

        private void handleAppAction(Uri uri) {
            String action = uri.getHost();
            if ("retry".equalsIgnoreCase(action)) {
                retryLastFailedUrl();
            } else if ("home".equalsIgnoreCase(action)) {
                webView.loadUrl(HOME_URL);
            } else if ("open".equalsIgnoreCase(action)) {
                String path = uri.getQueryParameter("path");
                webView.loadUrl(buildTrustedUrl(path == null ? "/" : path));
            } else if ("open-external".equalsIgnoreCase(action)) {
                // Developer footer link: opens the developer's portfolio About page
                // inside the app's own WebView instead of a system browser. Only an
                // exact allowlisted set of in-app destinations is permitted — a
                // mismatched or missing query parameter is rejected.
                String target = uri.getQueryParameter("path");
                if (isAllowedDeveloperPage(target)) {
                    Log.i("PolyAppNav", "Opening allowlisted developer page in-app: " + target);
                    webView.loadUrl(target);
                } else {
                    Toast.makeText(MainActivity.this, R.string.intent_link_blocked, Toast.LENGTH_SHORT).show();
                }
            } else if ("print".equalsIgnoreCase(action)) {
                String title = uri.getQueryParameter("title");
                Log.i(PRINT_LOG_TAG, "Print action received from lesson navigation: " + webView.getUrl());
                printCurrentLesson(title);
            } else {
                Toast.makeText(MainActivity.this, R.string.intent_link_blocked, Toast.LENGTH_SHORT).show();
            }
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            if (request != null && offlineCache != null && !offlineCache.isOnline()) {
                Uri uri = request.getUrl();
                if (isTrustedUri(uri)) {
                    if (request.isForMainFrame()) {
                        File cachedPage = offlineCache.getCachedFile(normalizedPath(uri));
                        if (cachedPage != null) {
                            try {
                                return new WebResourceResponse(
                                        "text/html", "utf-8", new FileInputStream(cachedPage)
                                );
                            } catch (Exception ignored) {
                                // Fall through to default handling.
                            }
                        }
                    } else {
                        String assetPath = uri.getPath();
                        File cachedAsset = assetPath == null ? null : offlineCache.getCachedAsset(assetPath);
                        if (cachedAsset != null) {
                            try {
                                String mime = offlineCache.getCachedAssetMimeType(assetPath);
                                return new WebResourceResponse(mime, "utf-8", new FileInputStream(cachedAsset));
                            } catch (Exception ignored) {
                                // Fall through to default handling.
                            }
                        }
                    }
                }
            }
            return super.shouldInterceptRequest(view, request);
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            if (isTrustedLessonUrl(url)) {
                lastTrustedLessonUrl = url;
            }
            updateSwipeRefreshForPage(url);
            progressBar.setVisibility(View.VISIBLE);
            progressBar.setIndeterminate(true);
            toolbarSubtitle.setText(R.string.loading_page);
            markActiveNavigation(url);
            super.onPageStarted(view, url, favicon);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            if (isTrustedLessonUrl(url)) {
                lastTrustedLessonUrl = url;
            }
            progressBar.setIndeterminate(false);
            progressBar.setProgress(100);
            progressBar.setVisibility(View.GONE);
            toolbarSubtitle.setText(R.string.app_subtitle);
            view.getSettings().setCacheMode(WebSettings.LOAD_DEFAULT);
            markActiveNavigation(url);
            updateSwipeRefreshForPage(url);
            injectNativeAppChrome(view);
            updateBookmarkButtonState(url);
            hideLaunchOverlay();
            if (swipeRefresh != null) {
                swipeRefresh.setRefreshing(false);
            }
            super.onPageFinished(view, url);
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request != null && request.isForMainFrame()) {
                Uri failingUri = request.getUrl();
                lastFailedUrl = failingUri == null ? HOME_URL : failingUri.toString();
                view.getSettings().setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
                String reason = offlineCache != null && offlineCache.isOnline() ? "error" : null;
                view.loadUrl(buildOfflinePageUrl(reason));
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
