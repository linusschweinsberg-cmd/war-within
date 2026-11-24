-- DRAFT. Apply after 202611230001, only after review and explicit approval.
begin;
alter table public.arena_leagues add column if not exists rule_version integer not null default 1;
alter table public.arena_leagues alter column rule_version set default 3;
create table if not exists public.arena_formations(
 league_id uuid not null, user_id uuid not null, week integer not null check(week between 1 and 4),
 kind text not null check(kind in ('shield','spear','guardian')), slot text not null check(slot in ('mind','body','growth','bonds')),
 plan jsonb not null, created_at timestamptz not null default now(),
 primary key(league_id,user_id,week), foreign key(league_id,user_id) references public.arena_members on delete cascade
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
alter table public.arena_score_events enable row level security;
revoke all on public.arena_formations,public.arena_score_events from public,anon,authenticated;
grant select on public.arena_formations,public.arena_score_events to authenticated;
drop policy if exists arena_formations_read on public.arena_formations;
create policy arena_formations_read on public.arena_formations for select to authenticated using(private.arena_member(league_id));
drop policy if exists arena_score_events_read on public.arena_score_events;
create policy arena_score_events_read on public.arena_score_events for select to authenticated using(private.arena_member(league_id));

-- Match the existing JS FNV-1a on ASCII UUID/date inputs. All units are tenths.
create or replace function private.arena_hash(v text) returns bigint language plpgsql immutable set search_path='' as $$
declare h bigint:=2166136261; i integer;
begin for i in 1..length(v) loop h:=((h # ascii(substr(v,i,1))) * 16777619) % 4294967296; end loop; return h; end $$;
create or replace function private.arena_v3_score(l uuid,u uuid,w integer) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare g public.arena_leagues; f public.arena_formations; k text; n integer; t integer; b integer:=0; o integer:=0; fb integer:=0; bb integer:=0; counts jsonb:='{}'; detail jsonb:='[]'; days integer; won boolean;
begin
 select * into g from public.arena_leagues where id=l;
 for k in select unnest(array['mind','body','growth','bonds']) loop
  t:=(g.targets->>k)::integer;
  select count(distinct day) into n from public.arena_completions where league_id=l and user_id=u and week=w and slot=k;
  n:=least(n,t); counts:=counts||jsonb_build_object(k,n); b:=b+round(250.0*n/t)::integer;
  select count(*) into days from public.arena_completions c where c.league_id=l and c.user_id=u and c.week=w and c.slot=k and k=(array['mind','body','growth','bonds'])[1+(private.arena_hash(l::text||'|oracle|'||c.day::text)%4)::integer];
  o:=o+round(125.0*least(days,t)/t)::integer;
  detail:=detail||jsonb_build_array(jsonb_build_object('slot',k,'count',n,'target',t,'base',round(250.0*n/t)::integer,'oracle',round(125.0*least(days,t)/t)::integer));
 end loop;
 k:=(array['mind','body','growth','bonds'])[1+(private.arena_hash(l::text||'|bounty|'||w::text)%4)::integer];
 select q.user_id=u into won from (select c.user_id,max(c.created_at) at from public.arena_completions c where c.league_id=l and c.week=w and c.slot=k group by c.user_id having count(*) >= (g.targets->>k)::integer) q order by q.at,q.user_id limit 1;
 if won then bb:=50; end if;
 select * into f from public.arena_formations where league_id=l and user_id=u and week=w;
 if found then
  if f.kind='shield' and not exists(select 1 from jsonb_each_text(counts) c where c.value::numeric/(g.targets->>c.key)::numeric<0.6) then fb:=60;
  elsif f.kind='spear' and (counts->>f.slot)::integer >= (g.targets->>f.slot)::integer then fb:=60;
  elsif f.kind='guardian' then
   select count(*) into days from generate_series(1,7) d where exists(select 1 from jsonb_each(f.plan) p where p.value @> to_jsonb(array[d]))
    and not exists(select 1 from jsonb_each(f.plan) p where p.value @> to_jsonb(array[d]) and not exists(select 1 from public.arena_completions c where c.league_id=l and c.user_id=u and c.week=w and c.slot=p.key and c.day=g.start_date+(w-1)*7+d-1));
   select count(*) into n from generate_series(1,7) d where exists(select 1 from jsonb_each(f.plan) p where p.value @> to_jsonb(array[d]));
   if days>=least(4,n) then fb:=60; end if;
  end if;
 end if;
 -- Fixed, documented allocation priority: formation, bounty, oracle. Shared cap 150.
 bb:=least(bb,150-fb); o:=least(o,150-fb-bb);
 return jsonb_build_object('base',b,'oracle',o,'bounty',bb,'formation',fb,'bonus',fb+bb+o,'score',b+fb+bb+o,'counts',counts,'targets',g.targets,'breakdown',detail);
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
declare s jsonb; scores jsonb;
begin
 s:=private.arena_snapshot_v1(p_league);
 if (select rule_version from public.arena_leagues where id=p_league)<>3 then return s; end if;
 select coalesce(jsonb_agg(private.arena_v3_score(p_league,m.user_id,w)||jsonb_build_object('user_id',m.user_id,'week',w)),'[]') into scores from public.arena_members m cross join generate_series(1,4) w where m.league_id=p_league;
 return jsonb_set(s,'{league,rule_version}','3')||jsonb_build_object('scores',scores,'formations',coalesce((select jsonb_agg(to_jsonb(f)-'league_id') from public.arena_formations f where league_id=p_league),'[]'),
 'score_events',coalesce((select jsonb_agg(to_jsonb(e) order by seq desc) from (select * from public.arena_score_events where league_id=p_league order by seq desc limit 30) e),'[]'));
end $$;
create or replace function public.arena_command(p_action text,p_league uuid default null,p_data jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare g public.arena_leagues; s jsonb; w integer; d date:=(now() at time zone 'Europe/Berlin')::date; k text; plan jsonb; m record; a jsonb; z jsonb; before_scores jsonb:='{}'; typ text; diff integer; source uuid:=gen_random_uuid();
begin
 if auth.uid() is null then raise exception 'Bitte anmelden.'; end if;
 if p_action in ('create','join') then
  s:=private.arena_command_v1(p_action,p_league,p_data); return public.arena_snapshot((s#>>'{league,id}')::uuid);
 end if;
 select * into g from public.arena_leagues where id=p_league for update;
 if not found or not private.arena_member(p_league) then raise exception 'Diese Arena ist für dein Konto nicht verfügbar.'; end if;
 if g.rule_version<>3 then return private.arena_command_v1(p_action,p_league,p_data); end if;
 w:=floor((d-g.start_date)/7.0)::integer+1;
 if p_action='formation' then
  w:=(p_data->>'week')::integer; plan:=p_data->'plan';
  if w is null or w not between 1 and 4 or g.start_date is null or d>=g.start_date+(w-1)*7 then raise exception 'Formation nur vor Wochenbeginn wählbar.'; end if;
  if p_data->>'kind' is null or p_data->>'kind' not in ('shield','spear','guardian') or p_data->>'slot' is null or p_data->>'slot' not in ('mind','body','growth','bonds') then raise exception 'Ungültige Formation.'; end if;
  if plan is null or jsonb_typeof(plan)<>'object' or (select count(*) from jsonb_object_keys(plan))<>4 then raise exception 'Vier geplante Bereiche erforderlich.'; end if;
  for k in select unnest(array['mind','body','growth','bonds']) loop
   if jsonb_typeof(plan->k) is distinct from 'array' then raise exception 'Geplante Tage fehlen.'; end if;
   if jsonb_array_length(plan->k)<>(g.targets->>k)::integer or exists(select 1 from jsonb_array_elements(plan->k) v where v::text !~ '^[1-7]$') or (select count(distinct v) from jsonb_array_elements(plan->k) v)<>jsonb_array_length(plan->k) then raise exception 'Plane je Bereich genau das Soll auf unterschiedliche Wochentage.'; end if;
  end loop;
  insert into public.arena_formations(league_id,user_id,week,kind,slot,plan) values(g.id,auth.uid(),w,p_data->>'kind',p_data->>'slot',plan) on conflict(league_id,user_id,week) do update set kind=excluded.kind,slot=excluded.slot,plan=excluded.plan,created_at=now();
 else
  if p_action='report' and w between 1 and 4 then
   select id into source from public.arena_completions where league_id=g.id and user_id=auth.uid() and week=w and slot=p_data->>'slot' and day=d;
   for m in select user_id from public.arena_members where league_id=g.id loop before_scores:=before_scores||jsonb_build_object(m.user_id::text,private.arena_v3_score(g.id,m.user_id,w)); end loop;
  end if;
  s:=private.arena_command_v1(p_action,p_league,p_data);
  if p_action='report' and w between 1 and 4 then
   if source is null then select id into source from public.arena_completions where league_id=g.id and user_id=auth.uid() and week=w and slot=p_data->>'slot' and day=d; end if;
   for m in select user_id from public.arena_members where league_id=g.id loop
    a:=before_scores->m.user_id::text; z:=private.arena_v3_score(g.id,m.user_id,w);
    for typ in select unnest(array['base','formation','bounty','oracle']) loop
     diff:=(z->>typ)::integer-(a->>typ)::integer;
     if diff<>0 then insert into public.arena_score_events(league_id,user_id,week,type,delta,slot,source) values(g.id,m.user_id,w,typ,diff,case when typ='base' then p_data->>'slot' end,source); end if;
    end loop;
   end loop;
  end if;
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
revoke all on function private.arena_hash(text),private.arena_v3_score(uuid,uuid,integer),private.arena_snapshot_v1(uuid),private.arena_command_v1(text,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.arena_snapshot(uuid),public.arena_command(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.arena_snapshot(uuid),public.arena_command(text,uuid,jsonb) to authenticated;
commit;
