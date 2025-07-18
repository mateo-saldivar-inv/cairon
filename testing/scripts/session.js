import { $, pad2, today, toast } from './utils.js';
import { S, persist, setS, globalTick, setGlobalTick } from './state.js';
import { updateTurnNo } from './turns.js'; 

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

  if (!/^T\d{3}-P\d{3}$/.test(id)) {
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
  $('btnEndSession').classList.add('hidden');
  $('turnTable thead').innerHTML = '';
  $('turnTable tbody').innerHTML = '';

  toast('Sesión finalizada');
}

export function toggleSession() {
  if (!S) startSession();
  else    stopSession();
}

export function uiAfterSessionStart() {
  updateTurnNo();
  $('stepSession').classList.remove('active');
  $('stepTurn').classList.add('active');

  const opts = Array.from({ length: S.numPlayers }, (_, i) => `P${pad2(i + 1)}`);
  $('playerSelect').innerHTML = opts.map(p => `<option>${p}</option>`).join('');

  $('sessionDate').value = S.date;
  $('btnSessionToggle').textContent = 'Concluir Sesión';
  $('historyCard').classList.remove('hidden');
  
  startGlobalTimer();
}

function tickGlobal() {
  const elapsed = Math.floor((Date.now() - S.start) / 1000);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  $('globalClock').textContent = `${pad2(m)}:${pad2(s)}`;
}

function startGlobalTimer() {
  tickGlobal();
  setGlobalTick(setInterval(tickGlobal, 1000));
}
