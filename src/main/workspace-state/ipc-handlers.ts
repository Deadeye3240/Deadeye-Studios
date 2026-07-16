import { ipcMain } from 'electron'
import type { LastSessionSnapshot, WorkspaceStateSnapshot } from '../../shared/workspace-state'
import { WORKSPACE_STATE_IPC_CHANNELS } from '../../shared/ipc-channels'
import {
  clearLastSession,
  loadWorkspaceState,
  recordRecentFile,
  recordRecentProject,
  saveLastSession,
} from './workspace-state-service'

export function registerWorkspaceStateIpcHandlers(): void {
  void loadWorkspaceState()

  ipcMain.handle(WORKSPACE_STATE_IPC_CHANNELS.get, async (): Promise<WorkspaceStateSnapshot> => {
    return loadWorkspaceState()
  })

  ipcMain.handle(
    WORKSPACE_STATE_IPC_CHANNELS.recordProject,
    async (_event, projectPath: string): Promise<WorkspaceStateSnapshot> => {
      return recordRecentProject(projectPath)
    },
  )

  ipcMain.handle(
    WORKSPACE_STATE_IPC_CHANNELS.recordFile,
    async (_event, filePath: string): Promise<WorkspaceStateSnapshot> => {
      return recordRecentFile(filePath)
    },
  )

  ipcMain.handle(
    WORKSPACE_STATE_IPC_CHANNELS.saveSession,
    async (_event, snapshot: LastSessionSnapshot): Promise<WorkspaceStateSnapshot> => {
      return saveLastSession(snapshot)
    },
  )

  ipcMain.handle(WORKSPACE_STATE_IPC_CHANNELS.clearSession, async (): Promise<WorkspaceStateSnapshot> => {
    return clearLastSession()
  })
}
