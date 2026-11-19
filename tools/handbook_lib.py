# -*- coding: utf-8 -*-
"""Reusable DOCX layout helpers for the six exam handbooks.

The handbooks are generated from the site's own data (single source of truth)
plus the authored front matter in handbook_content.py.  Word is used for the
final PDF export so that Chinese typography, TOC page numbers and headers all
behave like a real document.
"""
import os
import re

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

INK = RGBColor(0x1D, 0x1D, 0x1F)
MUTED = RGBColor(0x6E, 0x6E, 0x73)
FAINT = RGBColor(0x8E, 0x8E, 0x93)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
BODY_FONT = "微软雅黑"
CODE_FONT = "Consolas"


# ---------------------------------------------------------------- colour utils
def _rgb(hexcolor):
    return RGBColor(int(hexcolor[0:2], 16), int(hexcolor[2:4], 16), int(hexcolor[4:6], 16))


def tint(hexcolor, amount=0.88):
    """Mix a colour with white; amount is the white share (0..1)."""
    h = hexcolor.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    r = int(r + (255 - r) * amount)
    g = int(g + (255 - g) * amount)
    b = int(b + (255 - b) * amount)
    return "%02X%02X%02X" % (r, g, b)


def shade_cell(cell, hexcolor):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hexcolor.lstrip("#"))
    tcPr.append(shd)


def shade_paragraph(paragraph, hexcolor):
    pPr = paragraph._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hexcolor.lstrip("#"))
    pPr.append(shd)


def cell_margins(cell, top=60, bottom=60, left=90, right=90):
    tcPr = cell._tc.get_or_add_tcPr()
    mar = OxmlElement("w:tcMar")
    for tag, val in (("top", top), ("bottom", bottom), ("start", left), ("end", right)):
        el = OxmlElement("w:" + tag)
        el.set(qn("w:w"), str(val))
        el.set(qn("w:type"), "dxa")
        mar.append(el)
    tcPr.append(mar)


def set_table_borders(table, color="D9D9DE", sz=4, inside=True):
    tbl = table._tbl
    tblPr = tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    edges = ["top", "left", "bottom", "right"] + (["insideH", "insideV"] if inside else [])
    for edge in edges:
        el = OxmlElement("w:" + edge)
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), str(sz))
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), color.lstrip("#"))
        borders.append(el)
    tblPr.append(borders)


def set_col_widths(table, widths):
    table.autofit = False
    for row in table.rows:
        for i, w in enumerate(widths):
            if i < len(row.cells):
                row.cells[i].width = Cm(w)


def repeat_header(row):
    trPr = row._tr.get_or_add_trPr()
    el = OxmlElement("w:tblHeader")
    el.set(qn("w:val"), "true")
    trPr.append(el)


def cant_split(row):
    trPr = row._tr.get_or_add_trPr()
    el = OxmlElement("w:cantSplit")
    el.set(qn("w:val"), "true")
    trPr.append(el)


# ---------------------------------------------------------------- fonts/styles
def set_run_font(run, name=BODY_FONT, size=None, bold=None, color=None, italic=None):
    run.font.name = name
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.get_or_add_rFonts()
    rFonts.set(qn("w:ascii"), name)
    rFonts.set(qn("w:hAnsi"), name)
    rFonts.set(qn("w:eastAsia"), name)
    if size is not None:
        run.font.size = Pt(size)
    if bold is not None:
        run.bold = bold
    if color is not None:
        run.font.color.rgb = color
    if italic is not None:
        run.italic = italic


def setup_styles(doc, accent):
    normal = doc.styles["Normal"]
    normal.font.name = BODY_FONT
    normal.font.size = Pt(10)
    normal.font.color.rgb = INK
    normal.element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:eastAsia"), BODY_FONT)
    pf = normal.paragraph_format
    pf.line_spacing = 1.34
    pf.space_after = Pt(3)
    pf.space_before = Pt(0)

    accent_rgb = _rgb(accent)
    specs = {
        "Heading 1": (17, accent_rgb, 14, 6),
        "Heading 2": (12.5, INK, 12, 4),
        "Heading 3": (10.8, accent_rgb, 8, 2),
    }
    for name, (size, color, before, after) in specs.items():
        st = doc.styles[name]
        st.font.name = BODY_FONT
        st.font.size = Pt(size)
        st.font.bold = True
        st.font.color.rgb = color
        st.element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:eastAsia"), BODY_FONT)
        st.paragraph_format.space_before = Pt(before)
        st.paragraph_format.space_after = Pt(after)
        st.paragraph_format.keep_with_next = True
        st.paragraph_format.line_spacing = 1.18

    for name in ("List Bullet", "List Number"):
        st = doc.styles[name]
        st.font.name = BODY_FONT
        st.font.size = Pt(9.8)
        st.element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:eastAsia"), BODY_FONT)
        st.paragraph_format.space_after = Pt(1.5)
        st.paragraph_format.line_spacing = 1.28


