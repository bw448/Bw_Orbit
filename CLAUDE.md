# CLAUDE.md — Orbit 项目工作说明

## 项目位置

- 本地根目录：`E:\地信复习系统`
- GitHub：`https://github.com/bw448/Bw_Orbit`
- 线上：`https://bw448.github.io/Bw_Orbit/`
- 技术栈：纯静态 HTML / CSS / JS，无框架；GitHub Pages 部署
- 本地服务：`start.bat` 或 `python -m http.server 8765`

以后继续优化时，**先在这个目录启动 Claude Code**：

```powershell
cd E:\地信复习系统
claude
```

如果在别的目录启动了，也可以直接说：

> 项目在 `E:\地信复习系统`。先读 `CLAUDE.md` 和 `README.md`，再继续。

## 每次开始先做

1. 读 `README.md`（项目说明）和本文件
2. `git status` 确认工作区干净
3. 看 `build.py` 和要改的 `src/*.html`
4. 改完运行 `python build.py`
5. 检查 JS：`node --check assets/xxx.js`
6. 同步总纲：`python tools/export_summaries.py`（或直接运行 `sync.bat`）
7. 手机 390px 检查，再 commit / push

## 常用命令

```powershell
# 本地预览
.\start.bat
# 或
python -m http.server 8765

# 重新生成所有页面
python build.py

# 同步桌面资料：作业抽取 → 数据检查 → 建站 → 六科总纲
python tools/sync_content.py
# 或双击 sync.bat

# 查看状态 / 提交 / 部署
git status
git add -A
git commit -m "说明"
git push origin main
```

GitHub Pages 从 `main` 根目录构建；push 后等 10—30 秒。

## 当前结构

- `index.html`：Orbit 品牌首页（动效、介绍、进入内容）
- `opensource.html`：开源项目展示页（分类 / 搜索 / 内置快照 + GitHub API 增强；数据 `src/opensource_projects.json` + `src/opensource_snapshot.json`）
- `semesters.html`：学习内容，选学期
- `sem2-1.html`：大二上，六门课 + 电子书
- 遥感：`remote.html`
  - 原有七套作业 / 90 题固定不动
  - `remote.html#notes`：从老师复习 PDF 补的 61 条讲义补充
  - `remote.html#appendix`：教材附录 3/4 共 807 条，背诵卡 / 英中互测 / 附录错题本
- 自然地理 / 概率论：`nature-geo.html` / `probability.html`
  - 在课程模板里新增 `#practice`：80 / 60 道自编自测题 + 共享错题本面板
  - 自然地理手写稿已转成 `nature-notes.html`（14 页文字版）；原手写扫描/JPG 不再在页面链接
- 毛概 / ArcGIS：选择题答错自动进 `quiz.js` 的错题本面板（章节分布、重练、导出、清空）
- AI 入口：`course-ai.js` 在课程页 / Python 知识地图的首屏操作区、吸顶导航、每个 section 标题下注入“问 AI”；`rs-ai.js` 在遥感首屏注入“问 AI”；Python 主页面 `ai.js` 首屏 + 右下角按钮。不要再只靠右下角小圆点。
- 长页面大标签页：毛概 / ArcGIS / 遥感 / 自然地理 / 概率论 / 竞赛 / Python 知识地图用 `assets/course-tabs.js` + 页面里的 `window.ORBIT_TABS`。每个 tab 只显示一组 section，顶部固定大号 tab 条；默认第一个 tab（带 hero），其余 tab 隐藏 hero；`?tab=id` 直达，旧 `#id` 会自动映射到所在 tab。新增 section 要同步 tabs 配置。
- Python：`python.html`
  - 599 题 / 10 套卷；2026-11-10 完成答案与解析校订（补全/重写 300+ 条解析、纠正错误与错位答案、修复 OCR 截断题干与选项）
  - **不重排、不删题**；只允许修复明显 OCR 损坏和错误的答案 / 解析
  - `#paper-full-N` 整卷看
  - `assets/papers/`：十套 PDF / Word + 合集
- Python 知识地图：`python-guide.html`
  - 考试结构（来自 `考试.txt`）、10 个知识模块、题库主题覆盖、5 天路线
  - 数据：`src/python_guide.json` + `src/python_topics.json`
