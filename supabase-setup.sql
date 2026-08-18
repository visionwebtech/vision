-- Vision Web Tech Supabase foundation setup
-- Run this once in the Supabase SQL Editor for project:
-- https://mwznwyktcqrohvsqopmb.supabase.co
-- This script safely prepares or upgrades the public.orders table and applies RLS.

create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  business_name text not null,
  service text not null,
  package text not null,
  requirements text not null,
  status text not null default 'Pending',
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.orders add column if not exists id uuid default gen_random_uuid();
alter table public.orders add column if not exists full_name text;
alter table public.orders add column if not exists email text;
alter table public.orders add column if not exists phone text;
alter table public.orders add column if not exists business_name text;
alter table public.orders add column if not exists service text;
alter table public.orders add column if not exists package text;
alter table public.orders add column if not exists requirements text;
alter table public.orders add column if not exists status text default 'Pending';
alter table public.orders add column if not exists created_at timestamptz default timezone('utc'::text, now());

update public.orders
set id = gen_random_uuid()
where id is null;

update public.orders
set status = 'Pending'
where status is null;

update public.orders
set created_at = timezone('utc'::text, now())
where created_at is null;

alter table public.orders alter column status set default 'Pending';
alter table public.orders alter column created_at set default timezone('utc'::text, now());

-- Make sure the table is available to the public API.
grant usage on schema public to anon, authenticated;
grant insert on table public.orders to anon, authenticated;
grant select, update on table public.orders to authenticated;

alter table public.orders enable row level security;

-- Drop/recreate policies safely.
drop policy if exists "Public can create website orders" on public.orders;
drop policy if exists "Authorized admin can read orders" on public.orders;
drop policy if exists "Authorized admin can update orders" on public.orders;

create policy "Public can create website orders"
on public.orders
for insert
to anon, authenticated
with check (true);

create policy "Authorized admin can read orders"
on public.orders
for select
to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'visionwebtech.info@gmail.com');

create policy "Authorized admin can update orders"
on public.orders
for update
to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'visionwebtech.info@gmail.com')
with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'visionwebtech.info@gmail.com');

-- Future phases can add:
-- 1. customer_accounts table
-- 2. order tracking for customers
-- 3. portfolio/content tables
-- 4. webhook-safe WhatsApp notifications
-- 5. payments and purchase history
