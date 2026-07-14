'use client'

import { useEffect, useMemo, useRef, type ComponentRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ContactShadows, Line } from '@react-three/drei'
import * as THREE from 'three'
import type { ScrollStoryStore } from './scroll-story'
import type { ImmersivePalette } from './immersive-theme'
import { liftState } from './lift-state'

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

// Matches the FloorplanScene layout so the flat → 3D hand-off is seamless.
const W = 3
const D = 2.3
const WALL_HEIGHT = 1.35
const WALL_THICKNESS = 0.14

// Wall segments (start → end on the XZ plane).
const WALL_SEGMENTS: { s: [number, number]; e: [number, number] }[] = [
  { s: [-W, -D], e: [W, -D] }, // back
  { s: [W, -D], e: [W, D] }, // right
  { s: [W, D], e: [-W, D] }, // front (faces the camera)
  { s: [-W, D], e: [-W, -D] }, // left
  { s: [1, -D], e: [1, D] }, // interior vertical
  { s: [1, 0], e: [W, 0] } // interior horizontal
]

// Window glass, sitting just proud of the outer wall faces (wall thickness is
// 0.14, so the outer surface is at ±(extent + 0.07)).
const WINDOWS: { pos: [number, number, number]; rotY: number; w: number; h: number }[] = [
  { pos: [-1, 0.72, D + 0.09], rotY: 0, w: 1.2, h: 0.82 }, // front-left
  { pos: [2, 0.72, D + 0.09], rotY: 0, w: 1, h: 0.82 }, // front-right
  { pos: [W + 0.09, 0.72, -1], rotY: Math.PI / 2, w: 1.3, h: 0.82 } // right side
]

