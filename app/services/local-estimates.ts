/**
 * Persists cost estimate snapshots in IndexedDB when the user has no cloud blueprint
 * or Supabase is unavailable.
 */
import type { EstimateSnapshotV1 } from '@/lib/estimate-snapshot'
import type { RemoteEstimateRow } from './blueprintRemote'

const DB_NAME = 'blueprint3d_saved_estimates'
const STORE = 'estimates'
const DB_VERSION = 1

const ID_PREFIX = 'local-est-'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

interface StoredLocalEstimate {
  id: string
  blueprintId: string | null
  title: string
  createdAt: number
  snapshot: EstimateSnapshotV1
}

function toRow(r: StoredLocalEstimate): RemoteEstimateRow {
  return {
    id: r.id,
    title: r.title,
    createdAt: r.createdAt,
    snapshot: r.snapshot
  }
}

function newId(): string {
  return ID_PREFIX + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)
}

export async function localEstimateList(blueprintId: string | null): Promise<RemoteEstimateRow[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => {
      const all = (req.result as StoredLocalEstimate[]) ?? []
      const match = all.filter((r) => (r.blueprintId ?? null) === (blueprintId ?? null))
      match.sort((a, b) => b.createdAt - a.createdAt)
      resolve(match.map(toRow))
    }
    req.onerror = () => reject(req.error)
  })
}

export async function localEstimateInsert(
  blueprintId: string | null,
  title: string,
  snapshot: EstimateSnapshotV1
): Promise<RemoteEstimateRow> {
  const db = await openDb()
  const rec: StoredLocalEstimate = {
    id: newId(),
    blueprintId,
    title,
    createdAt: Math.floor(Date.now() / 1000),
    snapshot
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(rec)
    tx.oncomplete = () => resolve(toRow(rec))
    tx.onerror = () => reject(tx.error)
  })
}

export async function localEstimateDelete(id: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export function isLocalEstimateId(id: string): boolean {
  return id.startsWith(ID_PREFIX)
}
