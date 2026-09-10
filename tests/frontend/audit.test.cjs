const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/js/tools-stable-rebuild.js', 'utf8');
// Execute the real production code in a VM that prohibits string code generation,
// mirroring the CSP restriction that caused the production calculator failure.
function tools(values={}) {
  const elements = new Map();
  const document = {readyState:'loading', addEventListener(){}, querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, {});
    return elements.get(selector);
  }};
  const context = vm.createContext({document, Intl, FormData: class extends Map { constructor(){super(Object.entries(values));} }, localStorage:{getItem(){return null}}}, {codeGeneration:{strings:false,wasm:false}});
  vm.runInContext(source.replace("  if(document.readyState===", "  globalThis.api={evaluateExpression,n,numberList,calc};\n  if(document.readyState==="), context);
  return {api:context.api, elements};
}
const {api} = tools();
for (const [expression, expected] of [['2+2',4],['2+3*4',14],['(2+3)*4',20],['2^3^2',512],['-2^2',-4],['2^-2',.25],['50%',.5],['(25+25)%',.5],['sin(30)+sqrt(16)+2^3',12.5],['pow(2,3)+min(3,2)',10],['1e3+0.5',1000.5],['cos(pi*180/pi)',-1]]) {
  test(`CSP-safe expression ${expression}`,()=>assert.ok(Math.abs(api.evaluateExpression(expression)-expected)<1e-9));
}
for (const input of ['', '1/0', 'sqrt(-1)', 'pow(2)', 'sin(1,2)', '2foo', 'Math.random()', 'constructor(1)', '1;2', '()','2 3', '9'.repeat(1001)]) {
  test(`reject invalid expression ${JSON.stringify(input).slice(0,50)}`,()=>assert.throws(()=>api.evaluateExpression(input)));
}
function calculate(id, values) {
  const {api,elements} = tools(values);
  api.calc[id]();
  elements.get('#calcBtn').onclick();
  return elements.get('#res');
}
test('average does not silently count a trailing comma as zero',()=>assert.equal(calculate('avg',{values:'10,20,'}).className,'result err'));
test('average is 15 for 10 and 20',()=>assert.match(calculate('avg',{values:'10,20'}).innerHTML,/Average = 15/));
test('attendance 100% after absence is explicitly unreachable',()=>assert.match(calculate('att',{att:'36',total:'45',target:'100'}).innerHTML,/cannot be reached/));
test('perfect attendance needs no extra classes at 100%',()=>assert.match(calculate('att',{att:'45',total:'45',target:'100'}).innerHTML,/absence: 0/));
for (const values of [{att:'46',total:'45',target:'75'},{att:'-1',total:'45',target:'75'},{att:'1.5',total:'45',target:'75'},{att:'0',total:'0',target:'75'},{att:'36',total:'45',target:'101'}]) test(`invalid attendance ${JSON.stringify(values)}`,()=>assert.equal(calculate('att',values).className,'result err'));
test('CGPA rejects zero credits',()=>assert.equal(calculate('cgpa',{gp:'8,9',cr:'0,0'}).className,'result err'));
test('resistance rejects a negative component rather than dropping it',()=>assert.equal(calculate('res',{values:'100,-10',mode:'series'}).className,'result err'));
