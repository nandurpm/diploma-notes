#!/usr/bin/env python3
"""Send one FCM notification for each newly published POLY PMNA blog post."""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path
from typing import Any
from urllib.parse import quote

import requests
from google.auth.transport.requests import Request
from google.oauth2 import service_account

SITE = "https://polypmna.dpdns.org"
FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging"
RETRYABLE_FCM_STATUS = {429, 500, 502, 503, 504}
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def compact_text(value: Any, limit: int) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    if len(text) <= limit:
        return text
    return text[: max(1, limit - 1)].rstrip() + "…"


def load_log(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise SystemExit(
            f"Could not read notification log {path}: {error}. "
            "Refusing to run to avoid re-sending old blog notifications."
        ) from error
    if not isinstance(data, dict) or not isinstance(data.get("sent"), dict):
        raise SystemExit(
            f"Notification log {path} is malformed (missing 'sent' map). "
            "Refusing to run to avoid re-sending old blog notifications."
        )
    return data


def persist_log(path: Path, log: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(log, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def fetch_published_posts(supabase_url: str, publishable_key: str) -> list[dict[str, Any]]:
    endpoint = f"{supabase_url.rstrip('/')}/rest/v1/blog_posts"
    params = {
        "status": "eq.published",
        "select": "id,slug,title,category,summary,published_at",
        "order": "published_at.asc.nullslast,id.asc",
    }
    headers = {
        "apikey": publishable_key,
        "Accept": "application/json",
    }

    posts: list[dict[str, Any]] = []
    page_size = 500
    start = 0
    while True:
        response = requests.get(
            endpoint,
            params=params,
            headers={**headers, "Range": f"{start}-{start + page_size - 1}"},
            timeout=30,
        )
        response.raise_for_status()
        page = response.json()
        if not isinstance(page, list):
            raise RuntimeError("Supabase blog_posts response was not a JSON array.")
        posts.extend(row for row in page if isinstance(row, dict))
        if len(page) < page_size:
            break
        start += page_size
    return posts


def credentials(service_account_path: Path):
    creds = service_account.Credentials.from_service_account_file(
        service_account_path,
        scopes=[FCM_SCOPE],
    )
    creds.refresh(Request())
    return creds


def send_message(creds, project_id: str, payload: dict[str, Any]) -> str:
    endpoint = f"https://fcm.googleapis.com/v1/projects/{project_id}/messages:send"
    headers = {
        "Authorization": f"Bearer {creds.token}",
        "Content-Type": "application/json; charset=UTF-8",
    }
    last_error: Exception | None = None

    for attempt in range(4):
        try:
            response = requests.post(
                endpoint,
                headers=headers,
                json={"message": payload},
                timeout=30,
            )
        except requests.RequestException as error:
            last_error = error
            if attempt == 3:
                break
            time.sleep(2**attempt)
            continue

        if response.ok:
            body = response.json()
            return str(body.get("name") or "sent")

        last_error = RuntimeError(
            f"FCM HTTP {response.status_code}: {response.text[:500]}"
        )
        if response.status_code not in RETRYABLE_FCM_STATUS or attempt == 3:
            break
        time.sleep(2**attempt)

    raise RuntimeError(f"FCM send failed after retries: {last_error}") from last_error


def post_record(post: dict[str, Any], url: str, *, baseline: bool = False, message_id: str | None = None) -> dict[str, Any]:
    record: dict[str, Any] = {
        "slug": str(post.get("slug") or ""),
        "title": str(post.get("title") or ""),
        "publishedAt": post.get("published_at"),
        "url": url,
    }
    if baseline:
        record["baseline"] = True
    if message_id:
        record["messageId"] = message_id
    return record


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--service-account", required=True, type=Path)
    parser.add_argument("--log", default="notifications/new-blog-posts-log.json", type=Path)
    parser.add_argument("--supabase-url", required=True)
    parser.add_argument("--supabase-key", required=True)
    parser.add_argument("--topic", default="all-users")
    args = parser.parse_args()

    try:
        posts = fetch_published_posts(args.supabase_url, args.supabase_key)
    except Exception as error:  # noqa: BLE001 - workflow should fail clearly
        raise SystemExit(f"Could not load published blog posts from Supabase: {error}") from error

    log = load_log(args.log)
    if log is None:
        # A missing log must never cause every historical post to be pushed again.
        # Establish a baseline and wait for a later run to notify only future posts.
        log = {"schemaVersion": 1, "sent": {}}
        sent = log["sent"]
        for post in posts:
            post_id = str(post.get("id") or "").strip()
            slug = str(post.get("slug") or "").strip()
            if not post_id or not SLUG_RE.fullmatch(slug):
                continue
            url = f"{SITE}/blog/post.html?slug={quote(slug, safe='')}"
            sent[post_id] = post_record(post, url, baseline=True)
        persist_log(args.log, log)
        print(f"Notification log did not exist; baselined {len(sent)} already-published post(s).")
        return 0

    account_data = json.loads(args.service_account.read_text(encoding="utf-8"))
    project_id = str(account_data.get("project_id") or "").strip()
    if not project_id:
        raise SystemExit("Firebase service account JSON has no project_id.")

    creds = credentials(args.service_account)
    sent: dict[str, Any] = log.setdefault("sent", {})
    new_count = 0
    failures: list[str] = []

    try:
        for post in posts:
            post_id = str(post.get("id") or "").strip()
            slug = str(post.get("slug") or "").strip()
            if not post_id:
                print("Skipping blog row without an id.", file=sys.stderr)
                continue
            if post_id in sent:
                print(f"Already notified: {post_id} ({slug})")
                continue
            if not SLUG_RE.fullmatch(slug):
                failures.append(post_id)
                print(f"Skipping invalid blog slug for {post_id}: {slug!r}", file=sys.stderr)
                continue

            post_title = compact_text(post.get("title"), 140) or "New POLY PMNA blog post"
            summary = compact_text(post.get("summary"), 220)
            category = compact_text(post.get("category"), 60)
            title = "New Blog & GK Post"
            body = post_title if not summary else f"{post_title} — {summary}"
            body = compact_text(body, 260)
            url = f"{SITE}/blog/post.html?slug={quote(slug, safe='')}"

            message = {
                "topic": args.topic,
                "notification": {
                    "title": title,
                    "body": body,
                },
                "data": {
                    "title": title,
                    "body": body,
                    "url": url,
                    "blogSlug": slug,
                    "category": category,
                    "contentType": "blog",
                },
                "android": {
                    "priority": "high",
                    "ttl": "86400s",
                    "collapse_key": f"blog-{post_id}",
                    "notification": {
                        "channel_id": "new_lessons",
                    },
                },
            }

            try:
                message_id = send_message(creds, project_id, message)
            except Exception as error:  # noqa: BLE001 - preserve successes and continue
                failures.append(post_id)
                print(f"Blog notification failed: {post_id} {post_title} -> {error}", file=sys.stderr)
                continue

            sent[post_id] = post_record(post, url, message_id=message_id)
            persist_log(args.log, log)
            new_count += 1
            print(f"Blog notification sent: {post_title} -> {message_id}")
    finally:
        persist_log(args.log, log)

    print(f"Sent {new_count} new blog notification(s).")
    if failures:
        print(f"{len(failures)} blog notification(s) failed: {', '.join(failures)}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
