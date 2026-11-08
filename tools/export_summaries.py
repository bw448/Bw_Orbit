# -*- coding: utf-8 -*-
"""Export one review master document per subject.

Reads the site's own data (single source of truth) and writes .docx files to
C:\\Users\\Lenovo\\Desktop\\地信大二上\\系统整理好的复习资料\\

Run after any content change:  python tools/export_summaries.py
"""
import datetime
import json
import os
import re
import sys

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "src"))
OUT_DIR = r"C:\Users\Lenovo\Desktop\地信大二上\系统整理好的复习资料"
TODAY = datetime.date.today().isoformat()

INK = RGBColor(0x1D, 0x1D, 0x1F)
MUTED = RGBColor(0x6E, 0x6E, 0x73)
ACCENT = RGBColor(0x00, 0x71, 0xE3)


# ---------- docx helpers ----------
def cjk(run, name="微软雅黑"):
    run.font.name = name
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.get_or_add_rFonts()
    rFonts.set(qn("w:eastAsia"), name)


def new_doc(title, subtitle):
    doc = Document()
    sec = doc.sections[0]
    sec.top_margin = Cm(2.2)
    sec.bottom_margin = Cm(2.2)
    sec.left_margin = Cm(2.4)
    sec.right_margin = Cm(2.4)

    normal = doc.styles["Normal"]
    normal.font.name = "Microsoft YaHei"
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = INK
    normal.element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:eastAsia"), "微软雅黑")
    normal.paragraph_format.line_spacing = 1.45
    normal.paragraph_format.space_after = Pt(4)

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(18)
    r = p.add_run(title)
    r.bold = True
    r.font.size = Pt(24 if len(title) <= 20 else 18)
    r.font.color.rgb = INK
    cjk(r)

    p = doc.add_paragraph()
    r = p.add_run(subtitle)
    r.font.size = Pt(11)
    r.font.color.rgb = MUTED

    p = doc.add_paragraph()
    r = p.add_run("Orbit · 地信复习系统 · 生成于 " + TODAY)
    r.font.size = Pt(8.5)
    r.font.color.rgb = RGBColor(0x86, 0x86, 0x8B)
    return doc


def h1(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(16)
    p.paragraph_format.space_after = Pt(6)
    r = p.add_run(text)
    r.bold = True
    r.font.size = Pt(15)
    r.font.color.rgb = INK
    # bottom border
    pPr = p._p.get_or_add_pPr()
    pbdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "6")
    bottom.set(qn("w:space"), "3")
    bottom.set(qn("w:color"), "D2D2D7")
    pbdr.append(bottom)
    pPr.append(pbdr)


def h2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run(text)
    r.bold = True
    r.font.size = Pt(11.5)
    r.font.color.rgb = ACCENT


def para(doc, text, size=10.5, color=INK):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.font.size = Pt(size)
    r.font.color.rgb = color
    return p


def bullets(doc, items):
    for it in items:
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.space_after = Pt(1)
        r = p.add_run(it)
        r.font.size = Pt(10)


def numbered(doc, items):
    for it in items:
        p = doc.add_paragraph(style="List Number")
        p.paragraph_format.space_after = Pt(1)
        r = p.add_run(it)
        r.font.size = Pt(10)


def shade(cell, hexcolor):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hexcolor)
    tcPr.append(shd)


def table(doc, headers, rows, widths=None):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_row = t.rows[0]
    trPr = hdr_row._tr.get_or_add_trPr()
    tblHeader = OxmlElement("w:tblHeader")
    tblHeader.set(qn("w:val"), "true")
    trPr.append(tblHeader)
    hdr = hdr_row.cells
    for i, h in enumerate(headers):
        hdr[i].text = ""
        p = hdr[i].paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = INK
        shade(hdr[i], "F2F2F5")
    for row in rows:
        tr = t.add_row()
        trPr = tr._tr.get_or_add_trPr()
        cantSplit = OxmlElement("w:cantSplit")
        cantSplit.set(qn("w:val"), "true")
        trPr.append(cantSplit)
        cells = tr.cells
        for i, val in enumerate(row[:len(headers)]):
            cells[i].text = ""
            p = cells[i].paragraphs[0]
            r = p.add_run(str(val))
            r.font.size = Pt(9)
    if widths:
        for i, w in enumerate(widths):
            for row in t.rows:
                row.cells[i].width = Cm(w)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)
    return t


