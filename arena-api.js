/* Only reviewed Arena RPCs and explicit public fields cross the network. */
(function(G){
 'use strict';
 function create(rpc){
  async function call(name,args){try{return await rpc(name,args)}catch(e){const message=String(e.message||e);if(/PGRST202|schema cache|Could not find the function|does not exist/i.test(message))throw Error('Die gemeinsame Arena ist noch nicht freigeschaltet. Deine persönlichen Daten bleiben unverändert.');if(/fetch|network|offline|Failed to fetch/i.test(message))throw Error('Keine Verbindung. Bitte erneut versuchen; der letzte Stand bleibt sichtbar.');throw Error(message);}}
  const pick=t=>Object.fromEntries(G.ArenaCore.SLOTS.map(s=>[s.id,t[s.id]]));
  const command=(action,id,data)=>call('arena_command',{p_action:action,p_league:id||null,p_data:data||{}});
  return{
   list:()=>call('arena_list',{}),load:id=>call('arena_snapshot',{p_league:id}),
   create:({name,displayName,capacity,targets})=>{const t=targets||G.ArenaCore.DEFAULT_TARGETS;if(!G.ArenaCore.validTargets(t))return Promise.reject(Error('Wähle für jeden Bereich ein bis sieben Tage.'));return command('create',null,{name:String(name).trim().slice(0,40),display_name:String(displayName).trim().slice(0,24),capacity:Number(capacity),targets:pick(t)});},
   join:({code,displayName})=>command('join',null,{code:String(code).trim().toUpperCase(),display_name:String(displayName).trim().slice(0,24)}),
   start:id=>command('start',id),
   formation:(id,week,kind,slot,plan)=>command('formation',id,{week,kind,slot,plan}),
   events:(id,before)=>call('arena_events',{p_league:id,p_before:before||null}),
   setTargets:(id,targets)=>{if(!G.ArenaCore.validTargets(targets))return Promise.reject(Error('Wähle für jeden Bereich ein bis sieben Tage.'));return command('targets',id,{targets:pick(targets)});},
   report:(id,slot,done)=>command('report',id,{slot:String(slot),done:done===true}),
   react:(id,event,kind)=>command('react',id,{event,kind}),
   /* Receipts are random ownership codes, never task names or personal text. */
   claim:async(slot,userId)=>{const receipts=[],errors=[];if(!G.ArenaCore.SLOTS.some(s=>s.id===slot))return{receipts,errors};for(const l of (await call('arena_list',{}))||[]){if(!l.start_date)continue;
    try{const s=await call('arena_snapshot',{p_league:l.id}),p=G.ArenaCore.phase(s);if(s.user_id!==userId||p.kind!=='running')continue;
     const mine=s.completions.filter(e=>e.user_id===userId&&e.slot===slot&&e.week===p.week);
     if(mine.some(e=>e.day===s.today)||mine.length>=G.ArenaCore.targetsOf(s)[slot])continue;
     const receipt={league:l.id,slot,source:G.crypto.randomUUID(),day:s.today,userId};receipts.push(receipt);
     await command('report',l.id,{slot,done:true,origin:'automatic',source:receipt.source,expected_user:userId});
    }catch(e){errors.push(e.message)}}return{receipts,errors};},
   retract:async(receipts)=>{for(const x of receipts)await command('report',x.league,{slot:x.slot,done:false,origin:'automatic',source:x.source,expected_user:x.userId});}

  };
 }
 /* Serialize each slot; register every contributing task before network responses. */
 function bridge({api,userId,onError=()=>{},onSaved=()=>{}}){const tasks=new Map(),groups=new Map();let disposed=false;
  function schedule(group){group.tail=group.tail.catch(()=>{}).then(async()=>{if(disposed)return;
   const wanted=()=>!disposed&&[...tasks.values()].some(x=>x.day===group.day&&x.slot===group.slot);
   try{if(wanted()){const result=await api.claim(group.slot,userId);group.receipts.push(...result.receipts);if(result.errors.length&&!disposed)onError();else if(result.receipts.length&&wanted())onSaved(group.slot);}
    if(!disposed&&!wanted()&&group.receipts.length){await api.retract(group.receipts);group.receipts=[];}
   }catch(e){if(!disposed)onError();}
  });return group.tail;}
  return{add(key,slot,day){if(disposed)return;tasks.set(key,{slot,day});const id=day+'|'+slot;if(!groups.has(id))groups.set(id,{day,slot,receipts:[],tail:Promise.resolve()});return schedule(groups.get(id));},
   reconcile(day,done){const changed=new Set();for(const [key,x] of tasks){if(x.day!==day){tasks.delete(key);continue;}if(!done(key)){tasks.delete(key);changed.add(day+'|'+x.slot)}}return Promise.all([...changed].map(id=>schedule(groups.get(id))));},
   dispose(){disposed=true;tasks.clear();},idle(){return Promise.all([...groups.values()].map(g=>g.tail))}};
 }
 G.ArenaSync={bridge};
 G.ArenaApi={create};G.arenaApi=create((name,args)=>G.authApi.arenaRpc(name,args));
})(typeof window==='undefined'?globalThis:window);
