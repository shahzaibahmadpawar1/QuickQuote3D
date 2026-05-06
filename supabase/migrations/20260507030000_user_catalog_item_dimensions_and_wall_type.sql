-- Extend user catalog item schema:
-- 1) add wall-side placement type (9)
-- 2) persist optional custom dimensions in cm

alter table public.user_catalog_items
  add column if not exists width_cm numeric(10, 2),
  add column if not exists height_cm numeric(10, 2),
  add column if not exists depth_cm numeric(10, 2);

alter table public.user_catalog_items
  drop constraint if exists user_catalog_items_item_type_check;

alter table public.user_catalog_items
  add constraint user_catalog_items_item_type_check
  check (item_type in (1, 3, 7, 9, 11));

alter table public.user_catalog_items
  drop constraint if exists user_catalog_items_width_cm_check;
alter table public.user_catalog_items
  add constraint user_catalog_items_width_cm_check
  check (width_cm is null or width_cm > 0);

alter table public.user_catalog_items
  drop constraint if exists user_catalog_items_height_cm_check;
alter table public.user_catalog_items
  add constraint user_catalog_items_height_cm_check
  check (height_cm is null or height_cm > 0);

alter table public.user_catalog_items
  drop constraint if exists user_catalog_items_depth_cm_check;
alter table public.user_catalog_items
  add constraint user_catalog_items_depth_cm_check
  check (depth_cm is null or depth_cm > 0);
