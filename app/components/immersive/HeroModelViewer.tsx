'use client'

import { useEffect, useMemo, useRef, type ComponentRef } from 'react'
import { Canvas, useLoader } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

const MODEL_PATH = '/hero-models/1.glb'
// Asymmetric limits from the default view: wide arc to the left + overhead,
// tighter to the right/back so exterior walls stay hidden.
const AZIMUTH_LEFT = 1.85
const AZIMUTH_RIGHT = -0.1
const POLAR_UP = 1.18
const POLAR_DOWN = 0.06
const MIN_POLAR = 0.32

function HeroModel() {
  const gltf = useLoader(GLTFLoader, MODEL_PATH) as GLTF

  const model = useMemo(() => {
    const scene = gltf.scene.clone(true)
    const box = new THREE.Box3().setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z, 0.001)
    const scale = 1.48 / maxDim
    scene.position.sub(center)
    scene.scale.setScalar(scale)
    scene.position.y -= size.y * scale * 0.28
    return scene
  }, [gltf])

  return <primitive object={model} />
}

function BoundedOrbitControls({ target }: { target: [number, number, number] }) {
  const ref = useRef<ComponentRef<typeof OrbitControls>>(null)

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
    })

    return () => cancelAnimationFrame(frame)
  }, [])

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
    <div className="absolute inset-0 touch-none" aria-label="Interactive room preview">
      <Canvas
        className="h-full! w-full!"
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
        }}
        camera={{ position: [1.15, 0.96, 5.45], fov: 26 }}
      >
        <ambientLight intensity={0.95} />
        <directionalLight position={[4, 6, 3]} intensity={1.15} />
        <directionalLight position={[-4, 2, -2]} intensity={0.45} />
        <HeroModel />
        <BoundedOrbitControls target={[0.12, 0.08, 0]} />
      </Canvas>
    </div>
  )
}
