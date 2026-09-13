create extension if not exists postgis;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  bio text not null default '',
  avatar_url text,
  approximate_area text,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Exact coordinates are intentionally separated from public profile data.
create table if not exists public.profile_locations (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  location geography(point, 4326) not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.interests (
  id bigint generated always as identity primary key,
  slug text not null unique,
  label text not null,
  emoji text
);

create table if not exists public.user_interests (
  user_id uuid not null references public.profiles(id) on delete cascade,
  interest_id bigint not null references public.interests(id) on delete cascade,
  primary key (user_id, interest_id)
);

create table if not exists public.likes (
  id bigint generated always as identity primary key,
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint likes_no_self check (from_user_id <> to_user_id),
  unique (from_user_id, to_user_id)
);

create table if not exists public.passes (
  id bigint generated always as identity primary key,
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint passes_no_self check (from_user_id <> to_user_id),
  unique (from_user_id, to_user_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'blocked', 'closed')),
  created_at timestamptz not null default now(),
  constraint matches_ordered_pair check (user_a < user_b),
  unique (user_a, user_b)
);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_no_self check (blocker_id <> blocked_id)
);

create table if not exists public.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'closed')),
  created_at timestamptz not null default now(),
  constraint reports_no_self check (reporter_id <> reported_id)
);

create index if not exists profile_locations_gix on public.profile_locations using gist (location);
create index if not exists messages_match_created_idx on public.messages (match_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.profile_locations enable row level security;
alter table public.interests enable row level security;
alter table public.user_interests enable row level security;
alter table public.likes enable row level security;
alter table public.passes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

create policy "profiles_authenticated_read" on public.profiles for select to authenticated using (
  auth.uid() = id
  or not exists (
    select 1 from public.blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = id)
       or (b.blocker_id = id and b.blocked_id = auth.uid())
  )
);
create policy "profiles_owner_insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_owner_update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "locations_owner_read" on public.profile_locations for select to authenticated using (auth.uid() = user_id);
create policy "locations_owner_insert" on public.profile_locations for insert to authenticated with check (auth.uid() = user_id);
create policy "locations_owner_update" on public.profile_locations for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "interests_authenticated_read" on public.interests for select to authenticated using (true);
create policy "user_interests_read" on public.user_interests for select to authenticated using (true);
create policy "user_interests_owner_write" on public.user_interests for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "likes_owner_read" on public.likes for select to authenticated using (auth.uid() = from_user_id);
create policy "passes_owner_all" on public.passes for all to authenticated using (auth.uid() = from_user_id) with check (auth.uid() = from_user_id);

create policy "matches_members_read" on public.matches for select to authenticated using (auth.uid() in (user_a, user_b));
create policy "messages_members_read" on public.messages for select to authenticated using (
  exists (select 1 from public.matches m where m.id = match_id and auth.uid() in (m.user_a, m.user_b))
);
create policy "messages_members_insert" on public.messages for insert to authenticated with check (
  auth.uid() = sender_id
  and exists (
    select 1 from public.matches m
    where m.id = match_id and auth.uid() in (m.user_a, m.user_b) and m.status = 'active'
  )
);

create policy "blocks_owner_all" on public.blocks for all to authenticated using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);
create policy "reports_owner_insert" on public.reports for insert to authenticated with check (auth.uid() = reporter_id);
create policy "reports_owner_read" on public.reports for select to authenticated using (auth.uid() = reporter_id);

insert into public.interests (slug, label, emoji) values
  ('gaming','Gaming','🎮'),
  ('music','Music','🎧'),
  ('movies','Movies','🎬'),
  ('coding','Coding','💻'),
  ('coffee','Cafe','☕'),
  ('study','Study','📚'),
  ('sports','Sports','🏸'),
  ('travel','Travel','🧭'),
  ('food','Food','🍜'),
  ('photo','Photography','📷')
on conflict (slug) do nothing;

create or replace function public.set_my_location(lat double precision, lng double precision)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.profile_locations (user_id, location, updated_at)
  values (auth.uid(), st_setsrid(st_makepoint(lng, lat), 4326)::geography, now())
  on conflict (user_id) do update
    set location = excluded.location,
        updated_at = excluded.updated_at;
$$;

create or replace function public.nearby_profiles(radius_meters integer default 5000, result_limit integer default 50)
returns table (
  id uuid,
  display_name text,
  bio text,
  avatar_url text,
  approximate_area text,
  distance_meters double precision,
  last_active_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with me as (
    select location from public.profile_locations where user_id = auth.uid()
  )
  select
    p.id,
    p.display_name,
    p.bio,
    p.avatar_url,
    p.approximate_area,
    st_distance(pl.location, me.location) as distance_meters,
    p.last_active_at
  from public.profiles p
  join public.profile_locations pl on pl.user_id = p.id
  cross join me
  where p.id <> auth.uid()
    and st_dwithin(pl.location, me.location, greatest(100, least(radius_meters, 50000)))
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
         or (b.blocker_id = p.id and b.blocked_id = auth.uid())
    )
    and not exists (
      select 1 from public.passes ps
      where ps.from_user_id = auth.uid() and ps.to_user_id = p.id
    )
  order by st_distance(pl.location, me.location)
  limit greatest(1, least(result_limit, 100));
