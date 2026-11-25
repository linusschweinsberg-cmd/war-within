/* First-Time-User-Experience: Abläufe für vier Nutzertypen – node tests/ftue-flows.cjs */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const dir=process.argv[2]||require('path').join(__dirname,'..');
const source=fs.readFileSync(dir+'/index.html','utf8');
const script=[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function loadState'));
const store={};const c=vm.createContext({window:{authApi:{}},React:{},htm:{bind:()=>()=>null},ReactDOM:{createRoot:()=>({render(){}})},document:{getElementById:()=>({})},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}},console});
vm.runInContext(fs.readFileSync(dir+'/life-core.js','utf8'),c);vm.runInContext(fs.readFileSync(dir+'/wisdom-core.js','utf8'),c);vm.runInContext(fs.readFileSync(dir+'/persona-core.js','utf8'),c);c.PC=c.window.PC;
vm.runInContext(script+'\nglobalThis.api={buildState,newOb,draftFromTpl,loadState,obScreens,obShortTarget,obCommitProposal,obCtrlCards,eveCands,initState,focusMode,OB_SCREENS,derive,briefCands,dayKey,eveToday,nextAction};',c);
const a=c.api,LC=c.window.LC,ses={mode:'guest',name:'Gast'};const ok=[];const t=(n,f)=>{f();ok.push(n)};
const ids=ob=>[...a.obScreens(ob)].map(x=>x.id);
const finish=ob=>{const n=a.buildState(ob,ses);LC.ensureLife(n);return n};

t('Neuer Nutzer: Kurzform führt in wenigen Schritten in die App',()=>{const ob=a.newOb('');ob.short=true;assert.ok(!ids(ob).includes('first'),'erste Handlung erst, wenn ein Ziel entsteht');ob.goal=a.draftFromTpl(LC.GOAL_TPL[0]);assert.deepEqual(ids(ob),['still','what','resp','ready','name','pillars','persona','goal','first','commit']);
 ob.skip={goal:true};assert.ok(!ids(ob).includes('first'),'ohne Ziel entfällt die erste Handlung')});

t('Nutzer, der alles überspringt: unvollständiges Profil, App funktioniert, nichts negativ bewertet',()=>{const ob=a.newOb('');ob.skip={name:true,goal:true,ctrl:true,loop:true,owner:true,values:true};
 assert.ok(!ids(ob).includes('sign'),'ohne Werte und Standards kein Bekenntnis');const P=a.obCommitProposal(ob);assert.equal(P.kind,'universal','ohne Angaben: universeller Einstieg');
 ob.commit={kind:'universal',step:'5 Minuten lesen'};const n=finish(ob);
 assert.equal(n.profile.name,'Gast');assert.equal(n.life.goals.length,0);assert.equal(n.life.onboard.commit.text,'5 Minuten lesen');assert.equal(n.life.onboard.commit.mid,null);
 const st=Object.fromEntries([...LC.fundSections(n)].map(x=>[x.id,x.state]));assert.ok(Object.values(st).every(x=>x==='open'),'fehlende Angaben sind offen, nicht schlecht');
 assert.equal(n.life.audit,undefined);assert.equal(LC.auditSummary(n.life.audit).areas.health,null);assert.equal(n.life.standards,undefined);
 const D=a.derive(n);assert.ok(Array.isArray(a.briefCands(n,D)),'Heute lässt sich berechnen')});

