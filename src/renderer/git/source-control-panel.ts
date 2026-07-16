import type { GitChangedFile } from '../../shared/git'
import { joinWorkspacePath } from '../workspace/path-utils'
import { getGitClient } from './git-client'

export interface SourceControlPanelCallbacks {
  readonly onOpenFile: (filePath: string) => void
  readonly onShowDiff: (filePath: string, diff: string) => void
  readonly onError: (message: string) => void
  readonly onStatusChanged: () => void
}

export class SourceControlPanel {
  private readonly root: HTMLElement
  private readonly branchLabel: HTMLElement
  private readonly fileList: HTMLElement
  private readonly commitInput: HTMLInputElement
  private readonly commitButton: HTMLButtonElement
  private readonly refreshButton: HTMLButtonElement
  private repositoryRoot: string | null = null
  private callbacks: SourceControlPanelCallbacks | null = null
  private currentBranch: string | null = null
  private changedFileCount = 0

  constructor(container: HTMLElement) {
    container.className = 'source-control-panel'
    container.innerHTML = `
      <div class="source-control-header">
        <div class="source-control-title">Source Control</div>
        <button type="button" class="source-control-refresh" title="Refresh">↻</button>
      </div>
      <div class="source-control-branch" id="sc-branch">No repository</div>
      <div class="source-control-files" role="list"></div>
      <div class="source-control-commit">
        <input class="source-control-commit-input" type="text" placeholder="Commit message" />
        <button type="button" class="source-control-commit-button">Commit</button>
      </div>
    `

    const branchLabel = container.querySelector<HTMLElement>('#sc-branch')
    const fileList = container.querySelector<HTMLElement>('.source-control-files')
    const commitInput = container.querySelector<HTMLInputElement>('.source-control-commit-input')
    const commitButton = container.querySelector<HTMLButtonElement>('.source-control-commit-button')
    const refreshButton = container.querySelector<HTMLButtonElement>('.source-control-refresh')

    if (!branchLabel || !fileList || !commitInput || !commitButton || !refreshButton) {
      throw new Error('Failed to mount source control panel')
    }

    this.root = container
    this.branchLabel = branchLabel
    this.fileList = fileList
    this.commitInput = commitInput
    this.commitButton = commitButton
    this.refreshButton = refreshButton

    refreshButton.addEventListener('click', () => {
      void this.refresh()
    })

    commitButton.addEventListener('click', () => {
      void this.handleCommit()
    })
  }

  setCallbacks(callbacks: SourceControlPanelCallbacks): void {
    this.callbacks = callbacks
  }

  getStatusBarLabel(): string {
    if (!this.repositoryRoot) {
      return 'No repo'
    }

    if (!this.currentBranch) {
      return 'Git'
    }

    if (this.changedFileCount > 0) {
      return `${this.currentBranch}* (${this.changedFileCount})`
    }

    return this.currentBranch
  }

  getStatusBarTitle(): string {
    if (!this.repositoryRoot) {
      return 'No git repository in workspace'
    }

    if (!this.currentBranch) {
      return 'Git repository detected'
    }

    return this.changedFileCount > 0
      ? `${this.currentBranch} — ${this.changedFileCount} changed file(s)`
      : `${this.currentBranch} — clean working tree`
  }

  async bindWorkspaceRoot(workspaceRoot: string | null): Promise<void> {
    if (!workspaceRoot) {
      this.repositoryRoot = null
      this.currentBranch = null
      this.changedFileCount = 0
      this.branchLabel.textContent = 'No repository'
      this.fileList.replaceChildren()
      this.callbacks?.onStatusChanged()
      return
    }

    try {
      this.repositoryRoot = await getGitClient().findRepository(workspaceRoot)
      await this.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.callbacks?.onError(message)
    }
  }

  async refresh(): Promise<void> {
    if (!this.repositoryRoot) {
      this.currentBranch = null
      this.changedFileCount = 0
      this.branchLabel.textContent = 'No repository'
      this.fileList.replaceChildren()
      this.callbacks?.onStatusChanged()
      return
    }

    try {
      const status = await getGitClient().getStatus(this.repositoryRoot)
      this.currentBranch = status.branch
      this.changedFileCount = status.files.length
      this.branchLabel.textContent = status.branch ? `Branch: ${status.branch}` : 'Detached HEAD'
      this.renderFiles(status.files)
      this.callbacks?.onStatusChanged()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.callbacks?.onError(message)
    }
  }

  dispose(): void {
    this.root.replaceChildren()
  }

  private renderFiles(files: readonly GitChangedFile[]): void {
    this.fileList.replaceChildren()

    if (files.length === 0) {
      const empty = globalThis.document.createElement('div')
      empty.className = 'source-control-empty'
      empty.textContent = 'No changes detected.'
      this.fileList.append(empty)
      return
    }

    for (const file of files) {
      const item = globalThis.document.createElement('div')
      item.className = 'source-control-file'
      item.dataset.path = file.path

      const status = globalThis.document.createElement('span')
      status.className = `source-control-status source-control-status--${file.status}`
      status.textContent = file.staged ? `S ${file.status[0]?.toUpperCase() ?? '?'}` : file.status[0]?.toUpperCase() ?? '?'

      const label = globalThis.document.createElement('button')
      label.type = 'button'
      label.className = 'source-control-file-label'
      label.textContent = file.path.split('/').pop() ?? file.path
      label.title = file.path
      label.addEventListener('click', () => {
        if (!this.repositoryRoot) {
          return
        }

        this.callbacks?.onOpenFile(joinWorkspacePath(this.repositoryRoot, file.path))
      })

      const diffButton = globalThis.document.createElement('button')
      diffButton.type = 'button'
      diffButton.className = 'source-control-file-action'
      diffButton.textContent = 'Diff'
      diffButton.addEventListener('click', () => {
        void this.showDiff(file.path)
      })

      const stageButton = globalThis.document.createElement('button')
      stageButton.type = 'button'
      stageButton.className = 'source-control-file-action'
      stageButton.textContent = file.staged ? 'Unstage' : 'Stage'
      stageButton.addEventListener('click', () => {
        void this.toggleStage(file)
      })

      const actions = globalThis.document.createElement('div')
      actions.className = 'source-control-file-actions'
      actions.append(diffButton, stageButton)

      item.append(status, label, actions)
      this.fileList.append(item)
    }
  }

  private async toggleStage(file: GitChangedFile): Promise<void> {
    if (!this.repositoryRoot) {
      return
    }

    try {
      if (file.staged) {
        await getGitClient().unstageFile(this.repositoryRoot, file.path)
      } else {
        await getGitClient().stageFile(this.repositoryRoot, file.path)
      }

      await this.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.callbacks?.onError(message)
    }
  }

  private async showDiff(filePath: string): Promise<void> {
    if (!this.repositoryRoot) {
      return
    }

    try {
      const result = await getGitClient().getDiff(this.repositoryRoot, filePath)
      this.callbacks?.onShowDiff(filePath, result.diff || 'No diff available.')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.callbacks?.onError(message)
    }
  }

  private async handleCommit(): Promise<void> {
    if (!this.repositoryRoot) {
      return
    }

    const message = this.commitInput.value.trim()
    if (!message) {
      this.callbacks?.onError('Commit message is required.')
      return
    }

    try {
      await getGitClient().commit(this.repositoryRoot, message)
      this.commitInput.value = ''
      await this.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.callbacks?.onError(message)
    }
  }
}
