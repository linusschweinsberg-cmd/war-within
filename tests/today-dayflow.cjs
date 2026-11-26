/* Ganzer Tagesablauf: Hauptschlacht wählen, erledigen, rückgängig, neu laden, Tag schließen, verpassen, verschieben, Erholung – ohne Historienverlust. */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const script=[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(s=>s.includes('function loadState'));
const c=vm.createContext({window:{authApi:{}},React:{},htm:{bind:()=>()=>null},ReactDOM:{createRoot:()=>({render(){}})},document:{getElementById:()=>({})},localStorage:{getItem:()=>null},console});
for(const f of ['life-core.js','wisdom-core.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../rank-core.js'),'utf8'),c);
vm.runInContext(script+';globalThis.api={buildState,newOb,derive,todayBattle,chooseBattle,completePriority,compoundNow,dayKey,loadState,closeCalendarDay,battleObstacle};',c);
const a=c.api,LC=c.window.LC,test=(n,f)=>{f();console.log('PASS '+n)};
const fresh=()=>LC.ensureLife(a.buildState(a.newOb('Flow'),{mode:'guest',name:'Flow'}));
const battle=S=>a.todayBattle(S,a.derive(S));
const goal=(S,id)=>{const g=LC.addGoal(S,{...LC.GOAL_TPL.find(x=>x.id===id)});return LC.actionsOf(S.life,g.id)[0]};
const reload=S=>{c.localStorage.getItem=()=>JSON.stringify(S);return LC.ensureLife(a.loadState())};
function ctx(S0){let S=S0,undo=null;const k={get S(){return S},set S(x){S=x},upd(fn){S=structuredClone(S);fn(S)},restore(x){S=structuredClone(x)},toast(t,kind,o){undo=o&&o.undo},
 start(mid){const m=S.missions.find(x=>x.id===mid);if(S.done[mid])return;const before=S;k.upd(n=>{n.done[mid]=true;n.seasonPts+=m.pts;n.tally[mid]=(n.tally[mid]||0)+1;n.sTally[mid]=(n.sTally[mid]||0)+1;n.ctime[mid]=[...(n.ctime[mid]||[]),{t:600,day:a.dayKey(n)}];LC.onComplete(n,mid)});undo=()=>k.restore(before)},
 undo:()=>undo&&undo(),next(){k.upd(n=>a.closeCalendarDay(n,true))}};return k}
let k;
test('Choose, win, undo, win again, reload: state and history consistent',()=>{const S=fresh();const run=goal(S,'run5k'),lang=goal(S,'lang');k=ctx(S);
 a.chooseBattle(k,'m:'+lang.missionId);a.completePriority(k,battle(k.S));assert.equal(battle(k.S).done,true);k.undo();assert.equal(battle(k.S).done,false);
 a.completePriority(k,battle(k.S));const pts=k.S.seasonPts,L=reload(k.S),b=battle(L);assert.equal(b.done,true,'won survives reload');assert.equal(b.key,'m:'+lang.missionId);assert.equal(L.seasonPts,pts);
 assert.equal(a.compoundNow(L).total,1);k.S=L});
test('Next day: yesterday\'s choice does not carry over, history and totals stay',()=>{const before=a.compoundNow(k.S);k.next();assert.equal(battle(k.S),null,'new day starts with a choice');
 const C=a.compoundNow(k.S);assert.equal(C.total,before.total);assert.equal(C.season,before.season);assert.equal(k.S.life.log.length,1);assert.deepEqual({...C.momentum},{active:1,of:1,rest:0})});
test('A missed day is not dramatised: totals unchanged, momentum honest, nothing deleted',()=>{const logs=k.S.life.log.length;k.next();const C=a.compoundNow(k.S);assert.equal(C.total,1);assert.equal(k.S.life.log.length,logs);assert.deepEqual({...C.momentum},{active:1,of:2,rest:0})});
test('Postpone: the debrief "earlier" choice becomes tomorrow\'s explicit battle',()=>{const S=k.S,mid=S.life.actions.find(x=>x.title.startsWith('Lauf')).missionId;
 k.upd(n=>{LC.onDebrief(n,{mood:'ok',obst:['time'],change:'earlier',done:[],skipped:[mid]});n.nextPrio={k:n.season+'-'+(n.day+1),mid}});k.next();
 const b=battle(k.S);assert.equal(b.m.id,mid);assert.equal(b.source,'Von dir festgelegt');assert.equal(b.done,false);
 const ob=a.battleObstacle(k.S,b);assert.equal(ob.label,'Keine Zeit');assert.equal(ob.src,'recent')});
test('Evening plan with obstacle appears as morning briefing obstacle',()=>{const S=k.S,mid=S.life.actions.find(x=>x.title.startsWith('20 Min')).missionId;k.upd(n=>LC.onEvening(n,{mid,when:'morgens',risk:'energy'}));k.next();
 const b=battle(k.S);assert.equal(b.m.id,mid);assert.equal(b.source,'Gestern Abend festgelegt');assert.deepEqual({...a.battleObstacle(k.S,b)},{label:'Wenig Energie',src:'evening'})});
test('Rest or sickness: no obstacle, nothing skipped, day kept as deliberate pause',()=>{const S=k.S;
 k.upd(n=>{LC.onDebrief(n,{mood:'low',obst:[],done:[],skipped:[],change:null,recover:'sick'});if(!n.rest.includes(n.day))n.rest=[...n.rest,n.day]});
 const e=k.S.life.daily.at(-1);assert.equal(e.recover,'sick');assert.equal(e.skipped.length,0);assert.equal(LC.debriefPatterns(k.S).length,0);
 const m=a.compoundNow(k.S).momentum;assert.ok(m.rest>=1,'rest counted fairly');const streak=k.S.streak;k.next();assert.ok(k.S.streak>=streak,'pause does not break the streak');
 assert.equal(a.battleObstacle(k.S,{}).n,1,'sick day adds no obstacle');
});
test('Export/import round trip keeps v5, battle, history',()=>{const S=k.S;a.chooseBattle(k,null);const L=reload(k.S);assert.equal(L.v,5);assert.equal(L.battle.key,null);assert.equal(L.life.log.length,S.life.log.length);assert.equal(L.life.daily.length,S.life.daily.length)});
console.log('PASS today day flow');
