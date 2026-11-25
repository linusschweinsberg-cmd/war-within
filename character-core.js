/* THE WAR WITHIN – Charakter zum Saisonbeginn (window.CH)
   Freie Kombination aus Stärken und Herausforderungen, angelehnt an Eigenschaftenauswahl in Survival-Spielen.
   Charakterpunkte sind nur das Budget der Zusammenstellung. Keine Wirkung auf Handlungspunkte, Arena-Wertung,
   Tempel-Bauregeln oder Messwerte. Vorschläge ändern den Plan nur über apply() nach ausdrücklicher Auswahl.
   Daten: S.life.character = {v:1, traits:[ids], status:'none'|'set'|'skipped', season, t, hist:[], used:{}, quiet}
   Saison = Tempelsaison (S.life.temple.cur.n). Details: docs/CHARACTER.md */
(function(G){
 'use strict';
 const V=1,START=4;
 const TRAITS=[
  {id:'steady',kind:'strength',cost:4,name:'Ausdauernd',desc:'Du bleibst gern lange an einer Sache dran.',effect:'Du bekommst das Angebot, eine bestehende Handlung zu vertiefen.',place:'life'},
  {id:'organized',kind:'strength',cost:2,name:'Gut organisiert',desc:'Klare Abläufe liegen dir.',effect:'Du bekommst einen festen Auslöser für eine Routine vorgeschlagen.',place:'life'},
  {id:'curious',kind:'strength',cost:2,name:'Neugierig',desc:'Du probierst gern etwas Neues aus.',effect:'Im Rückblick kannst du einen kleinen neuen Versuch starten.',place:'reflect'},
  {id:'social',kind:'strength',cost:3,name:'Gemeinsam stark',desc:'Mit anderen kommst du leichter ins Tun.',effect:'Auf Wunsch planst du eine Handlung gemeinsam mit jemandem.',place:'life'},
  {id:'distracted',kind:'challenge',cost:2,name:'Leicht ablenkbar',desc:'Dein Fokus springt manchmal schnell weiter.',effect:'Du kannst für eine Handlung einen Zeitraum ohne Ablenkung planen.',place:'life'},
  {id:'allornothing',kind:'challenge',cost:3,name:'Alles oder nichts',desc:'Kleine Schritte fühlen sich manchmal zu wenig an.',effect:'Du kannst eine kleine Variante festlegen, die bewusst auch zählt.',place:'life'},
  {id:'overplanner',kind:'challenge',cost:2,name:'Überplaner',desc:'Du feilst gern lange am perfekten Plan.',effect:'Du bekommst das Angebot, erst einen kleinen Versuch zu machen.',place:'life'},
  {id:'overcommit',kind:'challenge',cost:3,name:'Zu viel auf einmal',desc:'Du nimmst dir schnell viel gleichzeitig vor.',effect:'Du kannst einen Schwerpunkt wählen; anderes darf warten.',place:'life'}];
 const BY=Object.fromEntries(TRAITS.map(t=>[t.id,t]));
 const ANCHORS=['Nach dem Aufstehen','Nach dem ersten Kaffee','Nach dem Mittagessen','Nach der Arbeit','Vor dem Schlafengehen'];
 const CALM_MIN=[15,25,45];
 const delta=t=>t.kind==='strength'?-t.cost:t.cost;

 function normalize(ids){const out=[];(Array.isArray(ids)?ids:[]).forEach(id=>{if(BY[id]&&!out.includes(id))out.push(id)});return out}
 function budget(ids){return normalize(ids).reduce((n,id)=>n+delta(BY[id]),START)}
 function check(ids){const raw=Array.isArray(ids)?ids:[],n=normalize(raw),b=budget(n);
  return{ok:b>=0&&n.length===raw.length,budget:b,traits:n,dup:raw.length!==new Set(raw).size,unknown:raw.filter(id=>!BY[id])}}
 function toggle(ids,id){const n=normalize(ids);if(!BY[id])return n;return n.includes(id)?n.filter(x=>x!==id):[...n,id]}
 function effects(ids){return normalize(ids).map(id=>({id,kind:BY[id].kind,name:BY[id].name,text:BY[id].effect}))}

 const seasonOf=S=>(S&&S.life&&S.life.temple&&S.life.temple.cur&&S.life.temple.cur.n)||1;
 function blank(){return{v:V,traits:[],status:'none',season:null,t:null,hist:[],used:{},quiet:null}}
 /* Abwärtskompatibel: fehlend → leer; unbekannte Felder bleiben; unbekannte IDs fallen beim Lesen weg */
 function ensure(S){const L=S&&S.life;if(!L)return null;const c=L.character;
  if(!c||typeof c!=='object'){L.character=blank();return L.character}
  if(!c.v)c.v=V;c.traits=normalize(c.traits);if(!['none','set','skipped'].includes(c.status))c.status=c.traits.length?'set':'none';
  if(!Array.isArray(c.hist))c.hist=[];if(!c.used||typeof c.used!=='object')c.used={};return c}
 function state(S){const c=ensure(S);if(!c)return null;const n=seasonOf(S);
  return{traits:c.traits.slice(),status:c.status,season:c.season,cur:n,budget:budget(c.traits),decided:c.status!=='none'&&c.season===n,invite:c.status==='none'||c.season!==n}}
 /* Bestätigen: nur bei gültigem Budget. Leere Auswahl ist erlaubt. Gilt ab jetzt für die laufende Tempelsaison. */
 function choose(S,ids,t=Date.now()){const r=check(ids);if(!r.ok)return false;const c=ensure(S);if(!c)return false;const n=seasonOf(S);
  if(c.status!=='none')c.hist=[...c.hist,{season:c.season,traits:c.traits.slice(),status:c.status,t:c.t}].slice(-12);
  c.traits=r.traits;c.status='set';c.season=n;c.t=t;return true}
 /* Überspringen: bisherige Eigenschaften bleiben unverändert (nichts wird automatisch entfernt). */
 function skip(S,t=Date.now()){const c=ensure(S);if(!c)return false;c.status=c.traits.length?'set':'skipped';c.season=seasonOf(S);c.t=c.t||t;return true}

 /* ── Vorschläge: höchstens einer zur Zeit, je Eigenschaft und Saison einmal ── */
 const liveActs=L=>(L.actions||[]).filter(a=>!a.off&&(L.goals||[]).some(g=>g.id===a.goalId&&g.status==='active'));
 const mainGoal=L=>{const gs=(L.goals||[]).filter(g=>g.status==='active');return gs.find(g=>g.id===L.main)||gs[0]||null};
 const opt=a=>({aid:a.id,label:a.title});
 function candidate(S,id,ctx){const L=S.life,acts=liveActs(L),g=mainGoal(L);
  switch(id){
   case'organized':{const o=acts.filter(a=>!a.anchor&&!a.when).slice(0,3);return o.length?{text:'Gib einer Routine einen festen Auslöser. So musst du nicht jeden Tag neu entscheiden.',acts:o.map(opt),anchors:ANCHORS}:null}
   case'steady':{const o=acts.filter(a=>(a.perWeek||1)<7).slice(0,3);return o.length?{text:'Vertiefe eine Handlung, die schon läuft: ein Termin mehr pro Woche statt etwas Neuem.',acts:o.map(a=>({...opt(a),from:a.perWeek||1,to:(a.perWeek||1)+1}))}:null}
   case'curious':return g?{text:'Probier in der nächsten Woche etwas Kleines Neues für „'+g.title+'“ aus. Einmal reicht.',goalId:g.id}:null;
   case'social':return g?{text:'Plane eine Handlung gemeinsam mit jemandem. Nur wenn es für dich passt.',goalId:g.id}:null;
   case'distracted':{const o=acts.filter(a=>!a.calm).slice(0,3);return o.length?{text:'Plane für eine Handlung einen Zeitraum ohne Ablenkung, zum Beispiel mit dem Handy außer Reichweite.',acts:o.map(opt),mins:CALM_MIN}:null}
   case'allornothing':{const o=acts.filter(a=>!a.mini).slice(0,3);return o.length?{text:'Leg eine kleine Variante fest. An schweren Tagen lässt du sie bewusst gelten.',acts:o.map(opt)}:null}
   case'overplanner':{if(ctx&&ctx.battleSet)return null;const o=acts.slice(0,3);return o.length?{text:'Bevor du weiter planst: Mach heute einen kleinen Versuch mit einer Handlung, die schon steht.',acts:o.map(a=>({...opt(a),missionId:a.missionId}))}:null}
   case'overcommit':{const areas=[...new Set((L.goals||[]).filter(x=>x.status==='active').map(x=>x.area))];return areas.length>=2?{text:'Wähle einen Schwerpunkt für die nächste Zeit. Die anderen Vorhaben bleiben gespeichert und dürfen warten.',areas,focus:L.focus||null}:null}}
  return null}
 const usedKey=(S,id)=>seasonOf(S)+':'+id;
 /* ctx: {d: Kalendertag, battleSet: bool, place?: 'life'|'reflect'} */
 function suggestion(S,ctx={}){const c=ensure(S);if(!c||!c.traits.length)return null;const d=ctx.d??(S.life.d||0);
  if(c.quiet===d)return null;
  for(const id of TRAITS.map(t=>t.id)){if(!c.traits.includes(id)||c.used[usedKey(S,id)])continue;const x=candidate(S,id,ctx);if(!x)continue;
   const t=BY[id];if(ctx.place&&ctx.place!==t.place)return null;return{trait:id,name:t.name,kind:t.kind,place:t.place,...x}}
  return null}
 function mark(S,id,how,d){const c=ensure(S);c.used={...c.used,[usedKey(S,id)]:how};c.quiet=d??(S.life.d||0)}
 function dismiss(S,id,d){if(!BY[id])return false;mark(S,id,'later',d);return true}
 /* Ausdrückliche Übernahme. Überschreibt nie vorhandene Werte. Gibt {ok, battle?} zurück. */
 function apply(S,id,ch={},ctx={}){const L=S.life,LC=G.LC;const c=ensure(S);if(!c||!c.traits.includes(id))return{ok:false};
  const x=candidate(S,id,ctx);if(!x)return{ok:false};const a=ch.aid&&(L.actions||[]).find(y=>y.id===ch.aid);
  const inOpts=()=>a&&(x.acts||[]).some(o=>o.aid===a.id);let out={ok:true};
  if(id==='organized'){if(!inOpts()||!ANCHORS.includes(ch.anchor))return{ok:false};a.anchor=ch.anchor;LC&&LC.syncMission(S,a)}
  else if(id==='steady'){if(!inOpts())return{ok:false};const wk=LC.curWk(L),v=Math.min(7,(a.perWeek||1)+1),prev=(a.hist||[]).find(h=>h.wk===wk);a.hist=[...(a.hist||[]).filter(h=>h.wk!==wk),{wk,perWeek:v,from:prev?prev.from:a.perWeek}];a.perWeek=v;LC.syncMission(S,a)}
  else if(id==='curious'||id==='social'){const title=String(ch.title||'').trim().slice(0,80);const g=(L.goals||[]).find(y=>y.id===x.goalId);if(!title||!g)return{ok:false};
   const na=LC.addAction(S,g,{title:id==='social'?title+' (gemeinsam)':title,perWeek:1});if(na&&typeof na==='object')na.src='character'}
  else if(id==='distracted'){if(!inOpts()||!CALM_MIN.includes(+ch.min))return{ok:false};a.calm={min:+ch.min}}
  else if(id==='allornothing'){const t=String(ch.text||'').trim().slice(0,80);if(!inOpts()||!t)return{ok:false};a.mini=t}
  else if(id==='overplanner'){if(!inOpts()||!a.missionId)return{ok:false};out.battle='m:'+a.missionId}
  else if(id==='overcommit'){if(!x.areas.includes(ch.area))return{ok:false};L.focus=ch.area}
  mark(S,id,'applied',ctx.d);return out}
 /* Für einen späteren Sync: nur Codes und Saisonnummer */
 function forSync(S){const c=ensure(S);return c?{v:V,traits:c.traits.slice(),status:c.status,season:c.season}:null}

 G.CH={V,START,TRAITS,BY,ANCHORS,CALM_MIN,normalize,budget,check,toggle,effects,ensure,state,choose,skip,suggestion,candidate,dismiss,apply,forSync,seasonOf};
})(typeof window!=='undefined'?window:globalThis);
