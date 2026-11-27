/* THE WAR WITHIN – Nutzungszählung für den Selbsttest (window.UC)
   Zählt nur auf diesem Gerät, welche Seiten, Fenster und Kernaktionen geöffnet bzw. genutzt werden.
   - Eigener Speicher (war_within_usage_v1), nicht im Spielstand, nicht in der Sicherung, kein Versand.
   - Gespeichert werden nur Codes (z. B. "tab:life", "sheet:goal"), Anzahl, Zahl der Tage und letzter Tag. Keine Texte.
   - Zweck: nach zwei Wochen sehen, was tatsächlich genutzt wird und was nie. */
(function(G){
 'use strict';
 const V=1,KEY='war_within_usage_v1',MAX_KEYS=200;
 const day=t=>{const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
 const store=()=>{try{return G.localStorage||null}catch(e){return null}};
 function empty(t){return{v:V,since:day(t),days:0,lastDay:null,ev:{}}}
 function load(t=Date.now()){const s=store();if(!s)return empty(t);try{const x=JSON.parse(s.getItem(KEY)||'null');if(x&&x.v===V&&x.ev&&typeof x.ev==='object')return x}catch(e){}return empty(t)}
 function save(x){const s=store();if(!s)return;try{s.setItem(KEY,JSON.stringify(x))}catch(e){}}
 const clean=k=>String(k||'').replace(/[^a-zA-Z0-9:_\-]/g,'').slice(0,40);
 /* Ein Ereignis zählen. Gibt den neuen Stand zurück (für Tests). */
 function hit(key,t=Date.now(),x){const k=clean(key);x=x||load(t);if(!k)return x;const d=day(t);
  if(x.lastDay!==d){x.days=(x.days||0)+1;x.lastDay=d}
  const e=x.ev[k];if(!e&&Object.keys(x.ev).length>=MAX_KEYS)return x;
  const n=e||{n:0,d:0,last:null};n.n++;if(n.last!==d){n.d++;n.last=d}x.ev[k]=n;save(x);return x}
 /* Übersicht: sortiert nach Tagen, dann Anzahl; dazu bekannte Codes, die nie genutzt wurden. */
 function summary(known,t=Date.now(),x){x=x||load(t);const rows=Object.entries(x.ev).map(([k,e])=>({k,n:e.n,d:e.d,last:e.last})).sort((a,b)=>b.d-a.d||b.n-a.n);
  const never=(known||[]).filter(k=>!x.ev[k]);return{since:x.since,days:x.days||0,rows,never}}
 function reset(t=Date.now()){const x=empty(t);save(x);return x}
 /* Als Text, z. B. zum Weitergeben im Chat. Nur Codes und Zahlen. */
 function asText(known,t=Date.now(),x){const s=summary(known,t,x);return['Nutzung seit '+s.since+' · an '+s.days+' Tagen geöffnet',...s.rows.map(r=>r.k+': '+r.n+'× an '+r.d+' Tagen (zuletzt '+r.last+')'),...(s.never.length?['Nie genutzt: '+s.never.join(', ')]:[])].join('\n')}
 G.UC={V,KEY,load,hit,summary,reset,asText};
})(typeof window!=='undefined'?window:globalThis);
