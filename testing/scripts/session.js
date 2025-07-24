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

  if (!/^T\d{4}-P\d{3}-\d{6}$/.test(id)) {
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
    turns: []
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
  else    stopSession();
}

export function uiAfterSessionStart() {
  $('stepSession').classList.remove('active');
  $('stepTurn').classList.add('active');

  const opts = Array.from({ length: S.numPlayers }, (_, i) => `P${pad2(i + 1)}`);
  $('playerSelect').innerHTML = opts.map(p => `<option>${p}</option>`).join('');

  $('sessionDate').value = S.date;
  $('btnSessionToggle').textContent = 'Concluir Sesión';
  $('historyCard').classList.remove('hidden');
  $('endGameCard').classList.remove('hidden');

  renderScoreInputs(S.numPlayers);

  startGlobalTimer();
}

function populateDivineInterventionOptions() {
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



function startGlobalTimer() {
  tickGlobal();
  setGlobalTick(setInterval(tickGlobal, 1000));
}

export function exportData() {
  if (!S) return toast('No hay sesión activa.');
  localExport(S);
  toast('Datos exportados localmente');
  stopSession();
}

//Replace with server export
function localExport(data) {
  const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
  const filename = `cairon-${data.id}-${timestamp}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  saveAs(blob, filename); 
}
