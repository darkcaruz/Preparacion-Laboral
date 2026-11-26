import {supabaseConfig} from './config.js';
let client=null;
export async function getClient(){
 if(client)return client;
 if(!supabaseConfig.url||!supabaseConfig.anonKey)return null;
 const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
 client=createClient(supabaseConfig.url,supabaseConfig.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 return client;
}
export async function currentUser(){const c=await getClient();if(!c)return null;const {data,error}=await c.auth.getUser();if(error)return null;return data.user}
export async function signIn(email,password){const c=await getClient();if(!c)throw Error('Supabase no está configurado.');const {data,error}=await c.auth.signInWithPassword({email,password});if(error)throw error;return data}
export async function signUp(email,password){const c=await getClient();if(!c)throw Error('Supabase no está configurado.');const {data,error}=await c.auth.signUp({email,password});if(error)throw error;return data}
export async function signOut(){const c=await getClient();if(c){const {error}=await c.auth.signOut();if(error)throw error}}
export async function getAttempts(user){const c=await getClient();if(!c||!user)return [];const {data,error}=await c.from('attempts').select('*').order('completed_at',{ascending:false}).limit(200);if(error)throw error;return data||[]}
export async function saveAttempt(user,entry){const c=await getClient();if(!c||!user)throw Error('Sin sesión de nube');const {error}=await c.from('attempts').upsert({...entry,user_id:user.id},{onConflict:'id'});if(error)throw error}
export async function getDraft(user){const c=await getClient();if(!c||!user)return null;const {data,error}=await c.from('drafts').select('payload').eq('user_id',user.id).maybeSingle();if(error)throw error;return data?.payload||null}
export async function saveDraft(user,payload){const c=await getClient();if(!c||!user)throw Error('Sin sesión de nube');const {error}=await c.from('drafts').upsert({user_id:user.id,payload,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(error)throw error}
export async function clearDraft(user){const c=await getClient();if(!c||!user)throw Error('Sin sesión de nube');const {error}=await c.from('drafts').delete().eq('user_id',user.id);if(error)throw error}
