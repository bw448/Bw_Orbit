# -*- coding: utf-8 -*-
"""Wire the extracted homework JSON into the remote page."""
import re

# 1) build.py injects __HOMEWORK__
p = r"E:\地信复习系统\build.py"
s = open(p, encoding="utf-8").read()
s = s.replace(
    '''    tpl = open(os.path.join(ROOT, "src", "template.html"), encoding="utf-8").read()
    html = tpl.replace("__DATA__", json.dumps(DATA, ensure_ascii=False))
    out = os.path.join(ROOT, "remote.html")''',
    '''    tpl = open(os.path.join(ROOT, "src", "template.html"), encoding="utf-8").read()
    homework = json.load(open(os.path.join(ROOT, "src", "homework.json"), encoding="utf-8"))
    html = tpl.replace("__DATA__", json.dumps(DATA, ensure_ascii=False))
    html = html.replace("__HOMEWORK__", json.dumps(homework, ensure_ascii=False))
    out = os.path.join(ROOT, "remote.html")''')
open(p, "w", encoding="utf-8").write(s)
print("build.py patched")

# 2) template: homework variable, router, chapter tabs, showHomework
p = r"E:\地信复习系统\src\template.html"
s = open(p, encoding="utf-8").read()

s = s.replace("const DATA = __DATA__;", "const DATA = __DATA__;\nconst HOMEWORK = __HOMEWORK__;", 1)

s = s.replace(
    '''  if ((m = h.match(/^#chapter-(\\d+)$/))) { showChapter(m[1]); return; }''',
    '''  if ((m = h.match(/^#chapter-(\\d+)$/))) { showChapter(m[1]); return; }
  if ((m = h.match(/^#homework-(\\d+)$/))) { showHomework(m[1]); return; }''', 1)

# chapter view: insert tabs after chapter head, and a homework button in side note
old = '''    '<div class="chapter-grid"><div><div class="block-title">知识脉络</div>' +
    '<ul class="points">' + points + '</ul></div>' +'''
new = '''    '<div class="chapter-tabs"><span class="on">知识脉络</span><a href="#homework-' + c.id + '">完整作业</a><a href="#practice-' + c.id + '">刷题</a></div>' +
    '<div class="chapter-grid"><div><div class="block-title">知识脉络</div>' +
    '<ul class="points">' + points + '</ul></div>' +'''
assert old in s
s = s.replace(old, new, 1)

old = '''    '<div class="q-actions"><button class="btn btn-accent btn-wide" onclick="go(\\'#practice-' + c.id + '\\')">开始本章刷题</button>' +
    '<button class="btn btn-ghost btn-wide" onclick="go(\\'#chapters\\')">返回章节</button></div></aside></div>','''
new = '''    '<div class="q-actions"><button class="btn btn-accent btn-wide" onclick="go(\\'#practice-' + c.id + '\\')">开始本章刷题</button>' +
    '<button class="btn btn-ghost btn-wide" onclick="go(\\'#homework-' + c.id + '\\')">查看完整作业</button>' +
    '<button class="btn btn-ghost btn-wide" onclick="go(\\'#chapters\\')">返回章节</button></div></aside></div>','''
assert old in s
s = s.replace(old, new, 1)

# insert showHomework before function showChapter
marker = "/* ---------- chapter view ---------- */"
homework_js = r'''
/* ---------- homework view ---------- */
function hwTable(rows){
  var html = '<div class="hw-table-wrap"><table class="hw-table">';
  rows.forEach(function(row, ri){
    html += '<tr>';
    row.forEach(function(cell){
      var tag = ri === 0 ? 'th' : 'td';
      html += '<' + tag + '>' + esc(cell || '') + '</' + tag + '>';
    });
    html += '</tr>';
  });
  return html + '</table></div>';
}
function showHomework(id){
  var n = Number(id);
  var hw = (HOMEWORK.chapters || []).find(function(c){ return c.chapter === n; });
  if (!hw || !hw.blocks || !hw.blocks.length) {
    showView('<div class="chapter-head"><div class="chapter-num">' + String(n).padStart(2,'0') + '</div><div><div class="eyebrow">HOMEWORK ' + String(n).padStart(2,'0') + '</div><h1>第五章作业</h1><p class="lede">第五章遥感图像处理先留空，题库补齐后再装订。</p></div></div><div class="q-actions" style="margin-top:36px"><button class="btn btn-accent" onclick="go(\\'#chapter-' + n + '\\')">返回章节目录</button></div>', 'HOMEWORK ' + String(n).padStart(2,'0'));
    return;
  }
  var blocks = hw.blocks.map(function(b){
    if (b.type === 'h2') return '<h2 class="hw-h2">' + esc(b.text) + '</h2>';
    if (b.type === 'q') return '<h3 class="hw-q">' + esc(b.text) + '</h3>';
    if (b.type === 'answer') return '<p class="hw-a">' + esc(b.text) + '</p>';
    if (b.type === 'bullet') return '<p class="hw-b">' + esc(b.text) + '</p>';
    if (b.type === 'note') return '<p class="hw-note">' + esc(b.text) + '</p>';
    if (b.type === 'formula') return '<pre class="hw-formula">' + esc(b.text) + '</pre>';
    if (b.type === 'image') return '<figure class="hw-fig"><img src="' + b.src + '" alt=""></figure>';
    if (b.type === 'table') return hwTable(b.rows || []);
    if (/^[图表]\\s/.test(b.text || '')) return '<p class="hw-cap">' + esc(b.text) + '</p>';
    return '<p class="hw-p">' + esc(b.text) + '</p>';
  }).join('');
  var qtext = hw.blocks.filter(function(b){ return b.type === 'q' || b.type === 'h2'; }).map(function(b){ return b.text; }).join('\\n').slice(0, 6000);
  window.ORBIT_CONTEXT = { module:'遥感', chapter:n, homework:true, title:hw.title, text:qtext };
  showView('<div class="hw-head"><div class="eyebrow">CHAPTER ' + String(n).padStart(2,'0') + ' · HOMEWORK</div>' +
    '<h1>' + hw.title + '</h1><p class="hw-sub">' + hw.subtitle + ' · 完整题目与答案</p>' +
    '<div class="chapter-tabs"><a href="#chapter-' + n + '">知识脉络</a><span class="on">完整作业</span><a href="#practice-' + n + '">刷题</a></div></div>' +
    '<article class="hw">' + blocks + '</article>' +
    '<div class="hw-actions"><button class="btn btn-ghost" onclick="ORBIT_AI && ORBIT_AI.homeworkBrief()">AI 串讲</button>' +
    '<button class="btn btn-accent" onclick="go(\\'#practice-' + n + '\\')">去做本章题</button>' +
    '<button class="btn btn-ghost" onclick="go(\\'#chapter-' + n + '\\')">返回章节</button></div>', 'HOMEWORK ' + String(n).padStart(2,'0'));
}

'''
assert marker in s
s = s.replace(marker, homework_js + marker, 1)
open(p, "w", encoding="utf-8").write(s)
print("template patched")
