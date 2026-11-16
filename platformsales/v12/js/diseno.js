/* ============================================================
   DISEÑO Y PUBLICACIONES: estudio de diseño, galería y textos de publicación
   ============================================================ */


const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));

const lum=h=>{const[r,g,b]=rgb(h);return(.299*r+.587*g+.114*b)/255};

const ink=h=>lum(h)>.55?'#111827':'#ffffff';

const hex=a=>'#'+a.map(v=>Math.min(255,v).toString(16).padStart(2,'0')).join('');

const shade=(h,p)=>hex(rgb(h).map(v=>Math.max(0,Math.min(255,Math.round(v+2.55*p)))));

const NAMES={full:'Foto completa',white:'Fondo blanco',promo:'Promocional'};

const FONTS=['Outfit','Inter','Georgia','Impact','Courier New'];

let S={mode:'promo',fmt:'1080x1350',title:'',sub:'',info:'',priceVal:0,badge:'¡OFERTA ESPECIAL!',cta:'Escríbenos por DM',price:true,bs:false,font:'Outfit',tsize:84,align:'left',pos:'bottom',bg:'#1e1b4b',acc:'#f59e0b',txt:'#ffffff',dark:45,zoom:100,ox:0,oy:0,footOn:true,foot:cfg.footer,footBg:'#0f172a',footTx:'#ffffff',logoSize:90,logoPos:'tl',logoOn:true};

try{Object.assign(S,JSON.parse(localStorage.getItem('nohva_dfoot')||'{}'))}catch(e){}

let PH=null,LOGO=null,REFC={},GAL=[];

try{GAL=JSON.parse(localStorage.getItem('nohva_designs')||'[]')}catch(e){}

function fld(O,at,k,l,t,o,a,b){const v=O[k];
 if(t==='check')return `<label class="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" ${at}="${k}" ${v?'checked':''}>${l}</label>`;
 let c;
 if(t==='sel')c=`<select class="inp" ${at}="${k}">${o.map(x=>{const[u,w]=Array.isArray(x)?x:[x,x];return `<option value="${u}" ${u==v?'selected':''}>${w}</option>`}).join('')}</select>`;
 else if(t==='area')c=`<textarea rows="4" class="inp" ${at}="${k}">${esc(v)}</textarea>`;
 else if(t==='range')c=`<input type="range" class="w-full" min="${a}" max="${b}" value="${v}" ${at}="${k}">`;
 else c=`<input type="${t}" class="${t==='color'?'h-9 w-full rounded':'inp'}" value="${esc(v)}" ${at}="${k}">`;
 return `<div><span class="lbl">${l}</span>${c}</div>`;}

const grp=(t,h,open)=>`<details class="card" ${open?'open':''}><summary class="text-sm font-bold text-white cursor-pointer">${t}</summary><div class="grid grid-cols-2 gap-3 mt-3">${h}</div></details>`;

const FMT=[['1080x1080','Cuadrado 1:1'],['1080x1350','Vertical 4:5'],['1080x1920','Historia 9:16']];

const POS=[['top','Arriba'],['center','Centro'],['bottom','Abajo']],COR=[['tl','Arriba izq.'],['tr','Arriba der.'],['bl','Abajo izq.'],['br','Abajo der.']];

