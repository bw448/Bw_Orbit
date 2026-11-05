# -*- coding: utf-8 -*-
"""Add the Python code playground to the Python module page."""
p = r"E:\地信复习系统\src\python_template.html"
s = open(p, encoding="utf-8").read()

s = s.replace(
    '<link rel="stylesheet" href="assets/study.css">',
    '<link rel="stylesheet" href="assets/study.css">\n'
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css">',
    1,
)
s = s.replace(
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.2/anime.min.js"></script>',
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>\n'
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/python/python.min.js"></script>\n'
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/edit/closebrackets.min.js"></script>\n'
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/edit/matchbrackets.min.js"></script>\n'
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.2/anime.min.js"></script>',
    1,
)

old_mode = r'''<button class="mode" onclick="go('#stats')"><span class="idx">06 / DATA</span><h3>数据</h3><p>总进度、正确率、分套进度。</p><span class="go">↗</span></button>'''
new_mode = old_mode + r'''
        <button class="mode" onclick="document.getElementById('code').scrollIntoView({behavior:'smooth'})"><span class="idx">07 / CODE</span><h3>代码练习</h3><p>浏览器里运行 Python；多文件、补全、numpy / pandas。</p><span class="go">↗</span></button>
        <button class="mode" onclick="ORBIT_AI.open()"><span class="idx">08 / AI</span><h3>AI 助教</h3><p>提示、讲解、批改、错题分析。</p><span class="go">↗</span></button>'''
s = s.replace(old_mode, new_mode, 1)

css = r'''.code-app{border:1px solid var(--line-soft);border-radius:16px;overflow:hidden;background:var(--paper-alt)}
.code-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:10px;border-bottom:1px solid var(--line-soft);background:#fff}
.code-bar select,.code-bar input{border:1px solid var(--line);border-radius:8px;padding:7px 9px;font:inherit;font-size:12px;color:var(--ink);background:#fff}
.code-bar input{width:130px}
.code-bar button{border:1px solid var(--line);border-radius:999px;padding:7px 11px;font-size:12px;background:#fff;color:var(--ink)}
.code-bar button.primary{background:var(--blue);border-color:var(--blue);color:#fff}
#codeArea{width:100%;min-height:300px;border:0;padding:16px;font:13px/1.7 var(--mono);resize:vertical;outline:none;background:#fff}
.CodeMirror{height:360px;font-size:13px;background:#fff}
.code-out{margin:0;background:#f5f5f7;border-top:1px solid var(--line-soft);padding:14px 16px;font:12px/1.7 var(--mono);color:var(--ink);white-space:pre-wrap;min-height:80px;max-height:260px;overflow:auto}
@media(max-width:640px){.code-bar input{width:100%}.CodeMirror{height:260px}#codeArea{min-height:240px}}
'''
s = s.replace('@media(max-width:1000px){', css + '\n@media(max-width:1000px){', 1)

section = r'''  <section class="section" id="code">
    <div class="section-inner">
      <div class="section-head"><div><div class="eyebrow">Code lab</div><h2>代码练习</h2></div><p>浏览器里运行 Python；支持多文件、补全、numpy / pandas。首次运行需要下载 Pyodide 运行时（约 10 MB）。</p></div>
      <div class="code-app">
        <div class="code-bar">
          <select id="codeFile" aria-label="选择文件"></select>
          <input id="codeName" placeholder="新文件名.py">
          <button type="button" id="codeAdd">新建</button>
          <button type="button" id="codeDel">删除</button>
          <button type="button" id="codeRun" class="primary">运行</button>
        </div>
        <textarea id="codeArea" spellcheck="false"></textarea>
        <pre class="code-out" id="codeOut">点击“运行”开始。首次运行会下载 Pyodide 运行时（约 10 MB）。</pre>
      </div>
    </div>
  </section>

  <footer class="footer">'''
s = s.replace('  <footer class="footer">', section, 1)

