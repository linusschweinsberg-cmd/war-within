/* Arena 3.0, Phase 3: Prognose, Gegner-Pokal (Freilos/Rotation), Scouting, Live-Hinweise, Realtime-Abo mit Rückfall
   und Realtime-Publikation in der echten Migration (PGlite). Kontaktiert nie Supabase. */
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),{PGlite}=require('@electric-sql/pglite');
const ctx=vm.createContext({URL});for(const f of ['arena-core.js','arena-api.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx);const A=ctx.ArenaCore;
const addDays=(d,n)=>new Date(Date.parse(d+'T00:00:00Z')+n*864e5).toISOString().slice(0,10);
const today='2026-11-25',start=addDays(today,-9);/* Mittwoch, Woche 2 */
const targets={mind:3,body:3,growth:2,bonds:2};
const members=['a','b','c'].map((x,i)=>({user_id:'u-'+x,display_name:['Linus','Jonas','Mira'][i]}));
let n=0;const at=(day,h=8)=>new Date(Date.parse(day+'T00:00:00Z')+h*36e5+(n++)*1000).toISOString();
const c=(u,w,slot,d)=>{const day=addDays(start,(w-1)*7+d-1);return{id:'e'+(n+1),user_id:u,week:w,slot,day,created_at:at(day)}};
const comp=[
 ...['mind','body','growth','bonds'].flatMap(k=>[1,2].map(d=>c('u-a',1,k,d))),c('u-a',1,'mind',3),c('u-a',1,'body',3),
 ...['mind','body'].flatMap(k=>[1,2,3].map(d=>c('u-b',1,k,d))),c('u-b',1,'growth',1),
 c('u-c',1,'mind',1),
 c('u-a',2,'mind',1),c('u-a',2,'body',2),c('u-b',2,'mind',1),c('u-b',2,'mind',2),c('u-b',2,'body',1),c('u-b',2,'growth',3)];
const plan={mind:[1,2,3],body:[1,2,3],growth:[1,2],bonds:[1,2]};
const base={league:{id:'30000000-0000-4000-8000-000000000300',start_date:start,targets,rule_version:3},members,today,user_id:'u-a',completions:comp,
 formations:[{user_id:'u-a',week:1,kind:'guardian',slot:'mind',plan},{user_id:'u-a',week:2,kind:'shield',slot:'mind',plan:{mind:[1,3,5],body:[2,3,6],growth:[3,4],bonds:[4,5]}}],reactions:[]};
const t=(name,fn)=>{try{fn()}catch(e){console.error('FAIL '+name);throw e}};
(async()=>{
 t('Rundenturnier: gültige Paarungen, ein wanderndes Freilos, keine Wiederholung innerhalb einer Runde',()=>{
  for(let k=2;k<=8;k++){const s={members:Array.from({length:k},(_,i)=>({user_id:'p'+i}))},seen=new Set(),byes=[];
   const rounds=Math.min(4,k%2?k:k-1);
   for(let w=1;w<=rounds;w++){const ps=A.pairings(s,w),ids=ps.flatMap(p=>[p.a,p.b]).filter(Boolean);
    assert.equal(new Set(ids).size,k,'jede Person genau einmal');assert.equal(ps.filter(p=>!p.b).length,k%2,'Freilos nur bei ungerader Zahl');
    for(const p of ps){if(!p.b){byes.push(p.a);continue}assert.notEqual(p.a,p.b);const key=[p.a,p.b].sort().join('|');if(k>2)assert.ok(!seen.has(key),'keine Wiederholung bei '+k+' Personen');seen.add(key)}}
   assert.equal(new Set(byes).size,byes.length,'Freilos rotiert');
   assert.deepEqual(JSON.stringify(A.pairings(s,2)),JSON.stringify(A.pairings(s,2)),'deterministisch')}});
 t('Duell und Bilanz: Sieg/Niederlage/Unentschieden aus den Wochenpunkten, ohne Einfluss auf die Tabelle',()=>{
  const before=JSON.stringify(A.weekly(base,1));const d=A.duelOf(base,1,'u-a');assert.ok(d);
  if(!d.bye){assert.equal(d.closed,true);assert.ok(['win','loss','draw'].includes(d.result));const o=A.weekly(base,1).find(r=>r.user_id===d.opp);assert.equal(d.theirs,o.score)}
  assert.equal(JSON.stringify(A.weekly(base,1)),before);
  const rec=A.duelRecord(base,'u-a');assert.equal(rec.weeks.length,2);assert.equal(rec.weeks[1].closed,false,'laufende Woche vorläufig');assert.equal(rec.weeks[1].result,null);
  const tie={...base,completions:[],scores:null};const dt=A.duelOf(tie,1,'u-a');if(!dt.bye)assert.equal(dt.result,'draw','Gleichstand = Unentschieden');});
 t('Prognose: bestätigt ≤ Maximum ≤ 115, Platzspanne, nichts wird verändert',()=>{
  const copy=JSON.stringify(base),fc=A.forecast(base);assert.equal(JSON.stringify(base),copy,'rein lesend');
  assert.equal(fc.week,2);assert.equal(fc.daysLeft,5);
  for(const r of fc.rows){assert.ok(r.max>=r.now);assert.ok(r.max<=1150);assert.ok(r.best<=r.rank&&r.rank<=r.worst,'Rang liegt in der Spanne');assert.equal(r.open,r.max-r.now)}
  const a=fc.rows.find(r=>r.user_id==='u-a');assert.ok(a.maxBase<=1000);assert.ok(a.max>a.now,'offenes Soll ergibt Potenzial');
  /* Alles erfüllt: kein Potenzial mehr */
  const all=Object.entries(targets).flatMap(([k,n])=>Array.from({length:n},(_,i)=>c('u-c',2,k,i+1)));
  const full={...base,completions:[...comp,...all]};const m=A.forecast(full).rows.find(r=>r.user_id==='u-c');assert.equal(m.open,0);
  /* Letzter Tag: Spanne wird eng */
  const sunday={...base,today:addDays(start,13)};assert.equal(A.forecast(sunday).daysLeft,1);
  assert.equal(A.forecast({...base,league:{...base.league,rule_version:1}}),null,'nur Regel 3');});
 t('Prognose nutzt Plantage zuerst (Kampfgeist im Szenario erreichbar)',()=>{const sc=A.scenario(base,'u-a',2),r=A.scoreV3(sc,'u-a',2);assert.ok(r.run>=3,'geplante Tage zuerst ergeben die Folge');assert.equal(sc.completions.filter(e=>String(e.id).startsWith('scenario')).every(e=>e.day>=today),true,'nur ab heute');});
 t('Scouting: nur öffentliche Kennzahlen, Aufhol-Kategorien',()=>{
  const a=A.scout(base,'u-a'),b=A.scout(base,'u-b');assert.deepEqual(Object.keys(a).sort(),['activeDays','avg','consistency','duelLosses','duelWins','elapsed','provisional','seasonRank','strongest','trend','user_id','weekRank'].sort());
  assert.equal(a.elapsed,10);assert.ok(a.activeDays<=a.elapsed);assert.equal(a.provisional,false);assert.equal(a.trend,null,'Trend erst ab zwei abgeschlossenen Wochen');
  const hints=A.catchUp(a,b);for(const h of hints)assert.ok(h.gap>0);
  assert.equal(A.scout({...base,league:{...base.league,start_date:null}},'u-a'),null);});
 t('Live-Hinweise: Führung, Punkte, Formation, Rekord; nichts bei gleichem Stand',()=>{
  assert.equal(A.liveNews(base,base),null);assert.equal(A.liveNews(null,base),null);
  const more={...base,completions:[...comp,c('u-a',2,'growth',3)]};const n1=A.liveNews(base,more);assert.ok(n1,'Änderung erkannt');
  const lead={...base,completions:[...comp,...['growth','bonds'].flatMap(k=>[3].map(d=>c('u-a',2,k,d))),c('u-a',2,'body',3),c('u-a',2,'mind',3)]};
  const w=A.weekly(lead,2);if(w[0].user_id==='u-a'&&w.filter(r=>r.rank===1).length===1&&A.weekly(base,2)[0].user_id!=='u-a')assert.equal(A.liveNews(base,lead).kind,'lead');
  const lost={...base,user_id:'u-b'};const other=A.liveNews(lost,{...lead,user_id:'u-b'});if(other)assert.ok(['leadOther','rank','points','record','formation'].includes(other.kind));
  const otherLeague={...more,league:{...more.league,id:'x'}};assert.equal(A.liveNews(base,otherLeague),null,'andere Arena: kein Hinweis');});
 /* Realtime-Abo: Filter auf die Arena, Status, Aufräumen; Rückfall ohne Realtime */
 const authSource=fs.readFileSync(path.join(__dirname,'../auth.js'),'utf8');const subs=[];let removed=0,statusCb;
 const fake={auth:{onAuthStateChange(){}},rpc:async()=>({data:[]}),channel(name){const ch={name,on(kind,opts,fn){subs.push({kind,opts,fn});return ch},subscribe(cb){statusCb=cb;return ch}};return ch},removeChannel(){removed++}};
 const actx=vm.createContext({window:{WAR_WITHIN_SUPABASE:{url:'https://test.supabase.co',publishableKey:'sb_publishable_test'},supabase:{createClient:()=>fake}},location:{},sessionStorage:{getItem(){return null},setItem(){},removeItem(){}}});vm.runInContext(authSource,actx);
 const auth=actx.window.authApi;const states=[];let pings=0;
 const stop=auth.arenaWatch(base.league.id,()=>pings++,s=>states.push(s));
 assert.deepEqual(subs.map(s=>s.opts.table),['arena_score_events','arena_completions']);assert.ok(subs.every(s=>s.opts.filter==='league_id=eq.'+base.league.id&&s.opts.event==='INSERT'));
 statusCb('SUBSCRIBED');statusCb('CHANNEL_ERROR');assert.deepEqual(states,['live','off']);subs[0].fn({new:{delta:99999}});assert.equal(pings,1,'nur ein Signal, Daten kommen per Snapshot');
 stop();assert.equal(removed,1);
 const bad=[];auth.arenaWatch("x' or 1=1",()=>{},s=>bad.push(s));assert.deepEqual(bad,['off'],'ungültige Arena-ID wird nicht abonniert');
 const noRt=ctx.ArenaApi.create(async()=>({}));const st=[];const s2=noRt.watch('id',()=>{},x=>st.push(x));assert.deepEqual(st,['off']);s2();
 const throwing=ctx.ArenaApi.create(async()=>({}),()=>{throw Error('kein Realtime')});const st2=[];throwing.watch('id',()=>{},x=>st2.push(x));assert.deepEqual(st2,['off'],'Fehler im Abo → Rückfall auf Abfrage');
 /* Migration: Realtime-Publikation nur, wenn vorhanden; wiederholbar */
 const db=new PGlite();try{
  await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;create publication supabase_realtime;`);
  for(const f of ['202611230001_arena.sql','202611230002_arena_v3.sql','202611230002_arena_v3.sql'])await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations',f),'utf8'));
  const {rows}=await db.query("select tablename from pg_publication_tables where pubname='supabase_realtime' order by 1");assert.deepEqual(rows.map(r=>r.tablename),['arena_completions','arena_score_events']);
 }finally{await db.close()}
 console.log('PASS Arena 3.0 Phase 3: Rundenturnier 2–8 Personen mit wanderndem Freilos, Duelle ohne Tabelleneinfluss, Prognose (bestätigt vs. Szenario, Platzspanne, lesend), Scouting nur öffentlich, Live-Hinweise, Realtime-Abo mit Arena-Filter und Rückfall, Publikation wiederholbar');
})().catch(e=>{console.error(e);process.exitCode=1});
