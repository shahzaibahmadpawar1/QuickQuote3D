'use client'

import { Suspense, useEffect, useState, type RefObject } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { INITIAL_CAMERA } from './landing-constants'
import { LandingModelStage } from './LandingModelStage'
import { LandingOrbitControls } from './LandingOrbitControls'
import { LandingViewportFrame } from './LandingViewportFrame'

interface LandingSceneProps {
  eventSource?: RefObject<HTMLElement | null>
  orbitEnabled?: boolean
  enableShadows?: boolean
}

export function LandingScene({
  eventSource,
  orbitEnabled = true,
  enableShadows: enableShadowsProp
}: LandingSceneProps) {
  const [enableShadows, setEnableShadows] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const update = () => setEnableShadows(enableShadowsProp ?? !mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [enableShadowsProp])

  return (
    <Canvas
      shadows={enableShadows}
      dpr={[1, 1.5]}
      camera={{ position: INITIAL_CAMERA, fov: 40, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      className="landing-canvas pointer-events-none"
      eventSource={eventSource as RefObject<HTMLElement> | undefined}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[6, 10, 4]}
        intensity={1.15}
        castShadow={enableShadows}
        shadow-mapSize={[1024, 1024]}
      />
      <hemisphereLight args={['#ffffff', '#d8d2c8', 0.45]} />

      <Suspense fallback={null}>
        <Environment preset="apartment" />
        <LandingViewportFrame />
        <LandingOrbitControls enabled={orbitEnabled} />
        <LandingModelStage />
      </Suspense>
    </Canvas>
  )
}
