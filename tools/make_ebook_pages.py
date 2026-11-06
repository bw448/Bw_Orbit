# -*- coding: utf-8 -*-
"""Generate full page images and 50-page part PDFs for the e-book reader.

Outputs:
  assets/ebooks/pages/<id>/001.jpg ...
  assets/ebooks/parts/<id>/part-01.pdf ...

Run: python tools/make_ebook_pages.py
"""
import json
import os
import re

import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOOKS = os.path.join(ROOT, "assets", "ebooks", "books.js")
PAGES_ROOT = os.path.join(ROOT, "assets", "ebooks", "pages")
PARTS_ROOT = os.path.join(ROOT, "assets", "ebooks", "parts")
DPI = 100
QUALITY = 60
PART_PAGES = 50


def book_files():
    text = open(BOOKS, encoding="utf-8").read()
    return re.findall(r'id:\s*"([^"]+)"[\s\S]*?file:\s*"([^"]+)"', text)


def main():
    os.makedirs(PAGES_ROOT, exist_ok=True)
    os.makedirs(PARTS_ROOT, exist_ok=True)
    summary = {}
    for bid, rel in book_files():
        src = os.path.join(ROOT, rel.replace("/", os.sep))
        doc = pymupdf.open(src)
        total = doc.page_count
        pdir = os.path.join(PAGES_ROOT, bid)
        qdir = os.path.join(PARTS_ROOT, bid)
        os.makedirs(pdir, exist_ok=True)
        os.makedirs(qdir, exist_ok=True)

        part = pymupdf.open()
        part_no = 1
        parts = []
        for i in range(doc.page_count):
            page = doc[i]
            pix = page.get_pixmap(dpi=DPI, colorspace=pymupdf.csRGB, alpha=False)
            jpg = pix.tobytes("jpeg", jpg_quality=QUALITY)
            with open(os.path.join(pdir, "%03d.jpg" % (i + 1)), "wb") as f:
                f.write(jpg)

            rect = page.rect
            p = part.new_page(width=rect.width, height=rect.height)
            p.insert_image(rect, stream=jpg)

            if (i + 1) % PART_PAGES == 0 or i + 1 == doc.page_count:
                out = os.path.join(qdir, "part-%02d.pdf" % part_no)
                part.save(out, deflate=True, clean=True)
                parts.append(out)
                part.close()
                part = pymupdf.open()
                part_no += 1
            if (i + 1) % 100 == 0:
                print("  %s %d/%d" % (bid, i + 1, doc.page_count))

        part.close()
        doc.close()
        summary[bid] = {"pages": total, "parts": len(parts)}
        print("%-12s %d pages, %d parts" % (bid, total, len(parts)))

    json.dump(summary, open(os.path.join(PARTS_ROOT, "manifest.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("done")


if __name__ == "__main__":
    main()
