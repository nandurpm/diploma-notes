package org.diplomanotes.polytechnicstudyhub;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.ComponentActivity;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Shows bookmarked and/or offline-cached pages. Tapping an entry finishes this
 * activity with the page path in the result Intent so MainActivity can navigate
 * to it; long-pressing removes the entry.
 */
public class SavedPagesActivity extends ComponentActivity {

    private BookmarkManager bookmarks;
    private OfflineCacheManager offlineCache;
    private ListView listView;
    private TextView emptyLabel;
    private final List<Entry> entries = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_saved_pages);

        bookmarks = new BookmarkManager(this);
        offlineCache = new OfflineCacheManager(getApplicationContext());

        listView = findViewById(R.id.savedPagesList);
        emptyLabel = findViewById(R.id.savedPagesEmpty);
        findViewById(R.id.savedPagesBack).setOnClickListener(v -> finish());

        loadEntries();
    }

    private void loadEntries() {
        Map<String, Entry> merged = new LinkedHashMap<>();
        for (BookmarkManager.Bookmark bookmark : bookmarks.listBookmarks()) {
            merged.put(bookmark.path, new Entry(bookmark.path, bookmark.title, true, false));
        }
        for (OfflineCacheManager.CachedPage page : offlineCache.listCachedPages()) {
            Entry existing = merged.get(page.path);
            String title = existing != null ? existing.title : page.title;
            merged.put(page.path, new Entry(page.path, title, existing != null, true));
        }
        entries.clear();
        entries.addAll(merged.values());

        if (entries.isEmpty()) {
            listView.setVisibility(View.GONE);
            emptyLabel.setVisibility(View.VISIBLE);
            return;
        }
        listView.setVisibility(View.VISIBLE);
        emptyLabel.setVisibility(View.GONE);

        List<String> labels = new ArrayList<>();
        for (Entry entry : entries) {
            StringBuilder label = new StringBuilder(entry.title);
            if (entry.bookmarked && entry.cachedOffline) {
                label.append("  \u2605 \u00B7 ").append(getString(R.string.saved_pages_offline_tag));
            } else if (entry.bookmarked) {
                label.append("  \u2605");
            } else if (entry.cachedOffline) {
                label.append("  \u00B7 ").append(getString(R.string.saved_pages_offline_tag));
            }
            labels.add(label.toString());
        }

        ArrayAdapter<String> adapter = new ArrayAdapter<>(
                this, android.R.layout.simple_list_item_1, labels
        );
        listView.setAdapter(adapter);
        listView.setOnItemClickListener((parent, view, position, id) -> openEntry(entries.get(position)));
        listView.setOnItemLongClickListener((parent, view, position, id) -> {
            removeEntry(entries.get(position));
            return true;
        });
    }

    private void openEntry(Entry entry) {
        Intent result = new Intent();
        result.putExtra("path", entry.path);
        setResult(RESULT_OK, result);
        finish();
    }

    private void removeEntry(Entry entry) {
        bookmarks.removeBookmark(entry.path);
        offlineCache.removeCachedPage(entry.path);
        Toast.makeText(this, R.string.saved_page_removed, Toast.LENGTH_SHORT).show();
        loadEntries();
    }

    private static final class Entry {
        final String path;
        final String title;
        final boolean bookmarked;
        final boolean cachedOffline;

        Entry(String path, String title, boolean bookmarked, boolean cachedOffline) {
            this.path = path;
            this.title = (title == null || title.trim().isEmpty()) ? path : title;
            this.bookmarked = bookmarked;
            this.cachedOffline = cachedOffline;
        }
    }
}
