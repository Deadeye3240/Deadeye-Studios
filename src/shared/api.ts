import type { ExtensionsBridge } from './extensions-bridge'
import type { FileSystemBridge } from './filesystem'
import type { GitBridge } from './git'
import type { TerminalBridge } from './terminal'
import type { ApplyShellThemePayload } from './themes'
import type { SettingsBridge } from './settings'
import type { WorkspaceStateBridge } from './workspace-state'
import type { CommandId } from './commands'

export type MenuCommandListener = (commandId: CommandId) => void
export type MenuCommandUnsubscribe = () => void

export interface MenuBridge {
  onExecuteCommand(listener: MenuCommandListener): MenuCommandUnsubscribe
}

export interface ThemeBridge {
  applyShell(payload: ApplyShellThemePayload): Promise<void>
}

export interface AppearanceBridge {
  setZoomFactor(factor: number): Promise<void>
}

export interface WindowBridge {
  newWindow(): Promise<void>
  exit(): Promise<void>
  toggleFullScreen(): Promise<void>
}

export interface DeadeyeAPI {
  readonly version: string
  readonly platform: NodeJS.Platform
  readonly filesystem: FileSystemBridge
  readonly terminal: TerminalBridge
  readonly menu: MenuBridge
  readonly window: WindowBridge
  readonly settings: SettingsBridge
  readonly theme: ThemeBridge
  readonly appearance: AppearanceBridge
  readonly extensions: ExtensionsBridge
  readonly git: GitBridge
  readonly workspaceState: WorkspaceStateBridge
}
