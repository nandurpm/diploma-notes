// Represents: Ask Poly AI PDF intent parser
// Purpose: Extract department, semester, subject, language, and revision from user requests.

import { cleanText } from "./http.js";

/**
 * Parses a natural language message to extract PDF search parameters.
 * Supports English and Malayalam keywords.
 * 
 * @param {string} message - The user's message.
 * @returns {Object|null} - The extracted intent or null if not a PDF request.
 */
export function parsePdfIntent(message) {
  const q = cleanText(message, 500).toLowerCase();
  
  // Basic check: does it look like a PDF request?
  const isPdfRequest = /\b(pdf|material|notes|syllabus|question paper|questionpaper|qp|paper)\b/.test(q) ||
                      /\b(അയച്ചു തരൂ|വേണം|കിട്ടുമോ|ഉണ്ടോ|material)\b/.test(q) ||
                      /\b(send|give|need|want|find)\b.*\b(pdf|notes|syllabus|paper)\b/.test(q);
                      
  if (!isPdfRequest) return null;

  const intent = {
    department: null,
    semester: null,
    subject: null,
    language: null,
    revision: null,
    materialType: null,
    academicYear: null,
    isRagRequest: false
  };

  // 0. RAG Detection
  const ragKeywords = /\b(explain|summarize|summary|what is|how to|details of|about)\b/i;
  const contentKeywords = /\b(unit|chapter|section|module|topic|syllabus content)\b/i;
  if (ragKeywords.test(q) && (contentKeywords.test(q) || /\b(from|in|of)\b.*\b(pdf|notes|syllabus)\b/i.test(q))) {
    intent.isRagRequest = true;
  }

  // 1. Semester Extraction
  const semMatch = q.match(/\bs([1-6])\b/) || 
                   q.match(/\bsemester\s*([1-6])\b/) ||
                   q.match(/\b([1-6])\s*semester\b/) ||
                   q.match(/\b([1-6])\s*sem\b/);
  if (semMatch) {
    intent.semester = `Semester ${semMatch[1]}`;
  } else if (/\bfirst semester\b|\b1st semester\b|\b1st sem\b/.test(q)) {
    intent.semester = "Semester 1";
  } else if (/\bsecond semester\b|\b2nd semester\b|\b2nd sem\b/.test(q)) {
    intent.semester = "Semester 2";
  } else if (/\bthird semester\b|\b3rd semester\b|\b3rd sem\b/.test(q)) {
    intent.semester = "Semester 3";
  } else if (/\bfourth semester\b|\b4th semester\b|\b4th sem\b/.test(q)) {
    intent.semester = "Semester 4";
  } else if (/\bfifth semester\b|\b5th semester\b|\b5th sem\b/.test(q)) {
    intent.semester = "Semester 5";
  } else if (/\bsixth semester\b|\b6th semester\b|\b6th sem\b/.test(q)) {
    intent.semester = "Semester 6";
  }

  // 2. Revision Extraction
  const revMatch = q.match(/\b(2015|2021|2026)\b/);
  if (revMatch) {
    intent.revision = revMatch[1];
  } else if (/\bnew revision\b|\blatest revision\b/.test(q)) {
    intent.revision = "2026";
  }

  // 3. Language Extraction
  if (/\benglish\b/.test(q)) {
    intent.language = "English";
  } else if (/\bmalayalam\b/.test(q)) {
    intent.language = "Malayalam";
  }

  // 4. Material Type Extraction
  if (/\bnotes\b|\bmaterial\b/.test(q)) {
    intent.materialType = "Notes";
  } else if (/\bsyllabus\b/.test(q)) {
    intent.materialType = "Syllabus";
  } else if (/\bquestion paper\b|\bquestionpaper\b|\bqp\b|\bpaper\b/.test(q)) {
    intent.materialType = "Model Question Paper";
  }

  // 5. Department Extraction (common ones and abbreviations)
  const depts = {
    "electrical": "Electrical Engineering",
    "ee": "Electrical Engineering",
    "electronics": "Electronics and Communication",
    "ec": "Electronics and Communication",
    "computer": "Computer Science and Engineering",
    "cs": "Computer Science and Engineering",
    "civil": "Civil Engineering",
    "mechanical": "Mechanical Engineering",
    "me": "Mechanical Engineering",
    "automobile": "Automobile Engineering",
    "biomedical": "Biomedical Engineering",
    "chemical": "Chemical Engineering",
    "architecture": "Architecture",
    "information technology": "Information Technology",
    "it": "Information Technology"
  };

  for (const [key, name] of Object.entries(depts)) {
    const regex = new RegExp(`\\b${key}\\b`);
    if (regex.test(q)) {
      intent.department = name;
      break;
    }
  }

  // 6. Subject Extraction (heuristics)
  // Check for 4-digit code (common in SITTTR)
  const codeMatch = q.match(/\b(\d{4}[a-z]?)\b/i);
  if (codeMatch) {
    intent.subject = codeMatch[1].toUpperCase();
  } else {
    // Look for common subject keywords if no code is present
    const subjects = ["maths", "physics", "chemistry", "mechanics", "programming", "circuits", "networks"];
    for (const s of subjects) {
      if (q.includes(s)) {
        intent.subject = s.charAt(0).toUpperCase() + s.slice(1);
        break;
      }
    }
  }

  return intent;
}
