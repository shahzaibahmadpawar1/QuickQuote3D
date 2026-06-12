'use client'

import { RoomType } from '@blueprint3d/types/room_types'
import { useTranslations } from 'next-intl'
import { MyFloorplans } from './MyFloorplans'

interface ProjectsViewProps {
  onBlueprintLoad: (layoutData: string, roomType: string, id?: string, name?: string) => void
}

export function ProjectsView({ onBlueprintLoad }: ProjectsViewProps) {
  const t = useTranslations('BluePrint.myFloorplans')

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      <div className="border-b border-border px-6 pb-4 pt-14">
        <h1 className="type-display text-2xl text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <MyFloorplans
          onLoadFloorplan={(data, roomType, id, name) =>
            onBlueprintLoad(data, roomType ?? RoomType.BEDROOM, id, name)
          }
        />
      </div>
    </div>
  )
}
