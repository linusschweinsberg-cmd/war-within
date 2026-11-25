/* THE WAR WITHIN – Zukunftscharakter (window.PC)
   Konzept: docs/SPIELKONZEPT.md, Abschnitt 4. Reine Regeln, keine Darstellung.
   - Sechs Leitbilder als Inspiration, höchstens zwei gleichzeitig, jederzeit änderbar.
   - Werte werden nur vorgeschlagen. Übernommen wird nur, was fehlt, und nur bis drei Werte (wie im Einstieg).
   - Ein Ziel wird nur vorgeschlagen (Bereich), nie automatisch angelegt.
   - Daten: S.life.persona = {v, ids, values, status, t}. Fehlt sie, gilt "noch nicht gewählt". */
(function(G){
 'use strict';
 const V=1,MAX=2,MAX_VALUES=3;
 const PERSONAS=[
  {id:'shield',icon:'shield',name:'Schild',line:'Für dich und andere da sein',values:['Loyalität','Mitgefühl','Verantwortung'],area:'relationships',idea:'Täglich eine Nachricht an einen Menschen, der dir wichtig ist',routine:{text:'Einem wichtigen Menschen schreiben',perWeek:3,mini:'Ein kurzes Zeichen senden'}},
  {id:'runner',icon:'activity',name:'Läufer',line:'Stark und belastbar werden',values:['Disziplin','Gesundheit','Mut'],area:'health',idea:'3× pro Woche 20 Minuten Bewegung',routine:{text:'20 Minuten Bewegung',perWeek:3,minutes:20,mini:'5 Minuten gehen'}},
  {id:'scroll',icon:'scroll',name:'Schriftrolle',line:'Lernen und verstehen',values:['Neugier','Exzellenz','Ehrlichkeit'],area:'growth',idea:'15 Minuten lesen oder lernen',routine:{text:'15 Minuten lesen oder lernen',perWeek:5,minutes:15,mini:'Eine Seite lesen'}},
  {id:'column',icon:'column',name:'Säule',line:'Etwas Eigenes aufbauen',values:['Exzellenz','Disziplin','Verantwortung'],area:'growth',idea:'25 Minuten fokussiert an deinem Projekt',routine:{text:'25 Minuten am eigenen Projekt',perWeek:3,minutes:25,mini:'5 Minuten anfangen'}},
  {id:'owl',icon:'owl',name:'Eule',line:'Geld und Zeit im Griff',values:['Freiheit','Gelassenheit','Verantwortung'],area:'wealth',idea:'Einmal pro Woche 10 Minuten Geldcheck',routine:{text:'Wöchentlicher Geldcheck',perWeek:1,minutes:10,mini:'Kontostand ansehen'}},
  {id:'star',icon:'star',name:'Eigener Stern',line:'Dein eigenes Bild',values:[],area:null,idea:null}];
 const byId=id=>PERSONAS.find(p=>p.id===id)||null;

 function ensure(S){const L=S&&S.life;if(!L)return null;const p=L.persona;
  if(!p)return null;
  if(p.v!==V||!Array.isArray(p.ids)){L.persona={v:V,ids:[],values:[],status:'later',t:p.t||0};return L.persona}
  p.ids=p.ids.filter((id,i,a)=>byId(id)&&a.indexOf(id)===i).slice(0,MAX);
  p.values=(Array.isArray(p.values)?p.values:[]).filter(v=>typeof v==='string'&&v.trim()).map(v=>v.trim().slice(0,30)).slice(0,6);
  if(!['set','later'].includes(p.status))p.status=p.ids.length?'set':'later';if(p.look&&typeof p.look!=='object')delete p.look;return p}
 const state=S=>ensure(S);
 const chosen=S=>{const p=state(S);return p&&p.status==='set'?p.ids.map(byId):[]};
 /* Einladung: nur solange nichts gewählt und nicht bewusst verschoben */
 const invite=S=>!!(S&&S.life&&!S.life.persona);

 /* Auswahl umschalten; die dritte Wahl ersetzt nichts, sie wird abgelehnt */
 function toggle(ids,id){if(!byId(id))return ids;if(ids.includes(id))return ids.filter(x=>x!==id);return ids.length>=MAX?ids:[...ids,id]}
 /* Wertvorschläge aus den gewählten Leitbildern, ohne Doppelungen */
 function suggestValues(ids){const out=[];ids.map(byId).filter(Boolean).forEach(p=>p.values.forEach(v=>{if(!out.includes(v))out.push(v)}));return out.slice(0,MAX_VALUES)}
 /* Welche Werte würden ergänzt? Bestehende bleiben, Reihenfolge bleibt, höchstens drei insgesamt. */
 function valuesToAdd(current,wanted){const cur=current||[],room=Math.max(0,MAX_VALUES-cur.length);return (wanted||[]).filter(v=>!cur.includes(v)).slice(0,room)}
 /* Zielvorschlag: Bereich des ersten Leitbilds, nur wenn dort noch kein aktives Ziel existiert */
 function goalHint(S,ids){const L=S.life,p=(ids||[]).map(byId).find(x=>x&&x.area);if(!p)return null;
  const has=(L.goals||[]).some(g=>g.area===p.area&&g.status==='active');return has?null:{area:p.area,idea:p.idea}}

 /* Speichern. addValues=true ergänzt fehlende Werte (nie ersetzen). current = bisherige Werte (Quelle: S.principles).
    Gibt die ergänzten Werte zurück. */
 function choose(S,ids,values,addValues,current,t=Date.now()){const L=S.life;if(!L)return null;
  const clean=(ids||[]).filter((id,i,a)=>byId(id)&&a.indexOf(id)===i).slice(0,MAX);
  const vals=(values||[]).filter(v=>typeof v==='string'&&v.trim()).map(v=>v.trim().slice(0,30)).slice(0,6);
  L.persona={v:V,ids:clean,values:vals,status:clean.length?'set':'later',t,...(L.persona&&L.persona.look?{look:L.persona.look}:{})};
  const added=addValues?valuesToAdd(current||L.values,vals):[];return {added}}
 function later(S,t=Date.now()){const L=S.life;if(!L)return;if(L.persona){L.persona.status=L.persona.ids.length?'set':'later';return}L.persona={v:V,ids:[],values:[],status:'later',t}}
 /* Routinenvorschläge aus dem Zukunftscharakter: höchstens drei, ein Bereich nur einmal, nie für Bereiche mit vorhandenem Standard.
    Jeder Vorschlag hat eine kleine Variante für schwierige Tage. Übernommen wird nur durch ausdrückliches Tippen. */
 function routineSuggestions(ids,standards){const has=standards||{},out=[];(ids||[]).map(byId).filter(p=>p&&p.routine&&p.area).forEach(p=>{
  if(out.length<3&&!has[p.area]&&!out.some(x=>x.area===p.area))out.push({from:p.id,area:p.area,std:{text:p.routine.text,perWeek:p.routine.perWeek,...(p.routine.minutes?{minutes:p.routine.minutes}:{})},min:{text:p.routine.mini}})});return out}
 /* ── Aussehen: wenige Entscheidungen, schnell fertig. Zusätzliche Farben/Gravur erst nach Freischaltung (rank-core.js). ── */
 const LOOK={
  fig:[{id:'aspis',name:'Schild',icon:'aspis'},{id:'helmet',name:'Helm',icon:'helmet'},{id:'column',name:'Säule',icon:'column'}],
  col:[{id:'acc',name:'Terrakotta',v:'var(--acc)'},{id:'bronze',name:'Bronze',v:'var(--bronze)'},{id:'nem',name:'Stahl',v:'var(--nem)'},{id:'gold',name:'Gold',v:'var(--gold)',lock:'palette'},{id:'good',name:'Oliv',v:'var(--good)',lock:'palette'}],
  emb:[{id:'star',name:'Stern',icon:'star'},{id:'flame',name:'Flamme',icon:'flame'},{id:'owl',name:'Eule',icon:'owl'},{id:'spear',name:'Speer',icon:'spear'}]};
 const lookDefault=S=>{const p=chosen(S)[0];return{fig:'aspis',col:'acc',emb:p&&LOOK.emb.some(e=>e.id===p.icon)?p.icon:'star',engrave:false}};
 /* Gespeichertes Aussehen; ungültige oder (noch) gesperrte Teile fallen auf den Standard zurück */
 function look(S,un){const L=S&&S.life;if(!L)return null;const d=lookDefault(S),x=(L.persona&&L.persona.look)||{},u=un||{};
  const ok=(k,id)=>{const o=LOOK[k].find(y=>y.id===id);return o&&(!o.lock||u[o.lock])};
  return{fig:ok('fig',x.fig)?x.fig:d.fig,col:ok('col',x.col)?x.col:d.col,emb:ok('emb',x.emb)?x.emb:d.emb,engrave:!!(x.engrave&&u.engrave),set:!!(L.persona&&L.persona.look)}}
 function setLook(S,x,un){const L=S.life;if(!L)return false;const u=un||{};const ok=(k,id)=>{const o=LOOK[k].find(y=>y.id===id);return o&&(!o.lock||u[o.lock])};
  if(!ok('fig',x.fig)||!ok('col',x.col)||!ok('emb',x.emb))return false;if(!L.persona)L.persona={v:V,ids:[],values:[],status:'later',t:Date.now()};
  L.persona.look={fig:x.fig,col:x.col,emb:x.emb,engrave:!!(x.engrave&&u.engrave)};return true}
 /* Für einen späteren Sync: nur Codes */
 const forSync=S=>{const p=state(S);return p?{v:p.v,ids:p.ids.slice(),status:p.status}:null};

 /* ── Fähigkeiten: was du mitbringst. Bleiben über Saisons und Kapitel erhalten, nichts setzt sie zurück. ──
    Daten: S.life.skills = {v, list:[{id,name,src,t}], no:[src]}. Neue entstehen nur durch ausdrückliches Hinzufügen;
    erreichte Ziele und bewährte Experimente werden als Vorschlag angeboten. */
 const SKILL_MAX=12,SKILL_LEN=24;
 const SKILL_PRESETS=['Laufen','Kochen','Sprachen','Organisieren','Zuhören','Schreiben','Programmieren','Handwerk','Musik','Sparen','Führen','Lernen'];
 const norm=s=>String(s||'').replace(/\s+/g,' ').trim().slice(0,SKILL_LEN);
 const same=(a,b)=>a.toLocaleLowerCase('de')===b.toLocaleLowerCase('de');
 function skills(S){const L=S&&S.life;if(!L)return null;const k=L.skills;
  if(!k||k.v!==V||!Array.isArray(k.list)){const list=k&&Array.isArray(k.list)?k.list:[];L.skills={v:V,list:[],no:[]};list.forEach(x=>x&&addSkill(S,x.name,x.src,x.t));return L.skills}
  if(!Array.isArray(k.no))k.no=[];return k}
 function addSkill(S,name,src=null,t=Date.now()){const k=skills(S),n=norm(name);if(!k||!n||k.list.length>=SKILL_MAX||k.list.some(x=>same(x.name,n)))return null;
  const x={id:'sk'+t.toString(36)+k.list.length,name:n,src:src||null,t};k.list=[...k.list,x];return x}
 function removeSkill(S,id){const k=skills(S);if(!k)return false;const n=k.list.length;k.list=k.list.filter(x=>x.id!==id);return k.list.length<n}
 /* Vorschläge aus erreichten Zielen und bewährten Experimenten, die weder übernommen noch abgelehnt sind */
 /* Nur lesend (sicher in der Darstellung) */
 const skillList=S=>{const k=S&&S.life&&S.life.skills;return k&&Array.isArray(k.list)?k.list:[]};
 function skillHints(S){const L=S.life;if(!L)return[];const k={list:skillList(S),no:(L.skills&&Array.isArray(L.skills.no))?L.skills.no:[]};const taken=new Set([...k.list.map(x=>x.src).filter(Boolean),...k.no]);const out=[];
  (L.goals||[]).filter(g=>g.status==='achieved').forEach(g=>out.push({src:'g:'+g.id,name:norm(g.title),why:'Ziel erreicht'}));
  (L.exps||[]).filter(e=>e.status==='success').forEach(e=>out.push({src:'e:'+e.id,name:norm(e.label),why:'Experiment bewährt'}));
  return out.filter(h=>h.name&&!taken.has(h.src)&&!k.list.some(x=>same(x.name,h.name)))}
 function declineHint(S,src){const k=skills(S);if(k&&src&&!k.no.includes(src))k.no=[...k.no,src].slice(-100)}
 const skillsForSync=S=>{const k=skills(S);return k?{v:k.v,n:k.list.length}:null};

 G.PC={V,MAX,MAX_VALUES,PERSONAS,byId,ensure,state,chosen,invite,toggle,suggestValues,valuesToAdd,goalHint,routineSuggestions,choose,later,forSync,LOOK,look,setLook,
  SKILL_MAX,SKILL_LEN,SKILL_PRESETS,skills,skillList,addSkill,removeSkill,skillHints,declineHint,skillsForSync};
})(typeof window!=='undefined'?window:globalThis);
