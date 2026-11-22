/* THE WAR WITHIN – Life-OS-Kern
   Reine Logik ohne UI: Lebensbereiche, Ziele mit Ergebnis-Messgröße, Handlungen (Prozess),
   Messungen, Reflexionen und Verbesserungs-Experimente. Wird vor dem App-Skript geladen
   und ist in Node testbar (tests/life-core.cjs). Alles liegt in S.life, Version L.v. */
(function(G){
'use strict';
const uid=()=>Math.random().toString(36).slice(2,8);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const LIFE_V=1;

/* ───── Lebensbereiche ───── */
const AREAS=[
 {id:'health',name:'Health',de:'Gesundheit',icon:'heartpulse',color:'#9AAE6B',subs:['Training','Ernährung','Schlaf','Mentale Gesundheit'],q:'Wie zufrieden bist du mit Körper, Energie und Erholung?'},
 {id:'relationships',name:'Relationships',de:'Beziehungen',icon:'users',color:'#D0806A',subs:['Familie','Freundschaften','Partnerschaft','Verbundenheit'],q:'Wie verbunden fühlst du dich mit Menschen, die dir wichtig sind?'},
 {id:'wealth',name:'Wealth',de:'Finanzen',icon:'coins',color:'#D4A94F',subs:['Einkommen','Vermögen','Sicherheit','Spielraum'],q:'Wie sicher und handlungsfähig fühlst du dich finanziell?'},
 {id:'growth',name:'Growth',de:'Wachstum',icon:'book',color:'#8FB3B0',subs:['Wissen','Fähigkeiten','Kompetenz','Persönlichkeit'],q:'Wie zufrieden bist du damit, wie du lernst und dich entwickelst?'}];
const AREA=Object.fromEntries(AREAS.map(a=>[a.id,a]));
/* Wechselwirkungen – bewusst als Modell formuliert, nicht als Messung */
const LINKS=[['health','growth','Energie und Konzentration'],['health','relationships','Belastbarkeit und Präsenz'],['relationships','growth','Rückhalt und Feedback'],['growth','wealth','Kompetenz wird Einkommen'],['wealth','health','Sicherheit senkt Stress'],['wealth','relationships','Zeit und Spielraum']];
const ACT_AREA={body:'health',rec:'health',run:'health',rel:'relationships',fin:'wealth',disc:'growth',deep:'growth',lang:'growth',read:'growth',biz:'wealth',code:'growth'};
const areaAct=(S,area)=>{const pref={health:['body','run'],relationships:['rel'],wealth:['fin'],growth:['lang','read','disc']}[area]||['disc'];return pref.find(a=>S.acts&&S.acts[a])||Object.keys(S.acts||{disc:1})[0]};

/* ───── Werte (Kompass) ───── */
const VALUES=['Integrität','Mut','Disziplin','Ehrlichkeit','Verantwortung','Loyalität','Gerechtigkeit','Familie','Freiheit','Gesundheit','Neugier','Mitgefühl','Gelassenheit','Exzellenz','Dankbarkeit','Respekt'];
const WHY_Q=[['matters','Was ist mir wirklich wichtig?'],['time','Wofür möchte ich meine Zeit einsetzen?'],['meaning','Was gibt meinem Leben Bedeutung?'],['fulfil','Welche Tätigkeiten erfüllen mich?'],['people','Welche Menschen und Verantwortungen zählen für mich?']];

/* ───── Zielvorlagen: Ergebnis-Messgröße getrennt von Handlungen ─────
   metric.fmt 'time' = Sekunden (mm:ss). dir 'down' = kleiner ist besser.
   method = Vorschlag, wenn trotz hoher Umsetzung kein Ergebnis kommt. */
const GOAL_TPL=[
 {id:'run5k',area:'health',title:'5 km unter 25 Minuten laufen',metric:{name:'5-km-Zeit',unit:'',fmt:'time',dir:'down',target:1500,src:'measured'},weeks:12,actions:[{title:'Lauftraining',perWeek:3,minutes:30}],method:'Einen lockeren Lauf durch Intervalle ersetzen (z. B. 6 × 400 m zügig)'},
 {id:'strength',area:'health',title:'Stärker werden',metric:{name:'Liegestütze am Stück',unit:'Wdh.',dir:'up',target:30,src:'measured'},weeks:10,actions:[{title:'Krafttraining',perWeek:3,minutes:40}],method:'Progressiv steigern: jede Woche eine Wiederholung oder etwas mehr Gewicht'},
 {id:'sleep',area:'health',title:'Erholter schlafen',metric:{name:'Ø Schlafdauer',unit:'h',dir:'up',target:7.5,src:'self'},weeks:6,actions:[{title:'30 Min. vor dem Schlafen Bildschirme aus',perWeek:5,minutes:30}],method:'Feste Aufstehzeit, auch am Wochenende'},
 {id:'friends',area:'relationships',title:'Freundschaften pflegen',metric:{name:'Verbundenheit (Selbsteinschätzung)',unit:'/10',dir:'up',target:8,src:'self'},weeks:8,actions:[{title:'Treffen oder Anruf mit einem Freund',perWeek:2,minutes:30}],method:'Einen festen, wiederkehrenden Termin vereinbaren statt spontan'},
 {id:'family',area:'relationships',title:'Präsenter für Familie oder Partner',metric:{name:'Gefühlte Nähe (Selbsteinschätzung)',unit:'/10',dir:'up',target:8,src:'self'},weeks:8,actions:[{title:'Gemeinsame Zeit ohne Handy',perWeek:3,minutes:30}],method:'Gemeinsame Zeit mit einer festen Aktivität verbinden (Essen, Spaziergang)'},
 {id:'reserve',area:'wealth',title:'€5.000 Rücklage aufbauen',metric:{name:'Rücklage',unit:'€',dir:'up',target:5000,src:'measured'},weeks:52,actions:[{title:'Sparbetrag überweisen',perWeek:1,minutes:5},{title:'Ausgaben der Woche prüfen',perWeek:1,minutes:10}],method:'Dauerauftrag direkt nach Gehaltseingang statt Rest am Monatsende'},
 {id:'income',area:'wealth',title:'Einkommen steigern',metric:{name:'Monatliches Nettoeinkommen',unit:'€',dir:'up',target:null,src:'measured'},weeks:26,actions:[{title:'Eine Stunde an Weiterbildung oder Nebenprojekt',perWeek:3,minutes:60}],method:'Arbeit an einem konkreten, verkaufbaren Ergebnis statt allgemein lernen'},
 {id:'lang',area:'growth',title:'Spanisch auf B1-Niveau',metric:{name:'Einstufungstest',unit:'%',dir:'up',target:70,src:'measured'},weeks:24,actions:[{title:'20 Min. Spanisch lernen',perWeek:4,minutes:20}],method:'Aktiv sprechen statt nur Vokabeln: einmal pro Woche Tandem oder Tutor'},
 {id:'books',area:'growth',title:'12 Bücher in einem Jahr lesen',metric:{name:'Gelesene Bücher',unit:'',dir:'up',target:12,src:'self'},weeks:52,actions:[{title:'20 Min. lesen',perWeek:5,minutes:20}],method:'Lesen an einen festen Auslöser koppeln, z. B. nach dem Abendessen'},
 {id:'skill',area:'growth',title:'Eine neue Fähigkeit nachweisbar lernen',metric:{name:'Abgeschlossene Projekt-Meilensteine',unit:'',dir:'up',target:5,src:'self'},weeks:12,actions:[{title:'Fokusblock an der Fähigkeit',perWeek:3,minutes:45}],method:'Jede Woche ein kleines, vorzeigbares Ergebnis festlegen'}];

/* ───── Hindernisse und Anpassungsregeln ───── */
const OBSTACLES=[
 {id:'energy',l:'Zu erschöpft, wenig Energie'},
 {id:'time',l:'Zu wenig Zeit'},
 {id:'forgot',l:'Vergessen, keine feste Zeit'},
 {id:'distract',l:'Abgelenkt'},
 {id:'toomuch',l:'Plan war zu viel'},
 {id:'unclear',l:'Unklar, was genau zu tun ist'},
 {id:'motivation',l:'Keine Lust, Sinn nicht gespürt'},
 {id:'unexpected',l:'Etwas Unerwartetes'}];
const OBST=Object.fromEntries(OBSTACLES.map(o=>[o.id,o]));
/* Tagesrückblick-Auswahl → Hindernis-Code (verbindet Tages- mit Wochenrückblick) */
const BLOCK_MAP={'Zu wenig Zeit':'time','Wenig Energie':'energy','Ablenkung':'distract','Unklarer Plan':'unclear','Etwas Unerwartetes':'unexpected'};

const wkOf=d=>Math.floor(d/7);
const curWk=L=>wkOf(L.d||0);
const actById=(L,id)=>(L.actions||[]).find(a=>a.id===id);
const goalById=(L,id)=>(L.goals||[]).find(g=>g.id===id);
const actionsOf=(L,gid)=>(L.actions||[]).filter(a=>a.goalId===gid&&!a.off);
const actLabel=a=>a.title+(a.when?' · '+a.when:'')+(a.minutes?` (${a.minutes} Min.)`:'');
/* geplante Einheiten einer Handlung in Woche wk (Planänderungen bleiben nachvollziehbar) */
function plannedAt(a,wk){if(wk<(a.since??0))return 0;const h=(a.hist||[]).slice().sort((x,y)=>x.wk-y.wk);if(!h.length)return a.perWeek;
 const past=h.filter(x=>x.wk<=wk);return past.length?past[past.length-1].perWeek:(h[0].from??a.perWeek)}
const doneIn=(L,aid,wk)=>(L.log||[]).filter(x=>x.aid===aid&&x.wk===wk).length;
function goalWeek(L,g,wk){const acts=actionsOf(L,g.id).map(a=>({a,planned:plannedAt(a,wk),done:doneIn(L,a.id,wk)}));
 const planned=acts.reduce((s,x)=>s+x.planned,0),done=acts.reduce((s,x)=>s+Math.min(x.done,x.planned||x.done),0);
 return{acts,planned,done,rate:planned?done/planned:null}}
function weekRate(L,wk){let p=0,d=0;(L.goals||[]).filter(g=>g.status==='active').forEach(g=>{const w=goalWeek(L,g,wk);p+=w.planned;d+=w.done});return p?d/p:null}

/* ───── Ergebnis-Messung ───── */
const measOf=(L,gid)=>(L.meas||[]).filter(m=>m.goalId===gid).sort((a,b)=>a.d-b.d||a.t-b.t);
function goalNow(L,g){const m=measOf(L,g.id);return m.length?m[m.length-1].v:null}
function goalStart(L,g){if(g.metric.start!=null)return g.metric.start;const m=measOf(L,g.id);return m.length?m[0].v:null}
const better=(g,a,b)=>g.metric.dir==='down'?b<a:b>a; /* ist b besser als a? */
function reached(g,v){if(v==null||g.metric.target==null)return false;return g.metric.dir==='down'?v<=g.metric.target:v>=g.metric.target}
function goalProgress(L,g){const s=goalStart(L,g),n=goalNow(L,g),t=g.metric.target;if(s==null||n==null||t==null||t===s)return null;return clamp((n-s)/(t-s),0,1)}
/* Trend: letzte Messung bis Wochenende wk gegen den Stand vor dem Fenster (span Wochen) */
function trend(L,g,wk,span=2){const m=measOf(L,g.id).filter(x=>wkOf(x.d)<=wk);if(m.length<2)return{state:'none',n:m.length};
 const inWin=m.filter(x=>wkOf(x.d)>wk-span);if(!inWin.length)return{state:'stale',n:m.length,last:m[m.length-1].v};
 const before=m.filter(x=>wkOf(x.d)<=wk-span);const prev=before.length?before[before.length-1].v:m[0].v,last=m[m.length-1].v;
 const range=Math.abs((g.metric.target??prev)-(goalStart(L,g)??prev))||Math.abs(prev)||1;const delta=g.metric.dir==='down'?prev-last:last-prev;
 const state=Math.abs(delta)<range*.01?'flat':delta>0?'better':'worse';return{state,prev,last,delta,n:m.length}}

/* ───── Diagnose (transparente Regeln) ───── */
const RULES={
 achieved:'Zielwert erreicht.',
 noplan:'Diesem Ziel ist keine Handlung zugeordnet.',
 missed:'Keine geplante Einheit umgesetzt. Kein Urteil, nur ein Signal: Der Plan passt gerade nicht zur Woche.',
 low:'Weniger als die Hälfte umgesetzt. Erst die Umsetzung stabilisieren, dann über das Ergebnis urteilen.',
 partial:'Teilweise umgesetzt. Ein Hindernis gezielt zu lösen bringt hier am meisten.',
 working:'Hohe Umsetzung und das Ergebnis verbessert sich. Plan beibehalten.',
 stalled:'Hohe Umsetzung, aber das Ergebnis bewegt sich nicht oder wird schlechter. Mehr vom Gleichen hilft wahrscheinlich nicht: die Methode ändern, nicht die Menge.',
 measure:'Gut umgesetzt, aber ohne Messwert lässt sich nicht sagen, ob es wirkt. Trage einen aktuellen Wert ein.'};
function diagnose(L,g,wk){
 if(reached(g,goalNow(L,g)))return{code:'achieved',text:RULES.achieved};
 const w=goalWeek(L,g,wk);if(!w.planned)return{code:'noplan',text:RULES.noplan,w};
 const r=w.rate;let code=w.done===0?'missed':r<.5?'low':r<.8?'partial':null;
 if(!code){const t=trend(L,g,wk,2);
  code=t.state==='better'?'working':t.state==='flat'||t.state==='worse'?'stalled':'measure';
  return{code,text:RULES[code],w,t,needsObstacle:code==='stalled'}}
 return{code,text:RULES[code],w,needsObstacle:true}}

/* ───── Vorschläge: hängen an Ziel, Handlung, Ist-Werten und Hindernis ───── */
function suggest(L,g,a,obstacle,wk){
 const p=plannedAt(a,wk),d=doneIn(L,a.id,wk),T=a.title,out=[];
 const add=(kind,label,hypothesis,change,min,why)=>out.push({id:kind,kind,label,hypothesis,change,criterion:{min:Math.max(1,min),outcome:!!change.method},why});
 const shorter=Math.max(15,Math.round(((a.minutes||30)*.6)/5)*5);
 switch(obstacle){
  case'energy':add('morning',`${Math.max(1,Math.min(p,2))} kürzere Einheiten morgens`,`Morgens setze ich „${T}“ zuverlässiger um als nach der Arbeit.`,{when:'morgens',perWeek:Math.max(1,Math.min(p,2)),minutes:shorter},Math.max(1,Math.min(p,2)),'Energie ist morgens oft höher; weniger, aber sichere Einheiten bauen Konstanz auf.');
   add('lighter',`Leichtere Version: ${p}× je ${shorter} Min.`,`Mit kürzeren Einheiten schaffe ich „${T}“ auch an anstrengenden Tagen.`,{minutes:shorter},Math.max(1,p-1),'Die Hürde zum Anfangen sinkt.');break;
  case'time':add('short',`Kurzversion: ${p}× je ${shorter} Min.`,`Kürzere Einheiten passen in meine Woche.`,{minutes:shorter},p,'Kürzer, aber regelmäßig, schlägt lang und selten.');
   add('fewer',`Realistisch planen: ${Math.max(1,d+1)}× pro Woche`,`Ein Pensum von ${Math.max(1,d+1)}× schaffe ich zuverlässig.`,{perWeek:Math.max(1,Math.min(p,d+1))},Math.max(1,Math.min(p,d+1)),`Letzte Woche: ${d} von ${p}. Ein Schritt mehr als das Ist ist realistisch.`);break;
  case'forgot':add('anchor',`Fester Auslöser: direkt nach dem Frühstück`,`Mit einem festen Auslöser vergesse ich „${T}“ nicht mehr.`,{anchor:'nach dem Frühstück'},p,'Wenn-dann-Pläne koppeln die Handlung an eine bestehende Routine.');
   add('slot',`Feste Tage im Kalender: ${['Mo','Mi','Fr','So','Di','Do','Sa'].slice(0,Math.min(p,7)).join(', ')}`,`Feste Tage machen den Plan verbindlich.`,{days:['Mo','Mi','Fr','So','Di','Do','Sa'].slice(0,Math.min(p,7))},p,'Ein Termin mit dir selbst statt „irgendwann“.');break;
  case'distract':add('phone',`Handy in einen anderen Raum während „${T}“`,`Ohne Handy in Reichweite bleibe ich bei der Sache.`,{rule:'Handy in anderem Raum'},p,'Ablenkung wird über die Umgebung gelöst, nicht über Willenskraft.');
   add('first',`„${T}“ als erste Aufgabe des Tages`,`Vor allem anderen erledigt, wird es nicht verdrängt.`,{when:'als Erstes'},p,'Später am Tag konkurrieren mehr Dinge um die Aufmerksamkeit.');break;
  case'toomuch':add('fewer',`Realistisch planen: ${Math.max(1,Math.min(p-1,d+1))}× pro Woche`,`Ein kleineres Pensum schaffe ich jede Woche und kann es später steigern.`,{perWeek:Math.max(1,Math.min(p-1,d+1))},Math.max(1,Math.min(p-1,d+1)),`Letzte Woche: ${d} von ${p}. Konstanz vor Umfang.`);break;
  case'unclear':add('spec',`Konkret machen: Was, wann, wie lange`,`Mit einer klaren Definition fange ich schneller an.`,{when:'fester Zeitpunkt',minutes:a.minutes||30},p,'Unklare Aufgaben werden aufgeschoben; eine konkrete erste Handlung nicht.');break;
  case'motivation':add('buddy',`Gemeinsam statt allein`,`Mit einer verabredeten Person bleibe ich dran.`,{rule:'mit Verabredung'},Math.max(1,p-1),'Soziale Verbindlichkeit trägt, wenn die Lust fehlt.');
   add('why',`An dein Warum koppeln: vor dem Start 1 Satz notieren`,`Wenn ich mir den Sinn bewusst mache, fange ich eher an.`,{rule:'Warum vorher notieren'},Math.max(1,p-1),'Verbindet die Handlung mit deinen Werten.');break;
  case'unexpected':add('buffer',`Puffer: ${p}× an ${Math.min(7,p+2)} möglichen Tagen`,`Mit Ersatzterminen fängt der Plan Unerwartetes auf.`,{rule:'Ersatztermin eingeplant'},p,'Unerwartetes passiert; ein Plan mit Puffer ist robuster.');break;
  case'stalled':add('method',`Methode ändern: ${g.method||'eine andere Herangehensweise testen'}`,`Eine andere Methode verbessert „${g.metric.name}“, bei gleicher Umsetzung.`,{method:g.method||'Andere Herangehensweise'},p,'Hohe Aktivität ohne Ergebnis heißt: Menge stimmt, Methode prüfen.');break;
  case'missed':add('restart',`Neustart klein: ${Math.max(1,Math.ceil(p/2))}× pro Woche`,`Mit halbem Pensum komme ich wieder in den Rhythmus.`,{perWeek:Math.max(1,Math.ceil(p/2))},Math.max(1,Math.ceil(p/2)),'Nach einer Pause zählt der Wiedereinstieg, nicht die alte Bestmarke.');break;}
 return out}

/* ───── Experimente ───── */
function applyChange(S,L,a,ch,wk){const prev={perWeek:a.perWeek,when:a.when||'',minutes:a.minutes||null,anchor:a.anchor||'',days:a.days||null,rule:a.rule||'',method:a.method||''};
 if(ch.perWeek!=null&&ch.perWeek!==a.perWeek){a.hist=[...(a.hist||[]),{wk,perWeek:ch.perWeek,from:a.perWeek}];a.perWeek=ch.perWeek}
 ['when','minutes','anchor','days','rule','method'].forEach(k=>{if(ch[k]!=null)a[k]=ch[k]});
 syncMission(S,a);return prev}
function syncMission(S,a){const m=(S.missions||[]).find(x=>x.id===a.missionId);if(!m)return;m.title=missionTitle(a);if(a.perWeek>=7){m.freq='daily';delete m.times}else{m.freq='multi';m.times=a.perWeek}}
const missionTitle=a=>a.title+(a.anchor?' · '+a.anchor:a.when?' · '+a.when:'')+(a.minutes?` (${a.minutes} Min.)`:'');
function startExperiment(S,{goalId,aid,obstacle,obstacleText,sug,wk,weeks=1}){const L=S.life,a=actById(L,aid);if(!a)return null;
 (L.exps||[]).filter(e=>e.goalId===goalId&&e.status==='running').forEach(e=>{e.status='replaced'});
 const startWk=wk+1,prev=applyChange(S,L,a,sug.change,startWk);
 const e={id:'e'+uid(),goalId,aid,obstacle:obstacle||null,obstacleText:obstacleText||'',label:sug.label,hypothesis:sug.hypothesis,change:{...sug.change},criterion:{...sug.criterion},startWk,endWk:startWk+weeks-1,status:'running',prev,created:Date.now()};
 L.exps=[...(L.exps||[]),e];return e}
function evalExperiment(L,e){const g=goalById(L,e.goalId);let done=0,need=0;for(let w=e.startWk;w<=e.endWk;w++){done+=doneIn(L,e.aid,w);need+=e.criterion.min}
 const t=g?trend(L,g,e.endWk,e.endWk-e.startWk+1):{state:'none'};const execOk=done>=need;const outOk=!e.criterion.outcome||t.state==='better';
 return{done,need,execOk,outcome:t.state,ok:execOk&&outOk,due:curWk(L)>e.endWk||(L.d%7===6&&curWk(L)===e.endWk)}}
function decideExperiment(S,eid,decision){const L=S.life,e=(L.exps||[]).find(x=>x.id===eid);if(!e)return;const r=evalExperiment(L,e);e.result=r;
 if(decision==='adopt'){e.status=r.ok?'success':'adopted';e.decision='adopt'}
 else if(decision==='extend'){e.endWk+=1;return}
 else{e.status=r.ok?'success':'fail';e.decision='revert';const a=actById(L,e.aid);if(a&&e.prev){if(e.prev.perWeek!==a.perWeek){a.hist=[...(a.hist||[]),{wk:curWk(L)+1,perWeek:e.prev.perWeek,from:a.perWeek}];a.perWeek=e.prev.perWeek}['when','minutes','anchor','days','rule','method'].forEach(k=>{a[k]=e.prev[k]||(k==='minutes'||k==='days'?null:'')});syncMission(S,a)}}
 e.closed=curWk(L);if(r.ok)L.flags={...(L.flags||{}),expWin:true}}

/* ───── Wochenrückblick ───── */
/* Welche Woche ist auszuwerten? Sonntag: die laufende; sonst die letzte, falls offen. */
function reviewWeek(L){const w=curWk(L),di=(L.d||0)%7;const done=k=>(L.reviews||[]).some(r=>r.wk===k);
 if(di>=5&&!done(w))return w;if(w>0&&!done(w-1))return w-1;return null}
function weekSummary(S,wk){const L=S.life;const goals=(L.goals||[]).filter(g=>g.status==='active');
 const rows=goals.map(g=>{const dg=diagnose(L,g,wk);return{g,dg,w:dg.w||goalWeek(L,g,wk),t:trend(L,g,wk,2)}});
 const exps=(L.exps||[]).filter(e=>e.status==='running'&&e.endWk<=wk).map(e=>({e,r:evalExperiment(L,e)}));
 const obst=obstacleCounts(S,wk);return{wk,rows,exps,obst,rate:weekRate(L,wk)}}
/* Hindernisse aus den Tagesrückblicken der Woche zählen */
function obstacleCounts(S,wk){const L=S.life,c={};(L.daily||[]).filter(x=>x.wk===wk).forEach(x=>(x.obst||[]).forEach(o=>{c[o]=(c[o]||0)+1}));return c}
function saveWeeklyReview(S,rv){const L=S.life;L.reviews=[...(L.reviews||[]).filter(r=>r.wk!==rv.wk),{...rv,t:Date.now()}].sort((a,b)=>a.wk-b.wk);L.flags={...(L.flags||{}),review:true}}

/* ───── Ereignisse aus der App ───── */
function onComplete(S,mid){const L=S.life;if(!L)return null;const a=(L.actions||[]).find(x=>x.missionId===mid&&!x.off);if(!a)return null;
 L.log=[...(L.log||[]),{aid:a.id,d:L.d,wk:curWk(L),t:Date.now()}].slice(-2000);return a}
function onAdvance(S){if(S.life)S.life.d=(S.life.d||0)+1}
function onDailyReview(S,blocks){const L=S.life;if(!L)return;const obst=(blocks||[]).map(b=>BLOCK_MAP[b]).filter(Boolean);
 L.daily=[...(L.daily||[]).filter(x=>x.d!==L.d),{d:L.d,wk:curWk(L),obst}].slice(-120)}
/* ───── Daily Debrief: App wertet aus, Nutzer liefert nur Stimmung, Hindernis, Wunsch ─────
   entry: {d, wk, mood:'good'|'ok'|'hard', obst:[code], done:[mid], skipped:[mid], change:'earlier'|'smaller'|'keep'|null} */
const MOODS=[['good','Gut'],['ok','Okay'],['hard','Schwierig']];
const DEBRIEF_OBST=[['time','Keine Zeit'],['energy','Keine Energie'],['unclear','Schlecht geplant'],['unexpected','Etwas anderes']];
const CHANGES=[['earlier','Morgen früher einplanen'],['smaller','Kleiner machen'],['keep','Plan beibehalten']];
function onDebrief(S,x){const L=S.life;if(!L)return;const e={d:L.d,wk:curWk(L),mood:x.mood||null,obst:x.obst||[],done:x.done||[],skipped:x.skipped||[],change:x.change||null,t:Date.now()};
 L.daily=[...(L.daily||[]).filter(y=>y.d!==L.d),e].slice(-120);L.flags={...(L.flags||{}),debrief:true};return e}
/* Muster aus den letzten 14 Tagen. Nur Vorschläge, nie automatische Planänderung.
   S.ctime: {missionId:[{t:Minuten}]} = Uhrzeiten erledigter Einheiten */
function debriefPatterns(S,days=14){const L=S.life;if(!L)return[];const from=(L.d||0)-days,ent=(L.daily||[]).filter(e=>e.d>from);const out=[];
 (L.actions||[]).filter(a=>!a.off&&(goalById(L,a.goalId)||{}).status==='active').forEach(a=>{
  const sk=ent.filter(e=>(e.skipped||[]).includes(a.missionId)),skips=sk.length,wantSmall=sk.some(e=>e.change==='smaller'&&(e.skipped.length===1||skips>=2));if(skips<3&&!wantSmall)return;
  const times=((S.ctime||{})[a.missionId]||[]).map(x=>x.t).filter(t=>typeof t==='number'),morning=times.filter(t=>t<720).length;
  const ob={};sk.forEach(e=>(e.obst||[]).forEach(o=>{ob[o]=(ob[o]||0)+1}));const top=Object.entries(ob).sort((p,q)=>q[1]-p[1])[0];
  const g=goalById(L,a.goalId),p=a.perWeek;
  if(!wantSmall&&a.when!=='morgens'&&(!times.length||morning/times.length>=.6)){const m=Math.min(20,a.minutes||20);
   out.push({aid:a.id,goalId:g.id,kind:'morning',skips,obst:top&&top[0],text:`„${a.title}“ wurde ${skips}× ausgelassen${times.length?', erledigt hast du es meist morgens':''}. Testen, ob ein ${m}-Minuten-Block am Morgen besser funktioniert?`,
    sug:{id:'pattern',kind:'pattern',label:`${m}-Minuten-Block am Morgen`,hypothesis:`Morgens setze ich „${a.title}“ zuverlässiger um.`,change:{when:'morgens',minutes:m},criterion:{min:Math.max(1,Math.min(p,3)),outcome:false},why:'Aus deinen Debriefs erkannt'}})}
  else{const m=a.minutes?Math.max(10,Math.round((a.minutes/2)/5)*5):null;const why=skips>=3?(top?(top[1]>1?' (meist: ':' (Grund: ')+((OBST[top[0]]||{l:top[0]}).l)+')':''):'';
   out.push({aid:a.id,goalId:g.id,kind:'smaller',skips,obst:top&&top[0],text:skips>=3?`„${a.title}“ wurde ${skips}× ausgelassen${why}. Testen, ob eine kleinere Version${m?' mit '+m+' Minuten':''} besser funktioniert?`:`Du wolltest „${a.title}“ kleiner machen. Testen, ob eine kleinere Version${m?' mit '+m+' Minuten':''} besser funktioniert?`,
    sug:{id:'pattern',kind:'pattern',label:m?`Kleinere Version: ${m} Minuten`:'Kleinere Version: Minimalschritt',hypothesis:`Mit einer kleineren Version fange ich „${a.title}“ auch an schwierigen Tagen an.`,change:m?{minutes:m}:{rule:'Minimalschritt genügt'},criterion:{min:Math.max(1,p-1),outcome:false},why:'Aus deinen Debriefs erkannt'}})}});
 return out.sort((x,y)=>y.skips-x.skips)}
/* Monats-Check: alle 4 Wochen kurz prüfen, ob die Ziele noch sinnvoll sind */
function monthlyDue(L){const w=curWk(L);if(w<3)return null;const k=w%4===3?Math.floor(w/4):Math.floor(w/4)-1;return k>=0&&!(L.monthly||[]).some(x=>x.m>=k)&&((L.goals||[]).some(g=>g.status==='active')||Object.values(L.standards||{}).some(s=>s.std&&s.status!=='paused'))?k:null}
function saveMonthly(S,m,decisions){const L=S.life;L.monthly=[...(L.monthly||[]),{m,t:Date.now(),decisions:decisions||{}}];Object.entries(decisions||{}).forEach(([gid,d])=>{if(d==='archive')setGoalStatus(S,gid,'archived')})}
/* ───── Abendritual: nach dem Debrief den nächsten Tag vorbereiten ─────
   Eine Handlung, ein Zeitfenster, optional ein Wenn-dann-Plan gegen das wahrscheinlichste Hindernis.
   entry: {d (Abend), for (Tag der Umsetzung), mid, aid, when, risk, plan}. Ändert den Plan der Handlung nicht. */
const EVE_WHEN=[['morgens','Morgens'],['mittags','Mittags'],['abends','Abends']];
const EVE_RISK=[['time','Wenig Zeit'],['energy','Wenig Energie'],['distract','Ablenkung'],['none','Nichts Besonderes']];
const EVE_ANCHOR={morgens:'Nach dem Aufstehen',mittags:'Nach dem Mittagessen',abends:'Nach der Arbeit'};
function ifThen(risk,title,when,minutes){const T='„'+title+'“';
 switch(risk){
  case'time':{const m=minutes>=20?Math.max(10,Math.round(minutes*.5/5)*5):null; /* Kurzversion nur, wenn sie wirklich kürzer ist */return m?`Wenn der Tag voll wird, mache ich ${T} in der Kurzversion (${m} Min.).`:`Wenn der Tag voll wird, erledige ich ${T} als Erstes, bevor anderes dazwischenkommt.`}
  case'energy':return`Wenn ich müde bin, fange ich trotzdem an. Nur die ersten 5 Minuten.`;
  case'distract':return`Wenn ich mit ${T} anfange, liegt das Handy in einem anderen Raum.`;
  default:return`${EVE_ANCHOR[when]||'Zur geplanten Zeit'} starte ich mit ${T}.`}}
function onEvening(S,x){const L=S.life;const sd=x&&x.std&&L&&(L.standards||{})[x.std];if(!L||!x||(!x.mid&&!(sd&&sd.std)))return null;const a=x.mid?(L.actions||[]).find(y=>y.missionId===x.mid&&!y.off):null;
 const m=x.mid?(S.missions||[]).find(y=>y.id===x.mid):null;const title=sd?sd.std.text:(a&&a.title)||(m&&m.title)||'';const when=EVE_WHEN.some(w=>w[0]===x.when)?x.when:null;const risk=x.risk||null;
 const e={d:L.d||0,for:(L.d||0)+1,mid:sd?null:x.mid,std:sd?x.std:undefined,aid:a?a.id:null,when,risk,plan:ifThen(risk,title,when,sd?sd.std.minutes:a&&a.minutes),t:Date.now()};
 L.evening=[...(L.evening||[]).filter(y=>y.for!==e.for),e].slice(-90);L.flags={...(L.flags||{}),evening:true};return e}
const eveningFor=(L,d)=>((L&&L.evening)||[]).find(e=>e.for===d)||null;
/* Wie oft wurde die abends festgelegte Handlung am nächsten Tag umgesetzt? Nur abgeschlossene Tage zählen. */
function eveningStats(L,days=14){const cur=L.d||0;const ent=(L.evening||[]).filter(e=>e.aid&&e.for<cur&&e.for>=cur-days);
 const kept=ent.filter(e=>(L.log||[]).some(x=>x.aid===e.aid&&x.d===e.for)).length;return{planned:ent.length,kept,rate:ent.length?kept/ent.length:null}}
function addMeasurement(S,gid,v,note){const L=S.life,g=goalById(L,gid);if(!g||v==null||!isFinite(v))return null;
 if(g.metric.start==null&&!measOf(L,gid).length)g.metric.start=v;
 L.meas=[...(L.meas||[]),{id:'v'+uid(),goalId:gid,v,d:L.d,t:Date.now(),note:note||''}];
 if(g.status==='active'&&reached(g,v)){g.status='achieved';g.achievedWk=curWk(L);L.flags={...(L.flags||{}),goal:true};return'achieved'}
 L.flags={...(L.flags||{}),measure:true};return'ok'}

/* ───── Life Audit: freiwillige Bestandsaufnahme in acht Bereichen ─────
   Pro Bereich alles optional: sat 1–10, now/proud/change (Freitext, max. 280), obst (Hindernis-Codes).
   Datensparsam: Freitexte bleiben auf dem Gerät. Für Personalisierung und eine spätere Synchronisation
   nur auditForSync/auditSummary verwenden (Zahlen und Codes, keine Texte). area = Zuordnung zu AREAS. */
const AUDIT_AREAS=[
 {id:'body',area:'health',name:'Körper und Fitness',icon:'heartpulse',q:'Wie zufrieden bist du gerade mit deinem Körper und deiner Fitness?',ph:{now:'z. B. Ich sitze viel und bewege mich kaum, schlafe aber gut.',proud:'z. B. Ich gehe jeden Tag zu Fuß zur Arbeit.',change:'z. B. Wieder regelmäßig Sport machen.'}},
 {id:'mind',area:'health',name:'Mentale Verfassung und Energie',icon:'sun',q:'Wie geht es dir innerlich, und wie viel Energie hast du?',ph:{now:'z. B. Abends bin ich oft leer und gereizt.',proud:'z. B. Ich merke früher, wenn es mir zu viel wird.',change:'z. B. Mehr Pausen, die wirklich erholen.'}},
 {id:'career',area:'wealth',name:'Beruf und Karriere',icon:'briefcase',q:'Wie zufrieden bist du mit deiner Arbeit und deiner beruflichen Richtung?',ph:{now:'z. B. Sicherer Job, aber ich lerne kaum noch etwas.',proud:'z. B. Ich habe ein schwieriges Projekt abgeschlossen.',change:'z. B. Eine Aufgabe mit mehr Verantwortung.'}},
 {id:'money',area:'wealth',name:'Finanzen',icon:'coins',q:'Wie sicher und handlungsfähig fühlst du dich finanziell?',ph:{now:'z. B. Am Monatsende bleibt kaum etwas übrig.',proud:'z. B. Ich habe keine Schulden.',change:'z. B. Eine kleine Rücklage aufbauen.'}},
 {id:'people',area:'relationships',name:'Familie, Freundschaften, Beziehungen',icon:'users',q:'Wie verbunden fühlst du dich mit den Menschen, die dir wichtig sind?',ph:{now:'z. B. Freunde sehe ich nur noch selten.',proud:'z. B. Zu meiner Familie habe ich ein gutes Verhältnis.',change:'z. B. Mich öfter von selbst melden.'}},
 {id:'habits',area:'growth',name:'Disziplin und Gewohnheiten',icon:'check',q:'Wie zufrieden bist du mit deinen Gewohnheiten und deiner Selbstdisziplin?',ph:{now:'z. B. Ich fange viel an und höre nach zwei Wochen auf.',proud:'z. B. Ich stehe jeden Tag zur selben Zeit auf.',change:'z. B. Weniger Handy am Abend.'}},
 {id:'learn',area:'growth',name:'Entwicklung und Lernen',icon:'book',q:'Wie zufrieden bist du damit, wie du dich weiterentwickelst?',ph:{now:'z. B. Ich lese kaum noch.',proud:'z. B. Ich habe mir selbst Programmieren beigebracht.',change:'z. B. Eine Sprache lernen.'}},
 {id:'meaning',area:'growth',name:'Sinn, Werte, Zufriedenheit',icon:'compass',q:'Wie stimmig fühlt sich dein Leben insgesamt für dich an?',ph:{now:'z. B. Es läuft, aber ich weiß nicht genau, wofür.',proud:'z. B. Ich bin für andere da, wenn es darauf ankommt.',change:'z. B. Mehr Zeit für das, was mir wichtig ist.'}}];
const AUDIT=Object.fromEntries(AUDIT_AREAS.map(a=>[a.id,a]));
const AUDIT_FIELDS=['sat','now','proud','change','obst'];
const AUDIT_MAX=280;
function cleanAuditEntry(x){const o={};if(!x)return o;const s=Math.round(+x.sat);if(x.sat!=null&&x.sat!==''&&s>=1&&s<=10)o.sat=s;
 ['now','proud','change'].forEach(k=>{const v=typeof x[k]==='string'?x[k].slice(0,AUDIT_MAX):'';if(v.trim())o[k]=v});
 const ob=(x.obst||[]).filter(c=>OBST[c]);if(ob.length)o.obst=[...new Set(ob)].slice(0,3);if(x.skip)o.skip=true;return o}
/* Patch für einen Bereich anwenden; leere Felder werden entfernt, nichts wird erfunden */
function setAudit(audit,id,patch){const A={v:1,areas:{},...(audit||{})};if(!AUDIT[id])return A;const cur=(A.areas||{})[id]||{};
 const next=cleanAuditEntry({...cur,...patch});A.areas={...(A.areas||{}),[id]:next};if(!Object.keys(next).length){const n={...A.areas};delete n[id];A.areas=n}
 A.updated=Date.now();if(!A.started)A.started=A.updated;return A}
/* Zustand je Bereich: open (nichts), skipped (bewusst später), partial, done (alle fünf beantwortet) */
function auditState(audit,id){const x=((audit||{}).areas||{})[id];if(!x)return'open';const n=AUDIT_FIELDS.filter(k=>k==='sat'?x.sat!=null:k==='obst'?(x.obst||[]).length:x[k]).length;
 if(!n)return x.skip?'skipped':'open';return n>=AUDIT_FIELDS.length?'done':'partial'}
/* Nur Zahlen und Codes: Grundlage für Personalisierung. Fehlende Werte bleiben null, nie 0. */
function auditSummary(audit){const A=(audit||{}).areas||{};const by={};AREAS.forEach(a=>{by[a.id]={sum:0,n:0}});const obst={};let rated=0,touched=0;
 AUDIT_AREAS.forEach(a=>{const x=A[a.id];if(!x)return;if(auditState(audit,a.id)!=='open'&&auditState(audit,a.id)!=='skipped')touched++;if(x.sat!=null){rated++;by[a.area].sum+=x.sat;by[a.area].n++}(x.obst||[]).forEach(o=>{obst[o]=(obst[o]||0)+1})});
 const areas=Object.fromEntries(Object.entries(by).map(([k,v])=>[k,v.n?Math.round(v.sum/v.n*10)/10:null]));
 const wish=AUDIT_AREAS.filter(a=>A[a.id]&&A[a.id].change).map(a=>a.id);
 return{rated,touched,areas,obst:Object.entries(obst).sort((p,q)=>q[1]-p[1]).map(([id,n])=>({id,n})),wish,total:AUDIT_AREAS.length}}
function auditForSync(audit){const A=(audit||{}).areas||{};return{v:1,areas:Object.fromEntries(Object.entries(A).map(([id,x])=>[id,{sat:x.sat??null,obst:[...(x.obst||[])],hasText:!!(x.now||x.proud||x.change),skip:!!x.skip}]))}}

/* ───── „Wer könntest du werden?“ – eigenes Erfolgsbild, heutiges vs. mögliches Ich ─────
   Erfolg definiert der Nutzer selbst (Auswahl ist nur Anregung, eigene Formulierung möglich).
   Freitexte sind privat wie im Life Audit; futureForSync liefert nur Struktur, keine Texte. */
const FUTURE_SUCCESS=['Zeit für das, was mir wichtig ist','Gesund und kräftig bleiben','Tiefe Beziehungen','Etwas meisterhaft können','Innere Ruhe','Für andere da sein','Finanzielle Sicherheit','Freiheit, selbst zu entscheiden','Etwas Eigenes aufbauen','Neues erleben'];
const FUTURE_TXT={past1:200,past2:200,past3:200,vision:280,identity:200,successOwn:120,now:120,then:120};
function cleanFuture(x){const o={};if(!x)return o;const t=(k,v)=>typeof v==='string'&&v.trim()?v.slice(0,FUTURE_TXT[k]):null;
 ['past1','past2','past3','vision','identity','successOwn'].forEach(k=>{const v=t(k,x[k]);if(v)o[k]=v});
 const su=(x.success||[]).filter(s=>FUTURE_SUCCESS.includes(s));if(su.length)o.success=[...new Set(su)].slice(0,3);
 const rows=(x.rows||[]).filter(r=>r&&AUDIT[r.area]).map(r=>{const y={area:r.area};const n=t('now',r.now),th=t('then',r.then);if(n)y.now=n;if(th)y.then=th;return y});
 const seen=new Set();const R=rows.filter(r=>!seen.has(r.area)&&seen.add(r.area)).slice(0,4);if(R.length)o.rows=R;return o}
/* Erfolgsbild als lesbarer Satz (für Ziel- und Standardsetzung) */
const futureSuccess=f=>[...((f&&f.success)||[]),...(f&&f.successOwn?[f.successOwn.trim()]:[])];
function futureForSync(f){const x=cleanFuture(f);return{v:1,success:[...(x.success||[])],hasOwn:!!x.successOwn,hasVision:!!x.vision,hasIdentity:!!x.identity,rows:(x.rows||[]).map(r=>({area:r.area,hasNow:!!r.now,hasThen:!!r.then}))}}

/* ───── Persönliche Standards je Lebensbereich ─────
   Current State (current/base), Desired State (desired), Personal Standard (std), Minimum Commitment (min).
   Vorschläge nur aus vorhandenen Angaben; der Nutzer entscheidet. Keine Einträge = 'nodata', nie „verfehlt“. */
const STD_LEVELS=[['new','Einsteiger'],['back','Wiedereinstieg'],['exp','Erfahren']];
const STD_LV=Object.fromEntries(STD_LEVELS);
const STD_TPL={
 health:{new:{std:['Bewegung, 30 Minuten',2,30],min:['10 Minuten spazieren oder dehnen',10]},back:{std:['Training, 30 Minuten',3,30],min:['Ein Satz Kniebeugen und Liegestütze',5]},exp:{std:['Training nach Plan, 45 Minuten',4,45],min:['15 Minuten Mobilität',15]}},
 relationships:{new:{std:['Bewusste Zeit mit einem wichtigen Menschen',1,30],min:['Eine Nachricht an jemanden, der dir wichtig ist',2]},back:{std:['Zeit ohne Handy mit Familie oder Freunden',2,30],min:['Ein kurzer Anruf',5]},exp:{std:['Ungeteilte Aufmerksamkeit für einen nahen Menschen',4,20],min:['Ehrlich nachfragen, wie es jemandem geht',3]}},
 wealth:{new:{std:['Ausgaben der Woche prüfen',1,10],min:['Kontostand ansehen',2]},back:{std:['Finanzen ordnen und sparen',2,15],min:['Eine Ausgabe bewusst auslassen',1]},exp:{std:['Arbeit an Einkommen oder Vermögen',3,45],min:['Eine Zahl prüfen, die zählt',5]}},
 growth:{new:{std:['Lernen oder lesen, 15 Minuten',3,15],min:['5 Minuten lesen',5]},back:{std:['Lernen oder üben, 20 Minuten',4,20],min:['Eine Seite lesen oder eine Übung',5]},exp:{std:['Gezielte Übung, 45 Minuten',5,45],min:['10 Minuten Wiederholung',10]}}};
/* Zufriedenheit 1–10 aus Audit (Vorrang) oder Säulen (1–5 → ×2); null, wenn nichts vorliegt */
function areaSatFrom(audit,pillars,area){const A=(audit&&audit.areas)||{};const v=AUDIT_AREAS.filter(a=>a.area===area).map(a=>(A[a.id]||{}).sat).filter(x=>x!=null);
 if(v.length)return{sat:Math.round(v.reduce((s,x)=>s+x,0)/v.length*10)/10,src:'audit'};const p=pillars&&pillars[area];const ps=typeof p==='object'&&p?p.sat:p;return ps?{sat:ps*2,src:'pillars'}:{sat:null,src:null}}
/* x: {area, level, action:{title,perWeek,minutes}|null, sat, satSrc} */
function suggestStandard(x){const area=AREA[x.area]?x.area:'health',lv=STD_TPL[area][x.level]?x.level:'new',T=STD_TPL[area][lv],why=[];
 let std={text:T.std[0],perWeek:T.std[1],minutes:T.std[2]};const min={text:T.min[0],minutes:T.min[1]};
 if(x.action&&String(x.action.title||'').trim()){let p=clamp(Math.round(+x.action.perWeek)||T.std[1],1,7);if(lv==='new'&&p>3){p=3;why.push('Für den Einstieg auf 3× pro Woche begrenzt. Steigern kannst du später.')}
  std={text:String(x.action.title).trim(),perWeek:p,minutes:+x.action.minutes||T.std[2]};why.push('Aus deiner Ziel-Handlung übernommen.')}
 else why.push('Vorlage für „'+STD_LV[lv]+'“.');
 if(x.sat!=null&&x.sat>=7&&lv!=='new'&&std.perWeek<7){std={...std,perWeek:std.perWeek+1};why.push('Du stehst hier schon gut da: ein Schritt anspruchsvoller.')}
 else if(x.sat!=null&&x.sat<=3){if(!x.action&&std.perWeek>2)std={...std,perWeek:std.perWeek-1}; /* nie unter 2×: realistisch, aber nicht beliebig */why.push('Der Bereich fühlt sich gerade schwer an: lieber klein und sicher starten.')}
 return{std,min,level:lv,why}}
function cleanStd(s,isMin){if(!s||!String(s.text||'').trim())return null;const o={text:String(s.text).slice(0,90)}; /* nicht trimmen: wird beim Tippen live gespeichert */if(!isMin)o.perWeek=clamp(Math.round(+s.perWeek)||1,1,7);const m=Math.round(+s.minutes);if(m>0)o.minutes=clamp(m,1,240);return o}
function setStandard(L,area,p,why){if(!L||!AREA[area])return null;L.standards=L.standards||{};const cur=L.standards[area],wk=curWk(L);p=p||{};
 const n=cur?{...cur}:{area,level:'new',created:Date.now(),base:{wk,sat:null},hist:[],status:'active'};
 if(p.level&&STD_TPL[area][p.level])n.level=p.level;
 if(p.desired!==undefined)n.desired=String(p.desired||'').slice(0,140);
 if(p.current!==undefined){const s=p.current&&p.current.sat!=null&&p.current.sat!==''?clamp(Math.round(+p.current.sat),1,10):null;n.current={sat:s,note:String((p.current&&p.current.note)||'').slice(0,140)};if(!cur&&n.base.sat==null)n.base={...n.base,sat:s}}
 const s=p.std!==undefined?cleanStd(p.std):n.std,m=p.min!==undefined?cleanStd(p.min,true):n.min;
 if(cur&&(JSON.stringify(s)!==JSON.stringify(cur.std)||JSON.stringify(m)!==JSON.stringify(cur.min)))n.hist=[...(cur.hist||[]),{wk,std:cur.std||null,min:cur.min||null,why:why||''}].slice(-30);
 n.std=s||null;n.min=m||null;if(p.aid!==undefined)n.aid=p.aid||null;if(p.status==='active'||p.status==='paused')n.status=p.status;n.updated=Date.now();
 const empty=!n.std&&!n.min&&!(n.desired||'').trim()&&!(n.current&&(n.current.note||n.current.sat!=null));
 if(empty){delete L.standards[area];return null}L.standards[area]=n;return n}
function rerateStandard(L,area,sat){const s=(L.standards||{})[area];if(!s)return null;const v=sat==null||sat===''?null:clamp(Math.round(+sat),1,10);s.current={...(s.current||{note:''}),sat:v};s.rated=[...(s.rated||[]),{wk:curWk(L),sat:v}].slice(-24);s.updated=Date.now();if(s.base&&s.base.sat==null&&v!=null)s.base={...s.base,sat:v};return s}
function removeStandard(L,area){if(L&&L.standards)delete L.standards[area];if(L&&L.stdLog)L.stdLog=L.stdLog.filter(x=>x.area!==area)}
function logStandard(L,area,kind){const s=(L.standards||{})[area];if(!s)return null;const e={area,d:L.d||0,wk:curWk(L),kind:kind==='min'?'min':'std',t:Date.now()};L.stdLog=[...(L.stdLog||[]),e].slice(-1000);return e}
/* Soll in Woche wk: Änderungen gelten ab ihrer Woche (wie plannedAt) */
function stdPerWeekAt(s,wk){const h=(s.hist||[]).find(x=>x.wk>wk&&x.std);return h?h.std.perWeek:(s.std?s.std.perWeek:null)}
function standardWeek(L,area,wk){const s=(L.standards||{})[area];if(!s||!s.std)return null;const since=(s.base&&s.base.wk)??0;if(wk<since)return null;
 const per=stdPerWeekAt(s,wk)||1,lg=(L.stdLog||[]).filter(x=>x.area===area&&x.wk===wk),act=s.aid?doneIn(L,s.aid,wk):0;
 const done=act+lg.filter(x=>x.kind==='std').length,min=lg.filter(x=>x.kind==='min').length;
 return{wk,per,done,min,state:done>=per?'met':done>0?'partial':min>0?'min':'nodata'}}
/* Rückmeldung entlang des Success Loops; Anpassung nur als Vorschlag */
function standardFeedback(L,area){const s=(L.standards||{})[area];if(!s||!s.std)return null;const w=curWk(L),cur=standardWeek(L,area,w);
 const past=[1,2,3].map(k=>standardWeek(L,area,w-k)).filter(Boolean);
 const low=past.filter(x=>x.state==='partial'||x.state==='min').length,met3=past.length===3&&past.every(x=>x.state==='met'),empty=past.length>=2&&past.slice(0,2).every(x=>x.state==='nodata');
 const p1=standardWeek(L,area,w-1),p2=standardWeek(L,area,w-2),comeback=!!(p1&&p1.state==='met'&&p2&&p2.state==='nodata');
 let adapt=null;if(s.status!=='paused'){
  if(low>=2)adapt={kind:'lighter',text:'In den letzten Wochen war der Standard oft mehr, als der Alltag hergab. Das ist ein Signal, kein Versagen. Möchtest du ihn anpassen?'};
  else if(empty)adapt={kind:'rest',text:'Seit zwei Wochen gibt es keine Einträge. Vielleicht passt der Standard gerade nicht zu deiner Lage. Soll er ruhen, oder möchtest du ihn anpassen?'};
  else if(met3)adapt={kind:'raise',text:'Drei Wochen in Folge gehalten. Wenn es sich leicht anfühlt, kannst du ihn etwas anspruchsvoller machen. Musst du aber nicht.'}}
 const feed=!cur?null:cur.state==='met'?'Standard für diese Woche gehalten.':cur.state==='min'?'Minimum gehalten. Du bist drangeblieben.':cur.state==='partial'?'Auf dem Weg.':null;
 return{cur,feed,adapt,comeback}}
function adaptOptions(s,kind){if(!s||!s.std)return[];const o=[],p=s.std.perWeek,m=s.std.minutes;
 if(kind==='raise'){if(p<7)o.push({label:(p+1)+'× pro Woche',std:{...s.std,perWeek:p+1}});if(m)o.push({label:Math.round(m*1.25/5)*5+' Minuten',std:{...s.std,minutes:Math.round(m*1.25/5)*5}});return o}
 if(p>1)o.push({label:(p-1)+'× pro Woche',std:{...s.std,perWeek:p-1}});if(m&&m>10)o.push({label:'Kürzer: '+Math.max(5,Math.round(m*.6/5)*5)+' Minuten',std:{...s.std,minutes:Math.max(5,Math.round(m*.6/5)*5)}});
 o.push({label:'Zwei Wochen ruhen lassen',status:'paused'});return o}
/* Fortschritt relativ zur eigenen Ausgangslage */
function standardProgress(L,area){const s=(L.standards||{})[area];if(!s||!s.std)return null;const w=curWk(L),from=(s.base&&s.base.wk)??0,weeks=[];
 for(let k=from;k<w;k++){const x=standardWeek(L,area,k);if(x)weeks.push(x)}
 const rate=a=>{const v=a.filter(x=>x.state!=='nodata');return v.length?Math.round(v.reduce((t,x)=>t+Math.min(1,x.done/x.per),0)/v.length*100)/100:null};
 return{weeks:weeks.length,kept:weeks.filter(x=>x.state==='met').length,held:weeks.filter(x=>x.state!=='nodata').length,first:rate(weeks.slice(0,4)),last:weeks.length>=6?rate(weeks.slice(-4)):null,baseSat:(s.base&&s.base.sat)??null,nowSat:(s.current&&s.current.sat)??null}}
function standardsForSync(L){return Object.fromEntries(Object.entries((L&&L.standards)||{}).map(([a,s])=>[a,{level:s.level,perWeek:s.std&&s.std.perWeek||null,hasMin:!!s.min,status:s.status}]))}

/* ───── Dein persönliches Fundament: Abschnitte, Zustände, Einladungen ───── */
/* Produktprinzip: Selbsterkenntnis → Eigenverantwortung → Standards → Handeln. Abschnitte sind den Stufen zugeordnet. */
const FUND_STAGES=[{n:1,name:"Selbsterkenntnis"},{n:2,name:"Eigenverantwortung"},{n:3,name:"Persönliche Standards"},{n:4,name:"Konsequentes Handeln"}];
const FUND=[{id:"audit",stage:1,name:"Bestandsaufnahme",sub:"Life Audit in acht Bereichen"},{id:"future",stage:1,name:"Zukunftsvision",sub:"Wer könntest du werden?"},{id:"owner",stage:2,name:"Radical Ownership",sub:"Was liegt in deiner Hand?"},{id:"values",stage:3,name:"Werte",sub:"Woran du dich misst"},{id:"standards",stage:3,name:"Persönliche Standards",sub:"Verhalten und Minimum je Bereich"},{id:"model",stage:4,name:"Success Loop",sub:"Wie aus Handeln Fortschritt wird"},{id:"goal",stage:4,name:"Ziel und erste Handlung",sub:"Ein messbares Ergebnis"}];
function fundState(S,id){const L=(S&&S.life)||{},F=L.fund||{};
 const st=(done,partial)=>done?'done':partial?'partial':(F.skip||{})[id]?'skipped':'open';
 if(id==='model')return st(!!(F.seen||{}).loop,false);
 if(id==='owner')return st(!!((F.seen||{}).owner||(L.onboard&&L.onboard.own&&L.onboard.own.next)),false);
 if(id==='audit'){const sts=AUDIT_AREAS.map(a=>auditState(L.audit,a.id));const touched=sts.some(x=>x==='partial'||x==='done');return st(touched&&sts.every(x=>x==='done'||x==='skipped'),touched)}
 if(id==='future'){const f=L.future||{};return st(!!((f.success||[]).length||f.successOwn)&&!!(f.vision||f.identity),Object.keys(f).length>0)}
 if(id==='values')return st(((S.principles||[]).length||(L.values||[]).length)>0,false);
 if(id==='standards'){const all=Object.values(L.standards||{});const full=x=>x&&x.std&&x.min;const f=L.focus&&(L.standards||{})[L.focus];return st(f?!!full(f):all.some(full),all.length>0)}
 if(id==='goal')return st((L.goals||[]).some(g=>g.status==='active'&&actionsOf(L,g.id).length),(L.goals||[]).length>0);
 return'open'}
function fundSections(S){return FUND.map(x=>({...x,state:fundState(S,x.id)}))}
function setFundSkip(L,id,on){L.fund={v:1,...(L.fund||{})};const k={...(L.fund.skip||{})};if(on)k[id]=Date.now();else delete k[id];L.fund.skip=k}
function markSeen(L,key){L.fund={v:1,...(L.fund||{})};L.fund.seen={...(L.fund.seen||{}),[key]:Date.now()}}
/* Höchstens eine Einladung, frühestens ab Tag 1, dann höchstens alle 3 Tage; ablehnbar, nie aufdringlich */
/* Reihenfolge nach Stufen; eine Stufe wird erst angeboten, wenn jede Stufe davor begonnen oder bewusst übersprungen ist */
function inviteCandidates(S){const L=S.life||{},F=L.fund||{},d=L.d||0,start=(F.ob&&F.ob.d)??0,age=d-start,sec=Object.fromEntries(fundSections(S).map(x=>[x.id,x.state])),c=[];
 const stageOk=k=>FUND_STAGES.filter(x=>x.n<k).every(x=>FUND.filter(y=>y.stage===x.n).some(y=>sec[y.id]!=="open"));const f=L.focus&&AREA[L.focus]?L.focus:null;
 const add=(k,sid,day,o)=>{const st=(FUND.find(x=>x.id===sid)||{}).stage;if(age>=day&&stageOk(st))c.push({key:k,sec:sid,...o})};
 if(sec.audit==="open")add("audit","audit",1,{text:"Du hast noch keine Bestandsaufnahme gemacht. Möchtest du mit einem Bereich anfangen? Etwa eine Minute."});
 if(sec.future==="open")add("future","future",4,{text:"Magst du dir ein Bild davon machen, wer du in drei Jahren sein könntest?"});
 if(sec.owner==="open")add("owner","owner",6,{text:"Magst du in drei kurzen Situationen sehen, was in deiner Hand liegt und was nicht?"});
 if(sec.values==="open")add("values","values",8,{text:"Du hast noch keine Werte gewählt. Möchtest du festhalten, woran du dich messen willst?"});
 if(f&&!(L.standards||{})[f]&&sec.standards!=="skipped")add("std-"+f,"standards",10,{area:f,text:"Du hast deine persönlichen Standards für "+AREA[f].de+" noch nicht definiert. Möchtest du das jetzt tun?"});
 if(sec.model==="open")add("model","model",12,{text:"Magst du in einer Minute sehen, wie dir die App beim Dranbleiben hilft?"});
 return{c,age,d}}
function nextInvite(S){const L=S.life;if(!L)return null;const inv=(L.fund||{}).inv||{};const {c,age,d}=inviteCandidates(S);if(age<1)return null;
 if(inv.cur&&inv.cur.d===d){const k=c.find(x=>x.key===inv.cur.key);return k&&!(inv.ans||{})[d]?k:null}
 if(inv.cur&&d-inv.cur.d<3)return null;
 return c.find(x=>!(inv.never||{})[x.key]&&!((inv.seen||{})[x.key]&&d-inv.seen[x.key].d<14))||null}
function showInvite(L,key){L.fund={v:1,...(L.fund||{})};L.fund.inv={...(L.fund.inv||{}),cur:{key,d:L.d||0}}}
function answerInvite(L,key,ans){L.fund={v:1,...(L.fund||{})};const inv={...(L.fund.inv||{})},d=L.d||0,n=(((inv.seen||{})[key]||{}).n||0)+(ans==='yes'?0:1);
 inv.seen={...(inv.seen||{}),[key]:{n,d}};inv.ans={[d]:ans};inv.cur={key,d};if(ans==='never'||(ans==='later'&&n>=2))inv.never={...(inv.never||{}),[key]:true};L.fund.inv=inv}
/* Alle persönlichen Fundament-Angaben löschen; Ziele und Handlungen bleiben */
function clearFoundation(S){const L=S.life;if(!L)return;['audit','auditCur','future','futureCur','standards','stdLog'].forEach(k=>delete L[k]);if(L.why)L.why={text:'',q:{}};
 if(L.onboard){delete L.onboard.own;delete L.onboard.commit}(S.principles||[]).forEach(p=>{delete p.std})}

/* ───── Ziele und Handlungen anlegen / ändern ───── */
function addAction(S,goal,x){const L=S.life,area=goal.area,act=areaAct(S,area);const a={id:'a'+uid(),goalId:goal.id,title:x.title,perWeek:clamp(+x.perWeek||1,1,7),minutes:x.minutes||null,when:x.when||'',since:curWk(L)};
 const mid=x.missionId&&(S.missions||[]).some(m=>m.id===x.missionId)?x.missionId:null;
 if(mid){a.missionId=mid}else{a.missionId='m_g'+uid();S.missions=[...(S.missions||[]),{id:a.missionId,act,title:missionTitle(a),pts:a.perWeek>=5?5:7,freq:a.perWeek>=7?'daily':'multi',times:a.perWeek>=7?undefined:a.perWeek,cat:S.acts&&S.acts[act]?S.acts[act].cat:undefined,goal:goal.id}]}
 L.actions=[...(L.actions||[]),a];return a}
function addGoal(S,x){const L=S.life;const g={id:'g'+uid(),area:x.area,title:x.title.trim(),metric:{name:x.metric.name,unit:x.metric.unit||'',fmt:x.metric.fmt||'',dir:x.metric.dir==='down'?'down':'up',target:x.metric.target==null||x.metric.target===''?null:+x.metric.target,start:null,src:x.metric.src||'self'},
 weeks:+x.weeks||12,startWk:curWk(L),status:'active',method:x.method||'',valueIds:x.valueIds||[],why:x.why||'',changes:[],tpl:x.tpl||null};
 L.goals=[...(L.goals||[]),g];(x.actions||[]).forEach(a=>addAction(S,g,a));
 if(x.start!=null&&x.start!==''&&isFinite(+x.start))addMeasurement(S,g.id,+x.start,'Startwert');
 if(!L.main||!goalById(L,L.main)||goalById(L,L.main).status!=='active')L.main=g.id;L.focus=L.focus||g.area;return g}
function updateGoal(S,gid,patch){const L=S.life,g=goalById(L,gid);if(!g)return;const ch=[];
 if(patch.title&&patch.title!==g.title){ch.push(['Titel',g.title,patch.title]);g.title=patch.title}
 if(patch.target!==undefined&&+patch.target!==g.metric.target){ch.push(['Zielwert',g.metric.target,+patch.target]);g.metric.target=+patch.target}
 if(patch.weeks&&+patch.weeks!==g.weeks){ch.push(['Zeitraum',g.weeks,+patch.weeks]);g.weeks=+patch.weeks}
 if(ch.length)g.changes=[...(g.changes||[]),{wk:curWk(L),t:Date.now(),ch}];
 if(g.status==='achieved'&&!reached(g,goalNow(L,g)))g.status='active'}
function setGoalStatus(S,gid,status){const L=S.life,g=goalById(L,gid);if(!g)return;g.status=status;
 if(status==='active'){(L.actions||[]).filter(a=>a.goalId===gid&&a.off).forEach(a=>{a.off=false;if(!(S.missions||[]).some(m=>m.id===a.missionId)){const act=areaAct(S,g.area);S.missions=[...(S.missions||[]),{id:a.missionId,act,title:missionTitle(a),pts:a.perWeek>=5?5:7,freq:a.perWeek>=7?'daily':'multi',times:a.perWeek>=7?undefined:a.perWeek,cat:S.acts&&S.acts[act]?S.acts[act].cat:undefined,goal:gid}]}});if(!L.main)L.main=gid}
 if(status!=='active'){actionsOf(L,gid).forEach(a=>{const m=(S.missions||[]).find(x=>x.id===a.missionId);if(m&&m.goal===gid)S.missions=S.missions.filter(x=>x.id!==m.id);a.off=true});(L.exps||[]).filter(e=>e.goalId===gid&&e.status==='running').forEach(e=>e.status='replaced')}
 if(L.main===gid){const n=(L.goals||[]).find(x=>x.status==='active');L.main=n?n.id:null}}

/* ───── Erkenntnisse: Self-Efficacy, Resilienz, Kompetenz, Compounding (nur echte Daten) ───── */
function insights(S){const L=S.life,ex=L.exps||[],closed=ex.filter(e=>['success','fail','adopted'].includes(e.status));
 const w=curWk(L);let comebacks=0;for(let k=1;k<=w;k++){const a=weekRate(L,k-1),b=weekRate(L,k);if(a===0&&b>0)comebacks++}
 const weeks=[];for(let k=Math.max(0,w-11);k<=w;k++)weeks.push({wk:k,rate:weekRate(L,k),done:(L.log||[]).filter(x=>x.wk===k).length});
 return{sessions:(L.log||[]).length,exps:ex.length,won:ex.filter(e=>e.status==='success').length,closed:closed.length,running:ex.filter(e=>e.status==='running').length,
  playbook:ex.filter(e=>e.status==='success'&&e.decision==='adopt'),achieved:(L.goals||[]).filter(g=>g.status==='achieved').length,reviews:(L.reviews||[]).length,comebacks,weeks}}

/* ───── LIFE TEMPLE ─────
   Drei getrennte Ebenen: Handlung (log), Ergebnis (meas) und Tempel (Bausteine).
   Bausteine werden nach festen, gedeckelten Regeln aus echten Daten freigeschaltet und
   bleiben dauerhaft erhalten. Säulenstufen und Phase werden daraus berechnet, nie gespeichert. */
const TEMPLE_LEN=12;
const STAGES=[{n:1,id:'ruin',name:'Ruine',min:0},{n:2,id:'rebuild',name:'Wiederaufbau',min:2},{n:3,id:'stable',name:'Stabil',min:6},{n:4,id:'strong',name:'Stark',min:11},{n:5,id:'master',name:'Meisterschaft',min:17}];
const PHASES=[{n:1,id:'foundation',name:'The Foundation',de:'Der Anfang'},{n:2,id:'reconstruction',name:'Reconstruction',de:'Der Wiederaufbau'},{n:3,id:'stability',name:'Stability',de:'Die Stabilisierung'},{n:4,id:'refinement',name:'Refinement',de:'Die Veredelung'},{n:5,id:'mastery',name:'Mastery',de:'Der Saisonabschluss'}];
/* Regeln: Punkte je Baustein und Obergrenze je Säule und Saison (gegen bedeutungsloses Abhaken) */
const TEMPLE_RULES={
 first:{pts:1,cap:1,label:'Grundstein gelegt',why:'Erste umgesetzte Ziel-Handlung in diesem Bereich'},
 week:{pts:1,cap:12,label:'Konstante Woche',why:'Abgeschlossene Woche mit mindestens 80 % der geplanten Ziel-Handlungen'},
 comeback:{pts:1,cap:2,label:'Wiederaufgenommen',why:'Konstante Woche direkt nach einer Woche ohne Umsetzung'},
 quarter:{pts:2,cap:4,label:'Ergebnis-Meilenstein',why:'Ein Ziel erreicht 25, 50 oder 75 % seines Ergebniswegs (Messwert)'},
 goal:{pts:3,cap:2,label:'Ziel erreicht',why:'Zielwert erreicht, Gravur in der Säule'},
 exp:{pts:2,cap:3,label:'Bewährte Anpassung',why:'Experiment hat seine Hypothese bestätigt, Emblem am Kapitell'},
 restored:{pts:1,cap:2,label:'Restauriert',why:'Nach dokumentiertem Rückschritt wieder verbessert'}};
const newTemple=(wk,d)=>({v:1,cur:{n:1,startWk:wk,d0:d??wk*7,len:TEMPLE_LEN,ms:[],wx:{}},hist:[],weather:true,anim:true});
const areaOf=(L,gid)=>(goalById(L,gid)||{}).area;
const inSeason=(T,wk)=>wk>=T.cur.startWk&&wk<T.cur.startWk+T.cur.len;
function areaWeek(L,area,wk){let p=0,d=0;(L.goals||[]).filter(g=>g.area===area&&g.status!=='archived').forEach(g=>{const w=goalWeek(L,g,wk);p+=w.planned;d+=w.done});return{planned:p,done:d,rate:p?d/p:null}}
/* Bausteine aus Daten ableiten und neue dauerhaft speichern; gibt neu freigeschaltete zurück */
function syncTemple(S){const L=S.life;if(!L)return[];if(!L.temple)L.temple=newTemple(curWk(L),L.d||0);const T=L.temple,C=T.cur,w=curWk(L),fresh=[];
 const has=id=>C.ms.some(m=>m.id===id);
 const add=(area,kind,id,wk,extra)=>{if(has(id))return;const r=TEMPLE_RULES[kind];if(C.ms.filter(m=>m.area===area&&m.kind===kind).length>=r.cap)return;const m={id,area,kind,pts:r.pts,label:(extra&&extra.label)||r.label,wk,t:Date.now()};C.ms=[...C.ms,m];fresh.push(m)};
 const end=Math.min(w,C.startWk+C.len-1);
 AREAS.forEach(({id:area})=>{
  /* Grundstein: erste erledigte Ziel-Handlung der Saison */
  const aids=new Set((L.actions||[]).filter(a=>areaOf(L,a.goalId)===area).map(a=>a.id));
  const d0=C.d0??C.startWk*7;const lf=C.logFrom||0;const firstLog=(L.log||[]).find((x,i)=>i>=lf&&aids.has(x.aid)&&inSeason(T,x.wk)&&x.d>=d0);if(firstLog)add(area,'first','first-'+area+'-'+C.n,firstLog.wk);
  /* Konstante Wochen (nur abgeschlossene Wochen) und Wiederaufnahme */
  for(let k=C.startWk;k<Math.min(w,C.startWk+C.len);k++){if(k*7<d0)continue;const a=areaWeek(L,area,k);if(a.planned&&a.rate>=.8){add(area,'week','week-'+area+'-'+k,k);const prev=areaWeek(L,area,k-1);if(k>C.startWk&&prev.planned&&prev.done===0)add(area,'comeback','cb-'+area+'-'+k,k)}}
  (L.goals||[]).filter(g=>g.area===area).forEach(g=>{
   /* Ergebnis-Viertel: nur durch Messwerte nach der Startwoche des Ziels */
   const s=goalStart(L,g),t=g.metric.target;if(s!=null&&t!=null&&t!==s){measOf(L,g.id).filter(m=>wkOf(m.d)>g.startWk&&inSeason(T,wkOf(m.d))).forEach(m=>{const p=(m.v-s)/(t-s);[.25,.5,.75].forEach(q=>{if(p>=q)add(area,'quarter','q-'+g.id+'-'+q,wkOf(m.d),{label:'Ergebnis '+Math.round(q*100)+' %: '+g.title})})})}
   if(g.status==='achieved'&&g.achievedWk!=null&&g.achievedWk>g.startWk&&inSeason(T,g.achievedWk))add(area,'goal','goal-'+g.id,g.achievedWk,{label:'Ziel erreicht: '+g.title})});
  (L.exps||[]).filter(e=>e.status==='success'&&areaOf(L,e.goalId)===area&&inSeason(T,e.closed??e.endWk)).forEach(e=>add(area,'exp','exp-'+e.id,e.closed??e.endWk,{label:'Bewährt: '+e.label}));
  /* Verwitterung nur bei dokumentierter Verschlechterung; Restaurierung bei Verbesserung */
  const worse=(L.goals||[]).some(g=>g.area===area&&g.status==='active'&&trend(L,g,w,2).state==='worse');
  const was=!!C.wx[area];if(worse&&!was)C.wx={...C.wx,[area]:{since:w}};
  if(!worse&&was){const better=(L.goals||[]).some(g=>g.area===area&&g.status!=='archived'&&trend(L,g,w,2).state==='better');if(better){add(area,'restored','rest-'+area+'-'+w,w);const n={...C.wx};delete n[area];C.wx=n}}});
 return fresh}
function columnState(L,area){const T=L.temple;const ms=T.cur.ms.filter(m=>m.area===area);const pts=ms.reduce((a,m)=>a+m.pts,0);
 let st=STAGES[0];STAGES.forEach(s=>{if(pts>=s.min)st=s});const nx=STAGES.find(s=>s.n===st.n+1);
 return{area,pts,stage:st.n,stageName:st.name,next:nx?{name:nx.name,need:nx.min-pts}:null,ms,engravings:ms.filter(m=>m.kind==='goal').length,emblems:ms.filter(m=>m.kind==='exp').length,weathered:!!(T.weather&&T.cur.wx[area])}}
function foundationLevel(L,S){const vals=(S&&S.principles&&S.principles.length)||(L.values||[]).length;return (vals?1:0)+(L.why&&L.why.text?1:0)+((L.reviews||[]).length>=1?1:0)+((L.reviews||[]).length>=4?1:0)}
function templeState(S){const L=S.life;if(!L.temple)L.temple=newTemple(curWk(L),L.d||0);const T=L.temple,cols=AREAS.map(a=>columnState(L,a.id));
 const avg=cols.reduce((a,c)=>a+c.stage,0)/cols.length;let phase=Math.max(1,Math.min(4,Math.floor(avg+.001)));if(cols.every(c=>c.stage===5))phase=5;
 const wk=curWk(L),week=Math.min(T.cur.len,Math.max(1,wk-T.cur.startWk+1));
 return{n:T.cur.n,cols,phase,phaseInfo:PHASES[phase-1],foundation:foundationLevel(L,S),week,len:T.cur.len,due:wk>=T.cur.startWk+T.cur.len,total:T.cur.ms.length}}
/* Saisonabschluss: Tempel wird als historisches Bauwerk gespeichert, nichts geht verloren */
function closeTempleSeason(S,len){const L=S.life,T=L.temple,st=templeState(S),wk=curWk(L);
 const snap={n:T.cur.n,startWk:T.cur.startWk,endWk:wk,phase:st.phase,foundation:st.foundation,cols:st.cols.map(c=>({area:c.area,stage:c.stage,pts:c.pts,engravings:c.engravings,emblems:c.emblems,weathered:c.weathered})),ms:T.cur.ms,
  achieved:(L.goals||[]).filter(g=>g.status==='achieved'&&g.achievedWk!=null&&g.achievedWk>=T.cur.startWk).map(g=>g.title),
  learned:(L.exps||[]).filter(e=>e.status==='success'&&(e.closed??e.endWk)>=T.cur.startWk).map(e=>e.label),
  open:(L.goals||[]).filter(g=>g.status==='active').map(g=>g.title),t:Date.now()};
 T.hist=[...(T.hist||[]),snap];T.cur={n:T.cur.n+1,startWk:wk,d0:L.d||0,logFrom:(L.log||[]).length,len:len||T.cur.len,ms:[],wx:{}};return snap}

/* ───── Success Loop: aktuelle Phase ───── */
const LOOP=[{id:'own',n:'Ownership',de:'Verantwortung',q:'Was kann ich kontrollieren?'},{id:'exec',n:'Execution',de:'Umsetzung',q:'Was muss ich heute tun?'},{id:'feed',n:'Feedback',de:'Rückmeldung',q:'Was hat funktioniert, was nicht?'},{id:'adapt',n:'Adaptation',de:'Anpassung',q:'Was ändere ich?'}];
function loopStage({hasGoal,openToday,doneToday,reviewDue,dailyDone,evening}){
 if(!hasGoal)return'own';if(reviewDue)return'adapt';if(openToday>0&&!(evening&&doneToday>0))return'exec';if(!dailyDone)return'feed';return'exec'}

/* ───── Migration / Initialisierung ───── */
const OLD_KIND={save:{tpl:'reserve',area:'wealth',mid:'m_save'},learn:{tpl:'lang',area:'growth',mid:'m_lang'},run:{tpl:null,area:'health',mid:'m_run',metric:{name:'Längster Lauf am Stück',unit:'km',dir:'up',target:21.1,src:'measured'}},pace:{tpl:'run5k',area:'health',mid:'m_run'},read:{tpl:'books',area:'growth',mid:'m_read'},fit:{tpl:'strength',area:'health',mid:'m_train'},sleep:{tpl:'sleep',area:'health',mid:'m_sleep'},rel:{tpl:'friends',area:'relationships',mid:'m_rel'},biz:{tpl:'income',area:'wealth',mid:null},focus:{tpl:'skill',area:'growth',mid:'m_focus'},disc:{tpl:'skill',area:'growth',mid:'m_hard'}};
const perWeekOf=m=>m.freq==='daily'?7:m.freq==='multi'?(m.times||1):1;
function newLife(d){return{v:LIFE_V,d:d||0,values:[],why:{text:'',q:{}},areas:Object.fromEntries(AREAS.map(a=>[a.id,{sat:3}])),focus:null,goals:[],actions:[],meas:[],log:[],daily:[],reviews:[],exps:[],flags:{},focusMode:false,main:null}}
function ensureLife(S){if(!S||typeof S!=='object')return S;if(S.life&&S.life.v===LIFE_V){const L=S.life;['goals','actions','meas','log','daily','reviews','exps'].forEach(k=>{if(!Array.isArray(L[k]))L[k]=[]});if(!L.areas)L.areas=newLife().areas;if(!L.why)L.why={text:'',q:{}};if(!L.temple)L.temple=newTemple(curWk(L),L.d||0);if(!L.fund)L.fund={v:1,ob:{mode:'legacy',d:L.d||0,t:Date.now()}};return S}
 const L=newLife(S.day||0);S.life=L;
 /* Zufriedenheit aus bisherigen Angaben übernehmen */
 const sat=(S.profile&&S.profile.sat)||{};const avg=ks=>{const v=ks.map(k=>sat[k]).filter(x=>x);return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):3};
 L.areas={health:{sat:avg(['fit','rec'])},relationships:{sat:avg(['rel'])},wealth:{sat:avg(['fin','career'])},growth:{sat:avg(['intel','char','time'])}};
 const pri=(S.profile&&S.profile.priorities)||[];const pa={fit:'health',rec:'health',rel:'relationships',fin:'wealth',career:'wealth',intel:'growth',char:'growth',time:'growth'};L.focus=pa[pri[0]]||null;
 /* Bestehende Ziele: Prozesszahlen werden zu echten Ergebnisgrößen umgedeutet */
 (S.goals||[]).forEach(o=>{const k=OLD_KIND[o.kind]||{tpl:null,area:'growth',mid:null};const tpl=GOAL_TPL.find(t=>t.id===k.tpl);
  const metric=k.metric||(tpl?{...tpl.metric}:{name:o.unit?`Fortschritt (${o.unit})`:'Fortschritt',unit:o.unit||'',dir:'up',target:o.target||null,src:'self'});
  if(o.kind==='save'){metric.target=o.target||metric.target}
  const g={id:'g'+uid(),area:k.area,title:o.title,metric:{...metric,start:null},weeks:o.weeks||12,startWk:0,status:'active',method:tpl?tpl.method:'',valueIds:[],why:'',changes:[],legacy:o.id,tpl:k.tpl};
  L.goals.push(g);
  const m=k.mid&&(S.missions||[]).find(x=>x.id===k.mid);if(m&&!L.actions.some(a=>a.missionId===m.id)){const a={id:'a'+uid(),goalId:g.id,title:m.title,perWeek:perWeekOf(m),missionId:m.id,since:0};L.actions.push(a);
   /* bereits in dieser Woche Erledigtes übernehmen, damit Umsetzung und Aufgabenliste übereinstimmen */
   const n=m.freq==='multi'?((S.counts||{})[m.id]||0):(S.done||{})[m.id]?1:0;for(let i=0;i<n;i++)L.log.push({aid:a.id,d:L.d,wk:wkOf(L.d),t:Date.now(),src:'migration'})}
  const cur=o.kind==='save'&&S.save?S.save.saved:null;if(cur!=null){g.metric.start=cur;L.meas.push({id:'v'+uid(),goalId:g.id,v:cur,d:L.d,t:Date.now(),note:'Übernommen'})}});
 L.main=L.goals[0]?L.goals[0].id:null;if(!L.focus&&L.goals[0])L.focus=L.goals[0].area;L.temple=newTemple(curWk(L),L.d||0);L.fund={v:1,ob:{mode:'legacy',d:L.d||0,t:Date.now()}};
 return S}

/* ───── Formatierung ───── */
function fmtV(metric,v){if(v==null||v===''||!isFinite(v))return'–';if(metric.fmt==='time'){const s=Math.round(v);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
 const n=Math.round(v*10)/10;const t=n.toLocaleString('de-DE');return metric.unit==='€'?t+' €':t+(metric.unit?(metric.unit.startsWith('/')?'':' ')+metric.unit:'')}
function parseV(metric,s){if(s==null)return null;s=String(s).trim();if(!s)return null;if(metric.fmt==='time'){const m=/^(\d{1,3}):([0-5]\d)$/.exec(s);return m?(+m[1])*60+(+m[2]):null}const n=parseFloat(s.replace(/\./g,'').replace(',','.'));return isFinite(n)?n:null}

G.LC={LIFE_V,AREAS,AREA,LINKS,ACT_AREA,areaAct,VALUES,WHY_Q,GOAL_TPL,OBSTACLES,OBST,BLOCK_MAP,RULES,LOOP,
 wkOf,curWk,actById,goalById,actionsOf,actLabel,missionTitle,plannedAt,doneIn,goalWeek,weekRate,measOf,goalNow,goalStart,better,reached,goalProgress,trend,diagnose,suggest,
 startExperiment,evalExperiment,decideExperiment,reviewWeek,weekSummary,obstacleCounts,saveWeeklyReview,onComplete,onAdvance,onDailyReview,addMeasurement,addAction,addGoal,updateGoal,setGoalStatus,insights,loopStage,newLife,ensureLife,MOODS,DEBRIEF_OBST,CHANGES,onDebrief,debriefPatterns,monthlyDue,saveMonthly,STD_LEVELS,STD_LV,STD_TPL,areaSatFrom,suggestStandard,setStandard,rerateStandard,removeStandard,logStandard,standardWeek,standardFeedback,adaptOptions,standardProgress,standardsForSync,FUND,FUND_STAGES,inviteCandidates,fundState,fundSections,setFundSkip,markSeen,nextInvite,showInvite,answerInvite,clearFoundation,FUTURE_SUCCESS,FUTURE_TXT,cleanFuture,futureSuccess,futureForSync,AUDIT_AREAS,AUDIT,AUDIT_MAX,setAudit,auditState,auditSummary,auditForSync,EVE_WHEN,EVE_RISK,ifThen,onEvening,eveningFor,eveningStats,TEMPLE_LEN,STAGES,PHASES,TEMPLE_RULES,newTemple,syncTemple,columnState,foundationLevel,templeState,closeTempleSeason,areaWeek,fmtV,parseV,syncMission};
})(typeof window!=='undefined'?window:globalThis);
