-- Blueprint3D: profiles, pricing, estimates, blueprints + RLS
-- Apply in Supabase SQL editor or via: supabase db push

-- Profiles (trigger fills on signup)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Catalog furniture unit prices (seed illustrative amounts)
create table if not exists public.catalog_item_prices (
  item_key text primary key,
  label text,
  unit_price numeric(12, 2) not null default 0,
  currency text not null default 'USD',
  updated_at timestamptz default now()
);

alter table public.catalog_item_prices enable row level security;

create policy "catalog_item_prices_read_all"
  on public.catalog_item_prices for select
  to anon, authenticated
  using (true);

-- Finish prices per square meter
create table if not exists public.texture_prices (
  texture_key text primary key,
  surface text not null check (surface in ('floor', 'wall')),
  texture_url text not null,
  price_per_sq_m numeric(12, 2) not null default 0,
  currency text not null default 'USD',
  updated_at timestamptz default now()
);

alter table public.texture_prices enable row level security;

create policy "texture_prices_read_all"
  on public.texture_prices for select
  to anon, authenticated
  using (true);

-- App-wide estimate multipliers (single logical row; use limit 1)
create table if not exists public.estimate_settings (
  id uuid primary key default gen_random_uuid(),
  labor_pct numeric(6, 2) not null default 15,
  delivery_pct numeric(6, 2) not null default 5,
  contingency_pct numeric(6, 2) not null default 10,
  currency text not null default 'USD',
  updated_at timestamptz default now()
);

alter table public.estimate_settings enable row level security;

create policy "estimate_settings_read_all"
  on public.estimate_settings for select
  to anon, authenticated
  using (true);

-- Saved projects
create table if not exists public.blueprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  room_type text,
  layout_data jsonb not null default '{}'::jsonb,
  thumbnail_base64 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blueprints_user_updated_idx
  on public.blueprints (user_id, updated_at desc);

alter table public.blueprints enable row level security;

create policy "blueprints_select_own"
  on public.blueprints for select
  using (auth.uid() = user_id);

create policy "blueprints_insert_own"
  on public.blueprints for insert
  with check (auth.uid() = user_id);

create policy "blueprints_update_own"
  on public.blueprints for update
  using (auth.uid() = user_id);

create policy "blueprints_delete_own"
  on public.blueprints for delete
  using (auth.uid() = user_id);

-- New user → profile row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seed estimate settings (one row)
insert into public.estimate_settings (labor_pct, delivery_pct, contingency_pct, currency)
select 15, 5, 10, 'USD'
where not exists (select 1 from public.estimate_settings limit 1);

