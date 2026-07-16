/**
 * Monaco worker environment configuration.
 *
 * Must be evaluated before any Monaco editor APIs create web workers.
 * This module is the single entry point for importing Monaco in the renderer.
 */

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

type MonacoGlobal = typeof globalThis & {
  MonacoEnvironment?: {
    getWorker: (workerId: string, label: string) => Worker
  }
}

function configureMonacoWorkers(): void {
  const globalScope = self as MonacoGlobal

  if (globalScope.MonacoEnvironment) {
    return
  }

  globalScope.MonacoEnvironment = {
    getWorker(_workerId: string, label: string): Worker {
      switch (label) {
        case 'json':
          return new jsonWorker()
        case 'css':
        case 'scss':
        case 'less':
          return new cssWorker()
        case 'html':
        case 'handlebars':
        case 'razor':
          return new htmlWorker()
        case 'typescript':
        case 'javascript':
          return new tsWorker()
        default:
          return new editorWorker()
      }
    },
  }
}

configureMonacoWorkers()

export * as monaco from 'monaco-editor'

export function isMonacoWorkerEnvironmentConfigured(): boolean {
  return Boolean((self as MonacoGlobal).MonacoEnvironment)
}
