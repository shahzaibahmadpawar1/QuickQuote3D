'use client'

import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { ORBIT_DISTANCE, STAGE_PIVOT, sampleCameraKeyframe } from './landing-constants'
import { useLandingScrollStore } from './landing-scroll-store'

export function LandingOrbitControls({ enabled = true }: { enabled?: boolean }) {
  const dragging = useRef(false)
  const desiredPosition = useMemo(() => new THREE.Vector3(), [])
  const desiredTarget = useMemo(() => new THREE.Vector3(), [])
  const controls = useThree((state) => state.controls)

  useFrame((_, delta) => {
    if (!controls || dragging.current) return
    const orbit = controls as THREE.EventDispatcher & {
      object: THREE.Camera
      target: THREE.Vector3
      update: () => void
    }

    const offset = useLandingScrollStore.getState().offset
    const { position, target } = sampleCameraKeyframe(offset)
    desiredPosition.set(position[0], position[1], position[2])
    desiredTarget.set(target[0], target[1], target[2])

    const lerpFactor = 1 - Math.pow(0.001, delta)
    orbit.object.position.lerp(desiredPosition, lerpFactor)
    orbit.target.lerp(desiredTarget, lerpFactor)
    orbit.update()
  })

  return (
    <OrbitControls
      makeDefault
      enabled={enabled}
      target={STAGE_PIVOT}
      enableZoom={false}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.65}
      minDistance={ORBIT_DISTANCE}
      maxDistance={ORBIT_DISTANCE}
      minPolarAngle={Math.PI * 0.1}
      maxPolarAngle={Math.PI * 0.52}
      onStart={() => {
        dragging.current = true
      }}
      onEnd={() => {
        dragging.current = false
      }}
    />
  )
}
