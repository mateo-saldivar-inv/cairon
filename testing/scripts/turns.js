import { $, toast, shortDis } from './utils.js';
import { S, persist, setTurnTick, turnTick } from './state.js';

export function toggleTurnTimer() {
  if (turnTick) stopTurn();
  else startTurn();
}

function startTurn() {
  S._turnStart = Date.now();
  $('btnTurnToggle').textContent = 'Detener';
  $('btnSaveTurn').disabled = true;
  tickTurn();
  setTurnTick(setInterval(tickTurn, 1000));
}

function tickTurn() {
  const sec = Math.floor((Date.now() - S._turnStart) / 1000);
  $('turnClock').textContent = `${sec} s`;
}

function stopTurn() {
  clearInterval(turnTick);
  setTurnTick(null);
  $('btnTurnToggle').textContent = 'Iniciar';
  $('btnSaveTurn').disabled = false;
}

export function updateTurnNo() {
  $('turnNo').value = S.turns.length + 1;
}

export function saveTurn() {
  const creatures = Array.from(document.querySelectorAll('.creature-entry, .creature-row')).map(entry => {
    const index = entry.dataset.index;
    return {
      name: entry.querySelector(`[name="creatureName-${index}"]`).value.trim(),
      effect: entry.querySelector(`[name="creatureEffect-${index}"]`).value,
      direction: entry.querySelector(`[name="creatureDirection-${index}"]`).value,
      targetPlayer: entry.querySelector(`[name="creatureTarget-${index}"]`).value
    };
  });

  const specials = Array.from(document.querySelectorAll('.special-row')).map(r => {
    const i = r.dataset.index;
    const type = r.querySelector(`[name="specType-${i}"]`).value;

    if (type === 'proteccion') {
      return {
        type,
        kind: r.querySelector(`[name="specKind-${i}"]`).value,
        player: r.querySelector(`[name="specTarget-${i}"]`).value
      };
    }

    return {
      type,
      scope: r.querySelector(`[name="specScope-${i}"]`).value,
      element: r.querySelector(`[name="specElement-${i}"]`).value,
      target: r.querySelector(`[name="specTarget-${i}"]`).value
    };
  });

  const t = {
    turnNo: S.turns.length + 1,
    player: $('playerSelect').value,
    duration: Math.floor((Date.now() - S._turnStart) / 1000),
    creatures,
    specials,
    notes: $('turnNotes').value.trim()
  };

  S.turns.push(t);
  persist();
  insertRow(t);
  toast(`Turno ${t.turnNo} guardado`);

  stopTurn();
  $('turnClock').textContent = '0 s';
  $('turnNotes').value = '';
  ['effectActivated', 'effectDirection', 'naturalDisaster'].forEach(id => $(id).selectedIndex = 0);
  $('btnSaveTurn').disabled = true;

  $('creatureList').innerHTML = '';
  const sel = $('playerSelect');
  sel.selectedIndex = (sel.selectedIndex + 1) % sel.options.length;
  updateTurnNo();
}

export function createCreatureBlock(index) {
  const wrapper = document.createElement('div');
  wrapper.className = 'creature-row';
  wrapper.dataset.index = index;

  const playerOptions = Array.from({ length: S.numPlayers }, (_, i) => {
    const p = `P${i + 1}`;
    return `<option value="${p}">${p}</option>`;
  }).join('');

  wrapper.innerHTML = `
    <input type="text" name="creatureName-${index}" placeholder="Nombre (opcional)">
    <select name="creatureEffect-${index}">
      <option>Combate</option>
      <option>Intercambio</option>
      <option>Robo</option>
      <option>Ninguno</option>
    </select>
    <select name="creatureDirection-${index}">
      <option>Izquierda</option>
      <option>Derecha</option>
      <option>Libre</option>
      <option>Cancelar</option>
    </select>
    <select name="creatureTarget-${index}">${playerOptions}</select>
    <button type="button" class="btnRemoveCreature" title="Eliminar">–</button>
  `;

  const directionSel = wrapper.querySelector(`[name="creatureDirection-${index}"]`);
  const targetSel    = wrapper.querySelector(`[name="creatureTarget-${index}"]`);

  function updateTargetVisibility() {
    const isCancel = directionSel.value === 'Cancelar';
    targetSel.disabled = isCancel;
    targetSel.style.visibility = isCancel ? 'hidden' : 'visible';
  }

  directionSel.addEventListener('change', updateTargetVisibility);
  updateTargetVisibility();

  wrapper.querySelector('.btnRemoveCreature').onclick = () => wrapper.remove();
  return wrapper;
}


function ensureHistoryHeader() {
  const thead = $('turnTable').querySelector('thead');
  if (thead.children.length) return;
  thead.innerHTML = `
    <tr>
      <th>#</th>
      <th>J</th>
      <th>Dur</th>
      <th>Criaturas</th>
      <th>Desastres</th>
      <th>Protecciones</th>
      <th>Notas</th>
    </tr>`;
}

