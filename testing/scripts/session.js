import { $, pad2, toast } from './utils.js';
import { S, persist, setS, globalTick, setGlobalTick, turnTick, setTurnTick } from './state.js';
import { snapshotTurnDraft, restoreTurnDraft, updateTurnNo } from './turns.js';

             

export function startSession() {
  const test = parseInt($('testNumber').value, 10);
  const game = parseInt($('gameNumber').value, 10);
  const id = $('sessionId').value.trim();
  const num = parseInt($('numPlayers').value, 10);
  const date = $('sessionDate').value.trim();

  let errors = [];

  if (isNaN(test) || test < 1) {
    errors.push('Número de Test debe ser mayor que 0');
  }

  if (isNaN(game) || game < 1) {
    errors.push('Número de Partida debe ser mayor que 0');
  }

  if (!/^T\d{3}-P\d{3}-\d-\d{6}$/.test(id)) {
    errors.push('ID de Sesión inválido');
  }

  if (isNaN(num)) {
    errors.push('Número de Jugadores no seleccionado');
  }

  if (!date) {
    errors.push('Fecha de sesión no especificada');
  }

  if (errors.length > 0) {
    toast('Corrige los siguientes campos:\n• ' + errors.join('\n• '));
    return;
  }

  setS({
    id,
    numPlayers: num,
    date,
    start: Date.now(),
    turns: [],
    paused: false,
    pauseTime: null  
  });

  persist();
  uiAfterSessionStart();
  populateDivineInterventionOptions();
}

export function stopSession() {
  clearInterval(globalTick);
  setGlobalTick(null);
  setS(null);
  localStorage.removeItem('cairon.session');

  $('stepSession').classList.add('active');
  $('stepTurn').classList.remove('active');
  $('btnSessionToggle').textContent = 'Iniciar Sesión';
  $('globalClock').textContent = '00:00';
  $('historyCard').classList.add('hidden');

  toast('Sesión finalizada');
}

export function toggleSession() {
  if (!S) startSession();
  else if (!S.paused) pauseSession();
  else resumeSession();
}

export function pauseSession() {
  if (!S) return;

  S.paused = true;
  S.pauseTime = Date.now();

  const wasRunning = !!turnTick;
  if (turnTick) {
    clearInterval(turnTick);
    setTurnTick(null);
  }

  snapshotTurnDraft(wasRunning);
  persist();

  if (globalTick) {
    clearInterval(globalTick);
    setGlobalTick(null);
  }

  $('stepTurn').classList.add('hidden');
  $('endGameCard').classList.add('hidden');
  $('btnSessionToggle').textContent = 'Reanudar Sesión';

  showPausedTime();
  toast('Sesión pausada');
}


export function resumeSession() {
  if (!S?.paused || !S.pauseTime) return;

  const pausedDuration = Date.now() - S.pauseTime;
  S.start += pausedDuration;

  S.paused = false;
  S.pauseTime = null;
  persist();

  uiAfterSessionStart();

  $('btnSessionToggle').textContent = 'Pausar Sesión';
  $('stepTurn').classList.remove('hidden');

  const hasTurns = Array.isArray(S.turns) && S.turns.length > 0;

  if (hasTurns) $('historyCard').classList.remove('hidden');

  if (hasTurns) {
    $('endGameCard').classList.remove('hidden');
  } else {
    $('endGameCard').classList.add('hidden');
  }

  if (S.finalData) {
    import('./session.js').then(({ populateFinalData }) => {
      populateFinalData(S.finalData);
    });
    document.querySelector('[data-step="4"]')?.classList.remove('hidden');
  } else {
    document.querySelector('[data-step="4"]')?.classList.add('hidden');
  }

  restoreTurnDraft();

  toast('Sesión reanudada');
}




export function uiAfterSessionStart() {
  $('stepSession').classList.remove('active');
  $('stepTurn').classList.add('active');

  const opts = Array.from({ length: S.numPlayers }, (_, i) => `P${pad2(i + 1)}`);
  $('playerSelect').innerHTML = opts.map(p => `<option>${p}</option>`).join('');

  $('sessionDate').value = S.date;
  $('btnSessionToggle').textContent = 'Pausar Sesión';
  $('stepTurn').classList.remove('hidden');

  renderScoreInputs(S.numPlayers);
  updateTurnNo();

  startGlobalTimer();
}

export function populateDivineInterventionOptions() {
  const select = $('usedDivineIntervention');
  if (!select) return;

  [...select.options].forEach(opt => {
    if (opt.value.startsWith('P')) select.removeChild(opt);
  });

  for (let i = 1; i <= S.numPlayers; i++) {
    const value = `P${String(i).padStart(2, '0')}`;
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }
}

function tickGlobal() {
  const elapsed = Math.floor((Date.now() - S.start) / 1000);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  $('globalClock').textContent = `${pad2(m)}:${pad2(s)}`;
}

export function showPausedTime() {
  const elapsed = Math.floor((S.pauseTime - S.start) / 1000);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  $('globalClock').textContent = `⏸️ ${pad2(m)}:${pad2(s)}`;
}

