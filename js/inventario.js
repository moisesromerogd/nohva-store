/* ============================================================
   INVENTARIO: tabla, mosaico, productos y stock
   ============================================================ */


let invView='list';

try{invView=localStorage.getItem('nohva_invview')||'list'}catch(e){}

const stOf=p=>p.stock<=0?['AGOTADO','bad']:p.stock<=LOWSTOCK?['POCO STOCK','warn']:['EN STOCK','ok'];

const chip=(t,k)=>`<span style="background:color-mix(in srgb,var(--${k}) 14%,transparent);color:var(--${k});padding:.15rem .55rem;border-radius:999px;font-size:.65rem;font-weight:700;white-space:nowrap">${t}</span>`;

function sold(p){let u=0,rev=0;sales.forEach(s=>itemsOf(s).forEach(i=>{if(i.product===p.name){u+=+i.qty||1;rev+=i.qty*i.price;}}));const prof=rev-u*p.costUSD;return{u,rev,prof,m:rev>0?prof/rev*100:0};}

function invFiltered(){const t=(q('iv-q').value||'').toLowerCase().trim(),c=q('iv-cat').value,s=q('iv-st').value,f=q('iv-from').value,to=q('iv-to').value;
 return products.filter(p=>(!t||[p.name,p.id,p.category].some(x=>String(x).toLowerCase().includes(t)))&&(!c||p.category===c)&&(!s||stOf(p)[0]===s)&&(!f||p.createdAt>=f)&&(!to||p.createdAt<=to));}

function filterInventoryTable(){renderInventoryTable();}

function clearInvFilters(){['iv-q','iv-cat','iv-st','iv-from','iv-to'].forEach(i=>q(i).value='');renderInventoryTable();}

function renderInventoryTable(){const body=q('inventory-table-body');if(!body)return;
 const cats=[...new Set(products.map(p=>p.category))].sort(),cv=q('iv-cat').value;
 q('iv-cat').innerHTML='<option value="">Todas</option>'+cats.map(c=>`<option ${c===cv?'selected':''}>${esc(c)}</option>`).join('');
 const b=q('inv-count-badge');if(b)b.innerText=products.length;
 const inv=products.reduce((a,p)=>a+p.stock*p.costUSD,0),val=products.reduce((a,p)=>a+p.stock*p.priceUSD,0),units=products.reduce((a,p)=>a+p.stock,0);
 const sd=products.map(sold),prof=sd.reduce((a,x)=>a+x.prof,0),rev=sd.reduce((a,x)=>a+x.rev,0);
 const k=(t,v,s)=>`<div class="card"><span class="lbl">${t}</span><p class="text-xl font-bold" style="color:var(--text)">${v}</p><p class="text-[11px]" style="color:var(--muted)">${s}</p></div>`;
 q('inv-kpis').innerHTML=k('Productos',products.length,`${units} unidades en stock`)+k('Valor al costo',money(inv),'Lo que invertiste en el stock')+k('Valor a precio de venta',money(val),`≈ ${Math.round(val*bcvRate).toLocaleString('es-VE')} Bs`)+k('Ganancia potencial',money(val-inv),'Si vendes todo el stock')+k('Ganancia por ventas',money(prof),rev?`Margen aprox. ${(prof/rev*100).toFixed(0)}% sobre ${money(rev)}`:'Aún sin ventas');
 const list=invFiltered();
 body.innerHTML=list.map(p=>{const[st,kk]=stOf(p),v=sold(p),um=p.priceUSD?(p.priceUSD-p.costUSD)/p.priceUSD*100:0;
  return `<tr><td><img src="${esc(p.img)}" class="w-11 h-11 rounded-lg object-cover" style="background:var(--surface2)" onerror="this.style.visibility='hidden'"></td>
<td class="font-mono text-[11px]" style="color:var(--muted)">${esc(p.id)}</td>
<td><p class="font-semibold" style="color:var(--text)">${esc(p.name)}</p><p class="text-[11px]" style="color:var(--muted)">Ingresó ${esc(p.createdAt)}</p></td>
<td style="color:var(--text2)">${esc(p.category)}</td><td>${money(p.costUSD)}</td>
<td><b style="color:var(--text)">${money(p.priceUSD)}</b><p class="text-[11px]" style="color:var(--ok)">${Math.round(p.priceUSD*bcvRate).toLocaleString('es-VE')} Bs</p></td>
<td><b style="color:var(--text)">${p.stock}</b> uds<div class="mt-1">${chip(st,kk)}</div></td>
<td>${v.u}</td>
<td>${v.u?`<b style="color:var(${v.prof>=0?'--ok':'--bad'})">${money(v.prof)}</b><p class="text-[11px]" style="color:var(--muted)">${v.m.toFixed(0)}% de margen</p>`:`<span style="color:var(--faint)">—</span><p class="text-[11px]" style="color:var(--muted)">Margen unitario ${um.toFixed(0)}%</p>`}</td>
<td class="whitespace-nowrap"><button class="btn2" onclick="openProd('${p.id}')">Editar</button> <button class="btn2" onclick="restockProduct('${p.id}')" title="Reabastecer">+ Stock</button> <button class="btn2" onclick="sendProductToStudio('${p.id}')" title="Diseñar arte"><i class="fa-solid fa-palette"></i></button></td></tr>`;}).join('')||'<tr><td colspan="10" class="text-center" style="color:var(--muted);padding:2rem">No hay productos con esos filtros.</td></tr>';
 q('iv-count').innerText=`${list.length} de ${products.length} productos`;
 renderInvGrid(list);applyInvView();}

