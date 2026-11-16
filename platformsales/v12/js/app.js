/* ============================================================
   APP: navegación entre pestañas, tema claro/oscuro y arranque
   Se carga al final.
   ============================================================ */

const TAB_TITLES = {
  dashboard: ['Dashboard Principal', 'Resumen ejecutivo y control en tiempo real'],
  sales:     ['Registro de Ventas Detallado', 'Historial completo de transacciones multimoneda'],
  inventory: ['Inventario', 'Productos, stock y ganancia estimada'],
  design:    ['Estudio de diseño', 'Artes para redes con tu línea gráfica'],
  copies:    ['Publicaciones', 'Textos y vista previa en tiempo real'],
  ads:       ['Anuncios con IA', 'Campañas optimizadas y programadas'],
  schedule:  ['Programación', 'Calendario de publicaciones'],
  inbox:     ['Inbox y respuestas', 'Respuestas humanas que cierran ventas'],
  clients:   ['Clientes', 'Historial y seguimiento'],
  finance:   ['Gastos y ganancia', 'Tu ganancia real'],
  settings:  ['Ajustes y respaldo', 'Footer fijo y copias de seguridad'],
  aidesign:  ['Diseñador con IA', 'Conversa con la IA y obtén tu arte'],
  assistant: ['Asistente IA', 'Pregunta, calcula y envía reportes']
};

function switchTab(tabId) {
  // Mostrar solo la pestaña elegida y marcar su botón del menú
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('bg-indigo-600/20', 'border', 'border-indigo-500/30', 'text-white');
    btn.classList.add('text-slate-400');
  });
  const targetTab = document.getElementById('tab-' + tabId);
  if (targetTab) targetTab.classList.remove('hidden');
  const targetNav = document.getElementById('nav-' + tabId);
  if (targetNav) {
    targetNav.classList.add('bg-indigo-600/20', 'border', 'border-indigo-500/30', 'text-white');
    targetNav.classList.remove('text-slate-400');
  }

  // Título de la barra superior
  const T = TAB_TITLES[tabId];
  if (T) {
    q('current-tab-title').innerText = T[0];
    q('current-tab-subtitle').innerText = T[1];
  }

  // Lo que cada pestaña necesita pintar al abrirse
  if (tabId === 'clients') renderClients();
  if (tabId === 'finance') renderFinance();
  if (tabId === 'design') drawMain();
  if (tabId === 'copies') renderPub();
  if (tabId === 'inventory') renderInventoryTable();
  if (tabId === 'aidesign') {
    renderRefs();
    if (!q('ad2-chat').children.length) aiDesignReset();
    if (!q('ad2-name').value && q('ad2-prod').value) aiProdChange();
  }
  if (tabId === 'assistant' && !q('as-chat').children.length) asReset();
  if (tabId === 'settings') {
    q('ai-contacts').value = cfg.contacts; q('ai-auto').checked = cfg.autoSend;
  }

  // En el celular, cerrar el menú lateral y subir al inicio
  document.getElementById('side').classList.remove('open');
  window.scrollTo(0, 0);
}

function toggleTheme() {
  const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('nohva_theme', t) } catch (e) {}
  themeIcon();
}
function themeIcon() {
  const i = document.querySelector('#theme-btn i');
  if (i) i.className = 'fa-solid ' + (document.documentElement.dataset.theme === 'dark' ? 'fa-sun' : 'fa-moon');
}

/* Arranque de la plataforma (se ejecuta una sola vez al cargar la página) */
function init() {
  // 1. Pintar inventario, ventas, dashboard, anuncios y programación
  renderInventoryTable();
  renderSalesTable();
  renderDashboardSummaryBlocks();
  renderAds();
  renderWeeklySchedule();
  populateProductSelects();
  updateDesignPreview();

  // 2. Ajustes, respuestas rápidas y refresco general
  q('current-bcv-display').innerText = `1 USD = ${bcvRate.toFixed(2)} Bs`;
  q('cfg-footer').value = cfg.footer;
  q('cfg-wa').value = cfg.wa;
  q('cfg-inv-name').value = cfg.inv.name; q('cfg-inv-addr').value = cfg.inv.addr; q('cfg-inv-rif').value = cfg.inv.rif; q('cfg-inv-msg').value = cfg.inv.msg;
  q('quick').innerHTML = QR.map(t => `<button class="btn2 text-left" onclick="navigator.clipboard.writeText(this.innerText)">${t}</button>`).join('');
  refreshAll();

  // 3. Estudio de diseño y publicaciones
  buildStudio(); buildPub(); renderGal();
  const p = products[0];
  if (p) { sendProductToStudio(p.id); q('pub-prod').value = p.name; pubFromProduct(); }
  switchTab('dashboard');

  // 4. Icono del tema
  themeIcon();

  // 5. Logo de marca y tasa BCV
  const bl = q('brand-logo');
  if (bl) { const im = new Image(); im.onload = () => { im._mono = true; LOGO = im; drawMain(); }; im.src = bl.src; }
  applyRate();
  renderInventoryTable();
  fetchBCV(false);

  // 6. Asistente de IA
  q('as-chips').innerHTML = ['Resumen de ventas y ganancia','¿Qué productos debo reabastecer?','Calcula cuánto gano si vendo todo el stock','Mis mejores clientes','Envía a Shannon un reporte del inventario con poco stock'].map(c => `<button class="btn2" onclick="asSend(this.innerText)">${c}</button>`).join('');
  renderRefs(); renderProvs();
  switchTab('dashboard');
}
window.onload = async function(){
  try {
    const auth = await window.nohvaRequireSession();
    if (!auth) return;
    // The legacy v12 business modules still use browser localStorage.
    // Until role-filtered Supabase data is fully integrated, employees must not enter this UI.
    if (auth.profile.role !== 'owner') {
      document.body.innerHTML = '<main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#0f172a;color:#fff;font-family:Inter,Arial,sans-serif"><section style="max-width:520px;text-align:center"><h1 style="font-size:24px;font-weight:700;margin-bottom:12px">Acceso de empleado en preparación</h1><p style="color:#cbd5e1;line-height:1.6">Estamos terminando la conexión segura de ventas, inventario y abonos por usuario. Por seguridad, esta versión anterior todavía no habilita el acceso de empleados.</p><p style="color:#94a3b8;margin-top:12px">Contacta a un propietario para más información.</p><button onclick="window.nohvaSupabase.auth.signOut().then(()=>location.replace(\'../login.html\'))" style="margin-top:20px;padding:10px 16px;border-radius:8px;background:#4f46e5;color:white">Cerrar sesión</button></section></main>';
      return;
    }
    await window.NohvaAI.refreshStatus().then(providers=>{cfg.provs=providers;}).catch(()=>{});
    init();
  } catch (error) {
    console.error('No se pudo iniciar Nohva Platform:', error);
    alert('No se pudo validar tu sesión. Inicia sesión nuevamente.');
  }
};
