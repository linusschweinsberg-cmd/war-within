/* Phase 2: Ziel zerlegen (Etappen, Handlungen nach verfügbarer Zeit) und adaptive Planung (vier Fälle, nur Vorschläge). */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const script=[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(s=>s.includes('function loadState'));
const c=vm.createContext({window:{authApi:{}},React:{},htm:{bind:()=>()=>null},ReactDOM:{createRoot:()=>({render(){}})},document:{getElementById:()=>({})},localStorage:{getItem:()=>null},console});
for(const f of ['life-core.js','wisdom-core.js','projection-core.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
vm.runInContext(script+';globalThis.api={buildState,newOb,loadState,draftFromTpl,draftOut};',c);
const a=c.api,LC=c.window.LC,PJ=c.window.PJ,test=(n,f)=>{f();console.log('PASS '+n)},arr=x=>JSON.parse(JSON.stringify(x));
const fresh=()=>LC.ensureLife(a.buildState(a.newOb('Plan'),{mode:'guest',name:'Plan'}));
const goal=(S,id,start)=>{const g=LC.addGoal(S,{...LC.GOAL_TPL.find(x=>x.id===id),start});return{g,acts:LC.actionsOf(S.life,g.id)}};
const log=(S,aid,d)=>{S.life.log=[...(S.life.log||[]),{aid,d,wk:LC.wkOf(d,S.life),t:d}]};
const codes=(S,g)=>PJ.adapt(S,g.id).map(x=>x.code);

test('Suggested steps are round, ordered, end at the target, at most six',()=>{
 assert.deepEqual(arr(PJ.suggestSteps(50,100)),[60,70,80,90,100]);assert.deepEqual(arr(PJ.suggestSteps(3000,20000)),[5000,10000,15000,20000]);
 assert.deepEqual(arr(PJ.suggestSteps(1650,1500)),[1600,1550,1500],'lower is better (time)');assert.deepEqual(arr(PJ.suggestSteps(0,12)),[3,6,9,12],'whole numbers stay whole');
 assert.deepEqual(arr(PJ.suggestSteps(null,100)),[],'no start, no invented steps');assert.deepEqual(arr(PJ.suggestSteps(5,5)),[]);
 for(const [s,t] of [[1,1e6],[0,7.5],[93,71]]){const x=PJ.suggestSteps(s,t);assert.ok(x.length>=1&&x.length<=6);assert.equal(x[x.length-1],t)}});

test('Actions are fitted to the available time per week, never below once a week',()=>{const acts=[{title:'Lauf',perWeek:3,minutes:30}];
 let f=PJ.fitActions(acts,60);assert.equal(f.actions[0].perWeek,2);assert.equal(f.changed,true);assert.equal(acts[0].perWeek,3,'input untouched');
 f=PJ.fitActions(acts,null);assert.equal(f.changed,false);assert.equal(f.actions[0].perWeek,3);
 f=PJ.fitActions([{title:'Lang',perWeek:2,minutes:90}],30);assert.equal(f.actions[0].perWeek,1);assert.equal(f.over,true,'still too much is reported, not hidden')});

test('Frame fields are optional and removable; own steps drive milestones',()=>{const S=fresh(),{g}=goal(S,'reserve',3000);g.metric.target=20000;
 PJ.setFrame(S,g.id,{capacity:'90',limits:'  Nur am Wochenende  ',steps:[5000,10000,15000,20000]});assert.equal(g.capacity,90);assert.equal(g.limits,'Nur am Wochenende');
 PJ.setPlan(S,g.id,{rate:1000});assert.deepEqual(arr(PJ.project(S,g.id).milestones.map(m=>[m.value,m.months])),[[5000,2],[10000,7],[15000,12],[20000,17]]);
 PJ.setFrame(S,g.id,{capacity:'',limits:'',steps:[]});assert.equal(g.capacity,undefined);assert.equal(g.limits,undefined);assert.equal(g.steps,undefined);
 const F=fresh(),fg=goal(F,'strength',10).g;PJ.setFrame(F,fg.id,{steps:[15,20,30]});F.life.d=3;LC.addMeasurement(F,fg.id,16);assert.deepEqual(arr(PJ.project(F,fg.id).milestones.map(m=>m.reached)),[true,false,false])});

test('(b) Consistency not reached → smaller plan; excused rest days are not counted against you',()=>{const S=fresh(),{g,acts}=goal(S,'strength',10);[0,8,15].forEach(d=>log(S,acts[0].id,d));S.life.d=21;
 const before=JSON.stringify(S),x=PJ.adapt(S,g.id).find(y=>y.code==='consistency');assert.equal(JSON.stringify(S),before,'adapt never changes the plan');
 assert.ok(x);assert.deepEqual(arr(x.change),{type:'perWeek',aid:acts[0].id,from:3,to:1});assert.doesNotMatch(x.text,/Disziplin|musst/);
 const R=fresh(),r=goal(R,'strength',10);[0,1,2,8,15].forEach(d=>log(R,r.acts[0].id,d));R.life.daily=[9,10,16,17].map(d=>({d,recover:'sick',obst:[],skipped:[]}));R.life.d=21;
 assert.ok(!codes(R,r.g).includes('consistency'),'sick days lower the plan instead')});

test('(a) Plan kept but result flat → method, not more pressure; without measurement → measure first',()=>{const S=fresh(),{g,acts}=goal(S,'strength',10);for(const w of [0,1,2])for(const k of [0,2,4])log(S,acts[0].id,w*7+k);S.life.d=21;
 assert.ok(codes(S,g).includes('measure'));LC.addMeasurement(S,g.id,10);S.life.meas.at(-1).d=8;LC.addMeasurement(S,g.id,10);
 const x=PJ.adapt(S,g.id).find(y=>y.code==='noeffect');assert.ok(x);assert.equal(x.change.type,'method');assert.match(x.text,/Methode/)});

test('(c) Unrealistic finance deadline → longer period or higher rate; slow body goal → longer period without a date promise',()=>{const S=fresh(),{g}=goal(S,'reserve',1000);g.weeks=12;PJ.setPlan(S,g.id,{rate:250});
 let x=PJ.adapt(S,g.id).find(y=>y.code==='unrealistic');assert.equal(x.change.type,'weeks');assert.ok(x.change.to>12);assert.equal(x.alt.type,'rate');assert.ok(x.alt.to>=1340);
 PJ.setPlan(S,g.id,{rate:0});x=PJ.adapt(S,g.id).find(y=>y.code==='unrealistic');assert.equal(x.change.type,'rate');
 PJ.setPlan(S,g.id,{rate:2000});assert.ok(!codes(S,g).includes('unrealistic'));
 const F=fresh(),f=goal(F,'strength',10).g;f.weeks=4;F.life.d=14;LC.addMeasurement(F,f.id,11);x=PJ.adapt(F,f.id).find(y=>y.code==='unrealistic');
 assert.ok(x);assert.equal(x.change.type,'weeks');assert.doesNotMatch(x.text+x.label,/\d+ (Tagen|Monaten)|am \d/,'no precise date for body goals')});

test('(d) Less time available → plan reduced to fit',()=>{const S=fresh(),{g,acts}=goal(S,'strength',10);PJ.setFrame(S,g.id,{capacity:60});const x=PJ.adapt(S,g.id).find(y=>y.code==='resources');
 assert.deepEqual(arr(x.change),{type:'perWeek',aid:acts[0].id,from:3,to:1});PJ.setFrame(S,g.id,{capacity:200});assert.ok(!codes(S,g).includes('resources'))});

test('New goal draft carries frame fields; old saves without them still load and adapt',()=>{const d=a.draftFromTpl(LC.GOAL_TPL.find(x=>x.id==='run5k'));d.capacity=60;d.limits='Knie schonen';d.steps=[1600,1550,1500];const o=a.draftOut(d);
 assert.equal(o.capacity,60);assert.equal(o.limits,'Knie schonen');assert.deepEqual(arr(o.steps),[1600,1550,1500]);
 const S=fresh(),{g}=goal(S,'lang',30);c.localStorage.getItem=()=>JSON.stringify(S);let L=LC.ensureLife(a.loadState());assert.deepEqual(arr(PJ.adapt(L,g.id)),[]);
 PJ.setFrame(L,g.id,{capacity:45,steps:[40,50]});c.localStorage.getItem=()=>JSON.stringify(L);L=LC.ensureLife(a.loadState());assert.equal(L.life.goals[0].capacity,45);assert.deepEqual(arr(L.life.goals[0].steps),[40,50])});
console.log('PASS goal breakdown');
