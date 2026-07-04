'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { ScrollStoryStore } from './scroll-story'
import { furnitureState } from './furniture-state'

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x))
}

type FurnitureType = 'rug' | 'sofa' | 'dining' | 'bed' | 'cabinet'

interface FurnitureItem {
  type: FurnitureType
  /** Floor position (x, z) inside the room. */
  pos: [number, number]
  rotationY: number
  /** Radius of the "placed" confirmation ring. */
  ringR: number
  /** Drop-shadow footprint (width, depth). */
  shadow: [number, number]
  /** Price-chip anchor offset (local to the item's rotated frame). */
  chipOffset: [number, number, number]
  label: string
  price: string
}

// Drop order matches the timeline: rug first (goes on the floor), then the
// larger pieces settle on top. Chip offsets are staggered so the labels don't
// pile up on screen once everything is placed.
const ITEMS: FurnitureItem[] = [
  {
    type: 'rug',
    pos: [-0.7, 0.2],
    rotationY: 0,
    ringR: 1.15,
    shadow: [2.6, 1.9],
    chipOffset: [0.4, 0.5, 1.25],
    label: 'Wool rug',
    price: '$320'
  },
  {
    type: 'sofa',
    pos: [-1.75, -0.95],
    rotationY: 0,
    ringR: 1.1,
    shadow: [2.2, 1.2],
    chipOffset: [0.15, 1.3, 0.1],
    label: 'Sofa',
    price: '$1,240'
  },
  {
    type: 'dining',
    pos: [-0.35, 1.35],
    rotationY: 0,
    ringR: 1.05,
    shadow: [1.9, 1.4],
    chipOffset: [0.1, 1.85, 0.1],
    label: 'Dining set',
    price: '$890'
  },
  {
    type: 'bed',
    pos: [1.95, 1.25],
    rotationY: Math.PI / 2,
    ringR: 1.15,
    shadow: [1.8, 2.2],
    chipOffset: [0, 1.35, 0],
    label: 'Queen bed',
    price: '$1,560'
  },
  {
    type: 'cabinet',
    pos: [2.45, -1.4],
    rotationY: -Math.PI / 2,
    ringR: 0.72,
    shadow: [1.2, 0.7],
    chipOffset: [0, 1.75, 0],
    label: 'Cabinet',
    price: '$740'
  }
]

// ----- Low-poly furniture models (base sitting on y = 0) -----

function Rug() {
  return (
    <group>
      <mesh position={[0, 0.015, 0]}>
        <boxGeometry args={[2.4, 0.03, 1.7]} />
        <meshStandardMaterial color="#3a2f52" roughness={0.95} transparent opacity={0} />
      </mesh>
      <mesh position={[0, 0.032, 0]}>
        <boxGeometry args={[2.0, 0.03, 1.35]} />
        <meshStandardMaterial color="#5a4d84" roughness={0.95} transparent opacity={0} />
      </mesh>
    </group>
  )
}

function Sofa() {
  const fabric = '#6f7f9c'
  const cushion = '#8698b6'
  const feet = '#2b2f3a'
  return (
    <group>
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[1.9, 0.32, 0.9]} />
        <meshStandardMaterial color={fabric} roughness={0.85} transparent opacity={0} />
      </mesh>
      <mesh position={[0, 0.44, -0.37]}>
        <boxGeometry args={[1.9, 0.52, 0.16]} />
        <meshStandardMaterial color={fabric} roughness={0.85} transparent opacity={0} />
      </mesh>
      <mesh position={[-0.87, 0.3, 0]}>
        <boxGeometry args={[0.18, 0.44, 0.9]} />
        <meshStandardMaterial color={fabric} roughness={0.85} transparent opacity={0} />
      </mesh>
      <mesh position={[0.87, 0.3, 0]}>
        <boxGeometry args={[0.18, 0.44, 0.9]} />
        <meshStandardMaterial color={fabric} roughness={0.85} transparent opacity={0} />
      </mesh>
      <mesh position={[-0.44, 0.41, 0.05]}>
        <boxGeometry args={[0.82, 0.16, 0.72]} />
        <meshStandardMaterial color={cushion} roughness={0.9} transparent opacity={0} />
      </mesh>
      <mesh position={[0.44, 0.41, 0.05]}>
        <boxGeometry args={[0.82, 0.16, 0.72]} />
        <meshStandardMaterial color={cushion} roughness={0.9} transparent opacity={0} />
      </mesh>
      {[
        [-0.85, 0.38],
        [0.85, 0.38],
        [-0.85, -0.38],
        [0.85, -0.38]
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.05, z]}>
          <boxGeometry args={[0.09, 0.1, 0.09]} />
          <meshStandardMaterial color={feet} roughness={0.6} metalness={0.3} transparent opacity={0} />
        </mesh>
      ))}
    </group>
  )
}

