# -*- coding: utf-8 -*-
"""Replace generated image assets with code-drawn SVG across the site."""
import re

FAVICON = ('<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' '
           'viewBox=\'0 0 32 32\'%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'3\' fill=\'%23e9a23b\'/%3E'
           '%3Cellipse cx=\'16\' cy=\'16\' rx=\'14\' ry=\'6\' fill=\'none\' stroke=\'%23e9e2d6\' '
           'stroke-width=\'1.2\'/%3E%3C/svg%3E">')

BRAND_ICON = ('<svg class="brand-icon" viewBox="0 0 32 32" aria-hidden="true">'
              '<circle cx="16" cy="16" r="2.6" fill="currentColor"/>'
              '<ellipse cx="16" cy="16" rx="13.5" ry="5.2" fill="none" stroke="currentColor" stroke-width="1.1" transform="rotate(-24 16 16)"/>'
              '<ellipse cx="16" cy="16" rx="13.5" ry="5.2" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".5" transform="rotate(34 16 16)"/>'
              '</svg>')


def brand(label, href="index.html"):
    return ('<a class="brand" href="%s" aria-label="ORBIT %s">%s'
            '<span class="brand-word">ORBIT</span><span class="brand-sub">%s</span></a>'
            % (href, label, BRAND_ICON, label))


def footer_brand(label):
    return ('<div class="brand">%s<span class="brand-word">ORBIT</span>'
            '<span class="brand-sub">%s</span></div>' % (BRAND_ICON, label))


ORBITAL = '''<div class="orbital">
            <svg class="orbital-svg" viewBox="0 0 560 560" role="presentation">
              <defs>
                <radialGradient id="coreG" cx="36%" cy="30%" r="72%"><stop offset="0" stop-color="#4a3620"/><stop offset="42%" stop-color="#261b10"/><stop offset="100%" stop-color="#0c0906"/></radialGradient>
                <radialGradient id="haloG" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="rgba(233,162,59,.28)"/><stop offset="100%" stop-color="rgba(233,162,59,0)"/></radialGradient>
              </defs>
              <circle cx="280" cy="280" r="155" fill="url(#haloG)" opacity=".8"/>
              <circle cx="280" cy="280" r="86" fill="url(#coreG)" stroke="rgba(233,162,59,.28)"/>
              <circle cx="280" cy="280" r="86" fill="none" stroke="rgba(233,226,214,.1)"/>
              <circle cx="246" cy="246" r="34" fill="rgba(255,255,255,.03)"/>
              <g transform="rotate(-26 280 280)"><g class="orbit-g g1"><ellipse cx="280" cy="280" rx="242" ry="92" fill="none" stroke="rgba(233,226,214,.22)"/><ellipse cx="280" cy="280" rx="242" ry="92" fill="none" stroke="rgba(233,162,59,.4)" stroke-dasharray="150 700"/><circle cx="522" cy="280" r="4.5" fill="#e9a23b"/></g></g>
              <g transform="rotate(31 280 280)"><g class="orbit-g g2"><ellipse cx="280" cy="280" rx="210" ry="76" fill="none" stroke="rgba(233,226,214,.16)"/><circle cx="490" cy="280" r="2.8" fill="rgba(233,226,214,.8)"/></g></g>
              <g transform="rotate(2 280 280)"><g class="orbit-g g3"><ellipse cx="280" cy="280" rx="170" ry="58" fill="none" stroke="rgba(233,162,59,.22)" stroke-dasharray="2 8"/><circle cx="450" cy="280" r="2" fill="rgba(233,162,59,.9)"/></g></g>
              <g stroke="rgba(233,226,214,.28)"><path d="M280 38v18M280 504v18M38 280h18M504 280h18"/></g>
              <circle cx="280" cy="280" r="2.4" fill="#e9e2d6"/>
            </svg>
            <div class="orbital-scan"></div>
            <span class="orbital-label l1">ORBIT / 05</span>
            <span class="orbital-label l2">39.9°N · 116.4°E</span>
            <span class="orbital-label l3">SENSOR / SCAN 08</span>
          </div>'''

