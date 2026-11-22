/* Supabase authentication; game progress remains local to each browser/user. */
(() => {
  let client;
  const listeners = new Set();
  let latest;
  let revision=0;
  const recoveryKey = 'war_within_password_recovery';
  const redirectTo = () => location.origin + location.pathname;
  const user = u => ({id:u.id,email:u.email,name:u.user_metadata?.name||u.email?.split('@')[0]||'Du',mode:'supabase'});
  // App storage only receives this projection, never the Supabase Session object.
  const recoveryStore={get(){try{return sessionStorage.getItem(recoveryKey)}catch(e){return null}},set(id){try{if(id)sessionStorage.setItem(recoveryKey,id);else sessionStorage.removeItem(recoveryKey)}catch(e){}}};
  let recoveryUser=null;
  function publish(session,event){
    const id=session?.user?.id;
    if(event==='PASSWORD_RECOVERY'&&id){recoveryUser=id;recoveryStore.set(id)}
    else if(!id||(recoveryUser&&recoveryUser!==id)||(recoveryStore.get()&&recoveryStore.get()!==id)){recoveryUser=null;recoveryStore.set(null)}
    latest={session:session?user(session.user):null,recovery:!!id&&(recoveryUser===id||recoveryStore.get()===id)};
    revision++;
    listeners.forEach(fn=>{try{fn(latest)}catch(e){/* One UI listener must not interrupt SDK auth events. */}});
    return latest;
  }
  function getClient() {
    if(client)return client;
    const c=window.WAR_WITHIN_SUPABASE||{};
    if(!c.url||!c.publishableKey)throw new Error('Die E-Mail-Anmeldung ist noch nicht eingerichtet. Bitte vorerst als Gast fortfahren.');
    if(!/^https:\/\/[^/]+\/?$/.test(c.url)||typeof c.publishableKey!=='string'||(!c.publishableKey.startsWith('sb_publishable_')&&c.publishableKey.split('.').length!==3))throw new Error('Ungültige Supabase-Konfiguration. Es wird ein öffentlicher Projektschlüssel benötigt.');
    if(c.publishableKey.split('.').length===3){try{const payload=JSON.parse(atob(c.publishableKey.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));if(payload.role!=='anon')throw Error();}catch(e){throw new Error('Es ist nur ein öffentlicher anon-Key erlaubt.');}}
    if(!window.supabase)throw new Error('Der Anmeldedienst konnte nicht geladen werden. Bitte Internetverbindung prüfen.');
    client=window.supabase.createClient(c.url,c.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    client.auth.onAuthStateChange((event,session)=>publish(session,event));
    return client;
  }
  async function result(promise){const r=await promise;if(r.error)throw new Error(r.error.message);return r.data;}
  window.authApi={
    demo:false,
    async signUp({name,email,password}){const d=await result(getClient().auth.signUp({email:email.trim(),password,options:{data:{name},emailRedirectTo:redirectTo()}}));return{user:d.user?user(d.user):null,needsVerification:!d.session};},
    async signIn({email,password}){const d=await result(getClient().auth.signInWithPassword({email:email.trim(),password}));return{user:user(d.user)};},
    async resetPassword(email){await result(getClient().auth.resetPasswordForEmail(email.trim(),{redirectTo:redirectTo()}));return{sent:true};},
    async updatePassword(password){await result(getClient().auth.updateUser({password}));recoveryUser=null;recoveryStore.set(null);if(latest){latest={...latest,recovery:false};listeners.forEach(fn=>{try{fn(latest)}catch(e){}})}},
    async signOut(){await result(getClient().auth.signOut());publish(null,'SIGNED_OUT');},
    async restore(){const auth=getClient().auth,started=revision;const d=await result(auth.getSession());return revision!==started?latest:publish(d.session,'RESTORED');},
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}
  };
})();
