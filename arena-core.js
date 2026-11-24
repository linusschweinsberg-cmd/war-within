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
 /* ── Arena 3.0 · Phase 3: Prognose, Gegner-Pokal, Scouting, Live-Hinweise. Alles rein aus öffentlichen Arena-Daten
    abgeleitet und lesend; keine neuen Punkte. ── */
 const dayIndex=(s,week)=>Math.floor((date(s.today)-date(addDays(s.league.start_date,(week-1)*7)))/DAY)+1;
 /* Bestes Szenario einer Person: jedes offene Soll an den verbleibenden Tagen (ab heute) erfüllt, geplante Tage zuerst. */
 function scenario(s,uid,week){const t=targetsOf(s),ws=addDays(s.league.start_date,(week-1)*7),from=Math.max(1,dayIndex(s,week)),f=formationOf(s,uid,week),extra=[];
  if(from>7)return s;
  for(const x of SLOTS){const k=x.id,done=new Set(s.completions.filter(e=>e.user_id===uid&&e.week===week&&e.slot===k).map(e=>e.day)),open=t[k]-Math.min(done.size,t[k]),planned=f?(f.plan[k]||[]):[];
   const cand=[];for(let d=from;d<=7;d++)if(!done.has(addDays(ws,d-1)))cand.push(d);
   cand.sort((a,b)=>(planned.includes(b)-planned.includes(a))||a-b);
   for(const d of cand.slice(0,open))extra.push({id:'scenario-'+k+'-'+d,user_id:uid,week,slot:k,day:addDays(ws,d-1),created_at:new Date(date(addDays(ws,d-1))+22*3600000).toISOString()});}
  return{...s,scores:null,completions:[...s.completions,...extra]};}
 /* Prognose der laufenden Woche: bestätigter Stand, rechnerisches Maximum und mögliche Plätze. Keine Wahrscheinlichkeiten. */
 function forecast(s){const p=phase(s);if(p.kind!=='running'||s.league.rule_version!==3)return null;const week=p.week,now=weekly(s,week);
  const rows=now.map(r=>{const max=scoreV3(scenario(s,r.user_id,week),r.user_id,week);return{user_id:r.user_id,display_name:r.display_name,now:r.score,base:r.base,bonus:r.bonus,max:Math.max(max.score,r.score),maxBase:max.base,maxBonus:max.bonus,rank:r.rank}});
  for(const r of rows){r.open=r.max-r.now;r.best=1+rows.filter(o=>o.user_id!==r.user_id&&o.now>r.max).length;r.worst=1+rows.filter(o=>o.user_id!==r.user_id&&o.max>r.now).length;}
  return{week,daysLeft:Math.max(0,8-dayIndex(s,week)),rows};}
 /* Gegner-Pokal: Rundenturnier (Kreisverfahren) über die feste Mitgliederreihenfolge. Ungerade Zahl: ein Freilos, das jede Woche weiterwandert.
    Steht vor Wochenbeginn fest, weil nach dem Start niemand beitritt. Keine Zusatzpunkte: verglichen werden nur die Wochenpunkte. */
 function pairings(s,week){const ids=s.members.map(m=>m.user_id);if(ids.length<2)return[];if(ids.length%2)ids.push(null);const n=ids.length,r=(week-1)%(n-1);
  const rest=ids.slice(1),rot=rest.map((_,i)=>rest[(i+r)%rest.length]),order=[ids[0],...rot],out=[];
  for(let i=0;i<n/2;i++){const a=order[i],b=order[n-1-i];out.push(a===null?{a:b,b:null}:{a,b});}
  return out;}
 function duelOf(s,week,uid){const m=pairings(s,week).find(x=>x.a===uid||x.b===uid);if(!m)return null;const opp=m.a===uid?m.b:m.a;if(!opp)return{week,bye:true,opp:null,closed:week<=phase(s).closed,result:null};
  const rows=weekly(s,week),me=rows.find(r=>r.user_id===uid),o=rows.find(r=>r.user_id===opp),closed=week<=phase(s).closed;
  const result=!closed?null:me.score>o.score?'win':me.score<o.score?'loss':'draw';
  return{week,bye:false,opp,mine:me.score,theirs:o.score,closed,result};}
 function duelRecord(s,uid){const p=phase(s),weeks=Array.from({length:Math.max(p.closed,p.week)},(_,i)=>duelOf(s,i+1,uid)).filter(Boolean);
  const done=weeks.filter(d=>d.closed&&!d.bye);
  return{weeks,win:done.filter(d=>d.result==='win').length,loss:done.filter(d=>d.result==='loss').length,draw:done.filter(d=>d.result==='draw').length,
   meetings:opp=>weeks.filter(d=>d.opp===opp)};}
 /* Scouting: nur freigegebene Arena-Daten (Meldungen, Wochenpunkte, Duelle). Keine Ziele, Texte oder Gesundheitswerte. */
 function scout(s,uid){const p=phase(s),t=targetsOf(s),start=s.league.start_date;if(!start||p.kind==='scheduled'||p.kind==='lobby')return null;
  const closedWeeks=Array.from({length:p.closed},(_,i)=>i+1),weeks=closedWeeks.length?closedWeeks:[p.week];
  const scores=weeks.map(w=>weekly(s,w).find(r=>r.user_id===uid)?.score||0),mine=s.completions.filter(e=>e.user_id===uid&&e.day<=s.today);
  const elapsed=Math.min(28,Math.floor((date(s.today)-date(start))/DAY)+1),active=new Set(mine.map(e=>e.day)).size;
  const wk=Math.max(1,p.closed+(p.kind==='running'?1:0)),share=SLOTS.map(x=>({slot:x.id,rate:mine.filter(e=>e.slot===x.id).length/(t[x.id]*wk)})).sort((a,b)=>b.rate-a.rate);
  const rec=duelRecord(s,uid),last=closedWeeks.length>=2?scores.at(-1)-scores.at(-2):null;
  return{user_id:uid,avg:Math.round(scores.reduce((a,b)=>a+b,0)/scores.length),consistency:elapsed?active/elapsed:0,activeDays:active,elapsed,duelWins:rec.win,duelLosses:rec.loss,
   strongest:share[0].rate>0?share[0].slot:null,trend:last,weekRank:weekly(s,p.week).find(r=>r.user_id===uid)?.rank||null,seasonRank:season(s).find(r=>r.user_id===uid)?.rank||null,provisional:!closedWeeks.length};}
 /* Wo kann ich rechnerisch aufholen? Kategorien, in denen der Gegner vorn liegt, mit Abstand. */
 function catchUp(a,b){if(!a||!b)return[];const out=[];
  if(b.avg>a.avg)out.push({key:'avg',gap:b.avg-a.avg});if(b.consistency>a.consistency)out.push({key:'consistency',gap:b.activeDays-a.activeDays});if(b.duelWins>a.duelWins)out.push({key:'duels',gap:b.duelWins-a.duelWins});
  return out;}
 /* Live-Hinweise: Vergleich zweier bestätigter Stände (vorher/nachher). Höchstens ein Hinweis, der wichtigste zuerst. */
 function liveNews(prev,next){if(!prev||!next||prev.league.id!==next.league.id)return null;const p=phase(next);if(p.kind!=='running')return null;const w=p.week,me=next.user_id;
  const a=weekly(prev,w),b=weekly(next,w),ma=a.find(r=>r.user_id===me),mb=b.find(r=>r.user_id===me);if(!ma||!mb)return null;
  const leadA=a.filter(r=>r.rank===1&&r.score>0).map(r=>r.user_id),leadB=b.filter(r=>r.rank===1&&r.score>0).map(r=>r.user_id);
  const best=Math.max(0,...Array.from({length:p.closed},(_,i)=>weekly(next,i+1).find(r=>r.user_id===me)?.score||0));
  if(mb.formation>(ma.formation||0))return{kind:'formation',text:'Formation gemeistert',points:mb.formation};
  if(leadB.length===1&&leadB[0]===me&&!(leadA.length===1&&leadA[0]===me))return{kind:'lead',text:'Du hast die Führung übernommen'};
  if(leadB.length===1&&leadB[0]!==me&&!(leadA.length===1&&leadA[0]===leadB[0]))return{kind:'leadOther',text:(b.find(r=>r.user_id===leadB[0]).display_name)+' führt jetzt die Arena'};
  if(p.closed>0&&mb.score>best&&ma.score<=best)return{kind:'record',text:'Neuer persönlicher Wochenrekord'};
  if(mb.rank<ma.rank)return{kind:'rank',text:'Aufstieg auf Platz '+mb.rank};
  if(mb.score>ma.score)return{kind:'points',text:'Bestätigt',points:mb.score-ma.score};
  return null;}
 /* ── Arena 3.0 · Phase 4: Saisonstatistik, Ruhmeshalle, Auszeichnungen. Nur abgeschlossene Wochen zählen;
    alles wird aus den gespeicherten Meldungen und Wertungen abgeleitet (keine zweite Statistik, nichts Erfundenes). ── */
 const PHALANX_BASE=600,STEADY_BASE=600;
 function seasonStats(s,uid){const p=phase(s);if(p.kind==='lobby'||p.kind==='scheduled'||!s.members.some(m=>m.user_id===uid))return null;
  const weeks=Array.from({length:p.closed},(_,i)=>i+1),table=weeks.map(w=>({w,rows:weekly(s,w)})),mine=table.map(x=>({w:x.w,r:x.rows.find(r=>r.user_id===uid),rows:x.rows}));
  const sea=season(s).find(r=>r.user_id===uid),rec=duelRecord(s,uid),name=id=>s.members.find(m=>m.user_id===id)?.display_name||'Mitglied';
  let best=null;for(const x of mine)if(x.r&&x.r.score>0&&(!best||x.r.score>best.score))best={week:x.w,score:x.r.score};
  const count=k=>mine.filter(x=>(x.r?.[k]||0)>0).length;
  return{league:s.league.id,name:s.league.name,start:s.league.start_date,finished:p.kind==='finished',closed:p.closed,members:s.members.length,
   rank:sea?.rank??null,points:sea?.points??0,champion:p.kind==='finished'&&sea?.rank===1&&sea.points>0,
   weekWins:mine.filter(x=>x.r&&x.r.rank===1&&x.r.score>0).map(x=>x.w),best,
   formations:count('formation'),momentum:count('momentum'),combos:count('combo'),
   comebacks:weeks.filter(w=>awards(s,w).comebacks.some(m=>m.user_id===uid)).length,
   phalanx:table.filter(x=>x.rows.length>1&&x.rows.every(r=>(r.base||0)>=PHALANX_BASE)).map(x=>x.w),
   duel:{win:rec.win,loss:rec.loss,draw:rec.draw},duels:rec.weeks.filter(d=>d.closed&&!d.bye).map(d=>({week:d.week,opp:d.opp,name:name(d.opp),result:d.result})),
   weekBases:mine.map(x=>({start:addDays(s.league.start_date,(x.w-1)*7),base:x.r?.base||0})),doctrine:(s.doctrines||{})[uid]||null};}
 /* Ruhmeshalle über alle Saisons: Summen, längste Folge starker Wochen, Rivalen und Lorbeeren mit Herkunft. */
 function hall(snaps,uid){const seasons=(snaps||[]).map(s=>seasonStats(s,uid)).filter(Boolean).sort((a,b)=>b.start.localeCompare(a.start));
  const sum=k=>seasons.reduce((n,x)=>n+(Array.isArray(x[k])?x[k].length:x[k]),0);
  const byWeek=new Map();for(const x of seasons)for(const w of x.weekBases)byWeek.set(w.start,Math.max(byWeek.get(w.start)||0,w.base));
  let streak=0,run=0,prev=null;for(const d of [...byWeek.keys()].sort()){const ok=byWeek.get(d)>=STEADY_BASE;run=ok?(prev&&ok&&date(d)-date(prev)===7*DAY&&run>0?run+1:1):0;if(ok)prev=d;else prev=null;streak=Math.max(streak,run)}
  let best=null;for(const x of seasons)if(x.best&&(!best||x.best.score>best.score))best={...x.best,name:x.name};
  const riv=new Map();for(const x of seasons)for(const d of x.duels){const r=riv.get(d.opp)||{opp:d.opp,name:d.name,win:0,loss:0,draw:0,n:0};r.name=d.name;r[d.result]++;r.n++;riv.set(d.opp,r)}
  const rivals=[...riv.values()].sort((a,b)=>b.n-a.n||b.win-a.win||a.name.localeCompare(b.name,'de'));
  const totals={seasons:seasons.length,finished:seasons.filter(x=>x.finished).length,titles:seasons.filter(x=>x.champion).length,weekWins:sum('weekWins'),formations:sum('formations'),momentum:sum('momentum'),combos:sum('combos'),comebacks:sum('comebacks'),phalanx:sum('phalanx'),
   win:seasons.reduce((n,x)=>n+x.duel.win,0),loss:seasons.reduce((n,x)=>n+x.duel.loss,0),draw:seasons.reduce((n,x)=>n+x.duel.draw,0)};
  const laurels=[];
  for(const x of seasons.filter(x=>x.champion))laurels.push({id:'title-'+x.league,kind:'title',title:'Saisonsieg',detail:x.name+' · '+new Date(date(x.start)).toLocaleDateString('de-DE',{month:'long',year:'numeric',timeZone:'UTC'})});
  if(best)laurels.push({id:'best',kind:'best',title:'Bestwoche',value:best.score,detail:best.name+' · Woche '+best.week});
  if(totals.weekWins)laurels.push({id:'weeks',kind:'weeks',title:'Wochensiege',count:totals.weekWins,detail:'Platz 1 in einer abgeschlossenen Woche'});
  if(streak>=2)laurels.push({id:'steady',kind:'steady',title:'Beständigkeit',count:streak,detail:'Wochen in Folge mit mindestens 60 Basispunkten'});
  if(totals.formations)laurels.push({id:'form',kind:'formation',title:'Formationen gemeistert',count:totals.formations,detail:'Bedingung der gesperrten Formation erfüllt'});
  if(totals.win)laurels.push({id:'duel',kind:'duel',title:'Duellsiege',count:totals.win,detail:'Gegner-Pokal, mehr Wochenpunkte als der Gegner'});
  if(totals.comebacks)laurels.push({id:'comeback',kind:'comeback',title:'Comebacks',count:totals.comebacks,detail:'Nach Pause wieder drei Tage in Folge aktiv'});
  if(totals.phalanx)laurels.push({id:'phalanx',kind:'phalanx',title:'Phalanx-Wochen',count:totals.phalanx,detail:'Alle Mitglieder mit mindestens 60 Basispunkten'});
  return{seasons,totals,streak,best,rivals,laurels};}
 function invitation(code,base){const url=new URL(base);url.search='';url.hash='';url.searchParams.set('arena',String(code));return url.href;}
 /* Automatische Übernahme: welche App-Aufgabe zählt für welchen Arena-Bereich. Finanzen haben bewusst keinen Platz. */
 const ACT_SLOT={body:'body',run:'body',lang:'growth',read:'growth',deep:'growth',code:'growth',rel:'bonds'};
 function contribution(S,m,extra={}){if(extra.auto)return null;const slot=ACT_SLOT[m.act],action=(S.life?.actions||[]).find(a=>a.missionId===m.id&&!a.off),minutes=extra.arenaMinutes??action?.minutes;
  return slot&&Number.isFinite(minutes)&&minutes>=({body:20,growth:20,bonds:10,mind:10}[slot])?slot:null;}
 G.ArenaCore={seasonStats,hall,forecast,scenario,pairings,duelOf,duelRecord,scout,catchUp,liveNews,FORMATIONS,BONUS_CAP,FORMATION_PTS,COMBO_PTS,MOMENTUM_PTS,MOMENTUM_RUN,scoreV3,formationOf,switchNeed,SLOTS,DEFAULT_TARGETS,ORACLE_FACTOR,BOUNTY,ACT_SLOT,contribution,phase,validTargets,targetsOf,oracle,bounty,weekly,gains,activity,finale,awards,season,invitation,addDays};
})(typeof window==='undefined'?globalThis:window);