def note(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.3)
    r = p.add_run(text)
    r.font.size = Pt(9)
    r.font.color.rgb = MUTED
    r.italic = True


def sync_note(doc, sources, pages, num="六"):
    h1(doc, num + "、网站同步记录")
    para(doc, "这份文档不是手写稿，由网站数据自动生成；网站内容变化后重新导出即可保持一致。")
    table(doc, ["项目", "内容"], [
        ["生成脚本", "tools/export_summaries.py"],
        ["数据来源", "；".join(sources)],
        ["对应页面", "；".join(pages)],
        ["生成日期", TODAY],
    ])
    note(doc, "同步方式：改网站数据 → python build.py → python tools/export_summaries.py。"
              "遥感作业按章补齐后，本文件会自动反映新的作业状态。")


def short_loc(url):
    if url.startswith("http"):
        return "GitHub Release · " + url.rstrip("/").split("/")[-1]
    if url.startswith("assets/"):
        return "站内 · " + os.path.basename(url)
    return url


def load_json(name):
    return json.load(open(os.path.join(ROOT, "src", name), encoding="utf-8"))


def code_block(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.4)
    p.paragraph_format.space_after = Pt(6)
    r = p.add_run(text)
    r.font.name = "Consolas"
    r.font.size = Pt(8.5)
    r.font.color.rgb = INK
    r._element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:eastAsia"), "等线")


def homework_blocks(doc, blocks):
    for b in blocks or []:
        t = b.get("type")
        if t == "h2":
            h2(doc, b.get("text", ""))
        elif t == "q":
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(6)
            r = p.add_run(b.get("text", ""))
            r.bold = True
            r.font.size = Pt(10)
        elif t == "answer":
            para(doc, b.get("text", ""))
        elif t == "bullet":
            txt = b.get("text", "")
            if txt.startswith("•") or txt.startswith("·"):
                txt = txt.lstrip("•· ").strip()
                p = doc.add_paragraph(style="List Bullet")
            elif re.match(r"^[①-⑩]", txt):
                p = doc.add_paragraph()
                p.paragraph_format.left_indent = Cm(0.6)
            else:
                p = doc.add_paragraph(style="List Bullet")
            r = p.add_run(txt)
            r.font.size = Pt(9.5)
        elif t == "p":
            para(doc, b.get("text", ""), size=9.5, color=MUTED)
        elif t == "note":
            note(doc, b.get("text", ""))
        elif t == "formula":
            code_block(doc, b.get("text", ""))
        elif t == "table":
            rows = b.get("rows") or []
            if rows:
                table(doc, rows[0], rows[1:])
        elif t == "image":
            src = b.get("src", "")
            path = os.path.join(ROOT, src.replace("/", os.sep))
            if os.path.exists(path):
                try:
                    doc.add_picture(path, width=Cm(13.5))
                except Exception:
                    pass


