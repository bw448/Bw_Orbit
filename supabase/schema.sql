-- Orbit · BW有话说 · Supabase schema (posts + likes only; no comments)
-- Run this whole file in Supabase Dashboard → SQL Editor.

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

create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists likes_post_idx on public.likes (post_id);

alter table public.posts enable row level security;
alter table public.likes enable row level security;

drop policy if exists "posts public read" on public.posts;
create policy "posts public read" on public.posts
  for select using (published = true);

drop policy if exists "posts admin manage" on public.posts;
create policy "posts admin manage" on public.posts
  for all to authenticated using (true) with check (true);

drop policy if exists "likes admin manage" on public.likes;
create policy "likes admin manage" on public.likes
  for all to authenticated using (true) with check (true);

create or replace function public.toggle_like(p_post uuid, p_visitor text)
returns boolean
language plpgsql
security definer
set search_path = public
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
  select exists(
    select 1 from public.likes where post_id = p_post and visitor_id = p_visitor
  ) into already;
  if already then
    delete from public.likes where post_id = p_post and visitor_id = p_visitor;
    return false;
  else
    insert into public.likes(post_id, visitor_id) values (p_post, p_visitor);
    return true;
  end if;
end;
$$;

revoke all on function public.toggle_like(uuid, text) from public;
grant execute on function public.toggle_like(uuid, text) to anon, authenticated;

create or replace function public.like_counts()
returns table(post_id uuid, likes bigint)
language sql
security definer
set search_path = public
as $$
  select post_id, count(*) from public.likes group by post_id;
$$;

revoke all on function public.like_counts() from public;
grant execute on function public.like_counts() to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bw-talk', 'bw-talk', true, 52428800, array['image/*','video/*'])
on conflict (id) do update set public = true;

drop policy if exists "bw-talk public read" on storage.objects;
create policy "bw-talk public read" on storage.objects
  for select using (bucket_id = 'bw-talk');

drop policy if exists "bw-talk admin insert" on storage.objects;
create policy "bw-talk admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'bw-talk');

drop policy if exists "bw-talk admin update" on storage.objects;
create policy "bw-talk admin update" on storage.objects
  for update to authenticated using (bucket_id = 'bw-talk');

drop policy if exists "bw-talk admin delete" on storage.objects;
create policy "bw-talk admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'bw-talk');