/* ---- Vista lista / mosaico ---- */

function setInvView(v){invView=v;try{localStorage.setItem('nohva_invview',v)}catch(e){}applyInvView();}

function applyInvView(){const g=q('inv-grid'),l=q('inv-list-wrap');if(!g||!l)return;const grid=invView==='grid';g.style.display=grid?'':'none';l.style.display=grid?'none':'';
 const bl=q('iv-v-list'),bg=q('iv-v-grid');if(bl)bl.className=grid?'btn2':'btn';if(bg)bg.className=grid?'btn':'btn2';}

function renderInvGrid(list){const g=q('inv-grid');if(!g)return;
 g.innerHTML=list.map(p=>{const[st,kk]=stOf(p),v=sold(p),um=p.priceUSD?(p.priceUSD-p.costUSD)/p.priceUSD*100:0;
  return `<div class="card p-0 overflow-hidden flex flex-col">
<div class="relative" style="aspect-ratio:1/1;background:var(--surface2)"><img src="${esc(p.img)}" alt="" class="w-full h-full object-cover" onerror="this.style.visibility='hidden'"><div class="absolute top-2 left-2">${chip(st,kk)}</div></div>
<div class="p-3 flex-1 flex flex-col gap-1">
<p class="font-semibold text-sm leading-tight" style="color:var(--text)">${esc(p.name)}</p>
<p class="text-[11px]" style="color:var(--muted)"><span class="font-mono">${esc(p.id)}</span> · ${esc(p.category)}</p>
<div class="flex items-baseline justify-between mt-1"><b style="color:var(--text)">${money(p.priceUSD)}</b><span class="text-[11px]" style="color:var(--ok)">${Math.round(p.priceUSD*bcvRate).toLocaleString('es-VE')} Bs</span></div>
<div class="flex justify-between text-[11px]" style="color:var(--muted)"><span>Stock: <b style="color:var(--text)">${p.stock}</b></span><span>Vendidas: ${v.u}</span></div>
<p class="text-[11px]" style="color:var(--muted)">Costo ${money(p.costUSD)} · ${v.u?`Ganancia <b style="color:var(${v.prof>=0?'--ok':'--bad'})">${money(v.prof)}</b>`:`Margen ${um.toFixed(0)}%`}</p>
<div class="flex gap-1 mt-auto pt-2" style="border-top:1px solid var(--line)"><button class="btn2 flex-1" style="padding:.35rem .4rem" onclick="openProd('${p.id}')">Editar</button><button class="btn2" style="padding:.35rem .6rem" onclick="restockProduct('${p.id}')" title="Reabastecer">+ Stock</button><button class="btn2" style="padding:.35rem .6rem" onclick="sendProductToStudio('${p.id}')" title="Diseñar arte"><i class="fa-solid fa-palette"></i></button></div>
</div></div>`;}).join('')||'<p class="col-span-full text-center" style="color:var(--muted);padding:2rem">No hay productos con esos filtros.</p>';}

/* ---- Reabastecer, agregar, editar y eliminar productos ---- */

async function restockProduct(id){const p=products.find(x=>x.id===id);if(!p)return;const n=parseInt(await uiPrompt(`¿Cuántas unidades ingresaron de "${p.name}"?`,'5',{title:'Reabastecer',inputmode:'numeric',ok:'Agregar'}),10);if(n>0){p.stock+=n;refreshAll();renderInventoryTable();}}

