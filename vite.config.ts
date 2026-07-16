import path from 'node:path'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'

const projectRoot = __dirname
const rendererRoot = path.resolve(projectRoot, 'src/renderer')

const electronOutDir = path.resolve(projectRoot, 'dist-electron')

export default defineConfig({
  root: rendererRoot,
  plugins: [
    electron({
      main: {
        entry: path.resolve(projectRoot, 'src/main/main.ts'),
        vite: {
          build: {
            outDir: electronOutDir,
            emptyOutDir: true,
          },
        },
      },
      preload: {
        input: path.resolve(projectRoot, 'src/preload.ts'),
        vite: {
          build: {
            outDir: electronOutDir,
            emptyOutDir: false,
          },
        },
      },
      renderer: {},
    }),
  ],
  optimizeDeps: {
    include: ['monaco-editor'],
  },
  worker: {
    format: 'es',
  },
  build: {
    outDir: path.resolve(projectRoot, 'dist/renderer'),
    emptyOutDir: true,
  },
})
