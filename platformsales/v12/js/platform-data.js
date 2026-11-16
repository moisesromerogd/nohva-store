/**
 * Nohva Platform — secure data access layer (first iteration).
 *
 * Sales and payments are written only through database RPCs so the sale,
 * its line items and its first payment commit atomically. The database derives
 * seller/recorder identity from auth.uid(); the browser never supplies it.
 *
 * This module intentionally does not read legacy localStorage data and does
 * not expose inventory costs, expenses or profit data to employee sessions.
 */
(function () {
  'use strict';

  function client() {
    if (!window.nohvaSupabase) throw new Error('La conexión segura aún no está inicializada.');
    return window.nohvaSupabase;
  }

  function requireSession() {
    const profile = window.nohvaGetProfile && window.nohvaGetProfile();
    if (!profile || !profile.active) {
      throw new Error('Tu sesión no está autorizada. Inicia sesión nuevamente.');
    }
  }

  async function unwrap(request) {
    const { data, error } = await request;
    if (error) throw new Error(error.message || 'No se pudo completar la operación.');
    return data;
  }

  async function listSales({ from, to, limit = 100 } = {}) {
    requireSession();
    let query = client()
      .from('platform_sales')
      .select('id, sale_number, seller_id, client_name, client_phone, channel, sale_date, due_date, total_usd, notes, created_at, platform_sale_items(id, product_id, product_name, quantity, unit_price_usd), platform_payments(id, recorded_by, amount_usd, payment_method, amount_bs, exchange_rate, reference, paid_at)')
      .order('sale_date', { ascending: false })
      .limit(Math.min(Math.max(Number(limit) || 100, 1), 250));

    if (from) query = query.gte('sale_date', from);
    if (to) query = query.lt('sale_date', to);
    // RLS automatically restricts employees to their own sales.
    return unwrap(query);
  }

  async function createSale(sale) {
    requireSession();
    if (!sale || !Array.isArray(sale.items) || !sale.items.length) {
      throw new Error('Agrega al menos un producto a la venta.');
    }

    const items = sale.items.map(item => ({
      product_id: item.productId || null,
      product_name: String(item.productName || '').trim(),
      quantity: Number(item.quantity),
      unit_price_usd: Number(item.unitPriceUsd)
    }));

    const invalid = items.some(item =>
      !item.product_name ||
      !Number.isInteger(item.quantity) || item.quantity < 1 ||
      !Number.isFinite(item.unit_price_usd) || item.unit_price_usd < 0
    );
    if (invalid) throw new Error('Revisa los productos, cantidades y precios.');

    const payment = sale.initialPayment ? {
      amount_usd: Number(sale.initialPayment.amountUsd),
      payment_method: String(sale.initialPayment.method || '').trim(),
      amount_bs: sale.initialPayment.amountBs == null ? null : Number(sale.initialPayment.amountBs),
      exchange_rate: sale.initialPayment.exchangeRate == null ? null : Number(sale.initialPayment.exchangeRate),
      reference: sale.initialPayment.reference || null
    } : null;

    return unwrap(client().rpc('platform_create_sale', {
      p_client_name: sale.clientName || null,
      p_client_phone: sale.clientPhone || null,
      p_channel: sale.channel || null,
      p_due_date: sale.dueDate || null,
      p_notes: sale.notes || null,
      p_items: items,
      p_initial_payment: payment
    }));
  }

  async function addPayment(payment) {
    requireSession();
    if (!payment || !payment.saleId) throw new Error('No se indicó la venta.');
    return unwrap(client().rpc('platform_add_payment', {
      p_sale_id: payment.saleId,
      p_amount_usd: Number(payment.amountUsd),
      p_payment_method: String(payment.method || '').trim(),
      p_amount_bs: payment.amountBs == null ? null : Number(payment.amountBs),
      p_exchange_rate: payment.exchangeRate == null ? null : Number(payment.exchangeRate),
      p_reference: payment.reference || null
    }));
  }

  async function listProfiles() {
    requireSession();
    if (!window.nohvaIsOwner()) throw new Error('Solo los propietarios pueden administrar usuarios.');
    return unwrap(client()
      .from('platform_profiles')
      .select('user_id, display_name, role, active, created_at')
      .order('created_at', { ascending: true }));
  }

  window.NohvaData = Object.freeze({
    listSales,
    createSale,
    addPayment,
    listProfiles
  });
})();
