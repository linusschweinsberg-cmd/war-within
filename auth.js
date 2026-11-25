/* Supabase authentication; game progress remains local to each browser/user. */
(() => {
  let client;
  const listeners = new Set();
  let latest;
  const recoveryKey = 'war_within_password_recovery';
  const redirectTo = () => location.origin + location.pathname;
  const user = u => ({id:u.id,email:u.email,name:u.user_metadata?.name||u.email?.split('@')[0]||'Du',mode:'supabase'});
  function getClient() {
    if(client)return client;
    const c=window.WAR_WITHIN_SUPABASE||{};
    if(!c.url||!c.publishableKey)throw new Error('Die E-Mail-Anmeldung ist noch nicht eingerichtet. Bitte vorerst als Gast fortfahren.');
    if(!/^https:\/\/[^/]+\/?$/.test(c.url)||c.publishableKey.startsWith('sb_secret_'))throw new Error('Ungültige Supabase-Konfiguration. Es wird ein öffentlicher Projektschlüssel benötigt.');
    if(c.publishableKey.split('.').length===3){try{const payload=JSON.parse(atob(c.publishableKey.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));if(payload.role!=='anon')throw Error();}catch(e){throw new Error('Es ist nur ein öffentlicher anon-Key erlaubt.');}}
    if(!window.supabase)throw new Error('Der Anmeldedienst konnte nicht geladen werden. Bitte Internetverbindung prüfen.');
    client=window.supabase.createClient(c.url,c.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    client.auth.onAuthStateChange((event,session)=>{
      if(event==='PASSWORD_RECOVERY')sessionStorage.setItem(recoveryKey,'1');
      if(event==='SIGNED_OUT')sessionStorage.removeItem(recoveryKey);
      latest={session:session?user(session.user):null,recovery:sessionStorage.getItem(recoveryKey)==='1'};
      listeners.forEach(fn=>fn(latest));
    });
    return client;
  }
  async function result(promise){const r=await promise;if(r.error)throw new Error(r.error.message);return r.data;}
  window.authApi={
    demo:false,
    async arenaRpc(name,args){if(!['arena_list','arena_snapshot','arena_command','arena_events','arena_hall'].includes(name))throw Error('Unbekannte Arena-Anfrage.');return result(getClient().rpc(name,args));},
    /* Live-Arena: Supabase Realtime auf neue bestätigte Punkte und Meldungen einer Arena (RLS: nur Mitglieder).
       Liefert nur ein Signal „neu laden“; Daten kommen weiter über arena_snapshot. Ohne Realtime: Status 'off'. */
    arenaWatch(league,onChange,onStatus=()=>{}){
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(league))){onStatus('off');return()=>{};}
      let c;try{c=getClient();}catch(e){onStatus('off');return()=>{};}
      if(!c.channel){onStatus('off');return()=>{};}
      const filter='league_id=eq.'+league,ping=()=>onChange();
      const ch=c.channel('arena:'+league)
        .on('postgres_changes',{event:'INSERT',schema:'public',table:'arena_score_events',filter},ping)
        .on('postgres_changes',{event:'INSERT',schema:'public',table:'arena_completions',filter},ping)
        .subscribe(st=>onStatus(st==='SUBSCRIBED'?'live':st==='CHANNEL_ERROR'||st==='TIMED_OUT'||st==='CLOSED'?'off':'connecting'));
      return()=>{try{c.removeChannel(ch);}catch(e){}};
    },
    async signUp({name,email,password}){const d=await result(getClient().auth.signUp({email:email.trim(),password,options:{data:{name},emailRedirectTo:redirectTo()}}));return{user:d.user?user(d.user):null,needsVerification:!d.session};},
    async signIn({email,password}){const d=await result(getClient().auth.signInWithPassword({email:email.trim(),password}));return{user:user(d.user)};},
    async resetPassword(email){await result(getClient().auth.resetPasswordForEmail(email.trim(),{redirectTo:redirectTo()}));return{sent:true};},
    async updatePassword(password){await result(getClient().auth.updateUser({password}));sessionStorage.removeItem(recoveryKey);latest={...latest,recovery:false};listeners.forEach(fn=>fn(latest));},
    async signOut(){await result(getClient().auth.signOut());},
    async restore(){const d=await result(getClient().auth.getSession());return latest||{session:d.session?user(d.session.user):null,recovery:sessionStorage.getItem(recoveryKey)==='1'};},
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}
  };
})();
