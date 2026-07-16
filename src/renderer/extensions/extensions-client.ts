import { EXTENSION_IPC_CHANNELS } from '../../shared/ipc-channels'
import type { ExtensionsBridge } from '../../shared/extensions-bridge'

export function getExtensionsClient(): ExtensionsBridge {
  if (!window.deadeye?.extensions) {
    throw new Error('Extensions bridge is unavailable in the renderer process')
  }

  return window.deadeye.extensions
}

export async function discoverUserExtensions(): Promise<
  Awaited<ReturnType<ExtensionsBridge['discoverUser']>>
> {
  return getExtensionsClient().discoverUser()
}

export { EXTENSION_IPC_CHANNELS }