t('Nutzer, der alles beantwortet: Daten aller Module bleiben verknüpft',()=>{const ob=a.newOb('Mara');
 Object.assign(ob,{areasSet:true,areas:{health:2,relationships:4,wealth:3,growth:4},focus:'health',focusSrc:'user',loopDone:true,loopPick:'small',ownDone:true,own:{can:['Wann ich anfange'],cant:['Was andere tun'],next:'10 Minuten laufen'},
  obst:['energy'],audit:LC.setAudit(LC.setAudit(null,'body',{sat:3,now:'Kaum Bewegung',change:'Wieder laufen',obst:['energy']}),'mind',{sat:5}),
  future:{success:['Gesund und kräftig bleiben'],vision:'Ich laufe locker 10 km.',identity:'Jemand, der dranbleibt',rows:[{area:'body',now:'Kaum Bewegung',then:'3× pro Woche laufen'}]},values:['Disziplin'],firstWhen:'morgens',signed:1});
 ob.goal=a.draftFromTpl(LC.GOAL_TPL.find(x=>x.id==='run5k'));ob.goal.startStr='29:00';
 const L0={d:0,standards:{}};LC.setStandard(L0,'health',{level:'new',current:{sat:4},desired:'10 km locker',std:{text:'Laufen, 30 Minuten',perWeek:2,minutes:30},min:{text:'10 Minuten gehen',minutes:10}});ob.standards=L0.standards;
 assert.ok(ids(ob).includes('sign'));const P=a.obCommitProposal(ob);assert.equal(P.kind,'goal');assert.match(P.why,/Gesundheit als Ausgangspunkt/);assert.equal(P.std.perWeek,2,'eigener Standard hat Vorrang vor Vorschlag');assert.match(P.step,/für heute morgens/);
 ob.commit={kind:P.kind,area:P.area,std:P.std,step:P.step};const n=finish(ob);const L=n.life,g=L.goals[0],ac=L.actions[0];
 assert.equal(L.standards.health.aid,ac.id,'Standard zählt mit der Ziel-Handlung');assert.equal(L.standards.health.base.sat,4);assert.equal(L.onboard.commit.mid,ac.missionId);assert.equal(n.nextPrio.mid,ac.missionId);
 assert.equal(L.future.identity,'Jemand, der dranbleibt');assert.equal(L.audit.areas.body.change,'Wieder laufen');assert.equal(L.fund.seen.loop>0,true);
 const st=Object.fromEntries([...LC.fundSections(n)].map(x=>[x.id,x.state]));assert.equal(st.model,'done');assert.equal(st.standards,'done');assert.equal(st.goal,'done');assert.equal(st.future,'done');assert.equal(st.audit,'partial');
 assert.equal(a.nextAction(n).m.id,ac.missionId,'erster Schritt steht auf Heute ganz oben');
 LC.onComplete(n,ac.missionId);assert.equal(LC.standardWeek(L,'health',0).done,1);
 const sy=JSON.stringify([LC.auditForSync(L.audit),LC.futureForSync(L.future),LC.standardsForSync(L)]);assert.ok(!/Kaum Bewegung|dranbleibt|Laufen, 30/.test(sy),'Synchronisationsformen ohne Freitexte')});

t('Nutzer mit übersprungenen Fragen: Vorschläge nutzen nur vorhandene Angaben',()=>{const ob=a.newOb('Kai');ob.short=true;ob.areasSet=true;ob.areas={health:3,relationships:1,wealth:3,growth:3};ob.skip={goal:true};
 const P=a.obCommitProposal(ob);assert.equal(P.kind,'standard');assert.equal(P.area,'relationships');assert.match(P.why,/Beziehungen gerade am meisten Raum/);assert.match(P.step,/Plane die erste Einheit für diese Woche/);
 ob.commit={kind:P.kind,area:P.area,std:{...P.std,perWeek:1},step:P.step};const n=finish(ob);
 assert.equal(n.life.standards.relationships.std.perWeek,1,'bearbeiteter Vorschlag wird übernommen');assert.ok(n.life.standards.relationships.min,'Minimum aus Vorschlag ergänzt');assert.equal(n.life.goals.length,0);
 const ob2=a.newOb('');const P2=a.obCommitProposal(ob2);assert.equal(P2.kind,'universal','Säulen unverändert = keine eigene Angabe')});

