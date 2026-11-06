# -*- coding: utf-8 -*-
"""Build the Maoism special bank: high-frequency points, real exam questions,
and confusion pairs, from 毛概选择题专项（高频考点+2024-2025真题）.pdf.

Run: python tools/build_maogai_special.py
Out:  src/maogai_special.json
"""
import json
import os
import re

import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = r"C:\Users\Lenovo\Desktop\地信大二上\课程资料\毛概\整理稿\PDF版\毛概选择题专项（高频考点+2024-2025真题）.pdf"
OUT = os.path.join(ROOT, "src", "maogai_special.json")


def clean(s):
    s = re.sub(r"\u6bdb\u6982\u9009\u62e9\u9898\u4e13\u9879[^\n]*?\u7b2c \d+ \u9875 / \u5171 \d+ \u9875", "", s)
    s = re.sub(r"\u7b2c \d+ \u9875 / \u5171 \d+ \u9875", "", s)
    s = re.sub(r"(?<=[\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])", "", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def read_text():
    doc = pymupdf.open(PDF)
    return "\n".join(doc[i].get_text() for i in range(doc.page_count)), doc


def parse_points(text):
    start = text.index("第一部分 选择题高频考点", 1000)
    end = text.index("第二部分 易混考点对比表", start)
    lines = [l.strip() for l in text[start:end].split("\n") if l.strip()]
    points, chapter, cur = [], "", None
    for line in lines:
        if line.startswith("第一部分"):
            continue
        mch = re.match(r"^(导论|第[一二三四五六七八九十]+章)[\s　]*(.*)$", line)
        if mch and len(line) < 40:
            if cur:
                points.append(cur)
                cur = None
            chapter = line
            continue
        m = re.match(r"^(★?)(\d{1,3})[.．、]\s*(.+)$", line)
        if m:
            if cur:
                points.append(cur)
            cur = {"star": bool(m.group(1)), "n": int(m.group(2)),
                   "chapter": chapter, "text": m.group(3)}
        elif cur is not None:
            cur["text"] += " " + line
    if cur:
        points.append(cur)

    out = []
    for p in points:
        text_ = clean(p["text"])
        m = re.match(r"^([^：:]{1,12})[：:]\s*(.*)$", text_)
        keyword = m.group(1).strip() if m else ""
        body = m.group(2).strip() if m else text_
        out.append({
            "id": "",
            "chapter": p["chapter"],
            "star": p["star"],
            "keyword": keyword,
            "text": body,
        })
    for i, p in enumerate(out, 1):
        p["id"] = "mgp-%03d" % i
    return out


def parse_real(text):
    p2 = text.index("第二部分 易混考点对比表", 2000)
    p3 = text.index("第三部分 2024 年真题选择题", p2)
    p4 = text.index("第四部分 2025 年真题选择题", p3)

    def parse_part(a, b, source):
        lines = [l.strip() for l in text[a:b].split("\n") if l.strip()]
        items, cur = [], None
        for line in lines:
            if line.startswith("毛概选择题专项") or line.startswith("附录"):
                continue
            if re.match(r"^第 \d+ 页", line):
                continue
            m = re.match(r"^(\d{1,3})[.．、]\s*(.+)$", line)
            if m:
                if cur and cur.get("answer"):
                    items.append(cur)
                cur = {"n": int(m.group(1)), "q": m.group(2), "options": [],
                       "answer": None, "explain": "", "source": source}
                continue
            if cur is None:
                continue
            if line.startswith("【答案】"):
                cur["answer"] = line.replace("【答案】", "").strip()
            elif line.startswith("【考点】"):
                cur["explain"] = line.replace("【考点】", "").strip()
            elif re.match(r"^[A-D][.．、]", line):
                cur["options"].append(re.sub(r"^[A-D][.．、]\s*", "", line))
            elif cur.get("answer"):
                cur["explain"] += " " + line
            elif cur["options"]:
                cur["options"][-1] += " " + line
            else:
                cur["q"] += " " + line
        if cur and cur.get("answer"):
            items.append(cur)
        out = []
        for x in items:
            if len(x["options"]) != 4 or not re.fullmatch(r"[A-D]+", x["answer"]):
                continue
            out.append({
                "id": "",
                "source": source,
                "chapter": source,
                "q": clean(x["q"]),
                "options": [clean(o) for o in x["options"]],
                "answer": [ord(c) - 65 for c in x["answer"]],
                "explain": clean(x["explain"].split("◆")[0].split("毛概选择题专项")[0].split("附录")[0]),
                "type": "single" if len(x["answer"]) == 1 else "multi",
            })
        return out

    items = parse_part(p3, p4, "2024真题") + parse_part(p4, len(text), "2025真题")
    for i, x in enumerate(items, 1):
        x["id"] = "mgr-%03d" % i
    return items


def parse_confusions(doc):
    out = []
    for page in doc:
        for table in page.find_tables().tables:
            for row in table.extract():
                cells = [clean(c or "") for c in row if c and c.strip()]
                if len(cells) != 3:
                    continue
                if cells[0] in ("概念A", "概念B"):
                    continue
                out.append({"a": cells[0], "b": cells[1], "diff": cells[2]})
    for i, x in enumerate(out, 1):
        x["id"] = "mgc-%02d" % i
    return out


def main():
    text, doc = read_text()
    points = parse_points(text)
    real = parse_real(text)
    confusions = parse_confusions(doc)
    data = {
        "meta": {
            "points": len(points),
            "stars": sum(1 for p in points if p["star"]),
            "real": len(real),
            "real2024": sum(1 for p in real if p["source"] == "2024真题"),
            "real2025": sum(1 for p in real if p["source"] == "2025真题"),
            "confusions": len(confusions),
            "source": "毛概选择题专项（高频考点+2024-2025真题）.pdf",
        },
        "points": points,
        "real": real,
        "confusions": confusions,
    }
    json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("points", len(points), "stars", data["meta"]["stars"], "real", len(real), "confusions", len(confusions))
    print("written", OUT)


if __name__ == "__main__":
    main()
