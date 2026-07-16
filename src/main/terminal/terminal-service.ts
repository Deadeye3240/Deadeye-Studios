import { randomUUID } from 'node:crypto'
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import type {
  CreateTerminalOptions,
  CreateTerminalResult,
  TerminalShell,
} from '../../shared/terminal'

interface TerminalSession {
  readonly id: string
  readonly shell: TerminalShell
  readonly process: ChildProcessWithoutNullStreams
}

const sessions = new Map<string, TerminalSession>()

export type TerminalDataCallback = (id: string, data: string) => void
export type TerminalExitCallback = (id: string, code: number | null) => void

let dataCallback: TerminalDataCallback | null = null
let exitCallback: TerminalExitCallback | null = null

export function setTerminalCallbacks(
  onData: TerminalDataCallback,
  onExit: TerminalExitCallback,
): void {
  dataCallback = onData
  exitCallback = onExit
}

export function createTerminal(options: CreateTerminalOptions = {}): CreateTerminalResult {
  const shell = options.shell ?? (process.platform === 'win32' ? 'powershell' : 'powershell')
  const id = randomUUID()
  const cwd = options.cwd ?? process.cwd()

  const shellCommand = resolveShellCommand(shell)
  const child = spawn(shellCommand.executable, shellCommand.args, {
    cwd,
    env: process.env,
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  const session: TerminalSession = { id, shell, process: child }
  sessions.set(id, session)

  child.stdout.on('data', (chunk: Buffer) => {
    dataCallback?.(id, chunk.toString('utf8'))
  })

  child.stderr.on('data', (chunk: Buffer) => {
    dataCallback?.(id, chunk.toString('utf8'))
  })

  child.on('exit', (code) => {
    sessions.delete(id)
    exitCallback?.(id, code)
  })

  child.on('error', (error) => {
    dataCallback?.(id, `\r\n[Terminal error] ${error.message}\r\n`)
  })

  return { id, shell }
}

export function writeTerminal(id: string, data: string): void {
  const session = sessions.get(id)
  if (!session) {
    throw new Error(`Terminal session not found: ${id}`)
  }

  session.process.stdin.write(data)
}

export function resizeTerminal(_id: string, _cols: number, _rows: number): void {
  // child_process shells on Windows do not support PTY resize without node-pty.
}

export function killTerminal(id: string): void {
  const session = sessions.get(id)
  if (!session) {
    return
  }

  session.process.kill()
  sessions.delete(id)
}

export function disposeAllTerminals(): void {
  for (const id of sessions.keys()) {
    killTerminal(id)
  }
}

function resolveShellCommand(shell: TerminalShell): { executable: string; args: string[] } {
  if (shell === 'cmd') {
    return { executable: 'cmd.exe', args: ['/Q', '/K'] }
  }

  return {
    executable: 'powershell.exe',
    args: ['-NoLogo', '-NoExit'],
  }
}
