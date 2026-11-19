# -*- coding: utf-8 -*-
"""Build the six printable exam handbooks (DOCX -> PDF via Word).

Usage:
    python tools/build_handbooks.py            # all six
    python tools/build_handbooks.py remote     # one subject (for iteration)

Outputs:
    %USERPROFILE%\\Desktop\\地信大二上\\复习汇总\\*.pdf
    assets/handbooks/*.pdf   (for the Orbit site)
"""
import json
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOLS = os.path.join(ROOT, "tools")
sys.path.insert(0, TOOLS)
sys.path.insert(0, os.path.join(ROOT, "src"))

from handbook_lib import (  # noqa: E402
    INK, MUTED, FAINT, WHITE, BODY_FONT, CODE_FONT,
    h1, h2, h3, p, p_plain, bullets, numbered, table, code, callout, note, quote,
    make_document, md_to_doc, add_rich,
)
import handbook_content as C  # noqa: E402

SRC = os.path.join(ROOT, "src")
WORK = os.path.join(ROOT, ".work", "handbooks")
DOCX_DIR = os.path.join(WORK, "docx")
PDF_DIR = r"%USERPROFILE%\Desktop\地信大二上\复习汇总"
SITE_DIR = os.path.join(ROOT, "assets", "handbooks")
PS1 = os.path.join(WORK, "docx2pdf.ps1")


def load(name):
    with open(os.path.join(SRC, name), encoding="utf-8") as f:
        return json.load(f)


def read(name):
    with open(os.path.join(SRC, name), encoding="utf-8") as f:
        return f.read()