# ---------- 1. remote sensing ----------
def doc_remote():
    from content import DATA
    homework = load_json("homework.json")["chapters"]
    notes = load_json("notes.json")
    glossary = open(os.path.join(ROOT, "assets", "glossary.js"), encoding="utf-8").read()
    gcount = len(re.findall(r"\{ch:\d+,", glossary))
    qtotal = sum(len(c.get("questions", [])) for c in DATA["chapters"]) + len(DATA["supplement"].get("questions", []))

    doc = new_doc("遥感导论 · 期末复习总纲", "大二上 · 遥感 · 90 题 / 8 章 / 7 套作业")
    h1(doc, "一、课程与考试总览")
    table(doc, ["项目", "内容"], [
        ["课程", "遥感导论（大二上）"],
        ["网站模块", "remote.html"],
        ["题库", "%d 题：作业主干 74 题 ＋ 教材补全 16 题" % qtotal],
        ["作业", "8 章；已完成 7 套，第五章“遥感图像处理”待补"],
        ["中英术语", "%d 条，支持搜索、按章筛选、随机一条" % gcount],
        ["讲义补充", "%d 条，来自老师复习 PDF，按章折叠" % sum(len(x.get("points", [])) for x in notes)],
    ])
    para(doc, "复习顺序：先把每章知识脉络读成一条线，再重做作业，最后刷题补术语。作业相当于老师的划重点；"
              "但仍有约 30% 的题不在作业里，需要过 PPT 和教材。")

    h1(doc, "二、章节框架")
    for c in DATA["chapters"]:
        hw = next((h for h in homework if h["chapter"] == c["id"]), None)
        hw_status = "待补" if (hw and hw.get("status") == "soon") else ("已完成" if hw else "—")
        h2(doc, "%02d %s（作业：%s；本章题：%d）" % (c["id"], c["title"], hw_status, len(c.get("questions", []))))
        bullets(doc, c.get("points", [])[:5])

    h1(doc, "三、题库与作业覆盖")
    rows = []
    for c in DATA["chapters"]:
        hw = next((h for h in homework if h["chapter"] == c["id"]), None)
        rows.append([c["title"], len(c.get("questions", [])),
                     "待补" if (hw and hw.get("status") == "soon") else "已录入"])
    rows.append(["教材补全", len(DATA["supplement"].get("questions", [])), "独立标签"])
    table(doc, ["章节", "题量", "作业状态"], rows)
    para(doc, "第五章目前没有作业与题目；知识脉络和术语可以先看。补齐第五章作业后，把 docx 放进“课程资料/遥感/作业分章”，"
              "运行同步脚本，题库与这份总纲会一起更新。")

    h1(doc, "四、复习路线")
    numbered(doc, [
        "按章过知识脉络：每章能用自己的话说明“研究什么—为什么—怎么用”。",
        "重做七套作业：遮住答案写一遍，特别是英汉互译、名词解释和计算题。",
        "刷 90 题并整理错题：单选/多选自动判分，填空与简答按参考答案自评。",
        "考前背 75 条中英术语 + 807 条教材附录（先附录 3 缩写，再附录 4 英汉词汇），重点看英中对应。",
        "用模拟卷限时一次，检查时间分配和术语拼写。",
    ])

    h1(doc, "五、资料清单")
    table(doc, ["资料", "用途", "位置"], [
        ["遥感导论教材 PDF", "补作业之外的 30%", "assets/ebooks/remote-sensing-intro.pdf"],
        ["七套作业原文", "划重点、计算题", "课程资料/遥感/作业分章；本文件第六节"],
        ["老师复习讲义补充", "61 条遗漏知识点", "remote.html#notes"],
        ["中英术语表", "75 条", "remote.html#glossary"],
        ["教材附录 3/4", "807 条英中词汇 / 缩写", "remote.html#appendix"],
        ["遥感.pdf（原始）", "完整教材/扫描", "课程资料/遥感/原始/遥感.pdf"],
    ])
    h1(doc, "六、分章作业原文（1—8）")
    para(doc, "按章保存作业原文、答案与表格，方便离线背诵；第五章补齐后，这一节会自动出现。")
    for hw in homework:
        status = "待补" if hw.get("status") == "soon" else "已完成"
        h2(doc, "第%s章作业 · %s（%s）" % ("一二三四五六七八"[hw["chapter"] - 1], hw.get("subtitle", ""), status))
        if hw.get("status") == "soon":
            para(doc, "本章作业尚未录入；知识脉络和中英术语可以先看。", color=MUTED)
            continue
        homework_blocks(doc, hw.get("blocks", []))

    sync_note(doc, ["src/content.py", "src/homework.json", "src/notes.json", "assets/glossary.js", "assets/rs-appendix-data.js"], ["remote.html"], num="七")
    return "遥感复习总纲.docx", doc


