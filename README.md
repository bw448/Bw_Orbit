# Orbit · 地信学习站 / GIS Learning System

**中文** · [English](#english)

> 面向地理信息科学（GIS）本科生的学习站：按学期 → 科目 → 学习方式组织。
> A semester-by-semester study system for GIS undergraduates: semester → subject → mode.

- 在线访问 / Live site: **https://bw448.github.io/Bw_Orbit/**
- 本地启动 / Run locally: 双击 `start.bat`，或运行 `python -m http.server 8765`
- 源码 / Source: **https://github.com/bw448/Bw_Orbit**
- 站内显示名 / Display name: **Orbit** · 仓库名 / Repository: **Bw_Orbit**

---

## 中文

### 这是什么

Orbit 不是把资料堆在一个页面里，而是把大学课程拆成一条可以持续走的学习路径：

```
学期（大二上 / 大二下 / 大三上 / 大三下 / 电子书）
  └── 科目（遥感 / Python / 自然地理 / 毛概 / 概率论 / ArcGIS）
        └── 学习方式（期末复习 / 考研 / 从 0 到 1）
```

首页先展示 Orbit 是什么；点“进入学习内容”后，第一层才让你选学期，第二层选科目，第三层进入具体内容。这样第一次打开网站不会一上来就被功能淹没。

目前已经上线：

| 学期 | 科目 | 内容 |
|---|---|---|
| 大二上 | 遥感 | 8 章知识脉络（第五章待补）、7 套完整作业、90 道题、模拟卷、错题、收藏、75 条中英术语 |
| 大二上 | Python | 599 道题、10 套卷、按套 / 分节刷题、模拟卷、代码练习、知识地图 |
| 大二上 | 自然地理学 | 老师勾画重点、章节框架、变质作用扫描、重点页 |
| 大二上 | 毛概 | 大题背诵、1065 题系统题库、100 道真题、256 条高频考点、39 组易混对比 |
| 大二上 | 概率论 | 章节重点、公式、PPT 原题、2022—2023 期末卷 |
| 大二上 | ArcGIS | 考试结构、80 道客观题自测、名词解释、算法、实操、简答/分析/论述 |
| 顶层 | 竞赛 | 6 个 GIS 赛事、备考路线、技能地图、资料库 |
| 顶层 | BW有话说 | 文字 / 图片 / 视频 / 链接时间线；只点赞，不设评论 |
| 跨学期 | 电子书 | 5 本大二上教材：自然地理、毛概、概率论、遥感导论、ArcGIS；在线阅读 |

大二下、大三上、大三下已留好结构，课程确定后按同一模板接入。

### 遥感模块

- **每章四个入口**：知识脉络 / 完整作业 / 刷题 / 本章术语。
- **完整作业**：从已完成的 Word 作业抽出的原文、表格、公式和曲线图，按章单独查看。
- **90 道题**：作业主干 + 教材补全（16 题），教材依据《遥感导论》（梅安新等）。
- **中英术语表**：75 条核心术语，中文 + 英文 + 英文释义 + 中文解释；支持搜索、按章筛选、随机一条。
- **选中即译 / 问**：在正文、作业或题目里选中任意词句，出现极简工具条：
  - `译`：术语直接显示英文和英文释义；句子交给 AI 翻译并解释关键术语。
  - `问`：围绕选中的内容继续追问，讲机制、公式、例子和易混点。
- **知识点深聊**：每个知识点右侧有“深聊”，不必复制粘贴，直接围绕它继续对话。
- **讲义补充**：从老师 30 页复习讲义补入 61 条遗漏知识点，按章折叠；原有七套作业题库完全不动。
- **不设独立 AI 助手面板**：遥感页没有右下角聊天窗，AI 只在“选中 / 深聊”时出现。

### Python 模块

旧 Python 项目（`E:\python卷子` / 原 GitHub 仓库）保持只读、没有改动。新项目独立重做：

- 599 题 / 10 套卷：按套刷、分节刷、综合刷、模拟卷。
- **整卷阅读与下载**：十套卷都能在一页看完题目 + 答案 + 解析；每套可下载 PDF / Word，十套也有合集。
- 单选、多选自动判分；填空、代码阅读、设计题按参考答案自评。
- 错题本、收藏夹、分套进度、数据页。
- 代码练习：CodeMirror 行号 / 高亮 / 括号补全 + Pyodide 浏览器运行；多文件；按 import 自动加载常见包。
- AI 助教：提示、讲解、变式题、简答批改、选中解释、错题分析、今日计划。

#### Python 知识地图

`python-guide.html` 是题库之外的“第二入口”，不改动 599 题：

- **考试说明**：按《考试.txt》拆成单选 20×1、多选 10×3、填空 10×1.5、代码阅读 3 题 20 分、程序设计 5 选 3。
- **十个知识模块**：基础语法、函数与作用域、迭代器/生成器/装饰器、类与对象、继承与多态、Pandas、Matplotlib、GeoPandas、GDAL/OGR、模块与 Jupyter。
- **题库覆盖**：按题干关键词统计每个主题的题量，并明确标出题库覆盖不足的 Matplotlib、GeoPandas、GDAL。
- **五天路线**：先做整卷找短板，再按题型补，最后补三个库。
- **主题练习**：每个模块的“做这一块”会跳到该主题的题集（如类与对象 51 题、Pandas 93 题），不用回十套卷里翻。
- **真实结构 100 分卷**：20 单选 + 10 多选 + 10 填空 + 3 代码阅读 + 3 程序设计（5 选 3），按真实分值折算。

### 四个课程模块

- **自然地理学**：按最后一节课勾画/画勾部分整理；岩石、构造、变质作用、外力地貌分章拆开，配课本、手写扫描和重点页。
- **毛概**：按“形成条件—主要内容—历史地位”搭框架；页面内分五个模块：256 条高频考点（可搜索/按章/★筛选）、1065 题系统题库（新教材 188 + 旧教材 522 + 期末补充 355）、2024/2025 真题 100 道、39 组易混对比、章节框架；大题背诵和真题 PDF 仍可下载。
- **概率论**：按题型和公式复习；PPT 原题、回忆版、2022—2023 期末卷和 Kira 讲义集中在一个模块。
- **ArcGIS**：从 25 页填空题扫描件整理出 30 填空 + 20 单选 + 30 判断 + 10 简答 + 7 分析；另配 18 条名词解释（可遮住释义/随机抽 5 条）、12 条中英词汇、4 个底层算法、6 个实操流程和论述模板；简答/分析可标记“会/不会”。

### 竞赛模块

顶层模块，下面分四个子模块：

1. **赛事总览**：易智瑞杯、SuperMap 杯、苍穹杯、全国高校 GIS 技能大赛、GIS 应用技能大赛、地理信息技能赛；含报名时间、组别、难度、官网链接。
2. **怎么备考**：制图/设计、开发/WebGIS、遥感/分析三条路线 + 八周起步节奏。
3. **技能地图**：GIS 基础、制图、数据处理、WebGIS、后端、Python、遥感、论文答辩。
4. **资料库**：ArcGIS Pro、SuperMap、MapGIS、QGIS、OpenLayers、Leaflet、Turf.js、GeoPandas、GDAL 官方文档，以及国内/国际数据源。

### BW有话说

- 顶层个人时间线：文字、图片、视频、链接，按日期倒序。
- 只保留点赞，不做评论，避免留言审核和垃圾评论。
- 管理员用 CloudBase SQL 里设置的管理密码发帖；访客只能看和点赞。
- 后端：腾讯云 CloudBase PostgreSQL + PostgREST，国内直连，不需要梯子。
- 配置：`assets/cloudbase-config.js` 只放网关地址和 publishable key；SecretId/SecretKey 不进入前端。
- 数据表、RLS 和 RPC：`cloudbase/schema.sql`（posts + likes，无 comments）。
- 公开页：`bw-talk.html`；管理页：`bw-admin.html`（不放进导航）。

### 电子书模块

- 大二上 5 本教材：自然地理学、毛概（2023 版）、概率论与数理统计（第五版）、遥感导论、ArcGIS 空间分析实验教程（第三版）。
- 共 1,981 页、约 231 MB；网页阅读版做了压缩，保留原书页序。
- 自带轻量 PDF 阅读器：翻页、缩放、全屏、键盘方向键、手机滑动翻页，支持直接下载。
- 在线阅读默认打开“前 16 页试读”（1—4 MB），打开更快；完整版在阅读器里下载，或点“完整版”用浏览器打开。
- 版权归原作者和出版社；仅用于个人学习与课程复习，不用于商业传播。

### 学习工具

- 间隔复习：答错的题 1 天后回来；答对后拉长到 3 / 7 / 14 / 30 天，连对 5 次毕业。
- 答题历史、每日目标、连续打卡、10 天计划。
- 全库搜索、按数量随机练习、导出 / 导入学习数据。
- 毛概 / ArcGIS 新题库支持：随机 20 题、今日复习（1/3/7/14/30 天）、收藏、重做、导出 / 导入。
- 毛概、ArcGIS、自然地理、概率论和 Python 知识地图新增“问 AI”：右下角小按钮、章节旁“问 AI”、选中文字直接问；共用全站 DeepSeek Key，只做知识速查，不做花哨面板。
- 进度、错题、收藏存在浏览器 `localStorage`，不上传服务器。

### AI 设置与隐私

- 全站共用一个 DeepSeek API Key，默认模型 `deepseek-chat`。
- 在遥感页选中文字 → 出现工具条 → 点“问” → 按提示填写 Key；Python 页点右下角 `AI` → `设置`。
- Key 只保存在本机 `localStorage`，请求直接发往 `api.deepseek.com`，不经过本项目的中转服务器。
- 没有 Key 也可以使用全部题库、作业、术语表和学习工具；只有 AI 翻译 / 对话需要 Key。
- 建议用 `start.bat` 的本地服务器打开，避免 `file://` 的联网和同源限制。

### 手机与 PWA

- 所有页面有 `viewport` 和响应式布局，390px 宽度下可用。
- 手机端选中文字后，`译 / 问` 工具条固定在底部，不遮挡选中内容。
- `manifest.webmanifest` + `sw.js`：可添加到手机主屏；核心页面离线可用。
- 代码练习第一次运行需要联网下载 Pyodide（约 10 MB）；离线时普通刷题可用。
- 电子书 PDF 和成套试卷 PDF 体积较大，PWA 只缓存页面、封面和阅读器，不缓存这些 PDF；离线阅读请先下载。
- CodeMirror 和 anime.js 已放在 `assets/` 本地，不依赖 CDN；只有 Pyodide 运行时按需联网。

### 本地运行 / 重新构建

```powershell
# 启动本地服务器（推荐）
.\start.bat

# 或手动
python -m http.server 8765
```

打开 <http://localhost:8765/>。

重新生成页面：

```powershell
python build.py
```

同步桌面资料（作业抽取 → 建站 → 六科总纲）：

```powershell
python tools/sync_content.py
# 或双击 sync.bat
```

`build.py` 只依赖 Python 标准库；总纲导出另需 `python-docx`。构建会读取：

- `src/content.py`：遥感题库与章节
- `src/homework.json`：从 Word 作业抽出的内容
- `src/python_questions.json`：599 道 Python 题（固定，不改）
- `src/python_guide.json` / `src/python_topics.json`：知识地图与题库主题统计
- `src/arcgis_bank.json`：ArcGIS 题库、名词解释、算法、实操、论述模板
- `src/maogai_bank.json`：毛概系统题库 1065 题
- `src/maogai_special.json`：毛概高频考点 256 条、真题 100 道、易混对比 39 组
- `src/maogai_essay.json`：毛概大题背诵 118 题（核心篇 47 + 后半篇 71）
- `src/notes.json`：遥感讲义补充 61 条
- `src/courses.json`：四个课程模块的数据
- `src/*.html`：页面模板
- `assets/glossary.js`：75 条中英术语

生成 `index.html`（品牌首页）、`semesters.html`（学习内容）、`remote.html`、`python.html`、`sem*.html` 等完整页面。

### 目录

```
index.html                 Orbit 品牌首页：介绍 + 动效 + 进入内容
semesters.html             学习内容：选学期
sem2-1.html                大二上：选科目
remote.html                遥感 · 期末复习
kaoyan-remote.html         遥感 · 考研
zero-remote.html           遥感 · 从 0 到 1
python.html                Python · 期末复习
python-guide.html          Python · 知识地图
zero-python.html           Python · 从 0 到 1
nature-geo.html            自然地理学模块
maogai.html                毛概模块
probability.html           概率论模块
arcgis.html                ArcGIS 模块（含 80 题自测）
competitions.html          竞赛顶层模块（4 个子模块）
bw-talk.html               BW有话说：公开时间线
bw-admin.html              BW有话说：管理员登录/发帖/删除
ebook.html                 电子书：5 本教材 + PDF 阅读器
assets/
  apple.css                Apple 式浅色设计系统
  landing.css / landing.js 品牌首页：轨道动效、滚动揭示
  rs-ai.js / rs-ai.css     遥感：选中翻译 / 追问 + 术语表
  glossary.js              75 条中英术语数据
  study.js / study.css     间隔复习、历史、目标、计划、搜索
  ai.js / ai.css           Python：AI 助教面板
  course.css / course.js   四个课程模块的共享布局
  quiz.css / quiz.js       通用刷题引擎：单选/多选/判断/填空、错题、进度
  arcgis.css / arcgis.js   ArcGIS：题库、名词、算法、实操、论述
  maogai.js                毛概：选择题库挂载
  python-guide.css/js      Python：知识地图与题库覆盖
  competitions.css/js      竞赛模块：赛事/备考/技能/资料
  bw.css / bw.js           BW有话说：公开页与点赞
  bw-admin.js              BW有话说：管理员登录、上传、发帖
  cloudbase-config.js      公开的 CloudBase 网关地址 / publishable key
cloudbase/schema.sql       BW有话说 PostgreSQL 表、RLS 与 RPC
  notes.css                遥感讲义补充
  ebook.js / ebook.css     电子书卡片与 PDF.js 阅读器
  courses/ (release)       四个课程模块的 PDF/JPG，放在 GitHub Release
  ebooks/                  5 本压缩 PDF、封面、书目
  papers/                  十套 Python 完整卷 PDF / Word
  pdfjs/                   PDF.js 本地阅读组件
  homework/                作业里的曲线图
src/                       源模板与题库
build.py                   构建脚本
start.bat                  本地服务器
tools/make_python_papers.py 生成十套完整卷 PDF / Word
tools/prepare_ebooks.py     压缩 PDF 并提取封面
tools/extract_homework.py   遥感分章作业 -> src/homework.json
tools/build_maogai_bank.py  毛概选择题 PDF -> src/maogai_bank.json
tools/build_maogai_special.py 高频考点/真题/易混 -> src/maogai_special.json
tools/build_maogai_essay.py  大题背诵 PDF -> src/maogai_essay.json
tools/check_site.py         题库结构、答案下标、本地链接检查
tools/build_python_topics.py 599 题主题统计 -> src/python_topics.json
tools/export_summaries.py   六科总纲 -> 桌面 系统整理好的复习资料/
tools/sync_content.py       作业抽取 -> 建站 -> 总纲，一条命令同步
tools/merge_materials.py    桌面原始文件/复习资料的分类合并（一次性）
```

### 内容说明与边界

- 遥感题目来自课程作业与《遥感导论》教材重点，**不是学校官方答案**；第五章“遥感图像处理”暂未生成题目，但知识脉络和中英术语可以先看。
- 术语英文释义为课程学习用的简明定义，不替代专业词典。
- AI 生成内容可能有误，请以教材和老师讲解为准。
- 旧 Python 项目只读参考，不修改、不提交、不移动。
- ArcGIS 题库来自课程扫描件《一填空题》25 页，答案以原件为准；个别表述保留原件写法。
- 毛概选择题 1065 题由 710 题去重汇总与《毛概期末考试题库》补充合并；原资料个别答案有争议，以教材和课后题为准。
- Python 599 题保持原样；知识地图只做导航、统计和课件补充，不改题、不删题。
- 本项目用于个人学习与教学交流；教材、课程资料版权归原作者 / 原出版社所有。

### 课程总纲（桌面）

`C:/Users/Lenovo/Desktop/地信大二上/系统整理好的复习资料/` 下每个科目一份 docx：

- 遥感、自然地理学、概率论、毛概、Python 地理处理、ArcGIS。
- 文档由 `tools/export_summaries.py` 从网站数据生成，不是手写稿；网站内容变化后重新导出即可同步。
- 桌面资料已按科目合并到 `课程资料/`：遥感、自然地理、概率论、毛概、Python、ArcGIS、通用。
- `课程资料/遥感/作业分章/` 是作业“收件箱”；补第五章作业后运行 `sync.bat` 即可同步网站与总纲。

---

## English

### What this is

Orbit is a study system for GIS undergraduates. It does not put every resource on one page. It keeps a clear hierarchy:

```
Semester (Year 2 Fall / Year 2 Spring / Year 3 Fall / Year 3 Spring / E-book)
  └── Subject (Remote Sensing / Python / Physical Geography / Maoism / Probability / ArcGIS)
        └── Mode (Final exam review / key-point modules / e-books / competitions)
```

After the brand landing, the learning hub asks only for a semester; the next layer asks for a subject; the third opens the actual material. A first-time visitor can see where to click without meeting every feature at once.

### What is included

| Semester | Subject | Content |
|---|---|---|
| Year 2 Fall | Remote Sensing | 8 chapters (chapter 5 pending), 7 homework sets, 90 questions, mock exam, wrong answers, bookmarks, 75 bilingual terms |
| Year 2 Fall | Python | 599 questions, 10 papers, paper/section practice, mock exam, code lab, knowledge map |
| Year 2 Fall | Physical Geography | Teacher-marked key points, chapter outline, metamorphism scans |
| Year 2 Fall | Maoism | Essay frameworks, 1,065-question choice bank, 2024/2025 papers |
| Year 2 Fall | Probability | Chapter priorities, formulas, PPT originals, 2022–2023 paper |
| Year 2 Fall | ArcGIS | Exam map, 80-question drill, terms, algorithms, workflows, short/analysis/essay templates |
| Top level | Competitions | 6 GIS contests, prep routes, skill map and resource library |
| Top level | BW Notes | Text / image / video / link timeline; likes only, no comments |
| Cross-semester | E-book | 5 Year-2 Fall textbooks: physical geography, Maoism, probability, remote sensing, ArcGIS; read online |

Year 2 Spring and Year 3 are reserved and follow the same structure when courses are confirmed.

### Remote Sensing

- **Four entries per chapter**: knowledge outline / full homework / practice / chapter glossary.
- **Full homework**: original text, tables, formulas and figures extracted from completed Word assignments.
- **90 questions**: homework core plus textbook gap-fill, based on *An Introduction to Remote Sensing* (Mei Anxin et al.).
- **Bilingual glossary**: 75 terms with Chinese, English, an English definition and a Chinese explanation; searchable and filterable by chapter.
- **Select to translate or ask**: select any phrase in the reading, homework or question view:
  - `译`: a known term opens its English name and English definition instantly; a sentence is translated and its key terms explained by AI.
  - `问`: continue a conversation about the selected passage — mechanism, formula, example, common confusions.
- **Deep chat per knowledge point**: every point has a “深聊” action, so there is no copy-paste step.
- **Lecture-note supplement**: 61 additional points extracted from the teacher's 30-page review PDF, grouped by chapter. The original seven homework sets are untouched.
- **No separate AI assistant panel** on the remote-sensing page. AI appears only when you select text or open a knowledge point.

### Python

The old Python project is kept read-only and untouched. This is a new implementation:

- 599 questions across 10 papers; practice by paper, section or mixed set.
- **Whole-paper reading and downloads**: every paper can be read as one page with questions, answers and explanations; download each paper as PDF/Word, or the full 10-paper set.
- Auto-grading for single/multiple choice; self-check against reference answers for fill-in, code-reading and design questions.
- Wrong-answer book, bookmarks, per-paper progress and a data page.
- Code lab: CodeMirror editor with line numbers, syntax highlighting and bracket completion; Pyodide runs Python in the browser; multi-file support; common packages loaded from imports.
- AI tutor: hints, explanations, variant questions, short-answer review, selected-text explanation, wrong-answer analysis and a daily plan.

#### Python knowledge map

`python-guide.html` is a second entrance that leaves the 599-question bank untouched: the exam structure from the teacher's `考试.txt`, ten knowledge modules (syntax, scope, iterators/decorators, OOP, inheritance, Pandas, Matplotlib, GeoPandas, GDAL/OGR, tooling), bank coverage per topic, and a five-day route. It flags the three areas the bank barely covers: Matplotlib, GeoPandas and GDAL.

### Four course modules

- **Physical Geography**: built around the teacher's last-class highlights; rocks, structures, metamorphism and landforms with textbook, scanned notes and key-point page.
- **Maoism**: “background — content — historical status” frameworks, essay memorization, a 1,065-question interactive choice bank and 2024/2025 papers.
- **Probability**: question types and formulas, PPT originals, recall sheet, 2022–2023 paper and a Kira handout.
- **ArcGIS**: exam map, 30 fill-in + 20 single + 30 true/false + 10 short + 7 analysis questions from a 25-page scan, six terms, twelve bilingual terms, four algorithms, six workflows and essay templates.

### Competitions

A top-level module with four submodules:

1. **Events**: Esri China, SuperMap, KQGIS, MapGIS, CAGIS and CIIA contests; dates, groups, difficulty and official links.
2. **Prepare**: mapping/design, development/WebGIS and remote-sensing/analysis routes plus an 8-week starter plan.
3. **Skills**: GIS fundamentals, cartography, data processing, WebGIS, backend, Python, remote sensing and presentation.
4. **Resources**: official docs for ArcGIS Pro, SuperMap, MapGIS, QGIS, OpenLayers, Leaflet, Turf.js, GeoPandas and GDAL, plus data sources.

### BW Notes

- A top-level personal timeline: text, images, video and links in reverse date order.
- Likes only; no comments, so there is no comment moderation to manage.
- The admin signs in with the management password set in CloudBase SQL to publish; visitors can only read and like.
- Backend: Tencent CloudBase PostgreSQL + PostgREST, reachable in mainland China without a VPN.
- Public config lives in `assets/cloudbase-config.js` (gateway URL + publishable key). SecretId/SecretKey never reach the browser.
- Schema, RLS and RPC: `cloudbase/schema.sql` (posts + likes, no comments).
- Public page: `bw-talk.html`; admin page: `bw-admin.html` (not in navigation).

### E-books

- Five Year-2 Fall textbooks: Physical Geography, Mao Zedong Thought (2023), Probability and Statistics (5th ed.), Introduction to Remote Sensing, and the ArcGIS Spatial Analysis lab manual (3rd ed.).
- 1,981 pages, about 231 MB; the web reading copies are compressed but keep the original page order.
- Includes a small PDF.js reader: page turns, zoom, fullscreen, arrow keys, mobile swipe, and direct download.
- Copyright remains with the authors and publishers; provided for personal study and course review only.

### Shared study tools

- Spaced repetition: a wrong question returns after 1 day; correct answers extend the interval to 3 / 7 / 14 / 30 days; five correct answers graduate it.
- Answer history, daily goal, streak, 10-day plan.
- Full-text search, random practice by count, export/import of study data.
- Progress, wrong answers and bookmarks live in browser `localStorage`; nothing is uploaded to a server.

### AI key and privacy

- One DeepSeek API key is shared by the site; the default model is `deepseek-chat`.
- On the Remote Sensing page, select text → `问` → enter the key when prompted. On the Python page, use the `AI` button → `设置`.
- The key is stored only in local `localStorage`. Requests go directly to `api.deepseek.com`; there is no proxy server in this project.
- Without a key, all questions, homework, glossary and study tools still work. Only AI translation and conversation need a key.
- Prefer `start.bat` (a local HTTP server) over opening `file://`, to avoid browser networking and same-origin limits.

### Mobile and PWA

- Every page has a viewport meta tag and a responsive layout tested at 390px.
- On phones, selecting text shows a bottom `译 / 问` bar that does not cover the selection.
- `manifest.webmanifest` + `sw.js`: installable to the home screen; core pages work offline.
- The code lab downloads the Pyodide runtime (~10 MB) on first run; ordinary practice works offline.
- E-book and paper PDFs are large; the PWA caches pages, covers and the reader, not the PDFs. Download them first for offline reading.
- CodeMirror and anime.js are vendored under `assets/`; only the Pyodide runtime is fetched on demand.

### Run locally / rebuild

```powershell
# Recommended: local server
.\start.bat

# Or manually
python -m http.server 8765
```

Open <http://localhost:8765/>.

Rebuild the pages:

```powershell
python build.py
```

The build uses only the Python standard library. Inputs:

- `src/content.py` — remote-sensing chapters and questions
- `src/homework.json` — content extracted from the Word assignments
- `src/python_questions.json` — 599 Python questions
- `src/*.html` — page templates
- `assets/glossary.js` — 75 bilingual terms

Outputs include `index.html` (brand landing), `semesters.html` (learning hub), `remote.html`, `python.html` and the semester pages.

### Project structure

```
index.html                 Brand landing: Orbit intro, motion, enter content
semesters.html             Learning hub: choose a semester
sem2-1.html                Year 2 Fall: choose a subject
remote.html                Remote Sensing · final review
kaoyan-remote.html         Remote Sensing · graduate entrance prep
zero-remote.html           Remote Sensing · zero-to-one
python.html                Python · final review
python-guide.html          Python · knowledge map
zero-python.html           Python · zero-to-one
nature-geo.html            Physical Geography module
maogai.html                Maoism module
probability.html           Probability module
arcgis.html                ArcGIS module (with 80-question drill)
competitions.html          Competitions: events/prepare/skills/resources
bw-talk.html               BW Notes: public timeline
bw-admin.html              BW Notes: admin login/publish/delete
ebook.html                 E-books: 5 textbooks + PDF reader
assets/
  apple.css                Apple-inspired light design system
  landing.css / landing.js Brand landing: orbit motion, scroll reveals
  rs-ai.js / rs-ai.css     Remote Sensing: select-to-translate/ask + glossary
  glossary.js              75 bilingual terms
  study.js / study.css     Spaced repetition, history, goals, plan, search
  ai.js / ai.css           Python: AI tutor panel
  course.css / course.js   Shared layout for the four course modules
  quiz.css / quiz.js       Shared quiz engine: single/multi/judge/fill, wrong-only, progress
  arcgis.css / arcgis.js   ArcGIS bank, terms, algorithms, workflows, essay templates
  maogai.js                Maoism choice-bank mount
  python-guide.css/js      Python knowledge map and bank coverage
  competitions.css/js      Competitions: events/prepare/skills/resources
  bw.css / bw.js           BW Notes: public page and likes
  bw-admin.js              BW Notes: admin login, upload, publish
  cloudbase-config.js      Public CloudBase gateway URL / publishable key
cloudbase/schema.sql       BW Notes PostgreSQL tables, RLS and RPC
  notes.css                Remote-sensing lecture-note supplement
  ebook.js / ebook.css     Library cards and PDF.js reader
  courses/ (release)       PDF/JPG resources hosted in a GitHub Release
  ebooks/                  Compressed PDFs, covers, book data
  papers/                  Full Python papers as PDF / Word
  pdfjs/                   Local PDF.js reader component
  homework/                Figures from the assignments
src/                       Source templates and question data
build.py                   Build script
start.bat                  Local server
tools/make_python_papers.py Generate full paper PDFs / Word files
tools/prepare_ebooks.py     Compress PDFs and extract covers
tools/make_ebook_previews.py 生成前 16 页试读 PDF（快速打开）
tools/extract_homework.py   Chapter homework docx -> src/homework.json
tools/build_maogai_bank.py  Maoism choice PDFs -> src/maogai_bank.json
tools/build_python_topics.py 599-question topic counts
tools/export_summaries.py   One review master .docx per subject
tools/sync_content.py       Homework -> build -> summaries in one command
```

### Content notes and limits

- Remote-sensing questions come from course assignments and textbook priorities; they are **not official school answers**. Chapter 5, “Remote Sensing Image Processing”, has no questions yet, but its outline and bilingual terms are readable.
- English definitions are concise study definitions, not a substitute for a professional dictionary.
- AI output can be wrong; always check against the textbook and your instructor's notes.
- ArcGIS questions come from the 25-page scanned fill-in bank; answers follow the scan.
- The Maoism choice bank merges the 710-question summary with 355 deduplicated questions from the final-exam bank; a few source answers are disputed, so trust the textbook and post-class questions.
- The Python 599-question bank is fixed; the knowledge map only adds navigation, counts and courseware notes.
- The old Python project is read-only and is not modified, committed or moved.
- This project is for personal study and teaching exchange. Copyright in textbooks and course materials remains with their original authors and publishers.
