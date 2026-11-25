/* Decision Impact Engine – Projektion für Finanzen, Fitness, Lernen. Nur echte Daten, sichtbare Annahmen, Ruhe ist kein Fehler. */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const script=[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(s=>s.includes('function loadState'));
const c=vm.createContext({window:{authApi:{}},React:{},htm:{bind:()=>()=>null},ReactDOM:{createRoot:()=>({render(){}})},document:{getElementById:()=>({})},localStorage:{getItem:()=>null},console});
for(const f of ['life-core.js','wisdom-core.js','projection-core.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
vm.runInContext(script+';globalThis.api={buildState,newOb,loadState};',c);
const a=c.api,LC=c.window.LC,PJ=c.window.PJ,test=(n,f)=>{f();console.log('PASS '+n)};
const fresh=()=>LC.ensureLife(a.buildState(a.newOb('Pro'),{mode:'guest',name:'Pro'}));
const goal=(S,id,start)=>{const g=LC.addGoal(S,{...LC.GOAL_TPL.find(x=>x.id===id),start});return{g,acts:LC.actionsOf(S.life,g.id)}};
const log=(S,aid,d)=>{S.life.log=[...(S.life.log||[]),{aid,d,wk:LC.wkOf(d,S.life),t:d}]};

test('Savings goal, constant rate: target month, 3/6/12 months, milestones, skipped rate, 0 % by default',()=>{const S=fresh(),{g}=goal(S,'reserve',1000);PJ.setPlan(S,g.id,{rate:250});
 const before=JSON.stringify(S),p=PJ.project(S,g.id);assert.equal(JSON.stringify(S),before,'pure');assert.equal(JSON.stringify(PJ.project(S,g.id)),JSON.stringify(p),'deterministic');
 assert.equal(p.type,'finance');assert.equal(p.complete,true);assert.equal(p.months,16);assert.equal(p.at3,1750);assert.equal(p.at6,2500);assert.equal(p.at12,4000);
 assert.deepEqual([...p.milestones.map(x=>x.months)],[1,6,11,16]);assert.equal(p.interest,0);assert.match(p.assumptions.join(' '),/ohne Zinsen/);
 assert.equal(p.skip.diff12,-250);assert.equal(p.skip.delay,1);assert.equal(p.series.length,6);assert.ok(p.series.every(x=>x.follow>=x.drift))});

test('Savings goal, changed rate and explicit interest: faster, assumption visible; alternatives ordered',()=>{const S=fresh(),{g}=goal(S,'reserve',1000);PJ.setPlan(S,g.id,{rate:500});let p=PJ.project(S,g.id);assert.equal(p.months,8);
 assert.ok(p.alt.length>=2);for(let i=1;i<p.alt.length;i++)assert.ok(p.alt[i].rate>p.alt[i-1].rate&&p.alt[i].months<=p.alt[i-1].months);
 PJ.setPlan(S,g.id,{rate:250,interest:3});p=PJ.project(S,g.id);assert.equal(p.months,16);assert.ok(p.at12>4000&&p.at12<4100,"interest adds a little, visibly");assert.match(p.assumptions.join(' '),/3 % pro Jahr \(deine Annahme\)/);
 assert.equal(PJ.setPlan(S,g.id,{rate:250,interest:99}).interest,0,'implausible interest is not accepted')});

test('Unrealistic deadline is flagged, realistic one not',()=>{const S=fresh(),{g}=goal(S,'reserve',1000);g.weeks=12;PJ.setPlan(S,g.id,{rate:250});assert.equal(PJ.project(S,g.id).unrealistic,true);
 PJ.setPlan(S,g.id,{rate:2000});assert.equal(PJ.project(S,g.id).unrealistic,false);PJ.setPlan(S,g.id,{rate:0});const p=PJ.project(S,g.id);assert.equal(p.months,null,'never with 0 € and 0 %');assert.equal(p.unrealistic,true)});

test('Missing or incomplete data: no numbers are invented',()=>{const S=fresh();const {g}=goal(S,'reserve');let p=PJ.project(S,g.id);assert.equal(p.complete,false);assert.deepEqual([...p.missing],['stand','rate']);assert.equal(p.months,undefined);
 const inc=goal(S,'income',2500).g;p=PJ.project(S,inc.id);assert.ok(p.missing.includes('ziel'));
 const fr=goal(S,'friends').g;assert.equal(PJ.project(S,fr.id).type,null,'unsupported types are not projected');assert.equal(PJ.project(S,'nope'),null)});

test('Fitness: planned vs done, consistency, deviation; future strength stays uncertain',()=>{const S=fresh(),{g,acts}=goal(S,'strength',10);const aid=acts[0].id;
 [0,2,4].forEach(d=>log(S,aid,d));log(S,aid,9);S.life.d=14;const p=PJ.project(S,g.id);
 assert.equal(p.type,'fitness');assert.equal(p.plan,3);assert.equal(p.done,4);assert.equal(p.plannedPast,6);assert.equal(p.deviation,-2);assert.equal(p.consistency,.5);assert.equal(p.observed,2);
 assert.equal(p.drift.src,'observed');assert.equal(p.drift.perWeek,2);assert.ok(p.uncertain.length);assert.equal(p.series[4].follow,4+3*365/7);
 assert.ok(!Object.keys(p).some(k=>/kraft|strength|percent/i.test(k)),'no invented physiological effect')});

test('Fitness milestones only from entered measurements',()=>{const S=fresh(),{g}=goal(S,'strength',10);let p=PJ.project(S,g.id);assert.equal(p.milestones.filter(x=>x.reached).length,0);
 S.life.d=5;LC.addMeasurement(S,g.id,16);p=PJ.project(S,g.id);assert.deepEqual([...p.milestones.map(x=>x.reached)],[true,false,false,false]);assert.equal(p.latest,16)});

test('Planned rest and sickness are not failures',()=>{const S=fresh(),{g,acts}=goal(S,'strength',10);const aid=acts[0].id;[0,2,4].forEach(d=>log(S,aid,d));log(S,aid,10);
 S.life.daily=[{d:8,wk:1,recover:'sick',obst:[],skipped:[]}];S.rest=[9];S.life.d=14;S.day=14;const p=PJ.project(S,g.id);
 assert.equal(p.consistency,1,'week with two excused days and one session is met');assert.equal(p.deviation,0);
 const w=PJ.processWeeks(S,g).find(x=>x.wk===1);assert.equal(w.excused,2);assert.equal(w.plannedAdj,1)});

test('Changing an existing goal recalculates without losing data',()=>{const S=fresh(),{g}=goal(S,'reserve',1000);PJ.setPlan(S,g.id,{rate:250});LC.updateGoal(S,g.id,{target:3000});
 const p=PJ.project(S,g.id);assert.equal(p.months,8);assert.equal(p.rate,250);assert.equal(S.life.meas.length,1);assert.equal(g.changes.length,1)});

test('Learning: invested time, rest time at the same pace, other frequencies',()=>{const S=fresh(),{g,acts}=goal(S,'lang',30);const aid=acts[0].id;for(let d=1;d<=8;d++)log(S,aid,d);
 S.life.d=14;LC.addMeasurement(S,g.id,40);const p=PJ.project(S,g.id);assert.equal(p.type,'learning');assert.equal(p.sessions,8);assert.equal(Math.round(p.hours*60),160);
 assert.equal(p.perSession,1.25);assert.equal(p.remaining,30);assert.equal(p.restWeeks,6);const f4=p.freq.find(x=>x.perWeek===4),f5=p.freq.find(x=>x.perWeek===5);assert.equal(f4.weeks,6);assert.equal(f5.weeks,5);
 const T=fresh(),q=goal(T,'lang',30).g;const pq=PJ.project(T,q.id);assert.equal(pq.restWeeks,null,'no pace without measurements');assert.ok(pq.freq.every(x=>x.weeks===null))});

test('Learning without a duration per unit counts units instead of inventing hours',()=>{const S=fresh(),{g,acts}=goal(S,'lang',30);acts.forEach(a=>{a.minutes=0});log(S,acts[0].id,1);log(S,acts[0].id,2);S.life.d=3;
 const p=PJ.project(S,g.id);assert.equal(p.timed,false);assert.equal(p.unit,'Einheiten');assert.equal(p.series[0].follow,2+4);assert.match(p.assumptions[0],/nicht angegeben/)});
test('Today: completing vs skipping changes weekly plan fulfilment, never shaming',()=>{const S=fresh(),{g,acts}=goal(S,'strength',10);log(S,acts[0].id,0);S.life.d=1;const t=PJ.today(S,g.id);
 assert.equal(t.planned,3);assert.equal(t.done,1);assert.equal(t.ifDone,2/3);assert.equal(t.ifSkip,1/3);assert.equal(t.stillPossible,true)});

test('Migration: old saves without plan load; plan survives save/load; clearing it removes the field',()=>{const S=fresh(),{g}=goal(S,'reserve',1000);c.localStorage.getItem=()=>JSON.stringify(S);let L=LC.ensureLife(a.loadState());assert.equal(L.v,5);assert.equal(L.life.goals[0].proj,undefined);assert.equal(PJ.project(L,g.id).complete,false);
 PJ.setPlan(L,g.id,{rate:100});c.localStorage.getItem=()=>JSON.stringify(L);L=LC.ensureLife(a.loadState());assert.equal(L.life.goals[0].proj.rate,100);assert.equal(L.life.meas.length,1);
 PJ.setPlan(L,g.id,{rate:''});assert.equal(L.life.goals[0].proj,undefined)});

test('Script wiring and offline: loaded with version, precached, no network calls',()=>{const core=fs.readFileSync(path.join(root,'projection-core.js'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 assert.ok(!/\bfetch\s*\(|XMLHttpRequest|Date\.now|Math\.random/.test(core));const m=/<script src="(projection-core\.js\?v=[^"]+)"/.exec(source);assert.ok(m);assert.ok(sw.includes("'./"+m[1]+"'"))});
console.log('PASS projection core');
