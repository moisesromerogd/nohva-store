/* ============================================================
   MARKETING: anuncios, programación e inbox
   ============================================================ */


const QR=['Gracias por escribirnos, en un momento te atiendo.','Tu pedido ya está listo, ¿coordinamos la entrega?','¡Gracias por tu compra! Si te gustó, nos ayudas mucho con una reseña.','Te escribo para saber si sigues interesado, aún tenemos unidades.'];

function copyEl(id){navigator.clipboard.writeText(q(id).innerText);}

/* ---- Anuncios ---- */

function optimizeAd(){const p=prod(q('ad-prod').value),b=+q('ad-budget').value||5,d=+q('ad-days').value||7;
const margin=p.priceUSD?((p.priceUSD-p.costUSD)/p.priceUSD*100).toFixed(0):'?';
const reach=Math.round(b*d*(q('ad-plat').value==='TikTok'?420:300));
const warn=p.stock<=2?`⚠️ Solo quedan ${p.stock} unidades: conviene reponer antes de invertir.\n\n`:'';
q('ad-plan').classList.remove('hidden');
q('ad-plan').innerText=`${warn}Producto: ${p.name} (margen ${margin}%)\nObjetivo: ${q('ad-goal').value} en ${q('ad-plat').value}\nPúblico: ${q('ad-age').value} años, ${q('ad-loc').value} y 30 km a la redonda, intereses afines a ${p.category||'la categoría'}\nPresupuesto: ${money(b)}/día x ${d} días = ${money(b*d)}. Tras 48 h, mover 70% al anuncio con más clics.\nHorarios sugeridos: 12:00-14:00 y 19:00-22:00\nCosto máximo por venta para no perder: ${money(p.priceUSD-p.costUSD)}\nAlcance estimado: ~${reach.toLocaleString()} personas (estimación)\nTexto: ¡${p.name} disponible! ${money(p.priceUSD)}. Escríbenos y te lo apartamos hoy.`;}

function scheduleAd(){const b=+q('ad-budget').value||5;activeAds.unshift({id:'AD-'+String(Date.now()).slice(-4),name:`${q('ad-prod').value} · ${q('ad-plat').value}`,budget:`$${b.toFixed(2)} /día`,clicks:0,salesCount:0,status:q('ad-start').value?'Programada':'Activa',start:q('ad-start').value});renderAds();}

function toggleAd(i){const a=activeAds[i];a.status=a.status==='Pausada'?'Activa':'Pausada';renderAds();}

function renderAds(){const c=q('ads-list'),d=q('dash-ads-preview');
c.innerHTML=activeAds.map((a,i)=>`<div class="card space-y-2"><div class="flex justify-between text-xs"><b class="text-indigo-400">${a.id}</b><span class="text-amber-300">${a.status}</span></div><h4 class="text-sm font-semibold text-white">${a.name}</h4><p class="text-[11px] text-slate-400">${a.budget}${a.start?' · inicia '+a.start.replace('T',' '):''}</p><p class="text-xs text-slate-300">${a.clicks} clics, ${a.salesCount} ventas</p><div class="flex gap-2"><button class="btn2" onclick="toggleAd(${i})">${a.status==='Pausada'?'Reanudar':'Pausar'}</button><button class="btn2" onclick="activeAds.splice(${i},1);renderAds()">Eliminar</button></div></div>`).join('')||'<p class="text-sm text-slate-500">Aún no hay campañas. Crea la primera arriba.</p>';
if(d)d.innerHTML=activeAds.map(a=>`<div class="flex justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800"><p class="text-xs text-slate-200">${a.name}</p><span class="text-xs font-bold text-emerald-400">${a.salesCount} ventas</span></div>`).join('');}

/* ---- Programación de publicaciones ---- */

function addPost(){if(!q('sch-date').value)return alert('Elige fecha y hora');posts.push({prod:q('sch-prod').value,net:q('sch-net').value,date:q('sch-date').value,text:q('sch-text').value,done:false});q('sch-text').value='';renderWeeklySchedule();}

function renderWeeklySchedule(){const l=q('post-list');if(!l)return;
l.innerHTML=posts.map((p,i)=>({p,i})).sort((x,y)=>x.p.date.localeCompare(y.p.date)).map(({p,i})=>`<div class="card flex flex-wrap items-center justify-between gap-2 ${p.done?'opacity-50':''}"><div class="min-w-0"><p class="text-xs text-indigo-300 font-semibold">${p.date.replace('T',' ')} · ${p.net}</p><p class="text-sm text-white">${p.prod}</p><p class="text-xs text-slate-400 truncate">${p.text||''}</p></div><div class="flex gap-2"><button class="btn2" onclick="posts[${i}].done=!posts[${i}].done;renderWeeklySchedule()">${p.done?'Reabrir':'Marcar publicada'}</button><button class="btn2" onclick="posts.splice(${i},1);renderWeeklySchedule()">Eliminar</button></div></div>`).join('')||'<p class="text-sm text-slate-500">No hay publicaciones programadas.</p>';}

/* ---- Inbox: respuestas sugeridas ---- */

function suggestReply(){const m=q('in-msg').value.toLowerCase(),p=prod(q('in-prod').value),n=q('in-name').value.trim(),h=n?`¡Hola ${n}! 😊`:'¡Hola! 😊';
const price=`${money(p.priceUSD)} (≈ ${(p.priceUSD*bcvRate).toFixed(0)} Bs a tasa BCV del día)`;let r;
if(/precio|cu[aá]nto|costo|vale/.test(m))r=`${h} El ${p.name} está en ${price}.${p.stock?` Nos quedan ${p.stock} disponibles.`:''}`;
else if(/disponible|queda|hay |stock|color|talla/.test(m))r=`${h} ${p.stock>0?`Sí, tenemos el ${p.name} disponible (${p.stock} en stock).`:`Por ahora el ${p.name} está agotado, pero te aviso apenas llegue.`}`;
else if(/pago|m[oó]vil|zelle|usdt|divisa|tasa|transfer/.test(m))r=`${h} Aceptamos Pago Móvil (a tasa BCV del día), divisas y USDT.`;
else if(/env[ií]o|delivery|entrega|d[oó]nde/.test(m))r=`${h} Hacemos entrega personal en El Tigre y envíos a todo el país.`;
else r=`${h} Gracias por escribirnos. Cuéntame qué buscas y te ayudo con gusto. Tenemos el ${p.name} a ${price}.`;
if(p.stock>0)r+=`\n\n¿Te lo aparto ahora? Dime tu nombre y cómo prefieres pagar y lo dejamos listo hoy mismo 🙌`;q('in-reply').innerText=r;}

function openWA(){window.open('https://wa.me/'+(cfg.wa||'')+'?text='+encodeURIComponent(q('in-reply').innerText),'_blank');}
