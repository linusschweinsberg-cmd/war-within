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
  return html`<div className="grid gap-2 mt-3 items-end" style=${{gridTemplateColumns:'repeat('+order.length+',minmax(0,1fr))'}}>${order.map(r=>{const mine=r.user_id===me,col=mine?'var(--acc2)':'var(--nem)',bonus=r.bonus??r.oracle+r.bounty;
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
 function Tabs({view,setView,running}){const items=[running&&['today','Heute'],['table','Tabelle'],['duel','Duell'],['log','Bericht']].filter(Boolean);
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
   <p className="text-[12px] mute mt-2">Je Bereich: Tage ÷ Soll × 25. Orakel-Tage erhalten zusätzlich die Hälfte ihres Tageswerts. Seit Arena 3.0 gelten höchstens 100 Basis- und 15 Bonuspunkte pro Woche. Boni werden in dieser Reihenfolge angerechnet, bis 15 erreicht sind: Formation +6, Vier Säulen +5, Kampfgeist +4, Wochenprämie +5, Orakel. Pro Bereich auf eine Nachkommastelle gerundet. Über das Soll hinaus zählt nichts.</p>
   ${A.weekly(snapshot,week).map(r=>html`<details key=${r.user_id} className="mt-3 pt-3 border-t ln"><summary className="text-[13px] font-semibold">${r.display_name} · ${fmt(r.score)} Arenapunkte</summary>
    <div className="overflow-x-auto mt-2"><table className="w-full text-[12px] text-left"><thead><tr><th scope="col">Bereich</th><th scope="col">Tage/Soll</th><th scope="col">Basis</th><th scope="col">Orakel vor Deckel</th></tr></thead><tbody>${r.breakdown.map(b=>html`<tr key=${b.slot}><th scope="row" className="py-2 font-normal">${slotOf(b.slot).name}</th><td>${b.count}/${b.target}</td><td>${fmt(b.base)}</td><td>+${fmt(b.oracle)}</td></tr>`)}</tbody></table></div>
    <p className="text-[12px] mt-2">${fmt(r.base)} Basis + ${fmt(r.oracle)} Orakel + ${fmt(r.bounty)} Wochenprämie${r.formation!=null?html` + ${fmt(r.formation)} Formation + ${fmt(r.combo||0)} Säulen + ${fmt(r.momentum||0)} Kampfgeist`:''} = <b>${fmt(r.score)}</b></p>
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
 /* ── Arena-Bühne nach dem Vorbild des Duells: Szene, Kopf-an-Kopf, Wochenrunden, Stimme. Nur bestätigte Daten. ── */
 const Hoplite=({cape})=>html`<g><path d="M52 50 C70 52 92 60 108 88 C100 84 96 90 100 104 C92 100 86 108 90 122 C70 112 58 104 46 92Z" fill=${cape}/>
  <path d="M38 112 L33 160 L30 178 L42 180 L46 160 L50 120Z M52 112 L58 160 L60 178 L72 178 L66 158 L62 112Z" fill="var(--scene-silhouette)"/><path d="M36 98 L68 98 L74 124 L30 124Z" fill="var(--scene-armour)"/>
  <path d="M34 52 Q52 46 70 52 L66 100 L38 100Z M34 54 L24 68 L22 86 L28 88 L36 72Z" fill="var(--scene-silhouette)"/><rect x="20.5" y="-6" width="3" height="200" fill="var(--mute)"/><path d="M22 -26 L16 -4 L28 -4Z" fill="var(--stone)"/>
  <path d="M36 32 C36 14 44 8 52 8 C60 8 68 14 68 32 L68 44 L62 44 L62 36 L42 36 L42 44 L36 44Z" fill="var(--scene-silhouette)" stroke="var(--mute)" strokeWidth="1.2"/><path d="M52 8 C50 -6 66 -10 78 0 C70 -2 62 2 58 10Z" fill=${cape}/>
  <circle cx="66" cy="92" r="26" fill="var(--scene-armour)" stroke="var(--mute)" strokeWidth="2"/><path d="M66 78 L78 106 H72 L66 92 L60 106 H54Z" fill=${cape}/></g>`;
 /* Szene: jedes Mitglied als Hoplit (höchstens sechs, du immer dabei). Die Stufe wächst mit den Wochenpunkten; Spitze in der Mitte. */
 function Stage({rows,me}){let pick=rows.slice(0,6);if(!pick.some(r=>r.user_id===me))pick=[...pick.slice(0,5),rows.find(r=>r.user_id===me)].filter(Boolean);
  const ord=[];pick.forEach((r,i)=>i%2?ord.unshift(r):ord.push(r));
  const n=ord.length,slot=360/n,s=n<=3?.5:n<=4?.44:.36,max=Math.max(1,...ord.map(r=>r.score)),floor=200,top=pick[0];
  const name=r=>r.user_id===me?'DU':(r.display_name.length>9?r.display_name.slice(0,8)+'…':r.display_name).toUpperCase();
  return html`<div className="mt-3 overflow-hidden" style=${{height:230,borderRadius:16,border:'1px solid var(--line)',background:'var(--bg2)'}} role="img" aria-label=${'Arena-Bühne: '+pick.map(r=>(r.user_id===me?'du':r.display_name)+' Platz '+r.rank+', '+fmt(r.score)+' Punkte').join('; ')}>
   <svg viewBox="0 0 360 230" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style=${{display:'block',width:'100%',height:'100%'}}>
    <rect width="360" height="230" fill="var(--bg2)"/><circle cx="180" cy="66" r="54" fill="var(--gold)" opacity=".12"/>
    <path d="M6 38 Q180 12 354 38" fill="none" stroke="var(--bronze)" strokeWidth="1.2" opacity=".5"/>
    ${[0,1,2].map(i=>html`<rect key=${i} x="0" y=${42+i*16} width="360" height="16" fill=${i%2?'var(--card2)':'var(--card)'}/>`)}
    <path d="M0 42 H360 M0 58 H360 M0 74 H360 M0 90 H360" stroke="var(--line)" strokeWidth="1"/>
    <rect x="0" y="90" width="360" height="140" fill="color-mix(in srgb,var(--gold) 8%,var(--card))"/>
    <ellipse cx="180" cy="200" rx="200" ry="30" fill="color-mix(in srgb,var(--gold) 14%,var(--card))"/>
    ${ord.map((r,i)=>{const cx=slot*i+slot/2,h=6+46*r.score/max,mine=r.user_id===me,lead=r.rank===1&&r.score>0,y=floor-h-180*s,w=Math.min(78,slot-10);
     return html`<g key=${r.user_id}><rect x=${cx-w/2} y=${floor-h} width=${w} height=${h} fill="color-mix(in srgb,var(--bronze) 16%,var(--card2))" stroke="var(--line2)" strokeWidth="1"/>
      <g transform=${`translate(${cx-60*s},${y}) scale(${s})`}><${Hoplite} cape=${mine?'var(--acc)':'var(--line2)'}/></g>
      ${lead&&html`<path d=${`M${cx-10} ${y-20*s} Q${cx} ${y-32*s} ${cx+10} ${y-20*s}`} fill="none" stroke="var(--gold)" strokeWidth="2"/>`}
      <text x=${cx} y="222" textAnchor="middle" fontSize="10" fontFamily="Inter" fontWeight=${mine?700:600} letterSpacing="1.2" fill=${mine?'var(--acc2)':'var(--stone)'}>${name(r)} · ${r.rank}.</text></g>`})}
   </svg></div>`}
 /* Kopf-an-Kopf: du gegen den Platz direkt über dir (bzw. deinen Verfolger, wenn du führst), darunter der Abstand als Balken. */
 function HeadToHead({rows,me}){const mine=rows.find(r=>r.user_id===me),others=rows.filter(r=>r.user_id!==me);if(!mine||!others.length)return null;
  const above=others.filter(r=>r.score>mine.score).sort((a,b)=>a.score-b.score)[0],opp=above||others.filter(r=>r.score<=mine.score).sort((a,b)=>b.score-a.score)[0];
  const gap=Math.abs(opp.score-mine.score),share=mine.score+opp.score?Math.min(92,Math.max(8,mine.score/(mine.score+opp.score)*100)):50;
  const label=!gap?'Gleichauf mit '+opp.display_name:above?'Abstand zu Platz '+opp.rank:'Vorsprung auf '+opp.display_name;
  const cell=(k,r,col,border)=>html`<div className="card p-3 text-center" style=${{borderColor:border}}><span className="lbl block truncate" style=${{color:col}}>${k} · Platz ${r.rank}</span><span className="duel-n num block">${fmt(r.score)}</span><span className="text-[11.5px] mute block">Arenapunkte</span></div>`;
  return html`<div className="grid grid-cols-2 gap-2 mt-2">${cell('Du',mine,'var(--acc2)','var(--acc2)')}${cell(opp.display_name,opp,'var(--mute)','var(--line)')}</div>
   <div className="card p-4 mt-2"><div className="flex justify-between items-baseline gap-2"><span className="lbl truncate">${label}</span><b className="num text-[14px] shrink-0" style=${{color:'var(--acc2)'}}>${gap?fmt(gap)+' Punkte':'±0'}</b></div>
    <div className="relative mt-3 mb-1.5" style=${{height:12,borderRadius:6,background:'var(--line)'}} role="img" aria-label=${'Du '+Math.round(share)+' Prozent, '+opp.display_name+' '+(100-Math.round(share))+' Prozent'}><div className="absolute inset-y-0 left-0" style=${{width:share+'%',borderRadius:'6px 0 0 6px',background:'var(--acc)',transition:'width .6s cubic-bezier(.16,1,.3,1)'}}/><div className="absolute rounded-full" style=${{left:share+'%',top:'50%',width:24,height:24,background:'var(--ink)',border:'2px solid var(--bg)',transform:'translate(-50%,-50%)',transition:'left .6s cubic-bezier(.16,1,.3,1)'}}/></div>
    <div className="flex justify-between text-[11px] mute"><span>Du</span><span className="truncate">${opp.display_name}</span></div></div>`}
 /* Deine Woche als sieben Runden: Zahl = gemeldete Bereiche an diesem Tag; 4 von 4 in Gold. */
 function MyRounds({snapshot,week}){const r=A.activity(snapshot,week).find(x=>x.user_id===snapshot.user_id);if(!r)return null;
  return html`<section className="mt-3" aria-label="Deine Woche in sieben Runden"><div className="flex justify-between items-baseline mb-2"><span className="lbl">Deine Woche · 7 Runden</span><span className="text-[11px] mute">Bereiche je Tag</span></div>
   <div className="grid grid-cols-7 gap-1" role="list">${r.days.map((d,i)=>{const col=d.future?'var(--line2)':d.slots===4?'var(--gold)':d.slots?'var(--acc2)':'var(--mute)';
    return html`<div key=${d.day} role="listitem" aria-label=${WD[i]+': '+(d.future?'noch offen':d.slots+' von 4 Bereichen')+(d.today?', heute':'')} className="text-center py-2" style=${{borderRadius:10,background:d.today?'color-mix(in srgb,var(--acc) 14%,var(--card))':'var(--card)',border:'1px solid '+(d.today?'var(--acc2)':'var(--line)')}}><div className="text-[11px] font-semibold" style=${{color:d.today?'var(--ink)':'var(--mute)'}}>${WD[i]}</div><b className="disp block text-[16px]" style=${{color:col}}>${d.future?'–':d.slots}</b></div>`})}</div></section>`}
 /* Stimme der Arena: eine Zeile aus den bestätigten Zahlen – ermutigend, nie spöttisch. */
 function Voice({rows,me,gains}){const mine=rows.find(r=>r.user_id===me);if(!mine)return null;const g=gains[0],above=rows.filter(r=>r.user_id!==me&&r.score>mine.score).sort((a,b)=>a.score-b.score)[0];
  /* Spricht über denselben Gegner wie das Kopf-an-Kopf (Platz direkt darüber); den Zug selbst nennt „Dein nächster Zug“. */
  const open=g&&g.points>0,gap=above?above.score-mine.score:0;
  const line=rows.every(r=>r.score===0)?'Die Arena ist offen. Wer zuerst meldet, setzt den Ton.':!above?(rows.some(r=>r.user_id!==me&&r.score===mine.score)?'Gleichauf an der Spitze. Der nächste Tag entscheidet.':'Du führst. Wer das Soll hält, bleibt vorn.'):!open?'Heute ist alles gemeldet. Morgen geht der Kampf weiter.':g.points>=gap?above.display_name+' ist heute in Reichweite.':fmt(gap)+' Punkte bis '+above.display_name+'. Jeder gemeldete Tag zählt.';
  return html`<div className="card p-4 mt-3 reaction" role="status">„${line}“</div>`}

 /* ── Arena 3.0 · Taktik: Formation, Kriegsrat, Kampfgeist (Momentum), Vier Säulen. Punkte bestätigt der Server;
    Fortschrittsanzeigen nutzen dieselbe Wertung (ArenaCore.scoreV3). ── */
 const FICON={shield:'aspis',spear:'spear',guardian:'helmet'},formOf=id=>A.FORMATIONS.find(f=>f.id===id)||A.FORMATIONS[0];
 const nameIn=(snapshot,id)=>id===snapshot.user_id?'Du':snapshot.members.find(m=>m.user_id===id)?.display_name||'Mitglied';
 function FormationCards({kind,setKind,slot,setSlot,closed=[],compact}){
  return html`<div role="radiogroup" aria-label="Formation wählen" className="grid gap-2 mt-3">${A.FORMATIONS.map(f=>{const on=kind===f.id;
   return html`<button key=${f.id} type="button" role="radio" aria-checked=${on} onClick=${()=>setKind(f.id)} className="text-left p-3 border-0 flex gap-3 items-start" style=${{borderRadius:14,color:'var(--ink)',background:on?'color-mix(in srgb,var(--acc) 12%,var(--card))':'var(--card)',boxShadow:'0 0 0 '+(on?'1.5px var(--acc2)':'1px var(--line)')+' inset'}}>
    <span className="shrink-0 mt-0.5" style=${{color:on?'var(--acc2)':'var(--bronze)'}}>${Ic(FICON[f.id],compact?22:28,1.6)}</span>
    <span className="flex-1 min-w-0"><span className="flex justify-between items-baseline gap-2"><b className="disp text-[18px] leading-none">${f.name}</b>${!compact&&html`<span className="num text-[12px] font-semibold" style=${{color:'var(--gold)'}}>+6</span>`}</span>
     <span className="block lbl mt-1">${f.focus}</span>${!compact&&html`<span className="block text-[12px] mute mt-1 leading-snug">${f.rule}</span>`}</span></button>`})}</div>
   ${kind==='spear'&&setSlot&&html`<label className="block text-[12.5px] mt-2">Schwerpunkt<select className="arena-input w-full mt-1" value=${slot} onChange=${e=>setSlot(e.target.value)}>${A.SLOTS.map(s=>html`<option key=${s.id} value=${s.id} disabled=${closed.includes(s.id)}>${s.name}${closed.includes(s.id)?' · schon erfüllt':''}</option>`)}</select></label>`}`}
 /* Wochenplan: je Bereich genau „need“ Tage ab Tag „from“. Tage davor sind gesperrt. */
 function PlanGrid({need,from=1,plan,setPlan}){
  return html`<div className="mt-3 space-y-2">${A.SLOTS.map(s=>{const sel=plan[s.id]||[],n=need[s.id];
   return html`<fieldset key=${s.id}><legend className="text-[12.5px] flex justify-between w-full"><b>${s.name}</b><span className="num" style=${{color:sel.length===n?'var(--acc2)':'var(--mute)'}}>${sel.length} / ${n}</span></legend>
    <div className="grid grid-cols-7 gap-1 mt-1">${WD.map((d,i)=>{const day=i+1,on=sel.includes(day),full=!on&&sel.length>=n;
     return html`<button key=${d} type="button" aria-pressed=${on} disabled=${day<from} aria-label=${s.name+' am '+d+(on?' geplant':' frei')} onClick=${()=>{if(full)return;setPlan({...plan,[s.id]:on?sel.filter(x=>x!==day):[...sel,day].sort((a,b)=>a-b)})}} className="py-1.5 text-[11.5px] font-semibold border-0" style=${{borderRadius:8,color:on?'var(--bg)':'var(--ink)',background:on?'var(--acc)':'var(--card2)',boxShadow:'0 0 0 1px var(--line) inset',opacity:day<from?.35:full?.55:1}}>${d}</button>`})}</div></fieldset>`})}</div>`}
 /* Startvorschlag: Tage gleichmäßig über die verbleibende Woche verteilen. */
 const evenPlan=(need,from=1)=>Object.fromEntries(A.SLOTS.map(s=>{const span=8-from,n=Math.min(need[s.id],span),days=[];for(let i=0;i<n;i++){let d=from+Math.floor(i*span/n);while(days.includes(d))d++;days.push(d)}return[s.id,days]}));
 const planOk=(plan,need)=>A.SLOTS.every(s=>(plan[s.id]||[]).length===need[s.id]);
 /* Formation für die kommende Woche wählen; zum Wochenstart gesperrt. */
 function FormationPrep({snapshot,busy,onSave}){
  const phase=A.phase(snapshot),week=phase.kind==='scheduled'?1:phase.kind==='running'?phase.week+1:5;
  const saved=A.formationOf(snapshot,snapshot.user_id,week),doctrine=(snapshot.doctrines||{})[snapshot.user_id],t=A.targetsOf(snapshot);
  const [kind,setKind]=useState(saved?.kind||doctrine||'shield'),[slot,setSlot]=useState(saved?.slot||'mind');
  const [plan,setPlan]=useState(()=>saved?.plan||evenPlan(t));
  if(week>4||!snapshot.league.start_date)return null;
  const valid=planOk(plan,t),dirty=!saved||saved.kind!==kind||saved.slot!==slot||A.SLOTS.some(x=>JSON.stringify(saved.plan[x.id]||[])!==JSON.stringify(plan[x.id]||[]));
  return html`<details className="card p-4 mt-3" open=${!saved&&phase.kind==='scheduled'}><summary className="flex items-center gap-2 text-[14px] font-semibold"><span style=${{color:'var(--bronze)'}}>${Ic(FICON[saved?.kind||kind],18)}</span><span className="flex-1">Formation · Woche ${week}</span><span className="lbl" style=${{color:saved?'var(--acc2)':'var(--mute)'}}>${saved?formOf(saved.kind).name:'offen'}</span></summary>
   <p className="text-[12px] mute mt-2">Gültig ab Montag, ${date(A.addDays(snapshot.league.start_date,(week-1)*7))}. Bis dahin änderbar, dann gesperrt. Jede Formation bringt höchstens +6 innerhalb der 15 Bonuspunkte.</p>
   <${FormationCards} kind=${kind} setKind=${setKind} slot=${slot} setSlot=${setSlot}/>
   <p className="text-[12px] mute mt-3">Dein Wochenplan: je Bereich genau das gemeinsame Soll auf Wochentage legen. Wächter und Kampfgeist zählen geplante Tage, an denen alles Geplante erfüllt ist. Ungeplante Tage sind Ruhetage und unterbrechen nichts.</p>
   <${PlanGrid} need=${t} plan=${plan} setPlan=${setPlan}/>
   <button type="button" className="btn w-full py-3 mt-3 text-[13px]" disabled=${busy||!valid||!dirty} onClick=${()=>onSave(week,kind,slot,plan)}>${!valid?'Plan vervollständigen':saved?(dirty?'Änderung speichern':'Formation steht'):'Formation bestätigen'}</button>
  </details>`;
 }
 /* Kampfgeist: drei Flammen für drei erfüllte Plantage in Folge. */
 function Momentum({me,hasPlan}){const lit=Math.min(me.run||0,A.MOMENTUM_RUN),done=me.momentum>0;
  return html`<div className="flex items-center gap-3"><span className=${'flex gap-0.5 shrink-0'+(done?' arena-flame':'')} aria-hidden="true">${[0,1,2].map(i=>html`<span key=${i} style=${{display:'inline-flex',color:i<lit?(done?'var(--gold)':'var(--acc2)'):'var(--ghost)',transform:'scale('+(0.8+0.15*i)+')',transition:'color .4s'}}>${Ic('flame',20,i<lit?2.2:1.6)}</span>`)}</span>
   <span className="flex-1 min-w-0"><b className="block text-[13px]">Kampfgeist${done?' entfacht · +4':''}</b><span className="block text-[11.5px] mute">${!hasPlan?'Braucht einen Wochenplan (kommt mit der Formation).':done?'Drei geplante Tage in Folge erfüllt. Bleibt diese Woche bestehen.':lit+' von 3 geplanten Tagen in Folge · Ruhetage zählen nicht dagegen.'}</span></span></div>`}
 /* Vier Säulen: eine Säule leuchtet, wenn ihr Bereich das Wochensoll erreicht. Ab drei: +5. */
 function Pillars({me}){const full=A.SLOTS.filter(s=>me.counts[s.id]>=me.targets[s.id]),done=me.combo>0;
  return html`<div className="flex items-center gap-3"><span className="flex gap-1.5 items-end shrink-0" aria-hidden="true">${A.SLOTS.map(s=>{const on=full.includes(s),c=on?'var(--gold)':'var(--line2)';
   return html`<svg key=${s.id} width="14" height="26" viewBox="0 0 14 26"><rect x="0.5" y="0.5" width="13" height="3" rx="1" fill=${on?c:'none'} stroke=${c}/><rect x="2.5" y="4.5" width="9" height="17" fill=${on?'color-mix(in srgb,var(--gold) 30%,transparent)':'none'} stroke=${c}/><path d="M5 6v14M7 6v14M9 6v14" stroke=${on?c:'var(--line)'} strokeWidth=".8"/><rect x="0.5" y="22.5" width="13" height="3" rx="1" fill=${on?c:'none'} stroke=${c}/></svg>`})}</span>
   <span className="flex-1 min-w-0"><b className="block text-[13px]">Vier Säulen${done?' · +5':''}</b><span className="block text-[11.5px] mute">${done?full.length+' Bereiche mit vollem Soll. Zählt einmal pro Woche.':full.length+' von 3 Bereichen mit vollem Soll'+(full.length?' · '+full.map(s=>s.name).join(', '):'')}</span></span></div>`}
 function formationProgress(me,f){if(me.formation)return'Gemeistert · +6';const t=me.targets,c=me.counts;
  if(f.switch_day)return'Gilt seit '+date(f.switch_day)+' · zählt nur Meldungen ab dann';
  if(f.kind==='shield')return A.SLOTS.filter(s=>c[s.id]>=Math.ceil(6*t[s.id]/10)).length+' von 4 Bereichen bei 60 %';
  if(f.kind==='spear')return slotOf(f.slot).name+': '+c[f.slot]+' von '+t[f.slot];
  return(me.guard?.done||0)+' von '+Math.min(4,me.guard?.planned||0)+' Plantagen vollständig';}
 function Tactics({snapshot,week,me,busy,onSwitch}){
  const f=A.formationOf(snapshot,snapshot.user_id,week),sw=A.switchNeed(snapshot,week),[open,setOpen]=useState(false);
  const closed=A.SLOTS.filter(s=>sw.need[s.id]<1).map(s=>s.id),[kind,setKind]=useState(f?.kind==='shield'?'guardian':'shield'),[slot,setSlot]=useState(A.SLOTS.find(s=>!closed.includes(s.id))?.id||'mind');
  const [plan,setPlan]=useState(()=>evenPlan(sw.need,sw.from));
  const can=f&&!f.switch_day&&!me.formation&&sw.open,bonus=me.bonus||0,pct=Math.min(100,bonus/A.BONUS_CAP*100);
  return html`<section className="card p-4 mt-3" aria-label="Taktik der Woche">
   <div className="flex items-baseline justify-between gap-2"><h2 className="disp text-[22px]">Taktik der Woche</h2><span className="num text-[12px]" style=${{color:'var(--gold)'}}>${fmt(bonus)} / 15 Bonus</span></div>
   <div className="mt-2" style=${{height:6,borderRadius:3,background:'var(--ghost)'}} role="img" aria-label=${fmt(bonus)+' von 15 Bonuspunkten'}><div style=${{width:pct+'%',height:'100%',borderRadius:3,background:pct>=100?'var(--gold)':'var(--acc)',transition:'width .6s cubic-bezier(.16,1,.3,1)'}}/></div>
   <div className="flex items-center gap-3 mt-4"><span className="shrink-0" style=${{color:me.formation?'var(--gold)':f?'var(--acc2)':'var(--mute)'}}>${Ic(f?FICON[f.kind]:'lock',26,1.6)}</span>
    <span className="flex-1 min-w-0"><b className="block text-[13px]">${f?formOf(f.kind).name+(f.kind==='spear'?' · '+slotOf(f.slot).name:''):'Keine Formation'}${f&&html`<span className="lbl ml-2">gesperrt</span>`}</b><span className="block text-[11.5px] mute">${f?formationProgress(me,f):'Für diese Woche wurde vor Montag keine Formation gewählt. Die nächste kannst du unten vorbereiten.'}</span></span></div>
   <div className="mt-3 pt-3 border-t ln"><${Momentum} me=${me} hasPlan=${!!f}/></div>
   <div className="mt-3 pt-3 border-t ln"><${Pillars} me=${me}/></div>
   ${f&&html`<div className="mt-3 pt-3 border-t ln">${f.switch_day?html`<p className="text-[12px] mute"><b style=${{color:'var(--ink)'}}>Kriegsrat genutzt</b> · ${formOf(f.prev_kind).name} → ${formOf(f.kind).name}, gilt ab ${date(f.switch_day)}. 0 von 1 Wechsel übrig.</p>`
    :!can?html`<p className="text-[12px] mute"><b style=${{color:'var(--ink)'}}>Kriegsrat</b> · ${me.formation?'Formation gemeistert – kein Wechsel nötig.':'Nur Montag bis Donnerstag möglich.'}</p>`
    :!open?html`<button type="button" className="ghost w-full py-2.5 text-[13px] flex items-center justify-center gap-2" disabled=${busy} onClick=${()=>setOpen(true)}>${Ic('swap',16)} Kriegsrat einberufen · 1 Wechsel übrig</button>`
    :html`<div role="group" aria-label="Kriegsrat"><h3 className="disp text-[19px]">Kriegsrat</h3><p className="text-[12px] mute mt-1">Neue Formation ab morgen, ${date(A.addDays(snapshot.today,1))}. Sie zählt nur Meldungen ab dann und plant genau das noch offene Soll. Einmal pro Woche, nicht rückgängig.</p>
     <${FormationCards} compact kind=${kind} setKind=${setKind} slot=${slot} setSlot=${setSlot} closed=${closed}/>
     <${PlanGrid} need=${sw.need} from=${sw.from} plan=${plan} setPlan=${setPlan}/>
     <div className="flex gap-2 mt-3"><button type="button" className="ghost flex-1 py-3 text-[13px]" disabled=${busy} onClick=${()=>setOpen(false)}>Abbrechen</button><button type="button" className="btn flex-1 py-3 text-[13px]" disabled=${busy||!planOk(plan,sw.need)||kind==='spear'&&closed.includes(slot)} onClick=${()=>onSwitch(kind,slot,plan)}>Wechsel bestätigen</button></div></div>`}</div>`}
  </section>`;
 }
 /* Saison-Draft: Doktrin vor dem Start. Nur Darstellung und Vorauswahl, keine Punkte. */
 function Doctrine({snapshot,busy,onSave}){const cur=(snapshot.doctrines||{})[snapshot.user_id]||null,[kind,setKind]=useState(cur||'shield'),chosen=snapshot.members.filter(m=>(snapshot.doctrines||{})[m.user_id]);
  return html`<section className="card p-4 mt-3" aria-label="Saisonvorbereitung"><h2 className="disp text-[23px]">Saisonvorbereitung</h2>
   <p className="text-[12px] mute mt-1">Wähle deine Doktrin. Sie wählt jede Woche deine Formation vor und gibt deinem Schild sein Zeichen. Punkte bringt sie nicht; alle Doktrinen sind gleich viel wert. Wählbar bis zum Saisonstart.</p>
   <${FormationCards} compact kind=${kind} setKind=${setKind}/>
   <button type="button" className="btn w-full py-3 mt-3 text-[13px]" disabled=${busy||kind===cur} onClick=${()=>onSave(kind)}>${cur===kind?'Doktrin gewählt':'Doktrin wählen'}</button>
   ${chosen.length>0&&html`<ul className="mt-3 text-[12px] space-y-1">${chosen.map(m=>html`<li key=${m.user_id} className="flex items-center gap-2"><span style=${{color:'var(--bronze)'}}>${Ic(FICON[snapshot.doctrines[m.user_id]],14)}</span>${nameIn(snapshot,m.user_id)} · ${formOf(snapshot.doctrines[m.user_id]).name}</li>`)}</ul>`}
  </section>`}
 function ScoreFeed({snapshot,api}){
  const [older,setOlder]=useState([]),[pending,setPending]=useState(false),[error,setError]=useState(''),[end,setEnd]=useState(false);
  const events=[...new Map([...(snapshot.score_events||[]),...older].map(e=>[e.id,e])).values()].sort((a,b)=>b.seq-a.seq);
  const labels={base:'Standard erfüllt',oracle:'Orakel',bounty:'Wochenprämie',formation:'Formation gemeistert',combo:'Vier Säulen',momentum:'Kampfgeist'};
  const tactics=(snapshot.tactics||[]).filter(t=>t.action==='switch').slice(0,5);
  async function more(){setPending(true);setError('');try{const r=await api.events(snapshot.league.id,events.at(-1)?.seq);setOlder(x=>[...x,...r]);setEnd(r.length<30)}catch(e){setError(e.message)}finally{setPending(false)}}
  return html`<section className="card p-4 mt-3" aria-label="Bestätigte Punkte"><h2 className="disp text-[24px]">Bestätigte Punkte</h2><p className="text-[12px] mute mt-1">Vom Server berechnet · neueste zuerst. Rücknahmen und Bonuskorrekturen erscheinen als eigene Einträge.</p>
   ${!events.length&&html`<p className="text-[13px] mt-3">Noch keine Punkteereignisse.</p>`}
   ${events.map(e=>html`<article key=${e.id} className="mt-3 pt-3 border-t ln text-[13px] flex gap-2 items-baseline"><span className="flex-1 min-w-0"><b>${nameIn(snapshot,e.user_id)}</b> · ${e.delta<0?'Korrektur: ':''}${labels[e.type]||e.type}${e.slot?' · '+slotOf(e.slot).name:''}<span className="block text-[11px] mute">${new Date(e.created_at).toLocaleString('de-DE',{timeZone:'Europe/Berlin',weekday:'short',hour:'2-digit',minute:'2-digit'})} · Woche ${e.week}</span></span><b className="num shrink-0" style=${{color:e.delta<0?'var(--mute)':e.type==='base'?'var(--acc2)':'var(--gold)'}}>${e.delta>0?'+':'−'}${fmt(Math.abs(e.delta))}</b></article>`)}
   ${error&&html`<p role="alert" className="text-[13px] mt-2">${error}</p>`}
   ${events.length>=30&&!end&&html`<button className="ghost w-full py-3 mt-3" type="button" disabled=${pending} onClick=${more}>Ältere Ereignisse laden</button>`}
   ${tactics.length>0&&html`<h3 className="lbl mt-4">Kriegsrat</h3>${tactics.map(t=>html`<p key=${t.seq} className="text-[12.5px] mt-1.5">${nameIn(snapshot,t.user_id)} ${t.user_id===snapshot.user_id?'hast':'hat'} auf ${formOf(t.kind).name} gewechselt · ab ${date(t.effective_day)}</p>`)}`}
  </section>`;
 }
 /* ── Arena 3.0 · Phase 3: Live-Tabelle, Prognose, Gegner-Pokal, Scouting, Live-Hinweis ── */
 /* Live-Tabelle: bestätigter Stand, Abstand nach oben, rechnerisches Maximum, aktive Boni. */
 function LiveTable({snapshot,week,live}){const rows=A.weekly(snapshot,week),fc=A.forecast(snapshot),me=snapshot.user_id;
  const mx=id=>fc?.rows.find(r=>r.user_id===id);
  return html`<section className="card p-4 mt-3" aria-label="Live-Tabelle"><div className="flex items-baseline justify-between gap-2"><h2 className="disp text-[24px]">Live-Tabelle</h2><span className="lbl flex items-center gap-1.5"><span aria-hidden="true" className=${live==='live'?'arena-live':''} style=${{width:7,height:7,borderRadius:4,background:live==='live'?'var(--acc)':'var(--ghost)'}}/>${live==='live'?'Live':'alle 15 s'}</span></div>
   <ol className="mt-3">${rows.map((r,i)=>{const above=rows.slice(0,i).filter(x=>x.score>r.score).at(-1),m=mx(r.user_id),mine=r.user_id===me;
    return html`<li key=${r.user_id} className="flex items-center gap-2 py-2 border-t ln" style=${{borderTopWidth:i?1:0}}>
     <span className="disp text-[20px] w-6 text-center" style=${{color:r.rank===1&&r.score>0?'var(--gold)':'var(--bronze)'}}>${r.rank}</span>
     <span className="flex-1 min-w-0"><b className="block text-[13.5px] truncate" style=${{color:mine?'var(--acc2)':'var(--ink)'}}>${mine?'Du':r.display_name}</b>
      <span className="flex items-center gap-1.5 text-[11px] mute">${r.formation>0&&html`<span title="Formation gemeistert" style=${{color:'var(--gold)'}}>${Ic('aspis',12)}</span>`}${r.momentum>0&&html`<span title="Kampfgeist" style=${{color:'var(--gold)'}}>${Ic('flame',12)}</span>`}${r.combo>0&&html`<span title="Vier Säulen" style=${{color:'var(--gold)'}}>${Ic('column',12)}</span>`}${above?fmt(above.score-r.score)+' bis Platz '+above.rank:r.score>0&&rows.filter(x=>x.rank===1).length===1?'führt':'—'}${m&&m.open>0?' · bis '+fmt(m.max)+' möglich':''}</span></span>
     <span className="num text-[16px] font-bold">${fmt(r.score)}</span></li>`})}</ol>
   <p className="text-[11px] mute mt-2">Zahlen = vom Server bestätigte Wochenpunkte. „Möglich“ ist ein rechnerisches Szenario, kein Ergebnis.</p></section>`}
 /* Prognose: getrennt nach bestätigt und Szenario. Keine Gewinnwahrscheinlichkeit. */
 function Forecast({snapshot}){const fc=A.forecast(snapshot);if(!fc)return null;const me=fc.rows.find(r=>r.user_id===snapshot.user_id);if(!me)return null;
  const others=fc.rows.filter(r=>r.user_id!==me.user_id),above=others.filter(r=>r.now>me.now).sort((a,b)=>a.now-b.now)[0],chaser=others.filter(r=>r.now<=me.now).sort((a,b)=>b.now-a.now)[0];
  const cell=(k,v,sub,col)=>html`<div className="text-center"><span className="lbl block">${k}</span><b className="num block text-[20px]" style=${{color:col}}>${v}</b><span className="text-[10.5px] mute block">${sub}</span></div>`;
  return html`<section className="card p-4 mt-3" aria-label="Prognose"><div className="flex items-baseline justify-between gap-2"><h2 className="disp text-[22px]">Prognose</h2><span className="lbl">noch ${fc.daysLeft} ${fc.daysLeft===1?'Tag':'Tage'}</span></div>
   <div className="grid grid-cols-3 gap-2 mt-3">${cell('Bestätigt',fmt(me.now),'jetzt','var(--ink)')}${cell('Noch möglich','+'+fmt(me.open),'Basis '+fmt(me.maxBase-me.base)+' · Bonus '+fmt(Math.max(0,me.maxBonus-me.bonus)),'var(--acc2)')}${cell('Höchstens',fmt(me.max),'Szenario','var(--gold)')}</div>
   <p className="text-[12.5px] mt-3">${me.best===me.worst?'Platz '+me.best+' steht rechnerisch fest.':'Rechnerisch möglich: Platz '+me.best+' bis '+me.worst+'.'}</p>
   ${above&&html`<p className="text-[12px] mute mt-1">${above.display_name} liegt ${fmt(above.now-me.now)} vorn und kann selbst noch +${fmt(above.open)} holen. ${me.max>above.now?'Vorbeiziehen ist möglich.':'Diese Woche ist der Abstand nicht mehr aufholbar.'}</p>`}
   ${!above&&chaser&&html`<p className="text-[12px] mute mt-1">${chaser.display_name} liegt ${fmt(me.now-chaser.now)} hinter dir und kann noch bis ${fmt(chaser.max)} kommen.</p>`}
   <p className="text-[11px] mute mt-2">Szenario: Jedes offene Soll wird an den verbleibenden Tagen erfüllt, geplante Tage zuerst. Andere können ebenfalls punkten. Keine Vorhersage, keine Garantie.</p></section>`}
 /* Gegner-Pokal: Paarung der Woche, Bilanz, Begegnungen, nächster Gegner. Ohne Zusatzpunkte. */
 function Cup({snapshot,week,onScout}){const me=snapshot.user_id,d=A.duelOf(snapshot,week,me),rec=A.duelRecord(snapshot,me),p=A.phase(snapshot),next=week<4&&p.kind==='running'?A.duelOf(snapshot,week+1,me):null,fc=A.forecast(snapshot);
  const name=id=>nameIn(snapshot,id),open=id=>fc?.rows.find(r=>r.user_id===id)?.open??0;if(!d)return null;
  const res={win:['Sieg','var(--gold)'],loss:['Niederlage','var(--mute)'],draw:['Unentschieden','var(--ink)']};
  return html`<section className="card p-4 mt-3" aria-label="Gegner-Pokal"><div className="flex items-baseline justify-between gap-2"><h2 className="disp text-[24px]">Gegner-Pokal</h2><span className="num text-[12px]">${rec.win}–${rec.draw}–${rec.loss}</span></div>
   <p className="text-[11.5px] mute">Woche ${week} · Bilanz Siege–Unentschieden–Niederlagen</p>
   ${d.bye?html`<p className="text-[13px] mt-3"><b>Freilos.</b> Diese Woche hast du keinen Gegner – das Freilos wandert jede Woche weiter. Deine Wochenpunkte zählen wie immer.</p>`
   :html`<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mt-3 text-center">
     <div><span className="lbl block" style=${{color:'var(--acc2)'}}>Du</span><b className="duel-n num block">${fmt(d.mine)}</b><span className="text-[10.5px] mute">${p.kind==='running'&&!d.closed?'+'+fmt(open(me))+' möglich':''}</span></div>
     <span className="disp text-[18px]" style=${{color:'var(--bronze)'}}>${Ic('swords',22)}</span>
     <div><span className="lbl block truncate">${name(d.opp)}</span><b className="duel-n num block">${fmt(d.theirs)}</b><span className="text-[10.5px] mute">${p.kind==='running'&&!d.closed?'+'+fmt(open(d.opp))+' möglich':''}</span></div></div>
    <p className="text-[12.5px] mt-2 text-center">${d.closed?html`<b style=${{color:res[d.result][1]}}>${res[d.result][0]}</b>`:d.mine===d.theirs?'Gleichstand':d.mine>d.theirs?'Du liegst vorn':name(d.opp)+' liegt vorn'}${!d.closed?' · vorläufig':''}</p>
    ${rec.meetings(d.opp).length>1&&html`<p className="text-[11.5px] mute text-center mt-1">Revanche: ${rec.meetings(d.opp).filter(x=>x.week!==week).map(x=>'Woche '+x.week+(x.result?' '+res[x.result][0]:'')).join(' · ')}</p>`}
    <button type="button" className="chip mx-auto mt-2 flex" onClick=${()=>onScout(d.opp)}>${name(d.opp)} scouten</button>`}
   ${rec.weeks.filter(x=>x.closed).length>0&&html`<h3 className="lbl mt-4">Begegnungen</h3><ul className="mt-1 text-[12.5px] space-y-1">${rec.weeks.filter(x=>x.closed).map(x=>html`<li key=${x.week} className="flex justify-between gap-2"><span>Woche ${x.week} · ${x.bye?'Freilos':'gegen '+name(x.opp)}</span>${!x.bye&&html`<span className="num" style=${{color:res[x.result][1]}}>${fmt(x.mine)} : ${fmt(x.theirs)}</span>`}</li>`)}</ul>`}
   ${next&&html`<p className="text-[12px] mute mt-3">Nächste Woche: ${next.bye?'Freilos':name(next.opp)}</p>`}
   <p className="text-[11px] mute mt-2">Paarungen nach festem Rundenturnier, vor Wochenbeginn bekannt. Verglichen werden nur die normalen Wochenpunkte; die Tabelle bleibt unverändert.</p></section>`}
 /* Scouting: Vergleich nur mit freigegebenen Arena-Daten. */
 function Scouting({snapshot,focus,setFocus}){const me=snapshot.user_id,others=snapshot.members.filter(m=>m.user_id!==me);if(!others.length)return null;
  const opp=others.some(m=>m.user_id===focus)?focus:others[0].user_id,a=A.scout(snapshot,me),b=A.scout(snapshot,opp);if(!a||!b)return null;
  const pct=x=>Math.round(x*100)+' %',rows=[['Ø Wochenpunkte'+(a.provisional?' (vorläufig)':''),fmt(a.avg),fmt(b.avg),a.avg-b.avg],['Beständigkeit',a.activeDays+' / '+a.elapsed+' Tage',b.activeDays+' / '+b.elapsed+' Tage',a.consistency-b.consistency],['Gewonnene Duelle',a.duelWins,b.duelWins,a.duelWins-b.duelWins],['Trend letzte Woche',a.trend==null?'–':(a.trend>=0?'+':'−')+fmt(Math.abs(a.trend)),b.trend==null?'–':(b.trend>=0?'+':'−')+fmt(Math.abs(b.trend)),(a.trend||0)-(b.trend||0)],['Stärkster Bereich',a.strongest?slotOf(a.strongest).name:'–',b.strongest?slotOf(b.strongest).name:'–',0],['Platz Woche · Saison',a.weekRank+' · '+a.seasonRank,b.weekRank+' · '+b.seasonRank,0]];
  const hints=A.catchUp(a,b),labels={avg:g=>'Ø '+fmt(g)+' Wochenpunkte',consistency:g=>g+' aktive Tage',duels:g=>g+' Duellsiege'};
  return html`<section className="card p-4 mt-3" aria-label="Scouting"><h2 className="disp text-[24px]">Scouting</h2>
   <div className="flex flex-wrap gap-1 mt-2" role="group" aria-label="Gegner wählen">${others.map(m=>html`<button key=${m.user_id} type="button" className="chip" aria-pressed=${m.user_id===opp} onClick=${()=>setFocus(m.user_id)}>${m.display_name}</button>`)}</div>
   <div className="overflow-x-auto mt-3"><table className="w-full text-[12.5px] text-left"><thead><tr><th scope="col" className="font-normal mute"></th><th scope="col" className="lbl" style=${{color:'var(--acc2)'}}>Du</th><th scope="col" className="lbl">${nameIn(snapshot,opp)}</th></tr></thead>
    <tbody>${rows.map(([k,x,y,diff])=>html`<tr key=${k} className="border-t ln"><th scope="row" className="py-2 font-normal mute pr-2">${k}</th><td className="num" style=${{fontWeight:diff>0?700:400}}>${x}</td><td className="num" style=${{fontWeight:diff<0?700:400}}>${y}</td></tr>`)}</tbody></table></div>
   <p className="text-[12.5px] mt-3">${hints.length?'Aufholen kannst du bei: '+hints.map(h=>labels[h.key](h.gap)).join(', ')+'.':'Du liegst in allen Vergleichswerten mindestens gleichauf.'}</p>
   <p className="text-[11px] mute mt-2">Nur gemeldete Bereiche, Wochenpunkte und Duelle aus dieser Arena. Keine Ziele, Texte oder Gesundheitsdaten.</p></section>`}
 /* Live-Hinweis nach bestätigten Änderungen: kurz, ein Hinweis zur Zeit, schließbar. */
 function LiveToast({news,onClose}){if(!news)return null;const gold=news.kind!=='points';
  return html`<div role="status" className="arena-toast sticky z-10 mt-2 p-3 flex items-center gap-3" style=${{top:64,borderRadius:14,background:'color-mix(in srgb,'+(gold?'var(--gold)':'var(--acc)')+' 16%,var(--card))',boxShadow:'0 0 0 1px color-mix(in srgb,'+(gold?'var(--gold)':'var(--acc)')+' 50%,transparent) inset'}}>
   <span style=${{color:gold?'var(--gold)':'var(--acc2)'}}>${Ic({formation:'aspis',lead:'crown',leadOther:'crown',record:'laurel',rank:'up',points:'check'}[news.kind]||'check',20)}</span>
   <b className="flex-1 text-[13px]">${news.text}${news.points?' · +'+fmt(news.points):''}</b><button type="button" className="chip" aria-label="Hinweis schließen" onClick=${onClose}>✕</button></div>`}
 /* ── Arena 3.0 · Phase 4: Saisonfinale und Ruhmeshalle ── */
 /* Steintafel: matte Karte mit eingelassener Innenkante. */
 const Tablet=({children,label,gold})=>html`<section aria-label=${label} className="mt-3 p-1" style=${{borderRadius:18,background:'color-mix(in srgb,var(--stone) 10%,var(--card))',border:'1px solid '+(gold?'color-mix(in srgb,var(--gold) 45%,transparent)':'var(--line)')}}><div className="p-3.5" style=${{borderRadius:14,boxShadow:'inset 0 0 0 1px color-mix(in srgb,var(--stone) 22%,transparent)'}}>${children}</div></section>`;
 /* Persönlicher Schild: Initiale, Zeichen der Doktrin, Lorbeer bei Saisonsieg. */
 const PersonalShield=({name,doctrine,titles})=>html`<div className="relative shrink-0" style=${{width:64,height:64}} aria-hidden="true"><svg viewBox="0 0 64 64" width="64" height="64"><circle cx="32" cy="32" r="29" fill="color-mix(in srgb,var(--bronze) 22%,var(--card2))" stroke="var(--bronze)" strokeWidth="2"/><circle cx="32" cy="32" r="22" fill="none" stroke="color-mix(in srgb,var(--stone) 40%,transparent)" strokeWidth="1"/></svg>
  <span className="absolute inset-0 flex items-center justify-center disp text-[24px]" style=${{color:'var(--stone)'}}>${(name||'?').slice(0,1).toUpperCase()}</span>
  ${doctrine&&html`<span className="absolute -bottom-1 -right-1 rounded-full p-1" style=${{background:'var(--card)',color:'var(--bronze)',boxShadow:'0 0 0 1px var(--line)'}}>${Ic(FICON[doctrine],14)}</span>`}
  ${titles>0&&html`<span className="absolute -top-2 left-1/2 -translate-x-1/2" style=${{color:'var(--gold)'}}>${Ic('laurel',20,1.6)}</span>`}</div>`;
 const LICON={title:'crown',best:'trophy',weeks:'laurel',steady:'column',formation:'aspis',duel:'swords',comeback:'rotate',phalanx:'users'};
 /* Saisonfinale: nach Woche 4 oben unter Tabelle – Podest der Saison, eigene Bilanz, verdiente Lorbeeren. */
 function SeasonFinale({snapshot}){const st=A.seasonStats(snapshot,snapshot.user_id);if(!st||!st.finished)return null;const table=A.season(snapshot),top=table.filter(r=>r.rank===1&&r.points>0);
  const own=A.hall([snapshot],snapshot.user_id).laurels;
  return html`<${Tablet} label="Saisonfinale" gold=${true}><div className="text-center"><span style=${{color:'var(--gold)'}}>${Ic('laurel',30,1.5)}</span><div className="lbl mt-1" style=${{color:'var(--gold)'}}>Saisonfinale</div>
   <h2 className="disp-serif text-[24px] mt-1">${top.length?top.map(r=>r.user_id===snapshot.user_id?'Du':r.display_name).join(' & '):'Ohne Sieger'}</h2><p className="text-[12px] mute">${top.length?'Saisonsieg · '+top[0].points+' Tabellenpunkte':'Keine Erfüllungen in dieser Saison.'}</p></div>
   <div className="grid grid-cols-3 gap-2 mt-4 text-center">${[['Platz',st.rank],['Wochensiege',st.weekWins.length],['Duelle',st.duel.win+'–'+st.duel.draw+'–'+st.duel.loss]].map(([k,v])=>html`<div key=${k}><span className="lbl block">${k}</span><b className="num text-[20px]">${v}</b></div>`)}</div>
   <div className="grid grid-cols-3 gap-2 mt-2 text-center">${[['Bestwoche',st.best?fmt(st.best.score):'–'],['Formationen',st.formations],['Phalanx',st.phalanx.length]].map(([k,v])=>html`<div key=${k}><span className="lbl block">${k}</span><b className="num text-[17px]">${v}</b></div>`)}</div>
   ${own.length>0&&html`<ul className="mt-4 space-y-1.5">${own.map(l=>html`<li key=${l.id} className="flex items-start gap-2 text-[12.5px]"><span className="mt-0.5" style=${{color:'var(--gold)'}}>${Ic(LICON[l.kind],16)}</span><span className="min-w-0"><b className="block">${l.title}${l.count?' ×'+l.count:''}${l.value?' · '+fmt(l.value):''}</b><span className="block mute text-[11.5px]">${l.detail}</span></span></li>`)}</ul>`}
   <p className="text-[11px] mute mt-3 text-center">Alle Werte aus abgeschlossenen Wochen dieser Arena. Sie bleiben in deiner Ruhmeshalle.</p></${Tablet}>`}
 /* Ruhmeshalle: alle Saisons der angemeldeten Person – Lorbeeren, Summen, Rivalen, Saisontafeln. */
 function HallOfFame({api,name,onClose}){const [data,setData]=useState(null),[err,setErr]=useState(''),[uid,setUid]=useState(null);
  useEffect(()=>{let on=true;api.hall().then(list=>{if(!on)return;const id=list[0]?.user_id||null;setUid(id);setData(A.hall(list,id))}).catch(e=>on&&setErr(e.message));return()=>{on=false}},[]);
  const h=data,t=h?.totals,doctrine=h?.seasons[0]?.doctrine;
  return html`<section aria-label="Ruhmeshalle" className="mt-3">
   <div className="flex justify-between items-center"><h2 className="disp text-[26px]">Ruhmeshalle</h2><button type="button" className="chip" onClick=${onClose}>Schließen</button></div>
   ${err&&html`<p role="alert" className="card p-3 mt-2 text-[13px]">${err}</p>`}
   ${!h&&!err&&html`<p className="text-[12.5px] mute mt-2" role="status">Wird geladen …</p>`}
   ${h&&!h.seasons.length&&html`<p className="card p-4 mt-2 text-[13px]">Noch keine begonnene Saison. Lorbeeren entstehen aus abgeschlossenen Arena-Wochen.</p>`}
   ${h&&h.seasons.length>0&&html`
    <${Tablet} label="Dein Schild"><div className="flex items-center gap-4"><${PersonalShield} name=${name} doctrine=${doctrine} titles=${t.titles}/>
     <div className="flex-1 min-w-0"><b className="disp-serif text-[18px] block truncate">${name}</b><span className="text-[12px] mute block">${t.seasons} ${t.seasons===1?'Saison':'Saisons'} · ${t.titles} ${t.titles===1?'Titel':'Titel'} · ${t.weekWins} Wochensiege</span><span className="text-[12px] mute block">Duelle ${t.win}–${t.draw}–${t.loss}${h.streak>=2?' · '+h.streak+' starke Wochen in Folge':''}</span></div></div></${Tablet}>
    ${h.laurels.length>0&&html`<${Tablet} label="Lorbeeren" gold=${true}><h3 className="lbl" style=${{color:'var(--gold)'}}>Lorbeeren</h3><ul className="mt-2 grid grid-cols-2 gap-2">${h.laurels.map(l=>html`<li key=${l.id} className="p-2.5 text-center" style=${{borderRadius:12,background:'var(--card)',boxShadow:'0 0 0 1px var(--line) inset'}}><span style=${{color:'var(--gold)'}}>${Ic(LICON[l.kind],22,1.6)}</span><b className="block text-[12.5px] mt-1">${l.title}${l.count?' ×'+l.count:''}</b>${l.value&&html`<b className="num block text-[15px]">${fmt(l.value)}</b>`}<span className="block text-[10.5px] mute leading-snug mt-0.5">${l.detail}</span></li>`)}</ul></${Tablet}>`}
    ${h.rivals.length>0&&html`<${Tablet} label="Rivalen"><h3 className="lbl">Rivalen im Gegner-Pokal</h3><ul className="mt-2 space-y-1.5 text-[13px]">${h.rivals.slice(0,5).map(r=>html`<li key=${r.opp} className="flex justify-between gap-2"><span className="truncate">${r.name}</span><span className="num">${r.win}–${r.draw}–${r.loss}</span></li>`)}</ul><p className="text-[10.5px] mute mt-2">Siege–Unentschieden–Niederlagen über alle Saisons.</p></${Tablet}>`}
    <h3 className="lbl mt-4">Saisontafeln</h3>
    ${h.seasons.map(x=>html`<${Tablet} key=${x.league} label=${'Saison '+x.name} gold=${x.champion}><div className="flex items-baseline justify-between gap-2"><b className="disp text-[18px] truncate">${x.name}</b><span className="lbl shrink-0" style=${{color:x.champion?'var(--gold)':'var(--mute)'}}>${x.champion?'Saisonsieg':x.finished?'Platz '+x.rank:'läuft · '+x.closed+' von 4'}</span></div>
     <p className="text-[11.5px] mute">ab ${date(x.start)} · ${x.members} Krieger</p>
     <p className="text-[12.5px] mt-2">${x.weekWins.length} Wochensiege · Bestwoche ${x.best?fmt(x.best.score):'–'} · Duelle ${x.duel.win}–${x.duel.draw}–${x.duel.loss}${x.formations?' · '+x.formations+' Formationen':''}${x.phalanx.length?' · '+x.phalanx.length+' Phalanx-Wochen':''}</p></${Tablet}>`)}
    <p className="text-[11px] mute mt-3">Nur abgeschlossene Wochen zählen. Alles wird aus den gespeicherten Arena-Meldungen und Wertungen berechnet. Lorbeeren bringen keine Punkte und keinen Vorteil in neuen Saisons.</p>`}
  </section>`}
 function ArenaView({c}){
  const session=c.auth?.session,signed=session?.mode==='supabase',api=G.arenaApi;
  const [list,setList]=useState([]),[snapshot,setSnapshot]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[loaded,setLoaded]=useState(false),[notice,setNotice]=useState('');
  const [name,setName]=useState('Unser Eiserner Kreis'),[displayName,setDisplayName]=useState(session?.name?.slice(0,24)||'Krieger'),[capacity,setCapacity]=useState(3);
  const [online,setOnline]=useState(navigator.onLine!==false);
  const [view,setView]=useState('today'),[opened,setOpened]=useState(0);
  const [live,setLive]=useState('off'),[news,setNews]=useState(null),[focus,setFocus]=useState(null),prevSnap=useRef(null),[hallOpen,setHallOpen]=useState(false);
  useEffect(()=>{const update=()=>setOnline(navigator.onLine!==false);addEventListener('online',update);addEventListener('offline',update);return()=>{removeEventListener('online',update);removeEventListener('offline',update)}},[]);
  const [code,setCode]=useState(()=>{try{return new URL(G.location.href).searchParams.get('arena')||''}catch(e){return''}}),[form,setForm]=useState(''),[confirm,setConfirm]=useState(false);
  const section=useRef(null);
  useEffect(()=>{section.current?.scrollIntoView({block:'start',behavior:'auto'})},[snapshot?.league.id]);
  const active=useRef(true),gate=useRef(false),serial=useRef(0),selected=useRef(null);selected.current=snapshot?.league.id||null;
  useEffect(()=>{active.current=true;return()=>{active.current=false;serial.current++}},[]);
  async function run(fn,apply){if(gate.current)return;gate.current=true;setBusy(true);setError('');const seq=++serial.current;try{const r=await fn();if(active.current&&seq===serial.current){apply(r);setLoaded(true)}}catch(e){if(active.current&&seq===serial.current)setError(e.message||'Die Arena konnte nicht geladen werden.')}finally{gate.current=false;if(active.current&&seq===serial.current)setBusy(false)}}
  const open=s=>{prevSnap.current=null;setFocus(null);setSnapshot(s);setForm('');setConfirm(false);setNotice('');setView('today');setOpened(0)};
  useEffect(()=>{if(signed)run(()=>api.list(),setList)},[signed]);
  useEffect(()=>{if(!signed||!snapshot)return;const id=snapshot.league.id;const refresh=()=>{if(document.visibilityState==='hidden'||navigator.onLine===false||gate.current)return;run(()=>api.load(id),s=>{if(selected.current===id)setSnapshot(s)})};const interval=setInterval(refresh,live==='live'?30000:15000);addEventListener('focus',refresh);addEventListener('online',refresh);document.addEventListener('visibilitychange',refresh);return()=>{clearInterval(interval);removeEventListener('focus',refresh);removeEventListener('online',refresh);document.removeEventListener('visibilitychange',refresh)}},[signed,snapshot?.league.id,live]);
  /* Live: Realtime-Signal lädt den bestätigten Stand neu (gebündelt); ohne Realtime bleibt die Abfrage alle 15 s. */
  useEffect(()=>{if(!signed||!snapshot)return;const id=snapshot.league.id;let timer;const pull=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(document.visibilityState==='hidden')return;if(gate.current)return pull();run(()=>api.load(id),s=>{if(selected.current===id)setSnapshot(s)})},400)};
   const stop=api.watch(id,pull,setLive);return()=>{clearTimeout(timer);stop();setLive('off')}},[signed,snapshot?.league.id]);
  /* Live-Hinweis: nur aus dem Vergleich zweier bestätigter Stände, höchstens einer, verschwindet nach 4,5 s. */
  useEffect(()=>{if(!snapshot)return;const n=A.liveNews(prevSnap.current,snapshot);prevSnap.current=snapshot;if(n)setNews({...n,at:Date.now()})},[snapshot]);
  useEffect(()=>{if(!news)return;const t=setTimeout(()=>setNews(null),4500);return()=>clearTimeout(t)},[news]);
  const change=fn=>run(fn,s=>{setSnapshot(s);setConfirm(false);setNotice('Gespeichert.')});
  const p=snapshot&&A.phase(snapshot),week=p?.week||1,rows=snapshot&&A.weekly(snapshot,week),me=rows?.find(r=>r.user_id===snapshot.user_id),own=snapshot?.league.owner_id===snapshot?.user_id;
  const allReady=snapshot&&snapshot.members.length>=2;
  const share=snapshot?A.invitation(snapshot.league.invite_code,G.location.origin+G.location.pathname):'';
  const tab=p?.kind==='finished'&&view==='today'?'table':view;
  const closed=p?.closed||0,gains=snapshot&&p.kind==='running'?A.gains(snapshot):[];
  const report=(slot,done)=>change(()=>api.report(snapshot.league.id,slot,done)),v3=snapshot?.league.rule_version===3;
  const saveFormation=(w,k,sl,plan)=>change(()=>api.formation(snapshot.league.id,w,k,sl,plan));
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
    <button type="button" className="card w-full mt-3 p-3 flex items-center gap-3 text-left" onClick=${()=>setHallOpen(!hallOpen)} aria-expanded=${hallOpen}><span style=${{color:'var(--gold)'}}>${Ic('laurel',24,1.6)}</span><span className="flex-1"><b className="block text-[14px]">Ruhmeshalle</b><span className="block text-[11.5px] mute">Lorbeeren, Rivalen und alle deine Saisons</span></span>${Ic('chevR',16)}</button>
    ${hallOpen&&html`<${HallOfFame} api=${api} name=${displayName} onClose=${()=>setHallOpen(false)}/>`}
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
    <${LiveToast} news=${news} onClose=${()=>setNews(null)}/>
    ${tab==='today'&&p.kind==='running'&&html`
     ${fresh>0&&html`<${FreshBanner} snapshot=${snapshot} week=${fresh} onOpen=${()=>{setOpened(fresh);setView('table');markSeen()}} onDismiss=${markSeen}/>`}
     <${Finale} snapshot=${snapshot}/>
     <${Stage} rows=${rows} me=${snapshot.user_id}/>
     <${HeadToHead} rows=${rows} me=${snapshot.user_id}/>
     <${MyRounds} snapshot=${snapshot} week=${week}/>
     <${Voice} rows=${rows} me=${snapshot.user_id} gains=${gains}/>
     <${NextMove} gains=${gains} busy=${busy} onReport=${report}/>
     <${FateRow} snapshot=${snapshot} week=${week} me=${snapshot.user_id}/>
     <section className="mt-4" aria-label="Deine Erfüllungen heute"><div className="flex items-baseline justify-between gap-2"><h2 className="disp text-[22px]">Heute melden</h2><span className="lbl">1× pro Tag</span></div><${SlotTiles} snapshot=${snapshot} week=${week} me=${me} busy=${busy} gains=${gains} onReport=${report}/>${(()=>{const on=c.S.arenaAuto===true;return html`<button type="button" role="switch" aria-checked=${on} onClick=${()=>c.upd(n=>{n.arenaAuto=!on})} className="w-full flex items-center gap-3 mt-2 px-3 py-2.5 text-left border-0" style=${{borderRadius:14,background:'transparent',boxShadow:'0 0 0 1px var(--line) inset',color:'var(--ink)'}}><span className="flex-1 min-w-0"><b className="block text-[13px]">Automatisch aus Aufgaben</b><span className="block text-[11.5px] mute">Erledigte Aufgaben mit bekannter Dauer zählen mit.</span></span><span className="shrink-0 rounded-full relative" style=${{width:40,height:24,background:on?'var(--acc)':'var(--ghost)',boxShadow:'0 0 0 1px var(--line) inset',transition:'background .2s'}}><span className="absolute rounded-full" style=${{top:3,left:on?19:3,width:18,height:18,background:'var(--ink)',transition:'left .2s'}}/></span></button>`})()}</section>
     ${v3&&html`<${Tactics} key=${snapshot.league.id+'-t'+week} snapshot=${snapshot} week=${week} me=${me} busy=${busy} onSwitch=${(k,sl,plan)=>change(()=>api.switchFormation(snapshot.league.id,k,sl,plan))}/><${FormationPrep} key=${snapshot.league.id+'-p'+week} snapshot=${snapshot} busy=${busy} onSave=${saveFormation}/>`}
    `}
    ${tab==='table'&&html`
     <${SeasonFinale} snapshot=${snapshot}/>
     ${v3&&p.kind==='running'&&html`<${LiveTable} snapshot=${snapshot} week=${week} live=${live}/><${Forecast} snapshot=${snapshot}/>`}
     <div className="card p-4 mt-3"><div className="flex items-baseline justify-between gap-2"><h2 className="disp text-[24px]">${p.kind==='finished'?'Letzte Spielwoche':'Kampfplatz'}</h2><span className="lbl">Woche ${week}${p.kind==='running'?' · vorläufig':''}</span></div><${Podium} rows=${rows} me=${snapshot.user_id}/>${rows.length>3&&html`<ol className="mt-3 space-y-1.5">${rows.slice(3).map(r=>html`<li key=${r.user_id} className="flex gap-2 items-center text-[13px]"><span className="num w-5 mute">${r.rank}.</span><b className="flex-1 min-w-0 truncate">${r.display_name}${r.user_id===snapshot.user_id?' · du':''}</b><span className="num">${fmt(r.score)}</span></li>`)}</ol>`}</div>
     <${WeekGrid} snapshot=${snapshot} week=${week}/>
     <div className="card p-4 mt-3"><div className="flex items-baseline justify-between gap-2"><h2 className="disp text-[22px]">Saisontabelle</h2><span className="lbl">${closed} von 4 gewertet</span></div><ol className="mt-3 space-y-2">${A.season(snapshot).map(r=>html`<li key=${r.user_id} className="flex gap-2 text-[13px]"><span className="num">${r.rank}.</span><b className="flex-1 break-words">${r.display_name}${r.user_id===snapshot.user_id?' · du':''}</b><span className="num">${r.points} Pkt.</span></li>`)}</ol><p className="text-[11.5px] mute mt-2">Platz 1–3 einer Woche erhält 3, 2, 1 Punkte.</p>${p.kind==='finished'&&html`<p className="text-[13px] mt-3" style=${{color:'var(--gold)'}}>${A.season(snapshot).some(r=>r.points>0)?'Saisonsieg: '+A.season(snapshot).filter(r=>r.rank===1).map(r=>r.display_name).join(' und '):'Keine Erfüllungen in dieser Saison.'}</p><p className="text-[12px] mute mt-1">Eine neue Runde könnt ihr über „Meine Arenen“ erstellen.</p>`}</div>
     ${closed>0&&html`<details key=${'cer-'+opened} open=${opened>0} className="card p-4 mt-3"><summary className="text-[14px] font-semibold">Wochenzeremonien</summary>${Array.from({length:closed},(_,i)=>closed-i).map(w=>html`<${Ceremony} key=${snapshot.league.id+'-'+w} snapshot=${snapshot} week=${w}/>`)}</details>`}
     <${Scoring} snapshot=${snapshot} week=${week}/>
    `}
    ${tab==='duel'&&html`<${Cup} snapshot=${snapshot} week=${week} onScout=${id=>{setFocus(id);setTimeout(()=>document.querySelector('[aria-label="Scouting"]')?.scrollIntoView({behavior:'smooth',block:'start'}),0)}}/><${Scouting} snapshot=${snapshot} focus=${focus} setFocus=${setFocus}/>`}
    ${tab==='log'&&html`
     ${p.kind==='running'&&A.awards(snapshot,week).comebacks.map(m=>html`<div key=${m.user_id} className="card p-3 mt-3 text-[13px]" style=${{color:'var(--gold)'}}><b>Comeback-Lorbeer · ${m.display_name}</b><p className="text-[12px] mute mt-1">Nach mindestens zwei freien Tagen wieder drei Tage in Folge aktiv. Ohne Zusatzpunkte.</p></div>`)}
     ${v3&&html`<${ScoreFeed} key=${snapshot.league.id} snapshot=${snapshot} api=${api}/>`}
     <${Battle} key=${snapshot.league.id} snapshot=${snapshot} busy=${busy} onReact=${(ev,kind)=>change(()=>api.react(snapshot.league.id,ev,kind))}/>
    `}
    `}
    ${v3&&(p.kind==='lobby'||p.kind==='scheduled')&&html`<${Doctrine} key=${snapshot.league.id+'-d'} snapshot=${snapshot} busy=${busy} onSave=${k=>change(()=>api.doctrine(snapshot.league.id,k))}/>`}
    ${v3&&p.kind==='scheduled'&&html`<${FormationPrep} key=${snapshot.league.id+'-p0'} snapshot=${snapshot} busy=${busy} onSave=${saveFormation}/>`}
    ${(p.kind==='lobby'||p.kind==='scheduled')&&html`<${GroupTargets} key=${snapshot.league.id+'-'+JSON.stringify(A.targetsOf(snapshot))} snapshot=${snapshot} editable=${own&&p.kind==='lobby'} busy=${busy} onSave=${t=>change(()=>api.setTargets(snapshot.league.id,t))}/>`}
   `}
   `}
   <button type="button" className="ghost w-full py-3 mt-4 text-[13px]" onClick=${()=>c.setTab('solo')}>Persönlichen Planvergleich öffnen</button>
   <details className="card p-4 mt-4 text-[12px]"><summary className="text-[14px] font-semibold">So wird gespielt</summary><p className="mt-2">Montag bis Sonntag, vier Wochen lang. Jeder erfüllte Tag zählt anteilig zum festen Platzwert von 25 Arenapunkten. Zusätzliche Aufgaben über das Soll hinaus erzeugen keinen Vorteil. Bei Gleichstand wird der Platz geteilt; der nächste Platz wird übersprungen. Außerhalb der ersten drei Plätze gibt es keine Tabellenpunkte.</p><p className="mt-2">Alle spielen mit demselben Soll, das der Gründer vor dem Start festlegt. So bedeutet gleiche Punktzahl gleichen Aufwand. Ergebnisse sind selbst gemeldet und nicht durch Geräte bestätigt. Es gibt keine Geldbeträge, Einsätze oder Auswirkungen auf deinen persönlichen Fortschritt.</p><p className="mt-2"><b>Orakel:</b> Jeden Tag zählt ein Bereich ×1,5 – für alle derselbe, ab Mitternacht sichtbar. <b>Wochenprämie:</b> Wer in der Woche als Erste:r das Soll des ausgelosten Bereichs erfüllt, erhält +5 Arenapunkte. Beides wird aus Arena und Datum berechnet und lässt sich nicht beeinflussen.</p><p className="mt-2"><b>Automatisch:</b> Nur wenn du es einschaltest. Dann zählt eine erledigte passende Aufgabe mit bekannter Dauer in laufenden Arenen mit; „Rückgängig“ nimmt nur diese automatische Meldung zurück. Finanzen haben keinen Arenaplatz.</p><p className="mt-2"><b>Arena 3.0:</b> Pro Woche höchstens 100 Basis- und 15 Bonuspunkte. Vor Montag wählst du eine Formation (Schildwall, Speerspitze oder Wächter, je +6) und deinen Wochenplan; ab Montag ist sie gesperrt. Kampfgeist (+4): drei geplante Tage in Folge erfüllt, Ruhetage unterbrechen nicht. Vier Säulen (+5): in drei Bereichen das volle Soll. Kriegsrat: einmal pro Woche bis Donnerstag die Formation wechseln; sie gilt ab dem nächsten Tag und nur für künftige Meldungen. Die Doktrin vor dem Saisonstart ist nur Vorauswahl und Zeichen, ohne Punkte. Alle Punkte berechnet der Server.</p><p className="mt-2"><b>Nächster Zug:</b> zeigt, welcher Bereich dir heute die meisten Arenapunkte bringt – mit derselben Wertung wie die Tabelle.</p><p className="mt-2">Ruhetage bleiben frei. Die Arena erinnert dich nicht automatisch und erzeugt keine Bonuspunkte für späte Einträge. Persönliche Reflexionen, Ziele und Zukunftstexte werden nicht übertragen.</p></details>
  </section>`;
 }
 G.ArenaView=ArenaView;
})(window);
