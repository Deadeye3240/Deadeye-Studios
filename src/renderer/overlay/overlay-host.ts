/**
 * Top-level overlay mount point on document.body.
 * Keeps modals and panels above the app shell and outside nested stacking contexts.
 */
export function getOverlayHost(): HTMLElement {
  const existing = globalThis.document.getElementById('deadeye-overlay-host')
  if (existing instanceof HTMLElement) {
    return existing
  }

  const host = globalThis.document.createElement('div')
  host.id = 'deadeye-overlay-host'
  host.className = 'deadeye-overlay-host'
  globalThis.document.body.append(host)
  return host
}
