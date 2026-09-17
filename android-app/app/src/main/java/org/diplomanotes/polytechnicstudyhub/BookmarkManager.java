package org.diplomanotes.polytechnicstudyhub;

import android.content.Context;
import android.content.SharedPreferences;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Stores the set of bookmarked pages (path + title) in {@link SharedPreferences}.
 *
 * Paths are stored in a {@code StringSet} preference; each bookmarked path also gets
 * its own {@code bookmark_title_<path>} entry holding the page title shown to the user.
 */
public final class BookmarkManager {

    private static final String PREFS_NAME = "poly_pmna_prefs";
    private static final String KEY_BOOKMARKED_PATHS = "bookmarked_paths";
    private static final String TITLE_PREFIX = "bookmark_title_";

    private final SharedPreferences prefs;

    public BookmarkManager(Context context) {
        this.prefs = context.getApplicationContext()
                .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    /** Shared preferences backing this manager, also used by MainActivity for other flags (e.g. dark mode). */
    public SharedPreferences preferences() {
        return prefs;
    }

    public boolean isBookmarked(String path) {
        return path != null && bookmarkedPaths().contains(path);
    }

    /** Adds the bookmark if absent, removes it if already present. */
    public void toggleBookmark(String path, String title) {
        if (path == null) {
            return;
        }
        Set<String> paths = new LinkedHashSet<>(bookmarkedPaths());
        SharedPreferences.Editor editor = prefs.edit();
        if (paths.remove(path)) {
            editor.remove(TITLE_PREFIX + path);
        } else {
            paths.add(path);
            editor.putString(TITLE_PREFIX + path, title == null || title.trim().isEmpty() ? path : title);
        }
        editor.putStringSet(KEY_BOOKMARKED_PATHS, paths);
        editor.apply();
    }

    public void removeBookmark(String path) {
        if (path == null) {
            return;
        }
        Set<String> paths = new LinkedHashSet<>(bookmarkedPaths());
        if (paths.remove(path)) {
            prefs.edit()
                    .putStringSet(KEY_BOOKMARKED_PATHS, paths)
                    .remove(TITLE_PREFIX + path)
                    .apply();
        }
    }

    public List<Bookmark> listBookmarks() {
        List<Bookmark> result = new ArrayList<>();
        for (String path : bookmarkedPaths()) {
            String title = prefs.getString(TITLE_PREFIX + path, path);
            result.add(new Bookmark(path, title));
        }
        return result;
    }

    private Set<String> bookmarkedPaths() {
        return prefs.getStringSet(KEY_BOOKMARKED_PATHS, Collections.emptySet());
    }

    /** A single bookmarked page. */
    public static final class Bookmark {
        public final String path;
        public final String title;

        public Bookmark(String path, String title) {
            this.path = path;
            this.title = title;
        }
    }
}
