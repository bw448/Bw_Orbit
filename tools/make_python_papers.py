# -*- coding: utf-8 -*-
"""Generate complete Python paper PDFs and DOCX files (questions + answers)."""
import json
from pathlib import Path
from xml.sax.saxutils import escape

from docx import Document
from docx.oxml.ns import qn
from docx.shared import Pt, Cm, RGBColor
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, Frame, PageTemplate, Paragraph,
                                Spacer, PageBreak, HRFlowable)

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "papers"
DATA = json.load(open(ROOT / "src" / "python_questions.json", encoding="utf-8"))
TYPE_NAME = {"single": "单项选择", "multiple": "不定项选择", "short": "填空 / 简答"}

FONT_DIR = Path("C:/Windows/Fonts")
pdfmetrics.registerFont(TTFont("SimSun", str(FONT_DIR / "simsun.ttc"), subfontIndex=0))
pdfmetrics.registerFont(TTFont("SimSunBold", str(FONT_DIR / "simhei.ttf")))
pdfmetrics.registerFont(TTFont("YaHei", str(FONT_DIR / "msyh.ttc"), subfontIndex=0))
pdfmetrics.registerFont(TTFont("YaHeiBold", str(FONT_DIR / "msyhbd.ttc"), subfontIndex=0))
pdfmetrics.registerFontFamily("SimSun", normal="SimSun", bold="SimSunBold", italic="SimSun", boldItalic="SimSunBold")
pdfmetrics.registerFontFamily("YaHei", normal="YaHei", bold="YaHeiBold", italic="YaHei", boldItalic="YaHeiBold")

INK = colors.HexColor("#1d1d1f")
MUTED = colors.HexColor("#6e6e73")
BLUE = colors.HexColor("#0071e3")
LINE = colors.HexColor("#e8e8ed")
SOFT = colors.HexColor("#f5f5f7")

S = {
    "kicker": ParagraphStyle("kicker", fontName="YaHei", fontSize=9, leading=13, textColor=BLUE, spaceAfter=4),
    "title": ParagraphStyle("title", fontName="YaHeiBold", fontSize=28, leading=34, textColor=INK, spaceAfter=8),
    "sub": ParagraphStyle("sub", fontName="YaHei", fontSize=11, leading=18, textColor=MUTED),
    "section": ParagraphStyle("section", fontName="YaHeiBold", fontSize=15, leading=21, textColor=INK, spaceBefore=14, spaceAfter=8),
    "qnum": ParagraphStyle("qnum", fontName="YaHeiBold", fontSize=8, leading=12, textColor=BLUE, spaceBefore=9, spaceAfter=3),
    "body": ParagraphStyle("body", fontName="SimSun", fontSize=9.7, leading=15.5, textColor=INK, wordWrap="CJK", spaceAfter=3),
    "opt": ParagraphStyle("opt", fontName="SimSun", fontSize=9.4, leading=14.5, textColor=INK, leftIndent=12, wordWrap="CJK", spaceAfter=1),
    "answer": ParagraphStyle("answer", fontName="SimSun", fontSize=9.5, leading=15, textColor=INK, wordWrap="CJK", backColor=SOFT, borderColor=LINE, borderWidth=.5, borderPadding=6, spaceBefore=5, spaceAfter=4),
    "explain": ParagraphStyle("explain", fontName="SimSun", fontSize=8.8, leading=14, textColor=MUTED, wordWrap="CJK", leftIndent=8, spaceAfter=3),
    "note": ParagraphStyle("note", fontName="YaHei", fontSize=8.5, leading=14, textColor=MUTED),
}


def fmt(text):
    out = []
    for line in str(text or "").split("\n"):
        leading = len(line) - len(line.lstrip(" "))
        out.append("&nbsp;" * leading + escape(line.lstrip(" ")))
    return "<br/>".join(out)


def answer_text(q):
    if q["type"] == "single":
        return '%s. %s' % (chr(65 + q["a"]), q["options"][q["a"]])
    if q["type"] == "multiple":
        return "；".join('%s. %s' % (chr(65 + i), q["options"][i]) for i in q["a"])
    a = q.get("a", "")
    return " / ".join(a) if isinstance(a, list) else str(a)


