'use client'

import { useEffect, useState } from 'react'
import { Trash2, FolderOpen, Grid3x3, List, MoreVertical, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { blueprintList, blueprintGet, blueprintDelete } from '@/services/blueprintHub'
import type { BlueprintListItem } from '@/types/blueprint'
import { RoomType } from '@blueprint3d/types/room_types'
import { useTranslations, useLocale } from 'next-intl'
import { getRoomTypeLabel } from '@/lib/room-types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog'

interface MyFloorplansProps {
  onLoadFloorplan: (data: string, roomType?: string, id?: string, name?: string) => void
}

type ViewMode = 'grid' | 'list'

export function MyFloorplans({ onLoadFloorplan }: MyFloorplansProps) {
  const locale = useLocale()
  const t = useTranslations('BluePrint.myFloorplans')
  const tConfirmDelete = useTranslations('BluePrint.confirmDelete')
  const [floorplans, setFloorplans] = useState<BlueprintListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteConfirming, setDeleteConfirming] = useState(false)

  useEffect(() => {
    loadFloorplans()
  }, [])

  const loadFloorplans = async () => {
    try {
      const results = await blueprintList({ sort: 'newest' })
      setFloorplans(results)
    } catch (error) {
      console.error('Failed to load floorplans:', error)
      setFloorplans([])
    } finally {
      setLoading(false)
    }
  }

  const handleLoad = async (id: string, name: string) => {
    const toastId = toast.loading(t('loadingItem', { name }))
    try {
      const result = await blueprintGet(id)
      if (!result) {
        toast.error(t('loadNotFound'), { id: toastId })
        return
      }
      onLoadFloorplan(
        JSON.stringify(result.layoutData),
        result.roomType || RoomType.BEDROOM,
        id,
        name
      )
      toast.success(t('loadedSuccess', { name }), { id: toastId })
    } catch (error) {
      console.error('Failed to load floorplan:', error)
      toast.error(t('loadError'), { id: toastId })
    }
  }

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteConfirming(true)
    const toastId = toast.loading(t('deletingItem', { name: deleteTarget.name }))
    try {
      await blueprintDelete(deleteTarget.id)
      await loadFloorplans()
      toast.success(t('deleteSuccess', { name: deleteTarget.name }), { id: toastId })
      setDeleteTarget(null)
    } catch (error) {
      console.error('Failed to delete floorplan:', error)
      toast.error(t('deleteError') || 'Failed to delete floorplan', { id: toastId })
    } finally {
      setDeleteConfirming(false)
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label={t('loading')}>
        <div className="flex items-center justify-between gap-3">
          <div className="h-10 w-[180px] animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-20 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="aspect-[3/2] animate-pulse bg-muted" />
              <div className="space-y-2 p-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (floorplans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <FolderOpen className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-foreground">{t('noFloorplans')}</h3>
        <p className="text-sm text-muted-foreground">{t('saveFirst')}</p>
      </div>
    )
  }

  const filteredFloorplans =
    selectedRoomType === 'all'
      ? floorplans
      : floorplans.filter((fp) => fp.roomType === selectedRoomType)

  const roomTypes = Array.from(
    new Set(floorplans.map((fp) => fp.roomType).filter(Boolean))
  ) as string[]

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex items-center justify-between gap-3">
        <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filterAll') || 'All Rooms'}</SelectItem>
            {roomTypes.map((roomType) => (
              <SelectItem key={roomType} value={roomType}>
                {Object.values(RoomType).includes(roomType as RoomType)
                  ? t(`roomTypes.${roomType as RoomType}`)
                  : getRoomTypeLabel(roomType)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-1 border border-border rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8 w-8 p-0"
            title={t('gridView') || 'Grid View'}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8 w-8 p-0"
            title={t('listView') || 'List View'}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {t('savedCount', { count: filteredFloorplans.length })}
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 gap-3">
          {filteredFloorplans.map((floorplan) => (
            <div
              key={floorplan.id}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/20 hover:shadow-md"
              onClick={() => handleLoad(floorplan.id, floorplan.name)}
            >
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLoad(floorplan.id, floorplan.name)
                      }}
                      className="cursor-pointer"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      {t('editButton') || 'Edit'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(floorplan.id, floorplan.name)
                      }}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('deleteButton') || 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Thumbnail */}
              {floorplan.thumbnailUrl ? (
                <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: '3/2' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={floorplan.thumbnailUrl}
                    alt={floorplan.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {floorplan.roomType && (
                    <span className="absolute top-2 left-2 text-xs px-2 py-1 bg-primary/90 text-primary-foreground rounded-full backdrop-blur-sm">
                      {Object.values(RoomType).includes(floorplan.roomType as RoomType)
                        ? t(`roomTypes.${floorplan.roomType as RoomType}`)
                        : getRoomTypeLabel(floorplan.roomType)}
                    </span>
                  )}
                </div>
              ) : (
                <div
                  className="bg-muted flex items-center justify-center"
                  style={{ aspectRatio: '3/2' }}
                >
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              <div className="p-2">
                <h3 className="font-medium text-sm text-foreground truncate">{floorplan.name}</h3>
                <p className="text-xs text-muted-foreground">{formatDate(floorplan.updatedAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {filteredFloorplans.map((floorplan) => (
            <div
              key={floorplan.id}
              className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3 transition-all duration-200 hover:border-primary/20 hover:shadow-md"
              onClick={() => handleLoad(floorplan.id, floorplan.name)}
            >
              <div className="shrink-0">
                {floorplan.thumbnailUrl ? (
                  <div className="w-16 h-16 rounded overflow-hidden bg-muted relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={floorplan.thumbnailUrl}
                      alt={floorplan.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                    <FolderOpen className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-foreground truncate">{floorplan.name}</h3>
                  {floorplan.roomType && (
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full whitespace-nowrap shrink-0">
                      {Object.values(RoomType).includes(floorplan.roomType as RoomType)
                        ? t(`roomTypes.${floorplan.roomType as RoomType}`)
                        : getRoomTypeLabel(floorplan.roomType)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('lastModified')}: {formatDate(floorplan.updatedAt)}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation()
                      handleLoad(floorplan.id, floorplan.name)
                    }}
                    className="cursor-pointer"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    {t('editButton') || 'Edit'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation()
                      handleDelete(floorplan.id, floorplan.name)
                    }}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('deleteButton') || 'Delete'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={tConfirmDelete('title')}
        description={
          deleteTarget
            ? tConfirmDelete('descriptionNamed', { name: deleteTarget.name })
            : tConfirmDelete('description')
        }
        confirmLabel={tConfirmDelete('confirm')}
        cancelLabel={tConfirmDelete('cancel')}
        confirming={deleteConfirming}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
