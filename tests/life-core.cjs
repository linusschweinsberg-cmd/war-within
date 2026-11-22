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

/* ───── Life Temple ───── */
const fresh=()=>LC.ensureLife(base());
t('Tempel: neue Saison startet als Baustelle',()=>{const S=fresh();const st=LC.templeState(S);assert.equal(st.n,1);assert.equal(st.len,12);assert.equal(st.phase,1);assert.ok(st.cols.every(c=>c.stage===1&&c.pts===0));assert.equal(st.foundation,0)});
t('Tempel: Säulen wachsen unabhängig, gedeckelt',()=>{const S=fresh();const g=LC.addGoal(S,{...tpl('run5k'),start:1650});const a=LC.actionsOf(S.life,g.id)[0];
 for(let w=0;w<3;w++){done(S,a.id,3);nextWeek(S)}LC.syncTemple(S);let st=LC.templeState(S);const h=st.cols.find(c=>c.area==='health');
 assert.equal(h.pts,1+3,'Grundstein + 3 konstante Wochen');assert.equal(h.stage,2);assert.ok(st.cols.filter(c=>c.area!=='health').every(c=>c.pts===0));
 done(S,a.id,20);LC.syncTemple(S);assert.equal(LC.templeState(S).cols.find(c=>c.area==='health').pts,4,'Massenhaftes Abhaken in der laufenden Woche bringt nichts')});
t('Tempel: Zielmeilenstein schaltet Baufortschritt frei',()=>{const S=fresh();const g=LC.addGoal(S,{...tpl('reserve'),start:1000});g.metric.target=5000;nextWeek(S);
 LC.addMeasurement(S,g.id,2100);const fr=LC.syncTemple(S);assert.ok(fr.some(m=>m.kind==='quarter'));const w=LC.templeState(S).cols.find(c=>c.area==='wealth');assert.equal(w.pts,2);
 LC.addMeasurement(S,g.id,5000);LC.syncTemple(S);const w2=LC.columnState(S.life,'wealth');assert.equal(w2.engravings,1);assert.equal(w2.pts,2+2+2+3)});
t('Tempel: Sofort erreichtes Ziel ohne Arbeit zählt nicht',()=>{const S=fresh();const g=LC.addGoal(S,{...tpl('books'),start:0});LC.addMeasurement(S,g.id,12);LC.syncTemple(S);assert.equal(LC.columnState(S.life,'growth').pts,0)});
t('Tempel: verpasster Tag oder fehlende Daten verursachen keinen Schaden',()=>{const S=fresh();const g=LC.addGoal(S,{...tpl('run5k'),start:1650});for(let i=0;i<10;i++)LC.onAdvance(S);LC.syncTemple(S);const h=LC.columnState(S.life,'health');assert.equal(h.weathered,false);assert.equal(h.pts,0)});
t('Tempel: dokumentierte Verschlechterung → Verwitterung, Verbesserung → Restaurierung',()=>{const S=fresh();const g=LC.addGoal(S,{...tpl('run5k'),start:1650});nextWeek(S);LC.addMeasurement(S,g.id,1700);LC.syncTemple(S);
 assert.equal(LC.columnState(S.life,'health').weathered,true);S.life.temple.weather=false;assert.equal(LC.columnState(S.life,'health').weathered,false,'abschaltbar');S.life.temple.weather=true;
 nextWeek(S);LC.addMeasurement(S,g.id,1600);LC.syncTemple(S);const h=LC.columnState(S.life,'health');assert.equal(h.weathered,false);assert.ok(h.ms.some(m=>m.kind==='restored'))});
t('Tempel: bewährtes Experiment gibt Emblem (Success Loop)',()=>{const S=fresh();const g=LC.addGoal(S,{...tpl('friends')});const a=LC.actionsOf(S.life,g.id)[0];S.life.d=6;
 const e=LC.startExperiment(S,{goalId:g.id,aid:a.id,obstacle:'time',sug:LC.suggest(S.life,g,a,'time',0)[0],wk:0});nextWeek(S);done(S,a.id,2);LC.decideExperiment(S,e.id,'adopt');LC.syncTemple(S);assert.equal(LC.columnState(S.life,'relationships').emblems,1)});
