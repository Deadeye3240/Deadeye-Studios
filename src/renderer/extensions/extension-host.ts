import type {
  DeadeyeExtensionManifest,
  ExtensionCommandContribution,
  ExtensionPanelContribution,
  ExtensionThemeContribution,
  LoadedExtension,
} from '../../shared/extensions'
import { EXTENSION_MANIFEST_FILENAME } from '../../shared/extensions'

export interface ExtensionHostCallbacks {
  readonly onThemeRegistered: (theme: ExtensionThemeContribution, extension: LoadedExtension) => void
  readonly onCommandRegistered: (command: ExtensionCommandContribution, extension: LoadedExtension) => void
  readonly onPanelRegistered: (panel: ExtensionPanelContribution, extension: LoadedExtension) => void
}

/**
 * Sandboxed extension host.
 *
 * Extensions are declarative manifests only — no arbitrary code execution.
 * Contributions are registered through typed host callbacks.
 */
export class ExtensionHost {
  private readonly extensions = new Map<string, LoadedExtension>()
  private callbacks: ExtensionHostCallbacks | null = null

  setCallbacks(callbacks: ExtensionHostCallbacks): void {
    this.callbacks = callbacks
  }

  loadManifest(manifest: DeadeyeExtensionManifest, rootPath: string): void {
    this.validateManifest(manifest)

    const loaded: LoadedExtension = {
      manifest,
      rootPath,
    }

    this.extensions.set(manifest.id, loaded)
    this.registerContributions(loaded)
  }

  loadFromJson(raw: string, rootPath: string): void {
    const manifest = JSON.parse(raw) as DeadeyeExtensionManifest
    this.loadManifest(manifest, rootPath)
  }

  getExtensions(): readonly LoadedExtension[] {
    return Array.from(this.extensions.values())
  }

  getManifestPath(rootPath: string): string {
    return `${rootPath.replace(/\\/g, '/')}/${EXTENSION_MANIFEST_FILENAME}`
  }

  private registerContributions(extension: LoadedExtension): void {
    const contributes = extension.manifest.contributes
    if (!contributes) {
      return
    }

    for (const theme of contributes.themes ?? []) {
      this.callbacks?.onThemeRegistered(theme, extension)
    }

    for (const command of contributes.commands ?? []) {
      this.callbacks?.onCommandRegistered(command, extension)
    }

    for (const panel of contributes.panels ?? []) {
      this.callbacks?.onPanelRegistered(panel, extension)
    }
  }

  private validateManifest(manifest: DeadeyeExtensionManifest): void {
    if (!manifest.id?.trim()) {
      throw new Error('Extension manifest requires an id')
    }

    if (!manifest.name?.trim()) {
      throw new Error('Extension manifest requires a name')
    }

    if (!manifest.version?.trim()) {
      throw new Error('Extension manifest requires a version')
    }

    if (!/^[a-z0-9.-]+$/i.test(manifest.id)) {
      throw new Error(`Invalid extension id: ${manifest.id}`)
    }
  }
}
