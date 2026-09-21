const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('assets/js/blog-session.js', 'utf8');
for (const scenario of ['success', 'http-error', 'network-error', 'no-session']) {
  test(`admin logout: ${scenario}`, async () => {
    const calls = [], removed = [];
    const context = {window:{}, AbortController, setTimeout, clearTimeout,
      sessionStorage:{removeItem:key=>removed.push(key)},
      fetch:async (url, options) => {
        calls.push({url, options});
        if (scenario === 'network-error') throw Error('offline');
        return {ok:scenario !== 'http-error'};
      }};
    vm.runInNewContext(source, context);
    const operation = context.window.PolyBlogSession.signOut({supabaseUrl:'https://example.supabase.co',publishableKey:'public'}, scenario === 'no-session' ? null : {access_token:'test-token'});
    if (scenario.endsWith('error')) await assert.rejects(operation, /could not be confirmed/);
    else await operation;
    assert.deepEqual(removed, ['poly_blog_admin_session']);
    assert.equal(calls.length, scenario === 'no-session' ? 0 : 1);
    if (calls.length) {
      assert.equal(calls[0].url, 'https://example.supabase.co/auth/v1/logout?scope=local');
      assert.equal(calls[0].options.method, 'POST');
      assert.equal(calls[0].options.headers.Authorization, 'Bearer test-token');
    }
  });
}
