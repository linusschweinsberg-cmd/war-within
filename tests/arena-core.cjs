const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const ctx=vm.createContext({URL});vm.runInContext(fs.readFileSync(path.join(__dirname,'../arena-core.js'),'utf8'),ctx);const A=ctx.ArenaCore;
const targets={mind:3,body:3,growth:3,bonds:3},SL=['mind','body','growth','bonds'];
function fixture(t=targets,id='league-1'){return{today:'2026-11-30',league:{id,start_date:'2026-11-30',targets:t},members:['a','b','c'].map(user_id=>({user_id,display_name:user_id})),completions:[]};}
let clock=0;const report=(s,user_id,slot,day,week=1)=>s.completions.push({user_id,slot,week,day,created_at:new Date(Date.parse(day+'T08:00:00Z')+(clock++)*60000).toISOString()});
const week1=['2026-11-30','2026-12-01','2026-12-02','2026-12-03','2026-12-04','2026-12-05','2026-12-06'];
assert.equal(A.validTargets(targets),true);for(const t of [{...targets,mind:0},{...targets,mind:8},{...targets,mind:1.5},{...targets,mind:'3'},{...targets,private:'secret'},null])assert.equal(A.validTargets(t),false);
let s=fixture();s.league.start_date=null;assert.equal(A.phase(s).kind,'lobby');
s=fixture();s.today='2026-11-29';assert.equal(A.phase(s).kind,'scheduled');s.today='2026-12-06';assert.equal(A.phase(s).week,1);assert.equal(A.phase(s).closed,0);s.today='2026-12-07';assert.equal(A.phase(s).week,2);assert.equal(A.phase(s).closed,1);s.today='2026-12-28';assert.equal(A.phase(s).kind,'finished');
s=fixture();assert.ok(A.weekly(s,1).every(r=>r.points===0),'zero activity never awards free wins');
/* Gleiche Erfüllung am gleichen Tag → gleicher Score, auch mit Orakel (für alle derselbe Bereich). */
for(const u of ['a','b'])for(const slot of SL)report(s,u,slot,'2026-11-30');
let rows=A.weekly(s,1);assert.equal(rows[0].base,332);assert.equal(rows[0].score,rows[1].score,'same work, same score');assert.equal(rows[0].rank,1);assert.equal(rows[1].rank,1);assert.equal(rows[2].rank,3);assert.deepEqual(Array.from(rows,r=>r.points),[3,3,0]);assert.ok(A.season(s).every(r=>r.points===0),'live week remains provisional');
assert.equal(rows[0].oracleHits,1,'exactly the oracle slot of that day is boosted');assert.equal(rows[0].oracle,42,'oracle adds half a day');
s.today='2026-12-07';assert.deepEqual(Array.from(A.season(s),r=>r.points),[3,3,0]);
s.completions.push({...s.completions[0]});assert.equal(A.weekly(s,1)[0].base,332,'duplicate reports do not score twice');
/* Faire Wertung: mehr Erfüllung schlägt weniger, niemand holt sich mit einem kleinen Soll die volle Punktzahl. */
s=fixture();for(const slot of SL){report(s,'a',slot,'2026-11-30');for(const day of week1.slice(0,3))report(s,'b',slot,day)}
rows=A.weekly(s,1);assert.equal(rows[0].user_id,'b');assert.equal(rows[0].base,1000);assert.equal(rows.find(r=>r.user_id==='a').base,332);assert.ok(rows.every(r=>JSON.stringify(r.targets)===JSON.stringify(targets)),'everyone plays the same targets');
s=fixture({mind:1,body:1,growth:1,bonds:1});for(const slot of SL)for(const day of week1.slice(0,2))report(s,'a',slot,day);assert.equal(A.weekly(s,1)[0].base,1000,'base caps at 100');
/* Orakel: deterministisch je Arena und Tag, gleich für alle, verteilt über die Bereiche. */
s=fixture();const o=week1.map(d=>A.oracle(s,d));assert.deepEqual(o,week1.map(d=>A.oracle(fixture(),d)),'same arena, same oracle');assert.ok(new Set(o).size>=2,'oracle varies across the week');assert.ok(o.every(x=>SL.includes(x)));
const other=week1.map(d=>A.oracle(fixture(targets,'league-2'),d));assert.notDeepEqual(o,other,'different arenas get different days');
/* Wochenprämie: wer zuerst das Soll des ausgelosten Bereichs erfüllt, bekommt +50 (5 Arenapunkte). */
s=fixture();const b=A.bounty(s,1);assert.ok(SL.includes(b.slot));assert.equal(b.winner,null,'no winner without completions');
for(const day of week1.slice(0,3))report(s,'b',b.slot,day);for(const day of week1.slice(0,3))report(s,'a',b.slot,day);
const won=A.bounty(s,1);assert.equal(won.winner,'b','first to reach the target wins');rows=A.weekly(s,1);assert.equal(rows.find(r=>r.user_id==='b').bounty,50);assert.equal(rows.find(r=>r.user_id==='a').bounty,0);assert.ok(rows.find(r=>r.user_id==='b').score>rows.find(r=>r.user_id==='a').score,'bounty breaks the tie');
s=fixture();for(const day of week1.slice(0,2))report(s,'a',A.bounty(s,1).slot,day);assert.equal(A.bounty(s,1).winner,null,'partial target does not win');
/* Automatische Übernahme: nur Aufgaben mit passendem Bereich, Finanzen nie. */
assert.equal(A.ACT_SLOT.run,'body');assert.equal(A.ACT_SLOT.lang,'growth');assert.equal(A.ACT_SLOT.rel,'bonds');assert.equal(A.ACT_SLOT.fin,undefined);assert.equal(A.ACT_SLOT.biz,undefined);
s=fixture();delete s.league.targets;assert.deepEqual({...A.targetsOf(s)},targets,'missing targets fall back to the default');s.league.targets={mind:9};assert.deepEqual({...A.targetsOf(s)},targets,'invalid targets fall back to the default');
const u=new URL(A.invitation('ABC123','https://example.com/war-within/?token=private#secret'));assert.equal(u.search,'?arena=ABC123');assert.equal(u.hash,'');assert.equal(u.pathname,'/war-within/');
s=fixture();report(s,'a','mind','2026-11-30');const original=JSON.stringify(s);A.phase(s);A.weekly(s,1);A.season(s);A.bounty(s,1);A.oracle(s,'2026-11-30');assert.equal(JSON.stringify(s),original,'rules do not mutate any state');
console.log('PASS arena rules: shared targets, fair ranking, oracle (same for all, deterministic), weekly bounty (first to target), task mapping, ties, boundaries, caps, read-only rules, safe invitation URLs');

