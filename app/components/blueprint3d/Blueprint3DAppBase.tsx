'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { TopNavBar } from './TopNavBar'
import { ItemsDrawer } from './ItemsDrawer'
import { ProjectsView } from './ProjectsView'
import { SettingsDialog } from './SettingsDialog'
import { ContextMenu } from './ContextMenu'
import { BedSizeInput } from './BedSizeInput'
import { FloorplannerControls } from './FloorplannerControls'
import { TextureSelector } from './TextureSelector'
import { SaveFloorplanDialog } from './SaveFloorplanDialog'
import { EstimateDialog } from './EstimateDialog'
import { WallLengthDialog } from './WallLengthDialog'
import { ItemPriceSummaryPanel } from './ItemPriceSummaryPanel'
import { TouchHelp } from './TouchHelp'
import { ControlsHelp } from './ControlsHelp'
import DefaultFloorplan from '@blueprint3d/templates/default.json'
import {
  blueprintCreate,
  blueprintUpdate
} from '@/services/blueprintHub'
import { computeLayoutCostEstimate } from '@/lib/cost-estimate'
import {
  buildDefaultItemUnitPrices,
  buildDefaultTexturePricesPerSqM,
  buildModelUrlToItemKey,
  defaultEstimateSettings
} from '@/lib/default-pricing'
import { buildCatalogItems } from '@/lib/catalog-items'
import { listUserItems } from '@/services/user-items'

import { Blueprint3d } from '@blueprint3d/blueprint3d'
import { floorplannerModes } from '@blueprint3d/floorplanner/floorplanner_view'
import { Configuration, configDimUnit, configWallHeight } from '@blueprint3d/core/configuration'
import type { Item } from '@blueprint3d/items/item'
import type { CostEstimateResult } from '@/lib/cost-estimate'
import type { HalfEdge } from '@blueprint3d/model/half_edge'
import type { Wall } from '@blueprint3d/model/wall'
import type { Room } from '@blueprint3d/model/room'
import { Blueprint3DModes, type Blueprint3DMode } from '@blueprint3d/config/modes'
import { RoomType, isValidRoomType } from '@blueprint3d/types/room_types'
import { loadRoomTypes } from '@/lib/room-types'
import type { UserCatalogItem } from '@/types/user-item'

export interface Blueprint3DAppConfig {
  enableWheelZoom?: boolean | (() => boolean)
  mode?: Blueprint3DMode
  onBlueprint3DReady?: (blueprint3d: Blueprint3d) => void
  onBedSizeChange?: (width: number, length: number) => void
  isLanguageOption?: boolean
  openMyFloorplans?: boolean
  isFullscreen?: boolean
  onFullscreenToggle?: () => void
  onViewModeChange?: (mode: '2d' | '3d') => void
  renderOverlay?: () => React.ReactNode
  alwaysSpin?: boolean
}

interface Blueprint3DAppBaseProps {
  config?: Blueprint3DAppConfig
}

