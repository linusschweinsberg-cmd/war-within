// Mock-only auth lifecycle; no SDK/network/email calls.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../auth.js'),'utf8');
const user={id:'alice',email:'alice@example.com',user_metadata:{name:'Alice',access_token:'META_SECRET'}};
const session={user,access_token:'ACCESS_SECRET',refresh_token:'REFRESH_SECRET'};
function setup(shared=new Map(),blocked=false){
 let cb,remote=session,err=null,resolve;const calls=[],writes=[];
 const reply=(name,args,data)=>{calls.push({name,args});const error=err;err=null;return Promise.resolve({data,error})};
 const auth={onAuthStateChange:fn=>cb=fn,signUp:a=>reply('signup',a,{user,session:null}),signInWithPassword:a=>reply('login',a,{user,session}),resetPasswordForEmail:(...a)=>reply('reset',a,{}),updateUser:a=>reply('update',a,{user}),signOut:()=>reply('logout',{},{}),getSession:()=>reply('restore',{}, {session:remote})};
 const c=vm.createContext({window:{WAR_WITHIN_SUPABASE:{url:'https://test.supabase.co',publishableKey:'sb_publishable_test'},supabase:{createClient:()=>({auth})}},location:{origin:'https://app.example',pathname:'/war-within/',hash:'#access_token=ACCESS_SECRET&type=recovery',search:'?code=CODE_SECRET'},sessionStorage:{getItem:k=>{if(blocked)throw Error();return shared.get(k)},setItem:(k,v)=>{if(blocked)throw Error();writes.push([k,v]);shared.set(k,v)},removeItem:k=>{if(blocked)throw Error();shared.delete(k)}},localStorage:{setItem:(k,v)=>writes.push([k,v])},atob:s=>Buffer.from(s,'base64').toString(),fetch(){throw Error('Network forbidden')}});
 vm.runInContext(source,c);return{api:c.window.authApi,c,auth,calls,writes,shared,emit:(e,s)=>cb(e,s),fail:m=>err={message:m},remote:s=>remote=s,defer:()=>auth.getSession=()=>new Promise(r=>resolve=r),resolve:s=>resolve({data:{session:s},error:null})};
}
(async()=>{
 const h=setup(),a=h.api;const signup=await a.signUp({name:'Alice',email:' alice@example.com ',password:'PASSWORD_SECRET'});assert.equal(signup.needsVerification,true);
 assert.equal(h.calls[0].args.options.emailRedirectTo,'https://app.example/war-within/');
 assert.equal((await a.signIn({email:user.email,password:'PASSWORD_SECRET'})).user.id,'alice');assert.equal(h.calls[1].args.password,'PASSWORD_SECRET');
 h.fail('Invalid credentials');await assert.rejects(a.signIn({email:user.email,password:'bad'}),/Invalid/);
 await a.resetPassword(user.email);assert.equal(h.calls.at(-1).args[1].redirectTo,'https://app.example/war-within/');h.fail('Rate limit');await assert.rejects(a.resetPassword(user.email),/Rate limit/);
 let state;const off=a.subscribe(s=>state=s);h.emit('PASSWORD_RECOVERY',session);assert.equal(state.recovery,true);
 const reload=setup(h.shared);assert.equal((await reload.api.restore()).recovery,true);
 const switched=setup(new Map(h.shared));switched.remote({user:{id:'bob'}});assert.equal((await switched.api.restore()).recovery,false);switched.remote(session);assert.equal((await switched.api.restore()).recovery,false);
 const immediate=setup();immediate.auth.signUp=async()=>({data:{user,session},error:null});assert.equal((await immediate.api.signUp({name:'Alice',email:user.email,password:'PASSWORD_SECRET'})).needsVerification,false);
 h.fail('Update failed');await assert.rejects(a.updatePassword('NEW_SECRET'),/Update failed/);assert.equal(state.recovery,true);await a.updatePassword('NEW_SECRET');assert.equal(state.recovery,false);
 const fresh=setup(),restored=await fresh.api.restore();assert.equal(restored.session.id,'alice');fresh.remote(null);assert.equal((await fresh.api.restore()).session,null);
 h.emit('PASSWORD_RECOVERY',session);h.emit('SIGNED_IN',{user:{id:'bob'}});assert.equal(state.recovery,false);
 h.emit('PASSWORD_RECOVERY',session);h.fail('Logout failed');await assert.rejects(a.signOut(),/Logout failed/);assert.equal(state.session.id,'alice');await a.signOut();assert.equal(state.session,null);assert.equal(h.shared.size,0);
 const race=setup();await race.api.restore();race.defer();const pending=race.api.restore();race.emit('SIGNED_OUT',null);race.resolve(session);assert.equal((await pending).session,null);
 a.subscribe(()=>{throw Error('bad UI listener')});h.emit('TOKEN_REFRESHED',session);assert.equal(state.session.id,'alice');off();h.emit('SIGNED_OUT',null);assert.equal(state.session.id,'alice');
 const blocked=setup(new Map(),true);await blocked.api.restore();blocked.emit('PASSWORD_RECOVERY',session);assert.equal((await blocked.api.restore()).recovery,true);await blocked.api.signOut();
 // Actual unchanged app serializer receives the adapter's safe projection.
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');const serializer=html.slice(html.indexOf('const saveAuth='),html.indexOf('const EMAIL_RE='));
 vm.runInContext("const AUTH_KEY='war_within_auth_v1';"+serializer+';globalThis.persistAuth=saveAuth;',h.c);
 h.c.persistAuth({session:restored.session,account:signup.user,onboarded:true});h.c.localStorage.setItem('war_within_acc_v1_alice',JSON.stringify({profile:restored.session,life:{}}));
 const output=JSON.stringify(h.writes);for(const secret of ['PASSWORD_SECRET','NEW_SECRET','ACCESS_SECRET','REFRESH_SECRET','META_SECRET','CODE_SECRET'])assert.ok(!output.includes(secret),secret+' leaked');assert.ok(!/access_token|refresh_token/.test(output));
 for(const key of ['sb_secret_no','unknown','e30.'+Buffer.from('{"role":"service_role"}').toString('base64')+'.sig']){const bad=setup();bad.c.window.WAR_WITHIN_SUPABASE.publishableKey=key;await assert.rejects(bad.api.restore(),/öffentlicher|anon/)}
 const missing=setup();missing.c.window.WAR_WITHIN_SUPABASE={};await assert.rejects(missing.api.restore(),/noch nicht eingerichtet/);
 console.log('PASS auth: signup/login/errors, reset/redirect/reload, password update, signout/failure, session restore/race, account isolation, blocked storage, serializer secret isolation; zero network.');
})().catch(e=>{console.error(e);process.exitCode=1});
