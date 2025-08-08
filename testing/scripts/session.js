import { $, pad2, toast } from './utils.js';
import { S, persist, setS, globalTick, setGlobalTick } from './state.js';

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
  S.paused = true;
  S.pauseTime = Date.now();
  persist();

  clearInterval(globalTick);
  setGlobalTick(null);

  $('stepTurn').classList.add('hidden');
  $('historyCard').classList.add('hidden');
  $('endGameCard').classList.add('hidden');
  $('btnSessionToggle').textContent = 'Reanudar Sesión';

  showPausedTime();

  const turnClock = $('turnClock');
  if (turnClock.dataset.running === 'true') {
    turnClock.dataset.pausedAt = Date.now();
  }

  toast('Sesión pausada');
}

export function resumeSession() {
  if (!S.paused || !S.pauseTime) return;

  const pausedDuration = Date.now() - S.pauseTime;
  S.start += pausedDuration; 
  if (S._turnStart) S._turnStart += pausedDuration; 

  S.paused = false;
  S.pauseTime = null;
  persist();

  uiAfterSessionStart();

  startGlobalTimer();
  $('btnSessionToggle').textContent = 'Pausar Sesión';

  $('stepTurn').classList.remove('hidden');
  if (S.turns.length > 0) $('historyCard').classList.remove('hidden');
  if (S.finalData) $('endGameCard').classList.remove('hidden');

  const turnClock = $('turnClock');
  if (turnClock.dataset.pausedAt) {
    const pauseDur = Date.now() - parseInt(turnClock.dataset.pausedAt, 10);
    S._turnStart += pauseDur;
    delete turnClock.dataset.pausedAt;
  }

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

  for (let i = 1; i <= n; i++) {
    const p = `P${pad2(i)}`;
    scores.innerHTML += `
      <label>${p} – Puntos
        <input type="number" min="0" name="finalScore-${p}" />
      </label>
    `;
  }
}

// ✅ COLLECT FINAL DATA
function collectFinalData() {
  const get = id => $(id)?.value;
  const obj = {
    endReason: get('endReason'),
    dragonPlayer: get('dragonPlayer'),
    dragonValue: get('dragonValue'),
    totalCreatures: get('totalCreatures'),
    totalCards: get('totalCards'),
    replayInterest: get('replayInterest'),
    explanationMethod: get('explanationMethod'),
    usedCreatureNames: get('usedCreatureNames'),
    playerEngagement: get('playerEngagement'),
    usedDivineIntervention: get('usedDivineIntervention'),
    finalNotes: get('finalNotes'),
    scores: []
  };

  const scoreInputs = document.querySelectorAll('[name^="finalScore-"]');
  scoreInputs.forEach(input => {
    const name = input.name.replace('finalScore-', '');
    obj.scores.push({ player: name, score: input.value });
  });

  return obj;
}

// ✅ POPULATE FINAL DATA
export function populateFinalData(data) {
  const set = (id, val) => { const el = $(id); if (el) el.value = val; };

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

  data.scores?.forEach(s => {
    const el = document.querySelector(`[name="finalScore-${s.player}"]`);
    if (el) el.value = s.score;
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

export function exportData() {
  if (!S) return toast('No hay sesión activa.');
  localExport(S);
  toast('Datos exportados localmente');

  const sessionId = S.id;
  stopSession(); // includes clearing session + localStorage
  location.href = `thanks.html?id=${encodeURIComponent(sessionId)}`;
}

//Replace with server export
function localExport(data) {
  const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
  const filename = `cairon-${data.id}-${timestamp}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  saveAs(blob, filename); 
}