- 四个课程模块：
  - `nature-geo.html` 自然地理学
  - `maogai.html` 毛概（1063 题系统题库 + 97 道真题 + 256 条高频考点 + 39 组易混对比）
  - `probability.html` 概率论
  - `arcgis.html` ArcGIS（80 道客观题 + 18 条名词解释 + 算法/实操/简答/分析/论述）
- 竞赛顶层模块：`competitions.html`（赛事 / 备考 / 技能 / 资料）
- 电子书：`ebook.html`（5 本教材 + PDF.js 阅读器；全页图片阅读 + 整本压缩版下载）
- BW有话说：
  - 公开页：`bw-talk.html`
  - 管理页：`bw-admin.html`（不进导航）
  - 后端：CloudBase PostgreSQL + PostgREST
  - 只保留**点赞**，不做评论
  - 配置：`assets/cloudbase-config.js`（只放 publishable key）
  - SQL：`cloudbase/schema.sql`
  - 环境 ID：`orbit-bw-d4gnuqtu66b219e6c`，地域 `ap-shanghai`
- PWA：`sw.js` 网络优先；`assets/pwa.js` 自动检查更新

## 数据源（改内容看这里）

- 遥感题库 / 章节：`src/content.py`
- 遥感作业正文：`src/homework.json`
- 遥感讲义补充：`src/notes.json`
- Python 599 题：`src/python_questions.json`（已校订；不要重排 / 删题）
- Python 知识地图：`src/python_guide.json`；题库主题统计：`src/python_topics.json`
- 四个课程模块：`src/courses.json`
- 自然地理自测题：`src/nature_bank.json`（80 题）
- 自然地理手写稿文字版：`src/nature_notes.md` → `tools/build_nature_notes.py` → `src/nature-notes.html`；版式 `assets/nature-notes.css`、目录 `assets/nature-notes.js`
- 概率论自测题：`src/probability_bank.json`（60 题）
- 遥感教材附录：`assets/rs-appendix-data.js`（807 条；由 `tools/build_rs_appendix.py` 从 `.work/appendix` OCR JSON 生成）
- ArcGIS 题库 / 模板：`src/arcgis_bank.json`
- 毛概选择题库：`src/maogai_bank.json`（1063 题，已去掉 2 道完全重复）；高频考点/真题/易混：`src/maogai_special.json`；大题背诵：`src/maogai_essay.json`
- 课程总纲生成：`tools/export_summaries.py` → 桌面 `系统整理好的复习资料/`
- 数据检查：`tools/check_site.py`（题库结构、答案下标、本地链接）
- 电子书书目：`assets/ebooks/books.js`
- 竞赛数据：`assets/competitions-data.js`
- 课程资料 PDF：`assets/resources/`（从 GitHub Release 镜像到站内，约 80MB；课程页资源卡直接下载，手机不再依赖 GitHub 域名）
- 开源项目页：`src/opensource_projects.json`（手写介绍/分类）+ `src/opensource_snapshot.json`（GitHub Action 每 6 小时生成）→ `python build.py` 合并成 `assets/opensource-data.js`。页面先读站内快照，运行时再尝试 GitHub API（5 秒超时、30 分钟缓存、失败可点“重新同步”）。新增仓库由 Action 自动收录；要精美中文介绍再编辑 curated JSON。`.github/workflows/sync-opensource.yml` + `tools/sync_opensource.py` 负责定时同步
- BW 的 CloudBase 配置：`assets/cloudbase-config.js`
- BW 数据库 / RPC：`cloudbase/schema.sql`

## 不能动 / 注意

