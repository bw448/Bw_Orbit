# -*- coding: utf-8 -*-
"""One command to sync desktop source material -> site -> summary docs.

Steps:
  1. tools/extract_homework.py   (遥感作业_分章 -> src/homework.json)
  2. build.py                    (rebuild all pages)
  3. tools/export_summaries.py   (one .docx per subject)

Run: python tools/sync_content.py
"""
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def run(script):
    print("\n==>", script)
    subprocess.run([sys.executable, os.path.join(ROOT, script)], cwd=ROOT, check=True)


def main():
    run(os.path.join("tools", "extract_homework.py"))
    run("build.py")
    run(os.path.join("tools", "export_summaries.py"))
    print("\nAll synced. 网站已重建，总纲已更新。")


if __name__ == "__main__":
    main()
