# -*- coding: utf-8 -*-
"""Read the old Python question bank and convert it into the new project's data shape.

The old project is READ-ONLY here: this script only reads questions.json and writes
inside E:\\地信复习系统\\src. It never edits the old repo.
"""
import json
import os

OLD = r"E:\python卷子\02_题库\questions.json"
OUT = r"E:\地信复习系统\src\python_questions.json"


def option_list(options):
    if not options:
        return []
    return [options[k] for k in sorted(options.keys())]


def letters_to_indices(answer, options):
    if not answer:
        return []
    keys = sorted((options or {}).keys())
    return [keys.index(ch) for ch in str(answer) if ch in keys]


def convert(q, idx):
    typ = q.get("type")
    paper = q.get("paper")
    section = q.get("section", "")
    stem = q.get("stem") or ""
    body = q.get("body") or ""
    text = stem + (("\n" + body) if body else "")
    explanation = q.get("explanation") or ""
    answer = q.get("answer")
    options = q.get("options")

    item = {
        "id": f"py-{idx:03d}",
        "paper": paper,
        "section": section,
        "q": text,
        "e": explanation,
        "tag": f"Python · 第{paper}套",
        "source": "python",
    }

    if typ == "single":
        item["type"] = "single"
        item["options"] = option_list(options)
        item["a"] = letters_to_indices(answer, options)[0] if letters_to_indices(answer, options) else 0
    elif typ == "multi":
        item["type"] = "multiple"
        item["options"] = option_list(options)
        item["a"] = letters_to_indices(answer, options)
    elif typ == "fill":
        item["type"] = "short"
        item["options"] = []
        item["a"] = str(answer or "")
    else:  # code_read / design
        item["type"] = "short"
        item["options"] = []
        item["a"] = str(answer or "")

    return item


def main():
    data = json.load(open(OLD, encoding="utf-8"))
    out = [convert(q, i + 1) for i, q in enumerate(data)]
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print("read", len(data), "questions")
    print("wrote", OUT, os.path.getsize(OUT), "bytes")
    counts = {}
    for q in out:
        counts[q["type"]] = counts.get(q["type"], 0) + 1
    print("types", counts)


if __name__ == "__main__":
    main()