t('Unterbrechen und fortsetzen: Fortschritt bleibt, Kurzform setzt am nächsten Kern-Screen an',()=>{const ob=a.newOb('Lea');const full=ids(ob);ob.step=full.indexOf('audit');
 const k=a.obShortTarget(ob),S2=ids({...ob,short:true});assert.equal(S2[k],'persona','von der Bestandsaufnahme zum Zukunftscharakter, danach Ziel');assert.equal(S2[k+1],'goal');
 ob.step=full.indexOf('owner');assert.equal(ids({...ob,short:true})[a.obShortTarget(ob)],'goal');
 assert.deepEqual(full.slice(5),['pillars','mirror','audit','cost','future','persona','compound','ctrl','obst','owner','values','standards','loop','year','goal','commit'],'Reihenfolge: Selbsterkenntnis → Eigenverantwortung → Standards → Handeln');
 const saved=JSON.parse(JSON.stringify(ob));assert.equal(saved.step,ob.step);
 const n=finish({...ob,paused:true});assert.equal(n.life.fund.ob.paused,true);assert.equal(n.life.fund.ob.mode,'full')});

t('Zurückkehrender Nutzer: Spielstand lädt unverändert, Einladungen selten und ablehnbar',()=>{const ob=a.newOb('Tom');ob.areasSet=true;ob.focus='growth';ob.focusSrc='user';ob.commit={kind:'own',step:'Eine Seite lesen'};
 const n=finish(ob);store.war_within_v5=JSON.stringify(n);const r=a.loadState();LC.ensureLife(r);assert.equal(r.life.onboard.commit.text,'Eine Seite lesen');assert.equal(r.life.fund.ob.mode,'full');
 assert.equal(LC.nextInvite(r),null,'am ersten Tag keine Einladung');LC.onAdvance(r);const i=LC.nextInvite(r);assert.equal(i.sec,'audit','Kurzform holt zuerst die Selbsterkenntnis nach');
 LC.showInvite(r.life,i.key);LC.answerInvite(r.life,i.key,'never');for(let d=0;d<20;d++){const x=LC.nextInvite(r);assert.ok(!x||x.key!==i.key);if(x){LC.showInvite(r.life,x.key);LC.answerInvite(r.life,x.key,'later')}LC.onAdvance(r)}});

t('Alles löschen: persönliche Angaben weg, App bleibt nutzbar',()=>{const ob=a.newOb('Ida');ob.audit=LC.setAudit(null,'money',{sat:2,now:'privat'});ob.future={vision:'privat'};ob.commit={kind:'own',step:'x'};
 const n=finish(ob);LC.clearFoundation(n);assert.equal(n.life.audit,undefined);assert.equal(n.life.future,undefined);assert.ok(!JSON.stringify(n.life).includes('privat'));assert.ok(a.derive(n))});

t('Stufen bauen aufeinander auf: Audit prägt Eigenverantwortung',()=>{const ob=a.newOb('Jo');ob.audit=LC.setAudit(null,'mind',{obst:['energy'],change:'Abends mehr Ruhe'});
 const cards=[...a.obCtrlCards(ob)].map(x=>x[0]);assert.ok(cards.includes('Wie viel Energie ich nach einem langen Tag habe')&&cards.includes('Ob ich an müden Tagen die kleine Version mache'),'Karten aus dem eigenen Hindernis');
 assert.ok(!a.newOb('x').audit&&[...a.obCtrlCards(a.newOb('x'))].length===7,'ohne Audit nur allgemeine Karten')});
t('Erste Woche: ruhiger Start, jederzeit aufhebbar',()=>{const ob=a.newOb('Ben');ob.commit={kind:'own',step:'x'};const n=finish(ob);assert.equal(n.life.fund.ob.calmUntil,7);assert.equal(a.focusMode(n),true,'Nemesis und Punkte zunächst im Hintergrund');
 n.life.d=7;assert.equal(a.focusMode(n),false,'nach einer Woche alles sichtbar');n.life.d=2;n.life.fund.ob.calmOff=true;assert.equal(a.focusMode(n),false)});
console.log('PASS ftue-flows: '+ok.join(' · '));

