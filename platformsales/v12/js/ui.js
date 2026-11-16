/* ============================================================
   UI: diálogos y avisos con el estilo de la plataforma
   (reemplazan los pop-ups nativos del navegador: alert, confirm, prompt)
   ============================================================ */

const UI_SVG = {
  success: '<svg viewBox="0 0 52 52"><circle class="ui-fill" cx="26" cy="26" r="24"/><circle class="ui-ring" cx="26" cy="26" r="24"/><path class="ui-draw" d="M15 27.5l8 8L38 19"/></svg>',
  warning: '<svg viewBox="0 0 52 52"><circle class="ui-fill" cx="26" cy="26" r="24"/><circle class="ui-ring" cx="26" cy="26" r="24"/><path class="ui-draw" d="M26 14v15"/><circle class="ui-dot" cx="26" cy="36" r="2.2"/></svg>',
  error:   '<svg viewBox="0 0 52 52"><circle class="ui-fill" cx="26" cy="26" r="24"/><circle class="ui-ring" cx="26" cy="26" r="24"/><path class="ui-draw" d="M18 18l16 16M34 18L18 34"/></svg>',
  info:    '<svg viewBox="0 0 52 52"><circle class="ui-fill" cx="26" cy="26" r="24"/><circle class="ui-ring" cx="26" cy="26" r="24"/><path class="ui-draw" d="M26 24v13"/><circle class="ui-dot" cx="26" cy="16" r="2.2"/></svg>'
};
const UI_TITLES = { success: '¡Listo!', warning: 'Revisa esto', error: 'No se pudo', info: 'Aviso' };

/* Ventana general. buttons: [{text, value, primary, danger}]. Devuelve una promesa con el value del botón elegido. */
function uiDialog(o) {
  o = Object.assign({ type: 'info', title: '', msg: '', buttons: [{ text: 'Entendido', value: true, primary: true }], cancelValue: false, auto: 0, input: null }, o);
  return new Promise(resolve => {
    const ov = document.createElement('div');
    ov.className = 'ui-ov';
    ov.innerHTML = `<div class="ui-box" role="dialog" aria-modal="true">
      <div class="ui-icon ui-${o.type}">${UI_SVG[o.type] || UI_SVG.info}</div>
      <h3 class="ui-title">${esc(o.title || UI_TITLES[o.type] || '')}</h3>
      ${o.msg ? `<p class="ui-msg">${esc(o.msg).replace(/\n/g, '<br>')}</p>` : ''}
      ${o.input ? `<input class="inp ui-input" type="text" inputmode="${o.input.inputmode || 'text'}" value="${esc(o.input.value || '')}" placeholder="${esc(o.input.placeholder || '')}">` : ''}
      <div class="ui-btns">${o.buttons.map((b, i) => `<button type="button" data-i="${i}" class="${b.primary ? 'btn' : 'btn2'}${b.danger ? ' ui-danger' : ''}">${esc(b.text)}</button>`).join('')}</div>
    </div>`;
    document.body.appendChild(ov);
    const inp = ov.querySelector('.ui-input'), prim = o.buttons.findIndex(b => b.primary);
    let done = false, timer = null;
    const finish = v => {
      if (done) return; done = true; clearTimeout(timer);
      document.removeEventListener('keydown', onKey, true);
      ov.classList.add('out'); setTimeout(() => ov.remove(), 160);
      resolve(v);
    };
    const pick = i => { const b = o.buttons[i]; finish(inp && b.primary ? inp.value : b.value); };
    const onKey = ev => {
      if (!ov.isConnected) return;
      if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); finish(o.cancelValue); }
      else if (ev.key === 'Enter' && (inp || prim >= 0) && document.activeElement && document.activeElement.tagName !== 'BUTTON') { ev.preventDefault(); ev.stopPropagation(); pick(prim >= 0 ? prim : 0); }
    };
    document.addEventListener('keydown', onKey, true);
    ov.addEventListener('click', ev => { const b = ev.target.closest('button[data-i]'); if (b) pick(+b.dataset.i); else if (ev.target === ov && !inp) finish(o.cancelValue); });
    const f = inp || ov.querySelector(prim >= 0 ? `button[data-i="${prim}"]` : 'button');
    if (f) { f.focus(); if (inp) inp.select(); }
    if (o.auto) timer = setTimeout(() => finish(o.cancelValue), o.auto);
  });
}

const uiAlert = (msg, type = 'info', opts = {}) => uiDialog(Object.assign({ type, msg, cancelValue: true }, opts));

const uiConfirm = (msg, o = {}) => uiDialog({
  type: o.danger ? 'warning' : 'info', title: o.title || '¿Confirmas?', msg, cancelValue: false,
  buttons: [{ text: o.cancel || 'Cancelar', value: false }, { text: o.ok || 'Aceptar', value: true, primary: true, danger: !!o.danger }]
});

// Devuelve el texto escrito, o null si cancela
const uiPrompt = (msg, def = '', o = {}) => uiDialog({
  type: 'info', title: o.title || 'Escribe un valor', msg, cancelValue: null,
  input: { value: def, inputmode: o.inputmode, placeholder: o.placeholder },
  buttons: [{ text: 'Cancelar', value: null }, { text: o.ok || 'Aceptar', value: '', primary: true }]
});

/* Los alert() que quedan en otras pantallas salen con este estilo (la ventana "Listo" se cierra sola). */
window.alert = m => {
  m = String(m ?? '');
  const type = /^(no se pudo|no hay espacio|esta foto no permite|el archivo no es)/i.test(m) ? 'error'
    : /^(elige|escribe|sube|primero|ya existe|máximo|agrega)/i.test(m) ? 'warning'
    : /(guardad|agregad|registrad|enviad)/i.test(m) ? 'success' : 'info';
  uiAlert(m, type, type === 'success' ? { auto: 2200 } : {});
};
