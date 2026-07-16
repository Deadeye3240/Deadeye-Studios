const STORAGE_KEY = 'deadeye.recentFiles'
const MAX_RECENT = 20

export function recordRecentFile(filePath: string): void {
  const recent = getRecentFiles().filter((entry) => entry !== filePath)
  recent.unshift(filePath)

  const trimmed = recent.slice(0, MAX_RECENT)

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // Ignore storage failures.
  }
}

export function getRecentFiles(): string[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((entry): entry is string => typeof entry === 'string')
  } catch {
    return []
  }
}
