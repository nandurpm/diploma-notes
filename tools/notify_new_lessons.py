#!/usr/bin/env python3
"""Send one FCM topic notification for each newly added POLY PMNA lesson HTML file."""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path
from typing import Any

import requests
from google.auth.transport.requests import Request
from google.oauth2 import service_account

SITE = "https://polypmna.dpdns.org"
FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging"
LESSON_RE = re.compile(r"lessons-([A-Za-z0-9]+)\.html$")
TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.I | re.S)
H1_RE = re.compile(r"<h1[^>]*>(.*?)</h1>", re.I | re.S)
TAG_RE = re.compile(r"<[^>]+>")


def clean_text(value: str) -> str:
    value = html.unescape(TAG_RE.sub(" ", value or ""))
    return re.sub(r"\s+", " ", value).strip()


def subject_name(path: Path, code: str) -> str:
    source = path.read_text(encoding="utf-8", errors="ignore")
    for pattern in (H1_RE, TITLE_RE):
        match = pattern.search(source)
        if not match:
            continue
        name = clean_text(match.group(1))
        name = re.split(r"\s+[|—–-]\s+", name, maxsplit=1)[0].strip()
        name = re.sub(rf"\b{re.escape(code)}\b", "", name, flags=re.I).strip(" ·:-|")
        if name and len(name) >= 3:
            return name[:100]
    return f"Subject {code}"


def revision_and_url(path: Path) -> tuple[str, str]:
    relative = path.as_posix().lstrip("./")
    revision = "REV2026" if relative.startswith("revision-2026-content/") else "REV2021"
    return revision, f"{SITE}/{relative}"


def load_log(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"schemaVersion": 1, "sent": {}}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict) or not isinstance(data.get("sent"), dict):
            raise ValueError("invalid notification log")
        return data
    except Exception:
        return {"schemaVersion": 1, "sent": {}}


def credentials(service_account_path: Path):
    creds = service_account.Credentials.from_service_account_file(
        service_account_path,
        scopes=[FCM_SCOPE],
    )
    creds.refresh(Request())
    return creds


def send_message(creds, project_id: str, payload: dict[str, Any]) -> str:
    endpoint = f"https://fcm.googleapis.com/v1/projects/{project_id}/messages:send"
    response = requests.post(
        endpoint,
        headers={
            "Authorization": f"Bearer {creds.token}",
            "Content-Type": "application/json; charset=UTF-8",
        },
        json={"message": payload},
        timeout=30,
    )
    if not response.ok:
        raise RuntimeError(f"FCM HTTP {response.status_code}: {response.text[:500]}")
    body = response.json()
    return str(body.get("name") or "sent")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("paths", nargs="+", help="Newly added lesson HTML paths")
    parser.add_argument("--service-account", required=True, type=Path)
    parser.add_argument("--log", default="notifications/new-lessons-log.json", type=Path)
    parser.add_argument("--topic", default="new-lessons")
    args = parser.parse_args()

    account_data = json.loads(args.service_account.read_text(encoding="utf-8"))
    project_id = str(account_data.get("project_id") or "").strip()
    if not project_id:
        raise SystemExit("Firebase service account JSON has no project_id.")

    creds = credentials(args.service_account)
    log = load_log(args.log)
    sent = log.setdefault("sent", {})
    new_count = 0

    for raw_path in args.paths:
        lesson_path = Path(raw_path)
        if not lesson_path.is_file():
            print(f"Skipping missing path: {lesson_path}", file=sys.stderr)
            continue
        match = LESSON_RE.search(lesson_path.name)
        if not match:
            print(f"Skipping non-standard lesson filename: {lesson_path}", file=sys.stderr)
            continue

        code = match.group(1).upper()
        revision, url = revision_and_url(lesson_path)
        key = f"{revision}:{code}:{lesson_path.as_posix()}"
        if key in sent:
            print(f"Already notified: {key}")
            continue

        name = subject_name(lesson_path, code)
        title = f"New {revision} Lesson Available"
        body = f"{name} · {code} is now available on POLY PMNA."

        # Data-only delivery ensures the Android service creates the notification
        # and the tap always opens the exact lesson URL in the native WebView.
        message = {
            "topic": args.topic,
            "data": {
                "title": title,
                "body": body,
                "url": url,
                "subjectCode": code,
                "revision": revision,
                "contentType": "lesson",
            },
            "android": {
                "priority": "high",
                "ttl": "86400s",
                "collapse_key": f"lesson-{revision.lower()}-{code.lower()}",
            },
        }
        message_id = send_message(creds, project_id, message)
        sent[key] = {
            "messageId": message_id,
            "subjectCode": code,
            "subjectName": name,
            "revision": revision,
            "url": url,
        }
        new_count += 1
        print(f"Notification sent: {revision} {code} {name} -> {message_id}")

    args.log.parent.mkdir(parents=True, exist_ok=True)
    args.log.write_text(json.dumps(log, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Sent {new_count} new lesson notification(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
