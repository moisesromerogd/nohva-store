/**
 * Nohva Platform v12 — Supabase Auth bootstrap
 * This module is a foundation only; it is not wired into the legacy localStorage
 * modules until the data migration and RLS policies have been tested.
 *
 * Configure the public Supabase URL and anon key below. Never place service_role
 * keys or provider API secrets in this file.
 */
const NOHVA_SUPABASE_URL = 'https://hnqjmbgztgkfzienptiy.supabase.co';
const NOHVA_SUPABASE_ANON_KEY = 'REPLACE_WITH_EXISTING_SUPABASE_ANON_KEY';

const nohvaSupabase = window.supabase.createClient(
  NOHVA_SUPABASE_URL,
  NOHVA_SUPABASE_ANON_KEY,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

let nohvaSession = null;
let nohvaProfile = null;

async function nohvaRequireSession() {
  const { data: { session }, error } = await nohvaSupabase.auth.getSession();
  if (error) throw error;
  if (!session) {
    window.location.replace('./login.html');
    return null;
  }
  const { data: profile, error: profileError } = await nohvaSupabase
    .from('platform_profiles')
    .select('user_id, display_name, role, active')
    .eq('user_id', session.user.id)
    .single();
  if (profileError || !profile || !profile.active) {
    await nohvaSupabase.auth.signOut();
    window.location.replace('./login.html?reason=unauthorized');
    return null;
  }
  nohvaSession = session;
  nohvaProfile = profile;
  document.documentElement.dataset.role = profile.role;
  document.documentElement.dataset.userId = session.user.id;
  return { session, profile };
}

function nohvaIsOwner() {
  return !!nohvaProfile && nohvaProfile.role === 'owner';
}

async function nohvaSignIn(email, password) {
  const { data, error } = await nohvaSupabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function nohvaSignOut() {
  const { error } = await nohvaSupabase.auth.signOut();
  if (error) throw error;
  window.location.replace('./login.html');
}

/** Owner-only navigation guard. This is UX only; RLS remains the real boundary. */
function nohvaGuardOwnerElements() {
  if (nohvaIsOwner()) return;
  document.querySelectorAll('[data-owner-only]').forEach(el => el.remove());
}

window.nohvaSupabase = nohvaSupabase;
window.nohvaRequireSession = nohvaRequireSession;
window.nohvaSignIn = nohvaSignIn;
window.nohvaSignOut = nohvaSignOut;
window.nohvaIsOwner = nohvaIsOwner;
window.nohvaGuardOwnerElements = nohvaGuardOwnerElements;