function buildStudio(){
 const f=(...a)=>fld(S,'data-k',...a);
 q('d-groups').innerHTML=
  grp('Formato y foto',f('fmt','Formato','sel',FMT)+f('zoom','Zoom de la foto','range',null,40,250)+f('ox','Mover horizontal','range',null,-500,500)+f('oy','Mover vertical','range',null,-500,500),true)+
  grp('Textos',`<div class="col-span-2">${f('title','Título','text')}</div><div class="col-span-2">${f('sub','Subtítulo','text')}</div><div class="col-span-2">${f('info','Información (una línea por punto)','area')}</div>`+f('badge','Etiqueta o descuento','text')+f('cta','Botón o llamada','text')+f('priceVal','Precio USD','number')+f('font','Tipografía','sel',FONTS)+f('price','Mostrar precio','check')+f('bs','Mostrar en Bs','check')+f('tsize','Tamaño del título','range',null,40,140)+f('align','Alineación','sel',[['left','Izquierda'],['center','Centro']])+f('pos','Posición del texto','sel',POS),true)+
  grp('Colores',f('bg','Fondo','color')+f('acc','Acento','color')+f('txt','Texto','color')+f('dark','Oscurecer foto','range',null,0,90))+
  grp('Footer fijo',`<div class="col-span-2">${f('footOn','Mostrar footer','check')}</div><div class="col-span-2">${f('foot','Texto del footer','text')}</div>`+f('footBg','Fondo','color')+f('footTx','Texto','color')+`<button class="btn2 col-span-2" onclick="saveFoot()">Guardar como predeterminado</button>`)+
  grp('Logo',`<div class="col-span-2">${f('logoOn','Mostrar logo','check')}</div><label class="btn2 col-span-2 text-center cursor-pointer">Subir logo<input type="file" accept="image/*" class="hidden" onchange="loadLogo(event)"></label>`+f('logoSize','Tamaño','range',null,40,300)+f('logoPos','Posición','sel',COR));
 q('d-modes').innerHTML=Object.keys(NAMES).map(m=>`<button class="btn2" data-m="${m}" onclick="S.mode='${m}';drawMain()">${NAMES[m]}</button>`).join('');
 document.querySelectorAll('#tab-design [data-k]').forEach(el=>el.addEventListener('input',()=>{const k=el.dataset.k;S[k]=el.type==='checkbox'?el.checked:el.type==='range'?+el.value:el.value;drawMain();}));
}

function syncS(){document.querySelectorAll('#tab-design [data-k]').forEach(el=>{const v=S[el.dataset.k];if(el.type==='checkbox')el.checked=!!v;else el.value=v;});}

function saveFoot(){localStorage.setItem('nohva_dfoot',JSON.stringify({foot:S.foot,footOn:S.footOn,footBg:S.footBg,footTx:S.footTx}));alert('Footer guardado como predeterminado');}

function ln(c,t,mw){const out=[];String(t||'').split('\n').forEach(p=>{let l='';p.split(' ').forEach(w=>{const n=l?l+' '+w:w;if(c.measureText(n).width>mw&&l){out.push(l);l=w}else l=n});out.push(l)});return out.filter(x=>x!=='');}

