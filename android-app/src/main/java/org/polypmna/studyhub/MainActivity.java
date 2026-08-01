package org.polypmna.studyhub;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.URLUtil;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final String HOME_URL = "https://polypmna.dpdns.org/";
    private static final String VERSION_NAME = "2.0";
    private static final String USER_AGENT_TOKEN = "PolytechnicStudyHubAndroid/" + VERSION_NAME;

    private WebView webView;
    private FrameLayout root;
    private LinearLayout drawer;
    private View scrim;
    private ProgressBar progress;
    private TextView title;
    private boolean drawerOpen = false;

    private final String[][] menuItems = new String[][]{
            {"Home", HOME_URL},
            {"Revision 2021", HOME_URL + "revision-2021.html"},
            {"Daily Quiz / Mock Exams", HOME_URL + "daily-quiz.html"},
            {"2015 Materials", HOME_URL + "materials-2015.html"},
            {"Tools", HOME_URL + "tools.html"},
            {"Question Papers", HOME_URL + "model-question-papers.html"},
            {"Subject Search", HOME_URL + "#subject-browser"},
            {"About", HOME_URL + "about.html"},
            {"Help", HOME_URL + "contact.html"},
            {"Privacy", HOME_URL + "privacy.html"}
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setStatusBarColor(Color.rgb(15, 23, 42));
        buildUi();
        configureWebView();
        loadInitialUrl();
    }

    private void buildUi() {
        root = new FrameLayout(this);
        LinearLayout shell = new LinearLayout(this);
        shell.setOrientation(LinearLayout.VERTICAL);
        shell.setBackgroundColor(Color.rgb(239, 246, 255));

        LinearLayout top = new LinearLayout(this);
        top.setOrientation(LinearLayout.HORIZONTAL);
        top.setGravity(Gravity.CENTER_VERTICAL);
        top.setPadding(dp(12), dp(10), dp(12), dp(8));
        top.setBackgroundColor(Color.rgb(248, 251, 255));

        TextView menu = pill("Menu", 14, Color.WHITE, Color.rgb(29, 78, 216));
        menu.setGravity(Gravity.CENTER);
        top.addView(menu, new LinearLayout.LayoutParams(dp(64), dp(46)));
        menu.setOnClickListener(v -> toggleDrawer());

        LinearLayout brand = new LinearLayout(this);
        brand.setOrientation(LinearLayout.VERTICAL);
        brand.setPadding(dp(12), 0, 0, 0);
        title = new TextView(this);
        title.setText("POLY PMNA");
        title.setTextColor(Color.rgb(10, 20, 40));
        title.setTextSize(18);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        TextView sub = new TextView(this);
        sub.setText("Tools - Mock Exams - Revision 2021");
        sub.setTextColor(Color.rgb(71, 85, 105));
        sub.setTextSize(11);
        brand.addView(title);
        brand.addView(sub);
        top.addView(brand, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));

        TextView refresh = pill("Reload", 12, Color.rgb(29, 78, 216), Color.WHITE);
        refresh.setGravity(Gravity.CENTER);
        refresh.setOnClickListener(v -> webView.reload());
        top.addView(refresh, new LinearLayout.LayoutParams(dp(60), dp(44)));

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        progress.setProgress(0);

        webView = new WebView(this);
        shell.addView(top, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        shell.addView(progress, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(3)));
        shell.addView(webView, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
        root.addView(shell);

        scrim = new View(this);
        scrim.setBackgroundColor(0x77000000);
        scrim.setVisibility(View.GONE);
        scrim.setOnClickListener(v -> closeDrawer());
        root.addView(scrim, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        drawer = buildDrawer();
        FrameLayout.LayoutParams drawerParams = new FrameLayout.LayoutParams(dp(292), ViewGroup.LayoutParams.MATCH_PARENT, Gravity.LEFT);
        drawer.setTranslationX(-dp(310));
        root.addView(drawer, drawerParams);
        setContentView(root);
    }

    private LinearLayout buildDrawer() {
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setBackgroundColor(Color.WHITE);
        panel.setPadding(dp(16), dp(20), dp(16), dp(16));

        TextView head = new TextView(this);
        head.setText("POLY PMNA\nLatest app 2.0");
        head.setTextSize(20);
        head.setTypeface(Typeface.DEFAULT_BOLD);
        head.setTextColor(Color.WHITE);
        head.setPadding(dp(16), dp(18), dp(16), dp(18));
        head.setBackgroundColor(Color.rgb(29, 78, 216));
        panel.addView(head, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        TextView note = new TextView(this);
        note.setText("Quick access to study pages, mock exams and the new Student Tools section.");
        note.setTextColor(Color.rgb(71, 85, 105));
        note.setTextSize(13);
        note.setPadding(0, dp(12), 0, dp(10));
        panel.addView(note);

        ScrollView scroller = new ScrollView(this);
        LinearLayout list = new LinearLayout(this);
        list.setOrientation(LinearLayout.VERTICAL);
        for (String[] item : menuItems) {
            TextView row = menuRow(item[0]);
            row.setOnClickListener(v -> {
                closeDrawer();
                webView.loadUrl(item[1]);
            });
            list.addView(row, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(50)));
        }
        scroller.addView(list);
        panel.addView(scroller, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));

        TextView close = menuRow("Close Menu");
        close.setGravity(Gravity.CENTER);
        close.setOnClickListener(v -> closeDrawer());
        panel.addView(close, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(48)));
        return panel;
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setUserAgentString(settings.getUserAgentString() + " " + USER_AGENT_TOKEN);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override public void onProgressChanged(WebView view, int newProgress) {
                progress.setProgress(newProgress);
                progress.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleUrl(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUrl(Uri.parse(url));
            }
        });

        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> downloadFile(url, contentDisposition, mimeType));
    }

    private boolean handleUrl(Uri uri) {
        if (uri == null) return true;
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
        if ("https".equals(scheme) && "polypmna.dpdns.org".equals(host)) return false;
        if ("http".equals(scheme) || "https".equals(scheme) || "mailto".equals(scheme)) {
            try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (ActivityNotFoundException ignored) {}
        }
        return true;
    }

    private void downloadFile(String url, String disposition, String mimeType) {
        Uri uri = Uri.parse(url);
        if (!"https".equalsIgnoreCase(uri.getScheme()) || !"polypmna.dpdns.org".equalsIgnoreCase(uri.getHost())) {
            Toast.makeText(this, "Only trusted website downloads are allowed.", Toast.LENGTH_SHORT).show();
            return;
        }
        String filename = URLUtil.guessFileName(url, disposition, mimeType);
        DownloadManager.Request request = new DownloadManager.Request(uri);
        request.setTitle(filename);
        request.setDescription("Downloading from Polytechnic Study Hub");
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.setDestinationInExternalPublicDir(android.os.Environment.DIRECTORY_DOWNLOADS, filename);
        request.addRequestHeader("Cookie", CookieManager.getInstance().getCookie(url));
        request.addRequestHeader("User-Agent", USER_AGENT_TOKEN);
        ((DownloadManager) getSystemService(DOWNLOAD_SERVICE)).enqueue(request);
        Toast.makeText(this, "Download started", Toast.LENGTH_SHORT).show();
    }

    private void loadInitialUrl() {
        Uri launch = getIntent() == null ? null : getIntent().getData();
        String target = launch != null && "polypmna.dpdns.org".equalsIgnoreCase(launch.getHost()) ? launch.toString() : HOME_URL;
        if (isOnline()) webView.loadUrl(target); else webView.loadData(errorHtml(), "text/html", "UTF-8");
    }

    private boolean isOnline() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo info = cm == null ? null : cm.getActiveNetworkInfo();
        return info != null && info.isConnected();
    }

    private String errorHtml() {
        return "<html><body style='font-family:sans-serif;padding:24px;background:#eff6ff;color:#10213d'>" +
                "<h2>No internet connection</h2><p>Connect to the internet and press refresh.</p></body></html>";
    }

    private void toggleDrawer() { if (drawerOpen) closeDrawer(); else openDrawer(); }
    private void openDrawer() { drawerOpen = true; scrim.setVisibility(View.VISIBLE); drawer.animate().translationX(0).setDuration(180).start(); }
    private void closeDrawer() { drawerOpen = false; scrim.setVisibility(View.GONE); drawer.animate().translationX(-dp(310)).setDuration(180).start(); }

    @Override public void onBackPressed() {
        if (drawerOpen) { closeDrawer(); return; }
        if (webView.canGoBack()) { webView.goBack(); return; }
        super.onBackPressed();
    }

    @Override protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        Uri data = intent == null ? null : intent.getData();
        if (data != null) webView.loadUrl(data.toString());
    }

    private TextView pill(String text, int sp, int textColor, int bgColor) {
        TextView view = new TextView(this);
        view.setText(text);
        view.setTextSize(sp);
        view.setTypeface(Typeface.DEFAULT_BOLD);
        view.setTextColor(textColor);
        view.setBackgroundColor(bgColor);
        return view;
    }

    private TextView menuRow(String text) {
        TextView row = new TextView(this);
        row.setText(text);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setTextColor(Color.rgb(15, 23, 42));
        row.setTextSize(15);
        row.setTypeface(Typeface.DEFAULT_BOLD);
        row.setPadding(dp(14), 0, dp(12), 0);
        return row;
    }

    private int dp(int value) {
        return (int) (value * getResources().getDisplayMetrics().density + 0.5f);
    }
}
