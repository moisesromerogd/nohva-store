/* ============================================================
   IA: conexión, diseñador con IA y asistente
   ============================================================ */


const nzs=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

const mdl=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');

const contacts=()=>String(cfg.contacts||'').split('\n').map(l=>l.split(',').map(x=>x.trim())).filter(a=>a[0]&&a[1]).map(([name,email])=>({name,email}));

function saveAI(){
  cfg.contacts=q('ai-contacts').value;
  cfg.autoSend=q('ai-auto').checked;
  save();
  q('ai-status').innerText='Preferencias guardadas. Las claves de IA se administran en Supabase.';
}

async function testAI(){
  q('ai-status').innerText='Comprobando sesión y proveedores…';
  try{
    const providers=await window.NohvaAI.refreshStatus();
    cfg.provs=providers;
    save();
    renderProvs();
    q('ai-status').innerText='Conexión segura activa · '+Object.entries(PROV).map(([k,v])=>`${v.n} ${providers[k]?'✓':'No disponible'}`).join(' · ');
  }catch(e){
    q('ai-status').innerText='Error: '+e.message;
  }
}

async function callAI(p){
  if(!window.NohvaAI) throw new Error('La conexión segura de IA no está inicializada.');
  if(p.action==='ping'){
    const providers=await window.NohvaAI.refreshStatus();
    return {providers,authenticated:true};
  }
  if(p.action==='chat'){
    return window.NohvaAI.chat({
      provider:p.provider,
      mode:p.mode||'design',
      system:p.system||'',
      messages:p.messages||[],
      tools:p.tools||[],
      web:!!p.web
    });
  }
  throw new Error('Esta función todavía no está disponible en la conexión segura.');
}

function shrink(src,max,qual){return new Promise((res,rej)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>{const k=Math.min(1,max/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement('canvas');c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);try{res(c.toDataURL('image/jpeg',qual))}catch(e){rej(e)}};im.onerror=()=>rej(new Error('imagen'));im.src=src;});}

const loadSrc=src=>new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>rej(new Error('img'));im.src=src;});

const readFile=f=>new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(f);});

function bub(id,cls,html){const c=q(id),d=document.createElement('div');d.className='msg '+cls;d.innerHTML=html;c.appendChild(d);c.scrollTop=c.scrollHeight;return d;}

function errBub(id,e){bub(id,'sys','⚠️ '+esc(e.message)+(/Ajustes/.test(e.message)?' <button class="btn2" onclick="switchTab(\'settings\')">Ir a Ajustes</button>':''));}

let DC={msgs:[],photo:'',refs:[],busy:false};

try{DC.refs=JSON.parse(localStorage.getItem('nohva_refs')||'[]')}catch(e){}

function saveRefs(){try{localStorage.setItem('nohva_refs',JSON.stringify(DC.refs))}catch(e){alert('No hay espacio para más referencias. Borra algunas.')}}

async function addRefs(e){const cat=nzs(q('ref-cat').value.trim());if(!cat)return alert('Escribe primero la categoría (ej. tecnología).');
 for(const f of e.target.files){if(DC.refs.length>=30){alert('Máximo 30 referencias.');break;}try{DC.refs.push({id:Date.now()+Math.random(),cat,img:await shrink(await readFile(f),640,.8)});}catch(x){}}
 saveRefs();renderRefs();e.target.value='';}

function renderRefs(){q('ref-grid').innerHTML=DC.refs.map((r,i)=>`<div style="position:relative"><img src="${r.img}" class="rounded w-full" style="aspect-ratio:1;object-fit:cover"><span style="position:absolute;left:2px;bottom:2px;background:rgba(0,0,0,.7);color:#fff;font-size:9px;padding:1px 5px;border-radius:6px">${esc(r.cat)}</span><button onclick="DC.refs.splice(${i},1);saveRefs();renderRefs()" style="position:absolute;right:2px;top:2px;background:rgba(0,0,0,.7);color:#fff;border-radius:50%;width:18px;height:18px;font-size:11px;line-height:1">×</button></div>`).join('')||'<p class="text-xs col-span-4" style="color:var(--muted)">Aún no hay referencias.</p>';
 q('ref-cats').innerHTML=[...new Set(DC.refs.map(r=>r.cat))].map(c=>`<option value="${esc(c)}">`).join('');}

