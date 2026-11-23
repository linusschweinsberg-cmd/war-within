/* Arena rules. Public categories only; never consume personal audit/vision text. */
(function(G){
 'use strict';
 const SLOTS=[{id:'mind',name:'MIND',action:'10 Minuten reflektieren',icon:'owl'},{id:'body',name:'Körper',action:'20 Minuten bewegen',icon:'heartpulse'},{id:'growth',name:'Entwicklung',action:'20 Minuten lernen',icon:'book'},{id:'bonds',name:'Beziehungen',action:'10 Minuten bewusst Kontakt pflegen',icon:'users'}];
 const DEFAULT_TARGETS={mind:3,body:3,growth:3,bonds:3};
 /* Spannung, aber fair: für alle gleich, vorher angekündigt, aus Arena und Datum berechnet (nicht manipulierbar). */
 const ORACLE_FACTOR=1.5,BOUNTY=50;
 const DAY=86400000;
 const date=x=>Date.parse(x+'T00:00:00Z');
 const addDays=(d,n)=>new Date(date(d)+n*DAY).toISOString().slice(0,10);
 function hash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
 function phase(s){const start=s.league.start_date;if(!start)return{kind:'lobby',week:0,closed:0};const days=Math.floor((date(s.today)-date(start))/DAY);if(days<0)return{kind:'scheduled',week:0,closed:0};return days>=28?{kind:'finished',week:4,closed:4}:{kind:'running',week:Math.floor(days/7)+1,closed:Math.floor(days/7)};}
 function validTargets(t){return !!t&&Object.keys(t).length===4&&SLOTS.every(s=>Number.isInteger(t[s.id])&&t[s.id]>=1&&t[s.id]<=7);}
 /* Faire Wertung: ein gemeinsames Soll je Bereich für alle. Wer gleich viel erfüllt, hat gleich viele Punkte. */
 const targetsOf=s=>validTargets(s.league&&s.league.targets)?s.league.targets:DEFAULT_TARGETS;
 /* Orakel des Tages: ein Bereich zählt an diesem Tag ×1,5 – für alle derselbe. */
 const oracle=(s,day)=>SLOTS[hash(s.league.id+'|oracle|'+day)%SLOTS.length].id;
 /* Wochenprämie: wer in der Woche als Erste:r das Soll eines ausgelosten Bereichs erfüllt, erhält +5 Arenapunkte. */
 function bounty(s,week){const t=targetsOf(s),slot=SLOTS[hash(s.league.id+'|bounty|'+week)%SLOTS.length].id;let winner=null,at=null;
  for(const m of s.members){const mine=[...new Map(s.completions.filter(e=>e.user_id===m.user_id&&e.week===week&&e.slot===slot).sort((a,b)=>Date.parse(a.created_at)-Date.parse(b.created_at)).map(e=>[e.day,e])).values()];
   if(mine.length>=t[slot]){const reached=mine.slice().sort((a,b)=>Date.parse(a.created_at)-Date.parse(b.created_at))[t[slot]-1].created_at;if(!at||Date.parse(reached)<Date.parse(at)){at=reached;winner=m.user_id}}}
  return{slot,winner,at,points:BOUNTY};}
 function weekly(s,week){const t=targetsOf(s),b=bounty(s,week);
  const rows=s.members.map(m=>{const mine=s.completions.filter(e=>e.user_id===m.user_id&&e.week===week);
   const counts={},base={},boost={};let oracleHits=0;
   for(const x of SLOTS){const days=[...new Set(mine.filter(e=>e.slot===x.id).map(e=>e.day))].sort().slice(0,t[x.id]);counts[x.id]=days.length;
    base[x.id]=Math.round(250*days.length/t[x.id]);const hits=days.filter(d=>oracle(s,d)===x.id).length;oracleHits+=hits;boost[x.id]=Math.round(250*(ORACLE_FACTOR-1)*hits/t[x.id]);}
   const baseScore=SLOTS.reduce((n,x)=>n+base[x.id],0),oracleBonus=SLOTS.reduce((n,x)=>n+boost[x.id],0),bountyBonus=b.winner===m.user_id?b.points:0;
   return{...m,counts,targets:t,breakdown:SLOTS.map(x=>({slot:x.id,count:counts[x.id],target:t[x.id],base:base[x.id],oracle:boost[x.id]})),base:baseScore,oracle:oracleBonus,oracleHits,bounty:bountyBonus,score:baseScore+oracleBonus+bountyBonus,rank:null,points:0};});
  for(const r of rows){r.rank=1+rows.filter(x=>x.score>r.score).length;if(r.score>0)r.points=Math.max(0,4-r.rank);}
  return rows.sort((a,b)=>b.score-a.score||a.display_name.localeCompare(b.display_name,'de'));
 }
 function awards(s,week){
  const start=s.league.start_date;if(!start)return{comebacks:[],consistent:[],days:0};
  const end=addDays(start,week*7-1),begin=addDays(start,(week-1)*7),comebacks=[];
  const activity=s.members.map(m=>{const days=[...new Set(s.completions.filter(e=>e.user_id===m.user_id&&e.day>=start&&e.day<=end&&e.day<=s.today).map(e=>e.day))].sort();
   for(let i=1;i<days.length-2;i++){const first=days[i],earned=days[i+2];if(date(first)-date(days[i-1])>=3*DAY&&days[i+1]===addDays(first,1)&&earned===addDays(first,2)&&earned>=begin){comebacks.push({...m,day:earned});break;}}
   return{...m,activeDays:days.filter(d=>d>=begin).length};});
  const max=Math.max(0,...activity.map(m=>m.activeDays));
  return{comebacks,consistent:max?activity.filter(m=>m.activeDays===max):[],days:max};
 }
 function season(s){const p=phase(s);return s.members.map(m=>({...m,points:Array.from({length:p.closed},(_,i)=>weekly(s,i+1).find(x=>x.user_id===m.user_id)?.points||0).reduce((a,b)=>a+b,0)})).map((m,i,a)=>({...m,rank:1+a.filter(x=>x.points>m.points).length})).sort((a,b)=>a.rank-b.rank||a.display_name.localeCompare(b.display_name,'de'));}
 function invitation(code,base){const url=new URL(base);url.search='';url.hash='';url.searchParams.set('arena',String(code));return url.href;}
 /* Automatische Übernahme: welche App-Aufgabe zählt für welchen Arena-Bereich. Finanzen haben bewusst keinen Platz. */
 const ACT_SLOT={body:'body',run:'body',lang:'growth',read:'growth',deep:'growth',code:'growth',rel:'bonds'};
 function contribution(S,m,extra={}){if(extra.auto)return null;const slot=ACT_SLOT[m.act],action=(S.life?.actions||[]).find(a=>a.missionId===m.id&&!a.off),minutes=extra.arenaMinutes??action?.minutes;
  return slot&&Number.isFinite(minutes)&&minutes>=({body:20,growth:20,bonds:10,mind:10}[slot])?slot:null;}
 G.ArenaCore={SLOTS,DEFAULT_TARGETS,ORACLE_FACTOR,BOUNTY,ACT_SLOT,contribution,phase,validTargets,targetsOf,oracle,bounty,weekly,awards,season,invitation,addDays};
})(typeof window==='undefined'?globalThis:window);
