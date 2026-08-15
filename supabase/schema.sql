-- Run this once in Supabase SQL Editor.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'driver' check (role in ('admin','driver')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active = true
  );
$$;

create policy "Users can read own profile"
on public.profiles for select
using (id = auth.uid());

create policy "Admins can read all profiles"
on public.profiles for select
using (public.is_admin());

create policy "Admins can insert profiles"
on public.profiles for insert
with check (public.is_admin());

create policy "Admins can update profiles"
on public.profiles for update
using (public.is_admin())
with check (public.is_admin());