- **遥感原有七套作业题库是固定的**，补充内容只能加到 `src/notes.json` 或新模块，不要改原题。
- **Python 599 题 / 10 套卷不重排、不删题**；允许修复明显 OCR 损坏和错误的答案 / 解析；知识地图只能新增导航。
- 旧 Python 项目（`E:\python卷子`）保持只读，不修改、不提交。
- 生成后的 `arcgis.html` / `maogai.html` / `python-guide.html` 不要直接改，改 `src/` 模板与 JSON 后重新 build。
- ArcGIS 题库答案以扫描件为准；毛概补充题库以教材/课后题为准。
- 遥感附录 3 在这本 PDF 里只到 H（A—H），附录 4 覆盖 A—Z；不要声称附录 3 覆盖 I—Z。OCR 数据可能有少量识别误差，以书上原文为准。
- 自然地理手写扫描/JPG 是他人手写资料，**页面不再链接**；只保留 `nature-notes.html` 的文字整理版。2026-11-09 已从 GitHub Release 删除 `key-points.jpg` / `metamorphism-notes.pdf`，不要恢复这两个链接。
- 手写稿文字版是整理/改写，不是逐字照抄；原稿只列问题处标“原稿留白”，按教材补全的内容单独标出。
- 自然地理 80 题、概率论 60 题是自编自测题，页面已标注“不是学校官方题”；不要改成“押题/真题”口径。
- 视觉基线：浅色 Apple 风、白底、系统字体、蓝色强调；不要纯黑大面积；不要用用户生成图片，视觉用代码/SVG。
- 手机端 390px 必须无横向溢出。
- 不要把 SecretId / SecretKey / service_role / 数据库密码放进前端；BW 只用 publishable key。
- 旧 `assets/courses/` 仍是本地课程原稿目录，已在 `.gitignore`；站内下载用 `assets/resources/` 的镜像 PDF（不要改回 GitHub Release 外链）。
- 电子书站内只保留压缩下载版（约 105MB）；原书 PDF 备份在本机 `.work/ebooks_full/`，分卷 PDF 备份在 `.work/ebooks_parts/`；不要再复制进仓库，避免 Pages 部署超时。
- 教材 / 课程资料版权归原作者；仅个人学习使用。

## BW有话说（CloudBase）要点

- 公开页只读帖子 + 点赞；管理页用 SQL 里设置的管理密码登录。
- 写操作全部走 PostgreSQL RPC：
  - `bw_admin_check`
  - `bw_admin_create`
  - `bw_admin_delete`
  - `toggle_like`
  - `like_counts`
- 管理密码哈希在 `bw_config`，不要把它改回明文。
- 图片在浏览器压缩后以 data URL 存帖子；视频用外链。
- Supabase 项目已弃用；没有明确要求不要切回 Supabase。

## 更新流程建议

1. 先改 `src/` 模板 / JSON，不要直接改生成的 HTML
2. `python build.py`
3. 用本地 8765 检查桌面 + 390px 手机
4. `node --check` 改过的 JS
5. `git add -A && git commit -m "..." && git push origin main`
6. 等 GitHub Pages 构建完成，再打开线上链接

## 当前待办 / 可继续优化

- 第五章遥感图像处理仍无作业与题目（知识脉络和术语可看）；把 `第五章作业.docx` 放进 `地信大二上/课程资料/遥感/作业分章` 后运行 `sync.bat`
- 毛概选择题补充库有少量原资料错字/争议，遇到就按教材改 `src/maogai_bank.json` 或源 PDF
- 遥感附录 3 若纸质书还有 I—Z，补进 `assets/rs-appendix-data.js`；附录 4 可继续人工校对高频词
- 自然地理 / 概率论自测题可随老师最新勾画和 PPT 继续扩充
- 电子书阅读器可继续做书签、搜索、笔记
- 竞赛模块可继续补赛事日历、获奖作品、校赛信息
- BW有话说可继续做编辑帖子、图片多图、浏览量
- Python 模拟卷可做 60/90/120 分钟与题量配置
- 全站可继续做 Lighthouse / 无障碍 / 弱网检查
- 宣传：宣传片 / 公众号推文 / 抖音简介待做；见本机 `.work/promo/后续任务-宣传.md`（不进仓库），不要擅自改网站

## 新对话开场模板

```text
项目在 E:\地信复习系统。先读 CLAUDE.md 和 README.md，了解当前结构；
不要改遥感原有固定题库，不要动旧 Python 项目；Python 599 题不要重排 / 删题，只修复明显 OCR 与错误答案 / 解析。
桌面资料在 C:\Users\Lenovo\Desktop\地信大二上\课程资料；总纲在 系统整理好的复习资料。
这次我想优化：……
改完请 build、导出总纲、检查 390px、commit 并 push。
```
