# -*- coding: utf-8 -*-
"""Merge the desktop source folders into one subject-based 课程资料 tree.

Dry-run by default:
    python tools/merge_materials.py
Apply:
    python tools/merge_materials.py --apply

Only moves files; never deletes a non-empty folder. A manifest is written to
课程资料/目录说明.md.
"""
import argparse
import datetime
import os
import shutil

BASE = r"C:\Users\Lenovo\Desktop\地信大二上"
SRC_ROOT = os.path.join(BASE, "原始文件")
REV_ROOT = os.path.join(BASE, "复习资料")
DEST = os.path.join(BASE, "课程资料")

# (source path, destination folder)
# (source, destination, flatten)  flatten=True: move the folder's children
MOVES = [
    (os.path.join(SRC_ROOT, "Python地理处理"), os.path.join(DEST, "Python", "原始", "Python地理处理"), False),
    (os.path.join(SRC_ROOT, "python(面向对象开发)-BW"), os.path.join(DEST, "Python", "原始", "python(面向对象开发)-BW"), False),
    (os.path.join(SRC_ROOT, "毛概（原始）"), os.path.join(DEST, "毛概", "原始"), True),
    (os.path.join(SRC_ROOT, "遥感.pdf"), os.path.join(DEST, "遥感", "原始"), False),
    (os.path.join(REV_ROOT, "arcgis（原始）"), os.path.join(DEST, "ArcGIS", "原始"), True),
    (os.path.join(REV_ROOT, "概率论（原始）", "概率论"), os.path.join(DEST, "概率论", "原始"), True),
    (os.path.join(REV_ROOT, "概率论（原始）", "概率论与数理统计回忆版.pdf"), os.path.join(DEST, "概率论", "原始"), False),
    (os.path.join(REV_ROOT, "自然地理学（原始）"), os.path.join(DEST, "自然地理学", "原始"), True),
    (os.path.join(REV_ROOT, "毛概"), os.path.join(DEST, "毛概", "整理稿"), True),
    (os.path.join(REV_ROOT, "GIS比赛.txt"), os.path.join(DEST, "通用"), False),
    (os.path.join(REV_ROOT, "大二上.txt"), os.path.join(DEST, "通用"), False),
]

NOTES = """# 课程资料目录

按科目合并，保留原始文件与整理稿。`遥感作业_分章` 留在桌面根目录，作为老师布置作业的“收件箱”，
网站构建脚本会从这里抽取作业内容。

```
课程资料/
  遥感/原始/                  遥感.pdf
  自然地理学/原始/            课本、变质作用扫描、重点页
  概率论/原始/                教材、Kira 讲义、PPT 原题、真题、回忆版
  毛概/原始/                  真题、题库、大题、选择题
  毛概/整理稿/                PDF版 / Word版 大题与选择题汇总
  Python/原始/
    Python地理处理/           课件、参考题目、150 题
    python(面向对象开发)-BW/  OOP 课件、知识点、notebook、题目
  ArcGIS/原始/                PPT、操作题、填空题扫描件、音频总结
  通用/                       GIS比赛.txt、大二上.txt
```

## 和网站的关系

- 网站源码：`E:\\地信复习系统`
- 题库 / 知识地图 / 总纲都从网站数据生成，不直接改本文件夹里的原始文件。
- 总纲输出：`系统整理好的复习资料/`（一科一份 docx）。
- 补新作业：把 docx 放进 `遥感作业_分章`，运行 `E:\\地信复习系统\\tools\\sync_content.py`。

## 合并记录

- 合并日期：{date}
- 来源：`原始文件/`、`复习资料/`（合并后两个空目录已删除）
- 未移动：`遥感作业_分章`（网站作业抽取的固定输入目录）
"""


def move(src, dest_dir):
    if not os.path.exists(src):
        print("skip (missing):", src)
        return
    os.makedirs(dest_dir, exist_ok=True)
    target = os.path.join(dest_dir, os.path.basename(src))
    if os.path.exists(target):
        print("skip (exists):", target)
        return
    print("move:", src, "->", target)
    shutil.move(src, target)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()
    if not args.apply:
        print("DRY RUN (add --apply to move)")
        for src, dest, flat in MOVES:
            print(" ", src, "->", dest, "(contents)" if flat else "")
        return

    os.makedirs(DEST, exist_ok=True)
    for src, dest, flat in MOVES:
        if flat and os.path.isdir(src):
            os.makedirs(dest, exist_ok=True)
            for name in os.listdir(src):
                move(os.path.join(src, name), dest)
            try:
                os.rmdir(src)
            except OSError:
                pass
        else:
            move(src, dest)

    # flatten the double arcgisppt folder if present
    nested = os.path.join(DEST, "ArcGIS", "原始", "arcgisppt", "arcgisppt")
    if os.path.isdir(nested):
        flat = os.path.join(DEST, "ArcGIS", "原始", "课件")
        os.makedirs(flat, exist_ok=True)
        for name in os.listdir(nested):
            move(os.path.join(nested, name), flat)
        for empty in (nested, os.path.dirname(nested)):
            try:
                os.rmdir(empty)
            except OSError:
                pass

    notes = NOTES.format(date=datetime.date.today().isoformat())
    open(os.path.join(DEST, "目录说明.md"), "w", encoding="utf-8").write(notes)
    print("written", os.path.join(DEST, "目录说明.md"))

    for root in (SRC_ROOT, REV_ROOT):
        try:
            os.rmdir(root)
            print("removed empty", root)
        except OSError:
            print("kept (not empty):", root)


if __name__ == "__main__":
    main()
