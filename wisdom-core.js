/* THE WAR WITHIN – Wisdom of the Warrior
   Kuratierte Bibliothek kurzer Impulse + regelbasierte, kontextabhängige Auswahl.
   Reine Logik ohne UI, hängt sich als window.WC an (in Node: globalThis.WC).
   Alle Texte sind eigene Formulierungen der App. Keine Zitate, keine Zuschreibungen.
   Daten im Spielstand unter S.wisdom (siehe ensure). Lesen erzeugt nie Punkte oder Tempel-Fortschritt. */
(function(root){'use strict';

/* ───── Kategorien ───── */
const CATS=[
 {id:'ownership',name:'Ownership',de:'Eigenverantwortung',icon:'aspis',d:'Verantwortung für das übernehmen, was du beeinflussen kannst.'},
 {id:'discipline',name:'Discipline',de:'Beständigkeit',icon:'flame',d:'Handeln, auch wenn die Motivation gerade fehlt.'},
 {id:'resilience',name:'Resilience',de:'Innere Stärke',icon:'shield',d:'Nach Rückschlägen wieder handlungsfähig werden.'},
 {id:'feedback',name:'Feedback Loop',de:'Aus Erfahrung lernen',icon:'scroll',d:'Ergebnisse auswerten und den Plan daran anpassen.'},
 {id:'competence',name:'Competence',de:'Können',icon:'laurel',d:'Fähigkeiten durch Übung, Anwendung und Korrektur entwickeln.'},
 {id:'self_efficacy',name:'Self-Efficacy',de:'Selbstwirksamkeit',icon:'helmet',d:'Vertrauen in die eigene Handlungsfähigkeit aufbauen.'},
 {id:'compounding',name:'Compounding',de:'Langer Atem',icon:'hourglass',d:'Den Wert kleiner, wiederholter Fortschritte erkennen.'},
 {id:'reflection',name:'Reflection',de:'Innehalten',icon:'owl',d:'Den eigenen Weg bewusst überprüfen.'},
 {id:'recovery',name:'Recovery',de:'Regeneration',icon:'temple',d:'Erholung als Teil nachhaltigen Fortschritts verstehen.'}
];
const CAT=Object.fromEntries(CATS.map(c=>[c.id,c]));
const TRIGGERS=['daily_briefing','missed_task','daily_reflection','milestone','new_season','recovery','neutral'];

/* ───── Bibliothek (72 Einträge, 8 je Kategorie) ─────
   Kurzform: [Haupttext, Anwendungshinweis, Auslöser, Priorität 1–3]
   Auslöser-Kürzel: B Tagesbriefing · M nicht erledigte Aufgabe · D Daily Debrief · S Meilenstein · N neue Saison · R Erholung · O neutral */
const TK={B:'daily_briefing',M:'missed_task',D:'daily_reflection',S:'milestone',N:'new_season',R:'recovery',O:'neutral'};
const RAW={
 ownership:[
  ['Konzentriere dich auf das, was du heute tatsächlich verändern kannst.','Nenne eine Sache, die heute allein in deiner Hand liegt.','BM',3],
  ['Ein guter Tag beginnt nicht mit perfekten Bedingungen, sondern mit einer bewussten Entscheidung.','Entscheide jetzt, welche Handlung heute Vorrang hat.','BO',3],
  ['Umstände erklären vieles. Sie entscheiden nicht, was du als Nächstes tust.','Frag dich: Was ist trotz allem mein nächster möglicher Schritt?','BM',2],
  ['Verantwortung heißt nicht Schuld. Sie heißt: Ich kann etwas tun.','Trenne im Rückblick, was in deiner Hand lag und was nicht.','MD',3],
  ['Wer seine Prioritäten nicht selbst setzt, dem setzt sie der Tag.','Lege fest, welche eine Aufgabe heute zuerst kommt.','B',2],
  ['Du musst nicht alles kontrollieren. Es reicht, deinen Teil vollständig zu übernehmen.','Beschreibe deinen Teil in einem einzigen Satz.','BO',2],
  ['Ein klarer Plan für heute ist ehrlicher als ein großer Plan für irgendwann.','Halte die Liste für heute so kurz, dass sie wirklich machbar ist.','B',2],
  ['Ausreden schützen kurz das Gefühl. Ehrliche Antworten verbessern den Weg.','Was hat wirklich gefehlt: Zeit, Energie oder Klarheit?','D',2]
 ],
 discipline:[
  ['Du musst nicht motiviert sein, um den ersten Schritt zu machen.','Beginne mit der kleinsten Version der Aufgabe. Oft folgt der Rest.','BM',3],
  ['Disziplin ist meist unspektakulär: das Richtige, an einem gewöhnlichen Tag.','Kein großer Vorsatz nötig. Nur die nächste geplante Handlung.','BO',2],
  ['Ein fester Zeitpunkt nimmt dir viele kleine Entscheidungen ab.','Gib deiner wichtigsten Handlung heute eine Uhrzeit.','B',3],
  ['Motivation kommt und geht. Eine Routine bleibt, wenn sie klein genug ist.','Wenn es schwerfällt: verkleinern statt ausfallen lassen.','BM',2],
  ['Fokus heißt auch, bewusst Nein zu sagen.','Was lässt du heute weg, damit das Wichtige Platz hat?','B',2],
  ['Die schwerste Minute ist oft die erste. Danach bist du schon mittendrin.','Stell dir fünf Minuten ein und fang einfach an.','B',2],
  ['Disziplin ist kein Kampf gegen dich selbst, sondern eine Abmachung mit dir selbst.','Halte heute eine kleine Abmachung ein.','BO',2],
  ['Gute Gewohnheiten brauchen einen klaren Anfang, keinen perfekten.','Lege fest, wann und wo du beginnst.','BN',1]
 ],
 resilience:[
  ['Ein Rückschlag entscheidet nicht über deinen Weg. Dein nächster Schritt zählt.','Überlege, welcher kleine Schritt dir den Wiedereinstieg erleichtert.','MD',3],
  ['Nicht der ausgelassene Tag ist entscheidend, sondern wie du deinen nächsten Schritt gestaltest.','Plane für heute eine Version, die sicher machbar ist.','M',3],
  ['Wachstum beginnt oft dort, wo Bequemlichkeit endet.','Herausforderungen können dich stärken, wenn du aus ihnen lernst und ausreichend regenerierst.','BS',1],
  ['Ein verpasster Tag ist ein Datenpunkt, kein Urteil.','Notiere kurz, was dazwischenkam. Das genügt.','MD',3],
  ['Wiedereinstieg ist eine eigene Fähigkeit. Je öfter du zurückkommst, desto leichter wird es.','Fang dort wieder an, wo es dir am leichtesten fällt.','MS',2],
  ['Du musst nicht dort weitermachen, wo du aufgehört hast. Ein kleinerer Anfang ist auch ein Anfang.','Halbiere die Aufgabe, statt sie ganz ausfallen zu lassen.','M',2],
  ['Stärke zeigt sich nicht darin, nie zu stolpern, sondern darin, wieder ins Handeln zu kommen.','Ein einziger erledigter Schritt beendet die Pause.','MS',2],
  ['Schwierige Tage gehören dazu. Sie heben die guten nicht auf.','Schau auch auf das, was heute trotzdem gelungen ist.','DM',2]
 ],
 feedback:[
  ['Ein Fehler, den du verstehst, ist wertvoller als einer, den du immer wiederholst.','Frag nicht „Warum ich?“, sondern „Was war die Ursache?“','DM',3],
  ['Erfahrung macht dich nicht automatisch besser. Entscheidend ist, was du daraus lernst.','Formuliere eine Erkenntnis aus dem heutigen Tag.','D',3],
  ['Wenn etwas wiederholt nicht klappt, liegt es selten am Willen und oft am Plan.','Ändere eine Bedingung: Zeitpunkt, Umfang oder Ort.','DM',3],
  ['Zahlen urteilen nicht. Sie zeigen dir, wo du ansetzen kannst.','Ein Messwert pro Woche genügt, um den Kurs zu erkennen.','DS',2],
  ['Ein kleines Experiment verrät mehr als langes Grübeln.','Probiere eine Änderung eine Woche lang aus und prüfe dann.','DS',2],
  ['Was funktioniert, verdient genauso viel Aufmerksamkeit wie das, was scheitert.','Halte fest, was heute gut lief, und wiederhole es.','D',2],
  ['Ehrliches Feedback an dich selbst ist eine Form von Respekt.','Bewerte die Handlung, nicht dich als Person.','D',1],
  ['Ein Plan ist eine Vermutung. Der Alltag zeigt dir, wie gut sie war.','Passe den Plan an die Wirklichkeit an, nicht umgekehrt.','DN',2]
 ],
 competence:[
  ['Nicht die Anzahl deiner Versuche entscheidet allein, sondern was du aus ihnen lernst.','Achte beim nächsten Mal auf ein Detail, das du verbessern willst.','DS',3],
  ['Können entsteht durch Übung mit Absicht, nicht durch bloße Wiederholung.','Gib deiner nächsten Einheit ein kleines, konkretes Ziel.','BS',2],
  ['Dein Fortschritt ist das Ergebnis wiederholter, bewusster Handlungen.','Schau zurück: Welche Handlung hat den Unterschied gemacht?','S',3],
  ['Jede Fähigkeit war einmal neu und ungeschickt.','Erlaube dir, am Anfang langsam zu sein.','BN',2],
  ['Wer an der Grenze seines Könnens übt, wächst. Wer weit darüber hinausgeht, verliert oft den Faden.','Wähle eine Herausforderung, die fordert und machbar bleibt.','BR',2],
  ['Ein erreichter Meilenstein ist kein Endpunkt, sondern ein neues Fundament.','Überlege, was der nächste sinnvolle Schritt ist.','S',2],
  ['Korrektur ist kein Rückschritt. Sie ist der Teil des Lernens, den man selten sieht.','Nimm dir eine Sache vor, die du beim nächsten Mal anders machst.','D',2],
  ['Meisterschaft ist die Summe vieler kleiner Verbesserungen.','Verbessere heute nur eine Kleinigkeit.','SN',1]
 ],
 self_efficacy:[
  ['Selbstvertrauen wächst durch Herausforderungen, die du tatsächlich bewältigst.','Wähle eine Aufgabe, die dich fordert und die du heute schaffen kannst.','BS',3],
  ['Dieser Fortschritt ist ein Beleg dafür, was du durch gezieltes Handeln verändern kannst.','Merke dir, wie du es geschafft hast.','S',3],
  ['Jede gehaltene Abmachung mit dir selbst ist ein kleiner Beweis.','Halte heute eine einzige Zusage an dich ein.','BS',2],
  ['Was du kannst, erfährst du eher durch Ausprobieren als durch Nachdenken.','Teste es in kleinem Rahmen.','B',2],
  ['Erinnere dich an etwas, das du schon geschafft hast. Die Fähigkeit dazu ist noch da.','Was hat dir damals geholfen?','MD',2],
  ['Kleine Erfolge sind keine Kleinigkeit. Sie zeigen dir, dass dein Handeln wirkt.','Nimm den heutigen Fortschritt bewusst wahr.','SD',2],
  ['Du musst dich nicht stark fühlen, um handlungsfähig zu sein.','Ein Schritt im Rahmen deiner heutigen Kraft reicht.','MB',2],
  ['Vertrauen in dich selbst entsteht nicht durch Worte, sondern durch Erfahrungen.','Sammle heute eine solche Erfahrung.','OB',1]
 ],
 compounding:[
  ['Unterschätze nicht, was kleine Handlungen über Jahre bewirken können.','Eine kleine Einheit heute zählt mehr als eine große irgendwann.','BNS',3],
  ['Dein Tempel entsteht nicht an einem Tag. Jeder bewusst gesetzte Stein zählt.','Setze in dieser Woche den ersten Stein.','NS',3],
  ['Auf langen Wegen schlägt Konstanz die Intensität.','Lieber regelmäßig etwas weniger als selten sehr viel.','BN',2],
  ['Fortschritt fühlt sich oft langsam an, solange du mittendrin bist.','Vergleiche dich mit deinem Stand von vor einigen Wochen.','SD',2],
  ['Eine neue Saison ist ein Neubeginn, kein Neustart bei null. Was du gelernt hast, bleibt.','Nimm eine Erkenntnis aus der letzten Saison mit.','N',3],
  ['Geduld ist kein Warten. Sie ist Weitermachen, ohne sofortige Belohnung zu verlangen.','Achte auf die Umsetzung. Das Ergebnis folgt mit Verzögerung.','NB',2],
  ['Jede Wiederholung ist eine Einzahlung. Die Zinsen siehst du erst später.','Zähle heute die Handlung, nicht das Ergebnis.','BS',2],
  ['Zwölf Wochen sind kurz für ein Leben und lang genug für eine spürbare Veränderung.','Wähle für diese Saison einen klaren Schwerpunkt.','N',2]
 ],
 reflection:[
  ['Wer seinen Weg niemals überprüft, kann jahrelang in die falsche Richtung laufen.','Frag dich einmal pro Woche: Führt mich mein Tun zu dem, was mir wichtig ist?','DN',3],
  ['Ein kurzer Blick zurück macht den nächsten Schritt klarer.','Eine Minute am Abend genügt.','D',3],
  ['Nicht jede Frage braucht sofort eine Antwort. Manchmal reicht es, sie zu stellen.','Nimm eine offene Frage mit in den nächsten Tag.','DO',1],
  ['Was dir wichtig ist, zeigt sich in deinem Kalender deutlicher als in deinen Vorsätzen.','Prüfe, ob deine Zeit zu deinen Werten passt.','BD',2],
  ['Innehalten ist kein Stillstand. Es ist der Moment, in dem du die Richtung prüfst.','Gönn dir einen ruhigen Moment ohne Bildschirm.','DR',2],
  ['Betrachte deinen Tag wie ein fairer Zeuge, nicht wie ein strenger Richter.','Beschreibe, was geschah, ohne es zu bewerten.','DM',3],
  ['Ziele dürfen sich ändern, wenn du klarer siehst. Das ist kein Scheitern.','Passt dein Ziel noch zu deinem Warum?','DN',2],
  ['Am Ende eines Tages zählt weniger, wie viel du geschafft hast, als ob es das Richtige war.','Was war heute wirklich wichtig?','D',2]
 ],
 recovery:[
  ['Disziplin bedeutet auch, zu erkennen, wann Erholung notwendig ist.','Plane Erholung so bewusst wie Training oder Arbeit.','R',3],
  ['Fortschritt entsteht nicht nur durch Belastung, sondern auch durch ausreichende Erholung.','Schlaf, Pausen und ruhige Bewegung gehören zu deinem Plan.','R',3],
  ['Eine bewusste Pause ist eine Entscheidung, kein Versagen.','Lege fest, wann du wieder einsteigst.','RM',3],
  ['Wenig Energie ist eine Information. Sie verdient Aufmerksamkeit, keinen Tadel.','Wähle heute die leichteste sinnvolle Version oder ruh dich aus.','R',3],
  ['Wer dauerhaft über seine Grenzen geht, verliert die Kraft für das Wesentliche.','Streiche heute eine Sache, die warten kann. Hält die Erschöpfung länger an, lass dich ärztlich beraten.','R',2],
  ['Ein ausgeruhter Kopf trifft bessere Entscheidungen.','Verschiebe große Entscheidungen, wenn du erschöpft bist.','RB',2],
  ['Auch ein Tempel braucht Zeit, bis der Mörtel trocken ist.','Nach einer starken Phase darf eine ruhigere folgen.','RS',1],
  ['Erholung musst du dir nicht erst verdienen. Sie ist eine Voraussetzung für alles Weitere.','Halte heute eine feste Ruhezeit ein.','R',2]
 ]
};
const LIB=[];
Object.entries(RAW).forEach(([cat,list])=>list.forEach(([text,explanation,tr,priority],i)=>LIB.push({
 id:'wisdom_'+cat+'_'+String(i+1).padStart(3,'0'),category:cat,text,explanation:explanation||null,
 triggers:[...tr].map(k=>TK[k]),priority,icon:CAT[cat].icon,language:'de'})));
const BY=Object.fromEntries(LIB.map(w=>[w.id,w]));

/* ───── Zustand (S.wisdom) ─────
   {v:1, on, fav[ids], seen[{id,d,place}], slots{place:{d,id,key,reason}}, hid{place:d}, used{place:[keys]}} */
const REPEAT_DAYS=7,SEEN_MAX=300;
function ensure(S){if(!S||typeof S!=='object')return S;let w=S.wisdom;if(!w||typeof w!=='object')w=S.wisdom={};
 w.v=1;if(typeof w.on!=='boolean')w.on=true;
 w.fav=Array.isArray(w.fav)?[...new Set(w.fav.filter(id=>BY[id]))]:[];
 w.seen=Array.isArray(w.seen)?w.seen.filter(x=>x&&BY[x.id]&&typeof x.d==='number').slice(-SEEN_MAX):[];
 if(!w.slots||typeof w.slots!=='object')w.slots={};if(!w.hid||typeof w.hid!=='object')w.hid={};if(!w.used||typeof w.used!=='object')w.used={};
 return S}
const W_=S=>(S&&S.wisdom)||{on:true,fav:[],seen:[],slots:{},hid:{},used:{}};
/* Tageszähler: derselbe absolute Tag wie im Life-OS (läuft über Saisons hinweg) */
const dayOf=S=>(S&&S.life&&typeof S.life.d==='number')?S.life.d:0;
const enabled=S=>W_(S).on!==false;
const isFav=(S,id)=>(W_(S).fav||[]).includes(id);

/* ───── Kontext: nur aus Daten, die der Nutzer selbst dokumentiert hat ───── */
const curWk=L=>Math.floor((L.d||0)/7);
function dailyAt(S,d){const L=S.life;return L&&(L.daily||[]).find(e=>e.d===d)||null}
/* Erholung nur, wenn der Nutzer selbst wenig Energie notiert oder bewusst pausiert – nie aus verpassten Aufgaben abgeleitet */
function recoveryNeed(S){const d=dayOf(S),L=S.life||{};if(Array.isArray(S.rest)&&S.rest.includes(S.day))return'rest';
 const y=dailyAt(S,d-1);if(y&&(y.obst||[]).includes('energy'))return'energy';
 const n=(L.daily||[]).filter(e=>e.d>=d-5&&e.d<d&&(e.obst||[]).includes('energy')).length;return n>=2?'energy':null}
function missedYesterday(S){const y=dailyAt(S,dayOf(S)-1);return !!(y&&(y.skipped||[]).length)}
const hasPlan=S=>!!((S.life&&(S.life.goals||[]).some(g=>g.status==='active'))||(S.missions||[]).length);
/* Bedeutende Meilensteine: keine wöchentlichen Routine-Bausteine, damit Erledigen allein nichts auslöst */
const MS_SIG={first:['self_efficacy','compounding'],quarter:['compounding','competence'],goal:['competence','self_efficacy'],exp:['feedback','competence'],comeback:['resilience','self_efficacy'],restored:['resilience','compounding']};
function recentMilestone(S){const L=S.life;const T=L&&L.temple;if(!T||!T.cur)return null;const wk=curWk(L);
 const ms=(T.cur.ms||[]).filter(m=>MS_SIG[m.kind]&&m.wk>=wk-1);return ms.length?ms[ms.length-1]:null}
function newSeason(S){const L=S.life;const T=L&&L.temple;if(!T||!T.cur||!(T.hist||[]).length)return null;return curWk(L)-T.cur.startWk<1?T.cur:null}

/* Liefert {trigger, prefer[], reason, key} oder null (kein sinnvoller Anlass → kein Hinweis) */
function context(S,place,x={}){
 if(place==='today'){const r=recoveryNeed(S);
  if(r)return{trigger:'recovery',prefer:['recovery'],reason:r==='rest'?'Zu deinem Ruhetag':'Du hast zuletzt wenig Energie notiert'};
  if(missedYesterday(S))return{trigger:'missed_task',prefer:['resilience','ownership','discipline'],reason:'Zum Wiedereinstieg'};
  if(hasPlan(S))return{trigger:'daily_briefing',prefer:['ownership','discipline'],reason:''};
  return{trigger:'neutral',prefer:[],reason:''}}
 if(place==='debrief'){let planned=x.planned,done=x.done;const e=dailyAt(S,dayOf(S));
  if(planned==null&&e){done=(e.done||[]).length;planned=done+(e.skipped||[]).length}
  if(e&&(e.obst||[]).includes('energy'))return{trigger:'recovery',prefer:['recovery','reflection'],reason:'Zu deinem Tag'};
  if(planned==null)return null;
  if(!planned)return{trigger:'daily_reflection',prefer:['reflection'],reason:'Abendimpuls'};
  if(done>=planned)return{trigger:'daily_reflection',prefer:['competence','self_efficacy','compounding'],reason:'Zu deinem Tag'};
  return{trigger:'daily_reflection',prefer:['feedback','reflection','resilience'],reason:'Zu deinem Tag'}}
 if(place==='milestone'){const m=x.ms||recentMilestone(S);if(!m)return null;return{trigger:'milestone',prefer:MS_SIG[m.kind]||['competence'],reason:'Zu deinem Baustein: '+m.label,key:m.id}}
 if(place==='season'){const c=newSeason(S);if(!c)return null;return{trigger:'new_season',prefer:['compounding'],reason:'Saison '+c.n+' beginnt',key:'season-'+c.n}}
 return null}

/* ───── Auswahl ───── */
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function choose(S,ctx,salt=''){const w=W_(S),d=dayOf(S);
 let pool=LIB.filter(x=>x.language==='de'&&x.triggers.includes(ctx.trigger));
 if(!pool.length)pool=LIB.filter(x=>x.triggers.includes('neutral'));
 const seen=w.seen||[];const last=id=>seen.reduce((m,s)=>s.id===id&&s.d>m?s.d:m,-1e9);
 /* Regel 2: keine Wiederholung innerhalb von 7 Tagen, solange passende Alternativen da sind */
 let fresh=pool.filter(x=>d-last(x.id)>=REPEAT_DAYS);
 if(!fresh.length){const lo=Math.min(...pool.map(x=>last(x.id)));fresh=pool.filter(x=>last(x.id)===lo)}
 const recentCats=new Set(seen.filter(s=>d-s.d<2).map(s=>BY[s.id]&&BY[s.id].category));
 const times=id=>seen.filter(s=>s.id===id).length;
 /* Regel 1: inhaltlich passende Kategorien zuerst, danach Priorität; Abwechslung bei Kategorien */
 const score=x=>(ctx.prefer&&ctx.prefer.includes(x.category)?3:0)+x.priority-(recentCats.has(x.category)?1:0)-Math.min(2,times(x.id)*.5);
 const sc=fresh.map(x=>[x,score(x)]),max=Math.max(...sc.map(p=>p[1]));
 const top=sc.filter(p=>p[1]>=max-.5).map(p=>p[0]);
 return top[hash(d+'|'+ctx.trigger+'|'+salt)%top.length]}

/* Ergebnis für eine Stelle der App: {w, reason, place, key, recorded} oder null */
function resolve(S,place,x){if(!enabled(S))return null;const w=W_(S),d=dayOf(S);
 if(w.hid&&w.hid[place]===d)return null;
 const slot=w.slots&&w.slots[place];
 /* Regel 3 und 7: höchstens ein Impuls pro Stelle und Tag; bleibt stabil, bis der Tag wechselt */
 if(slot&&slot.d===d&&BY[slot.id])return{w:BY[slot.id],reason:slot.reason,place,key:slot.key||null,recorded:true};
 const ctx=context(S,place,x||{});if(!ctx)return null;
 if(ctx.key&&((w.used||{})[place]||[]).includes(ctx.key))return null;
 const pick=choose(S,ctx,place);if(!pick)return null;
 return{w:pick,reason:ctx.reason,place,key:ctx.key||null,recorded:false}}
function record(S,r){ensure(S);const w=S.wisdom,d=dayOf(S);const slot=w.slots[r.place];if(slot&&slot.d===d)return S;
 w.slots[r.place]={d,id:r.w.id,key:r.key||null,reason:r.reason||''};
 w.seen=[...w.seen,{id:r.w.id,d,place:r.place}].slice(-SEEN_MAX);
 if(r.key)w.used[r.place]=[...(w.used[r.place]||[]),r.key].slice(-50);return S}
function dismiss(S,place){ensure(S);S.wisdom.hid[place]=dayOf(S);return S}
function toggleFav(S,id){ensure(S);if(!BY[id])return S;const f=S.wisdom.fav;S.wisdom.fav=f.includes(id)?f.filter(x=>x!==id):[...f,id];return S}
function setOn(S,on){ensure(S);S.wisdom.on=!!on;return S}
/* Zuletzt gelesene zuerst, ohne Duplikate */
function readList(S){const out=[],has=new Set();(W_(S).seen||[]).slice().reverse().forEach(s=>{if(!has.has(s.id)&&BY[s.id]){has.add(s.id);out.push(BY[s.id])}});return out}

root.WC={CATS,CAT,TRIGGERS,LIB,BY,REPEAT_DAYS,ensure,enabled,isFav,context,choose,resolve,record,dismiss,toggleFav,setOn,readList,recoveryNeed,missedYesterday,recentMilestone,newSeason};
})(typeof window!=='undefined'?window:globalThis);
