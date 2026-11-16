/* ============================================================
   DATOS: estado de la plataforma, guardado, tasa BCV y respaldo
   Se carga primero. Todo lo demás usa lo que se define aquí.
   ============================================================ */


let bcvRate = 36.50;

let products = [
  { id: 'PROD-01', name: 'Reloj Inteligente Pro Max', category: 'Tecnología', costUSD: 18.00, priceUSD: 35.00, stock: 8, img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80' },
  { id: 'PROD-02', name: 'Audífonos Bluetooth Wireless', category: 'Tecnología', costUSD: 10.00, priceUSD: 22.50, stock: 15, img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80' },
  { id: 'PROD-03', name: 'Zapatillas Urban Sneakers', category: 'Calzado', costUSD: 22.00, priceUSD: 45.00, stock: 2, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80' },
  { id: 'PROD-04', name: 'Powerbank 20.000 mAh Carga Rápida', category: 'Accesorios', costUSD: 9.00, priceUSD: 18.00, stock: 1, img: 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=500&auto=format&fit=crop&q=80' }
];

let sales = [
  { id: 'VEN-1001', client: 'María Rodríguez', product: 'Reloj Inteligente Pro Max', qty: 1, method: 'Pago Móvil', amountUSD: 35.00, channel: 'Instagram', date: 'Hoy, 10:15 AM', status: 'Concretado' },
  { id: 'VEN-1002', client: 'José Luis Torrealba', product: 'Zapatillas Urban Sneakers', qty: 1, method: 'Divisas $', amountUSD: 45.00, channel: 'FB Marketplace', date: 'Hoy, 11:30 AM', status: 'Concretado' },
  { id: 'VEN-1003', client: 'Ana Gabriela Gómez', product: 'Audífonos Bluetooth Wireless', qty: 1, method: 'USDT', amountUSD: 22.50, channel: 'WhatsApp', date: 'Ayer', status: 'Concretado' }
];

let activeAds = [
  { id: 'AD-01', name: 'Campaña Reloj Pro Max - Retargeting', budget: '$5.00 /día', clicks: 340, salesCount: 12, status: 'Activa' },
  { id: 'AD-02', name: 'Promo Audífonos Wireless', budget: '$4.00 /día', clicks: 215, salesCount: 8, status: 'Activa' },
  { id: 'AD-03', name: 'Oferta Calzado Deportivo', budget: '$6.00 /día', clicks: 480, salesCount: 15, status: 'Activa' }
];

const q=i=>document.getElementById(i);

const K='nohva_v2';

let posts=[],expenses=[],cfg={footer:'📍 El Tigre · Envíos a todo el país · Pago Móvil, divisas y USDT',wa:''};

const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

const money=n=>'$'+(+n||0).toFixed(2);

const prod=n=>products.find(p=>p.name===n)||{};

/* ---- Utilidades de ventas (montos, fechas, saldo) ---- */

const round2 = n => Math.round((+n || 0) * 100) / 100;

const isoLocal = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

const fmtD = iso => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };

const DUE_LABELS = { q1: '1 quincena', q2: '2 quincenas', eom: 'Fin de mes', custom: 'Fecha específica' };

function dueFrom(choice, custom) {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  if (choice === 'q1') return isoLocal(new Date(t.getFullYear(), t.getMonth(), t.getDate() + 15));
  if (choice === 'q2') return isoLocal(new Date(t.getFullYear(), t.getMonth(), t.getDate() + 30));
  if (choice === 'eom') return isoLocal(new Date(t.getFullYear(), t.getMonth() + 1, 0));
  return custom || '';
}

function normalizeSale(s) {
  if (!Array.isArray(s.items) || !s.items.length) {
    const n = +s.qty || 1;
    s.items = [{ product: s.product, qty: n, price: round2((+s.amountUSD || 0) / n) }];
  }
  s.items.forEach(i => { i.qty = +i.qty || 1; i.price = +i.price || 0; });
  s.amountUSD = round2(s.items.reduce((a, i) => a + i.qty * i.price, 0));
  s.product = s.items.map(i => i.product).join(' + ');
  s.qty = s.items.reduce((a, i) => a + i.qty, 0);
  if (typeof s.paid !== 'number' || isNaN(s.paid)) s.paid = s.amountUSD;
  s.paid = round2(Math.min(Math.max(s.paid, 0), s.amountUSD));
  s.payments = s.payments || [];
  s.balance = round2(s.amountUSD - s.paid);
  s.status = s.balance > 0.004 ? 'Pendiente' : 'Concretado';
  if (s.balance <= 0.004) { s.dueDate = ''; s.dueLabel = ''; }
  return s;
}

function itemsOf(s) { if (!s.items || !s.items.length) normalizeSale(s); return s.items; }

const isOverdue = s => s.balance > 0.004 && s.dueDate && s.dueDate < isoLocal(new Date());

/* ---- Carga y guardado (localStorage) ---- */

try{const d=JSON.parse(localStorage.getItem(K)||'null');if(d){products=d.products||products;sales=d.sales||sales;activeAds=d.ads||activeAds;bcvRate=d.bcv||bcvRate;posts=d.posts||[];expenses=d.expenses||[];cfg=Object.assign(cfg,d.cfg||{});}}catch(e){}

sales.forEach(normalizeSale);

function save(){try{localStorage.setItem(K,JSON.stringify({products,sales,ads:activeAds,bcv:bcvRate,posts,expenses,cfg}))}catch(e){}}

setInterval(save,1500);

const LOWSTOCK=2,todayS=()=>new Date().toISOString().slice(0,10);

products.forEach(p=>{if(!p.createdAt)p.createdAt=todayS();});

Object.assign(cfg,{aiUrl:cfg.aiUrl||'',aiKey:cfg.aiKey||'',contacts:cfg.contacts||'',autoSend:!!cfg.autoSend});

cfg.inv=Object.assign({name:'Tienda Nohva',addr:'El Tigre, Anzoátegui',rif:'',msg:'¡Gracias por tu compra!'},cfg.inv||{});

cfg.provider=cfg.provider||'gemini';

cfg.provs=cfg.provs||null;
// Remove legacy provider endpoint/key from browser storage; credentials now live only in Supabase Secrets.
delete cfg.aiUrl; delete cfg.aiKey; save();

/* ---- Tasa BCV ---- */

let bcvManual=false,bcvInfo='';

try{const b=JSON.parse(localStorage.getItem('nohva_bcv')||'null');if(b&&b.rate>0){bcvRate=b.rate;bcvManual=!!b.manual;bcvInfo=b.info||'';}else bcvInfo='Tasa de ejemplo: conectando con el BCV…';}catch(e){}

function applyRate(){q('current-bcv-display').innerText=`1 USD = ${bcvRate.toFixed(2)} Bs`;q('bcv-status').innerText=bcvInfo;try{localStorage.setItem('nohva_bcv',JSON.stringify({rate:bcvRate,manual:bcvManual,info:bcvInfo}))}catch(e){}updateKpis();refreshAll();renderInventoryTable();updateDesignPreview();renderPub();}

async function fetchBCV(force){if(bcvManual&&!force)return;if(force)bcvManual=false;q('bcv-status').innerText='Actualizando…';
 try{const r=await fetch('https://ve.dolarapi.com/v1/dolares/oficial',{cache:'no-store'});if(!r.ok)throw new Error(r.status);const d=await r.json(),v=+(d.promedio??d.venta??d.compra);if(!(v>0))throw new Error('dato');
  const f=d.fechaActualizacion?new Date(d.fechaActualizacion):new Date();bcvRate=v;bcvInfo='BCV oficial · '+f.toLocaleString('es-VE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}
 catch(e){if(!localStorage.getItem('nohva_bcv'))bcvInfo='Sin conexión con el BCV: tasa de ejemplo, actualízala';else bcvInfo='Sin conexión. Usando la última tasa guardada';}
 applyRate();}

async function promptChangeBCV(){const n=await uiPrompt('Escribe la tasa manual (Bs por USD). Déjala vacía para volver a la automática.',String(bcvRate),{title:'Tasa del dólar',inputmode:'decimal',ok:'Guardar'});if(n===null)return;if(n.trim()==='')return fetchBCV(true);const v=parseFloat(n.replace(',','.'));if(v>0){bcvRate=v;bcvManual=true;bcvInfo='Tasa manual';applyRate();}}

setInterval(()=>fetchBCV(false),30*60*1000);

/* ---- Ajustes y respaldo ---- */

function saveCfg(){cfg.footer=q('cfg-footer').value;cfg.wa=q('cfg-wa').value.replace(/\D/g,'');cfg.inv={name:q('cfg-inv-name').value.trim(),addr:q('cfg-inv-addr').value.trim(),rif:q('cfg-inv-rif').value.trim(),msg:q('cfg-inv-msg').value.trim()};save();alert('Ajustes guardados');}

function exportData(){save();const d=JSON.parse(localStorage.getItem(K));if(d.cfg)delete d.cfg.aiKey;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(d)],{type:'application/json'}));a.download='respaldo-nohva-'+new Date().toISOString().slice(0,10)+'.json';a.click();}

function importData(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{JSON.parse(r.result);localStorage.setItem(K,r.result);location.reload();}catch(x){alert('El archivo no es un respaldo válido');}};r.readAsText(f);}