function DiningSet() {
  const wood = '#8a6a45'
  const darkWood = '#5c4630'
  const seat = '#c9b48f'
  const chairPositions: { x: number; z: number; rot: number }[] = [
    { x: -0.42, z: 0.78, rot: 0 },
    { x: 0.42, z: 0.78, rot: 0 },
    { x: -0.42, z: -0.78, rot: Math.PI },
    { x: 0.42, z: -0.78, rot: Math.PI }
  ]
  return (
    <group>
      {/* Table top + legs. */}
      <mesh position={[0, 0.74, 0]}>
        <boxGeometry args={[1.5, 0.08, 0.9]} />
        <meshStandardMaterial color={wood} roughness={0.6} transparent opacity={0} />
      </mesh>
      {[
        [-0.66, 0.38],
        [0.66, 0.38],
        [-0.66, -0.38],
        [0.66, -0.38]
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]}>
          <boxGeometry args={[0.1, 0.72, 0.1]} />
          <meshStandardMaterial color={darkWood} roughness={0.6} transparent opacity={0} />
        </mesh>
      ))}
      {/* Chairs. */}
      {chairPositions.map((c, i) => (
        <group key={i} position={[c.x, 0, c.z]} rotation-y={c.rot}>
          <mesh position={[0, 0.44, 0]}>
            <boxGeometry args={[0.42, 0.06, 0.42]} />
            <meshStandardMaterial color={seat} roughness={0.7} transparent opacity={0} />
          </mesh>
          <mesh position={[0, 0.64, 0.19]}>
            <boxGeometry args={[0.42, 0.42, 0.05]} />
            <meshStandardMaterial color={seat} roughness={0.7} transparent opacity={0} />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[0.09, 0.44, 0.09]} />
            <meshStandardMaterial color={darkWood} roughness={0.6} transparent opacity={0} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Bed() {
  const frame = '#6b5844'
  const dark = '#4a3d2f'
  const mattress = '#efe9dd'
  const blanket = '#b7c4cf'
  const pillow = '#ffffff'
  return (
    <group>
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[2.0, 0.32, 1.5]} />
        <meshStandardMaterial color={frame} roughness={0.7} transparent opacity={0} />
      </mesh>
      <mesh position={[-1.0, 0.46, 0]}>
        <boxGeometry args={[0.16, 0.72, 1.5]} />
        <meshStandardMaterial color={dark} roughness={0.7} transparent opacity={0} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.9, 0.22, 1.42]} />
        <meshStandardMaterial color={mattress} roughness={0.9} transparent opacity={0} />
      </mesh>
      <mesh position={[0.3, 0.5, 0]}>
        <boxGeometry args={[1.28, 0.1, 1.42]} />
        <meshStandardMaterial color={blanket} roughness={0.9} transparent opacity={0} />
      </mesh>
      {[-0.38, 0.38].map((z, i) => (
        <mesh key={i} position={[-0.68, 0.56, z]}>
          <boxGeometry args={[0.5, 0.14, 0.52]} />
          <meshStandardMaterial color={pillow} roughness={0.95} transparent opacity={0} />
        </mesh>
      ))}
    </group>
  )
}

function Cabinet() {
  const wood = '#a9835a'
  const dark = '#7c5f3f'
  const handle = '#2b2f3a'
  return (
    <group>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1.0, 1.1, 0.42]} />
        <meshStandardMaterial color={wood} roughness={0.55} transparent opacity={0} />
      </mesh>
      <mesh position={[0, 1.17, 0]}>
        <boxGeometry args={[1.06, 0.06, 0.46]} />
        <meshStandardMaterial color={dark} roughness={0.55} transparent opacity={0} />
      </mesh>
      {[-0.12, 0.12].map((x, i) => (
        <mesh key={i} position={[x, 0.62, 0.23]}>
          <boxGeometry args={[0.04, 0.16, 0.04]} />
          <meshStandardMaterial color={handle} roughness={0.4} metalness={0.5} transparent opacity={0} />
        </mesh>
      ))}
      {[
        [-0.42, 0.16],
        [0.42, 0.16],
        [-0.42, -0.16],
        [0.42, -0.16]
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.05, z]}>
          <boxGeometry args={[0.07, 0.1, 0.07]} />
          <meshStandardMaterial color={dark} roughness={0.6} transparent opacity={0} />
        </mesh>
      ))}
    </group>
  )
}

