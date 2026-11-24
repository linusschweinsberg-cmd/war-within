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
   if(mine.length>=t[slot]){const reached=mine.slice().sort((a,b)=>Date.parse(a.created_at)-Date.parse(b.created_at))[t[slot]-1].created_at;if(!at||Date.parse(reached)<Date.parse(at)||Date.parse(reached)===Date.parse(at)&&m.user_id<winner){at=reached;winner=m.user_id}}}
  return{slot,winner,at,points:BOUNTY};}
 /* ── Regel 3 (Arena 3.0): Spiegel von private.arena_v3_score. Der Server ist maßgeblich; diese Funktion dient
    nur Vorschau, Fortschrittsanzeige und Prognose. tests/arena-v3.cjs vergleicht beide Rechnungen. Einheit: Zehntel. ── */
 const BONUS_CAP=150,FORMATION_PTS=60,COMBO_PTS=50,MOMENTUM_PTS=40,MOMENTUM_RUN=3,SHIELD_SHARE=0.6,GUARD_DAYS=4;
 const FORMATIONS=[
  {id:'shield',name:'Schildwall',icon:'shield',focus:'Ausgewogenheit',rule:'Alle vier Bereiche erreichen mindestens 60 % ihres Wochensolls.'},
  {id:'spear',name:'Speerspitze',icon:'target',focus:'Konzentration',rule:'Dein Schwerpunkt-Bereich erreicht 100 % seines Wochensolls.'},
  {id:'guardian',name:'Wächter',icon:'castle',focus:'Beständigkeit',rule:'An vier geplanten Tagen alle für den Tag geplanten Standards erfüllen (bei weniger Plantagen: an allen).'}];
 const formationOf=(s,uid,week)=>(s.formations||[]).find(f=>f.user_id===uid&&f.week===week)||null;
 function scoreV3(s,uid,week){const t=targetsOf(s),ws=addDays(s.league.start_date,(week-1)*7),comp=s.completions.filter(e=>e.user_id===uid&&e.week===week);
  const has=(k,day)=>comp.some(e=>e.slot===k&&e.day===day),counts={},breakdown=[];let b=0,o=0,pillars=0;
  for(const x of SLOTS){const k=x.id,n=Math.min(new Set(comp.filter(e=>e.slot===k).map(e=>e.day)).size,t[k]),base=Math.round(250*n/t[k]);
   const hits=comp.filter(e=>e.slot===k&&oracle(s,e.day)===k).length,ob=Math.round(125*Math.min(hits,t[k])/t[k]);
   counts[k]=n;b+=base;o+=ob;if(n>=t[k])pillars++;breakdown.push({slot:k,count:n,target:t[k],base,oracle:ob});}
  let cb=pillars>=3?COMBO_PTS:0,bb=bounty(s,week).winner===uid?BOUNTY:0,fb=0,mb=0,run=0,pd=0,fd=0;
  const f=formationOf(s,uid,week);
  if(f){const e=f.switch_day||ws;let streak=0;
   for(let d=1;d<=7;d++){const day=addDays(ws,d-1),pl=SLOTS.filter(x=>(f.plan[x.id]||[]).includes(d));if(!pl.length)continue;
    const ok=pl.every(x=>has(x.id,day));streak=ok?streak+1:0;run=Math.max(run,streak);if(day>=e){pd++;if(ok)fd++}}
   if(run>=MOMENTUM_RUN)mb=MOMENTUM_PTS;
   let met=true;
   for(const x of SLOTS){const k=x.id,before=comp.filter(c=>c.slot===k&&c.day<e).length,cw=comp.filter(c=>c.slot===k&&c.day>=e).length;
    const pw=Math.min((f.plan[k]||[]).filter(d=>addDays(ws,d-1)>=e).length,Math.max(t[k]-before,0));
    if(f.kind==='shield'&&cw<Math.ceil(6*pw/10))met=false;if(f.kind==='spear'&&k===f.slot&&(pw<1||cw<pw))met=false;}
   if(f.kind==='shield'&&!SLOTS.some(x=>(f.plan[x.id]||[]).some(d=>addDays(ws,d-1)>=e)))met=false;
   if(f.kind==='guardian')met=pd>=1&&fd>=Math.min(GUARD_DAYS,pd);
   if(met)fb=FORMATION_PTS;}
  fb=Math.min(fb,BONUS_CAP);cb=Math.min(cb,BONUS_CAP-fb);mb=Math.min(mb,BONUS_CAP-fb-cb);bb=Math.min(bb,BONUS_CAP-fb-cb-mb);o=Math.min(o,BONUS_CAP-fb-cb-mb-bb);
  return{base:b,oracle:o,bounty:bb,formation:fb,combo:cb,momentum:mb,bonus:fb+cb+mb+bb+o,score:b+fb+cb+mb+bb+o,counts,targets:t,breakdown,pillars,run,kind:f?f.kind:null,switched:!!(f&&f.switch_day),guard:{done:fd,planned:pd}};}
 /* Kriegsrat: ab morgen gültig, Montag bis Donnerstag. Liefert den ersten Gültigkeitstag (1–7) und das je Bereich noch offene Soll. */
 function switchNeed(s,week){const ws=addDays(s.league.start_date,(week-1)*7),from=Math.floor((date(s.today)-date(ws))/DAY)+2,t=targetsOf(s);
  const mine=k=>s.completions.filter(e=>e.user_id===s.user_id&&e.week===week&&e.slot===k).length;
  return{from,open:from<=5,need:Object.fromEntries(SLOTS.map(x=>[x.id,Math.min(8-from,Math.max(0,t[x.id]-mine(x.id)))]))};}
 /* Lokale Rechnung erzwingen (für Vorschauen mit hypothetischen Meldungen). */
 const local=s=>s.league.rule_version===3?{...s,scores:null}:s;
 function weekly(s,week){if(s.league.rule_version===3){
  const rows=s.members.map(m=>{const r=s.scores&&s.scores.find(x=>x.user_id===m.user_id&&x.week===week);return{...m,...(r||scoreV3(s,m.user_id,week)),confirmed:!!r}});
  for(const r of rows){r.rank=1+rows.filter(x=>x.score>r.score).length;r.points=r.score>0?Math.max(0,4-r.rank):0;}
  return rows.sort((a,b)=>b.score-a.score||a.display_name.localeCompare(b.display_name,'de'));
 }const t=targetsOf(s),b=bounty(s,week);
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
 /* Nächster Zug: was eine Meldung heute je Bereich bringt – gleiche Wertungsfunktion, nur vorausgerechnet, nichts wird verändert. */
 function gains(s){s=local(s);const p=phase(s);if(p.kind!=='running')return[];const me=s.user_id,t=targetsOf(s),before=weekly(s,p.week),mine=before.find(r=>r.user_id===me);if(!mine)return[];
  const at=s.server_now||new Date(date(s.today)+12*3600000).toISOString();
  return SLOTS.filter(x=>!s.completions.some(e=>e.user_id===me&&e.week===p.week&&e.slot===x.id&&e.day===s.today)&&mine.counts[x.id]<t[x.id]).map(x=>{
   const after=weekly({...s,completions:[{id:'preview',user_id:me,week:p.week,slot:x.id,day:s.today,created_at:at},...s.completions]},p.week),r=after.find(y=>y.user_id===me);
   const passes=before.filter(o=>o.user_id!==me&&o.score>=mine.score&&o.score<r.score).map(o=>o.display_name);
   return{slot:x.id,points:r.score-mine.score,rank:r.rank,oracle:oracle(s,s.today)===x.id,bounty:r.bounty>mine.bounty,passes};
  }).sort((a,b)=>b.points-a.points||SLOTS.findIndex(x=>x.id===a.slot)-SLOTS.findIndex(x=>x.id===b.slot));}
 /* Wochenverlauf: je Mitglied sieben Tage mit Anzahl gemeldeter Bereiche. Nur öffentliche Meldungen, keine Zukunftstage. */
 function activity(s,week){const start=s.league.start_date;if(!start)return[];const days=Array.from({length:7},(_,i)=>addDays(start,(week-1)*7+i));
  return weekly(s,week).map(r=>({user_id:r.user_id,display_name:r.display_name,rank:r.rank,days:days.map(d=>({day:d,future:d>s.today,today:d===s.today,slots:new Set(s.completions.filter(e=>e.user_id===r.user_id&&e.week===week&&e.day===d).map(e=>e.slot)).size}))}));}
 /* Finale: am letzten Tag der Woche – Abstand nach oben und was mit allen offenen Bereichen heute noch möglich ist. */
 function finale(s){s=local(s);const p=phase(s);if(p.kind!=='running'||addDays(s.league.start_date,p.week*7-1)!==s.today)return null;
  const me=s.user_id,rows=weekly(s,p.week),mine=rows.find(r=>r.user_id===me);if(!mine)return null;
  const open=gains(s).map(g=>g.slot),at=s.server_now||new Date(date(s.today)+12*3600000).toISOString();
  const after=weekly({...s,completions:[...open.map((slot,i)=>({id:'preview-'+i,user_id:me,week:p.week,slot,day:s.today,created_at:at})),...s.completions]},p.week).find(r=>r.user_id===me);
  const above=rows.filter(r=>r.user_id!==me&&r.score>mine.score).sort((a,b)=>a.score-b.score)[0]||null;
  return{week:p.week,rank:mine.rank,score:mine.score,above,gap:above?above.score-mine.score:0,open,potential:after.score-mine.score,rankAfter:after.rank};}
 function season(s){const p=phase(s);return s.members.map(m=>({...m,points:Array.from({length:p.closed},(_,i)=>weekly(s,i+1).find(x=>x.user_id===m.user_id)?.points||0).reduce((a,b)=>a+b,0)})).map((m,i,a)=>({...m,rank:1+a.filter(x=>x.points>m.points).length})).sort((a,b)=>a.rank-b.rank||a.display_name.localeCompare(b.display_name,'de'));}
 function invitation(code,base){const url=new URL(base);url.search='';url.hash='';url.searchParams.set('arena',String(code));return url.href;}
 /* Automatische Übernahme: welche App-Aufgabe zählt für welchen Arena-Bereich. Finanzen haben bewusst keinen Platz. */
 const ACT_SLOT={body:'body',run:'body',lang:'growth',read:'growth',deep:'growth',code:'growth',rel:'bonds'};
 function contribution(S,m,extra={}){if(extra.auto)return null;const slot=ACT_SLOT[m.act],action=(S.life?.actions||[]).find(a=>a.missionId===m.id&&!a.off),minutes=extra.arenaMinutes??action?.minutes;
  return slot&&Number.isFinite(minutes)&&minutes>=({body:20,growth:20,bonds:10,mind:10}[slot])?slot:null;}
 G.ArenaCore={FORMATIONS,BONUS_CAP,FORMATION_PTS,COMBO_PTS,MOMENTUM_PTS,MOMENTUM_RUN,scoreV3,formationOf,switchNeed,SLOTS,DEFAULT_TARGETS,ORACLE_FACTOR,BOUNTY,ACT_SLOT,contribution,phase,validTargets,targetsOf,oracle,bounty,weekly,gains,activity,finale,awards,season,invitation,addDays};
})(typeof window==='undefined'?globalThis:window);
