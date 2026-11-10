# -*- coding: utf-8 -*-
"""Build the multi-page ORBIT review site."""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ROOT, "src"))

from content import DATA

BODY_START = re.compile(r"(?=<(?:header|main|div|section|nav|svg|article)\b)", re.I)


def js_json(obj):
    """JSON safe to embed inside a <script> block."""
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


def wrap(html, lang="zh-CN"):
    """Turn a source fragment into a complete HTML document (standards mode)."""
    text = html.lstrip("﻿\n ")
    if text.lower().startswith("<!doctype"):
        return html
    match = BODY_START.search(html)
    if not match:
        return html
    head = html[:match.start()].strip("\n")
    body = html[match.start():].strip("\n")
    return (
        "<!doctype html>\n<html lang=\"%s\">\n<head>\n%s\n</head>\n<body>\n%s\n</body>\n</html>\n"
        % (lang, head, body)
    )


def build_remote():
    tpl = open(os.path.join(ROOT, "src", "template.html"), encoding="utf-8").read()
    homework = json.load(open(os.path.join(ROOT, "src", "homework.json"), encoding="utf-8"))
    notes = json.load(open(os.path.join(ROOT, "src", "notes.json"), encoding="utf-8"))
    html = tpl.replace("__DATA__", js_json(DATA))
    html = html.replace("__HOMEWORK__", json.dumps(homework, ensure_ascii=False))
    html = html.replace("__NOTES__", json.dumps(notes, ensure_ascii=False))
    html = wrap(html)
    out = os.path.join(ROOT, "remote.html")
    open(out, "w", encoding="utf-8").write(html)
    print("built", out, len(html), "chars")


def build_python():
    tpl = open(os.path.join(ROOT, "src", "python_template.html"), encoding="utf-8").read()
    data = json.load(open(os.path.join(ROOT, "src", "python_questions.json"), encoding="utf-8"))
    topics = json.load(open(os.path.join(ROOT, "src", "python_topics.json"), encoding="utf-8"))
    html = tpl.replace("__PYDATA__", js_json(data))
    html = html.replace("__PYTOPICS__", js_json(topics))
    html = wrap(html)
    out = os.path.join(ROOT, "python.html")
    open(out, "w", encoding="utf-8").write(html)
    print("built", out, len(html), "chars,", len(data), "questions")


def write_redirect(out, target, title):
    html = ('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">'
            '<meta http-equiv="refresh" content="0;url=%s"><title>%s</title></head>'
            '<body><p>正在跳转到 <a href="%s">%s</a>…</p></body></html>'
            % (target, title, target, target))
    open(os.path.join(ROOT, out), "w", encoding="utf-8").write(html)
    print("redirect", out, "->", target)


def build_semesters():
    tpl = open(os.path.join(ROOT, "src", "semester_template.html"), encoding="utf-8").read()
    jobs = [
        ("大二下", "02—2", "大二下的课程还没定。先把大二上跑通；课程、作业、教材确定后，按同一套结构接进来。", "sem2-2.html"),
        ("大三上", "03—1", "大三上的课程还没定。这个页面先留位置，后续接课程、题库和电子书。", "sem3-1.html"),
        ("大三下", "03—2", "大三下的课程还没定。先把大二上和大三上跑通，再往这里接。", "sem3-2.html"),
    ]
    for sem, code, note, out in jobs:
        html = tpl.replace("__SEM__", sem).replace("__CODE__", code).replace("__NOTE__", note)
        html = html.replace('<a href="%s">%s</a>' % (out, sem), '<a class="active" href="%s">%s</a>' % (out, sem))
        html = wrap(html)
        path = os.path.join(ROOT, out)
        open(path, "w", encoding="utf-8").write(html)
        print("built", path, len(html), "chars")


def build_static(src, out):
    html = open(os.path.join(ROOT, "src", src), encoding="utf-8").read()
    html = wrap(html)
    path = os.path.join(ROOT, out)
    open(path, "w", encoding="utf-8").write(html)
    print("built", path, len(html), "chars")



def build_arcgis():
    tpl = open(os.path.join(ROOT, "src", "arcgis.html"), encoding="utf-8").read()
    data = json.load(open(os.path.join(ROOT, "src", "arcgis_bank.json"), encoding="utf-8"))
    course = json.load(open(os.path.join(ROOT, "src", "courses.json"), encoding="utf-8"))["arcgis"]
    for key, val in {
        "__TITLE__": course["title"],
        "__TAG__": course["tag"],
        "__CODE__": course["code"],
        "__EN__": course["en"],
        "__LEAD__": course["lead"],
        "__INTRO__": course["intro"],
        "__NOTICE__": course["notice"],
        "__ACCENT__": course["accent"],
    }.items():
        tpl = tpl.replace(key, val)
    tpl = tpl.replace("__ARCGIS__", js_json(data))
    html = wrap(tpl)
    out = os.path.join(ROOT, "arcgis.html")
    open(out, "w", encoding="utf-8").write(html)
    print("built", out, len(html), "chars,", len(data["bank"]), "questions")


