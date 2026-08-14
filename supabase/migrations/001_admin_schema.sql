-- SHARM admin schema: content, media, bookings, single-owner access

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null default 'SHARM',
  logo_url text,
  phone text,
  address text,
  hours_short text,
  hours_full text,
  map_url text,
  map_query text,
  hero_image_url text,
  hero_eyebrow text,
  hero_title text,
  hero_lead text,
  seo_title text,
  seo_description text,
  updated_at timestamptz not null default now()
);

drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists services_updated_at on public.services;
create trigger services_updated_at
before update on public.services
for each row execute function public.set_updated_at();

create table if not exists public.masters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  photo_url text,
  bio text,
  specialties jsonb not null default '[]'::jsonb,
  hours text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists masters_updated_at on public.masters;
create trigger masters_updated_at
before update on public.masters
for each row execute function public.set_updated_at();

create table if not exists public.portfolio_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists portfolio_categories_updated_at on public.portfolio_categories;
create trigger portfolio_categories_updated_at
before update on public.portfolio_categories
for each row execute function public.set_updated_at();

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.portfolio_categories (id) on delete cascade,
  image_url text not null,
  thumb_url text,
  alt text,
  sort_order int not null default 0,
  is_cover boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.interior_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  alt text,
  sort_order int not null default 0,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

do $$ begin
  create type public.booking_status as enum (
    'new',
    'contacted',
    'confirmed',
    'done',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  service_id uuid references public.services (id) on delete set null,
  service_name text,
  master_id uuid references public.masters (id) on delete set null,
  master_name text,
  comment text,
  status public.booking_status not null default 'new',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists bookings_updated_at on public.bookings;
create trigger bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create index if not exists services_sort_idx on public.services (sort_order, created_at);
create index if not exists masters_sort_idx on public.masters (sort_order, created_at);
create index if not exists portfolio_categories_sort_idx on public.portfolio_categories (sort_order, created_at);
create index if not exists portfolio_items_category_sort_idx on public.portfolio_items (category_id, sort_order, created_at);
create index if not exists interior_images_sort_idx on public.interior_images (sort_order, created_at);
create index if not exists bookings_created_idx on public.bookings (created_at desc);
create index if not exists bookings_status_idx on public.bookings (status);

alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.services enable row level security;
alter table public.masters enable row level security;
alter table public.portfolio_categories enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.interior_images enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "admins read admin_users" on public.admin_users;
create policy "admins read admin_users"
  on public.admin_users for select
  to authenticated
  using (public.is_admin());

drop policy if exists "public read settings" on public.site_settings;
create policy "public read settings"
  on public.site_settings for select
  using (true);

drop policy if exists "admin update settings" on public.site_settings;
create policy "admin update settings"
  on public.site_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "read services" on public.services;
create policy "read services"
  on public.services for select
  using (is_active or public.is_admin());

drop policy if exists "admin write services" on public.services;
create policy "admin write services"
  on public.services for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "read masters" on public.masters;
create policy "read masters"
  on public.masters for select
  using (is_active or public.is_admin());

drop policy if exists "admin write masters" on public.masters;
create policy "admin write masters"
  on public.masters for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "read portfolio categories" on public.portfolio_categories;
create policy "read portfolio categories"
  on public.portfolio_categories for select
  using (is_active or public.is_admin());

drop policy if exists "admin write portfolio categories" on public.portfolio_categories;
create policy "admin write portfolio categories"
  on public.portfolio_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "read portfolio items" on public.portfolio_items;
create policy "read portfolio items"
  on public.portfolio_items for select
  using (is_active or public.is_admin());

drop policy if exists "admin write portfolio items" on public.portfolio_items;
create policy "admin write portfolio items"
  on public.portfolio_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "read interior" on public.interior_images;
create policy "read interior"
  on public.interior_images for select
  using (is_active or public.is_admin());

drop policy if exists "admin write interior" on public.interior_images;
create policy "admin write interior"
  on public.interior_images for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admin read bookings" on public.bookings;
create policy "admin read bookings"
  on public.bookings for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admin update bookings" on public.bookings;
create policy "admin update bookings"
  on public.bookings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admin delete bookings" on public.bookings;
create policy "admin delete bookings"
  on public.bookings for delete
  to authenticated
  using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read media" on storage.objects;
create policy "public read media"
  on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists "admin upload media" on storage.objects;
create policy "admin upload media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "admin update media" on storage.objects;
create policy "admin update media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "admin delete media" on storage.objects;
create policy "admin delete media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and public.is_admin());
