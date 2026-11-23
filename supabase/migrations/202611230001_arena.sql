-- DRAFT: review and apply separately. No automatic changes to the hosted project.
-- Self-contained Arena extension. Independent of the unmerged base schema in PR #14.
-- Faire Wertung: ein gemeinsames Wochen-Soll je Bereich für die ganze Gruppe (vom Gründer vor dem Start festgelegt).
begin;
create schema if not exists private;
revoke all on schema private from public,anon;
grant usage on schema private to authenticated;

create function private.arena_targets_ok(t jsonb) returns boolean language sql immutable set search_path='' as $$
 select t is not null and jsonb_typeof(t)='object' and (select count(*) from jsonb_object_keys(t))=4
  and coalesce((select bool_and(t ? k and jsonb_typeof(t->k)='number' and (t->>k)~'^[1-7]$') from unnest(array['mind','body','growth','bonds']) k),false);
$$;
revoke all on function private.arena_targets_ok(jsonb) from public,anon,authenticated;

create table public.arena_leagues(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(btrim(name)) between 1 and 40),
 invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,16)),
 capacity integer not null default 3 check(capacity between 2 and 8),
 targets jsonb not null default '{"mind":3,"body":3,"growth":3,"bonds":3}'::jsonb check(private.arena_targets_ok(targets)),
 start_date date check(start_date is null or extract(isodow from start_date)=1),
 created_at timestamptz not null default now()
);
create table public.arena_members(
 league_id uuid not null references public.arena_leagues(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 display_name text not null check(length(btrim(display_name)) between 1 and 24),
 joined_at timestamptz not null default now(), primary key(league_id,user_id)
);
create index arena_members_user on public.arena_members(user_id,league_id);
create table public.arena_completions(
 id uuid not null unique default gen_random_uuid(),
 league_id uuid not null, user_id uuid not null, week integer not null check(week between 1 and 4), slot text not null check(slot in ('mind','body','growth','bonds')),
 day date not null, created_at timestamptz not null default now(),
 primary key(league_id,user_id,week,slot,day),
 foreign key(league_id,user_id) references public.arena_members(league_id,user_id) on delete cascade
);
create index arena_completions_feed on public.arena_completions(league_id,created_at desc);
create table public.arena_reactions(
 event_id uuid not null references public.arena_completions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('respect','fire','rematch')),primary key(event_id,user_id)
);

create function private.arena_member(p_league uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.arena_members where league_id=p_league and user_id=(select auth.uid()));
$$;
revoke all on function private.arena_member(uuid) from public,anon,authenticated;
grant execute on function private.arena_member(uuid) to authenticated;
alter table public.arena_leagues enable row level security;
alter table public.arena_members enable row level security;
alter table public.arena_completions enable row level security;
alter table public.arena_reactions enable row level security;
revoke all on public.arena_leagues,public.arena_members,public.arena_completions,public.arena_reactions from public,anon,authenticated;
grant select on public.arena_leagues,public.arena_members,public.arena_completions,public.arena_reactions to authenticated;
create policy arena_leagues_read on public.arena_leagues for select to authenticated using(private.arena_member(id));
create policy arena_members_read on public.arena_members for select to authenticated using(private.arena_member(league_id));
create policy arena_completions_read on public.arena_completions for select to authenticated using(private.arena_member(league_id));
create policy arena_reactions_read on public.arena_reactions for select to authenticated using(exists(select 1 from public.arena_completions e where e.id=event_id and private.arena_member(e.league_id)));
-- Writes only through authenticated, membership-checked RPCs. No INSERT/UPDATE/DELETE grants.

create function public.arena_list() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',g.id,'name',g.name,'capacity',g.capacity,'start_date',g.start_date,'members',(select count(*) from public.arena_members a where a.league_id=g.id)) order by g.created_at desc),'[]'::jsonb)
 from public.arena_leagues g join public.arena_members m on m.league_id=g.id where m.user_id=(select auth.uid());