async function aiProdChange(){const p=prod(q('ad2-prod').value);q('ad2-name').value=p.name||'';q('ad2-price').value=p.priceUSD||'';DC.photo='';q('ad2-photo').removeAttribute('src');if(p.img){try{DC.photo=await shrink(p.img,800,.82);q('ad2-photo').src=DC.photo;}catch(e){}}}

async function aiPhoto(e){const f=e.target.files[0];if(!f)return;DC.photo=await shrink(await readFile(f),800,.82);q('ad2-photo').src=DC.photo;}

const DESIGN_SYS=()=>`Eres el director de arte de Nohva Store, una tienda online venezolana (precios en USD y Bs). Diseñas piezas gráficas para Instagram, Facebook y Marketplace.
FORMATO DE RESPUESTA: una nota breve (máximo 2 líneas) y UN solo bloque \`\`\`svg con el SVG completo.
REGLAS DEL SVG: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ANCHO ALTO"> con el tamaño del lienzo indicado. Foto del producto: usa exactamente <image href="{{PRODUCT}}" .../> (con preserveAspectRatio y, si quieres, clip-path). Logo de la tienda: <image href="{{LOGO_BLACK}}"/> sobre fondos claros o {{LOGO_WHITE}} sobre fondos oscuros (proporción 2.5:1). Nunca escribas base64 ni URLs externas. Fuentes solo: Arial, Helvetica, Georgia, Trebuchet MS, Verdana, Impact, Courier New. Todo el texto con <text>/<tspan> y saltos de línea manuales, dentro del lienzo y con márgenes mínimos de 60px. Sin scripts, sin animaciones, sin foreignObject.
CONTENIDO: texto en español. Usa exactamente el nombre y el precio que te doy; no inventes precios, descuentos, garantías ni teléfonos salvo que el usuario lo pida. Si recibes referencias de estilo, estudia su composición, paleta, tipografías, formas y espaciado, y adapta tu diseño a esa línea gráfica sin copiar sus textos ni marcas.
ITERACIÓN: ante cambios, devuelve el SVG completo actualizado conservando lo que no se pidió cambiar.`;

const extractSvg=t=>{const m=t.match(/```svg\s*([\s\S]*?)```/)||t.match(/(<svg[\s\S]*<\/svg>)/);return m?m[1].trim():'';};

const cleanSvg=s=>s.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi,'').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi,'').replace(/\s(xlink:)?href\s*=\s*"(?!data:|#|\{\{)[^"]*"/gi,'');

let LOGO_W=null;

async function logoWhite(){if(!LOGO_W)LOGO_W=tint(await loadSrc(q('brand-logo').src),'#ffffff').toDataURL();return LOGO_W;}

