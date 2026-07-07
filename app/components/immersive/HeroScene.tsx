'use client'

import { useEffect, useMemo, useRef, type ComponentRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import type { ScrollStoryStore } from './scroll-story'
import type { ImmersivePalette } from './immersive-theme'

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/**
 * A single, continuous stroke on the XZ plane that traces a rough room outline
 * plus one internal partition — as if someone just began sketching a floor plan.
 * Kept as one polyline so the dash "draw-on" reveal reads as a single gesture.
 */
const SKETCH_2D: [number, number][] = [
  [-3.4, -2.2],
  [3.4, -2.2],
  [3.4, 2.2],
  [-3.4, 2.2],
  [-3.4, -2.2],
  [0, -2.2],
  [0, 0.6]
]
const SKETCH_Y = 0.02

const PARTICLE_COUNT = 170

export function HeroScene({ store, palette }: { store: ScrollStoryStore; palette: ImmersivePalette }) {
  const groupRef = useRef<THREE.Group>(null)
  const minorMatRef = useRef<THREE.LineBasicMaterial>(null)
  const majorMatRef = useRef<THREE.LineBasicMaterial>(null)
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const lineRef = useRef<ComponentRef<typeof Line>>(null)
  const tipRef = useRef<THREE.Mesh>(null)
  const pointsRef = useRef<THREE.Points>(null)

  const mountTime = useRef<number>(0)
  const scratch = useMemo(() => new THREE.Vector3(), [])

  // --- Grid geometry (graph paper): thin minor lines + brighter major lines. ---
  const { minorGeometry, majorGeometry } = useMemo(() => {
    const size = 26
    const divisions = 52
    const half = size / 2
    const step = size / divisions
    const minor: number[] = []
    const major: number[] = []

    for (let i = 0; i <= divisions; i++) {
      const p = -half + i * step
      const target = i % 4 === 0 ? major : minor
      // Line parallel to the X axis (constant z).
      target.push(-half, 0, p, half, 0, p)
      // Line parallel to the Z axis (constant x).
      target.push(p, 0, -half, p, 0, half)
    }

    const minorGeometry = new THREE.BufferGeometry()
    minorGeometry.setAttribute('position', new THREE.Float32BufferAttribute(minor, 3))
    const majorGeometry = new THREE.BufferGeometry()
    majorGeometry.setAttribute('position', new THREE.Float32BufferAttribute(major, 3))
    return { minorGeometry, majorGeometry }
  }, [])

  // --- Sketch polyline + cumulative arc-length lookup for the moving pen tip. ---
  const sketch = useMemo(() => {
    const points = SKETCH_2D.map(([x, z]) => new THREE.Vector3(x, SKETCH_Y, z))
    const cumulative = [0]
    let total = 0
    for (let i = 1; i < points.length; i++) {
      total += points[i].distanceTo(points[i - 1])
      cumulative.push(total)
    }
    return { points, cumulative, total }
  }, [])

  // --- Soft radial "pool of light" texture, faked to sell the lit-from-above look. ---
  const glowTexture = useMemo(() => {
    if (typeof document === 'undefined') return null
    const s = 256
    const canvas = document.createElement('canvas')
    canvas.width = s
    canvas.height = s
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const gradient = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
    gradient.addColorStop(0, 'rgba(184, 147, 95, 0.55)')
    gradient.addColorStop(0.45, 'rgba(124, 134, 84, 0.22)')
    gradient.addColorStop(1, 'rgba(217, 208, 190, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, s, s)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])

  // --- Dust motes floating above the grid. ---
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16
      positions[i * 3 + 1] = Math.random() * 5 + 0.2
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12
    }
    return positions
  }, [])

  // The sketch stroke should always sit crisply on top of the grid.
  useEffect(() => {
    const material = lineRef.current?.material
    if (material) {
      material.depthTest = false
      material.depthWrite = false
      material.transparent = true
    }
  }, [])

  useEffect(() => {
    mountTime.current = performance.now()
  }, [])

  useEffect(() => {
    return () => {
      minorGeometry.dispose()
      majorGeometry.dispose()
      glowTexture?.dispose()
    }
  }, [minorGeometry, majorGeometry, glowTexture])

  const pointAtLength = (length: number, out: THREE.Vector3) => {
    const { points, cumulative, total } = sketch
    const target = Math.min(Math.max(length, 0), total)
    for (let i = 1; i < points.length; i++) {
      if (target <= cumulative[i]) {
        const segLength = cumulative[i] - cumulative[i - 1]
        const t = segLength > 0 ? (target - cumulative[i - 1]) / segLength : 0
        return out.lerpVectors(points[i - 1], points[i], t)
      }
    }
    return out.copy(points[points.length - 1])
  }

  useFrame(() => {
    const elapsed = (performance.now() - mountTime.current) / 1000

    // Mount fade-in + scroll-driven fade-out ("only visible while active").
    const fadeIn = smoothstep(0, 0.8, elapsed)
    const progress = store.getSection('hero')
    const floorplan = store.getSection('floorplan')
    const heroFade = 1 - smoothstep(0.75, 1, progress)
    const handoffFade = 1 - smoothstep(0, 0.06, floorplan)
    const fadeOut = Math.min(heroFade, handoffFade)
    const visibility = fadeIn * fadeOut

    const group = groupRef.current
    if (group) group.visible = visibility > 0.001
    if (visibility <= 0.001) return

    if (minorMatRef.current) minorMatRef.current.opacity = 0.4 * visibility
    if (majorMatRef.current) majorMatRef.current.opacity = 0.85 * visibility
    if (glowMatRef.current) glowMatRef.current.opacity = 0.85 * visibility

    // Self-drawing stroke via animated dashOffset (offset: total → 0 reveals it).
    const drawProgress = smoothstep(0, 1, (elapsed - 0.35) / 2.3)
    const line = lineRef.current
    if (line) {
      const material = line.material
      material.opacity = visibility
      material.dashOffset = sketch.total * (1 - drawProgress)
    }

    // Pen tip that rides the front of the stroke while it draws.
    const tip = tipRef.current
    if (tip) {
      pointAtLength(drawProgress * sketch.total, scratch)
      tip.position.copy(scratch)
      const tipMaterial = tip.material as THREE.MeshBasicMaterial
      const drawing = drawProgress > 0.001 && drawProgress < 0.999 ? 1 : 0
      tipMaterial.opacity = visibility * drawing
    }

    // Drifting dust.
    const points = pointsRef.current
    if (points) {
      const array = points.geometry.attributes.position.array as Float32Array
      const now = performance.now() * 0.0002
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const yi = i * 3 + 1
        array[yi] += 0.012
        if (array[yi] > 5.4) array[yi] = 0.2
        array[i * 3] += Math.sin(now + i) * 0.0016
      }
      points.geometry.attributes.position.needsUpdate = true
      const material = points.material as THREE.PointsMaterial
      material.opacity = 0.22 * visibility
    }
  })

  return (
    <group ref={groupRef} visible={false}>
      {/* Pool of light on the grid. */}
      {glowTexture && (
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]}>
          <planeGeometry args={[18, 13]} />
          <meshBasicMaterial
            ref={glowMatRef}
            map={glowTexture}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Graph-paper grid. */}
      <lineSegments geometry={minorGeometry}>
        <lineBasicMaterial ref={minorMatRef} color={palette.gridMinor} transparent opacity={0} />
      </lineSegments>
      <lineSegments geometry={majorGeometry}>
        <lineBasicMaterial ref={majorMatRef} color={palette.gridMajor} transparent opacity={0} />
      </lineSegments>

      {/* Self-drawing floor-plan stroke. */}
      <Line
        ref={lineRef}
        points={sketch.points}
        color="#B8935F"
        lineWidth={2.4}
        dashed
        dashScale={1}
        dashSize={sketch.total}
        gapSize={sketch.total}
        dashOffset={sketch.total}
        transparent
        opacity={0}
        toneMapped={false}
      />

      {/* Pen tip. */}
      <mesh ref={tipRef}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshBasicMaterial color="#DCD6C9" transparent opacity={0} toneMapped={false} />
      </mesh>

      {/* Dust motes. */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color="#A67C52"
          transparent
          opacity={0}
          depthWrite={false}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