-- Seed catalog (representative unit prices in USD)
insert into public.catalog_item_prices (item_key, label, unit_price, currency) values
  ('bedOne', 'Modern Upholstered Twin Bed', 420, 'USD'),
  ('drawerOne', 'Minimalist White Six-Drawer Dresser', 380, 'USD'),
  ('drawerTwo', 'Modern Eight Drawer Wooden Dresser', 520, 'USD'),
  ('drawerThree', 'Modern Dark Wood Nightstand', 120, 'USD'),
  ('drawerFour', 'Traditional White Vanity Dressing Table', 340, 'USD'),
  ('drawerFive', 'Minimalist Grey Vanity Desk', 290, 'USD'),
  ('drawerSix', 'Minimalist Oak Writing Desk', 310, 'USD'),
  ('wardrobeOne', 'Minimalist Three-Door White Wardrobe', 680, 'USD'),
  ('wardrobeTwo', 'Modern Modular Open Wardrobe System', 920, 'USD'),
  ('wardrobeThree', 'Minimalist White Two-Door Wardrobe', 540, 'USD'),
  ('wardrobeFour', 'Modern Open Concept Wardrobe Frame', 750, 'USD'),
  ('lightOne', 'Minimalist White Globe Table Lamp', 45, 'USD'),
  ('lightTwo', 'Modern Green Metal Floor Lamp', 85, 'USD'),
  ('lightThree', 'Modern Wooden Tripod Floor Lamp', 95, 'USD'),
  ('lightFour', 'Traditional Brass Table Lamp', 65, 'USD'),
  ('storageOne', 'Sage Green Wooden Display Cabinet', 480, 'USD'),
  ('storageTwo', 'Traditional Dark Wood Display Cabinet', 620, 'USD'),
  ('storageThree', 'Traditional White Wooden Sideboard', 410, 'USD'),
  ('storageFour', 'Traditional Dark Wood China Cabinet', 890, 'USD'),
  ('storageFive', 'Modern Black Glass Display Cabinet', 720, 'USD'),
  ('storageSix', 'Modern Black Two-Door Storage Cabinet', 380, 'USD'),
  ('storageSeven', 'Tall Narrow White Bookshelf', 220, 'USD'),
  ('storageEight', 'Modern Scandinavian Five-Tier Shelving Unit', 260, 'USD'),
  ('storageNine', 'Modern White Wall-Mounted Shelving', 180, 'USD'),
  ('storageTen', 'Traditional Oak Bookcase', 340, 'USD'),
  ('storageEleven', 'Industrial Metal and Wood Shelving', 290, 'USD'),
  ('storageTwelve', 'Minimalist Floating Wall Shelves', 95, 'USD'),
  ('storageThirteen', 'Classic White Pantry Cabinet', 520, 'USD'),
  ('storageFourteen', 'Modern Grey Media Console', 440, 'USD'),
  ('storageFifteen', 'Rustic Barn Door TV Stand', 510, 'USD'),
  ('storageSixteen', 'Compact White Shoe Storage', 160, 'USD'),
  ('tableOne', 'Modern Glass Dining Table', 580, 'USD'),
  ('tableTwo', 'Scandinavian Oak Dining Table', 640, 'USD'),
  ('tableThree', 'Industrial Metal Dining Table', 420, 'USD'),
  ('tableFour', 'Round Marble Bistro Table', 380, 'USD'),
  ('tableFive', 'Extendable White Dining Table', 720, 'USD'),
  ('tableSix', 'Farmhouse Wood Dining Table', 690, 'USD'),
  ('tableSeven', 'Minimalist Black Desk', 280, 'USD'),
  ('tableEight', 'Glass Coffee Table', 320, 'USD'),
  ('tableNine', 'Walnut Coffee Table', 410, 'USD'),
  ('tableTen', 'Nesting Side Tables', 190, 'USD'),
  ('tableEleven', 'Console Table', 240, 'USD'),
  ('tableTwelve', 'Outdoor Patio Table', 350, 'USD'),
  ('tableThirteen', 'Bar Height Pub Table', 310, 'USD'),
  ('tableFourteen', 'Folding Utility Table', 85, 'USD'),
  ('tableFifteen', 'Modern Rattan Dining Set', 980, 'USD'),
  ('chairOne', 'Minimalist Black Metal Dining Chair', 85, 'USD'),
  ('chairTwo', 'Modern Upholstered Dining Chair', 120, 'USD'),
  ('chairThree', 'Modern White Molded Armchair', 95, 'USD'),
  ('chairFour', 'Modern Perforated Metal Dining Chair', 110, 'USD'),
  ('chairFive', 'Classic Windsor Chair', 140, 'USD'),
  ('chairSix', 'Velvet Accent Chair', 165, 'USD'),
  ('chairSeven', 'Ergonomic Office Chair', 220, 'USD'),
  ('chairEight', 'Folding Chair', 45, 'USD'),
  ('chairNine', 'Bar Stool with Back', 95, 'USD'),
  ('sofaTen', 'Modern Grey Sectional Sofa', 1850, 'USD'),
  ('sofaEleven', 'Mid-Century Leather Sofa', 2100, 'USD'),
  ('sofaTwelve', 'Compact Loveseat', 890, 'USD'),
  ('sofaThirteen', 'Reclining Sofa', 1650, 'USD'),
  ('sofaFourteen', 'Sleeper Sofa', 1420, 'USD'),
  ('armchairFifteen', 'Wingback Armchair', 520, 'USD'),
  ('armchairSixteen', 'Club Chair', 480, 'USD'),
  ('armchairSeventeen', 'Reading Chair with Ottoman', 620, 'USD'),
  ('armchairEighteen', 'Swivel Accent Chair', 410, 'USD'),
  ('armchairNineteen', 'Rocking Chair', 360, 'USD'),
  ('armchairTwenty', 'Bean Bag Chair', 120, 'USD'),
  ('stoolTwentyOne', 'Wooden Bar Stool', 75, 'USD'),
  ('stoolTwentyTwo', 'Adjustable Workshop Stool', 95, 'USD'),
  ('stoolTwentyThree', 'Upholstered Vanity Stool', 85, 'USD'),
  ('stoolTwentyFour', 'Outdoor Garden Stool', 55, 'USD'),
  ('stoolTwentyFive', 'Stackable Plastic Stool', 35, 'USD'),
  ('doorOne', 'Minimalist White Interior Door', 220, 'USD'),
  ('doorTwo', 'Classic Six-Panel White Door', 195, 'USD'),
  ('windowOne', 'Modern White Casement Window', 280, 'USD')
on conflict (item_key) do nothing;

-- Texture finishes (USD per square meter)
insert into public.texture_prices (texture_key, surface, texture_url, price_per_sq_m, currency) values
  ('floor_light_fine_wood', 'floor', 'https://cdn-images.archybase.com/archybase/blueprint3d/covers/light_fine_wood.jpg', 45, 'USD'),
  ('wall_marble_tiles', 'wall', 'https://cdn-images.archybase.com/archybase/blueprint3d/covers/marbletiles.jpg', 85, 'USD'),
  ('wall_map_yellow', 'wall', 'https://cdn-images.archybase.com/archybase/blueprint3d/covers/wallmap_yellow.png', 35, 'USD'),
  ('wall_light_brick', 'wall', 'https://cdn-images.archybase.com/archybase/blueprint3d/covers/light_brick.jpg', 55, 'USD'),
  ('wall_default', 'wall', 'https://cdn-images.lumenfeng.com/models-cover/wallmap.png', 30, 'USD'),
  ('floor_default', 'floor', 'https://cdn-images.lumenfeng.com/models-cover/hardwood.png', 40, 'USD')
on conflict (texture_key) do nothing;