let EDIT=null,PF_IMG='';

const nextId=()=>'PROD-'+String(Math.max(0,...products.map(p=>+(String(p.id).match(/(\d+)$/)||[0,0])[1]))+1).padStart(2,'0');

function openProd(id){EDIT=id||null;const p=id?products.find(x=>x.id===id):null;
 q('pf-title').innerText=p?'Editar producto':'Agregar producto';
 q('pf-cats').innerHTML=[...new Set(products.map(x=>x.category))].map(c=>`<option value="${esc(c)}">`).join('');
 q('pf-id').value=p?p.id:nextId();q('pf-id').disabled=!!p;q('pf-name').value=p?p.name:'';q('pf-cat').value=p?p.category:'';
 q('pf-cost').value=p?p.costUSD:'';q('pf-price').value=p?p.priceUSD:'';q('pf-stock').value=p?p.stock:'';q('pf-date').value=p?p.createdAt:todayS();
 PF_IMG=p?p.img:'';q('pf-url').value=PF_IMG.startsWith('data:')?'':PF_IMG;q('pf-del').classList.toggle('hidden',!p);pfPrev();
 const m=q('modal-prod');m.classList.remove('hidden');m.classList.add('flex');}

function closeProd(){const m=q('modal-prod');m.classList.add('hidden');m.classList.remove('flex');}

function pfUrl(){PF_IMG=q('pf-url').value.trim();pfPrev();}

function pfPrev(){const i=q('pf-img');i.src=PF_IMG||'data:,';const c=+q('pf-cost').value,p=+q('pf-price').value,e=q('pf-calc');
 if(p>0){const u=p-c;e.innerText=`Ganancia por unidad: ${money(u)} (${(u/p*100).toFixed(0)}%) · Precio en Bs: ${Math.round(p*bcvRate).toLocaleString('es-VE')}`;e.style.color=u<0?'var(--bad)':'var(--muted)';}else e.innerText='';}

function pfFile(e){const f=e.target.files[0];if(!f)return;loadImg(f,im=>{const k=Math.min(1,480/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement('canvas');c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);PF_IMG=c.toDataURL('image/jpeg',.78);q('pf-url').value='';pfPrev();});}

async function saveProd(e){e.preventDefault();const id=q('pf-id').value.trim(),name=q('pf-name').value.trim();
 if(!EDIT&&products.some(p=>p.id===id))return alert('Ya existe un producto con ese ID.');
 const o={id,name,category:q('pf-cat').value.trim(),costUSD:+q('pf-cost').value,priceUSD:+q('pf-price').value,stock:parseInt(q('pf-stock').value,10)||0,img:PF_IMG,createdAt:q('pf-date').value||todayS()};
 if(o.priceUSD<o.costUSD&&!(await uiConfirm('El precio de venta es menor que el costo.\n¿Guardar de todas formas?',{title:'Precio menor al costo',ok:'Guardar igual'})))return;
 if(EDIT){const p=products.find(x=>x.id===EDIT);if(p.name!==o.name){sales.forEach(s=>{itemsOf(s).forEach(i=>{if(i.product===p.name)i.product=o.name});normalizeSale(s);});posts.forEach(s=>{if(s.prod===p.name)s.prod=o.name});}Object.assign(p,o);}else products.unshift(o);
 closeProd();populateProductSelects();refreshAll();renderInventoryTable();}

async function delProd(){const p=products.find(x=>x.id===EDIT);if(!p)return;const v=sold(p).u;if(!(await uiConfirm(`Se eliminará "${p.name}".`+(v?`\nSus ${v} ventas se conservan en el historial.`:''),{title:'¿Eliminar producto?',ok:'Sí, eliminar',danger:true})))return;products.splice(products.indexOf(p),1);closeProd();populateProductSelects();refreshAll();renderInventoryTable();}

function populateProductSelects() {
  const designSelect = document.getElementById('design-prod-select');
  designSelect.innerHTML = '<option value="">-- Seleccionar Producto --</option>' +
    products.map(p => `<option value="${p.id}">${p.name} ($${p.priceUSD})</option>`).join('');
  if (saleLines.length) renderSaleLines();
  fillSelects();
}

function fillSelects(){['ad-prod','sch-prod','in-prod','pub-prod','ad2-prod'].forEach(id=>{const s=q(id);if(!s)return;const v=s.value;s.innerHTML=products.map(p=>`<option>${p.name}</option>`).join('');if(v)s.value=v;});}
