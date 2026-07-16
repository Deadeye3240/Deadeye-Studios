import type { GitDiffResult, GitRepositoryStatus } from '../../shared/git'

function getBridge() {
  if (!window.deadeye?.git) {
    throw new Error('Deadeye git bridge is unavailable')
  }

  return window.deadeye.git
}

export class GitClient {
  findRepository(startPath: string): Promise<string | null> {
    return getBridge().findRepository(startPath)
  }

  getStatus(repositoryRoot: string): Promise<GitRepositoryStatus> {
    return getBridge().getStatus(repositoryRoot)
  }

  stageFile(repositoryRoot: string, filePath: string): Promise<void> {
    return getBridge().stageFile(repositoryRoot, filePath)
  }

  unstageFile(repositoryRoot: string, filePath: string): Promise<void> {
    return getBridge().unstageFile(repositoryRoot, filePath)
  }

  commit(repositoryRoot: string, message: string): Promise<void> {
    return getBridge().commit(repositoryRoot, { message })
  }

  getDiff(repositoryRoot: string, filePath: string): Promise<GitDiffResult> {
    return getBridge().getDiff(repositoryRoot, filePath)
  }
}

let gitClient: GitClient | null = null

export function getGitClient(): GitClient {
  if (!gitClient) {
    gitClient = new GitClient()
  }

  return gitClient
}