t('Tempel: Saisonwechsel erhält Historie und Daten',()=>{const S=fresh();const g=LC.addGoal(S,{...tpl('run5k'),start:1650});const a=LC.actionsOf(S.life,g.id)[0];done(S,a.id,3);nextWeek(S);LC.syncTemple(S);const before=LC.templeState(S);
 const snap=LC.closeTempleSeason(S,8);assert.equal(S.life.temple.hist.length,1);assert.equal(snap.cols.find(c=>c.area==='health').pts,before.cols.find(c=>c.area==='health').pts);
 const st=LC.templeState(S);assert.equal(st.n,2);assert.equal(st.len,8);assert.ok(st.cols.every(c=>c.pts===0));assert.equal(S.life.goals.length,1);assert.ok(S.life.log.length>0,'Handlungen bleiben')});
t('Tempel: Abschluss mitten in der Woche zählt nichts doppelt',()=>{const S=fresh();const g=LC.addGoal(S,{...tpl('run5k'),start:1650});const a=LC.actionsOf(S.life,g.id)[0];S.life.d=3;done(S,a.id,1);LC.syncTemple(S);assert.equal(LC.columnState(S.life,'health').pts,1);LC.closeTempleSeason(S);LC.syncTemple(S);assert.equal(LC.columnState(S.life,'health').pts,0);done(S,a.id,1);LC.syncTemple(S);assert.equal(LC.columnState(S.life,'health').pts,1)});
t('Tempel: Zustand übersteht Reload',()=>{const S=fresh();const g=LC.addGoal(S,{...tpl('run5k'),start:1650});const a=LC.actionsOf(S.life,g.id)[0];done(S,a.id,1);LC.syncTemple(S);const R2=LC.ensureLife(JSON.parse(JSON.stringify(S)));assert.deepEqual(LC.templeState(R2).cols.map(c=>c.pts),LC.templeState(S).cols.map(c=>c.pts))});
t('Tempel: Migration bestehender Spielstände ohne Tempel',()=>{const S=fresh();delete S.life.temple;LC.ensureLife(S);assert.ok(S.life.temple&&S.life.temple.cur.n===1)});

