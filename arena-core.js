/* Arena rules. Public categories only; never consume personal audit/vision text. */
(function(G){
 'use strict';
 const SLOTS=[{id:'mind',name:'MIND',action:'10 Minuten reflektieren'},{id:'body',name:'Körper',action:'20 Minuten bewegen'},{id:'growth',name:'Entwicklung',action:'20 Minuten lernen'},{id:'bonds',name:'Beziehungen',action:'10 Minuten bewusst Kontakt pflegen'}];
 const DEFAULT_TARGETS={mind:3,body:3,growth:3,bonds:3};
 const DAY=86400000;
 const date=x=>Date.parse(x+'T00:00:00Z');
 function phase(s){const start=s.league.start_date;if(!start)return{kind:'lobby',week:0,closed:0};const days=Math.floor((date(s.today)-date(start))/DAY);if(days<0)return{kind:'scheduled',week:0,closed:0};return days>=28?{kind:'finished',week:4,closed:4}:{kind:'running',week:Math.floor(days/7)+1,closed:Math.floor(days/7)};}
 function validTargets(t){return !!t&&Object.keys(t).length===4&&SLOTS.every(s=>Number.isInteger(t[s.id])&&t[s.id]>=1&&t[s.id]<=7);}
 /* Faire Wertung: ein gemeinsames Soll je Bereich für alle. Wer gleich viel erfüllt, hat gleich viele Punkte. */
 const targetsOf=s=>validTargets(s.league&&s.league.targets)?s.league.targets:DEFAULT_TARGETS;
 function weekly(s,week){const t=targetsOf(s);
  const rows=s.members.map(m=>{const counts=Object.fromEntries(SLOTS.map(x=>[x.id,new Set(s.completions.filter(e=>e.user_id===m.user_id&&e.week===week&&e.slot===x.id).map(e=>e.day)).size]));
   const score=SLOTS.reduce((n,x)=>n+Math.round(250*Math.min(counts[x.id],t[x.id])/t[x.id]),0);
   return{...m,counts,targets:t,score,rank:null,points:0};});
  for(const r of rows){r.rank=1+rows.filter(x=>x.score>r.score).length;if(r.score>0)r.points=Math.max(0,4-r.rank);}
  return rows.sort((a,b)=>b.score-a.score||a.display_name.localeCompare(b.display_name,'de'));
 }
 function season(s){const p=phase(s);return s.members.map(m=>({...m,points:Array.from({length:p.closed},(_,i)=>weekly(s,i+1).find(x=>x.user_id===m.user_id)?.points||0).reduce((a,b)=>a+b,0)})).map((m,i,a)=>({...m,rank:1+a.filter(x=>x.points>m.points).length})).sort((a,b)=>a.rank-b.rank||a.display_name.localeCompare(b.display_name,'de'));}
 function invitation(code,base){const url=new URL(base);url.search='';url.hash='';url.searchParams.set('arena',String(code));return url.href;}
 G.ArenaCore={SLOTS,DEFAULT_TARGETS,phase,validTargets,targetsOf,weekly,season,invitation};
})(typeof window==='undefined'?globalThis:window);