def make_pdf(paper_numbers, out_path, combined=False):
    class Doc(BaseDocTemplate):
        def __init__(self, path, title, **kw):
            self.title_text = title
            BaseDocTemplate.__init__(self, path, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm,
                                     topMargin=20 * mm, bottomMargin=17 * mm, **kw)

        def header_footer(self, canv, doc):
            canv.saveState()
            canv.setFont("YaHei", 7.5)
            canv.setFillColor(MUTED)
            canv.drawString(18 * mm, A4[1] - 12 * mm, "Orbit · Python 十套卷")
            canv.drawRightString(A4[0] - 18 * mm, A4[1] - 12 * mm, self.title_text)
            canv.setStrokeColor(LINE); canv.setLineWidth(.5)
            canv.line(18 * mm, A4[1] - 14 * mm, A4[0] - 18 * mm, A4[1] - 14 * mm)
            canv.setFont("YaHei", 7.5)
            canv.drawCentredString(A4[0] / 2, 9 * mm, str(canv.getPageNumber()))
            canv.restoreState()

    label = "全部 10 套" if combined else "第 %d 套" % paper_numbers[0]
    doc = Doc(str(out_path), "%s · 题目 + 答案" % label)
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=doc.header_footer)])
    story = []
    if combined:
        story += [Spacer(1, 50 * mm), Paragraph("ORBIT · PYTHON", S["kicker"]),
                  Paragraph("Python 十套卷", S["title"]),
                  Paragraph("全部 10 套 · 599 题 · 完整题目与答案", S["sub"]),
                  Spacer(1, 8 * mm),
                  Paragraph("本文件包含十套卷的全部题目、参考答案与解析。题目按套和题型排列，答案紧随题目。", S["note"]),
                  PageBreak()]
    for n in paper_numbers:
        qs = [q for q in DATA if q["paper"] == n]
        if not combined:
            cc = {"single": 0, "multiple": 0, "short": 0}
            for q in qs:
                if q["type"] in cc: cc[q["type"]] += 1
            secs = []
            for q in qs:
                if q["section"] not in secs: secs.append(q["section"])
            story += [Spacer(1, 38 * mm), Paragraph("ORBIT · PYTHON · PAPER %02d" % n, S["kicker"]),
                      Paragraph("第 %d 套" % n, S["title"]),
                      Paragraph("%d 题 · 完整题目与答案" % len(qs), S["sub"]),
                      Spacer(1, 7 * mm),
                      Paragraph("单选 %d　多选 %d　填空 / 简答 %d" % (cc["single"], cc["multiple"], cc["short"]), S["body"]),
                      Spacer(1, 10 * mm),
                      HRFlowable(width="100%", thickness=.6, color=LINE, spaceBefore=0, spaceAfter=10),
                      Paragraph("本套分节", S["kicker"]),
                      Paragraph("　".join("%s（%d）" % (sec, sum(1 for q in qs if q["section"] == sec)) for sec in secs), S["note"]),
                      Spacer(1, 8 * mm),
                      Paragraph("答案与解析紧随每题；本文件用于复习核对，建议先独立作答。", S["note"]),
                      PageBreak()]
        else:
            story += [Paragraph("第 %d 套" % n, S["title"]), Paragraph("%d 题" % len(qs), S["sub"]), Spacer(1, 4 * mm)]
        current = None
        num = 0
        for q in qs:
            if q["section"] != current:
                current = q["section"]
                story.append(Paragraph(escape(current), S["section"]))
                story.append(HRFlowable(width="100%", thickness=.6, color=LINE, spaceBefore=0, spaceAfter=8))
            num += 1
            story.append(Paragraph("%02d · %s" % (num, TYPE_NAME.get(q["type"], q["type"])), S["qnum"]))
            story.append(Paragraph(fmt(q["q"]), S["body"]))
            for i, opt in enumerate(q.get("options") or []):
                story.append(Paragraph("<b>%s.</b> %s" % (chr(65 + i), fmt(opt)), S["opt"]))
            story.append(Paragraph("<b>答案</b>　" + fmt(answer_text(q)), S["answer"]))
            story.append(Paragraph("<b>解析</b>　" + fmt(q.get("e", "")), S["explain"]))
            story.append(Spacer(1, 5))
        if combined and n != paper_numbers[-1]:
            story.append(PageBreak())
    doc.build(story)
    return out_path