def build_maogai():
    tpl = open(os.path.join(ROOT, "src", "maogai.html"), encoding="utf-8").read()
    course = json.load(open(os.path.join(ROOT, "src", "courses.json"), encoding="utf-8"))["maogai"]
    bank = json.load(open(os.path.join(ROOT, "src", "maogai_bank.json"), encoding="utf-8"))
    special = json.load(open(os.path.join(ROOT, "src", "maogai_special.json"), encoding="utf-8"))
    essay = json.load(open(os.path.join(ROOT, "src", "maogai_essay.json"), encoding="utf-8"))
    for key, val in {
        "__TITLE__": course["title"],
        "__TAG__": course["tag"],
        "__CODE__": course["code"],
        "__EN__": course["en"],
        "__LEAD__": course["lead"],
        "__INTRO__": course["intro"],
        "__NOTICE__": course["notice"],
        "__ACCENT__": course["accent"],
        "__DESC__": "%s 大二上复习模块：考试重点、章节勾画与资料。Orbit 地信学习站。" % course["title"],
    }.items():
        tpl = tpl.replace(key, val)
    tpl = tpl.replace("__COURSE__", js_json(course))
    tpl = tpl.replace("__MAOGAI_BANK__", js_json(bank))
    tpl = tpl.replace("__MAOGAI_SPECIAL__", js_json(special))
    tpl = tpl.replace("__MAOGAI_ESSAY__", js_json(essay))
    html = wrap(tpl)
    out = os.path.join(ROOT, "maogai.html")
    open(out, "w", encoding="utf-8").write(html)
    print("built", out, len(html), "chars,", len(bank["items"]), "choice questions")


def build_python_guide():
    tpl = open(os.path.join(ROOT, "src", "python-guide.html"), encoding="utf-8").read()
    guide = json.load(open(os.path.join(ROOT, "src", "python_guide.json"), encoding="utf-8"))
    topics = json.load(open(os.path.join(ROOT, "src", "python_topics.json"), encoding="utf-8"))
    tpl = tpl.replace("__PYGUIDE__", js_json(guide)).replace("__PYTOPICS__", js_json(topics))
    html = wrap(tpl)
    out = os.path.join(ROOT, "python-guide.html")
    open(out, "w", encoding="utf-8").write(html)
    print("built", out, len(html), "chars")


def _infer_opensource_category(repo):
    text = " ".join([
        " ".join(repo.get("topics") or []),
        repo.get("description") or "",
        repo.get("name") or "",
    ]).lower()
    if any(k in text for k in ("claude", "skill", "agent")):
        return "skills"
    if any(k in text for k in ("education", "study", "quiz", "exam", "gis", "remote-sensing", "learning", "campus", "course")):
        return "study"
    if any(k in text for k in ("library", "audio", "wav", "toolkit", "sdk", "parser", "moonbit")):
        return "library"
    if any(k in text for k in ("desktop", "reader", "assistant", "local-first", "windows", "app")):
        return "app"
    return "other"