def add_bottom_border(paragraph, color, sz=8, space=4):
    pPr = paragraph._p.get_or_add_pPr()
    pbdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), str(sz))
    bottom.set(qn("w:space"), str(space))
    bottom.set(qn("w:color"), color.lstrip("#"))
    pbdr.append(bottom)
    pPr.append(pbdr)


def add_left_border(cell, color, sz=18):
    tcPr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement("w:tcBorders")
    left = OxmlElement("w:left")
    left.set(qn("w:val"), "single")
    left.set(qn("w:sz"), str(sz))
    left.set(qn("w:space"), "0")
    left.set(qn("w:color"), color.lstrip("#"))
    borders.append(left)
    tcPr.append(borders)


# ---------------------------------------------------------------- fields
def add_field(paragraph, instr, placeholder=""):
    run = paragraph.add_run()
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    instr_el = OxmlElement("w:instrText")
    instr_el.set(qn("xml:space"), "preserve")
    instr_el.text = instr
    fld_sep = OxmlElement("w:fldChar")
    fld_sep.set(qn("w:fldCharType"), "separate")
    text = OxmlElement("w:t")
    text.text = placeholder
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")
    for el in (fld_begin, instr_el, fld_sep, text, fld_end):
        run._r.append(el)


def add_toc(doc, levels="1-2"):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(8)
    add_field(p, 'TOC \\o "%s" \\h \\z \\u' % levels, "打开文档后按 Ctrl+A、F9 更新目录")


# ---------------------------------------------------------------- page chrome
def setup_page(doc):
    sec = doc.sections[0]
    sec.page_width = Cm(21.0)
    sec.page_height = Cm(29.7)
    sec.top_margin = Cm(1.9)
    sec.bottom_margin = Cm(1.7)
    sec.left_margin = Cm(2.0)
    sec.right_margin = Cm(2.0)
    sec.header_distance = Cm(0.8)
    sec.footer_distance = Cm(0.8)
    sec.different_first_page_header_footer = True
    return sec


def setup_chrome(doc, sec, running_title, accent):
    header = sec.header
    hp = header.paragraphs[0]
    hp.paragraph_format.tab_stops.add_tab_stop(Cm(17.0), WD_TAB_ALIGNMENT.RIGHT)
    r = hp.add_run(running_title)
    set_run_font(r, size=8, color=FAINT)
    r = hp.add_run("\tOrbit · 期末满分手册 · 2026")
    set_run_font(r, size=8, color=FAINT)
    add_bottom_border(hp, tint(accent, 0.65), sz=4, space=2)

    footer = sec.footer
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = fp.add_run("— ")
    set_run_font(r, size=8.5, color=FAINT)
    add_field(fp, "PAGE", "1")
    r = fp.add_run(" / ")
    set_run_font(r, size=8.5, color=FAINT)
    add_field(fp, "NUMPAGES", "1")
    r = fp.add_run(" —")
    set_run_font(r, size=8.5, color=FAINT)


# ---------------------------------------------------------------- block API
def h1(doc, text, page_break=True):
    p = doc.add_heading(text, level=1)
    p.paragraph_format.page_break_before = page_break
    add_bottom_border(p, "D2D2D7", sz=6, space=3)
    return p


def h2(doc, text, page_break=False):
    p = doc.add_heading(text, level=2)
    if page_break:
        p.paragraph_format.page_break_before = True
    return p


def h3(doc, text):
    return doc.add_heading(text, level=3)


def p_plain(doc, text="", size=10, color=INK, bold=False, italic=False, align=None,
            space_after=None, indent=None, keep=False):
    """Paragraph without markdown parsing — required for Python code/options."""
    par = doc.add_paragraph()
    if align == "center":
        par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif align == "right":
        par.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    if space_after is not None:
        par.paragraph_format.space_after = Pt(space_after)
    if indent is not None:
        par.paragraph_format.left_indent = Cm(indent)
    if keep:
        par.paragraph_format.keep_with_next = True
    lines = ("" if text is None else str(text)).replace("\r\n", "\n").replace("\r", "\n").split("\n")
    for i, line in enumerate(lines):
        if i:
            par.add_run().add_break()
        r = par.add_run(line)
        set_run_font(r, size=size, bold=bold, color=color, italic=italic)
    return par


