import type { DeadeyeExtensionManifest } from './extensions'

export interface DiscoveredExtensionSnapshot {
  readonly rootPath: string
  readonly manifest: DeadeyeExtensionManifest
}

export interface ExtensionsBridge {
  discoverUser(): Promise<readonly DiscoveredExtensionSnapshot[]>
}
