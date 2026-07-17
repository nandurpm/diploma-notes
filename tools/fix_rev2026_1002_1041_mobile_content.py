#!/usr/bin/env python3
"""Focused mobile/content repair for REV2026 Courses 1002 and 1041."""
from pathlib import Path

MATH = Path("revision-2026-content/lessons/lessons-1002.html")
ELEC = Path("revision-2026-content/lessons/lessons-1041.html")

math = MATH.read_text(encoding="utf-8")
elec = ELEC.read_text(encoding="utf-8")

for text, code in ((math, "1002"), (elec, "1041")):
    if f'content="{code}"' not in text or "REV2026" not in text:
        raise SystemExit(f"Course identity guard failed for {code}")

MATH_MARK = "1002-mobile-content-only-v2"
if MATH_MARK not in math:
    math_css = r'''
/* 1002-mobile-content-only-v2: APK/mobile already supplies header and sidebar. */
@media(max-width:840px){
 :root{--top:0px;--sidebar:0px}
 html{scroll-padding-top:12px}
 .topbar,.sidebar,.nav-arrows,.mobile-menu,.menu-button{display:none!important;visibility:hidden!important}
 .shell{display:block!important;grid-template-columns:1fr!important;width:100%!important;max-width:none!important;margin:0!important;padding:10px 8px 28px!important}
 main{width:100%!important;max-width:none!important;margin:0!important;padding:0!important}
 .cover{min-height:auto!important;margin-top:0!important;padding:22px 18px!important;grid-template-columns:1fr!important;gap:18px!important}
 .cover .actions a[href="/revision-2026.html"],.cover .actions a[href="../revision-2026.html"]{display:none!important}
 .cover-card{padding:16px!important}
}
html.polytechnic-native-app{--top:0px;--sidebar:0px;scroll-padding-top:12px}
html.polytechnic-native-app .topbar,
html.polytechnic-native-app .sidebar,
html.polytechnic-native-app .nav-arrows,
html.polytechnic-native-app .mobile-menu,
html.polytechnic-native-app .menu-button{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;max-height:0!important;padding:0!important;margin:0!important;overflow:hidden!important}
html.polytechnic-native-app .shell{display:block!important;grid-template-columns:1fr!important;width:100%!important;max-width:none!important;margin:0!important;padding:8px 8px 28px!important}
html.polytechnic-native-app main{width:100%!important;max-width:none!important;margin:0!important;padding:0!important}
html.polytechnic-native-app .cover{min-height:auto!important;margin-top:0!important}
html.polytechnic-native-app .cover .actions a[href="/revision-2026.html"],html.polytechnic-native-app .cover .actions a[href="../revision-2026.html"]{display:none!important}
'''
    math = math.replace("</style>", math_css + "\n</style>", 1)