async function svgToUrl(svg){let s=cleanSvg(svg);const m=s.match(/viewBox\s*=\s*"\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/),f=q('ad2-fmt').value.split('x').map(Number),W=m?+m[1]:f[0],H=m?+m[2]:f[1];
 s=s.replaceAll('{{PRODUCT}}',DC.photo||'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==').replaceAll('{{LOGO_BLACK}}',q('brand-logo').src).replaceAll('{{LOGO_WHITE}}',await logoWhite());
 s=s.replace(/<svg\b([^>]*)>/,(x,a)=>{a=a.replace(/\s(width|height)\s*=\s*"[^"]*"/g,'');if(!/xmlns=/.test(a))a+=' xmlns="http://www.w3.org/2000/svg"';if(!/xmlns:xlink/.test(a))a+=' xmlns:xlink="http://www.w3.org/1999/xlink"';if(!/viewBox/.test(a))a+=` viewBox="0 0 ${W} ${H}"`;return `<svg${a} width="${W}" height="${H}">`;});
 return{url:URL.createObjectURL(new Blob([s],{type:'image/svg+xml;charset=utf-8'})),w:W,h:H};}

async function svgCanvas(svg){const{url,w,h}=await svgToUrl(svg),im=await loadSrc(url),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,0,0,w,h);return c;}

async function dlSvg(svg){try{const c=await svgCanvas(svg),a=document.createElement('a');a.href=c.toDataURL('image/png');a.download='diseno-nohva.png';a.click();}catch(e){alert('No se pudo exportar el diseño.');}}

async function useSvg(svg){try{const c=await svgCanvas(svg);P.img=c.toDataURL('image/jpeg',.92);P.ratio=c.width===c.height?'1/1':'4/5';syncP();switchTab('copies');}catch(e){alert('No se pudo pasar el diseño a Publicaciones.');}}

async function renderDesign(box,svg){try{const{url}=await svgToUrl(svg);box.innerHTML=`<img src="${url}" style="width:100%;max-width:340px;border-radius:.5rem;display:block;margin-top:.5rem;background:#fff"><div class="flex gap-2 mt-2"><button class="btn2" data-a="dl">Descargar PNG</button><button class="btn2" data-a="use">Usar en publicación</button></div>`;box.querySelector('[data-a=dl]').onclick=()=>dlSvg(svg);box.querySelector('[data-a=use]').onclick=()=>useSvg(svg);}catch(e){box.innerText='El diseño no se pudo dibujar. Pídele a la IA que lo corrija.';}}

async function aiDesignSend(){const t=q('ad2-in').value.trim();if(!t||DC.busy)return;
 const name=q('ad2-name').value.trim(),price=q('ad2-price').value,[w,h]=q('ad2-fmt').value.split('x'),first=!DC.msgs.length,n0=DC.msgs.length;
 q('ad2-in').value='';bub('ad2-chat','u',esc(t));let content=t;
 if(first){content=[];
  if(DC.photo)content.push({type:'text',text:'FOTO DEL PRODUCTO (se inserta con {{PRODUCT}}):'},{type:'image',source:{type:'base64',media_type:'image/jpeg',data:DC.photo.split(',')[1]}});
  else bub('ad2-chat','sys','Tip: adjunta la foto del producto para que la IA la use en el diseño.');
  const tl=nzs(t),sel=DC.refs.filter(r=>tl.includes(r.cat)).slice(0,5);
  sel.forEach(r=>content.push({type:'text',text:`REFERENCIA DE ESTILO de Nohva (categoría: ${r.cat}). Imita su línea gráfica, no copies su contenido:`},{type:'image',source:{type:'base64',media_type:'image/jpeg',data:r.img.split(',')[1]}}));
  if(sel.length)bub('ad2-chat','sys',`Usando ${sel.length} referencia(s) de tu biblioteca.`);
  else if(DC.refs.length)bub('ad2-chat','sys',`No nombraste una categoría de tu biblioteca, así que no usé referencias. Prueba con «estilo de ${esc(DC.refs[0].cat)}».`);
  content.push({type:'text',text:`DATOS: producto "${name}"${price?`, precio $${(+price).toFixed(2)} USD (≈ ${Math.round(price*bcvRate).toLocaleString('es-VE')} Bs a tasa BCV)`:''}. Lienzo ${w}x${h}. ${q('ad2-footer').checked?`Footer fijo de la tienda: "${cfg.footer}".`:'Sin footer.'}\n\nPEDIDO: ${t}`});}
 DC.msgs.push({role:'user',content});DC.busy=true;const wt=bub('ad2-chat','sys','Diseñando con '+PROV[q('ad2-prov').value].n+'…');
 try{const pv=q('ad2-prov').value,r=await callAI({action:'chat',mode:'design',provider:pv,system:DESIGN_SYS(),messages:DC.msgs}),txt=r.content.filter(b=>b.type==='text').map(b=>b.text).join('\n'),svg=extractSvg(txt);
  wt.remove();DC.msgs.push({role:'assistant',content:[{type:'text',text:txt||'(sin respuesta)'}]});
  const note=txt.replace(/```svg[\s\S]*?```/,'').replace(/<svg[\s\S]*<\/svg>/,'').trim(),d=bub('ad2-chat','a',(note?mdl(note)+'<br>':'')+`<span style="font-size:11px;color:var(--muted)">Diseñado con ${PROV[pv].n}</span>`+(svg?'<div class="dprev"></div>':'No pude generar el diseño. Intenta de nuevo o descríbelo de otra forma.'));
  if(svg)renderDesign(d.querySelector('.dprev'),svg);}
 catch(e){wt.remove();DC.msgs.length=n0;errBub('ad2-chat',e);}
 DC.busy=false;}

function aiDesignReset(){DC.msgs=[];q('ad2-chat').innerHTML='';bub('ad2-chat','a','Dime qué diseño necesitas. Por ejemplo: «Quiero una publicación para este producto con fondo oscuro, precio grande y estilo de tecnología».');}

let AS={msgs:[],busy:false};

const mkTool=(name,description,props={},req=[])=>({name,description,input_schema:{type:'object',properties:props,required:req}});

const TOOLS=[mkTool('get_inventory','Lista el inventario: ID, nombre, categoría, costo, precio, stock, estado, fecha de ingreso, unidades vendidas, ingresos y ganancia por producto.'),
 mkTool('get_sales','Lista las ventas registradas. Opcional: filtro de texto (cliente, producto, método, canal).',{filtro:{type:'string'}}),
 mkTool('get_finance','Resumen financiero: ingresos, costo de mercancía, gastos y ganancia neta.'),
 mkTool('get_clients','Clientes con número de compras y total gastado.'),
 mkTool('get_rate','Tasa oficial BCV actual en bolívares por dólar.'),
 mkTool('calculate','Evalúa una operación aritmética exacta (usa punto decimal), por ejemplo (35-18)*12.',{expresion:{type:'string'}},['expresion']),
 mkTool('send_report','Envía por correo un reporte a un contacto autorizado, por nombre (por ejemplo Shannon). Escribe el reporte completo en cuerpo.',{destinatario:{type:'string'},asunto:{type:'string'},cuerpo:{type:'string'}},['destinatario','asunto','cuerpo'])];

const ASYS=()=>`Eres el asistente de IA de Nohva Store, una tienda online venezolana (El Tigre, Anzoátegui). Hoy es ${new Date().toLocaleDateString('es-VE',{dateStyle:'full'})}. Moneda base USD; tasa BCV actual ${bcvRate.toFixed(2)} Bs por USD.
Responde en español, claro y breve. Para cualquier dato del negocio (inventario, ventas, finanzas, clientes) usa las herramientas: nunca inventes cifras; si falta un dato, dilo. Para cuentas usa calculate. Las fechas de las ventas son texto libre.
Para enviar un reporte usa send_report con un contacto autorizado (${contacts().map(c=>c.name).join(', ')||'ninguno configurado'}); redáctalo completo, profesional y con cifras obtenidas de las herramientas. Si el contacto no existe, dilo.`;

async function runTool(n,i){try{
 if(n==='get_inventory')return JSON.stringify(products.map(p=>{const v=sold(p);return{id:p.id,nombre:p.name,categoria:p.category,costo_usd:p.costUSD,precio_usd:p.priceUSD,stock:p.stock,estado:stOf(p)[0],ingreso:p.createdAt,vendidas:v.u,ingresos_usd:+v.rev.toFixed(2),ganancia_usd:+v.prof.toFixed(2)};}));
 if(n==='get_sales'){const f=nzs(i.filtro||'');return JSON.stringify(sales.filter(s=>!f||nzs(JSON.stringify(s)).includes(f)));}
 if(n==='get_finance'){const rev=sales.reduce((a,s)=>a+s.amountUSD,0),cogs=sales.reduce((a,s)=>a+itemsOf(s).reduce((b,i)=>b+(prod(i.product).costUSD||0)*i.qty,0),0),ex=expenses.reduce((a,e)=>a+e.amt,0);return JSON.stringify({por_cobrar_usd:sales.reduce((a,s)=>a+(+s.balance||0),0),ingresos_usd:rev,costo_mercancia_usd:cogs,gastos_usd:ex,ganancia_neta_usd:rev-cogs-ex,gastos:expenses});}
 if(n==='get_clients'){const m={};sales.forEach(s=>{const c=m[s.client]=m[s.client]||{cliente:s.client,compras:0,total_usd:0};c.compras++;c.total_usd+=s.amountUSD;});return JSON.stringify(Object.values(m));}
 if(n==='get_rate')return JSON.stringify({bs_por_usd:bcvRate,fuente:bcvInfo});
 if(n==='calculate'){const e=String(i.expresion||'').replace(/,/g,'.').replace(/\^/g,'**');if(!/^[0-9+\-*/().%\s]+$/.test(e))return 'Expresión no válida';const v=Function('"use strict";return ('+e+')')();return Number.isFinite(v)?String(Math.round(v*1e6)/1e6):'Resultado no válido';}
 if(n==='send_report'){const d=nzs(i.destinatario||''),c=d&&contacts().find(x=>nzs(x.name).includes(d));if(!c)return 'Contacto no autorizado. Disponibles: '+(contacts().map(x=>x.name).join(', ')||'ninguno');
  if(!cfg.autoSend&&!(await uiConfirm(`Para: ${c.name} (${c.email})\n\nAsunto: ${i.asunto}\n\n${String(i.cuerpo).slice(0,700)}`,{title:'¿Enviar este reporte?',ok:'Enviar'})))return 'El usuario canceló el envío.';
  await callAI({action:'email',to:c.email,subject:i.asunto,text:i.cuerpo});return 'Reporte enviado a '+c.name+'.';}
 return 'Herramienta desconocida';}catch(e){return 'Error: '+e.message;}}

const compact=ms=>ms.forEach(m=>{if(m.role==='assistant'&&Array.isArray(m.content))m.content=m.content.filter(b=>!['server_tool_use','web_search_tool_result'].includes(b.type)).map(b=>b.type==='text'?{type:'text',text:b.text}:b);});

async function aiLoop(){
  throw new Error('El asistente empresarial estará disponible cuando sus consultas estén conectadas a Supabase con permisos por usuario. El diseñador con IA sí está habilitado.');
}

async function asSend(){
  bub('as-chat','sys','El asistente empresarial está temporalmente en preparación para proteger ventas, inventario y datos financieros. El Diseñador con IA ya puede utilizarse.');
}

function asReset(){AS.msgs=[];q('as-chat').innerHTML='';bub('as-chat','a','Hola. El asistente empresarial está en preparación mientras conectamos de forma segura los datos y permisos. Puedes utilizar el Diseñador con IA.');}

const PROV={
  openai:{n:'OpenAI (ChatGPT)',h:'Conectado mediante Supabase; la clave permanece protegida en el servidor.'},
  gemini:{n:'Gemini',h:'Conectado mediante Supabase; la clave permanece protegida en el servidor.'},
  grok:{n:'Grok · No disponible',h:'Estamos preparando su integración.'},
  claude:{n:'Claude · No disponible',h:'Estamos preparando su integración.'}
};

function renderProvs(){const sel=q('ad2-prov');if(!sel)return;sel.innerHTML=Object.entries(PROV).map(([k,v])=>`<option value="${k}" ${cfg.provider===k?'selected':''}>${v.n}${cfg.provs?(cfg.provs[k]?' · lista':' · sin clave'):''}</option>`).join('');provHint();}

function provHint(){const p=cfg.provider,h=q('ad2-provhint');if(h)h.innerText=PROV[p].h+(cfg.provs&&!cfg.provs[p]?' Falta su clave en Supabase.':'');}
