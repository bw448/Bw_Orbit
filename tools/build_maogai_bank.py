# -*- coding: utf-8 -*-
"""Build the Maoism multiple-choice bank for the site.

Sources (read-only):
  1. 复习资料/毛概/PDF版/毛概选择题题库（去重汇总）.pdf  -> 710 questions
  2. 原始文件/毛概（原始）/选择题/毛概期末考试题库 1.pdf -> supplementary ~430

Run:  python tools/build_maogai_bank.py
Out:  src/maogai_bank.json
"""
import json
import os
import re
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESKTOP = r"C:\Users\Lenovo\Desktop\地信大二上"
BASE_710 = os.path.join(DESKTOP, r"课程资料\毛概\整理稿\PDF版\毛概选择题题库（去重汇总）.pdf")
BASE_EXTRA = os.path.join(DESKTOP, r"课程资料\毛概\原始\选择题\毛概期末考试题库 1.pdf")
OUT = os.path.join(ROOT, "src", "maogai_bank.json")


def norm(s):
    s = unicodedata.normalize("NFKC", s)
    s = re.sub(r"[（(]\s*[A-E]{1,4}\s*[）)]", "", s)
    return re.sub(r"[\s．.、，,。:：;；\"“”'’（）()【】\[\]]+", "", s)


def read_pdf(path):
    import pymupdf
    doc = pymupdf.open(path)
    return "\n".join(doc[i].get_text() for i in range(doc.page_count))


def clean_pages(text):
    text = re.sub(r"=====.*?=====\n?", "", text)
    text = re.sub(r"毛概选择题题库（去重汇总）\s*\n第 \d+ 页 / 共 \d+ 页\s*\n?", "", text)
    return text


def parse_710(text):
    text = clean_pages(text)
    p1 = text.index("第一部分 新教材章节题库", 2000)
    p2 = text.index("第二部分 旧教材综合题库（522 题） \n第一章", 10000)
    return parse_section(text[p1:p2], "新教材", "前言") + parse_section(text[p2:], "旧教材", "第一章")


def parse_section(body, source, default_chapter):
    lines = [l.strip() for l in body.split("\n")]
    items, cur, chapter = [], None, default_chapter
    for line in lines:
        if not line:
            continue
        mch = re.match(r"^(第[一二三四五六七八九十]+章)\s*(.*)$", line)
        if mch and len(line) < 45 and "…" not in line and "..." not in line:
            if cur and cur.get("answer"):
                items.append(cur)
                cur = None
            chapter = line
            continue
        if line == "前言":
            if cur and cur.get("answer"):
                items.append(cur)
                cur = None
            chapter = "前言"
            continue
        m = re.match(r"^(\d{1,3})[.．]\s*(.*)$", line)
        if m:
            if cur and cur.get("answer"):
                items.append(cur)
                cur = None
            if cur is None:
                cur = {"n": int(m.group(1)), "chapter": chapter, "lines": [m.group(2)]}
                continue
        if cur is not None:
            if "【答案】" in line:
                cur["answer"] = line.split("【答案】")[1].strip().replace(" ", "")
                items.append(cur)
                cur = None
            else:
                cur["lines"].append(line)
    if cur and cur.get("answer"):
        items.append(cur)

    out = []
    for it in items:
        stem, opts = split_opts(it["lines"])
        if not opts or not re.fullmatch(r"[A-E]+", it["answer"]):
            continue
        if len(opts) != 4 and not (len(opts) == 5 and "E" in it["answer"]):
            continue
        ans = [ord(c) - 65 for c in it["answer"]]
        out.append({
            "id": "",
            "source": source,
            "chapter": it["chapter"],
            "q": stem,
            "options": opts,
            "answer": ans,
            "type": "single" if len(ans) == 1 else "multi",
        })
    return out


def split_opts(lines):
    stem, opts = [], []
    for line in lines:
        if re.match(r"^[A-E][.．、]", line):
            opts.append(line)
        elif opts and len(opts[-1]) < 80:
            opts[-1] += " " + line
        else:
            stem.append(line)
    if len(opts) < 3:
        joined = " ".join(stem)
        parts = re.split(r"(?=[A-E][.．、])", joined)
        if len(parts) >= 5:
            stem, opts = [parts[0]], [p for p in parts[1:] if p.strip()]
    clean = []
    for o in opts:
        o = re.sub(r"^[A-E][.．、]\s*", "", o).strip()
        o = re.sub(r"\s+", " ", o)
        if o:
            clean.append(o)
    return "".join(stem).strip(), clean


