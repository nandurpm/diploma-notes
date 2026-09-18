const { test, expect } = require('@playwright/test');

const GUEST_RESULTS_KEY = 'polypmna_guest_mock_exam_results';
let evaluatedPaperId = '';

test('guest mock exam submits, renders feedback and saves score history', async ({ page }) => {
  await page.route('**/assets/vendor/supabase-js-2.110.7.js*', route => route.fulfill({
    contentType: 'application/javascript',
    body: `window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null},error:null})}})};`,
  }));

  await page.route('https://api.polypmna.dpdns.org/api/evaluate-mock-exam', async route => {
    const request = route.request();
    const payload = JSON.parse(request.postData() || '{}');
    evaluatedPaperId = payload.paperId;
    expect(payload.answers).toHaveLength(23);
    expect(payload.subjectCode).toBe('1002');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({
        paperId: payload.paperId,
        title: payload.title,
        score: 51,
        totalMarks: 75,
        percentage: 68,
        status: 'published',
        evaluationMode: 'ai',
        evaluatedAt: '2026-09-15T08:00:00Z',
        overallFeedback: 'Strong attempt. Review units and final substitutions.',
        results: payload.answers.map((answer, index) => ({
          id: answer.id,
          awardedMarks: index < 5 ? 1 : 2,
          feedback: 'Clear working shown.',
          missingPoints: [],
          confidence: 0.95,
        })),
      }),
    });
  });

  page.on('dialog', dialog => dialog.accept());
  await page.goto('/mock-exam.html?subject=1002');
  await expect(page.locator('#examView')).toBeVisible();
  await expect(page.locator('#studentName')).toHaveText('Guest Student');

  const partB = page.locator('input[data-part-b-select]');
  for (let index = 0; index < 8; index += 1) await partB.nth(index).check();

  const pairs = page.locator('input[type="radio"][name^="pair-"]');
  const pairNames = await pairs.evaluateAll(nodes => [...new Set(nodes.map(node => node.name))]);
  expect(pairNames).toHaveLength(6);
  for (const name of pairNames) await page.locator(`input[name="${name}"]`).first().check();

  const enabledAnswers = page.locator('textarea[data-question-id]:not(:disabled)');
  await expect(enabledAnswers).toHaveCount(23);
  for (let index = 0; index < 23; index += 1) {
    await enabledAnswers.nth(index).fill('Complete answer with units and working.');
  }

  await expect(page.locator('#answeredCount')).toHaveText('23/23');
  await expect(page.locator('#submitExam')).toBeEnabled();
  await page.locator('#submitExam').click();

  await expect(page.locator('#resultView')).toBeVisible();
  await expect(page.locator('#resultScore')).toHaveText('51/75');
  await expect(page.locator('#resultPercent')).toHaveText('68%');
  await expect(page.locator('#overallFeedback')).toContainText('Strong attempt. Review units and final substitutions.');
  await expect(page.locator('#attemptHistory')).toContainText('51/75');
  await expect(page.locator('#attemptHistory')).toContainText('Guest Result');

  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key) || '[]'), GUEST_RESULTS_KEY);
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({ paperId: evaluatedPaperId, score: 51, totalMarks: 75, percentage: 68, status: 'published' });
});
