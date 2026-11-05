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
  └── 科目（遥感 / Python / 后续课程）
        └── 学习方式（期末复习 / 考研 / 从 0 到 1）
```

首页先展示 Orbit 是什么；点“进入学习内容”后，第一层才让你选学期，第二层选科目，第三层进入具体内容。这样第一次打开网站不会一上来就被功能淹没。

目前已经上线：

| 学期 | 科目 | 内容 |
|---|---|---|
| 大二上 | 遥感 | 7 章知识脉络、完整作业、90 道题、模拟卷、错题、收藏、75 条中英术语 |
| 大二上 | Python | 599 道题、10 套卷、按套 / 分节刷题、模拟卷、代码练习 |
| 跨学期 | 电子书 | 预留：教材、笔记、划线、搜索，和题库互相跳转 |

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
- **不设独立 AI 助手面板**：遥感页没有右下角聊天窗，AI 只在“选中 / 深聊”时出现。

### Python 模块

旧 Python 项目（`E:\python卷子` / 原 GitHub 仓库）保持只读、没有改动。新项目独立重做：

- 599 题 / 10 套卷：按套刷、分节刷、综合刷、模拟卷。
- 单选、多选自动判分；填空、代码阅读、设计题按参考答案自评。
- 错题本、收藏夹、分套进度、数据页。
- 代码练习：CodeMirror 行号 / 高亮 / 括号补全 + Pyodide 浏览器运行；多文件；按 import 自动加载常见包。
- AI 助教：提示、讲解、变式题、简答批改、选中解释、错题分析、今日计划。

### 两门课共用的学习工具

- 间隔复习：答错的题 1 天后回来；答对后拉长到 3 / 7 / 14 / 30 天，连对 5 次毕业。
- 答题历史、每日目标、连续打卡、10 天计划。
- 全库搜索、按数量随机练习、导出 / 导入学习数据。
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

构建只依赖 Python 标准库；会读取：

- `src/content.py`：遥感题库与章节
- `src/homework.json`：从 Word 作业抽出的内容
- `src/python_questions.json`：599 道 Python 题
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
zero-python.html           Python · 从 0 到 1
ebook.html                 电子书（预留）
assets/
  apple.css                Apple 式浅色设计系统
  landing.css / landing.js 品牌首页：轨道动效、滚动揭示
  rs-ai.js / rs-ai.css     遥感：选中翻译 / 追问 + 术语表
  glossary.js              75 条中英术语数据
  study.js / study.css     间隔复习、历史、目标、计划、搜索
  ai.js / ai.css           Python：AI 助教面板
  homework/                作业里的曲线图
src/                       源模板与题库
build.py                   构建脚本
start.bat                  本地服务器
```

### 内容说明与边界

- 遥感题目来自课程作业与《遥感导论》教材重点，**不是学校官方答案**；第五章“遥感图像处理”暂未生成题目，但知识脉络和中英术语可以先看。
- 术语英文释义为课程学习用的简明定义，不替代专业词典。
- AI 生成内容可能有误，请以教材和老师讲解为准。
- 旧 Python 项目只读参考，不修改、不提交、不移动。
- 本项目用于个人学习与教学交流；教材、课程资料版权归原作者 / 原出版社所有。

---

## English

### What this is

Orbit is a study system for GIS undergraduates. It does not put every resource on one page. It keeps a clear hierarchy:

```
Semester (Year 2 Fall / Year 2 Spring / Year 3 Fall / Year 3 Spring / E-book)
  └── Subject (Remote Sensing / Python / future courses)
        └── Mode (Final exam review / Graduate entrance prep / Zero-to-one)
```

The first screen asks only for a semester; the second asks for a subject; the third opens the actual material. A first-time visitor can see where to click.

### What is included

| Semester | Subject | Content |
|---|---|---|
| Year 2 Fall | Remote Sensing | 7 chapters, full homework, 90 questions, mock exam, wrong answers, bookmarks, 75 bilingual terms |
| Year 2 Fall | Python | 599 questions, 10 papers, paper/section practice, mock exam, code lab |
| Cross-semester | E-book | Planned: textbook, notes, highlights, search, links to questions |

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
- **No separate AI assistant panel** on the remote-sensing page. AI appears only when you select text or open a knowledge point.

### Python

The old Python project is kept read-only and untouched. This is a new implementation:

- 599 questions across 10 papers; practice by paper, section or mixed set.
- Auto-grading for single/multiple choice; self-check against reference answers for fill-in, code-reading and design questions.
- Wrong-answer book, bookmarks, per-paper progress and a data page.
- Code lab: CodeMirror editor with line numbers, syntax highlighting and bracket completion; Pyodide runs Python in the browser; multi-file support; common packages loaded from imports.
- AI tutor: hints, explanations, variant questions, short-answer review, selected-text explanation, wrong-answer analysis and a daily plan.

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
zero-python.html           Python · zero-to-one
ebook.html                 E-book (planned)
assets/
  apple.css                Apple-inspired light design system
  landing.css / landing.js Brand landing: orbit motion, scroll reveals
  rs-ai.js / rs-ai.css     Remote Sensing: select-to-translate/ask + glossary
  glossary.js              75 bilingual terms
  study.js / study.css     Spaced repetition, history, goals, plan, search
  ai.js / ai.css           Python: AI tutor panel
  homework/                Figures from the assignments
src/                       Source templates and question data
build.py                   Build script
start.bat                  Local server
```

### Content notes and limits

- Remote-sensing questions come from course assignments and textbook priorities; they are **not official school answers**. Chapter 5, “Remote Sensing Image Processing”, has no questions yet, but its outline and bilingual terms are readable.
- English definitions are concise study definitions, not a substitute for a professional dictionary.
- AI output can be wrong; always check against the textbook and your instructor's notes.
- The old Python project is read-only and is not modified, committed or moved.
- This project is for personal study and teaching exchange. Copyright in textbooks and course materials remains with their original authors and publishers.
