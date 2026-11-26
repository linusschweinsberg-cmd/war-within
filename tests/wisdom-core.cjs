/* Szenarien für Wisdom of the Warrior: node tests/wisdom-core.cjs */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const dir=require('path').join(__dirname,'..');
const c=vm.createContext({console});
vm.runInContext(fs.readFileSync(dir+'/life-core.js','utf8'),c);vm.runInContext(fs.readFileSync(dir+'/wisdom-core.js','utf8'),c);
const LC=c.LC,WC=c.WC;
const base=()=>WC.ensure(LC.ensureLife({day:0,acts:{body:{cat:'fit'},rel:{cat:'rel'},fin:{cat:'fin'},lang:{cat:'intel'},disc:{cat:'char'}},missions:[]}));
const tpl=id=>JSON.parse(JSON.stringify(LC.GOAL_TPL.find(t=>t.id===id)));
const withGoal=()=>{const S=base();const x=tpl('run5k');LC.addGoal(S,{...x,tpl:x.id,start:1620});return S};
const show=(S,place,x)=>{const r=WC.resolve(S,place,x);if(r&&!r.recorded)WC.record(S,r);return r};
const next=S=>{LC.onAdvance(S)};
const ok=[];const t=(name,fn)=>{fn();ok.push(name)};

t('Bibliothek: 60–80 Einträge, vollständige Felder, eindeutige IDs',()=>{
 assert.ok(WC.LIB.length>=60&&WC.LIB.length<=80,'Anzahl '+WC.LIB.length);
 assert.equal(new Set(WC.LIB.map(w=>w.id)).size,WC.LIB.length);assert.equal(new Set(WC.LIB.map(w=>w.text)).size,WC.LIB.length,'keine doppelten Texte');
 WC.LIB.forEach(w=>{assert.ok(WC.CAT[w.category],w.id);assert.ok(w.text.length>10&&w.text.length<=120,w.id+' kurz');assert.ok(w.triggers.length&&w.triggers.every(x=>WC.TRIGGERS.includes(x)),w.id);
  assert.ok([1,2,3].includes(w.priority));assert.equal(w.language,'de');assert.ok(w.icon);assert.ok(!/[–-]\s*(Seneca|Mark Aurel|Epiktet|Sun Tzu|Aristoteles|Platon|Sokrates)/.test(w.text),'keine Zuschreibungen')});
 ['daily_briefing','missed_task','daily_reflection','milestone','new_season','recovery'].forEach(tr=>assert.ok(WC.LIB.filter(w=>w.triggers.includes(tr)).length>=7,'genug Auswahl für '+tr))});

t('Psychologisch verantwortbar: keine Schmerz- oder Überforderungsbotschaften',()=>{
 const bad=/Schmerz|no pain|bis zur Erschöpfung|keine Pause|nie(mals)? aufgeben|keine Ausreden|härter als|bestraf|Schande|faul/i;
 WC.LIB.forEach(w=>assert.ok(!bad.test(w.text+' '+(w.explanation||'')),w.id));
 const blame=/Ausrede|enttäusch|Entschuldigung|selbst schuld|hättest/i;
 WC.LIB.filter(w=>w.triggers.includes('missed_task')).forEach(w=>assert.ok(!blame.test(w.text+' '+(w.explanation||'')),'beschämend: '+w.id))});

t('1+2: Daily Briefing zeigt eine passende Weisheit',()=>{const S=withGoal();const r=show(S,'today');
 assert.ok(r);assert.ok(r.w.triggers.includes('daily_briefing'));assert.equal(WC.context(S,'today').trigger,'daily_briefing');
 assert.ok(['ownership','discipline'].includes(r.w.category),'bevorzugt Eigenverantwortung/Disziplin');
 const again=WC.resolve(S,'today');assert.equal(again.w.id,r.w.id);assert.equal(again.recorded,true,'stabil über den Tag')});

t('3: Schließen blendet den Impuls für heute aus, morgen kommt ein neuer',()=>{const S=withGoal();show(S,'today');WC.dismiss(S,'today');
 assert.equal(WC.resolve(S,'today'),null);next(S);assert.ok(WC.resolve(S,'today'))});

