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
    return json.dumps(obj, ensure_ascii=False).replace("</", "<\\/")


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
    html = tpl.replace("__DATA__", json.dumps(DATA, ensure_ascii=False))
    html = html.replace("__HOMEWORK__", json.dumps(homework, ensure_ascii=False))
    html = html.replace("__NOTES__", json.dumps(notes, ensure_ascii=False))
    html = wrap(html)
    out = os.path.join(ROOT, "remote.html")
    open(out, "w", encoding="utf-8").write(html)
    print("built", out, len(html), "chars")


def build_python():
    tpl = open(os.path.join(ROOT, "src", "python_template.html"), encoding="utf-8").read()
    data = json.load(open(os.path.join(ROOT, "src", "python_questions.json"), encoding="utf-8"))
    html = tpl.replace("__PYDATA__", json.dumps(data, ensure_ascii=False))
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


def build_courses():
    tpl = open(os.path.join(ROOT, "src", "course_template.html"), encoding="utf-8").read()
    courses = json.load(open(os.path.join(ROOT, "src", "courses.json"), encoding="utf-8"))
    for slug, c in courses.items():
        if slug in ("arcgis", "maogai"):
            continue
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
        }.items():
            html = html.replace(key, val)
        html = html.replace("__COURSE__", json.dumps(c, ensure_ascii=False))
        html = wrap(html)
        out = os.path.join(ROOT, slug + ".html")
        open(out, "w", encoding="utf-8").write(html)
        print("built", out, len(html), "chars")

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
    build_arcgis()
    build_maogai()
    build_python_guide()
    build_static("sem2-1.html", "sem2-1.html")
    build_static("kaoyan-remote.html", "kaoyan-remote.html")
    build_static("zero-remote.html", "zero-remote.html")
    build_static("zero-python.html", "zero-python.html")
    build_semesters()
    # legacy URLs: keep old links from confusion / old bookmarks working
    write_redirect("modules.html", "sem2-1.html", "Orbit 大二上")
    write_redirect("kaoyan.html", "kaoyan-remote.html", "Orbit 考研 · 遥感")
    write_redirect("zero.html", "sem2-1.html", "Orbit 大二上")
