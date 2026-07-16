import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { DeadeyeExtensionManifest } from '../../shared/extensions'
import { EXTENSION_MANIFEST_FILENAME } from '../../shared/extensions'

export interface DiscoveredExtension {
  readonly rootPath: string
  readonly manifest: DeadeyeExtensionManifest
}

export function getUserExtensionsDirectory(): string {
  return path.join(os.homedir(), '.deadeye', 'extensions')
}

export async function discoverUserExtensions(): Promise<DiscoveredExtension[]> {
  const extensionsDirectory = getUserExtensionsDirectory()

  try {
    const entries = await fs.readdir(extensionsDirectory, { withFileTypes: true })
    const discovered: DiscoveredExtension[] = []

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue
      }

      const rootPath = path.join(extensionsDirectory, entry.name)
      const manifestPath = path.join(rootPath, EXTENSION_MANIFEST_FILENAME)

      try {
        const raw = await fs.readFile(manifestPath, 'utf8')
        const manifest = JSON.parse(raw) as DeadeyeExtensionManifest
        discovered.push({ rootPath, manifest })
      } catch (error) {
        console.warn(`[Deadeye Studio] Skipping extension at ${rootPath}:`, error)
      }
    }

    return discovered
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }

    throw error
  }
}
