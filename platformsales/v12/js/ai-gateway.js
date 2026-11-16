/**
 * Nohva Platform AI client bridge. Requires supabase-auth.js first.
 * Provider secrets remain in Supabase Edge Function secrets.
 */
(function(){
 'use strict';
 const FUNCTION_URL='https://hnqjmbgztgkfzienptiy.supabase.co/functions/v1/nohva-ai';
 
 const PROVIDERS=Object.freeze({
  openai:{name:'OpenAI (ChatGPT)',availableLabel:'Disponible',unavailableLabel:'No disponible'},
  gemini:{name:'Gemini',availableLabel:'Disponible',unavailableLabel:'No disponible'},
  grok:{name:'Grok',availableLabel:'No disponible',unavailableLabel:'No disponible'},
  claude:{name:'Claude',availableLabel:'No disponible',unavailableLabel:'No disponible'}
 });
 let status=null;
 async function request(payload){
  if(!window.nohvaSupabase) throw new Error('La sesión segura de Nohva no está inicializada.');
  const {data,error}=await window.nohvaSupabase.auth.getSession();
  if(error||!data.session?.access_token) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
  const response=await fetch(FUNCTION_URL,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+data.session.access_token,'apikey':window.NOHVA_SUPABASE_ANON_KEY},body:JSON.stringify(payload),signal:AbortSignal.timeout(65000)}).catch(error=>{if(error.name==='TimeoutError'||error.name==='AbortError')throw new Error('La solicitud tardó demasiado. Gemini no respondió dentro del tiempo esperado; inténtalo nuevamente.');throw error;});
  const result=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(result.error||'No se pudo completar la solicitud de IA ('+response.status+').');
  return result;
 }
 async function refreshStatus(){const result=await request({action:'ping'});status=result.providers||{};return {...status};}
 function isAvailable(provider){return !!status&&!!status[provider];}
 function getStatus(){return status?{...status}:null;}
 async function chat(options){
  const provider=String(options?.provider||'').toLowerCase();
  if(!PROVIDERS[provider]) throw new Error('Proveedor de IA no reconocido.');
  if(status&&!status[provider]) throw new Error(PROVIDERS[provider].name+' no está disponible en este momento.');
  return request({action:'chat',mode:options?.mode||'design',provider,system:options?.system||'',messages:Array.isArray(options?.messages)?options.messages:[],tools:options?.tools||[],web:!!options?.web});
 }
 window.NohvaAI=Object.freeze({providers:PROVIDERS,refreshStatus,isAvailable,getStatus,chat});
})();
