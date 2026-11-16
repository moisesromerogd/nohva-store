/* ============================================================
   VENTAS: registro, pedidos con varios productos, saldo pendiente y abonos
   ============================================================ */


const fmtBs = n => (+n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtRate = r => (+r || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
const nowHM = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

function renderSalesTable(data = sales) {
  const tbody = document.getElementById('sales-table-body');
  tbody.innerHTML = '';

  data.forEach(s => {
    normalizeSale(s);
    const amountBs = (s.amountUSD * bcvRate).toFixed(2);
    const pending = s.balance > 0.004, over = isOverdue(s);
    const itemsHtml = s.items.map(i => `<div class="whitespace-nowrap">${i.qty}× ${esc(i.product)} <span class="text-slate-500">· $${(i.qty * i.price).toFixed(2)}</span></div>`).join('');
    const payTip = s.payments.length ? s.payments.map(p => `${fmtD(p.date)}: $${(+p.amt).toFixed(2)} (${p.method}${p.rate ? ' · tasa ' + fmtRate(p.rate) : ''}${p.ref ? ' · ref ' + p.ref : ''})`).join(' | ') : '';
    const stCls = over ? 'bg-rose-500/20 text-rose-300' : pending ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300';
    const stTxt = over ? 'Vencido' : pending ? 'Pendiente' : (s.status || 'Concretado');
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-900/50 transition border-b border-slate-800/60";
    tr.innerHTML = `
      <td class="p-3.5 font-mono text-[11px] text-indigo-400">
        ${s.id}
        <span class="block text-[10px] text-slate-500">${s.date}</span>
      </td>
      <td class="p-3.5 font-semibold text-white">${esc(s.client)}</td>
      <td class="p-3.5 text-slate-300">${itemsHtml}</td>
      <td class="p-3.5 font-bold text-slate-200">${s.qty}</td>
      <td class="p-3.5">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-300 border border-slate-700">${esc(s.method)}</span>
      </td>
      <td class="p-3.5 font-bold text-slate-100">$${s.amountUSD.toFixed(2)}</td>
      <td class="p-3.5 font-bold text-emerald-400">${amountBs} Bs</td>
      <td class="p-3.5 whitespace-nowrap" ${payTip ? `title="${esc(payTip)}"` : ''}>
        <span class="font-semibold text-slate-200">$${s.paid.toFixed(2)}</span> <span class="text-[10px] text-slate-500">cobrado</span>
        ${pending ? `<span class="block text-[10px] font-semibold ${over ? 'text-rose-400' : 'text-amber-300'}">Debe $${s.balance.toFixed(2)} · ${s.dueDate ? (over ? 'venció ' : 'vence ') + fmtD(s.dueDate) : 'sin fecha'}</span>` : ''}
      </td>
      <td class="p-3.5 text-slate-400 text-[11px]">${esc(s.channel || 'Instagram')}</td>
      <td class="p-3.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${stCls}">${stTxt}</span></td>
      <td class="p-3.5">
        <div class="flex items-center gap-1 whitespace-nowrap">
          ${pending ? `<button class="ib ib-pay" title="Registrar abono" aria-label="Registrar abono" onclick="openPay('${s.id}')"><i class="fa-solid fa-hand-holding-dollar"></i></button>` : ''}
          <button class="ib" title="Historial de pagos" aria-label="Historial de pagos" onclick="openHist('${s.id}')"><i class="fa-solid fa-clock-rotate-left"></i></button>
          <button class="ib" title="Imprimir factura" aria-label="Imprimir factura" onclick="printInvoice('${s.id}')"><i class="fa-solid fa-print"></i></button>
          <button class="ib" title="Editar venta" aria-label="Editar venta" onclick="openEditSale('${s.id}')"><i class="fa-solid fa-pen"></i></button>
          <button class="ib ib-del" title="Borrar venta" aria-label="Borrar venta" onclick="delSale('${s.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  renderSalesSummary();
  renderDebtors();
  updateKpis();
}

function renderSalesSummary() {
  const box = document.getElementById('sales-summary'); if (!box) return;
  sales.forEach(normalizeSale);
  const tot = sales.reduce((a, s) => a + s.amountUSD, 0), cob = sales.reduce((a, s) => a + s.paid, 0), pen = sales.reduce((a, s) => a + s.balance, 0);
  const np = sales.filter(s => s.balance > 0.004).length, nv = sales.filter(isOverdue).length;
  const card = (t, v, sub, cls, click) => `<div ${click ? `onclick="${click}" style="cursor:pointer" title="Ver clientes que deben"` : ''} class="bg-slate-900/80 border border-slate-800 rounded-xl p-3"><p class="text-[11px] text-slate-400">${t}</p><p class="text-lg font-bold ${cls}">${v}</p><p class="text-[10px] text-slate-500">${sub}</p></div>`;
  box.innerHTML = card('Vendido', '$' + tot.toFixed(2), `${sales.length} ventas`, 'text-white')
    + card('Cobrado', '$' + cob.toFixed(2), 'Dinero que ya entró', 'text-emerald-400')
    + card('Por cobrar', '$' + pen.toFixed(2), np ? `${np} venta${np > 1 ? 's' : ''} con saldo${nv ? ` · ${nv} vencida${nv > 1 ? 's' : ''}` : ''}` : 'Nadie te debe nada', pen > 0 ? (nv ? 'text-rose-400' : 'text-amber-300') : 'text-slate-200', pen > 0 ? "setSalesView('debt')" : '');
}

function filterSalesTable() {
  const query = document.getElementById('sales-search-input').value.toLowerCase();
  const filtered = sales.filter(s => 
    s.client.toLowerCase().includes(query) || 
    s.product.toLowerCase().includes(query) ||
    (s.channel && s.channel.toLowerCase().includes(query)) ||
    (s.payments || []).some(p => (p.ref || '').toLowerCase().includes(query))
  );
  renderSalesTable(filtered);
}

/* ---- Modal de nueva venta (varios productos) ---- */

let saleLines = [], salePaidTouched = false, PAY_ID = null;

function newLine(name) {
  const p = products.find(x => x.name === name) || products.find(x => !saleLines.some(l => l.product === x.name)) || products[0];
  return p ? { product: p.name, qty: 1, price: round2(p.priceUSD) } : { product: '', qty: 1, price: 0 };
}

function lineHTML(l, i) {
  const cls = 'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white';
  return `<div class="rounded-lg border border-slate-800 p-2.5 space-y-1.5">
    <div class="grid grid-cols-12 gap-2 items-end">
      <div class="col-span-12 sm:col-span-5 relative"><label class="block text-[10px] text-slate-400 mb-1">Producto</label>
        <input type="text" id="sl-q-${i}" value="${esc(l.product)}" autocomplete="off" placeholder="Escribe para buscar…" onfocus="lineOpen(${i},this)" oninput="lineDropdown(${i},this.value)" onkeydown="lineKey(event,${i})" onblur="lineClose(${i})" class="${cls}">
        <div id="sl-dd-${i}" class="hidden absolute left-0 right-0 mt-1 rounded-lg overflow-y-auto shadow-xl" style="z-index:30;max-height:15rem;background:var(--surface);border:1px solid var(--line)"></div></div>
      <div class="col-span-4 sm:col-span-2"><label class="block text-[10px] text-slate-400 mb-1">Cant.</label>
        <input type="number" min="1" value="${l.qty}" oninput="lineSet(${i},'qty',this.value)" class="${cls}"></div>
      <div class="col-span-4 sm:col-span-2"><label class="block text-[10px] text-slate-400 mb-1">Precio unit.</label>
        <input type="number" step="0.01" min="0" value="${l.price}" oninput="lineSet(${i},'price',this.value)" class="${cls}"></div>
      <div class="col-span-4 sm:col-span-3 text-right"><label class="block text-[10px] text-slate-400 mb-1">Subtotal</label>
        <p id="sl-sub-${i}" class="font-bold text-sm text-white py-2">$${(l.qty * l.price).toFixed(2)}</p></div>
    </div>
    <div class="flex justify-between items-center text-[10px]"><span id="sl-hint-${i}"></span>
      ${saleLines.length > 1 ? `<button type="button" class="text-rose-400 font-semibold" onclick="lineDel(${i})">Quitar</button>` : ''}</div>
  </div>`;
}

/* ---- Buscador de productos dentro de cada línea del pedido ---- */

const normKey = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
let LINE_HL = { list: [], pos: -1 };

function prodSearch(term) {
  const w = normKey(term).split(/\s+/).filter(Boolean);
  return products.map((p, k) => ({ p, k })).filter(({ p }) => { const hay = normKey(p.name + ' ' + p.id + ' ' + (p.category || '')); return w.every(x => hay.includes(x)); });
}

function lineDropdown(i, term) {
  const dd = q('sl-dd-' + i); if (!dd) return;
  const res = prodSearch(term), shown = res.slice(0, 40);
  LINE_HL = { list: shown.map(r => r.k), pos: shown.length ? 0 : -1 };
  const row = (r, n) => `<div class="ddi ${n === 0 ? 'on' : ''}" data-pick="1" onmousedown="event.preventDefault();pickProd(${i},${r.k})">
    <span>${esc(r.p.name)}<small>${esc(r.p.id)} · ${esc(r.p.category || '')}</small></span>
    <span class="text-right whitespace-nowrap"><b>$${(+r.p.priceUSD).toFixed(2)}</b><small style="${r.p.stock <= 0 ? 'color:var(--bad)' : ''}">${r.p.stock > 0 ? r.p.stock + ' en stock' : 'Sin stock'}</small></span></div>`;
  const note = t => `<div class="ddi" style="cursor:default"><small>${t}</small></div>`;
  dd.innerHTML = shown.length ? shown.map(row).join('') + (res.length > shown.length ? note(`Hay ${res.length - shown.length} más, sigue escribiendo…`) : '') : note('No hay productos que coincidan');
  dd.classList.remove('hidden');
}

function lineOpen(i, el) { el.select(); lineDropdown(i, ''); }

function lineKey(ev, i) {
  const n = LINE_HL.list.length;
  if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
    ev.preventDefault(); if (!n) return;
    LINE_HL.pos = (LINE_HL.pos + (ev.key === 'ArrowDown' ? 1 : -1) + n) % n;
    q('sl-dd-' + i).querySelectorAll('[data-pick]').forEach((el, k) => { el.classList.toggle('on', k === LINE_HL.pos); if (k === LINE_HL.pos) el.scrollIntoView({ block: 'nearest' }); });
  } else if (ev.key === 'Enter') { ev.preventDefault(); if (LINE_HL.pos >= 0) pickProd(i, LINE_HL.list[LINE_HL.pos]); }
  else if (ev.key === 'Escape') { ev.stopPropagation(); q('sl-q-' + i).blur(); }
}

function lineClose(i) {
  setTimeout(() => { const dd = q('sl-dd-' + i), inp = q('sl-q-' + i); if (dd) dd.classList.add('hidden'); if (inp && saleLines[i]) inp.value = saleLines[i].product; }, 120);
}

function pickProd(i, k) { if (products[k]) lineProd(i, products[k].name); }

function renderSaleLines() {
  document.getElementById('sale-lines').innerHTML = saleLines.map(lineHTML).join('');
  refreshLineInfo();
}

function refreshLineInfo() {
  const need = {}; saleLines.forEach(l => need[l.product] = (need[l.product] || 0) + l.qty);
  saleLines.forEach((l, i) => {
    const sub = document.getElementById('sl-sub-' + i), hint = document.getElementById('sl-hint-' + i);
    if (sub) sub.innerText = '$' + (l.qty * l.price).toFixed(2);
    const p = products.find(x => x.name === l.product);
    if (hint && p) hint.innerHTML = need[l.product] > p.stock
      ? `<span class="text-rose-400">Solo hay ${p.stock} en stock</span>` : `<span class="text-slate-500">Stock disponible: ${p.stock}</span>`;
  });
}

function lineSet(i, k, v) {
  saleLines[i][k] = k === 'qty' ? Math.max(1, parseInt(v) || 1) : Math.max(0, parseFloat(v) || 0);
  refreshLineInfo(); recalcSale();
}

function lineProd(i, name) {
  const p = products.find(x => x.name === name);
  saleLines[i].product = name; saleLines[i].price = p ? round2(p.priceUSD) : 0;
  renderSaleLines(); recalcSale();
}

function addSaleLine() { saleLines.push(newLine()); renderSaleLines(); recalcSale(); }

function lineDel(i) { saleLines.splice(i, 1); renderSaleLines(); recalcSale(); }

function saleTotal() { return round2(saleLines.reduce((a, l) => a + l.qty * l.price, 0)); }

function recalcSale() {
  const total = saleTotal(), pi = document.getElementById('sale-paid');
  document.getElementById('sale-total-usd').innerText = '$' + total.toFixed(2);
  document.getElementById('sale-total-bs').innerText = (total * bcvRate).toFixed(2) + ' Bs';
  if (!salePaidTouched) pi.value = total.toFixed(2);
  const paid = Math.min(Math.max(parseFloat(pi.value) || 0, 0), total), bal = round2(total - paid);
  const line = document.getElementById('sale-balance-line');
  line.innerText = bal > 0.004 ? `Saldo pendiente: $${bal.toFixed(2)}` : 'Pago completo ✓';
  line.className = 'text-xs font-semibold ' + (bal > 0.004 ? 'text-amber-300' : 'text-emerald-400');
  document.getElementById('sale-due-box').classList.toggle('hidden', bal <= 0.004);
  dueChanged('sale');
  payExtra('sale', 'usd');
}

const autoCalculateSaleAmount = recalcSale, recalcBsSale = recalcSale;

function salePaidAll() { salePaidTouched = false; recalcSale(); }

function salePaidNone() { salePaidTouched = true; document.getElementById('sale-paid').value = '0'; recalcSale(); }

function dueChanged(p) {
  const c = document.getElementById(p + '-due-choice').value, d = document.getElementById(p + '-due-date');
  d.classList.toggle('hidden', c !== 'custom');
  document.getElementById(p + '-due-show').innerText = c === 'custom' ? '' : 'Vence el ' + fmtD(dueFrom(c));
}

function openNewSaleModal() {
  document.getElementById('sale-client-name').value = '';
  saleLines = [newLine()]; salePaidTouched = false;
  document.getElementById('sale-due-choice').value = 'q1';
  document.getElementById('sale-due-date').value = '';
  renderSaleLines(); recalcSale();
  q('sale-ref').value = ''; q('sale-rate').value = ''; q('sale-bs').value = '';
  payExtra('sale', 'method');
  document.getElementById('modal-new-sale').classList.remove('hidden');
  document.getElementById('modal-new-sale').classList.add('flex');
}

function closeNewSaleModal() {
  document.getElementById('modal-new-sale').classList.add('hidden');
  document.getElementById('modal-new-sale').classList.remove('flex');
}

async function handleNewSaleSubmit(e) {
  e.preventDefault();
  const items = saleLines.filter(l => l.product && l.qty > 0).map(l => ({ product: l.product, qty: l.qty, price: round2(l.price) }));
  if (!items.length) return uiAlert('Agrega al menos un producto al pedido.', 'warning');
  const total = round2(items.reduce((a, i) => a + i.qty * i.price, 0));
  const rawPaid = Math.max(parseFloat(document.getElementById('sale-paid').value) || 0, 0);
  const paid = round2(Math.min(rawPaid, total));
  const balance = round2(total - paid);
  let dueDate = '', dueLabel = '';
  if (balance > 0.004) {
    const c = document.getElementById('sale-due-choice').value;
    dueDate = dueFrom(c, document.getElementById('sale-due-date').value);
    if (!dueDate) return uiAlert('Elige la fecha en que pagará el saldo pendiente.', 'warning');
    dueLabel = DUE_LABELS[c];
  }
  if (paid > 0 && !(await validatePayExtra('sale'))) return;
  const need = {}; items.forEach(i => need[i.product] = (need[i.product] || 0) + i.qty);
  const short = Object.keys(need).filter(n => { const p = products.find(x => x.name === n); return p && p.stock < need[n]; });
  if (short.length && !(await uiConfirm('No hay stock suficiente de: ' + short.join(', ') + '.\n¿Registrar la venta de todas formas?', { title: 'Stock insuficiente', ok: 'Registrar igual' }))) return;

  const method = paid > 0 ? document.getElementById('sale-pay-method').value : 'Sin pago aún';
  const nextN = Math.max(1000, ...sales.map(s => parseInt(String(s.id).replace(/\D/g, '')) || 0)) + 1;
  const s = {
    id: `VEN-${nextN}`,
    client: document.getElementById('sale-client-name').value.trim(),
    items, method, paid, dueDate, dueLabel,
    channel: document.getElementById('sale-channel').value,
    date: 'Justo ahora', created: isoLocal(new Date()), createdTime: nowHM(),
    payments: paid > 0 ? [Object.assign({ amt: paid, date: isoLocal(new Date()), time: nowHM(), method }, readPayExtra('sale', paid, rawPaid > total + 0.004))] : []
  };
  normalizeSale(s);
  sales.unshift(s);

  Object.keys(need).forEach(n => { const p = products.find(x => x.name === n); if (p) p.stock = Math.max(0, p.stock - need[n]); });

  closeNewSaleModal();
  refreshAll();
  renderInventoryTable();
  const msg = [`${s.id} · ${s.client}`, `Total $${s.amountUSD.toFixed(2)}`];
  if (balance > 0.004) msg.push(`Saldo pendiente $${balance.toFixed(2)} · vence ${fmtD(dueDate)}`);
  const act = await uiDialog({ type: 'success', title: '¡Venta realizada con éxito!', msg: msg.join('\n'), cancelValue: 'ok',
    buttons: [{ text: 'Imprimir factura', value: 'print' }, { text: 'Listo', value: 'ok', primary: true }] });
  if (act === 'print') printInvoice(s.id);
}

/* ---- Abonos a saldo pendiente ---- */

function openPay(id) {
  const s = sales.find(x => x.id === id); if (!s) return;
  PAY_ID = id;
  document.getElementById('pay-info').innerHTML = `<b>${esc(s.client)}</b> · ${s.id}<br>Total $${s.amountUSD.toFixed(2)} · Cobrado $${s.paid.toFixed(2)} · <b>Saldo $${s.balance.toFixed(2)}</b>${s.dueDate ? '<br>Fecha prevista: ' + fmtD(s.dueDate) : ''}`;
  document.getElementById('pay-amt').value = s.balance.toFixed(2);
  q('pay-ref').value = ''; q('pay-rate').value = bcvRate.toFixed(4);
  document.getElementById('pay-due-choice').value = s.dueDate ? 'custom' : 'q1';
  document.getElementById('pay-due-date').value = s.dueDate || '';
  payChanged();
  document.getElementById('modal-pay').classList.remove('hidden');
  document.getElementById('modal-pay').classList.add('flex');
}

function closePay() { document.getElementById('modal-pay').classList.add('hidden'); document.getElementById('modal-pay').classList.remove('flex'); }

function payAll() { const s = sales.find(x => x.id === PAY_ID); if (s) { document.getElementById('pay-amt').value = s.balance.toFixed(2); payChanged(); } }

function payChanged() {
  const s = sales.find(x => x.id === PAY_ID); if (!s) return;
  const a = Math.min(Math.max(parseFloat(document.getElementById('pay-amt').value) || 0, 0), s.balance), rest = round2(s.balance - a);
  const el = document.getElementById('pay-rest');
  el.innerText = rest > 0.004 ? `Quedará pendiente $${rest.toFixed(2)}` : 'Con este abono la venta queda saldada ✓';
  el.className = 'text-xs font-semibold ' + (rest > 0.004 ? 'text-amber-300' : 'text-emerald-400');
  document.getElementById('pay-due-box').classList.toggle('hidden', rest <= 0.004);
  dueChanged('pay');
  payExtra('pay', 'usd');
}

async function submitPay(e) {
  e.preventDefault();
  const s = sales.find(x => x.id === PAY_ID); if (!s) return;
  const raw = parseFloat(document.getElementById('pay-amt').value) || 0;
  const a = round2(Math.min(raw, s.balance));
  if (a <= 0) return uiAlert('Escribe un monto mayor a 0.', 'warning');
  const rest = round2(s.balance - a), method = document.getElementById('pay-method').value;
  if (!(await validatePayExtra('pay'))) return;
  let due = s.dueDate, label = s.dueLabel;
  if (rest > 0.004) {
    const c = document.getElementById('pay-due-choice').value;
    due = dueFrom(c, document.getElementById('pay-due-date').value);
    if (!due) return uiAlert('Elige la fecha en que pagará el resto.', 'warning');
    label = DUE_LABELS[c];
  }
  s.paid = round2(s.paid + a);
  s.payments.push(Object.assign({ amt: a, date: isoLocal(new Date()), time: nowHM(), method }, readPayExtra('pay', a, raw > s.balance + 0.004)));
  if (s.method === 'Sin pago aún') s.method = method;
  s.dueDate = due; s.dueLabel = label;
  normalizeSale(s);
  closePay();
  refreshAll();
  const settled = s.balance <= 0.004;
  const act = await uiDialog({ type: 'success', title: settled ? '¡Venta saldada!' : '¡Abono registrado!', cancelValue: 'ok',
    msg: `${s.client} · ${s.id}\nAbono de $${a.toFixed(2)}\n` + (settled ? 'La venta quedó pagada por completo.' : `Saldo pendiente $${s.balance.toFixed(2)}`),
    buttons: [{ text: 'Imprimir factura', value: 'print' }, { text: 'Listo', value: 'ok', primary: true }] });
  if (act === 'print') printInvoice(s.id);
}

/* ---- Pago en Bs: tasa del día, monto en Bs y referencia (nueva venta y abonos) ---- */

const BS_METHODS = ['Pago Móvil', 'Efectivo Bs'];
const isBsMethod = m => BS_METHODS.includes(m);
const PX = { sale: { m: 'sale-pay-method', usd: 'sale-paid' }, pay: { m: 'pay-method', usd: 'pay-amt' } };
let bsEditing = false;

// p = 'sale' (nueva venta) o 'pay' (abono). src = qué campo cambió: method | rate | bs | usd
function payExtra(p, src) {
  const f = PX[p], method = q(f.m).value, bsOn = isBsMethod(method);
  const usdEl = q(f.usd), rateEl = q(p + '-rate'), bsEl = q(p + '-bs');
  q(p + '-bs-box').classList.toggle('hidden', !bsOn);
  if (p === 'sale') q('sale-pay-extra').classList.toggle('hidden', !(parseFloat(usdEl.value) > 0));
  if (!bsOn) return;
  if (src === 'method' && !(parseFloat(rateEl.value) > 0)) rateEl.value = bcvRate.toFixed(4);
  const rate = parseFloat(rateEl.value) || 0;
  if (src === 'bs') {
    // Escribió los Bs que recibió: los USD que cubre = Bs / tasa del día
    if (rate > 0) {
      bsEditing = true;
      usdEl.value = round2((parseFloat(bsEl.value) || 0) / rate).toFixed(2);
      if (p === 'sale') { salePaidTouched = true; recalcSale(); } else payChanged();
      bsEditing = false;
    }
  } else if (!bsEditing) {
    // La deuda está en USD: al cambiar monto o tasa se recalculan los Bs
    bsEl.value = rate > 0 ? round2((parseFloat(usdEl.value) || 0) * rate).toFixed(2) : '';
  }
  const hint = q(p + '-bs-hint');
  if (p === 'pay') {
    const s = sales.find(x => x.id === PAY_ID);
    hint.innerText = s && rate > 0 ? `Saldo pendiente: $${s.balance.toFixed(2)} ≈ ${fmtBs(s.balance * rate)} Bs a esta tasa.` : '';
  } else hint.innerText = '';
}

// Lee tasa, Bs y referencia del formulario y arma lo que se guarda junto al pago
function readPayExtra(p, usd, clamped) {
  const method = q(PX[p].m).value, o = {}, ref = q(p + '-ref').value.trim();
  if (ref) o.ref = ref;
  if (isBsMethod(method)) {
    const rate = Math.round((parseFloat(q(p + '-rate').value) || 0) * 10000) / 10000;
    if (rate > 0) {
      let bs = parseFloat(q(p + '-bs').value) || 0;
      if (clamped || bs <= 0) bs = usd * rate;
      o.rate = rate; o.bs = round2(bs);
    }
  }
  return o;
}

function refDup(ref) {
  if (!ref) return null;
  const r = ref.toLowerCase();
  return sales.find(s => (s.payments || []).some(p => (p.ref || '').toLowerCase() === r)) || null;
}

async function validatePayExtra(p) {
  const method = q(PX[p].m).value;
  if (isBsMethod(method) && !(parseFloat(q(p + '-rate').value) > 0)) { uiAlert('Escribe la tasa del día (Bs por USD) a la que pagó.', 'warning'); return false; }
  const ref = q(p + '-ref').value.trim(), dup = refDup(ref);
  if (dup && !(await uiConfirm(`La referencia ${ref} ya está registrada en la venta ${dup.id} (${dup.client}).\n¿Guardarla de todas formas?`, { title: 'Referencia repetida', ok: 'Guardar igual' }))) return false;
  return true;
}

/* ---- Historial de pagos de una venta ---- */

let HIST_ID = null;

function openHist(id) {
  HIST_ID = id; renderHist();
  q('modal-hist').classList.remove('hidden'); q('modal-hist').classList.add('flex');
}

function closeHist() { q('modal-hist').classList.add('hidden'); q('modal-hist').classList.remove('flex'); HIST_ID = null; }

function renderHist() {
  const s = sales.find(x => x.id === HIST_ID); if (!s) return closeHist();
  normalizeSale(s);
  const pend = s.balance > 0.004, over = isOverdue(s);
  const card = (t, v, cls) => `<div class="bg-slate-950 border border-slate-800 rounded-xl p-3"><p class="text-[11px] text-slate-400">${t}</p><p class="text-lg font-bold ${cls}">${v}</p></div>`;
  const sumPay = round2(s.payments.reduce((a, p) => a + (+p.amt || 0), 0));
  const noDetail = round2(s.paid - sumPay);
  const bsPays = s.payments.filter(p => p.bs > 0 && p.rate > 0);
  const bsTot = round2(bsPays.reduce((a, p) => a + p.bs, 0)), usdBs = round2(bsPays.reduce((a, p) => a + p.amt, 0));

  const rows = s.payments.map((p, i) => `<tr>
    <td>${i + 1}</td>
    <td class="whitespace-nowrap">${fmtD(p.date)}${p.time ? ' · ' + esc(p.time) : ''}</td>
    <td>${esc(p.method)}</td>
    <td class="font-semibold whitespace-nowrap">$${(+p.amt).toFixed(2)}</td>
    <td>${p.rate ? fmtRate(p.rate) : '—'}</td>
    <td class="whitespace-nowrap">${p.bs ? fmtBs(p.bs) + ' Bs' : '—'}</td>
    <td class="font-mono">${p.ref ? esc(p.ref) : '—'}</td>
    <td class="whitespace-nowrap"><button class="btn2" title="Editar referencia" onclick="editPayRef('${s.id}',${i})">Ref.</button> <button class="btn2" title="Eliminar este pago" style="color:var(--bad)" onclick="delPay('${s.id}',${i})">Quitar</button></td>
  </tr>`).join('');

  const foot = bsPays.length ? `<p class="text-[11px] text-slate-400">Recibido en bolívares: <b class="text-slate-200">${fmtBs(bsTot)} Bs</b> por $${usdBs.toFixed(2)} · tasa promedio <b class="text-slate-200">${fmtRate(bsTot / usdBs)}</b></p>` : '';
  const legacy = noDetail > 0.004 ? `<p class="text-[11px] text-amber-300">Hay $${noDetail.toFixed(2)} cobrados sin detalle (ventas registradas antes del historial o editadas a mano).</p>` : '';

  q('hist-body').innerHTML = `
    <div class="text-xs text-slate-300 leading-relaxed">
      <b class="text-white">${esc(s.client)}</b> · <span class="font-mono text-indigo-400">${s.id}</span> · ${esc(s.date)}<br>
      ${s.items.map(i => `${i.qty}× ${esc(i.product)} ($${(i.qty * i.price).toFixed(2)})`).join(' · ')}
    </div>
    <div class="grid grid-cols-3 gap-3">
      ${card('Total', '$' + s.amountUSD.toFixed(2), 'text-white')}
      ${card('Cobrado', '$' + s.paid.toFixed(2), 'text-emerald-400')}
      ${card(pend ? 'Saldo pendiente' : 'Saldo', pend ? '$' + s.balance.toFixed(2) : 'Saldada ✓', pend ? (over ? 'text-rose-400' : 'text-amber-300') : 'text-emerald-400')}
    </div>
    ${pend ? `<p class="text-xs ${over ? 'text-rose-400' : 'text-amber-300'}">Hoy el saldo equivale a ${fmtBs(s.balance * bcvRate)} Bs (tasa ${fmtRate(bcvRate)}) · ${s.dueDate ? (over ? 'venció ' : 'vence ') + fmtD(s.dueDate) : 'sin fecha de pago'}</p>` : ''}
    <div class="card p-0 overflow-x-auto">
      ${s.payments.length ? `<table class="tbl"><thead><tr><th>#</th><th>Fecha</th><th>Método</th><th>Monto USD</th><th>Tasa</th><th>Monto Bs</th><th>Referencia</th><th></th></tr></thead><tbody>${rows}</tbody></table>`
        : '<p class="text-xs text-slate-400 p-4">Esta venta no tiene pagos detallados todavía.</p>'}
    </div>
    ${foot}${legacy}
    <div class="pt-2 flex justify-end gap-2 border-t border-slate-800">
      ${pend ? `<button type="button" class="btn" onclick="closeHist();openPay('${s.id}')">Registrar abono</button>` : ''}
      <button type="button" class="btn2" onclick="printInvoice('${s.id}')"><i class="fa-solid fa-print mr-1"></i>Imprimir factura</button>
      <button type="button" class="btn2" onclick="closeHist()">Cerrar</button>
    </div>`;
}

async function editPayRef(id, i) {
  const s = sales.find(x => x.id === id), p = s && s.payments[i]; if (!p) return;
  const v = await uiPrompt('Escribe la referencia del pago. Déjala vacía para quitarla.', p.ref || '', { title: 'Referencia del pago', ok: 'Guardar' }); if (v === null) return;
  const ref = v.trim();
  if (ref) p.ref = ref; else delete p.ref;
  save(); renderHist(); renderSalesTable();
}

async function delPay(id, i) {
  const s = sales.find(x => x.id === id), p = s && s.payments[i]; if (!p) return;
  if (!(await uiConfirm(`Se quitará el pago de $${(+p.amt).toFixed(2)}${p.ref ? ' (ref ' + p.ref + ')' : ''}.\nLa venta volverá a tener ese saldo pendiente.`, { title: '¿Quitar este pago?', ok: 'Sí, quitar', danger: true }))) return;
  s.paid = round2(s.paid - (+p.amt || 0));
  s.payments.splice(i, 1);
  normalizeSale(s);
  if (s.balance > 0.004 && !s.dueDate) { s.dueDate = dueFrom('q1'); s.dueLabel = DUE_LABELS.q1; }
  save(); refreshAll(); renderHist();
}

/* ---- Editar, borrar y venta desde el Inbox ---- */

/* ---- Editar venta (ventana propia) ---- */

let EDIT_SALE_ID = null, editLines = [];
const CHANNELS = [['Instagram', 'Instagram Direct'], ['FB Marketplace', 'Facebook Marketplace'], ['WhatsApp', 'WhatsApp Business'], ['TikTok', 'TikTok Direct'], ['Tienda Directa', 'Tienda Directa']];
const PAY_METHODS = [['Pago Móvil', 'Pago Móvil (Bs)'], ['Divisas $', 'Efectivo Divisas ($ USD)'], ['USDT', 'USDT Binance Pay'], ['Zinli/Zelle', 'Zinli / Zelle'], ['Efectivo Bs', 'Efectivo Bolívares (Bs)']];

function fillSelect(id, list, current) {
  const all = list.some(x => x[0] === current) || !current ? list : [...list, [current, current]];
  q(id).innerHTML = all.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('');
  q(id).value = current || all[0][0];
}

function editSale(id) { openEditSale(id); }

function openEditSale(id) {
  const s = sales.find(x => x.id === id); if (!s) return;
  normalizeSale(s);
  EDIT_SALE_ID = id;
  editLines = s.items.map(i => ({ product: i.product, qty: i.qty, price: i.price, oldQty: i.qty }));
  q('edit-info').innerHTML = `<span class="font-mono text-indigo-400">${esc(s.id)}</span> · ${esc(s.date)} · Ya cobrado: <b class="text-white">$${s.paid.toFixed(2)}</b>`;
  q('edit-client').value = s.client;
  fillSelect('edit-channel', CHANNELS, s.channel || 'Instagram');
  fillSelect('edit-method', PAY_METHODS, s.method);
  q('edit-due').value = s.dueDate || '';
  renderEditLines();
  q('modal-edit-sale').classList.remove('hidden'); q('modal-edit-sale').classList.add('flex');
}

function closeEditSale() { q('modal-edit-sale').classList.add('hidden'); q('modal-edit-sale').classList.remove('flex'); EDIT_SALE_ID = null; }

function renderEditLines() {
  const cls = 'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white';
  q('edit-lines').innerHTML = editLines.map((l, i) => `<div class="rounded-lg border border-slate-800 p-2.5">
    <p class="text-xs font-semibold text-white mb-1.5">${esc(l.product)}</p>
    <div class="grid grid-cols-12 gap-2 items-end">
      <div class="col-span-4"><label class="block text-[10px] text-slate-400 mb-1">Cant.</label><input type="number" min="1" value="${l.qty}" oninput="editSet(${i},'qty',this.value)" class="${cls}"></div>
      <div class="col-span-4"><label class="block text-[10px] text-slate-400 mb-1">Precio unit. ($)</label><input type="number" step="0.01" min="0" value="${l.price}" oninput="editSet(${i},'price',this.value)" class="${cls}"></div>
      <div class="col-span-4 text-right"><label class="block text-[10px] text-slate-400 mb-1">Subtotal</label><p id="ed-sub-${i}" class="font-bold text-sm text-white py-2">$${(l.qty * l.price).toFixed(2)}</p></div>
    </div></div>`).join('');
  editRecalc();
}

function editSet(i, k, v) {
  editLines[i][k] = k === 'qty' ? Math.max(1, parseInt(v) || 1) : Math.max(0, parseFloat(v) || 0);
  editRecalc();
}

function editRecalc() {
  const s = sales.find(x => x.id === EDIT_SALE_ID); if (!s) return;
  const total = round2(editLines.reduce((a, l) => a + l.qty * l.price, 0)), bal = round2(total - s.paid);
  editLines.forEach((l, i) => { const e = q('ed-sub-' + i); if (e) e.innerText = '$' + (l.qty * l.price).toFixed(2); });
  q('edit-total').innerText = '$' + total.toFixed(2);
  const line = q('edit-bal');
  line.innerText = bal < -0.004 ? `El total no puede ser menor a lo ya cobrado ($${s.paid.toFixed(2)})` : bal > 0.004 ? `Saldo pendiente: $${bal.toFixed(2)}` : 'Pago completo ✓';
  line.className = 'text-xs font-semibold text-right ' + (bal < -0.004 ? 'text-rose-400' : bal > 0.004 ? 'text-amber-300' : 'text-emerald-400');
  q('edit-due-box').classList.toggle('hidden', bal <= 0.004);
  if (bal > 0.004 && !q('edit-due').value) q('edit-due').value = dueFrom('q1');
}

async function submitEditSale(e) {
  e.preventDefault();
  const s = sales.find(x => x.id === EDIT_SALE_ID); if (!s) return;
  const client = q('edit-client').value.trim();
  if (!client) return uiAlert('Escribe el nombre del cliente.', 'warning');
  const total = round2(editLines.reduce((a, l) => a + l.qty * l.price, 0));
  if (total < s.paid - 0.004) return uiAlert(`El nuevo total ($${total.toFixed(2)}) es menor a lo ya cobrado ($${s.paid.toFixed(2)}).\nSi cobraste de más, quita un pago desde el Historial y vuelve a intentar.`, 'warning');
  const bal = round2(total - s.paid);
  if (bal > 0.004 && !q('edit-due').value) return uiAlert('Elige la fecha límite para pagar el saldo pendiente.', 'warning');

  // Ajuste de inventario por cambios de cantidad
  const diffs = editLines.map(l => ({ p: products.find(x => x.name === l.product), d: l.qty - l.oldQty })).filter(x => x.p && x.d !== 0);
  const short = diffs.filter(x => x.d > 0 && x.p.stock < x.d).map(x => x.p.name);
  if (short.length && !(await uiConfirm('No hay stock suficiente de: ' + short.join(', ') + '.\n¿Guardar los cambios de todas formas?', { title: 'Stock insuficiente', ok: 'Guardar igual' }))) return;
  diffs.forEach(x => { x.p.stock = Math.max(0, x.p.stock - x.d); });

  s.client = client;
  s.channel = q('edit-channel').value;
  s.method = q('edit-method').value;
  editLines.forEach((l, i) => { s.items[i].qty = l.qty; s.items[i].price = round2(l.price); });
  normalizeSale(s);
  if (s.balance > 0.004) {
    const due = q('edit-due').value;
    if (due && due !== s.dueDate) { s.dueDate = due; s.dueLabel = DUE_LABELS.custom; }
    else if (!s.dueDate) { s.dueDate = dueFrom('q1'); s.dueLabel = DUE_LABELS.q1; }
  }
  closeEditSale();
  refreshAll(); renderInventoryTable();
  uiDialog({ type: 'success', title: 'Venta actualizada', msg: `${s.id} · ${s.client}`, auto: 1800, cancelValue: true, buttons: [{ text: 'Listo', value: true, primary: true }] });
}

async function delSale(id) {
  const i = sales.findIndex(x => x.id === id); if (i < 0) return;
  const s = sales[i];
  if (!(await uiConfirm(`Se borrará la venta ${s.id} de ${s.client} ($${s.amountUSD.toFixed(2)}).\nEl stock se devuelve al inventario.`, { title: '¿Borrar esta venta?', ok: 'Sí, borrar', danger: true }))) return;
  itemsOf(s).forEach(it => { const p = products.find(x => x.name === it.product); if (p) p.stock += it.qty; });
  sales.splice(sales.indexOf(s), 1);
  renderInventoryTable(); refreshAll();
}

/* ---- Clientes que deben ---- */

let salesView = 'all';

function setSalesView(v) { salesView = v; renderDebtors(); }

function renderDebtors() {
  const box = q('sales-debtors'); if (!box) return;
  // Agrupar por cliente las ventas con saldo pendiente
  const groups = {};
  sales.forEach(s => {
    normalizeSale(s);
    if (s.balance <= 0.004) return;
    const key = normKey(s.client), g = groups[key] = groups[key] || { name: s.client.trim(), list: [], total: 0, over: 0, overAmt: 0 };
    g.list.push(s); g.total = round2(g.total + s.balance);
    if (isOverdue(s)) { g.over++; g.overAmt = round2(g.overAmt + s.balance); }
  });
  const all = Object.values(groups);
  q('sales-debt-n').innerText = all.length;
  q('sales-view-all').classList.toggle('on', salesView === 'all');
  q('sales-view-debt').classList.toggle('on', salesView === 'debt');
  q('sales-table-wrap').classList.toggle('hidden', salesView === 'debt');
  box.classList.toggle('hidden', salesView !== 'debt');
  if (salesView !== 'debt') return;

  const term = normKey((q('sales-search-input') || {}).value);
  const rows = all.filter(g => !term || normKey(g.name + ' ' + g.list.map(s => s.product).join(' ')).includes(term))
    .sort((a, b) => (b.over > 0) - (a.over > 0) || b.total - a.total);

  const tot = all.reduce((a, g) => a + g.total, 0), ovAmt = all.reduce((a, g) => a + g.overAmt, 0), nOver = all.filter(g => g.over).length;
  const card = (t, v, sub, cls) => `<div class="bg-slate-900/80 border border-slate-800 rounded-xl p-3"><p class="text-[11px] text-slate-400">${t}</p><p class="text-lg font-bold ${cls}">${v}</p><p class="text-[10px] text-slate-500">${sub}</p></div>`;
  const head = `<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">`
    + card('Clientes que deben', all.length, all.length ? 'Con al menos una venta con saldo' : 'Nadie te debe nada', 'text-white')
    + card('Total por cobrar', '$' + tot.toFixed(2), `≈ ${fmtBs(tot * bcvRate)} Bs a tasa ${fmtRate(bcvRate)}`, tot > 0 ? 'text-amber-300' : 'text-slate-200')
    + card('Vencido', '$' + ovAmt.toFixed(2), nOver ? `${nOver} cliente${nOver > 1 ? 's' : ''} con pagos vencidos` : 'Sin pagos vencidos', ovAmt > 0 ? 'text-rose-400' : 'text-slate-200') + '</div>';

  const ib = (cls, title, icon, fn) => `<button class="ib ${cls}" title="${title}" aria-label="${title}" onclick="${fn}"><i class="fa-solid ${icon}"></i></button>`;
  const body = rows.map(g => `<div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div><p class="font-semibold text-white">${esc(g.name)}</p>
        <p class="text-[11px] text-slate-400">${g.list.length} venta${g.list.length > 1 ? 's' : ''} con saldo${g.over ? ` · <span class="text-rose-400 font-semibold">${g.over} vencida${g.over > 1 ? 's' : ''}</span>` : ''}</p></div>
      <div class="text-right"><p class="text-lg font-bold ${g.over ? 'text-rose-400' : 'text-amber-300'}">$${g.total.toFixed(2)}</p><p class="text-[10px] text-slate-500">≈ ${fmtBs(g.total * bcvRate)} Bs hoy</p></div>
    </div>
    <div class="divide-y divide-slate-800/60">${g.list.map(s => {
      const ov = isOverdue(s);
      return `<div class="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
        <div class="min-w-0"><span class="font-mono text-[11px] text-indigo-400">${esc(s.id)}</span> <span class="text-slate-400">${esc(s.product)}</span>
          <p class="text-[10px] font-semibold ${ov ? 'text-rose-400' : 'text-amber-300'}">Debe $${s.balance.toFixed(2)} de $${s.amountUSD.toFixed(2)} · ${s.dueDate ? (ov ? 'venció ' : 'vence ') + fmtD(s.dueDate) : 'sin fecha'}</p></div>
        <div class="flex items-center gap-1 whitespace-nowrap">${ib('ib-pay', 'Registrar abono', 'fa-hand-holding-dollar', `openPay('${s.id}')`)}${ib('', 'Historial de pagos', 'fa-clock-rotate-left', `openHist('${s.id}')`)}${ib('', 'Imprimir factura', 'fa-print', `printInvoice('${s.id}')`)}</div>
      </div>`;
    }).join('')}</div></div>`).join('');

  box.innerHTML = head + (body || `<div class="bg-slate-900/80 border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-400">${all.length ? 'Ningún cliente con deuda coincide con la búsqueda.' : 'Nadie te debe nada por ahora.'}</div>`);
}

function saleFromInbox(){openNewSaleModal();q('sale-client-name').value=q('in-name').value;saleLines=[newLine(q('in-prod').value)];renderSaleLines();recalcSale();}
