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
  {id:'shield',icon:'shield',name:'Schild',line:'Für dich und andere da sein',values:['Loyalität','Mitgefühl','Verantwortung'],area:'relationships',idea:'Täglich eine Nachricht an einen Menschen, der dir wichtig ist'},
  {id:'runner',icon:'activity',name:'Läufer',line:'Stark und belastbar werden',values:['Disziplin','Gesundheit','Mut'],area:'health',idea:'3× pro Woche 20 Minuten Bewegung'},
  {id:'scroll',icon:'scroll',name:'Schriftrolle',line:'Lernen und verstehen',values:['Neugier','Exzellenz','Ehrlichkeit'],area:'growth',idea:'15 Minuten lesen oder lernen'},
  {id:'column',icon:'column',name:'Säule',line:'Etwas Eigenes aufbauen',values:['Exzellenz','Disziplin','Verantwortung'],area:'growth',idea:'25 Minuten fokussiert an deinem Projekt'},
  {id:'owl',icon:'owl',name:'Eule',line:'Geld und Zeit im Griff',values:['Freiheit','Gelassenheit','Verantwortung'],area:'wealth',idea:'Einmal pro Woche 10 Minuten Geldcheck'},
  {id:'star',icon:'star',name:'Eigener Stern',line:'Dein eigenes Bild',values:[],area:null,idea:null}];
 const byId=id=>PERSONAS.find(p=>p.id===id)||null;

 function ensure(S){const L=S&&S.life;if(!L)return null;const p=L.persona;
  if(!p)return null;
  if(p.v!==V||!Array.isArray(p.ids)){L.persona={v:V,ids:[],values:[],status:'later',t:p.t||0};return L.persona}
  p.ids=p.ids.filter((id,i,a)=>byId(id)&&a.indexOf(id)===i).slice(0,MAX);
  p.values=(Array.isArray(p.values)?p.values:[]).filter(v=>typeof v==='string'&&v.trim()).map(v=>v.trim().slice(0,30)).slice(0,6);
  if(!['set','later'].includes(p.status))p.status=p.ids.length?'set':'later';return p}
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
  L.persona={v:V,ids:clean,values:vals,status:clean.length?'set':'later',t};
  const added=addValues?valuesToAdd(current||L.values,vals):[];return {added}}
 function later(S,t=Date.now()){const L=S.life;if(!L)return;if(L.persona){L.persona.status=L.persona.ids.length?'set':'later';return}L.persona={v:V,ids:[],values:[],status:'later',t}}
 /* Für einen späteren Sync: nur Codes */
 const forSync=S=>{const p=state(S);return p?{v:p.v,ids:p.ids.slice(),status:p.status}:null};

 G.PC={V,MAX,MAX_VALUES,PERSONAS,byId,ensure,state,chosen,invite,toggle,suggestValues,valuesToAdd,goalHint,choose,later,forSync};
})(typeof window!=='undefined'?window:globalThis);
