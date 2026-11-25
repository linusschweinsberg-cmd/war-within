/* Arena 3.0, Phase 4: Ruhmeshalle, Saisonstatistik, Saisonfinale, Auszeichnungen. Echte Migration und Testdaten in PGlite.
   Kontaktiert nie Supabase. */
const {PGlite}=require('@electric-sql/pglite'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {seedArena}=require('./arena-seed.cjs');
const ctx=vm.createContext({URL});vm.runInContext(fs.readFileSync(path.join(__dirname,'../arena-core.js'),'utf8'),ctx);const A=ctx.ArenaCore;
const ids=['10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000004'],names=['Linus','Jonas','Mira'];
(async()=>{const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;insert into auth.users values ${ids.map(id=>"('"+id+"')").join(',')};`);
 for(const f of ['202611230001_arena.sql','202611230002_arena_v3.sql'])await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations',f),'utf8'));
 await seedArena(db,ids.slice(0,3),names);
 const as=async(i,role='authenticated')=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[i==null?'':ids[i]]);await db.exec('set role '+role)};
 const hallOf=async i=>{await as(i);return(await db.query('select public.arena_hall() as data')).rows[0].data};
 /* Server: nur eigene, begonnene Arenen; Lobby nicht; Fremde und Gäste nichts */
 const snaps=await hallOf(0);assert.deepEqual(snaps.map(s=>s.league.name),['Die Dreihundert','Erste Schlacht'],'neueste zuerst, ohne Lobby');
 assert.ok(snaps.every(s=>s.user_id===ids[0]));assert.deepEqual(await hallOf(3),[],'fremdes Konto sieht nichts');
 await as(null,'anon');await assert.rejects(db.query('select public.arena_hall()'),/permission denied/);
 assert.equal(/email|password|audit|vision|access_token/.test(JSON.stringify(snaps)),false,'keine privaten Felder');
 /* Ableitungen */
 const before=JSON.stringify(snaps),h=A.hall(snaps,ids[0]);assert.equal(JSON.stringify(snaps),before,'rein lesend');
 assert.equal(h.totals.seasons,2);assert.equal(h.totals.finished,1);
 const done=h.seasons.find(x=>x.finished),running=h.seasons.find(x=>!x.finished);assert.equal(done.name,'Erste Schlacht');assert.equal(done.closed,4);assert.equal(running.closed,2);
 const fin=snaps.find(s=>s.league.name==='Erste Schlacht');
 /* Saisonsieg und Wochensiege stimmen mit Tabelle und Wochenwertung überein */
 const sea=A.season(fin).find(r=>r.user_id===ids[0]);assert.equal(done.rank,sea.rank);assert.equal(done.champion,sea.rank===1&&sea.points>0);
 for(const w of [1,2,3,4]){const r=A.weekly(fin,w).find(x=>x.user_id===ids[0]);assert.equal(done.weekWins.includes(w),r.rank===1&&r.score>0,'Wochensieg Woche '+w)}
 assert.equal(h.totals.titles,h.seasons.filter(x=>x.champion).length);assert.equal(h.laurels.filter(l=>l.kind==='title').length,h.totals.titles);
 assert.equal(h.totals.weekWins,h.seasons.reduce((n,x)=>n+x.weekWins.length,0));
 /* Bestwoche ist die höchste abgeschlossene Wochenwertung */
 const all=snaps.flatMap(s=>Array.from({length:A.phase(s).closed},(_,i)=>A.weekly(s,i+1).find(r=>r.user_id===ids[0]).score));assert.equal(h.best.score,Math.max(...all));
 /* Laufende Woche zählt nicht */
 const cur=snaps.find(s=>s.league.name==='Die Dreihundert'),p=A.phase(cur);assert.equal(running.weekBases.length,p.closed);
 /* Duelle: Rivalen summieren sich zur Gesamtbilanz; nur abgeschlossene Wochen ohne Freilos */
 const rs=h.rivals.reduce((n,r)=>({win:n.win+r.win,loss:n.loss+r.loss,draw:n.draw+r.draw}),{win:0,loss:0,draw:0});assert.deepEqual(rs,{win:h.totals.win,loss:h.totals.loss,draw:h.totals.draw});
 assert.ok(h.rivals.every(r=>r.opp!==ids[0]&&r.n===r.win+r.loss+r.draw));
 /* Formationen gemeistert = Wochen mit Formationsbonus */
 assert.equal(done.formations,[1,2,3,4].filter(w=>A.weekly(fin,w).find(r=>r.user_id===ids[0]).formation>0).length);
 /* Phalanx-Woche: alle Mitglieder ≥ 60 Basispunkte */
 for(const w of done.phalanx)assert.ok(A.weekly(fin,w).every(r=>r.base>=600));
 /* Beständigkeit: Wochen in Folge ≥ 60 Basis, Lücken und schwache Wochen unterbrechen, Überschneidungen zählen einmal */
 const syn=[{start:'2026-01-05',base:700},{start:'2026-01-12',base:650},{start:'2026-01-19',base:500},{start:'2026-01-26',base:900},{start:'2026-02-02',base:600},{start:'2026-02-09',base:610},{start:'2026-02-23',base:800}];
 const streakOf=list=>{const m=new Map();for(const w of list)m.set(w.start,Math.max(m.get(w.start)||0,w.base));let best=0,run=0,prev=null;for(const d of [...m.keys()].sort()){const ok=m.get(d)>=600;run=ok?(prev&&Date.parse(d)-Date.parse(prev)===7*864e5&&run>0?run+1:1):0;prev=ok?d:null;best=Math.max(best,run)}return best};
 assert.equal(streakOf(syn),3,'26.1.–9.2.');
 const viaHall=A.hall([],'u');assert.equal(viaHall.streak,0);assert.equal(viaHall.laurels.length,0);
 /* Ruhmeshalle-Folge entspricht derselben Regel auf echten Daten */
 assert.equal(h.streak,streakOf(h.seasons.flatMap(x=>x.weekBases)));
 /* Lobby und vorgemerkte Saison liefern keine Statistik; Nichtmitglied auch nicht */
 assert.equal(A.seasonStats({...fin,league:{...fin.league,start_date:null}},ids[0]),null);assert.equal(A.seasonStats(fin,ids[3]),null);
 /* Jede Auszeichnung hat Titel und nachvollziehbare Herkunft */
 assert.ok(h.laurels.every(l=>l.title&&l.detail));
 console.log('PASS Arena 3.0 Phase 4: arena_hall (nur eigene begonnene Saisons, Fremde/Gäste ausgeschlossen, keine privaten Felder), Saisonsieg/Wochensiege/Bestwoche/Formationen/Phalanx aus der echten Wertung, laufende Woche ausgeschlossen, Rivalen = Duellbilanz, Beständigkeitsfolge, lesend');
 }finally{await db.close()}})().catch(e=>{console.error(e);process.exitCode=1});
