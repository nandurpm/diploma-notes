from pathlib import Path
import re

lesson = Path('lessons/lessons-3031.html')
css = Path('tools/restyle-3031.css').read_text(encoding='utf-8')
html = lesson.read_text(encoding='utf-8')
html, n = re.subn(r'<style>.*?</style>', '<style>\n' + css + '\n</style>', html, count=1, flags=re.S)
assert n == 1

header = '''<a class="revision-back-button" href="../revision-2021.html">← Back to Revision 2021</a>
<div class="progress" id="progress"></div>
<header id="sidenav" class="topbar">
<a class="nav-brand" href="#cover">3031</a>
<nav class="selector" aria-label="Lesson sections">
<a class="view-btn" href="#overview">Course Overview</a><a class="view-btn" href="#howto">How to Use</a><a class="view-btn" href="#outcomes">Outcomes</a><a class="view-btn" href="#roadmap">Roadmap</a><a class="view-btn m1" href="#module1">Module 1</a><a class="view-btn m2" href="#module2">Module 2</a><a class="view-btn m3" href="#module3">Module 3</a><a class="view-btn m4" href="#module4">Module 4</a><a class="view-btn" href="#formula-bank">Formula Bank</a><a class="view-btn" href="#waveform-bank">Waveforms</a><a class="view-btn" href="#kmap-bank">K-Map Bank</a><a class="view-btn" href="#expected-qs">Expected Questions</a><a class="view-btn" href="#practice">Practice</a><a class="view-btn" href="#revision">Revision</a><a class="view-btn" href="#model-qp">Model QP</a><a class="view-btn" href="#references">References</a><a class="view-btn" href="#checklist">Exam Checklist</a>
</nav><button class="download-btn" type="button" onclick="window.print()">Print / Save PDF</button></header>'''
html, n = re.subn(r'<!-- HAMBURGER -->.*?</nav>', header, html, count=1, flags=re.S)
assert n == 1

if 'name="description"' not in html:
    html = html.replace('<meta name="viewport" content="width=device-width, initial-scale=1.0">', '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<meta name="description" content="Analog and Digital Circuits 3031 Kerala Polytechnic student handbook.">', 1)

html = html.replace("window.addEventListener('scroll',()=>{\n  const bt = document.getElementById('backtop');\n  bt.classList.toggle('visible', window.scrollY > 300);\n});", "function updatePageProgress(){const bt=document.getElementById('backtop');const p=document.getElementById('progress');if(bt)bt.classList.toggle('visible',window.scrollY>300);if(p){const m=document.documentElement.scrollHeight-window.innerHeight;p.style.width=(m>0?window.scrollY/m*100:0)+'%'}}window.addEventListener('scroll',updatePageProgress,{passive:true});window.addEventListener('load',updatePageProgress);")
html = html.replace("},{threshold:0.3,rootMargin:'-50px 0px -60% 0px'});", "},{threshold:0.18,rootMargin:'-105px 0px -60% 0px'});", 1)

old = "document.querySelectorAll('.checklist input[type=checkbox]').forEach((cb,i)=>{\n  const key = 'chk_'+i;\n  if(sessionStorage.getItem(key)==='1') cb.checked=true;\n  cb.addEventListener('change',()=>sessionStorage.setItem(key, cb.checked?'1':'0'));\n});"
new = "document.querySelectorAll('.checklist input[type=checkbox]').forEach((cb,i)=>{const key='chk_'+i;try{if(sessionStorage.getItem(key)==='1')cb.checked=true;cb.addEventListener('change',()=>{try{sessionStorage.setItem(key,cb.checked?'1':'0')}catch(e){}})}catch(e){}});"
html = html.replace(old, new, 1)
assert html.count('<section') >= 20 and html.count('<svg') >= 30
lesson.write_text(html, encoding='utf-8')
print('Updated', lesson, len(html))
