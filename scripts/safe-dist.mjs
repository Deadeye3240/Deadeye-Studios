/**
 * Run electron-builder after a safe production build.
 * Redirects cache/temp paths when `#` appears in project or user profile paths
 * (Windows treats `#` as a URL fragment and breaks NSIS/electron-builder tooling).
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDir, '..')

const extraArgs = process.argv.slice(2)

const HASH_PATH_ISSUE =
  process.platform === 'win32' &&
  (projectRoot.includes('#') || os.homedir().includes('#'))

const SAFE_LOCAL_APPDATA = path.join('C:', 'dev', 'deadeye-local-appdata')
const SAFE_TEMP = path.join(SAFE_LOCAL_APPDATA, 'Temp')
const SAFE_ELECTRON_BUILDER_CACHE = path.join('C:', 'dev', 'electron-builder-cache')

function ensureSafeWindowsDirs() {
  fs.mkdirSync(SAFE_TEMP, { recursive: true })
}

function buildDistEnv() {
  const env = {
    ...process.env,
    CSC_IDENTITY_AUTO_DISCOVERY: 'false',
  }

  if (process.platform === 'win32') {
    fs.mkdirSync(SAFE_ELECTRON_BUILDER_CACHE, { recursive: true })
    env.ELECTRON_BUILDER_CACHE = SAFE_ELECTRON_BUILDER_CACHE
  }

  if (HASH_PATH_ISSUE) {
    ensureSafeWindowsDirs()
    env.LOCALAPPDATA = SAFE_LOCAL_APPDATA
    env.TEMP = SAFE_TEMP
    env.TMP = SAFE_TEMP
    console.log(
      '[safe-dist] Path contains "#" — using hash-safe LOCALAPPDATA/TEMP for electron-builder.',
    )
    console.log(`[safe-dist] LOCALAPPDATA=${env.LOCALAPPDATA}`)
  }

  return env
}

function run(command, args, env) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    env,
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const distEnv = buildDistEnv()

run(process.execPath, [path.join(scriptDir, 'safe-build.mjs')], distEnv)

const electronBuilderCli = path.join(
  projectRoot,
  'node_modules',
  'electron-builder',
  'cli.js',
)
run(process.execPath, [electronBuilderCli, ...extraArgs], distEnv)
