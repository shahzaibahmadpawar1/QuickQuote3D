'use client'

import { useEffect, useMemo, useRef, type ComponentRef } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

const MODEL_PATH = '/hero-models/1.glb'
// Asymmetric limits from the default view: wide arc to the left + overhead,
// tighter to the right/back so exterior walls stay hidden.
const AZIMUTH_LEFT = 1.85
const AZIMUTH_RIGHT = -0.1
const POLAR_UP = 1.18
const POLAR_DOWN = 0.06
const MIN_POLAR = 0.32
const IDLE_AZIMUTH_SPEED = 0.22

function HeroModel() {
  const gltf = useLoader(GLTFLoader, MODEL_PATH, (loader) => {
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath(`https://unpkg.com/three@0.${THREE.REVISION}.0/examples/jsm/libs/draco/`)
    loader.setDRACOLoader(dracoLoader)
  }) as GLTF

  const model = useMemo(() => {
    const scene = gltf.scene.clone(true)
    const box = new THREE.Box3().setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z, 0.001)
    const scale = 1.206 / maxDim
    scene.position.sub(center)
    scene.scale.setScalar(scale)
    // Bias slightly down so floor corners remain inside the taller canvas.
    scene.position.y -= size.y * scale * 0.1
    return scene
  }, [gltf])

  return <primitive object={model} />
}

function BoundedOrbitControls({ target }: { target: [number, number, number] }) {
  const ref = useRef<ComponentRef<typeof OrbitControls>>(null)
  const azimuthRangeRef = useRef<{ min: number; max: number } | null>(null)
  const idleDirectionRef = useRef<1 | -1>(-1)

  useEffect(() => {
    const controls = ref.current
    if (!controls) return

    const frame = requestAnimationFrame(() => {
      controls.update()
      const az = controls.getAzimuthalAngle()
      const pol = controls.getPolarAngle()
      controls.minAzimuthAngle = az - AZIMUTH_LEFT
      controls.maxAzimuthAngle = az + AZIMUTH_RIGHT
      controls.minPolarAngle = Math.max(MIN_POLAR, pol - POLAR_UP)
      controls.maxPolarAngle = pol + POLAR_DOWN
      azimuthRangeRef.current = {
        min: controls.minAzimuthAngle,
        max: controls.maxAzimuthAngle
      }
    })

    return () => cancelAnimationFrame(frame)
  }, [])

  useFrame((_, delta) => {
    const controls = ref.current
    const range = azimuthRangeRef.current
    if (!controls || !range) return

    const current = controls.getAzimuthalAngle()
    const next = current + idleDirectionRef.current * IDLE_AZIMUTH_SPEED * delta
    const clamped = Math.min(range.max, Math.max(range.min, next))

    if (clamped <= range.min + 0.0005) {
      idleDirectionRef.current = 1
    } else if (clamped >= range.max - 0.0005) {
      idleDirectionRef.current = -1
    }

    controls.setAzimuthalAngle(clamped)
    controls.update()
  })

  return (
    <OrbitControls
      ref={ref}
      enablePan={false}
      enableZoom={false}
      enableDamping
      dampingFactor={0.12}
      rotateSpeed={0.55}
      target={target}
    />
  )
}

export function HeroModelViewer() {
  return (
    // WebGL always clips to canvas pixels — overflow-visible on parents cannot
    // save edges. Bleed the canvas past the layout cell so orbiting geometry
    // stays drawable on the left/bottom especially.
    <div
      className="pointer-events-none absolute -inset-x-[14%] -top-[18%] -bottom-[8%] touch-none lg:-left-[22%] lg:-right-[6%]"
      aria-label="Interactive room preview"
    >
      <div className="pointer-events-auto h-full w-full">
        <Canvas
          className="h-full! w-full!"
          gl={{ alpha: true, antialias: true }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0)
          }}
          camera={{ position: [1.05, 0.92, 6.15], fov: 24, near: 0.01, far: 120 }}
          style={{ overflow: 'visible' }}
        >
          <ambientLight intensity={0.95} />
          <directionalLight position={[4, 6, 3]} intensity={1.15} />
          <directionalLight position={[-4, 2, -2]} intensity={0.45} />
          <HeroModel />
          <BoundedOrbitControls target={[0.08, 0.02, 0]} />
        </Canvas>
      </div>
    </div>
  )
}
