const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/js/help-comments.js','utf8');

test('recent replies remain visible when their parent is older than the loaded page or deleted', async () => {
  const cards=[];
  const context={document:{querySelector:()=>null},window:{addEventListener(){}},console:{error(){}},URLSearchParams,Intl,Date,Set,Map};
  vm.createContext(context);
  vm.runInContext(source,context);
  // Use the production fetch/render logic with a minimal DOM boundary.
  vm.runInContext(`
    requestJson = async url => url.includes('?') ? {documents:[{name:'comments/reply',fields:{pageId:{stringValue:'help'},parentId:{stringValue:'old'},message:{stringValue:'Reply'}}}]} : {name:'comments/old',fields:{pageId:{stringValue:'help'},deleted:{booleanValue:true}}};
    cardFor = (item,isReply) => ({id:item.id,isReply:!!isReply});
  `, context);
  // Bind the queried list/count in a fresh context so source const bindings stay real.
  const list={replaceChildren(){cards.length=0;},append(x){cards.push(x);}};
  const count={};
  const ctx={...context,document:{querySelector:s=>s==='#commentsList'?list:s==='#commentCount'?count:null}};
  vm.createContext(ctx); vm.runInContext(source,ctx);
  vm.runInContext(`requestJson = ${vm.runInContext('requestJson.toString()',context)}; cardFor = (item,isReply) => ({id:item.id,isReply:!!isReply});`,ctx);
  await vm.runInContext('fetchComments()',ctx);
  assert.equal(cards.length,2);
  assert.equal(cards[0].id,'old');
  assert.equal(cards[1].id,'reply');
  assert.equal(cards[1].isReply,true);
  assert.equal(count.textContent,'1 loaded comment');
});
