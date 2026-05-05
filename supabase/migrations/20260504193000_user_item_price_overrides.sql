-- Per-user item price overrides; global defaults remain in catalog_item_prices.

create table if not exists public.user_item_prices (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_key)
);

create index if not exists idx_user_item_prices_user_id
  on public.user_item_prices (user_id);

alter table public.user_item_prices enable row level security;

create policy "user_item_prices_select_own"
  on public.user_item_prices for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_item_prices_insert_own"
  on public.user_item_prices for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_item_prices_update_own"
  on public.user_item_prices for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_item_prices_delete_own"
  on public.user_item_prices for delete
  to authenticated
  using (auth.uid() = user_id);