function renderScoreInputs(n) {
  const scores = $('finalScores');

  const playerOptions = Array.from({ length: n }, (_, i) => {
    const p = `P${pad2(i + 1)}`;
    return `<option value="${p}">${p}</option>`;
  }).join('');

  scores.innerHTML = '';

  $('dragonPlayer').innerHTML = `<option value="" disabled selected>—</option>` + playerOptions;

  const rows = [];
  for (let i = 1; i <= n; i++) {
    const p = `P${pad2(i)}`;
    rows.push(`
      <div class="player-final-row" data-player="${p}"
           style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.75rem;align-items:end;">
        <label>${p} – Puntos
          <input type="number" min="0" name="finalScore-${p}" />
        </label>
        <label> Creaturas Completas
          <input type="number" min="0" name="finalComplete-${p}" />
        </label>
        <label>Creaturas Incompletas
          <input type="number" min="0" name="finalIncomplete-${p}" />
        </label>
      </div>
    `);
  }
  scores.innerHTML = rows.join('');
}


function collectFinalData() {
  const get = id => $(id)?.value;
  const toIntSel = sel => {
    const v = document.querySelector(sel)?.value;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : 0;
  };

  const obj = {
    endReason: get('endReason'),
    dragonPlayer: get('dragonPlayer'),
    dragonValue: parseInt(get('dragonValue'), 10) || 0,
    totalCreatures: parseInt(get('totalCreatures'), 10) || 0,
    totalCards: parseInt(get('totalCards'), 10) || 0,
    replayInterest: get('replayInterest'),
    explanationMethod: get('explanationMethod'),
    usedCreatureNames: get('usedCreatureNames'),
    playerEngagement: get('playerEngagement'),
    usedDivineIntervention: get('usedDivineIntervention'),
    finalNotes: (get('finalNotes') || '').trim(),
    scores: []
  };

  for (let i = 1; i <= S.numPlayers; i++) {
    const p = `P${pad2(i)}`;
    obj.scores.push({
      player: p,
      score: toIntSel(`[name="finalScore-${p}"]`),
      complete: toIntSel(`[name="finalComplete-${p}"]`),
      incomplete: toIntSel(`[name="finalIncomplete-${p}"]`)
    });
  }

  return obj;
}


export function populateFinalData(data) {
  const set = (id, val) => { const el = $(id); if (el != null) el.value = val ?? el.value; };

  set('endReason', data.endReason);
  set('dragonPlayer', data.dragonPlayer);
  set('dragonValue', data.dragonValue);
  set('totalCreatures', data.totalCreatures);
  set('totalCards', data.totalCards);
  set('replayInterest', data.replayInterest);
  set('explanationMethod', data.explanationMethod);
  set('usedCreatureNames', data.usedCreatureNames);
  set('playerEngagement', data.playerEngagement);
  set('usedDivineIntervention', data.usedDivineIntervention);
  set('finalNotes', data.finalNotes);

  // Fill per-player fields if present (backwards compatible)
  data.scores?.forEach(s => {
    const p = s.player;
    const setSel = (sel, val) => { const el = document.querySelector(sel); if (el) el.value = val ?? el.value; };
    setSel(`[name="finalScore-${p}"]`, s.score);
    setSel(`[name="finalComplete-${p}"]`, s.complete);
    setSel(`[name="finalIncomplete-${p}"]`, s.incomplete);
  });

  if (data.endReason === 'dragon') {
    $('dragonExtras').classList.remove('hidden');
  }
}


function startGlobalTimer() {
  tickGlobal();
  setGlobalTick(setInterval(tickGlobal, 1000));
}

export function saveEndGameData() {
  const data = collectFinalData();
  S.finalData = data;
  persist();

  $('endGameCard').dataset.saved = 'true';
  document.querySelector('[data-step="4"]').classList.remove('hidden'); // Export section
  toast('Datos de fin de partida guardados');
}

export function deleteSessionNow(silent = false) {
  clearInterval(globalTick);
  setGlobalTick(null);
  setS(null);
  localStorage.removeItem('cairon.session');
  if (!silent) toast('Sesión eliminada');
  location.href = '/testing';
}


export async function exportData() {
  if (!S) return toast('No hay sesión activa.');
  const id = S.id;
  const btn = $('btnExport');
  if (btn) btn.disabled = true;

  try {
    await sendGameSession(S);
    toast('Datos enviados');
    stopSession();
    window.location.assign(`thanks.html?id=${encodeURIComponent(id)}`);
  } catch (err) {
    console.error(err);
    toast('Error al enviar. Guardando localmente…');
    localExport(S);
    stopSession();
    window.location.assign(`thanks.html?id=${encodeURIComponent(id)}`);
  } finally {
    if (btn) btn.disabled = false;
  }
}


//Replace with server export
function localExport(data) {
  const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
  const filename = `cairon-${data.id}-${timestamp}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  saveAs(blob, filename); 
}


async function sendGameSession(sessionJson) {
  const endpoint = "https://script.google.com/macros/s/AKfycbzGDzNRlA7PGk-QZvxIJwFRNr6qD6saceZ2OxX2egbxPyzzpA2Qvcac04xPUG_lSDmY/exec";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(sessionJson)
  });
  return res.json();
}