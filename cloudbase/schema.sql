-- Orbit · BW有话说 · CloudBase PostgreSQL schema
-- Run this in CloudBase → PostgreSQL → SQL 编辑器.
-- IMPORTANT: replace CHANGE_ME below with your own long admin password before running.

set search_path = public, extensions;

create schema if not exists extensions;
create extension if not exists pgcrypto;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text,
  body text not null default '',
  media_url text,
  media_type text check (media_type in ('image','video') or media_type is null),
  link_url text,
  published boolean not null default true
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  visitor_id text not null,
  created_at timestamptz not null default now(),
  unique (post_id, visitor_id)
);

create table if not exists public.bw_config (
  id integer primary key,
  admin_hash text not null
);

insert into public.bw_config (id, admin_hash)
values (1, crypt('CHANGE_ME', gen_salt('bf')))
on conflict (id) do update set admin_hash = excluded.admin_hash;

create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists likes_post_idx on public.likes (post_id);

alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.bw_config enable row level security;

drop policy if exists "posts public read" on public.posts;
create policy "posts public read" on public.posts
  for select using (published = true);

-- No anon insert/update/delete policies on posts, likes or bw_config.
-- All writes go through SECURITY DEFINER functions below.

create or replace function public.bw_admin_check(p_password text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  h text;
begin
  select admin_hash into h from public.bw_config where id = 1;
  return h is not null and crypt(p_password, h) = h;
end;
$$;

create or replace function public.bw_admin_create(
  p_password text,
  p_title text,
  p_body text,
  p_media_url text,
  p_media_type text,
  p_link_url text
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_id uuid;
begin
  if not public.bw_admin_check(p_password) then
    raise exception 'invalid admin password';
  end if;
  if p_media_type is not null and p_media_type not in ('image','video') then
    raise exception 'invalid media type';
  end if;
  insert into public.posts (title, body, media_url, media_type, link_url, published)
  values (nullif(trim(p_title), ''), coalesce(p_body, ''), nullif(p_media_url, ''), p_media_type, nullif(p_link_url, ''), true)
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.bw_admin_delete(p_password text, p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.bw_admin_check(p_password) then
    raise exception 'invalid admin password';
  end if;
  delete from public.posts where id = p_id;
  return found;
end;
$$;

create or replace function public.toggle_like(p_post uuid, p_visitor text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  already boolean;
begin
  if p_visitor is null or char_length(trim(p_visitor)) < 8 or char_length(trim(p_visitor)) > 80 then
    raise exception 'invalid visitor';
  end if;
  if not exists (select 1 from public.posts p where p.id = p_post and p.published = true) then
    raise exception 'post not found';
  end if;
  select exists(select 1 from public.likes where post_id = p_post and visitor_id = p_visitor) into already;
  if already then
    delete from public.likes where post_id = p_post and visitor_id = p_visitor;
    return false;
  else
    insert into public.likes (post_id, visitor_id) values (p_post, p_visitor);
    return true;
  end if;
end;
$$;

create or replace function public.like_counts()
returns table(post_id uuid, likes bigint)
language sql
security definer
set search_path = public, extensions
as $$
  select post_id, count(*) from public.likes group by post_id;
$$;

grant select on public.posts to public;
grant execute on function public.bw_admin_check(text) to public;
grant execute on function public.bw_admin_create(text, text, text, text, text, text) to public;
grant execute on function public.bw_admin_delete(text, uuid) to public;
grant execute on function public.toggle_like(uuid, text) to public;
grant execute on function public.like_counts() to public;

notify pgrst, 'reload schema';
