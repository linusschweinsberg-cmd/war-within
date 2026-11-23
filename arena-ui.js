/* Multiplayer UI. No simulated acceptance, scores, or opponents. */
(function(G){
 'use strict';
 const {useState,useEffect,useRef}=G.React,html=G.htm.bind(G.React.createElement),A=G.ArenaCore;
 const fmt=x=>(x/10).toLocaleString('de-DE',{maximumFractionDigits:1});
 const date=x=>new Date(x+'T12:00:00Z').toLocaleDateString('de-DE',{day:'numeric',month:'long',timeZone:'UTC'});
 const reactions=[['respect','Respekt'],['fire','Stark'],['rematch','Revanche']];
 /* ── Arena-Gestaltung: Amphitheater, Podest, Schicksal der Woche ── */
 const Ic=(n,s=18,sw)=>G.Icon?html`<${G.Icon} n=${n} s=${s} sw=${sw}/>`:null;
 const slotOf=id=>A.SLOTS.find(s=>s.id===id)||{name:id,icon:'target'};
 /* Amphitheater: zwei Bogenreihen über einem Sandstreifen, nur Linien in Bronze und Stein. */
 function Colosseum({title,sub,kicker}){const arches=(y,h,n,w)=>Array.from({length:n},(_,i)=>{const x=10+i*(320/n)+((320/n)-w)/2;return html`<path key=${y+'-'+i} d=${`M${x} ${y+h} V${y+w/2} A${w/2} ${w/2} 0 0 1 ${x+w} ${y+w/2} V${y+h}`} fill="none" stroke="var(--bronze)" strokeWidth="1.2" opacity=".55"/>`});
  return html`<div className="relative mt-3 overflow-hidden" style=${{borderRadius:20,border:'1px solid var(--line)',background:'var(--hero)'}}>
  <div className="px-4 pt-3"><div className="lbl" style=${{color:'var(--bronze)'}}>${kicker}</div><h1 className="disp text-[34px] leading-none mt-1 break-words">${title}</h1>${sub&&html`<div className="text-[12.5px] mute mt-1.5">${sub}</div>`}</div>
  <svg viewBox="0 0 340 74" width="100%" aria-hidden="true" style=${{display:'block',marginTop:6}}>
   <path d="M6 14 Q170 -10 334 14" fill="none" stroke="var(--bronze)" strokeWidth="1.4" opacity=".7"/>
   <line x1="8" y1="14" x2="332" y2="14" stroke="var(--line)" strokeWidth="1"/>${arches(16,20,12,15)}
   <line x1="8" y1="36" x2="332" y2="36" stroke="var(--line)" strokeWidth="1"/>${arches(38,18,14,12)}
   <rect x="0" y="58" width="340" height="16" fill="color-mix(in srgb,var(--gold) 16%,transparent)"/>
   <line x1="0" y1="58" x2="340" y2="58" stroke="var(--bronze)" strokeWidth="1" opacity=".6"/>
  </svg></div>`}
 /* Siegerpodest der laufenden Woche: Platz 2 · 1 · 3, Lorbeer für die Spitze. */
 function Podium({rows,me}){const top=rows.slice(0,3),order=[top[1],top[0],top[2]].filter(Boolean),h={1:84,2:62,3:48};
  return html`<div className="grid gap-2 mt-3 items-end" style=${{gridTemplateColumns:'repeat('+order.length+',minmax(0,1fr))'}}>${order.map(r=>{const mine=r.user_id===me,col=mine?'var(--acc2)':'var(--nem)',bonus=r.oracle+r.bounty;
   return html`<div key=${r.user_id} className="flex flex-col items-center text-center min-w-0">
   <span style=${{color:r.rank===1&&r.score>0?'var(--gold)':'transparent'}} aria-hidden="true">${Ic('laurel',22,1.6)}</span>
   <span className="flex items-center justify-center rounded-full disp text-[18px]" style=${{width:46,height:46,border:'2px solid '+col,color:col,background:'var(--card2)'}}>${r.display_name.slice(0,1).toUpperCase()}</span>
   <b className="text-[12.5px] mt-1 truncate max-w-full">${r.display_name}${mine?' · du':''}</b>
   <span className="num text-[18px] font-bold" style=${{color:mine?'var(--acc2)':'var(--ink)'}}>${fmt(r.score)}</span>
   ${bonus>0?html`<span className="text-[10.5px]" style=${{color:'var(--gold)'}}>inkl. +${fmt(bonus)} Bonus</span>`:html`<span className="text-[10.5px]"> </span>`}
   <div className="w-full mt-1 flex items-start justify-center pt-1 disp text-[20px]" style=${{height:h[r.rank]||40,borderRadius:'10px 10px 0 0',background:'color-mix(in srgb,var(--bronze) '+(r.rank===1?28:16)+'%,var(--card))',border:'1px solid var(--line)',borderBottom:'none',color:'var(--bronze)'}}>${r.rank}</div></div>`})}</div>`}
 /* Deine Meldungen heute als Kacheln: Fortschritt, Orakel-Markierung, ein Tipp meldet oder nimmt zurück. */
 function SlotTiles({snapshot,week,me,busy,onReport,gains}){const o=A.oracle(snapshot,snapshot.today);
  return html`<div className="grid grid-cols-2 gap-2 mt-3">${A.SLOTS.map(s=>{const today=snapshot.completions.some(e=>e.user_id===snapshot.user_id&&e.week===week&&e.slot===s.id&&e.day===snapshot.today),n=me.counts[s.id],t=me.targets[s.id],full=n>=t,lucky=o===s.id,g=(gains||[]).find(x=>x.slot===s.id);
   return html`<button key=${s.id} type="button" disabled=${busy||full&&!today} onClick=${()=>onReport(s.id,!today)} aria-pressed=${today} aria-label=${(today?'Heutigen Eintrag zurücknehmen: ':'Erfüllung melden: ')+s.name} className="text-left p-3 border-0 relative" style=${{minHeight:96,borderRadius:16,color:'var(--ink)',background:today?'color-mix(in srgb,var(--acc) 18%,var(--card))':'var(--card)',boxShadow:'0 0 0 1px '+(today?'color-mix(in srgb,var(--acc) 45%,transparent)':lucky?'color-mix(in srgb,var(--gold) 45%,transparent)':'var(--line)')+' inset',opacity:full&&!today?.6:1}}>
   ${lucky&&html`<span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded" style=${{color:'var(--gold)',background:'color-mix(in srgb,var(--gold) 14%,transparent)'}}>×1,5</span>`}
   <span className="flex items-center gap-2" style=${{color:today?'var(--acc2)':'var(--mute)'}}>${Ic(today?'check':s.icon,18,today?2.6:1.8)}<b className="text-[13.5px]" style=${{color:'var(--ink)'}}>${s.name}</b></span>
   <span className="flex gap-1 mt-3">${Array.from({length:t},(_,i)=>html`<span key=${i} className="flex-1 rounded-full" style=${{height:5,background:i<n?'var(--acc)':'var(--ghost)',boxShadow:i<n?'none':'0 0 0 1px var(--line) inset'}}/>`)}</span>
   <span className="block text-[11.5px] mute mt-1.5">${today?'Heute gemeldet':full?'Soll erfüllt':n+' von '+t+' diese Woche'}${g&&g.points>0?html` · <b style=${{color:g.bounty?'var(--gold)':'var(--acc2)'}}>+${fmt(g.points)}</b>`:''}</span></button>`})}</div>`}
 /* Nächster Zug: der Bereich, der heute am meisten bringt, mit Wirkung auf die Tabelle. Ein Tipp meldet ihn. */
 function NextMove({gains,busy,onReport}){const g=gains[0];if(!g||g.points<=0)return html`<p className="text-[12.5px] mute mt-3 text-center">Für heute ist alles gemeldet, was zählt. Morgen geht es weiter.</p>`;const s=slotOf(g.slot);
  const why=[g.oracle&&'Orakel ×1,5',g.bounty&&'holt die Wochenprämie'].filter(Boolean).join(' · ');
  const effect=g.passes.length?'Damit ziehst du an '+g.passes.join(' und ')+' vorbei.':g.rank===1?'Damit bleibst du vorn.':'Damit Platz '+g.rank+'.';
  return html`<div className="mt-3 p-3 flex items-center gap-3" style=${{borderRadius:14,background:'color-mix(in srgb,var(--acc) 10%,var(--card2))',boxShadow:'0 0 0 1px color-mix(in srgb,var(--acc) 35%,transparent) inset'}}>
   <span className="shrink-0" style=${{color:'var(--acc2)'}}>${Ic(s.icon,22)}</span>
   <span className="flex-1 min-w-0"><span className="block lbl" style=${{color:'var(--acc2)'}}>Dein nächster Zug</span><b className="block text-[13.5px] leading-snug">${s.name} · +${fmt(g.points)} Arenapunkte</b><span className="block text-[11.5px] mute leading-snug">${s.action}${why?' · '+why:''}. ${effect}</span></span>
   <button type="button" className="btn shrink-0 px-3 py-2 text-[12.5px]" disabled=${busy} aria-label=${'Erfüllung melden: '+s.name} onClick=${()=>onReport(g.slot,true)}>Melden</button></div>`}
 /* Wochenverlauf: eine Zeile je Mitglied, sieben Tage. Füllung = Anzahl gemeldeter Bereiche an diesem Tag. */
 const WD=['Mo','Di','Mi','Do','Fr','Sa','So'];
 function WeekGrid({snapshot,week}){const rows=A.activity(snapshot,week);if(!rows.length)return null;
  const cell=d=>{const a=d.slots/4;return{height:22,borderRadius:6,background:d.future?'transparent':d.slots?'color-mix(in srgb,var(--acc) '+Math.round(30+a*70)+'%,var(--card2))':'var(--ghost)',boxShadow:'0 0 0 '+(d.today?'1.5px var(--acc2)':'1px var(--line)')+' inset',opacity:d.future?.45:1}};
  return html`<section className="card p-4 mt-3" aria-label=${'Wochenverlauf Woche '+week}><div className="flex items-baseline justify-between gap-2"><h2 className="disp text-[22px]">Wochenverlauf</h2><span className="lbl">Woche ${week}</span></div>
   <div className="grid gap-1.5 mt-3 items-center" style=${{gridTemplateColumns:'minmax(0,4.5rem) repeat(7,minmax(0,1fr))'}}>
    <span/>${WD.map((d,i)=>html`<span key=${d} className="text-[10.5px] text-center mute" style=${{color:rows[0].days[i].today?'var(--acc2)':undefined}}>${d}</span>`)}
    ${rows.map(r=>html`<${G.React.Fragment} key=${r.user_id}><b className="text-[12px] truncate">${r.user_id===snapshot.user_id?'Du':r.display_name}</b>${r.days.map(d=>html`<span key=${d.day} style=${cell(d)} title=${date(d.day)+': '+d.slots+' von 4 Bereichen'} aria-label=${(r.user_id===snapshot.user_id?'Du':r.display_name)+' · '+date(d.day)+': '+(d.future?'noch offen':d.slots+' von 4 Bereichen')}/>`)}<//>`)}
   </div><p className="text-[11px] mute mt-2">Je kräftiger, desto mehr Bereiche an diesem Tag gemeldet. Ruhetage sind erlaubt.</p></section>`}
 /* Sonntagsfinale: letzter Tag der Woche – Abstand nach oben und was heute noch geht. */
 function Finale({snapshot}){const f=A.finale(snapshot);if(!f)return null;const fx=x=>fmt(x),areas=f.open.length===4?'allen vier Bereichen':f.open.map(x=>slotOf(x).name).join(', ');
  const line=!f.open.length?'Alles gemeldet, was zählt. Jetzt entscheidet der Rest der Arena.':f.above?(f.potential>f.gap?'Mit '+areas+' holst du bis zu +'+fx(f.potential)+' – genug, um an '+f.above.display_name+' vorbeizuziehen.':f.potential===f.gap?'Mit allen offenen Bereichen ziehst du mit '+f.above.display_name+' gleich (+'+fx(f.potential)+').':'Bis zu +'+fx(f.potential)+' sind heute drin. '+f.above.display_name+' liegt '+fx(f.gap)+' vorn – jeder Punkt zählt für die Saison.'):'Du führst. Mit '+areas+' baust du den Vorsprung um bis zu +'+fx(f.potential)+' aus.';
  return html`<section aria-label="Wochenfinale" className="p-4 mt-3" style=${{borderRadius:16,background:'color-mix(in srgb,var(--gold) 12%,var(--card))',border:'1px solid color-mix(in srgb,var(--gold) 45%,transparent)'}}>
   <div className="flex items-center gap-2" style=${{color:'var(--gold)'}}>${Ic('crown',18)}<span className="lbl" style=${{color:'var(--gold)'}}>Finale · heute bis 24 Uhr</span></div>
   <p className="disp text-[22px] mt-1 leading-tight">Letzter Tag von Woche ${f.week}</p>
   <p className="text-[13px] mt-1">Du stehst auf Platz ${f.rank}${f.above?', '+fx(f.gap)+' hinter '+f.above.display_name:''}.</p>
   <p className="text-[12.5px] mute mt-1">${line}</p></section>`}
 /* Drei Reiter statt einer langen Seite: Heute (handeln), Tabelle (Stand), Bericht (Gruppe). Flach mit Unterstrich. */
 function Tabs({view,setView,running}){const items=[running&&['today','Heute'],['table','Tabelle'],['log','Bericht']].filter(Boolean);
  return html`<div role="tablist" aria-label="Arena-Bereiche" className="flex mt-3" style=${{borderBottom:'1px solid var(--line)'}}>${items.map(([id,l])=>{const on=view===id;return html`<button key=${id} type="button" role="tab" aria-selected=${on} onClick=${()=>setView(id)} className="flex-1 py-2.5 text-[13px] font-semibold border-0" style=${{background:'transparent',color:on?'var(--ink)':'var(--mute)',boxShadow:on?'inset 0 -2px 0 var(--acc)':'none'}}>${l}</button>`})}</div>`}
 /* Neu gewertete Woche: eine Zeile mit Sieg und eigenem Platz; die ganze Zeremonie liegt unter Tabelle. */
 function FreshBanner({snapshot,week,onOpen,onDismiss}){const rows=A.weekly(snapshot,week),mine=rows.find(r=>r.user_id===snapshot.user_id),win=rows.filter(r=>r.rank===1&&r.score>0).map(r=>r.user_id===snapshot.user_id?'du':r.display_name);
  return html`<div className="mt-3 p-3 flex items-center gap-3" style=${{borderRadius:14,background:'color-mix(in srgb,var(--gold) 12%,var(--card))',boxShadow:'0 0 0 1px color-mix(in srgb,var(--gold) 45%,transparent) inset'}}>
   <span className="shrink-0" style=${{color:'var(--gold)'}}>${Ic('laurel',22,1.6)}</span>
   <span className="flex-1 min-w-0"><b className="block text-[13px]">Woche ${week} gewertet</b><span className="block text-[11.5px] mute">${win.length?'Sieg: '+win.join(' und ')+' · ':''}Du: Platz ${mine?.rank||'–'}</span></span>
   <button type="button" className="chip" onClick=${onOpen}>Ansehen</button><button type="button" className="chip" aria-label="Hinweis ausblenden" onClick=${onDismiss}>✕</button></div>`}
 /* Orakel und Wochenprämie in einer Zeile. */
 function FateRow({snapshot,week,me}){const o=slotOf(A.oracle(snapshot,snapshot.today)),b=A.bounty(snapshot,week),bs=slotOf(b.slot),win=b.winner&&snapshot.members.find(m=>m.user_id===b.winner);
  const pill=(icon,text,sub)=>html`<span className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2" style=${{borderRadius:12,background:'var(--card)',boxShadow:'0 0 0 1px var(--line) inset'}}><span className="shrink-0" style=${{color:'var(--gold)'}}>${Ic(icon,16)}</span><span className="min-w-0"><b className="block text-[12.5px] truncate">${text}</b><span className="block text-[10.5px] mute truncate">${sub}</span></span></span>`;
  return html`<section aria-label="Orakel und Wochenprämie" className="flex gap-2 mt-3">${pill('eye',o.name+' ×1,5','Orakel · heute')}${pill('crown',bs.name+' +5',win?'Prämie · '+(win.user_id===me?'deine':win.display_name):'Prämie · wer zuerst')}</section>`}
 /* Kampfbericht: nach Tagen gruppiert, Herkunft sichtbar, eigene Meldungen ohne Reaktionsknöpfe. */
 function Battle({snapshot,busy,onReact}){const [all,setAll]=useState(false),list=snapshot.completions,shown=all?list.slice(0,60):list.slice(0,6);
  const nameOf=id=>snapshot.members.find(m=>m.user_id===id)?.display_name||'Mitglied',yday=A.addDays(snapshot.today,-1);
  const label=d=>d===snapshot.today?'Heute':d===yday?'Gestern':date(d);
  const days=[...new Set(shown.map(e=>e.day))];
  return html`<div className="card p-4 mt-3"><h2 className="disp text-[24px]">Kampfbericht</h2>${!list.length&&html`<p className="text-[12px] mute mt-2">Noch keine gemeldeten Erfüllungen.</p>`}
   ${days.map(d=>html`<div key=${d} className="mt-3"><h3 className="lbl">${label(d)}</h3>${shown.filter(e=>e.day===d).map(e=>{const mine=e.user_id===snapshot.user_id,rs=snapshot.reactions.filter(r=>r.event_id===e.id);
    return html`<div key=${e.id} className="mt-2 pt-2 border-t ln"><p className="text-[13px]"><b>${mine?'Du':nameOf(e.user_id)}</b> ${mine?'hast':'hat'} ${slotOf(e.slot).name} erfüllt.</p><p className="text-[11px] mute mt-0.5">Woche ${e.week} · ${e.origin==='automatic'?'aus Aufgaben übernommen':'selbst gemeldet'}</p>
     ${mine?(rs.length>0&&html`<p className="text-[11.5px] mt-1" style=${{color:'var(--gold)'}}>${reactions.filter(([id])=>rs.some(r=>r.kind===id)).map(([id,l])=>l+' '+rs.filter(r=>r.kind===id).length).join(' · ')}</p>`)
     :html`<div className="flex flex-wrap gap-1 mt-2">${reactions.map(([id,l])=>html`<button key=${id} type="button" className="chip" disabled=${busy} aria-pressed=${rs.some(r=>r.user_id===snapshot.user_id&&r.kind===id)} aria-label=${l+' für '+nameOf(e.user_id)+' · '+slotOf(e.slot).name+' · '+label(e.day)} onClick=${()=>onReact(e.id,id)}>${l} ${rs.filter(r=>r.kind===id).length||''}</button>`)}</div>`}</div>`})}</div>`)}
   ${list.length>6&&html`<button type="button" className="ghost w-full py-2.5 mt-3 text-[12.5px]" onClick=${()=>setAll(!all)}>${all?'Weniger anzeigen':'Ältere Meldungen anzeigen ('+(Math.min(list.length,60)-6)+')'}</button>`}</div>`}
 function Scoring({snapshot,week}){
  return html`<details className="card p-4 mt-3"><summary className="text-[14px] font-semibold">Wertung nachvollziehen · Woche ${week}</summary>
   <p className="text-[12px] mute mt-2">Je Bereich: Tage ÷ Soll × 25. Orakel-Tage erhalten zusätzlich die Hälfte ihres Tageswerts. Pro Bereich auf eine Nachkommastelle gerundet. Über das Soll hinaus zählt nichts.</p>
   ${A.weekly(snapshot,week).map(r=>html`<details key=${r.user_id} className="mt-3 pt-3 border-t ln"><summary className="text-[13px] font-semibold">${r.display_name} · ${fmt(r.score)} Arenapunkte</summary>
    <div className="overflow-x-auto mt-2"><table className="w-full text-[12px] text-left"><thead><tr><th scope="col">Bereich</th><th scope="col">Tage/Soll</th><th scope="col">Basis</th><th scope="col">Orakel</th></tr></thead><tbody>${r.breakdown.map(b=>html`<tr key=${b.slot}><th scope="row" className="py-2 font-normal">${slotOf(b.slot).name}</th><td>${b.count}/${b.target}</td><td>${fmt(b.base)}</td><td>+${fmt(b.oracle)}</td></tr>`)}</tbody></table></div>
    <p className="text-[12px] mt-2">${fmt(r.base)} Basis + ${fmt(r.oracle)} Orakel + ${fmt(r.bounty)} Wochenprämie = <b>${fmt(r.score)}</b></p>
    <p className="text-[12px] mute mt-1">Platz ${r.rank} · ${r.points} Tabellenpunkte${week>A.phase(snapshot).closed?' · vorläufig':''}. Ohne Erfüllung keine Tabellenpunkte.</p>
   </details>`)}
   <p className="text-[12px] mute mt-3">Wochenprämie: ${slotOf(A.bounty(snapshot,week).slot).name} · +5 für die erste vollständige Erfüllung nach Serverzeit. Gleichstand teilt den Rang; der nächste Rang wird übersprungen.</p>
  </details>`;
 }
 function Ceremony({snapshot,week}){const rows=A.weekly(snapshot,week),a=A.awards(snapshot,week),names=ms=>ms.map(m=>m.display_name).join(' und ');
  return html`<section className="mt-4 pt-3 border-t ln" aria-label=${'Wochenzeremonie Woche '+week}>
   <h3 className="disp text-[22px]">Woche ${week} · Lorbeer & Rückblick</h3>
   ${rows.some(r=>r.score>0)?html`<${Podium} rows=${rows} me=${snapshot.user_id}/><p className="text-[13px] mt-3" style=${{color:'var(--gold)'}}>Wochensieg: ${names(rows.filter(r=>r.rank===1))}</p>`:html`<p className="text-[13px] mute mt-2">Diese Woche gab es keine Meldungen.</p>`}
   ${a.days>0&&html`<p className="text-[13px] mt-2"><b>Konstanz:</b> ${names(a.consistent)} · an ${a.days} von 7 Tagen aktiv.</p>`}
   ${a.comebacks.map(m=>html`<p key=${m.user_id} className="text-[13px] mt-2" style=${{color:'var(--gold)'}}><b>Comeback-Lorbeer:</b> ${m.display_name} · ${date(m.day)}</p>`)}
   <p className="text-[12px] mute mt-2">Comeback: nach mindestens zwei freien Tagen wieder drei Tage in Folge aktiv. Auszeichnungen geben keine Zusatzpunkte.</p>
   <${Scoring} snapshot=${snapshot} week=${week}/>
  </section>`;
 }
 /* Faire Wertung: ein gemeinsames Soll je Bereich für alle; nur der Gründer ändert es, und nur vor dem Start. */
 function GroupTargets({snapshot,editable,busy,onSave}){
  const current=A.targetsOf(snapshot);
  const [targets,setTargets]=useState(()=>({...current}));
  const dirty=A.SLOTS.some(s=>targets[s.id]!==current[s.id]);
  return html`<form className="card p-4 mt-3" onSubmit=${e=>{e.preventDefault();onSave(targets)}}>
   <h2 className="disp text-[23px]">Gemeinsames Soll</h2>
   <p className="text-[12px] mute mt-1">Für alle gleich, jede Woche. Wer gleich viel erfüllt, erhält gleich viele Basispunkte. Orakel und Wochenprämie kommen hinzu.</p>
   <div className="mt-3 space-y-3">${A.SLOTS.map(s=>html`<label key=${s.id} className="flex items-center gap-3"><span className="flex-1 min-w-0"><b className="text-[13px] block">${s.name}</b><span className="text-[12px] mute block">${s.action}</span></span>${editable?html`<select aria-label=${s.name+' · Tage pro Woche'} className="arena-input" value=${targets[s.id]} disabled=${busy} onChange=${e=>setTargets(t=>({...t,[s.id]:Number(e.target.value)}))}>${[1,2,3,4,5,6,7].map(n=>html`<option key=${n} value=${n}>${n}× pro Woche</option>`)}</select>`:html`<span className="num text-[14px] font-semibold">${current[s.id]}× pro Woche</span>`}</label>`)}</div>
   ${editable&&html`<button type="submit" className="btn w-full py-3 mt-4 text-[13px]" disabled=${busy||!dirty}>${dirty?'Soll speichern':'Soll gespeichert'}</button>`}
  </form>`;
 }
 function ArenaView({c}){
  const session=c.auth?.session,signed=session?.mode==='supabase',api=G.arenaApi;
  const [list,setList]=useState([]),[snapshot,setSnapshot]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[loaded,setLoaded]=useState(false),[notice,setNotice]=useState('');
  const [name,setName]=useState('Unser Eiserner Kreis'),[displayName,setDisplayName]=useState(session?.name?.slice(0,24)||'Krieger'),[capacity,setCapacity]=useState(3);
  const [online,setOnline]=useState(navigator.onLine!==false);
  const [view,setView]=useState('today'),[opened,setOpened]=useState(0);
  useEffect(()=>{const update=()=>setOnline(navigator.onLine!==false);addEventListener('online',update);addEventListener('offline',update);return()=>{removeEventListener('online',update);removeEventListener('offline',update)}},[]);
  const [code,setCode]=useState(()=>{try{return new URL(G.location.href).searchParams.get('arena')||''}catch(e){return''}}),[form,setForm]=useState(''),[confirm,setConfirm]=useState(false);
  const section=useRef(null);
  useEffect(()=>{section.current?.scrollIntoView({block:'start',behavior:'auto'})},[snapshot?.league.id]);
  const active=useRef(true),gate=useRef(false),serial=useRef(0),selected=useRef(null);selected.current=snapshot?.league.id||null;
  useEffect(()=>{active.current=true;return()=>{active.current=false;serial.current++}},[]);
  async function run(fn,apply){if(gate.current)return;gate.current=true;setBusy(true);setError('');const seq=++serial.current;try{const r=await fn();if(active.current&&seq===serial.current){apply(r);setLoaded(true)}}catch(e){if(active.current&&seq===serial.current)setError(e.message||'Die Arena konnte nicht geladen werden.')}finally{gate.current=false;if(active.current&&seq===serial.current)setBusy(false)}}
  const open=s=>{setSnapshot(s);setForm('');setConfirm(false);setNotice('');setView('today');setOpened(0)};
  useEffect(()=>{if(signed)run(()=>api.list(),setList)},[signed]);
  useEffect(()=>{if(!signed||!snapshot)return;const id=snapshot.league.id;const refresh=()=>{if(document.visibilityState==='hidden'||navigator.onLine===false||gate.current)return;run(()=>api.load(id),s=>{if(selected.current===id)setSnapshot(s)})};const interval=setInterval(refresh,15000);addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);return()=>{clearInterval(interval);removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh)}},[signed,snapshot?.league.id]);
  const change=fn=>run(fn,s=>{setSnapshot(s);setConfirm(false);setNotice('Gespeichert.')});
  const p=snapshot&&A.phase(snapshot),week=p?.week||1,rows=snapshot&&A.weekly(snapshot,week),me=rows?.find(r=>r.user_id===snapshot.user_id),own=snapshot?.league.owner_id===snapshot?.user_id;
  const rival=rows&&me&&[...rows].reverse().find(r=>r.user_id!==snapshot.user_id&&r.targets&&r.score>=me.score);
  const allReady=snapshot&&snapshot.members.length>=2;
  const share=snapshot?A.invitation(snapshot.league.invite_code,G.location.origin+G.location.pathname):'';
  const tab=p?.kind==='finished'&&view==='today'?'table':view;
  const closed=p?.closed||0,gains=snapshot&&p.kind==='running'?A.gains(snapshot):[];
  const report=(slot,done)=>change(()=>api.report(snapshot.league.id,slot,done));
  /* Neue Wochenzeremonie: einmal oben zeigen, bis sie gesehen ist. Nur Wochennummer je Arena wird gemerkt. */
  const seen=snapshot?(c.S.arenaSeen||{})[snapshot.league.id]||0:0,fresh=closed>seen?closed:0;
  const markSeen=()=>c.upd(n=>{n.arenaSeen={...(n.arenaSeen||{}),[snapshot.league.id]:closed}});
  return html`<section ref=${section} className="screen px-4 pb-6 arena" aria-label="Arena mit Freunden">
   ${!snapshot&&html`<${Colosseum} kicker="Gemeinsam antreten · 2 bis 8" title="Arena" sub="Ein Soll für alle. Jede Woche. Ein gemeinsames Finale."/>`}
   ${!signed?html`<div className="card p-4 mt-4"><h2 className="disp text-[24px]">Auch zu dritt eine volle Runde</h2><div className="grid grid-cols-3 gap-2 mt-4">${['Du','Freund 1','Freund 2'].map((n,i)=>html`<div key=${n} className="card2 p-2 text-center rounded-xl"><div aria-hidden="true" className="disp text-[26px]">${i+1}</div><b className="text-[12px]">${n}</b></div>`)}</div><p className="text-[13px] mt-4">Vier Wochen pro Saison. Ein gemeinsames Soll für alle. Orakel und Wochenprämie sorgen für Spannung.</p><p className="text-[12px] mute mt-2">Vorschau ohne Mitspieler und Ergebnisse. Für eine gemeinsame Arena brauchst du ein E-Mail-Konto. Dein Gaststand bleibt auf diesem Gerät.</p><button type="button" className="btn w-full py-3 mt-4" onClick=${()=>c.auth?.signOut?c.auth.signOut():c.openSheet({t:'account'})}>Anmelden oder registrieren</button></div>`:html`
   ${error&&html`<div role="alert" className="card p-3 mt-3 text-[13px]" style=${{borderColor:'var(--acc)'}}>${error}</div>`}
   <div className="text-[12px] mute mt-2" role="status">${!online?'Offline · bestätigter Stand bleibt sichtbar.':busy?'Wird geladen …':notice}</div>
   ${!snapshot?html`
    <div className="flex justify-between items-center mt-3"><h2 className="disp text-[23px]">Meine Arenen</h2><button className="chip" type="button" disabled=${busy} onClick=${()=>run(()=>api.list(),setList)}>Aktualisieren</button></div>
    ${list.map(l=>html`<button key=${l.id} type="button" className="card p-4 mt-2 w-full text-left" disabled=${busy} onClick=${()=>run(()=>api.load(l.id),open)}><b className="block">${l.name}</b><span className="text-[12px] mute">${l.members}/${l.capacity} Personen · ${l.start_date?'Saison ab '+date(l.start_date):'Wartet auf den Start'}</span></button>`)}
    ${loaded&&!list.length&&html`<p className="text-[13px] mute mt-2">Noch keine gemeinsame Arena.</p>`}
    <div className="grid grid-cols-2 gap-2 mt-4"><button type="button" className="btn py-3 text-[13px]" disabled=${busy} onClick=${()=>setForm('create')}>Arena erstellen</button><button type="button" className="ghost py-3 text-[13px]" disabled=${busy} onClick=${()=>setForm('join')}>Mit Code beitreten</button></div>
    ${(form||code)&&html`<form className="card p-4 mt-3 space-y-3" onSubmit=${e=>{e.preventDefault();run(()=>form==='create'?api.create({name,displayName,capacity}):api.join({code,displayName}),open)}}><h2 className="disp text-[24px]">${form==='create'?'Deine Arena':'Einladung annehmen'}</h2><label className="block text-[12px]">Dein öffentlicher Arenaname<input className="arena-input w-full mt-1" required maxLength="24" value=${displayName} onChange=${e=>setDisplayName(e.target.value)}/></label>
     ${form==='create'?html`<label className="block text-[12px]">Name der Arena<input className="arena-input w-full mt-1" required maxLength="40" value=${name} onChange=${e=>setName(e.target.value)}/></label><label className="block text-[12px]">Personen<select className="arena-input w-full mt-1" value=${capacity} onChange=${e=>setCapacity(Number(e.target.value))}>${[2,3,4,5,6,7,8].map(n=>html`<option key=${n} value=${n}>${n} Personen</option>`)}</select></label>`:html`<label className="block text-[12px]">Einladungscode<input className="arena-input w-full mt-1" required maxLength="16" pattern="[A-Fa-f0-9]{16}" autoCapitalize="characters" value=${code} onChange=${e=>setCode(e.target.value)}/></label>`}
     <p className="text-[12px] mute">Mitglieder sehen deinen Arenanamen, gemeldete Erfüllungen und Reaktionen. Deine persönlichen Texte bleiben privat.</p><button type="submit" className="btn w-full py-3 text-[13px]" disabled=${busy}>${form==='create'?'Arena erstellen und beitreten':'Dieser Arena beitreten'}</button></form>`}
   `:html`
    <div className="flex justify-between gap-2 mt-2"><button type="button" className="chip" disabled=${busy} onClick=${()=>{setSnapshot(null);setForm('');run(()=>api.list(),setList)}}>Meine Arenen</button><button type="button" className="chip" disabled=${busy} onClick=${()=>run(()=>api.load(snapshot.league.id),setSnapshot)}>Aktualisieren</button></div>
    <${Colosseum} kicker=${snapshot.members.length+"/"+snapshot.league.capacity+" Krieger · "+(p.kind==="lobby"?"Lobby":p.kind==="scheduled"?"Start "+date(snapshot.league.start_date):p.kind==="finished"?"Saison beendet":"Woche "+week+" von 4")} title=${snapshot.league.name} sub=${p.kind==="running"?"Finale Sonntag, 24 Uhr · Berliner Zeit":p.kind==="lobby"?"Ladet ein, legt das Soll fest, dann startet der Gründer.":null}/>
    ${p.kind==='lobby'||p.kind==='scheduled'?html`<div className="card p-4 mt-3"><h2 className="disp text-[23px]">${p.kind==='lobby'?'Freunde einladen':'Die Runde steht'}</h2>${p.kind==='lobby'?html`<label className="block text-[12px] mt-2">Einladungslink<input className="arena-input w-full mt-1 text-[12px]" readOnly value=${share} onFocus=${e=>e.target.select()}/></label><div className="text-[12px] mt-2 break-all">Code: <b className="num">${snapshot.league.invite_code}</b></div><button type="button" className="ghost w-full py-3 mt-2 text-[13px]" onClick=${async()=>{try{await navigator.clipboard.writeText(share);setNotice('Einladungslink kopiert.')}catch(e){setNotice('Bitte den Link im Feld auswählen und kopieren.')}}}>Einladungslink kopieren</button>`:null}<ul className="mt-3 text-[13px] space-y-2">${snapshot.members.map(m=>html`<li key=${m.user_id} className="flex justify-between gap-2"><span>${m.display_name}${m.user_id===snapshot.user_id?' · du':''}</span><span className="mute">${m.user_id===snapshot.league.owner_id?'Gründer':'dabei'}</span></li>`)}</ul>
     ${own&&p.kind==='lobby'&&html`<button type="button" className="btn w-full py-3 mt-4 text-[13px]" disabled=${busy||!allReady} onClick=${()=>setConfirm(true)}>Saison starten</button>`}${!own&&p.kind==='lobby'&&html`<p className="text-[12px] mute mt-3">Der Gründer startet, sobald mindestens zwei Personen dabei sind.</p>`}
     ${confirm&&html`<div role="group" aria-label="Saisonstart bestätigen" className="card2 p-3 mt-3 rounded-xl"><p className="text-[13px]">Start am nächsten Montag. Danach können keine weiteren Personen dieser Saison beitreten. Das gemeinsame Soll steht dann für die ganze Saison fest.</p><div className="flex gap-2 mt-3"><button type="button" className="ghost flex-1 py-3" disabled=${busy} onClick=${()=>setConfirm(false)}>Zurück</button><button type="button" className="btn flex-1 py-3" disabled=${busy} onClick=${()=>change(()=>api.start(snapshot.league.id))}>Start bestätigen</button></div></div>`}
    </div>`:html`
    ${(p.kind==='running'||p.kind==='finished')&&html`<${Tabs} view=${tab} setView=${setView} running=${p.kind==='running'}/>`}
    ${tab==='today'&&p.kind==='running'&&html`
     ${fresh>0&&html`<${FreshBanner} snapshot=${snapshot} week=${fresh} onOpen=${()=>{setOpened(fresh);setView('table');markSeen()}} onDismiss=${markSeen}/>`}
     <${Finale} snapshot=${snapshot}/>
     <div className="card p-4 mt-3"><div className="flex items-baseline justify-between gap-2"><h2 className="disp text-[22px]">Platz ${me.rank} von ${rows.length}</h2><span className="num text-[15px] font-bold" style=${{color:'var(--acc2)'}}>${fmt(me.score)} <span className="text-[11px] mute font-normal">Arenapunkte</span></span></div>
      <p className="text-[12.5px] mt-1" style=${{color:'var(--nem)'}}>${me.score===0&&rows.every(r=>r.score===0)?'Die Arena ist offen. Die erste Erfüllung bringt Bewegung hinein.':rival?rival.score===me.score?'Gleichauf mit '+rival.display_name+'.':fmt(rival.score-me.score)+' Arenapunkte bis '+rival.display_name+'.':'Du führst die Arena. Halte das Soll.'}</p>
      <${NextMove} gains=${gains} busy=${busy} onReport=${report}/></div>
     <${FateRow} snapshot=${snapshot} week=${week} me=${snapshot.user_id}/>
     <section className="mt-4" aria-label="Deine Erfüllungen heute"><div className="flex items-baseline justify-between gap-2"><h2 className="disp text-[22px]">Heute melden</h2><span className="lbl">1× pro Tag</span></div><${SlotTiles} snapshot=${snapshot} week=${week} me=${me} busy=${busy} gains=${gains} onReport=${report}/>${(()=>{const on=c.S.arenaAuto===true;return html`<button type="button" role="switch" aria-checked=${on} onClick=${()=>c.upd(n=>{n.arenaAuto=!on})} className="w-full flex items-center gap-3 mt-2 px-3 py-2.5 text-left border-0" style=${{borderRadius:14,background:'transparent',boxShadow:'0 0 0 1px var(--line) inset',color:'var(--ink)'}}><span className="flex-1 min-w-0"><b className="block text-[13px]">Automatisch aus Aufgaben</b><span className="block text-[11.5px] mute">Erledigte Aufgaben mit bekannter Dauer zählen mit.</span></span><span className="shrink-0 rounded-full relative" style=${{width:40,height:24,background:on?'var(--acc)':'var(--ghost)',boxShadow:'0 0 0 1px var(--line) inset',transition:'background .2s'}}><span className="absolute rounded-full" style=${{top:3,left:on?19:3,width:18,height:18,background:'var(--ink)',transition:'left .2s'}}/></span></button>`})()}</section>
    `}
    ${tab==='table'&&html`
     <div className="card p-4 mt-3"><div className="flex items-baseline justify-between gap-2"><h2 className="disp text-[24px]">${p.kind==='finished'?'Letzte Spielwoche':'Kampfplatz'}</h2><span className="lbl">Woche ${week}${p.kind==='running'?' · vorläufig':''}</span></div><${Podium} rows=${rows} me=${snapshot.user_id}/>${rows.length>3&&html`<ol className="mt-3 space-y-1.5">${rows.slice(3).map(r=>html`<li key=${r.user_id} className="flex gap-2 items-center text-[13px]"><span className="num w-5 mute">${r.rank}.</span><b className="flex-1 min-w-0 truncate">${r.display_name}${r.user_id===snapshot.user_id?' · du':''}</b><span className="num">${fmt(r.score)}</span></li>`)}</ol>`}</div>
     <${WeekGrid} snapshot=${snapshot} week=${week}/>
     <div className="card p-4 mt-3"><div className="flex items-baseline justify-between gap-2"><h2 className="disp text-[22px]">Saisontabelle</h2><span className="lbl">${closed} von 4 gewertet</span></div><ol className="mt-3 space-y-2">${A.season(snapshot).map(r=>html`<li key=${r.user_id} className="flex gap-2 text-[13px]"><span className="num">${r.rank}.</span><b className="flex-1 break-words">${r.display_name}${r.user_id===snapshot.user_id?' · du':''}</b><span className="num">${r.points} Pkt.</span></li>`)}</ol><p className="text-[11.5px] mute mt-2">Platz 1–3 einer Woche erhält 3, 2, 1 Punkte.</p>${p.kind==='finished'&&html`<p className="text-[13px] mt-3" style=${{color:'var(--gold)'}}>${A.season(snapshot).some(r=>r.points>0)?'Saisonsieg: '+A.season(snapshot).filter(r=>r.rank===1).map(r=>r.display_name).join(' und '):'Keine Erfüllungen in dieser Saison.'}</p><p className="text-[12px] mute mt-1">Eine neue Runde könnt ihr über „Meine Arenen“ erstellen.</p>`}</div>
     ${closed>0&&html`<details key=${'cer-'+opened} open=${opened>0} className="card p-4 mt-3"><summary className="text-[14px] font-semibold">Wochenzeremonien</summary>${Array.from({length:closed},(_,i)=>closed-i).map(w=>html`<${Ceremony} key=${snapshot.league.id+'-'+w} snapshot=${snapshot} week=${w}/>`)}</details>`}
     <${Scoring} snapshot=${snapshot} week=${week}/>
    `}
    ${tab==='log'&&html`
     ${p.kind==='running'&&A.awards(snapshot,week).comebacks.map(m=>html`<div key=${m.user_id} className="card p-3 mt-3 text-[13px]" style=${{color:'var(--gold)'}}><b>Comeback-Lorbeer · ${m.display_name}</b><p className="text-[12px] mute mt-1">Nach mindestens zwei freien Tagen wieder drei Tage in Folge aktiv. Ohne Zusatzpunkte.</p></div>`)}
     <${Battle} key=${snapshot.league.id} snapshot=${snapshot} busy=${busy} onReact=${(ev,kind)=>change(()=>api.react(snapshot.league.id,ev,kind))}/>
    `}
    `}
    ${(p.kind==='lobby'||p.kind==='scheduled')&&html`<${GroupTargets} key=${snapshot.league.id+'-'+JSON.stringify(A.targetsOf(snapshot))} snapshot=${snapshot} editable=${own&&p.kind==='lobby'} busy=${busy} onSave=${t=>change(()=>api.setTargets(snapshot.league.id,t))}/>`}
   `}
   `}
   <button type="button" className="ghost w-full py-3 mt-4 text-[13px]" onClick=${()=>c.setTab('solo')}>Persönlichen Planvergleich öffnen</button>
   <details className="card p-4 mt-4 text-[12px]"><summary className="text-[14px] font-semibold">So wird gespielt</summary><p className="mt-2">Montag bis Sonntag, vier Wochen lang. Jeder erfüllte Tag zählt anteilig zum festen Platzwert von 25 Arenapunkten. Zusätzliche Aufgaben über das Soll hinaus erzeugen keinen Vorteil. Bei Gleichstand wird der Platz geteilt; der nächste Platz wird übersprungen. Außerhalb der ersten drei Plätze gibt es keine Tabellenpunkte.</p><p className="mt-2">Alle spielen mit demselben Soll, das der Gründer vor dem Start festlegt. So bedeutet gleiche Punktzahl gleichen Aufwand. Ergebnisse sind selbst gemeldet und nicht durch Geräte bestätigt. Es gibt keine Geldbeträge, Einsätze oder Auswirkungen auf deinen persönlichen Fortschritt.</p><p className="mt-2"><b>Orakel:</b> Jeden Tag zählt ein Bereich ×1,5 – für alle derselbe, ab Mitternacht sichtbar. <b>Wochenprämie:</b> Wer in der Woche als Erste:r das Soll des ausgelosten Bereichs erfüllt, erhält +5 Arenapunkte. Beides wird aus Arena und Datum berechnet und lässt sich nicht beeinflussen.</p><p className="mt-2"><b>Automatisch:</b> Nur wenn du es einschaltest. Dann zählt eine erledigte passende Aufgabe mit bekannter Dauer in laufenden Arenen mit; „Rückgängig“ nimmt nur diese automatische Meldung zurück. Finanzen haben keinen Arenaplatz.</p><p className="mt-2"><b>Nächster Zug:</b> zeigt, welcher Bereich dir heute die meisten Arenapunkte bringt – mit derselben Wertung wie die Tabelle.</p><p className="mt-2">Ruhetage bleiben frei. Die Arena erinnert dich nicht automatisch und erzeugt keine Bonuspunkte für späte Einträge. Persönliche Reflexionen, Ziele und Zukunftstexte werden nicht übertragen.</p></details>
  </section>`;
 }
 G.ArenaView=ArenaView;
})(window);
