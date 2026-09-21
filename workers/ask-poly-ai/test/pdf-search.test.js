import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePdfIntent } from '../src/pdf-intent-parser.js';
import { searchPdfs } from '../src/pdf-search.js';
import { askPoly } from '../src/ask-handler.js';

test('revision years do not become subject codes; explicit codes survive', () => {
  assert.equal(parsePdfIntent('Revision 2026 electrical semester 1 syllabus').subject, null);
  assert.equal(parsePdfIntent('Revision 2026 subject 1001 syllabus').subject, '1001');
  assert.equal(parsePdfIntent('subject 2021 syllabus').subject, '2021');
  assert.equal(parsePdfIntent('Give me syllabus').department, null);
});

test('PDF search never substitutes a different revision, department or material type', () => {
  const index = { depts: ['Electrical Engineering'], revs: ['2026'], types: ['Syllabus', 'Notes'],
    items: [['English', 0, 'Semester 1', '1001', 0, 0, '1001.pdf']] };
  for (const intent of [{revision:'2021'}, {department:'Civil'}, {materialType:'Notes'}, {materialType:'Model Question Paper'}]) {
    assert.deepEqual(searchPdfs(intent, index), []);
  }
  assert.equal(searchPdfs({revision:'2026', materialType:'Syllabus'}, index).length, 1);
});

test('semester-wide syllabus query offers multiple subjects instead of choosing the first', async () => {
  const result = await askPoly({message:'Where can I find the Revision 2026 Electrical Engineering semester 1 syllabus?'}, {});
  assert.match(result.answer, /Found these PDFs/);
  assert.ok((result.answer.match(/Open PDF/g) || []).length > 1);
});
