/* util shortcuts */
const $ = id => document.getElementById(id);
const pad = n => n.toString().padStart(2,'0');
const toast = msg => {
  const div = document.createElement('div');
  div.className='toastMsg'; div.textContent=msg;
  $('toast').append(div);
};

/* global state & restore */
let S = JSON.parse(localStorage.getItem('cairon.session')||'null');
let globalTick, turnTick;

/* --- Session Start / Stop ------------------------------------------- */
$('btnSessionToggle').onclick = () => {
  if(!S){ startSession(); } else { stopSession(); }
};
function startSession(){
  /* validate */
  const id = $('sessionId').value.trim();
  const num = +$('numPlayers').value;
  if(!/T\d{2}-G\d{2}/.test(id) || !num){ toast('Completa los datos'); return; }

  S = { id, numPlayers:num, date:today(), start:Date.now(), turns:[] };
  persist(); uiAfterSessionStart();
}
function uiAfterSessionStart(){
  /* stepper */
  $('stepSession').classList.remove('active');
  $('stepTurn').classList.add('active');
  /* players */
  const opts = Array.from({length:S.numPlayers},(_,i)=>`P${pad(i+1)}`);
  $('playerSelect').innerHTML = opts.map(p=>`<option>${p}</option>`).join('');
  /* timers */
  startGlobalTimer();
  $('btnSessionToggle').textContent='Stop Session';
  /* history + fab */
  $('historyCard').classList.remove('hidden');
  $('btnEndSession').classList.remove('hidden');
}
function startGlobalTimer(){
  tickGlobal(); globalTick = setInterval(tickGlobal,1000);
  function tickGlobal(){
    const diff = Math.floor((Date.now()-S.start)/1000);
    $('globalClock').textContent = hms(diff);
  }
}
/* --- Turn Timer ------------------------------------------------------ */
$('btnTurnToggle').onclick = toggleTurnTimer;
function toggleTurnTimer(){
  if(!turnTick){ startTurn(); } else { stopTurn(); }
}
function startTurn(){
  S._turnStart = Date.now(); $('btnTurnToggle').textContent='Stop';
  $('btnSaveTurn').disabled=true;
  tickTurn(); turnTick = setInterval(tickTurn,1000);
  function tickTurn(){ $('turnClock').textContent = seconds(Date.now()-S._turnStart)+' s'; }
}
function stopTurn(){
  clearInterval(turnTick); turnTick=null; $('btnTurnToggle').textContent='Start';
  $('btnSaveTurn').disabled=false;
}
/* --- Save Turn ------------------------------------------------------- */
$('btnSaveTurn').onclick = () => {
  const t = {
    turnNo   : (S.turns.length+1),
    player   : $('playerSelect').value,
    duration : seconds(Date.now()-S._turnStart),
    completedCreature: $('completedCreature').checked,
    effectActivated : $('effectActivated').value,
    effectDirection : $('effectDirection').value,
    miracleUsed     : $('miracleUsed').checked,
    prodigyUsed     : $('prodigyUsed').checked,
    naturalDisaster : $('naturalDisaster').value,
    notes    : $('turnNotes').value.trim()
  };
  S.turns.push(t); persist(); insertRow(t); toast(`Turno ${t.turnNo} guardado`);
  /* reset form */
  $('turnClock').textContent='0 s'; $('turnNotes').value='';
  $('completedCreature').checked = $('miracleUsed').checked = $('prodigyUsed').checked = false;
  $('effectActivated').selectedIndex=0; $('effectDirection').selectedIndex=0; $('naturalDisaster').selectedIndex=0;
  /* auto-advance player */
  const sel = $('playerSelect');
  sel.selectedIndex = (sel.selectedIndex+1)%sel.options.length;
  $('btnSaveTurn').disabled=true;
};
/* --- End Session / Export (same logic as in previous answer) --------- */
/* ----------- Shorcuts ------------------------------------------------ */
document.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey){
    if(e.key.toLowerCase()==='s'){ e.preventDefault(); $('btnSessionToggle').click(); }
  }else if(e.key===' '){ if(!e.target.closest('textarea, input')){ e.preventDefault(); $('btnTurnToggle').click(); } }
  else if(e.key==='Enter'&&$('btnSaveTurn')&&!$('btnSaveTurn').disabled){ $('btnSaveTurn').click(); }
});
/* utilities */
function persist(){ localStorage.setItem('cairon.session', JSON.stringify(S)); }
function today(){ return new Date().toISOString().slice(0,10); }
const seconds = ms => Math.floor(ms/1000);
const hms = sec => `${pad(sec/3600)}:${pad(sec/60%60)}:${pad(sec%60)}`;

/* -------- restore on load */
if(S){ uiAfterSessionStart(); S.turns.forEach(insertRow); }
$('sessionDate').value = today();
function insertRow(t){
  if(!$('#turnTable thead').children.length){
    $('#turnTable thead').innerHTML = `<tr>
      <th>T</th><th>P</th><th>Dur</th><th>Creature</th><th>Eff</th>
      <th>Dir</th><th>M</th><th>Pr</th><th>Dis</th><th>Notes</th></tr>`;
  }
  const tr = document.createElement('tr'); tr.innerHTML = `
    <td>${t.turnNo}</td><td>${t.player}</td><td>${t.duration}s</td>
    <td>${icon(t.completedCreature)}</td><td>${t.effectActivated}</td><td>${t.effectDirection}</td>
    <td>${icon(t.miracleUsed)}</td><td>${icon(t.prodigyUsed)}</td><td>${shortDis(t.naturalDisaster)}</td>
    <td>${t.notes}</td>`;
  $('#turnTable tbody').append(tr);
}
const icon = v => v ? '✓' : '';
const shortDis = d => d.replace(/^(\w).+ – (\w).+/,'$1-$2'); /* G-E, L-W ... */
