import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../assets/js/lesson-availability-hotfix.js', import.meta.url), 'utf8');
const base = 'https://raw.githubusercontent.com/nandurpm/poly-pmna-pdf-files/main/';
const catalogue = { revision: '2026', subjects: [{ code: '1001', status: 'published', pdfUrl: `${base}notes/2026/1001/v1/1001.pdf` }] };
const response = data => ({ ok: true, json: async () => data });
function resolver(fetch) {
  const context = vm.createContext({ window: {}, document: { currentScript: { src: 'https://example.org/project/assets/js/lesson-availability-hotfix.js' } }, URL, AbortController, fetch,
    setTimeout: fn => setTimeout(fn, 10), clearTimeout });
  // Expose the real private loader without starting the unrelated DOM observer.
  vm.runInContext(source.replace('  let timer = 0;', '  window.resolve = notesUrlFor; return;\n  let timer = 0;'), context);
  return context.window.resolve;
}
test('28 cards share one same-origin request; published PDFs retain canonical URLs', async () => {
  const urls = [];
  const load = resolver(async url => { urls.push(url); return response(catalogue); });
  const values = await Promise.all(Array.from({ length: 28 }, () => load('1001', 'REV2026')));
  assert.equal(urls.length, 1);
  assert.equal(urls[0], 'https://example.org/project/docs/pdf-archive/manifests/notes-2026.json');
  assert.ok(values.every(value => value === catalogue.subjects[0].pdfUrl));
  assert.equal(await load('9999', 'REV2026'), '');
});
test('falls back to canonical GitHub when the local catalogue is absent or invalid', async () => {
  for (const local of [{ ok: false, status: 404 }, response({ revision: '2021', subjects: [] })]) {
    const urls = [];
    const load = resolver(async url => { urls.push(url); return urls.length === 1 ? local : response(catalogue); });
    assert.equal(await load('1001', 'REV2026'), catalogue.subjects[0].pdfUrl);
    assert.equal(urls[1], `${base}manifests/notes-2026.json`);
  }
});
test('failed shared request can be retried without caching a false unavailable result', async () => {
  let healthy = false, count = 0;
  const load = resolver(async () => { count++; if (!healthy) throw Error('offline'); return response(catalogue); });
  const results = await Promise.allSettled([load('1001', 'REV2026'), load('1002', 'REV2026')]);
  assert.ok(results.every(result => result.status === 'rejected'));
  assert.equal(count, 2);
  healthy = true;
  assert.equal(await load('1001', 'REV2026'), catalogue.subjects[0].pdfUrl);
  assert.equal(count, 3);
});
test('a stalled request times out and tries the next source', async () => {
  let count = 0;
  const load = resolver(async (_url, { signal }) => {
    if (++count === 2) return response(catalogue);
    return new Promise((_, reject) => signal.addEventListener('abort', () => reject(Error('timeout'))));
  });
  assert.equal(await load('1001', 'REV2026'), catalogue.subjects[0].pdfUrl);
});
test('does not publish foreign, wrong-revision or draft PDF links', async () => {
  const load = resolver(async () => response({ revision: '2026', subjects: [null,
    { code: '1001', status: 'draft', pdfUrl: catalogue.subjects[0].pdfUrl },
    { code: '1002', status: 'published', pdfUrl: 'https://untrusted.example/file.pdf' },
    { code: '1003', status: 'published', pdfUrl: `${base}notes/2021/1003/v1/1003.pdf` },
  ] }));
  for (const code of ['1001', '1002', '1003']) assert.equal(await load(code, 'REV2026'), '');
});
