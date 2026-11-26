async function api(path,method='GET',body={}){
 const res=await fetch('/api/'+path,{method,credentials:'same-origin',...(method==='GET'?{}:{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})});
 if(res.status===401&&path==='me')return null;
 const data=await res.json();if(!res.ok)throw Error(data.error||'Error de conexión');return data;
}
export async function getClient(){return true}
export async function currentUser(){return api('me')}
export async function signIn(email,password){return api('login','POST',{email,password})}
export async function signUp(email,password){return api('signup','POST',{email,password})}
export async function signOut(){return api('logout','POST')}
export async function getAttempts(){return api('attempts')}
export async function saveAttempt(user,entry){return api('attempts','POST',entry)}
export async function getDraft(){return api('draft')}
export async function saveDraft(user,payload){return api('draft','PUT',payload)}
export async function clearDraft(){return api('draft','DELETE')}