def p(doc, text="", size=10, color=INK, bold=False, italic=False, align=None,
      space_after=None, indent=None, keep=False):
    par = doc.add_paragraph()
    if align == "center":
        par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif align == "right":
        par.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    if space_after is not None:
        par.paragraph_format.space_after = Pt(space_after)
    if indent is not None:
        par.paragraph_format.left_indent = Cm(indent)
    if keep:
        par.paragraph_format.keep_with_next = True
    add_rich(par, text, size=size, color=color, bold=bold, italic=italic)
    return par


def add_rich(par, text, size=10, color=INK, bold=False, italic=False):
    """Add text with **bold**, `code` and [[accent]] inline markers."""
    if text is None:
        text = ""
    tokens = re.split(r"(\*\*.+?\*\*|`.+?`|\[\[.+?\]\]|\^\{[^}]*\}|_\{[^}]*\})", str(text))
    for tok in tokens:
        if not tok:
            continue
        if tok.startswith("**") and tok.endswith("**") and len(tok) > 4:
            r = par.add_run(tok[2:-2])
            set_run_font(r, size=size, bold=True, color=color, italic=italic)
        elif tok.startswith("`") and tok.endswith("`") and len(tok) > 2:
            r = par.add_run(tok[1:-1])
            set_run_font(r, name=CODE_FONT, size=max(size - 1, 7.5), color=color)
        elif tok.startswith("[[") and tok.endswith("]]"):
            r = par.add_run(tok[2:-2])
            set_run_font(r, size=size, bold=True, color=color, italic=italic)
        elif tok.startswith("^{") and tok.endswith("}"):
            r = par.add_run(tok[2:-1])
            set_run_font(r, size=max(size - 1, 7.5), bold=bold, color=color, italic=italic)
            r.font.superscript = True
        elif tok.startswith("_{") and tok.endswith("}"):
            r = par.add_run(tok[2:-1])
            set_run_font(r, size=max(size - 1, 7.5), bold=bold, color=color, italic=italic)
            r.font.subscript = True
        else:
            r = par.add_run(tok)
            set_run_font(r, size=size, bold=bold, color=color, italic=italic)


def bullets(doc, items, size=9.8, level=0):
    for it in items:
        par = doc.add_paragraph(style="List Bullet")
        if level:
            par.paragraph_format.left_indent = Cm(0.63 + 0.55 * level)
        add_rich(par, it, size=size)


def numbered(doc, items, size=9.8):
    """Manual numbering so every list restarts at 1 (Word's List Number does not)."""
    for i, it in enumerate(items, 1):
        par = doc.add_paragraph()
        par.paragraph_format.left_indent = Cm(0.78)
        par.paragraph_format.first_line_indent = Cm(-0.38)
        par.paragraph_format.space_after = Pt(1.5)
        par.paragraph_format.line_spacing = 1.28
        add_rich(par, "%d. %s" % (i, it), size=size)


def table(doc, headers, rows, widths=None, size=8.6, header_fill=None,
          zebra=True, first_col_bold=False, align_center=None, merge_first_col=False):
    ncols = len(headers)
    t = doc.add_table(rows=1, cols=ncols)
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    set_table_borders(t, "D9D9DE", 4)
    hdr = t.rows[0]
    repeat_header(hdr)
    fill = header_fill or "F2F2F5"
    for i, h in enumerate(headers):
        cell = hdr.cells[i]
        cell.text = ""
        shade_cell(cell, fill)
        cell_margins(cell)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        par = cell.paragraphs[0]
        par.paragraph_format.space_after = Pt(0)
        par.paragraph_format.line_spacing = 1.1
        r = par.add_run(str(h))
        set_run_font(r, size=size, bold=True, color=INK)
    for ridx, row in enumerate(rows):
        tr = t.add_row()
        cant_split(tr)
        for i in range(ncols):
            val = row[i] if i < len(row) else ""
            cell = tr.cells[i]
            cell.text = ""
            cell_margins(cell)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            if zebra and ridx % 2 == 1:
                shade_cell(cell, "FAFAFC")
            par = cell.paragraphs[0]
            par.paragraph_format.space_after = Pt(0)
            par.paragraph_format.line_spacing = 1.14
            if align_center and i in align_center:
                par.alignment = WD_ALIGN_PARAGRAPH.CENTER
            add_rich(par, val, size=size, bold=(first_col_bold and i == 0))
    if widths:
        set_col_widths(t, widths)
    if merge_first_col:
        idx = 1
        while idx < len(t.rows):
            start = idx
            idx += 1
            while idx < len(t.rows) and str(rows[idx - 1][0]).strip() == "":
                idx += 1
            if idx - start > 1:
                t.cell(start, 0).merge(t.cell(idx - 1, 0))
    spacer = doc.add_paragraph()
    spacer.paragraph_format.space_after = Pt(2)
    spacer.paragraph_format.line_spacing = 0.6
    return t