# ---------- 2/3. courses: nature & probability ----------
def doc_course(slug, filename, title, subtitle, sources, pages, extra_rows=None, extra_section=None):
    c = load_json("courses.json")[slug]
    doc = new_doc(title, subtitle)
    h1(doc, "一、考试与复习总览")
    rows = [["网站模块", "%s.html" % slug]]
    rows += [[x[0], x[1]] for x in c.get("exam", [])]
    if extra_rows:
        rows += extra_rows
    table(doc, ["项目", "内容"], rows)
    para(doc, c.get("intro", ""))

    h1(doc, "二、章节框架")
    for i, s in enumerate(c.get("sections", []), 1):
        h2(doc, "%02d %s" % (i, s["title"]))
        bullets(doc, s.get("points", []))
    if extra_section:
        extra_section(doc)

    h1(doc, "三、复习路线")
    numbered(doc, [p[1] + "：" + p[2] for p in c.get("plan", [])])

    h1(doc, "四、资料清单")
    table(doc, ["资料", "说明", "位置"], [[r[0], r[1], short_loc(r[2])] for r in c.get("resources", [])])

    practice = c.get("practice")
    if practice:
        h1(doc, "五、自测题")
        para(doc, practice.get("desc", ""))
        para(doc, practice.get("note", ""))
        para(doc, "题库在网站 %s#practice；答错自动进错题本，可看章节分布、导出和重练。本文档只列说明，题目以网站交互为准。" % pages[0].replace(".html", ""))
        h1(doc, "六、使用说明")
    else:
        h1(doc, "五、使用说明")
    para(doc, c.get("notice", ""))
    para(doc, "网站上的模块把章节、复习路线和资料放在同一页；这份文档用于打印、离线背诵和考前快速过一遍。")
    sync_note(doc, sources, pages)
    return filename, doc


# ---------- 4. maogai ----------
def doc_maogai():
    c = load_json("courses.json")["maogai"]
    bank = load_json("maogai_bank.json")
    special = load_json("maogai_special.json")
    meta = bank["meta"]
    doc = new_doc("毛概 · 期末复习总纲", "大二上 · 毛泽东思想和中国特色社会主义理论体系概论")
    h1(doc, "一、考试与复习总览")
    table(doc, ["项目", "内容"], [["网站模块", "maogai.html"]] + [[x[0], x[1]] for x in c.get("exam", [])])
    para(doc, c.get("intro", ""))

    h1(doc, "二、选择题纳入情况（本次核对）")
    para(doc, "结论：选择题已经纳入汇总资料，但原汇总只覆盖了 710 题；本次把《毛概期末考试题库》里未纳入的 355 题也解析进来，"
              "网站现在可以刷 %d 题。" % meta["total"])
    table(doc, ["来源", "题量", "状态", "说明"], [
        ["新教材章节题库", meta["new"], "已纳入", "《毛概选择题题库（去重汇总）》第一部分"],
        ["旧教材综合题库", meta["old"], "已纳入", "同上，第二部分；第 1—8 章优先"],
        ["期末补充题库", meta["supplement"], "本次补齐", "《毛概期末考试题库 1.pdf》，按题干去重后新增"],
        ["2024/2025 真题选择题", 100, "已上线", "maogai.html#real；2024、2025 各 50 题，带考点解析"],
        ["合计可刷", meta["total"] + 100, "网站已上线", "系统题库 1065 ＋ 真题 100；单选自动判分，多选少选/错选不得分"],
    ])
    note(doc, "原资料个别题目有错字或答案争议；遇到与教材、课后题不一致的，以教材和课后题为准。")
    para(doc, "网站另提供《大题背诵版》118 题（核心篇 47 ＋ 后半篇 71），按得分点折叠展示；本文件不重复全文，只保留章节框架和高频考点。")

    h1(doc, "三、高频考点（★ 优先）")
    para(doc, "从《毛概选择题专项》整理出 %d 条考点，其中 ★ 高频 %d 条。背法：先记冒号前的关键词，再记冒号后的关键术语。" %
         (len(special["points"]), sum(1 for p in special["points"] if p["star"])))
    current = ""
    for p in special["points"]:
        if not p["star"]:
            continue
        if p["chapter"] != current:
            current = p["chapter"]
            h2(doc, current)
        bullets(doc, ["%s：%s" % (p["keyword"], p["text"])])
    para(doc, "完整 %d 条考点在 maogai.html#points，可按章节、关键词、★ 筛选。" % len(special["points"]))

    h1(doc, "四、易混对比")
    para(doc, "考前最后一遍：把成对概念放在一起，用一句话说清区别。")
    table(doc, ["概念 A", "概念 B", "一句话区别"],
          [[x["a"], x["b"], x["diff"]] for x in special["confusions"]], widths=[4.0, 4.0, 8.0])

    h1(doc, "五、章节框架")
    for i, s in enumerate(c.get("sections", []), 1):
        h2(doc, "%02d %s" % (i, s["title"]))
        bullets(doc, s.get("points", []))

    h1(doc, "六、复习路线")
    numbered(doc, [p[1] + "：" + p[2] for p in c.get("plan", [])])
    para(doc, "选择题建议每天 1—2 章：新教材题库优先，旧教材第 1—8 章次之，期末补充题库用于查漏；真题 100 道放在考前一周限时做。")

    h1(doc, "七、资料清单")
    table(doc, ["资料", "说明", "位置"], [[r[0], r[1], short_loc(r[2])] for r in c.get("resources", [])])
    para(doc, "网站内提供系统题库 1065 道、真题 100 道、高频考点 256 条和易混对比 39 组；PDF 资料用于看解析和打印。")
    sync_note(doc, ["src/courses.json", "src/maogai_bank.json", "src/maogai_special.json"], ["maogai.html"], num="八")
    return "毛概复习总纲.docx", doc