def clean(text, limit=None):
    if text is None:
        return ""
    s = str(text).replace("\r\n", "\n").replace("\r", "\n")
    s = s.replace("•", "·")
    s = re.sub(r"[ \t]+\n", "\n", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    s = s.strip()
    if limit and len(s) > limit:
        cut = s[:limit]
        best = -1
        for sep in ("。", "；", "\n", "！", "？"):
            pos = cut.rfind(sep)
            if pos > limit * 0.55 and pos > best:
                best = pos + len(sep)
        if best > 0:
            cut = cut[:best]
        s = cut.rstrip() + "\n……"
    return s


def answer_text(item):
    ans = item.get("answer", item.get("a", item.get("answers")))
    opts = item.get("options") or []
    if isinstance(ans, bool):
        return "对" if ans else "错"
    if isinstance(ans, list):
        if opts and all(isinstance(x, int) for x in ans):
            return "、".join("%s. %s" % ("ABCDEFGH"[x] if x < 8 else str(x), opts[x]) for x in ans)
        vals = []
        keys = []
        for a in ans:
            text = str(a).strip()
            key = re.sub(r"\s+", "", text).lower()
            if text and key not in keys:
                keys.append(key)
                vals.append(text)
        return "、".join(vals)
    if isinstance(ans, int):
        if opts and ans < len(opts):
            return "%s. %s" % ("ABCDEFGH"[ans], opts[ans])
        return str(ans)
    return str(ans)


def mcq(doc, idx, item, size=8.9):
    q = clean(item.get("q", ""))
    if item.get("type") in ("multiple", "multi") and not q.startswith("（多选）"):
        q = "（多选）" + q
    p(doc, "%d. %s" % (idx, q), size=size, space_after=0.5, keep=True)
    opts = item.get("options") or []
    if opts:
        line = "　".join("%s. %s" % ("ABCDEFGH"[i], clean(o)) for i, o in enumerate(opts))
        p(doc, line, size=size - 0.5, color=INK, space_after=0.5, indent=0.35, keep=True)
    expl = clean(item.get("e", item.get("explain", "")), limit=260)
    ans = answer_text(item)
    line = "答案：%s" % ans
    if expl:
        line += "　解析：%s" % expl
    p(doc, line, size=size - 0.8, color=MUTED, space_after=5, indent=0.35)


def mcq_no_expl(doc, idx, item, size=8.7):
    q = clean(item.get("q", ""))
    p_plain(doc, "%d. %s" % (idx, q), size=size, space_after=0.5, keep=True)
    opts = item.get("options") or []
    if opts:
        line = "　".join("%s. %s" % ("ABCDEFGH"[i], clean(o)) for i, o in enumerate(opts))
        p_plain(doc, line, size=size - 0.5, color=INK, space_after=0.5, indent=0.35, keep=True)
    p_plain(doc, "答案：%s" % answer_text(item), size=size - 0.8, color=MUTED, space_after=5, indent=0.35)


def mcq_compact(doc, idx, item, size=8.6):
    q = clean(item.get("q", ""))
    if item.get("type") == "multi":
        q = "（多选）" + q
    p(doc, "%d. %s" % (idx, q), size=size, space_after=0.5)
    opts = item.get("options") or []
    if opts:
        line = "　".join("%s. %s" % ("ABCDEFGH"[i], clean(o)) for i, o in enumerate(opts))
        p(doc, line, size=size - 0.5, space_after=0.5, indent=0.35)
    p(doc, "答案：%s" % answer_text(item), size=size - 0.8, color=MUTED, space_after=4, indent=0.35)


def short_q(doc, idx, item, kind="fill", size=8.9):
    q = clean(item.get("q", ""))
    p_plain(doc, "%d. %s" % (idx, q), size=size, space_after=1)
    ans = clean(item.get("a", ""))
    expl = clean(item.get("e", ""), limit=420)
    if ans:
        if "\n" in ans and re.search(r"(def |class |import |print\()", ans):
            p_plain(doc, "参考答案：", size=size - 0.5, color=MUTED, space_after=1, indent=0.35)
            code(doc, ans, size=7.4)
        else:
            p_plain(doc, "答案：%s" % ans, size=size - 0.5, color=INK, space_after=1, indent=0.35)
    if expl:
        p_plain(doc, "解析：%s" % expl, size=size - 1.0, color=MUTED, space_after=5, indent=0.35)


def render_homework_blocks(doc, blocks):
    for b in blocks or []:
        t = b.get("type")
        if t == "h2":
            h3(doc, b.get("text", ""))
        elif t == "q":
            p(doc, b.get("text", ""), size=9.3, bold=True, space_after=1)
        elif t == "answer":
            p(doc, b.get("text", ""), size=9.2, space_after=1, indent=0.2)
        elif t == "bullet":
            txt = b.get("text", "")
            txt = re.sub(r"^[•·]\s*", "", txt)
            if re.match(r"^[①-⑩]", txt):
                p(doc, txt, size=9.2, space_after=1, indent=0.5)
            else:
                bullets(doc, [txt], size=9.2)
        elif t == "p":
            note(doc, b.get("text", ""))
        elif t == "note":
            note(doc, b.get("text", ""))
        elif t == "formula":
            code(doc, b.get("text", ""))
        elif t == "table":
            rows = b.get("rows") or []
            if rows:
                table(doc, rows[0], rows[1:], widths=b.get("widths"), size=b.get("size", 8.2), merge_first_col=b.get("merge_first_col", False))
        elif t == "image":
            src = b.get("src", "")
            path = os.path.join(ROOT, src.replace("/", os.sep))
            if os.path.exists(path):
                try:
                    doc.add_picture(path, width=None)
                except Exception:
                    pass


def parse_glossary():
    s = read(os.path.join("..", "assets", "glossary.js"))
    out = []
    for m in re.finditer(r'\{ch:(\d+), zh:"(.*?)", en:"(.*?)", def:"(.*?)", zhDef:"(.*?)"\}', s, re.S):
        out.append({"ch": int(m.group(1)), "zh": m.group(2), "en": m.group(3),
                    "def": m.group(4), "zh_def": m.group(5)})
    return out


def parse_appendix():
    s = read(os.path.join("..", "assets", "rs-appendix-data.js"))
    s = s[s.find("{"): s.rfind("}") + 1]
    return json.loads(s)


# ---------------------------------------------------------------------------
def common_intro(doc):
    h1(doc, "使用说明")
    p(doc, "这本册子把 Orbit 网站、课程资料、老师复习材料和真题重新排成一条复习线。"
           "它不是网页的打印版：每一科前面先写“怎么考、考什么”，再给知识体系、题型模板、题库和考前清单。",
      size=10.2)
    h3(doc, "怎么用")
    numbered(doc, C.HOW_TO_USE, size=9.4)
    h3(doc, "标记说明")
    table(doc, ["标记", "含义"], [[a, b] for a, b in C.MARKS], widths=[2.0, 15.0], size=8.8)
    h3(doc, "来源与边界")
    bullets(doc, C.SOURCE_NOTE, size=9.0)
    note(doc, "生成日期：%s。本册与网站数据同源；如遇内容更新，以网站最新版为准。" % C.TODAY)


def part_exam(doc, exam, title="第一部分 考试信息"):
    h1(doc, title)
    rows = exam.get("brief") or exam["one_page"][:4]
    table(doc, ["项目", "内容"], rows, widths=[3.2, 13.8], size=9.2)

    h2(doc, "章节重点")
    weights = exam["weights"]
    if weights and len(weights[0]) == 3:
        table(doc, ["章节/模块", "权重", "重点"], weights,
              widths=[6.0, 2.5, 8.5], size=8.8)
    else:
        table(doc, ["章节/模块", "题量/分值", "权重"], [r[:3] for r in weights],
              widths=[7.0, 3.0, 7.0], size=8.8)
    h2(doc, "易错点")
    bullets(doc, exam["pitfalls"][:6], size=9.8)


def part_checklist(doc, title, items, accent):
    h1(doc, title)
    p(doc, "考前逐条打勾；打不了勾的回到对应章节，不再开新题。", size=9.8)
    for i, it in enumerate(items, 1):
        p(doc, "□  %d. %s" % (i, it), size=10.0, space_after=3)


# ---------------------------------------------------------------------------
def build_remote():
    meta = C.REMOTE_META
    doc = make_document(meta["title"], meta["en"], meta["subtitle"], meta["accent"], [
        ("科目", "遥感导论 · 大二上"),
        ("适用", "期末复习 / 打印背诵 / 考前速查"),
        ("数据", "Orbit remote.html；7 套作业；老师 30 页手写复习；90 题；807 条附录"),
        ("版本", "v1.0 · " + C.TODAY),
    ], meta["running"])
    note(doc, "遥感分册答案校订来源：老师 PPT 截图（遥感10.30 PDF）、教材《遥感导论》（梅安新等）、30 页真实手写复习、老师复习讲义；四处交叉比对，未联网搜索。", size=8.5)
    part_exam(doc, C.REMOTE_EXAM)

    h1(doc, "第二部分 知识体系：8 章一条线")
    from content import DATA
    notes = load("notes.json")
    homework = load("homework.json")["chapters"]
    for ch in DATA["chapters"]:
        h2(doc, "%02d %s（%s）" % (ch["id"], ch["title"], ch.get("en", "")))
        p(doc, ch.get("desc", ""), size=9.5, color=MUTED)
        h3(doc, "课堂主线")
        bullets(doc, ch.get("points", []), size=9.3)
        nt = next((x for x in notes if x.get("title") == ch["title"]), None)
        if nt:
            h3(doc, "老师复习补充（30 页手写稿）")
            bullets(doc, nt.get("points", []), size=9.1)
        hw = next((x for x in homework if x["chapter"] == ch["id"]), None)
        if hw and hw.get("status") == "soon":
            note(doc, "本章本站暂无作业题；以上知识点与讲义补充必须自己过 PPT，尤其是辐射校正、几何校正、彩色合成、NDVI。")
        if ch["id"] == 4:
            h3(doc, "PPT 10.30 重点：像片投影、比例尺与扫描")
            table(doc, ["项目", "中心投影", "正射投影"], [
                ["投影方式", "投影中心一点发出，比例尺随航高/投影距离变化", "平行投影，比例尺与投影距离无关"],
                ["投影面倾斜", "航片各部分比例尺不同", "总是水平，不存在倾斜问题"],
                ["地形起伏", "产生投影差，像片各部分比例尺不同", "地形起伏无影响"],
            ], widths=[3.0, 7.4, 6.6], size=8.4)
            bullets(doc, [
                "像片比例尺：1/m = f/H（f 焦距，H 航高）；地面起伏时 1/m = f/(H₀±h)。",
                "平均比例尺：以各点平均高程为起始面；主比例尺：由像主点航高计算，可概略代表整张航片。",
                "光机扫描总视场：L=2H·tan φ（L 扫描带地面宽度，H 平台高度）；瞬时视场 2θ 决定空间分辨率。",
                "摄影胶片物理特性：感光度、光学密度、反差与反差系数、灰雾度、宽容度、解像力（线对/毫米）。",
                "扫描成像三类：光机扫描（红外扫描仪、多光谱扫描仪 MSS、专题制图仪 TM）、固体自扫描（CCD 线阵列）、高光谱成像光谱扫描。",
                "雷达按工作方式分成像雷达（真实孔径侧视雷达、合成孔径侧视雷达）与非成像雷达；脉冲式雷达由发射机、转换开关、天线、接收机、显示器组成。",
            ], size=9.0)
            h3(doc, "雷达遥感信息特征（PPT 8 条）")
            bullets(doc, [
                "雷达影像色调差异主要取决于回波强弱。",
                "距离近的物体回波强，距离远的物体回波弱。",
                "金属物体往往有较强回波。",
                "平行于航向的物体回波较强。",
                "受地形起伏影响，雷达波不能到达之处形成雷达阴影。",
                "受天线角度影响，地面镜面目标无回波。",
                "雷达影像上线状地物一般比较清晰。",
                "雷达影像的立体感较强。",
            ], size=8.9)
        if ch["id"] == 1:
            h3(doc, "遥感 / 遥测 / 遥控：别写混")
            table(doc, ["概念", "英文", "核心", "一句话区分"], [
                ["遥感", "Remote Sensing", "不接触目标，通过电磁波探测和识别", "感知目标是什么"],
                ["遥测", "Telemetry", "远距离测量对象的运动参数和性质", "测量目标的状态参数"],
                ["遥控", "Remote Control", "远距离控制目标运动状态和过程", "控制目标怎么动"],
            ], widths=[2.2, 4.2, 6.8, 3.8], size=8.4)
            callout(doc, "发展趋势：按老师 PPT 的五方面答", [
                "平台：多层次立体遥感（大型极轨组合平台、小卫星系列、多高度/多轨道组合）。",
                "传感器：全波段、主动式、小型化、高分辨率、高灵敏度。",
                "信息处理：自动化、模式化。",
                "应用：更广泛、实用化、商业化、国际化。",
                "面向其他星球：火星等深空探测将有较大发展。",
            ], meta["accent"])

    h2(doc, "PPT 常考补充：波段、分辨率、摄影与地学作用")
    h3(doc, "波段范围与典型应用")
    table(doc, ["波段", "波长范围", "典型应用"], [
        ["紫外", "0.3—0.38 μm", "油膜、碳酸盐岩；需紫外滤光片"],
        ["可见光", "0.38—0.76 μm", "地物颜色、摄影成像主波段"],
        ["红外", "0.76—1000 μm", "植被、温度、地质；分近/中/远红外"],
        ["微波", "1 mm—1 m", "全天候、穿透云层；侧视雷达"],
    ], widths=[2.4, 4.0, 10.6], size=8.5)
    h3(doc, "空间分辨率分级（记代表卫星）")
    table(doc, ["级别", "分辨率", "代表"], [
        ["低", "1 km 以上", "气象卫星（NOAA/AVHRR、MODIS 部分波段）"],
        ["中等", "100 m—1 km", "MODIS（250—1000 m）"],
        ["较高", "10—100 m", "MSS/Landsat TM/SPOT/中巴资源卫星"],
        ["高", "1—10 m", "QuickBird、IKONOS、高分系列"],
    ], widths=[2.4, 3.6, 11.0], size=8.5)
    h3(doc, "摄影成像要点")
    bullets(doc, [
        "历史最长、信息量大、分辨率高；工作波段 0.3—0.9 μm，只能白天工作。",
        "胶片：黑白、彩色、红外片；滤光片：紫外、红外、多波段。",
        "中心投影：比例尺随航高/投影距离变化，投影面倾斜和地形起伏产生像点位移。",
    ], size=9.0)
    h3(doc, "遥感在地学研究中的作用")
    bullets(doc, [
        "重要信息源：多时相、多波段、大范围。",
        "改变研究模式：从定性到定量、从静态到动态。",
        "与 GIS 结合：遥感提供数据，GIS 管理分析，形成“获取—处理—分析—应用”闭环。",
    ], size=9.0)
    h3(doc, "土壤与岩石光谱")
    bullets(doc, [
        "土壤：无明显峰谷，反射率随波长增加；有机质、含水量增加会使反射率降低；粗颗粒反射率高于细颗粒。",
        "岩石：与矿物成分、风化程度、粗糙度、粒径有关；岩性识别看色调、形状、水系、地貌和植被。",
    ], size=9.0)

    h1(doc, "第三部分 题型解法与答题模板")
    note(doc, "以下题型与分值为根据作业/学长经验反推的【推断】，不是官方通知；以老师最后一节课为准。", size=8.6)
    for title, items in C.REMOTE_TEMPLATES:
        h2(doc, title)
        bullets(doc, items, size=9.3)
    h2(doc, "计算专项：8 类必会")
    for title, items in C.REMOTE_CALC:
        h3(doc, title)
        bullets(doc, items, size=9.2)

    h1(doc, "第四部分 分章作业原文（1—8）")
    p(doc, "作业相当于老师划重点：先遮住答案自己写，再对照。第五章本站暂无作业，用讲义补充代替。", size=9.5)
    for hw in homework:
        cn = "一二三四五六七八"[hw["chapter"] - 1]
        h2(doc, "第%s章作业 · %s" % (cn, hw.get("subtitle", "")))
        if hw.get("status") == "soon":
            p(doc, "本章作业尚未录入。请按第二部分第 5 章的知识点和讲义补充复习。", color=MUTED)
            continue
        render_homework_blocks(doc, hw.get("blocks", []))

    h1(doc, "第五部分 90 题自测（附答案）", page_break=False)
    p(doc, "先遮住答案做，再对照解析；错题回到对应章节，不要只抄答案。本部分含单选、多选、填空、简答；多选题已标“（多选）”，答案列出全部正确选项。第 5 章无题库，见知识体系第 5 章。", size=9.3)
    for ch in DATA["chapters"]:
        qs = ch.get("questions", [])
        if not qs:
            continue
        h2(doc, "第 %d 章 %s（%d 题）" % (ch["id"], ch["title"], len(qs)))
        for i, q in enumerate(qs, 1):
            mcq(doc, i, q, size=8.7)
    sup = DATA["supplement"]
    if sup.get("questions"):
        h2(doc, sup["title"] + "（%d 题）" % len(sup["questions"]))
        for i, q in enumerate(sup["questions"], 1):
            mcq(doc, i, q, size=8.7)

    h1(doc, "第六部分 中英术语 75 条（英中互测）")
    gloss = parse_glossary()
    p(doc, "遮住英文说中文、遮住中文拼英文；重点记拼写。共 %d 条。" % len(gloss), size=9.5)
    rows = [[str(g["ch"]), g["zh"], g["en"], g["zh_def"]] for g in gloss]
    table(doc, ["章", "中文", "English", "中文释义"], rows, widths=[1.0, 3.0, 4.2, 8.8], size=7.9)

    h1(doc, "第七部分 教材附录 807 条（速查）", page_break=False)
    app = parse_appendix()
    p(doc, "附录 3：缩写 %d 条；附录 4：英汉词汇 %d 条。用于最后查漏和英中互测，不要求全背。"
      % (len(app.get("app3", [])), len(app.get("app4", []))), size=9.4)
    h2(doc, "附录 3 · 缩写（%d 条，A—H，原书范围）" % len(app.get("app3", [])))
    note(doc, "本附录按原书页序只到 H；I—Z 请查教材原附录。个别条目原书未给全称，以“—”或“（原书未给全称）”标注。", size=8.2)
    table(doc, ["缩写", "英文", "中文"], [[x.get("abbr") or "—", x.get("en") or "（原书未给全称）", x.get("zh", "")] for x in app.get("app3", [])],
          widths=[2.2, 9.0, 5.8], size=7.2)
    h2(doc, "附录 4 · 英汉词汇（%d 条）" % len(app.get("app4", [])))
    table(doc, ["English", "中文"], [[x.get("en", ""), x.get("zh", "")] for x in app.get("app4", [])],
          widths=[9.0, 8.0], size=7.0)

    part_checklist(doc, "第八部分 考前清单", C.REMOTE_CHECKLIST, meta["accent"])
    return meta, doc


# ---------------------------------------------------------------------------
def build_nature():
    meta = C.NATURE_META
    doc = make_document(meta["title"], meta["en"], meta["subtitle"], meta["accent"], [
        ("科目", "自然地理学 · 大二上"),
        ("适用", "期末复习 / 打印背诵 / 读图题"),
        ("数据", "Orbit nature-geo.html；手写复习稿文字版；80 题自测"),
        ("版本", "v1.0 · " + C.TODAY),
    ], meta["running"])
    part_exam(doc, C.NATURE_EXAM)

    h1(doc, "第二部分 知识体系：手写复习稿（文字版）")
    p(doc, "以下按手写稿的五部分整理；标“原稿留白”的是原稿只列问题、本册按教材补全的内容，答题以教材为准。",
      size=9.4)
    note(doc, "讲稿中的“教材 Pxx”沿用课程扫描 PDF 的页码，可能与纸质书印刷页码差 10 页左右；按章节标题找内容更稳。", size=8.2)
    md_to_doc(doc, read("nature_notes.md"), meta["accent"])
    h2(doc, "手写稿留白补全（续）：教材有、原稿没展开的考点")
    note(doc, "以下按教材与课程重点补全，不是手写稿原文；页码沿用课程 PDF 的扫描页码。", size=8.4)
    bullets(doc, [
        "地球内部圈层：地壳、地幔、地核；莫霍面分地壳/地幔，古登堡面分地幔/地核；岩石圈=地壳+上地幔顶部（软流圈以上），软流圈是岩浆发源地。",
        "地球表层特征可从六个维度展开：圈层相互接触渗透、能量交换活跃、物质循环活跃、地域分异明显、生命活动集中、受人类活动影响深刻（教材 P41 的具体表述以书为准）。",
        "地貌定义：地球表面由内外动力作用形成的各种形态的总称；内动力塑造大轮廓，外动力削高填低。",
        "构造运动：水平运动（挤压、拉张、剪切）与垂直运动（上升、下降）；上升成山地/高原，下降成盆地/谷地。",
        "地震要素：震源、震中、震源深度、震级、烈度；一次地震一个震级，烈度随距离/场地变化。",
        "外力作用主线：风化—块体运动—流水—喀斯特—冰川—风沙—海岸；每种地貌抓“作用过程+典型形态”。",
        "岩溶作用的区域差异：气候（温度高、降水多更发育）、岩性（可溶性岩石）、构造（裂隙/断裂）、植被与土壤（CO₂ 来源）。",
        "含水层与隔水层：含水层能储存并让水通过（砂砾层、裂隙岩石）；隔水层不能（黏土、致密页岩）。",
    ], size=9.1)

    h1(doc, "第三部分 题型模板与对比表")
    h2(doc, "3.1 题型模板：怎么把答案写成分")
    for title, items in C.NATURE_TEMPLATES:
        h3(doc, title)
        bullets(doc, items, size=9.1)
    h2(doc, "3.2 对比表：简答/选择的得分骨架")
    p(doc, "自然地理的对比题很多。先记维度，再记每格的关键词；考场上先把表头写出来，分数就稳了一半。", size=9.5)
    for title, headers, rows in C.NATURE_TABLES:
        h2(doc, title)
        table(doc, headers, rows, size=8.4)

    h1(doc, "第四部分 名词解释 24 条")
    table(doc, ["名词", "释义"], [[a, b] for a, b in C.NATURE_TERMS], widths=[3.4, 13.6], size=8.5)

    h1(doc, "第五部分 80 题自测（附答案）")
    bank = load("nature_bank.json")["items"]
    p(doc, "80 题集中在绪论—构造运动（地质部分）；气候、地貌、水文、土壤用讲稿和对比表复述。", size=9.4)
    for typ, label in (("single", "一、单项选择题"), ("multi", "二、多项选择题"),
                       ("fill", "三、填空题"), ("judge", "四、判断题")):
        items = [x for x in bank if x.get("type") == typ]
        if not items:
            continue
        h2(doc, "%s（%d 题）" % (label, len(items)))
        for i, q in enumerate(items, 1):
            mcq(doc, i, q, size=8.7)

    h1(doc, "第六部分 气候/地貌/水文/土壤自测 40 问（自编）")
    note(doc, "这 40 问是本册依据手写讲稿与教材自编的自测题，不是学校官方题；答案按讲稿/教材整理，遇到分歧以教材和老师讲解为准。", size=8.5)
    table(doc, ["#", "问题", "答案"],
          [[str(i), q, a] for i, (tag, q, a) in enumerate(C.NATURE_SELFTEST, 1)],
          widths=[1.0, 7.0, 9.0], size=8.0)

    part_checklist(doc, "第七部分 考前清单", C.NATURE_CHECKLIST, meta["accent"])
    return meta, doc


# ---------------------------------------------------------------------------
def build_probability():
    meta = C.PROB_META
    doc = make_document(meta["title"], meta["en"], meta["subtitle"], meta["accent"], [
        ("科目", "概率论与数理统计 · 大二上"),
        ("适用", "期末复习 / 公式速查 / 计算题"),
        ("数据", "Orbit probability.html；60 题自测；2022—2023 期末卷；2025—2026 回忆版"),
        ("版本", "v1.0 · " + C.TODAY),
    ], meta["running"], toc_levels="1-1")
    part_exam(doc, C.PROB_EXAM)

    h1(doc, "第二部分 知识体系：7 章公式与题型")
    def fix_formula(s):
        for a, b in (("f_X", "f_{X}"), ("f_Y", "f_{Y}"), ("F_X", "F_{X}"), ("F_Y", "F_{Y}"),
                     ("F_max", "F_{max}"), ("F_min", "F_{min}"),
                     ("∫₀^∞", "∫_{0}^{+∞}"), ("∫₀^z", "∫_{0}^{z}"), ("^c", "^{c}")):
            s = s.replace(a, b)
        return s

    for ch in C.PROB_CHAPTERS:
        h2(doc, ch["title"])
        bullets(doc, [fix_formula(x) for x in ch["points"]], size=9.2)
        h3(doc, "必背公式")
        for f in ch["formulas"]:
            p(doc, "  " + fix_formula(f), size=9.4, space_after=2)
    h2(doc, "常见分布速查表")
    table(doc, C.PROB_DIST_TABLE[0], C.PROB_DIST_TABLE[1:], widths=[3.6, 8.0, 2.6, 2.8], size=8.3)
    h2(doc, "典型例题 7 道（覆盖七章）")
    p(doc, "先自己写，再对照步骤；每道题都按“设—公式—代入—结论”组织。", size=9.3)
    for title, q, sol in C.PROB_EXAMPLES:
        h3(doc, title)
        p(doc, q, size=9.2)
        bullets(doc, sol, size=9.0)
    h2(doc, "PPT 常考例题 12 道")
    note(doc, "例 1—6 来自 PPT 原题，例 7—12 按 PPT 知识点配套；答案已逐题复算。", size=8.5)
    for title, q, sol in C.PROB_PPT_EXAMPLES:
        h3(doc, title)
        p(doc, q, size=9.2)
        bullets(doc, sol, size=9.0)

    h1(doc, "第三部分 题型模板：看到题就知道怎么写", page_break=False)
    note(doc, "模板标题里的分值是常见区间【推断】，具体以当年卷面为准；步骤本身按“设—公式—代入—结论”组织。", size=8.6)
    for title, items in C.PROB_TEMPLATES:
        h2(doc, title)
        bullets(doc, items, size=9.2)

    h1(doc, "第四部分 60 题自测（附解析）")
    bank = load("probability_bank.json")["items"]
    p(doc, "按章节刷；计算题先自己写，再对照解析。自编题不是官方题，遇到分歧以教材/老师为准。", size=9.4)
    for typ, label in (("single", "一、单项选择题"), ("multi", "二、多项选择题"),
                       ("fill", "三、填空题"), ("judge", "四、判断题")):
        items = [x for x in bank if x.get("type") == typ]
        if not items:
            continue
        h2(doc, "%s（%d 题）" % (label, len(items)))
        for i, q in enumerate(items, 1):
            mcq(doc, i, q, size=8.7)

    h1(doc, "第五部分 真题：最近一次 + 2022—2023 精选")
    h2(doc, "2025—2026 第二学期（2024 级回忆版）· 计算题 5 道 + 综合题 2 道（全收）")
    note(doc, "原卷计算题 5 道（5×6=30）、综合题 2 道（2×15=30）；本册全部收录。", size=8.6)
    for title, q, sol in C.PROB_REAL_2026:
        h3(doc, title)
        p(doc, q, size=9.4)
        bullets(doc, sol, size=9.2)
    h2(doc, "2022—2023 学年 · 选择题 15 道（附答案）")
    table(doc, ["#", "题干", "答案", "要点"],
          [[a, b, c, d] for a, b, c, d in C.PROB_REAL_2023],
          widths=[0.9, 8.6, 2.6, 4.9], size=7.9)
    h2(doc, "2022—2023 学年 · 填空题 7 道精选")
    table(doc, ["#", "题干", "答案", "要点"],
          [[a, b, c, d] for a, b, c, d in C.PROB_FILL_2023],
          widths=[0.9, 8.6, 2.6, 4.9], size=7.9)
    h2(doc, "2022—2023 学年 · 计算题 2 道")
    for title, q, sol in C.PROB_REAL_2023_CALC:
        h3(doc, title)
        p(doc, q, size=9.3)
        bullets(doc, sol, size=9.1)
    h2(doc, C.PROB_REAL_2023_APP[0])
    p(doc, C.PROB_REAL_2023_APP[1], size=9.3)
    bullets(doc, C.PROB_REAL_2023_APP[2], size=9.2)
    h2(doc, C.PROB_REAL_2023_APP2[0])
    p(doc, C.PROB_REAL_2023_APP2[1], size=9.3)
    bullets(doc, C.PROB_REAL_2023_APP2[2], size=9.1)
    note(doc, "2022—2023 为扫描件，个别字迹按题意整理。")

    part_checklist(doc, "第六部分 考前清单", C.PROB_CHECKLIST, meta["accent"])
    return meta, doc


# ---------------------------------------------------------------------------
def build_maogai():
    meta = C.MAOGAI_META
    doc = make_document(meta["title"], meta["en"], meta["subtitle"], meta["accent"], [
        ("科目", "毛泽东思想和中国特色社会主义理论体系概论 · 大二上"),
        ("适用", "期末复习 / 大题背诵 / 选择题"),
        ("数据", "Orbit maogai.html；118 道大题；256 条考点；97 道真题；39 组易混"),
        ("版本", "v1.0 · " + C.TODAY),
    ], meta["running"])
    part_exam(doc, C.MAOGAI_EXAM)

    course = load("courses.json")["maogai"]
    h1(doc, "第二部分 章节框架：先搭骨架")
    for i, s in enumerate(course.get("sections", []), 1):
        h2(doc, "%02d %s" % (i, s["title"]))
        bullets(doc, s.get("points", []), size=9.3)
    h2(doc, "第九章补全：中国式现代化与十三个方面成就")
    h3(doc, "中国式现代化的中国特色（5 条）")
    bullets(doc, [
        "人口规模巨大的现代化。",
        "全体人民共同富裕的现代化。",
        "物质文明和精神文明相协调的现代化。",
        "人与自然和谐共生的现代化。",
        "走和平发展道路的现代化。",
    ], size=9.2)
    h3(doc, "中国式现代化的本质要求（9 条）")
    bullets(doc, [
        "坚持中国共产党领导，坚持中国特色社会主义。",
        "实现高质量发展，发展全过程人民民主。",
        "丰富人民精神世界，实现全体人民共同富裕。",
        "促进人与自然和谐共生。",
        "推动构建人类命运共同体，创造人类文明新形态。",
    ], size=9.2)
    note(doc, "记法：领导与道路（2）＋发展/民主/精神/富裕（4）＋人与自然（1）＋命运共同体/文明新形态（2）＝9。", size=8.6)
    h3(doc, "“十三个方面成就”")
    p(doc, "坚持党的全面领导、全面从严治党、经济建设、全面深化改革开放、政治建设、全面依法治国、文化建设、社会建设、生态文明建设、国防和军队建设、维护国家安全、坚持“一国两制”和推进祖国统一、外交工作。", size=9.1)
    h3(doc, "时代背景")
    bullets(doc, [
        "世界百年未有之大变局加速演进。",
        "中华民族伟大复兴进入关键时期。",
        "中国特色社会主义进入新时代，我国社会主要矛盾发生转化。",
    ], size=9.2)

    essay = load("maogai_essay.json")["items"]
    h1(doc, "第三部分 118 道大题（按章节背）")
    p(doc, "先背“背景—内容—地位”三层，再填要点；标【课后题】的优先。编号按全书连续 1—118。", size=9.4)
    cur = None
    for idx, item in enumerate(essay, 1):
        cross = item.get("n", 0) >= 69
        ch = "跨章节综合论述" if cross else item.get("chapter", "")
        if ch != cur:
            cur = ch
            h2(doc, ch)
        tags = "".join(item.get("tags", []))
        h3(doc, "%d. %s%s" % (idx, item.get("q", ""), ("　" + tags) if tags else ""))
        bullets(doc, item.get("points", []), size=8.9)
        if item.get("tip"):
            note(doc, "提示：" + clean(item["tip"], 300))

    special = load("maogai_special.json")
    h1(doc, "第四部分 256 条高频考点（★ 优先）")
    p(doc, "背法：先记冒号前的关键词，再记冒号后的关键术语；★ 的至少过三遍。", size=9.4)
    cur = None
    for pt in special["points"]:
        ch = pt.get("chapter", "")
        if ch != cur:
            cur = ch
            h2(doc, ch)
        mark = "★ " if pt.get("star") else ""
        p(doc, "%s**%s**：%s" % (mark, pt.get("keyword", ""), pt.get("text", "")), size=9.0, space_after=2.5)

    h2(doc, "39 组易混对比")
    table(doc, ["概念 A", "概念 B", "一句话区别"],
          [[x["a"], x["b"], x["diff"]] for x in special["confusions"]],
          widths=[4.2, 4.2, 8.6], size=8.3)

    h1(doc, "第五部分 97 道真题选择题（2024/2025）")
    p(doc, "先做 2025，再做 2024；多选题少选/错选不得分。", size=9.4)
    real = load("maogai_special.json")["real"]
    for src, label in (("2025真题", "2025 年真题（47 题）"), ("2024真题", "2024 年真题（50 题）")):
        items = [x for x in real if x.get("source") == src]
        if not items:
            continue
        h2(doc, label)
        if src == "2025真题":
            note(doc, "2025 原卷选择题 50 题；第 9、27、30 题与 2024 第 8、31、33 题重复，已合并到 2024 部分，本节 47 题。", size=8.5)
        for i, q in enumerate(items, 1):
            mcq(doc, i, q, size=8.6)

    h1(doc, "第六部分 选择题强化 300 道")
    note(doc, "本节从 1063 道题库中选取，已去掉与前面 97 道真题重复的题；答案在题后。期末补充部分保留旧教材章节编号（第十章—第十五章），作为补充；2023 版教材以导论—第八章为准。", size=8.6)
    bank = load("maogai_bank.json")["items"]
    real = load("maogai_special.json")["real"]
    def norm_q(t):
        return re.sub(r"[\s，。；：、（）()\"“”]", "", t or "")
    real_keys = {norm_q(x.get("q", "")) for x in real}
    cand = [x for x in bank if x.get("options") and x.get("answer") and norm_q(x.get("q", "")) not in real_keys]
    new_items = [x for x in cand if x.get("source") == "新教材"]
    sup_items = [x for x in cand if x.get("source") == "期末补充"]
    # take all new items, then supplement round-robin by chapter until 300
    selected = list(new_items[:300])
    by_ch = {}
    for x in sup_items:
        by_ch.setdefault(x.get("chapter", ""), []).append(x)
    order = list(by_ch)
    i = 0
    while len(selected) < 300 and order:
        for ch in list(order):
            if len(selected) >= 300:
                break
            if by_ch[ch]:
                selected.append(by_ch[ch].pop(0))
            else:
                order.remove(ch)
    n = 0
    for label, items in [("一、新教材题库", [x for x in selected if x.get("source") == "新教材"]),
                         ("二、期末补充题库", [x for x in selected if x.get("source") == "期末补充"])]:
        if not items:
            continue
        h2(doc, "%s（%d 道）" % (label, len(items)))
        groups = {}
        for x in items:
            groups.setdefault(x.get("chapter", ""), []).append(x)
        for ch, qs in groups.items():
            h3(doc, ch)
            for x in qs:
                n += 1
                mcq_compact(doc, n, x)

    h1(doc, "第七部分 答题模板与考前清单")
    for title, items in C.MAOGAI_TEMPLATES:
        h2(doc, title)
        bullets(doc, items, size=9.2)
    h2(doc, "考前清单")
    for i, it in enumerate(C.MAOGAI_CHECKLIST, 1):
        p(doc, "□  %d. %s" % (i, it), size=9.5, space_after=3)
    return meta, doc


# ---------------------------------------------------------------------------
def build_python():
    meta = C.PY_META
    doc = make_document(meta["title"], meta["en"], meta["subtitle"], meta["accent"], [
        ("科目", "Python 地理数据处理与分析 · 大二上"),
        ("适用", "期末复习 / 代码阅读 / 程序设计"),
        ("数据", "Orbit python.html + python-guide.html；599 题；考试.txt"),
        ("版本", "v1.0 · " + C.TODAY),
    ], meta["running"])
    part_exam(doc, C.PY_EXAM)
    note(doc, "题库统计：上表合计 598；另有 py-287 一题标签误归 GDAL，实为 Pandas 时间序列重采样题，按题干计入后共 599。"
              "Matplotlib/GeoPandas/GDAL 在十套卷中题量很少，必须回到课件 notebook 亲手跑。", size=8.6)

    guide = load("python_guide.json")
    h1(doc, "第二部分 知识地图：10 个模块")
    for layer in guide["layers"]:
        h2(doc, "%s（%s）" % (layer["name"], layer["en"]))
        for m in [x for x in guide["modules"] if x["layer"] == layer["id"]]:
            h3(doc, "%s · %s" % (m["title"], m["en"]))
            p(doc, m.get("why", ""), size=9.2, color=MUTED)
            bullets(doc, m.get("points", []), size=9.0)
            if m.get("code"):
                code(doc, m["code"], size=7.4)

    h1(doc, "第三部分 题型解法与高频代码模板")
    h2(doc, "代码阅读题：三步法")
    bullets(doc, [
        "① 标变量：把每个变量当前的值写在旁边，尤其是循环/函数里的局部变量。",
        "② 跟执行：按行推进；遇到函数调用先跳进去，返回后继续。",
        "③ 写输出：先写最终输出，再解释原因（可变对象、作用域、异常）。",
        "常见陷阱：可变默认参数、闭包延迟绑定、浅拷贝、is 与 ==、异常捕获。",
    ], size=9.2)
    h2(doc, "程序设计题：5 选 3 策略")
    bullets(doc, [
        "先扫一遍 5 道题，选最熟的 3 道；不要在第 1 道卡太久。",
        "按题目给的逐行提示写，提示就是得分点；每行写注释不扣分。",
        "先保证能运行，再补边界；输入输出格式按题目要求。",
        "常用模板：类 + 列表推导 + 文件读写 + Pandas 分组 + Matplotlib 保存。",
    ], size=9.2)
    h2(doc, "高频代码模板")
    for title, snippet in C.PY_PATTERNS:
        h3(doc, title)
        code(doc, snippet, size=7.5)

    qs = load("python_questions.json")
    h1(doc, "第四部分 599 题库（按题型）")
    p(doc, "单选/多选只列题干、选项与答案；填空/代码阅读/程序设计给参考答案和精简解析。"
           "完整交互、错题本与整卷模式在 python.html。", size=9.4)
    for sec, label in (("一、单项选择题", "一、单项选择题（300 题）"),
                       ("二、不定项选择题", "二、多项选择题（原卷称不定项，150 题）"),
                       ("三、填空题", "三、填空题（50 题）"),
                       ("四、程序代码阅读题", "四、程序代码阅读题（50 题）"),
                       ("五、程序设计题", "五、程序设计题（49 题）")):
        items = [x for x in qs if x.get("section") == sec]
        if not items:
            continue
        h2(doc, label)
        for i, q in enumerate(items, 1):
            if sec in ("一、单项选择题", "二、不定项选择题"):
                mcq_no_expl(doc, i, q, size=8.4)
            elif sec == "三、填空题":
                short_q(doc, i, q, size=8.7)
            else:
                short_q(doc, i, q, size=8.5)

    part_checklist(doc, "第五部分 考前清单", C.PY_CHECKLIST, meta["accent"])
    return meta, doc


# ---------------------------------------------------------------------------
def build_arcgis():
    meta = C.AG_META
    doc = make_document(meta["title"], meta["en"], meta["subtitle"], meta["accent"], [
        ("科目", "ArcGIS 空间分析 · 大二上"),
        ("适用", "期末复习 / 算法 / 实操流程"),
        ("数据", "Orbit arcgis.html；79 道客观题；18 个名词；4 个算法；6 个实操"),
        ("版本", "v1.0 · " + C.TODAY),
    ], meta["running"])
    part_exam(doc, C.AG_EXAM)

    h1(doc, "第二部分 PPT 分章要点")
    p(doc, "按老师 PPT 的章节顺序，把可能直接出名词解释、简答、判断和实验题的内容写成正文。", size=9.4)
    h3(doc, "第 1 章 ArcGIS 概述")
    bullets(doc, [
        "ArcGIS 是制图、分析、数据管理和开发平台；支持 shapefile、文件地理数据库、CAD、栅格，以及 SQL Server、Oracle、PostgreSQL 等企业库和大数据/云存储。",
        "主要能力（PPT 三项）：数据管理、制图和可视化、地理处理和分析。",
        "产品家族（PPT 本节）：ArcGIS for Desktop，包括 ArcMap、ArcCatalog、ArcToolbox、ArcGlobe、ArcScene、ModelBuilder；Pro/Online/Server 等作为其他产品了解。",
    ], size=9.0)
    h3(doc, "第 2 章 ArcGIS 快速入门")
    bullets(doc, [
        "ArcMap：数据输入、编辑、查询、分析、制图；地图文档为 .mxd。",
        "地图文档用绝对路径时，移动文件夹或换电脑会丢失数据源；应设置相对路径，或用“修改数据源”修复。",
        "ArcCatalog：浏览和管理数据、查看元数据与坐标系；ArcToolbox：地理处理工具；ArcScene/ArcGlobe：三维显示；ArcReader/ArcGIS Earth：浏览。",
    ], size=9.0)
    h3(doc, "第 6 章 GIS 空间分析导论")
    bullets(doc, [
        "空间分析：基于地理对象的位置和形态特征，提取和传输空间信息；是 GIS 的主要特征和评价 GIS 功能的重要指标。",
        "数据模型：矢量模型、栅格模型，以及矢量栅格一体化、三维、时空数据模型。",
        "基本方法：量算、叠加、缓冲、网络、空间统计、地形分析；ArcGIS 对应 Spatial Analyst、3D Analyst、Network Analyst、Geostatistical Analyst 等模块。",
    ], size=9.0)
    h3(doc, "第 7 章 矢量数据的空间分析")
    bullets(doc, [
        "邻域分析：缓冲区（点/线/面，距离可由常量或字段指定）、泰森多边形（输入必须是点要素）、近邻分析。",
        "叠置分析：Intersect、Union、Erase、Identity 等；叠加前必须统一坐标系；Union 用“or”，Intersect 用“and”。",
        "网络分析分两类：传输网络分析（Network Analyst）和效用网络分析（Utility Network Analyst）。传输网络分析六项基本功能：路径、服务区、最近设施、OD 成本矩阵、车辆路径（VRP）、位置分配。",
        "追踪分析：给数据加时间字段，用回放管理器做历史回放、动画和时间序列图表。",
    ], size=9.0)
    h3(doc, "第 8 章 栅格数据的空间分析")
    bullets(doc, [
        "分析环境：工作目录、栅格单元大小、分析区域、坐标基准的配准模式（坐标系统）、分析过程文件的管理；环境设置分应用程序、工具、模型、模型流程四级。",
        "距离制图、密度制图、表面分析（查询表面值、坡度、坡向、等值线、可视性、山体阴影）、重分类、栅格计算器、分类区统计、多元分析。",
        "重分类：Spatial Analyst → Reclass → Reclassify；用于统一分级、旧值→新值和成本栅格。",
    ], size=9.0)
    h3(doc, "第 9 章 三维分析")
    bullets(doc, [
        "三维数据：3D 点、3D 线、表面数据和体数据；表面数据常用栅格表面、TIN、Terrain。",
        "表面创建：栅格表面用插值法生成；TIN 由点/线/面等矢量要素创建，也可由栅格或 Terrain 转换。表面分析：坡向、坡度、山体阴影、填挖方、等值线、视域、面体积。",
        "ArcScene 适合小范围三维场景，ArcGlobe 适合大范围全球三维显示。",
    ], size=9.0)
    h3(doc, "第 10 章 空间统计分析")
    bullets(doc, [
        "空间统计分析：用统计方法分析地理现象的空间分布，关注空间依赖性和分布特征。",
        "地统计分析：空间统计的分支，关注空间变异性和结构性，以半变异函数为基本工具。",
        "常用：空间自相关、半变异函数拟合、克里格插值、空间预测。",
    ], size=9.0)

    a = load("arcgis_bank.json")
    h1(doc, "第三部分 名词解释：18 个必背 + 12 条中英词汇")
    p(doc, "按“英文全称 → 中文定义 → 核心特征”写；下面每条都给了记忆骨架。", size=9.4)
    note(doc, "前 6 条（地理配准、矢量数据、空间分析、DEM、专题图、投影变换）来自扫描件“应急提分版”标准答法；"
              "后 12 条是按教材/PPT 补充的自编释义，用来覆盖名词解释可能抽到的其他概念。")
    for x in a["terms"]:
        h3(doc, "%s · %s" % (x["zh"], x["en"]))
        p(doc, x["def"], size=9.2)
        p(doc, "记忆骨架：" + x["key"], size=8.8, color=MUTED)
    h2(doc, "中英词汇 12 条")
    table(doc, ["中文", "English"], a["vocab"], widths=[8.0, 9.0], size=8.6)

    h2(doc, "补充：扫描件/操作题里的得分点")
    table(doc, ["对比", "地理配准", "空间校正"], [
        ["对象", "栅格（扫描地图、遥感影像）", "矢量（点/线/面）"],
        ["目的", "给无坐标数据建立地理参考", "把已有矢量与参考数据对齐"],
        ["方法", "控制点 + 多项式/仿射 + 重采样", "平移/旋转/缩放/橡皮页/边匹配"],
        ["检查", "残差 RMS、叠加检查", "位移量、叠加检查"],
    ], widths=[2.8, 7.1, 7.1], size=8.4)
    bullets(doc, [
        "重分类：ArcToolbox → Spatial Analyst Tools → Reclass → Reclassify；选输入、字段、分级/旧值→新值、输出；用于统一分类、分级和成本栅格。",
        "泰森多边形：输入必须是点要素；每个多边形内任一点到本多边形样点最近；用于最近邻分配、服务范围划分。",
        "缓冲区参数：侧类型 Full/Left/Right；末端类型 Round/Flat；融合类型 None/All/List；距离可由字段指定。",
        "网络分析六类：路径（Route）、服务区（Service Area）、最近设施（Closest Facility）、OD 成本矩阵、车辆路径（VRP）、位置分配（Location-Allocation）。",
        "追踪分析（Tracking Analyst）：给数据加时间字段，用回放管理器做历史回放、动画和时间序列图表；对应简答题 ag-q04。",
        "ArcScan 矢量化：加载扩展 → 二值化栅格 → 栅格捕捉/编辑 → 交互式、半自动或全自动矢量化；三条件：二值栅格、已校准、在编辑状态。",
        "栅格法土地利用变化：两期重分类到统一编码 → 栅格计算器“前年份×100＋后年份” → 属性统计得转移矩阵 → 可用 MMULT 做转移概率预测。",
        "ArcView / ArcInfo / R2V：ArcView 做查看、查询、制图；ArcInfo 做高级地理处理；R2V 做栅格转矢量；实验题按“数据准备—配准—矢量化—拓扑—制图”串。",
    ], size=9.0)

    h1(doc, "第四部分 底层算法：文字原理 + 注释代码")
    for algo in a["algorithms"]:
        h2(doc, algo["title"] + " · " + algo.get("en", ""))
        p(doc, algo["principle"], size=9.3)
        h3(doc, "算法步骤")
        numbered(doc, algo["steps"], size=9.1)
        if algo.get("code"):
            h3(doc, "参考代码（带注释）")
            code(doc, algo["code"], size=7.4)
        p(doc, "考场写法：" + algo["exam"], size=9.1, color=INK)

    h1(doc, "第五部分 软件实操：6 个综合流程")
    for wf in a["workflows"]:
        h2(doc, wf["title"])
        p(doc, "目标：" + wf["goal"], size=9.3)
        h3(doc, "操作步骤")
        numbered(doc, wf["steps"], size=9.1)
        p(doc, "工具：" + wf.get("tools", ""), size=8.8, color=MUTED)
        if wf.get("notes"):
            bullets(doc, wf["notes"], size=8.8)
        p(doc, "考场写法：" + wf["exam"], size=9.1)

    h1(doc, "第六部分 79 道客观题（附答案）")
    note(doc, "口径说明：f17/f18 的“缓冲/叠置/网络”是教材三分法；老师 PPT 第 7 章按“邻域分析、叠置分析、网络分析、追踪分析”四类。两种口径都能解释，考试遇到分类题以老师 PPT/题目为准。", size=8.4)
    h2(doc, "一、填空题 30 道")
    fill = [x for x in a["bank"] if x["type"] == "fill"]
    table(doc, ["#", "题干", "答案"],
          [[str(i), x["q"].replace("____", "______"), " / ".join(x["answers"])] for i, x in enumerate(fill, 1)],
          widths=[1.0, 10.6, 5.4], size=7.9)
    h2(doc, "二、单项选择题 20 道")
    singles = [x for x in a["bank"] if x["type"] == "single"]
    rows = []
    for i, x in enumerate(singles, 1):
        opts = "；".join("ABCD"[j] + ". " + o for j, o in enumerate(x["options"]))
        rows.append([str(i), x["q"] + " ／ " + opts, "ABCD"[x["answer"]]])
    table(doc, ["#", "题干", "答案"], rows, widths=[1.0, 13.6, 2.4], size=7.7)
    h2(doc, "三、判断题 29 道")
    judges = [x for x in a["bank"] if x["type"] == "judge"]
    rows = [[str(i), "对" if x["answer"] else "错", x["q"], x.get("explain", "")]
            for i, x in enumerate(judges, 1)]
    table(doc, ["#", "判断", "题干", "改正/解析"], rows, widths=[1.0, 1.2, 7.0, 7.8], size=7.6)

    h1(doc, "第七部分 简答题 10 道 + 分析题 7 道")
    for x in a["short"]:
        h3(doc, x["q"])
        bullets(doc, x["answer"], size=9.0)
        if x.get("tip"):
            note(doc, "记忆：" + x["tip"])
    for x in a["analysis"]:
        h3(doc, x["q"])
        bullets(doc, x["answer"], size=9.0)
        if x.get("tip"):
            note(doc, "思路：" + x["tip"])

    h1(doc, "第八部分 论述题模板与考前清单")
    h2(doc, "3 类实验论述框架")
    for t in a["essay"]["types"]:
        h3(doc, t["name"] + "（" + t.get("examples", "") + "）")
        bullets(doc, t["frame"], size=9.0)
    h2(doc, "5 条万能金句")
    bullets(doc, a["essay"]["sentences"], size=9.1)
    h2(doc, "通用框架")
    numbered(doc, a["essay"]["framework"], size=9.1)
    h2(doc, "三段可模仿的范文段落")
    p(doc, "类型 1 · 地理配准：地理配准是 GIS 数据处理的基础环节。它把扫描地图、遥感影像等无空间参考的数据，通过控制点建立坐标映射，校正到统一的地理坐标系，为后续矢量化、叠加分析和制图提供可靠基准。在国土调查、城市更新和应急测绘中，只有先完成配准，多源数据才能真正叠加使用。ArcGIS 的地理配准工具通过控制点、变换模型和残差检查完成这一过程，体现了 GIS“先统一基准、再分析决策”的技术逻辑。", size=9.1)
    p(doc, "类型 2 · 空间分析：空间分析把抽象的空间数据转化为可视、可解释的信息。以学校选址为例，先对道路、人口、土地利用等数据做缓冲、重分类和叠加，再按权重计算适宜性，最后得到候选位置。它服务于国土空间规划、公共服务设施布局和应急避难场所选址，体现了 GIS 从“地图展示”走向“辅助决策”的价值。随着多源数据和三维分析的发展，这类实验还会与数字孪生、智慧城市衔接。", size=9.1)
    p(doc, "类型 3 · 综合应用：土地利用变化分析覆盖了“数据—分析—决策”的完整链路。用两期土地利用数据做叠加或栅格计算，得到变化面积、变化率和转移矩阵，可以识别耕地流失、建设用地扩张等趋势，为耕地保护、生态修复和国土空间规划提供依据。它把配准、重分类、叠加、统计和制图串成一个综合实验，训练的是 GIS 全流程能力，也体现 GIS 服务国家战略与民生发展的应用价值。", size=9.1)
    h2(doc, "考前清单")
    for i, it in enumerate(C.AG_CHECKLIST, 1):
        p(doc, "□  %d. %s" % (i, it), size=9.5, space_after=3)
    return meta, doc


# ---------------------------------------------------------------------------
BUILDERS = {
    "remote": build_remote,
    "nature": build_nature,
    "probability": build_probability,
    "maogai": build_maogai,
    "python": build_python,
    "arcgis": build_arcgis,
}


def convert(docx_path, pdf_path):
    cmd = ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", PS1,
           "-Docx", docx_path, "-Pdf", pdf_path]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    if r.returncode != 0:
        raise RuntimeError("Word convert failed: %s\n%s\n%s" % (docx_path, r.stdout, r.stderr))
    return r.stdout.strip()


def main():
    os.makedirs(DOCX_DIR, exist_ok=True)
    os.makedirs(PDF_DIR, exist_ok=True)
    os.makedirs(SITE_DIR, exist_ok=True)
    wanted = sys.argv[1:] or list(BUILDERS)
    report = []
    for key in wanted:
        if key not in BUILDERS:
            print("unknown subject", key)
            continue
        print("=" * 60)
        print("building", key)
        meta, doc = BUILDERS[key]()
        docx_path = os.path.join(DOCX_DIR, meta["file"].replace(".pdf", ".docx"))
        pdf_path = os.path.join(PDF_DIR, meta["file"])
        doc.save(docx_path)
        print("docx", docx_path, os.path.getsize(docx_path))
        out = convert(docx_path, pdf_path)
        print("pdf", pdf_path, os.path.getsize(pdf_path), out)
        site_path = os.path.join(SITE_DIR, meta["site"])
        shutil.copy2(pdf_path, site_path)
        report.append({"key": key, "file": meta["file"], "docx": os.path.getsize(docx_path),
                       "pdf": os.path.getsize(pdf_path), "word": out})
    with open(os.path.join(WORK, "report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=1)
    print("done", len(report))


if __name__ == "__main__":
    main()
