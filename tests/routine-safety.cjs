/* Exercise actual UI callbacks, including the previously untested collapsed Standards section. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
let script=[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(s=>s.includes('function loadState'));
const line=script.split(/\r?\n/).find(x=>x.includes('const log=(a,k)=>'));
assert.ok(line);script=script.replace(line,line+'\nglobalThis.standardLog=log;');
const c=vm.createContext({console,URL,structuredClone,window:{authApi:{}},React:{},htm:{bind:()=>()=>null},ReactDOM:{createRoot:()=>({render(){}})},document:{getElementById:()=>({})},localStorage:{getItem:()=>null}});
for(const f of ['life-core.js','wisdom-core.js','future-self-core.js','character-core.js','persona-core.js','rank-core.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
vm.runInContext(script+';globalThis.api={newOb,buildState,StandardsToday,completePriority,derive,todayPriorities,todayBattle,dayKey,prioLock};',c);
const a=c.api,LC=c.window.LC,PC=c.window.PC,CH=c.window.CH,clone=x=>JSON.parse(JSON.stringify(x));
const fresh=()=>LC.ensureLife(a.buildState(a.newOb('Test'),{mode:'guest',name:'Test'}));
function ctx(initial){let S=initial,undo;return{get S(){return S},get D(){return a.derive(S)},upd(fn){S=clone(S);fn(S);LC.syncTemple(S)},restore(x){S=clone(x)},toast(m,k,o){undo=o&&o.undo},undo(){assert.equal(typeof undo,'function');undo()}}}
function test(n,f){for(const k of Object.keys(a.prioLock))delete a.prioLock[k];f();console.log('PASS '+n)}
function standard(S,area='health'){LC.setStandard(S.life,area,{std:{text:'20 Minuten bewegen',perWeek:3},min:{text:'5 Minuten gehen'}})}

test('Actual StandardsToday full/minimum callbacks undo the entire snapshot and allow retry',()=>{
 for(const kind of ['std','min']){const S=fresh();standard(S);const k=ctx(S),before=clone(k.S);a.StandardsToday({c:k});c.standardLog('health',kind);
  assert.equal(k.S.life.stdLog.length,1);assert.equal(k.S.life.stdLog[0].kind,kind);c.standardLog('health',kind);assert.equal(k.S.life.stdLog.length,1);
  k.undo();assert.deepEqual(clone(k.S),before);c.standardLog('health',kind);assert.equal(k.S.life.stdLog.length,1);k.undo();}
});

test('Pausing a chosen standard removes the main battle and rejects its stale completion callback',()=>{
 const S=fresh();standard(S);S.battle={k:a.dayKey(S),key:'std:health'};const old=a.todayBattle(S,a.derive(S));assert.ok(old);
 LC.changeRoutine(S,'std:health',{text:'20 Minuten bewegen',perWeek:3,paused:true});const before=clone(S),k=ctx(S);
 assert.equal(a.todayBattle(k.S,k.D),null);assert.ok(!a.todayPriorities(k.S,k.D).some(x=>x.key==='std:health'));
 a.completePriority(k,old);a.completePriority(k,old,null,'min');assert.deepEqual(clone(k.S),before);
 LC.changeRoutine(k.S,'std:health',{text:'20 Minuten bewegen',perWeek:3,paused:false});assert.ok(a.todayBattle(k.S,k.D));
 a.completePriority(k,a.todayBattle(k.S,k.D));assert.equal(k.S.life.stdLog.length,1);
});

test('Rest days and completed weekly quotas cannot be bypassed through StandardsToday',()=>{
 const S=fresh();standard(S);S.rest=[S.day];const k=ctx(S);a.StandardsToday({c:k});c.standardLog('health','std');assert.equal(k.S.life.stdLog,undefined);
 S.rest=[];
 S.life.stdLog=[0,1,2].map(d=>({area:'health',d,wk:LC.curWk(S.life),kind:'std'}));S.life.d=3;const q=ctx(S),before=clone(S);
 a.StandardsToday({c:q});c.standardLog('health','std');assert.deepEqual(clone(q.S),before);
});

test('Foundation deletion removes private skills/persona/traits/values while preserving account, goals, measurements and action history',()=>{
 const S=fresh(),g=LC.addGoal(S,LC.GOAL_TPL[0]);LC.onComplete(S,LC.actionsOf(S.life,g.id)[0].missionId);
 PC.addSkill(S,'PRIVATE_SKILL');PC.choose(S,['runner'],['PRIVATE_VALUE'],false);PC.setLook(S,{fig:'helmet',col:'bronze',emb:'star'},{});CH.choose(S,['curious']);
 S.principles=[{id:'p',n:'PRIVATE_PRINCIPLE',std:'PRIVATE_STANDARD',acts:3}];S.life.values=['PRIVATE_PRINCIPLE'];
 S.life.future={vision:'PRIVATE_VISION'};S.life.audit={v:1,areas:{body:{now:'PRIVATE_AUDIT'}}};
 const kept=clone({profile:S.profile,goals:S.life.goals,meas:S.life.meas,log:S.life.log,prog:S.prog});LC.clearFoundation(S);
 assert.ok(!JSON.stringify(S).includes('PRIVATE_'));for(const key of ['persona','skills','character','future','audit','standards','stdLog'])assert.equal(S.life[key],undefined);
 assert.deepEqual(clone({profile:S.profile,goals:S.life.goals,meas:S.life.meas,log:S.life.log,prog:S.prog}),kept);
 const reload=clone(S);assert.equal(PC.invite(reload),true);assert.equal(CH.state(reload).traits.length,0);assert.ok(a.derive(reload));
 assert.ok(source.includes('Fundament und Charakterangaben löschen'));assert.ok(source.includes('Konto, Ziele, Messwerte und bisherige Handlungen bleiben erhalten.'));
});
