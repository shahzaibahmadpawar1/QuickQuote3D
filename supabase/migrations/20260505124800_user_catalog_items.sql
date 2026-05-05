-- User-uploaded private catalog items and storage policies.

create table if not exists public.user_catalog_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null unique,
  name text not null,
  description text,
  image_url text not null,
  image_path text not null,
  model_url text not null,
  model_path text not null,
  item_type integer not null check (item_type in (1, 3, 7, 11)),
  category text not null check (category in (
    'bed', 'drawer', 'wardrobe', 'light', 'storage', 'table', 'chair', 'sofa', 'armchair', 'stool', 'door', 'window'
  )),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_catalog_items_user_id
  on public.user_catalog_items (user_id, updated_at desc);

alter table public.user_catalog_items enable row level security;

drop policy if exists "user_catalog_items_select_own" on public.user_catalog_items;
create policy "user_catalog_items_select_own"
  on public.user_catalog_items for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_catalog_items_insert_own" on public.user_catalog_items;
create policy "user_catalog_items_insert_own"
  on public.user_catalog_items for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_catalog_items_update_own" on public.user_catalog_items;
create policy "user_catalog_items_update_own"
  on public.user_catalog_items for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_catalog_items_delete_own" on public.user_catalog_items;
create policy "user_catalog_items_delete_own"
  on public.user_catalog_items for delete
  to authenticated
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'user-item-images',
    'user-item-images',
    true,
    5242880,
    array['image/png', 'image/jpeg', 'image/jpg']
  ),
  (
    'user-item-models',
    'user-item-models',
    true,
    52428800,
    array['model/gltf-binary', 'application/octet-stream']
  )
on conflict (id) do nothing;

drop policy if exists "user_item_images_select_own" on storage.objects;
create policy "user_item_images_select_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'user-item-images' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "user_item_images_insert_own" on storage.objects;
create policy "user_item_images_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'user-item-images' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "user_item_images_update_own" on storage.objects;
create policy "user_item_images_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'user-item-images' and split_part(name, '/', 1) = auth.uid()::text)
  with check (bucket_id = 'user-item-images' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "user_item_images_delete_own" on storage.objects;
create policy "user_item_images_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'user-item-images' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "user_item_models_select_own" on storage.objects;
create policy "user_item_models_select_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'user-item-models' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "user_item_models_insert_own" on storage.objects;
create policy "user_item_models_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'user-item-models' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "user_item_models_update_own" on storage.objects;
create policy "user_item_models_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'user-item-models' and split_part(name, '/', 1) = auth.uid()::text)
  with check (bucket_id = 'user-item-models' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "user_item_models_delete_own" on storage.objects;
create policy "user_item_models_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'user-item-models' and split_part(name, '/', 1) = auth.uid()::text);