function drawArt(cv,W,mode){
 const[bw,H]=S.fmt.split('x').map(Number),k=W/bw;cv.width=W;cv.height=Math.round(H*k);
 const c=cv.getContext('2d');c.setTransform(k,0,0,k,0,0);
 const pad=70,mw=bw-pad*2,white=mode==='white',tx=white?'#111827':S.txt;
 const tp=mode==='full'?S.pos:(S.pos==='top'?'top':'bottom');
 c.fillStyle=white?'#ffffff':S.bg;c.fillRect(0,0,bw,H);
 if(mode==='promo'){const g=c.createLinearGradient(0,0,bw,H);g.addColorStop(0,S.bg);g.addColorStop(1,shade(S.bg,-35));c.fillStyle=g;c.fillRect(0,0,bw,H);c.globalAlpha=.18;c.fillStyle=S.acc;c.beginPath();c.arc(bw*.8,H*.3,bw*.45,0,7);c.fill();c.globalAlpha=1;}
 const ts=+S.tsize,al=S.align,ax=al==='center'?bw/2:pad;c.textAlign=al;c.textBaseline='top';
 c.font=`800 ${ts}px ${S.font}`;const tl=ln(c,S.title,mw),th=tl.length*ts*1.1;
 c.font=`500 ${ts*.42}px ${S.font}`;const sl=ln(c,S.sub,mw),sh=sl.length*ts*.5;
 c.font=`500 40px ${S.font}`;const il=String(S.info||'').split('\n').filter(Boolean).flatMap(l=>ln(c,'• '+l,mw)),ih=il.length*52;
 const pr=S.price&&+S.priceVal?`$${(+S.priceVal).toFixed(2)}`+(S.bs?`  ·  ${Math.round(S.priceVal*bcvRate)} Bs`:''):'';
 const g=20,total=th+(sh?sh+g:0)+(ih?ih+g:0)+(pr?96+g:0)+(S.cta?80+g:0),fh=S.footOn&&S.foot?90:0;
 const LG=LOGO&&S.logoOn,lg=LG?S.logoSize+20:0;
 let y=tp==='top'?pad+(S.logoPos[0]==='t'?lg:0):tp==='center'?(H-total)/2:H-fh-pad-total;
 if(PH&&PH.complete&&PH.naturalWidth){
  let bx=0,by=0,bW=bw,bH=H,cover=true;
  if(white||mode==='promo'){bx=white?pad:bw*.1;bW=bw-2*bx;if(tp==='top'){by=y+total+30;bH=H-fh-pad-by}else{by=pad;bH=y-30-by}bH=Math.max(bH,150);cover=false}
  const r=PH.naturalWidth/PH.naturalHeight,br=bW/bH;let dw,dh;
  if(cover===(r>br)){dh=bH;dw=bH*r}else{dw=bW;dh=bW/r}
  dw*=S.zoom/100;dh*=S.zoom/100;
  c.save();c.beginPath();c.rect(bx,by,bW,bH);c.clip();
  if(!cover){c.shadowColor='rgba(0,0,0,.35)';c.shadowBlur=40;c.shadowOffsetY=20}
  c.drawImage(PH,bx+(bW-dw)/2+ +S.ox,by+(bH-dh)/2+ +S.oy,dw,dh);c.restore();
  if(mode==='full'){const g=c.createLinearGradient(0,tp==='top'?0:H,0,tp==='center'?H/2:(tp==='top'?H*.7:H*.3));g.addColorStop(0,`rgba(0,0,0,${S.dark/100})`);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,bw,H);}
 }else{c.save();c.fillStyle='#94a3b8';c.font='40px Inter';c.textAlign='center';c.textBaseline='middle';c.fillText('Sube la foto del producto',bw/2,H*.3);c.restore();}
 c.fillStyle=tx;c.font=`800 ${ts}px ${S.font}`;tl.forEach((l,i)=>c.fillText(l,ax,y+i*ts*1.1));y+=th+g;
 if(sh){c.font=`500 ${ts*.42}px ${S.font}`;c.globalAlpha=.85;sl.forEach((l,i)=>c.fillText(l,ax,y+i*ts*.5));c.globalAlpha=1;y+=sh+g;}
 if(ih){c.font=`500 40px ${S.font}`;il.forEach((l,i)=>c.fillText(l,ax,y+i*52));y+=ih+g;}
 const px=(w)=>al==='center'?ax-w/2:ax;
 if(pr){c.font=`800 58px ${S.font}`;const w=c.measureText(pr).width+60;c.fillStyle=S.acc;c.beginPath();c.roundRect(px(w),y,w,96,48);c.fill();c.fillStyle=ink(S.acc);c.textAlign='left';c.fillText(pr,px(w)+30,y+18);c.textAlign=al;y+=96+g;}
 if(S.cta){c.font=`700 38px ${S.font}`;const w=c.measureText(S.cta).width+70;c.strokeStyle=tx;c.lineWidth=4;c.beginPath();c.roundRect(px(w),y,w,80,40);c.stroke();c.fillStyle=tx;c.textAlign='left';c.fillText(S.cta,px(w)+35,y+20);c.textAlign=al;}
 if(S.badge){const R=105,bx=bw-pad-R,by=tp==='top'?H*.6:pad+R+(LOGO&&S.logoPos==='tr'?lg:0);c.fillStyle=S.acc;c.beginPath();c.arc(bx,by,R,0,7);c.fill();c.fillStyle=ink(S.acc);c.textAlign='center';c.font=`800 32px ${S.font}`;const bl=ln(c,S.badge,R*1.5);bl.forEach((l,i)=>c.fillText(l,bx,by-bl.length*19+i*38));}
 if(LG){const r=LOGO.naturalWidth/LOGO.naturalHeight,h=+S.logoSize,w=h*r,x=S.logoPos[1]==='l'?pad:bw-pad-w,yy=S.logoPos[0]==='t'?pad:H-fh-pad-h;c.drawImage(LOGO._mono?tint(LOGO,white?'#111827':S.txt):LOGO,x,yy,w,h);}
 if(fh){c.fillStyle=S.footBg;c.fillRect(0,H-fh,bw,fh);c.fillStyle=S.footTx;c.font='500 30px Inter';c.textAlign='center';c.textBaseline='middle';c.fillText(S.foot,bw/2,H-fh/2,bw-pad);}
}

function drawMain(){drawArt(q('d-canvas'),1080,S.mode);document.querySelectorAll('#d-modes button').forEach(b=>b.className=b.dataset.m===S.mode?'btn':'btn2');}

