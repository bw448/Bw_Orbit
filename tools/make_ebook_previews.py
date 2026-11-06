# -*- coding: utf-8 -*-
"""Create small preview PDFs (first N pages) for fast online reading.

Full PDFs stay in assets/ebooks/ for download; previews live in
assets/ebooks/preview/ and are what the reader opens by default.

Run: python tools/make_ebook_previews.py
"""
import json
import os
import re

import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOOKS = os.path.join(ROOT, "assets", "ebooks", "books.js")
OUT_DIR = os.path.join(ROOT, "assets", "ebooks", "preview")
PREVIEW_PAGES = 24
DPI = 110
QUALITY = 68


def book_files():
    text = open(BOOKS, encoding="utf-8").read()
    return re.findall(r'id:\s*"([^"]+)"[\s\S]*?file:\s*"([^"]+)"', text)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for bid, rel in book_files():
        src = os.path.join(ROOT, rel.replace("/", os.sep))
        out = os.path.join(OUT_DIR, bid + ".pdf")
        doc = pymupdf.open(src)
        n = min(PREVIEW_PAGES, doc.page_count)
        preview = pymupdf.open()
        for i in range(n):
            page = doc[i]
            pix = page.get_pixmap(dpi=DPI, colorspace=pymupdf.csRGB, alpha=False)
            jpg = pix.tobytes("jpeg", jpg_quality=QUALITY)
            rect = page.rect
            p = preview.new_page(width=rect.width, height=rect.height)
            p.insert_image(rect, stream=jpg)
        preview.save(out, deflate=True, clean=True)
        print("%-12s %3d pages -> %s (%.1f MB)" % (bid, n, out, os.path.getsize(out) / 1e6))
        doc.close()
        preview.close()


if __name__ == "__main__":
    main()
