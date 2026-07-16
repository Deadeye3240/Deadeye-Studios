import { APP_NAME, APP_VERSION } from '../../shared/version'
import { createCrosshairLogoMarkup } from '../ui/brand-logo'

/**
 * Full-window startup overlay. Mounts on document.body so it survives shell creation.
 */
export class LoadingScreen {
  private readonly overlay: HTMLElement

  constructor() {
    this.overlay = globalThis.document.createElement('div')
    this.overlay.className = 'loading-screen'
    this.overlay.setAttribute('role', 'status')
    this.overlay.setAttribute('aria-live', 'polite')
    this.overlay.innerHTML = `
      <div class="loading-screen__content">
        ${createCrosshairLogoMarkup('loading-screen__logo')}
        <div class="loading-screen__title">${APP_NAME}</div>
        <div class="loading-screen__status">Starting workspace...</div>
        <div class="loading-screen__bar" aria-hidden="true"><span></span></div>
        <div class="loading-screen__version">v${APP_VERSION}</div>
      </div>
    `
    globalThis.document.body.append(this.overlay)
  }

  setStatus(message: string): void {
    const status = this.overlay.querySelector<HTMLElement>('.loading-screen__status')
    if (status) {
      status.textContent = message
    }
  }

  hide(): void {
    this.overlay.classList.add('loading-screen--hidden')
    globalThis.setTimeout(() => {
      this.overlay.remove()
    }, 260)
  }
}
