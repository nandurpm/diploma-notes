/* POLY PMNA — safe educational SVG diagram renderer */
(() => {
  "use strict";

  const registry = new Map();
  let sequence = 0;
  const esc = (value) => String(value ?? "").replace(/[&<>\"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const tx = (x, y, value, cls = "label", anchor = "middle") => `<text x="${n(x)}" y="${n(y)}" class="${cls}" text-anchor="${anchor}">${esc(value)}</text>`;
  const ln = (x1, y1, x2, y2, cls = "wire") => `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" class="${cls}"/>`;
  const path = (d, cls = "wire") => `<path d="${esc(d)}" class="${cls}"/>`;
  const dot = (x, y) => `<circle cx="${n(x)}" cy="${n(y)}" r="4" class="junction"/>`;
  const box = (x, y, w, h, label, cls = "component") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" class="${cls}"/>${tx(x + w / 2, y + h / 2 + 5, label, "component-label")}`;
  const arrow = (x1, y1, x2, y2, cls = "wire arrow") => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}" marker-end="url(#poly-arrow)"/>`;

  function defs() {
    return `<defs><marker id="poly-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" class="arrow-head"/></marker></defs>`;
  }

  function frame(title, body, width = 840, height = 430, description = "Educational technical diagram", textFallback = "") {
    const id = `poly-diagram-${++sequence}`;
    const safeTitle = esc(title);
    const svg = `<svg class="ask-diagram-svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${id}-title ${id}-desc" xmlns="http://www.w3.org/2000/svg">${defs()}<title id="${id}-title">${safeTitle}</title><desc id="${id}-desc">${esc(description)}</desc><rect width="100%" height="100%" rx="18" class="diagram-surface"/>${body}</svg>`;
    registry.set(id, { svg, title, textFallback: textFallback || description });
    return `<figure class="ask-diagram" data-diagram-id="${id}" data-diagram-type="${esc(title)}"><figcaption><span class="ask-diagram-title"><strong>Diagram</strong><span>${safeTitle}</span></span><span class="ask-diagram-controls"><button type="button" data-diagram-action="zoom-out" aria-label="Zoom out">−</button><button type="button" data-diagram-action="zoom-reset" aria-label="Reset diagram zoom">100%</button><button type="button" data-diagram-action="zoom-in" aria-label="Zoom in">+</button><button type="button" data-diagram-action="download-svg">SVG</button><button type="button" data-diagram-action="download-png">PNG</button><button type="button" data-diagram-action="fullscreen" aria-label="Open diagram fullscreen">Full</button></span></figcaption><div class="ask-diagram-viewport"><div class="ask-diagram-canvas">${svg}</div></div></figure>`;
  }

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
  }

  function detectIntent(question, context = {}) {
    const q = normalize(question);
    const department = context?.department?.displayName || context?.department || "";
    const withDepartment = (intent) => department ? { ...intent, department } : intent;
    const visual = /(\bdraw\b|\bsketch\b|\bdiagram\b|\bcircuit\b|\bschematic\b|\bsymbol\b|\bwaveform\b|\bflow\s*chart\b|\bblock diagram\b|\bwiring\b|\bconnection\b|\billustrate\b|\bshow (?:the )?(?:symbol|circuit|connections?)\b|\bconstruct\b|\brepresentation\b|\bplot\b|\bgraph\b|വരയ്ക്ക|കാണിക്ക|ചിത്രം|ഡയഗ്രാം|സിംബൽ|സർക്യൂട്ട്|വേവ്)/i.test(q);
    if (!visual) return null;
    if (/four[- ]stroke|four stroke engine|four[- ]stroke engine|engine.*diagram|engine.*sketch/.test(q)) return withDepartment({ type: "four_stroke_engine", title: "Four-stroke engine" });
    if (/simply supported beam|supported beam|beam.*plan|beam.*diagram|beam.*sketch/.test(q)) return withDepartment({ type: "simply_supported_beam", title: "Simply supported beam" });
    if (/one[- ]point perspective|perspective drawing|perspective.*diagram|perspective.*sketch/.test(q)) return withDepartment({ type: "one_point_perspective", title: "One-point perspective" });
    if (/microcontroller.*block|mcu.*block|microcontroller diagram|embedded.*block/.test(q)) return withDepartment({ type: "microcontroller_block", title: "Microcontroller block diagram" });
    if (/bridge\s*rectifier|ബ്രിഡ്ജ്.*റെക്ടിഫയർ/.test(q)) return withDepartment({ type: "bridge_rectifier", title: "Bridge rectifier circuit" });
    if (/half[- ]wave\s*rectifier/.test(q)) return withDepartment({ type: /waveform|output/.test(q) ? "half_wave_waveform" : "half_wave_rectifier", title: /waveform|output/.test(q) ? "Half-wave rectified waveform" : "Half-wave rectifier" });
    if (/full[- ]wave\s*rectifier|center[- ]tapped/.test(q)) return withDepartment({ type: /waveform|output/.test(q) ? "full_wave_waveform" : "full_wave_rectifier", title: "Full-wave rectifier" });
    if (/zener.*(?:regulator|circuit)|(?:regulator|circuit).*zener|voltage regulator/.test(q)) return withDepartment({ type: "zener_regulator", title: "Zener diode voltage regulator" });
    if (/step[- ]up.*transformer|transformer.*step[- ]up/.test(q)) return withDepartment({ type: "transformer", variant: "step-up", title: "Step-up transformer" });
    if (/step[- ]down.*transformer|transformer.*step[- ]down/.test(q)) return withDepartment({ type: "transformer", variant: "step-down", title: "Step-down transformer" });
    if (/transformer|ട്രാൻസ്ഫോർമർ/.test(q)) return withDepartment({ type: "transformer", title: "Transformer" });
    if (/flowchart|flow chart|decision process|flow diagram|algorithm flowchart|ഫ്ലോചാർട്ട്/.test(q)) {
      const flow = (variant, title) => withDepartment({ type: "flowchart", variant, title, language: /[\u0D00-\u0D7F]/.test(q) ? "ml" : "en" });
      if (/\bpnp\b.*\bnpn\b|\bnpn\b.*\bpnp\b/.test(q)) return flow("pnp_npn", "PNP and NPN transistor operation flowchart");
      if (/odd|even|parity|ഒറ്റ|ഇരട്ട/.test(q)) return flow("odd_even", "Odd or even number flowchart");
      if (/largest|greatest|max(?:imum)?|three numbers|three values/.test(q)) return flow("largest_three", "Largest of three numbers flowchart");
      if (/positive|negative|zero/.test(q)) return flow("positive_negative_zero", "Positive, negative or zero flowchart");
      if (/simple interest|principal.*rate|rate.*time/.test(q)) return flow("simple_interest", "Simple interest flowchart");
      if (/factorial|factorial.*loop|loop.*factorial/.test(q)) return flow("factorial", "Factorial flowchart");
      if (/prime|prime number/.test(q)) return flow("prime", "Prime number flowchart");
      if (/student result|grade|marks.*result/.test(q)) return flow("student_result", "Student result flowchart");
      if (/atm|withdrawal|cash/.test(q)) return flow("atm", "ATM withdrawal flowchart");
      if (/current generation|generate electricity|generation of electricity|electric(?:al)? power generation|power generation/.test(q)) return flow("current_generation", "Electrical power generation flowchart");
      return flow("generic", "Flowchart");
    }
    if (/block diagram|communication system|ബ്ലോക്ക് ഡയഗ്രാം/.test(q)) return withDepartment({ type: "block_diagram", title: "Block diagram" });
    if (/sine|sinusoidal|ac waveform|sine wave/.test(q)) return withDepartment({ type: "sine_wave", title: "AC sine waveform" });
    if (/square wave/.test(q)) return withDepartment({ type: "square_wave", title: "Square waveform" });
    if (/triangular|triangle wave/.test(q)) return withDepartment({ type: "triangle_wave", title: "Triangular waveform" });
    if (/half[- ]wave.*waveform/.test(q)) return withDepartment({ type: "half_wave_waveform", title: "Half-wave rectified waveform" });
    if (/full[- ]wave.*waveform/.test(q)) return withDepartment({ type: "full_wave_waveform", title: "Full-wave rectified waveform" });
    if (/nand gate/.test(q)) return withDepartment({ type: "logic_gate", variant: "NAND", title: "NAND gate" });
    if (/nor gate/.test(q)) return withDepartment({ type: "logic_gate", variant: "NOR", title: "NOR gate" });
    if (/and gate/.test(q)) return withDepartment({ type: "logic_gate", variant: "AND", title: "AND gate" });
    if (/or gate/.test(q)) return withDepartment({ type: "logic_gate", variant: "OR", title: "OR gate" });
    if (/not gate|inverter/.test(q)) return withDepartment({ type: "logic_gate", variant: "NOT", title: "NOT gate" });
    const symbolMap = [
      ["zener diode", "zener", "Zener diode symbol"], ["photodiode", "photodiode", "Photodiode symbol"], ["schottky", "schottky", "Schottky diode symbol"], ["varactor", "varactor", "Varactor diode symbol"], ["led", "led", "LED symbol"], ["diode", "diode", "Diode symbol"], ["npn transistor", "npn", "NPN transistor symbol"], ["pnp transistor", "pnp", "PNP transistor symbol"], ["mosfet", "mosfet", "MOSFET symbol"], ["jfet", "jfet", "JFET symbol"], ["scr", "scr", "SCR symbol"], ["triac", "triac", "TRIAC symbol"], ["diac", "diac", "DIAC symbol"], ["variable resistor", "variable_resistor", "Variable resistor symbol"], ["potentiometer", "potentiometer", "Potentiometer symbol"], ["polarized capacitor", "polarized_capacitor", "Polarized capacitor symbol"], ["capacitor", "capacitor", "Capacitor symbol"], ["inductor|coil", "inductor", "Inductor symbol"], ["switch", "switch", "Switch symbol"], ["battery", "battery", "Battery symbol"], ["ac source|ac supply", "ac_source", "AC source symbol"], ["dc source|dc supply", "dc_source", "DC source symbol"], ["ground|earth", "ground", "Ground symbol"], ["fuse", "fuse", "Fuse symbol"], ["lamp|bulb", "lamp", "Lamp symbol"], ["resistor", "resistor", "Resistor symbol"]
    ];
    for (const [pattern, variant, title] of symbolMap) if (new RegExp(pattern).test(q)) return withDepartment({ type: "symbol", variant, title });
    if (/circuit|schematic|connections?/.test(q)) return withDepartment({ type: "basic_circuit", title: "Basic circuit schematic" });
    if (/graph|plot/.test(q)) return withDepartment({ type: "sine_wave", title: "Engineering graph" });
    // Do not invent a circuit for an underspecified request such as
    // “Create a diagram of the system”; let the AI answer or ask for the
    // system/topic instead of showing a misleading technical graphic.
    return null;
  }

  function symbolBody(kind) {
    const y = 220;
    const lead = ln(90, y, 300, y) + ln(540, y, 750, y);
    if (kind === "resistor" || kind === "variable_resistor" || kind === "potentiometer") {
      const resistor = path(`M300 ${y} h25 l14 -22 28 44 28 -44 28 44 28 -44 28 44 14 -22 h25`);
      const extra = kind === "variable_resistor" ? arrow(350, 135, 470, 290, "wire arrow component") : kind === "potentiometer" ? arrow(350, 135, 410, 210, "wire arrow component") : "";
      return lead + resistor + extra + tx(420, 90, kind === "resistor" ? "R" : kind === "variable_resistor" ? "VR" : "POT", "component-label");
    }
    if (kind === "capacitor" || kind === "polarized_capacitor") {
      const plus = kind === "polarized_capacitor" ? tx(355, 160, "+", "polarity") : "";
      return ln(90, y, 350, y) + ln(490, y, 750, y) + ln(350, 165, 350, 275, "component") + ln(490, 165, 490, 275, "component") + plus + tx(420, 90, kind === "polarized_capacitor" ? "C (polarized)" : "C", "component-label");
    }
    if (kind === "inductor") return ln(90, y, 300, y) + path(`M300 ${y} c0 -45 45 -45 45 0s45 45 45 0 45 -45 45 0 45 45 45 0 45 -45 45 0 h30`) + ln(540, y, 750, y) + tx(420, 90, "L", "component-label");
    if (kind === "switch") return ln(90, y, 340, y) + ln(500, y, 750, y) + ln(340, y, 430, 165, "component") + dot(340, y) + dot(500, y) + tx(420, 90, "SW", "component-label");
    if (kind === "battery") return ln(90, y, 350, y) + ln(490, y, 750, y) + ln(350, 165, 350, 275, "component") + ln(380, 145, 380, 295, "component") + ln(460, 165, 460, 275, "component") + ln(490, 145, 490, 295, "component") + tx(370, 130, "+", "polarity") + tx(470, 130, "−", "polarity") + tx(420, 90, "Battery", "component-label");
    if (kind === "dc_source" || kind === "ac_source") {
      const inside = kind === "dc_source" ? `${ln(392, 198, 448, 198, "component")} ${tx(420, 188, "+", "polarity")}` : path("M390 220 q15 -30 30 0t30 0", "component");
      return lead + `<circle cx="420" cy="220" r="58" class="component"/>${inside}${tx(420, 120, kind === "dc_source" ? "DC" : "AC", "component-label")}`;
    }
    if (kind === "ground") return ln(420, 115, 420, 220) + ln(370, 220, 470, 220, "component") + ln(385, 238, 455, 238, "component") + ln(400, 256, 440, 256, "component") + tx(420, 300, "GND", "component-label");
    if (kind === "fuse") return ln(90, y, 330, y) + `<rect x="330" y="188" width="180" height="64" rx="10" class="component"/>` + path("M350 220 q30 -38 60 0t60 0t60 0", "component") + ln(510, y, 750, y) + tx(420, 150, "F1", "component-label");
    if (kind === "lamp") return lead + `<circle cx="420" cy="220" r="54" class="component"/>` + ln(390, 190, 450, 250, "component") + ln(450, 190, 390, 250, "component") + tx(420, 120, "Lamp", "component-label");
    if (["diode", "zener", "led", "photodiode", "schottky", "varactor"].includes(kind)) {
      const cathode = kind === "zener" ? path("M480 172 l-12 18 M480 268 l-12 -18", "component") : kind === "schottky" ? ln(480, 170, 480, 270, "component") + ln(493, 178, 493, 262, "component") : ln(480, 170, 480, 270, "component");
      const arrows = kind === "led" ? arrow(475, 155, 525, 115, "light-arrow") + arrow(505, 155, 555, 115, "light-arrow") : kind === "photodiode" ? arrow(535, 110, 490, 165, "light-arrow") + arrow(565, 130, 520, 185, "light-arrow") : "";
      const left = ln(90, y, 300, y) + ln(300, y, 350, y);
      const right = ln(490, y, 540, y) + ln(540, y, 750, y);
      return left + `<polygon points="350,170 350,270 470,220" class="component-fill"/>` + cathode + right + arrows + tx(420, 90, kind === "zener" ? "D (Zener)" : kind === "led" ? "LED" : kind === "photodiode" ? "Photodiode" : kind === "schottky" ? "Schottky" : "D", "component-label") + tx(275, 205, "A", "terminal") + tx(555, 205, "K", "terminal");
    }
    if (["npn", "pnp"].includes(kind)) {
      const inward = kind === "npn" ? arrow(430, 270, 455, 270, "component-arrow") : arrow(455, 270, 430, 270, "component-arrow");
      return `<circle cx="420" cy="220" r="72" class="component"/>${ln(420, 155, 420, 285, "component")} ${ln(300, 220, 420, 220, "component")} ${ln(420, 175, 505, 120, "component")} ${ln(420, 265, 505, 320, "component")} ${inward}${tx(420, 95, kind.toUpperCase() + " transistor", "component-label")}${tx(275, 210, "B", "terminal")}${tx(530, 120, "C", "terminal")}${tx(530, 325, "E", "terminal")}`;
    }
    if (["mosfet", "jfet"].includes(kind)) {
      return ln(90, y, 315, y) + ln(525, 150, 525, 290, "component") + ln(525, 150, 700, 150, "component") + ln(525, 290, 700, 290, "component") + ln(315, 150, 315, 290, "component") + ln(245, 220, 315, 220, "component") + (kind === "mosfet" ? arrow(480, 210, 515, 210, "component-arrow") : "") + tx(420, 90, kind.toUpperCase(), "component-label");
    }
    if (["scr", "triac", "diac"].includes(kind)) {
      const center = kind === "triac" ? path("M355 185 L455 220 L355 255 Z M485 185 L385 220 L485 255 Z", "component-fill") : path("M350 170 L350 270 L470 220 Z", "component-fill");
      const gate = kind === "scr" || kind === "triac" ? ln(300, 290, 380, 250, "component") + tx(285, 300, "G", "terminal") : "";
      return ln(90, y, 350, y) + center + ln(470, y, 750, y) + ln(480, 170, 480, 270, "component") + gate + tx(420, 90, kind.toUpperCase(), "component-label");
    }
    return ln(90, y, 750, y) + tx(420, 90, "Component", "component-label");
  }

  function transformerBody(variant) {
    const ratio = variant === "step-up" ? "N₂ > N₁" : variant === "step-down" ? "N₂ < N₁" : "N₁ : N₂";
    return `<g>${tx(225, 70, "PRIMARY", "section-label")}${tx(615, 70, "SECONDARY", "section-label")}${tx(420, 75, "MAGNETIC CORE", "section-label")}<rect x="392" y="105" width="18" height="230" class="core"/><rect x="430" y="105" width="18" height="230" class="core"/>${path("M280 140 c-38 0-38 35 0 35s38 35 0 35 38 35 0 35 38 35 0 35", "coil")}${path("M560 140 c38 0 38 35 0 35s-38 35 0 35-38 35 0 35 38 35 0 35", "coil")}${ln(90, 140, 280, 140)}${ln(90, 315, 280, 315)}${ln(560, 140, 750, 140)}${ln(560, 315, 750, 315)}${tx(145, 125, "AC input", "terminal")}${tx(695, 125, "AC output", "terminal")}${tx(420, 385, ratio, "value-label")}</g>`;
  }

  function zenerRegulatorBody() {
    const zener = `<polygon points="360,165 420,165 390,215" class="component-fill"/>${path("M355 225 l12 -10 M425 225 l-12 -10", "component")}`;
    return `${tx(90, 55, "Vin", "terminal", "start")}${ln(90, 100, 220, 100)}${path("M220 100 h30 l12 -22 24 44 24 -44 24 44 24 -22 h30", "component")}${tx(295, 70, "R1", "component-label")}${ln(390, 100, 650, 100)}${dot(390, 100)}${tx(420, 72, "Vout", "terminal", "start")}${ln(390, 100, 390, 165)}${zener}${ln(390, 225, 390, 295)}${tx(470, 190, "Zener", "component-label", "start")}${ln(650, 100, 650, 165)}${path("M620 165 h30 l12 -22 24 44 24 -44 24 44 24 -22 h30", "component")}${tx(650, 150, "RL", "component-label")}${ln(650, 225, 650, 295)}${ln(390, 295, 390, 330)}${ln(650, 295, 650, 330)}${ln(360, 330, 680, 330, "component")}${ln(410, 345, 630, 345, "component")}${tx(520, 380, "GND", "component-label")}${tx(390, 150, "Vz", "value-label")}${tx(650, 150, "Load", "value-label")}`;
  }

  function bridgeBody() {
    return `${tx(420, 35, "BRIDGE RECTIFIER", "section-label")}${tx(110, 210, "AC", "terminal")}${tx(730, 210, "AC", "terminal")}${ln(130, 210, 245, 210)}${ln(595, 210, 710, 210)}${path("M245 210 L420 80 L595 210 L420 340 Z", "wire")}${path("M300 170 L350 132 L365 148", "component")}${ln(360, 140, 380, 155, "component")}${path("M475 132 L525 170 L505 185", "component")}${ln(460, 155, 480, 140, "component")}${path("M300 250 L350 288 L365 272", "component")}${ln(360, 280, 380, 265, "component")}${path("M475 288 L525 250 L505 235", "component")}${ln(460, 265, 480, 280, "component")}${ln(420, 80, 420, 40)}${tx(420, 30, "+", "polarity")}${ln(420, 340, 420, 380)}${tx(420, 410, "− / GND", "polarity")}${ln(420, 80, 640, 80)}${path("M640 80 v70 h-22 l12 24 12 -24", "component")}${ln(640, 174, 640, 300)}${path("M640 300 h-38 l-12 20 24 40 24 -40 24 40 24 -40 12 20 h38", "component")}${tx(640, 290, "RL", "component-label")}`;
  }

  function halfWaveBody(full = false) {
    return `${tx(420, 35, full ? "FULL-WAVE RECTIFIER" : "HALF-WAVE RECTIFIER", "section-label")}${`<circle cx="150" cy="210" r="58" class="component"/>`}${path("M120 210 q15 -30 30 0t30 0", "component")}${tx(150, 130, "AC", "component-label")}${ln(208, 210, 300, 210)}${path("M300 210 h25 l14 -22 28 44 28 -44 28 44 14 -22 h25", "component")}${tx(365, 175, "D1", "component-label")}${ln(462, 210, 560, 210)}${path("M560 210 h-35 l-12 20 24 40 24 -40 24 40 24 -40 12 20 h35", "component")}${tx(595, 175, "RL", "component-label")}${ln(595, 290, 595, 330)}${ln(150, 268, 150, 330)}${ln(150, 330, 595, 330, "component")}${tx(420, 380, "Output across load", "value-label")}${wavePath(full ? "full" : "half", 110, 410, 620, 410)}`;
  }

  function wrapFlowText(value, maxChars = 22) {
    const words = String(value || "").split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    words.forEach((word) => {
      if (!line || `${line} ${word}`.length <= maxChars) line = line ? `${line} ${word}` : word;
      else { lines.push(line); line = word; }
    });
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }

  function flowchartData(intent = {}) {
    const ml = intent.language === "ml";
    const labels = ml ? { start: "START", input: "നമ്പർ നൽകുക", decision: "N % 2 == 0?", yes: "YES", no: "NO", even: "EVEN", odd: "ODD", end: "END" } : { start: "START", input: "Input N", decision: "N % 2 == 0?", yes: "YES", no: "NO", even: "Print EVEN", odd: "Print ODD", end: "END" };
    if (intent.variant === "current_generation") {
      return {
        flowchartType: "current_generation",
        direction: "LR",
        nodes: [
          { id: "start", type: "start_end", text: "START", rank: 0 },
          { id: "source", type: "input_output", text: "Energy source\n(water / steam / wind / solar)", rank: 1 },
          { id: "prime", type: "process", text: "Prime mover\n(turbine / engine)", rank: 2 },
          { id: "generator", type: "process", text: "Generator converts\nmechanical energy to AC", rank: 3 },
          { id: "transformer", type: "process", text: "Step-up transformer\nraises voltage", rank: 4 },
          { id: "grid", type: "process", text: "Transmit through\npower grid", rank: 5 },
          { id: "end", type: "start_end", text: "Electric power\nto consumers", rank: 6 }
        ],
        edges: [
          { source: "start", target: "source" },
          { source: "source", target: "prime" },
          { source: "prime", target: "generator" },
          { source: "generator", target: "transformer" },
          { source: "transformer", target: "grid" },
          { source: "grid", target: "end" }
        ],
        description: "Electrical power generation: an energy source drives a prime mover, the generator converts mechanical energy into AC electrical energy, a step-up transformer raises the voltage, and the power is transmitted through the grid to consumers.",
        text: "Flowchart: START → Energy source → Prime mover → AC generator → Step-up transformer → Power grid → Consumers"
      };
    }
    if (intent.variant === "odd_even" || intent.variant === "generic" || !intent.variant) {
      return {
        flowchartType: "odd_even",
        direction: "TB",
        nodes: [
          { id: "start", type: "start_end", text: labels.start, rank: 0 },
          { id: "input", type: "input_output", text: labels.input, rank: 1 },
          { id: "decision", type: "decision", text: labels.decision, rank: 2 },
          { id: "even", type: "process", text: labels.even, rank: 3, branch: "left" },
          { id: "odd", type: "process", text: labels.odd, rank: 3, branch: "right" },
          { id: "end", type: "start_end", text: labels.end, rank: 4 }
        ],
        edges: [
          { source: "start", target: "input" },
          { source: "input", target: "decision" },
          { source: "decision", target: "even", label: labels.yes },
          { source: "decision", target: "odd", label: labels.no },
          { source: "even", target: "end" },
          { source: "odd", target: "end" }
        ],
        description: "Flowchart: Start → Input number N → Check whether N is divisible by 2 → If yes, display Even → otherwise display Odd → End.",
        text: `Flowchart: ${labels.start} → ${labels.input} → ${labels.decision} → ${labels.yes} → ${labels.even} / ${labels.no} → ${labels.odd} → ${labels.end}`
      };
    }
    const templates = {
      positive_negative_zero: { input: "Input N", decision: "N > 0?", yes: "Positive", no: "N < 0?", extra: "Zero", title: "Positive, negative or zero" },
      simple_interest: { input: "Input P, R, T", decision: "Calculate SI = PRT/100", yes: "Display SI", no: "Check inputs", title: "Simple interest" },
      factorial: { input: "Input N", decision: "N > 0?", yes: "Multiply and decrement", no: "Display factorial", title: "Factorial" },
      prime: { input: "Input N", decision: "Divisor found?", yes: "Not prime", no: "Prime", title: "Prime number" },
      student_result: { input: "Input marks", decision: "Marks >= pass?", yes: "Display grade", no: "Display Fail", title: "Student result" },
      atm: { input: "Insert card and PIN", decision: "PIN valid?", yes: "Enter amount", no: "Reject transaction", title: "ATM withdrawal" },
      largest_three: { input: "Input A, B, C", decision: "Compare values", yes: "Display largest", no: "Continue comparison", title: "Largest of three numbers" },
      pnp_npn: { input: "Identify transistor type", decision: "PNP or NPN?", yes: "PNP: base LOW → ON", no: "NPN: base HIGH → ON", title: "PNP and NPN transistor operation" }
    };
    const template = templates[intent.variant] || templates.positive_negative_zero;
    const data = flowchartData({ variant: "odd_even", language: intent.language });
    data.flowchartType = intent.variant;
    data.description = `Flowchart for ${template.title}: Start → ${template.input} → ${template.decision} → ${template.yes} or ${template.no} → End.`;
    data.text = `Flowchart: START → ${template.input} → ${template.decision} → ${template.yes} / ${template.no} → END`;
    data.nodes[1].text = template.input;
    data.nodes[2].text = template.decision;
    data.nodes[3].text = template.yes;
    data.nodes[4].text = template.no;
    return data;
  }

  function layoutFlowchart(data, width = 840) {
    const groups = new Map();
    data.nodes.forEach((node) => { const rank = Number(node.rank || 0); if (!groups.has(rank)) groups.set(rank, []); groups.get(rank).push(node); });
    const maxRank = Math.max(...groups.keys(), 0);
    const rowGap = 126;
    const top = 72;
    const positions = new Map();
    groups.forEach((nodes, rank) => {
      const branches = nodes.length > 1 ? nodes : [];
      const gap = Math.min(270, Math.max(210, (width - 180) / Math.max(nodes.length, 1)));
      const center = width / 2;
      nodes.forEach((node, index) => {
        const lines = wrapFlowText(node.text);
        const w = node.type === "decision" ? Math.max(190, Math.min(260, 150 + lines[0].length * 4)) : Math.max(150, Math.min(250, 96 + Math.max(...lines.map((line) => line.length), 8) * 6));
        const h = node.type === "decision" ? Math.max(108, 72 + lines.length * 18) : Math.max(56, 26 + lines.length * 20);
        let x = center;
        if (branches.length > 1) x = center + (index - (branches.length - 1) / 2) * gap;
        positions.set(node.id, { ...node, x, y: top + rank * rowGap, w, h, lines });
      });
    });
    const height = Math.max(570, top * 2 + maxRank * rowGap + 80);
    return { positions, width, height };
  }

  function flowNodeMarkup(node) {
    const x = node.x - node.w / 2;
    const y = node.y - node.h / 2;
    const text = node.lines.map((line, index) => tx(node.x, node.y - ((node.lines.length - 1) * 9) + index * 18 + 6, line, "flow-node-label"));
    if (node.type === "start_end") return `<rect x="${x}" y="${y}" width="${node.w}" height="${node.h}" rx="${node.h / 2}" class="flow-node flow-start"/>${text.join("")}`;
    if (node.type === "input_output") { const skew = 24; return `<polygon points="${x + skew},${y} ${x + node.w},${y} ${x + node.w - skew},${y + node.h} ${x},${y + node.h}" class="flow-node flow-input"/>${text.join("")}`; }
    if (node.type === "decision") { return `<polygon points="${node.x},${y} ${x + node.w},${node.y} ${node.x},${y + node.h} ${x},${node.y}" class="flow-node flow-decision"/>${text.join("")}`; }
    return `<rect x="${x}" y="${y}" width="${node.w}" height="${node.h}" rx="10" class="flow-node flow-process"/>${text.join("")}`;
  }

  function flowEdgeMarkup(edge, positions) {
    const source = positions.get(edge.source); const target = positions.get(edge.target); if (!source || !target) return "";
    const sameColumn = Math.abs(source.x - target.x) < 8;
    let d; let labelX; let labelY;
    if (sameColumn) { d = `M ${source.x} ${source.y + source.h / 2} L ${target.x} ${target.y - target.h / 2}`; labelX = source.x + 14; labelY = (source.y + target.y) / 2; }
    else if (target.x < source.x) { const sx = source.x - source.w * .38; const sy = source.y + source.h * .12; const txp = target.x + target.w * .25; const typ = target.y - target.h / 2; d = `M ${sx} ${sy} L ${txp} ${typ}`; labelX = (sx + txp) / 2 - 4; labelY = (sy + typ) / 2 - 8; }
    else { const sx = source.x + source.w * .38; const sy = source.y + source.h * .12; const txp = target.x - target.w * .25; const typ = target.y - target.h / 2; d = `M ${sx} ${sy} L ${txp} ${typ}`; labelX = (sx + txp) / 2 + 4; labelY = (sy + typ) / 2 - 8; }
    return `${path(d, "flow-edge")}${edge.label ? tx(labelX, labelY, edge.label, "flow-branch-label") : ""}`;
  }

  function flowchartBody(intent = {}) {
    const data = flowchartData(intent);
    const layout = layoutFlowchart(data);
    const edges = data.edges.map((edge) => flowEdgeMarkup(edge, layout.positions)).join("");
    const nodes = data.nodes.map((node) => flowNodeMarkup(layout.positions.get(node.id))).join("");
    return { body: `${tx(layout.width / 2, 30, "FLOWCHART", "section-label")}${edges}${nodes}`, width: layout.width, height: layout.height, data };
  }

  function blockBody() {
    const labels = ["Information source", "Transmitter", "Channel", "Receiver", "Destination"];
    let out = tx(420, 35, "COMMUNICATION SYSTEM", "section-label");
    const xs = [35, 195, 355, 515, 675];
    labels.forEach((label, i) => { out += box(xs[i], 170, 130, 76, label, "block-shape"); if (i < labels.length - 1) out += arrow(xs[i] + 130, 208, xs[i + 1] - 10, 208); });
    return out;
  }

  function wavePath(kind, x0 = 70, y0 = 220, width = 700, height = 100) {
    let d = `M${x0} ${y0}`;
    const points = [];
    const count = 160;
    for (let i = 0; i <= count; i += 1) {
      const t = i / count;
      const x = x0 + t * width;
      let val = Math.sin(t * Math.PI * 4);
      if (kind === "half") val = Math.max(0, val);
      if (kind === "full") val = Math.abs(val);
      if (kind === "square") val = Math.sin(t * Math.PI * 4) >= 0 ? 1 : -1;
      if (kind === "triangle") val = 2 * Math.abs(2 * (t * 2 - Math.floor(t * 2 + .5))) - 1;
      const y = y0 - val * height / 2;
      points.push(`${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    d = points.join(" ");
    return `${ln(x0, y0, x0 + width + 25, y0, "axis")}${ln(x0, y0 + height / 2 + 25, x0, y0 - height / 2 - 25, "axis")}${path(d, "wave")}${tx(x0 + width + 35, y0 + 5, "t", "axis-label", "start")}${tx(x0 - 8, y0 - height / 2 - 32, "V", "axis-label")}`;
  }

  function waveformBody(kind) {
    const title = kind === "square" ? "SQUARE WAVE" : kind === "triangle" ? "TRIANGULAR WAVE" : kind === "half" ? "HALF-WAVE RECTIFIED OUTPUT" : kind === "full" ? "FULL-WAVE RECTIFIED OUTPUT" : "AC SINE WAVE";
    return tx(420, 35, title, "section-label") + wavePath(kind, 80, 220, 680, 180);
  }

  function logicBody(variant) {
    const isNot = variant === "NOT";
    const body = isNot ? `<polygon points="340,150 340,290 520,220" class="component-fill"/><circle cx="535" cy="220" r="12" class="component"/>` : `<path d="M330 150 H410 Q535 150 535 220 Q535 290 410 290 H330 Z" class="component-fill"/>${variant === "NAND" || variant === "NOR" ? '<circle cx="550" cy="220" r="12" class="component"/>' : ''}`;
    const name = variant || "AND";
    return tx(420, 45, `${name} GATE`, "section-label") + ln(90, 185, 330, 185) + ln(90, 255, 330, 255) + tx(110, 175, "A", "terminal") + tx(110, 245, "B", "terminal") + body + ln(isNot ? 547 : (name === "NAND" || name === "NOR" ? 562 : 535), 220, 750, 220) + tx(700, 205, "Y", "terminal");
  }

  function fourStrokeBody() {
    const stages = [[110, "1", "Intake"], [315, "2", "Compression"], [520, "3", "Power"], [725, "4", "Exhaust"]];
    let out = tx(420, 34, "FOUR-STROKE ENGINE", "section-label");
    stages.forEach(([x, number, label], index) => {
      out += `<rect x="${x - 72}" y="82" width="144" height="190" rx="24" class="component"/>`;
      out += `<rect x="${x - 46}" y="174" width="92" height="40" rx="8" class="component-fill"/>`;
      out += ln(x, 214, x, 292, "component");
      out += `<circle cx="${x}" cy="318" r="25" class="component"/>`;
      out += ln(x, 318, x + 42, 340, "component");
      out += tx(x, 62, `${number}. ${label}`, "component-label");
      out += tx(x, 115, index % 2 === 0 ? "valve" : "valves", "value-label");
      if (index < stages.length - 1) out += arrow(x + 78, 350, x + 125, 350);
    });
    return out + tx(420, 410, "Piston movement is converted into crankshaft rotation", "value-label");
  }

  function beamBody() {
    return `${tx(420, 36, "SIMPLY SUPPORTED BEAM", "section-label")}${ln(105, 205, 735, 205, "component")}${ln(105, 215, 735, 215, "component")}${path("M105 205 L72 270 H138 Z", "component-fill")}${path("M735 205 L702 270 H768 Z", "component-fill")}${path("M702 270 H768", "component")}${arrow(330, 100, 330, 195)}${arrow(420, 100, 420, 195)}${arrow(510, 100, 510, 195)}${tx(420, 82, "Applied loads", "value-label")}${arrow(105, 315, 105, 225)}${arrow(735, 315, 735, 225)}${tx(105, 345, "RA", "component-label")}${tx(735, 345, "RB", "component-label")}${tx(420, 270, "Span L", "value-label")}${tx(420, 395, "Reactions at supports balance the applied load", "value-label")}`;
  }

  function perspectiveBody() {
    return `${tx(420, 35, "ONE-POINT PERSPECTIVE", "section-label")}${ln(70, 185, 770, 185, "axis")}${dot(420, 185)}${tx(420, 165, "Vanishing point", "value-label")}${path("M420 185 L120 90 M420 185 L720 90 M420 185 L120 330 M420 185 L720 330", "wire")}${path("M120 90 H720 V330 H120 Z", "component")}${path("M260 140 H580 V285 H260 Z", "component")}${path("M420 185 L260 140 M420 185 L580 140 M420 185 L260 285 M420 185 L580 285", "wire")}${tx(420, 385, "Parallel lines appear to meet at one vanishing point", "value-label")}`;
  }

  function microcontrollerBody() {
    return `${tx(420, 35, "MICROCONTROLLER BLOCK DIAGRAM", "section-label")}${box(45, 170, 150, 76, "Sensors", "block-shape")}${box(250, 130, 220, 156, "Microcontroller", "block-shape")}${box(525, 170, 150, 76, "Actuators", "block-shape")}${arrow(195, 208, 240, 208)}${arrow(480, 208, 515, 208)}${box(315, 55, 90, 48, "Clock", "block-shape")}${arrow(360, 108, 360, 128)}${box(315, 320, 90, 48, "Power", "block-shape")}${arrow(360, 318, 360, 288)}${tx(360, 235, "CPU • memory • I/O", "value-label")}${tx(420, 410, "Embedded controller links inputs, processing and outputs", "value-label")}`;
  }

  function svgFor(intent) {
    const type = intent?.type || "basic_circuit";
    if (type === "four_stroke_engine") return frame(intent.title, fourStrokeBody(), 840, 440, "Four-stroke engine sequence with intake, compression, power and exhaust stages.");
    if (type === "simply_supported_beam") return frame(intent.title, beamBody(), 840, 430, "Simply supported beam with applied loads and support reactions.");
    if (type === "one_point_perspective") return frame(intent.title, perspectiveBody(), 840, 430, "One-point perspective drawing with horizon, vanishing point and receding lines.");
    if (type === "microcontroller_block") return frame(intent.title, microcontrollerBody(), 840, 440, "Microcontroller block diagram with sensors, processing core, clock, power and actuators.");
    if (type === "symbol") return frame(intent.title || "Electrical symbol", symbolBody(intent.variant), 840, 360, `${intent.title || "Electrical symbol"} with terminals and connection wires.`);
    if (type === "transformer") return frame(intent.title || "Transformer", transformerBody(intent.variant), 840, 430, "Transformer with primary and secondary windings, magnetic core, input and output.");
    if (type === "zener_regulator") return frame(intent.title, zenerRegulatorBody(), 840, 430, "Zener diode shunt voltage regulator with input resistor and load.");
    if (type === "bridge_rectifier") return frame(intent.title, bridgeBody(), 840, 450, "Bridge rectifier with four diode paths, AC input and DC output terminals.");
    if (type === "half_wave_rectifier") return frame(intent.title, halfWaveBody(false), 840, 480, "Half-wave rectifier circuit with AC source, diode and load resistor.");
    if (type === "full_wave_rectifier") return frame(intent.title, halfWaveBody(true), 840, 480, "Full-wave rectifier educational circuit and output reference.");
    if (type === "flowchart") { const chart = flowchartBody(intent); return frame(intent.title, chart.body, chart.width, chart.height, chart.data.description, chart.data.text); }
    if (type === "block_diagram") return frame(intent.title, blockBody(), 840, 430, "Communication system block diagram with directional arrows.");
    if (type === "logic_gate") return frame(intent.title, logicBody(intent.variant), 840, 420, `${intent.variant} logic gate symbol with inputs and output.`);
    if (type === "sine_wave") return frame(intent.title, waveformBody("sine"), 840, 430, "Sine waveform with axes and labels.");
    if (type === "square_wave") return frame(intent.title, waveformBody("square"), 840, 430, "Square waveform with axes and labels.");
    if (type === "triangle_wave") return frame(intent.title, waveformBody("triangle"), 840, 430, "Triangular waveform with axes and labels.");
    if (type === "half_wave_waveform") return frame(intent.title, waveformBody("half"), 840, 430, "Half-wave rectified waveform with axes and labels.");
    if (type === "full_wave_waveform") return frame(intent.title, waveformBody("full"), 840, 430, "Full-wave rectified waveform with axes and labels.");
    if (type === "basic_circuit") return frame(intent.title, `${tx(420, 45, "BASIC CIRCUIT", "section-label")}${ln(100, 220, 250, 220)}${path("M250 220 h25 l14 -22 28 44 28 -44 28 44 14 -22 h25", "component")}${tx(345, 175, "R1", "component-label")}${ln(412, 220, 550, 220)}${path("M550 220 h-30 l-12 20 24 40 24 -40 24 40 24 -40 12 20 h30", "component")}${tx(610, 175, "Load", "component-label")}${ln(600, 300, 600, 340)}${ln(260, 340, 600, 340, "component")}${tx(430, 385, "GND", "component-label")}`, 840, 430, "Basic connected circuit schematic.");
    return frame(intent.title || "Technical diagram", blockBody(), 840, 430, "Educational technical diagram.");
  }

  function render(intent) {
    if (!intent || !intent.type) return "";
    try { return svgFor(intent); }
    catch (error) {
      console.warn("Ask POLY diagram renderer failed", error);
      const fallback = textFor(intent);
      return `<figure class="ask-diagram ask-diagram-fallback" role="group" aria-label="${esc(intent.title || "Technical diagram")}"><figcaption><strong>Diagram rendering temporarily unavailable</strong></figcaption><p class="ask-diagram-fallback-note">${esc(fallback)}</p></figure>`;
    }
  }

  function textFor(intent) {
    if (intent?.type === "flowchart") return flowchartData(intent).text;
    return intent?.title ? `${intent.title} — graphical diagram` : "Graphical diagram";
  }

  function getSvg(id) { return registry.get(id)?.svg || ""; }

  function download(id, format) {
    const item = registry.get(id);
    if (!item) return;
    if (format === "svg") {
      const blob = new Blob([item.svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${id}.svg`; a.click(); URL.revokeObjectURL(url); return;
    }
    if (format === "png") {
      const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(item.svg)}`;
      const image = new Image();
      image.onload = () => { const canvas = document.createElement("canvas"); canvas.width = 1680; canvas.height = 860; const ctx = canvas.getContext("2d"); ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0, canvas.width, canvas.height); const a = document.createElement("a"); a.href = canvas.toDataURL("image/png"); a.download = `${id}.png`; a.click(); };
      image.src = svgUrl;
    }
  }

  function handle(action, figure) {
    if (!figure) return;
    const id = figure.dataset.diagramId;
    if (action === "download-svg") return download(id, "svg");
    if (action === "download-png") return download(id, "png");
    if (action === "fullscreen") return figure.requestFullscreen?.();
    const canvas = figure.querySelector(".ask-diagram-canvas");
    if (!canvas) return;
    const current = Number(figure.dataset.zoom || 1);
    const next = action === "zoom-in" ? Math.min(2.5, current + .2) : action === "zoom-out" ? Math.max(.6, current - .2) : 1;
    figure.dataset.zoom = String(next);
    canvas.style.transform = `scale(${next})`;
    canvas.style.transformOrigin = "top left";
    const reset = figure.querySelector('[data-diagram-action="zoom-reset"]');
    if (reset) reset.textContent = `${Math.round(next * 100)}%`;
  }

  window.AskPolyDiagrams = { detectIntent, render, handle, getSvg, textFor };
})();
