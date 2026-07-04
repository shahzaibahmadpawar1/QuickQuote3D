'use client'

import { useEffect, useMemo, useRef, type ComponentRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import { Sparkles } from 'lucide-react'
import type { ScrollStoryStore } from './scroll-story'
import type { ImmersivePalette } from './immersive-theme'

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

const WALL_Y = 0.02
const LABEL_Y = 0.06

// Plan half-extents (world units).
const W = 3 // half width  → total 6
const D = 2.3 // half depth → total 4.6

type LineRef = ComponentRef<typeof Line>

function polylineLength(points: [number, number, number][]) {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    total += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
  }
  return total
}

export function FloorplanScene({ store, palette }: { store: ScrollStoryStore; palette: ImmersivePalette }) {
  const groupRef = useRef<THREE.Group>(null)
  const minorMatRef = useRef<THREE.LineBasicMaterial>(null)
  const majorMatRef = useRef<THREE.LineBasicMaterial>(null)

  const outerRef = useRef<LineRef>(null)
  const interiorVRef = useRef<LineRef>(null)
  const interiorHRef = useRef<LineRef>(null)
  const dimWidthRef = useRef<LineRef>(null)
  const dimDepthRef = useRef<LineRef>(null)

  const livingRef = useRef<HTMLDivElement>(null)
  const kitchenRef = useRef<HTMLDivElement>(null)
  const bedroomRef = useRef<HTMLDivElement>(null)
  const measureWidthRef = useRef<HTMLDivElement>(null)
  const measureDepthRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)

  // ----- Grid (fades out as the plan draws in) -----
  const { minorGeometry, majorGeometry } = useMemo(() => {
    const size = 22
    const divisions = 44
    const half = size / 2
    const step = size / divisions
    const minor: number[] = []
    const major: number[] = []
    for (let i = 0; i <= divisions; i++) {
      const p = -half + i * step
      const target = i % 4 === 0 ? major : minor
      target.push(-half, 0, p, half, 0, p)
      target.push(p, 0, -half, p, 0, half)
    }
    const minorGeometry = new THREE.BufferGeometry()
    minorGeometry.setAttribute('position', new THREE.Float32BufferAttribute(minor, 3))
    const majorGeometry = new THREE.BufferGeometry()
    majorGeometry.setAttribute('position', new THREE.Float32BufferAttribute(major, 3))
    return { minorGeometry, majorGeometry }
  }, [])

  // ----- Wall + dimension geometry -----
  const geom = useMemo(() => {
    const outer: [number, number, number][] = [
      [-W, WALL_Y, -D],
      [W, WALL_Y, -D],
      [W, WALL_Y, D],
      [-W, WALL_Y, D],
      [-W, WALL_Y, -D]
    ]
    // Interior partition: a vertical wall at x=1 and a horizontal wall at z=0
    // splitting the right side into two rooms.
    const interiorV: [number, number, number][] = [
      [1, WALL_Y, -D],
      [1, WALL_Y, D]
    ]
    const interiorH: [number, number, number][] = [
      [1, WALL_Y, 0],
      [W, WALL_Y, 0]
    ]

    // Dimension lines with end ticks (rendered as segment pairs).
    const zDim = D + 0.6
    const dimWidth: [number, number, number][] = [
      [-W, WALL_Y, zDim],
      [W, WALL_Y, zDim],
      [-W, WALL_Y, zDim - 0.15],
      [-W, WALL_Y, zDim + 0.15],
      [W, WALL_Y, zDim - 0.15],
      [W, WALL_Y, zDim + 0.15]
    ]
    const xDim = W + 0.5
    const dimDepth: [number, number, number][] = [
      [xDim, WALL_Y, -D],
      [xDim, WALL_Y, D],
      [xDim - 0.15, WALL_Y, -D],
      [xDim + 0.15, WALL_Y, -D],
      [xDim - 0.15, WALL_Y, D],
      [xDim + 0.15, WALL_Y, D]
    ]

    return {
      outer,
      interiorV,
      interiorH,
      dimWidth,
      dimDepth,
      outerLen: polylineLength(outer),
      interiorVLen: polylineLength(interiorV),
      interiorHLen: polylineLength(interiorH)
    }
  }, [])

  useEffect(() => {
    // Walls should always sit crisply on top of the grid.
    for (const ref of [outerRef, interiorVRef, interiorHRef]) {
      const material = ref.current?.material
      if (material) {
        material.depthTest = false
        material.depthWrite = false
        material.transparent = true
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      minorGeometry.dispose()
      majorGeometry.dispose()
    }
  }, [minorGeometry, majorGeometry])

  const setHtml = (
    ref: React.RefObject<HTMLDivElement | null>,
    opacity: number,
    scale = 1
  ) => {
    const el = ref.current
    if (!el) return
    el.style.opacity = String(opacity)
    el.style.transform = `scale(${scale})`
    el.style.display = opacity < 0.01 ? 'none' : 'block'
  }

  useFrame(() => {
    const p = store.getSection('floorplan')

    const fadeIn = smoothstep(0, 0.06, p)
    const fadeOut = 1 - smoothstep(0.97, 1, p)
    const vis = fadeIn * fadeOut

    const group = groupRef.current
    if (group) group.visible = vis > 0.001
    if (vis <= 0.001) {
      setHtml(livingRef, 0)
      setHtml(kitchenRef, 0)
      setHtml(bedroomRef, 0)
      setHtml(measureWidthRef, 0)
      setHtml(measureDepthRef, 0)
      setHtml(badgeRef, 0)
      return
    }

    // Phase drivers.
    const outerDraw = smoothstep(0, 0.3, p)
    const interiorVDraw = smoothstep(0.3, 0.5, p)
    const interiorHDraw = smoothstep(0.46, 0.6, p)
    const labelsFade = smoothstep(0.34, 0.58, p)
    const dimsFade = smoothstep(0.62, 0.9, p)
    const badgePop = smoothstep(0.66, 0.84, p)

    // Grid fades from graph-paper to a faint ghost as the plan resolves.
    const gridFactor = THREE.MathUtils.lerp(1, 0.16, outerDraw)
    if (minorMatRef.current) minorMatRef.current.opacity = 0.36 * gridFactor * vis
    if (majorMatRef.current) majorMatRef.current.opacity = 0.7 * gridFactor * vis

    // Walls draw themselves via animated dash offset.
    if (outerRef.current) {
      const m = outerRef.current.material
      m.opacity = vis
      m.dashOffset = geom.outerLen * (1 - outerDraw)
    }
    if (interiorVRef.current) {
      const m = interiorVRef.current.material
      m.opacity = vis
      m.dashOffset = geom.interiorVLen * (1 - interiorVDraw)
    }
    if (interiorHRef.current) {
      const m = interiorHRef.current.material
      m.opacity = vis
      m.dashOffset = geom.interiorHLen * (1 - interiorHDraw)
    }

    // Dimension lines fade in.
    if (dimWidthRef.current) dimWidthRef.current.material.opacity = 0.6 * dimsFade * vis
    if (dimDepthRef.current) dimDepthRef.current.material.opacity = 0.6 * dimsFade * vis

    // HTML labels.
    setHtml(livingRef, labelsFade * vis)
    setHtml(kitchenRef, labelsFade * vis)
    setHtml(bedroomRef, labelsFade * vis)
    setHtml(measureWidthRef, dimsFade * vis)
    setHtml(measureDepthRef, dimsFade * vis)
    setHtml(badgeRef, badgePop * vis, 0.85 + 0.15 * badgePop)
  })

  return (
    <group ref={groupRef} visible={false}>
      {/* Grid that morphs away as the plan draws. */}
      <lineSegments geometry={minorGeometry}>
        <lineBasicMaterial ref={minorMatRef} color={palette.gridMinor} transparent opacity={0} />
      </lineSegments>
      <lineSegments geometry={majorGeometry}>
        <lineBasicMaterial ref={majorMatRef} color={palette.gridMajor} transparent opacity={0} />
      </lineSegments>

      {/* Outer walls (thick, bold). */}
      <Line
        ref={outerRef}
        points={geom.outer}
        color={palette.wallStrong}
        lineWidth={5}
        dashed
        dashScale={1}
        dashSize={geom.outerLen}
        gapSize={geom.outerLen}
        dashOffset={geom.outerLen}
        transparent
        opacity={0}
        toneMapped={false}
      />

      {/* Interior partitions. */}
      <Line
        ref={interiorVRef}
        points={geom.interiorV}
        color={palette.wallSoft}
        lineWidth={3.5}
        dashed
        dashScale={1}
        dashSize={geom.interiorVLen}
        gapSize={geom.interiorVLen}
        dashOffset={geom.interiorVLen}
        transparent
        opacity={0}
        toneMapped={false}
      />
      <Line
        ref={interiorHRef}
        points={geom.interiorH}
        color={palette.wallSoft}
        lineWidth={3.5}
        dashed
        dashScale={1}
        dashSize={geom.interiorHLen}
        gapSize={geom.interiorHLen}
        dashOffset={geom.interiorHLen}
        transparent
        opacity={0}
        toneMapped={false}
      />

      {/* Dimension lines. */}
      <Line
        ref={dimWidthRef}
        points={geom.dimWidth}
        segments
        color={palette.dimLine}
        lineWidth={1.4}
        transparent
        opacity={0}
        toneMapped={false}
      />
      <Line
        ref={dimDepthRef}
        points={geom.dimDepth}
        segments
        color={palette.dimLine}
        lineWidth={1.4}
        transparent
        opacity={0}
        toneMapped={false}
      />

      {/* Room labels. */}
      <Html position={[-1, LABEL_Y, 0]} center style={{ pointerEvents: 'none' }}>
        <div ref={livingRef} className="fp-room-label" style={{ opacity: 0 }}>
          Living Room
        </div>
      </Html>
      <Html position={[2, LABEL_Y, -1.15]} center style={{ pointerEvents: 'none' }}>
        <div ref={kitchenRef} className="fp-room-label" style={{ opacity: 0 }}>
          Kitchen
        </div>
      </Html>
      <Html position={[2, LABEL_Y, 1.15]} center style={{ pointerEvents: 'none' }}>
        <div ref={bedroomRef} className="fp-room-label" style={{ opacity: 0 }}>
          Bedroom
        </div>
      </Html>

      {/* Measurements. */}
      <Html position={[0, LABEL_Y, D + 1.05]} center style={{ pointerEvents: 'none' }}>
        <div ref={measureWidthRef} className="fp-measure" style={{ opacity: 0 }}>
          6.0 m
        </div>
      </Html>
      <Html position={[W + 0.9, LABEL_Y, 0]} center style={{ pointerEvents: 'none' }}>
        <div ref={measureDepthRef} className="fp-measure" style={{ opacity: 0 }}>
          4.6 m
        </div>
      </Html>

      {/* AI badge. */}
      <Html position={[0, LABEL_Y, -D - 1]} center style={{ pointerEvents: 'none' }}>
        <div ref={badgeRef} className="fp-badge" style={{ opacity: 0 }}>
          <Sparkles className="h-3.5 w-3.5" />
          AI floor plan detected
        </div>
      </Html>
    </group>
  )
}
