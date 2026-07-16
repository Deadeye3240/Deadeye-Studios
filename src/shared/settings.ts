export interface EditorSettings {
  readonly fontSize: number
  readonly fontFamily: string
  readonly wordWrap: 'off' | 'on' | 'bounded'
  readonly minimap: boolean
  readonly tabSize: number
  readonly lineNumbers: 'on' | 'off' | 'relative'
}

export type DensityMode = 'compact' | 'comfortable'

export interface AppearanceSettings {
  readonly theme: string
  readonly uiScale: number
  readonly densityMode: DensityMode
}

export interface WorkspaceSettings {
  readonly autoSave: 'off' | 'afterDelay' | 'onFocusChange'
  readonly autoSaveDelayMs: number
  readonly defaultWorkspace: string | null
}

export interface DeadeyeSettings {
  readonly editor: EditorSettings
  readonly appearance: AppearanceSettings
  readonly workspace: WorkspaceSettings
}

export const DEFAULT_SETTINGS: DeadeyeSettings = {
  editor: {
    fontSize: 13,
    fontFamily: '"Cascadia Code", "JetBrains Mono", Consolas, "Courier New", monospace',
    wordWrap: 'off',
    minimap: true,
    tabSize: 4,
    lineNumbers: 'on',
  },
  appearance: {
    theme: 'deadeye-dark',
    uiScale: 1,
    densityMode: 'compact',
  },
  workspace: {
    autoSave: 'off',
    autoSaveDelayMs: 1000,
    defaultWorkspace: null,
  },
}

export type SettingsChangeListener = (settings: DeadeyeSettings) => void
export type SettingsChangeUnsubscribe = () => void

export interface SettingsBridge {
  get(): Promise<DeadeyeSettings>
  update(partial: Partial<DeadeyeSettings>): Promise<DeadeyeSettings>
  reset(): Promise<DeadeyeSettings>
  onDidChange(listener: SettingsChangeListener): SettingsChangeUnsubscribe
}