def build_opensource():
    """Build the open-source showcase page, merging curated text with the latest snapshot."""
    data = json.load(open(os.path.join(ROOT, "src", "opensource_projects.json"), encoding="utf-8"))
    snapshot_path = os.path.join(ROOT, "src", "opensource_snapshot.json")
    if os.path.exists(snapshot_path):
        snap = json.load(open(snapshot_path, encoding="utf-8"))
        repos = [r for r in (snap.get("repos") or []) if r.get("name") and not r.get("fork") and not r.get("archived")]
        by_repo = {p["repo"].lower(): p for p in data["projects"]}
        added = 0
        for r in repos:
            key = r["name"].lower()
            p = by_repo.get(key)
            lic = r.get("license") or ""
            if p:
                p["stars"] = r.get("stargazers_count", p.get("stars", 0))
                if r.get("language"):
                    p["language"] = r["language"]
                if r.get("homepage"):
                    p["site"] = r["homepage"]
                if r.get("pushed_at"):
                    p["updated"] = r["pushed_at"]
                if r.get("topics"):
                    p["topics"] = list(r["topics"])
                if lic and not p.get("license"):
                    p["license"] = lic
                continue
            desc = (r.get("description") or "").strip()
            item = {
                "repo": r["name"],
                "category": _infer_opensource_category(r),
                "title": r["name"],
                "subtitle": desc.split("。")[0].split(".")[0][:80] or "GitHub 新项目",
                "description": desc or "这个仓库还没有填写简介。",
                "highlights": [],
                "tags": list(r.get("topics") or [])[:5],
                "topics": list(r.get("topics") or []),
                "language": r.get("language") or "",
                "license": lic,
                "site": r.get("homepage") or "",
                "stars": r.get("stargazers_count") or 0,
                "featured": False,
                "order": 900 + added,
                "updated": r.get("pushed_at") or "",
                "_new": True,
            }
            added += 1
            data["projects"].append(item)
        data["synced_at"] = snap.get("synced_at") or ""
        if data["synced_at"]:
            data["updated"] = data["synced_at"][:10]
    else:
        data["synced_at"] = data.get("synced_at") or data.get("updated", "")
    js = "window.ORBIT_OPENSOURCE = " + js_json(data) + ";\n"
    data_path = os.path.join(ROOT, "assets", "opensource-data.js")
    open(data_path, "w", encoding="utf-8").write(js)
    print("built", data_path, len(js), "chars,", len(data["projects"]), "projects")
    build_static("opensource.html", "opensource.html")

def build_courses():
    tpl = open(os.path.join(ROOT, "src", "course_template.html"), encoding="utf-8").read()
    courses = json.load(open(os.path.join(ROOT, "src", "courses.json"), encoding="utf-8"))
    bank_files = {
        "nature-geo": "nature_bank.json",
        "probability": "probability_bank.json",
    }
    for slug, c in courses.items():
        if slug in ("arcgis", "maogai"):
            continue
        practice = c.get("practice") or {}
        bank = None
        bank_path = bank_files.get(slug)
        if bank_path:
            bank_path = os.path.join(ROOT, "src", bank_path)
            if os.path.exists(bank_path):
                bank = json.load(open(bank_path, encoding="utf-8"))
        bank_total = len(bank.get("items", [])) if bank else 0
        html = tpl
        for key, val in {
            "__TITLE__": c["title"],
            "__TAG__": c["tag"],
            "__CODE__": c["code"],
            "__EN__": c["en"],
            "__LEAD__": c["lead"],
            "__INTRO__": c["intro"],
            "__NOTICE__": c["notice"],
            "__ACCENT__": c["accent"],
            "__DESC__": "%s 大二上复习模块：考试重点、章节勾画与资料。Orbit 地信学习站。" % c["title"],
            "__SLUG__": slug,
            "__PRACTICE_TOTAL__": str(bank_total),
            "__PRACTICE_DESC__": practice.get("desc", "按章节刷题；答错自动进错题本。"),
            "__PRACTICE_NOTE__": practice.get("note", "题目为自编自测，不是学校官方题。"),
        }.items():
            html = html.replace(key, val)
        course = dict(c)
        course["_slug"] = slug
        html = html.replace("__COURSE__", json.dumps(course, ensure_ascii=False))
        html = html.replace("__COURSE_BANK__", js_json(bank))
        html = wrap(html)
        out = os.path.join(ROOT, slug + ".html")
        open(out, "w", encoding="utf-8").write(html)
        print("built", out, len(html), "chars,", bank_total, "practice questions")

if __name__ == "__main__":
    build_remote()
    build_python()
    build_static("landing.html", "index.html")
    build_static("semesters.html", "semesters.html")
    build_static("competitions.html", "competitions.html")
    build_static("bw-talk.html", "bw-talk.html")
    build_static("bw-admin.html", "bw-admin.html")
    build_static("ebook.html", "ebook.html")
    build_courses()
    build_static("nature-notes.html", "nature-notes.html")
    build_arcgis()
    build_maogai()
    build_python_guide()
    build_opensource()
    build_static("sem2-1.html", "sem2-1.html")
    build_static("kaoyan-remote.html", "kaoyan-remote.html")
    build_static("zero-remote.html", "zero-remote.html")
    build_static("zero-python.html", "zero-python.html")
    build_semesters()
    # legacy URLs: keep old links from confusion / old bookmarks working
    write_redirect("modules.html", "sem2-1.html", "Orbit 大二上")
    write_redirect("kaoyan.html", "kaoyan-remote.html", "Orbit 考研 · 遥感")
    write_redirect("zero.html", "sem2-1.html", "Orbit 大二上")