console.log('PASS life-core: '+ok.join(' · '));
/* Daily Debrief */
{const ok2=[];const t2=(n,f)=>{f();ok2.push(n)};
t2('Debrief: Muster nach 3 Auslassungen, morgens erledigt → Morgenblock',()=>{const S=LC.ensureLife(base());const g=LC.addGoal(S,{...tpl('skill')});const a=LC.actionsOf(S.life,g.id)[0];S.ctime={[a.missionId]:[{t:420,day:'1-0'},{t:480,day:'1-1'}]};
 assert.equal(LC.debriefPatterns(S).length,0);for(let i=0;i<3;i++){LC.onDebrief(S,{mood:'hard',obst:['energy'],skipped:[a.missionId]});LC.onAdvance(S)}
 const p=LC.debriefPatterns(S);assert.equal(p.length,1);assert.equal(p[0].kind,'morning');assert.equal(a.when,'','Plan wird nicht ungefragt geändert')});
t2('Debrief: abends erledigt → kleinere Version',()=>{const S=LC.ensureLife(base());const g=LC.addGoal(S,{...tpl('skill')});const a=LC.actionsOf(S.life,g.id)[0];S.ctime={[a.missionId]:[{t:1200,day:'1-0'}]};for(let i=0;i<3;i++){LC.onDebrief(S,{obst:['time'],skipped:[a.missionId]});LC.onAdvance(S)}assert.equal(LC.debriefPatterns(S)[0].kind,'smaller')});
t2('Debrief: alles erledigt → keine künstlichen Probleme',()=>{const S=LC.ensureLife(base());const g=LC.addGoal(S,{...tpl('skill')});const a=LC.actionsOf(S.life,g.id)[0];for(let i=0;i<5;i++){LC.onDebrief(S,{mood:'good',done:[a.missionId]});LC.onAdvance(S)}assert.equal(LC.debriefPatterns(S).length,0)});
t2('Monats-Check alle 4 Wochen',()=>{const S=LC.ensureLife(base());LC.addGoal(S,{...tpl('skill')});assert.equal(LC.monthlyDue(S.life),null);S.life.d=21;assert.equal(LC.monthlyDue(S.life),0);LC.saveMonthly(S,0,{});assert.equal(LC.monthlyDue(S.life),null)});
console.log('PASS debrief: '+ok2.join(' · '))}
/* Abendritual */
{const ok3=[];const t3=(n,f)=>{f();ok3.push(n)};
t3('Abendritual: Plan gilt für den nächsten Tag, Handlung bleibt unverändert',()=>{const S=LC.ensureLife(base());const g=LC.addGoal(S,{...tpl('skill')});const a=LC.actionsOf(S.life,g.id)[0];const before=JSON.stringify(a);
 const e=LC.onEvening(S,{mid:a.missionId,when:'morgens',risk:'none'});assert.equal(e.for,1);assert.equal(e.aid,a.id);assert.match(e.plan,/Nach dem Aufstehen/);assert.equal(JSON.stringify(a),before);
 assert.equal(LC.eveningFor(S.life,0),null);LC.onAdvance(S);assert.equal(LC.eveningFor(S.life,1).mid,a.missionId)});
t3('Abendritual: erneutes Festlegen ersetzt, ungültige Eingaben werden ignoriert',()=>{const S=LC.ensureLife(base());const g=LC.addGoal(S,{...tpl('skill')});const a=LC.actionsOf(S.life,g.id)[0];
 LC.onEvening(S,{mid:a.missionId,when:'morgens'});LC.onEvening(S,{mid:a.missionId,when:'nachts',risk:'time'});assert.equal(S.life.evening.length,1);assert.equal(S.life.evening[0].when,null);assert.match(S.life.evening[0].plan,/Kurzversion \(25 Min\.\)/);
 assert.equal(LC.onEvening(S,{}),null);assert.doesNotMatch(LC.ifThen('time','Sparen','morgens',5),/Kurzversion/,'keine Kurzversion, die länger ist')});
t3('Abendritual: Umsetzungsquote zählt nur abgeschlossene Tage',()=>{const S=LC.ensureLife(base());const g=LC.addGoal(S,{...tpl('skill')});const a=LC.actionsOf(S.life,g.id)[0];
 for(let i=0;i<3;i++){LC.onEvening(S,{mid:a.missionId,when:'morgens'});LC.onAdvance(S);if(i!==1)LC.onComplete(S,a.missionId)}
 LC.onEvening(S,{mid:a.missionId,when:'morgens'});LC.onAdvance(S);const st=LC.eveningStats(S.life);assert.equal(st.planned,3);assert.equal(st.kept,2)});
t3('Abendritual: alter Spielstand ohne evening',()=>{const S=LC.ensureLife(base());delete S.life.evening;assert.equal(LC.eveningFor(S.life,1),null);assert.equal(LC.eveningStats(S.life).planned,0)});
console.log('PASS abendritual: '+ok3.join(' · '))}
/* Life Audit */
{const ok4=[];const t4=(n,f)=>{f();ok4.push(n)};
t4('Audit: alles optional, leere Felder werden entfernt',()=>{let A=LC.setAudit(null,'body',{sat:7});assert.equal(A.areas.body.sat,7);assert.equal(LC.auditState(A,'body'),'partial');
 A=LC.setAudit(A,'body',{sat:''});assert.equal(A.areas.body,undefined,'leerer Bereich verschwindet');assert.equal(LC.auditState(A,'body'),'open')});
t4('Audit: ungültige Werte werden verworfen, Texte gekürzt',()=>{const A=LC.setAudit({},'money',{sat:14,now:'x'.repeat(400),obst:['time','gibtsnicht','time']});
 assert.equal(A.areas.money.sat,undefined);assert.equal(A.areas.money.now.length,LC.AUDIT_MAX);assert.deepEqual([...A.areas.money.obst],['time']);assert.equal(LC.setAudit({},'nope',{sat:5}).areas.nope,undefined)});
t4('Audit: vollständig, übersprungen, Wiederaufnahme',()=>{let A=LC.setAudit({},'mind',{sat:4,now:'müde',proud:'Pausen',change:'Schlaf',obst:['energy']});assert.equal(LC.auditState(A,'mind'),'done');
 A=LC.setAudit(A,'career',{skip:true});assert.equal(LC.auditState(A,'career'),'skipped');const R=JSON.parse(JSON.stringify(A));assert.equal(LC.auditState(R,'mind'),'done')});
t4('Audit: Übersicht wertet Fehlendes nicht als schlecht',()=>{let A=LC.setAudit({},'body',{sat:8});A=LC.setAudit(A,'mind',{sat:4,obst:['energy']});A=LC.setAudit(A,'habits',{obst:['energy','time']});
 const s=LC.auditSummary(A);assert.equal(s.areas.health,6);assert.equal(s.areas.wealth,null,'nicht bewertet = null, nicht 0');assert.equal(s.areas.growth,null);assert.equal(s.rated,2);assert.equal(s.obst[0].id,'energy');assert.equal(s.obst[0].n,2)});
t4('Audit: Synchronisationsform enthält keine Freitexte',()=>{const A=LC.setAudit({},'people',{sat:6,now:'Sehr privat',proud:'auch privat',change:'privat'});const y=JSON.stringify(LC.auditForSync(A));
 assert.ok(!/privat/.test(y));assert.ok(/"hasText":true/.test(y));assert.ok(/"sat":6/.test(y))});
console.log('PASS life-audit: '+ok4.join(' · '))}
/* Wer könntest du werden? */
{const ok5=[];const t5=(n,f)=>{f();ok5.push(n)};
t5('Zukunft: nur eigene Inhalte, leere und fremde Werte fliegen raus',()=>{const f=LC.cleanFuture({success:['Innere Ruhe','Reich werden','Innere Ruhe'],successOwn:'  ',vision:'v'.repeat(400),past1:'',rows:[{area:'body',now:'müde',then:''},{area:'body',now:'doppelt'},{area:'gibtsnicht',now:'x'}]});
 assert.deepEqual([...f.success],['Innere Ruhe'],'keine aufgezwungenen Maßstäbe, nur aus Auswahl');assert.equal(f.successOwn,undefined);assert.equal(f.vision.length,LC.FUTURE_TXT.vision);assert.equal(f.past1,undefined);
 assert.equal(f.rows.length,1);assert.equal(f.rows[0].now,'müde');assert.equal(f.rows[0].then,undefined)});
t5('Zukunft: eigenes Erfolgsbild zählt gleichwertig',()=>{assert.deepEqual([...LC.futureSuccess({success:['Innere Ruhe'],successOwn:'Mit meinen Kindern Zeit haben'})],['Innere Ruhe','Mit meinen Kindern Zeit haben'])});
t5('Zukunft: Synchronisationsform ohne Texte',()=>{const y=JSON.stringify(LC.futureForSync({vision:'Sehr persönlich',identity:'Jemand, der dranbleibt',rows:[{area:'mind',now:'privat',then:'privat'}]}));assert.ok(!/persönlich|dranbleibt|privat/.test(y));assert.ok(/"hasVision":true/.test(y))});
console.log('PASS zukunft: '+ok5.join(' · '))}
