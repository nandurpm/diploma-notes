#!/usr/bin/env python3
import json, re, shutil, subprocess, sys, time
from pathlib import Path
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[1]
REPORT=ROOT/'reports/site-integrity-audit.json'
data=json.loads(REPORT.read_text(encoding='utf-8'))
audit=data.get('runtime_console_audit',{})
pages=audit.get('pages',[])
targets=[p['url'] for p in pages if p.get('errors')==['Chrome audit timed out']]
browser=next((shutil.which(x) for x in ('google-chrome','google-chrome-stable','chromium','chromium-browser') if shutil.which(x)),None)
if not browser: raise SystemExit('Chrome is unavailable')
server=subprocess.Popen([sys.executable,'-m','http.server','8766','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
replacements={}
try:
    for public in targets:
        route=urlparse(public).path or '/'
        cmd=[browser,'--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--disable-sync','--no-first-run','--enable-logging=stderr','--log-level=0','--virtual-time-budget=5000','--dump-dom',f'http://127.0.0.1:8766{route}']
        try:
            run=subprocess.run(cmd,cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,text=True,timeout=60)
            errors=[]
            for raw in run.stderr.splitlines():
                if re.search(r'INFO:CONSOLE|Uncaught|TypeError|ReferenceError|SyntaxError|RangeError|SEVERE',raw,re.I) and not re.search(r'favicon|Failed to load resource|ERR_|CORS|Content Security Policy',raw,re.I):
                    errors.append(raw.strip()[-600:])
            replacements[public]=sorted(set(errors))
        except subprocess.TimeoutExpired:
            replacements[public]=['Chrome audit timed out after retry']
finally:
    server.terminate()

for page in pages:
    if page['url'] in replacements: page['errors']=replacements[page['url']]
failing=[p for p in pages if p.get('errors')]
audit['pages_with_errors']=len(failing)
audit['retry_pages_checked']=len(targets)
data['runtime_console_audit']=audit
REPORT.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
md=ROOT/'reports/site-integrity-audit.md'
text=md.read_text(encoding='utf-8')+'\n## Chrome timeout retry\n\n'+f'- Pages retried: **{len(targets)}**\n- Remaining pages with detected errors or timeouts: **{len(failing)}**\n'
md.write_text(text,encoding='utf-8')
raise SystemExit(1 if failing else 0)