def parse_extra(text):
    text = unicodedata.normalize("NFKC", text)
    lines = [l.strip() for l in text.split("\n")]
    blocks, cur, chapter = [], None, ""
    for line in lines:
        if not line:
            continue
        if re.match(r"^第[一二三四五六七八九十]+章", line) and len(line) < 40:
            chapter = line.split()[0]
            continue
        m = re.match(r"^(\d{1,3})[.．]\s*(.*)$", line)
        if m:
            if cur:
                blocks.append(cur)
            cur = {"n": int(m.group(1)), "chapter": chapter, "lines": [m.group(2)]}
        elif cur is not None:
            if re.fullmatch(r"\d{1,3}", line):
                continue
            cur["lines"].append(line)
    if cur:
        blocks.append(cur)

    out = []
    for b in blocks:
        text = "\n".join(b["lines"])
        joined = re.sub(r"[（(]\s*([A-E]{1,4})\s*[）)]", r"(\1)", text)
        answers = re.findall(r"\(\s*([A-E]{1,4})\s*\)", joined)
        ans = answers[-1] if answers else None
        if not ans:
            for line in [x.strip() for x in text.split("\n")]:
                if re.fullmatch(r"[A-E]{1,4}", line):
                    ans = line
                    break
        if not ans or not re.fullmatch(r"[A-E]+", ans):
            continue
        body = re.sub(r"\(\s*[A-E]{1,4}\s*\)", "( )", joined)
        stem, opts = split_opts([body])
        if len(opts) < 3:
            # inline options such as "A 为...B 为..."
            parts = re.split(r"(?=[A-E]\s+[\u4e00-\u9fff])", body)
            if len(parts) >= 4:
                stem, opts = parts[0], [re.sub(r"^[A-E]\s+", "", p).strip() for p in parts[1:] if p.strip()]
        opts = [re.sub(r"\s+", " ", o) for o in opts if o]
        if len(opts) < 3:
            continue
        idx = [ord(c) - 65 for c in ans if ord(c) - 65 < len(opts)]
        if not idx:
            continue
        out.append({
            "id": "",
            "source": "期末补充",
            "chapter": b["chapter"] or "补充",
            "q": re.sub(r"\s+", " ", stem).strip(),
            "options": opts,
            "answer": idx,
            "type": "single" if len(idx) == 1 else "multi",
        })
    return out


def dedupe(items):
    seen, out = set(), []
    for it in items:
        k = norm(it["q"])[:28]
        if k in seen:
            continue
        seen.add(k)
        out.append(it)
    return out