ELEC_MARK = "1041-bilingual-visual-upgrade-v2"
if ELEC_MARK not in elec:
    elec_css = r'''
/* 1041-bilingual-visual-upgrade-v2 */
.ml-note{font-family:"Noto Sans Malayalam","Nirmala UI","Manjari",system-ui,sans-serif;margin:12px 0 0;padding:12px 14px;border:1px solid #b9d9ef;border-left:5px solid var(--cyan);border-radius:11px;background:linear-gradient(135deg,#eef9ff,#f4fffb);color:#14324c;line-height:1.78}
html[data-theme="dark"] .ml-note{background:#10243a;color:#dceeff;border-color:#315b79}
.concept-viz{display:block;width:100%;height:100%;min-height:190px;background:linear-gradient(180deg,#f8fcff,#eef7ff);border-radius:12px}
html[data-theme="dark"] .concept-viz{background:#07192e}
.animation-card .anim-stage{height:220px;padding:8px;background:linear-gradient(180deg,var(--surface),var(--surface2))}
.animation-card .anim-static,.animation-card .anim-track,.animation-card .anim-particle{display:none!important}
.animation-card .anim-controls [data-anim-action="reset"],.animation-card .anim-controls label{display:none!important}
.animation-card .anim-controls{justify-content:flex-start}
.cover{min-height:auto!important}.cover-inner{min-height:560px!important}
@media(max-width:840px){
 :root{--header-h:0px}
 html{scroll-padding-top:10px}
 .lesson-header,.chapter-nav,.module-tabs,.control-deck,.nav-arrows,.native-handbook-menu{display:none!important;visibility:hidden!important}
 .lesson-shell{display:block!important;grid-template-columns:1fr!important;padding:8px 8px 28px!important}
 .content{width:100%!important;max-width:none!important;margin:0!important;padding:0!important}
 .cover{min-height:auto!important;margin:0 0 14px!important;padding:20px 16px!important;border-radius:16px!important}
 .cover-inner{grid-template-columns:1fr!important;min-height:0!important;padding:18px 0!important;gap:16px!important}
 .cover h1{font-size:clamp(2rem,10vw,3.35rem)!important;margin:.28em 0!important}
 .cover .subtitle{font-size:1rem!important;line-height:1.55!important}
 .cover-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;margin-top:16px!important}
 .cover-actions button,.cover-actions a{width:100%!important;padding:10px!important}
 .cover-card{margin:0!important;padding:16px!important;border-radius:16px!important}
 .cover-card ol{padding-left:1.3rem!important;margin:.5rem 0!important}
 .cover-card dl{grid-template-columns:1fr 1fr!important;gap:9px!important}
 .hb-section,.content-section,.module-panel{padding:16px!important;margin-bottom:14px!important}
 .animation-grid{grid-template-columns:1fr!important}
 .animation-card .anim-stage{height:200px!important}
}
html.polytechnic-native-app .lesson-header,
html.polytechnic-native-app .chapter-nav,
html.polytechnic-native-app .module-tabs,
html.polytechnic-native-app .control-deck,
html.polytechnic-native-app .nav-arrows,
html.polytechnic-native-app .native-handbook-menu{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;max-height:0!important;padding:0!important;margin:0!important;overflow:hidden!important}
html.polytechnic-native-app .lesson-shell{display:block!important;grid-template-columns:1fr!important;padding:8px 8px 28px!important}
html.polytechnic-native-app .content{width:100%!important;max-width:none!important;margin:0!important;padding:0!important}
@media print{.ml-note{border:1px solid #777!important;background:#fff!important;color:#111!important}.concept-viz *{animation:none!important}}
'''
    elec = elec.replace("</style>", elec_css + "\n</style>", 1)

    enhancement_js = r'''
<script id="1041-bilingual-visual-upgrade-v2">
(() => {
  const ml = title => {
    const t = String(title || "").toLowerCase();
    if (/charge/.test(t)) return "Electric charge എന്നത് വസ്തുവിന്റെ അടിസ്ഥാന electrical property ആണ്. Charge ഒഴുകുന്ന നിരക്കാണ് Current; അതിനാൽ Q, I, t എന്നീ quantities തമ്മിലുള്ള ബന്ധം ശ്രദ്ധിക്കുക.";
    if (/current/.test(t)) return "Current എന്നത് charge flow rate ആണ്. Ammeter എപ്പോഴും circuit-ൽ series ആയി connect ചെയ്യണം; source-ന് across ആയി connect ചെയ്യരുത്.";
    if (/voltage|potential/.test(t)) return "Voltage രണ്ട് points തമ്മിലുള്ള potential difference ആണ്. Voltmeter parallel ആയി connect ചെയ്യുകയും reference point വ്യക്തമാക്കുകയും വേണം.";
    if (/resistance|resistor/.test(t)) return "Resistance current flow-നെ oppose ചെയ്യുന്നു. Value, tolerance, power rating എന്നിവ ഒരുമിച്ച് പരിശോധിച്ചാണ് resistor തിരഞ്ഞെടുക്കേണ്ടത്.";
    if (/power|energy/.test(t)) return "Power energy conversion rate ആണ്; Energy = Power × Time. W, Wh, kWh, J എന്നീ units തമ്മിൽ mix ചെയ്യാതെ conversion ചെയ്യുക.";
    if (/ac|alternating|sinus|frequency|period|amplitude|phase/.test(t)) return "AC signal സമയം അനുസരിച്ച് magnitude-വും direction-വും മാറുന്നു. Frequency, Period, Amplitude, Phase എന്നിവ waveform വായിക്കാൻ ഉപയോഗിക്കുന്ന പ്രധാന terms ആണ്.";
    if (/dc|direct/.test(t)) return "DC-യ്ക്ക് fixed polarity/direction ഉണ്ട്. Practical DC supply-ൽ ripple അല്ലെങ്കിൽ noise ഉണ്ടാകാം; meter-ന്റെ DC mode തിരഞ്ഞെടുക്കുക.";
    if (/analog/.test(t)) return "Analog signal continuous values സ്വീകരിക്കുന്നു. Noise, offset, loading എന്നിവ measurement-നെ ബാധിക്കാം.";
    if (/digital|logic|binary/.test(t)) return "Digital signal discrete LOW/HIGH ranges ഉപയോഗിക്കുന്നു. Logic HIGH എന്നത് എല്ലാ circuits-ലും ഒരേ voltage അല്ല; logic family അനുസരിച്ച് range മാറും.";
    if (/instrument|multimeter|oscilloscope|dso|generator|measurement/.test(t)) return "Measurement ചെയ്യുന്നതിന് മുമ്പ് function, range, terminals, probe reference, expected value എന്നിവ verify ചെയ്യുക. Display കാണുന്നതു മാത്രം ശരിയായ measurement ഉറപ്പാക്കില്ല.";
    if (/capacitor|capacitance|rc |time constant/.test(t)) return "Capacitor charge store ചെയ്യുന്നു. Charging/Discharging speed-നെ RC Time Constant നിയന്ത്രിക്കുന്നു; electrolytic capacitor-ന്റെ polarityയും voltage rating-വും നിർബന്ധമായി പാലിക്കുക.";
    if (/inductor|inductance/.test(t)) return "Inductor current change-നെ oppose ചെയ്ത് magnetic field-ൽ energy store ചെയ്യുന്നു. Sudden current interruption voltage spike ഉണ്ടാക്കാം.";
    if (/transformer|magnetic flux/.test(t)) return "Transformer changing magnetic flux ഉപയോഗിച്ചാണ് voltage transfer ചെയ്യുന്നത്. Steady DC transformer action നൽകില്ല; turns ratio ശ്രദ്ധിക്കുക.";
    if (/series/.test(t)) return "Series circuit-ൽ ഒരേ Current എല്ലാ components-ലൂടെയും ഒഴുകുന്നു. Resistances add ചെയ്യും; ഒരു open connection മുഴുവൻ path തടയും.";
    if (/parallel/.test(t)) return "Parallel branches-ൽ Voltage common ആണ്. Total current branch currents-ന്റെ sum ആണ്; equivalent resistance ഏറ്റവും ചെറിയ branch resistance-നെക്കാൾ കുറവായിരിക്കും.";
    if (/divider/.test(t)) return "Voltage Divider output resistor ratio അനുസരിച്ചാണ്. Load connect ചെയ്താൽ output മാറാം; loading effect പരിഗണിക്കുക.";
    if (/semiconductor|band theory|doping|intrinsic|extrinsic|carrier|electron|hole/.test(t)) return "Semiconductor conductivity doping, temperature, electrons, holes എന്നിവയിൽ ആശ്രയിക്കുന്നു. Mobile carriers-ഉം fixed dopant ions-ഉം വേർതിരിച്ച് മനസ്സിലാക്കുക.";
    if (/pn|junction|depletion/.test(t)) return "PN Junction രൂപപ്പെടുമ്പോൾ Depletion Regionയും Barrier Potentialയും ഉണ്ടാകും. Bias അനുസരിച്ച് barrier width മാറുന്നു.";
    if (/forward bias|diode/.test(t)) return "Diode പ്രധാനമായും one-direction conduction നൽകുന്നു. Forward Bias barrier കുറയ്ക്കുന്നു; current limiting resistor ആവശ്യമാണ്.";
    if (/reverse bias|zener/.test(t)) return "Reverse Bias depletion region വർധിപ്പിക്കുന്നു. Zener diode controlled breakdown region-ൽ voltage regulation-യ്ക്ക് ഉപയോഗിക്കാം; current limit നിർബന്ധമാണ്.";
    if (/led/.test(t)) return "LED forward current ലഭിക്കുമ്പോൾ light emit ചെയ്യുന്നു. Polarity, forward voltage, current-limiting resistor എന്നിവ പരിശോധിക്കുക.";
    if (/photodiode|photo/.test(t)) return "Photodiode incident light-നെ electrical current ആയി convert ചെയ്യുന്നു. സാധാരണ reverse-bias operation-ൽ sensitivity മെച്ചപ്പെടും.";
    if (/pcb|track|pad|via|layout|fabrication/.test(t)) return "PCB-യിലെ Track current path ആണ്; Pad component connection ആണ്; Via layers തമ്മിൽ connection നൽകുന്നു. Layout-ൽ current, noise, heat, clearance എന്നിവ പരിഗണിക്കുക.";
    if (/solder|flux|joint|desolder|wetting|iron|tip/.test(t)) return "Good solder joint lead-ലും pad-ലും ശരിയായി wet ചെയ്ത് smooth concave fillet ഉണ്ടാക്കണം. Excess heat, insufficient flux, movement എന്നിവ dry joint അല്ലെങ്കിൽ lifted pad ഉണ്ടാക്കാം.";
    if (/esd|electrostatic/.test(t)) return "ESD കണ്ണിൽ കാണാനാകാത്ത വിധം semiconductor devices damage ചെയ്യാം. Grounded mat, approved wrist strap, antistatic packaging എന്നിവ ഉപയോഗിക്കുക.";
    if (/application|electronics|system|communication|medical|automobile|consumer|renewable|computer/.test(t)) return "ഒരു electronic system-നെ Power Supply → Input/Sensor → Processing/Control → Output/Actuator എന്ന block flow ആയി കാണുക. Safetyയും signal path-ഉം ഒരുമിച്ച് പരിശോധിക്കുക.";
    return "ഈ concept പഠിക്കുമ്പോൾ Definition, Unit, Symbol, Working Principle, Circuit/Diagram, Application, Safety എന്നിവ തമ്മിൽ ബന്ധപ്പെടുത്തി മനസ്സിലാക്കുക.";
  };

  document.querySelectorAll('.topic-card[data-title]').forEach(card => {
    if (card.querySelector('.ml-note')) return;
    const note = document.createElement('aside');
    note.className = 'ml-note';
    note.innerHTML = `<strong>Malayalam explanation:</strong> ${ml(card.dataset.title)}`;
    card.append(note);
  });

  const staticMode = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduced-motion');
  const svg = (key, label) => {
    const common = `class="concept-viz" viewBox="0 0 640 220" role="img" aria-label="${label}"`;
    const motion = staticMode ? '' : ' repeatCount="indefinite"';
    if (key.includes('ac-waveform')) return `<svg ${common}><rect width="640" height="220" rx="18" fill="#f7fbff"/><path d="M40 110H610M80 25V195" stroke="#93a8bc" stroke-width="2"/><path id="wavePath" d="M80 110 C125 25 170 25 215 110 S305 195 350 110 S440 25 485 110 S575 195 610 110" fill="none" stroke="#0891b2" stroke-width="5"/><circle r="10" fill="#f59e0b"><animateMotion dur="3s"${motion} path="M80 110 C125 25 170 25 215 110 S305 195 350 110 S440 25 485 110 S575 195 610 110"/></circle><text x="86" y="42" fill="#14324c" font-size="18" font-weight="700">Amplitude</text><text x="515" y="205" fill="#14324c" font-size="18" font-weight="700">Time</text></svg>`;
    if (key.includes('current-flow')) return `<svg ${common}><rect width="640" height="220" rx="18" fill="#f7fbff"/><rect x="45" y="65" width="80" height="90" rx="12" fill="#2563eb"/><text x="67" y="118" fill="white" font-size="20" font-weight="800">DC</text><rect x="500" y="75" width="90" height="70" rx="12" fill="#f59e0b"/><text x="517" y="118" fill="#172033" font-size="18" font-weight="800">LOAD</text><path d="M125 90H500M545 145V180H85V155" fill="none" stroke="#12355c" stroke-width="5"/><circle r="9" fill="#00b8d9"><animateMotion dur="3.2s"${motion} path="M125 90H500M545 145V180H85V155"/></circle><circle r="9" fill="#7c3aed"><animateMotion begin="-1.6s" dur="3.2s"${motion} path="M125 90H500M545 145V180H85V155"/></circle><text x="210" y="68" fill="#14324c" font-size="17" font-weight="700">Conventional current</text></svg>`;
    if (key.includes('capacitor-charging')) return `<svg ${common}><rect width="640" height="220" rx="18" fill="#f7fbff"/><line x1="250" y1="45" x2="250" y2="175" stroke="#12355c" stroke-width="9"/><line x1="390" y1="45" x2="390" y2="175" stroke="#12355c" stroke-width="9"/><rect x="265" y="160" width="110" height="0" rx="8" fill="#00b8d9"><animate attributeName="y" values="160;55;160" dur="5s"${motion}/><animate attributeName="height" values="0;105;0" dur="5s"${motion}/></rect><text x="267" y="205" fill="#14324c" font-size="18" font-weight="700">Voltage rises toward supply</text><text x="120" y="70" fill="#2563eb" font-size="28">− − −</text><text x="430" y="70" fill="#c2413a" font-size="28">+ + +</text></svg>`;
    if (key.includes('capacitor-discharging')) return `<svg ${common}><rect width="640" height="220" rx="18" fill="#f7fbff"/><line x1="250" y1="45" x2="250" y2="175" stroke="#12355c" stroke-width="9"/><line x1="390" y1="45" x2="390" y2="175" stroke="#12355c" stroke-width="9"/><rect x="265" y="55" width="110" height="105" rx="8" fill="#7c3aed"><animate attributeName="y" values="55;160;55" dur="5s"${motion}/><animate attributeName="height" values="105;0;105" dur="5s"${motion}/></rect><text x="250" y="205" fill="#14324c" font-size="18" font-weight="700">Stored energy decreases</text></svg>`;
    if (key.includes('transformer')) return `<svg ${common}><rect width="640" height="220" rx="18" fill="#f7fbff"/><rect x="250" y="35" width="140" height="150" rx="14" fill="none" stroke="#64748b" stroke-width="14"/><path d="M160 55q55 20 0 40q55 20 0 40q55 20 0 40M480 55q-55 20 0 40q-55 20 0 40q-55 20 0 40" fill="none" stroke="#2563eb" stroke-width="6"/><path d="M285 55v110M320 55v110M355 55v110" stroke="#00b8d9" stroke-width="5" stroke-dasharray="12 10"><animate attributeName="stroke-dashoffset" values="0;-44" dur="1.4s"${motion}/></path><text x="82" y="205" fill="#14324c" font-size="18" font-weight="700">Primary</text><text x="488" y="205" fill="#14324c" font-size="18" font-weight="700">Secondary</text></svg>`;
    if (key.includes('pn-junction') || key.includes('forward-bias') || key.includes('reverse-bias')) { const reverse=key.includes('reverse'); const forward=key.includes('forward'); return `<svg ${common}><rect width="640" height="220" rx="18" fill="#f7fbff"/><rect x="85" y="45" width="220" height="130" rx="12" fill="#fee2e2"/><rect x="335" y="45" width="220" height="130" rx="12" fill="#dbeafe"/><text x="180" y="115" fill="#991b1b" font-size="34" font-weight="900">P</text><text x="430" y="115" fill="#1d4ed8" font-size="34" font-weight="900">N</text><rect x="${forward?'292':reverse?'270':'282'}" y="45" width="${forward?'56':reverse?'100':'76'}" height="130" fill="#cbd5e1" opacity=".9"><animate attributeName="width" values="${forward?'72;42;72':reverse?'76;118;76':'64;88;64'}" dur="3s"${motion}/></rect><circle cx="210" cy="80" r="8" fill="#ef4444"><animate attributeName="cx" values="210;360;210" dur="3.4s"${motion}/></circle><circle cx="445" cy="145" r="8" fill="#2563eb"><animate attributeName="cx" values="445;285;445" dur="3.4s"${motion}/></circle><text x="236" y="205" fill="#14324c" font-size="18" font-weight="700">Depletion region</text></svg>`; }
    if (key.includes('carrier') || key.includes('semiconductor')) return `<svg ${common}><rect width="640" height="220" rx="18" fill="#f7fbff"/><g fill="#94a3b8">${Array.from({length:18},(_,i)=>`<circle cx="${70+(i%9)*62}" cy="${60+Math.floor(i/9)*95}" r="9"/>`).join('')}</g><circle cy="108" r="10" fill="#2563eb"><animate attributeName="cx" values="70;570;70" dur="4s"${motion}/></circle><circle cy="138" r="10" fill="#ef4444"><animate attributeName="cx" values="570;70;570" dur="4.6s"${motion}/></circle><text x="95" y="205" fill="#14324c" font-size="18" font-weight="700">electron</text><text x="455" y="205" fill="#14324c" font-size="18" font-weight="700">hole</text></svg>`;
    if (key.includes('led')) return `<svg ${common}><rect width="640" height="220" rx="18" fill="#f7fbff"/><path d="M190 110H290M350 110H450" stroke="#12355c" stroke-width="5"/><path d="M290 65V155L350 110Z" fill="#00b8d9" stroke="#075985" stroke-width="4"/><line x1="350" y1="65" x2="350" y2="155" stroke="#075985" stroke-width="5"/><g stroke="#f59e0b" stroke-width="6"><path d="M385 70l70-35"><animate attributeName="opacity" values=".2;1;.2" dur="1.3s"${motion}/></path><path d="M395 105l85-5"><animate attributeName="opacity" values="1;.2;1" dur="1.3s"${motion}/></path><path d="M385 140l70 35"><animate attributeName="opacity" values=".2;1;.2" dur="1.3s"${motion}/></path></g><text x="230" y="195" fill="#14324c" font-size="18" font-weight="700">Forward current → light</text></svg>`;
    if (key.includes('photo')) return `<svg ${common}><rect width="640" height="220" rx="18" fill="#f7fbff"/><rect x="330" y="55" width="170" height="110" rx="16" fill="#dbeafe" stroke="#2563eb" stroke-width="4"/><g fill="#f59e0b">${[0,1,2].map(i=>`<circle cx="${90+i*65}" cy="${75+i*28}" r="10"><animate attributeName="cx" values="${90+i*65};360;${90+i*65}" dur="${2.4+i*.4}s"${motion}/></circle>`).join('')}</g><path d="M375 115h80" stroke="#12355c" stroke-width="5"/><text x="205" y="205" fill="#14324c" font-size="18" font-weight="700">Light creates measurable current</text></svg>`;
    return `<svg ${common}><rect width="640" height="220" rx="18" fill="#f7fbff"/><path d="M70 110H570" stroke="#94a3b8" stroke-width="5"/><circle cy="110" r="14" fill="#00b8d9"><animate attributeName="cx" values="70;570;70" dur="3.5s"${motion}/></circle><text x="170" y="175" fill="#14324c" font-size="19" font-weight="700">${label}</text></svg>`;
  };

  document.querySelectorAll('.animation-card[data-animation]').forEach(card => {
    const stage = card.querySelector('.anim-stage');
    if (!stage) return;
    stage.innerHTML = svg(card.dataset.animation || '', card.querySelector('h3')?.textContent || 'Electronics concept animation');
    const p = card.querySelector('p');
    if (p && !card.querySelector('.ml-note')) {
      const note = document.createElement('aside');
      note.className = 'ml-note';
      note.innerHTML = `<strong>Malayalam explanation:</strong> ${ml(card.querySelector('h3')?.textContent || '')}`;
      p.after(note);
    }
    card.classList.add('playing');
    card.querySelector('[data-anim-action="reset"]')?.remove();
    card.querySelector('[data-anim-speed]')?.closest('label')?.remove();
    const visual = () => stage.querySelector('svg');
    card.querySelector('[data-anim-action="play"]')?.addEventListener('click', () => { visual()?.unpauseAnimations?.(); card.classList.add('playing'); });
    card.querySelector('[data-anim-action="pause"]')?.addEventListener('click', () => { visual()?.pauseAnimations?.(); card.classList.remove('playing'); });
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      const svgEl = entry.target.querySelector('.concept-viz');
      if (entry.isIntersecting && !staticMode) { svgEl?.unpauseAnimations?.(); entry.target.classList.add('playing'); }
      else { svgEl?.pauseAnimations?.(); entry.target.classList.remove('playing'); }
    }), { threshold: .08 });
    document.querySelectorAll('.animation-card').forEach(card => observer.observe(card));
  }
})();
</script>
'''
    elec = elec.replace("</body>", enhancement_js + "\n</body>", 1)

# Targeted deletion of duplicated mobile-only navigation clutter is handled in CSS;
# academic sections remain available in desktop/print views.

for text, marker, code in ((math, MATH_MARK, "1002"), (elec, ELEC_MARK, "1041")):
    if marker not in text:
        raise SystemExit(f"Missing repair marker for {code}")

if "Malayalam explanation:" not in elec or "concept-viz" not in elec:
    raise SystemExit("1041 bilingual/animation enhancement validation failed")

MATH.write_text(math, encoding="utf-8")
ELEC.write_text(elec, encoding="utf-8")
print("Courses 1002 and 1041 repaired and validated.")
