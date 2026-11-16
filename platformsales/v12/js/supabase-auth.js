/**
 * Nohva Platform v12 — Supabase Auth bootstrap.
 * Public anon key only; provider API keys and service_role never belong in the browser.
 */
const NOHVA_SUPABASE_URL = 'https://hnqjmbgztgkfzienptiy.supabase.co';
const NOHVA_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhucWptYmd6dGdrZnppZW50aXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2ODUyNTIsImV4cCI6MjEwODI2MTI1MH0.JIHC8MmoDiSVwuzbxiUXxa1uurtozu8VLBbm0d7nCGc';
window.NOHVA_SUPABASE_ANON_KEY = NOHVA_SUPABASE_ANON_KEY;
const nohvaSupabase = window.supabase.createClient(NOHVA_SUPABASE_URL, NOHVA_SUPABASE_ANON_KEY, {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let nohvaSession=null, nohvaProfile=null;
async function nohvaRequireSession(){
 const {data:{session},error}=await nohvaSupabase.auth.getSession(); if(error) throw error;
 if(!session){window.location.replace('../login.html');return null;}
 const {data:profile,error:pe}=await nohvaSupabase.from('platform_profiles').select('user_id,display_name,role,active').eq('user_id',session.user.id).single();
 if(pe||!profile||!profile.active){await nohvaSupabase.auth.signOut();window.location.replace('../login.html?reason=unauthorized');return null;}
 nohvaSession=session;nohvaProfile=profile;document.documentElement.dataset.role=profile.role;document.documentElement.dataset.userId=session.user.id;return {session,profile};
}
function nohvaIsOwner(){return !!nohvaProfile&&nohvaProfile.role==='owner';}
function nohvaGuardOwnerElements(){if(nohvaIsOwner())return;document.querySelectorAll('[data-owner-only]').forEach(el=>el.remove());}
function nohvaResolveLoginIdentifier(identifier){const value=String(identifier||'').trim().toLowerCase();const aliases={moises:'moises@nohvastore.com',shannon:'shannon@nohvastore.com'};return aliases[value]||value;}
async function nohvaSignIn(identifier,password){const email=nohvaResolveLoginIdentifier(identifier);const {data,error}=await nohvaSupabase.auth.signInWithPassword({email,password});if(error)throw error;return data;}
async function nohvaSignOut(){const {error}=await nohvaSupabase.auth.signOut();if(error)throw error;window.location.replace('../login.html');}
window.nohvaSupabase=nohvaSupabase;window.nohvaRequireSession=nohvaRequireSession;window.nohvaIsOwner=nohvaIsOwner;window.nohvaGuardOwnerElements=nohvaGuardOwnerElements;window.nohvaSignIn=nohvaSignIn;window.nohvaSignOut=nohvaSignOut;window.nohvaResolveLoginIdentifier=nohvaResolveLoginIdentifier;window.nohvaGetProfile=()=>nohvaProfile;window.nohvaGetSession=()=>nohvaSession;
