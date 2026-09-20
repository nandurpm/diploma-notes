#!/usr/bin/env python3
"""Prerender the Blog & GK catalogue from data/blog-index.json.

The generated HTML remains useful without JavaScript; assets/js/blog.js only
progressively enhances it with filtering and live Supabase-published posts.
"""
from __future__ import annotations

import argparse
import html
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "blog.html"
INDEX = ROOT / "data/blog-index.json"
ALLOWED = {"Study Topics", "General Knowledge", "Daily Blogs", "Exam Tips", "Announcements"}


def esc(value: object) -> str:
    return html.escape(str(value or ""), quote=True)


def load_posts() -> list[dict]:
    raw = json.loads(INDEX.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise ValueError("data/blog-index.json must contain an array")
    posts: list[dict] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or "").strip()
        summary = str(item.get("summary") or "").strip()
        url = str(item.get("url") or "").strip()
        date = str(item.get("date") or "").strip()
        category = str(item.get("category") or "Announcements").strip()
        if category not in ALLOWED:
            category = "Announcements"
        if not title or not summary or not url.startswith("/") or not date:
            continue
        try:
            stamp = datetime.fromisoformat(date.replace("Z", "+00:00"))
            if stamp.tzinfo is None:
                stamp = stamp.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
        post = dict(item)
        post.update(title=title, summary=summary, url=url, date=date, category=category, _stamp=stamp.timestamp())
        posts.append(post)
    return sorted(posts, key=lambda p: (-p["_stamp"], p["title"].casefold()))


def display_date(value: str) -> str:
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return f"{dt.day} {dt.strftime('%b %Y')}"


def media(post: dict, featured: bool) -> str:
    cls = "blog-featured-media" if featured else "blog-card-media"
    thumb = str(post.get("thumbnail") or "").strip()
    if thumb.startswith("/"):
        alt = esc(post.get("thumbnailAlt") or post["title"])
        loading = "eager" if featured else "lazy"
        return f'<div class="{cls}"><img src="{esc(thumb)}" alt="{alt}" loading="{loading}" decoding="async"></div>'
    mark = "GK" if post["category"] == "General Knowledge" else "P"
    return f'<div class="{cls}"><span class="blog-media-mark" aria-hidden="true">{mark}</span></div>'


def meta(post: dict) -> str:
    return f'<div class="blog-meta-row"><span class="blog-category-pill">{esc(post["category"])}</span><time datetime="{esc(post["date"])}">{esc(display_date(post["date"]))}</time></div>'


def featured_html(post: dict) -> str:
    return (
        '<article class="blog-featured-card">'
        + media(post, True)
        + '<div class="blog-featured-copy">'
        + meta(post)
        + f'<h2>{esc(post["title"])}</h2><p>{esc(post["summary"])}</p>'
        + f'<a class="blog-read-link" href="{esc(post["url"])}" aria-label="Read featured post: {esc(post["title"])}">Read featured post <span aria-hidden="true">→</span></a>'
        + '</div></article>'
    )


def card_html(post: dict) -> str:
    return (
        '<article class="blog-card">'
        + media(post, False)
        + '<div class="blog-card-body">'
        + meta(post)
        + f'<h3><a class="blog-card-title-link" href="{esc(post["url"])}">{esc(post["title"])}</a></h3>'
        + f'<p>{esc(post["summary"])}</p>'
        + f'<a class="blog-read-link" href="{esc(post["url"])}" aria-label="Read article: {esc(post["title"])}">Read article <span aria-hidden="true">→</span></a>'
        + '</div></article>'
    )


