# -*- coding: utf-8 -*-
"""Validate Orbit data files and local links before/after a build.

Run: python tools/check_site.py
Exit code 1 if any hard error is found.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ERRORS = []
WARNS = []


def err(msg):
    ERRORS.append(msg)


def warn(msg):
    WARNS.append(msg)


def load(name):
    path = os.path.join(ROOT, "src", name)
    try:
        return json.load(open(path, encoding="utf-8"))
    except Exception as e:
        err("%s: %s" % (name, e))
        return None


def check_arcgis():
    d = load("arcgis_bank.json")
    if not d:
        return
    ids = set()
    for x in d.get("bank", []):
        qid = x.get("id", "")
        if qid in ids:
            err("arcgis duplicate id " + qid)
        ids.add(qid)
        if x.get("type") == "fill":
            if x.get("q", "").count("____") != len(x.get("answers", [])):
                err("arcgis %s blank/answer mismatch" % qid)
        elif x.get("type") == "single":
            if not isinstance(x.get("answer"), int) or not 0 <= x["answer"] < len(x.get("options", [])):
                err("arcgis %s bad answer index" % qid)
        elif x.get("type") == "judge":
            if not isinstance(x.get("answer"), bool):
                err("arcgis %s judge answer not bool" % qid)
        if len(x.get("options", [])) not in (0, 4):
            warn("arcgis %s has %d options" % (qid, len(x.get("options", []))))
    for arr, name in (("short", "short"), ("analysis", "analysis")):
        for x in d.get(arr, []):
            if not x.get("q") or not x.get("answer"):
                err("arcgis %s %s missing q/answer" % (name, x.get("id")))
    print("arcgis:", len(d.get("bank", [])), "objective,", len(d.get("short", [])), "short,", len(d.get("analysis", [])), "analysis,", len(d.get("terms", [])), "terms")


def check_maogai():
    d = load("maogai_bank.json")
    if d:
        ids = set()
        for x in d.get("items", []):
            qid = x.get("id", "")
            if qid in ids:
                err("maogai duplicate id " + qid)
            ids.add(qid)
            if len(x.get("options", [])) != 4:
                err("maogai %s has %d options" % (qid, len(x.get("options", []))))
            if not x.get("answer") or max(x["answer"]) >= len(x.get("options", [])):
                err("maogai %s bad answer index" % qid)
            if not x.get("q", "").strip():
                err("maogai %s empty stem" % qid)
        print("maogai:", len(d.get("items", [])), "items", d.get("meta", {}))
    s = load("maogai_special.json")
    if s:
        if len(s.get("real", [])) != s.get("meta", {}).get("real"):
            err("maogai_special real != meta.real")
        for x in s.get("real", []):
            if len(x.get("options", [])) != 4 or not x.get("answer"):
                err("maogai_special %s bad options/answer" % x.get("id"))
        print("maogai special:", len(s.get("points", [])), "points,", len(s.get("real", [])), "real,", len(s.get("confusions", [])), "confusions")
    e = load("maogai_essay.json")
    if e:
        if len(e.get("items", [])) < 100:
            err("maogai_essay too few items")
        for x in e.get("items", []):
            if not x.get("q") or not x.get("points"):
                err("maogai_essay %s missing q/points" % x.get("id"))
        print("maogai essays:", len(e.get("items", [])), "items")


def check_course_bank(name):
    d = load(name)
    if not d:
        return
    ids = set()
    for x in d.get("items", []):
        qid = x.get("id", "")
        if qid in ids:
            err("%s duplicate id %s" % (name, qid))
        ids.add(qid)
        t = x.get("type")
        if t == "fill":
            if x.get("q", "").count("____") != len(x.get("answers", [])):
                err("%s %s blank/answer mismatch" % (name, qid))
        elif t in ("single", "multi"):
            opts = x.get("options", [])
            ans = x.get("answer", [])
            if len(opts) != 4:
                err("%s %s has %d options" % (name, qid, len(opts)))
            if not ans or any(not isinstance(i, int) or not 0 <= i < len(opts) for i in ans):
                err("%s %s bad answer index" % (name, qid))
            if t == "single" and len(ans) != 1:
                err("%s %s single answer not one index" % (name, qid))
        elif t == "judge":
            if not isinstance(x.get("answer"), bool):
                err("%s %s judge answer not bool" % (name, qid))
        else:
            err("%s %s unknown type %r" % (name, qid, t))
        if not x.get("q", "").strip():
            err("%s %s empty stem" % (name, qid))
    print(name + ":", len(d.get("items", [])), "items")


def check_appendix():
    path = os.path.join(ROOT, "assets", "rs-appendix-data.js")
    if not os.path.exists(path):
        err("missing assets/rs-appendix-data.js")
        return
    text = open(path, encoding="utf-8").read()
    try:
        data = json.loads(text[text.index("{"):text.rindex(";")])
    except Exception as e:
        err("rs-appendix-data.js: %s" % e)
        return
    ids = set()
    for key in ("app3", "app4"):
        for x in data.get(key, []):
            qid = x.get("id", "")
            if not qid or qid in ids:
                err("appendix duplicate/empty id %r" % qid)
            ids.add(qid)
            if key == "app3":
                if not (x.get("abbr") or x.get("en")) or not x.get("zh"):
                    warn("appendix %s missing prompt/answer" % qid)
            else:
                if not x.get("en") or not x.get("zh"):
                    err("appendix %s missing en/zh" % qid)
            if not isinstance(x.get("page"), int):
                err("appendix %s page not int" % qid)
    print("appendix:", len(data.get("app3", [])), "app3 +", len(data.get("app4", [])), "app4 =", len(data.get("app3", [])) + len(data.get("app4", [])))


def check_python():
    qs = load("python_questions.json")
    if not qs:
        return
    if len(qs) != 599:
        err("python questions != 599: %d" % len(qs))
    ids = set()
    for q in qs:
        if q.get("id") in ids:
            err("python duplicate id " + q.get("id", ""))
        ids.add(q.get("id"))
        if q.get("type") in ("single", "multiple") and not q.get("options"):
            err("python %s missing options" % q.get("id"))
    print("python:", len(qs), "questions")
    t = load("python_topics.json")
    if t and sum(t.get("counts", {}).values()) != 599:
        warn("python_topics counts sum %d != 599" % sum(t.get("counts", {}).values()))


def check_links():
    pages = [f for f in os.listdir(ROOT) if f.endswith(".html") and not f.startswith("_qa")]
    missing = 0
    for page in pages:
        text = open(os.path.join(ROOT, page), encoding="utf-8").read()
        for m in re.finditer(r'(?:href|src)="([^"]+)"', text):
            url = m.group(1)
            if not url or url.startswith(("#", "http", "mailto:", "javascript:", "data:")):
                continue
            if any(ch in url for ch in "'\"+{}"):
                continue
            url = url.split("#")[0].split("?")[0]
            if not url:
                continue  # same-page link with only ?query / #hash
            if not os.path.exists(os.path.join(ROOT, url)):
                # PDFs/DOCX may intentionally live only in a GitHub release
                if re.search(r"\.(pdf|docx|zip|mp4)$", url, re.I):
                    warn("%s -> missing download %s" % (page, url))
                else:
                    err("%s -> missing %s" % (page, url))
                    missing += 1
    print("links:", len(pages), "pages checked,", missing, "missing")


def main():
    check_arcgis()
    check_maogai()
    check_course_bank("nature_bank.json")
    check_course_bank("probability_bank.json")
    check_appendix()
    check_python()
    check_links()
    for w in WARNS:
        print("WARN", w)
    for e in ERRORS:
        print("ERROR", e)
    if ERRORS:
        print("\nFAILED:", len(ERRORS), "errors")
        sys.exit(1)
    print("\nOK: no hard errors")


if __name__ == "__main__":
    main()
