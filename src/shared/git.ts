export type GitFileStatus = 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked' | 'conflicted'

export interface GitChangedFile {
  readonly path: string
  readonly status: GitFileStatus
  readonly staged: boolean
}

export interface GitBranchInfo {
  readonly name: string
  readonly current: boolean
  readonly upstream: string | null
}

export interface GitRepositoryStatus {
  readonly root: string
  readonly branch: string | null
  readonly files: readonly GitChangedFile[]
  readonly branches: readonly GitBranchInfo[]
  readonly isRepository: boolean
}

export interface GitCommitOptions {
  readonly message: string
}

export interface GitDiffResult {
  readonly path: string
  readonly diff: string
}

export interface GitBridge {
  findRepository(startPath: string): Promise<string | null>
  getStatus(repositoryRoot: string): Promise<GitRepositoryStatus>
  stageFile(repositoryRoot: string, filePath: string): Promise<void>
  unstageFile(repositoryRoot: string, filePath: string): Promise<void>
  commit(repositoryRoot: string, options: GitCommitOptions): Promise<void>
  getDiff(repositoryRoot: string, filePath: string): Promise<GitDiffResult>
}
