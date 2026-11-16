/* ============================================================
   CLIENTES Y FINANZAS
   ============================================================ */


function renderClients(){const m={};sales.forEach(s=>{const c=m[s.client]=m[s.client]||{n:0,t:0,d:''};c.n++;c.t+=s.amountUSD;c.d=s.date;});
q('clients-body').innerHTML=Object.entries(m).sort((a,b)=>b[1].t-a[1].t).map(([k,c])=>`<tr class="border-t border-slate-800 text-slate-200"><td class="p-2 font-semibold">${k}</td><td>${c.n}</td><td>${money(c.t)}</td><td class="text-xs text-slate-400">${c.d}</td><td>${c.n>1?'Frecuente':'Nuevo'}</td><td><button class="btn2" onclick="followUp(this.dataset.n)" data-n="${k}">Copiar seguimiento</button></td></tr>`).join('');}

function followUp(n){navigator.clipboard.writeText(`Hola ${n.split(' ')[0]}, ¿cómo te fue con tu compra? Si necesitas algo más, escríbenos 😊`);}

function renderFinance(){const rev=sales.reduce((a,s)=>a+s.amountUSD,0),cogs=sales.reduce((a,s)=>a+itemsOf(s).reduce((b,i)=>b+(prod(i.product).costUSD||0)*i.qty,0),0),ex=expenses.reduce((a,e)=>a+e.amt,0),net=rev-cogs-ex,pend=sales.reduce((a,s)=>a+(+s.balance||0),0);
const k=(t,v,c)=>`<div class="card"><span class="lbl">${t}</span><p class="text-xl font-bold ${c}">${money(v)}</p></div>`;
q('fin-kpis').innerHTML=k('Ingresos',rev,'text-white')+k('Costo de mercancía',cogs,'text-slate-300')+k('Gastos',ex,'text-amber-300')+k('Ganancia neta',net,net>=0?'text-emerald-400':'text-rose-400')+k('Por cobrar',pend,pend>0?'text-amber-300':'text-slate-300');
q('ex-list').innerHTML=expenses.map((e,i)=>`<div class="flex justify-between"><span>${e.name} (${e.cat})</span><span>${money(e.amt)} <button onclick="expenses.splice(${i},1);renderFinance()" class="text-rose-400 ml-2">Quitar</button></span></div>`).join('');
q('fin-prod').innerHTML=products.map(p=>{const u=sold(p).u;return `<div class="flex justify-between"><span>${p.name}</span><span>${u} vendidos · ${money(u*(p.priceUSD-p.costUSD))}</span></div>`;}).join('');}

function addExpense(){const a=+q('ex-amt').value;if(!q('ex-name').value||!a)return;expenses.push({name:q('ex-name').value,amt:a,cat:q('ex-cat').value});q('ex-name').value=q('ex-amt').value='';renderFinance();}
