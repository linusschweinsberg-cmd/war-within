/* First-Time-User-Experience: Abläufe für vier Nutzertypen – node tests/ftue-flows.cjs */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const dir=process.argv[2]||require('path').join(__dirname,'..');
const source=fs.readFileSync(dir+'/index.html','utf8');
const script=[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function loadState'));
const store={};const c=vm.createContext({window:{authApi:{}},React:{},htm:{bind:()=>()=>null},ReactDOM:{createRoot:()=>({render(){}})},document:{getElementById:()=>({})},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}},console});
vm.runInContext(fs.readFileSync(dir+'/life-core.js','utf8'),c);vm.runInContext(fs.readFileSync(dir+'/wisdom-core.js','utf8'),c);
vm.runInContext(script+'\nglobalThis.api={buildState,newOb,draftFromTpl,loadState,obScreens,obShortTarget,obCommitProposal,OB_SCREENS,derive,briefCands,dayKey,eveToday,nextAction};',c);
const a=c.api,LC=c.window.LC,ses={mode:'guest',name:'Gast'};const ok=[];const t=(n,f)=>{f();ok.push(n)};
const ids=ob=>[...a.obScreens(ob)].map(x=>x.id);
const finish=ob=>{const n=a.buildState(ob,ses);LC.ensureLife(n);return n};

t('Neuer Nutzer: Kurzform führt in wenigen Schritten in die App',()=>{const ob=a.newOb('');ob.short=true;assert.ok(!ids(ob).includes('first'),'erste Handlung erst, wenn ein Ziel entsteht');ob.goal=a.draftFromTpl(LC.GOAL_TPL[0]);assert.deepEqual(ids(ob),['still','what','resp','ready','name','pillars','goal','first','commit']);
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
 const k=a.obShortTarget(ob),S2=ids({...ob,short:true});assert.equal(S2[k],'goal','von der Bestandsaufnahme direkt zum Ziel');
 ob.step=full.indexOf('owner');assert.equal(ids({...ob,short:true})[a.obShortTarget(ob)],'pillars');
 const saved=JSON.parse(JSON.stringify(ob));assert.equal(saved.step,ob.step);
 const n=finish({...ob,paused:true});assert.equal(n.life.fund.ob.paused,true);assert.equal(n.life.fund.ob.mode,'full')});

t('Zurückkehrender Nutzer: Spielstand lädt unverändert, Einladungen selten und ablehnbar',()=>{const ob=a.newOb('Tom');ob.areasSet=true;ob.focus='growth';ob.focusSrc='user';ob.commit={kind:'own',step:'Eine Seite lesen'};
 const n=finish(ob);store.war_within_v5=JSON.stringify(n);const r=a.loadState();LC.ensureLife(r);assert.equal(r.life.onboard.commit.text,'Eine Seite lesen');assert.equal(r.life.fund.ob.mode,'full');
 assert.equal(LC.nextInvite(r),null,'am ersten Tag keine Einladung');LC.onAdvance(r);const i=LC.nextInvite(r);assert.equal(i.sec,'standards');assert.match(i.text,/Standards für Wachstum/);
 LC.showInvite(r.life,i.key);LC.answerInvite(r.life,i.key,'never');for(let d=0;d<20;d++){const x=LC.nextInvite(r);assert.ok(!x||x.key!==i.key);if(x){LC.showInvite(r.life,x.key);LC.answerInvite(r.life,x.key,'later')}LC.onAdvance(r)}});

t('Alles löschen: persönliche Angaben weg, App bleibt nutzbar',()=>{const ob=a.newOb('Ida');ob.audit=LC.setAudit(null,'money',{sat:2,now:'privat'});ob.future={vision:'privat'};ob.commit={kind:'own',step:'x'};
 const n=finish(ob);LC.clearFoundation(n);assert.equal(n.life.audit,undefined);assert.equal(n.life.future,undefined);assert.ok(!JSON.stringify(n.life).includes('privat'));assert.ok(a.derive(n))});

console.log('PASS ftue-flows: '+ok.join(' · '));
