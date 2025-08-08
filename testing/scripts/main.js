import { $, today } from './utils.js';
import { S, persist } from './state.js';
import { toggleSession, uiAfterSessionStart } from './session.js';
import { updateTurnNo, toggleTurnTimer, saveTurn, insertRow, createCreatureBlock, createSpecialRow, restoreTurnDraft } from './turns.js';
import { setupKeyboardShortcuts } from './events.js';
import { exportData, saveEndGameData, showPausedTime, populateDivineInterventionOptions } from './session.js';

const pad = (n, d) => String(n || 0).padStart(d, '0');

function updateSessionId() {
  const t = $('testNumber').value;
  const g = $('gameNumber').value;
  const p = $('numPlayers').value;
  const dateISO = ($('sessionDate').value || today());
  const mm = dateISO.slice(5, 7);
  const dd = dateISO.slice(8, 10);
  const yy = dateISO.slice(2, 4);

  if (!t || !g || !p) return;

  $('sessionId').value = `T${pad(t, 3)}-P${pad(g, 3)}-${p}-${mm}${dd}${yy}`;
}

document.addEventListener('DOMContentLoaded', () => {
  if (S) {
    if (S.paused) {
      restorePausedSession();
    } else {
      restoreActiveSession();
    }
  }

  $('sessionDate').value = today();

  $('testNumber').addEventListener('input', updateSessionId);
  $('gameNumber').addEventListener('input', updateSessionId);
  $('numPlayers').addEventListener('change', updateSessionId);
  updateSessionId(); 

  $('btnSessionToggle').onclick = toggleSession;
  $('btnTurnToggle').onclick    = toggleTurnTimer;
  $('btnSaveTurn').onclick      = saveTurn;

  $('btnAddCreature').addEventListener('click', () => {
    const list = $('creatureList');
    const index = list.children.length;
    list.appendChild(createCreatureBlock(index));
  });
  
  $('btnAddSpecial').onclick = () => {
    const list  = $('specialList');
    const index = list.children.length;
    list.appendChild(createSpecialRow(index));
  };

  $('endReason').addEventListener('change', () => {
    const isDragon = $('endReason').value === 'dragon';
    $('dragonExtras').classList.toggle('hidden', !isDragon);
  });
  
  $('btnSaveSession').onclick = saveEndGameData;
  $('btnExport').onclick = exportData;

  $('btnOpenBoardForm').onclick = () => {
    if (!S?.id) {
      toast('ID de sesión no disponible');
      return;
    }
  
    const url = `https://docs.google.com/forms/d/e/1FAIpQLSfj0a9mb1Tf5CWccLUBd0bj_-RgxgxKto9hpG4Z3FACEgiAPA/viewform?usp=pp_url&entry.2103469228=${encodeURIComponent(S.id)}`;
    window.open(url, '_blank');
  };

  setupKeyboardShortcuts();
});


function restoreSessionFormFields() {
  $('sessionDate').value = S.date;
  $('testNumber').value = parseInt(S.id.slice(1, 4), 10);
  $('gameNumber').value = parseInt(S.id.slice(6, 9), 10);
  $('numPlayers').value = String(S.numPlayers);
  updateSessionId();
}

function restorePausedSession() {
  restoreSessionFormFields();
  $('btnSessionToggle').textContent = 'Reanudar Sesión';
  $('stepTurn').classList.add('hidden');
  $('historyCard').classList.add('hidden');
  $('endGameCard').classList.add('hidden');
  updateTurnNo();

  showPausedTime();
}

function restoreActiveSession() {
  restoreSessionFormFields();
  uiAfterSessionStart();
  populateDivineInterventionOptions();

  if (S.turns?.length > 0) {
    S.turns.forEach(insertRow);
    $('historyCard').classList.remove('hidden');
    $('endGameCard').classList.remove('hidden');
  }

  if (S.finalData) {
    import('./session.js').then(({ populateFinalData }) => {
      populateFinalData(S.finalData);
    });
    $('endGameCard').classList.remove('hidden');
    document.querySelector('[data-step="4"]')?.classList.remove('hidden');
  }

  if (S.draftTurn) {
    restoreTurnDraft();
  } else {
    updateTurnNo();
  }
}