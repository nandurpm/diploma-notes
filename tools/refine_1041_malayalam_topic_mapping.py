#!/usr/bin/env python3
"""Refine Course 1041 Malayalam topic classification from specific to general."""
from pathlib import Path
import re

path = Path("revision-2026-content/lessons/lessons-1041.html")
text = path.read_text(encoding="utf-8")
if '<meta name="course-code" content="1041">' not in text or '1041-bilingual-visual-upgrade-v2' not in text:
    raise SystemExit("Course 1041 bilingual upgrade guard failed")

replacement = r'''const ml = title => {
    const t = String(title || "").toLowerCase();
    if (/photodiode|photo detector|light sensor/.test(t)) return "Photodiode incident light-നെ electrical current ആയി convert ചെയ്യുന്നു. സാധാരണ reverse-bias operation-ൽ sensitivity മെച്ചപ്പെടും.";
    if (/led|light-emitting/.test(t)) return "LED forward current ലഭിക്കുമ്പോൾ light emit ചെയ്യുന്നു. Polarity, forward voltage, current-limiting resistor എന്നിവ പരിശോധിക്കുക.";
    if (/zener|breakdown/.test(t)) return "Zener diode controlled Reverse Breakdown region-ൽ voltage regulation-യ്ക്ക് ഉപയോഗിക്കുന്നു. Series current-limiting resistor നിർബന്ധമാണ്.";
    if (/reverse bias/.test(t)) return "Reverse Bias depletion region വർധിപ്പിക്കുകയും majority-carrier current തടയുകയും ചെയ്യുന്നു. Breakdown rating exceed ചെയ്യരുത്.";
    if (/forward bias/.test(t)) return "Forward Bias junction barrier കുറച്ച് current flow അനുവദിക്കുന്നു. Diode current safe value-ൽ limit ചെയ്യണം.";
    if (/pn|junction|depletion/.test(t)) return "PN Junction രൂപപ്പെടുമ്പോൾ Depletion Regionയും Barrier Potentialയും ഉണ്ടാകും. Applied Bias അനുസരിച്ച് barrier width മാറുന്നു.";
    if (/semiconductor|band theory|doping|intrinsic|extrinsic|carrier|electron|hole/.test(t)) return "Semiconductor conductivity doping, temperature, electrons, holes എന്നിവയിൽ ആശ്രയിക്കുന്നു. Mobile carriers-ഉം fixed dopant ions-ഉം വേർതിരിച്ച് മനസ്സിലാക്കുക.";
    if (/diode|rectifier/.test(t)) return "Diode പ്രധാനമായും one-direction conduction നൽകുന്ന semiconductor device ആണ്. Anode, Cathode, polarity, forward drop, current limit എന്നിവ ശ്രദ്ധിക്കുക.";
    if (/capacitor|capacitance|time constant|\brc\b/.test(t)) return "Capacitor charge store ചെയ്യുന്നു. Charging/Discharging speed-നെ RC Time Constant നിയന്ത്രിക്കുന്നു; electrolytic capacitor-ന്റെ polarityയും voltage rating-വും നിർബന്ധമായി പാലിക്കുക.";
    if (/inductor|inductance/.test(t)) return "Inductor current change-നെ oppose ചെയ്ത് magnetic field-ൽ energy store ചെയ്യുന്നു. Sudden current interruption voltage spike ഉണ്ടാക്കാം.";
    if (/transformer|magnetic flux/.test(t)) return "Transformer changing magnetic flux ഉപയോഗിച്ചാണ് voltage transfer ചെയ്യുന്നത്. Steady DC transformer action നൽകില്ല; turns ratio ശ്രദ്ധിക്കുക.";
    if (/voltage divider|divider/.test(t)) return "Voltage Divider output resistor ratio അനുസരിച്ചാണ്. Load connect ചെയ്താൽ output മാറാം; loading effect പരിഗണിക്കുക.";
    if (/parallel/.test(t)) return "Parallel branches-ൽ Voltage common ആണ്. Total current branch currents-ന്റെ sum ആണ്; equivalent resistance ഏറ്റവും ചെറിയ branch resistance-നെക്കാൾ കുറവായിരിക്കും.";
    if (/series/.test(t)) return "Series circuit-ൽ ഒരേ Current എല്ലാ components-ലൂടെയും ഒഴുകുന്നു. Resistances add ചെയ്യും; ഒരു open connection മുഴുവൻ path തടയും.";
    if (/resistance|resistor/.test(t)) return "Resistance current flow-നെ oppose ചെയ്യുന്നു. Value, tolerance, power rating എന്നിവ ഒരുമിച്ച് പരിശോധിച്ചാണ് resistor തിരഞ്ഞെടുക്കേണ്ടത്.";
    if (/electric charge|\bcharge\b/.test(t)) return "Electric charge എന്നത് വസ്തുവിന്റെ അടിസ്ഥാന electrical property ആണ്. Charge ഒഴുകുന്ന നിരക്കാണ് Current; അതിനാൽ Q, I, t എന്നീ quantities തമ്മിലുള്ള ബന്ധം ശ്രദ്ധിക്കുക.";
    if (/electric current|current flow|\bcurrent\b/.test(t)) return "Current എന്നത് charge flow rate ആണ്. Ammeter എപ്പോഴും circuit-ൽ series ആയി connect ചെയ്യണം; source-ന് across ആയി connect ചെയ്യരുത്.";
    if (/voltage|potential/.test(t)) return "Voltage രണ്ട് points തമ്മിലുള്ള potential difference ആണ്. Voltmeter parallel ആയി connect ചെയ്യുകയും reference point വ്യക്തമാക്കുകയും വേണം.";
    if (/power|energy/.test(t)) return "Power energy conversion rate ആണ്; Energy = Power × Time. W, Wh, kWh, J എന്നീ units തമ്മിൽ mix ചെയ്യാതെ conversion ചെയ്യുക.";
    if (/\bac\b|alternating|sinus|frequency|period|amplitude|phase/.test(t)) return "AC signal സമയം അനുസരിച്ച് magnitude-വും direction-വും മാറുന്നു. Frequency, Period, Amplitude, Phase എന്നിവ waveform വായിക്കാൻ ഉപയോഗിക്കുന്ന പ്രധാന terms ആണ്.";
    if (/\bdc\b|direct current/.test(t)) return "DC-യ്ക്ക് fixed polarity/direction ഉണ്ട്. Practical DC supply-ൽ ripple അല്ലെങ്കിൽ noise ഉണ്ടാകാം; meter-ന്റെ DC mode തിരഞ്ഞെടുക്കുക.";
    if (/analog/.test(t)) return "Analog signal continuous values സ്വീകരിക്കുന്നു. Noise, offset, loading എന്നിവ measurement-നെ ബാധിക്കാം.";
    if (/digital|logic|binary/.test(t)) return "Digital signal discrete LOW/HIGH ranges ഉപയോഗിക്കുന്നു. Logic HIGH എന്നത് എല്ലാ circuits-ലും ഒരേ voltage അല്ല; logic family അനുസരിച്ച് range മാറും.";
    if (/instrument|multimeter|oscilloscope|\bdso\b|generator|measurement/.test(t)) return "Measurement ചെയ്യുന്നതിന് മുമ്പ് function, range, terminals, probe reference, expected value എന്നിവ verify ചെയ്യുക. Display കാണുന്നതു മാത്രം ശരിയായ measurement ഉറപ്പാക്കില്ല.";
    if (/esd|electrostatic/.test(t)) return "ESD കണ്ണിൽ കാണാനാകാത്ത വിധം semiconductor devices damage ചെയ്യാം. Grounded mat, approved wrist strap, antistatic packaging എന്നിവ ഉപയോഗിക്കുക.";
    if (/solder|flux|joint|desolder|wetting|soldering iron|tip/.test(t)) return "Good solder joint lead-ലും pad-ലും ശരിയായി wet ചെയ്ത് smooth concave fillet ഉണ്ടാക്കണം. Excess heat, insufficient flux, movement എന്നിവ dry joint അല്ലെങ്കിൽ lifted pad ഉണ്ടാക്കാം.";
    if (/pcb|printed circuit|track|pad|via|layout|fabrication/.test(t)) return "PCB-യിലെ Track current path ആണ്; Pad component connection ആണ്; Via layers തമ്മിൽ connection നൽകുന്നു. Layout-ൽ current, noise, heat, clearance എന്നിവ പരിഗണിക്കുക.";
    if (/application|electronics|system|communication|medical|automobile|consumer|renewable|computer/.test(t)) return "ഒരു electronic system-നെ Power Supply → Input/Sensor → Processing/Control → Output/Actuator എന്ന block flow ആയി കാണുക. Safetyയും signal path-ഉം ഒരുമിച്ച് പരിശോധിക്കുക.";
    return "ഈ concept പഠിക്കുമ്പോൾ Definition, Unit, Symbol, Working Principle, Circuit/Diagram, Application, Safety എന്നിവ തമ്മിൽ ബന്ധപ്പെടുത്തി മനസ്സിലാക്കുക.";
  };'''

pattern = r'const ml = title => \{.*?\n  \};'
updated, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
if count != 1:
    raise SystemExit(f"Malayalam mapper replacement count was {count}")

required = [
    '/\\bac\\b|alternating|sinus|frequency|period|amplitude|phase/',
    'if (/photodiode|photo detector|light sensor/',
    'if (/led|light-emitting/',
    'if (/zener|breakdown/',
    'if (/pcb|printed circuit|track|pad|via|layout|fabrication/',
]
missing = [item for item in required if item not in updated]
if missing:
    raise SystemExit(f"Refined mapping validation failed: {missing}")

path.write_text(updated, encoding="utf-8")
print("Course 1041 Malayalam topic mapping refined.")
