/**
 * Production build helper for paths that contain `#` (e.g. "Stream Shack PC#2").
 * Vite/esbuild treat `#` as a URL fragment and may read the wrong file on Windows.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDir, '..')

const HASH_PATH_ISSUE =
  process.platform === 'win32' && projectRoot.includes('#')

/** Must live outside any path segment containing `#` (including user profile folders). */
const STAGING_ROOT =
  process.platform === 'win32'
    ? 'C:\\deadeye-studio-build'
    : path.join(os.tmpdir(), 'deadeye-studio-build')

const COPY_IGNORE = new Set([
  'node_modules',
  'dist',
  'dist-electron',
  'release',
  '.git',
])

function copyRecursive(src, dest) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true })
    for (const entry of fs.readdirSync(src)) {
      if (COPY_IGNORE.has(entry)) continue
      copyRecursive(path.join(src, entry), path.join(dest, entry))
    }
    return
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
}

function copyNodeModules(sourceRoot, targetRoot) {
  const src = path.join(sourceRoot, 'node_modules')
  const dest = path.join(targetRoot, 'node_modules')
  console.log('[safe-build] Copying node_modules (required when project path contains "#").')

  if (process.platform === 'win32') {
    fs.mkdirSync(dest, { recursive: true })
    const result = spawnSync('robocopy', [src, dest, '/E', '/NFL', '/NDL', '/NJH', '/NJS'], {
      stdio: 'inherit',
      shell: true,
    })
    const code = result.status ?? 0
    if (code >= 8) {
      process.exit(code)
    }
    return
  }

  copyRecursive(src, dest)
}

function prepareNodeModules(sourceRoot, targetRoot) {
  if (HASH_PATH_ISSUE) {
    copyNodeModules(sourceRoot, targetRoot)
    return
  }

  const src = path.join(sourceRoot, 'node_modules')
  const dest = path.join(targetRoot, 'node_modules')
  if (fs.existsSync(dest)) return
  if (process.platform === 'win32') {
    fs.symlinkSync(src, dest, 'junction')
  } else {
    fs.symlinkSync(src, dest, 'dir')
  }
}

function copyArtifactsBack(sourceRoot, targetRoot) {
  for (const dir of ['dist-electron', path.join('dist', 'renderer'), 'release']) {
    const from = path.join(sourceRoot, dir)
    const to = path.join(targetRoot, dir)
    if (!fs.existsSync(from)) continue
    fs.rmSync(to, { recursive: true, force: true })
    fs.mkdirSync(path.dirname(to), { recursive: true })
    copyRecursive(from, to)
  }
}

function runViteBuild(cwd) {
  const viteBin = path.join(cwd, 'node_modules', 'vite', 'bin', 'vite.js')
  const result = spawnSync(process.execPath, [viteBin, 'build'], {
    cwd,
    stdio: 'inherit',
    env: { ...process.env },
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function stageAndBuild() {
  console.log(
    '[safe-build] Project path contains "#" — staging build to avoid Vite path bug.',
  )
  console.log(`[safe-build] Staging directory: ${STAGING_ROOT}`)

  fs.rmSync(STAGING_ROOT, { recursive: true, force: true })
  fs.mkdirSync(STAGING_ROOT, { recursive: true })
  copyRecursive(projectRoot, STAGING_ROOT)
  prepareNodeModules(projectRoot, STAGING_ROOT)

  runViteBuild(STAGING_ROOT)
  copyArtifactsBack(STAGING_ROOT, projectRoot)

  console.log('[safe-build] Artifacts copied back to project directory.')
}

if (HASH_PATH_ISSUE) {
  stageAndBuild()
} else {
  runViteBuild(projectRoot)
}
