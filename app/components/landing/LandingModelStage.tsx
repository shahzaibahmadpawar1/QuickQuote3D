'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Center, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { LANDING_MODELS, MODEL_CROSSFADE, STAGE_OFFSET, smoothstep } from './landing-constants'
import { useLandingScrollStore } from './landing-scroll-store'

useGLTF.preload(LANDING_MODELS.interior)
useGLTF.preload(LANDING_MODELS.house)

function setGroupOpacity(group: THREE.Object3D, opacity: number) {
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    materials.forEach((material) => {
      if (!(material instanceof THREE.Material)) return
      material.transparent = opacity < 1
      material.opacity = opacity
      material.needsUpdate = true
    })
  })
}

function LoadedModel({ url, scale = 1.15 }: { url: string; scale?: number }) {
  const { scene } = useGLTF(url)
  const clone = useMemo(() => scene.clone(true), [scene])

  return (
    <Center bottom>
      <primitive object={clone} scale={scale} />
    </Center>
  )
}

export function LandingModelStage() {
  const interiorRef = useRef<THREE.Group>(null)
  const houseRef = useRef<THREE.Group>(null)
  const stageRef = useRef<THREE.Group>(null)

  useFrame(() => {
    const offset = useLandingScrollStore.getState().offset
    const houseWeight = smoothstep(MODEL_CROSSFADE.start, MODEL_CROSSFADE.end, offset)
    const interiorWeight = 1 - houseWeight
    const stageFade = offset > 0.88 ? 1 - smoothstep(0.88, 0.98, offset) : 1

    if (interiorRef.current) {
      setGroupOpacity(interiorRef.current, interiorWeight * stageFade)
      interiorRef.current.visible = interiorWeight * stageFade > 0.01
    }
    if (houseRef.current) {
      setGroupOpacity(houseRef.current, houseWeight * stageFade)
      houseRef.current.visible = houseWeight * stageFade > 0.01
    }
    if (stageRef.current) {
      stageRef.current.visible = stageFade > 0.01
    }
  })

  useEffect(() => {
    return () => {
      useGLTF.clear(LANDING_MODELS.interior)
      useGLTF.clear(LANDING_MODELS.house)
    }
  }, [])

  return (
    <group ref={stageRef} position={STAGE_OFFSET}>
      <group ref={interiorRef}>
        <LoadedModel url={LANDING_MODELS.interior} />
      </group>

      <group ref={houseRef}>
        <LoadedModel url={LANDING_MODELS.house} scale={1.25} />
      </group>
    </group>
  )
}
