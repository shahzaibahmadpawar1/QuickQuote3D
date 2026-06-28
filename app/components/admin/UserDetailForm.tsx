'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDuration } from '@/lib/entitlements'
import { revokeUserShares, updateAdminUser } from '@/services/admin'
import type { AdminUpdateUserPayload, AdminUserStatsRow } from '@/types/admin'

interface UserDetailFormProps {
  initialUser: AdminUserStatsRow
}

function toLimitInput(value: number | null): string {
  return value == null ? '' : String(value)
}

function parseLimitInput(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const num = Number(trimmed)
  return Number.isFinite(num) && num >= 0 ? num : null
}

export function UserDetailForm({ initialUser }: UserDetailFormProps) {
  const [user, setUser] = useState(initialUser)
  const [saving, setSaving] = useState(false)
  const [revoking, setRevoking] = useState(false)

  const [status, setStatus] = useState(user.status)
  const [role, setRole] = useState(user.role)
  const [notes, setNotes] = useState(user.notes ?? '')
  const [canShareProjects, setCanShareProjects] = useState(user.canShareProjects)
  const [canAddCustomItems, setCanAddCustomItems] = useState(user.canAddCustomItems)
  const [canAddTextures, setCanAddTextures] = useState(user.canAddTextures)
  const [canOverridePricing, setCanOverridePricing] = useState(user.canOverridePricing)
  const [canExportPdf, setCanExportPdf] = useState(user.canExportPdf)
  const [maxCustomItems, setMaxCustomItems] = useState(toLimitInput(user.maxCustomItems))
  const [maxProjects, setMaxProjects] = useState(toLimitInput(user.maxProjects))
  const [maxWallTextures, setMaxWallTextures] = useState(toLimitInput(user.maxWallTextures))
  const [maxFloorTextures, setMaxFloorTextures] = useState(toLimitInput(user.maxFloorTextures))
  const [maxActiveShares, setMaxActiveShares] = useState(toLimitInput(user.maxActiveShares))

  useEffect(() => {
    setUser(initialUser)
  }, [initialUser])

  const buildPayload = (): AdminUpdateUserPayload => ({
    status,
    role,
    notes: notes.trim() || null,
    canShareProjects,
    canAddCustomItems,
    canAddTextures,
    canOverridePricing,
    canExportPdf,
    maxCustomItems: parseLimitInput(maxCustomItems),
    maxProjects: parseLimitInput(maxProjects),
    maxWallTextures: parseLimitInput(maxWallTextures),
    maxFloorTextures: parseLimitInput(maxFloorTextures),
    maxActiveShares: parseLimitInput(maxActiveShares)
  })

  const onSave = async () => {
    setSaving(true)
    try {
      const updated = await updateAdminUser(user.userId, buildPayload())
      setUser(updated)
      toast.success('User settings saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const onRevokeShares = async () => {
    setRevoking(true)
    try {
      await revokeUserShares(user.userId)
      toast.success('All active shares revoked')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke shares')
    } finally {
      setRevoking(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user.email ?? '—'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Registered</span>
            <span>{new Date(user.registeredAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Custom items</span>
            <span>{user.customItemsCount}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Wall textures</span>
            <span>{user.wallTexturesCount}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Floor textures</span>
            <span>{user.floorTexturesCount}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Projects</span>
            <span>{user.projectsCount}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Active shares</span>
            <span>{user.activeSharesCount}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Total shares (all time)</span>
            <span>{user.totalSharesCount}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Time in app</span>
            <span>{formatDuration(user.totalSecondsInApp)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Last project activity</span>
            <span>
              {user.lastProjectActivity
                ? new Date(user.lastProjectActivity).toLocaleString()
                : '—'}
            </span>
          </div>
          <Button type="button" variant="outline" onClick={onRevokeShares} disabled={revoking}>
            Revoke all active shares
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entitlements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Account status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            {[
              ['Share projects', canShareProjects, setCanShareProjects],
              ['Add custom items', canAddCustomItems, setCanAddCustomItems],
              ['Add textures', canAddTextures, setCanAddTextures],
              ['Override pricing', canOverridePricing, setCanOverridePricing],
              ['Export PDF', canExportPdf, setCanExportPdf]
            ].map(([label, value, setter]) => (
              <div key={String(label)} className="flex items-center justify-between gap-4">
                <Label>{label as string}</Label>
                <Switch checked={value as boolean} onCheckedChange={setter as (v: boolean) => void} />
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['Max custom items', maxCustomItems, setMaxCustomItems],
              ['Max projects', maxProjects, setMaxProjects],
              ['Max wall textures', maxWallTextures, setMaxWallTextures],
              ['Max floor textures', maxFloorTextures, setMaxFloorTextures],
              ['Max active shares', maxActiveShares, setMaxActiveShares]
            ].map(([label, value, setter]) => (
              <div key={String(label)} className="space-y-2">
                <Label>{label as string}</Label>
                <Input
                  value={value as string}
                  onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                  placeholder="Unlimited"
                  inputMode="numeric"
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Admin notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>

          <Button type="button" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