// Awards count distinct days, require prior activity, and cross week boundaries.
s=fixture();s.today='2026-12-14';
assert.equal(A.awards(s,1).days,0);assert.equal(A.awards(s,1).comebacks.length,0);
for(const d of ['2026-11-30','2026-12-04','2026-12-05','2026-12-06'])report(s,'a','mind',d);
assert.equal(A.awards(s,1).comebacks[0].user_id,'a');assert.equal(A.awards(s,1).days,4);
report(s,'a','body','2026-12-06');assert.equal(A.awards(s,1).days,4,'multiple slots are one active day');
s.completions=s.completions.filter(e=>e.day!=='2026-12-05');assert.equal(A.awards(s,1).comebacks.length,0,'undo removes award');
s=fixture();s.today='2026-12-14';for(const d of ['2026-11-30','2026-12-06','2026-12-07','2026-12-08'])report(s,'a','mind',d,d>'2026-12-06'?2:1);
assert.equal(A.awards(s,1).comebacks.length,0);assert.equal(A.awards(s,2).comebacks[0].day,'2026-12-08','award belongs to third day week');
s.today='2026-12-07';assert.equal(A.awards(s,2).comebacks.length,0,'future entries do not award');
s=fixture();s.today='2026-12-06';for(const u of ['a','b'])for(const d of week1.slice(0,3))report(s,u,'mind',d);
assert.equal(A.awards(s,1).comebacks.length,0,'new arrival is not comeback');assert.equal(A.awards(s,1).consistent.length,2,'shared consistency award');
for(const r of A.weekly(s,1)){assert.equal(r.breakdown.reduce((n,b)=>n+b.base,0),r.base);assert.equal(r.breakdown.reduce((n,b)=>n+b.oracle,0),r.oracle);assert.equal(r.base+r.oracle+r.bounty,r.score);}
const unchanged=JSON.stringify(s);A.awards(s,1);assert.equal(JSON.stringify(s),unchanged);
console.log('PASS comeback, distinct days, cross-week awards, undo, ties and scoring breakdown');
