/* Szenarien für den Life-OS-Kern: node tests/life-core.cjs */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const dir=require('path').join(__dirname,'..');
const c=vm.createContext({console});vm.runInContext(fs.readFileSync(dir+'/life-core.js','utf8'),c);
const LC=c.LC;
const base=()=>({day:0,acts:{body:{cat:'fit'},rel:{cat:'rel'},fin:{cat:'fin'},lang:{cat:'intel'},disc:{cat:'char'}},missions:[]});
const done=(S,aid,n)=>{const a=LC.actById(S.life,aid);for(let i=0;i<n;i++)LC.onComplete(S,a.missionId)};
const nextWeek=S=>{for(let i=0;i<7;i++)LC.onAdvance(S)};
const tpl=id=>JSON.parse(JSON.stringify(LC.GOAL_TPL.find(t=>t.id===id)));
const ok=[];const t=(name,fn)=>{fn();ok.push(name)};

t('Neuer Nutzer ohne Daten',()=>{const S=LC.ensureLife(base());assert.equal(S.life.goals.length,0);assert.equal(LC.reviewWeek(S.life),null);assert.equal(LC.loopStage({hasGoal:false}),'own');assert.equal(LC.insights(S).sessions,0)});

t('Bestehender Nutzer: Migration ohne Datenverlust',()=>{const S=base();S.profile={sat:{fit:2,rec:4,fin:3},priorities:['fin']};S.save={saved:400};
 S.missions=[{id:'m_save',act:'fin',title:'Sparbetrag zurücklegen',freq:'weekly'},{id:'m_run',act:'run',title:'Lauf',freq:'multi',times:2}];
 S.goals=[{id:'g1',kind:'save',title:'€5.000 sparen',target:5000,unit:'€'},{id:'g2',kind:'pace',title:'5 km unter 25 Minuten laufen',target:24,unit:'Läufe'}];
 LC.ensureLife(S);const L=S.life;assert.equal(L.goals.length,2);assert.equal(L.focus,'wealth');assert.equal(L.areas.health.sat,3);
 const sv=L.goals[0];assert.equal(sv.metric.name,'Rücklage');assert.equal(LC.goalNow(L,sv),400);assert.equal(L.actions.find(a=>a.goalId===sv.id).missionId,'m_save');
 const pace=L.goals[1];assert.equal(pace.metric.fmt,'time');assert.equal(pace.metric.dir,'down');assert.notEqual(pace.metric.unit,'Läufe');
 assert.deepEqual(S.goals.length,2,'alte Ziele bleiben erhalten');
 const snap=JSON.stringify(S.life);LC.ensureLife(S);assert.equal(JSON.stringify(S.life),snap,'Migration ist idempotent')});

let S=LC.ensureLife(base()),G,A;
t('Ziel mit Ergebnis-Messgröße und Handlungen',()=>{const x=tpl('run5k');G=LC.addGoal(S,{...x,tpl:x.id,start:1620});A=LC.actionsOf(S.life,G.id)[0];
 assert.equal(S.life.main,G.id);assert.equal(G.metric.start,1620);assert.equal(LC.fmtV(G.metric,1620),'27:00');assert.equal(LC.parseV(G.metric,'24:59'),1499);
 const m=S.missions.find(m=>m.id===A.missionId);assert.equal(m.freq,'multi');assert.equal(m.times,3);assert.equal(m.goal,G.id)});

t('Nicht erledigte Tagesaufgaben / verpasste Woche',()=>{assert.equal(LC.diagnose(S.life,G,0).code,'missed');const s=LC.suggest(S.life,G,A,'missed',0);assert.equal(s[0].change.perWeek,2);
 S.life.d=6;assert.equal(LC.reviewWeek(S.life),0)});

t('Hindernis → Experiment (1 von 3, zu erschöpft)',()=>{S.life.d=0;done(S,A.id,1);S.life.d=6;const dg=LC.diagnose(S.life,G,0);assert.equal(dg.code,'low');assert.ok(dg.needsObstacle);
 const sug=LC.suggest(S.life,G,A,'energy',0)[0];assert.equal(sug.change.when,'morgens');assert.equal(sug.change.perWeek,2);assert.equal(sug.criterion.min,2);
 const e=LC.startExperiment(S,{goalId:G.id,aid:A.id,obstacle:'energy',sug,wk:0});LC.saveWeeklyReview(S,{wk:0,expStarted:e.id});
 assert.equal(LC.plannedAt(A,0),3,'Vergangenheit bleibt unverändert');assert.equal(LC.plannedAt(A,1),2);assert.match(S.missions.find(m=>m.id===A.missionId).title,/morgens/);assert.equal(LC.reviewWeek(S.life),null)});

