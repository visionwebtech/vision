-- Vision Web Tech safe Supabase production upgrade
-- Run this in Supabase SQL Editor after the existing supabase-setup.sql if needed.
-- This file preserves existing data and upgrades the order system for customer + admin flows.

create extension if not exists pgcrypto;

create or replace function public.is_vision_web_admin()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'visionwebtech.info@gmail.com';
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text,
  email text,
  phone text,
  business_name text,
  service text,
  package text,
  requirements text,
  status text default 'Pending Review',
  expected_delivery text,
  expected_delivery_text text,
  admin_notes text,
  delivery_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists full_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists business_name text,
  add column if not exists service text,
  add column if not exists package text,
  add column if not exists requirements text,
  add column if not exists status text default 'Pending Review',
  add column if not exists expected_delivery text,
  add column if not exists expected_delivery_text text,
  add column if not exists admin_notes text,
  add column if not exists delivery_url text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.orders
set expected_delivery = coalesce(nullif(expected_delivery, ''), nullif(expected_delivery_text, ''), 'Within 48 Hours')
where true;

update public.orders
set expected_delivery_text = coalesce(nullif(expected_delivery_text, ''), nullif(expected_delivery, ''), 'Within 48 Hours')
where true;

update public.orders
set status = case
  when status is null or btrim(status) = '' then 'Pending Review'
  when status in ('Pending', 'In Review') then 'Pending Review'
  when status = 'Confirmed' then 'Accepted'
  when status in ('Accepted', 'In Progress', 'Need Information', 'Completed', 'Cancelled') then status
  else 'Pending Review'
end
where true;

create table if not exists public.pricing_packages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  price_text text not null,
  description text not null default '',
  features jsonb not null default '[]'::jsonb,
  delivery_time text not null default 'Within 48 Hours',
  featured_label text,
  is_visible boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pricing_packages
  add column if not exists delivery_time text not null default 'Within 48 Hours',
  add column if not exists featured_label text;

create table if not exists public.services_content (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  is_visible boolean not null default true,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'Portfolio',
  website_url text,
  image_url text,
  is_visible boolean not null default true,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  setting_key text primary key,
  setting_value text not null,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

drop trigger if exists trg_pricing_packages_updated_at on public.pricing_packages;
create trigger trg_pricing_packages_updated_at before update on public.pricing_packages for each row execute function public.set_updated_at();

drop trigger if exists trg_services_content_updated_at on public.services_content;
create trigger trg_services_content_updated_at before update on public.services_content for each row execute function public.set_updated_at();

drop trigger if exists trg_portfolio_projects_updated_at on public.portfolio_projects;
create trigger trg_portfolio_projects_updated_at before update on public.portfolio_projects for each row execute function public.set_updated_at();

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
alter table public.pricing_packages enable row level security;
alter table public.services_content enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.site_settings enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.pricing_packages, public.services_content, public.portfolio_projects, public.site_settings to anon, authenticated;
grant select, insert, update on public.orders to authenticated;
grant insert, update, delete on public.pricing_packages, public.services_content, public.portfolio_projects, public.site_settings to authenticated;

drop policy if exists "customers_insert_own_orders" on public.orders;
create policy "customers_insert_own_orders"
on public.orders
for insert
to authenticated
with check (
  auth.uid() = user_id
  and not public.is_vision_web_admin()
);

drop policy if exists "customers_read_own_orders" on public.orders;
create policy "customers_read_own_orders"
on public.orders
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_vision_web_admin()
);

drop policy if exists "admin_update_all_orders" on public.orders;
create policy "admin_update_all_orders"
on public.orders
for update
to authenticated
using (public.is_vision_web_admin())
with check (public.is_vision_web_admin());

drop policy if exists "public_read_visible_pricing" on public.pricing_packages;
create policy "public_read_visible_pricing"
on public.pricing_packages
for select
to anon, authenticated
using (is_visible = true or public.is_vision_web_admin());

drop policy if exists "admin_manage_pricing" on public.pricing_packages;
create policy "admin_manage_pricing"
on public.pricing_packages
for all
to authenticated
using (public.is_vision_web_admin())
with check (public.is_vision_web_admin());

drop policy if exists "public_read_visible_services" on public.services_content;
create policy "public_read_visible_services"
on public.services_content
for select
to anon, authenticated
using (is_visible = true or public.is_vision_web_admin());

drop policy if exists "admin_manage_services" on public.services_content;
create policy "admin_manage_services"
on public.services_content
for all
to authenticated
using (public.is_vision_web_admin())
with check (public.is_vision_web_admin());

drop policy if exists "public_read_visible_portfolio" on public.portfolio_projects;
create policy "public_read_visible_portfolio"
on public.portfolio_projects
for select
to anon, authenticated
using (is_visible = true or public.is_vision_web_admin());

drop policy if exists "admin_manage_portfolio" on public.portfolio_projects;
create policy "admin_manage_portfolio"
on public.portfolio_projects
for all
to authenticated
using (public.is_vision_web_admin())
with check (public.is_vision_web_admin());