def code(doc, text, size=7.8):
    par = doc.add_paragraph()
    par.paragraph_format.left_indent = Cm(0.25)
    par.paragraph_format.right_indent = Cm(0.15)
    par.paragraph_format.space_before = Pt(2)
    par.paragraph_format.space_after = Pt(4)
    par.paragraph_format.line_spacing = 1.05
    shade_paragraph(par, "F5F5F7")
    lines = str(text).replace("\r\n", "\n").replace("\r", "\n").split("\n")
    for i, line in enumerate(lines):
        if i:
            par.add_run().add_break()
        r = par.add_run(line.rstrip())
        set_run_font(r, name=CODE_FONT, size=size, color=RGBColor(0x2C, 0x2C, 0x30))
        r._element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:eastAsia"), "等线")
    return par


def callout(doc, title, lines, accent, fill=None, size=9.2):
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    set_table_borders(t, tint(accent, 0.55), 4)
    cell = t.rows[0].cells[0]
    cell.text = ""
    cell_margins(cell, 90, 90, 140, 120)
    shade_cell(cell, fill or tint(accent, 0.93))
    add_left_border(cell, accent, sz=20)
    par = cell.paragraphs[0]
    par.paragraph_format.space_after = Pt(2)
    if title:
        r = par.add_run(title)
        set_run_font(r, size=size + 0.4, bold=True, color=_rgb(accent))
    first = not bool(title)
    for line in lines:
        if not first:
            par = cell.add_paragraph()
        first = False
        par.paragraph_format.space_after = Pt(1)
        par.paragraph_format.line_spacing = 1.28
        add_rich(par, line, size=size, color=INK)
    spacer = doc.add_paragraph()
    spacer.paragraph_format.space_after = Pt(2)
    spacer.paragraph_format.line_spacing = 0.6


def note(doc, text, size=8.4):
    par = doc.add_paragraph()
    par.paragraph_format.left_indent = Cm(0.2)
    par.paragraph_format.space_after = Pt(3)
    add_rich(par, text, size=size, color=MUTED, italic=True)


def quote(doc, text, accent):
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    set_table_borders(t, tint(accent, 0.6), 4)
    cell = t.rows[0].cells[0]
    cell.text = ""
    cell_margins(cell, 80, 80, 120, 100)
    shade_cell(cell, "FBFBFD")
    add_left_border(cell, accent, sz=16)
    par = cell.paragraphs[0]
    add_rich(par, text, size=9.4, color=INK, italic=True)
    spacer = doc.add_paragraph()
    spacer.paragraph_format.space_after = Pt(2)
    spacer.paragraph_format.line_spacing = 0.6