export function LiftScene({ store, palette }: { store: ScrollStoryStore; palette: ImmersivePalette }) {
  const groupRef = useRef<THREE.Group>(null)
  const wallRefs = useRef<(THREE.Mesh | null)[]>([])
  const footprintRef = useRef<ComponentRef<typeof Line>>(null)
  const keyLightRef = useRef<THREE.DirectionalLight>(null)
  const contactRef = useRef<THREE.Group>(null)

  // ----- Wall geometries (base pinned to the floor so they grow upward) -----
  const walls = useMemo(() => {
    return WALL_SEGMENTS.map(({ s, e }) => {
      const dx = e[0] - s[0]
      const dz = e[1] - s[1]
      const length = Math.hypot(dx, dz)
      const geometry = new THREE.BoxGeometry(length, WALL_HEIGHT, WALL_THICKNESS)
      geometry.translate(0, WALL_HEIGHT / 2, 0)
      return {
        geometry,
        position: [(s[0] + e[0]) / 2, 0, (s[1] + e[1]) / 2] as [number, number, number],
        rotationY: Math.atan2(-dz, dx)
      }
    })
  }, [])

  const footprint = useMemo(() => {
    const pts: [number, number, number][] = []
    for (const { s, e } of WALL_SEGMENTS) {
      pts.push([s[0], 0.03, s[1]], [e[0], 0.03, e[1]])
    }
    return pts
  }, [])

  // ----- Shared materials (opacity mutated per frame) -----
  const wallMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#dcdde8',
        roughness: 0.88,
        metalness: 0.02
      }),
    []
  )

  // Re-tint the walls when the theme flips (material is memoised, so mutate it).
  useEffect(() => {
    wallMaterial.color.set(palette.liftWall)
  }, [wallMaterial, palette.liftWall])

  const glassMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        emissive: '#3B3C36',
        emissiveIntensity: 1.05,
        roughness: 0.06,
        metalness: 0.5,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        toneMapped: false
      }),
    []
  )

  const floorTexture = useMemo(() => {
    if (typeof document === 'undefined') return null
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    // Warm light-oak planks (light enough to read against the dark stage).
    const plankCount = 7
    const plankH = size / plankCount
    for (let i = 0; i < plankCount; i++) {
      const l = 40 + (i % 2) * 6 + Math.random() * 4
      ctx.fillStyle = `hsl(30, 34%, ${l}%)`
      ctx.fillRect(0, i * plankH, size, plankH)
      // Seam.
      ctx.fillStyle = 'rgba(0,0,0,0.28)'
      ctx.fillRect(0, i * plankH, size, 2)
      // Faint grain.
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'
      for (let g = 0; g < 6; g++) {
        const y = i * plankH + 6 + Math.random() * (plankH - 12)
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(size, y + (Math.random() - 0.5) * 4)
        ctx.stroke()
      }
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(3, 2)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])

  const floorMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#F5F5DC',
        roughness: 0.68,
        metalness: 0.04,
        transparent: true,
        opacity: 0
      }),
    []
  )

  useEffect(() => {
    if (floorTexture) floorMaterial.map = floorTexture
    floorMaterial.needsUpdate = true
  }, [floorTexture, floorMaterial])

  useEffect(() => {
    return () => {
      walls.forEach((w) => w.geometry.dispose())
      wallMaterial.dispose()
      glassMaterial.dispose()
      floorMaterial.dispose()
      floorTexture?.dispose()
    }
  }, [walls, wallMaterial, glassMaterial, floorMaterial, floorTexture])

  useFrame(() => {
    const p = store.getSection('lift')
    // Appear as the Floorplan section finishes so the flat plan stays visible
    // through the hand-off (the fixed camera is already top-down here), then
    // remain for the whole lift. No fade-out — the fully built, lit house is
    // the page's final resting state.
    const fp = store.getSection('floorplan')
    const vis = p > 0.0001 ? 1 : smoothstep(0.9, 0.995, fp)

    const group = groupRef.current
    if (group) group.visible = vis > 0.001
    if (keyLightRef.current) keyLightRef.current.intensity = 2.6 * liftState.light * vis

    // Fade the contact shadow with the light.
    if (contactRef.current) {
      contactRef.current.traverse((child) => {
        const mesh = child as THREE.Mesh
        const material = mesh.material as THREE.Material | undefined
        if (material && 'opacity' in material) {
          ;(material as THREE.Material & { opacity: number }).opacity = 0.45 * liftState.light * vis
        }
      })
    }

    if (vis <= 0.001) return

    // Staggered wall extrusion.
    for (let i = 0; i < wallRefs.current.length; i++) {
      const mesh = wallRefs.current[i]
      if (mesh) mesh.scale.y = Math.max(0.0001, liftState.wall[i])
    }

    // Footprint lines fade out as the floor material takes over.
    if (footprintRef.current) {
      footprintRef.current.material.opacity = 0.5 * vis * (1 - 0.7 * liftState.floor)
    }
    floorMaterial.opacity = liftState.floor * vis
    glassMaterial.opacity = 0.55 * liftState.glass * vis
  })

  return (
    <group ref={groupRef} visible={false}>
      {/* Key light + contact shadows fade in during the final phase. */}
      <directionalLight
        ref={keyLightRef}
        position={[5, 9, 6]}
        intensity={0}
        color="#FFFFFF"
      />
      <ContactShadows
        ref={contactRef}
        position={[0, 0.006, 0]}
        scale={11}
        blur={2.6}
        far={4}
        resolution={512}
        color="#3B3C36"
        opacity={0}
      />

      {/* Textured floor — matches the building footprint (aligned to outer walls). */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} material={floorMaterial}>
        <planeGeometry args={[2 * W + 0.1, 2 * D + 0.1]} />
      </mesh>

      {/* Flat footprint — matches the drawn floor plan so the hand-off from the
          Floorplan section is seamless. Walls then rise out of these lines. */}
      <Line
        ref={footprintRef}
        points={footprint}
        segments
        color={palette.wallStrong}
        lineWidth={3}
        transparent
        opacity={0}
        toneMapped={false}
      />

      {/* Extruding walls. */}
      {walls.map((wall, i) => (
        <mesh
          key={i}
          ref={(el) => {
            wallRefs.current[i] = el
          }}
          geometry={wall.geometry}
          material={wallMaterial}
          position={wall.position}
          rotation-y={wall.rotationY}
          scale-y={0.0001}
        />
      ))}

      {/* Window glass. */}
      {WINDOWS.map((win, i) => (
        <mesh key={i} position={win.pos} rotation-y={win.rotY} material={glassMaterial}>
          <planeGeometry args={[win.w, win.h]} />
        </mesh>
      ))}
    </group>
  )
}
