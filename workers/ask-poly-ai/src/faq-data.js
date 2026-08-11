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
 */

export const FAQ_ENTRIES = [
  {
    id: "what-is-poly-pmna",
    questions: [
      "what is poly pmna",
      "what is polypmna",
      "about poly pmna",
      "what is this website",
      "what is this site about"
    ],
    answer: "POLY PMNA is a Kerala Polytechnic study hub covering Revision 2026, Revision 2021 and 2015 Materials, with subject-wise notes, syllabus links, mock exams, and Ask POLY AI for general and study questions."
  },
  {
    id: "how-to-contact-support",
    questions: [
      "how do i contact support",
      "how to report a problem",
      "how to report a broken link",
      "who do i contact for help",
      "contact admin"
    ],
    answer: "Open the Help page from the top menu and send the page URL, subject code, button name, a screenshot, and a short description of what happened. That goes straight to the site admin."
  },
  {
    id: "revision-2026-vs-2021",
    questions: [
      "difference between revision 2026 and revision 2021",
      "what is revision 2026",
      "what is revision 2021",
      "which revision should i use",
      "rev 2026 vs rev 2021"
    ],
    answer: "Revision 2026 covers the newer Kerala Polytechnic syllabus, while Revision 2021 covers the previous scheme. Use whichever matches the scheme your department and semester follow — check your official syllabus/admission year if you are unsure."
  }
];