export function Blueprint3DAppBase({ config = {} }: Blueprint3DAppBaseProps) {
  const CUSTOM_ITEM_DEFAULT_SIZE_CM = 50 * 2.54
  const {
    enableWheelZoom = true,
    mode = Blueprint3DModes.BEDROOM,
    onBlueprint3DReady,
    onBedSizeChange,
    isLanguageOption = false,
    openMyFloorplans = false,
    isFullscreen = false,
    onViewModeChange,
    renderOverlay,
    alwaysSpin = false
  } = config

  const t = useTranslations('BluePrint.saveDialog')
  const tItems = useTranslations('BluePrint.items')
  const tFloorplanner = useTranslations('BluePrint.floorplanner')
  const tMyFloorplans = useTranslations('BluePrint.myFloorplans')
  const tEstimate = useTranslations('BluePrint.estimate')

  const contentRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<HTMLDivElement>(null)
  const floorplannerCanvasRef = useRef<HTMLCanvasElement>(null)
  const itemCostPanelRef = useRef<HTMLDivElement>(null)
  const blueprint3dRef = useRef<Blueprint3d | null>(null)
  /** Avoid persisting the initial empty model before IndexedDB/default template load completes. */
  const draftPersistenceReadyRef = useRef(false)
  const loadingToastsRef = useRef<Array<{ toastId: string | number; itemName: string }>>([])
  const itemCostDragRef = useRef<{ offsetX: number; offsetY: number } | null>(null)
  const summarySelectionCursorRef = useRef<Record<string, number>>({})
  const historyRef = useRef<string[]>([])
  const historyIndexRef = useRef(-1)
  const restoringHistoryRef = useRef(false)

  const [activeTab, setActiveTab] = useState<'projects' | 'edit' | 'items'>(
    openMyFloorplans ? 'projects' : 'edit'
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [estimateOpen, setEstimateOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [floorplannerMode, setFloorplannerMode] = useState<'move' | 'draw' | 'delete'>('move')
  const [wallLengthLocked, setWallLengthLocked] = useState(false)
  const [textureType, setTextureType] = useState<'floor' | 'wall' | null>(null)
  const [currentTarget, setCurrentTarget] = useState<HalfEdge | Room | null>(null)
  const [itemsLoading, setItemsLoading] = useState(0)
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d')
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [itemCostMinimized, setItemCostMinimized] = useState(false)
  const [itemCostPosition, setItemCostPosition] = useState({ x: 16, y: 80 })
  const [ceilingVisible, setCeilingVisible] = useState(true)
  const [roomTypes, setRoomTypes] = useState<string[]>([])

  const [currentBlueprint, setCurrentBlueprint] = useState<{
    id: string
    name: string
    roomType: string
  } | null>(null)

  const [currentMode, setCurrentMode] = useState<Blueprint3DMode>(mode)

  const [layoutEpoch, setLayoutEpoch] = useState(0)
  const [pricingPayload, setPricingPayload] = useState<{
    itemPrices: Record<string, number>
    userItemOverrides: Record<string, number>
    texturePricesPerSqM: Record<string, number>
    settings: { labor_pct: number; delivery_pct: number; contingency_pct: number; currency: string }
  } | null>(null)
  const [costEstimate, setCostEstimate] = useState<CostEstimateResult | null>(null)
  const [wallLengthDialogOpen, setWallLengthDialogOpen] = useState(false)
  const [wallLengthTarget, setWallLengthTarget] = useState<Wall | null>(null)
  const [userItems, setUserItems] = useState<UserCatalogItem[]>([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const viewModeRef = useRef<'2d' | '3d'>('3d')

  const getWheelZoomEnabled = useCallback(() => {
    if (typeof enableWheelZoom === 'function') {
      return enableWheelZoom()
    }
    return enableWheelZoom
  }, [enableWheelZoom])

  useEffect(() => {
    viewModeRef.current = viewMode
  }, [viewMode])

  // Initialize Blueprint3d
  useEffect(() => {
    if (!viewerRef.current || blueprint3dRef.current) return

    const savedUnit = localStorage.getItem('dimensionUnit')
    if (savedUnit) {
      Configuration.setValue(configDimUnit, savedUnit)
    }

    const opts = {
      floorplannerElement: 'floorplanner-canvas',
      threeElement: '#viewer',
      textureDir: '/models/textures/',
      widget: false,
      enableWheelZoom: getWheelZoomEnabled(),
      alwaysSpin
    }

    const blueprint3d = new Blueprint3d(opts)
    blueprint3dRef.current = blueprint3d

    if (onBlueprint3DReady) {
      onBlueprint3DReady(blueprint3d)
    }

    blueprint3d.three.itemSelectedCallbacks.add((item) => {
      setSelectedItem(item)
      setTextureType(null)
    })

    blueprint3d.three.itemUnselectedCallbacks.add(() => {
      setSelectedItem(null)
    })

    blueprint3d.three.wallClicked.add((halfEdge) => {
      setCurrentTarget(halfEdge)
      setTextureType('wall')
      setSelectedItem(null)
    })

    blueprint3d.three.floorClicked.add((room) => {
      setCurrentTarget(room)
      setTextureType('floor')
      setSelectedItem(null)
    })

    blueprint3d.three.nothingClicked.add(() => {
      setTextureType(null)
      setCurrentTarget(null)
    })

    blueprint3d.model.scene.itemLoadingCallbacks.add(() => {
      setItemsLoading((prev) => prev + 1)
    })

    const bumpLayout = () => setLayoutEpoch((e) => e + 1)
    blueprint3d.model.floorplan.fireOnUpdatedRooms(bumpLayout)
    blueprint3d.model.floorplan.fireOnRedraw(bumpLayout)
    blueprint3d.model.scene.itemRemovedCallbacks.add(() => {
      bumpLayout()
      if (viewModeRef.current === '2d') {
        blueprint3d.floorplanner?.reset()
      }
    })

    blueprint3d.model.scene.itemLoadedCallbacks.add((item) => {
      const itemKey = item?.metadata?.itemKey
      if (typeof itemKey === 'string' && itemKey.startsWith('usr_')) {
        // Enforce default dimensions for custom uploads (50 inches each side).
        // Users can still change size later in the context menu.
        item.resize(
          CUSTOM_ITEM_DEFAULT_SIZE_CM,
          CUSTOM_ITEM_DEFAULT_SIZE_CM,
          CUSTOM_ITEM_DEFAULT_SIZE_CM
        )
      }
      setItemsLoading((prev) => prev - 1)
      const loadingToasts = loadingToastsRef.current
      if (loadingToasts.length > 0) {
        const { toastId, itemName } = loadingToasts.shift()!
        toast.success(tItems('loadedSuccess', { name: itemName }), { id: toastId })
      }
      bumpLayout()
      if (viewModeRef.current === '2d') {
        blueprint3d.floorplanner?.reset()
      }
    })

    blueprint3d.model.scene.itemLoadErrorCallbacks.add(() => {
      setItemsLoading((prev) => prev - 1)
      const loadingToasts = loadingToastsRef.current
      if (loadingToasts.length > 0) {
        const { toastId, itemName } = loadingToasts.shift()!
        toast.error(tItems('loadError', { name: itemName }), { id: toastId })
      }
    })

    // Load floorplan from IndexedDB or use default
    const loadInitialFloorplan = async () => {
      draftPersistenceReadyRef.current = false
      try {
        const { blueprintTemplateDB } = await import('@blueprint3d/indexdb/blueprint-template')
        const savedTemplate = await blueprintTemplateDB.getTemplate()

        if (savedTemplate) {
          const fp = savedTemplate.floorplan
          const wallsEmpty = !fp?.walls?.length
          const cornersEmpty = !fp?.corners || Object.keys(fp.corners).length === 0
          if (wallsEmpty && cornersEmpty) {
            try {
              await blueprintTemplateDB.clearTemplate()
            } catch {
              // ignore clear failure; still load default below
            }
          } else {
            blueprint3d.model.loadSerialized(JSON.stringify(savedTemplate))
            return
          }
        }

        const { getModeConfig } = await import('@blueprint3d/config/modes')
        const modeConfig = getModeConfig(mode)
        blueprint3d.model.loadSerialized(JSON.stringify(modeConfig.defaultTemplate))
      } catch (error) {
        console.error('[Blueprint3DAppBase] Error loading template:', error)
        blueprint3d.model.loadSerialized(JSON.stringify(DefaultFloorplan))
      } finally {
        draftPersistenceReadyRef.current = true
        bumpLayout()
      }
    }

    loadInitialFloorplan()

    if (blueprint3d.floorplanner) {
      blueprint3d.floorplanner.wallLengthEditHandler = (wall) => {
        setWallLengthTarget(wall)
        setWallLengthDialogOpen(true)
      }
      blueprint3d.floorplanner.setWallLengthLock(wallLengthLocked)
    }

    return () => {
      blueprint3d.floorplanner!.wallLengthEditHandler = null
    }
  }, [CUSTOM_ITEM_DEFAULT_SIZE_CM, getWheelZoomEnabled, tItems, mode, onBlueprint3DReady])

  useEffect(() => {
    blueprint3dRef.current?.floorplanner?.setWallLengthLock(wallLengthLocked)
  }, [wallLengthLocked])

  const updateHistoryControls = useCallback(() => {
    const idx = historyIndexRef.current
    const len = historyRef.current.length
    setCanUndo(idx > 0)
    setCanRedo(idx >= 0 && idx < len - 1)
  }, [])

  const pushHistorySnapshot = useCallback((serialized: string) => {
    if (!serialized) return
    const currentIdx = historyIndexRef.current
    const currentHistory = historyRef.current
    if (currentIdx >= 0 && currentHistory[currentIdx] === serialized) {
      updateHistoryControls()
      return
    }

    const truncated = currentHistory.slice(0, currentIdx + 1)
    truncated.push(serialized)
    const MAX_HISTORY = 60
    if (truncated.length > MAX_HISTORY) {
      truncated.shift()
    }

    historyRef.current = truncated
    historyIndexRef.current = truncated.length - 1
    updateHistoryControls()
  }, [updateHistoryControls])

  const handleUndo = useCallback(() => {
    if (!blueprint3dRef.current) return
    if (historyIndexRef.current <= 0) return
    const targetIndex = historyIndexRef.current - 1
    const snapshot = historyRef.current[targetIndex]
    if (!snapshot) return

    restoringHistoryRef.current = true
    historyIndexRef.current = targetIndex
    blueprint3dRef.current.model.loadSerialized(snapshot)
    updateHistoryControls()
    window.setTimeout(() => {
      restoringHistoryRef.current = false
    }, 0)
  }, [updateHistoryControls])

  const handleRedo = useCallback(() => {
    if (!blueprint3dRef.current) return
    const targetIndex = historyIndexRef.current + 1
    const snapshot = historyRef.current[targetIndex]
    if (!snapshot) return

    restoringHistoryRef.current = true
    historyIndexRef.current = targetIndex
    blueprint3dRef.current.model.loadSerialized(snapshot)
    updateHistoryControls()
    window.setTimeout(() => {
      restoringHistoryRef.current = false
    }, 0)
  }, [updateHistoryControls])

  // Persist in-progress layout as draft so refresh does not lose unsaved work.
  useEffect(() => {
    if (!blueprint3dRef.current || !draftPersistenceReadyRef.current) return
    const timeoutId = window.setTimeout(async () => {
      try {
        const serialized = blueprint3dRef.current?.model.exportSerialized()
        if (!serialized) return
        const { blueprintTemplateDB } = await import('@blueprint3d/indexdb/blueprint-template')
        await blueprintTemplateDB.saveTemplate(JSON.parse(serialized))
      } catch (error) {
        console.error('[Blueprint3DAppBase] Failed to persist draft layout:', error)
      }
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [layoutEpoch])

  // Best-effort flush on tab close / reload.
  useEffect(() => {
    const flushDraft = async () => {
      if (!draftPersistenceReadyRef.current) return
      try {
        const serialized = blueprint3dRef.current?.model.exportSerialized()
        if (!serialized) return
        const { blueprintTemplateDB } = await import('@blueprint3d/indexdb/blueprint-template')
        await blueprintTemplateDB.saveTemplate(JSON.parse(serialized))
      } catch {
        // Ignore unload-time persistence failures.
      }
    }

    const handleBeforeUnload = () => {
      void flushDraft()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  const loadPricing = useCallback(async () => {
    try {
      const res = await fetch('/api/pricing')
      const j = await res.json()
      setPricingPayload({
        itemPrices: j.itemPrices ?? buildDefaultItemUnitPrices(),
        userItemOverrides: j.userItemOverrides ?? {},
        texturePricesPerSqM: j.texturePricesPerSqM ?? buildDefaultTexturePricesPerSqM(),
        settings: {
          labor_pct: Number(j.settings?.labor_pct ?? defaultEstimateSettings.labor_pct),
          delivery_pct: Number(j.settings?.delivery_pct ?? defaultEstimateSettings.delivery_pct),
          contingency_pct: Number(j.settings?.contingency_pct ?? defaultEstimateSettings.contingency_pct),
          currency: j.settings?.currency ?? defaultEstimateSettings.currency
        }
      })
    } catch {
      toast.error(tEstimate('loadPricingError'))
      setPricingPayload({
        itemPrices: buildDefaultItemUnitPrices(),
        userItemOverrides: {},
        texturePricesPerSqM: buildDefaultTexturePricesPerSqM(),
        settings: { ...defaultEstimateSettings }
      })
    }
  }, [tEstimate])

  const loadUserItems = useCallback(async () => {
    try {
      const items = await listUserItems()
      setUserItems(items)
    } catch {
      setUserItems([])
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (cancelled) return
      await loadPricing()
    })()
    return () => {
      cancelled = true
    }
  }, [loadPricing])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (cancelled) return
      await loadUserItems()
    })()
    return () => {
      cancelled = true
    }
  }, [loadUserItems])

  useEffect(() => {
    setRoomTypes(loadRoomTypes())
  }, [])

  const mergedCatalogItems = useMemo(() => buildCatalogItems(userItems), [userItems])
  const customItemLabelMap = useMemo(() => {
    const out: Record<string, string> = {}
    for (const item of userItems) {
      out[item.itemKey] = item.name
    }
    return out
  }, [userItems])
  const modelUrlToItemKeyMap = useMemo(() => {
    const out = buildModelUrlToItemKey()
    for (const item of userItems) {
      out[item.modelUrl] = item.itemKey
    }
    return out
  }, [userItems])

  useEffect(() => {
    if (!pricingPayload || !blueprint3dRef.current) return
    const json = blueprint3dRef.current.model.exportSerialized()
    setCostEstimate(
      computeLayoutCostEstimate({
        layout_json: json,
        item_unit_prices: pricingPayload.itemPrices,
        model_url_to_item_key: modelUrlToItemKeyMap,
        texture_price_per_sq_m_by_url: pricingPayload.texturePricesPerSqM,
        wall_height_cm: Configuration.getNumericValue(configWallHeight),
        settings: {
          labor_pct: pricingPayload.settings.labor_pct,
          delivery_pct: pricingPayload.settings.delivery_pct,
          contingency_pct: pricingPayload.settings.contingency_pct,
          currency: pricingPayload.settings.currency
        }
      })
    )
  }, [layoutEpoch, modelUrlToItemKeyMap, pricingPayload])

  useEffect(() => {
    if (!blueprint3dRef.current) return
    if (restoringHistoryRef.current) return
    const serialized = blueprint3dRef.current.model.exportSerialized()
    pushHistorySnapshot(serialized)
  }, [layoutEpoch, pushHistorySnapshot])

  // Update wheel zoom setting when it changes
  useEffect(() => {
    if (blueprint3dRef.current) {
      blueprint3dRef.current.three.controls.enableWheelZoom = getWheelZoomEnabled()
    }
  }, [getWheelZoomEnabled])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (blueprint3dRef.current && activeTab === 'edit') {
        if (viewMode === '3d') {
          blueprint3dRef.current.three.updateWindowSize()
        } else {
          blueprint3dRef.current.floorplanner?.resizeView()
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [activeTab, viewMode])

  const clampItemCostPosition = useCallback((x: number, y: number) => {
    const panelEl = itemCostPanelRef.current
    const panelWidth = panelEl?.offsetWidth ?? (itemCostMinimized ? 220 : 320)
    const panelHeight = panelEl?.offsetHeight ?? 120
    const minX = 0
    const minY = 56
    const maxX = Math.max(minX, window.innerWidth - panelWidth)
    const maxY = Math.max(minY, window.innerHeight - panelHeight)
    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY)
    }
  }, [itemCostMinimized])

  useEffect(() => {
    const next = clampItemCostPosition(itemCostPosition.x, itemCostPosition.y)
    if (next.x !== itemCostPosition.x || next.y !== itemCostPosition.y) {
      setItemCostPosition(next)
    }
  }, [itemCostPosition.x, itemCostPosition.y, itemCostMinimized, clampItemCostPosition])

  useEffect(() => {
    const onResize = () => {
      setItemCostPosition((prev) => clampItemCostPosition(prev.x, prev.y))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [clampItemCostPosition])

  const handleItemCostPanelDragStart = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!itemCostPanelRef.current) return
      const rect = itemCostPanelRef.current.getBoundingClientRect()
      itemCostDragRef.current = {
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top
      }

      const handleMove = (moveEvent: MouseEvent) => {
        const drag = itemCostDragRef.current
        if (!drag) return
        const next = clampItemCostPosition(moveEvent.clientX - drag.offsetX, moveEvent.clientY - drag.offsetY)
        setItemCostPosition(next)
      }

      const handleUp = () => {
        itemCostDragRef.current = null
        window.removeEventListener('mousemove', handleMove)
        window.removeEventListener('mouseup', handleUp)
      }

      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleUp)
    },
    [clampItemCostPosition]
  )

  const handleSummaryItemClick = useCallback((itemKey: string) => {
    const blueprint3d = blueprint3dRef.current
    if (!blueprint3d) return

    const sceneItems = blueprint3d.model.scene.getItems()
    const matches = sceneItems.filter((item) => {
      const metadataKey = item.metadata?.itemKey
      if (metadataKey === itemKey) return true
      const metadataModelUrl = item.metadata?.modelUrl
      return typeof metadataModelUrl === 'string' && modelUrlToItemKeyMap[metadataModelUrl] === itemKey
    })

    if (matches.length === 0) return

    const currentIndex = summarySelectionCursorRef.current[itemKey] ?? -1
    const nextIndex = (currentIndex + 1) % matches.length
    summarySelectionCursorRef.current[itemKey] = nextIndex
    const nextItem = matches[nextIndex]

    blueprint3d.three.getController().setSelectedObject(nextItem)
    setSelectedItem(nextItem)
    setTextureType(null)
    setCurrentTarget(null)
    setActiveTab('edit')
    setViewMode('3d')
    blueprint3d.three.needsUpdate()
  }, [modelUrlToItemKeyMap])

  // Handle resize with ResizeObserver for accurate sizing
  useEffect(() => {
    if (!contentRef.current || !blueprint3dRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      if (!blueprint3dRef.current || activeTab !== 'edit') return
      if (viewMode === '3d') {
        blueprint3dRef.current.three.updateWindowSize()
      } else {
        blueprint3dRef.current.floorplanner?.resizeView()
      }
    })

    resizeObserver.observe(contentRef.current)
    return () => resizeObserver.disconnect()
  }, [activeTab, viewMode])

  const handleViewChange = useCallback(
    (mode: '2d' | '3d') => {
      if (!blueprint3dRef.current) return
      blueprint3dRef.current.three.setViewMode(mode)
      setViewMode(mode)
      onViewModeChange?.(mode)

      if (mode === '2d') {
        setTimeout(() => {
          if (blueprint3dRef.current) {
            blueprint3dRef.current.floorplanner?.reset()
            blueprint3dRef.current.floorplanner?.resetOrigin()
          }
        }, 50)
      } else {
        setTimeout(() => {
          if (blueprint3dRef.current) {
            blueprint3dRef.current.model.floorplan.update()
            blueprint3dRef.current.three.updateWindowSize()
          }
        }, 50)
      }
    },
    [onViewModeChange]
  )

  const handleDeleteItem = useCallback(() => {
    if (selectedItem) {
      selectedItem.removeFromScene()
      setSelectedItem(null)
    }
  }, [selectedItem])

  const handleResizeItem = useCallback(
    (height: number, width: number, depth: number) => {
      if (selectedItem) selectedItem.resize(height, width, depth)
    },
    [selectedItem]
  )

  const handleFixedChange = useCallback(
    (fixed: boolean) => {
      if (selectedItem) selectedItem.setFixed(fixed)
    },
    [selectedItem]
  )

  // Generate top-down thumbnail
  const generateTopDownThumbnail = useCallback((): string => {
    if (!blueprint3dRef.current) return ''

    const three = blueprint3dRef.current.three
    const camera = three.camera
    const controls = three.controls
    const renderer = three.renderer

    const savedPosition = camera.position.clone()
    const savedTarget = controls.target.clone()
    const savedRotation = camera.rotation.clone()
    const savedAspect = camera.aspect

    const currentCanvas = renderer.domElement
    const savedWidth = currentCanvas.width
    const savedHeight = currentCanvas.height

    const targetWidth = 1800
    const targetHeight = 1200

    try {
      renderer.setSize(targetWidth, targetHeight, false)
      camera.aspect = targetWidth / targetHeight
      camera.updateProjectionMatrix()

      const center = blueprint3dRef.current.model.floorplan.getCenter()
      const size = blueprint3dRef.current.model.floorplan.getSize()

      const targetAspect = 3 / 2
      const roomAspect = size.x / size.z
      const margin = 1.4

      let viewWidth: number, viewHeight: number
      if (roomAspect > targetAspect) {
        viewWidth = size.x * margin
        viewHeight = viewWidth / targetAspect
      } else {
        viewHeight = size.z * margin
        viewWidth = viewHeight * targetAspect
      }

      const fov = camera.fov * (Math.PI / 180)
      const distance = Math.max(viewWidth, viewHeight) / (2 * Math.tan(fov / 2))

      controls.target.set(center.x, 0, center.z)
      camera.position.set(center.x, distance, center.z)
      camera.lookAt(controls.target)
      camera.updateProjectionMatrix()
      controls.update()

      renderer.clear()
      renderer.render(three.scene.getScene(), camera)

      return currentCanvas.toDataURL('image/webp', 0.85)
    } finally {
      renderer.setSize(savedWidth, savedHeight, false)
      camera.aspect = savedAspect
      camera.position.copy(savedPosition)
      controls.target.copy(savedTarget)
      camera.rotation.copy(savedRotation)
      camera.updateProjectionMatrix()
      controls.update()

      renderer.clear()
      renderer.render(three.scene.getScene(), camera)
    }
  }, [])

  // Save: update existing or show dialog
  const handleSave = useCallback(async () => {
    if (currentBlueprint) {
      if (!blueprint3dRef.current) return
      const toastId = toast.loading(t('saving') || 'Saving floorplan...')
      try {
        const data = blueprint3dRef.current.model.exportSerialized()
        const thumbnail = generateTopDownThumbnail()
        const layoutData = JSON.parse(data)
        await blueprintUpdate(currentBlueprint.id, {
          name: currentBlueprint.name,
          layoutData,
          thumbnailBase64: thumbnail,
          roomType: currentBlueprint.roomType
        })
        toast.success(t('saveSuccess'), { id: toastId })
      } catch (error) {
        console.error('Failed to update floorplan:', error)
        toast.error(t('saveError'), { id: toastId })
      }
    } else {
      setSaveDialogOpen(true)
    }
  }, [currentBlueprint, generateTopDownThumbnail, t])

  const handleNew = useCallback(() => {
    setSaveDialogOpen(true)
  }, [])

  // Create new blueprint via dialog
  const handleSaveFloorplan = useCallback(
    async (name: string, roomType: string) => {
      if (!blueprint3dRef.current) return
      const toastId = toast.loading(t('saving') || 'Saving floorplan...')
      try {
        const data = blueprint3dRef.current.model.exportSerialized()
        const thumbnail = generateTopDownThumbnail()
        const layoutData = JSON.parse(data)
        const result = await blueprintCreate({
          name,
          layoutData,
          thumbnailBase64: thumbnail,
          roomType
        })
        setCurrentBlueprint({ id: result.id, name, roomType })
        toast.success(t('saveSuccess'), { id: toastId })
      } catch (error) {
        console.error('Failed to save floorplan:', error)
        toast.error(t('saveError'), { id: toastId })
      }
    },
    [generateTopDownThumbnail, t]
  )

  // Load from saved floorplan
  const handleLoadFloorplan = useCallback(
    (data: string, loadedMode?: string, blueprintId?: string, blueprintName?: string) => {
      if (!blueprint3dRef.current) return
      blueprint3dRef.current.model.loadSerialized(data)
      if (loadedMode && isValidRoomType(loadedMode)) setCurrentMode(loadedMode as Blueprint3DMode)
      if (blueprintId && blueprintName) {
        setCurrentBlueprint({
          id: blueprintId,
          name: blueprintName,
          roomType: loadedMode || RoomType.BEDROOM
        })
      }
      setActiveTab('edit')
      setLayoutEpoch((e) => e + 1)
    },
    []
  )

  const handleUnitChange = useCallback(
    (unit: string) => {
      Configuration.setValue(configDimUnit, unit)
      if (blueprint3dRef.current && activeTab === 'edit' && viewMode === '2d') {
        blueprint3dRef.current.floorplanner?.reset()
      }
    },
    [activeTab, viewMode]
  )

  const handleTabChange = useCallback(
    (tab: 'projects' | 'edit' | 'items') => {
      setActiveTab(tab)
      setTextureType(null)

      if (blueprint3dRef.current && tab === 'edit') {
        blueprint3dRef.current.three.stopSpin()
        blueprint3dRef.current.three.getController().setSelectedObject(null)

        if (viewMode === '2d') {
          const canvas = floorplannerCanvasRef.current
          if (canvas) {
            const resizeObserver = new ResizeObserver(() => {
              if (blueprint3dRef.current && canvas.clientWidth > 0) {
                blueprint3dRef.current.floorplanner?.reset()
                blueprint3dRef.current.floorplanner?.resetOrigin()
                resizeObserver.disconnect()
              }
            })
            resizeObserver.observe(canvas)
          }
        } else {
          blueprint3dRef.current.model.floorplan.update()
          setTimeout(() => {
            if (blueprint3dRef.current) {
              blueprint3dRef.current.three.updateWindowSize()
            }
          }, 100)
        }
      }
    },
    [viewMode]
  )

  const handleFloorplannerModeChange = useCallback((mode: 'move' | 'draw' | 'delete') => {
    setFloorplannerMode(mode)
    if (!blueprint3dRef.current) return
    const modeMap = {
      move: floorplannerModes.MOVE,
      draw: floorplannerModes.DRAW,
      delete: floorplannerModes.DELETE
    }
    blueprint3dRef.current.floorplanner?.setMode(modeMap[mode])
  }, [])

  const handleFloorplannerDone = useCallback(() => {
    setViewMode('3d')
    if (blueprint3dRef.current) {
      blueprint3dRef.current.model.floorplan.update()
    }
  }, [])

  const handleWallLengthApply = useCallback((wall: Wall, lengthCm: number) => {
    const fp = blueprint3dRef.current?.model.floorplan
    if (fp) {
      fp.setWallLengthCm(wall, lengthCm)
      setLayoutEpoch((e) => e + 1)
    }
  }, [])

  const handleItemSelect = useCallback(
    (item: {
      name: string
      key: string
      model: string
      type: string
      description?: string
    }) => {
      if (!blueprint3dRef.current) return
      const translatedName = customItemLabelMap[item.key] ?? tItems(item.key)
      const toastId = toast.loading(tItems('loadingItem', { name: translatedName }))
      loadingToastsRef.current.push({ toastId, itemName: translatedName })

      const metadata = {
        itemName: item.name,
        itemKey: item.key,
        resizable: true,
        modelUrl: item.model,
        itemType: parseInt(item.type),
        description: item.description
      }

      blueprint3dRef.current.model.scene.addItem(parseInt(item.type), item.model, metadata)
      setActiveTab('edit')
      setViewMode('3d')
    },
    [customItemLabelMap, tItems]
  )

  const handleTextureSelect = useCallback(
    (textureUrl: string, stretch: boolean, scale: number) => {
      if (currentTarget) {
        currentTarget.setTexture(textureUrl, stretch, scale)
        setLayoutEpoch((e) => e + 1)
      }
    },
    [currentTarget]
  )

  const itemSummaryRows = useMemo(() => {
    if (!blueprint3dRef.current || !pricingPayload) return []
    const exported = JSON.parse(blueprint3dRef.current.model.exportSerialized())
    const modelMap = modelUrlToItemKeyMap
    const lines = new Map<
      string,
      { itemKey: string; label: string; quantity: number; unitPrice: number; lineTotal: number }
    >()
    for (const item of exported?.items ?? []) {
      const itemKey = item.item_key || modelMap[item.model_url]
      if (!itemKey) continue
      const unitPrice = Number(pricingPayload.itemPrices[itemKey] ?? 0)
      const label = customItemLabelMap[itemKey] ?? tItems(itemKey)
      const current = lines.get(itemKey)
      if (current) {
        current.quantity += 1
        current.lineTotal = current.quantity * unitPrice
      } else {
        lines.set(itemKey, {
          itemKey,
          label,
          quantity: 1,
          unitPrice,
          lineTotal: unitPrice
        })
      }
    }
    return Array.from(lines.values()).sort((a, b) => a.label.localeCompare(b.label))
  }, [customItemLabelMap, layoutEpoch, modelUrlToItemKeyMap, pricingPayload, tItems])

  useEffect(() => {
    if (!blueprint3dRef.current) return
    blueprint3dRef.current.three.setCeilingVisible(ceilingVisible)
    if (!ceilingVisible) {
      const selected = blueprint3dRef.current.three.getController().getSelectedObject()
      if ((selected as any)?.metadata?.itemType === 11) {
        blueprint3dRef.current.three.getController().setSelectedObject(null)
      }
    }
  }, [ceilingVisible])

  return (
    <div className="relative h-full w-full">
      {/* Top Navigation Bar */}
      {!isFullscreen && (
        <div className="absolute top-0 left-0 right-0 z-50">
          <TopNavBar
            activeTab={activeTab}
            estimateOpen={estimateOpen}
            onTabChange={handleTabChange}
            onEstimateClick={() => setEstimateOpen(true)}
            viewMode={viewMode}
            onViewModeChange={handleViewChange}
            onSettingsClick={() => setSettingsOpen(true)}
            onSave={handleSave}
            onNew={handleNew}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            ceilingVisible={ceilingVisible}
            onCeilingVisibleChange={setCeilingVisible}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div ref={contentRef} className="h-full w-full relative overflow-hidden">
        <TouchHelp />

        {/* Projects View */}
        <div
          className="absolute inset-0"
          style={{ display: activeTab === 'projects' ? 'block' : 'none' }}
        >
          {activeTab === 'projects' && (
            <ProjectsView
              onBlueprintLoad={(layoutData, roomType, id, name) => {
                handleLoadFloorplan(layoutData, roomType, id, name)
                setActiveTab('edit')
                setViewMode('3d')
              }}
            />
          )}
        </div>

        {/* Edit View */}
        <div
          className="absolute inset-0"
          style={{ display: activeTab === 'edit' || activeTab === 'items' ? 'block' : 'none' }}
        >
          {/* 3D Viewer */}
          <div
            id="viewer"
            ref={viewerRef}
            className="absolute inset-0"
            style={{ display: viewMode === '3d' ? 'block' : 'none' }}
          >
            {viewMode === '3d' && (
              <>
                {!isFullscreen && <ControlsHelp viewMode="3d" />}
                {renderOverlay && renderOverlay()}

                {itemsLoading > 0 && (
                  <div id="loading-modal">
                    <div className="loading-content">
                      <p>
                        {tMyFloorplans('loading')}
                        <span className="loading-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 2D Floorplanner */}
          <div
            id="floorplanner"
            className="absolute inset-0"
            style={{ display: viewMode === '2d' ? 'block' : 'none' }}
          >
            <canvas id="floorplanner-canvas" ref={floorplannerCanvasRef}></canvas>
            {viewMode === '2d' && !isFullscreen && (
              <>
                <FloorplannerControls
                  mode={floorplannerMode}
                  wallLengthLocked={wallLengthLocked}
                  onModeChange={handleFloorplannerModeChange}
                  onWallLengthLockedChange={setWallLengthLocked}
                  onDone={handleFloorplannerDone}
                />
                {floorplannerMode === 'draw' && (
                  <div className="absolute left-5 bottom-5 bg-black/50 text-primary-foreground px-2.5 py-1.5 rounded text-sm">
                    {tFloorplanner('escHint')}
                  </div>
                )}
                <ControlsHelp viewMode="2d" />
              </>
            )}
          </div>

          {/* Context Menu */}
          {!isFullscreen &&
            !settingsOpen &&
            !estimateOpen &&
            activeTab !== 'items' &&
            viewMode === '3d' &&
            itemSummaryRows.length > 0 && (
            <div
              ref={itemCostPanelRef}
              className="absolute z-60 w-[320px] max-w-[calc(100vw-1rem)]"
              style={{
                left: `${itemCostPosition.x}px`,
                top: `${itemCostPosition.y}px`,
                width: itemCostMinimized ? '220px' : '320px'
              }}
            >
              <ItemPriceSummaryPanel
                rows={itemSummaryRows}
                currency={pricingPayload?.settings.currency ?? defaultEstimateSettings.currency}
                minimized={itemCostMinimized}
                onToggleMinimize={() => setItemCostMinimized((prev) => !prev)}
                onDragStart={handleItemCostPanelDragStart}
                onItemClick={handleSummaryItemClick}
              />
            </div>
          )}

          {/* Context Menu */}
          {selectedItem && !textureType && !isFullscreen && !settingsOpen && !estimateOpen && (
            <div className="absolute right-2 md:right-4 top-16 md:top-20 z-70">
              <ContextMenu
                selectedItem={selectedItem}
                onDelete={handleDeleteItem}
                onResize={handleResizeItem}
                onFixedChange={handleFixedChange}
              />
            </div>
          )}

          {/* Texture Selector */}
          {textureType && !isFullscreen && viewMode === '3d' && (
            <div className="absolute right-2 md:right-4 top-16 md:top-20 z-70 max-h-[calc(100vh-100px)] md:max-h-[calc(100vh-120px)] overflow-y-auto">
              <TextureSelector type={textureType} onTextureSelect={handleTextureSelect} />
            </div>
          )}

          {/* Bed Size Input for generator mode */}
          {mode === 'generator' && !selectedItem && !textureType && onBedSizeChange && !isFullscreen && (
            <div className="absolute right-2 md:right-4 top-16 md:top-20 z-70">
              <BedSizeInput onSizeChange={onBedSizeChange} />
            </div>
          )}
        </div>
      </div>

      {/* Current Blueprint Name indicator */}
      {currentBlueprint &&
        !isFullscreen &&
        activeTab !== 'projects' && (
        <div className="absolute bottom-3 left-3 z-40 pointer-events-none">
          <span className="text-xs text-muted-foreground/60 bg-background/30 backdrop-blur-sm px-2 py-1 rounded">
            {currentBlueprint.name}
          </span>
        </div>
      )}

      {/* Items Drawer */}
      <ItemsDrawer
        isOpen={activeTab === 'items'}
        onClose={() => setActiveTab('edit')}
        onItemSelect={handleItemSelect}
        itemPrices={pricingPayload?.itemPrices}
        currency={pricingPayload?.settings.currency}
        items={mergedCatalogItems}
        onCustomItemCreated={(item) => {
          setUserItems((prev) => [item, ...prev])
          void loadPricing()
        }}
      />

      <EstimateDialog
        isOpen={estimateOpen}
        onOpenChange={setEstimateOpen}
        result={costEstimate}
        markupSettings={
          pricingPayload
            ? {
                labor_pct: pricingPayload.settings.labor_pct,
                delivery_pct: pricingPayload.settings.delivery_pct,
                contingency_pct: pricingPayload.settings.contingency_pct
              }
            : undefined
        }
        blueprintId={currentBlueprint?.id ?? null}
      />

      <WallLengthDialog
        wall={wallLengthTarget}
        open={wallLengthDialogOpen}
        onOpenChange={(open) => {
          setWallLengthDialogOpen(open)
          if (!open) setWallLengthTarget(null)
        }}
        onApply={handleWallLengthApply}
      />

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={settingsOpen}
        onOpenChange={setSettingsOpen}
        onUnitChange={handleUnitChange}
        isLanguageOption={isLanguageOption}
        itemPrices={pricingPayload?.itemPrices}
        userItemOverrides={pricingPayload?.userItemOverrides}
        currency={pricingPayload?.settings.currency}
        catalogItems={mergedCatalogItems}
        onPricingChanged={loadPricing}
        onRoomTypesChanged={setRoomTypes}
      />

      {/* Save Floorplan Dialog */}
      <SaveFloorplanDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveFloorplan}
        defaultName={`Floorplan ${new Date().toLocaleDateString()}`}
        defaultRoomType={
          currentBlueprint?.roomType ||
          (Object.values(RoomType).includes(currentMode as RoomType)
            ? (currentMode as RoomType)
            : RoomType.BEDROOM)
        }
        roomTypes={roomTypes}
      />
    </div>
  )
}
