const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const read = path => fs.readFileSync(path, 'utf8');

test('Ask POLY scripts recognize both canonical and clean routes', () => {
  for (const file of ['ask-poly-v2', 'ask-poly-client-recovery', 'ask-poly-layout', 'ask-poly-knowledge-loader', 'ask-poly-mobile-layout', 'visitor-popup']) {
    const source = read('assets/js/' + file + '.js');
    const expression = source.match(/(\/[^\n]+\/i)\.test\(location\.pathname\)/);
    assert.ok(expression, file);
    const matches = vm.runInNewContext(expression[1]);
    for (const path of ['/ask-poly.html', '/ask-poly', '/ask-poly/', '/ask-poly-v2.html']) assert.ok(matches.test(path), file + ' ' + path);
    assert.equal(matches.test('/tools.html'), false);
  }
});
test('discussion fallback email agrees with the Help page', () => {
  const source = read('assets/js/help-comments.js');
  const token = source.match(/const EMAIL_TOKEN = "([0-9a-f]+)"/)[1];
  const key = parseInt(token.slice(0, 2), 16);
  const address = token.slice(2).match(/../g).map(v => String.fromCharCode(parseInt(v, 16) ^ key)).join('');
  assert.equal(address, 'contact@polypmna.dpdns.org');
  assert.ok(read('contact.html').includes('mailto:' + address));
});
test('invalid discussion timestamps never break rendering', () => {
  const source = read('assets/js/help-comments.js');
  const start = source.indexOf('const formatDate =');
  const end = source.indexOf('const initials =', start);
  const formatDate = vm.runInNewContext(source.slice(start, end) + '\nformatDate');
  assert.equal(formatDate('not a date'), 'Date unavailable');
  assert.equal(formatDate(''), 'Date unavailable');
  assert.notEqual(formatDate('2026-11-24T10:00:00Z'), 'Date unavailable');
});
