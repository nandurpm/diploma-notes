#!/usr/bin/env python3
import json,re,time
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urljoin,parse_qs,urlparse
import requests
from bs4 import BeautifulSoup

BASE='https://www.sitttrkerala.ac.in/'
LANDING=urljoin(BASE,'index.php?r=site%2Fdiploma-syllabus&scheme=REV2026')
OUT=Path('assets/data/revision-2026-subjects.json')
HEADERS={'User-Agent':'Mozilla/5.0 POLY-PMNA-REV2026-Sync/1.1'}
BAD_LABELS=re.compile(r'^(view|open|download|syllabus|course content|details?)$',re.I)
DURATION=re.compile(r'\b(months?|weeks?|hours?|hrs?|per semester|duration)\b',re.I)

def slug(v):
    v=v.lower().replace('&',' and ')
    return re.sub(r'(^-|-$)','',re.sub(r'[^a-z0-9]+','-',v))

def get(session,url,tries=4):
    last=None
    for i in range(tries):
        try:
            r=session.get(url,headers=HEADERS,timeout=40)
            if r.ok and len(r.text)>200:return r
            last=RuntimeError(f'{r.status_code} {url}')
        except Exception as e:last=e
        time.sleep(2**i)
    raise last

def clean_subject_name(rowtxt,code,link_text):
    link_text=(link_text or '').strip()
    if link_text and link_text!=code and not BAD_LABELS.fullmatch(link_text) and not DURATION.search(link_text):
        return link_text
    try: idx=next(i for i,x in enumerate(rowtxt) if x.strip()==code)
    except StopIteration: idx=-1
    ordered=(rowtxt[idx+1:]+rowtxt[:idx]) if idx>=0 else rowtxt
    for value in ordered:
        value=value.strip()
        if not value or value==code or BAD_LABELS.fullmatch(value) or DURATION.search(value): continue
        if re.fullmatch(r'[\d\s./-]+',value): continue
        return value
    return code

def main():
    s=requests.Session(); landing=get(s,LANDING)
    soup=BeautifulSoup(landing.text,'html.parser')
    programmes=[]
    for a in soup.select('a[href*="diploma-syllabus-courses"]'):
        name=a.get_text(' ',strip=True); href=urljoin(BASE,a.get('href',''))
        if name and href: programmes.append((name,href))
    subjects=[]; failures=[]
    for name,url in programmes:
        try:
            page=get(s,url); ps=BeautifulSoup(page.text,'html.parser')
            found=0
            for row in ps.select('tr'):
                cells=row.find_all(['td','th'])
                link=row.select_one('a[href*="diploma-syllabus-course-contents"],a[href*="course="]')
                if not link: continue
                href=urljoin(BASE,link.get('href',''))
                q=parse_qs(urlparse(href).query)
                code=(q.get('course') or [''])[0].strip()
                rowtxt=[c.get_text(' ',strip=True) for c in cells]
                if not code:
                    m=re.search(r'\b\d{3,5}[A-Z]?\b',' '.join(rowtxt)); code=m.group(0) if m else ''
                if not code: continue
                subj=clean_subject_name(rowtxt,code,link.get_text(' ',strip=True))
                semester=next((x for x in rowtxt if re.search(r'\bsemester\s*[1-6]\b',x,re.I)), '')
                if not semester:
                    n=next((re.search(r'\b[1-6]\b',x) for x in rowtxt if re.fullmatch(r'\s*[1-6]\s*',x)),None)
                    semester=f'Semester {n.group(0).strip()}' if n else ''
                subjects.append({'revision':'2026','scheme':'REV2026','programme':name,'programmeSlug':slug(name),'semester':semester,'code':code,'name':subj,'type':'Course','syllabusUrl':href})
                found+=1
            if not found: failures.append({'programme':name,'url':url,'reason':'No subject rows found'})
        except Exception as e: failures.append({'programme':name,'url':url,'reason':str(e)})
    uniq={}
    for x in subjects: uniq[(x['programmeSlug'],x['code'],x['name'])]=x
    payload={'scheme':'REV2026','source':LANDING,'generatedAt':datetime.now(timezone.utc).isoformat(),'programmeCount':len(programmes),'subjectCount':len(uniq),'failures':failures,'subjects':sorted(uniq.values(),key=lambda x:(x['programme'],x['semester'],x['code']))}
    if not uniq and OUT.exists():
        old=json.loads(OUT.read_text()); old['lastSyncAttempt']=payload['generatedAt']; old['failures']=failures; payload=old
    OUT.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
    print(f"programmes={len(programmes)} subjects={len(uniq)} failures={len(failures)}")
if __name__=='__main__': main()
