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
6. 手机 390px 检查，再 commit / push

## 常用命令

```powershell
# 本地预览
.\start.bat
# 或
python -m http.server 8765

# 重新生成所有页面
python build.py

# 查看状态 / 提交 / 部署
git status
git add -A
git commit -m "说明"
git push origin main
```

GitHub Pages 从 `main` 根目录构建；push 后等 10—30 秒。

## 当前结构

- `index.html`：Orbit 品牌首页（动效、介绍、进入内容）
- `semesters.html`：学习内容，选学期
- `sem2-1.html`：大二上，六门课 + 电子书
- 遥感：`remote.html`
  - 原有七套作业 / 90 题固定不动
  - `remote.html#notes`：从老师复习 PDF 补的 61 条讲义补充
- Python：`python.html`
  - 599 题 / 10 套卷
  - `#paper-full-N` 整卷看
  - `assets/papers/`：十套 PDF / Word + 合集
- 四个课程模块：
  - `nature-geo.html` 自然地理学
  - `maogai.html` 毛概
  - `probability.html` 概率论
  - `arcgis.html` ArcGIS
- 竞赛顶层模块：`competitions.html`（赛事 / 备考 / 技能 / 资料）
- 电子书：`ebook.html`（5 本教材 + PDF.js 阅读器）
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
- Python 599 题：`src/python_questions.json`
- 四个课程模块：`src/courses.json`
- 电子书书目：`assets/ebooks/books.js`
- 竞赛数据：`assets/competitions-data.js`
- BW 的 CloudBase 配置：`assets/cloudbase-config.js`
- BW 数据库 / RPC：`cloudbase/schema.sql`

## 不能动 / 注意

- **遥感原有七套作业题库是固定的**，补充内容只能加到 `src/notes.json` 或新模块，不要改原题。
- 旧 Python 项目（`E:\python卷子`）保持只读，不修改、不提交。
- 视觉基线：浅色 Apple 风、白底、系统字体、蓝色强调；不要纯黑大面积；不要用用户生成图片，视觉用代码/SVG。
- 手机端 390px 必须无横向溢出。
- 不要把 SecretId / SecretKey / service_role / 数据库密码放进前端；BW 只用 publishable key。
- `assets/courses/` 已在 `.gitignore`，课程 PDF 放在 GitHub Release，不要重新 commit 大文件。
- 电子书 PDF 已在仓库中（约 231MB），不要重复复制。
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

- 第五章遥感图像处理仍无题目（知识脉络和术语可看）
- 电子书阅读器可继续做书签、搜索、笔记
- 竞赛模块可继续补赛事日历、获奖作品、校赛信息
- BW有话说可继续做编辑帖子、图片多图、浏览量
- Python 模拟卷可做 60/90/120 分钟与题量配置
- 全站可继续做 Lighthouse / 无障碍 / 弱网检查

## 新对话开场模板

```text
项目在 E:\地信复习系统。先读 CLAUDE.md 和 README.md，了解当前结构；
不要改遥感原有固定题库，不要动旧 Python 项目。
这次我想优化：……
改完请 build、检查 390px、commit 并 push。
```
