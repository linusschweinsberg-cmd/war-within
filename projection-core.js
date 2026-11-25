/* THE WAR WITHIN – Decision Impact Engine (Phase 1: Projection Engine)
   „Mach die langfristigen Folgen heutiger Entscheidungen heute sichtbar.“
   Deterministisch, ohne Netz, ohne Uhrzeit oder Zufall: alles aus S.life (Ziele, Messwerte, Handlungen, Log) und S.rest.
   Drei Zieltypen: Finanzen (Rate/Monat aus goal.proj), Fitness (Einheiten), Lernen (Zeit, Meilensteine).
   Regeln: nur berechnen, was aus eingetragenen Daten folgt; Unsicheres wird ausdrücklich als nicht berechenbar markiert.
   Ruhe, Krankheit und Urlaub (S.rest, Debrief recover) zählen nicht als Fehler. Zinsen nur mit sichtbarer Annahme, Standard 0 %. */
(function(){
const MONTH=30.44,HORIZONS=[[7,'7 Tage'],[30,'30 Tage'],[90,'90 Tage'],[182,'6 Monate'],[365,'1 Jahr'],[1826,'5 Jahre']];
const num=v=>typeof v==='number'&&isFinite(v);
const LCx=()=>(typeof window!=='undefined'&&window.LC)||globalThis.LC;
const goalOf=(L,gid)=>(L.goals||[]).find(g=>g.id===gid)||null;
const measOf=(L,gid)=>(L.meas||[]).filter(m=>m.goalId===gid&&num(m.v)).sort((a,b)=>a.d-b.d||a.t-b.t);
const actsOf=(L,gid)=>(L.actions||[]).filter(a=>a.goalId===gid&&!a.off);
function typeOf(g){if(!g||!g.metric)return null;
 if(g.area==='wealth'&&g.metric.unit==='€'&&g.metric.dir!=='down')return'finance';
 if(g.area==='health')return'fitness';if(g.area==='growth')return'learning';return null}
/* Entschuldigte Tage (Lebens-Tag-Skala): bewusste Pausen der Saison und Debriefs mit Ruhe/Krankheit. */
function excusedDays(S){const L=S.life||{},off=(L.d||0)-(S.day||0),out=new Set();(S.rest||[]).forEach(d=>out.add(d+off));(L.daily||[]).forEach(e=>{if(e.recover)out.add(e.d)});return out}
/* Prozess je Woche: geplant (minus entschuldigte Tage, je Tag höchstens eine Einheit), erledigt. Nur abgeschlossene Wochen bewerten Konstanz. */
function processWeeks(S,g){const lc=LCx(),L=S.life||{},cur=lc.curWk(L),acts=actsOf(L,g.id),ex=excusedDays(S),out=[];
 for(let wk=Math.max(0,g.startWk||0);wk<=cur;wk++){let planned=0,done=0;acts.forEach(a=>{planned+=lc.plannedAt(a,wk)||0;done+=lc.doneIn(L,a.id,wk)});
  let excused=0;ex.forEach(d=>{if(lc.wkOf(d,L)===wk)excused++});const adj=Math.max(0,planned-excused);out.push({wk,planned,excused,plannedAdj:adj,done,complete:wk<cur,met:done>=adj})}
 return out}
function perWeekPlan(S,g){const lc=LCx(),L=S.life||{},wk=lc.curWk(L);return actsOf(L,g.id).reduce((a,x)=>a+(lc.plannedAt(x,wk)||0),0)}
/* Tatsächliches Tempo (Einheiten/Woche) aus den letzten bis zu 4 abgeschlossenen Wochen; null ohne abgeschlossene Woche. */
function observedPerWeek(weeks){const w=weeks.filter(x=>x.complete).slice(-4);if(!w.length)return null;return w.reduce((a,x)=>a+x.done,0)/w.length}
/* Messwert-Tempo pro Tag aus Messungen mit mindestens 14 Tagen Abstand (letzte 120 Tage). */
function metricSlope(L,g){const m=measOf(L,g.id);if(m.length<2)return null;const last=m[m.length-1],first=m.find(x=>x.d>=last.d-120)||m[0];const span=last.d-first.d;if(span<14)return null;return(last.v-first.v)/span}

/* Eigene Etappen eines Ziels (goal.steps), sonst null. */
const ownSteps=g=>Array.isArray(g.steps)&&g.steps.filter(num).length?g.steps.filter(num):null;

/* ───── Phase 2: Ziel zerlegen ─────
   Etappen: runde Zwischenwerte zwischen Start und Ziel (z. B. 50 → 60 → … → 100 kg, 3.000 → 5.000 → 10.000 … €). Höchstens 6, Ziel immer zuletzt.
   Ohne Startwert keine Etappen. Termine nur bei Finanzen mit Rate (siehe finance), nie bei Körperzielen. */
function niceStep(x){const e=Math.pow(10,Math.floor(Math.log10(x))),f=x/e;return(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*e}
function suggestSteps(start,target,max=6){if(!num(start)||!num(target)||start===target)return[];const up=target>start,range=Math.abs(target-start),ints=Number.isInteger(start)&&Number.isInteger(target),fix=s=>ints?Math.max(1,Math.ceil(s)):s;let step=fix(niceStep(range/5)),out;
 for(let k=0;k<8;k++){out=[];let v=up?Math.floor(start/step)*step+step:Math.ceil(start/step)*step-step;while(up?v<target-1e-9:v>target+1e-9){out.push(+v.toFixed(6));v+=up?step:-step}out.push(target);if(out.length<=max)break;step=fix(niceStep(step*1.5))}
 return out}
/* Handlungen an die verfügbare Zeit pro Woche anpassen. Nur Vorschlag; der Nutzer kann alles ändern. */
function fitActions(actions,capacity){const acts=(actions||[]).map(a=>({...a})),load=()=>acts.reduce((s,a)=>s+(a.perWeek||0)*(a.minutes||0),0),before=load();
 if(!num(capacity)||capacity<=0)return{actions:acts,changed:false,load:before,before,over:false};let changed=false;
 while(load()>capacity){const a=acts.filter(x=>(x.perWeek||0)>1&&x.minutes).sort((x,y)=>y.perWeek*y.minutes-x.perWeek*x.minutes)[0];if(!a)break;a.perWeek--;changed=true}
 return{actions:acts,changed,load:load(),before,over:load()>capacity}}
/* Adaptive Planung: vier Fälle, jeweils mit nachvollziehbarem Vorschlag statt „mehr Disziplin“. Ändert nichts selbst. */
function adapt(S,gid){const L=S.life||{},g=goalOf(L,gid);if(!g||g.status!=='active')return[];const lc=LCx(),t=typeOf(g),out=[],wks=processWeeks(S,g),done3=wks.filter(x=>x.complete).slice(-3);
 const acts=actsOf(L,g.id),plan=perWeekPlan(S,g),wk=lc.curWk(L),pl=done3.reduce((a,x)=>a+x.plannedAdj,0),dn=done3.reduce((a,x)=>a+Math.min(x.done,x.plannedAdj),0),rate=pl?dn/pl:null;
 /* (b) Konstanz nicht erreicht: Plan an das echte Tempo anpassen. */
 if(done3.length>=2&&rate!=null&&rate<.6&&plan>1){const obs=Math.max(1,Math.ceil(done3.reduce((a,x)=>a+x.done,0)/done3.length));const a=acts.slice().sort((x,y)=>(lc.plannedAt(y,wk)||0)-(lc.plannedAt(x,wk)||0))[0];const now=a?lc.plannedAt(a,wk)||0:0,to=Math.max(1,Math.min(now-1,now-(plan-obs)));
  if(a&&to<now)out.push({code:'consistency',title:'Der Plan ist gerade zu voll',text:'In den letzten '+done3.length+' Wochen hast du '+Math.round(rate*100)+' % des Plans geschafft. Ein Plan, den du hältst, bringt mehr als einer, den du verfehlst.',change:{type:'perWeek',aid:a.id,from:now,to},label:'„'+a.title+'“: '+to+' statt '+now+' pro Woche'})}
 /* (a) Plan gehalten, Ergebnis bleibt aus: Methode prüfen, nicht mehr Druck. */
 const tr=lc.trend(L,g,wk,3),kept=done3.length>=3&&rate!=null&&rate>=.8;
 if(kept&&(tr.state==='flat'||tr.state==='worse'))out.push({code:'noeffect',title:'Du hältst den Plan, das Ergebnis bewegt sich kaum',text:'Die Umsetzung stimmt. Dann liegt es eher an der Methode als an dir.'+(g.method?' Bisheriger Ansatz: '+g.method+'.':''),change:{type:'method'},label:'Im Wochenrückblick ein Experiment mit anderer Methode starten'});
 if(kept&&tr.state==='none'&&t!=='finance')out.push({code:'measure',title:'Ob es wirkt, zeigt erst ein Messwert',text:'Du setzt den Plan um. Trag einen aktuellen Wert ein, dann lässt sich die Wirkung prüfen.',change:{type:'measure'},label:'Messwert eintragen'});
 /* (c) Ziel oder Deadline unrealistisch. */
 if(t==='finance'){const p=finance(S,g);if(p.complete&&p.unrealistic){const end=(g.startWk||0)*7+(g.weeks||0)*7-(L.d||0),months=Math.max(1,Math.round(end/MONTH)),need=Math.ceil((p.target-p.now)/months/10)*10,elapsed=Math.max(0,wk-(g.startWk||0));
  out.push({code:'unrealistic',title:'Ziel und Zeitraum passen nicht zusammen',text:p.months==null?'Mit der aktuellen Rate wird das Ziel nicht erreicht.':'Mit '+p.rate+' € pro Monat brauchst du '+p.months+' Monate, geplant sind noch '+months+'.',
   change:p.months==null?{type:'rate',to:need}:{type:'weeks',to:Math.ceil(p.months*MONTH/7)+elapsed},label:p.months==null?'Rate auf '+need+' € pro Monat erhöhen':'Zeitraum auf '+p.months+' Monate ab heute verlängern',alt:p.months==null?null:{type:'rate',to:need},altLabel:p.months==null?null:'Rate auf '+need+' € pro Monat erhöhen'})}}
 else{const now=lc.goalNow(L,g),tg=g.metric.target,slope=metricSlope(L,g),left=(g.startWk||0)+(g.weeks||0)-wk;
  if(num(now)&&num(tg)&&slope!=null&&left>0){const rem=g.metric.dir==='down'?now-tg:tg-now,good=g.metric.dir==='down'?-slope:slope,ext=Math.max(4,Math.round(left));
   if(rem>0&&(good<=0||rem/good/7>left*1.5))out.push({code:'unrealistic',title:'Der Zeitraum ist knapp bemessen',text:'Beim bisherigen Tempo reicht der Zeitraum voraussichtlich nicht. '+(t==='fitness'?'Körperliche Fortschritte lassen sich nicht genau planen; eine Etappe als Zwischenziel ist oft ehrlicher.':'Mehr Zeit oder eine Etappe als Zwischenziel nehmen Druck heraus.'),change:{type:'weeks',to:(g.weeks||0)+ext},label:'Zeitraum um '+ext+' Wochen verlängern'})}}
 /* (d) Ressourcen haben sich geändert: Plan braucht mehr Zeit, als du angegeben hast. */
 if(num(g.capacity)&&g.capacity>0){const cur=acts.map(a=>({id:a.id,title:a.title,perWeek:lc.plannedAt(a,wk)||0,minutes:a.minutes})),load=cur.reduce((s,a)=>s+a.perWeek*(a.minutes||0),0);
  if(load>g.capacity){const f=fitActions(cur,g.capacity),ch=f.actions.find((a,i)=>a.perWeek!==cur[i].perWeek);
   if(ch){const from=cur.find(a=>a.id===ch.id).perWeek;out.push({code:'resources',title:'Der Plan braucht mehr Zeit, als du hast',text:'Geplant sind '+load+' Min. pro Woche, verfügbar sind '+g.capacity+' Min.',change:{type:'perWeek',aid:ch.id,from,to:ch.perWeek},label:'„'+ch.title+'“: '+ch.perWeek+' statt '+from+' pro Woche'})}}}
 return out}
/* Ziel-Rahmen setzen (optionale Felder): Zeit pro Woche in Minuten, Einschränkungen (kurzer Text, bleibt lokal), eigene Etappen. */
function setFrame(S,gid,f){const g=goalOf(S.life||{},gid);if(!g)return null;
 if('capacity' in f){const v=+f.capacity;if(f.capacity===''||f.capacity==null||!num(v)||v<=0)delete g.capacity;else g.capacity=Math.round(v)}
 if('limits' in f){const t=String(f.limits||'').trim().slice(0,120);if(t)g.limits=t;else delete g.limits}
 if('steps' in f){const s=(f.steps||[]).map(Number).filter(num);if(s.length)g.steps=[...new Set(s)].slice(0,8);else delete g.steps}
 return g}

/* ───── Finanzen ───── */
function financeRun(bal,rate,months,interest){const i=(interest||0)/100/12;const pts=[bal];for(let k=1;k<=months;k++){bal=bal*(1+i)+rate;pts.push(bal)}return pts}
function monthsTo(start,target,rate,interest,cap=600){if(start>=target)return 0;const i=(interest||0)/100/12;let b=start;for(let k=1;k<=cap;k++){b=b*(1+i)+rate;if(b>=target-1e-9)return k}return null}
function finance(S,g,o={}){const L=S.life||{},m=measOf(L,g.id),p=g.proj||{},missing=[];
 const now=m.length?m[m.length-1].v:num(g.metric.start)?g.metric.start:null,target=num(g.metric.target)?g.metric.target:null,rate=num(o.rate)?o.rate:num(p.rate)?p.rate:null,interest=num(o.interest)?o.interest:num(p.interest)?p.interest:0;
 if(now==null)missing.push('stand');if(target==null)missing.push('ziel');if(rate==null)missing.push('rate');
 const base={type:'finance',goal:g.id,now,target,rate,interest,assumptions:['Rate '+(rate==null?'fehlt':rate+' € pro Monat'),'Zinsen '+String(interest).replace('.',',')+' % pro Jahr'+(interest?' (deine Annahme)':' (Standard: ohne Zinsen)')],missing};
 if(missing.length)return{...base,complete:false};
 const months=monthsTo(now,target,rate,interest),deadlineM=g.weeks?Math.max(0,Math.round(((g.startWk||0)*7+g.weeks*7-(L.d||0))/MONTH)):null;
 const at=k=>financeRun(now,rate,k,interest)[k];
 const ms=(ownSteps(g)||[.25,.5,.75,1].map(f=>Math.round(target*f))).map(v=>({f:v/target,value:v,months:monthsTo(now,v,rate,interest)}));
 const alt=[...new Set([Math.round(rate*.5/10)*10,Math.round(rate*1.5/10)*10,rate+50].filter(r=>r>0&&r!==rate))].sort((a,b)=>a-b).map(r=>({rate:r,months:monthsTo(now,target,r,interest),at12:at12(now,r,interest)}));
 function at12(b,r,i){return financeRun(b,r,12,i)[12]}
 /* Eine ausgelassene Rate: Monat 1 ohne Einzahlung, danach wie geplant. */
 const skip=(()=>{const i=(interest||0)/100/12;let b=now;const run=[b];for(let k=1;k<=12;k++){b=b*(1+i)+(k===1?0:rate);run.push(b)}const mm=monthsTo(now*(1+i),target,rate,interest);return{diff12:run[12]-at(12),months:mm==null?null:mm+1,delay:mm==null||months==null?null:mm+1-months}})();
 const obs=metricSlope(L,g),obsRate=obs==null?null:obs*MONTH;
 const drift=obsRate!=null&&obsRate<rate?{rate:Math.max(0,obsRate),src:'observed'}:{rate:rate/2,src:'half'};
 return{...base,complete:true,months,deadlineM,unrealistic:deadlineM!=null&&(months==null||months>deadlineM),at3:at(3),at6:at(6),at12:at(12),milestones:ms,alt,skip,drift,
  series:o.horizons!==false?HORIZONS.map(([d,l])=>{const k=Math.round(d/MONTH);return{d,l,follow:financeRun(now,rate,Math.max(0,k),interest)[Math.max(0,k)]+(k===0?rate*d/MONTH:0),drift:financeRun(now,drift.rate,Math.max(0,k),interest)[Math.max(0,k)]+(k===0?drift.rate*d/MONTH:0)}}):[],
  unit:'€',scenarioDiff12:at(12)-financeRun(now,drift.rate,12,interest)[12]}}

/* ───── Fitness ───── */
function fitness(S,g){const L=S.life||{},weeks=processWeeks(S,g),plan=perWeekPlan(S,g),missing=[];if(!actsOf(L,g.id).length)missing.push('handlung');
 const doneAll=weeks.reduce((a,x)=>a+x.done,0),plannedAll=weeks.filter(x=>x.complete).reduce((a,x)=>a+x.plannedAdj,0),doneComplete=weeks.filter(x=>x.complete).reduce((a,x)=>a+x.done,0);
 const full=weeks.filter(x=>x.complete),consistency=full.length?full.filter(x=>x.met).length/full.length:null,obs=observedPerWeek(weeks);
 const m=measOf(L,g.id),start=num(g.metric.start)?g.metric.start:m.length?m[0].v:null,tgt=num(g.metric.target)?g.metric.target:null,lc=LCx();
 const milestones=start!=null&&tgt!=null&&tgt!==start?(ownSteps(g)||[.25,.5,.75,1].map(f=>start+(tgt-start)*f)).map(v=>{const f=(v-start)/(tgt-start),hit=m.find(x=>g.metric.dir==='down'?x.v<=v:x.v>=v);return{f,value:v,reached:!!hit,d:hit?hit.d:null}}):[];
 const drift=obs!=null&&obs<plan?{perWeek:obs,src:'observed'}:{perWeek:plan/2,src:'half'};
 const cur=weeks[weeks.length-1]||{planned:0,done:0,plannedAdj:0};
 return{type:'fitness',goal:g.id,complete:!missing.length,missing,plan,done:doneAll,plannedPast:plannedAll,doneInPast:doneComplete,deviation:plannedAll?doneComplete-plannedAll:null,consistency,observed:obs,week:{done:cur.done,planned:cur.plannedAdj,excused:cur.excused},
  milestones,latest:m.length?m[m.length-1].v:null,uncertain:['Künftige Leistung (z. B. Zeit, Kraft) lässt sich nicht verlässlich vorhersagen und wird nicht berechnet.'],
  assumptions:['Plan: '+plan+' Einheiten pro Woche','Ruhe- und Krankheitstage senken den Wochenplan, sie zählen nicht als verpasst'],drift,unit:'Einheiten',
  series:HORIZONS.map(([d,l])=>({d,l,follow:doneAll+plan*d/7,drift:doneAll+drift.perWeek*d/7})),scenarioDiff12:(plan-drift.perWeek)*52}}

/* ───── Lernen ───── */
function learning(S,g){const L=S.life||{},lc=LCx(),acts=actsOf(L,g.id),weeks=processWeeks(S,g),plan=perWeekPlan(S,g),missing=[];if(!acts.length)missing.push('handlung');
 const min=Object.fromEntries(acts.map(a=>[a.id,a.minutes||0])),logs=(L.log||[]).filter(x=>x.aid in min),hours=logs.reduce((a,x)=>a+min[x.aid],0)/60,sessions=logs.length;
 const minPer=acts.length?acts.reduce((a,x)=>a+(x.minutes||0)*(lc.plannedAt(x,lc.curWk(L))||0),0)/Math.max(1,plan):0;
 const m=measOf(L,g.id),now=m.length?m[m.length-1].v:num(g.metric.start)?g.metric.start:null,tgt=num(g.metric.target)?g.metric.target:null,slope=metricSlope(L,g);
 const remaining=now!=null&&tgt!=null?(g.metric.dir==='down'?now-tgt:tgt-now):null;
 const restWeeks=remaining!=null&&remaining<=0?0:remaining!=null&&slope!=null&&(g.metric.dir==='down'?slope<0:slope>0)?Math.ceil(Math.abs(remaining/slope)/7):null;
 /* Fortschritt je Einheit nur, wenn Messwerte und Einheiten im selben Zeitraum vorliegen. */
 const span=m.length>=2?[m[0].d,m[m.length-1].d]:null,inSpan=span?logs.filter(x=>x.d>span[0]&&x.d<=span[1]).length:0,perSession=span&&inSpan>0?(m[m.length-1].v-m[0].v)/inSpan:null;
 const freq=[...new Set([Math.max(1,plan-1),plan,plan+1,plan+2])].filter(f=>f>0).map(f=>({perWeek:f,hoursPerMonth:f*minPer/60*MONTH/7,weeks:remaining!=null&&remaining>0&&perSession&&Math.sign(perSession)===(g.metric.dir==='down'?-1:1)?Math.ceil(Math.abs(remaining/perSession)/f):remaining!=null&&remaining<=0?0:null}));
 const obs=observedPerWeek(weeks),drift=obs!=null&&obs<plan?{perWeek:obs,src:'observed'}:{perWeek:plan/2,src:'half'};
 /* Ohne Dauer pro Einheit keine Stunden: dann zählt die Ansicht Einheiten statt erfundener Zeit. */
 const timed=minPer>0,per=timed?minPer/60:1;
 return{type:'learning',timed,goal:g.id,complete:!missing.length,missing,plan,hours,sessions,minPerSession:minPer,now,target:tgt,remaining,slope,restWeeks,perSession,freq,drift,
  milestones:m.map(x=>({d:x.d,v:x.v})),assumptions:['Plan: '+plan+' Einheiten pro Woche'+(timed?' à '+Math.round(minPer)+' Min.':' (Dauer pro Einheit nicht angegeben)'),perSession!=null?'Gleicher Fortschritt pro Einheit wie bisher':'Fortschritt pro Einheit noch unbekannt (mind. 2 Messungen nötig)'],unit:timed?'Stunden':'Einheiten',
  series:HORIZONS.map(([d,l])=>{const b=timed?hours:sessions;return{d,l,follow:b+plan*per*d/7,drift:b+drift.perWeek*per*d/7}}),scenarioDiff12:(plan-drift.perWeek)*per*52}}

function project(S,gid,o={}){const L=S&&S.life;if(!L)return null;const g=goalOf(L,gid);if(!g)return null;const t=typeOf(g);
 if(t==='finance')return finance(S,g,o);if(t==='fitness')return fitness(S,g);if(t==='learning')return learning(S,g);return{type:null,goal:gid,complete:false,missing:['typ']}}
/* Kurzfristig: was heute die Planerfüllung dieser Woche ändert. Erledigt vs. ausgelassen, ohne Schuld. */
function today(S,gid){const L=S.life||{},g=goalOf(L,gid);if(!g)return null;const weeks=processWeeks(S,g),cur=weeks[weeks.length-1];if(!cur||!cur.plannedAdj)return{planned:cur?cur.plannedAdj:0,done:cur?cur.done:0,ifDone:null,ifSkip:null};
 const lc=LCx(),d=L.d||0,doneToday=(L.log||[]).some(x=>x.d===d&&actsOf(L,gid).some(a=>a.id===x.aid)),left=(()=>{const w=lc.wkOf(d,L);let k=1;while(k<7&&lc.wkOf(d+k,L)===w)k++;return k})();
 return{planned:cur.plannedAdj,done:cur.done,doneToday,ifDone:Math.min(1,(cur.done+(doneToday?0:1))/cur.plannedAdj),ifSkip:Math.min(1,cur.done/cur.plannedAdj),stillPossible:cur.done+Math.max(0,left-1)>=cur.plannedAdj,daysLeft:left}}
/* Plan eines Finanzziels setzen (optionales Feld, keine Formatänderung). */
function setPlan(S,gid,p){const g=goalOf(S.life||{},gid);if(!g)return null;const empty=v=>v==null||String(v).trim()==='',rate=!empty(p.rate)&&num(+p.rate)&&+p.rate>=0?+p.rate:null,interest=num(+p.interest)&&+p.interest>=0&&+p.interest<=20?+p.interest:0;
 if(rate==null){delete g.proj;return null}g.proj={rate,interest};return g.proj}
const api={HORIZONS,MONTH,typeOf,project,suggestSteps,fitActions,adapt,setFrame,finance,fitness,learning,today,setPlan,monthsTo,excusedDays,processWeeks};
if(typeof window!=='undefined')window.PJ=api;else globalThis.PJ=api;
})();