$$;
create function public.arena_snapshot(p_league uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare g public.arena_leagues;
begin
 if auth.uid() is null or not private.arena_member(p_league) then raise exception 'Diese Arena ist für dein Konto nicht verfügbar.'; end if;
 select * into g from public.arena_leagues where id=p_league;
 return jsonb_build_object('league',jsonb_build_object('id',g.id,'owner_id',g.owner_id,'name',g.name,'capacity',g.capacity,'targets',g.targets,'start_date',g.start_date,'invite_code',g.invite_code),
 'today',(now() at time zone 'Europe/Berlin')::date,'server_now',now(),'user_id',auth.uid(),
 'members',coalesce((select jsonb_agg(jsonb_build_object('user_id',user_id,'display_name',display_name) order by joined_at,user_id) from public.arena_members where league_id=p_league),'[]'::jsonb),
 'completions',coalesce((select jsonb_agg(jsonb_build_object('id',id,'user_id',user_id,'week',week,'slot',slot,'day',day,'created_at',created_at) order by created_at desc,id) from public.arena_completions where league_id=p_league),'[]'::jsonb),
 'reactions',coalesce((select jsonb_agg(jsonb_build_object('event_id',r.event_id,'user_id',r.user_id,'kind',r.kind)) from public.arena_reactions r join public.arena_completions e on e.id=r.event_id where e.league_id=p_league),'[]'::jsonb));
end; $$;

create function public.arena_command(p_action text,p_league uuid default null,p_data jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); g public.arena_leagues; d date:=(now() at time zone 'Europe/Berlin')::date; w integer; t jsonb; k text; n integer; ev uuid;
begin
 if u is null then raise exception 'Bitte mit deinem E-Mail-Konto anmelden.'; end if;
 if p_action='create' then
  if (select count(*) from public.arena_members where user_id=u)>=10 then raise exception 'Du kannst höchstens zehn Arenen beitreten.'; end if;
  t:=coalesce(p_data->'targets','{"mind":3,"body":3,"growth":3,"bonds":3}'::jsonb);
  if not private.arena_targets_ok(t) then raise exception 'Jeder Bereich braucht ein bis sieben Tage.'; end if;
  insert into public.arena_leagues(owner_id,name,capacity,targets) values(u,btrim(p_data->>'name'),(p_data->>'capacity')::integer,t) returning * into g;
  insert into public.arena_members values(g.id,u,btrim(p_data->>'display_name'),now());
  return public.arena_snapshot(g.id);
 end if;
 if p_action='join' then
  select * into g from public.arena_leagues where invite_code=upper(btrim(p_data->>'code')) for update;
  if not found then raise exception 'Einladung nicht verfügbar. Bitte prüfe den Code.'; end if;
  if private.arena_member(g.id) then return public.arena_snapshot(g.id); end if;
  if g.start_date is not null then raise exception 'Diese Saison ist bereits gestartet.'; end if;
  if (select count(*) from public.arena_members where league_id=g.id)>=g.capacity then raise exception 'Diese Arena ist bereits voll.'; end if;
  if (select count(*) from public.arena_members where user_id=u)>=10 then raise exception 'Du kannst höchstens zehn Arenen beitreten.'; end if;
  insert into public.arena_members values(g.id,u,btrim(p_data->>'display_name'),now());return public.arena_snapshot(g.id);
 end if;
 select * into g from public.arena_leagues where id=p_league for update;
 if not found or not private.arena_member(p_league) then raise exception 'Diese Arena ist für dein Konto nicht verfügbar.'; end if;
 w:=case when g.start_date is null then 0 else floor((d-g.start_date)/7.0)::integer+1 end;
 if p_action='start' then
  if g.owner_id<>u or g.start_date is not null then raise exception 'Nur der Gründer kann eine wartende Saison starten.'; end if;
  if (select count(*) from public.arena_members where league_id=g.id)<2 then raise exception 'Zum Start braucht ihr mindestens zwei Personen.'; end if;
  update public.arena_leagues set start_date=date_trunc('week',d::timestamp)::date+7 where id=g.id;
 elsif p_action='targets' then
  -- Das gemeinsame Soll gilt für alle gleich und steht ab dem Saisonstart fest.
  if g.owner_id<>u or g.start_date is not null then raise exception 'Nur der Gründer legt das Soll vor dem Start fest.'; end if;
  t:=p_data->'targets';
  if not private.arena_targets_ok(t) then raise exception 'Jeder Bereich braucht ein bis sieben Tage.'; end if;
  update public.arena_leagues set targets=t where id=g.id;
 elsif p_action='report' then
  if w<1 or w>4 then raise exception 'Die Spielwoche läuft gerade nicht.'; end if;
  k:=p_data->>'slot';if k is null or k not in ('mind','body','growth','bonds') then raise exception 'Unbekannter Bereich.'; end if;
  t:=g.targets;
  if p_data->'done'='true'::jsonb then
   n:=(select count(*) from public.arena_completions where league_id=g.id and user_id=u and week=w and slot=k);
   if n<(t->>k)::integer then insert into public.arena_completions(league_id,user_id,week,slot,day) values(g.id,u,w,k,d) on conflict do nothing; end if;
  elsif p_data->'done'='false'::jsonb then
   delete from public.arena_completions where league_id=g.id and user_id=u and week=w and slot=k and day=d;
  else raise exception 'Bitte Erledigung oder Rücknahme wählen.'; end if;
 elsif p_action='react' then
  ev:=(p_data->>'event')::uuid;k:=p_data->>'kind';
  if k is null or k not in ('respect','fire','rematch') or not exists(select 1 from public.arena_completions where id=ev and league_id=g.id) then raise exception 'Diese Reaktion ist nicht verfügbar.'; end if;
  insert into public.arena_reactions values(ev,u,k) on conflict(event_id,user_id) do update set kind=excluded.kind;
 else raise exception 'Unbekannte Arena-Aktion.';
 end if;
 return public.arena_snapshot(g.id);
end; $$;
revoke all on function public.arena_list(),public.arena_snapshot(uuid),public.arena_command(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.arena_list(),public.arena_snapshot(uuid),public.arena_command(text,uuid,jsonb) to authenticated;
commit;
