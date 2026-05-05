import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@blueprint3d': path.resolve(__dirname, '../src'),
      three: path.resolve(__dirname, 'node_modules/three')
    }
  }
})