def main():
    if not os.path.exists(BASE_710):
        sys.exit("missing: " + BASE_710)
    primary = parse_710(read_pdf(BASE_710))
    extra = []
    if os.path.exists(BASE_EXTRA):
        extra = parse_extra(read_pdf(BASE_EXTRA))

    # repair a few merged blocks in the scanned extra bank
    fixed = []
    for x in extra:
        if len(x["options"]) > 5:
            continue  # two questions merged by a lost number
        if len(x["options"]) == 3:
            m = re.search(r"\s*A[.．]\s*(.+)$", x["q"])
            if m:
                x["options"].insert(0, m.group(1).strip())
                x["q"] = x["q"][:m.start()].strip()
                x["answer"] = [i + 1 for i in x["answer"]]
        if x["id"] == "" and any("E." in o or "E．" in o for o in x["options"]):
            opts = []
            for o in x["options"]:
                parts = re.split(r"(?=E[.．])", o)
                opts.extend([p.strip() for p in parts if p.strip()])
            x["options"] = opts
        if max(x["answer"]) >= len(x["options"]):
            continue
        fixed.append(x)
    extra = fixed
    # normalize old-textbook chapter labels
    for x in extra:
        m = re.match(r"^(第[一二三四五六七八九十]+章)", x["chapter"])
        if m:
            x["chapter"] = m.group(1)

    # drop extra items whose stem is very close to a 710 item
    keys = {norm(x["q"])[:20] for x in primary}
    extra = [x for x in extra if norm(x["q"])[:20] not in keys]
    extra = dedupe(extra)

    all_items = primary + extra

    # final cleanup: split a merged E option, drop contaminated scan items
    clean = []
    for it in all_items:
        opts = []
        for o in it["options"]:
            if "E." in o or "E．" in o:
                opts.extend([p.strip() for p in re.split(r"(?=E[.．])", o) if p.strip()])
            else:
                opts.append(o)
        it["options"] = opts
        bad = False if it["source"] in ("新教材", "旧教材") else False
        for o in it["options"] if it["source"] not in ("新教材", "旧教材") else []:
            if len(o) > 85:
                bad = True
            if re.search(r"[一二三四五六七八九十]、.{0,30}(题|$)", o):
                bad = True
            if re.search(r"(判断题|单项选择题|多项选择题|简答题)", o):
                bad = True
        if bad or len(it["options"]) < 3 or max(it["answer"]) >= len(it["options"]):
            continue
        clean.append(it)
    all_items = clean

    for i, it in enumerate(all_items, 1):
        it["id"] = "mg-%04d" % i

    # Manual corrections for scan/OCR defects found in review. Applied after
    # ids are assigned so a rebuild keeps them.
    fixes = {
        "mg-0176": {"q": "胡锦涛提出的、深刻总结了国内外社会主义建设的历史经验、深化了对社会主义本质认识的重大判断是（ ）"},
        "mg-0297": {"options": {3: "阶级分析、积极引导和稳步前进"}},
        "mg-0310": {"answer": [1], "type": "single"},
        "mg-0324": {"answer": [2]},
        "mg-0404": {"q": "坚持党在社会主义初级阶段的基本路线不动摇，关键是坚持（ ）"},
        "mg-0441": {"q": "（ ）是中国实现社会主义现代化发展战略的必要前提，是中国的最高利益。"},
        "mg-0442": {"answer": [2]},
        "mg-0459": {"options": {2: "实现中华民族伟大复兴"}},
        "mg-0527": {"options": {3: "混合所有制经济中的国有成分和集体成分"}, "drop": [4], "answer": [0, 1, 2]},
        "mg-0616": {"answer": [0], "type": "single"},
        "mg-0623": {"q": "在中国的民主革命中，（ ）是首先觉悟的群体。"},
        "mg-0628": {"answer": [3]},
        "mg-0653": {"options": {0: "取其精华、去其糟粕"}, "answer": [0, 1, 2]},
        "mg-0717": {"options": {1: "中国共产党领导的农民运动"}},
        "mg-0723": {"answer": [0]},
        "mg-0812": {"options": {3: "党的十四大"}},
        "mg-0945": {"options": {0: "人民代表大会制度"}, "answer": [0]},
    }
    by_id = {x["id"]: x for x in all_items}
    for qid, patch in fixes.items():
        it = by_id.get(qid)
        if not it:
            continue
        for k, v in patch.items():
            if k == "options":
                for idx, text in v.items():
                    it["options"][idx] = text
            elif k == "drop":
                for idx in sorted(v, reverse=True):
                    it["options"].pop(idx)
            else:
                it[k] = v
        if len(it["options"]) == 4 and max(it["answer"]) >= 4:
            it["answer"] = [i for i in it["answer"] if i < 4]
        if len(it["answer"]) == 1:
            it["type"] = "single"
        elif len(it["answer"]) > 1:
            it["type"] = "multi"

    data = {
        "meta": {
            "primary": sum(1 for x in all_items if x["source"] in ("新教材", "旧教材")),
            "extra": sum(1 for x in all_items if x["source"] == "期末补充"),
            "total": len(all_items),
            "new": sum(1 for x in all_items if x["source"] == "新教材"),
            "old": sum(1 for x in all_items if x["source"] == "旧教材"),
            "supplement": sum(1 for x in all_items if x["source"] == "期末补充"),
            "note": "710 题来自去重汇总；期末补充来自毛概期末考试题库，已按题干去重。",
        },
        "items": all_items,
    }
    json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("primary", len(primary), "extra", len(extra), "total", len(all_items))
    print("written", OUT)


if __name__ == "__main__":
    main()
