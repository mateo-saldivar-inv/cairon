let S = JSON.parse(localStorage.getItem('cairon.session') || 'null');
let globalTick = null;
let turnTick = null;

function persist() {
  if (S) {
    localStorage.setItem('cairon.session', JSON.stringify(S));
  }
}


export { S, globalTick, turnTick, persist };
export function setS(newS) { S = newS; }
export function setGlobalTick(tick) { globalTick = tick; }
export function setTurnTick(tick) { turnTick = tick; }
