#!/usr/bin/env python3
"""One-time focused repair for the REV2026 Course 2003A handbook UI."""
from __future__ import annotations

import re
from pathlib import Path

TARGET = Path("revision-2026-content/lessons/lessons-2003A.html")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if new in text:
        return text
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def regex_once(text: str, pattern: str, replacement: str, label: str) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f"{label}: expected one regex match, found {count}")
    return updated


def main() -> int:
    text = TARGET.read_text(encoding="utf-8")
    original = text

    text = replace_once(
        text,
        ".top-select{max-width:210px}",
        ".top-select{width:min(210px,18vw);max-width:210px;color-scheme:light;cursor:pointer;font-weight:650}"
        ".top-select option,.top-select optgroup{color:#172033;background:#fff}"
        ".top-select:focus{outline:3px solid rgba(34,211,238,.48);outline-offset:2px}"
        ".sidebar{overscroll-behavior:contain;scrollbar-gutter:stable}",
        "top selector visibility CSS",
    )

    text = replace_once(
        text,
        "@media(max-width:1100px){.shell{grid-template-columns:1fr}",
        "@media(max-width:1380px) and (min-width:1101px){.brand{min-width:195px}.top-select{width:175px;max-width:175px}.top-actions .text-action{display:none}}"
        "@media(max-width:1100px){.shell{grid-template-columns:1fr}",
        "desktop header compression",
    )

    navigation = r'''function setupNavigation(){
const chapters=[...document.querySelectorAll('.chapter')],ms=document.getElementById('moduleSelect'),cs=document.getElementById('chapterSelect'),side=document.getElementById('sidebar'),menu=document.getElementById('menuBtn');
const roman=['I','II','III','IV'];
MODULES.forEach(m=>ms.add(new Option(`Module ${roman[m.id-1]}: ${m.title}`,`module-${m.id}`)));
MODULES.forEach(m=>{const group=document.createElement('optgroup');group.label=`Module ${roman[m.id-1]}: ${m.title}`;chapters.filter(c=>Number(c.dataset.module)===m.id).forEach(c=>{const label=c.querySelector('summary span:first-child')?.textContent.trim()||c.querySelector('summary')?.textContent.trim()||c.id;group.append(new Option(label,c.id))});cs.append(group)});
function closeSidebar(){if(innerWidth>1100)return;side?.classList.remove('open');menu?.setAttribute('aria-expanded','false')}
function syncSelectors(id){const el=document.getElementById(id);if(!el)return;const module=el.matches('.module-panel')?el:el.closest('.module-panel');if(module)ms.value=module.id;cs.value=el.matches('.chapter')?el.id:''}
function go(id,{behavior}={}){if(!id)return;const el=document.getElementById(id);if(!el)return;if(el.matches('details'))el.open=true;syncSelectors(id);el.scrollIntoView({behavior:behavior||(document.body.classList.contains('reduced')?'auto':'smooth'),block:'start'});el.classList.add('focus-target');setTimeout(()=>el.classList.remove('focus-target'),1200);const u=new URL(location.href);u.hash=id;history.replaceState(null,'',u);closeSidebar()}
ms.addEventListener('change',()=>go(ms.value));cs.addEventListener('change',()=>go(cs.value));
document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g)go(g.dataset.go)});
function currentChapterIndex(){const anchor=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--top'))+28;let index=0;chapters.forEach((chapter,i)=>{if(chapter.getBoundingClientRect().top<=anchor)index=i});return index}
function move(delta){if(!chapters.length)return;const index=Math.max(0,Math.min(chapters.length-1,currentChapterIndex()+delta));go(chapters[index].id)}
document.getElementById('prevChapter').onclick=()=>move(-1);document.getElementById('nextChapter').onclick=()=>move(1);
document.getElementById('expandAll').onclick=()=>document.querySelectorAll('details').forEach(d=>d.open=true);document.getElementById('collapseAll').onclick=()=>document.querySelectorAll('details.chapter').forEach(d=>d.open=false);document.querySelectorAll('[data-view-set]').forEach(b=>b.onclick=()=>document.body.dataset.view=b.dataset.viewSet);
let ticking=false;addEventListener('scroll',()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{const chapter=chapters[currentChapterIndex()];if(chapter)syncSelectors(chapter.id);ticking=false})},{passive:true});
const initial=decodeURIComponent(location.hash.slice(1));if(initial&&document.getElementById(initial))requestAnimationFrame(()=>go(initial,{behavior:'auto'}))
}'''
    text = regex_once(
        text,
        r"function setupNavigation\(\)\{.*?\}\nfunction setupSearch\(\)",
        navigation + "\nfunction setupSearch()",
        "navigation repair",
    )

    render_calcs = r'''function renderCalcs(){const root=document.getElementById('calcRoot');CALCS.forEach(c=>{root.insertAdjacentHTML('beforeend',`<article class="calculator" data-calc="${c[2]}"><h3>${c[0]}</h3>${c[1].map(x=>`<label>${x[1]}<input type="number" step="${c[2]==='atomic'?'1':'any'}" min="${c[2]==='atomic'?'0':'0.000000000001'}" inputmode="decimal" data-key="${x[0]}" required></label>`).join('')}<div class="calc-actions"><button type="button" class="btn primary" data-solve>Calculate</button><button type="button" class="btn ghost" data-reset>Reset</button></div><div class="calc-output" aria-live="polite">Enter the values and select Calculate.</div></article>`)});root.addEventListener('click',e=>{const box=e.target.closest('.calculator');if(!box)return;if(e.target.matches('[data-reset]')){box.querySelectorAll('input').forEach(x=>x.value='');box.querySelector('.calc-output').textContent='Enter the values and select Calculate.'}if(e.target.matches('[data-solve]'))solveCalc(box)});root.addEventListener('keydown',e=>{if(e.key!=='Enter')return;const box=e.target.closest('.calculator');if(!box)return;e.preventDefault();solveCalc(box)})}'''
    text = regex_once(
        text,
        r"function renderCalcs\(\)\{.*?\}\nfunction solveCalc",
        render_calcs + "\nfunction solveCalc",
        "calculator renderer repair",
    )

    text = replace_once(
        text,
        "if(type==='atomic'){if(v.Z<0||v.A<v.Z)throw 0;",
        "if(type==='atomic'){if(!Number.isInteger(v.Z)||!Number.isInteger(v.A)||v.Z<0||v.A<v.Z)throw 0;",
        "atomic number validation",
    )
    text = replace_once(
        text,
        "let r,formula,sub;try{",
        "let r,formula,sub;const units={atomic:'',molarity:' mol L⁻¹',mass:' g',normality:' N',ppm:' ppm',dilution:' (same volume unit as V₁)',titration:' N',ph:'',poh:'',hion:' mol L⁻¹',charge:' C',etime:' s',deposit:' g'};try{",
        "calculator units map",
    )
    text = replace_once(
        text,
        "if((typeof r==='number'&&!Number.isFinite(r))||Object.values(v).some(x=>x===0))throw 0;",
        "if((typeof r==='number'&&!Number.isFinite(r))||(type==='atomic'?Object.values(v).some(x=>x<0):Object.values(v).some(x=>x<=0)))throw 0;",
        "calculator physical-value validation",
    )
    text = replace_once(
        text,
        "<strong>Result:</strong> ${typeof r==='number'?Number(r.toPrecision(6)):r}",
        "<strong>Result:</strong> ${typeof r==='number'?Number(r.toPrecision(6)):r}${units[type]||''}",
        "calculator result units",
    )

    setup_ui = r'''function setupUI(){const side=document.getElementById('sidebar'),menu=document.getElementById('menuBtn');const store={get:k=>{try{return localStorage.getItem(k)}catch{return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch{}}};const closeSide=()=>{side.classList.remove('open');menu.setAttribute('aria-expanded','false')};menu.onclick=()=>{const o=side.classList.toggle('open');menu.setAttribute('aria-expanded',String(o))};document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSide()});document.addEventListener('click',e=>{if(innerWidth<=1100&&side.classList.contains('open')&&!side.contains(e.target)&&!menu.contains(e.target))closeSide()});addEventListener('resize',()=>{if(innerWidth>1100)closeSide()},{passive:true});document.getElementById('themeBtn').onclick=()=>{document.body.classList.toggle('dark');store.set('chem-theme',document.body.classList.contains('dark')?'dark':'light')};document.getElementById('motionBtn').onclick=()=>{document.body.classList.toggle('reduced');store.set('chem-motion',document.body.classList.contains('reduced')?'reduced':'normal')};if(store.get('chem-theme')==='dark')document.body.classList.add('dark');if(store.get('chem-motion')==='reduced'||matchMedia('(prefers-reduced-motion: reduce)').matches)document.body.classList.add('reduced');document.querySelectorAll('[data-print],#printBtn').forEach(b=>b.onclick=()=>{const original=document.title;preparePrint();addEventListener('afterprint',()=>{document.title=original},{once:true});setTimeout(()=>print(),250)});document.querySelectorAll('[data-download]').forEach(b=>b.onclick=downloadNotes);const updateProgress=()=>{const h=document.documentElement.scrollHeight-innerHeight;document.getElementById('readProgress').style.width=(h>0?scrollY/h*100:0)+'%'};addEventListener('scroll',updateProgress,{passive:true});updateProgress()}'''
    text = regex_once(
        text,
        r"function setupUI\(\)\{.*?\}\nfunction autoPrint\(\)",
        setup_ui + "\nfunction autoPrint()",
        "responsive sidebar and print repair",
    )

    if text == original:
        print("Course 2003A handbook already contains the repair.")
        return 0

    TARGET.write_text(text, encoding="utf-8")
    print("Repaired Course 2003A handbook navigation, selectors, sidebar and calculators.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
