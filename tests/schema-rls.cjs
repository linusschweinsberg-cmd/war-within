// Local disposable PostgreSQL (PGlite), never connects to hosted Supabase.
// node tests/schema-rls.cjs <absolute path to @electric-sql/pglite>
const {PGlite}=require(process.argv[2]||'@electric-sql/pglite');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema public,auth to authenticated;grant execute on function auth.uid() to authenticated;`);
 const ids=['00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003'];
 for(const id of ids)await db.query('insert into auth.users values ($1)',[id]);
 const dir=path.join(__dirname,'../supabase/migrations');for(const f of fs.readdirSync(dir).sort())await db.exec(fs.readFileSync(path.join(dir,f),'utf8'));
 const as=async(id,sql,params=[])=>{await db.exec(`set role authenticated;`);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);try{return await db.query(sql,params)}finally{await db.exec('reset role')}};
 const deny=async(id,sql,params=[])=>{let denied=false;try{await as(id,sql,params)}catch(e){assert.ok(['42501','23514'].includes(e.code),e.message);denied=true}assert.ok(denied,'Expected denial: '+sql)};
 for(const id of ids){await as(id,'insert into public.profiles(user_id,display_name,preferences) values ($1,$2,$3)',[id,'Private name',JSON.stringify({private:'private'})]);await as(id,'insert into public.game_states(user_id,state) values ($1,$2)',[id,JSON.stringify({life:{goals:[]}})])}
 assert.equal((await as(ids[0],'select * from public.profiles')).rows.length,1);assert.equal((await as(ids[0],'select * from public.game_states')).rows.length,1);
 await deny(ids[0],'insert into public.profiles(user_id) values ($1)',[ids[2]]);
 assert.equal((await as(ids[0],'update public.game_states set state=$1 where user_id=$2 returning *',['{}',ids[1]])).rows.length,0);
 await deny(ids[0],'update public.profiles set user_id=$1 where user_id=$2',[ids[1],ids[0]]);
 await deny(ids[0],'update public.game_states set version=99 where user_id=$1',[ids[0]]);
 assert.equal((await as(ids[0],'update public.game_states set state=$1 where user_id=$2 and version=1 returning version',['{"life":{}}',ids[0]])).rows[0].version,2);
 assert.equal((await as(ids[0],'update public.game_states set state=$1 where user_id=$2 and version=1 returning version',['{}',ids[0]])).rows.length,0);
 for(const [groups,single] of [['leagues','league'],['squads','squad']]){
  const g=(await as(ids[0],`insert into public.${groups}(owner_id,name) values ($1,'Group') returning id`,[ids[0]])).rows[0].id;
  await as(ids[0],`insert into public.${single}_members(${single}_id,user_id,display_name) values ($1,$2,'Public Alice')`,[g,ids[0]]);
  await deny(ids[2],`insert into public.${single}_members(${single}_id,user_id) values ($1,$2)`,[g,ids[2]]);
  // Simulate future trusted invite acceptance, not arbitrary client self-join.
  await db.query(`insert into public.${single}_members(${single}_id,user_id,display_name) values ($1,$2,'Public Bob')`,[g,ids[1]]);
  assert.equal((await as(ids[1],`select * from public.${single}_members`)).rows.length,2);
  assert.equal((await as(ids[2],`select * from public.${single}_members`)).rows.length,0);
  assert.equal((await as(ids[2],`select * from public.${groups}`)).rows.length,0);
  assert.equal((await as(ids[1],'select * from public.profiles where user_id=$1',[ids[0]])).rows.length,0);
  assert.equal((await as(ids[1],`update public.${single}_members set display_name='Hack' where user_id=$1 returning *`,[ids[0]])).rows.length,0);
  await deny(ids[1],`update public.${single}_members set ${single}_id=gen_random_uuid() where user_id=$1`,[ids[1]]);
  assert.equal((await as(ids[1],`update public.${groups} set name='Hack' where id=$1 returning *`,[g])).rows.length,0);
  assert.equal((await as(ids[0],`delete from public.${single}_members where user_id=$1 returning *`,[ids[0]])).rows.length,0);
  await as(ids[1],`delete from public.${single}_members where user_id=$1`,[ids[1]]);
  assert.equal((await as(ids[1],`select * from public.${single}_members`)).rows.length,0);
  await as(ids[0],`delete from public.${groups} where id=$1`,[g]);
 }
 const tables=await db.query("select relname,relrowsecurity from pg_class where relnamespace='public'::regnamespace and relkind='r'");assert.equal(tables.rows.length,6);assert.ok(tables.rows.every(x=>x.relrowsecurity));
 await db.exec('set role anon');await assert.rejects(db.query('select * from public.profiles'),/permission denied/);await db.exec('reset role');
 await db.query('delete from auth.users where id=$1',[ids[0]]);assert.equal((await db.query('select * from public.game_states where user_id=$1',[ids[0]])).rows.length,0);
 console.log('PASS local PostgreSQL: migration, six RLS tables, owner isolation, public-only rosters, no self-join/role escalation, group leave, CAS, protected versions and cascade deletion. No hosted project touched.');
 }finally{await db.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