js = r'''let codeFiles = loadCodeFiles(), currentFile = 'main.py', codeMirror = null, pyodideReady = null;
function loadCodeFiles(){
  try{ var raw=localStorage.getItem('orbit-code-files-v1'); if(raw){ var o=JSON.parse(raw); if(o && Object.keys(o).length) return o; } }catch(e){}
  return { 'main.py': 'print("Hello, ORBIT")\n\nfor i in range(3):\n    print("line", i)' };
}
function saveCodeFiles(){ try{ localStorage.setItem('orbit-code-files-v1', JSON.stringify(codeFiles)); }catch(e){} }
function initCode(){
  var sel=document.getElementById('codeFile'), area=document.getElementById('codeArea');
  if(!sel || !area) return;
  function options(){ sel.innerHTML=Object.keys(codeFiles).map(function(n){return '<option'+(n===currentFile?' selected':'')+'>'+n+'</option>';}).join(''); }
  function code(){ return codeMirror ? codeMirror.getValue() : area.value; }
  function setCode(v){ if(codeMirror) codeMirror.setValue(v); else area.value=v; }
  if(window.CodeMirror){
    codeMirror=CodeMirror.fromTextArea(area,{mode:'python',lineNumbers:true,matchBrackets:true,autoCloseBrackets:true,indentUnit:4,tabSize:4});
    codeMirror.on('change',function(){ codeFiles[currentFile]=codeMirror.getValue(); saveCodeFiles(); });
  } else {
    area.value=codeFiles[currentFile];
    area.addEventListener('input',function(){ codeFiles[currentFile]=area.value; saveCodeFiles(); });
  }
  options();
  sel.addEventListener('change',function(){ currentFile=sel.value; setCode(codeFiles[currentFile]||''); });
  document.getElementById('codeAdd').addEventListener('click',function(){
    var input=document.getElementById('codeName'); var name=(input.value||'').trim();
    if(!name) name='file'+(Object.keys(codeFiles).length+1)+'.py';
    if(!/\.py$/.test(name)) name+='.py';
    if(codeFiles[name]) return;
    codeFiles[name]='# '+name+'\n'; currentFile=name; saveCodeFiles(); options(); setCode(codeFiles[name]); input.value='';
  });
  document.getElementById('codeDel').addEventListener('click',function(){
    if(currentFile==='main.py' || Object.keys(codeFiles).length<=1) return;
    delete codeFiles[currentFile]; currentFile='main.py'; saveCodeFiles(); options(); setCode(codeFiles[currentFile]);
  });
  document.getElementById('codeRun').addEventListener('click',runCode);
}
function loadPyodideScript(){
  if(window.loadPyodide) return Promise.resolve();
  return new Promise(function(res,rej){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';s.onload=res;s.onerror=rej;document.head.appendChild(s);});
}
async function runCode(){
  var out=document.getElementById('codeOut'); out.textContent='加载运行时…';
  var code=codeMirror?codeMirror.getValue():document.getElementById('codeArea').value;
  codeFiles[currentFile]=code;
  try{
    await loadPyodideScript();
    if(!pyodideReady){ pyodideReady=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'}); }
    var py=pyodideReady;
    Object.keys(codeFiles).forEach(function(n){ py.FS.writeFile(n, codeFiles[n]||''); });
    out.textContent='';
    py.setStdout({batched:function(s){ out.textContent+=s; out.scrollTop=out.scrollHeight; }});
    py.setStderr({batched:function(s){ out.textContent+=s; out.scrollTop=out.scrollHeight; }});
    try{ await py.loadPackagesFromImports(code); }catch(e){}
    await py.runPythonAsync(code);
  }catch(e){ out.textContent+='\n'+e; }
}
initCode();
renderTypeStrip(); renderPaperGrid(); updateHome(); initMotion(); route();'''
s = s.replace('renderTypeStrip(); renderPaperGrid(); updateHome(); initMotion(); route();', js, 1)

open(p, "w", encoding="utf-8").write(s)
print("code lab added")
