/* Purpose: Mock exam papers - Descriptive comment added for clarity */
(() => {
  "use strict";

  const META = {
    "1002": ["1002-engineering-mathematics-model-75", "Engineering Mathematics", "Engineering Mathematics Official-Pattern Mock Examination", "Engineering Mathematics · 1002", "Revision 2026 · First Semester · Common to all Diploma Programmes", "Engineering Mathematics Mock Examination", "Course Code 1002 · English · Official model-question-paper pattern"],
    "2002B": ["2002b-engineering-physics-model-75", "Engineering Physics", "Engineering Physics Official-Pattern Mock Examination", "Engineering Physics · 2002B", "Revision 2026 · Second Semester · Common to all Diploma Programmes", "Engineering Physics Mock Examination", "Course Code 2002B · English · Official model-question-paper pattern"],
    "2003A": ["2003a-chemistry-practices-model-75", "Chemistry Practices", "Chemistry Practices Official-Pattern Mock Examination", "Chemistry Practices · 2003A", "Revision 2026 · Second Semester · Common to all Diploma Programmes", "Chemistry Practices Mock Examination", "Course Code 2003A · English · Official model-question-paper pattern"],
    "2005": ["2005-environmental-ethics-model-75", "Environmental Sustainability", "Environmental Sustainability Official-Pattern Mock Examination", "Environmental Sustainability · 2005", "Revision 2026 · Second Semester · Common to all Diploma Programmes", "Environmental Sustainability Mock Examination", "Course Code 2005 · English · Official model-question-paper pattern"],
    "3001": ["3001-indian-constitution-model-75", "Indian Constitution", "Indian Constitution Official-Pattern Mock Examination", "Indian Constitution · 3001", "Revision 2026 · Third Semester · Common to all Diploma Programmes", "Indian Constitution Mock Examination", "Course Code 3001 · English · Official model-question-paper pattern"]
  };

  const DATA = {
    "1002": {
      A: [
        ["M1.01", "Find the conjugate of 5 - 7i.", ["5 + 7i", "5+7i"]],
        ["M1.02", "Write the slope-intercept form of a straight line.", ["y = mx + c", "y=mx+c"]],
        ["M2.01", "How many radians are equal to 180 degrees?", ["pi", "π"]],
        ["M2.03", "Write the formula for sin(A + B).", ["sinA cosB + cosA sinB", "sin a cos b + cos a sin b"]],
        ["M3.02", "Evaluate lim x tends to 0 of sin x / x.", ["1"]],
        ["M3.04", "State the derivative of x power n with respect to x.", ["n x", "nx"]],
        ["M3.04", "Differentiate log x with respect to x.", ["1/x"]],
        ["M4.02", "Name the method used when x and y are connected in one equation and dy/dx is required.", ["implicit differentiation"]],
        ["M4.03", "The derivative of dy/dx with respect to x is called the ______ derivative.", ["second"]]
      ],
      B: [
        ["M1.01", "Find the sum and difference of 4 - 3i and -2 + 5i.", ["2+2i", "6-8i", "sum", "difference"]],
        ["M1.01", "Find the modulus and amplitude of 1 + root3 i.", ["modulus", "2", "amplitude", "60", "pi/3"]],
        ["M1.02", "Find the equation of the straight line with x-intercept 4 and y-intercept 6.", ["x/4", "y/6", "1", "3x+2y=12"]],
        ["M1.04", "Find the equation of a line parallel to 3x - 2y + 5 = 0 and passing through (2, -1).", ["slope", "3/2", "parallel", "3x-2y", "8"]],
        ["M2.02", "If tan theta = 3/4 and theta is acute, find sin theta and cos theta.", ["3/5", "4/5", "right triangle"]],
        ["M2.03", "Prove that sin(A + B) + sin(A - B) = 2 sinA cosB.", ["sin(a+b)", "sin(a-b)", "2sin", "cos"]],
        ["M3.02", "Evaluate lim x tends to 2 of (x squared - 4)/(x - 2).", ["factor", "x+2", "4"]],
        ["M3.04", "Differentiate y = x squared sin x with respect to x.", ["product rule", "2x sin x", "x^2 cos x"]],
        ["M4.02", "If x = a sec theta and y = b tan theta, express dy/dx.", ["dy/dtheta", "dx/dtheta", "sec", "tan"]],
        ["M4.03", "Find the second derivative of y = 3x squared - 8x + 4.", ["6x-8", "second", "6"]]
      ],
      C: [
        ["III", "M1", "Multiply (4 - i)(3 - 5i) and find the modulus of -1 + root3 i.", ["22", "7i", "modulus", "2", "amplitude"]],
        ["IV", "M1", "Find the equation of the line passing through (-2,5) and parallel to x + y - 3 = 0.", ["slope", "-1", "y-5", "x+2", "x+y-3"]],
        ["V", "M1", "Find the point of intersection of 2x + y = 7 and x - y = 2, and find the angle between the lines.", ["intersection", "3", "1", "slope", "perpendicular"]],
        ["VI", "M2", "Prove the compound-angle formula for cos(A + B) and use it to evaluate cos75 degrees.", ["cosa cosb", "sina sinb", "75", "root6", "root2"]],
        ["VII", "M2", "Show that cos20 cos40 cos80 = 1/8.", ["identity", "cos20", "cos40", "cos80", "1/8"]],
        ["VIII", "M2", "Derive tan(A + B) and state one application of compound angles.", ["tan", "sine", "cosine", "1-tana tanb"]],
        ["IX", "M3", "Evaluate a suitable algebraic limit and differentiate y=(x squared - 1)/(x squared + 1).", ["limit", "quotient rule", "x squared + 1", "x squared - 1"]],
        ["X", "M3", "Differentiate y=x squared sec x and derive the derivatives of tan x and cot x using quotient rule.", ["product rule", "sec", "tan", "quotient rule"]],
        ["XI", "M4", "For x=a sec theta, y=b tan theta, find dy/dx and explain the steps.", ["dy/dtheta", "dx/dtheta", "b sec squared", "a sec tan"]],
        ["XII", "M4", "If x squared + y squared = 25, find dy/dx and d2y/dx2.", ["implicit", "dy/dx", "-x/y", "second"]],
        ["XIII", "M4", "Differentiate log(sec x + tan x) and one more composite function using chain rule.", ["sec x", "chain rule", "log", "tan"]],
        ["XIV", "M4", "If y = x sin x, prove that d2y/dx2 + y = 2 cos x.", ["product rule", "second derivative", "2cosx"]]
      ]
    },
    "2002B": {
      A: [
        ["M1.01", "The unit of frequency of a wave is ______.", ["hertz", "Hz"]],
        ["M1.02", "As wavelength decreases at constant velocity, frequency will ______.", ["increase"]],
        ["M2.02", "The unit of power of lens is ______.", ["dioptre"]],
        ["M2.03", "The nature of lens used in simple microscope is ______.", ["convex"]],
        ["M2.04", "Brilliance of diamond is due to ______.", ["total internal reflection"]],
        ["M3.01", "Coulomb is the SI unit of ______.", ["charge", "electric charge"]],
        ["M3.04", "Ammeter measures ______.", ["current"]],
        ["M4.01", "The majority charge carriers in p-type semiconductor are ______.", ["holes"]],
        ["M4.01", "Adding impurity to a semiconductor is called ______.", ["doping"]]
      ],
      B: [
        ["M1.01", "Show that SHM is the projection of uniform circular motion.", ["projection", "circle", "diameter", "SHM"]],
        ["M1.03", "What are ultrasonic waves? Give applications.", ["ultrasonic", "20 kHz", "cleaning", "medical"]],
        ["M1.04", "State methods to control reverberation time.", ["absorber", "curtain", "acoustic", "surface"]],
        ["M2.01", "Distinguish glass plate, convex lens and concave mirror by image observation.", ["image", "lens", "mirror", "glass"]],
        ["M2.02", "Suggest methods to reduce lens defects.", ["chromatic", "spherical", "aperture", "combination"]],
        ["M3.02", "Evaluate the factors affecting resistance of a material.", ["length", "area", "resistivity", "temperature"]],
        ["M3.02", "Explain series combination of resistances.", ["series", "sum", "current", "resistance"]],
        ["M3.02", "Find resistance for colour code red, orange and black.", ["23", "ohm", "colour code"]],
        ["M4.02", "Explain the principle behind photocells.", ["photoelectric", "light", "current"]],
        ["M4.04", "What do you understand by nanoparticles?", ["nano", "1 to 100", "nanometre"]]
      ],
      C: [
        ["III", "M1", "Explain wavelength, frequency and wave velocity and derive their relation.", ["wavelength", "frequency", "velocity", "v=f"]],
        ["IV", "M1", "A heart beats 75 times per minute. Calculate frequency and period.", ["75", "1.25", "0.8", "period"]],
        ["V", "M2", "Refractive index of water is 1.33 and glass is 1.5. Find index of glass with respect to water.", ["1.5", "1.33", "ratio", "1.13"]],
        ["VI", "M2", "A convex lens of power 0.04 dioptre forms an image twice the object size. Find object position.", ["power", "focal length", "magnification", "lens"]],
        ["VII", "M2", "A real image is twice object size using convex lens of focal length 20 cm. Find object distance.", ["real image", "magnification", "20", "lens formula"]],
        ["VIII", "M2", "What is optical fibre and how is light propagated through it?", ["optical fibre", "total internal reflection", "core", "cladding"]],
        ["IX", "M3", "Show that meter bridge is an application of Wheatstone network.", ["meter bridge", "wheatstone", "balance"]],
        ["X", "M3", "Explain how Kirchhoff laws are applied in Wheatstone bridge.", ["kirchhoff", "wheatstone", "current", "loop"]],
        ["XI", "M3", "Convert a 15 ohm galvanometer with 2 mA full-scale current into a 4 A ammeter.", ["galvanometer", "shunt", "parallel", "4 A"]],
        ["XII", "M3", "Explain resistor colour code and find value for red, red, orange and gold.", ["red", "orange", "gold", "22k", "tolerance"]],
        ["XIII", "M4", "What are the characteristics of lasers? Define spontaneous and stimulated emission.", ["laser", "coherent", "monochromatic", "stimulated"]],
        ["XIV", "M4", "Explain different types of lasers.", ["He-Ne", "semiconductor", "laser", "population"]]
      ]
    },
    "2003A": {
      A: [
        ["M1.02", "The region around the nucleus where the probability of finding an electron is maximum is called ________.", ["orbital"]],
        ["M1.03", "Name the chemical bond formed by sharing electron pairs between atoms.", ["covalent bond"]],
        ["M2.01", "Identify the solvent in an aqueous sodium chloride solution.", ["water"]],
        ["M2.01", "Name the acid-base indicator that is colourless in acid and pink in alkali.", ["phenolphthalein"]],
        ["M2.03", "Which type of hardness is caused mainly by bicarbonates of calcium and magnesium?", ["temporary hardness", "temporary"]],
        ["M3.01", "Name the alloy formed mainly from copper and zinc.", ["brass"]],
        ["M3.01", "Which type of glass is commonly used for laboratory glassware?", ["borosilicate", "pyrex"]],
        ["M4.02", "Name the charge carriers in an electrolyte.", ["ions"]],
        ["M4.01", "Name the reaction that occurs at the anode of an electrochemical cell.", ["oxidation"]]
      ],
      B: [
        ["M1.01", "Write the de Broglie relation and explain its terms. Calculate the wavelength of a 0.50 kg body moving at 20 m/s. Use h = 6.626 × 10⁻³⁴ J s.", ["de broglie", "6.626", "wavelength"]],
        ["M1.03", "Explain any three anomalous properties of water produced by hydrogen bonding.", ["hydrogen bonding", "anomalous", "water"]],
        ["M2.03", "Explain the lime-soda process for removing temporary hardness of water.", ["lime-soda", "hardness", "removal"]],
        ["M2.02", "Calculate the pH of 0.005 M hydrochloric acid. Show the formula and final value.", ["pH", "2.3", "log"]],
        ["M2.01", "Calculate the normality of a KMnO₄ solution if 250 mL contains 3.95 g KMnO₄. Equivalent mass of KMnO₄ = 31.6 g/equivalent.", ["normality", "0.5"]],
        ["M3.03", "Define nanomaterial and give two suitable examples.", ["nanomaterial", "particles"]],
        ["M3.02", "What is vulcanisation of rubber? State any two advantages of vulcanised rubber.", ["vulcanisation", "rubber"]],
        ["M3.02", "Differentiate thermoplastics and thermosetting plastics using any three points.", ["thermoplastic", "thermosetting"]],
        ["M4.01", "Differentiate metallic conductors and electrolytic conductors using any three points.", ["metallic", "electrolytic"]],
        ["M4.04", "Write the anodic, cathodic and overall cell reactions of a Daniell cell.", ["daniell", "anode", "cathode"]]
      ],
      C: [
        ["III", "M1", "Explain ionic and covalent bonds with one suitable example each. State Pauli exclusion principle.", ["ionic", "covalent", "pauli"]],
        ["IV", "M1", "State the main postulates of Bohr's atomic model and explain any two merits of the model.", ["bohr", "postulates", "merits"]],
        ["V", "M2", "Draw or describe the flow chart for producing potable water for municipal supply.", ["potable water", "municipal"]],
        ["VI", "M2", "A hydrochloric acid solution contains 1.825 g HCl in 250 mL. Calculate its normality and volume required to neutralise 40 mL of 0.20 N NaOH.", ["normality", "neutralise"]],
        ["VII", "M2", "Explain important applications of pH. Differentiate equivalent point and end point of a titration.", ["pH applications", "equivalent", "end point"]],
        ["VIII", "M2", "Explain disadvantages of hard water in domestic and industrial use. Define ionic product of water and write its expression.", ["hard water", "domestic", "industrial", "ionic product"]],
        ["IX", "M3", "Explain addition polymerisation and condensation polymerisation with one suitable example for each.", ["addition", "condensation", "polymerisation"]],
        ["X", "M3", "What is a refractory material? Explain its important characteristics and engineering applications.", ["refractory", "characteristics", "applications"]],
        ["XI", "M4", "Define electrolysis and explain the electroplating of a steel spoon with nickel, including electrolyte, electrodes and reactions.", ["electrolysis", "electroplating", "nickel"]],
        ["XII", "M4", "State Faraday's second law. A Ni(NO₃)₂ solution is electrolysed using 4.0 A for 25 minutes. Calculate the mass of nickel deposited.", ["faraday", "nickel", "deposited"]],
        ["XIII", "M4", "Explain external corrosion-prevention methods, including barrier protection, anodising, anti-rust treatment and sacrificial-anode protection.", ["corrosion", "prevention", "anodising"]],
        ["XIV", "M4", "What is an electrochemical cell? Write any three differences between galvanic and electrolytic cells.", ["electrochemical", "galvanic", "electrolytic"]]
      ]
    },
    "2005": {
      A: [
        ["M2.02", "What is air pollution?", ["contamination of air", "air contamination"]],
        ["M1.05", "What is greenhouse effect?", ["trapping of heat"]],
        ["M3.04", "Name two new energy resources.", ["hydrogen", "tidal", "geothermal", "ocean"]],
        ["M4.03", "What is solid waste management?", ["collection", "disposal", "management of waste"]],
        ["M2.02", "State two advantages of cyclone separators.", ["simple", "low cost", "particulate"]],
        ["M1.05", "Name two pollutants responsible for ozone depletion.", ["cfc", "chlorofluorocarbon"]],
        ["M2.04", "Name the instrument used to measure noise level.", ["sound level meter"]],
        ["M1.03", "Name two classifications of aquatic ecosystem.", ["lentic", "lotic"]],
        ["M4.04", "What is the purpose of pollution control acts?", ["prevent", "control", "pollution"]]
      ],
      B: [
        ["M2.02", "Explain classification of air pollutants.", ["primary", "secondary", "particulate", "gaseous"]],
        ["M4.07", "Explain ISO 14000.", ["environmental management", "standard", "industry"]],
        ["M4.01", "Explain the sources of solid waste.", ["municipal", "industrial", "biomedical", "e-waste"]],
        ["M3.01", "Write a note on solar water heater.", ["collector", "solar", "heat", "water"]],
        ["M4.03", "Explain the effects of solid waste pollution.", ["land", "water", "health", "odour"]],
        ["M1.05", "What are the consequences of global warming?", ["temperature", "sea level", "climate", "ice"]],
        ["M2.02", "Explain the working of catalytic converters.", ["catalyst", "exhaust", "carbon monoxide", "nitrogen oxides"]],
        ["M2.04", "Explain the effects of noise pollution.", ["hearing", "stress", "sleep", "health"]],
        ["M1.03", "Write a note on aquatic ecosystems.", ["lentic", "lotic", "pond", "river"]],
        ["M1.05", "What is the role of ozone in the stratosphere?", ["uv", "protect", "radiation"]]
      ],
      C: [
        ["III", "M2", "What is air pollution? Explain control of gaseous pollutants.", ["air pollution", "absorber", "catalytic", "control"]],
        ["IV", "M4", "Explain the salient features of the water pollution prevention and control act.", ["water act", "board", "standard", "control"]],
        ["V", "M1", "Explain major terrestrial ecosystems.", ["forest", "grassland", "desert", "biotic"]],
        ["VI", "M4", "Explain disposal methods of solid waste.", ["3R", "landfill", "compost", "energy recovery"]],
        ["VII", "M4", "Explain the role of central and state pollution control boards.", ["central", "state", "monitoring", "standards"]],
        ["VIII", "M1", "Explain carbon and nitrogen cycles with diagrams.", ["carbon", "nitrogen", "cycle", "atmosphere"]],
        ["IX", "M2", "What are the sources and effects of water pollution?", ["sources", "domestic", "industrial", "BOD", "COD"]],
        ["X", "M3", "What is tidal energy? Explain its merits and demerits.", ["tidal", "renewable", "ocean", "merits"]],
        ["XI", "M3", "What is geothermal energy? Explain its merits and demerits.", ["geothermal", "earth heat", "renewable", "power"]],
        ["XII", "M1", "Explain causes and effects of global warming.", ["greenhouse", "carbon dioxide", "temperature", "sea level"]],
        ["XIII", "M2", "Explain sources and effects of air pollution.", ["source", "vehicle", "industry", "health"]],
        ["XIV", "M3", "Write a note on hydrogen energy and ocean energy.", ["hydrogen", "ocean", "tidal", "wave"]]
      ]
    },
    "3001": {
      A: [
        ["M1.01", "Who is regarded as the Father of the Indian Constitution?", ["Dr. B. R. Ambedkar", "Ambedkar"]],
        ["M1.02", "The Preamble was amended by which constitutional amendment act?", ["42nd Amendment", "42"]],
        ["M1.03", "How many fundamental rights are currently recognized in the Indian Constitution?", ["six", "6"]],
        ["M1.04", "Which fundamental right covers the abolition of untouchability?", ["Right to Equality", "Article 17"]],
        ["M2.01", "From which country's constitution were the Directive Principles of State Policy borrowed?", ["Ireland", "Irish"]],
        ["M2.02", "Under which article of the Constitution are Fundamental Duties defined?", ["Article 51A", "51A"]],
        ["M3.01", "What is the minimum age required to become the President of India?", ["35"]],
        ["M3.02", "Who appoints the Chief Justice of India?", ["The President"]],
        ["M4.01", "Which amendment introduced local self-governments (panchayats) in rural areas?", ["73rd Amendment", "73"]]
      ],
      B: [
        ["M1.01", "Explain the significance of the Preamble to the Indian Constitution.", ["preamble", "soul", "key", "objectives"]],
        ["M1.02", "Discuss the right to constitutional remedies under Article 32.", ["remedies", "article 32", "writs", "heart"]],
        ["M1.03", "State any three fundamental duties of Indian citizens.", ["duties", "respect", "heritage", "unity"]],
        ["M2.01", "Differentiate between Fundamental Rights and Directive Principles.", ["rights", "principles", "justiciable", "non-justiciable"]],
        ["M2.02", "Explain the concept of secularism as practiced in India.", ["secularism", "equal respect", "religion"]],
        ["M3.01", "Explain the powers and functions of the President of India.", ["executive", "legislative", "judicial", "emergency"]],
        ["M3.02", "Explain the composition and jurisdiction of the Supreme Court of India.", ["composition", "original", "appellate", "advisory"]],
        ["M4.01", "What is the NITI Aayog? State its key functions.", ["niti", "planning", "cooperative", "think tank"]],
        ["M4.02", "Describe the role of the Election Commission of India.", ["elections", "conduct", "free and fair", "supervision"]],
        ["M4.03", "Write a short note on the Panchayati Raj system.", ["panchayat", "local", "three-tier", "73rd"]]
      ],
      C: [
        ["III", "M1", "Explain the key salient features of the Indian Constitution.", ["written", "flexible", "rigid", "federal", "unitary"]],
        ["IV", "M1", "Discuss the fundamental rights guaranteed under the Right to Freedom.", ["freedom", "speech", "assembly", "association", "movement"]],
        ["V", "M2", "Explain the Directive Principles of State Policy and classify them into socialist, Gandhian and liberal-intellectual principles.", ["directive principles", "socialist", "gandhian", "liberal"]],
        ["VI", "M2", "Explain the procedure for amending the Indian Constitution under Article 368.", ["amendment", "article 368", "majority", "parliament"]],
        ["VII", "M3", "Explain the structure, powers and law-making procedure of the Indian Parliament.", ["parliament", "lok sabha", "rajya sabha", "bill"]],
        ["VIII", "M3", "Discuss the emergency provisions under Articles 352, 356 and 360 of the Constitution.", ["emergency", "national", "state", "financial"]],
        ["IX", "M3", "Explain the appointment, role and functions of the Prime Minister and the Council of Ministers.", ["prime minister", "appointment", "cabinet", "leadership"]],
        ["X", "M3", "Describe the structure and powers of State Governments, including Governor and Chief Minister.", ["state", "governor", "chief minister", "powers"]],
        ["XI", "M4", "Discuss the federal structure of India and explain the distribution of legislative and executive powers between Union and States.", ["federal", "union list", "state list", "concurrent"]],
        ["XII", "M4", "Explain the role, composition and functions of the Finance Commission of India.", ["finance commission", "distribution", "taxes", "revenue"]],
        ["XIII", "M4", "Discuss the constitutional safeguards for weaker sections, including Scheduled Castes and Scheduled Tribes.", ["safeguards", "reservation", "commission", "sc/st"]],
        ["XIV", "M4", "Explain the historical background and the role of the Constituent Assembly in drafting the Indian Constitution.", ["historical", "constituent assembly", "drafting committee", "ambedkar"]]
      ]
    }
  };

  function build(code, d) {
    const m = META[code];
    const exactAnswers = {};
    const keywords = {};
    const partA = d.A.map((item, i) => {
      const id = `A${i + 1}`;
      exactAnswers[id] = item[2];
      return { id, number: String(i + 1), section: "A", marks: 1, module: item[0], type: "One word / sentence", question: item[1] };
    });
    const partB = d.B.map((item, i) => {
      const id = `B${i + 1}`;
      keywords[id] = item[2];
      return { id, number: String(i + 1), section: "B", marks: 3, module: item[0], type: "Short answer / numerical", question: item[1] };
    });
    const partC = d.C.map((item, i) => {
      const pair = `C${Math.floor(i / 2) + 1}`;
      const id = `${pair}${i % 2 ? "B" : "A"}`;
      keywords[id] = item[3];
      return { id, number: item[0], pair, option: i % 2 ? "B" : "A", section: "C", marks: 7, module: item[1], type: "Long answer", question: item[2] };
    });
    return { paperId: m[0], subjectCode: code, displayName: m[1], examTitle: m[2], resultTitle: m[3], heroEyebrow: m[4], heroTitle: m[5], heroSubtitle: m[6], historyTitle: `Your recent ${code} attempts`, totalMarks: 75, durationSeconds: 10800, pairs: ["C1", "C2", "C3", "C4", "C5", "C6"], exactAnswers, keywords, partA, partB, partC, questions: [...partA, ...partB, ...partC], state: { client: null, user: null, answers: Object.create(null), selections: { partB: [], partC: Object.create(null) }, startedAt: null, timerId: null, submitting: false } };
  }

  globalThis.PolyMockPapers = Object.fromEntries(Object.entries(DATA).map(([code, data]) => [code, build(code, data)]));
})();
