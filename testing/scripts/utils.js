export const $ = id => document.getElementById(id);
export const pad2 = n => String(n).padStart(2, '0');

export function toast(msg) {
  const container = $('toast');
  const div = document.createElement('div');
  div.className = 'toastMsg';
  div.textContent = msg;
  container.appendChild(div);
  setTimeout(() => container.removeChild(div), 3000);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function shortDis(d) {
  if (!d || d === 'Ninguno') return '';
  const parts = d.split(' – ');
  if (parts.length < 2) return d;

  const [grp, type] = parts;
  const g = grp.startsWith('Global') ? 'G' : 'L';
  const t = type.charAt(0);
  return `${g}-${t}`;
}
