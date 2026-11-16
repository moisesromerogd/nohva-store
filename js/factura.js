/* ============================================================
   FACTURA: ticket imprimible de cada venta (angosto, ~5 cm de ancho)
   Datos del negocio: Ajustes → Datos de la factura (cfg.inv)
   ============================================================ */

const INV_WIDTH_MM = 50; // ancho del ticket. @page deja 4 mm de margen a cada lado (cabe en rollo de 58 mm)

function invoiceHTML(s) {
  normalizeSale(s);
  const inv = cfg.inv || {}, logo = (q('brand-logo') || {}).src || '';
  const usd = n => '$' + (+n || 0).toFixed(2);
  const pays = s.payments || [];
  const noDetail = round2(s.paid - round2(pays.reduce((a, p) => a + (+p.amt || 0), 0)));
  const pend = s.balance > 0.004;

  // Fecha de la compra: la exacta si existe; si es una venta vieja, el primer pago o el texto original
  const when = s.created ? fmtD(s.created) + (s.createdTime ? ' · ' + s.createdTime : '')
    : pays[0] && pays[0].date ? fmtD(pays[0].date) : s.date;

  const items = s.items.map(i => `<div class="it"><div class="b">${esc(i.product)}</div>
    <div class="row"><span>${i.qty} × ${usd(i.price)}</span><span>${usd(i.qty * i.price)}</span></div></div>`).join('');

  const payBlock = p => {
    const head = `<div class="sm">${fmtD(p.date)}${p.time ? ' · ' + esc(p.time) : ''} · ${esc(p.method)}</div>`;
    const ref = p.ref ? `<div class="sm">Ref: ${esc(p.ref)}</div>` : '';
    if (p.bs > 0 && p.rate > 0) // pagó en bolívares: se muestra en Bs, con su equivalente en $ y la tasa de ese día
      return `<div class="it">${head}<div class="row b"><span>Bs ${fmtBs(p.bs)}</span><span>(${usd(p.amt)})</span></div>
        <div class="sm">Tasa oficial del día: ${fmtRate(p.rate)} Bs/$</div>${ref}</div>`;
    return `<div class="it">${head}<div class="row b"><span>Pagado en $</span><span>${usd(p.amt)}</span></div>${ref}</div>`;
  };
  const pagos = pays.map(payBlock).join('')
    + (noDetail > 0.004 ? `<div class="it"><div class="sm">Cobro registrado · ${esc(s.method)}</div><div class="row b"><span>Pagado en $</span><span>${usd(noDetail)}</span></div></div>` : '');

  return `<!doctype html><html><head><meta charset="utf-8"><title>Factura ${esc(s.id)}</title><style>
  @page{margin:4mm}
  *{box-sizing:border-box}
  body{margin:0;width:${INV_WIDTH_MM}mm;font-family:Arial,Helvetica,sans-serif;font-size:7.5pt;color:#000;line-height:1.3}
  .c{text-align:center}.b{font-weight:700}.sm{font-size:6.5pt;color:#333}
  .logo{display:block;margin:0 auto 1.5mm;max-width:30mm;max-height:12mm}
  .name{font-size:10pt;font-weight:700;letter-spacing:.3px}
  hr{border:0;border-top:1px dashed #000;margin:2mm 0}
  .row{display:flex;justify-content:space-between;gap:2mm}
  .it{margin-bottom:1.4mm}
  .h{font-weight:700;font-size:7pt;letter-spacing:.6px;margin-bottom:1mm}
  .tot{font-size:9pt;font-weight:700}
  .due{border:1px solid #000;padding:1.2mm;margin-top:1.5mm}
  </style></head><body>
  ${logo ? `<img class="logo" src="${logo}">` : ''}
  <div class="c"><div class="name">${esc(inv.name || 'Tienda')}</div>
    ${inv.addr ? `<div class="sm">${esc(inv.addr)}</div>` : ''}${inv.rif ? `<div class="sm">RIF: ${esc(inv.rif)}</div>` : ''}</div>
  <hr>
  <div class="c b" style="font-size:8.5pt">FACTURA N° ${esc(s.id)}</div>
  <div class="row"><span>Fecha:</span><span>${esc(when)}</span></div>
  <div class="row"><span>Cliente:</span><span class="b" style="text-align:right">${esc(s.client)}</span></div>
  <hr>
  <div class="h">PRODUCTOS</div>${items}
  <div class="row tot"><span>TOTAL</span><span>${usd(s.amountUSD)}</span></div>
  <hr>
  <div class="h">PAGOS</div>${pagos || '<div class="sm">Aún sin pagos registrados</div>'}
  <div class="row"><span>Total pagado</span><span class="b">${usd(s.paid)}</span></div>
  ${pend ? `<div class="due"><div class="row tot"><span>SALDO PENDIENTE</span><span>${usd(s.balance)}</span></div>
    ${s.dueDate ? `<div class="sm">Fecha límite de pago: ${fmtD(s.dueDate)}</div>` : ''}</div>`
    : `<div class="c b" style="margin-top:1.5mm">PAGADO TOTAL</div>`}
  <hr>
  <div class="c b">${esc(inv.msg || '¡Gracias por tu compra!')}</div>
  <div class="c sm" style="margin-top:1mm">Comprobante no fiscal</div>
  </body></html>`;
}

function printInvoice(id) {
  const s = sales.find(x => x.id === id); if (!s) return;
  const old = document.getElementById('print-frame'); if (old) old.remove();
  const fr = document.createElement('iframe');
  fr.id = 'print-frame';
  fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(fr);
  const d = fr.contentWindow.document;
  d.open(); d.write(invoiceHTML(s)); d.close();
  const go = () => { fr.contentWindow.focus(); fr.contentWindow.print(); };
  const img = d.querySelector('img');
  if (img && !img.complete) img.onload = img.onerror = () => setTimeout(go, 100); else setTimeout(go, 150);
}
