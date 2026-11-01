(()=>{'use strict';
const P=window.OPS_PUBLIC, $=id=>document.getElementById(id), h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let vault=window.OPS_PRIVATE||null, uploadedVault=null, currentView='inicio';
const labels={inicio:'PANEL GENERAL',procedimientos:'PROCEDIMIENTOS',actividades:'ACTIVIDADES',archivo:'ARCHIVO HISTÓRICO',asistente:'ASISTENTE СМТЕК',acerca:'PUBLICACIÓN Y SEGURIDAD'};
const stop=new Set('a al algo algunas algunos ante antes asi bajo con contra como cual cuales cuando de del desde donde durante e el ella ellos en entre era es esa ese eso esta este esto estas estos ha haber hacia hasta hay la las le les lo los mas me mi mis no nos o para pero por porque que quien se ser si sin sobre su sus te tu tus un una uno unas unos y ya yo necesito tengo quiero quisiera realizar hacer saber consultar solicitar explicame paso pasos detalle detallado porfa favor podrias podria'.split(' '));
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim()}
// Motor local de interpretación: sin API, admite variantes, errores de teclas y palabras en otro orden.
const families={
 guia:'guia guias giua guiaa guai guiaa manual instructivo instructivos instrucciones orientaciones procedimiento procedimientos proceso procesos reglamento',
 reserva:'reserva reservar reservo reservacion reservaciones apartar aparto separar solicito solicitado reservarlo resrva resrvar reserba agendar alquiler alquilar',
 ambiente:'ambiente ambientes espacio espacios sala salas salon salones aula aulas auditorio audtiorio audiotorio magna local localizacion lugar aulaa amibente espcaio',
 disponibilidad:'disponibilidad disponible disponibilidad horario horarios hora fechas fecha libre desocupado ocupacion',
 difusion:'difusion difundieron difundir publicacion publicaciones publicar publi publicidad promocion promocionar divulgar comunicacion postear post difucion difucsion',
 flyer:'flyer flayer flyier afiche poster pieza arte artegrafico png imagen',
 externos:'externos externo externa externos invitados invitado visitante visitantes terceros ajenos personal externo',
 ingreso:'ingreso ingresar entrada acceso acceder entrar porteria documento dni carnet carné placa vehiculo',
 presupuesto:'presupuesto dinero gastos gasto tesoreria rendicion rendir desembolso compras fondos 8f 2f boleta factura facturacion comprobante',
 evidencia:'evidencia evidencias informe informes acta actas registro registros asistencia fotos fotosografia encuesta resultado resultados drive documentacion cerrar cierre archivado archivos',
 visita:'visita visitas excursiones planta campo empresa minera instalacion instalaciones excursion movilidad epp seguro',
 charla:'charla charlas conferencia conferencias conversatorio webinar ponente expositor exposicion charlaa disertacion taller presentacion zoom',
 roles:'roles rol funciones funcion tarea tareas encargados responsables responsable comite comites cargo cargos directiva miembros presidencia secretaria marketing logistica rrpp talento operaciones',
 alpayana:'alpayana alpayna conectaa conecta practicas verano practica postulacion',
 asme:'asme integracion integrar integraciones actividad conjunta',
 nexa:'nexa nexa resources luis innovacion innovacionnn',
 chinalco:'chinalco toromocho gio centro gio'
};
const alias=new Map();for(const [canon,forms] of Object.entries(families)){for(const w of norm(forms).split(' '))if(w&&!alias.has(w))alias.set(w,canon)}
const vocabulary=[...alias.keys()];
function editDist(a,b){ // distancia Damerau: reconoce transposición, además de letras omitidas/repetidas
  let d=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
  for(let i=0;i<=a.length;i++)d[i][0]=i;
  for(let j=0;j<=b.length;j++)d[0][j]=j;
  for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){
    d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
    if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
  }return d[a.length][b.length];
}
const typoCache=new Map();
function canonical(w){if(alias.has(w))return alias.get(w);if(w.length<4||/^\d+$/.test(w))return w;
  if(typoCache.has(w))return typoCache.get(w);
  let closest='',best=Infinity,tie=false;
  for(const candidate of vocabulary){if(Math.abs(candidate.length-w.length)>2||candidate[0]!==w[0]&&candidate.length<6)continue;
    let dist=editDist(w,candidate),limit=w.length>=8?2:1;
    if(dist>limit)continue;
    if(dist<best){best=dist;closest=candidate;tie=false}else if(dist===best&&alias.get(closest)!==alias.get(candidate))tie=true;
  }
  const result=closest&&!tie?alias.get(closest):w;
  typoCache.set(w,result);return result;
}
function terms(s){return norm(s).split(' ').filter(Boolean).filter(w=>w.length>=3&&!stop.has(w)).map(canonical)}
function words(s){return [...new Set(terms(s))]}
function score(text,q){let n=norm(text),qwords=words(q);if(!qwords.length)return 0;
  const textTerms=new Set(terms(text));let matches=0;
  for(const w of qwords){if(textTerms.has(w)||n.includes(w))matches++}
  return matches*4+(matches===qwords.length?6:0)+(n.includes(norm(q))?12:0);
}
const topicTerms={
 reserva:{reserva:12,ambiente:9,disponibilidad:5},
 difusion:{difusion:12,flyer:8},
 externos:{externos:12,ingreso:7},
 presupuesto:{presupuesto:12},
 evidencia:{evidencia:12},
 visita:{visita:12},
 charla:{charla:12},
 roles:{roles:12}
};
function detectTopic(ts){const set=new Set(ts);return Object.entries(topicTerms).map(([id,weights])=>({id,points:Object.entries(weights).reduce((a,[k,v])=>a+(set.has(k)?v:0),0)})).sort((a,b)=>b.points-a.points)[0]}
function navigate(view){currentView=view;document.querySelectorAll('.view').forEach(el=>el.classList.toggle('active',el.id==='view-'+view));document.querySelectorAll('[data-view]').forEach(el=>el.classList.toggle('active',el.dataset.view===view));$('currentViewLabel').textContent=labels[view];$('sidebar').classList.remove('open');window.scrollTo({top:0,behavior:'instant'});if(view==='archivo')renderArchive();if(view==='asistente')$('chatInput').focus({preventScroll:true})}
function procedureCard(p){return `<button class="procedure-card" data-procedure="${p.id}"><div class="procedure-meta"><span>${h(p.category)}</span><span>${p.steps.length} pasos</span></div><div class="procedure-icon">${h(p.icon)}</div><h3>${h(p.name)}</h3><p>${h(p.caption)}</p><div class="procedure-foot"><span>Ver proceso y fuentes</span><strong>↗</strong></div></button>`}
function renderProcedures(q=''){const a=P.procedures.filter(p=>!q||score(p.name+' '+p.caption+' '+p.keywords.join(' ')+' '+p.intro,q)>0);$('procedureGrid').innerHTML=a.map(procedureCard).join('')||'<p>No hay procedimientos con ese término.</p>';$('procedureCount').textContent=a.length+' procedimientos'}
function renderHome(){const selected=['reserva','difusion','externos','evidencia'];$('homeProcedures').innerHTML=selected.map(id=>P.procedures.find(p=>p.id===id)).map(p=>`<button class="quick-row" data-procedure="${p.id}"><span class="quick-icon">${p.icon}</span><div><b>${h(p.name)}</b><small>${h(p.caption)}</small></div><span>↗</span></button>`).join('')}
function renderTimeline(){$('activityTimeline').innerHTML=P.timeline.map(t=>`<div class="timeline-entry"><article class="timeline-card"><div class="timeline-top"><span class="timeline-date">${h(t.date)}</span><span class="status ${t.type==='done'?'complete':'pending'}">${h(t.kind)}</span></div><h3>${h(t.title)}</h3><p>${h(t.desc)}</p><div class="timeline-next"><b>Próximo paso: </b>${h(t.next)}</div><div class="timeline-tags">${t.tags.map(x=>`<span>${h(x)}</span>`).join('')}</div></article></div>`).join('')}
function showModal(html){$('modalContent').innerHTML=html;$('modal').classList.remove('hidden');document.body.style.overflow='hidden'}
function closeModal(){$('modal').classList.add('hidden');document.body.style.overflow=''}
function doneKey(id){return 'smtec-steps-'+id}
function getDone(id){try{return JSON.parse(localStorage.getItem(doneKey(id))||'[]')}catch{return []}}
function procedureDetail(id){let p=P.procedures.find(x=>x.id===id);if(!p)return;let done=getDone(id);showModal(`<div class="modal-flag">${h(p.category.toUpperCase())} / PROCEDIMIENTO INTERNO</div><h2>${h(p.name)}</h2><p class="lead">${h(p.intro)}</p><ol>${p.steps.map((s,i)=>`<li><label><input type="checkbox" class="step-check" data-step="${i}" data-proc="${id}" ${done.includes(i)?'checked':''}>${h(s)}</label></li>`).join('')}</ol><div class="tip"><b>Importante:</b> ${h(p.important)}</div><div class="modal-footer"><span>Fuente: ${p.sources.map(h).join(' · ')}</span>${p.url?`<a href="${h(p.url)}" target="_blank" rel="noopener noreferrer">Abrir formulario oficial ↗</a>`:''}<button class="subtle-link" data-ask="${h('¿Cómo '+p.name.toLowerCase()+'?')}">Preguntar al asistente →</button></div>`)}
function renderArchive(q=''){const gate=$('archiveGate'),area=$('archiveAvailable');gate.classList.toggle('hidden',!!vault);area.classList.toggle('hidden',!vault);$('sideMode').textContent=vault?'Historial privado disponible':'Edición pública';if(!vault)return;const total=vault.pages.length;$('sourceCatalog').innerHTML=vault.sources.map(s=>s.url?`<a class="source-pill" href="${h(s.url)}" target="_blank" rel="noopener noreferrer">${h(s.title)} · ${s.pages} p. ↗</a>`:`<span class="source-pill">${h(s.title)} · ${s.pages} p.</span>`).join('');$('archiveCount').textContent= q?'Buscando en '+total+' secciones':total+' páginas/secciones indexadas';const results=q?vault.pages.map(p=>({...p,rank:score(p.text,q)+(score(p.source,q)?3:0)})).filter(x=>x.rank>0).sort((a,b)=>b.rank-a.rank).slice(0,55):vault.pages.slice(0,14);$('archiveResults').innerHTML=results.length?results.map(p=>`<article class="archive-item"><div class="archive-item-top"><h3>${h(p.source)}</h3><span>PÁGINA ${p.page}</span></div><p>${h(excerpt(p.text,q,530))}</p><button data-open-page="${h(p.id)}">Ver texto de la página ↗</button> ${p.url?`<a href="${h(p.url)}" target="_blank" rel="noopener noreferrer" class="subtle-link" style="margin-left:12px">PDF original ↗</a>`:''}</article>`).join(''):'<div class="archive-item"><p>No se encontraron coincidencias. Prueba términos más concretos.</p></div>';if(q)$('archiveCount').textContent=results.length+' resultados (máximo 55)'}
function excerpt(t,q,length=360){let txt=String(t).replace(/\s+/g,' ').trim();if(txt.length<=length)return txt;let pos=0;if(q){let s=norm(txt);for(let w of words(q)){let i=s.indexOf(w);if(i>=0){pos=Math.max(0,i-Math.floor(length*.32));break}}}return (pos?'…':'')+txt.slice(pos,pos+length)+(pos+length<txt.length?'…':'')}
function openPage(id){if(!vault)return;const p=vault.pages.find(p=>p.id===id);if(!p)return;showModal(`<div class="modal-flag">ARCHIVO HISTÓRICO / PÁGINA ${p.page}</div><h2>${h(p.source)}</h2><div class="document-text">${h(p.text)}</div><div class="modal-footer"><span>Texto extraído del documento original; puede haber diferencias de maquetación.</span>${p.url?`<a href="${h(p.url)}" target="_blank" rel="noopener noreferrer">Abrir PDF ↗</a>`:''}</div>`)}
function msg(type,content){let div=document.createElement('div');div.className='message'+(type==='user'?' user':'');div.innerHTML=`<div class="message-label">${type==='user'?'TU PREGUNTA':'ASISTENTE СМТЕК'}</div>${content}`;$('messages').appendChild(div);$('messages').scrollTop=$('messages').scrollHeight}
function sourceNote(p){return `<div class="source-note">Fuentes: ${p.sources.map(h).join(' · ')}. Comprueba vigencia de formularios y normas.</div>`}
function answer(q){
 const t=words(q),set=new Set(t),raw=norm(q);
 if(!raw)return '<p>Escribe una consulta para comenzar.</p>';
 let correction='';
 for(const w of raw.split(' ')){if(w.length>=4&&!alias.has(w)&&canonical(w)!==w){correction=`<div class="source-note">Interpreté «${h(w)}» como «${h(canonical(w))}» para buscar en la guía.</div>`;break}}
 const topic=detectTopic(t);
 const activity=[['alpayana',0],['asme',1],['nexa',2],['chinalco',3]].find(([token])=>set.has(token));
 const wantsStatus=/(cuando|fecha|dia|hora|horario|estado|avance|seguimiento|como va|confirmado|se acordo|que hay|quedo|ocurrio|que paso|sabemos|para cuando|practicas|verano)/.test(raw);
 if(activity&&(wantsStatus||topic.points<7)){
   let x=P.timeline[activity[1]];
   return `<p><b>${h(x.title)} · ${h(x.kind)}</b></p><p><b>Fecha de referencia:</b> ${h(x.date)}</p><p>${h(x.desc)}</p><p><b>Próximo paso:</b> ${h(x.next)}</p><div class="source-note">Fuente: registro de coordinación hasta el 1 de noviembre de 2026. Las fechas tentativas requieren confirmación.</div>${correction}`;
 }
 if(set.has('guia') && topic.points<7 || /(que sabes hacer|que puedo preguntar|que procedimientos|lista de tramites|todos los pasos|tienen una guia)/.test(raw) && topic.points<7){
   return `<p><b>Guía operativa de СМТЕК</b></p><p>Incluye ocho procesos que puedes consultar. Elige uno o escribe lo que necesitas hacer, aunque no recuerdes el nombre exacto del trámite:</p><ol>${P.procedures.map(p=>`<li><button class="subtle-link" data-procedure="${h(p.id)}">${h(p.name)} →</button></li>`).join('')}</ol><p><b>Regla general:</b> definir responsable y fecha tentativa, validar internamente, preparar brief, gestionar permisos, difundir, ejecutar y guardar evidencias.</p><div class="source-note">Fuente: Guía Operativa 2026–2027 · pp. 1–2 y 9–11.</div>${correction}`;
 }
 if(topic.points>=7){
   const p=P.procedures.find(x=>x.id===topic.id);
   return `<p><b>${h(p.name)}</b></p><p>${h(p.intro)}</p><ol>${p.steps.map(step=>`<li>${h(step)}</li>`).join('')}</ol><p><b>Importante:</b> ${h(p.important)}</p>${p.url?`<p><a href="${h(p.url)}" target="_blank" rel="noopener noreferrer">Abrir formulario oficial ↗</a></p>`:''}${sourceNote(p)}${correction}`;
 }
 if(vault){
   const ranked=vault.pages.map(p=>({p,v:score(p.text,q)})).filter(x=>x.v>=4).sort((a,b)=>b.v-a.v).slice(0,3);
   if(ranked.length)return `<p>Encontré estos fragmentos en el historial; puedes leer la página completa antes de sacar conclusiones:</p>${ranked.map(({p})=>`<div class="excerpt"><b>${h(p.source)} · p. ${p.page}</b><p>${h(excerpt(p.text,q,340))}</p><a href="#" data-open-page="${h(p.id)}">Leer página completa →</a></div>`).join('')}<div class="source-note">Búsqueda contextual en documentos disponibles hasta el 1 de noviembre de 2026.</div>${correction}`;
 }
 return `<p>No encontré una respuesta fiable para esa pregunta en la información disponible. Puedes consultarme, por ejemplo, <button class="subtle-link" data-ask="¿Cómo reservo un ambiente para una charla?">cómo reservar un ambiente</button>, <button class="subtle-link" data-ask="¿Cómo hago la difusión institucional?">cómo pedir difusión</button> o <button class="subtle-link" data-ask="Muéstrame la guía">ver la guía completa</button>.</p>${!vault?'<p>Para consultar el historial completo entra a <b>Archivo histórico</b> y desbloquea la bóveda cifrada.</p>':''}${correction}`;
}
function sendQuestion(q){q=q.trim();if(!q)return;msg('user',`<p>${h(q)}</p>`);msg('bot',answer(q))}
function initializeChat(){msg('bot','<p><b>Hola, soy el asistente documental de СМТЕК.</b> Puedo explicarte los procesos del capítulo paso a paso y señalar las fuentes utilizadas. ¿Qué necesitas organizar?</p>');const asks=['¿Cómo reservo el Auditorio o Aula Magna?','¿Cómo solicito difusión institucional?','¿Qué necesito para invitados externos?','¿Qué se acordó con Nexa?','¿Qué hace Tesorería con el 8F?'];$('prompts').innerHTML=asks.map(q=>`<button class="suggested" data-ask="${h(q)}">${h(q)} ↗</button>`).join('')}
function base64bytes(s){const t=atob(s);let out=new Uint8Array(t.length);for(let i=0;i<t.length;i++)out[i]=t.charCodeAt(i);return out}
async function decryptVault(enc,pass){if(!['SMTEC-VAULT-v1',String.fromCharCode(83,77,69,45,85,84,69,67,45,86,65,85,76,84,45,118,49)].includes(enc.format))throw Error('Archivo cifrado no reconocido');if(!window.crypto||!crypto.subtle)throw Error('Tu navegador necesita un contexto seguro (HTTPS o archivo local).');const raw=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:base64bytes(enc.salt),iterations:enc.iterations,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,['decrypt']);const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:base64bytes(enc.iv)},key,base64bytes(enc.data));let obj=JSON.parse(new TextDecoder().decode(clear));if(!obj.pages||!obj.sources)throw Error('El archivo no contiene documentos válidos');obj.pages.forEach(p=>{p.url=''});obj.sources.forEach(s=>{s.url='' });return obj}
async function unlockVault(){let pass=$('vaultPassword').value;if(!pass){$('vaultStatus').textContent='Escribe la contraseña de tu bóveda.';return}try{let item=uploadedVault;if(!item){if(location.protocol==='file:')throw Error('Selecciona el archivo vault.enc.json desde tu computadora.');const r=await fetch('./vault.enc.json',{cache:'no-store'});if(!r.ok)throw Error('No se encontró vault.enc.json. Puedes seleccionarlo manualmente.');item=await r.json()}$('vaultStatus').textContent='Descifrando…';let data=await decryptVault(item,pass);vault=data;$('vaultPassword').value='';renderArchive();$('vaultStatus').textContent='Bóveda desbloqueada en esta sesión.';alert('Archivo privado disponible. El historial ya se puede consultar y buscar desde el asistente.')}catch(e){$('vaultStatus').textContent='No se pudo abrir: '+e.message}}
$('nav').addEventListener('click',e=>{let b=e.target.closest('[data-view]');if(b)navigate(b.dataset.view)});document.body.addEventListener('click',e=>{let g=e.target.closest('[data-goto]');if(g)navigate(g.dataset.goto);let p=e.target.closest('[data-procedure]');if(p)procedureDetail(p.dataset.procedure);let a=e.target.closest('[data-ask]');if(a){e.preventDefault();closeModal();navigate('asistente');sendQuestion(a.dataset.ask)}let o=e.target.closest('[data-open-page]');if(o){e.preventDefault();openPage(o.dataset.openPage)}if(e.target.closest('[data-close]'))closeModal();});$('quickAsk').addEventListener('click',()=>navigate('asistente'));$('mobileMenu').addEventListener('click',()=>$('sidebar').classList.toggle('open'));$('closeModal').addEventListener('click',closeModal);document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();$('sidebar').classList.remove('open')}});$('modalContent').addEventListener('change',e=>{let t=e.target.closest('[data-step]');if(!t)return;let done=getDone(t.dataset.proc),i=Number(t.dataset.step);if(t.checked&&!done.includes(i))done.push(i);if(!t.checked)done=done.filter(a=>a!==i);try{localStorage.setItem(doneKey(t.dataset.proc),JSON.stringify(done))}catch{}});
$('procedureSearch').addEventListener('input',e=>renderProcedures(e.target.value));$('archiveSearch').addEventListener('input',e=>renderArchive(e.target.value));$('chatForm').addEventListener('submit',e=>{e.preventDefault();let q=$('chatInput').value;$('chatInput').value='';sendQuestion(q)});$('vaultFile').addEventListener('change',async e=>{try{uploadedVault=JSON.parse(await e.target.files[0].text());$('vaultStatus').textContent='Archivo cifrado seleccionado. Introduce la contraseña.'}catch{$('vaultStatus').textContent='El archivo seleccionado no es JSON válido.'}});$('unlockVault').addEventListener('click',unlockVault);$('vaultPassword').addEventListener('keydown',e=>{if(e.key==='Enter')unlockVault()});
renderHome();renderProcedures();renderTimeline();renderArchive();initializeChat();
})();
