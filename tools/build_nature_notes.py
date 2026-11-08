# -*- coding: utf-8 -*-
"""Build src/nature-notes.html from src/nature_notes.md.

The generated page is committed; run this only when the Markdown changes.
Requires: pip install mistune
"""
import os
import re

import mistune

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MD = os.path.join(ROOT, "src", "nature_notes.md")
OUT = os.path.join(ROOT, "src", "nature-notes.html")

SHELL = """<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#f5f5f7">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="assets/icon-192.png">
<title>自然地理学 · 手写稿文字版 / Orbit</title>
<meta name="description" content="自然地理学课堂手写复习稿的文字版：绪论、地球表层、矿物与岩石、地质构造、气候、地貌、水文与土壤。可搜索、可打印，不直接转载原扫描件。">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='3' fill='%230071e3'/%3E%3Cellipse cx='16' cy='16' rx='14' ry='6' fill='none' stroke='%231d1d1f' stroke-width='1.2'/%3E%3C/svg%3E">
<link rel="stylesheet" href="assets/apple.css">
<link rel="stylesheet" href="assets/nature-notes.css?v=1">
</head>
<body>

<header class="global-nav">
  <div class="gn-inner">
    <a class="gn-brand" href="index.html" aria-label="Orbit 自然地理学">
      <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="2.6" fill="currentColor"/><ellipse cx="16" cy="16" rx="13.5" ry="5.2" fill="none" stroke="currentColor" stroke-width="1.1" transform="rotate(-24 16 16)"/><ellipse cx="16" cy="16" rx="13.5" ry="5.2" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".45" transform="rotate(34 16 16)"/></svg>
      Orbit
    </a>
    <nav class="gn-links" aria-label="学期模块">
      <a href="semesters.html">学习内容</a>
      <a class="active" href="sem2-1.html">大二上</a>
      <a href="sem2-2.html">大二下</a>
      <a href="sem3-1.html">大三上</a>
      <a href="sem3-2.html">大三下</a>
      <a href="ebook.html">电子书</a>
      <a href="competitions.html">竞赛</a>
      <a href="bw-talk.html">BW有话说</a>
    </nav>
    <div class="gn-right"><span>自然地理 · 文字版</span></div>
  </div>
</header>

<main class="nn-page">
  <section class="nn-hero">
    <div class="nn-shell">
      <div class="nn-eyebrow">NAT · 201 / TEXT EDITION</div>
      <h1>手写复习稿，<br>整理成文字。</h1>
      <p class="nn-lede">把课堂手写复习稿里的绪论、岩石与构造、气候、地貌、水文和土壤整理成可搜索、可打印的文字版。原扫描件不直接转载；保留考点结构，不逐字照抄。</p>
      <div class="nn-actions">
        <a class="btn-primary" href="#nn-start">开始阅读</a>
        <button class="btn-secondary" type="button" onclick="window.print()">打印 / 存为 PDF</button>
        <a class="nn-back" href="nature-geo.html">返回自然地理 <span>↗</span></a>
      </div>
      <div class="nn-meta"><span><b>14</b> 页手写稿</span><span><b>5</b> 个部分</span><span><b>HTML</b> 文字版</span><span><b>2026</b> 整理</span></div>
    </div>
  </section>

  <nav class="nn-toc" aria-label="目录">
    <div class="nn-shell">
      <div class="nn-toc-title">CONTENTS / 目录</div>
      <div class="nn-toc-list" id="nnToc"></div>
    </div>
  </nav>

  <article class="nn-doc" id="nn-start">
    <div class="nn-shell">
__CONTENT__
    </div>
  </article>

  <footer class="site-foot nn-foot">
    <div class="foot-inner">
      <span>Orbit · 大二上 · 自然地理学<br>手写稿文字版 · 2026</span>
      <div class="foot-links"><a href="index.html">首页</a><a href="sem2-1.html">大二上</a><a href="nature-geo.html">自然地理</a><a href="ebook.html">电子书</a><a href="https://github.com/bw448/Bw_Orbit">GitHub</a></div>
    </div>
  </footer>
</main>

<script src="assets/nature-notes.js?v=1"></script>
<script src="assets/pwa.js" defer></script>
</body>
</html>
"""


def add_ids_and_wrap(html_text):
    counter = [0]

    def h(match):
        counter[0] += 1
        tag, inner = match.group(1), match.group(2)
        return '<h%s id="nn-sec-%d">%s</h%s>' % (tag, counter[0], inner, tag)

    html_text = re.sub(r"<h([12])>(.*?)</h\1>", h, html_text, flags=re.S)
    html_text = html_text.replace("<table>", '<div class="nn-table"><table>')
    html_text = html_text.replace("</table>", "</table></div>")
    return html_text


def main():
    md = open(MD, encoding="utf-8").read()
    body = mistune.html(md)
    # drop the global h1; the hero already carries the page title
    body = re.sub(r"^\s*<h1>.*?</h1>\s*", "", body, count=1, flags=re.S)
    body = add_ids_and_wrap(body)
    page = SHELL.replace("__CONTENT__", body.strip())
    open(OUT, "w", encoding="utf-8", newline="\n").write(page)
    print("wrote", OUT, len(page), "chars")


if __name__ == "__main__":
    main()
