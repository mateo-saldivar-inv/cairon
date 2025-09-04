import { $, pad2 } from './utils.js';
import { S } from './state.js';

let RESTORING = false;
export function setRestoring(flag) { RESTORING = !!flag; }

export function currentTurnPlayer() {
  return $('playerSelect')?.value || 'P01';
}

export function neighborFor(playerCode, dir) {
  const n = Math.max(1, Math.min(99, parseInt((playerCode || '').slice(1), 10) || 1));
  const total = Math.min(99, S?.numPlayers || 8);
  let idx = n - 1;

  if (dir === 'Derecha') idx = (idx + 1) % total;
  else if (dir === 'Izquierda') idx = (idx - 1 + total) % total;
  else return playerCode;

  return `P${pad2(idx + 1)}`;
}


export function wireAutoTarget(directionSel, targetSel) {
  if (!targetSel.dataset.autoset) targetSel.dataset.autoset = 'true';

  targetSel.addEventListener('change', () => {
    targetSel.dataset.autoset = 'false';
  });

  directionSel.addEventListener('change', () => {
    const dir = directionSel.value;
    if (targetSel.dataset.autoset === 'false') return;

    if (dir === 'Izquierda' || dir === 'Derecha') {
      const me = currentTurnPlayer();
      const neighbor = neighborFor(me, dir);
      if ([...targetSel.options].some(o => o.value === neighbor)) {
        targetSel.value = neighbor;
      }
    }
  });
}

function normalizePlayerCode(val) {
  if (!val) return null;
  if (val === 'all' || val === 'none') return val;
  const m = /^P0?(\d+)$/.exec(val);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (!Number.isFinite(n)) return null;
  return `P${pad2(n)}`;
}


export function findBestTargetCandidate() {
  const creatureRows = Array.from(document.querySelectorAll('.creature-row,.creature-entry'));
  for (let i = creatureRows.length - 1; i >= 0; i--) {
    const r = creatureRows[i];
    const idx = r.dataset.index;
    const tSel = r.querySelector(`[name="creatureTarget-${idx}"]`);
    const dirSel = r.querySelector(`[name="creatureDirection-${idx}"]`);
    const target = tSel?.value;
    const dir = dirSel?.value;
    if (target && target !== 'none' && dir !== 'Cancelar') {
      const norm = normalizePlayerCode(target);
      if (norm) return norm;
    }
  }

  const specialRows = Array.from(document.querySelectorAll('.special-row'));
  for (let i = specialRows.length - 1; i >= 0; i--) {
    const r = specialRows[i];
    const idx = r.dataset.index;
    const type = r.querySelector(`[name="specType-${idx}"]`)?.value;
    if (type !== 'desastre') continue;
    const scope = r.querySelector(`[name="specScope-${idx}"]`)?.value;
    const target = r.querySelector(`[name="specTarget-${idx}"]`)?.value;
    if (scope === 'local' && target && target !== 'all') {
      const norm = normalizePlayerCode(target);
      if (norm) return norm;
    }
  }

  return null;
}


export function attachProtectionSmartDefaults(wrap, index) {
  const typeSel   = wrap.querySelector('.spec-type');
  const scopeSel  = wrap.querySelector('.spec-scope');
  const elemSel   = wrap.querySelector('.spec-element');
  const kindSel   = wrap.querySelector('.spec-kind');
  const targetSel = wrap.querySelector('.spec-target');

  if (!targetSel.dataset.autoset) targetSel.dataset.autoset = 'true';

  targetSel.addEventListener('change', () => {
    targetSel.dataset.autoset = 'false';
  });

  function maybeAutoTargetForProtection() {
    if (RESTORING) return; 
    if (targetSel.dataset.autoset === 'false') return;
    const candidate = findBestTargetCandidate();
    if (!candidate) return;
    const has = [...targetSel.options].some(o => o.value === candidate);
    if (has) targetSel.value = candidate;
  }

  function syncUI() {
    const isProt = typeSel.value === 'proteccion';
    wrap.classList.toggle('row-proteccion', isProt);
    wrap.classList.toggle('row-desastre', !isProt);

    if (isProt) {
      kindSel.classList.remove('hidden');
      scopeSel.classList.add('hidden');
      elemSel.classList.add('hidden');
      targetSel.querySelector('[value="all"]').disabled = true;
      if (targetSel.value === 'all') targetSel.value = 'P01';
      targetSel.disabled = false;

      maybeAutoTargetForProtection();
    } else {
      kindSel.classList.add('hidden');
      scopeSel.classList.remove('hidden');
      elemSel.classList.remove('hidden');
      targetSel.querySelector('[value="all"]').disabled = false;

      if (scopeSel.value === 'global') {
        targetSel.value = 'all';
        targetSel.disabled = true;
      } else {
        targetSel.disabled = false;
        if (targetSel.value === 'all') targetSel.value = 'P01';
      }
    }
  }

  function scopeChanged() {
    if (scopeSel.value === 'global') {
      targetSel.value = 'all';
      targetSel.disabled = true;
    } else {
      targetSel.disabled = false;
      if (targetSel.value === 'all') targetSel.value = 'P01';
    }
  }

  typeSel.addEventListener('change', syncUI);
  scopeSel.addEventListener('change', scopeChanged);

  syncUI();
}
