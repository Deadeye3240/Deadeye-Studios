import { ipcMain } from 'electron'
import type { GitCommitOptions, GitDiffResult, GitRepositoryStatus } from '../../shared/git'
import { GIT_IPC_CHANNELS } from '../../shared/ipc-channels'
import {
  commitGitRepository,
  findGitRepository,
  getGitDiff,
  getGitStatus,
  stageGitFile,
  unstageGitFile,
} from './git-service'

export function registerGitIpcHandlers(): void {
  ipcMain.handle(
    GIT_IPC_CHANNELS.findRepository,
    async (_event, startPath: string): Promise<string | null> => {
      if (typeof startPath !== 'string' || !startPath.trim()) {
        throw new Error('findRepository requires a start path')
      }

      return findGitRepository(startPath)
    },
  )

  ipcMain.handle(
    GIT_IPC_CHANNELS.getStatus,
    async (_event, repositoryRoot: string): Promise<GitRepositoryStatus> => {
      if (typeof repositoryRoot !== 'string' || !repositoryRoot.trim()) {
        throw new Error('getStatus requires a repository root')
      }

      return getGitStatus(repositoryRoot)
    },
  )

  ipcMain.handle(
    GIT_IPC_CHANNELS.stageFile,
    async (_event, repositoryRoot: string, filePath: string): Promise<void> => {
      await stageGitFile(repositoryRoot, filePath)
    },
  )

  ipcMain.handle(
    GIT_IPC_CHANNELS.unstageFile,
    async (_event, repositoryRoot: string, filePath: string): Promise<void> => {
      await unstageGitFile(repositoryRoot, filePath)
    },
  )

  ipcMain.handle(
    GIT_IPC_CHANNELS.commit,
    async (_event, repositoryRoot: string, options: GitCommitOptions): Promise<void> => {
      if (!options?.message?.trim()) {
        throw new Error('commit requires a non-empty message')
      }

      await commitGitRepository(repositoryRoot, options.message.trim())
    },
  )

  ipcMain.handle(
    GIT_IPC_CHANNELS.getDiff,
    async (_event, repositoryRoot: string, filePath: string): Promise<GitDiffResult> => {
      return getGitDiff(repositoryRoot, filePath)
    },
  )
}
