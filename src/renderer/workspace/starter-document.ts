import type { CreateDocumentOptions } from './types'

export const STARTER_FILE_PATH = 'workspace/welcome.ts'

export const STARTER_DOCUMENT_CONTENT = `/**
 * Deadeye Studio
 *
 * Precision. Focus. Control.
 *
 * This is your starter workspace document.
 * Open a folder in the explorer to work with project files.
 */

interface DeadeyeMission {
  readonly codename: string
  readonly objective: string
  readonly status: 'active' | 'complete' | 'standby'
}

const mission: DeadeyeMission = {
  codename: 'FOUNDATION',
  objective: 'Establish a secure, high-performance editing core',
  status: 'active',
}

function reportMissionStatus(target: DeadeyeMission): string {
  const prefix = target.status === 'active' ? '>>' : '::'
  return \`\${prefix} [\${target.codename}] \${target.objective}\`
}

console.log(reportMissionStatus(mission))

export { mission, reportMissionStatus }
`

export function createStarterDocumentOptions(): CreateDocumentOptions {
  return {
    filePath: STARTER_FILE_PATH,
    language: 'typescript',
    content: STARTER_DOCUMENT_CONTENT,
    activate: true,
  }
}
