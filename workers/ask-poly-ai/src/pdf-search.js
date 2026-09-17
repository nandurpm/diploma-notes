// Represents: Ask Poly AI PDF search engine
// Purpose: Search the compressed PDF index for matches based on extracted intent.

/**
 * Searches the compressed PDF index for matching files.
 * 
 * @param {Object} intent - The parsed user intent.
 * @param {Object} index - The compressed PDF index.
 * @returns {Array} - Sorted list of matching PDF objects.
 */
export function searchPdfs(intent, index) {
  if (!intent || !index) return [];

  const { depts, types, revs, items } = index;
  const results = [];

  // Normalise intent for comparison
  const targetDept = intent.department ? intent.department.toLowerCase() : null;
  const targetSem = intent.semester ? intent.semester.toLowerCase() : null;
  const targetSub = intent.subject ? intent.subject.toLowerCase() : null;
  const targetRev = intent.revision ? intent.revision : null;
  const targetType = intent.materialType ? intent.materialType.toLowerCase() : null;

  // Find indices for mapped fields to speed up search
  const targetDeptIdx = targetDept ? depts.findIndex(d => d.toLowerCase().includes(targetDept)) : -1;
  const targetTypeIdx = targetType ? types.findIndex(t => t.toLowerCase().includes(targetType)) : -1;
  const targetRevIdx = targetRev ? revs.indexOf(targetRev) : -1;

  for (const item of items) {
    const [title, deptIdx, semester, subject, revIdx, typeIdx, path] = item;
    
    let score = 0;
    let matchCount = 0;
    let requiredMatches = 0;
    let actualMatches = 0;

    // 1. Department Match (Weight: 10)
    if (targetDeptIdx !== -1) {
      requiredMatches++;
      if (deptIdx === targetDeptIdx) {
        score += 10;
        actualMatches++;
      }
    }

    // 2. Semester Match (Weight: 8)
    if (targetSem) {
      requiredMatches++;
      if (semester.toLowerCase() === targetSem) {
        score += 8;
        actualMatches++;
      }
    }

    // 3. Subject Match (Weight: 15) - Highest priority
    if (targetSub) {
      requiredMatches++;
      const subLower = subject.toLowerCase();
      const titleLower = title.toLowerCase();
      const pathLower = path.toLowerCase();
      
      if (subLower === targetSub || titleLower === targetSub || pathLower.includes(targetSub)) {
        score += 15;
        actualMatches++;
      } else if (subLower.includes(targetSub) || titleLower.includes(targetSub)) {
        score += 10;
        actualMatches++;
      }
    }

    // 4. Revision Match (Weight: 6)
    if (targetRevIdx !== -1) {
      requiredMatches++;
      if (revIdx === targetRevIdx) {
        score += 6;
        actualMatches++;
      }
    }

    // 5. Material Type Match (Weight: 4)
    if (targetTypeIdx !== -1) {
      if (typeIdx === targetTypeIdx) {
        score += 4;
      }
    }

    // Strict filtering: if a major field was specified, it MUST match
    if (requiredMatches > 0 && actualMatches < requiredMatches) {
      continue;
    }

    if (actualMatches > 0 || requiredMatches === 0) {
      results.push({
        title,
        department: depts[deptIdx] || "",
        semester,
        subject: subject || title,
        revision: revs[revIdx] || "",
        materialType: types[typeIdx] || "",
        path,
        url: `https://github.com/nandurpm/poly-pmna-pdf-files/raw/refs/heads/main/${path}`,
        score
      });
    }
  }

  // Sort by score descending, then by revision descending (newest first)
  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return parseInt(b.revision) - parseInt(a.revision);
  });
}
