#!/usr/bin/env node
/**
 * Upload locally built release artifacts to GitHub Releases.
 * Requires: gh auth login
 *
 * Usage:
 *   node scripts/publish-release.mjs v1.0.0
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const tag = process.argv[2]
if (!tag) {
  console.error('Usage: node scripts/publish-release.mjs <tag>')
  process.exit(1)
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const releaseDir = path.join(projectRoot, 'release')

const version = tag.replace(/^v/, '')
const candidates = [
  `Deadeye-Studio-${version}-Setup.exe`,
  `Deadeye-Studio-${version}-Portable.exe`,
  `Deadeye-Studio-${version}-x64.AppImage`,
  `deadeye-studio_${version}_amd64.deb`,
]

const files = candidates
  .map((name) => path.join(releaseDir, name))
  .filter((filePath) => fs.existsSync(filePath))

if (files.length === 0) {
  console.error(`No release artifacts found in ${releaseDir}`)
  console.error('Run npm run dist (Windows) or npm run dist:linux (Linux) first.')
  process.exit(1)
}

const notes = `## Deadeye Studio ${tag}

### Windows
- **Setup** — installer for Windows x64
- **Portable** — no-install portable executable

### Linux
- **AppImage** — portable Linux build (\`chmod +x\` then run)
- **deb** — Debian/Ubuntu package

### Notes
- Windows builds are unsigned; SmartScreen may warn on first launch.
`

const args = [
  'release',
  'create',
  tag,
  '--repo',
  'Deadeye3240/Deadeye-Studios',
  '--title',
  `Deadeye Studio ${tag}`,
  '--notes',
  notes,
  ...files,
]

console.log(`[publish-release] Creating ${tag} with ${files.length} artifact(s)...`)
const result = spawnSync('gh', args, { stdio: 'inherit' })
process.exit(result.status ?? 1)