export function insertRow(t) {
  ensureHistoryHeader();
  const tbody = $('turnTable').querySelector('tbody');
  const tr = document.createElement('tr');

  const creaturesTxt = formatCreaturesShort(t.creatures);
  const disastersTxt = formatDisastersShort(t.specials);
  const protecTxt = formatProtectionsShort(t.specials);

  tr.innerHTML = `
    <td>${t.turnNo}</td>
    <td>${t.player}</td>
    <td>${t.duration}s</td>
    <td title="${escapeAttr(formatCreaturesFull(t.creatures))}">${creaturesTxt}</td>
    <td title="${escapeAttr(formatDisastersFull(t.specials))}">${disastersTxt}</td>
    <td title="${escapeAttr(formatProtectionsFull(t.specials))}">${protecTxt}</td>
    <td title="${escapeAttr(t.notes)}">${truncate(t.notes, 40)}</td>
  `;

  tbody.appendChild(tr);
}

export function createSpecialRow(index) {
  const wrap = document.createElement('div');
  wrap.className = 'special-row';
  wrap.dataset.index = index;

  const players = Array.from({ length: S.numPlayers }, (_, i) =>
    `<option value="P${i + 1}">P${i + 1}</option>`).join('');

  wrap.innerHTML = `
    <select name="specType-${index}" class="spec-type">
      <option value="desastre">Desastre</option>
      <option value="proteccion">Protección</option>
    </select>
    <select name="specScope-${index}" class="spec-scope">
      <option value="global">Global</option>
      <option value="local">Local</option>
    </select>
    <select name="specElement-${index}" class="spec-element">
      <option value="tierra">Tierra</option>
      <option value="agua">Agua</option>
      <option value="aire">Aire</option>
    </select>
    <select name="specKind-${index}" class="spec-kind hidden">
      <option value="milagro">Milagro</option>
      <option value="prodigio">Prodigio</option>
    </select>
    <select name="specTarget-${index}" class="spec-target">
      <option value="all">Todos</option>
      ${players}
    </select>
    <button type="button" class="btnRemoveSpecial">–</button>
  `;

  const typeSel = wrap.querySelector('.spec-type');
  const scopeSel = wrap.querySelector('.spec-scope');
  const elemSel = wrap.querySelector('.spec-element');
  const kindSel = wrap.querySelector('.spec-kind');
  const targetSel = wrap.querySelector('.spec-target');

  function syncUI() {
    const isProt = typeSel.value === 'proteccion';
    wrap.classList.toggle('row-proteccion', isProt);
    wrap.classList.toggle('row-desastre', !isProt);

    if (isProt) {
      kindSel.classList.remove('hidden');
      scopeSel.classList.add('hidden');
      elemSel.classList.add('hidden');
      targetSel.querySelector('[value="all"]').disabled = true;
      if (targetSel.value === 'all') targetSel.value = 'P1';
      targetSel.disabled = false;
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
        if (targetSel.value === 'all') targetSel.value = 'P1';
      }
    }
  }

  function scopeChanged() {
    if (scopeSel.value === 'global') {
      targetSel.value = 'all';
      targetSel.disabled = true;
    } else {
      targetSel.disabled = false;
      if (targetSel.value === 'all') targetSel.value = 'P1';
    }
  }

  typeSel.addEventListener('change', syncUI);
  scopeSel.addEventListener('change', scopeChanged);
  syncUI();

  wrap.querySelector('.btnRemoveSpecial').onclick = () => wrap.remove();
  return wrap;
}

function truncate(str, n) {
  return (str && str.length > n) ? str.slice(0, n - 1) + '…' : (str || '');
}

function escapeAttr(str = '') {
  return str.replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
}

function formatCreaturesShort(list = []) {
  if (!list.length) return '';
  if (list.length === 1) {
    const c = list[0];
    return `${c.effect}→${dirShort(c.direction)} (${c.targetPlayer})`;
  }
  return `${list.length}x`;
}

function formatCreaturesFull(list = []) {
  return list.map(c =>
    `${c.name ? c.name + ' – ' : ''}${c.effect} → ${c.direction} (${c.targetPlayer})`
  ).join('\n');
}

function dirShort(d) {
  return d === 'Izquierda' ? 'Izq' :
         d === 'Derecha' ? 'Der' :
         d === 'Cancelar' ? 'X' : 'Lib';
}

function disastersFrom(specials = []) {
  return specials.filter(s => s.type === 'desastre');
}

function protectionsFrom(specials = []) {
  return specials.filter(s => s.type === 'proteccion');
}

function formatDisastersShort(sps = []) {
  const ds = disastersFrom(sps);
  if (!ds.length) return '';
  if (ds.length === 1) return disShort(ds[0]);
  return `${ds.length}x`;
}

function formatDisastersFull(sps = []) {
  return disastersFrom(sps).map(disFull).join('\n');
}

function disShort(d) {
  const scope = d.scope === 'global' ? 'G' : 'L';
  const elem = d.element.charAt(0).toUpperCase();
  return `${scope}-${elem}${d.target && d.target !== 'all' ? ` (${d.target})` : ''}`;
}

function disFull(d) {
  const scope = d.scope === 'global' ? 'Global' : 'Local';
  const tgt = d.target === 'all' ? 'Todos' : d.target;
  return `${scope} – ${capitalize(d.element)} (${tgt})`;
}

function formatProtectionsShort(sps = []) {
  const ps = protectionsFrom(sps);
  if (!ps.length) return '';
  if (ps.length === 1) return protShort(ps[0]);
  return `${ps.length}x`;
}

function formatProtectionsFull(sps = []) {
  return protectionsFrom(sps).map(protFull).join('\n');
}

function protShort(p) {
  return `${capitalize(p.kind)} (${p.player})`;
}

function protFull(p) {
  return `${capitalize(p.kind)} lanzado por ${p.player}`;
}

function capitalize(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
