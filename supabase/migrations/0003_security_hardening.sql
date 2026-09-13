-- SabaiTalk V1 security hardening.
-- Defense-in-depth for route onboarding state, input bounds, least-privilege writes,
-- server-only rate limiting, and safer RPC-only mutations.

-- Prevent authenticated clients from creating shadow objects/functions in public.
revoke create on schema public from public;
revoke create on schema public from anon;
revoke create on schema public from authenticated;

-- Resolve block relationships through a SECURITY DEFINER helper so RLS policies
-- cannot accidentally miss a reverse-direction block because of RLS on blocks.
create or replace function public.is_blocked_with(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is null
    or target_user is null
    or exists (
      select 1
      from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = target_user)
         or (b.blocker_id = target_user and b.blocked_id = auth.uid())
    );
$$;

revoke all on function public.is_blocked_with(uuid) from public, anon;
grant execute on function public.is_blocked_with(uuid) to authenticated;

-- Replace broad read policies with block-aware, least-privilege variants.
drop policy if exists "profiles_authenticated_read" on public.profiles;
create policy "profiles_authenticated_read"
on public.profiles for select to authenticated
using (auth.uid() = id or not public.is_blocked_with(id));

drop policy if exists "user_interests_read" on public.user_interests;
create policy "user_interests_read"
on public.user_interests for select to authenticated
using (auth.uid() = user_id or not public.is_blocked_with(user_id));

-- Match/message rows are private to active members. Once a block deactivates the
-- match, ordinary clients no longer retain access to that relationship history.
drop policy if exists "matches_members_read" on public.matches;
create policy "matches_members_read"
on public.matches for select to authenticated
using (status = 'active' and auth.uid() in (user_a, user_b));

drop policy if exists "messages_members_read" on public.messages;
create policy "messages_members_read"
on public.messages for select to authenticated
using (
  exists (
    select 1
    from public.matches m
    where m.id = match_id
      and m.status = 'active'
      and auth.uid() in (m.user_a, m.user_b)
  )
);

-- New/updated rows must satisfy these bounds even if a client bypasses the UI.
alter table public.profiles
  add constraint profiles_display_name_bounds
  check (char_length(btrim(display_name)) between 1 and 60) not valid;

alter table public.profiles
  add constraint profiles_bio_bounds
  check (char_length(btrim(bio)) between 1 and 160) not valid;

alter table public.profiles
  add constraint profiles_approximate_area_bounds
  check (approximate_area is null or char_length(approximate_area) <= 120) not valid;

alter table public.profiles
  add constraint profiles_avatar_url_bounds
  check (avatar_url is null or char_length(avatar_url) <= 2048) not valid;

alter table public.messages
  add constraint messages_nonblank_content
  check (char_length(btrim(content)) between 1 and 2000) not valid;

alter table public.reports
  add constraint reports_reason_allowed
  check (reason in ('spam', 'harassment', 'inappropriate', 'fake', 'safety', 'other')) not valid;

alter table public.reports
  add constraint reports_details_bounds
  check (details is null or char_length(details) <= 1000) not valid;

-- Mutations below are intentionally RPC-only so all validation/authorization
-- lives server-side as well as in the client.
drop policy if exists "locations_owner_insert" on public.profile_locations;
drop policy if exists "locations_owner_update" on public.profile_locations;

drop policy if exists "user_interests_owner_write" on public.user_interests;

drop policy if exists "passes_owner_all" on public.passes;
create policy "passes_owner_read"
on public.passes for select to authenticated
using (auth.uid() = from_user_id);

drop policy if exists "blocks_owner_all" on public.blocks;
create policy "blocks_owner_read"
on public.blocks for select to authenticated
using (auth.uid() = blocker_id);

drop policy if exists "reports_owner_insert" on public.reports;

create or replace function public.set_my_interests(selected_slugs text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_count integer;
  catalog_count integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  selected_count := cardinality(selected_slugs);
  if selected_slugs is null or selected_count < 3 or selected_count > 6 then
    raise exception 'invalid interest selection';
  end if;

  if (
    select count(distinct slug)
    from unnest(selected_slugs) as slug
  ) <> selected_count then
    raise exception 'duplicate interests';
  end if;

  if exists (
    select 1
    from unnest(selected_slugs) as slug
    where slug !~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$'
  ) then
    raise exception 'invalid interest slug';
  end if;

  select count(*)
  into catalog_count
  from public.interests
  where slug = any(selected_slugs);

  if catalog_count <> selected_count then
    raise exception 'unknown interest';
  end if;

  delete from public.user_interests
  where user_id = auth.uid();

  insert into public.user_interests (user_id, interest_id)
  select auth.uid(), i.id
  from public.interests i
  where i.slug = any(selected_slugs);
end;
$$;

revoke all on function public.set_my_interests(text[]) from public, anon;
grant execute on function public.set_my_interests(text[]) to authenticated;


create or replace function public.my_onboarding_status()
returns table (
  profile_complete boolean,
  interest_count integer,
  has_location boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  return query
  select
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and char_length(btrim(p.display_name)) between 1 and 60
        and char_length(btrim(p.bio)) between 1 and 160
    ),
    (
      select count(*)::integer
      from public.user_interests ui
      where ui.user_id = auth.uid()
    ),
    exists (
      select 1
      from public.profile_locations pl
      where pl.user_id = auth.uid()
    );
end;
$$;

revoke all on function public.my_onboarding_status() from public, anon;
grant execute on function public.my_onboarding_status() to authenticated;


create or replace function public.report_profile(
  target_user uuid,
  report_reason text,
  report_details text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if target_user is null or target_user = auth.uid() then
    raise exception 'invalid target';
  end if;

  if report_reason not in ('spam', 'harassment', 'inappropriate', 'fake', 'safety', 'other') then
    raise exception 'invalid reason';
  end if;

  if report_details is not null and char_length(report_details) > 1000 then
    raise exception 'details too long';
  end if;

  if not exists (select 1 from public.profiles where id = target_user) then
    raise exception 'target not found';
  end if;

  insert into public.reports (reporter_id, reported_id, reason, details)
  values (
    auth.uid(),
    target_user,
    report_reason,
    nullif(btrim(report_details), '')
  );
end;
$$;

revoke all on function public.report_profile(uuid, text, text) from public, anon;
grant execute on function public.report_profile(uuid, text, text) to authenticated;


-- Server-only request throttling for expensive Places/Routes calls.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.meeting_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0)
);

create or replace function public.consume_meeting_rate_limit(target_user uuid)
returns boolean
language plpgsql
security definer
set search_path = public, private
as $$
declare
  existing private.meeting_rate_limits%rowtype;
begin
  if target_user is null then
    return false;
  end if;

  -- Establish the row without a race, then serialize all counters for this user.
  insert into private.meeting_rate_limits (user_id, window_started_at, request_count)
  values (target_user, now(), 0)
  on conflict (user_id) do nothing;

  select *
  into existing
  from private.meeting_rate_limits
  where user_id = target_user
  for update;

  if existing.window_started_at <= now() - interval '60 seconds' then
    update private.meeting_rate_limits
    set window_started_at = now(), request_count = 1
    where user_id = target_user;
    return true;
  end if;

  if existing.request_count >= 10 then
    return false;
  end if;

  update private.meeting_rate_limits
  set request_count = request_count + 1
  where user_id = target_user;

  return true;
end;
$$;

revoke all on function public.consume_meeting_rate_limit(uuid) from public, anon, authenticated;
grant execute on function public.consume_meeting_rate_limit(uuid) to service_role;


-- Limit profile-image abuse at the storage layer too.
update storage.buckets
set
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'avatars';
