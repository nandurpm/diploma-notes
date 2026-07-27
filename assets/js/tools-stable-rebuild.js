/* Purpose: Tools stable rebuild - Descriptive comment added for clarity */
(() => {
  'use strict';

  /* Utility functions for DOM selection and data formatting */
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  
  /* Escapes HTML special characters to prevent XSS when rendering user input */
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  
  /* Formats numbers using Indian numbering system with up to 6 decimal places */
  const fmt = v => Number.isFinite(Number(v)) ? new Intl.NumberFormat('en-IN',{maximumFractionDigits:6}).format(Number(v)) : '—';
  
  /* Validates that a value is a finite number */
  const n = (v,l='Value') => { const x = Number(String(v).trim()); if(!Number.isFinite(x)) throw new Error(l + ' must be a valid number.'); return x; };
  
  /* Validates that a value is a positive number greater than zero */
  const p = (v,l='Value') => { const x = n(v,l); if(x <= 0) throw new Error(l + ' must be greater than zero.'); return x; };
  /* Master list of all available tools with their metadata */
  const list = [
    /* Scientific and basic mathematical calculators */
    ['sci','Calculator','🧮','Scientific Calculator','Scientific expression calculator with DEG trigonometry.'],['basic','Calculator','➕','Basic Calculator','Fast expression calculator for +, −, ×, ÷ and %.'],['unit','Calculator','↔️','Unit Converter','Length, mass, area, volume and pressure conversion.'],['percent','Calculator','%','Percentage Calculator','Percentage value and percentage change.'],['ratio','Calculator','∶','Ratio Calculator','Simplify two-number ratios.'],['avg','Calculator','📊','Average Calculator','Average, sum and count of comma-separated values.'],
    /* Electrical and electronics engineering tools */
    ['ohm','Electrical / Electronics','Ω','Ohm’s Law Calculator','Calculate V, I or R by leaving one box blank.'],['power','Electrical / Electronics','⚡','Power Calculator','Calculate electrical power using P = VI.'],['divider','Electrical / Electronics','🔌','Voltage Divider Calculator','Find Vout from Vin, R1 and R2.'],['color','Electrical / Electronics','🎨','Resistor Color Code Calculator','4-band resistor value calculator.'],['res','Electrical / Electronics','🔗','Series / Parallel Resistance Calculator','Equivalent resistance for comma-separated values.'],['cap','Electrical / Electronics','▭','Capacitor Code Calculator','Decode 3-digit capacitor codes.'],['led','Electrical / Electronics','💡','LED Resistor Calculator','Select LED series resistor.'],['tr','Electrical / Electronics','🧲','Transformer Ratio Calculator','Turns ratio and secondary voltage.'],['bat','Electrical / Electronics','🔋','Battery Backup Calculator','Approximate battery backup time.'],['drop','Electrical / Electronics','📏','Wire Size / Voltage Drop Calculator','Copper wire voltage drop estimate.'],
    /* Civil engineering and construction estimators */
    ['mix','Civil','🧱','Concrete Mix Calculator','Dry material estimate from mix ratio.'],['brick','Civil','🧱','Brick Quantity Calculator','Brick estimate for a wall.'],['csa','Civil','🏗️','Cement/Sand/Aggregate Estimator','Concrete materials and cement bags.'],['area','Civil','📐','Area Calculator','Rectangle, triangle and circle area.'],['vol','Civil','📦','Volume Calculator','Cuboid, cylinder and cone volume.'],['uw','Civil','⚖️','Unit Weight Converter','kg/m³ and kN/m³ conversion.'],
    /* Mechanical engineering and physics calculators */
    ['rpm','Mechanical','🔄','Rotational to Linear Speed','Calculate surface speed from diameter and RPM using v = πDN/60.'],['torque','Mechanical','🔧','Torque Calculator','Torque = force × radius.'],['ptr','Mechanical','⚙️','Power-Torque-RPM Calculator','P = 2πNT/60.'],['gear','Mechanical','⚙️','Gear Ratio Calculator','Gear ratio and output speed.'],['press','Mechanical','🧯','Pressure Converter','Pa, kPa, bar, psi and atm.'],['temp','Mechanical','🌡️','Temperature Converter','Celsius, Fahrenheit and Kelvin.'],
    /* Academic and student performance tools */
    ['cgpa','Academic','🎓','CGPA / SGPA Calculator','Weighted grade point calculator.'],['att','Academic','✅','Attendance Percentage Calculator','Attendance percentage and classes needed.'],['internal','Academic','📝','Internal Marks Calculator','Add internal marks components.'],['pass','Academic','🎯','Exam Passing Marks Calculator','Marks needed to pass.'],['plan','Academic','📅','Study Planner','Split topics across days.'],['timer','Academic','⏱️','Daily Revision Timer','Pomodoro style revision timer.'],
    /* Text processing and document helpers */
    ['grammar','Text / Document','✍️','Grammar Checker Frontend Helper','Rule-based spacing, capitalization and common typo helper.'],['words','Text / Document','🔢','Word Counter','Words, characters and reading time.'],['case','Text / Document','Aa','Case Converter','Upper, lower, title and sentence case.'],['clean','Text / Document','🧹','Text Cleaner','Remove extra spaces and blank lines.'],['letter','Text / Document','📄','Application Letter Helper','Editable application letter template.'],['lab','Text / Document','📘','Lab Record Formatting Helper','Aim, apparatus, theory, procedure and result format.']
  ].map(x => ({id:x[0],cat:x[1],icon:x[2],title:x[3],desc:x[4]}));
  const cats = ['All',...new Set(list.map(t => t.cat))];
  const favKey = 'polyToolsFav2', recKey = 'polyToolsRecent2';
  let activeCat = 'All', onlyFav = false, lastOpener = null;
  /* Helper to retrieve data from localStorage with a fallback default */
  const get = (k,d=[]) => { try { return JSON.parse(localStorage.getItem(k)||'null') ?? d; } catch { return d; } };
  
  /* Helper to save data to localStorage */
  const set = (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  
  /* Checks if a tool ID is in the user's favorites list */
  const fav = id => get(favKey).includes(id);
  
  /* Adds a tool ID to the recently used list, keeping only the latest 8 */
  const recent = id => set(recKey,[id,...get(recKey).filter(x=>x!==id)].slice(0,8));
  function card(t){ return `<article class='card'><button class='tool-open' data-tool='${esc(t.id)}' type='button' aria-label='Open ${esc(t.title)}'><span class='tool-icon' aria-hidden='true'>${t.icon}</span><h3>${esc(t.title)}</h3><p>${esc(t.desc)}</p><span class='tag'>${esc(t.cat)}</span></button><button class='btn fav2' data-id='${esc(t.id)}' type='button' aria-label='${fav(t.id)?'Remove':'Add'} ${esc(t.title)} ${fav(t.id)?'from':'to'} favorites'>${fav(t.id)?'★':'☆'} Favorite</button></article>`; }
  function render(){
    const q = ($('#q')?.value || '').toLowerCase().trim();
    const shown = list.filter(t => (activeCat === 'All' || t.cat === activeCat) && (!onlyFav || fav(t.id)) && `${t.title} ${t.desc} ${t.cat}`.toLowerCase().includes(q));
    $('#tc') && ($('#tc').textContent = list.length);
    const countCard = $('#toolCountCard'); if (countCard) countCard.hidden = false;
    $('#shown') && ($('#shown').textContent = `${shown.length} of ${list.length} tools shown`);
    $('#grid') && ($('#grid').innerHTML = shown.map(card).join('') || `<p class='notice'>No tools found.</p>`);
    const r = get(recKey).map(id => list.find(t => t.id === id)).filter(Boolean);
    if($('#recentSec')) $('#recentSec').hidden = !r.length;
    if($('#recent')) $('#recent').innerHTML = r.map(card).join('');
    $$('.tool-open').forEach(button => button.onclick = () => openTool(button.dataset.tool, button));
    $$('.fav2').forEach(b => b.onclick = e => { e.stopPropagation(); const a=get(favKey); set(favKey, a.includes(b.dataset.id) ? a.filter(x=>x!==b.dataset.id) : [...a,b.dataset.id]); render(); });
    const favBtn = $('#fav'); if (favBtn) favBtn.setAttribute('aria-pressed', onlyFav ? 'true' : 'false');
  }
  /* Dynamically generates input fields and action buttons for a specific tool */
  function fields(defs, calc, note=''){
    $('#body').innerHTML = `<form class='form' id='toolForm'>${defs.map((d,index)=>{const id=`tool-field-${index}`;return `<div class='field'><label for='${id}'>${esc(d[1])}</label><input id='${id}' name='${esc(d[0])}' value='${esc(d[2]??'')}' placeholder='${esc(d[3]??'')}'></div>`;}).join('')}</form>${note?`<div class='notice'>${note}</div>`:''}<div class='tool-actions'><button class='btn primary' id='calcBtn' type='button'>Calculate</button><button class='btn' id='resetBtn' type='button'>Reset</button></div><div class='result' id='res' role='status' aria-live='polite'>Enter values and press Calculate.</div>`;
    
    /* Intercept Enter key inside the form to programmatically trigger calculation */
    const tf = $('#toolForm');
    if (tf) {
      tf.onkeydown = e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          $('#calcBtn')?.click();
        }
      };
    }

    /* Handle calculation logic and display results or errors */
    $('#calcBtn').onclick = () => { try { const f = new FormData($('#toolForm')); $('#res').className = 'result'; $('#res').innerHTML = calc(f); } catch(e){ $('#res').className = 'result err'; $('#res').textContent = e.message || 'Calculation failed.'; } };
    
    /* Reset the form fields and result display */
    $('#resetBtn').onclick = () => { $('#toolForm').reset(); $('#res').textContent='Enter values and press Calculate.'; };
  }
  /* Parses and evaluates mathematical expressions securely */
  function evaluateExpression(raw){
    /* Pre-process the expression: handle pi, power operator, and percentages */
    let expression=String(raw||'').trim().toLowerCase().replace(/π/g,'pi').replace(/\^/g,'**').replace(/(\d+(?:\.\d+)?)%/g,'($1/100)');
    if(!expression) throw new Error('Enter an expression.');
    
    /* Security check: allow only specific mathematical characters and symbols */
    if(/[^0-9+\-*/%().,\sA-Za-z_]/.test(expression)) throw new Error('Unsupported character.');
    
    /* Define available mathematical functions and constants (trig in degrees) */
    const scope={pi:Math.PI,e:Math.E,sin:x=>Math.sin(x*Math.PI/180),cos:x=>Math.cos(x*Math.PI/180),tan:x=>Math.tan(x*Math.PI/180),asin:x=>Math.asin(x)*180/Math.PI,acos:x=>Math.acos(x)*180/Math.PI,atan:x=>Math.atan(x)*180/Math.PI,sqrt:Math.sqrt,cbrt:Math.cbrt,log:Math.log10,ln:Math.log,abs:Math.abs,pow:Math.pow,min:Math.min,max:Math.max,round:Math.round,floor:Math.floor,ceil:Math.ceil};
    
    /* Ensure only allowed functions are called in the expression */
    const allowed=new Set(Object.keys(scope));
    for(const token of expression.match(/[A-Za-z_]\w*/g)||[]){if(!allowed.has(token)) throw new Error('Unsupported function: '+token);}
    
    /* Execute the expression within the restricted scope */
    const value=Function(...Object.keys(scope),'"use strict";return ('+expression+');')(...Object.values(scope));
    if(!Number.isFinite(value)) throw new Error('Result is not finite.');
    return value;
  }
  function expression(){ $('#body').innerHTML = `<label class='sr-only' for='expr'>Expression</label><textarea id='expr' rows='5' placeholder='Example: sin(30)+sqrt(16)+2^3'></textarea><div class='notice'>Allowed: + - * / ^ %, brackets, sqrt(), cbrt(), sin(), cos(), tan(), inverse trigonometry, log(), ln(), pi and e. Trigonometry uses degrees.</div><div class='tool-actions'><button class='btn primary' id='calcBtn' type='button'>Calculate</button><button class='btn' id='clearBtn' type='button'>Clear</button></div><div class='result' id='res' role='status' aria-live='polite'>Ready.</div>`; $('#clearBtn').onclick=()=>{$('#expr').value='';$('#res').textContent='Cleared.'}; $('#calcBtn').onclick=()=>{try{const value=evaluateExpression($('#expr').value);$('#res').className='result';$('#res').innerHTML=`<b>${fmt(value)}</b>`;}catch(err){$('#res').className='result err';$('#res').textContent=err.message||'Invalid expression.'}}; }
  const gcd=(a,b)=>{a=Math.abs(Math.round(a));b=Math.abs(Math.round(b));while(b)[a,b]=[b,a%b];return a||1};
  const unitMaps={length:{mm:.001,cm:.01,m:1,km:1000,in:.0254,ft:.3048},mass:{g:.001,kg:1,tonne:1000,lb:.453592},area:{sqm:1,sqmm:1e-6,sqcm:1e-4,sqft:.092903},volume:{ml:.001,l:1,m3:1000,ft3:28.3168},pressure:{pa:1,kpa:1000,bar:100000,psi:6894.76,atm:101325}};
  const pressure={pa:1,kpa:1000,bar:100000,psi:6894.76,atm:101325};
  const colors={black:[0,1],brown:[1,10],red:[2,100],orange:[3,1000],yellow:[4,10000],green:[5,100000],blue:[6,1000000],violet:[7,10000000],grey:[8,100000000],white:[9,1000000000],gold:[null,.1],silver:[null,.01]};
  const calc={
    sci:()=>expression(), basic:()=>expression(),
    unit:()=>fields([['value','Value','1'],['type','Type','length','length/mass/area/volume/pressure'],['from','From unit','m'],['to','To unit','cm']], f=>{const m=unitMaps[String(f.get('type')).toLowerCase()]; if(!m) throw new Error('Supported types: length, mass, area, volume, pressure.'); const from=String(f.get('from')).toLowerCase(), to=String(f.get('to')).toLowerCase(); if(!m[from]||!m[to]) throw new Error('Invalid unit.'); return `<b>${fmt(n(f.get('value'),'Value')*m[from]/m[to])} ${esc(to)}</b>`;}, 'Linear speed and RPM are not directly interchangeable. Use Rotational to Linear Speed when diameter is known.'),
    percent:()=>fields([['value','Value','200'],['percent','Percent','10'],['old','Old value for change',''],['new','New value for change','']], f=>{let out=`${fmt(n(f.get('percent'),'Percent')/100*n(f.get('value'),'Value'))}`; if(f.get('old')&&f.get('new')) out += `<br>Change = ${fmt((n(f.get('new'),'New')-n(f.get('old'),'Old'))/p(f.get('old'),'Old')*100)}%`; return `<b>${out}</b>`;}),
    ratio:()=>fields([['a','First number','12'],['b','Second number','18']], f=>{const a=n(f.get('a'),'First'),b=n(f.get('b'),'Second'),g=gcd(a,b);return `<b>${fmt(a/g)} : ${fmt(b/g)}</b>`;}),
    avg:()=>fields([['values','Numbers separated by comma','10,20,30']], f=>{const a=String(f.get('values')).split(',').map(Number).filter(Number.isFinite); if(!a.length) throw new Error('Enter numbers separated by comma.'); return `<b>Average = ${fmt(a.reduce((s,x)=>s+x,0)/a.length)}</b><br>Sum = ${fmt(a.reduce((s,x)=>s+x,0))}, Count = ${a.length}`;}),
    ohm:()=>fields([['v','Voltage V',''],['i','Current A',''],['r','Resistance Ω','']], f=>{const V=f.get('v'),I=f.get('i'),R=f.get('r'); if(!V&&I&&R)return`<b>V = ${fmt(n(I,'Current')*n(R,'Resistance'))} V</b>`; if(V&&!I&&R)return`<b>I = ${fmt(n(V,'Voltage')/p(R,'Resistance'))} A</b>`; if(V&&I&&!R)return`<b>R = ${fmt(n(V,'Voltage')/p(I,'Current'))} Ω</b>`; throw new Error('Fill any two values and leave one blank.');}),
    power:()=>fields([['v','Voltage V','230'],['i','Current A','2']], f=>`<b>P = ${fmt(n(f.get('v'),'Voltage')*n(f.get('i'),'Current'))} W</b>`),
    divider:()=>fields([['vin','Input voltage','12'],['r1','R1 Ω','1000'],['r2','R2 Ω','1000']], f=>`<b>Vout = ${fmt(n(f.get('vin'),'Input')*p(f.get('r2'),'R2')/(p(f.get('r1'),'R1')+p(f.get('r2'),'R2')))} V</b>`),
    color:()=>fields([['b1','Band 1','brown'],['b2','Band 2','black'],['mul','Multiplier','red'],['tol','Tolerance','gold']], f=>{const b1=colors[String(f.get('b1')).toLowerCase()],b2=colors[String(f.get('b2')).toLowerCase()],m=colors[String(f.get('mul')).toLowerCase()]; if(!b1||!b2||!m||b1[0]===null||b2[0]===null) throw new Error('Invalid color.'); return `<b>${fmt(((b1[0]*10)+b2[0])*m[1])} Ω</b><br>Tolerance: ${esc(f.get('tol'))}`;}, 'Valid colors: black, brown, red, orange, yellow, green, blue, violet, grey, white, gold, silver'),
    res:()=>fields([['mode','Mode','series','series or parallel'],['values','Resistance values Ω','100,200,300']], f=>{const a=String(f.get('values')).split(',').map(Number).filter(x=>Number.isFinite(x)&&x>0); if(!a.length) throw new Error('Enter resistor values.'); const mode=String(f.get('mode')).toLowerCase(); const r=mode.includes('parallel')?1/a.reduce((s,x)=>s+1/x,0):a.reduce((s,x)=>s+x,0); return `<b>Req = ${fmt(r)} Ω</b>`;}),
    cap:()=>fields([['code','3-digit code','104']], f=>{const c=String(f.get('code')).trim(); if(!/^\d{3}$/.test(c)) throw new Error('Enter 3 digit code like 104.'); const pf=Number(c.slice(0,2))*Math.pow(10,Number(c[2])); return `<b>${fmt(pf)} pF</b><br>${fmt(pf/1000)} nF | ${fmt(pf/1000000)} µF`; }),
    led:()=>fields([['vs','Supply V','12'],['vf','LED Vf','2'],['i','Current mA','20']], f=>`<b>R = ${fmt((n(f.get('vs'),'Supply')-n(f.get('vf'),'LED Vf'))/(p(f.get('i'),'Current')/1000))} Ω</b>`),
    tr:()=>fields([['vp','Primary voltage','230'],['np','Primary turns','1000'],['ns','Secondary turns','100']], f=>`<b>Vs = ${fmt(n(f.get('vp'),'Vp')*p(f.get('ns'),'Ns')/p(f.get('np'),'Np'))} V</b><br>Ratio Np:Ns = ${fmt(p(f.get('np'),'Np')/p(f.get('ns'),'Ns'))}:1`),
    bat:()=>fields([['ah','Battery Ah','7'],['v','Battery voltage','12'],['load','Load W','20'],['eff','Efficiency %','85']], f=>`<b>Backup ≈ ${fmt(p(f.get('ah'),'Ah')*p(f.get('v'),'Voltage')*(n(f.get('eff'),'Efficiency')/100)/p(f.get('load'),'Load'))} hours</b>`),
    drop:()=>fields([['i','Current A','5'],['l','One-way length m','20'],['a','Cable area mm²','1.5'],['v','Supply voltage','230']], f=>{const vd=2*n(f.get('i'),'Current')*n(f.get('l'),'Length')*0.0175/p(f.get('a'),'Area'); return `<b>Voltage drop ≈ ${fmt(vd)} V</b><br>${fmt(vd/p(f.get('v'),'Supply')*100)}% of supply`;}, 'Copper, single-phase estimate using 0.0175 Ω·mm²/m. Verify final cable selection against applicable standards.'),
    mix:()=>fields([['vol','Wet concrete volume m³','1'],['ratio','Mix ratio','1:2:4']], concrete), csa:()=>fields([['vol','Wet concrete volume m³','1'],['ratio','Mix ratio','1:1.5:3']], concrete),
    brick:()=>fields([['l','Wall length m','5'],['h','Wall height m','3'],['t','Wall thickness m','0.2'],['bl','Brick length m','0.19'],['bh','Brick height m','0.09'],['bt','Brick thickness m','0.09']], f=>{const wall=p(f.get('l'),'Length')*p(f.get('h'),'Height')*p(f.get('t'),'Thickness'); const brick=p(f.get('bl'),'Brick length')*p(f.get('bh'),'Brick height')*p(f.get('bt'),'Brick thickness'); return `<b>Bricks ≈ ${Math.ceil(wall/brick)}</b><br>Wall volume = ${fmt(wall)} m³`; }),
    area:()=>fields([['shape','Shape','rectangle','rectangle/triangle/circle'],['a','Length/Base/Radius','10'],['b','Width/Height','5']], f=>{const s=String(f.get('shape')).toLowerCase(),a=p(f.get('a'),'A'); const area=s.includes('circle')?Math.PI*a*a:s.includes('tri')?a*p(f.get('b'),'B')/2:a*p(f.get('b'),'B'); return `<b>Area = ${fmt(area)}</b>`;}),
    vol:()=>fields([['shape','Shape','cuboid','cuboid/cylinder/cone'],['a','Length/Radius','2'],['b','Width/Height','3'],['c','Height for cuboid','4']], f=>{const s=String(f.get('shape')).toLowerCase(),a=p(f.get('a'),'A'); const v=s.includes('cyl')?Math.PI*a*a*p(f.get('b'),'Height'):s.includes('cone')?Math.PI*a*a*p(f.get('b'),'Height')/3:a*p(f.get('b'),'B')*p(f.get('c'),'C'); return `<b>Volume = ${fmt(v)}</b>`;}),
    uw:()=>fields([['value','Value','1000'],['from','From','kgm3','kgm3 or knm3']], f=>{const v=n(f.get('value'),'Value'), from=String(f.get('from')).toLowerCase(); return from.includes('kn')?`<b>${fmt(v*101.9716)} kg/m³</b>`:`<b>${fmt(v*9.81/1000)} kN/m³</b>`;}),
    rpm:()=>fields([['d','Diameter mm','100'],['rpm','Rotational speed RPM','500']], f=>{const diameterM=p(f.get('d'),'Diameter')/1000;const rpm=p(f.get('rpm'),'RPM');const mps=Math.PI*diameterM*rpm/60;return `<b>Linear speed = ${fmt(mps)} m/s</b><br>${fmt(mps*60)} m/min<br>Formula: v = πDN/60`;}, 'RPM is angular speed. Diameter is required to calculate linear surface speed.'),
    torque:()=>fields([['f','Force N','100'],['r','Arm radius m','0.5']], f=>`<b>Torque = ${fmt(n(f.get('f'),'Force')*n(f.get('r'),'Radius'))} N·m</b>`),
    ptr:()=>fields([['rpm','RPM','1440'],['torque','Torque N·m','10']], f=>`<b>Power = ${fmt(2*Math.PI*n(f.get('rpm'),'RPM')*n(f.get('torque'),'Torque')/60)} W</b>`),
    gear:()=>fields([['driver','Driver teeth','20'],['driven','Driven teeth','60'],['rpm','Input RPM','900']], f=>{const ratio=p(f.get('driven'),'Driven')/p(f.get('driver'),'Driver'); return `<b>Gear ratio = ${fmt(ratio)}:1</b><br>Output speed = ${fmt(p(f.get('rpm'),'RPM')/ratio)} RPM`; }),
    press:()=>fields([['value','Value','1'],['from','From','bar'],['to','To','psi']], f=>{const from=String(f.get('from')).toLowerCase(),to=String(f.get('to')).toLowerCase(); if(!pressure[from]||!pressure[to]) throw new Error('Units: pa, kpa, bar, psi, atm'); return `<b>${fmt(n(f.get('value'),'Value')*pressure[from]/pressure[to])} ${esc(to)}</b>`;}),
    temp:()=>fields([['value','Value','100'],['from','From','c'],['to','To','f']], f=>{let v=n(f.get('value'),'Value'), from=String(f.get('from')).toLowerCase(), to=String(f.get('to')).toLowerCase(); let c=from.startsWith('f')?(v-32)*5/9:from.startsWith('k')?v-273.15:v; let out=to.startsWith('f')?c*9/5+32:to.startsWith('k')?c+273.15:c; return `<b>${fmt(out)} °${esc(to.toUpperCase())}</b>`;}),
    cgpa:()=>fields([['gp','Grade points','8,9,7'],['cr','Credits','4,4,3']], f=>{const gp=String(f.get('gp')).split(',').map(Number),cr=String(f.get('cr')).split(',').map(Number); if(gp.length!==cr.length||!gp.every(Number.isFinite)||!cr.every(Number.isFinite)) throw new Error('Grade points and credits must match.'); const total=cr.reduce((s,x)=>s+x,0); return `<b>SGPA / CGPA = ${fmt(gp.reduce((s,x,i)=>s+x*cr[i],0)/total)}</b>`;}),
    att:()=>fields([['att','Attended classes','36'],['total','Total classes','45'],['target','Target %','75']], f=>{const a=n(f.get('att'),'Attended'),t=p(f.get('total'),'Total'),target=n(f.get('target'),'Target')/100; const need=Math.max(0,Math.ceil((target*t-a)/(1-target))); return `<b>${fmt(a/t*100)}%</b><br>Classes needed for target if no absence: ${need}`;}),
    internal:()=>fields([['marks','Marks separated by comma','8,9,7,10']], f=>{const a=String(f.get('marks')).split(',').map(Number).filter(Number.isFinite); if(!a.length) throw new Error('Enter marks.'); return `<b>Total = ${fmt(a.reduce((s,x)=>s+x,0))}</b>`;}),
    pass:()=>fields([['max','Maximum marks','100'],['pass','Pass %','40'],['scored','Already scored','25']], f=>`<b>Need ${fmt(Math.max(0,p(f.get('max'),'Max')*n(f.get('pass'),'Pass')/100-n(f.get('scored'),'Scored')))} more marks</b>`),
    plan:()=>fields([['topics','Number of topics','20'],['days','Available days','5']], f=>`<b>${Math.ceil(p(f.get('topics'),'Topics')/p(f.get('days'),'Days'))} topics/day</b>`),
    timer:()=>timer(), grammar:()=>textTool('grammar'), words:()=>textTool('words'), case:()=>textTool('case'), clean:()=>textTool('clean'), letter:()=>letter(), lab:()=>lab()
  };
  function concrete(f){const vol=p(f.get('vol'),'Volume')*1.54, parts=String(f.get('ratio')).split(':').map(Number); if(parts.length!==3||!parts.every(x=>x>0)) throw new Error('Ratio format must be 1:2:4'); const sum=parts.reduce((s,x)=>s+x,0), cement=vol*parts[0]/sum, sand=vol*parts[1]/sum, agg=vol*parts[2]/sum; return `<b>Cement ≈ ${fmt(cement*1440/50)} bags</b><br>Sand ≈ ${fmt(sand)} m³<br>Aggregate ≈ ${fmt(agg)} m³`;}
  function timer(){ $('#body').innerHTML=`<div class='result'><b id='time'>25:00</b><br>Revision timer</div><div class='tool-actions'><button class='btn primary' id='start' type='button'>Start</button><button class='btn' id='pause' type='button'>Pause</button><button class='btn' id='reset' type='button'>Reset</button></div>`; let left=1500, run=null; const show=()=>$('#time').textContent=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`; $('#start').onclick=()=>{if(run)return;run=setInterval(()=>{left=Math.max(0,left-1);show();if(!left){clearInterval(run);run=null;}},1000)}; $('#pause').onclick=()=>{clearInterval(run);run=null}; $('#reset').onclick=()=>{clearInterval(run);run=null;left=1500;show()}; }
  function textTool(kind){ $('#body').innerHTML=`<label class='sr-only' for='text'>Text</label><textarea id='text' rows='9' placeholder='Paste or type text here'></textarea><div class='tool-actions'><button class='btn primary' id='run' type='button'>Run Tool</button></div><div class='result' id='res' role='status' aria-live='polite'>Ready.</div>`; $('#run').onclick=()=>{let t=$('#text').value; if(kind==='words'){const w=t.trim()?t.trim().split(/\s+/).length:0;$('#res').innerHTML=`<b>${w}</b> words<br>${t.length} characters<br>Reading time ≈ ${fmt(w/180)} min`;return;} if(kind==='case'){ $('#text').value=t.toLowerCase().replace(/(^|\.\s+)([a-z])/g,(m,a,b)=>a+b.toUpperCase()); $('#res').textContent='Converted to sentence case.'; return;} if(kind==='clean'){ $('#text').value=t.replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim(); $('#res').textContent='Cleaned.'; return;} $('#text').value=t.replace(/\s+([,.!?])/g,'$1').replace(/(^|\.\s+)([a-z])/g,(m,a,b)=>a+b.toUpperCase()).replace(/\bi\b/g,'I'); $('#res').textContent='Basic rule-based cleanup completed. It is not a full AI grammar checker.';}; }
  function letter(){ $('#body').innerHTML=`<label class='sr-only' for='letterText'>Application letter</label><textarea id='letterText' rows='13'>To\nThe Principal\n\nSubject: Application for leave\n\nRespected Sir/Madam,\nI request leave for ______ due to ______. Kindly grant permission.\n\nYours faithfully,\nName:\nClass:\nRoll No:</textarea>`; }
  function lab(){ $('#body').innerHTML=`<label class='sr-only' for='labText'>Lab record format</label><textarea id='labText' rows='14'>Experiment No:\nDate:\nAim:\nApparatus / Software Required:\nTheory:\nProcedure:\nObservation / Drawing Details:\nResult:\nPrecautions:\nViva Questions:</textarea>`; }
  function closeModal(){ const modal=$('#modal'); if(!modal)return; modal.hidden=true; document.body.style.overflow=''; lastOpener?.focus?.(); lastOpener=null; }
  function openTool(id, opener){ const t=list.find(x=>x.id===id); if(!t)return; lastOpener=opener||document.activeElement; recent(id); $('#cat').textContent=t.cat; $('#ttl').textContent=t.title; $('#desc').textContent=t.desc; $('#modal').hidden=false; document.body.style.overflow='hidden'; (calc[id]||(()=>{$('#body').innerHTML='<div class="result">Tool not configured.</div>'}))(); const firstInput = $('#body input, #body textarea'); if (firstInput) { firstInput.focus(); if (typeof firstInput.select === 'function') firstInput.select(); } else { $('#x')?.focus(); } render(); }
  function init(){ const style=document.createElement('style'); style.textContent='.card{cursor:default}.tool-open{display:flex;flex:1;flex-direction:column;gap:10px;width:100%;padding:0;border:0;background:transparent;color:inherit;text-align:left;cursor:pointer}.tool-open:focus-visible{outline:3px solid rgba(36,87,245,.24);outline-offset:4px;border-radius:14px}.tool-icon{font-size:34px}.field input:focus,textarea:focus{outline:3px solid rgba(36,87,245,.18);border-color:#2457f5}.notice{font-size:.92rem}.result{font-size:1rem}.result b{font-size:clamp(26px,4vw,42px)}'; document.head.appendChild(style); $('#chips') && ($('#chips').innerHTML=cats.map(c=>`<button class='chip ${c==='All'?'on':''}' data-cat='${esc(c)}' type='button' aria-pressed='${c==='All'?'true':'false'}'>${esc(c)}</button>`).join('')); $$('.chip').forEach(b=>b.onclick=()=>{activeCat=b.dataset.cat;$$('.chip').forEach(x=>{const active=x===b;x.classList.toggle('on',active);x.setAttribute('aria-pressed',active?'true':'false');});render();}); $('#q') && ($('#q').oninput=render); $('#fav') && ($('#fav').onclick=()=>{onlyFav=!onlyFav;$('#fav').classList.toggle('primary',onlyFav);render();}); $('#clear') && ($('#clear').onclick=()=>{set(recKey,[]);render();}); $('#x') && ($('#x').onclick=closeModal); $('#modal') && ($('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()}); document.addEventListener('keydown',e=>{const modal=$('#modal');if(!modal||modal.hidden)return;if(e.key==='Escape'){closeModal();return}if(e.key==='Tab'){const focusable=[...modal.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(node=>!node.disabled&&!node.hidden);if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}}); document.querySelectorAll('[data-year]').forEach(node=>node.textContent=new Date().getFullYear()); render(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
