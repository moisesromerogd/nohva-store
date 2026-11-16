/* ============================================================
   DASHBOARD: indicadores, resumen, alerta de stock y refresco general
   ============================================================ */


function updateKpis() {
  const totalUSD = sales.reduce((acc, s) => acc + s.amountUSD, 0);
  const totalBs = totalUSD * bcvRate;
  document.getElementById('kpi-usd').innerText = `$${totalUSD.toFixed(2)}`;
  document.getElementById('kpi-bs').innerText = `${totalBs.toFixed(2)} Bs`;
  document.getElementById('kpi-orders').innerText = `${sales.length} Pedidos`;
  document.getElementById('sales-count-badge').innerText = sales.length;
}

function renderDashboardSummaryBlocks() {
  // Recent Sales Block
  const recentSalesContainer = document.getElementById('dash-recent-sales');
  recentSalesContainer.innerHTML = '';
  sales.slice(0, 3).forEach(s => {
    recentSalesContainer.innerHTML += `
      <div class="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
            ${s.client.charAt(0)}
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-200">${s.client}</p>
            <p class="text-[10px] text-slate-400">${s.product} (${s.channel || 'Instagram'})</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-xs font-bold text-white">$${s.amountUSD.toFixed(2)}</p>
          <p class="text-[10px] text-emerald-400 font-medium">${s.method}</p>
        </div>
      </div>
    `;
  });

  // Scheduled Posts Preview Block
  const scheduleContainer = document.getElementById('dash-schedule-preview');
  scheduleContainer.innerHTML = `
    <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
      <div class="flex items-center space-x-2.5">
        <span class="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 font-bold uppercase">Reels</span>
        <span class="text-xs text-slate-200 font-medium">Lanzamiento Reloj Pro Max</span>
      </div>
      <span class="text-[10px] text-slate-400">Hoy, 6:00 PM</span>
    </div>
    <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
      <div class="flex items-center space-x-2.5">
        <span class="px-1.5 py-0.5 rounded text-[9px] bg-blue-500/20 text-blue-300 font-bold uppercase">FB Post</span>
        <span class="text-xs text-slate-200 font-medium">Promo Audífonos Wireless</span>
      </div>
      <span class="text-[10px] text-slate-400">Mañana, 11:00 AM</span>
    </div>
  `;

  // Low Inventory Alerts Block
  const inventoryAlertsContainer = document.getElementById('dash-inventory-alerts');
  inventoryAlertsContainer.innerHTML = '';
  const lowStockProds = products.filter(p => p.stock <= 2);
  
  if(lowStockProds.length === 0) {
    inventoryAlertsContainer.innerHTML = `<p class="text-xs text-slate-500">Todo el inventario está en niveles óptimos.</p>`;
  } else {
    lowStockProds.forEach(p => {
      inventoryAlertsContainer.innerHTML += `
        <div class="flex items-center justify-between p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/30">
          <div class="flex items-center space-x-2.5">
            <i class="fa-solid fa-triangle-exclamation text-rose-400 text-xs"></i>
            <span class="text-xs text-slate-200 font-semibold">${p.name}</span>
          </div>
          <span class="text-xs font-bold text-rose-300">${p.stock} disponibles</span>
        </div>
      `;
    });
  }
}

function stockAlert(){let b=q('stock-alert');if(!b){q('tab-dashboard').insertAdjacentHTML('afterbegin','<div id="stock-alert"></div>');b=q('stock-alert');}
const low=products.filter(p=>p.stock<=2);b.innerHTML=low.length?`<div class="card text-sm text-amber-200"><i class="fa-solid fa-triangle-exclamation mr-2"></i>Stock bajo: ${low.map(p=>`${p.name} (${p.stock})`).join(', ')}</div>`:'';}

function refreshAll(){renderSalesTable();renderDashboardSummaryBlocks();renderClients();renderFinance();stockAlert();renderAds();renderWeeklySchedule();}
