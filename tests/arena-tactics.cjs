/* Arena 3.0, Phase 2: Momentum, Vier Säulen, Kriegsrat, Doktrin, Bonusdeckel – echte SQL-Migration in PGlite.
   Prüft zusätzlich, dass private.arena_v3_score und ArenaCore.scoreV3 für zufällige Wochen identisch rechnen.
   Kontaktiert nie Supabase. Nur in dieser Wegwerf-DB wird die Montags-Bedingung von start_date entfernt,
   um jeden Wochentag als „heute“ prüfen zu können. */
const {PGlite}=require('@electric-sql/pglite'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
require('../arena-core.js');const A=globalThis.ArenaCore;
const ids=['10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000004'];
const SL=['mind','body','growth','bonds'];
const addDays=(d,n)=>new Date(Date.parse(d+'T00:00:00Z')+n*864e5).toISOString().slice(0,10);
let seed=7;const rnd=n=>{seed=(seed*1103515245+12345)%2147483648;return seed%n};
(async()=>{const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;insert into auth.users values ${ids.map(id=>"('"+id+"')").join(',')};`);
 for(const f of ['202611230001_arena.sql','202611230002_arena_v3.sql','202611230002_arena_v3.sql'])await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations',f),'utf8'));
 await db.exec('alter table public.arena_leagues drop constraint if exists arena_leagues_start_date_check');
 const as=async(i)=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[ids[i]]);await db.exec('set role authenticated')};
 const su=()=>db.exec('reset role');
 const cmd=async(action,league,data={})=>(await db.query('select public.arena_command($1,$2,$3::jsonb) as data',[action,league,JSON.stringify(data)])).rows[0].data;
 const load=async(id)=>(await db.query('select public.arena_snapshot($1) as data',[id])).rows[0].data;
 const {rows:[{today}]}=await db.query("select ((now() at time zone 'Europe/Berlin')::date)::text as today");
 /* „heute“ ist Wochentag dow (1=Mo) der Woche week: start_date entsprechend setzen. */
 const placeToday=async(id,dow,week=1)=>{await su();await db.query('update public.arena_leagues set start_date=$2::date where id=$1',[id,addDays(today,-(dow-1)-(week-1)*7)])};
 const score=async(id,u,w)=>{await su();return(await db.query('select private.arena_v3_score($1,$2,$3) as s',[id,ids[u],w])).rows[0].s};
 const put=async(id,u,w,slot,day)=>{await su();await db.query('insert into public.arena_completions(league_id,user_id,week,slot,day) values($1,$2,$3,$4,$5::date) on conflict do nothing',[id,ids[u],w,slot,day])};
 const formation=async(id,u,w,kind,slot,plan,switch_day=null)=>{await su();await db.query('insert into public.arena_formations(league_id,user_id,week,kind,slot,plan,switch_day) values($1,$2,$3,$4,$5,$6::jsonb,$7::date) on conflict(league_id,user_id,week) do update set kind=excluded.kind,slot=excluded.slot,plan=excluded.plan,switch_day=excluded.switch_day',[id,ids[u],w,kind,slot,JSON.stringify(plan),switch_day])};
 const clear=async id=>{await su();await db.query('delete from public.arena_completions where league_id=$1',[id]);await db.query('delete from public.arena_formations where league_id=$1',[id]);await db.query('delete from public.arena_score_events where league_id=$1',[id])};

 await as(0);let s=await cmd('create',null,{name:'Phalanx',capacity:3,display_name:'Linus',targets:{mind:3,body:3,growth:2,bonds:2}});const id=s.league.id;
 await as(1);await cmd('join',null,{code:s.league.invite_code,display_name:'Jonas'});await as(2);await cmd('join',null,{code:s.league.invite_code,display_name:'Mira'});

 /* ── Saison-Draft: Doktrin nur vor Saisonstart, ohne Punkte ── */
 await as(1);s=await cmd('doctrine',id,{kind:'guardian'});assert.equal(s.doctrines[ids[1]],'guardian');await assert.rejects(cmd('doctrine',id,{kind:'hoplite'}),/Ungültige Doktrin/);
 await as(0);await cmd('start',id);
 await placeToday(id,2);await as(1);await assert.rejects(cmd('doctrine',id,{kind:'spear'}),/vor dem Saisonstart/);
 assert.ok((await load(id)).scores.every(r=>r.score===0),'Doktrin bringt keine Punkte');

 const ws=addDays(today,-1);/* heute = Dienstag (Tag 2) */
 const full={mind:[1,3,5],body:[2,4,6],growth:[1,4],bonds:[2,5]};
 /* ── Momentum: drei geplante Tage in Folge; ungeplante Ruhetage unterbrechen nicht ── */
 await clear(id);await formation(id,0,1,'guardian','mind',{mind:[1,4,7],body:[1,4,7],growth:[1,7],bonds:[4,7]});
 for(const [k,d] of [['mind',1],['body',1],['growth',1],['mind',4],['body',4],['bonds',4]])await put(id,0,1,k,addDays(ws,d-1));
 let r=await score(id,0,1);assert.equal(r.run,2);assert.equal(r.momentum,0,'zwei Tage reichen nicht');
 for(const k of ['mind','body','growth','bonds'])await put(id,0,1,k,addDays(ws,6));
 r=await score(id,0,1);assert.equal(r.run,3,'Ruhetage 2,3,5,6 unterbrechen nicht');assert.equal(r.momentum,40);
 assert.equal(r.formation,60,'Wächter: alle drei Plantage erfüllt (weniger als vier geplant)');
 /* verpasster Plantag bricht die Folge, bereits erreichte Folge bleibt */
 await clear(id);await formation(id,0,1,'shield','mind',full);
 for(const [k,d] of [['mind',1],['growth',1],['body',2],['bonds',2],['mind',3]])await put(id,0,1,k,addDays(ws,d-1));
 r=await score(id,0,1);assert.equal(r.run,3);assert.equal(r.momentum,40);
 await put(id,0,1,'body',addDays(ws,4));/* Plantag 4 (body+growth) nur halb erfüllt: Folge bricht */
 r=await score(id,0,1);assert.equal(r.momentum,40,'keine Rücknahme durch spätere Unterbrechung');
 /* ohne Wochenplan kein Momentum */
 await clear(id);for(const d of [1,2,3])await put(id,1,1,'mind',addDays(ws,d-1));r=await score(id,1,1);assert.equal(r.momentum,0);assert.equal(r.kind,null);

 /* ── Vier Säulen: drei volle Bereiche, einmal je Woche ── */
 await clear(id);
 for(const [k,ds] of [['mind',[1,2,3]],['body',[1,2,3]],['growth',[1,2]]])for(const d of ds)await put(id,2,1,k,addDays(ws,d-1));
 r=await score(id,2,1);assert.equal(r.pillars,3);assert.equal(r.combo,50);
 for(const d of [1,2])await put(id,2,1,'bonds',addDays(ws,d-1));r=await score(id,2,1);assert.equal(r.pillars,4);assert.equal(r.combo,50,'vier Säulen zählen nicht doppelt');

 /* ── Formationen: Schildwall 60 %, Speerspitze 100 %, Deckel 100 + 15 ── */
 await clear(id);await formation(id,0,1,'shield','mind',full);
 for(const [k,ds] of [['mind',[1,3]],['body',[2,4]],['growth',[1]],['bonds',[2,5]]])for(const d of ds)await put(id,0,1,k,addDays(ws,d-1));
 r=await score(id,0,1);assert.equal(r.formation,0,'1/2 = 50 % < 60 %');
 await put(id,0,1,'growth',addDays(ws,3));r=await score(id,0,1);assert.equal(r.formation,60,'2/3 = 67 % und 2/2 ≥ 60 %');
 await clear(id);await formation(id,0,1,'shield','mind',full);for(const [k,ds] of [['mind',[1]],['body',[2,4]],['growth',[1,4]],['bonds',[2,5]]])for(const d of ds)await put(id,0,1,k,addDays(ws,d-1));
 r=await score(id,0,1);assert.equal(r.formation,0,'1/3 < 60 %');
 await clear(id);await formation(id,0,1,'spear','growth',full);await put(id,0,1,'growth',addDays(ws,0));r=await score(id,0,1);assert.equal(r.formation,0);
 await put(id,0,1,'growth',addDays(ws,3));r=await score(id,0,1);assert.equal(r.formation,60);
 /* alles erfüllt: Basis 100, Bonus exakt 15 in fester Reihenfolge */
 await clear(id);await formation(id,0,1,'guardian','mind',full);for(const [k,ds] of Object.entries(full))for(const d of ds)await put(id,0,1,k,addDays(ws,d-1));
 r=await score(id,0,1);assert.equal(r.base,1000);assert.equal(r.formation,60);assert.equal(r.combo,50);assert.equal(r.momentum,40);assert.equal(r.bonus,150);assert.equal(r.oracle+r.bounty,0,'Orakel und Prämie werden nach dem Deckel nicht mehr angerechnet');assert.equal(r.score,1150);

 /* ── Kriegsrat ── */
 await clear(id);await formation(id,0,1,'spear','bonds',full);await formation(id,1,1,'shield','mind',full);
 await put(id,0,1,'mind',ws);await put(id,0,1,'body',addDays(ws,1));
 await as(0);
 await assert.rejects(cmd('switch',id,{kind:'shield',slot:'mind',plan:{mind:[2,3],body:[3,4],growth:[3,4],bonds:[3,5]}}),/ab morgen/,'Tage vor morgen sind gesperrt');
 await assert.rejects(cmd('switch',id,{kind:'shield',slot:'mind',plan:{mind:[3],body:[3,4],growth:[3,4],bonds:[3,5]}}),/offene Soll/,'genau das offene Soll');
 const sw={mind:[3,5],body:[4,6],growth:[3,4],bonds:[5,7]};
 s=await cmd('switch',id,{kind:'shield',slot:'mind',plan:sw});
 const mine=s.formations.find(f=>f.user_id===ids[0]&&f.week===1);assert.equal(mine.kind,'shield');assert.equal(mine.prev_kind,'spear');assert.equal(mine.switch_day,addDays(today,1));
 assert.deepEqual(mine.plan,{mind:[1,3,5],body:[2,4,6],growth:[1,3,4],bonds:[2,5,7]},'alte Tage bleiben, neue ab morgen');
 assert.deepEqual(s.tactics.filter(t=>t.user_id===ids[0]).map(t=>t.action),['switch']);
 await assert.rejects(cmd('switch',id,{kind:'guardian',slot:'mind',plan:sw}),/schon genutzt/);
 /* neue Formation wertet nur ab morgen: Meldungen von Montag/Dienstag zählen nicht für den Schildwall */
 r=await score(id,0,1);assert.equal(r.switched,true);assert.equal(r.formation,0);
 for(const [k,ds] of [['mind',[3]],['body',[4,6]],['growth',[3,4]],['bonds',[5,7]]])for(const d of ds)await put(id,0,1,k,addDays(ws,d-1));
 r=await score(id,0,1);assert.equal(r.formation,0,'MIND 1 von 2 offenen Tagen < 60 %');
 await put(id,0,1,'mind',addDays(ws,4));r=await score(id,0,1);assert.equal(r.formation,60,'≥60 % des offenen Solls ab dem Wechsel');
 /* bereits gemeisterte Formation kann nicht gewechselt werden (keine doppelten Boni) */
 for(const [k,ds] of [['mind',[1,2]],['body',[1,2]],['growth',[1,2]],['bonds',[1,2]]])for(const d of ds)await put(id,1,1,k,addDays(ws,d-1));
 await as(1);await assert.rejects(cmd('switch',id,{kind:'spear',slot:'growth',plan:{mind:[3],body:[3],growth:[3],bonds:[]}}),/bereits gemeistert/);
 await as(2);await assert.rejects(cmd('switch',id,{kind:'shield',slot:'mind',plan:sw}),/keine Formation/);
 /* Freitag: kein Kriegsrat mehr */
 await placeToday(id,5);await as(0);await su();await db.query('update public.arena_formations set switch_day=null where league_id=$1',[id]);await as(0);
 await assert.rejects(cmd('switch',id,{kind:'shield',slot:'mind',plan:sw}),/Montag bis Donnerstag/);
 await placeToday(id,2);

 /* ── Ereignisse: Meldung heute schaltet Momentum + Säulen frei, Rücknahme korrigiert sichtbar ── */
 await clear(id);await formation(id,2,1,'guardian','mind',{mind:[1,2,3],body:[1,2,3],growth:[1,2],bonds:[1,2]});
 for(const [k,ds] of [['mind',[1]],['body',[1,2]],['growth',[1,2]],['bonds',[1,2]]])for(const d of ds)await put(id,2,1,k,addDays(ws,d-1));
 await as(2);s=await cmd('report',id,{slot:'mind',done:true});
 const ev=t=>s.score_events.filter(e=>e.user_id===ids[2]&&e.type===t).reduce((n,e)=>n+e.delta,0);
 assert.equal(ev('base'),Math.round(500/3)-Math.round(250/3),'zweiter MIND-Tag');
 s=await cmd('report',id,{slot:'mind',done:true});const n1=s.score_events.length;s=await cmd('report',id,{slot:'mind',done:true});assert.equal(s.score_events.length,n1,'Wiederholung erzeugt keine Ereignisse');
 s=await cmd('report',id,{slot:'mind',done:false});assert.equal(ev('base'),0,'Rücknahme gleicht Basis aus');assert.ok(s.score_events.some(e=>e.user_id===ids[2]&&e.type==='base'&&e.delta<0));
 /* Heute = Tag 3: die letzte Meldung schließt Wächter, Momentum und Vier Säulen zugleich – und die Rücknahme nimmt alles sichtbar zurück. */
 await placeToday(id,3);const w3=addDays(today,-2);await clear(id);
 await formation(id,2,1,'guardian','mind',{mind:[1,2,3],body:[1,2,3],growth:[1,2],bonds:[1,3]});
 for(const [k,d] of [['mind',1],['body',1],['growth',1],['bonds',1],['mind',2],['body',2],['growth',2],['body',3],['bonds',3]])await put(id,2,1,k,addDays(w3,d-1));
 await as(2);s=await cmd('report',id,{slot:'mind',done:true});
 const last=t=>s.score_events.filter(e=>e.user_id===ids[2]&&e.type===t).map(e=>e.delta);
 assert.deepEqual(last('formation'),[60]);assert.deepEqual(last('combo'),[],'Säulen standen schon vorher: kein zweites Ereignis');assert.deepEqual(last('momentum'),[40]);
 const conf=s.scores.find(x=>x.user_id===ids[2]&&x.week===1);assert.equal(conf.bonus,150);assert.equal(conf.score,1150);
 s=await cmd('report',id,{slot:'mind',done:false});
 assert.deepEqual(last('formation'),[-60,60]);assert.deepEqual(last('momentum'),[-40,40]);assert.deepEqual(last('combo'),[],'Rücknahme lässt drei volle Säulen stehen');
 assert.ok(s.score_events.every(e=>e.rule_version===3&&e.week===1));
 await placeToday(id,2);

 /* ── Sichtbarkeit: fremde Aufstellung erst ab Wochenbeginn ── */
 await su();await db.query("insert into public.arena_formations(league_id,user_id,week,kind,slot,plan) values($1,$2,2,'spear','body',$3::jsonb)",[id,ids[1],JSON.stringify(full)]);
 await as(0);s=await load(id);assert.equal(s.formations.some(f=>f.user_id===ids[1]&&f.week===2),false,'Woche 2 von Jonas geheim');assert.equal((await db.query('select * from public.arena_formations where week=2')).rows.length,0,'auch direkt per RLS');
 await as(1);s=await load(id);assert.ok(s.formations.some(f=>f.user_id===ids[1]&&f.week===2),'eigene Aufstellung sichtbar');
 await assert.rejects(db.query("insert into public.arena_formation_log(league_id,user_id,week,action,kind,slot,effective_day) values($1,$2,1,'switch','shield','mind',current_date)",[id,ids[1]]),/permission denied/);
 await assert.rejects(db.query("update public.arena_formations set switch_day=null where league_id=$1",[id]),/permission denied/);
 await as(3);await assert.rejects(load(id),/nicht verfügbar/);

 /* ── Alte Ligen (Regel 1) bleiben unverändert ── */
 await su();await db.query('update public.arena_leagues set rule_version=1 where id=$1',[id]);await as(0);s=await load(id);assert.equal('scores' in s,false);await su();await db.query('update public.arena_leagues set rule_version=3 where id=$1',[id]);

 /* ── Parität: SQL und ArenaCore.scoreV3 rechnen identisch (zufällige Wochen, auch mit Kriegsrat) ── */
 const targets={mind:3,body:3,growth:2,bonds:2};let cases=0;
 for(let it=0;it<60;it++){await clear(id);
  for(let u=0;u<3;u++){
   const plan=Object.fromEntries(SL.map(k=>{const days=[1,2,3,4,5,6,7].sort(()=>rnd(3)-1);return[k,days.slice(0,targets[k]).sort((a,b)=>a-b)]}));
   const sw=rnd(4)===0?addDays(ws,1+rnd(4)):null;
   if(rnd(5))await formation(id,u,1,['shield','spear','guardian'][rnd(3)],SL[rnd(4)],plan,sw);
   for(const k of SL){const days=[0,1,2,3,4,5,6].filter(()=>rnd(2)).slice(0,targets[k]);for(const d of days)await put(id,u,1,k,addDays(ws,d))}}
  await su();
  const comp=(await db.query("select user_id::text,week,slot,day::text as day,to_char(created_at at time zone 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') as created_at from public.arena_completions where league_id=$1",[id])).rows;
  const forms=(await db.query('select user_id::text,week,kind,slot,plan,switch_day::text as switch_day from public.arena_formations where league_id=$1',[id])).rows;
  const snap={league:{id,start_date:ws,targets,rule_version:3},members:ids.slice(0,3).map((u,i)=>({user_id:u,display_name:'P'+i})),completions:comp,formations:forms,today,user_id:ids[0]};
  for(let u=0;u<3;u++){const sq=await score(id,u,1),js=A.scoreV3(snap,ids[u],1);
   for(const k of ['base','oracle','bounty','formation','combo','momentum','bonus','score','pillars','run'])assert.equal(js[k],sq[k],'Parität '+k+' (Fall '+it+', Spieler '+u+')');
   assert.deepEqual(js.guard,sq.guard);cases++;}}

 /* JS-Hilfen: Kriegsrat-Bedarf entspricht der Serverprüfung */
 const need=A.switchNeed({league:{start_date:ws,targets},today,user_id:ids[0],completions:[{user_id:ids[0],week:1,slot:'mind',day:ws}]},1);
 assert.equal(need.from,3);assert.equal(need.open,true);assert.deepEqual(need.need,{mind:2,body:3,growth:2,bonds:2});
 console.log('PASS Arena 3.0 Phase 2: Momentum (Ruhetage, Bruch, kein Abzug), Vier Säulen, drei Formationen, Bonusdeckel 115 und Reihenfolge, Kriegsrat (einmal, ab morgen, Mo–Do, offenes Soll, nicht nach Erfolg), Doktrin ohne Punkte, Ereignis-Ledger mit Rücknahme, geheime Aufstellung (RLS), Regel 1 unverändert, SQL/JS-Parität in '+cases+' Fällen');
 }finally{await db.close()}})().catch(e=>{console.error(e);process.exitCode=1});