function genOptions(){const o=q('d-options');o.classList.remove('hidden');o.innerHTML=Object.keys(NAMES).map(m=>`<div class="card p-2 cursor-pointer" onclick="S.mode='${m}';drawMain()"><canvas id="o-${m}" class="w-full rounded"></canvas><p class="text-xs text-center mt-1 text-slate-300">${NAMES[m]}</p></div>`).join('');Object.keys(NAMES).forEach(m=>drawArt(q('o-'+m),360,m));}

function loadImg(file,cb){const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>cb(im);im.src=r.result;};r.readAsDataURL(file);}

function loadPhoto(e){if(e.target.files[0])loadImg(e.target.files[0],im=>{PH=im;drawMain();});}

function loadLogo(e){if(e.target.files[0])loadImg(e.target.files[0],im=>{LOGO=im;drawMain();});}

function sendProductToStudio(id){const p=products.find(x=>x.id===id);if(!p)return;switchTab('design');q('design-prod-select').value=id;S.title=p.name;S.priceVal=p.priceUSD;if(!S.info)S.info='Calidad garantizada\nEntrega inmediata';PH=new Image();PH.crossOrigin='anonymous';PH.onload=drawMain;PH.onerror=()=>{PH=null;drawMain();};PH.src=p.img;syncS();drawMain();}

function autoFillDesignFromInventory(){const v=q('design-prod-select').value;if(v)sendProductToStudio(v);}

function updateDesignPreview(){if(q('d-groups')&&q('d-groups').innerHTML)drawMain();}

function dlArt(){try{const a=document.createElement('a');a.href=q('d-canvas').toDataURL('image/png');a.download='arte-nohva.png';a.click();}catch(e){alert('Esta foto no permite exportar. Súbela desde tu equipo con el botón "Subir foto del producto".');}}

function useInPub(){try{P.img=q('d-canvas').toDataURL('image/jpeg',.92);}catch(e){return alert('Sube la foto desde tu equipo para poder usar el arte.');}P.ratio=S.fmt==='1080x1080'?'1/1':'4/5';syncP();switchTab('copies');}

function saveGal(){try{const t=document.createElement('canvas');drawArt(t,720,S.mode);GAL.unshift({img:t.toDataURL('image/jpeg',.8),s:{...S}});GAL=GAL.slice(0,12);localStorage.setItem('nohva_designs',JSON.stringify(GAL));renderGal();drawMain();}catch(e){alert('No se pudo guardar. Sube la foto desde tu equipo o borra diseños de la galería.');}}

function renderGal(){q('d-gallery').innerHTML=GAL.map((g,i)=>`<div><img src="${g.img}" class="rounded cursor-pointer w-full" onclick="Object.assign(S,GAL[${i}].s);syncS();drawMain()"><button class="text-[10px] text-rose-400" onclick="GAL.splice(${i},1);localStorage.setItem('nohva_designs',JSON.stringify(GAL));renderGal()">Borrar</button></div>`).join('')||'<p class="text-xs text-slate-500 col-span-full">Aún no guardas diseños.</p>';}

function loadRefs(e){[...e.target.files].forEach(f=>loadImg(f,im=>{const t=document.createElement('canvas');t.width=t.height=40;const c=t.getContext('2d');c.drawImage(im,0,0,40,40);const d=c.getImageData(0,0,40,40).data;
 for(let i=0;i<d.length;i+=4){const h=hex([0,1,2].map(j=>Math.round(d[i+j]/51)*51));REFC[h]=(REFC[h]||0)+1;}
 q('d-refs').insertAdjacentHTML('beforeend',`<img src="${im.src}" class="h-14 rounded">`);showPal();}));}

const topPal=()=>Object.entries(REFC).sort((a,b)=>b[1]-a[1]).slice(0,6).map(x=>x[0]);

function showPal(){q('d-pal').innerHTML=topPal().map(h=>`<span title="Clic: acento. Doble clic: fondo" style="background:${h}" class="w-8 h-8 rounded-full border border-slate-600 cursor-pointer" onclick="S.acc='${h}';syncS();drawMain()" ondblclick="S.bg='${h}';S.txt='${ink(h)}';syncS();drawMain()"></span>`).join('');}

