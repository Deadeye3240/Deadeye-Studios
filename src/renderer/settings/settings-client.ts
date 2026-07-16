import type { DeadeyeSettings } from '../../shared/settings'

function getBridge() {
  if (!window.deadeye?.settings) {
    throw new Error('Deadeye settings bridge is unavailable')
  }

  return window.deadeye.settings
}

export class SettingsClient {
  get(): Promise<DeadeyeSettings> {
    return getBridge().get()
  }

  update(partial: Partial<DeadeyeSettings>): Promise<DeadeyeSettings> {
    return getBridge().update(partial)
  }

  reset(): Promise<DeadeyeSettings> {
    return getBridge().reset()
  }

  onDidChange(listener: (settings: DeadeyeSettings) => void): () => void {
    return getBridge().onDidChange(listener)
  }
}

let settingsClient: SettingsClient | null = null

export function getSettingsClient(): SettingsClient {
  if (!settingsClient) {
    settingsClient = new SettingsClient()
  }

  return settingsClient
}
