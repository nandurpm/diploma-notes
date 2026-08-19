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

  function frame(title, body, width = 840, height = 430, description = "Educational technical diagram") {
    const id = `poly-diagram-${++sequence}`;
    const safeTitle = esc(title);
    const svg = `<svg class="ask-diagram-svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${id}-title ${id}-desc" xmlns="http://www.w3.org/2000/svg">${defs()}<title id="${id}-title">${safeTitle}</title><desc id="${id}-desc">${esc(description)}</desc><rect width="100%" height="100%" rx="18" class="diagram-surface"/>${body}</svg>`;
    registry.set(id, { svg, title });
    return `<figure class="ask-diagram" data-diagram-id="${id}"><figcaption><span class="ask-diagram-title"><strong>Diagram</strong><span>${safeTitle}</span></span><span class="ask-diagram-controls"><button type="button" data-diagram-action="zoom-out" aria-label="Zoom out">−</button><button type="button" data-diagram-action="zoom-reset" aria-label="Reset diagram zoom">100%</button><button type="button" data-diagram-action="zoom-in" aria-label="Zoom in">+</button><button type="button" data-diagram-action="download-svg">SVG</button><button type="button" data-diagram-action="download-png">PNG</button><button type="button" data-diagram-action="fullscreen" aria-label="Open diagram fullscreen">Full</button></span></figcaption><div class="ask-diagram-viewport"><div class="ask-diagram-canvas">${svg}</div></div></figure>`;
  }

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
  }

  function detectIntent(question) {
    const q = normalize(question);
    const visual = /(\bdraw\b|\bsketch\b|\bdiagram\b|\bcircuit\b|\bschematic\b|\bsymbol\b|\bwaveform\b|\bflowchart\b|\bblock diagram\b|\bwiring\b|\bconnection\b|\billustrate\b|\bshow (?:the )?(?:symbol|circuit|connections?)\b|\bconstruct\b|\brepresentation\b|\bplot\b|\bgraph\b|വരയ്ക്ക|കാണിക്ക|ചിത്രം|ഡയഗ്രാം|സിംബൽ|സർക്യൂട്ട്|വേവ്)/i.test(q);
    if (!visual) return null;
    if (/bridge\s*rectifier|ബ്രിഡ്ജ്.*റെക്ടിഫയർ/.test(q)) return { type: "bridge_rectifier", title: "Bridge rectifier circuit" };
    if (/half[- ]wave\s*rectifier/.test(q)) return { type: /waveform|output/.test(q) ? "half_wave_waveform" : "half_wave_rectifier", title: /waveform|output/.test(q) ? "Half-wave rectified waveform" : "Half-wave rectifier" };
    if (/full[- ]wave\s*rectifier|center[- ]tapped/.test(q)) return { type: /waveform|output/.test(q) ? "full_wave_waveform" : "full_wave_rectifier", title: "Full-wave rectifier" };
    if (/zener.*(?:regulator|circuit)|(?:regulator|circuit).*zener|voltage regulator/.test(q)) return { type: "zener_regulator", title: "Zener diode voltage regulator" };
    if (/step[- ]up.*transformer|transformer.*step[- ]up/.test(q)) return { type: "transformer", variant: "step-up", title: "Step-up transformer" };
    if (/step[- ]down.*transformer|transformer.*step[- ]down/.test(q)) return { type: "transformer", variant: "step-down", title: "Step-down transformer" };
    if (/transformer|ട്രാൻസ്ഫോർമർ/.test(q)) return { type: "transformer", title: "Transformer" };
    if (/flowchart|flow chart|decision process|ഫ്ലോചാർട്ട്/.test(q)) return { type: "flowchart", title: "Flowchart" };
    if (/block diagram|communication system|ബ്ലോക്ക് ഡയഗ്രാം/.test(q)) return { type: "block_diagram", title: "Block diagram" };
    if (/sine|sinusoidal|ac waveform|sine wave/.test(q)) return { type: "sine_wave", title: "AC sine waveform" };
    if (/square wave/.test(q)) return { type: "square_wave", title: "Square waveform" };
    if (/triangular|triangle wave/.test(q)) return { type: "triangle_wave", title: "Triangular waveform" };
    if (/half[- ]wave.*waveform/.test(q)) return { type: "half_wave_waveform", title: "Half-wave rectified waveform" };
    if (/full[- ]wave.*waveform/.test(q)) return { type: "full_wave_waveform", title: "Full-wave rectified waveform" };
    if (/nand gate/.test(q)) return { type: "logic_gate", variant: "NAND", title: "NAND gate" };
    if (/nor gate/.test(q)) return { type: "logic_gate", variant: "NOR", title: "NOR gate" };
    if (/and gate/.test(q)) return { type: "logic_gate", variant: "AND", title: "AND gate" };
    if (/or gate/.test(q)) return { type: "logic_gate", variant: "OR", title: "OR gate" };
    if (/not gate|inverter/.test(q)) return { type: "logic_gate", variant: "NOT", title: "NOT gate" };
    const symbolMap = [
      ["zener diode", "zener", "Zener diode symbol"], ["photodiode", "photodiode", "Photodiode symbol"], ["schottky", "schottky", "Schottky diode symbol"], ["varactor", "varactor", "Varactor diode symbol"], ["led", "led", "LED symbol"], ["diode", "diode", "Diode symbol"], ["npn transistor", "npn", "NPN transistor symbol"], ["pnp transistor", "pnp", "PNP transistor symbol"], ["mosfet", "mosfet", "MOSFET symbol"], ["jfet", "jfet", "JFET symbol"], ["scr", "scr", "SCR symbol"], ["triac", "triac", "TRIAC symbol"], ["diac", "diac", "DIAC symbol"], ["variable resistor", "variable_resistor", "Variable resistor symbol"], ["potentiometer", "potentiometer", "Potentiometer symbol"], ["polarized capacitor", "polarized_capacitor", "Polarized capacitor symbol"], ["capacitor", "capacitor", "Capacitor symbol"], ["inductor|coil", "inductor", "Inductor symbol"], ["switch", "switch", "Switch symbol"], ["battery", "battery", "Battery symbol"], ["ac source|ac supply", "ac_source", "AC source symbol"], ["dc source|dc supply", "dc_source", "DC source symbol"], ["ground|earth", "ground", "Ground symbol"], ["fuse", "fuse", "Fuse symbol"], ["lamp|bulb", "lamp", "Lamp symbol"], ["resistor", "resistor", "Resistor symbol"]
    ];
    for (const [pattern, variant, title] of symbolMap) if (new RegExp(pattern).test(q)) return { type: "symbol", variant, title };
    if (/circuit|schematic|connections?/.test(q)) return { type: "basic_circuit", title: "Basic circuit schematic" };
    if (/graph|plot/.test(q)) return { type: "sine_wave", title: "Engineering graph" };
    return { type: "basic_circuit", title: "Technical circuit diagram" };
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
    return `<g>${tx(225, 70, "PRIMARY", "section-label")}${tx(615, 70, "SECONDARY", "section-label")}${tx(420, 75, "MAGNETIC CORE", "section-label")}<rect x="392" y="105" width="18" height="230" class="core"/><rect x="430" y="105" width="18" height="230" class="core"/>${path("M280 140 c-38 0-38 35 0 35s38 35 0 35 38 35 0 35 38 35 0 35", "coil")}${path("M560 140 c38 0 38 35 0 35s-38 35 0 35-38 35 0 35 38 35 0 35", "coil")}${ln(90, 220, 242, 220)}${ln(278, 140, 278, 140)}${ln(278, 315, 278, 315)}${ln(598, 140, 750, 140)}${ln(598, 315, 750, 315)}${tx(145, 205, "AC input", "terminal")}${tx(695, 205, "AC output", "terminal")}${tx(420, 385, ratio, "value-label")}</g>`;
  }

  function zenerRegulatorBody() {
    return `${tx(90, 55, "Vin", "terminal", "start")}${ln(90, 80, 220, 80)}${path("M220 80 h30 l12 -20 24 40 24 -40 24 40 24 -20 h30", "component")}${tx(295, 50, "R1", "component-label")}${ln(390, 80, 650, 80)}${dot(390, 80)}${tx(420, 55, "Vout", "terminal", "start")}${ln(390, 80, 390, 160)}${path("M390 160 h-38 l-12 20 24 40 24 -40 24 40 24 -40 12 20 h38", "component")}${ln(390, 260, 390, 300)}${tx(390, 150, "Zener", "component-label")}${ln(650, 80, 650, 160)}${path("M650 160 h-38 l-12 20 24 40 24 -40 24 40 24 -40 12 20 h38", "component")}${ln(650, 260, 650, 300)}${tx(650, 150, "RL", "component-label")}${ln(390, 300, 390, 330)}${ln(650, 300, 650, 330)}${ln(360, 330, 680, 330, "component")}${ln(410, 345, 630, 345, "component")}${tx(520, 380, "GND", "component-label")}${tx(390, 116, "Vz", "value-label")}${tx(650, 116, "Load", "value-label")}`;
  }

  function bridgeBody() {
    return `${tx(420, 35, "BRIDGE RECTIFIER", "section-label")}${tx(110, 210, "AC", "terminal")}${tx(730, 210, "AC", "terminal")}${ln(130, 210, 245, 210)}${ln(595, 210, 710, 210)}${path("M245 210 L420 80 L595 210 L420 340 Z", "wire")}${path("M300 170 L350 132 L365 148", "component")}${ln(360, 140, 380, 155, "component")}${path("M475 132 L525 170 L505 185", "component")}${ln(460, 155, 480, 140, "component")}${path("M300 250 L350 288 L365 272", "component")}${ln(360, 280, 380, 265, "component")}${path("M475 288 L525 250 L505 235", "component")}${ln(460, 265, 480, 280, "component")}${ln(420, 80, 420, 40)}${tx(420, 30, "+", "polarity")}${ln(420, 340, 420, 380)}${tx(420, 410, "− / GND", "polarity")}${ln(420, 80, 640, 80)}${path("M640 80 v70 h-22 l12 24 12 -24", "component")}${ln(640, 174, 640, 300)}${path("M640 300 h-38 l-12 20 24 40 24 -40 24 40 24 -40 12 20 h38", "component")}${tx(640, 290, "RL", "component-label")}`;
  }

  function halfWaveBody(full = false) {
    return `${tx(420, 35, full ? "FULL-WAVE RECTIFIER" : "HALF-WAVE RECTIFIER", "section-label")}${`<circle cx="150" cy="210" r="58" class="component"/>`}${path("M120 210 q15 -30 30 0t30 0", "component")}${tx(150, 130, "AC", "component-label")}${ln(208, 210, 300, 210)}${path("M300 210 h25 l14 -22 28 44 28 -44 28 44 14 -22 h25", "component")}${tx(365, 175, "D1", "component-label")}${ln(462, 210, 560, 210)}${path("M560 210 h-35 l-12 20 24 40 24 -40 24 40 24 -40 12 20 h35", "component")}${tx(595, 175, "RL", "component-label")}${ln(595, 290, 595, 330)}${ln(150, 268, 150, 330)}${ln(150, 330, 595, 330, "component")}${tx(420, 380, "Output across load", "value-label")}${wavePath(full ? "full" : "half", 110, 410, 620, 410)}`;
  }

  function flowchartBody() {
    return `${tx(420, 35, "FLOWCHART", "section-label")}<ellipse cx="420" cy="85" rx="95" ry="32" class="flow-shape"/>${tx(420, 91, "START", "flow-label")}${arrow(420, 118, 420, 145)}${box(340, 145, 160, 54, "Input number", "flow-shape")}${arrow(420, 199, 420, 230)}<polygon points="420,230 535,285 420,340 305,285" class="flow-shape"/>${tx(420, 290, "Number > 0?", "flow-label")} ${arrow(305, 285, 190, 285)}${tx(250, 275, "NO", "branch-label")} ${box(90, 258, 160, 54, "Negative", "flow-shape")}${arrow(535, 285, 650, 285)}${tx(590, 275, "YES", "branch-label")} ${box(590, 258, 160, 54, "Positive", "flow-shape")}${arrow(170, 312, 170, 370)}${arrow(670, 312, 670, 370)}<ellipse cx="420" cy="390" rx="90" ry="26" class="flow-shape"/>${tx(420, 396, "END", "flow-label")}${path("M170 370 H420 V364", "wire")}${path("M670 370 H420 V364", "wire")}`;
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

  function svgFor(intent) {
    const type = intent?.type || "basic_circuit";
    if (type === "symbol") return frame(intent.title || "Electrical symbol", symbolBody(intent.variant), 840, 360, `${intent.title || "Electrical symbol"} with terminals and connection wires.`);
    if (type === "transformer") return frame(intent.title || "Transformer", transformerBody(intent.variant), 840, 430, "Transformer with primary and secondary windings, magnetic core, input and output.");
    if (type === "zener_regulator") return frame(intent.title, zenerRegulatorBody(), 840, 430, "Zener diode shunt voltage regulator with input resistor and load.");
    if (type === "bridge_rectifier") return frame(intent.title, bridgeBody(), 840, 450, "Bridge rectifier with four diode paths, AC input and DC output terminals.");
    if (type === "half_wave_rectifier") return frame(intent.title, halfWaveBody(false), 840, 480, "Half-wave rectifier circuit with AC source, diode and load resistor.");
    if (type === "full_wave_rectifier") return frame(intent.title, halfWaveBody(true), 840, 480, "Full-wave rectifier educational circuit and output reference.");
    if (type === "flowchart") return frame(intent.title, flowchartBody(), 840, 450, "Flowchart with start, process, decision and end shapes.");
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
    return svgFor(intent);
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

  window.AskPolyDiagrams = { detectIntent, render, handle, getSvg };
})();