def public_payload(posts: list[dict]) -> str:
    cleaned = []
    for post in posts:
        cleaned.append({k: v for k, v in post.items() if k != "_stamp"})
    return json.dumps(cleaned, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


def render(source: str, posts: list[dict]) -> str:
    count = len(posts)
    newest = display_date(posts[0]["date"]) if posts else "No posts yet"
    featured = next((p for p in posts if p.get("featured") is True), posts[0] if posts else None)
    cards = "".join(card_html(p) for p in posts)
    featured_block = featured_html(featured) if featured else '<div class="blog-empty">No published posts yet.</div>'
    list_block = cards or '<div class="blog-empty">No published posts yet.</div>'

    source = re.sub(r'(<strong id="blog-post-count">).*?(</strong>)', rf'\g<1>{count}\2', source, count=1, flags=re.S)
    source = re.sub(r'(<strong id="blog-newest-date">).*?(</strong>)', rf'\g<1>{esc(newest)}\2', source, count=1, flags=re.S)
    source = re.sub(r'(<p id="blog-status"[^>]*>).*?(</p>)', rf'\g<1>{count} {"post" if count == 1 else "posts"} shown.\2', source, count=1, flags=re.S)
    if '<div id="blog-featured" class="blog-featured"' in source:
        source = re.sub(r'(<div id="blog-featured" class="blog-featured" aria-live="polite">).*?(</div></section>\s*<section class="blog-section" aria-labelledby="latest-heading">)', lambda m: m.group(1) + featured_block + m.group(2), source, count=1, flags=re.S)
    source = re.sub(r'(<div id="blog-list" class="blog-grid">).*?(</div>\s*<noscript>)', lambda m: m.group(1) + list_block + m.group(2), source, count=1, flags=re.S)
    payload = public_payload(posts)
    source = re.sub(r'(<script id="blog-prerender-data" type="application/json">).*?(</script>)', lambda m: m.group(1) + payload + m.group(2), source, count=1, flags=re.S)
    return source


def check_prerender(source: str, posts: list[dict]) -> list[str]:
    """Check observable prerender content, not insignificant formatting.

    The source may be human-formatted differently from this generator. CI should
    fail only when the initial HTML no longer contains the catalogue data users
    and crawlers need before JavaScript executes.
    """
    failures: list[str] = []
    count = len(posts)
    count_match = re.search(r'<strong id="blog-post-count">([^<]*)</strong>', source)
    if not count_match or count_match.group(1).strip() != str(count):
        failures.append(f"blog-post-count must be {count}")
    expected_newest = display_date(posts[0]["date"]) if posts else "No posts yet"
    newest_match = re.search(r'<strong id="blog-newest-date">([^<]*)</strong>', source)
    if not newest_match or html.unescape(newest_match.group(1).strip()) != expected_newest:
        failures.append(f"blog-newest-date must be {expected_newest}")
    for post in posts:
        title = esc(post["title"])
        url = esc(post["url"])
        if title not in source:
            failures.append(f"missing prerendered title: {post['title']}")
        if f'href="{url}"' not in source:
            failures.append(f"missing prerendered URL: {post['url']}")
    payload_match = re.search(r'<script id="blog-prerender-data" type="application/json">(.*?)</script>', source, re.S)
    if not payload_match:
        failures.append("missing blog-prerender-data payload")
    else:
        try:
            embedded = json.loads(payload_match.group(1).replace("<\\/", "</"))
            expected_keys = {(str(p.get("slug") or ""), p["url"]) for p in posts}
            actual_keys = {(str(p.get("slug") or ""), str(p.get("url") or "")) for p in embedded if isinstance(p, dict)}
            if not expected_keys.issubset(actual_keys):
                failures.append("embedded prerender data is missing one or more static posts")
        except (ValueError, TypeError):
            failures.append("blog-prerender-data is not valid JSON")
    if "Loading posts" in source or "Loading the featured post" in source:
        failures.append("blog.html still contains JS-only loading placeholders")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    current = PAGE.read_text(encoding="utf-8")
    posts = load_posts()
    if args.check:
        failures = check_prerender(current, posts)
        if failures:
            print("blog.html prerender validation failed:")
            for failure in failures:
                print(f"- {failure}")
            return 1
        print("blog.html contains a complete static prerender for data/blog-index.json.")
        return 0
    PAGE.write_text(render(current, posts), encoding="utf-8")
    print("Updated blog.html prerender from data/blog-index.json.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
