/* Hauptschlacht, Sieg-Rückmeldung, Rückgängig und Compound-Zahlen auf Heute. */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const script=[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(s=>s.includes('function loadState'));
const c=vm.createContext({window:{authApi:{}},React:{},htm:{bind:()=>()=>null},ReactDOM:{createRoot:()=>({render(){}})},document:{getElementById:()=>({})},localStorage:{getItem:()=>null},console});
for(const f of ['life-core.js','wisdom-core.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
vm.runInContext(script+';globalThis.api={buildState,newOb,derive,todayPriorities,todayBattle,chooseBattle,completePriority,compoundNow,momentumOf,dayKey,loadState,SDAYS};',c);
const a=c.api,LC=c.window.LC,test=(n,f)=>{f();console.log('PASS '+n)};
const fresh=()=>LC.ensureLife(a.buildState(a.newOb('Test'),{mode:'guest',name:'Test'}));
const battle=S=>a.todayBattle(S,a.derive(S));
const goal=(S,id='skill')=>{const g=LC.addGoal(S,{...LC.GOAL_TPL.find(x=>x.id===id)});return{g,ac:LC.actionsOf(S.life,g.id)[0]}};
/* Kontext wie in der App: upd arbeitet auf einer Kopie, restore setzt den Snapshot zurück, start bildet complete() mit Sperre nach. */
function ctx(S0){let S=S0,undo=null;const lock={};
 const k={get S(){return S},upd(fn){S=structuredClone(S);fn(S)},restore(x){S=structuredClone(x)},toast(t,kind,o){undo=o&&o.undo},
  start(mid){const m=S.missions.find(x=>x.id===mid);if(lock[mid]||S.done[mid])return;lock[mid]=1;const before=S;
   k.upd(n=>{n.done[mid]=true;n.seasonPts+=m.pts;n.tally[mid]=(n.tally[mid]||0)+1;n.sTally[mid]=(n.sTally[mid]||0)+1;n.ctime[mid]=[...(n.ctime[mid]||[]),{t:600,day:a.dayKey(n)}];LC.onComplete(n,mid)});undo=()=>{k.restore(before);delete lock[mid]}},
  undo:()=>undo&&undo()};
 return k}

test('No battle is picked automatically, not even the longest or first task',()=>{const S=fresh();goal(S);const long=goal(S,'lang');long.ac.minutes=240;
 const before=JSON.stringify(S);assert.ok(a.todayPriorities(S,a.derive(S)).length>=2,'there are candidates');assert.equal(battle(S),null);assert.equal(JSON.stringify(S),before,'deriving the battle never mutates')});

test('Battle chosen with one tap stays even if it is not the first priority; "Ändern" reopens the choice',()=>{const S0=fresh();goal(S0);const two=goal(S0,'lang');const k=ctx(S0);
 a.chooseBattle(k,'m:'+two.ac.missionId);let b=battle(k.S);assert.equal(b.m.id,two.ac.missionId);assert.equal(b.source,'Von dir gewählt');assert.equal(b.done,false);
 a.chooseBattle(k,null);assert.equal(battle(k.S),null,'explicit change shows the picker');
 k.S.battle.k='1-99';assert.equal(battle(k.S),null,'yesterday\'s choice does not carry over')});

test('Evening decision and first step count as explicit earlier choices',()=>{const S=fresh();goal(S);const two=goal(S,'lang');LC.onEvening(S,{mid:two.ac.missionId,when:'morgens',risk:'time'});LC.onAdvance(S);S.day++;
 const b=battle(S);assert.equal(b.m.id,two.ac.missionId);assert.equal(b.source,'Gestern Abend festgelegt');assert.ok(b.plan);
 const T=fresh();T.life.onboard={commit:{text:'Eine Seite lesen',kind:'own',done:false}};assert.equal(battle(T).kind,'commit')});

test('Winning the battle: one tap, no double points on repeated taps, undo restores everything',()=>{const S0=fresh();const g=goal(S0);const k=ctx(S0);const key='m:'+g.ac.missionId;a.chooseBattle(k,key);
 const pts=k.S.seasonPts,beforeTap=structuredClone(k.S),b=battle(k.S);
 a.completePriority(k,b,null);a.completePriority(k,battle(k.S),null);a.completePriority(k,b,null);
 assert.equal(battle(k.S).done,true,'battle won');const m=k.S.missions.find(x=>x.id===g.ac.missionId);assert.equal(k.S.seasonPts,pts+m.pts,'points once');assert.equal(k.S.tally[m.id],1);assert.equal(k.S.life.log.length,1);
 k.undo();assert.equal(battle(k.S).done,false,'undo reopens the battle');assert.equal(k.S.seasonPts,pts);assert.deepEqual(JSON.parse(JSON.stringify(k.S)),JSON.parse(JSON.stringify(beforeTap)),'undo restores the full state')});

test('Standard as battle: double tap logs once, minimum is honest, undo restores',()=>{const S0=fresh();LC.setStandard(S0.life,'health',{std:{text:'Spaziergang',perWeek:3,minutes:20},min:{text:'Vor die Tür',minutes:5}});const k=ctx(S0);a.chooseBattle(k,'std:health');
 let b=battle(k.S);assert.equal(b.kind,'standard');const pts=k.S.seasonPts;
 a.completePriority(k,b,null);a.completePriority(k,b,null);assert.equal(k.S.life.stdLog.length,1,'logged once');assert.equal(battle(k.S).done,true);assert.equal(battle(k.S).min,false);assert.equal(k.S.seasonPts,pts,'standards award no points');
 k.undo();assert.equal((k.S.life.stdLog||[]).length,0);assert.equal(battle(k.S).done,false);
 const T0=fresh();LC.setStandard(T0.life,'growth',{std:{text:'Spaziergang',perWeek:3},min:{text:'Vor die Tür'}});const t=ctx(T0);a.chooseBattle(t,'std:growth');a.completePriority(t,battle(t.S),null,'min');assert.equal(battle(t.S).min,true,'minimum is shown as minimum, not full win')});

test('A weekly mission done on an earlier day is not presented as today\'s victory',()=>{const S=fresh();const g=goal(S);const m=S.missions.find(x=>x.id===g.ac.missionId);m.freq='weekly';S.done[m.id]=true;S.ctime[m.id]=[{t:600,day:S.season+'-'+(S.day-1)}];S.day++;
 S.nextPrio={k:a.dayKey(S),mid:m.id};assert.equal(battle(S),null);S.battle={k:a.dayKey(S),key:'m:'+m.id};assert.equal(battle(S).done,false)});

test('Compound: season potential uses the named weekly plan (8 done, 3/week, 2 weeks left → 14)',()=>{const S=fresh();const g=goal(S);assert.equal(g.ac.perWeek,3);S.sLen=3;S.day=6;S.sTally={x:8};S.tally={x:8,old:12};
 const before=JSON.stringify(S),C=a.compoundNow(S);assert.equal(JSON.stringify(S),before,'pure');
 assert.equal(C.season,8);assert.equal(C.total,20,'earlier seasons stay counted');assert.equal(C.pace,3);assert.equal(C.paceSrc,'plan');assert.equal(C.remDays,14);assert.equal(C.possible,14);assert.equal(C.seasonLen,21)});

test('Compound: after a week the assumption is the real pace of the last 7 days; missed days never erase actions',()=>{const S=fresh();goal(S);S.day=10;S.tally={x:9};S.sTally={x:9};
 S.ctime={a:[3,5,8,9].map(d=>({t:600,day:S.season+'-'+d})),b:[{t:600,day:S.season+'-1'}]};const C=a.compoundNow(S);assert.equal(C.pace,4,'days 3–9 only');assert.equal(C.paceSrc,'recent');
 assert.equal(C.possible,9+Math.round(4*(a.SDAYS(S)-11)/7));
 const later=structuredClone(S);later.day=17;const D=a.compoundNow(later);assert.equal(D.total,C.total,'total unchanged after missed days');assert.equal(D.momentum.active,0);assert.equal(D.pace,0)});

test('Momentum counts active days of the last 7; rest days and an unfinished today are fair',()=>{const S=fresh();S.day=6;S.rest=[3];S.ctime={a:[0,1,2,4,5].map(d=>({t:600,day:S.season+'-'+d}))};
 let m=a.momentumOf(S);assert.deepEqual({...m},{active:5,of:5,rest:1});
 S.ctime.a=S.ctime.a.filter(x=>x.day!==S.season+'-5');m=a.momentumOf(S);assert.deepEqual({...m},{active:4,of:5,rest:1});
 S.ctime.a.push({t:600,day:S.season+'-6'});m=a.momentumOf(S);assert.deepEqual({...m},{active:5,of:6,rest:1},'today counts once acted');
 const N=fresh();assert.deepEqual({...a.momentumOf(N)},{active:0,of:0,rest:0},'new season starts neutral')});

test('Saved battle survives save/load (v5) and old saves without it still load',()=>{const S=fresh();S.battle={k:a.dayKey(S),key:'commit'};c.localStorage.getItem=()=>JSON.stringify(S);const L=a.loadState();assert.equal(L.v,5);assert.equal(L.battle.key,'commit');
 delete S.battle;c.localStorage.getItem=()=>JSON.stringify(S);assert.equal(a.loadState().battle,undefined)});

test('Victory feedback is short, non-blocking and respects reduced motion',()=>{const d=/\.battle-fx\{animation:battleWin \.(\d)s/.exec(source);assert.ok(d,'animation present');const ms=+d[1]*100;assert.ok(ms>=300&&ms<=800,'300–800 ms');
 assert.match(source,/prefers-reduced-motion:reduce\)\{\.battle-fx,\.battle-fx \.battle-shield\{animation:none!important\}/);assert.match(source,/setTimeout\(\(\)=>setFx\(false\),800\)/);
 assert.match(source,/if\(lock\.current\[mid\]\)return;lock\.current\[mid\]=1/,'App complete() keeps its double-tap lock');assert.match(source,/upd\(n=>\{if\(isDone\(n,m\)\)return;/,'and its idempotent update')});
console.log('PASS today battle');
