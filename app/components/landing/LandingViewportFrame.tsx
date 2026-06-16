'use client'

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

/** Nudge the rendered frame upward so models sit in the vertical middle of the left viewport. */
export function LandingViewportFrame() {
  const { camera, size } = useThree()

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return

    const yOffset = Math.round(size.height * 0.07)
    camera.setViewOffset(size.width, size.height, 0, yOffset, size.width, size.height)
    camera.updateProjectionMatrix()

    return () => {
      camera.clearViewOffset()
      camera.updateProjectionMatrix()
    }
  }, [camera, size.width, size.height])

  return null
}
