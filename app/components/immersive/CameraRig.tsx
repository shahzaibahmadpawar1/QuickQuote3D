'use client'

import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { ScrollStoryStore } from './scroll-story'
import { liftState } from './lift-state'
import { furnitureState } from './furniture-state'

// Max orbit swing during the furniture section (~13°), applied around the
// look target. Kept small so it reads as parallax, not disorientation.
const ORBIT_MAX = -0.23

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/**
 * Owns the shared camera. Blends across three framings:
 *   - HERO: tilted ~60° above the horizon (sketch grid).
 *   - TOP:  high up, tiny FOV → near-orthographic top-down plan view.
 *   - PERSP: a ~32° 3/4 perspective hero shot of the extruded building.
 *
 * HERO → TOP is driven by the Floorplan section's scroll progress.
 * TOP → PERSP is driven by `liftState.camTilt` (a GSAP-scrubbed value), so the
 * tilt reverses smoothly when scrubbing back up.
 * Fog near/far widen for the deeper framings so nothing washes out.
 */
export function CameraRig({ store }: { store: ScrollStoryStore }) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera
  const scene = useThree((state) => state.scene)

  const rig = useMemo(
    () => ({
      heroPos: new THREE.Vector3(0, 6, 3.8),
      heroLook: new THREE.Vector3(0, -0.35, 0),
      topPos: new THREE.Vector3(-3.6, 22, 1),
      topLook: new THREE.Vector3(-3.6, 0, 0),
      perspPos: new THREE.Vector3(5.4, 6.6, 9.8),
      perspLook: new THREE.Vector3(-4.7, -0.3, 0),
      // Quote framing: aim to the right of the room so it sits in the left ~55%.
      quotePos: new THREE.Vector3(11.6, 7.2, 10.4),
      quoteLook: new THREE.Vector3(4.1, 0.5, 0),
      // Save & Share: recenter + dolly back so the room shrinks toward the
      // middle as the canvas cross-fades into the DOM project card.
      sharePos: new THREE.Vector3(1.5, 8.6, 13.6),
      shareLook: new THREE.Vector3(0.3, 0.5, 0),
      basePos: new THREE.Vector3(),
      baseLook: new THREE.Vector3(),
      pos: new THREE.Vector3(),
      look: new THREE.Vector3()
    }),
    []
  )

  useFrame(() => {
    const floorplan = store.getSection('floorplan')
    const flat = smoothstep(0, 0.14, floorplan)
    const tilt = liftState.camTilt

    // HERO → TOP, then TOP → PERSP.
    rig.basePos.lerpVectors(rig.heroPos, rig.topPos, flat)
    rig.baseLook.lerpVectors(rig.heroLook, rig.topLook, flat)
    rig.pos.lerpVectors(rig.basePos, rig.perspPos, tilt)
    rig.look.lerpVectors(rig.baseLook, rig.perspLook, tilt)

    // Slow orbit around the room during the furniture section (parallax).
    const orbit = furnitureState.orbit
    if (orbit > 0.0001) {
      const angle = orbit * ORBIT_MAX
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const dx = rig.pos.x - rig.look.x
      const dz = rig.pos.z - rig.look.z
      rig.pos.x = rig.look.x + dx * cos - dz * sin
      rig.pos.z = rig.look.z + dx * sin + dz * cos
      rig.pos.y += orbit * 0.5
    }

    // Quote section: reframe the room into the left ~55% so the price panel
    // has the right 45%. Overrides the orbit as it settles.
    // Transition starts as the Quote section enters the screen (completed over first 28% of scroll-in).
    const quoteTransition = Math.min(1, Math.max(0, store.getSection('quoteTransition') / 0.28))
    const quoteActive = store.getSection('quote')
    const quoteFrame = Math.max(quoteTransition, smoothstep(0, 0.4, quoteActive))
    if (quoteFrame > 0.0001) {
      rig.pos.lerp(rig.quotePos, quoteFrame)
      rig.look.lerp(rig.quoteLook, quoteFrame)
    }

    // Save & Share: glide the room to centre + back as it fades into the card.
    // Transition starts as the Save & Share section enters the screen (completed over first 28% of scroll-in).
    const shareTransition = Math.min(1, Math.max(0, store.getSection('shareTransition') / 0.28))
    const shareActive = store.getSection('share')
    const shareFrame = Math.max(shareTransition, smoothstep(0, 0.45, shareActive))
    if (shareFrame > 0.0001) {
      rig.pos.lerp(rig.sharePos, shareFrame)
      rig.look.lerp(rig.shareLook, shareFrame)
    }

    camera.position.copy(rig.pos)
    camera.lookAt(rig.look)

    const baseFov = THREE.MathUtils.lerp(42, 26, flat)
    const fov = THREE.MathUtils.lerp(baseFov, 38, tilt)
    if (Math.abs(camera.fov - fov) > 0.001) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }

    const fog = scene.fog as THREE.Fog | null
    if (fog) {
      const baseNear = THREE.MathUtils.lerp(6, 24, flat)
      const baseFar = THREE.MathUtils.lerp(22, 80, flat)
      fog.near = THREE.MathUtils.lerp(baseNear, 9, tilt)
      fog.far = THREE.MathUtils.lerp(baseFar, 70, tilt)
    }
  })

  return null
}
