import { RoomType } from '@blueprint3d/types/room_types'

const STORAGE_KEY = 'blueprint3d.customRoomTypes'

const DEFAULT_ROOM_TYPES = Object.values(RoomType)

function unique(values: string[]): string[] {
  return Array.from(new Set(values))
}

export function normalizeRoomTypeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function getDefaultRoomTypes(): string[] {
  return [...DEFAULT_ROOM_TYPES]
}

export function getRoomTypeLabel(roomType: string): string {
  return roomType
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function loadRoomTypes(): string[] {
  if (typeof window === 'undefined') {
    return getDefaultRoomTypes()
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultRoomTypes()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return getDefaultRoomTypes()
    const sanitized = parsed
      .map((value) => normalizeRoomTypeName(String(value ?? '')))
      .filter(Boolean)
    return sanitized.length > 0 ? unique(sanitized) : getDefaultRoomTypes()
  } catch {
    return getDefaultRoomTypes()
  }
}

export function saveRoomTypes(values: string[]): string[] {
  const normalized = values
    .map((value) => normalizeRoomTypeName(value))
    .filter(Boolean)
  const next = normalized.length > 0 ? unique(normalized) : getDefaultRoomTypes()
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }
  return next
}
