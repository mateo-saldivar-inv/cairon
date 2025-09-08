import { $ } from './utils.js';

export function setupKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      $('btnSessionToggle').click();
    }
    else if (e.key === ' ' && !e.target.matches('input,textarea')) {
      e.preventDefault();
      $('btnTurnToggle').click();
    }
  });
}
