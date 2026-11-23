const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const ctx=vm.createContext({URL});vm.runInContext(fs.readFileSync(path.join(__dirname,'../arena-core.js'),'utf8'),ctx);const A=ctx.ArenaCore;
const targets={mind:3,body:3,growth:3,bonds:3};
function fixture(){return{today:'2026-11-30',league:{start_date:'2026-11-30'},members:['a','b','c'].map(user_id=>({user_id,display_name:user_id})),lineups:['a','b','c'].map(user_id=>({user_id,week:1,targets})),completions:[]};}
assert.equal(A.validTargets(targets),true);for(const t of [{...targets,mind:0},{...targets,mind:8},{...targets,mind:1.5},{...targets,mind:'3'},{...targets,private:'secret'},null])assert.equal(A.validTargets(t),false);
let s=fixture();s.league.start_date=null;assert.equal(A.phase(s).kind,'lobby');assert.equal(A.nextWeek(s),1);
s=fixture();s.today='2026-11-29';assert.equal(A.phase(s).kind,'scheduled');s.today='2026-12-06';assert.equal(A.phase(s).week,1);assert.equal(A.phase(s).closed,0);s.today='2026-12-07';assert.equal(A.phase(s).week,2);assert.equal(A.phase(s).closed,1);s.today='2026-12-28';assert.equal(A.phase(s).kind,'finished');assert.equal(A.nextWeek(s),null);
s=fixture();assert.ok(A.weekly(s,1).every(r=>r.points===0),'zero activity never awards free wins');
for(const user_id of ['a','b'])for(const slot of ['mind','body','growth','bonds'])s.completions.push({user_id,slot,week:1,day:'2026-11-30'});
let rows=A.weekly(s,1);assert.equal(rows[0].score,332);assert.equal(rows[0].rank,1);assert.equal(rows[1].rank,1);assert.equal(rows[2].rank,3);assert.deepEqual(Array.from(rows,r=>r.points),[3,3,0]);assert.ok(A.season(s).every(r=>r.points===0),'live week remains provisional');
s.today='2026-12-07';assert.deepEqual(Array.from(A.season(s),r=>r.points),[3,3,0]);
s.completions.push({...s.completions[0]});assert.equal(A.weekly(s,1)[0].score,332,'duplicate reports do not score twice');
s.lineups=s.lineups.filter(l=>l.user_id!=='c');assert.equal(A.weekly(s,1).find(r=>r.user_id==='c').rank,null);
s=fixture();s.lineups=s.lineups.map(l=>({...l,targets:{mind:1,body:1,growth:1,bonds:1}}));for(const slot of ['mind','body','growth','bonds'])for(const day of ['2026-11-30','2026-12-01'])s.completions.push({user_id:'a',slot,week:1,day});assert.equal(A.weekly(s,1)[0].score,1000,'score caps at 100');
const u=new URL(A.invitation('ABC123','https://example.com/war-within/?token=private#secret'));assert.equal(u.search,'?arena=ABC123');assert.equal(u.hash,'');assert.equal(u.pathname,'/war-within/');
const original=JSON.stringify(s);A.phase(s);A.weekly(s,1);A.season(s);assert.equal(JSON.stringify(s),original,'rules do not mutate any state');
console.log('PASS arena rules: three players, ties, week and season boundaries, no free points, deduplication, caps, read-only rules, safe invitation URLs');
