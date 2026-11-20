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
 {id:'health',name:'Health',de:'Gesundheit',icon:'dumbbell',color:'#34D399',subs:['Training','Ernährung','Schlaf','Mentale Gesundheit'],q:'Wie zufrieden bist du mit Körper, Energie und Erholung?'},
 {id:'relationships',name:'Relationships',de:'Beziehungen',icon:'heart',color:'#F472B6',subs:['Familie','Freundschaften','Partnerschaft','Verbundenheit'],q:'Wie verbunden fühlst du dich mit Menschen, die dir wichtig sind?'},
 {id:'wealth',name:'Wealth',de:'Finanzen',icon:'wallet',color:'#FBBF24',subs:['Einkommen','Vermögen','Sicherheit','Spielraum'],q:'Wie sicher und handlungsfähig fühlst du dich finanziell?'},
 {id:'growth',name:'Growth',de:'Wachstum',icon:'book',color:'#A78BFA',subs:['Wissen','Fähigkeiten','Kompetenz','Persönlichkeit'],q:'Wie zufrieden bist du damit, wie du lernst und dich entwickelst?'}];
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
function addMeasurement(S,gid,v,note){const L=S.life,g=goalById(L,gid);if(!g||v==null||!isFinite(v))return null;
 if(g.metric.start==null&&!measOf(L,gid).length)g.metric.start=v;
 L.meas=[...(L.meas||[]),{id:'v'+uid(),goalId:gid,v,d:L.d,t:Date.now(),note:note||''}];
 if(g.status==='active'&&reached(g,v)){g.status='achieved';g.achievedWk=curWk(L);L.flags={...(L.flags||{}),goal:true};return'achieved'}
 L.flags={...(L.flags||{}),measure:true};return'ok'}

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

/* ───── Success Loop: aktuelle Phase ───── */
const LOOP=[{id:'own',n:'Ownership',de:'Verantwortung',q:'Was kann ich kontrollieren?'},{id:'exec',n:'Execution',de:'Umsetzung',q:'Was muss ich heute tun?'},{id:'feed',n:'Feedback',de:'Rückmeldung',q:'Was hat funktioniert, was nicht?'},{id:'adapt',n:'Adaptation',de:'Anpassung',q:'Was ändere ich?'}];
function loopStage({hasGoal,openToday,doneToday,reviewDue,dailyDone,evening}){
 if(!hasGoal)return'own';if(reviewDue)return'adapt';if(openToday>0&&!(evening&&doneToday>0))return'exec';if(!dailyDone)return'feed';return'exec'}

/* ───── Migration / Initialisierung ───── */
const OLD_KIND={save:{tpl:'reserve',area:'wealth',mid:'m_save'},learn:{tpl:'lang',area:'growth',mid:'m_lang'},run:{tpl:null,area:'health',mid:'m_run',metric:{name:'Längster Lauf am Stück',unit:'km',dir:'up',target:21.1,src:'measured'}},pace:{tpl:'run5k',area:'health',mid:'m_run'},read:{tpl:'books',area:'growth',mid:'m_read'},fit:{tpl:'strength',area:'health',mid:'m_train'},sleep:{tpl:'sleep',area:'health',mid:'m_sleep'},rel:{tpl:'friends',area:'relationships',mid:'m_rel'},biz:{tpl:'income',area:'wealth',mid:null},focus:{tpl:'skill',area:'growth',mid:'m_focus'},disc:{tpl:'skill',area:'growth',mid:'m_hard'}};
const perWeekOf=m=>m.freq==='daily'?7:m.freq==='multi'?(m.times||1):1;
function newLife(d){return{v:LIFE_V,d:d||0,values:[],why:{text:'',q:{}},areas:Object.fromEntries(AREAS.map(a=>[a.id,{sat:3}])),focus:null,goals:[],actions:[],meas:[],log:[],daily:[],reviews:[],exps:[],flags:{},focusMode:false,main:null}}
function ensureLife(S){if(!S||typeof S!=='object')return S;if(S.life&&S.life.v===LIFE_V){const L=S.life;['goals','actions','meas','log','daily','reviews','exps'].forEach(k=>{if(!Array.isArray(L[k]))L[k]=[]});if(!L.areas)L.areas=newLife().areas;if(!L.why)L.why={text:'',q:{}};return S}
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
 L.main=L.goals[0]?L.goals[0].id:null;if(!L.focus&&L.goals[0])L.focus=L.goals[0].area;
 return S}

/* ───── Formatierung ───── */
function fmtV(metric,v){if(v==null||v===''||!isFinite(v))return'–';if(metric.fmt==='time'){const s=Math.round(v);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
 const n=Math.round(v*10)/10;const t=n.toLocaleString('de-DE');return metric.unit==='€'?t+' €':t+(metric.unit?(metric.unit.startsWith('/')?'':' ')+metric.unit:'')}
function parseV(metric,s){if(s==null)return null;s=String(s).trim();if(!s)return null;if(metric.fmt==='time'){const m=/^(\d{1,3}):([0-5]\d)$/.exec(s);return m?(+m[1])*60+(+m[2]):null}const n=parseFloat(s.replace(/\./g,'').replace(',','.'));return isFinite(n)?n:null}

G.LC={LIFE_V,AREAS,AREA,LINKS,ACT_AREA,areaAct,VALUES,WHY_Q,GOAL_TPL,OBSTACLES,OBST,BLOCK_MAP,RULES,LOOP,
 wkOf,curWk,actById,goalById,actionsOf,actLabel,missionTitle,plannedAt,doneIn,goalWeek,weekRate,measOf,goalNow,goalStart,better,reached,goalProgress,trend,diagnose,suggest,
 startExperiment,evalExperiment,decideExperiment,reviewWeek,weekSummary,obstacleCounts,saveWeeklyReview,onComplete,onAdvance,onDailyReview,addMeasurement,addAction,addGoal,updateGoal,setGoalStatus,insights,loopStage,newLife,ensureLife,fmtV,parseV,syncMission};
})(typeof window!=='undefined'?window:globalThis);
