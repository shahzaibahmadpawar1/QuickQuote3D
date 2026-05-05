-- Saved cost estimate snapshots per blueprint (user-scoped, RLS)

create table if not exists public.blueprint_estimates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  blueprint_id uuid not null references public.blueprints (id) on delete cascade,
  title text not null,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists blueprint_estimates_blueprint_created_idx
  on public.blueprint_estimates (blueprint_id, created_at desc);

alter table public.blueprint_estimates enable row level security;

create policy "blueprint_estimates_select_own"
  on public.blueprint_estimates for select
  using (auth.uid() = user_id);

create policy "blueprint_estimates_insert_own"
  on public.blueprint_estimates for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.blueprints b
      where b.id = blueprint_id and b.user_id = auth.uid()
    )
  );

create policy "blueprint_estimates_delete_own"
  on public.blueprint_estimates for delete
  using (auth.uid() = user_id);
