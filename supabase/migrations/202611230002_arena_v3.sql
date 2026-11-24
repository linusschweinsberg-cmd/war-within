-- DRAFT. Apply after 202611230001, only after review and explicit approval.
-- Arena 3.0 (Regel 3): autoritative Punkte, Formationen, Kriegsrat, Momentum, Vier Säulen, Doktrin, Ereignisprotokoll.
-- Alle Einheiten in Zehnteln (250 = 25,0 sichtbare Punkte). Additiv und wiederholbar ausführbar.
begin;
alter table public.arena_leagues add column if not exists rule_version integer not null default 1;
alter table public.arena_leagues alter column rule_version set default 3;
-- Saison-Draft: rein darstellende Doktrin je Mitglied (keine Punkte), vor dem Saisonstart wählbar.
alter table public.arena_members add column if not exists doctrine text check(doctrine is null or doctrine in ('shield','spear','guardian'));
create table if not exists public.arena_formations(
 league_id uuid not null, user_id uuid not null, week integer not null check(week between 1 and 4),
 kind text not null check(kind in ('shield','spear','guardian')), slot text not null check(slot in ('mind','body','growth','bonds')),
 plan jsonb not null, created_at timestamptz not null default now(),
 primary key(league_id,user_id,week), foreign key(league_id,user_id) references public.arena_members on delete cascade
);
-- Kriegsrat: höchstens ein Wechsel je Woche; die neue Formation gilt ab switch_day (Folgetag).
alter table public.arena_formations add column if not exists switch_day date;
alter table public.arena_formations add column if not exists prev_kind text check(prev_kind is null or prev_kind in ('shield','spear','guardian'));
create table if not exists public.arena_formation_log(
 seq bigint generated always as identity primary key,
 league_id uuid not null, user_id uuid not null, week integer not null check(week between 1 and 4),
 action text not null check(action in ('choose','switch')), kind text not null, slot text not null, effective_day date not null,
 created_at timestamptz not null default now(),
 foreign key(league_id,user_id) references public.arena_members on delete cascade
);
create table if not exists public.arena_score_events(
 seq bigint generated always as identity primary key, id uuid not null unique default gen_random_uuid(),
 league_id uuid not null references public.arena_leagues on delete cascade,
 user_id uuid not null references auth.users on delete cascade, week integer not null check(week between 1 and 4),
 type text not null, delta integer not null, slot text, rule_version integer not null default 3,
 source uuid, created_at timestamptz not null default now()
);
create index if not exists arena_score_feed on public.arena_score_events(league_id,seq desc);
alter table public.arena_formations enable row level security;
alter table public.arena_formation_log enable row level security;
alter table public.arena_score_events enable row level security;
revoke all on public.arena_formations,public.arena_formation_log,public.arena_score_events from public,anon,authenticated;
grant select on public.arena_formations,public.arena_formation_log,public.arena_score_events to authenticated;
-- Fremde Formationen erst ab Wochenbeginn sichtbar: die Aufstellung bleibt bis zur Sperre geheim.
create or replace function private.arena_week_open(l uuid,w integer) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.arena_leagues g where g.id=l and g.start_date is not null and g.start_date+(w-1)*7<=(now() at time zone 'Europe/Berlin')::date);
$$;
revoke all on function private.arena_week_open(uuid,integer) from public,anon,authenticated;
grant execute on function private.arena_week_open(uuid,integer) to authenticated;
drop policy if exists arena_formations_read on public.arena_formations;
create policy arena_formations_read on public.arena_formations for select to authenticated using(private.arena_member(league_id) and (user_id=(select auth.uid()) or private.arena_week_open(league_id,week)));
drop policy if exists arena_formation_log_read on public.arena_formation_log;
create policy arena_formation_log_read on public.arena_formation_log for select to authenticated using(private.arena_member(league_id) and (user_id=(select auth.uid()) or private.arena_week_open(league_id,week)));
drop policy if exists arena_score_events_read on public.arena_score_events;
create policy arena_score_events_read on public.arena_score_events for select to authenticated using(private.arena_member(league_id));

