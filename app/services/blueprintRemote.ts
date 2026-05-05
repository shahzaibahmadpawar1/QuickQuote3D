import type { SupabaseClient } from '@supabase/supabase-js'
import { RoomType } from '@blueprint3d/types/room_types'
import type { BlueprintDetail, BlueprintListItem, BlueprintPayload } from '@/types/blueprint'
import type { EstimateSnapshotV1 } from '@/lib/estimate-snapshot'
import type { ListOptions } from './storage'

function toUnix(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000)
}

function mapListRow(row: {
  id: string
  name: string
  room_type: string | null
  thumbnail_base64: string | null
  created_at: string
  updated_at: string
}): BlueprintListItem {
  const thumb = row.thumbnail_base64
  return {
    id: row.id,
    name: row.name,
    description: null,
    thumbnailUrl: thumb,
    previewCleanUrl: thumb,
    roomType: row.room_type ?? null,
    createdAt: toUnix(row.created_at),
    updatedAt: toUnix(row.updated_at)
  }
}

export async function remoteList(
  sb: SupabaseClient,
  userId: string,
  options: ListOptions = {}
): Promise<BlueprintListItem[]> {
  const { data, error } = await sb
    .from('blueprints')
    .select('id,name,room_type,thumbnail_base64,created_at,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  let rows = (data ?? []).map(mapListRow)

  if (options.roomType && options.roomType !== 'all') {
    rows = rows.filter((r) => r.roomType === options.roomType)
  }
  if (options.search) {
    const qlow = options.search.toLowerCase()
    rows = rows.filter((r) => r.name.toLowerCase().includes(qlow))
  }
  const sort = options.sort || 'newest'
  if (sort === 'oldest') rows.sort((a, b) => a.updatedAt - b.updatedAt)
  else if (sort === 'name') rows.sort((a, b) => a.name.localeCompare(b.name))
  else rows.sort((a, b) => b.updatedAt - a.updatedAt)

  return rows
}

export async function remoteGet(sb: SupabaseClient, userId: string, id: string): Promise<BlueprintDetail | null> {
  const { data, error } = await sb
    .from('blueprints')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const thumb = data.thumbnail_base64 as string | null
  return {
    id: data.id,
    name: data.name,
    description: null,
    thumbnailUrl: thumb,
    previewCleanUrl: thumb,
    roomType: data.room_type ?? null,
    layoutData: (data.layout_data ?? {}) as Record<string, unknown>,
    layoutDataSimple: null,
    createdAt: toUnix(data.created_at),
    updatedAt: toUnix(data.updated_at)
  }
}

export async function remoteCreate(
  sb: SupabaseClient,
  userId: string,
  payload: BlueprintPayload
): Promise<BlueprintDetail> {
  const { data, error } = await sb
    .from('blueprints')
    .insert({
      user_id: userId,
      name: payload.name,
      room_type: payload.roomType ?? RoomType.BEDROOM,
      layout_data: payload.layoutData,
      thumbnail_base64: payload.thumbnailBase64 ?? null
    })
    .select()
    .single()

  if (error) throw error
  return (await remoteGet(sb, userId, data.id))!
}

export async function remoteUpdate(
  sb: SupabaseClient,
  userId: string,
  id: string,
  partial: Partial<BlueprintPayload>
): Promise<BlueprintDetail> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (partial.name != null) patch.name = partial.name
  if (partial.layoutData != null) patch.layout_data = partial.layoutData
  if (partial.thumbnailBase64 != null) patch.thumbnail_base64 = partial.thumbnailBase64
  if (partial.roomType != null) patch.room_type = partial.roomType
  if (partial.description != null) {
    /* schema has no description column — ignore */
  }

  const { error } = await sb.from('blueprints').update(patch).eq('id', id).eq('user_id', userId)
  if (error) throw error
  return (await remoteGet(sb, userId, id))!
}

export async function remoteDelete(sb: SupabaseClient, userId: string, id: string): Promise<void> {
  const { error } = await sb.from('blueprints').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}

export interface RemoteEstimateRow {
  id: string
  title: string
  createdAt: number
  snapshot: EstimateSnapshotV1
}

export async function remoteListEstimates(
  sb: SupabaseClient,
  userId: string,
  blueprintId: string
): Promise<RemoteEstimateRow[]> {
  const { data, error } = await sb
    .from('blueprint_estimates')
    .select('id,title,created_at,snapshot')
    .eq('user_id', userId)
    .eq('blueprint_id', blueprintId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    createdAt: toUnix(row.created_at as string),
    snapshot: row.snapshot as EstimateSnapshotV1
  }))
}

export async function remoteInsertEstimate(
  sb: SupabaseClient,
  userId: string,
  blueprintId: string,
  title: string,
  snapshot: EstimateSnapshotV1
): Promise<RemoteEstimateRow> {
  const { data, error } = await sb
    .from('blueprint_estimates')
    .insert({
      user_id: userId,
      blueprint_id: blueprintId,
      title,
      snapshot: snapshot as unknown as Record<string, unknown>
    })
    .select('id,title,created_at,snapshot')
    .single()

  if (error) throw error
  return {
    id: data.id as string,
    title: data.title as string,
    createdAt: toUnix(data.created_at as string),
    snapshot: data.snapshot as EstimateSnapshotV1
  }
}

export async function remoteDeleteEstimate(sb: SupabaseClient, userId: string, estimateId: string): Promise<void> {
  const { error } = await sb.from('blueprint_estimates').delete().eq('id', estimateId).eq('user_id', userId)
  if (error) throw error
}