t('Regel 3: höchstens ein regulärer Impuls pro Tag',()=>{const S=withGoal();const a=show(S,'today');for(let i=0;i<5;i++)assert.equal(show(S,'today').w.id,a.w.id);
 assert.equal(S.wisdom.seen.filter(s=>s.place==='today').length,1)});

t('4: keine Wiederholung innerhalb von 7 Tagen',()=>{const S=withGoal();const ids=[];for(let d=0;d<21;d++){ids.push(show(S,'today').w.id);next(S)}
 for(let i=0;i<ids.length;i++)for(let j=i+1;j<Math.min(ids.length,i+7);j++)assert.notEqual(ids[i],ids[j],'Tag '+i+' und '+j);
 assert.ok(new Set(ids).size>=12,'Abwechslung')});

t('4b: bei zu wenig Alternativen die am längsten nicht gezeigte',()=>{const S=withGoal();const ctx={trigger:'new_season',prefer:[]};const pool=WC.LIB.filter(w=>w.triggers.includes('new_season'));
 pool.forEach((w,i)=>S.wisdom.seen.push({id:w.id,d:i===0?S.life.d-6:S.life.d-1,place:'x'}));
 assert.equal(WC.choose(S,ctx).id,pool[0].id)});

t('5: verpasste Aufgabe → Wiedereinstieg, ohne Schuldzuweisung',()=>{const S=withGoal();LC.onDebrief(S,{mood:'ok',obst:['time'],done:[],skipped:['m_x']});next(S);
 const ctx=WC.context(S,'today');assert.equal(ctx.trigger,'missed_task');assert.ok(!/verpasst|versäumt|nicht geschafft/i.test(ctx.reason),'neutraler Anlass');
 const r=show(S,'today');assert.ok(r.w.triggers.includes('missed_task'))});

t('F: Erholung nur, wenn der Nutzer selbst wenig Energie notiert',()=>{const S=withGoal();
 for(let i=0;i<4;i++){LC.onDebrief(S,{mood:'hard',obst:['time'],done:[],skipped:['m_x']});next(S)}
 assert.notEqual(WC.context(S,'today').trigger,'recovery','verpasste Aufgaben allein → keine Erschöpfung');
 LC.onDebrief(S,{mood:'hard',obst:['energy'],done:[],skipped:['m_x']});next(S);const r=show(S,'today');assert.equal(r.w.category,'recovery');assert.match(r.reason,/Energie notiert/);
 const T=base();T.rest=[0];assert.equal(WC.context(T,'today').trigger,'recovery','bewusster Ruhetag')});

t('6: Daily Debrief zeigt einen passenden Reflexionsimpuls',()=>{const S=withGoal();
 const all=WC.resolve(S,'debrief',{planned:3,done:3});assert.ok(all.w.triggers.includes('daily_reflection'));assert.ok(['competence','self_efficacy','compounding'].includes(all.w.category));
 const part=WC.resolve(S,'debrief',{planned:3,done:1});assert.ok(['feedback','reflection','resilience'].includes(part.w.category));
 const none=WC.resolve(S,'debrief',{planned:0,done:0});assert.equal(none.w.category,'reflection');
 WC.record(S,part);assert.equal(WC.resolve(S,'debrief').w.id,part.w.id,'Reflexion zeigt nach dem Debrief denselben Impuls')});

t('7: Meilenstein löst einen passenden Hinweis aus, Routine-Woche nicht',()=>{const S=withGoal();const L=S.life;
 L.temple.cur.ms.push({id:'week-x',area:'health',kind:'week',pts:1,label:'Konstante Woche',wk:0,t:1});assert.equal(WC.resolve(S,'milestone'),null,'Erledigen allein belohnt nicht');
 L.temple.cur.ms.push({id:'goal-x',area:'health',kind:'goal',pts:3,label:'Ziel erreicht',wk:0,t:2});
 const r=show(S,'milestone');assert.ok(r.w.triggers.includes('milestone'));assert.ok(['competence','self_efficacy'].includes(r.w.category));assert.match(r.reason,/Ziel erreicht/);
 next(S);assert.equal(WC.resolve(S,'milestone'),null,'derselbe Meilenstein nur einmal');
 for(let i=0;i<14;i++)next(S);L.temple.cur.ms.push({id:'old',area:'health',kind:'quarter',pts:2,label:'x',wk:0,t:3});assert.equal(WC.resolve(S,'milestone'),null,'nur aktuelle Meilensteine')});