-- Match the existing JS FNV-1a on ASCII UUID/date inputs.
create or replace function private.arena_hash(v text) returns bigint language plpgsql immutable set search_path='' as $$
declare h bigint:=2166136261; i integer;
begin for i in 1..length(v) loop h:=((h # ascii(substr(v,i,1))) * 16777619) % 4294967296; end loop; return h; end $$;

-- Zentrale Wertung Regel 3. Gespiegelt in arena-core.js (scoreV3); tests/arena-v3.cjs vergleicht beide.
-- Basis ≤ 1000 (je Bereich Tage/Soll × 250). Bonus ≤ 150 in fester Reihenfolge:
-- Formation 60, Vier Säulen 50, Momentum 40, Wochenprämie 50, Orakel (je Orakel-Tag halber Tageswert).
create or replace function private.arena_v3_score(l uuid,u uuid,w integer) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare g public.arena_leagues; f public.arena_formations; k text; n integer; t integer; b integer:=0; o integer:=0; fb integer:=0; bb integer:=0; cb integer:=0; mb integer:=0;
 counts jsonb:='{}'; detail jsonb:='[]'; days integer; won boolean; ws date; e date; d integer; ok boolean; streak integer:=0; best integer:=0; pdays integer:=0; fdays integer:=0;
 pillars integer:=0; pw integer; cw integer; met boolean; slots text[]:=array['mind','body','growth','bonds']; kind text:=null; switched boolean:=false;
begin
 select * into g from public.arena_leagues where id=l;
 ws:=g.start_date+(w-1)*7;
 foreach k in array slots loop
  t:=(g.targets->>k)::integer;
  select count(distinct day) into n from public.arena_completions where league_id=l and user_id=u and week=w and slot=k;
  n:=least(n,t); counts:=counts||jsonb_build_object(k,n); b:=b+round(250.0*n/t)::integer;
  if n>=t then pillars:=pillars+1; end if;
  select count(*) into days from public.arena_completions c where c.league_id=l and c.user_id=u and c.week=w and c.slot=k and k=slots[1+(private.arena_hash(l::text||'|oracle|'||c.day::text)%4)::integer];
  o:=o+round(125.0*least(days,t)/t)::integer;
  detail:=detail||jsonb_build_array(jsonb_build_object('slot',k,'count',n,'target',t,'base',round(250.0*n/t)::integer,'oracle',round(125.0*least(days,t)/t)::integer));
 end loop;
 -- Vier Säulen: Soll in mindestens drei Bereichen voll erfüllt. Einmal je Woche, keine Zusatzaufgaben.
 if pillars>=3 then cb:=50; end if;
 k:=slots[1+(private.arena_hash(l::text||'|bounty|'||w::text)%4)::integer];
 select q.user_id=u into won from (select c.user_id,max(c.created_at) at from public.arena_completions c where c.league_id=l and c.week=w and c.slot=k group by c.user_id having count(*) >= (g.targets->>k)::integer) q order by q.at,q.user_id limit 1;
 if won then bb:=50; end if;
 select * into f from public.arena_formations where league_id=l and user_id=u and week=w;
 if found then
  kind:=f.kind; switched:=f.switch_day is not null; e:=coalesce(f.switch_day,ws);
  for d in 1..7 loop
   continue when not exists(select 1 from jsonb_each(f.plan) p where p.value @> to_jsonb(array[d]));
   ok:=not exists(select 1 from jsonb_each(f.plan) p where p.value @> to_jsonb(array[d]) and not exists(select 1 from public.arena_completions c where c.league_id=l and c.user_id=u and c.week=w and c.slot=p.key and c.day=ws+d-1));
   -- Momentum: geplante Tage in Folge erfüllt; ungeplante Ruhetage unterbrechen nicht.
   if ok then streak:=streak+1; best:=greatest(best,streak); else streak:=0; end if;
   if ws+d-1>=e then pdays:=pdays+1; if ok then fdays:=fdays+1; end if; end if;
  end loop;
  if best>=3 then mb:=40; end if;
  -- Formation: nur Plantage und Meldungen ab Gültigkeitsbeginn e (Wochenstart bzw. Tag nach dem Kriegsrat).
  met:=true;
  foreach k in array slots loop
   t:=(g.targets->>k)::integer;
   select count(*) into pw from jsonb_array_elements(f.plan->k) v where ws+(v::text)::integer-1>=e;
   select count(*) into n from public.arena_completions where league_id=l and user_id=u and week=w and slot=k and day<e;
   pw:=least(pw,greatest(t-n,0));
   select count(*) into cw from public.arena_completions where league_id=l and user_id=u and week=w and slot=k and day>=e;
   if f.kind='shield' and cw<ceil(6*pw/10.0) then met:=false; end if;
   if f.kind='spear' and k=f.slot and (pw<1 or cw<pw) then met:=false; end if;
  end loop;
  if f.kind='shield' and not exists(select 1 from jsonb_each(f.plan) p, jsonb_array_elements(p.value) v where ws+(v::text)::integer-1>=e) then met:=false; end if;
  if f.kind='guardian' then met:=pdays>=1 and fdays>=least(4,pdays); end if;
  if met then fb:=60; end if;
 end if;
 fb:=least(fb,150); cb:=least(cb,150-fb); mb:=least(mb,150-fb-cb); bb:=least(bb,150-fb-cb-mb); o:=least(o,150-fb-cb-mb-bb);
 return jsonb_build_object('base',b,'oracle',o,'bounty',bb,'formation',fb,'combo',cb,'momentum',mb,'bonus',fb+cb+mb+bb+o,'score',b+fb+cb+mb+bb+o,
  'counts',counts,'targets',g.targets,'breakdown',detail,'pillars',pillars,'run',best,'kind',kind,'switched',switched,'guard',jsonb_build_object('done',fdays,'planned',pdays));
end $$;

-- Rename once so this additive migration can be applied repeatedly.
do $$ begin
 if to_regprocedure('private.arena_snapshot_v1(uuid)') is null then
  alter function public.arena_snapshot(uuid) set schema private;
  alter function private.arena_snapshot(uuid) rename to arena_snapshot_v1;
  alter function public.arena_command(text,uuid,jsonb) set schema private;
  alter function private.arena_command(text,uuid,jsonb) rename to arena_command_v1;
 end if;
end $$;
create or replace function public.arena_snapshot(p_league uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare s jsonb; scores jsonb; me uuid:=auth.uid();
begin
 s:=private.arena_snapshot_v1(p_league);
 if (select rule_version from public.arena_leagues where id=p_league)<>3 then return s; end if;
 select coalesce(jsonb_agg(private.arena_v3_score(p_league,m.user_id,w)||jsonb_build_object('user_id',m.user_id,'week',w)),'[]') into scores from public.arena_members m cross join generate_series(1,4) w where m.league_id=p_league;
 return jsonb_set(s,'{league,rule_version}','3')||jsonb_build_object('scores',scores,
  'doctrines',coalesce((select jsonb_object_agg(user_id,doctrine) from public.arena_members where league_id=p_league and doctrine is not null),'{}'),
  'formations',coalesce((select jsonb_agg(to_jsonb(f)-'league_id') from public.arena_formations f where league_id=p_league and (f.user_id=me or private.arena_week_open(p_league,f.week))),'[]'),
  'tactics',coalesce((select jsonb_agg(to_jsonb(x)-'league_id' order by x.seq desc) from (select * from public.arena_formation_log where league_id=p_league and (user_id=me or private.arena_week_open(p_league,week)) order by seq desc limit 20) x),'[]'),
  'score_events',coalesce((select jsonb_agg(to_jsonb(e) order by seq desc) from (select * from public.arena_score_events where league_id=p_league order by seq desc limit 30) e),'[]'));
end $$;
-- Plan prüfen: je Bereich unterschiedliche Wochentage 1–7, alle ≥ from_day, genau die verlangte Anzahl.
create or replace function private.arena_plan_ok(plan jsonb,need jsonb,from_day integer) returns boolean language plpgsql immutable set search_path='' as $$
declare k text;
begin
 if plan is null or jsonb_typeof(plan)<>'object' or (select count(*) from jsonb_object_keys(plan))<>4 then return false; end if;
 foreach k in array array['mind','body','growth','bonds'] loop
  if jsonb_typeof(plan->k) is distinct from 'array' then return false; end if;
  if exists(select 1 from jsonb_array_elements(plan->k) v where case when v::text ~ '^[1-7]$' then (v::text)::integer<from_day else true end) then return false; end if;
  if (select count(distinct v) from jsonb_array_elements(plan->k) v)<>jsonb_array_length(plan->k) or jsonb_array_length(plan->k)<>(need->>k)::integer then return false; end if;
 end loop;
 return true;
end $$;
create or replace function public.arena_command(p_action text,p_league uuid default null,p_data jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare g public.arena_leagues; s jsonb; w integer; d date:=(now() at time zone 'Europe/Berlin')::date; k text; plan jsonb; m record; a jsonb; z jsonb; before_scores jsonb:='{}'; typ text; diff integer; source uuid:=gen_random_uuid();
 f public.arena_formations; need jsonb:='{}'; ws date; e integer; merged jsonb:='{}';
begin
 if auth.uid() is null then raise exception 'Bitte anmelden.'; end if;
 if p_action in ('create','join') then
  s:=private.arena_command_v1(p_action,p_league,p_data); return public.arena_snapshot((s#>>'{league,id}')::uuid);
 end if;
 select * into g from public.arena_leagues where id=p_league for update;
 if not found or not private.arena_member(p_league) then raise exception 'Diese Arena ist für dein Konto nicht verfügbar.'; end if;
 if g.rule_version<>3 then return private.arena_command_v1(p_action,p_league,p_data); end if;
 w:=floor((d-g.start_date)/7.0)::integer+1;
 -- Stand aller Mitglieder vor der Aktion; danach werden nur Differenzen als Ereignisse gespeichert (Wiederholung = keine Differenz).
 if w between 1 and 4 and p_action in ('report','switch') then
  for m in select user_id from public.arena_members where league_id=g.id loop before_scores:=before_scores||jsonb_build_object(m.user_id::text,private.arena_v3_score(g.id,m.user_id,w)); end loop;
 end if;
 if p_action='doctrine' then
  if g.start_date is not null and d>=g.start_date then raise exception 'Die Doktrin wird vor dem Saisonstart gewählt.'; end if;
  if p_data->>'kind' is null or p_data->>'kind' not in ('shield','spear','guardian') then raise exception 'Ungültige Doktrin.'; end if;
  update public.arena_members set doctrine=p_data->>'kind' where league_id=g.id and user_id=auth.uid();
 elsif p_action='formation' then
  w:=(p_data->>'week')::integer; plan:=p_data->'plan';
  if w is null or w not between 1 and 4 or g.start_date is null or d>=g.start_date+(w-1)*7 then raise exception 'Formation nur vor Wochenbeginn wählbar.'; end if;
  if p_data->>'kind' is null or p_data->>'kind' not in ('shield','spear','guardian') or p_data->>'slot' is null or p_data->>'slot' not in ('mind','body','growth','bonds') then raise exception 'Ungültige Formation.'; end if;
  if not private.arena_plan_ok(plan,g.targets,1) then raise exception 'Plane je Bereich genau das Soll auf unterschiedliche Wochentage.'; end if;
  insert into public.arena_formations(league_id,user_id,week,kind,slot,plan) values(g.id,auth.uid(),w,p_data->>'kind',p_data->>'slot',plan)
   on conflict(league_id,user_id,week) do update set kind=excluded.kind,slot=excluded.slot,plan=excluded.plan,switch_day=null,prev_kind=null,created_at=now();
  insert into public.arena_formation_log(league_id,user_id,week,action,kind,slot,effective_day) values(g.id,auth.uid(),w,'choose',p_data->>'kind',p_data->>'slot',g.start_date+(w-1)*7);
 elsif p_action='switch' then
  -- Kriegsrat: einmal je Woche, Montag bis Donnerstag, gilt ab morgen und nur für künftige Tage.
  if w is null or w not between 1 and 4 then raise exception 'Die Spielwoche läuft gerade nicht.'; end if;
  ws:=g.start_date+(w-1)*7; e:=(d-ws)+2;
  if e>5 then raise exception 'Der Kriegsrat tagt nur Montag bis Donnerstag.'; end if;
  select * into f from public.arena_formations where league_id=g.id and user_id=auth.uid() and week=w;
  if not found then raise exception 'Für diese Woche ist keine Formation gesperrt.'; end if;
  if f.switch_day is not null then raise exception 'Der Kriegsrat wurde diese Woche schon genutzt.'; end if;
  if (before_scores->auth.uid()::text->>'formation')::integer>0 then raise exception 'Diese Formation ist bereits gemeistert.'; end if;
  if p_data->>'kind' is null or p_data->>'kind' not in ('shield','spear','guardian') or p_data->>'slot' is null or p_data->>'slot' not in ('mind','body','growth','bonds') then raise exception 'Ungültige Formation.'; end if;
  foreach k in array array['mind','body','growth','bonds'] loop
   need:=need||jsonb_build_object(k,least(8-e,greatest(0,(g.targets->>k)::integer-(select count(*) from public.arena_completions c where c.league_id=g.id and c.user_id=auth.uid() and c.week=w and c.slot=k)::integer)));
  end loop;
  plan:=p_data->'plan';
  if not private.arena_plan_ok(plan,need,e) then raise exception 'Plane ab morgen genau das noch offene Soll je Bereich.'; end if;
  if p_data->>'kind'='spear' and (need->>(p_data->>'slot'))::integer<1 then raise exception 'Dieser Bereich ist schon erfüllt. Wähle einen offenen Schwerpunkt.'; end if;
  foreach k in array array['mind','body','growth','bonds'] loop
   merged:=merged||jsonb_build_object(k,coalesce((select jsonb_agg(v order by (v::text)::integer) from (select v from jsonb_array_elements(f.plan->k) v where (v::text)::integer<e union all select v from jsonb_array_elements(plan->k) v) x),'[]'));
  end loop;
  update public.arena_formations set prev_kind=f.kind,kind=p_data->>'kind',slot=p_data->>'slot',plan=merged,switch_day=ws+e-1 where league_id=g.id and user_id=auth.uid() and week=w;
  insert into public.arena_formation_log(league_id,user_id,week,action,kind,slot,effective_day) values(g.id,auth.uid(),w,'switch',p_data->>'kind',p_data->>'slot',ws+e-1);
 else
  if p_action='report' and w between 1 and 4 then
   select id into source from public.arena_completions where league_id=g.id and user_id=auth.uid() and week=w and slot=p_data->>'slot' and day=d;
  end if;
  s:=private.arena_command_v1(p_action,p_league,p_data);
  if p_action='report' and w between 1 and 4 and source is null then
   select id into source from public.arena_completions where league_id=g.id and user_id=auth.uid() and week=w and slot=p_data->>'slot' and day=d;
  end if;
 end if;
 if w between 1 and 4 and p_action in ('report','switch') then
  for m in select user_id from public.arena_members where league_id=g.id loop
   a:=before_scores->m.user_id::text; z:=private.arena_v3_score(g.id,m.user_id,w);
   continue when a is null;
   foreach typ in array array['base','formation','combo','momentum','bounty','oracle'] loop
    diff:=(z->>typ)::integer-(a->>typ)::integer;
    if diff<>0 then insert into public.arena_score_events(league_id,user_id,week,type,delta,slot,source) values(g.id,m.user_id,w,typ,diff,case when typ='base' then p_data->>'slot' end,source); end if;
   end loop;
  end loop;
 end if;
 return public.arena_snapshot(g.id);
end $$;
create or replace function public.arena_events(p_league uuid,p_before bigint default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.arena_member(p_league) then raise exception 'Diese Arena ist für dein Konto nicht verfügbar.'; end if;
 return coalesce((select jsonb_agg(to_jsonb(e) order by seq desc) from (select * from public.arena_score_events where league_id=p_league and (p_before is null or seq<p_before) order by seq desc limit 30) e),'[]');
end $$;
revoke all on function public.arena_events(uuid,bigint) from public,anon,authenticated;
grant execute on function public.arena_events(uuid,bigint) to authenticated;
revoke all on function private.arena_hash(text),private.arena_v3_score(uuid,uuid,integer),private.arena_plan_ok(jsonb,jsonb,integer),private.arena_snapshot_v1(uuid),private.arena_command_v1(text,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.arena_snapshot(uuid),public.arena_command(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.arena_snapshot(uuid),public.arena_command(text,uuid,jsonb) to authenticated;
commit;
