'use client'

import type { BlueprintSharePayload } from '@/types/blueprint-share'
import { Blueprint3DApp } from './Blueprint3DApp'

interface SharedBlueprintViewProps {
  share: BlueprintSharePayload
}

export function SharedBlueprintView({ share }: SharedBlueprintViewProps) {
  return (
    <Blueprint3DApp
      config={{
        readOnly: true,
        initialLayout: JSON.stringify(share.layoutData),
        sharedEstimateSnapshot: share.estimateSnapshot,
        sharedTitle: share.title,
        isLanguageOption: true
      }}
    />
  )
}
