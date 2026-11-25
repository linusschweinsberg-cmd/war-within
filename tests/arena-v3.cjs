/* Runs the real migration in disposable PostgreSQL/WASM. Never contacts Supabase. */
const {PGlite}=require('@electric-sql/pglite'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ids=['10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000004'];
(async()=>{const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;insert into auth.users values ${ids.map(id=>"('"+id+"')").join(',')};`);
 await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations/202611230001_arena.sql'),'utf8'));
 await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations/202611230002_arena_v3.sql'),'utf8'));
 await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations/202611230002_arena_v3.sql'),'utf8'));
 const as=async(i,role='authenticated')=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[i==null?'':ids[i]]);await db.exec('set role '+role)};
 const cmd=async(action,league,data={})=>(await db.query('select public.arena_command($1,$2,$3::jsonb) as data',[action,league,JSON.stringify(data)])).rows[0].data;
 const load=async(id)=>(await db.query('select public.arena_snapshot($1) as data',[id])).rows[0].data;
 const targets={mind:2,body:2,growth:2,bonds:2};await as(null,'anon');await assert.rejects(cmd('create',null,{name:'X',capacity:3,display_name:'X'}),/permission denied/);
 await as(0);let s=await cmd('create',null,{name:'Dreierliga',capacity:3,display_name:'Linus'});const id=s.league.id,code=s.league.invite_code;assert.equal(s.members.length,1);assert.equal(s.league.capacity,3);assert.deepEqual(s.league.targets,{mind:3,body:3,growth:3,bonds:3},'default shared targets');assert.equal('lineups' in s,false,'no personal lineups any more');
 await assert.rejects(cmd('create',null,{name:'Y',capacity:3,display_name:'Y',targets:{mind:1,body:1,growth:1,bonds:8}}),/ein bis sieben/);
 await assert.rejects(cmd('start',id),/mindestens zwei/);
 // Gemeinsames Soll: nur der Gründer, nur gültige vier Bereiche
 s=await cmd('targets',id,{targets});assert.deepEqual(s.league.targets,targets);await assert.rejects(cmd('targets',id,{targets:{...targets,secret:'private'}}),/ein bis sieben/);await assert.rejects(cmd('targets',id,{targets:{...targets,mind:8}}),/ein bis sieben/);await assert.rejects(cmd('targets',id,{targets:{...targets,mind:'2'}}),/ein bis sieben/);
 await as(1);assert.equal((await db.query('select * from public.arena_leagues')).rows.length,0,'stranger cannot read league');await assert.rejects(load(id),/nicht verfügbar/);s=await cmd('join',null,{code,display_name:'Jonas'});assert.equal(s.members.length,2);assert.deepEqual(s.league.targets,targets,'members see the shared targets');await assert.rejects(cmd('start',id),/Nur der Gründer/);await assert.rejects(cmd('targets',id,{targets:{mind:1,body:1,growth:1,bonds:1}}),/Nur der Gründer/,'members cannot lower the bar');
 await as(2);s=await cmd('join',null,{code:code.toLowerCase(),display_name:'Mira'});assert.equal(s.members.length,3);assert.equal((await cmd('join',null,{code,display_name:'Mira'})).members.length,3,'joining is idempotent');
 await as(3);await assert.rejects(cmd('join',null,{code,display_name:'Viert'}),/bereits voll/);await assert.rejects(cmd('report',id,{slot:'mind',done:true}),/nicht verfügbar/);await assert.rejects(cmd('join',null,{code:'INVALID',display_name:'Viert'}),/nicht verfügbar/);
 await as(0);s=await cmd('start',id);assert.equal(new Date(s.league.start_date).getUTCDay(),1);await assert.rejects(cmd('report',id,{slot:'mind',done:true}),/läuft gerade nicht/);await assert.rejects(cmd('targets',id,{targets:{mind:1,body:1,growth:1,bonds:1}}),/vor dem Start/,'targets are fixed once the season is scheduled');
 await as(3);await assert.rejects(cmd('join',null,{code,display_name:'Viert'}),/bereits gestartet/);
 // Move only this disposable fixture to the Monday of the current Berlin week.
 await db.exec("reset role; update public.arena_leagues set start_date=date_trunc('week',now() at time zone 'Europe/Berlin')::date;");
 await as(0);s=await cmd('report',id,{slot:'mind',done:true});assert.equal(s.completions.length,1);const event=s.completions[0];assert.equal(event.day,s.today);assert.equal(event.user_id,ids[0]);s=await cmd('report',id,{slot:'mind',done:true});assert.equal(s.completions.length,1,'retry never duplicates');
 await as(2);s=await cmd('report',id,{slot:'growth',done:true});assert.ok(s.completions.some(e=>e.user_id===ids[2]&&e.slot==='growth'),'every member can report without any personal setup');
 await as(1);s=await cmd('report',id,{slot:'body',done:true,user_id:ids[0],day:'2099-01-01',score:100000});assert.equal(s.completions.find(x=>x.slot==='body').user_id,ids[1]);assert.equal(s.completions.find(x=>x.slot==='body').day,s.today);s=await cmd('react',id,{event:event.id,kind:'respect'});assert.equal(s.reactions.length,1);s=await cmd('react',id,{event:event.id,kind:'fire'});assert.equal(s.reactions.length,1);assert.equal(s.reactions[0].kind,'fire');await assert.rejects(cmd('react',id,{event:event.id,kind:'private prose'}),/nicht verfügbar/);
 await assert.rejects(db.query('update public.arena_leagues set capacity=8 where id=$1',[id]),/permission denied/);await assert.rejects(db.query("update public.arena_leagues set targets='{\"mind\":1,\"body\":1,\"growth\":1,\"bonds\":1}' where id=$1",[id]),/permission denied/,'no direct write to targets');await assert.rejects(db.query('insert into public.arena_completions(league_id,user_id,week,slot,day) values($1,$2,1,\'mind\',current_date)',[id,ids[1]]),/permission denied/);
 await as(0);s=await cmd('report',id,{slot:'mind',done:false});assert.equal(s.completions.some(x=>x.id===event.id),false);assert.equal(s.reactions.length,0,'undo also removes reactions to deleted event');
 await as(3);let other=await cmd('create',null,{name:'Andere Liga',capacity:2,display_name:'Viert'});await assert.rejects(cmd('react',other.league.id,{event:event.id,kind:'respect'}),/nicht verfügbar/);assert.equal((await db.query('select * from public.arena_completions')).rows.length,0);assert.equal((await db.query('select * from public.arena_members')).rows.length,1,'only own group is visible');
 // Wochen-Soll begrenzt: Body-Soll 2, nach zwei Tagen ist Schluss
 await db.exec("reset role; update public.arena_completions set day=day-1 where user_id='"+ids[1]+"';");await as(1);s=await cmd('report',id,{slot:'body',done:true});assert.equal(s.completions.filter(e=>e.user_id===ids[1]&&e.slot==='body').length,2);
 await db.exec("reset role; update public.arena_completions set day=day-2 where user_id='"+ids[1]+"' and day=(now() at time zone 'Europe/Berlin')::date;");await as(1);const before=(await load(id)).completions.length;assert.equal((await cmd('report',id,{slot:'body',done:true})).completions.length,before,'weekly shared target remains capped on a new day');
 // DST boundaries use a calendar date in Berlin, never a client-supplied clock.
 await db.exec("reset role; update public.arena_leagues set start_date=date_trunc('week',now() at time zone 'Europe/Berlin')::date-28;");await as(0);await assert.rejects(cmd('report',id,{slot:'mind',done:true}),/läuft gerade nicht/);
 // A separate fresh week in this disposable DB exercises source ownership.
 await db.exec("reset role; update public.arena_leagues set start_date=date_trunc('week',now() at time zone 'Europe/Berlin')::date;");await as(0);
 const token='20000000-0000-4000-8000-000000000001',otherToken='20000000-0000-4000-8000-000000000002';
 s=await cmd('report',id,{slot:'growth',done:true,origin:'automatic',source:token,expected_user:ids[0]});assert.equal(s.completions.find(e=>e.user_id===ids[0]&&e.slot==='growth').origin,'automatic');
 s=await cmd('report',id,{slot:'growth',done:false,origin:'automatic',source:otherToken});assert.ok(s.completions.some(e=>e.user_id===ids[0]&&e.slot==='growth'),'foreign source cannot retract');
 s=await cmd('report',id,{slot:'growth',done:true});assert.equal(s.completions.find(e=>e.user_id===ids[0]&&e.slot==='growth').origin,'manual');
 s=await cmd('report',id,{slot:'growth',done:false,origin:'automatic',source:token});assert.ok(s.completions.some(e=>e.user_id===ids[0]&&e.slot==='growth'),'manual confirmation survives automatic undo');
 await assert.rejects(cmd('report',id,{slot:'growth',done:true,origin:'automatic',source:token,expected_user:ids[1]}),/Konto hat gewechselt/);
 s=await cmd('report',id,{slot:'bonds',done:true,origin:'automatic',source:token});s=await cmd('report',id,{slot:'bonds',done:false,origin:'automatic',source:token});assert.equal(s.completions.some(e=>e.user_id===ids[0]&&e.slot==='bonds'),false,'own source can retract');
 const leaks=JSON.stringify(await load(id));assert.equal(/email|password|audit|identity|vision|access_token/.test(leaks),false);
 await as(0);s=await load(id);assert.equal(s.league.rule_version,3);assert.ok(s.scores.every(r=>r.score<=1150&&r.bonus<=150));
 const ecount=s.score_events.length;s=await cmd('report',id,{slot:'mind',done:true});const after=s.score_events.length;s=await cmd('report',id,{slot:'mind',done:true});assert.equal(s.score_events.length,after,'idempotent score events');s=await cmd('report',id,{slot:'mind',done:false});assert.ok(s.score_events.some(e=>e.delta<0),'undo retained in ledger');
 await assert.rejects(cmd('formation',id,{week:1,kind:'shield',slot:'mind',plan:{}}),/vor Wochenbeginn/);
 const plan={mind:[1,2],body:[1,2],growth:[1,2],bonds:[1,2]};s=await cmd('formation',id,{week:2,kind:'guardian',slot:'mind',plan});assert.equal(s.formations[0].kind,'guardian');
 await assert.rejects(cmd('formation',id,{week:2,kind:'shield',slot:'mind',plan:{...plan,mind:[1,1]}}),/unterschiedliche/);
 await assert.rejects(db.query("insert into public.arena_score_events(league_id,user_id,week,type,delta) values($1,$2,1,'base',99999)",[id,ids[0]]),/permission denied/);
 const feed=(await db.query('select public.arena_events($1,null) as data',[id])).rows[0].data;assert.ok(feed.length<=30);await as(3);await assert.rejects(db.query('select public.arena_events($1,null)',[id]),/nicht verfügbar/);
 // Real SQL evaluation: all three formations and aggregate bonus cap.
 await db.exec('reset role');
 await db.query('delete from public.arena_completions where league_id=$1',[id]);
 for(const [i,kind] of ['shield','spear','guardian'].entries()){
  await db.query("insert into public.arena_formations(league_id,user_id,week,kind,slot,plan) values($1,$2,1,$3,'mind',$4) on conflict(league_id,user_id,week) do update set kind=excluded.kind,plan=excluded.plan",[id,ids[i],kind,JSON.stringify(plan)]);
  await db.query("insert into public.arena_completions(league_id,user_id,week,slot,day) select $1,$2,1,k,start_date+d from public.arena_leagues cross join unnest(array['mind','body','growth','bonds']) k cross join generate_series(0,1) d where id=$1",[id,ids[i]]);
  const r=(await db.query('select private.arena_v3_score($1,$2,1) as data',[id,ids[i]])).rows[0].data;assert.equal(r.base,1000);assert.equal(r.formation,60,kind);assert.ok(r.score<=1150);assert.ok(r.bonus<=150);
 }
 console.log('PASS Arena v3 server scoring, formations, cap, immutable correction feed, replay, RLS, repeatable migration');
 console.log('PASS arena database: actual SQL, shared targets set only by the founder before start, three-player create/join/start, capacity, RLS, outsider denial, server dates/identity, retry, undo, reactions, weekly cap, season end, private-field exclusion');
 }finally{await db.close()}})().catch(e=>{console.error(e);process.exitCode=1});
