/**
 * Uses Supabase when configured and user is signed in; otherwise IndexedDB.
 */
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { blueprintStorage, type ListOptions } from './storage'
import * as remote from './blueprintRemote'
import type { BlueprintPayload } from '@/types/blueprint'
import type { EstimateSnapshotV1 } from '@/lib/estimate-snapshot'
import type { RemoteEstimateRow } from './blueprintRemote'
import { isLocalEstimateId, localEstimateDelete, localEstimateInsert, localEstimateList } from './local-estimates'

async function getRemoteContext(): Promise<{ sb: ReturnType<typeof createClient>; userId: string } | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const sb = createClient()
    const {
      data: { user }
    } = await sb.auth.getUser()
    if (!user) return null
    return { sb, userId: user.id }
  } catch {
    return null
  }
}

export async function blueprintList(options: ListOptions = {}) {
  const ctx = await getRemoteContext()
  if (ctx) return remote.remoteList(ctx.sb, ctx.userId, options)
  return blueprintStorage.list(options)
}

export async function blueprintGet(id: string) {
  const ctx = await getRemoteContext()
  if (ctx) return remote.remoteGet(ctx.sb, ctx.userId, id)
  return blueprintStorage.get(id)
}

export async function blueprintCreate(payload: BlueprintPayload) {
  const ctx = await getRemoteContext()
  if (ctx) return remote.remoteCreate(ctx.sb, ctx.userId, payload)
  return blueprintStorage.create(payload)
}

export async function blueprintUpdate(id: string, partial: Partial<BlueprintPayload>) {
  const ctx = await getRemoteContext()
  if (ctx) return remote.remoteUpdate(ctx.sb, ctx.userId, id, partial)
  return blueprintStorage.update(id, partial)
}

export async function blueprintDelete(id: string) {
  const ctx = await getRemoteContext()
  if (ctx) return remote.remoteDelete(ctx.sb, ctx.userId, id)
  return blueprintStorage.delete(id)
}

export async function blueprintEstimateList(blueprintId: string | null): Promise<RemoteEstimateRow[]> {
  const local = await localEstimateList(blueprintId)
  const ctx = await getRemoteContext()
  if (!ctx || !blueprintId) {
    return local
  }
  const remoteRows = await remote.remoteListEstimates(ctx.sb, ctx.userId, blueprintId)
  return [...remoteRows, ...local].sort((a, b) => b.createdAt - a.createdAt)
}

export async function blueprintEstimateSave(
  blueprintId: string | null,
  title: string,
  snapshot: EstimateSnapshotV1
): Promise<RemoteEstimateRow> {
  const ctx = await getRemoteContext()
  if (ctx && blueprintId) {
    return remote.remoteInsertEstimate(ctx.sb, ctx.userId, blueprintId, title, snapshot)
  }
  return localEstimateInsert(blueprintId, title, snapshot)
}

export async function blueprintEstimateDelete(estimateId: string): Promise<void> {
  if (isLocalEstimateId(estimateId)) {
    return localEstimateDelete(estimateId)
  }
  const ctx = await getRemoteContext()
  if (!ctx) {
    throw new Error('REMOTE_ESTIMATES_UNAVAILABLE')
  }
  return remote.remoteDeleteEstimate(ctx.sb, ctx.userId, estimateId)
}
