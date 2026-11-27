/* Invitation survives a clean email return URL; no network or real accounts. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),store=new Map(),storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
const c=vm.createContext({URL,window:{},console});vm.runInContext(fs.readFileSync(path.join(root,'arena-core.js'),'utf8'),c);
const A=c.window.ArenaCore,code='0123456789ABCDEF',base='https://example.com/war-within/',now=1000000000;
assert.equal(A.pendingInvitation(storage,base+'?arena='+code.toLowerCase()+'&private=never-store',now),code);
assert.equal(store.size,1);assert.deepEqual(Object.keys(JSON.parse([...store.values()][0])).sort(),['code','until']);
assert.equal(A.pendingInvitation(storage,base+'#access_token=never-store',now+1000),code,'email confirmation in another tab on same browser');
assert.equal(A.pendingInvitation(storage,base+'?arena=invalid',now+2000),code,'malformed URL does not overwrite valid invitation');
assert.equal(A.pendingInvitation(storage,base,now+7*86400000),'','expired code is removed');assert.equal(store.size,0);
assert.equal(A.pendingInvitation(storage,base+'?arena='+code,now),code);A.clearInvitation(storage);assert.equal(A.pendingInvitation(storage,base,now+1),'');
const denied={getItem(){throw Error('denied')},setItem(){throw Error('denied')},removeItem(){throw Error('denied')}};
assert.equal(A.pendingInvitation(denied,base+'?arena='+code,now),code,'current invitation works without storage');assert.equal(A.pendingInvitation(denied,base,now),'');A.clearInvitation(denied);
storage.setItem('war_within_arena_invite_v1','{broken');assert.equal(A.pendingInvitation(storage,base,now),'');
storage.setItem('war_within_arena_invite_v1',JSON.stringify({code,until:now+8*86400000}));assert.equal(A.pendingInvitation(storage,base,now),'','reject unbounded expiry');

/* Execute actual Root and inspect the auth prop passed to App after confirmation. */
const source=fs.readFileSync(path.join(root,'index.html'),'utf8'),script=[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(s=>s.includes('function loadState'));
let cursor=0;const states=[{session:{mode:'supabase',id:'test',name:'Test'},onboarded:true},true,'',{init:null,key:0}];
const React={useState(init){const i=cursor++;if(!(i in states))states[i]=typeof init==='function'?init():init;return[states[i],v=>states[i]=typeof v==='function'?v(states[i]):v]},useCallback:f=>f,useEffect(){}};
const location={href:base+'?arena='+code+'&keep=yes#fragment'},history={replaceState(a,b,url){location.href=url}};
const ctx=vm.createContext({React,window:{authApi:{}},URL,location,history,localStorage:storage,htm:{bind:()=> (strings,...values)=>({strings,values})},ReactDOM:{createRoot:()=>({render(){}})},document:{getElementById:()=>({})},console});
for(const file of ['life-core.js','wisdom-core.js','arena-core.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
vm.runInContext(script+';globalThis.renderRoot=Root',ctx);
let tree=ctx.renderRoot(),auth=tree.values.find(v=>v&&typeof v.clearInvite==='function');assert.equal(auth.invite,code);
location.href=base;states.length=4;cursor=0;tree=ctx.renderRoot();auth=tree.values.find(v=>v&&typeof v.clearInvite==='function');assert.equal(auth.invite,code,'Root restores invitation after email redirect with no query');
location.href=base+'?arena='+code+'&keep=yes#fragment';auth.clearInvite();assert.equal(new URL(location.href).searchParams.has('arena'),false);assert.equal(new URL(location.href).searchParams.get('keep'),'yes');assert.equal(new URL(location.href).hash,'#fragment');
cursor=0;tree=ctx.renderRoot();assert.equal(tree.values.find(v=>v&&typeof v.clearInvite==='function').invite,'');
console.log('PASS arena invitation: valid code only, seven-day expiry, confirmation/new tab, storage errors, actual Root restore and discard without token/query leakage');
