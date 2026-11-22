const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const dir=process.argv[2]||require('path').join(__dirname,'..');
const source=fs.readFileSync(dir+'/index.html','utf8');
const script=[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function loadState'));
new vm.Script(script);new vm.Script(fs.readFileSync(dir+'/auth.js','utf8'));new vm.Script(fs.readFileSync(dir+'/sw.js','utf8'));
const c=vm.createContext({window:{authApi:{}},React:{},htm:{bind:()=>()=>null},ReactDOM:{createRoot:()=>({render(){}})},document:{getElementById:()=>({})},localStorage:{getItem:()=>null},console});
vm.runInContext(fs.readFileSync(dir+'/life-core.js','utf8'),c);vm.runInContext(fs.readFileSync(dir+'/wisdom-core.js','utf8'),c);
vm.runInContext(script+'\nglobalThis.api={initState,loadState,buildNemesisPlan,getCurrentActivity,learnSuggest,nemDefault,nemTasks,dayKey,completedWeeks,recordWeek,buildState,newOb,draftFromTpl,briefCands,derive};',c);
const a=c.api,s=a.initState();s.profile={mode:'supabase'};delete s.ctime;delete s.duel;c.localStorage.getItem=()=>JSON.stringify(s);let loaded=a.loadState();assert.equal(Object.keys(loaded.ctime).length,0);assert.equal(loaded.duel.streak,0);
s.ctime={m_train:Array.from({length:10},()=>({t:1140}))};c.localStorage.getItem=()=>JSON.stringify(s);loaded=a.loadState();assert.equal(loaded.ctime.m_train.length,0);
const p=a.buildNemesisPlan([]);assert.ok(p.length);assert.equal(a.getCurrentActivity(p,0).kind,'sleep');
s.nem={m_train:{s:360,d:60}};s.ctime={m_train:Array.from({length:8},()=>({t:1140,day:'1-0'}))};assert.equal(a.learnSuggest(s),null);
s.ctime={m_train:Array.from({length:5},(_,i)=>({t:1140,day:'1-'+i}))};assert.equal(a.learnSuggest(s).n,5);
s.day=6;a.recordWeek(s,1);assert.equal(a.completedWeeks(s).length,1);
assert.ok(source.includes('const authApi=window.authApi;'));assert.ok(!/<<<<<<<|>>>>>>>/.test(source));
/* Neues Onboarding (Kompass → Ziel → Plan) erzeugt ein verknüpftes Life-Modell */
const LC=c.window.LC,ob=a.newOb('Test');ob.values=['Mut','Integrität'];ob.focus='health';ob.goal=a.draftFromTpl(LC.GOAL_TPL.find(x=>x.id==='run5k'));ob.goal.startStr='27:30';ob.firstWhen='morgens';
const n=a.buildState(ob,{mode:'guest',name:'Test'});LC.ensureLife(n);const g=n.life.goals[0],ac=n.life.actions[0];assert.equal(n.life.goals.length,1);assert.equal(g.metric.dir,'down');assert.equal(LC.goalNow(n.life,g),1650);assert.ok(n.missions.some(m=>m.id===ac.missionId&&m.times===3));assert.ok(n.missions.some(m=>m.id==='m_ref'));assert.equal(n.nextPrio.mid,ac.missionId);assert.equal(n.principles.length,2);
assert.equal(a.briefCands(n,a.derive(n))[0].id,ac.missionId,'Ziel-Handlung steht im Tagesbriefing vorn');
c.localStorage.getItem=()=>JSON.stringify(n);loaded=a.loadState();assert.ok(!loaded.missions.some(m=>m.id==='m_cal'),'keine Demo-Missionen in echten Konten');LC.ensureLife(loaded);assert.equal(loaded.life.goals[0].id,g.id);
/* Onboarding als Geschichte: Standards, Kosten, Hindernis und Startzeitpunkt landen im Spielstand */
{const ob2=a.newOb('Story');Object.assign(ob2,{values:['Disziplin'],stds:{Disziplin:'Ich halte, was ich mir zusage.'},cost:['Energie'],obst:['time'],start:'tomorrow',signed:1,audit:{v:1,areas:{money:{sat:4,now:'privat'}}},auditCur:{view:'list'},own:{can:['Wann ich anfange'],cant:['Was andere tun'],next:'  10 Minuten Spanisch  '},focus:'growth',firstWhen:'morgens'});ob2.goal=a.draftFromTpl(LC.GOAL_TPL.find(x=>x.id==='lang'));
 const m=a.buildState(ob2,{mode:'guest',name:'Story'});LC.ensureLife(m);const ac2=m.life.actions[0];
 assert.equal(m.principles[0].std,'Ich halte, was ich mir zusage.');assert.deepEqual([...m.life.why.q.cost],['Energie']);
 assert.equal(m.nextPrio.k,m.season+'-1','Start morgen setzt die Priorität für Tag 1');assert.equal(m.life.onboard.for,1);assert.equal(m.life.onboard.mid,ac2.missionId);assert.match(m.life.onboard.plan,/Kurzversion \(10 Min\.\)/);
 assert.equal(m.life.audit.areas.money.sat,4);assert.equal(m.life.auditCur,undefined,'UI-Zustand wird nicht übernommen');assert.equal(m.life.onboard.own.next,'10 Minuten Spanisch');assert.deepEqual([...m.life.onboard.own.cant],['Was andere tun']);
 const k=a.newOb('Kurz');assert.ok(k.story&&!k.short)}
console.log('PASS: full script syntax, existing account migration, no fabricated completion history, distinct-day learning, empty schedule, weekly snapshot, Supabase integration, life-os onboarding, goal-first briefing, no demo missions in real accounts.');