ICONS = {
    "chapter": '<svg class="mode-icon" viewBox="0 0 52 52" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M26 8 44 18 26 28 8 18z"/><path d="M8 26l18 10 18-10"/><path d="M8 34l18 10 18-10"/></svg>',
    "practice": '<svg class="mode-icon" viewBox="0 0 52 52" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M8 18h10l16 16h10"/><path d="M38 28l6 6-6 6"/><path d="M8 34h10l16-16h10"/><path d="M38 12l6 6-6 6"/></svg>',
    "exam": '<svg class="mode-icon" viewBox="0 0 52 52" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="9" y="8" width="24" height="32" rx="3"/><path d="M15 16h12M15 22h8"/><circle cx="35" cy="34" r="9"/><path d="M35 29v5l3 2"/></svg>',
    "wrong": '<svg class="mode-icon" viewBox="0 0 52 52" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="26" cy="26" r="17"/><path d="M20 20l12 12M32 20 20 32"/></svg>',
    "stats": '<svg class="mode-icon" viewBox="0 0 52 52" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M16 8h20v36L26 34 16 44z"/></svg>',
    "cards": '<svg class="mode-icon" viewBox="0 0 52 52" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="10" y="14" width="26" height="30" rx="3"/><path d="M16 8h26v30"/></svg>',
}
PY_ICON = ('<svg class="python-icon" viewBox="0 0 52 52" fill="none" stroke="currentColor" stroke-width="1.4">'
           '<path d="M20 10h-4a4 4 0 0 0-4 4v7a4 4 0 0 1-4 4 4 4 0 0 1 4 4v7a4 4 0 0 0 4 4h4"/>'
           '<path d="M32 10h4a4 4 0 0 1 4 4v7a4 4 0 0 0 4 4 4 4 0 0 0-4 4v7a4 4 0 0 1-4 4h-4"/>'
           '<path d="M21 21h10M21 29h10"/></svg>')


def patch(path, label, hero=False, mode_icons=False, py_icon=False):
    s = open(path, encoding="utf-8").read()
    s = re.sub(r'<link rel="icon" type="image/png" href="assets/favicon.png">', FAVICON, s, count=1)
    # nav brand (any label)
    s = re.sub(r'<a class="brand"[^>]*><img class="brand-logo"[^>]*><span>[^<]*</span></a>',
               brand(label), s, count=1)
    # footer brand
    s = re.sub(r'<div class="brand"><img class="brand-logo brand-logo-sm"[^>]*><span>[^<]*</span></div>',
               footer_brand(label), s, count=1)
    if hero:
        old = re.search(r'<div class="hero-orbit" aria-hidden="true">.*?<div class="orbit-caption">.*?</div>\s*</div>', s, re.S)
        if old:
            s = s[:old.start()] + '<div class="hero-orbit" aria-hidden="true">\n          ' + ORBITAL + '\n      </div>' + s[old.end():]
    if mode_icons:
        for name in ("chapter", "practice", "exam", "wrong", "stats"):
            s = s.replace('<img class="mode-icon" src="assets/icon-%s.png" alt="">' % name, ICONS[name])
        s = s.replace('<img class="mode-icon" src="assets/icon-chapter.png" alt="">', ICONS["cards"])
    if py_icon:
        s = s.replace('<img class="python-icon" src="assets/icon-python.png" alt="">', PY_ICON)
        s = s.replace('<img class="py-mark" src="assets/icon-python.png" alt="">',
                      PY_ICON.replace('class="python-icon"', 'class="py-mark"'))
    open(path, "w", encoding="utf-8").write(s)
    left = sum(s.count(x) for x in ("assets/hero-orbit", "assets/icon-", "assets/logo-", "assets/favicon"))
    print(path, "image refs left:", left)


patch("src/template.html", "遥感", hero=True, mode_icons=True, py_icon=True)
patch("src/python_template.html", "Python", py_icon=True)
patch("src/ebook.html", "电子书")
patch("src/semester_template.html", "__SEM__")
print("done")