# ---------- 5. python ----------
def doc_python():
    guide = load_json("python_guide.json")
    topics = load_json("python_topics.json")
    qs = load_json("python_questions.json")
    from collections import Counter
    types = Counter(q["type"] for q in qs)
    papers = Counter(q["paper"] for q in qs)

    doc = new_doc("Python 地理数据处理与分析 · 期末复习总纲", "大二上 · 599 题题库 ＋ 知识地图")
    h1(doc, "一、考试说明")
    table(doc, ["题型", "题量", "分值", "说明"],
          [[x["name"], "%d 题" % x["n"], "%d 分" % x["total"], x["note"]] for x in guide["exam"]["items"]])
    para(doc, "总分 %d 分。老师原话：考试题比复习题简单得多；程序设计题会给出逐行提示，基本几行代码。"
              "复习重点是 Matplotlib、Pandas、GeoPandas、类、GDAL 的基本用法。" % guide["exam"]["total"])
    bullets(doc, guide["exam"].get("notes", [])[:3])

    h1(doc, "二、知识框架")
    for layer in guide["layers"]:
        h2(doc, layer["name"] + "（" + layer["en"] + "）")
        mods = [m for m in guide["modules"] if m["layer"] == layer["id"]]
        for m in mods:
            n = topics["counts"].get(m["id"], 0)
            para(doc, "· %s：%s（题库匹配约 %d 题）" % (m["title"], m["why"], n))
            bullets(doc, m["points"][:4])

    h1(doc, "三、题库结构与覆盖")
    table(doc, ["题型", "题量"], [
        ["单项选择题", types.get("single", 0)],
        ["多项选择题", types.get("multiple", 0)],
        ["填空题", sum(1 for q in qs if q["section"] == "三、填空题")],
        ["程序代码阅读题", sum(1 for q in qs if q["section"] == "四、程序代码阅读题")],
        ["程序设计题", sum(1 for q in qs if q["section"] == "五、程序设计题")],
        ["合计", len(qs)],
    ])
    para(doc, "十套卷每套约 60 题；第 3 套 59 题。题库保持原样，本文件与网站知识地图只做导航，不改题、不删题。")
    rows = []
    for m in guide["modules"]:
        rows.append([m["title"], topics["counts"].get(m["id"], 0),
                     "不足，需补课件" if topics["counts"].get(m["id"], 0) < 5 else "可刷题巩固"])
    table(doc, ["主题", "题库匹配题量", "建议"], rows)
    para(doc, "注意：Matplotlib 仅约 2 题，GeoPandas、GDAL 基本为 0；这不是题库遗漏，而是十套卷按语言与 OOP 组织。"
              "这三块必须回到课件和 notebook 亲手跑代码。")

    para(doc, "网站新增两个入口：知识地图每个模块的“做这一块”直接进入该主题题集；模拟卷新增“真实结构 100 分卷”（20 单选 + 10 多选 + 10 填空 + 3 代码阅读 + 3 程序设计）。")

    h1(doc, "四、复习路线")
    numbered(doc, [p[1] + "：" + p[2] for p in guide["plan"]])

    h1(doc, "五、原始资料")
    table(doc, ["资料", "用途"], [[s[0], s[1]] for s in guide["sources"]])
    para(doc, "原始文件位置：课程资料/Python/原始/（Python地理处理、python(面向对象开发)-BW）。"
              "题库与十套卷仍在 python.html；知识地图在 python-guide.html。")
    sync_note(doc, ["src/python_questions.json", "src/python_guide.json", "src/python_topics.json"],
              ["python.html", "python-guide.html"])
    return "Python地理处理复习总纲.docx", doc


