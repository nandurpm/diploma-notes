/* Purpose: Mock exam paper - Descriptive comment added for clarity */
(() => {
  "use strict";

  const partA = [
    { id: "A1", number: "1", section: "A", marks: 1, module: "M1.02", type: "One word / sentence", question: "The region around the nucleus where the probability of finding an electron is maximum is called ________." },
    { id: "A2", number: "2", section: "A", marks: 1, module: "M1.03", type: "One word / sentence", question: "Name the chemical bond formed by sharing electron pairs between atoms." },
    { id: "A3", number: "3", section: "A", marks: 1, module: "M2.01", type: "One word / sentence", question: "Identify the solvent in an aqueous sodium chloride solution." },
    { id: "A4", number: "4", section: "A", marks: 1, module: "M2.01", type: "One word / sentence", question: "Name the acid-base indicator that is colourless in acid and pink in alkali." },
    { id: "A5", number: "5", section: "A", marks: 1, module: "M2.03", type: "One word / sentence", question: "Which type of hardness is caused mainly by bicarbonates of calcium and magnesium?" },
    { id: "A6", number: "6", section: "A", marks: 1, module: "M3.01", type: "One word / sentence", question: "Name the alloy formed mainly from copper and zinc." },
    { id: "A7", number: "7", section: "A", marks: 1, module: "M3.01", type: "One word / sentence", question: "Which type of glass is commonly used for laboratory glassware?" },
    { id: "A8", number: "8", section: "A", marks: 1, module: "M4.02", type: "One word / sentence", question: "Name the charge carriers in an electrolyte." },
    { id: "A9", number: "9", section: "A", marks: 1, module: "M4.01", type: "One word / sentence", question: "Name the reaction that occurs at the anode of an electrochemical cell." }
  ];

  const partB = [
    { id: "B1", number: "1", section: "B", marks: 3, module: "M1.01", type: "Short answer / numerical", question: "Write the de Broglie relation and explain its terms. Calculate the wavelength of a 0.50 kg body moving at 20 m/s. Use h = 6.626 × 10⁻³⁴ J s." },
    { id: "B2", number: "2", section: "B", marks: 3, module: "M1.03", type: "Short answer", question: "Explain any three anomalous properties of water produced by hydrogen bonding." },
    { id: "B3", number: "3", section: "B", marks: 3, module: "M2.03", type: "Short answer", question: "Explain the lime-soda process for removing temporary hardness of water." },
    { id: "B4", number: "4", section: "B", marks: 3, module: "M2.02", type: "Numerical", question: "Calculate the pH of 0.005 M hydrochloric acid. Show the formula and final value." },
    { id: "B5", number: "5", section: "B", marks: 3, module: "M2.01", type: "Numerical", question: "Calculate the normality of a KMnO₄ solution if 250 mL contains 3.95 g KMnO₄. Equivalent mass of KMnO₄ = 31.6 g/equivalent." },
    { id: "B6", number: "6", section: "B", marks: 3, module: "M3.03", type: "Short answer", question: "Define nanomaterial and give two suitable examples." },
    { id: "B7", number: "7", section: "B", marks: 3, module: "M3.02", type: "Short answer", question: "What is vulcanisation of rubber? State any two advantages of vulcanised rubber." },
    { id: "B8", number: "8", section: "B", marks: 3, module: "M3.02", type: "Short answer", question: "Differentiate thermoplastics and thermosetting plastics using any three points." },
    { id: "B9", number: "9", section: "B", marks: 3, module: "M4.01", type: "Short answer", question: "Differentiate metallic conductors and electrolytic conductors using any three points." },
    { id: "B10", number: "10", section: "B", marks: 3, module: "M4.04", type: "Short answer", question: "Write the anodic, cathodic and overall cell reactions of a Daniell cell." }
  ];

  const partC = [
    { id: "C1A", number: "III", pair: "C1", option: "A", section: "C", marks: 7, module: "M1", type: "Long answer", question: "a) Explain ionic and covalent bonds with one suitable example each. (5 marks)\nb) State Pauli exclusion principle. (2 marks)" },
    { id: "C1B", number: "IV", pair: "C1", option: "B", section: "C", marks: 7, module: "M1", type: "Long answer", question: "State the main postulates of Bohr's atomic model and explain any two merits of the model." },
    { id: "C2A", number: "V", pair: "C2", option: "A", section: "C", marks: 7, module: "M2", type: "Long answer", question: "a) Draw or describe the flow chart for producing potable water for municipal supply. (5 marks)\nb) State any two disadvantages of using hard water in boilers. (2 marks)" },
    { id: "C2B", number: "VI", pair: "C2", option: "B", section: "C", marks: 7, module: "M2", type: "Long answer / numerical", question: "a) A hydrochloric acid solution contains 1.825 g HCl in 250 mL. Calculate its normality and the volume required to neutralise 40 mL of 0.20 N NaOH. (5 marks)\nb) Define buffer solution. (2 marks)" },
    { id: "C3A", number: "VII", pair: "C3", option: "A", section: "C", marks: 7, module: "M2", type: "Long answer", question: "a) Explain important applications of pH. (5 marks)\nb) Differentiate equivalent point and end point of a titration. (2 marks)" },
    { id: "C3B", number: "VIII", pair: "C3", option: "B", section: "C", marks: 7, module: "M2", type: "Long answer", question: "a) Explain disadvantages of hard water in domestic and industrial use. (4 marks)\nb) Define ionic product of water and write its expression. (3 marks)" },
    { id: "C4A", number: "IX", pair: "C4", option: "A", section: "C", marks: 7, module: "M3", type: "Long answer", question: "Explain addition polymerisation and condensation polymerisation with one suitable example for each." },
    { id: "C4B", number: "X", pair: "C4", option: "B", section: "C", marks: 7, module: "M3", type: "Long answer", question: "What is a refractory material? Explain its important characteristics and engineering applications." },
    { id: "C5A", number: "XI", pair: "C5", option: "A", section: "C", marks: 7, module: "M4", type: "Long answer", question: "Define electrolysis and explain the electroplating of a steel spoon with nickel, including electrolyte, electrodes and reactions." },
    { id: "C5B", number: "XII", pair: "C5", option: "B", section: "C", marks: 7, module: "M4", type: "Long answer / numerical", question: "State Faraday's second law. A Ni(NO₃)₂ solution is electrolysed using 4.0 A for 25 minutes. Calculate the mass of nickel deposited. Atomic mass of Ni = 58.7 g mol⁻¹ and F = 96500 C mol⁻¹." },
    { id: "C6A", number: "XIII", pair: "C6", option: "A", section: "C", marks: 7, module: "M4", type: "Long answer", question: "Explain external corrosion-prevention methods, including barrier protection, anodising, anti-rust treatment and sacrificial-anode protection." },
    { id: "C6B", number: "XIV", pair: "C6", option: "B", section: "C", marks: 7, module: "M4", type: "Long answer", question: "What is an electrochemical cell? Write any three differences between galvanic and electrolytic cells." }
  ];

  globalThis.PolyMock1004 = {
    paperId: "1004-applied-chemistry-model-75",
    subjectCode: "1004",
    totalMarks: 75,
    durationSeconds: 180 * 60,
    questions: [...partA, ...partB, ...partC],
    partA,
    partB,
    partC,
    pairs: ["C1", "C2", "C3", "C4", "C5", "C6"],
    state: {
      client: null,
      user: null,
      answers: Object.create(null),
      selections: { partB: [], partC: Object.create(null) },
      startedAt: null,
      timerId: null,
      submitting: false
    }
  };
})();
