'use client'

import { useRef } from 'react'
import * as THREE from 'three'
import { useScrollStore } from './scroll-story'
import { ImmersivePalette } from './immersive-theme'

export function HeroScene({ store }: { store: any; palette: ImmersivePalette }) {
  const groupRef = useRef<THREE.Group>(null)

  return <group ref={groupRef} visible={false} />
}