# ---------- 6. arcgis ----------
def doc_arcgis():
    c = load_json("courses.json")["arcgis"]
    a = load_json("arcgis_bank.json")
    from collections import Counter
    bank_types = Counter(x["type"] for x in a["bank"])
    doc = new_doc("ArcGIS 空间分析 · 期末复习总纲", "大二上 · GIS 空间分析 · 80 道客观题 ＋ 模板")
    h1(doc, "一、考试与复习总览")
    table(doc, ["项目", "内容"], [["网站模块", "arcgis.html"]] + [[x[0], x[1]] for x in a["exam"]])
    para(doc, c.get("intro", ""))

    h1(doc, "二、题库与模板（本次新增）")
    table(doc, ["内容", "数量", "说明"], [
        ["填空题", bank_types.get("fill", 0), "扫描件 25 页，自评"],
        ["单项选择题", bank_types.get("single", 0), "自动判分"],
        ["判断题", bank_types.get("judge", 0), "判断＋改正理由"],
        ["简答题", len(a["short"]), "按点自评"],
        ["分析题", len(a["analysis"]), "按步骤自评"],
        ["名词解释", len(a["terms"]), "含英文与记忆骨架"],
        ["中英词汇", len(a["vocab"]), "必背 12 条"],
        ["底层算法", len(a["algorithms"]), "文字原理＋注释代码"],
        ["实操流程", len(a["workflows"]), "六个综合实验"],
        ["论述模板", len(a["essay"]["types"]), "三类实验＋五条金句"],
    ])
    note(doc, "题库来自课程扫描件《一填空题》25 页；答案以原扫描件为准，个别表述保留了原件的写法。")

    h1(doc, "三、章节框架")
    for i, s in enumerate(c.get("sections", []), 1):
        h2(doc, "%02d %s" % (i, s["title"]))
        bullets(doc, s.get("points", []))

    h1(doc, "四、复习路线")
    numbered(doc, [p[1] + "：" + p[2] for p in a["plan"]])

    h1(doc, "五、资料清单")
    table(doc, ["资料", "说明", "位置"], [[r[0], r[1], short_loc(r[2])] for r in a["resources"]])
    para(doc, "题库已在 arcgis.html#quiz；本文件用于打印客观题答案、算法和模板。")

    h1(doc, "六、客观题 80 道（附答案）")
    para(doc, "填空 30 道：先遮住右列自己写，再对照答案；判断题的“改正”列就是考场要写的理由。")
    h2(doc, "填空题 30 道")
    rows = []
    for x in [i for i in a["bank"] if i["type"] == "fill"]:
        rows.append([x["id"].replace("ag-f", ""), x["q"].replace("____", "______"), " / ".join(x["answers"])])
    table(doc, ["#", "题干", "答案"], rows, widths=[1.0, 10.5, 4.0])
    h2(doc, "单项选择题 20 道")
    rows = []
    for x in [i for i in a["bank"] if i["type"] == "single"]:
        opts = "；".join("ABCD"[j] + " " + o for j, o in enumerate(x["options"]))
        rows.append([x["id"].replace("ag-s", ""), x["q"] + " ／ " + opts,
                     "ABCD"[x["answer"][0]] if isinstance(x["answer"], list) else "ABCD"[x["answer"]]])
    table(doc, ["#", "题干", "答案"], rows, widths=[1.0, 11.5, 2.0])
    h2(doc, "判断题 30 道")
    rows = []
    for x in [i for i in a["bank"] if i["type"] == "judge"]:
        rows.append([x["id"].replace("ag-j", ""), "对" if x["answer"] else "错", x["q"], x["explain"]])
    table(doc, ["#", "判断", "题干", "改正/解析"], rows, widths=[1.0, 1.2, 7.0, 6.3])

    h1(doc, "七、算法与实操速记")
    for algo in a["algorithms"]:
        h2(doc, "算法 · " + algo["title"])
        para(doc, algo["principle"])
        para(doc, "答题： " + algo["exam"])
    for wf in a["workflows"]:
        h2(doc, "实操 · " + wf["title"])
        para(doc, wf["goal"])
        numbered(doc, wf["steps"])
        para(doc, "考场写法： " + wf["exam"])

    sync_note(doc, ["src/courses.json", "src/arcgis_bank.json"], ["arcgis.html"], num="八")
    return "ArcGIS空间分析复习总纲.docx", doc