t('Experiment überprüfen: erfolgreich und übernehmen',()=>{nextWeek(S);/* d=13, Woche 1 Sonntag */done(S,A.id,2);const e=S.life.exps[0];const r=LC.evalExperiment(S.life,e);assert.equal(r.ok,true);assert.equal(r.due,true);
 assert.equal(LC.weekSummary(S,1).exps.length,1);LC.decideExperiment(S,e.id,'adopt');assert.equal(e.status,'success');assert.equal(LC.insights(S).playbook.length,1);LC.saveWeeklyReview(S,{wk:1})});

t('Negative Entwicklung trotz hoher Aktivität',()=>{nextWeek(S);/* Woche 2 */done(S,A.id,2);LC.addMeasurement(S,G.id,1600);S.life.d+=0;LC.addMeasurement(S,G.id,1640);
 const dg=LC.diagnose(S.life,G,2);assert.equal(dg.code,'stalled');const s=LC.suggest(S.life,G,A,'stalled',2)[0];assert.equal(s.kind,'method');assert.equal(s.criterion.outcome,true)});

t('Erfolgloser Verbesserungsversuch wird zurückgenommen',()=>{const s=LC.suggest(S.life,G,A,'stalled',2)[0];const e=LC.startExperiment(S,{goalId:G.id,aid:A.id,obstacle:null,sug:s,wk:2});
 nextWeek(S);/* Woche 3: umgesetzt, aber Ergebnis nicht besser */done(S,A.id,2);LC.addMeasurement(S,G.id,1650);const r=LC.evalExperiment(S.life,e);assert.equal(r.execOk,true);assert.equal(r.ok,false);
 LC.decideExperiment(S,e.id,'revert');assert.equal(e.status,'fail');assert.equal(A.method,'');assert.equal(LC.insights(S).closed,2)});

t('Zieländerung wird protokolliert',()=>{LC.updateGoal(S,G.id,{target:1560,weeks:16});assert.equal(G.metric.target,1560);assert.equal(G.changes.length,1);assert.equal(G.changes[0].ch.length,2)});

t('Ziel erreicht',()=>{assert.equal(LC.addMeasurement(S,G.id,1555),'achieved');assert.equal(G.status,'achieved');assert.equal(LC.diagnose(S.life,G,LC.curWk(S.life)).code,'achieved');assert.equal(LC.insights(S).achieved,1)});

t('Comeback nach verpasster Woche zählt',()=>{const S2=LC.ensureLife(base());const g=LC.addGoal(S2,{...tpl('books'),start:0});const a=LC.actionsOf(S2.life,g.id)[0];
 done(S2,a.id,5);nextWeek(S2);nextWeek(S2);done(S2,a.id,1);assert.equal(LC.weekRate(S2.life,1),0);assert.equal(LC.insights(S2).comebacks,1)});

t('Tagesrückblick fließt in Wochenrückblick',()=>{const S3=LC.ensureLife(base());LC.onDailyReview(S3,['Wenig Energie','Ablenkung']);S3.life.d=1;LC.onDailyReview(S3,['Wenig Energie']);assert.deepEqual({...LC.obstacleCounts(S3,0)},{energy:2,distract:1})});

t('Ziel archivieren entfernt nur die eigenen Missionen',()=>{const S4=LC.ensureLife(base());const g=LC.addGoal(S4,{...tpl('friends')});const n=S4.missions.length;LC.setGoalStatus(S4,g.id,'archived');assert.equal(S4.missions.length,n-1);assert.equal(S4.life.main,null)});

t('Reload und Datenpersistenz',()=>{const R=LC.ensureLife(JSON.parse(JSON.stringify(S)));assert.deepEqual(R.life,JSON.parse(JSON.stringify(S.life)));assert.equal(LC.insights(R).sessions,LC.insights(S).sessions)});

console.log('PASS life-core: '+ok.join(' · '));