def set_doc_font(run, name="宋体", size=10.5, bold=False, color=None):
    run.font.name = "Times New Roman"
    run.font.size = Pt(size)
    run.font.bold = bold
    if color:
        run.font.color.rgb = RGBColor(*color)
    run._element.rPr.rFonts.set(qn("w:eastAsia"), name)


def add_para(doc, text, name="宋体", size=10.5, bold=False, space=4, color=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space)
    p.paragraph_format.line_spacing = 1.35
    lines = str(text or "").split("\n")
    for i, line in enumerate(lines):
        r = p.add_run(line)
        set_doc_font(r, name, size, bold, color)
        if i < len(lines) - 1:
            r.add_break()
    return p


def add_word(doc, paper_numbers, combined=False):
    sec = doc.sections[0]
    sec.top_margin = Cm(2); sec.bottom_margin = Cm(1.8)
    sec.left_margin = Cm(2); sec.right_margin = Cm(2)
    add_para(doc, "Orbit · Python 十套卷", "微软雅黑", 9, False, 4, (0, 113, 227))
    add_para(doc, "Python 十套卷" if combined else "第 %d 套" % paper_numbers[0], "微软雅黑", 26, True, 6)
    add_para(doc, "全部 10 套 · 599 题 · 完整题目与答案" if combined else "%d 题 · 完整题目与答案" % len([q for q in DATA if q["paper"] == paper_numbers[0]]), "微软雅黑", 11, False, 10, (110, 110, 115))
    add_para(doc, "本文件包含完整题目、参考答案与解析；答案紧随题目，建议先独立作答。", "微软雅黑", 9, False, 12, (110, 110, 115))
    if combined:
        doc.add_page_break()
    for n in paper_numbers:
        qs = [q for q in DATA if q["paper"] == n]
        if not combined:
            doc.add_page_break()
        else:
            if n != paper_numbers[0]:
                doc.add_page_break()
            add_para(doc, "第 %d 套" % n, "微软雅黑", 18, True, 6)
        current = None; num = 0
        for q in qs:
            if q["section"] != current:
                current = q["section"]
                add_para(doc, current, "微软雅黑", 13, True, 8)
            num += 1
            add_para(doc, "%02d · %s" % (num, TYPE_NAME.get(q["type"], q["type"])), "微软雅黑", 8.5, True, 3, (0, 113, 227))
            add_para(doc, q["q"], "宋体", 10.5, False, 3)
            for i, opt in enumerate(q.get("options") or []):
                add_para(doc, "%s. %s" % (chr(65 + i), opt), "宋体", 10, False, 1)
            p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(4)
            r = p.add_run("答案　"); set_doc_font(r, "宋体", 10, True)
            r = p.add_run(answer_text(q)); set_doc_font(r, "宋体", 10)
            p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(5)
            r = p.add_run("解析　"); set_doc_font(r, "宋体", 9.5, True, (110, 110, 115))
            r = p.add_run(str(q.get("e", ""))); set_doc_font(r, "宋体", 9.5, False, (110, 110, 115))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for n in range(1, 11):
        pdf = OUT / ("paper-%02d.pdf" % n)
        make_pdf([n], pdf)
        doc = Document(); add_word(doc, [n]); doc.save(OUT / ("paper-%02d.docx" % n))
        print("paper", n, pdf.stat().st_size // 1024, "KB")
    make_pdf(list(range(1, 11)), OUT / "python-all-papers.pdf", combined=True)
    doc = Document(); add_word(doc, list(range(1, 11)), combined=True); doc.save(OUT / "python-all-papers.docx")
    print("combined", (OUT / "python-all-papers.pdf").stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
