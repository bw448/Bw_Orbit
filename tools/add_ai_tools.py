# -*- coding: utf-8 -*-
"""Add AI tools to remote and Python practice / wrong / stats views."""


def patch(path, ctx_wrong, ctx_stats):
    s = open(path, encoding="utf-8").read()

    old_short = r'''<div class="self-grade"><button class="btn btn-ghost" onclick="revealShort()">查看参考答案</button></div>'''
    new_short = r'''<div class="self-grade"><button class="btn btn-ghost" onclick="revealShort()">查看参考答案</button><button class="btn btn-ghost" onclick="ORBIT_AI.gradeShort(document.getElementById('shortBox').value)">AI 批改</button></div>'''
    if old_short in s:
        s = s.replace(old_short, new_short, 1)
        print(path, "short grade")

    old_feedback = r'''if (s.done) body += feedbackHTML(q, s.correct, s.selected);'''
    new_feedback = r'''if (s.done) body += feedbackHTML(q, s.correct, s.selected);
  body += '<div class="ai-tools"><button class="ai-tool" onclick="ORBIT_AI.hint()">AI 提示</button><button class="ai-tool" onclick="ORBIT_AI.explain()">AI 讲解</button><button class="ai-tool" onclick="ORBIT_AI.variant()">AI 变式题</button></div>';'''
    if old_feedback in s:
        s = s.replace(old_feedback, new_feedback, 1)
        print(path, "practice tools")

    old_wrong = r'''  showView('<div class="chapter-head"><div class="chapter-num">' + String(qs.length).padStart(2,'0')'''
    if old_wrong in s:
        s = s.replace(old_wrong, ctx_wrong + "\n" + old_wrong, 1)
        print(path, "wrong context")

    old_stats = r'''  showView('<div class="chapter-head"><div class="chapter-num">' + rate'''
    if old_stats in s:
        s = s.replace(old_stats, ctx_stats + "\n" + old_stats, 1)
        print(path, "stats context")

    # AI buttons in wrong and stats actions
    s = s.replace(
        r'''<button class="btn btn-ghost" onclick="go(\'#stats-view\')">看进度</button>''',
        r'''<button class="btn btn-ghost" onclick="ORBIT_AI.analyzeWrong()">AI 分析错题</button><button class="btn btn-ghost" onclick="go(\'#stats-view\')">看进度</button>''', 1)
    s = s.replace(
        r'''<button class="btn btn-ghost" onclick="go(\'#stats\')">看数据</button>''',
        r'''<button class="btn btn-ghost" onclick="ORBIT_AI.analyzeWrong()">AI 分析错题</button><button class="btn btn-ghost" onclick="go(\'#stats\')">看数据</button>''', 1)
    s = s.replace(
        r'''<button class="btn btn-ghost" onclick="go(\'#coverage-view\')">覆盖地图</button>''',
        r'''<button class="btn btn-ghost" onclick="ORBIT_AI.report()">AI 学习报告</button><button class="btn btn-ghost" onclick="go(\'#coverage-view\')">覆盖地图</button>''', 1)
    s = s.replace(
        r'''<button class="btn btn-ghost" onclick="go(\'#wrong\')">错题本</button>''',
        r'''<button class="btn btn-ghost" onclick="ORBIT_AI.report()">AI 学习报告</button><button class="btn btn-ghost" onclick="go(\'#wrong\')">错题本</button>''', 1)

    open(path, "w", encoding="utf-8").write(s)
    print(path, "saved")


patch(
    r"E:\地信复习系统\src\template.html",
    r'''  window.ORBIT_CONTEXT = { module:'遥感', wrongQuestions: qs.map(q => q.q).slice(0,20) };''',
    r'''  window.ORBIT_CONTEXT = { module:'遥感', stats:{ answered:n, total:total, accuracy:rate, wrong:wrong, saved:saved } };''',
)
patch(
    r"E:\地信复习系统\src\python_template.html",
    r'''  window.ORBIT_CONTEXT = { module:'Python', wrongQuestions: qs.map(q => q.q).slice(0,20) };''',
    r'''  window.ORBIT_CONTEXT = { module:'Python', stats:{ answered:n, total:total, accuracy:rate, wrong:store.wrong.length, saved:(store.bookmarks||[]).length } };''',
)
print("done")