function applyStyle(){const p=topPal();if(!p.length)return alert('Sube primero una o más referencias.');
 const mean=p.reduce((a,h)=>a+lum(h),0)/p.length,sat=h=>{const v=rgb(h);return Math.max(...v)-Math.min(...v)};
 const s=[...p].sort((a,b)=>lum(a)-lum(b));S.bg=mean>.6?s[s.length-1]:s[0];S.acc=[...p].sort((a,b)=>sat(b)-sat(a))[0];S.txt=ink(S.bg);syncS();drawMain();}

function applyInstr(){const t=q('d-instr').value.toLowerCase(),L=[];const m=(re,fn,msg)=>{const r=t.match(re);if(r){fn(r);L.push(msg)}};
 m(/env[ií]o gratis/,()=>S.badge='ENVÍO GRATIS','etiqueta ENVÍO GRATIS');
 m(/(\d{1,2})\s*%/,r=>S.badge='-'+r[1]+'%','descuento en etiqueta');
 m(/fondo (oscuro|negro)/,()=>{S.bg='#0f172a';S.txt='#ffffff'},'fondo oscuro');
 m(/fondo (claro|blanco)/,()=>{S.bg='#f8fafc';S.txt='#111827'},'fondo claro');
 m(/t[ií]tulo (m[aá]s )?grande/,()=>S.tsize=Math.min(140,+S.tsize+16),'título más grande');
 m(/t[ií]tulo (m[aá]s )?peque/,()=>S.tsize=Math.max(40,+S.tsize-16),'título más pequeño');
 m(/sin footer/,()=>S.footOn=false,'sin footer');m(/con footer/,()=>S.footOn=true,'con footer');
 m(/sin precio/,()=>S.price=false,'sin precio');m(/(muestra|con|agrega) (el )?precio/,()=>S.price=true,'con precio');
 m(/bol[ií]vares|\bbs\b/,()=>S.bs=true,'precio en Bs');
 m(/centrad/,()=>S.align='center','texto centrado');
 m(/texto arriba/,()=>S.pos='top','texto arriba');m(/texto abajo/,()=>S.pos='bottom','texto abajo');
 m(/#[0-9a-f]{6}/,r=>S.acc=r[0],'color de acento');
 m(/"([^"]+)"|“([^”]+)”/,r=>{if(!/env[ií]o gratis/.test(r[0]))S.info=(S.info?S.info+'\n':'')+(r[1]||r[2])},'texto agregado a la información');
 q('d-log').innerText=L.length?'Aplicado: '+L.join(', ')+'.':'No entendí esa instrucción con reglas simples. Con una IA conectada podrá interpretar pedidos más libres.';syncS();drawMain();}

let P={net:'ig',ratio:'1/1',img:'',acct:'nohvastore',loc:'El Tigre, Anzoátegui',tone:'cercano',emoji:true,price:true,bs:true,urg:true,foot:true,tags:'#nohvastore #eltigre #venezuela',extra:'',cta:'Enviar mensaje',full:false,ig:'',fb:'',mkT:'',mkP:'',mkCat:'Electrónica',mkCond:'Nuevo',mkD:''};

const NETS={ig:'Instagram',fb:'Facebook',mk:'Marketplace'};

function buildPub(){const f=(...a)=>fld(P,'data-p',...a);
 q('p-groups').innerHTML=
  grp('Opciones del texto',f('tone','Tono','sel',['cercano','profesional','urgente','divertido'])+f('ratio','Formato en Instagram','sel',[['1/1','Cuadrado 1:1'],['4/5','Vertical 4:5']])+f('emoji','Usar emojis','check')+f('price','Incluir precio','check')+f('bs','Precio también en Bs','check')+f('urg','Aviso de pocas unidades','check')+f('foot','Incluir footer fijo','check')+`<div class="col-span-2">${f('extra','Línea extra (garantía, envío, promo)','text')}</div><div class="col-span-2">${f('tags','Hashtags','text')}</div>`,true)+
  grp('Instagram',`<div class="col-span-2">${f('acct','Cuenta','text')}</div><div class="col-span-2">${f('loc','Ubicación','text')}</div><div class="col-span-2">${f('ig','Descripción (editable)','area')}</div><p id="p-cnt" class="col-span-2 text-[11px] text-slate-400"></p>`,true)+
  grp('Facebook',`<div class="col-span-2">${f('cta','Botón de llamada','sel',['Enviar mensaje','Comprar ahora','Más información','Llamar'])}</div><div class="col-span-2">${f('fb','Texto de la publicación (editable)','area')}</div>`)+
  grp('Marketplace',`<div class="col-span-2">${f('mkT','Título','text')}</div>`+f('mkP','Precio USD','number')+f('mkCond','Estado','sel',['Nuevo','Usado - como nuevo','Usado'])+`<div class="col-span-2">${f('mkCat','Categoría','sel',['Electrónica','Ropa y calzado','Accesorios','Hogar','Otros'])}</div><div class="col-span-2">${f('mkD','Descripción (editable)','area')}</div>`);
 q('p-tabs').innerHTML=Object.entries(NETS).map(([k,v])=>`<button class="btn2" data-n="${k}" onclick="P.net='${k}';renderPub()">${v}</button>`).join('');
 document.querySelectorAll('#tab-copies [data-p]').forEach(el=>el.addEventListener('input',()=>{const k=el.dataset.p;P[k]=el.type==='checkbox'?el.checked:el.value;renderPub();}));}

