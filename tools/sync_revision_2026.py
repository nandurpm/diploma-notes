#!/usr/bin/env python3
import json,re,sys,time
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import parse_qs,urljoin,urlparse
import requests
from bs4 import BeautifulSoup

BASE='https://www.sitttrkerala.ac.in/'
INDEX='https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus&scheme=REV2026'
PROGRAMMES=[
('AR','Architecture','architecture'),('AI','Artificial Intelligence','artificial-intelligence'),('AM','Artificial Intelligence & Machine Learning','artificial-intelligence-and-machine-learning'),('RA','Automation and Robotics','automation-and-robotics'),('AU','Automobile Engineering','automobile-engineering'),('BM','Biomedical Engineering','biomedical-engineering'),('CH','Chemical Engineering','chemical-engineering'),('CV','Civil & Environmental Engineering','civil-and-environmental-engineering'),('CR','Civil & Rural Engineering','civil-and-rural-engineering'),('CE','Civil Engineering','civil-engineering'),('CL','Civil Engineering & Planning','civil-engineering-and-planning'),('CP','Commercial Practice','commercial-practice'),('CB','Computer Application & Business Management','computer-application-and-business-management'),('CT','Computer Engineering','computer-engineering'),('CS','Computer Science & Engineering','computer-science-and-engineering'),('CG','Computer Science and Technology','computer-science-and-technology'),('CF','Cyber Forensics and Information Security','cyber-forensics-and-information-security'),('EE','Electrical & Electronics Engineering','electrical-and-electronics-engineering'),('EG','Electrical Engineering','electrical-engineering'),('EV','Electrical Engineering & Electric Vehicles Technology','electrical-engineering-and-electric-vehicles-technology'),('EC','Electronics and Communication','electronics-and-communication'),('ET','Electronics and Computer Engineering','electronics-and-computer-engineering'),('EL','Electronics Engineering','electronics-engineering'),('FS','Fire Technology and Safety','fire-technology-and-safety'),('FT','Food Processing Technology','food-processing-technology'),('IF','Information Technology','information-technology'),('IE','Instrumentation Engineering','instrumentation-engineering'),('IC','Integrated Circuit Design & Fabrication','integrated-circuit-design-and-fabrication'),('ID','Interior Design','interior-design'),('ME','Mechanical Engineering','mechanical-engineering'),('MC','Mechatronics','mechatronics'),('MI','Micro Electronics','micro-electronics'),('PL','Polymer Technology','polymer-technology'),('PT','Printing Technology','printing-technology'),('RP','Robotic Process Automation','robotic-process-automation'),('TT','Textile Technology','textile-technology'),('TD','Tool & Die Engineering','tool-and-die-engineering'),('WP','Wood and Paper Technology','wood-and-paper-technology')]
BAD=re.compile(r'^(view|open|download|syllabus|course content|details?|click here|course|subject|code|semester|sl\.?\s*no\.?)$',re.I)
CODE=re.compile(r'\b([1-6]\d{2,4}[A-Z]?)\b',re.I)
TYPES={'lab':'Lab','laboratory':'Lab','workshop':'Workshop','drawing':'Drawing','project':'Project','seminar':'Seminar','internship':'Internship','practical':'Practical','theory':'Theory','elective':'Elective'}

def purl(code):return BASE+'index.php?r=site/diploma-syllabus-courses&prog='+code

def get(session,url):
    last=None
    for attempt in range(5):
        try:
            r=session.get(url,headers={'User-Agent':'Mozilla/5.0 POLY-PMNA-REV2026-Sync/3.0'},timeout=50)
            if r.ok and len(r.text)>500:return r
            last=RuntimeError('HTTP %s, %s bytes, final=%s'%(r.status_code,len(r.text),r.url))
        except Exception as exc:last=exc
        time.sleep(min(16,2**attempt))
    raise last

def subject_name(row,code,link):
    text=' '.join(link.stripped_strings).strip()
    if text and text.upper()!=code and not BAD.fullmatch(text):return text
    values=[' '.join(cell.stripped_strings).strip() for cell in row.find_all(['td','th'])]
    values=[v for v in values if v and v.upper()!=code and not BAD.fullmatch(v) and not re.fullmatch(r'[\d\s./():-]+',v)]
    values=[v for v in values if v.lower() not in TYPES]
    return max(values,key=len) if values else code

def subject_type(name,row):
    text=(name+' '+row.get_text(' ',strip=True)).lower()
    for token,label in TYPES.items():
        if re.search(r'\b'+re.escape(token)+r'\b',text):return label
    return 'Course'

def parse_programme(session,programme_code,name,slug):
    soup=BeautifulSoup(get(session,purl(programme_code)).text,'html.parser')
    rows=[];seen=set()
    for tr in soup.select('tr'):
        link=tr.select_one('a[href*="diploma-syllabus-course-contents"],a[href*="course="]')
        if not link:continue
        href=urljoin(BASE,link.get('href',''));query=parse_qs(urlparse(href).query)
        code=(query.get('course') or [''])[0].strip().upper()
        if not code:
            match=CODE.search(tr.get_text(' ',strip=True));code=match.group(1).upper() if match else ''
        if not code or code[0] not in '123456':continue
        title=subject_name(tr,code,link);key=(code,title.casefold())
        if key in seen:continue
        seen.add(key)
        rows.append({'revision':'2026','scheme':'REV2026','programme':name,'programmeCode':programme_code,'programmeSlug':slug,'programmeUrl':purl(programme_code),'semester':'Semester '+code[0],'semesterSource':'course-code','code':code,'name':title,'type':subject_type(title,tr),'syllabusUrl':href})
    if len(rows)<10:raise RuntimeError('only %s subject rows found'%len(rows))
    return sorted(rows,key=lambda x:(int(x['semester'][-1]),x['code'],x['name'].casefold()))

def main():
    registry={'scheme':'REV2026','source':INDEX,'lastVerified':datetime.now(timezone.utc).date().isoformat(),'programmeCount':38,'programmes':[{'order':i+1,'officialCode':code,'name':name,'slug':slug,'officialUrl':purl(code)} for i,(code,name,slug) in enumerate(PROGRAMMES)]}
    session=requests.Session();subjects=[];failures=[];counts={}
    for code,name,slug in PROGRAMMES:
        try:
            rows=parse_programme(session,code,name,slug);subjects.extend(rows);counts[slug]=len(rows);print(code,name,len(rows),flush=True)
        except Exception as exc:failures.append({'code':code,'programme':name,'url':purl(code),'reason':str(exc)})
    if failures:
        print(json.dumps(failures,indent=2),file=sys.stderr);return 1
    Path('assets/data').mkdir(parents=True,exist_ok=True)
    Path('assets/data/revision-2026-programmes.json').write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    payload={'scheme':'REV2026','source':INDEX,'sourceMethod':'38 exact official programme URLs','generatedAt':datetime.now(timezone.utc).isoformat(),'programmeCount':38,'subjectCount':len(subjects),'programmeSubjectCounts':counts,'failures':[],'subjects':subjects}
    Path('assets/data/revision-2026-subjects.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('programmes=38 subjects=%s failures=0'%len(subjects));return 0
if __name__=='__main__':raise SystemExit(main())
