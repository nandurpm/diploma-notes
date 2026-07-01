(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const fmt = v => Number.isFinite(Number(v)) ? new Intl.NumberFormat('en-IN',{maximumFractionDigits:8}).format(Number(v)) : '—';
  function safeEval(raw){
    let e = String(raw || '').toLowerCase()
      .replace(/π/g,'pi').replace(/\bpi\b/g,'Math.PI').replace(/\be\b/g,'Math.E').replace(/\^/g,'**')
      .replace(/sqrt\(/g,'Math.sqrt(').replace(/log\(/g,'Math.log10(').replace(/ln\(/g,'Math.log(')
      .replace(/sin\(([^()]+)\)/g,'Math.sin(($1)*Math.PI/180)')
      .replace(/cos\(([^()]+)\)/g,'Math.cos(($1)*Math.PI/180)')
      .replace(/tan\(([^()]+)\)/g,'Math.tan(($1)*Math.PI/180)').replace(/%/g,'/100');
    if(/[^0-9+\-*/().,\sA-Za-z]/.test(e)) throw new Error('Unsupported character. Use numbers and listed functions only.');
    if(!/^[0-9+\-*/().,\sMathPIEsincoqrtlg]+$/.test(e)) throw new Error('Unsupported function.');
    const value = Function('return (' + e + ')')();
    if(!Number.isFinite(value)) throw new Error('Result is not finite.');
    return value;
  }
  function openCalculator(kind){
    const modal = $('#modal'); if(!modal) return;
    $('#cat').textContent = 'Calculator';
    $('#ttl').textContent = kind === 'basic' ? 'Basic Calculator' : 'Scientific Calculator';
    $('#desc').textContent = kind === 'basic' ? 'Use +, -, *, /, %, brackets and decimals.' : 'Use sqrt(), sin(), cos(), tan(), log(), ln(), powers and pi. Trigonometry is DEG mode.';
    modal.hidden = false;
    $('#body').innerHTML = `<textarea id='exprFix' rows='5' placeholder='Example: sin(30)+sqrt(16)+2^3'></textarea><div class='notice'>Allowed: + - * / ^, %, brackets, sqrt(), sin(), cos(), tan(), log(), ln(), pi. Trigonometry uses degrees.</div><div class='tool-actions'><button class='btn primary' id='calcFix' type='button'>Calculate</button><button class='btn' id='clearFix' type='button'>Clear</button></div><div class='result' id='resFix'>Ready.</div>`;
    $('#clearFix').onclick = () => { $('#exprFix').value = ''; $('#resFix').textContent = 'Cleared.'; };
    $('#calcFix').onclick = () => { try { $('#resFix').className = 'result'; $('#resFix').innerHTML = `<b>${fmt(safeEval($('#exprFix').value))}</b>`; } catch(e){ $('#resFix').className = 'result err'; $('#resFix').textContent = e.message || 'Invalid expression.'; } };
  }
  document.addEventListener('click', event => {
    const card = event.target.closest('[data-tool="sci"],[data-tool="basic"]');
    if(!card) return;
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
    openCalculator(card.dataset.tool);
  }, true);
})();
