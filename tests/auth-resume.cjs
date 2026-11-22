/* Actual Root + SDK restore lifecycle, no network or credentials. */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const script=[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(s=>s.includes('function loadState'));
async function restore(saved,session){const states=[],effects=[],storage=new Map([['war_within_auth_v1',JSON.stringify(saved)]]);if(saved.onboarded&&saved.session?.id)storage.set('war_within_acc_v1_'+saved.session.id,'{}');let cursor=0;
 const React={useState(init){const i=cursor++;states[i]=typeof init==='function'?init():init;return[states[i],v=>states[i]=typeof v==='function'?v(states[i]):v]},useEffect:f=>effects.push(f),useCallback:f=>f};
 const c=vm.createContext({React,window:{authApi:{subscribe:()=>()=>{},restore:async()=>({session,recovery:false})}},htm:{bind:()=>()=>null},ReactDOM:{createRoot:()=>({render(){}})},document:{getElementById:()=>({})},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},console});
 for(const f of ['life-core.js','wisdom-core.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
 vm.runInContext(script+';Root();',c);effects.forEach(f=>f());await Promise.resolve();await Promise.resolve();return{state:states[0],saved:JSON.parse(storage.get('war_within_auth_v1'))};
}
(async()=>{const alice={id:'alice',mode:'supabase',name:'Test'},ob={obv:2,story:true,step:12,audit:{now:'PRIVATE_TEST'}};
 let r=await restore({session:alice,onboarded:false,ob},alice);assert.equal(r.state.ob.audit.now,'PRIVATE_TEST');assert.equal(r.saved.ob.step,12);assert.equal(r.state.onboarded,false);
 r=await restore({session:null,obUserId:'alice',onboarded:false,ob},alice);assert.equal(r.state.ob.step,12);
 r=await restore({session:alice,onboarded:false,ob},{id:'bob',mode:'supabase'});assert.equal(r.state.ob,null);assert.equal(r.saved.obUserId,null,'never expose another account draft');
 r=await restore({session:{mode:'guest'},guestOb:true,ob},null);assert.equal(r.state.ob.step,12);assert.equal(r.state.guestOb,true);
 r=await restore({session:alice,onboarded:true,ob:null},alice);assert.equal(r.state.onboarded,true);assert.equal(r.saved.ob,null);
 console.log('PASS Root restore: account draft, owner marker, cross-account isolation, guest resume, returning user');
})().catch(e=>{console.error(e);process.exitCode=1});
