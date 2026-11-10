# -*- coding: utf-8 -*-
"""Fetch bw448's public GitHub repositories into a local snapshot.

Used by .github/workflows/sync-opensource.yml. The snapshot is merged into
assets/opensource-data.js by build.py; the runtime page can then refresh from
the GitHub API when available, but never depends on it.
"""
import datetime
import json
import os
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CURATED = ROOT / "src" / "opensource_projects.json"
SNAPSHOT = ROOT / "src" / "opensource_snapshot.json"


def main():
    data = json.loads(CURATED.read_text(encoding="utf-8"))
    user = data.get("user", "bw448")
    url = "https://api.github.com/users/%s/repos?per_page=100&sort=updated" % user
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "orbit-opensource-sync",
        },
    )
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        req.add_header("Authorization", "Bearer " + token)

    with urllib.request.urlopen(req, timeout=30) as resp:
        repos = json.load(resp)
    if not isinstance(repos, list) or not repos:
        raise SystemExit("GitHub returned no repositories; refusing to overwrite the snapshot.")

    clean = []
    for r in repos:
        lic = r.get("license") or {}
        clean.append({
            "name": r.get("name", ""),
            "description": r.get("description") or "",
            "stargazers_count": r.get("stargazers_count") or 0,
            "language": r.get("language") or "",
            "homepage": r.get("homepage") or "",
            "topics": r.get("topics") or [],
            "pushed_at": r.get("pushed_at") or "",
            "fork": bool(r.get("fork")),
            "archived": bool(r.get("archived")),
            "html_url": r.get("html_url") or "",
            "license": lic.get("spdx_id") if lic.get("spdx_id") != "NOASSERTION" else "",
        })

    def stable(repos):
        # pushed_at changes whenever the workflow commits to Bw_Orbit; ignore it
        # for the change check so the snapshot does not self-trigger a commit loop.
        return [{k: v for k, v in r.items() if k != "pushed_at"} for r in repos]

    previous = {}
    if SNAPSHOT.exists():
        try:
            previous = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
        except Exception:
            previous = {}
    if stable(previous.get("repos") or []) == stable(clean):
        print("No repository changes; snapshot left untouched.")
        return

    now = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0)
    snapshot = {
        "user": user,
        "synced_at": now.isoformat().replace("+00:00", "Z"),
        "repos": clean,
    }
    SNAPSHOT.write_text(json.dumps(snapshot, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("wrote", SNAPSHOT, len(clean), "repos", snapshot["synced_at"])


if __name__ == "__main__":
    main()
