/* Real scoring functions and App.complete callback; no React renderer or network required. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
let hooks=[],cursor=0;
const React={useState(init){const i=cursor++;if(!(i in hooks))hooks[i]=typeof init==='function'?init():init;return[hooks[i],v=>{hooks[i]=typeof v==='function'?v(hooks[i]):v}]},useRef(v){const i=cursor++;return hooks[i]||(hooks[i]={current:v})},useMemo:f=>f(),useCallback:f=>f,useEffect(){},useId:()=>':test:'};
const c=vm.createContext({console,URL,URLSearchParams,structuredClone,React,window:{authApi:{}},location:{search:''},navigator:{},setTimeout:()=>1,clearTimeout(){},htm:{bind:()=>()=>null},ReactDOM:{createRoot:()=>({render(){}})},document:{getElementById:()=>({})},localStorage:{getItem:()=>null}});
for(const f of ['life-core.js','wisdom-core.js','future-self-core.js','character-core.js','persona-core.js','rank-core.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
c.RK=c.window.RK;c.PC=c.window.PC;c.CH=c.window.CH;
let script=[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(s=>s.includes('function loadState'));
script=script.replace('const c={auth,upd,saveLook','const c=globalThis.appContext={auth,upd,saveLook');
vm.runInContext(script+';globalThis.api={App,newOb,buildState,derive,completionQuote,awardCompletion,standardMission,completePriority,rankOf,dayKey,planWeek,seasonPointPlan,weekPointPlan,pathLevel,gradeSeason,recordWeek,prioLock,initState};',c);
const a=c.api,LC=c.window.LC,RK=c.window.RK,clone=x=>JSON.parse(JSON.stringify(x));
function fresh(){const S=LC.ensureLife(a.buildState(a.newOb('Test'),{mode:'guest',name:'Test'}));S.missions=[];return S}
function ctx(initial){let S=initial,undo;return{get S(){return S},get D(){return a.derive(S)},upd(fn){S=clone(S);fn(S);LC.syncTemple(S)},restore(x){S=clone(x)},toast(m,k,o){undo=o&&o.undo},undo(){undo()}}}
const item=area=>({kind:'standard',key:'std:'+area,area});
function addStd(S,area='health',per=3){return LC.setStandard(S.life,area,{std:{text:'Handeln',perWeek:per},min:{text:'Klein anfangen'}})}
function addGoal(S,area='health',per=3){return LC.addGoal(S,{area,title:'Mein Ziel',metric:{name:'Messwert',unit:'',target:10},actions:[{title:'Handeln',perWeek:per}]})}
function test(n,f){for(const k of Object.keys(a.prioLock))delete a.prioLock[k];f();console.log('PASS '+n)}

test('Same default action has equal point quote as standard or goal, including common modifiers',()=>{
 for(const per of [2,3,5,7]){const S=fresh();addStd(S,'health',per);const g=addGoal(S,'health',per),m=S.missions.find(m=>m.goal===g.id),std=a.standardMission(S,'health');
  for(const extra of [{},{onTime:true},{bonus:20}])assert.deepEqual(clone(a.completionQuote(S,m,extra)),clone(a.completionQuote(S,std,extra)));}
});

test('Full standalone execution earns points/experience; minimum earns neither; undo restores everything',()=>{
 const S=fresh();addStd(S);const k=ctx(S),before=clone(S);a.completePriority(k,item('health'));
 assert.ok(k.S.seasonPts>0);assert.equal(LC.insights(k.S).sessions,1);assert.equal(LC.columnState(k.S.life,'health').pts,1);assert.equal(k.S.life.log.length,0);assert.deepEqual(clone(k.S.life.meas),clone(S.life.meas));
 assert.equal(RK.usedToday(k.S,a.dayKey(k.S)),1);k.undo();assert.deepEqual(clone(k.S),before);a.completePriority(k,item('health'),null,'min');
 assert.equal(k.S.seasonPts,0);assert.equal(LC.insights(k.S).sessions,0);assert.equal(RK.usedToday(k.S,a.dayKey(k.S)),0);
});

test('Actual App.complete uses the shared award, creates one goal log and has snapshot undo',()=>{
 const S=fresh(),g=addGoal(S),m=S.missions.find(m=>m.goal===g.id);hooks=[];cursor=0;a.App({init:S,auth:{session:{mode:'guest',name:'Test'}}});
 const before=clone(hooks[0]),expected=a.completionQuote(hooks[0],m,{onTime:true}).award;c.appContext.complete(m.id,null,{onTime:true});
 assert.equal(hooks[0].seasonPts,expected);assert.equal(hooks[0].life.log.length,1);assert.equal(RK.usedToday(hooks[0],a.dayKey(hooks[0])),1);
 const undo=hooks.find(x=>x&&typeof x.restore==='function'&&typeof x.msg==='string');assert.ok(undo);undo.restore();assert.deepEqual(clone(hooks[0]),before);
});

test('Standards share three daily awards with missions; zero-point execution still earns experience',()=>{
 const S=fresh();for(const area of ['health','relationships','growth','wealth'])addStd(S,area);const k=ctx(S);
 const g=addGoal(k.S,'health',3),m=k.S.missions.find(m=>m.goal===g.id);a.awardCompletion(k.S,m);
 for(const area of ['relationships','growth'])a.completePriority(k,item(area));const pts=k.S.seasonPts;a.completePriority(k,item('wealth'));
 assert.equal(k.S.seasonPts,pts);assert.equal(RK.usedToday(k.S,a.dayKey(k.S)),3);assert.equal(LC.insights(k.S).sessions,3);assert.equal(k.S.life.stdLog.length,3);
});

test('Weekly cap cannot consume a daily points place or generate extra points',()=>{
 const S=fresh();addStd(S);const m=a.standardMission(S,'health');S.weekPts[m.act]=S.acts[m.act].cap;assert.equal(a.awardCompletion(S,m).award,0);assert.equal(RK.usedToday(S,a.dayKey(S)),0);
});

test('Linked standard does not add a second award or experience entry',()=>{
 const S=fresh(),g=addGoal(S),ac=LC.actionsOf(S.life,g.id)[0];addStd(S);LC.setStandard(S.life,'health',{aid:ac.id});const k=ctx(S);a.completePriority(k,item('health'));assert.equal(k.S.seasonPts,0);
 const m=S.missions.find(m=>m.id===ac.missionId);a.awardCompletion(S,m);LC.onComplete(S,m.id);LC.logStandard(S.life,'health','std');assert.equal(LC.insights(S).sessions,1);
});

test('Standard experience survives removal/private-text deletion/log truncation and JSON reload',()=>{
 const S=fresh();addStd(S);for(let d=0;d<1002;d++){S.life.d=d;LC.logStandard(S.life,'health','std')}assert.equal(S.life.stdLog.length,1000);assert.equal(LC.insights(S).sessions,1002);
 LC.removeStandard(S.life,'health');assert.equal(LC.insights(S).sessions,1002);LC.clearFoundation(S);assert.equal(LC.insights(clone(S)).sessions,1002);
});

test('One daily goal produces a reachable personal plan instead of unrelated activity caps',()=>{
 const S=fresh();addGoal(S,'growth',7);assert.equal(a.planWeek(S),35);assert.equal(a.seasonPointPlan(S),140);S.seasonPts=140;
 assert.equal(a.derive(S).cur,1);assert.equal(a.gradeSeason({personal:true,cur:1,goal:.7,met:0,rank:8,mOk:false}),'S');
 const before=JSON.stringify(S);a.weekPointPlan(S);assert.equal(JSON.stringify(S),before);
});

test('Full calendar weeks are frozen; plan changes only alter open/future weeks',()=>{
 const S=fresh();addStd(S,'growth',7);S.day=6;S.life.d=6;a.recordWeek(S,1);assert.equal(S.weekHist[0].plan,35);
 S.day=7;S.life.d=7;LC.changeRoutine(S,'std:growth',{text:'Kleiner',perWeek:2,paused:false});assert.equal(a.planWeek(S),14);assert.equal(a.seasonPointPlan(S),35+3*14);
});

test('Rest and partial start weeks reduce the budget; paused/linked routines do not inflate it',()=>{
 const S=fresh();addStd(S,'growth',7);S.calendar={v:1,date:'2026-11-26',tz:'Europe/Berlin',seasonOffset:3};assert.equal(a.planWeek(S),20);S.rest=[0];assert.equal(a.planWeek(S),15);
 LC.changeRoutine(S,'std:growth',{text:'Pause',perWeek:7,paused:true});assert.equal(a.weekPointPlan(S).points,0);S.seasonPts=100;assert.equal(a.derive(S).cur,0);assert.equal(a.pathLevel(S),0);
});

test('Overfull plans respect both daily capacity and per-activity weekly caps; demo rule remains unchanged',()=>{
 const S=fresh();for(const area of ['health','relationships','wealth','growth']){addStd(S,area,7);addGoal(S,area,7)}const p=a.weekPointPlan(S);
 assert.ok(p.units<=21);assert.ok(p.offered>p.capacity);for(const [act,points]of Object.entries(p.byAct))assert.ok(points<=S.acts[act].cap);
 const demo=a.initState();assert.equal(a.planWeek(demo),Math.round(.85*Object.values(demo.acts).reduce((n,x)=>n+x.cap,0)));
});

test('Deleting/recreating standards or foundation cannot re-award a day, including after reload',()=>{
 for(const remove of [S=>LC.removeStandard(S.life,'health'),S=>LC.clearFoundation(S)]){
  delete a.prioLock['std:health'];const S=fresh();addStd(S);const k=ctx(S);a.completePriority(k,item('health'));const pts=k.S.seasonPts;
  for(let i=0;i<5;i++){remove(k.S);addStd(k.S);delete a.prioLock['std:health'];a.completePriority(k,item('health'));assert.equal(k.S.seasonPts,pts);assert.equal(LC.insights(k.S).sessions,1)}
  const back=ctx(clone(k.S));delete a.prioLock['std:health'];a.completePriority(back,item('health'));assert.equal(back.S.seasonPts,pts);
  back.S.life.d++;back.S.day++;delete a.prioLock['std:health'];a.completePriority(back,item('health'));assert.ok(back.S.seasonPts>pts);assert.equal(LC.insights(back.S).sessions,2);
  assert.deepEqual(Object.keys(back.S.life.stdDay).sort(),['areas','d']);assert.equal(back.S.life.stdDay.areas.health,'std');
 }
});

test('Actual new onboarding has no accepted point plan until a goal/standard or explicit task edit',()=>{
 const S=LC.ensureLife(a.buildState(a.newOb('Neu'),{mode:'guest',name:'Neu'}));assert.ok(S.missions.some(m=>m.id==='m_ref'));
 assert.equal(a.weekPointPlan(S).points,0);assert.equal(a.derive(S).cur,0);assert.equal(a.pathLevel(S),0);
 hooks=[];cursor=0;a.App({init:S,auth:{session:{mode:'guest',name:'Neu'}}});const m=hooks[0].missions.find(m=>m.id==='m_ref');c.appContext.saveMission({...m});
 assert.equal(hooks[0].missions.find(m=>m.id==='m_ref').planOptIn,true);assert.ok(a.weekPointPlan(hooks[0]).points>0);
});

test('A paused/rest-only completed week freezes a zero budget, not a fictional point',()=>{
 const S=fresh();addStd(S);LC.changeRoutine(S,'std:health',{text:'Pause',perWeek:3,paused:true});S.day=6;S.life.d=6;a.recordWeek(S,1);assert.equal(S.weekHist[0].plan,0);
});

test('Legacy totals/reports remain unchanged; current-season cap exemption also applies to standards',()=>{
 const S=fresh();delete S.prog;S.season=3;S.day=9;S.life.d=9;S.seasonPts=40;S.weekHist=[{season:3,week:1,pts:12}];S.sreport={season:2,cur:.2,grade:'C'};
 for(const area of ['health','relationships','growth','wealth'])addStd(S,area);const before=JSON.stringify(S);a.derive(S);assert.equal(JSON.stringify(S),before);
 const history=JSON.stringify([S.weekHist,S.sreport]);RK.ensure(S);assert.equal(RK.capActive(S),false);const k=ctx(S);
 for(const area of ['health','relationships','growth','wealth']){delete a.prioLock['std:'+area];const pts=k.S.seasonPts;a.completePriority(k,item(area));assert.ok(k.S.seasonPts>pts)}
 assert.equal(JSON.stringify([k.S.weekHist,k.S.sreport]),history);assert.equal(LC.insights(k.S).sessions,4);
});
