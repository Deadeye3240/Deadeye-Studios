import { EXTENSION_MANIFEST_FILENAME } from '../../shared/extensions'
import type { ExtensionHostCallbacks } from './extension-host'
import { getRegistryLanguagesForExtensions } from '../../shared/language-registry'
import { ExtensionHost } from './extension-host'
import { discoverUserExtensions } from './extensions-client'

const BUILTIN_EXTENSION_MANIFEST = {
  id: 'deadeye.builtin',
  name: 'Deadeye Built-in',
  version: '1.0.0',
  contributes: {
    themes: [
      {
        id: 'deadeye-dark',
        label: 'Deadeye Dark',
        path: 'builtin://deadeye-dark',
      },
    ],
    commands: [
      {
        id: 'deadeye.showSettings',
        title: 'Open Settings',
        category: 'Preferences',
      },
    ],
    panels: [
      {
        id: 'deadeye.explorer',
        title: 'Explorer',
      },
      {
        id: 'deadeye.sourceControl',
        title: 'Source Control',
      },
    ],
    languages: getRegistryLanguagesForExtensions(),
  },
} as const

export class ExtensionLoader {
  private readonly host = new ExtensionHost()

  async initialize(hostCallbacks: ExtensionHostCallbacks): Promise<ExtensionHost> {
    this.host.setCallbacks(hostCallbacks)
    this.host.loadManifest(BUILTIN_EXTENSION_MANIFEST, 'builtin://deadeye')

    try {
      const userExtensions = await discoverUserExtensions()
      for (const extension of userExtensions) {
        this.host.loadManifest(extension.manifest, extension.rootPath)
      }
    } catch (error) {
      console.warn('[Deadeye Studio] Failed to discover user extensions:', error)
    }

    return this.host
  }

  getHost(): ExtensionHost {
    return this.host
  }

  getManifestFilename(): string {
    return EXTENSION_MANIFEST_FILENAME
  }
}
