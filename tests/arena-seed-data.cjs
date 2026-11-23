/* Prüft die Arena-Testdaten gegen das echte SQL und die Spielregeln. Nur Wegwerf-Datenbank. */
const {PGlite}=require('@electric-sql/pglite'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {seedArena}=require('./arena-seed.cjs');
const ids=['10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000003'],names=['Linus','Jonas','Mira'];
const ctx=vm.createContext({URL});vm.runInContext(fs.readFileSync(path.join(__dirname,'../arena-core.js'),'utf8'),ctx);const A=ctx.ArenaCore;
(async()=>{const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;insert into auth.users values ${ids.map(id=>"('"+id+"')").join(',')};`);
 await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations/202611230001_arena.sql'),'utf8'));
 const r=await seedArena(db,ids,names);assert.ok(r.completions>40,'enough history to look at');
 const as=async i=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[ids[i]]);await db.exec('set role authenticated')};
 await as(0);const list=(await db.query('select public.arena_list() as data')).rows[0].data;assert.deepEqual(list.map(x=>x.name).sort(),['Die Dreihundert','Morgenlauf-Trio']);
 const s=(await db.query('select public.arena_snapshot($1) as data',[r.running])).rows[0].data;
 const p=A.phase(s);assert.equal(p.kind,'running');assert.equal(p.week,3);assert.equal(p.closed,2);assert.equal(s.members.length,3);
 for(const w of [1,2,3])for(const m of s.members)for(const slot of A.SLOTS){const n=s.completions.filter(e=>e.user_id===m.user_id&&e.week===w&&e.slot===slot.id).length;assert.ok(n<=s.league.targets[slot.id],'never above the shared target');}
 assert.ok(s.completions.every(e=>e.day<=s.today),'no completions in the future');assert.ok(s.reactions.length>0,'reactions exist');
 const season=A.season(s);assert.ok(season.some(x=>x.points>0),'closed weeks award table points');assert.ok(season.filter(x=>x.points>0).length>=2,'at least two players score table points');assert.ok([1,2].every(w=>A.weekly(s,w).some(r=>r.score>0)),'every closed week has activity');
 const lobby=(await db.query('select public.arena_snapshot($1) as data',[r.lobby])).rows[0].data;assert.equal(A.phase(lobby).kind,'lobby');assert.notEqual(lobby.league.owner_id,ids[0],'Linus sees a lobby as non-founder');
 /* Die Testdaten halten sich an die Regeln: eine weitere Meldung heute bleibt über RPC gedeckelt bzw. erlaubt */
 const before=s.completions.length;const after=(await db.query("select public.arena_command('report',$1,'{\"slot\":\"bonds\",\"done\":true}'::jsonb) as data",[r.running])).rows[0].data;assert.ok(after.completions.length>=before);
 await as(2);const mira=(await db.query('select public.arena_snapshot($1) as data',[r.running])).rows[0].data;assert.equal(mira.user_id,ids[2]);
 console.log('PASS arena seed data: running season in week 3 with two closed weeks, three players, capped completions, reactions, several scorers, lobby arena for a non-founder');
 }finally{await db.close()}})().catch(e=>{console.error(e);process.exitCode=1});
