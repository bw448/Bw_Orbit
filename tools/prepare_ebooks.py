# -*- coding: utf-8 -*-
"""Prepare compressed public e-books and covers from local PDFs.

Usage:
  python tools/prepare_ebooks.py --src "C:\path\to\pdfs"
The source PDFs are never committed; only compressed copies go to assets/ebooks/.
"""
import argparse, io, os, shutil
from pathlib import Path
import fitz
from PIL import Image

BOOKS = [
    # key, filename, title, source keyword, compress
    ("nature", "nature-geography.pdf", "自然地理学", "自然地理", False),
    ("maogai", "mao-zedong-thought.pdf", "毛泽东思想和中国特色社会主义理论体系概论", "毛泽东", False),
    ("probability", "probability-statistics.pdf", "概率论与数理统计（第五版）", "概率论", True),
    ("remote", "remote-sensing-intro.pdf", "遥感导论", "遥感", False),
    ("arcgis", "arcgis-spatial-analysis.pdf", "ArcGIS 地理信息系统空间分析实验教程（第三版）", "ArcGIS", True),
]

def find_source(src, keyword, fallback_size=None):
    for f in os.listdir(src):
        if f.lower().endswith(".pdf") and keyword in f:
            return os.path.join(src, f)
    if fallback_size:
        for f in os.listdir(src):
            fp = os.path.join(src, f)
            if f.lower().endswith(".pdf") and abs(os.path.getsize(fp) / 1024 / 1024 - fallback_size) < 2:
                return fp
    raise FileNotFoundError(keyword)

def render_pdf(src, dst, dpi=140, quality=62):
    doc = fitz.open(src)
    out = fitz.open()
    for page in doc:
        pix = page.get_pixmap(dpi=dpi, colorspace=fitz.csRGB, alpha=False)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=quality, optimize=True)
        new = out.new_page(width=page.rect.width, height=page.rect.height)
        new.insert_image(page.rect, stream=buf.getvalue())
    out.save(dst, garbage=4, deflate=True)
    out.close(); doc.close()

def cover(src, dst, width=640):
    doc = fitz.open(src)
    page = doc[0]
    scale = width / max(1, page.rect.width)
    pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), colorspace=fitz.csRGB, alpha=False)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    img.save(dst, "JPEG", quality=82, optimize=True)
    doc.close()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    args = ap.parse_args()
    root = Path(__file__).resolve().parent.parent
    outdir = root / "assets" / "ebooks"
    coverdir = outdir / "covers"
    outdir.mkdir(parents=True, exist_ok=True); coverdir.mkdir(parents=True, exist_ok=True)
    for key, name, title, keyword, compress in BOOKS:
        src = find_source(args.src, keyword)
        dst = outdir / name
        print("book", key, "src", os.path.basename(src), round(os.path.getsize(src)/1024/1024,1), "MB")
        if compress:
            render_pdf(src, dst)
        else:
            shutil.copyfile(src, dst)
        cover(dst, coverdir / (key + ".jpg"))
        doc = fitz.open(dst); pages = doc.page_count; doc.close()
        print(" ->", name, round(os.path.getsize(dst)/1024/1024,1), "MB", pages, "pages")

if __name__ == "__main__":
    main()
