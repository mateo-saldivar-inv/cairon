import { $, toast, shortDis } from './utils.js';
import { S, persist, setTurnTick, turnTick } from './state.js';

export function toggleTurnTimer() {
  if (turnTick) stopTurn();
  else          startTurn();
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
    const i    = r.dataset.index;
    const type = r.querySelector(`[name="specType-${i}"]`).value;
  
    if (type === 'proteccion') {
      return {
        type,                                   
        kind:   r.querySelector(`[name="specKind-${i}"]`).value,
        player: r.querySelector(`[name="specTarget-${i}"]`).value
      };
    }
  
    return {
      type,                                   
      scope:   r.querySelector(`[name="specScope-${i}"]`).value,
      element: r.querySelector(`[name="specElement-${i}"]`).value,
      target:  r.querySelector(`[name="specTarget-${i}"]`).value
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
  ['completedCreature','miracleUsed','prodigyUsed']
    .forEach(id => $(id).checked = false);
  ['effectActivated','effectDirection','naturalDisaster']
    .forEach(id => $(id).selectedIndex = 0);
  $('btnSaveTurn').disabled = true;

  const sel = $('playerSelect');
  $('creatureList').innerHTML = '';
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

    <select name="creatureTarget-${index}">
      ${playerOptions}
    </select>

    <button type="button" class="btnRemoveCreature" title="Eliminar">–</button>
  `;

  wrapper.querySelector('.btnRemoveCreature').onclick = () => {
    wrapper.remove();
  };

  return wrapper;
}



export function insertRow(t) {
  const thead = $('turnTable').querySelector('thead');
  if (!thead.children.length) {
    thead.innerHTML = `
      <tr>
        <th>T</th><th>P</th><th>Dur</th><th>Creature</th>
        <th>Eff</th><th>Dir</th><th>Mir</th><th>Pro</th>
        <th>Dis</th><th>Notes</th>
      </tr>`;
  }

  const tbody = $('turnTable').querySelector('tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${t.turnNo}</td>
    <td>${t.player}</td>
    <td>${t.duration}s</td>
    <td>${t.creatures.length} 🐾</td>
    <td>${t.effectActivated}</td>
    <td>${t.effectDirection}</td>
    <td>${t.miracleUsed ? '✓' : ''}</td>
    <td>${t.prodigyUsed ? '✓' : ''}</td>
    <td class="disaster">${shortDis(t.naturalDisaster)}</td>
    <td>${t.notes}</td>`;
  tbody.appendChild(tr);
}


export function createSpecialRow(index) {
  const wrap = document.createElement('div');
  wrap.className = 'special-row';
  wrap.dataset.index = index;

  const players = Array.from({ length: S.numPlayers }, (_, i) =>
    `<option value="P${i + 1}">P${i + 1}</option>`).join('');

  wrap.innerHTML = `
    <!-- tipo -->
    <select name="specType-${index}" class="spec-type">
      <option value="desastre">Desastre</option>
      <option value="proteccion">Protección</option>
    </select>

    <!-- alcance / elemento (solo Desastre) -->
    <select name="specScope-${index}"  class="spec-scope">
      <option value="global">Global</option>
      <option value="local">Local</option>
    </select>

    <select name="specElement-${index}" class="spec-element">
      <option value="tierra">Tierra</option>
      <option value="agua">Agua</option>
      <option value="aire">Aire</option>
    </select>

    <!-- milagro / prodigio (solo Protección) -->
    <select name="specKind-${index}" class="spec-kind hidden">
      <option value="milagro">Milagro</option>
      <option value="prodigio">Prodigio</option>
    </select>

    <!-- jugador objetivo -->
    <select name="specTarget-${index}" class="spec-target">
      <option value="all">Todos</option>
      ${players}
    </select>

    <!-- quitar fila -->
    <button type="button" class="btnRemoveSpecial">–</button>
  `;

  const typeSel   = wrap.querySelector('.spec-type');
  const scopeSel  = wrap.querySelector('.spec-scope');
  const elemSel   = wrap.querySelector('.spec-element');
  const kindSel   = wrap.querySelector('.spec-kind');
  const targetSel = wrap.querySelector('.spec-target');

  function syncUI() {
    const isProt = typeSel.value === 'proteccion';

    wrap.classList.toggle('row-proteccion', isProt);
    wrap.classList.toggle('row-desastre',   !isProt);
    
    if (typeSel.value === 'proteccion') {
      kindSel.classList.remove('hidden');
      scopeSel.classList.add('hidden');
      elemSel.classList.add('hidden');

      targetSel.querySelector('[value="all"]').disabled = true;
      if (targetSel.value === 'all') targetSel.value = 'P1';
      targetSel.disabled = false;
    } else { // desastre
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
