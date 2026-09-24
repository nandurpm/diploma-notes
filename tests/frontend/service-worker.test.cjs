const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function worker(fetcher) {
  const events = {}, records = new Map(), deleted=[];
  const cache = {addAll:async()=>{},match:async key=>records.get(typeof key==='string'?key:key.url),put:async(key,response)=>records.set(typeof key==='string'?key:key.url,response),keys:async()=>[],delete:async()=>true};
  const context = vm.createContext({URL,Response,Promise,self:{location:{origin:'https://site.test'},addEventListener:(name,fn)=>events[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>cache,keys:async()=>['poly-pmna-v1','other-app'],delete:async key=>deleted.push(key)},fetch:fetcher});
  vm.runInContext(fs.readFileSync('sw.js','utf8'),context);
  async function request(path,mode='navigate',method='GET') {
    let response,background;
    events.fetch({request:{url:'https://site.test'+path,mode,method,headers:new Headers()},respondWith:p=>response=p,waitUntil:p=>background=p});
    const result=await response; await background; return result;
  }
  return {events,records,deleted,request};
}
test('versioned assets reuse canonical cached entries and refresh',async()=>{
  const w=worker(async()=>new Response('fresh'));
  w.records.set('/assets/js/main.js',new Response('cached'));
  assert.equal(await (await w.request('/assets/js/main.js?v=123','cors')).text(),'cached');
  assert.equal(await w.records.get('/assets/js/main.js').text(),'fresh');
});
test('public pages work offline after a visit',async()=>{
  let online=true; const w=worker(async()=>{if(!online)throw Error('offline');return new Response('lesson');});
  await w.request('/lessons/one.html'); online=false;
  assert.equal(await (await w.request('/lessons/one.html')).text(),'lesson');
});
test('does not intercept private, API, query navigation or POST requests',async()=>{
  const w=worker(()=>{throw Error('must not fetch');});
  for(const path of ['/api/test','/admin/blog.html','/reset-password.html','/ask-poly.html','/index.html?token=secret']) assert.equal(await w.request(path),undefined);
  assert.equal(await w.request('/index.html','navigate','POST'),undefined);
});
test('activation deletes only this app old caches',async()=>{
  const w=worker(()=>{});let done;w.events.activate({waitUntil:p=>done=p});await done;assert.deepEqual(w.deleted,['poly-pmna-v1']);
});
