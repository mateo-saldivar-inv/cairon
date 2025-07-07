// ─────────────────────────────────────────────────────────────────
// testing.js — CAIRON play-test dashboard logic
// ─────────────────────────────────────────────────────────────────

// — Utilities —————————————

const $     = id => document.getElementById(id);
const pad2  = n  => String(n).padStart(2, '0');

// Simple toast
function toast(msg) {
  const container = $('toast');
  const div = document.createElement('div');
  div.className = 'toastMsg';
  div.textContent = msg;
  container.appendChild(div);
  setTimeout(() => container.removeChild(div), 3000);
}

// Persist to LocalStorage
function persist() {
  localStorage.setItem('cairon.session', JSON.stringify(S));
}

// Today’s date (YYYY-MM-DD)
function today() {
  return new Date().toISOString().slice(0, 10);
}

// Shorten disaster: “Global – Earth” → “G-E”
function shortDis(d) {
  const [grp, type] = d.split(' – ');
  const g = grp.startsWith('Global') ? 'G' : 'L';
  const t = type.charAt(0);
  return `${g}-${t}`;
}


// — State ——————————————————

let S = JSON.parse(localStorage.getItem('cairon.session') || 'null');
let globalTick = null, turnTick = null;


// — Session Flow ——————————————————

function startSession() {
  const id  = $('sessionId').value.trim();
  const num = parseInt($('numPlayers').value, 10);

  if (!/^T\d{2}-G\d{2}$/.test(id) || !num) {
    toast('Completa los datos de sesión');
    return;
  }

  S = {
    id,
    numPlayers: num,
    date: today(),
    start: Date.now(),
    turns: []
  };

  persist();
  uiAfterSessionStart();
}

function stopSession() {
  clearInterval(globalTick);
  $('btnSessionToggle').textContent = 'Start Session';
  // (Optionally record stop time here)
}

function toggleSession() {
  if (!S) startSession();
  else        stopSession();
}

function uiAfterSessionStart() {
  // Stepper cards
  $('stepSession').classList.remove('active');
  $('stepTurn').classList.add('active');

  // Fill players dropdown
  const opts = Array.from({ length: S.numPlayers }, (_, i) => `P${pad2(i+1)}`);
  $('playerSelect').innerHTML = opts.map(p => `<option>${p}</option>`).join('');

  // Set date & button text
  $('sessionDate').value = S.date;
  $('btnSessionToggle').textContent = 'Stop Session';

  // Reveal history + End-Session FAB
  $('historyCard').classList.remove('hidden');
  $('btnEndSession').classList.remove('hidden');

  // Start the sticky global timer
  startGlobalTimer();
}

function startGlobalTimer() {
  tickGlobal();
  globalTick = setInterval(tickGlobal, 1000);
}

function tickGlobal() {
  const elapsed = Math.floor((Date.now() - S.start) / 1000);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  $('globalClock').textContent = `${pad2(m)}:${pad2(s)}`;
}


// — Turn Flow ——————————————————

function toggleTurnTimer() {
  if (turnTick) stopTurn();
  else          startTurn();
}

function startTurn() {
  S._turnStart = Date.now();
  $('btnTurnToggle').textContent = 'Stop';
  $('btnSaveTurn').disabled = true;
  tickTurn();
  turnTick = setInterval(tickTurn, 1000);
}

function tickTurn() {
  const sec = Math.floor((Date.now() - S._turnStart) / 1000);
  $('turnClock').textContent = `${sec} s`;
}

function stopTurn() {
  clearInterval(turnTick);
  turnTick = null;
  $('btnTurnToggle').textContent = 'Start';
  $('btnSaveTurn').disabled = false;
}

function saveTurn() {
  const t = {
    turnNo: S.turns.length + 1,
    player: $('playerSelect').value,
    duration: Math.floor((Date.now() - S._turnStart) / 1000),
    completedCreature: $('completedCreature').checked,
    effectActivated: $('effectActivated').value,
    effectDirection: $('effectDirection').value,
    miracleUsed: $('miracleUsed').checked,
    prodigyUsed: $('prodigyUsed').checked,
    naturalDisaster: $('naturalDisaster').value,
    notes: $('turnNotes').value.trim()
  };

  S.turns.push(t);
  persist();
  insertRow(t);
  toast(`Turno ${t.turnNo} guardado`);

  // Reset turn form
  stopTurn();
  $('turnClock').textContent = '0 s';
  $('turnNotes').value = '';
  ['completedCreature','miracleUsed','prodigyUsed']
    .forEach(id => $(id).checked = false);
  ['effectActivated','effectDirection','naturalDisaster']
    .forEach(id => $(id).selectedIndex = 0);
  $('btnSaveTurn').disabled = true;

  // Auto-advance player
  const sel = $('playerSelect');
  sel.selectedIndex = (sel.selectedIndex + 1) % sel.options.length;
}

function insertRow(t) {
  const thead = $('#turnTable thead');
  if (!thead.children.length) {
    thead.innerHTML = `
      <tr>
        <th>T</th><th>P</th><th>Dur</th><th>Creature</th>
        <th>Eff</th><th>Dir</th><th>Mir</th><th>Pro</th>
        <th>Dis</th><th>Notes</th>
      </tr>`;
  }

  const tbody = $('#turnTable tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${t.turnNo}</td>
    <td>${t.player}</td>
    <td>${t.duration}s</td>
    <td>${t.completedCreature ? '✓' : ''}</td>
    <td>${t.effectActivated}</td>
    <td>${t.effectDirection}</td>
    <td>${t.miracleUsed   ? '✓' : ''}</td>
    <td>${t.prodigyUsed   ? '✓' : ''}</td>
    <td class="disaster">${shortDis(t.naturalDisaster)}</td>
    <td>${t.notes}</td>`;
  tbody.appendChild(tr);
}


// — End Session & Export (stubbed) —————————

function endSession() {
  alert('End Session clicked — implement winner/points dialog here.');
}

function exportCsv() {
  // … your CSV logic or FileSaver call …
}

function sendToSheets() {
  alert('Send to Sheets not yet wired.');
}


// — Keyboard Shortcuts —————————————

document.addEventListener('keydown', e => {
  // Ctrl/Cmd + S → toggle session
  if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='s') {
    e.preventDefault();
    $('btnSessionToggle').click();
  }
  // Space → toggle turn timer (unless typing)
  else if (e.key===' ' && !e.target.matches('input,textarea')) {
    e.preventDefault();
    $('btnTurnToggle').click();
  }
  // Enter → save turn
  else if (e.key==='Enter' && !$('btnSaveTurn').disabled) {
    $('btnSaveTurn').click();
  }
});


// — Initialization ——————————————————

document.addEventListener('DOMContentLoaded', () => {
  // Restore ongoing session
  if (S) {
    uiAfterSessionStart();
    S.turns.forEach(insertRow);
  }

  // Set session date field
  $('sessionDate').value = today();

  // Hook buttons
  $('btnSessionToggle').onclick = toggleSession;
  $('btnTurnToggle').onclick    = toggleTurnTimer;
  $('btnSaveTurn').onclick      = saveTurn;
  $('btnEndSession').onclick    = endSession;
});
