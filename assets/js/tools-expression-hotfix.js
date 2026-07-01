(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const fmt = v => Number.isFinite(Number(v)) ? new Intl.NumberFormat('en-IN',{maximumFractionDigits:10}).format(Number(v)) : '—';
  const toRad = (x, mode) => mode === 'DEG' ? x * Math.PI / 180 : x;
  const fromRad = (x, mode) => mode === 'DEG' ? x * 180 / Math.PI : x;
  const fact = n => { n = Number(n); if(!Number.isInteger(n) || n < 0 || n > 170) throw new Error('Factorial supports integers 0 to 170.'); let r = 1; for(let i = 2; i <= n; i++) r *= i; return r; };
  const nPr = (n,r) => fact(n) / fact(n-r);
  const nCr = (n,r) => fact(n) / (fact(r) * fact(n-r));
  const gcd = (a,b) => { a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while(b) [a,b] = [b, a % b]; return a || 0; };
  const lcm = (a,b) => Math.abs(Math.round(a*b)) / gcd(a,b);
  const mean = arr => arr.reduce((s,x)=>s+x,0) / arr.length;
  const median = arr => { const a = [...arr].sort((x,y)=>x-y), m = Math.floor(a.length/2); return a.length % 2 ? a[m] : (a[m-1] + a[m]) / 2; };
  const stdev = arr => { const m = mean(arr); return Math.sqrt(arr.reduce((s,x)=>s+(x-m)**2,0) / arr.length); };
  let ans = 0;
  let memory = 0;
  let mode = 'DEG';

  function normalise(raw){
    let e = String(raw || '')
      .replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-')
      .replace(/π/g,'pi').replace(/√\(/g,'sqrt(').replace(/Ans/gi,'ans')
      .replace(/\^/g,'**').replace(/(\d+(?:\.\d+)?)%/g,'($1/100)');
    let previous;
    do { previous = e; e = e.replace(/(\d+(?:\.\d+)?|\([^()]*\))!/g, 'fact($1)'); } while(e !== previous);
    return e;
  }

  function safeEval(raw){
    const expression = normalise(raw);
    if(/[^0-9+\-*/%().,\sA-Za-z_]/.test(expression)) throw new Error('Unsupported character.');
    const scope = {
      pi: Math.PI, e: Math.E, ans, mem: memory,
      sin: x => Math.sin(toRad(x, mode)), cos: x => Math.cos(toRad(x, mode)), tan: x => Math.tan(toRad(x, mode)),
      asin: x => fromRad(Math.asin(x), mode), acos: x => fromRad(Math.acos(x), mode), atan: x => fromRad(Math.atan(x), mode),
      sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, asinh: Math.asinh, acosh: Math.acosh, atanh: Math.atanh,
      log: Math.log10, ln: Math.log, exp: Math.exp, sqrt: Math.sqrt, cbrt: Math.cbrt,
      abs: Math.abs, floor: Math.floor, ceil: Math.ceil, round: Math.round, trunc: Math.trunc, sign: Math.sign,
      fact, nCr, nPr, gcd, lcm, pow: Math.pow, root: (x,n) => Math.pow(x, 1/n), mod: (a,b) => a % b,
      min: Math.min, max: Math.max, rand: Math.random
    };
    const allowed = new Set(Object.keys(scope));
    const tokens = expression.match(/[A-Za-z_]\w*/g) || [];
    for(const token of tokens){ if(!allowed.has(token)) throw new Error('Unsupported function: ' + token); }
    const value = Function(...Object.keys(scope), '"use strict"; return (' + expression + ');')(...Object.values(scope));
    if(!Number.isFinite(value)) throw new Error('Result is not finite.');
    ans = value;
    return value;
  }

  function injectStyle(){
    if(document.getElementById('advancedScientificStyle')) return;
    const style = document.createElement('style');
    style.id = 'advancedScientificStyle';
    style.textContent = `.sci-wrap{display:grid;gap:12px}.sci-top{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.sci-display{font-family:Consolas,monospace;font-size:1.08rem;min-height:96px}.sci-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px}.sci-grid button{min-height:46px;border-radius:14px;border:1px solid #d9e7f7;background:#fff;font-weight:900;cursor:pointer}.sci-grid .op{background:#eef5ff;color:#123e9d}.sci-grid .danger{background:#fff1f2;color:#b42318}.sci-grid .eq{background:linear-gradient(135deg,#2457f5,#08a8c8);color:#fff;border-color:transparent}.sci-grid .mem{background:#f5f3ff;color:#5b21b6}.sci-note{font-size:.92rem;color:#475569}.stats-box{border:1px solid #d9e7f7;border-radius:18px;padding:12px;background:#f8fbff}.stats-box textarea{min-height:70px}@media(max-width:720px){.sci-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}`;
    document.head.appendChild(style);
  }

  function insertText(text){ const input = $('#exprFix'); const start = input.selectionStart ?? input.value.length; const end = input.selectionEnd ?? input.value.length; input.value = input.value.slice(0,start) + text + input.value.slice(end); input.focus(); input.selectionStart = input.selectionEnd = start + text.length; }
  function setResult(html, error=false){ const res = $('#resFix'); res.className = error ? 'result err' : 'result'; res.innerHTML = html; }
  function runCalc(){ try { const value = safeEval($('#exprFix').value); setResult(`<b>${fmt(value)}</b><br><span class='sci-note'>ANS = ${fmt(ans)} | Memory = ${fmt(memory)} | Mode = ${mode}</span>`); } catch(e){ setResult(e.message || 'Invalid expression.', true); } }
  function calcStats(){ try { const arr = String($('#statsData').value).split(/[,\s]+/).map(Number).filter(Number.isFinite); if(!arr.length) throw new Error('Enter numbers separated by comma or space.'); $('#statsRes').className = 'result'; $('#statsRes').innerHTML = `<b>Mean = ${fmt(mean(arr))}</b><br>Median = ${fmt(median(arr))}<br>Population SD = ${fmt(stdev(arr))}<br>Sum = ${fmt(arr.reduce((s,x)=>s+x,0))}<br>Count = ${arr.length}`; } catch(e){ $('#statsRes').className = 'result err'; $('#statsRes').textContent = e.message || 'Statistics failed.'; } }

  function openAdvancedCalculator(kind){
    const modal = $('#modal'); if(!modal) return;
    injectStyle();
    $('#cat').textContent = 'Calculator';
    $('#ttl').textContent = kind === 'basic' ? 'Basic Calculator' : 'Advanced Scientific Calculator';
    $('#desc').textContent = kind === 'basic' ? 'Fast expression calculator with memory and ANS.' : 'Scientific calculator with DEG/RAD, trigonometry, inverse/hyperbolic functions, logs, powers, roots, factorial, nCr/nPr, memory, constants and statistics.';
    modal.hidden = false;
    const buttons = [
      ['MC','mc','mem'],['MR','mr','mem'],['M+','mplus','mem'],['M-','mminus','mem'],['DEG/RAD','mode','op'],['ANS','ans','op'],
      ['sin','sin(','op'],['cos','cos(','op'],['tan','tan(','op'],['asin','asin(','op'],['acos','acos(','op'],['atan','atan(','op'],
      ['sinh','sinh(','op'],['cosh','cosh(','op'],['tanh','tanh(','op'],['log','log(','op'],['ln','ln(','op'],['exp','exp(','op'],
      ['x²','**2','op'],['x³','**3','op'],['xʸ','**','op'],['√','sqrt(','op'],['∛','cbrt(','op'],['ʸ√x','root(','op'],
      ['n!','!','op'],['nCr','nCr(','op'],['nPr','nPr(','op'],['1/x','1/(','op'],['abs','abs(','op'],['mod','mod(','op'],
      ['π','pi','op'],['e','e','op'],['rand','rand()','op'],['(', '(' ,'op'],[')', ')' ,'op'],['⌫','back','danger'],
      ['7','7',''],['8','8',''],['9','9',''],['÷','/','op'],['C','clear','danger'],['AC','allclear','danger'],
      ['4','4',''],['5','5',''],['6','6',''],['×','*','op'],['%','%','op'],[',',',','op'],
      ['1','1',''],['2','2',''],['3','3',''],['−','-','op'],['floor','floor(','op'],['ceil','ceil(','op'],
      ['0','0',''],['.','.',''],['±','neg','op'],['+','+','op'],['=','equals','eq'],['round','round(','op']
    ];
    $('#body').innerHTML = `<div class='sci-wrap'><div class='sci-top'><button class='btn primary' id='modeBtn' type='button'>Mode: ${mode}</button><button class='btn' id='helpBtn' type='button'>Function help</button></div><textarea id='exprFix' class='sci-display' rows='3' placeholder='Example: sin(30)+sqrt(16)+2^3+nCr(5,2)'></textarea><div class='sci-grid'>${buttons.map(([label,val,cls]) => `<button type='button' class='${cls}' data-key='${val}'>${label}</button>`).join('')}</div><div class='result' id='resFix'>Ready. Use DEG/RAD correctly. For nCr use nCr(5,2). For root use root(27,3).</div><div class='stats-box'><h3>Statistics mode</h3><textarea id='statsData' placeholder='Example: 10, 20, 30, 40'></textarea><div class='tool-actions'><button class='btn primary' id='statsBtn' type='button'>Calculate statistics</button></div><div class='result' id='statsRes'>Mean, median, standard deviation, sum and count.</div></div><p class='sci-note'><b>Supported:</b> sin cos tan asin acos atan sinh cosh tanh log ln exp sqrt cbrt root pow abs floor ceil round trunc sign factorial nCr nPr gcd lcm mod min max rand pi e ANS memory.</p></div>`;
    $('#modeBtn').onclick = () => { mode = mode === 'DEG' ? 'RAD' : 'DEG'; $('#modeBtn').textContent = 'Mode: ' + mode; };
    $('#helpBtn').onclick = () => setResult('Examples:<br>sin(30) = 0.5 in DEG<br>log(1000) = 3<br>ln(e) = 1<br>sqrt(25)+cbrt(27)<br>nCr(5,2), nPr(5,2), fact(5)<br>root(27,3), mod(17,5), gcd(24,18)', false);
    $('#statsBtn').onclick = calcStats;
    $('#exprFix').addEventListener('keydown', e => { if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)){ e.preventDefault(); runCalc(); } });
    $$('.sci-grid button').forEach(btn => btn.onclick = () => {
      const key = btn.dataset.key;
      const input = $('#exprFix');
      if(key === 'equals') return runCalc();
      if(key === 'clear'){ input.value = input.value.slice(0,-1); input.focus(); return; }
      if(key === 'allclear'){ input.value = ''; setResult('Cleared.'); input.focus(); return; }
      if(key === 'back'){ const s = input.selectionStart ?? input.value.length; if(s > 0){ input.value = input.value.slice(0,s-1)+input.value.slice(input.selectionEnd ?? s); input.selectionStart = input.selectionEnd = s-1; } input.focus(); return; }
      if(key === 'mode'){ mode = mode === 'DEG' ? 'RAD' : 'DEG'; $('#modeBtn').textContent = 'Mode: ' + mode; return; }
      if(key === 'ans') return insertText('ans');
      if(key === 'mc'){ memory = 0; setResult('Memory cleared.'); return; }
      if(key === 'mr') return insertText('mem');
      if(key === 'mplus'){ memory += ans; setResult('Memory = ' + fmt(memory)); return; }
      if(key === 'mminus'){ memory -= ans; setResult('Memory = ' + fmt(memory)); return; }
      if(key === 'neg') return insertText('-(');
      insertText(key);
    });
  }

  document.addEventListener('click', event => {
    const card = event.target.closest('[data-tool="sci"],[data-tool="basic"]');
    if(!card) return;
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
    openAdvancedCalculator(card.dataset.tool);
  }, true);
})();
