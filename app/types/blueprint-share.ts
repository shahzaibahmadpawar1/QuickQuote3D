import type { EstimateSnapshotV1 } from '@/lib/estimate-snapshot'

export interface BlueprintSharePayload {
  title: string
  roomType: string | null
  layoutData: Record<string, unknown>
  estimateSnapshot: EstimateSnapshotV1
  createdAt: string
}

export interface BlueprintShareLink {
  shareToken: string
  shareUrl: string
  createdAt: string
  revoked: boolean
}