function syncP(){document.querySelectorAll('#tab-copies [data-p]').forEach(el=>{const v=P[el.dataset.p];if(el.type==='checkbox')el.checked=!!v;else el.value=v;});renderPub();}

function pubFromProduct(){const p=prod(q('pub-prod').value);if(!p.name)return;P.img=p.img;P.mkT=p.name;P.mkP=p.priceUSD;genText();}

function pubInv(){const p=prod(q('pub-prod').value);if(p.img){P.img=p.img;renderPub();}}

function pubArt(){if(q('d-canvas').width&&PH)useInPub();else alert('Primero diseña un arte en el Estudio de diseño.');}

function pubPhoto(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{P.img=r.result;renderPub();};r.readAsDataURL(f);}

function genText(){const p=prod(q('pub-prod').value);if(!p.name)return;const n=p.name;
 const E=s=>P.emoji?s:s.replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF\u2B50\uFE0F]/gu,'').replace(/ +\n/g,'\n').trim();
 const intro={cercano:`✨ ${n} ✨\nLo que estabas buscando ya está aquí.`,profesional:`${n}\nCalidad garantizada y atención personalizada.`,urgente:`🔥 ¡${n}! Corre que vuelan 🔥`,divertido:`Tu ${n} te está esperando 😎`}[P.tone];
 const pr=P.price?`💵 ${money(p.priceUSD)}`+(P.bs?` (≈ ${Math.round(p.priceUSD*bcvRate)} Bs a tasa BCV)`:''):'';
 const urg=P.urg&&p.stock<=3?`⚠️ Quedan solo ${p.stock} unidades`:'';
 const core=[intro,pr,urg,P.extra].filter(Boolean).join('\n\n'),ft=P.foot?'\n\n'+cfg.footer:'';
 P.ig=E(core+'\n\n📩 Escríbenos por DM y te lo apartamos.'+ft)+(P.tags?'\n\n'+P.tags:'');
 P.fb=E(core+'\n\n📩 Escríbenos por mensaje privado.'+ft);
 P.mkT=n;P.mkP=p.priceUSD;P.mkD=E(`${n} ${P.mkCond.toLowerCase()}.\n${pr}\n${urg}\n${P.extra}\nAceptamos Pago Móvil, divisas y USDT. Entrega personal o envío.`).replace(/\n{2,}/g,'\n');
 syncP();}

