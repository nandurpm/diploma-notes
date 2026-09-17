package org.diplomanotes.polytechnicstudyhub;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.os.Build;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Caches page HTML to local storage so the app can keep showing recently visited
 * pages while offline, and lets the user explicitly save a page for later.
 *
 * Only full-page HTML is cached (no CSS/JS/image assets), which is why
 * {@link #getCachedAsset(String)} always returns {@code null} today; that is
 * intentional and MainActivity already falls back to the live network request
 * when this returns null.
 */
public final class OfflineCacheManager {

    private static final String PREFS_NAME = "poly_pmna_offline_cache";
    private static final String KEY_CACHED_PATHS = "cached_paths";
    private static final String TITLE_PREFIX = "cached_title_";
    private static final String CACHE_DIR_NAME = "offline_pages";
    private static final int CONNECT_TIMEOUT_MS = 8000;

    private final Context appContext;
    private final SharedPreferences prefs;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    public OfflineCacheManager(Context context) {
        this.appContext = context.getApplicationContext();
        this.prefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    /** True when the device currently has a validated internet connection. */
    public boolean isOnline() {
        ConnectivityManager manager =
                (ConnectivityManager) appContext.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (manager == null) {
            return true;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Network network = manager.getActiveNetwork();
            if (network == null) {
                return false;
            }
            NetworkCapabilities capabilities = manager.getNetworkCapabilities(network);
            return capabilities != null
                    && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                    && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
        }
        NetworkInfo info = manager.getActiveNetworkInfo();
        return info != null && info.isConnected();
    }

    /** Best-effort background fetch of the home page so it's available offline on first launch. */
    public void preloadEssentialPages(String homeUrl, String trustedHost) {
        executor.execute(() -> {
            try {
                fetchAndCache("/", homeUrl, "Home");
            } catch (IOException ignored) {
                // Preloading is best-effort; failures here should never affect the live page load.
            }
        });
    }

    /** Persists an already-rendered page (HTML pulled from the live WebView) for offline viewing. */
    public void saveCurrentPageAsync(String path, String title, String html, String pageUrl, String trustedHost) {
        executor.execute(() -> writePageToCache(path, title, html));
    }

    public List<CachedPage> listCachedPages() {
        List<CachedPage> result = new ArrayList<>();
        for (String path : cachedPaths()) {
            String title = prefs.getString(TITLE_PREFIX + path, path);
            result.add(new CachedPage(path, title));
        }
        return result;
    }

    public File getCachedFile(String path) {
        File file = pageFile(path);
        return file.exists() ? file : null;
    }

    public File getCachedAsset(String assetPath) {
        return null;
    }

    public String getCachedAssetMimeType(String assetPath) {
        return "application/octet-stream";
    }

    public void removeCachedPage(String path) {
        if (path == null) {
            return;
        }
        Set<String> paths = new LinkedHashSet<>(cachedPaths());
        if (paths.remove(path)) {
            prefs.edit()
                    .putStringSet(KEY_CACHED_PATHS, paths)
                    .remove(TITLE_PREFIX + path)
                    .apply();
            //noinspection ResultOfMethodCallIgnored
            pageFile(path).delete();
        }
    }

    private void fetchAndCache(String path, String url, String fallbackTitle) throws IOException {
        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
        connection.setConnectTimeout(CONNECT_TIMEOUT_MS);
        connection.setReadTimeout(CONNECT_TIMEOUT_MS);
        connection.setRequestMethod("GET");
        try {
            connection.connect();
            if (connection.getResponseCode() == HttpURLConnection.HTTP_OK) {
                writePageToCache(path, fallbackTitle, readStream(connection));
            }
        } finally {
            connection.disconnect();
        }
    }

    private String readStream(HttpURLConnection connection) throws IOException {
        StringBuilder builder = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                builder.append(line).append('\n');
            }
        }
        return builder.toString();
    }

    private synchronized void writePageToCache(String path, String title, String html) {
        if (path == null || html == null || html.trim().isEmpty()) {
            return;
        }
        File file = pageFile(path);
        try (Writer writer = new OutputStreamWriter(new FileOutputStream(file), StandardCharsets.UTF_8)) {
            writer.write(html);
        } catch (IOException ignored) {
            return;
        }
        Set<String> paths = new LinkedHashSet<>(cachedPaths());
        paths.add(path);
        prefs.edit()
                .putStringSet(KEY_CACHED_PATHS, paths)
                .putString(TITLE_PREFIX + path, title == null || title.trim().isEmpty() ? path : title)
                .apply();
    }

    private File pageFile(String path) {
        String safeName = (path == null || path.equals("/"))
                ? "index"
                : path.replaceAll("[^a-zA-Z0-9._-]", "_");
        return new File(cacheDir(), safeName + ".html");
    }

    private File cacheDir() {
        File dir = new File(appContext.getFilesDir(), CACHE_DIR_NAME);
        if (!dir.exists()) {
            //noinspection ResultOfMethodCallIgnored
            dir.mkdirs();
        }
        return dir;
    }

    private Set<String> cachedPaths() {
        return prefs.getStringSet(KEY_CACHED_PATHS, Collections.emptySet());
    }

    /** A single offline-cached page, referenced as {@code OfflineCacheManager.CachedPage} in MainActivity. */
    public static final class CachedPage {
        public final String path;
        public final String title;

        public CachedPage(String path, String title) {
            this.path = path;
            this.title = title;
        }
    }
}
