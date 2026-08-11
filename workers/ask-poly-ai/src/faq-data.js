/* Purpose: Preloaded Ask POLY question-and-answer pairs.
 *
 * HOW TO ADD A NEW Q&A:
 * 1. Copy one of the objects below and paste it before the closing "];".
 * 2. "questions" is a list of ways someone might phrase the SAME question.
 *    Add as many phrasings as you can think of (including short/typo'd ones) —
 *    more phrasings = more likely a real student's wording gets matched.
 * 3. "answer" is exactly what Ask POLY will reply with. Plain text only
 *    (no HTML). Use \n\n for a new paragraph.
 * 4. Save the file and re-deploy the Worker (see the deploy instructions
 *    you were given). No other file needs to change.
 *
 * Matching is NOT case-sensitive and ignores punctuation, so you do not
 * need to add "?" or capitalized versions separately.
 *
 * NOTE ON PRIVACY: Do not add the developer's GitHub username, repo name,
 * or repo links to any answer below. Only the support email and phone
 * number (already used in the entries below) should be shared with users.
 */

export const FAQ_ENTRIES = [
  // ---------------------------------------------------------------------
  // 1. SITE OVERVIEW
  // ---------------------------------------------------------------------
  {
    id: "what-is-poly-pmna",
    questions: [
      "what is poly pmna",
      "what is polypmna",
      "about poly pmna",
      "what is this website",
      "what is this site about",
      "what is this website for",
      "explain poly pmna",
      "tell me about this site",
      "poly pmna website"
    ],
    answer: "POLY PMNA (polypmna.dpdns.org) is a bilingual Kerala Polytechnic study hub covering Revision 2026 and Revision 2021 syllabus, subject-wise handbooks and notes, official SITTTR syllabus links, mock exams, 2015 archive materials, 40 student tools/calculators, and Ask POLY AI for study and general questions. It is a free student initiative by SFI Perinthalmanna Poly Unit."
  },
  {
    id: "who-runs-poly-pmna",
    questions: [
      "who made this website",
      "who created poly pmna",
      "who runs this site",
      "who owns poly pmna",
      "who is behind poly pmna",
      "who developed this website",
      "who is the developer"
    ],
    answer: "POLY PMNA is an initiative by SFI Perinthalmanna Poly Unit, built and maintained by its student developer team. For contact, corrections or support you can email nandakumarmkdpm@gmail.com or call 9746445461."
  },
  {
    id: "is-poly-pmna-free",
    questions: [
      "is poly pmna free",
      "is this website free",
      "do i need to pay",
      "is there a subscription",
      "is ask poly ai free",
      "any hidden charges"
    ],
    answer: "Yes, POLY PMNA is 100% free and open access. Notes, syllabus links, mock exams, student tools and Ask POLY AI are all free to use — no login fee or subscription is required for the core study content."
  },
  {
    id: "site-navigation-menu",
    questions: [
      "what pages are on this website",
      "what is in the menu",
      "site navigation",
      "what sections does this website have",
      "list website pages"
    ],
    answer: "The main menu has: Home, About, Revision 2026, Revision 2021, Mock Exams, Ask POLY AI, 2015 Materials, Tools, and Help. Each revision page lists departments and semesters; Tools has 40 calculators; Help is where you report problems or contact support."
  },

  // ---------------------------------------------------------------------
  // 2. REVISION / CURRICULUM
  // ---------------------------------------------------------------------
  {
    id: "revision-2026-vs-2021",
    questions: [
      "difference between revision 2026 and revision 2021",
      "what is revision 2026",
      "what is revision 2021",
      "which revision should i use",
      "rev 2026 vs rev 2021",
      "how to choose my revision",
      "which syllabus am i in"
    ],
    answer: "Revision 2026 is the current curriculum for ongoing standard semesters (42 programme pages), while Revision 2021 is the previous scheme kept as a legacy archive (43 programme pages). Use whichever matches the scheme your department and admission year follow — check your official syllabus or ask your department if unsure. Never mix subject codes between the two revisions."
  },
  {
    id: "how-to-find-subject",
    questions: [
      "how do i find my subject",
      "how to search for a subject",
      "how to find notes for my subject",
      "how do i find my department page",
      "how to use the subject finder",
      "search subjects revision 2026"
    ],
    answer: "On the Home page, use the Quick Subject Finder: choose your curriculum revision (2026 or 2021) first, then search by subject code or title, and filter by department and semester. Always double-check the subject code, since names can look similar across different semesters."
  },
  {
    id: "2015-materials",
    questions: [
      "what is 2015 materials",
      "where are old notes",
      "older scheme notes",
      "2015 scheme materials",
      "archive materials",
      "workshop resources and lab manuals"
    ],
    answer: "2015 Materials is the archive section for the older 2015 scheme — it has department folders, model question papers, workshop resources and lab manuals for students who are still under that older curriculum."
  },
  {
    id: "sitttr-links",
    questions: [
      "what is sitttr",
      "official syllabus link",
      "where is the official syllabus",
      "sitttr kerala syllabus"
    ],
    answer: "SITTTR (State Institute of Technical Teachers Training and Research) is the official body that publishes the Kerala Polytechnic syllabus. POLY PMNA links directly to official SITTTR syllabus PDFs and sample question papers on each department/subject page so you can verify details against the official source."
  },

  // ---------------------------------------------------------------------
  // 3. ASK POLY AI
  // ---------------------------------------------------------------------
  {
    id: "what-is-ask-poly-ai",
    questions: [
      "what is ask poly ai",
      "what can ask poly ai do",
      "how does ask poly ai work",
      "who are you",
      "what are you",
      "introduce yourself"
    ],
    answer: "Ask POLY AI is the study assistant built into POLY PMNA. It helps you find subjects, lessons, notes and website sections, explains diploma/engineering concepts, answers general study questions, and can also do quick calculations, unit conversions and tell you the current date/time — all in one chat, in English or Malayalam."
  },
  {
    id: "ask-poly-ai-languages",
    questions: [
      "does ask poly ai support malayalam",
      "can i ask in malayalam",
      "malayalam support",
      "bilingual support",
      "does this site have malayalam"
    ],
    answer: "Yes. POLY PMNA has a Malayalam toggle on pages like About, and Ask POLY AI can understand and reply in Malayalam or English. Technical terms are usually kept in English even when the explanation is in Malayalam, so subject terminology stays accurate."
  },
  {
    id: "ask-poly-ai-not-working",
    questions: [
      "ask poly ai is not working",
      "ask poly ai not responding",
      "ai is down",
      "ai error",
      "chatbot not working",
      "ask poly ai offline"
    ],
    answer: "If Ask POLY AI's full response isn't available right now, it can still answer common site questions instantly and handle basic calculations, unit conversions and date/time questions without needing the AI service. For anything else, please try again shortly, or report the issue via Help with the page URL and a short description."
  },

  // ---------------------------------------------------------------------
  // 4. MOCK EXAMS
  // ---------------------------------------------------------------------
  {
    id: "mock-exams",
    questions: [
      "what are mock exams",
      "how do daily quizzes work",
      "where do i practice questions",
      "mock exam page",
      "daily quiz",
      "how to attempt mock test"
    ],
    answer: "Mock Exams offers Revision 2026 daily quizzes and mock-exam practice with saved scores and instant feedback, so you can test your understanding and spot weak topics before the real exam."
  },

  // ---------------------------------------------------------------------
  // 5. TOOLS / CALCULATORS
  // ---------------------------------------------------------------------
  {
    id: "tools-overview",
    questions: [
      "what tools are available",
      "list of tools",
      "what calculators do you have",
      "student tools page",
      "how many tools",
      "what can i calculate on this site"
    ],
    answer: "The Tools page has 40 student tools across six categories:\n\nCalculator: Scientific Calculator, Basic Calculator, Unit Converter, Percentage Calculator, Ratio Calculator, Average Calculator.\n\nElectrical/Electronics: Ohm's Law, Electrical Power, Voltage Divider, Resistor Color Code, Series and Parallel Resistance, Capacitor Code, LED Resistor, Transformer Ratio, Battery Backup, Wire Size and Voltage Drop.\n\nCivil: Concrete Mix, Brick Quantity, Cement/Sand/Aggregate Estimator, Area, Volume, Unit Weight.\n\nMechanical: Rotational to Linear Speed, Torque, Power/Torque/RPM, Gear Ratio, Pressure Converter, Temperature Converter.\n\nAcademic: CGPA and SGPA, Attendance Percentage, Internal Marks, Passing Marks, Study Planner, Revision Timer.\n\nText/Document: Grammar Helper, Word Counter, Case Converter, Text Cleaner, Application Letter, Lab Record Formatter.\n\nOpen the Tools page from the menu, or the static catalogue if JavaScript is unavailable. Results are estimates — verify units and standards before engineering use."
  },
  {
    id: "cgpa-sgpa-calculator",
    questions: [
      "how to calculate cgpa",
      "how to calculate sgpa",
      "cgpa calculator",
      "sgpa formula",
      "what is cgpa",
      "cgpa vs sgpa"
    ],
    answer: "SGPA (semester grade point average) is the credit-weighted average of grade points you scored in one semester: SGPA = (sum of credit x grade point for each subject) / (sum of credits). CGPA (cumulative grade point average) is the same weighted average taken across all completed semesters. Use the CGPA and SGPA tool under Tools > Academic — enter each subject's credits and grade, and it computes this automatically."
  },
  {
    id: "attendance-calculator",
    questions: [
      "how to calculate attendance percentage",
      "attendance percentage formula",
      "how much attendance do i need",
      "minimum attendance required"
    ],
    answer: "Attendance percentage = (classes attended / total classes held) x 100. The Attendance Percentage tool under Tools > Academic can also tell you how many more classes you must attend to reach a target percentage, or how many you can safely miss. Always confirm your institution's exact minimum-attendance rule with your department."
  },
  {
    id: "ohms-law-tool",
    questions: [
      "what is ohms law",
      "ohms law formula",
      "how to calculate voltage current resistance",
      "v=ir"
    ],
    answer: "Ohm's Law relates voltage (V), current (I) and resistance (R): V = I x R, so I = V / R and R = V / I. The Ohm's Law tool under Tools > Electrical/Electronics lets you enter any two values to find the third. Ask POLY AI can also solve a quick Ohm's Law calculation directly in chat if you give the known values."
  },
  {
    id: "unit-converter",
    questions: [
      "how to convert units",
      "unit converter",
      "convert km to miles",
      "convert celsius to fahrenheit",
      "temperature converter"
    ],
    answer: "The Unit Converter and Temperature Converter tools under Tools > Calculator/Mechanical handle length, weight, area, volume, pressure and temperature conversions. You can also just ask Ask POLY AI directly, e.g. 'convert 10 km to miles' or 'convert 37 celsius to fahrenheit', and it will calculate the answer for you."
  },

  // ---------------------------------------------------------------------
  // 6. HELP / SUPPORT / CONTACT
  // ---------------------------------------------------------------------
  {
    id: "how-to-contact-support",
    questions: [
      "how do i contact support",
      "how to report a problem",
      "how to report a broken link",
      "who do i contact for help",
      "contact admin",
      "customer support",
      "need help"
    ],
    answer: "Open the Help page from the top menu and describe the page URL, curriculum revision, department, semester, subject code, the affected button, and what you expected vs what happened (a screenshot helps). You can also email nandakumarmkdpm@gmail.com or call 9746445461 for direct support."
  },
  {
    id: "contact-email",
    questions: [
      "what is your email",
      "contact email",
      "email address",
      "support email",
      "email id"
    ],
    answer: "You can reach POLY PMNA support by email at nandakumarmkdpm@gmail.com."
  },
  {
    id: "contact-phone",
    questions: [
      "what is your phone number",
      "contact number",
      "mobile number",
      "phone number",
      "whatsapp number",
      "call support"
    ],
    answer: "You can reach POLY PMNA support by phone/WhatsApp at 9746445461."
  },
  {
    id: "public-discussion",
    questions: [
      "can i ask a public question",
      "student help forum",
      "discussion board",
      "comment section"
    ],
    answer: "The Help page has a public Student Help Discussion where you can post a non-private question, correction or suggestion. Avoid sharing passwords, phone numbers or other private information there — for private matters, use email support instead."
  },

  // ---------------------------------------------------------------------
  // 7. MISC / APP / ROADMAP
  // ---------------------------------------------------------------------
  {
    id: "android-app",
    questions: [
      "is there an app",
      "android app",
      "download app",
      "mobile app",
      "apk download"
    ],
    answer: "Yes, POLY PMNA has an Android app. Look for the app download button on the Home page to get the latest version."
  },
  {
    id: "roadmap-future",
    questions: [
      "what is coming next",
      "future plans",
      "roadmap",
      "new features"
    ],
    answer: "The current roadmap includes expanding printable study notes for all minor courses under Revision 2026, adding enhanced visual simulators, and releasing progressive offline-capable mobile apps."
  },
  {
    id: "is-content-official",
    questions: [
      "is the content official",
      "is this data accurate",
      "is this an official government site",
      "source of information"
    ],
    answer: "POLY PMNA is an independent student initiative, not an official government portal. It links directly to official SITTTR syllabus PDFs where possible, but you should always cross-check critical academic details (subject codes, credits, evaluation weights) against your institution's official syllabus."
  },
  {
    id: "print-notes",
    questions: [
      "how to save notes as pdf",
      "how to print notes",
      "download notes offline",
      "save handbook offline"
    ],
    answer: "On any lesson/handbook page, use the Print option in your browser (Ctrl+P or Cmd+P) and choose 'Save as PDF' to keep an offline copy of the module notes for study."
  },
  {
    id: "current-time-date-capability",
    questions: [
      "can you tell me the time",
      "can you tell me the date",
      "what is todays date",
      "what time is it now",
      "current date and time"
    ],
    answer: "Yes — just ask, e.g. 'what is today's date' or 'what time is it now', and I'll give you the current date and time directly, without needing the full AI service."
  },
  {
    id: "calculation-capability",
    questions: [
      "can you do calculations",
      "can you calculate for me",
      "do math for me",
      "can ask poly ai calculate",
      "can you solve math problems"
    ],
    answer: "Yes — I can do arithmetic, percentages, ratios, averages, unit and temperature conversions, and basic electrical/mechanical formulas like Ohm's Law and Power (P = V x I) directly in chat, even without the full AI service. For example, try '15% of 850', 'average of 72, 88, 91', or 'convert 5 kg to lb'."
  }
];
