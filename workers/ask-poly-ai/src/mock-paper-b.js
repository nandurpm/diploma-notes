/* Purpose: Mock paper b - Descriptive comment added for clarity */
export const QUESTIONS_B = [
  {
    id: "Q7", maxMarks: 5,
    question: "Explain the stages of municipal water treatment in the correct sequence. Also distinguish temporary and permanent hardness and name one suitable method for removing hardness.",
    modelPoints: ["sedimentation", "coagulation", "filtration", "sterilisation by chlorination, bleaching or UV", "temporary hardness mainly bicarbonates", "permanent hardness mainly chlorides and sulphates", "lime-soda or ion-exchange method"],
    rubric: ["correct treatment sequence and explanation: 3", "temporary versus permanent hardness: 1", "suitable softening method: 1"]
  },
  {
    id: "Q8", maxMarks: 4,
    question: "Differentiate thermoplastics and thermosetting plastics. Give one example of each and state the monomers and two uses of any one of these polymers: polythene, PVC, Nylon-66 or Bakelite.",
    modelPoints: ["thermoplastics soften repeatedly on heating", "thermosets form cross-linked permanent structure", "examples", "correct monomer or monomers", "two valid uses"],
    rubric: ["difference: 1.5", "examples: 0.5", "correct monomer information: 1", "two uses: 1"]
  },
  {
    id: "Q9", maxMarks: 4,
    question: "Define nanomaterial and nanotechnology. Classify nanomaterials as 0D, 1D and 2D with one example each, and state two engineering applications of nanomaterials.",
    modelPoints: ["nanoscale material and manipulation or application at nanoscale", "0D: nanoparticle or fullerene", "1D: carbon nanotube or nanowire", "2D: graphene or thin film", "two valid applications"],
    rubric: ["definitions: 1", "classification with one example each: 2", "two applications: 1"]
  },
  {
    id: "Q10", maxMarks: 4,
    question: "Define corrosion and explain any two external corrosion-prevention methods from barrier protection, anodising, anti-rust treatment and sacrificial-anode cathodic protection.",
    modelPoints: ["gradual deterioration of metal by chemical or electrochemical interaction", "two correctly explained prevention methods"],
    rubric: ["definition: 0.5", "first method: 1.5", "second method: 1.5", "technical clarity or example: 0.5"]
  },
  {
    id: "Q11", maxMarks: 10,
    question: "State Faraday's first and second laws of electrolysis. Calculate the mass of silver deposited when a current of 2.0 A is passed for 30 minutes. Equivalent mass of silver = 108 g/equivalent and F = 96500 C/equivalent.",
    numericTarget: "Q = It = 2 × 1800 = 3600 C; m = EQ/F = 108 × 3600 / 96500 = 4.03 g approximately",
    modelPoints: ["first law: mass proportional to charge", "second law: masses for same charge proportional to chemical equivalents", "m = EIt/F", "time converted to 1800 s", "charge 3600 C", "mass about 4.03 g"],
    rubric: ["two laws: 3", "formula: 1", "time and charge calculation: 1", "substitution: 1", "correct result: 3", "unit: 1"]
  }
];
