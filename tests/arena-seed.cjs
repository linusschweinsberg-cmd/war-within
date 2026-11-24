/* Testdaten für den lokalen Arena-Prüfserver. Nur für die Wegwerf-Datenbank (PGlite), nie für Supabase.
   Legt zwei Arenen an:
   - „Die Dreihundert“: laufende Saison in Woche 3 (Wochen 1–2 abgeschlossen), drei Spieler, Meldungen, Reaktionen.
   - „Morgenlauf-Trio“: wartet in der Lobby, Jonas ist Gründer, Linus Mitglied (Sicht eines Nicht-Gründers). */
const SLOTS=['mind','body','growth','bonds'];
/* Erfüllte Tage je Spieler, Woche und Bereich (vor dem Deckeln auf das Soll). Bewusst unterschiedliche Verläufe:
   Linus konstant, Jonas stark gestartet und eingebrochen, Mira mit Comeback. */
const PLAN={
 0:{1:{mind:3,body:3,growth:2,bonds:2},2:{mind:2,body:4,growth:3,bonds:2},3:{mind:1,body:2,growth:1,bonds:0}},
 1:{1:{mind:3,body:4,growth:3,bonds:1},2:{mind:1,body:2,growth:1,bonds:1},3:{mind:2,body:1,growth:1,bonds:1}},
 2:{1:{mind:1,body:2,growth:3,bonds:2},2:{mind:3,body:4,growth:2,bonds:2},3:{mind:0,body:1,growth:1,bonds:1}}};
const SPREAD=[0,2,4,6,1,3,5];
async function seedArena(db,ids,names){
 const {rows:[t]}=await db.query("select (now() at time zone 'Europe/Berlin')::date as today, date_trunc('week',now() at time zone 'Europe/Berlin')::date as monday");
 const day=(base,n)=>{const d=new Date(base);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
 const today=t.today instanceof Date?t.today.toISOString().slice(0,10):String(t.today),monday=t.monday instanceof Date?t.monday.toISOString().slice(0,10):String(t.monday),start=day(monday,-14);
 const targets={mind:3,body:4,growth:3,bonds:2};
 const {rows:[a]}=await db.query("insert into public.arena_leagues(id,owner_id,name,capacity,targets,start_date,invite_code,created_at) values('30000000-0000-4000-8000-000000000300',$1,'Die Dreihundert',3,$2::jsonb,$3::date,'SPARTA300DEMO',$4::date) returning id",[ids[0],JSON.stringify(targets),start,day(start,-4)]);
 for(let p=0;p<3;p++)await db.query("insert into public.arena_members(league_id,user_id,display_name,joined_at) values($1,$2,$3,$4::date + interval '1 hour'*$5)",[a.id,ids[p],names[p],day(start,-4+p),9+p]);
 const events=[];
 for(let p=0;p<3;p++)for(const w of [1,2,3])for(const [si,slot] of SLOTS.entries()){
  const wStart=day(start,(w-1)*7),open=w<3?7:Math.max(1,Math.round((Date.parse(today)-Date.parse(wStart))/864e5)+1);
  const n=Math.min(PLAN[p][w][slot],targets[slot],open),days=SPREAD.filter(i=>i<open).slice(0,n).sort((x,y)=>x-y);
  for(const i of days){const d=day(wStart,i),hour=7+si*3+p;
   const {rows:[e]}=await db.query("insert into public.arena_completions(league_id,user_id,week,slot,day,created_at) values($1,$2,$3,$4,$5::date,($5::date + make_interval(hours=>$6, mins=>$7)) at time zone 'Europe/Berlin') returning id,created_at",[a.id,ids[p],w,slot,d,hour,7*p]);
   events.push({id:e.id,user:p,at:e.created_at})}}
 /* Reaktionen der anderen auf die jüngsten Meldungen */
 const recent=events.sort((x,y)=>new Date(y.at)-new Date(x.at)).slice(0,10),kinds=['respect','fire','rematch'];
 for(const [i,e] of recent.entries())for(const q of [0,1,2])if(q!==e.user&&(i+q)%2===0)await db.query('insert into public.arena_reactions(event_id,user_id,kind) values($1,$2,$3) on conflict do nothing',[e.id,ids[q],kinds[(i+q)%3]]);
 /* Arena 3.0 (nur wenn die v3-Migration geladen ist): gesperrte Formationen der laufenden Woche 3 mit Wochenplan,
    Doktrinen. Linus hat für Woche 4 noch nichts gewählt (Vorbereitung sichtbar), Jonas schon. */
 if((await db.query("select to_regclass('public.arena_formations') as t")).rows[0].t){
  const plan={mind:[1,3,5],body:[1,3,5,7],growth:[1,3,5],bonds:[2,4]};
  for(const [p,kind,slot] of [[0,'guardian','mind'],[1,'spear','body'],[2,'shield','mind']])await db.query('insert into public.arena_formations(league_id,user_id,week,kind,slot,plan) values($1,$2,3,$3,$4,$5::jsonb)',[a.id,ids[p],kind,slot,JSON.stringify(plan)]);
  await db.query("insert into public.arena_formations(league_id,user_id,week,kind,slot,plan) values($1,$2,4,'spear','growth',$3::jsonb)",[a.id,ids[1],JSON.stringify(plan)]);
  for(const [p,d] of [[0,'guardian'],[1,'spear'],[2,'shield']])await db.query('update public.arena_members set doctrine=$3 where league_id=$1 and user_id=$2',[a.id,ids[p],d]);
 }
 /* Zweite Arena in der Lobby: Jonas ist Gründer, Linus sieht das Soll nur lesend */
 const {rows:[b]}=await db.query("insert into public.arena_leagues(owner_id,name,capacity,targets,invite_code) values($1,'Morgenlauf-Trio',3,$2::jsonb,'MORGENLAUFDEMO') returning id",[ids[1],JSON.stringify({mind:2,body:5,growth:2,bonds:2})]);
 for(const p of [1,0])await db.query('insert into public.arena_members(league_id,user_id,display_name) values($1,$2,$3)',[b.id,ids[p],names[p]]);
 return{running:a.id,lobby:b.id,completions:events.length,start,today};
}
module.exports={seedArena,PLAN};
