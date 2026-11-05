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
    html = tpl.replace("__DATA__", json.dumps(DATA, ensure_ascii=False))
    html = html.replace("__HOMEWORK__", json.dumps(homework, ensure_ascii=False))
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


if __name__ == "__main__":
    build_remote()
    build_python()
    build_static("hub.html", "index.html")
    build_static("ebook.html", "ebook.html")
    build_static("sem2-1.html", "sem2-1.html")
    build_static("kaoyan-remote.html", "kaoyan-remote.html")
    build_static("zero-remote.html", "zero-remote.html")
    build_static("zero-python.html", "zero-python.html")
    build_semesters()
    # legacy URLs: keep old links from confusion / old bookmarks working
    write_redirect("modules.html", "sem2-1.html", "ORBIT 大二上")
    write_redirect("kaoyan.html", "kaoyan-remote.html", "ORBIT 考研 · 遥感")
    write_redirect("zero.html", "sem2-1.html", "ORBIT 大二上")
