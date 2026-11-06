# -*- coding: utf-8 -*-
"""Build the Maoism essay bank from the two 大题背诵 PDFs.

Run: python tools/build_maogai_essay.py
Out:  src/maogai_essay.json
"""
import json
import os
import re

import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = r"C:\Users\Lenovo\Desktop\地信大二上\课程资料\毛概\整理稿\PDF版"
FILES = [
    ("毛概大题背诵版（核心篇·导论—第四章）.pdf", "核心篇"),
    ("毛概大题背诵版（后半篇·第五章—跨章节）.pdf", "后半篇"),
]
OUT = os.path.join(ROOT, "src", "maogai_essay.json")


def clean(s):
    s = re.sub(r"毛概大题背诵版（[^）]*）\s*", "", s)
    s = re.sub(r"第 \d+ 页 / 共 \d+ 页", "", s)
    s = re.sub(r"(?<=[\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])", "", s)
    return re.sub(r"\s+", " ", s).strip()


def read_book(path):
    doc = pymupdf.open(path)
    return "\n".join(doc[i].get_text() for i in range(doc.page_count))


def parse_book(text, source):
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    items, chapter, cur, tags = [], "", None, []
    for line in lines:
        if line.startswith("毛概大题背诵版") or re.match(r"第 \d+ 页 / 共 \d+ 页", line):
            continue
        mch = re.match(r"^(导论|第[一二三四五六七八九十]+章)[\s　]*(.*)$", line)
        if mch and len(line) < 40 and "共" not in line:
            if cur:
                items.append(cur)
                cur = None
            chapter = line
            tags = []
            continue
        if line.startswith("本章共") or line.startswith("课后题必背索引") or line.startswith("使用说明"):
            continue
        if line.startswith("【") and ("】" in line) and not re.match(r"^\d", line):
            # tag line, possibly several tags
            tags.extend(re.findall(r"【[^】]+】", line))
            continue
        m = re.match(r"^(\d{1,2})[.．、]\s*【(简答|论述)】\s*(.+)$", line)
        if m:
            if cur:
                items.append(cur)
            cur = {
                "id": "", "source": source, "chapter": chapter, "n": int(m.group(1)),
                "type": m.group(2), "q": m.group(3), "tags": list(dict.fromkeys(tags)),
                "points": [], "tip": "",
            }
            tags = []
            continue
        if cur is None:
            continue
        if line.startswith("提示："):
            cur["tip"] = (cur["tip"] + " " + line[3:]).strip()
        elif re.match(r"^[①②③④⑤⑥⑦⑧⑨⑩]", line):
            cur["points"].append(line)
        elif cur["tip"]:
            cur["tip"] += " " + line
        elif cur["points"]:
            cur["points"][-1] += " " + line
        else:
            cur["q"] += " " + line
    if cur:
        items.append(cur)
    for x in items:
        x["q"] = clean(x["q"])
        x["points"] = [clean(p) for p in x["points"]]
        x["tip"] = clean(x["tip"])
    return items


def main():
    items = []
    for fname, source in FILES:
        text = read_book(os.path.join(BASE, fname))
        items += parse_book(text, source)
    for i, x in enumerate(items, 1):
        x["id"] = "mge-%03d" % i
    data = {
        "meta": {
            "total": len(items),
            "core": sum(1 for x in items if x["source"] == "核心篇"),
            "back": sum(1 for x in items if x["source"] == "后半篇"),
            "short": sum(1 for x in items if x["type"] == "简答"),
            "long": sum(1 for x in items if x["type"] == "论述"),
        },
        "items": items,
    }
    json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("items", len(items), data["meta"])
    print("written", OUT)


if __name__ == "__main__":
    main()
