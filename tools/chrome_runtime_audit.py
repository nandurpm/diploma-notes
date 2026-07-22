# Purpose: Chrome runtime audit - Descriptive comment added for clarity
#!/usr/bin/env python3
import json, re, shutil, subprocess, sys, time
from pathlib import Path
from urllib.parse import urlparse
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
PORT = 8765
browser = next((shutil.which(x) for x in ('google-chrome','google-chrome-stable','chromium','chromium-browser') if shutil.which(x)), None)
if not browser:
    raise SystemExit('Chrome or Chromium is not installed')

ns = {'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls = [(n.text or '').strip() for n in ET.parse(ROOT/'sitemap.xml').findall('s:url/s:loc', ns)]
server = subprocess.Popen([sys.executable,'-m','http.server',str(PORT),'--bind','127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
results=[]
try:
    for public in urls:
        p=urlparse(public)
        local=f'http://127.0.0.1:{PORT}{p.path or "/"}'
        cmd=[browser,'--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--enable-logging=stderr','--log-level=0','--virtual-time-budget=1800','--dump-dom',local]
        try:
            run=subprocess.run(cmd,cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,text=True,timeout=20)
            lines=[]
            for raw in run.stderr.splitlines():
                if re.search(r'INFO:CONSOLE|Uncaught|TypeError|ReferenceError|SyntaxError|RangeError|SEVERE',raw,re.I) and not re.search(r'favicon|Failed to load resource|ERR_|CORS|Content Security Policy',raw,re.I):
                    lines.append(raw.strip()[-600:])
            errors=sorted(set(lines))
            if run.returncode and not errors: errors=[f'Chrome exited with status {run.returncode}']
        except subprocess.TimeoutExpired:
            errors=['Chrome audit timed out']
        results.append({'url':public,'errors':errors})
        print(public, len(errors))
finally:
    server.terminate()

report=ROOT/'reports/site-integrity-audit.json'
data=json.loads(report.read_text(encoding='utf-8'))
failing=[x for x in results if x['errors']]
data['runtime_console_audit']={'browser':Path(browser).name,'pages_checked':len(results),'pages_with_errors':len(failing),'pages':results}
report.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
md=ROOT/'reports/site-integrity-audit.md'
text=md.read_text(encoding='utf-8')+'\n## Chrome runtime audit\n\n'+f'- Pages checked: **{len(results)}**\n- Pages with detected application errors: **{len(failing)}**\n'
for item in failing:
    text+=f"\n### {item['url']}\n"+''.join(f"- `{e}`\n" for e in item['errors'])
md.write_text(text,encoding='utf-8')
raise SystemExit(1 if failing else 0)