function renderModel(type: FurnitureType) {
  switch (type) {
    case 'rug':
      return <Rug />
    case 'sofa':
      return <Sofa />
    case 'dining':
      return <DiningSet />
    case 'bed':
      return <Bed />
    case 'cabinet':
      return <Cabinet />
  }
}

export function FurnitureScene({ store }: { store: ScrollStoryStore }) {
  const modelRefs = useRef<(THREE.Group | null)[]>([])
  const shadowRefs = useRef<(THREE.Mesh | null)[]>([])
  const ringRefs = useRef<(THREE.Mesh | null)[]>([])
  const chipRefs = useRef<(HTMLDivElement | null)[]>([])

  // Soft radial drop-shadow texture, shared by every item.
  const shadowTexture = useMemo(() => {
    if (typeof document === 'undefined') return null
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(0,0,0,0.55)')
    g.addColorStop(0.6, 'rgba(0,0,0,0.28)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    const tex = new THREE.CanvasTexture(canvas)
    return tex
  }, [])

  useEffect(() => {
    return () => shadowTexture?.dispose()
  }, [shadowTexture])

  const setChip = (el: HTMLDivElement | null, opacity: number) => {
    if (!el) return
    el.style.opacity = String(opacity)
    el.style.transform = `translateY(${(1 - opacity) * 8}px)`
    el.style.display = opacity < 0.01 ? 'none' : 'flex'
  }

  useFrame(() => {
    // Chips hand off to the itemized quote panel — fade them as Step 04 opens.
    const chipFade = 1 - clamp01(store.getSection('quote') / 0.22)

    // Only active once the lift is complete (the house is built); before that,
    // furnitureState is all zeros so everything is invisible anyway.
    for (let i = 0; i < ITEMS.length; i++) {
      const v = furnitureState.items[i]
      const place = clamp01(v)
      const opacity = clamp01(v * 1.6)

      const model = modelRefs.current[i]
      if (model) {
        // Drop a short distance and pop into place (v carries the back.out
        // overshoot, giving a subtle landing bounce on the scale).
        model.position.y = 0.55 * (1 - place)
        const s = Math.max(0.0001, v)
        model.scale.set(s, s, s)
        model.traverse((child) => {
          const mat = (child as THREE.Mesh).material as THREE.Material & { opacity?: number }
          if (mat && 'opacity' in mat) mat.opacity = opacity
        })
      }

      const shadow = shadowRefs.current[i]
      if (shadow) {
        const mat = shadow.material as THREE.MeshBasicMaterial
        mat.opacity = place * 0.5
      }

      const ringVal = furnitureState.ring[i]
      const ring = ringRefs.current[i]
      if (ring) {
        const mat = ring.material as THREE.MeshBasicMaterial
        mat.opacity = ringVal * 0.7
        const rs = 1 + 0.45 * ringVal
        ring.scale.set(rs, rs, rs)
      }

      setChip(chipRefs.current[i], clamp01(furnitureState.chip[i]) * chipFade)
    }
  })

  return (
    <group>
      {ITEMS.map((item, i) => (
        <group key={item.type} position={[item.pos[0], 0, item.pos[1]]} rotation-y={item.rotationY}>
          {/* Drop shadow on the floor. */}
          <mesh
            ref={(el) => {
              shadowRefs.current[i] = el
            }}
            rotation-x={-Math.PI / 2}
            position={[0, 0.02, 0]}
          >
            <planeGeometry args={item.shadow} />
            <meshBasicMaterial
              map={shadowTexture ?? undefined}
              transparent
              opacity={0}
              depthWrite={false}
              color="#000000"
            />
          </mesh>

          {/* "Placed" confirmation ring. */}
          <mesh
            ref={(el) => {
              ringRefs.current[i] = el
            }}
            rotation-x={-Math.PI / 2}
            position={[0, 0.05, 0]}
          >
            <ringGeometry args={[item.ringR * 0.88, item.ringR, 56]} />
            <meshBasicMaterial
              color="#22d3ee"
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>

          {/* The furniture model (drops + scales + fades). */}
          <group
            ref={(el) => {
              modelRefs.current[i] = el
            }}
          >
            {renderModel(item.type)}
          </group>

          {/* Floating price chip. */}
          <Html position={item.chipOffset} center style={{ pointerEvents: 'none' }}>
            <div
              ref={(el) => {
                chipRefs.current[i] = el
              }}
              className="fp-chip"
              style={{ opacity: 0 }}
            >
              <span className="fp-chip-dot" />
              {item.label}
              <span className="fp-chip-price">{item.price}</span>
            </div>
          </Html>
        </group>
      ))}
    </group>
  )
}
