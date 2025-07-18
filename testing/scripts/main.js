import { $, today } from './utils.js';
import { S } from './state.js';
import { toggleSession, uiAfterSessionStart, stopSession } from './session.js';
import { toggleTurnTimer, saveTurn, insertRow, createCreatureBlock, createSpecialRow } from './turns.js';
import { setupKeyboardShortcuts } from './events.js';

// ─── helper: pad to 3 digits ─────────────────────────────
const pad3 = n => String(n).padStart(3, '0');

// ─── build the T000-P000 string ─────────────────────────
function updateSessionId() {
  const t = $('testNumber').value;
  const g = $('gameNumber').value;
  const t3 = t ? pad3(t) : '000';
  const g3 = g ? pad3(g) : '000';
  $('sessionId').value = `T${t3}-P${g3}`;
}

document.addEventListener('DOMContentLoaded', () => {
  // If you reload mid-session
  if (S) {
    uiAfterSessionStart();
    S.turns.forEach(insertRow);
  }

  // 1) set default date
  $('sessionDate').value = today();

  // 2) wire up the test/game inputs & init once
  $('testNumber').addEventListener('input', updateSessionId);
  $('gameNumber').addEventListener('input', updateSessionId);
  updateSessionId();  // ← absolutely necessary!

  // 3) your existing handlers
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
  
  setupKeyboardShortcuts();
});