# ---------------------------------------------------------------- cover
def make_document(title, en, subtitle, accent, meta_rows, running_title):
    doc = Document()
    setup_styles(doc, accent)
    sec = setup_page(doc)
    setup_chrome(doc, sec, running_title, accent)
    doc.core_properties.title = title
    doc.core_properties.subject = subtitle
    doc.core_properties.author = "Orbit · 个人复习资料"
    doc.core_properties.keywords = "期末复习, 大二上, " + title
    doc.core_properties.comments = "由 Orbit 地信复习系统数据生成；仅供个人学习使用。"

    # cover band
    band = doc.add_table(rows=1, cols=1)
    band.alignment = WD_TABLE_ALIGNMENT.CENTER
    band.autofit = False
    set_table_borders(band, accent, 0, inside=False)
    cell = band.rows[0].cells[0]
    cell.text = ""
    cell.width = Cm(17.0)
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    shade_cell(cell, accent)
    cell_margins(cell, 520, 520, 460, 360)
    par = cell.paragraphs[0]
    par.paragraph_format.space_after = Pt(10)
    r = par.add_run("ORBIT  ·  期末满分手册")
    set_run_font(r, size=8.5, bold=True, color=WHITE)
    par = cell.add_paragraph()
    par.paragraph_format.space_after = Pt(6)
    par.paragraph_format.line_spacing = 1.05
    r = par.add_run(title)
    set_run_font(r, size=25 if len(title) <= 14 else 21, bold=True, color=WHITE)
    par = cell.add_paragraph()
    par.paragraph_format.space_after = Pt(0)
    r = par.add_run(en)
    set_run_font(r, size=9.5, color=RGBColor(0xE8, 0xF2, 0xFF))

    p(doc, "", size=6, space_after=0)
    p(doc, "2026 年秋季学期  ·  大二上  ·  个人复习资料", size=9, color=MUTED, space_after=10)
    p(doc, subtitle, size=15, bold=True, space_after=8)
    p(doc, "把这一科，复习到没有意外。", size=10.5, color=MUTED, italic=True, space_after=22)

    meta = doc.add_table(rows=0, cols=2)
    meta.autofit = False
    set_table_borders(meta, "E5E5EA", 4)
    for k, v in meta_rows:
        row = meta.add_row()
        c0, c1 = row.cells
        c0.text = ""
        c1.text = ""
        shade_cell(c0, "F7F7F9")
        cell_margins(c0, 70, 70, 110, 90)
        cell_margins(c1, 70, 70, 110, 90)
        r = c0.paragraphs[0].add_run(k)
        set_run_font(r, size=9, bold=True, color=MUTED)
        c0.paragraphs[0].paragraph_format.space_after = Pt(0)
        add_rich(c1.paragraphs[0], v, size=9, color=INK)
        c1.paragraphs[0].paragraph_format.space_after = Pt(0)
    set_col_widths(meta, [4.6, 12.4])

    p(doc, "", size=6, space_after=0)
    p(doc, "本册由 Orbit 地信复习系统的题库、真题、讲义与课程资料汇总生成。"
           "标注“推断”的内容是根据现有材料反推，不是学校官方说明；一切以老师最后一节课为准。",
      size=8.2, color=FAINT, space_after=4)
    p(doc, "版本 v1.0  ·  生成日期 2026-11-18  ·  仅供个人学习，请勿商业传播",
      size=8.2, color=FAINT)

    # TOC page
    doc.add_page_break()
    p(doc, "目  录", size=20, bold=True, space_after=2)
    p(doc, "CONTENTS", size=8.5, color=FAINT, space_after=10)
    add_bottom_border(doc.paragraphs[-1], tint(accent, 0.55), sz=8, space=2)
    add_toc(doc)
    return doc


# ---------------------------------------------------------------- markdown
def md_to_doc(doc, text, accent, skip_title=True):
    """Render the site's nature-notes markdown into the handbook."""
    lines = text.replace("\r\n", "\n").split("\n")
    i = 0
    first_h1 = True
    while i < len(lines):
        line = lines[i].rstrip()
        s = line.strip()
        if not s:
            i += 1
            continue
        if s.startswith("```"):
            i += 1
            buf = []
            while i < len(lines) and not lines[i].strip().startswith("```"):
                buf.append(lines[i])
                i += 1
            code(doc, "\n".join(buf))
            i += 1
            continue
        if s.startswith("# "):
            if first_h1 and skip_title:
                first_h1 = False
                i += 1
                continue
            heading = s[2:].strip()
            if heading.startswith("第") and "部分" in heading:
                heading = "手写稿 · " + heading
            h1(doc, heading, page_break=True)
        elif s.startswith("## "):
            h2(doc, s[3:].strip())
        elif s.startswith("### "):
            h3(doc, s[4:].strip())
        elif s.startswith("#### "):
            h3(doc, s[5:].strip())
        elif s.startswith("##### "):
            p(doc, s[6:].strip(), size=10, bold=True, color=_rgb(accent))
        elif s.startswith("|") and i + 1 < len(lines) and re.match(r"^\|?\s*:?-{3,}", lines[i + 1].strip()):
            rows = []
            header = [c.strip() for c in s.strip("|").split("|")]
            i += 2
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")])
                i += 1
            table(doc, header, rows, size=8.4)
            continue
        elif s.startswith(">"):
            quote(doc, s.lstrip("> ").strip(), accent)
        elif re.match(r"^[-*]\s+", s):
            indent = len(line) - len(line.lstrip())
            level = 1 if indent >= 2 else 0
            bullets(doc, [re.sub(r"^[-*]\s+", "", s)], size=9.8, level=level)
        elif re.match(r"^\d+\.\s+", s):
            num, body = re.match(r"^(\d+)\.\s+(.*)$", s).groups()
            par = doc.add_paragraph()
            par.paragraph_format.left_indent = Cm(0.78)
            par.paragraph_format.first_line_indent = Cm(-0.38)
            par.paragraph_format.space_after = Pt(1.5)
            par.paragraph_format.line_spacing = 1.28
            add_rich(par, "%s. %s" % (num, body), size=9.8)
        else:
            p(doc, s, size=9.9)
        i += 1
