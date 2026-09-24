const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/js/ask-poly-v2.js', 'utf8');
const utils = fs.readFileSync('assets/js/poly-utils.js', 'utf8');
const render = source.slice(source.indexOf('  function renderInlineMarkdown('), source.indexOf('  function renderMarkdownTable('));
const ctx = vm.createContext({window:{}});
vm.runInContext(utils, ctx);
vm.runInContext("const escapeHtml = window.PolyUtils.escapeHtml;" + render, ctx);
for (const input of ['my_var_name', 'a*b*c']) {
  test(`preserves inline code ${input}`, () => assert.equal(ctx.renderInlineMarkdown('`' + input + '`'), `<code>${input}</code>`));
}
test('keeps underscores in link URLs', () => assert.match(ctx.renderInlineMarkdown('[x](https://a.com/my_file_name.pdf)'), /href="https:\/\/a.com\/my_file_name.pdf"/));
test('does not italicize engineering variable names', () => assert.equal(ctx.renderInlineMarkdown('V_in = I_out * R'), 'V_in = I_out * R'));
test('escapes injection and rejects javascript links', () => {
  assert.ok(!ctx.renderInlineMarkdown('<img src=x onerror=alert(1)>').includes('<img'));
  assert.ok(!ctx.renderInlineMarkdown('[x](javascript:alert(1))').includes('<a'));
  assert.ok(!ctx.renderInlineMarkdown('[x](https://a.test/"onclick="x)').includes('"onclick='));
});
test('formats emphasis and resolves code in link labels', () => {
  assert.equal(ctx.renderInlineMarkdown('**bold** _italic_'), '<strong>bold</strong> <em>italic</em>');
  assert.ok(ctx.renderInlineMarkdown('[`x_y`](https://a.test)').includes('<code>x_y</code>'));
  assert.ok(!ctx.renderInlineMarkdown('\u00000\u0000').includes('\u0000'));
});
