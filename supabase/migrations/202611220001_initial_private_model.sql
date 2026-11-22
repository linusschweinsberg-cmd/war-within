-- DRAFT ONLY: run only after review, never automatically against the hosted project.
begin;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '' check (length(display_name)<=80),
 avatar_url text check (avatar_url is null or (length(avatar_url)<=2048 and avatar_url like 'https://%')),
 preferences jsonb not null default '{}'::jsonb check (jsonb_typeof(preferences)='object'),
 updated_at timestamptz not null default clock_timestamp()
);
create table public.game_states (
 user_id uuid primary key references auth.users(id) on delete cascade,
 state jsonb not null check (jsonb_typeof(state)='object'),
 schema_version integer not null default 5 check (schema_version>0),
 version bigint not null default 1 check (version>0),
 updated_at timestamptz not null default clock_timestamp()
);
create function private.stamp_record() returns trigger language plpgsql set search_path='' as $$
begin
 new.updated_at=clock_timestamp();
 if tg_table_name='game_states' then
   if tg_op='INSERT' then new.version=1; else new.version=old.version+1; end if;
 end if;
 return new;
end; $$;
revoke all on function private.stamp_record() from public, anon, authenticated;
create trigger profiles_stamp before insert or update on public.profiles for each row execute function private.stamp_record();
create trigger game_states_stamp before insert or update on public.game_states for each row execute function private.stamp_record();

alter table public.profiles enable row level security;
revoke all on public.profiles from public,anon,authenticated;
grant select,delete on public.profiles to authenticated;
grant insert(user_id,display_name,avatar_url,preferences),update(display_name,avatar_url,preferences) on public.profiles to authenticated;
create policy profiles_read on public.profiles for select to authenticated using (user_id=(select auth.uid()));
create policy profiles_insert on public.profiles for insert to authenticated with check (user_id=(select auth.uid()));
create policy profiles_update on public.profiles for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy profiles_delete on public.profiles for delete to authenticated using (user_id=(select auth.uid()));

alter table public.game_states enable row level security;
revoke all on public.game_states from public,anon,authenticated;
grant select,delete on public.game_states to authenticated;
grant insert(user_id,state,schema_version),update(state,schema_version) on public.game_states to authenticated;
create policy game_states_read on public.game_states for select to authenticated using (user_id=(select auth.uid()));
create policy game_states_insert on public.game_states for insert to authenticated with check (user_id=(select auth.uid()));
create policy game_states_update on public.game_states for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy game_states_delete on public.game_states for delete to authenticated using (user_id=(select auth.uid()));

create table public.leagues (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (length(btrim(name)) between 1 and 80),
 created_at timestamptz not null default clock_timestamp()
);
-- Entire row is explicitly public WITHIN the group. Never add private fields here.
create table public.league_members (
 league_id uuid not null references public.leagues(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 display_name text not null default '' check (length(display_name)<=80),
 avatar_url text check (avatar_url is null or (length(avatar_url)<=2048 and avatar_url like 'https://%')),
 joined_at timestamptz not null default clock_timestamp(),
 primary key (league_id,user_id)
);
create index league_members_user_idx on public.league_members(user_id,league_id);
create index leagues_owner_idx on public.leagues(owner_id);
-- Owned by migration role (postgres). Fixed path, no user_id parameter, no dynamic SQL.
-- Keep private OUT of exposed schemas. Definer avoids recursive membership RLS.
create function private.is_league_member(group_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.league_members m where m.league_id=group_id and m.user_id=(select auth.uid()));
$$;
create function private.owns_league(group_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.leagues g where g.id=group_id and g.owner_id=(select auth.uid()));
$$;
revoke all on function private.is_league_member(uuid), private.owns_league(uuid) from public,anon,authenticated;
grant execute on function private.is_league_member(uuid), private.owns_league(uuid) to authenticated;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
revoke all on public.leagues,public.league_members from public,anon,authenticated;
grant select,delete on public.leagues,public.league_members to authenticated;
grant insert(id,owner_id,name),update(name) on public.leagues to authenticated;
grant insert(league_id,user_id,display_name,avatar_url),update(display_name,avatar_url) on public.league_members to authenticated;
create policy leagues_read on public.leagues for select to authenticated using (owner_id=(select auth.uid()) or private.is_league_member(id));
create policy leagues_insert on public.leagues for insert to authenticated with check (owner_id=(select auth.uid()));
create policy leagues_update on public.leagues for update to authenticated using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
create policy leagues_delete on public.leagues for delete to authenticated using (owner_id=(select auth.uid()));
create policy league_members_read on public.league_members for select to authenticated using (user_id=(select auth.uid()) or private.is_league_member(league_id));
-- No self-enrolment in strangers' groups. Other joins require a future reviewed invitation RPC.
create policy league_members_insert on public.league_members for insert to authenticated with check (user_id=(select auth.uid()) and private.owns_league(league_id));
create policy league_members_update on public.league_members for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy league_members_delete on public.league_members for delete to authenticated using (user_id=(select auth.uid()) and not private.owns_league(league_id));

create table public.squads (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (length(btrim(name)) between 1 and 80),
 created_at timestamptz not null default clock_timestamp()
);
-- Entire row is explicitly public WITHIN the group. Never add private fields here.
create table public.squad_members (
 squad_id uuid not null references public.squads(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 display_name text not null default '' check (length(display_name)<=80),
 avatar_url text check (avatar_url is null or (length(avatar_url)<=2048 and avatar_url like 'https://%')),
 joined_at timestamptz not null default clock_timestamp(),
 primary key (squad_id,user_id)
);
create index squad_members_user_idx on public.squad_members(user_id,squad_id);
create index squads_owner_idx on public.squads(owner_id);
-- Owned by migration role (postgres). Fixed path, no user_id parameter, no dynamic SQL.
-- Keep private OUT of exposed schemas. Definer avoids recursive membership RLS.
create function private.is_squad_member(group_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.squad_members m where m.squad_id=group_id and m.user_id=(select auth.uid()));
$$;
create function private.owns_squad(group_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.squads g where g.id=group_id and g.owner_id=(select auth.uid()));
$$;
revoke all on function private.is_squad_member(uuid), private.owns_squad(uuid) from public,anon,authenticated;
grant execute on function private.is_squad_member(uuid), private.owns_squad(uuid) to authenticated;
alter table public.squads enable row level security;
alter table public.squad_members enable row level security;
revoke all on public.squads,public.squad_members from public,anon,authenticated;
grant select,delete on public.squads,public.squad_members to authenticated;
grant insert(id,owner_id,name),update(name) on public.squads to authenticated;
grant insert(squad_id,user_id,display_name,avatar_url),update(display_name,avatar_url) on public.squad_members to authenticated;
create policy squads_read on public.squads for select to authenticated using (owner_id=(select auth.uid()) or private.is_squad_member(id));
create policy squads_insert on public.squads for insert to authenticated with check (owner_id=(select auth.uid()));
create policy squads_update on public.squads for update to authenticated using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
create policy squads_delete on public.squads for delete to authenticated using (owner_id=(select auth.uid()));
create policy squad_members_read on public.squad_members for select to authenticated using (user_id=(select auth.uid()) or private.is_squad_member(squad_id));
-- No self-enrolment in strangers' groups. Other joins require a future reviewed invitation RPC.
create policy squad_members_insert on public.squad_members for insert to authenticated with check (user_id=(select auth.uid()) and private.owns_squad(squad_id));
create policy squad_members_update on public.squad_members for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy squad_members_delete on public.squad_members for delete to authenticated using (user_id=(select auth.uid()) and not private.owns_squad(squad_id));

commit;