drop policy if exists "public_read_site_settings" on public.site_settings;
create policy "public_read_site_settings"
on public.site_settings
for select
to anon, authenticated
using (true);

drop policy if exists "admin_manage_site_settings" on public.site_settings;
create policy "admin_manage_site_settings"
on public.site_settings
for all
to authenticated
using (public.is_vision_web_admin())
with check (public.is_vision_web_admin());

insert into public.pricing_packages (slug, name, price_text, description, features, delivery_time, featured_label, is_visible, is_featured, sort_order)
values
  ('starter', 'Starter Website', '₹5,000', 'Best for individuals, freelancers and small businesses starting their online presence.',
   '["Professional responsive website","Up to 3 core pages","Modern UI design","Mobile responsive design","WhatsApp integration","Phone/contact integration","Instagram integration","Basic SEO setup","Contact / enquiry section","1 year technical support","1 year hosting included","Basic performance optimization","Basic security setup"]'::jsonb,
   'Within 48 Hours', null, true, false, 1),
  ('business', 'Business Website', '₹9,000', 'Best for businesses that need a stronger online presence and more professional content.',
   '["Everything in Starter","Up to 5–6 pages","More customized design","Advanced section layouts","Better business presentation","Enhanced animations","Improved SEO structure","Social media integration","WhatsApp CTA throughout important sections","Contact / enquiry experience","1 year technical support","1 year hosting included","Performance optimization","Basic security setup"]'::jsonb,
   'Within 48 Hours', 'Most Popular', true, true, 2),
  ('premium', 'Premium Website', '₹15,000', 'Best for businesses looking for a premium and highly customized website.',
   '["Everything in Business","Up to 8–10 pages depending on requirements","Fully customized premium UI","Advanced animations and interactions","Premium visual presentation","Advanced responsive optimization","Enhanced SEO foundation","Advanced business sections","Social media integration","WhatsApp conversion-focused CTAs","Contact / enquiry experience","1 year technical support","1 year hosting included","FREE domain for the first year","Performance optimization","Basic security setup","Priority support"]'::jsonb,
   'Within 48 Hours', 'Best Value', true, false, 3)
on conflict (slug) do update set
  name = excluded.name,
  price_text = public.pricing_packages.price_text,
  description = excluded.description,
  features = excluded.features,
  delivery_time = coalesce(public.pricing_packages.delivery_time, excluded.delivery_time),
  featured_label = coalesce(public.pricing_packages.featured_label, excluded.featured_label);

insert into public.services_content (title, description, is_visible, sort_order)
values
  ('Business Website Development', 'Professional websites designed around the business, services, contact points and brand presentation.', true, 1),
  ('Landing Pages', 'High-converting pages for products, launches, promotions, offers and service campaigns.', true, 2),
  ('Responsive Web Design', 'Optimized experiences for mobile phones, tablets, laptops and desktop monitors.', true, 3),
  ('Basic SEO Setup', 'On-page SEO fundamentals, page metadata and search-friendly site structure.', true, 4),
  ('WhatsApp Integration', 'Direct connection for consultations, enquiries and faster business communication.', true, 5),
  ('Business Contact Integration', 'Phone, Instagram, WhatsApp and other relevant contact links placed strategically.', true, 6),
  ('Website Maintenance / Technical Support', 'Support is provided according to the selected package and agreed project scope.', true, 7),
  ('Performance-Focused Front End', 'Lightweight static code for faster loading and easier hosting on standard platforms.', true, 8),
  ('Future-Ready Static Architecture', 'Structured so that a backend, dashboard or advanced integrations can be added later if needed.', true, 9)
on conflict do nothing;

insert into public.portfolio_projects (title, description, category, website_url, image_url, is_visible, sort_order)
values
  ('Restaurant', 'Concept direction for food businesses that need a strong visual presentation and clear call-to-action flow.', 'Hospitality', '', '', true, 1),
  ('Coffee Shop', 'Warm, modern website concept for cafés and boutique beverage brands.', 'Hospitality', '', '', true, 2),
  ('Doctor / Clinic', 'Professional medical presentation with trust, clarity and responsive patient contact points.', 'Healthcare', '', '', true, 3),
  ('Interior Designer', 'Elegant service presentation for premium design-oriented businesses.', 'Design', '', '', true, 4),
  ('Real Estate', 'Structured property and service showcase direction for real-estate businesses.', 'Real Estate', '', '', true, 5),
  ('Consultant', 'Professional expert-led positioning for personal brands, consultants and advisors.', 'Professional Services', '', '', true, 6)
on conflict do nothing;

insert into public.site_settings (setting_key, setting_value)
values
  ('business_phone', '+91 9546723997'),
  ('whatsapp_number', '919546723997'),
  ('business_email', 'VISIONWEBTECH.INFO@GMAIL.COM'),
  ('instagram_url', 'https://www.instagram.com/visionwebtech/'),
  ('instagram_handle', '@visionwebtech'),
  ('primary_cta_text', 'Get Free Consultation'),
  ('contact_heading', 'Let’s Build Your Website'),
  ('contact_intro', 'Reach Vision Web Tech through your preferred channel and start the conversation about the right website for your business.')
on conflict (setting_key) do nothing;