$$;

create or replace function public.like_profile(target_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  low_user uuid;
  high_user uuid;
  result_match uuid;
begin
  if auth.uid() is null or target_user is null or auth.uid() = target_user then
    raise exception 'invalid target';
  end if;

  if exists (
    select 1 from public.blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = target_user)
       or (b.blocker_id = target_user and b.blocked_id = auth.uid())
  ) then
    raise exception 'blocked relationship';
  end if;

  insert into public.likes (from_user_id, to_user_id)
  values (auth.uid(), target_user)
  on conflict (from_user_id, to_user_id) do nothing;

  if not exists (
    select 1 from public.likes
    where from_user_id = target_user and to_user_id = auth.uid()
  ) then
    return null;
  end if;

  if auth.uid() < target_user then
    low_user := auth.uid();
    high_user := target_user;
  else
    low_user := target_user;
    high_user := auth.uid();
  end if;

  insert into public.matches (user_a, user_b)
  values (low_user, high_user)
  on conflict (user_a, user_b) do update set status = 'active'
  returning id into result_match;

  return result_match;
end;
$$;

revoke all on function public.set_my_location(double precision, double precision) from public;
revoke all on function public.nearby_profiles(integer, integer) from public;
revoke all on function public.like_profile(uuid) from public;
grant execute on function public.set_my_location(double precision, double precision) to authenticated;
grant execute on function public.nearby_profiles(integer, integer) to authenticated;
grant execute on function public.like_profile(uuid) to authenticated;


-- Realtime chat publication.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- Profile avatar bucket. Object names are stored under <user-id>/...
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

create policy "avatars_public_read"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "avatars_owner_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_owner_update"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_owner_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.block_profile(target_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  low_user uuid;
  high_user uuid;
begin
  if auth.uid() is null or target_user is null or auth.uid() = target_user then
    raise exception 'invalid target';
  end if;

  insert into public.blocks (blocker_id, blocked_id)
  values (auth.uid(), target_user)
  on conflict (blocker_id, blocked_id) do nothing;

  if auth.uid() < target_user then
    low_user := auth.uid();
    high_user := target_user;
  else
    low_user := target_user;
    high_user := auth.uid();
  end if;

  update public.matches
  set status = 'blocked'
  where user_a = low_user and user_b = high_user;
end;
$$;

revoke all on function public.block_profile(uuid) from public;
grant execute on function public.block_profile(uuid) to authenticated;


create or replace function public.meeting_origins(target_match uuid)
returns table (
  user_a uuid,
  user_b uuid,
  a_lat double precision,
  a_lng double precision,
  b_lat double precision,
  b_lng double precision
)
language sql
security definer
set search_path = public
as $$
  select
    m.user_a,
    m.user_b,
    st_y(la.location::geometry) as a_lat,
    st_x(la.location::geometry) as a_lng,
    st_y(lb.location::geometry) as b_lat,
    st_x(lb.location::geometry) as b_lng
  from public.matches m
  join public.profile_locations la on la.user_id = m.user_a
  join public.profile_locations lb on lb.user_id = m.user_b
  where m.id = target_match
    and m.status = 'active';
$$;

revoke all on function public.meeting_origins(uuid) from public, anon, authenticated;
grant execute on function public.meeting_origins(uuid) to service_role;


create or replace function public.my_matches()
returns table (
  match_id uuid,
  other_user_id uuid,
  display_name text,
  avatar_url text,
  approximate_area text,
  created_at timestamptz,
  last_message text,
  last_message_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    m.id as match_id,
    case when m.user_a = auth.uid() then m.user_b else m.user_a end as other_user_id,
    p.display_name,
    p.avatar_url,
    p.approximate_area,
    m.created_at,
    lm.content as last_message,
    lm.created_at as last_message_at
  from public.matches m
  join public.profiles p
    on p.id = case when m.user_a = auth.uid() then m.user_b else m.user_a end
  left join lateral (
    select msg.content, msg.created_at
    from public.messages msg
    where msg.match_id = m.id
    order by msg.created_at desc
    limit 1
  ) lm on true
  where auth.uid() in (m.user_a, m.user_b)
    and m.status = 'active'
  order by coalesce(lm.created_at, m.created_at) desc;
$$;

revoke all on function public.my_matches() from public;
grant execute on function public.my_matches() to authenticated;
