const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/js/tools-stable-rebuild.js','utf8');
const context = {Intl, Math, Number, String, Error};
vm.createContext(context);
// Execute the actual calculator callbacks with fields captured, without a browser.
const helpers = source.slice(source.indexOf('  const fmt ='), source.indexOf('  /* Master list'));
vm.runInContext(helpers + '\nconst fields=(defs,callback)=>callback;\n' +
  ['led','bat'].map(id=>'var '+id+' = '+source.split('\n').find(line=>line.trim().startsWith(id+':')).trim().replace(new RegExp('^'+id+':'), '').replace(/,$/,'')+';').join('\n'),context);
const form = values => new Map(Object.entries(values));
assert.match(context.led()(form({vs:'12',vf:'2',i:'20'})), /500/);
assert.throws(()=>context.led()(form({vs:'1',vf:'2',i:'20'})), /must exceed/);
assert.throws(()=>context.led()(form({vs:'2',vf:'2',i:'20'})), /must exceed/);
assert.throws(()=>context.led()(form({vs:'12',vf:'2',i:'0'})), /greater than zero/);
assert.match(context.bat()(form({ah:'7',v:'12',load:'20',eff:'85'})), /3.57/);
assert.throws(()=>context.bat()(form({ah:'7',v:'12',load:'20',eff:'150'})), /at most 100/);
assert.throws(()=>context.bat()(form({ah:'7',v:'12',load:'20',eff:'-1'})), /greater than zero/);
console.log('7 calculator boundary checks passed');
