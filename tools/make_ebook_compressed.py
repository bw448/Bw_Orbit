# -*- coding: utf-8 -*-
"""Build compressed full-book PDFs for fast download.

Output: assets/ebooks/download/<id>.pdf
Target: roughly 10–33 MB per book, readable on phone/desktop.

Run: python tools/make_ebook_compressed.py
"""
import json
import os
import re

import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOOKS = os.path.join(ROOT, "assets", "ebooks", "books.js")
OUT_DIR = os.path.join(ROOT, "assets", "ebooks", "download")
DPI = 85
QUALITY = 52


def book_files():
    text = open(BOOKS, encoding="utf-8").read()
    return re.findall(r'id:\s*"([^"]+)"[\s\S]*?file:\s*"([^"]+)"', text)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    summary = {}
    for bid, rel in book_files():
        src = os.path.join(ROOT, rel.replace("/", os.sep))
        out = os.path.join(OUT_DIR, bid + ".pdf")
        doc = pymupdf.open(src)
        new = pymupdf.open()
        for i in range(doc.page_count):
            page = doc[i]
            pix = page.get_pixmap(dpi=DPI, colorspace=pymupdf.csRGB, alpha=False)
            jpg = pix.tobytes("jpeg", jpg_quality=QUALITY)
            rect = page.rect
            p = new.new_page(width=rect.width, height=rect.height)
            p.insert_image(rect, stream=jpg)
            if (i + 1) % 100 == 0:
                print("  %s %d/%d" % (bid, i + 1, doc.page_count))
        new.save(out, deflate=True, clean=True)
        new.close()
        doc.close()
        mb = os.path.getsize(out) / 1e6
        summary[bid] = round(mb, 1)
        print("%-12s %5.1f MB -> %s" % (bid, mb, out))
    json.dump(summary, open(os.path.join(OUT_DIR, "manifest.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("done")


if __name__ == "__main__":
    main()
