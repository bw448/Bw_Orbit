# -*- coding: utf-8 -*-
"""Extract the completed homework docx files into a web-readable JSON."""
import json
import os
import re

from docx import Document
from docx.oxml.ns import qn

BASE = r"C:\Users\Lenovo\Desktop\遥感作业_分章"
OUT = r"E:\地信复习系统\src\homework.json"
IMG_DIR = r"E:\地信复习系统\assets\homework"
os.makedirs(IMG_DIR, exist_ok=True)

FILES = {
    1: ("第一章作业.docx", "第一章作业", "绪论"),
    2: ("第二章作业.docx", "第二章作业", "电磁辐射与地物光谱特征"),
    3: ("第三章作业.docx", "第三章作业", "遥感平台"),
    4: ("第四章作业.docx", "第四章作业", "遥感传感器"),
    6: ("第六章作业.docx", "第六章作业", "遥感图像解译"),
    7: ("第七章作业.docx", "第七章作业", "遥感应用"),
    8: ("第八章作业.docx", "第八章作业", "3S综合应用"),
}

SECTION_RE = re.compile(r"^[一二三四五六七八九十]+、")
Q_RE = re.compile(r"^\d+[.、]")
SUB_RE = re.compile(r"^（\d+）|^\d+）")
BULLET_RE = re.compile(r"^[•·①②③④⑤⑥⑦⑧⑨⑩]")


def classify(text):
    t = text.strip()
    if not t:
        return None
    if SECTION_RE.match(t):
        return "h2"
    if t.startswith("答：") or t.startswith("解："):
        return "answer"
    if Q_RE.match(t):
        return "q"
    if t.startswith("注："):
        return "note"
    if SUB_RE.match(t) or BULLET_RE.match(t):
        return "bullet"
    return "p"


def extract_images(paragraph, doc, ch, counter):
    blips = paragraph._p.xpath(".//a:blip")
    blocks = []
    for blip in blips:
        rid = blip.get(qn("r:embed"))
        if not rid:
            continue
        part = doc.part.related_parts.get(rid)
        if not part:
            continue
        ext = "png" if "png" in (part.content_type or "") else "jpg"
        name = f"ch{ch}-{counter[0]}.{ext}"
        path = os.path.join(IMG_DIR, name)
        with open(path, "wb") as f:
            f.write(part.blob)
        blocks.append({"type": "image", "src": f"assets/homework/{name}"})
        counter[0] += 1
    return blocks


def extract(ch, fname, title, subtitle):
    doc = Document(os.path.join(BASE, fname))
    blocks = []
    counter = [1]
    body = doc.element.body
    for child in body.iterchildren():
        if child.tag == qn("w:p"):
            from docx.text.paragraph import Paragraph
            p = Paragraph(child, doc)
            text = p.text.strip()
            if not text:
                # still could contain an image
                for b in extract_images(p, doc, ch, counter):
                    blocks.append(b)
                continue
            if text == title or text == subtitle:
                continue
            # tables can't occur inside a paragraph; images can
            imgs = extract_images(p, doc, ch, counter)
            for b in imgs:
                blocks.append(b)
            kind = classify(text)
            if kind:
                blocks.append({"type": kind, "text": text})
        elif child.tag == qn("w:tbl"):
            from docx.table import Table
            table = Table(child, doc)
            rows = []
            for row in table.rows:
                cells = []
                seen = set()
                for cell in row.cells:
                    if id(cell._tc) in seen:
                        continue
                    seen.add(id(cell._tc))
                    cells.append(cell.text.replace("\n", "\n").strip())
                if any(cells):
                    rows.append(cells)
            if not rows:
                continue
            if len(rows) == 1 and len(rows[0]) == 1:
                blocks.append({"type": "formula", "text": rows[0][0]})
            else:
                blocks.append({"type": "table", "rows": rows})
    # drop leading preamble paragraphs (title/subtitle variants)
    while blocks and blocks[0].get("type") == "p":
        blocks.pop(0)
    return {"chapter": ch, "title": title, "subtitle": subtitle, "blocks": blocks}


def main():
    chapters = []
    for ch in [1, 2, 3, 4, 5, 6, 7, 8]:
        if ch == 5:
            chapters.append({"chapter": 5, "title": "第五章作业", "subtitle": "遥感图像处理",
                             "status": "soon", "blocks": []})
            continue
        fname, title, subtitle = FILES[ch]
        data = extract(ch, fname, title, subtitle)
        chapters.append(data)
        print(ch, title, len(data["blocks"]), "blocks")
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"chapters": chapters}, f, ensure_ascii=False, indent=1)
    print("wrote", OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    main()
