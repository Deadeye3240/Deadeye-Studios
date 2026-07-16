export function createToolbar(className?: string): HTMLElement {
  const toolbar = globalThis.document.createElement('div')
  toolbar.className = `deadeye-toolbar${className ? ` ${className}` : ''}`
  toolbar.setAttribute('role', 'toolbar')
  return toolbar
}
