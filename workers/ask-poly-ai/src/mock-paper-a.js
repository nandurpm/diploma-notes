/* Purpose: Mock paper a - Descriptive comment added for clarity */
export const QUESTIONS_A = [
  {
    id: "Q1", maxMarks: 3,
    question: "State any three postulates of Bohr's atomic model. Mention one merit and one demerit of the model.",
    modelPoints: ["electrons occupy permitted stationary orbits", "no radiation in a stationary orbit", "angular momentum is quantised", "radiation occurs during transition", "explains hydrogen spectrum or atomic stability", "fails for multi-electron atoms or fine structure"],
    rubric: ["three valid postulates: 1.5", "one valid merit: 0.75", "one valid demerit: 0.75"]
  },
  {
    id: "Q2", maxMarks: 4,
    question: "Explain the four quantum numbers. Using Aufbau principle, Pauli exclusion principle and Hund's rule, write the electronic configuration of calcium (atomic number 20).",
    modelPoints: ["n: principal shell and energy", "l: subshell and shape", "m: orientation", "s: electron spin", "Ca: 1s2 2s2 2p6 3s2 3p6 4s2"],
    rubric: ["four quantum numbers with meanings: 2", "correct use or explanation of the three filling rules: 1", "correct calcium configuration: 1"]
  },
  {
    id: "Q3", maxMarks: 4,
    question: "Differentiate ionic, covalent and coordinate bonds with one suitable example each. Explain why water shows anomalous behaviour due to hydrogen bonding.",
    modelPoints: ["ionic bond by electron transfer, e.g. NaCl", "covalent bond by sharing, e.g. H2 or HF", "coordinate bond has shared pair donated by one atom, e.g. NH4+", "hydrogen bonding causes unusually high boiling point, surface tension and related properties of water"],
    rubric: ["three bond definitions: 1.5", "three suitable examples: 0.75", "hydrogen bonding and anomalous water properties: 1.75"]
  },
  {
    id: "Q4", maxMarks: 4,
    question: "Calculate the de Broglie wavelength of an electron moving with a velocity of 2.0 × 10^6 m/s. Use h = 6.626 × 10^-34 J s and electron mass = 9.11 × 10^-31 kg.",
    numericTarget: "lambda = h/(mv) = 3.64 × 10^-10 m approximately",
    modelPoints: ["lambda = h/mv", "correct substitution", "answer approximately 3.64e-10 m"],
    rubric: ["formula: 1", "substitution: 1", "correct result with reasonable rounding: 1.5", "unit: 0.5"]
  },
  {
    id: "Q5", maxMarks: 4,
    question: "Calculate the molarity of a solution prepared by dissolving 4.0 g of NaOH in water and making the final volume 500 mL. Molar mass of NaOH = 40 g/mol.",
    numericTarget: "moles = 4/40 = 0.1 mol; volume = 0.5 L; molarity = 0.20 mol/L",
    modelPoints: ["moles = mass/molar mass", "volume converted to litres", "M = moles/volume", "0.20 M"],
    rubric: ["moles: 0.8", "volume conversion: 0.5", "formula and substitution: 1.2", "correct result: 1", "unit: 0.5"]
  },
  {
    id: "Q6", maxMarks: 4,
    question: "20 mL of 0.10 N HCl exactly neutralises 25 mL of NaOH solution. Calculate the normality of NaOH using the normality equation.",
    numericTarget: "N1V1 = N2V2; N(NaOH) = 0.10 × 20 / 25 = 0.08 N",
    modelPoints: ["N1V1 = N2V2", "correct substitution", "0.08 N"],
    rubric: ["normality equation: 1", "substitution: 1", "correct answer: 1.5", "unit: 0.5"]
  }
];