t('Fundament löschen entfernt auch die ins Warum kopierte Vision',()=>{const ob=a.newOb('Test');ob.future={vision:'PRIVATE_VISION_MARKER'};ob.why=ob.future.vision;ob.goal=a.draftFromTpl(LC.GOAL_TPL[0]);const S=finish(ob);const goals=JSON.stringify(S.life.goals),log=JSON.stringify(S.life.log);assert.ok(JSON.stringify(S).includes('PRIVATE_VISION_MARKER'));LC.clearFoundation(S);assert.ok(!JSON.stringify(S).includes('PRIVATE_VISION_MARKER'));assert.equal(JSON.stringify(S.life.goals),goals);assert.equal(JSON.stringify(S.life.log),log)});
t('Sonntag: alle aktiven Ziel-Handlungen und Standards sind erreichbar',()=>{const S=LC.ensureLife(a.initState());for(let i=0;i<5;i++)LC.addGoal(S,{...LC.GOAL_TPL.find(x=>x.id==='skill'),title:'Ziel '+i});S.day=6;S.life.d=6;LC.setStandard(S.life,'wealth',{std:{text:'Eigener Standard',perWeek:1}});const active=S.life.actions.filter(x=>!x.off&&S.life.goals.find(g=>g.id===x.goalId)?.status==='active');const before=JSON.stringify(active),cands=a.eveCands(S,a.derive(S),[]);assert.ok(active.length>4);for(const ac of active)assert.ok(cands.some(x=>x.m.id===ac.missionId));assert.ok(cands.some(x=>x.m.id==='std:wealth'));assert.equal(JSON.stringify(active),before)});
console.log('PASS integration regressions: private copies cleared, complete Sunday candidates');
{const t2=(n,f)=>{f();console.log('PASS '+n)},PC=c.window.PC;
t2('Zukunftscharakter im Einstieg: gewählt landet im Spielstand, Werte bleiben eigene Wahl',()=>{const ob=a.newOb('Test');ob.persona=['runner','scroll'];ob.values=['Mut'];const n=finish(ob);
 assert.deepEqual([...n.life.persona.ids],['runner','scroll']);assert.equal(n.life.persona.status,'set');assert.deepEqual([...n.life.values],['Mut'],'Leitbild ersetzt keine Werte');assert.equal(n.life.goals.length,0)});
t2('Zukunftscharakter übersprungen: keine erneute Einladung; nicht erreicht: Einladung in der App',()=>{const ob=a.newOb('');ob.skip={persona:true};const n=finish(ob);assert.equal(n.life.persona.status,'later');assert.equal(PC.invite(n),false);
 const m=finish(a.newOb(''));assert.equal(m.life.persona,undefined);assert.equal(PC.invite(m),true)});
t2('Routinenvorschläge: höchstens drei, mit kleiner Variante, nie für Bereiche mit Standard, erst nach Tippen übernommen',()=>{
 const r=PC.routineSuggestions(['runner','scroll']);assert.equal(r.length,2);assert.ok(r.every(x=>x.min&&x.min.text&&x.std.perWeek>=1));
 assert.equal(PC.routineSuggestions(['runner'],{health:{}}).length,0);assert.equal(PC.routineSuggestions(['scroll','column']).length,1,'ein Bereich nur einmal');assert.equal(PC.routineSuggestions(['star']).length,0);
 const ob=a.newOb('Test');ob.persona=['runner'];const n=finish(ob);assert.equal(Object.keys(n.life.standards||{}).length,0,'kein automatischer Standard');
 const L={d:0,standards:{}};const x=PC.routineSuggestions(['runner'],L.standards)[0];LC.setStandard(L,x.area,{std:x.std,min:x.min},'Vorschlag');const ob2=a.newOb('Test');ob2.standards=L.standards;const n2=finish(ob2);
 assert.equal(n2.life.standards.health.std.text,'20 Minuten Bewegung');assert.equal(n2.life.standards.health.min.text,'5 Minuten gehen')});}

t('Fresh onboarding starts with one side slot and immediate cap',()=>{const n=finish(a.newOb('Neu'));assert.equal(n.prog.slots,1);assert.equal(n.prog.capFrom,1);assert.equal(n.prog.n,0)});