t('E: neue Tempel-Saison → Impuls zu Geduld und Compounding',()=>{const S=withGoal();assert.equal(WC.resolve(S,'season'),null,'erste Saison: kein Saisonimpuls');
 for(let i=0;i<7;i++)next(S);LC.closeTempleSeason(S,12);const r=show(S,'season');assert.ok(r.w.triggers.includes('new_season'));assert.match(r.reason,/Saison 2/);
 for(let i=0;i<8;i++)next(S);assert.equal(WC.resolve(S,'season'),null)});

t('8: Favoriten bleiben nach Neuladen erhalten',()=>{const S=withGoal();const r=show(S,'today');WC.toggleFav(S,r.w.id);WC.toggleFav(S,WC.LIB[5].id);WC.toggleFav(S,'gibt_es_nicht');
 const R=WC.ensure(JSON.parse(JSON.stringify(S)));assert.deepEqual([...R.wisdom.fav],[r.w.id,WC.LIB[5].id]);assert.ok(WC.isFav(R,r.w.id));
 WC.toggleFav(R,r.w.id);assert.ok(!WC.isFav(R,r.w.id));assert.equal(WC.readList(R)[0].id,r.w.id,'gelesene Inhalte wieder abrufbar')});

t('9: vollständig deaktivierbar',()=>{const S=withGoal();WC.setOn(S,false);['today','debrief','milestone','season'].forEach(p=>assert.equal(WC.resolve(S,p,{planned:1,done:1}),null));
 const R=WC.ensure(JSON.parse(JSON.stringify(S)));assert.equal(WC.enabled(R),false,'Einstellung bleibt gespeichert');WC.setOn(R,true);assert.ok(WC.resolve(R,'today'))});

t('11: ohne Kontextdaten keine erfundene Analyse',()=>{const S=base();const ctx=WC.context(S,'today');assert.equal(ctx.trigger,'neutral');assert.equal(ctx.reason,'','kein erfundener Anlass');
 assert.equal(WC.context(S,'debrief'),null,'kein Debrief-Impuls ohne dokumentierten Tag');assert.equal(WC.resolve(S,'milestone'),null);assert.equal(WC.resolve(S,'season'),null);
 const r=WC.resolve(S,'today');assert.ok(r.w.triggers.includes('neutral'))});

t('Tempel: Lesen und Favoriten erzeugen keinen Fortschritt',()=>{const S=withGoal();const before=JSON.stringify(LC.templeState(S)),life=JSON.stringify(S.life);
 for(let i=0;i<3;i++){const r=show(S,'today');WC.toggleFav(S,r.w.id);show(S,'debrief',{planned:2,done:2});LC.syncTemple(S);next(S)}
 S.life.d-=3;assert.equal(JSON.stringify(LC.templeState(S)),before);assert.equal(JSON.stringify(S.life),life)});

t('Migration: alter Spielstand ohne wisdom, kaputte Daten',()=>{const S=LC.ensureLife({day:0,missions:[]});assert.ok(WC.resolve(S,'today'),'funktioniert auch ohne ensure');WC.ensure(S);assert.equal(S.wisdom.on,true);
 S.wisdom={on:'ja',fav:'x',seen:[{id:'weg',d:1},null,{id:WC.LIB[0].id,d:2}],slots:null};WC.ensure(S);assert.equal(S.wisdom.on,true);assert.deepEqual([...S.wisdom.fav],[]);assert.equal(S.wisdom.seen.length,1);
 const snap=JSON.stringify(S.wisdom);WC.ensure(S);assert.equal(JSON.stringify(S.wisdom),snap,'idempotent')});

t('Einbindung: Skript, Service Worker, Codex-Sheet',()=>{const h=fs.readFileSync(dir+'/index.html','utf8'),sw=fs.readFileSync(dir+'/sw.js','utf8');assert.ok(h.includes('<script src="wisdom-core.js?v=ww-v119"></script>'));assert.ok(sw.includes("'./wisdom-core.js?v=ww-v119'"));assert.ok(h.includes("case'codex'"));['place="today"','place="debrief"','place="milestone"','place="season"'].forEach(p=>assert.ok(h.includes(p),p))});

console.log('PASS wisdom: '+ok.join(' · '));