# ---------- index ----------
def write_index(names):
    path = os.path.join(OUT_DIR, "00_目录与同步说明.md")
    lines = [
        "# 系统整理好的复习资料",
        "",
        "一个科目一份总纲，均由网站数据自动生成，不是手写稿。",
        "",
        "| 科目 | 文档 | 对应网站 |",
        "|---|---|---|",
        "| 遥感 | 遥感复习总纲.docx（含“六、分章作业原文”） | remote.html |",
        "| 自然地理学 | 自然地理学复习总纲.docx | nature-geo.html |",
        "| 概率论 | 概率论复习总纲.docx | probability.html |",
        "| 毛概 | 毛概复习总纲.docx（含高频考点/易混/章节框架） | maogai.html |",
        "| Python | Python地理处理复习总纲.docx | python.html / python-guide.html |",
        "| ArcGIS | ArcGIS空间分析复习总纲.docx | arcgis.html |",
        "",
        "## 同步方式",
        "",
        "内容以网站数据为准。改完网站后运行：",
        "",
        "```powershell",
        "cd E:\\地信复习系统",
        "python tools/check_site.py",
        "python build.py",
        "python tools/export_summaries.py",
        "```",
        "",
        "如果补了新的遥感作业（例如第五章）：",
        "",
        "1. 把 `第五章作业.docx` 放进 `课程资料/遥感/作业分章/`；",
        "2. 运行 `python tools/sync_content.py`；",
        "3. 它会依次执行作业抽取、建站和本文件夹的总纲导出。",
        "",
        "生成日期：" + TODAY,
    ]
    open(path, "w", encoding="utf-8").write("\n".join(lines) + "\n")
    print("written", path)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    jobs = [doc_remote(), doc_python(), doc_arcgis(), doc_maogai()]
    jobs.append(doc_course(
        "nature-geo", "自然地理学复习总纲.docx",
        "自然地理学 · 期末复习总纲", "大二上 · 老师最后一节课划重点",
        ["src/courses.json", "src/homework.json", "src/nature_bank.json"], ["nature-geo.html"],
        extra_rows=[["优先顺序", "勾画/画勾 ＞ 圈画 ＞ 手写问题 ＞ 教材通读"]]))
    jobs.append(doc_course(
        "probability", "概率论复习总纲.docx",
        "概率论与数理统计 · 期末复习总纲", "大二上 · PPT 原题优先",
        ["src/courses.json", "src/probability_bank.json"], ["probability.html"],
        extra_rows=[["原题优先级", "老师 PPT 上的题 > 2022—2023 期末卷 > 教材习题"]]))
    names = []
    for fname, doc in jobs:
        path = os.path.join(OUT_DIR, fname)
        doc.save(path)
        names.append(fname)
        print("written", path)
    write_index(names)


if __name__ == "__main__":
    main()
