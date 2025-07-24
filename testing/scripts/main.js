import { $, today } from './utils.js';
import { S, persist } from './state.js';
import { toggleSession, uiAfterSessionStart } from './session.js';
import { toggleTurnTimer, saveTurn, insertRow, createCreatureBlock, createSpecialRow } from './turns.js';
import { setupKeyboardShortcuts } from './events.js';
import { exportData } from './session.js';

const pad = (n, d) => String(n || 0).padStart(d, '0');

function updateSessionId() {
  const t = $('testNumber').value;
  const g = $('gameNumber').value;
  const dateISO = ($('sessionDate').value || today()); 
  const mm   = dateISO.slice(5, 7);
  const dd   = dateISO.slice(8,10);
  const yy   = dateISO.slice(2,4);                    
  $('sessionId').value = `T${pad(t,4)}-P${pad(g,3)}-${mm}${dd}${yy}`;
}


document.addEventListener('DOMContentLoaded', () => {
  if (S) {
    uiAfterSessionStart();
    S.turns.forEach(insertRow);
  }

  $('sessionDate').value = today();

  $('testNumber').addEventListener('input', updateSessionId);
  $('gameNumber').addEventListener('input', updateSessionId);
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
  
  $('btnSaveSession').onclick = persist;
  $('btnExport').onclick = exportData;

  setupKeyboardShortcuts();
});
