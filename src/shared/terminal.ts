export type TerminalShell = 'powershell' | 'cmd'

export interface CreateTerminalOptions {
  readonly shell?: TerminalShell
  readonly cwd?: string
}

export interface CreateTerminalResult {
  readonly id: string
  readonly shell: TerminalShell
}

export interface TerminalDataEvent {
  readonly id: string
  readonly data: string
}

export interface TerminalExitEvent {
  readonly id: string
  readonly code: number | null
}

export type TerminalDataListener = (event: TerminalDataEvent) => void
export type TerminalExitListener = (event: TerminalExitEvent) => void
export type TerminalUnsubscribe = () => void

export interface TerminalBridge {
  create(options?: CreateTerminalOptions): Promise<CreateTerminalResult>
  write(id: string, data: string): Promise<void>
  resize(id: string, cols: number, rows: number): Promise<void>
  kill(id: string): Promise<void>
  onData(listener: TerminalDataListener): TerminalUnsubscribe
  onExit(listener: TerminalExitListener): TerminalUnsubscribe
}
