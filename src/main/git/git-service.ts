import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'
import type {
  GitBranchInfo,
  GitChangedFile,
  GitDiffResult,
  GitFileStatus,
  GitRepositoryStatus,
} from '../../shared/git'

const execFileAsync = promisify(execFile)

export async function findGitRepository(startPath: string): Promise<string | null> {
  const normalized = path.normalize(startPath)

  try {
    const result = await runGit(normalized, ['rev-parse', '--show-toplevel'])
    return result.trim().replace(/\\/g, '/')
  } catch {
    return null
  }
}

export async function getGitStatus(repositoryRoot: string): Promise<GitRepositoryStatus> {
  const root = path.normalize(repositoryRoot)

  try {
    const branchResult = await runGit(root, ['branch', '--show-current'])
    const branch = branchResult.trim() || null

    const statusResult = await runGit(root, ['status', '--porcelain', '-b'])
    const files = parsePorcelainStatus(statusResult)

    const branchesResult = await runGit(root, ['branch', '-vv'])
    const branches = parseBranches(branchesResult, branch)

    return {
      root: root.replace(/\\/g, '/'),
      branch,
      files,
      branches,
      isRepository: true,
    }
  } catch {
    return {
      root: root.replace(/\\/g, '/'),
      branch: null,
      files: [],
      branches: [],
      isRepository: false,
    }
  }
}

export async function stageGitFile(repositoryRoot: string, filePath: string): Promise<void> {
  await runGit(path.normalize(repositoryRoot), ['add', '--', toNativePath(filePath)])
}

export async function unstageGitFile(repositoryRoot: string, filePath: string): Promise<void> {
  await runGit(path.normalize(repositoryRoot), ['restore', '--staged', '--', toNativePath(filePath)])
}

export async function commitGitRepository(
  repositoryRoot: string,
  message: string,
): Promise<void> {
  await runGit(path.normalize(repositoryRoot), ['commit', '-m', message])
}

export async function getGitDiff(
  repositoryRoot: string,
  filePath: string,
): Promise<GitDiffResult> {
  const root = path.normalize(repositoryRoot)
  const nativePath = toNativePath(filePath)

  try {
    const staged = await runGit(root, ['diff', '--cached', '--', nativePath])
    if (staged.trim()) {
      return { path: filePath, diff: staged }
    }
  } catch {
    // Fall through to unstaged diff.
  }

  const unstaged = await runGit(root, ['diff', '--', nativePath])
  return { path: filePath, diff: unstaged }
}

async function runGit(cwd: string, args: string[]): Promise<string> {
  const result = await execFileAsync('git', args, {
    cwd,
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024,
  })

  return result.stdout
}

function parsePorcelainStatus(output: string): GitChangedFile[] {
  const lines = output.split('\n').filter((line) => line.trim().length > 0)
  const files: GitChangedFile[] = []

  for (const line of lines) {
    if (line.startsWith('##')) {
      continue
    }

    const indexStatus = line[0] ?? ' '
    const worktreeStatus = line[1] ?? ' '
    const filePath = line.slice(3).trim().replace(/\\/g, '/')

    if (!filePath) {
      continue
    }

    const staged = indexStatus !== ' ' && indexStatus !== '?'
    const status = mapGitStatus(indexStatus, worktreeStatus)

    files.push({
      path: filePath,
      status,
      staged,
    })
  }

  return files
}

function mapGitStatus(indexStatus: string, worktreeStatus: string): GitFileStatus {
  const code = indexStatus !== ' ' && indexStatus !== '?' ? indexStatus : worktreeStatus

  switch (code) {
    case 'A':
      return 'added'
    case 'D':
      return 'deleted'
    case 'R':
      return 'renamed'
    case 'U':
      return 'conflicted'
    case '?':
      return 'untracked'
  }

  return 'modified'
}

function parseBranches(output: string, currentBranch: string | null): GitBranchInfo[] {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const current = line.startsWith('*')
      const cleaned = line.replace(/^\*\s*/, '')
      const name = cleaned.split(/\s+/)[0] ?? cleaned
      const upstreamMatch = cleaned.match(/\[(.+)\]/)

      return {
        name,
        current: current || name === currentBranch,
        upstream: upstreamMatch?.[1] ?? null,
      }
    })
}

function toNativePath(filePath: string): string {
  return path.normalize(filePath)
}
