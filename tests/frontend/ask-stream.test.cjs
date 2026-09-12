const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/js/ask-poly-v2.js', 'utf8');
const functions = source.slice(source.indexOf('  function createSmoothDeltaHandler('), source.indexOf('  async function sendMessage('));
const encode = value => new TextEncoder().encode(value);
const delta = text => `data: ${JSON.stringify({delta:{content:text}})}\n\n`;
function client(chunks) {
  let clock = 0, sequence = 0, cancelled = false, released = false;
  const timers = new Map();
  const scope = vm.createContext({TextDecoder, AbortController, window:{ASK_POLY_CONFIG:{endpoint:'https://example.test/ask',timeoutMs:30000}},
    preferredResponseLanguage:()=> 'en', activeController:null,
    setTimeout(fn, ms) { const id = ++sequence; timers.set(id, {at:clock+ms,fn}); return id; },
    clearTimeout(id) { timers.delete(id); },
    fetch:async (_url, options) => ({ok:true,headers:new Headers({'content-type':'text/event-stream'}),body:{getReader:()=>({
      async read() {
        const chunk = chunks.shift();
        clock += chunk?.delay || 0;
        for (const [id,timer] of [...timers]) if (timer.at <= clock) { timers.delete(id); timer.fn(); }
        if (options.signal.aborted) throw new DOMException('Aborted','AbortError');
        if (chunk?.error) throw new Error('Network disconnected');
        return chunk ? {value:chunk.bytes || encode(chunk.text),done:false} : {done:true};
      }, async cancel(){cancelled=true;}, releaseLock(){released=true;}
    })}})
  });
  vm.runInContext(functions,scope);
  return {scope, run:onDelta=>scope.callAI('Write an essay',[], '',onDelta), cleanup:()=>({timers:timers.size,cancelled,released}), clock:()=>clock};
}
test('active streaming can exceed 30 seconds and cleans up the transport',async()=>{
  const c=client([...Array.from({length:5},()=>({text:delta('paragraph '),delay:10000})),{text:'data: [DONE]\n\n'}]);
  const r=await c.run(()=>{});
  assert.equal(r.answer,'paragraph '.repeat(5)); assert.equal(c.clock(),50000);
  assert.deepEqual(c.cleanup(),{timers:0,cancelled:true,released:true});
});
test('idle timeout flushes the final short fragment for preservation',async()=>{
  let shown=''; const c=client([{text:delta('Hello')},{text:delta(' world'),delay:31000}]);
  await assert.rejects(c.run(text=>{shown=text;}),{name:'AbortError'});
  assert.equal(shown,'Hello'); assert.equal(c.cleanup().timers,0);
});
for(const [name,last] of [['network error',{error:true}],['premature EOF',null],['provider error',{text:'data: {"error":{"message":"unavailable"}}\n\n'}],['token limit',{text:'data: {"choices":[{"finish_reason":"length"}]}\n\n'}]]) {
  test(`${name} keeps received text and reports an incomplete stream`,async()=>{
    let shown=''; const c=client([{text:delta('Saved text')},...(last?[last]:[])]);
    await assert.rejects(c.run(text=>{shown=text;})); assert.equal(shown,'Saved text');
    assert.deepEqual(c.cleanup(),{timers:0,cancelled:true,released:true});
  });
}
test('split UTF-8 and CRLF framing preserve text exactly',async()=>{
  const bytes=encode(delta('മലയാളം').replaceAll('\n','\r\n')+'data: [DONE]');
  const c=client(Array.from(bytes,byte=>({bytes:Uint8Array.of(byte)})));
  assert.equal((await c.run(()=>{})).answer,'മലയാളം');
});
test('explicit finish reason completes without requiring another event',async()=>{
  const c=client([{text:delta('Complete')},{text:'data: {"choices":[{"finish_reason":"stop"}]}\n\n'}]);
  assert.equal((await c.run(()=>{})).answer,'Complete');
});
for (const stopped of [false,true]) {
  test(`${stopped?'stopped':'interrupted'} answer is saved instead of offline replacement`,async()=>{
    const saved=[];let renders=0;
    const scope=vm.createContext({window:{AskPolyOffline:{answer(){throw new Error('Offline fallback must not replace streamed text');}}},
      waiting:false,pendingMessages:[],MAX_QUEUE:8,MAX_HISTORY:6,activeChatId:'chat',stopRequested:stopped,
      els:{input:{value:'',focus(){}}},autoResize(){},setWaiting(){},addTyping(){},removeTyping(){},removeStreamingAnswer(){},
      async addMessage(role,content,meta){saved.push({role,content,meta});},async updateChatTitleFromMessage(){},async renderMessages(){},async renderChats(){},
      shouldSearchWebsite:()=>false,async getMessages(){return saved;},updateStreamingAnswer(){},updateQueueControl(){},async renderAll(){renders++;},
      async callAI(_message,_history,_context,onDelta){onDelta('The answer already received.');throw new Error('Interrupted');},console
    });
    vm.runInContext(source.slice(source.indexOf('  async function sendMessage('),source.indexOf('  function autoResize(')),scope);
    await scope.sendMessage('Write an essay');
    assert.equal(saved.length,2);assert.equal(saved[1].content,'The answer already received.');
    assert.equal(saved[1].meta.incomplete,true);assert.equal(saved[1].meta.stopped,stopped);assert.equal(renders,1);
  });
}
