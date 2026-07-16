export function createCrosshairLogoMarkup(className = 'deadeye-logo'): string {
  return `
    <svg class="${className}" viewBox="0 0 96 96" width="96" height="96" aria-hidden="true" focusable="false">
      <circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35"/>
      <circle cx="48" cy="48" r="28" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.55"/>
      <circle cx="48" cy="48" r="12" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.75"/>
      <line x1="48" y1="8" x2="48" y2="88" stroke="currentColor" stroke-width="1.5" opacity="0.45"/>
      <line x1="8" y1="48" x2="88" y2="48" stroke="currentColor" stroke-width="1.5" opacity="0.45"/>
      <circle cx="48" cy="48" r="4" fill="#ff3b5c"/>
    </svg>
  `
}
