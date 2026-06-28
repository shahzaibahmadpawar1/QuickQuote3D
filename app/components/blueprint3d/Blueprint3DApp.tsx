'use client'

import { Blueprint3DAppBase, type Blueprint3DAppConfig } from './Blueprint3DAppBase'
import { ActivityTracker } from './ActivityTracker'

interface Blueprint3DAppProps {
  config?: Blueprint3DAppConfig
}

export function Blueprint3DApp({ config }: Blueprint3DAppProps) {
  const readOnly = config?.readOnly ?? false
  return (
    <>
      {!readOnly ? <ActivityTracker /> : null}
      <Blueprint3DAppBase config={config} />
    </>
  )
}

export default Blueprint3DApp
