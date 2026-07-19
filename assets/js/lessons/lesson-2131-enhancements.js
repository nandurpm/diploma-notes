(() => {
  "use strict";
  if (window.__poly2131EnhancementsLoaded) return;
  window.__poly2131EnhancementsLoaded = true;

  const byId = (id) => document.getElementById(id);
  const make = (html) => {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    return template.content.firstElementChild;
  };
  const insertAfter = (anchor, node) => {
    if (anchor && node) anchor.insertAdjacentElement("afterend", node);
  };
  const addAfterModuleHead = (moduleId, key, caption, rows, totalCo) => {
    const module = byId(moduleId);
    if (!module || module.querySelector(`[data-2131-enhancement="${key}"]`)) return;
    const body = rows.map(([topic, hours, taxonomy]) => `<tr><td>${topic}</td><td>${hours}</td><td>${taxonomy}</td></tr>`).join("");
    const table = make(`<div class="table-wrap" data-2131-enhancement="${key}"><table><caption>${caption}</caption><thead><tr><th>Subtopic</th><th>Hours</th><th>Taxonomy</th></tr></thead><tbody>${body}<tr><th>Total</th><th>15</th><th>${totalCo}</th></tr></tbody></table></div>`);
    insertAfter(module.querySelector(".module-head"), table);
  };

  addAfterModuleHead("module-1", "m1-hours", "Official Module I subtopic allocation", [
    ["Introduction to electricity", "1", "Remember"],
    ["Current, voltage and resistance", "1", "Remember"],
    ["Concept of AC and DC", "1", "Understand"],
    ["Ohm’s Law", "1.5", "Apply"],
    ["Law of resistance", "0.5", "Apply"],
    ["Combination of resistance", "3", "Apply"],
    ["Voltage and current division rules", "3", "Apply"],
    ["Faraday’s laws", "1", "Understand"],
    ["Generation of AC voltage", "2", "Understand"],
    ["Sinusoidal representation and parameters", "1", "Understand"]
  ], "CO1");
  addAfterModuleHead("module-2", "m2-hours", "Official Module II subtopic allocation", [
    ["Basic terms in electrical circuits", "2", "Understand"],
    ["Domestic supply structure", "2", "Understand"],
    ["Protection devices", "3", "Remember"],
    ["Earthing", "2", "Understand"],
    ["Electrical safety and shock", "1", "Understand"],
    ["Residential wiring", "2", "Remember"],
    ["Electrical energy consumption", "3", "Apply"]
  ], "CO2");
  addAfterModuleHead("module-3", "m3-hours", "Official Module III subtopic allocation", [
    ["Evolution of electronics", "1", "Understand"],
    ["Resistor", "2", "Understand"],
    ["Resistor colour coding", "2", "Understand"],
    ["Capacitors", "2", "Understand"],
    ["Capacitor number coding", "2", "Apply"],
    ["Inductor", "3", "Understand"],
    ["Transformer", "3", "Understand"]
  ], "CO3");
  addAfterModuleHead("module-4", "m4-hours", "Official Module IV subtopic allocation", [
    ["PN junction diode", "2", "Understand"],
    ["Rectifier circuits", "3", "Understand"],
    ["Bipolar Junction Transistor", "2", "Understand"],
    ["Introduction to digital electronics", "1", "Understand"],
    ["Number systems", "4", "Apply"],
    ["Logic gates", "2", "Remember"],
    ["Recent trends in electronics", "1", "Understand"]
  ], "CO4");

  const capacitor = byId("m3-capacitor")?.querySelector(".topic-body");
  if (capacitor && !capacitor.querySelector('[data-2131-enhancement="capacitor-symbols"]')) {
    const figure = make(`<figure class="diagram" data-2131-enhancement="capacitor-symbols"><svg viewBox="0 0 760 220" role="img" aria-labelledby="capSymTitle capSymDesc"><title id="capSymTitle">Fixed, polarized and variable capacitor symbols</title><desc id="capSymDesc">Standard circuit symbols for a fixed capacitor, polarized capacitor and variable capacitor.</desc><text x="75" y="35" class="svg-label">Fixed</text><line x1="35" y1="110" x2="120" y2="110" class="svg-wire"/><line x1="120" y1="65" x2="120" y2="155" class="svg-wire"/><line x1="155" y1="65" x2="155" y2="155" class="svg-wire"/><line x1="155" y1="110" x2="240" y2="110" class="svg-wire"/><text x="300" y="35" class="svg-label">Polarized</text><line x1="270" y1="110" x2="345" y2="110" class="svg-wire"/><line x1="345" y1="65" x2="345" y2="155" class="svg-wire"/><path d="M385 65 Q355 110 385 155" fill="none" stroke="#0f172a" stroke-width="4"/><line x1="385" y1="110" x2="465" y2="110" class="svg-wire"/><text x="327" y="55" class="svg-label">+</text><text x="555" y="35" class="svg-label">Variable</text><line x1="505" y1="110" x2="575" y2="110" class="svg-wire"/><line x1="575" y1="65" x2="575" y2="155" class="svg-wire"/><line x1="610" y1="65" x2="610" y2="155" class="svg-wire"/><line x1="610" y1="110" x2="690" y2="110" class="svg-wire"/><line x1="545" y1="165" x2="640" y2="55" stroke="#0891b2" stroke-width="4"/><polygon points="640,55 625,62 637,73" fill="#0891b2"/></svg><figcaption>Capacitor symbols: parallel plates for fixed, curved/marked polarity for polarized, and an arrow for variable capacitance.</figcaption></figure>`);
    const safety = capacitor.querySelector(".safety");
    safety ? safety.insertAdjacentElement("beforebegin", figure) : capacitor.append(figure);
  }

  const inductor = byId("m3-inductor")?.querySelector(".topic-body");
  if (inductor && !inductor.querySelector('[data-2131-enhancement="inductor-symbols"]')) {
    const figure = make(`<figure class="diagram" data-2131-enhancement="inductor-symbols"><svg viewBox="0 0 760 220" role="img" aria-labelledby="indSymTitle indSymDesc"><title id="indSymTitle">Air-core, iron-core and ferrite-core inductor symbols</title><desc id="indSymDesc">Three coil symbols, with core lines added for magnetic-core inductors.</desc><text x="70" y="35" class="svg-label">Air core</text><path d="M30 120 H80 q20-55 40 0 q20-55 40 0 q20-55 40 0 q20-55 40 0 H280" fill="none" stroke="#0f172a" stroke-width="4"/><text x="335" y="35" class="svg-label">Iron / ferrite core</text><path d="M310 120 H355 q20-55 40 0 q20-55 40 0 q20-55 40 0 q20-55 40 0 H555" fill="none" stroke="#0f172a" stroke-width="4"/><line x1="365" y1="165" x2="535" y2="165" stroke="#64748b" stroke-width="6"/><line x1="365" y1="180" x2="535" y2="180" stroke="#64748b" stroke-width="6"/><text x="585" y="110" class="svg-small">Core material changes</text><text x="585" y="135" class="svg-small">inductance and losses.</text></svg><figcaption>An air-core inductor has no magnetic core lines; iron/ferrite core is shown by parallel lines near the coil.</figcaption></figure>`);
    const note = inductor.querySelector(".ml-note");
    note ? note.insertAdjacentElement("beforebegin", figure) : inductor.append(figure);
  }

  const diode = byId("m4-diode")?.querySelector(".topic-body");
  if (diode && !diode.querySelector('[data-2131-enhancement="pn-structure"]')) {
    const figure = make(`<figure class="diagram" data-2131-enhancement="pn-structure"><svg viewBox="0 0 860 260" role="img" aria-labelledby="pnStructTitle pnStructDesc"><title id="pnStructTitle">PN junction structure and bias effect</title><desc id="pnStructDesc">P region, depletion layer and N region, with forward bias narrowing and reverse bias widening the depletion layer.</desc><text x="35" y="35" class="svg-label">Unbiased junction</text><rect x="35" y="65" width="170" height="115" fill="#fee2e2" stroke="#b42318" stroke-width="3"/><rect x="205" y="65" width="55" height="115" fill="#f8fafc" stroke="#64748b" stroke-width="3"/><rect x="260" y="65" width="170" height="115" fill="#dbeafe" stroke="#1d4ed8" stroke-width="3"/><text x="110" y="130" class="svg-label">P</text><text x="212" y="130" class="svg-small">depletion</text><text x="330" y="130" class="svg-label">N</text><text x="500" y="35" class="svg-label">Bias effect</text><rect x="500" y="65" width="120" height="65" fill="#dcfce7" stroke="#15803d" stroke-width="3"/><rect x="620" y="65" width="25" height="65" fill="#f8fafc" stroke="#64748b" stroke-width="3"/><rect x="645" y="65" width="120" height="65" fill="#dbeafe" stroke="#1d4ed8" stroke-width="3"/><text x="515" y="105" class="svg-small">Forward: narrow</text><rect x="500" y="155" width="120" height="65" fill="#fee2e2" stroke="#b42318" stroke-width="3"/><rect x="620" y="155" width="85" height="65" fill="#f8fafc" stroke="#64748b" stroke-width="3"/><rect x="705" y="155" width="60" height="65" fill="#dbeafe" stroke="#1d4ed8" stroke-width="3"/><text x="515" y="195" class="svg-small">Reverse: wide</text></svg><figcaption>Forward bias narrows the depletion region; reverse bias widens it. Diagram is conceptual and not to scale.</figcaption></figure>`);
    const types = [...diode.querySelectorAll("p")].find((p) => p.textContent.includes("Types include"));
    types ? types.insertAdjacentElement("beforebegin", figure) : diode.append(figure);
  }

  const rectifier = byId("m4-rectifier")?.querySelector(".topic-body");
  if (rectifier && !rectifier.querySelector('[data-2131-enhancement="rectifier-types"]')) {
    const figure = make(`<figure class="diagram" data-2131-enhancement="rectifier-types"><svg viewBox="0 0 940 430" role="img" aria-labelledby="rectAllTitle rectAllDesc"><title id="rectAllTitle">Half-wave, centre-tapped full-wave and bridge rectifier concepts</title><desc id="rectAllDesc">Three simplified rectifier circuits and their characteristic output waveforms.</desc><text x="25" y="35" class="svg-label">Half-wave</text><text x="330" y="35" class="svg-label">Centre-tapped full-wave</text><text x="665" y="35" class="svg-label">Bridge</text><line x1="25" y1="95" x2="75" y2="95" class="svg-wire"/><polygon points="75,75 75,115 120,95" fill="#e0f2fe" stroke="#0f172a" stroke-width="3"/><line x1="120" y1="70" x2="120" y2="120" class="svg-wire"/><line x1="120" y1="95" x2="175" y2="95" class="svg-wire"/><rect x="175" y="75" width="70" height="40" class="svg-component"/><line x1="245" y1="95" x2="270" y2="95" class="svg-wire"/><path d="M30 190 C55 135 80 135 105 190 M105 190 H155 M155 190 C180 135 205 135 230 190" class="svg-accent"/><line x1="25" y1="190" x2="275" y2="190" class="svg-wire"/><line x1="350" y1="75" x2="400" y2="75" class="svg-wire"/><polygon points="400,55 400,95 445,75" fill="#e0f2fe" stroke="#0f172a" stroke-width="3"/><line x1="445" y1="50" x2="445" y2="100" class="svg-wire"/><line x1="350" y1="135" x2="400" y2="135" class="svg-wire"/><polygon points="400,115 400,155 445,135" fill="#e0f2fe" stroke="#0f172a" stroke-width="3"/><line x1="445" y1="110" x2="445" y2="160" class="svg-wire"/><line x1="445" y1="75" x2="520" y2="75" class="svg-wire"/><line x1="445" y1="135" x2="520" y2="135" class="svg-wire"/><line x1="520" y1="75" x2="520" y2="135" class="svg-wire"/><rect x="520" y="85" width="65" height="40" class="svg-component"/><text x="335" y="175" class="svg-small">centre tap is return</text><path d="M335 230 C355 185 375 185 395 230 C415 185 435 185 455 230 C475 185 495 185 515 230 C535 185 555 185 575 230" class="svg-accent"/><line x1="330" y1="230" x2="590" y2="230" class="svg-wire"/><polygon points="760,55 850,115 760,175 670,115" fill="none" stroke="#0f172a" stroke-width="4"/><text x="700" y="85" class="svg-small">D1</text><text x="805" y="85" class="svg-small">D2</text><text x="700" y="160" class="svg-small">D3</text><text x="805" y="160" class="svg-small">D4</text><rect x="730" y="185" width="60" height="35" class="svg-component"/><line x1="760" y1="175" x2="760" y2="185" class="svg-wire"/><path d="M665 285 C685 240 705 240 725 285 C745 240 765 240 785 285 C805 240 825 240 845 285 C865 240 885 240 905 285" class="svg-accent"/><line x1="660" y1="285" x2="915" y2="285" class="svg-wire"/><text x="25" y="350" class="svg-small">Half-wave uses one half-cycle; full-wave circuits produce two pulses per input cycle.</text><text x="25" y="390" class="svg-small">Circuit symbols are simplified for learning. Draw complete source and diode polarity in examination answers.</text></svg><figcaption>Comparison of the three official rectifier circuits and output-waveform shapes.</figcaption></figure>`);
    const existing = rectifier.querySelector("figure.diagram");
    existing ? existing.insertAdjacentElement("beforebegin", figure) : rectifier.append(figure);
  }

  const bjt = byId("m4-bjt")?.querySelector(".topic-body");
  if (bjt && !bjt.querySelector('[data-2131-enhancement="bjt-internal"]')) {
    const figure = make(`<figure class="diagram" data-2131-enhancement="bjt-internal"><svg viewBox="0 0 820 280" role="img" aria-labelledby="bjtIntTitle bjtIntDesc"><title id="bjtIntTitle">NPN internal structure and current control</title><desc id="bjtIntDesc">An NPN transistor with emitter, thin base and collector regions, showing base and collector currents combining into emitter current.</desc><rect x="80" y="55" width="190" height="150" fill="#dbeafe" stroke="#1d4ed8" stroke-width="3"/><rect x="270" y="55" width="65" height="150" fill="#fee2e2" stroke="#b42318" stroke-width="3"/><rect x="335" y="55" width="230" height="150" fill="#dbeafe" stroke="#1d4ed8" stroke-width="3"/><text x="125" y="130" class="svg-label">N emitter</text><text x="282" y="130" class="svg-small">P base</text><text x="405" y="130" class="svg-label">N collector</text><line x1="40" y1="130" x2="80" y2="130" class="svg-wire"/><line x1="300" y1="235" x2="300" y2="205" class="svg-wire"/><line x1="565" y1="130" x2="625" y2="130" class="svg-wire"/><path d="M650 80 H760" stroke="#0891b2" stroke-width="5"/><polygon points="760,80 740,68 740,92" fill="#0891b2"/><text x="650" y="65" class="svg-label">I_C</text><path d="M300 255 V220" stroke="#b45309" stroke-width="5"/><polygon points="300,215 288,235 312,235" fill="#b45309"/><text x="320" y="255" class="svg-label">I_B</text><path d="M65 230 V150" stroke="#6d28d9" stroke-width="5"/><polygon points="65,145 53,165 77,165" fill="#6d28d9"/><text x="20" y="250" class="svg-label">I_E</text><text x="610" y="180" class="svg-small">Base-emitter junction forward biased;</text><text x="610" y="205" class="svg-small">collector-base junction reverse biased.</text></svg><figcaption>A thin base allows a small base current to control a larger collector current. I_E = I_C + I_B.</figcaption></figure>`);
    const application = [...bjt.querySelectorAll("p")].find((p) => p.textContent.startsWith("Applications include"));
    application ? application.insertAdjacentElement("beforebegin", figure) : bjt.append(figure);
  }

  const gates = byId("m4-gates")?.querySelector(".topic-body");
  if (gates && !gates.querySelector('[data-2131-enhancement="gate-symbols"]')) {
    const figure = make(`<figure class="diagram" data-2131-enhancement="gate-symbols"><svg viewBox="0 0 1080 520" role="img" aria-labelledby="gateTitle gateDesc"><title id="gateTitle">Symbols of seven basic logic gates</title><desc id="gateDesc">Standard conceptual symbols for NOT, AND, OR, XOR, NAND, NOR and XNOR gates.</desc><g fill="#fff" stroke="#0f172a" stroke-width="4"><polygon points="90,60 90,150 190,105"/><circle cx="205" cy="105" r="12"/><path d="M330 55 H405 A55 55 0 0 1 405 155 H330 Z"/><path d="M565 55 Q620 105 565 155 Q645 155 695 105 Q645 55 565 55 Z"/><path d="M800 55 Q855 105 800 155 Q880 155 930 105 Q880 55 800 55 Z"/><path d="M785 55 Q840 105 785 155" fill="none"/><path d="M90 300 H165 A55 55 0 0 1 165 400 H90 Z"/><circle cx="230" cy="350" r="12"/><path d="M350 300 Q405 350 350 400 Q430 400 480 350 Q430 300 350 300 Z"/><circle cx="495" cy="350" r="12"/><path d="M640 300 Q695 350 640 400 Q720 400 770 350 Q720 300 640 300 Z"/><path d="M625 300 Q680 350 625 400" fill="none"/><circle cx="785" cy="350" r="12"/></g><g class="svg-wire"><line x1="35" y1="105" x2="90" y2="105"/><line x1="217" y1="105" x2="255" y2="105"/><line x1="280" y1="80" x2="330" y2="80"/><line x1="280" y1="130" x2="330" y2="130"/><line x1="460" y1="105" x2="510" y2="105"/><line x1="520" y1="80" x2="575" y2="80"/><line x1="520" y1="130" x2="575" y2="130"/><line x1="695" y1="105" x2="745" y2="105"/><line x1="745" y1="80" x2="800" y2="80"/><line x1="745" y1="130" x2="800" y2="130"/><line x1="930" y1="105" x2="980" y2="105"/><line x1="40" y1="325" x2="90" y2="325"/><line x1="40" y1="375" x2="90" y2="375"/><line x1="242" y1="350" x2="280" y2="350"/><line x1="300" y1="325" x2="350" y2="325"/><line x1="300" y1="375" x2="350" y2="375"/><line x1="507" y1="350" x2="550" y2="350"/><line x1="575" y1="325" x2="640" y2="325"/><line x1="575" y1="375" x2="640" y2="375"/><line x1="797" y1="350" x2="850" y2="350"/></g><g class="svg-label"><text x="120" y="195">NOT</text><text x="360" y="195">AND</text><text x="610" y="195">OR</text><text x="840" y="195">XOR</text><text x="120" y="450">NAND</text><text x="390" y="450">NOR</text><text x="675" y="450">XNOR</text></g></svg><figcaption>A small output circle means inversion. XOR/XNOR have an extra curved input-side line.</figcaption></figure>`);
    const firstTable = gates.querySelector(".table-wrap");
    firstTable ? firstTable.insertAdjacentElement("beforebegin", figure) : gates.prepend(figure);
  }
})();
