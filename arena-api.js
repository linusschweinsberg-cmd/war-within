/* Only reviewed Arena RPCs and explicit public fields cross the network. */
(function(G){
 'use strict';
 function create(rpc){
  async function call(name,args){try{return await rpc(name,args)}catch(e){const message=String(e.message||e);if(/PGRST202|schema cache|Could not find the function|does not exist/i.test(message))throw Error('Die gemeinsame Arena ist noch nicht freigeschaltet. Deine persönlichen Daten bleiben unverändert.');if(/fetch|network|offline|Failed to fetch/i.test(message))throw Error('Keine Verbindung. Bitte erneut versuchen; der letzte Stand bleibt sichtbar.');throw Error(message);}}
  const command=(action,id,data)=>call('arena_command',{p_action:action,p_league:id||null,p_data:data||{}});
  return{
   list:()=>call('arena_list',{}),load:id=>call('arena_snapshot',{p_league:id}),
   create:({name,displayName,capacity})=>command('create',null,{name:String(name).trim().slice(0,40),display_name:String(displayName).trim().slice(0,24),capacity:Number(capacity)}),
   join:({code,displayName})=>command('join',null,{code:String(code).trim().toUpperCase(),display_name:String(displayName).trim().slice(0,24)}),
   start:id=>command('start',id),
   save:(id,week,targets)=>{if(!G.ArenaCore.validTargets(targets))return Promise.reject(Error('Wähle für jeden Bereich ein bis sieben Tage.'));return command('lineup',id,{week:Number(week),targets:Object.fromEntries(G.ArenaCore.SLOTS.map(s=>[s.id,targets[s.id]]))});},
   report:(id,slot,done)=>command('report',id,{slot:String(slot),done:done===true}),
   react:(id,event,kind)=>command('react',id,{event,kind})
  };
 }
 G.ArenaApi={create};G.arenaApi=create((name,args)=>G.authApi.arenaRpc(name,args));
})(typeof window==='undefined'?globalThis:window);