function renderPub(){document.querySelectorAll('#p-tabs button').forEach(b=>b.className=b.dataset.n===P.net?'btn':'btn2');
 const im=(ar)=>P.img?`<img src="${P.img}" style="width:100%;aspect-ratio:${ar};object-fit:cover;display:block">`:`<div style="aspect-ratio:${ar};background:#e5e7eb;color:#6b7280;display:flex;align-items:center;justify-content:center;font-size:14px">Adjunta una foto</div>`;
 const av=`<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(45deg,#f59e0b,#d946ef,#6366f1);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700">${esc((P.acct||'N')[0].toUpperCase())}</div>`;
 const W='background:#fff;color:#262626;border:1px solid #dbdbdb;border-radius:12px;max-width:420px;margin:auto;font-family:Inter,sans-serif;overflow:hidden;font-size:14px;white-space:pre-wrap;line-height:1.35';
 let h='';
 if(P.net==='ig'){const long=P.ig.length>125&&!P.full;h=`<div style="${W}"><div style="display:flex;gap:10px;align-items:center;padding:10px;white-space:normal">${av}<div><b>${esc(P.acct)}</b><div style="font-size:12px;color:#737373">${esc(P.loc)}</div></div></div>${im(P.ratio)}<div style="padding:10px 12px;font-size:20px;white-space:normal"><i class="fa-regular fa-heart"></i> &nbsp;<i class="fa-regular fa-comment"></i> &nbsp;<i class="fa-regular fa-paper-plane"></i><i class="fa-regular fa-bookmark" style="float:right"></i></div><div style="padding:0 12px 14px"><b>${esc(P.acct)}</b> ${esc(long?P.ig.slice(0,125):P.ig)}${long?'… <span style="color:#8e8e8e">más</span>':''}</div></div>`;}
 if(P.net==='fb'){const long=P.fb.length>300&&!P.full;h=`<div style="${W}"><div style="display:flex;gap:10px;align-items:center;padding:10px 12px;white-space:normal">${av}<div><b>${esc(P.acct)}</b><div style="font-size:12px;color:#65676b">Justo ahora · <i class="fa-solid fa-earth-americas"></i></div></div></div><div style="padding:0 12px 10px">${esc(long?P.fb.slice(0,300):P.fb)}${long?'… <span style="color:#65676b">Ver más</span>':''}</div>${im('1/1')}<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#f0f2f5;white-space:normal"><b>${esc(P.acct)}</b><span style="background:#e4e6eb;padding:6px 12px;border-radius:6px;font-weight:600">${esc(P.cta)}</span></div><div style="display:flex;justify-content:space-around;padding:10px;color:#65676b;font-weight:600;white-space:normal"><span>Me gusta</span><span>Comentar</span><span>Compartir</span></div></div>`;}
 if(P.net==='mk')h=`<div style="${W}">${im('1/1')}<div style="padding:12px;white-space:normal"><div style="font-size:22px;font-weight:700">$${(+P.mkP||0).toFixed(2)}</div><div style="font-size:16px">${esc(P.mkT)}</div><div style="font-size:12px;color:#65676b">Publicado justo ahora en ${esc(P.loc)}</div><div style="margin:10px 0;padding:8px;background:#f0f2f5;border-radius:8px;font-size:13px">Estado: ${esc(P.mkCond)} · Categoría: ${esc(P.mkCat)}</div><div style="white-space:pre-wrap">${esc(P.mkD)}</div><div style="margin-top:12px;background:#0866ff;color:#fff;text-align:center;padding:9px;border-radius:8px;font-weight:600">Enviar mensaje</div></div></div>`;
 q('p-prev').innerHTML=h+`<label class="flex items-center gap-2 text-xs text-slate-300 mt-3"><input type="checkbox" ${P.full?'checked':''} onchange="P.full=this.checked;renderPub()">Ver texto completo</label>`;
 const c=q('p-cnt');if(c)c.innerText=`${P.ig.length}/2200 caracteres · ${(P.ig.match(/#/g)||[]).length}/30 hashtags`;}

const pubText=()=>P.net==='ig'?P.ig:P.net==='fb'?P.fb:`${P.mkT}\n$${P.mkP}\n${P.mkD}`;

function copyPub(){navigator.clipboard.writeText(pubText());}

function dlPub(){if(!P.img)return;const a=document.createElement('a');a.href=P.img;a.download='publicacion-nohva';a.target='_blank';a.click();}

function schedPub(){if(!q('p-date').value)return alert('Elige fecha y hora');posts.push({prod:q('pub-prod').value,net:NETS[P.net],date:q('p-date').value,text:pubText().replace(/\n+/g,' ').slice(0,160),done:false});alert('Agregada al calendario de programación');}

const _tc={};

function tint(im,col){if(_tc[col]&&_tc[col].s===im)return _tc[col].c;const t=document.createElement('canvas');t.width=im.naturalWidth;t.height=im.naturalHeight;const x=t.getContext('2d');x.drawImage(im,0,0);x.globalCompositeOperation='source-in';x.fillStyle=col;x.fillRect(0,0,t.width,t.height);_tc[col]={s:im,c:t};return t;}
